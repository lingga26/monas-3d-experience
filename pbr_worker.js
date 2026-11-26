/**
 * Monas 3D Experience — Background PBR Texture Synthesis Web Worker (`pbr_worker.js`)
 *
 * Synthesizes procedural marble, poured concrete, bronze, gold leaf, tropical turf,
 * and Medan Merdeka plaza textures off the main thread.
 */

import {
  synthesizeFloorTextureRawBank,
  synthesizeFloorTextureRawBankPart,
} from './model/floor_textures.js';
import { synthesizeTowerPbrRawBank } from './model/materials.js';
import { synthesizeJakartaWorldRawMaps } from './world/jakarta_materials.js';

function collectTransferableBuffers(node, seen, out) {
  if (!node || typeof node !== 'object') return;
  if (ArrayBuffer.isView(node)) {
    const buf = node.buffer;
    if (buf instanceof ArrayBuffer && !seen.has(buf)) {
      seen.add(buf);
      out.push(buf);
    }
    return;
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      collectTransferableBuffers(node[i], seen, out);
    }
    return;
  }
  const values = Object.values(node);
  for (let i = 0; i < values.length; i++) {
    collectTransferableBuffers(values[i], seen, out);
  }
}

self.onmessage = (event) => {
  const data = event?.data || {};
  const id = data.id ?? 0;
  const task = data.task || 'all';
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  try {
    let result = null;
    if (task === 'floor_a' || task === 'floor_b') {
      result = { floorPart: synthesizeFloorTextureRawBankPart(task) };
    } else if (task === 'floor') {
      result = { floor: synthesizeFloorTextureRawBank() };
    } else if (task === 'tower_and_world') {
      result = {
        tower: synthesizeTowerPbrRawBank(),
        world: synthesizeJakartaWorldRawMaps(),
      };
    } else {
      const floor = synthesizeFloorTextureRawBank();
      self.postMessage({ id, type: 'progress', task, stage: 'floor' });
      const tower = synthesizeTowerPbrRawBank();
      self.postMessage({ id, type: 'progress', task, stage: 'tower' });
      const world = synthesizeJakartaWorldRawMaps();
      self.postMessage({ id, type: 'progress', task, stage: 'world' });
      result = { floor, tower, world };
    }

    const durationMs = Number(
      ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0).toFixed(2)
    );
    const seen = new Set();
    const transferList = [];
    collectTransferableBuffers(result, seen, transferList);

    self.postMessage({ id, ok: true, task, durationMs, result }, transferList);
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      task,
      error: String(err?.stack || err?.message || err),
    });
  }
};
