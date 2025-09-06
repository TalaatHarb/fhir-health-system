import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import './LanguageSelector.css';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'dropdown' | 'button';
  showLabel?: boolean;
}

export function LanguageSelector({ 
  className = '', 
  variant = 'dropdown',
  showLabel = true 
}: LanguageSelectorProps): React.JSX.Element {
  const { language, setLanguage, availableLanguages, t, isLoading } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const handleLanguageSelect = async (langCode: string) => {
    if (langCode !== language) {
      await setLanguage(langCode);
    }
    setIsOpen(false);
  };

  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  if (variant === 'button') {
    return (
      <div className={`language-selector language-selector--button ${className}`}>
        {showLabel && (
          <span className="language-selector__label">
            {t('language.currentLanguage')}:
          </span>
        )}
        <div className="language-selector__button-group">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`language-selector__button ${
                lang.code === language ? 'language-selector__button--active' : ''
              }`}
              onClick={() => handleLanguageSelect(lang.code)}
              disabled={isLoading}
              aria-pressed={lang.code === language}
              title={lang.name}
            >
              {lang.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`language-selector language-selector--dropdown ${className}`}
      ref={dropdownRef}
    >
      {showLabel && (
        <label className="language-selector__label" htmlFor="language-select">
          {t('language.selectLanguage')}:
        </label>
      )}
      
      <div className="language-selector__dropdown">
        <button
          id="language-select"
          type="button"
          className="language-selector__trigger"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={t('language.selectLanguage')}
        >
          <span className="language-selector__current">
            {isLoading ? (
              <span className="language-selector__loading">
                {t('common.loading')}
              </span>
            ) : (
              <>
                <span className="language-selector__flag">
                  {currentLanguage?.code.toUpperCase()}
                </span>
                <span className="language-selector__name">
                  {currentLanguage?.nativeName || currentLanguage?.name}
                </span>
              </>
            )}
          </span>
          <span 
            className={`language-selector__arrow ${isOpen ? 'language-selector__arrow--open' : ''}`}
            aria-hidden="true"
          >
            ▼
          </span>
        </button>

        {isOpen && (
          <ul 
            className="language-selector__menu"
            role="listbox"
            aria-label={t('language.selectLanguage')}
          >
            {availableLanguages.map((lang) => (
              <li key={lang.code} role="none">
                <button
                  type="button"
                  className={`language-selector__option ${
                    lang.code === language ? 'language-selector__option--selected' : ''
                  }`}
                  onClick={() => handleLanguageSelect(lang.code)}
                  role="option"
                  aria-selected={lang.code === language}
                  disabled={isLoading}
                >
                  <span className="language-selector__option-flag">
                    {lang.code.toUpperCase()}
                  </span>
                  <span className="language-selector__option-content">
                    <span className="language-selector__option-native">
                      {lang.nativeName}
                    </span>
                    <span className="language-selector__option-english">
                      {lang.name}
                    </span>
                  </span>
                  {lang.code === language && (
                    <span className="language-selector__option-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default LanguageSelector;