import React from 'react';
import { render, screen } from '@testing-library/react';

import { DailyForecast } from '@/components/astrology/DailyForecast';
import type { ExplainabilityPacket } from '@/types/astrology';

jest.mock('framer-motion', () => {
  const React = require('react');
  function MockMotionDiv({ children, ...props }: any) {
    return React.createElement('div', props, children);
  }
  function MockMotionSpan({ children, ...props }: any) {
    return React.createElement('span', props, children);
  }
  return {
    motion: {
      div: MockMotionDiv,
      span: MockMotionSpan,
    },
  };
});

jest.mock('@/components/astrology/ThumbsFeedback', () =>
  function MockThumbsFeedback() {
    return <div data-testid="thumbs-feedback" />;
  }
);

describe('DailyForecast explainability block', () => {
  it('renders forecast rationale, drivers, and grounding prompt', () => {
    const explainability: ExplainabilityPacket = {
      windowStartIso: '2026-05-19T00:00:00.000Z',
      windowEndIso: '2026-05-26T00:00:00.000Z',
      globalPressure: 78,
      confidence: 68,
      topDrivers: [
        {
          transitId: 'driver-forecast-1',
          label: 'Saturn Trine Mercury',
          strength: 73,
          confidence: 69,
          reason: 'Focused cognition supports practical planning.',
        },
      ],
      weightingBreakdown: {
        eventCount: 4,
      },
      personalizationBreakdown: {
        resonanceFeedbackCount: 1,
      },
      domainScores: [
        {
          domain: 'mental_strain',
          pressure: 76,
          volatility: 51,
          confidence: 67,
          topDrivers: [],
        },
      ],
      archetypes: [],
      safety: {
        grounding: ['Take one slow breath before reacting to stressful messages.'],
        caution: ['Do not assume a single conversation defines the week.'],
        agency: ['Name one priority and complete it before context switching.'],
      },
    };

    render(
      <DailyForecast
        date="2026-05-19"
        summary="A focused but intense day where steady pacing wins."
        planetaryHighlights={[]}
        moonPhase="Full Moon"
        advice="Stay precise and pace your decisions."
        explainability={explainability}
      />
    );

    expect(screen.getByText('Why This Forecast')).toBeInTheDocument();
    expect(screen.getByText('Saturn Trine Mercury')).toBeInTheDocument();
    expect(screen.getByText('Grounding Prompt')).toBeInTheDocument();
    expect(screen.getByText(/Pressure 76\/100/)).toBeInTheDocument();
  });
});
