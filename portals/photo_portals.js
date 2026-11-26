/**
 * Monas 3D Experience — Zero-Image 3D Camera Flight Rig (`portals/photo_portals.js`)
 *
 * MVP uses clean procedural 3D camera flights across the 10 stops without legacy PnP
 * Eiffel photo overlays (zero external fetches, zero 404 requests).
 */

export class PhotoPortalSystem {
  constructor({ camera, controls } = {}) {
    this.camera = camera || null;
    this.controls = controls || null;
    this.viewportConstraints = null;
    this._lang = 'id';
  }

  async init() {
    return this;
  }

  setViewportConstraints(vc) {
    this.viewportConstraints = vc || null;
  }

  setTowerController() {}
  setAllowCanvasDragExit() {}
  setPortalsVisible() {}
  setActiveStep() {}
  setLanguage(lang) {
    this._lang = lang === 'en' ? 'en' : 'id';
  }
  setBlend() {}
  setWipe() {}
  syncPortalCutaway() {}

  getActivePortalId() {
    return null;
  }
  isFlying() {
    return false;
  }
  hasActiveVisualTransition() {
    return false;
  }
  getOverlayRect() {
    return null;
  }
  verifyAllPortalsProjection() {
    return [];
  }
  enterPortal() {
    return Promise.resolve();
  }
  exitPortal() {
    return Promise.resolve();
  }
  update() {}
  onResize() {}
  dispose() {}
}
