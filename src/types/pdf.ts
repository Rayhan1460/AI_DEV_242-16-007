export interface UploadedPdf {
  id: string; // Unique internal ID
  file: File;
  bytes: Uint8Array;
  filename: string;
  size: number; // in bytes
  pageCount: number;
  sha256: string; // Hexadecimal SHA-256 hash
  isDuplicate: boolean;
  duplicateOf?: string[]; // Names of other files sharing the identical SHA-256 hash
}

export interface PdfUploadLimits {
  maxFiles: number; // 30
  maxTotalBytes: number; // 50 * 1024 * 1024 (50 MB)
}
