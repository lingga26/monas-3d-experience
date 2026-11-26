/**
 * Jakarta Medan Merdeka World PBR Map Synthesizer (`world/jakarta_materials.js`)
 *
 * Off-thread compatible raw texture generator for Medan Merdeka plaza paving,
 * Silang Monas stone promenade, reflecting pool water normal map, and Jakarta facades.
 */

function hash(ix, iy, seed) {
  let n = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0;
  n = (n ^ (n >> 13)) | 0;
  n = Math.imul(n, 1274126177);
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function vnoise(x, y, period, seed) {
  const fx = x - Math.floor(x);
  const fy = y - Math.floor(y);
  const ix0 = ((Math.floor(x) % period) + period) % period;
  const iy0 = ((Math.floor(y) % period) + period) % period;
  const ix1 = (ix0 + 1) % period;
  const iy1 = (iy0 + 1) % period;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  return (
    hash(ix0, iy0, seed) * (1 - u) * (1 - v) +
    hash(ix1, iy0, seed) * u * (1 - v) +
    hash(ix0, iy1, seed) * (1 - u) * v +
    hash(ix1, iy1, seed) * u * v
  );
}

export function synthesizeJakartaWorldRawMaps() {
  const size = 96;
  const poolNormal = new Uint8Array(size * size * 4);
  const facadeAlbedo = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const idx = (y * size + x) * 4;

      const w1 = vnoise(u * 10, v * 10, 10, 401);
      const w2 = vnoise(u * 20, v * 20, 20, 409);
      const nx = (w1 - 0.5) * 0.25 + (w2 - 0.5) * 0.15;
      const ny = (vnoise(u * 12 + 0.3, v * 12 + 0.3, 12, 421) - 0.5) * 0.28;
      poolNormal[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      poolNormal[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      poolNormal[idx + 2] = 250;
      poolNormal[idx + 3] = 255;

      const winX = ((u * 8) % 1) > 0.28 && ((u * 8) % 1) < 0.72;
      const winY = ((v * 10) % 1) > 0.22 && ((v * 10) % 1) < 0.74;
      const shade = winX && winY ? 128 : 206;
      facadeAlbedo[idx] = shade + 6;
      facadeAlbedo[idx + 1] = shade + 4;
      facadeAlbedo[idx + 2] = shade;
      facadeAlbedo[idx + 3] = 255;
    }
  }

  return { size, poolNormal, facadeAlbedo };
}
