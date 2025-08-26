import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { TrendChart } from '../../../../components/resource/charts/TrendChart';
import type { Observation } from '../../../../types/fhir';

// Mock observations for testing
const createMockObservation = (
  id: string,
  value: number,
  unit: string,
  date: string,
  interpretation?: string
): Observation => ({
  resourceType: 'Observation',
  id,
  status: 'final',
  code: {
    coding: [{
      system: 'http://loinc.org',
      code: '33747-0',
      display: 'Blood pressure'
    }]
  },
  subject: {
    reference: 'Patient/123'
  },
  effectiveDateTime: date,
  valueQuantity: {
    value,
    unit,
    system: 'http://unitsofmeasure.org',
    code: unit
  },
  interpretation: interpretation ? [{
    coding: [{
      system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
      code: interpretation,
      display: interpretation
    }]
  }] : undefined,
  referenceRange: [{
    low: {
      value: 90,
      unit: 'mmHg'
    },
    high: {
      value: 140,
      unit: 'mmHg'
    }
  }]
});

describe('TrendChart', () => {
  const mockObservations: Observation[] = [
    createMockObservation('1', 120, 'mmHg', '2024-01-01T10:00:00Z', 'N'),
    createMockObservation('2', 135, 'mmHg', '2024-01-02T10:00:00Z', 'H'),
    createMockObservation('3', 125, 'mmHg', '2024-01-03T10:00:00Z', 'N'),
    createMockObservation('4', 145, 'mmHg', '2024-01-04T10:00:00Z', 'H'),
  ];

  it('renders trend chart with observations', () => {
    render(
      <TrendChart 
        observations={mockObservations}
        title="Blood Pressure Trend"
      />
    );

    expect(screen.getByText('Blood Pressure Trend')).toBeInTheDocument();
    expect(screen.getByText(/Latest: 145 mmHg/)).toBeInTheDocument();
    expect(screen.getByText(/Normal: 90-140 mmHg/)).toBeInTheDocument();
  });

  it('renders empty state when no numeric observations', () => {
    const nonNumericObs: Observation[] = [{
      resourceType: 'Observation',
      id: '1',
      status: 'final',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '33747-0',
          display: 'Blood pressure'
        }]
      },
      subject: {
        reference: 'Patient/123'
      },
      effectiveDateTime: '2024-01-01T10:00:00Z',
      valueString: 'Normal'
    }];

    render(
      <TrendChart 
        observations={nonNumericObs}
        title="Test Chart"
      />
    );

    expect(screen.getByText('No numeric data available for trending')).toBeInTheDocument();
  });

  it('renders chart with custom height', () => {
    render(
      <TrendChart 
        observations={mockObservations}
        title="Custom Height Chart"
        height={300}
      />
    );

    const chartContainer = screen.getByText('Custom Height Chart').closest('.trend-chart-container');
    const chart = chartContainer?.querySelector('.trend-chart');
    expect(chart).toHaveStyle({ height: '300px' });
  });

  it('hides reference range when showReferenceRange is false', () => {
    render(
      <TrendChart 
        observations={mockObservations}
        title="No Reference Range"
        showReferenceRange={false}
      />
    );

    expect(screen.queryByText(/Normal:/)).not.toBeInTheDocument();
  });

  it('handles observations without reference ranges', () => {
    const obsWithoutRange: Observation[] = [
      {
        ...mockObservations[0],
        referenceRange: undefined
      }
    ];

    render(
      <TrendChart 
        observations={obsWithoutRange}
        title="No Range Chart"
      />
    );

    expect(screen.getByText('No Range Chart')).toBeInTheDocument();
    expect(screen.queryByText(/Normal:/)).not.toBeInTheDocument();
  });

  it('renders SVG elements for chart visualization', () => {
    render(
      <TrendChart 
        observations={mockObservations}
        title="SVG Test"
      />
    );

    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toBeInTheDocument();
    expect(svg.tagName).toBe('svg');
  });

  it('displays correct latest value in summary', () => {
    render(
      <TrendChart 
        observations={mockObservations}
        title="Latest Value Test"
      />
    );

    // Should show the last observation's value (145 mmHg)
    expect(screen.getByText(/Latest: 145.0 mmHg/)).toBeInTheDocument();
  });

  it('handles single observation', () => {
    const singleObs = [mockObservations[0]];

    render(
      <TrendChart 
        observations={singleObs}
        title="Single Observation"
      />
    );

    expect(screen.getByText('Single Observation')).toBeInTheDocument();
    expect(screen.getByText(/Latest: 120.0 mmHg/)).toBeInTheDocument();
  });

  it('sorts observations by date', () => {
    const unsortedObs = [
      createMockObservation('3', 125, 'mmHg', '2024-01-03T10:00:00Z'),
      createMockObservation('1', 120, 'mmHg', '2024-01-01T10:00:00Z'),
      createMockObservation('2', 135, 'mmHg', '2024-01-02T10:00:00Z'),
    ];

    render(
      <TrendChart 
        observations={unsortedObs}
        title="Sorted Test"
      />
    );

    // Should show the chronologically last value (125 mmHg from Jan 3)
    expect(screen.getByText(/Latest: 125.0 mmHg/)).toBeInTheDocument();
  });
});