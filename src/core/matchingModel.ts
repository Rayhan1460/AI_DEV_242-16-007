import type { MatchingState } from '../types/matching';
import type { UploadedPdf } from '../types/pdf';

export interface MatchOperationResult {
  success: boolean;
  state: MatchingState;
  error?: string;
}

/**
 * Checks whether a specific uploaded file is eligible to be matched to a requirement.
 * Rules enforced:
 * 1. One uploaded file goes to at most one requirement.
 * 2. Do not allow identical duplicate-content files to be used for different requirements.
 */
export function getFileEligibilityForRequirement(
  file: UploadedPdf,
  targetRequirementId: string,
  state: MatchingState,
  files: UploadedPdf[]
): { eligible: boolean; reason?: string; matchedReqId?: string } {
  // Check if file is already matched to target requirement
  if (state.matches[targetRequirementId] === file.id) {
    return { eligible: true };
  }

  // Check 1: Is this exact file matched to another requirement?
  for (const [reqId, fId] of Object.entries(state.matches)) {
    if (fId === file.id && reqId !== targetRequirementId) {
      return {
        eligible: false,
        reason: `Already matched to requirement "${reqId}"`,
        matchedReqId: reqId
      };
    }
  }

  // Check 2: Is any file with identical content hash matched to another requirement?
  for (const [reqId, fId] of Object.entries(state.matches)) {
    if (reqId !== targetRequirementId) {
      const otherFile = files.find((f) => f.id === fId);
      if (otherFile && otherFile.sha256 === file.sha256) {
        return {
          eligible: false,
          reason: `Duplicate content of "${otherFile.filename}" (matched to "${reqId}")`,
          matchedReqId: reqId
        };
      }
    }
  }

  return { eligible: true };
}

/**
 * Assigns an uploaded file to a requirement.
 * Enforces:
 * - One requirement gets at most one file (replaces prior match)
 * - One uploaded file goes to at most one requirement
 * - Duplicate-content files cannot be matched to different requirements
 */
export function matchFileToRequirement(
  state: MatchingState,
  requirementId: string,
  fileId: string,
  files: UploadedPdf[]
): MatchOperationResult {
  const targetFile = files.find((f) => f.id === fileId);
  if (!targetFile) {
    return {
      success: false,
      state,
      error: `File not found: ${fileId}`
    };
  }

  const eligibility = getFileEligibilityForRequirement(targetFile, requirementId, state, files);
  if (!eligibility.eligible) {
    return {
      success: false,
      state,
      error: eligibility.reason || 'File is not eligible for this requirement.'
    };
  }

  return {
    success: true,
    state: {
      ...state,
      matches: {
        ...state.matches,
        [requirementId]: fileId
      }
    }
  };
}

/**
 * Removes the match for a requirement (undo match).
 */
export function unmatchRequirement(state: MatchingState, requirementId: string): MatchingState {
  const newMatches = { ...state.matches };
  delete newMatches[requirementId];

  return {
    ...state,
    matches: newMatches
  };
}

/**
 * Sets the expiry date for a requirement.
 */
export function setRequirementExpiry(
  state: MatchingState,
  requirementId: string,
  expiryDate: string
): MatchingState {
  return {
    ...state,
    expiryDates: {
      ...state.expiryDates,
      [requirementId]: expiryDate
    }
  };
}

/**
 * Safely cleans up matches when files are removed.
 * Any requirement pointing to a removed file will have its match undone.
 */
export function cleanMatchingOnFilesRemoved(
  state: MatchingState,
  remainingFiles: UploadedPdf[]
): MatchingState {
  const remainingIds = new Set(remainingFiles.map((f) => f.id));
  const newMatches: Record<string, string> = {};

  for (const [reqId, fileId] of Object.entries(state.matches)) {
    if (remainingIds.has(fileId)) {
      newMatches[reqId] = fileId;
    }
  }

  return {
    ...state,
    matches: newMatches
  };
}
