import React from 'react';
import type { Tender, Requirement } from '../types/tender';

interface TenderDetailsProps {
  tender: Tender;
  requirements: Requirement[];
}

export const TenderDetails: React.FC<TenderDetailsProps> = ({ tender, requirements }) => {
  const mandatoryCount = requirements.filter((r) => r.mandatory).length;
  const optionalCount = requirements.length - mandatoryCount;

  return (
    <section className="card card-tender-details">
      <div className="card-header">
        <h2 className="card-title">Tender Details</h2>
        <span className="tender-id-badge">{tender.tender_id}</span>
      </div>

      <div className="tender-grid">
        <div className="tender-item">
          <span className="tender-label">Project Title:</span>
          <span className="tender-value highlight">{tender.title}</span>
        </div>
        <div className="tender-item">
          <span className="tender-label">Procuring Entity:</span>
          <span className="tender-value">{tender.procuring_entity}</span>
        </div>
        <div className="tender-item">
          <span className="tender-label">Bidder / Submitter:</span>
          <span className="tender-value">{tender.bidder}</span>
        </div>
        <div className="tender-item">
          <span className="tender-label">Submission Deadline:</span>
          <span className="tender-value deadline-badge">{tender.submission_deadline}</span>
        </div>
      </div>

      <div className="tender-stats-bar">
        <span>Total Requirements: <strong>{requirements.length}</strong></span>
        <span>•</span>
        <span>Mandatory: <strong className="text-mandatory">{mandatoryCount}</strong></span>
        <span>•</span>
        <span>Optional: <strong className="text-optional">{optionalCount}</strong></span>
      </div>
    </section>
  );
};
