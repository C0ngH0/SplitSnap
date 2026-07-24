import type { ExtractedReceipt } from "../types/receipt";
import type {
  Person,
  ReceiptItem,
  SplitMode,
  SplitSession,
  TipMode,
} from "../types/split";
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
  extractedReceipt: null,
  isExtracting: false,
  importMessage: null,
  session: null,
  error: null,
  savedStatus: null,
};

export type SplitDraftAction =
  | { type: "SET_MODE"; mode: SplitMode }
  | { type: "ADD_PERSON"; id: string; name: string }
  | { type: "UPDATE_PERSON"; personId: string; name: string }
  | { type: "REMOVE_PERSON"; personId: string }
  | { type: "ADD_ITEM"; id: string; name: string; price: number }
  | { type: "UPDATE_ITEM"; itemId: string; name: string; price: number }
  | { type: "REMOVE_ITEM"; itemId: string }
  | { type: "TOGGLE_ASSIGNMENT"; itemId: string; personId: string }
  | { type: "SET_BILL_TOTAL"; value: string }
  | { type: "SET_TAX"; value: string }
  | { type: "SET_CUSTOM_TIP"; value: string }
  | { type: "SELECT_TIP_PRESET"; percent: number }
  | { type: "SELECT_CUSTOM_TIP_MODE" }
  | { type: "SET_RECEIPT_IMAGE"; uri: string }
  | { type: "REMOVE_RECEIPT_IMAGE" }
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
      // Removing a participant must also release every item they were
      // assigned, otherwise items keep dangling ids and never validate.
      return invalidateResults({
        ...state,
        people: state.people.filter((person) => person.id !== action.personId),
        items: state.items.map((item) => ({
          ...item,
          assignedTo: item.assignedTo.filter((id) => id !== action.personId),
        })),
      });

    case "ADD_ITEM": {
      const name = action.name.trim();
      const validationError = validateItemFields(name, action.price);

      if (validationError) {
        return { ...state, error: validationError };
      }

      return invalidateResults({
        ...state,
        items: [
          ...state.items,
          { id: action.id, name, price: action.price, assignedTo: [] },
        ],
      });
    }

    case "UPDATE_ITEM": {
      const name = action.name.trim();
      const validationError = validateItemFields(name, action.price);

      if (validationError) {
        return { ...state, error: validationError };
      }

      return invalidateResults({
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId
            ? { ...item, name, price: action.price }
            : item,
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

          // Itemized allows exactly one owner per item, so selecting replaces.
          // Hybrid shares an item, so selecting toggles membership.
          if (state.mode === "itemized") {
            return { ...item, assignedTo: [action.personId] };
          }

          const isAssigned = item.assignedTo.includes(action.personId);
          const assignedTo = isAssigned
            ? item.assignedTo.filter((id) => id !== action.personId)
            : [...item.assignedTo, action.personId];

          return { ...item, assignedTo };
        }),
      });

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
      return clearExtraction({ ...state, receiptImageUri: action.uri });

    case "REMOVE_RECEIPT_IMAGE":
      return clearExtraction({ ...state, receiptImageUri: null });

    case "EXTRACT_START":
      return { ...state, isExtracting: true, error: null };

    case "EXTRACT_SUCCESS":
      return {
        ...state,
        extractedReceipt: action.receipt,
        isExtracting: false,
        error: null,
      };

    case "EXTRACT_FAILURE":
      return {
        ...state,
        extractedReceipt: null,
        isExtracting: false,
        error: action.message,
      };

    case "IMPORT_EXTRACTED":
      // Imported receipts always land in itemized mode: OCR gives us line
      // items, which is exactly what itemized needs.
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
