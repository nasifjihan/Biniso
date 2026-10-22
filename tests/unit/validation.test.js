import { describe, expect, it } from "vitest";
import { BD_PHONE, parseCheckoutForm } from "@/lib/validation";
import { addressKey, parseAddressForm } from "@/lib/addresses";
import { parseCredentials } from "@/lib/auth";
import { parseCouponForm } from "@/lib/coupons";
import { describeZone, parseShippingZoneForm } from "@/lib/shipping";

const validCheckout = {
  name: "Rahim Uddin",
  phone: "01712345678",
  email: "",
  city: "Dhaka",
  address: "House 12, Road 4, Banani",
  notes: "",
  delivery_method: "inside-dhaka",
};

describe("parseCheckoutForm", () => {
  it("accepts a complete form and turns empty optional fields into null", () => {
    const result = parseCheckoutForm(validCheckout);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      name: "Rahim Uddin",
      phone: "01712345678",
      email: null,
      city: "Dhaka",
      address: "House 12, Road 4, Banani",
      notes: null,
      delivery_method: "inside-dhaka",
    });
  });

  it("reads a FormData submission as well as a plain object", () => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(validCheckout)) {
      formData.set(key, value);
    }

    expect(parseCheckoutForm(formData)).toMatchObject({
      success: true,
      data: { name: "Rahim Uddin", delivery_method: "inside-dhaka" },
    });
  });

  it("trims the values the customer typed", () => {
    const result = parseCheckoutForm({ ...validCheckout, name: "  Rahim Uddin  " });

    expect(result.data.name).toBe("Rahim Uddin");
  });

  it("reports every bad field against its own input", () => {
    const result = parseCheckoutForm({
      ...validCheckout,
      name: "R",
      phone: "12345",
      address: "short",
      delivery_method: "",
    });

    expect(result.success).toBe(false);
    expect(Object.keys(result.fieldErrors).sort()).toEqual([
      "address",
      "delivery_method",
      "name",
      "phone",
    ]);
    // The summary is the first problem, so the banner and the field agree.
    expect(result.error).toBe(result.fieldErrors.name);
  });

  it.each([
    ["+8801712345678", true],
    ["8801712345678", true],
    ["01712345678", true],
    ["0171234567", false],
    ["01212345678", false],
    ["017123456789", false],
  ])("treats %s as a Bangladeshi mobile number: %s", (phone, expected) => {
    expect(BD_PHONE.test(phone)).toBe(expected);
  });
});

describe("parseAddressForm", () => {
  it("accepts the same values checkout accepts", () => {
    const result = parseAddressForm({
      label: "Home",
      name: "Rahim Uddin",
      phone: "01712345678",
      address: "House 12, Road 4, Banani",
      city: "Dhaka",
    });

    expect(result.success).toBe(true);
    expect(result.data.label).toBe("Home");
  });

  it("turns a blank label and city into null", () => {
    const result = parseAddressForm({
      label: "",
      name: "Rahim Uddin",
      phone: "01712345678",
      address: "House 12, Road 4, Banani",
      city: "",
    });

    expect(result.data).toMatchObject({ label: null, city: null });
  });

  it("rejects a mobile number that is not Bangladeshi", () => {
    const result = parseAddressForm({
      label: "",
      name: "Rahim Uddin",
      phone: "1234567890",
      address: "House 12, Road 4, Banani",
      city: "Dhaka",
    });

    expect(result.success).toBe(false);
    expect(result.fieldErrors.phone).toMatch(/valid mobile number/i);
  });
});

describe("addressKey", () => {
  it("ignores case, padding and repeated spaces, so the same address saves once", () => {
    const a = addressKey({
      name: "Rahim  Uddin",
      phone: "01712345678",
      address: "House 12,  Road 4",
      city: "Dhaka",
    });
    const b = addressKey({
      name: "  rahim uddin ",
      phone: "01712345678",
      address: "house 12, road 4",
      city: "dhaka",
    });

    expect(a).toBe(b);
  });

  it("separates two different addresses", () => {
    const base = {
      name: "Rahim Uddin",
      phone: "01712345678",
      address: "House 12, Road 4",
      city: "Dhaka",
    };

    expect(addressKey(base)).not.toBe(
      addressKey({ ...base, address: "House 13, Road 4" }),
    );
  });

  it("treats a missing city as an empty one", () => {
    const base = {
      name: "Rahim Uddin",
      phone: "01712345678",
      address: "House 12, Road 4",
    };

    expect(addressKey(base)).toBe(addressKey({ ...base, city: null }));
  });
});

