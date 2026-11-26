/**
 * Monas 3D Experience — Architectural PBR Material Bank (`model/materials.js`)
 *
 * Synthesizes procedural PBR textures & materials specific to Monas:
 *   - Indonesian cream-veined marble (obelisk exterior & Cawan terrace)
 *   - Poured structural concrete (core shaft, piles, underground museum)
 *   - Dark patinated cast bronze (chalice cradle & architectural reliefs)
 *   - Gilded 24k gold leaf (Lidah Api flame crown)
 *   - Structural steel & crane paint (1960s construction cranes & hoists)
 */

function hash2(ix, iy, seed) {
  let n = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0;
  n = (n ^ (n >> 13)) | 0;
  n = Math.imul(n, 1274126177);
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function noise2(x, y, period, seed) {
  const fx = x - Math.floor(x);
  const fy = y - Math.floor(y);
  const ix0 = ((Math.floor(x) % period) + period) % period;
  const iy0 = ((Math.floor(y) % period) + period) % period;
  const ix1 = (ix0 + 1) % period;
  const iy1 = (iy0 + 1) % period;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  return (
    hash2(ix0, iy0, seed) * (1 - u) * (1 - v) +
    hash2(ix1, iy0, seed) * u * (1 - v) +
    hash2(ix0, iy1, seed) * (1 - u) * v +
    hash2(ix1, iy1, seed) * u * v
  );
}

function fbm(u, v, freq, octaves, seed) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let f = freq;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise2(u * f, v * f, f, seed + o * 19);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return norm > 0 ? sum / norm : 0;
}

function generateMap(size, pixelFn, normalStrength = 1.3) {
  const height = new Float32Array(size * size);
  const albedo = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const roughness = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const idx = y * size + x;
      const { h, r, g, b, rough } = pixelFn(u, v);
      height[idx] = h;
      const p4 = idx * 4;
      albedo[p4] = Math.max(0, Math.min(255, Math.round(r)));
      albedo[p4 + 1] = Math.max(0, Math.min(255, Math.round(g)));
      albedo[p4 + 2] = Math.max(0, Math.min(255, Math.round(b)));
      albedo[p4 + 3] = 255;
      const rv = Math.max(12, Math.min(255, Math.round(rough * 255)));
      roughness[p4] = rv;
      roughness[p4 + 1] = rv;
      roughness[p4 + 2] = rv;
      roughness[p4 + 3] = 255;
    }
  }

  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;
      const dhdx = (height[y * size + xp] - height[y * size + xm]) * normalStrength;
      const dhdy = (height[yp * size + x] - height[ym * size + x]) * normalStrength;
      let nx = -dhdx;
      let ny = -dhdy;
      let nz = 1.0;
      const inv = 1.0 / Math.hypot(nx, ny, nz);
      nx *= inv;
      ny *= inv;
      nz *= inv;
      const p4 = (y * size + x) * 4;
      normal[p4] = Math.round((nx * 0.5 + 0.5) * 255);
      normal[p4 + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normal[p4 + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normal[p4 + 3] = 255;
    }
  }

  return { size, albedo, normal, roughness };
}

