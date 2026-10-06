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
import {
  matchFileToRequirement,
  unmatchRequirement,
  setRequirementExpiry,
  cleanMatchingOnFilesRemoved
} from './core/matchingModel';
import { refreshDuplicateStatuses } from './core/pdfService';
import { calculateStatusSummary } from './core/statusEngine';
import './App.css';

export const App: React.FC = () => {
  const [requirementsData, setRequirementsData] = useState<RequirementsFile | null>(null);
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

  return (
    <div className="app-layout">
      <Header />

      <main className="main-content">
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
                <h2 className="card-title">Uploaded PDF Documents</h2>
                <span className="step-tag">{uploadedFiles.length} / 30 Files</span>
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
              requirements={requirementsData.requirements}
              uploadedFiles={uploadedFiles}
              matchingState={matchingState}
              evaluations={statusSummary.evaluations}
              onMatchChange={handleMatchChange}
              onUnmatch={handleUnmatch}
              onExpiryChange={handleExpiryChange}
            />

            <BlockingSummary
              summary={statusSummary}
              hasRequirements={requirementsData.requirements.length > 0}
            />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Tender Document Package Builder • Stage 1 Core Foundation</p>
        <p className="footer-subtext">All processing takes place in browser memory • No external services used</p>
      </footer>
    </div>
  );
};

export default App;
