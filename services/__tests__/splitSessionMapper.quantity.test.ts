import { describe, expect, it } from "vitest";

import {
  apiDtoToSplitSession,
  normalizeLegacyReceiptItem,
  splitSessionToCreateRequest,
} from "../splitSessionMapper";
import type { SplitSessionDto } from "../../shared/types/splitSession";
import { createEmptyReceiptItem } from "../../utils/itemAllocations";
import type { SplitSession } from "../../types/split";

describe("legacy compatibility", () => {
  it("normalizes legacy price + assignedTo into quantity 1 allocations", () => {
    const item = normalizeLegacyReceiptItem({
      id: "1",
      name: "Burger",
      price: 12,
      assignedTo: ["alex"],
    });

    expect(item.quantity).toBe(1);
    expect(item.totalPrice).toBe(12);
    expect(item.unitPrice).toBe(12);
    expect(item.individualAllocations).toEqual([
      { participantId: "alex", quantity: 1 },
    ]);
  });

  it("loads legacy DTOs without allocationType", () => {
    const dto: SplitSessionDto = {
      id: "session-1",
      title: "Dinner",
      mode: "hybrid",
      restaurantName: "Cafe",
      subtotal: 12,
      tax: 0,
      tip: 0,
      total: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participants: [
        { id: "alex", displayName: "Alex" },
        { id: "sam", displayName: "Sam" },
      ],
      receiptItems: [
        {
          id: "item-1",
          name: "Fries",
          quantity: 1,
          unitPrice: null,
          totalPrice: 12,
          itemAssignments: [
            {
              id: "a1",
              participantId: "alex",
              shareQuantity: null,
              amount: 6,
            },
            {
              id: "a2",
              participantId: "sam",
              shareQuantity: null,
              amount: 6,
            },
          ],
        },
      ],
      payments: [],
    };

    const session = apiDtoToSplitSession(dto);
    expect(session.items[0].quantity).toBe(1);
    expect(session.items[0].sharedAllocation).toEqual({
      quantity: 1,
      participantIds: ["alex", "sam"],
    });
    expect(session.summary.difference).toBe(0);
  });
});

describe("save round-trip fields", () => {
  it("writes quantity, unitPrice, allocationType, and cent-safe amounts", () => {
    const item = createEmptyReceiptItem("potato", "Potato", 12, 3);
    item.individualAllocations = [
      { participantId: "alex", quantity: 2 },
      { participantId: "sam", quantity: 1 },
    ];

    const session: SplitSession = {
      id: "local-1",
      title: "Test",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      restaurantName: "",
      receiptImageKey: "receipts/abc.jpg",
      receiptImageUrl: "https://example.com/receipts/abc.jpg",
      mode: "itemized",
      people: [
        { id: "alex", name: "Alex" },
        { id: "sam", name: "Sam" },
      ],
      items: [item],
      billTotal: 12,
      tax: 0,
      tip: 0,
      tipMode: "fixed",
      tipPercent: 18,
      customTip: 0,
      personTotals: [],
      summary: {
        subtotal: 12,
        tax: 0,
        tip: 0,
        finalTotal: 12,
        sumOfPeopleTotals: 12,
        difference: 0,
      },
    };

    const request = splitSessionToCreateRequest(session);
    const savedItem = request.receiptItems[0];

    expect(request.receiptImageKey).toBe("receipts/abc.jpg");
    expect(savedItem.quantity).toBe(3);
    expect(savedItem.unitPrice).toBe(4);
    expect(savedItem.totalPrice).toBe(12);
    expect(savedItem.itemAssignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participantId: "alex",
          shareQuantity: 2,
          allocationType: "INDIVIDUAL",
          amount: 8,
        }),
        expect.objectContaining({
          participantId: "sam",
          shareQuantity: 1,
          allocationType: "INDIVIDUAL",
          amount: 4,
        }),
      ]),
    );
  });

  it("loads DTOs without receipt image fields", () => {
    const dto: SplitSessionDto = {
      id: "session-2",
      title: "Legacy",
      mode: "even",
      restaurantName: null,
      subtotal: 20,
      tax: 0,
      tip: 0,
      total: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participants: [
        { id: "a", displayName: "A" },
        { id: "b", displayName: "B" },
      ],
      receiptItems: [],
      payments: [],
    };

    const session = apiDtoToSplitSession(dto);
    expect(session.receiptImageKey).toBeNull();
    expect(session.receiptImageUrl).toBeNull();
  });
});
