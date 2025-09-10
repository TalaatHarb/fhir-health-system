import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockI18nProvider } from '../../test-utils';
import { LanguageSelector } from '../../../components/ui/LanguageSelector';

// Use the global localStorage mock from setup
const localStorageMock = (globalThis as any).localStorageMock;

// Helper function to render with MockI18nProvider
const renderWithI18n = (ui: React.ReactElement, initialLanguage = 'en') => {
  return render(
    <MockI18nProvider initialLanguage={initialLanguage}>
      {ui}
    </MockI18nProvider>
  );
};

describe('LanguageSelector Simple Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should render dropdown variant by default', async () => {
    renderWithI18n(<LanguageSelector />);

    // Wait for translations to load
    await waitFor(() => {
      expect(screen.getByText(/Select Language/)).toBeInTheDocument();
    });

    // Should show current language (English)
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });
});