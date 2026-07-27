import type {
  Person,
  PersonItemLine,
  PersonTotal,
  ReceiptItem,
  ReceiptSummary,
  SplitSession,
  TipMode,
} from "../types/split";
import { assignedUnitCount, remainingUnitCount } from "./itemAllocations";
import {
  allocateUnitCents,
  distributeCents,
  fromCents,
  round2,
  toCents,
} from "./money";

export {
  allocateUnitCents,
  distributeCents,
  fromCents,
  round2,
  toCents,
} from "./money";

/** Sum receipt item totals to get the food subtotal. */
export function calculateItemsSubtotal(items: ReceiptItem[]): number {
  return round2(items.reduce((sum, item) => sum + item.totalPrice, 0));
}

/**
 * Resolve the tip dollar amount from percentage or fixed custom input.
 * Percentage tips are based on the receipt subtotal.
 */
export function resolveTipAmount(
  subtotal: number,
  tipMode: TipMode,
  tipPercent: number,
  customTipAmount: number,
): number {
  if (tipMode === "percentage") {
    return round2(subtotal * (tipPercent / 100));
  }

  return round2(customTipAmount);
}

/** Human-readable label for the current tip selection. */
export function formatTipSelectionLabel(
  tipMode: TipMode,
  tipPercent: number,
): string {
  if (tipMode === "percentage") {
    return `${tipPercent}%`;
  }

  return "Custom";
}

function buildSummary(
  subtotal: number,
  tax: number,
  tip: number,
  personTotals: PersonTotal[],
): ReceiptSummary {
  const finalTotal = round2(subtotal + tax + tip);
  const sumOfPeopleTotals = round2(
    personTotals.reduce((sum, person) => sum + person.finalAmount, 0),
  );

  return {
    subtotal: round2(subtotal),
    tax: round2(tax),
    tip: round2(tip),
    finalTotal,
    sumOfPeopleTotals,
    difference: round2(finalTotal - sumOfPeopleTotals),
  };
}

function buildPersonTotals(
  people: Person[],
  foodCentsByPerson: number[],
  taxCentsByPerson: number[],
  tipCentsByPerson: number[],
  itemLinesByPerson: PersonItemLine[][],
): PersonTotal[] {
  return people.map((person, index) => {
    const foodSubtotal = fromCents(foodCentsByPerson[index]);
    const taxShare = fromCents(taxCentsByPerson[index]);
    const tipShare = fromCents(tipCentsByPerson[index]);

    return {
      personId: person.id,
      name: person.name,
      foodSubtotal,
      taxShare,
      tipShare,
      finalAmount: round2(foodSubtotal + taxShare + tipShare),
      itemLines: itemLinesByPerson[index],
    };
  });
}

/**
 * Fix off-by-one-cent rounding errors so person totals match the expected bill.
 * Adjustments are applied to tip shares to keep food and tax stable.
 */
export function applyRoundingCorrection(
  results: PersonTotal[],
  expectedTotal: number,
): PersonTotal[] {
  if (results.length === 0) {
    return results;
  }

  const corrected = results.map((person) => ({
    ...person,
    foodSubtotal: round2(person.foodSubtotal),
    taxShare: round2(person.taxShare),
    tipShare: round2(person.tipShare),
    finalAmount: round2(
      person.foodSubtotal + person.taxShare + person.tipShare,
    ),
    itemLines: person.itemLines ? [...person.itemLines] : undefined,
  }));

  let differenceCents =
    toCents(expectedTotal) -
    toCents(
      corrected.reduce((sum, person) => sum + person.finalAmount, 0),
    );

  let index = 0;
  while (differenceCents !== 0) {
    const personIndex = index % corrected.length;
    const adjustmentCents = differenceCents > 0 ? 1 : -1;

    corrected[personIndex].tipShare = round2(
      corrected[personIndex].tipShare + fromCents(adjustmentCents),
    );
    corrected[personIndex].finalAmount = round2(
      corrected[personIndex].foodSubtotal +
        corrected[personIndex].taxShare +
        corrected[personIndex].tipShare,
    );

    differenceCents -= adjustmentCents;
    index += 1;
  }

  return corrected;
}

/**
 * Split a pre-tip bill total evenly, then distribute tip evenly on top.
 * `total` is the amount before tip (tax may already be included in that figure).
 */
