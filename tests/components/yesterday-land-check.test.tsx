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

    expect(await screen.findByText(/Yesterday’s call/)).toBeInTheDocument();
    expect(screen.getByText(/Send the draft, skip the argument/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^yes$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /somewhat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^no$/i })).toBeInTheDocument();
  });

  it('asks about a pre-stated observable when one was stored', async () => {
    writeWeatherWindowSnapshot(
      {
        date: '2026-08-28',
        move: 'Send the draft, skip the argument.',
        watchFor: 'Notice if a talk gets sharper than the topic.',
      },
      'user-1',
    );

    render(<YesterdayLandCheck userId="user-1" today="2026-08-29" />);

    expect(
      await screen.findByText('Did this show up: Notice if a talk gets sharper than the topic.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Move was:/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^yes$/i }));
    await screen.findByText(/does not change today's scores/i);
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.feedback.kind).toBe('accuracy');
    expect(body.feedback.notes).toMatch(/Notice if a talk gets sharper than the topic/);
  });

  it('does not show without a snapshot', () => {
    render(<YesterdayLandCheck userId="user-1" today="2026-08-29" />);
    expect(screen.queryByRole('button', { name: /it landed/i })).not.toBeInTheDocument();
  });

  it('hides the prompt after a vote', async () => {
    writeWeatherWindowSnapshot({ date: '2026-08-28', move: 'Wait one beat.' }, 'user-1');
    render(<YesterdayLandCheck userId="user-1" today="2026-08-29" />);
    fireEvent.click(await screen.findByRole('button', { name: /^no$/i }));
    expect(screen.getByText(/does not change today's scores/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^yes$/i })).not.toBeInTheDocument();
    await screen.findByText(/does not change today's scores/i);
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.feedback.kind).toBe('accuracy');
    expect(body.feedback.notes).toMatch(/Accuracy check/);
  });
});
