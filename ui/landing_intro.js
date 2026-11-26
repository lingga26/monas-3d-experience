/**
 * Landing Intro Overlay (`ui/landing_intro.js`)
 *
 * Full-screen post-load intro floating over the live completed 132 m Monas 3D canvas
 * with bilingual Indonesian (`Jelajahi`) / English (`Explore`) action.
 */

import { getExhibitionBrand, getUiCopy, normalizeLang } from '../story_and_archive/walkthrough_data.js';

export function shouldStartInLandingMode(searchString = '') {
  const raw =
    searchString || (typeof window !== 'undefined' && window.location ? window.location.search : '');
  if (!raw) return true;
  try {
    const params = new URLSearchParams(raw);
    const falsy = (v) => ['0', 'false', 'no'].includes(String(v || '').trim().toLowerCase());
    const truthy = (v) => ['1', 'true', 'yes'].includes(String(v || '').trim().toLowerCase());
    if (params.has('intro') && falsy(params.get('intro'))) return false;
    if (params.has('skipIntro') && truthy(params.get('skipIntro'))) return false;
    if (params.has('stop') && String(params.get('stop') || '').trim() !== '') return false;
    if (truthy(params.get('autoplay'))) return false;
    if (truthy(params.get('debug'))) return false;
  } catch {
    return true;
  }
  return true;
}

export function createLandingIntro({
  parent = null,
  lang = 'id',
  active = true,
  onExplore = null,
} = {}) {
  let currentLang = normalizeLang(lang);
  let isActive = Boolean(active);

  const el = document.createElement('section');
  el.id = 'museum-landing-intro';
  el.className = 'monas-landing-intro';
  el.setAttribute('aria-label', 'Monumen Nasional Intro');
  el.innerHTML = `
    <div class="monas-landing-card">
      <p class="monas-landing-eyebrow" id="landing-eyebrow"></p>
      <h1 class="monas-landing-title" id="landing-title"></h1>
      <p class="monas-landing-sub" id="landing-sub"></p>
      <button type="button" id="btn-landing-explore" class="monas-explore-btn"></button>
    </div>
  `;

  const mountTarget = parent || document.getElementById('museum-ui-root') || document.body;
  mountTarget.appendChild(el);

  const eyebrowEl = el.querySelector('#landing-eyebrow');
  const titleEl = el.querySelector('#landing-title');
  const subEl = el.querySelector('#landing-sub');
  const btnEl = el.querySelector('#btn-landing-explore');

  function render() {
    const brand = getExhibitionBrand(currentLang);
    const copy = getUiCopy(currentLang);
    eyebrowEl.textContent = brand.veilEyebrow;
    titleEl.textContent = brand.title;
    subEl.textContent = copy.introSubtitle;
    btnEl.textContent = copy.exploreBtn;

    el.hidden = !isActive;
    el.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    if (document.body) {
      document.body.classList.toggle('is-landing-mode', isActive);
    }
  }

  btnEl.addEventListener('click', () => {
    setActive(false);
    if (typeof onExplore === 'function') onExplore();
  });

  function setLanguage(nextLang) {
    currentLang = normalizeLang(nextLang);
    render();
  }

  function setActive(flag) {
    isActive = Boolean(flag);
    render();
  }

  render();

  return {
    element: el,
    setLanguage,
    setActive,
    isActive: () => isActive,
    dispose: () => el.remove(),
  };
}
