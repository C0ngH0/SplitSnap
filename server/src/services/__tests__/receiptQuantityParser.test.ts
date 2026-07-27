import { describe, expect, it } from "vitest";

import {
  buildExtractedItem,
  parseQuantityFromItemText,
} from "../receiptQuantityParser";

describe("parseQuantityFromItemText", () => {
  it("defaults uncertain brand names to quantity 1", () => {
    expect(parseQuantityFromItemText("7UP", 2.5).quantity).toBe(1);
    expect(parseQuantityFromItemText("5 Guys Burger", 12).quantity).toBe(1);
    expect(parseQuantityFromItemText("101 Burger", 15).quantity).toBe(1);
    expect(parseQuantityFromItemText("Formula 1", 9).quantity).toBe(1);
  });

  it("parses leading quantity when total divides cleanly", () => {
    const parsed = parseQuantityFromItemText("3 Potato", 12);
    expect(parsed).toMatchObject({ name: "Potato", quantity: 3 });
  });

  it("parses 3 x Potato", () => {
    expect(parseQuantityFromItemText("3 x Potato", 12)).toMatchObject({
      name: "Potato",
      quantity: 3,
    });
  });

  it("parses Potato x3", () => {
    expect(parseQuantityFromItemText("Potato x3", 12)).toMatchObject({
      name: "Potato",
      quantity: 3,
    });
  });

  it("uses structured quantity when provided", () => {
    expect(
      parseQuantityFromItemText("Potato", 12, 3, 4),
    ).toMatchObject({ name: "Potato", quantity: 3, unitPrice: 4 });
  });
});

describe("buildExtractedItem", () => {
  it("builds authoritative total with derived unit price", () => {
    expect(buildExtractedItem("3 Potato", 12)).toMatchObject({
      name: "Potato",
      quantity: 3,
      unitPrice: 4,
      totalPrice: 12,
    });
  });

  it("defaults to quantity 1 when uncertain", () => {
    expect(buildExtractedItem("Mystery Item", 7.25)).toMatchObject({
      name: "Mystery Item",
      quantity: 1,
      unitPrice: 7.25,
      totalPrice: 7.25,
    });
  });
});
