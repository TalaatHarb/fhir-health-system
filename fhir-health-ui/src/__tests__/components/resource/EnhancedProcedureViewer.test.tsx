import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ProcedureViewer } from '../../../components/resource/ProcedureViewer';
import type { Procedure } from '../../../types/fhir';

const createMockProcedure = (
  id: string,
  status: string = 'completed',
  hasOutcome: boolean = true,
  hasComplications: boolean = false
): Procedure => ({
  resourceType: 'Procedure',
  id,
  status: status as any,
  code: {
    text: 'Appendectomy',
    coding: [{
      system: 'http://snomed.info/sct',
      code: '80146002',
      display: 'Appendectomy'
    }]
  },
  subject: {
    reference: 'Patient/123'
  },
  performedDateTime: '2024-01-15T10:30:00Z',
  category: {
    text: 'Surgical procedure',
    coding: [{
      system: 'http://snomed.info/sct',
      code: '387713003',
      display: 'Surgical procedure'
    }]
  },
  location: {
    reference: 'Location/or-1',
    display: 'Operating Room 1'
  },
  performer: [{
    actor: {
      reference: 'Practitioner/surgeon-smith',
      display: 'Dr. John Smith'
    },
    function: {
      text: 'Primary surgeon',
      coding: [{
        system: 'http://snomed.info/sct',
        code: '304292004',
        display: 'Primary surgeon'
      }]
    }
  }],
  bodySite: [{
    text: 'Appendix',
    coding: [{
      system: 'http://snomed.info/sct',
      code: '66754008',
      display: 'Appendix structure'
    }]
  }],
  outcome: hasOutcome ? {
    text: 'Successful removal of inflamed appendix',
    coding: [{
      system: 'http://snomed.info/sct',
      code: '385669000',
      display: 'Successful'
    }]
  } : undefined,
  complication: hasComplications ? [{
    text: 'Minor bleeding',
    coding: [{
      system: 'http://snomed.info/sct',
      code: '131148009',
      display: 'Bleeding'
    }]
  }] : undefined,
  followUp: [{
    text: 'Follow-up in 2 weeks',
    coding: [{
      system: 'http://snomed.info/sct',
      code: '390906007',
      display: 'Follow-up encounter'
    }]
  }],
  focalDevice: [{
    action: {
      text: 'Implanted',
      coding: [{
        system: 'http://snomed.info/sct',
        code: '71181003',
        display: 'Implanted'
      }]
    },
    manipulated: {
      reference: 'Device/surgical-clip-1',
      display: 'Surgical clip'
    }
  }]
});

