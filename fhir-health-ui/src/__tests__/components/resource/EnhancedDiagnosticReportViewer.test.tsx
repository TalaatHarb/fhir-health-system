import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { DiagnosticReportViewer } from '../../../components/resource/DiagnosticReportViewer';
import type { DiagnosticReport } from '../../../types/fhir';

const createMockDiagnosticReport = (
  id: string,
  status: string = 'final',
  hasConclusion: boolean = true
): DiagnosticReport => ({
  resourceType: 'DiagnosticReport',
  id,
  status: status as any,
  code: {
    text: 'Complete Blood Count',
    coding: [{
      system: 'http://loinc.org',
      code: '58410-2',
      display: 'Complete blood count (hemogram) panel - Blood by Automated count'
    }]
  },
  subject: {
    reference: 'Patient/123'
  },
  effectiveDateTime: '2024-01-15T10:30:00Z',
  issued: '2024-01-15T14:30:00Z',
  performer: [{
    reference: 'Practitioner/dr-smith',
    display: 'Dr. John Smith'
  }],
  resultsInterpreter: [{
    reference: 'Practitioner/dr-jones',
    display: 'Dr. Sarah Jones'
  }],
  result: [
    {
      reference: 'Observation/hemoglobin-1',
      display: 'Hemoglobin 12.5 g/dL'
    },
    {
      reference: 'Observation/hematocrit-1',
      display: 'Hematocrit 38%'
    },
    {
      reference: 'Observation/wbc-1',
      display: 'White Blood Cell Count 7.2 K/uL'
    }
  ],
  conclusion: hasConclusion ? 'Complete blood count shows mild anemia. Recommend iron supplementation and follow-up in 3 months.' : undefined,
  conclusionCode: hasConclusion ? [{
    text: 'Mild anemia',
    coding: [{
      system: 'http://snomed.info/sct',
      code: '271737000',
      display: 'Anemia'
    }]
  }] : undefined,
  media: [{
    comment: 'Blood smear microscopy',
    link: {
      reference: 'Media/blood-smear-1',
      display: 'Blood smear image'
    }
  }]
});

