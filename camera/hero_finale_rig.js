/**
 * Monas 3D Showcase & Responsive Preset Rig (`camera/hero_finale_rig.js`)
 *
 * Implements the 5 curated Showcase 3D viewpoints (`Stop 10`) scaled to
 * 132 m Monumen Nasional for desktop (`1440×900`) and mobile portrait (`390×844`):
 *   - `overview`: Complete 132 m monument + Medan Merdeka framing
 *   - `lidah_api`: 14 m gilded Lidah Api crown close-up (118–132 m)
 *   - `pelataran_puncak`: 11 × 11 m Pelataran Puncak deck at 115 m
 *   - `cawan`: 45 × 45 m flaring Cawan chalice at 17 m + Ruang Kemerdekaan portals
 *   - `plaza`: Medan Merdeka reflecting pools, Silang avenues & upward skyline look
 */

import { flushOrbitControlsMomentum } from './viewport_constraints.js';

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function smoothstepCubic(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export const HERO_FINALE_CAMERA = Object.freeze({
  position: Object.freeze([108.0, 28.0, 178.0]),
  target: Object.freeze([0.0, 56.0, 0.0]),
  fov: 42.0,
});

export const HERO_SHOWCASE_PRESETS = Object.freeze({
  overview: Object.freeze({
    id: 'overview',
    desktop: Object.freeze({
      position: Object.freeze([108.0, 28.0, 178.0]),
      target: Object.freeze([0.0, 56.0, 0.0]),
      fov: 42.0,
    }),
    portrait: Object.freeze({
      position: Object.freeze([118.0, 32.0, 224.0]),
      target: Object.freeze([0.0, 44.0, 0.0]),
      fov: 52.0,
    }),
    motionMode: 'turntable',
    turntableAutoplayRadps: 0.04,
    turntableIdleRadps: 0.015,
  }),

  lidah_api: Object.freeze({
    id: 'lidah_api',
    desktop: Object.freeze({
      position: Object.freeze([22.0, 126.0, 30.0]),
      target: Object.freeze([-2.0, 125.0, 0.0]),
      fov: 34.0,
    }),
    portrait: Object.freeze({
      position: Object.freeze([28.0, 124.0, 42.0]),
      target: Object.freeze([0.0, 122.0, 0.0]),
      fov: 44.0,
    }),
    motionMode: 'parallax_sway',
    swayAzimuthRad: 0.05,
    swayElevM: 0.45,
    swayPeriodSec: 16.0,
  }),

  pelataran_puncak: Object.freeze({
    id: 'pelataran_puncak',
    desktop: Object.freeze({
      position: Object.freeze([28.0, 114.0, 38.0]),
      target: Object.freeze([-2.0, 113.0, 0.0]),
      fov: 36.0,
    }),
    portrait: Object.freeze({
      position: Object.freeze([36.0, 112.0, 52.0]),
      target: Object.freeze([0.0, 108.0, 0.0]),
      fov: 46.0,
    }),
    motionMode: 'parallax_sway',
    swayAzimuthRad: 0.045,
    swayElevM: 0.5,
    swayPeriodSec: 18.0,
  }),

  cawan: Object.freeze({
    id: 'cawan',
    desktop: Object.freeze({
      position: Object.freeze([52.0, 20.0, 68.0]),
      target: Object.freeze([-4.0, 13.0, 0.0]),
      fov: 38.0,
    }),
    portrait: Object.freeze({
      position: Object.freeze([66.0, 22.0, 92.0]),
      target: Object.freeze([0.0, 10.0, 0.0]),
      fov: 50.0,
    }),
    motionMode: 'parallax_sway',
    swayAzimuthRad: 0.045,
    swayElevM: 0.45,
    swayPeriodSec: 19.0,
  }),

  plaza: Object.freeze({
    id: 'plaza',
    desktop: Object.freeze({
      position: Object.freeze([85.0, 16.0, 118.0]),
      target: Object.freeze([0.0, 26.0, 0.0]),
      fov: 44.0,
    }),
    portrait: Object.freeze({
      position: Object.freeze([104.0, 18.0, 152.0]),
      target: Object.freeze([0.0, 22.0, 0.0]),
      fov: 54.0,
    }),
    motionMode: 'parallax_sway',
    swayAzimuthRad: 0.042,
    swayElevM: 0.4,
    swayPeriodSec: 20.0,
  }),
});

export function resolveResponsiveHeroPose(presetId = 'overview', vpWidth = 1440, vpHeight = 900) {
  const key = String(presetId || 'overview').trim();
  const spec = HERO_SHOWCASE_PRESETS[key] || HERO_SHOWCASE_PRESETS.overview;
  const aspect = Math.max(1, Number(vpWidth) || 1440) / Math.max(1, Number(vpHeight) || 900);
  const usePortrait = aspect < 0.82;
  const variant = usePortrait ? spec.portrait : spec.desktop;

  return {
    presetId: spec.id,
    isPortrait: usePortrait,
    position: [...variant.position],
    target: [...variant.target],
    fov: variant.fov,
    motionMode: spec.motionMode,
  };
}

export function createHeroFinaleRig({
  THREE,
  camera,
  controls,
  viewportConstraints = null,
  idleResumeDelaySec = 4.5,
  ambientMotionEnabled = true,
} = {}) {
  const tmpOffset = new THREE.Vector3();
  const tmpSpherical = new THREE.Spherical();

  let active = false;
  let activePresetId = 'overview';
  let ambientEnabled = Boolean(ambientMotionEnabled);
  let userInteracting = false;
  let idleSinceInputSec = idleResumeDelaySec;
  let swayPhaseSec = 0;
  let lastSwayThetaOffset = 0;
  let lastSwayYOffset = 0;

  function notifyUserInputStart() {
    userInteracting = true;
    idleSinceInputSec = 0;
    lastSwayThetaOffset = 0;
    lastSwayYOffset = 0;
  }

  function notifyUserInputEnd() {
    userInteracting = false;
    idleSinceInputSec = 0;
  }

  function activatePreset(presetId = 'overview', vpWidth = 1440, vpHeight = 900) {
    active = true;
    activePresetId = HERO_SHOWCASE_PRESETS[presetId] ? presetId : 'overview';
    userInteracting = false;
    idleSinceInputSec = idleResumeDelaySec;
    swayPhaseSec = 0;
    lastSwayThetaOffset = 0;
    lastSwayYOffset = 0;
    return resolveResponsiveHeroPose(activePresetId, vpWidth, vpHeight);
  }

  function deactivate() {
    active = false;
    swayPhaseSec = 0;
    lastSwayThetaOffset = 0;
    lastSwayYOffset = 0;
  }

  function setAmbientMotionEnabled(enabled) {
    ambientEnabled = Boolean(enabled);
  }

  function getActivePresetId() {
    return activePresetId;
  }

  function isActive() {
    return active;
  }

  function hasActiveAmbientMotion() {
    return Boolean(
      active && ambientEnabled && !userInteracting && idleSinceInputSec >= idleResumeDelaySec * 0.8
    );
  }

  function update(dtSec, { isAutoplayFinaleBeat = false, isCameraFlying = false, speedMultiplier = 1.0 } = {}) {
    if (!active || !ambientEnabled || isCameraFlying || !camera || !controls) {
      return false;
    }

    const dt = clamp(Number(dtSec) || 0, 0, 0.15);
    if (dt <= 0 || userInteracting) return false;

    idleSinceInputSec += dt;
    const spec = HERO_SHOWCASE_PRESETS[activePresetId] || HERO_SHOWCASE_PRESETS.overview;
    const rampWeight = isAutoplayFinaleBeat
      ? 1.0
      : smoothstepCubic((idleSinceInputSec - idleResumeDelaySec) / 1.6);

    if (rampWeight <= 1e-4) return false;

    if (spec.motionMode === 'turntable') {
      const rate = isAutoplayFinaleBeat
        ? spec.turntableAutoplayRadps * clamp(speedMultiplier, 0.2, 4.0)
        : spec.turntableIdleRadps;
      const dTheta = dt * rate * rampWeight;

      tmpOffset.copy(camera.position).sub(controls.target);
      const cosA = Math.cos(dTheta);
      const sinA = Math.sin(dTheta);
      const nx = tmpOffset.x * cosA + tmpOffset.z * sinA;
      const nz = -tmpOffset.x * sinA + tmpOffset.z * cosA;
      camera.position.set(controls.target.x + nx, camera.position.y, controls.target.z + nz);
      camera.lookAt(controls.target);
      flushOrbitControlsMomentum(controls, { spherical: true, pan: true });
      viewportConstraints?.enforce();
      return true;
    }

    if (spec.motionMode === 'parallax_sway') {
      swayPhaseSec += dt * rampWeight;
      const omega = (2.0 * Math.PI) / Math.max(4.0, spec.swayPeriodSec || 18.0);
      const nextThetaOff = (spec.swayAzimuthRad || 0.04) * Math.sin(omega * swayPhaseSec);
      const nextYOff = (spec.swayElevM || 0.45) * (1.0 - Math.cos(omega * swayPhaseSec)) * 0.5;

      const dTheta = nextThetaOff - lastSwayThetaOffset;
      const dY = nextYOff - lastSwayYOffset;
      lastSwayThetaOffset = nextThetaOff;
      lastSwayYOffset = nextYOff;

      tmpOffset.copy(camera.position).sub(controls.target);
      tmpSpherical.setFromVector3(tmpOffset);
      tmpSpherical.theta += dTheta;
      tmpOffset.setFromSpherical(tmpSpherical);

      camera.position.copy(controls.target).add(tmpOffset);
      camera.position.y += dY;
      camera.lookAt(controls.target);
      flushOrbitControlsMomentum(controls, { spherical: true, pan: true });
      viewportConstraints?.enforce();
      return true;
    }

    return false;
  }

  return {
    activate: ({ presetId = 'overview', vpWidth = 1440, vpHeight = 900 } = {}) =>
      activatePreset(presetId, vpWidth, vpHeight),
    activatePreset,
    deactivate,
    update,
    resetDeterministic() {
      userInteracting = false;
      idleSinceInputSec = idleResumeDelaySec;
      swayPhaseSec = 0;
      lastSwayThetaOffset = 0;
      lastSwayYOffset = 0;
    },
    notifyUserInputStart,
    notifyUserInputEnd,
    setAmbientMotionEnabled,
    getActivePresetId,
    isActive,
    hasActiveAmbientMotion,
    resolvePose: resolveResponsiveHeroPose,
  };
}
