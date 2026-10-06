import React from 'react';
import type { Tender, Requirement } from '../types/tender';
import { useLanguage } from '../i18n/useLanguage';

interface TenderDetailsProps {
  tender: Tender;
  requirements: Requirement[];
}

export const TenderDetails: React.FC<TenderDetailsProps> = ({ tender, requirements }) => {
  const { t } = useLanguage();
  const mandatoryCount = requirements.filter((r) => r.mandatory).length;
  const optionalCount = requirements.length - mandatoryCount;

  return (
    <section className="card card-tender-details">
      <div className="card-header">
        <h2 className="card-title">{t.tenderDetailsTitle}</h2>
        <span className="tender-id-badge">{tender.tender_id}</span>
      </div>

      <div className="tender-grid">
        <div className="tender-item">
          <span className="tender-label">{t.projectTitleLabel}</span>
          <span className="tender-value highlight">{tender.title}</span>
        </div>
        <div className="tender-item">
          <span className="tender-label">{t.procuringEntityLabel}</span>
          <span className="tender-value">{tender.procuring_entity}</span>
        </div>
        <div className="tender-item">
          <span className="tender-label">{t.bidderLabel}</span>
          <span className="tender-value">{tender.bidder}</span>
        </div>
        <div className="tender-item">
          <span className="tender-label">{t.submissionDeadlineLabel}</span>
          <span className="tender-value deadline-badge">{tender.submission_deadline}</span>
        </div>
      </div>

      <div className="tender-stats-bar">
        <span>{t.totalReqsLabel} <strong>{requirements.length}</strong></span>
        <span>•</span>
        <span>{t.mandatoryLabel} <strong className="text-mandatory">{mandatoryCount}</strong></span>
        <span>•</span>
        <span>{t.optionalLabel} <strong className="text-optional">{optionalCount}</strong></span>
      </div>
    </section>
  );
};