describe('Enhanced DiagnosticReportViewer', () => {
  describe('Structured Report Display', () => {
    it('renders structured report layout with metadata and content sections', () => {
      const report = createMockDiagnosticReport('1');

      render(
        <DiagnosticReportViewer 
          diagnosticReport={report}
          viewMode="detailed"
        />
      );

      // Check for structured layout
      const structuredLayout = screen.getByText('Report Status').closest('.diagnostic-report-structure');
      expect(structuredLayout).toBeInTheDocument();
      
      // Check metadata section
      expect(screen.getByText('Report Status')).toBeInTheDocument();
      expect(screen.getByText('Performed By')).toBeInTheDocument();
      expect(screen.getByText('Results Summary')).toBeInTheDocument();
      
      // Check content section
      expect(screen.getByText('Clinical Conclusion')).toBeInTheDocument();
    });

    it('renders status card with appropriate styling for final status', () => {
      const report = createMockDiagnosticReport('1', 'final');

      render(
        <DiagnosticReportViewer 
          diagnosticReport={report}
          viewMode="detailed"
        />
      );

      const statusCard = screen.getByText('Report Status').closest('.report-status-card');
      expect(statusCard).toHaveClass('final');
      
      const statusIndicator = screen.getByText('Final');
      expect(statusIndicator).toHaveClass('status-final');
    });

    it('renders status card with appropriate styling for preliminary status', () => {
      const report = createMockDiagnosticReport('1', 'preliminary');

      render(
        <DiagnosticReportViewer 
          diagnosticReport={report}
          viewMode="detailed"
        />
      );

      const statusCard = screen.getByText('Report Status').closest('.report-status-card');
      expect(statusCard).toHaveClass('preliminary');
      
      const statusIndicator = screen.getByText('Preliminary');
      expect(statusIndicator).toHaveClass('status-preliminary');
    });

    it('renders status card with appropriate styling for cancelled status', () => {
      const report = createMockDiagnosticReport('1', 'cancelled');

      render(
        <DiagnosticReportViewer 
          diagnosticReport={report}
          viewMode="detailed"
        />
      );

      const statusCard = screen.getByText('Report Status').closest('.report-status-card');
      expect(statusCard).toHaveClass('cancelled');
      
      const statusIndicator = screen.getByText('Cancelled');
      expect(statusIndicator).toHaveClass('status-cancelled');
    });
  });

  describe('Enhanced Conclusion Display', () => {
    it('renders conclusion in highlighted section', () => {
      const report = createMockDiagnosticReport('1');

      render(
        <DiagnosticReportViewer 
          diagnosticReport={report}
          viewMode="detailed"
        />
      );

      const conclusionHighlight = screen.getByText('Clinical Conclusion').closest('.report-conclusion-highlight');
      expect(conclusionHighlight).toBeInTheDocument();
      
      expect(screen.getByText('Complete blood count shows mild anemia. Recommend iron supplementation and follow-up in 3 months.')).toBeInTheDocument();
    });

    it('renders conclusion codes separately', () => {
      const report = createMockDiagnosticReport('1');

      render(
        <DiagnosticReportViewer 
          diagnosticReport={report}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Conclusion Codes')).toBeInTheDocument();
      expect(screen.getByText('Mild anemia')).toBeInTheDocument();
      expect(screen.getByText('http://snomed.info/sct#271737000')).toBeInTheDocument();
    });

    it('does not render conclusion section when no conclusion', () => {
      const report = createMockDiagnosticReport('1', 'final', false);

      render(
        <DiagnosticReportViewer 
          diagnosticReport={report}
          viewMode="detailed"
        />
      );

      expect(screen.queryByText('Clinical Conclusion')).not.toBeInTheDocument();
      expect(screen.queryByText('Conclusion Codes')).not.toBeInTheDocument();
    });
  });

  describe('Performers Display', () => {
    it('renders performers in metadata section', () => {
      const report = createMockDiagnosticReport('1');

      render(
        <DiagnosticReportViewer 
          diagnosticReport={report}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Performed By')).toBeInTheDocument();
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Sarah Jones')).toBeInTheDocument();
    });

    it('does not render performers section when no performers', () => {
      const reportWithoutPerformers: DiagnosticReport = {
        ...createMockDiagnosticReport('1'),
        performer: undefined,
        resultsInterpreter: undefined
      };

      render(
        <DiagnosticReportViewer 
          diagnosticReport={reportWithoutPerformers}
          viewMode="detailed"
        />
      );

      expect(screen.queryByText('Performed By')).not.toBeInTheDocument();
    });
  });

  describe('Results Summary', () => {
    it('renders results summary with count', () => {
      const report = createMockDiagnosticReport('1');

      render(
        <DiagnosticReportViewer 
          diagnosticReport={report}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Results Summary')).toBeInTheDocument();
      expect(screen.getByText('3 results available')).toBeInTheDocument();
      expect(screen.getByText('1 media item')).toBeInTheDocument();
    });

    it('handles plural forms correctly', () => {
      const singleResultReport: DiagnosticReport = {
        ...createMockDiagnosticReport('1'),
        result: [{
          reference: 'Observation/hemoglobin-1',
          display: 'Hemoglobin 12.5 g/dL'
        }],
        media: undefined
      };

      render(
        <DiagnosticReportViewer 
          diagnosticReport={singleResultReport}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('1 result available')).toBeInTheDocument();
      expect(screen.queryByText('media item')).not.toBeInTheDocument();
    });
  });

  describe('Media Display', () => {
    it('renders media items with comments', () => {
      const report = createMockDiagnosticReport('1');

      render(
        <DiagnosticReportViewer 
          diagnosticReport={report}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Media (1)')).toBeInTheDocument();
      expect(screen.getByText('Blood smear image')).toBeInTheDocument();
      expect(screen.getByText('Blood smear microscopy')).toBeInTheDocument();
    });
  });

  describe('Presented Forms', () => {
    it('renders presented forms with download links', () => {
      const reportWithForms: DiagnosticReport = {
        ...createMockDiagnosticReport('1'),
        presentedForm: [{
          contentType: 'application/pdf',
          title: 'Complete Blood Count Report',
          size: 245760,
          creation: '2024-01-15T14:30:00Z',
          url: 'https://example.com/reports/cbc-report.pdf'
        }]
      };

      render(
        <DiagnosticReportViewer 
          diagnosticReport={reportWithForms}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Presented Forms')).toBeInTheDocument();
      expect(screen.getByText('Complete Blood Count Report')).toBeInTheDocument();
      expect(screen.getByText('Type: application/pdf')).toBeInTheDocument();
      expect(screen.getByText('Size: 245760 bytes')).toBeInTheDocument();
      
      const downloadLink = screen.getByText('View Document');
      expect(downloadLink).toBeInTheDocument();
      expect(downloadLink).toHaveAttribute('href', 'https://example.com/reports/cbc-report.pdf');
      expect(downloadLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Summary View Enhancements', () => {
    it('shows conclusion preview in summary view', () => {
      const report = createMockDiagnosticReport('1');

      render(
        <DiagnosticReportViewer 
          diagnosticReport={report}
          viewMode="summary"
        />
      );

      const conclusionPreview = screen.getByText(/Complete blood count shows mild anemia/).closest('.report-summary-conclusion');
      expect(conclusionPreview).toBeInTheDocument();
    });

    it('truncates long conclusions in summary view', () => {
      const longConclusionReport: DiagnosticReport = {
        ...createMockDiagnosticReport('1'),
        conclusion: 'This is a very long conclusion that should be truncated in the summary view because it exceeds the maximum length that we want to display in the summary format and should show ellipsis.'
      };

      render(
        <DiagnosticReportViewer 
          diagnosticReport={longConclusionReport}
          viewMode="summary"
        />
      );

      expect(screen.getByText(/This is a very long conclusion.*\.\.\./)).toBeInTheDocument();
    });

    it('shows result count in summary view', () => {
      const report = createMockDiagnosticReport('1');

      render(
        <DiagnosticReportViewer 
          diagnosticReport={report}
          viewMode="summary"
        />
      );

      expect(screen.getByText(/3 results/)).toBeInTheDocument();
    });

    it('does not show conclusion preview when no conclusion', () => {
      const report = createMockDiagnosticReport('1', 'final', false);

      render(
        <DiagnosticReportViewer 
          diagnosticReport={report}
          viewMode="summary"
        />
      );

      expect(screen.queryByText(/Conclusion:/)).not.toBeInTheDocument();
    });
  });

  describe('Effective Period Display', () => {
    it('renders effective period when available', () => {
      const reportWithPeriod: DiagnosticReport = {
        ...createMockDiagnosticReport('1'),
        effectiveDateTime: undefined,
        effectivePeriod: {
          start: '2024-01-15T08:00:00Z',
          end: '2024-01-15T12:00:00Z'
        }
      };

      render(
        <DiagnosticReportViewer 
          diagnosticReport={reportWithPeriod}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Effective Period')).toBeInTheDocument();
      expect(screen.getByText('Start:')).toBeInTheDocument();
      expect(screen.getByText('End:')).toBeInTheDocument();
    });
  });
});