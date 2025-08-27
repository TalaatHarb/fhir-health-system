import { screen, within, ByRoleOptions } from '@testing-library/react';

/**
 * Priority-based element selection utilities for testing
 * Follows the testing library best practices with fallback strategies
 */

export interface ElementSelectorOptions {
  container?: HTMLElement;
  timeout?: number;
  exact?: boolean;
  normalizer?: (text: string) => string;
}

export interface MultiElementOptions extends ElementSelectorOptions {
  index?: number;
  filter?: (element: HTMLElement) => boolean;
}

/**
 * High-priority selector: Find element by test-id
 */
export const byTestId = (testId: string, options: ElementSelectorOptions = {}): HTMLElement => {
  const { container } = options;
  const query = container ? within(container) : screen;
  return query.getByTestId(testId);
};

/**
 * High-priority selector: Find element by role with enhanced options
 */
export const byRole = (
  role: string, 
  options: ByRoleOptions & ElementSelectorOptions = {}
): HTMLElement => {
  const { container, ...roleOptions } = options;
  const query = container ? within(container) : screen;
  return query.getByRole(role, roleOptions);
};

/**
 * Medium-priority selector: Find element by accessible label
 */
export const byLabelText = (
  text: string | RegExp, 
  options: ElementSelectorOptions = {}
): HTMLElement => {
  const { container, exact = false } = options;
  const query = container ? within(container) : screen;
  return query.getByLabelText(text, { exact });
};

/**
 * Medium-priority selector: Find element by placeholder text
 */
export const byPlaceholderText = (
  text: string | RegExp, 
  options: ElementSelectorOptions = {}
): HTMLElement => {
  const { container, exact = false } = options;
  const query = container ? within(container) : screen;
  return query.getByPlaceholderText(text, { exact });
};

/**
 * Lower-priority selector: Find element by text content
 */
export const byText = (
  text: string | RegExp, 
  options: ElementSelectorOptions = {}
): HTMLElement => {
  const { container, exact = false } = options;
  const query = container ? within(container) : screen;
  return query.getByText(text, { exact });
};

/**
 * Contextual selector: Find element by role within a specific container
 */
export const byRoleInContainer = (
  container: HTMLElement,
  role: string,
  options: ByRoleOptions = {}
): HTMLElement => {
  return within(container).getByRole(role, options);
};

/**
 * Contextual selector: Find element by text within a specific section
 */
export const byTextInSection = (
  sectionName: string,
  text: string | RegExp,
  options: ElementSelectorOptions = {}
): HTMLElement => {
  const section = screen.getByRole('region', { name: sectionName }) || 
                  screen.getByLabelText(sectionName) ||
                  screen.getByTestId(sectionName);
  
  return within(section).getByText(text, { exact: options.exact });
};

/**
 * Multi-element handler: Get all elements by role with optional filtering
 */
export const getAllByRoleWithFilter = (
  role: string,
  filter?: (element: HTMLElement) => boolean,
  options: MultiElementOptions = {}
): HTMLElement[] => {
  const { container } = options;
  const query = container ? within(container) : screen;
  const elements = query.getAllByRole(role);
  
  return filter ? elements.filter(filter) : elements;
};

/**
 * Multi-element handler: Get first element by role
 */
export const getFirstByRole = (
  role: string,
  options: ByRoleOptions & ElementSelectorOptions = {}
): HTMLElement => {
  const { container, ...roleOptions } = options;
  const query = container ? within(container) : screen;
  const elements = query.getAllByRole(role, roleOptions);
  
  if (elements.length === 0) {
    throw new Error(`No elements found with role "${role}"`);
  }
  
  return elements[0];
};

/**
 * Multi-element handler: Get nth element by role (0-indexed)
 */
export const getNthByRole = (
  role: string,
  index: number,
  options: ByRoleOptions & ElementSelectorOptions = {}
): HTMLElement => {
  const { container, ...roleOptions } = options;
  const query = container ? within(container) : screen;
  const elements = query.getAllByRole(role, roleOptions);
  
  if (elements.length <= index) {
    throw new Error(`Only ${elements.length} elements found with role "${role}", cannot get index ${index}`);
  }
  
  return elements[index];
};

/**
 * Smart selector: Attempts multiple selection strategies in priority order
 */
export const smartSelect = (
  selectors: {
    testId?: string;
    role?: { role: string; options?: ByRoleOptions };
    label?: string | RegExp;
    placeholder?: string | RegExp;
    text?: string | RegExp;
  },
  options: ElementSelectorOptions = {}
): HTMLElement => {
  const { container } = options;
  
  // Try test-id first (highest priority)
  if (selectors.testId) {
    try {
      return byTestId(selectors.testId, { container });
    } catch {
      // Continue to next strategy
    }
  }
  
  // Try role second
  if (selectors.role) {
    try {
      return byRole(selectors.role.role, { ...selectors.role.options, container });
    } catch {
      // Continue to next strategy
    }
  }
  
  // Try label third
  if (selectors.label) {
    try {
      return byLabelText(selectors.label, { container });
    } catch {
      // Continue to next strategy
    }
  }
  
  // Try placeholder fourth
  if (selectors.placeholder) {
    try {
      return byPlaceholderText(selectors.placeholder, { container });
    } catch {
      // Continue to next strategy
    }
  }
  
  // Try text last (lowest priority)
  if (selectors.text) {
    try {
      return byText(selectors.text, { container });
    } catch {
      // Continue to next strategy
    }
  }
  
  throw new Error(`Could not find element with any of the provided selectors: ${JSON.stringify(selectors)}`);
};

