/**
 * Monas 3D Experience — Continuous Construction Kinematics Engine (`model/build_kinematics.js`)
 *
 * Evaluates smooth monotonic construction transforms across `step ∈ [0.0, 9.0]`
 * with zero geometry pops, zero floating pieces, and live elevator/crane motion.
 */

export const MECHANISM_FAMILIES = [
  'survey_guide',
  'rise_scale_y',
  'pile_hammer_drive',
  'basement_excavate_pour',
  'roof_slab_seal',
  'cawan_flare_assemble',
  'core_slipform_extrude',
  'marble_panel_sheathe',
  'elevator_puncak_install',
  'lidah_api_assemble',
  'lidah_petal_converge',
  'crane_scaffold_dismantle',
  'scaffold_fade_band',
];

export const CALIBRATED_PNP_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function clamp01(v) {
  return v <= 0 ? 0 : v >= 1 ? 1 : v;
}

function smoothstep01(t) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function rangeProgress(step, s0, s1) {
  if (s1 <= s0) return step >= s0 ? 1 : 0;
  return smoothstep01((step - s0) / (s1 - s0));
}

export class BuildKinematicsEngine {
  constructor(THREE, towerRoot, materials) {
    this.THREE = THREE;
    this.towerRoot = towerRoot;
    this.materials = materials;
    this.pieces = [];
    this.step = 9.0;
    this.elapsedSec = 0;
    this.elevatorCabin = null;
    this.craneJibPivot = null;
    this._dummyObj = new THREE.Object3D();
    this._indexPieces();
  }

  _indexPieces() {
    this.pieces = [];
    this.towerRoot.traverse((node) => {
      if (node.name === 'm3_elevator_cabin') {
        this.elevatorCabin = node;
      }
      if (node.name === 'm5_crane_jib_pivot') {
        this.craneJibPivot = node;
      }
      const meta = node.userData?.kinematics;
      if (meta && meta.kind) {
        node.userData.origScale = node.scale.clone();
        node.userData.origPos = node.position.clone();
        node.userData.origRot = node.rotation.clone();
        this.pieces.push({ node, meta });
      }
    });
  }

