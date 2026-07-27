import { AllocationType, PaymentStatus, Prisma, SplitType } from "@prisma/client";

import { prisma } from "../db/prisma";
import {
  mapSplitSessionToDto,
  splitSessionDtoInclude,
} from "../dto/splitSessionDto";
import type {
  CreateSplitSessionRequest,
  UpdateSplitSessionRequest,
} from "../../../shared/types/splitSession";

type UnknownRecord = Record<string, unknown>;

type NormalizedParticipant = {
  key: string;
  userId?: string;
  displayName: string;
};

type NormalizedReceiptItem = {
  key: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  totalPrice: number;
  itemAssignments: NormalizedItemAssignment[];
};

type NormalizedItemAssignment = {
  receiptItemKey?: string;
  participantKey: string;
  shareQuantity?: number;
  allocationType: AllocationType;
  amount: number;
};

type NormalizedPayment = {
  fromParticipantKey: string;
  toParticipantKey: string;
  amount: number;
  status?: PaymentStatus;
  note?: string;
};

type NormalizedSplitSessionInput = {
  title: string;
  splitType: SplitType;
  restaurantName?: string;
  receiptImageKey?: string;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  participants: NormalizedParticipant[];
  receiptItems: NormalizedReceiptItem[];
  itemAssignments: NormalizedItemAssignment[];
  payments: NormalizedPayment[];
};

export class SplitSessionValidationError extends Error {
  statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "SplitSessionValidationError";
  }
}

export class SplitSessionNotFoundError extends Error {
  statusCode = 404;

  constructor(id: string) {
    super(`Split session not found: ${id}`);
    this.name = "SplitSessionNotFoundError";
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requiredNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new SplitSessionValidationError(`${fieldName} must be a number.`);
  }

  return value;
}

function optionalNumber(value: unknown, fieldName: string): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return requiredNumber(value, fieldName);
}

function keyFromRecord(
  record: UnknownRecord,
  fallback: string,
  acceptedFields: string[],
): string {
  for (const field of acceptedFields) {
    const value = optionalString(record[field]);
    if (value) {
      return value;
    }
  }

  return fallback;
}

function normalizeSplitType(value: unknown): SplitType {
  const mode = optionalString(value);
  if (!mode) {
    throw new SplitSessionValidationError("mode is required.");
  }

  const normalizedMode = mode.toUpperCase().replace(/-/g, "_");
  if (
    normalizedMode === SplitType.EVEN ||
    normalizedMode === SplitType.ITEMIZED ||
    normalizedMode === SplitType.HYBRID
  ) {
    return normalizedMode;
  }

  throw new SplitSessionValidationError(
    "mode must be one of: even, itemized, hybrid.",
  );
}

function normalizePaymentStatus(value: unknown): PaymentStatus | undefined {
  const status = optionalString(value);
  if (!status) {
    return undefined;
  }

  const normalizedStatus = status.toUpperCase();
  if (
    normalizedStatus === PaymentStatus.PENDING ||
    normalizedStatus === PaymentStatus.COMPLETED ||
    normalizedStatus === PaymentStatus.CANCELED
  ) {
    return normalizedStatus;
  }

  throw new SplitSessionValidationError(
    "payment status must be one of: pending, completed, canceled.",
  );
}

function generateDefaultTitle(input: {
  restaurantName?: string;
  receiptItems: unknown[];
}): string {
  if (input.restaurantName) {
    return input.restaurantName;
  }

  const prefix = input.receiptItems.length > 0 ? "Receipt Split" : "Manual Split";
  return `${prefix} - ${new Date().toISOString()}`;
}

