/**
 * Narrative Curatorial Placard Card (`story_and_archive/museum_placard.js`)
 *
 * Option A ("Emas dan Langit Jakarta") Layout:
 *   - Desktop: Floating editorial slate-navy card on LEFT side (`max-width: 356px`),
 *     highlighting a bold tabular Year Keyword (`1954`..`Kini`), stop metadata, title,
 *     narrative, verified dimensions, archival source, and Showcase Preset buttons on Stop 10.
 *   - Mobile Portrait: Collapsible bottom sheet resting cleanly above the slim timeline bar.
 */

import {
  TOTAL_WALKTHROUGH_STOPS,
  getShowcasePresets,
  getUiCopy,
  normalizeLang,
} from './walkthrough_data.js';

export function createMuseumPlacard(
  parent,
  { lang = 'id', onSelectHeroPreset = null, onRestartTour = null } = {}
) {
  let currentLang = normalizeLang(lang);
  let currentStop = null;
  let activePresetId = 'overview';
  let isCollapsedMobile = false;

  const el = document.createElement('aside');
  el.className = 'monas-placard';
  el.setAttribute('aria-live', 'polite');

  el.innerHTML = `
    <div class="monas-placard-mobile-handle">
      <div class="monas-placard-handle-meta">
        <span class="monas-placard-badge" id="placard-step-badge"></span>
        <span class="monas-placard-date-chip" id="placard-date"></span>
      </div>
      <button type="button" id="btn-placard-toggle" class="monas-placard-collapse-btn"></button>
    </div>
    <div class="monas-placard-year-hero" id="placard-year-keyword" aria-hidden="true"></div>
    <h2 class="monas-placard-title" id="placard-title"></h2>
    <p class="monas-placard-spec" id="placard-elevation"></p>
    <div class="monas-placard-body">
      <p class="monas-placard-prose" id="placard-narrative"></p>
      <div class="monas-showcase-presets" id="placard-presets" hidden></div>
      <div class="monas-placard-footer">
        <span class="monas-placard-source" id="placard-source"></span>
        <button type="button" id="btn-placard-restart" class="monas-restart-btn" hidden></button>
      </div>
    </div>
  `;

  const mountTarget = parent || document.getElementById('museum-ui-root') || document.body;
  mountTarget.appendChild(el);

  const badgeEl = el.querySelector('#placard-step-badge');
  const dateEl = el.querySelector('#placard-date');
  const toggleBtn = el.querySelector('#btn-placard-toggle');
  const yearHeroEl = el.querySelector('#placard-year-keyword');
  const titleEl = el.querySelector('#placard-title');
  const elevationEl = el.querySelector('#placard-elevation');
  const narrativeEl = el.querySelector('#placard-narrative');
  const presetsWrap = el.querySelector('#placard-presets');
  const sourceEl = el.querySelector('#placard-source');
  const restartBtn = el.querySelector('#btn-placard-restart');

  function renderPresets() {
    const presets = getShowcasePresets(currentLang);
    presetsWrap.innerHTML = '';
    for (const p of presets) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'monas-preset-btn';
      btn.dataset.presetId = p.id;
      btn.textContent = p.label;
      btn.classList.toggle('is-active', p.id === activePresetId);
      btn.setAttribute('aria-pressed', p.id === activePresetId ? 'true' : 'false');
      btn.addEventListener('click', () => {
        activePresetId = p.id;
        renderPresets();
        if (typeof api.onSelectHeroPreset === 'function') {
          api.onSelectHeroPreset(p);
        }
      });
      presetsWrap.appendChild(btn);
    }
  }

  function render() {
    const copy = getUiCopy(currentLang);
    toggleBtn.textContent = isCollapsedMobile ? copy.expandPlacard : copy.collapsePlacard;
    el.classList.toggle('is-collapsed', isCollapsedMobile);

    if (!currentStop) return;
    const stopNum = (currentStop.index ?? 0) + 1;
    badgeEl.textContent = `${copy.stopLabel} ${stopNum} ${copy.ofLabel} ${TOTAL_WALKTHROUGH_STOPS}`;
    dateEl.textContent = currentStop.date || '';
    yearHeroEl.textContent = currentStop.yearKeyword || '';
    titleEl.textContent = currentStop.title || '';
    elevationEl.textContent = currentStop.elevation || '';
    narrativeEl.textContent = currentStop.narrative || '';
    sourceEl.textContent = currentStop.source || '';

    const showShowcase = Boolean(currentStop.isShowcase);
    presetsWrap.hidden = !showShowcase;
    restartBtn.hidden = !showShowcase;
    restartBtn.textContent = copy.restartTour;

    if (showShowcase) {
      renderPresets();
    }
  }

  toggleBtn.addEventListener('click', () => {
    isCollapsedMobile = !isCollapsedMobile;
    render();
  });

  restartBtn.addEventListener('click', () => {
    if (typeof api.onRestartTour === 'function') {
      api.onRestartTour();
    }
  });

  const api = {
    element: el,
    onSelectHeroPreset,
    onRestartTour,
    setStop(_stopNumber, { stop } = {}) {
      if (stop) currentStop = stop;
      render();
    },
    setLanguage(nextLang) {
      currentLang = normalizeLang(nextLang);
      render();
    },
    setActiveHeroPreset(presetId) {
      activePresetId = String(presetId || 'overview');
      if (currentStop?.isShowcase) renderPresets();
    },
    setOpacity(op) {
      el.style.opacity = String(op);
    },
    set3DRevealState() {},
    updatePlateRect() {},
    dispose: () => el.remove(),
  };

  render();
  return api;
}
