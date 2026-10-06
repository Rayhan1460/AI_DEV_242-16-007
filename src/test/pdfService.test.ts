import { describe, it, expect } from 'vitest';
import {
  hasPdfMagicBytes,
  validatePdfBytes,
  refreshDuplicateStatuses,
  processPdfFiles,
  MAX_FILES,
  MAX_TOTAL_BYTES
} from '../core/pdfService';
import type { UploadedPdf } from '../types/pdf';
import { PDFDocument } from 'pdf-lib';

describe('PDF Service & Upload Limits', () => {
  it('detects PDF magic header bytes %PDF-', () => {
    const validHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
    const invalidHeader = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // GIF89a

    expect(hasPdfMagicBytes(validHeader)).toBe(true);
    expect(hasPdfMagicBytes(invalidHeader)).toBe(false);
  });

  it('rejects non-PDF files during validation', async () => {
    const textBytes = new TextEncoder().encode('Hello world, this is a plain text file');
    const res = await validatePdfBytes(textBytes, 'fake.pdf');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('missing PDF header signature');
  });

  it('validates genuine PDF and returns accurate page count', async () => {
    // Generate a valid 2-page PDF in memory using pdf-lib
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([200, 200]);
    pdfDoc.addPage([200, 200]);
    const pdfBytes = await pdfDoc.save();

    const res = await validatePdfBytes(pdfBytes, 'two_pages.pdf');
    expect(res.valid).toBe(true);
    expect(res.pageCount).toBe(2);
  });

  it('identifies exact-content duplicates even with different filenames', () => {
    const file1: UploadedPdf = {
      id: '1',
      file: new File([], 'alpha.pdf'),
      bytes: new Uint8Array(),
      filename: 'alpha.pdf',
      size: 100,
      pageCount: 1,
      sha256: 'same-hash-123',
      isDuplicate: false
    };

    const file2: UploadedPdf = {
      id: '2',
      file: new File([], 'beta_different_name.pdf'),
      bytes: new Uint8Array(),
      filename: 'beta_different_name.pdf',
      size: 100,
      pageCount: 1,
      sha256: 'same-hash-123', // Identical hash!
      isDuplicate: false
    };

    const file3: UploadedPdf = {
      id: '3',
      file: new File([], 'gamma.pdf'),
      bytes: new Uint8Array(),
      filename: 'gamma.pdf',
      size: 150,
      pageCount: 2,
      sha256: 'unique-hash-456',
      isDuplicate: false
    };

    const updated = refreshDuplicateStatuses([file1, file2, file3]);
    expect(updated[0].isDuplicate).toBe(true);
    expect(updated[0].duplicateOf).toContain('beta_different_name.pdf');
    expect(updated[1].isDuplicate).toBe(true);
    expect(updated[1].duplicateOf).toContain('alpha.pdf');
    expect(updated[2].isDuplicate).toBe(false);
  });

  it('enforces maximum 30 uploaded files limit', async () => {
    const existing: UploadedPdf[] = Array.from({ length: 30 }, (_, i) => ({
      id: `f-${i}`,
      file: new File([], `doc_${i}.pdf`),
      bytes: new Uint8Array(),
      filename: `doc_${i}.pdf`,
      size: 10,
      pageCount: 1,
      sha256: `hash-${i}`,
      isDuplicate: false
    }));

    const extraFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], 'doc_extra.pdf', {
      type: 'application/pdf'
    });

    const res = await processPdfFiles([extraFile], existing);
    expect(res.success).toBe(false);
    expect(res.error).toContain(`Maximum ${MAX_FILES} uploaded files allowed`);
  });

  it('enforces maximum 50 MB total upload size limit', async () => {
    const bigFile = new File([], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(bigFile, 'size', { value: MAX_TOTAL_BYTES + 1 });

    const res = await processPdfFiles([bigFile], []);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Maximum upload size is 50 MB');
  });
});
