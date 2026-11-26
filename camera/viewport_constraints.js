/**
 * Monas Monument Viewport & Look Constraints (`camera/viewport_constraints.js`)
 *
 * Enforces structural clearance around 132 m Monumen Nasional & Lapangan Medan Merdeka:
 *   - Cawan 45 × 45 m at y = 0..17 m (half-width up to 22.8 m)
 *   - Obelisk marble shaft y = 17..115 m (tapering 5.9 m -> 3.8 m half-width)
 *   - Pelataran Puncak 11 × 11 m at y = 115 m + Lidah Api 118..132 m
 *   - Flat equatorial Medan Merdeka plaza at y = 0.0 m (min camera y = 1.8 m)
 *   - Distance bounds (`minDist = 14 m`, `maxDist = 360 m`, `maxWorldRadiusXZ = 360 m`)
 */

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function towerHalfWidthAtY(y) {
  const h = clamp(Number(y) || 0, 0, 134.0);
  if (h <= 2.2) return 27.5;
  if (h < 17.5) {
    const t = (h - 2.2) / (17.5 - 2.2);
    return lerp(9.8, 22.8, Math.pow(t, 1.35));
  }
  if (h < 114.0) {
    const t = (h - 17.5) / (114.0 - 17.5);
    return lerp(6.0, 3.8, t);
  }
  if (h < 118.2) return 5.8;
  return 3.4;
}

export function localGroundElevation() {
  return 0.0;
}

export function minAllowedCameraY(x, z) {
  return Math.max(1.85, localGroundElevation(x, z) + 1.85);
}

export function computeStructuralClearanceM(x, y, z) {
  const h = Number(y) || 0;
  if (h > 136.0) {
    return Math.hypot(x, z) + (h - 136.0);
  }
  if (h < -3.5) return -1;
  const halfW = towerHalfWidthAtY(Math.max(0, h));
  const ax = Math.abs(x);
  const az = Math.abs(z);
  const dx = Math.max(0, ax - halfW);
  const dz = Math.max(0, az - halfW);
  return dx > 0 || dz > 0 ? Math.hypot(dx, dz) : -Math.min(halfW - ax, halfW - az);
}

export function repelPointFromTowerStructure(vec3, { extraMargin = 3.2 } = {}) {
  const y = vec3.y;
  if (y < 0 || y > 134.5) return false;
  const halfBox = towerHalfWidthAtY(y) + extraMargin;
  const ax = Math.abs(vec3.x);
  const az = Math.abs(vec3.z);
  if (ax < halfBox && az < halfBox) {
    const rXZ = Math.hypot(vec3.x, vec3.z);
    if (rXZ > 1e-4) {
      const targetR = halfBox * 1.15;
      if (rXZ < targetR) {
        const s = targetR / rXZ;
        vec3.x *= s;
        vec3.z *= s;
        return true;
      }
    } else {
      vec3.z = halfBox;
      return true;
    }
  }
  return false;
}

export function repelPointFromExpositionObstacles(vec3) {
  if (vec3.y < 1.85) {
    vec3.y = 1.85;
    return true;
  }
  return false;
}

export function flushOrbitControlsMomentum(
  controls,
  { spherical = true, pan = true, scale = false } = {}
) {
  if (!controls) return;
  if (spherical && controls._sphericalDelta?.set) controls._sphericalDelta.set(0, 0, 0);
  if (pan && controls._panOffset?.set) controls._panOffset.set(0, 0, 0);
  if (scale && typeof controls._scale === 'number') controls._scale = 1;
}

