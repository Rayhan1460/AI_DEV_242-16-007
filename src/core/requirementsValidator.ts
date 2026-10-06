import type { Requirement, RequirementsFile, Tender } from '../types/tender';
import { isValidCalendarDate } from './dateUtils';

export interface ValidationResult {
  success: boolean;
  data?: RequirementsFile;
  error?: string;
}

export function parseAndValidateRequirementsJson(rawInput: unknown): ValidationResult {
  let parsed: unknown = rawInput;

  if (typeof rawInput === 'string') {
    try {
      parsed = JSON.parse(rawInput);
    } catch (err) {
      return {
        success: false,
        error: `JSON parse error: ${err instanceof Error ? err.message : 'Invalid JSON format'}`
      };
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      success: false,
      error: 'Invalid requirements file: Root must be a JSON object containing "tender" and "requirements".'
    };
  }

  const root = parsed as Record<string, unknown>;

  // 1. Validate Tender
  if (!root.tender || typeof root.tender !== 'object' || Array.isArray(root.tender)) {
    return {
      success: false,
      error: 'Invalid requirements file: Missing "tender" object.'
    };
  }

  const tenderObj = root.tender as Record<string, unknown>;

  const tenderStringFields: (keyof Omit<Tender, 'submission_deadline'>)[] = [
    'tender_id',
    'title',
    'procuring_entity',
    'bidder'
  ];

  for (const field of tenderStringFields) {
    const val = tenderObj[field];
    if (typeof val !== 'string' || val.trim().length === 0) {
      return {
        success: false,
        error: `Invalid tender: Field "${field}" is required and must be a non-empty string.`
      };
    }
  }

  const submissionDeadline = tenderObj.submission_deadline;
  if (typeof submissionDeadline !== 'string' || !isValidCalendarDate(submissionDeadline)) {
    return {
      success: false,
      error: `Invalid tender: "submission_deadline" must be a valid calendar date in YYYY-MM-DD format (received "${String(submissionDeadline)}").`
    };
  }

  const validatedTender: Tender = {
    tender_id: (tenderObj.tender_id as string).trim(),
    title: (tenderObj.title as string).trim(),
    procuring_entity: (tenderObj.procuring_entity as string).trim(),
    bidder: (tenderObj.bidder as string).trim(),
    submission_deadline: submissionDeadline.trim()
  };

  // 2. Validate Requirements array
  if (!Array.isArray(root.requirements)) {
    return {
      success: false,
      error: 'Invalid requirements file: "requirements" must be an array.'
    };
  }

  if (root.requirements.length === 0) {
    return {
      success: false,
      error: 'Invalid requirements file: "requirements" array cannot be empty.'
    };
  }

  const seenIds = new Set<string>();
  const validatedRequirements: Requirement[] = [];

  for (let i = 0; i < root.requirements.length; i++) {
    const item = root.requirements[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return {
        success: false,
        error: `Requirement at index ${i} is not a valid object.`
      };
    }

    const reqObj = item as Record<string, unknown>;

    // id
    if (typeof reqObj.id !== 'string' || reqObj.id.trim().length === 0) {
      return {
        success: false,
        error: `Requirement at index ${i} is missing a non-empty "id".`
      };
    }
    const cleanId = reqObj.id.trim();
    if (seenIds.has(cleanId)) {
      return {
        success: false,
        error: `Duplicate requirement id detected: "${cleanId}". Requirement IDs must be unique.`
      };
    }
    seenIds.add(cleanId);

    // order
    if (typeof reqObj.order !== 'number' || !Number.isFinite(reqObj.order)) {
      return {
        success: false,
        error: `Requirement "${cleanId}" has invalid "order": must be a valid finite number.`
      };
    }

    // title_en
    if (typeof reqObj.title_en !== 'string' || reqObj.title_en.trim().length === 0) {
      return {
        success: false,
        error: `Requirement "${cleanId}" is missing mandatory string "title_en".`
      };
    }

    // title_bn
    if (typeof reqObj.title_bn !== 'string') {
      return {
        success: false,
        error: `Requirement "${cleanId}" is missing string "title_bn".`
      };
    }

    // mandatory
    if (typeof reqObj.mandatory !== 'boolean') {
      return {
        success: false,
        error: `Requirement "${cleanId}" field "mandatory" must be a boolean.`
      };
    }

    // has_expiry
    if (typeof reqObj.has_expiry !== 'boolean') {
      return {
        success: false,
        error: `Requirement "${cleanId}" field "has_expiry" must be a boolean.`
      };
    }

    validatedRequirements.push({
      id: cleanId,
      order: reqObj.order,
      title_en: reqObj.title_en.trim(),
      title_bn: reqObj.title_bn.trim(),
      mandatory: reqObj.mandatory,
      has_expiry: reqObj.has_expiry
    });
  }

  // Sort requirements by numeric "order"
  validatedRequirements.sort((a, b) => a.order - b.order);

  return {
    success: true,
    data: {
      tender: validatedTender,
      requirements: validatedRequirements
    }
  };
}
