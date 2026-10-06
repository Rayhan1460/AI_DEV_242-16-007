import { PDFDocument } from 'pdf-lib';
import type { UploadedPdf } from '../types/pdf';

export const MAX_FILES = 30;
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB = 52,428,800 bytes

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export async function computeSha256(bytes: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function hasPdfMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  // Inspect first 1024 bytes for %PDF-
  const headerSlice = bytes.subarray(0, Math.min(bytes.length, 1024));
  const headerStr = new TextDecoder('latin1').decode(headerSlice);
  return headerStr.includes('%PDF-');
}

export interface ValidatePdfResult {
  valid: boolean;
  pageCount?: number;
  error?: string;
}

export async function validatePdfBytes(bytes: Uint8Array, filename: string): Promise<ValidatePdfResult> {
  if (!hasPdfMagicBytes(bytes)) {
    return {
      valid: false,
      error: `"${filename}" is not a valid PDF file (missing PDF header signature).`
    };
  }

  try {
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    return {
      valid: true,
      pageCount
    };
  } catch (err) {
    return {
      valid: false,
      error: `Failed to load "${filename}": ${err instanceof Error ? err.message : 'Corrupted PDF structure'}`
    };
  }
}

/**
 * Re-evaluates duplicate flags across all uploaded files based on SHA-256 hash.
 * Two files with identical bytes are recognized as duplicates even if filenames differ.
 */
export function refreshDuplicateStatuses(files: UploadedPdf[]): UploadedPdf[] {
  // Map hash -> array of file ids
  const hashMap = new Map<string, UploadedPdf[]>();
  for (const f of files) {
    const list = hashMap.get(f.sha256) || [];
    list.push(f);
    hashMap.set(f.sha256, list);
  }

  return files.map((file) => {
    const group = hashMap.get(file.sha256) || [];
    if (group.length > 1) {
      const others = group.filter((g) => g.id !== file.id).map((g) => g.filename);
      return {
        ...file,
        isDuplicate: true,
        duplicateOf: others
      };
    }
    return {
      ...file,
      isDuplicate: false,
      duplicateOf: undefined
    };
  });
}

export interface ProcessUploadResult {
  success: boolean;
  addedFiles: UploadedPdf[];
  error?: string;
}

/**
 * Validates and parses newly selected files while enforcing competition limits:
 * - PDFs only
 * - Maximum 30 files total
 * - Maximum 50 MB total upload size
 */
export async function processPdfFiles(
  incomingFiles: File[],
  existingFiles: UploadedPdf[]
): Promise<ProcessUploadResult> {
  if (incomingFiles.length === 0) {
    return { success: true, addedFiles: [] };
  }

  // 1. Check total files limit
  const projectedCount = existingFiles.length + incomingFiles.length;
  if (projectedCount > MAX_FILES) {
    return {
      success: false,
      addedFiles: [],
      error: `Limit exceeded: Maximum ${MAX_FILES} uploaded files allowed. You currently have ${existingFiles.length} file(s) and attempted to add ${incomingFiles.length} file(s) (total ${projectedCount}).`
    };
  }

  // 2. Check total size limit
  const currentTotalBytes = existingFiles.reduce((acc, f) => acc + f.size, 0);
  const incomingTotalBytes = incomingFiles.reduce((acc, f) => acc + f.size, 0);
  const projectedTotalBytes = currentTotalBytes + incomingTotalBytes;

  if (projectedTotalBytes > MAX_TOTAL_BYTES) {
    return {
      success: false,
      addedFiles: [],
      error: `Limit exceeded: Maximum upload size is 50 MB (${MAX_TOTAL_BYTES.toLocaleString()} bytes). Current: ${formatBytes(currentTotalBytes)}, Incoming: ${formatBytes(incomingTotalBytes)}, Total would be: ${formatBytes(projectedTotalBytes)}.`
    };
  }

  // 3. Process and validate each file
  const newlyValidated: UploadedPdf[] = [];

  for (const file of incomingFiles) {
    // Quick filename check
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type && file.type !== 'application/pdf') {
      return {
        success: false,
        addedFiles: [],
        error: `Invalid file "${file.name}": Only PDF documents are allowed.`
      };
    }

    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch {
      return {
        success: false,
        addedFiles: [],
        error: `Could not read file "${file.name}".`
      };
    }

    const bytes = new Uint8Array(arrayBuffer);
    const validation = await validatePdfBytes(bytes, file.name);
    if (!validation.valid || validation.pageCount === undefined) {
      return {
        success: false,
        addedFiles: [],
        error: validation.error || `Invalid PDF file "${file.name}".`
      };
    }

    const sha256 = await computeSha256(bytes);
    const uniqueId = `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    newlyValidated.push({
      id: uniqueId,
      file,
      bytes,
      filename: file.name,
      size: file.size,
      pageCount: validation.pageCount,
      sha256,
      isDuplicate: false
    });
  }

  // Combine and refresh duplicate status
  const allUpdated = refreshDuplicateStatuses([...existingFiles, ...newlyValidated]);
  const newFilesOnly = allUpdated.slice(existingFiles.length);

  return {
    success: true,
    addedFiles: newFilesOnly
  };
}
