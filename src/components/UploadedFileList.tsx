import React from 'react';
import type { UploadedPdf } from '../types/pdf';
import type { MatchingState } from '../types/matching';
import { formatBytes } from '../core/pdfService';

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
  if (files.length === 0) {
    return (
      <div className="empty-files-placeholder">
        <p>No PDF documents uploaded yet. Upload your PDF files above to begin matching.</p>
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
              <th>File Name</th>
              <th>Pages</th>
              <th>Size</th>
              <th>SHA-256 Hash</th>
              <th>Status / Duplicate</th>
              <th>Matched To</th>
              <th className="text-right">Action</th>
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
                  <td>{file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}</td>
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
                        ⚠️ Duplicate Content
                      </span>
                    ) : (
                      <span className="badge badge-neutral">Unique</span>
                    )}
                  </td>
                  <td>
                    {matchedReq ? (
                      <span className="badge badge-matched">Matched: {matchedReq}</span>
                    ) : (
                      <span className="text-muted">Unassigned</span>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn-danger btn-xs"
                      onClick={() => onRemoveFile(file.id)}
                      title="Remove file and clean matching state"
                    >
                      Remove
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
