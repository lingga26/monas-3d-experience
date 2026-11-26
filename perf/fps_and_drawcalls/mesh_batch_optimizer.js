/**
 * Monas 3D Static Mesh Telemetry & Subterranean Culling Helper (`perf/fps_and_drawcalls/mesh_batch_optimizer.js`)
 */

export function optimizeTowerMeshesAndZones({ THREE, towerController } = {}) {
  const root = towerController?.root;
  if (!THREE || !root) {
    return {
      intraPieceMeshesRemoved: 0,
      disposedLeafGeometries: 0,
      settledBatchesCount: 0,
      settledBatchesSummary: 'monas-native',
    };
  }
  let meshCount = 0;
  root.traverse((obj) => {
    if (obj.isMesh) meshCount++;
  });
  return {
    intraPieceMeshesRemoved: 0,
    disposedLeafGeometries: 0,
    settledBatchesCount: meshCount,
    settledBatchesSummary: `monas-zones(${meshCount} drawables)`,
  };
}

export function optimizeWorldMeshes({ THREE, medanMerdekaWorld, shadowRadiusLimitM = 195.0 } = {}) {
  const worldRoot = medanMerdekaWorld?.root;
  if (!THREE || !worldRoot) return { culledShadowCasters: 0 };

  let culled = 0;
  const worldPos = new THREE.Vector3();
  worldRoot.traverse((obj) => {
    if (!obj.isMesh || !obj.castShadow) return;
    obj.getWorldPosition(worldPos);
    if (Math.hypot(worldPos.x, worldPos.z) > shadowRadiusLimitM) {
      obj.castShadow = false;
      culled++;
    }
  });
  return { culledShadowCasters: culled };
}
