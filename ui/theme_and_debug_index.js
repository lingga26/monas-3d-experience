/**
 * Monas 3D Experience — UI Theme, Intro, Walkthrough & Debug Coordinator
 * (`ui/theme_and_debug_index.js`)
 */

export * from './palette_tokens.js';
export * from './museum_header.js';
export * from './walkthrough_controller.js';
export * from './debug_drawer.js';
export * from './landing_intro.js';
export * from './controls_hint.js';

import {
  applyRootPaletteTokens,
  auditVisitorDomCompliance,
  auditStage5NeutralUiCompliance,
  auditStage6UiCompliance,
} from './palette_tokens.js';
import { createMuseumHeader } from './museum_header.js';
import { createWalkthroughController, HERO_FINALE_CAMERA } from './walkthrough_controller.js';
import { createDebugDrawer, auditZeroEmissive } from './debug_drawer.js';
import { createLandingIntro, shouldStartInLandingMode } from './landing_intro.js';
import { createControlsHint } from './controls_hint.js';

export function mountExhibitionThemeAndDebug(ctx = {}) {
  const doc = ctx.document || (typeof document !== 'undefined' ? document : null);
  const lang = ctx.lang || 'id';
  const initialMood = ctx.initialMood || 'day';
  const initialLanding =
    ctx.startInLanding !== undefined
      ? Boolean(ctx.startInLanding)
      : shouldStartInLandingMode(ctx.searchString);

  if (doc?.documentElement) {
    applyRootPaletteTokens(doc.documentElement);
  }

  const appAdapter = ctx.appAdapter || {
    setStep: (step) => {
      ctx.towerController?.setStep?.(step);
      ctx.app?.setStep?.(step, { skipChapterSync: true });
    },
  };

  let header = null;
  let walkthrough = null;
  let debugDrawer = null;
  let landingIntro = null;
  let controlsHint = null;

  const isLandingMode = () => Boolean(landingIntro?.isActive?.() || walkthrough?.isLandingMode?.());

  const enterLandingMode = () => {
    landingIntro?.setActive?.(true);
    walkthrough?.setLandingMode?.(true, { silent: true });
  };

  const exitLandingMode = () => {
    const was = isLandingMode();
    landingIntro?.setActive?.(false);
    walkthrough?.setLandingMode?.(false, { silent: true });
    return was;
  };

  const handleExploreStart = () => {
    exitLandingMode();
    if (typeof ctx.onExploreStart === 'function') {
      ctx.onExploreStart();
    } else if (typeof ctx.app?.startExplore === 'function') {
      ctx.app.startExplore();
    } else {
      walkthrough?.goToStop?.(0, { immediate: false, reason: 'explore' });
    }
  };

  landingIntro = createLandingIntro({
    parent: ctx.uiRoot || null,
    lang,
    active: initialLanding,
    onExplore: handleExploreStart,
  });

  walkthrough = createWalkthroughController({
    parent: ctx.uiRoot || null,
    lang,
    initialStopIndex: ctx.initialStopIndex ?? 0,
    bindKeyboard: ctx.bindKeyboard !== false,
    landingMode: initialLanding,
    appAdapter,
    onLandingModeChange: (active) => {
      landingIntro?.setActive?.(active);
    },
    onStopChange: (payload) => {
      ctx.placard?.setStop?.(payload.stopNumber, { stop: payload.stop });
      if (typeof ctx.onStopChange === 'function') ctx.onStopChange(payload);
    },
    onStepChange: (step, meta) => {
      ctx.towerController?.setStep?.(step);
      if (typeof ctx.onStepChange === 'function') ctx.onStepChange(step, meta);
    },
  });

  if (ctx.placard) {
    ctx.placard.onRestartTour = () => {
      walkthrough.goToStop(0, { immediate: false, reason: 'restart' });
    };
  }

  controlsHint = createControlsHint({
    parent: ctx.uiRoot || null,
    lang,
  });

  header = createMuseumHeader({
    parent: ctx.uiRoot || null,
    lang,
    initialMood,
    enablePureViewButton: ctx.enablePureViewButton !== false,
    onLanguageChange: (nextLang) => {
      landingIntro?.setLanguage?.(nextLang);
      walkthrough?.setLanguage?.(nextLang);
      controlsHint?.setLanguage?.(nextLang);
      ctx.placard?.setLanguage?.(nextLang);
      if (doc?.documentElement) doc.documentElement.lang = nextLang;
      if (typeof ctx.onLanguageChange === 'function') ctx.onLanguageChange(nextLang);
    },
    onMoodChange: (nextMood) => {
      if (typeof ctx.onMoodChange === 'function') ctx.onMoodChange(nextMood);
    },
    onPureViewChange: ctx.onPureViewChange || null,
  });

  debugDrawer = createDebugDrawer({
    mountPoint: ctx.debugMountPoint || doc?.body || null,
    app: ctx.app || null,
    towerController: ctx.towerController || null,
    atmosphere: ctx.atmosphere || null,
    renderer: ctx.renderer || null,
  });

  const targetCanvas = ctx.canvas || ctx.renderer?.domElement || null;
  const onCanvasPointerDown = () => walkthrough?.notifyCanvasDragStart?.();
  if (targetCanvas) {
    targetCanvas.addEventListener('pointerdown', onCanvasPointerDown, { passive: true });
  }

  return {
    header,
    walkthrough,
    debugDrawer,
    landingIntro,
    controlsHint,
    heroFinaleCamera: HERO_FINALE_CAMERA,
    enterLandingMode,
    exitLandingMode,
    isLandingMode,
    startExplore: handleExploreStart,
    update: (dtSec) => {
      walkthrough?.update?.(dtSec);
      debugDrawer?.update?.(dtSec);
    },
    auditVisitorCompliance: () => auditVisitorDomCompliance(doc?.body),
    auditStage5NeutralUi: () => auditStage5NeutralUiCompliance(doc),
    auditStage6Ui: () => auditStage6UiCompliance(doc),
    auditSceneZeroEmissive: (opts) => auditZeroEmissive(ctx.scene, opts),
    dispose: () => {
      if (targetCanvas) targetCanvas.removeEventListener('pointerdown', onCanvasPointerDown);
      debugDrawer?.destroy?.();
      controlsHint?.dispose?.();
      landingIntro?.dispose?.();
      walkthrough?.dispose?.();
      header?.dispose?.();
    },
  };
}
