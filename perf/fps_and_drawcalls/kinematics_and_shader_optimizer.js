/**
 * Monas Kinematics & Material Metadata Optimizer (`perf/fps_and_drawcalls/kinematics_and_shader_optimizer.js`)
 */

export function makeHeavyMaterialUserDataNonEnumerable({ scene } = {}) {
  if (!scene) return { updated: 0 };
  let updated = 0;
  scene.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (let i = 0; i < mats.length; i++) {
      const ud = mats[i]?.userData;
      if (ud && Object.prototype.propertyIsEnumerable.call(ud, 'pbrTrio')) {
        Object.defineProperty(ud, 'pbrTrio', {
          value: ud.pbrTrio,
          enumerable: false,
          writable: true,
          configurable: true,
        });
        updated++;
      }
    }
  });
  return { updated };
}

export function optimizeKinematicsEngine() {
  return { optimized: true };
}

export function prewarmSceneShaders({ renderer, scene, camera } = {}) {
  if (!renderer || !scene || !camera || typeof renderer.compile !== 'function') {
    return { prewarmed: false };
  }
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  try {
    renderer.compile(scene, camera);
    const ms = (typeof performance !== 'undefined' ? performance.now() : 0) - t0;
    return { prewarmed: true, compileMs: Number(ms.toFixed(2)) };
  } catch {
    return { prewarmed: false };
  }
}
