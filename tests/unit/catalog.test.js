import { describe, expect, it } from "vitest";
import {
  attributeKeys,
  attributeValues,
  findVariant,
  formatOptions,
  isInStock,
  normaliseVariantInput,
  parseOptions,
  variantLabel,
} from "@/lib/variants";
import { parseFavoriteIds } from "@/lib/favorites";
import { STATUS_NOTES, orderStatusVariant } from "@/lib/orderStatus";
import { LOW_STOCK_THRESHOLD, isLowStock } from "@/lib/inventory";
import { csvFilename, csvResponse, toCsv } from "@/lib/csv";

describe("variant attributes", () => {
  it("parses the admin's shorthand into jsonb", () => {
    expect(parseOptions("Color=Red, Size=M")).toEqual({ Color: "Red", Size: "M" });
  });

  it("keeps an equals sign inside a value", () => {
    expect(parseOptions("Note=a=b")).toEqual({ Note: "a=b" });
  });

  it("drops half-written pairs instead of storing an empty attribute", () => {
    expect(parseOptions("Color=Red, Size, =M")).toEqual({ Color: "Red" });
  });

  it("round-trips through the admin form", () => {
    const attributes = { Color: "Red", Size: "M" };

    expect(parseOptions(formatOptions(attributes))).toEqual(attributes);
  });

  it("labels a variant the way the customer sees it", () => {
    expect(variantLabel({ attributes: { Color: "Red", Size: "M" } })).toBe("Red / M");
    expect(variantLabel({ attributes: {}, sku: "SKU-1" })).toBe("SKU-1");
    expect(variantLabel({})).toBe("Default");
  });
});

describe("variant selection", () => {
  const variants = [
    { id: "a", attributes: { Color: "Red", Size: "M" }, stock: 3 },
    { id: "b", attributes: { Color: "Red", Size: "L" }, stock: 0 },
    { id: "c", attributes: { Color: "Blue", Size: "M" }, stock: null },
  ];

  it("lists the attribute names in first-seen order", () => {
    expect(attributeKeys(variants)).toEqual(["Color", "Size"]);
  });

  it("lists each attribute's values without repeats", () => {
    expect(attributeValues(variants, "Color")).toEqual(["Red", "Blue"]);
    expect(attributeValues(variants, "Size")).toEqual(["M", "L"]);
  });

  it("finds the variant matching every selected attribute", () => {
    expect(findVariant(variants, { Color: "Red", Size: "L" })?.id).toBe("b");
    expect(findVariant(variants, { Color: "Red", Size: "XL" })).toBeUndefined();
    expect(findVariant(variants, {})).toBeUndefined();
  });

  it("treats a null stock as not tracked, so those lines are always sellable", () => {
    expect(isInStock(null)).toBe(true);
    expect(isInStock(undefined)).toBe(true);
    expect(isInStock(1)).toBe(true);
    expect(isInStock(0)).toBe(false);
  });
});

describe("normaliseVariantInput", () => {
  it("cleans a filled-in row", () => {
    expect(
      normaliseVariantInput({
        options: "Size=M",
        sku: "  SKU-1  ",
        price: "1500",
        stock: "7",
      }),
    ).toEqual({
      attributes: { Size: "M" },
      sku: "SKU-1",
      price: 1500,
      stock: 7,
    });
  });

  it("falls back to the product price and untracked stock when left empty", () => {
    expect(
      normaliseVariantInput({ options: "Size=L", sku: "", price: "", stock: "" }),
    ).toEqual({
      attributes: { Size: "L" },
      sku: null,
      price: null,
      stock: null,
    });
  });

  it("refuses a negative price or stock rather than storing it", () => {
    const result = normaliseVariantInput({
      options: "Size=M",
      price: "-10",
      stock: "-1",
    });

    expect(result.price).toBeNull();
    expect(result.stock).toBeNull();
  });

  it("keeps stock a whole number", () => {
    expect(normaliseVariantInput({ options: "Size=M", stock: "3.7" }).stock).toBe(3);
  });
});

