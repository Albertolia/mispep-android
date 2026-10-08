/**
 * MisPep · Motor de pulsación táctil (v2)
 * ---------------------------------------------------------------
 * La hoja buttons3d.css ya define :active, pero en WebView el
 * pseudo-estado puede quedar "pegado" o no dispararse si el dedo
 * se desliza ligeramente. Este módulo replica el hundimiento con
 * una clase .is-pressed real:
 *
 *   pointerdown  -> se añade .is-pressed (el botón baja)
 *   pointerup / pointercancel / arrastre / salida -> se retira
 *
 * Delegado en document: funciona también con los botones que el
 * propio JS de la app inyecta después (modales, historiales, etc.).
 */
(function () {
  'use strict';

  var SELECTOR = [
    '.btn-3d',
    '.icon-btn-3d',
    '.subtab-btn',
    '.pill-3d',
    '.filter-chip',
    '.body-zone-chip',
    '.dose-unit-card',
    '.cal-day',
    '.drawer-item',
    '.med-wheel-item',
    '.action-card-6',
    '.btn-emerald-dose',
    '.color-pick-btn',
    '.nav-item',
    '.switch-toggle',
    '.fab-3d',
    '.health-card',
    '.brand',
    '.body-node-item',
    '.zone-node',
    '.bottom-sheet-handle',
    '[data-press]'
  ].join(',');

  /** Pulsación háptica corta al hundir. Desactivada por defecto
   *  para no duplicar la vibración que ya lanza cada handler. */
  var HAPTIC_ON_PRESS = false;
  var PRESS_MS = 12;

  var pressed = null;
  var startX = 0;
  var startY = 0;
  var releaseTimer = null;

  function vibrate() {
    if (!HAPTIC_ON_PRESS) return;
    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.haptic === 'function') {
        window.AndroidBridge.haptic(PRESS_MS);
      } else if (navigator.vibrate) {
        navigator.vibrate(PRESS_MS);
      }
    } catch (e) { /* silencioso */ }
  }

  function findTarget(node) {
    while (node && node !== document && node.nodeType === 1) {
      if (node.matches && node.matches(SELECTOR)) return node;
      node = node.parentNode;
    }
    return null;
  }

  function press(el) {
    if (!el || el === pressed) return;
    release();
    pressed = el;
    el.classList.add('is-pressed');
    vibrate();
    // Red de seguridad: nunca dejar un botón hundido eternamente.
    releaseTimer = setTimeout(release, 700);
  }

  function release() {
    if (releaseTimer) {
      clearTimeout(releaseTimer);
      releaseTimer = null;
    }
    if (pressed) {
      pressed.classList.remove('is-pressed');
      pressed = null;
    }
  }

  function onDown(e) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType !== 'touch') return;
    if (e.touches && e.touches.length > 1) return; // gesto de dos dedos (zoom)
    var el = findTarget(e.target);
    if (!el || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;
    startX = (e.touches ? e.touches[0].clientX : e.clientX) || 0;
    startY = (e.touches ? e.touches[0].clientY : e.clientY) || 0;
    press(el);
  }

  function onMove(e) {
    if (!pressed) return;
    var point = e.touches ? e.touches[0] : e;
    if (!point) return;
    var dx = Math.abs((point.clientX || 0) - startX);
    var dy = Math.abs((point.clientY || 0) - startY);
    // Si el dedo se va de paseo (scroll), el botón vuelve a subir.
    if (dx > 12 || dy > 12) release();
  }

  var hasPointer = typeof window.PointerEvent === 'function';

  if (hasPointer) {
    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerup', release, { passive: true });
    document.addEventListener('pointercancel', release, { passive: true });
  } else {
    document.addEventListener('touchstart', onDown, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', release, { passive: true });
    document.addEventListener('touchcancel', release, { passive: true });
    document.addEventListener('mousedown', onDown, { passive: true });
    document.addEventListener('mouseup', release, { passive: true });
  }

  document.addEventListener('mouseleave', release, { passive: true });
  document.addEventListener('blur', release, { passive: true });
  window.addEventListener('scroll', release, { passive: true });

  // Si la app abre/cierra una vista con el dedo aún apoyado, limpiamos.
  window.addEventListener('hashchange', release);

  window.Tactile = {
    press: function (selectorOrEl) {
      var el = typeof selectorOrEl === 'string'
        ? document.querySelector(selectorOrEl)
        : selectorOrEl;
      if (!el) return false;
      press(el);
      return true;
    },
    release: release,
    setHapticOnPress: function (on) { HAPTIC_ON_PRESS = !!on; },
    selector: SELECTOR
  };
})();
