/**
 * Medan Merdeka World Builder (`world/medan_merdeka.js`)
 *
 * Reconstructs Jakarta's Lapangan Medan Merdeka surrounding Monas:
 *   - 2,300 × 2,300 m equatorial plain fading seamlessly into Jakarta mist
 *   - Silang Monas North-South, East-West & diagonal stone ceremonial avenues
 *   - 4 symmetrical Plaza Reflecting Pools with stone coping
 *   - Instanced tropical rain trees (Angsana/Trembesi) and axial Royal Palms
 *   - Jalan Medan Merdeka perimeter ring & distant Jakarta civic landmarks
 *     (Istana Merdeka, Istiqlal/Cathedral corridor, Museum Nasional, Balai Kota)
 */

function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createMedanMerdekaWorld({ THREE, scene }) {
  const root = new THREE.Group();
  root.name = 'medan_merdeka_world';

  // Shared materials tagged with floorTextureKey for Stage 4 PBR upgrade
  const turfMat = new THREE.MeshStandardMaterial({
    name: 'mm_tropical_turf',
    color: 0x5c7c48,
    roughness: 0.92,
    metalness: 0.0,
  });
  turfMat.userData.floorTextureKey = 'tropical_turf';

  const pavingMat = new THREE.MeshStandardMaterial({
    name: 'mm_andesite_plaza',
    color: 0xc2bcb0,
    roughness: 0.78,
    metalness: 0.03,
  });
  pavingMat.userData.floorTextureKey = 'andesite_paving';

  const innerPlazaMat = new THREE.MeshStandardMaterial({
    name: 'mm_silang_stone',
    color: 0xd4cec2,
    roughness: 0.74,
    metalness: 0.03,
  });
  innerPlazaMat.userData.floorTextureKey = 'andesite_paving';

  const asphaltMat = new THREE.MeshStandardMaterial({
    name: 'mm_asphalt_avenue',
    color: 0x3b4048,
    roughness: 0.82,
    metalness: 0.04,
  });
  asphaltMat.userData.floorTextureKey = 'asphalt_road';

  const waterMat = new THREE.MeshStandardMaterial({
    name: 'mm_reflecting_pool_water',
    color: 0x1e3c4c,
    roughness: 0.08,
    metalness: 0.48,
  });

  const civicMat = new THREE.MeshStandardMaterial({
    name: 'mm_jakarta_civic_massing',
    color: 0xb9bec4,
    roughness: 0.86,
    metalness: 0.04,
  });

  const trunkMat = new THREE.MeshStandardMaterial({
    name: 'mm_tree_trunk',
    color: 0x574838,
    roughness: 0.92,
    metalness: 0.0,
  });

  const canopyMat = new THREE.MeshStandardMaterial({
    name: 'mm_tropical_canopy',
    color: 0xffffff,
    roughness: 0.84,
    metalness: 0.0,
  });

  const nightPoolLights = [];

  // 1. Wide Medan Merdeka Terrain Skirt (2300 × 2300 m around central plaza)
  // Cut out clean 80.2 × 80.2 m central bay using 4 outer lawn quadrants so subterranean museum stays unobstructed!
  const terrainGroup = new THREE.Group();
  terrainGroup.name = 'mm_terrain_skirt';
  const skirtHalf = 1150;
  const innerHalf = 40.1;

  // Build 4 surrounding ground quads around [-40.1, +40.1] central excavation aperture
  const bandDepth = skirtHalf - innerHalf;
  const centerBand = innerHalf + bandDepth * 0.5;

  const groundNorth = new THREE.Mesh(
    new THREE.PlaneGeometry(skirtHalf * 2, bandDepth),
    turfMat
  );
  groundNorth.rotation.x = -Math.PI / 2;
  groundNorth.position.set(0, -0.05, -centerBand);
  groundNorth.receiveShadow = true;
  terrainGroup.add(groundNorth);

  const groundSouth = new THREE.Mesh(
    new THREE.PlaneGeometry(skirtHalf * 2, bandDepth),
    turfMat
  );
  groundSouth.rotation.x = -Math.PI / 2;
  groundSouth.position.set(0, -0.05, centerBand);
  groundSouth.receiveShadow = true;
  terrainGroup.add(groundSouth);

  const groundWest = new THREE.Mesh(
    new THREE.PlaneGeometry(bandDepth, innerHalf * 2),
    turfMat
  );
  groundWest.rotation.x = -Math.PI / 2;
  groundWest.position.set(-centerBand, -0.05, 0);
  groundWest.receiveShadow = true;
  terrainGroup.add(groundWest);

  const groundEast = new THREE.Mesh(
    new THREE.PlaneGeometry(bandDepth, innerHalf * 2),
    turfMat
  );
  groundEast.rotation.x = -Math.PI / 2;
  groundEast.position.set(centerBand, -0.05, 0);
  groundEast.receiveShadow = true;
  terrainGroup.add(groundEast);

  root.add(terrainGroup);

  // 2. Silang Monas Ceremonial Stone Promenade & Axial Avenues
  const plazaGroup = new THREE.Group();
  plazaGroup.name = 'mm_silang_plaza';

  // Ring plaza outside central 80 × 80 m monument pad (from radius 40 m out to 62 m)
  const plazaRingNorth = new THREE.Mesh(new THREE.BoxGeometry(126, 0.08, 22), innerPlazaMat);
  plazaRingNorth.position.set(0, -0.01, -51.2);
  plazaRingNorth.receiveShadow = true;
  plazaGroup.add(plazaRingNorth);

  const plazaRingSouth = new THREE.Mesh(new THREE.BoxGeometry(126, 0.08, 22), innerPlazaMat);
  plazaRingSouth.position.set(0, -0.01, 51.2);
  plazaRingSouth.receiveShadow = true;
  plazaGroup.add(plazaRingSouth);

  const plazaRingWest = new THREE.Mesh(new THREE.BoxGeometry(22, 0.08, 80.4), innerPlazaMat);
  plazaRingWest.position.set(-51.2, -0.01, 0);
  plazaRingWest.receiveShadow = true;
  plazaGroup.add(plazaRingWest);

  const plazaRingEast = new THREE.Mesh(new THREE.BoxGeometry(22, 0.08, 80.4), innerPlazaMat);
  plazaRingEast.position.set(51.2, -0.01, 0);
  plazaRingEast.receiveShadow = true;
  plazaGroup.add(plazaRingEast);

  // Cardinal Grand Avenues (North, South, East, West out to ±340 m)
  const avenueLen = 278;
  const avenueOffset = 62 + avenueLen * 0.5;
  for (let side = 0; side < 4; side++) {
    const a = side * (Math.PI / 2);
    const av = new THREE.Mesh(new THREE.BoxGeometry(24, 0.07, avenueLen), pavingMat);
    av.position.set(Math.sin(a) * avenueOffset, -0.015, Math.cos(a) * avenueOffset);
    av.rotation.y = a;
    av.receiveShadow = true;
    plazaGroup.add(av);
  }

  // Signature Diagonal Silang (Cross) Walkways radiating at 45 degrees
  for (let d = 0; d < 4; d++) {
    const a = d * (Math.PI / 2) + Math.PI / 4;
    const diag = new THREE.Mesh(new THREE.BoxGeometry(11, 0.06, 290), pavingMat);
    diag.position.set(Math.sin(a) * 208, -0.02, Math.cos(a) * 208);
    diag.rotation.y = a;
    diag.receiveShadow = true;
    plazaGroup.add(diag);
  }

  root.add(plazaGroup);

  // 3. Four Symmetrical Reflecting Pools along Monument Apron Corners
  const poolGroup = new THREE.Group();
  poolGroup.name = 'mm_reflecting_pools';
  const poolFrameGeo = new THREE.BoxGeometry(24, 0.32, 14);
  const poolWaterGeo = new THREE.PlaneGeometry(22.2, 12.2);

  for (let q = 0; q < 4; q++) {
    const sx = q % 2 === 0 ? -1 : 1;
    const sz = q < 2 ? -1 : 1;
    const px = sx * 52;
    const pz = sz * 52;

    const coping = new THREE.Mesh(poolFrameGeo, innerPlazaMat);
    coping.position.set(px, 0.06, pz);
    coping.rotation.y = Math.atan2(sx, sz) + Math.PI / 4;
    coping.receiveShadow = true;
    poolGroup.add(coping);

    const water = new THREE.Mesh(poolWaterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.rotation.z = -(Math.atan2(sx, sz) + Math.PI / 4);
    water.position.set(px, 0.23, pz);
    poolGroup.add(water);
  }
  root.add(poolGroup);

  // 4. Jalan Medan Merdeka Perimeter Avenue Ring (±355 m square boulevard)
  const roadGroup = new THREE.Group();
  roadGroup.name = 'mm_perimeter_roads';
  const roadWidth = 22;
  const roadRadius = 355;
  const roadNS = new THREE.BoxGeometry(roadRadius * 2 + roadWidth, 0.08, roadWidth);
  const roadEW = new THREE.BoxGeometry(roadWidth, 0.08, roadRadius * 2 - roadWidth);
  for (const s of [-roadRadius, roadRadius]) {
    const rN = new THREE.Mesh(roadNS, asphaltMat);
    rN.position.set(0, -0.01, s);
    rN.receiveShadow = true;
    roadGroup.add(rN);
    const rE = new THREE.Mesh(roadEW, asphaltMat);
    rE.position.set(s, -0.01, 0);
    rE.receiveShadow = true;
    roadGroup.add(rE);
  }
  root.add(roadGroup);

  // 5. Tropical Rain Trees & Axial Royal Palms (InstancedMesh)
  const treesGroup = new THREE.Group();
  treesGroup.name = 'mm_park_trees';
  const rand = seededRandom(19610817);

  // Generate tropical Angsana broadleaf park clusters in outer quadrants
  const treeCoords = [];
  for (let i = 0; i < 240; i++) {
    const x = (rand() * 2 - 1) * 320;
    const z = (rand() * 2 - 1) * 320;
    const ax = Math.abs(x);
    const az = Math.abs(z);
    // Keep clear of central 72 m plaza, cardinal avenues (|x|<22 or |z|<22), and diagonal walks
    if (ax < 72 && az < 72) continue;
    if (ax < 21 || az < 21) continue;
    if (Math.abs(ax - az) < 16) continue;
    treeCoords.push({
      x,
      z,
      scale: 0.78 + rand() * 0.65,
      rotY: rand() * Math.PI * 2,
      greenTint: rand(),
    });
  }

  const trunkGeo = new THREE.CylinderGeometry(0.32, 0.48, 4.4, 6);
  const canopyGeo = new THREE.DodecahedronGeometry(3.8, 1);
  const treeTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCoords.length);
  const treeCanopies = new THREE.InstancedMesh(canopyGeo, canopyMat, treeCoords.length);
  treeTrunks.castShadow = true;
  treeCanopies.castShadow = true;
  treeCanopies.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const cColor = new THREE.Color();
  for (let i = 0; i < treeCoords.length; i++) {
    const t = treeCoords[i];
    dummy.position.set(t.x, 2.1 * t.scale, t.z);
    dummy.rotation.set(0, t.rotY, 0);
    dummy.scale.setScalar(t.scale);
    dummy.updateMatrix();
    treeTrunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(t.x, 5.4 * t.scale, t.z);
    dummy.scale.set(t.scale * 1.18, t.scale * 0.72, t.scale * 1.18);
    dummy.updateMatrix();
    treeCanopies.setMatrixAt(i, dummy.matrix);

    cColor.setRGB(
      0.16 + t.greenTint * 0.08,
      0.34 + t.greenTint * 0.14,
      0.14 + t.greenTint * 0.05
    );
    treeCanopies.setColorAt(i, cColor);
  }
  treeTrunks.instanceMatrix.needsUpdate = true;
  treeCanopies.instanceMatrix.needsUpdate = true;
  if (treeCanopies.instanceColor) treeCanopies.instanceColor.needsUpdate = true;
  treesGroup.add(treeTrunks, treeCanopies);

  // Axial Royal Palms framing the four Silang avenues cleanly
  const palmPositions = [];
  for (let d = 78; d <= 320; d += 26) {
    for (const side of [-1, 1]) {
      palmPositions.push({ x: side * 14.5, z: d });
      palmPositions.push({ x: side * 14.5, z: -d });
      palmPositions.push({ x: d, z: side * 14.5 });
      palmPositions.push({ x: -d, z: side * 14.5 });
    }
  }
  const palmTrunkGeo = new THREE.CylinderGeometry(0.2, 0.32, 9.5, 6);
  const palmCrownGeo = new THREE.ConeGeometry(2.6, 2.2, 7);
  const palmTrunks = new THREE.InstancedMesh(palmTrunkGeo, trunkMat, palmPositions.length);
  const palmCrowns = new THREE.InstancedMesh(palmCrownGeo, canopyMat, palmPositions.length);
  palmTrunks.castShadow = true;
  palmCrowns.castShadow = true;

  for (let i = 0; i < palmPositions.length; i++) {
    const p = palmPositions[i];
    dummy.position.set(p.x, 4.7, p.z);
    dummy.rotation.set(0, (i * 1.3) % 6.28, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    palmTrunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, 9.6, p.z);
    dummy.rotation.set(Math.PI, (i * 1.3) % 6.28, 0);
    dummy.updateMatrix();
    palmCrowns.setMatrixAt(i, dummy.matrix);

    cColor.setRGB(0.2, 0.42, 0.16);
    palmCrowns.setColorAt(i, cColor);
  }
  palmTrunks.instanceMatrix.needsUpdate = true;
  palmCrowns.instanceMatrix.needsUpdate = true;
  if (palmCrowns.instanceColor) palmCrowns.instanceColor.needsUpdate = true;
  treesGroup.add(palmTrunks, palmCrowns);

  root.add(treesGroup);

  // 6. Distant Jakarta Civic Skyline Massing (outside perimeter avenue 405..620 m)
  const skylineGroup = new THREE.Group();
  skylineGroup.name = 'mm_jakarta_skyline';

  // North: Istana Merdeka portico silhouette
  const istanaBody = new THREE.Mesh(new THREE.BoxGeometry(92, 16, 36), civicMat);
  istanaBody.position.set(0, 8, -420);
  skylineGroup.add(istanaBody);

  // Northeast: Istiqlal Dome silhouette
  const istiqlalBase = new THREE.Mesh(new THREE.BoxGeometry(86, 22, 68), civicMat);
  istiqlalBase.position.set(390, 11, -370);
  skylineGroup.add(istiqlalBase);
  const istiqlalDome = new THREE.Mesh(
    new THREE.SphereGeometry(22, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
    civicMat
  );
  istiqlalDome.position.set(390, 22, -370);
  skylineGroup.add(istiqlalDome);

  // West: Museum Nasional (Gedung Gajah) silhouette
  const musNas = new THREE.Mesh(new THREE.BoxGeometry(34, 15, 76), civicMat);
  musNas.position.set(-415, 7.5, 42);
  skylineGroup.add(musNas);

  // Outer Jakarta mid-rise & office skyline silhouettes fading softly into mist
  const towerRand = seededRandom(19750712);
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const cityInst = new THREE.InstancedMesh(boxGeo, civicMat, 64);
  for (let i = 0; i < 64; i++) {
    const angle = (i / 64) * Math.PI * 2 + (towerRand() - 0.5) * 0.08;
    const dist = 450 + towerRand() * 210;
    const w = 22 + towerRand() * 28;
    const d = 22 + towerRand() * 28;
    const h = 24 + towerRand() * 78;
    dummy.position.set(Math.sin(angle) * dist, h * 0.5, Math.cos(angle) * dist);
    dummy.rotation.set(0, angle, 0);
    dummy.scale.set(w, h, d);
    dummy.updateMatrix();
    cityInst.setMatrixAt(i, dummy.matrix);
  }
  cityInst.instanceMatrix.needsUpdate = true;
  skylineGroup.add(cityInst);
  root.add(skylineGroup);

  scene.add(root);

  return {
    root,
    setNightFactor(t) {
      const f = Math.max(0, Math.min(1, Number(t) || 0));
      waterMat.color.setHex(f > 0.5 ? 0x102234 : 0x1e3c4c);
      waterMat.roughness = 0.08 + (1 - f) * 0.05;
      for (let i = 0; i < nightPoolLights.length; i++) {
        nightPoolLights[i].intensity = f * 1.4;
      }
    },
    upgradePbr(precomputedWorldMaps = null) {
      if (!precomputedWorldMaps?.facadeAlbedo) return;
      const s = precomputedWorldMaps.size || 96;
      const tex = new THREE.DataTexture(
        precomputedWorldMaps.facadeAlbedo,
        s,
        s,
        THREE.RGBAFormat,
        THREE.UnsignedByteType
      );
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 4);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      civicMat.map = tex;
      civicMat.needsUpdate = true;
    },
    getMetrics() {
      return {
        plazaSpanM: 710,
        skirtHalfExtentM: 1150,
        treeCount: treeCoords.length + palmPositions.length,
        skylineBlocks: 67,
      };
    },
  };
}
