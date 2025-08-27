import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ConditionViewer } from '../../../components/resource/ConditionViewer';
import type { Condition } from '../../../types/fhir';

const createMockCondition = (
  id: string,
  severity?: string,
  clinicalStatus?: string,
  verificationStatus?: string
): Condition => ({
  resourceType: 'Condition',
  id,
  code: {
    text: 'Hypertension',
    coding: [{
      system: 'http://snomed.info/sct',
      code: '38341003',
      display: 'Hypertensive disorder'
    }]
  },
  subject: {
    reference: 'Patient/123'
  },
  clinicalStatus: clinicalStatus ? {
    coding: [{
      system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
      code: clinicalStatus,
      display: clinicalStatus
    }]
  } : undefined,
  verificationStatus: verificationStatus ? {
    coding: [{
      system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
      code: verificationStatus,
      display: verificationStatus
    }]
  } : undefined,
  severity: severity ? {
    coding: [{
      system: 'http://snomed.info/sct',
      code: severity === 'mild' ? '255604002' : 
            severity === 'moderate' ? '6736007' :
            severity === 'severe' ? '24484000' :
            severity === 'fatal' ? '399166001' : '255604002',
      display: severity
    }]
  } : undefined,
  onsetDateTime: '2024-01-01T00:00:00Z',
  recordedDate: '2024-01-15T10:30:00Z'
});

