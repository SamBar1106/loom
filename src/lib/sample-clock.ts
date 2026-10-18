/** Fixed clock so sample timestamps stay stable in the UI and screenshots. */
export const SAMPLE_NOW = Date.parse("2026-10-18T23:00:00.000Z");

export function hoursBeforeSampleNow(hours: number): string {
  return new Date(SAMPLE_NOW - hours * 60 * 60 * 1000).toISOString();
}
