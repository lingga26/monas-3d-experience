/**
 * Monas 3D Experience — Procedural Tower Controller (`model/tower_controller.js`)
 *
 * Assembles the 5 procedural Monas architectural zones (1 unit = 1 meter, total 132 m),
 * connects continuous step-driven kinematics (`step ∈ [0, 9]`), and preserves the exact
 * controller API expected by `app.js`, `camera/`, and `perf/fps_and_drawcalls/`.
 */

import {
  createMaterials,
  upgradeTowerMaterialsAndDecks,
  createOverrideMaterials,
  applyRenderModeToGroup,
} from './materials.js';
import { BuildKinematicsEngine } from './build_kinematics.js';
import { buildMonasZone1Foundations } from './modules/monas_zone1_foundations.js';
import { buildMonasZone2Cawan } from './modules/monas_zone2_cawan.js';
import { buildMonasZone3ShaftPuncak } from './modules/monas_zone3_shaft_puncak.js';
import { buildMonasZone4LidahApi } from './modules/monas_zone4_lidah_api.js';
import { buildMonasZone5Cranes } from './modules/monas_zone5_falsework_cranes.js';

export const MONAS_ZONE_DEFS = [
  { key: 'zone1_foundations', label: 'Pondasi & Museum Bawah Tanah' },
  { key: 'zone2_cawan', label: 'Pelataran Cawan 17 m (45 × 45 m)' },
  { key: 'zone3_shaft_puncak', label: 'Batang Tugu & Pelataran Puncak 115 m' },
  { key: 'zone4_lidah_api', label: 'Lidah Api Emas (118–132 m)' },
  { key: 'zone5_cranes_falsework', label: 'Derek & Perancah Konstruksi' },
];

export class TowerModelController {
  constructor({ THREE, scene }) {
    this.THREE = THREE;
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'monas_monument_root';

    this.materials = createMaterials(THREE);
    this.overrideMaterials = createOverrideMaterials(THREE);
    this.zones = {};
    this.kinematics = null;

    this._step = 9.0;
    this._nightFactor = 0.0;
    this._renderMode = 'pbr';
    this._deterministicElapsed = 0;
    this._renderer = null;
    this._pbrUpgraded = false;
  }

  init() {
    if (Object.keys(this.zones).length > 0) return this.root;

    const z1 = buildMonasZone1Foundations(this.THREE, this.materials);
    const z2 = buildMonasZone2Cawan(this.THREE, this.materials);
    const z3 = buildMonasZone3ShaftPuncak(this.THREE, this.materials);
    const z4 = buildMonasZone4LidahApi(this.THREE, this.materials);
    const z5 = buildMonasZone5Cranes(this.THREE, this.materials);

    this.zones = {
      zone1_foundations: z1,
      zone2_cawan: z2,
      zone3_shaft_puncak: z3,
      zone4_lidah_api: z4,
      zone5_cranes_falsework: z5,
    };

    this.root.add(z1, z2, z3, z4, z5);
    this.scene.add(this.root);

    this.kinematics = new BuildKinematicsEngine(this.THREE, this.root, this.materials);
    this.setStep(9.0);
    return this.root;
  }

  async initStepByStep({ onZoneBuilt = null, yieldFn = null } = {}) {
    if (Object.keys(this.zones).length > 0) return this.root;

    const builders = [
      ['zone1_foundations', buildMonasZone1Foundations],
      ['zone2_cawan', buildMonasZone2Cawan],
      ['zone3_shaft_puncak', buildMonasZone3ShaftPuncak],
      ['zone4_lidah_api', buildMonasZone4LidahApi],
      ['zone5_cranes_falsework', buildMonasZone5Cranes],
    ];

    this.zones = {};
    for (let i = 0; i < builders.length; i++) {
      const [key, buildFn] = builders[i];
      const zoneGroup = buildFn(this.THREE, this.materials);
      this.zones[key] = zoneGroup;
      this.root.add(zoneGroup);
      if (typeof onZoneBuilt === 'function') {
        onZoneBuilt(key, zoneGroup, i, builders.length);
      }
      if (typeof yieldFn === 'function') {
        await yieldFn();
      }
    }

    this.scene.add(this.root);
    this.kinematics = new BuildKinematicsEngine(this.THREE, this.root, this.materials);
    this.setStep(9.0);
    return this.root;
  }

  upgradePbrTextures(precomputedTowerRawBank = null) {
    if (this._pbrUpgraded && !precomputedTowerRawBank) return;
    upgradeTowerMaterialsAndDecks(this.THREE, this.materials, precomputedTowerRawBank);
    this._pbrUpgraded = true;
  }

  attachRenderer(renderer) {
    this._renderer = renderer;
  }

  setStep(stepValue) {
    const clamped = Math.max(0.0, Math.min(9.0, Number(stepValue) || 0));
    this._step = clamped;
    if (this.kinematics) {
      this.kinematics.evaluateAtStep(clamped);
    }
    return this._step;
  }

  getStep() {
    return this._step;
  }

  setNightFactor(t) {
    const f = Math.max(0, Math.min(1, Number(t) || 0));
    this._nightFactor = f;
    // Note: Keep emissive strictly 0 on architectural surfaces; night illumination of Lidah Api
    // comes from physical warm SpotLight & PointLight rig in world/atmosphere.js!
    if (this.materials?.goldFlame) {
      this.materials.goldFlame.emissive.setHex(0x000000);
      this.materials.goldFlame.emissiveIntensity = 0.0;
    }
    return this._nightFactor;
  }

  getNightFactor() {
    return this._nightFactor;
  }

  setZoneVisibility(zoneKey, visible) {
    const z = this.zones?.[zoneKey];
    if (z) z.visible = Boolean(visible);
  }

  setRenderMode(mode = 'pbr') {
    const next = String(mode || 'pbr').toLowerCase();
    this._renderMode = next;
    applyRenderModeToGroup(this.root, next, this.overrideMaterials);
    return this._renderMode;
  }

  resetDeterministicClock() {
    this._deterministicElapsed = 0;
  }

  update(dt, elapsedSec) {
    const nextElapsed = Number.isFinite(elapsedSec)
      ? elapsedSec
      : (this._deterministicElapsed += Math.max(0, Math.min(0.1, dt || 0.016)));
    if (this.kinematics) {
      this.kinematics.update(dt, nextElapsed);
    }
  }

  getKinematicsTelemetry() {
    return this.kinematics ? this.kinematics.getTelemetry() : { step: this._step, totalPieces: 0 };
  }

  getPieceStats() {
    let meshCount = 0;
    let triangleCount = 0;
    this.root.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry) return;
      meshCount++;
      const geo = obj.geometry;
      const count = obj.isInstancedMesh ? obj.count : 1;
      if (geo.index) {
        triangleCount += (geo.index.count / 3) * count;
      } else if (geo.attributes?.position) {
        triangleCount += (geo.attributes.position.count / 3) * count;
      }
    });
    return {
      meshCount,
      triangleCount: Math.round(triangleCount),
      zones: Object.keys(this.zones),
    };
  }

  getMetrics() {
    const stats = this.getPieceStats();
    return {
      heightM: 132.0,
      cawanHeightM: 17.0,
      cawanSizeM: 45.0,
      puncakHeightM: 115.0,
      puncakSizeM: 11.0,
      lidahApiHeightM: 14.0,
      museumSizeM: 80.0,
      ...stats,
      kinematics: this.getKinematicsTelemetry(),
    };
  }
}
