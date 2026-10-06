import React from 'react';
import { useLanguage } from '../i18n/useLanguage';

interface WorkflowStepperProps {
  hasRequirements: boolean;
  uploadedFilesCount: number;
  totalRequirements: number;
  okCount: number;
  blockingCount: number;
  canGeneratePackage: boolean;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  hasRequirements,
  uploadedFilesCount,
  totalRequirements,
  okCount,
  blockingCount,
  canGeneratePackage
}) => {
  const { language } = useLanguage();

  return (
    <nav className="workflow-stepper" aria-label="Process Workflow">
      {/* Step 1 */}
      <div className={`step-item ${hasRequirements ? 'step-completed' : 'step-active'}`}>
        <div className="step-circle">{hasRequirements ? '✓' : '1'}</div>
        <div className="step-label-group">
          <span className="step-number">{language === 'bn' ? 'ধাপ ১' : 'Step 1'}</span>
          <span className="step-title">{language === 'bn' ? 'নথি তালিকা' : 'Requirements'}</span>
          <span className="step-sub">
            {hasRequirements
              ? (language === 'bn' ? 'লোড সম্পন্ন' : 'Loaded')
              : (language === 'bn' ? 'JSON লোড করুন' : 'Load JSON')}
          </span>
        </div>
      </div>

      <div className="step-connector" />

      {/* Step 2 */}
      <div className={`step-item ${uploadedFilesCount > 0 ? 'step-completed' : hasRequirements ? 'step-active' : 'step-pending'}`}>
        <div className="step-circle">{uploadedFilesCount > 0 ? '✓' : '2'}</div>
        <div className="step-label-group">
          <span className="step-number">{language === 'bn' ? 'ধাপ ২' : 'Step 2'}</span>
          <span className="step-title">{language === 'bn' ? 'পিডিএফ আপলোড' : 'Upload PDFs'}</span>
          <span className="step-sub">
            {uploadedFilesCount > 0
              ? `${uploadedFilesCount} ${language === 'bn' ? 'টি ফাইল' : 'Files'}`
              : (language === 'bn' ? 'ফাইল প্রয়োজন' : 'Max 30 / 50MB')}
          </span>
        </div>
      </div>

      <div className="step-connector" />

      {/* Step 3 */}
      <div className={`step-item ${blockingCount === 0 && hasRequirements ? 'step-completed' : uploadedFilesCount > 0 ? 'step-active' : 'step-pending'}`}>
        <div className="step-circle">{blockingCount === 0 && hasRequirements ? '✓' : '3'}</div>
        <div className="step-label-group">
          <span className="step-number">{language === 'bn' ? 'ধাপ ৩' : 'Step 3'}</span>
          <span className="step-title">{language === 'bn' ? 'ম্যাচিং ও যাচাই' : 'Match & Expiry'}</span>
          <span className="step-sub">
            {hasRequirements
              ? `${okCount}/${totalRequirements} ${language === 'bn' ? 'সঠিক' : 'Verified'}`
              : (language === 'bn' ? 'অপেক্ষমাণ' : 'Pending')}
          </span>
        </div>
      </div>

      <div className="step-connector" />

      {/* Step 4 */}
      <div className={`step-item ${canGeneratePackage ? 'step-completed-gold' : 'step-pending'}`}>
        <div className="step-circle">{canGeneratePackage ? '★' : '4'}</div>
        <div className="step-label-group">
          <span className="step-number">{language === 'bn' ? 'ধাপ ৪' : 'Step 4'}</span>
          <span className="step-title">{language === 'bn' ? 'প্যাকেজ ডাউনলোড' : 'Package PDF'}</span>
          <span className="step-sub">
            {canGeneratePackage
              ? (language === 'bn' ? 'প্রস্তুত' : 'Ready')
              : `${blockingCount} ${language === 'bn' ? 'টি বাকি' : 'Blockers'}`}
          </span>
        </div>
      </div>
    </nav>
  );
};