describe("parseCredentials", () => {
  it("trims the email but keeps the password exactly as typed", () => {
    const result = parseCredentials({
      email: "  buyer@example.com ",
      password: " correct horse ",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      email: "buyer@example.com",
      password: " correct horse ",
    });
  });

  it("rejects a password under eight characters", () => {
    const result = parseCredentials({ email: "buyer@example.com", password: "short" });

    expect(result.success).toBe(false);
    expect(result.fieldErrors.password).toMatch(/8 characters/);
  });

  it("rejects a password past bcrypt's 72-byte limit instead of truncating it", () => {
    const result = parseCredentials({
      email: "buyer@example.com",
      password: "x".repeat(73),
    });

    expect(result.success).toBe(false);
    expect(result.fieldErrors.password).toMatch(/72 characters/);
  });

  it("rejects a malformed email", () => {
    const result = parseCredentials({ email: "not-an-email", password: "longenough" });

    expect(result.success).toBe(false);
    expect(result.fieldErrors.email).toMatch(/valid email/i);
  });
});

describe("parseCouponForm", () => {
  const valid = {
    code: "eid 25",
    type: "percent",
    value: "15",
    min_order: "1000",
    usage_limit: "50",
    expires_at: "2026-12-31",
  };

  it("upper-cases and strips spaces from the code", () => {
    const result = parseCouponForm(valid);

    expect(result.ok).toBe(true);
    expect(result.data.code).toBe("EID25");
    expect(result.data.value).toBe(15);
    expect(result.data.min_order).toBe(1000);
    expect(result.data.usage_limit).toBe(50);
  });

  it("stops a code at the end of the day it expires", () => {
    const { data } = parseCouponForm(valid);
    const expiresAt = new Date(data.expires_at);

    expect(expiresAt.getDate()).toBe(31);
    expect(expiresAt.getHours()).toBe(23);
    expect(expiresAt.getMinutes()).toBe(59);
  });

  it("treats a blank usage limit as unlimited", () => {
    const { data } = parseCouponForm({ ...valid, usage_limit: "" });

    expect(data.usage_limit).toBeNull();
  });

  it("refuses a percentage above 100", () => {
    expect(parseCouponForm({ ...valid, value: "120" })).toEqual({
      ok: false,
      error: "A percentage discount cannot exceed 100%.",
    });
  });

  it("refuses a missing code and an unknown type", () => {
    expect(parseCouponForm({ ...valid, code: "   " }).ok).toBe(false);
    expect(parseCouponForm({ ...valid, type: "bogus" }).ok).toBe(false);
  });
});

describe("parseShippingZoneForm", () => {
  it("derives the code from the name, which orders then store", () => {
    const result = parseShippingZoneForm({ name: "Inside Dhaka", fee: "60" });

    expect(result).toEqual({
      ok: true,
      data: { code: "inside-dhaka", name: "Inside Dhaka", fee: 60 },
    });
  });

  it("allows a free option such as pickup", () => {
    expect(parseShippingZoneForm({ name: "Pickup", fee: "0" }).data.fee).toBe(0);
  });

  it("refuses a name that is too short, a negative fee and a blank fee", () => {
    expect(parseShippingZoneForm({ name: "D", fee: "60" }).ok).toBe(false);
    expect(parseShippingZoneForm({ name: "Inside Dhaka", fee: "-1" }).ok).toBe(false);
    // A blank field must not quietly become free delivery; 0 has to be typed.
    expect(parseShippingZoneForm({ name: "Inside Dhaka", fee: "" }).ok).toBe(false);
  });

  it("reads a zone as name and fee at checkout", () => {
    expect(describeZone({ name: "Inside Dhaka", fee: 60 })).toBe("Inside Dhaka (৳ 60)");
  });
});
