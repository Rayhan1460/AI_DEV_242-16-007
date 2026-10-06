export type RequirementStatusType =
  | 'Missing'
  | 'Expiry date needed'
  | 'Expired'
  | 'Not provided'
  | 'OK';

export interface RequirementEvaluation {
  requirementId: string;
  status: RequirementStatusType;
  isBlocking: boolean;
  matchedFileId?: string;
  matchedFilename?: string;
  expiryDate?: string;
  reason?: string;
}

export interface StatusSummary {
  totalRequirements: number;
  matchedCount: number;
  blockingCount: number;
  canGeneratePackage: boolean;
  evaluations: Record<string, RequirementEvaluation>;
  blockingIssues: {
    requirementId: string;
    requirementTitle: string;
    status: RequirementStatusType;
    reason: string;
  }[];
}
