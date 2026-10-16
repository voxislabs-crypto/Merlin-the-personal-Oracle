import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TodaySignalFeedback } from '@/components/dashboard/TodaySignalFeedback';

describe('TodaySignalFeedback', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);
  });

  it('asks relevance and usefulness separately', () => {
    render(<TodaySignalFeedback userId="user-1" itemId="life-weather-2026-10-16" />);

    expect(screen.getByText('Did this description feel relevant?')).toBeInTheDocument();
    expect(screen.getByText('Did the suggestion help?')).toBeInTheDocument();
    expect(screen.queryByText(/did a specific/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/that hit/i)).not.toBeInTheDocument();
  });

  it('posts resonance without posting usefulness', async () => {
    render(<TodaySignalFeedback userId="user-1" itemId="life-weather-2026-10-16" />);

    fireEvent.click(screen.getByRole('button', { name: /feel relevant\? Relevant/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.feedback.kind).toBe('resonance');
    expect(body.feedback.notes).toMatch(/felt relevant/i);
    expect(body.aspectId).toBe('life-weather-2026-10-16');
  });

  it('posts usefulness with a milder score', async () => {
    render(<TodaySignalFeedback userId="user-1" itemId="life-weather-2026-10-16" />);

    fireEvent.click(screen.getByRole('button', { name: /suggestion help\? It helped/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.feedback.kind).toBe('usefulness');
    expect(body.feedback.accuracyScore).toBeLessThanOrEqual(0.65);
    expect(body.feedback.notes).toMatch(/suggestion helped/i);
  });
});
