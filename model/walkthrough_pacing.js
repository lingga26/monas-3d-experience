/**
 * Monas 3D Experience — Walkthrough Pacing Rules (`model/walkthrough_pacing.js`)
 *
 * Defines step durations and smooth cubic easing for chronological autoplay across
 * the 10 Monas stops (`0..9`).
 */

export const WALKTHROUGH_PACE_WEIGHTS = [
  1.1, // Stop 0: Gagasan (1954–1961)
  1.2, // Stop 1: Peletakan Beton Pertama (1961)
  1.3, // Stop 2: Pemancangan Pasak Pondasi (1962)
  1.3, // Stop 3: Museum Bawah Tanah (1962–1963)
  1.4, // Stop 4: Batang Tugu & Cawan (1963–1964)
  1.4, // Stop 5: Pelapisan Marmer & Lift (1965–1969)
  1.3, // Stop 6: Perakitan Lidah Api (1965–1971)
  1.2, // Stop 7: Tahap Akhir & Diorama (1969–1976)
  1.3, // Stop 8: Peresmian 12 Juli 1975
  1.6, // Stop 9: Showcase 3D Kini
];

export function getSegmentTransitionDurationMs(fromIndex, toIndex) {
  const delta = Math.abs((toIndex ?? 0) - (fromIndex ?? 0));
  if (delta <= 0) return 900;
  return Math.min(2800, 1250 + delta * 260);
}

export function easeMonotonicBuild(t) {
  const x = t <= 0 ? 0 : t >= 1 ? 1 : t;
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
