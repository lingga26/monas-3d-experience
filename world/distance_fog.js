/**
 * Distance Fog & Horizon Dissolution Limits (`world/distance_fog.js`)
 *
 * Calibrated for the 132 m scale of Monumen Nasional inside Lapangan Medan Merdeka.
 */

export const WORLD_DISTANCE_LIMITS = {
  heroClearRadiusM: 120.0,
  fullMistClosureRadiusM: 640.0,
  cameraMaxRenderDistM: 920.0,
  worldGroundSkirtHalfExtentM: 1150.0,
};

export const EXHIBITION_FOG_PRESETS = {
  day: {
    color: 0xd5e2ee,
    near: 210.0,
    far: 1080.0,
  },
  dusk: {
    color: 0xc88d67,
    near: 195.0,
    far: 1020.0,
  },
  night: {
    color: 0x0e1a30,
    near: 185.0,
    far: 960.0,
  },
};

export function applyWorldSketchDistanceFog(THREE, scene, mood = 'day') {
  const preset = EXHIBITION_FOG_PRESETS[mood] || EXHIBITION_FOG_PRESETS.day;
  if (!scene.fog || !scene.fog.isFog) {
    scene.fog = new THREE.Fog(preset.color, preset.near, preset.far);
  } else {
    scene.fog.color.setHex(preset.color);
    scene.fog.near = preset.near;
    scene.fog.far = preset.far;
  }
  return preset;
}

export function auditWorldSketchAndFog(scene) {
  const hasWorld = Boolean(scene.getObjectByName('medan_merdeka_world'));
  const hasFog = Boolean(scene.fog && scene.fog.isFog);
  return {
    passed: hasWorld && hasFog,
    worldName: 'medan_merdeka_world',
    fogType: scene.fog ? (scene.fog.isFog ? 'THREE.Fog' : 'THREE.FogExp2') : 'none',
    fogNear: scene.fog?.near ?? null,
    fogFar: scene.fog?.far ?? null,
    heroClearRadiusM: WORLD_DISTANCE_LIMITS.heroClearRadiusM,
    skirtHalfExtentM: WORLD_DISTANCE_LIMITS.worldGroundSkirtHalfExtentM,
  };
}
