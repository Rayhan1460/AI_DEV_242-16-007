import { describe, it, expect } from 'vitest';
import {
  matchFileToRequirement,
  unmatchRequirement,
  cleanMatchingOnFilesRemoved,
  getFileEligibilityForRequirement
} from '../core/matchingModel';
import type { UploadedPdf } from '../types/pdf';
import type { MatchingState } from '../types/matching';

describe('Matching Model Logic', () => {
  const fileA: UploadedPdf = {
    id: 'f-a',
    file: new File([], 'docA.pdf'),
    bytes: new Uint8Array(),
    filename: 'docA.pdf',
    size: 100,
    pageCount: 1,
    sha256: 'hash-aaa',
    isDuplicate: false
  };

  const fileB: UploadedPdf = {
    id: 'f-b',
    file: new File([], 'docB.pdf'),
    bytes: new Uint8Array(),
    filename: 'docB.pdf',
    size: 200,
    pageCount: 2,
    sha256: 'hash-bbb',
    isDuplicate: false
  };

  // fileC has identical content hash to fileA (duplicate content with different filename)
  const fileC: UploadedPdf = {
    id: 'f-c',
    file: new File([], 'docC_copy.pdf'),
    bytes: new Uint8Array(),
    filename: 'docC_copy.pdf',
    size: 100,
    pageCount: 1,
    sha256: 'hash-aaa', // duplicate of fileA
    isDuplicate: true,
    duplicateOf: ['docA.pdf']
  };

  const allFiles = [fileA, fileB, fileC];

  it('allows matching a file to a requirement', () => {
    const initialState: MatchingState = { matches: {}, expiryDates: {} };
    const res = matchFileToRequirement(initialState, 'R01', fileA.id, allFiles);

    expect(res.success).toBe(true);
    expect(res.state.matches['R01']).toBe(fileA.id);
  });

  it('enforces: one file cannot be matched to two different requirements', () => {
    const state: MatchingState = {
      matches: { R01: fileA.id },
      expiryDates: {}
    };

    // Try matching fileA to R02 while already matched to R01
    const res = matchFileToRequirement(state, 'R02', fileA.id, allFiles);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Already matched to requirement "R01"');
    expect(res.state.matches['R02']).toBeUndefined();
  });

  it('enforces: duplicate-content files cannot be matched to different requirements', () => {
    const state: MatchingState = {
      matches: { R01: fileA.id }, // fileA with hash-aaa is matched to R01
      expiryDates: {}
    };

    // fileC has the identical hash-aaa as fileA
    const res = matchFileToRequirement(state, 'R02', fileC.id, allFiles);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Duplicate content of "docA.pdf"');
    expect(res.state.matches['R02']).toBeUndefined();
  });

  it('allows changing a match for a requirement', () => {
    const state: MatchingState = {
      matches: { R01: fileA.id },
      expiryDates: {}
    };

    // Change match of R01 from fileA to fileB
    const res = matchFileToRequirement(state, 'R01', fileB.id, allFiles);
    expect(res.success).toBe(true);
    expect(res.state.matches['R01']).toBe(fileB.id);
  });

  it('allows undoing a match (unmatching)', () => {
    const state: MatchingState = {
      matches: { R01: fileA.id },
      expiryDates: {}
    };

    const nextState = unmatchRequirement(state, 'R01');
    expect(nextState.matches['R01']).toBeUndefined();
  });

  it('safely cleans up state when an uploaded file is removed', () => {
    const state: MatchingState = {
      matches: {
        R01: fileA.id,
        R02: fileB.id
      },
      expiryDates: {}
    };

    // Remove fileA, keeping only fileB
    const cleaned = cleanMatchingOnFilesRemoved(state, [fileB]);
    expect(cleaned.matches['R01']).toBeUndefined();
    expect(cleaned.matches['R02']).toBe(fileB.id);
  });

  it('checks file eligibility for UI selection correctly', () => {
    const state: MatchingState = {
      matches: { R01: fileA.id },
      expiryDates: {}
    };

    // fileA is eligible for R01 (its current match)
    expect(getFileEligibilityForRequirement(fileA, 'R01', state, allFiles).eligible).toBe(true);

    // fileA is ineligible for R02
    expect(getFileEligibilityForRequirement(fileA, 'R02', state, allFiles).eligible).toBe(false);

    // fileC (duplicate of A) is ineligible for R02
    expect(getFileEligibilityForRequirement(fileC, 'R02', state, allFiles).eligible).toBe(false);

    // fileB is eligible for R02
    expect(getFileEligibilityForRequirement(fileB, 'R02', state, allFiles).eligible).toBe(true);
  });
});
