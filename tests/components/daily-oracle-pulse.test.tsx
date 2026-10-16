import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DailyOraclePulse } from '@/components/astrology/DailyOraclePulse';

describe('DailyOraclePulse feedback', () => {
  it('asks relevance and usefulness instead of one hit button', async () => {
    const onFeedback = jest.fn().mockResolvedValue(true);
    render(<DailyOraclePulse message="Name the pattern, then one bounded act." onFeedback={onFeedback} />);

    expect(screen.queryByRole('button', { name: /that hit/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/weight the next pulse/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /feel relevant\? Relevant/i }));
    await waitFor(() => expect(onFeedback).toHaveBeenCalledWith('hit', 'resonance'));

    fireEvent.click(screen.getByRole('button', { name: /suggestion help\? It helped/i }));
    await waitFor(() => expect(onFeedback).toHaveBeenCalledWith('hit', 'usefulness'));
  });
});
