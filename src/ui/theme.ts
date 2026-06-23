/** Palette tokens. Mirrors docs/style-guide.md — keep in sync. */
export const COLORS = {
  ink: '#2b2440',
  paper: '#fbf7ef',
  sky: '#7cc6fe',
  leaf: '#7bd389',
  sun: '#ffd166',
  coral: '#ff8a7a',
  grape: '#b59be8',
  sea: '#5fbfb0',
} as const;

export type ColorToken = keyof typeof COLORS;

export function color(token: string): string {
  return (COLORS as Record<string, string>)[token] ?? token;
}