export function synthesizeTowerPbrRawBank() {
  const marble = generateMap(
    128,
    (u, v) => {
      const warp = fbm(u, v, 4, 3, 17);
      const vein = Math.abs(Math.sin((u * 3.0 + v * 1.5 + warp * 2.4) * Math.PI));
      const slabX = Math.abs(((u * 4) % 1) - 0.5);
      const slabY = Math.abs(((v * 6) % 1) - 0.5);
      const seam = slabX > 0.48 || slabY > 0.48 ? -0.14 : 0.0;
      const slabShift = hash2(Math.floor(u * 4), Math.floor(v * 6), 41) * 8 - 4;
      const warmCream = 232 - (1 - vein) * 18 + slabShift + seam * 60;
      return {
        h: 0.5 + vein * 0.06 + seam,
        r: warmCream + 5,
        g: warmCream - 1,
        b: warmCream - 14,
        rough: seam < 0 ? 0.8 : 0.34 + (1 - vein) * 0.12,
      };
    },
    1.1
  );

  const concrete = generateMap(
    128,
    (u, v) => {
      const grain = fbm(u, v, 16, 4, 67);
      const formBand = Math.abs(((v * 8) % 1) - 0.5) > 0.47 ? -0.1 : 0.0;
      const base = 132 + grain * 32 + formBand * 45;
      return {
        h: grain * 0.75 + formBand,
        r: base + 3,
        g: base + 1,
        b: base - 4,
        rough: 0.86 + (1 - grain) * 0.1,
      };
    },
    1.8
  );

  const bronze = generateMap(
    128,
    (u, v) => {
      const pat = fbm(u, v, 10, 3, 93);
      return {
        h: pat * 0.4,
        r: 72 + pat * 24,
        g: 55 + pat * 18,
        b: 36 + pat * 12,
        rough: 0.44 + pat * 0.16,
      };
    },
    1.0
  );

  const gold = generateMap(
    128,
    (u, v) => {
      const foil = fbm(u, v, 12, 3, 127);
      return {
        h: foil * 0.18,
        r: 238 + foil * 14,
        g: 186 + foil * 18,
        b: 62 + foil * 16,
        rough: 0.15 + foil * 0.08,
      };
    },
    0.7
  );

  return { marble, concrete, bronze, gold };
}