describe("parseFavoriteIds", () => {
  const id = "3f1c9b0e-1f5e-4a1a-9c3d-7b2e5a6f8d10";

  it("keeps well-formed ids and drops the rest", () => {
    expect(parseFavoriteIds([id, "not-a-uuid", "", null, undefined])).toEqual([id]);
  });

  it("removes duplicates but keeps the order", () => {
    const other = "0b1c2d3e-4f50-4a1a-8b2c-3d4e5f607182";

    expect(parseFavoriteIds([id, other, id])).toEqual([id, other]);
  });

  it("survives a tampered client value", () => {
    expect(parseFavoriteIds("nope")).toEqual([]);
    expect(parseFavoriteIds(null)).toEqual([]);
  });

  it("caps a runaway list at 200 entries", () => {
    const many = Array.from(
      { length: 205 },
      (_, i) => `3f1c9b0e-1f5e-4a1a-9c3d-${String(i).padStart(12, "0")}`,
    );

    expect(parseFavoriteIds(many)).toHaveLength(200);
  });
});

describe("order status presentation", () => {
  it("maps each status to a badge colour", () => {
    expect(orderStatusVariant("pending")).toBe("secondary");
    expect(orderStatusVariant("cancelled")).toBe("destructive");
    expect(orderStatusVariant("confirmed")).toBe("default");
    expect(orderStatusVariant("shipped")).toBe("outline");
    expect(orderStatusVariant("delivered")).toBe("outline");
  });

  it("explains every status the admin can pick", () => {
    expect(Object.keys(STATUS_NOTES).sort()).toEqual([
      "cancelled",
      "confirmed",
      "delivered",
      "pending",
      "shipped",
    ]);
  });
});

describe("low stock", () => {
  it("defaults to 5 units when nothing is configured", () => {
    expect(LOW_STOCK_THRESHOLD).toBe(5);
  });

  it("flags a tracked line at or below the threshold", () => {
    expect(isLowStock(0)).toBe(true);
    expect(isLowStock(5)).toBe(true);
    expect(isLowStock(6)).toBe(false);
  });

  it("never flags an untracked line, because null is not zero", () => {
    expect(isLowStock(null)).toBe(false);
    expect(isLowStock(undefined)).toBe(false);
  });
});

describe("csv export", () => {
  const columns = [
    { label: "Name", value: "name" },
    { label: "Stock", value: (row) => (row.stock === null ? "not tracked" : row.stock) },
  ];

  it("writes a header and one line per row", () => {
    const csv = toCsv(columns, [
      { name: "Mug", stock: 3 },
      { name: "Kettle", stock: null },
    ]);

    expect(csv).toBe("Name,Stock\r\nMug,3\r\nKettle,not tracked");
  });

  it("quotes fields containing a comma, quote or newline", () => {
    const csv = toCsv(
      [{ label: "Address", value: "address" }],
      [{ address: 'House 12, Road 4 "East"' }, { address: "Line 1\nLine 2" }],
    );

    expect(csv).toBe(
      'Address\r\n"House 12, Road 4 ""East"""\r\n"Line 1\nLine 2"',
    );
  });

  it("writes a missing value as an empty cell", () => {
    expect(toCsv(columns, [{ name: "Mug", stock: undefined }])).toBe(
      "Name,Stock\r\nMug,",
    );
  });

  it("exports an empty table as a header row", () => {
    expect(toCsv(columns, [])).toBe("Name,Stock");
  });

  it("prefixes a BOM so Excel reads the taka sign, and names the file", async () => {
    const response = csvResponse(
      csvFilename("orders"),
      toCsv([{ label: "Total", value: "total" }], [{ total: 1250 }]),
    );

    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="orders-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    expect(response.headers.get("cache-control")).toBe("no-store");

    // Both `response.text()` and `TextDecoder` strip the BOM, so read the raw
    // bytes: EF BB BF, then the CSV itself.
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes.subarray(3))).toBe("Total\r\n1250");
  });
});
