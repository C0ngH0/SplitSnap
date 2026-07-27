export type ExtractedReceiptItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type ReceiptValidation = {
  itemSubtotal: number;
  expectedTotal: number;
  difference: number;
  hasMismatch: boolean;
  warnings: string[];
};

export type ExtractedReceipt = {
  restaurantName: string;
  rawText: string;
  subtotal: number;
  tax: number;
  total: number;
  items: ExtractedReceiptItem[];
  validation?: ReceiptValidation;
  repairNotes?: string[];
  extractionMethod?: "textract" | "textract-openai-repair" | "mock-fallback";
  receiptImageKey?: string;
  receiptImageUrl?: string;
};
