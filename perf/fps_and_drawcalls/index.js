/**
 * Unified Runtime FPS & Draw-Call Optimizer (`perf/fps_and_drawcalls/index.js`)
 */

import { optimizeTowerMeshesAndZones, optimizeWorldMeshes } from './mesh_batch_optimizer.js';
import {
  makeHeavyMaterialUserDataNonEnumerable,
  optimizeKinematicsEngine,
  prewarmSceneShaders,
} from './kinematics_and_shader_optimizer.js';
import {
  cullDeepSubterraneanShadowCasters,
  installShadowAndMatrixOptimizations,
} from './shadow_and_matrix_optimizer.js';

export function installRuntimeFpsAndDrawCallOptimizations({
  THREE,
  app = null,
  scene,
  camera = null,
  renderer,
  towerController,
  medanMerdekaWorld = null,
  prewarmMode = 'idle',
} = {}) {
  if (!THREE || !scene || !renderer || !towerController) {
    throw new Error('installRuntimeFpsAndDrawCallOptimizations requires core scene systems');
  }
  if (scene.__monasPerfState) return scene.__monasPerfState;

  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;

  const userDataSanitizeStats = makeHeavyMaterialUserDataNonEnumerable({ scene });
  const deepCaissonShadowStats = cullDeepSubterraneanShadowCasters({
    THREE,
    towerController,
    maxWorldY: -3.4,
  });
  const worldBatchStats = optimizeWorldMeshes({
    THREE,
    medanMerdekaWorld,
    shadowRadiusLimitM: 195.0,
  });
  const towerBatchStats = optimizeTowerMeshesAndZones({ THREE, towerController });
  const kinematicsOptStats = optimizeKinematicsEngine();

  let prewarmStats = null;
  let idleScheduled = false;
  const ensureShadersPrewarmed = () => {
    if (prewarmStats) return prewarmStats;
    prewarmStats = prewarmSceneShaders({ renderer, scene, camera });
    return prewarmStats;
  };

  const shadowAndMatrix = installShadowAndMatrixOptimizations({
    renderer,
    scene,
    medanMerdekaWorld,
    onFirstMainRender: () => {
      if (prewarmMode === 'idle' && !idleScheduled && typeof setTimeout === 'function') {
        idleScheduled = true;
        setTimeout(() => {
          try {
            ensureShadersPrewarmed();
          } catch {
            // ignore
          }
        }, 25);
      }
    },
  });

  if (prewarmMode === 'immediate') {
    ensureShadersPrewarmed();
  }

  const installElapsedMs = Number(
    ((typeof performance !== 'undefined' ? performance.now() : 0) - t0).toFixed(2)
  );

  const state = {
    installElapsedMs,
    userDataSanitizeStats,
    deepCaissonShadowStats,
    worldBatchStats,
    towerBatchStats,
    kinematicsOptStats,
    matrixStats: shadowAndMatrix.matrixStats,
    ensureShadersPrewarmed,
    getTelemetry: () => ({
      installElapsedMs,
      ...towerController.getMetrics(),
      worldMetrics: medanMerdekaWorld?.getMetrics?.() || null,
      webglProgramsCount: renderer.info?.programs?.length ?? 0,
      renderCalls: renderer.info?.render?.calls ?? 0,
      renderTriangles: renderer.info?.render?.triangles ?? 0,
    }),
  };

  if (app) {
    app.prewarmShadersNow = ensureShadersPrewarmed;
    app.getStage4FpsTelemetry = state.getTelemetry;
  }

  scene.__monasPerfState = state;
  return state;
}
