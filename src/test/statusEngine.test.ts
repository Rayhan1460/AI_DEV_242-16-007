import { describe, it, expect } from 'vitest';
import { calculateRequirementStatus, calculateStatusSummary } from '../core/statusEngine';
import type { Requirement, Tender } from '../types/tender';
import type { UploadedPdf } from '../types/pdf';
import type { MatchingState } from '../types/matching';

describe('Status Engine - Competition Rules Verification', () => {
  const tenderDeadline = '2026-10-20';

  const mockPdf: UploadedPdf = {
    id: 'f1',
    file: new File([], 'doc.pdf'),
    bytes: new Uint8Array(),
    filename: 'doc.pdf',
    size: 1024,
    pageCount: 3,
    sha256: 'abc123hash',
    isDuplicate: false
  };

  // Rule 1: mandatory + unmatched => Missing (BLOCKING)
  it('Rule 1: mandatory + unmatched => Missing (BLOCKING)', () => {
    const req: Requirement = {
      id: 'R01',
      order: 1,
      title_en: 'Trade License',
      title_bn: 'ট্রেড লাইসেন্স',
      mandatory: true,
      has_expiry: true
    };
    const evalResult = calculateRequirementStatus(req, undefined, undefined, tenderDeadline);
    expect(evalResult.status).toBe('Missing');
    expect(evalResult.isBlocking).toBe(true);
  });

  // Rule 2: optional + unmatched => Not provided (NON-BLOCKING)
  it('Rule 2: optional + unmatched => Not provided (NON-BLOCKING)', () => {
    const req: Requirement = {
      id: 'R02',
      order: 2,
      title_en: 'ISO Certificate',
      title_bn: 'আইএসও সনদ',
      mandatory: false,
      has_expiry: false
    };
    const evalResult = calculateRequirementStatus(req, undefined, undefined, tenderDeadline);
    expect(evalResult.status).toBe('Not provided');
    expect(evalResult.isBlocking).toBe(false);
  });

  // Rule 3: expiry-required matched + empty expiry => Expiry date needed (BLOCKING)
  it('Rule 3: expiry-required matched + empty expiry => Expiry date needed (BLOCKING)', () => {
    const req: Requirement = {
      id: 'R03',
      order: 3,
      title_en: 'Tax Clearance',
      title_bn: 'ট্যাক্স ক্লিয়ারেন্স',
      mandatory: true,
      has_expiry: true
    };
    const evalResultEmpty = calculateRequirementStatus(req, mockPdf.id, '', tenderDeadline);
    expect(evalResultEmpty.status).toBe('Expiry date needed');
    expect(evalResultEmpty.isBlocking).toBe(true);

    const evalResultUndefined = calculateRequirementStatus(req, mockPdf.id, undefined, tenderDeadline);
    expect(evalResultUndefined.status).toBe('Expiry date needed');
    expect(evalResultUndefined.isBlocking).toBe(true);
  });

  // Rule 4: expiry one day before deadline => Expired (BLOCKING)
  it('Rule 4: expiry one day before deadline => Expired (BLOCKING)', () => {
    const req: Requirement = {
      id: 'R04',
      order: 4,
      title_en: 'Bank Solvency',
      title_bn: 'ব্যাংক স্বচ্ছলতা',
      mandatory: true,
      has_expiry: true
    };
    // Tender deadline is 2026-10-20; one day before is 2026-10-19
    const evalResult = calculateRequirementStatus(req, mockPdf.id, '2026-10-19', tenderDeadline);
    expect(evalResult.status).toBe('Expired');
    expect(evalResult.isBlocking).toBe(true);
  });

  // Rule 5: expiry exactly deadline => OK (NON-BLOCKING)
  it('Rule 5: expiry exactly deadline => OK (NON-BLOCKING)', () => {
    const req: Requirement = {
      id: 'R05',
      order: 5,
      title_en: 'Trade License',
      title_bn: 'ট্রেড লাইসেন্স',
      mandatory: true,
      has_expiry: true
    };
    // Tender deadline is 2026-10-20; exactly deadline is 2026-10-20
    const evalResult = calculateRequirementStatus(req, mockPdf.id, '2026-10-20', tenderDeadline);
    expect(evalResult.status).toBe('OK');
    expect(evalResult.isBlocking).toBe(false);
  });

  // Rule 6: expiry after deadline => OK (NON-BLOCKING)
  it('Rule 6: expiry after deadline => OK (NON-BLOCKING)', () => {
    const req: Requirement = {
      id: 'R06',
      order: 6,
      title_en: 'Trade License',
      title_bn: 'ট্রেড লাইসেন্স',
      mandatory: true,
      has_expiry: true
    };
    // Tender deadline is 2026-10-20; after deadline is 2026-10-21
    const evalResult = calculateRequirementStatus(req, mockPdf.id, '2026-10-21', tenderDeadline);
    expect(evalResult.status).toBe('OK');
    expect(evalResult.isBlocking).toBe(false);
  });

  // Rule 7: matched non-expiry document => OK (NON-BLOCKING)
  it('Rule 7: matched non-expiry document => OK (NON-BLOCKING)', () => {
    const req: Requirement = {
      id: 'R07',
      order: 7,
      title_en: 'Company Profile',
      title_bn: 'কোম্পানি প্রোফাইল',
      mandatory: true,
      has_expiry: false
    };
    const evalResult = calculateRequirementStatus(req, mockPdf.id, undefined, tenderDeadline);
    expect(evalResult.status).toBe('OK');
    expect(evalResult.isBlocking).toBe(false);
  });

  it('calculates package generation blocking state correctly in calculateStatusSummary', () => {
    const tender: Tender = {
      tender_id: 'T-2026-001',
      title: 'IT Supply',
      procuring_entity: 'Ministry',
      bidder: 'Acme Corp',
      submission_deadline: '2026-10-20'
    };

    const reqs: Requirement[] = [
      { id: 'R01', order: 1, title_en: 'Trade License', title_bn: '', mandatory: true, has_expiry: true },
      { id: 'R02', order: 2, title_en: 'Optional Brochure', title_bn: '', mandatory: false, has_expiry: false }
    ];

    const state1: MatchingState = {
      matches: {},
      expiryDates: {}
    };

    const summary1 = calculateStatusSummary(tender, reqs, state1, [mockPdf]);
    expect(summary1.canGeneratePackage).toBe(false);
    expect(summary1.blockingCount).toBe(1); // R01 Missing
    expect(summary1.blockingIssues[0].status).toBe('Missing');

    // Now match R01 with valid date
    const state2: MatchingState = {
      matches: { R01: 'f1' },
      expiryDates: { R01: '2026-10-25' }
    };
    const summary2 = calculateStatusSummary(tender, reqs, state2, [mockPdf]);
    expect(summary2.canGeneratePackage).toBe(true);
    expect(summary2.blockingCount).toBe(0);
  });
});
