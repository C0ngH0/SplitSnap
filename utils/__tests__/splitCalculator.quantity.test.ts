import { describe, expect, it } from "vitest";

import type { Person, ReceiptItem } from "../../types/split";
import {
  createEmptyReceiptItem,
  setIndividualQuantity,
  setSharedAllocation,
  withQuantity,
  withUnitPrice,
} from "../itemAllocations";
import { allocateUnitCents, toCents } from "../money";
import {
  calculateHybridSplit,
  calculateItemizedSplit,
  calculateItemsSubtotal,
  computeItemAssignments,
  validateSplitInput,
} from "../splitCalculator";

const people: Person[] = [
  { id: "alex", name: "Alex" },
  { id: "sam", name: "Sam" },
  { id: "jamie", name: "Jamie" },
];

function potato(
  overrides: Partial<ReceiptItem> = {},
): ReceiptItem {
  return {
    ...createEmptyReceiptItem("potato", "Potato", 12, 3),
    unitPrice: 4,
    ...overrides,
  };
}

function foodByName(
  result: ReturnType<typeof calculateItemizedSplit>,
): Record<string, number> {
  return Object.fromEntries(
    result.personTotals.map((person) => [person.name, person.foodSubtotal]),
  );
}

describe("allocateUnitCents", () => {
  it("splits $10 across 3 units as 3.34, 3.33, 3.33", () => {
    expect(allocateUnitCents(1000, 3)).toEqual([334, 333, 333]);
  });

  it("splits $5.01 across 2 units as 2.51, 2.50", () => {
    expect(allocateUnitCents(501, 2)).toEqual([251, 250]);
  });

  it("keeps quantity 1 unchanged", () => {
    expect(allocateUnitCents(1200, 1)).toEqual([1200]);
  });
});

describe("quantity 1 regression", () => {
  it("itemized assigns the full line to one person", () => {
    const items: ReceiptItem[] = [
      {
        ...createEmptyReceiptItem("burger", "Burger", 12, 1),
        individualAllocations: [{ participantId: "alex", quantity: 1 }],
      },
    ];

    const result = calculateItemizedSplit(items, people, 0, 0);
    expect(foodByName(result)).toMatchObject({
      Alex: 12,
      Sam: 0,
      Jamie: 0,
    });
    expect(result.summary.difference).toBe(0);
  });

  it("hybrid with multiple people shares the line evenly", () => {
    const items: ReceiptItem[] = [
      {
        ...createEmptyReceiptItem("fries", "Fries", 9, 1),
        individualAllocations: [],
        sharedAllocation: {
          quantity: 1,
          participantIds: ["alex", "sam", "jamie"],
        },
      },
    ];

    const result = calculateHybridSplit(items, people, 0, 0);
    expect(foodByName(result)).toMatchObject({
      Alex: 3,
      Sam: 3,
      Jamie: 3,
    });
  });
});

describe("itemized quantity assignments", () => {
  it("assigns all 3 units to one person", () => {
    const items = [
      potato({
        individualAllocations: [{ participantId: "alex", quantity: 3 }],
      }),
    ];

    const result = calculateItemizedSplit(items, people, 0, 0);
    expect(foodByName(result).Alex).toBe(12);
    expect(computeItemAssignments(items[0]).reduce((s, a) => s + a.amountCents, 0)).toBe(1200);
  });

  it("assigns one unit to each of three people", () => {
    const items = [
      potato({
        individualAllocations: [
          { participantId: "alex", quantity: 1 },
          { participantId: "sam", quantity: 1 },
          { participantId: "jamie", quantity: 1 },
        ],
      }),
    ];

    expect(foodByName(calculateItemizedSplit(items, people, 0, 0))).toMatchObject({
      Alex: 4,
      Sam: 4,
      Jamie: 4,
    });
  });

  it("assigns 2 and 1 across two people", () => {
    const items = [
      potato({
        individualAllocations: [
          { participantId: "alex", quantity: 2 },
          { participantId: "sam", quantity: 1 },
        ],
      }),
    ];

    expect(foodByName(calculateItemizedSplit(items, people, 0, 0))).toMatchObject({
      Alex: 8,
      Sam: 4,
      Jamie: 0,
    });
  });
});

describe("hybrid individual plus shared", () => {
  it("gives Alex 1 unit and shares 2 between Sam and Jamie", () => {
    const items = [
      potato({
        individualAllocations: [{ participantId: "alex", quantity: 1 }],
        sharedAllocation: {
          quantity: 2,
          participantIds: ["sam", "jamie"],
        },
      }),
    ];

    expect(foodByName(calculateHybridSplit(items, people, 0, 0))).toMatchObject({
      Alex: 4,
      Sam: 4,
      Jamie: 4,
    });
  });

  it("gives Alex 2 units and splits the remaining unit between Sam and Jamie", () => {
    const items = [
      potato({
        individualAllocations: [{ participantId: "alex", quantity: 2 }],
        sharedAllocation: {
          quantity: 1,
          participantIds: ["sam", "jamie"],
        },
      }),
    ];

    expect(foodByName(calculateHybridSplit(items, people, 0, 0))).toMatchObject({
      Alex: 8,
      Sam: 2,
      Jamie: 2,
    });
  });

  it("allows dual membership when Alex also joins the shared remainder", () => {
    const items = [
      potato({
        individualAllocations: [{ participantId: "alex", quantity: 1 }],
        sharedAllocation: {
          quantity: 2,
          participantIds: ["alex", "sam"],
        },
      }),
    ];

    const foods = foodByName(calculateHybridSplit(items, people, 0, 0));
    expect(foods.Alex).toBe(8);
    expect(foods.Sam).toBe(4);
    expect(foods.Jamie).toBe(0);
  });
});

