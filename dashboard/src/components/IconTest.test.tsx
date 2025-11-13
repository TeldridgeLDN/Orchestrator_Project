/**
 * Icon Test Component - Unit Tests
 * 
 * Automated tests to verify icon system functionality
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IconTest from './IconTest';

describe('IconTest Component', () => {
  it('renders without crashing', () => {
    render(<IconTest />);
    expect(screen.getByText('Icon System Test')).toBeInTheDocument();
  });

  it('renders all section headers', () => {
    render(<IconTest />);
    
    expect(screen.getByText('1. Hero Section')).toBeInTheDocument();
    expect(screen.getByText('2. Discovery Section')).toBeInTheDocument();
    expect(screen.getByText('3. Trust Indicators')).toBeInTheDocument();
    expect(screen.getByText('4. Benefits/Features')).toBeInTheDocument();
    expect(screen.getByText('5. Credibility Section')).toBeInTheDocument();
    expect(screen.getByText('6. Final CTA Section')).toBeInTheDocument();
    expect(screen.getByText('7. Interactive States')).toBeInTheDocument();
    expect(screen.getByText('8. Hover & Transitions')).toBeInTheDocument();
  });

  it('all icons have proper accessibility attributes', () => {
    render(<IconTest />);
    
    // Check for aria-label attributes
    const compassIcon = screen.getByLabelText('Discovery compass icon');
    expect(compassIcon).toBeInTheDocument();
    expect(compassIcon).toHaveAttribute('role', 'img');
    
    // Use getAllByLabelText since there are multiple "Checklist icon" elements
    const checklistIcons = screen.getAllByLabelText('Checklist icon');
    expect(checklistIcons.length).toBeGreaterThan(0);
    checklistIcons.forEach(icon => {
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('role', 'img');
    });
  });

  it('applies correct color classes', () => {
    const { container } = render(<IconTest />);
    
    // Check for brand-primary color
    const brandPrimaryIcons = container.querySelectorAll('.text-brand-primary');
    expect(brandPrimaryIcons.length).toBeGreaterThan(0);
    
    // Check for success color
    const successIcons = container.querySelectorAll('.text-success');
    expect(successIcons.length).toBeGreaterThan(0);
    
    // Check for warning color
    const warningIcons = container.querySelectorAll('.text-warning');
    expect(warningIcons.length).toBeGreaterThan(0);
  });

  it('applies correct size classes', () => {
    const { container } = render(<IconTest />);
    
    // Check for various size classes
    expect(container.querySelector('.h-4')).toBeInTheDocument();
    expect(container.querySelector('.h-6')).toBeInTheDocument();
    expect(container.querySelector('.h-8')).toBeInTheDocument();
    expect(container.querySelector('.h-10')).toBeInTheDocument();
    expect(container.querySelector('.h-12')).toBeInTheDocument();
    expect(container.querySelector('.h-16')).toBeInTheDocument();
  });

  it('includes loading spinner with animation', () => {
    render(<IconTest />);
    
    const spinner = screen.getByLabelText('Loading spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('includes hoverable icon with transitions', () => {
    render(<IconTest />);
    
    const hoverableIcon = screen.getByLabelText('Hoverable compass icon');
    expect(hoverableIcon).toBeInTheDocument();
    expect(hoverableIcon).toHaveClass('transition-all');
    expect(hoverableIcon).toHaveClass('duration-200');
    expect(hoverableIcon).toHaveClass('hover:scale-110');
  });

  it('displays accessibility checklist', () => {
    render(<IconTest />);
    
    expect(screen.getByText(/All icons have aria-label attributes/)).toBeInTheDocument();
    expect(screen.getByText(/Icons use role="img" for proper semantics/)).toBeInTheDocument();
    expect(screen.getByText(/Color contrast meets WCAG AA standards/)).toBeInTheDocument();
    expect(screen.getByText(/Icons support dark\/light mode/)).toBeInTheDocument();
  });
});

