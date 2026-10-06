import React, { useRef, useState } from 'react';
import {
  processPdfFiles,
  formatBytes,
  MAX_FILES,
  MAX_TOTAL_BYTES
} from '../core/pdfService';
import type { UploadedPdf } from '../types/pdf';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useLanguage } from '../i18n/useLanguage';

interface PdfUploaderProps {
  existingFiles: UploadedPdf[];
  onFilesAdded: (newFiles: UploadedPdf[]) => void;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({ existingFiles, onFilesAdded }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const currentTotalBytes = existingFiles.reduce((acc, f) => acc + f.size, 0);
  const totalCount = existingFiles.length;

  const handleIncomingFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const filesArray = Array.from(fileList);
      const result = await processPdfFiles(filesArray, existingFiles);

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to upload files.');
      } else if (result.addedFiles.length > 0) {
        onFilesAdded(result.addedFiles);
      }
    } catch (err) {
      setErrorMessage(
        `Unexpected error during PDF processing: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleIncomingFiles(e.dataTransfer.files);
  };

  // Helper to create genuine test PDFs in-memory for testing convenience
  const handleGenerateSamplePdfs = async () => {
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const samples: File[] = [];

      // 1. Trade license sample PDF
      const doc1 = await PDFDocument.create();
      const font1 = await doc1.embedFont(StandardFonts.HelveticaBold);
      const page1 = doc1.addPage([595, 842]);
      page1.drawText('Sample Trade License 2026', { x: 50, y: 780, size: 20, font: font1, color: rgb(0.1, 0.2, 0.4) });
      page1.drawText('Document ID: TL-8849-2026', { x: 50, y: 740, size: 14 });
      page1.drawText('Valid until: 2026-12-31', { x: 50, y: 710, size: 12 });
      const bytes1 = await doc1.save();
      samples.push(new File([bytes1 as unknown as BlobPart], 'Trade_License_2026.pdf', { type: 'application/pdf' }));

      // 2. Tax clearance sample PDF (2 pages)
      const doc2 = await PDFDocument.create();
      const page2_1 = doc2.addPage([595, 842]);
      page2_1.drawText('National Board of Revenue - Tax Clearance', { x: 50, y: 780, size: 18, font: font1 });
      page2_1.drawText('TIN: 489201948201', { x: 50, y: 740, size: 12 });
      page2_1.drawText('Assessment Year 2025-2026', { x: 50, y: 710, size: 12 });
      const page2_2 = doc2.addPage([595, 842]);
      page2_2.drawText('Page 2: Tax Assessment Summary', { x: 50, y: 780, size: 14, font: font1 });
      const bytes2 = await doc2.save();
      samples.push(new File([bytes2 as unknown as BlobPart], 'Tax_Clearance_Cert.pdf', { type: 'application/pdf' }));

      // 3. Bank solvency sample PDF
      const doc3 = await PDFDocument.create();
      const page3 = doc3.addPage([595, 842]);
      page3.drawText('Bank Solvency Certificate', { x: 50, y: 780, size: 18, font: font1 });
      page3.drawText('This is to certify the financial solvency of the bidder.', { x: 50, y: 740, size: 12 });
      const bytes3 = await doc3.save();
      samples.push(new File([bytes3 as unknown as BlobPart], 'Bank_Solvency_Report.pdf', { type: 'application/pdf' }));

      // 4. Duplicate sample PDF (identical bytes as Trade_License_2026.pdf but renamed to test duplicate detection)
      samples.push(new File([bytes1 as unknown as BlobPart], 'Trade_License_Duplicate_Copy.pdf', { type: 'application/pdf' }));

      const result = await processPdfFiles(samples, existingFiles);
      if (!result.success) {
        setErrorMessage(result.error || 'Failed to add sample test PDFs.');
      } else {
        onFilesAdded(result.addedFiles);
      }
    } catch (err) {
      setErrorMessage(`Failed to create sample PDFs: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="card card-pdf-uploader">
      <div className="card-header">
        <h2 className="card-title">{t.pdfSectionTitle}</h2>
        <span className="step-tag">{t.pdfStepTag}</span>
      </div>

      <div className="limits-dashboard">
        <div className="limit-meter">
          <div className="limit-meter-header">
            <span>{t.filesUploadedLabel}</span>
            <strong>{totalCount} / {MAX_FILES}</strong>
          </div>
          <div className="meter-track">
            <div
              className={`meter-fill ${totalCount >= MAX_FILES ? 'meter-danger' : ''}`}
              style={{ width: `${Math.min(100, (totalCount / MAX_FILES) * 100)}%` }}
            />
          </div>
        </div>

        <div className="limit-meter">
          <div className="limit-meter-header">
            <span>{t.totalStorageLabel}</span>
            <strong>{formatBytes(currentTotalBytes)} / 50 MB</strong>
          </div>
          <div className="meter-track">
            <div
              className={`meter-fill ${currentTotalBytes >= MAX_TOTAL_BYTES ? 'meter-danger' : ''}`}
              style={{ width: `${Math.min(100, (currentTotalBytes / MAX_TOTAL_BYTES) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div
        className={`dropzone ${isDragging ? 'dragover' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleIncomingFiles(e.target.files)}
        />
        <div className="dropzone-inner">
          <svg className="icon-upload" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p className="dropzone-text">
            <strong>{t.pdfDropzoneText.split(' or ')[0]}</strong> or drag & drop here (Multiple allowed)
          </p>
          <p className="dropzone-hint">{t.pdfDropzoneHint}</p>
          {isProcessing && <p className="text-loading">{t.analyzingPdfsText}</p>}
        </div>
      </div>

      <div className="uploader-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleGenerateSamplePdfs}
          disabled={isProcessing || totalCount >= MAX_FILES}
        >
          {t.generatingSamplePdfsBtn}
        </button>
      </div>

      {errorMessage && (
        <div className="alert alert-error">
          <strong>{t.uploadErrorLabel}:</strong> {errorMessage}
        </div>
      )}
    </section>
  );
};
