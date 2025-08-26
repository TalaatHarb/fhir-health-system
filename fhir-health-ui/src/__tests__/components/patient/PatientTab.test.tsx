import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { PatientTab } from '../../../components/patient/PatientTab';
import type { Patient } from '../../../types/fhir';

const mockPatient: Patient = {
  resourceType: 'Patient',
  id: 'patient-1',
  name: [
    {
      use: 'official',
      given: ['John', 'Michael'],
      family: 'Doe',
    }
  ],
  gender: 'male',
  birthDate: '1990-01-01',
  address: [
    {
      use: 'home',
      line: ['123 Main St', 'Apt 4B'],
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country: 'US',
    }
  ],
  telecom: [
    {
      system: 'phone',
      value: '+1-555-123-4567',
      use: 'home',
    },
    {
      system: 'email',
      value: 'john.doe@example.com',
      use: 'home',
    }
  ],
};

const mockPatientMinimal: Patient = {
  resourceType: 'Patient',
  id: 'patient-2',
  name: [
    {
      given: ['Jane'],
      family: 'Smith',
    }
  ],
};

describe('PatientTab', () => {
  it('should not render when not active', () => {
    const onClose = vi.fn();
    
    const { container } = render(
      <PatientTab
        patient={mockPatient}
        isActive={false}
        onClose={onClose}
      />
    );

    const hiddenTab = container.querySelector('.patient-tab.hidden');
    expect(hiddenTab).toBeInTheDocument();
  });

  it('should render patient information when active', () => {
    const onClose = vi.fn();
    
    render(
      <PatientTab
        patient={mockPatient}
        isActive={true}
        onClose={onClose}
      />
    );

    // Check patient name
    expect(screen.getByText('John Michael Doe')).toBeInTheDocument();
    
    // Check patient details
    expect(screen.getByText(/DOB:/)).toBeInTheDocument();
    expect(screen.getByText('1/1/1990')).toBeInTheDocument();
    expect(screen.getByText(/Gender:/)).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText(/ID:/)).toBeInTheDocument();
    expect(screen.getByText('patient-1')).toBeInTheDocument();
  });

  it('should display contact information', () => {
    const onClose = vi.fn();
    
    render(
      <PatientTab
        patient={mockPatient}
        isActive={true}
        onClose={onClose}
      />
    );

    // Check address
    expect(screen.getByText(/Address:/)).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Apt 4B, Anytown, CA, 12345')).toBeInTheDocument();
    
    // Check phone
    expect(screen.getByText(/Phone:/)).toBeInTheDocument();
    expect(screen.getByText('+1-555-123-4567')).toBeInTheDocument();
    
    // Check email
    expect(screen.getByText(/Email:/)).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('should handle minimal patient data gracefully', () => {
    const onClose = vi.fn();
    
    render(
      <PatientTab
        patient={mockPatientMinimal}
        isActive={true}
        onClose={onClose}
      />
    );

    // Check patient name
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Check default values
    expect(screen.getAllByText('Unknown')).toHaveLength(2); // Birth date and gender
    expect(screen.getByText('No address on file')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    
    render(
      <PatientTab
        patient={mockPatient}
        isActive={true}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByLabelText('Close John Michael Doe tab');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should display placeholder sections for future features', () => {
    const onClose = vi.fn();
    
    render(
      <PatientTab
        patient={mockPatient}
        isActive={true}
        onClose={onClose}
      />
    );

    // Check section titles
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('Encounters')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    
    // Check placeholder content
    expect(screen.getByText(/Encounter timeline will be implemented/)).toBeInTheDocument();
    expect(screen.getByText(/Resource visualization will be implemented/)).toBeInTheDocument();
  });

  it('should handle patient with no name', () => {
    const patientNoName: Patient = {
      resourceType: 'Patient',
      id: 'patient-no-name',
      gender: 'unknown',
    };
    
    const onClose = vi.fn();
    
    render(
      <PatientTab
        patient={patientNoName}
        isActive={true}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Unknown Patient')).toBeInTheDocument();
  });

  it('should format birth date correctly', () => {
    const patientWithBirthDate: Patient = {
      resourceType: 'Patient',
      id: 'patient-birth',
      name: [{ given: ['Test'], family: 'Patient' }],
      birthDate: '1985-12-25',
    };
    
    const onClose = vi.fn();
    
    render(
      <PatientTab
        patient={patientWithBirthDate}
        isActive={true}
        onClose={onClose}
      />
    );

    expect(screen.getByText('12/25/1985')).toBeInTheDocument();
  });

  it('should handle multiple addresses by showing the first one', () => {
    const patientMultipleAddresses: Patient = {
      resourceType: 'Patient',
      id: 'patient-multi-addr',
      name: [{ given: ['Test'], family: 'Patient' }],
      address: [
        {
          use: 'home',
          line: ['123 Home St'],
          city: 'Home City',
          state: 'HC',
        },
        {
          use: 'work',
          line: ['456 Work Ave'],
          city: 'Work City',
          state: 'WC',
        }
      ],
    };
    
    const onClose = vi.fn();
    
    render(
      <PatientTab
        patient={patientMultipleAddresses}
        isActive={true}
        onClose={onClose}
      />
    );

    // Should show the first address
    expect(screen.getByText('123 Home St, Home City, HC')).toBeInTheDocument();
    expect(screen.queryByText('456 Work Ave')).not.toBeInTheDocument();
  });

  it('should handle multiple contact points by showing phone and email', () => {
    const patientMultipleContacts: Patient = {
      resourceType: 'Patient',
      id: 'patient-multi-contact',
      name: [{ given: ['Test'], family: 'Patient' }],
      telecom: [
        {
          system: 'phone',
          value: '+1-555-111-1111',
          use: 'home',
        },
        {
          system: 'phone',
          value: '+1-555-222-2222',
          use: 'work',
        },
        {
          system: 'email',
          value: 'test@example.com',
          use: 'home',
        },
        {
          system: 'fax',
          value: '+1-555-333-3333',
          use: 'work',
        }
      ],
    };
    
    const onClose = vi.fn();
    
    render(
      <PatientTab
        patient={patientMultipleContacts}
        isActive={true}
        onClose={onClose}
      />
    );

    // Should show the first phone and first email
    expect(screen.getByText('+1-555-111-1111')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.queryByText('+1-555-222-2222')).not.toBeInTheDocument();
    expect(screen.queryByText('+1-555-333-3333')).not.toBeInTheDocument();
  });
});