describe('Enhanced ProcedureViewer', () => {
  describe('Enhanced Timeline Visualization', () => {
    it('renders procedure timeline with status indicator', () => {
      const procedure = createMockProcedure('1', 'completed');

      const { container } = render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="detailed"
        />
      );

      const timeline = container.querySelector('.procedure-timeline');
      expect(timeline).toBeInTheDocument();

      const phase = container.querySelector('.procedure-phase');
      expect(phase).toHaveClass('completed');

      const indicator = phase?.querySelector('.phase-indicator');
      expect(indicator).toHaveClass('completed');
      expect(indicator).toHaveTextContent('✓');
    });

    it('renders in-progress status correctly', () => {
      const procedure = createMockProcedure('1', 'in-progress');

      const { container } = render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="detailed"
        />
      );

      const phase = container.querySelector('.procedure-phase');
      expect(phase).toHaveClass('in-progress');

      const indicator = phase?.querySelector('.phase-indicator');
      expect(indicator).toHaveClass('in-progress');
      expect(indicator).toHaveTextContent('⟳');
    });

    it('renders preparation status correctly', () => {
      const procedure = createMockProcedure('1', 'preparation');

      const { container } = render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="detailed"
        />
      );

      const phase = container.querySelector('.procedure-phase');
      expect(phase).toHaveClass('preparation');

      const indicator = phase?.querySelector('.phase-indicator');
      expect(indicator).toHaveClass('preparation');
      expect(indicator).toHaveTextContent('◐');
    });

    it('includes location and timing in phase description', () => {
      const procedure = createMockProcedure('1', 'completed');

      render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="detailed"
        />
      );

      const phaseDescription = screen.getByText(/Status: Completed.*Operating Room 1/);
      expect(phaseDescription).toBeInTheDocument();
    });
  });

  describe('Enhanced Outcome Display', () => {
    it('renders successful outcome card', () => {
      const procedure = createMockProcedure('1', 'completed', true, false);

      render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="detailed"
        />
      );

      const outcomeCard = screen.getByText('Procedure Outcome').closest('.procedure-outcome-card');
      expect(outcomeCard).toHaveClass('outcome-success');

      expect(screen.getByText('Procedure Outcome')).toBeInTheDocument();
      expect(screen.getByText('Result:')).toBeInTheDocument();
      expect(screen.getAllByText('Successful removal of inflamed appendix')[0]).toBeInTheDocument();
    });

    it('renders outcome with complications', () => {
      const procedure = createMockProcedure('1', 'completed', true, true);

      render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="detailed"
        />
      );

      const outcomeCard = screen.getByText('Procedure Outcome with Complications').closest('.procedure-outcome-card');
      expect(outcomeCard).toHaveClass('outcome-complications');

      expect(screen.getByText('Procedure Outcome with Complications')).toBeInTheDocument();
      expect(screen.getByText('Result:')).toBeInTheDocument();
      expect(screen.getAllByText('Successful removal of inflamed appendix')[0]).toBeInTheDocument();
      expect(screen.getByText('Complications:')).toBeInTheDocument();
      expect(screen.getAllByText('Minor bleeding')[0]).toBeInTheDocument();
    });

    it('renders complications-only outcome card', () => {
      const procedure = createMockProcedure('1', 'completed', false, true);

      render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="detailed"
        />
      );

      const outcomeCard = screen.getByText('Procedure Outcome with Complications').closest('.procedure-outcome-card');
      expect(outcomeCard).toHaveClass('outcome-complications');

      expect(screen.getByText('Complications:')).toBeInTheDocument();
      expect(screen.getAllByText('Minor bleeding')[0]).toBeInTheDocument();
      expect(screen.queryByText('Result:')).not.toBeInTheDocument();
    });

    it('does not render outcome card when no outcome or complications', () => {
      const procedure = createMockProcedure('1', 'completed', false, false);

      render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="detailed"
        />
      );

      expect(screen.queryByText('Procedure Outcome')).not.toBeInTheDocument();
    });
  });

  describe('Summary View Enhancements', () => {
    it('shows outcome preview in summary view', () => {
      const procedure = createMockProcedure('1', 'completed', true, false);

      render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="summary"
        />
      );

      const outcomePreview = screen.getByText('Outcome:').closest('.procedure-summary-outcome');
      expect(outcomePreview).toBeInTheDocument();
      expect(screen.getByText('Successful removal of inflamed appendix')).toBeInTheDocument();
    });

    it('does not show outcome preview when no outcome', () => {
      const procedure = createMockProcedure('1', 'completed', false, false);

      render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="summary"
        />
      );

      expect(screen.queryByText('Outcome:')).not.toBeInTheDocument();
    });

    it('shows body site in summary', () => {
      const procedure = createMockProcedure('1', 'completed');

      render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="summary"
        />
      );

      expect(screen.getByText(/Appendix/)).toBeInTheDocument();
    });
  });

  describe('Performers Display', () => {
    it('renders performers with roles', () => {
      const procedure = createMockProcedure('1', 'completed');

      render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Performed By')).toBeInTheDocument();
      expect(screen.getByText('Dr. John Smith (Primary surgeon)')).toBeInTheDocument();
    });

    it('renders performers without roles', () => {
      const procedureWithoutRoles: Procedure = {
        ...createMockProcedure('1', 'completed'),
        performer: [{
          actor: {
            reference: 'Practitioner/surgeon-smith',
            display: 'Dr. John Smith'
          }
        }]
      };

      render(
        <ProcedureViewer
          procedure={procedureWithoutRoles}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.queryByText('Primary surgeon')).not.toBeInTheDocument();
    });
  });

  describe('Body Sites Display', () => {
    it('renders body sites as tags', () => {
      const procedure = createMockProcedure('1', 'completed');

      render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Body Sites')).toBeInTheDocument();

      const bodySiteTag = screen.getByText('Appendix');
      expect(bodySiteTag).toHaveClass('body-site-tag');
    });
  });

  describe('Follow-up Instructions', () => {
    it('renders follow-up instructions', () => {
      const procedure = createMockProcedure('1', 'completed');

      render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Follow-up Instructions')).toBeInTheDocument();
      expect(screen.getByText('Follow-up in 2 weeks')).toBeInTheDocument();
    });
  });

  describe('Devices Used', () => {
    it('renders focal devices with actions', () => {
      const procedure = createMockProcedure('1', 'completed');

      render(
        <ProcedureViewer
          procedure={procedure}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Devices Used')).toBeInTheDocument();
      expect(screen.getByText('Surgical clip')).toBeInTheDocument();
      expect(screen.getByText('Action: Implanted')).toBeInTheDocument();
    });
  });

  describe('Status Reason Display', () => {
    it('renders status reason when available', () => {
      const procedureWithStatusReason: Procedure = {
        ...createMockProcedure('1', 'stopped'),
        statusReason: {
          text: 'Patient became unstable',
          coding: [{
            system: 'http://snomed.info/sct',
            code: '182856006',
            display: 'Patient unstable'
          }]
        }
      };

      render(
        <ProcedureViewer
          procedure={procedureWithStatusReason}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Status Reason')).toBeInTheDocument();
      expect(screen.getByText('Patient became unstable')).toBeInTheDocument();
    });
  });

  describe('Reason for Procedure', () => {
    it('renders reason codes and references', () => {
      const procedureWithReasons: Procedure = {
        ...createMockProcedure('1', 'completed'),
        reasonCode: [{
          text: 'Acute appendicitis',
          coding: [{
            system: 'http://snomed.info/sct',
            code: '85189001',
            display: 'Acute appendicitis'
          }]
        }],
        reasonReference: [{
          reference: 'Condition/appendicitis-1',
          display: 'Acute appendicitis with complications'
        }]
      };

      render(
        <ProcedureViewer
          procedure={procedureWithReasons}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Reason for Procedure')).toBeInTheDocument();
      expect(screen.getByText('Reason Codes:')).toBeInTheDocument();
      expect(screen.getByText('Acute appendicitis')).toBeInTheDocument();
      expect(screen.getByText('Related Conditions:')).toBeInTheDocument();
      expect(screen.getByText('Acute appendicitis with complications')).toBeInTheDocument();
    });
  });

  describe('Reports Display', () => {
    it('renders procedure reports', () => {
      const procedureWithReports: Procedure = {
        ...createMockProcedure('1', 'completed'),
        report: [{
          reference: 'DiagnosticReport/surgery-report-1',
          display: 'Surgical procedure report'
        }]
      };

      render(
        <ProcedureViewer
          procedure={procedureWithReports}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Surgical procedure report')).toBeInTheDocument();
    });
  });

  describe('Used Items Display', () => {
    it('renders used references and codes', () => {
      const procedureWithUsedItems: Procedure = {
        ...createMockProcedure('1', 'completed'),
        usedReference: [{
          reference: 'Device/surgical-instrument-1',
          display: 'Laparoscopic camera'
        }],
        usedCode: [{
          text: 'Surgical sutures',
          coding: [{
            system: 'http://snomed.info/sct',
            code: '79068005',
            display: 'Surgical suture'
          }]
        }]
      };

      render(
        <ProcedureViewer
          procedure={procedureWithUsedItems}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Items Used')).toBeInTheDocument();
      expect(screen.getByText('Referenced Items:')).toBeInTheDocument();
      expect(screen.getByText('Laparoscopic camera')).toBeInTheDocument();
      expect(screen.getByText('Coded Items:')).toBeInTheDocument();
      expect(screen.getByText('Surgical sutures')).toBeInTheDocument();
    });
  });
});