/**
 * Monas 3D Experience — Procedural Ground & Paving PBR Texture Bank (`model/floor_textures.js`)
 *
 * Pure-JS off-thread compatible procedural texture synthesizer for Medan Merdeka
 * andesite/travertine stone paving, tropical lawn turf, asphalt perimeter avenues,
 * and Plaza reflecting pool water surfaces.
 */

function hash2D(ix, iy, seed) {
  let n = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0;
  n = (n ^ (n >> 13)) | 0;
  n = Math.imul(n, 1274126177);
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function smoothNoise(x, y, period, seed) {
  const fx = x - Math.floor(x);
  const fy = y - Math.floor(y);
  const ix0 = ((Math.floor(x) % period) + period) % period;
  const iy0 = ((Math.floor(y) % period) + period) % period;
  const ix1 = (ix0 + 1) % period;
  const iy1 = (iy0 + 1) % period;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash2D(ix0, iy0, seed);
  const b = hash2D(ix1, iy0, seed);
  const c = hash2D(ix0, iy1, seed);
  const d = hash2D(ix1, iy1, seed);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function fbmTileable(u, v, baseFreq, octaves, seed) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let freq = baseFreq;
  for (let o = 0; o < octaves; o++) {
    sum += amp * smoothNoise(u * freq, v * freq, freq, seed + o * 37);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return norm > 0 ? sum / norm : 0;
}

function buildPbrMapsFromHeight(size, heightFn, colorFn, roughFn, normalStrength = 1.8) {
  const height = new Float32Array(size * size);
  const albedo = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const roughness = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const idx = y * size + x;
      const h = heightFn(u, v);
      height[idx] = h;
      const [r, g, b] = colorFn(u, v, h);
      const p4 = idx * 4;
      albedo[p4] = Math.max(0, Math.min(255, Math.round(r)));
      albedo[p4 + 1] = Math.max(0, Math.min(255, Math.round(g)));
      albedo[p4 + 2] = Math.max(0, Math.min(255, Math.round(b)));
      albedo[p4 + 3] = 255;

      const rough = Math.max(0.08, Math.min(1.0, roughFn(u, v, h)));
      const rv = Math.round(rough * 255);
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

function makeAndesitePavingRaw(size = 128) {
  return buildPbrMapsFromHeight(
    size,
    (u, v) => {
      const n = fbmTileable(u, v, 8, 4, 11);
      const gx = Math.abs(((u * 6) % 1) - 0.5);
      const gy = Math.abs(((v * 6) % 1) - 0.5);
      const joint = gx > 0.465 || gy > 0.465 ? -0.18 : 0.0;
      return n * 0.8 + joint;
    },
    (u, v, h) => {
      const tileTint = hash2D(Math.floor(u * 6), Math.floor(v * 6), 31) * 14 - 7;
      const base = 158 + h * 34 + tileTint;
      return [base + 4, base + 1, base - 4];
    },
    (u, v, h) => 0.72 + (1 - Math.max(0, h)) * 0.18,
    2.2
  );
}

function makeTropicalTurfRaw(size = 128) {
  return buildPbrMapsFromHeight(
    size,
    (u, v) => {
      const blade = fbmTileable(u, v, 16, 4, 53);
      const patch = fbmTileable(u, v, 4, 2, 79);
      return blade * 0.72 + patch * 0.28;
    },
    (u, v, h) => {
      const patch = fbmTileable(u, v, 4, 2, 83);
      const r = 64 + patch * 24 + h * 18;
      const g = 98 + patch * 28 + h * 26;
      const b = 52 + patch * 12 + h * 10;
      return [r, g, b];
    },
    () => 0.9,
    1.6
  );
}

function makeAsphaltRoadRaw(size = 128) {
  return buildPbrMapsFromHeight(
    size,
    (u, v) => fbmTileable(u, v, 24, 3, 101),
    (u, v, h) => {
      const speck = hash2D(Math.floor(u * size), Math.floor(v * size), 107) * 16;
      const base = 52 + h * 22 + speck * 0.45;
      return [base, base + 2, base + 5];
    },
    (_u, _v, h) => 0.74 + (1 - h) * 0.14,
    1.9
  );
}

function makeSoilExcavationRaw(size = 128) {
  return buildPbrMapsFromHeight(
    size,
    (u, v) => fbmTileable(u, v, 12, 4, 131),
    (_u, _v, h) => [92 + h * 36, 78 + h * 30, 62 + h * 24],
    () => 0.94,
    2.4
  );
}

export function synthesizeFloorTextureRawBankPart(part = 'floor_a') {
  if (part === 'floor_a') {
    return {
      andesite_paving: makeAndesitePavingRaw(128),
      tropical_turf: makeTropicalTurfRaw(128),
    };
  }
  return {
    asphalt_road: makeAsphaltRoadRaw(128),
    soil_excavation: makeSoilExcavationRaw(128),
  };
}

export function synthesizeFloorTextureRawBank() {
  return {
    ...synthesizeFloorTextureRawBankPart('floor_a'),
    ...synthesizeFloorTextureRawBankPart('floor_b'),
  };
}

function rawToDataTexture(THREE, bytes, size, isSrgb, repeat = 1) {
  const tex = new THREE.DataTexture(bytes, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = isSrgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export function hydrateFloorTextureBank(THREE, rawBank) {
  const src = rawBank || synthesizeFloorTextureRawBank();
  const bank = {};
  const entries = Object.entries(src);
  for (let i = 0; i < entries.length; i++) {
    const [key, item] = entries[i];
    if (!item || !item.albedo) continue;
    const size = item.size || 128;
    const repeat = key === 'tropical_turf' ? 18 : key === 'asphalt_road' ? 10 : 12;
    bank[key] = {
      map: rawToDataTexture(THREE, item.albedo, size, true, repeat),
      normalMap: rawToDataTexture(THREE, item.normal, size, false, repeat),
      roughnessMap: rawToDataTexture(THREE, item.roughness, size, false, repeat),
    };
  }
  return bank;
}

export function upgradeWorldFloorAndSurfaceMaterials(THREE, scene, precomputedRawBank = null) {
  const bank = hydrateFloorTextureBank(THREE, precomputedRawBank);
  let upgradedCount = 0;

  scene.traverse((obj) => {
    if (!obj || !obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (let i = 0; i < mats.length; i++) {
      const mat = mats[i];
      if (!mat || !mat.isMeshStandardMaterial) continue;
      const key = mat.userData?.floorTextureKey;
      if (!key || !bank[key]) continue;
      const trio = bank[key];
      mat.map = trio.map;
      mat.normalMap = trio.normalMap;
      mat.roughnessMap = trio.roughnessMap;
      mat.normalScale = new THREE.Vector2(0.75, 0.75);
      mat.needsUpdate = true;
      upgradedCount++;
    }
  });

  return { bank, upgradedCount };
}
