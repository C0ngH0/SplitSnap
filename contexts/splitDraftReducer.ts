import type { ExtractedReceipt } from "../types/receipt";
import type {
  Person,
  ReceiptItem,
  SharedAllocation,
  SplitMode,
  SplitSession,
  TipMode,
} from "../types/split";
import {
  clearItemAssignments,
  createEmptyReceiptItem,
  removeParticipantFromItem,
  setIndividualQuantity,
  setItemizedSoleOwner,
  setSharedAllocation,
  setSharedQuantity,
  toggleHybridQuantityOneAssignment,
  toggleSharedParticipant,
  withQuantity,
  withTotalPrice,
  withUnitPrice,
} from "../utils/itemAllocations";
import {
  validateItemFields,
  validateParticipantName,
} from "../utils/splitCalculator";

export const INITIAL_MODE: SplitMode = "even";
export const INITIAL_TIP_PERCENT = 18;

export type SplitDraftState = {
  mode: SplitMode;
  people: Person[];
  items: ReceiptItem[];
  billTotal: string;
  tax: string;
  tipMode: TipMode;
  tipPercent: number;
  customTip: string;
  receiptImageUri: string | null;
  /** Durable storage key from OCR upload when available. */
  receiptImageKey: string | null;
  /** Remote (or local) URL used for saved-split preview. */
  receiptImageUrl: string | null;
  extractedReceipt: ExtractedReceipt | null;
  isExtracting: boolean;
  importMessage: string | null;
  session: SplitSession | null;
  error: string | null;
  savedStatus: string | null;
};

export const initialSplitDraftState: SplitDraftState = {
  mode: INITIAL_MODE,
  people: [],
  items: [],
  billTotal: "",
  tax: "",
  tipMode: "percentage",
  tipPercent: INITIAL_TIP_PERCENT,
  customTip: "",
  receiptImageUri: null,
  receiptImageKey: null,
  receiptImageUrl: null,
  extractedReceipt: null,
  isExtracting: false,
  importMessage: null,
  session: null,
  error: null,
  savedStatus: null,
};

/** True when the wizard holds user-entered progress worth confirming before discard. */
export function isSplitDraftDirty(state: SplitDraftState): boolean {
  return (
    state.people.length > 0 ||
    state.items.length > 0 ||
    state.billTotal.trim().length > 0 ||
    state.tax.trim().length > 0 ||
    state.customTip.trim().length > 0 ||
    state.receiptImageUri != null ||
    state.extractedReceipt != null ||
    state.session != null
  );
}

export type SplitDraftAction =
  | { type: "SET_MODE"; mode: SplitMode }
  | { type: "ADD_PERSON"; id: string; name: string }
  | { type: "UPDATE_PERSON"; personId: string; name: string }
  | { type: "REMOVE_PERSON"; personId: string }
  | {
      type: "ADD_ITEM";
      id: string;
      name: string;
      totalPrice: number;
      quantity?: number;
    }
  | {
      type: "UPDATE_ITEM";
      itemId: string;
      name: string;
      totalPrice: number;
      quantity?: number;
      unitPrice?: number;
    }
  | { type: "REMOVE_ITEM"; itemId: string }
  | { type: "TOGGLE_ASSIGNMENT"; itemId: string; personId: string }
  | {
      type: "SET_INDIVIDUAL_QUANTITY";
      itemId: string;
      personId: string;
      quantity: number;
    }
  | {
      type: "SET_SHARED_ALLOCATION";
      itemId: string;
      shared: SharedAllocation | null;
    }
  | { type: "SET_SHARED_QUANTITY"; itemId: string; quantity: number }
  | { type: "TOGGLE_SHARED_PARTICIPANT"; itemId: string; personId: string }
  | { type: "CLEAR_ITEM_ASSIGNMENTS"; itemId: string }
  | { type: "UPDATE_EXTRACTED_ITEM"; index: number; item: ExtractedReceipt["items"][number] }
  | { type: "SET_BILL_TOTAL"; value: string }
  | { type: "SET_TAX"; value: string }
  | { type: "SET_CUSTOM_TIP"; value: string }
  | { type: "SELECT_TIP_PRESET"; percent: number }
  | { type: "SELECT_CUSTOM_TIP_MODE" }
  | { type: "SET_RECEIPT_IMAGE"; uri: string }
  | { type: "REMOVE_RECEIPT_IMAGE" }
  | {
      type: "SET_RECEIPT_IMAGE_REMOTE";
      key: string | null;
      url: string | null;
    }
  | { type: "EXTRACT_START" }
  | { type: "EXTRACT_SUCCESS"; receipt: ExtractedReceipt }
  | { type: "EXTRACT_FAILURE"; message: string }
  | {
      type: "IMPORT_EXTRACTED";
      items: ReceiptItem[];
      tax: string;
      billTotal: string;
      message: string;
    }
  | { type: "CLEAR_IMPORT_MESSAGE" }
  | { type: "SET_SESSION"; session: SplitSession }
  | { type: "SET_ERROR"; message: string | null }
  | { type: "SET_SAVED_STATUS"; message: string | null }
  | { type: "LOAD_SAVED"; session: SplitSession }
  | { type: "RESET" };

