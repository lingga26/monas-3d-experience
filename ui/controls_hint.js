/**
 * Unobtrusive Bottom-Right 3D Controls Hint (`ui/controls_hint.js`)
 *
 * Displays standard OrbitControls interactions (`Click & drag to rotate · Scroll to zoom · Right-drag to pan`)
 * in the bottom-right corner without obstructing pointer/wheel events on the 3D canvas.
 */

import { getUiCopy, normalizeLang } from '../story_and_archive/walkthrough_data.js';

export function createControlsHint({ parent = null, lang = 'id' } = {}) {
  let currentLang = normalizeLang(lang);

  const el = document.createElement('aside');
  el.id = 'monas-controls-hint';
  el.className = 'monas-controls-hint';

  const textEl = document.createElement('span');
  textEl.className = 'monas-controls-hint-text';
  el.appendChild(textEl);

  const mountTarget = parent || document.getElementById('museum-ui-root') || document.body;
  mountTarget.appendChild(el);

  function render() {
    const copy = getUiCopy(currentLang);
    el.setAttribute('aria-label', copy.controlsHintAria);
    textEl.textContent = copy.controlsHint;
  }

  function setLanguage(nextLang) {
    currentLang = normalizeLang(nextLang);
    render();
  }

  render();

  return {
    element: el,
    setLanguage,
    dispose: () => el.remove(),
  };
}
