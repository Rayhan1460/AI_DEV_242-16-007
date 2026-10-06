import React, { useState } from 'react';
import type { Tender, Requirement } from '../types/tender';
import type { UploadedPdf } from '../types/pdf';
import type { MatchingState } from '../types/matching';
import type { StatusSummary, RequirementStatusType } from '../types/status';
import { generateTenderPackage, downloadPdfBytes, type GeneratePackageResult } from '../core/pdfGenerator';
import { useLanguage } from '../i18n/useLanguage';

interface BlockingSummaryProps {
  tender: Tender;
  requirements: Requirement[];
  uploadedFiles: UploadedPdf[];
  matchingState: MatchingState;
  summary: StatusSummary;
  hasRequirements: boolean;
}

export const BlockingSummary: React.FC<BlockingSummaryProps> = ({
  tender,
  requirements,
  uploadedFiles,
  matchingState,
  summary,
  hasRequirements
}) => {
  const { language, t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationResult, setGenerationResult] = useState<GeneratePackageResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  if (!hasRequirements) {
    return null;
  }

  const getStatusLabel = (status: RequirementStatusType): string => {
    switch (status) {
      case 'OK':
        return `✓ ${t.statusOk}`;
      case 'Not provided':
        return `○ ${t.statusNotProvided}`;
      case 'Missing':
        return `✕ ${t.statusMissing}`;
      case 'Expiry date needed':
        return `📅 ${t.statusExpiryNeeded}`;
      case 'Expired':
        return `⌛ ${t.statusExpired}`;
      default:
        return status;
    }
  };

  const handleGeneratePackage = async () => {
    if (!summary.canGeneratePackage || isGenerating) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await generateTenderPackage(
        tender,
        requirements,
        matchingState,
        uploadedFiles
      );

      if (!result.success || !result.pdfBytes) {
        setGenerationError(result.error || 'Failed to generate package PDF.');
      } else {
        setGenerationResult(result);
        // Automatically trigger client-side download as requested
        if (result.filename) {
          downloadPdfBytes(result.pdfBytes, result.filename);
        }
      }
    } catch (err) {
      setGenerationError(
        `Unexpected error during package generation: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualDownload = () => {
    if (generationResult?.pdfBytes && generationResult.filename) {
      downloadPdfBytes(generationResult.pdfBytes, generationResult.filename);
    }
  };

  return (
    <section className="card card-blocking-summary">
      <div className="summary-header-row">
        <div>
          <h2 className="card-title">{t.packageSectionTitle}</h2>
          <p className="summary-subtitle">{t.packageSubtitle}</p>
        </div>
        <div className="readiness-tag-wrapper">
          {summary.canGeneratePackage ? (
            <span className="badge-readiness badge-ready">{t.readyBadge}</span>
          ) : (
            <span className="badge-readiness badge-blocked">
              {summary.blockingCount} {language === 'bn' ? `${summary.blockingCount} ${t.blockingBadge}` : `${summary.blockingCount === 1 ? 'BLOCKING ISSUE' : 'BLOCKING ISSUES'}`}
            </span>
          )}
        </div>
      </div>

      {summary.blockingIssues.length > 0 ? (
        <div className="blocking-issues-box">
          <h4 className="blocking-box-title">{t.blockingBoxTitle}</h4>
          <ul className="blocking-list">
            {summary.blockingIssues.map((issue) => {
              const req = requirements.find((r) => r.id === issue.requirementId);
              const title = language === 'bn' ? (req?.title_bn || issue.requirementTitle) : issue.requirementTitle;

              return (
                <li key={issue.requirementId} className="blocking-item">
                  <span className="issue-req-id">[{issue.requirementId}]</span>
                  <strong className="issue-req-title">{title}:</strong>
                  <span className={`badge-status-pill badge-pill-${issue.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {getStatusLabel(issue.status)}
                  </span>
                  <span className="issue-reason">{issue.reason}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="success-banner">
          <span className="success-icon">✓</span>
          <div>{t.successBannerText}</div>
        </div>
      )}

      {generationError && (
        <div className="alert alert-error">
          <strong>Error:</strong> {generationError}
        </div>
      )}

      {generationResult && (
        <div className="package-success-card">
          <div className="package-success-header">
            <h4>{t.generationSuccessTitle}</h4>
            <p className="package-success-subtitle">{t.generationSuccessSubtitle}</p>
          </div>
          <div className="package-meta-summary">
            <span>File: <strong>{generationResult.filename}</strong></span>
            <span>•</span>
            <span>Total Pages: <strong>{generationResult.totalPackagePages}</strong></span>
            <span>•</span>
            <span>Included Documents: <strong>{generationResult.includedDocuments?.length}</strong></span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm btn-download-again"
            onClick={handleManualDownload}
          >
            📥 {t.btnDownloadPackage}
          </button>
        </div>
      )}

      <div className="action-row">
        <button
          type="button"
          id="btn-generate-package"
          className={`btn btn-lg ${summary.canGeneratePackage ? 'btn-primary' : 'btn-disabled'}`}
          disabled={!summary.canGeneratePackage || isGenerating}
          onClick={handleGeneratePackage}
        >
          {isGenerating ? (
            <span>⏳ {t.btnGenerating}</span>
          ) : summary.canGeneratePackage ? (
            <span>🚀 {t.btnGeneratePackage}</span>
          ) : (
            <span>
              {language === 'bn'
                ? `প্যাকেজ তৈরি লক (${summary.blockingCount}টি সমস্যা বাকি)`
                : `Generate Package (Blocked by ${summary.blockingCount} ${summary.blockingCount === 1 ? 'issue' : 'issues'})`}
            </span>
          )}
        </button>

        {!summary.canGeneratePackage && (
          <p className="btn-helper-text">{t.btnHelperText}</p>
        )}
      </div>
    </section>
  );
};
