import type {
  ItemAllocation,
  ReceiptItem,
  SharedAllocation,
} from "../types/split";
import {
  deriveUnitPrice,
  round2,
  totalFromUnitPrice,
} from "./money";

export function createEmptyReceiptItem(
  id: string,
  name: string,
  totalPrice: number,
  quantity = 1,
): ReceiptItem {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const safeTotal = round2(totalPrice);

  return {
    id,
    name,
    quantity: safeQuantity,
    unitPrice: deriveUnitPrice(safeTotal, safeQuantity),
    totalPrice: safeTotal,
    individualAllocations: [],
    sharedAllocation: null,
  };
}

export function assignedUnitCount(item: ReceiptItem): number {
  const individual = item.individualAllocations.reduce(
    (sum, allocation) => sum + allocation.quantity,
    0,
  );
  const shared = item.sharedAllocation?.quantity ?? 0;
  return individual + shared;
}

export function remainingUnitCount(item: ReceiptItem): number {
  return item.quantity - assignedUnitCount(item);
}

export function clearItemAssignments(item: ReceiptItem): ReceiptItem {
  return {
    ...item,
    individualAllocations: [],
    sharedAllocation: null,
  };
}

/** Effective participant ids for qty-1 chip UI. */
export function getAssignedParticipantIds(item: ReceiptItem): string[] {
  if (item.sharedAllocation && item.sharedAllocation.participantIds.length > 0) {
    return [...item.sharedAllocation.participantIds];
  }

  return item.individualAllocations.map((allocation) => allocation.participantId);
}

export function isParticipantAssigned(
  item: ReceiptItem,
  personId: string,
): boolean {
  return getAssignedParticipantIds(item).includes(personId);
}

/**
 * Hybrid qty 1 chip behavior:
 * 0 selected → clear
 * 1 selected → individual
 * 2+ selected → shared pool of 1
 */
export function toggleHybridQuantityOneAssignment(
  item: ReceiptItem,
  personId: string,
): ReceiptItem {
  const current = getAssignedParticipantIds(item);
  const isSelected = current.includes(personId);
  const next = isSelected
    ? current.filter((id) => id !== personId)
    : [...current, personId];

  if (next.length === 0) {
    return clearItemAssignments(item);
  }

  if (next.length === 1) {
    return {
      ...item,
      individualAllocations: [{ participantId: next[0], quantity: 1 }],
      sharedAllocation: null,
    };
  }

  return {
    ...item,
    individualAllocations: [],
    sharedAllocation: {
      quantity: 1,
      participantIds: next,
    },
  };
}

/** Itemized qty 1: selecting replaces the sole owner. */
export function setItemizedSoleOwner(
  item: ReceiptItem,
  personId: string,
): ReceiptItem {
  return {
    ...item,
    individualAllocations: [{ participantId: personId, quantity: item.quantity }],
    sharedAllocation: null,
  };
}

function upsertIndividualAllocation(
  allocations: ItemAllocation[],
  participantId: string,
  quantity: number,
): ItemAllocation[] {
  const without = allocations.filter(
    (allocation) => allocation.participantId !== participantId,
  );

  if (quantity <= 0) {
    return without;
  }

  return [...without, { participantId, quantity }];
}

/**
 * Set an individual unit count for a participant.
 * Does not touch shared allocation except when the new total would overflow;
 * callers should pass a clamped quantity.
 */
export function setIndividualQuantity(
  item: ReceiptItem,
  participantId: string,
  quantity: number,
): ReceiptItem {
  const nextQuantity = Math.max(0, Math.floor(quantity));
  const others = item.individualAllocations
    .filter((allocation) => allocation.participantId !== participantId)
    .reduce((sum, allocation) => sum + allocation.quantity, 0);
  const sharedQty = item.sharedAllocation?.quantity ?? 0;
  const maxAllowed = item.quantity - sharedQty - others;
  const clamped = Math.min(nextQuantity, Math.max(0, maxAllowed));

  return {
    ...item,
    individualAllocations: upsertIndividualAllocation(
      item.individualAllocations,
      participantId,
      clamped,
    ),
  };
}

export function getIndividualQuantity(
  item: ReceiptItem,
  participantId: string,
): number {
  return (
    item.individualAllocations.find(
      (allocation) => allocation.participantId === participantId,
    )?.quantity ?? 0
  );
}

