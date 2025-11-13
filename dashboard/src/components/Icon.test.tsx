/**
 * Icon Component Tests
 * 
 * Tests for the reusable Icon component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon } from './Icon';
import { Compass, ClipboardCheck, Loader2 } from '../lib/icons';

describe('Icon Component', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<Icon icon={Compass} label="Test icon" />);
      const icon = screen.getByLabelText('Test icon');
      expect(icon).toBeInTheDocument();
    });

    it('renders different icon components', () => {
      const { rerender } = render(<Icon icon={Compass} label="Compass" />);
      expect(screen.getByLabelText('Compass')).toBeInTheDocument();

      rerender(<Icon icon={ClipboardCheck} label="Clipboard" />);
      expect(screen.getByLabelText('Clipboard')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies xs size class', () => {
      render(<Icon icon={Compass} size="xs" label="XS icon" />);
      const icon = screen.getByLabelText('XS icon');
      expect(icon).toHaveClass('h-3', 'w-3');
    });

    it('applies sm size class', () => {
      render(<Icon icon={Compass} size="sm" label="SM icon" />);
      const icon = screen.getByLabelText('SM icon');
      expect(icon).toHaveClass('h-4', 'w-4');
    });

    it('applies md size class (default)', () => {
      render(<Icon icon={Compass} label="MD icon" />);
      const icon = screen.getByLabelText('MD icon');
      expect(icon).toHaveClass('h-6', 'w-6');
    });

    it('applies lg size class', () => {
      render(<Icon icon={Compass} size="lg" label="LG icon" />);
      const icon = screen.getByLabelText('LG icon');
      expect(icon).toHaveClass('h-8', 'w-8');
    });

    it('applies xl size class', () => {
      render(<Icon icon={Compass} size="xl" label="XL icon" />);
      const icon = screen.getByLabelText('XL icon');
      expect(icon).toHaveClass('h-10', 'w-10');
    });

    it('applies 2xl size class', () => {
      render(<Icon icon={Compass} size="2xl" label="2XL icon" />);
      const icon = screen.getByLabelText('2XL icon');
      expect(icon).toHaveClass('h-12', 'w-12');
    });
  });

  describe('Color Variants', () => {
    it('applies brand-primary color', () => {
      render(<Icon icon={Compass} color="brand-primary" label="Primary" />);
      const icon = screen.getByLabelText('Primary');
      expect(icon).toHaveClass('text-brand-primary');
    });

    it('applies brand-accent color', () => {
      render(<Icon icon={Compass} color="brand-accent" label="Accent" />);
      const icon = screen.getByLabelText('Accent');
      expect(icon).toHaveClass('text-brand-accent');
    });

    it('applies success color', () => {
      render(<Icon icon={Compass} color="success" label="Success" />);
      const icon = screen.getByLabelText('Success');
      expect(icon).toHaveClass('text-success');
    });

    it('applies warning color', () => {
      render(<Icon icon={Compass} color="warning" label="Warning" />);
      const icon = screen.getByLabelText('Warning');
      expect(icon).toHaveClass('text-warning');
    });

    it('applies error color', () => {
      render(<Icon icon={Compass} color="error" label="Error" />);
      const icon = screen.getByLabelText('Error');
      expect(icon).toHaveClass('text-error');
    });

    it('applies neutral color', () => {
      render(<Icon icon={Compass} color="neutral" label="Neutral" />);
      const icon = screen.getByLabelText('Neutral');
      expect(icon).toHaveClass('text-neutral');
    });

    it('uses current color by default (no color class)', () => {
      render(<Icon icon={Compass} label="Current" />);
      const icon = screen.getByLabelText('Current');
      expect(icon).not.toHaveClass('text-brand-primary');
      expect(icon).not.toHaveClass('text-brand-accent');
    });
  });

  describe('Accessibility', () => {
    it('has aria-label when label is provided', () => {
      render(<Icon icon={Compass} label="Accessible icon" />);
      const icon = screen.getByLabelText('Accessible icon');
      expect(icon).toHaveAttribute('aria-label', 'Accessible icon');
    });

    it('has role="img" for semantic icons', () => {
      render(<Icon icon={Compass} label="Semantic icon" />);
      const icon = screen.getByLabelText('Semantic icon');
      expect(icon).toHaveAttribute('role', 'img');
    });

    it('has aria-hidden="true" for decorative icons', () => {
      render(<Icon icon={Compass} decorative />);
      const icon = document.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('has role="presentation" for decorative icons', () => {
      render(<Icon icon={Compass} decorative />);
      const icon = document.querySelector('[role="presentation"]');
      expect(icon).toBeInTheDocument();
    });

    it('does not have aria-label for decorative icons', () => {
      render(<Icon icon={Compass} decorative />);
      const icons = screen.queryByRole('img');
      expect(icons).not.toBeInTheDocument();
    });
  });

  describe('Transitions', () => {
    it('applies default transition', () => {
      render(<Icon icon={Compass} label="Default transition" />);
      const icon = screen.getByLabelText('Default transition');
      expect(icon).toHaveClass('transition-all', 'duration-200');
    });

    it('applies fast transition', () => {
      render(<Icon icon={Compass} transition="fast" label="Fast" />);
      const icon = screen.getByLabelText('Fast');
      expect(icon).toHaveClass('transition-all', 'duration-100');
    });

    it('applies slow transition', () => {
      render(<Icon icon={Compass} transition="slow" label="Slow" />);
      const icon = screen.getByLabelText('Slow');
      expect(icon).toHaveClass('transition-all', 'duration-300');
    });

    it('applies no transition', () => {
      render(<Icon icon={Compass} transition="none" label="None" />);
      const icon = screen.getByLabelText('None');
      expect(icon).not.toHaveClass('transition-all');
    });
  });

  describe('Custom Classes', () => {
    it('applies custom className', () => {
      render(<Icon icon={Compass} label="Custom" className="custom-class" />);
      const icon = screen.getByLabelText('Custom');
      expect(icon).toHaveClass('custom-class');
    });

    it('merges custom classes with size and color', () => {
      render(
        <Icon 
          icon={Compass} 
          size="lg" 
          color="brand-primary"
          label="Merged"
          className="hover:scale-110"
        />
      );
      const icon = screen.getByLabelText('Merged');
      expect(icon).toHaveClass('h-8', 'w-8', 'text-brand-primary', 'hover:scale-110');
    });
  });

  describe('Lucide Props', () => {
    it('passes through strokeWidth prop', () => {
      render(<Icon icon={Compass} label="Stroke" strokeWidth={1.5} />);
      const icon = screen.getByLabelText('Stroke');
      expect(icon).toHaveAttribute('stroke-width', '1.5');
    });
  });

  describe('Development Warnings', () => {
    const originalEnv = process.env.NODE_ENV;
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      consoleWarnSpy.mockClear();
    });

    it('warns in development when non-decorative icon lacks label', () => {
      process.env.NODE_ENV = 'development';
      render(<Icon icon={Compass} />);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Non-decorative icons should have a "label" prop')
      );
    });

    it('does not warn when label is provided', () => {
      process.env.NODE_ENV = 'development';
      render(<Icon icon={Compass} label="Has label" />);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('does not warn for decorative icons without label', () => {
      process.env.NODE_ENV = 'development';
      render(<Icon icon={Compass} decorative />);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Integration Examples', () => {
    it('renders hero icon correctly', () => {
      render(
        <Icon 
          icon={ClipboardCheck}
          size="2xl"
          color="brand-primary"
          label="Pre-launch checklist"
        />
      );
      const icon = screen.getByLabelText('Pre-launch checklist');
      expect(icon).toHaveClass('h-12', 'w-12', 'text-brand-primary');
    });

    it('renders loading spinner correctly', () => {
      render(
        <Icon 
          icon={Loader2}
          size="md"
          color="brand-primary"
          label="Loading"
          className="animate-spin"
          transition="none"
        />
      );
      const icon = screen.getByLabelText('Loading');
      expect(icon).toHaveClass('h-6', 'w-6', 'text-brand-primary', 'animate-spin');
      expect(icon).not.toHaveClass('transition-all');
    });
  });
});

