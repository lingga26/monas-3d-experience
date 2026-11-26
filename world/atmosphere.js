/**
 * Jakarta Tropical Atmosphere & Lighting Controller (`world/atmosphere.js`)
 *
 * Manages 3 lighting moods across 132 m Monas:
 *   - `day` (Pagi): Crisp tropical Jakarta azure sky + high morning sun
 *   - `dusk` (Senja): Warm golden-amber Jakarta sunset + sky-blue zenith
 *   - `night` (Malam): Deep #0B1426 Jakarta night sky + architectural Cawan/marble uplights
 *     + dedicated SpotLight/PointLight rig illuminating the 14 m gold Lidah Api
 */

import { EXHIBITION_FOG_PRESETS, applyWorldSketchDistanceFog } from './distance_fog.js';

export const ARCHIVAL_LIGHTING_PRESETS = {
  day: {
    zenithColor: 0x5c90c9,
    horizonColor: 0xd9e5f0,
    sunColor: 0xfff5e4,
    sunIntensity: 2.35,
    sunPos: [145, 195, 125],
    hemiSky: 0x9ec4eb,
    hemiGround: 0x4b5c3e,
    hemiIntensity: 0.95,
    ambientColor: 0xd9e4f0,
    ambientIntensity: 0.28,
    exposure: 1.05,
    nightFactor: 0.0,
    uplightIntensity: 0.0,
    flameLightIntensity: 0.0,
  },
  dusk: {
    zenithColor: 0x223354,
    horizonColor: 0xd98752,
    sunColor: 0xff9e5e,
    sunIntensity: 1.9,
    sunPos: [-185, 58, 130],
    hemiSky: 0x6f7ea8,
    hemiGround: 0x3b2f2c,
    hemiIntensity: 0.72,
    ambientColor: 0x54464e,
    ambientIntensity: 0.3,
    exposure: 1.08,
    nightFactor: 0.45,
    uplightIntensity: 35.0,
    flameLightIntensity: 140.0,
  },
  night: {
    zenithColor: 0x081020,
    horizonColor: 0x162844,
    sunColor: 0x7da2d4,
    sunIntensity: 0.62,
    sunPos: [-120, 150, 140],
    hemiSky: 0x203558,
    hemiGround: 0x121926,
    hemiIntensity: 0.48,
    ambientColor: 0x182640,
    ambientIntensity: 0.34,
    exposure: 1.15,
    nightFactor: 1.0,
    uplightIntensity: 95.0,
    flameLightIntensity: 320.0,
  },
};