describe("uneven unit cents", () => {
  it("preserves $10.00 across 3 units with 2+1 assignment", () => {
    const item = createEmptyReceiptItem("misc", "Misc", 10, 3);
    item.individualAllocations = [
      { participantId: "alex", quantity: 2 },
      { participantId: "sam", quantity: 1 },
    ];

    const assignments = computeItemAssignments(item);
    expect(assignments.reduce((sum, row) => sum + row.amountCents, 0)).toBe(1000);

    const result = calculateItemizedSplit([item], people, 0, 0);
    expect(toCents(result.summary.subtotal)).toBe(1000);
    expect(result.summary.difference).toBe(0);
    expect(foodByName(result).Alex).toBe(6.67);
    expect(foodByName(result).Sam).toBe(3.33);
  });

  it("splits shared remainder cents for $5.01 / 2 with one shared unit path", () => {
    const item = createEmptyReceiptItem("soda", "Soda", 5.01, 2);
    item.individualAllocations = [{ participantId: "alex", quantity: 1 }];
    item.sharedAllocation = {
      quantity: 1,
      participantIds: ["sam", "jamie"],
    };

    const result = calculateHybridSplit([item], people, 0, 0);
    expect(toCents(calculateItemsSubtotal([item]))).toBe(501);
    expect(result.summary.difference).toBe(0);
    expect(foodByName(result).Alex).toBe(2.51);
    expect(foodByName(result).Sam + foodByName(result).Jamie).toBeCloseTo(2.5, 2);
  });
});

describe("tax and tip", () => {
  it("keeps tax proportional and tip even while preserving grand total", () => {
    const items = [
      potato({
        individualAllocations: [
          { participantId: "alex", quantity: 2 },
          { participantId: "sam", quantity: 1 },
        ],
      }),
    ];

    const result = calculateItemizedSplit(items, people, 1.2, 3);
    expect(result.summary.tax).toBe(1.2);
    expect(result.summary.tip).toBe(3);
    expect(result.summary.finalTotal).toBe(16.2);
    expect(result.summary.difference).toBe(0);

    const tipShares = result.personTotals.map((person) => person.tipShare);
    expect(tipShares.reduce((sum, value) => sum + value, 0)).toBeCloseTo(3, 2);
    expect(new Set(tipShares).size).toBe(1);
  });
});

describe("validation", () => {
  it("rejects over-assignment", () => {
    const items = [
      potato({
        individualAllocations: [
          { participantId: "alex", quantity: 2 },
          { participantId: "sam", quantity: 2 },
        ],
      }),
    ];

    expect(
      validateSplitInput("itemized", people, items, 12, 0, 0),
    ).toMatch(/over-assigned/i);
  });

  it("rejects under-assignment", () => {
    const items = [
      potato({
        individualAllocations: [{ participantId: "alex", quantity: 1 }],
      }),
    ];

    expect(
      validateSplitInput("itemized", people, items, 12, 0, 0),
    ).toMatch(/unassigned/i);
  });

  it("rejects zero assignment", () => {
    const items = [potato()];
    expect(
      validateSplitInput("itemized", people, items, 12, 0, 0),
    ).toMatch(/unassigned/i);
  });
});

describe("quantity / unit price edits", () => {
  it("clears assignments when quantity drops below assigned", () => {
    const item = potato({
      individualAllocations: [
        { participantId: "alex", quantity: 2 },
        { participantId: "sam", quantity: 1 },
      ],
    });

    const next = withQuantity(item, 2);
    expect(next.quantity).toBe(2);
    expect(next.individualAllocations).toEqual([]);
    expect(next.sharedAllocation).toBeNull();
  });

  it("preserves assignments when quantity increases", () => {
    let item = potato({
      individualAllocations: [{ participantId: "alex", quantity: 2 }],
    });
    item = withQuantity(item, 4);
    expect(item.quantity).toBe(4);
    expect(item.individualAllocations).toEqual([
      { participantId: "alex", quantity: 2 },
    ]);
  });

  it("updates totalPrice from unitPrice × quantity in cents", () => {
    const item = withUnitPrice(createEmptyReceiptItem("x", "X", 12, 3), 4);
    expect(item.unitPrice).toBe(4);
    expect(item.totalPrice).toBe(12);
  });

  it("clamps individual quantity so assignments cannot exceed item quantity", () => {
    const item = setIndividualQuantity(potato(), "alex", 5);
    expect(item.individualAllocations[0]?.quantity).toBe(3);
  });
});
