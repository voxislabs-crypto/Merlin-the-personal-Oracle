import { useCallback } from 'react';
import {
  requestOracleChat,
  OracleChatRequestPayload,
  OracleChatStreamResult,
} from '@/lib/oracle-chat-client';

export function useOracleChatStream() {
  const sendOracleMessage = useCallback(
    async (
      payload: OracleChatRequestPayload,
      onChunk?: (fullContent: string, delta: string) => void
    ): Promise<OracleChatStreamResult> => {
      return requestOracleChat(payload, { onChunk });
    },
    []
  );

  return { sendOracleMessage };
}