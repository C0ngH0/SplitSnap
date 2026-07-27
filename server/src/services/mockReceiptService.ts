import type { ExtractedReceipt } from "../types/receipt";
import { normalizeExtractedReceiptItem } from "./receiptQuantityParser";

const MOCK_EXTRACTED_RECEIPT: ExtractedReceipt = {
  restaurantName: "The Corner Bistro",
  rawText: [
    "THE CORNER BISTRO",
    "123 Main Street",
    "",
    "Classic Burger        14.50",
    "3 Potato              12.00",
    "Caesar Salad          11.00",
    "Iced Tea               3.50",
    "Garlic Fries           6.50",
    "",
    "Subtotal              47.50",
    "Tax                    4.04",
    "Total                 51.54",
    "",
    "Thank you!",
  ].join("\n"),
  subtotal: 47.5,
  tax: 4.04,
  total: 51.54,
  items: [
    normalizeExtractedReceiptItem({
      name: "Classic Burger",
      quantity: 1,
      totalPrice: 14.5,
    }),
    normalizeExtractedReceiptItem({
      name: "Potato",
      quantity: 3,
      unitPrice: 4,
      totalPrice: 12,
    }),
    normalizeExtractedReceiptItem({
      name: "Caesar Salad",
      quantity: 1,
      totalPrice: 11,
    }),
    normalizeExtractedReceiptItem({
      name: "Iced Tea",
      quantity: 1,
      totalPrice: 3.5,
    }),
    normalizeExtractedReceiptItem({
      name: "Garlic Fries",
      quantity: 1,
      totalPrice: 6.5,
    }),
  ],
};

/** Simulated processing delay (ms). */
const MOCK_EXTRACTION_DELAY_MS = 800;

/**
 * Mock receipt extraction. Returns the same shape as the mobile app's OCR contract.
 */
export async function extractReceiptMock(
  _imageUri?: string,
): Promise<ExtractedReceipt> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_EXTRACTION_DELAY_MS);
  });

  return {
    ...MOCK_EXTRACTED_RECEIPT,
    items: MOCK_EXTRACTED_RECEIPT.items.map((item) => ({ ...item })),
  };
}
