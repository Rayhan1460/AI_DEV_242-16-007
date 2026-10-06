import React, { useState, useMemo } from 'react';
import type { RequirementsFile } from './types/tender';
import type { UploadedPdf } from './types/pdf';
import type { MatchingState } from './types/matching';
import { Header } from './components/Header';
import { RequirementsLoader } from './components/RequirementsLoader';
import { TenderDetails } from './components/TenderDetails';
import { PdfUploader } from './components/PdfUploader';
import { UploadedFileList } from './components/UploadedFileList';
import { RequirementsTable } from './components/RequirementsTable';
import { BlockingSummary } from './components/BlockingSummary';
import { WorkflowStepper } from './components/WorkflowStepper';
import {
  matchFileToRequirement,
  unmatchRequirement,
  setRequirementExpiry,
  cleanMatchingOnFilesRemoved
} from './core/matchingModel';
import { refreshDuplicateStatuses } from './core/pdfService';
import { calculateStatusSummary } from './core/statusEngine';
import { parseAndValidateRequirementsJson } from './core/requirementsValidator';
import { SAMPLE_REQUIREMENTS_JSON } from './data/sampleRequirements';
import { LanguageProvider } from './i18n/LanguageContext';
import { useLanguage } from './i18n/useLanguage';
import './App.css';

const MainAppContent: React.FC = () => {
  const { t } = useLanguage();
  const [requirementsData, setRequirementsData] = useState<RequirementsFile | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('sample') === 'true') {
          const res = parseAndValidateRequirementsJson(SAMPLE_REQUIREMENTS_JSON);
          if (res.success && res.data) {
            return res.data;
          }
        }
      }
    } catch {
      // Ignore
    }
    return null;
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedPdf[]>([]);
  const [matchingState, setMatchingState] = useState<MatchingState>({
    matches: {},
    expiryDates: {}
  });
  const [alertError, setAlertError] = useState<string | null>(null);

  // Status summary calculated dynamically across requirements & matches
  const statusSummary = useMemo(() => {
    if (!requirementsData) {
      return {
        totalRequirements: 0,
        matchedCount: 0,
        blockingCount: 0,
        canGeneratePackage: false,
        evaluations: {},
        blockingIssues: []
      };
    }
    return calculateStatusSummary(
      requirementsData.tender,
      requirementsData.requirements,
      matchingState,
      uploadedFiles
    );
  }, [requirementsData, matchingState, uploadedFiles]);

  const handleRequirementsLoaded = (data: RequirementsFile) => {
    setRequirementsData(data);
    setAlertError(null);
  };

  const handleFilesAdded = (newFiles: UploadedPdf[]) => {
    setUploadedFiles((prev) => {
      const combined = [...prev, ...newFiles];
      return refreshDuplicateStatuses(combined);
    });
    setAlertError(null);
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => {
      const remaining = prev.filter((f) => f.id !== fileId);
      const refreshed = refreshDuplicateStatuses(remaining);
      setMatchingState((prevState) => cleanMatchingOnFilesRemoved(prevState, refreshed));
      return refreshed;
    });
  };

  const handleMatchChange = (requirementId: string, fileId: string) => {
    setAlertError(null);
    const result = matchFileToRequirement(matchingState, requirementId, fileId, uploadedFiles);
    if (!result.success) {
      setAlertError(result.error || 'Failed to match file.');
    } else {
      setMatchingState(result.state);
    }
  };

  const handleUnmatch = (requirementId: string) => {
    setAlertError(null);
    setMatchingState((prev) => unmatchRequirement(prev, requirementId));
  };

  const handleExpiryChange = (requirementId: string, expiryDate: string) => {
    setMatchingState((prev) => setRequirementExpiry(prev, requirementId, expiryDate));
  };

  const okCount = useMemo(() => {
    return Object.values(statusSummary.evaluations).filter((ev) => ev.status === 'OK').length;
  }, [statusSummary.evaluations]);

  return (
    <div className="app-layout">
      <Header />

      <main className="main-content">
        <WorkflowStepper
          hasRequirements={!!requirementsData}
          uploadedFilesCount={uploadedFiles.length}
          totalRequirements={requirementsData?.requirements.length || 0}
          okCount={okCount}
          blockingCount={statusSummary.blockingCount}
          canGeneratePackage={statusSummary.canGeneratePackage}
        />

        {alertError && (
          <div className="alert alert-error global-alert">
            <span>⚠️ {alertError}</span>
            <button
              type="button"
              className="btn-close-alert"
              onClick={() => setAlertError(null)}
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid-two-column">
          <div className="col-left">
            <RequirementsLoader
              onLoaded={handleRequirementsLoaded}
              isLoaded={!!requirementsData}
            />

            {requirementsData && (
              <TenderDetails
                tender={requirementsData.tender}
                requirements={requirementsData.requirements}
              />
            )}
          </div>

          <div className="col-right">
            <PdfUploader
              existingFiles={uploadedFiles}
              onFilesAdded={handleFilesAdded}
            />

            <section className="card card-uploaded-files">
              <div className="card-header">
                <h2 className="card-title">{t.uploadedFilesTitle}</h2>
                <span className="step-tag">{uploadedFiles.length} / 30 {t.colPages.toLowerCase()}</span>
              </div>
              <UploadedFileList
                files={uploadedFiles}
                matchingState={matchingState}
                onRemoveFile={handleRemoveFile}
              />
            </section>
          </div>
        </div>

        {requirementsData && (
          <>
            <RequirementsTable
              tender={requirementsData.tender}
              requirements={requirementsData.requirements}
              uploadedFiles={uploadedFiles}
              matchingState={matchingState}
              evaluations={statusSummary.evaluations}
              onMatchChange={handleMatchChange}
              onUnmatch={handleUnmatch}
              onExpiryChange={handleExpiryChange}
            />

            <BlockingSummary
              tender={requirementsData.tender}
              requirements={requirementsData.requirements}
              uploadedFiles={uploadedFiles}
              matchingState={matchingState}
              summary={statusSummary}
              hasRequirements={requirementsData.requirements.length > 0}
            />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>{t.footerTitle}</p>
        <p className="footer-subtext">{t.footerSubtitle}</p>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <MainAppContent />
    </LanguageProvider>
  );
};

export default App;
