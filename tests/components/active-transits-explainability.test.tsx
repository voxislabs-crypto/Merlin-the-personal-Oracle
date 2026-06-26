import React from 'react';
import { render, screen } from '@testing-library/react';

import { ActiveTransits } from '@/components/astrology/ActiveTransits';
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

jest.mock('@/components/astrology/UserContextCard', () => ({
  UserContextCard: function MockUserContextCard() {
    return <div data-testid="user-context-card" />;
  },
}));

jest.mock('@/components/astrology/PredictionTimeline', () => ({
  PredictionTimeline: function MockPredictionTimeline() {
    return <div data-testid="prediction-timeline" />;
  },
}));

jest.mock('@/components/astrology/FeedbackCollector', () => ({
  FeedbackCollector: function MockFeedbackCollector() {
    return <div data-testid="feedback-collector" />;
  },
}));

jest.mock('@/components/astrology/ThumbsFeedback', () =>
  function MockThumbsFeedback() {
    return <div data-testid="thumbs-feedback" />;
  }
);

describe('ActiveTransits explainability block', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('renders score rationale, top drivers, and safety guidance', () => {
    const explainability: ExplainabilityPacket = {
      windowStartIso: '2026-05-19T00:00:00.000Z',
      windowEndIso: '2026-05-26T00:00:00.000Z',
      globalPressure: 82,
      confidence: 71,
      topDrivers: [
        {
          transitId: 'driver-1',
          label: 'Mars Square Moon',
          strength: 84,
          confidence: 72,
          reason: 'Heightened emotional reactivity under deadline pressure.',
        },
      ],
      weightingBreakdown: {
        eventCount: 5,
      },
      personalizationBreakdown: {
        resonanceFeedbackCount: 3,
      },
      domainScores: [
        {
          domain: 'career',
          pressure: 79,
          volatility: 64,
          confidence: 70,
          topDrivers: [],
        },
      ],
      archetypes: [],
      safety: {
        grounding: ['Pause for two minutes before major replies.'],
        caution: ['Avoid all-or-nothing framing in conflict moments.'],
        agency: ['Choose one concrete next step and execute it.'],
      },
    };

    render(
      <ActiveTransits
        significant={[]}
        approaching={[]}
        summary={{ total: 0, exact: 0, approaching: 0 }}
        explainability={explainability}
      />
    );

    expect(screen.getByText('Why This Score')).toBeInTheDocument();
    expect(screen.getByText('Mars Square Moon')).toBeInTheDocument();
    expect(screen.getByText('Grounding & Safety')).toBeInTheDocument();
    expect(screen.getByText(/Pressure 79\/100/)).toBeInTheDocument();
  });
});