  evaluateAtStep(stepVal) {
    const step = Math.max(0, Math.min(9.0, Number(stepVal) || 0));
    this.step = step;

    for (let i = 0; i < this.pieces.length; i++) {
      const { node, meta } = this.pieces[i];
      const kind = meta.kind;

      if (kind === 'survey_guide') {
        const fadeOut = 1.0 - rangeProgress(step, meta.fadeStart ?? 1.8, meta.fadeEnd ?? 2.8);
        node.visible = fadeOut > 0.01;
        if (node.visible) {
          node.scale.set(1, Math.max(0.05, fadeOut), 1);
        }
        continue;
      }

      if (kind === 'rise_scale_y') {
        const p = rangeProgress(step, meta.startStep, meta.fullStep);
        node.visible = p > 0.005;
        if (node.visible) {
          node.scale.set(1, Math.max(0.02, p), 1);
          node.position.y = (meta.originY || 0) * (1 - p);
        }
        continue;
      }

      if (kind === 'pile_hammer_drive') {
        const p = rangeProgress(step, meta.startStep, meta.fullStep);
        // Piles stay visible as soon as driving begins, sinking cleanly downward below floor slab
        const hideWhenCovered = step > 3.6 ? Math.max(0, 1 - (step - 3.6) * 2.5) : 1.0;
        node.visible = p > 0.005 && hideWhenCovered > 0.01;
        if (node.visible) {
          const inst = node.children[0];
          const basePositions = inst?.userData?.basePositions;
          const pileCount = inst?.userData?.pileCount || 0;
          if (inst && basePositions) {
            const dummy = this._dummyObj;
            for (let k = 0; k < pileCount; k++) {
              const bx = basePositions[k * 3];
              const by = basePositions[k * 3 + 1];
              const bz = basePositions[k * 3 + 2];
              // Staggered sequential hammer wave across grid
              const rowOrder = (k / Math.max(1, pileCount)) * 0.55;
              const localP = clamp01((p - rowOrder) / 0.45);
              const eased = smoothstep01(localP);
              const dropOffset = (1 - eased) * 5.2;
              dummy.position.set(bx, by + dropOffset, bz);
              dummy.scale.set(1, 0.25 + 0.75 * eased, 1);
              dummy.updateMatrix();
              inst.setMatrixAt(k, dummy.matrix);
            }
            inst.instanceMatrix.needsUpdate = true;
          }
        }
        continue;
      }

      if (kind === 'basement_excavate_pour') {
        const p = rangeProgress(step, meta.startStep, meta.fullStep);
        node.visible = p > 0.005;
        if (node.visible) {
          node.scale.set(1, Math.max(0.03, p), 1);
          node.position.y = -3.2 * (1 - p);
        }
        continue;
      }

      if (kind === 'roof_slab_seal') {
        const p = rangeProgress(step, meta.startStep, meta.fullStep);
        node.visible = p > 0.005;
        if (node.visible) {
          // Four slabs converge inward cleanly from outer rim without overlapping
          node.scale.set(1, Math.max(0.15, p), 1);
          node.position.y = 0.0;
          for (let c = 0; c < node.children.length; c++) {
            const ch = node.children[c];
            if (!ch.userData.__origPos) ch.userData.__origPos = ch.position.clone();
            const op = ch.userData.__origPos;
            const expand = 1.0 + (1.0 - p) * 0.28;
            ch.position.set(op.x * expand, op.y, op.z * expand);
          }
        }
        continue;
      }

      if (kind === 'cawan_flare_assemble') {
        const p = rangeProgress(step, meta.startStep, meta.fullStep);
        node.visible = p > 0.005;
        if (node.visible) {
          node.scale.set(0.65 + 0.35 * p, Math.max(0.04, p), 0.65 + 0.35 * p);
        }
        continue;
      }

      if (kind === 'core_slipform_extrude') {
        const p = rangeProgress(step, meta.startStep, meta.fullStep);
        node.visible = p > 0.005;
        if (node.visible) {
          const y0 = meta.y0 || 0;
          node.scale.set(1, Math.max(0.02, p), 1);
          node.position.y = y0 * (1 - p);
        }
        continue;
      }

      if (kind === 'marble_panel_sheathe') {
        const p = rangeProgress(step, meta.startStep, meta.fullStep);
        node.visible = p > 0.005;
        if (node.visible) {
          const y0 = meta.y0 || 0;
          const sXZ = 1.0 + (1.0 - p) * 0.06;
          node.scale.set(sXZ, Math.max(0.03, p), sXZ);
          node.position.y = y0 * (1 - p);
        }
        continue;
      }

      if (kind === 'elevator_puncak_install') {
        const p = rangeProgress(step, meta.startStep, meta.fullStep);
        node.visible = p > 0.005;
        if (node.visible) {
          node.scale.set(0.75 + 0.25 * p, Math.max(0.05, p), 0.75 + 0.25 * p);
          node.position.y = (1 - p) * 8.0;
        }
        continue;
      }

      if (kind === 'lidah_api_assemble') {
        const p = rangeProgress(step, meta.startStep, meta.fullStep);
        node.visible = p > 0.005;
        if (node.visible) {
          node.scale.set(0.55 + 0.45 * p, Math.max(0.04, p), 0.55 + 0.45 * p);
          node.position.y = (1 - p) * 6.0;
        }
        continue;
      }

      if (kind === 'lidah_petal_converge') {
        const p = rangeProgress(step, meta.startStep, meta.fullStep);
        node.visible = p > 0.005;
        if (node.visible && meta.basePos) {
          const [bx, by, bz] = meta.basePos;
          const th = meta.theta || 0;
          const spread = (1 - p) * 3.8;
          const lift = (1 - p) * 5.2;
          node.position.set(bx + Math.sin(th) * spread, by + lift, bz + Math.cos(th) * spread);
          node.scale.setScalar(0.35 + 0.65 * p);
        }
        continue;
      }

      if (kind === 'crane_scaffold_dismantle') {
        const up = rangeProgress(step, meta.appearStart, meta.appearEnd);
        const down = rangeProgress(step, meta.dismantleStart, meta.dismantleEnd);
        const active = Math.max(0, Math.min(up, 1 - down));
        node.visible = active > 0.015;
        if (node.visible) {
          const heightScale = Math.max(0.08, active);
          node.scale.set(1, heightScale, 1);
          if (node.userData.jibPivot) {
            node.userData.jibPivot.position.y = 126.0;
          }
        }
        continue;
      }

      if (kind === 'scaffold_fade_band') {
        const up = rangeProgress(step, meta.appearStart, meta.appearEnd);
        const down = rangeProgress(step, meta.dismantleStart, meta.dismantleEnd);
        const active = Math.max(0, Math.min(up, 1 - down));
        node.visible = active > 0.015;
        if (node.visible) {
          const s = 0.85 + 0.15 * active;
          node.scale.set(s, active, s);
        }
      }
    }
  }

  update(dt, elapsedSec) {
    this.elapsedSec = elapsedSec || 0;
    // Animate internal 7-person elevator cabin smoothly between Cawan (18 m) & Puncak (113 m)
    if (this.elevatorCabin && this.step >= 5.2) {
      const cycle = 0.5 - 0.5 * Math.cos(this.elapsedSec * 0.26);
      this.elevatorCabin.position.y = 18.5 + cycle * 94.0;
    }
    // Gentle construction crane slewing during active erection steps (Stops 2..7)
    if (this.craneJibPivot && this.step >= 2.0 && this.step <= 7.5) {
      const baseAngle = Math.atan2(-17.5, 14.5);
      this.craneJibPivot.rotation.y = baseAngle + Math.sin(this.elapsedSec * 0.22) * 0.35;
    }
  }

  getTelemetry() {
    let visibleCount = 0;
    for (let i = 0; i < this.pieces.length; i++) {
      if (this.pieces[i].node.visible) visibleCount++;
    }
    return {
      step: this.step,
      totalPieces: this.pieces.length,
      visiblePieces: visibleCount,
      mechanisms: MECHANISM_FAMILIES.length,
    };
  }
}
