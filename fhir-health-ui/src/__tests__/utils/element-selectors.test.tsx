import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  byTestId,
  byRole,
  byLabelText,
  byPlaceholderText,
  byText,
  byRoleInContainer,
  byTextInSection,
  getAllByRoleWithFilter,
  getFirstByRole,
  getNthByRole,
  smartSelect,
  formSelectors,
  listSelectors,
  navigationSelectors,
  debugElements
} from './element-selectors';

// Test component with various elements
const TestComponent: React.FC = () => (
  <div>
    <h1>Test Page</h1>
    
    {/* Form elements */}
    <form>
      <label htmlFor="name-input">Name</label>
      <input 
        id="name-input" 
        data-testid="name-field" 
        placeholder="Enter your name"
        type="text"
      />
      
      <label htmlFor="email-input">Email Address</label>
      <input 
        id="email-input" 
        data-testid="email-field" 
        placeholder="Enter your email"
        type="email"
      />
      
      <button type="submit" data-testid="submit-btn">Submit Form</button>
      <button type="button">Cancel</button>
    </form>
    
    {/* List elements */}
    <ul role="list">
      <li role="listitem">First Item</li>
      <li role="listitem">Second Item</li>
      <li role="listitem">Third Item</li>
    </ul>
    
    {/* Table elements */}
    <table role="table">
      <tbody>
        <tr>
          <td>Cell 1</td>
          <td>Cell 2</td>
        </tr>
        <tr>
          <td>Row 2 Cell 1</td>
          <td>Row 2 Cell 2</td>
        </tr>
      </tbody>
    </table>
    
    {/* Navigation elements */}
    <nav>
      <a href="/home" role="link">Home</a>
      <a href="/about" role="link">About</a>
    </nav>
    
    {/* Section with specific content */}
    <section role="region" aria-label="user-info">
      <p>User information section</p>
      <span>User details here</span>
    </section>
    
    {/* Container for contextual selection */}
    <div data-testid="container">
      <button>Container Button</button>
      <p>Container Text</p>
    </div>
  </div>
);

describe('Element Selectors', () => {
  beforeEach(() => {
    render(<TestComponent />);
  });

  describe('Basic Selectors', () => {
    it('should find element by test-id', () => {
      const element = byTestId('name-field');
      expect(element).toBeInTheDocument();
      expect(element.tagName).toBe('INPUT');
    });

    it('should find element by role', () => {
      const element = byRole('button', { name: 'Submit Form' });
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe('Submit Form');
    });

    it('should find element by label text', () => {
      const element = byLabelText('Name');
      expect(element).toBeInTheDocument();
      expect(element.getAttribute('id')).toBe('name-input');
    });

    it('should find element by placeholder text', () => {
      const element = byPlaceholderText('Enter your name');
      expect(element).toBeInTheDocument();
      expect(element.getAttribute('placeholder')).toBe('Enter your name');
    });

    it('should find element by text content', () => {
      const element = byText('Test Page');
      expect(element).toBeInTheDocument();
      expect(element.tagName).toBe('H1');
    });
  });

  describe('Contextual Selectors', () => {
    it('should find element by role within container', () => {
      const container = byTestId('container');
      const element = byRoleInContainer(container, 'button');
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe('Container Button');
    });

    it('should find element by text within section', () => {
      const element = byTextInSection('user-info', 'User details here');
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe('User details here');
    });
  });

  describe('Multi-element Handlers', () => {
    it('should get all elements by role with filter', () => {
      const buttons = getAllByRoleWithFilter('button', (el) => 
        el.textContent?.includes('Submit') || false
      );
      expect(buttons).toHaveLength(1);
      expect(buttons[0].textContent).toBe('Submit Form');
    });

    it('should get first element by role', () => {
      const firstButton = getFirstByRole('button');
      expect(firstButton).toBeInTheDocument();
      expect(firstButton.textContent).toBe('Submit Form');
    });

    it('should get nth element by role', () => {
      const secondButton = getNthByRole('button', 1);
      expect(secondButton).toBeInTheDocument();
      expect(secondButton.textContent).toBe('Cancel');
    });

    it('should throw error when nth element does not exist', () => {
      expect(() => getNthByRole('button', 5)).toThrow();
    });
  });

  describe('Smart Selector', () => {
    it('should find element using test-id (highest priority)', () => {
      const element = smartSelect({
        testId: 'name-field',
        text: 'Wrong Text',
        role: { role: 'wrong-role' }
      });
      expect(element).toBeInTheDocument();
      expect(element.getAttribute('data-testid')).toBe('name-field');
    });

    it('should fallback to role when test-id not found', () => {
      const element = smartSelect({
        testId: 'non-existent',
        role: { role: 'button', options: { name: 'Submit Form' } }
      });
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe('Submit Form');
    });

    it('should fallback to text when other selectors fail', () => {
      const element = smartSelect({
        testId: 'non-existent',
        role: { role: 'non-existent' },
        text: 'Test Page'
      });
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe('Test Page');
    });

    it('should throw error when no selectors match', () => {
      expect(() => smartSelect({
        testId: 'non-existent',
        text: 'Non-existent text'
      })).toThrow();
    });
  });

  describe('Form Selectors', () => {
    it('should find input by label', () => {
      const element = formSelectors.getInput('Name');
      expect(element).toBeInTheDocument();
      expect(element.getAttribute('id')).toBe('name-input');
    });

    it('should find button by text', () => {
      const element = formSelectors.getButton('Submit Form');
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe('Submit Form');
    });

    it('should find button by regex', () => {
      const element = formSelectors.getButton(/submit/i);
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe('Submit Form');
    });
  });

  describe('List Selectors', () => {
    it('should find list item by text', () => {
      const element = listSelectors.getListItem('First Item');
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe('First Item');
    });

    it('should find table cell by text', () => {
      const element = listSelectors.getCell('Cell 1');
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe('Cell 1');
    });

    it('should find table row containing text', () => {
      const element = listSelectors.getRowWithText('Row 2');
      expect(element).toBeInTheDocument();
      expect(element.textContent).toContain('Row 2 Cell 1');
    });

    it('should find table row with regex', () => {
      const element = listSelectors.getRowWithText(/Row 2/);
      expect(element).toBeInTheDocument();
      expect(element.textContent).toContain('Row 2 Cell 1');
    });
  });

  describe('Navigation Selectors', () => {
    it('should find navigation link by text', () => {
      const element = navigationSelectors.getNavLink('Home');
      expect(element).toBeInTheDocument();
      expect(element.getAttribute('href')).toBe('/home');
    });

    it('should find navigation link by regex', () => {
      const element = navigationSelectors.getNavLink(/about/i);
      expect(element).toBeInTheDocument();
      expect(element.getAttribute('href')).toBe('/about');
    });
  });

  describe('Debug Utilities', () => {
    it('should not throw when debugging elements', () => {
      expect(() => debugElements()).not.toThrow();
    });

    it('should not throw when debugging container elements', () => {
      const container = byTestId('container');
      expect(() => debugElements(container)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should throw descriptive error for missing test-id', () => {
      expect(() => byTestId('non-existent')).toThrow();
    });

    it('should throw descriptive error for missing role', () => {
      expect(() => byRole('non-existent-role')).toThrow();
    });

    it('should throw descriptive error for missing text', () => {
      expect(() => byText('Non-existent text')).toThrow();
    });
  });
});