function buildSkyDome(THREE, zenithHex, horizonHex) {
  const geo = new THREE.SphereGeometry(950, 32, 18);
  const uniforms = {
    uZenith: { value: new THREE.Color(zenithHex) },
    uHorizon: { value: new THREE.Color(horizonHex) },
  };
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms,
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      varying vec3 vWorldDir;
      void main() {
        float h = clamp(vWorldDir.y, 0.0, 1.0);
        float curve = pow(h, 0.55);
        vec3 col = mix(uHorizon, uZenith, curve);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'jakarta_sky_dome';
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

export function createAtmosphereController({ THREE, scene, renderer, initialMood = 'day' }) {
  const safeMood = ARCHIVAL_LIGHTING_PRESETS[initialMood] ? initialMood : 'day';
  let currentMood = safeMood;
  const preset = ARCHIVAL_LIGHTING_PRESETS[safeMood];

  scene.background = new THREE.Color(EXHIBITION_FOG_PRESETS[safeMood].color);
  applyWorldSketchDistanceFog(THREE, scene, safeMood);

  // Sky Dome
  const sky = buildSkyDome(THREE, preset.zenithColor, preset.horizonColor);
  scene.add(sky.mesh);

  // Key Directional Light (Sun / Moon) with tight shadow frustum for 132 m Monas
  const sunLight = new THREE.DirectionalLight(preset.sunColor, preset.sunIntensity);
  sunLight.position.set(...preset.sunPos);
  sunLight.target.position.set(0, 56, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 35;
  sunLight.shadow.camera.far = 460;
  sunLight.shadow.camera.left = -74;
  sunLight.shadow.camera.right = 74;
  sunLight.shadow.camera.top = 158;
  sunLight.shadow.camera.bottom = -22;
  sunLight.shadow.bias = -0.00045;
  sunLight.shadow.normalBias = 0.04;
  scene.add(sunLight);
  scene.add(sunLight.target);

  // Ambient + Hemisphere Tropical Fill
  const hemiLight = new THREE.HemisphereLight(
    preset.hemiSky,
    preset.hemiGround,
    preset.hemiIntensity
  );
  hemiLight.position.set(0, 140, 0);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(preset.ambientColor, preset.ambientIntensity);
  scene.add(ambientLight);

  // Architectural Night Floodlights (4 Cawan corners aimed up the cream marble shaft)
  const uplights = [];
  const cornerCoords = [
    [26, 2, 26],
    [-26, 2, 26],
    [26, 2, -26],
    [-26, 2, -26],
  ];
  for (let i = 0; i < cornerCoords.length; i++) {
    const spot = new THREE.SpotLight(0xffe0a6, preset.uplightIntensity, 165, Math.PI * 0.24, 0.58, 1.4);
    spot.position.set(...cornerCoords[i]);
    spot.target.position.set(0, 74, 0);
    spot.castShadow = false;
    scene.add(spot);
    scene.add(spot.target);
    uplights.push(spot);
  }

  // Dedicated Lidah Api Illumination Rig (two angled warm spots + local golden point light)
  const flameSpotA = new THREE.SpotLight(0xffcf5e, preset.flameLightIntensity, 46, Math.PI * 0.35, 0.5, 1.1);
  flameSpotA.position.set(8, 117, 8);
  flameSpotA.target.position.set(0, 126, 0);
  scene.add(flameSpotA);
  scene.add(flameSpotA.target);

  const flameSpotB = new THREE.SpotLight(0xffd773, preset.flameLightIntensity, 46, Math.PI * 0.35, 0.5, 1.1);
  flameSpotB.position.set(-8, 117, -8);
  flameSpotB.target.position.set(0, 126, 0);
  scene.add(flameSpotB);
  scene.add(flameSpotB.target);

  const flameGlowPoint = new THREE.PointLight(0xffd25a, preset.nightFactor * 85.0, 58, 1.3);
  flameGlowPoint.position.set(0, 125.5, 0);
  scene.add(flameGlowPoint);

  // Procedural studio sky environment map via PMREM for crisp gold & marble reflections
  let envRT = null;
  if (renderer && typeof THREE.PMREMGenerator === 'function') {
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envScene = new THREE.Scene();
      const envGeo = new THREE.SphereGeometry(20, 16, 12);
      const envMat = new THREE.MeshBasicMaterial({ color: preset.horizonColor, side: THREE.BackSide });
      envScene.add(new THREE.Mesh(envGeo, envMat));
      const warmPanel = new THREE.Mesh(
        new THREE.BoxGeometry(10, 10, 1),
        new THREE.MeshBasicMaterial({ color: 0xfff0cc })
      );
      warmPanel.position.set(10, 12, 10);
      warmPanel.lookAt(0, 0, 0);
      envScene.add(warmPanel);
      envRT = pmrem.fromScene(envScene, 0.04);
      scene.environment = envRT.texture;
      envGeo.dispose();
      envMat.dispose();
      warmPanel.geometry.dispose();
      warmPanel.material.dispose();
      pmrem.dispose();
    } catch {
      // ignore on fallback contexts
    }
  }

  // Color scratch objects
  const cZenith = new THREE.Color();
  const cHorizon = new THREE.Color();
  const cFog = new THREE.Color();

  const applyPreset = (moodKey) => {
    const key = ARCHIVAL_LIGHTING_PRESETS[moodKey] ? moodKey : 'day';
    currentMood = key;
    const p = ARCHIVAL_LIGHTING_PRESETS[key];
    const fogCfg = EXHIBITION_FOG_PRESETS[key] || EXHIBITION_FOG_PRESETS.day;

    cZenith.setHex(p.zenithColor);
    cHorizon.setHex(p.horizonColor);
    cFog.setHex(fogCfg.color);

    sky.uniforms.uZenith.value.copy(cZenith);
    sky.uniforms.uHorizon.value.copy(cHorizon);
    if (scene.background?.isColor) scene.background.copy(cFog);
    applyWorldSketchDistanceFog(THREE, scene, key);

    sunLight.color.setHex(p.sunColor);
    sunLight.intensity = p.sunIntensity;
    sunLight.position.set(...p.sunPos);

    hemiLight.color.setHex(p.hemiSky);
    hemiLight.groundColor.setHex(p.hemiGround);
    hemiLight.intensity = p.hemiIntensity;

    ambientLight.color.setHex(p.ambientColor);
    ambientLight.intensity = p.ambientIntensity;

    if (renderer) {
      renderer.toneMappingExposure = p.exposure;
    }

    for (let i = 0; i < uplights.length; i++) {
      uplights[i].intensity = p.uplightIntensity;
    }
    flameSpotA.intensity = p.flameLightIntensity;
    flameSpotB.intensity = p.flameLightIntensity;
    flameGlowPoint.intensity = p.nightFactor * 85.0;

    return p.nightFactor;
  };

  applyPreset(safeMood);

  return {
    sunLight,
    hemiLight,
    ambientLight,
    getMood: () => currentMood,
    setMood: applyPreset,
    getNightFactor: () => ARCHIVAL_LIGHTING_PRESETS[currentMood].nightFactor,
    auditZeroEmissive: () => {
      const offenders = [];
      scene.traverse((obj) => {
        if (!obj.isMesh || !obj.material) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (let i = 0; i < mats.length; i++) {
          const m = mats[i];
          if (m?.emissive && m.emissive.getHex() !== 0x000000 && m.emissiveIntensity > 0.01) {
            offenders.push(obj.name || m.name || 'unnamed');
          }
        }
      });
      return { passed: offenders.length === 0, offenders };
    },
    dispose() {
      if (envRT) envRT.dispose();
    },
  };
}
