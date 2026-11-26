/**
 * Monas 3D Experience — Three.js LoadingManager Progress Tracker (`model/asset_loading_manager.js`)
 *
 * Uses `THREE.LoadingManager` (`onStart`, `onProgress`, `onLoad`, `onError`) and
 * `THREE.TextureLoader(manager)` to track real-time loading & assembly of 3D models,
 * architectural zones, atmospheric environment maps, and PBR textures, updating
 * the `#boot-veil` progress bar and percentage readout.
 */

const ASSET_LABELS = {
  id: {
    'textures/atmosphere_sky_pmrem': 'Memuat atmosfer langit Jakarta & peta lingkungan…',
    'models/medan_merdeka_world': 'Membangun lanskap Lapangan Medan Merdeka…',
    'models/monas_zone1_foundations': 'Membangun Zona 1: Pondasi & Museum Bawah Tanah…',
    'models/monas_zone2_cawan': 'Membangun Zona 2: Pelataran Cawan 17 m…',
    'models/monas_zone3_shaft_puncak': 'Membangun Zona 3: Batang Tugu & Puncak 115 m…',
    'models/monas_zone4_lidah_api': 'Membangun Zona 4: Lidah Api Emas 132 m…',
    'models/monas_zone5_cranes': 'Membangun Zona 5: Derek & Perancah Konstruksi…',
    'textures/floor_pbr_maps': 'Memuat tekstur PBR pelataran & rumput Medan Merdeka…',
    'textures/tower_pbr_maps': 'Memuat tekstur PBR marmer, perunggu & emas Monas…',
    'textures/jakarta_world_pbr_maps': 'Memuat tekstur PBR kolam pantul & cakrawala Jakarta…',
  },
  en: {
    'textures/atmosphere_sky_pmrem': 'Loading Jakarta sky atmosphere & environment map…',
    'models/medan_merdeka_world': 'Building Medan Merdeka plaza & park model…',
    'models/monas_zone1_foundations': 'Building Zone 1: Foundations & Subterranean Museum…',
    'models/monas_zone2_cawan': 'Building Zone 2: 17 m Cawan Chalice Terrace…',
    'models/monas_zone3_shaft_puncak': 'Building Zone 3: Obelisk Shaft & 115 m Puncak…',
    'models/monas_zone4_lidah_api': 'Building Zone 4: 132 m Gilded Lidah Api Flame…',
    'models/monas_zone5_cranes': 'Building Zone 5: Construction Cranes & Falsework…',
    'textures/floor_pbr_maps': 'Loading Medan Merdeka paving & turf PBR textures…',
    'textures/tower_pbr_maps': 'Loading Monas marble, bronze & gold PBR textures…',
    'textures/jakarta_world_pbr_maps': 'Loading reflecting pool & Jakarta skyline textures…',
  },
};

export const MONAS_ASSET_MANIFEST = [
  'textures/atmosphere_sky_pmrem',
  'models/medan_merdeka_world',
  'models/monas_zone1_foundations',
  'models/monas_zone2_cawan',
  'models/monas_zone3_shaft_puncak',
  'models/monas_zone4_lidah_api',
  'models/monas_zone5_cranes',
  'textures/floor_pbr_maps',
  'textures/tower_pbr_maps',
  'textures/jakarta_world_pbr_maps',
];

