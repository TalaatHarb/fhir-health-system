import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ObservationViewer } from '../../../components/resource/ObservationViewer';
import type { Observation } from '../../../types/fhir';

// Mock TrendChart component
vi.mock('../../../components/resource/charts/TrendChart', () => ({
  TrendChart: ({ title, observations }: { title: string; observations: Observation[] }) => (
    <div data-testid="trend-chart">
      <div>{title}</div>
      <div>Observations: {observations.length}</div>
    </div>
  )
}));

const createMockObservation = (
  id: string,
  value: number,
  unit: string,
  interpretation?: string,
  referenceRange?: { low?: number; high?: number }
): Observation => ({
  resourceType: 'Observation',
  id,
  status: 'final',
  code: {
    text: 'Blood Pressure',
    coding: [{
      system: 'http://loinc.org',
      code: '85354-9',
      display: 'Blood pressure panel'
    }]
  },
  subject: {
    reference: 'Patient/123'
  },
  effectiveDateTime: '2024-01-15T10:30:00Z',
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
  referenceRange: referenceRange ? [{
    low: referenceRange.low ? {
      value: referenceRange.low,
      unit: unit
    } : undefined,
    high: referenceRange.high ? {
      value: referenceRange.high,
      unit: unit
    } : undefined
  }] : undefined
});

