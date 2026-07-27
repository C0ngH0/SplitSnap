const CENTS = 100;

/** Convert dollars to whole cents, safely handling floating-point noise. */
export function toCents(amount: number): number {
  return Math.round(amount * CENTS);
}

/** Convert whole cents back to dollars. */
export function fromCents(cents: number): number {
  return cents / CENTS;
}

/** Round to two decimal places. */
export function round2(amount: number): number {
  return Math.round(amount * CENTS) / CENTS;
}

/**
 * Split a whole-cent amount across buckets using the largest-remainder method.
 * Distributed cents always sum to exactly `totalCents`.
 */
export function distributeCents(totalCents: number, weights: number[]): number[] {
  if (weights.length === 0) {
    return [];
  }

  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);

  if (totalCents === 0) {
    return weights.map(() => 0);
  }

  if (weightSum === 0) {
    const base = Math.floor(totalCents / weights.length);
    let remainder = totalCents - base * weights.length;
    return weights.map(() => {
      if (remainder > 0) {
        remainder -= 1;
        return base + 1;
      }
      return base;
    });
  }

  const rawShares = weights.map(
    (weight) => (totalCents * weight) / weightSum,
  );
  const floored = rawShares.map((share) => Math.floor(share));
  let remainder = totalCents - floored.reduce((sum, value) => sum + value, 0);

  const ranked = rawShares
    .map((share, index) => ({ index, fraction: share - floored[index] }))
    .sort((a, b) => b.fraction - a.fraction);

  const shares = [...floored];
  for (let i = 0; i < remainder; i += 1) {
    shares[ranked[i % ranked.length].index] += 1;
  }

  return shares;
}

/**
 * Allocate an item total across N whole units.
 * Remainder cents go to the first units deterministically.
 * Example: $10.00 / 3 → [334, 333, 333] cents.
 */
export function allocateUnitCents(
  totalCents: number,
  quantity: number,
): number[] {
  if (quantity <= 0) {
    return [];
  }

  if (totalCents === 0) {
    return Array.from({ length: quantity }, () => 0);
  }

  const base = Math.floor(totalCents / quantity);
  let remainder = totalCents - base * quantity;

  return Array.from({ length: quantity }, () => {
    if (remainder > 0) {
      remainder -= 1;
      return base + 1;
    }
    return base;
  });
}

/** Derive a display unit price from an authoritative total. */
export function deriveUnitPrice(totalPrice: number, quantity: number): number {
  if (quantity <= 0) {
    return 0;
  }

  return round2(fromCents(toCents(totalPrice)) / quantity);
}

/**
 * Compute authoritative total from a manually edited unit price.
 * Uses integer cents: totalCents = unitCents × quantity.
 */
export function totalFromUnitPrice(
  unitPrice: number,
  quantity: number,
): number {
  return fromCents(toCents(unitPrice) * quantity);
}
