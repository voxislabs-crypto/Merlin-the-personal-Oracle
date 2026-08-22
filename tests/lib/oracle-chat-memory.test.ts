import {
  clearOracleChatMessages,
  loadOracleChatMessages,
  normalizeClientConversationHistory,
  oracleChatStorageKey,
  saveOracleChatMessages,
  toOracleConversationHistory,
  toStoredOracleChatMessage,
} from '@/lib/oracle-chat-memory';

describe('oracle chat memory', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips messages for a user', () => {
    saveOracleChatMessages('user-1', [
      toStoredOracleChatMessage({
        id: 'user-1',
        role: 'user',
        content: 'How is today?',
        timestamp: new Date('2026-08-22T12:00:00.000Z'),
      }),
      toStoredOracleChatMessage({
        id: 'assistant-1',
        role: 'assistant',
        content: 'Pressure is moderate. Keep the next move small.',
        timestamp: new Date('2026-08-22T12:00:05.000Z'),
      }),
    ]);

    const loaded = loadOracleChatMessages('user-1');
    expect(loaded).toHaveLength(2);
    expect(loaded[0].content).toBe('How is today?');
    expect(loaded[1].role).toBe('assistant');
    expect(loadOracleChatMessages('someone-else')).toEqual([]);
  });

  it('clears only that user thread', () => {
    saveOracleChatMessages('user-1', [
      toStoredOracleChatMessage({
        id: 'a',
        role: 'user',
        content: 'hi',
        timestamp: new Date(),
      }),
    ]);
    clearOracleChatMessages('user-1');
    expect(loadOracleChatMessages('user-1')).toEqual([]);
    expect(oracleChatStorageKey('user-1')).toBe('merlin_oracle_chat_v1:user-1');
  });

  it('omits disruption placeholders from prompt history', () => {
    const history = toOracleConversationHistory([
      { role: 'user', content: 'hello', timestamp: new Date() },
      { role: 'assistant', content: 'Merlin hit a disruption: GROQ API failed with status 404. Try again in a moment.' },
      { role: 'assistant', content: 'Here is a real reply.' },
    ]);

    expect(history).toEqual([
      expect.objectContaining({ role: 'user', content: 'hello' }),
      expect.objectContaining({ role: 'assistant', content: 'Here is a real reply.' }),
    ]);
  });

  it('normalizes client history payloads', () => {
    const normalized = normalizeClientConversationHistory([
      { role: 'user', content: 'one' },
      { role: 'system', content: 'nope' },
      { role: 'assistant', content: 'two', timestamp: '2026-08-22T12:00:00.000Z' },
    ]);

    expect(normalized.map((row) => row.content)).toEqual(['one', 'two']);
  });
});
