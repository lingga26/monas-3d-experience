/**
 * Monas 3D Experience — Main Exhibition Runtime (`app.js`)
 *
 * Interactive 3D museum exhibition of Monumen Nasional (Jakarta, 1961–1975):
 *   - 5 procedural Monas architectural zones (foundations/museum, Cawan 45×45m,
 *     marble obelisk/Puncak 115m, gilded 77-part Lidah Api 118–132m, cranes/falsework)
 *   - Lapangan Medan Merdeka environment & Silang Monas promenade
 *   - 10 chronological stops (step 0..9) + 5 Showcase 3D presets + 3 Jakarta moods (day/dusk/night)
 *   - Bilingual Indonesian (default) & English support + deep links (?stop=, ?lang=, ?mood=, ?intro=0, ?autoplay=)
 */

import { getStartupOrchestrator } from './startup_orchestrator.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import {
  createMonasLoadingManager,
  MONAS_ASSET_MANIFEST,
  yieldForDomPaint,
} from './model/asset_loading_manager.js';
import { TowerModelController } from './model/tower_controller.js';
import { upgradeWorldFloorAndSurfaceMaterials } from './model/floor_textures.js';
import { createAtmosphereController } from './world/atmosphere.js';
import { createMedanMerdekaWorld } from './world/medan_merdeka.js';
import { auditWorldSketchAndFog } from './world/distance_fog.js';
import { PhotoPortalSystem } from './portals/photo_portals.js';
import { createViewportConstraints } from './camera/viewport_constraints.js';
import { installStage3CameraChoreography } from './camera/walkthrough_camera_choreography.js';
import { createMuseumPlacard } from './story_and_archive/index.js';
import {
  mountExhibitionThemeAndDebug,
  HERO_FINALE_CAMERA,
  shouldStartInLandingMode,
  auditVisitorDomCompliance,
} from './ui/theme_and_debug_index.js';
import { installRuntimeFpsAndDrawCallOptimizations } from './perf/fps_and_drawcalls/index.js';

const BOOT_START_MS = typeof performance !== 'undefined' ? performance.now() : 0;

function detectInitialLang() {
  if (typeof window === 'undefined') return 'id';
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    return String(q || '').trim().toLowerCase() === 'en' ? 'en' : 'id';
  } catch {
    return 'id';
  }
}

function detectInitialMood() {
  if (typeof window === 'undefined') return 'day';
  try {
    const q = String(new URLSearchParams(window.location.search).get('mood') || '')
      .trim()
      .toLowerCase();
    return ['day', 'dusk', 'night'].includes(q) ? q : 'day';
  } catch {
    return 'day';
  }
}

function detectSoftwareRenderer(renderer) {
  try {
    const gl = renderer?.getContext?.();
    if (!gl) return false;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const name = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
    return /swiftshader|llvmpipe|software/i.test(name);
  } catch {
    return false;
  }
}

function dismissBootVeil(bootVeil) {
  if (!bootVeil) return;
  bootVeil.classList.add('is-fading');
  setTimeout(() => {
    bootVeil.hidden = true;
    bootVeil.setAttribute('aria-hidden', 'true');
  }, 460);
}

function showBootError(bootVeil, err) {
  if (!bootVeil) return;
  bootVeil.dataset.bootError = '1';
  bootVeil.classList.remove('is-fading');
  bootVeil.hidden = false;
  bootVeil.innerHTML = `
    <span class="boot-veil-eyebrow">Jakarta · Medan Merdeka</span>
    <span class="boot-veil-title">Monumen Nasional 3D</span>
    <p style="max-width:360px;text-align:center;font-size:13px;line-height:1.5;color:#b8c2d4;margin:8px 16px;">
      Peramban atau perangkat tidak dapat memulai tampilan WebGL 3D (${String(err?.message || 'WebGL error')}).
    </p>
    <button type="button" onclick="window.location.reload()" style="padding:9px 18px;border-radius:6px;border:1px solid #d4a93c;background:#d4a93c;color:#0b1426;font-weight:700;cursor:pointer;">
      Muat Ulang / Reload
    </button>
  `;
}

