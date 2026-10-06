import { describe, it, expect } from 'vitest';
import { generateTenderPackage } from '../core/pdfGenerator';
import { PDFDocument, rgb } from 'pdf-lib';
import type { Tender, Requirement } from '../types/tender';
import type { UploadedPdf } from '../types/pdf';
import type { MatchingState } from '../types/matching';

describe('PDF Package Generator (Stage 2 Mandatory Verification)', () => {
  const tender: Tender = {
    tender_id: 'T-2026-0417',
    title: 'Supply of IT Equipment',
    procuring_entity: 'Directorate of Information Technology',
    bidder: 'Tech Solutions Bangladesh Ltd.',
    submission_deadline: '2026-10-20'
  };

  const requirements: Requirement[] = [
    { id: 'R01', order: 1, title_en: 'Trade License', title_bn: 'ট্রেড লাইসেন্স', mandatory: true, has_expiry: true },
    { id: 'R02', order: 2, title_en: 'Tax Clearance Certificate', title_bn: 'আয়কর সনদ', mandatory: true, has_expiry: true },
    { id: 'R03', order: 3, title_en: 'Bank Solvency Certificate', title_bn: 'ব্যাংক সচ্ছলতা সনদ', mandatory: true, has_expiry: false },
    { id: 'R04', order: 4, title_en: 'Optional Authorization', title_bn: 'অনুমোদনপত্র', mandatory: false, has_expiry: false }
  ];

  async function createTestPdfBytes(pagesCount: number, label: string): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    for (let i = 1; i <= pagesCount; i++) {
      const page = doc.addPage([595.28, 841.89]);
      page.drawText(`${label} - Page ${i}`, { x: 50, y: 700, size: 20, color: rgb(0.1, 0.1, 0.1) });
    }
    return await doc.save();
  }

  it('generates a single complete PDF with cover page, included documents, and footers', async () => {
    // File 1: 1 page
    const bytes1 = await createTestPdfBytes(1, 'Doc 1 Trade License');
    // File 2: 2 pages (Multi-page test)
    const bytes2 = await createTestPdfBytes(2, 'Doc 2 Tax Clearance');
    // File 3: 1 page
    const bytes3 = await createTestPdfBytes(1, 'Doc 3 Bank Solvency');

    const files: UploadedPdf[] = [
      { id: 'f1', file: new File([], 'tl.pdf'), bytes: bytes1, filename: 'Trade_License.pdf', size: bytes1.length, pageCount: 1, sha256: 'h1', isDuplicate: false },
      { id: 'f2', file: new File([], 'tax.pdf'), bytes: bytes2, filename: 'Tax_Clearance.pdf', size: bytes2.length, pageCount: 2, sha256: 'h2', isDuplicate: false },
      { id: 'f3', file: new File([], 'bank.pdf'), bytes: bytes3, filename: 'Bank_Solvency.pdf', size: bytes3.length, pageCount: 1, sha256: 'h3', isDuplicate: false }
    ];

    // R01 -> f1, R02 -> f2, R03 -> f3, R04 -> unmatched optional
    const matchingState: MatchingState = {
      matches: { R01: 'f1', R02: 'f2', R03: 'f3' },
      expiryDates: { R01: '2026-10-25', R02: '2026-10-20' }
    };

    const res = await generateTenderPackage(tender, requirements, matchingState, files, '2026-10-06');
    expect(res.success).toBe(true);
    expect(res.filename).toBe('T-2026-0417_Package.pdf');

    // Total pages = 1 (Cover) + 1 (R01) + 2 (R02) + 1 (R03) = 5 pages
    expect(res.totalPackagePages).toBe(5);
    expect(res.includedDocuments?.length).toBe(3);

    // Verify generated PDF structure by parsing it back with pdf-lib
    const parsedGenerated = await PDFDocument.load(res.pdfBytes!);
    expect(parsedGenerated.getPageCount()).toBe(5);

    // Verify optional unmatched R04 was skipped
    expect(res.includedDocuments?.find((d) => d.requirementId === 'R04')).toBeUndefined();

    // Verify document order: R01 (order 1), R02 (order 2), R03 (order 3)
    expect(res.includedDocuments?.[0].requirementId).toBe('R01');
    expect(res.includedDocuments?.[0].startPage).toBe(2);
    expect(res.includedDocuments?.[0].endPage).toBe(2);

    expect(res.includedDocuments?.[1].requirementId).toBe('R02');
    expect(res.includedDocuments?.[1].startPage).toBe(3);
    expect(res.includedDocuments?.[1].endPage).toBe(4);

    expect(res.includedDocuments?.[2].requirementId).toBe('R03');
    expect(res.includedDocuments?.[2].startPage).toBe(5);
    expect(res.includedDocuments?.[2].endPage).toBe(5);
  });

  it('supports repeated package generation without side effects or errors', async () => {
    const bytes = await createTestPdfBytes(1, 'Single Doc');
    const files: UploadedPdf[] = [
      { id: 'f1', file: new File([], 'doc.pdf'), bytes, filename: 'doc.pdf', size: bytes.length, pageCount: 1, sha256: 'h1', isDuplicate: false }
    ];
    const matchingState: MatchingState = {
      matches: { R01: 'f1' },
      expiryDates: { R01: '2026-10-20' }
    };

    // Run 1
    const res1 = await generateTenderPackage(tender, requirements, matchingState, files);
    expect(res1.success).toBe(true);
    // Run 2
    const res2 = await generateTenderPackage(tender, requirements, matchingState, files);
    expect(res2.success).toBe(true);
    expect(res1.totalPackagePages).toBe(res2.totalPackagePages);
  });
});
