/**
 * Monas 3D Experience — Non-Blocking PBR Texture Orchestrator (`startup_orchestrator.js`)
 *
 * Synthesizes procedural PBR textures in a background Web Worker with a strict timeout
 * and non-blocking main-thread fallback so the 3D scene always renders immediately.
 */

import { synthesizeFloorTextureRawBank } from './model/floor_textures.js';
import { synthesizeTowerPbrRawBank } from './model/materials.js';
import { synthesizeJakartaWorldRawMaps } from './world/jakarta_materials.js';

const GLOBAL_PROMISE_KEY = '__MONAS_STAGE4_STARTUP__';

function runWorkerTask(taskName, timeoutMs = 1800, onStageProgress = null) {
  return new Promise((resolve, reject) => {
    if (typeof Worker === 'undefined') {
      reject(new Error('Web Workers unavailable'));
      return;
    }
    let worker;
    try {
      worker = new Worker(new URL('./pbr_worker.js', import.meta.url), {
        type: 'module',
        name: `monas-pbr-${taskName}`,
      });
    } catch (err) {
      reject(err);
      return;
    }

    const reqId = `${taskName}-${Math.random().toString(36).slice(2, 8)}`;
    let settled = false;
    let timer = null;

    const cleanup = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      try {
        worker.terminate();
      } catch {
        // ignore
      }
    };

    timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`Worker ${taskName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    worker.onmessage = (event) => {
      const msg = event?.data;
      if (!msg || msg.id !== reqId || settled) return;
      if (msg.type === 'progress') {
        if (typeof onStageProgress === 'function' && msg.stage) {
          onStageProgress(msg.stage);
        }
        return;
      }
      settled = true;
      cleanup();
      if (msg.ok) {
        resolve({ result: msg.result, durationMs: msg.durationMs || 0 });
      } else {
        reject(new Error(msg.error || `Worker ${taskName} failed`));
      }
    };
    worker.onerror = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(err?.message || `Worker ${taskName} error`));
    };

    try {
      worker.postMessage({ id: reqId, task: taskName });
    } catch (err) {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    }
  });
}

function scheduleBackgroundFallback(err, onStageProgress = null) {
  return new Promise((resolve) => {
    const run = () => {
      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const floor = synthesizeFloorTextureRawBank();
      if (typeof onStageProgress === 'function') onStageProgress('floor');
      setTimeout(() => {
        const tower = synthesizeTowerPbrRawBank();
        if (typeof onStageProgress === 'function') onStageProgress('tower');
        setTimeout(() => {
          const world = synthesizeJakartaWorldRawMaps();
          if (typeof onStageProgress === 'function') onStageProgress('world');
          const elapsedMs = Number(
            ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0).toFixed(2)
          );
          resolve({
            source: 'main-thread-fallback',
            fallbackReason: String(err?.message || err),
            workerDurationMs: elapsedMs,
            floor,
            tower,
            world,
          });
        }, 0);
      }, 0);
    };
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => run(), { timeout: 600 });
    } else {
      setTimeout(run, 30);
    }
  });
}

function startBackgroundPbrWorker(onStageProgress = null) {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return runWorkerTask('all', 2200, onStageProgress)
    .then((res) => {
      const elapsedMs = Number(
        ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0).toFixed(2)
      );
      return {
        source: 'web-worker-1x',
        workerDurationMs: elapsedMs,
        floor: res.result?.floor || null,
        tower: res.result?.tower || null,
        world: res.result?.world || null,
      };
    })
    .catch((err) => scheduleBackgroundFallback(err, onStageProgress));
}

export function getStartupOrchestrator() {
  if (typeof window !== 'undefined' && window[GLOBAL_PROMISE_KEY]) {
    return window[GLOBAL_PROMISE_KEY];
  }

  const stageListeners = new Set();
  const completedStages = [];
  const emitStage = (stage) => {
    if (!stage || completedStages.includes(stage)) return;
    completedStages.push(stage);
    for (const listener of stageListeners) {
      try {
        listener(stage);
      } catch {
        // ignore listener errors
      }
    }
  };

  const catalogsPromise = Promise.resolve({});
  // Delay worker spawn slightly so main app & first frame render get full network/CPU priority
  const pbrRawPromise = new Promise((resolve) => {
    const kickOff = () => startBackgroundPbrWorker(emitStage).then(resolve);
    if (typeof setTimeout === 'function') {
      setTimeout(kickOff, 10);
    } else {
      kickOff();
    }
  });
  const stop01ImagePromise = Promise.resolve(null);
  const stop02ImagePromise = Promise.resolve(null);

  const handle = {
    catalogsPromise,
    pbrRawPromise,
    stop01ImagePromise,
    stop02ImagePromise,
    subscribePbrStage(listener) {
      if (typeof listener !== 'function') return () => {};
      for (let i = 0; i < completedStages.length; i++) {
        listener(completedStages[i]);
      }
      stageListeners.add(listener);
      return () => stageListeners.delete(listener);
    },
    allReadyPromise: Promise.all([catalogsPromise, pbrRawPromise]).then(
      ([catalogs, pbrRaw]) => ({
        catalogs,
        pbrRaw,
        stop01Image: null,
        stop02Image: null,
      })
    ),
  };

  if (typeof window !== 'undefined') {
    window[GLOBAL_PROMISE_KEY] = handle;
  }
  return handle;
}

getStartupOrchestrator();
