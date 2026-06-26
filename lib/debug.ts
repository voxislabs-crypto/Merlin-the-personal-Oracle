export function isMbtiDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MERLIN_DEBUG_MBTI === 'true';
}