/**
 * Any edit to the draft makes a previously calculated result stale, so results
 * and their status messages are dropped. The original implementation called a
 * `clearResults()` helper by hand at ~20 call sites; encoding it here means a
 * new action cannot forget it.
 */
function invalidateResults(state: SplitDraftState): SplitDraftState {
  return { ...state, session: null, error: null, savedStatus: null };
}

function clearExtraction(state: SplitDraftState): SplitDraftState {
  return {
    ...state,
    extractedReceipt: null,
    isExtracting: false,
    importMessage: null,
  };
}

function clearReceiptImage(state: SplitDraftState): SplitDraftState {
  return {
    ...clearExtraction(state),
    receiptImageUri: null,
    receiptImageKey: null,
    receiptImageUrl: null,
  };
}

function rebuildExtractedValidation(
  receipt: ExtractedReceipt,
): ExtractedReceipt {
  const itemSubtotal = receipt.items.reduce(
    (sum, item) => sum + item.totalPrice,
    0,
  );
  const roundedSubtotal = Math.round(itemSubtotal * 100) / 100;
  const expectedTotal = Math.round((roundedSubtotal + receipt.tax) * 100) / 100;
  const difference =
    receipt.total > 0
      ? Math.round((receipt.total - expectedTotal) * 100) / 100
      : receipt.subtotal > 0
        ? Math.round((receipt.subtotal - roundedSubtotal) * 100) / 100
        : 0;
  const warnings: string[] = [];
  const hasMismatch = Math.abs(difference) > 0.05;

  if (hasMismatch) {
    warnings.push("Parsed items do not add up to the receipt total.");
  }

  if (
    receipt.subtotal > 0 &&
    Math.abs(receipt.subtotal - roundedSubtotal) > 0.05
  ) {
    warnings.push("Parsed items do not add up to the receipt subtotal.");
  }

  return {
    ...receipt,
    validation: {
      itemSubtotal: roundedSubtotal,
      expectedTotal,
      difference,
      hasMismatch,
      warnings,
    },
  };
}