export function setSharedAllocation(
  item: ReceiptItem,
  shared: SharedAllocation | null,
): ReceiptItem {
  if (!shared || shared.quantity <= 0 || shared.participantIds.length === 0) {
    return { ...item, sharedAllocation: null };
  }

  const individualSum = item.individualAllocations.reduce(
    (sum, allocation) => sum + allocation.quantity,
    0,
  );
  const maxShared = Math.max(0, item.quantity - individualSum);
  const quantity = Math.min(Math.floor(shared.quantity), maxShared);

  if (quantity <= 0 || shared.participantIds.length === 0) {
    return { ...item, sharedAllocation: null };
  }

  return {
    ...item,
    sharedAllocation: {
      quantity,
      participantIds: [...shared.participantIds],
    },
  };
}

export function toggleSharedParticipant(
  item: ReceiptItem,
  personId: string,
): ReceiptItem {
  const shared = item.sharedAllocation;
  if (!shared || shared.quantity <= 0) {
    const remaining = remainingUnitCount(item);
    if (remaining <= 0) {
      return item;
    }

    return setSharedAllocation(item, {
      quantity: remaining,
      participantIds: [personId],
    });
  }

  const isSelected = shared.participantIds.includes(personId);
  const participantIds = isSelected
    ? shared.participantIds.filter((id) => id !== personId)
    : [...shared.participantIds, personId];

  if (participantIds.length === 0) {
    return { ...item, sharedAllocation: null };
  }

  return setSharedAllocation(item, {
    quantity: shared.quantity,
    participantIds,
  });
}

export function setSharedQuantity(
  item: ReceiptItem,
  quantity: number,
): ReceiptItem {
  const individualSum = item.individualAllocations.reduce(
    (sum, allocation) => sum + allocation.quantity,
    0,
  );
  const maxShared = Math.max(0, item.quantity - individualSum);
  const nextQty = Math.min(Math.max(0, Math.floor(quantity)), maxShared);
  const participantIds = item.sharedAllocation?.participantIds ?? [];

  if (nextQty <= 0) {
    return { ...item, sharedAllocation: null };
  }

  if (participantIds.length === 0) {
    return {
      ...item,
      sharedAllocation: { quantity: nextQty, participantIds: [] },
    };
  }

  return setSharedAllocation(item, {
    quantity: nextQty,
    participantIds,
  });
}

/**
 * Apply a new whole-number quantity.
 * If lowered below currently assigned units, clear assignments.
 */
export function withQuantity(item: ReceiptItem, quantity: number): ReceiptItem {
  const nextQuantity = Math.max(1, Math.floor(quantity));
  const assigned = assignedUnitCount(item);
  const unitPrice = deriveUnitPrice(item.totalPrice, nextQuantity);

  if (nextQuantity < assigned) {
    return {
      ...item,
      quantity: nextQuantity,
      unitPrice,
      individualAllocations: [],
      sharedAllocation: null,
    };
  }

  return {
    ...item,
    quantity: nextQuantity,
    unitPrice,
  };
}

/** totalPrice is authoritative; refresh derived unitPrice. */
export function withTotalPrice(
  item: ReceiptItem,
  totalPrice: number,
): ReceiptItem {
  const nextTotal = round2(totalPrice);
  return {
    ...item,
    totalPrice: nextTotal,
    unitPrice: deriveUnitPrice(nextTotal, item.quantity),
  };
}

/**
 * Manual unitPrice edit updates totalPrice = unitPrice × quantity (cent-safe).
 */
export function withUnitPrice(item: ReceiptItem, unitPrice: number): ReceiptItem {
  const nextUnit = round2(unitPrice);
  return {
    ...item,
    unitPrice: nextUnit,
    totalPrice: totalFromUnitPrice(nextUnit, item.quantity),
  };
}

export function removeParticipantFromItem(
  item: ReceiptItem,
  personId: string,
): ReceiptItem {
  const individualAllocations = item.individualAllocations.filter(
    (allocation) => allocation.participantId !== personId,
  );

  let sharedAllocation = item.sharedAllocation;
  if (sharedAllocation) {
    const participantIds = sharedAllocation.participantIds.filter(
      (id) => id !== personId,
    );
    sharedAllocation =
      participantIds.length === 0
        ? null
        : { ...sharedAllocation, participantIds };
  }

  return {
    ...item,
    individualAllocations,
    sharedAllocation,
  };
}
