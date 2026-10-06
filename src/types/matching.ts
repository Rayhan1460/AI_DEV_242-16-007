export interface MatchingState {
  // requirementId -> fileId
  matches: Record<string, string>;
  // requirementId -> expiryDate (YYYY-MM-DD)
  expiryDates: Record<string, string>;
}
