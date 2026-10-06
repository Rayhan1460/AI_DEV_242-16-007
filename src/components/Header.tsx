import React from 'react';
import { useLanguage } from '../i18n/useLanguage';

export const Header: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="brand">
          <span className="badge-stage">{t.stageBadge}</span>
          <h1 className="app-title">{t.appTitle}</h1>
          <p className="app-subtitle">{t.appSubtitle}</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-lang-toggle"
            onClick={toggleLanguage}
            title={language === 'en' ? 'বাংলা ভাষায় পরিবর্তন করুন' : 'Switch to English'}
          >
            <span className="lang-icon">🌐</span>
            <span className="lang-text">
              {language === 'en' ? 'বাংলা' : 'English'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
