import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { DomainScoreList } from '@/components/dashboard/DomainScoreList';
import { LifeDomainStrip } from '@/components/dashboard/LifeDomainStrip';
import { buildDomainStripItems } from '@/lib/atmosphere/domain-strip';
import { computeLifeRisk } from '@/lib/atmosphere/life-risk';
import type { DomainScore, TransitDriver } from '@/types/astrology';

const moneyDriver: TransitDriver = {
  transitId: 'sat-sq-venus',
  label: 'Saturn Square Venus',
  strength: 80,
  confidence: 72,
  reason: 'A bill or money conversation is leaning on you harder than usual.',
  valence: -0.4,
  aspect: 'Square',
  transitingPlanet: 'Saturn',
  natalPlanet: 'Venus',
  domains: ['finances'],
};

const financeRow: DomainScore = {
  domain: 'finances',
  pressure: 71,
  opportunity: 12,
  volatility: 40,
  confidence: 70,
  tone: 'pressure',
  topDrivers: [moneyDriver],
};

describe('domain drill-down', () => {
  it('opens a domain row with scores, the scoring transit, and chart-specific copy', () => {
    render(<DomainScoreList domains={[financeRow]} />);

    fireEvent.click(screen.getByRole('button', { name: /finances are tight/i }));

    expect(screen.getAllByText(/Pressure 71\/100/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Opportunity 12\/100/).length).toBeGreaterThan(0);
    expect(screen.getByText(/tightening money/i)).toBeInTheDocument();
    expect(screen.getByText(/bill or money conversation/i)).toBeInTheDocument();
    expect(screen.queryByText(/Quiet in this area/i)).not.toBeInTheDocument();
  });

  it('fills an empty topDrivers list from fallback transits so the panel is not a placeholder', () => {
    render(
      <DomainScoreList
        domains={[{ ...financeRow, topDrivers: [] }]}
        fallbackDrivers={[moneyDriver]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /finances are tight/i }));

    expect(screen.getByText(/tightening money/i)).toBeInTheDocument();
    expect(screen.queryByText(/Quiet in this area/i)).not.toBeInTheDocument();
  });

  it('opens a Today chip with pressure, opportunity, and the money transit that scored it', () => {
    const risk = computeLifeRisk({
      date: '2026-09-07',
      predictive: {
        events: [
          {
            eventId: 'sat-sq-venus-money',
            scores: { intensity: 80, confidence: 0.8, volatility: 20 },
            transit: { transitingPlanet: 'Saturn', aspect: 'Square', natalPlanet: 'Venus' },
            timing: { phase: 'peaking', daysToPeak: 0 },
            domains: [{ name: 'money', impact: 80, valence: -0.8 }],
            narrative: { risk: 'A money conversation is asking for more than you want to give today.' },
          },
        ],
      },
    });
    const items = buildDomainStripItems(risk, { includeQuiet: false });
    render(<LifeDomainStrip items={items} risk={risk} />);

    fireEvent.click(screen.getByRole('button', { name: /finances are tight/i }));

    expect(screen.getByText(/Pressure \d+\/100/)).toBeInTheDocument();
    expect(screen.getByText(/Opportunity \d+\/100/)).toBeInTheDocument();
    expect(screen.getByText(/money conversation|tightening money/i)).toBeInTheDocument();
    expect(screen.queryByText(/Quiet in this area/i)).not.toBeInTheDocument();
  });
});
