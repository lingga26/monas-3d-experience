/**
 * Single Chronological Walkthrough Controller & Responsive Timeline Rail (`ui/walkthrough_controller.js`)
 *
 * Layout (Option A — Emas dan Langit Jakarta):
 *   - Desktop (> 768px): Vertical timeline rail anchored on the RIGHT edge (`10` clickable stop detents
 *     with year tooltips + prev/play-pause/next/restart controls + vertical range slider).
 *   - Mobile Portrait (<= 768px): Slim bottom timeline bar with stop dots, scrub slider, and transport buttons.
 */

import {
  TOTAL_WALKTHROUGH_STOPS,
  MAX_CONSTRUCTION_STEP,
  getWalkthroughStops,
  resolveStopIndex,
  getUiCopy,
  normalizeLang,
} from '../story_and_archive/walkthrough_data.js';
import { WALKTHROUGH_PACE_WEIGHTS } from '../model/walkthrough_pacing.js';
import { HERO_FINALE_CAMERA, HERO_SHOWCASE_PRESETS } from '../camera/hero_finale_rig.js';

export { HERO_FINALE_CAMERA, HERO_SHOWCASE_PRESETS };

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function createWalkthroughController({
  parent = null,
  lang = 'id',
  initialStopIndex = 0,
  bindKeyboard = true,
  landingMode = true,
  appAdapter = null,
  onLandingModeChange = null,
  onStopChange = null,
  onStepChange = null,
  onPlayStateChange = null,
} = {}) {
  let currentLang = normalizeLang(lang);
  let stops = getWalkthroughStops(currentLang);
  let stopIndex = resolveStopIndex(initialStopIndex);
  let tau = stopIndex;
  let step = stops[stopIndex]?.step ?? 0;
  let isPlaying = false;
  let speedMultiplier = 1.0;
  let isLanding = Boolean(landingMode);
  let playTimerAcc = 0;

  const el = document.createElement('nav');
  el.id = 'exhibition-walkthrough-bar';
  el.className = 'monas-timeline-rail';

  const detentButtonsHtml = stops
    .map(
      (s, i) => `
      <button
        type="button"
        class="monas-rail-dot"
        data-stop-index="${i}"
        aria-label="${s.date} — ${s.title}"
        title="${s.date} · ${s.title}"
      >
        <span class="monas-rail-pip" aria-hidden="true"></span>
        <span class="monas-rail-year">${s.yearKeyword}</span>
      </button>
    `
    )
    .join('');

  el.innerHTML = `
    <div class="monas-rail-detents" role="tablist" aria-label="Tahap konstruksi Monas">
      ${detentButtonsHtml}
    </div>
    <div class="monas-rail-slider-wrap">
      <input
        id="walkthrough-scrub-slider"
        class="monas-rail-slider"
        type="range"
        min="0"
        max="${MAX_CONSTRUCTION_STEP}"
        step="0.01"
        value="${tau}"
      />
    </div>
    <div class="monas-rail-controls">
      <button type="button" id="btn-wt-prev" class="monas-ctrl-btn" title="Previous">◀</button>
      <button type="button" id="btn-wt-play" class="monas-ctrl-btn monas-ctrl-play" title="Play">▶</button>
      <button type="button" id="btn-wt-next" class="monas-ctrl-btn" title="Next">▶▶</button>
    </div>
  `;

  const mountTarget = parent || document.getElementById('museum-ui-root') || document.body;
  mountTarget.appendChild(el);

  const sliderEl = el.querySelector('#walkthrough-scrub-slider');
  const prevBtn = el.querySelector('#btn-wt-prev');
  const playBtn = el.querySelector('#btn-wt-play');
  const nextBtn = el.querySelector('#btn-wt-next');
  const detentEls = Array.from(el.querySelectorAll('.monas-rail-dot'));

  function syncDomLabels() {
    const copy = getUiCopy(currentLang);
    stops = getWalkthroughStops(currentLang);
    el.setAttribute('aria-label', copy.timelineAria);
    sliderEl.setAttribute('aria-label', copy.timelineAria);
    prevBtn.setAttribute('aria-label', copy.prevStop);
    prevBtn.title = copy.prevStop;
    nextBtn.setAttribute('aria-label', copy.nextStop);
    nextBtn.title = copy.nextStop;
    playBtn.setAttribute('aria-label', isPlaying ? copy.pauseWalkthrough : copy.playWalkthrough);
    playBtn.title = isPlaying ? copy.pauseWalkthrough : copy.playWalkthrough;
    playBtn.textContent = isPlaying ? '❚❚' : '▶';

    for (let i = 0; i < detentEls.length; i++) {
      const btn = detentEls[i];
      const s = stops[i];
      if (!s) continue;
      btn.setAttribute('aria-label', `${s.date} — ${s.title}`);
      btn.title = `${s.date} · ${s.title}`;
      const yrEl = btn.querySelector('.monas-rail-year');
      if (yrEl) yrEl.textContent = s.yearKeyword;
    }
  }

  function syncBarDom() {
    const roundedIdx = clamp(Math.round(tau), 0, TOTAL_WALKTHROUGH_STOPS - 1);
    for (let i = 0; i < detentEls.length; i++) {
      const active = i === roundedIdx;
      const passed = i <= tau + 0.05;
      detentEls[i].classList.toggle('is-active', active);
      detentEls[i].classList.toggle('is-passed', passed);
      detentEls[i].setAttribute('aria-selected', active ? 'true' : 'false');
    }
    if (sliderEl) {
      sliderEl.value = String(tau.toFixed(2));
      const pct = (tau / MAX_CONSTRUCTION_STEP) * 100;
      sliderEl.style.setProperty('--rail-progress', `${pct.toFixed(1)}%`);
    }
    playBtn.textContent = isPlaying ? '❚❚' : '▶';
    playBtn.classList.toggle('is-playing', isPlaying);
  }

  function emitStep(nextStep, meta = {}) {
    step = clamp(Number(nextStep) || 0, 0, MAX_CONSTRUCTION_STEP);
    appAdapter?.setStep?.(step);
    if (typeof onStepChange === 'function') {
      onStepChange(step, meta);
    }
  }

  function emitStopChange(idx, stopObj, meta = {}) {
    if (typeof onStopChange === 'function') {
      onStopChange({
        stopIndex: idx,
        stopNumber: idx + 1,
        stop: stopObj,
        tau,
        step,
        ...meta,
      });
    }
  }

  const controller = {
    element: el,
    _stops: stops,
    get _stopIndex() {
      return stopIndex;
    },
    set _stopIndex(v) {
      stopIndex = resolveStopIndex(v);
    },
    get _tau() {
      return tau;
    },
    set _tau(v) {
      tau = clamp(Number(v) || 0, 0, MAX_CONSTRUCTION_STEP);
    },
    get _step() {
      return step;
    },
    set _step(v) {
      step = clamp(Number(v) || 0, 0, MAX_CONSTRUCTION_STEP);
    },
    get _landingMode() {
      return isLanding;
    },
    get _isPlaying() {
      return isPlaying;
    },
    _syncBarDom: syncBarDom,
    _emitStep: emitStep,
    _emitStopChange: emitStopChange,

    resolveStopIndex,
    getStops: () => stops,
    getStopIndex: () => stopIndex,
    getActiveStop: () => stops[stopIndex] || stops[0],
    getLanguage: () => currentLang,

    setLanguage(nextLang) {
      currentLang = normalizeLang(nextLang);
      stops = getWalkthroughStops(currentLang);
      controller._stops = stops;
      syncDomLabels();
      syncBarDom();
      emitStopChange(stopIndex, stops[stopIndex], { immediate: true, reason: 'language' });
      return currentLang;
    },

    setLandingMode(flag, { silent = false } = {}) {
      isLanding = Boolean(flag);
      el.hidden = isLanding;
      if (!silent && typeof onLandingModeChange === 'function') {
        onLandingModeChange(isLanding);
      }
    },

    isLandingMode: () => isLanding,

    async goToStop(stopIndexOrId, { immediate = false, reason = 'programmatic', keepLanding = false } = {}) {
      if (isLanding && !keepLanding) {
        controller.setLandingMode(false);
      }
      const nextIdx = resolveStopIndex(stopIndexOrId);
      const nextStop = stops[nextIdx] || stops[0];
      stopIndex = nextIdx;
      tau = nextIdx;
      emitStep(nextStop.step, { stopIndex: nextIdx, beat: 'settled', progress: 1 });
      syncBarDom();
      emitStopChange(nextIdx, nextStop, { immediate, reason });
      return nextStop;
    },

    setTau(nextTau, { scrubbing = false } = {}) {
      const clampedTau = clamp(Number(nextTau) || 0, 0, MAX_CONSTRUCTION_STEP);
      tau = clampedTau;
      if (scrubbing) {
        isPlaying = false;
        const nearestIdx = clamp(Math.round(clampedTau), 0, TOTAL_WALKTHROUGH_STOPS - 1);
        if (nearestIdx !== stopIndex) {
          stopIndex = nearestIdx;
          emitStopChange(nearestIdx, stops[nearestIdx], { immediate: true, reason: 'scrub' });
        }
      }
      emitStep(clampedTau, { stopIndex, beat: 'scrub', progress: clampedTau / MAX_CONSTRUCTION_STEP });
      syncBarDom();
      return tau;
    },

    nextStop() {
      controller.pause();
      const targetIdx = (stopIndex + 1) % TOTAL_WALKTHROUGH_STOPS;
      return controller.goToStop(targetIdx, { reason: 'next_btn' });
    },

    prevStop() {
      controller.pause();
      const targetIdx = (stopIndex - 1 + TOTAL_WALKTHROUGH_STOPS) % TOTAL_WALKTHROUGH_STOPS;
      return controller.goToStop(targetIdx, { reason: 'prev_btn' });
    },

    play() {
      if (isLanding) controller.setLandingMode(false);
      isPlaying = true;
      playTimerAcc = 0;
      syncBarDom();
      onPlayStateChange?.(true);
    },

    pause() {
      if (!isPlaying) return;
      isPlaying = false;
      syncBarDom();
      onPlayStateChange?.(false);
    },

    togglePlay() {
      if (isPlaying) controller.pause();
      else controller.play();
    },

    isPlaying: () => isPlaying,
    setSpeedMultiplier(m) {
      speedMultiplier = clamp(Number(m) || 1.0, 0.25, 4.0);
    },
    getSpeedMultiplier: () => speedMultiplier,

    notifyCanvasDragStart() {
      if (isPlaying) controller.pause();
    },

    hasActiveMotion: () => isPlaying,

    getPlaythroughState: () => ({
      isPlaying,
      stopIndex,
      tau,
      step,
      speedMultiplier,
      beat: isPlaying ? (stopIndex === 9 ? 'finale_orbit' : 'playing') : 'idle',
    }),

    update(dtSec) {
      if (!isPlaying || isLanding) return;
      const dt = clamp(Number(dtSec) || 0, 0, 0.2);
      if (dt <= 0) return;

      const weight = WALKTHROUGH_PACE_WEIGHTS[stopIndex] || 1.25;
      const holdDurSec = 4.2 * weight;
      playTimerAcc += dt * speedMultiplier;

      if (playTimerAcc >= holdDurSec) {
        playTimerAcc = 0;
        const nextIdx = (stopIndex + 1) % TOTAL_WALKTHROUGH_STOPS;
        controller.goToStop(nextIdx, { immediate: false, reason: 'autoplay' });
      }
    },

    dispose() {
      el.remove();
    },
  };

  for (const btn of detentEls) {
    btn.addEventListener('click', () => {
      controller.pause();
      const idx = Number(btn.dataset.stopIndex || 0);
      controller.goToStop(idx, { immediate: false, reason: 'rail_dot' });
    });
  }

  sliderEl.addEventListener('input', () => {
    controller.setTau(Number(sliderEl.value), { scrubbing: true });
  });

  sliderEl.addEventListener('change', () => {
    const snapIdx = clamp(Math.round(Number(sliderEl.value) || 0), 0, TOTAL_WALKTHROUGH_STOPS - 1);
    controller.goToStop(snapIdx, { immediate: false, reason: 'scrub_release' });
  });

  prevBtn.addEventListener('click', () => controller.prevStop());
  nextBtn.addEventListener('click', () => controller.nextStop());
  playBtn.addEventListener('click', () => controller.togglePlay());

  if (bindKeyboard && typeof window !== 'undefined') {
    window.addEventListener('keydown', (ev) => {
      if (ev.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(ev.target.tagName)) return;
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
        ev.preventDefault();
        controller.nextStop();
      } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        controller.prevStop();
      } else if (ev.key === ' ') {
        ev.preventDefault();
        controller.togglePlay();
      } else if (ev.key === 'Home') {
        ev.preventDefault();
        controller.pause();
        controller.goToStop(0, { reason: 'keyboard_home' });
      } else if (ev.key === 'End') {
        ev.preventDefault();
        controller.pause();
        controller.goToStop(TOTAL_WALKTHROUGH_STOPS - 1, { reason: 'keyboard_end' });
      }
    });
  }

  syncDomLabels();
  syncBarDom();
  controller.setLandingMode(isLanding, { silent: true });

  return controller;
}
