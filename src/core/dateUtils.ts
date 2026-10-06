/**
 * Validates whether a string is a strict YYYY-MM-DD format representing a real calendar date.
 */
export function isValidCalendarDate(dateStr: string): boolean {
  if (typeof dateStr !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Compares two YYYY-MM-DD date strings.
 * Returns negative if a < b, 0 if a === b, positive if a > b.
 * Assumes valid YYYY-MM-DD format.
 */
export function compareDates(dateA: string, dateB: string): number {
  const cleanA = dateA.trim();
  const cleanB = dateB.trim();
  if (cleanA < cleanB) return -1;
  if (cleanA > cleanB) return 1;
  return 0;
}

/**
 * Returns true if dateA is strictly before dateB.
 */
export function isBefore(dateA: string, dateB: string): boolean {
  return compareDates(dateA, dateB) < 0;
}

/**
 * Returns true if dateA is on or after dateB (>=).
 */
export function isOnOrAfter(dateA: string, dateB: string): boolean {
  return compareDates(dateA, dateB) >= 0;
}
