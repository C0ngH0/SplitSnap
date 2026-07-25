import * as ImagePicker from "expo-image-picker";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { Alert, Share } from "react-native";

import {
  buildImportedReceiptData,
  extractReceipt as extractReceiptRequest,
} from "../services/receiptExtraction";
import type { SplitMode, SplitSession } from "../types/split";
import { createId, parseAmount } from "../utils/format";
import {
  buildSessionTitle,
  getValidRestaurantName,
  normalizeSessionForSave,
} from "../utils/session";
import {
  calculateEvenSplit,
  calculateHybridSplit,
  calculateItemizedSplit,
  calculateItemsSubtotal,
  formatSessionShareText,
  resolveTipAmount,
  validateSplitInput,
} from "../utils/splitCalculator";
import { useSavedSplits } from "./SavedSplitsContext";
import {
  initialSplitDraftState,
  splitDraftReducer,
  type SplitDraftState,
} from "./splitDraftReducer";

const RECEIPT_IMAGE_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  quality: 0.8,
};

type SplitDraftContextValue = SplitDraftState & {
  itemsSubtotal: number;
  currentTipAmount: number;
  extractedTipAmount: number;
  hasReceiptContext: boolean;

  setMode: (mode: SplitMode) => void;
  addPerson: (name: string) => void;
  updatePerson: (personId: string, name: string) => void;
  removePerson: (personId: string) => void;
  addItem: (name: string, price: string) => void;
  updateItem: (itemId: string, name: string, price: string) => void;
  removeItem: (itemId: string) => void;
  toggleAssignment: (itemId: string, personId: string) => void;
  setBillTotal: (value: string) => void;
  setTax: (value: string) => void;
  setCustomTip: (value: string) => void;
  selectTipPreset: (percent: number) => void;
  selectCustomTipMode: () => void;

  pickReceiptFromLibrary: () => Promise<void>;
  takeReceiptPhoto: () => Promise<void>;
  removeReceiptImage: () => void;
  extractReceipt: () => Promise<void>;
  importExtractedReceipt: () => boolean;
  clearImportMessage: () => void;

  calculate: () => boolean;
  shareResults: () => Promise<void>;
  saveCurrentSplit: () => Promise<boolean>;
  /** True while a save request is in flight. */
  isSaving: boolean;
  loadSavedSplit: (session: SplitSession) => void;
  setError: (message: string | null) => void;
  reset: () => void;
};

export const SPLIT_SAVED_SUCCESS_MESSAGE = "Split saved successfully.";

const SplitDraftContext = createContext<SplitDraftContextValue | null>(null);

