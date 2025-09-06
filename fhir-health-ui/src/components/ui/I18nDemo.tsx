import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useTranslation, useDateFormatter, useNumberFormatter } from '../../hooks/useTranslation';
import { LanguageSelector } from './LanguageSelector';
import './I18nDemo.css';

export function I18nDemo(): React.JSX.Element {
  const { language, availableLanguages, isLoading, error } = useI18n();
  const { t } = useTranslation();
  const { formatDate, formatTime, formatDateTime, formatRelativeTime } = useDateFormatter();
  const { formatNumber, formatCurrency, formatPercent } = useNumberFormatter();

  const currentDate = new Date();
  const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
  const sampleNumber = 1234567.89;
  const sampleCurrency = 1234.56;
  const samplePercent = 0.1234;

  return (
    <div className="i18n-demo">
      <div className="i18n-demo__header">
        <h2>Internationalization Demo</h2>
        <p>Current Language: <strong>{language}</strong></p>
        
        {isLoading && (
          <div className="i18n-demo__status i18n-demo__status--loading">
            {t('common.loading')}
          </div>
        )}
        
        {error && (
          <div className="i18n-demo__status i18n-demo__status--error">
            {t('common.error')}: {error}
          </div>
        )}
      </div>

      <div className="i18n-demo__section">
        <h3>Language Selector</h3>
        <div className="i18n-demo__selectors">
          <div className="i18n-demo__selector">
            <h4>Dropdown Variant</h4>
            <LanguageSelector variant="dropdown" />
          </div>
          
          <div className="i18n-demo__selector">
            <h4>Button Variant</h4>
            <LanguageSelector variant="button" />
          </div>
        </div>
      </div>

      <div className="i18n-demo__section">
        <h3>Available Languages</h3>
        <div className="i18n-demo__languages">
          {availableLanguages.map((lang) => (
            <div key={lang.code} className="i18n-demo__language">
              <span className="i18n-demo__language-code">{lang.code}</span>
              <span className="i18n-demo__language-name">{lang.name}</span>
              <span className="i18n-demo__language-native">{lang.nativeName}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="i18n-demo__section">
        <h3>Translation Examples</h3>
        <div className="i18n-demo__translations">
          <div className="i18n-demo__category">
            <h4>Common Terms</h4>
            <ul>
              <li><strong>Save:</strong> {t('common.save')}</li>
              <li><strong>Cancel:</strong> {t('common.cancel')}</li>
              <li><strong>Delete:</strong> {t('common.delete')}</li>
              <li><strong>Search:</strong> {t('common.search')}</li>
              <li><strong>Loading:</strong> {t('common.loading')}</li>
            </ul>
          </div>

          <div className="i18n-demo__category">
            <h4>Patient Terms</h4>
            <ul>
              <li><strong>Create Patient:</strong> {t('patient.createPatient')}</li>
              <li><strong>Search Patient:</strong> {t('patient.searchPatient')}</li>
              <li><strong>Patient Details:</strong> {t('patient.patientDetails')}</li>
              <li><strong>Date of Birth:</strong> {t('patient.dateOfBirth')}</li>
              <li><strong>Medical History:</strong> {t('patient.medicalHistory')}</li>
            </ul>
          </div>

          <div className="i18n-demo__category">
            <h4>Navigation Terms</h4>
            <ul>
              <li><strong>Home:</strong> {t('navigation.home')}</li>
              <li><strong>Patients:</strong> {t('navigation.patients')}</li>
              <li><strong>Organizations:</strong> {t('navigation.organizations')}</li>
              <li><strong>Settings:</strong> {t('navigation.settings')}</li>
            </ul>
          </div>

          <div className="i18n-demo__category">
            <h4>Theme Terms</h4>
            <ul>
              <li><strong>Light Mode:</strong> {t('theme.lightMode')}</li>
              <li><strong>Dark Mode:</strong> {t('theme.darkMode')}</li>
              <li><strong>Theme Settings:</strong> {t('theme.themeSettings')}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="i18n-demo__section">
        <h3>Date & Time Formatting</h3>
        <div className="i18n-demo__formatting">
          <div className="i18n-demo__format-group">
            <h4>Date Formats</h4>
            <ul>
              <li><strong>Full Date:</strong> {formatDate(currentDate)}</li>
              <li><strong>Short Date:</strong> {formatDate(currentDate, { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}</li>
              <li><strong>Numeric Date:</strong> {formatDate(currentDate, { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
              })}</li>
            </ul>
          </div>

          <div className="i18n-demo__format-group">
            <h4>Time Formats</h4>
            <ul>
              <li><strong>Time:</strong> {formatTime(currentDate)}</li>
              <li><strong>Time with Seconds:</strong> {formatTime(currentDate, { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              })}</li>
              <li><strong>12-hour Time:</strong> {formatTime(currentDate, { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              })}</li>
            </ul>
          </div>

          <div className="i18n-demo__format-group">
            <h4>Date & Time Combined</h4>
            <ul>
              <li><strong>DateTime:</strong> {formatDateTime(currentDate)}</li>
              <li><strong>Relative Time:</strong> {formatRelativeTime(pastDate)}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="i18n-demo__section">
        <h3>Number Formatting</h3>
        <div className="i18n-demo__formatting">
          <div className="i18n-demo__format-group">
            <h4>Numbers</h4>
            <ul>
              <li><strong>Default:</strong> {formatNumber(sampleNumber)}</li>
              <li><strong>2 Decimals:</strong> {formatNumber(sampleNumber, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}</li>
              <li><strong>No Decimals:</strong> {formatNumber(sampleNumber, { 
                maximumFractionDigits: 0 
              })}</li>
            </ul>
          </div>

          <div className="i18n-demo__format-group">
            <h4>Currency</h4>
            <ul>
              <li><strong>USD:</strong> {formatCurrency(sampleCurrency, 'USD')}</li>
              <li><strong>EUR:</strong> {formatCurrency(sampleCurrency, 'EUR')}</li>
              <li><strong>GBP:</strong> {formatCurrency(sampleCurrency, 'GBP')}</li>
            </ul>
          </div>

          <div className="i18n-demo__format-group">
            <h4>Percentage</h4>
            <ul>
              <li><strong>Percent:</strong> {formatPercent(samplePercent)}</li>
              <li><strong>Percent (1 decimal):</strong> {formatPercent(samplePercent, { 
                minimumFractionDigits: 1, 
                maximumFractionDigits: 1 
              })}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="i18n-demo__section">
        <h3>Translation with Parameters</h3>
        <div className="i18n-demo__parameters">
          <p>
            <strong>Example:</strong> {t('patient.patientCreated')} 
            (This would normally include patient name as parameter)
          </p>
          <p>
            <strong>Missing Key:</strong> {t('nonexistent.key')} 
            (Shows key when translation is missing)
          </p>
        </div>
      </div>
    </div>
  );
}

export default I18nDemo;