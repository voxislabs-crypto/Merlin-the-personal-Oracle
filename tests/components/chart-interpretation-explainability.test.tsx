import React from 'react';
import { render, screen } from '@testing-library/react';

import { ChartInterpretation } from '@/components/astrology/ChartInterpretation';
import type { ExplainabilityPacket } from '@/types/astrology';

jest.mock('framer-motion', () => {
  const React = require('react');
  function MockMotionDiv({ children, ...props }: any) {
    return React.createElement('div', props, children);
  }
  return {
    motion: {
      div: MockMotionDiv,
    },
  };
});

jest.mock('@/components/astrology/ThumbsFeedback', () =>
  function MockThumbsFeedback() {
    return <div data-testid="thumbs-feedback" />;
  }
);

describe('ChartInterpretation explainability context', () => {
  it('renders confidence context and top driver summary', () => {
    const explainability: ExplainabilityPacket = {
      windowStartIso: '2026-05-19T00:00:00.000Z',
      windowEndIso: '2026-05-26T00:00:00.000Z',
      globalPressure: 74,
      confidence: 66,
      topDrivers: [
        {
          transitId: 'driver-ctx-1',
          label: 'Jupiter Trine Sun',
          strength: 77,
          confidence: 67,
          reason: 'Supportive growth patterns are active.',
        },
      ],
      weightingBreakdown: {
        eventCount: 3,
      },
      personalizationBreakdown: {
        resonanceFeedbackCount: 2,
      },
      domainScores: [
        {
          domain: 'identity',
          pressure: 61,
          volatility: 40,
          confidence: 64,
          topDrivers: [],
        },
      ],
      archetypes: [],
      safety: {
        grounding: ['Check your assumptions against observable facts.'],
        caution: ['Avoid over-promising under elevated optimism.'],
        agency: ['Define one measurable next step.'],
      },
    };

    render(
      <ChartInterpretation
        summary="A steady growth cycle with meaningful personal leverage."
        planetInterpretations={[]}
        aspectInterpretations={[]}
        explainability={explainability}
      />
    );

    expect(screen.getByText('Interpretation Confidence Context')).toBeInTheDocument();
    expect(screen.getByText(/Pressure context 74\/100/)).toBeInTheDocument();
    expect(screen.getByText(/Top drivers:/)).toBeInTheDocument();
    expect(screen.getByText(/Identity/)).toBeInTheDocument();
  });
});
