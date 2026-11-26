/**
 * Monas Zone 4 — Bronze Chalice & 14 m Gilded Lidah Api (`monas_zone4_lidah_api.js`)
 *
 * Specification (PRD §4):
 *   - Sits at y = 118.0 m .. 132.0 m (exact 132 m monument peak!)
 *   - Total flame height: 14 m, width/diameter: 6 m
 *   - Constructed from 77 articulated bronze cast sculptural tongue segments arranged in
 *     tiered flame spirals around an internal golden flame core, finished in gold leaf.
 */

function createFlamePetalGeometry(THREE, height, width, curveDepth) {
  // Organic S-curved cast flame tongue geometry tapered cleanly to a licking tip
  const segY = 7;
  const segX = 2;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let iy = 0; iy <= segY; iy++) {
    const t = iy / segY;
    const y = t * height;
    // Swells near bottom-middle then narrows gracefully into a sinuous tip
    const wProfile = Math.sin(Math.pow(t, 0.55) * Math.PI) * width * (1 - t * 0.45);
    const zWave = Math.sin(t * Math.PI * 1.45) * curveDepth * (1 - t * 0.25);

    for (let ix = 0; ix <= segX; ix++) {
      const u = ix / segX - 0.5;
      const x = u * wProfile;
      // Subtle convex ridge along petal center
      const ridge = (1 - Math.abs(u) * 2) * width * 0.24 * (1 - t * 0.7);
      positions.push(x, y, zWave + ridge);
      uvs.push(ix / segX, t);
    }
  }

  for (let iy = 0; iy < segY; iy++) {
    for (let ix = 0; ix < segX; ix++) {
      const a = iy * (segX + 1) + ix;
      const b = a + 1;
      const c = (iy + 1) * (segX + 1) + ix;
      const d = c + 1;
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function buildMonasZone4LidahApi(THREE, materials) {
  const group = new THREE.Group();
  group.name = 'zone4_lidah_api';

  // Ensure gold flame material is double-sided for organic thin sculpted petals
  if (materials.goldFlame) {
    materials.goldFlame.side = THREE.DoubleSide;
  }

  // 1. Dark Bronze Ceremonial Chalice Cradle (y = 117.6..119.8 m)
  const chaliceBowl = new THREE.Group();
  chaliceBowl.name = 'm4_bronze_chalice';
  const lathePoints = [
    new THREE.Vector2(1.4, 0.0),
    new THREE.Vector2(2.35, 0.25),
    new THREE.Vector2(3.05, 1.05),
    new THREE.Vector2(2.85, 1.85),
    new THREE.Vector2(2.2, 2.05),
    new THREE.Vector2(0.0, 2.05),
  ];
  const bowlGeo = new THREE.LatheGeometry(lathePoints, 24);
  const bowlMesh = new THREE.Mesh(bowlGeo, materials.castBronze);
  bowlMesh.position.set(0, 118.0, 0);
  bowlMesh.castShadow = true;
  bowlMesh.receiveShadow = true;
  chaliceBowl.add(bowlMesh);

  // Decorative cast bronze ring ribs around chalice
  const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(2.96, 0.14, 8, 24), materials.goldFlame);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.set(0, 119.2, 0);
  chaliceBowl.add(ringMesh);

  chaliceBowl.userData.kinematics = {
    kind: 'lidah_api_assemble',
    startStep: 5.35,
    fullStep: 5.8,
    tier: 0,
  };
  group.add(chaliceBowl);

  // 2. Sculpted Central Gold Flame Core (gives solid silhouette volume up to 131.8 m)
  const coreGroup = new THREE.Group();
  coreGroup.name = 'm4_flame_core';
  const flameProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(2.45, 0.8),
    new THREE.Vector2(2.85, 2.8),
    new THREE.Vector2(2.35, 5.6),
    new THREE.Vector2(1.65, 8.6),
    new THREE.Vector2(0.88, 11.4),
    new THREE.Vector2(0.28, 13.1),
    new THREE.Vector2(0.0, 13.5),
  ];
  const flameCoreGeo = new THREE.LatheGeometry(flameProfile, 20);
  const flameCoreMesh = new THREE.Mesh(flameCoreGeo, materials.goldFlame);
  flameCoreMesh.position.set(0, 118.5, 0);
  flameCoreMesh.castShadow = true;
  coreGroup.add(flameCoreMesh);
  coreGroup.userData.kinematics = {
    kind: 'lidah_api_assemble',
    startStep: 5.45,
    fullStep: 5.95,
    tier: 1,
  };
  group.add(coreGroup);

  // 3. 77 Individual Sculptural Gold-Gilded Flame Segments (4 spiral tiers reaching y = 132.0 m)
  const petalGroup = new THREE.Group();
  petalGroup.name = 'm4_77_bronze_petals';

  const tierConfigs = [
    { count: 24, yBase: 118.8, r: 2.75, h: 6.2, w: 1.35, depth: 0.55, tiltOut: 0.24, step0: 5.55, step1: 6.0 },
    { count: 22, yBase: 120.4, r: 2.25, h: 7.4, w: 1.25, depth: 0.65, tiltOut: 0.14, step0: 5.65, step1: 6.08 },
    { count: 19, yBase: 122.2, r: 1.55, h: 7.5, w: 1.05, depth: 0.62, tiltOut: 0.06, step0: 5.75, step1: 6.16 },
    { count: 12, yBase: 124.2, r: 0.82, h: 7.8, w: 0.85, depth: 0.48, tiltOut: -0.05, step0: 5.85, step1: 6.24 },
  ]; // 24 + 22 + 19 + 12 = 77 segments!

  let segmentIndex = 0;
  for (let tIdx = 0; tIdx < tierConfigs.length; tIdx++) {
    const cfg = tierConfigs[tIdx];
    const sharedPetalGeo = createFlamePetalGeometry(THREE, cfg.h, cfg.w, cfg.depth);

    for (let k = 0; k < cfg.count; k++) {
      const theta = (k / cfg.count) * Math.PI * 2 + tIdx * 0.21;
      const petal = new THREE.Mesh(sharedPetalGeo, materials.goldFlame);
      petal.name = `m4_lidah_segment_${segmentIndex++}`;
      const px = Math.sin(theta) * cfg.r;
      const pz = Math.cos(theta) * cfg.r;
      petal.position.set(px, cfg.yBase, pz);
      petal.rotation.y = theta;
      petal.rotation.x = cfg.tiltOut;
      petal.rotation.z = ((k % 3) - 1) * 0.09;
      petal.castShadow = true;

      petal.userData.basePos = [px, cfg.yBase, pz];
      petal.userData.theta = theta;
      petal.userData.kinematics = {
        kind: 'lidah_petal_converge',
        startStep: cfg.step0 + (k / cfg.count) * 0.12,
        fullStep: cfg.step1,
        basePos: [px, cfg.yBase, pz],
        theta,
      };
      petalGroup.add(petal);
    }
  }

  group.add(petalGroup);
  return group;
}
