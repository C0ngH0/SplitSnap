import type { SplitMode as ApiSplitMode } from "../shared/types/splitSession";

export type Person = {
  id: string;
  name: string;
};

export type ItemAllocation = {
  participantId: string;
  quantity: number;
};

export type SharedAllocation = {
  quantity: number;
  participantIds: string[];
};

export type ReceiptItem = {
  id: string;
  name: string;
  /** Positive whole number only (v1). */
  quantity: number;
  /** Derived/display; totalPrice is authoritative. */
  unitPrice: number;
  /** Authoritative receipt line amount. */
  totalPrice: number;
  individualAllocations: ItemAllocation[];
  /** Hybrid shared pool; null when unused. */
  sharedAllocation: SharedAllocation | null;
};

export type PersonItemLine = {
  itemName: string;
  quantityLabel: string;
  amount: number;
  sharedWithNames?: string[];
};

export type SplitMode = ApiSplitMode;

export type TipMode = "percentage" | "fixed";

export const TIP_PERCENT_PRESETS = [15, 18, 20, 22, 25] as const;

export type TipPercentPreset = (typeof TIP_PERCENT_PRESETS)[number];

export type PersonTotal = {
  personId: string;
  name: string;
  foodSubtotal: number;
  taxShare: number;
  tipShare: number;
  finalAmount: number;
  itemLines?: PersonItemLine[];
};

export type ReceiptSummary = {
  subtotal: number;
  tax: number;
  tip: number;
  finalTotal: number;
  sumOfPeopleTotals: number;
  difference: number;
};

export type PaymentStatus = "unpaid" | "partial" | "paid";

export type SplitSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  restaurantName: string;
  paymentStatus?: PaymentStatus;
  /** Durable S3 object key when the receipt was uploaded. */
  receiptImageKey?: string | null;
  /** Viewable URL (local file URI, public URL, or presigned). */
  receiptImageUrl?: string | null;
  mode: SplitMode;
  people: Person[];
  items: ReceiptItem[];
  billTotal: number;
  tax: number;
  tip: number;
  tipMode: TipMode;
  tipPercent: number;
  customTip: number;
  personTotals: PersonTotal[];
  summary: ReceiptSummary;
};
