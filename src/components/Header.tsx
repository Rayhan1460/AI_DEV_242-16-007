import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="brand">
          <span className="badge-stage">STAGE 1 — CORE FOUNDATION</span>
          <h1 className="app-title">Tender Document Package Builder</h1>
          <p className="app-subtitle">
            Frontend-only client-side document matching, expiry verification, and integrity validation engine
          </p>
        </div>
      </div>
    </header>
  );
};
