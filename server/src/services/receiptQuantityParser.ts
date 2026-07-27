import type { ExtractedReceiptItem } from "../types/receipt";

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Brand / product names that start with digits but are not quantities.
 * Checked before applying leading-number quantity patterns.
 */
const LEADING_NUMBER_BRAND_PATTERNS = [
  /^7\s*up\b/i,
  /^5\s*guys\b/i,
  /^101\b/i,
  /^formula\s*1\b/i,
  /^3\s*musketeers\b/i,
  /^5\s*hour\b/i,
  /^9\s*lives\b/i,
];

function looksLikeBrandWithLeadingNumber(name: string): boolean {
  return LEADING_NUMBER_BRAND_PATTERNS.some((pattern) => pattern.test(name.trim()));
}

export function normalizeExtractedReceiptItem(input: {
  name: string;
  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
  price?: number | null;
}): ExtractedReceiptItem {
  const name = input.name.trim();
  const totalPrice = roundCurrency(
    typeof input.totalPrice === "number" && Number.isFinite(input.totalPrice)
      ? input.totalPrice
      : typeof input.price === "number" && Number.isFinite(input.price)
        ? input.price
        : 0,
  );

  let quantity =
    typeof input.quantity === "number" &&
    Number.isInteger(input.quantity) &&
    input.quantity >= 1
      ? input.quantity
      : 1;

  let unitPrice =
    typeof input.unitPrice === "number" && Number.isFinite(input.unitPrice)
      ? roundCurrency(input.unitPrice)
      : roundCurrency(totalPrice / quantity);

  // When uncertain about quantity, force qty 1 with unit = total.
  if (quantity < 1 || !Number.isInteger(quantity)) {
    quantity = 1;
    unitPrice = totalPrice;
  }

  return {
    name,
    quantity,
    unitPrice,
    totalPrice,
  };
}

type ParsedQuantityName = {
  name: string;
  quantity: number;
  unitPrice?: number;
};

/**
 * Parse quantity markers from an item name / line fragment.
 * Returns null quantity confidence → quantity 1.
 */
export function parseQuantityFromItemText(
  rawName: string,
  totalPrice: number,
  structuredQuantity?: number | null,
  structuredUnitPrice?: number | null,
): ParsedQuantityName {
  const name = rawName.trim();

  if (
    typeof structuredQuantity === "number" &&
    Number.isInteger(structuredQuantity) &&
    structuredQuantity >= 1
  ) {
    return {
      name,
      quantity: structuredQuantity,
      unitPrice:
        typeof structuredUnitPrice === "number" &&
        Number.isFinite(structuredUnitPrice)
          ? roundCurrency(structuredUnitPrice)
          : undefined,
    };
  }

  if (looksLikeBrandWithLeadingNumber(name)) {
    return { name, quantity: 1 };
  }

  // 3 x Potato / 3 × Potato / 3*Potato
  const leadingMultiplier = name.match(
    /^(\d+)\s*[x×*]\s+(.+)$/i,
  );
  if (leadingMultiplier) {
    const quantity = Number(leadingMultiplier[1]);
    const rest = leadingMultiplier[2].trim();
    if (quantity >= 1 && rest.length >= 2 && !looksLikeBrandWithLeadingNumber(rest)) {
      return { name: rest, quantity };
    }
  }

  // Potato x3 / Potato × 3
  const trailingMultiplier = name.match(
    /^(.+?)\s*[x×*]\s*(\d+)$/i,
  );
  if (trailingMultiplier) {
    const rest = trailingMultiplier[1].trim();
    const quantity = Number(trailingMultiplier[2]);
    if (quantity >= 1 && rest.length >= 2 && !/^\d+$/.test(rest)) {
      return { name: rest, quantity };
    }
  }

  // 3 @ 4.00  (unit price present; name may be elsewhere — treat whole as qty+unit)
  const atPrice = name.match(/^(\d+)\s*@\s*\$?(\d+(?:\.\d{1,2})?)$/);
  if (atPrice) {
    const quantity = Number(atPrice[1]);
    const unitPrice = roundCurrency(Number(atPrice[2]));
    if (quantity >= 1) {
      return { name: name, quantity, unitPrice };
    }
  }

  // 3 Potato 4.00  (qty + name + unit) — only when total ≈ qty * unit
  const qtyNameUnit = name.match(
    /^(\d+)\s+(.+?)\s+\$?(\d+(?:\.\d{1,2})?)$/,
  );
  if (qtyNameUnit) {
    const quantity = Number(qtyNameUnit[1]);
    const rest = qtyNameUnit[2].trim();
    const unitPrice = roundCurrency(Number(qtyNameUnit[3]));
    if (
      quantity >= 2 &&
      rest.length >= 2 &&
      !looksLikeBrandWithLeadingNumber(`${quantity} ${rest}`) &&
      Math.abs(quantity * unitPrice - totalPrice) <= 0.02
    ) {
      return { name: rest, quantity, unitPrice };
    }
  }

  // Leading quantity: "3 Potato" — only when total divisible by qty (or unit structured)
  const leadingQty = name.match(/^(\d+)\s+([A-Za-z].+)$/);
  if (leadingQty) {
    const quantity = Number(leadingQty[1]);
    const rest = leadingQty[2].trim();
    if (
      quantity >= 2 &&
      rest.length >= 2 &&
      !looksLikeBrandWithLeadingNumber(name) &&
      totalPrice > 0
    ) {
      const unit = roundCurrency(totalPrice / quantity);
      // Accept when unit * qty reconstitutes total within 1 cent per unit remainder rules
      const reconstituted = Math.round(unit * 100) * quantity;
      const totalCents = Math.round(totalPrice * 100);
      // Prefer when division is clean OR remainder cents fit allocateUnitCents pattern
      if (
        Math.abs(quantity * unit - totalPrice) <= 0.02 ||
        Math.abs(reconstituted / 100 - totalPrice) <= 0.02 ||
        totalCents % quantity === 0
      ) {
        return { name: rest, quantity };
      }
    }
  }

  return { name, quantity: 1 };
}

export function buildExtractedItem(
  rawName: string,
  totalPrice: number,
  structuredQuantity?: number | null,
  structuredUnitPrice?: number | null,
): ExtractedReceiptItem {
  const parsed = parseQuantityFromItemText(
    rawName,
    totalPrice,
    structuredQuantity,
    structuredUnitPrice,
  );

  return normalizeExtractedReceiptItem({
    name: parsed.name,
    quantity: parsed.quantity,
    unitPrice: parsed.unitPrice,
    totalPrice,
  });
}