describe('Enhanced ObservationViewer', () => {
  const mockObservation = createMockObservation(
    '1',
    135,
    'mmHg',
    'H',
    { low: 90, high: 140 }
  );

  const relatedObservations = [
    createMockObservation('2', 120, 'mmHg', 'N'),
    createMockObservation('3', 125, 'mmHg', 'N'),
    createMockObservation('4', 145, 'mmHg', 'H'),
  ];

  describe('Enhanced Value Display', () => {
    it('renders enhanced value display with range indicator', () => {
      render(
        <ObservationViewer 
          observation={mockObservation}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('135')).toBeInTheDocument();
      expect(screen.getByText('mmHg')).toBeInTheDocument();
      
      // Check for enhanced value display class
      const valueDisplay = screen.getByText('135').closest('.value-display');
      expect(valueDisplay).toHaveClass('enhanced');
    });

    it('applies correct status class based on interpretation', () => {
      render(
        <ObservationViewer 
          observation={mockObservation}
          viewMode="detailed"
        />
      );

      const valueNumber = screen.getByText('135');
      expect(valueNumber).toHaveClass('high');
    });

    it('shows normal status for values within range', () => {
      const normalObs = createMockObservation(
        '1',
        120,
        'mmHg',
        'N',
        { low: 90, high: 140 }
      );

      render(
        <ObservationViewer 
          observation={normalObs}
          viewMode="detailed"
        />
      );

      const valueNumber = screen.getByText('120');
      expect(valueNumber).toHaveClass('normal');
    });

    it('shows critical status for critical interpretations', () => {
      const criticalObs = createMockObservation(
        '1',
        180,
        'mmHg',
        'panic'
      );

      render(
        <ObservationViewer 
          observation={criticalObs}
          viewMode="detailed"
        />
      );

      const valueNumber = screen.getByText('180');
      expect(valueNumber).toHaveClass('critical');
    });
  });

  describe('Trend Chart Integration', () => {
    it('renders trend chart when related observations are provided', () => {
      render(
        <ObservationViewer 
          observation={mockObservation}
          viewMode="detailed"
          relatedObservations={relatedObservations}
        />
      );

      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
      expect(screen.getByText('Blood Pressure Trend')).toBeInTheDocument();
      expect(screen.getByText('Observations: 4')).toBeInTheDocument(); // 1 main + 3 related
    });

    it('does not render trend chart when no related observations', () => {
      render(
        <ObservationViewer 
          observation={mockObservation}
          viewMode="detailed"
          relatedObservations={[]}
        />
      );

      expect(screen.queryByTestId('trend-chart')).not.toBeInTheDocument();
    });

    it('does not render trend chart for non-numeric observations', () => {
      const textObs: Observation = {
        resourceType: 'Observation',
        id: '1',
        status: 'final',
        code: {
          text: 'Patient Status',
          coding: [{
            system: 'http://loinc.org',
            code: '33999-4',
            display: 'Status'
          }]
        },
        subject: {
          reference: 'Patient/123'
        },
        effectiveDateTime: '2024-01-15T10:30:00Z',
        valueString: 'Stable'
      };

      render(
        <ObservationViewer 
          observation={textObs}
          viewMode="detailed"
          relatedObservations={relatedObservations}
        />
      );

      expect(screen.queryByTestId('trend-chart')).not.toBeInTheDocument();
    });

    it('renders trend chart only in detailed view mode', () => {
      render(
        <ObservationViewer 
          observation={mockObservation}
          viewMode="summary"
          relatedObservations={relatedObservations}
        />
      );

      expect(screen.queryByTestId('trend-chart')).not.toBeInTheDocument();
    });
  });

  describe('Reference Range Visualization', () => {
    it('renders range indicator for observations with reference ranges', () => {
      render(
        <ObservationViewer 
          observation={mockObservation}
          viewMode="detailed"
        />
      );

      const valueDisplay = screen.getByText('135').closest('.value-display');
      const rangeIndicator = valueDisplay?.querySelector('.value-range-indicator');
      expect(rangeIndicator).toBeInTheDocument();
    });

    it('does not render range indicator when no reference range', () => {
      const obsWithoutRange = createMockObservation('1', 120, 'mmHg');

      render(
        <ObservationViewer 
          observation={obsWithoutRange}
          viewMode="detailed"
        />
      );

      const valueDisplay = screen.getByText('120').closest('.value-display');
      const rangeIndicator = valueDisplay?.querySelector('.value-range-indicator');
      expect(rangeIndicator).not.toBeInTheDocument();
    });
  });

  describe('Component Observations', () => {
    it('renders component observations correctly', () => {
      const componentObs: Observation = {
        resourceType: 'Observation',
        id: '1',
        status: 'final',
        code: {
          text: 'Blood Pressure',
          coding: [{
            system: 'http://loinc.org',
            code: '85354-9',
            display: 'Blood pressure panel'
          }]
        },
        subject: {
          reference: 'Patient/123'
        },
        effectiveDateTime: '2024-01-15T10:30:00Z',
        component: [
          {
            code: {
              text: 'Systolic',
              coding: [{
                system: 'http://loinc.org',
                code: '8480-6',
                display: 'Systolic blood pressure'
              }]
            },
            valueQuantity: {
              value: 135,
              unit: 'mmHg'
            }
          },
          {
            code: {
              text: 'Diastolic',
              coding: [{
                system: 'http://loinc.org',
                code: '8462-4',
                display: 'Diastolic blood pressure'
              }]
            },
            valueQuantity: {
              value: 85,
              unit: 'mmHg'
            }
          }
        ]
      };

      render(
        <ObservationViewer 
          observation={componentObs}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Components:')).toBeInTheDocument();
      expect(screen.getByText('Systolic')).toBeInTheDocument();
      expect(screen.getByText('Diastolic')).toBeInTheDocument();
      expect(screen.getByText('135 mmHg')).toBeInTheDocument();
      expect(screen.getByText('85 mmHg')).toBeInTheDocument();
    });
  });

  describe('Summary View Enhancements', () => {
    it('shows enhanced value display in summary view', () => {
      render(
        <ObservationViewer 
          observation={mockObservation}
          viewMode="summary"
        />
      );

      expect(screen.getByText('135')).toBeInTheDocument();
      expect(screen.getByText('mmHg')).toBeInTheDocument();
    });

    it('shows interpretation in summary view', () => {
      render(
        <ObservationViewer 
          observation={mockObservation}
          viewMode="summary"
        />
      );

      // Should show interpretation indicator
      const summaryValue = screen.getByText('135').closest('.observation-summary-value');
      expect(summaryValue).toBeInTheDocument();
    });
  });
});