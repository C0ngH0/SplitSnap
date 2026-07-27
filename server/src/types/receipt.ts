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

export type ExtractionMethod =
  | "textract"
  | "textract-openai-repair"
  | "mock-fallback";

export type ExtractedReceipt = {
  restaurantName: string;
  rawText: string;
  subtotal: number;
  tax: number;
  total: number;
  items: ExtractedReceiptItem[];
  validation?: ReceiptValidation;
  repairNotes?: string[];
  extractionMethod?: ExtractionMethod;
  /** S3 object key when receipt image storage is configured. */
  receiptImageKey?: string;
  /** View URL (presigned or public) for the stored receipt image. */
  receiptImageUrl?: string;
};

export type ReceiptImageMetadata = {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export type ReceiptImageValidationResult =
  | { valid: true; metadata: ReceiptImageMetadata }
  | { valid: false; error: string };
