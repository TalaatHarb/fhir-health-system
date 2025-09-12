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
    } else if (event.key === 'ArrowDown' && isOpen) {
      event.preventDefault();
      // Focus first option
      const firstOption = dropdownRef.current?.querySelector('.language-selector__option') as HTMLButtonElement;
      firstOption?.focus();
    }
  };

  // Handle keyboard navigation within options
  const handleOptionKeyDown = (event: React.KeyboardEvent, langCode: string, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLanguageSelect(langCode);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextOption = dropdownRef.current?.querySelectorAll('.language-selector__option')[index + 1] as HTMLButtonElement;
      if (nextOption) {
        nextOption.focus();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index === 0) {
        // Focus back to trigger
        const trigger = dropdownRef.current?.querySelector('.language-selector__trigger') as HTMLButtonElement;
        trigger?.focus();
      } else {
        const prevOption = dropdownRef.current?.querySelectorAll('.language-selector__option')[index - 1] as HTMLButtonElement;
        prevOption?.focus();
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      const trigger = dropdownRef.current?.querySelector('.language-selector__trigger') as HTMLButtonElement;
      trigger?.focus();
    }
  };

  const handleLanguageSelect = async (langCode: string) => {
    if (langCode !== language && !isLoading) {
      try {
        await setLanguage(langCode);
        // Announce language change to screen readers
        const announcement = `Language changed to ${availableLanguages.find(lang => lang.code === langCode)?.nativeName}`;
        const ariaLiveRegion = document.getElementById('language-announcements');
        if (ariaLiveRegion) {
          ariaLiveRegion.textContent = announcement;
          setTimeout(() => {
            ariaLiveRegion.textContent = '';
          }, 2000);
        }
      } catch (error) {
        console.error('Failed to change language:', error);
      }
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
            {availableLanguages.map((lang, index) => (
              <li key={lang.code} role="none">
                <button
                  type="button"
                  className={`language-selector__option ${
                    lang.code === language ? 'language-selector__option--selected' : ''
                  } ${isLoading ? 'language-selector__option--loading' : ''}`}
                  onClick={() => handleLanguageSelect(lang.code)}
                  onKeyDown={(e) => handleOptionKeyDown(e, lang.code, index)}
                  role="option"
                  aria-selected={lang.code === language}
                  aria-describedby={`lang-desc-${lang.code}`}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  <span className="language-selector__option-flag" aria-hidden="true">
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
                  {isLoading && lang.code === language && (
                    <span className="language-selector__loading-spinner" aria-hidden="true">
                      ⟳
                    </span>
                  )}
                  {/* Hidden description for screen readers */}
                  <span id={`lang-desc-${lang.code}`} className="sr-only">
                    {lang.nativeName} ({lang.name})
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* ARIA live region for language change announcements */}
      <div 
        id="language-announcements" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      ></div>
    </div>
  );
}

export default LanguageSelector;