export function SplitDraftProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    splitDraftReducer,
    initialSplitDraftState,
  );
  const [isSaving, setIsSaving] = useState(false);
  const { save } = useSavedSplits();

  const itemsSubtotal = calculateItemsSubtotal(state.items);
  const currentTipAmount = resolveTipAmount(
    itemsSubtotal,
    state.tipMode,
    state.tipPercent,
    parseAmount(state.customTip),
  );
  const extractedTipAmount = state.extractedReceipt
    ? resolveTipAmount(
        state.extractedReceipt.subtotal,
        state.tipMode,
        state.tipPercent,
        parseAmount(state.customTip),
      )
    : 0;
  const hasReceiptContext = Boolean(
    state.receiptImageUri || state.extractedReceipt,
  );

  const setMode = useCallback(
    (mode: SplitMode) => dispatch({ type: "SET_MODE", mode }),
    [],
  );

  const addPerson = useCallback(
    (name: string) => dispatch({ type: "ADD_PERSON", id: createId(), name }),
    [],
  );

  const updatePerson = useCallback(
    (personId: string, name: string) =>
      dispatch({ type: "UPDATE_PERSON", personId, name }),
    [],
  );

  const removePerson = useCallback(
    (personId: string) => dispatch({ type: "REMOVE_PERSON", personId }),
    [],
  );

  const addItem = useCallback(
    (name: string, price: string) =>
      dispatch({
        type: "ADD_ITEM",
        id: createId(),
        name,
        price: parseAmount(price),
      }),
    [],
  );

  const updateItem = useCallback(
    (itemId: string, name: string, price: string) =>
      dispatch({ type: "UPDATE_ITEM", itemId, name, price: parseAmount(price) }),
    [],
  );

  const removeItem = useCallback(
    (itemId: string) => dispatch({ type: "REMOVE_ITEM", itemId }),
    [],
  );

  const toggleAssignment = useCallback(
    (itemId: string, personId: string) =>
      dispatch({ type: "TOGGLE_ASSIGNMENT", itemId, personId }),
    [],
  );

  const setBillTotal = useCallback(
    (value: string) => dispatch({ type: "SET_BILL_TOTAL", value }),
    [],
  );

  const setTax = useCallback(
    (value: string) => dispatch({ type: "SET_TAX", value }),
    [],
  );

  const setCustomTip = useCallback(
    (value: string) => dispatch({ type: "SET_CUSTOM_TIP", value }),
    [],
  );

  const selectTipPreset = useCallback(
    (percent: number) => dispatch({ type: "SELECT_TIP_PRESET", percent }),
    [],
  );

  const selectCustomTipMode = useCallback(
    () => dispatch({ type: "SELECT_CUSTOM_TIP_MODE" }),
    [],
  );

  const pickReceiptFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Photo library access needed",
        "Allow photo library access to attach a receipt image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync(
      RECEIPT_IMAGE_OPTIONS,
    );

    if (!result.canceled && result.assets[0]) {
      dispatch({ type: "SET_RECEIPT_IMAGE", uri: result.assets[0].uri });
    }
  }, []);

  const takeReceiptPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Camera access needed",
        "Allow camera access to photograph your receipt.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync(RECEIPT_IMAGE_OPTIONS);

    if (!result.canceled && result.assets[0]) {
      dispatch({ type: "SET_RECEIPT_IMAGE", uri: result.assets[0].uri });
    }
  }, []);

  const removeReceiptImage = useCallback(
    () => dispatch({ type: "REMOVE_RECEIPT_IMAGE" }),
    [],
  );

  const extractReceipt = useCallback(async () => {
    if (!state.receiptImageUri || state.isExtracting) {
      return;
    }

    dispatch({ type: "EXTRACT_START" });

    try {
      const receipt = await extractReceiptRequest(state.receiptImageUri);
      dispatch({ type: "EXTRACT_SUCCESS", receipt });
    } catch (extractError) {
      dispatch({
        type: "EXTRACT_FAILURE",
        message:
          extractError instanceof Error
            ? extractError.message
            : "Could not extract receipt data. Try again or enter items manually.",
      });
    }
  }, [state.receiptImageUri, state.isExtracting]);

  const importExtractedReceipt = useCallback(() => {
    if (!state.extractedReceipt) {
      return false;
    }

    if (state.extractedReceipt.items.length === 0) {
      dispatch({
        type: "SET_ERROR",
        message: "No items were found in the extracted receipt.",
      });
      return false;
    }

    const imported = buildImportedReceiptData(state.extractedReceipt, createId);

    dispatch({
      type: "IMPORT_EXTRACTED",
      items: imported.items,
      tax: imported.tax,
      billTotal: imported.billTotal,
      message: `Imported ${imported.items.length} items. Assign each one to a participant.`,
    });

    return true;
  }, [state.extractedReceipt]);

  const clearImportMessage = useCallback(
    () => dispatch({ type: "CLEAR_IMPORT_MESSAGE" }),
    [],
  );

  const setError = useCallback(
    (message: string | null) => dispatch({ type: "SET_ERROR", message }),
    [],
  );

  const calculate = useCallback(() => {
    const itemsSubtotalAmount = calculateItemsSubtotal(state.items);
    const parsedTax = parseAmount(state.tax);
    const parsedTip = resolveTipAmount(
      itemsSubtotalAmount,
      state.tipMode,
      state.tipPercent,
      parseAmount(state.customTip),
    );
    // Even mode still divides one final bill; items + tax form the pre-tip total.
    const evenPreTipTotal = itemsSubtotalAmount + parsedTax;
    const parsedBillTotal =
      state.mode === "even"
        ? evenPreTipTotal
        : parseAmount(state.billTotal);

    const validationError = validateSplitInput(
      state.mode,
      state.people,
      state.items,
      parsedBillTotal,
      parsedTax,
      parsedTip,
      state.tipMode,
      state.customTip,
    );

    if (validationError) {
      dispatch({ type: "SET_ERROR", message: validationError });
      return false;
    }

    let result;

    if (state.mode === "even") {
      result = calculateEvenSplit(evenPreTipTotal, state.people, parsedTip);
    } else if (state.mode === "itemized") {
      result = calculateItemizedSplit(
        state.items,
        state.people,
        parsedTax,
        parsedTip,
      );
    } else {
      result = calculateHybridSplit(
        state.items,
        state.people,
        parsedTax,
        parsedTip,
      );
    }

    const now = new Date().toISOString();
    const restaurantName = getValidRestaurantName(
      state.extractedReceipt?.restaurantName ||
        state.session?.restaurantName ||
        "",
    );

    dispatch({
      type: "SET_SESSION",
      session: {
        id: state.session?.id ?? createId(),
        title:
          state.session?.title ??
          buildSessionTitle(restaurantName, now, hasReceiptContext),
        createdAt: state.session?.createdAt ?? now,
        updatedAt: now,
        restaurantName,
        mode: state.mode,
        people: state.people,
        items: state.items,
        billTotal: parsedBillTotal,
        tax: parsedTax,
        tip: parsedTip,
        tipMode: state.tipMode,
        tipPercent: state.tipPercent,
        customTip: parseAmount(state.customTip),
        personTotals: result.personTotals,
        summary: result.summary,
      },
    });

    return true;
  }, [
    state.billTotal,
    state.tax,
    state.items,
    state.tipMode,
    state.tipPercent,
    state.customTip,
    state.mode,
    state.people,
    state.extractedReceipt,
    state.session,
    hasReceiptContext,
  ]);

  const shareResults = useCallback(async () => {
    if (!state.session) {
      return;
    }

    try {
      await Share.share({
        message: formatSessionShareText(state.session),
        title: "Tably Results",
      });
    } catch {
      Alert.alert(
        "Unable to share",
        "Something went wrong while sharing results.",
      );
    }
  }, [state.session]);

  const saveCurrentSplit = useCallback(async () => {
    if (!state.session || isSaving) {
      return false;
    }

    // Already confirmed saved for this result — block accidental re-taps.
    if (state.savedStatus === SPLIT_SAVED_SUCCESS_MESSAGE) {
      return true;
    }

    const now = new Date().toISOString();
    const sessionToSave = normalizeSessionForSave(state.session, now, {
      currentRestaurantName:
        state.extractedReceipt?.restaurantName ||
        state.session.restaurantName ||
        "",
      hasReceipt: hasReceiptContext,
      fallbackTipMode: state.tipMode,
      fallbackTipPercent: state.tipPercent,
      fallbackCustomTip: parseAmount(state.customTip),
    });

    setIsSaving(true);
    dispatch({ type: "SET_ERROR", message: null });

    try {
      const savedSession = await save(sessionToSave);
      // Adopt the server copy so its UUID drives a PUT on the next save
      // instead of creating a duplicate session.
      dispatch({ type: "SET_SESSION", session: savedSession });
      dispatch({
        type: "SET_SAVED_STATUS",
        message: SPLIT_SAVED_SUCCESS_MESSAGE,
      });
      return true;
    } catch (saveError) {
      console.error("[splitHistory] Failed to save split:", saveError);
      dispatch({ type: "SET_SAVED_STATUS", message: null });
      dispatch({ type: "SET_ERROR", message: "Could not save this split." });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    state.session,
    state.savedStatus,
    state.extractedReceipt,
    state.tipMode,
    state.tipPercent,
    state.customTip,
    hasReceiptContext,
    isSaving,
    save,
  ]);

  const loadSavedSplit = useCallback(
    (session: SplitSession) => dispatch({ type: "LOAD_SAVED", session }),
    [],
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const value = useMemo<SplitDraftContextValue>(
    () => ({
      ...state,
      itemsSubtotal,
      currentTipAmount,
      extractedTipAmount,
      hasReceiptContext,
      setMode,
      addPerson,
      updatePerson,
      removePerson,
      addItem,
      updateItem,
      removeItem,
      toggleAssignment,
      setBillTotal,
      setTax,
      setCustomTip,
      selectTipPreset,
      selectCustomTipMode,
      pickReceiptFromLibrary,
      takeReceiptPhoto,
      removeReceiptImage,
      extractReceipt,
      importExtractedReceipt,
      clearImportMessage,
      calculate,
      shareResults,
      saveCurrentSplit,
      isSaving,
      loadSavedSplit,
      setError,
      reset,
    }),
    [
      state,
      itemsSubtotal,
      currentTipAmount,
      extractedTipAmount,
      hasReceiptContext,
      setMode,
      addPerson,
      updatePerson,
      removePerson,
      addItem,
      updateItem,
      removeItem,
      toggleAssignment,
      setBillTotal,
      setTax,
      setCustomTip,
      selectTipPreset,
      selectCustomTipMode,
      pickReceiptFromLibrary,
      takeReceiptPhoto,
      removeReceiptImage,
      extractReceipt,
      importExtractedReceipt,
      clearImportMessage,
      calculate,
      shareResults,
      saveCurrentSplit,
      isSaving,
      loadSavedSplit,
      setError,
      reset,
    ],
  );

  return (
    <SplitDraftContext.Provider value={value}>
      {children}
    </SplitDraftContext.Provider>
  );
}

export function useSplitDraft() {
  const context = useContext(SplitDraftContext);

  if (!context) {
    throw new Error("useSplitDraft must be used within a SplitDraftProvider.");
  }

  return context;
}
