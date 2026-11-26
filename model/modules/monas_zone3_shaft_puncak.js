/**
 * Monas Zone 3 — Obelisk Concrete Shaft, Cream Marble Cladding, Internal Elevator & 115 m Pelataran Puncak
 * (`monas_zone3_shaft_puncak.js`)
 *
 * Proportions:
 *   - Concrete core shaft rising from basement footing (-0.5 m) to Pelataran Puncak (115.0 m)
 *   - Tapering width: 11.6 × 11.6 m at Cawan collar (y=17 m) -> 7.2 × 7.2 m beneath summit (y=114 m)
 *   - Segmented vertical courses for smooth slipform concrete pour + staggered marble cladding animation
 *   - Pelataran Puncak at y = 115.0 m measuring exact 11.0 × 11.0 m (half = 5.5 m) with guardrail & stairs
 *   - Central internal elevator core + animated 7-person cabin rising along y = 18..114 m
 */

function createTaperedSquareFrustumGeo(THREE, y0, y1, half0, half1) {
  // Builds a watertight 4-sided tapered prism with outward normals and clean architectural UVs
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const dy = Math.max(0.001, y1 - y0);
  const dh = half1 - half0;
  const len = Math.hypot(dh, dy);
  const ny = -dh / len;
  const nz = dy / len;

  for (let side = 0; side < 4; side++) {
    const vStart = positions.length / 3;
    const a = side * (Math.PI / 2);
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const nxW = nz * sinA;
    const nzW = nz * cosA;

    const corners = [
      [-half0, y0, half0, 0, 0],
      [half0, y0, half0, 1, 0],
      [half1, y1, half1, 1, 1],
      [-half1, y1, half1, 0, 1],
    ];
    for (let c = 0; c < 4; c++) {
      const [lx, ly, lz, u, v] = corners[c];
      const wx = lx * cosA + lz * sinA;
      const wz = -lx * sinA + lz * cosA;
      positions.push(wx, ly, wz);
      normals.push(nxW, ny, nzW);
      uvs.push(u * 2, v * 2);
    }
    indices.push(vStart, vStart + 1, vStart + 2);
    indices.push(vStart, vStart + 2, vStart + 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

export function buildMonasZone3ShaftPuncak(THREE, materials) {
  const group = new THREE.Group();
  group.name = 'zone3_shaft_puncak';

  // Helper interpolating obelisk half-width between y=17m (5.8m) and y=115m (3.6m)
  const coreHalfAtY = (y) => {
    if (y <= 17.0) {
      const t = Math.max(0, y / 17.0);
      return 6.4 - t * 0.65;
    }
    const t = Math.min(1, (y - 17.0) / 98.0);
    return 5.75 - t * 2.25;
  };

  // 1. Poured Reinforced Concrete Core Shaft (14 vertical courses from 0 -> 115 m)
  const coreCourses = 14;
  for (let c = 0; c < coreCourses; c++) {
    const y0 = (c / coreCourses) * 115.0;
    const y1 = ((c + 1) / coreCourses) * 115.0;
    const h0 = coreHalfAtY(y0);
    const h1 = coreHalfAtY(y1);

    const courseMesh = new THREE.Mesh(
      createTaperedSquareFrustumGeo(THREE, y0, y1, h0, h1),
      materials.concreteCore
    );
    courseMesh.name = `m3_core_course_${c}`;
    courseMesh.castShadow = true;
    courseMesh.receiveShadow = true;

    const frac0 = c / coreCourses;
    const frac1 = (c + 1) / coreCourses;
    courseMesh.userData.kinematics = {
      kind: 'core_slipform_extrude',
      startStep: 3.35 + frac0 * 1.15,
      fullStep: 3.45 + frac1 * 1.15,
      y0,
      y1,
    };
    group.add(courseMesh);
  }

  // 2. Cream-Veined Indonesian Marble Cladding Rings (12 courses y = 17.0 -> 113.5 m)
  const marbleCourses = 12;
  for (let m = 0; m < marbleCourses; m++) {
    const y0 = 17.0 + (m / marbleCourses) * 96.2;
    const y1 = 17.0 + ((m + 1) / marbleCourses) * 96.2;
    const h0 = coreHalfAtY(y0) + 0.16;
    const h1 = coreHalfAtY(y1) + 0.16;

    const marbleCourse = new THREE.Mesh(
      createTaperedSquareFrustumGeo(THREE, y0, y1, h0, h1),
      materials.marble
    );
    marbleCourse.name = `m3_marble_course_${m}`;
    marbleCourse.castShadow = true;
    marbleCourse.receiveShadow = true;

    const frac0 = m / marbleCourses;
    const frac1 = (m + 1) / marbleCourses;
    marbleCourse.userData.kinematics = {
      kind: 'marble_panel_sheathe',
      startStep: 4.55 + frac0 * 0.72,
      fullStep: 4.65 + frac1 * 0.72,
      y0,
      y1,
    };
    group.add(marbleCourse);
  }

  // 3. Central Vertical Elevator Shaft Track + Moving 7-Person Cabin (18 -> 114 m)
  const elevatorGroup = new THREE.Group();
  elevatorGroup.name = 'm3_elevator_system';

  // Vertical recessed architectural viewing slit on South & North shaft faces
  const slitGeo = new THREE.BoxGeometry(0.9, 92, 0.35);
  for (const sz of [-4.75, 4.75]) {
    const slit = new THREE.Mesh(slitGeo, materials.elevatorGlass);
    slit.position.set(0, 64, sz);
    // Slight inward tilt matching tapered shaft
    slit.rotation.x = sz > 0 ? 0.022 : -0.022;
    elevatorGroup.add(slit);
  }

  // Moving 7-person elevator cabin node (animated smoothly in update())
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.6, 1.75), materials.goldFlame);
  cabin.name = 'm3_elevator_cabin';
  cabin.position.set(0, 56, 0);
  elevatorGroup.add(cabin);

  elevatorGroup.userData.kinematics = {
    kind: 'elevator_puncak_install',
    startStep: 4.85,
    fullStep: 5.45,
  };
  group.add(elevatorGroup);

  // 4. Pelataran Puncak (11 × 11 m observation deck at y = 115.0 m) + Chalice Pedestal (115..118 m)
  const puncakGroup = new THREE.Group();
  puncakGroup.name = 'm3_pelataran_puncak';

  // Corbel flared support under 11x11m summit deck (y = 112.4 .. 114.6 m)
  const corbel = new THREE.Mesh(
    createTaperedSquareFrustumGeo(THREE, 112.4, 114.6, 3.7, 5.5),
    materials.marble
  );
  corbel.castShadow = true;
  corbel.receiveShadow = true;
  puncakGroup.add(corbel);

  // Main 11 × 11 m observation platform slab at y = 115.0 m
  const deckSlab = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.6, 11.0), materials.marble);
  deckSlab.position.set(0, 114.9, 0);
  deckSlab.castShadow = true;
  deckSlab.receiveShadow = true;
  puncakGroup.add(deckSlab);

  // Protective summit perimeter guardrail + corner posts (y = 115.2 .. 116.45 m)
  const railBarNS = new THREE.BoxGeometry(11.1, 0.14, 0.16);
  const railBarEW = new THREE.BoxGeometry(0.16, 0.14, 10.9);
  for (const rY of [115.65, 116.15, 116.5]) {
    for (const side of [-5.42, 5.42]) {
      const rNS = new THREE.Mesh(railBarNS, materials.castBronze);
      rNS.position.set(0, rY, side);
      puncakGroup.add(rNS);
      const rEW = new THREE.Mesh(railBarEW, materials.castBronze);
      rEW.position.set(side, rY, 0);
      puncakGroup.add(rEW);
    }
  }
  const postGeo = new THREE.BoxGeometry(0.24, 1.35, 0.24);
  for (const px of [-5.4, 0, 5.4]) {
    for (const pz of [-5.4, 0, 5.4]) {
      if (px === 0 && pz === 0) continue;
      const post = new THREE.Mesh(postGeo, materials.marble);
      post.position.set(px, 115.85, pz);
      puncakGroup.add(post);
    }
  }

  // Summit enclosed glass/marble core pavilion & flame pedestal neck (y = 115.2 .. 118.2 m)
  const summitCore = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.8, 4.4), materials.marble);
  summitCore.position.set(0, 116.5, 0);
  summitCore.castShadow = true;
  summitCore.receiveShadow = true;
  puncakGroup.add(summitCore);

  const neckPedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.7, 1.3, 16), materials.castBronze);
  neckPedestal.position.set(0, 118.25, 0);
  neckPedestal.castShadow = true;
  puncakGroup.add(neckPedestal);

  puncakGroup.userData.kinematics = {
    kind: 'elevator_puncak_install',
    startStep: 4.95,
    fullStep: 5.55,
  };
  group.add(puncakGroup);

  return group;
}
