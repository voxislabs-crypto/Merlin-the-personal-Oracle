import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { YourShadowSection } from '@/components/astrology/YourShadowSection';

describe('YourShadowSection', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows a Your Shadow heading above the name card and starts the explainer open', () => {
    render(<YourShadowSection mbtiType="INTJ" />);

    const heading = screen.getByRole('heading', { name: 'Your Shadow' });
    const nameLabel = screen.getByText('Your Shadow Name');
    expect(heading.compareDocumentPosition(nameLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('button', { name: /what is the shadow/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText(/dark side of personality/i)).toBeInTheDocument();
    expect(screen.getByText('Recovery')).toBeInTheDocument();
  });

  it('keeps the explainer open when an older collapsed preference is stored', () => {
    window.localStorage.setItem('merlin:shadow-info:expanded', 'false');
    render(<YourShadowSection mbtiType="INTJ" />);
    expect(screen.getByText(/dark side of personality/i)).toBeInTheDocument();
  });

  it('collapses the explainer when the current preference says so, and can open again', () => {
    window.localStorage.setItem('merlin:shadow-info:expanded:v2', 'false');
    render(<YourShadowSection mbtiType="INTJ" />);

    const toggle = screen.getByRole('button', { name: /what is the shadow/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/dark side of personality/i)).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/dark side of personality/i)).toBeInTheDocument();
  });
});
