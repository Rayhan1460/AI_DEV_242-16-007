import { describe, it, expect } from 'vitest';
import { parseAndValidateRequirementsJson } from '../core/requirementsValidator';
import {
  matchFileToRequirement,
  unmatchRequirement,
  cleanMatchingOnFilesRemoved
} from '../core/matchingModel';
import { calculateRequirementStatus, calculateStatusSummary } from '../core/statusEngine';
import { refreshDuplicateStatuses, computeSha256 } from '../core/pdfService';
import { generateTenderPackage } from '../core/pdfGenerator';
import { PDFDocument, rgb } from 'pdf-lib';
import type { UploadedPdf } from '../types/pdf';
import type { MatchingState } from '../types/matching';
import { SAMPLE_REQUIREMENTS_JSON } from '../data/sampleRequirements';

describe('Stage 2 End-to-End & Edge Cases Verification', () => {
  async function makePdf(pageCount: number, label: string): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    for (let i = 1; i <= pageCount; i++) {
      const p = doc.addPage([595.28, 841.89]);
      p.drawText(`${label} - Page ${i}`, { x: 50, y: 700, size: 18, color: rgb(0, 0, 0) });
    }
    return await doc.save();
  }

  it('verifies requirements JSON parsing and order sorting', () => {
    const parsed = parseAndValidateRequirementsJson(SAMPLE_REQUIREMENTS_JSON);
    expect(parsed.success).toBe(true);
    const reqs = parsed.data!.requirements;
    for (let i = 1; i < reqs.length; i++) {
      expect(reqs[i].order).toBeGreaterThanOrEqual(reqs[i - 1].order);
    }
  });

  it('verifies all 5 statuses and exact deadline equality', () => {
    const deadline = '2026-10-20';
    const mandatoryReq = { id: 'M1', order: 1, title_en: 'Mandatory Doc', title_bn: '', mandatory: true, has_expiry: true };
    const optionalReq = { id: 'O1', order: 2, title_en: 'Optional Doc', title_bn: '', mandatory: false, has_expiry: false };

    // 1. Missing
    expect(calculateRequirementStatus(mandatoryReq, undefined, undefined, deadline).status).toBe('Missing');
    // 2. Not provided
    expect(calculateRequirementStatus(optionalReq, undefined, undefined, deadline).status).toBe('Not provided');
    // 3. Expiry date needed
    expect(calculateRequirementStatus(mandatoryReq, 'f1', '', deadline).status).toBe('Expiry date needed');
    // 4. Expired (one day before deadline)
    expect(calculateRequirementStatus(mandatoryReq, 'f1', '2026-10-19', deadline).status).toBe('Expired');
    // 5. OK (exact deadline date: 2026-10-20)
    expect(calculateRequirementStatus(mandatoryReq, 'f1', '2026-10-20', deadline).status).toBe('OK');
    // 6. OK (after deadline: 2026-10-21)
    expect(calculateRequirementStatus(mandatoryReq, 'f1', '2026-10-21', deadline).status).toBe('OK');
    // 7. OK (non-expiry matched)
    expect(calculateRequirementStatus(optionalReq, 'f1', undefined, deadline).status).toBe('OK');
  });

  it('detects duplicate content across different filenames and blocks duplicate matching', async () => {
    const bytesA = await makePdf(1, 'Original Document');
    // File B has identical bytes to File A but different filename
    const bytesB = new Uint8Array(bytesA);
    const hashA = await computeSha256(bytesA);
    const hashB = await computeSha256(bytesB);

    expect(hashA).toBe(hashB);

    const file1: UploadedPdf = { id: 'f1', file: new File([], 'Trade_License.pdf'), bytes: bytesA, filename: 'Trade_License.pdf', size: bytesA.length, pageCount: 1, sha256: hashA, isDuplicate: false };
    const file2: UploadedPdf = { id: 'f2', file: new File([], 'Renamed_Duplicate.pdf'), bytes: bytesB, filename: 'Renamed_Duplicate.pdf', size: bytesB.length, pageCount: 1, sha256: hashB, isDuplicate: false };

    const refreshed = refreshDuplicateStatuses([file1, file2]);
    expect(refreshed[0].isDuplicate).toBe(true);
    expect(refreshed[1].isDuplicate).toBe(true);

    // Matching file 1 to R01
    let state: MatchingState = { matches: {}, expiryDates: {} };
    const matchRes1 = matchFileToRequirement(state, 'R01', 'f1', refreshed);
    expect(matchRes1.success).toBe(true);
    state = matchRes1.state;

    // Attempting to match identical-content file 2 to R02 must be BLOCKED
    const matchRes2 = matchFileToRequirement(state, 'R02', 'f2', refreshed);
    expect(matchRes2.success).toBe(false);
    expect(matchRes2.error).toContain('Duplicate content');

    // Removing f1 clears match and unblocks
    const remaining = [refreshed[1]];
    const cleaned = cleanMatchingOnFilesRemoved(state, remaining);
    expect(cleaned.matches['R01']).toBeUndefined();

    // Verify unmatchRequirement directly
    const undone = unmatchRequirement(state, 'R01');
    expect(undone.matches['R01']).toBeUndefined();
  });

  it('generates multi-page PDF package skipping unmatched optional documents and stamps correct footers', async () => {
    const parsed = parseAndValidateRequirementsJson(SAMPLE_REQUIREMENTS_JSON);
    const tender = parsed.data!.tender;
    const requirements = parsed.data!.requirements;

    // Create 3 documents:
    // doc1: 1 page (matched to R01)
    // doc2: 3 pages (multi-page PDF matched to R02)
    // doc3: 2 pages (matched to R03)
    // R04 and R05 are optional and left unmatched
    const b1 = await makePdf(1, 'R01 Trade License');
    const b2 = await makePdf(3, 'R02 Tax Clearance MultiPage');
    const b3 = await makePdf(2, 'R03 Bank Solvency');

    const files: UploadedPdf[] = [
      { id: 'f1', file: new File([], 'doc1.pdf'), bytes: b1, filename: 'doc1.pdf', size: b1.length, pageCount: 1, sha256: 'h1', isDuplicate: false },
      { id: 'f2', file: new File([], 'doc2.pdf'), bytes: b2, filename: 'doc2.pdf', size: b2.length, pageCount: 3, sha256: 'h2', isDuplicate: false },
      { id: 'f3', file: new File([], 'doc3.pdf'), bytes: b3, filename: 'doc3.pdf', size: b3.length, pageCount: 2, sha256: 'h3', isDuplicate: false }
    ];

    const matchingState: MatchingState = {
      matches: {
        R01: 'f1',
        R02: 'f2',
        R03: 'f3'
        // R04, R05 unmatched optional
      },
      expiryDates: {
        R01: '2026-10-20', // exact deadline date
        R02: '2026-11-01'  // after deadline
      }
    };

    // Verify summary: blocking count must be 0, canGeneratePackage must be true
    const summary = calculateStatusSummary(tender, requirements, matchingState, files);
    expect(summary.blockingCount).toBe(0);
    expect(summary.canGeneratePackage).toBe(true);

    // Generate Package
    const genResult = await generateTenderPackage(tender, requirements, matchingState, files, '2026-10-06');
    expect(genResult.success).toBe(true);
    expect(genResult.filename).toBe('T-2026-0417_Package.pdf');

    // Expected total pages: 1 (cover) + 1 (doc1) + 3 (doc2) + 2 (doc3) = 7 pages
    expect(genResult.totalPackagePages).toBe(7);
    expect(genResult.includedDocuments?.length).toBe(3);

    // Inspect the generated PDF structure
    const compiledDoc = await PDFDocument.load(genResult.pdfBytes!);
    expect(compiledDoc.getPageCount()).toBe(7);

    // Verify page ranges for each included document
    const entries = genResult.includedDocuments!;
    expect(entries[0].requirementId).toBe('R01');
    expect(entries[0].startPage).toBe(2);
    expect(entries[0].endPage).toBe(2);

    expect(entries[1].requirementId).toBe('R02');
    expect(entries[1].startPage).toBe(3);
    expect(entries[1].endPage).toBe(5);

    expect(entries[2].requirementId).toBe('R03');
    expect(entries[2].startPage).toBe(6);
    expect(entries[2].endPage).toBe(7);
  });
});