const ZONE_KEY_TO_ASSET = {
  zone1_foundations: 'models/monas_zone1_foundations',
  zone2_cawan: 'models/monas_zone2_cawan',
  zone3_shaft_puncak: 'models/monas_zone3_shaft_puncak',
  zone4_lidah_api: 'models/monas_zone4_lidah_api',
  zone5_cranes_falsework: 'models/monas_zone5_cranes',
};

async function initMonasExhibition() {
  const initialLang = detectInitialLang();
  const initialMood = detectInitialMood();
  document.documentElement.lang = initialLang;

  const canvas = document.getElementById('world-canvas');
  const uiRoot = document.getElementById('museum-ui-root');
  const bootVeil = document.getElementById('boot-veil');

  const assetLoader = createMonasLoadingManager({
    THREE,
    lang: initialLang,
    bootVeil,
  });
  assetLoader.registerManifest(MONAS_ASSET_MANIFEST);

  const orchestrator = getStartupOrchestrator();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'default',
    });
  }

  const isSoftwareWebGL = detectSoftwareRenderer(renderer);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSoftwareWebGL ? 1.0 : 2.0));
  renderer.setSize(Math.max(1, window.innerWidth), Math.max(1, window.innerHeight), false);

  // WebGL context loss resilience
  canvas.addEventListener('webglcontextlost', (ev) => {
    ev.preventDefault();
  });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    HERO_FINALE_CAMERA.fov,
    Math.max(1, window.innerWidth) / Math.max(1, window.innerHeight),
    0.5,
    2400.0
  );
  camera.position.set(...HERO_FINALE_CAMERA.position);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.85;
  controls.panSpeed = 0.55;
  controls.screenSpacePanning = false;
  controls.target.set(...HERO_FINALE_CAMERA.target);
  controls.update();

  const viewportConstraints = createViewportConstraints({ THREE, camera, controls });

  // 1. Atmosphere & Jakarta Lighting Rig + Sky/PMREM Environment Texture
  assetLoader.markAssetStartLabel('textures/atmosphere_sky_pmrem');
  const atmosphere = createAtmosphereController({
    THREE,
    scene,
    renderer,
    initialMood,
  });
  assetLoader.completeAsset('textures/atmosphere_sky_pmrem');
  await yieldForDomPaint();

  // 2. Medan Merdeka Environment Model
  assetLoader.markAssetStartLabel('models/medan_merdeka_world');
  const medanMerdekaWorld = createMedanMerdekaWorld({ THREE, scene });
  assetLoader.completeAsset('models/medan_merdeka_world');
  await yieldForDomPaint();

  // 3. 132 m Monas Monument (5 procedural zones tracked incrementally via LoadingManager)
  const towerController = new TowerModelController({ THREE, scene });
  await towerController.initStepByStep({
    onZoneBuilt: (zoneKey) => {
      const assetId = ZONE_KEY_TO_ASSET[zoneKey];
      if (assetId) assetLoader.completeAsset(assetId);
    },
    yieldFn: yieldForDomPaint,
  });
  towerController.attachRenderer(renderer);

  // 4. Procedural PBR Textures (Floor, Monas Monument, Jakarta Skyline/Pool) via Worker + GPU Hydration
  let pbrRaw = null;
  if (orchestrator?.pbrRawPromise) {
    try {
      pbrRaw = await orchestrator.pbrRawPromise;
    } catch {
      pbrRaw = null;
    }
  }

  try {
    assetLoader.markAssetStartLabel('textures/floor_pbr_maps');
    upgradeWorldFloorAndSurfaceMaterials(THREE, scene, pbrRaw?.floor || null);
    assetLoader.completeAsset('textures/floor_pbr_maps');
  } catch {
    assetLoader.failAsset('textures/floor_pbr_maps');
  }
  await yieldForDomPaint();

  try {
    assetLoader.markAssetStartLabel('textures/tower_pbr_maps');
    towerController.upgradePbrTextures(pbrRaw?.tower || null);
    assetLoader.completeAsset('textures/tower_pbr_maps');
  } catch {
    assetLoader.failAsset('textures/tower_pbr_maps');
  }
  await yieldForDomPaint();

  try {
    assetLoader.markAssetStartLabel('textures/jakarta_world_pbr_maps');
    medanMerdekaWorld.upgradePbr(pbrRaw?.world || null);
    assetLoader.completeAsset('textures/jakarta_world_pbr_maps');
  } catch {
    assetLoader.failAsset('textures/jakarta_world_pbr_maps');
  }

  assetLoader.flushPending();
  await assetLoader.waitForAllLoaded();
  await yieldForDomPaint();

  let appRef = null;

  const syncMoodFactor = (moodKey) => {
    const nightFactor = atmosphere.setMood(moodKey);
    towerController.setNightFactor(nightFactor);
    medanMerdekaWorld.setNightFactor(nightFactor);
    if (renderer?.shadowMap) renderer.shadowMap.needsUpdate = true;
  };
  syncMoodFactor(initialMood);

  // Camera Portal Adapter & Perf Optimizer
  const portalSystem = new PhotoPortalSystem({ camera, controls });
  await portalSystem.init();

  const placard = createMuseumPlacard(uiRoot, { lang: initialLang });

  const app = {
    ttflMs: null,
    scene,
    camera,
    controls,
    renderer,
    loadingManager: assetLoader.manager,
    textureLoader: assetLoader.textureLoader,
    getLoadingStats: () => assetLoader.getSnapshot(),
    towerController,
    medanMerdekaWorld,
    atmosphere,
    portalSystem,
    viewportConstraints,
    placard,
    museumUi: null,
    requestFrame: () => {},

    setStep: (val, { skipChapterSync = false } = {}) => {
      const clamped = towerController.setStep(val);
      if (!skipChapterSync && app.museumUi?.walkthrough && !app.museumUi.walkthrough.isPlaying()) {
        app.museumUi.walkthrough._step = clamped;
      }
      appRef?.requestFrame?.(2);
      return clamped;
    },
    getStep: () => towerController.getStep(),

    goToStop: (stopIndexOrId, opts = {}) => app.museumUi.walkthrough.goToStop(stopIndexOrId, opts),

    startExplore: async ({ immediate = false } = {}) => {
      app.museumUi?.exitLandingMode?.();
      return app.goToStop(0, { immediate: Boolean(immediate), reason: 'explore' });
    },

    setLanguage: (nextLang) => app.museumUi.header.setLanguage(nextLang, { emit: true }),
    getLanguage: () => app.museumUi.walkthrough.getLanguage(),

    setMood: (nextMood) => {
      syncMoodFactor(nextMood);
      app.museumUi?.header?.setMood(nextMood, { emit: false });
      app.requestFrame?.(3);
      return atmosphere.getMood();
    },
    getMood: () => atmosphere.getMood(),

    setRenderMode: (mode = 'pbr') => {
      const res = towerController.setRenderMode(mode);
      app.requestFrame?.(2);
      return res;
    },

    getMetrics: () => ({
      ttflMs: app.ttflMs,
      loading: assetLoader.getSnapshot(),
      step: towerController.getStep(),
      mood: atmosphere.getMood(),
      tower: towerController.getMetrics(),
      world: medanMerdekaWorld.getMetrics(),
      fogAudit: auditWorldSketchAndFog(scene),
      emissiveAudit: atmosphere.auditZeroEmissive(),
      domCompliance: auditVisitorDomCompliance(document.body),
      renderer: {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
      },
    }),
  };
  appRef = app;

  const perfState = installRuntimeFpsAndDrawCallOptimizations({
    THREE,
    app,
    scene,
    camera,
    renderer,
    towerController,
    medanMerdekaWorld,
    prewarmMode: 'idle',
  });

  const startInLanding = shouldStartInLandingMode();
  const museumUi = mountExhibitionThemeAndDebug({
    document,
    uiRoot,
    debugMountPoint: document.body,
    lang: initialLang,
    initialMood,
    initialStopIndex: 0,
    startInLanding,
    placard,
    app,
    towerController,
    atmosphere,
    scene,
    camera,
    controls,
    renderer,
    canvas,
    onExploreStart: () => {
      app.startExplore({ immediate: false });
    },
    onMoodChange: (nextMood) => {
      syncMoodFactor(nextMood);
      app.requestFrame?.(3);
    },
    onPureViewChange: () => {
      app.requestFrame?.(2);
    },
  });
  app.museumUi = museumUi;

  const cameraChoreography = installStage3CameraChoreography({
    THREE,
    app,
    camera,
    controls,
    canvas,
    portalSystem,
    viewportConstraints,
    walkthrough: museumUi.walkthrough,
    placard,
  });

  // Boot state: Landing shows complete 132 m Monas; deep link jumps straight to stop
  const bootParams = new URLSearchParams(window.location.search || '');
  if (startInLanding) {
    app.setStep(9.0);
    const bootPose = cameraChoreography.heroFinaleRig.activatePreset(
      'overview',
      window.innerWidth,
      window.innerHeight
    );
    await app.setCameraPose(bootPose, { immediate: true });
    museumUi.enterLandingMode();
  } else {
    museumUi.exitLandingMode();
    const stopParam = bootParams.get('stop');
    let bootStopIdx = 0;
    if (stopParam !== null && stopParam.trim() !== '') {
      const n = Number(stopParam);
      if (Number.isFinite(n)) {
        // Support 1-based `?stop=1..10` or 0-based `?stop=0` cleanly
        bootStopIdx = n >= 1 ? museumUi.walkthrough.resolveStopIndex(n - 1) : 0;
      } else {
        bootStopIdx = museumUi.walkthrough.resolveStopIndex(stopParam);
      }
    }
    await museumUi.walkthrough.goToStop(bootStopIdx, { immediate: true, reason: 'boot' });
    if (['1', 'true', 'yes'].includes(String(bootParams.get('autoplay') || '').toLowerCase())) {
      museumUi.walkthrough.play();
    }
  }

  // First Frame Paint & Cold TTFL
  renderer.render(scene, camera);
  const ttflMs = Number((performance.now() - BOOT_START_MS).toFixed(1));
  app.ttflMs = ttflMs;
  museumUi.debugDrawer.markFirstFrameRendered(ttflMs);
  dismissBootVeil(bootVeil);

  // Resize Listener
  window.addEventListener(
    'resize',
    () => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSoftwareWebGL ? 1.0 : 2.0));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      cameraChoreography.onResize(w, h);
      app.requestFrame?.(2);
    },
    { passive: true }
  );

  // Main Animation Loop
  let elapsedSec = 0;
  let lastNow = performance.now();
  let dirtyFrames = 3;
  let lastSwRenderEnd = 0;

  app.requestFrame = (n = 2) => {
    dirtyFrames = Math.max(dirtyFrames, Number(n) || 2);
  };
  controls.addEventListener('change', () => {
    dirtyFrames = Math.max(dirtyFrames, 2);
  });

  const tick = (now) => {
    requestAnimationFrame(tick);

    if (isSoftwareWebGL) {
      const hasUrgent =
        dirtyFrames > 0 ||
        museumUi.walkthrough.hasActiveMotion() ||
        Boolean(cameraChoreography.hasUrgentMotion?.());
      if (!hasUrgent) {
        if (!cameraChoreography.hasActiveMotion?.()) {
          lastNow = now;
          return;
        }
        if (performance.now() - lastSwRenderEnd < 260) return;
      }
    }

    const dt = Math.max(0, Math.min(0.15, (now - lastNow) / 1000));
    lastNow = now;
    elapsedSec += dt;
    if (dirtyFrames > 0) dirtyFrames -= 1;

    museumUi.update(dt);
    cameraChoreography.update(dt);
    towerController.update(dt, elapsedSec);

    if (controls.enabled) {
      controls.update();
      viewportConstraints.enforce();
    }

    renderer.render(scene, camera);
    if (isSoftwareWebGL) lastSwRenderEnd = performance.now();
  };
  requestAnimationFrame(tick);

  if (typeof window !== 'undefined') {
    window.__MONAS_APP__ = app;
    window.__MUSEUM_UI__ = museumUi;
    window.__MONAS_PERF__ = perfState;
  }

  return app;
}

initMonasExhibition().catch((err) => {
  console.error('[Monas 3D Experience] Initialization error:', err);
  showBootError(document.getElementById('boot-veil'), err);
});