export function yieldForDomPaint() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export function createMonasLoadingManager({ THREE, lang = 'id', bootVeil = null } = {}) {
  const safeLang = lang === 'en' ? 'en' : 'id';
  const labels = ASSET_LABELS[safeLang];

  if (THREE?.Cache) {
    THREE.Cache.enabled = true;
  }

  const veilEl = bootVeil || (typeof document !== 'undefined' ? document.getElementById('boot-veil') : null);
  const trackEl = veilEl?.querySelector?.('#boot-progress-track') || null;
  const barEl = veilEl?.querySelector?.('#boot-progress-bar') || null;
  const pctEl = veilEl?.querySelector?.('#boot-progress-pct') || null;
  const labelEl = veilEl?.querySelector?.('#boot-progress-label') || null;

  let loadedCount = 0;
  let totalCount = 0;
  let currentUrl = '';
  let isLoaded = false;
  const completedSet = new Set();
  const pendingSet = new Set();
  const errorUrls = [];

  let resolveAllLoaded;
  const allLoadedPromise = new Promise((resolve) => {
    resolveAllLoaded = resolve;
  });

  const updateDomProgress = (url, loaded, total, { complete = false } = {}) => {
    const safeTotal = Math.max(1, total || 0);
    const pct = complete
      ? 100
      : Math.max(0, Math.min(100, Math.round((Math.min(loaded, safeTotal) / safeTotal) * 100)));

    if (barEl) {
      barEl.style.width = `${pct}%`;
    }
    if (pctEl) {
      pctEl.textContent = `${pct}%`;
    }
    if (trackEl) {
      trackEl.setAttribute('aria-valuenow', String(pct));
      trackEl.setAttribute('aria-valuetext', `${pct}%`);
    }
    if (labelEl) {
      if (complete) {
        labelEl.textContent =
          safeLang === 'en' ? 'Exhibition ready' : 'Pameran siap ditampilkan';
      } else if (url && labels[url]) {
        labelEl.textContent = labels[url];
      }
    }
  };

  const manager = new THREE.LoadingManager();

  manager.onStart = (url, itemsLoaded, itemsTotal) => {
    currentUrl = url || '';
    loadedCount = itemsLoaded || 0;
    totalCount = itemsTotal || 0;
    updateDomProgress(url, loadedCount, totalCount);
  };

  manager.onProgress = (url, itemsLoaded, itemsTotal) => {
    currentUrl = url || '';
    loadedCount = itemsLoaded || 0;
    totalCount = itemsTotal || 0;
    updateDomProgress(url, loadedCount, totalCount);
  };

  manager.onLoad = () => {
    isLoaded = true;
    loadedCount = totalCount;
    updateDomProgress(currentUrl, totalCount, totalCount, { complete: true });
    resolveAllLoaded?.({
      loaded: loadedCount,
      total: totalCount,
      percent: 100,
      errors: errorUrls.slice(),
    });
  };

  manager.onError = (url) => {
    if (url) errorUrls.push(url);
    if (labelEl) {
      labelEl.textContent =
        safeLang === 'en'
          ? `Warning: fallback applied for ${url || 'asset'}`
          : `Peringatan: mode cadangan digunakan untuk ${url || 'aset'}`;
    }
  };

  const textureLoader = new THREE.TextureLoader(manager);

  const registerManifest = (assetIds = MONAS_ASSET_MANIFEST) => {
    for (let i = 0; i < assetIds.length; i++) {
      const id = assetIds[i];
      if (!pendingSet.has(id) && !completedSet.has(id)) {
        pendingSet.add(id);
        manager.itemStart(id);
      }
    }
    // Display the label of the first queued asset immediately at 0%
    if (assetIds.length > 0 && labelEl && labels[assetIds[0]]) {
      labelEl.textContent = labels[assetIds[0]];
    }
  };

  const markAssetStartLabel = (assetId) => {
    if (labelEl && assetId && labels[assetId]) {
      labelEl.textContent = labels[assetId];
    }
  };

  const completeAsset = (assetId) => {
    if (!assetId || completedSet.has(assetId)) return;
    if (!pendingSet.has(assetId)) {
      pendingSet.add(assetId);
      manager.itemStart(assetId);
    }
    pendingSet.delete(assetId);
    completedSet.add(assetId);
    manager.itemEnd(assetId);

    // Advance the status label to the next pending item if any remains
    const nextPending = pendingSet.values().next().value;
    if (nextPending && labelEl && labels[nextPending]) {
      labelEl.textContent = labels[nextPending];
    }
  };

  const failAsset = (assetId) => {
    if (!assetId) return;
    manager.itemError(assetId);
    completeAsset(assetId);
  };

  const flushPending = () => {
    const remaining = Array.from(pendingSet);
    for (let i = 0; i < remaining.length; i++) {
      completeAsset(remaining[i]);
    }
    if (!isLoaded && totalCount === 0) {
      manager.onLoad();
    }
  };

  const waitForAllLoaded = async () => {
    if (isLoaded) {
      return {
        loaded: loadedCount,
        total: totalCount,
        percent: 100,
        errors: errorUrls.slice(),
      };
    }
    return allLoadedPromise;
  };

  const getSnapshot = () => {
    const safeTotal = Math.max(1, totalCount);
    const percent = isLoaded
      ? 100
      : totalCount === 0
        ? 0
        : Math.round((Math.min(loadedCount, safeTotal) / safeTotal) * 100);
    return {
      loaded: loadedCount,
      total: totalCount,
      percent,
      isLoaded,
      currentAsset: currentUrl,
      completedAssets: Array.from(completedSet),
      errors: errorUrls.slice(),
    };
  };

  return {
    manager,
    textureLoader,
    registerManifest,
    markAssetStartLabel,
    completeAsset,
    failAsset,
    flushPending,
    waitForAllLoaded,
    getSnapshot,
  };
}
