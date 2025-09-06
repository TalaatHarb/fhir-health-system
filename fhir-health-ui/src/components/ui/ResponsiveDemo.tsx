import React from 'react';
import { useViewport } from '../../hooks/useViewport';

/**
 * Demo component to showcase the responsive layout system
 * This component demonstrates the viewport detection hook and responsive CSS classes
 */
export const ResponsiveDemo: React.FC = () => {
  const viewport = useViewport();

  return (
    <div className="layout-container full-viewport">
      <div className="layout-content custom-scrollbar">
        <div style={{ padding: '2rem', minHeight: '200vh' }}>
          <h2>Responsive Layout System Demo</h2>
          
          <div style={{ 
            backgroundColor: 'var(--color-surface)', 
            padding: '1.5rem', 
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            marginBottom: '2rem'
          }}>
            <h3>Current Viewport Information</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><strong>Width:</strong> {viewport.width}px</li>
              <li><strong>Height:</strong> {viewport.height}px</li>
              <li><strong>Device Type:</strong> {
                viewport.isMobile ? 'Mobile' : 
                viewport.isTablet ? 'Tablet' : 
                viewport.isDesktop ? 'Desktop' : 'Unknown'
              }</li>
              <li><strong>Is Mobile:</strong> {viewport.isMobile ? 'Yes' : 'No'}</li>
              <li><strong>Is Tablet:</strong> {viewport.isTablet ? 'Yes' : 'No'}</li>
              <li><strong>Is Desktop:</strong> {viewport.isDesktop ? 'Yes' : 'No'}</li>
            </ul>
          </div>

          <div style={{ 
            backgroundColor: 'var(--color-surface)', 
            padding: '1.5rem', 
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            marginBottom: '2rem'
          }}>
            <h3>Responsive Features</h3>
            <ul>
              <li>✅ Full viewport layout without borders</li>
              <li>✅ Custom scrollbar styling for both themes</li>
              <li>✅ Viewport detection hook with breakpoints</li>
              <li>✅ Mobile: &lt; 640px</li>
              <li>✅ Tablet: 640px - 1024px</li>
              <li>✅ Desktop: ≥ 1024px</li>
            </ul>
          </div>

          <div style={{ 
            backgroundColor: 'var(--color-surface)', 
            padding: '1.5rem', 
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            marginBottom: '2rem'
          }}>
            <h3>CSS Classes Available</h3>
            <ul>
              <li><code>.layout-container</code> - Full viewport container</li>
              <li><code>.layout-content</code> - Scrollable content area</li>
              <li><code>.full-viewport</code> - 100vw x 100vh dimensions</li>
              <li><code>.custom-scrollbar</code> - Theme-aware scrollbars</li>
              <li><code>.scrollable-vertical</code> - Vertical scrolling only</li>
              <li><code>.scrollable-horizontal</code> - Horizontal scrolling only</li>
              <li><code>.smooth-scroll</code> - Smooth scrolling behavior</li>
            </ul>
          </div>

          <div style={{ 
            backgroundColor: 'var(--color-surface)', 
            padding: '1.5rem', 
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            marginBottom: '2rem'
          }}>
            <h3>Scroll Test Area</h3>
            <p>This content extends beyond the viewport to test scrolling behavior.</p>
            <div style={{ height: '100px', overflow: 'auto', border: '1px solid var(--color-border)' }}>
              <div style={{ height: '300px', padding: '1rem' }}>
                <p>This is a scrollable area within the main content.</p>
                <p>You should see custom scrollbars here that match the current theme.</p>
                <p>The scrollbars should be:</p>
                <ul>
                  <li>12px wide on desktop</li>
                  <li>8px wide on mobile</li>
                  <li>Themed to match light/dark mode</li>
                  <li>Smooth hover transitions</li>
                </ul>
                <p>Keep scrolling to see more content...</p>
                <p>More content here...</p>
                <p>Even more content...</p>
                <p>Bottom of scrollable area</p>
              </div>
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'var(--color-surface)', 
            padding: '1.5rem', 
            borderRadius: '8px',
            border: '1px solid var(--color-border)'
          }}>
            <h3>Resize Instructions</h3>
            <p>Try resizing your browser window to see the viewport information update in real-time.</p>
            <p>The breakpoints are:</p>
            <ul>
              <li><strong>Mobile:</strong> Width &lt; 640px</li>
              <li><strong>Tablet:</strong> Width 640px - 1023px</li>
              <li><strong>Desktop:</strong> Width ≥ 1024px</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};