function normalizeParticipants(value: unknown): NormalizedParticipant[] {
  if (!Array.isArray(value)) {
    throw new SplitSessionValidationError("participants must be an array.");
  }

  return value.map((participant, index) => {
    if (!isRecord(participant)) {
      throw new SplitSessionValidationError(
        `participants[${index}] must be an object.`,
      );
    }

    const displayName =
      optionalString(participant.displayName) ??
      optionalString(participant.name);

    if (!displayName) {
      throw new SplitSessionValidationError(
        `participants[${index}].displayName is required.`,
      );
    }

    return {
      key: keyFromRecord(participant, `participant:${index}`, [
        "id",
        "clientId",
        "localId",
      ]),
      userId: optionalString(participant.userId),
      displayName,
    };
  });
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function normalizeAllocationType(
  value: unknown,
  indexLabel: string,
): AllocationType {
  if (value === undefined || value === null || value === "") {
    return AllocationType.INDIVIDUAL;
  }

  if (typeof value !== "string") {
    throw new SplitSessionValidationError(
      `${indexLabel}.allocationType must be a string.`,
    );
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === AllocationType.INDIVIDUAL) {
    return AllocationType.INDIVIDUAL;
  }
  if (normalized === AllocationType.SHARED) {
    return AllocationType.SHARED;
  }

  throw new SplitSessionValidationError(
    `${indexLabel}.allocationType must be INDIVIDUAL or SHARED.`,
  );
}

function normalizeItemAssignment(
  value: unknown,
  indexLabel: string,
  receiptItemKey?: string,
): NormalizedItemAssignment {
  if (!isRecord(value)) {
    throw new SplitSessionValidationError(`${indexLabel} must be an object.`);
  }

  const participantKey =
    optionalString(value.participantId) ??
    optionalString(value.participantClientId) ??
    optionalString(value.participantLocalId);

  if (!participantKey) {
    throw new SplitSessionValidationError(
      `${indexLabel}.participantId is required.`,
    );
  }

  const shareQuantity = optionalNumber(
    value.shareQuantity,
    `${indexLabel}.shareQuantity`,
  );

  if (
    shareQuantity !== undefined &&
    (!Number.isInteger(shareQuantity) || shareQuantity < 0)
  ) {
    throw new SplitSessionValidationError(
      `${indexLabel}.shareQuantity must be a whole number >= 0.`,
    );
  }

  return {
    receiptItemKey:
      receiptItemKey ??
      optionalString(value.receiptItemId) ??
      optionalString(value.receiptItemClientId) ??
      optionalString(value.receiptItemLocalId),
    participantKey,
    shareQuantity,
    allocationType: normalizeAllocationType(
      value.allocationType,
      indexLabel,
    ),
    amount: requiredNumber(value.amount, `${indexLabel}.amount`),
  };
}

function normalizeReceiptItems(value: unknown): NormalizedReceiptItem[] {
  if (!Array.isArray(value)) {
    throw new SplitSessionValidationError("receiptItems must be an array.");
  }

  return value.map((receiptItem, index) => {
    if (!isRecord(receiptItem)) {
      throw new SplitSessionValidationError(
        `receiptItems[${index}] must be an object.`,
      );
    }

    const name = optionalString(receiptItem.name);
    if (!name) {
      throw new SplitSessionValidationError(
        `receiptItems[${index}].name is required.`,
      );
    }

    const key = keyFromRecord(receiptItem, `receiptItem:${index}`, [
      "id",
      "clientId",
      "localId",
    ]);

    const rawAssignments =
      receiptItem.itemAssignments ?? receiptItem.assignments ?? [];
    if (!Array.isArray(rawAssignments)) {
      throw new SplitSessionValidationError(
        `receiptItems[${index}].itemAssignments must be an array when present.`,
      );
    }

    const quantity =
      optionalNumber(receiptItem.quantity, `receiptItems[${index}].quantity`) ??
      1;

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new SplitSessionValidationError(
        `receiptItems[${index}].quantity must be a whole number of at least 1.`,
      );
    }

    const itemAssignments = rawAssignments.map((assignment, assignmentIndex) =>
      normalizeItemAssignment(
        assignment,
        `receiptItems[${index}].itemAssignments[${assignmentIndex}]`,
        key,
      ),
    );

    const normalizedItem: NormalizedReceiptItem = {
      key,
      name,
      quantity,
      unitPrice: optionalNumber(
        receiptItem.unitPrice,
        `receiptItems[${index}].unitPrice`,
      ),
      totalPrice: requiredNumber(
        receiptItem.totalPrice ?? receiptItem.price,
        `receiptItems[${index}].totalPrice`,
      ),
      itemAssignments,
    };

    validateReceiptItemAssignments(normalizedItem, index);

    return normalizedItem;
  });
}

