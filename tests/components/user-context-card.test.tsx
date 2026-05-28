import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { UserContextCard } from '../../components/astrology/UserContextCard';

describe('UserContextCard', () => {
  const originalFetch = global.fetch;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('shows the API load error message when context fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Failed to load user context' }),
    } as Response);

    render(<UserContextCard userId="user_1" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load user context')).toBeInTheDocument();
    });
  });

  it('shows the API save error message when persistence fails', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: null }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Failed to persist user context' }),
      } as Response);

    render(<UserContextCard userId="user_1" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Save memory' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to persist user context')).toBeInTheDocument();
    });
  });
});