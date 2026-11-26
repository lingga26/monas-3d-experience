/**
 * Compact Exhibition Header (`ui/museum_header.js`)
 *
 * Renders the top navigation bar featuring:
 *   - Monument Brand Title (`Monumen Nasional` / `National Monument`)
 *   - Atmospheric Time-of-Day Switcher (`Pagi · Senja · Malam` / `Morning · Dusk · Night`)
 *   - Bilingual Toggle (`ID · EN`)
 *   - Pure 3D View Toggle (`Fokus 3D` / `Pure View`)
 */

import { getExhibitionBrand, getUiCopy, normalizeLang } from '../story_and_archive/walkthrough_data.js';

export function createMuseumHeader({
  parent = null,
  lang = 'id',
  initialMood = 'day',
  enablePureViewButton = true,
  onLanguageChange = null,
  onMoodChange = null,
  onPureViewChange = null,
} = {}) {
  let currentLang = normalizeLang(lang);
  let currentMood = ['day', 'dusk', 'night'].includes(initialMood) ? initialMood : 'day';
  let pureView = false;

  const el = document.createElement('header');
  el.id = 'monas-top-header';
  el.className = 'monas-header';

  el.innerHTML = `
    <div class="monas-header-brand">
      <span class="monas-header-title" id="monas-header-title"></span>
      <span class="monas-header-sub" id="monas-header-sub"></span>
    </div>
    <div class="monas-header-controls">
      <div class="monas-segmented-group" role="group" aria-label="Waktu Jakarta">
        <button type="button" class="monas-seg-btn" data-mood="day"></button>
        <button type="button" class="monas-seg-btn" data-mood="dusk"></button>
        <button type="button" class="monas-seg-btn" data-mood="night"></button>
      </div>
      <div class="monas-segmented-group" role="group" aria-label="Bahasa / Language">
        <button type="button" class="monas-seg-btn" data-lang="id">ID</button>
        <button type="button" class="monas-seg-btn" data-lang="en">EN</button>
      </div>
      <button type="button" class="monas-pure-btn" id="btn-pure-view" aria-pressed="false"></button>
    </div>
  `;

  const mountTarget = parent || document.getElementById('museum-ui-root') || document.body;
  mountTarget.appendChild(el);

  const titleEl = el.querySelector('#monas-header-title');
  const subEl = el.querySelector('#monas-header-sub');
  const moodBtns = Array.from(el.querySelectorAll('[data-mood]'));
  const langBtns = Array.from(el.querySelectorAll('[data-lang]'));
  const pureBtn = el.querySelector('#btn-pure-view');
  if (!enablePureViewButton && pureBtn) pureBtn.hidden = true;

  function render() {
    const brand = getExhibitionBrand(currentLang);
    const copy = getUiCopy(currentLang);
    titleEl.textContent = brand.title;
    subEl.textContent = brand.subtitle;

    for (const btn of moodBtns) {
      const m = btn.dataset.mood;
      btn.textContent = copy.moods[m] || m;
      const active = m === currentMood;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    for (const btn of langBtns) {
      const l = btn.dataset.lang;
      const active = l === currentLang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    if (pureBtn) {
      pureBtn.textContent = pureView ? copy.exitPureView : copy.pureView;
      pureBtn.classList.toggle('is-active', pureView);
      pureBtn.setAttribute('aria-pressed', pureView ? 'true' : 'false');
    }

    if (document.body) {
      document.body.classList.toggle('is-pure-view', pureView);
    }
  }

  for (const btn of moodBtns) {
    btn.addEventListener('click', () => {
      setMood(btn.dataset.mood, { emit: true });
    });
  }

  for (const btn of langBtns) {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang, { emit: true });
    });
  }

  pureBtn?.addEventListener('click', () => {
    setPureView(!pureView, { emit: true });
  });

  const onKeyDown = (ev) => {
    if (ev.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(ev.target.tagName)) return;
    if ((ev.key === 'h' || ev.key === 'H') && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      if (document.body?.classList.contains('is-landing-mode')) return;
      ev.preventDefault();
      setPureView(!pureView, { emit: true });
    }
  };
  if (typeof window !== 'undefined' && enablePureViewButton) {
    window.addEventListener('keydown', onKeyDown);
  }

  function setLanguage(nextLang, { emit = true } = {}) {
    const n = normalizeLang(nextLang);
    if (n === currentLang) return currentLang;
    currentLang = n;
    render();
    if (emit && typeof onLanguageChange === 'function') {
      onLanguageChange(currentLang);
    }
    return currentLang;
  }

  function setMood(nextMood, { emit = true } = {}) {
    const m = ['day', 'dusk', 'night'].includes(nextMood) ? nextMood : 'day';
    if (m === currentMood && !emit) return currentMood;
    currentMood = m;
    render();
    if (emit && typeof onMoodChange === 'function') {
      onMoodChange(currentMood);
    }
    return currentMood;
  }

  function setPureView(active, { emit = true } = {}) {
    pureView = Boolean(active);
    render();
    if (emit && typeof onPureViewChange === 'function') {
      onPureViewChange(pureView);
    }
    return pureView;
  }

  render();

  return {
    element: el,
    setLanguage,
    getLanguage: () => currentLang,
    setMood,
    getMood: () => currentMood,
    setPureView,
    getPureView: () => pureView,
    dispose: () => {
      if (typeof window !== 'undefined' && enablePureViewButton) {
        window.removeEventListener('keydown', onKeyDown);
      }
      el.remove();
    },
  };
}
