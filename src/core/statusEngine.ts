import type { Requirement, Tender } from '../types/tender';
import type { UploadedPdf } from '../types/pdf';
import type { MatchingState } from '../types/matching';
import type { RequirementEvaluation, StatusSummary } from '../types/status';
import { isBefore, isValidCalendarDate } from './dateUtils';

/**
 * Calculates the exact deterministic status for a single requirement according to competition rules:
 *
 * A) Missing:
 *    mandatory=true AND no file matched => BLOCKING
 *
 * B) Expiry date needed:
 *    file matched AND has_expiry=true AND expiry not entered => BLOCKING
 *
 * C) Expired:
 *    expiry date is BEFORE tender submission_deadline => BLOCKING
 *
 * D) Not provided:
 *    mandatory=false AND no file matched => NON-BLOCKING
 *
 * E) OK:
 *    file matched AND either:
 *    - has_expiry=false
 *    OR
 *    - has_expiry=true and expiry >= submission_deadline => NON-BLOCKING
 *
 * Note: If expiry date equals submission deadline exactly, status is OK.
 */
export function calculateRequirementStatus(
  requirement: Requirement,
  matchedFileId: string | undefined,
  expiryDateStr: string | undefined,
  tenderDeadline: string,
  files?: UploadedPdf[]
): RequirementEvaluation {
  const matchedFile = files && matchedFileId ? files.find((f) => f.id === matchedFileId) : undefined;
  const matchedFilename = matchedFile ? matchedFile.filename : undefined;

  // Case 1: No file matched
  if (!matchedFileId) {
    if (requirement.mandatory) {
      return {
        requirementId: requirement.id,
        status: 'Missing',
        isBlocking: true,
        reason: 'Mandatory requirement requires a matched PDF document.'
      };
    } else {
      return {
        requirementId: requirement.id,
        status: 'Not provided',
        isBlocking: false,
        reason: 'Optional document not provided.'
      };
    }
  }

  // Case 2: File is matched
  if (requirement.has_expiry) {
    const rawExpiry = expiryDateStr ? expiryDateStr.trim() : '';

    if (!rawExpiry || !isValidCalendarDate(rawExpiry)) {
      return {
        requirementId: requirement.id,
        status: 'Expiry date needed',
        isBlocking: true,
        matchedFileId,
        matchedFilename,
        expiryDate: rawExpiry || undefined,
        reason: 'Expiry date is required for this document.'
      };
    }

    // Check if expiry date is BEFORE tender submission_deadline
    if (isBefore(rawExpiry, tenderDeadline)) {
      return {
        requirementId: requirement.id,
        status: 'Expired',
        isBlocking: true,
        matchedFileId,
        matchedFilename,
        expiryDate: rawExpiry,
        reason: `Document expires on ${rawExpiry}, which is before the tender deadline (${tenderDeadline}).`
      };
    }

    // If expiry date equals submission deadline exactly or is after => OK
    return {
      requirementId: requirement.id,
      status: 'OK',
      isBlocking: false,
      matchedFileId,
      matchedFilename,
      expiryDate: rawExpiry,
      reason: `Document verified (valid through ${rawExpiry}).`
    };
  }

  // Matched and does not have expiry => OK
  return {
    requirementId: requirement.id,
    status: 'OK',
    isBlocking: false,
    matchedFileId,
    matchedFilename,
    reason: 'Document matched and verified.'
  };
}

/**
 * Calculates overall status summary across all tender requirements.
 */
export function calculateStatusSummary(
  tender: Tender,
  requirements: Requirement[],
  matchingState: MatchingState,
  files: UploadedPdf[]
): StatusSummary {
  const evaluations: Record<string, RequirementEvaluation> = {};
  const blockingIssues: StatusSummary['blockingIssues'] = [];
  let matchedCount = 0;
  let blockingCount = 0;

  for (const req of requirements) {
    const fileId = matchingState.matches[req.id];
    const expiry = matchingState.expiryDates[req.id];
    if (fileId) {
      matchedCount++;
    }

    const evaluation = calculateRequirementStatus(
      req,
      fileId,
      expiry,
      tender.submission_deadline,
      files
    );

    evaluations[req.id] = evaluation;

    if (evaluation.isBlocking) {
      blockingCount++;
      blockingIssues.push({
        requirementId: req.id,
        requirementTitle: req.title_en,
        status: evaluation.status,
        reason: evaluation.reason || evaluation.status
      });
    }
  }

  return {
    totalRequirements: requirements.length,
    matchedCount,
    blockingCount,
    canGeneratePackage: blockingCount === 0 && requirements.length > 0,
    evaluations,
    blockingIssues
  };
}