export function calculateEvenSplit(
  total: number,
  people: Person[],
  tip: number = 0,
): Pick<SplitSession, "personTotals" | "summary"> {
  const preTipTotal = round2(total);
  const tipAmount = round2(tip);
  const finalTotal = round2(preTipTotal + tipAmount);
  const equalWeights = people.map(() => 1);
  const foodCents = distributeCents(toCents(preTipTotal), equalWeights);
  const tipCents = distributeCents(toCents(tipAmount), equalWeights);

  const personTotals = people.map((person, index) => ({
    personId: person.id,
    name: person.name,
    foodSubtotal: fromCents(foodCents[index]),
    taxShare: 0,
    tipShare: fromCents(tipCents[index]),
    finalAmount: round2(
      fromCents(foodCents[index]) + fromCents(tipCents[index]),
    ),
    itemLines: [] as PersonItemLine[],
  }));

  const corrected = applyRoundingCorrection(personTotals, finalTotal);

  return {
    personTotals: corrected,
    summary: buildSummary(preTipTotal, 0, tipAmount, corrected),
  };
}

export type ComputedAssignment = {
  participantId: string;
  allocationType: "INDIVIDUAL" | "SHARED";
  shareQuantity: number;
  amountCents: number;
};

/**
 * Cent-safe per-participant amounts for one receipt item.
 * Unit cents are allocated first, then consumed by individual then shared pools.
 */
export function computeItemAssignments(
  item: ReceiptItem,
): ComputedAssignment[] {
  const quantity = Math.max(1, Math.floor(item.quantity));
  const unitCents = allocateUnitCents(toCents(item.totalPrice), quantity);
  let cursor = 0;
  const results: ComputedAssignment[] = [];

  for (const allocation of item.individualAllocations) {
    if (allocation.quantity <= 0) {
      continue;
    }

    const take = Math.min(allocation.quantity, quantity - cursor);
    if (take <= 0) {
      continue;
    }

    let amountCents = 0;
    for (let i = 0; i < take; i += 1) {
      amountCents += unitCents[cursor];
      cursor += 1;
    }

    results.push({
      participantId: allocation.participantId,
      allocationType: "INDIVIDUAL",
      shareQuantity: take,
      amountCents,
    });
  }

  const shared = item.sharedAllocation;
  if (shared && shared.quantity > 0 && shared.participantIds.length > 0) {
    const take = Math.min(shared.quantity, quantity - cursor);
    if (take > 0) {
      let poolCents = 0;
      for (let i = 0; i < take; i += 1) {
        poolCents += unitCents[cursor];
        cursor += 1;
      }

      const shares = distributeCents(
        poolCents,
        shared.participantIds.map(() => 1),
      );

      shared.participantIds.forEach((participantId, index) => {
        // Dual membership: add a separate SHARED row even if they also have individual.
        const existing = results.find(
          (row) =>
            row.participantId === participantId &&
            row.allocationType === "SHARED",
        );
        if (existing) {
          existing.amountCents += shares[index];
          return;
        }

        results.push({
          participantId,
          allocationType: "SHARED",
          shareQuantity: take,
          amountCents: shares[index],
        });
      });
    }
  }

  return results;
}

function personNameMap(people: Person[]): Map<string, string> {
  return new Map(people.map((person) => [person.id, person.name]));
}

function buildItemLinesForAssignments(
  item: ReceiptItem,
  assignments: ComputedAssignment[],
  names: Map<string, string>,
): Map<string, PersonItemLine[]> {
  const linesByPerson = new Map<string, PersonItemLine[]>();

  const individualByPerson = new Map<string, ComputedAssignment>();
  const sharedAssignments: ComputedAssignment[] = [];

  for (const assignment of assignments) {
    if (assignment.allocationType === "INDIVIDUAL") {
      const existing = individualByPerson.get(assignment.participantId);
      if (existing) {
        existing.shareQuantity += assignment.shareQuantity;
        existing.amountCents += assignment.amountCents;
      } else {
        individualByPerson.set(assignment.participantId, { ...assignment });
      }
    } else {
      sharedAssignments.push(assignment);
    }
  }

  for (const assignment of individualByPerson.values()) {
    const lines = linesByPerson.get(assignment.participantId) ?? [];
    lines.push({
      itemName: item.name,
      quantityLabel: `${assignment.shareQuantity} × ${item.name}`,
      amount: fromCents(assignment.amountCents),
    });
    linesByPerson.set(assignment.participantId, lines);
  }

  if (sharedAssignments.length > 0) {
    const sharedQty = sharedAssignments[0]?.shareQuantity ?? 0;
    const sharedNames = sharedAssignments
      .map((assignment) => names.get(assignment.participantId) ?? "Someone")
      .filter(Boolean);

    for (const assignment of sharedAssignments) {
      if (assignment.amountCents <= 0) {
        continue;
      }

      const others = sharedNames.filter(
        (name) => name !== (names.get(assignment.participantId) ?? ""),
      );
      const lines = linesByPerson.get(assignment.participantId) ?? [];
      lines.push({
        itemName: item.name,
        quantityLabel: `${sharedQty} × ${item.name}`,
        amount: fromCents(assignment.amountCents),
        sharedWithNames: others.length > 0 ? others : undefined,
      });
      linesByPerson.set(assignment.participantId, lines);
    }
  }

  return linesByPerson;
}

