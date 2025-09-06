import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nProvider } from '../../contexts/I18nContext';
import { useTranslation, useDateFormatter, useNumberFormatter } from '../../hooks/useTranslation';

// Mock translations
vi.mock('../../translations/en.json', () => ({
  default: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
    },
    patient: {
      createPatient: 'Create Patient',
    },
  },
}));

vi.mock('../../translations/es.json', () => ({
  default: {
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
    },
    patient: {
      createPatient: 'Crear Paciente',
    },
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  function TestComponent() {
    const { t } = useTranslation();

    return (
      <div>
        <div data-testid="save">{t('common.save')}</div>
        <div data-testid="cancel">{t('common.cancel')}</div>
        <div data-testid="patient">{t('patient.createPatient')}</div>
        <div data-testid="missing">{t('missing.key')}</div>
      </div>
    );
  }

  it('should provide translation function', async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Wait for translations to load and check content
    await screen.findByText('Save');
    expect(screen.getByTestId('save')).toHaveTextContent('Save');
    expect(screen.getByTestId('cancel')).toHaveTextContent('Cancel');
    expect(screen.getByTestId('patient')).toHaveTextContent('Create Patient');
    expect(screen.getByTestId('missing')).toHaveTextContent('missing.key');
  });
});

describe('useDateFormatter', () => {
  function DateTestComponent() {
    const { formatDate, formatTime, formatDateTime, formatRelativeTime } = useDateFormatter();

    const testDate = new Date('2023-12-25T15:30:00Z');
    const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

    return (
      <div>
        <div data-testid="format-date">{formatDate(testDate)}</div>
        <div data-testid="format-time">{formatTime(testDate)}</div>
        <div data-testid="format-datetime">{formatDateTime(testDate)}</div>
        <div data-testid="format-relative">{formatRelativeTime(pastDate)}</div>
        <div data-testid="invalid-date">{formatDate('invalid-date')}</div>
      </div>
    );
  }

  it('should format dates correctly', async () => {
    render(
      <I18nProvider>
        <DateTestComponent />
      </I18nProvider>
    );

    // Wait for component to render
    await screen.findByTestId('format-date');

    // Check that dates are formatted (exact format may vary by locale/browser)
    expect(screen.getByTestId('format-date')).toHaveTextContent(/2023/);
    expect(screen.getByTestId('format-time')).toHaveTextContent(/:/);
    expect(screen.getByTestId('format-datetime')).toHaveTextContent(/2023/);
    expect(screen.getByTestId('format-relative')).toHaveTextContent(/ago|hour/);
    expect(screen.getByTestId('invalid-date')).toHaveTextContent('Invalid Date');
  });

  it('should handle string dates', async () => {
    function StringDateTestComponent() {
      const { formatDate } = useDateFormatter();
      return (
        <div data-testid="string-date">
          {formatDate('2023-12-25')}
        </div>
      );
    }

    render(
      <I18nProvider>
        <StringDateTestComponent />
      </I18nProvider>
    );

    await screen.findByTestId('string-date');
    expect(screen.getByTestId('string-date')).toHaveTextContent(/2023/);
  });

  it('should handle custom date format options', async () => {
    function CustomFormatTestComponent() {
      const { formatDate } = useDateFormatter();
      const testDate = new Date('2023-12-25');

      return (
        <div data-testid="custom-format">
          {formatDate(testDate, { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      );
    }

    render(
      <I18nProvider>
        <CustomFormatTestComponent />
      </I18nProvider>
    );

    await screen.findByTestId('custom-format');
    expect(screen.getByTestId('custom-format')).toHaveTextContent(/2023/);
  });
});

describe('useNumberFormatter', () => {
  function NumberTestComponent() {
    const { formatNumber, formatCurrency, formatPercent } = useNumberFormatter();

    const testNumber = 1234567.89;
    const testCurrency = 1234.56;
    const testPercent = 0.1234;

    return (
      <div>
        <div data-testid="format-number">{formatNumber(testNumber)}</div>
        <div data-testid="format-currency-usd">{formatCurrency(testCurrency, 'USD')}</div>
        <div data-testid="format-currency-eur">{formatCurrency(testCurrency, 'EUR')}</div>
        <div data-testid="format-percent">{formatPercent(testPercent)}</div>
        <div data-testid="format-number-options">
          {formatNumber(testNumber, { maximumFractionDigits: 0 })}
        </div>
      </div>
    );
  }

  it('should format numbers correctly', async () => {
    render(
      <I18nProvider>
        <NumberTestComponent />
      </I18nProvider>
    );

    // Wait for component to render
    await screen.findByTestId('format-number');

    // Check that numbers are formatted (exact format may vary by locale/browser)
    expect(screen.getByTestId('format-number')).toHaveTextContent(/1,234,567/);
    expect(screen.getByTestId('format-currency-usd')).toHaveTextContent(/\$1,234/);
    expect(screen.getByTestId('format-currency-eur')).toHaveTextContent(/€1,234|1,234.*€/);
    expect(screen.getByTestId('format-percent')).toHaveTextContent(/12\.34%/);
    expect(screen.getByTestId('format-number-options')).toHaveTextContent(/1,234,568/);
  });

  it('should handle different currencies', async () => {
    function CurrencyTestComponent() {
      const { formatCurrency } = useNumberFormatter();
      return (
        <div>
          <div data-testid="gbp">{formatCurrency(100, 'GBP')}</div>
          <div data-testid="jpy">{formatCurrency(100, 'JPY')}</div>
        </div>
      );
    }

    render(
      <I18nProvider>
        <CurrencyTestComponent />
      </I18nProvider>
    );

    await screen.findByTestId('gbp');
    expect(screen.getByTestId('gbp')).toHaveTextContent(/£100|100.*£/);
    expect(screen.getByTestId('jpy')).toHaveTextContent(/¥100|100.*¥/);
  });

  it('should handle percent formatting options', async () => {
    function PercentTestComponent() {
      const { formatPercent } = useNumberFormatter();
      return (
        <div data-testid="percent-custom">
          {formatPercent(0.1234, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </div>
      );
    }

    render(
      <I18nProvider>
        <PercentTestComponent />
      </I18nProvider>
    );

    await screen.findByTestId('percent-custom');
    expect(screen.getByTestId('percent-custom')).toHaveTextContent(/12\.3%/);
  });
});

describe('Locale fallback behavior', () => {
  beforeEach(() => {
    // Mock console.warn to avoid noise in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should fallback to English when locale formatting fails', async () => {
    // Mock Intl to throw errors on first call, succeed on second (fallback)
    const originalDateTimeFormat = Intl.DateTimeFormat;
    const originalNumberFormat = Intl.NumberFormat;

    let dateFormatCallCount = 0;
    let numberFormatCallCount = 0;

    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((locale, options) => {
      dateFormatCallCount++;
      if (dateFormatCallCount === 1 && locale !== 'en') {
        throw new Error('Unsupported locale');
      }
      return new originalDateTimeFormat(locale, options);
    });

    vi.spyOn(Intl, 'NumberFormat').mockImplementation((locale, options) => {
      numberFormatCallCount++;
      if (numberFormatCallCount === 1 && locale !== 'en') {
        throw new Error('Unsupported locale');
      }
      return new originalNumberFormat(locale, options);
    });

    function FallbackTestComponent() {
      const { formatDate } = useDateFormatter();
      const { formatNumber } = useNumberFormatter();

      return (
        <div>
          <div data-testid="fallback-date">{formatDate(new Date('2023-12-25'))}</div>
          <div data-testid="fallback-number">{formatNumber(1234.56)}</div>
        </div>
      );
    }

    render(
      <I18nProvider>
        <FallbackTestComponent />
      </I18nProvider>
    );

    await screen.findByTestId('fallback-date');
    
    // Should still render something (fallback behavior)
    expect(screen.getByTestId('fallback-date')).toBeInTheDocument();
    expect(screen.getByTestId('fallback-number')).toBeInTheDocument();

    // Restore original implementations
    vi.mocked(Intl.DateTimeFormat).mockRestore();
    vi.mocked(Intl.NumberFormat).mockRestore();
  });
});