/**
 * Monas Zone 1 — Foundations, Piles & Subterranean History Museum (`monas_zone1_foundations.js`)
 *
 * Includes:
 *   - Step 0: Survey boundary guide markers for the 80 × 80 m & 45 × 45 m axes
 *   - Step 1: First concrete ceremonial pour pad at center (0, 0, 0)
 *   - Step 2: 284 monument piles + 360 museum footprint piles (InstancedMesh)
 *   - Step 3: 80 × 80 m (-3.2 m depth) Museum Sejarah Nasional subterranean basin,
 *             retaining walls, gallery columns, and segmented plaza ceiling deck
 */

export function buildMonasZone1Foundations(THREE, materials) {
  const group = new THREE.Group();
  group.name = 'zone1_foundations';

  // 1. Survey guide frame (visible at Step 0 before excavation, fades cleanly after Step 2)
  const guideGroup = new THREE.Group();
  guideGroup.name = 'm1_survey_stakes';
  const railGeoLong = new THREE.BoxGeometry(82, 0.18, 0.45);
  const railGeoShort = new THREE.BoxGeometry(0.45, 0.18, 82);
  for (const s of [-41, 41]) {
    const mz = new THREE.Mesh(railGeoLong, materials.blueprintGuide);
    mz.position.set(0, 0.11, s);
    guideGroup.add(mz);
    const mx = new THREE.Mesh(railGeoShort, materials.blueprintGuide);
    mx.position.set(s, 0.11, 0);
    guideGroup.add(mx);
  }
  const innerRailLong = new THREE.BoxGeometry(45.5, 0.2, 0.4);
  const innerRailShort = new THREE.BoxGeometry(0.4, 0.2, 45.5);
  for (const s of [-22.6, 22.6]) {
    const iz = new THREE.Mesh(innerRailLong, materials.blueprintGuide);
    iz.position.set(0, 0.14, s);
    guideGroup.add(iz);
    const ix = new THREE.Mesh(innerRailShort, materials.blueprintGuide);
    ix.position.set(s, 0.14, 0);
    guideGroup.add(ix);
  }
  guideGroup.userData.kinematics = { kind: 'survey_guide', startStep: 0.0, fullStep: 0.2, fadeStart: 1.8, fadeEnd: 2.8 };
  group.add(guideGroup);

  // 2. First ceremonial concrete pour pad (Step 1)
  const firstPourGroup = new THREE.Group();
  firstPourGroup.name = 'm1_first_concrete_pad';
  const padMesh = new THREE.Mesh(new THREE.BoxGeometry(24, 0.85, 24), materials.concreteCore);
  padMesh.position.set(0, -0.35, 0);
  padMesh.receiveShadow = true;
  firstPourGroup.add(padMesh);
  const collarRing = new THREE.Mesh(new THREE.BoxGeometry(27, 0.45, 27), materials.darkTrimStone);
  collarRing.position.set(0, -0.18, 0);
  collarRing.receiveShadow = true;
  firstPourGroup.add(collarRing);
  firstPourGroup.userData.kinematics = { kind: 'rise_scale_y', startStep: 0.45, fullStep: 1.05, originY: -0.45 };
  group.add(firstPourGroup);

  // 3. Foundation Piles: 284 under tower core + 360 across 80x80m museum grid (InstancedMesh)
  const pilesGroup = new THREE.Group();
  pilesGroup.name = 'm1_foundation_piles';
  const pileGeo = new THREE.CylinderGeometry(0.28, 0.24, 7.6, 6);
  const totalPiles = 284 + 360;
  const pilesInst = new THREE.InstancedMesh(pileGeo, materials.basementConcrete, totalPiles);
  pilesInst.name = 'm1_piles_instanced';
  pilesInst.castShadow = false;
  pilesInst.receiveShadow = false;

  const dummy = new THREE.Object3D();
  const basePositions = new Float32Array(totalPiles * 3);
  let idx = 0;

  // 284 central monument piles (dense 17x17 minus 5 corner/void slots = 284)
  for (let gx = -8; gx <= 8 && idx < 284; gx++) {
    for (let gz = -8; gz <= 8 && idx < 284; gz++) {
      if (Math.abs(gx) === 8 && Math.abs(gz) === 8) continue;
      if (gx === 8 && gz === 7) continue;
      const px = gx * 1.45;
      const pz = gz * 1.45;
      basePositions[idx * 3] = px;
      basePositions[idx * 3 + 1] = -6.8;
      basePositions[idx * 3 + 2] = pz;
      dummy.position.set(px, -6.8, pz);
      dummy.updateMatrix();
      pilesInst.setMatrixAt(idx, dummy.matrix);
      idx++;
    }
  }

  // 360 surrounding museum piles across outer 80x80m ring
  let mIdx = 0;
  for (let gx = -10; gx <= 10 && mIdx < 360; gx++) {
    for (let gz = -10; gz <= 10 && mIdx < 360; gz++) {
      const px = gx * 3.85;
      const pz = gz * 3.85;
      if (Math.abs(px) < 13.5 && Math.abs(pz) < 13.5) continue;
      basePositions[idx * 3] = px;
      basePositions[idx * 3 + 1] = -6.9;
      basePositions[idx * 3 + 2] = pz;
      dummy.position.set(px, -6.9, pz);
      dummy.updateMatrix();
      pilesInst.setMatrixAt(idx, dummy.matrix);
      idx++;
      mIdx++;
    }
  }
  pilesInst.count = idx;
  pilesInst.instanceMatrix.needsUpdate = true;
  pilesInst.userData.basePositions = basePositions;
  pilesInst.userData.pileCount = idx;
  pilesGroup.add(pilesInst);
  pilesGroup.userData.kinematics = { kind: 'pile_hammer_drive', startStep: 1.05, fullStep: 2.0 };
  group.add(pilesGroup);

  // 4. Museum Sejarah Nasional Basement (80 × 80 m, -3.2 m depth)
  const basementGroup = new THREE.Group();
  basementGroup.name = 'm1_museum_basement';

  // Concrete basement floor slab at y = -3.2 m
  const floorSlab = new THREE.Mesh(new THREE.BoxGeometry(80, 0.55, 80), materials.basementConcrete);
  floorSlab.position.set(0, -3.25, 0);
  floorSlab.receiveShadow = true;
  basementGroup.add(floorSlab);

  // Four perimeter retaining walls (80 x 80 m)
  const wallN = new THREE.Mesh(new THREE.BoxGeometry(80, 3.1, 0.9), materials.basementConcrete);
  wallN.position.set(0, -1.65, -39.55);
  wallN.receiveShadow = true;
  wallN.castShadow = true;
  basementGroup.add(wallN);

  const wallS = new THREE.Mesh(new THREE.BoxGeometry(80, 3.1, 0.9), materials.basementConcrete);
  wallS.position.set(0, -1.65, 39.55);
  wallS.receiveShadow = true;
  wallS.castShadow = true;
  basementGroup.add(wallS);

  const wallE = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.1, 78.2), materials.basementConcrete);
  wallE.position.set(39.55, -1.65, 0);
  wallE.receiveShadow = true;
  wallE.castShadow = true;
  basementGroup.add(wallE);

  const wallW = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.1, 78.2), materials.basementConcrete);
  wallW.position.set(-39.55, -1.65, 0);
  wallW.receiveShadow = true;
  wallW.castShadow = true;
  basementGroup.add(wallW);

  // Subterranean museum interior structural piers (6x6 perimeter ring outside central core)
  const colGeo = new THREE.BoxGeometry(1.15, 3.0, 1.15);
  const colCoords = [-30, -18, 18, 30];
  for (const cx of colCoords) {
    for (const cz of colCoords) {
      const col = new THREE.Mesh(colGeo, materials.concreteCore);
      col.position.set(cx, -1.6, cz);
      col.castShadow = true;
      col.receiveShadow = true;
      basementGroup.add(col);
    }
  }

  // Central massive pile-cap core footing inside museum chamber
  const centerFoot = new THREE.Mesh(new THREE.BoxGeometry(24, 3.2, 24), materials.concreteCore);
  centerFoot.position.set(0, -1.6, 0);
  centerFoot.receiveShadow = true;
  basementGroup.add(centerFoot);

  basementGroup.userData.kinematics = { kind: 'basement_excavate_pour', startStep: 2.05, fullStep: 3.05 };
  group.add(basementGroup);

  // 5. Museum Roof / Plaza Deck Slab closing neatly over the 80x80m chamber as Cawan rises
  const roofDeckGroup = new THREE.Group();
  roofDeckGroup.name = 'm1_museum_roof_deck';
  const deckMat = materials.darkTrimStone;
  // Two half-slabs around central plinth opening (leaves central pedestal cleanly open)
  const slabN = new THREE.Mesh(new THREE.BoxGeometry(80.6, 0.48, 28), deckMat);
  slabN.position.set(0, -0.22, -26.2);
  slabN.receiveShadow = true;
  roofDeckGroup.add(slabN);

  const slabS = new THREE.Mesh(new THREE.BoxGeometry(80.6, 0.48, 28), deckMat);
  slabS.position.set(0, -0.22, 26.2);
  slabS.receiveShadow = true;
  roofDeckGroup.add(slabS);

  const slabW = new THREE.Mesh(new THREE.BoxGeometry(28, 0.48, 24.4), deckMat);
  slabW.position.set(-26.2, -0.22, 0);
  slabW.receiveShadow = true;
  roofDeckGroup.add(slabW);

  const slabE = new THREE.Mesh(new THREE.BoxGeometry(28, 0.48, 24.4), deckMat);
  slabE.position.set(26.2, -0.22, 0);
  slabE.receiveShadow = true;
  roofDeckGroup.add(slabE);

  roofDeckGroup.userData.kinematics = { kind: 'roof_slab_seal', startStep: 3.15, fullStep: 3.85 };
  group.add(roofDeckGroup);

  return group;
}