function calculateFoodSubtotals(
  items: ReceiptItem[],
  people: Person[],
): {
  foodCentsByPerson: number[];
  itemLinesByPerson: PersonItemLine[][];
} {
  const foodCentsByPerson = people.map(() => 0);
  const itemLinesByPerson: PersonItemLine[][] = people.map(() => []);
  const indexById = new Map(people.map((person, index) => [person.id, index]));
  const names = personNameMap(people);

  for (const item of items) {
    const assignments = computeItemAssignments(item);
    const linesByPerson = buildItemLinesForAssignments(item, assignments, names);

    for (const assignment of assignments) {
      const personIndex = indexById.get(assignment.participantId);
      if (personIndex === undefined) {
        continue;
      }

      foodCentsByPerson[personIndex] += assignment.amountCents;
    }

    for (const [participantId, lines] of linesByPerson) {
      const personIndex = indexById.get(participantId);
      if (personIndex === undefined) {
        continue;
      }

      itemLinesByPerson[personIndex].push(...lines);
    }
  }

  return { foodCentsByPerson, itemLinesByPerson };
}

function calculateProportionalSplit(
  items: ReceiptItem[],
  people: Person[],
  tax: number,
  tip: number,
): Pick<SplitSession, "personTotals" | "summary"> {
  const subtotal = calculateItemsSubtotal(items);
  const { foodCentsByPerson, itemLinesByPerson } = calculateFoodSubtotals(
    items,
    people,
  );

  const taxCentsByPerson = distributeCents(toCents(tax), foodCentsByPerson);
  const tipCentsByPerson = distributeCents(
    toCents(tip),
    people.map(() => 1),
  );
  const personTotals = buildPersonTotals(
    people,
    foodCentsByPerson,
    taxCentsByPerson,
    tipCentsByPerson,
    itemLinesByPerson,
  );

  const expectedTotal = round2(subtotal + tax + tip);
  const corrected = applyRoundingCorrection(personTotals, expectedTotal);

  return {
    personTotals: corrected,
    summary: buildSummary(subtotal, tax, tip, corrected),
  };
}

/** Itemized split: units assigned individually (no shared pool). */
export function calculateItemizedSplit(
  items: ReceiptItem[],
  people: Person[],
  tax: number,
  tip: number,
): Pick<SplitSession, "personTotals" | "summary"> {
  return calculateProportionalSplit(items, people, tax, tip);
}

/** Hybrid split: individual units plus optional shared pools. */
export function calculateHybridSplit(
  items: ReceiptItem[],
  people: Person[],
  tax: number,
  tip: number,
): Pick<SplitSession, "personTotals" | "summary"> {
  return calculateProportionalSplit(items, people, tax, tip);
}

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

const MODE_LABELS: Record<SplitSession["mode"], string> = {
  even: "Even Split",
  itemized: "Itemized Split",
  hybrid: "Hybrid Split",
};

export function validateParticipantName(name: string): string | null {
  if (name.trim().length === 0) {
    return "Participant name cannot be empty.";
  }

  return null;
}

export function validateItemFields(
  name: string,
  totalPrice: number,
  quantity = 1,
): string | null {
  if (name.trim().length === 0) {
    return "Item name cannot be empty.";
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return "Quantity must be a whole number of at least 1.";
  }

  if (totalPrice <= 0) {
    return "Item price must be greater than $0.00.";
  }

  return null;
}