describe('Enhanced ConditionViewer', () => {
  describe('Severity Indicator Visualization', () => {
    it('renders mild severity indicator correctly', () => {
      const condition = createMockCondition('1', 'mild', 'active');

      render(
        <ConditionViewer 
          condition={condition}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Mild Severity')).toBeInTheDocument();
      
      const severityIndicator = screen.getByText('Mild Severity').closest('.condition-severity-indicator');
      expect(severityIndicator).toHaveClass('255604002'); // SNOMED code for mild
      
      // Check for severity icon
      const severityIcon = severityIndicator?.querySelector('.severity-icon');
      expect(severityIcon).toBeInTheDocument();
      expect(severityIcon).toHaveTextContent('●');
    });

    it('renders moderate severity indicator correctly', () => {
      const condition = createMockCondition('1', 'moderate', 'active');

      render(
        <ConditionViewer 
          condition={condition}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Moderate Severity')).toBeInTheDocument();
      
      const severityIndicator = screen.getByText('Moderate Severity').closest('.condition-severity-indicator');
      expect(severityIndicator).toHaveClass('6736007'); // SNOMED code for moderate
      
      const severityIcon = severityIndicator?.querySelector('.severity-icon');
      expect(severityIcon).toHaveTextContent('●●');
    });

    it('renders severe severity indicator correctly', () => {
      const condition = createMockCondition('1', 'severe', 'active');

      render(
        <ConditionViewer 
          condition={condition}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Severe Severity')).toBeInTheDocument();
      
      const severityIndicator = screen.getByText('Severe Severity').closest('.condition-severity-indicator');
      expect(severityIndicator).toHaveClass('24484000'); // SNOMED code for severe
      
      const severityIcon = severityIndicator?.querySelector('.severity-icon');
      expect(severityIcon).toHaveTextContent('●●●');
    });

    it('renders fatal severity indicator with warning', () => {
      const condition = createMockCondition('1', 'fatal', 'active');

      render(
        <ConditionViewer 
          condition={condition}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Fatal Severity')).toBeInTheDocument();
      expect(screen.getByText('Requires immediate attention')).toBeInTheDocument();
      
      const severityIndicator = screen.getByText('Fatal Severity').closest('.condition-severity-indicator');
      expect(severityIndicator).toHaveClass('fatal');
      
      const severityIcon = severityIndicator?.querySelector('.severity-icon');
      expect(severityIcon).toHaveTextContent('⚠');
    });

    it('does not render severity indicator when no severity', () => {
      const condition = createMockCondition('1', undefined, 'active');

      render(
        <ConditionViewer 
          condition={condition}
          viewMode="detailed"
        />
      );

      expect(screen.queryByText(/Severity/)).not.toBeInTheDocument();
      expect(screen.queryByText('Requires immediate attention')).not.toBeInTheDocument();
    });
  });

  describe('Clinical Status Visualization', () => {
    it('renders active clinical status correctly', () => {
      const condition = createMockCondition('1', 'mild', 'active');

      render(
        <ConditionViewer 
          condition={condition}
          viewMode="detailed"
        />
      );

      const statusElement = screen.getByText('Active');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveClass('status-active');
    });

    it('renders inactive clinical status correctly', () => {
      const condition = createMockCondition('1', 'mild', 'inactive');

      render(
        <ConditionViewer 
          condition={condition}
          viewMode="detailed"
        />
      );

      const statusElement = screen.getByText('Inactive');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveClass('status-inactive');
    });

    it('renders resolved clinical status correctly', () => {
      const condition = createMockCondition('1', 'mild', 'resolved');

      render(
        <ConditionViewer 
          condition={condition}
          viewMode="detailed"
        />
      );

      const statusElement = screen.getByText('Resolved');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveClass('status-completed');
    });
  });

  describe('Summary View Enhancements', () => {
    it('shows severity and status indicators in summary view', () => {
      const condition = createMockCondition('1', 'severe', 'active');

      render(
        <ConditionViewer 
          condition={condition}
          viewMode="summary"
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Severe')).toBeInTheDocument();
      
      const summaryStatus = screen.getByText('Active').closest('.condition-summary-status');
      expect(summaryStatus).toBeInTheDocument();
    });

    it('shows only clinical status when no severity in summary', () => {
      const condition = createMockCondition('1', undefined, 'active');

      render(
        <ConditionViewer 
          condition={condition}
          viewMode="summary"
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.queryByText(/Severe|Mild|Moderate|Fatal/)).not.toBeInTheDocument();
    });
  });

  describe('Detailed View Layout', () => {
    it('renders severity indicator before timeline section', () => {
      const condition = createMockCondition('1', 'moderate', 'active');

      render(
        <ConditionViewer 
          condition={condition}
          viewMode="detailed"
        />
      );

      const severitySection = screen.getByText('Moderate Severity').closest('.condition-severity-indicator');
      const timelineSection = screen.getByText('Timeline').closest('.detail-section');
      
      expect(severitySection).toBeInTheDocument();
      expect(timelineSection).toBeInTheDocument();
      
      // Check that severity comes before timeline in DOM order
      const container = screen.getByText('Hypertension').closest('.condition-details');
      const sections = container?.children;
      
      if (sections) {
        const severityIndex = Array.from(sections).findIndex(section => 
          section.querySelector('.condition-severity-indicator')
        );
        const timelineIndex = Array.from(sections).findIndex(section => 
          section.querySelector('h5')?.textContent === 'Timeline'
        );
        
        expect(severityIndex).toBeLessThan(timelineIndex);
      }
    });
  });

  describe('Body Sites Display', () => {
    it('renders body sites with enhanced styling', () => {
      const conditionWithBodySites: Condition = {
        ...createMockCondition('1', 'mild', 'active'),
        bodySite: [
          {
            text: 'Left arm',
            coding: [{
              system: 'http://snomed.info/sct',
              code: '368208006',
              display: 'Left upper arm structure'
            }]
          },
          {
            text: 'Right arm',
            coding: [{
              system: 'http://snomed.info/sct',
              code: '368209003',
              display: 'Right upper arm structure'
            }]
          }
        ]
      };

      render(
        <ConditionViewer 
          condition={conditionWithBodySites}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Body Sites')).toBeInTheDocument();
      expect(screen.getByText('Left arm')).toBeInTheDocument();
      expect(screen.getByText('Right arm')).toBeInTheDocument();
      
      // Check for body site tags styling
      const leftArmTag = screen.getByText('Left arm');
      expect(leftArmTag).toHaveClass('body-site-tag');
    });
  });

  describe('Stage Information Display', () => {
    it('renders stage information correctly', () => {
      const conditionWithStage: Condition = {
        ...createMockCondition('1', 'severe', 'active'),
        stage: [{
          summary: {
            text: 'Stage II',
            coding: [{
              system: 'http://snomed.info/sct',
              code: '261612004',
              display: 'Stage 2'
            }]
          },
          type: {
            text: 'Clinical staging',
            coding: [{
              system: 'http://snomed.info/sct',
              code: '261612004',
              display: 'Clinical staging'
            }]
          }
        }]
      };

      render(
        <ConditionViewer 
          condition={conditionWithStage}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Stage Information')).toBeInTheDocument();
      expect(screen.getByText('Summary:')).toBeInTheDocument();
      expect(screen.getByText('Stage II')).toBeInTheDocument();
      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('Clinical staging')).toBeInTheDocument();
    });
  });

  describe('Evidence Display', () => {
    it('renders evidence information correctly', () => {
      const conditionWithEvidence: Condition = {
        ...createMockCondition('1', 'moderate', 'active'),
        evidence: [{
          code: [{
            text: 'Blood pressure measurement',
            coding: [{
              system: 'http://snomed.info/sct',
              code: '75367002',
              display: 'Blood pressure'
            }]
          }],
          detail: [{
            reference: 'Observation/bp-reading-1',
            display: 'Blood pressure reading 140/90'
          }]
        }]
      };

      render(
        <ConditionViewer 
          condition={conditionWithEvidence}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Evidence')).toBeInTheDocument();
      expect(screen.getByText('Blood pressure measurement')).toBeInTheDocument();
      expect(screen.getByText('Blood pressure reading 140/90')).toBeInTheDocument();
    });
  });
});