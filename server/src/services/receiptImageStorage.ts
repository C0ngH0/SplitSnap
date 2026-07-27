import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const PRESIGNED_URL_TTL_SECONDS = 60 * 60;

type UploadReceiptImageInput = {
  buffer: Buffer;
  mimeType: string;
  originalName?: string;
};

export type UploadedReceiptImage = {
  key: string;
  url: string;
};

function getBucket(): string | null {
  const bucket = process.env.RECEIPT_IMAGES_BUCKET?.trim();
  return bucket && bucket.length > 0 ? bucket : null;
}

function getRegion(): string {
  return process.env.AWS_REGION?.trim() || "us-west-2";
}

function getPublicBaseUrl(): string | null {
  const base = process.env.RECEIPT_IMAGES_PUBLIC_BASE_URL?.trim();
  if (!base) {
    return null;
  }

  return base.replace(/\/+$/, "");
}

function createS3Client(): S3Client {
  return new S3Client({ region: getRegion() });
}

function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpg":
    case "image/jpeg":
    default:
      return "jpg";
  }
}

export function isReceiptImageStorageConfigured(): boolean {
  return getBucket() != null;
}

async function resolveViewUrl(key: string): Promise<string> {
  const publicBase = getPublicBaseUrl();
  if (publicBase) {
    return `${publicBase}/${key}`;
  }

  const bucket = getBucket();
  if (!bucket) {
    throw new Error("RECEIPT_IMAGES_BUCKET is not configured.");
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(createS3Client(), command, {
    expiresIn: PRESIGNED_URL_TTL_SECONDS,
  });
}

/**
 * Persist a receipt image to S3 when configured.
 * Returns null when storage is not configured (local/dev) so OCR can continue.
 */
export async function uploadReceiptImage(
  input: UploadReceiptImageInput,
): Promise<UploadedReceiptImage | null> {
  const bucket = getBucket();
  if (!bucket) {
    return null;
  }

  const extension = extensionForMimeType(input.mimeType);
  const key = `receipts/${randomUUID()}.${extension}`;

  await createS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: input.buffer,
      ContentType: input.mimeType,
      Metadata: {
        originalName: input.originalName ?? "",
      },
    }),
  );

  const url = await resolveViewUrl(key);
  return { key, url };
}

/** Build a time-limited (or public) URL for an existing storage key. */
export async function getReceiptImageViewUrl(
  key: string | null | undefined,
): Promise<string | null> {
  if (!key || key.trim().length === 0) {
    return null;
  }

  if (!isReceiptImageStorageConfigured()) {
    const publicBase = getPublicBaseUrl();
    if (publicBase) {
      return `${publicBase}/${key}`;
    }
    return null;
  }

  try {
    return await resolveViewUrl(key);
  } catch (error) {
    console.error("[receiptImageStorage] Failed to resolve view URL:", error);
    return null;
  }
}
