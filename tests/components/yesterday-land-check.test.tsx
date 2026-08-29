import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { YesterdayLandCheck } from '@/components/dashboard/YesterdayLandCheck';
import { writeWeatherWindowSnapshot } from '@/lib/atmosphere/window-land';

describe('YesterdayLandCheck', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);
  });

  it('asks whether yesterday’s window landed when a snapshot exists', async () => {
    writeWeatherWindowSnapshot(
      { date: '2026-08-28', move: 'Send the draft, skip the argument.' },
      'user-1',
    );

    render(<YesterdayLandCheck userId="user-1" today="2026-08-29" />);

    expect(await screen.findByText(/Yesterday’s window/)).toBeInTheDocument();
    expect(screen.getByText(/Send the draft, skip the argument/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /it landed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /it missed/i })).toBeInTheDocument();
  });

  it('does not show without a snapshot', () => {
    render(<YesterdayLandCheck userId="user-1" today="2026-08-29" />);
    expect(screen.queryByRole('button', { name: /it landed/i })).not.toBeInTheDocument();
  });

  it('hides the prompt after a vote', async () => {
    writeWeatherWindowSnapshot({ date: '2026-08-28', move: 'Wait one beat.' }, 'user-1');
    render(<YesterdayLandCheck userId="user-1" today="2026-08-29" />);
    fireEvent.click(await screen.findByRole('button', { name: /it missed/i }));
    expect(screen.getByText(/logged/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /it landed/i })).not.toBeInTheDocument();
  });
});
