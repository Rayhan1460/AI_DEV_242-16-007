import React from 'react';
import type { UploadedPdf } from '../types/pdf';
import type { MatchingState } from '../types/matching';
import { formatBytes } from '../core/pdfService';
import { useLanguage } from '../i18n/useLanguage';

interface UploadedFileListProps {
  files: UploadedPdf[];
  matchingState: MatchingState;
  onRemoveFile: (fileId: string) => void;
}

export const UploadedFileList: React.FC<UploadedFileListProps> = ({
  files,
  matchingState,
  onRemoveFile
}) => {
  const { t } = useLanguage();

  if (files.length === 0) {
    return (
      <div className="empty-files-placeholder">
        <p>{t.noPdfsUploaded}</p>
      </div>
    );
  }

  // Invert matchingState to find which requirement a file is matched to
  const fileToRequirementMap: Record<string, string> = {};
  for (const [reqId, fId] of Object.entries(matchingState.matches)) {
    fileToRequirementMap[fId] = reqId;
  }

  return (
    <div className="uploaded-files-container">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.colFileName}</th>
              <th>{t.colPages}</th>
              <th>{t.colSize}</th>
              <th>{t.colHash}</th>
              <th>{t.colDuplicate}</th>
              <th>{t.colMatchedTo}</th>
              <th className="text-right">{t.colAction}</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => {
              const matchedReq = fileToRequirementMap[file.id];
              const shortHash = `${file.sha256.substring(0, 8)}...${file.sha256.substring(file.sha256.length - 6)}`;

              return (
                <tr key={file.id} className={file.isDuplicate ? 'row-duplicate' : ''}>
                  <td className="cell-filename">
                    <span className="pdf-icon">📄</span>
                    <strong title={file.filename}>{file.filename}</strong>
                  </td>
                  <td>
                    {file.pageCount} {file.pageCount === 1 ? t.pageUnit : t.pagesUnit}
                  </td>
                  <td>{formatBytes(file.size)}</td>
                  <td>
                    <code className="hash-code" title={`Full SHA-256:\n${file.sha256}`}>
                      {shortHash}
                    </code>
                  </td>
                  <td>
                    {file.isDuplicate ? (
                      <span
                        className="badge badge-warning"
                        title={`Duplicate content with: ${file.duplicateOf?.join(', ')}`}
                      >
                        {t.duplicateBadge}
                      </span>
                    ) : (
                      <span className="badge badge-neutral">{t.uniqueBadge}</span>
                    )}
                  </td>
                  <td>
                    {matchedReq ? (
                      <span className="badge badge-matched">{t.matchedBadge} {matchedReq}</span>
                    ) : (
                      <span className="text-muted">{t.unassignedText}</span>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn-danger btn-xs"
                      onClick={() => onRemoveFile(file.id)}
                      title="Remove file and clean matching state"
                    >
                      {t.removeBtn}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
