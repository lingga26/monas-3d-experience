/**
 * Monas 3D Experience — Walkthrough Camera & Step Choreography (`camera/walkthrough_camera_choreography.js`)
 *
 * Connects smooth stop-to-stop camera flights, continuous timeline scrubbing (`tau ∈ [0..9]`),
 * Showcase 3D presets (`overview`, `lidah_api`, `pelataran_puncak`, `cawan`, `plaza`),
 * and free OrbitControls drag handling.
 */

import {
  createHeroFinaleRig,
  resolveResponsiveHeroPose,
  HERO_SHOWCASE_PRESETS,
} from './hero_finale_rig.js';
import { flushOrbitControlsMomentum } from './viewport_constraints.js';
import { getWalkthroughStop } from '../story_and_archive/walkthrough_data.js';

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstepCubic(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export function evaluateScrubExteriorPose(tau, vpWidth = 1440, vpHeight = 900, maxTau = 9.0) {
  const denom = Math.max(1.0, Number(maxTau) || 9.0);
  const u = clamp((Number(tau) || 0) / denom, 0, 1);
  const s = smoothstepCubic(u);
  const aspect = Math.max(1, vpWidth) / Math.max(1, vpHeight);
  const isPortrait = aspect < 0.82;

  const angle = lerp(0.32, 0.62, s);
  const dist = isPortrait ? lerp(112.0, 236.0, s) : lerp(92.0, 198.0, s);
  const camY = isPortrait ? lerp(20.0, 34.0, s) : lerp(18.0, 30.0, s);
  const tgtY = isPortrait ? lerp(6.0, 44.0, s) : lerp(8.0, 56.0, s);

  return {
    position: [Math.sin(angle) * dist, camY, Math.cos(angle) * dist],
    target: [0.0, tgtY, 0.0],
    fov: isPortrait ? 52.0 : 42.0,
  };
}

export function installStage3CameraChoreography({
  THREE,
  app,
  camera,
  controls,
  canvas,
  portalSystem,
  viewportConstraints,
  walkthrough,
  placard,
} = {}) {
  if (!THREE || !app || !camera || !controls || !viewportConstraints || !walkthrough) {
    throw new Error('installStage3CameraChoreography requires core app, camera, controls, and walkthrough');
  }

  const heroFinaleRig = createHeroFinaleRig({
    THREE,
    camera,
    controls,
    viewportConstraints,
    idleResumeDelaySec: 4.5,
    ambientMotionEnabled: true,
  });

  let activeFlight = null;
  let stepGlide = null;
  let scrubState = { active: false, desiredPose: null };
  let lastPortrait =
    (typeof window !== 'undefined' ? window.innerWidth : 1440) /
      Math.max(1, typeof window !== 'undefined' ? window.innerHeight : 900) <
    0.82;

  if (canvas) {
    const onInputStart = () => {
      heroFinaleRig.notifyUserInputStart();
      if (activeFlight) {
        activeFlight = null;
        controls.enabled = true;
      }
    };
    const onInputEnd = () => heroFinaleRig.notifyUserInputEnd();
    canvas.addEventListener('pointerdown', onInputStart, { passive: true });
    canvas.addEventListener('touchstart', onInputStart, { passive: true });
    canvas.addEventListener('wheel', () => {
      heroFinaleRig.notifyUserInputStart();
      heroFinaleRig.notifyUserInputEnd();
    }, { passive: true });
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerup', onInputEnd, { passive: true });
      window.addEventListener('touchend', onInputEnd, { passive: true });
    }
  }

  function flyToPose(pose, opts = {}) {
    if (!pose) return Promise.resolve();
    const duration = Number(opts?.duration ?? pose?.duration ?? 1.35);
    const immediate = Boolean(opts?.immediate ?? pose?.immediate ?? false);
    const pos = pose.position || pose.pos;
    const tgt = pose.target;
    const fov = Number(pose.fov) || 42.0;

    if (immediate || duration <= 0.05) {
      activeFlight = null;
      camera.clearViewOffset();
      camera.position.set(pos[0], pos[1], pos[2]);
      controls.target.set(tgt[0], tgt[1], tgt[2]);
      camera.fov = fov;
      camera.lookAt(controls.target);
      camera.updateProjectionMatrix();
      flushOrbitControlsMomentum(controls, { spherical: true, pan: true });
      controls.enabled = true;
      controls.update();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      activeFlight = {
        elapsed: 0,
        duration: Math.max(0.25, duration),
        startPos: camera.position.toArray(),
        endPos: [...pos],
        startTgt: controls.target.toArray(),
        endTgt: [...tgt],
        startFov: camera.fov,
        endFov: fov,
        resolve,
      };
      controls.enabled = false;
      app.requestFrame?.(3);
    });
  }

  app.setCameraPose = flyToPose;

  heroFinaleRig.flyToPreset = (presetId = 'overview', { duration = 1.2, immediate = false } = {}) => {
    walkthrough.pause();
    stepGlide = null;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
    const pose = heroFinaleRig.activatePreset(presetId, vw, vh);
    placard?.setActiveHeroPreset?.(pose.presetId);
    return flyToPose(pose, { duration, immediate });
  };

  if (placard) {
    placard.onSelectHeroPreset = (preset) => {
      if (!preset) return;
      const presetId = preset.presetId || preset.id || 'overview';
      heroFinaleRig.flyToPreset(presetId, { duration: 1.2, immediate: false });
    };
  }

  function resolveStopPose(stopIndexOrObj, vpWidth, vpHeight) {
    const idx =
      typeof stopIndexOrObj === 'number'
        ? stopIndexOrObj
        : (stopIndexOrObj?.index ?? walkthrough.getStopIndex?.() ?? 0);
    const stopData = getWalkthroughStop(idx, walkthrough.getLanguage?.() || 'id');
    const isPortrait = vpWidth / Math.max(1, vpHeight) < 0.82;
    const camSpec = isPortrait ? stopData.camera.mobile : stopData.camera.desktop;
    return {
      position: [...camSpec.pos],
      target: [...camSpec.target],
      fov: camSpec.fov,
    };
  }

  const origGoToStop = walkthrough.goToStop.bind(walkthrough);
  walkthrough.goToStop = async function monasGoToStop(
    stopIndexOrId,
    { immediate = false, reason = 'programmatic', keepLanding = false } = {}
  ) {
    scrubState.active = false;
    scrubState.desiredPose = null;

    if (this._landingMode && !keepLanding && !(immediate && reason === 'boot')) {
      this.setLandingMode(false);
    }

    const nextIdx = this.resolveStopIndex(stopIndexOrId);
    const nextStop = this._stops[nextIdx];
    if (!nextStop) {
      return origGoToStop(stopIndexOrId, { immediate, reason, keepLanding });
    }

    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;

    if (nextStop.isShowcase) {
      const heroPose = heroFinaleRig.activatePreset('overview', vw, vh);
      placard?.setActiveHeroPreset?.('overview');
      if (immediate) {
        stepGlide = null;
        this._stopIndex = nextIdx;
        this._tau = nextIdx;
        this._step = nextStop.step;
        this._emitStep(nextStop.step, { stopIndex: nextIdx, beat: 'settled', progress: 1 });
        this._emitStopChange(nextIdx, nextStop, { immediate: true, reason });
        this._syncBarDom();
        await flyToPose(heroPose, { immediate: true });
        return nextStop;
      }
    } else {
      heroFinaleRig.deactivate();
    }

    if (immediate) {
      stepGlide = null;
      this._stopIndex = nextIdx;
      this._tau = nextIdx;
      this._step = nextStop.step;
      this._emitStep(nextStop.step, { stopIndex: nextIdx, beat: 'settled', progress: 1 });
      this._emitStopChange(nextIdx, nextStop, { immediate: true, reason });
      this._syncBarDom();
      const pose = resolveStopPose(nextIdx, vw, vh);
      await flyToPose(pose, { immediate: true });
      app.requestFrame?.(2);
      return nextStop;
    }

    const startStep = Number.isFinite(app.getStep?.()) ? app.getStep() : this._step;
    const targetStep = nextStop.step;
    const stepDelta = Math.abs(targetStep - startStep);
    const durSec = clamp(1.15 + stepDelta * 0.22, 1.15, 2.25);

    this._stopIndex = nextIdx;
    this._tau = nextIdx;
    this._syncBarDom();
    this._emitStopChange(nextIdx, nextStop, { immediate: false, reason });

    if (stepDelta > 1e-3) {
      stepGlide = {
        startStep,
        targetStep,
        stopIndex: nextIdx,
        elapsed: 0,
        duration: durSec * 0.9,
      };
    } else {
      stepGlide = null;
      this._step = targetStep;
      this._emitStep(targetStep, { stopIndex: nextIdx, beat: 'settled', progress: 1 });
    }

    const pose = nextStop.isShowcase
      ? resolveResponsiveHeroPose('overview', vw, vh)
      : resolveStopPose(nextIdx, vw, vh);

    await flyToPose(pose, { duration: durSec, immediate: false });
    stepGlide = null;
    this._step = targetStep;
    this._emitStep(targetStep, { stopIndex: nextIdx, beat: 'settled', progress: 1 });
    app.requestFrame?.(2);
    return nextStop;
  };

  const origSetTau = walkthrough.setTau.bind(walkthrough);
  walkthrough.setTau = function monasSetTau(tau, opts = {}) {
    const scrubbing = Boolean(opts?.scrubbing);
    if (!scrubbing) {
      scrubState.active = false;
      scrubState.desiredPose = null;
      return origSetTau(tau, opts);
    }

    stepGlide = null;
    activeFlight = null;
    controls.enabled = true;
    heroFinaleRig.deactivate();

    const resTau = origSetTau(tau, opts);
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
    scrubState.active = true;
    scrubState.desiredPose = evaluateScrubExteriorPose(resTau, vw, vh, 9.0);
    app.requestFrame?.(2);
    return resTau;
  };

  function update(dtSec) {
    const dt = clamp(Number(dtSec) || 0, 0, 0.2);
    if (dt <= 0) return;

    if (stepGlide) {
      stepGlide.elapsed += dt;
      const u = clamp(stepGlide.elapsed / stepGlide.duration, 0, 1);
      const eased = smoothstepCubic(u);
      const nextStep = lerp(stepGlide.startStep, stepGlide.targetStep, eased);
      walkthrough._step = nextStep;
      walkthrough._emitStep(nextStep, {
        stopIndex: stepGlide.stopIndex,
        beat: 'interactive_flight',
        progress: eased,
      });
      if (u >= 1) stepGlide = null;
    }

    if (activeFlight) {
      activeFlight.elapsed += dt;
      const u = clamp(activeFlight.elapsed / activeFlight.duration, 0, 1);
      const e = smoothstepCubic(u);
      camera.position.set(
        lerp(activeFlight.startPos[0], activeFlight.endPos[0], e),
        lerp(activeFlight.startPos[1], activeFlight.endPos[1], e),
        lerp(activeFlight.startPos[2], activeFlight.endPos[2], e)
      );
      controls.target.set(
        lerp(activeFlight.startTgt[0], activeFlight.endTgt[0], e),
        lerp(activeFlight.startTgt[1], activeFlight.endTgt[1], e),
        lerp(activeFlight.startTgt[2], activeFlight.endTgt[2], e)
      );
      camera.fov = lerp(activeFlight.startFov, activeFlight.endFov, e);
      camera.lookAt(controls.target);
      camera.updateProjectionMatrix();

      if (u >= 1) {
        const done = activeFlight;
        activeFlight = null;
        flushOrbitControlsMomentum(controls, { spherical: true, pan: true });
        controls.enabled = true;
        controls.update();
        done.resolve();
      }
    } else if (scrubState.active && scrubState.desiredPose) {
      const alpha = 1.0 - Math.exp(-dt * 8.0);
      const dp = scrubState.desiredPose;
      camera.position.x = lerp(camera.position.x, dp.position[0], alpha);
      camera.position.y = lerp(camera.position.y, dp.position[1], alpha);
      camera.position.z = lerp(camera.position.z, dp.position[2], alpha);
      controls.target.x = lerp(controls.target.x, dp.target[0], alpha);
      controls.target.y = lerp(controls.target.y, dp.target[1], alpha);
      controls.target.z = lerp(controls.target.z, dp.target[2], alpha);
      camera.fov = lerp(camera.fov, dp.fov, alpha);
      camera.lookAt(controls.target);
      camera.updateProjectionMatrix();
      viewportConstraints.enforce();
    }

    const activeStop = walkthrough.getActiveStop?.();
    const inLanding = Boolean(app.isLandingMode?.());
    const onHero3D = Boolean(activeStop?.isShowcase || inLanding);

    if (onHero3D && !heroFinaleRig.isActive() && !activeFlight) {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
      heroFinaleRig.activatePreset('overview', vw, vh);
    } else if (!onHero3D && heroFinaleRig.isActive()) {
      heroFinaleRig.deactivate();
    }

    if (heroFinaleRig.isActive() && !activeFlight) {
      heroFinaleRig.update(dt, {
        isAutoplayFinaleBeat: onHero3D && walkthrough.isPlaying?.() && !inLanding,
        isCameraFlying: Boolean(activeFlight),
        speedMultiplier: 1.0,
      });
    }
  }

  function onResize(width, height) {
    const w = Math.max(1, Number(width) || 1440);
    const h = Math.max(1, Number(height) || 900);
    const nowPortrait = w / h < 0.82;
    if (nowPortrait !== lastPortrait && heroFinaleRig.isActive() && !activeFlight) {
      const pose = resolveResponsiveHeroPose(heroFinaleRig.getActivePresetId(), w, h);
      flyToPose(pose, { immediate: true });
    }
    lastPortrait = nowPortrait;
  }

  portalSystem?.setViewportConstraints?.(viewportConstraints);

  app.heroFinaleRig = heroFinaleRig;
  app.cameraChoreography = {
    heroFinaleRig,
    update,
    onResize,
    hasUrgentMotion: () => Boolean(activeFlight || stepGlide || scrubState.active),
    hasActiveMotion: () =>
      Boolean(activeFlight || stepGlide || scrubState.active || heroFinaleRig.hasActiveAmbientMotion()),
  };

  app.auditCameraAndViewport = () => ({
    heroFinaleState: {
      active: heroFinaleRig.isActive(),
      activePresetId: heroFinaleRig.getActivePresetId(),
      presetsAvailable: Object.keys(HERO_SHOWCASE_PRESETS),
    },
  });

  return app.cameraChoreography;
}