function validateReceiptItemAssignments(
  item: NormalizedReceiptItem,
  index: number,
): void {
  const label = `receiptItems[${index}]`;
  const totalCents = toCents(item.totalPrice);
  let amountCents = 0;
  let individualUnits = 0;
  let sharedUnits: number | null = null;

  for (const assignment of item.itemAssignments) {
    if (assignment.amount < 0) {
      throw new SplitSessionValidationError(
        `${label} assignment amounts must be >= 0.`,
      );
    }

    amountCents += toCents(assignment.amount);
    const shareQuantity = assignment.shareQuantity ?? 0;

    if (assignment.allocationType === AllocationType.INDIVIDUAL) {
      individualUnits += shareQuantity;
    } else {
      if (sharedUnits === null) {
        sharedUnits = shareQuantity;
      } else if (sharedUnits !== shareQuantity) {
        throw new SplitSessionValidationError(
          `${label} shared assignments must use the same shareQuantity.`,
        );
      }
    }
  }

  const shared = sharedUnits ?? 0;
  if (individualUnits + shared > item.quantity) {
    throw new SplitSessionValidationError(
      `${label} is over-assigned (${individualUnits + shared} of ${item.quantity}).`,
    );
  }

  if (
    item.itemAssignments.length > 0 &&
    individualUnits + shared !== item.quantity
  ) {
    throw new SplitSessionValidationError(
      `${label} must assign all units (${individualUnits + shared} of ${item.quantity}).`,
    );
  }

  if (item.itemAssignments.length > 0 && amountCents !== totalCents) {
    throw new SplitSessionValidationError(
      `${label} assignment amounts must sum exactly to totalPrice.`,
    );
  }
}

function normalizeTopLevelItemAssignments(
  value: unknown,
): NormalizedItemAssignment[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new SplitSessionValidationError("itemAssignments must be an array.");
  }

  return value.map((assignment, index) =>
    normalizeItemAssignment(assignment, `itemAssignments[${index}]`),
  );
}

function normalizePayments(value: unknown): NormalizedPayment[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new SplitSessionValidationError("payments must be an array.");
  }

  return value.map((payment, index) => {
    if (!isRecord(payment)) {
      throw new SplitSessionValidationError(`payments[${index}] must be an object.`);
    }

    const fromParticipantKey =
      optionalString(payment.fromParticipantId) ??
      optionalString(payment.fromParticipantClientId) ??
      optionalString(payment.fromParticipantLocalId);
    const toParticipantKey =
      optionalString(payment.toParticipantId) ??
      optionalString(payment.toParticipantClientId) ??
      optionalString(payment.toParticipantLocalId);

    if (!fromParticipantKey || !toParticipantKey) {
      throw new SplitSessionValidationError(
        `payments[${index}] must include fromParticipantId and toParticipantId.`,
      );
    }

    return {
      fromParticipantKey,
      toParticipantKey,
      amount: requiredNumber(payment.amount, `payments[${index}].amount`),
      status: normalizePaymentStatus(payment.status),
      note: optionalString(payment.note),
    };
  });
}

function normalizeSplitSessionInput(body: unknown): NormalizedSplitSessionInput {
  if (!isRecord(body)) {
    throw new SplitSessionValidationError("Request body must be an object.");
  }

  const restaurantName = optionalString(body.restaurantName);
  const participants = normalizeParticipants(body.participants);
  const receiptItems = normalizeReceiptItems(body.receiptItems);
  const title =
    optionalString(body.title) ??
    generateDefaultTitle({ restaurantName, receiptItems });

  return {
    title,
    splitType: normalizeSplitType(body.mode ?? body.splitType),
    restaurantName,
    receiptImageKey: optionalString(body.receiptImageKey),
    subtotal: requiredNumber(body.subtotal, "subtotal"),
    tax: requiredNumber(body.tax, "tax"),
    tip: requiredNumber(body.tip, "tip"),
    total: requiredNumber(body.total, "total"),
    participants,
    receiptItems,
    itemAssignments: normalizeTopLevelItemAssignments(body.itemAssignments),
    payments: normalizePayments(body.payments),
  };
}

function requireMappedId(
  map: Map<string, string>,
  key: string | undefined,
  label: string,
): string {
  if (!key) {
    throw new SplitSessionValidationError(`${label} is required.`);
  }

  const mappedId = map.get(key);
  if (!mappedId) {
    throw new SplitSessionValidationError(`${label} does not match a saved record.`);
  }

  return mappedId;
}