export function splitDraftReducer(
  state: SplitDraftState,
  action: SplitDraftAction,
): SplitDraftState {
  switch (action.type) {
    case "SET_MODE":
      return invalidateResults({ ...state, mode: action.mode });

    case "ADD_PERSON": {
      const name = action.name.trim();
      const validationError = validateParticipantName(name);

      if (validationError) {
        return { ...state, error: validationError };
      }

      return invalidateResults({
        ...state,
        people: [...state.people, { id: action.id, name }],
      });
    }

    case "UPDATE_PERSON": {
      const name = action.name.trim();
      const validationError = validateParticipantName(name);

      if (validationError) {
        return { ...state, error: validationError };
      }

      return invalidateResults({
        ...state,
        people: state.people.map((person) =>
          person.id === action.personId ? { ...person, name } : person,
        ),
      });
    }

    case "REMOVE_PERSON":
      return invalidateResults({
        ...state,
        people: state.people.filter((person) => person.id !== action.personId),
        items: state.items.map((item) =>
          removeParticipantFromItem(item, action.personId),
        ),
      });

    case "ADD_ITEM": {
      const name = action.name.trim();
      const quantity = action.quantity ?? 1;
      const validationError = validateItemFields(
        name,
        action.totalPrice,
        quantity,
      );

      if (validationError) {
        return { ...state, error: validationError };
      }

      return invalidateResults({
        ...state,
        items: [
          ...state.items,
          createEmptyReceiptItem(
            action.id,
            name,
            action.totalPrice,
            quantity,
          ),
        ],
      });
    }

    case "UPDATE_ITEM": {
      const name = action.name.trim();
      const existing = state.items.find((item) => item.id === action.itemId);
      if (!existing) {
        return state;
      }

      let next = { ...existing, name };
      if (action.quantity !== undefined) {
        next = withQuantity(next, action.quantity);
      }
      if (action.unitPrice !== undefined) {
        next = withUnitPrice(next, action.unitPrice);
      } else if (action.totalPrice !== undefined) {
        next = withTotalPrice(next, action.totalPrice);
      }

      const validationError = validateItemFields(
        name,
        next.totalPrice,
        next.quantity,
      );
      if (validationError) {
        return { ...state, error: validationError };
      }

      return invalidateResults({
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId ? next : item,
        ),
      });
    }

    case "REMOVE_ITEM":
      return invalidateResults({
        ...state,
        items: state.items.filter((item) => item.id !== action.itemId),
      });

    case "TOGGLE_ASSIGNMENT":
      return invalidateResults({
        ...state,
        items: state.items.map((item) => {
          if (item.id !== action.itemId) {
            return item;
          }

          if (state.mode === "itemized") {
            if (item.quantity === 1) {
              return setItemizedSoleOwner(item, action.personId);
            }
            // qty > 1 itemized uses steppers; treat toggle as assign/clear 1 unit
            const current =
              item.individualAllocations.find(
                (allocation) => allocation.participantId === action.personId,
              )?.quantity ?? 0;
            return setIndividualQuantity(
              item,
              action.personId,
              current > 0 ? 0 : 1,
            );
          }

          if (item.quantity === 1) {
            return toggleHybridQuantityOneAssignment(item, action.personId);
          }

          return toggleSharedParticipant(item, action.personId);
        }),
      });

    case "SET_INDIVIDUAL_QUANTITY":
      return invalidateResults({
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId
            ? setIndividualQuantity(item, action.personId, action.quantity)
            : item,
        ),
      });

    case "SET_SHARED_ALLOCATION":
      return invalidateResults({
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId
            ? setSharedAllocation(item, action.shared)
            : item,
        ),
      });

    case "SET_SHARED_QUANTITY":
      return invalidateResults({
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId
            ? setSharedQuantity(item, action.quantity)
            : item,
        ),
      });

    case "TOGGLE_SHARED_PARTICIPANT":
      return invalidateResults({
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId
            ? toggleSharedParticipant(item, action.personId)
            : item,
        ),
      });

    case "CLEAR_ITEM_ASSIGNMENTS":
      return invalidateResults({
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId ? clearItemAssignments(item) : item,
        ),
      });

    case "UPDATE_EXTRACTED_ITEM": {
      if (!state.extractedReceipt) {
        return state;
      }

      const items = state.extractedReceipt.items.map((item, index) =>
        index === action.index ? action.item : item,
      );
      const extractedReceipt = rebuildExtractedValidation({
        ...state.extractedReceipt,
        items,
      });

      return { ...state, extractedReceipt, error: null };
    }

    case "SET_BILL_TOTAL":
      return invalidateResults({ ...state, billTotal: action.value });

    case "SET_TAX":
      return invalidateResults({ ...state, tax: action.value });

    case "SET_CUSTOM_TIP":
      return invalidateResults({ ...state, customTip: action.value });

    case "SELECT_TIP_PRESET":
      return invalidateResults({
        ...state,
        tipMode: "percentage",
        tipPercent: action.percent,
      });

    case "SELECT_CUSTOM_TIP_MODE":
      return invalidateResults({ ...state, tipMode: "fixed" });

    case "SET_RECEIPT_IMAGE":
      return clearExtraction({
        ...state,
        receiptImageUri: action.uri,
        receiptImageKey: null,
        receiptImageUrl: null,
      });

    case "REMOVE_RECEIPT_IMAGE":
      return clearReceiptImage(state);

    case "SET_RECEIPT_IMAGE_REMOTE":
      return {
        ...state,
        receiptImageKey: action.key,
        receiptImageUrl: action.url,
      };

    case "EXTRACT_START":
      return { ...state, isExtracting: true, error: null };

    case "EXTRACT_SUCCESS":
      return {
        ...state,
        extractedReceipt: action.receipt,
        isExtracting: false,
        error: null,
        receiptImageKey: action.receipt.receiptImageKey ?? state.receiptImageKey,
        receiptImageUrl: action.receipt.receiptImageUrl ?? state.receiptImageUrl,
      };

    case "EXTRACT_FAILURE":
      return {
        ...state,
        extractedReceipt: null,
        isExtracting: false,
        error: action.message,
      };

    case "IMPORT_EXTRACTED":
      return {
        ...invalidateResults({
          ...state,
          mode: "itemized",
          items: action.items,
          tax: action.tax,
          billTotal: action.billTotal,
        }),
        importMessage: action.message,
      };

    case "CLEAR_IMPORT_MESSAGE":
      return { ...state, importMessage: null };

    case "SET_SESSION":
      return { ...state, session: action.session };

    case "SET_ERROR":
      return { ...state, error: action.message };

    case "SET_SAVED_STATUS":
      return { ...state, savedStatus: action.message };

    case "LOAD_SAVED": {
      const tipMode = action.session.tipMode || "percentage";
      const tipPercent = action.session.tipPercent ?? INITIAL_TIP_PERCENT;
      const customTip = action.session.customTip ?? 0;

      return {
        ...initialSplitDraftState,
        mode: action.session.mode,
        people: action.session.people,
        items: action.session.items,
        billTotal: action.session.billTotal.toFixed(2),
        tax: action.session.tax.toFixed(2),
        tipMode,
        tipPercent,
        customTip: tipMode === "fixed" ? customTip.toFixed(2) : "",
        receiptImageKey: action.session.receiptImageKey ?? null,
        receiptImageUrl: action.session.receiptImageUrl ?? null,
        receiptImageUri: action.session.receiptImageUrl ?? null,
        session: { ...action.session, tipMode, tipPercent, customTip },
        savedStatus: "Saved split loaded.",
      };
    }

    case "RESET":
      return initialSplitDraftState;

    default:
      return state;
  }
}