export function createViewportConstraints({
  THREE,
  camera,
  controls,
  maxDistance = 360.0,
  maxWorldRadiusXZ = 360.0,
  maxSpineNdcX = 0.62,
  maxSpineNdcY = 0.84,
} = {}) {
  const offset = new THREE.Vector3();
  const spherical = new THREE.Spherical();
  const spinePoint = new THREE.Vector3();
  const projectedSpine = new THREE.Vector3();
  const upVec = new THREE.Vector3(0, 1, 0);

  const lastFlags = {
    groundFloor: false,
    polarMax: false,
    polarMin: false,
    distMax: false,
    distMin: false,
    targetTether: false,
    pierExclusion: false,
    worldRadiusMax: false,
    antiOutwardGaze: false,
    towerFraming: false,
  };

  function enforce() {
    if (!camera || !controls || !controls.enabled) return lastFlags;
    for (const k of Object.keys(lastFlags)) lastFlags[k] = false;

    const target = controls.target;

    // 1. Clamp target elevation (-1 m excavation inspection up to 129 m flame summit)
    const clampedTargetY = clamp(target.y, -1.5, 129.0);
    if (Math.abs(clampedTargetY - target.y) > 1e-4) {
      const dy = clampedTargetY - target.y;
      target.y = clampedTargetY;
      camera.position.y += dy;
      lastFlags.targetTether = true;
    }

    // 2. Keep horizontal target tethered cleanly near Monas centerline
    const curTargetR = Math.hypot(target.x, target.z);
    const maxTetherR = target.y < 22 ? 28.0 : 14.0;
    if (curTargetR > maxTetherR && curTargetR > 1e-4) {
      const s = maxTetherR / curTargetR;
      const dx = target.x * s - target.x;
      const dz = target.z * s - target.z;
      target.x += dx;
      target.z += dz;
      camera.position.x += dx;
      camera.position.z += dz;
      lastFlags.targetTether = true;
    }

    // 3. Spherical envelope
    offset.copy(camera.position).sub(target);
    spherical.setFromVector3(offset);

    const minDist = Math.max(12.0, towerHalfWidthAtY(target.y) * 1.1 + 6.0);
    if (spherical.radius < minDist) {
      spherical.radius = minDist;
      lastFlags.distMin = true;
    } else if (spherical.radius > maxDistance) {
      spherical.radius = maxDistance;
      lastFlags.distMax = true;
    }

    const minPolar = 0.25;
    const minCosPhi = clamp((1.85 - target.y) / Math.max(1.0, spherical.radius), -0.95, 0.92);
    const groundMaxPolar = Math.acos(minCosPhi);
    const maxPolar = Math.max(minPolar + 0.05, Math.min(2.15, groundMaxPolar));

    if (spherical.phi < minPolar) {
      spherical.phi = minPolar;
      lastFlags.polarMin = true;
    } else if (spherical.phi > maxPolar) {
      spherical.phi = maxPolar;
      lastFlags.polarMax = true;
      lastFlags.groundFloor = true;
    }

    offset.setFromSpherical(spherical);
    camera.position.copy(target).add(offset);

    // 4. World radius & monument shell clearance
    const rXZ = Math.hypot(camera.position.x, camera.position.z);
    if (rXZ > maxWorldRadiusXZ) {
      const s = maxWorldRadiusXZ / rXZ;
      camera.position.x *= s;
      camera.position.z *= s;
      lastFlags.worldRadiusMax = true;
    }

    if (repelPointFromTowerStructure(camera.position, { extraMargin: 3.4 })) {
      lastFlags.pierExclusion = true;
    }

    if (camera.position.y < 1.85) {
      camera.position.y = 1.85;
      lastFlags.groundFloor = true;
    }
    if (camera.position.y > 210.0) {
      camera.position.y = 210.0;
      lastFlags.polarMin = true;
    }

    // 5. Frustum sanity check keeping Monas spine inside viewport
    spinePoint.set(0, clamp(target.y, 4.0, 126.0), 0);
    camera.up.copy(upVec);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();

    projectedSpine.copy(spinePoint).project(camera);
    if (
      !Number.isFinite(projectedSpine.x) ||
      !Number.isFinite(projectedSpine.y) ||
      projectedSpine.z >= 1.0 ||
      Math.abs(projectedSpine.x) > maxSpineNdcX ||
      Math.abs(projectedSpine.y) > maxSpineNdcY
    ) {
      target.lerp(spinePoint, 0.35);
      camera.lookAt(target);
      camera.updateMatrixWorld(true);
      lastFlags.towerFraming = true;
    }

    if (lastFlags.targetTether || lastFlags.towerFraming) {
      flushOrbitControlsMomentum(controls, { spherical: false, pan: true });
    }
    if (
      lastFlags.groundFloor ||
      lastFlags.polarMax ||
      lastFlags.polarMin ||
      lastFlags.pierExclusion ||
      lastFlags.worldRadiusMax
    ) {
      flushOrbitControlsMomentum(controls, { spherical: true, pan: false });
    }

    return lastFlags;
  }

  function solveLegalPose({ position, target, fov = 42, aspect = 16 / 9 } = {}) {
    const savedPos = camera.position.clone();
    const savedFov = camera.fov;
    const savedAspect = camera.aspect;
    const savedTarget = controls.target.clone();
    const savedEnabled = controls.enabled;

    camera.fov = fov;
    camera.aspect = aspect;
    camera.position.set(position[0], position[1], position[2]);
    controls.target.set(target[0], target[1], target[2]);
    controls.enabled = true;
    enforce();

    const legalPosition = [camera.position.x, camera.position.y, camera.position.z];
    const legalTarget = [controls.target.x, controls.target.y, controls.target.z];

    camera.position.copy(savedPos);
    camera.fov = savedFov;
    camera.aspect = savedAspect;
    controls.target.copy(savedTarget);
    controls.enabled = savedEnabled;
    camera.lookAt(controls.target);
    camera.updateProjectionMatrix();

    return { position: legalPosition, target: legalTarget };
  }

  return {
    enforce,
    solveLegalPose,
    getFlags: () => ({ ...lastFlags }),
  };
}

export function runAdversarialConstraintFuzz({ camera, controls, constraints, iterations = 400 } = {}) {
  const savedPos = camera.position.clone();
  const savedTarget = controls.target.clone();
  const savedEnabled = controls.enabled;
  controls.enabled = true;

  let violations = 0;
  for (let i = 0; i < iterations; i++) {
    camera.position.set(
      (Math.sin(i * 12.9) * 2 - 1) * 450,
      Math.cos(i * 4.7) * 240,
      (Math.cos(i * 7.3) * 2 - 1) * 450
    );
    controls.target.set(0, Math.sin(i) * 140, 0);
    constraints.enforce();
    if (camera.position.y < 1.8 || computeStructuralClearanceM(camera.position.x, camera.position.y, camera.position.z) < -0.2) {
      violations++;
    }
  }

  camera.position.copy(savedPos);
  controls.target.copy(savedTarget);
  controls.enabled = savedEnabled;
  camera.lookAt(controls.target);
  return { passed: violations === 0, violations, iterations };
}
