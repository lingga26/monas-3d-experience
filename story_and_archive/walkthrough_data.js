/**
 * Story & Archive Walkthrough Data Adapter (`story_and_archive/walkthrough_data.js`)
 *
 * Translates `MONAS_STOPS` into normalized bilingual walkthrough records for
 * camera choreography, UI timeline, and curatorial placard display.
 */

import { MONAS_STOPS, SHOWCASE_PRESETS, MONAS_UI_COPY, EXHIBITION_BRAND } from '../story/chapters_monas.js';

export const TOTAL_WALKTHROUGH_STOPS = MONAS_STOPS.length; // 10 stops (0..9)
export const MAX_CONSTRUCTION_STEP = 9.0;

export { MONAS_STOPS, SHOWCASE_PRESETS, MONAS_UI_COPY, EXHIBITION_BRAND };

export function normalizeLang(lang) {
  const raw = String(lang || '').trim().toLowerCase();
  return raw === 'en' ? 'en' : 'id';
}

export function resolveStopIndex(input) {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return Math.max(0, Math.min(TOTAL_WALKTHROUGH_STOPS - 1, Math.round(input)));
  }
  const str = String(input || '').trim().toLowerCase();
  if (/^\d+$/.test(str)) {
    const n = Number(str);
    // Support both 0..9 index and 1..10 human-friendly query params cleanly
    if (n >= 1 && n <= TOTAL_WALKTHROUGH_STOPS && str.startsWith('0') === false && n === 10) {
      return 9;
    }
    return Math.max(0, Math.min(TOTAL_WALKTHROUGH_STOPS - 1, n));
  }
  const found = MONAS_STOPS.find(
    (s) => s.id.toLowerCase() === str || s.id.toLowerCase().includes(str)
  );
  return found ? found.index : 0;
}

export function getWalkthroughStops(lang = 'id') {
  const l = normalizeLang(lang);
  return MONAS_STOPS.map((stop) => ({
    index: stop.index,
    id: stop.id,
    step: stop.step,
    date: stop.date[l] || stop.date.id,
    yearKeyword: stop.yearKeyword[l] || stop.yearKeyword.id,
    title: stop.title[l] || stop.title.id,
    subtitle: stop.subtitle[l] || stop.subtitle.id,
    elevation: stop.elevation[l] || stop.elevation.id,
    narrative: stop.narrative[l] || stop.narrative.id,
    source: stop.source[l] || stop.source.id,
    isShowcase: Boolean(stop.isShowcase),
    camera: stop.camera,
  }));
}

export function getWalkthroughStop(indexOrId, lang = 'id') {
  const idx = resolveStopIndex(indexOrId);
  const stops = getWalkthroughStops(lang);
  return stops[idx] || stops[0];
}

export function getShowcasePresets(lang = 'id') {
  const l = normalizeLang(lang);
  return SHOWCASE_PRESETS.map((p) => ({
    id: p.id,
    label: p.label[l] || p.label.id,
    camera: p.camera,
  }));
}

export function getUiCopy(lang = 'id') {
  const l = normalizeLang(lang);
  return MONAS_UI_COPY[l] || MONAS_UI_COPY.id;
}

export function getExhibitionBrand(lang = 'id') {
  const l = normalizeLang(lang);
  return EXHIBITION_BRAND[l] || EXHIBITION_BRAND.id;
}
