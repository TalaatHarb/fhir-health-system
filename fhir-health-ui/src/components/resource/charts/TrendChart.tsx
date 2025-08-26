import React from 'react';
import type { Observation } from '../../../types/fhir';
import './TrendChart.css';

export interface TrendChartProps {
  observations: Observation[];
  title?: string;
  height?: number;
  showReferenceRange?: boolean;
}

interface DataPoint {
  date: Date;
  value: number;
  unit?: string;
  interpretation?: string;
}

export function TrendChart({ 
  observations, 
  title = 'Trend Chart',
  height = 200,
  showReferenceRange = true
}: TrendChartProps): React.JSX.Element {

  // Extract data points from observations
  const getDataPoints = (): DataPoint[] => {
    return observations
      .filter(obs => obs.valueQuantity?.value !== undefined)
      .map(obs => ({
        date: new Date(obs.effectiveDateTime || obs.effectivePeriod?.start || Date.now()),
        value: obs.valueQuantity!.value!,
        unit: obs.valueQuantity!.unit || obs.valueQuantity!.code,
        interpretation: obs.interpretation?.[0]?.coding?.[0]?.code
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Get reference range from the most recent observation
  const getReferenceRange = () => {
    const latestObs = observations
      .filter(obs => obs.referenceRange?.[0])
      .sort((a, b) => {
        const dateA = new Date(a.effectiveDateTime || a.effectivePeriod?.start || 0);
        const dateB = new Date(b.effectiveDateTime || b.effectivePeriod?.start || 0);
        return dateB.getTime() - dateA.getTime();
      })[0];

    if (!latestObs?.referenceRange?.[0]) return null;

    const range = latestObs.referenceRange[0];
    return {
      low: range.low?.value,
      high: range.high?.value,
      unit: range.low?.unit || range.high?.unit
    };
  };

  const dataPoints = getDataPoints();
  const referenceRange = getReferenceRange();

  if (dataPoints.length === 0) {
    return (
      <div className="trend-chart-container">
        <div className="trend-chart-header">
          <h6>{title}</h6>
        </div>
        <div className="trend-chart-empty">
          <p>No numeric data available for trending</p>
        </div>
      </div>
    );
  }

  // Calculate chart dimensions and scales
  const values = dataPoints.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Extend range to include reference range if available
  let chartMin = minValue;
  let chartMax = maxValue;
  
  if (referenceRange && showReferenceRange) {
    if (referenceRange.low !== undefined) {
      chartMin = Math.min(chartMin, referenceRange.low);
    }
    if (referenceRange.high !== undefined) {
      chartMax = Math.max(chartMax, referenceRange.high);
    }
  }

  // Add padding to the range
  const range = chartMax - chartMin;
  const padding = range * 0.1;
  chartMin -= padding;
  chartMax += padding;

  const chartWidth = 400;
  const chartHeight = height - 60; // Account for header and labels

  // Scale functions
  const scaleX = (date: Date) => {
    const minTime = dataPoints[0].date.getTime();
    const maxTime = dataPoints[dataPoints.length - 1].date.getTime();
    const timeRange = maxTime - minTime || 1;
    return ((date.getTime() - minTime) / timeRange) * chartWidth;
  };

  const scaleY = (value: number) => {
    return chartHeight - ((value - chartMin) / (chartMax - chartMin)) * chartHeight;
  };

  // Generate path for the trend line
  const generatePath = () => {
    if (dataPoints.length < 2) return '';
    
    let path = `M ${scaleX(dataPoints[0].date)} ${scaleY(dataPoints[0].value)}`;
    
    for (let i = 1; i < dataPoints.length; i++) {
      path += ` L ${scaleX(dataPoints[i].date)} ${scaleY(dataPoints[i].value)}`;
    }
    
    return path;
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  // Format value for display
  const formatValue = (value: number, unit?: string) => {
    return `${value.toFixed(1)}${unit ? ` ${unit}` : ''}`;
  };

  // Get interpretation color
  const getInterpretationColor = (interpretation?: string) => {
    switch (interpretation?.toLowerCase()) {
      case 'h':
      case 'high':
        return '#f59e0b';
      case 'l':
      case 'low':
        return '#3b82f6';
      case 'hh':
      case 'critical-high':
      case 'panic':
        return '#dc2626';
      case 'll':
      case 'critical-low':
        return '#dc2626';
      default:
        return '#10b981';
    }
  };

  return (
    <div className="trend-chart-container">
      <div className="trend-chart-header">
        <h6>{title}</h6>
        <div className="trend-chart-summary">
          <span className="trend-latest">
            Latest: {formatValue(dataPoints[dataPoints.length - 1].value, dataPoints[dataPoints.length - 1].unit)}
          </span>
          {referenceRange && (
            <span className="trend-reference">
              Normal: {referenceRange.low !== undefined ? `${referenceRange.low}` : ''}
              {referenceRange.low !== undefined && referenceRange.high !== undefined ? '-' : ''}
              {referenceRange.high !== undefined ? `${referenceRange.high}` : ''}
              {referenceRange.unit ? ` ${referenceRange.unit}` : ''}
            </span>
          )}
        </div>
      </div>
      
      <div className="trend-chart" style={{ height: `${height}px` }}>
        <svg width={chartWidth} height={chartHeight} className="trend-chart-svg">
          {/* Reference range bands */}
          {referenceRange && showReferenceRange && (
            <>
              {referenceRange.low !== undefined && referenceRange.high !== undefined && (
                <rect
                  x={0}
                  y={scaleY(referenceRange.high)}
                  width={chartWidth}
                  height={scaleY(referenceRange.low) - scaleY(referenceRange.high)}
                  fill="#10b981"
                  fillOpacity={0.1}
                  className="reference-range-band"
                />
              )}
              {referenceRange.low !== undefined && (
                <line
                  x1={0}
                  y1={scaleY(referenceRange.low)}
                  x2={chartWidth}
                  y2={scaleY(referenceRange.low)}
                  stroke="#10b981"
                  strokeWidth={1}
                  strokeDasharray="4,4"
                  className="reference-line"
                />
              )}
              {referenceRange.high !== undefined && (
                <line
                  x1={0}
                  y1={scaleY(referenceRange.high)}
                  x2={chartWidth}
                  y2={scaleY(referenceRange.high)}
                  stroke="#10b981"
                  strokeWidth={1}
                  strokeDasharray="4,4"
                  className="reference-line"
                />
              )}
            </>
          )}
          
          {/* Trend line */}
          {dataPoints.length > 1 && (
            <path
              d={generatePath()}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
              className="trend-line"
            />
          )}
          
          {/* Data points */}
          {dataPoints.map((point, index) => (
            <g key={index}>
              <circle
                cx={scaleX(point.date)}
                cy={scaleY(point.value)}
                r={4}
                fill={getInterpretationColor(point.interpretation)}
                stroke="#ffffff"
                strokeWidth={2}
                className="data-point"
              />
              
              {/* Tooltip on hover */}
              <circle
                cx={scaleX(point.date)}
                cy={scaleY(point.value)}
                r={8}
                fill="transparent"
                className="data-point-hover"
                data-tooltip={`${formatDate(point.date)}: ${formatValue(point.value, point.unit)}`}
              />
            </g>
          ))}
        </svg>
        
        {/* X-axis labels */}
        <div className="trend-chart-x-axis">
          {dataPoints.map((point, index) => {
            // Show labels for first, last, and some intermediate points
            const showLabel = index === 0 || 
                            index === dataPoints.length - 1 || 
                            (dataPoints.length > 4 && index === Math.floor(dataPoints.length / 2));
            
            if (!showLabel) return null;
            
            return (
              <div
                key={index}
                className="x-axis-label"
                style={{ left: `${(scaleX(point.date) / chartWidth) * 100}%` }}
              >
                {formatDate(point.date)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}