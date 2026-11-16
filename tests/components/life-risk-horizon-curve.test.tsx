import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LifeRiskRadar } from '@/components/dashboard/LifeRiskRadar';
import type { LifeRiskPacket, LifeRiskWindow } from '@/lib/atmosphere/types';

function octoberDays() {
  return Array.from({ length: 30 }, (_, index) => {
    const friction = index === 0 ? 0 : Math.round(18 + 40 * Math.sin(((index + 1) / 30) * Math.PI));
    return {
      date: `2026-10-${String(index + 1).padStart(2, '0')}`,
      scored: true,
      friction: Math.max(0, friction),
      ease: 0,
    };
  });
}

function windowFor(partial: Pick<LifeRiskWindow, 'id' | 'label' | 'kind' | 'friction'> & Partial<LifeRiskWindow>): LifeRiskWindow {
  return {
    ease: 0,
    confidence: 70,
    domains: ['self'],
    source: 'transit',
    phase: 'peaking',
    ...partial,
  };
}

function packet(): LifeRiskPacket {
  return {
    date: '2026-10-01',
    windowDays: 30,
    overallFriction: 64,
    level: 'friction',
    elevatedDisruption: true,
    confidence: 70,
    headline: 'Hard pressure is up this month.',
    move: 'One priority max.',
    topDrivers: [],
    frictionWindows: [
      windowFor({
        id: 'sat',
        label: 'Saturn Square Moon',
        kind: 'friction',
        friction: 80,
        startsAt: '2026-10-04T12:00:00',
        peakAt: '2026-10-07T12:00:00',
        daysToPeak: 6,
        domains: ['career'],
      }),
      windowFor({
        id: 'mars',
        label: 'Mars Opposition Venus',
        kind: 'friction',
        friction: 60,
        startsAt: '2026-10-08T12:00:00',
        peakAt: '2026-10-08T12:00:00',
        daysToPeak: 7,
        domains: ['love'],
      }),
    ],
    supportWindows: [
      windowFor({
        id: 'jup',
        label: 'Jupiter Trine Sun',
        kind: 'support',
        friction: 20,
        ease: 70,
        startsAt: '2026-10-15T12:00:00',
        peakAt: '2026-10-15T12:00:00',
        daysToPeak: 14,
        domains: ['self'],
      }),
    ],
    horizon: octoberDays(),
    nextFrictionPeak: null,
    nextSupportPeak: null,
    domains: [],
    provenance: ['test'],
    generatedAt: '2026-10-01T12:00:00.000Z',
  };
}

describe('LifeRiskRadar horizon curve', () => {
  it('replaces the bar grid with one curve and planet peaks', () => {
    const { container, unmount } = render(<LifeRiskRadar risk={packet()} />);

    expect(container.querySelector('.rounded-t-sm')).toBeNull();
    expect(container.querySelector('.rounded-b-sm')).toBeNull();
    const curve = container.querySelector('svg path[d*="C"]');
    expect(curve).toBeTruthy();
    const path = curve?.getAttribute('d');

    expect(screen.getByRole('group', { name: /Next 30 days — pressure and ease/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Saturn Square Moon\. friction load 80 · Work/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mars Opposition Venus\. friction load 60 · Bonds/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jupiter Trine Sun\. ease 70 · Self/i })).toBeInTheDocument();
    expect(screen.getByText(/Orange above the line is hard pressure/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Saturn Square Moon\. friction load 80 · Work/i }));
    expect(screen.getByText('Peaks a couple of days apart')).toBeInTheDocument();
    expect(screen.getByText(/exact Wed, Oct 7/i, { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText(/exact Thu, Oct 8/i, { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('friction load 80 · Work', { selector: 'span' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Jupiter Trine Sun\. ease 70 · Self/i }));
    expect(screen.queryByText('Peaks a couple of days apart')).not.toBeInTheDocument();
    expect(screen.getByText('ease 70 · Self', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText(/exact Thu, Oct 15/i, { selector: 'span' })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /No major hard or supportive hits/i })[0]);
    expect(screen.getByText(/No major hard or supportive hits scored this day/i)).toBeInTheDocument();

    unmount();
    const again = render(<LifeRiskRadar risk={packet()} />);
    expect(again.container.querySelector('svg path[d*="C"]')?.getAttribute('d')).toBe(path);
  });
});
