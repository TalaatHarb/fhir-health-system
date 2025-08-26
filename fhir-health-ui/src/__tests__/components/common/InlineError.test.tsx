import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InlineError, FieldError, ErrorList } from '../../../components/common/InlineError';

describe('InlineError', () => {
  it('renders error message when error is provided', () => {
    render(<InlineError error="Test error message" />);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not render when error is null or undefined', () => {
    const { container: container1 } = render(<InlineError error={null} />);
    const { container: container2 } = render(<InlineError error={undefined} />);

    expect(container1.firstChild).toBeNull();
    expect(container2.firstChild).toBeNull();
  });

  it('does not render when show is false', () => {
    const { container } = render(<InlineError error="Test error" show={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders with correct size classes', () => {
    const { rerender } = render(<InlineError error="Test error" size="small" />);
    expect(screen.getByRole('alert')).toHaveClass('inline-error--small');

    rerender(<InlineError error="Test error" size="medium" />);
    expect(screen.getByRole('alert')).toHaveClass('inline-error--medium');

    rerender(<InlineError error="Test error" size="large" />);
    expect(screen.getByRole('alert')).toHaveClass('inline-error--large');
  });

  it('renders icon by default', () => {
    render(<InlineError error="Test error" />);

    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('does not render icon when icon is false', () => {
    render(<InlineError error="Test error" icon={false} />);

    expect(screen.queryByText('⚠')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<InlineError error="Test error" className="custom-class" />);

    expect(screen.getByRole('alert')).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(<InlineError error="Test error" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });
});

describe('FieldError', () => {
  const errors = {
    username: 'Username is required',
    email: 'Invalid email format',
    password: 'Password too short',
  };

  const touched = {
    username: true,
    email: false,
    password: true,
  };

  it('renders error for touched field', () => {
    render(<FieldError fieldName="username" errors={errors} touched={touched} />);

    expect(screen.getByText('Username is required')).toBeInTheDocument();
  });

  it('does not render error for untouched field by default', () => {
    const { container } = render(<FieldError fieldName="email" errors={errors} touched={touched} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders error for untouched field when showUntouched is true', () => {
    render(<FieldError fieldName="email" errors={errors} touched={touched} showUntouched />);

    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });

  it('does not render when field has no error', () => {
    const { container } = render(<FieldError fieldName="nonexistent" errors={errors} touched={touched} />);

    expect(container.firstChild).toBeNull();
  });

  it('works without touched object', () => {
    render(<FieldError fieldName="username" errors={errors} showUntouched />);

    expect(screen.getByText('Username is required')).toBeInTheDocument();
  });
});

describe('ErrorList', () => {
  const errorArray = [
    'Username is required',
    'Email is invalid',
    'Password is too short',
  ];

  const errorObject = {
    username: 'Username is required',
    email: 'Email is invalid',
    password: 'Password is too short',
  };

  it('renders error list from array', () => {
    render(<ErrorList errors={errorArray} />);

    expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Email is invalid')).toBeInTheDocument();
    expect(screen.getByText('Password is too short')).toBeInTheDocument();
  });

  it('renders error list from object', () => {
    render(<ErrorList errors={errorObject} />);

    expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Email is invalid')).toBeInTheDocument();
    expect(screen.getByText('Password is too short')).toBeInTheDocument();
  });

  it('does not render when no errors', () => {
    const { container } = render(<ErrorList errors={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders custom title', () => {
    render(<ErrorList errors={errorArray} title="Custom error title:" />);

    expect(screen.getByText('Custom error title:')).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    render(<ErrorList errors={errorArray} title="" />);

    expect(screen.queryByText('Please fix the following errors:')).not.toBeInTheDocument();
  });

  it('limits number of displayed errors', () => {
    render(<ErrorList errors={errorArray} maxErrors={2} />);

    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Email is invalid')).toBeInTheDocument();
    expect(screen.queryByText('Password is too short')).not.toBeInTheDocument();
    expect(screen.getByText('... and 1 more error')).toBeInTheDocument();
  });

  it('shows correct plural form for multiple remaining errors', () => {
    const manyErrors = Array.from({ length: 10 }, (_, i) => `Error ${i + 1}`);
    
    render(<ErrorList errors={manyErrors} maxErrors={2} />);

    expect(screen.getByText('... and 8 more errors')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ErrorList errors={errorArray} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('applies custom className', () => {
    render(<ErrorList errors={errorArray} className="custom-error-list" />);

    expect(screen.getByRole('alert')).toHaveClass('custom-error-list');
  });

  it('filters out empty errors from object', () => {
    const errorsWithEmpty = {
      username: 'Username is required',
      email: '', // Empty error
      password: null, // Null error
      phone: 'Phone is invalid',
    };

    render(<ErrorList errors={errorsWithEmpty} />);

    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Phone is invalid')).toBeInTheDocument();
    expect(screen.queryByText('')).not.toBeInTheDocument();
  });
});