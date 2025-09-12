import { useI18n } from '../contexts/I18nContext';

/**
 * Simplified translation hook that provides just the translation function
 * This is a convenience hook for components that only need the translation function
 */
export function useTranslation() {
  try {
    const { t } = useI18n();
    return { t };
  } catch (error) {
    // Graceful fallback when I18n context is not available
    console.warn('useTranslation used outside of I18nProvider, using fallback');
    return {
      t: (key: string) => {
        console.warn(`Translation context not available, returning key: ${key}`);
        return key;
      }
    };
  }
}

/**
 * Hook for formatting dates according to the current locale
 */
export function useDateFormatter() {
  const { language } = useI18n();

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    try {
      return new Intl.DateTimeFormat(language, { ...defaultOptions, ...options }).format(dateObj);
    } catch (error) {
      // Fallback to English if locale is not supported
      return new Intl.DateTimeFormat('en', { ...defaultOptions, ...options }).format(dateObj);
    }
  };

  const formatTime = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Time';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };

    try {
      return new Intl.DateTimeFormat(language, { ...defaultOptions, ...options }).format(dateObj);
    } catch (error) {
      // Fallback to English if locale is not supported
      return new Intl.DateTimeFormat('en', { ...defaultOptions, ...options }).format(dateObj);
    }
  };

  const formatDateTime = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid DateTime';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    try {
      return new Intl.DateTimeFormat(language, { ...defaultOptions, ...options }).format(dateObj);
    } catch (error) {
      // Fallback to English if locale is not supported
      return new Intl.DateTimeFormat('en', { ...defaultOptions, ...options }).format(dateObj);
    }
  };

  const formatRelativeTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    try {
      const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });

      if (Math.abs(diffInSeconds) < 60) {
        return rtf.format(-diffInSeconds, 'second');
      } else if (Math.abs(diffInSeconds) < 3600) {
        return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
      } else if (Math.abs(diffInSeconds) < 86400) {
        return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
      } else if (Math.abs(diffInSeconds) < 2592000) {
        return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
      } else if (Math.abs(diffInSeconds) < 31536000) {
        return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
      } else {
        return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
      }
    } catch (error) {
      // Fallback to English if locale is not supported
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      
      if (Math.abs(diffInSeconds) < 60) {
        return rtf.format(-diffInSeconds, 'second');
      } else if (Math.abs(diffInSeconds) < 3600) {
        return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
      } else if (Math.abs(diffInSeconds) < 86400) {
        return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
      } else if (Math.abs(diffInSeconds) < 2592000) {
        return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
      } else if (Math.abs(diffInSeconds) < 31536000) {
        return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
      } else {
        return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
      }
    }
  };

  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,
  };
}

/**
 * Hook for formatting numbers according to the current locale
 */
export function useNumberFormatter() {
  const { language } = useI18n();

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
    try {
      return new Intl.NumberFormat(language, options).format(number);
    } catch (error) {
      // Fallback to English if locale is not supported
      return new Intl.NumberFormat('en', options).format(number);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD', options?: Intl.NumberFormatOptions): string => {
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency,
    };

    try {
      return new Intl.NumberFormat(language, { ...defaultOptions, ...options }).format(amount);
    } catch (error) {
      // Fallback to English if locale is not supported
      return new Intl.NumberFormat('en', { ...defaultOptions, ...options }).format(amount);
    }
  };

  const formatPercent = (value: number, options?: Intl.NumberFormatOptions): string => {
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    };

    try {
      return new Intl.NumberFormat(language, { ...defaultOptions, ...options }).format(value);
    } catch (error) {
      // Fallback to English if locale is not supported
      return new Intl.NumberFormat('en', { ...defaultOptions, ...options }).format(value);
    }
  };

  return {
    formatNumber,
    formatCurrency,
    formatPercent,
  };
}

export default useTranslation;