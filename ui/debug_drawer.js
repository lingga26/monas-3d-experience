/**
 * Monas 3D Experience — Zero-Footprint Engineering Debug Drawer (`ui/debug_drawer.js`)
 *
 * Strictly unmounted in Visitor Mode (`getElement() === null`).
 * Activated only via `?debug=1` or `Ctrl+Shift+D` / `Cmd+Shift+D`.
 */

import { MONAS_ZONE_DEFS } from '../model/tower_controller.js';

export function auditZeroEmissive(scene, opts = {}) {
  const enforceZero = Boolean(opts.enforceZero);
  const visited = new Set();
  const offenders = [];
  if (!scene || typeof scene.traverse !== 'function') {
    return { passes: true, checkedMaterials: 0, offendingCount: 0, offenders: [] };
  }
  scene.traverse((obj) => {
    if (!obj || (!obj.isMesh && !obj.isLine && !obj.isPoints) || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!mat) continue;
      const seen = visited.has(mat);
      visited.add(mat);
      if (mat.emissive && mat.emissive.getHex() !== 0x000000 && (mat.emissiveIntensity ?? 1) > 0.0001) {
        if (!seen) {
          offenders.push({
            meshName: obj.name || '(unnamed)',
            materialName: mat.name || mat.type,
          });
        }
        if (enforceZero) {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0.0;
          mat.needsUpdate = true;
        }
      }
    }
  });
  return {
    passes: enforceZero ? true : offenders.length === 0,
    checkedMaterials: visited.size,
    offendingCount: enforceZero ? 0 : offenders.length,
    offenders: enforceZero ? [] : offenders,
  };
}

export function isDebugRequestedInUrl(searchString = '') {
  const raw =
    searchString || (typeof window !== 'undefined' && window.location ? window.location.search : '');
  if (!raw) return false;
  try {
    const val = (new URLSearchParams(raw).get('debug') || '').trim().toLowerCase();
    return val === '1' || val === 'true' || val === 'yes';
  } catch {
    return false;
  }
}

export function createDebugDrawer({
  mountPoint = null,
  app = null,
  towerController = null,
  atmosphere = null,
  renderer = null,
  enableKeyboardShortcut = true,
  autoCheckUrl = true,
} = {}) {
  let drawerEl = null;
  let isOpen = false;
  let ttflMs = null;
  let statsEl = null;

  function renderMetrics() {
    if (!isOpen || !statsEl) return;
    const m = app?.getMetrics?.() || {};
    const t = m.tower || towerController?.getMetrics?.() || {};
    const calls = renderer?.info?.render?.calls ?? 0;
    const tris = renderer?.info?.render?.triangles ?? 0;
    statsEl.textContent = [
      `Step: ${Number(t.kinematics?.step ?? app?.getStep?.() ?? 0).toFixed(2)} / 9.00`,
      `Mood: ${atmosphere?.getMood?.() || 'day'}`,
      `Draw Calls: ${calls}`,
      `Rendered Triangles: ${tris.toLocaleString()}`,
      `Model Triangles: ${(t.triangleCount ?? 0).toLocaleString()}`,
      `Cold TTFL: ${ttflMs !== null ? `${ttflMs} ms` : 'pending'}`,
    ].join('\n');
  }

  function mount() {
    if (drawerEl) return;
    drawerEl = document.createElement('aside');
    drawerEl.id = 'monas-debug-drawer';
    drawerEl.className = 'monas-debug-drawer';
    drawerEl.innerHTML = `
      <div class="monas-debug-head">
        <strong>Monas Inspector</strong>
        <button type="button" id="btn-debug-close">✕</button>
      </div>
      <div class="monas-debug-sec">
        <label>Step (0–9): <input id="dbg-step-slider" type="range" min="0" max="9" step="0.05" value="${towerController?.getStep?.() ?? 9}" /></label>
      </div>
      <div class="monas-debug-sec">
        <div class="monas-debug-zones">
          ${MONAS_ZONE_DEFS.map(
            (z) => `<label><input type="checkbox" data-zone="${z.key}" checked /> ${z.label}</label>`
          ).join('')}
        </div>
      </div>
      <div class="monas-debug-sec">
        <button type="button" data-rmode="pbr">PBR</button>
        <button type="button" data-rmode="ink">Wire</button>
        <button type="button" data-rmode="xray">X-Ray</button>
      </div>
      <pre id="dbg-metrics-pre" class="monas-debug-pre"></pre>
    `;
    (mountPoint || document.body).appendChild(drawerEl);
    statsEl = drawerEl.querySelector('#dbg-metrics-pre');

    drawerEl.querySelector('#btn-debug-close').addEventListener('click', close);
    drawerEl.querySelector('#dbg-step-slider').addEventListener('input', (e) => {
      app?.setStep?.(Number(e.target.value));
      renderMetrics();
    });
    for (const cb of drawerEl.querySelectorAll('[data-zone]')) {
      cb.addEventListener('change', (e) => {
        towerController?.setZoneVisibility?.(e.target.dataset.zone, e.target.checked);
        app?.requestFrame?.(2);
      });
    }
    for (const btn of drawerEl.querySelectorAll('[data-rmode]')) {
      btn.addEventListener('click', () => {
        app?.setRenderMode?.(btn.dataset.rmode);
      });
    }
    renderMetrics();
  }

  function open() {
    isOpen = true;
    mount();
  }

  function close() {
    isOpen = false;
    if (drawerEl) {
      drawerEl.remove();
      drawerEl = null;
      statsEl = null;
    }
  }

  const onKey = (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.key.toLowerCase() === 'd') {
      ev.preventDefault();
      if (isOpen) close();
      else open();
    }
  };
  if (enableKeyboardShortcut && typeof window !== 'undefined') {
    window.addEventListener('keydown', onKey);
  }
  if (autoCheckUrl && isDebugRequestedInUrl()) {
    open();
  }

  return {
    getElement: () => drawerEl,
    isOpen: () => isOpen,
    open,
    close,
    markFirstFrameRendered(ms) {
      ttflMs = ms;
      renderMetrics();
    },
    update() {
      if (isOpen) renderMetrics();
    },
    attachSystems() {},
    destroy() {
      if (typeof window !== 'undefined') window.removeEventListener('keydown', onKey);
      close();
    },
  };
}
