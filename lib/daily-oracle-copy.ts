/** Daily pulse opener. Life-arc level stays off this line. */
export function dailyOracleOpener(input: { truthBomb?: boolean; clientDate?: string }): string {
  if (input.truthBomb) {
    return `Truth Bomb (${input.clientDate || 'today'}): the old script is expensive now.`;
  }
  const dayStamp = input.clientDate ? ` · ${input.clientDate}` : '';
  return `Daily Oracle${dayStamp}.`;
}
