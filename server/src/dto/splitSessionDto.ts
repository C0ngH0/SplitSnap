import { Prisma } from "@prisma/client";

import type {
  SplitMode,
  SplitSessionDto,
} from "../../../shared/types/splitSession";
import { getReceiptImageViewUrl } from "../services/receiptImageStorage";

export const splitSessionDtoInclude = {
  participants: {
    orderBy: { createdAt: "asc" },
  },
  receiptItems: {
    include: {
      assignments: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  payments: {
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.SplitSessionInclude;

type SplitSessionWithRelations = Prisma.SplitSessionGetPayload<{
  include: typeof splitSessionDtoInclude;
}>;

function toNumber(value: Prisma.Decimal | number | null): number | null {
  if (value === null) {
    return null;
  }

  return Number(value);
}

function toIsoString(value: Date): string {
  return value.toISOString();
}

function toSplitMode(value: string): SplitMode {
  return value.toLowerCase() as SplitMode;
}

export async function mapSplitSessionToDto(
  splitSession: SplitSessionWithRelations,
): Promise<SplitSessionDto> {
  const receiptImageKey = splitSession.receiptImageKey;
  const receiptImageUrl = await getReceiptImageViewUrl(receiptImageKey);

  return {
    id: splitSession.id,
    title: splitSession.title,
    mode: toSplitMode(splitSession.splitType),
    restaurantName: splitSession.restaurantName,
    receiptImageKey: receiptImageKey ?? null,
    receiptImageUrl,
    subtotal: toNumber(splitSession.subtotal),
    tax: toNumber(splitSession.tax),
    tip: toNumber(splitSession.tip),
    total: toNumber(splitSession.total),
    createdAt: toIsoString(splitSession.createdAt),
    updatedAt: toIsoString(splitSession.updatedAt),
    participants: splitSession.participants.map((participant) => ({
      id: participant.id,
      displayName: participant.displayName,
    })),
    receiptItems: splitSession.receiptItems.map((receiptItem) => ({
      id: receiptItem.id,
      name: receiptItem.name,
      quantity: toNumber(receiptItem.quantity),
      unitPrice: toNumber(receiptItem.unitPrice),
      totalPrice: toNumber(receiptItem.totalPrice),
      itemAssignments: receiptItem.assignments.map((assignment) => ({
        id: assignment.id,
        participantId: assignment.participantId,
        shareQuantity: toNumber(assignment.shareQuantity),
        amount: toNumber(assignment.amount),
        allocationType: assignment.allocationType,
      })),
    })),
    payments: splitSession.payments.map((payment) => ({
      id: payment.id,
      fromParticipantId: payment.fromParticipantId,
      toParticipantId: payment.toParticipantId,
      amount: toNumber(payment.amount),
      status: payment.status,
      note: payment.note,
    })),
  };
}