/**
 * Form-specific selectors for common form interactions
 */
export const formSelectors = {
  /**
   * Find form input by label, with fallback to placeholder and name
   */
  getInput: (identifier: string, options: ElementSelectorOptions = {}): HTMLElement => {
    return smartSelect({
      label: new RegExp(identifier, 'i'),
      placeholder: new RegExp(identifier, 'i'),
      role: { role: 'textbox', options: { name: new RegExp(identifier, 'i') } }
    }, options);
  },

  /**
   * Find button by text or accessible name
   */
  getButton: (text: string | RegExp, options: ElementSelectorOptions = {}): HTMLElement => {
    return smartSelect({
      role: { role: 'button', options: { name: text } },
      text: text
    }, options);
  },

  /**
   * Find select/combobox by label
   */
  getSelect: (label: string | RegExp, options: ElementSelectorOptions = {}): HTMLElement => {
    return smartSelect({
      label: label,
      role: { role: 'combobox', options: { name: label } }
    }, options);
  },

  /**
   * Find checkbox by label
   */
  getCheckbox: (label: string | RegExp, options: ElementSelectorOptions = {}): HTMLElement => {
    return smartSelect({
      label: label,
      role: { role: 'checkbox', options: { name: label } }
    }, options);
  }
};

/**
 * List-specific selectors for handling lists and tables
 */
export const listSelectors = {
  /**
   * Find list item by text content
   */
  getListItem: (text: string | RegExp, options: ElementSelectorOptions = {}): HTMLElement => {
    return smartSelect({
      role: { role: 'listitem', options: { name: text } },
      text: text
    }, options);
  },

  /**
   * Find table cell by text content
   */
  getCell: (text: string | RegExp, options: ElementSelectorOptions = {}): HTMLElement => {
    const { container } = options;
    const query = container ? within(container) : screen;
    
    // Try to find by role first, then fallback to text within table context
    try {
      return query.getByRole('cell', { name: text });
    } catch {
      try {
        return query.getByRole('gridcell', { name: text });
      } catch {
        // Fallback to finding td/th elements with matching text
        const cells = query.getAllByText(text);
        const tableCell = cells.find(cell => 
          cell.tagName.toLowerCase() === 'td' || cell.tagName.toLowerCase() === 'th'
        );
        if (tableCell) {
          return tableCell;
        }
        throw new Error(`No table cell found with text: ${text}`);
      }
    }
  },

  /**
   * Find table row containing specific text
   */
  getRowWithText: (text: string | RegExp, options: ElementSelectorOptions = {}): HTMLElement => {
    const { container } = options;
    const query = container ? within(container) : screen;
    const rows = query.getAllByRole('row');
    
    const matchingRow = rows.find(row => {
      const rowText = row.textContent || '';
      if (typeof text === 'string') {
        return rowText.includes(text);
      } else {
        return text.test(rowText);
      }
    });
    
    if (!matchingRow) {
      throw new Error(`No row found containing text: ${text}`);
    }
    
    return matchingRow;
  }
};

/**
 * Navigation-specific selectors
 */
export const navigationSelectors = {
  /**
   * Find navigation link by text or accessible name
   */
  getNavLink: (text: string | RegExp, options: ElementSelectorOptions = {}): HTMLElement => {
    return smartSelect({
      role: { role: 'link', options: { name: text } },
      text: text
    }, options);
  },

  /**
   * Find tab by name
   */
  getTab: (name: string | RegExp, options: ElementSelectorOptions = {}): HTMLElement => {
    return smartSelect({
      role: { role: 'tab', options: { name: name } },
      text: name
    }, options);
  },

  /**
   * Find tab panel by name
   */
  getTabPanel: (name: string | RegExp, options: ElementSelectorOptions = {}): HTMLElement => {
    return smartSelect({
      role: { role: 'tabpanel', options: { name: name } }
    }, options);
  }
};

/**
 * Debugging utility: Log all available elements with their roles and accessible names
 */
export const debugElements = (container?: HTMLElement): void => {
  const query = container ? within(container) : screen;
  
  console.group('🔍 Available Elements Debug Info');
  
  try {
    const allElements = container ? 
      container.querySelectorAll('*') : 
      document.querySelectorAll('*');
    
    Array.from(allElements).forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      const role = htmlElement.getAttribute('role') || 'no role';
      const testId = htmlElement.getAttribute('data-testid') || 'no test-id';
      const ariaLabel = htmlElement.getAttribute('aria-label') || 'no aria-label';
      const textContent = htmlElement.textContent?.trim().substring(0, 50) || 'no text';
      
      console.log(`${index}: ${htmlElement.tagName.toLowerCase()} | role: ${role} | test-id: ${testId} | aria-label: ${ariaLabel} | text: "${textContent}"`);
    });
  } catch (error) {
    console.error('Error debugging elements:', error);
  }
  
  console.groupEnd();
};