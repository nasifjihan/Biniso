import { beforeEach, describe, expect, it, vi } from "vitest";

// createOrder talks to Supabase, Resend, the request headers and the rate
// limiter. Everything below stands in for those, so the test exercises the
// action's own pricing, reservation and rollback logic.
const state = vi.hoisted(() => ({
  client: null,
  user: null,
  rateLimited: false,
  failOrderEmail: false,
  sends: { order: [], confirmation: [], lowStock: [] },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => state.client,
}));

vi.mock("@/lib/supabase/server", () => ({
  getUser: async () => state.user,
}));

vi.mock("@/lib/email", () => ({
  sendOrderEmail: async (order) => {
    if (state.failOrderEmail) throw new Error("smtp down");
    state.sends.order.push(order);
  },
  sendOrderConfirmation: async (order) => {
    state.sends.confirmation.push(order);
  },
  sendLowStockEmail: async (items) => {
    state.sends.lowStock.push(items);
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Map([["x-forwarded-for", "203.0.113.7, 10.0.0.1"]]),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: () =>
    state.rateLimited ? { ok: false, retryAfterMs: 1000 } : { ok: true },
}));

const { createOrder } = await import("@/app/actions/createOrder");

/**
 * A stand-in for the Supabase client. `tables` maps a table name to the reply
 * for its first query, or to an array of replies when the action queries the
 * same table twice (products and product_variants both are).
 */
function makeClient({ tables = {}, rpc = {} } = {}) {
  const counters = {};
  const calls = [];

  return {
    calls,
    from(table) {
      const query = { table, op: "select", payload: null };

      const run = async () => {
        counters[table] = (counters[table] ?? 0) + 1;
        calls.push({ table, op: query.op, payload: query.payload });

        const scripted = tables[table];
        const reply = Array.isArray(scripted) ? scripted[counters[table] - 1] : scripted;
        return reply ?? { data: null, error: null };
      };

      const api = {
        select: () => api,
        insert: (payload) => {
          query.op = "insert";
          query.payload = payload;
          return api;
        },
        update: (payload) => {
          query.op = "update";
          query.payload = payload;
          return api;
        },
        delete: () => {
          query.op = "delete";
          return api;
        },
        eq: () => api,
        neq: () => api,
        in: () => api,
        not: () => api,
        lte: () => api,
        gte: () => api,
        order: () => api,
        limit: () => api,
        range: () => api,
        single: run,
        maybeSingle: run,
        then: (onFulfilled, onRejected) => run().then(onFulfilled, onRejected),
      };

      return api;
    },
    rpc(name, args) {
      calls.push({ rpc: name, args });
      const reply = rpc[name];
      return Promise.resolve(
        typeof reply === "function" ? reply(args) : (reply ?? { data: null, error: null }),
      );
    },
  };
}

const ZONE = { data: { code: "inside-dhaka", name: "Inside Dhaka", fee: 60 }, error: null };
const MUG = { data: [{ id: "p1", name: "Mug", price: 500, stock: 10 }], error: null };
const ORDER = {
  data: { id: "order-1", status: "pending", total: 1060, customer_name: "Rahim Uddin" },
  error: null,
};

function checkoutForm(overrides = {}) {
  const values = {
    name: "Rahim Uddin",
    phone: "01712345678",
    email: "rahim@example.com",
    city: "Dhaka",
    address: "House 12, Road 4, Banani",
    notes: "",
    delivery_method: "inside-dhaka",
    ...overrides,
  };

  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

/** The payload createOrder handed to `order_items.insert`. */
const insertedItems = (client) =>
  client.calls.find((call) => call.table === "order_items" && call.op === "insert")?.payload;

/** The payload createOrder handed to `orders.insert`. */
const insertedOrder = (client) =>
  client.calls.find((call) => call.table === "orders" && call.op === "insert")?.payload?.[0];

const rpcCalls = (client) => client.calls.filter((call) => call.rpc).map((call) => call.rpc);

beforeEach(() => {
  state.user = null;
  state.rateLimited = false;
  state.failOrderEmail = false;
  state.sends = { order: [], confirmation: [], lowStock: [] };
  state.client = makeClient({
    tables: {
      shipping_zones: ZONE,
      products: [MUG, { data: [], error: null }],
      orders: ORDER,
      order_items: { error: null },
    },
    rpc: { decrement_stock: { error: null } },
  });
});

describe("createOrder", () => {
  it("prices the order from the database and returns the totals", async () => {
    const result = await createOrder(checkoutForm(), [{ id: "p1", quantity: 2 }]);

    expect(result).toEqual({
      ok: true,
      orderId: "order-1",
      subtotal: 1000,
      discount: 0,
      coupon_code: null,
      delivery_method: "inside-dhaka",
      delivery_name: "Inside Dhaka",
      delivery_fee: 60,
      total: 1060,
    });
  });

  it("stores the priced rows, not the client's numbers", async () => {
    const client = state.client;
    await createOrder(checkoutForm(), [{ id: "p1", quantity: 2, price: 1 }]);

    expect(insertedOrder(client)).toMatchObject({
      subtotal: 1000,
      delivery_fee: 60,
      total: 1060,
      status: "pending",
      user_id: null,
    });
    expect(insertedItems(client)).toEqual([
      {
        order_id: "order-1",
        product_id: "p1",
        variant_id: null,
        variant_label: null,
        quantity: 2,
        price: 500,
      },
    ]);
  });

  it("reserves the stock after saving the items", async () => {
    const client = state.client;
    await createOrder(checkoutForm(), [{ id: "p1", quantity: 2 }]);

    expect(client.calls).toContainEqual({
      rpc: "decrement_stock",
      args: { items: [{ product_id: "p1", variant_id: null, quantity: 2 }] },
    });
  });

  it("links the order to the signed-in customer taken from the session", async () => {
    state.user = { id: "user-1" };
    const client = state.client;
    await createOrder(checkoutForm(), [{ id: "p1", quantity: 1 }]);

    expect(insertedOrder(client).user_id).toBe("user-1");
  });

  it("emails the owner and the customer a receipt", async () => {
    const result = await createOrder(checkoutForm(), [{ id: "p1", quantity: 1 }]);

    expect(result).not.toHaveProperty("emailWarning");
    expect(state.sends.order).toHaveLength(1);
    expect(state.sends.confirmation).toHaveLength(1);
    expect(state.sends.order[0].delivery_name).toBe("Inside Dhaka");
  });

  it("still reports success when the receipt cannot be sent", async () => {
    state.failOrderEmail = true;
    const result = await createOrder(checkoutForm(), [{ id: "p1", quantity: 1 }]);

    expect(result.ok).toBe(true);
    expect(result.emailWarning).toBe("smtp down");
  });

  it("refuses a quantity the stock cannot cover, naming the product", async () => {
    state.client = makeClient({
      tables: {
        shipping_zones: ZONE,
        products: { data: [{ id: "p1", name: "Mug", price: 500, stock: 1 }], error: null },
      },
    });

    const result = await createOrder(checkoutForm(), [{ id: "p1", quantity: 2 }]);

    expect(result).toEqual({ ok: false, error: "Only 1 left of Mug." });
    expect(state.client.calls.some((call) => call.table === "orders")).toBe(false);
  });

  it("rejects a delivery option that is paused or invented", async () => {
    state.client = makeClient({ tables: { shipping_zones: { data: null, error: null } } });

    const result = await createOrder(checkoutForm({ delivery_method: "free-forever" }), [
      { id: "p1", quantity: 1 },
    ]);

    expect(result.ok).toBe(false);
    expect(result.fieldErrors.delivery_method).toBe("Choose a valid delivery option.");
  });

  it("rejects a honeypot submission before touching the database", async () => {
    const result = await createOrder(checkoutForm({ company: "spam bot" }), [
      { id: "p1", quantity: 1 },
    ]);

    expect(result).toEqual({ ok: false, error: "Invalid submission" });
    expect(state.client.calls).toHaveLength(0);
  });

  it("rejects an empty cart", async () => {
    expect(await createOrder(checkoutForm(), [])).toEqual({
      ok: false,
      error: "Cart is empty",
    });
  });

  it("refuses to check out while the visitor is rate limited", async () => {
    state.rateLimited = true;
    const result = await createOrder(checkoutForm(), [{ id: "p1", quantity: 1 }]);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/too many attempts/i);
    expect(state.client.calls).toHaveLength(0);
  });

  it("prices and reserves a variant line from the variant, not the product", async () => {
    const client = makeClient({
      tables: {
        shipping_zones: ZONE,
        products: [MUG, { data: [], error: null }],
        product_variants: [
          {
            data: [
              {
                id: "v1",
                product_id: "p1",
                attributes: { Size: "M" },
                sku: null,
                price: 750,
                stock: 5,
              },
            ],
            error: null,
          },
          { data: [], error: null },
        ],
        orders: ORDER,
        order_items: { error: null },
      },
      rpc: { decrement_stock: { error: null } },
    });
    state.client = client;

    const result = await createOrder(checkoutForm(), [
      { id: "p1", variantId: "v1", quantity: 1 },
    ]);

    expect(result.subtotal).toBe(750);
    expect(result.total).toBe(810);
    expect(insertedItems(client)[0]).toMatchObject({
      variant_id: "v1",
      variant_label: "M",
      price: 750,
    });
    expect(rpcCalls(client)).toContain("decrement_stock");
    expect(client.calls).toContainEqual({
      rpc: "decrement_stock",
      args: { items: [{ product_id: "p1", variant_id: "v1", quantity: 1 }] },
    });
  });
});

describe("createOrder · coupons", () => {
  const coupon = {
    code: "EID25",
    type: "percent",
    value: 10,
    min_order: 0,
    expires_at: null,
    usage_limit: null,
    used_count: 0,
    active: true,
  };

  function clientWithCoupon(redeemReply) {
    return makeClient({
      tables: {
        shipping_zones: ZONE,
        products: [MUG, { data: [], error: null }],
        coupons: { data: coupon, error: null },
        orders: ORDER,
        order_items: { error: null },
      },
      rpc: {
        decrement_stock: { error: null },
        redeem_coupon: redeemReply,
        restore_stock: { error: null },
      },
    });
  }

  it("applies the discount and claims one use of the code", async () => {
    const client = clientWithCoupon({ data: true, error: null });
    state.client = client;

    const result = await createOrder(checkoutForm({ coupon_code: "eid 25" }), [
      { id: "p1", quantity: 2 },
    ]);

    expect(result.discount).toBe(100);
    expect(result.coupon_code).toBe("EID25");
    expect(result.total).toBe(960);
    expect(client.calls).toContainEqual({
      rpc: "redeem_coupon",
      args: { coupon_code: "EID25" },
    });
    expect(insertedOrder(client)).toMatchObject({ discount: 100, coupon_code: "EID25" });
  });

  it("rejects an inactive or unknown code before any stock is reserved", async () => {
    state.client = makeClient({
      tables: {
        shipping_zones: ZONE,
        products: [MUG, { data: [], error: null }],
        coupons: { data: null, error: null },
      },
    });

    const result = await createOrder(checkoutForm({ coupon_code: "NOPE" }), [
      { id: "p1", quantity: 1 },
    ]);

    expect(result.ok).toBe(false);
    expect(result.fieldErrors.coupon_code).toMatch(/not valid/i);
    expect(rpcCalls(state.client)).not.toContain("decrement_stock");
  });

  it("rolls the order and the stock back when the code ran out mid-checkout", async () => {
    const client = clientWithCoupon({ data: false, error: null });
    state.client = client;

    const result = await createOrder(checkoutForm({ coupon_code: "EID25" }), [
      { id: "p1", quantity: 1 },
    ]);

    expect(result.ok).toBe(false);
    expect(result.fieldErrors.coupon_code).toMatch(/no longer available/i);
    expect(rpcCalls(client)).toContain("restore_stock");
    expect(
      client.calls.some((call) => call.table === "orders" && call.op === "delete"),
    ).toBe(true);
    expect(state.sends.order).toHaveLength(0);
  });
});

describe("createOrder · failed reservations", () => {
  const MUG_ID = "3f1c9b0e-1f5e-4a1a-9c3d-7b2e5a6f8d10";

  it("deletes the order and names the product the database refused", async () => {
    const client = makeClient({
      tables: {
        shipping_zones: ZONE,
        products: [
          { data: [{ id: MUG_ID, name: "Mug", price: 500, stock: 10 }], error: null },
          { data: [], error: null },
        ],
        orders: ORDER,
        order_items: { error: null },
      },
      // decrement_stock reports the uuid of the line that ran short.
      rpc: { decrement_stock: { error: { message: `insufficient_stock:${MUG_ID}` } } },
    });
    state.client = client;

    const result = await createOrder(checkoutForm(), [{ id: MUG_ID, quantity: 2 }]);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Mug just went out of stock. Please update your cart.");
    expect(
      client.calls.some((call) => call.table === "orders" && call.op === "delete"),
    ).toBe(true);
    expect(state.sends.order).toHaveLength(0);
  });

  it("falls back to a generic message when the short line cannot be identified", async () => {
    const client = makeClient({
      tables: {
        shipping_zones: ZONE,
        products: [MUG, { data: [], error: null }],
        orders: ORDER,
        order_items: { error: null },
      },
      rpc: { decrement_stock: { error: { message: "insufficient_stock" } } },
    });
    state.client = client;

    const result = await createOrder(checkoutForm(), [{ id: "p1", quantity: 2 }]);

    expect(result.error).toBe(
      "One of the products is no longer available in the requested quantity.",
    );
    expect(
      client.calls.some((call) => call.table === "orders" && call.op === "delete"),
    ).toBe(true);
  });

  it("drops the order when its items could not be saved", async () => {
    const client = makeClient({
      tables: {
        shipping_zones: ZONE,
        products: [MUG, { data: [], error: null }],
        orders: ORDER,
        order_items: { error: { message: "insert failed" } },
      },
    });
    state.client = client;

    const result = await createOrder(checkoutForm(), [{ id: "p1", quantity: 2 }]);

    expect(result).toEqual({ ok: false, error: "insert failed" });
    expect(
      client.calls.some((call) => call.table === "orders" && call.op === "delete"),
    ).toBe(true);
    expect(rpcCalls(client)).not.toContain("decrement_stock");
  });

  it("turns an unexpected throw into a failed checkout rather than a crash", async () => {
    state.client = { from: () => { throw new Error("network down"); } };

    const result = await createOrder(checkoutForm(), [{ id: "p1", quantity: 1 }]);

    expect(result).toEqual({ ok: false, error: "network down" });
  });
});

describe("createOrder · low-stock alert", () => {
  it("warns the owner once a sale leaves a tracked product at the threshold", async () => {
    state.client = makeClient({
      tables: {
        shipping_zones: ZONE,
        products: [
          MUG,
          { data: [{ name: "Mug", stock: 4 }], error: null },
        ],
        orders: ORDER,
        order_items: { error: null },
      },
      rpc: { decrement_stock: { error: null } },
    });

    await createOrder(checkoutForm(), [{ id: "p1", quantity: 2 }]);

    expect(state.sends.lowStock).toEqual([[{ name: "Mug", stock: 4 }]]);
  });

  it("stays silent when nothing ran low", async () => {
    await createOrder(checkoutForm(), [{ id: "p1", quantity: 1 }]);

    expect(state.sends.lowStock).toHaveLength(0);
  });

  it("never blocks the order when the alert cannot be sent", async () => {
    state.client = makeClient({
      tables: {
        shipping_zones: ZONE,
        products: [
          MUG,
          { data: [{ name: "Mug", stock: 1 }], error: null },
        ],
        orders: ORDER,
        order_items: { error: null },
      },
      rpc: { decrement_stock: { error: null } },
    });

    const result = await createOrder(checkoutForm(), [{ id: "p1", quantity: 1 }]);

    expect(result.ok).toBe(true);
  });
});
