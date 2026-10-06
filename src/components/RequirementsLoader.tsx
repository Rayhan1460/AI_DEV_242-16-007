import React, { useRef, useState } from 'react';
import { parseAndValidateRequirementsJson } from '../core/requirementsValidator';
import type { RequirementsFile } from '../types/tender';
import { SAMPLE_REQUIREMENTS_JSON } from '../data/sampleRequirements';
import { useLanguage } from '../i18n/useLanguage';

interface RequirementsLoaderProps {
  onLoaded: (data: RequirementsFile) => void;
  isLoaded: boolean;
}

export const RequirementsLoader: React.FC<RequirementsLoaderProps> = ({ onLoaded, isLoaded }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const processFile = async (file: File) => {
    setErrorMessage(null);
    try {
      const text = await file.text();
      const result = parseAndValidateRequirementsJson(text);
      if (!result.success || !result.data) {
        setErrorMessage(result.error || 'Failed to validate requirements.json.');
        return;
      }
      setFileName(file.name);
      onLoaded(result.data);
    } catch (err) {
      setErrorMessage(
        `Failed to read file "${file.name}": ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleLoadSample = () => {
    setErrorMessage(null);
    const result = parseAndValidateRequirementsJson(SAMPLE_REQUIREMENTS_JSON);
    if (result.success && result.data) {
      setFileName('sample_requirements.json');
      onLoaded(result.data);
    } else {
      setErrorMessage(result.error || 'Failed to load sample dataset.');
    }
  };

  return (
    <section className="card card-requirements-loader">
      <div className="card-header">
        <h2 className="card-title">{t.reqSectionTitle}</h2>
        <span className="step-tag">{t.reqStepTag}</span>
      </div>

      <div
        className={`dropzone ${isDragging ? 'dragover' : ''} ${isLoaded ? 'loaded' : ''}`}
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
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div className="dropzone-inner">
          <svg className="icon-upload" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="dropzone-text">
            <strong>{t.reqDropzoneText.split(' or ')[0]}</strong> or drag & drop here
          </p>
          <p className="dropzone-hint">{t.reqDropzoneHint}</p>
          {fileName && (
            <div className="loaded-file-badge">
              ✓ {t.reqLoadedFile}: <strong>{fileName}</strong>
            </div>
          )}
        </div>
      </div>

      <div className="loader-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleLoadSample}
        >
          {t.reqLoadSampleBtn}
        </button>
      </div>

      {errorMessage && (
        <div className="alert alert-error">
          <strong>{t.reqValidationError}:</strong> {errorMessage}
        </div>
      )}
    </section>
  );
};