function validateItemAssignments(
  mode: SplitSession["mode"],
  item: ReceiptItem,
): string | null {
  if (!Number.isInteger(item.quantity) || item.quantity < 1) {
    return `"${item.name}" must have a whole-number quantity of at least 1.`;
  }

  for (const allocation of item.individualAllocations) {
    if (!Number.isInteger(allocation.quantity) || allocation.quantity < 0) {
      return `"${item.name}" has an invalid individual quantity.`;
    }
  }

  if (item.sharedAllocation) {
    if (
      !Number.isInteger(item.sharedAllocation.quantity) ||
      item.sharedAllocation.quantity < 0
    ) {
      return `"${item.name}" has an invalid shared quantity.`;
    }

    if (
      item.sharedAllocation.quantity > 0 &&
      item.sharedAllocation.participantIds.length < 2 &&
      mode === "hybrid"
    ) {
      // qty 1 with one person is represented as individual, not shared.
      // Shared pool with 1 person is invalid for hybrid multi-share.
      if (item.sharedAllocation.participantIds.length === 0) {
        return `"${item.name}" shared units need at least one participant.`;
      }
      if (item.sharedAllocation.participantIds.length === 1) {
        return `"${item.name}" needs at least two people to share units.`;
      }
    }
  }

  const assigned = assignedUnitCount(item);
  if (assigned > item.quantity) {
    return `"${item.name}" is over-assigned (${assigned} of ${item.quantity}).`;
  }

  if (remainingUnitCount(item) > 0) {
    return `"${item.name}" still has ${remainingUnitCount(item)} unassigned ${
      remainingUnitCount(item) === 1 ? "unit" : "units"
    }.`;
  }

  if (mode === "itemized" && item.sharedAllocation?.quantity) {
    return `"${item.name}" cannot use shared allocation in itemized mode.`;
  }

  if (mode === "itemized") {
    const owners = item.individualAllocations.filter((a) => a.quantity > 0);
    if (owners.length === 0) {
      return `"${item.name}" is not assigned yet.`;
    }
  }

  return null;
}

export function validateSplitInput(
  mode: SplitSession["mode"],
  people: Person[],
  items: ReceiptItem[],
  billTotal: number,
  tax: number,
  tip: number,
  _tipMode: TipMode = "percentage",
  _customTipInput = "",
): string | null {
  if (people.length < 2) {
    return "Add at least 2 participants before calculating.";
  }

  if (people.some((person) => person.name.trim().length === 0)) {
    return "Every participant must have a name. Edit or remove blank entries.";
  }

  if (tax < 0) {
    return "Tax must be zero or greater.";
  }

  if (tip < 0) {
    return "Tip must be zero or greater.";
  }

  if (items.length === 0) {
    return "Add at least one receipt item before calculating.";
  }

  const invalidPriceItem = items.find((item) => item.totalPrice <= 0);
  if (invalidPriceItem) {
    return `"${invalidPriceItem.name}" needs a price greater than $0.00.`;
  }

  const unnamedItem = items.find((item) => item.name.trim().length === 0);
  if (unnamedItem) {
    return "Every receipt item must have a name. Edit or remove blank items.";
  }

  const badQuantity = items.find(
    (item) => !Number.isInteger(item.quantity) || item.quantity < 1,
  );
  if (badQuantity) {
    return `"${badQuantity.name}" must have a whole-number quantity of at least 1.`;
  }

  // Even mode uses items for the bill total only — no per-item assignments.
  if (mode === "even") {
    return null;
  }

  for (const item of items) {
    const assignmentError = validateItemAssignments(mode, item);
    if (assignmentError) {
      return assignmentError;
    }
  }

  void billTotal;
  return null;
}

/** Build plain-text summary for the native share sheet. */
export function formatSessionShareText(session: SplitSession): string {
  const lines = [
    "Tably Results",
    `Mode: ${MODE_LABELS[session.mode]}`,
    "",
    "Receipt Summary",
    `Subtotal: ${formatMoney(session.summary.subtotal)}`,
    `Tax: ${formatMoney(session.summary.tax)}`,
    `Tip: ${formatMoney(session.summary.tip)}`,
    `Final total: ${formatMoney(session.summary.finalTotal)}`,
    "",
    "What Each Person Owes",
  ];

  for (const person of session.personTotals) {
    lines.push(
      "",
      person.name,
      `  Food: ${formatMoney(person.foodSubtotal)}`,
      `  Tax: ${formatMoney(person.taxShare)}`,
      `  Tip: ${formatMoney(person.tipShare)}`,
      `  Total: ${formatMoney(person.finalAmount)}`,
    );

    if (person.itemLines && person.itemLines.length > 0) {
      for (const line of person.itemLines) {
        const shared =
          line.sharedWithNames && line.sharedWithNames.length > 0
            ? ` (shared with ${line.sharedWithNames.join(", ")})`
            : "";
        lines.push(
          `  ${line.quantityLabel}  ${formatMoney(line.amount)}${shared}`,
        );
      }
    }
  }

  lines.push(
    "",
    `Sum of totals: ${formatMoney(session.summary.sumOfPeopleTotals)}`,
    `Difference: ${formatMoney(session.summary.difference)}`,
  );

  return lines.join("\n");
}
