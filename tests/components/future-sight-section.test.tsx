import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FutureSightSection } from '@/components/dashboard/FutureSightSection';
import type { LifeRiskPacket } from '@/lib/atmosphere/types';

const risk = {
  frictionWindows: [
    {
      id: '1',
      kind: 'friction',
      label: 'Uranus square Venus',
      domains: ['love'],
      daysToPeak: 2,
      friction: 70,
      confidence: 60,
      source: 'transit',
    },
    {
      id: '2',
      kind: 'friction',
      label: 'Mars square Moon',
      domains: ['love'],
      daysToPeak: 1,
      friction: 62,
      confidence: 60,
      source: 'transit',
    },
  ],
  supportWindows: [],
  topDrivers: [],
} as unknown as LifeRiskPacket;

describe('FutureSightSection', () => {
  it('stays collapsed and shows the structured theme when opened', async () => {
    render(<FutureSightSection risk={risk} userId="user-1" date="2026-10-16" />);

    expect(screen.getByText('Next few days')).toBeInTheDocument();
    expect(screen.queryByText('Uranus square Venus')).not.toBeVisible();

    fireEvent.click(screen.getByText('Next few days'));

    expect(screen.getByText('Possible theme')).toBeVisible();
    expect(screen.getByText('Uranus square Venus')).toBeVisible();
    expect(screen.getByText('Mars square Moon')).toBeVisible();
    expect(screen.getByText('Something to watch')).toBeVisible();
    expect(screen.getByText(/Notice if a talk gets sharper than the topic/)).toBeVisible();
    expect(screen.getByText('Symbolic read is fairly clear')).toBeVisible();
    expect(await screen.findByText('Did this description feel relevant?')).toBeInTheDocument();
    expect(screen.getByText('Did the suggestion help?')).toBeInTheDocument();
    expect(screen.queryByText(/Did this show up/)).not.toBeInTheDocument();
    expect(document.body.textContent || '').not.toMatch(/\blikely\b|\bwill\b|%/);
  });

  it('renders nothing when the near-term windows are empty', () => {
    const { container } = render(<FutureSightSection risk={null} date="2026-10-16" />);
    expect(container).toBeEmptyDOMElement();
  });
});
