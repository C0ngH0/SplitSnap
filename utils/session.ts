import type { SplitSession, TipMode } from "../types/split";
import { createId, formatSavedDate } from "./format";

function cleanRestaurantName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

/**
 * OCR frequently returns header junk (phone numbers, order ids, divider rows)
 * as the merchant name. Reject anything that does not read like a real name so
 * the caller can fall back to a generated title.
 */
export function getValidRestaurantName(name: string) {
  const cleaned = cleanRestaurantName(name);

  if (cleaned.length < 3) {
    return "";
  }

  const characters = cleaned.replace(/\s/g, "");
  if (characters.length === 0) {
    return "";
  }

  const numberCount = (characters.match(/\d/g) ?? []).length;
  const letterCount = (characters.match(/[a-z]/gi) ?? []).length;
  const symbolCount = characters.length - numberCount - letterCount;
  const mostlyNumbers = numberCount / characters.length > 0.5;
  const mostlySymbols = symbolCount / characters.length > 0.5;

  if (mostlyNumbers || mostlySymbols || letterCount === 0) {
    return "";
  }

  return cleaned;
}

export function buildSessionTitle(
  restaurantName: string,
  createdAt: string,
  hasReceipt: boolean,
) {
  const validRestaurantName = getValidRestaurantName(restaurantName);

  if (validRestaurantName) {
    return validRestaurantName;
  }

  return `${hasReceipt ? "Receipt" : "Manual"} Split - ${formatSavedDate(
    createdAt,
  )}`;
}

export type NormalizeSessionContext = {
  /** Restaurant name from the live OCR result, if the draft still has one. */
  currentRestaurantName: string;
  hasReceipt: boolean;
  fallbackTipMode: TipMode;
  fallbackTipPercent: number;
  fallbackCustomTip: number;
};

/**
 * Fill in the fields the API requires before a save.
 *
 * The `id` is deliberately preserved when present: `saveSplitSession` decides
 * between POST and PUT by testing whether it is a server UUID, so overwriting
 * it here would create a duplicate row on every re-save.
 */
export function normalizeSessionForSave(
  sourceSession: SplitSession,
  updatedAt: string,
  context: NormalizeSessionContext,
): SplitSession {
  const createdAt = sourceSession.createdAt || updatedAt;
  const restaurantName = getValidRestaurantName(
    context.currentRestaurantName || sourceSession.restaurantName || "",
  );

  return {
    id: sourceSession.id || createId(),
    title:
      sourceSession.title ||
      buildSessionTitle(restaurantName, createdAt, context.hasReceipt),
    createdAt,
    updatedAt,
    restaurantName,
    paymentStatus: sourceSession.paymentStatus,
    mode: sourceSession.mode,
    people: sourceSession.people,
    items: sourceSession.items,
    billTotal: sourceSession.billTotal,
    tax: sourceSession.tax,
    tip: sourceSession.tip,
    tipMode: sourceSession.tipMode || context.fallbackTipMode,
    tipPercent: sourceSession.tipPercent ?? context.fallbackTipPercent,
    customTip: sourceSession.customTip ?? context.fallbackCustomTip,
    personTotals: sourceSession.personTotals,
    summary: sourceSession.summary,
  };
}
