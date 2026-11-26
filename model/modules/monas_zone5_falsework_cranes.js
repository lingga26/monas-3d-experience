/**
 * Monas Zone 5 — 1960s Construction Tower Cranes, Material Hoist & Scaffolding
 * (`monas_zone5_falsework_cranes.js`)
 *
 * Appears smoothly during Stops 2–6 and dismantles down cleanly to zero clutter
 * during Stop 7 (`Tahap Akhir`) so Stops 8–9 showcase an unobstructed Monas.
 */

export function buildMonasZone5Cranes(THREE, materials) {
  const group = new THREE.Group();
  group.name = 'zone5_cranes_falsework';

  // 1. Primary Heavy Tower Crane alongside Monas (x = +17.5, z = -14.5)
  const craneGroup = new THREE.Group();
  craneGroup.name = 'm5_tower_crane';

  const basePad = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.0, 5.2), materials.concreteCore);
  basePad.position.set(17.5, 0.5, -14.5);
  basePad.castShadow = true;
  craneGroup.add(basePad);

  // Lattice steel mast rising to y = 126 m (built from 4 corner steel chords + horizontal braces)
  const mastHeight = 125.0;
  const chordGeo = new THREE.BoxGeometry(0.26, mastHeight, 0.26);
  for (const dx of [-1.1, 1.1]) {
    for (const dz of [-1.1, 1.1]) {
      const chord = new THREE.Mesh(chordGeo, materials.craneSteel);
      chord.position.set(17.5 + dx, mastHeight * 0.5 + 0.8, -14.5 + dz);
      chord.castShadow = true;
      craneGroup.add(chord);
    }
  }
  const braceGeo = new THREE.BoxGeometry(2.45, 0.2, 2.45);
  for (let by = 6; by < mastHeight; by += 7.5) {
    const brace = new THREE.Mesh(braceGeo, materials.craneSteel);
    brace.position.set(17.5, by, -14.5);
    craneGroup.add(brace);
  }

  // Slewing upper jib head (rotates gently toward Monas axis, tracks top height)
  const jibPivot = new THREE.Group();
  jibPivot.name = 'm5_crane_jib_pivot';
  jibPivot.position.set(17.5, 126.0, -14.5);
  jibPivot.rotation.y = Math.atan2(-17.5, 14.5); // Points cleanly across central shaft

  const mainBoom = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.25, 32), materials.craneSteel);
  mainBoom.position.set(0, 0.8, 10.5);
  mainBoom.castShadow = true;
  jibPivot.add(mainBoom);

  const counterWeight = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 4.2), materials.concreteCore);
  counterWeight.position.set(0, 0.8, -6.0);
  jibPivot.add(counterWeight);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.1, 2.2), materials.scaffoldSteel);
  cab.position.set(1.2, -0.4, 2.0);
  jibPivot.add(cab);

  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 18, 6), materials.castBronze);
  cable.position.set(0, -8.8, 21.0);
  jibPivot.add(cable);

  craneGroup.add(jibPivot);
  craneGroup.userData.jibPivot = jibPivot;
  craneGroup.userData.kinematics = {
    kind: 'crane_scaffold_dismantle',
    appearStart: 1.9,
    appearEnd: 5.5,
    dismantleStart: 6.45,
    dismantleEnd: 7.55,
    maxHeight: 126.0,
  };
  group.add(craneGroup);

  // 2. Exterior Vertical Material Hoist Mast on West side (x = -9.5, z = 0)
  const hoistGroup = new THREE.Group();
  hoistGroup.name = 'm5_material_hoist';
  const hoistMast = new THREE.Mesh(new THREE.BoxGeometry(1.4, 114, 1.4), materials.scaffoldSteel);
  hoistMast.position.set(-9.5, 57, 0);
  hoistMast.castShadow = true;
  hoistGroup.add(hoistMast);

  for (let ty = 18; ty <= 112; ty += 16) {
    const tie = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.25, 0.55), materials.scaffoldSteel);
    tie.position.set(-6.8, ty, 0);
    hoistGroup.add(tie);
  }

  hoistGroup.userData.kinematics = {
    kind: 'crane_scaffold_dismantle',
    appearStart: 3.1,
    appearEnd: 5.3,
    dismantleStart: 6.55,
    dismantleEnd: 7.65,
    maxHeight: 114.0,
  };
  group.add(hoistGroup);

  // 3. Cawan Rim Work Scaffolding Ring (active during Cawan cladding Stages 4..7)
  const cawanScaffold = new THREE.Group();
  cawanScaffold.name = 'm5_cawan_scaffolding';
  const ringNS = new THREE.BoxGeometry(47.2, 0.55, 0.9);
  const ringEW = new THREE.BoxGeometry(0.9, 0.55, 47.2);
  for (const ry of [6.5, 11.5, 16.4]) {
    for (const s of [-23.2, 23.2]) {
      const rNS = new THREE.Mesh(ringNS, materials.scaffoldSteel);
      rNS.position.set(0, ry, s);
      cawanScaffold.add(rNS);
      const rEW = new THREE.Mesh(ringEW, materials.scaffoldSteel);
      rEW.position.set(s, ry, 0);
      cawanScaffold.add(rEW);
    }
  }
  cawanScaffold.userData.kinematics = {
    kind: 'scaffold_fade_band',
    appearStart: 3.6,
    appearEnd: 4.5,
    dismantleStart: 6.65,
    dismantleEnd: 7.45,
  };
  group.add(cawanScaffold);

  return group;
}