async function replaceNestedRecords(
  tx: Prisma.TransactionClient,
  splitSessionId: string,
  input: NormalizedSplitSessionInput,
) {
  const participantIdsByKey = new Map<string, string>();
  const receiptItemIdsByKey = new Map<string, string>();

  for (const participant of input.participants) {
    const createdParticipant = await tx.participant.create({
      data: {
        splitSessionId,
        userId: participant.userId,
        displayName: participant.displayName,
      },
    });

    participantIdsByKey.set(participant.key, createdParticipant.id);
  }

  for (const receiptItem of input.receiptItems) {
    const createdReceiptItem = await tx.receiptItem.create({
      data: {
        splitSessionId,
        name: receiptItem.name,
        quantity: receiptItem.quantity,
        unitPrice: receiptItem.unitPrice,
        totalPrice: receiptItem.totalPrice,
      },
    });

    receiptItemIdsByKey.set(receiptItem.key, createdReceiptItem.id);
  }

  const itemAssignments = [
    ...input.receiptItems.flatMap((receiptItem) => receiptItem.itemAssignments),
    ...input.itemAssignments,
  ];

  for (const assignment of itemAssignments) {
    await tx.itemAssignment.create({
      data: {
        receiptItemId: requireMappedId(
          receiptItemIdsByKey,
          assignment.receiptItemKey,
          "item assignment receiptItemId",
        ),
        participantId: requireMappedId(
          participantIdsByKey,
          assignment.participantKey,
          "item assignment participantId",
        ),
        shareQuantity: assignment.shareQuantity,
        allocationType: assignment.allocationType,
        amount: assignment.amount,
      },
    });
  }

  for (const payment of input.payments) {
    await tx.payment.create({
      data: {
        splitSessionId,
        fromParticipantId: requireMappedId(
          participantIdsByKey,
          payment.fromParticipantKey,
          "payment fromParticipantId",
        ),
        toParticipantId: requireMappedId(
          participantIdsByKey,
          payment.toParticipantKey,
          "payment toParticipantId",
        ),
        amount: payment.amount,
        status: payment.status,
        note: payment.note,
      },
    });
  }
}

export async function listSplitSessions(ownerUserId: string) {
  const splitSessions = await prisma.splitSession.findMany({
    where: { ownerUserId },
    include: splitSessionDtoInclude,
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(splitSessions.map(mapSplitSessionToDto));
}

export async function getSplitSessionById(id: string, ownerUserId: string) {
  const splitSession = await prisma.splitSession.findFirst({
    where: { id, ownerUserId },
    include: splitSessionDtoInclude,
  });

  if (!splitSession) {
    throw new SplitSessionNotFoundError(id);
  }

  return mapSplitSessionToDto(splitSession);
}

export async function createSplitSession(
  body: CreateSplitSessionRequest,
  ownerUserId: string,
) {
  const input = normalizeSplitSessionInput(body);

  const splitSession = await prisma.$transaction(async (tx) => {
    const createdSplitSession = await tx.splitSession.create({
      data: {
        ownerUserId,
        title: input.title,
        splitType: input.splitType,
        restaurantName: input.restaurantName,
        receiptImageKey: input.receiptImageKey,
        subtotal: input.subtotal,
        tax: input.tax,
        tip: input.tip,
        total: input.total,
      },
    });

    await replaceNestedRecords(tx, createdSplitSession.id, input);

    return tx.splitSession.findUniqueOrThrow({
      where: { id: createdSplitSession.id },
      include: splitSessionDtoInclude,
    });
  });

  return mapSplitSessionToDto(splitSession);
}

export async function updateSplitSession(
  id: string,
  body: UpdateSplitSessionRequest,
  ownerUserId: string,
) {
  const input = normalizeSplitSessionInput(body);

  const splitSession = await prisma.$transaction(async (tx) => {
    const existingSplitSession = await tx.splitSession.findFirst({
      where: { id, ownerUserId },
      select: { id: true },
    });

    if (!existingSplitSession) {
      throw new SplitSessionNotFoundError(id);
    }

    await tx.payment.deleteMany({ where: { splitSessionId: id } });
    await tx.itemAssignment.deleteMany({
      where: { receiptItem: { splitSessionId: id } },
    });
    await tx.receiptItem.deleteMany({ where: { splitSessionId: id } });
    await tx.participant.deleteMany({ where: { splitSessionId: id } });

    await tx.splitSession.update({
      where: { id },
      data: {
        ownerUserId,
        title: input.title,
        splitType: input.splitType,
        restaurantName: input.restaurantName,
        receiptImageKey: input.receiptImageKey ?? null,
        subtotal: input.subtotal,
        tax: input.tax,
        tip: input.tip,
        total: input.total,
      },
    });

    await replaceNestedRecords(tx, id, input);

    return tx.splitSession.findUniqueOrThrow({
      where: { id },
      include: splitSessionDtoInclude,
    });
  });

  return mapSplitSessionToDto(splitSession);
}

export async function deleteSplitSession(id: string, ownerUserId: string) {
  const deleteResult = await prisma.splitSession.deleteMany({
    where: { id, ownerUserId },
  });

  if (deleteResult.count === 0) {
    throw new SplitSessionNotFoundError(id);
  }
}
