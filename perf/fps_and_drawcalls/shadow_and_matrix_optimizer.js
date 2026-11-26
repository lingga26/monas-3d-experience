/**
 * Shadow Culling & Static Matrix Freezing for Monas (`perf/fps_and_drawcalls/shadow_and_matrix_optimizer.js`)
 */

export function cullDeepSubterraneanShadowCasters({ THREE, towerController, maxWorldY = -3.4 } = {}) {
  const root = towerController?.root;
  if (!THREE || !root) return { culledCount: 0 };

  const prevStep = towerController.getStep();
  towerController.setStep(9.0);
  root.updateMatrixWorld(true);

  const worldBox = new THREE.Box3();
  let culledCount = 0;
  root.traverse((obj) => {
    if (!obj.isMesh || obj.isInstancedMesh || !obj.castShadow || !obj.geometry) return;
    if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
    if (!obj.geometry.boundingBox || obj.geometry.boundingBox.isEmpty()) return;
    worldBox.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
    if (worldBox.max.y <= maxWorldY) {
      obj.castShadow = false;
      culledCount++;
    }
  });

  if (Math.abs(prevStep - 9.0) > 1e-6) {
    towerController.setStep(prevStep);
  }
  return { culledCount };
}

export function freezeStaticSceneMatrices({ medanMerdekaWorld } = {}) {
  const worldRoot = medanMerdekaWorld?.root;
  if (!worldRoot) return { frozenNodes: 0 };

  worldRoot.updateMatrixWorld(true);
  let frozenNodes = 0;
  worldRoot.traverse((obj) => {
    obj.matrixAutoUpdate = false;
    frozenNodes++;
  });
  return { frozenNodes };
}

export function installShadowAndMatrixOptimizations({
  renderer,
  scene,
  medanMerdekaWorld,
  onFirstMainRender,
} = {}) {
  const matrixStats = freezeStaticSceneMatrices({ medanMerdekaWorld });

  let firstRendered = false;
  if (scene) {
    const prevBefore = scene.onBeforeRender;
    scene.onBeforeRender = function monasPerfBeforeRender(...args) {
      if (!firstRendered) {
        firstRendered = true;
        onFirstMainRender?.();
      }
      if (typeof prevBefore === 'function') prevBefore.apply(this, args);
    };
  }

  return {
    matrixStats,
    shadowPolicy: {
      forceShadowRefresh: () => {
        if (renderer?.shadowMap) renderer.shadowMap.needsUpdate = true;
      },
      getTelemetry: () => ({
        frozenWorldNodes: matrixStats.frozenNodes,
      }),
    },
  };
}