function hydrateDataTex(THREE, bytes, size, isSrgb, repeatX = 1, repeatY = 1) {
  const tex = new THREE.DataTexture(bytes, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = isSrgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export function hydrateTowerPbrBank(THREE, rawBank) {
  const src = rawBank || synthesizeTowerPbrRawBank();
  const out = {};
  for (const [key, item] of Object.entries(src)) {
    if (!item || !item.albedo) continue;
    const size = item.size || 128;
    const rep = key === 'marble' ? 2 : key === 'concrete' ? 3 : 1;
    out[key] = {
      map: hydrateDataTex(THREE, item.albedo, size, true, rep, rep),
      normalMap: hydrateDataTex(THREE, item.normal, size, false, rep, rep),
      roughnessMap: hydrateDataTex(THREE, item.roughness, size, false, rep, rep),
    };
  }
  return out;
}

export function createMaterials(THREE) {
  const marble = new THREE.MeshStandardMaterial({
    name: 'monas_cream_marble',
    color: 0xf4eee1,
    roughness: 0.36,
    metalness: 0.04,
  });

  const concreteCore = new THREE.MeshStandardMaterial({
    name: 'monas_concrete_core',
    color: 0x908d86,
    roughness: 0.88,
    metalness: 0.03,
  });

  const basementConcrete = new THREE.MeshStandardMaterial({
    name: 'monas_basement_concrete',
    color: 0x73706a,
    roughness: 0.9,
    metalness: 0.02,
  });

  const darkTrimStone = new THREE.MeshStandardMaterial({
    name: 'monas_dark_andesite_trim',
    color: 0x56544f,
    roughness: 0.82,
    metalness: 0.04,
  });

  const castBronze = new THREE.MeshStandardMaterial({
    name: 'monas_cast_bronze',
    color: 0x4b3b29,
    roughness: 0.42,
    metalness: 0.78,
  });

  const goldFlame = new THREE.MeshStandardMaterial({
    name: 'monas_gold_lidah_api',
    color: 0xf2c24b,
    roughness: 0.16,
    metalness: 0.9,
    emissive: 0x000000,
    emissiveIntensity: 0.0,
  });
  goldFlame.userData.isLidahApiGold = true;

  const craneSteel = new THREE.MeshStandardMaterial({
    name: 'monas_crane_steel',
    color: 0xb97a32,
    roughness: 0.56,
    metalness: 0.62,
  });

  const scaffoldSteel = new THREE.MeshStandardMaterial({
    name: 'monas_scaffold_steel',
    color: 0x62666b,
    roughness: 0.68,
    metalness: 0.55,
  });

  const elevatorGlass = new THREE.MeshStandardMaterial({
    name: 'monas_elevator_glass',
    color: 0x8ea9bc,
    roughness: 0.18,
    metalness: 0.35,
  });

  const blueprintGuide = new THREE.MeshStandardMaterial({
    name: 'monas_blueprint_plinth',
    color: 0xd4a93c,
    roughness: 0.45,
    metalness: 0.25,
  });

  return {
    marble,
    concreteCore,
    basementConcrete,
    darkTrimStone,
    castBronze,
    goldFlame,
    craneSteel,
    scaffoldSteel,
    elevatorGlass,
    blueprintGuide,
    all: [
      marble,
      concreteCore,
      basementConcrete,
      darkTrimStone,
      castBronze,
      goldFlame,
      craneSteel,
      scaffoldSteel,
      elevatorGlass,
      blueprintGuide,
    ],
  };
}

export function upgradeTowerMaterialsAndDecks(THREE, materialBank, precomputedRawBank = null) {
  if (!materialBank) return null;
  const pbr = hydrateTowerPbrBank(THREE, precomputedRawBank);

  if (materialBank.marble && pbr.marble) {
    materialBank.marble.map = pbr.marble.map;
    materialBank.marble.normalMap = pbr.marble.normalMap;
    materialBank.marble.roughnessMap = pbr.marble.roughnessMap;
    materialBank.marble.normalScale = new THREE.Vector2(0.5, 0.5);
    materialBank.marble.needsUpdate = true;
  }
  if (materialBank.concreteCore && pbr.concrete) {
    materialBank.concreteCore.map = pbr.concrete.map;
    materialBank.concreteCore.normalMap = pbr.concrete.normalMap;
    materialBank.concreteCore.roughnessMap = pbr.concrete.roughnessMap;
    materialBank.concreteCore.normalScale = new THREE.Vector2(0.7, 0.7);
    materialBank.concreteCore.needsUpdate = true;
  }
  if (materialBank.basementConcrete && pbr.concrete) {
    materialBank.basementConcrete.map = pbr.concrete.map;
    materialBank.basementConcrete.normalMap = pbr.concrete.normalMap;
    materialBank.basementConcrete.needsUpdate = true;
  }
  if (materialBank.castBronze && pbr.bronze) {
    materialBank.castBronze.map = pbr.bronze.map;
    materialBank.castBronze.normalMap = pbr.bronze.normalMap;
    materialBank.castBronze.roughnessMap = pbr.bronze.roughnessMap;
    materialBank.castBronze.needsUpdate = true;
  }
  if (materialBank.goldFlame && pbr.gold) {
    materialBank.goldFlame.map = pbr.gold.map;
    materialBank.goldFlame.normalMap = pbr.gold.normalMap;
    materialBank.goldFlame.roughnessMap = pbr.gold.roughnessMap;
    materialBank.goldFlame.normalScale = new THREE.Vector2(0.35, 0.35);
    materialBank.goldFlame.needsUpdate = true;
  }

  return pbr;
}

export function createOverrideMaterials(THREE) {
  return {
    ink: new THREE.MeshBasicMaterial({ color: 0x162238, wireframe: true }),
    xray: new THREE.MeshBasicMaterial({
      color: 0xd4a93c,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      wireframe: false,
    }),
    silhouette: new THREE.MeshBasicMaterial({ color: 0xf4efe6 }),
  };
}

export function applyRenderModeToGroup(group, mode, overrideMaterials) {
  if (!group) return;
  group.traverse((obj) => {
    if (!obj.isMesh) return;
    if (!obj.userData.__origMaterial) {
      obj.userData.__origMaterial = obj.material;
    }
    if (mode === 'pbr' || !overrideMaterials?.[mode]) {
      obj.material = obj.userData.__origMaterial;
    } else {
      obj.material = overrideMaterials[mode];
    }
  });
}
