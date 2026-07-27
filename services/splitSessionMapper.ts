import type {
  CreateSplitSessionRequest,
  ItemAssignmentDto,
  ReceiptItemDto,
  SplitSessionDto,
  UpdateSplitSessionRequest,
} from "../shared/types/splitSession";
import type {
  Person,
  ReceiptItem,
  SplitSession,
} from "../types/split";
import { TIP_PERCENT_PRESETS } from "../types/split";
import { createEmptyReceiptItem } from "../utils/itemAllocations";
import { fromCents, round2 } from "../utils/money";
import {
  calculateEvenSplit,
  calculateHybridSplit,
  calculateItemizedSplit,
  computeItemAssignments,
} from "../utils/splitCalculator";

const DEFAULT_TIP_PERCENT = 18;
const TIP_PERCENT_EPSILON = 0.005;

function valueOrZero(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mapDtoParticipants(dto: SplitSessionDto): Person[] {
  return dto.participants.map((participant) => ({
    id: participant.id,
    name: participant.displayName,
  }));
}

function rebuildAllocationsFromAssignments(
  quantity: number,
  assignments: ItemAssignmentDto[],
  mode: SplitSessionDto["mode"],
): Pick<ReceiptItem, "individualAllocations" | "sharedAllocation"> {
  const individualAllocations: ReceiptItem["individualAllocations"] = [];
  let sharedAllocation: ReceiptItem["sharedAllocation"] = null;

  const typed = assignments.filter(
    (assignment) => assignment.allocationType != null,
  );

  if (typed.length > 0) {
    for (const assignment of assignments) {
      const shareQuantity = valueOrZero(assignment.shareQuantity);
      if (shareQuantity <= 0) {
        continue;
      }

      if (assignment.allocationType === "SHARED") {
        if (!sharedAllocation) {
          sharedAllocation = {
            quantity: shareQuantity,
            participantIds: [assignment.participantId],
          };
        } else if (
          !sharedAllocation.participantIds.includes(assignment.participantId)
        ) {
          sharedAllocation.participantIds.push(assignment.participantId);
        }
      } else {
        individualAllocations.push({
          participantId: assignment.participantId,
          quantity: shareQuantity,
        });
      }
    }

    return { individualAllocations, sharedAllocation };
  }

  // Legacy: no allocationType. Reconstruct from assignee list.
  const participantIds = assignments.map(
    (assignment) => assignment.participantId,
  );

  if (participantIds.length === 0) {
    return { individualAllocations: [], sharedAllocation: null };
  }

  if (mode === "itemized" || participantIds.length === 1) {
    return {
      individualAllocations: [
        { participantId: participantIds[0], quantity },
      ],
      sharedAllocation: null,
    };
  }

  return {
    individualAllocations: [],
    sharedAllocation: {
      quantity,
      participantIds,
    },
  };
}

function mapDtoReceiptItems(
  dto: SplitSessionDto,
): ReceiptItem[] {
  return dto.receiptItems.map((receiptItem: ReceiptItemDto) => {
    const totalPrice = valueOrZero(receiptItem.totalPrice);
    const quantity = Math.max(
      1,
      Math.floor(valueOrZero(receiptItem.quantity) || 1),
    );
    const unitPrice =
      receiptItem.unitPrice != null && Number.isFinite(receiptItem.unitPrice)
        ? valueOrZero(receiptItem.unitPrice)
        : round2(totalPrice / quantity);
    const allocations = rebuildAllocationsFromAssignments(
      quantity,
      receiptItem.itemAssignments,
      dto.mode,
    );

    return {
      id: receiptItem.id,
      name: receiptItem.name,
      quantity,
      unitPrice,
      totalPrice,
      ...allocations,
    };
  });
}

function evenPreTipTotal(dto: SplitSessionDto): number {
  const tip = valueOrZero(dto.tip);
  const subtotal = valueOrZero(dto.subtotal);
  if (subtotal > 0) {
    return subtotal;
  }

  return Math.max(valueOrZero(dto.total) - tip, 0);
}

function calculateSessionResult(
  dto: SplitSessionDto,
  people: Person[],
  items: ReceiptItem[],
): Pick<SplitSession, "personTotals" | "summary"> {
  if (dto.mode === "even") {
    return calculateEvenSplit(
      evenPreTipTotal(dto),
      people,
      valueOrZero(dto.tip),
    );
  }

  if (dto.mode === "itemized") {
    return calculateItemizedSplit(
      items,
      people,
      valueOrZero(dto.tax),
      valueOrZero(dto.tip),
    );
  }

  return calculateHybridSplit(
    items,
    people,
    valueOrZero(dto.tax),
    valueOrZero(dto.tip),
  );
}

function inferTipPercent(subtotal: number, tip: number): number | null {
  if (subtotal <= 0 || tip < 0) {
    return null;
  }

  return (
    TIP_PERCENT_PRESETS.find(
      (preset) =>
        Math.abs(tip - (subtotal * preset) / 100) < TIP_PERCENT_EPSILON,
    ) ?? null
  );
}

export function apiDtoToSplitSession(dto: SplitSessionDto): SplitSession {
  const people = mapDtoParticipants(dto);
  const items = mapDtoReceiptItems(dto);
  const result = calculateSessionResult(dto, people, items);
  const tip = valueOrZero(dto.tip);
  const preTipTotal =
    dto.mode === "even" ? evenPreTipTotal(dto) : valueOrZero(dto.subtotal);
  const inferredTipPercent = inferTipPercent(
    dto.mode === "even" ? preTipTotal : valueOrZero(dto.subtotal),
    tip,
  );

  return {
    id: dto.id,
    title: dto.title,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    restaurantName: dto.restaurantName ?? "",
    receiptImageKey: dto.receiptImageKey ?? null,
    receiptImageUrl: dto.receiptImageUrl ?? null,
    mode: dto.mode,
    people,
    items,
    billTotal:
      dto.mode === "even" ? preTipTotal : valueOrZero(dto.total),
    tax: valueOrZero(dto.tax),
    tip,
    tipMode: inferredTipPercent === null ? "fixed" : "percentage",
    tipPercent: inferredTipPercent ?? DEFAULT_TIP_PERCENT,
    customTip: tip,
    personTotals: result.personTotals,
    summary: result.summary,
  };
}

export function splitSessionToCreateRequest(
  session: SplitSession,
): CreateSplitSessionRequest {
  return {
    title: session.title,
    mode: session.mode,
    restaurantName: session.restaurantName || undefined,
    receiptImageKey: session.receiptImageKey || undefined,
    subtotal: session.summary.subtotal,
    tax: session.tax,
    tip: session.tip,
    total: session.summary.finalTotal,
    participants: session.people.map((person) => ({
      clientId: person.id,
      displayName: person.name,
    })),
    receiptItems: session.items.map((item) => {
      const assignments = computeItemAssignments(item);

      return {
        clientId: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        itemAssignments: assignments.map((assignment) => ({
          participantId: assignment.participantId,
          shareQuantity: assignment.shareQuantity,
          allocationType: assignment.allocationType,
          amount: fromCents(assignment.amountCents),
        })),
      };
    }),
    payments: [],
  };
}

export function splitSessionToUpdateRequest(
  session: SplitSession,
): UpdateSplitSessionRequest {
  return splitSessionToCreateRequest(session);
}

/** Normalize legacy/partial items for local drafts (tests / defensive). */
export function normalizeLegacyReceiptItem(
  partial: {
    id: string;
    name: string;
    price?: number;
    totalPrice?: number;
    quantity?: number;
    assignedTo?: string[];
  },
): ReceiptItem {
  const totalPrice = partial.totalPrice ?? partial.price ?? 0;
  const quantity = Math.max(1, Math.floor(partial.quantity ?? 1));
  const item = createEmptyReceiptItem(
    partial.id,
    partial.name,
    totalPrice,
    quantity,
  );

  if (partial.assignedTo && partial.assignedTo.length === 1) {
    return {
      ...item,
      individualAllocations: [
        { participantId: partial.assignedTo[0], quantity },
      ],
    };
  }

  if (partial.assignedTo && partial.assignedTo.length > 1) {
    return {
      ...item,
      sharedAllocation: {
        quantity,
        participantIds: partial.assignedTo,
      },
    };
  }

  return item;
}
