// Single source of truth for Novartis brand colours (2026 refresh — orange).
//
// The customer confirmed the brand has changed and the app should move to the
// new orange identity (Adrian, 21 Aug 2026). Everything brand-coloured routes
// through these tokens so a future official brand-guide value is a one-line
// change here:
//   - the app UI reads the CSS custom properties in index.css (kept in sync
//     with the hexes below),
//   - the PDF and DOCX exporters read these TS constants directly.
//
// NOTE: these are our best-match values for the new Novartis orange pending the
// official brand hex; confirm against the brand guide before production.

export const BRAND = {
  // Primary brand orange + a darker shade for headings/emphasis.
  primary: '#E8590C',        // Novartis orange (accent)
  primaryDark: '#B23E00',    // darker orange for headings / title bars
  primaryLight: '#FFF0E6',   // tint background (chips, highlights)
  // Neutral ink used for body copy in documents.
  ink: '#1E1E1E',
  inkSoft: '#525252',
  inkMuted: '#8A8A8A',
  // Dark shell used by the app sidebar (warm near-black that pairs with orange).
  shell: '#241a17',
} as const;

// Hex string ("#RRGGBB") -> [r, g, b] for jsPDF (which takes 0–255 channels).
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// Hex without the leading '#', for the docx library (which wants "RRGGBB").
export function hexBare(hex: string): string {
  return hex.replace('#', '').toUpperCase();
}
