/**
 * Monas Zone 2 — Stepped Plinth & Flaring 45 × 45 m Cawan Chalice (`monas_zone2_cawan.js`)
 *
 * Architectural specification (PRD §4):
 *   - Stepped base plaza podium (54 × 54 m, y = 0..2.2 m) + 4 cardinal grand stairs
 *   - Concrete core support + 8 structural chalice ribs
 *   - Flaring curved 45 × 45 m square Cawan bowl rising from y = 2.2 m to y = 17.0 m
 *   - Cawan observation terrace deck, cream marble cladding, and parapet balustrade
 *   - Central obelisk collar & Ruang Kemerdekaan architectural relief walls at y = 17 m
 */

function createFlaredSquareShellGeo(THREE, yBottom, yTop, halfBottom, halfTop, steps = 10) {
  // Parametric square-profile lofted shell flaring parabolically outward like Monas's Cawan
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const ringCount = steps + 1;
  const cornerVerts = 5; // 4 sides, wrapping index 4 back to 0

  const profile = [];
  for (let i = 0; i < ringCount; i++) {
    const t = i / steps;
    // Concave chalice sweep curve: gentle base neck expanding boldly toward top 45x45m rim
    const flare = Math.pow(t, 1.55);
    const half = halfBottom + (halfTop - halfBottom) * flare;
    const y = yBottom + (yTop - yBottom) * t;
    profile.push({ y, half, t });
  }

  // Build 4 explicit flat-ish curved faces with crisp architectural bevel corners
  for (let side = 0; side < 4; side++) {
    const baseVertexOffset = positions.length / 3;
    const ang = side * (Math.PI / 2);
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);

    for (let i = 0; i < ringCount; i++) {
      const { y, half, t } = profile[i];
      const nextP = profile[Math.min(ringCount - 1, i + 1)];
      const prevP = profile[Math.max(0, i - 1)];
      const dh = nextP.half - prevP.half;
      const dy = Math.max(0.001, nextP.y - prevP.y);
      const slopeLen = Math.hypot(dh, dy);
      const nxLocal = 0;
      const nyLocal = -dh / slopeLen;
      const nzLocal = dy / slopeLen;

      // Rotate outward normal for this side (+Z is side 0)
      const nX = nxLocal * cosA + nzLocal * sinA;
      const nY = nyLocal;
      const nZ = -nxLocal * sinA + nzLocal * cosA;

      for (let sx = 0; sx < cornerVerts; sx++) {
        const u = sx / (cornerVerts - 1);
        const lx = -half + u * (half * 2);
        const lz = half;
        const wx = lx * cosA + lz * sinA;
        const wz = -lx * sinA + lz * cosA;
        positions.push(wx, y, wz);
        normals.push(nX, nY, nZ);
        uvs.push(u * 3.0, t * 2.0);
      }
    }

    for (let i = 0; i < steps; i++) {
      for (let sx = 0; sx < cornerVerts - 1; sx++) {
        const a = baseVertexOffset + i * cornerVerts + sx;
        const b = a + 1;
        const c = baseVertexOffset + (i + 1) * cornerVerts + sx;
        const d = c + 1;
        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }
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

export function buildMonasZone2Cawan(THREE, materials) {
  const group = new THREE.Group();
  group.name = 'zone2_cawan';

  // 1. Stepped Podium Base (54 × 54 m) & 4 Ceremonial Staircases
  const podiumGroup = new THREE.Group();
  podiumGroup.name = 'm2_cawan_podium';
  const step1 = new THREE.Mesh(new THREE.BoxGeometry(54, 0.9, 54), materials.darkTrimStone);
  step1.position.set(0, 0.45, 0);
  step1.castShadow = true;
  step1.receiveShadow = true;
  podiumGroup.add(step1);

  const step2 = new THREE.Mesh(new THREE.BoxGeometry(47, 1.3, 47), materials.marble);
  step2.position.set(0, 1.55, 0);
  step2.castShadow = true;
  step2.receiveShadow = true;
  podiumGroup.add(step2);

  // Cardinal ceremonial stair flights
  for (let side = 0; side < 4; side++) {
    const stairPivot = new THREE.Group();
    stairPivot.rotation.y = side * (Math.PI / 2);
    for (let st = 0; st < 5; st++) {
      const tread = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.42, 1.1),
        st % 2 === 0 ? materials.marble : materials.darkTrimStone
      );
      tread.position.set(0, 0.21 + st * 0.4, 27.6 - st * 0.9);
      tread.castShadow = true;
      tread.receiveShadow = true;
      stairPivot.add(tread);
    }
    podiumGroup.add(stairPivot);
  }
  podiumGroup.userData.kinematics = { kind: 'rise_scale_y', startStep: 3.15, fullStep: 3.9, originY: 0 };
  group.add(podiumGroup);

  // 2. Concrete Cawan Structural Ribs & Core Neck (Step 3.6..4.4)
  const concreteCawanGroup = new THREE.Group();
  concreteCawanGroup.name = 'm2_cawan_concrete_frame';

  const coreCollar = new THREE.Mesh(
    createFlaredSquareShellGeo(THREE, 2.2, 16.5, 9.2, 21.8, 8),
    materials.concreteCore
  );
  coreCollar.castShadow = true;
  coreCollar.receiveShadow = true;
  concreteCawanGroup.add(coreCollar);

  // 8 structural radial/corner buttress ribs supporting the 45x45m Cawan
  const ribGeo = new THREE.BoxGeometry(1.15, 16.2, 3.2);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const rib = new THREE.Mesh(ribGeo, materials.concreteCore);
    const radius = i % 2 === 0 ? 15.0 : 18.2;
    rib.position.set(Math.sin(angle) * radius, 9.2, Math.cos(angle) * radius);
    rib.rotation.y = angle;
    rib.rotation.x = -0.58;
    rib.castShadow = true;
    concreteCawanGroup.add(rib);
  }
  concreteCawanGroup.userData.kinematics = { kind: 'cawan_flare_assemble', startStep: 3.55, fullStep: 4.35 };
  group.add(concreteCawanGroup);

  // 3. Marble Clad 45 × 45 m Cawan Exterior, Terrace Deck (y=17m), Parapet & Ruang Kemerdekaan
  const marbleCawanGroup = new THREE.Group();
  marbleCawanGroup.name = 'm2_cawan_marble_terrace';

  // Exterior marble chalice shell reaching exact 45 × 45 m (half = 22.5) at y = 17.0 m
  const marbleShell = new THREE.Mesh(
    createFlaredSquareShellGeo(THREE, 2.2, 17.0, 9.65, 22.5, 10),
    materials.marble
  );
  marbleShell.castShadow = true;
  marbleShell.receiveShadow = true;
  marbleCawanGroup.add(marbleShell);

  // Underside fascia trim cornice at 17 m rim (45.2 × 45.2 m)
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(45.4, 0.85, 45.4), materials.marble);
  cornice.position.set(0, 16.75, 0);
  cornice.castShadow = true;
  cornice.receiveShadow = true;
  marbleCawanGroup.add(cornice);

  // Upper 45 × 45 m Pelataran Cawan terrace floor slab
  const terraceDeck = new THREE.Mesh(new THREE.BoxGeometry(44.8, 0.36, 44.8), materials.marble);
  terraceDeck.position.set(0, 17.05, 0);
  terraceDeck.receiveShadow = true;
  marbleCawanGroup.add(terraceDeck);

  // Perimeter safety parapet balustrade around 45 × 45 m Cawan (y = 17.2..18.25 m)
  const railLong = new THREE.BoxGeometry(45.0, 1.05, 0.55);
  const railShort = new THREE.BoxGeometry(0.55, 1.05, 43.9);
  for (const s of [-22.2, 22.2]) {
    const rn = new THREE.Mesh(railLong, materials.marble);
    rn.position.set(0, 17.72, s);
    rn.castShadow = true;
    rn.receiveShadow = true;
    marbleCawanGroup.add(rn);

    const re = new THREE.Mesh(railShort, materials.marble);
    re.position.set(s, 17.72, 0);
    re.castShadow = true;
    re.receiveShadow = true;
    marbleCawanGroup.add(re);
  }

  // Ruang Kemerdekaan central architectural sanctuary base on top of Cawan (y = 17.1..19.2 m)
  const sanctuaryBase = new THREE.Mesh(new THREE.BoxGeometry(19.0, 2.1, 19.0), materials.marble);
  sanctuaryBase.position.set(0, 18.15, 0);
  sanctuaryBase.castShadow = true;
  sanctuaryBase.receiveShadow = true;
  marbleCawanGroup.add(sanctuaryBase);

  // 4 ceremonial bronze/dark entry portals on sanctuary base faces
  const portalGeo = new THREE.BoxGeometry(4.2, 2.1, 0.45);
  for (let side = 0; side < 4; side++) {
    const portal = new THREE.Mesh(portalGeo, materials.castBronze);
    const a = side * (Math.PI / 2);
    portal.position.set(Math.sin(a) * 9.55, 18.1, Math.cos(a) * 9.55);
    portal.rotation.y = a;
    marbleCawanGroup.add(portal);
  }

  marbleCawanGroup.userData.kinematics = { kind: 'marble_panel_sheathe', startStep: 4.55, fullStep: 5.25 };
  group.add(marbleCawanGroup);

  return group;
}
