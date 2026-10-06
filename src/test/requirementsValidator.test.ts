import { describe, it, expect } from 'vitest';
import { parseAndValidateRequirementsJson } from '../core/requirementsValidator';
import { isValidCalendarDate } from '../core/dateUtils';

describe('Requirements Validator & Date Utils', () => {
  it('validates calendar dates strictly', () => {
    expect(isValidCalendarDate('2026-10-20')).toBe(true);
    expect(isValidCalendarDate('2024-02-29')).toBe(true); // Leap year
    expect(isValidCalendarDate('2025-02-29')).toBe(false); // Non leap year
    expect(isValidCalendarDate('2026-02-30')).toBe(false);
    expect(isValidCalendarDate('2026-13-01')).toBe(false);
    expect(isValidCalendarDate('not-a-date')).toBe(false);
    expect(isValidCalendarDate('2026/10/20')).toBe(false);
  });

  it('validates and sorts valid requirements by numeric order', () => {
    const raw = {
      tender: {
        tender_id: 'T-2026-0417',
        title: 'Supply of IT Equipment',
        procuring_entity: 'Example Directorate',
        bidder: 'Example Company Ltd.',
        submission_deadline: '2026-10-20'
      },
      requirements: [
        {
          id: 'R02',
          order: 2,
          title_en: 'Tax Clearance',
          title_bn: 'কর সনদ',
          mandatory: false,
          has_expiry: true
        },
        {
          id: 'R01',
          order: 1,
          title_en: 'Trade License',
          title_bn: 'ট্রেড লাইসেন্স',
          mandatory: true,
          has_expiry: true
        }
      ]
    };

    const res = parseAndValidateRequirementsJson(raw);
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    // Verify sorted by order: R01 then R02
    expect(res.data?.requirements[0].id).toBe('R01');
    expect(res.data?.requirements[1].id).toBe('R02');
  });

  it('rejects invalid JSON syntax', () => {
    const res = parseAndValidateRequirementsJson('{ invalid json');
    expect(res.success).toBe(false);
    expect(res.error).toContain('JSON parse error');
  });

  it('rejects missing tender metadata', () => {
    const missingTitle = {
      tender: {
        tender_id: 'T-01',
        procuring_entity: 'Dept',
        bidder: 'Corp',
        submission_deadline: '2026-10-20'
      },
      requirements: []
    };
    const res = parseAndValidateRequirementsJson(missingTitle);
    expect(res.success).toBe(false);
    expect(res.error).toContain('title');
  });

  it('rejects invalid submission deadline', () => {
    const badDate = {
      tender: {
        tender_id: 'T-01',
        title: 'Title',
        procuring_entity: 'Dept',
        bidder: 'Corp',
        submission_deadline: '2026-02-31'
      },
      requirements: [
        {
          id: 'R01',
          order: 1,
          title_en: 'Doc',
          title_bn: '',
          mandatory: true,
          has_expiry: false
        }
      ]
    };
    const res = parseAndValidateRequirementsJson(badDate);
    expect(res.success).toBe(false);
    expect(res.error).toContain('submission_deadline');
  });

  it('rejects duplicate requirement ids', () => {
    const dupIds = {
      tender: {
        tender_id: 'T-01',
        title: 'Title',
        procuring_entity: 'Dept',
        bidder: 'Corp',
        submission_deadline: '2026-10-20'
      },
      requirements: [
        { id: 'R01', order: 1, title_en: 'Doc 1', title_bn: '', mandatory: true, has_expiry: false },
        { id: 'R01', order: 2, title_en: 'Doc 2', title_bn: '', mandatory: true, has_expiry: false }
      ]
    };
    const res = parseAndValidateRequirementsJson(dupIds);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Duplicate requirement id');
  });
});
