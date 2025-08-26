import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ObservationForm } from '../../../../components/encounter/forms/ObservationForm';
import type { Observation } from '../../../../types/fhir';

// Mock window.alert
const mockAlert = vi.fn();
global.alert = mockAlert;

describe('ObservationForm', () => {
  const mockOnAdd = vi.fn();
  const mockOnRemove = vi.fn();
  const user = userEvent.setup();

  const mockObservations: Omit<Observation, 'id' | 'resourceType' | 'subject' | 'encounter'>[] = [
    {
      status: 'final',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '8310-5',
          display: 'Body temperature'
        }],
        text: 'Body temperature'
      },
      valueQuantity: {
        value: 98.6,
        unit: 'degF',
        system: 'http://unitsofmeasure.org',
        code: 'degF'
      },
      effectiveDateTime: '2024-01-15T10:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = (observations = [], disabled = false) => {
    return render(
      <ObservationForm
        observations={observations}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
        disabled={disabled}
      />
    );
  };

  it('should render form header', () => {
    renderForm();
    expect(screen.getByText('Observations')).toBeInTheDocument();
    expect(screen.getByText('Add Observation')).toBeInTheDocument();
  });

  it('should display existing observations', () => {
    renderForm(mockObservations);
    expect(screen.getByText('Body temperature: 98.6 degF')).toBeInTheDocument();
    expect(screen.getByText('final')).toBeInTheDocument();
  });

  it('should show add form when button is clicked', async () => {
    renderForm();
    
    await user.click(screen.getByText('Add Observation'));
    
    expect(screen.getByText('Add New Observation')).toBeInTheDocument();
    expect(screen.getByLabelText('Status *')).toBeInTheDocument();
    expect(screen.getByLabelText('Category *')).toBeInTheDocument();
  });

  it('should populate form when common observation is selected', async () => {
    renderForm();
    
    await user.click(screen.getByText('Add Observation'));
    
    const commonSelect = screen.getByDisplayValue('Select a common observation...');
    await user.selectOptions(commonSelect, '8310-5');
    
    expect(screen.getByDisplayValue('8310-5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Body temperature')).toBeInTheDocument();
    expect(screen.getByDisplayValue('vital-signs')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    renderForm();
    
    await user.click(screen.getByText('Add Observation'));
    await user.click(screen.getByText('Add Observation'));
    
    expect(mockAlert).toHaveBeenCalledWith(
      expect.stringContaining('Observation code is required')
    );
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('should add quantity observation', async () => {
    renderForm();
    
    await user.click(screen.getByText('Add Observation'));
    
    // Fill in required fields
    await user.selectOptions(screen.getByLabelText('Status *'), 'final');
    await user.selectOptions(screen.getByLabelText('Category *'), 'vital-signs');
    await user.type(screen.getByLabelText('Code *'), '8310-5');
    await user.type(screen.getByLabelText('Display Name *'), 'Body temperature');
    await user.selectOptions(screen.getByLabelText('Value Type *'), 'quantity');
    await user.type(screen.getByLabelText('Value *'), '98.6');
    await user.type(screen.getByLabelText('Unit *'), 'degF');
    
    const effectiveInput = screen.getByLabelText('Effective Date/Time *');
    await user.clear(effectiveInput);
    await user.type(effectiveInput, '2024-01-15T10:00');
    
    await user.click(screen.getByText('Add Observation'));
    
    expect(mockOnAdd).toHaveBeenCalledWith({
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
          display: 'Vital Signs'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '8310-5',
          display: 'Body temperature'
        }],
        text: 'Body temperature'
      },
      effectiveDateTime: '2024-01-15T10:00',
      valueQuantity: {
        value: 98.6,
        unit: 'degF',
        system: 'http://unitsofmeasure.org',
        code: 'degF'
      }
    });
  });

  it('should add string observation', async () => {
    renderForm();
    
    await user.click(screen.getByText('Add Observation'));
    
    // Fill in required fields
    await user.selectOptions(screen.getByLabelText('Status *'), 'final');
    await user.type(screen.getByLabelText('Code *'), '33747-0');
    await user.type(screen.getByLabelText('Display Name *'), 'General appearance');
    await user.selectOptions(screen.getByLabelText('Value Type *'), 'string');
    await user.type(screen.getByLabelText('Value *'), 'Well-appearing');
    
    await user.click(screen.getByText('Add Observation'));
    
    expect(mockOnAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        valueString: 'Well-appearing'
      })
    );
  });

  it('should add boolean observation', async () => {
    renderForm();
    
    await user.click(screen.getByText('Add Observation'));
    
    // Fill in required fields
    await user.selectOptions(screen.getByLabelText('Status *'), 'final');
    await user.type(screen.getByLabelText('Code *'), '12345-6');
    await user.type(screen.getByLabelText('Display Name *'), 'Test boolean');
    await user.selectOptions(screen.getByLabelText('Value Type *'), 'boolean');
    await user.selectOptions(screen.getByLabelText('Value *'), 'true');
    
    await user.click(screen.getByText('Add Observation'));
    
    expect(mockOnAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        valueBoolean: true
      })
    );
  });

  it('should add codeable observation', async () => {
    renderForm();
    
    await user.click(screen.getByText('Add Observation'));
    
    // Fill in required fields
    await user.selectOptions(screen.getByLabelText('Status *'), 'final');
    await user.type(screen.getByLabelText('Code *'), '12345-6');
    await user.type(screen.getByLabelText('Display Name *'), 'Test codeable');
    await user.selectOptions(screen.getByLabelText('Value Type *'), 'codeable');
    await user.type(screen.getByLabelText('Code *'), '123456');
    await user.type(screen.getByLabelText('Display *'), 'Test value');
    
    await user.click(screen.getByText('Add Observation'));
    
    expect(mockOnAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        valueCodeableConcept: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '123456',
            display: 'Test value'
          }],
          text: 'Test value'
        }
      })
    );
  });

  it('should add interpretation and notes', async () => {
    renderForm();
    
    await user.click(screen.getByText('Add Observation'));
    
    // Fill in required fields
    await user.selectOptions(screen.getByLabelText('Status *'), 'final');
    await user.type(screen.getByLabelText('Code *'), '8310-5');
    await user.type(screen.getByLabelText('Display Name *'), 'Body temperature');
    await user.type(screen.getByLabelText('Value *'), '98.6');
    await user.type(screen.getByLabelText('Unit *'), 'degF');
    
    await user.selectOptions(screen.getByLabelText('Interpretation'), 'N');
    await user.type(screen.getByLabelText('Notes'), 'Patient appears comfortable');
    
    await user.click(screen.getByText('Add Observation'));
    
    expect(mockOnAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        interpretation: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: 'N',
            display: 'Normal'
          }]
        }],
        note: [{
          text: 'Patient appears comfortable'
        }]
      })
    );
  });

  it('should remove observation', async () => {
    renderForm(mockObservations);
    
    const removeButton = screen.getByLabelText('Remove observation');
    await user.click(removeButton);
    
    expect(mockOnRemove).toHaveBeenCalledWith(0);
  });

  it('should cancel form', async () => {
    renderForm();
    
    await user.click(screen.getByText('Add Observation'));
    expect(screen.getByText('Add New Observation')).toBeInTheDocument();
    
    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Add New Observation')).not.toBeInTheDocument();
  });

  it('should disable form when disabled prop is true', () => {
    renderForm([], true);
    
    expect(screen.getByText('Add Observation')).toBeDisabled();
  });

  it('should disable remove buttons when disabled prop is true', () => {
    renderForm(mockObservations, true);
    
    expect(screen.getByLabelText('Remove observation')).toBeDisabled();
  });

  it('should validate quantity value and unit', async () => {
    renderForm();
    
    await user.click(screen.getByText('Add Observation'));
    
    // Fill in required fields but leave quantity incomplete
    await user.selectOptions(screen.getByLabelText('Status *'), 'final');
    await user.type(screen.getByLabelText('Code *'), '8310-5');
    await user.type(screen.getByLabelText('Display Name *'), 'Body temperature');
    await user.selectOptions(screen.getByLabelText('Value Type *'), 'quantity');
    // Don't fill in value or unit
    
    await user.click(screen.getByText('Add Observation'));
    
    expect(mockAlert).toHaveBeenCalledWith(
      expect.stringContaining('Quantity value is required')
    );
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('should validate string value', async () => {
    renderForm();
    
    await user.click(screen.getByText('Add Observation'));
    
    // Fill in required fields but leave string value empty
    await user.selectOptions(screen.getByLabelText('Status *'), 'final');
    await user.type(screen.getByLabelText('Code *'), '33747-0');
    await user.type(screen.getByLabelText('Display Name *'), 'General appearance');
    await user.selectOptions(screen.getByLabelText('Value Type *'), 'string');
    // Don't fill in string value
    
    await user.click(screen.getByText('Add Observation'));
    
    expect(mockAlert).toHaveBeenCalledWith(
      expect.stringContaining('String value is required')
    );
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('should reset form after successful add', async () => {
    renderForm();
    
    await user.click(screen.getByText('Add Observation'));
    
    // Fill in and submit form
    await user.selectOptions(screen.getByLabelText('Status *'), 'final');
    await user.type(screen.getByLabelText('Code *'), '8310-5');
    await user.type(screen.getByLabelText('Display Name *'), 'Body temperature');
    await user.type(screen.getByLabelText('Value *'), '98.6');
    await user.type(screen.getByLabelText('Unit *'), 'degF');
    
    await user.click(screen.getByText('Add Observation'));
    
    // Form should be hidden after successful add
    expect(screen.queryByText('Add New Observation')).not.toBeInTheDocument();
    expect(mockOnAdd).toHaveBeenCalled();
  });

  it('should format different observation types correctly', () => {
    const observations = [
      {
        status: 'final' as const,
        code: { text: 'Temperature' },
        valueQuantity: { value: 98.6, unit: 'degF' },
        effectiveDateTime: '2024-01-15T10:00:00Z'
      },
      {
        status: 'final' as const,
        code: { text: 'Appearance' },
        valueString: 'Well-appearing',
        effectiveDateTime: '2024-01-15T10:00:00Z'
      },
      {
        status: 'final' as const,
        code: { text: 'Alert' },
        valueBoolean: true,
        effectiveDateTime: '2024-01-15T10:00:00Z'
      },
      {
        status: 'final' as const,
        code: { text: 'Result' },
        valueCodeableConcept: { text: 'Positive' },
        effectiveDateTime: '2024-01-15T10:00:00Z'
      }
    ];
    
    renderForm(observations);
    
    expect(screen.getByText('Temperature: 98.6 degF')).toBeInTheDocument();
    expect(screen.getByText('Appearance: Well-appearing')).toBeInTheDocument();
    expect(screen.getByText('Alert: Yes')).toBeInTheDocument();
    expect(screen.getByText('Result: Positive')).toBeInTheDocument();
  });
});