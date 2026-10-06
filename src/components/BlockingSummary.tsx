import React, { useState } from 'react';
import type { StatusSummary } from '../types/status';

interface BlockingSummaryProps {
  summary: StatusSummary;
  hasRequirements: boolean;
}

export const BlockingSummary: React.FC<BlockingSummaryProps> = ({ summary, hasRequirements }) => {
  const [modalOpen, setModalOpen] = useState(false);

  if (!hasRequirements) {
    return null;
  }

  const handleGenerateClick = () => {
    if (summary.canGeneratePackage) {
      setModalOpen(true);
    }
  };

  return (
    <section className="card card-blocking-summary">
      <div className="summary-header-row">
        <div>
          <h2 className="card-title">4. Package Readiness & Submission Check</h2>
          <p className="summary-subtitle">
            All mandatory documents must be matched with valid unexpired dates before package generation.
          </p>
        </div>
        <div className="readiness-tag-wrapper">
          {summary.canGeneratePackage ? (
            <span className="badge-readiness badge-ready">READY FOR PACKAGE GENERATION</span>
          ) : (
            <span className="badge-readiness badge-blocked">
              {summary.blockingCount} BLOCKING {summary.blockingCount === 1 ? 'ISSUE' : 'ISSUES'}
            </span>
          )}
        </div>
      </div>

      {summary.blockingIssues.length > 0 ? (
        <div className="blocking-issues-box">
          <h4 className="blocking-box-title">
            ⚠️ The following issues prevent package generation:
          </h4>
          <ul className="blocking-list">
            {summary.blockingIssues.map((issue) => (
              <li key={issue.requirementId} className="blocking-item">
                <span className="issue-req-id">[{issue.requirementId}]</span>
                <strong className="issue-req-title">{issue.requirementTitle}:</strong>
                <span className={`badge-status-pill badge-pill-${issue.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {issue.status}
                </span>
                <span className="issue-reason">{issue.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="success-banner">
          <span className="success-icon">✓</span>
          <div>
            <strong>Validation Succeeded:</strong> All required tender documents are correctly matched and verified.
            No blocking issues detected.
          </div>
        </div>
      )}

      <div className="action-row">
        <button
          type="button"
          id="btn-generate-package"
          className={`btn btn-lg ${summary.canGeneratePackage ? 'btn-primary' : 'btn-disabled'}`}
          disabled={!summary.canGeneratePackage}
          onClick={handleGenerateClick}
        >
          {summary.canGeneratePackage
            ? 'Generate Package (Stage 1 Ready)'
            : `Generate Package (Blocked by ${summary.blockingCount} ${summary.blockingCount === 1 ? 'issue' : 'issues'})`}
        </button>

        {!summary.canGeneratePackage && (
          <p className="btn-helper-text">
            Package generation is locked until all "Missing", "Expiry date needed", and "Expired" issues are resolved.
          </p>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">✓ Stage 1 Verification Complete</h3>
            <p>
              All tender requirements have passed browser-side matching, duplicate check, and date expiry verification!
            </p>
            <p className="modal-note">
              <em>Stage 1 Foundation complete. Final PDF document merging, table of contents, and package download will be implemented in Stage 2.</em>
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
