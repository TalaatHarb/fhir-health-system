import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { EncounterTimelineItem } from '../../../components/encounter/EncounterTimelineItem';
import type { Encounter } from '../../../types/fhir';

describe('EncounterTimelineItem', () => {
  const mockEncounter: Encounter = {
    resourceType: 'Encounter',
    id: 'encounter-123',
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'Ambulatory',
    },
    type: [
      {
        text: 'General Consultation',
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '11429006',
            display: 'Consultation',
          },
        ],
      },
    ],
    subject: {
      reference: 'Patient/patient-123',
    },
    period: {
      start: '2024-01-15T10:00:00Z',
      end: '2024-01-15T11:30:00Z',
    },
    reasonCode: [
      {
        text: 'Annual checkup',
      },
      {
        text: 'Blood pressure monitoring',
      },
    ],
    diagnosis: [
      {
        condition: {
          reference: 'Condition/condition-123',
          display: 'Hypertension',
        },
        rank: 1,
      },
    ],
    participant: [
      {
        type: [
          {
            text: 'Primary Care Physician',
          },
        ],
        individual: {
          reference: 'Practitioner/practitioner-123',
          display: 'Dr. Smith',
        },
      },
    ],
  };

  const defaultProps = {
    encounter: mockEncounter,
    isExpanded: false,
    onToggle: vi.fn(),
    onSelect: vi.fn(),
  };

  it('renders encounter basic information', () => {
    render(<EncounterTimelineItem {...defaultProps} />);

    expect(screen.getByText('General Consultation')).toBeInTheDocument();
    expect(screen.getByText('(Ambulatory)')).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();
  });

  it('formats encounter date correctly', () => {
    render(<EncounterTimelineItem {...defaultProps} />);

    // Should show formatted date
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it('calculates and displays encounter duration', () => {
    render(<EncounterTimelineItem {...defaultProps} />);

    // Duration should be 1.5 hours (90 minutes)
    expect(screen.getByText(/2 hr/)).toBeInTheDocument();
  });

  it('displays correct status styling', () => {
    render(<EncounterTimelineItem {...defaultProps} />);

    const statusElement = screen.getByText('Finished');
    expect(statusElement).toHaveClass('status-finished');

    const dotElement = document.querySelector('.timeline-dot');
    expect(dotElement).toHaveClass('status-finished');
  });

  it('toggles expansion when header is clicked', () => {
    const onToggle = vi.fn();
    render(<EncounterTimelineItem {...defaultProps} onToggle={onToggle} />);

    const header = document.querySelector('.encounter-header');
    fireEvent.click(header!);

    expect(onToggle).toHaveBeenCalled();
  });

  it('shows expand button and toggles correctly', () => {
    const onToggle = vi.fn();
    render(<EncounterTimelineItem {...defaultProps} onToggle={onToggle} />);

    const expandButton = screen.getByLabelText('Expand details');
    expect(expandButton).toBeInTheDocument();

    fireEvent.click(expandButton);
    expect(onToggle).toHaveBeenCalled();
  });

  it('shows expanded details when isExpanded is true', () => {
    render(<EncounterTimelineItem {...defaultProps} isExpanded={true} />);

    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Timing')).toBeInTheDocument();
    expect(screen.getByText('Reason for Visit')).toBeInTheDocument();
    expect(screen.getByText('Diagnoses')).toBeInTheDocument();
    expect(screen.getByText('Participants')).toBeInTheDocument();
  });

  it('displays encounter details correctly when expanded', () => {
    render(<EncounterTimelineItem {...defaultProps} isExpanded={true} />);

    // Basic Information
    expect(screen.getByText('encounter-123')).toBeInTheDocument();
    expect(screen.getAllByText('Finished')).toHaveLength(2); // One in header, one in details
    expect(screen.getByText('Ambulatory')).toBeInTheDocument();
    expect(screen.getAllByText('General Consultation')).toHaveLength(2); // One in header, one in details

    // Reason codes
    expect(screen.getByText('Annual checkup')).toBeInTheDocument();
    expect(screen.getByText('Blood pressure monitoring')).toBeInTheDocument();

    // Diagnoses
    expect(screen.getByText('Hypertension')).toBeInTheDocument();

    // Participants
    expect(screen.getByText('Primary Care Physician:')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
  });

  it('calls onSelect when View Full Details button is clicked', () => {
    const onSelect = vi.fn();
    render(<EncounterTimelineItem {...defaultProps} onSelect={onSelect} isExpanded={true} />);

    const viewDetailsButton = screen.getByText('View Full Details');
    fireEvent.click(viewDetailsButton);

    expect(onSelect).toHaveBeenCalled();
  });

  it('handles encounter without end date', () => {
    const ongoingEncounter: Encounter = {
      ...mockEncounter,
      status: 'in-progress',
      period: {
        start: '2024-01-15T10:00:00Z',
        // No end date
      },
    };

    render(<EncounterTimelineItem {...defaultProps} encounter={ongoingEncounter} isExpanded={true} />);

    expect(screen.getAllByText('In progress')).toHaveLength(2); // One in header, one in details
    // Should not show end date in timing section
    expect(screen.queryByText('End:')).not.toBeInTheDocument();
  });

  it('handles encounter without reason codes', () => {
    const encounterWithoutReasons: Encounter = {
      ...mockEncounter,
      reasonCode: undefined,
    };

    render(<EncounterTimelineItem {...defaultProps} encounter={encounterWithoutReasons} isExpanded={true} />);

    // Should not show reason section
    expect(screen.queryByText('Reason for Visit')).not.toBeInTheDocument();
  });

  it('handles encounter without diagnoses', () => {
    const encounterWithoutDiagnoses: Encounter = {
      ...mockEncounter,
      diagnosis: undefined,
    };

    render(<EncounterTimelineItem {...defaultProps} encounter={encounterWithoutDiagnoses} isExpanded={true} />);

    // Should not show diagnoses section
    expect(screen.queryByText('Diagnoses')).not.toBeInTheDocument();
  });

  it('handles encounter without participants', () => {
    const encounterWithoutParticipants: Encounter = {
      ...mockEncounter,
      participant: undefined,
    };

    render(<EncounterTimelineItem {...defaultProps} encounter={encounterWithoutParticipants} isExpanded={true} />);

    // Should not show participants section
    expect(screen.queryByText('Participants')).not.toBeInTheDocument();
  });

  it('handles different encounter statuses correctly', () => {
    const statuses: Array<Encounter['status']> = [
      'planned',
      'arrived',
      'triaged',
      'in-progress',
      'onleave',
      'finished',
      'cancelled',
      'entered-in-error',
      'unknown',
    ];

    statuses.forEach(status => {
      const { unmount } = render(
        <EncounterTimelineItem 
          {...defaultProps} 
          encounter={{ ...mockEncounter, status }} 
        />
      );

      const statusText = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
      expect(screen.getByText(statusText)).toBeInTheDocument();

      const statusElement = screen.getByText(statusText);
      expect(statusElement).toHaveClass(`status-${status}`);

      unmount();
    });
  });

  it('handles encounter without type gracefully', () => {
    const encounterWithoutType: Encounter = {
      ...mockEncounter,
      type: undefined,
    };

    render(<EncounterTimelineItem {...defaultProps} encounter={encounterWithoutType} />);

    expect(screen.getByText('General')).toBeInTheDocument(); // Default type
  });

  it('handles encounter without class gracefully', () => {
    const encounterWithoutClass: Encounter = {
      ...mockEncounter,
      class: undefined as any, // Force undefined for testing
    };

    render(<EncounterTimelineItem {...defaultProps} encounter={encounterWithoutClass} />);

    expect(screen.getByText('(Unknown)')).toBeInTheDocument(); // Default class
  });

  it('handles invalid dates gracefully', () => {
    const encounterWithInvalidDate: Encounter = {
      ...mockEncounter,
      period: {
        start: 'invalid-date',
      },
    };

    render(<EncounterTimelineItem {...defaultProps} encounter={encounterWithInvalidDate} />);

    expect(screen.getByText('Invalid date')).toBeInTheDocument();
  });

  it('applies first and last classes correctly', () => {
    const { rerender } = render(
      <EncounterTimelineItem {...defaultProps} isFirst={true} />
    );

    let timelineItem = document.querySelector('.encounter-timeline-item');
    expect(timelineItem).toHaveClass('first');

    rerender(
      <EncounterTimelineItem {...defaultProps} isLast={true} />
    );

    timelineItem = document.querySelector('.encounter-timeline-item');
    expect(timelineItem).toHaveClass('last');
  });

  it('shows expand button as expanded when isExpanded is true', () => {
    render(<EncounterTimelineItem {...defaultProps} isExpanded={true} />);

    const expandButton = screen.getByLabelText('Collapse details');
    expect(expandButton).toHaveClass('expanded');
  });

  it('calculates duration in minutes for short encounters', () => {
    const shortEncounter: Encounter = {
      ...mockEncounter,
      period: {
        start: '2024-01-15T10:00:00Z',
        end: '2024-01-15T10:30:00Z', // 30 minutes
      },
    };

    render(<EncounterTimelineItem {...defaultProps} encounter={shortEncounter} />);

    expect(screen.getByText(/30 min/)).toBeInTheDocument();
  });

  it('calculates duration in days for long encounters', () => {
    const longEncounter: Encounter = {
      ...mockEncounter,
      period: {
        start: '2024-01-15T10:00:00Z',
        end: '2024-01-17T10:00:00Z', // 2 days
      },
    };

    render(<EncounterTimelineItem {...defaultProps} encounter={longEncounter} />);

    expect(screen.getByText(/2 days/)).toBeInTheDocument();
  });
});