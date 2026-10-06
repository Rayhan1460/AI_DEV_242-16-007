import React from 'react';
import type { Requirement } from '../types/tender';
import type { UploadedPdf } from '../types/pdf';
import type { MatchingState } from '../types/matching';
import type { RequirementEvaluation, RequirementStatusType } from '../types/status';
import { getFileEligibilityForRequirement } from '../core/matchingModel';

interface RequirementsTableProps {
  requirements: Requirement[];
  uploadedFiles: UploadedPdf[];
  matchingState: MatchingState;
  evaluations: Record<string, RequirementEvaluation>;
  onMatchChange: (requirementId: string, fileId: string) => void;
  onUnmatch: (requirementId: string) => void;
  onExpiryChange: (requirementId: string, expiryDate: string) => void;
}

export const RequirementsTable: React.FC<RequirementsTableProps> = ({
  requirements,
  uploadedFiles,
  matchingState,
  evaluations,
  onMatchChange,
  onUnmatch,
  onExpiryChange
}) => {
  const getBadgeClass = (status: RequirementStatusType) => {
    switch (status) {
      case 'OK':
        return 'badge-status-ok';
      case 'Not provided':
        return 'badge-status-optional';
      case 'Missing':
        return 'badge-status-missing';
      case 'Expiry date needed':
        return 'badge-status-expiry-needed';
      case 'Expired':
        return 'badge-status-expired';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <section className="card card-requirements-matching">
      <div className="card-header">
        <h2 className="card-title">3. Document Matching & Verification</h2>
        <span className="step-tag">Matching Engine</span>
      </div>

      <div className="table-wrapper">
        <table className="data-table requirements-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>#</th>
              <th>Requirement Document</th>
              <th style={{ width: '130px' }}>Type</th>
              <th style={{ minWidth: '220px' }}>Matched PDF</th>
              <th style={{ minWidth: '160px' }}>Expiry Date</th>
              <th style={{ width: '170px' }}>Current Status</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req) => {
              const currentFileId = matchingState.matches[req.id] || '';
              const evaluation = evaluations[req.id];
              const isMatched = !!currentFileId;
              const expiryValue = matchingState.expiryDates[req.id] || '';

              return (
                <tr
                  key={req.id}
                  className={evaluation?.isBlocking ? 'row-blocking' : ''}
                >
                  <td className="cell-order">
                    <span className="order-num">{req.order}</span>
                  </td>

                  <td className="cell-req-info">
                    <div className="req-header-row">
                      <strong className="req-title-en">{req.title_en}</strong>
                      <span className="req-id-tag">{req.id}</span>
                    </div>
                    {req.title_bn && (
                      <div className="req-title-bn">{req.title_bn}</div>
                    )}
                  </td>

                  <td>
                    <div className="type-tags">
                      {req.mandatory ? (
                        <span className="badge badge-mandatory">Mandatory</span>
                      ) : (
                        <span className="badge badge-optional">Optional</span>
                      )}
                      {req.has_expiry && (
                        <span className="badge badge-has-expiry" title="Expiry date required if matched">
                          Expires
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="cell-matching-control">
                    <div className="matching-control-group">
                      <select
                        className="form-select"
                        value={currentFileId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            onUnmatch(req.id);
                          } else {
                            onMatchChange(req.id, val);
                          }
                        }}
                      >
                        <option value="">-- Select uploaded PDF --</option>
                        {uploadedFiles.map((file) => {
                          const eligibility = getFileEligibilityForRequirement(
                            file,
                            req.id,
                            matchingState,
                            uploadedFiles
                          );
                          const isSelected = file.id === currentFileId;
                          const disabled = !eligibility.eligible && !isSelected;

                          let label = `${file.filename} (${file.pageCount} p)`;
                          if (!eligibility.eligible && !isSelected) {
                            label += ` [${eligibility.reason}]`;
                          }

                          return (
                            <option
                              key={file.id}
                              value={file.id}
                              disabled={disabled}
                            >
                              {label}
                            </option>
                          );
                        })}
                      </select>

                      {isMatched && (
                        <button
                          type="button"
                          className="btn btn-outline btn-xs btn-unmatch"
                          onClick={() => onUnmatch(req.id)}
                          title="Undo match"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="cell-expiry-input">
                    {/* Expiry field shown for matched requirement where has_expiry === true */}
                    {req.has_expiry && isMatched ? (
                      <div className="expiry-input-group">
                        <input
                          type="date"
                          className={`form-input-date ${
                            evaluation?.status === 'Expiry date needed' || evaluation?.status === 'Expired'
                              ? 'input-error'
                              : ''
                          }`}
                          value={expiryValue}
                          onChange={(e) => onExpiryChange(req.id, e.target.value)}
                        />
                      </div>
                    ) : req.has_expiry && !isMatched ? (
                      <span className="text-muted text-xs">Match file to set expiry</span>
                    ) : (
                      <span className="text-muted text-xs">N/A (No expiry)</span>
                    )}
                  </td>

                  <td>
                    {evaluation && (
                      <div className="status-cell-wrapper">
                        <span className={`badge-status ${getBadgeClass(evaluation.status)}`}>
                          {evaluation.status}
                        </span>
                        {evaluation.reason && (
                          <span className="status-reason-text" title={evaluation.reason}>
                            {evaluation.reason}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
