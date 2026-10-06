import type { Tender, Requirement } from '../types/tender';
import type { UploadedPdf } from '../types/pdf';
import type { MatchingState } from '../types/matching';
import type { RequirementEvaluation } from '../types/status';

/**
 * Exports a clean, compliance-ready CSV checklist of all tender requirements,
 * their match status, file hashes, and expiry dates.
 */
export function generateChecklistCsv(
  tender: Tender,
  requirements: Requirement[],
  matchingState: MatchingState,
  files: UploadedPdf[],
  evaluations: Record<string, RequirementEvaluation>
): string {
  const headers = [
    'Order',
    'Requirement ID',
    'Title (EN)',
    'Title (BN)',
    'Mandatory',
    'Has Expiry',
    'Status',
    'Matched File',
    'File Pages',
    'Expiry Date',
    'SHA-256 Content Hash'
  ];

  const escapeCsv = (val: string | number | boolean | undefined): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);
  const rows: string[] = [];

  // Metadata headers
  rows.push(`# Tender ID: ${tender.tender_id}`);
  rows.push(`# Title: ${tender.title}`);
  rows.push(`# Submission Deadline: ${tender.submission_deadline}`);
  rows.push('');
  rows.push(headers.join(','));

  for (const req of sortedReqs) {
    const fileId = matchingState.matches[req.id];
    const matchedFile = fileId ? files.find((f) => f.id === fileId) : undefined;
    const evaluation = evaluations[req.id];
    const expiry = matchingState.expiryDates[req.id] || '';

    const row = [
      req.order,
      escapeCsv(req.id),
      escapeCsv(req.title_en),
      escapeCsv(req.title_bn),
      req.mandatory ? 'Yes' : 'No',
      req.has_expiry ? 'Yes' : 'No',
      escapeCsv(evaluation?.status || 'Missing'),
      escapeCsv(matchedFile ? matchedFile.filename : 'None'),
      matchedFile ? matchedFile.pageCount : 0,
      escapeCsv(expiry),
      escapeCsv(matchedFile ? matchedFile.sha256 : '')
    ];

    rows.push(row.join(','));
  }

  return rows.join('\r\n');
}

export function downloadChecklistCsv(csvContent: string, tenderId: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanId = tenderId.trim().replace(/[/\\?%*:|"<>]/g, '_');
  a.download = `${cleanId}_Checklist.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
