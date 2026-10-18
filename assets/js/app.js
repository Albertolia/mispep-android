/**
 * MisPep - Aplicación Android en Español
 * Lógica completa, navegación, módulos y cálculo offline
 */

// Helper Háptico 3D
function triggerHaptic(duration = 18) {
  try {
    if (window.AndroidBridge && typeof window.AndroidBridge.haptic === 'function') {
      window.AndroidBridge.haptic(duration);
    } else if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  } catch (e) {}
}

// Notificación Toast Flotante
function showToast(msg) {
  triggerHaptic(25);
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'app-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span style="color:#10b981; font-size:1.1rem;">✓</span> ${msg}`;
  toast.classList.add('show');
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

// Helper universal de Fecha Local en formato 'YYYY-MM-DD'
// Sincroniza al 100% con la fecha/hora local del móvil.
// Evita el bug de desfase de toISOString() (UTC) que entre las 00:00 y las 02:00
// en España hacía que el calendario y los registros mostraran el día de ayer.
function getLocalDateStr(dateObj) {
  const d = dateObj ? (dateObj instanceof Date ? dateObj : new Date(dateObj)) : new Date();
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ============================================================
   COPIAS DE SEGURIDAD AUTOMÁTICAS
   - Se escriben en Descargas/MisPep (sobreviven a desinstalar la app)
   - 3 copias rotativas: cada vez que se añade o modifica un dato se
     reescribe la más antigua (1 → 2 → 3 → 1 …)
   - 1 copia semanal: solo se reescribe si han pasado 7 días
   ============================================================ */
const AUTO_BACKUP_STATE = 'mispep_autobackup_state';
const AUTO_BACKUP_SEMANAL = 'MisPep_auto_semanal.json';
const AUTO_BACKUP_SLOTS = 3;
const AUTO_BACKUP_DIAS = 7;
let autoBackupTimer = null;

function autoBackupNombreCambio(n) {
  return 'MisPep_auto_cambio_' + n + '.json';
}

function autoBackupEstado() {
  try {
    return JSON.parse(localStorage.getItem(AUTO_BACKUP_STATE) || '{}') || {};
  } catch (e) {
    return {};
  }
}

// Muestra en el menú lateral cuándo se hizo la última copia
function autoBackupPintarEstado() {
  const el = document.getElementById('autobackupEstado');
  if (!el) return;
  const st = autoBackupEstado();
  const f = (iso) => {
    try {
      return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return iso; }
  };
  if (!st.ultimoCambio) {
    el.textContent = 'Todavía sin copias: se crean al primer cambio de datos.';
    return;
  }
  el.textContent = 'Última copia de cambios: ' + f(st.ultimoCambio) +
    ' · Última semanal: ' + (st.ultimoSemanal ? f(st.ultimoSemanal) : '—');
}

function autoBackupContenido(motivo) {
  const datos = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.indexOf(STORAGE_PREFIX) === 0 && k !== AUTO_BACKUP_STATE) {
      datos[k] = localStorage.getItem(k);
    }
  }
  datos._auto = {
    fecha: new Date().toISOString(),
    motivo: motivo || 'cambio de datos',
    formato: 'MisPep backup automatico v1'
  };
  return JSON.stringify(datos, null, 2);
}

function autoBackupEscribir(nombre, contenido) {
  try {
    if (window.AndroidBridge && typeof window.AndroidBridge.saveTextFileSilencioso === 'function') {
      window.AndroidBridge.saveTextFileSilencioso(nombre, contenido, 'application/json');
      return true;
    }
    if (window.AndroidBridge && typeof window.AndroidBridge.saveTextFile === 'function') {
      window.AndroidBridge.saveTextFile(nombre, contenido, 'application/json');
      return true;
    }
    if (typeof saveTextFile === 'function') {
      return saveTextFile(nombre, contenido, 'application/json') !== false;
    }
  } catch (e) {}
  return false;
}

// Escribe las copias: rota las 3 de cambios y refresca la semanal si toca
function autoBackupAhora(motivo) {
  const contenido = autoBackupContenido(motivo);
  const st = autoBackupEstado();
  const ahora = new Date();

  const slot = ((parseInt(st.slot, 10) || 0) % AUTO_BACKUP_SLOTS) + 1;
  const okCambio = autoBackupEscribir(autoBackupNombreCambio(slot), contenido);
  if (okCambio) {
    st.slot = slot;
    st.ultimoCambio = ahora.toISOString();
  }

  let semanalEscrita = false;
  const desde = st.ultimoSemanal ? (ahora.getTime() - new Date(st.ultimoSemanal).getTime()) : Infinity;
  if (desde >= AUTO_BACKUP_DIAS * 24 * 60 * 60 * 1000) {
    if (autoBackupEscribir(AUTO_BACKUP_SEMANAL, contenido)) {
      st.ultimoSemanal = ahora.toISOString();
      semanalEscrita = true;
    }
  }

  try {
    localStorage.setItem(AUTO_BACKUP_STATE, JSON.stringify(st));
  } catch (e) {}
  autoBackupPintarEstado();
  return { slot: slot, cambio: okCambio, semanal: semanalEscrita };
}

// Agrupa ráfagas de cambios en una sola copia
function autoBackupProgramar(retraso) {
  clearTimeout(autoBackupTimer);
  autoBackupTimer = setTimeout(() => {
    autoBackupTimer = null;
    autoBackupAhora('cambio de datos');
  }, typeof retraso === 'number' ? retraso : 1500);
}

// Si la app se va a segundo plano con una copia pendiente, se escribe ya
function autoBackupFlush() {
  if (autoBackupTimer) {
    clearTimeout(autoBackupTimer);
    autoBackupTimer = null;
    autoBackupAhora('cambio de datos');
  }
}

// Escribe la copia semanal en cuanto se abre la app si aún no existe
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const st = autoBackupEstado();
    if (!st.ultimoSemanal) autoBackupAhora('primera copia de seguridad');
    autoBackupPintarEstado();
  }, 4000);
});

// Rearma el recordatorio de dosis en CADA apertura de la app. Sin esto, una
// actualización o reinstalación cancelaba la alarma y el usuario se quedaba sin
// aviso hasta que volviera a guardar la ficha. La llamada nativa es idempotente
// (requestCode fijo + FLAG_UPDATE_CURRENT) y no programa horas ya pasadas.
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    try { scheduleNextDoseAlarm(); } catch (err) {
      console.warn('No se pudo rearmar el recordatorio:', err);
    }
  }, 1500);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') autoBackupFlush();
});
window.addEventListener('pagehide', autoBackupFlush);

// Claves internas que no cuentan como "dato nuevo o modificado"
const AUTO_BACKUP_IGNORAR = ['mispep_autobackup_state', 'mispep_reminder_config', 'mispep_battery_warned', 'mispep_hc_pedido'];

// Intercepta toda escritura de datos de MisPep: cualquier alta o modificación real dispara copia
(function instalarAutoBackup() {
  try {
    const setItemOriginal = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (clave, valor) {
      let previo = null;
      try { previo = localStorage.getItem(clave); } catch (e) {}
      setItemOriginal(clave, valor);
      try {
        const esDato = typeof clave === 'string' && clave.indexOf(STORAGE_PREFIX) === 0 && AUTO_BACKUP_IGNORAR.indexOf(clave) === -1;
        const haCambiado = String(previo) !== String(valor);
        if (esDato && haCambiado) autoBackupProgramar();
      } catch (e) {}
    };
  } catch (e) {}
})();

// Inicialización de eventos táctiles para todos los botones 3D
document.addEventListener('DOMContentLoaded', () => {
  // Migrar claves de versiones anteriores (peprecon_ -> mispep_) antes de inicializar nada
  migrateLegacyStorage();

  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-3d, .pill-3d, .icon-btn-3d, .nav-item, .subtab-btn');
    if (btn) {
      triggerHaptic(15);
    }
  });

  const APP_VERSION = 'v1.0.35';
  document.querySelectorAll('.app-version-badge').forEach(el => {
    el.textContent = APP_VERSION;
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerHaptic(12);
      showToast(`MisPep ${APP_VERSION} (Build 18)`);
    });
  });

  initNavigation();
  initTheme();
  initDashboard();
  initCalendar();
  initMedications();
  initAddDoseModal();
  initCalc();
  initReverse();
  initBlend();
  initHGH();
  initIntranasal();
  initPlan();
  initRunway();
  initRotate();
  initConvert();
  initInventory();
  initLabel();
  initCOA();
  initChart();
  initLabs();
  initResearch();
  initBackupSystem();
  initBatteryNotice();
  initSupportDevModal();
  scheduleNextDoseAlarmAt9AM();
});

// Navegación y Rutas
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const drawerItems = document.querySelectorAll('.drawer-item');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');

  // Pila de navegación para gestionar el botón Atrás de Android
  window._navHistory = ['dashboard'];

  function openModule(moduleId, addToHistory = true) {
    if (!moduleId) return;
    const currentActive = document.querySelector('.module-view.active');
    const currentId = currentActive ? currentActive.id.replace('module-', '') : 'dashboard';

    document.querySelectorAll('.module-view').forEach(view => view.classList.remove('active'));
    const target = document.getElementById('module-' + moduleId);
    if (target) {
      target.classList.add('active');
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    if (addToHistory && moduleId !== currentId) {
      if (window._navHistory.length === 0 || window._navHistory[window._navHistory.length - 1] !== moduleId) {
        window._navHistory.push(moduleId);
      }
    }

    // Actualizar nav inferior
    navItems.forEach(item => {
      if (item.dataset.target === moduleId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Cerrar drawer
    if (drawerOverlay) drawerOverlay.classList.remove('open');
  }

  // Manejador invocado por el botón Atrás del teléfono
  window.handleAndroidBack = function() {
    // 1. Si el teclado virtual está activo en un input, desenfocarlo
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
      document.activeElement.blur();
    }

    // 2. Si el menú lateral (drawer) está desplegado, cerrarlo
    if (drawerOverlay && drawerOverlay.classList.contains('open')) {
      drawerOverlay.classList.remove('open');
      return true;
    }

    // 3. Si hay algún modal / bottom sheet abierto, cerrarlo
    const openSheet = document.querySelector('.bottom-sheet-backdrop.open');
    if (openSheet) {
      openSheet.classList.remove('open');
      return true;
    }

    // 4. Si la vista actual es 'dashboard' (el inicio), cerrar la aplicación
    const currentActive = document.querySelector('.module-view.active');
    const currentId = currentActive ? currentActive.id.replace('module-', '') : 'dashboard';
    if (currentId === 'dashboard') {
      window._navHistory = ['dashboard'];
      return false;
    }

    // 5. Navegación hacia atrás en las páginas visitadas
    while (window._navHistory.length > 0 && window._navHistory[window._navHistory.length - 1] === currentId) {
      window._navHistory.pop();
    }

    if (window._navHistory.length > 0) {
      const prevModule = window._navHistory.pop();
      openModule(prevModule, false);
      return true;
    }

    // Si no quedan más en la pila, volver al inicio (dashboard)
    openModule('dashboard', false);
    window._navHistory = ['dashboard'];
    return true;
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      openModule(item.dataset.target);
    });
  });

  drawerItems.forEach(item => {
    item.addEventListener('click', () => {
      openModule(item.dataset.target);
    });
  });

  menuBtn.addEventListener('click', () => {
    drawerOverlay.classList.add('open');
    autoBackupPintarEstado();
  });

  closeDrawerBtn.addEventListener('click', () => {
    drawerOverlay.classList.remove('open');
  });

  drawerOverlay.addEventListener('click', (e) => {
    if (e.target === drawerOverlay) {
      drawerOverlay.classList.remove('open');
    }
  });

  window.switchModule = openModule;
}

/* ============================================================
   SISTEMA DE COPIAS DE SEGURIDAD Y PRIVACIDAD (ESTILO BENCH)
   ============================================================ */
// Prefijos de almacenamiento local (mispep_ actual, peprecon_ en versiones antiguas)
const STORAGE_PREFIX = 'mispep_';
const LEGACY_PREFIX = 'peprecon_';

// Migración transparente: copia las claves antiguas (peprecon_) a las nuevas (mispep_)
// para que una copia de seguridad de una versión anterior siga restaurándose.
function migrateLegacyStorage() {
  try {
    const pendientes = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(LEGACY_PREFIX) === 0) pendientes.push(k);
    }
    pendientes.forEach((k) => {
      const nuevo = STORAGE_PREFIX + k.slice(LEGACY_PREFIX.length);
      if (localStorage.getItem(nuevo) === null) {
        localStorage.setItem(nuevo, localStorage.getItem(k));
      }
    });
    if (pendientes.length) {
      console.log('MisPep: migradas ' + pendientes.length + ' claves de almacenamiento antiguas');
    }
  } catch (e) {}

  // Restaurar y proteger las horas reales de las medidas de tensión arterial
  try {
    const BP_REAL_TIMES = {
      'entry-1790077603744': '13:46',
      'entry-1790196519570': '22:48',
      'entry-1790267549364': '18:32',
      'bp-1790333965542': '18:14',
      'cal-bp-1790333965544': '18:14',
      'bp-1790431310504': '16:01',
      'cal-bp-1790431310506': '16:01',
      'bp-1790963426838': '22:49',
      'bp-1790963381569': '16:10',
      'bp-1790963320064': '23:01',
      'bp-1790963229397': '23:02',
      'bp-1790963145377': '10:29',
      'cal-bp-bp-1791023450783': '12:30',
      'bp-1791066290986': '00:24',
      'bp-1791138267533': '20:24',
      'bp-1791146596047': '22:43',
      'bp-1791198909806': '13:15',
      'bp-1791210681070': '16:31'
    };

    const rawBp = localStorage.getItem('mispep_bp_logs');
    if (rawBp) {
      const bpLogs = JSON.parse(rawBp);
      let bpChanged = false;
      if (Array.isArray(bpLogs)) {
        bpLogs.forEach(l => {
          const cleanId = (l.id || '').replace(/^cal-bp-/, '');
          const real = BP_REAL_TIMES[l.id] || BP_REAL_TIMES[cleanId];
          if (real && l.time !== real) {
            l.time = real;
            bpChanged = true;
          }
        });
        if (bpChanged) {
          localStorage.setItem('mispep_bp_logs', JSON.stringify(bpLogs));
        }
      }
    }

    const rawCal = localStorage.getItem('mispep_calendar_entries');
    if (rawCal) {
      const calEntries = JSON.parse(rawCal);
      let calChanged = false;
      if (Array.isArray(calEntries)) {
        calEntries.forEach(e => {
          if (e.type === 'bp') {
            const cleanId = (e.id || '').replace(/^cal-bp-/, '');
            const real = BP_REAL_TIMES[e.id] || BP_REAL_TIMES[cleanId];
            if (real && e.time !== real) {
              e.time = real;
              calChanged = true;
            }
          }
        });
        if (calChanged) {
          localStorage.setItem('mispep_calendar_entries', JSON.stringify(calEntries));
        }
      }
    }
  } catch (e) {}
}

function initBackupSystem() {
  const backupBtn = document.getElementById('drawerBackupJsonBtn');
  const restoreBtn = document.getElementById('drawerRestoreJsonBtn');
  const exportCsvBtn = document.getElementById('drawerExportCsvBtn');
  const fileInput = document.getElementById('backupFileInput');

  if (backupBtn) {
    backupBtn.addEventListener('click', () => {
      triggerHaptic(16);
      const backupData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('mispep_')) {
          backupData[k] = localStorage.getItem(k);
        }
      }
      const jsonStr = JSON.stringify(backupData, null, 2);
      const filename = `mispep_backup_${getLocalDateStr()}.json`;
      saveTextFile(filename, jsonStr, 'application/json', '✓ Copia de seguridad JSON guardada (Privacidad 100%)');
    });
  }

  if (restoreBtn && fileInput) {
    restoreBtn.addEventListener('click', () => {
      triggerHaptic(14);
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          let count = 0;
          for (const k in data) {
            // Acepta el prefijo nuevo (mispep_) y el de copias antiguas (mispep_)
            const key = k.startsWith(LEGACY_PREFIX) ? (STORAGE_PREFIX + k.slice(LEGACY_PREFIX.length)) : k;
            if (key.startsWith(STORAGE_PREFIX)) {
              localStorage.setItem(key, typeof data[k] === 'string' ? data[k] : JSON.stringify(data[k]));
              count++;
            }
          }
          showToast(`✓ Copia restaurada: ${count} módulos sincronizados`);
          setTimeout(() => location.reload(), 800);
        } catch (err) {
          showToast('Error al leer el archivo de copia');
        }
      };
      reader.readAsText(file);
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      triggerHaptic(16);
      const entries = JSON.parse(localStorage.getItem('mispep_calendar_entries') || '[]');
      let csv = 'Fecha,Tipo,Compuesto,Detalle,Omitida,Hora\n';
      entries.forEach(e => {
        const isSkip = e.type === 'skipped' || e.skipped ? 'yes' : 'no';
        csv += `"${e.date}","${e.type}","${(e.title || '').replace(/"/g, '""')}","${(e.detail || '').replace(/"/g, '""')}","${isSkip}","${e.time || ''}"\n`;
      });

      const filename = `mispep_historial_${getLocalDateStr()}.csv`;
      saveTextFile(filename, csv, 'text/csv', '✓ Exportación CSV guardada (con skipped=yes/no)');
    });
  }
}

/* ------------------------------------------------------------
   Guardado de texto (JSON/CSV):
   En la app Android usa el puente nativo (escribe en Descargas/MisPep).
   En navegador de escritorio usa la descarga clásica del navegador.
   ------------------------------------------------------------ */
function saveTextFile(filename, content, mimeType, mensajeExito) {
  try {
    if (window.AndroidBridge && typeof window.AndroidBridge.saveTextFile === 'function') {
      window.AndroidBridge.saveTextFile(filename, content, mimeType || 'application/json');
      if (mensajeExito) showToast(mensajeExito);
      return true;
    }
  } catch (e) {
    console.warn('saveTextFile nativo falló, se intenta la descarga del navegador:', e);
  }
  try {
    const blob = new Blob([content], { type: (mimeType || 'application/json') + ';charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (mensajeExito) showToast(mensajeExito);
    return true;
  } catch (e) {
    showToast('⚠️ No se pudo guardar el archivo');
    return false;
  }
}

/* ============================================================
   RECORDATORIOS DE INYECCIÓN Y PERSISTENCIA DE BATERÍA
   ============================================================ */
// Convierte cualquier hora introducida por el usuario al formato 24 h HH:MM.
// Por defecto usa 09:00 (hora recomendada de inyección semanal), no la hora de la tensión.
function normalizeReminderTime(raw, defaultVal) {
  const def = defaultVal || '09:00';
  const s = String(raw == null ? '' : raw).trim();
  if (!s) return def;
  const m = s.match(/(\d{1,2})[:.](\d{2})\s*([AaPp][Mm])?/);
  if (!m) return def;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'AM') { if (h === 12) h = 0; }
  else if (ap === 'PM') { if (h !== 12) h += 12; }
  if (isNaN(h) || h < 0 || h > 23) return def;
  return `${String(h).padStart(2, '0')}:${min}`;
}
window.normalizeReminderTime = normalizeReminderTime;

function scheduleNextDoseAlarm() {
  try {
    let p = null;
    if (typeof getHealthProfile === 'function') {
      try { p = getHealthProfile(); } catch (_) { p = null; }
    }
    if (!p) {
      try { p = JSON.parse(localStorage.getItem('mispep_health_profile') || '{}'); } catch (_) { p = {}; }
    }
    if (!p || (!p.nextInjectionDate && !p.lastInjectionDate)) return;

    const freqDays = parseInt(p.freqDays, 10) || 7;

    // Última dosis REALMENTE administrada: historial unificado (excluye las
    // saltadas y las planificadas a futuro, que antes desplazaban la alarma).
    let lastInjDate = null;
    if (window.MisPepProtocols && typeof window.MisPepProtocols.getInjectionHistory === 'function') {
      try {
        const h = window.MisPepProtocols.getInjectionHistory();
        if (h && h.length) lastInjDate = h[h.length - 1].date;
      } catch (_) {}
    }
    if (!lastInjDate) {
      const calEntries = JSON.parse(localStorage.getItem('mispep_calendar_entries') || '[]');
      const injEntries = calEntries
        .filter(e => (e.type === 'inj' || e.type === 'dose') && !e.skipped && e.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      if (injEntries.length) lastInjDate = injEntries[injEntries.length - 1].date;
    }

    let nextDateStr = p.nextInjectionDate;
    if (lastInjDate) {
      const parts = lastInjDate.split('-').map(Number);
      const lastD = new Date(parts[0], parts[1] - 1, parts[2]);
      lastD.setDate(lastD.getDate() + freqDays);
      const ny = lastD.getFullYear();
      const nm = String(lastD.getMonth() + 1).padStart(2, '0');
      const nd = String(lastD.getDate()).padStart(2, '0');
      nextDateStr = `${ny}-${nm}-${nd}`;
    }

    if (!nextDateStr) return;

    let medName = p.activeMed || 'Retatrutida';
    let doseMg = p.nextDoseMg || '1.5';
    // El protocolo vigente manda sobre el perfil (cambios de medicación)
    if (window.MisPepProtocols && typeof window.MisPepProtocols.getActiveProtocol === 'function') {
      try {
        const act = window.MisPepProtocols.getActiveProtocol();
        if (act) {
          medName = act.label;
          const lastD = act.doses[act.doses.length - 1];
          if (lastD && lastD.dose) doseMg = lastD.dose;
        }
      } catch (_) {}
    }

    // Hora de la inyección semanal (independiente de la medicación de tensión de las 21:30)
    let rcTime = null;
    try {
      const rc = JSON.parse(localStorage.getItem('mispep_reminder_config') || '{}');
      if (rc && rc.time) rcTime = rc.time;
    } catch (_) {}

    let rawInjTime = p.injReminderTime || rcTime;
    if (!rawInjTime && p.reminderTime && p.reminderTime !== '21:30') {
      rawInjTime = p.reminderTime;
    }
    let remTime = normalizeReminderTime(rawInjTime, '09:00');

    if (window.AndroidBridge) {
      if (typeof window.AndroidBridge.scheduleExactDoseAtTime === 'function') {
        window.AndroidBridge.scheduleExactDoseAtTime(
          nextDateStr,
          remTime,
          `💉 Recordatorio de Inyección MisPep`,
          `Hoy a las ${remTime} toca tu dosis de ${medName} (${doseMg} mg). Recuerda rotar la zona.`
        );
      } else if (typeof window.AndroidBridge.scheduleExactDoseAt9AM === 'function') {
        window.AndroidBridge.scheduleExactDoseAt9AM(
          nextDateStr,
          `💉 Recordatorio de Inyección MisPep`,
          `Hoy a las ${remTime} toca tu dosis de ${medName} (${doseMg} mg). Recuerda rotar la zona.`
        );
      }
    }
  } catch (err) {
    console.warn('Error programando recordatorio de inyección:', err);
  }
}
const scheduleNextDoseAlarmAt9AM = scheduleNextDoseAlarm;

function initBatteryNotice() {
  const batteryNoticeBackdrop = document.getElementById('batteryNoticeBackdrop');
  const closeBatteryNoticeBtn = document.getElementById('closeBatteryNoticeBtn');
  const dismissBatteryNoticeBtn = document.getElementById('dismissBatteryNoticeBtn');
  const openBatterySettingsBtn = document.getElementById('openBatterySettingsBtn');
  const drawerBatterySettingsBtn = document.getElementById('drawerBatterySettingsBtn');

  function openNotice() {
    if (batteryNoticeBackdrop) {
      triggerHaptic(16);
      batteryNoticeBackdrop.classList.add('open');
    }
  }
  function closeNotice() {
    if (batteryNoticeBackdrop) {
      batteryNoticeBackdrop.classList.remove('open');
    }
  }

  if (closeBatteryNoticeBtn) closeBatteryNoticeBtn.addEventListener('click', closeNotice);
  if (dismissBatteryNoticeBtn) {
    dismissBatteryNoticeBtn.addEventListener('click', () => {
      localStorage.setItem('mispep_battery_warned', '1');
      closeNotice();
    });
  }

  if (openBatterySettingsBtn) {
    openBatterySettingsBtn.addEventListener('click', () => {
      triggerHaptic(20);
      if (window.AndroidBridge && typeof window.AndroidBridge.openBatterySettings === 'function') {
        window.AndroidBridge.openBatterySettings();
      } else {
        showToast('Ajustes de Android > Aplicaciones > MisPep > Batería > Sin Restricciones');
      }
      localStorage.setItem('mispep_battery_warned', '1');
      closeNotice();
    });
  }

  if (drawerBatterySettingsBtn) {
    drawerBatterySettingsBtn.addEventListener('click', () => {
      if (window.closeDrawer) window.closeDrawer();
      openNotice();
    });
  }

  // Aviso en el primer inicio de la app o tras instalar
  if (!localStorage.getItem('mispep_battery_warned')) {
    setTimeout(() => {
      openNotice();
    }, 1200);
  }
}

// Modal de apoyo y propinas al programador (Criptomonedas)
function initSupportDevModal() {
  const btn = document.getElementById('drawerSupportDevBtn');
  const backdrop = document.getElementById('supportDevBackdrop');
  const closeBtn = document.getElementById('closeSupportDevBtn');
  const dismissBtn = document.getElementById('dismissSupportDevBtn');
  const drawerOverlay = document.getElementById('drawerOverlay');

  function openModal() {
    triggerHaptic(16);
    if (drawerOverlay && drawerOverlay.classList.contains('open')) {
      drawerOverlay.classList.remove('open');
    }
    if (backdrop) {
      backdrop.classList.add('open');
    }
  }

  function closeModal() {
    if (backdrop) {
      backdrop.classList.remove('open');
    }
  }

  if (btn) btn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (dismissBtn) dismissBtn.addEventListener('click', closeModal);
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  document.querySelectorAll('.crypto-card').forEach(card => {
    const uri = card.getAttribute('data-uri');
    const addr = card.getAttribute('data-addr');
    const label = card.getAttribute('data-label') || 'Dirección Crypto';

    const openBtn = card.querySelector('.crypto-open-btn');
    const copyBtn = card.querySelector('.crypto-copy-btn');

    function doOpen(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      triggerHaptic(20);
      if (window.AndroidBridge && window.AndroidBridge.openWalletUri) {
        window.AndroidBridge.openWalletUri(uri, addr);
      } else {
        try {
          window.location.href = uri;
        } catch (ex) {
          if (window.AndroidBridge && window.AndroidBridge.copyCryptoAddress) {
            window.AndroidBridge.copyCryptoAddress(addr, label);
          }
        }
      }
    }

    function doCopy(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      triggerHaptic(15);
      if (window.AndroidBridge && window.AndroidBridge.copyCryptoAddress) {
        window.AndroidBridge.copyCryptoAddress(addr, label);
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(addr);
        if (typeof showToast === 'function') showToast(`✓ ${label} copiado`);
      }
    }

    if (openBtn) openBtn.addEventListener('click', doOpen);
    if (copyBtn) copyBtn.addEventListener('click', doCopy);
    card.addEventListener('click', (e) => {
      if (e.target.closest('.crypto-copy-btn')) return;
      doOpen(e);
    });
  });
}

// Tema Claro / Oscuro
function initTheme() {
  const themeBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('mispep_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  themeBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mispep_theme', next);
  });
}

// Formateo de números
function fmtNum(n, decimals = 2) {
  if (isNaN(n) || !isFinite(n)) return '0';
  if (Number.isInteger(n)) return n.toString();
  return parseFloat(n.toFixed(decimals)).toString();
}

// Renderizador visual de jeringa graduada SVG
function renderSyringe(containerId, units, maxUnits = 100) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const pct = Math.min(100, Math.max(0, (units / maxUnits) * 100));
  // Escala real del barril: 0 u en x=45, maxUnits en x=275 → 230 px de recorrido.
  // El émbolo debe quedar con su borde exactamente en la marca de unidades.
  const barrelStart = 45;
  const barrelScaleWidth = 230;
  const liquidWidth = (barrelScaleWidth * pct) / 100;
  // Id único por contenedor para que cada jeringuilla resuelva su propio degradado
  const liqGradId = 'liqGrad_' + containerId.replace(/[^a-zA-Z0-9_-]/g, '');
  // El rect del líquido se alarga 4px bajo el émbolo para que sus esquinas
  // redondeadas de la derecha queden ocultas tras la goma del pistón
  const liquidRectW = liquidWidth > 0 ? liquidWidth + 4 : 0;

  box.innerHTML = `
    <svg viewBox="0 0 320 60" style="width:100%; height:60px;">
      <!-- Aguja -->
      <line x1="10" y1="30" x2="35" y2="30" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" />
      <polygon points="35,24 45,30 35,36" fill="#64748b" />
      
      <!-- Cuerpo de la jeringa -->
      <rect x="45" y="12" width="230" height="36" rx="6" fill="rgba(255,255,255,0.06)" stroke="#475569" stroke-width="2" />
      
      <!-- Líquido extraído (azulado translúcido para simular el líquido) -->
      <rect x="45" y="14" width="${liquidRectW}" height="32" rx="4" fill="url(#${liqGradId})" />
      
      <!-- Émbolo (borde izquierdo exactamente en las unidades seleccionadas) -->
      <rect x="${barrelStart + liquidWidth}" y="14" width="10" height="32" fill="#0284c7" />
      <line x1="${barrelStart + liquidWidth + 5}" y1="30" x2="300" y2="30" stroke="#0284c7" stroke-width="5" stroke-linecap="round" />
      <rect x="295" y="16" width="8" height="28" rx="2" fill="#0369a1" />

      <!-- Graduación (encima del émbolo, como impresa en el cristal) -->
      ${Array.from({ length: 11 }).map((_, i) => {
        const x = 45 + (i * 23);
        const isMain = i % 2 === 0;
        const h = isMain ? 14 : 8;
        return `
          <line x1="${x}" y1="12" x2="${x}" y2="${12 + h}" stroke="#94a3b8" stroke-width="${isMain ? 1.5 : 1}" />
          ${isMain ? `<text x="${x}" y="38" font-size="7" font-weight="700" fill="#94a3b8" text-anchor="middle">${i * (maxUnits / 10)}</text>` : ''}
        `;
      }).join('')}

      <defs>
        <linearGradient id="${liqGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#7dd3fc" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  `;
}

// Renderizador visual de pluma dosificadora (Pen) con ventana de dial mecánico/digital mostrando los Clicks (Unidades)
function renderPen(containerId, clicksVal, units = 0, maxUnits = 100) {
  const box = document.getElementById(containerId);
  if (!box) return;

  const pct = Math.min(100, Math.max(0, (units / maxUnits) * 100));
  const maxCartridgeW = 90;
  // Nivel de líquido restante / visible en el cartucho
  const liquidW = Math.max(8, maxCartridgeW * (1 - (pct * 0.4) / 100));
  const displayNum = (clicksVal !== undefined && clicksVal !== null) ? clicksVal : 0;
  const displayText = `${displayNum}U`;

  box.innerHTML = `
    <svg viewBox="0 0 320 62" style="width:100%; height:62px; overflow:visible;">
      <defs>
        <linearGradient id="penBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#334155" />
          <stop offset="25%" stop-color="#1e293b" />
          <stop offset="70%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
        <linearGradient id="penChromeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="35%" stop-color="#cbd5e1" />
          <stop offset="70%" stop-color="#64748b" />
          <stop offset="100%" stop-color="#334155" />
        </linearGradient>
        <linearGradient id="penLcdGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#020617" />
          <stop offset="100%" stop-color="#082f49" />
        </linearGradient>
        <linearGradient id="penLiquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(6,182,212,0.5)" />
          <stop offset="50%" stop-color="rgba(16,185,129,0.38)" />
          <stop offset="100%" stop-color="rgba(6,182,212,0.18)" />
        </linearGradient>
        <linearGradient id="penDialGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#475569" />
          <stop offset="50%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <linearGradient id="penBtnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0284c7" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
      </defs>

      <!-- 1. Aguja fina de inyección -->
      <line x1="6" y1="31" x2="26" y2="31" stroke="#cbd5e1" stroke-width="1.8" stroke-linecap="round" />
      <!-- Cono de acoplamiento de aguja -->
      <polygon points="26,25 36,27 36,35 26,37" fill="#64748b" stroke="#475569" stroke-width="1" />

      <!-- 2. Cartucho transparente -->
      <rect x="36" y="17" width="96" height="28" rx="3" fill="rgba(255,255,255,0.06)" stroke="#475569" stroke-width="1.6" />
      <!-- Líquido dentro del cartucho -->
      <rect x="38" y="19" width="${liquidW.toFixed(1)}" height="24" rx="2" fill="url(#penLiquidGrad)" />
      <!-- Graduaciones milimétricas serigrafiadas -->
      <line x1="55" y1="18" x2="55" y2="24" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
      <line x1="72" y1="18" x2="72" y2="24" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
      <line x1="90" y1="18" x2="90" y2="24" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
      <line x1="108" y1="18" x2="108" y2="24" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
      <!-- Émbolo / tapón de goma interno del cartucho -->
      <rect x="${(38 + liquidW).toFixed(1)}" y="19" width="8" height="24" rx="1" fill="#334155" stroke="#1e293b" />

      <!-- 3. Anillo de unión intermedio cromado -->
      <rect x="132" y="14" width="8" height="34" rx="2" fill="url(#penChromeGrad)" stroke="#334155" stroke-width="1" />

      <!-- 4. Cuerpo principal ergonómico del Pen -->
      <rect x="140" y="15" width="122" height="32" rx="4" fill="url(#penBodyGrad)" stroke="#38bdf8" stroke-width="1.2" />
      <line x1="145" y1="21" x2="188" y2="21" stroke="rgba(255,255,255,0.18)" stroke-width="1" />
      <text x="148" y="27" font-size="6.8" font-weight="900" fill="rgba(255,255,255,0.7)" letter-spacing="0.8">MisPep PEN</text>
      <text x="148" y="38" font-size="6" font-weight="700" fill="#06b6d4">DIAL CLICKS</text>

      <!-- 5. Ventana de Dosificación Mecánica / Digital (Dose Counter Window) -->
      <rect x="194" y="17" width="62" height="28" rx="4" fill="#020617" stroke="#38bdf8" stroke-width="1.8" />
      <rect x="196" y="19" width="58" height="24" rx="3" fill="url(#penLcdGrad)" />
      <!-- Bisel de lente con brillo -->
      <line x1="198" y1="21" x2="252" y2="21" stroke="rgba(255,255,255,0.25)" stroke-width="1" />
      <!-- LÍNEAS DE TAMBOR GIRATORIO DEL CONTADOR DE CLICKS -->
      <line x1="200" y1="23" x2="200" y2="39" stroke="rgba(56,189,248,0.2)" stroke-width="1" />
      <line x1="250" y1="23" x2="250" y2="39" stroke="rgba(56,189,248,0.2)" stroke-width="1" />
      <!-- ROTULACIÓN EXACTA DE LOS CLICKS (UNIDADES) EN LA VENTANA: EJ. 40U -->
      <text x="225" y="36.5" font-size="13.5" font-weight="900" fill="#38bdf8" text-anchor="middle" font-family="'Courier New', Courier, monospace, sans-serif" letter-spacing="0.5">${displayText}</text>

      <!-- 6. Selector rotatorio de clicks (Dose Dial Ring) -->
      <rect x="262" y="16" width="22" height="30" rx="3" fill="url(#penDialGrad)" stroke="#475569" stroke-width="1" />
      <!-- Estrías de agarre -->
      <line x1="266" y1="18" x2="266" y2="44" stroke="#64748b" stroke-width="1" />
      <line x1="270" y1="18" x2="270" y2="44" stroke="#64748b" stroke-width="1" />
      <line x1="274" y1="18" x2="274" y2="44" stroke="#64748b" stroke-width="1" />
      <line x1="278" y1="18" x2="278" y2="44" stroke="#64748b" stroke-width="1" />
      <line x1="281" y1="18" x2="281" y2="44" stroke="#64748b" stroke-width="1" />

      <!-- 7. Botón pulsador de inyección (Injection Push-Button) -->
      <rect x="284" y="19" width="18" height="24" rx="3" fill="url(#penBtnGrad)" stroke="#0284c7" stroke-width="1.2" />
      <line x1="287" y1="23" x2="287" y2="39" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
      <ellipse cx="301" cy="31" rx="2.5" ry="9" fill="#38bdf8" />
    </svg>
  `;
}

/* ============================================================
   0. MÓDULO DASHBOARD (Seguimiento de Tratamiento y Datos de Salud)
   ============================================================ */
function initDashboard() {
  const dashBannerText = document.getElementById('dashBannerText');
  const dashDaysCount = document.getElementById('dashDaysCount');
  const dashLblOnTrack = document.getElementById('dashLblOnTrack');
  const dashTotalInjections = document.getElementById('dashTotalInjections');
  const dashTotalInjAllTime = document.getElementById('dashTotalInjAllTime');

  const dashMedName = document.getElementById('dashMedName');
  const dashDaysLeft = document.getElementById('dashDaysLeft');
  const dashNextDoseText = document.getElementById('dashNextDoseText');
  const dashMarkDoseBtn = document.getElementById('dashMarkDoseBtn');

  const dashConfigInjBtn = document.getElementById('dashConfigInjBtn');

  const dashWeeklyAvg = document.getElementById('dashWeeklyAvg');
  const dashBestWeek = document.getElementById('dashBestWeek');
  const dashCurrentWeight = document.getElementById('dashCurrentWeight');
  const dashTotalChange = document.getElementById('dashTotalChange');
  const dashTotalChangeTag = document.getElementById('dashTotalChangeTag');
  const dashTotalChangePct = document.getElementById('dashTotalChangePct');
  const dashCurrentBmi = document.getElementById('dashCurrentBmi');
  const dashBmiCategory = document.getElementById('dashBmiCategory');
  const dashBmiTargetNote = document.getElementById('dashBmiTargetNote');

  const dashAddWeightBtn = document.getElementById('dashAddWeightBtn');
  const dashLogWeightBtn = document.getElementById('dashLogWeightBtn');

  const dashConfigHealthBtn = document.getElementById('dashConfigHealthBtn');

  const dashGoInventoryBtn = document.getElementById('dashGoInventoryBtn');
  const dashGoPkBtn = document.getElementById('dashGoPkBtn');

  // Cargar o Inicializar Perfil de Salud
  function getHealthProfile() {
    const raw = localStorage.getItem('mispep_health_profile');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed.weightLogs) {
          parsed.weightLogs = [];
        }
        // Sincronización genérica con el historial real de inyecciones:
        // cualquier cambio de fármaco o de dosis se refleja automáticamente.
        const synced = syncProfileWithHistory(parsed) || parsed;
        localStorage.setItem('mispep_health_profile', JSON.stringify(synced));
        return synced;
      } catch (_) {}
    }

    const initData = {
      startDate: null,
      startWeight: null,
      currentWeight: null,
      targetWeight: null,
      heightCm: null,
      totalInjections: 0,
      activeMed: 'Retatrutida',
      nextDoseMg: 2.0,
      freqDays: 7,
      lastInjectionDate: null,
      nextInjectionDate: null,
      weightLogs: []
    };
    localStorage.setItem('mispep_health_profile', JSON.stringify(initData));
    return syncProfileWithHistory(initData) || initData;
  }

  function saveProfile(p) {
    localStorage.setItem('mispep_health_profile', JSON.stringify(p));
    renderDashboard();
    // Mantener sincronizado el panel de meta/evolución si está abierto
    if (window.renderWeightGoal) window.renderWeightGoal();
  }


  // ============================================================
  // MOTOR DE PROTOCOLOS DE MEDICACIÓN (CAMBIOS DE FÁRMACO)
  // Todo lo que sigue es genérico: se activa solo cuando el
  // historial de inyecciones registra un fármaco distinto.
  // Al cambiar de medicación se cierra el protocolo anterior
  // (su curva decae a cero por eliminación) y se abre uno nuevo
  // con su propio color, vida media y curva de Bateman.
  // ============================================================
  const MED_CATALOG = [
    { re: /tirzep|terzip|mounjaro|zepbound/i,      name: 'Tirzepatida',  color: '#8b5cf6', halfLife: 5.0 },
    { re: /retatrut/i,                             name: 'Retatrutida',  color: '#10b981', halfLife: 6.0 },
    { re: /semaglut|ozempic|wegovy|rybelsus/i,     name: 'Semaglutida',  color: '#3b82f6', halfLife: 7.0 },
    { re: /liraglut|saxenda|victoza/i,             name: 'Liraglutida',  color: '#f59e0b', halfLife: 0.55 },
    { re: /dulaglut|trulicity/i,                   name: 'Dulaglutida',  color: '#ec4899', halfLife: 5.0 },
    { re: /cagrilintid|cagrisema/i,                name: 'Cagrilintida', color: '#06b6d4', halfLife: 7.0 },
    { re: /bpc[\s-]?157/i,                         name: 'BPC-157',      color: '#a78bfa', halfLife: 0.2 },
    { re: /tb[\s-]?500|timolina/i,                 name: 'TB-500',       color: '#f472b6', halfLife: 0.2 },
    { re: /\bhgh\b|somatrop|genotropin|tropina/i,  name: 'HGH',          color: '#22d3ee', halfLife: 0.15 },
    { re: /testoster|enantato|cipionato|nebido/i,  name: 'Testosterona', color: '#f97316', halfLife: 8.0 }
  ];
  const MED_FALLBACK_PALETTE = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4', '#a78bfa', '#f97316'];

  // Palabras que describen una toma, no un fármaco. Sin esto, un título
  // como «Dosis semanal» crearía un fármaco fantasma y partiría el
  // historial en dos protocolos inexistentes.
  const MED_STOPWORDS = [
    'de', 'del', 'la', 'el', 'los', 'las', 'mi', 'nueva', 'nuevo',
    'dosis', 'toma', 'inyeccion', 'inyección', 'pinchazo', 'aplicacion', 'aplicación',
    'semanal', 'quincenal', 'mensual', 'diaria', 'diario', 'cada', 'semanas', 'semana',
    'mantenimiento', 'carga', 'refuerzo', 'dosis de carga', 'recordatorio',
    'primera', 'segunda', 'tercera', 'cuarta', 'siguiente', 'proxima', 'próxima',
    'hoy', 'ahora', 'manana', 'mañana', 'pendiente', 'extra', 'doble',
    'mg', 'mcg', 'ml', 'ui', 'iu', 'gr', 'unidades'
  ];

  // Limpia el título de una dosis y deja solo el nombre del fármaco
  function normalizeMedName(raw) {
    let s = String(raw == null ? '' : raw).trim();
    if (!s) return '';
    s = s.replace(/\((.*?)\)/g, ' ')
         .replace(/[0-9]+([\.,][0-9]+)?\s*(mg|mcg|ml|ui|iu|gr)\b/gi, ' ')
         .replace(/^\s*(inyecci[óo]n|dosis|toma|pinchazo|aplicaci[óo]n)\s*(de)?\s*/i, ' ')
         .replace(/[\s,;:·\-–—]+/g, ' ')
         .trim();
    const words = s.split(' ').filter(w => w && MED_STOPWORDS.indexOf(w.toLowerCase()) === -1);
    // Un nombre de fármaco real tiene al menos una palabra de 3+ letras
    if (!words.some(w => w.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '').length >= 3)) return '';
    return words.join(' ').trim();
  }

  // Clave canónica: sin acentos, sin mayúsculas y sin signos. Así «Péptido Z»,
  // «peptido z» y «PÉPTIDO-Z» son EL MISMO fármaco y no parten el historial
  // en protocolos distintos (y su color derivado es siempre el mismo).
  function canonMedKey(s) {
    return String(s == null ? '' : s)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  // Descriptor clínico del fármaco: color + vida media + nombre canónico.
  // Si no está en el catálogo, el color se deriva del nombre (estable).
  function medDescriptor(rawName) {
    const clean = normalizeMedName(rawName) || 'Sin especificar';
    const raw = String(rawName == null ? '' : rawName);
    const found = MED_CATALOG.find(m => m.re.test(clean) || m.re.test(raw));
    if (found) return { key: canonMedKey(found.name), label: found.name, color: found.color, halfLife: found.halfLife, raw: clean };
    const key = canonMedKey(clean) || 'sin-especificar';
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 9973;
    const label = clean.charAt(0).toUpperCase() + clean.slice(1);
    return { key: key, label: label, color: MED_FALLBACK_PALETTE[h % MED_FALLBACK_PALETTE.length], halfLife: 6.0, raw: clean };
  }

  function fmtShortDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()} ${d.toLocaleDateString('es-ES', { month: 'short' })}`;
  }

  // Historial real de inyecciones, unificado y con el fármaco atribuido
  function getInjectionHistory() {
    const map = new Map();

    // Fecha de hoy en formato YYYY-MM-DD **local**. Con toISOString() se usa UTC
    // y entre las 00:00 y las 02:00 (España, UTC+2) la dosis de hoy contaba como
    // futura y se descartaba del historial.
    const _now = new Date();
    const todayStr = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;

    const calEntries = JSON.parse(localStorage.getItem('mispep_calendar_entries') || '[]');
    calEntries.forEach(e => {
      if (e.type !== 'inj' || e.skipped || !e.date) return;
      // Una dosis futura es una previsión, no una administración: contarla
      // desplazaría la próxima inyección y falsearía el pico circulante.
      if (String(e.date).split('T')[0] > todayStr) return;
      const dObj = new Date(e.date + 'T12:00:00');
      if (isNaN(dObj.getTime())) return;
      const title = e.title || '';
      const match = title.match(/([0-9]+(?:[\.,][0-9]+)?)\s*(?:mg|mcg)/i);
      let doseVal = e.dose ? parseFloat(e.dose) : (match ? parseFloat(match[1].replace(',', '.')) : null);
      if (doseVal && /mcg/i.test(title)) doseVal = doseVal / 1000;
      const medRaw = normalizeMedName(title);
      map.set(e.date, {
        date: e.date, time: dObj.getTime(), dose: doseVal,
        med: medRaw ? medDescriptor(medRaw) : null,
        planned: !!e.planned, site: e.detail || e.site || '', source: 'calendar'
      });
    });

    // Dosis registradas solo en el modelo PK (sin nombre de fármaco)
    const pkDoses = JSON.parse(localStorage.getItem('mispep_pk_doses') || '[]');
    pkDoses.forEach(d => {
      const dateStr = String(d.date || '').split('T')[0];
      if (!dateStr || map.has(dateStr)) return;
      if (dateStr > todayStr) return;
      const dObj = new Date(dateStr + 'T12:00:00');
      if (isNaN(dObj.getTime())) return;
      map.set(dateStr, {
        date: dateStr, time: dObj.getTime(), dose: parseFloat(d.doseMg) || null,
        med: null, planned: false, site: d.site || '', source: 'pk'
      });
    });

    const list = Array.from(map.values()).sort((a, b) => a.time - b.time);

    // Atribución: una dosis sin fármaco hereda el del último evento que lo declara
    let lastMed = null;
    list.forEach(ev => { if (ev.med) lastMed = ev.med; });
    let running = null;
    list.forEach(ev => {
      if (ev.med) running = ev.med;
      else if (running) ev.med = running;
    });
    const rawProfile = JSON.parse(localStorage.getItem('mispep_health_profile') || '{}');
    const fallback = medDescriptor(rawProfile.activeMed || (lastMed ? lastMed.label : 'Retatrutida'));
    list.forEach(ev => { if (!ev.med) ev.med = fallback; });
    return list;
  }

  // Segmentos (protocolos) = dosis consecutivas del mismo fármaco
  function getProtocolSegments() {
    const hist = getInjectionHistory();
    const segments = [];
    hist.forEach(ev => {
      let seg = segments[segments.length - 1];
      if (!seg || seg.key !== ev.med.key) {
        seg = {
          key: ev.med.key, label: ev.med.label, color: ev.med.color,
          halfLife: ev.med.halfLife, startDate: ev.date, endDate: ev.date, doses: []
        };
        segments.push(seg);
      }
      seg.endDate = ev.date;
      seg.doses.push(ev);
    });

    // El color elegido a mano para el fármaco vigente manda sobre el del catálogo,
    // salvo que choque con el de otro protocolo: dos curvas nunca pueden ser iguales.
    const profile = JSON.parse(localStorage.getItem('mispep_health_profile') || '{}');
    segments.forEach((s, i) => {
      s.index = i;
      s.isActive = (i === segments.length - 1);
      s.firstTime = s.doses[0].time;
      s.lastTime = s.doses[s.doses.length - 1].time;
    });
    const active = segments[segments.length - 1];
    if (active && profile.medColor) {
      const clash = segments.some(s => s !== active && s.key !== active.key && s.color === profile.medColor);
      if (!clash) segments.forEach(s => { if (s.key === active.key) s.color = profile.medColor; });
    }
    // El color va ligado al FÁRMACO, no a la posición: si se vuelve a un
    // fármaco anterior (A -> B -> A), recupera su color original. Solo se
    // cambia cuando dos fármacos DISTINTOS comparten color en el catálogo.
    const colorByKey = {};
    const usedColors = [];
    segments.forEach(s => {
      if (colorByKey[s.key] !== undefined) { s.color = colorByKey[s.key]; return; }
      let c = s.color;
      if (usedColors.indexOf(c) !== -1) {
        for (let i = 0; i < MED_FALLBACK_PALETTE.length; i++) {
          if (usedColors.indexOf(MED_FALLBACK_PALETTE[i]) === -1) { c = MED_FALLBACK_PALETTE[i]; break; }
        }
      }
      colorByKey[s.key] = c;
      usedColors.push(c);
      s.color = c;
    });
    return segments;
  }

  function getActiveProtocol() {
    const segs = getProtocolSegments();
    return segs.length ? segs[segs.length - 1] : null;
  }

  // Curva de Bateman (1 compartimento) de UN protocolo, con sus propias
  // constantes ka/ke. Los protocolos cerrados no reciben dosis futuras:
  // su curva decae a cero por eliminación.
  function buildBatemanSeries(seg, opts) {
    opts = opts || {};
    const events = seg.doses.map(d => ({ time: d.time, dose: d.dose, date: d.date, isFuture: false }));
    if (seg.isActive && opts.projectUntil && opts.projectDose) {
      const step = opts.projectEvery || (7 * 24 * 3600 * 1000);
      for (let t = opts.projectFrom; t <= opts.projectUntil; t += step) {
        const _pd = new Date(t);
        events.push({ time: t, dose: opts.projectDose, isFuture: true,
          date: `${_pd.getFullYear()}-${String(_pd.getMonth() + 1).padStart(2, '0')}-${String(_pd.getDate()).padStart(2, '0')}` });
      }
    }
    events.sort((a, b) => a.time - b.time);

    const halfLife = seg.halfLife || 6.0;
    const ke = Math.log(2) / halfLife;
    const ka = 1.25;
    const tauPeak = Math.log(ka / ke) / (ka - ke);
    const fNorm = Math.exp(-ke * tauPeak) - Math.exp(-ka * tauPeak);

    function at(t) {
      let total = 0;
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        if (ev.time <= t) {
          const dd = (t - ev.time) / 86400000;
          total += Math.max(0, ev.dose * (Math.exp(-ke * dd) - Math.exp(-ka * dd)) / fNorm);
        }
      }
      return total;
    }
    return { seg, events, ke, ka, fNorm, halfLife, at };
  }

  // Sincroniza el perfil (fármaco activo, dosis, fechas, nº inyecciones) con el
  // historial real. Así cualquier cambio de medicación se refleja sin tocar código.
  function syncProfileWithHistory(profile) {
    let p = profile;
    if (!p) {
      try { p = JSON.parse(localStorage.getItem('mispep_health_profile') || 'null'); } catch (_) { p = null; }
    }
    if (!p || typeof p !== 'object') return p;

    const hist = getInjectionHistory();
    if (!hist.length) return p;
    const last = hist[hist.length - 1];
    const segments = getProtocolSegments();
    const active = segments.length ? segments[segments.length - 1] : null;
    let changed = false;

    // 1. Fármaco vigente = el del último protocolo detectado
    if (active) {
      const cur = medDescriptor(p.activeMed || '');
      if (!p.activeMed || cur.key !== active.key) {
        p.activeMed = active.label;
        changed = true;
      } else if (p.activeMed !== active.label) {
        p.activeMed = active.label;
        changed = true;
      }
    }

    // 2. Dosis vigente = la de la última dosis realmente administrada
    if (last.dose && parseFloat(p.nextDoseMg) !== last.dose) {
      p.nextDoseMg = last.dose;
      changed = true;
    }

    const freq = parseInt(p.freqDays, 10) || 7;
    const freqMs = freq * 24 * 3600 * 1000;

    // 3. Fechas: solo se recalculan si el historial ha cambiado
    if (p.lastInjectionDate !== last.date) {
      p.lastInjectionDate = last.date;
      p.nextInjectionDate = getLocalDateStr(new Date(last.time + freqMs));
      changed = true;
    } else if (p.nextInjectionDate) {
      // Rodar la próxima dosis hacia adelante si se quedó en el pasado
      let nextObj = new Date(p.nextInjectionDate + 'T12:00:00');
      let guard = 0;
      while (!isNaN(nextObj.getTime()) && nextObj.getTime() < Date.now() && guard < 60) {
        nextObj = new Date(nextObj.getTime() + freqMs);
        guard++;
      }
      if (guard > 0) { p.nextInjectionDate = getLocalDateStr(nextObj); changed = true; }
    } else {
      p.nextInjectionDate = getLocalDateStr(new Date(last.time + freqMs));
      changed = true;
    }

    if (parseInt(p.totalInjections, 10) !== hist.length) {
      p.totalInjections = hist.length;
      changed = true;
    }

    // 6. El recordatorio del día de inyección sigue al protocolo vigente
    try {
      const rcRaw = localStorage.getItem('mispep_reminder_config');
      if (rcRaw && active) {
        const rc = JSON.parse(rcRaw);
        const lastD = active.doses[active.doses.length - 1];
        if (rc.med !== active.label || String(rc.dose) !== String(lastD.dose)) {
          rc.med = active.label;
          rc.dose = lastD.dose;
          localStorage.setItem('mispep_reminder_config', JSON.stringify(rc));
        }
        // La hora del recordatorio de inyección se respeta de rc.time o p.injReminderTime.
        // NUNCA sobreescribir con 21:30 (que es la hora de la medicación de tensión diaria).
        let canonTime = rc.time || p.injReminderTime;
        if (!canonTime && p.reminderTime && p.reminderTime !== '21:30') {
          canonTime = p.reminderTime;
        }
        canonTime = normalizeReminderTime(canonTime, '09:00');
        if (rc.time !== canonTime) {
          rc.time = canonTime;
          localStorage.setItem('mispep_reminder_config', JSON.stringify(rc));
        }
      }
    } catch (_) {}

    if (changed) localStorage.setItem('mispep_health_profile', JSON.stringify(p));
    return p;
  }

  window.MisPepProtocols = {
    normalizeMedName: normalizeMedName,
    medDescriptor: medDescriptor,
    getInjectionHistory: getInjectionHistory,
    getProtocolSegments: getProtocolSegments,
    getActiveProtocol: getActiveProtocol,
    buildBatemanSeries: buildBatemanSeries,
    syncProfileWithHistory: syncProfileWithHistory,
    fmtShortDate: fmtShortDate,
    // Necesarios fuera de este bloque: initCalendar (recordatorios) y otros
    // módulos de nivel superior no pueden ver las funciones locales.
    getHealthProfile: getHealthProfile,
    saveProfile: saveProfile
  };

  // Cálculo clínico riguroso de promedio semanal y mejor semana de pérdida de peso
  function calculateWeeklyWeightMetrics(weightLogs) {
    if (!weightLogs || weightLogs.length < 2) {
      return { weeklyAvg: 0.0, bestWeek: 0.0 };
    }
    const sorted = [...weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const t0 = new Date(sorted[0].date + 'T12:00:00').getTime();
    const tn = new Date(sorted[sorted.length - 1].date + 'T12:00:00').getTime();
    const totalDays = Math.round((tn - t0) / (24 * 3600 * 1000));

    if (totalDays <= 0) {
      return { weeklyAvg: 0.0, bestWeek: 0.0 };
    }

    // 1. Pérdida neta acumulada y promedio por semana transcurrida
    const netLost = sorted[0].weight - sorted[sorted.length - 1].weight;
    // Si ha pasado menos de una semana, no sobredimensionar: se divide por mínimo 1 semana
    const weeksElapsed = Math.max(1, totalDays / 7.0);
    const weeklyAvg = Math.max(0, netLost / weeksElapsed);

    // 2. Mejor semana (mayor pérdida lograda en una ventana continua de 7 días)
    function getWeightAt(timeMs) {
      if (timeMs <= t0) return sorted[0].weight;
      if (timeMs >= tn) return sorted[sorted.length - 1].weight;
      for (let i = 0; i < sorted.length - 1; i++) {
        const ta = new Date(sorted[i].date + 'T12:00:00').getTime();
        const tb = new Date(sorted[i + 1].date + 'T12:00:00').getTime();
        if (timeMs >= ta && timeMs <= tb) {
          if (tb === ta) return sorted[i].weight;
          const frac = (timeMs - ta) / (tb - ta);
          return sorted[i].weight + frac * (sorted[i + 1].weight - sorted[i].weight);
        }
      }
      return sorted[sorted.length - 1].weight;
    }

    let bestWeek = 0.0;
    if (totalDays < 7) {
      // Si aún no se completa la primera semana, la mejor semana es el progreso neto logrado hasta la fecha
      bestWeek = Math.max(0, netLost);
    } else {
      const oneDayMs = 24 * 3600 * 1000;
      const sevenDaysMs = 7 * oneDayMs;
      // Evaluar la pérdida en cada ventana deslizante de 7 días exactos
      for (let t = t0 + sevenDaysMs; t <= tn + 1000; t += oneDayMs) {
        const wEnd = getWeightAt(t);
        const wStart = getWeightAt(t - sevenDaysMs);
        const loss = wStart - wEnd;
        if (loss > bestWeek) {
          bestWeek = loss;
        }
      }
      // Considerar también pares discretos de pesajes registrados separados por ~7 días (6 a 8 días)
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const da = new Date(sorted[i].date + 'T12:00:00').getTime();
          const db = new Date(sorted[j].date + 'T12:00:00').getTime();
          const dDays = Math.round((db - da) / oneDayMs);
          if (dDays >= 6 && dDays <= 8) {
            const normalizedLoss = (sorted[i].weight - sorted[j].weight) * (7 / dDays);
            if (normalizedLoss > bestWeek) bestWeek = normalizedLoss;
          }
        }
      }
    }

    return {
      weeklyAvg: Math.round(weeklyAvg * 10) / 10,
      bestWeek: Math.round(bestWeek * 10) / 10
    };
  }

  function renderDashboard() {
    window.renderDashboard = renderDashboard;
    const p = getHealthProfile();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 1. Días en camino — TOTAL del tratamiento completo, no solo del fármaco vigente.
    //    Se toma la primera dosis de TODO el historial (cualquier medicamento) y,
    //    si existe, una fecha de inicio guardada anterior.
    let firstDoseMs = null;
    try {
      const histAll = (window.MisPepProtocols && window.MisPepProtocols.getInjectionHistory)
        ? window.MisPepProtocols.getInjectionHistory()
        : (typeof getInjectionHistory === 'function' ? getInjectionHistory() : []);
      if (histAll && histAll.length) firstDoseMs = histAll[0].time;
    } catch (_) {}
    if (p.startDate) {
      const sd = new Date(String(p.startDate).split('T')[0] + 'T12:00:00');
      if (!isNaN(sd.getTime()) && (firstDoseMs === null || sd.getTime() < firstDoseMs)) {
        firstDoseMs = sd.getTime();
      }
    }
    const DAY_MS = 24 * 3600 * 1000;
    let elapsedDays = 0;
    if (firstDoseMs !== null) {
      const startMid = new Date(firstDoseMs);
      startMid.setHours(0, 0, 0, 0);
      elapsedDays = Math.max(0, Math.round((now.getTime() - startMid.getTime()) / DAY_MS));
      // El día de la primera dosis cuenta como día 1 de tratamiento
      if (elapsedDays === 0) elapsedDays = 1;
    }

    // Días del fármaco vigente (desglose), para no confundirlo con el total
    let activeDays = null;
    let activeLabel = '';
    try {
      const activeSeg = (window.MisPepProtocols && window.MisPepProtocols.getActiveProtocol)
        ? window.MisPepProtocols.getActiveProtocol() : null;
      if (activeSeg && activeSeg.startDate) {
        const asd = new Date(activeSeg.startDate + 'T12:00:00');
        if (!isNaN(asd.getTime())) {
          activeDays = Math.max(1, Math.round((now.getTime() - asd.getTime()) / DAY_MS));
          activeLabel = activeSeg.label || '';
        }
      }
    } catch (_) {}

    const isEn = window.MISPEP_I18N && window.MISPEP_I18N.getLang() === 'en';
    if (dashDaysCount) dashDaysCount.textContent = elapsedDays > 0 ? (isEn ? `${elapsedDays} days` : `${elapsedDays} días`) : (isEn ? '0 days' : '0 días');
    if (dashLblOnTrack) dashLblOnTrack.textContent = isEn ? 'on treatment' : 'en tratamiento';
    const dashMedDaysSubEl = document.getElementById('dashMedDaysSub');
    if (dashMedDaysSubEl) {
      let segsCount = 1;
      try {
        const segsAll = (window.MisPepProtocols && window.MisPepProtocols.getProtocolSegments)
          ? window.MisPepProtocols.getProtocolSegments() : [];
        if (segsAll && segsAll.length) segsCount = segsAll.length;
      } catch (_) {}
      if (!activeLabel) {
        dashMedDaysSubEl.textContent = '';
      } else if (segsCount > 1 && activeDays !== null) {
        // Solo mostramos el desglose cuando hay más de un fármaco en el historial
        dashMedDaysSubEl.textContent = `${activeLabel} · ${activeDays} ${isEn ? 'd' : 'd'}`;
      } else {
        dashMedDaysSubEl.textContent = activeLabel;
      }
    }
    if (dashBannerText) {
      if (elapsedDays > 0) {
        dashBannerText.textContent = isEn ? `${elapsedDays} days on track with your treatment!` : `¡${elapsedDays} días en camino con tu tratamiento!`;
      } else {
        dashBannerText.textContent = isEn ? 'Welcome to MisPep! Configure your treatment.' : '¡Bienvenido a MisPep! Configura tu tratamiento.';
      }
    }

    // 2. Inyecciones totales
    if (dashTotalInjections) dashTotalInjections.textContent = p.totalInjections || 0;
    if (dashTotalInjAllTime) dashTotalInjAllTime.textContent = p.totalInjections || 0;

    // 3. Próxima Inyección
    const nextInjCard = document.querySelector('.next-inj-card');
    const medDesc = p.activeMed ? medDescriptor(p.activeMed) : null;
    const medColor = p.medColor || (medDesc ? medDesc.color : '#3b82f6');
    if (nextInjCard) {
      nextInjCard.style.display = p.medActive === false ? 'none' : 'block';
      nextInjCard.style.borderColor = `${medColor}55`;
    }

    if (dashMedName) {
      dashMedName.textContent = (p.activeMed || (isEn ? 'NO TREATMENT' : 'SIN TRATAMIENTO')).toUpperCase();
      dashMedName.style.color = medColor;
    }

    // 3. Próxima Inyección (Cálculo Dinámico Estricto basado en la última dosis administrada)
    const calEntries = JSON.parse(localStorage.getItem('mispep_calendar_entries') || '[]');
    const realInjs = calEntries.filter(e => e.type === 'inj' && !e.skipped);
    const freq = parseInt(p.freqDays, 10) || 7;
    let nextDateObj = null;

    if (realInjs.length > 0) {
      // Ordenar cronológicamente descendente
      realInjs.sort((a, b) => new Date(b.date + 'T12:00:00') - new Date(a.date + 'T12:00:00'));
      const lastInjDateStr = realInjs[0].date;
      const lastInjObj = new Date(lastInjDateStr + 'T12:00:00');
      nextDateObj = new Date(lastInjObj.getTime() + (freq * 24 * 3600 * 1000));
      p.nextInjectionDate = getLocalDateStr(nextDateObj);
      p.lastInjectionDate = lastInjDateStr;
      localStorage.setItem('mispep_health_profile', JSON.stringify(p));
    } else if (p.nextInjectionDate) {
      nextDateObj = new Date(p.nextInjectionDate + 'T12:00:00');
    }

    if (nextDateObj && !isNaN(nextDateObj.getTime())) {
      nextDateObj.setHours(12, 0, 0, 0);
      const todayNoon = new Date();
      todayNoon.setHours(12, 0, 0, 0);
      const diffDays = Math.round((nextDateObj.getTime() - todayNoon.getTime()) / (24 * 3600 * 1000));
      const daysLeft = Math.max(0, diffDays);

      if (dashDaysLeft) dashDaysLeft.textContent = daysLeft;

      const weekdayName = nextDateObj.toLocaleDateString(isEn ? 'en-US' : 'es-ES', { weekday: 'long' });
      const capitalizedDay = weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1);
      if (dashNextDoseText) {
        dashNextDoseText.textContent = `${capitalizedDay} · ${fmtNum(p.nextDoseMg || 2.0, 1)} mg`;
        dashNextDoseText.style.color = medColor;
      }
    } else {
      if (dashDaysLeft) dashDaysLeft.textContent = '--';
      if (dashNextDoseText) {
        dashNextDoseText.textContent = isEn ? 'No scheduled dose' : 'Sin dosis programada';
        dashNextDoseText.style.color = 'var(--text-muted)';
      }
    }

    // 4. Datos de Salud (Peso, Cambio, IMC)
    let logs = p.weightLogs || [];
    let curW = p.currentWeight !== null && p.currentWeight !== undefined ? parseFloat(p.currentWeight) : NaN;
    let startW = p.startWeight !== null && p.startWeight !== undefined ? parseFloat(p.startWeight) : NaN;

    if (logs.length > 0) {
      const sortedWLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
      startW = sortedWLogs[0].weight;
      curW = sortedWLogs[sortedWLogs.length - 1].weight;
    }

    const heightM = p.heightCm ? (parseFloat(p.heightCm) / 100) : null;

    const LBS_PER_KG = 2.20462262;
    const toDisplayW = (kg) => isEn ? (kg * LBS_PER_KG) : kg;
    const wUnit = isEn ? 'lb' : 'kg';

    const curWDisplay = (!isNaN(curW) && curW > 0) ? toDisplayW(curW) : NaN;
    const deltaTotal = curW - startW;
    const deltaTotalDisplay = toDisplayW(deltaTotal);

    if (dashCurrentWeight) {
      dashCurrentWeight.textContent = (!isNaN(curWDisplay) && curWDisplay > 0) ? fmtNum(curWDisplay, 1) : '--';
    }

    const dashWeightUnitTag = document.getElementById('dashWeightUnitTag') || document.querySelector('.health-card-mint .health-card-tag');
    if (dashWeightUnitTag) {
      dashWeightUnitTag.textContent = wUnit;
    }

    if (dashTotalChange) {
      if (Math.abs(deltaTotal) < 0.05) {
        dashTotalChange.textContent = '➔ 0.0';
        if (dashTotalChangeTag) {
          dashTotalChangeTag.textContent = isEn ? 'gained' : 'ganado';
          dashTotalChangeTag.style.background = 'rgba(59,130,246,0.15)';
          dashTotalChangeTag.style.color = '#3b82f6';
        }
      } else if (deltaTotal < 0) {
        dashTotalChange.textContent = `▼ ${fmtNum(Math.abs(deltaTotalDisplay), 1)}`;
        if (dashTotalChangeTag) {
          dashTotalChangeTag.textContent = isEn ? 'lost' : 'perdido';
          dashTotalChangeTag.style.background = 'rgba(16,185,129,0.2)';
          dashTotalChangeTag.style.color = '#10b981';
        }
      } else {
        dashTotalChange.textContent = `▲ ${fmtNum(deltaTotalDisplay, 1)}`;
        if (dashTotalChangeTag) {
          dashTotalChangeTag.textContent = isEn ? 'gained' : 'ganado';
          dashTotalChangeTag.style.background = 'rgba(239,68,68,0.2)';
          dashTotalChangeTag.style.color = '#ef4444';
        }
      }
    }

    // Porcentaje perdido/ganado respecto al peso inicial (debajo del cambio total)
    if (dashTotalChangePct) {
      const pctTotal = startW > 0 ? (deltaTotal / startW) * 100 : 0;
      const initialText = isEn ? 'of starting weight' : 'del peso inicial';
      if (startW <= 0 || Math.abs(deltaTotal) < 0.05) {
        dashTotalChangePct.textContent = `0.0% ${initialText}`;
        dashTotalChangePct.style.color = '';
      } else if (pctTotal < 0) {
        dashTotalChangePct.textContent = '-' + fmtNum(Math.abs(pctTotal), 1) + `% ${initialText}`;
        dashTotalChangePct.style.color = '#10b981';
      } else {
        dashTotalChangePct.textContent = '+' + fmtNum(pctTotal, 1) + `% ${initialText}`;
        dashTotalChangePct.style.color = '#ef4444';
      }
    }

    // Cálculo IMC = peso / altura^2 (el IMC médico estándar siempre se calcula en kg/m²)
    const bmi = curW / (heightM * heightM);
    if (dashCurrentBmi) dashCurrentBmi.textContent = fmtNum(bmi, 1);

    let catText = isEn ? 'Normal weight' : 'Peso normal';
    let catColor = '#10b981';
    let targetNote = '';

    // Umbral de sobrepeso = 29.99
    const targetOverweightKg = 29.9 * (heightM * heightM);
    const kgToOverweight = curW - targetOverweightKg;

    // Umbral de peso normal = 24.99
    const targetNormalKg = 24.9 * (heightM * heightM);
    const kgToNormal = curW - targetNormalKg;

    const toNormalDisplay = toDisplayW(kgToNormal);
    const toOverweightDisplay = toDisplayW(kgToOverweight);

    if (bmi < 18.5) {
      catText = isEn ? 'Underweight' : 'Bajo peso';
      catColor = '#3b82f6';
      targetNote = isEn ? 'Below recommended weight' : 'Por debajo del peso recomendado';
    } else if (bmi < 25) {
      catText = isEn ? 'Normal weight' : 'Peso normal';
      catColor = '#10b981';
      targetNote = isEn ? 'In healthy weight range!' : '¡En rango de peso saludable!';
    } else if (bmi < 30) {
      catText = isEn ? 'Overweight' : 'Sobrepeso';
      catColor = '#f59e0b';
      targetNote = isEn ? `Lose ${fmtNum(toNormalDisplay, 1)} ${wUnit} for normal weight` : `Pierde ${fmtNum(kgToNormal, 1)} kg para peso normal`;
    } else if (bmi < 35) {
      catText = isEn ? 'Obesity class I' : 'Obesidad clase I';
      catColor = '#f59e0b';
      targetNote = isEn ? `Lose ${fmtNum(toOverweightDisplay, 1)} ${wUnit} to reach Overweight` : `Pierde ${fmtNum(kgToOverweight, 1)} kg para llegar a Sobrepeso`;
    } else if (bmi < 40) {
      catText = isEn ? 'Obesity class II' : 'Obesidad clase II';
      catColor = '#ef4444';
      targetNote = isEn ? `Lose ${fmtNum(toOverweightDisplay, 1)} ${wUnit} to reach Overweight` : `Pierde ${fmtNum(kgToOverweight, 1)} kg para llegar a Sobrepeso`;
    } else {
      catText = isEn ? 'Obesity class III' : 'Obesidad clase III';
      catColor = '#ef4444';
      targetNote = isEn ? `Lose ${fmtNum(toOverweightDisplay, 1)} ${wUnit} to reach Overweight` : `Pierde ${fmtNum(kgToOverweight, 1)} kg para llegar a Sobrepeso`;
    }

    if (dashBmiCategory) {
      dashBmiCategory.textContent = catText;
      dashBmiCategory.style.color = catColor;
      dashBmiCategory.style.background = `${catColor}25`;
    }
    if (dashBmiTargetNote) dashBmiTargetNote.textContent = targetNote;

    // Métricas semanales (calculadas con rigor clínico sobre fechas y ventanas de 7 días)
    const weightMetrics = calculateWeeklyWeightMetrics(logs);
    if (dashWeeklyAvg) dashWeeklyAvg.textContent = `${fmtNum(toDisplayW(weightMetrics.weeklyAvg), 1)} ${wUnit}${isEn ? '/wk' : ''}`;
    if (dashBestWeek) dashBestWeek.textContent = `${fmtNum(toDisplayW(weightMetrics.bestWeek), 1)} ${wUnit}`;

    // Renderizar componentes clínicos estilo Bench v2.3
    renderBenchDashboard();

    // Renderizar la gráfica de evolución del peso
    renderWeightGraph();

    // Renderizar la gráfica de evolución de la presión arterial
    renderBpGraph();

    // Programar automáticamente la alarma de recordatorio a las 9:00 AM para la próxima inyección
    scheduleNextDoseAlarmAt9AM();
  }

  // ============================================================
  // COMPONENTES CLÍNICOS AVANZADOS (ESTILO BENCH v2.3)
  // ============================================================
  function renderBenchDashboard() {
    const p = getHealthProfile();
    const segments = getProtocolSegments();
    const activeSeg = segments.length ? segments[segments.length - 1] : null;
    const activeMed = activeSeg ? activeSeg.label : (p.activeMed || 'Retatrutida');
    const activeColor = activeSeg ? activeSeg.color : medDescriptor(activeMed).color;
    const halfLife = activeSeg ? activeSeg.halfLife : 6.0;
    const lastDoseOfActive = activeSeg ? activeSeg.doses[activeSeg.doses.length - 1] : null;
    const activeDose = parseFloat(p.nextDoseMg) || (lastDoseOfActive ? lastDoseOfActive.dose : 1.5) || 1.5;

    const compLabel = document.getElementById('benchCurCompName');
    if (compLabel) { compLabel.textContent = activeMed; compLabel.style.color = activeColor; }

    // --- Ventana temporal y proyección del protocolo vigente ---
    const now = new Date();
    const nowTime = now.getTime();
    const freqMs = (parseInt(p.freqDays, 10) || 7) * 24 * 3600 * 1000;
    const nextInjTime = p.nextInjectionDate ? new Date(p.nextInjectionDate + 'T12:00:00').getTime() : (nowTime + freqMs);
    const hist = getInjectionHistory();
    const firstTime = hist.length ? hist[0].time : (nowTime - 10 * 24 * 3600 * 1000);
    const startTime = Math.min(firstTime - (24 * 3600 * 1000), nowTime - (10 * 24 * 3600 * 1000));
    const endTime = Math.max(nextInjTime + (6 * 24 * 3600 * 1000), nowTime + (7 * 24 * 3600 * 1000));
    const totalDur = endTime - startTime;

    // Una curva de Bateman por protocolo. Los protocolos cerrados decaen a cero
    // (ya no reciben dosis) y el vigente proyecta sus dosis futuras. Todo se
    // dibuja superpuesto, con un color distinto por fármaco.
    const series = segments.map(seg => buildBatemanSeries(seg, {
      projectFrom: nextInjTime,
      projectUntil: endTime,
      projectEvery: freqMs,
      projectDose: activeDose
    }));
    const totalAt = (t) => series.reduce((acc, sr) => acc + sr.at(t), 0);

    const benchSvg = document.getElementById('benchCirculatingSvg');
    if (benchSvg) {
      const width = 360;
      const height = 175;
      const padL = 26;
      const padR = 24;
      const padT = 26;
      const padB = 36;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;

      function getX(t) {
        return padL + ((t - startTime) / totalDur) * plotW;
      }

      const samples = 180;
      const totalPts = [];
      let maxVal = 2.0;
      for (let i = 0; i <= samples; i++) {
        const t = startTime + (i / samples) * totalDur;
        const v = totalAt(t);
        if (v > maxVal) maxVal = v;
        totalPts.push({ time: t, val: v });
      }
      maxVal = Math.max(maxVal * 1.15, 2.0);

      function getY(v) {
        return padT + plotH - ((v / maxVal) * plotH);
      }

      let curvesHtml = '';

      series.forEach(sr => {
        const col = sr.seg.color;
        let dPast = '';
        let dFut = '';
        for (let i = 0; i <= samples; i++) {
          const t = startTime + (i / samples) * totalDur;
          const pt = `${getX(t).toFixed(1)} ${getY(sr.at(t)).toFixed(1)} `;
          if (t <= nowTime) dPast += (dPast ? 'L ' : 'M ') + pt;
          else dFut += (dFut ? 'L ' : 'M ') + pt;
        }
        curvesHtml += `<path d="${dPast}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />`;
        if (dFut) {
          curvesHtml += `<path d="${dFut}" fill="none" stroke="${col}" stroke-width="2.2" stroke-dasharray="4,3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />`;
        }
      });

      // Recolectar todos los eventos de administración para posicionar etiquetas sin solapamiento
      const allEvents = [];
      series.forEach(sr => {
        sr.events.forEach((ev, idx) => {
          if (ev.time < startTime || ev.time > endTime) return;
          const prevEv = idx > 0 ? sr.events[idx - 1] : null;
          const isMedChange = (idx === 0) && sr.seg.index > 0;
          const isDoseChange = prevEv && Math.abs(ev.dose - prevEv.dose) > 0.05;
          allEvents.push({
            time: ev.time,
            x: getX(ev.time),
            dose: ev.dose,
            isFuture: !!ev.isFuture,
            isMedChange,
            isDoseChange,
            seg: sr.seg,
            col: sr.seg.color
          });
        });
      });
      allEvents.sort((a, b) => a.time - b.time);

      // 1. Badges Superiores con detector de colisión (dos pisos / tiers)
      let upperBadgesHtml = '';
      const upperBadges = [];
      allEvents.forEach(ev => {
        if (ev.isFuture) return;
        if (ev.isMedChange) {
          upperBadges.push({ x: ev.x, w: 66, type: 'med', col: ev.col, label: `⇄ ${ev.seg.label.slice(0, 11)}` });
        } else if (ev.isDoseChange) {
          upperBadges.push({ x: ev.x, w: 54, type: 'dose', col: '#f59e0b', label: `▲ ${fmtNum(ev.dose, 1)} mg` });
        }
      });

      let lastTierX = [-999, -999];
      upperBadges.forEach(b => {
        let tier = 0;
        // Si choca con el badge anterior del piso 0, baja al piso 1
        if (Math.abs(b.x - lastTierX[0]) < 60) {
          tier = 1;
        }
        lastTierX[tier] = b.x;
        const bY = padT - 6 + (tier * 16);
        const halfW = b.w / 2;
        upperBadgesHtml += `
          <g>
            <rect x="${(b.x - halfW).toFixed(1)}" y="${bY.toFixed(1)}" width="${b.w}" height="14" rx="4" fill="${b.col}" stroke="rgba(0,0,0,0.3)" stroke-width="0.8" />
            <text x="${b.x.toFixed(1)}" y="${(bY + 10.5).toFixed(1)}" font-size="7.5" font-weight="900" fill="#000000" text-anchor="middle">${b.label}</text>
          </g>
        `;
      });

      // 2. Triángulos y Etiquetas de Dosis Inferiores (con anticolisión entre dosis consecutivas)
      let trianglesHtml = '';
      const ty = padT + plotH;
      let lastDoseX = -999;
      let lastDoseTier = 0;

      allEvents.forEach(ev => {
        let tier = 0;
        if (Math.abs(ev.x - lastDoseX) < 28) {
          tier = (lastDoseTier === 0) ? 1 : 0;
        }
        lastDoseX = ev.x;
        lastDoseTier = tier;
        const doseTextY = ty - 10 - (tier * 10);

        if (ev.isFuture) {
          trianglesHtml += `
            <polygon points="${ev.x.toFixed(1)},${(ty - 7).toFixed(1)} ${(ev.x - 4.5).toFixed(1)},${ty.toFixed(1)} ${(ev.x + 4.5).toFixed(1)},${ty.toFixed(1)}" fill="none" stroke="${ev.col}" stroke-width="1.6" stroke-dasharray="2,2" />
            <text x="${ev.x.toFixed(1)}" y="${doseTextY.toFixed(1)}" font-size="7.5" font-weight="900" fill="${ev.col}" text-anchor="middle" opacity="0.85">${fmtNum(ev.dose, 1)}mg</text>
          `;
        } else {
          trianglesHtml += `
            <polygon points="${ev.x.toFixed(1)},${(ty - 7).toFixed(1)} ${(ev.x - 4.5).toFixed(1)},${ty.toFixed(1)} ${(ev.x + 4.5).toFixed(1)},${ty.toFixed(1)}" fill="${ev.isDoseChange ? '#f59e0b' : ev.col}" />
            <text x="${ev.x.toFixed(1)}" y="${doseTextY.toFixed(1)}" font-size="8" font-weight="900" fill="${ev.isDoseChange ? '#f59e0b' : ev.col}" text-anchor="middle">${fmtNum(ev.dose, 1)}mg</text>
          `;
        }
      });

      // Trazo discontinuo del total acumulado (suma de todos los protocolos)
      let dTotal = '';
      totalPts.forEach((pt, idx) => {
        dTotal += `${idx === 0 ? 'M' : 'L'} ${getX(pt.time).toFixed(1)} ${getY(pt.val).toFixed(1)} `;
      });

      let dArea = `M ${getX(totalPts[0].time).toFixed(1)},${getY(0).toFixed(1)} `;
      totalPts.forEach(pt => {
        dArea += `L ${getX(pt.time).toFixed(1)} ${getY(pt.val).toFixed(1)} `;
      });
      dArea += `L ${getX(totalPts[totalPts.length - 1].time).toFixed(1)},${getY(0).toFixed(1)} Z`;

      // 3. EJE DE FECHAS EN DOS NIVELES (Días arriba, Mes centrado abajo)
      let axisHtml = '';

      // Fila 1: Ticks y número del día (cada 5 días)
      let curTickDate = new Date(startTime);
      curTickDate.setHours(12, 0, 0, 0);
      curTickDate.setDate(curTickDate.getDate() + 1);

      while (curTickDate.getTime() <= endTime) {
        const tx = getX(curTickDate.getTime());
        const dayNum = curTickDate.getDate();
        axisHtml += `
          <line x1="${tx.toFixed(1)}" y1="${(padT + plotH).toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(padT + plotH + 4).toFixed(1)}" stroke="var(--border-color)" stroke-width="1" />
          <text x="${tx.toFixed(1)}" y="${(padT + plotH + 13).toFixed(1)}" font-size="8" font-weight="700" fill="var(--text-muted)" text-anchor="middle">${dayNum}</text>
        `;
        curTickDate.setDate(curTickDate.getDate() + 5);
      }

      // Fila 2: Meses centrados debajo de sus días y líneas divisorias
      const dStart = new Date(startTime);
      let curMonth = new Date(dStart.getFullYear(), dStart.getMonth(), 1, 0, 0, 0);

      while (curMonth.getTime() <= endTime) {
        const nextMonth = new Date(curMonth.getFullYear(), curMonth.getMonth() + 1, 1, 0, 0, 0);
        const visibleStart = Math.max(startTime, curMonth.getTime());
        const visibleEnd = Math.min(endTime, nextMonth.getTime() - 1000);
        const visibleDays = (visibleEnd - visibleStart) / (24 * 3600 * 1000);

        if (visibleDays >= 4) {
          const x1 = getX(visibleStart);
          const x2 = getX(visibleEnd);
          const xCenter = (x1 + x2) / 2;
          const mName = curMonth.toLocaleDateString('es-ES', { month: 'long' });
          const mCapitalized = mName.charAt(0).toUpperCase() + mName.slice(1);

          axisHtml += `
            <text x="${xCenter.toFixed(1)}" y="${(padT + plotH + 26).toFixed(1)}" font-size="8.5" font-weight="800" fill="#cbd5e1" text-anchor="middle" letter-spacing="0.3">${mCapitalized}</text>
          `;
        }

        // Línea divisoria tenue entre meses si cae dentro del gráfico
        if (curMonth.getTime() > startTime && curMonth.getTime() < endTime) {
          const sepX = getX(curMonth.getTime());
          axisHtml += `
            <line x1="${sepX.toFixed(1)}" y1="${(padT + plotH).toFixed(1)}" x2="${sepX.toFixed(1)}" y2="${(padT + plotH + 28).toFixed(1)}" stroke="rgba(255,255,255,0.14)" stroke-width="1" stroke-dasharray="2,2" />
          `;
        }

        curMonth = nextMonth;
      }

      function renderScrubBadges(currX, currTime) {
        const activeSeries = series.map(sr => ({
          label: sr.seg.label,
          val: sr.at(currTime),
          color: sr.seg.color
        })).filter(s => s.val >= 0.02);

        if (activeSeries.length === 0 && series.length > 0) {
          const lastSr = series[series.length - 1];
          activeSeries.push({
            label: lastSr.seg.label,
            val: lastSr.at(currTime),
            color: lastSr.seg.color
          });
        }

        if (activeSeries.length === 1) {
          const s = activeSeries[0];
          const badgeW = 54;
          const badgeX = Math.max(padL + badgeW / 2, Math.min(width - padR - badgeW / 2, currX));
          return `
            <g transform="translate(${badgeX.toFixed(1)}, 3)">
              <rect x="${(-badgeW / 2).toFixed(1)}" y="0" width="${badgeW}" height="15" rx="4" fill="${s.color}" stroke="#ffffff" stroke-width="1.2" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.6))" />
              <text x="0" y="11" font-size="8.5" font-weight="900" fill="#ffffff" text-anchor="middle" style="paint-order:stroke fill; stroke:rgba(0,0,0,0.5); stroke-width:1.8px;">${fmtNum(s.val, 2)} mg</text>
            </g>
          `;
        }

        if (activeSeries.length >= 2) {
          const sLeft = activeSeries[0];
          const sRight = activeSeries[1];
          const badgeW = 50;
          let leftX = currX - 3;
          let rightX = currX + 3;

          if (leftX - badgeW < padL) {
            const shift = padL - (leftX - badgeW);
            leftX += shift;
            rightX += shift;
          } else if (rightX + badgeW > width - padR) {
            const shift = (rightX + badgeW) - (width - padR);
            leftX -= shift;
            rightX -= shift;
          }

          return `
            <!-- Etiqueta izquierda con color y dosis de ${sLeft.label} -->
            <g transform="translate(${leftX.toFixed(1)}, 3)">
              <rect x="${-badgeW}" y="0" width="${badgeW}" height="15" rx="4" fill="${sLeft.color}" stroke="#ffffff" stroke-width="1.2" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.6))" />
              <text x="${(-badgeW / 2).toFixed(1)}" y="11" font-size="8.5" font-weight="900" fill="#ffffff" text-anchor="middle" style="paint-order:stroke fill; stroke:rgba(0,0,0,0.5); stroke-width:1.8px;">${fmtNum(sLeft.val, 2)} mg</text>
            </g>
            <!-- Etiqueta derecha con color y dosis de ${sRight.label} -->
            <g transform="translate(${rightX.toFixed(1)}, 3)">
              <rect x="0" y="0" width="${badgeW}" height="15" rx="4" fill="${sRight.color}" stroke="#ffffff" stroke-width="1.2" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.6))" />
              <text x="${(badgeW / 2).toFixed(1)}" y="11" font-size="8.5" font-weight="900" fill="#ffffff" text-anchor="middle" style="paint-order:stroke fill; stroke:rgba(0,0,0,0.5); stroke-width:1.8px;">${fmtNum(sRight.val, 2)} mg</text>
            </g>
          `;
        }
        return '';
      }

      benchSvg.innerHTML = `
        <defs>
          <linearGradient id="benchCurveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#94a3b8" stop-opacity="0.18" />
            <stop offset="100%" stop-color="#94a3b8" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Eje base horizontal -->
        <line x1="${padL}" y1="${padT + plotH}" x2="${width - padR}" y2="${padT + plotH}" stroke="var(--border-color)" stroke-width="1" />

        <!-- Eje X de dos niveles: días y meses centrados -->
        ${axisHtml}

        <!-- Área del total acumulado -->
        <path d="${dArea}" fill="url(#benchCurveGrad)" />

        <!-- Total acumulado (suma de protocolos) -->
        <path d="${dTotal}" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="2,3" opacity="0.35" />

        <!-- Curvas por protocolo, superpuestas y con color propio -->
        ${curvesHtml}

        <!-- Triángulos de dosis inferiores -->
        ${trianglesHtml}

        <!-- Badges superiores de cambio de dosis y fármaco (escalonados) -->
        ${upperBadgesHtml}

        <!-- Línea interactiva vertical del Scrubber más alta -->
        <line id="benchScrubLine" x1="${getX(nowTime).toFixed(1)}" y1="3" x2="${getX(nowTime).toFixed(1)}" y2="${(padT + plotH).toFixed(1)}" stroke="#ffffff" stroke-width="1.6" opacity="0.85" />
        <circle id="benchScrubNode" cx="${getX(nowTime).toFixed(1)}" cy="${getY(totalAt(nowTime)).toFixed(1)}" r="4.5" fill="${activeColor}" stroke="#ffffff" stroke-width="1.8" />
        
        <!-- Etiquetas superiores de dosis en la línea vertical -->
        <g id="benchScrubBadges">
          ${renderScrubBadges(getX(nowTime), nowTime)}
        </g>
      `;

      // Leyenda de protocolos superpuestos
      const benchLegend = document.getElementById('benchProtocolLegend');
      if (benchLegend) {
        benchLegend.innerHTML = series.map(sr =>
          `<span style="display:inline-flex; align-items:center; gap:5px; font-size:0.66rem; font-weight:800; color:var(--text-muted); margin-right:10px;">
             <span style="width:10px; height:10px; border-radius:50%; background:${sr.seg.color}; box-shadow:0 0 6px ${sr.seg.color};"></span>
             ${sr.seg.label}${sr.seg.isActive ? ' (vigente)' : ''}
           </span>`
        ).join('');
      }

      // Interacción táctil en la curva
      const wrap = document.getElementById('benchCirculatingSvgWrap');
      const scrubInfoText = document.getElementById('benchScrubberText');
      const scrubInfoVal = document.getElementById('benchScrubberVal');
      if (scrubInfoVal) scrubInfoVal.style.color = activeColor;

      function updateScrub(clientX) {
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const svgX = (offsetX / rect.width) * width;
        const boundedX = Math.max(padL, Math.min(width - padR, svgX));
        const scrubTime = startTime + ((boundedX - padL) / plotW) * totalDur;
        const scrubVal = totalAt(scrubTime);

        const sLine = document.getElementById('benchScrubLine');
        const sNode = document.getElementById('benchScrubNode');
        const sBadges = document.getElementById('benchScrubBadges');
        if (sLine) {
          sLine.setAttribute('x1', boundedX.toFixed(1));
          sLine.setAttribute('x2', boundedX.toFixed(1));
          sLine.setAttribute('y1', '3');
          sLine.setAttribute('y2', (padT + plotH).toFixed(1));
        }
        if (sNode) {
          sNode.setAttribute('cx', boundedX.toFixed(1));
          sNode.setAttribute('cy', getY(scrubVal).toFixed(1));
        }
        if (sBadges) {
          sBadges.innerHTML = renderScrubBadges(boundedX, scrubTime);
        }

        const dateObj = new Date(scrubTime);
        const dayStr = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        const hourStr = dateObj.toTimeString().slice(0, 5);
        const isFuture = scrubTime > nowTime;
        const statusTag = isFuture ? '🔮 [Previsión]' : '📊 [Historial]';

        const injAtDay = hist.find(ev => Math.abs(ev.time - scrubTime) < 14 * 3600 * 1000);
        const injSuffix = injAtDay ? ` · 💉 ${injAtDay.med.label}: ${fmtNum(injAtDay.dose, 1)} mg` : '';

        // Desglose por fármaco cuando hay más de un protocolo circulando
        const parts = series
          .map(sr => ({ label: sr.seg.label, v: sr.at(scrubTime) }))
          .filter(x => x.v >= 0.05);
        const breakdown = parts.length > 1
          ? ' · ' + parts.map(x => `${x.label} ${x.v.toFixed(2)} mg`).join(' · ')
          : '';

        if (scrubVal < 0.05) {
          if (scrubInfoText) scrubInfoText.textContent = `${dayStr}, ${hourStr} · ${statusTag} Nada circulando${injSuffix}`;
          if (scrubInfoVal) scrubInfoVal.textContent = '0.00 mg';
        } else {
          if (scrubInfoText) scrubInfoText.textContent = `${dayStr}, ${hourStr} · ${statusTag} Nivel total${injSuffix}${breakdown}`;
          if (scrubInfoVal) scrubInfoVal.textContent = `${fmtNum(scrubVal, 2)} mg`;
        }
      }

      if (wrap) {
        wrap.addEventListener('touchmove', (e) => {
          if (e.touches && e.touches[0]) updateScrub(e.touches[0].clientX);
        }, { passive: true });
        wrap.addEventListener('touchstart', (e) => {
          if (e.touches && e.touches[0]) updateScrub(e.touches[0].clientX);
        }, { passive: true });
        wrap.addEventListener('mousemove', (e) => {
          if (e.buttons === 1 || e.type === 'mousemove') updateScrub(e.clientX);
        });
      }
    }

    // 2. Tarjeta PROTOCOLOS ACTIVOS (protocolo vigente + historial de cambios)
    const activeInj = lastDoseOfActive || (hist.length ? hist[hist.length - 1] : null) ||
      { time: nowTime, dose: activeDose, date: p.lastInjectionDate || '', site: 'Abdomen, superior izquierdo', med: medDescriptor(activeMed) };
    const hoursElapsed = Math.max(0.1, (nowTime - activeInj.time) / (3600 * 1000));
    const curLevel = totalAt(nowTime);
    const singleDosePeak = activeInj.dose || activeDose;
    const peakPct = Math.round((curLevel / singleDosePeak) * 100) || 100;

    const elTitle = document.getElementById('benchActiveMedTitle');
    const elPhaseBadge = document.getElementById('benchPhaseBadge');
    const elNextDays = document.getElementById('benchNextDaysCount');
    const elDoseMarks = document.getElementById('benchDoseMarksText');
    const elGlow = document.getElementById('benchProgressGlow');
    const elPeakPct = document.getElementById('benchPeakPctText');
    const elPeakTrend = document.getElementById('benchPeakTrendText');
    const elElapsedTitle = document.getElementById('benchElapsedTitle');
    const elPhaseDesc = document.getElementById('benchPhaseDesc');
    const elPhaseNextChange = document.getElementById('benchPhaseNextChange');
    const elLastSite = document.getElementById('benchLastDoseSite');
    const elHalfLife = document.getElementById('benchHalfLifeText');
    const elStock = document.getElementById('benchStockCoverageText');

    if (elTitle) {
      elTitle.textContent = activeMed;
      elTitle.style.color = activeColor;
    }

    // Días restantes hasta la próxima inyección
    const daysLeft = Math.max(0, Math.round((nextInjTime - nowTime) / (24 * 3600 * 1000)));
    if (elNextDays) {
      elNextDays.textContent = `${daysLeft} días`;
      elNextDays.style.color = activeColor;
    }

    // Marcas de jeringa (concentración estándar 5 mg/mL -> 2.0 mg = 40 unidades U-100)
    const marksUnits = Math.round((activeInj.dose / 5) * 100) || 40;
    if (elDoseMarks) elDoseMarks.textContent = `${fmtNum(activeInj.dose, 1)} mg · ${marksUnits} marcas (unidades U-100) · ${activeMed}`;

    if (elGlow) {
      elGlow.style.width = `${Math.min(100, Math.max(15, peakPct * 0.75))}%`;
      elGlow.style.background = activeColor;
    }
    if (elPeakPct) elPeakPct.textContent = `${peakPct}% del pico de una sola dosis (${fmtNum(activeInj.dose, 1)} mg)`;

    // Fases fisiológicas desde la última dosis del protocolo vigente
    if (hoursElapsed < 12) {
      if (elPhaseBadge) { elPhaseBadge.textContent = 'Absorbiendo'; elPhaseBadge.style.color = activeColor; elPhaseBadge.style.background = `${activeColor}2e`; }
      if (elPeakTrend) elPeakTrend.textContent = 'Alcanzando el pico';
      if (elElapsedTitle) elElapsedTitle.textContent = `Ahora mismo · ${hoursElapsed.toFixed(1)} h desde tu última dosis (${fmtNum(activeInj.dose, 1)} mg)`;
      if (elPhaseDesc) elPhaseDesc.textContent = 'Absorbiéndose desde el tejido subcutáneo. Apenas se nota aún.';
      const changeIn = Math.max(0.5, 12 - hoursElapsed);
      if (elPhaseNextChange) elPhaseNextChange.textContent = `Esta fase cambia en unas ${changeIn.toFixed(1)} h hacia meseta.`;
    } else if (hoursElapsed < 45) {
      if (elPhaseBadge) { elPhaseBadge.textContent = 'Pico de concentración'; elPhaseBadge.style.color = '#10b981'; elPhaseBadge.style.background = 'rgba(16,185,129,0.18)'; }
      if (elPeakTrend) elPeakTrend.textContent = 'Pico máximo activo';
      if (elElapsedTitle) elElapsedTitle.textContent = `Ahora mismo · ${Math.round(hoursElapsed / 24)} d desde tu última dosis`;
      if (elPhaseDesc) elPhaseDesc.textContent = 'Concentración plasmática máxima. Mayor efecto en saciedad y supresión del apetito.';
      if (elPhaseNextChange) elPhaseNextChange.textContent = 'Comenzará el declive metabólico gradual en ~24 h.';
    } else {
      if (elPhaseBadge) { elPhaseBadge.textContent = 'Eliminación gradual'; elPhaseBadge.style.color = '#f59e0b'; elPhaseBadge.style.background = 'rgba(245,158,11,0.18)'; }
      if (elPeakTrend) elPeakTrend.textContent = 'Descenso progresivo';
      const daysAgo = Math.round(hoursElapsed / 24);
      if (elElapsedTitle) elElapsedTitle.textContent = `Ahora mismo · ${daysAgo} días desde tu última dosis`;
      if (elPhaseDesc) elPhaseDesc.textContent = `Nivel circulante en descenso exponencial estable (vida media de ${halfLife} días).`;
      if (elPhaseNextChange) elPhaseNextChange.textContent = `Próxima inyección recomendada en ${daysLeft} días.`;
    }

    // Metadatos inferiores
    const hoursAgoStr = hoursElapsed < 24 ? `Hace ${hoursElapsed.toFixed(0)}h` : `Hace ${Math.round(hoursElapsed / 24)} días`;
    if (elLastSite) elLastSite.textContent = `${hoursAgoStr} · ${activeInj.site || 'Abdomen, superior izquierdo'}`;
    if (elHalfLife) elHalfLife.textContent = `${halfLife} días`;

    // Stock estimado (de viales o por defecto 98 dosis)
    const vials = JSON.parse(localStorage.getItem('mispep_vials') || '[]');
    let totalDosesLeft = 98;
    if (vials.length > 0) {
      const totalMg = vials.reduce((sum, v) => sum + (parseFloat(v.remainingMg) || parseFloat(v.vialMg) || 0), 0);
      totalDosesLeft = Math.max(1, Math.round(totalMg / activeDose));
    }
    const daysCoverage = (totalDosesLeft * 7).toFixed(1);
    if (elStock) elStock.textContent = `Stock: ${totalDosesLeft} dosis · queda aprox. ${daysCoverage} d`;

    // 3. Línea de tiempo de protocolos (cambio de medicación)
    const tl = document.getElementById('benchProtocolTimeline');
    if (tl) {
      tl.innerHTML = segments.map(seg => {
        const n = seg.doses.length;
        const lastD = seg.doses[n - 1];
        const rango = `${fmtShortDate(seg.startDate)} → ${seg.isActive ? 'en curso' : fmtShortDate(seg.endDate)}`;
        const tag = seg.isActive
          ? `<span style="background:${seg.color}26; color:${seg.color}; padding:2px 8px; border-radius:10px; font-size:0.6rem; font-weight:900;">ACTIVO</span>`
          : `<span style="background:rgba(148,163,184,0.16); color:var(--text-muted); padding:2px 8px; border-radius:10px; font-size:0.6rem; font-weight:900;">CERRADO</span>`;
        return `<div style="display:flex; align-items:center; gap:7px; font-size:0.72rem; color:var(--text-main); flex-wrap:wrap;">
            <span style="width:9px; height:9px; border-radius:50%; background:${seg.color}; box-shadow:0 0 6px ${seg.color};"></span>
            <span style="font-weight:900;">${seg.label}</span>
            <span style="color:var(--text-muted);">${rango} · ${n} dosis · ${fmtNum(lastD.dose, 1)} mg</span>
            ${tag}
          </div>`;
      }).join('');
    }

    // Botón rápido Registrar
    const quickBtn = document.getElementById('benchQuickRegisterBtn');
    if (quickBtn) {
      quickBtn.onclick = () => {
        if (window.openAddDoseModal) window.openAddDoseModal();
      };
    }
  }

  // ============================================================
  // GRÁFICA DE EVOLUCIÓN DEL PESO CORPORAL (ESTILO CAPTURA)
  // ============================================================
  const weightSvgContainer = document.getElementById('weightSvgContainer');
  const wGraphTimeframeBtns = document.querySelectorAll('#wGraphTimeframe .subtab-btn');
  const wGraphDateRangeLabel = document.getElementById('wGraphDateRangeLabel');
  const wGraphPrevRange = document.getElementById('wGraphPrevRange');
  const wGraphNextRange = document.getElementById('wGraphNextRange');
  const wGraphDetailLink = document.getElementById('wGraphDetailLink');

  function getDoseChangeEvents() {
    const history = (window.MisPepProtocols && window.MisPepProtocols.getInjectionHistory)
      ? window.MisPepProtocols.getInjectionHistory()
      : (typeof getInjectionHistory === 'function' ? getInjectionHistory() : []);
    if (!history || history.length === 0) return [];

    const doseChanges = [];
    const lastDoseByMed = {};
    const lastTimeByMed = {};

    history.forEach(ev => {
      if (!ev.dose || !ev.date || isNaN(ev.dose)) return;
      const medKey = (ev.med && ev.med.key) ? ev.med.key : 'default';

      const prevDose = lastDoseByMed[medKey];
      const prevTime = lastTimeByMed[medKey];
      const daysSince = prevTime ? (ev.time - prevTime) / 86400000 : 0;

      const isFirst = (prevDose === undefined);
      const isDiff = (prevDose !== undefined && Math.abs(ev.dose - prevDose) > 0.01);
      const isRestart = (daysSince > 30);

      // Solo se pone etiqueta si es la primera dosis, si hay cambio de dosis, o reinicio tras pausa
      if (isFirst || isDiff || isRestart) {
        let arrow = '';
        if (isDiff) {
          if (ev.dose > prevDose) arrow = ' ↑';
          else if (ev.dose < prevDose) arrow = ' ↓';
        }

        let baseText = '';
        if (ev.dose < 1 && ev.dose > 0) {
          baseText = '.' + String(ev.dose).replace('0.', '') + 'mg';
        } else {
          baseText = (Number.isInteger(ev.dose) ? ev.dose : ev.dose.toFixed(1)) + 'mg';
        }

        doseChanges.push({
          date: ev.date,
          time: ev.time,
          dose: ev.dose,
          prevDose: prevDose,
          dText: baseText + arrow,
          arrow: arrow.trim(),
          med: ev.med || { key: medKey, label: 'Péptido', color: '#10b981' },
          medKey: medKey,
          isFirst: isFirst
        });
        lastDoseByMed[medKey] = ev.dose;
      }
      lastTimeByMed[medKey] = ev.time;
    });
    return doseChanges;
  }

  let currentWRange = '1m';
  let wRangeOffset = 0; // Desplazamiento continuo en DÍAS

  function shiftWeightRange(deltaDays) {
    if (currentWRange === 'all') {
      currentWRange = '1m';
      wGraphTimeframeBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.wrange === '1m');
      });
      wRangeOffset = 0;
    }
    wRangeOffset += deltaDays;
    if (wRangeOffset > 0) wRangeOffset = 0;
    renderWeightGraph();
  }

  wGraphTimeframeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      triggerHaptic(12);
      wGraphTimeframeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentWRange = btn.dataset.wrange;
      wRangeOffset = 0;
      renderWeightGraph();
    });
  });

  if (wGraphPrevRange) {
    wGraphPrevRange.addEventListener('click', () => {
      triggerHaptic(12);
      shiftWeightRange(-1); // Desciende 1 día continuo ambas fechas
    });
  }
  if (wGraphNextRange) {
    wGraphNextRange.addEventListener('click', () => {
      triggerHaptic(12);
      shiftWeightRange(1); // Asciende 1 día continuo ambas fechas
    });
  }

  let wIsSwiping = false;
  // Swipe y arrastre continuo en el gráfico de peso (día a día en tiempo real)
  if (weightSvgContainer) {
    let wTouchStartX = 0, wTouchStartY = 0, wLastDragX = 0;
    const PX_PER_DAY = 26; // Cada 26px de arrastre desplaza 1 día continuo

    weightSvgContainer.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        wTouchStartX = e.touches[0].clientX;
        wTouchStartY = e.touches[0].clientY;
        wLastDragX = wTouchStartX;
        wIsSwiping = false;
      }
    }, { passive: true });

    weightSvgContainer.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length === 1) {
        const curX = e.touches[0].clientX;
        const curY = e.touches[0].clientY;
        const totalDx = curX - wTouchStartX;
        const totalDy = curY - wTouchStartY;

        if (!wIsSwiping && Math.abs(totalDx) > Math.abs(totalDy) && Math.abs(totalDx) > 20) {
          wIsSwiping = true;
        }

        if (wIsSwiping) {
          const dragDx = curX - wLastDragX;
          if (Math.abs(dragDx) >= PX_PER_DAY) {
            const daysStep = Math.trunc(dragDx / PX_PER_DAY);
            // Arrastre a la derecha (dragDx > 0): desciende días (hacia el pasado)
            // Arrastre a la izquierda (dragDx < 0): avanza días (hacia el presente)
            shiftWeightRange(daysStep);
            wLastDragX += daysStep * PX_PER_DAY;
            triggerHaptic(10);
          }
        }
      }
    }, { passive: true });

    weightSvgContainer.addEventListener('touchend', (e) => {
      if (!wIsSwiping && wTouchStartX) {
        const endX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : wTouchStartX;
        const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : wTouchStartY;
        const dist = Math.hypot(endX - wTouchStartX, endY - wTouchStartY);
        if (dist < 25) {
          handleWeightSvgTap(endX);
        }
      }
      wIsSwiping = false;
    }, { passive: true });

    weightSvgContainer.addEventListener('click', (e) => {
      handleWeightSvgTap(e.clientX);
    });
  }

  function handleWeightSvgTap(clientX) {
    if (!weightSvgContainer || !window._currentWeightPoints || window._currentWeightPoints.length === 0) return;
    const rect = weightSvgContainer.getBoundingClientRect();
    const relX = clientX - rect.left;
    const svgW = rect.width || 350;
    const svgX = (relX / svgW) * 350;

    let closestIdx = 0;
    let minDiff = 999999;
    window._currentWeightPoints.forEach((pt, i) => {
      const diff = Math.abs(svgX - pt.x);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });

    const pt = window._currentWeightPoints[closestIdx];
    if (pt) {
      triggerHaptic(14);
      openWeightZoomModal(pt.origIdx);
    }
  }

  if (wGraphDetailLink) {
    wGraphDetailLink.addEventListener('click', () => {
      openWeightModal('records');
    });
  }

  function renderWeightGraph() {
    window.renderWeightGraph = renderWeightGraph;
    if (!weightSvgContainer) return;

    const p = getHealthProfile();
    let logs = p.weightLogs || [];
    if (logs.length === 0) {
      weightSvgContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px;">Sin datos de peso</p>';
      if (wGraphDateRangeLabel) wGraphDateRangeLabel.textContent = '--';
      return;
    }

    logs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const targetGoal = parseFloat(p.targetWeight) || 87.0;

    const fmtShort = (d) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    // Fechas límites de la ventana temporal continua (período fijo de 7, 30 o 365 días)
    const latestDate = new Date(logs[logs.length - 1].date + 'T23:59:59');
    let windowStart, windowEnd;

    if (currentWRange === 'all') {
      windowStart = new Date(logs[0].date + 'T00:00:00');
      windowEnd = latestDate;
      wRangeOffset = 0;
    } else {
      let spanDays = 30;
      if (currentWRange === '3m') spanDays = 90;
      else if (currentWRange === '6m') spanDays = 180;
      else if (currentWRange === '1m' || currentWRange === 'month') spanDays = 30;

      // Desplazamiento continuo día a día: ambas fechas ascienden/descienden en 1 día
      windowEnd = new Date(latestDate.getTime() + (wRangeOffset * 86400000));
      windowStart = new Date(windowEnd.getTime() - ((spanDays - 1) * 86400000));
      windowStart.setHours(0, 0, 0, 0);
      windowEnd.setHours(23, 59, 59, 999);
    }

    // Actualizar botones de navegación
    if (wGraphNextRange) {
      if (currentWRange === 'all' || wRangeOffset >= 0) {
        wGraphNextRange.style.opacity = '0.35';
        wGraphNextRange.style.pointerEvents = 'none';
      } else {
        wGraphNextRange.style.opacity = '1';
        wGraphNextRange.style.pointerEvents = 'auto';
      }
    }

    const startIso = getLocalDateStr(windowStart);
    const endIso = getLocalDateStr(windowEnd);
    const visibleLogs = currentWRange === 'all'
      ? logs
      : logs.filter(l => l.date >= startIso && l.date <= endIso);

    // Etiqueta de fechas reales de la ventana visible continua
    if (wGraphDateRangeLabel) {
      if (visibleLogs.length > 1) {
        const dStart = new Date(visibleLogs[0].date + 'T12:00:00');
        const dEnd = new Date(visibleLogs[visibleLogs.length - 1].date + 'T12:00:00');
        wGraphDateRangeLabel.textContent = `${fmtShort(dStart)} - ${fmtShort(dEnd)}`;
      } else {
        wGraphDateRangeLabel.textContent = `${fmtShort(windowStart)} - ${fmtShort(windowEnd)}`;
      }
    }

    // Dimensiones SVG (altura ampliada para alojar las etiquetas de dosis con holgura)
    const width = 350;
    const height = 180;
    const padL = 18;
    const padR = 38;
    const padT = 32;
    const padB = 24;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Escala Y
    const isEn = (window.MISPEP_I18N && window.MISPEP_I18N.getLang ? window.MISPEP_I18N.getLang() === 'en' : (localStorage.getItem('mispep_lang') === 'en'));
    const LBS_PER_KG = 2.20462262;
    const toDisplayW = (kg) => isEn ? (kg * LBS_PER_KG) : kg;
    const wUnit = isEn ? 'lb' : 'kg';

    const displayTargetGoal = toDisplayW(targetGoal);
    const rawWeights = visibleLogs.length > 0 ? visibleLogs.map(l => l.weight) : logs.map(l => l.weight);
    const weights = rawWeights.map(w => toDisplayW(w));
    const maxVal = Math.max(...weights, isEn ? 200 : 92);
    const minVal = Math.min(...weights, displayTargetGoal - 1);
    const yStep = isEn ? 5 : 2;
    const yMax = Math.ceil(maxVal / yStep) * yStep;
    const yMin = Math.floor(minVal / yStep) * yStep;
    const yRange = Math.max(isEn ? 10 : 4, yMax - yMin);

    function getY(val) {
      return padT + plotH - ((val - yMin) / yRange) * plotH;
    }

    let gridLinesHtml = '';
    for (let w = yMin; w <= yMax; w += yStep) {
      const yPos = getY(w);
      gridLinesHtml += `
        <line x1="${padL}" y1="${yPos.toFixed(1)}" x2="${width - padR}" y2="${yPos.toFixed(1)}" stroke="var(--border-color)" stroke-width="0.8" opacity="0.55" />
        <text x="${width - 4}" y="${(yPos + 3).toFixed(1)}" font-size="8.5" font-weight="700" fill="var(--text-muted)" text-anchor="end">${w}${wUnit}</text>
      `;
    }

    const goalY = getY(displayTargetGoal);
    const goalHtml = `
      <line x1="${padL}" y1="${goalY.toFixed(1)}" x2="${width - padR}" y2="${goalY.toFixed(1)}" stroke="#2563eb" stroke-width="1.3" stroke-dasharray="4,4" />
      <text x="${padL + 2}" y="${(goalY + 10).toFixed(1)}" font-size="7.5" font-weight="800" fill="#3b82f6">${isEn ? 'Goal' : 'Objetivo'} (${displayTargetGoal.toFixed(1)}${wUnit})</text>
    `;

    if (visibleLogs.length === 0) {
      weightSvgContainer.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; overflow:visible;">
          ${gridLinesHtml}
          ${goalHtml}
          <text x="${width / 2}" y="${padT + plotH / 2}" font-size="9" font-weight="700" fill="var(--text-muted)" text-anchor="middle">
            Sin pesajes en este periodo
          </text>
        </svg>
      `;
      return;
    }

    const inset = 14;
    const tFirst = visibleLogs.length > 0 ? new Date(visibleLogs[0].date + 'T12:00:00').getTime() : 0;
    const tLast = visibleLogs.length > 0 ? new Date(visibleLogs[visibleLogs.length - 1].date + 'T12:00:00').getTime() : 0;
    const timeSpan = tLast - tFirst;

    function getX(l, idx) {
      if (visibleLogs.length === 1) return padL + plotW / 2;
      if (timeSpan > 0) {
        const t = new Date(l.date + 'T12:00:00').getTime();
        const ratio = (t - tFirst) / timeSpan;
        return (padL + inset) + ratio * (plotW - 2 * inset);
      }
      return (padL + inset) + (idx / (visibleLogs.length - 1)) * (plotW - 2 * inset);
    }

    function getXForTime(timeMs) {
      if (visibleLogs.length === 1) return padL + plotW / 2;
      if (timeSpan > 0) {
        const ratio = (timeMs - tFirst) / timeSpan;
        return (padL + inset) + ratio * (plotW - 2 * inset);
      }
      return padL + plotW / 2;
    }

    const points = visibleLogs.map((l, i) => {
      const origIdx = logs.findIndex(item => item.date === l.date && item.weight === l.weight);
      const displayW = toDisplayW(l.weight);
      return {
        x: getX(l, i),
        y: getY(displayW),
        weight: l.weight,
        displayWeight: displayW.toFixed(1),
        date: l.date,
        time: new Date(l.date + 'T12:00:00').getTime(),
        origIdx: origIdx >= 0 ? origIdx : i
      };
    });
    window._currentWeightPoints = points;

    function getCurveYAtX(targetX) {
      if (points.length === 0) return padT + plotH / 2;
      if (points.length === 1 || targetX <= points[0].x) return points[0].y;
      if (targetX >= points[points.length - 1].x) return points[points.length - 1].y;
      for (let i = 0; i < points.length - 1; i++) {
        const pA = points[i];
        const pB = points[i + 1];
        if (targetX >= pA.x && targetX <= pB.x) {
          const t = (targetX - pA.x) / (pB.x - pA.x || 1);
          return pA.y + t * (pB.y - pA.y);
        }
      }
      return points[0].y;
    }

    // ============================================================
    // ESCALA DE COLOR PARA LA GRÁFICA SEGÚN DOSIS (VERDE A ROJO)
    // ============================================================
    const allDoseChanges = getDoseChangeEvents();
    const observedDoses = allDoseChanges.map(d => d.dose).filter(d => typeof d === 'number' && !isNaN(d));
    const minObsDose = observedDoses.length > 0 ? Math.min(...observedDoses) : 1;
    const maxObsDose = observedDoses.length > 0 ? Math.max(...observedDoses) : 1;

    function getDoseColor(doseVal) {
      if (!doseVal || isNaN(doseVal)) return '#2563eb';
      if (minObsDose === maxObsDose) return '#10b981'; // Si no hay variación, verde
      const ratio = Math.max(0, Math.min(1, (doseVal - minObsDose) / (maxObsDose - minObsDose || 1)));
      // Escala de 5 paradas: 0.0 verde (#10b981) -> 0.25 lima (#84cc16) -> 0.50 amarillo (#eab308) -> 0.75 naranja (#f97316) -> 1.0 rojo (#ef4444)
      const stops = [
        { p: 0.0,  r: 16,  g: 185, b: 129 },
        { p: 0.25, r: 132, g: 204, b: 22  },
        { p: 0.50, r: 234, g: 179, b: 8   },
        { p: 0.75, r: 249, g: 115, b: 22  },
        { p: 1.0,  r: 239, g: 68,  b: 68  }
      ];
      let low = stops[0], high = stops[stops.length - 1];
      for (let s = 0; s < stops.length - 1; s++) {
        if (ratio >= stops[s].p && ratio <= stops[s+1].p) {
          low = stops[s]; high = stops[s+1]; break;
        }
      }
      const t = (ratio - low.p) / (high.p - low.p || 1);
      const r = Math.round(low.r + t * (high.r - low.r));
      const g = Math.round(low.g + t * (high.g - low.g));
      const b = Math.round(low.b + t * (high.b - low.b));
      return `rgb(${r}, ${g}, ${b})`;
    }

    function getActiveDoseAtTime(timeMs) {
      let act = null;
      for (let i = 0; i < allDoseChanges.length; i++) {
        if (allDoseChanges[i].time <= timeMs + 43200000) {
          act = allDoseChanges[i];
        } else {
          break;
        }
      }
      return act ? act.dose : (allDoseChanges.length > 0 ? allDoseChanges[0].dose : null);
    }

    // Trazado de segmentos con cambio de color según dosis
    let multiLineSegmentsHtml = '';
    let areaD = '';
    if (points.length >= 2) {
      let fullPathD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const mx = (p0.x + p1.x) / 2;
        fullPathD += ` C ${mx.toFixed(1)} ${p0.y.toFixed(1)}, ${mx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;

        // Dosis y color del segmento
        const midDoseChange = allDoseChanges.find(dc => dc.time > p0.time && dc.time <= p1.time);
        if (midDoseChange) {
          const dcX = getXForTime(midDoseChange.time);
          const dcY = getCurveYAtX(dcX);
          const doseBefore = getActiveDoseAtTime(p0.time);
          const colorBefore = getDoseColor(doseBefore);
          const colorAfter = getDoseColor(midDoseChange.dose);

          const mx1 = (p0.x + dcX) / 2;
          multiLineSegmentsHtml += `
            <path d="M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} C ${mx1.toFixed(1)} ${p0.y.toFixed(1)}, ${mx1.toFixed(1)} ${dcY.toFixed(1)}, ${dcX.toFixed(1)} ${dcY.toFixed(1)}" fill="none" stroke="${colorBefore}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
          `;
          const mx2 = (dcX + p1.x) / 2;
          multiLineSegmentsHtml += `
            <path d="M ${dcX.toFixed(1)} ${dcY.toFixed(1)} C ${mx2.toFixed(1)} ${dcY.toFixed(1)}, ${mx2.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}" fill="none" stroke="${colorAfter}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
          `;
        } else {
          const segDose = getActiveDoseAtTime(p0.time);
          const segColor = getDoseColor(segDose);
          multiLineSegmentsHtml += `
            <path d="M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} C ${mx.toFixed(1)} ${p0.y.toFixed(1)}, ${mx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}" fill="none" stroke="${segColor}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
          `;
        }
      }
      areaD = `${fullPathD} L ${points[points.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;
    }

    let nodesHtml = '';
    const showAllLabels = points.length <= 8;
    let lastRenderedLabelX = -999;
    const colHitW = Math.max(34, (plotW / points.length));

    points.forEach((pt, i) => {
      const dObj = new Date(pt.date + 'T12:00:00');
      const dd = String(dObj.getDate()).padStart(2, '0');
      const mm = String(dObj.getMonth() + 1).padStart(2, '0');
      const dateLabel = `${dd}/${mm}`;

      const isFirst = (i === 0);
      const isLast = (i === points.length - 1);
      const hasSpace = (pt.x - lastRenderedLabelX) >= 28;
      const shouldShowLabel = showAllLabels || isFirst || isLast || hasSpace;

      let labelHtml = '';
      if (shouldShowLabel) {
        lastRenderedLabelX = pt.x;
        labelHtml = `
          <text x="${pt.x.toFixed(1)}" y="${(pt.y - 8).toFixed(1)}" font-size="8.5" font-weight="900" fill="var(--text-main)" text-anchor="middle">${pt.displayWeight}${wUnit}</text>
          <text x="${pt.x.toFixed(1)}" y="${(height - 6).toFixed(1)}" font-size="8" font-weight="700" fill="var(--text-muted)" text-anchor="middle">${dateLabel}</text>
        `;
      }

      const nodeDose = getActiveDoseAtTime(pt.time);
      const nodeColor = getDoseColor(nodeDose);

      nodesHtml += `
        <rect class="w-node-hit" data-orig-idx="${pt.origIdx}" x="${(pt.x - colHitW / 2).toFixed(1)}" y="0" width="${colHitW.toFixed(1)}" height="${height}" fill="rgba(0,0,0,0.001)" pointer-events="all" style="cursor:pointer;" />
        <circle class="w-node-circle" data-orig-idx="${pt.origIdx}" cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="5.5" fill="#ffffff" stroke="${nodeColor}" stroke-width="2.4" pointer-events="all" style="cursor:pointer;" />
        ${labelHtml}
      `;
    });

    // ============================================================
    // MARCADORES DE INYECCIONES Y JERINGUILLAS
    // ============================================================
    const allInjections = (typeof getInjectionHistory === 'function' ? getInjectionHistory() : []);
    const visibleInjections = allInjections.filter(inj => {
      const injX = getXForTime(inj.time);
      return injX >= (padL - 4) && injX <= (width - padR + 6);
    });

    let injectionMarkersHtml = '';
    visibleInjections.forEach(inj => {
      const injX = getXForTime(inj.time);
      const curveY = getCurveYAtX(injX);
      const mColor = (inj.med && inj.med.color) ? inj.med.color : '#10b981';

      injectionMarkersHtml += `
        <!-- Pequeña jeringuilla por encima de la línea de peso objetivo -->
        <text x="${injX.toFixed(1)}" y="${(goalY - 3).toFixed(1)}" font-size="8.5" text-anchor="middle" style="user-select:none; pointer-events:none;">💉</text>
        <!-- Circulito de inyección en la curva (incluso si no cambia la dosis) -->
        <circle cx="${injX.toFixed(1)}" cy="${curveY.toFixed(1)}" r="3.2" fill="${mColor}" stroke="#ffffff" stroke-width="1.2" />
      `;
    });

    // ============================================================
    // ETIQUETAS DE CAMBIO DE DOSIS (DEBAJO DE LA LÍNEA)
    // ============================================================
    let doseBadgesHtml = '';
    let lastBadgeX = -999;
    let staggerToggle = false;

    const visibleDoseChanges = allDoseChanges.filter(dc => {
      const dcX = getXForTime(dc.time);
      return dcX >= (padL - 4) && dcX <= (width - padR + 6);
    });

    visibleDoseChanges.forEach(dc => {
      const dcX = getXForTime(dc.time);
      const curveY = getCurveYAtX(dcX);
      const badgeColor = (dc.med && dc.med.color) ? dc.med.color : '#10b981';

      // Posicionada DEBAJO de la curva para no tapar los pesos
      let badgeY = Math.min(height - padB - 14, curveY + 14);
      if (Math.abs(dcX - lastBadgeX) < 32) {
        badgeY = staggerToggle ? Math.min(height - padB - 2, badgeY + 14) : Math.min(height - padB - 2, badgeY - 4);
        staggerToggle = !staggerToggle;
      } else {
        staggerToggle = false;
      }
      lastBadgeX = dcX;

      const badgeW = Math.max(30, dc.dText.length * 6.2 + 10);
      const badgeX = Math.max(padL, Math.min(width - padR - badgeW, dcX - badgeW / 2));

      doseBadgesHtml += `
        <!-- Guía vertical discontinua hacia abajo -->
        <line x1="${dcX.toFixed(1)}" y1="${curveY.toFixed(1)}" x2="${dcX.toFixed(1)}" y2="${badgeY.toFixed(1)}" stroke="${badgeColor}" stroke-width="1.2" stroke-dasharray="2,2" opacity="0.85" />
        <!-- Píldora de dosis debajo de la curva -->
        <g style="cursor:default;">
          <rect x="${badgeX.toFixed(1)}" y="${badgeY.toFixed(1)}" width="${badgeW.toFixed(1)}" height="14" rx="4" fill="${badgeColor}" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.38))" />
          <text x="${(badgeX + badgeW / 2).toFixed(1)}" y="${(badgeY + 10).toFixed(1)}" font-size="7.5" font-weight="900" fill="#ffffff" text-anchor="middle">${dc.dText}</text>
        </g>
      `;
    });

    weightSvgContainer.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; overflow:visible;">
        <defs>
          <linearGradient id="wAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#2563eb" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#2563eb" stop-opacity="0.01" />
          </linearGradient>
        </defs>

        ${gridLinesHtml}
        ${goalHtml}
        ${areaD ? `<path d="${areaD}" fill="url(#wAreaGrad)" />` : ''}
        ${multiLineSegmentsHtml}
        ${nodesHtml}
        ${injectionMarkersHtml}
        ${doseBadgesHtml}
      </svg>
    `;

    weightSvgContainer.querySelectorAll('.w-node-hit, .w-node-circle').forEach(el => {
      const onPick = (e) => {
        if (e) {
          e.stopPropagation();
          e.preventDefault();
        }
        triggerHaptic(14);
        const origIdx = parseInt(el.dataset.origIdx, 10);
        openWeightZoomModal(origIdx);
      };
      el.addEventListener('click', onPick);
      el.addEventListener('touchend', (e) => {
        if (!wIsSwiping) onPick(e);
      });
    });
  }

  // ============================================================
  // PANTALLA AMPLIADA / VISOR DE PESO (LUPA DE ±4 PESAJES)
  // ============================================================
  const weightZoomSheetBackdrop = document.getElementById('weightZoomSheetBackdrop');
  const closeWeightZoomSheetBtn = document.getElementById('closeWeightZoomSheetBtn');
  const wZoomModalTitle = document.getElementById('wZoomModalTitle');
  const wZoomModalSubtitle = document.getElementById('wZoomModalSubtitle');
  const wZoomPrevLogBtn = document.getElementById('wZoomPrevLogBtn');
  const wZoomNextLogBtn = document.getElementById('wZoomNextLogBtn');
  const wZoomFocusDateLabel = document.getElementById('wZoomFocusDateLabel');
  const wZoomFocusSubLabel = document.getElementById('wZoomFocusSubLabel');
  const weightZoomSvgContainer = document.getElementById('weightZoomSvgContainer');
  const weightZoomCardsContainer = document.getElementById('weightZoomCardsContainer');
  const wZoomDeltaTotalSpan = document.getElementById('wZoomDeltaTotalSpan');
  const wZoomGraphSectionTitle = document.getElementById('wZoomGraphSectionTitle');
  const wZoomLegendWeightLabel = document.getElementById('wZoomLegendWeightLabel');
  const wZoomCardsSectionTitle = document.getElementById('wZoomCardsSectionTitle');
  const wOpenZoomBtn = document.getElementById('wOpenZoomBtn');

  let currentWZoomCenterIdx = -1;
  let lastWeightZoomOpenedAt = 0;

  function openWeightZoomModal(logIdx) {
    const p = getHealthProfile();
    let logs = [...(p.weightLogs || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
    if (logs.length === 0) {
      showToast('No hay registros de peso guardados');
      return;
    }
    if (logIdx === undefined || logIdx === null || logIdx < 0) {
      logIdx = logs.length - 1;
    } else {
      logIdx = Math.max(0, Math.min(logs.length - 1, logIdx));
    }
    currentWZoomCenterIdx = logIdx;
    renderWeightZoomView(currentWZoomCenterIdx);
    lastWeightZoomOpenedAt = Date.now();
    if (weightZoomSheetBackdrop) {
      weightZoomSheetBackdrop.classList.add('open');
    }
  }

  function renderWeightZoomView(centerIdx) {
    if (!weightZoomSvgContainer || !weightZoomCardsContainer) return;
    const p = getHealthProfile();
    let logs = [...(p.weightLogs || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
    if (logs.length === 0) return;

    centerIdx = Math.max(0, Math.min(logs.length - 1, centerIdx));
    currentWZoomCenterIdx = centerIdx;
    const targetLog = logs[centerIdx];

    // Ventana de -4 y +4 pesajes (hasta 9 pesajes consecutivos)
    const startIdx = Math.max(0, centerIdx - 4);
    const endIdx = Math.min(logs.length - 1, centerIdx + 4);
    const windowLogs = [];
    for (let k = startIdx; k <= endIdx; k++) {
      windowLogs.push({
        ...logs[k],
        origIdx: k,
        relDiff: k - centerIdx
      });
    }

    // Idioma
    const isEn = (window.MISPEP_I18N && window.MISPEP_I18N.getLang ? window.MISPEP_I18N.getLang() === 'en' : (localStorage.getItem('mispep_lang') === 'en'));

    if (wZoomModalTitle) {
      wZoomModalTitle.textContent = isEn ? 'Weight Detail & Amplitude' : 'Detalle y Amplitud de Peso';
    }
    if (wZoomModalSubtitle) {
      wZoomModalSubtitle.textContent = isEn
        ? '±4 weigh-ins window (up to 9 logs) · Exact variation and amplitudes'
        : 'Ventana de ±4 pesajes (hasta 9 pesajes) · Variación exacta y amplitudes';
    }
    if (wZoomGraphSectionTitle) {
      wZoomGraphSectionTitle.textContent = isEn ? 'Weight Evolution & Variation' : 'Evolución y Variación de Peso';
    }
    if (wZoomLegendWeightLabel) {
      wZoomLegendWeightLabel.textContent = isEn ? '● Weight (lb)' : '● Peso (kg)';
    }
    if (wZoomCardsSectionTitle) {
      wZoomCardsSectionTitle.textContent = isEn ? '📋 Details of each weigh-in (±4 records)' : '📋 Detalle de cada pesaje (±4 registros)';
    }

    // Botones de navegación
    if (wZoomPrevLogBtn) {
      wZoomPrevLogBtn.disabled = (centerIdx <= 0);
      wZoomPrevLogBtn.style.opacity = (centerIdx <= 0) ? '0.35' : '1';
    }
    if (wZoomNextLogBtn) {
      wZoomNextLogBtn.disabled = (centerIdx >= logs.length - 1);
      wZoomNextLogBtn.style.opacity = (centerIdx >= logs.length - 1) ? '0.35' : '1';
    }

    // Etiquetas de la cabecera
    const dTargetObj = new Date(targetLog.date + 'T12:00:00');
    const fullDays = isEn ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] : ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = isEn ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] : ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const shortDays = isEn ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const targetDateFormatted = isEn
      ? `${fullDays[dTargetObj.getDay()]}, ${months[dTargetObj.getMonth()]} ${dTargetObj.getDate()}`
      : `${fullDays[dTargetObj.getDay()]}, ${dTargetObj.getDate()} de ${months[dTargetObj.getMonth()]}`;

    const LBS_PER_KG = 2.20462262;
    const toDisplayW = (kg) => isEn ? (kg * LBS_PER_KG) : kg;
    const wUnit = isEn ? 'lb' : 'kg';

    if (wZoomFocusDateLabel) {
      wZoomFocusDateLabel.textContent = `📅 ${targetDateFormatted}`;
    }
    if (wZoomFocusSubLabel) {
      wZoomFocusSubLabel.textContent = isEn
        ? `Weigh-in #${centerIdx + 1} of ${logs.length} · ${toDisplayW(targetLog.weight).toFixed(1)} lb`
        : `Pesaje #${centerIdx + 1} de ${logs.length} · ${targetLog.weight} kg`;
    }

    // Amplitud y estadísticas de la ventana
    const weights = windowLogs.map(l => toDisplayW(l.weight));
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const deltaRange = (maxW - minW).toFixed(2);
    const firstW = toDisplayW(windowLogs[0].weight);
    const lastW = toDisplayW(windowLogs[windowLogs.length - 1].weight);
    const deltaTotal = (lastW - firstW).toFixed(2);
    const deltaSign = (lastW - firstW) > 0 ? '+' : '';

    if (wZoomDeltaTotalSpan) {
      const ampWord = isEn ? 'Amplitude' : 'Amplitud';
      wZoomDeltaTotalSpan.textContent = `Δ Total: ${deltaSign}${deltaTotal} ${wUnit} (${ampWord}: ${deltaRange} ${wUnit})`;
      wZoomDeltaTotalSpan.style.color = (lastW <= firstW) ? '#10b981' : '#f59e0b';
    }

    // Renderizar Gráfico SVG Ampliado
    const width = 360;
    const height = 240;
    const padL = 38;
    const padR = 20;
    const padT = 34;
    const padB = 36;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const targetGoal = parseFloat(p.targetWeight) || 87.0;
    const displayTargetGoal = toDisplayW(targetGoal);
    const yMin = Math.floor(Math.min(minW, displayTargetGoal) - (isEn ? 1.5 : 0.6));
    const yMax = Math.ceil(Math.max(maxW, displayTargetGoal) + (isEn ? 1.5 : 0.6));
    const yRange = Math.max(isEn ? 4 : 2, yMax - yMin);

    function getY(w) {
      return padT + plotH - (((w - yMin) / yRange) * plotH);
    }

    // Líneas de cuadrícula horizontales
    let gridLinesHtml = '';
    const stepY = isEn ? (yRange > 15 ? 5 : 2) : ((yRange > 8) ? 2 : 1);
    for (let wVal = yMin; wVal <= yMax; wVal += stepY) {
      const yP = getY(wVal);
      gridLinesHtml += `
        <line x1="${padL - 4}" y1="${yP.toFixed(1)}" x2="${width - padR}" y2="${yP.toFixed(1)}" stroke="var(--border-color)" stroke-width="0.8" opacity="0.5" />
        <text x="${padL - 6}" y="${(yP + 3).toFixed(1)}" font-size="7.5" font-weight="700" fill="var(--text-muted)" text-anchor="end">${wVal}${isEn ? 'lb' : 'k'}</text>
      `;
    }

    // Línea de objetivo
    const goalY = getY(displayTargetGoal);
    const goalHtml = `
      <line x1="${padL}" y1="${goalY.toFixed(1)}" x2="${width - padR}" y2="${goalY.toFixed(1)}" stroke="#3b82f6" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.65" />
      <text x="${width - padR}" y="${(goalY - 3).toFixed(1)}" font-size="7.2" font-weight="800" fill="#3b82f6" text-anchor="end">${isEn ? 'Goal' : 'Objetivo'} (${displayTargetGoal.toFixed(1)}${wUnit})</text>
    `;

    // Columnas y coordenadas de los puntos
    const n = windowLogs.length;
    const colW = plotW / n;
    const pts = windowLogs.map((l, i) => {
      const dw = toDisplayW(l.weight);
      const x = padL + (i + 0.5) * colW;
      const y = getY(dw);
      const time = new Date(l.date + 'T12:00:00').getTime();
      return { ...l, x, y, time, displayW: dw.toFixed(1) };
    });

    function getCurveYAtX(targetX) {
      if (pts.length === 0) return padT + plotH / 2;
      if (pts.length === 1 || targetX <= pts[0].x) return pts[0].y;
      if (targetX >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
      for (let i = 0; i < pts.length - 1; i++) {
        const pA = pts[i];
        const pB = pts[i + 1];
        if (targetX >= pA.x && targetX <= pB.x) {
          const t = (targetX - pA.x) / (pB.x - pA.x || 1);
          return pA.y + t * (pB.y - pA.y);
        }
      }
      return pts[0].y;
    }

    function getXForTime(timeMs) {
      if (pts.length <= 1) return padL + plotW / 2;
      if (timeMs <= pts[0].time) return pts[0].x;
      if (timeMs >= pts[pts.length - 1].time) return pts[pts.length - 1].x;
      for (let i = 0; i < pts.length - 1; i++) {
        const pA = pts[i];
        const pB = pts[i + 1];
        if (timeMs >= pA.time && timeMs <= pB.time) {
          const ratio = (timeMs - pA.time) / (pB.time - pA.time || 1);
          return pA.x + ratio * (pB.x - pA.x);
        }
      }
      return pts[pts.length - 1].x;
    }

    // ============================================================
    // ESCALA DE COLOR PARA LA GRÁFICA DE DETALLE SEGÚN DOSIS
    // ============================================================
    const allDoseChanges = getDoseChangeEvents();
    const observedDoses = allDoseChanges.map(d => d.dose).filter(d => typeof d === 'number' && !isNaN(d));
    const minObsDose = observedDoses.length > 0 ? Math.min(...observedDoses) : 1;
    const maxObsDose = observedDoses.length > 0 ? Math.max(...observedDoses) : 1;

    function getDoseColor(doseVal) {
      if (!doseVal || isNaN(doseVal)) return '#2563eb';
      if (minObsDose === maxObsDose) return '#10b981';
      const ratio = Math.max(0, Math.min(1, (doseVal - minObsDose) / (maxObsDose - minObsDose || 1)));
      const stops = [
        { p: 0.0,  r: 16,  g: 185, b: 129 }, // verde (#10b981)
        { p: 0.25, r: 132, g: 204, b: 22  }, // lima (#84cc16)
        { p: 0.50, r: 234, g: 179, b: 8   }, // amarillo (#eab308)
        { p: 0.75, r: 249, g: 115, b: 22  }, // naranja (#f97316)
        { p: 1.0,  r: 239, g: 68,  b: 68  }  // rojo (#ef4444)
      ];
      let low = stops[0], high = stops[stops.length - 1];
      for (let s = 0; s < stops.length - 1; s++) {
        if (ratio >= stops[s].p && ratio <= stops[s+1].p) {
          low = stops[s]; high = stops[s+1]; break;
        }
      }
      const t = (ratio - low.p) / (high.p - low.p || 1);
      const r = Math.round(low.r + t * (high.r - low.r));
      const g = Math.round(low.g + t * (high.g - low.g));
      const b = Math.round(low.b + t * (high.b - low.b));
      return `rgb(${r}, ${g}, ${b})`;
    }

    function getActiveDoseAtTime(timeMs) {
      let act = null;
      for (let i = 0; i < allDoseChanges.length; i++) {
        if (allDoseChanges[i].time <= timeMs + 43200000) {
          act = allDoseChanges[i];
        } else {
          break;
        }
      }
      return act ? act.dose : (allDoseChanges.length > 0 ? allDoseChanges[0].dose : null);
    }

    // Segmentos spline con cambio de color por nivel de dosis
    let multiLineSegmentsHtml = '';
    let areaD = '';
    if (pts.length >= 2) {
      let fullPathD = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const mx = (p0.x + p1.x) / 2;
        fullPathD += ` C ${mx.toFixed(1)} ${p0.y.toFixed(1)}, ${mx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;

        // Comprobar si hubo cambio de dosis entre p0 y p1
        const midDoseChange = allDoseChanges.find(dc => dc.time > p0.time && dc.time <= p1.time);
        if (midDoseChange) {
          const dcX = getXForTime(midDoseChange.time);
          const dcY = getCurveYAtX(dcX);
          const doseBefore = getActiveDoseAtTime(p0.time);
          const colorBefore = getDoseColor(doseBefore);
          const colorAfter = getDoseColor(midDoseChange.dose);

          const mx1 = (p0.x + dcX) / 2;
          multiLineSegmentsHtml += `
            <path d="M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} C ${mx1.toFixed(1)} ${p0.y.toFixed(1)}, ${mx1.toFixed(1)} ${dcY.toFixed(1)}, ${dcX.toFixed(1)} ${dcY.toFixed(1)}" fill="none" stroke="${colorBefore}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
          `;
          const mx2 = (dcX + p1.x) / 2;
          multiLineSegmentsHtml += `
            <path d="M ${dcX.toFixed(1)} ${dcY.toFixed(1)} C ${mx2.toFixed(1)} ${dcY.toFixed(1)}, ${mx2.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}" fill="none" stroke="${colorAfter}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
          `;
        } else {
          const segDose = getActiveDoseAtTime(p0.time);
          const segColor = getDoseColor(segDose);
          multiLineSegmentsHtml += `
            <path d="M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} C ${mx.toFixed(1)} ${p0.y.toFixed(1)}, ${mx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}" fill="none" stroke="${segColor}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
          `;
        }
      }
      areaD = `${fullPathD} L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;
    }

    let columnsBgHtml = '';
    let nodesHtml = '';
    let hitColsHtml = '';

    pts.forEach((pt, i) => {
      const isCenter = (pt.origIdx === centerIdx);
      const dObj = new Date(pt.date + 'T12:00:00');
      const dayShort = shortDays[dObj.getDay()];
      const dd = String(dObj.getDate()).padStart(2, '0');
      const mm = String(dObj.getMonth() + 1).padStart(2, '0');
      const dateLabel = `${dayShort} ${dd}/${mm}`;

      // Etiqueta relativa superior
      let relBadgeText = '';
      if (!isCenter) {
        relBadgeText = pt.relDiff < 0 ? `${pt.relDiff}p` : `+${pt.relDiff}p`;
      }

      // Fondo de la columna del pesaje
      if (isCenter) {
        columnsBgHtml += `
          <rect x="${(pt.x - colW / 2 + 2).toFixed(1)}" y="${padT - 18}" width="${(colW - 4).toFixed(1)}" height="${(plotH + 34).toFixed(1)}" rx="10" fill="rgba(37, 99, 235, 0.16)" stroke="rgba(37, 99, 235, 0.6)" stroke-width="1.6" />
        `;
      } else {
        columnsBgHtml += `
          <rect x="${(pt.x - colW / 2 + 3).toFixed(1)}" y="${padT - 12}" width="${(colW - 6).toFixed(1)}" height="${(plotH + 26).toFixed(1)}" rx="6" fill="rgba(255, 255, 255, 0.02)" />
          <text x="${pt.x.toFixed(1)}" y="${(padT - 14).toFixed(1)}" font-size="7" font-weight="800" fill="var(--text-muted)" text-anchor="middle">${relBadgeText}</text>
        `;
      }

      // Diferencia respecto al pesaje anterior
      let diffHtml = '';
      if (i > 0) {
        const prevPt = pts[i - 1];
        const dKg = (pt.weight - prevPt.weight) * (isEn ? LBS_PER_KG : 1);
        const dKgStr = (dKg > 0 ? '+' : '') + dKg.toFixed(2);
        const dColor = dKg < 0 ? '#10b981' : (dKg > 0 ? '#f59e0b' : 'var(--text-muted)');
        diffHtml = `
          <text x="${pt.x.toFixed(1)}" y="${(pt.y + 13).toFixed(1)}" font-size="7" font-weight="800" fill="${dColor}" text-anchor="middle">${dKgStr}</text>
        `;
      }

      // Color de dosis para el nodo
      const nodeDose = getActiveDoseAtTime(pt.time);
      const nodeColor = getDoseColor(nodeDose);

      // Nodo
      const rOuter = isCenter ? 7.5 : 5.5;
      const rInner = isCenter ? 4 : 2.5;
      nodesHtml += `
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${rOuter}" fill="${isCenter ? nodeColor : '#ffffff'}" stroke="${nodeColor}" stroke-width="${isCenter ? 2.8 : 2.2}" />
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${rInner}" fill="${isCenter ? '#ffffff' : nodeColor}" />
        <text x="${pt.x.toFixed(1)}" y="${(pt.y - 10).toFixed(1)}" font-size="${isCenter ? '9' : '8.2'}" font-weight="900" fill="${isCenter ? '#60a5fa' : 'var(--text-main)'}" text-anchor="middle">${pt.displayW}</text>
        ${diffHtml}
        <text x="${pt.x.toFixed(1)}" y="${(height - 6).toFixed(1)}" font-size="7.5" font-weight="700" fill="var(--text-muted)" text-anchor="middle">${dateLabel}</text>
      `;

      // Zona táctil interactiva
      hitColsHtml += `
        <rect class="w-zoom-col-hit" data-orig-idx="${pt.origIdx}" x="${(pt.x - colW / 2).toFixed(1)}" y="0" width="${colW.toFixed(1)}" height="${height}" fill="rgba(0,0,0,0.001)" pointer-events="all" style="cursor:pointer;" />
      `;
    });

    // ============================================================
    // MARCADORES DE INYECCIONES Y JERINGUILLAS EN EL DETALLE
    // ============================================================
    const allInjections = (typeof getInjectionHistory === 'function' ? getInjectionHistory() : []);
    const tFirstZoom = pts[0].time - 43200000;
    const tLastZoom = pts[pts.length - 1].time + 43200000;
    const visibleInjections = allInjections.filter(inj => inj.time >= tFirstZoom && inj.time <= tLastZoom);

    let injectionMarkersHtml = '';
    visibleInjections.forEach(inj => {
      const injX = getXForTime(inj.time);
      const curveY = getCurveYAtX(injX);
      const mColor = (inj.med && inj.med.color) ? inj.med.color : '#10b981';

      injectionMarkersHtml += `
        <!-- Pequeña jeringuilla por encima de la línea de objetivo -->
        <text x="${injX.toFixed(1)}" y="${(goalY - 3).toFixed(1)}" font-size="9" text-anchor="middle" style="user-select:none; pointer-events:none;">💉</text>
        <!-- Circulito de inyección en la curva (incluso si no cambia la dosis) -->
        <circle cx="${injX.toFixed(1)}" cy="${curveY.toFixed(1)}" r="3.2" fill="${mColor}" stroke="#ffffff" stroke-width="1.2" />
      `;
    });

    // ============================================================
    // ETIQUETAS DE CAMBIOS DE DOSIS (DEBAJO DE LA LÍNEA)
    // ============================================================
    let doseBadgesHtml = '';
    let lastBadgeX = -999;
    let staggerToggle = false;

    const visibleDoseChanges = allDoseChanges.filter(dc => dc.time >= tFirstZoom && dc.time <= tLastZoom);

    visibleDoseChanges.forEach(dc => {
      const dcX = getXForTime(dc.time);
      const curveY = getCurveYAtX(dcX);
      const badgeColor = (dc.med && dc.med.color) ? dc.med.color : '#10b981';

      // Posicionada DEBAJO de la curva para no tapar los pesos
      let badgeY = Math.min(height - padB - 14, curveY + 14);
      if (Math.abs(dcX - lastBadgeX) < 32) {
        badgeY = staggerToggle ? Math.min(height - padB - 2, badgeY + 14) : Math.min(height - padB - 2, badgeY - 4);
        staggerToggle = !staggerToggle;
      } else {
        staggerToggle = false;
      }
      lastBadgeX = dcX;

      const badgeW = Math.max(30, dc.dText.length * 6.2 + 10);
      const badgeX = Math.max(padL - 10, Math.min(width - padR - badgeW, dcX - badgeW / 2));

      doseBadgesHtml += `
        <!-- Guía vertical discontinua hacia abajo -->
        <line x1="${dcX.toFixed(1)}" y1="${curveY.toFixed(1)}" x2="${dcX.toFixed(1)}" y2="${badgeY.toFixed(1)}" stroke="${badgeColor}" stroke-width="1.2" stroke-dasharray="2,2" opacity="0.85" />
        <!-- Píldora de dosis debajo de la curva -->
        <g style="cursor:default;">
          <rect x="${badgeX.toFixed(1)}" y="${badgeY.toFixed(1)}" width="${badgeW.toFixed(1)}" height="14" rx="4" fill="${badgeColor}" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.38))" />
          <text x="${(badgeX + badgeW / 2).toFixed(1)}" y="${(badgeY + 10).toFixed(1)}" font-size="7.5" font-weight="900" fill="#ffffff" text-anchor="middle">${dc.dText}</text>
        </g>
      `;
    });

    weightZoomSvgContainer.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; overflow:visible;">
        <defs>
          <linearGradient id="wZoomAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#2563eb" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#2563eb" stop-opacity="0.01" />
          </linearGradient>
        </defs>

        ${gridLinesHtml}
        ${goalHtml}
        ${columnsBgHtml}
        ${areaD ? `<path d="${areaD}" fill="url(#wZoomAreaGrad)" />` : ''}
        ${multiLineSegmentsHtml}
        ${nodesHtml}
        ${injectionMarkersHtml}
        ${doseBadgesHtml}
        ${hitColsHtml}
      </svg>
    `;

    // Listeners para tocar columnas dentro del gráfico ampliado
    weightZoomSvgContainer.querySelectorAll('.w-zoom-col-hit').forEach(col => {
      col.addEventListener('click', () => {
        triggerHaptic(14);
        const newIdx = parseInt(col.dataset.origIdx, 10);
        renderWeightZoomView(newIdx);
      });
    });

    // Renderizar Tarjetas de Detalle Inferior
    const heightCm = parseFloat(p.heightCm) || 0;
    let cardsHtml = '';

    windowLogs.forEach((l, i) => {
      const isCenter = (l.origIdx === centerIdx);
      const dObj = new Date(l.date + 'T12:00:00');
      const dateFullStr = isEn
        ? `${fullDays[dObj.getDay()]}, ${months[dObj.getMonth()]} ${dObj.getDate()}, ${dObj.getFullYear()}`
        : `${fullDays[dObj.getDay()]}, ${dObj.getDate()} de ${months[dObj.getMonth()]} de ${dObj.getFullYear()}`;

      let relBadge = '';
      if (isCenter) {
        relBadge = `<span style="background:#2563eb; color:#ffffff; font-size:0.68rem; font-weight:800; padding:2px 8px; border-radius:6px; letter-spacing:0.5px;">⭐ ${isEn ? 'SELECTED' : 'SELECCIONADO'}</span>`;
      } else if (l.relDiff < 0) {
        const count = Math.abs(l.relDiff);
        const text = isEn ? `${count} weigh-in(s) before` : `${count} pesaje(s) antes`;
        relBadge = `<span style="background:rgba(255,255,255,0.08); color:var(--text-muted); font-size:0.68rem; font-weight:800; padding:2px 6px; border-radius:6px;">${text}</span>`;
      } else {
        const text = isEn ? `${l.relDiff} weigh-in(s) after` : `${l.relDiff} pesaje(s) después`;
        relBadge = `<span style="background:rgba(255,255,255,0.08); color:var(--text-muted); font-size:0.68rem; font-weight:800; padding:2px 6px; border-radius:6px;">${text}</span>`;
      }

      // Comparación con el pesaje anterior en la serie global
      let diffPrevHtml = '';
      const diffLabel = isEn ? 'Difference vs previous weight:' : 'Diferencia vs peso anterior:';
      if (l.origIdx > 0) {
        const prevGlobalLog = logs[l.origIdx - 1];
        const diffKg = (l.weight - prevGlobalLog.weight) * (isEn ? LBS_PER_KG : 1);
        const diffSign = diffKg > 0 ? '+' : '';
        const isLoss = diffKg < 0;
        const dColor = isLoss ? '#10b981' : (diffKg > 0 ? '#ef4444' : 'var(--text-muted)');
        const icon = isLoss ? '📉' : (diffKg > 0 ? '📈' : '➖');
        diffPrevHtml = `
          <div style="font-size:0.82rem; font-weight:800; color:${dColor}; margin-top:3px;">
            ${icon} ${diffLabel} <strong>${diffSign}${diffKg.toFixed(2)} ${wUnit}</strong>
          </div>
        `;
      } else {
        const firstLabel = isEn ? 'First recorded weigh-in' : 'Primer pesaje registrado';
        diffPrevHtml = `<div style="color:var(--text-muted); font-size:0.75rem; font-style:italic; margin-top:3px;">${firstLabel}</div>`;
      }

      // IMC
      let imcHtml = '';
      if (heightCm > 0) {
        const heightM = heightCm / 100;
        const imcVal = (l.weight / (heightM * heightM)).toFixed(1);
        let imcLabel = 'Normal';
        let imcColor = '#10b981';
        if (imcVal >= 30) { imcLabel = isEn ? 'Obese' : 'Obesidad'; imcColor = '#ef4444'; }
        else if (imcVal >= 25) { imcLabel = isEn ? 'Overweight' : 'Sobrepeso'; imcColor = '#f59e0b'; }
        else if (imcVal < 18.5) { imcLabel = isEn ? 'Underweight' : 'Bajo peso'; imcColor = '#3b82f6'; }
        imcHtml = `
          <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:6px 10px; text-align:center;">
            <div style="font-size:0.65rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">IMC</div>
            <div style="font-size:0.95rem; font-weight:900; color:${imcColor};">${imcVal}</div>
            <div style="font-size:0.65rem; font-weight:700; color:var(--text-muted);">${imcLabel}</div>
          </div>
        `;
      }

      // Origen del pesaje
      const origenStr = l.origen ? `<span style="font-size:0.68rem; color:var(--text-muted);">📡 ${l.origen}</span>` : '';

      cardsHtml += `
        <div style="background:var(--card-bg-elevated); border:${isCenter ? '1.8px solid #2563eb' : '1px solid var(--border-color)'}; border-radius:14px; padding:12px 14px; ${isCenter ? 'box-shadow:0 0 16px rgba(37,99,235,0.22);' : ''}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-size:0.84rem; font-weight:800; color:var(--text-main);">${dateFullStr}</div>
            ${relBadge}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="display:flex; align-items:baseline; gap:4px;">
                <span style="font-size:1.8rem; font-weight:900; color:#ffffff; letter-spacing:0.5px;">${toDisplayW(l.weight).toFixed(1)}</span>
                <span style="font-size:0.9rem; font-weight:800; color:#3b82f6;">${wUnit}</span>
              </div>
              ${diffPrevHtml}
              ${origenStr ? `<div style="margin-top:4px;">${origenStr}</div>` : ''}
            </div>

            <div style="display:flex; align-items:center; gap:8px;">
              ${imcHtml}
              <button type="button" class="btn-3d btn-3d-surface w-zoom-edit-btn" data-date="${l.date}" data-weight="${l.weight}" style="padding:6px 10px; font-size:0.75rem; font-weight:800; color:#3b82f6; border:1px solid rgba(59,130,246,0.35);" title="Modificar este registro">
                ✏️
              </button>
            </div>
          </div>
        </div>
      `;
    });

    weightZoomCardsContainer.innerHTML = cardsHtml;

    // Listener para botones de edición
    weightZoomCardsContainer.querySelectorAll('.w-zoom-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerHaptic(14);
        if (weightZoomSheetBackdrop) weightZoomSheetBackdrop.classList.remove('open');
        openWeightModal('records');
      });
    });
  }

  if (wZoomPrevLogBtn) {
    wZoomPrevLogBtn.addEventListener('click', () => {
      triggerHaptic(12);
      if (currentWZoomCenterIdx > 0) {
        renderWeightZoomView(currentWZoomCenterIdx - 1);
      }
    });
  }
  if (wZoomNextLogBtn) {
    wZoomNextLogBtn.addEventListener('click', () => {
      triggerHaptic(12);
      const p = getHealthProfile();
      const logs = p.weightLogs || [];
      if (currentWZoomCenterIdx < logs.length - 1) {
        renderWeightZoomView(currentWZoomCenterIdx + 1);
      }
    });
  }

  if (closeWeightZoomSheetBtn && weightZoomSheetBackdrop) {
    closeWeightZoomSheetBtn.addEventListener('click', () => {
      triggerHaptic(10);
      weightZoomSheetBackdrop.classList.remove('open');
    });
  }

  if (weightZoomSheetBackdrop) {
    weightZoomSheetBackdrop.addEventListener('click', (e) => {
      if (Date.now() - lastWeightZoomOpenedAt < 450) return;
      if (e.target === weightZoomSheetBackdrop) {
        weightZoomSheetBackdrop.classList.remove('open');
      }
    });
  }

  if (wOpenZoomBtn) {
    wOpenZoomBtn.addEventListener('click', () => {
      triggerHaptic(14);
      openWeightZoomModal();
    });
  }

  // Marcar inyección como administrada (Abre el modal completo Añadir Dosis)
  if (dashMarkDoseBtn) {
    dashMarkDoseBtn.addEventListener('click', () => {
      if (window.openAddDoseModal) {
        window.openAddDoseModal();
      }
    });
  }

  // Toggle Formularios
  function toggleCard(card) {
    if (!card) return;
    card.style.display = card.style.display === 'none' ? 'block' : 'none';
  }

  // Bottom Sheet Modal: Medicamentos Activos (Estilo Shotlee)
  const activeMedsBackdrop = document.getElementById('activeMedsBackdrop');
  const closeActiveMedsBtn = document.getElementById('closeActiveMedsBtn');
  const sheetMedTitle = document.getElementById('sheetMedTitle');
  const sheetMedColorDot = document.getElementById('sheetMedColorDot');
  const sheetMedSwitchLabel = document.getElementById('sheetMedSwitchLabel');
  const sheetMedActiveToggle = document.getElementById('sheetMedActiveToggle');
  const sheetColorBtn = document.getElementById('sheetColorBtn');
  const sheetColorPalette = document.getElementById('sheetColorPalette');
  const sheetReminderTimeBtn = document.getElementById('sheetReminderTimeBtn');
  const sheetReminderTimeLabel = document.getElementById('sheetReminderTimeLabel');
  const sheetTimeEditor = document.getElementById('sheetTimeEditor');
  const sheetCustomTimeInput = document.getElementById('sheetCustomTimeInput');
  const sheetSaveTimeBtn = document.getElementById('sheetSaveTimeBtn');
  const sheetSetClockAlarmBtn = document.getElementById('sheetSetClockAlarmBtn');
  const sheetEditScheduleRow = document.getElementById('sheetEditScheduleRow');
  const sheetScheduleEditor = document.getElementById('sheetScheduleEditor');
  const sheetDoseInput = document.getElementById('sheetDoseInput');
  const sheetFreqInput = document.getElementById('sheetFreqInput');
  const sheetDateInput = document.getElementById('sheetDateInput');
  const sheetSaveScheduleBtn = document.getElementById('sheetSaveScheduleBtn');

  if (dashConfigInjBtn) {
    dashConfigInjBtn.addEventListener('click', () => {
      triggerHaptic(16);
      const p = getHealthProfile();
      const med = p.activeMed || 'Retatrutida';
      const col = p.medColor || medDescriptor(p.activeMed).color;

      // Hora de la inyección semanal (independiente de la medicación diaria de tensión a las 21:30)
      let rcTime = null;
      try {
        const rc = JSON.parse(localStorage.getItem('mispep_reminder_config') || '{}');
        if (rc && rc.time) rcTime = rc.time;
      } catch (_) {}

      let rawInjTime = p.injReminderTime || rcTime;
      if (!rawInjTime && p.reminderTime && p.reminderTime !== '21:30') {
        rawInjTime = p.reminderTime;
      }
      const injTime = normalizeReminderTime(rawInjTime, '09:00');
      
      if (sheetMedTitle) sheetMedTitle.textContent = med;
      if (sheetMedColorDot) sheetMedColorDot.style.background = col;
      if (sheetMedSwitchLabel) sheetMedSwitchLabel.style.setProperty('--med-accent-color', col);
      if (sheetMedActiveToggle) sheetMedActiveToggle.checked = p.medActive !== false;
      if (sheetReminderTimeLabel) sheetReminderTimeLabel.textContent = injTime;
      if (sheetCustomTimeInput) sheetCustomTimeInput.value = injTime;
      if (sheetDoseInput) sheetDoseInput.value = p.nextDoseMg || 1.5;
      if (sheetFreqInput) sheetFreqInput.value = p.freqDays || 7;
      if (sheetDateInput) sheetDateInput.value = p.nextInjectionDate || '';

      if (activeMedsBackdrop) activeMedsBackdrop.classList.add('open');
    });
  }

  if (closeActiveMedsBtn) {
    closeActiveMedsBtn.addEventListener('click', () => {
      if (activeMedsBackdrop) activeMedsBackdrop.classList.remove('open');
    });
  }

  if (activeMedsBackdrop) {
    activeMedsBackdrop.addEventListener('click', (e) => {
      if (e.target === activeMedsBackdrop) {
        activeMedsBackdrop.classList.remove('open');
      }
    });
  }

  // Selector de Color
  if (sheetColorBtn) {
    sheetColorBtn.addEventListener('click', () => {
      toggleCard(sheetColorPalette);
    });
  }

  const colorPickBtns = document.querySelectorAll('.color-pick-btn');
  const currentMedColor = (getHealthProfile().medColor || '#8b5cf6').toLowerCase();
  colorPickBtns.forEach(btn => {
    // Marcar de entrada el color que ya tiene el medicamento
    if ((btn.dataset.color || '').toLowerCase() === currentMedColor) btn.classList.add('active');
    btn.addEventListener('click', () => {
      const col = btn.dataset.color;
      const p = getHealthProfile();
      p.medColor = col;
      saveProfile(p);
      colorPickBtns.forEach(b => b.classList.toggle('active', b === btn));

      if (sheetMedColorDot) sheetMedColorDot.style.background = col;
      if (sheetMedSwitchLabel) sheetMedSwitchLabel.style.setProperty('--med-accent-color', col);
      if (sheetColorPalette) sheetColorPalette.style.display = 'none';
      showToast(`✓ Color de ${p.activeMed} actualizado`);
    });
  });

  // Toggle Activar / Desactivar Medicamento en el panel
  if (sheetMedActiveToggle) {
    sheetMedActiveToggle.addEventListener('change', () => {
      const p = getHealthProfile();
      p.medActive = sheetMedActiveToggle.checked;
      saveProfile(p);
      showToast(p.medActive ? `✓ ${p.activeMed} visible en panel` : `✓ ${p.activeMed} oculto (historial conservado)`);
    });
  }

  // Hora de Recordatorio
  if (sheetReminderTimeBtn) {
    sheetReminderTimeBtn.addEventListener('click', () => {
      toggleCard(sheetTimeEditor);
    });
  }

  if (sheetSaveTimeBtn) {
    sheetSaveTimeBtn.addEventListener('click', () => {
      const t = sheetCustomTimeInput.value || '09:00';
      const p = getHealthProfile();
      p.injReminderTime = t;
      p.reminderTime = t;

      try {
        const rc = JSON.parse(localStorage.getItem('mispep_reminder_config') || '{}');
        rc.time = t;
        rc.med = p.activeMed || 'Retatrutida';
        rc.dose = p.nextDoseMg || 2;
        localStorage.setItem('mispep_reminder_config', JSON.stringify(rc));
      } catch (_) {}

      saveProfile(p);
      if (sheetReminderTimeLabel) sheetReminderTimeLabel.textContent = t;
      if (sheetTimeEditor) sheetTimeEditor.style.display = 'none';
      scheduleNextDoseAlarm();
      showToast(`✓ Hora de inyección semanal guardada: ${t}`);
    });
  }

  // Programar alarma directa en el Despertador nativo del móvil (sin depender de segundo plano)
  if (sheetSetClockAlarmBtn) {
    sheetSetClockAlarmBtn.addEventListener('click', () => {
      triggerHaptic(20);
      const p = getHealthProfile();
      const t = sheetCustomTimeInput.value || p.injReminderTime || '09:00';
      const med = p.activeMed || 'Retatrutida';
      const nextDateStr = p.nextInjectionDate || '';

      let dayOfWeek = 0;
      if (nextDateStr) {
        const d = new Date(nextDateStr + 'T12:00:00');
        if (!isNaN(d.getTime())) {
          dayOfWeek = d.getDay() + 1; // 1=Domingo, 2=Lunes, 3=Martes, 4=Miércoles...
        }
      }

      if (window.AndroidBridge && typeof window.AndroidBridge.setSystemClockAlarm === 'function') {
        const ok = window.AndroidBridge.setSystemClockAlarm(
          t,
          `💉 Inyección MisPep (${med})`,
          dayOfWeek
        );
        if (ok) {
          showToast(`✓ Abriendo el Despertador de tu móvil a las ${t}`);
        } else {
          showToast(`⚠️ No se pudo abrir la app de Reloj`);
        }
      } else {
        showToast(`⏰ Alarma interna programada a las ${t}`);
      }
    });
  }

  // Editar Horario
  if (sheetEditScheduleRow) {
    sheetEditScheduleRow.addEventListener('click', () => {
      toggleCard(sheetScheduleEditor);
    });
  }

  if (sheetSaveScheduleBtn) {
    sheetSaveScheduleBtn.addEventListener('click', () => {
      const p = getHealthProfile();
      p.nextDoseMg = parseFloat(sheetDoseInput.value) || 1.5;
      p.freqDays = parseInt(sheetFreqInput.value, 10) || 7;
      if (sheetDateInput.value) {
        p.nextInjectionDate = sheetDateInput.value;
      }
      saveProfile(p);
      scheduleNextDoseAlarm();
      if (sheetScheduleEditor) sheetScheduleEditor.style.display = 'none';
      if (activeMedsBackdrop) activeMedsBackdrop.classList.remove('open');
      showToast('✓ Horario y dosis actualizados');
    });
  }

  // ============================================================
  // BOTTOM SHEET MODAL: GESTIÓN Y EDICIÓN DE PESO (SHOTLEE STYLE)
  // ============================================================
  const weightBackdrop = document.getElementById('weightHistoryBackdrop');
  const closeWeightBtn = document.getElementById('closeWeightHistoryBtn');
  const weightSubtabs = document.querySelectorAll('#weightModalSubtabs .subtab-btn');
  const wtabRecords = document.getElementById('wtabViewRecords');
  const wtabAdd = document.getElementById('wtabViewAdd');
  const wtabSettings = document.getElementById('wtabViewSettings');
  const weightRecordsList = document.getElementById('weightRecordsList');

  const wFormHeaderTitle = document.getElementById('wFormHeaderTitle');
  const wEditIndex = document.getElementById('wEditIndex');
  const wInputWeight = document.getElementById('wInputWeight');
  const wInputDate = document.getElementById('wInputDate');
  const wSaveRecordBtn = document.getElementById('wSaveRecordBtn');
  const wCancelEditBtn = document.getElementById('wCancelEditBtn');

  const wProfileHeight = document.getElementById('wProfileHeight');
  const wProfileStartWeight = document.getElementById('wProfileStartWeight');
  const wProfileTargetWeight = document.getElementById('wProfileTargetWeight');
  const wSaveProfileBtn = document.getElementById('wSaveProfileBtn');

  const wGoalTarget = document.getElementById('wGoalTarget');
  const wGoalDone = document.getElementById('wGoalDone');
  const wGoalLeft = document.getElementById('wGoalLeft');
  const wGoalBarFill = document.getElementById('wGoalBarFill');
  const wGoalSummary = document.getElementById('wGoalSummary');
  const wGoalBadge = document.getElementById('wGoalBadge');

  // ============================================================
  // META DE PESO EN KG Y EVOLUCIÓN (% conseguido / % por bajar)
  // ============================================================
  const num = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };
  const getWeightFmt = (n) => {
    const isEn = (window.MISPEP_I18N && window.MISPEP_I18N.getLang ? window.MISPEP_I18N.getLang() === 'en' : (localStorage.getItem('mispep_lang') === 'en'));
    return isEn ? `${(n * 2.20462262).toFixed(1)} lb` : `${n.toFixed(1).replace('.', ',')} kg`;
  };
  const kgFmt = (n) => getWeightFmt(n);
  const pcFmt = (n) => `${Math.round(n)} %`;

  function renderWeightGoal() {
    if (!wGoalSummary) return;
    const isEn = (window.MISPEP_I18N && window.MISPEP_I18N.getLang ? window.MISPEP_I18N.getLang() === 'en' : (localStorage.getItem('mispep_lang') === 'en'));
    const p = getHealthProfile();

    const start = num(p.startWeight);
    const target = num(p.targetWeight);
    const logs = (p.weightLogs || []).slice()
      .sort((a, b) => new Date(b.date + 'T12:00:00') - new Date(a.date + 'T12:00:00'));
    const current = logs.length ? num(logs[0].weight) : num(p.currentWeight);

    // Sin datos suficientes
    if (!start || !target || !current) {
      if (wGoalTarget) wGoalTarget.textContent = target ? kgFmt(target) : '—';
      if (wGoalDone) wGoalDone.textContent = '—';
      if (wGoalLeft) wGoalLeft.textContent = '—';
      if (wGoalBarFill) wGoalBarFill.style.width = '0%';
      if (wGoalBadge) wGoalBadge.textContent = isEn ? 'No data' : 'Sin datos';
      wGoalSummary.innerHTML = isEn
        ? 'Log your current weight and your goal to see progress.'
        : 'Registra tu peso actual y tu meta para ver la evolución.';
      return;
    }

    const totalToLose = start - target;            // objetivo total (kg)
    const lost = start - current;                  // conseguido (kg)
    const left = current - target;                 // pendiente (kg)

    if (wGoalTarget) wGoalTarget.textContent = kgFmt(target);
    if (wGoalDone) {
      wGoalDone.textContent = `${lost >= 0 ? '' : '+'}${kgFmt(Math.abs(lost))}`;
      wGoalDone.style.color = lost >= 0 ? '#22d3ee' : '#f43f5e';
    }

    // Meta igual o superior al peso inicial: no hay nada que bajar
    if (totalToLose <= 0.05) {
      if (wGoalLeft) wGoalLeft.textContent = '—';
      if (wGoalBarFill) wGoalBarFill.style.width = '0%';
      if (wGoalBadge) {
        wGoalBadge.textContent = isEn ? 'Invalid goal' : 'Meta no válida';
        wGoalBadge.style.background = 'rgba(244,63,94,0.15)';
        wGoalBadge.style.color = '#fb7185';
      }
      wGoalSummary.innerHTML = isEn
        ? `Your goal (${kgFmt(target)}) is not lower than your starting weight (${kgFmt(start)}). Lower your goal to compute progress.`
        : `Tu meta (${kgFmt(target)}) no es inferior a tu peso de inicio (${kgFmt(start)}). Baja la meta para que la app calcule el progreso.`;
      return;
    }

    // Porcentajes
    let pct = (lost / totalToLose) * 100;
    pct = Math.max(0, Math.min(100, pct));
    const pctLeft = 100 - pct;
    const achieved = current <= target + 0.05;

    if (wGoalBarFill) {
      wGoalBarFill.style.width = `${pct.toFixed(1)}%`;
      wGoalBarFill.style.background = achieved
        ? 'linear-gradient(180deg, #34d399 0%, #059669 100%)'
        : 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)';
    }

    if (wGoalLeft) {
      wGoalLeft.textContent = achieved ? (isEn ? 'Goal reached!' : '¡Meta!') : kgFmt(Math.max(0, left));
      wGoalLeft.style.color = achieved ? '#34d399' : '#fbbf24';
    }

    if (wGoalBadge) {
      wGoalBadge.textContent = achieved ? (isEn ? 'Goal reached ✅' : 'Meta alcanzada ✅') : `${Math.round(pct)} % ${isEn ? 'achieved' : 'conseguido'}`;
      wGoalBadge.style.background = achieved ? 'rgba(16,185,129,0.18)' : 'rgba(56,189,248,0.15)';
      wGoalBadge.style.color = achieved ? '#34d399' : '#38bdf8';
    }

    if (achieved) {
      wGoalSummary.innerHTML = isEn
        ? `🎉 You reached your goal of <strong>${kgFmt(target)}</strong>. ` +
          `Total lost from start: <strong>${kgFmt(Math.max(0, lost))}</strong>` +
          (lost > totalToLose ? ` (${pcFmt(pct)} of goal)` : '') + `.`
        : `🎉 Has alcanzado tu meta de <strong>${kgFmt(target)}</strong>. ` +
          `Total bajado desde el inicio: <strong>${kgFmt(Math.max(0, lost))}</strong>` +
          (lost > totalToLose ? ` (${pcFmt(pct)} del objetivo)` : '') + `.`;
      return;
    }

    wGoalSummary.innerHTML = isEn
      ? `You lost <strong style="color:#22d3ee;">${kgFmt(Math.max(0, lost))}</strong> of your ` +
        `<strong>${kgFmt(totalToLose)}</strong> goal · ` +
        `<strong style="color:#38bdf8;">${pcFmt(pct)}</strong> achieved.<br>` +
        `Remaining: <strong style="color:#fbbf24;">${kgFmt(Math.max(0, left))}</strong> to reach ` +
        `<strong>${kgFmt(target)}</strong> (<strong>${pcFmt(pctLeft)}</strong> to go).`
      : `Has bajado <strong style="color:#22d3ee;">${kgFmt(Math.max(0, lost))}</strong> de los ` +
        `<strong>${kgFmt(totalToLose)}</strong> de tu objetivo · ` +
        `<strong style="color:#38bdf8;">${pcFmt(pct)}</strong> conseguido.<br>` +
        `Te quedan <strong style="color:#fbbf24;">${kgFmt(Math.max(0, left))}</strong> para llegar a ` +
        `<strong>${kgFmt(target)}</strong> (<strong>${pcFmt(pctLeft)}</strong> por bajar).`;
  }

  window.renderWeightGoal = renderWeightGoal;

  function openWeightModal(tab = 'records') {
    triggerHaptic(16);
    switchWeightTab(tab);
    renderWeightModalRecords();
    if (weightBackdrop) weightBackdrop.classList.add('open');
  }

  function closeWeightModal() {
    if (weightBackdrop) weightBackdrop.classList.remove('open');
  }

  if (closeWeightBtn) closeWeightBtn.addEventListener('click', closeWeightModal);
  if (weightBackdrop) {
    weightBackdrop.addEventListener('click', (e) => {
      if (e.target === weightBackdrop) closeWeightModal();
    });
  }

  function switchWeightTab(tabName) {
    weightSubtabs.forEach(btn => {
      if (btn.dataset.wtab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (wtabRecords) wtabRecords.style.display = tabName === 'records' ? 'block' : 'none';
    if (wtabAdd) wtabAdd.style.display = tabName === 'add' ? 'block' : 'none';
    if (wtabSettings) wtabSettings.style.display = tabName === 'settings' ? 'block' : 'none';

    if (tabName === 'settings') {
      const p = getHealthProfile();
      if (wProfileHeight) wProfileHeight.value = p.heightCm || '';
      if (wProfileStartWeight) wProfileStartWeight.value = p.startWeight || '';
      if (wProfileTargetWeight) wProfileTargetWeight.value = p.targetWeight || '';
      renderWeightGoal();
    }
  }

  weightSubtabs.forEach(btn => {
    btn.addEventListener('click', () => {
      triggerHaptic(12);
      switchWeightTab(btn.dataset.wtab);
    });
  });

  // Renderizar lista de registros de peso en el modal
  function renderWeightModalRecords() {
    if (!weightRecordsList) return;
    const isEn = (window.MISPEP_I18N && window.MISPEP_I18N.getLang ? window.MISPEP_I18N.getLang() === 'en' : (localStorage.getItem('mispep_lang') === 'en'));
    const LBS_PER_KG = 2.20462262;
    const toDisplayW = (kg) => isEn ? (kg * LBS_PER_KG) : kg;
    const wUnit = isEn ? 'lb' : 'kg';

    const p = getHealthProfile();
    let logs = p.weightLogs || [];

    if (logs.length === 0) {
      logs = [{ date: getLocalDateStr(), weight: p.currentWeight || 91.0 }];
      p.weightLogs = logs;
      saveProfile(p);
    }

    // Ordenar de más reciente a más antiguo
    const sorted = logs.map((item, idx) => ({ ...item, originalIndex: idx }))
                       .sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '';
    sorted.forEach((rec, idx) => {
      const d = new Date(rec.date + 'T12:00:00');
      const dateStr = d.toLocaleDateString(isEn ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      const dispW = toDisplayW(rec.weight).toFixed(1);

      // Calcular diferencia respecto al pesaje anterior si existe
      let diffHtml = '';
      if (idx < sorted.length - 1) {
        const prev = sorted[idx + 1].weight;
        const diff = (rec.weight - prev) * (isEn ? LBS_PER_KG : 1);
        if (diff < 0) {
          diffHtml = `<span style="color:#10b981; font-weight:800; font-size:0.75rem;">▼ ${Math.abs(diff).toFixed(1)} ${wUnit}</span>`;
        } else if (diff > 0) {
          diffHtml = `<span style="color:#ef4444; font-weight:800; font-size:0.75rem;">▲ ${diff.toFixed(1)} ${wUnit}</span>`;
        } else {
          diffHtml = `<span style="color:var(--text-muted); font-weight:700; font-size:0.75rem;">➔ 0.0 ${wUnit}</span>`;
        }
      }

      html += `
        <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:14px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="display:flex; align-items:baseline; gap:8px;">
              <span style="font-size:1.25rem; font-weight:900; color:var(--text-main);">${dispW} ${wUnit}</span>
              ${diffHtml}
            </div>
            <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-top:2px;">📅 ${dateStr}</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn-3d btn-3d-surface edit-wlog-btn" data-idx="${rec.originalIndex}" style="padding:6px 10px; font-size:0.75rem; border-radius:10px;">
              ✏️ ${isEn ? 'Edit' : 'Editar'}
            </button>
            <button type="button" class="icon-btn-3d del-wlog-btn" data-idx="${rec.originalIndex}" style="width:28px; height:28px; font-size:0.75rem; color:#ef4444;" title="${isEn ? 'Delete' : 'Borrar'}">
              🗑️
            </button>
          </div>
        </div>
      `;
    });

    weightRecordsList.innerHTML = html;

    // Eventos Editar
    weightRecordsList.querySelectorAll('.edit-wlog-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        triggerHaptic(14);
        const idx = parseInt(btn.dataset.idx, 10);
        const p = getHealthProfile();
        const rec = p.weightLogs[idx];
        if (rec) {
          wEditIndex.value = idx;
          wInputWeight.value = rec.weight.toFixed(1);
          wInputDate.value = rec.date;
          wFormHeaderTitle.textContent = `✏️ Modificar Pesaje (${rec.date})`;
          wCancelEditBtn.style.display = 'block';
          switchWeightTab('add');
        }
      });
    });

    // Eventos Borrar
    weightRecordsList.querySelectorAll('.del-wlog-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        triggerHaptic(14);
        const idx = parseInt(btn.dataset.idx, 10);
        const p = getHealthProfile();
        if (p.weightLogs && p.weightLogs.length > 1) {
          const removed = p.weightLogs.splice(idx, 1)[0];
          // Actualizar peso actual al más reciente
          const sorted = [...p.weightLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
          p.currentWeight = sorted[0].weight;
          saveProfile(p);
          renderWeightModalRecords();

          // Sincronizar en el Calendario
          if (removed) {
            let calEntries = JSON.parse(localStorage.getItem('mispep_calendar_entries') || '[]');
            calEntries = calEntries.filter(e => !(e.type === 'weight' && e.date === removed.date));
            localStorage.setItem('mispep_calendar_entries', JSON.stringify(calEntries));
            if (window.renderCalendar) window.renderCalendar();
          }

          showToast('Registro de peso eliminado');
        } else {
          showToast('Debe existir al menos un registro de peso base');
        }
      });
    });
  }

  // Guardar / Actualizar Registro
  if (wSaveRecordBtn) {
    wSaveRecordBtn.addEventListener('click', () => {
      const weight = parseFloat(wInputWeight.value);
      const date = wInputDate.value || getLocalDateStr();
      if (!weight || weight <= 0) {
        showToast('Introduce un peso válido');
        return;
      }

      const p = getHealthProfile();
      if (!p.weightLogs) p.weightLogs = [];
      const editIdx = parseInt(wEditIndex.value, 10);

      if (editIdx >= 0 && editIdx < p.weightLogs.length) {
        // Modo Edición
        p.weightLogs[editIdx] = { date, weight };
        showToast(`✓ Registro actualizado: ${weight.toFixed(1)} kg el ${date}`);
      } else {
        // Modo Añadir
        p.weightLogs.push({ date, weight });
        showToast(`✓ Nuevo pesaje guardado: ${weight.toFixed(1)} kg`);
      }

      // Ordenar y actualizar el peso actual con el más reciente
      p.weightLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
      const sorted = [...p.weightLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
      p.currentWeight = sorted[0].weight;

      // Sincronizar en el Calendario de la app
      const calEntries = JSON.parse(localStorage.getItem('mispep_calendar_entries') || '[]');
      const hM = (parseFloat(p.heightCm) || 170) / 100;
      const bmiVal = (weight / (hM * hM)).toFixed(1);
      const curTime = new Date().toTimeString().slice(0, 5);

      const existingCalIdx = calEntries.findIndex(e => e.type === 'weight' && e.date === date);
      if (existingCalIdx >= 0) {
        calEntries[existingCalIdx].title = `Peso: ${weight.toFixed(1)} kg`;
        calEntries[existingCalIdx].detail = `IMC actual ${bmiVal}`;
      } else {
        calEntries.unshift({
          id: 'weight-' + Date.now(),
          date: date,
          type: 'weight',
          title: `Peso: ${weight.toFixed(1)} kg`,
          detail: `IMC actual ${bmiVal}`,
          icon: '⚖️',
          time: curTime
        });
      }
      localStorage.setItem('mispep_calendar_entries', JSON.stringify(calEntries));
      if (window.renderCalendar) window.renderCalendar();

      saveProfile(p);
      wEditIndex.value = '-1';
      wFormHeaderTitle.textContent = 'Añadir o Editar Pesaje';
      wCancelEditBtn.style.display = 'none';
      switchWeightTab('records');
      renderWeightModalRecords();
    });
  }

  // ===== HEALTH CONNECT: traer datos de salud (peso y presión arterial) =====
  const hcImportBtn = document.getElementById('hcImportBtn');
  const hcBpImportBtn = document.getElementById('hcBpImportBtn');
  const dashImportHcBtn = document.getElementById('dashImportHcBtn');

  function hcDisponible() {
    try {
      return !!(window.AndroidBridge && typeof window.AndroidBridge.hayHealthConnect === 'function' && window.AndroidBridge.hayHealthConnect());
    } catch (e) { return false; }
  }

  function hcTienePermiso() {
    try {
      const pPeso = (typeof window.AndroidBridge.tienePermisoPesoHC === 'function' && window.AndroidBridge.tienePermisoPesoHC());
      const pBp = (typeof window.AndroidBridge.tienePermisoPresionHC === 'function' && window.AndroidBridge.tienePermisoPresionHC());
      return !!(pPeso || pBp);
    } catch (e) { return false; }
  }

  function refrescarBotonHealthConnect() {
    const isEn = (typeof currentLang !== 'undefined' ? currentLang === 'en' : document.documentElement.lang === 'en');
    const disp = hcDisponible();
    const perm = hcTienePermiso();
    const text = perm
      ? (isEn ? '⌚ Sync Health Connect data' : '⌚ Sincronizar datos de Health Connect')
      : (isEn ? '⌚ Connect with Health Connect' : '⌚ Conectar con Health Connect');

    if (hcImportBtn) {
      hcImportBtn.style.display = disp ? '' : 'none';
      hcImportBtn.textContent = text;
    }
    const bpBtn = document.getElementById('hcBpImportBtn');
    if (bpBtn) {
      bpBtn.style.display = disp ? '' : 'none';
      bpBtn.textContent = text;
    }
    if (dashImportHcBtn) {
      dashImportHcBtn.style.display = disp ? '' : 'none';
      dashImportHcBtn.title = isEn ? 'Sync Health Connect data' : 'Importar datos de Health Connect';
      dashImportHcBtn.setAttribute('aria-label', dashImportHcBtn.title);
    }
  }

  // Estado coordinado de sincronización Health Connect
  let hcSyncReport = {
    pending: 0,
    silencioso: false,
    timer: null,
    wDone: false,
    wNew: 0,
    wCorr: 0,
    wErr: null,
    bpDone: false,
    bpNew: 0,
    bpUpd: 0,
    bpAvg: false,
    bpErr: null
  };

  function iniciarSincronizacionHC(silencioso) {
    if (hcSyncReport.timer) clearTimeout(hcSyncReport.timer);
    hcSyncReport = {
      pending: 2,
      silencioso: !!silencioso,
      timer: null,
      wDone: false,
      wNew: 0,
      wCorr: 0,
      wErr: null,
      bpDone: false,
      bpNew: 0,
      bpUpd: 0,
      bpAvg: false,
      bpErr: null
    };

    hcSyncReport.timer = setTimeout(() => {
      finalizarSincronizacionHC(true);
    }, 4000);
  }

  function finalizarSincronizacionHC(forzado) {
    if (!hcSyncReport || hcSyncReport.pending < 0) return;
    if (hcSyncReport.timer) {
      clearTimeout(hcSyncReport.timer);
      hcSyncReport.timer = null;
    }
    hcSyncReport.pending = -1;

    if (hcSyncReport.silencioso) return;

    const isEn = (typeof currentLang !== 'undefined' ? currentLang === 'en' : document.documentElement.lang === 'en');
    const wN = hcSyncReport.wNew;
    const bpN = hcSyncReport.bpNew;
    const hasMedias = hcSyncReport.bpAvg;

    // Error específico de permiso de tensión arterial
    if (hcSyncReport.bpErr && (String(hcSyncReport.bpErr).includes('SecurityException') || String(hcSyncReport.bpErr).includes('permission'))) {
      showToast(isEn ? 'Health Connect: Blood pressure permission needed in settings' : 'Health Connect: Falta activar permiso de Tensión arterial');
      try { window.AndroidBridge.abrirAjustesHC(); } catch (e) {}
      return;
    }

    if (wN > 0 && bpN > 0) {
      const msg = isEn
        ? `✓ ${wN} weight log(s) and ${bpN} blood pressure reading(s) imported${hasMedias ? ' (15-min averages)' : ''}`
        : `✓ ${wN} pesaje(s) y ${bpN} toma(s) de tensión importadas${hasMedias ? ' (medias en 15 min)' : ''}`;
      showToast(msg);
      return;
    }

    if (wN > 0) {
      const msg = isEn
        ? `✓ ${wN} weight log(s) imported · No new blood pressure readings`
        : `✓ ${wN} pesaje(s) importados · Sin mediciones de tensión nuevas`;
      showToast(msg);
      return;
    }

    if (bpN > 0) {
      const msg = isEn
        ? `✓ ${bpN} blood pressure reading(s) imported${hasMedias ? ' (15-min averages)' : ''} · No new weight logs`
        : `✓ ${bpN} toma(s) de tensión importadas${hasMedias ? ' (medias en 15 min)' : ''} · Sin pesajes nuevos`;
      showToast(msg);
      return;
    }

    // Ni pesajes ni tensión nuevos
    const msg = isEn
      ? 'Health Connect up to date: No new weight or blood pressure logs'
      : 'Health Connect al día: Sin pesajes ni mediciones de tensión nuevas';
    showToast(msg);
  }

  function importarPesosHealthConnect(silencioso) {
    if (!hcDisponible()) {
      if (!silencioso) {
        const isEn = (typeof currentLang !== 'undefined' ? currentLang === 'en' : document.documentElement.lang === 'en');
        showToast(isEn ? 'Health Connect is not available on this device' : 'Health Connect no está disponible en este móvil');
      }
      return;
    }
    if (!hcTienePermiso()) {
      if (silencioso) return;
      const isEn = (typeof currentLang !== 'undefined' ? currentLang === 'en' : document.documentElement.lang === 'en');
      showToast(isEn ? 'Grant access to read your health data' : 'Concede el acceso para leer tus datos de salud');
      try { window.AndroidBridge.pedirPermisoPesoHC(); } catch (e) {}
      return;
    }
    iniciarSincronizacionHC(silencioso);
    try {
      // Sincronización simultánea de peso y presión arterial
      window.AndroidBridge.leerPesosHC(180);
      if (typeof window.AndroidBridge.leerPresionHC === 'function') {
        window.AndroidBridge.leerPresionHC(180);
      }
    } catch (e) {
      finalizarSincronizacionHC(true);
      showToast('No se pudo consultar Health Connect');
    }
  }
  window.importarPesosHealthConnect = importarPesosHealthConnect;

  // Agrupa mediciones separadas por como máximo 15 minutos y calcula la media clínica
  function clusterAndAverageBpReadings(rawReadings) {
    if (!Array.isArray(rawReadings) || rawReadings.length === 0) return [];

    const valid = [];
    rawReadings.forEach(r => {
      const sys = parseInt(r.sys, 10);
      const dia = parseInt(r.dia, 10);
      const pulse = parseInt(r.pulse, 10) || 0;
      if (!sys || !dia || sys <= 0 || dia <= 0) return;

      let timeMs = r.timestamp ? Number(r.timestamp) : NaN;
      if (isNaN(timeMs) || timeMs <= 0) {
        const datePart = r.fechaLocal || String(r.fecha || '').slice(0, 10);
        const timePart = r.hora || '12:00';
        timeMs = new Date(`${datePart}T${timePart}:00`).getTime();
      }
      if (isNaN(timeMs) || timeMs <= 0) return;

      valid.push({
        timestamp: timeMs,
        sys: sys,
        dia: dia,
        pulse: pulse,
        origen: r.origen || 'Health Connect'
      });
    });

    if (valid.length === 0) return [];

    // Ordenar cronológicamente
    valid.sort((a, b) => a.timestamp - b.timestamp);

    // Agrupar mediciones separadas por como máximo 15 minutos (900.000 ms)
    const MAX_GAP_MS = 15 * 60 * 1000;
    const clusters = [];
    let currentCluster = [valid[0]];

    for (let i = 1; i < valid.length; i++) {
      const prev = currentCluster[currentCluster.length - 1];
      const curr = valid[i];
      if (curr.timestamp - prev.timestamp <= MAX_GAP_MS) {
        currentCluster.push(curr);
      } else {
        clusters.push(currentCluster);
        currentCluster = [curr];
      }
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    // Calcular la media de cada grupo de mediciones
    return clusters.map(cluster => {
      const count = cluster.length;
      let sumSys = 0;
      let sumDia = 0;
      let sumTime = 0;
      let sumPulse = 0;
      let pulseCount = 0;

      cluster.forEach(item => {
        sumSys += item.sys;
        sumDia += item.dia;
        sumTime += item.timestamp;
        if (item.pulse > 0) {
          sumPulse += item.pulse;
          pulseCount++;
        }
      });

      const avgSys = Math.round(sumSys / count);
      const avgDia = Math.round(sumDia / count);
      const avgTimeMs = Math.round(sumTime / count);
      const avgPulse = pulseCount > 0 ? Math.round(sumPulse / pulseCount) : 0;

      const dAvg = new Date(avgTimeMs);
      const fecha = getLocalDateStr(dAvg);
      const hh = String(dAvg.getHours()).padStart(2, '0');
      const mm = String(dAvg.getMinutes()).padStart(2, '0');
      const hora = `${hh}:${mm}`;

      return {
        date: fecha,
        time: hora,
        sys: avgSys,
        dia: avgDia,
        pulse: avgPulse || 68,
        timestamp: avgTimeMs,
        samplesCount: count,
        origen: cluster[0].origen || 'Health Connect'
      };
    });
  }

  // Fusiona las lecturas promediadas de presión arterial con las ya registradas en MisPep
  function aplicarPresionHealthConnect(registrosHC) {
    if (!Array.isArray(registrosHC) || registrosHC.length === 0) {
      hcSyncReport.bpDone = true;
      hcSyncReport.bpNew = 0;
      hcSyncReport.pending--;
      if (hcSyncReport.pending === 0) finalizarSincronizacionHC(false);
      return;
    }

    const promediados = clusterAndAverageBpReadings(registrosHC);
    if (promediados.length === 0) {
      hcSyncReport.bpDone = true;
      hcSyncReport.bpNew = 0;
      hcSyncReport.pending--;
      if (hcSyncReport.pending === 0) finalizarSincronizacionHC(false);
      return;
    }

    let logs = getBpLogs();
    const calEntries = JSON.parse(localStorage.getItem('mispep_calendar_entries') || '[]');
    let nuevos = 0, actualizados = 0;

    promediados.forEach(p => {
      // Buscar si ya existe una toma en la misma fecha y hora (margen de 15 min)
      const existingIdx = logs.findIndex(l => {
        if (l.date !== p.date) return false;
        const [lh, lm] = (l.time || '00:00').split(':').map(Number);
        const [ph, pm] = (p.time || '00:00').split(':').map(Number);
        const diffMins = Math.abs((lh * 60 + lm) - (ph * 60 + pm));
        return diffMins <= 15;
      });

      if (existingIdx >= 0) {
        const cur = logs[existingIdx];
        if (cur.sys !== p.sys || cur.dia !== p.dia || (p.pulse > 0 && cur.pulse !== p.pulse)) {
          cur.sys = p.sys;
          cur.dia = p.dia;
          if (p.pulse > 0) cur.pulse = p.pulse;
          cur.origen = p.origen;
          actualizados++;
        }
      } else {
        // Heredar medicación antihipertensiva si existe pauta previa
        const lastWithMeds = [...logs].reverse().find(l => Array.isArray(l.meds) && l.meds.length > 0);
        const medsToInherit = lastWithMeds
          ? lastWithMeds.meds.map(m => ({ name: m.name, doseMg: m.doseMg, time: m.time || '21:30' }))
          : [];

        const newLog = {
          id: 'bp-hc-' + p.date + '-' + p.time.replace(':', ''),
          date: p.date,
          time: p.time,
          sys: p.sys,
          dia: p.dia,
          pulse: p.pulse,
          meds: medsToInherit,
          origen: p.origen
        };
        logs.push(newLog);
        nuevos++;

        // Sincronizar con calendario
        const calId = 'bp-hc-' + p.date + '-' + p.time.replace(':', '');
        const existingCalIdx = calEntries.findIndex(e => e.id === calId || (e.type === 'bp' && e.date === p.date && e.time === p.time));
        const titulo = `${p.sys}/${p.dia} mmHg`;
        const detalle = `Pulso: ${p.pulse} ppm · Health Connect${p.samplesCount > 1 ? ` (media de ${p.samplesCount} tomas)` : ''}`;
        if (existingCalIdx >= 0) {
          calEntries[existingCalIdx].title = titulo;
          calEntries[existingCalIdx].detail = detalle;
        } else {
          calEntries.unshift({
            id: calId,
            date: p.date,
            type: 'bp',
            title: titulo,
            detail: detalle,
            icon: '❤️',
            time: p.time
          });
        }
      }
    });

    if (!nuevos && !actualizados) {
      hcSyncReport.bpDone = true;
      hcSyncReport.bpNew = 0;
      hcSyncReport.pending--;
      if (hcSyncReport.pending === 0) finalizarSincronizacionHC(false);
      return;
    }

    logs.sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));
    saveBpLogs(logs);
    localStorage.setItem('mispep_calendar_entries', JSON.stringify(calEntries));

    if (window.renderCalendar) window.renderCalendar();
    if (typeof renderBpGraph === 'function') renderBpGraph();
    if (typeof renderBpDashboard === 'function') renderBpDashboard();
    if (typeof renderBpHistoryList === 'function') renderBpHistoryList();

    hcSyncReport.bpDone = true;
    hcSyncReport.bpNew = nuevos;
    hcSyncReport.bpUpd = actualizados;
    hcSyncReport.bpAvg = promediados.some(pr => pr.samplesCount > 1);
    hcSyncReport.pending--;
    if (hcSyncReport.pending === 0) finalizarSincronizacionHC(false);
  }

  // Fusiona los pesajes recibidos con los que ya tiene MisPep (sin duplicar fechas)
  function aplicarPesosHealthConnect(registros) {
    const p = getHealthProfile();
    if (!p.weightLogs) p.weightLogs = [];
    const hM = (parseFloat(p.heightCm) || 170) / 100;
    const calEntries = JSON.parse(localStorage.getItem('mispep_calendar_entries') || '[]');
    let nuevos = 0, corregidos = 0;

    registros.forEach(r => {
      const fecha = r.fechaLocal || String(r.fecha || '').slice(0, 10);
      const peso = Math.round(parseFloat(r.peso) * 10) / 10;
      if (!fecha || !peso) return;

      const idx = p.weightLogs.findIndex(l => String(l.date || '').slice(0, 10) === fecha);
      if (idx >= 0) {
        if (Math.abs(parseFloat(p.weightLogs[idx].weight) - peso) >= 0.05) {
          p.weightLogs[idx].weight = peso;
          corregidos++;
        }
      } else {
        p.weightLogs.push({ date: fecha, weight: peso, origen: r.origen || 'Health Connect' });
        nuevos++;
      }

      const titulo = 'Peso: ' + peso.toFixed(1) + ' kg';
      const detalle = 'IMC actual ' + (peso / (hM * hM)).toFixed(1) + ' · Health Connect';
      const ci = calEntries.findIndex(e => e.type === 'weight' && String(e.date || '').slice(0, 10) === fecha);
      if (ci >= 0) {
        calEntries[ci].title = titulo;
        calEntries[ci].detail = detalle;
      } else {
        calEntries.unshift({
          id: 'weight-hc-' + fecha,
          date: fecha,
          type: 'weight',
          title: titulo,
          detail: detalle,
          icon: '⚖️',
          time: r.hora || '09:00'
        });
      }
    });

    if (!nuevos && !corregidos) {
      hcSyncReport.wDone = true;
      hcSyncReport.wNew = 0;
      hcSyncReport.wCorr = 0;
      hcSyncReport.pending--;
      if (hcSyncReport.pending === 0) finalizarSincronizacionHC(false);
      return;
    }

    p.weightLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
    const orden = [...p.weightLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
    p.currentWeight = orden[0].weight;
    saveProfile(p);
    localStorage.setItem('mispep_calendar_entries', JSON.stringify(calEntries));

    if (window.renderCalendar) window.renderCalendar();
    renderWeightModalRecords();
    renderWeightGoal();
    renderDashboard();
    if (typeof renderWeightGraph === 'function') renderWeightGraph();
    refrescarBotonHealthConnect();

    hcSyncReport.wDone = true;
    hcSyncReport.wNew = nuevos;
    hcSyncReport.wCorr = corregidos;
    hcSyncReport.pending--;
    if (hcSyncReport.pending === 0) finalizarSincronizacionHC(false);
  }

  // Estas dos funciones las llama el código nativo (Java)
  window.mispepPesosHC = function (registros, error) {
    if (error) {
      hcSyncReport.wDone = true;
      hcSyncReport.wErr = error;
      hcSyncReport.pending--;
      if (hcSyncReport.pending === 0) finalizarSincronizacionHC(false);
      return;
    }
    aplicarPesosHealthConnect(Array.isArray(registros) ? registros : []);
  };

  window.mispepPermisoHC = function (concedido) {
    if (concedido) {
      refrescarBotonHealthConnect();
      importarPesosHealthConnect(false);
    } else {
      showToast('Sin permiso no se pueden leer los datos de salud');
    }
  };

  window.mispepPresionHC = function (registros, error) {
    if (error) {
      hcSyncReport.bpDone = true;
      hcSyncReport.bpErr = error;
      hcSyncReport.pending--;
      if (hcSyncReport.pending === 0) finalizarSincronizacionHC(false);
      return;
    }
    aplicarPresionHealthConnect(Array.isArray(registros) ? registros : []);
  };

  if (hcImportBtn) {
    hcImportBtn.addEventListener('click', () => {
      triggerHaptic(12);
      importarPesosHealthConnect(false);
    });
  }

  const hcBpImportBtnEl = document.getElementById('hcBpImportBtn');
  if (hcBpImportBtnEl) {
    hcBpImportBtnEl.addEventListener('click', () => {
      triggerHaptic(12);
      importarPesosHealthConnect(false);
    });
  }

  if (dashImportHcBtn) {
    dashImportHcBtn.addEventListener('click', () => {
      triggerHaptic(12);
      importarPesosHealthConnect(false);
    });
  }
  refrescarBotonHealthConnect();

  // Al abrir la app: si hay permiso se traen solos los pesajes nuevos; si no,
  // se pide una vez (y como mucho se vuelve a preguntar cada 7 días).
  setTimeout(() => {
    refrescarBotonHealthConnect();
    if (!hcDisponible()) return;
    if (hcTienePermiso()) {
      importarPesosHealthConnect(true);
      return;
    }
    // Se pide una vez por apertura de la app mientras falte el permiso
    if (!window.__hcPedidoEnEstaSesion) {
      window.__hcPedidoEnEstaSesion = true;
      try { localStorage.setItem('mispep_hc_pedido', new Date().toISOString()); } catch (e) {}
      importarPesosHealthConnect(false);
    }
  }, 6000);

  if (wCancelEditBtn) {
    wCancelEditBtn.addEventListener('click', () => {
      wEditIndex.value = '-1';
      wFormHeaderTitle.textContent = 'Añadir o Editar Pesaje';
      wCancelEditBtn.style.display = 'none';
      switchWeightTab('records');
    });
  }

  // Guardar Perfil Clínico (Altura y Peso Inicial)
  if (wSaveProfileBtn) {
    wSaveProfileBtn.addEventListener('click', () => {
      const h = parseInt(wProfileHeight.value, 10) || 170;
      const sw = parseFloat(wProfileStartWeight.value) || 91.0;
      const tw = wProfileTargetWeight ? parseFloat(wProfileTargetWeight.value) : NaN;
      const p = getHealthProfile();
      p.heightCm = h;
      p.startWeight = sw;
      if (!isNaN(tw)) p.targetWeight = tw;
      saveProfile(p);
      renderWeightGoal();
      showToast('✓ Altura, peso inicial y meta guardados');
      if (window.renderWeightGraph) window.renderWeightGraph();
    });
  }

  // Conectar botones del Dashboard a este Bottom Sheet Modal
  if (dashAddWeightBtn) {
    dashAddWeightBtn.addEventListener('click', () => {
      wEditIndex.value = '-1';
      wFormHeaderTitle.textContent = '＋ Registrar Nuevo Pesaje';
      wInputWeight.value = (getHealthProfile().currentWeight || 91.0).toFixed(1);
      wInputDate.value = getLocalDateStr();
      wCancelEditBtn.style.display = 'none';
      openWeightModal('add');
    });
  }

  if (dashLogWeightBtn) {
    dashLogWeightBtn.addEventListener('click', () => {
      wEditIndex.value = '-1';
      wFormHeaderTitle.textContent = '＋ Registrar Nuevo Pesaje';
      wInputWeight.value = (getHealthProfile().currentWeight || 91.0).toFixed(1);
      wInputDate.value = getLocalDateStr();
      wCancelEditBtn.style.display = 'none';
      openWeightModal('add');
    });
  }

  if (dashConfigHealthBtn) {
    dashConfigHealthBtn.addEventListener('click', () => {
      openWeightModal('settings');
    });
  }

  // Al pulsar sobre las tarjetas de peso o IMC en el dashboard, abrir el modal de historial
  document.querySelectorAll('.health-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      openWeightModal('records');
    });
  });

  // ============================================================
  // GRÁFICA DE EVOLUCIÓN DE PRESIÓN ARTERIAL (SISTÓLICA Y DIASTÓLICA)
  // ============================================================
  const bpSvgContainer = document.getElementById('bpSvgContainer');
  const bpGraphTimeframeBtns = document.querySelectorAll('#bpGraphTimeframe .subtab-btn');
  const bpGraphDateRangeLabel = document.getElementById('bpGraphDateRangeLabel');
  const bpGraphPrevRange = document.getElementById('bpGraphPrevRange');
  const bpGraphNextRange = document.getElementById('bpGraphNextRange');
  const bpLogDirectBtn = document.getElementById('bpLogDirectBtn');
  const bpScrubberInfo = document.getElementById('bpScrubberInfo');

  const bpSheetBackdrop = document.getElementById('bpSheetBackdrop');
  const closeBpSheetBtn = document.getElementById('closeBpSheetBtn');
  const bpModalTabs = document.querySelectorAll('#bpModalTabs .subtab-btn');
  const bpTabNew = document.getElementById('bpTabNew');
  const bpTabList = document.getElementById('bpTabList');
  const bpHistoryListContainer = document.getElementById('bpHistoryListContainer');

  const bpInputDate = document.getElementById('bpInputDate');
  const bpInputTime = document.getElementById('bpInputTime');
  const bpInputSys = document.getElementById('bpInputSys');
  const bpInputDia = document.getElementById('bpInputDia');
  const bpInputPulse = document.getElementById('bpInputPulse');
  const bpMedsListContainer = document.getElementById('bpMedsListContainer');
  const bpAddMedRowBtn = document.getElementById('bpAddMedRowBtn');
  const bpSaveBtn = document.getElementById('bpSaveBtn');

  const dashBpSysVal = document.getElementById('dashBpSysVal');
  const dashBpDiaVal = document.getElementById('dashBpDiaVal');
  const dashBpStatusVal = document.getElementById('dashBpStatusVal');

  const bpZoomSheetBackdrop = document.getElementById('bpZoomSheetBackdrop');
  const closeBpZoomSheetBtn = document.getElementById('closeBpZoomSheetBtn');
  const bpZoomPrevDayBtn = document.getElementById('bpZoomPrevDayBtn');
  const bpZoomNextDayBtn = document.getElementById('bpZoomNextDayBtn');
  const bpZoomFocusDateLabel = document.getElementById('bpZoomFocusDateLabel');
  const bpZoomFocusSubLabel = document.getElementById('bpZoomFocusSubLabel');
  const bpZoomSvgContainer = document.getElementById('bpZoomSvgContainer');
  const bpZoomCardsContainer = document.getElementById('bpZoomCardsContainer');
  let currentBpZoomDate = null;

  const bpMedTimeModalBackdrop = document.getElementById('bpMedTimeModalBackdrop');
  const closeBpMedTimeModalBtn = document.getElementById('closeBpMedTimeModalBtn');
  const bpMedTimeTargetMedName = document.getElementById('bpMedTimeTargetMedName');
  const bpMedTimeDisplay = document.getElementById('bpMedTimeDisplay');
  const bpMedTimeHourMinus = document.getElementById('bpMedTimeHourMinus');
  const bpMedTimeHourInput = document.getElementById('bpMedTimeHourInput');
  const bpMedTimeHourPlus = document.getElementById('bpMedTimeHourPlus');
  const bpMedTimeMinMinus = document.getElementById('bpMedTimeMinMinus');
  const bpMedTimeMinInput = document.getElementById('bpMedTimeMinInput');
  const bpMedTimeMinPlus = document.getElementById('bpMedTimeMinPlus');
  const bpMedTimeApplyBtn = document.getElementById('bpMedTimeApplyBtn');

  let bpMedTimeTargetIdx = -1;
  let bpMedTimeDirectLogId = null;
  let currentMedHour = 21;
  let currentMedMin = 30;

  let currentBpRange = '1m';
  let bpRangeOffset = 0;
  let draftBpMeds = [];

  // Comparador clínico de medicación antihipertensiva entre dos tomas
  function compareMeds(prevMeds, currMeds) {
    const prev = Array.isArray(prevMeds) ? prevMeds.filter(m => (m.name || '').trim()) : [];
    const curr = Array.isArray(currMeds) ? currMeds.filter(m => (m.name || '').trim()) : [];

    if (prev.length === 0 && curr.length === 0) return null;

    if (prev.length === 0 && curr.length > 0) {
      const addedList = curr.map(m => `${m.name} ${m.doseMg}mg`).join(', ');
      return { type: '+', detail: `Inicio: +${addedList}`, summary: '+ Medicación añadida' };
    }
    if (prev.length > 0 && curr.length === 0) {
      const removedList = prev.map(m => `${m.name} ${m.doseMg}mg`).join(', ');
      return { type: '-', detail: `Retirada: -${removedList}`, summary: '- Medicación retirada' };
    }

    const prevMap = {};
    prev.forEach(m => { prevMap[m.name.trim().toLowerCase()] = { name: m.name.trim(), dose: parseFloat(m.doseMg) || 0 }; });
    const currMap = {};
    curr.forEach(m => { currMap[m.name.trim().toLowerCase()] = { name: m.name.trim(), dose: parseFloat(m.doseMg) || 0 }; });

    let increases = [];
    let decreases = [];

    for (const k in currMap) {
      if (!prevMap[k]) {
        increases.push(`+ ${currMap[k].name} (${currMap[k].dose}mg)`);
      } else {
        const diff = currMap[k].dose - prevMap[k].dose;
        if (diff > 0) increases.push(`+ ${currMap[k].name} (+${diff}mg)`);
        else if (diff < 0) decreases.push(`- ${currMap[k].name} (${diff}mg)`);
      }
    }
    for (const k in prevMap) {
      if (!currMap[k]) {
        decreases.push(`- ${prevMap[k].name} retirado (antes ${prevMap[k].dose}mg)`);
      }
    }

    if (increases.length === 0 && decreases.length === 0) return null;
    if (decreases.length > 0 && increases.length === 0) {
      return { type: '-', detail: decreases.join(' · '), summary: '- Reducción / Retirada' };
    }
    if (increases.length > 0 && decreases.length === 0) {
      return { type: '+', detail: increases.join(' · '), summary: '+ Aumento de dosis' };
    }
    return { type: '+', detail: `${increases.join(' · ')} | ${decreases.join(' · ')}`, summary: '± Ajuste' };
  }

  function getBpLogs() {
    let logs = [];
    const raw = localStorage.getItem('mispep_bp_logs');
    if (raw) {
      try {
        logs = JSON.parse(raw);
        if (!Array.isArray(logs)) logs = [];
      } catch(_) {
        logs = [];
      }
    }

    // Unificar con lecturas reales del calendario
    const calEntries = JSON.parse(localStorage.getItem('mispep_calendar_entries') || '[]');
    calEntries.forEach(e => {
      if (e.type === 'bp' && e.date) {
        const match = (e.title || '').match(/(\d+)\s*\/\s*(\d+)/);
        if (match) {
          const s = parseInt(match[1], 10);
          const d = parseInt(match[2], 10);
          const pMatch = (e.detail || '').match(/(\d+)\s*ppm/);
          const p = pMatch ? parseInt(pMatch[1], 10) : 68;
          const eTime = e.time || '09:00';
          if (!logs.some(l => l.id === e.id || (l.date === e.date && l.time === eTime))) {
            logs.push({
              id: e.id || 'bp-' + e.date + '-' + eTime.replace(':', ''),
              date: e.date,
              time: eTime,
              sys: s,
              dia: d,
              pulse: p,
              meds: []
            });
          }
        }
      }
    });

    // Orden cronológico exacto: fecha + hora
    logs.sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));
    return logs;
  }

  function saveBpLogs(logs) {
    localStorage.setItem('mispep_bp_logs', JSON.stringify(logs));
    renderBpGraph();
  }

  // Propagación hacia adelante: copia la medicación en tomas posteriores que estén vacías
  function propagateMedsForward(logs, fromIdx) {
    if (fromIdx < 0 || fromIdx >= logs.length) return 0;
    const sourceMeds = logs[fromIdx].meds || [];
    if (!Array.isArray(sourceMeds) || sourceMeds.length === 0) return 0;

    let propagatedCount = 0;
    for (let j = fromIdx + 1; j < logs.length; j++) {
      const targetMeds = logs[j].meds;
      const isEmpty = !Array.isArray(targetMeds) || targetMeds.length === 0 || targetMeds.every(m => !(m.name || '').trim());
      if (isEmpty) {
        logs[j].meds = sourceMeds.map(m => ({ name: m.name, doseMg: m.doseMg, time: m.time || '21:30' }));
        propagatedCount++;
      } else {
        // Se detiene al llegar a la siguiente toma que ya tenga medicación anotada
        break;
      }
    }
    return propagatedCount;
  }

  const bpEditId = document.getElementById('bpEditId');
  const bpTabNewBtn = document.getElementById('bpTabNewBtn');

  // Abre el formulario en modo edición para una toma concreta
  function openBpEditModal(id) {
    const logs = getBpLogs();
    const item = logs.find(l => l.id === id);
    if (!item) return;

    if (bpEditId) bpEditId.value = item.id;
    if (bpInputDate) bpInputDate.value = item.date;
    if (bpInputTime) bpInputTime.value = item.time || '09:00';
    if (bpInputSys) bpInputSys.value = item.sys;
    if (bpInputDia) bpInputDia.value = item.dia;
    if (bpInputPulse) bpInputPulse.value = item.pulse || 70;

    if (item.meds && Array.isArray(item.meds)) {
      draftBpMeds = item.meds.map(m => ({ name: m.name, doseMg: m.doseMg, time: m.time || '21:30' }));
    } else {
      draftBpMeds = [];
    }
    renderBpMedRows();

    if (bpTabNewBtn) bpTabNewBtn.textContent = '✏️ Editar Lectura';
    if (bpSaveBtn) bpSaveBtn.textContent = '✓ Guardar Cambios';

    bpModalTabs.forEach(b => b.classList.remove('active'));
    if (bpTabNewBtn) bpTabNewBtn.classList.add('active');
    bpTabNew.style.display = 'block';
    bpTabList.style.display = 'none';

    if (bpSheetBackdrop) bpSheetBackdrop.classList.add('open');
  }

  // Prepara el formulario para una nueva lectura, heredando de la sesión anterior
  // los valores (tensión y pulso) y la medicación
  function prepareNewBpForm() {
    if (bpEditId) bpEditId.value = '';
    if (bpTabNewBtn) bpTabNewBtn.textContent = '＋ Nueva Lectura';
    if (bpSaveBtn) bpSaveBtn.textContent = '✓ Guardar Presión Arterial';

    if (bpInputDate) bpInputDate.value = getLocalDateStr();
    if (bpInputTime) bpInputTime.value = new Date().toTimeString().slice(0, 5);

    const logs = getBpLogs();
    if (logs.length > 0) {
      const last = logs[logs.length - 1];
      // Valores por defecto = sesión anterior (última lectura anotada)
      if (bpInputSys) bpInputSys.value = last.sys || 120;
      if (bpInputDia) bpInputDia.value = last.dia || 80;
      if (bpInputPulse) bpInputPulse.value = last.pulse || 70;
      if (last.meds && Array.isArray(last.meds) && last.meds.length > 0) {
        draftBpMeds = last.meds.map(m => ({ name: m.name, doseMg: m.doseMg, time: m.time || '21:30' }));
      } else {
        draftBpMeds = [];
      }
    } else {
      if (bpInputSys) bpInputSys.value = 120;
      if (bpInputDia) bpInputDia.value = 80;
      if (bpInputPulse) bpInputPulse.value = 70;
      draftBpMeds = [];
    }
    renderBpMedRows();
  }

  function renderBpMedRows() {
    if (!bpMedsListContainer) return;
    if (draftBpMeds.length === 0) {
      bpMedsListContainer.innerHTML = `
        <div style="font-size:0.75rem; color:var(--text-muted); font-style:italic; padding:6px 0;">
          Sin medicación antihipertensiva añadida. Pulsa "＋ Añadir Fármaco" para incluir uno.
        </div>
      `;
      return;
    }

    let html = `
      <div style="display:flex; align-items:center; gap:6px; font-size:0.68rem; color:var(--text-muted); font-weight:800; padding:0 2px 2px 2px; text-transform:uppercase;">
        <span style="flex:1;">Fármaco</span>
        <span style="width:58px; text-align:center;">Dosis</span>
        <span style="width:84px; text-align:center;">⏰ Toma</span>
        <span style="width:28px;"></span>
      </div>
    `;
    draftBpMeds.forEach((m, idx) => {
      html += `
        <div class="bp-med-row" data-idx="${idx}" style="display:flex; align-items:center; gap:6px;">
          <input type="text" class="bp-med-name-input" list="antihipertensivosList" placeholder="Fármaco (ej. Telmisartán)" value="${m.name || ''}" style="flex:1; min-width:0; background:var(--card-bg-elevated); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; padding:7px 8px; font-size:0.84rem; font-weight:700;">
          <div style="display:flex; align-items:center; gap:2px; flex-shrink:0;">
            <input type="number" class="bp-med-dose-input" placeholder="MG" value="${m.doseMg !== undefined ? m.doseMg : ''}" min="0" step="0.5" style="width:52px; background:var(--card-bg-elevated); color:#ffffff; border:1.5px solid rgba(6,182,212,0.4); border-radius:8px; padding:7px 4px; font-size:0.85rem; font-weight:800; text-align:center;">
            <span style="font-size:0.7rem; color:var(--text-muted); font-weight:700;">mg</span>
          </div>
          <button type="button" class="btn-3d btn-3d-surface bp-med-time-btn" data-idx="${idx}" style="width:84px; flex-shrink:0; padding:6px 4px; font-size:0.8rem; font-weight:800; color:#06b6d4; border:1.5px solid rgba(6,182,212,0.4); border-radius:8px; display:flex; align-items:center; justify-content:center; gap:4px;" title="Toca para cambiar la hora de la toma">
            <span>⏰</span>
            <span class="bp-med-time-text">${m.time || '21:30'}</span>
          </button>
          <button type="button" class="icon-btn-3d bp-del-med-row-btn" data-idx="${idx}" style="width:28px; height:28px; color:#ef4444; flex-shrink:0;" title="Quitar fármaco">✕</button>
        </div>
      `;
    });
    bpMedsListContainer.innerHTML = html;

    bpMedsListContainer.querySelectorAll('.bp-med-name-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const row = e.target.closest('.bp-med-row');
        const idx = parseInt(row.dataset.idx, 10);
        if (draftBpMeds[idx]) draftBpMeds[idx].name = e.target.value;
      });
    });
    bpMedsListContainer.querySelectorAll('.bp-med-dose-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const row = e.target.closest('.bp-med-row');
        const idx = parseInt(row.dataset.idx, 10);
        if (draftBpMeds[idx]) draftBpMeds[idx].doseMg = parseFloat(e.target.value) || 0;
      });
    });
    bpMedsListContainer.querySelectorAll('.bp-med-time-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        triggerHaptic(14);
        const idx = parseInt(btn.dataset.idx, 10);
        openBpMedTimeModal(idx);
      });
    });
    bpMedsListContainer.querySelectorAll('.bp-del-med-row-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        triggerHaptic(12);
        const idx = parseInt(btn.dataset.idx, 10);
        draftBpMeds.splice(idx, 1);
        renderBpMedRows();
      });
    });
  }

  function openBpMedTimeModal(medIdx, logId = null) {
    bpMedTimeTargetIdx = medIdx;
    bpMedTimeDirectLogId = logId;

    let initTime = '21:30';
    let medName = 'Fármaco antihipertensivo';

    if (logId) {
      const logs = getBpLogs();
      const item = logs.find(l => l.id === logId);
      if (item && item.meds && item.meds[medIdx]) {
        initTime = item.meds[medIdx].time || '21:30';
        medName = item.meds[medIdx].name || medName;
      }
    } else if (draftBpMeds[medIdx]) {
      initTime = draftBpMeds[medIdx].time || '21:30';
      medName = draftBpMeds[medIdx].name || medName;
    }

    if (bpMedTimeTargetMedName) bpMedTimeTargetMedName.textContent = medName;

    const parts = initTime.split(':');
    currentMedHour = parseInt(parts[0], 10);
    if (isNaN(currentMedHour)) currentMedHour = 21;
    currentMedMin = parseInt(parts[1], 10);
    if (isNaN(currentMedMin)) currentMedMin = 30;
    updateMedTimeDisplay();

    if (bpMedTimeModalBackdrop) {
      bpMedTimeModalBackdrop.classList.add('open');
    }
  }

  function updateMedTimeDisplay() {
    currentMedHour = Math.min(23, Math.max(0, currentMedHour));
    currentMedMin = Math.min(59, Math.max(0, currentMedMin));
    const hStr = String(currentMedHour).padStart(2, '0');
    const mStr = String(currentMedMin).padStart(2, '0');
    const timeStr = `${hStr}:${mStr}`;
    if (bpMedTimeDisplay) bpMedTimeDisplay.textContent = timeStr;
    if (bpMedTimeHourInput) bpMedTimeHourInput.value = currentMedHour;
    if (bpMedTimeMinInput) bpMedTimeMinInput.value = currentMedMin;
  }

  if (bpMedTimeHourMinus) {
    bpMedTimeHourMinus.addEventListener('click', () => {
      triggerHaptic(10);
      currentMedHour = (currentMedHour - 1 + 24) % 24;
      updateMedTimeDisplay();
    });
  }
  if (bpMedTimeHourPlus) {
    bpMedTimeHourPlus.addEventListener('click', () => {
      triggerHaptic(10);
      currentMedHour = (currentMedHour + 1) % 24;
      updateMedTimeDisplay();
    });
  }
  if (bpMedTimeMinMinus) {
    bpMedTimeMinMinus.addEventListener('click', () => {
      triggerHaptic(10);
      currentMedMin = (currentMedMin - 5 + 60) % 60;
      updateMedTimeDisplay();
    });
  }
  if (bpMedTimeMinPlus) {
    bpMedTimeMinPlus.addEventListener('click', () => {
      triggerHaptic(10);
      currentMedMin = (currentMedMin + 5) % 60;
      updateMedTimeDisplay();
    });
  }
  if (bpMedTimeHourInput) {
    bpMedTimeHourInput.addEventListener('input', (e) => {
      currentMedHour = parseInt(e.target.value, 10) || 0;
      updateMedTimeDisplay();
    });
  }
  if (bpMedTimeMinInput) {
    bpMedTimeMinInput.addEventListener('input', (e) => {
      currentMedMin = parseInt(e.target.value, 10) || 0;
      updateMedTimeDisplay();
    });
  }

  document.querySelectorAll('.bp-quick-time-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerHaptic(12);
      const t = btn.dataset.time || '21:30';
      const [h, m] = t.split(':').map(Number);
      currentMedHour = h || 0;
      currentMedMin = m || 0;
      updateMedTimeDisplay();
    });
  });

  if (bpMedTimeApplyBtn) {
    bpMedTimeApplyBtn.addEventListener('click', () => {
      triggerHaptic(16);
      const hStr = String(currentMedHour).padStart(2, '0');
      const mStr = String(currentMedMin).padStart(2, '0');
      const finalTime = `${hStr}:${mStr}`;

      if (bpMedTimeDirectLogId) {
        let logs = getBpLogs();
        const idx = logs.findIndex(l => l.id === bpMedTimeDirectLogId);
        if (idx >= 0 && logs[idx].meds && logs[idx].meds[bpMedTimeTargetIdx]) {
          logs[idx].meds[bpMedTimeTargetIdx].time = finalTime;
          saveBpLogs(logs);
          showToast(`✓ Hora de medicación actualizada: ${finalTime}`);
        }
      } else if (bpMedTimeTargetIdx >= 0 && draftBpMeds[bpMedTimeTargetIdx]) {
        draftBpMeds[bpMedTimeTargetIdx].time = finalTime;
        renderBpMedRows();
        showToast(`✓ Hora de medicación: ${finalTime}`);
      }

      if (bpMedTimeModalBackdrop) {
        bpMedTimeModalBackdrop.classList.remove('open');
      }
    });
  }

  if (closeBpMedTimeModalBtn && bpMedTimeModalBackdrop) {
    closeBpMedTimeModalBtn.addEventListener('click', () => {
      triggerHaptic(10);
      bpMedTimeModalBackdrop.classList.remove('open');
    });
  }

  if (bpMedTimeModalBackdrop) {
    bpMedTimeModalBackdrop.addEventListener('click', (e) => {
      if (e.target === bpMedTimeModalBackdrop) {
        bpMedTimeModalBackdrop.classList.remove('open');
      }
    });
  }

  if (bpAddMedRowBtn) {
    bpAddMedRowBtn.addEventListener('click', () => {
      triggerHaptic(14);
      draftBpMeds.push({ name: '', doseMg: '', time: '21:30' });
      renderBpMedRows();
    });
  }

  function shiftBpRange(deltaDays) {
    if (currentBpRange === 'all') {
      currentBpRange = '1m';
      bpGraphTimeframeBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.bprange === '1m');
      });
      bpRangeOffset = 0;
    }
    bpRangeOffset += deltaDays;
    if (bpRangeOffset > 0) bpRangeOffset = 0;
    renderBpGraph();
  }

  bpGraphTimeframeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      triggerHaptic(12);
      bpGraphTimeframeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentBpRange = btn.dataset.bprange;
      bpRangeOffset = 0;
      renderBpGraph();
    });
  });

  if (bpGraphPrevRange) {
    bpGraphPrevRange.addEventListener('click', () => {
      triggerHaptic(12);
      shiftBpRange(-1); // Desciende 1 día continuo ambas fechas
    });
  }
  if (bpGraphNextRange) {
    bpGraphNextRange.addEventListener('click', () => {
      triggerHaptic(12);
      shiftBpRange(1); // Asciende 1 día continuo ambas fechas
    });
  }

  let bpIsSwiping = false;
  // Swipe y arrastre continuo lateral en el gráfico de tensiones (día a día en tiempo real)
  if (bpSvgContainer) {
    let bpTouchStartX = 0, bpTouchStartY = 0, bpLastDragX = 0;
    const PX_PER_DAY = 26; // Cada 26px de arrastre desplaza 1 día continuo

    bpSvgContainer.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        bpTouchStartX = e.touches[0].clientX;
        bpTouchStartY = e.touches[0].clientY;
        bpLastDragX = bpTouchStartX;
        bpIsSwiping = false;
      }
    }, { passive: true });

    bpSvgContainer.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length === 1) {
        const curX = e.touches[0].clientX;
        const curY = e.touches[0].clientY;
        const totalDx = curX - bpTouchStartX;
        const totalDy = curY - bpTouchStartY;

        if (!bpIsSwiping && Math.abs(totalDx) > Math.abs(totalDy) && Math.abs(totalDx) > 22) {
          bpIsSwiping = true;
        }

        if (bpIsSwiping) {
          const dragDx = curX - bpLastDragX;
          if (Math.abs(dragDx) >= PX_PER_DAY) {
            const daysStep = Math.trunc(dragDx / PX_PER_DAY);
            // Arrastre a la derecha (dragDx > 0): desciende días (hacia el pasado)
            // Arrastre a la izquierda (dragDx < 0): avanza días (hacia el presente)
            shiftBpRange(daysStep);
            bpLastDragX += daysStep * PX_PER_DAY;
            triggerHaptic(10);
          }
        }
      }
    }, { passive: true });

    bpSvgContainer.addEventListener('touchend', (e) => {
      if (!bpIsSwiping && bpTouchStartX) {
        const endX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : bpTouchStartX;
        const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : bpTouchStartY;
        const dist = Math.hypot(endX - bpTouchStartX, endY - bpTouchStartY);
        if (dist < 25) {
          handleBpSvgTap(endX);
        }
      }
      bpIsSwiping = false;
    }, { passive: true });

    bpSvgContainer.addEventListener('click', (e) => {
      handleBpSvgTap(e.clientX);
    });
  }

  function handleBpSvgTap(clientX) {
    if (!bpSvgContainer || !window._currentBpDaySummaries || window._currentBpDaySummaries.length === 0) return;
    const rect = bpSvgContainer.getBoundingClientRect();
    const relX = clientX - rect.left;
    const svgW = rect.width || 350;
    const svgX = (relX / svgW) * 350;

    let closestIdx = 0;
    let minDiff = 999999;
    window._currentBpDaySummaries.forEach((d, i) => {
      const ptX = d._x !== undefined ? d._x : 0;
      const diff = Math.abs(svgX - ptX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });

    const d = window._currentBpDaySummaries[closestIdx];
    if (d) {
      triggerHaptic(14);
      if (window._updateBpScrubber) window._updateBpScrubber(closestIdx);
      openBpZoomModal(d.date);
    }
  }

  function renderBpGraph() {
    if (!bpSvgContainer) return;

    let logs = getBpLogs();
    const isEn = window.MISPEP_I18N && window.MISPEP_I18N.getLang() === 'en';
    if (logs.length === 0) {
      bpSvgContainer.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">${isEn ? 'No blood pressure records' : 'Sin registros de presión arterial'}</p>`;
      if (bpScrubberInfo) bpScrubberInfo.innerHTML = `<div style="color:var(--text-muted); text-align:center;">${isEn ? 'No records to show medication' : 'Sin registros para mostrar medicación'}</div>`;
      if (bpGraphDateRangeLabel) bpGraphDateRangeLabel.textContent = '--';
      if (dashBpSysVal) dashBpSysVal.textContent = '--';
      if (dashBpDiaVal) dashBpDiaVal.textContent = '--';
      if (dashBpStatusVal) {
        dashBpStatusVal.textContent = isEn ? 'No data' : 'Sin datos';
        dashBpStatusVal.style.color = 'var(--text-muted)';
      }
      return;
    }

    logs = [...logs].sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));

    const latest = logs[logs.length - 1];
    if (dashBpSysVal) dashBpSysVal.textContent = latest.sys;
    if (dashBpDiaVal) dashBpDiaVal.textContent = latest.dia;
    if (dashBpStatusVal) {
      let stText = 'Óptimo';
      let stColor = '#10b981';
      if (latest.sys < 120 && latest.dia < 80) {
        stText = 'Óptimo';
        stColor = '#10b981';
      } else if (latest.sys <= 129 && latest.dia < 80) {
        stText = 'Normal';
        stColor = '#3b82f6';
      } else if (latest.sys <= 139 || latest.dia <= 89) {
        stText = 'HTA Grado 1';
        stColor = '#f59e0b';
      } else {
        stText = 'HTA Grado 2';
        stColor = '#ef4444';
      }
      dashBpStatusVal.textContent = stText;
      dashBpStatusVal.style.color = stColor;
    }

    // Agrupar lecturas por fecha única
    const dayGroupsMap = {};
    logs.forEach(l => {
      if (!dayGroupsMap[l.date]) dayGroupsMap[l.date] = [];
      dayGroupsMap[l.date].push(l);
    });

    const uniqueDates = Object.keys(dayGroupsMap).sort((a, b) => new Date(a) - new Date(b));

    const allDaySummaries = uniqueDates.map(date => {
      const readings = dayGroupsMap[date].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
      const last = readings[readings.length - 1];
      const maxSys = Math.max(...readings.map(r => r.sys));
      const minSys = Math.min(...readings.map(r => r.sys));
      const maxDia = Math.max(...readings.map(r => r.dia));
      const minDia = Math.min(...readings.map(r => r.dia));
      const hasMultiple = readings.length >= 2;

      return {
        date,
        readings,
        last,
        hasMultiple,
        maxSys,
        minSys,
        maxDia,
        minDia,
        sys: last.sys,
        dia: last.dia,
        pulse: last.pulse,
        meds: last.meds,
        id: last.id
      };
    });

    const fmtShort = (d) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    // Fechas límites de la ventana temporal continua (período fijo de 7, 30 o 365 días)
    const latestBpDate = new Date(allDaySummaries[allDaySummaries.length - 1].date + 'T23:59:59');
    let windowStart, windowEnd;

    if (currentBpRange === 'all') {
      windowStart = new Date(allDaySummaries[0].date + 'T00:00:00');
      windowEnd = latestBpDate;
      bpRangeOffset = 0;
    } else {
      let spanDays = 30;
      if (currentBpRange === '3m') spanDays = 90;
      else if (currentBpRange === '6m') spanDays = 180;
      else if (currentBpRange === '1m' || currentBpRange === 'month') spanDays = 30;

      // Desplazamiento continuo día a día: ambas fechas ascienden/descienden en 1 día
      windowEnd = new Date(latestBpDate.getTime() + (bpRangeOffset * 86400000));
      windowStart = new Date(windowEnd.getTime() - ((spanDays - 1) * 86400000));
      windowStart.setHours(0, 0, 0, 0);
      windowEnd.setHours(23, 59, 59, 999);
    }

    if (bpGraphNextRange) {
      if (currentBpRange === 'all' || bpRangeOffset >= 0) {
        bpGraphNextRange.style.opacity = '0.35';
        bpGraphNextRange.style.pointerEvents = 'none';
      } else {
        bpGraphNextRange.style.opacity = '1';
        bpGraphNextRange.style.pointerEvents = 'auto';
      }
    }

    const startIso = getLocalDateStr(windowStart);
    const endIso = getLocalDateStr(windowEnd);
    const daySummaries = currentBpRange === 'all'
      ? allDaySummaries
      : allDaySummaries.filter(d => d.date >= startIso && d.date <= endIso);

    // Etiqueta de fechas reales de la ventana visible continua
    if (bpGraphDateRangeLabel) {
      if (daySummaries.length > 1) {
        const dStart = new Date(daySummaries[0].date + 'T12:00:00');
        const dEnd = new Date(daySummaries[daySummaries.length - 1].date + 'T12:00:00');
        bpGraphDateRangeLabel.textContent = `${fmtShort(dStart)} - ${fmtShort(dEnd)}`;
      } else if (daySummaries.length === 1) {
        const dOnly = new Date(daySummaries[0].date + 'T12:00:00');
        bpGraphDateRangeLabel.textContent = `${fmtShort(dOnly)}`;
      } else {
        bpGraphDateRangeLabel.textContent = `${fmtShort(windowStart)} - ${fmtShort(windowEnd)}`;
      }
    }

    // Dimensiones SVG
    const width = 350;
    const height = 185;
    const padL = 26;
    const padR = 36;
    const padT = 32;
    const padB = 24;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const allSys = logs.map(l => l.sys);
    const allDia = logs.map(l => l.dia);
    const minVal = Math.min(60, Math.floor(Math.min(...allDia) / 10) * 10);
    const maxVal = Math.max(140, Math.ceil(Math.max(...allSys) / 10) * 10);
    const yRange = Math.max(20, maxVal - minVal);

    function getY(v) {
      return padT + plotH - (((v - minVal) / yRange) * plotH);
    }

    const y120 = getY(120);
    const y80 = getY(80);
    const refLinesHtml = `
      <line x1="${padL}" y1="${y120.toFixed(1)}" x2="${width - padR}" y2="${y120.toFixed(1)}" stroke="#f43f5e" stroke-width="1" stroke-dasharray="3,3" opacity="0.45" />
      <text x="${width - 4}" y="${(y120 + 3).toFixed(1)}" font-size="8" font-weight="700" fill="#f43f5e" text-anchor="end">120</text>

      <line x1="${padL}" y1="${y80.toFixed(1)}" x2="${width - padR}" y2="${y80.toFixed(1)}" stroke="#06b6d4" stroke-width="1" stroke-dasharray="3,3" opacity="0.45" />
      <text x="${width - 4}" y="${(y80 + 3).toFixed(1)}" font-size="8" font-weight="700" fill="#06b6d4" text-anchor="end">80</text>
    `;

    if (daySummaries.length === 0) {
      bpSvgContainer.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; overflow:visible;">
          ${refLinesHtml}
          <text x="${width / 2}" y="${padT + plotH / 2}" font-size="9" font-weight="700" fill="var(--text-muted)" text-anchor="middle">
            Sin medidas en este periodo
          </text>
        </svg>
      `;
      if (bpScrubberInfo) {
        bpScrubberInfo.innerHTML = `
          <div style="padding:10px; text-align:center; font-size:0.75rem; color:var(--text-muted);">
            No hay medidas de tensión registradas entre el ${fmtShort(windowStart)} y el ${fmtShort(windowEnd)}.
          </div>
        `;
      }
      return;
    }

    const inset = 18;
    const tFirst = daySummaries.length > 0 ? new Date(daySummaries[0].date + 'T12:00:00').getTime() : 0;
    const tLast = daySummaries.length > 0 ? new Date(daySummaries[daySummaries.length - 1].date + 'T12:00:00').getTime() : 0;
    const timeSpan = tLast - tFirst;

    function getX(d, idx) {
      if (daySummaries.length === 1) return padL + plotW / 2;
      if (timeSpan > 0) {
        const t = new Date(d.date + 'T12:00:00').getTime();
        const ratio = (t - tFirst) / timeSpan;
        return (padL + inset) + ratio * (plotW - 2 * inset);
      }
      return (padL + inset) + (idx / (daySummaries.length - 1)) * (plotW - 2 * inset);
    }

    const pointsSys = daySummaries.map((d, i) => ({ x: getX(d, i), y: getY(d.sys), val: d.sys, date: d.date }));
    const pointsDia = daySummaries.map((d, i) => ({ x: getX(d, i), y: getY(d.dia), val: d.dia, date: d.date }));
    daySummaries.forEach((d, i) => { d._x = pointsSys[i].x; });
    window._currentBpDaySummaries = daySummaries;
    window._updateBpScrubber = updateScrubber;

    let pathDSys = '';
    let areaDSys = '';
    let pathDDia = '';
    let areaDDia = '';

    if (pointsSys.length >= 2) {
      pathDSys = `M ${pointsSys[0].x.toFixed(1)} ${pointsSys[0].y.toFixed(1)}`;
      for (let i = 0; i < pointsSys.length - 1; i++) {
        const p0 = pointsSys[i];
        const p1 = pointsSys[i + 1];
        const mx = (p0.x + p1.x) / 2;
        pathDSys += ` C ${mx.toFixed(1)} ${p0.y.toFixed(1)}, ${mx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
      areaDSys = `${pathDSys} L ${pointsSys[pointsSys.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${pointsSys[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

      pathDDia = `M ${pointsDia[0].x.toFixed(1)} ${pointsDia[0].y.toFixed(1)}`;
      for (let i = 0; i < pointsDia.length - 1; i++) {
        const p0 = pointsDia[i];
        const p1 = pointsDia[i + 1];
        const mx = (p0.x + p1.x) / 2;
        pathDDia += ` C ${mx.toFixed(1)} ${p0.y.toFixed(1)}, ${mx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
      areaDDia = `${pathDDia} L ${pointsDia[pointsDia.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${pointsDia[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;
    }

    let nodesHtml = '';
    let badgesHtml = '';
    let touchColumnsHtml = '';
    let whiskersHtml = '';

    const showAllBpLabels = daySummaries.length <= 8;
    let lastRenderedSysDiaX = -999;
    let lastRenderedDateX = -999;

    daySummaries.forEach((d, i) => {
      const pt = pointsSys[i];
      const diaPt = pointsDia[i];
      const dObj = new Date(d.date + 'T12:00:00');
      const dd = String(dObj.getDate()).padStart(2, '0');
      const mm = String(dObj.getMonth() + 1).padStart(2, '0');
      const dateLabel = `${dd}/${mm}`;

      const isFirst = (i === 0);
      const isLast = (i === daySummaries.length - 1);
      const hasSpaceForValues = (pt.x - lastRenderedSysDiaX) >= 28;
      const showValues = showAllBpLabels || isFirst || isLast || hasSpaceForValues;

      const hasSpaceForDate = (pt.x - lastRenderedDateX) >= 30;
      const showDate = showAllBpLabels || isFirst || isLast || hasSpaceForDate;

      if (showValues) {
        lastRenderedSysDiaX = pt.x;
      }
      if (showDate) {
        lastRenderedDateX = pt.x;
      }

      if (d.hasMultiple) {
        const isRightEdge = pt.x > width - 70;
        const sysX = isRightEdge ? (pt.x - 9) : (pt.x + 9);
        const diaX = isRightEdge ? (pt.x + 9) : (pt.x - 9);
        const sysAnchor = isRightEdge ? 'end' : 'start';
        const diaAnchor = isRightEdge ? 'start' : 'end';
        const sysTextX = isRightEdge ? (sysX - 5) : (sysX + 5);
        const diaTextX = isRightEdge ? (diaX + 5) : (diaX - 5);

        if (d.maxSys !== d.minSys) {
          const ySysTop = getY(d.maxSys);
          const ySysBot = getY(d.minSys);
          const capHalf = 4.5;

          whiskersHtml += `
            <line x1="${sysX.toFixed(1)}" y1="${ySysTop.toFixed(1)}" x2="${sysX.toFixed(1)}" y2="${ySysBot.toFixed(1)}" stroke="#f43f5e" stroke-width="1.3" stroke-opacity="0.8" />
            <line x1="${(sysX - capHalf).toFixed(1)}" y1="${ySysTop.toFixed(1)}" x2="${(sysX + capHalf).toFixed(1)}" y2="${ySysTop.toFixed(1)}" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" />
            <line x1="${(sysX - capHalf).toFixed(1)}" y1="${ySysBot.toFixed(1)}" x2="${(sysX + capHalf).toFixed(1)}" y2="${ySysBot.toFixed(1)}" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" />
            <text x="${sysTextX.toFixed(1)}" y="${(ySysTop + 3).toFixed(1)}" font-size="7" font-weight="900" fill="#f43f5e" text-anchor="${sysAnchor}" style="paint-order:stroke fill; stroke:var(--card-bg-elevated,#0f172a); stroke-width:2.5px;">${d.maxSys}</text>
            <text x="${sysTextX.toFixed(1)}" y="${(ySysBot + 3).toFixed(1)}" font-size="7" font-weight="900" fill="#f43f5e" text-anchor="${sysAnchor}" style="paint-order:stroke fill; stroke:var(--card-bg-elevated,#0f172a); stroke-width:2.5px;">${d.minSys}</text>
          `;
        }

        if (d.maxDia !== d.minDia) {
          const yDiaTop = getY(d.maxDia);
          const yDiaBot = getY(d.minDia);
          const capHalf = 4.5;

          whiskersHtml += `
            <line x1="${diaX.toFixed(1)}" y1="${yDiaTop.toFixed(1)}" x2="${diaX.toFixed(1)}" y2="${yDiaBot.toFixed(1)}" stroke="#06b6d4" stroke-width="1.3" stroke-opacity="0.8" />
            <line x1="${(diaX - capHalf).toFixed(1)}" y1="${yDiaTop.toFixed(1)}" x2="${(diaX + capHalf).toFixed(1)}" y2="${yDiaTop.toFixed(1)}" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" />
            <line x1="${(diaX - capHalf).toFixed(1)}" y1="${yDiaBot.toFixed(1)}" x2="${(diaX + capHalf).toFixed(1)}" y2="${yDiaBot.toFixed(1)}" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" />
            <text x="${diaTextX.toFixed(1)}" y="${(yDiaTop + 3).toFixed(1)}" font-size="7" font-weight="900" fill="#06b6d4" text-anchor="${diaAnchor}" style="paint-order:stroke fill; stroke:var(--card-bg-elevated,#0f172a); stroke-width:2.5px;">${d.maxDia}</text>
            <text x="${diaTextX.toFixed(1)}" y="${(yDiaBot + 3).toFixed(1)}" font-size="7" font-weight="900" fill="#06b6d4" text-anchor="${diaAnchor}" style="paint-order:stroke fill; stroke:var(--card-bg-elevated,#0f172a); stroke-width:2.5px;">${d.minDia}</text>
          `;
        }
      }

      const prevDayIndexInAll = allDaySummaries.findIndex(x => x.date === d.date) - 1;
      const prevDay = prevDayIndexInAll >= 0 ? allDaySummaries[prevDayIndexInAll] : null;
      const diff = prevDay ? compareMeds(prevDay.meds, d.meds) : null;

      if (diff) {
        const badgeY = d.hasMultiple ? Math.min(pt.y, getY(d.maxSys)) : pt.y;
        if (diff.type === '+') {
          badgesHtml += `
            <g class="bp-diff-marker" data-idx="${i}" style="cursor:pointer;">
              <rect x="${(pt.x - 8).toFixed(1)}" y="${(badgeY - 26).toFixed(1)}" width="16" height="14" rx="4" fill="#f59e0b" stroke="#ffffff" stroke-width="1.2" />
              <text x="${pt.x.toFixed(1)}" y="${(badgeY - 16).toFixed(1)}" font-size="11" font-weight="900" fill="#000000" text-anchor="middle">+</text>
            </g>
          `;
        } else if (diff.type === '-') {
          badgesHtml += `
            <g class="bp-diff-marker" data-idx="${i}" style="cursor:pointer;">
              <rect x="${(pt.x - 8).toFixed(1)}" y="${(badgeY - 26).toFixed(1)}" width="16" height="14" rx="4" fill="#10b981" stroke="#ffffff" stroke-width="1.2" />
              <text x="${pt.x.toFixed(1)}" y="${(badgeY - 16).toFixed(1)}" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">-</text>
            </g>
          `;
        }
      }

      // Nodos circulares
      nodesHtml += `
        <circle class="bp-node-sys" data-idx="${i}" cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="6" fill="#f43f5e" stroke="#ffffff" stroke-width="2.2" pointer-events="all" style="cursor:pointer; pointer-events:all;" />
        <circle class="bp-node-dia" data-idx="${i}" cx="${diaPt.x.toFixed(1)}" cy="${diaPt.y.toFixed(1)}" r="6" fill="#06b6d4" stroke="#ffffff" stroke-width="2.2" pointer-events="all" style="cursor:pointer; pointer-events:all;" />
      `;

      // Textos de valores con halo protector anticolisión
      if (showValues) {
        const vertDist = Math.abs(diaPt.y - pt.y);
        const sysOffset = vertDist < 20 ? 9 : 8;
        const diaOffset = vertDist < 20 ? 15 : 14;

        nodesHtml += `
          <text x="${pt.x.toFixed(1)}" y="${(pt.y - sysOffset).toFixed(1)}" font-size="8.5" font-weight="900" fill="#f43f5e" text-anchor="middle" pointer-events="none" style="pointer-events:none; paint-order:stroke fill; stroke:var(--card-bg-elevated,#0f172a); stroke-width:3.2px; stroke-linejoin:round;">${d.sys}</text>
          <text x="${diaPt.x.toFixed(1)}" y="${(diaPt.y + diaOffset).toFixed(1)}" font-size="8.5" font-weight="900" fill="#06b6d4" text-anchor="middle" pointer-events="none" style="pointer-events:none; paint-order:stroke fill; stroke:var(--card-bg-elevated,#0f172a); stroke-width:3.2px; stroke-linejoin:round;">${d.dia}</text>
        `;
      }

      // Fecha en eje X con halo protector
      if (showDate) {
        nodesHtml += `
          <text x="${pt.x.toFixed(1)}" y="${(height - 6).toFixed(1)}" font-size="8" font-weight="700" fill="var(--text-muted)" text-anchor="middle" pointer-events="none" style="pointer-events:none; paint-order:stroke fill; stroke:var(--card-bg-elevated,#0f172a); stroke-width:2.5px;">${dateLabel}</text>
        `;
      }

      touchColumnsHtml += `
        <rect class="bp-touch-col" data-idx="${i}" x="${(pt.x - 22).toFixed(1)}" y="${padT}" width="44" height="${plotH}" fill="rgba(0,0,0,0.001)" pointer-events="all" style="cursor:pointer; pointer-events:all;" />
      `;
    });

    bpSvgContainer.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; overflow:visible;">
        <defs>
          <linearGradient id="bpSysGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#f43f5e" stop-opacity="0.01" />
          </linearGradient>
          <linearGradient id="bpDiaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.01" />
          </linearGradient>
        </defs>

        ${refLinesHtml}
        ${areaDSys ? `<path d="${areaDSys}" fill="url(#bpSysGrad)" />` : ''}
        ${areaDDia ? `<path d="${areaDDia}" fill="url(#bpDiaGrad)" />` : ''}
        ${pathDDia ? `<path d="${pathDDia}" fill="none" stroke="#06b6d4" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />` : ''}
        ${pathDSys ? `<path d="${pathDSys}" fill="none" stroke="#f43f5e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />` : ''}
        ${whiskersHtml}
        ${badgesHtml}
        ${nodesHtml}
        ${touchColumnsHtml}
      </svg>
    `;

    function updateScrubber(idx) {
      if (!bpScrubberInfo || !daySummaries[idx]) return;
      const d = daySummaries[idx];
      const prevDayIndexInAll = allDaySummaries.findIndex(x => x.date === d.date) - 1;
      const prevDay = prevDayIndexInAll >= 0 ? allDaySummaries[prevDayIndexInAll] : null;
      const diff = prevDay ? compareMeds(prevDay.meds, d.meds) : null;

      const formatMedsSchedule = (meds) => {
        if (!Array.isArray(meds)) return '';
        const valid = meds.filter(m => (m.name || '').trim());
        if (valid.length === 0) return '';
        return valid.map(m => `${m.name} (${m.time || '21:30'})`).join(' · ');
      };

      const medsList = Array.isArray(d.meds) && d.meds.length > 0
        ? d.meds.filter(m => (m.name || '').trim()).map((m, mIdx) => `<strong>${m.name}</strong> ${m.doseMg}mg <button type="button" class="btn-3d btn-3d-surface bp-quick-change-time-btn" data-log-id="${d.last.id}" data-med-idx="${mIdx}" style="padding:2px 7px; font-size:0.75rem; font-weight:800; color:#06b6d4; border:1px solid rgba(6,182,212,0.4); border-radius:6px; margin-left:3px;" title="Cambiar hora de esta medicación">⏰ ${m.time || '21:30'} ✏️</button>`).join(' · ')
        : '<span style="color:var(--text-muted); font-style:italic;">Sin medicación antihipertensiva</span>';

      let diffHtml = '';
      let badgeHtml = '';

      const scheduleSummary = formatMedsSchedule(d.meds);
      const scheduleTag = scheduleSummary ? ` · ⏰ Toma habitual: <strong>${scheduleSummary}</strong>` : '';

      if (diff) {
        if (diff.type === '-') {
          badgeHtml = `<span style="background:rgba(16,185,129,0.18); color:#10b981; border:1px solid rgba(16,185,129,0.35); border-radius:6px; padding:2px 8px; font-size:0.72rem; font-weight:800;">[-] Menos medicación</span>`;
          diffHtml = `<div style="margin-top:6px; padding:6px 8px; background:rgba(16,185,129,0.08); border-radius:6px; color:#10b981; font-size:0.73rem; font-weight:700;">📉 <strong>Reducción vs día anterior (${prevDay.date}):</strong> ${diff.detail}${scheduleTag}</div>`;
        } else {
          badgeHtml = `<span style="background:rgba(245,158,11,0.18); color:#f59e0b; border:1px solid rgba(245,158,11,0.35); border-radius:6px; padding:2px 8px; font-size:0.72rem; font-weight:800;">[+] Más medicación</span>`;
          diffHtml = `<div style="margin-top:6px; padding:6px 8px; background:rgba(245,158,11,0.08); border-radius:6px; color:#f59e0b; font-size:0.73rem; font-weight:700;">📈 <strong>Aumento vs día anterior (${prevDay.date}):</strong> ${diff.detail}${scheduleTag}</div>`;
        }
      } else if (prevDay) {
        badgeHtml = `<span style="background:rgba(255,255,255,0.06); color:var(--text-muted); border:1px solid var(--border-color); border-radius:6px; padding:2px 8px; font-size:0.72rem; font-weight:700;">Misma pauta</span>`;
        diffHtml = `<div style="margin-top:4px; font-size:0.72rem; color:var(--text-muted);">↔️ Misma medicación tomada el día anterior (${prevDay.date})${scheduleTag}</div>`;
      } else {
        badgeHtml = `<span style="background:rgba(6,182,212,0.15); color:#06b6d4; border:1px solid rgba(6,182,212,0.3); border-radius:6px; padding:2px 8px; font-size:0.72rem; font-weight:800;">Pauta Base</span>`;
        diffHtml = `<div style="margin-top:4px; font-size:0.72rem; color:var(--text-muted);">Primera fecha registrada en el historial${scheduleTag}</div>`;
      }

      let multiDayHtml = '';
      if (d.hasMultiple) {
        multiDayHtml = `
          <div style="margin-bottom:8px; padding:8px 10px; background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.25); border-radius:8px; font-size:0.75rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-weight:800; color:#06b6d4;">📊 Rango diario (${d.readings.length} tomas):</span>
              <span style="font-weight:700; color:var(--text-muted);">
                Sys <strong style="color:#f43f5e;">${d.minSys}-${d.maxSys}</strong> · Dia <strong style="color:#06b6d4;">${d.minDia}-${d.maxDia}</strong>
              </span>
            </div>
            <div style="display:flex; flex-direction:column; gap:3px; margin-top:4px; font-size:0.72rem;">
              ${d.readings.map((r) => `
                <div style="display:flex; justify-content:space-between; align-items:center; color:var(--text-main);">
                  <span><strong>${r.time || ''}</strong>: <span style="font-weight:900;"><span style="color:#f43f5e;">${r.sys}</span> / <span style="color:#06b6d4;">${r.dia}</span></span> mmHg (${r.pulse || 70} ppm)</span>
                  ${r.id === d.last.id ? '<span style="font-size:0.68rem; color:#10b981; font-weight:800;">[Última medida]</span>' : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      bpScrubberInfo.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <div>
            <span style="font-size:0.85rem; font-weight:900; color:var(--text-main);">📅 ${d.date} ${d.hasMultiple ? `· Última toma (${d.last.time || ''})` : (d.last.time ? `(${d.last.time})` : '')}</span>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
              Última medida: <strong style="color:#f43f5e;">${d.last.sys}</strong> / <strong style="color:#06b6d4;">${d.last.dia}</strong> mmHg · Pulso: <strong>${d.last.pulse || 70} ppm</strong>
            </div>
          </div>
          ${badgeHtml}
        </div>

        ${multiDayHtml}

        <div style="background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:8px; padding:8px 10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">💊 Medicación tomada ese día:</div>
            <button type="button" class="btn-3d btn-3d-surface bp-edit-scrubber-btn" data-id="${d.last.id}" style="padding:3px 8px; font-size:0.72rem; font-weight:800; color:#06b6d4; border:1px solid rgba(6,182,212,0.3);">
              ✏️ Modificar toma y medicación
            </button>
          </div>
          <div style="font-size:0.82rem; color:#ffffff;">${medsList}</div>
          ${diffHtml}
        </div>
      `;

      const scrubberEditBtn = bpScrubberInfo.querySelector('.bp-edit-scrubber-btn');
      if (scrubberEditBtn) {
        scrubberEditBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          triggerHaptic(16);
          openBpEditModal(d.last.id);
        });
      }

      bpScrubberInfo.querySelectorAll('.bp-quick-change-time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          triggerHaptic(14);
          const logId = btn.dataset.logId;
          const medIdx = parseInt(btn.dataset.medIdx, 10) || 0;
          openBpMedTimeModal(medIdx, logId);
        });
      });
    }

    bpSvgContainer.querySelectorAll('.bp-touch-col, .bp-diff-marker, .bp-node-sys, .bp-node-dia').forEach(el => {
      const onPick = (e) => {
        if (e) {
          e.stopPropagation();
        }
        triggerHaptic(14);
        const idx = parseInt(el.dataset.idx, 10);
        updateScrubber(idx);
        const d = daySummaries[idx];
        if (d) {
          openBpZoomModal(d.date);
        }
      };
      el.addEventListener('click', onPick);
      el.addEventListener('touchend', (e) => {
        if (!bpIsSwiping) onPick(e);
      });
    });

    updateScrubber(daySummaries.length - 1);

    if (bpZoomSheetBackdrop && bpZoomSheetBackdrop.classList.contains('open') && currentBpZoomDate) {
      renderBpZoomView(currentBpZoomDate);
    }
  }

  // ============================================================
  // PANTALLA / MODAL AMPLIADO DE PRESIÓN ARTERIAL (VENTANA ±2 DÍAS)
  // ============================================================
  let lastBpZoomOpenedAt = 0;

  function openBpZoomModal(targetDate) {
    const logs = getBpLogs();
    if (!logs || logs.length === 0) return;
    if (!targetDate) {
      targetDate = logs[logs.length - 1].date;
    }
    currentBpZoomDate = targetDate;
    lastBpZoomOpenedAt = Date.now();
    if (bpZoomSheetBackdrop) {
      bpZoomSheetBackdrop.classList.add('open');
    }
    try {
      renderBpZoomView(currentBpZoomDate);
    } catch (err) {
      console.error('Error renderBpZoomView:', err);
    }
  }
  window.openBpZoomModal = openBpZoomModal;

  function renderBpZoomView(centerDate) {
    if (!bpZoomSvgContainer || !bpZoomCardsContainer) return;
    let logs = getBpLogs();
    const isEn = window.MISPEP_I18N && window.MISPEP_I18N.getLang() === 'en';
    if (!logs || logs.length === 0) {
      bpZoomSvgContainer.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:30px;">${isEn ? 'No blood pressure records' : 'Sin registros de presión arterial'}</p>`;
      bpZoomCardsContainer.innerHTML = '';
      return;
    }

    logs = [...logs].sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));

    const dayGroupsMap = {};
    logs.forEach(l => {
      if (!dayGroupsMap[l.date]) dayGroupsMap[l.date] = [];
      dayGroupsMap[l.date].push(l);
    });

    const uniqueDates = Object.keys(dayGroupsMap).sort((a, b) => new Date(a) - new Date(b));
    if (uniqueDates.length === 0) return;

    const allDaySummaries = uniqueDates.map(date => {
      const readings = dayGroupsMap[date].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
      const last = readings[readings.length - 1];
      const maxSys = Math.max(...readings.map(r => r.sys));
      const minSys = Math.min(...readings.map(r => r.sys));
      const maxDia = Math.max(...readings.map(r => r.dia));
      const minDia = Math.min(...readings.map(r => r.dia));
      const sysRange = maxSys - minSys;
      const diaRange = maxDia - minDia;
      const avgSys = Math.round(readings.reduce((sum, r) => sum + r.sys, 0) / readings.length);
      const avgDia = Math.round(readings.reduce((sum, r) => sum + r.dia, 0) / readings.length);
      const pulses = readings.map(r => r.pulse || 70);
      const minPulse = Math.min(...pulses);
      const maxPulse = Math.max(...pulses);
      const hasMultiple = readings.length >= 2;

      return {
        date,
        readings,
        last,
        hasMultiple,
        maxSys,
        minSys,
        sysRange,
        maxDia,
        minDia,
        diaRange,
        avgSys,
        avgDia,
        minPulse,
        maxPulse,
        sys: last.sys,
        dia: last.dia,
        pulse: last.pulse,
        meds: last.meds,
        id: last.id
      };
    });

    let centerIdx = allDaySummaries.findIndex(d => d.date === centerDate);
    if (centerIdx === -1) {
      centerIdx = allDaySummaries.length - 1;
    }
    currentBpZoomDate = allDaySummaries[centerIdx].date;
    const targetDay = allDaySummaries[centerIdx];

    // Ventana de hasta 5 mediciones/días (±2 días alrededor del tocado, incluido este)
    const startIdx = Math.max(0, centerIdx - 2);
    const endIdx = Math.min(allDaySummaries.length - 1, centerIdx + 2);
    const windowDays = allDaySummaries.slice(startIdx, endIdx + 1);

    // Navegación en cabecera
    if (bpZoomPrevDayBtn) {
      if (centerIdx <= 0) {
        bpZoomPrevDayBtn.style.opacity = '0.35';
        bpZoomPrevDayBtn.style.pointerEvents = 'none';
      } else {
        bpZoomPrevDayBtn.style.opacity = '1';
        bpZoomPrevDayBtn.style.pointerEvents = 'auto';
        bpZoomPrevDayBtn.onclick = () => {
          triggerHaptic(12);
          renderBpZoomView(allDaySummaries[centerIdx - 1].date);
        };
      }
    }

    if (bpZoomNextDayBtn) {
      if (centerIdx >= allDaySummaries.length - 1) {
        bpZoomNextDayBtn.style.opacity = '0.35';
        bpZoomNextDayBtn.style.pointerEvents = 'none';
      } else {
        bpZoomNextDayBtn.style.opacity = '1';
        bpZoomNextDayBtn.style.pointerEvents = 'auto';
        bpZoomNextDayBtn.onclick = () => {
          triggerHaptic(12);
          renderBpZoomView(allDaySummaries[centerIdx + 1].date);
        };
      }
    }

    // Cabecera de fechas
    const [tY, tM, tD] = targetDay.date.split('-').map(Number);
    const targetDateObj = new Date(tY, tM - 1, tD, 12, 0, 0);
    const days = isEn ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] : ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const shortDays = isEn ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = isEn ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] : ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const targetDayName = days[targetDateObj.getDay()];
    const targetMonthName = months[tM - 1];

    if (bpZoomModalTitle) {
      bpZoomModalTitle.textContent = isEn ? 'Blood Pressure Detail & Amplitude' : 'Detalle y Amplitud de Presión';
    }
    if (bpZoomModalSubtitle) {
      bpZoomModalSubtitle.textContent = isEn
        ? '5-day window (±2 days) · SYS/DIA ranges amplitude and all readings'
        : 'Ventana de 5 días (±2 días) · Amplitud de rangos SYS/DIA y todas las medidas';
    }

    if (bpZoomFocusDateLabel) {
      bpZoomFocusDateLabel.textContent = isEn
        ? `📅 ${targetDayName}, ${targetMonthName} ${tD}`
        : `📅 ${targetDayName}, ${tD} de ${targetMonthName}`;
    }
    if (bpZoomFocusSubLabel) {
      const nReadings = targetDay.readings.length;
      const readingWord = isEn ? (nReadings === 1 ? 'reading' : 'readings') : (nReadings === 1 ? 'medición' : 'mediciones');
      const selectedWord = isEn ? 'Selected day' : 'Día seleccionado';
      bpZoomFocusSubLabel.innerHTML = `<span style="color:#3b82f6; font-weight:800;">${selectedWord}</span> · ${nReadings} ${readingWord}`;
    }

    // ==========================================
    // GRÁFICO SVG AMPLIADO (360 x 270 px)
    // ==========================================
    const width = 360;
    const height = 270;
    const padL = 34;
    const padR = 32;
    const padT = 38;
    const padB = 30;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const allSys = windowDays.flatMap(w => w.readings.map(r => r.sys));
    const allDia = windowDays.flatMap(w => w.readings.map(r => r.dia));
    const minVal = Math.min(50, Math.floor((Math.min(...allDia) - 5) / 10) * 10);
    const maxVal = Math.max(150, Math.ceil((Math.max(...allSys) + 5) / 10) * 10);
    const yRange = Math.max(30, maxVal - minVal);

    function getY(val) {
      return padT + plotH - (((val - minVal) / yRange) * plotH);
    }

    const y140 = getY(140);
    const y120 = getY(120);
    const y80 = getY(80);
    const y60 = getY(60);

    let gridLinesHtml = `
      <line x1="${padL}" y1="${y140.toFixed(1)}" x2="${width - padR}" y2="${y140.toFixed(1)}" stroke="#ef4444" stroke-width="1" stroke-dasharray="3,3" opacity="0.45" />
      <text x="${width - 4}" y="${(y140 + 3).toFixed(1)}" font-size="7.5" font-weight="800" fill="#ef4444" text-anchor="end">140</text>

      <line x1="${padL}" y1="${y120.toFixed(1)}" x2="${width - padR}" y2="${y120.toFixed(1)}" stroke="#f43f5e" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.5" />
      <text x="${width - 4}" y="${(y120 + 3).toFixed(1)}" font-size="7.5" font-weight="800" fill="#f43f5e" text-anchor="end">120</text>

      <line x1="${padL}" y1="${y80.toFixed(1)}" x2="${width - padR}" y2="${y80.toFixed(1)}" stroke="#06b6d4" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.5" />
      <text x="${width - 4}" y="${(y80 + 3).toFixed(1)}" font-size="7.5" font-weight="800" fill="#06b6d4" text-anchor="end">80</text>

      <line x1="${padL}" y1="${y60.toFixed(1)}" x2="${width - padR}" y2="${y60.toFixed(1)}" stroke="#64748b" stroke-width="0.8" stroke-dasharray="2,3" opacity="0.35" />
      <text x="${width - 4}" y="${(y60 + 3).toFixed(1)}" font-size="7.5" font-weight="700" fill="#64748b" text-anchor="end">60</text>
    `;

    for (let v = minVal; v <= maxVal; v += 20) {
      const yP = getY(v);
      gridLinesHtml += `
        <line x1="${padL - 3}" y1="${yP.toFixed(1)}" x2="${padL}" y2="${yP.toFixed(1)}" stroke="var(--border-color)" stroke-width="1" />
        <text x="${padL - 5}" y="${(yP + 3).toFixed(1)}" font-size="7.2" font-weight="700" fill="var(--text-muted)" text-anchor="end">${v}</text>
      `;
    }

    const nDays = windowDays.length;
    const colW = plotW / nDays;
    let columnsBgHtml = '';
    let dayElementsHtml = '';
    let touchColumnsHtml = '';
    const sysTrendPts = [];
    const diaTrendPts = [];

    windowDays.forEach((d, i) => {
      const colX = padL + (i + 0.5) * colW;
      const isCenter = (d.date === targetDay.date);
      const [dy, dm, dd] = d.date.split('-').map(Number);
      const dDateObj = new Date(dy, dm - 1, dd, 12, 0, 0);
      const dayNameShort = shortDays[dDateObj.getDay()];
      const dateLabelShort = `${dayNameShort} ${String(dd).padStart(2, '0')}/${String(dm).padStart(2, '0')}`;

      const centerIdxInWindow = windowDays.findIndex(x => x.date === targetDay.date);
      const relDiff = i - centerIdxInWindow;
      let relLabel = '';
      if (isCenter) {
        relLabel = '';
      } else if (relDiff < 0) {
        relLabel = `${relDiff}d`;
      } else {
        relLabel = `+${relDiff}d`;
      }

      // Fondo de la columna del día
      if (isCenter) {
        columnsBgHtml += `
          <rect x="${(colX - colW / 2 + 2).toFixed(1)}" y="${padT - 16}" width="${(colW - 4).toFixed(1)}" height="${(plotH + 28).toFixed(1)}" rx="10" fill="rgba(59, 130, 246, 0.14)" stroke="rgba(59, 130, 246, 0.55)" stroke-width="1.6" />
        `;
      } else {
        columnsBgHtml += `
          <rect x="${(colX - colW / 2 + 2).toFixed(1)}" y="${padT - 16}" width="${(colW - 4).toFixed(1)}" height="${(plotH + 28).toFixed(1)}" rx="10" fill="rgba(255, 255, 255, 0.02)" stroke="var(--border-color)" stroke-width="0.8" opacity="0.6" />
          <text x="${colX.toFixed(1)}" y="${(padT - 20).toFixed(1)}" font-size="7.5" font-weight="800" fill="var(--text-muted)" text-anchor="middle">${relLabel}</text>
        `;
      }

      // Etiqueta superior del día y fecha
      columnsBgHtml += `
        <text x="${colX.toFixed(1)}" y="${(padT - 4).toFixed(1)}" font-size="8.5" font-weight="${isCenter ? '900' : '700'}" fill="${isCenter ? '#ffffff' : 'var(--text-main)'}" text-anchor="middle">${dateLabelShort}</text>
        <text x="${colX.toFixed(1)}" y="${(height - 8).toFixed(1)}" font-size="7.5" font-weight="700" fill="${isCenter ? '#3b82f6' : 'var(--text-muted)'}" text-anchor="middle">${d.readings.length} ${d.readings.length === 1 ? 'toma' : 'tomas'}</text>
      `;

      // Posicionamiento horizontal de SYS (izquierda) y DIA (derecha)
      const sysX = colW >= 48 ? (colX - 11) : (colX - 8);
      const diaX = colW >= 48 ? (colX + 11) : (colX + 8);

      sysTrendPts.push({ x: sysX, y: getY(d.avgSys) });
      diaTrendPts.push({ x: diaX, y: getY(d.avgDia) });

      // SISTÓLICA (SYS)
      if (d.hasMultiple && d.maxSys !== d.minSys) {
        const ySysTop = getY(d.maxSys);
        const ySysBot = getY(d.minSys);
        const barH = Math.max(16, ySysBot - ySysTop);
        const ySysMid = (ySysTop + ySysBot) / 2;

        dayElementsHtml += `
          <rect x="${(sysX - 7).toFixed(1)}" y="${ySysTop.toFixed(1)}" width="14" height="${barH.toFixed(1)}" rx="7" fill="rgba(244, 63, 94, 0.22)" stroke="#f43f5e" stroke-width="1.8" />
          <rect x="${(sysX - 11).toFixed(1)}" y="${(ySysMid - 6).toFixed(1)}" width="22" height="12" rx="3" fill="#f43f5e" />
          <text x="${sysX.toFixed(1)}" y="${(ySysMid + 3.2).toFixed(1)}" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">Δ${d.sysRange}</text>
          <text x="${sysX.toFixed(1)}" y="${(ySysTop - 5).toFixed(1)}" font-size="8.5" font-weight="900" fill="#f43f5e" text-anchor="middle" style="paint-order:stroke fill; stroke:var(--card-bg-elevated,#0f172a); stroke-width:3px;">${d.maxSys}</text>
          <text x="${sysX.toFixed(1)}" y="${(ySysBot + 12).toFixed(1)}" font-size="8.5" font-weight="900" fill="#f43f5e" text-anchor="middle" style="paint-order:stroke fill; stroke:var(--card-bg-elevated,#0f172a); stroke-width:3px;">${d.minSys}</text>
        `;

        d.readings.forEach(r => {
          const yr = getY(r.sys);
          dayElementsHtml += `
            <circle cx="${sysX.toFixed(1)}" cy="${yr.toFixed(1)}" r="4.2" fill="#f43f5e" stroke="#ffffff" stroke-width="1.8" />
          `;
        });
      } else {
        const yr = getY(d.sys);
        dayElementsHtml += `
          <circle cx="${sysX.toFixed(1)}" cy="${yr.toFixed(1)}" r="6" fill="#f43f5e" stroke="#ffffff" stroke-width="2.2" />
          <text x="${sysX.toFixed(1)}" y="${(yr - 8).toFixed(1)}" font-size="9" font-weight="900" fill="#f43f5e" text-anchor="middle" style="paint-order:stroke fill; stroke:var(--card-bg-elevated,#0f172a); stroke-width:3px;">${d.sys}</text>
        `;
      }

      // DIASTÓLICA (DIA)
      if (d.hasMultiple && d.maxDia !== d.minDia) {
        const yDiaTop = getY(d.maxDia);
        const yDiaBot = getY(d.minDia);
        const barH = Math.max(16, yDiaBot - yDiaTop);
        const yDiaMid = (yDiaTop + yDiaBot) / 2;

        dayElementsHtml += `
          <rect x="${(diaX - 7).toFixed(1)}" y="${yDiaTop.toFixed(1)}" width="14" height="${barH.toFixed(1)}" rx="7" fill="rgba(6, 182, 212, 0.22)" stroke="#06b6d4" stroke-width="1.8" />
          <rect x="${(diaX - 11).toFixed(1)}" y="${(yDiaMid - 6).toFixed(1)}" width="22" height="12" rx="3" fill="#06b6d4" />
          <text x="${diaX.toFixed(1)}" y="${(yDiaMid + 3.2).toFixed(1)}" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">Δ${d.diaRange}</text>
          <text x="${diaX.toFixed(1)}" y="${(yDiaTop - 5).toFixed(1)}" font-size="8.5" font-weight="900" fill="#06b6d4" text-anchor="middle" style="paint-order:stroke fill; stroke:var(--card-bg-elevated,#0f172a); stroke-width:3px;">${d.maxDia}</text>
          <text x="${diaX.toFixed(1)}" y="${(yDiaBot + 12).toFixed(1)}" font-size="8.5" font-weight="900" fill="#06b6d4" text-anchor="middle" style="paint-order:stroke fill; stroke:var(--card-bg-elevated,#0f172a); stroke-width:3px;">${d.minDia}</text>
        `;

        d.readings.forEach(r => {
          const yr = getY(r.dia);
          dayElementsHtml += `
            <circle cx="${diaX.toFixed(1)}" cy="${yr.toFixed(1)}" r="4.2" fill="#06b6d4" stroke="#ffffff" stroke-width="1.8" />
          `;
        });
      } else {
        const yr = getY(d.dia);
        dayElementsHtml += `
          <circle cx="${diaX.toFixed(1)}" cy="${yr.toFixed(1)}" r="6" fill="#06b6d4" stroke="#ffffff" stroke-width="2.2" />
          <text x="${diaX.toFixed(1)}" y="${(yr + 16).toFixed(1)}" font-size="9" font-weight="900" fill="#06b6d4" text-anchor="middle" style="paint-order:stroke fill; stroke:var(--card-bg-elevated,#0f172a); stroke-width:3px;">${d.dia}</text>
        `;
      }

      // Zona táctil de columna
      touchColumnsHtml += `
        <rect class="bp-zoom-svg-col" data-date="${d.date}" x="${(colX - colW / 2).toFixed(1)}" y="${padT - 16}" width="${colW.toFixed(1)}" height="${(plotH + 42).toFixed(1)}" fill="transparent" style="cursor:pointer;" />
      `;
    });

    // Líneas de tendencia suaves entre días
    let trendLinesHtml = '';
    if (windowDays.length >= 2) {
      let pathSys = `M ${sysTrendPts[0].x.toFixed(1)} ${sysTrendPts[0].y.toFixed(1)}`;
      let pathDia = `M ${diaTrendPts[0].x.toFixed(1)} ${diaTrendPts[0].y.toFixed(1)}`;
      for (let k = 0; k < windowDays.length - 1; k++) {
        const sp0 = sysTrendPts[k], sp1 = sysTrendPts[k + 1];
        const smx = (sp0.x + sp1.x) / 2;
        pathSys += ` C ${smx.toFixed(1)} ${sp0.y.toFixed(1)}, ${smx.toFixed(1)} ${sp1.y.toFixed(1)}, ${sp1.x.toFixed(1)} ${sp1.y.toFixed(1)}`;

        const dp0 = diaTrendPts[k], dp1 = diaTrendPts[k + 1];
        const dmx = (dp0.x + dp1.x) / 2;
        pathDia += ` C ${dmx.toFixed(1)} ${dp0.y.toFixed(1)}, ${dmx.toFixed(1)} ${dp1.y.toFixed(1)}, ${dp1.x.toFixed(1)} ${dp1.y.toFixed(1)}`;
      }
      trendLinesHtml = `
        <path d="${pathSys}" fill="none" stroke="#f43f5e" stroke-width="1.8" stroke-dasharray="4,3" opacity="0.75" />
        <path d="${pathDia}" fill="none" stroke="#06b6d4" stroke-width="1.8" stroke-dasharray="4,3" opacity="0.75" />
      `;
    }

    bpZoomSvgContainer.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; overflow:visible;">
        ${gridLinesHtml}
        ${columnsBgHtml}
        ${trendLinesHtml}
        ${dayElementsHtml}
        ${touchColumnsHtml}
      </svg>
    `;

    // Interacción al tocar columnas en el gráfico
    bpZoomSvgContainer.querySelectorAll('.bp-zoom-svg-col').forEach(col => {
      col.addEventListener('click', () => {
        triggerHaptic(12);
        const clickedDate = col.dataset.date;
        renderBpZoomView(clickedDate);
        const targetCard = document.getElementById('bpZoomCard_' + clickedDate);
        if (targetCard) targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });

    // ==========================================
    // TARJETAS DETALLADAS DÍA POR DÍA
    // ==========================================
    const cardsHtml = windowDays.map(d => {
      const [dy, dm, dd] = d.date.split('-').map(Number);
      const dDateObj = new Date(dy, dm - 1, dd, 12, 0, 0);
      const dayNameFull = days[dDateObj.getDay()];
      const monthNameFull = months[dm - 1];
      const isCenter = (d.date === targetDay.date);

      const centerIdxInWindow = windowDays.findIndex(x => x.date === targetDay.date);
      const relDiff = windowDays.indexOf(d) - centerIdxInWindow;
      let relBadge = '';
      if (isCenter) {
        relBadge = `<span style="background:rgba(59,130,246,0.2); color:#60a5fa; border:1px solid rgba(59,130,246,0.4); border-radius:6px; padding:2px 8px; font-size:0.72rem; font-weight:800;">🎯 ${isEn ? 'Selected day' : 'Día seleccionado'}</span>`;
      } else if (relDiff < 0) {
        const count = Math.abs(relDiff);
        const dayWord = isEn ? (count === 1 ? 'day before' : 'days before') : (count === 1 ? 'día antes' : 'días antes');
        relBadge = `<span style="background:rgba(255,255,255,0.06); color:var(--text-muted); border:1px solid var(--border-color); border-radius:6px; padding:2px 8px; font-size:0.72rem; font-weight:700;">${count} ${dayWord}</span>`;
      } else {
        const dayWord = isEn ? (relDiff === 1 ? 'day after' : 'days after') : (relDiff === 1 ? 'día después' : 'días después');
        relBadge = `<span style="background:rgba(255,255,255,0.06); color:var(--text-muted); border:1px solid var(--border-color); border-radius:6px; padding:2px 8px; font-size:0.72rem; font-weight:700;">${relDiff} ${dayWord}</span>`;
      }

      let amplitudeBoxHtml = '';
      if (d.hasMultiple) {
        const ampTitle = isEn ? `Daily range amplitude (${d.readings.length} readings):` : `Amplitud del rango diario (${d.readings.length} tomas):`;
        const avgTitle = isEn ? 'Average:' : 'Media:';
        const sysRangeTitle = isEn ? 'Systolic Range' : 'Rango Sistólica';
        const diaRangeTitle = isEn ? 'Diastolic Range' : 'Rango Diastólica';
        const ampWord = isEn ? 'Amplitude:' : 'Amplitud:';
        amplitudeBoxHtml = `
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:12px; padding:10px 12px; margin:8px 0;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:0.74rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">${ampTitle}</span>
              <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700;">${avgTitle} <strong style="color:#f43f5e;">${d.avgSys}</strong> / <strong style="color:#06b6d4;">${d.avgDia}</strong> mmHg</span>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
              <div style="background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.22); border-radius:8px; padding:8px 10px;">
                <div style="font-size:0.68rem; font-weight:800; color:#f43f5e; text-transform:uppercase;">${sysRangeTitle}</div>
                <div style="display:flex; align-items:baseline; gap:6px; margin-top:2px;">
                  <span style="font-size:1.1rem; font-weight:900; color:#ffffff;">${d.minSys} - ${d.maxSys}</span>
                  <span style="font-size:0.72rem; color:var(--text-muted);">mmHg</span>
                </div>
                <div style="margin-top:3px; font-size:0.73rem; font-weight:800; color:#f43f5e;">
                  ${ampWord} <strong>Δ ${d.sysRange} mmHg</strong>
                </div>
              </div>
              <div style="background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.22); border-radius:8px; padding:8px 10px;">
                <div style="font-size:0.68rem; font-weight:800; color:#06b6d4; text-transform:uppercase;">${diaRangeTitle}</div>
                <div style="display:flex; align-items:baseline; gap:6px; margin-top:2px;">
                  <span style="font-size:1.1rem; font-weight:900; color:#ffffff;">${d.minDia} - ${d.maxDia}</span>
                  <span style="font-size:0.72rem; color:var(--text-muted);">mmHg</span>
                </div>
                <div style="margin-top:3px; font-size:0.73rem; font-weight:800; color:#06b6d4;">
                  ${ampWord} <strong>Δ ${d.diaRange} mmHg</strong>
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        const singleTitle = isEn ? 'Single reading that day:' : 'Toma única registrada ese día:';
        amplitudeBoxHtml = `
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:10px; padding:8px 12px; margin:8px 0; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.76rem; color:var(--text-muted); font-weight:700;">${singleTitle}</span>
            <span style="font-size:0.88rem; font-weight:900; color:#ffffff;">
              <span style="color:#f43f5e;">${d.sys}</span> / <span style="color:#06b6d4;">${d.dia}</span> mmHg · <span style="color:var(--text-muted); font-size:0.75rem;">💓 ${d.pulse || 70} ppm</span>
            </span>
          </div>
        `;
      }

      const readingsListHtml = d.readings.map(r => {
        let stText = 'Óptimo';
        let stColor = '#10b981';
        if (r.sys < 120 && r.dia < 80) {
          stText = 'Óptimo';
          stColor = '#10b981';
        } else if (r.sys <= 129 && r.dia < 80) {
          stText = 'Normal';
          stColor = '#3b82f6';
        } else if (r.sys <= 139 || r.dia <= 89) {
          stText = 'HTA 1';
          stColor = '#f59e0b';
        } else {
          stText = 'HTA 2';
          stColor = '#ef4444';
        }

        return `
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:8px; padding:7px 10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:0.78rem; font-weight:800; color:#06b6d4; background:rgba(6,182,212,0.12); padding:2px 6px; border-radius:4px;">
                ⏰ ${r.time || '--:--'}
              </span>
              <span style="font-size:0.95rem; font-weight:900;">
                <span style="color:#f43f5e;">${r.sys}</span> / <span style="color:#06b6d4;">${r.dia}</span>
                <span style="font-size:0.7rem; color:var(--text-muted); font-weight:700;">mmHg</span>
              </span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700;">
                💓 ${r.pulse || 70} ppm
              </span>
              <span style="background:${stColor}22; color:${stColor}; border:1px solid ${stColor}44; border-radius:4px; padding:1px 6px; font-size:0.68rem; font-weight:800;">
                ${stText}
              </span>
              <button type="button" class="btn-3d btn-3d-surface bp-zoom-edit-btn" data-id="${r.id}" style="padding:2px 7px; font-size:0.7rem; font-weight:800; color:#06b6d4; border:1px solid rgba(6,182,212,0.3);">
                ✏️
              </button>
            </div>
          </div>
        `;
      }).join('');

      const medsList = Array.isArray(d.meds) && d.meds.length > 0
        ? d.meds.filter(m => (m.name || '').trim()).map((m, mIdx) => `<strong>${m.name}</strong> ${m.doseMg}mg <button type="button" class="btn-3d btn-3d-surface bp-quick-change-time-btn" data-log-id="${d.last.id}" data-med-idx="${mIdx}" style="padding:2px 7px; font-size:0.75rem; font-weight:800; color:#06b6d4; border:1px solid rgba(6,182,212,0.4); border-radius:6px; margin-left:3px;" title="Cambiar hora de esta medicación">⏰ ${m.time || '21:30'} ✏️</button>`).join(' · ')
        : '<span style="color:var(--text-muted); font-style:italic;">Sin medicación registrada</span>';

      return `
        <div id="bpZoomCard_${d.date}" style="background:var(--card-bg); border:${isCenter ? '1.8px solid #3b82f6' : '1px solid var(--border-color)'}; ${isCenter ? 'box-shadow:0 0 16px rgba(59,130,246,0.18);' : ''} border-radius:14px; padding:12px; transition:all 0.2s ease;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div style="font-size:0.88rem; font-weight:900; color:var(--text-main);">
              📅 ${dayNameFull}, ${dd} de ${monthNameFull}
            </div>
            ${relBadge}
          </div>
          ${amplitudeBoxHtml}
          <div style="margin-top:6px;">
            <div style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px; letter-spacing:0.4px;">
              Mediciones registradas (${d.readings.length}):
            </div>
            <div style="display:flex; flex-direction:column; gap:5px;">
              ${readingsListHtml}
            </div>
          </div>
          <div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--border-color); font-size:0.73rem; color:var(--text-muted);">
            💊 <strong>Medicación:</strong> ${medsList}
          </div>
        </div>
      `;
    }).join('');

    bpZoomCardsContainer.innerHTML = cardsHtml;

    // Listener para botones de edición dentro del zoom
    bpZoomCardsContainer.querySelectorAll('.bp-zoom-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerHaptic(14);
        const readingId = btn.dataset.id;
        if (bpZoomSheetBackdrop) bpZoomSheetBackdrop.classList.remove('open');
        openBpEditModal(readingId);
      });
    });

    bpZoomCardsContainer.querySelectorAll('.bp-quick-change-time-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerHaptic(14);
        const logId = btn.dataset.logId;
        const medIdx = parseInt(btn.dataset.medIdx, 10) || 0;
        openBpMedTimeModal(medIdx, logId);
      });
    });
  }

  if (closeBpZoomSheetBtn && bpZoomSheetBackdrop) {
    closeBpZoomSheetBtn.addEventListener('click', () => {
      triggerHaptic(12);
      bpZoomSheetBackdrop.classList.remove('open');
    });
  }

  if (bpZoomSheetBackdrop) {
    bpZoomSheetBackdrop.addEventListener('click', (e) => {
      if (Date.now() - lastBpZoomOpenedAt < 450) return;
      if (e.target === bpZoomSheetBackdrop) {
        bpZoomSheetBackdrop.classList.remove('open');
      }
    });
  }

  // Bottom Sheet Modal de PA
  if (bpLogDirectBtn && bpSheetBackdrop) {
    bpLogDirectBtn.addEventListener('click', () => {
      triggerHaptic(16);
      if (bpInputDate) bpInputDate.value = getLocalDateStr();
      if (bpInputTime) bpInputTime.value = new Date().toTimeString().slice(0, 5);
      prepareNewBpForm();
      renderBpHistoryList();
      bpSheetBackdrop.classList.add('open');
    });
  }

  // Ver detalles del historial de PA
  const bpGraphDetailLink = document.getElementById('bpGraphDetailLink');
  if (bpGraphDetailLink && bpSheetBackdrop) {
    bpGraphDetailLink.addEventListener('click', () => {
      triggerHaptic(12);
      bpModalTabs.forEach(b => b.classList.remove('active'));
      const listTab = Array.from(bpModalTabs).find(b => b.dataset.bptab === 'list');
      if (listTab) listTab.classList.add('active');
      bpTabNew.style.display = 'none';
      bpTabList.style.display = 'block';
      renderBpHistoryList();
      bpSheetBackdrop.classList.add('open');
    });
  }

  if (closeBpSheetBtn && bpSheetBackdrop) {
    closeBpSheetBtn.addEventListener('click', () => {
      bpSheetBackdrop.classList.remove('open');
    });
  }

  // Pestañas modal PA
  bpModalTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      triggerHaptic(12);
      bpModalTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.bptab;
      if (tab === 'new') {
        bpTabNew.style.display = 'block';
        bpTabList.style.display = 'none';
        prepareNewBpForm();
      } else {
        bpTabNew.style.display = 'none';
        bpTabList.style.display = 'block';
        renderBpHistoryList();
      }
    });
  });

  // Botón Registrar Nueva Tensión Arterial (bajo la gráfica de PA)
  const dashLogBpBtn = document.getElementById('dashLogBpBtn');
  if (dashLogBpBtn && bpSheetBackdrop) {
    dashLogBpBtn.addEventListener('click', () => {
      triggerHaptic(16);
      bpModalTabs.forEach(b => b.classList.remove('active'));
      const newTab = Array.from(bpModalTabs).find(b => b.dataset.bptab === 'new');
      if (newTab) newTab.classList.add('active');
      bpTabNew.style.display = 'block';
      bpTabList.style.display = 'none';
      if (bpInputDate) bpInputDate.value = getLocalDateStr();
      if (bpInputTime) bpInputTime.value = new Date().toTimeString().slice(0, 5);
      prepareNewBpForm();
      bpSheetBackdrop.classList.add('open');
    });
  }

  // Guardar o Actualizar lectura de PA
  if (bpSaveBtn) {
    bpSaveBtn.addEventListener('click', () => {
      triggerHaptic(20);
      const editId = bpEditId ? bpEditId.value : '';
      const d = bpInputDate.value || getLocalDateStr();
      const tm = bpInputTime.value || new Date().toTimeString().slice(0, 5);
      const sys = parseInt(bpInputSys.value, 10) || 120;
      const dia = parseInt(bpInputDia.value, 10) || 80;
      const pulse = parseInt(bpInputPulse.value, 10) || 70;

      // Filtrar y estructurar medicamentos válidos introducidos
      const validMeds = draftBpMeds
        .map(m => ({
          name: (m.name || '').trim(),
          doseMg: parseFloat(m.doseMg) || 0,
          time: (m.time || '21:30').trim()
        }))
        .filter(m => m.name.length > 0);

      let logs = getBpLogs();
      let targetId = editId;

      if (editId) {
        // Modo Edición
        const idx = logs.findIndex(l => l.id === editId);
        if (idx >= 0) {
          logs[idx] = { ...logs[idx], date: d, time: tm, sys, dia, pulse, meds: validMeds };
        } else {
          logs.push({ id: editId, date: d, time: tm, sys, dia, pulse, meds: validMeds });
        }
      } else {
        // Modo Nueva Lectura: permite múltiples tomas en el mismo día (mañana, tarde, noche)
        const sameDateTimeIdx = logs.findIndex(l => l.date === d && l.time === tm);
        if (sameDateTimeIdx >= 0) {
          logs[sameDateTimeIdx] = { ...logs[sameDateTimeIdx], sys, dia, pulse, meds: validMeds };
          targetId = logs[sameDateTimeIdx].id;
        } else {
          targetId = 'bp-' + Date.now();
          logs.push({ id: targetId, date: d, time: tm, sys, dia, pulse, meds: validMeds });
        }
      }

      // Ordenar cronológicamente para aplicar la propagación
      logs.sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));

      // Propagar medicación hacia adelante en tomas posteriores que estén vacías
      const fromIdx = logs.findIndex(l => l.id === targetId);
      let copiedCount = 0;
      if (fromIdx >= 0 && validMeds.length > 0) {
        copiedCount = propagateMedsForward(logs, fromIdx);
      }

      saveBpLogs(logs);

      // Resumen de medicación para el detalle del calendario
      const medSummary = validMeds.length > 0
        ? validMeds.map(m => `${m.name} ${m.doseMg}mg${m.time ? ` (⏰ ${m.time})` : ''}`).join(', ')
        : 'Sin medicación';

      // Registrar y sincronizar en el calendario todas las fechas y horas de tomas registradas
      const calEntries = JSON.parse(localStorage.getItem('mispep_calendar_entries') || '[]');
      logs.forEach(l => {
        const mSum = Array.isArray(l.meds) && l.meds.length > 0
          ? l.meds.map(m => `${m.name} ${m.doseMg}mg${m.time ? ` (⏰ ${m.time})` : ''}`).join(', ')
          : 'Sin medicación';
        const calIdx = calEntries.findIndex(e => e.type === 'bp' && (e.id === l.id || (e.date === l.date && e.time === l.time)));
        if (calIdx >= 0) {
          calEntries[calIdx].title = `PA: ${l.sys}/${l.dia} mmHg`;
          calEntries[calIdx].detail = `Pulso: ${l.pulse || 70} ppm · 💊 ${mSum}`;
          calEntries[calIdx].time = l.time || '09:00';
        } else if (l.id === targetId) {
          calEntries.unshift({
            id: 'cal-bp-' + l.id,
            date: l.date,
            type: 'bp',
            title: `PA: ${l.sys}/${l.dia} mmHg`,
            detail: `Pulso: ${l.pulse || 70} ppm · 💊 ${mSum}`,
            icon: '❤️',
            time: l.time || '09:00'
          });
        }
      });
      localStorage.setItem('mispep_calendar_entries', JSON.stringify(calEntries));

      if (bpSheetBackdrop) bpSheetBackdrop.classList.remove('open');
      let toastMsg = editId ? `✓ Medición actualizada: ${sys}/${dia} mmHg` : `✓ Lectura de PA guardada: ${sys}/${dia} mmHg`;
      if (copiedCount > 0) {
        toastMsg += ` (pauta copiada a ${copiedCount} tomas posteriores sin medicación)`;
      }
      showToast(toastMsg);
      if (window.renderCalendar) window.renderCalendar();
      if (window.renderDashboard) window.renderDashboard();
    });
  }

  function renderBpHistoryList() {
    if (!bpHistoryListContainer) return;
    const logs = [...getBpLogs()].sort((a, b) => new Date(b.date) - new Date(a.date));
    let html = '';
    logs.forEach((l, idx) => {
      const olderLog = idx < logs.length - 1 ? logs[idx + 1] : null;
      const diff = olderLog ? compareMeds(olderLog.meds, l.meds) : null;

      const medsSummary = Array.isArray(l.meds) && l.meds.length > 0
        ? l.meds.filter(m => (m.name || '').trim()).map(m => `${m.name} ${m.doseMg}mg${m.time ? ` (⏰ ${m.time})` : ''}`).join(', ')
        : 'Sin medicación';

      let diffTag = '';
      if (diff) {
        if (diff.type === '-') {
          diffTag = `<span style="background:rgba(16,185,129,0.18); color:#10b981; border:1px solid rgba(16,185,129,0.3); border-radius:4px; padding:1px 6px; font-size:0.68rem; font-weight:800;">[-] ${diff.summary}</span>`;
        } else if (diff.type === '+') {
          diffTag = `<span style="background:rgba(245,158,11,0.18); color:#f59e0b; border:1px solid rgba(245,158,11,0.3); border-radius:4px; padding:1px 6px; font-size:0.68rem; font-weight:800;">[+] ${diff.summary}</span>`;
        }
      }

      html += `
        <div style="background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:10px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:0.95rem; font-weight:900; color:#ffffff;">
                <span style="color:#f43f5e;">${l.sys}</span> / <span style="color:#06b6d4;">${l.dia}</span> <span style="font-size:0.75rem; color:var(--text-muted);">mmHg</span>
              </span>
              ${diffTag}
            </div>
            <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">
              ${l.date} ${l.time || ''} · Pulso: <strong>${l.pulse || 70} ppm</strong>
            </div>
            <div style="font-size:0.72rem; color:#06b6d4; font-weight:700; margin-top:3px;">
              💊 ${medsSummary}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <button type="button" class="icon-btn-3d bp-edit-btn" data-id="${l.id}" style="width:28px; height:28px; color:#3b82f6;" title="Editar medición y medicación">✏️</button>
            <button type="button" class="icon-btn-3d bp-del-btn" data-id="${l.id}" style="width:28px; height:28px; color:#ef4444;" title="Eliminar registro">🗑️</button>
          </div>
        </div>
      `;
    });
    bpHistoryListContainer.innerHTML = html;

    // Listeners para editar toma y medicación
    bpHistoryListContainer.querySelectorAll('.bp-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        triggerHaptic(16);
        const id = btn.dataset.id;
        openBpEditModal(id);
      });
    });

    // Listeners para borrar
    bpHistoryListContainer.querySelectorAll('.bp-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        triggerHaptic(14);
        const id = btn.dataset.id;
        const toRemove = getBpLogs().find(l => l.id === id);
        let logs = getBpLogs().filter(l => l.id !== id);
        saveBpLogs(logs);
        renderBpHistoryList();

        // Sincronizar eliminación en el calendario
        if (toRemove) {
          let calEntries = JSON.parse(localStorage.getItem('mispep_calendar_entries') || '[]');
          calEntries = calEntries.filter(e => !(e.type === 'bp' && e.date === toRemove.date));
          localStorage.setItem('mispep_calendar_entries', JSON.stringify(calEntries));
          if (window.renderCalendar) window.renderCalendar();
        }

        showToast('Registro de PA eliminado');
      });
    });
  }

  // Navegaciones rápidas
  if (dashGoInventoryBtn) {
    dashGoInventoryBtn.addEventListener('click', () => {
      if (window.switchModule) window.switchModule('inventory');
    });
  }
  if (dashGoPkBtn) {
    dashGoPkBtn.addEventListener('click', () => {
      if (window.switchModule) window.switchModule('plan');
    });
  }

  renderDashboard();
}

/* ============================================================
   0B. MÓDULO CALENDAR (Agenda, Registro Diario y Notificaciones)
   ============================================================ */
function initCalendar() {
  const modeSubtabs = document.querySelectorAll('#calModeSubtabs .subtab-btn');
  const viewCalendar = document.getElementById('calViewCalendar');
  const viewTimeline = document.getElementById('calViewTimeline');
  const viewReminders = document.getElementById('calViewReminders');

  const filterChips = document.querySelectorAll('#calFilterChips .filter-chip');
  const calPrevBtn = document.getElementById('calPrevMonthBtn');
  const calNextBtn = document.getElementById('calNextMonthBtn');
  const calMonthLabel = document.getElementById('calCurrentMonthLabel');
  const calDaysGrid = document.getElementById('calDaysGrid');

  const calSelectedHeader = document.getElementById('calSelectedDayHeader');
  const calClearBtn = document.getElementById('calClearDayEntriesBtn');
  const calEntriesList = document.getElementById('calDayEntriesList');
  const calActionCards = document.querySelectorAll('.action-card-6');

  const calActionBackdrop = document.getElementById('calActionBackdrop');
  const calModalTitle = document.getElementById('calModalTitle');
  const calModalCloseBtn = document.getElementById('calModalCloseBtn');
  const calModalBody = document.getElementById('calModalBody');

  const calTimelineList = document.getElementById('calTimelineList');
  const calExportPdfBtn = document.getElementById('calExportPdfBtn');

  const remMedInput = document.getElementById('remMedInput');
  const remDoseInput = document.getElementById('remDoseInput');
  const remTimeInput = document.getElementById('remTimeInput');
  const remDaySelect = document.getElementById('remDaySelect');
  const remSaveBtn = document.getElementById('remSaveBtn');
  const remTestBtn = document.getElementById('remTestBtn');

  // Estado del Calendario (Sincronizado con fecha local del móvil)
  const today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth(); // 0-11
  let selectedDateStr = getLocalDateStr(today); // "YYYY-MM-DD"
  let currentFilter = 'all';
  let userManuallySelectedDate = false;

  // Subpestañas: Calendario vs Cronología vs Recordatorios
  modeSubtabs.forEach(btn => {
    btn.addEventListener('click', () => {
      modeSubtabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.calmode;
      if (mode === 'calendar') {
        viewCalendar.style.display = 'block';
        viewTimeline.style.display = 'none';
        viewReminders.style.display = 'none';
        renderCalendar();
      } else if (mode === 'timeline') {
        viewCalendar.style.display = 'none';
        viewTimeline.style.display = 'block';
        viewReminders.style.display = 'none';
        renderTimeline();
      } else if (mode === 'reminders') {
        viewCalendar.style.display = 'none';
        viewTimeline.style.display = 'none';
        viewReminders.style.display = 'block';
      }
    });
  });

  // Filtros horizontales
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      renderCalendar();
    });
  });

  // Base de datos de entradas en el calendario
  function getEntries() {
    const raw = localStorage.getItem('mispep_calendar_entries');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Asegurar que la dosis de hoy 30/09 (2.0 mg) queda reflejada en el historial
        const hasDose30 = parsed.some(e => e.type === 'inj' && e.date === '2026-09-30');
        if (!hasDose30) {
          parsed.unshift({
            id: 'inj-20260930',
            date: '2026-09-30',
            type: 'inj',
            dose: 2.0,
            title: 'Retatrutide (2.0 mg)',
            detail: 'Inyección SubQ Abdomen superior izquierdo · Titulación a 2.0 mg',
            icon: '💉',
            time: '09:00'
          });
          localStorage.setItem('mispep_calendar_entries', JSON.stringify(parsed));
        }
        // Asegurar que la dosis del 22/09 (1.5 mg) queda reflejada en el historial
        const hasDose22 = parsed.some(e => e.type === 'inj' && e.date === '2026-09-22');
        if (!hasDose22) {
          parsed.push({
            id: 'inj-20260922',
            date: '2026-09-22',
            type: 'inj',
            dose: 1.5,
            title: 'Retatrutide (1.5 mg)',
            detail: 'Inyección SubQ Abdomen superior izquierdo',
            icon: '💉',
            time: '09:00'
          });
          localStorage.setItem('mispep_calendar_entries', JSON.stringify(parsed));
        }
        return parsed;
      } catch (_) {}
    }
    // Entradas predeterminadas de ejemplo realistas
    const initial = [
      {
        id: 'inj-20260930',
        date: '2026-09-30',
        type: 'inj',
        dose: 2.0,
        title: 'Retatrutide (2.0 mg)',
        detail: 'Inyección SubQ Abdomen superior izquierdo · Titulación a 2.0 mg',
        icon: '💉',
        time: '09:00'
      },
      {
        id: 'inj-20260922',
        date: '2026-09-22',
        type: 'inj',
        dose: 1.5,
        title: 'Retatrutide (1.5 mg)',
        detail: 'Inyección SubQ Abdomen superior izquierdo',
        icon: '💉',
        time: '09:00'
      },
      {
        id: 'init-1',
        date: '2026-09-14',
        type: 'inj',
        dose: 1.5,
        title: 'Retatrutide (1.5 mg)',
        detail: 'Inyección SubQ Abdomen izquierdo',
        icon: '💉',
        time: '09:30'
      },
      {
        id: 'init-2',
        date: '2026-09-14',
        type: 'weight',
        title: 'Peso: 91.0 kg',
        detail: 'IMC actual 32.6 (En ayunas)',
        icon: '⚖️',
        time: '08:15'
      }
    ];
    localStorage.setItem('mispep_calendar_entries', JSON.stringify(initial));
    return initial;
  }

  function saveEntries(entries) {
    localStorage.setItem('mispep_calendar_entries', JSON.stringify(entries));
    renderCalendar();
  }

  // Navegación de mes
  if (calPrevBtn) {
    calPrevBtn.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderCalendar();
    });
  }
  if (calNextBtn) {
    calNextBtn.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar();
    });
  }

  // Renderizado del Calendario Mensual
  function renderCalendar() {
    window.renderCalendar = renderCalendar;
    if (!calDaysGrid) return;

    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    calMonthLabel.textContent = `${monthNames[currentMonth]} de ${currentYear}`;

    // Obtener primer día de la semana y total de días (formato europeo L-D: Lunes=0 ... Domingo=6)
    const rawDay = new Date(currentYear, currentMonth, 1).getDay(); // 0=Dom ... 6=Sab
    const firstDayIndex = (rawDay + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const entries = getEntries();
    // Leer fecha de próxima inyección programada en el perfil
    const healthProfile = JSON.parse(localStorage.getItem('mispep_health_profile') || '{}');
    const nextInjDate = healthProfile.nextInjectionDate || '';

    let html = '';

    // Días del mes anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const colIdx = firstDayIndex - 1 - i;
      const isSun = (colIdx === 6);
      html += `<div class="cal-day other-month${isSun ? ' sunday' : ''}">${d}</div>`;
    }

    // Días del mes actual (hora local del dispositivo)
    const nowDevice = new Date();
    const todayStr = getLocalDateStr(nowDevice);
    if (!userManuallySelectedDate) {
      selectedDateStr = todayStr;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateKey = `${currentYear}-${mStr}-${dStr}`;

      const isToday = dateKey === todayStr;
      const isSelected = dateKey === selectedDateStr;
      const isScheduled = dateKey === nextInjDate;
      const dayOfWeek = (firstDayIndex + d - 1) % 7; // 0=Lun ... 6=Dom
      const isSunday = (dayOfWeek === 6);

      // Filtrar entradas para este día
      let dayEntries = entries.filter(e => e.date === dateKey);
      if (currentFilter !== 'all') {
        dayEntries = dayEntries.filter(e => e.type === currentFilter);
      }

      let dotsHtml = '';
      if (dayEntries.length > 0) {
        dotsHtml = '<div class="cal-day-dots">';
        dayEntries.slice(0, 3).forEach(e => {
          dotsHtml += `<span>${e.icon || '●'}</span>`;
        });
        dotsHtml += '</div>';
      } else if (isScheduled) {
        dotsHtml = '<div class="cal-day-dots"><span style="color:#8b5cf6;">💉</span></div>';
      }

      let classes = ['cal-day'];
      if (isSunday) classes.push('sunday');
      if (isToday) classes.push('today');
      if (isSelected) classes.push('selected');
      if (isScheduled && !isSelected) classes.push('scheduled');

      html += `
        <div class="${classes.join(' ')}" data-date="${dateKey}">
          <span>${d}</span>
          ${dotsHtml}
        </div>
      `;
    }

    calDaysGrid.innerHTML = html;

    // Eventos al pulsar cualquier día del calendario
    calDaysGrid.querySelectorAll('.cal-day:not(.other-month)').forEach(dayEl => {
      dayEl.addEventListener('click', () => {
        triggerHaptic(12);
        userManuallySelectedDate = true;
        selectedDateStr = dayEl.dataset.date;
        renderCalendar();
      });
    });

    renderDayDetail();
  }

  // Sincronización automática de fecha local al volver a la app o pasar la medianoche
  function syncCalendarDate() {
    const now = new Date();
    const todayLocal = getLocalDateStr(now);
    if (!userManuallySelectedDate) {
      currentYear = now.getFullYear();
      currentMonth = now.getMonth();
      selectedDateStr = todayLocal;
    }
    if (typeof renderCalendar === 'function') renderCalendar();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncCalendarDate();
      if (window.renderBenchDashboard) window.renderBenchDashboard();
      if (window.renderPkGraph) window.renderPkGraph();
    }
  });
  document.addEventListener('resume', syncCalendarDate, false);

  // Renderizar detalle del día seleccionado
  function renderDayDetail() {
    if (!calSelectedHeader || !calEntriesList) return;

    // Formatear cabecera con el día de la semana en español
    const parts = selectedDateStr.split('-');
    const selDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateFormatted = selDateObj.toLocaleDateString('es-ES', options);
    calSelectedHeader.textContent = dateFormatted;

    const entries = getEntries();
    let dayEntries = entries.filter(e => e.date === selectedDateStr);
    if (currentFilter !== 'all') {
      dayEntries = dayEntries.filter(e => e.type === currentFilter);
    }

    if (dayEntries.length === 0) {
      calEntriesList.innerHTML = `
        <div style="background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:14px; padding:18px 12px; text-align:center; margin-bottom:12px;">
          <div style="font-size:2rem; margin-bottom:4px;">🗓️</div>
          <div style="font-size:0.88rem; font-weight:800; color:var(--text-main);">No hay entradas en esta fecha</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Usa las tarjetas inferiores para registrar métricas o inyecciones.</div>
        </div>
      `;
      if (calClearBtn) calClearBtn.style.display = 'none';
    } else {
      if (calClearBtn) calClearBtn.style.display = 'inline-block';
      let html = '<div style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px;">';
      dayEntries.forEach(item => {
        html += `
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:12px; padding:10px 14px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.4rem;">${item.icon || '📝'}</span>
              <div>
                <div style="font-weight:800; font-size:0.88rem; color:var(--text-main);">${item.title}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${item.detail} · ${item.time || ''}</div>
              </div>
            </div>
            <button type="button" class="icon-btn-3d delete-entry-btn" data-id="${item.id}" style="width:26px; height:26px; font-size:0.7rem;">✕</button>
          </div>
        `;
      });
      html += '</div>';
      calEntriesList.innerHTML = html;

      // Eventos para borrar entrada individual
      calEntriesList.querySelectorAll('.delete-entry-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          let all = getEntries().filter(e => e.id !== id);
          saveEntries(all);
          showToast('Entrada eliminada');
        });
      });
    }
  }

  // Borrar todas las entradas del día seleccionado
  if (calClearBtn) {
    calClearBtn.addEventListener('click', () => {
      let all = getEntries().filter(e => e.date !== selectedDateStr);
      saveEntries(all);
      showToast('Registros del día borrados');
    });
  }

  function closeActionModal() {
    if (calActionBackdrop) calActionBackdrop.classList.remove('open');
  }

  if (calModalCloseBtn) calModalCloseBtn.addEventListener('click', closeActionModal);
  if (calActionBackdrop) {
    calActionBackdrop.addEventListener('click', (e) => {
      if (e.target === calActionBackdrop) closeActionModal();
    });
  }

  // Delegación de eventos para las 6 tarjetas de acción de registro
  const actionGrid = document.querySelector('.action-grid-6');
  if (actionGrid) {
    actionGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.action-card-6');
      if (card) {
        triggerHaptic(18);
        const action = card.dataset.action;
        openActionModal(action);
      }
    });
  } else {
    calActionCards.forEach(card => {
      card.addEventListener('click', () => {
        triggerHaptic(18);
        const action = card.dataset.action;
        openActionModal(action);
      });
    });
  }

  function openActionModal(action) {
    if (action === 'add-inj') {
      if (window.openAddDoseModal) {
        window.openAddDoseModal(selectedDateStr);
        return;
      }
    }

    if (!calActionBackdrop || !calModalBody) return;

    const curTime = new Date().toTimeString().slice(0, 5);

    if (action === 'add-inj') {
      calModalTitle.textContent = '💉 Añadir Inyección';
      calModalBody.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <div>
            <label class="field-label">Medicamento / Péptido</label>
            <input type="text" id="mInjName" value="Retatrutide" style="width:100%; background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; padding:9px; font-weight:700;">
          </div>
          <div class="grid-2col">
            <div>
              <label class="field-label">Dosis (mg)</label>
              <input type="number" id="mInjDose" value="1.5" step="any" style="width:100%; background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; padding:9px; font-weight:700;">
            </div>
            <div>
              <label class="field-label">Hora</label>
              <input type="time" id="mInjTime" value="${curTime}" style="width:100%; background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; padding:9px; font-weight:700;">
            </div>
          </div>
          <div>
            <label class="field-label">Zona de Inyección SubQ</label>
            <select id="mInjZone" style="width:100%; background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; padding:9px; font-weight:700;">
              <option value="Abdomen Izquierdo">Abdomen Izquierdo</option>
              <option value="Abdomen Derecho">Abdomen Derecho</option>
              <option value="Muslo Izquierdo">Muslo Izquierdo</option>
              <option value="Muslo Derecho">Muslo Derecho</option>
              <option value="Brazo / Deltoides">Brazo / Deltoides</option>
            </select>
          </div>
          <button type="button" class="btn-3d btn-3d-purple btn-block" id="mSaveEntryBtn" style="margin-top:6px;">
            ✓ Guardar Inyección
          </button>
        </div>
      `;
    } else if (action === 'add-weight') {
      calModalTitle.textContent = '⚖️ Registrar Peso';
      const lastW = JSON.parse(localStorage.getItem('mispep_health_profile') || '{}').currentWeight || 91.0;
      calModalBody.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <div class="grid-2col">
            <div>
              <label class="field-label">Peso Corporal (kg)</label>
              <div class="input-group" style="margin:0;">
                <input type="number" id="mWeightVal" value="${lastW}" step="0.1">
                <span class="unit-badge">kg</span>
              </div>
            </div>
            <div>
              <label class="field-label">Hora</label>
              <input type="time" id="mWeightTime" value="${curTime}" style="width:100%; background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; padding:9px; font-weight:700;">
            </div>
          </div>
          <button type="button" class="btn-3d btn-3d-emerald btn-block" id="mSaveEntryBtn" style="margin-top:6px;">
            ✓ Guardar Registro de Peso
          </button>
        </div>
      `;
    } else if (action === 'add-bp') {
      calModalTitle.textContent = '❤️ Presión Arterial y Pulso';
      calModalBody.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <div class="grid-2col">
            <div>
              <label class="field-label">Sistólica (mmHg)</label>
              <input type="number" id="mBpSys" value="120" style="width:100%; background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; padding:9px; font-weight:700;">
            </div>
            <div>
              <label class="field-label">Diastólica (mmHg)</label>
              <input type="number" id="mBpDia" value="80" style="width:100%; background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; padding:9px; font-weight:700;">
            </div>
          </div>
          <div>
            <label class="field-label">Frecuencia Cardíaca (ppm)</label>
            <input type="number" id="mBpPulse" value="70" style="width:100%; background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; padding:9px; font-weight:700;">
          </div>
          <button type="button" class="btn-3d btn-3d-rose btn-block" id="mSaveEntryBtn" style="margin-top:6px;">
            ✓ Guardar Presión Arterial
          </button>
        </div>
      `;
    } else if (action === 'add-mood') {
      calModalTitle.textContent = '😊 Estado de Ánimo y Energía';
      calModalBody.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <div>
            <label class="field-label">Estado de Ánimo</label>
            <select id="mMoodVal" style="width:100%; background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; padding:9px; font-weight:700;">
              <option value="Excelente">Excelente (Gran vitalidad) 🌟</option>
              <option value="Bien" selected>Bien (Estable y cómodo) 😊</option>
              <option value="Normal">Normal (Sin cambios) 😐</option>
              <option value="Cansado">Cansado / Fatiga leve 🥱</option>
              <option value="Bajo">Bajo de energía 🌧️</option>
            </select>
          </div>
          <div>
            <label class="field-label">Nivel de Apetito</label>
            <select id="mAppetiteVal" style="width:100%; background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; padding:9px; font-weight:700;">
              <option value="Muy Supreso">Muy suprimido (Sin hambre)</option>
              <option value="Normal / Controlado" selected>Controlado y sin antojos</option>
              <option value="Alto">Apetito alto</option>
            </select>
          </div>
          <button type="button" class="btn-3d btn-3d-amber btn-block" id="mSaveEntryBtn" style="margin-top:6px;">
            ✓ Guardar Ánimo
          </button>
        </div>
      `;
    } else if (action === 'add-measure') {
      calModalTitle.textContent = '📏 Medidas Corporales';
      calModalBody.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <div class="grid-2col">
            <div>
              <label class="field-label">Vientre (cm)</label>
              <input type="number" id="mWaist" value="98" style="width:100%; background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; padding:9px; font-weight:700;">
            </div>
            <div>
              <label class="field-label">Cadera (cm)</label>
              <input type="number" id="mHip" value="104" style="width:100%; background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; padding:9px; font-weight:700;">
            </div>
          </div>
          <button type="button" class="btn-3d btn-3d-cyan btn-block" id="mSaveEntryBtn" style="margin-top:6px;">
            ✓ Guardar Medidas
          </button>
        </div>
      `;
    } else {
      calModalTitle.textContent = '📷 Foto de Progreso';
      calModalBody.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <label class="field-label">Nota o Etiqueta de la Foto</label>
          <input type="text" id="mPhotoNote" value="Vista Frontal - Semana 2" style="width:100%; background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px; padding:9px; font-weight:700;">
          <p style="font-size:0.75rem; color:var(--text-muted);">Foto registrada en el historial clínico.</p>
          <button type="button" class="btn-3d btn-3d-purple btn-block" id="mSaveEntryBtn" style="margin-top:6px;">
            ✓ Guardar Registro de Foto
          </button>
        </div>
      `;
    }

    // Desplegar el Bottom Sheet Modal con animación fluida
    if (calActionBackdrop) calActionBackdrop.classList.add('open');

    // Botón Guardar dentro del Modal
    const saveBtn = document.getElementById('mSaveEntryBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const entries = getEntries();
        const entryId = 'entry-' + Date.now();

        if (action === 'add-inj') {
          const med = document.getElementById('mInjName').value || 'Péptido';
          const dose = document.getElementById('mInjDose').value || '1.5';
          const zone = document.getElementById('mInjZone').value;
          const time = document.getElementById('mInjTime').value || curTime;
          entries.unshift({
            id: entryId,
            date: selectedDateStr,
            type: 'inj',
            title: `${med} (${dose} mg)`,
            detail: `${zone}`,
            icon: '💉',
            time: time
          });
          // Actualizar inyecciones en el modelo PK
          let pkDoses = JSON.parse(localStorage.getItem('mispep_pk_doses') || '[]');
          pkDoses.push({ date: selectedDateStr + 'T12:00:00', doseMg: parseFloat(dose) || 1.5 });
          localStorage.setItem('mispep_pk_doses', JSON.stringify(pkDoses));
        } else if (action === 'add-weight') {
          const w = parseFloat(document.getElementById('mWeightVal').value) || 91.0;
          const time = document.getElementById('mWeightTime').value || curTime;
          entries.unshift({
            id: entryId,
            date: selectedDateStr,
            type: 'weight',
            title: `Peso: ${w.toFixed(1)} kg`,
            detail: `Registro corporal`,
            icon: '⚖️',
            time: time
          });
          // Actualizar perfil de salud
          const hp = JSON.parse(localStorage.getItem('mispep_health_profile') || '{}');
          hp.currentWeight = w;
          if (!hp.weightLogs) hp.weightLogs = [];
          hp.weightLogs.push({ date: selectedDateStr, weight: w });
          localStorage.setItem('mispep_health_profile', JSON.stringify(hp));
        } else if (action === 'add-bp') {
          const sys = document.getElementById('mBpSys').value || '120';
          const dia = document.getElementById('mBpDia').value || '80';
          const pulse = document.getElementById('mBpPulse').value || '70';
          entries.unshift({
            id: entryId,
            date: selectedDateStr,
            type: 'bp',
            title: `PA: ${sys}/${dia} mmHg`,
            detail: `Pulso: ${pulse} ppm`,
            icon: '❤️',
            time: curTime
          });
        } else if (action === 'add-mood') {
          const mood = document.getElementById('mMoodVal').value;
          const app = document.getElementById('mAppetiteVal').value;
          entries.unshift({
            id: entryId,
            date: selectedDateStr,
            type: 'mood',
            title: `Ánimo: ${mood}`,
            detail: `Apetito: ${app}`,
            icon: '😊',
            time: curTime
          });
        } else if (action === 'add-measure') {
          const waist = document.getElementById('mWaist').value || '0';
          const hip = document.getElementById('mHip').value || '0';
          entries.unshift({
            id: entryId,
            date: selectedDateStr,
            type: 'measure',
            title: `Vientre: ${waist} cm · Cadera: ${hip} cm`,
            detail: `Medidas corporales`,
            icon: '📏',
            time: curTime
          });
        } else {
          const note = document.getElementById('mPhotoNote').value;
          entries.unshift({
            id: entryId,
            date: selectedDateStr,
            type: 'photo',
            title: `Foto de progreso`,
            detail: note,
            icon: '📷',
            time: curTime
          });
        }

        saveEntries(entries);
        closeActionModal();
        showToast('✓ Entrada guardada con éxito');
      });
    }
  }

  // Renderizar Cronología (Timeline)
  function renderTimeline() {
    if (!calTimelineList) return;
    const entries = getEntries();
    if (entries.length === 0) {
      calTimelineList.innerHTML = '<p style="color:var(--text-muted); text-align:center;">No hay registros aún.</p>';
      return;
    }
    let html = '<div style="display:flex; flex-direction:column; gap:10px;">';
    entries.forEach(e => {
      html += `
        <div style="background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:12px; padding:12px; display:flex; gap:10px; align-items:center;">
          <span style="font-size:1.5rem;">${e.icon || '📝'}</span>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:800; font-size:0.9rem; color:var(--text-main);">${e.title}</span>
              <span style="font-size:0.72rem; color:var(--text-muted);">${e.date}</span>
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">${e.detail}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    calTimelineList.innerHTML = html;
  }

  // Notificaciones y Recordatorios Nativos
  if (remSaveBtn) {
    remSaveBtn.addEventListener('click', () => {
      const med = remMedInput.value.trim() || 'Retatrutide';
      const dose = remDoseInput.value || '1.5';
      const time = remTimeInput.value || '09:00';
      const dayIdx = parseInt(remDaySelect.value, 10) || 0;
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

      // Calcular retardo aproximado en milisegundos hasta la próxima ocurrencia
      const now = new Date();
      let target = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      target.setHours(hours, minutes, 0, 0);

      let diffDays = (dayIdx - now.getDay() + 7) % 7;
      if (diffDays === 0 && target <= now) {
        diffDays = 7;
      }
      target.setDate(now.getDate() + diffDays);
      const delayMs = Math.max(5000, target.getTime() - now.getTime());

      if (window.AndroidBridge && typeof window.AndroidBridge.scheduleDoseReminder === 'function') {
        window.AndroidBridge.scheduleDoseReminder(
          `💉 Recordatorio de Inyección: ${med}`,
          `Es hora de tu dosis programada de ${dose} mg de ${med}. Recuerda rotar la zona SubQ.`,
          delayMs
        );
      }

      localStorage.setItem('mispep_reminder_config', JSON.stringify({ med, dose, time, dayIdx }));
      // getHealthProfile/saveProfile viven dentro de initDashboard: solo por namespace.
      const hp = (window.MisPepProtocols && window.MisPepProtocols.getHealthProfile)
        ? window.MisPepProtocols.getHealthProfile() : null;
      if (hp) {
        hp.reminderTime = time;
        if (window.MisPepProtocols.saveProfile) window.MisPepProtocols.saveProfile(hp);
      }
      scheduleNextDoseAlarm();
      showToast(`✓ Recordatorio activo: cada ${dayNames[dayIdx]} a las ${time}`);
    });
  }

  if (remTestBtn) {
    remTestBtn.addEventListener('click', () => {
      const med = remMedInput.value.trim() || 'Retatrutide';
      const dose = remDoseInput.value || '1.5';

      if (window.AndroidBridge && typeof window.AndroidBridge.notifyDose === 'function') {
        window.AndroidBridge.notifyDose(
          `💉 Dosis de ${med} lista`,
          `Recordatorio de prueba: ${dose} mg de ${med}. Nivel óptimo programado.`
        );
        showToast('✓ Notificación enviada a la barra de estado de Android');
      } else {
        showToast(`🔔 Notificación de prueba: ${dose} mg de ${med}`);
      }
    });
  }

  // Exportar Informe de Salud PDF
  if (calExportPdfBtn) {
    calExportPdfBtn.addEventListener('click', () => {
      const p = JSON.parse(localStorage.getItem('mispep_health_profile') || '{}');
      const entries = getEntries();
      const report = `Informe de Salud MisPep:
- Tratamiento: ${p.activeMed || 'Retatrutide'}
- Peso actual: ${p.currentWeight || 91.0} kg (Inicio: ${p.startWeight || 91.0} kg)
- Inyecciones administradas: ${p.totalInjections || 1}
- Registros totales: ${entries.length}`;

      showToast('✓ Generando informe clínico...');
      if (window.AndroidBridge && typeof window.AndroidBridge.notifyDose === 'function') {
        window.AndroidBridge.notifyDose('Informe de Salud Generado', 'Tu resumen clínico está listo para compartir.');
      }
    });
  }

  renderCalendar();
}

/* ============================================================
   0C. MODAL COMPLETO: AÑADIR DOSIS (SHOTLEE REPLICA)
   ============================================================ */
function initAddDoseModal() {
  const backdrop = document.getElementById('addDoseModalBackdrop');
  const closeBtn = document.getElementById('closeAddDoseModalBtn');
  const cancelBtn = document.getElementById('cancelAddDoseBtn');
  const confirmBtn = document.getElementById('confirmAddDoseBtn');

  const medSearch = document.getElementById('addDoseMedSearch');
  const medWheel = document.getElementById('addDoseMedWheel');
  const selectedMedLabel = document.getElementById('addDoseSelectedMedLabel');
  const classMedName = document.getElementById('addDoseClassMedName');
  const classDetail = document.getElementById('addDoseClassDetail');
  const addCustomMedBtn = document.getElementById('addCustomMedBtn');

  const doseNumberInput = document.getElementById('addDoseNumberInput');
  const unitCards = document.querySelectorAll('.dose-unit-card');

  const selectedZoneLabel = document.getElementById('addDoseSelectedZoneLabel');
  const bodyNodes = document.querySelectorAll('.body-node-item');
  const zoneChips = document.querySelectorAll('.body-zone-chip');

  const plannedToggle = document.getElementById('addDosePlannedToggle');
  const nextDateInput = document.getElementById('addDoseNextDateInput');
  const nextTimeInput = document.getElementById('addDoseNextTimeInput');

  const symptomHeader = document.getElementById('addDoseSymptomHeader');
  const symptomBody = document.getElementById('addDoseSymptomBody');
  const symptomChevron = document.getElementById('addDoseSymptomChevron');
  const moodSelect = document.getElementById('addDoseMoodSelect');
  const appetiteSelect = document.getElementById('addDoseAppetiteSelect');
  const painRange = document.getElementById('addDosePainRange');

  let activeMed = 'Retatrutide';
  let activeUnit = 'mg';
  let activeZone = 'Abdomen - Superior izquierdo';
  let injectionDateOverride = null;

  const skippedToggle = document.getElementById('addDoseSkippedToggle');
  const sectionDosis = document.getElementById('addDoseSectionDosis');
  const sectionZone = document.getElementById('addDoseSectionZone');

  if (skippedToggle) {
    skippedToggle.addEventListener('change', () => {
      triggerHaptic(14);
      const isSkip = skippedToggle.checked;
      if (sectionDosis) {
        sectionDosis.style.opacity = isSkip ? '0.45' : '1';
        sectionDosis.style.pointerEvents = isSkip ? 'none' : 'auto';
      }
      if (sectionZone) {
        sectionZone.style.opacity = isSkip ? '0.45' : '1';
        sectionZone.style.pointerEvents = isSkip ? 'none' : 'auto';
      }
      if (confirmBtn) {
        confirmBtn.innerHTML = isSkip ? '⏭️ Registrar dosis omitida' : '✓ Añadir dosis';
        confirmBtn.style.background = isSkip 
          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      }
    });
  }

  window.openAddDoseModal = function(prefillDate) {
    triggerHaptic(18);
    injectionDateOverride = prefillDate || null;
    const p = JSON.parse(localStorage.getItem('mispep_health_profile') || '{}');
    activeMed = p.activeMed || 'Retatrutide';
    if (selectedMedLabel) selectedMedLabel.textContent = activeMed;
    if (classMedName) classMedName.textContent = activeMed;
    if (doseNumberInput) doseNumberInput.value = (p.nextDoseMg || 0.5).toString();

    // Preparación del pinchazo: conservar el vial actual (mg) y el agua BAC habituales
    try {
      const savedCalc = JSON.parse(localStorage.getItem('mispep_calc_state') || 'null') || {};
      if (prepVialInput && savedCalc.vialMg !== undefined && savedCalc.vialMg !== '') prepVialInput.value = savedCalc.vialMg;
      if (prepBacInput && savedCalc.bacMl !== undefined && savedCalc.bacMl !== '') prepBacInput.value = savedCalc.bacMl;
      if (prepSyringeSel && savedCalc.syringe !== undefined) prepSyringeSel.value = savedCalc.syringe;
    } catch (_) {}
    updatePrepVisual();

    if (skippedToggle) {
      skippedToggle.checked = false;
      if (sectionDosis) {
        sectionDosis.style.opacity = '1';
        sectionDosis.style.pointerEvents = 'auto';
      }
      if (sectionZone) {
        sectionZone.style.opacity = '1';
        sectionZone.style.pointerEvents = 'auto';
      }
      if (confirmBtn) {
        confirmBtn.innerHTML = '✓ Añadir dosis';
        confirmBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      }
    }

    // Rango fecha próxima dosis por defecto: freqDays días desde la fecha de inyección (ej. 7 días)
    const baseInjDate = injectionDateOverride ? new Date(injectionDateOverride + 'T12:00:00') : new Date();
    const hpFreq = parseInt(p.freqDays, 10) || 7;
    const nextD = getLocalDateStr(new Date(baseInjDate.getTime() + hpFreq * 24 * 3600 * 1000));
    const rc = JSON.parse(localStorage.getItem('mispep_reminder_config') || '{}');
    if (nextDateInput) nextDateInput.value = nextD;
    if (nextTimeInput) nextTimeInput.value = p.injReminderTime || rc.time || '09:00';

    // Actualizar elemento seleccionado en rueda
    if (medWheel) {
      medWheel.querySelectorAll('.med-wheel-item').forEach(item => {
        if (item.dataset.med.toLowerCase() === activeMed.toLowerCase()) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });
    }

    if (backdrop) backdrop.classList.add('open');
  };

  function closeModal() {
    if (backdrop) backdrop.classList.remove('open');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  // Buscador de Medicamentos
  if (medSearch && medWheel) {
    medSearch.addEventListener('input', () => {
      const q = medSearch.value.trim().toLowerCase();
      medWheel.querySelectorAll('.med-wheel-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? 'flex' : 'none';
      });
    });
  }

  // Selección en la Rueda de Medicamentos
  if (medWheel) {
    medWheel.addEventListener('click', (e) => {
      const item = e.target.closest('.med-wheel-item');
      if (!item) return;
      triggerHaptic(12);
      medWheel.querySelectorAll('.med-wheel-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');

      activeMed = item.dataset.med;
      const cls = item.dataset.class || 'Péptido / Compuesto bioactivo';
      if (selectedMedLabel) selectedMedLabel.textContent = activeMed;
      if (classMedName) classMedName.textContent = activeMed;
      if (classDetail) classDetail.textContent = `Clase: ${cls}`;
    });
  }

  // Medicamentos guardados desde la Biblioteca de Péptidos (persisten al reiniciar)
  restaurarMedsGuardados();

  // Añadir Medicamento Personalizado
  if (addCustomMedBtn && medWheel) {
    addCustomMedBtn.addEventListener('click', () => {
      const name = prompt('Nombre del medicamento o péptido personalizado:');
      if (!name || !name.trim()) return;
      const cleanName = name.trim();
      const div = document.createElement('div');
      div.className = 'med-wheel-item selected';
      div.dataset.med = cleanName;
      div.dataset.class = 'Medicamento personalizado';
      div.textContent = cleanName;

      medWheel.querySelectorAll('.med-wheel-item').forEach(i => i.classList.remove('selected'));
      medWheel.prepend(div);
      guardarMedPersonalizado(cleanName, 'Medicamento personalizado');
      activeMed = cleanName;
      if (selectedMedLabel) selectedMedLabel.textContent = cleanName;
      if (classMedName) classMedName.textContent = cleanName;
      if (classDetail) classDetail.textContent = 'Clase: Medicamento personalizado';
      showToast(`✓ ${cleanName} añadido a la lista`);
    });
  }

  // Unidades de Fuerza Activa
  unitCards.forEach(card => {
    card.addEventListener('click', () => {
      triggerHaptic(12);
      unitCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      activeUnit = card.dataset.unit || 'mg';
      updatePrepVisual();
    });
  });

  // ——— PREPARACIÓN DEL PINCHAZO: jeringuilla y pluma sincronizadas con la dosis ———
  const prepVialInput = document.getElementById('addDoseVialMg');
  const prepBacInput = document.getElementById('addDoseBacMl');
  const prepSyringeSel = document.getElementById('addDoseSyringeSel');
  const prepUnitsBadge = document.getElementById('addDoseUnitsBadge');
  const prepPenBadge = document.getElementById('addDosePenBadge');
  const prepNote = document.getElementById('addDosePrepNote');
  const PREP_NOTE_DEFAULT = prepNote ? prepNote.textContent : '';

  function updatePrepVisual() {
    if (!prepVialInput || !prepBacInput) return;
    const vialMg = parseFloat(prepVialInput.value) || 0;
    const bacMl = parseFloat(prepBacInput.value) || 0;
    const syringeUnits = prepSyringeSel ? (parseInt(prepSyringeSel.value, 10) || 100) : 100;
    const rawDose = doseNumberInput ? (parseFloat(doseNumberInput.value) || 0) : 0;

    let doseMg = null;
    if (activeUnit === 'mg') doseMg = rawDose;
    else if (activeUnit === 'mcg') doseMg = rawDose / 1000;

    const resetDisplays = () => {
      if (prepUnitsBadge) prepUnitsBadge.textContent = '— unidades';
      if (prepPenBadge) prepPenBadge.textContent = '--';
      renderSyringe('addDoseSyringeView', 0, syringeUnits);
      renderPen('addDosePenView', 0, 0, syringeUnits);
    };

    if (doseMg === null) {
      resetDisplays();
      if (prepNote) prepNote.textContent = '⚠️ Usa mg o mcg como unidad de dosis para ver la jeringuilla y la pluma (IU y mL no son convertibles).';
      return;
    }
    if (vialMg <= 0 || bacMl <= 0 || doseMg <= 0) {
      resetDisplays();
      if (prepNote) prepNote.textContent = PREP_NOTE_DEFAULT;
      return;
    }

    const concMgMl = vialMg / bacMl;
    const volumeMl = doseMg / concMgMl;
    const units = syringeUnits === 40 ? volumeMl * 40 : volumeMl * 100;
    const clicksVal = Number.isInteger(units) ? units : parseFloat(units.toFixed(1));

    if (prepUnitsBadge) prepUnitsBadge.textContent = fmtNum(units, 1) + ' u · ' + fmtNum(volumeMl, 3) + ' mL';
    if (prepPenBadge) prepPenBadge.textContent = clicksVal + 'U · ' + fmtNum(doseMg, 2) + ' mg';
    if (prepNote) prepNote.textContent = PREP_NOTE_DEFAULT;

    renderSyringe('addDoseSyringeView', units, syringeUnits);
    renderPen('addDosePenView', clicksVal, units, syringeUnits);
  }

  if (doseNumberInput) doseNumberInput.addEventListener('input', updatePrepVisual);
  if (prepVialInput) prepVialInput.addEventListener('input', updatePrepVisual);
  if (prepBacInput) prepBacInput.addEventListener('input', updatePrepVisual);
  if (prepSyringeSel) prepSyringeSel.addEventListener('change', updatePrepVisual);
  updatePrepVisual();

  // Nodos Anatómicos en el Cuerpo (FRENTE y ESPALDA)
  bodyNodes.forEach(node => {
    node.addEventListener('click', () => {
      triggerHaptic(14);
      bodyNodes.forEach(n => {
        n.classList.remove('active');
        const outer = n.querySelector('circle[stroke-dasharray]');
        if (outer) outer.remove();
      });
      node.classList.add('active');

      // Añadir anillo exterior punteado
      const innerCircle = node.querySelector('circle');
      if (innerCircle) {
        const cx = innerCircle.getAttribute('cx');
        const cy = innerCircle.getAttribute('cy');
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', cx);
        ring.setAttribute('cy', cy);
        ring.setAttribute('r', '8');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', '#06b6d4');
        ring.setAttribute('stroke-width', '1.5');
        ring.setAttribute('stroke-dasharray', '2,2');
        node.prepend(ring);
      }

      activeZone = node.dataset.zone || 'Abdomen - Superior izquierdo';
      if (selectedZoneLabel) selectedZoneLabel.textContent = activeZone;

      // Sincronizar pastillas de región
      const reg = activeZone.split(' - ')[0];
      zoneChips.forEach(chip => {
        if (chip.dataset.region === reg) chip.classList.add('active');
        else chip.classList.remove('active');
      });
    });
  });

  // Pastillas de Región Anatómica
  zoneChips.forEach(chip => {
    chip.addEventListener('click', () => {
      triggerHaptic(12);
      zoneChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const reg = chip.dataset.region;

      // Buscar primer nodo correspondiente
      const matchNode = Array.from(bodyNodes).find(n => (n.dataset.zone || '').startsWith(reg));
      if (matchNode) matchNode.dispatchEvent(new Event('click'));
    });
  });

  // Acordeón ¿Cómo te sientes?
  if (symptomHeader && symptomBody) {
    symptomHeader.addEventListener('click', () => {
      const isOpen = symptomBody.style.display === 'flex';
      symptomBody.style.display = isOpen ? 'none' : 'flex';
      if (symptomChevron) symptomChevron.textContent = isOpen ? '▼' : '▲';
    });
  }

  // Confirmar y Añadir Dosis
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      triggerHaptic(22);
      const isSkip = skippedToggle && skippedToggle.checked;
      const targetDate = injectionDateOverride || getLocalDateStr();
      const curTime = new Date().toTimeString().slice(0, 5);

      if (isSkip) {
        // Registrar como dosis omitida (Filosofía Bench: entrada formal en el historial sin alterar PK ni viales)
        const entries = JSON.parse(localStorage.getItem('mispep_calendar_entries') || '[]');
        entries.unshift({
          id: 'skip-' + Date.now(),
          date: targetDate,
          type: 'skipped',
          title: `${activeMed} (Omitida)`,
          detail: 'Dosis programada no administrada voluntariamente',
          icon: '⏭️',
          skipped: true,
          time: curTime
        });
        localStorage.setItem('mispep_calendar_entries', JSON.stringify(entries));

        closeModal();
        showToast(`✓ Dosis omitida registrada en el historial (no altera tu curva ni descuenta viales)`);
        if (window.renderDashboard) window.renderDashboard();
        if (window.renderCalendar) window.renderCalendar();
        return;
      }

      const doseVal = parseFloat(doseNumberInput.value) || 0.5;
      const isPlanned = plannedToggle ? plannedToggle.checked : true;

      // 1. Guardar en calendario
      const entries = JSON.parse(localStorage.getItem('mispep_calendar_entries') || '[]');
      entries.unshift({
        id: 'inj-' + Date.now(),
        date: targetDate,
        type: 'inj',
        title: `${activeMed} (${doseVal} ${activeUnit})`,
        detail: isPlanned ? `${activeZone} · Dosis planificada` : `${activeZone} · Dosis espontánea`,
        icon: '💉',
        planned: isPlanned,
        time: curTime
      });
      localStorage.setItem('mispep_calendar_entries', JSON.stringify(entries));

      // 2. Guardar en modelo farmacocinético PK
      let pkDoses = JSON.parse(localStorage.getItem('mispep_pk_doses') || '[]');
      pkDoses.push({
        date: targetDate + 'T12:00:00',
        doseMg: activeUnit === 'mcg' ? doseVal / 1000 : doseVal
      });
      localStorage.setItem('mispep_pk_doses', JSON.stringify(pkDoses));

      // 3. Actualizar perfil de salud
      const hp = JSON.parse(localStorage.getItem('mispep_health_profile') || '{}');
      hp.activeMed = activeMed;
      hp.nextDoseMg = doseVal;
      hp.totalInjections = (hp.totalInjections || 0) + 1;
      hp.lastInjectionDate = targetDate;
      const targetObj = new Date(targetDate + 'T12:00:00');
      const hpFreq = parseInt(hp.freqDays, 10) || 7;
      const nextInjObj = new Date(targetObj.getTime() + (hpFreq * 24 * 3600 * 1000));
      hp.nextInjectionDate = (nextDateInput && nextDateInput.value) ? nextDateInput.value : getLocalDateStr(nextInjObj);
      if (nextTimeInput && nextTimeInput.value) {
        hp.reminderTime = nextTimeInput.value;
      }
      localStorage.setItem('mispep_health_profile', JSON.stringify(hp));

      // Cambio de medicación: el protocolo nuevo se abre solo y el anterior se cierra
      // getProtocolSegments vive dentro de initDashboard: solo accesible por namespace.
      const segsAfter = (window.MisPepProtocols && window.MisPepProtocols.getProtocolSegments)
        ? window.MisPepProtocols.getProtocolSegments() : [];
      const actAfter = segsAfter.length ? segsAfter[segsAfter.length - 1] : null;
      if (segsAfter.length > 1 && actAfter && actAfter.doses.length === 1) {
        const prev = segsAfter[segsAfter.length - 2];
        showToast(`⇄ Nuevo protocolo: ${actAfter.label} ${fmtNum(doseVal, 1)} mg · ${prev.label} finalizado`);
      }

      scheduleNextDoseAlarm();

      // 4. Si hay síntomas, guardarlos como registro complementario
      if (symptomBody && symptomBody.style.display === 'flex') {
        const mood = moodSelect ? moodSelect.value : 'Bien';
        const app = appetiteSelect ? appetiteSelect.value : 'Controlado';
        const pain = painRange ? painRange.value : 0;
        entries.unshift({
          id: 'symp-' + Date.now(),
          date: targetDate,
          type: 'mood',
          title: `Ánimo: ${mood} · Apetito: ${app}`,
          detail: `Dolor en zona: ${pain}/10`,
          icon: '😊',
          time: curTime
        });
        localStorage.setItem('mispep_calendar_entries', JSON.stringify(entries));
      }

      // 5. Notificación nativa si está disponible
      if (window.AndroidBridge && typeof window.AndroidBridge.notifyDose === 'function') {
        window.AndroidBridge.notifyDose(
          `✓ Dosis de ${activeMed} administrada`,
          `${doseVal} ${activeUnit} en ${activeZone}. Próxima dosis: ${hp.nextInjectionDate}.`
        );
      }

      closeModal();
      showToast(`✓ Dosis de ${doseVal} ${activeUnit} de ${activeMed} registrada con éxito`);

      // Refrescar vistas activas
      if (window.renderDashboard) window.renderDashboard();
      if (window.renderCalendar) window.renderCalendar();
      if (window.renderPkGraph) window.renderPkGraph();
    });
  }
}

/* ============================================================
   1. MÓDULO CALC (Calculadora Estándar)
   ============================================================ */
function initCalc() {
  const vialPills = document.querySelectorAll('#calcVialPills .pill-3d');
  const bacPills = document.querySelectorAll('#calcBacPills .pill-3d');
  const dosePills = document.querySelectorAll('#calcDosePills .pill-3d');
  const syringeSelect = document.getElementById('calcSyringe');
  
  const vialInput = document.getElementById('calcVialInput');
  const bacInput = document.getElementById('calcBacInput');
  const doseInput = document.getElementById('calcDoseInput');
  const doseUnitSelect = document.getElementById('calcDoseUnit');

  function bindPillGroup(pills, input, callback) {
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        if (pill.dataset.val !== 'custom') {
          input.value = pill.dataset.val;
        }
        callback();
      });
    });
    input.addEventListener('input', () => {
      pills.forEach(p => p.classList.remove('active'));
      callback();
    });
  }

  bindPillGroup(vialPills, vialInput, calculate);
  bindPillGroup(bacPills, bacInput, calculate);
  bindPillGroup(dosePills, doseInput, calculate);

  const calcDoseBadge = document.getElementById('calcDoseBadge');
  function updateCalcDoseBadge() {
    if (calcDoseBadge && doseUnitSelect) {
      calcDoseBadge.textContent = doseUnitSelect.value;
    }
  }

  syringeSelect.addEventListener('change', calculate);
  doseUnitSelect.addEventListener('change', () => {
    updateCalcDoseBadge();
    calculate();
  });

  // Cargar estado previo de la calculadora si existe
  const savedCalc = JSON.parse(localStorage.getItem('mispep_calc_state') || 'null');
  if (savedCalc) {
    if (savedCalc.vialMg !== undefined) vialInput.value = savedCalc.vialMg;
    if (savedCalc.bacMl !== undefined) bacInput.value = savedCalc.bacMl;
    if (savedCalc.rawDose !== undefined) doseInput.value = savedCalc.rawDose;
    if (savedCalc.doseUnit !== undefined) doseUnitSelect.value = savedCalc.doseUnit;
    if (savedCalc.syringe !== undefined) syringeSelect.value = savedCalc.syringe;
  }

  function syncPillState(pills, val) {
    let matched = false;
    pills.forEach(p => {
      if (p.dataset.val === val.toString()) {
        p.classList.add('active');
        matched = true;
      } else {
        p.classList.remove('active');
      }
    });
    if (!matched) {
      const customPill = Array.from(pills).find(p => p.dataset.val === 'custom');
      if (customPill) customPill.classList.add('active');
    }
  }

  syncPillState(vialPills, vialInput.value);
  syncPillState(bacPills, bacInput.value);
  syncPillState(dosePills, doseInput.value);

  function calculate() {
    updateCalcDoseBadge();
    const vialMg = parseFloat(vialInput.value) || 0;
    const bacMl = parseFloat(bacInput.value) || 0;
    const rawDose = parseFloat(doseInput.value) || 0;
    const doseUnit = doseUnitSelect.value;
    const syringeTotalUnits = parseInt(syringeSelect.value, 10) || 100;

    // Guardar estado actual en localStorage para recordar los últimos valores introducidos
    localStorage.setItem('mispep_calc_state', JSON.stringify({
      vialMg: vialInput.value,
      bacMl: bacInput.value,
      rawDose: doseInput.value,
      doseUnit: doseUnitSelect.value,
      syringe: syringeSelect.value
    }));

    // Normalizar dosis a mg
    const doseMg = doseUnit === 'mcg' ? rawDose / 1000 : rawDose;
    const doseMcg = doseUnit === 'mcg' ? rawDose : rawDose * 1000;

    if (vialMg <= 0 || bacMl <= 0 || doseMg <= 0) {
      document.getElementById('calcUnitsResult').textContent = '0';
      document.getElementById('calcDescResult').textContent = 'Introduce los valores para ver la extracción calculada.';
      renderSyringe('calcSyringeView', 0, syringeTotalUnits);
      renderPen('calcPenView', 0, 0, syringeTotalUnits);
      return;
    }

    // Concentración mg/mL
    const concMgMl = vialMg / bacMl;
    // Volumen necesario en mL
    const volumeMl = doseMg / concMgMl;
    // Unidades (1 mL = 100 unidades en U-100; en U-50 son 50u/0.5mL = 100u/mL; U-40 es 40u/1mL)
    let units = 0;
    if (syringeTotalUnits === 40) {
      units = volumeMl * 40; // U-40
    } else {
      units = volumeMl * 100; // U-100, U-50, U-30 usan 100 ticks por mL
    }

    const dosesPerVial = Math.floor(vialMg / doseMg);
    const mcgPerUnit = (concMgMl * 1000) / (syringeTotalUnits === 40 ? 40 : 100);

    // Actualizar UI
    document.getElementById('calcUnitsResult').textContent = fmtNum(units, 1);
    document.getElementById('calcDescResult').innerHTML = `Extrae exactamente <strong>${fmtNum(units, 1)} unidades</strong> (${fmtNum(volumeMl, 3)} mL) para administrar <strong>${fmtNum(doseMcg, 0)} mcg</strong> (${fmtNum(doseMg, 2)} mg).`;
    
    document.getElementById('calcConcVal').textContent = `${fmtNum(concMgMl, 2)} mg/mL`;
    document.getElementById('calcVolVal').textContent = `${fmtNum(volumeMl, 3)} mL`;
    document.getElementById('calcDosesVal').textContent = `${dosesPerVial} dosis`;
    document.getElementById('calcPerUnitVal').textContent = `${fmtNum(mcgPerUnit, 1)} mcg/u`;

    // Clicks (unidades) exactas que deben mostrarse dentro de la ventana del Pen (ej. 40)
    const clicksVal = Number.isInteger(units) ? units : parseFloat(units.toFixed(1));
    const penDoseText = doseUnit === 'mcg'
      ? (doseMcg >= 1000 ? `${fmtNum(doseMg, 2)} mg` : `${fmtNum(doseMcg, 0)} mcg`)
      : `${fmtNum(doseMg, 2)} mg`;

    const penBadge = document.getElementById('penDoseBadge');
    if (penBadge) {
      penBadge.textContent = `${clicksVal}U · ${penDoseText}`;
    }

    renderSyringe('calcSyringeView', units, syringeTotalUnits);
    renderPen('calcPenView', clicksVal, units, syringeTotalUnits);
  }

  calculate();
}

/* ============================================================
   2. MÓDULO REVERSE (Calculadora Inversa)
   ============================================================ */
function initReverse() {
  const vialInput = document.getElementById('revVialInput');
  const doseInput = document.getElementById('revDoseInput');
  const doseUnit = document.getElementById('revDoseUnit');
  const targetUnitsInput = document.getElementById('revTargetUnits');
  const syringeType = document.getElementById('revSyringeType');

  // Cargar estado guardado de la calculadora inversa
  const savedRev = JSON.parse(localStorage.getItem('mispep_reverse_state') || 'null');
  if (savedRev) {
    if (savedRev.vialMg !== undefined) vialInput.value = savedRev.vialMg;
    if (savedRev.rawDose !== undefined) doseInput.value = savedRev.rawDose;
    if (savedRev.doseUnit !== undefined) doseUnit.value = savedRev.doseUnit;
    if (savedRev.targetUnits !== undefined) targetUnitsInput.value = savedRev.targetUnits;
    if (savedRev.syringeType !== undefined) syringeType.value = savedRev.syringeType;
  }

  const revDoseBadge = document.getElementById('revDoseBadge');
  function updateRevDoseBadge() {
    if (revDoseBadge && doseUnit) {
      revDoseBadge.textContent = doseUnit.value;
    }
  }

  function calculateReverse() {
    updateRevDoseBadge();
    const vialMg = parseFloat(vialInput.value) || 0;
    const rawDose = parseFloat(doseInput.value) || 0;
    const targetUnits = parseFloat(targetUnitsInput.value) || 0;
    const doseMg = doseUnit.value === 'mcg' ? rawDose / 1000 : rawDose;
    const syringeUnits = parseInt(syringeType.value, 10) || 100;
    const unitsPerMl = syringeUnits === 40 ? 40 : 100;

    // Guardar estado actual
    localStorage.setItem('mispep_reverse_state', JSON.stringify({
      vialMg: vialInput.value,
      rawDose: doseInput.value,
      doseUnit: doseUnit.value,
      targetUnits: targetUnitsInput.value,
      syringeType: syringeType.value
    }));

    if (vialMg <= 0 || doseMg <= 0 || targetUnits <= 0) {
      document.getElementById('revBacResult').textContent = '0.00';
      return;
    }

    // Volumen por dosis deseada = targetUnits / unitsPerMl (en mL)
    const targetVolMl = targetUnits / unitsPerMl;
    // Concentración requerida = doseMg / targetVolMl
    const reqConc = doseMg / targetVolMl;
    // Agua BAC necesaria = vialMg / reqConc
    const reqBacMl = vialMg / reqConc;
    const totalDoses = Math.floor(vialMg / doseMg);

    document.getElementById('revBacResult').textContent = fmtNum(reqBacMl, 2);
    document.getElementById('revDescResult').innerHTML = `Añade <strong>${fmtNum(reqBacMl, 2)} mL</strong> de agua BAC al vial de ${vialMg} mg. Así, cada <strong>${targetUnits} unidades</strong> equivaldrán exactamente a tu dosis de <strong>${rawDose} ${doseUnit.value}</strong>.`;
    document.getElementById('revConcVal').textContent = `${fmtNum(reqConc, 2)} mg/mL`;
    document.getElementById('revDosesVal').textContent = `${totalDoses} dosis`;
  }

  [vialInput, doseInput, targetUnitsInput, doseUnit, syringeType].forEach(el => {
    el.addEventListener('input', calculateReverse);
    el.addEventListener('change', calculateReverse);
  });

  calculateReverse();
}

/* ============================================================
   3. MÓDULO BLEND (Mezclas de Péptidos)
   ============================================================ */
function initBlend() {
  const p1Name = document.getElementById('blendP1Name');
  const p1Mg = document.getElementById('blendP1Mg');
  const p2Name = document.getElementById('blendP2Name');
  const p2Mg = document.getElementById('blendP2Mg');
  const bacMl = document.getElementById('blendBac');
  const targetDose = document.getElementById('blendTargetDose');
  const targetUnit = document.getElementById('blendTargetUnit');

  // Cargar estado guardado de mezclas
  const savedBlend = JSON.parse(localStorage.getItem('mispep_blend_state') || 'null');
  if (savedBlend) {
    if (savedBlend.p1Name !== undefined) p1Name.value = savedBlend.p1Name;
    if (savedBlend.p1Mg !== undefined) p1Mg.value = savedBlend.p1Mg;
    if (savedBlend.p2Name !== undefined) p2Name.value = savedBlend.p2Name;
    if (savedBlend.p2Mg !== undefined) p2Mg.value = savedBlend.p2Mg;
    if (savedBlend.bacMl !== undefined) bacMl.value = savedBlend.bacMl;
    if (savedBlend.targetDose !== undefined) targetDose.value = savedBlend.targetDose;
    if (savedBlend.targetUnit !== undefined) targetUnit.value = savedBlend.targetUnit;
  }

  const blendTargetBadge = document.getElementById('blendTargetBadge');
  function updateBlendTargetBadge() {
    if (blendTargetBadge && targetUnit) {
      blendTargetBadge.textContent = targetUnit.value;
    }
  }

  function calculateBlend() {
    updateBlendTargetBadge();
    const mg1 = parseFloat(p1Mg.value) || 0;
    const mg2 = parseFloat(p2Mg.value) || 0;
    const water = parseFloat(bacMl.value) || 0;
    const rawDose = parseFloat(targetDose.value) || 0;
    const dose1Mg = targetUnit.value === 'mcg' ? rawDose / 1000 : rawDose;

    // Guardar estado actual
    localStorage.setItem('mispep_blend_state', JSON.stringify({
      p1Name: p1Name.value,
      p1Mg: p1Mg.value,
      p2Name: p2Name.value,
      p2Mg: p2Mg.value,
      bacMl: bacMl.value,
      targetDose: targetDose.value,
      targetUnit: targetUnit.value
    }));

    if (mg1 <= 0 || water <= 0 || dose1Mg <= 0) {
      document.getElementById('blendUnitsResult').textContent = '0';
      return;
    }

    const conc1 = mg1 / water;
    const volMl = dose1Mg / conc1;
    const units = volMl * 100;

    const conc2 = mg2 / water;
    const dose2Mg = volMl * conc2;
    const dose2Mcg = dose2Mg * 1000;

    document.getElementById('blendUnitsResult').textContent = fmtNum(units, 1);
    document.getElementById('blendP1Result').textContent = `${fmtNum(dose1Mg * 1000, 0)} mcg (${p1Name.value || 'Péptido 1'})`;
    document.getElementById('blendP2Result').textContent = `${fmtNum(dose2Mcg, 0)} mcg (${p2Name.value || 'Péptido 2'})`;
    document.getElementById('blendVolResult').textContent = `${fmtNum(volMl, 3)} mL`;
  }

  [p1Name, p1Mg, p2Name, p2Mg, bacMl, targetDose, targetUnit].forEach(el => {
    el.addEventListener('input', calculateBlend);
    el.addEventListener('change', calculateBlend);
  });

  calculateBlend();
}

/* ============================================================
   4. MÓDULO HGH (Somatropina / Hormona de Crecimiento)
   ============================================================ */
function initHGH() {
  const hghIuInput = document.getElementById('hghIuInput');
  const hghBacInput = document.getElementById('hghBacInput');
  const hghDoseIu = document.getElementById('hghDoseIu');
  const hghRatio = document.getElementById('hghRatio'); // 3.0 UI = 1 mg

  // Cargar estado guardado de HGH
  const savedHgh = JSON.parse(localStorage.getItem('mispep_hgh_state') || 'null');
  if (savedHgh) {
    if (savedHgh.totalIU !== undefined) hghIuInput.value = savedHgh.totalIU;
    if (savedHgh.bac !== undefined) hghBacInput.value = savedHgh.bac;
    if (savedHgh.doseIU !== undefined) hghDoseIu.value = savedHgh.doseIU;
    if (savedHgh.ratio !== undefined) hghRatio.value = savedHgh.ratio;
  }

  function calculateHGH() {
    const totalIU = parseFloat(hghIuInput.value) || 0;
    const bac = parseFloat(hghBacInput.value) || 0;
    const doseIU = parseFloat(hghDoseIu.value) || 0;
    const ratio = parseFloat(hghRatio.value) || 3.0;

    // Guardar estado actual
    localStorage.setItem('mispep_hgh_state', JSON.stringify({
      totalIU: hghIuInput.value,
      bac: hghBacInput.value,
      doseIU: hghDoseIu.value,
      ratio: hghRatio.value
    }));

    if (totalIU <= 0 || bac <= 0 || doseIU <= 0) {
      document.getElementById('hghUnitsResult').textContent = '0';
      return;
    }

    const iuPerMl = totalIU / bac;
    const volMl = doseIU / iuPerMl;
    const units = volMl * 100;
    const doseMg = doseIU / ratio;
    const totalDoses = Math.floor(totalIU / doseIU);

    document.getElementById('hghUnitsResult').textContent = fmtNum(units, 1);
    document.getElementById('hghDescResult').innerHTML = `Extrae <strong>${fmtNum(units, 1)} unidades</strong> de jeringa U-100 (${fmtNum(volMl, 3)} mL) para <strong>${fmtNum(doseIU, 1)} UI</strong> (~${fmtNum(doseMg, 2)} mg).`;
    document.getElementById('hghTotalDoses').textContent = `${totalDoses} dosis`;
    document.getElementById('hghConcentration').textContent = `${fmtNum(iuPerMl, 1)} UI/mL`;
  }

  [hghIuInput, hghBacInput, hghDoseIu, hghRatio].forEach(el => {
    el.addEventListener('input', calculateHGH);
    el.addEventListener('change', calculateHGH);
  });

  calculateHGH();
}

/* ============================================================
   5. MÓDULO INTRANASAL (Spray Nasal Dosificado)
   ============================================================ */
function initIntranasal() {
  const bottleMl = document.getElementById('nasalBottleMl');
  const sprayVol = document.getElementById('nasalSprayVol');
  const peptideMg = document.getElementById('nasalPeptideMg');
  const targetMcg = document.getElementById('nasalTargetMcg');

  // Cargar estado guardado de spray nasal
  const savedNasal = JSON.parse(localStorage.getItem('mispep_nasal_state') || 'null');
  if (savedNasal) {
    if (savedNasal.vol !== undefined) bottleMl.value = savedNasal.vol;
    if (savedNasal.pumpMl !== undefined) sprayVol.value = savedNasal.pumpMl;
    if (savedNasal.mg !== undefined) peptideMg.value = savedNasal.mg;
    if (savedNasal.target !== undefined) targetMcg.value = savedNasal.target;
  }

  function calculateNasal() {
    const vol = parseFloat(bottleMl.value) || 10;
    const pumpMl = parseFloat(sprayVol.value) || 0.10;
    const mg = parseFloat(peptideMg.value) || 0;
    const target = parseFloat(targetMcg.value) || 0;

    // Guardar estado actual
    localStorage.setItem('mispep_nasal_state', JSON.stringify({
      vol: bottleMl.value,
      pumpMl: sprayVol.value,
      mg: peptideMg.value,
      target: targetMcg.value
    }));

    if (vol <= 0 || pumpMl <= 0 || mg <= 0) {
      document.getElementById('nasalSpraysResult').textContent = '0';
      return;
    }

    const totalSprays = Math.floor(vol / pumpMl);
    const totalMcg = mg * 1000;
    const mcgPerSpray = totalMcg / totalSprays;
    const spraysNeeded = target > 0 ? Math.round(target / mcgPerSpray) : 0;
    const actualDoseDelivered = spraysNeeded * mcgPerSpray;

    document.getElementById('nasalMcgPerSpray').textContent = fmtNum(mcgPerSpray, 1);
    document.getElementById('nasalSpraysResult').textContent = spraysNeeded.toString();
    document.getElementById('nasalTotalSprays').textContent = `${totalSprays} pulverizaciones`;
    document.getElementById('nasalDescResult').innerHTML = `Con ${spraysNeeded} pulverización(es) recibes <strong>${fmtNum(actualDoseDelivered, 0)} mcg</strong> (aprox. ${(spraysNeeded / 2).toFixed(1)} en cada fosa nasal).`;
  }

  [bottleMl, sprayVol, peptideMg, targetMcg].forEach(el => {
    el.addEventListener('input', calculateNasal);
    el.addEventListener('change', calculateNasal);
  });

  calculateNasal();
}

/* ============================================================
   6. MÓDULO PLAN (Planificador de Titulación)
   ============================================================ */
/* ============================================================
   6. MÓDULO PLAN (Pronóstico PK de Nivel y Titulación)
   ============================================================ */
function initPlan() {
  // Subpestañas: Pronóstico de Nivel vs Pauta de Titulación
  const subtabs = document.querySelectorAll('#planSubtabs .subtab-btn');
  const subviewForecast = document.getElementById('subview-forecast');
  const subviewTitration = document.getElementById('subview-titration');

  subtabs.forEach(btn => {
    btn.addEventListener('click', () => {
      subtabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.subtab;
      if (tab === 'forecast') {
        subviewForecast.style.display = 'block';
        subviewTitration.style.display = 'none';
        renderPkGraph();
      } else {
        subviewForecast.style.display = 'none';
        subviewTitration.style.display = 'block';
      }
    });
  });

  /* ------------------------------------------------------------
     A. PRONÓSTICO DEL NIVEL DE MEDICAMENTO (MODELO PK)
     ------------------------------------------------------------ */
  const pkCompSelect = document.getElementById('pkCompoundSelect');
  const pkHalfLifeVal = document.getElementById('pkHalfLifeVal');
  const pkRangePills = document.querySelectorAll('#pkRangePills .pill-3d');
  const pkViewBtns = document.querySelectorAll('#pkViewToggle .subtab-btn');
  const pkSvgContainer = document.getElementById('pkGraphSvgContainer');

  const pkSelectedLevel = document.getElementById('pkSelectedLevel');
  const pkSelectedUnit = document.getElementById('pkSelectedUnit');
  const pkSelectedDate = document.getElementById('pkSelectedDate');
  const pkSelectedRelative = document.getElementById('pkSelectedRelative');

  const pkDoseInput = document.getElementById('pkDoseInput');
  const pkIntervalInput = document.getElementById('pkIntervalInput');
  const pkLogDoseBtn = document.getElementById('pkLogDoseBtn');
  const pkResetSimBtn = document.getElementById('pkResetSimBtn');

  // Sincronizar inputs de PK con la pauta activa del perfil de salud
  const hpInit = JSON.parse(localStorage.getItem('mispep_health_profile') || '{}');
  if (hpInit.nextDoseMg && pkDoseInput) {
    pkDoseInput.value = hpInit.nextDoseMg;
  }
  if (hpInit.freqDays && pkIntervalInput) {
    pkIntervalInput.value = hpInit.freqDays;
  }

  let pkRangeDays = 14; // Por defecto 2 semanas (14 días, como en la captura)
  let pkViewMode = 'curve'; // 'curve' | 'bars'
  let pkSelectedTimestamp = null;
  let lastScrubDay = null;

  // Pastillas de rango temporal
  pkRangePills.forEach(pill => {
    pill.addEventListener('click', () => {
      pkRangePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      pkRangeDays = parseInt(pill.dataset.days, 10) || 7;
      pkSelectedTimestamp = null; // Reiniciar selección al día de hoy en cambio de escala
      renderPkGraph();
    });
  });

  // Selector de vista: Previsión vs Barras
  pkViewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pkViewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pkViewMode = btn.dataset.view;
      renderPkGraph();
    });
  });

  // Cambio de compuesto
  pkCompSelect.addEventListener('change', () => {
    const opt = pkCompSelect.options[pkCompSelect.selectedIndex];
    const hl = parseFloat(opt.dataset.hl) || 6.0;
    const dose = parseFloat(opt.dataset.dose) || 2.0;

    pkHalfLifeVal.textContent = hl >= 1 ? `~${fmtNum(hl, 1)} days` : `~${Math.round(hl * 24)} hours`;
    pkDoseInput.value = dose;
    pkSelectedTimestamp = null;
    renderPkGraph();
  });

  // Registrar dosis hoy
  pkLogDoseBtn.addEventListener('click', () => {
    if (window.openAddDoseModal) {
      window.openAddDoseModal();
    } else {
      const dose = parseFloat(pkDoseInput.value) || 2.0;
      let doses = JSON.parse(localStorage.getItem('mispep_pk_doses') || '[]');
      doses.push({
        date: new Date().toISOString(),
        doseMg: dose
      });
      localStorage.setItem('mispep_pk_doses', JSON.stringify(doses));
      showToast(`Dosis de ${dose} mg registrada para hoy`);
      pkSelectedTimestamp = null;
      renderPkGraph();
    }
  });

  // Reiniciar simulación
  pkResetSimBtn.addEventListener('click', () => {
    localStorage.removeItem('mispep_pk_doses');
    showToast('Simulación reiniciada a valores predeterminados');
    pkSelectedTimestamp = null;
    renderPkGraph();
  });

  // Cálculo Farmacocinético y Renderizado SVG
  function renderPkGraph() {
    window.renderPkGraph = renderPkGraph;
    if (!pkSvgContainer) return;

    // getProtocolSegments / buildBatemanSeries / medDescriptor están definidos
    // DENTRO de initDashboard, así que aquí solo son visibles a través del
    // namespace global. Llamarlos por su nombre suelto lanzaba
    // "ReferenceError: getProtocolSegments is not defined" en la primera línea
    // y abortaba el render: la pestaña PK se quedaba en blanco (ni previsión ni
    // barras). Se resuelven una vez, con degradación segura.
    const PROTOS = window.MisPepProtocols || {};
    const getProtocolSegments = PROTOS.getProtocolSegments || (() => []);
    const buildBatemanSeries = PROTOS.buildBatemanSeries
      || (() => ({ at: () => 0, events: [], seg: { color: '#8b5cf6', label: 'Protocolo' } }));
    const medDescriptor = PROTOS.medDescriptor || (() => ({ color: '#8b5cf6', label: 'Protocolo' }));

    const opt = pkCompSelect.options[pkCompSelect.selectedIndex];
    const halfLifeDays = parseFloat(opt.dataset.hl) || 6.0;
    const ke = Math.log(2) / halfLifeDays; // Constante de eliminación
    const ka = 1.25; // Constante de absorción subcutánea (Tmax ~1.8 días)
    const tauPeak = Math.log(ka / ke) / (ka - ke);
    const fNorm = Math.exp(-ke * tauPeak) - Math.exp(-ka * tauPeak);

    const doseMg = parseFloat(pkDoseInput.value) || 1.5;
    const intervalDays = parseFloat(pkIntervalInput.value) || 7;

    const now = new Date();
    const nowTime = now.getTime();

    // 1. Recopilar y unificar exclusivamente las inyecciones reales registradas
    let allDosesMap = new Map();

    // A) Inyecciones reales registradas en el Calendario
    const calEntries = JSON.parse(localStorage.getItem('mispep_calendar_entries') || '[]');
    calEntries.forEach(e => {
      if (e.type === 'inj') {
        const dObj = new Date(e.date + 'T12:00:00');
        const match = (e.title || '').match(/([0-9]+(?:[\.,][0-9]+)?)\s*(?:mg|mcg)/i);
        let doseVal = e.dose ? parseFloat(e.dose) : (match ? parseFloat(match[1].replace(',', '.')) : doseMg);
        if (e.title && e.title.includes('mcg')) doseVal = doseVal / 1000;
        const dayKey = getLocalDateStr(dObj);
        allDosesMap.set(dayKey, { time: dObj.getTime(), dose: doseVal });
      }
    });

    // B) Inyecciones registradas en mispep_pk_doses
    const pkCustomDoses = JSON.parse(localStorage.getItem('mispep_pk_doses') || '[]');
    pkCustomDoses.forEach(d => {
      const dObj = new Date(d.date);
      const dayKey = getLocalDateStr(dObj);
      allDosesMap.set(dayKey, { time: dObj.getTime(), dose: parseFloat(d.doseMg) || doseMg });
    });

    // C) Parámetros clínicos del protocolo vigente.
    let hp = {};
    try { hp = JSON.parse(localStorage.getItem('mispep_health_profile') || '{}') || {}; } catch (_) { hp = {}; }
    const protocolDose = parseFloat(hp.nextDoseMg) || 1.5;
    const protocolFreq = parseInt(hp.freqDays, 10) || intervalDays || 7;

    // Ventana temporal del gráfico: centrada alrededor del día actual
    let pastDays = Math.round(pkRangeDays * 0.5); // e.g. 7 días pasado para 14d
    let futureDays = pkRangeDays - pastDays;      // e.g. 7 días futuro para 14d

    const startTime = nowTime - (pastDays * 24 * 3600 * 1000);
    const endTime = nowTime + (futureDays * 24 * 3600 * 1000);
    const totalDuration = endTime - startTime;

    // D) Próxima inyección programada (Previsión futura exclusivamente)
    const freqMs = protocolFreq * 24 * 3600 * 1000;
    const nextInjTime = hp.nextInjectionDate ? new Date(hp.nextInjectionDate + 'T12:00:00').getTime() : (nowTime + freqMs);
    if (hp.nextInjectionDate && nextInjTime > nowTime) {
      allDosesMap.set(hp.nextInjectionDate, { time: nextInjTime, dose: protocolDose });
      for (let t = nextInjTime + freqMs; t <= endTime; t += freqMs) {
        const kDay = getLocalDateStr(new Date(t));
        allDosesMap.set(kDay, { time: t, dose: protocolDose });
      }
    }

    const injectionEvents = Array.from(allDosesMap.values()).sort((a, b) => a.time - b.time);

    // Series por protocolo: un cambio de medicación genera una curva propia
    // (color propio, vida media propia) superpuesta a la anterior.
    const pkSegments = getProtocolSegments();
    const pkSeries = pkSegments.map(seg => buildBatemanSeries(seg, {
      projectFrom: nextInjTime,
      projectUntil: endTime,
      projectEvery: freqMs,
      projectDose: protocolDose
    }));
    if (pkSeries.length === 0) {
      pkSeries.push(buildBatemanSeries({
        key: 'base', label: hp.activeMed || 'Protocolo', color: medDescriptor(hp.activeMed).color,
        halfLife: halfLifeDays, isActive: true, index: 0,
        doses: injectionEvents.map(ev => ({ time: ev.time, dose: ev.dose, date: getLocalDateStr(new Date(ev.time)) }))
      }, {}));
    }

    // Si el punto seleccionado es nulo o está fuera de rango, seleccionar por defecto el momento actual (Hoy)
    if (pkSelectedTimestamp === null || pkSelectedTimestamp < startTime || pkSelectedTimestamp > endTime) {
      pkSelectedTimestamp = nowTime;
    }

    // Modelo farmacocinético de absorción y eliminación subcutánea.
    // El nivel mostrado es la suma de todos los protocolos circulantes.
    function calcLevel(targetTime) {
      return pkSeries.reduce((acc, sr) => acc + sr.at(targetTime), 0);
    }

    // Nivel en la fecha seleccionada por el usuario
    const selectedLevel = calcLevel(pkSelectedTimestamp);
    pkSelectedLevel.textContent = fmtNum(selectedLevel, 2);
    pkSelectedUnit.textContent = 'mg';

    // Desglose de fármacos activos en la fecha/momento seleccionado
    const breakdownParts = pkSeries
      .map(sr => ({ label: sr.seg.label, v: sr.at(pkSelectedTimestamp), color: sr.seg.color }))
      .filter(x => x.v >= 0.02);
    let elBreakdown = document.getElementById('pkSelectedBreakdown');
    if (!elBreakdown) {
      const parentWrap = pkSelectedLevel.parentElement;
      if (parentWrap && parentWrap.parentElement) {
        elBreakdown = document.createElement('div');
        elBreakdown.id = 'pkSelectedBreakdown';
        elBreakdown.style.fontSize = '0.72rem';
        elBreakdown.style.fontWeight = '800';
        elBreakdown.style.marginTop = '4px';
        parentWrap.parentElement.appendChild(elBreakdown);
      }
    }
    if (elBreakdown) {
      if (breakdownParts.length > 1) {
        elBreakdown.innerHTML = breakdownParts
          .map(p => `<span style="color:${p.color}; margin-right:8px;">● ${p.label}: ${fmtNum(p.v, 2)} mg</span>`)
          .join('');
      } else {
        elBreakdown.innerHTML = '';
      }
    }

    const selDateObj = new Date(pkSelectedTimestamp);
    pkSelectedDate.textContent = selDateObj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

    // Etiqueta relativa (Historial en morado, Hoy en ámbar, Previsión en cian)
    const dayDiff = Math.round((pkSelectedTimestamp - nowTime) / (24 * 3600 * 1000));
    let relText = 'Historial';
    let relColor = '#8b5cf6';
    let relBg = 'rgba(139, 92, 246, 0.15)';

    if (dayDiff === 0) {
      relText = 'Hoy';
      relColor = '#f59e0b';
      relBg = 'rgba(245, 158, 11, 0.15)';
    } else if (dayDiff < 0) {
      relText = 'Historial';
      relColor = '#8b5cf6';
      relBg = 'rgba(139, 92, 246, 0.15)';
    } else {
      relText = 'Previsión';
      relColor = '#06b6d4';
      relBg = 'rgba(6, 182, 212, 0.15)';
    }
    pkSelectedRelative.textContent = relText;
    pkSelectedRelative.style.color = relColor;
    pkSelectedRelative.style.background = relBg;

    // Generar muestras continuas de la curva (140 puntos)
    const samples = 140;
    const points = [];
    let maxLevel = 2.1;

    for (let i = 0; i <= samples; i++) {
      const t = startTime + (i / samples) * totalDuration;
      const val = calcLevel(t);
      if (val > maxLevel) maxLevel = val;
      points.push({ time: t, val });
    }
    // Escala dinámica proporcional a la dosis real (ej. 1.5 mg)
    maxLevel = Math.max(maxLevel * 1.15, protocolDose * 1.05);

    // Dimensiones SVG
    const width = 360;
    const height = 195;
    const padL = 34;
    const padR = 24;
    const padT = 32;
    const padB = 26;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    function getX(t) {
      return padL + ((t - startTime) / totalDuration) * plotW;
    }
    function getY(v) {
      return padT + plotH - ((v / maxLevel) * plotH);
    }

    const todayX = getX(nowTime);
    const selX = getX(pkSelectedTimestamp);
    const selY = getY(selectedLevel);

    // Partir la curva en Historial (t <= nowTime) y Previsión (t >= nowTime)
    let dHist = '';
    let dPrev = '';
    let dHistArea = `M ${getX(points[0].time)},${getY(0)} `;
    let dPrevArea = `M ${todayX.toFixed(1)},${getY(0)} `;

    let pastPoints = points.filter(p => p.time <= nowTime);
    let futurePoints = points.filter(p => p.time >= nowTime);

    const levelAtNow = calcLevel(nowTime);
    pastPoints.push({ time: nowTime, val: levelAtNow });
    futurePoints.unshift({ time: nowTime, val: levelAtNow });

    pastPoints.forEach((p, idx) => {
      const px = getX(p.time);
      const py = getY(p.val);
      dHist += `${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)} `;
      dHistArea += `L ${px.toFixed(1)} ${py.toFixed(1)} `;
    });
    dHistArea += `L ${todayX.toFixed(1)},${getY(0)} Z`;

    futurePoints.forEach((p, idx) => {
      const px = getX(p.time);
      const py = getY(p.val);
      dPrev += `${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)} `;
      dPrevArea += `L ${px.toFixed(1)} ${py.toFixed(1)} `;
    });
    const lastX = getX(futurePoints[futurePoints.length - 1].time);
    dPrevArea += `L ${lastX.toFixed(1)},${getY(0)} Z`;

    // Fechas en el Eje X
    const startDateObj = new Date(startTime);
    const endDateObj = new Date(endTime);
    const startDateStr = startDateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const endDateStr = endDateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    // Referencia Y proporcional a la dosis administrada real (ej. 1.5 mg)
    const yRefVal = Math.round(protocolDose * 10) / 10;
    const yRefY = getY(yRefVal);

    // Marcadores de dosis: cada uno con el color de su protocolo
    let doseMarkersHtml = '';
    pkSeries.forEach(sr => {
      sr.events.forEach(ev => {
        if (ev.time < startTime || ev.time > endTime) return;
        const dx = getX(ev.time);
        const dy = getY(sr.at(ev.time));
        doseMarkersHtml += `
          <circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="4.6" fill="${sr.seg.color}" stroke="#ffffff" stroke-width="2" />
        `;
      });
    });

    // Contenido condicional: Curva continua vs Barras
    let plotContent = '';

    if (pkViewMode === 'curve') {
      // Una curva por protocolo, superpuestas y con color propio.
      // El protocolo antiguo cae a cero (Bateman) y el nuevo arranca de cero.
      let pkCurvesHtml = '';
      pkSeries.forEach(sr => {
        const col = sr.seg.color;
        let dSrPast = '';
        let dSrFut = '';
        for (let i = 0; i <= samples; i++) {
          const t = startTime + (i / samples) * totalDuration;
          const pt = `${getX(t).toFixed(1)} ${getY(sr.at(t)).toFixed(1)} `;
          if (t <= now.getTime()) dSrPast += (dSrPast ? 'L ' : 'M ') + pt;
          else dSrFut += (dSrFut ? 'L ' : 'M ') + pt;
        }
        pkCurvesHtml += `<path d="${dSrPast}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
        if (dSrFut) {
          pkCurvesHtml += `<path d="${dSrFut}" fill="none" stroke="${col}" stroke-width="2.8" stroke-dasharray="5,3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />`;
        }
      });

      const pkLegend = document.getElementById('pkProtocolLegend');
      if (pkLegend) {
        pkLegend.innerHTML = pkSeries.map(sr =>
          `<span style="display:inline-flex; align-items:center; gap:5px; font-size:0.68rem; font-weight:800; color:var(--text-muted);">
             <span style="width:10px; height:10px; border-radius:50%; background:${sr.seg.color}; box-shadow:0 0 6px ${sr.seg.color};"></span>
             ${sr.seg.label}${sr.seg.isActive ? ' (vigente)' : ''}
           </span>`
        ).join('');
      }

      function renderPkFloatingBadges(currX, currY, currTime) {
        const activeSeries = pkSeries.map(sr => ({
          label: sr.seg.label,
          val: sr.at(currTime),
          color: sr.seg.color
        })).filter(s => s.val >= 0.02);

        if (activeSeries.length === 0 && pkSeries.length > 0) {
          const lastSr = pkSeries[pkSeries.length - 1];
          activeSeries.push({
            label: lastSr.seg.label,
            val: lastSr.at(currTime),
            color: lastSr.seg.color
          });
        }

        const isNearHoy = Math.abs(currX - todayX) < 32;
        const badgeY = (currY < padT + 22 && isNearHoy) ? (currY + 18) : Math.max(padT + 4, currY - 24);

        if (activeSeries.length === 1) {
          const s = activeSeries[0];
          const badgeW = 54;
          const badgeX = Math.max(padL + badgeW / 2, Math.min(width - padR - badgeW / 2, currX));
          return `
            <g transform="translate(${badgeX.toFixed(1)}, ${badgeY.toFixed(1)})">
              <rect x="${(-badgeW / 2).toFixed(1)}" y="-10" width="${badgeW}" height="20" rx="6" fill="${s.color}" stroke="#ffffff" stroke-width="1.5" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.6))" />
              <text x="0" y="3.5" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle" style="paint-order:stroke fill; stroke:rgba(0,0,0,0.4); stroke-width:1.5px;">${fmtNum(s.val, 2)}mg</text>
            </g>
          `;
        }

        if (activeSeries.length >= 2) {
          const sLeft = activeSeries[0];
          const sRight = activeSeries[1];
          const badgeW = 50;
          let leftX = currX - 3;
          let rightX = currX + 3;

          if (leftX - badgeW < padL) {
            const shift = padL - (leftX - badgeW);
            leftX += shift;
            rightX += shift;
          } else if (rightX + badgeW > width - padR) {
            const shift = (rightX + badgeW) - (width - padR);
            leftX -= shift;
            rightX -= shift;
          }

          return `
            <!-- Etiqueta izquierda: ${sLeft.label} -->
            <g transform="translate(${leftX.toFixed(1)}, ${badgeY.toFixed(1)})">
              <rect x="${-badgeW}" y="-10" width="${badgeW}" height="20" rx="5" fill="${sLeft.color}" stroke="#ffffff" stroke-width="1.5" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.6))" />
              <text x="${(-badgeW / 2).toFixed(1)}" y="3.5" font-size="8.5" font-weight="900" fill="#ffffff" text-anchor="middle" style="paint-order:stroke fill; stroke:rgba(0,0,0,0.4); stroke-width:1.5px;">${fmtNum(sLeft.val, 2)}mg</text>
            </g>
            <!-- Etiqueta derecha: ${sRight.label} -->
            <g transform="translate(${rightX.toFixed(1)}, ${badgeY.toFixed(1)})">
              <rect x="0" y="-10" width="${badgeW}" height="20" rx="5" fill="${sRight.color}" stroke="#ffffff" stroke-width="1.5" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.6))" />
              <text x="${(badgeW / 2).toFixed(1)}" y="3.5" font-size="8.5" font-weight="900" fill="#ffffff" text-anchor="middle" style="paint-order:stroke fill; stroke:rgba(0,0,0,0.4); stroke-width:1.5px;">${fmtNum(sRight.val, 2)}mg</text>
            </g>
          `;
        }
        return '';
      }

      plotContent = `
        <!-- Rellenos de referencia (historial / previsión) -->
        <path d="${dHistArea}" fill="url(#pkHistGrad)" />
        <path d="${dPrevArea}" fill="url(#pkPrevGrad)" />

        <!-- Curvas superpuestas por protocolo -->
        ${pkCurvesHtml}

        <!-- Marcadores de dosis -->
        ${doseMarkersHtml}

        <!-- Nodo Interactivo Seleccionado (Anillo Verde Menta con centro blanco) -->
        <circle cx="${selX.toFixed(1)}" cy="${selY.toFixed(1)}" r="7.5" fill="#10b981" stroke="#ffffff" stroke-width="2" />

        <!-- Etiquetas Flotantes por cada péptido circulante -->
        ${renderPkFloatingBadges(selX, selY, pkSelectedTimestamp)}
      `;
    } else {
      // Vista de Barras Diarias (Estilo Shotlee con Diana y Gradientes)
      const numBars = Math.min(pkRangeDays, 14);
      let barItems = [];
      const barW = Math.max(12, Math.min(26, (plotW / numBars) * 0.62));

      // Una sola barra seleccionada: la más próxima al instante elegido.
      // Antes bastaba con estar a menos de ~15 h, así que dos barras contiguas
      // quedaban resaltadas a la vez (dos dianas y dos etiquetas flotantes).
      let selectedBarIdx = 0;
      let bestBarDist = Infinity;
      for (let i = 0; i < numBars; i++) {
        const t = startTime + ((i + 0.5) / numBars) * totalDuration;
        const d = Math.abs(t - pkSelectedTimestamp);
        if (d < bestBarDist) { bestBarDist = d; selectedBarIdx = i; }
      }

      // Las etiquetas de fecha de los extremos se dibujan a y=height-6, la misma
      // fila que los números de día: se suprimen los números que caen bajo ellas.
      const tooLeft = (x) => x < padL + 42;
      const tooRight = (x) => x > width - padR - 42;

      for (let i = 0; i < numBars; i++) {
        const barTime = startTime + ((i + 0.5) / numBars) * totalDuration;
        const bLevel = calcLevel(barTime);
        const bx = getX(barTime);
        const bh = Math.max(8, (bLevel / maxLevel) * plotH);
        const by = padT + plotH - bh;

        const isSelected = (i === selectedBarIdx);
        const isPast = barTime <= (nowTime + 12 * 3600 * 1000);
        const hideDayNum = tooLeft(bx) || tooRight(bx);

        let fillGrad = 'url(#pkBarPastGrad)';
        if (isSelected) {
          fillGrad = 'url(#pkBarActiveGrad)';
        } else if (!isPast) {
          fillGrad = 'url(#pkBarFutGrad)';
        }

        let activeIndicator = '';
        if (isSelected) {
          activeIndicator = `
            <circle cx="${bx}" cy="${by}" r="7" fill="#f43f5e" />
            <circle cx="${bx}" cy="${by}" r="3.2" fill="#ffffff" />
            ${renderPkFloatingBadges(bx, by, barTime)}
          `;
        }

        const dayNumStr = new Date(barTime).toLocaleDateString('es-ES', { day: 'numeric' });

        barItems.push(`
          <rect x="${bx - barW / 2}" y="${by}" width="${barW}" height="${bh}" rx="${Math.min(barW / 2, 7)}" fill="${fillGrad}" />
          ${activeIndicator}
          ${hideDayNum ? '' : `<text x="${bx}" y="${height - 10}" font-size="8" font-weight="700" fill="var(--text-muted)" text-anchor="middle">${dayNumStr}</text>`}
        `);
      }
      plotContent = barItems.join('');
    }

    pkSvgContainer.innerHTML = `
      <svg id="pkInteractiveSvg" viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; overflow:visible; touch-action:none; user-select:none;">
        <defs>
          <linearGradient id="pkHistGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#94a3b8" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#94a3b8" stop-opacity="0.02" />
          </linearGradient>
          <linearGradient id="pkPrevGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.02" />
          </linearGradient>
          <!-- Gradientes para la vista de Barras -->
          <linearGradient id="pkBarPastGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#8b5cf6" />
            <stop offset="50%" stop-color="#3b82f6" />
            <stop offset="100%" stop-color="#1e293b" />
          </linearGradient>
          <linearGradient id="pkBarActiveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f43f5e" />
            <stop offset="100%" stop-color="#f59e0b" />
          </linearGradient>
          <linearGradient id="pkBarFutGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4" />
            <stop offset="50%" stop-color="#6366f1" />
            <stop offset="100%" stop-color="#1e293b" />
          </linearGradient>
        </defs>

        <!-- Cuadrícula y Ejes -->
        <line x1="${padL}" y1="${getY(0)}" x2="${width - padR}" y2="${getY(0)}" stroke="var(--border-color)" stroke-width="1" />
        <line x1="${padL}" y1="${yRefY}" x2="${width - padR}" y2="${yRefY}" stroke="var(--border-color)" stroke-width="1" stroke-dasharray="3,3" opacity="0.6" />
        <text x="${padL - 6}" y="${yRefY + 3.5}" font-size="8" font-weight="700" fill="var(--text-muted)" text-anchor="end">${yRefVal.toFixed(1)} mg</text>

        <!-- Línea Vertical fija de 'Hoy' (Discontinua Ámbar) más alta -->
        <line x1="${todayX}" y1="${padT - 16}" x2="${todayX}" y2="${getY(0)}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,4" />
        
        <!-- Badge 'Hoy' fijo en la parte superior de la línea vertical (más alto para no quedar tapado) -->
        <g transform="translate(${todayX}, ${padT - 20})">
          <rect x="-15" y="-8" width="30" height="15" rx="5" fill="#f59e0b" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))" />
          <text x="0" y="3" font-size="8" font-weight="900" fill="#1a1408" text-anchor="middle">Hoy</text>
        </g>

        <!-- Contenido principal (Curva o Barras) -->
        ${plotContent}

        <!-- Fechas en el Eje X -->
        <text x="${padL}" y="${height - 6}" font-size="8.5" font-weight="700" fill="var(--text-muted)" text-anchor="start">${startDateStr}</text>
        <text x="${width - padR}" y="${height - 6}" font-size="8.5" font-weight="700" fill="var(--text-muted)" text-anchor="end">${endDateStr}</text>

        <!-- Capa invisible táctil e interactiva (Overlay) para capturar toques y arrastre -->
        <rect id="pkTouchOverlay" x="${padL}" y="0" width="${plotW}" height="${height}" fill="transparent" style="cursor:pointer; touch-action:none;" />
      </svg>
    `;

    // Conectar eventos táctiles / ratón al Overlay para mover el punto
    const overlay = document.getElementById('pkTouchOverlay');
    if (overlay) {
      let isDragging = false;

      function updatePointerPosition(e) {
        const rect = overlay.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        if (!clientX) return;

        const relX = clientX - rect.left;
        const frac = Math.max(0, Math.min(1, relX / rect.width));
        const newTimestamp = startTime + (frac * totalDuration);

        pkSelectedTimestamp = newTimestamp;

        // Vibración háptica al cambiar de día
        const dayNum = new Date(newTimestamp).getDate();
        if (dayNum !== lastScrubDay) {
          lastScrubDay = dayNum;
          triggerHaptic(14);
        }

        renderPkGraph();
      }

      overlay.addEventListener('pointerdown', (e) => {
        isDragging = true;
        try { overlay.setPointerCapture(e.pointerId); } catch (_) {}
        updatePointerPosition(e);
      });

      overlay.addEventListener('pointermove', (e) => {
        if (isDragging) {
          updatePointerPosition(e);
        }
      });

      overlay.addEventListener('pointerup', () => { isDragging = false; });
      overlay.addEventListener('pointercancel', () => { isDragging = false; });
    }
  }

  // Ejecutar render inicial
  renderPkGraph();

  /* ------------------------------------------------------------
     B. PAUTA Y CALENDARIO DE TITULACIÓN
     ------------------------------------------------------------ */
  const compoundSelect = document.getElementById('planCompound');
  const halfLifeInput = document.getElementById('planHalfLife');
  const startDoseInput = document.getElementById('planStartDose');
  const stepWeeksInput = document.getElementById('planStepWeeks');
  const doseStepInput = document.getElementById('planDoseStep');
  const totalWeeksInput = document.getElementById('planTotalWeeks');
  const planScheduleDiv = document.getElementById('planScheduleOutput');

  if (compoundSelect) {
    compoundSelect.addEventListener('change', () => {
      const val = compoundSelect.value;
      if (val === 'tirzepatide') { halfLifeInput.value = '5.0'; startDoseInput.value = '2.5'; doseStepInput.value = '2.5'; }
      else if (val === 'semaglutide') { halfLifeInput.value = '7.0'; startDoseInput.value = '0.25'; doseStepInput.value = '0.25'; }
      else if (val === 'retatrutide') { halfLifeInput.value = '6.0'; startDoseInput.value = '2.0'; doseStepInput.value = '2.0'; }
      else if (val === 'bpc157') { halfLifeInput.value = '0.2'; startDoseInput.value = '250'; doseStepInput.value = '0'; }
      generatePlan();
    });
  }

  function generatePlan() {
    if (!planScheduleDiv) return;
    const totalWeeks = parseInt(totalWeeksInput.value, 10) || 12;
    const stepWeeks = parseInt(stepWeeksInput.value, 10) || 4;
    let currentDose = parseFloat(startDoseInput.value) || 2.5;
    const doseStep = parseFloat(doseStepInput.value) || 2.5;

    let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
    let totalCumulativeMg = 0;

    for (let w = 1; w <= totalWeeks; w++) {
      if (w > 1 && (w - 1) % stepWeeks === 0) {
        currentDose += doseStep;
      }
      totalCumulativeMg += currentDose;
      html += `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg-elevated); padding:10px 14px; border-radius:10px; border:1px solid var(--border-color);">
          <span style="font-weight:700; font-size:0.88rem;">Semana ${w}</span>
          <span class="badge-units">${fmtNum(currentDose, 2)} mg / sem</span>
        </div>
      `;
    }
    html += `</div>`;
    planScheduleDiv.innerHTML = html;
    const totalMgEl = document.getElementById('planTotalMg');
    if (totalMgEl) {
      totalMgEl.textContent = `${fmtNum(totalCumulativeMg, 1)} mg`;
    }
  }

  [halfLifeInput, startDoseInput, stepWeeksInput, doseStepInput, totalWeeksInput].forEach(el => {
    if (el) el.addEventListener('input', generatePlan);
  });

  generatePlan();
}

/* ============================================================
   7. MÓDULO RUNWAY (Duración de Suministro)
   ============================================================ */
function initRunway() {
  const vialsCount = document.getElementById('runwayVials');
  const vialMg = document.getElementById('runwayMgPerVial');
  const doseMg = document.getElementById('runwayDoseMg');
  const freqDays = document.getElementById('runwayFreqDays');

  function calculateRunway() {
    const vials = parseFloat(vialsCount.value) || 0;
    const mgVial = parseFloat(vialMg.value) || 0;
    const dose = parseFloat(doseMg.value) || 0;
    const daysInterval = parseFloat(freqDays.value) || 7;

    if (vials <= 0 || mgVial <= 0 || dose <= 0) {
      document.getElementById('runwayDaysResult').textContent = '0';
      return;
    }

    const totalStockMg = vials * mgVial;
    const totalDoses = Math.floor(totalStockMg / dose);
    const totalDays = totalDoses * daysInterval;
    const weeks = (totalDays / 7).toFixed(1);

    const depDate = new Date();
    depDate.setDate(depDate.getDate() + totalDays);
    const dateStr = depDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

    document.getElementById('runwayDaysResult').textContent = `${totalDays} días`;
    document.getElementById('runwayDescResult').innerHTML = `Tu reserva durará <strong>${weeks} semanas</strong> (${totalDoses} dosis en total). Se agotará el <strong>${dateStr}</strong>.`;
    document.getElementById('runwayStockMg').textContent = `${fmtNum(totalStockMg, 1)} mg`;
    document.getElementById('runwayReorderDate').textContent = `${Math.max(0, totalDays - 21)} días`;
  }

  [vialsCount, vialMg, doseMg, freqDays].forEach(el => {
    el.addEventListener('input', calculateRunway);
    el.addEventListener('change', calculateRunway);
  });

  calculateRunway();
}

/* ============================================================
   8. MÓDULO ROTATE (Mapa Corporal de Inyección SubQ)
   ============================================================ */
function initRotate() {
  const zones = [
    { id: 'abd-tl', name: 'Abdomen Sup. Izquierdo', x: 135, y: 195 },
    { id: 'abd-tr', name: 'Abdomen Sup. Derecho', x: 165, y: 195 },
    { id: 'abd-bl', name: 'Abdomen Inf. Izquierdo', x: 135, y: 220 },
    { id: 'abd-br', name: 'Abdomen Inf. Derecho', x: 165, y: 220 },
    { id: 'thigh-l', name: 'Muslo Izquierdo', x: 125, y: 310 },
    { id: 'thigh-r', name: 'Muslo Derecho', x: 175, y: 310 },
    { id: 'arm-l', name: 'Deltoides/Brazo Izq.', x: 80, y: 160 },
    { id: 'arm-r', name: 'Deltoides/Brazo Der.', x: 220, y: 160 }
  ];

  let history = JSON.parse(localStorage.getItem('mispep_rotate_log') || '[]');
  let activeZone = zones[0].id;

  function renderMap() {
    const svgBox = document.getElementById('rotateBodyMap');
    if (!svgBox) return;

    // Determinar la zona con más tiempo de reposo
    const lastDates = {};
    history.forEach(item => {
      if (!lastDates[item.zoneId] || item.timestamp > lastDates[item.zoneId]) {
        lastDates[item.zoneId] = item.timestamp;
      }
    });

    let oldestZone = zones[0].id;
    let oldestTime = Infinity;
    zones.forEach(z => {
      const t = lastDates[z.id] || 0;
      if (t < oldestTime) {
        oldestTime = t;
        oldestZone = z.id;
      }
    });

    svgBox.innerHTML = `
      <svg viewBox="0 0 300 420" class="bodymap-svg">
        <!-- Silueta anatómica elegante -->
        <path d="M150,30 C162,30 170,40 170,55 C170,70 162,80 150,80 C138,80 130,70 130,55 C130,40 138,30 150,30 Z" fill="#334155" opacity="0.6"/>
        <path d="M135,82 L165,82 L195,100 L230,150 L220,240 L205,240 L210,165 L180,140 L180,240 L195,370 L160,370 L155,270 L145,270 L140,370 L105,370 L120,240 L120,140 L90,165 L95,240 L80,240 L70,150 L105,100 Z" fill="#1e293b" stroke="#475569" stroke-width="2" />
        
        <!-- Puntos de inyección interactivos -->
        ${zones.map(z => {
          const isRec = z.id === oldestZone;
          const isSel = z.id === activeZone;
          return `
            <g class="zone-node ${isRec ? 'recommended' : ''} ${isSel ? 'selected' : ''}" data-zone="${z.id}" transform="translate(${z.x}, ${z.y})">
              <circle cx="0" cy="0" r="${isRec ? 12 : 9}" />
              <text x="0" y="3.5" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">${isRec ? '★' : ''}</text>
            </g>
          `;
        }).join('')}
      </svg>
    `;

    // Asignar clics
    svgBox.querySelectorAll('.zone-node').forEach(node => {
      node.addEventListener('click', () => {
        activeZone = node.dataset.zone;
        updateSelectedZoneInfo();
        renderMap();
      });
    });

    updateSelectedZoneInfo();
  }

  function updateSelectedZoneInfo() {
    const z = zones.find(item => item.id === activeZone);
    const labelEl = document.getElementById('rotateSelectedZoneName');
    if (labelEl && z) {
      labelEl.textContent = z.name;
    }
    const lastItem = history.filter(h => h.zoneId === activeZone).slice(-1)[0];
    const lastEl = document.getElementById('rotateLastInjected');
    if (lastEl) {
      lastEl.textContent = lastItem ? new Date(lastItem.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Nunca registrada';
    }
  }

  document.getElementById('rotateLogBtn').addEventListener('click', () => {
    const z = zones.find(item => item.id === activeZone);
    history.push({
      zoneId: activeZone,
      zoneName: z.name,
      timestamp: Date.now()
    });
    localStorage.setItem('mispep_rotate_log', JSON.stringify(history));
    renderMap();
    showToast(`Inyección registrada en: ${z.name}`);
  });

  renderMap();
}

/* ============================================================
   9. MÓDULO CONVERT (Conversor Clínico Multimódulo)
   ============================================================ */
function initConvert() {
  // mcg <-> mg
  const mcgIn = document.getElementById('convMcg');
  const mgIn = document.getElementById('convMg');
  mcgIn.addEventListener('input', () => {
    mgIn.value = fmtNum((parseFloat(mcgIn.value) || 0) / 1000, 4);
  });
  mgIn.addEventListener('input', () => {
    mcgIn.value = fmtNum((parseFloat(mgIn.value) || 0) * 1000, 2);
  });

  // mL <-> Unidades (U-100)
  const mlIn = document.getElementById('convMl');
  const unitsIn = document.getElementById('convUnits');
  mlIn.addEventListener('input', () => {
    unitsIn.value = fmtNum((parseFloat(mlIn.value) || 0) * 100, 1);
  });
  unitsIn.addEventListener('input', () => {
    mlIn.value = fmtNum((parseFloat(unitsIn.value) || 0) / 100, 3);
  });

  // mg <-> IU
  const mgHgh = document.getElementById('convMgHgh');
  const iuHgh = document.getElementById('convIuHgh');
  mgHgh.addEventListener('input', () => {
    iuHgh.value = fmtNum((parseFloat(mgHgh.value) || 0) * 3.0, 2);
  });
  iuHgh.addEventListener('input', () => {
    mgHgh.value = fmtNum((parseFloat(iuHgh.value) || 0) / 3.0, 3);
  });
}

/* ============================================================
   10. MÓDULO INVENTORY (Gestión de Viales y Caducidad)
   ============================================================ */
function initInventory() {
  const listEl = document.getElementById('inventoryList');
  const addBtn = document.getElementById('invAddBtn');
  const formCard = document.getElementById('invAddFormCard');
  const cancelBtn = document.getElementById('invCancelBtn');
  const dismissBtn = document.getElementById('invDismissBtn');
  const saveVialBtn = document.getElementById('invSaveVialBtn');

  const formName = document.getElementById('invFormName');
  const formMg = document.getElementById('invFormMg');
  const formBac = document.getElementById('invFormBac');
  const formDate = document.getElementById('invFormDate');
  const formLoc = document.getElementById('invFormLoc');

  if (formDate) {
    formDate.value = getLocalDateStr();
  }

  let inventory = JSON.parse(localStorage.getItem('mispep_inventory') || '[]');

  function saveAndRender() {
    localStorage.setItem('mispep_inventory', JSON.stringify(inventory));
    if (inventory.length === 0) {
      listEl.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px; font-size:0.88rem;">No tienes viales registrados. Pulsa "+ Añadir Vial Reconstituido".</p>';
      return;
    }

    listEl.innerHTML = inventory.map((v, i) => {
      const openedDate = new Date(v.date);
      const daysPassed = Math.floor((Date.now() - openedDate.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = daysPassed > 30;
      const isWarning = daysPassed >= 21 && !isExpired;

      return `
        <div style="background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:14px; padding:14px; margin-bottom:10px; box-shadow:0 4px 12px var(--shadow-ambient);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:1.05rem; color:var(--text-main);">${v.name} (${v.mg} mg)</strong>
            <span class="badge-tag" style="${isExpired ? 'background:rgba(244,63,94,0.2); color:#f43f5e; border-color:rgba(244,63,94,0.4);' : isWarning ? 'background:rgba(245,158,11,0.2); color:#f59e0b; border-color:rgba(245,158,11,0.4);' : ''}">
              ${isExpired ? 'Caducado (>30d)' : `${daysPassed} días abierto`}
            </span>
          </div>
          <div style="font-size:0.82rem; color:var(--text-muted); margin-top:6px; display:flex; justify-content:space-between;">
            <span>Reconstituido: <strong>${openedDate.toLocaleDateString('es-ES')}</strong> con <strong>${v.bac} mL</strong> BAC</span>
            <span style="color:var(--text-secondary);">${v.loc || 'Nevera'}</span>
          </div>
          <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:8px;">
            <button class="btn-3d btn-3d-danger" style="padding:6px 14px; font-size:0.75rem;" onclick="removeVial(${i})">Eliminar</button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.removeVial = (index) => {
    inventory.splice(index, 1);
    saveAndRender();
    showToast('Vial eliminado del inventario');
  };

  function hideForm() {
    if (formCard) formCard.style.display = 'none';
  }

  function showForm() {
    if (formCard) {
      formCard.style.display = 'block';
      if (formDate) formDate.value = getLocalDateStr();
      if (formName) {
        formName.value = '';
        formName.focus();
      }
    }
  }

  if (addBtn) addBtn.addEventListener('click', showForm);
  if (cancelBtn) cancelBtn.addEventListener('click', hideForm);
  if (dismissBtn) dismissBtn.addEventListener('click', hideForm);

  if (saveVialBtn) {
    saveVialBtn.addEventListener('click', () => {
      const name = (formName ? formName.value : '').trim();
      if (!name) {
        showToast('Introduce el nombre del péptido');
        if (formName) formName.focus();
        return;
      }
      const mg = parseFloat(formMg ? formMg.value : 0) || 10;
      const bac = parseFloat(formBac ? formBac.value : 0) || 2;
      const dateVal = formDate && formDate.value ? formDate.value : new Date().toISOString();
      const locVal = formLoc ? formLoc.value : 'Nevera (4°C)';

      inventory.push({
        name,
        mg,
        bac,
        date: dateVal,
        loc: locVal
      });

      saveAndRender();
      hideForm();
      showToast(`Vial de ${name} añadido al inventario`);
    });
  }

  saveAndRender();
}

/* ============================================================
   11. MÓDULO LABEL (Creador de Etiquetas de Vial Térmicas)
   ============================================================ */
function initLabel() {
  const canvas = document.getElementById('labelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const nameIn = document.getElementById('labelName');
  const mgIn = document.getElementById('labelMg');
  const bacIn = document.getElementById('labelBac');
  const dateIn = document.getElementById('labelDate');

  dateIn.value = getLocalDateStr();

  function drawLabel() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    const name = (nameIn.value || 'PEPTIDE').toUpperCase();
    const mg = parseFloat(mgIn.value) || 0;
    const bac = parseFloat(bacIn.value) || 0;
    const conc = bac > 0 ? (mg / bac).toFixed(2) : '0';

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.fillText(name, 18, 38);

    ctx.font = '16px -apple-system, sans-serif';
    ctx.fillText(`${mg} mg | ${bac} mL BAC`, 18, 68);

    ctx.font = 'bold 18px -apple-system, sans-serif';
    ctx.fillText(`CONC: ${conc} mg/mL`, 18, 98);

    ctx.font = '14px -apple-system, sans-serif';
    ctx.fillText(`REC: ${dateIn.value}  (Uso max: 30d)`, 18, 126);
  }

  [nameIn, mgIn, bacIn, dateIn].forEach(el => {
    el.addEventListener('input', drawLabel);
  });

  function saveOrShareLabel(share) {
    const name = (nameIn.value || 'peptido').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `etiqueta_${name}_${Date.now()}.png`;
    const dataUrl = canvas.toDataURL('image/png');

    if (window.AndroidBridge && typeof window.AndroidBridge.saveImage === 'function') {
      window.AndroidBridge.saveImage(dataUrl, filename, share);
    } else {
      // Fallback para navegador web
      const a = document.createElement('a');
      a.download = filename;
      a.href = dataUrl;
      a.click();
      showToast(share ? 'Abriendo descarga de imagen...' : 'Etiqueta descargada');
    }
  }

  const saveBtn = document.getElementById('labelSaveBtn');
  const shareBtn = document.getElementById('labelShareBtn');
  if (saveBtn) saveBtn.addEventListener('click', () => saveOrShareLabel(false));
  if (shareBtn) shareBtn.addEventListener('click', () => saveOrShareLabel(true));

  drawLabel();
}

/* ============================================================
   12. MÓDULO COA (Analizador de Certificados de Análisis)
   ============================================================ */
function initCOA() {
  const claimMgIn = document.getElementById('coaClaimMg');
  const actualMgIn = document.getElementById('coaActualMg');
  const purityIn = document.getElementById('coaPurity');
  const endotoxinIn = document.getElementById('coaEndotoxin');

  function calculateCOA() {
    const claim = parseFloat(claimMgIn.value) || 0;
    const actual = parseFloat(actualMgIn.value) || 0;
    const purity = parseFloat(purityIn.value) || 0;
    const endo = parseFloat(endotoxinIn.value) || 0;

    if (claim <= 0 || actual <= 0) return;

    const diffPct = ((actual - claim) / claim) * 100;
    const isPurityOk = purity >= 98.0;
    const isEndoOk = endo < 0.05;

    document.getElementById('coaDiffResult').textContent = `${diffPct > 0 ? '+' : ''}${diffPct.toFixed(1)}%`;
    document.getElementById('coaPurityVerdict').textContent = isPurityOk ? 'Excelente (≥98%)' : 'Aceptable / Bajo';
    document.getElementById('coaEndoVerdict').textContent = isEndoOk ? 'Seguro (<0.05 EU/mg)' : 'Elevado (precaución)';
  }

  [claimMgIn, actualMgIn, purityIn, endotoxinIn].forEach(el => {
    el.addEventListener('input', calculateCOA);
  });

  calculateCOA();
}

/* ============================================================
   13. MÓDULO CHART (Matriz de Referencia por Péptido)
   ============================================================ */
function initChart() {
  const picker = document.getElementById('chartCompoundPicker');
  const noteEl = document.getElementById('chartCompoundNote');
  const styleGroup = document.getElementById('chartStyleGroup');
  const tableHead = document.getElementById('chartMatrixHead');
  const tableBody = document.getElementById('chartMatrixBody');

  if (!picker || !tableHead || !tableBody) return;

  const compounds = {
    tirzepatide: {
      name: 'Tirzepatida (Mounjaro / Zepbound)',
      vials: [5, 10, 15, 30, 60],
      doses: [2.5, 5.0, 7.5, 10.0, 12.5, 15.0],
      doseUnit: 'mg',
      note: 'Pauta FDA Zepbound: escalada de 2.5 a 15 mg semanal, 4 semanas por escalón.'
    },
    semaglutide: {
      name: 'Semaglutida (Ozempic / Wegovy)',
      vials: [2, 5, 10, 15],
      doses: [0.25, 0.5, 1.0, 1.7, 2.4],
      doseUnit: 'mg',
      note: 'Pauta Wegovy: 0.25 → 2.4 mg semanal, 4 semanas por escalón.'
    },
    retatrutide: {
      name: 'Retatrutida (LY3437943)',
      vials: [5, 10, 15, 30],
      doses: [2.0, 4.0, 6.0, 8.0, 12.0],
      doseUnit: 'mg',
      note: 'Fase 2 TRIUMPH: escalada de 2 a 12 mg semanal (algunos pacientes mantienen en 8 mg).'
    },
    survodutide: {
      name: 'Survodutida (BI 456906)',
      vials: [5, 10, 15],
      doses: [0.6, 1.2, 2.4, 3.6, 4.8],
      doseUnit: 'mg',
      note: 'Escalada semanal hacia la dosis objetivo de 4.8 mg.'
    },
    cagrilintide: {
      name: 'Cagrilintida (AM833)',
      vials: [5, 10],
      doses: [0.25, 0.5, 1.0, 1.7, 2.4],
      doseUnit: 'mg',
      note: 'Análogo de amilina de acción prolongada; frecuentemente combinado con semaglutida.'
    },
    bpc157: {
      name: 'BPC-157',
      vials: [2, 5, 10],
      doses: [0.25, 0.5, 0.75, 1.0],
      doseUnit: 'mcg',
      note: 'Protocolo de investigación: 250–500 mcg 1 a 2 veces al día.'
    },
    tb500: {
      name: 'TB-500 (Timosina Beta-4)',
      vials: [2, 5, 10],
      doses: [2.0, 2.5, 5.0],
      doseUnit: 'mg',
      note: 'Protocolo comunitario: 2–5 mg semanales (repartido en 1 a 2 tomas).'
    },
    tesamorelin: {
      name: 'Tesamorelina (Egrifta)',
      vials: [5, 10],
      doses: [1.0, 2.0],
      doseUnit: 'mg',
      note: 'Dosis terapéutica FDA: 2 mg diarios SubQ (1 mg como inicio).'
    },
    ipamorelin: {
      name: 'Ipamorelina',
      vials: [5, 10],
      doses: [0.1, 0.2, 0.3],
      doseUnit: 'mcg',
      note: 'Protocolo de investigación: 100–300 mcg por dosis, 1 a 3 veces al día en ayunas.'
    },
    cjc1295: {
      name: 'CJC-1295 (sin DAC)',
      vials: [2, 5, 10],
      doses: [0.1, 0.2, 0.25],
      doseUnit: 'mcg',
      note: 'Análogo de GHRH administrado habitualmente a 100–200 mcg junto con ipamorelina.'
    },
    ghkcu: {
      name: 'GHK-Cu (Péptido de Cobre)',
      vials: [50, 100],
      doses: [1.0, 2.0, 3.0],
      doseUnit: 'mg',
      note: 'Protocolo de rejuvenecimiento: 1–2 mg/día SubQ; se presenta en viales grandes de 50 a 100 mg.'
    },
    motsc: {
      name: 'MOTS-c (Péptido Mitocondrial)',
      vials: [5, 10],
      doses: [5.0, 10.0],
      doseUnit: 'mg',
      note: 'Protocolo metabólico: 5–10 mg semanales repartidos.'
    },
    pt141: {
      name: 'PT-141 (Bremelanotida)',
      vials: [5, 10],
      doses: [0.5, 1.0, 1.75, 2.0],
      doseUnit: 'mg',
      note: 'Dosis aprobada Vyleesi: 1.75 mg SubQ a demanda (uso experimental 0.5–2 mg).'
    },
    nad: {
      name: 'NAD+',
      vials: [100, 500, 1000],
      doses: [25.0, 50.0, 100.0],
      doseUnit: 'mg',
      note: 'Empezar en 25 mg y titular; la inyección rápida puede provocar rubor o náuseas leves.'
    },
    glutathione: {
      name: 'Glutatión (GSH)',
      vials: [200, 600, 1200],
      doses: [200.0, 400.0, 600.0],
      doseUnit: 'mg',
      note: 'Potente antioxidante: 200–600 mg administrados 1 a 3 veces por semana.'
    },
    epitalon: {
      name: 'Epitalon',
      vials: [10, 50],
      doses: [5.0, 10.0],
      doseUnit: 'mg',
      note: 'Péptido biorregulador epifisario: ciclos de 5 a 10 mg diarios durante 10–20 días.'
    },
    generic: {
      name: 'Genérico en Miligramos (mg)',
      vials: [5, 10, 20, 30, 60],
      doses: [0.5, 1.0, 2.5, 5.0],
      doseUnit: 'mg',
      note: 'Matriz estándar neutra para cualquier compuesto no listado dosificado en mg.'
    },
    genericMcg: {
      name: 'Genérico en Microgramos (mcg)',
      vials: [2, 5, 10, 15],
      doses: [0.1, 0.25, 0.5, 1.0],
      doseUnit: 'mcg',
      note: 'Matriz estándar neutra para cualquier compuesto no listado dosificado en mcg.'
    }
  };

  const groups = [
    { label: 'Incretinas y GLP-1', ids: ['tirzepatide', 'semaglutide', 'retatrutide', 'survodutide', 'cagrilintide'] },
    { label: 'Crecimiento y Reparación', ids: ['bpc157', 'tb500', 'tesamorelin', 'ipamorelin', 'cjc1295', 'ghkcu', 'motsc'] },
    { label: 'Salud Sexual', ids: ['pt141'] },
    { label: 'Longevidad y Celular', ids: ['nad', 'glutathione', 'epitalon'] },
    { label: 'Genérico', ids: ['generic', 'genericMcg'] }
  ];

  // Poblar el selector con grupos
  picker.innerHTML = groups.map(g => `
    <optgroup label="${g.label}">
      ${g.ids.map(id => {
        const c = compounds[id];
        return `<option value="${id}">${c.name}</option>`;
      }).join('')}
    </optgroup>
  `).join('');

  let currentStyle = 'easy';

  // Manejo de botones 3D de estilo
  styleGroup.querySelectorAll('.pill-3d').forEach(btn => {
    btn.addEventListener('click', () => {
      styleGroup.querySelectorAll('.pill-3d').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentStyle = btn.dataset.style;
      renderMatrix();
    });
  });

  picker.addEventListener('change', renderMatrix);

  const BAC_OPTIONS = [1, 1.5, 2, 2.5, 3, 4, 5];
  const MIN_UNITS = 4;
  const MAX_UNITS = 100;

  function pickBac(vialMg, doseMg, style) {
    let best = null;
    for (let i = 0; i < BAC_OPTIONS.length; i++) {
      const bac = BAC_OPTIONS[i];
      const u = (doseMg * bac / vialMg) * 100;
      if (u < MIN_UNITS) continue;

      const over = u > MAX_UNITS ? -150 : 0;
      const rounded = Math.round(u);
      const isClean = Math.abs(u - rounded) <= 0.25;

      let score = over;
      if (style === 'easy') {
        let roundBonus = 0;
        if (rounded % 10 === 0) roundBonus = 35;
        else if (rounded % 5 === 0) roundBonus = 22;
        else if (isClean) roundBonus = 12;
        score += roundBonus - Math.abs(u - 35) * 0.15;
      } else {
        // menor volumen
        let roundBonus = isClean ? 15 : -25;
        score += roundBonus - (bac * 12);
      }

      if (!best || score > best.score) {
        best = { bac, units: u, score };
      }
    }
    return best;
  }

  function formatDose(d, unit) {
    if (unit === 'mcg') {
      return `${Math.round(d * 1000)} mcg`;
    }
    return `${Number.isInteger(d) ? d : d.toFixed(2)} mg`;
  }

  function renderMatrix() {
    const compId = picker.value;
    const comp = compounds[compId] || compounds.tirzepatide;

    if (noteEl) {
      noteEl.textContent = comp.note;
    }

    // Cabecera
    let headHtml = '<tr><th style="min-width:70px; background:var(--card-bg-elevated); font-weight:800;">Vial \\ Dosis</th>';
    comp.doses.forEach(dose => {
      headHtml += `<th style="white-space:nowrap; padding:10px 8px; font-weight:800; color:var(--text-main);">${formatDose(dose, comp.doseUnit)}</th>`;
    });
    headHtml += '</tr>';
    tableHead.innerHTML = headHtml;

    // Filas (Viales)
    let bodyHtml = '';
    comp.vials.forEach(vial => {
      bodyHtml += `<tr><td style="font-weight:800; background:var(--card-bg-elevated); color:var(--text-main);">${vial} mg</td>`;
      comp.doses.forEach(dose => {
        if (dose > vial) {
          bodyHtml += '<td style="color:var(--text-muted); opacity:0.35;">—</td>';
        } else {
          const solution = pickBac(vial, dose, currentStyle);
          if (!solution || solution.units > MAX_UNITS) {
            bodyHtml += '<td style="color:var(--text-muted); font-size:0.75rem;">&gt;100u</td>';
          } else {
            const rawDoseDisplay = comp.doseUnit === 'mcg' ? Math.round(dose * 1000) : dose;
            bodyHtml += `
              <td style="cursor:pointer; padding:8px 6px; transition:background 0.12s;" onclick="loadChartSelection(${vial}, ${solution.bac}, ${rawDoseDisplay}, '${comp.doseUnit}')">
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">${solution.bac} mL BAC</div>
                <span class="badge-units" style="margin-top:3px; display:inline-block; font-size:0.85rem;">${Math.round(solution.units)} u</span>
              </td>
            `;
          }
        }
      });
      bodyHtml += '</tr>';
    });
    tableBody.innerHTML = bodyHtml;
  }

  window.loadChartSelection = function(vial, bac, dose, unit) {
    if (typeof window.loadPeptideInCalc === 'function') {
      window.loadPeptideInCalc(vial, bac, dose, unit);
      showToast(`Cargado en Calculadora: Vial ${vial}mg, ${bac}mL BAC, Dosis ${dose}${unit}`);
    }
  };

  renderMatrix();
}

/* ============================================================
   14. MÓDULO LABS (Paneles de Analítica y Marcadores de Sangre)
   ============================================================ */
function initLabs() {
  const panelSelect = document.getElementById('labsPanelSelect');
  const itemsContainer = document.getElementById('labsItemsContainer');
  const saveBtn = document.getElementById('labsSaveBtn');
  const historyContainer = document.getElementById('labsHistoryContainer');

  const panels = {
    bench16: {
      name: 'Panel Integral 16 Biomarcadores (Estilo Bench)',
      markers: [
        { id: 'glucose', name: '1. Glucosa en Ayunas', min: 70, max: 99, unit: 'mg/dL', default: 85 },
        { id: 'hba1c', name: '2. Hemoglobina Glicosilada (HbA1c)', min: 4.0, max: 5.6, unit: '%', default: 5.2 },
        { id: 'insulin', name: '3. Insulina en Ayunas', min: 2.6, max: 24.9, unit: 'μIU/mL', default: 8.4 },
        { id: 'alt', name: '4. ALT / GPT (Hígado)', min: 7, max: 40, unit: 'U/L', default: 22 },
        { id: 'ast', name: '5. AST / GOT (Hígado)', min: 10, max: 40, unit: 'U/L', default: 20 },
        { id: 'ggt', name: '6. GGT (Gamma-Glutamil Transferasa)', min: 9, max: 48, unit: 'U/L', default: 24 },
        { id: 'creat', name: '7. Creatinina Sérica (Riñón)', min: 0.7, max: 1.2, unit: 'mg/dL', default: 0.95 },
        { id: 'egfr', name: '8. Filtrado Glomerular (eGFR)', min: 90, max: 120, unit: 'mL/min', default: 105 },
        { id: 'trig', name: '9. Triglicéridos', min: 40, max: 150, unit: 'mg/dL', default: 85 },
        { id: 'chol', name: '10. Colesterol Total', min: 125, max: 200, unit: 'mg/dL', default: 175 },
        { id: 'hdl', name: '11. Colesterol HDL (Bueno)', min: 40, max: 90, unit: 'mg/dL', default: 55 },
        { id: 'ldl', name: '12. Colesterol LDL (Aterogénico)', min: 50, max: 100, unit: 'mg/dL', default: 82 },
        { id: 'igf1', name: '13. IGF-1 (Eje Somatropina/GH)', min: 120, max: 320, unit: 'ng/mL', default: 210 },
        { id: 'tsh', name: '14. TSH (Función Tiroidea)', min: 0.4, max: 4.0, unit: 'mIU/L', default: 1.8 },
        { id: 'crp', name: '15. PCR Ultrasensible (Inflamación)', min: 0.0, max: 1.0, unit: 'mg/L', default: 0.4 },
        { id: 'bpsys', name: '16. Presión Arterial Sistólica', min: 90, max: 125, unit: 'mmHg', default: 118 }
      ]
    },
    glp1: {
      name: 'Panel GLP-1 (Tirzepatida, Semaglutida, Retatrutida)',
      markers: [
        { id: 'glucose', name: 'Glucosa en Ayunas', min: 70, max: 99, unit: 'mg/dL', default: 85 },
        { id: 'hba1c', name: 'Hemoglobina Glicosilada (HbA1c)', min: 4.0, max: 5.6, unit: '%', default: 5.2 },
        { id: 'alt', name: 'ALT / GPT (Función Hepática)', min: 7, max: 40, unit: 'U/L', default: 22 },
        { id: 'ast', name: 'AST / GOT (Función Hepática)', min: 10, max: 40, unit: 'U/L', default: 20 },
        { id: 'creat', name: 'Creatinina Sérica (Riñón)', min: 0.7, max: 1.2, unit: 'mg/dL', default: 0.95 },
        { id: 'lipase', name: 'Lipasa Pancreática', min: 10, max: 60, unit: 'U/L', default: 28 }
      ]
    },
    gh: {
      name: 'Panel Secretagogos GH / Somatropina',
      markers: [
        { id: 'igf1', name: 'IGF-1 (Factor Crecimiento)', min: 120, max: 320, unit: 'ng/mL', default: 210 },
        { id: 'glucose', name: 'Glucosa en Ayunas', min: 70, max: 99, unit: 'mg/dL', default: 88 },
        { id: 'hba1c', name: 'HbA1c', min: 4.0, max: 5.6, unit: '%', default: 5.1 },
        { id: 'prolactin', name: 'Prolactina', min: 2.0, max: 18.0, unit: 'ng/mL', default: 7.5 },
        { id: 'tsh', name: 'TSH (Tiroides)', min: 0.4, max: 4.0, unit: 'mIU/L', default: 1.8 }
      ]
    },
    longevity: {
      name: 'Panel Longevidad y Reparación Celular',
      markers: [
        { id: 'crp', name: 'PCR Ultrasensible (Inflamación)', min: 0.0, max: 1.0, unit: 'mg/L', default: 0.4 },
        { id: 'trig', name: 'Triglicéridos', min: 40, max: 150, unit: 'mg/dL', default: 85 },
        { id: 'hdl', name: 'Colesterol HDL', min: 40, max: 90, unit: 'mg/dL', default: 55 },
        { id: 'ldl', name: 'Colesterol LDL', min: 50, max: 100, unit: 'mg/dL', default: 80 },
        { id: 'egfr', name: 'Filtrado Glomerular (eGFR)', min: 90, max: 120, unit: 'mL/min', default: 105 }
      ]
    }
  };

  function renderPanelInputs() {
    const key = panelSelect.value;
    const panel = panels[key] || panels.glp1;
    itemsContainer.innerHTML = panel.markers.map(m => `
      <div style="background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:12px; padding:12px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <strong style="font-size:0.88rem; color:var(--text-main);">${m.name}</strong>
          <span style="font-size:0.75rem; color:var(--text-muted);">Ref: ${m.min} - ${m.max} ${m.unit}</span>
        </div>
        <div class="input-group" style="margin:0;">
          <input type="number" id="marker_${m.id}" data-min="${m.min}" data-max="${m.max}" data-name="${m.name}" data-unit="${m.unit}" value="${m.default}" step="any" oninput="checkMarker('${m.id}')">
          <span class="unit-badge">${m.unit}</span>
        </div>
        <div id="status_${m.id}" style="margin-top:6px; font-size:0.76rem; font-weight:700; color:#10b981;">
          ✓ Dentro del rango óptimo
        </div>
      </div>
    `).join('');

    panel.markers.forEach(m => checkMarker(m.id));
  }

  window.checkMarker = function(id) {
    const input = document.getElementById(`marker_${id}`);
    const status = document.getElementById(`status_${id}`);
    if (!input || !status) return;
    const val = parseFloat(input.value);
    const min = parseFloat(input.dataset.min);
    const max = parseFloat(input.dataset.max);

    if (isNaN(val)) {
      status.textContent = 'Introduce un valor';
      status.style.color = 'var(--text-muted)';
    } else if (val >= min && val <= max) {
      status.textContent = '✓ Dentro del rango óptimo';
      status.style.color = '#10b981';
    } else if (val < min) {
      status.textContent = `▼ Por debajo del rango de referencia (${min} - ${max})`;
      status.style.color = '#f59e0b';
    } else {
      status.textContent = `▲ Por encima del rango de referencia (${min} - ${max})`;
      status.style.color = '#f43f5e';
    }
  };

  panelSelect.addEventListener('change', renderPanelInputs);

  saveBtn.addEventListener('click', () => {
    const key = panelSelect.value;
    const panel = panels[key];
    const record = {
      date: new Date().toISOString(),
      panelName: panel.name,
      values: panel.markers.map(m => {
        const inp = document.getElementById(`marker_${m.id}`);
        return { name: m.name, val: inp ? inp.value : '', unit: m.unit };
      })
    };
    let history = JSON.parse(localStorage.getItem('mispep_labs_history') || '[]');
    history.unshift(record);
    localStorage.setItem('mispep_labs_history', JSON.stringify(history));
    renderHistory();
    showToast('Analítica guardada en el historial local');
  });

  function renderHistory() {
    let history = JSON.parse(localStorage.getItem('mispep_labs_history') || '[]');
    if (history.length === 0) {
      historyContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-size:0.82rem; padding:12px;">No hay analíticas guardadas.</p>';
      return;
    }
    historyContainer.innerHTML = history.slice(0, 5).map((h, idx) => `
      <div style="background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:10px; padding:10px 12px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:0.85rem; color:var(--text-main);">${h.panelName}</strong>
          <span style="font-size:0.72rem; color:var(--text-muted);">${new Date(h.date).toLocaleDateString('es-ES')}</span>
        </div>
        <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:4px;">
          ${h.values.map(v => `${v.name}: <strong>${v.val} ${v.unit}</strong>`).slice(0, 3).join(' | ')}...
        </div>
      </div>
    `).join('');
  }

  renderPanelInputs();
  renderHistory();
}

/* ============================================================
   15. MÓDULO RESEARCH (Biblioteca de Péptidos y Carga Rápida)
   ============================================================ */
function initResearch() {
  const listContainer = document.getElementById('researchListContainer');
  const searchInput = document.getElementById('researchSearchInput');
  const catPills = document.getElementById('researchCategoryPills');

  const peptideLibrary = [
    /* --- METABOLISMO / INCRETINAS --- */
    {
      name: 'Tirzepatida (Mounjaro / Zepbound)',
      school: {"mw": "4813,45 g/mol", "formula": "C₂₂₅H₃₄₈N₄₈O₆₈", "status": "Aprobado por FDA y EMA", "statusEn": "FDA/EMA approved", "evidence": "Ensayo SURMOUNT-1: pérdida media cercana al 21 % con 15 mg a las 72 semanas. En SURPASS superó a semaglutida 1 mg en HbA1c y peso.", "keyPoints": ["Una sola cadena de 39 aminoácidos activa a la vez los receptores GIP y GLP-1.", "La unión a albúmina alarga su semivida hasta unos 5 días, permitiendo pauta semanal.", "Aprobada para diabetes tipo 2 y para obesidad; no sustituye al seguimiento médico."], "faq": [{"q": "¿Se puede pasar de semaglutida a tirzepatida sin más?", "a": "No son intercambiables mg por mg. El cambio lo pauta el médico y suele reiniciarse a dosis baja para reducir molestias digestivas."}, {"q": "¿Cuánto tarda en notarse el efecto?", "a": "El cambio de apetito aparece en una o dos semanas; la evolución del peso se valora a partir de las 8-12 semanas."}], "en": {"evidence": "SURMOUNT-1: about 21% mean weight loss with 15 mg at 72 weeks. In SURPASS it beat semaglutide 1 mg on HbA1c and weight.", "keyPoints": ["A single 39-amino-acid chain activates both GIP and GLP-1 receptors.", "Albumin binding extends its half-life to about 5 days, allowing a weekly dose.", "Approved for type 2 diabetes and obesity; medical follow-up is required."], "faq": [{"q": "Can I switch from semaglutide to tirzepatide directly?", "a": "They are not interchangeable milligram for milligram. The switch is doctor-led and usually restarts at a low dose to limit digestive upset."}, {"q": "How soon does it work?", "a": "Appetite changes appear within one or two weeks; weight trends are assessed from 8-12 weeks."}], "mistakes": ["Jumping from 2.5 to 7.5 mg in two weeks instead of waiting four weeks per step.", "Splitting the weekly dose into two shots without recalculating the total.", "Mistaking U-100 syringe units for milligrams when reconstituting a 10 mg vial."]}, "mistakes": ["Subir de 2,5 a 7,5 mg en dos semanas por impaciencia, en vez de esperar cuatro semanas por escalón.", "Partir la dosis semanal en dos pinchazos sin recalcular el total acumulado.", "Confundir las «unidades» de la jeringa U-100 con miligramos al reconstituir un vial de 10 mg."]},
      cat: 'Metabolismo',
      vial: 10,
      bac: 2,
      dose: 2.5,
      unit: 'mg',
      desc: 'Agonista dual de los receptores GIP y GLP-1 en una sola molécula: 39 aminoácidos con un diácido graso C20 unido en Lys20 que se une reversiblemente a la albúmina y prolonga su acción. Mejora la secreción de insulina, ralentiza el vaciado gástrico y reduce apetito y masa grasa; compuesto de referencia de la señalización dual de incretinas (Coskun, 2018).',
      contra: 'Hipersensibilidad; antecedentes personales/familiares de CMT o MEN2 (advertencia recuadrada); embarazo (suspender antes de gestación planificada); lactancia no recomendada.',
      halfLife: '5 días',
      freq: '1 vez por semana (SubQ)'
    },
    {
      name: 'Semaglutida (Ozempic / Wegovy)',
      school: {"mw": "4113,58 g/mol", "formula": "C₁₈₇H₂₉₁N₄₅O₅₉", "status": "Aprobado por FDA y EMA", "statusEn": "FDA/EMA approved", "evidence": "En STEP 1, la pauta semanal de 2,4 mg redujo el peso alrededor de un 15 % a las 68 semanas. También reduce eventos cardiovasculares en pacientes de alto riesgo.", "keyPoints": ["Análogo del GLP-1 humano con modificaciones que evitan la degradación por DPP-4.", "La cadena de ácido graso y la unión a albúmina sostienen su acción durante toda la semana.", "Existe versión oral, pero su absorción es muy variable y exige ayuno estricto."], "faq": [{"q": "¿Por qué se empieza con dosis baja?", "a": "Para que el intestino se adapte: la escalada gradual reduce náuseas, vómitos y diarrea."}, {"q": "¿Qué pasa si se olvida una dosis?", "a": "Si han pasado menos de 5 días, se administra; si falta menos para la siguiente, se omite y se sigue la pauta habitual."}], "en": {"evidence": "In STEP 1, weekly 2.4 mg produced about 15% weight loss at 68 weeks. It also lowers cardiovascular events in high-risk patients.", "keyPoints": ["A GLP-1 analogue with modifications that resist DPP-4 breakdown.", "A fatty-acid chain and albumin binding sustain activity across the week.", "An oral form exists, but absorption varies widely and requires strict fasting."], "faq": [{"q": "Why start at a low dose?", "a": "To let the gut adapt: gradual escalation reduces nausea, vomiting and diarrhoea."}, {"q": "What if a dose is missed?", "a": "If fewer than 5 days have passed, take it; if the next dose is closer, skip it and resume the usual schedule."}], "mistakes": ["Using the pen's dose table on a powder vial and calculating 0.25 mg with the wrong concentration.", "Staying on the dose despite persistent vomiting for fear of losing effect.", "Taking daily 'microdoses' without accounting for accumulation over a seven-day half-life."]}, "mistakes": ["Aplicar la tabla de la pluma a un vial de polvo y calcular 0,25 mg con la concentración equivocada.", "Mantener la dosis aunque haya vómitos persistentes, por miedo a perder efecto.", "Hacer «microdosis» diarias sin sumar la acumulación de una semivida de siete días."]},
      cat: 'Metabolismo',
      vial: 5,
      bac: 2,
      dose: 250,
      unit: 'mcg',
      desc: 'Análogo acilado del GLP-1 de 31 aminoácidos con diácido graso C18 (y Aib en la posición 8) que se adhiere a la albúmina para una acción prolongada semanal con afinidad selectiva por el receptor GLP-1. Regula la glucemia y promueve la saciedad hipotalámica; referencia clásica en estudios de la vía de las incretinas (Lau, 2015).',
      contra: 'Hipersensibilidad; antecedentes personales/familiares de CMT o MEN2; embarazo (suspender ≥2 meses antes de gestación); lactancia no recomendada.',
      halfLife: '7 días',
      freq: '1 vez por semana (SubQ)'
    },
    {
      name: 'Retatrutida (LY3437943)',
      school: {"mw": "≈ 4300 g/mol", "formula": "C₁₉₇H₂₉₀N₅₀O₆₁S", "status": "Fase 3 (programa TRIUMPH), sin aprobación", "statusEn": "Phase 3 (TRIUMPH), not approved", "evidence": "En el ensayo de fase 2 publicado en 2023, la dosis de 12 mg produjo una pérdida de peso cercana al 24 % a las 48 semanas, con efectos digestivos dosis-dependientes.", "keyPoints": ["Triple agonista: suma el brazo del glucagón al GLP-1 y al GIP.", "El componente glucagón aumenta el gasto energético y la oxidación de grasa hepática.", "No está aprobada: solo debería usarse dentro de un ensayo clínico supervisado."], "faq": [{"q": "¿En qué se diferencia de tirzepatida?", "a": "Añade el agonismo del receptor de glucagón, lo que puede incrementar el gasto calórico, a costa de más náuseas y molestias digestivas."}, {"q": "¿Ya se vende legalmente?", "a": "No. Sigue en fase 3 y no cuenta con aprobación de la FDA ni de la EMA."}], "en": {"evidence": "In the 2023 phase 2 trial, 12 mg produced about 24% weight loss at 48 weeks, with dose-dependent digestive effects.", "keyPoints": ["A triple agonist: it adds the glucagon arm to GLP-1 and GIP.", "The glucagon component raises energy expenditure and liver fat oxidation.", "It is not approved and should only be used inside a supervised clinical trial."], "faq": [{"q": "How does it differ from tirzepatide?", "a": "It adds glucagon-receptor agonism, which may raise energy use at the cost of more nausea and gut side effects."}, {"q": "Is it legally sold yet?", "a": "No. It remains in phase 3 without FDA or EMA approval."}], "mistakes": ["Starting at 2 mg or more in the first week instead of 1 mg.", "Injecting every five days to 'hold the peak', unintentionally stacking levels.", "Stacking it with tirzepatide or semaglutide assuming the effects add up safely."]}, "mistakes": ["Empezar en 2 mg o más en la primera semana en lugar de 1 mg.", "Pinchar cada cinco días para «mantener el pico», acumulando niveles sin querer.", "Apilarla con tirzepatida o semaglutida creyendo que los efectos se suman sin riesgo."]},
      cat: 'Metabolismo',
      vial: 10,
      bac: 2,
      dose: 2.0,
      unit: 'mg',
      desc: 'Agonista triple GIP/GLP-1/glucagón en una sola molécula de 39 aminoácidos. Además de controlar el apetito, el brazo de glucagón incrementa el gasto metabólico basal y la lipólisis hepática; molécula de referencia para estudiar la activación conjunta de las tres vías en señalización metabólica (Coskun, 2022).',
      contra: 'Sin aprobación humana (investigación). Hipersensibilidad; antecedentes personales/familiares de CMT o MEN2; pancreatitis previa; enfermedad GI grave (gastroparesia/EII); embarazo/lactancia; <18 años.',
      halfLife: '6 días',
      freq: '1 vez por semana (SubQ)'
    },
    {
      name: 'Cagrilintida (AM833)',
      school: {"mw": "≈ 4409 g/mol", "formula": "C₁₉₄H₃₁₂N₅₄O₅₉S₂", "status": "Fase 3, sin aprobación", "statusEn": "Phase 3, not approved", "evidence": "Los ensayos de fase 2 muestran pérdidas de peso moderadas como monoterapia y claramente mayores al combinarse con semaglutida (CagriSema).", "keyPoints": ["Análogo de amilina de acción prolongada, con vía distinta a la del GLP-1.", "Actúa sobre la saciedad en el área postrema y enlentece el vaciado gástrico.", "Se estudia sobre todo en combinación fija con semaglutida."], "faq": [{"q": "¿Es lo mismo que la amilina?", "a": "Es un análogo sintético con modificaciones que resisten la degradación y prolongan su efecto."}, {"q": "¿Comparte los avisos del GLP-1?", "a": "En combinación con semaglutida sí se aplican los avisos de clase, incluido el riesgo de carcinoma medular de tiroides."}], "en": {"evidence": "Phase 2 trials show moderate weight loss as monotherapy and clearly greater loss when combined with semaglutide (CagriSema).", "keyPoints": ["A long-acting amylin analogue that works through a pathway distinct from GLP-1.", "It acts on satiety in the area postrema and slows gastric emptying.", "It is mainly studied as a fixed combination with semaglutide."], "faq": [{"q": "Is it the same as amylin?", "a": "It is a synthetic analogue with modifications that resist breakdown and prolong its effect."}, {"q": "Does it share GLP-1 warnings?", "a": "When combined with semaglutide, class warnings apply, including medullary thyroid carcinoma risk."}], "mistakes": ["Using it alone and expecting a GLP-1 effect.", "Mixing it with semaglutide in the same vial.", "Skipping slow titration because 'amylin doesn't cause nausea'."]}, "mistakes": ["Usarla sola esperando el efecto de un GLP-1.", "Mezclarla en el mismo vial con semaglutida.", "Saltarse la titulación lenta porque «la amilina no da náuseas»."]},
      cat: 'Metabolismo',
      vial: 5,
      bac: 2,
      dose: 250,
      unit: 'mcg',
      desc: 'Análogo de amilina de acción prolongada de 37 aminoácidos con cola de ácido graso C16. Actúa sobre los receptores de la familia de la amilina por una vía independiente de GLP-1, regulando la saciedad en el área postrema y el vaciado gástrico; herramienta de referencia en estudios de señalización de amilina (Kruse, 2021).',
      contra: 'Sin aprobación humana (investigación); contraindicaciones no establecidas. Evitar: embarazo/lactancia, hipersensibilidad, enfermedad GI grave (gastroparesia). Con semaglutida aplican las de GLP-1 (CMT/MEN2).',
      halfLife: '7 días',
      freq: '1 vez por semana (SubQ)'
    },
    {
      name: 'Survodutida (BI 456906)',
      school: {"mw": "≈ 4,9 kDa", "formula": "—", "status": "Fase 3, sin aprobación", "statusEn": "Phase 3, not approved", "evidence": "Los datos de fase 2 muestran pérdidas de peso relevantes, con un perfil digestivo similar al de otros agonistas de incretinas.", "keyPoints": ["Doble agonista GLP-1 y glucagón construido sobre un armazón de glucagón.", "Incorporar el brazo glucagón busca aumentar el gasto energético y movilizar grasa.", "Aún no aprobada; faltan datos de fase 3."], "faq": [{"q": "¿Por qué se habla de «GLP-1 con glucagón»?", "a": "Porque activa ambos receptores: el GLP-1 reduce el apetito y el glucagón eleva el gasto de energía."}, {"q": "¿Está disponible en farmacia?", "a": "No, sigue en desarrollo clínico."}], "en": {"evidence": "Phase 2 data show meaningful weight loss with a digestive profile similar to other incretin agonists.", "keyPoints": ["A dual GLP-1 and glucagon agonist built on a glucagon backbone.", "The glucagon arm aims to raise energy expenditure and mobilise fat.", "Not yet approved; phase 3 data are pending."], "faq": [{"q": "Why call it 'GLP-1 plus glucagon'?", "a": "Because it activates both receptors: GLP-1 curbs appetite while glucagon raises energy use."}, {"q": "Is it available in pharmacies?", "a": "No, it is still in clinical development."}], "mistakes": ["Copying the retatrutide dose because both are multi-agonists.", "Quitting at four weeks, before the maintenance phase used in trials.", "Not monitoring liver enzymes on an agonist with a glucagon arm."]}, "mistakes": ["Copiar la dosis de retatrutida por ser ambos agonistas múltiples.", "Abandonar a las cuatro semanas, antes de la fase de mantenimiento de los ensayos.", "No vigilar las enzimas hepáticas en un agonista con brazo glucagón."]},
      cat: 'Metabolismo',
      vial: 10,
      bac: 2,
      dose: 0.6,
      unit: 'mg',
      desc: 'Agonista dual GLP-1 y glucagón (BI 456906) construido sobre el armazón del glucagón, con residuo protector frente a la DPP-4 y cadena de diácido graso C18 que prolonga la semivida. Estudiado por el equilibrio entre ambos brazos en modelos de metabolismo energético y grasa hepática (Zimmermann, 2022).',
      contra: 'Carcinoma medular tiroideo/MEN2 (clase GLP-1); pancreatitis; gastroparesia; embarazo/lactancia; hipersensibilidad; uso no aprobado fuera de ensayos.',
      halfLife: '6 días',
      freq: '1 vez por semana (SubQ)'
    },
    {
      name: 'Mazdutida (IBI362)',
      school: {"mw": "≈ 4,5 kDa", "formula": "—", "status": "Fase 3 en China, sin aprobación", "statusEn": "Phase 3 in China, not approved", "evidence": "Los ensayos publicados en población china muestran reducciones de peso y de HbA1c superiores a placebo, con un perfil de tolerabilidad digestiva.", "keyPoints": ["Oxintomodulina sintética acilada con acción dual GLP-1 y glucagón.", "Su cadena grasa prolonga la semivida y permite administración semanal.", "Desarrollo liderado en China; sin aprobación en Europa."], "faq": [{"q": "¿Qué es la oxintomodulina?", "a": "Una hormona intestinal precursora del glucagón y del GLP-1; la mazdutida es su versión modificada."}, {"q": "¿Puedo encontrarla fuera de ensayos?", "a": "No debería: no está aprobada y su uso fuera de investigación carece de garantías."}], "en": {"evidence": "Trials in Chinese populations show greater weight and HbA1c reductions than placebo, with a digestive tolerability profile.", "keyPoints": ["An acylated synthetic oxyntomodulin with dual GLP-1 and glucagon action.", "Its fatty-acid chain extends half-life and allows weekly dosing.", "Development is led in China; it is not approved in Europe."], "faq": [{"q": "What is oxyntomodulin?", "a": "An intestinal hormone that is a precursor of both glucagon and GLP-1; mazdutide is its modified version."}, {"q": "Can I get it outside trials?", "a": "You should not: it is unapproved and non-research use has no safety guarantees."}], "mistakes": ["Extrapolating doses from Chinese forums without adjusting for the acylated presentation.", "Running four-week cycles when trials last 24-48 weeks.", "Assuming 1 mg of mazdutide equals 1 mg of retatrutide."]}, "mistakes": ["Extrapolar dosis de foros en chino sin ajustar la presentación acilada.", "Hacer ciclos de cuatro semanas cuando los ensayos duran 24-48.", "Asumir que 1 mg de mazdutida equivale a 1 mg de retatrutida."]},
      cat: 'Metabolismo',
      vial: 10,
      bac: 2,
      dose: 2.0,
      unit: 'mg',
      desc: 'Oxintomodulina sintética acilada (IBI362) con agonismo dual GLP-1R y receptor de glucagón: reduce peso por las dos vías y se usa como compuesto de referencia para comparar el peso del brazo de glucagón frente al GLP-1 en modelos metabólicos (Ji, 2022).',
      halfLife: '5 días',
      freq: '1 vez por semana (SubQ)'
    },
    {
      name: 'AOD-9604 (Fragmento hGH 176-191)',
      school: {"mw": "1815,08 g/mol", "formula": "C₇₈H₁₂₃N₂₃O₂₃S₂", "status": "Investigación preclínica / uso veterinario", "statusEn": "Preclinical / veterinary use", "evidence": "Los estudios en roedores describen lipólisis sin elevar IGF-1 ni afectar la glucemia; los ensayos en humanos han sido pequeños y con resultados inconsistentes.", "keyPoints": ["Fragmento C-terminal de 16 aminoácidos de la hormona de crecimiento con tirosina añadida.", "Busca separar el efecto lipolítico de los efectos sobre crecimiento y glucosa.", "Prohibido por la WADA en deportistas."], "faq": [{"q": "¿Adelgaza por sí solo?", "a": "La evidencia humana es débil; no hay ensayos grandes que confirmen pérdida de peso clínicamente relevante."}, {"q": "¿Afecta a la glucemia?", "a": "En modelos animales no eleva la glucosa ni el IGF-1, a diferencia de la hGH completa."}], "en": {"evidence": "Rodent studies describe lipolysis without raising IGF-1 or affecting glycaemia; human trials have been small and inconsistent.", "keyPoints": ["A 16-amino-acid C-terminal fragment of growth hormone with an added tyrosine.", "It aims to separate the lipolytic effect from growth and glucose effects.", "Banned by WADA for athletes."], "faq": [{"q": "Does it cause weight loss on its own?", "a": "Human evidence is weak; no large trial confirms clinically relevant weight loss."}, {"q": "Does it affect blood glucose?", "a": "In animal models it does not raise glucose or IGF-1, unlike full hGH."}], "mistakes": ["Expecting GLP-1-like weight loss.", "Injecting after meals instead of fasting.", "Using 500 mcg daily with no link to body weight or goal."]}, "mistakes": ["Esperar una pérdida de peso parecida a la de un GLP-1.", "Pincharlo después de comer en vez de en ayunas.", "Usar 500 mcg diarios sin relación con el peso ni con el objetivo."]},
      cat: 'Metabolismo',
      vial: 5,
      bac: 2,
      dose: 300,
      unit: 'mcg',
      desc: 'Fragmento de 16 aminoácidos del extremo C-terminal de la hormona de crecimiento con tirosina añadida al inicio (secuencia YLRIVQCRSVEGSCGF). Se estudia por su acción lipólítica sin efectos diabetogénicos ni elevación de IGF-1; molécula de referencia en investigación del metabolismo lipídico con péptidos modificados de la HGH (Ng, 2000).',
      contra: 'Embarazo/lactancia (sin datos); cáncer activo o reciente (riesgo teórico); hipersensibilidad; deportistas: prohibido por WADA. Diabetes: sin contraindicación documentada; vigilar con hipoglucemiantes.',
      halfLife: 'Corta (~30 min)',
      freq: 'Diario en ayunas (SubQ)'
    },

    /* --- REPARACIÓN Y ARTICULACIONES --- */
    {
      name: 'BPC-157 (Body Protection Compound)',
      school: {"mw": "1419,53 g/mol", "formula": "C₆₂H₉₈N₁₆O₂₂", "status": "Investigación preclínica", "statusEn": "Preclinical research", "evidence": "La mayoría de los datos proviene de roedores: acelera la cicatrización de tendones, úlceras gástricas y lesiones musculares. Los ensayos en humanos son escasos y de baja calidad.", "keyPoints": ["Pentadecapéptido derivado de una proteína del jugo gástrico humano.", "Estimula angiogénesis y síntesis de colágeno a través de VEGFR2 y EGR-1.", "Su estabilidad en medio ácido explica el interés en vía oral, aunque la biodisponibilidad es baja."], "faq": [{"q": "¿Es un medicamento aprobado?", "a": "No. Se vende como compuesto de investigación y no tiene aprobación regulatoria."}, {"q": "¿Por qué se asocia a riesgo tumoral?", "a": "Porque promueve la formación de vasos; en cáncer activo se considera una precaución importante."}], "en": {"evidence": "Most data come from rodents: it speeds tendon, gastric ulcer and muscle healing. Human trials are scarce and low quality.", "keyPoints": ["A pentadecapeptide derived from a human gastric juice protein.", "It stimulates angiogenesis and collagen synthesis via VEGFR2 and EGR-1.", "Its acid stability explains interest in oral use, though bioavailability is low."], "faq": [{"q": "Is it an approved medicine?", "a": "No. It is sold as a research compound without regulatory approval."}, {"q": "Why the cancer concern?", "a": "Because it promotes blood-vessel formation; active cancer is therefore an important precaution."}], "mistakes": ["Injecting far from the injury and expecting a local effect that does not happen.", "Running it for months without a break for fear of losing progress.", "Mixing it with TB-500 in the same syringe without recalculating each dose.", "Confusing 250 mcg with 250 units on the syringe."]}, "mistakes": ["Inyectarlo lejos de la lesión esperando un efecto local que no ocurre.", "Mantenerlo meses sin descanso por miedo a perder el progreso.", "Mezclarlo con TB-500 en la misma jeringa sin recalcular cada dosis.", "Confundir 250 mcg con 250 unidades en la jeringa."]},
      cat: 'Reparación',
      vial: 5,
      bac: 2,
      dose: 250,
      unit: 'mcg',
      desc: 'Pentadecapéptido de 15 aminoácidos (Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val) derivado de una proteína del jugo gástrico. Estimula la expresión de VEGFR2 y EGR-1, acelerando la angiogénesis y la síntesis de colágeno en tendones, ligamentos, cartílago y mucosa; vinculado además con la señalización de óxido nítrico (Hsieh, 2017).',
      contra: 'Cáncer activo o antecedente (proangiogénico); embarazo/lactancia (sin datos); hipersensibilidad; coagulopatías o anticoagulantes; autoinmunidad activa (precaución); insuficiencia renal/hepática grave.',
      halfLife: '4 horas',
      freq: '1 a 2 veces al día (SubQ u oral)'
    },
    {
      name: 'TB-500 (Timosina Beta-4 fragmento)',
      school: {"mw": "4963,50 g/mol", "formula": "C₂₁₂H₃₅₀N₅₆O₇₈S", "status": "Investigación preclínica", "statusEn": "Preclinical research", "evidence": "Los estudios se centran en migración celular y reparación de tejidos en modelos animales; no existen ensayos clínicos robustos en humanos.", "keyPoints": ["Fragmento activo de la timosina beta-4, proteína implicada en la dinámica de la actina.", "Su motivo LKKTET secuestra G-actina y facilita la migración de células endoteliales.", "Se investiga en regeneración de músculo, tendón y piel."], "faq": [{"q": "¿Es lo mismo que la timosina beta-4?", "a": "No exactamente: el TB-500 es un fragmento sintético de la región activa, no la proteína completa."}, {"q": "¿Tiene aprobación?", "a": "No; se comercializa como producto de investigación."}], "en": {"evidence": "Studies focus on cell migration and tissue repair in animal models; there are no robust human trials.", "keyPoints": ["The active fragment of thymosin beta-4, a protein involved in actin dynamics.", "Its LKKTET motif sequesters G-actin and aids endothelial cell migration.", "It is researched for muscle, tendon and skin regeneration."], "faq": [{"q": "Is it the same as thymosin beta-4?", "a": "Not exactly: TB-500 is a synthetic fragment of the active region, not the full protein."}, {"q": "Is it approved?", "a": "No; it is sold as a research product."}], "mistakes": ["Loading 2.5 mg daily instead of 2-2.5 mg twice a week.", "Expecting results in three days and doubling the dose.", "Combining it with BPC-157 while keeping both at full dose."]}, "mistakes": ["Hacer una carga de 2,5 mg al día en vez de 2-2,5 mg dos veces por semana.", "Esperar resultados en tres días y duplicar la dosis.", "Combinarlo con BPC-157 manteniendo ambas dosis plenas."]},
      cat: 'Reparación',
      vial: 5,
      bac: 2,
      dose: 2.5,
      unit: 'mg',
      desc: 'Basado en la timosina beta-4, proteína natural de 43 aminoácidos presente en casi todos los tipos celulares. Secuestra actina monomérica (G-actina) mediante su motivo central LKKTET (residuos 17-22), facilitando la migración celular endotelial, la remodelación tisular y la angiogénesis (Sosne, 2010).',
      contra: 'Cáncer activo o historia (angiogénico, contraindicación absoluta); embarazo/lactancia (sin datos); hipersensibilidad; coagulopatías o anticoagulantes; autoinmunidad activa (precaución).',
      halfLife: '24 horas',
      freq: '2 veces por semana (SubQ)'
    },
    {
      name: 'KPV (Lys-Pro-Val)',
      school: {"mw": "342,44 g/mol", "formula": "C₁₆H₃₀N₄O₄", "status": "Investigación preclínica", "statusEn": "Preclinical research", "evidence": "Los estudios en modelos de colitis e inflamación cutánea muestran reducción de citocinas proinflamatorias; los datos en humanos son muy limitados.", "keyPoints": ["Tripéptido C-terminal de la hormona α-MSH.", "Actúa sobre NF-κB y reduce la producción de mediadores inflamatorios.", "Se investiga por vía oral y tópica por su pequeño tamaño."], "faq": [{"q": "¿Es un antiinflamatorio?", "a": "Es un péptido de investigación con actividad antiinflamatoria en modelos animales, no un fármaco aprobado."}, {"q": "¿Se puede usar en la piel?", "a": "Se ha estudiado en formulaciones tópicas, pero no hay productos aprobados con garantías."}], "en": {"evidence": "Studies in colitis and skin inflammation models show reduced pro-inflammatory cytokines; human data are very limited.", "keyPoints": ["A C-terminal tripeptide of α-MSH.", "It acts on NF-κB and lowers inflammatory mediator production.", "Its small size makes oral and topical routes of interest."], "faq": [{"q": "Is it an anti-inflammatory drug?", "a": "It is a research peptide with anti-inflammatory activity in animals, not an approved medicine."}, {"q": "Can it be used on the skin?", "a": "Topical formulations have been studied, but no approved product with guarantees exists."}], "mistakes": ["Expecting a systemic effect from oral use.", "Using it as the only treatment for an inflammatory flare.", "Preparing high topical concentrations that irritate the skin."]}, "mistakes": ["Esperar efecto sistémico tomándolo por vía oral.", "Usarlo como único tratamiento de un brote inflamatorio.", "Preparar concentraciones tópicas altas que irritan la piel."]},
      cat: 'Reparación',
      vial: 5,
      bac: 2.5,
      dose: 200,
      unit: 'mcg',
      desc: 'Tripéptido Lys-Pro-Val, el fragmento C-terminal de la alfa-MSH (342 g/mol). Modula la translocación de NF-kB en células inmunes e intestinales con potente acción antiinflamatoria y sin efecto de pigmentación; ampliamente estudiado en modelos de inflamación intestinal (Kannengiesser, 2008).',
      contra: 'Melanoma activo o predisposición (receptores de melanocortina); embarazo/lactancia (sin datos); hipersensibilidad; sin ensayos clínicos humanos (precaución).',
      halfLife: '2 horas',
      freq: '1 a 2 veces al día (SubQ u oral)'
    },
    {
      name: 'ARA-290 (Cibinetida)',
      school: {"mw": "≈ 1257 g/mol", "formula": "—", "status": "Fase 2, sin aprobación", "statusEn": "Phase 2, not approved", "evidence": "Los ensayos en sarcoidosis y neuropatía diabética han mostrado señales mixtas; no hay aprobación regulatoria.", "keyPoints": ["Péptido de 11 aminoácidos derivado de la eritropoyetina, sin efecto hematopoyético.", "Activa el receptor innato de reparación (IRR) en tejido nervioso y vascular.", "Se investiga en neuropatías y enfermedades inflamatorias."], "faq": [{"q": "¿Es eritropoyetina?", "a": "No: es un fragmento diseñado para conservar el efecto reparador sin estimular la producción de glóbulos rojos."}, {"q": "¿Está aprobado?", "a": "No, su desarrollo clínico no ha llegado a aprobación."}], "en": {"evidence": "Trials in sarcoidosis and diabetic neuropathy have shown mixed signals; there is no regulatory approval.", "keyPoints": ["An 11-amino-acid peptide derived from erythropoietin without haematopoietic effect.", "It activates the innate repair receptor (IRR) in nerve and vascular tissue.", "It is studied in neuropathies and inflammatory disease."], "faq": [{"q": "Is it erythropoietin?", "a": "No: it is a fragment designed to keep the repair effect without boosting red-cell production."}, {"q": "Is it approved?", "a": "No, its clinical development has not reached approval."}], "mistakes": ["Confusing it with erythropoietin and using it for 'energy'.", "Expecting pain relief in the first week.", "Prolonging cycles without safety data."]}, "mistakes": ["Confundirlo con eritropoyetina y usarlo para «energía».", "Esperar alivio del dolor en la primera semana.", "Prolongar los ciclos sin datos de seguridad."]},
      cat: 'Reparación',
      vial: 16,
      bac: 2,
      dose: 4.0,
      unit: 'mg',
      desc: 'Péptido de 11 aminoácidos derivado de la hélice B de la eritropoyetina, diseñado para activar solo el receptor innato de reparación (IRR, EPOR/CD131) sin afectar al recuento de glóbulos rojos. Reduce la neuroinflamación y alivia el dolor neuropático periférico en investigación (Brines, 2008, PNAS).',
      contra: 'Hipersensibilidad a ARA-290 o eritropoyetina; embarazo/lactancia y menores (sin datos); insuficiencia renal o hepática grave; trastornos hematológicos preexistentes (monitorizar).',
      halfLife: '1 hora',
      freq: 'Diario o 3 veces/semana (SubQ)'
    },

    /* --- EJE GH Y SECRETAGOGOS --- */
    {
      name: 'Ipamorelina',
      school: {"mw": "711,85 g/mol", "formula": "C₃₈H₄₉N₉O₅", "status": "Investigación preclínica", "statusEn": "Preclinical research", "evidence": "En animales libera hormona de crecimiento de forma dosis-dependiente con menor elevación de cortisol y prolactina que otros secretagogos.", "keyPoints": ["Pentapéptido sintético que activa el receptor GHS-R1a de la ghrelina.", "Estimula la liberación pulsátil de hormona de crecimiento desde la hipófisis.", "Se considera uno de los secretagogos más selectivos."], "faq": [{"q": "¿Sustituye a la hormona de crecimiento?", "a": "No: estimula su liberación natural, no aporta hormona exógena."}, {"q": "¿Cuándo se administra?", "a": "En investigación suele pautarse antes de dormir o en ayunas, momentos de mayor pulso fisiológico."}], "en": {"evidence": "In animals it releases growth hormone dose-dependently with less cortisol and prolactin rise than other secretagogues.", "keyPoints": ["A synthetic pentapeptide that activates the ghrelin receptor GHS-R1a.", "It stimulates pulsatile growth hormone release from the pituitary.", "It is considered one of the more selective secretagogues."], "faq": [{"q": "Does it replace growth hormone?", "a": "No: it stimulates natural release rather than supplying exogenous hormone."}, {"q": "When is it given?", "a": "In research it is usually dosed before sleep or fasting, when the physiological pulse is highest."}], "mistakes": ["Taking it with or right after food when aiming for a fasting GH pulse.", "A single daily dose while expecting the effect of a split schedule.", "Confusing 200-300 mcg with 2-3 mg."]}, "mistakes": ["Tomarla con comida o justo después, cuando se busca el pulso de GH en ayunas.", "Una sola dosis al día esperando el efecto de una pauta dividida.", "Confundir 200-300 mcg con 2-3 mg."]},
      cat: 'Eje GH',
      vial: 5,
      bac: 2,
      dose: 200,
      unit: 'mcg',
      desc: 'Pentapéptido selectivo del receptor de ghrelina (GHS-R1a, secuencia Aib-His-D-2-Nal-D-Phe-Lys): estimula la liberación pulsátil de GH sin elevar ACTH, cortisol, prolactina ni apetito, a diferencia de los secretagogos clásicos (Raun, 1998). De unión limpia, es el GHRP de referencia para combinar con CJC-1295 sin DAC.',
      contra: 'Cáncer activo (cautela con antecedente oncológico); embarazo/lactancia; menores/placas de crecimiento abiertas; hipersensibilidad; diabetes mal controlada; apnea del sueño grave no tratada.',
      halfLife: '2 horas',
      freq: '1 a 2 veces al día antes de dormir (SubQ)'
    },
    {
      name: 'CJC-1295 (sin DAC / Mod-GRF 1-29)',
      school: {"mw": "3367,97 g/mol", "formula": "C₁₅₂H₂₅₂N₄₄O₄₂", "status": "Investigación preclínica", "statusEn": "Preclinical research", "evidence": "Aumenta los niveles de GH e IGF-1 en estudios pequeños; su semivida corta exige administración frecuente.", "keyPoints": ["Análogo de la GHRH de 29 aminoácidos modificado para resistir la degradación.", "Actúa sobre la hipófisis amplificando la liberación de hormona de crecimiento.", "Sin la molécula DAC su acción dura horas, no días."], "faq": [{"q": "¿Qué diferencia hay con la versión con DAC?", "a": "La versión con DAC se une a albúmina y dura días; la versión sin DAC es más fisiológica pero más corta."}, {"q": "¿Se usa solo?", "a": "En investigación suele combinarse con un secretagogo como ipamorelina para sumar los dos mecanismos."}], "en": {"evidence": "It raises GH and IGF-1 levels in small studies; its short half-life requires frequent dosing.", "keyPoints": ["A 29-amino-acid GHRH analogue modified to resist degradation.", "It acts on the pituitary to amplify growth hormone release.", "Without the DAC moiety its effect lasts hours, not days."], "faq": [{"q": "How does it differ from the DAC version?", "a": "The DAC version binds albumin and lasts days; the non-DAC version is more physiological but shorter."}, {"q": "Is it used alone?", "a": "In research it is often combined with a secretagogue such as ipamorelin to add both mechanisms."}], "mistakes": ["Injecting once a week despite its short half-life.", "Treating it as if it were the DAC version.", "Expecting high IGF-1 at two weeks."]}, "mistakes": ["Pincharla una vez por semana pese a su semivida corta.", "Tratarla como si fuera la versión con DAC.", "Esperar el IGF-1 alto a las dos semanas."]},
      cat: 'Eje GH',
      vial: 5,
      bac: 2.5,
      dose: 100,
      unit: 'mcg',
      desc: 'Análogo de GHRH de 29 aminoácidos (Mod-GRF 1-29) sin el enlazador de albúmina de la versión DAC: varias sustituciones de aminoácidos lo estabilizan sin alargar su vida. Libera GH en pulsos fisiológicos y, combinado con Ipamorelina, logra una liberación multiplicativa (Ionescu y Frohman, 2006).',
      contra: 'Cáncer activo (eje GH/IGF-1); hipersensibilidad; embarazo/lactancia; tumores intracraneales/hipofisarios; diabetes mal controlada; insuficiencia hepática o renal grave.',
      halfLife: '30 minutos',
      freq: '1 a 3 veces al día junto con Ipamorelina'
    },
    {
      name: 'CJC-1295 con DAC',
      school: {"mw": "≈ 3,6 kDa", "formula": "—", "status": "Investigación preclínica", "statusEn": "Preclinical research", "evidence": "La modificación DAC prolonga la exposición a GH e IGF-1 durante días, pero también puede producir elevaciones sostenidas fuera del patrón pulsátil.", "keyPoints": ["GHRH modificada con un grupo maleimida que se une covalentemente a la albúmina.", "Esta unión prolonga su presencia en sangre hasta aproximadamente una semana.", "Se investiga por su efecto sostenido sobre IGF-1."], "faq": [{"q": "¿Por qué se llama «con DAC»?", "a": "Por el Drug Affinity Complex: el grupo que se ancla a la albúmina y retrasa su eliminación."}, {"q": "¿Es mejor que la versión corta?", "a": "No necesariamente: la exposición continua puede desensibilizar el eje y no imita los pulsos naturales."}], "en": {"evidence": "The DAC modification extends GH and IGF-1 exposure over days but can produce sustained levels outside the pulsatile pattern.", "keyPoints": ["GHRH modified with a maleimide group that binds covalently to albumin.", "This binding keeps it in circulation for roughly a week.", "It is studied for its sustained effect on IGF-1."], "faq": [{"q": "Why 'with DAC'?", "a": "From Drug Affinity Complex: the group that anchors to albumin and delays clearance."}, {"q": "Is it better than the short version?", "a": "Not necessarily: continuous exposure may desensitise the axis and does not mimic natural pulses."}], "mistakes": ["Using it daily when albumin binding keeps it active for a week.", "Combining it with a GHRP at full doses and without breaks.", "Ignoring that continuous exposure does not mimic natural pulses."]}, "mistakes": ["Usarla a diario cuando su unión a albúmina la mantiene una semana.", "Combinarla con un GHRP a dosis plenas y sin descanso.", "Ignorar que la exposición continua no imita los pulsos naturales."]},
      cat: 'Eje GH',
      vial: 5,
      bac: 2,
      dose: 2.0,
      unit: 'mg',
      desc: 'Análogo de GHRH de 30 aminoácidos con el complejo de afinidad por fármacos (DAC): un enlazador lo ancla a la albúmina de la sangre y mantiene GH e IGF-1 elevados de forma continua durante días, frente a los minutos del péptido natural (Jetté, 2005). Es la versión de acción prolongada de la familia.',
      contra: 'Cáncer activo o sospechado (tumores sensibles a GH/IGF-1); hipersensibilidad; embarazo/lactancia; diabetes o intolerancia a la glucosa; acromegalia/exceso de GH; niños con placas de crecimiento abiertas.',
      halfLife: '6 a 8 días',
      freq: '1 a 2 veces por semana (SubQ)'
    },
    {
      name: 'Tesamorelina (Egrifta)',
      school: {"mw": "≈ 5,1 kDa", "formula": "—", "status": "Aprobado por FDA (lipodistrofia VIH)", "statusEn": "FDA approved (HIV lipodystrophy)", "evidence": "Aprobada en 2010 para reducir grasa visceral en lipodistrofia asociada al VIH; los estudios en personas sin VIH son limitados.", "keyPoints": ["Análogo de la GHRH de 44 aminoácidos.", "Estimula la producción de GH y la liberación de ácidos grasos.", "Su indicación aprobada es muy concreta y requiere receta."], "faq": [{"q": "¿Sirve para adelgazar en general?", "a": "No está aprobada para eso; su indicación es la lipodistrofia en pacientes con VIH."}, {"q": "¿Qué efectos vigilar?", "a": "Retención de líquidos, dolor articular y posible aumento de IGF-1."}], "en": {"evidence": "Approved in 2010 to reduce visceral fat in HIV-associated lipodystrophy; studies in people without HIV are limited.", "keyPoints": ["A 44-amino-acid GHRH analogue.", "It stimulates GH production and fatty-acid release.", "Its approved indication is narrow and prescription-only."], "faq": [{"q": "Is it for general weight loss?", "a": "It is not approved for that; its indication is lipodystrophy in patients with HIV."}, {"q": "What should be monitored?", "a": "Fluid retention, joint pain and possible IGF-1 elevation."}], "mistakes": ["Using it for fat loss without lipodystrophy.", "Escalating to high doses without monitoring IGF-1.", "Ignoring fluid retention and joint pain."]}, "mistakes": ["Usarla para perder grasa sin lipodistrofia.", "Subir a dosis altas sin controlar el IGF-1.", "Ignorar la retención de líquidos y el dolor articular."]},
      cat: 'Eje GH',
      vial: 10,
      bac: 2,
      dose: 1.0,
      unit: 'mg',
      desc: 'Análogo de GHRH(1-44) de 44 aminoácidos estabilizado con un grupo hexenoilo en la Tyr1 N-terminal, que lo protege de la degradación rápida. Aprobado por la FDA (Egrifta) para reducir selectivamente el tejido adiposo visceral en lipodistrofia por VIH sin inducir hiperglucemia severa; herramienta clásica del eje GH (Ferdinandi, 2007).',
      contra: 'Aprobado solo en lipodistrofia por VIH (no para pérdida de peso). Embarazo; neoplasia maligna activa; alteración del eje hipotálamo-hipofisario (tumor, hipofisectomía, irradiación craneal); hipersensibilidad.',
      halfLife: '2 horas',
      freq: '1 vez al día antes de dormir (SubQ)'
    },
    {
      name: 'Sermorelina (GHRH 1-29)',
      school: {"mw": "3357,9 g/mol", "formula": "C₁₄₉H₂₄₆N₄₄O₄₂S", "status": "Investigación activa", "statusEn": "Active research", "evidence": "Estudios pequeños muestran aumento de GH e IGF-1; se ha usado como prueba de reserva hipofisaria y en investigación sobre composición corporal.", "keyPoints": ["Fragmento de 29 aminoácidos de la GHRH humana.", "Conserva la capacidad de estimular la hipófisis sin la cola larga de la hormona completa.", "Su semivida es corta, de minutos a pocas horas."], "faq": [{"q": "¿Es lo mismo que CJC-1295 sin DAC?", "a": "Muy parecido: ambos son GHRH 1-29 modificada; cambian detalles de estabilidad y presentación."}, {"q": "¿Necesita receta?", "a": "En la mayoría de países no está aprobada como medicamento y se vende como producto de investigación."}], "en": {"evidence": "Small studies show rises in GH and IGF-1; it has been used to test pituitary reserve and in body-composition research.", "keyPoints": ["A 29-amino-acid fragment of human GHRH.", "It keeps the pituitary-stimulating capacity without the full hormone's long tail.", "Its half-life is short, from minutes to a few hours."], "faq": [{"q": "Is it the same as CJC-1295 without DAC?", "a": "Very similar: both are modified GHRH 1-29; stability and presentation details differ."}, {"q": "Does it need a prescription?", "a": "In most countries it is not approved as a medicine and is sold as a research product."}], "mistakes": ["Injecting at night expecting a bigger peak.", "Not respecting the pre-dose fast.", "Judging results at one month when body-composition changes take longer."]}, "mistakes": ["Pincharla por la noche esperando un pico mayor.", "No respetar el ayuno previo.", "Evaluar resultados al mes, cuando los cambios de composición tardan más."]},
      cat: 'Eje GH',
      vial: 5,
      bac: 2,
      dose: 300,
      unit: 'mcg',
      desc: 'Fragmento funcional de 29 aminoácidos del extremo N-terminal de la GHRH endógena: restaura la secreción pulsátil fisiológica de la hipófisis actuando sobre el receptor de GHRH y la vía AMPc/PKA (Prakash y Goa, 1999). La forma más parecida a la señal natural de la hormona del crecimiento.',
      contra: 'Hipersensibilidad; cáncer o neoplasia activa; tumores/lesiones intracraneales (hipofisarias); insuficiencia hepática o renal grave; embarazo/lactancia; hipotiroidismo no tratado (anula respuesta).',
      halfLife: '12 minutos',
      freq: 'Diario antes de acostarse (SubQ)'
    },
    {
      name: 'GHRP-2 (Pralmorelina)',
      school: {"mw": "817,98 g/mol", "formula": "C₄₅H₅₅N₉O₆", "status": "Aprobado solo en Japón como diagnóstico", "statusEn": "Japan only, diagnostic use", "evidence": "Aumenta GH de forma marcada en pruebas de provocación; su uso como tratamiento no está aprobado en Europa ni EE. UU.", "keyPoints": ["Hexapéptido sintético que activa el receptor GHS-R1a.", "Provoca un pico de GH y también eleva ligeramente cortisol y prolactina.", "En Japón se usa como agente diagnóstico de la secreción de GH."], "faq": [{"q": "¿Es un tratamiento?", "a": "No en Occidente: su única aprobación es diagnóstica y en Japón."}, {"q": "¿Por qué eleva el apetito?", "a": "Porque activa la vía de la ghrelina, que además de liberar GH estimula el hambre."}], "en": {"evidence": "It markedly raises GH in provocation tests; its use as a treatment is not approved in Europe or the US.", "keyPoints": ["A synthetic hexapeptide that activates the GHS-R1a receptor.", "It triggers a GH spike and also mildly raises cortisol and prolactin.", "In Japan it is used as a diagnostic agent for GH secretion."], "faq": [{"q": "Is it a treatment?", "a": "Not in the West: its only approval is diagnostic and in Japan."}, {"q": "Why does it increase appetite?", "a": "Because it activates the ghrelin pathway, which releases GH and also stimulates hunger."}], "mistakes": ["Using 300 mcg daily and raising prolactin and cortisol.", "Eating right after the injection.", "Stacking it with another GHRP to 'add up'."]}, "mistakes": ["Usar 300 mcg diarios y elevar prolactina y cortisol.", "Comer justo después del pinchazo.", "Apilarlo con otro GHRP por «sumar»."]},
      cat: 'Eje GH',
      vial: 5,
      bac: 2.5,
      dose: 150,
      unit: 'mcg',
      desc: 'Hexapéptido sintético (pralmorelina, secuencia D-Ala-D-2-Nal-Ala-Trp-D-Phe-Lys): secretagogo de GH de primera generación sobre el receptor de ghrelina, con leve elevación de prolactina y cortisol. Clase definida por los trabajos de relación estructura-actividad de Bowers (1993).',
      contra: 'Cáncer activo; tumores hipofisarios o lesiones hipotalámicas; retinopatía diabética proliferativa; diabetes mal controlada; acromegalia; embarazo/lactancia; hipersensibilidad a GHRP.',
      halfLife: '2.5 horas',
      freq: '1 a 2 veces al día (SubQ)'
    },
    {
      name: 'Hexarelina',
      school: {"mw": "887,04 g/mol", "formula": "C₄₇H₅₈N₁₂O₆", "status": "Investigación preclínica", "statusEn": "Preclinical research", "evidence": "Potente liberador de GH en modelos animales, con estudios muy limitados en humanos y señales de efectos cardíacos.", "keyPoints": ["Hexapéptido sintético de la familia GHRP.", "Actúa como agonista del receptor GHS-R1a con gran potencia.", "Se ha estudiado también por efectos sobre el músculo cardíaco."], "faq": [{"q": "¿Es más potente que GHRP-6?", "a": "En algunos modelos sí, pero la potencia no equivale a mejor perfil de seguridad."}, {"q": "¿Está aprobada?", "a": "No; es un compuesto de investigación."}], "en": {"evidence": "A potent GH releaser in animal models, with very limited human studies and signals of cardiac effects.", "keyPoints": ["A synthetic hexapeptide of the GHRP family.", "It acts as a highly potent GHS-R1a agonist.", "It has also been studied for effects on cardiac muscle."], "faq": [{"q": "Is it stronger than GHRP-6?", "a": "In some models yes, but potency does not mean a better safety profile."}, {"q": "Is it approved?", "a": "No; it is a research compound."}], "mistakes": ["Using it daily because of its potency.", "Ignoring cardiac signals described in animals.", "Combining it with GHRP-6 without lowering the dose."]}, "mistakes": ["Usarla a diario por su potencia.", "Ignorar las señales cardíacas descritas en animales.", "Combinarla con GHRP-6 sin reducir la dosis."]},
      cat: 'Eje GH',
      vial: 5,
      bac: 2,
      dose: 100,
      unit: 'mcg',
      desc: 'Derivado metilado del GHRP-6 y secretagogo de GH más potente de la familia: además del receptor de ghrelina se une a CD36 en el tejido cardíaco y vascular, motivo de su literatura de cardioprotección directa independiente de GH (Mao, 2014). También llamada examorelina.',
      contra: 'Cáncer activo/antecedentes; embarazo/lactancia; diabetes no controlada; hipersensibilidad a péptidos; túnel carpiano (precaución).',
      halfLife: '1.5 horas',
      freq: '1 vez al día en ciclos de 4 a 8 semanas'
    },

    /* --- LONGEVIDAD Y MITOCONDRIAS --- */
    {
      name: 'Epitalon (Epitalamina)',
      school: {"mw": "390,35 g/mol", "formula": "C₁₄H₂₂N₄O₉", "status": "Solo investigación", "statusEn": "Research only", "evidence": "Los trabajos rusos describen aumentos de telomerasa y cambios en melatonina; no hay ensayos occidentales replicados.", "keyPoints": ["Tetrapéptido sintético (Ala-Glu-Asp-Gly) derivado de la epífisis.", "Se investiga por su posible efecto sobre la telomerasa y el ritmo circadiano.", "Su evidencia se apoya en estudios antiguos y de pequeño tamaño."], "faq": [{"q": "¿Alarga los telómeros?", "a": "Se ha descrito un aumento de actividad telomerasa en cultivos y estudios pequeños, pero no está demostrado que prolongue la vida."}, {"q": "¿Es un medicamento?", "a": "No; se vende como compuesto de investigación."}], "en": {"evidence": "Russian work describes telomerase increases and melatonin changes; there are no replicated Western trials.", "keyPoints": ["A synthetic tetrapeptide (Ala-Glu-Asp-Gly) derived from the pineal gland.", "It is studied for possible effects on telomerase and circadian rhythm.", "Its evidence rests on old, small studies."], "faq": [{"q": "Does it lengthen telomeres?", "a": "Increased telomerase activity has been reported in cells and small studies, but it is not shown to extend lifespan."}, {"q": "Is it a medicine?", "a": "No; it is sold as a research compound."}], "mistakes": ["Repeating ten-day cycles every month hoping to lengthen telomeres.", "Combining it with other peptides without data.", "Accepting old, unreplicated studies at face value."]}, "mistakes": ["Repetir ciclos de diez días cada mes esperando alargar los telómeros.", "Combinarlo con otros péptidos sin datos.", "Dar por buenos estudios antiguos no replicados."]},
      cat: 'Longevidad',
      vial: 10,
      bac: 2,
      dose: 5.0,
      unit: 'mg',
      desc: 'Tetrapéptido biorregulador Ala-Glu-Asp-Gly (AEDG, el péptido de Khavinson): estimula la elongación telomérica reactivando la telomerasa y sincroniza los ritmos circadianos vía señalización pineal; décadas de investigación celular sobre envejecimiento (Khavinson, 2003).',
      contra: 'Cáncer activo o antecedentes (activación de telomerasa); embarazo/lactancia; niños y adolescentes; hipersensibilidad a péptidos; enfermedad hormono-sensible; cribado oncológico previo recomendado.',
      halfLife: 'Corta (rápida absorción)',
      freq: 'Ciclos de 10 a 20 días al año (SubQ o nasal)'
    },
    {
      name: 'GHK-Cu (Péptido de Cobre)',
      school: {"mw": "403,93 g/mol", "formula": "C₁₄H₂₄CuN₆O₄", "status": "Estudios clínicos en cosmética", "statusEn": "Clinical studies in cosmetics", "evidence": "Se ha estudiado en cicatrización y calidad de la piel; los ensayos son pequeños y la mayoría de productos son cosméticos, no medicamentos.", "keyPoints": ["Tripéptido Gly-His-Lys unido a un ion cobre.", "Modula colágeno, elastina y actividad antioxidante en la piel.", "Se usa sobre todo por vía tópica en formulaciones cosméticas."], "faq": [{"q": "¿Es un fármaco?", "a": "No está aprobado como medicamento; se emplea como principio cosmético."}, {"q": "¿Puede irritar la piel?", "a": "El cobre libre puede irritar; conviene probar en una zona pequeña y evitar mezclar con ácidos fuertes."}], "en": {"evidence": "Studied for wound healing and skin quality; trials are small and most products are cosmetics, not medicines.", "keyPoints": ["A Gly-His-Lys tripeptide bound to a copper ion.", "It modulates collagen, elastin and antioxidant activity in skin.", "It is mainly used topically in cosmetic formulations."], "faq": [{"q": "Is it a drug?", "a": "It is not approved as a medicine; it is used as a cosmetic ingredient."}, {"q": "Can it irritate skin?", "a": "Free copper can irritate; patch-test first and avoid mixing with strong acids."}], "mistakes": ["Injecting a non-sterile cosmetic formula.", "Preparing topical products above 2% that irritate.", "Mixing it with vitamin C or strong acids."]}, "mistakes": ["Inyectar una fórmula cosmética no estéril.", "Preparar tópicos por encima del 2 % que irritan.", "Mezclarlo con vitamina C o ácidos fuertes."]},
      cat: 'Longevidad',
      vial: 50,
      bac: 3,
      dose: 1.5,
      unit: 'mg',
      desc: 'Tripéptido glicil-histidil-lisina unido a un átomo de cobre: regula más de 4.000 genes humanos y estimula colágeno dérmico, elastina, angiogénesis y remodelación de cicatrices. En investigación se usa como sonda de señalización celular y matriz extracelular (Pickart y Margolina, 2018).',
      contra: 'Enfermedad de Wilson o trastornos del cobre (absoluta); cáncer activo; embarazo/lactancia; alergia al cobre; terapia quelante; precaución en autoinmunidad, daño renal/hepático, menores.',
      halfLife: '1 hora',
      freq: 'Diario o en ciclos de 30 días (SubQ)'
    },
    {
      name: 'MOTS-c (Péptido Mitocondrial)',
      school: {"mw": "2174,66 g/mol", "formula": "C₁₀₁H₁₄₄N₃₀O₂₂S₂", "status": "Investigación preclínica", "statusEn": "Preclinical research", "evidence": "En ratones mejora la sensibilidad a la insulina y el rendimiento físico; los datos en humanos son muy preliminares.", "keyPoints": ["Péptido de 16 aminoácidos codificado en el ADN mitocondrial.", "Actúa como señal metabólica que activa AMPK y el metabolismo de la glucosa.", "Se investiga en envejecimiento y resistencia a la insulina."], "faq": [{"q": "¿Es un péptido «del ejercicio»?", "a": "Se le atribuye imitar parte de la respuesta metabólica al ejercicio, pero en humanos aún no está confirmado."}, {"q": "¿Hay presentación aprobada?", "a": "No; solo existe como producto de investigación."}], "en": {"evidence": "In mice it improves insulin sensitivity and exercise capacity; human data are very preliminary.", "keyPoints": ["A 16-amino-acid peptide encoded in mitochondrial DNA.", "It acts as a metabolic signal activating AMPK and glucose metabolism.", "It is studied in ageing and insulin resistance."], "faq": [{"q": "Is it an 'exercise peptide'?", "a": "It is credited with mimicking part of the metabolic response to exercise, but this is unconfirmed in humans."}, {"q": "Is there an approved product?", "a": "No; it exists only as a research product."}], "mistakes": ["Using it daily for months without cycling.", "Expecting an exercise effect without training.", "Extrapolating 10 mg mouse doses to humans."]}, "mistakes": ["Usarlo a diario durante meses sin ciclar.", "Esperar el efecto del ejercicio sin entrenar.", "Extrapolar 10 mg de dosis de ratón a humanos."]},
      cat: 'Longevidad',
      vial: 10,
      bac: 2,
      dose: 5.0,
      unit: 'mg',
      desc: 'Péptido de 16 aminoácidos codificado por el propio ADN mitocondrial (MRWQEMGYIFYPRKLR), una rareza entre los péptidos. Activa la vía AMPK en músculo esquelético, previene la resistencia a la insulina y emula parte de los beneficios del ejercicio (Lee, 2015); puente entre la mitocondria y el núcleo celular.',
      contra: 'Sin aprobación humana y sin datos de seguridad. Evitar: embarazo/lactancia, menores, hipersensibilidad; solo uso en investigación.',
      halfLife: 'Moderada',
      freq: '2 a 3 veces por semana (SubQ)'
    },
    {
      name: 'SS-31 (Elamipretida / Bendavia)',
      school: {"mw": "639,8 g/mol", "formula": "C₃₂H₄₉N₉O₅", "status": "Aprobado por FDA (Forzinity, 2025) para síndrome de Barth", "statusEn": "FDA approved (Forzinity, 2025) for Barth syndrome", "evidence": "Recibió aprobación acelerada en septiembre de 2025 para mejorar la fuerza muscular en el síndrome de Barth; en otras indicaciones los resultados han sido menos consistentes.", "keyPoints": ["Tetrapéptido dirigido a la cardiolipina de la membrana mitocondrial interna.", "Estabiliza la cadena respiratoria y reduce la producción de radicales libres.", "Su indicación aprobada es una enfermedad ultrarrara, no el uso general antienvejecimiento."], "faq": [{"q": "¿Puedo usarla para longevidad?", "a": "No está aprobada para eso; su única indicación autorizada es el síndrome de Barth."}, {"q": "¿Cómo se administra?", "a": "En la ficha aprobada es inyección subcutánea de 40 mg una vez al día."}], "en": {"evidence": "It received accelerated approval in September 2025 to improve muscle strength in Barth syndrome; results in other indications have been less consistent.", "keyPoints": ["A tetrapeptide that targets cardiolipin in the inner mitochondrial membrane.", "It stabilises the respiratory chain and lowers free-radical production.", "Its approved indication is an ultra-rare disease, not general anti-ageing use."], "faq": [{"q": "Can I use it for longevity?", "a": "It is not approved for that; its only authorised indication is Barth syndrome."}, {"q": "How is it given?", "a": "The approved label is a 40 mg subcutaneous injection once daily."}], "mistakes": ["Using it as an anti-ageing agent when it is only approved for Barth syndrome.", "Copying the trial's 40 mg daily without an indication.", "Ignoring that it is a prescription medicine."]}, "mistakes": ["Usarlo como antienvejecimiento cuando solo está aprobado para el síndrome de Barth.", "Copiar los 40 mg diarios del ensayo sin indicación.", "Ignorar que es un medicamento de prescripción."]},
      cat: 'Longevidad',
      vial: 50,
      bac: 2.5,
      dose: 2.0,
      unit: 'mg',
      desc: 'Tetrapéptido aromático-catiónico (D-Arg-Dmt-Lys-Phe) dirigido a la membrana mitocondrial interna: se une a la cardiolipina, restaura la producción de ATP y reduce radicales libres (Birk, 2013). Herramienta de referencia en bioenergética y longevidad celular. Sinónimos: elamipretida, MTP-131, Bendavia.',
      contra: 'Embarazo/lactancia (sin datos); alteraciones graves de conducción cardíaca; insuficiencia renal o hepática grave; <18 años; otros agentes cardiotóxicos/mitocondriales (teórico).',
      halfLife: '2 horas',
      freq: 'Diario o 3 veces por semana (SubQ)'
    },
    {
      name: 'Humanina',
      school: {"mw": "≈ 1,5 kDa", "formula": "—", "status": "Investigación preclínica", "statusEn": "Preclinical research", "evidence": "En modelos animales protege neuronas y mejora la función mitocondrial; no hay ensayos clínicos sólidos en humanos.", "keyPoints": ["Péptido de 12 aminoácidos derivado de la región 5' del gen SHMOOSE.", "Se estudia por efectos neuroprotectores y sobre la señalización de IGF-1.", "Su nombre proviene de «humanin», descubierto en tejido cerebral humano."], "faq": [{"q": "¿Es una hormona?", "a": "Se comporta como un péptido señal con acciones locales y sistémicas, pero no es una hormona clásica."}, {"q": "¿Está disponible como fármaco?", "a": "No; es un compuesto de investigación."}], "en": {"evidence": "In animal models it protects neurons and improves mitochondrial function; there are no solid human trials.", "keyPoints": ["A 12-amino-acid peptide derived from the 5' region of the SHMOOSE gene.", "It is studied for neuroprotective effects and IGF-1 signalling.", "Its name comes from 'humanin', discovered in human brain tissue."], "faq": [{"q": "Is it a hormone?", "a": "It behaves as a signalling peptide with local and systemic actions, but it is not a classic hormone."}, {"q": "Is it available as a drug?", "a": "No; it is a research compound."}], "mistakes": ["Forum-invented doses with no safety data.", "Expecting an immediate cognitive effect.", "Combining it with other peptides on intuition."]}, "mistakes": ["Dosis inventadas en foros sin datos de seguridad.", "Esperar un efecto cognitivo inmediato.", "Combinarla con otros péptidos por intuición."]},
      cat: 'Longevidad',
      vial: 10,
      bac: 2,
      dose: 2.0,
      unit: 'mg',
      desc: 'Micro-péptido mitocondrial citoprotector. Inhibe la apoptosis celular bloqueando Bax, reduce la inflamación vascular y protege neuronas y células beta pancreáticas.',
      halfLife: 'Corta',
      freq: '2 a 3 veces por semana (SubQ)'
    },
    {
      name: 'NAD+ (Nicotinamida Adenina Dinucleótido)',
      school: {"mw": "663,43 g/mol", "formula": "C₂₁H₂₇N₇O₁₄P₂", "status": "Coenzima endógena; suplementos orales sin aprobación", "statusEn": "Endogenous coenzyme; oral supplements unapproved", "evidence": "Los precursores orales (NR, NMN) se han estudiado en ensayos pequeños con resultados modestos; la forma inyectable tiene datos humanos muy limitados.", "keyPoints": ["No es un péptido: es la molécula redox central del metabolismo.", "Es sustrato de sirtuinas y PARP, implicadas en reparación del ADN.", "Sus niveles descienden con la edad y en enfermedades metabólicas."], "faq": [{"q": "¿Tomarlo por vía oral funciona?", "a": "Se degrada en el intestino; los precursores como NR o NMN se usan para elevar sus niveles de forma indirecta."}, {"q": "¿Es seguro inyectarlo?", "a": "No hay datos sólidos de seguridad a largo plazo; la vía inyectable no está aprobada."}], "en": {"evidence": "Oral precursors (NR, NMN) have been studied in small trials with modest results; the injectable form has very limited human data.", "keyPoints": ["It is not a peptide: it is the central redox molecule of metabolism.", "It is a substrate for sirtuins and PARP, involved in DNA repair.", "Its levels decline with age and in metabolic disease."], "faq": [{"q": "Does oral NAD+ work?", "a": "It is broken down in the gut; precursors such as NR or NMN are used to raise levels indirectly."}, {"q": "Is injecting it safe?", "a": "There are no solid long-term safety data; the injectable route is not approved."}], "mistakes": ["Injecting a 500 mg bolus and feeling faint.", "Taking NMN or NR without measuring absorption.", "Expecting energy within 24 hours."]}, "mistakes": ["Inyectar 500 mg en bolo y marearse.", "Tomar NMN o NR sin medir lo que se absorbe.", "Esperar energía en 24 horas."]},
      cat: 'Longevidad',
      vial: 500,
      bac: 5,
      dose: 50,
      unit: 'mg',
      desc: 'Coenzima presente en todas las células que alterna entre NAD+ y NADH para transportar energía: sustrato esencial de las sirtuinas (SIRT1-7) y de las enzimas de reparación del ADN (PARP). Sus niveles caen con la edad y su relación con metabolismo y envejecimiento es un campo consolidado (Chini, 2021). No es un péptido: es la molécula redox central de la célula.',
      contra: 'Embarazo/lactancia; cáncer activo o avanzado (riesgo teórico); alergia a NAD+/niacina; psicosis o trastorno bipolar; hipotensión; insuficiencia renal/hepática; enfermedad cardiovascular.',
      halfLife: 'Corta',
      freq: '2 a 3 veces por semana (SubQ o IM lento)'
    },
    {
      name: 'Glutatión (GSH)',
      school: {"mw": "307,32 g/mol", "formula": "C₁₀H₁₇N₃O₆S", "status": "Endógeno; suplementos sin aprobación", "statusEn": "Endogenous; supplements unapproved", "evidence": "La evidencia es sólida para su papel antioxidante fisiológico, pero débil para la mayoría de usos estéticos o de longevidad.", "keyPoints": ["Tripéptido gamma-Glu-Cys-Gly con un enlace gamma-glutamilo atípico.", "Es el principal antioxidante intracelular y participa en la detoxificación hepática.", "Su forma oral se degrada en el tubo digestivo; se usan precursores como NAC."], "faq": [{"q": "¿Conviene inyectarlo?", "a": "No hay evidencia clara de que la vía inyectable aporte más que la oral o los precursores, y puede producir reacciones."}, {"q": "¿Quién debe evitarlo?", "a": "Personas con asma, alergia a sulfitos o en tratamiento con platino, entre otras precauciones."}], "en": {"evidence": "Evidence is solid for its physiological antioxidant role but weak for most cosmetic or longevity uses.", "keyPoints": ["A gamma-Glu-Cys-Gly tripeptide with an unusual gamma-glutamyl bond.", "It is the main intracellular antioxidant and supports liver detoxification.", "Oral glutathione is broken down in the gut; precursors such as NAC are used."], "faq": [{"q": "Is injecting it worthwhile?", "a": "There is no clear evidence that injection beats oral use or precursors, and it can cause reactions."}, {"q": "Who should avoid it?", "a": "People with asthma, sulfite allergy or platinum-based chemotherapy, among other precautions."}], "mistakes": ["Nebulising it without evidence.", "Injecting 600 mg weekly hoping to lighten skin.", "Using it during platinum-based chemotherapy."]}, "mistakes": ["Nebulizarlo sin evidencia.", "Pinchar 600 mg semanales esperando blanquear la piel.", "Usarlo durante quimioterapia con platino."]},
      cat: 'Longevidad',
      vial: 600,
      bac: 3,
      dose: 200,
      unit: 'mg',
      desc: 'Tripéptido gamma-Glu-Cys-Gly con un enlace gamma-glutamilo poco habitual: el antioxidante maestro celular. Alterna entre sus formas reducida (GSH) y oxidada para neutralizar especies reactivas de oxígeno, detoxificar xenobióticos hepáticos y sostener la función inmune (Forman, 2009). El tiol de referencia en investigación redox.',
      contra: 'Asma o hiperreactividad bronquial (broncoespasmo); embarazo/lactancia; alergia a sulfitos; quimioterapia con platino (reduce eficacia); inmunosupresores o anticoagulantes; menores (sin datos).',
      halfLife: '30 minutos',
      freq: '1 a 3 veces por semana (SubQ o IM)'
    },

    /* --- COGNICIÓN Y SISTEMA NERVIOSO --- */
    {
      name: 'Semax (Heptapéptido ACTH 4-10)',
      school: {"mw": "813,92 g/mol", "formula": "C₃₇H₅₁N₉O₁₀S", "status": "Aprobado en Rusia; investigación en Occidente", "statusEn": "Approved in Russia; research in the West", "evidence": "Los estudios rusos describen mejoras en atención y recuperación tras ictus; los ensayos independientes son escasos.", "keyPoints": ["Análogo del fragmento ACTH(4-10) con una cola Pro-Gly-Pro.", "Eleva BDNF y TrkB en el hipocampo sin activar la corteza suprarrenal.", "Se administra por vía intranasal por su paso a la nariz-cerebro."], "faq": [{"q": "¿Es un esteroide?", "a": "No: conserva la señal neurotrófica del ACTH sin el efecto hormonal de la molécula completa."}, {"q": "¿Produce dependencia?", "a": "No se ha descrito dependencia, pero faltan estudios de seguridad a largo plazo."}], "en": {"evidence": "Russian studies report gains in attention and recovery after stroke; independent trials are scarce.", "keyPoints": ["An ACTH(4-10) fragment analogue with a Pro-Gly-Pro tail.", "It raises hippocampal BDNF and TrkB without activating the adrenal cortex.", "It is given intranasally because of nose-to-brain transport."], "faq": [{"q": "Is it a steroid?", "a": "No: it keeps ACTH's neurotrophic signal without the full molecule's hormonal effect."}, {"q": "Is it addictive?", "a": "No dependence has been reported, but long-term safety studies are lacking."}], "mistakes": ["Using 1 mg intranasally daily, far above studied schedules.", "Applying it at night and disrupting sleep.", "Running it indefinitely without breaks."]}, "mistakes": ["Usar 1 mg intranasal diario, muy por encima de las pautas estudiadas.", "Aplicarlo por la noche y alterar el sueño.", "Mantenerlo indefinidamente sin descansos."]},
      cat: 'Cognición',
      vial: 10,
      bac: 2,
      dose: 500,
      unit: 'mcg',
      desc: 'Heptapéptido Met-Glu-His-Phe-Pro-Gly-Pro, análogo del fragmento ACTH(4-10) modificado con Pro-Gly-Pro para conservar la señal cerebral sin efectos hormonales. Eleva BDNF y TrkB en el hipocampo, optimizando la memoria de trabajo y la neuroplasticidad (Dolotov, 2006).',
      contra: 'Embarazo/lactancia; hipersensibilidad; menores de 18; psicosis aguda; epilepsia/convulsiones (precaución); enfermedad cardiovascular; interacción con ISRS, psicoestimulantes y antihipertensivos.',
      halfLife: 'Corta (amplia duración cerebral)',
      freq: 'Diario matutino (Intranasal o SubQ)'
    },
    {
      name: 'Selank (Tuftsina sintética)',
      school: {"mw": "751,90 g/mol", "formula": "C₃₃H₅₇N₁₁O₉", "status": "Aprobado en Rusia; investigación en Occidente", "statusEn": "Approved in Russia; research in the West", "evidence": "Estudios pequeños sugieren reducción de ansiedad sin sedación; la calidad metodológica es limitada.", "keyPoints": ["Heptapéptido derivado de la tuftsina con una cola Pro-Gly.", "Modula GABA-A y citocinas inflamatorias como la IL-6.", "Se investiga como ansiolítico sin efecto sedante."], "faq": [{"q": "¿Sustituye a un ansiolítico?", "a": "No; su evidencia es preliminar y no sustituye un tratamiento pautado."}, {"q": "¿Da somnolencia?", "a": "En los estudios rusos no se describe sedación relevante, a diferencia de las benzodiacepinas."}], "en": {"evidence": "Small studies suggest anxiety reduction without sedation; methodological quality is limited.", "keyPoints": ["A tuftsin-derived heptapeptide with a Pro-Gly tail.", "It modulates GABA-A and inflammatory cytokines such as IL-6.", "It is studied as an anxiolytic without sedative effect."], "faq": [{"q": "Does it replace an anxiolytic?", "a": "No; its evidence is preliminary and it does not replace prescribed treatment."}, {"q": "Does it cause drowsiness?", "a": "Russian studies report no relevant sedation, unlike benzodiazepines."}], "mistakes": ["Combining it with benzodiazepines without adjustment.", "Expecting an immediate anxiolytic effect.", "Continuous daily use without cycles."]}, "mistakes": ["Combinarlo con benzodiacepinas sin ajustar.", "Esperar efecto ansiolítico inmediato.", "Uso diario continuo sin ciclos."]},
      cat: 'Cognición',
      vial: 10,
      bac: 2,
      dose: 300,
      unit: 'mcg',
      desc: 'Heptapéptido TKPRPGP derivado de la tuftsina inmunitaria con cola Pro-Gly añadida: regula la expresión de interleucina-6 y modula los receptores GABA-A, proporcionando ansiólisis limpia sin sedación ni adicción. Desarrollado en la Academia de Ciencias rusa como modulador de estrés e inmunidad.',
      contra: 'Sin contraindicaciones absolutas. Evitar embarazo/lactancia y menores (sin datos); hipersensibilidad; precaución con benzodiacepinas (potenciación) y en autoinmunidad (inmunomodulador).',
      halfLife: 'Corta',
      freq: '1 a 2 veces al día (Intranasal o SubQ)'
    },
    {
      name: 'Dihexa (N-hexanoic-Tyr-Ile)',
      school: {"mw": "≈ 407 g/mol", "formula": "—", "status": "Investigación preclínica", "statusEn": "Preclinical research", "evidence": "En ratones con Alzheimer experimental mejoró la memoria y la sinaptogénesis; no hay ensayos en humanos.", "keyPoints": ["Peptidomimético estable derivado de la angiotensina IV.", "Activa la señalización HGF/c-Met y la formación de nuevas conexiones neuronales.", "Su pequeño tamaño le permite atravesar la barrera hematoencefálica."], "faq": [{"q": "¿Es un fármaco para la memoria?", "a": "No: solo hay datos preclínicos y su perfil de seguridad en humanos es desconocido."}, {"q": "¿Por qué preocupa el c-Met?", "a": "Porque es una vía implicada en proliferación celular; en cáncer activo sería una precaución."}], "en": {"evidence": "In mice with experimental Alzheimer's it improved memory and synaptogenesis; there are no human trials.", "keyPoints": ["A stable peptidomimetic derived from angiotensin IV.", "It activates HGF/c-Met signalling and new neural connections.", "Its small size lets it cross the blood-brain barrier."], "faq": [{"q": "Is it a memory drug?", "a": "No: only preclinical data exist and its human safety profile is unknown."}, {"q": "Why the c-Met concern?", "a": "It is a pathway involved in cell proliferation; active cancer would be a precaution."}], "mistakes": ["10 mg doses seen in forums.", "Using it without human safety data.", "Keeping it going chronically."]}, "mistakes": ["Dosis de 10 mg vistas en foros.", "Usarlo sin datos de seguridad humana.", "Mantenerlo de forma crónica."]},
      cat: 'Cognición',
      vial: 10,
      bac: 2,
      dose: 1.0,
      unit: 'mg',
      desc: 'Peptidomimético metabólicamente estable (hexanoilo-Tyr-Ile) análogo de la angiotensina IV: cruza la barrera hematoencefálica y activa la señalización HGF/c-Met, con efectos sobre memoria y sinaptogénesis descritos en ratones APP/PS1 (Sun, 2021). También llamado PNB-0408.',
      contra: 'Cáncer activo/antecedentes (vía c-Met oncogénica); embarazo/lactancia; <18 años; hepatopatía; precaución con IECA/ARA-II.',
      halfLife: 'Moderada',
      freq: '1 vez al día en ciclos'
    },
    {
      name: 'Oxitocina',
      school: {"mw": "1007,19 g/mol", "formula": "C₄₃H₆₆N₁₂O₁₂S₂", "status": "Medicamento aprobado", "statusEn": "Approved medicine", "evidence": "Aprobada para inducción del parto; en neurociencia social los resultados son prometedores pero inconsistentes.", "keyPoints": ["Nonapéptido cíclico con puente disulfuro.", "Actúa sobre el receptor OXTR acoplado a proteínas G.", "Participa en vínculo social, confianza y modulación del dolor."], "faq": [{"q": "¿Sirve para el autismo o la ansiedad social?", "a": "Los ensayos han dado resultados mixtos; no es un tratamiento aprobado para eso."}, {"q": "¿Se puede usar sin control?", "a": "Como medicamento tiene efectos uterinos y cardiovasculares; requiere supervisión."}], "en": {"evidence": "Approved for labour induction; social-neuroscience results are promising but inconsistent.", "keyPoints": ["A cyclic nonapeptide with a disulfide bridge.", "It acts on the G-protein-coupled OXTR receptor.", "It is involved in social bonding, trust and pain modulation."], "faq": [{"q": "Is it used for autism or social anxiety?", "a": "Trials have produced mixed results; it is not an approved treatment for these."}, {"q": "Can it be used unsupervised?", "a": "As a medicine it has uterine and cardiovascular effects and needs supervision."}], "mistakes": ["Making a nasal spray from the injectable ampoule.", "High doses hoping for 'more empathy'.", "Daily use without supervision."]}, "mistakes": ["Preparar spray nasal con la ampolla inyectable.", "Dosis altas esperando «más empatía».", "Uso diario sin control."]},
      cat: 'Cognición',
      vial: 5,
      bac: 2,
      dose: 100,
      unit: 'mcg',
      desc: 'Nonapéptido de nueve residuos cerrado en anillo por un puente disulfuro: la primera hormona polipeptídica secuenciada y sintetizada, trabajo que valió el Nobel de Química de 1955 a du Vigneaud. Se estudia por su receptor OXTR, acoplado a proteínas G, en neurociencia social, apego y modulación del dolor (Gimpl y Fahrenholz, 2001).',
      contra: 'Sufrimiento fetal/desproporción cefalopélvica; ≥2 cesáreas previas; placenta previa; presentación anómala; prolapso de cordón; hipertonía uterina; hipersensibilidad.',
      halfLife: '5 minutos (efectos centrales prolongados)',
      freq: 'A demanda o diario (Intranasal o SubQ)'
    },

    /* --- INMUNIDAD --- */
    {
      name: 'Timosina Alfa-1 (Ta1 / Zadaxin)',
      school: {"mw": "3108,30 g/mol", "formula": "C₁₂₉H₂₁₅N₃₃O₅₅", "status": "Aprobado en varios países asiáticos y europeos", "statusEn": "Approved in several Asian and European countries", "evidence": "Ensayos pequeños muestran mejoría en subconjuntos de células T; su uso en inmunoterapia sigue siendo objeto de debate.", "keyPoints": ["Péptido tímico acetilado de 28 aminoácidos.", "Favorece la maduración de linfocitos T CD4+ y CD8+ y la actividad de células NK.", "Se usa en algunos países como inmunomodulador adyuvante."], "faq": [{"q": "¿Es un antiviral?", "a": "No directamente; modula la respuesta inmune y se ha estudiado como adyuvante en infecciones crónicas."}, {"q": "¿Puede empeorar una autoinmunidad?", "a": "Es una precaución teórica por su efecto inmunoestimulante."}], "en": {"evidence": "Small trials show improvement in T-cell subsets; its role in immunotherapy remains debated.", "keyPoints": ["An acetylated 28-amino-acid thymic peptide.", "It supports CD4+ and CD8+ T-cell maturation and NK-cell activity.", "Some countries use it as an adjuvant immunomodulator."], "faq": [{"q": "Is it an antiviral?", "a": "Not directly; it modulates the immune response and has been studied as an adjuvant in chronic infections."}, {"q": "Can it worsen autoimmunity?", "a": "That is a theoretical precaution because of its immune-stimulating effect."}], "mistakes": ["Using it in active autoimmune disease.", "Injecting daily instead of twice weekly.", "Expecting an antiviral effect in an acute infection."]}, "mistakes": ["Usarla en enfermedad autoinmune activa.", "Pincharla a diario en vez de dos veces por semana.", "Esperar efecto antiviral en una infección aguda."]},
      cat: 'Inmunidad',
      vial: 5,
      bac: 2,
      dose: 1.5,
      unit: 'mg',
      desc: 'Péptido tímico acetilado de 28 aminoácidos, sección inicial de la protimosina alfa: aislada y secuenciada del tejido tímico de ternera (Goldstein, 1977), no diseñada desde cero. Aumenta la maduración de células T CD4+ y CD8+ y activa células NK; respuestas Th1 frente a infecciones crónicas.',
      contra: 'Hipersensibilidad; embarazo/lactancia (datos limitados); enfermedad autoinmune activa (riesgo de exacerbación); trasplantados con inmunosupresores; inmunodeficiencia grave.',
      halfLife: '2 horas',
      freq: '2 veces por semana (SubQ)'
    },
    {
      name: 'LL-37 (Catelicidina)',
      school: {"mw": "4493,33 g/mol", "formula": "C₂₀₅H₃₄₀N₆₀O₅₃", "status": "Uso exclusivo en investigación", "statusEn": "Research use only", "evidence": "Tiene actividad antimicrobiana y moduladora de la inmunidad en laboratorio; los ensayos clínicos son muy limitados.", "keyPoints": ["Los 37 aminoácidos de la única catelicidina humana.", "Permeabiliza membranas bacterianas y neutraliza endotoxinas.", "Participa en la cicatrización y en la respuesta inmune innata."], "faq": [{"q": "¿Es un antibiótico?", "a": "No es un antibiótico comercial: es un péptido antimicrobiano endógeno estudiado en investigación."}, {"q": "¿Por qué se relaciona con la psoriasis?", "a": "Porque niveles altos de LL-37 se asocian a inflamación Th17 y a brotes de psoriasis."}], "en": {"evidence": "It has antimicrobial and immune-modulating activity in the lab; clinical trials are very limited.", "keyPoints": ["The 37 amino acids of the only human cathelicidin.", "It permeabilises bacterial membranes and neutralises endotoxins.", "It participates in wound healing and innate immunity."], "faq": [{"q": "Is it an antibiotic?", "a": "It is not a commercial antibiotic: it is an endogenous antimicrobial peptide studied in research."}, {"q": "Why is it linked to psoriasis?", "a": "High LL-37 levels are associated with Th17 inflammation and psoriasis flares."}], "mistakes": ["Applying it in psoriasis, where it can worsen.", "High systemic doses without data.", "Expecting it to replace an antibiotic."]}, "mistakes": ["Aplicarla en psoriasis, donde puede empeorar.", "Dosis sistémicas altas sin datos.", "Esperar que sustituya a un antibiótico."]},
      cat: 'Inmunidad',
      vial: 5,
      bac: 2.5,
      dose: 100,
      unit: 'mcg',
      desc: 'Secuencia LLGDFFRKSKEKIGKEFKRIVQRIKDFLRNLVPRTES: los 37 aminoácidos de la única catelicidina humana. Altera la permeabilidad de las membranas bacterianas gram-positivas y gram-negativas, neutraliza endotoxinas (LPS) y participa en la cicatrización de heridas; molécula de referencia de la inmunidad innata (Dürr, 2006).',
      contra: 'Psoriasis/artritis psoriásica, otras autoinmunidades Th17 y LES (puede exacerbar); embarazo/lactancia (sin datos); cáncer activo (angiogénico; datos contradictorios); inmunosupresión.',
      halfLife: 'Corta',
      freq: 'Protocolos específicos de investigación'
    },

    /* --- SALUD SEXUAL Y PIGMENTACIÓN --- */
    {
      name: 'PT-141 (Bremelanotida / Vyleesi)',
      school: {"mw": "1025,2 g/mol", "formula": "C₅₀H₆₈N₁₄O₁₀", "status": "Aprobado por FDA (Vyleesi, 2019)", "statusEn": "FDA approved (Vyleesi, 2019)", "evidence": "Aprobada para el deseo sexual hipoactivo en mujeres premenopáusicas; en hombres se usa fuera de indicación con datos más limitados.", "keyPoints": ["Heptapéptido cíclico agonista de MC3R y MC4R en el hipotálamo.", "Actúa por vía central, no por efecto vascular directo.", "Se administra a demanda, unos 45 minutos antes."], "faq": [{"q": "¿Es como la viagra?", "a": "No: la viagra actúa sobre el flujo sanguíneo; la bremelanotida actúa sobre receptores cerebrales del deseo."}, {"q": "¿Qué efectos secundarios tiene?", "a": "Náuseas, rubor, cefalea y elevación transitoria de la presión arterial."}], "en": {"evidence": "Approved for hypoactive sexual desire in premenopausal women; male use is off-label with more limited data.", "keyPoints": ["A cyclic heptapeptide agonist of MC3R and MC4R in the hypothalamus.", "It works centrally, not through a direct vascular effect.", "It is taken on demand, about 45 minutes before."], "faq": [{"q": "Is it like Viagra?", "a": "No: Viagra acts on blood flow; bremelanotide acts on brain desire receptors."}, {"q": "What side effects does it have?", "a": "Nausea, flushing, headache and a transient rise in blood pressure."}], "mistakes": ["Using it daily when it is on-demand.", "Ignoring high blood pressure.", "Confusing 1.75 mg with the vial's 10 mg."]}, "mistakes": ["Usarla a diario cuando es a demanda.", "Ignorar la presión arterial alta.", "Confundir 1,75 mg con los 10 mg del vial."]},
      cat: 'Sexual',
      vial: 10,
      bac: 2,
      dose: 1.75,
      unit: 'mg',
      desc: 'Heptapéptido cíclico por puente lactámico (con Nle4 y D-Phe7) agonista de los receptores MC3R y MC4R en el hipotálamo: estimula el deseo sexual y la función eréctil por vía central, distinguiéndose de los fármacos vasculares. Sonda clásica de farmacología de melanocortina (Molinoff, 2003); comercializado como bremelanotida.',
      contra: 'HTA no controlada; enfermedad cardiovascular conocida o riesgo CV alto (contraindicación de ficha); embarazo/lactancia; hipersensibilidad; vigilar elevación transitoria de PA y oscurecimiento de nevos.',
      halfLife: '2.7 horas',
      freq: 'A demanda 45-60 min antes (SubQ)'
    },
    {
      name: 'Melanotan II (MT-2)',
      school: {"mw": "1024,18 g/mol", "formula": "C₅₀H₆₉N₁₅O₉", "status": "Solo investigación; no aprobado", "statusEn": "Research only; not approved", "evidence": "Se usa de forma no regulada para bronceado; los datos de seguridad a largo plazo son inexistentes y se han descrito lesiones pigmentarias.", "keyPoints": ["Análogo sintético de la α-MSH que activa los receptores MC1R y MC4R.", "Estimula la producción de melanina y puede aumentar el deseo sexual.", "No tiene aprobación regulatoria en ningún país occidental."], "faq": [{"q": "¿Es seguro para broncearse?", "a": "No hay control de calidad ni datos de seguridad; se han notificado nevus nuevos y cambios pigmentarios."}, {"q": "¿Por qué se desaconseja?", "a": "Por la ausencia de garantías farmacéuticas y el riesgo de efectos hormonales y cardiovasculares."}], "en": {"evidence": "It is used unregulated for tanning; long-term safety data are absent and pigmentary lesions have been reported.", "keyPoints": ["A synthetic α-MSH analogue activating MC1R and MC4R.", "It stimulates melanin production and may increase sexual desire.", "It has no regulatory approval in any Western country."], "faq": [{"q": "Is it safe for tanning?", "a": "There is no quality control or safety data; new naevi and pigment changes have been reported."}, {"q": "Why is it discouraged?", "a": "Because of the lack of pharmaceutical guarantees and the risk of hormonal and cardiovascular effects."}], "mistakes": ["Loading 1 mg daily for weeks.", "Not cycling and keeping intense sun exposure.", "Ignoring new moles or pigment changes."]}, "mistakes": ["Cargar 1 mg diario durante semanas.", "No ciclar y mantener la exposición solar intensa.", "Ignorar lunares nuevos o cambios de pigmento."]},
      cat: 'Sexual',
      vial: 10,
      bac: 2,
      dose: 250,
      unit: 'mcg',
      desc: 'Heptapéptido cíclico análogo no selectivo de la alfa-MSH, activo de MC1R a MC5R: estimula la melanogénesis dérmica para bronceado y produce marcado estímulo afrodisíaco. Su perfil de unión amplio está bien caracterizado en relación estructura-actividad de receptores (Bednarek, 2007).',
      contra: 'Hipertensión, cardiopatía o arritmias (eleva PA); embarazo/lactancia; antecedente personal/familiar de melanoma o nevos displásicos; diabetes descompensada; insuficiencia renal/hepática grave; hipersensibilidad.',
      halfLife: '3 horas',
      freq: 'Días alternos o según protocolo de inducción (SubQ)'
    },
    {
      name: 'Kisspeptina-10',
      school: {"mw": "≈ 1302 g/mol", "formula": "—", "status": "Solo investigación", "statusEn": "Research only", "evidence": "Se estudia en el eje reproductivo; su uso exógeno puede alterar la pulsatilidad de GnRH y no está aprobado.", "keyPoints": ["Fragmento C-terminal activo de la kisspeptina (KP-54).", "Actúa sobre el receptor KISS1R para estimular la liberación de GnRH.", "Es clave en la pubertad y la regulación hormonal."], "faq": [{"q": "¿Sirve para fertilidad?", "a": "Se investiga en medicina reproductiva, pero no es un tratamiento disponible."}, {"q": "¿Puede desregular las hormonas?", "a": "Sí; al actuar sobre el eje hipotálamo-hipófisis-gonadal puede alterar la pulsatilidad hormonal."}], "en": {"evidence": "Studied in the reproductive axis; exogenous use can disrupt GnRH pulsatility and is not approved.", "keyPoints": ["The active C-terminal fragment of kisspeptin (KP-54).", "It acts on KISS1R to stimulate GnRH release.", "It is key in puberty and hormonal regulation."], "faq": [{"q": "Is it used for fertility?", "a": "It is being researched in reproductive medicine but is not an available treatment."}, {"q": "Can it disrupt hormones?", "a": "Yes; by acting on the hypothalamic-pituitary-gonadal axis it can alter hormonal pulsatility."}], "mistakes": ["Injecting daily when GnRH secretion is pulsatile.", "Expecting testosterone to rise within days.", "Not measuring LH or testosterone during use."]}, "mistakes": ["Pincharla a diario, cuando la secreción de GnRH es pulsátil.", "Esperar subida de testosterona en días.", "No medir LH ni testosterona durante el uso."]},
      cat: 'Sexual',
      vial: 5,
      bac: 2.5,
      dose: 100,
      unit: 'mcg',
      desc: 'Decapéptido YNWNSFGLRF, la pieza activa de 10 aminoácidos de la kisspeptina (gen KISS1): actúa sobre el receptor GPR54/KISS1R y enciende las neuronas GnRH, situándose como el interruptor maestro río arriba del eje reproductivo HPG (Dhillo, 2005).',
      contra: 'Hipersensibilidad; embarazo/lactancia (salvo fertilidad supervisada); cánceres hormonodependientes (mama, próstata, endometrio); niños/prepuberales; tratamiento con análogos GnRH o anticonceptivos hormonales.',
      halfLife: 'Corta (~20 min)',
      freq: '1 a 2 veces por semana (SubQ)'
    },
    /* --- AÑADIDOS · Tier List 2026 (datos de Hpebio-Peptide.xlsx) --- */
    {
      name: 'Wolverine (BPC-157 + TB-500)',
      school: {"mw": "Mezcla (sin peso único)", "formula": "—", "status": "Combinación de investigación", "statusEn": "Research combination", "evidence": "No hay ensayos de la mezcla; la evidencia disponible es la de cada péptido por separado y casi toda preclínica.", "keyPoints": ["Combina BPC-157 (angiogénesis y mucosa) con TB-500 (migración celular y actina).", "Busca sumar reparación estructural y modulación de la inflamación.", "No es un producto aprobado: es una mezcla oficiosa de dos compuestos de investigación."], "faq": [{"q": "¿Hay estudios de la mezcla?", "a": "No; se extrapola de los datos individuales, lo que no demuestra que combinarlos sea mejor."}, {"q": "¿Cómo se dosifica?", "a": "No existe una pauta validada; cualquier mezcla casera añade riesgo de error de concentración."}], "en": {"evidence": "There are no trials of the blend; available evidence is for each peptide separately and mostly preclinical.", "keyPoints": ["Combines BPC-157 (angiogenesis and mucosa) with TB-500 (cell migration and actin).", "It aims to add structural repair and inflammatory modulation.", "It is not an approved product: it is an informal mix of two research compounds."], "faq": [{"q": "Are there studies of the blend?", "a": "No; it extrapolates from individual data, which does not prove the combination is better."}, {"q": "How is it dosed?", "a": "No validated schedule exists; any home-made mix adds concentration-error risk."}], "mistakes": ["Calculating the dose as if it were one peptide.", "Mixing both in the same vial without checking compatibility.", "Running the blend for months without a break."]}, "mistakes": ["Calcular la dosis como si fuera un solo péptido.", "Mezclar ambos en el mismo vial sin comprobar compatibilidad.", "Mantener la mezcla meses sin descanso."]},
      cat: 'Reparación',
      vial: 10,
      bac: 3,
      dose: 500,
      unit: 'mcg',
      desc: 'Blend 1:1 de BPC-157 5 mg + TB-500 5 mg por vial: junta la señalización de reparación gástrico/tisular del BPC-157 con la unión a actina y la remodelación de la timosina beta-4. Se estudia en una sola formulación por sus vías complementarias en migración celular, entorno tisular e inflamación (Gwyer, 2019).',
      contra: 'Cáncer o tumor activo, o antecedente (BPC-157 y TB-500 son proangiogénicos); embarazo/lactancia; hipersensibilidad; coagulopatías o anticoagulantes; insuficiencia renal o hepática grave.',
      halfLife: 'Componentes: BPC-157 ~4 h · TB-500 varios días',
      freq: '1×/día s.c.: inicio 15 clicks (500 mcg blend); techo 30 clicks (1.000 mcg = 250-500 mcg de cada uno). Ciclo 6-8 sem + 2-4 de descanso.'
    },
    {
      name: 'Klow (GHK-Cu + TB-500 + BPC-157 + KPV)',
      school: {"mw": "Mezcla (sin peso único)", "formula": "—", "status": "Combinación de investigación", "statusEn": "Research combination", "evidence": "No existen ensayos clínicos de esta mezcla; la evidencia es indirecta y procede de cada componente por separado.", "keyPoints": ["Reúne cuatro péptidos con perfiles distintos: cobre-péptido, reparación, angiogénesis y antiinflamación.", "Se plantea para recuperación de tejidos y piel.", "La combinación no está aprobada ni estandarizada."], "faq": [{"q": "¿Es mejor que usar uno solo?", "a": "No está demostrado; sumar compuestos también suma incertidumbres y posibles interacciones."}, {"q": "¿Qué riesgo tiene?", "a": "Al no haber control de mezclas, la concentración real de cada péptido puede variar mucho."}], "en": {"evidence": "There are no clinical trials of this blend; evidence is indirect and comes from each component separately.", "keyPoints": ["It combines four peptides with different profiles: copper-peptide, repair, angiogenesis and anti-inflammation.", "It is proposed for tissue and skin recovery.", "The combination is neither approved nor standardised."], "faq": [{"q": "Is it better than using one alone?", "a": "Not proven; adding compounds also adds uncertainty and possible interactions."}, {"q": "What is the risk?", "a": "Without blend controls, the actual concentration of each peptide can vary widely."}], "mistakes": ["Using 1:1 ratios without adjusting each component.", "Mixing peptides of different pH in one vial.", "Expecting each peptide's full-dose effect."]}, "mistakes": ["Usar proporciones 1:1 sin ajustar cada componente.", "Mezclar en un vial péptidos con pH distinto.", "Esperar el efecto de cada péptido a dosis plenas."]},
      cat: 'Reparación',
      vial: 80,
      bac: 3,
      dose: 1600,
      unit: 'mcg',
      desc: 'Blend regenerativo de 4 péptidos en un solo vial (GHK-Cu 50 mg + TB-500 10 mg + BPC-157 10 mg + KPV 10 mg, ratio 5:1:1:1): suma las vías que cada componente cubre por separado, desde tendones, ligamentos y articulaciones hasta colágeno y control de la inflamación sistémica y mucosa.',
      contra: 'Cáncer activo o antecedente; enfermedad de Wilson o trastornos del cobre (absoluta); melanoma activo o predisposición (KPV); embarazo/lactancia; coagulopatías o anticoagulantes; autoinmunidad activa; insuficiencia renal o hepática grave.',
      halfLife: 'Componentes: BPC-157 ~4 h · KPV ~2 h · TB-500 varios días',
      freq: '1×/día s.c.: inicio 6 clicks (1,6 mg blend = 1,0 mg GHK-Cu + 200 mcg de cada uno); techo 15 clicks (4,0 mg blend = 2,5 mg GHK-Cu). 5 días/sem. Ciclo 8-12 sem + 4-8 de descanso (lavado de cobre).'
    },
    {
      name: 'Glow (BPC-157 + TB-500 + GHK-Cu)',
      school: {"mw": "Mezcla (sin peso único)", "formula": "—", "status": "Combinación de investigación", "statusEn": "Research combination", "evidence": "Sin ensayos de la mezcla; los datos disponibles son preclínicos o cosméticos de cada péptido.", "keyPoints": ["Combina reparación (BPC-157), migración celular (TB-500) y cobre-péptido para piel.", "Se orienta a recuperación y calidad de la piel.", "No es un medicamento ni una fórmula validada."], "faq": [{"q": "¿Se puede usar tópico?", "a": "El GHK-Cu se ha estudiado tópico; los otros dos no están pensados para esa vía."}, {"q": "¿Hay dosis estándar?", "a": "No; al ser una mezcla oficiosa, no existe una dosis regulada."}], "en": {"evidence": "No trials of the blend; available data are preclinical or cosmetic for each peptide.", "keyPoints": ["It combines repair (BPC-157), cell migration (TB-500) and a copper-peptide for skin.", "It targets recovery and skin quality.", "It is neither a medicine nor a validated formula."], "faq": [{"q": "Can it be used topically?", "a": "GHK-Cu has been studied topically; the other two are not intended for that route."}, {"q": "Is there a standard dose?", "a": "No; as an informal blend there is no regulated dose."}], "mistakes": ["Applying it topically without knowing which component crosses the skin.", "Reusing the injectable mix on the skin.", "Using it daily without cycles."]}, "mistakes": ["Aplicarlo tópico sin saber qué componente atraviesa la piel.", "Reutilizar la mezcla inyectable en la piel.", "Usarlo a diario sin ciclos."]},
      cat: 'Reparación',
      vial: 70,
      bac: 3,
      dose: 1400,
      unit: 'mcg',
      desc: 'Blend de recuperación y dermorreparación (BPC-157 10 mg + GHK-Cu 50 mg + TB-500 10 mg por vial, ratio 5:1:1): tres vías solapadas, migración celular, matriz extracelular y angiogénesis, para tendones y articulaciones, piel y mucosas, con impulso a la síntesis de colágeno (Pickart y Margolina, 2018).',
      contra: 'Cáncer activo o antecedente; enfermedad de Wilson o trastornos del cobre (absoluta); embarazo/lactancia; hipersensibilidad; coagulopatías o anticoagulantes; autoinmunidad activa; insuficiencia renal o hepática grave.',
      halfLife: 'Componentes: BPC-157 ~4 h · TB-500 varios días',
      freq: '1×/día s.c.: inicio 6 clicks (1,4 mg blend = 1,0 mg GHK-Cu + 200 mcg de cada uno); techo 15 clicks (3,5 mg blend = 2,5 mg GHK-Cu). 3-5 días/sem. Ciclo 8-12 sem + 4-6 de descanso.'
    },
    {
      name: 'CJC-1295 + Ipamorelina (stack GHRH + GHRP)',
      school: {"mw": "Mezcla (sin peso único)", "formula": "—", "status": "Combinación de investigación", "statusEn": "Research combination", "evidence": "La combinación se usa en foros y estudios pequeños por su efecto aditivo sobre la GH; no hay ensayos controlados de la mezcla.", "keyPoints": ["Suma un análogo de GHRH (CJC-1295) y un secretagogo de ghrelina (ipamorelina).", "Actúan en puntos distintos de la hipófisis, por lo que el efecto sobre la GH puede ser aditivo.", "No es una combinación aprobada."], "faq": [{"q": "¿Por qué se combinan?", "a": "Porque la GHRH y la ghrelina estimulan la liberación de GH por vías complementarias."}, {"q": "¿Es seguro a largo plazo?", "a": "No hay datos; la exposición prolongada a GH e IGF-1 tiene riesgos conocidos."}], "en": {"evidence": "The combination is used in forums and small studies for its additive GH effect; there are no controlled trials of the blend.", "keyPoints": ["It adds a GHRH analogue (CJC-1295) and a ghrelin secretagogue (ipamorelin).", "They act at different pituitary points, so the GH effect may be additive.", "It is not an approved combination."], "faq": [{"q": "Why combine them?", "a": "Because GHRH and ghrelin stimulate GH release through complementary pathways."}, {"q": "Is it safe long term?", "a": "There are no data; prolonged GH and IGF-1 exposure carries known risks."}], "mistakes": ["Injecting both at once without separating the peaks.", "Keeping both at full dose.", "Not taking breaks between cycles."]}, "mistakes": ["Pinchar ambos a la vez sin separar los picos.", "Mantener dosis plenas de los dos.", "No descansar entre ciclos."]},
      cat: 'Eje GH',
      vial: 5,
      bac: 2.5,
      dose: 100,
      unit: 'mcg',
      desc: 'Combinación clásica GHRH + GHRP: CJC-1295 sin DAC 100 mcg con Ipamorelina 200-300 mcg, cada uno reconstituido por separado (existe también como blend de 10 mg). Pulso fisiológico de GH estudiado en el eje hormonal (Teichman et al., 2006): masa magra, lipólisis y sueño profundo.',
      contra: 'Cáncer activo o antecedente (eje GH/IGF-1); tumores hipofisarios o intracraneales; embarazo/lactancia; diabetes mal controlada; placas de crecimiento abiertas; hipersensibilidad.',
      halfLife: 'CJC-1295 sin DAC ~30 min · Ipamorelina ~2 h',
      freq: '1-2×/día s.c. en ayunas (≥1,5-2 h sin comer): CJC 100 mcg + IPA 200-300 mcg. Ciclo 8-12 sem + 4 de descanso.'
    },
    {
      name: 'IGF-1 LR3',
      school: {"mw": "9117,60 g/mol", "formula": "C₄₀₀H₆₂₅N₁₁₁O₁₁₅S₉", "status": "Producto de investigación", "statusEn": "Research product", "evidence": "Su versión de larga duración se usa en investigación de crecimiento y metabolismo; los datos de seguridad en humanos sanos son escasos.", "keyPoints": ["Análogo de IGF-1 con una extensión que reduce su unión a proteínas transportadoras.", "Mayor vida media y mayor potencia que el IGF-1 nativo.", "Se investiga en crecimiento, reparación y metabolismo."], "faq": [{"q": "¿Es hormona de crecimiento?", "a": "No: es un factor de crecimiento parecido a la insulina, con acciones distintas."}, {"q": "¿Riesgos principales?", "a": "Hipoglucemia, retención de líquidos y posible estimulación de tejidos tumorales."}], "en": {"evidence": "The long-acting version is used in growth and metabolism research; safety data in healthy humans are scarce.", "keyPoints": ["An IGF-1 analogue with an extension that reduces binding to carrier proteins.", "Longer half-life and greater potency than native IGF-1.", "It is researched in growth, repair and metabolism."], "faq": [{"q": "Is it growth hormone?", "a": "No: it is an insulin-like growth factor with different actions."}, {"q": "Main risks?", "a": "Hypoglycaemia, fluid retention and possible stimulation of tumour tissue."}], "mistakes": ["Injecting it into the muscle hoping for local growth.", "100 mcg daily without monitoring glucose.", "Using it with food and risking hypoglycaemia."]}, "mistakes": ["Inyectarlo en el músculo esperando crecimiento local.", "100 mcg diarios sin controlar la glucosa.", "Usarlo con comida y arriesgar hipoglucemia."]},
      cat: 'Eje GH',
      vial: 1,
      bac: 2,
      dose: 40,
      unit: 'mcg',
      desc: 'Análogo de IGF-1 de 83 aminoácidos con extensión N-terminal de 13 residuos y sustitución Arg3 que lo hacen resistente a las proteínas de unión: más señalización PI3K/Akt por cada molécula libre (Tomas, 1992). Hipertrofia e hiperplasia muscular y recuperación; riesgo real de hipoglucemia: tener carbohidratos a mano.',
      contra: 'Cáncer activo o historial oncológico reciente (menos de 5 años); retinopatía diabética proliferativa; acromegalia; embarazo/lactancia; menores de 18 años; insuficiencia hepática o renal grave; diabetes inestable (hipoglucemia).',
      halfLife: '20-30 h',
      freq: '20 mcg/día 2-3 días → 40-80 mcg/día s.c. o IM post-entreno (máx. 100 mcg/día). Ciclo 10 días on / 4 sem off.'
    },
    {
      name: 'DSIP (Péptido inductor del sueño delta)',
      school: {"mw": "848,81 g/mol", "formula": "C₃₅H₄₈N₁₀O₁₅", "status": "Péptido de investigación", "statusEn": "Research peptide", "evidence": "Los estudios sobre sueño son antiguos y pequeños; no hay evidencia moderna sólida de eficacia.", "keyPoints": ["Nonapéptido aislado originalmente del cerebro de conejo.", "Se estudia por su efecto sobre el sueño de ondas lentas y el estrés.", "Su mecanismo exacto sigue sin estar claro."], "faq": [{"q": "¿Funciona como somnífero?", "a": "La evidencia es débil; no sustituye a un tratamiento del insomnio."}, {"q": "¿Es seguro?", "a": "No hay datos de seguridad a largo plazo en humanos."}], "en": {"evidence": "Sleep studies are old and small; there is no solid modern evidence of efficacy.", "keyPoints": ["A nonapeptide originally isolated from rabbit brain.", "It is studied for effects on slow-wave sleep and stress.", "Its exact mechanism remains unclear."], "faq": [{"q": "Does it work as a sleeping pill?", "a": "Evidence is weak; it does not replace insomnia treatment."}, {"q": "Is it safe?", "a": "There are no long-term human safety data."}], "mistakes": ["Expecting a strong sleeping pill.", "Taking it in the morning.", "Confusing 100 mcg with 1 mg."]}, "mistakes": ["Esperar un somnífero potente.", "Administrarlo por la mañana.", "Confundir 100 mcg con 1 mg."]},
      cat: 'Cognición',
      vial: 5,
      bac: 2,
      dose: 100,
      unit: 'mcg',
      desc: 'Nonapéptido (Trp-Ala-Gly-Gly-Asp-Ala-Ser-Gly-Glu) aislado en los años 70 de cerebro de conejo: se asocia al sueño de ondas lentas y la actividad delta del EEG, cruza la barrera hematoencefálica e interacciona con la sincronización circadiana y el eje del estrés (Schoenenberger y Monnier, 1977). Evidencia humana muy limitada y discutida.',
      contra: 'Embarazo/lactancia (sin datos); insuficiencia suprarrenal o hipofisaria (eje HPA); sedantes/hipnóticos o trastornos psiquiátricos (interacción no estudiada); seguridad humana muy limitada.',
      halfLife: 'No documentada (vida plasmática muy corta)',
      freq: '100-250 mcg s.c. 1-3 h antes de acostarse, 5 días sí / 2 no. Ciclo 8 sem + 8 de descanso.'
    },
    {
      name: '5-Amino-1MQ',
      school: {"mw": "≈ 286 g/mol (yoduro)", "formula": "C₁₁H₁₃IN₂", "status": "Investigación preclínica", "statusEn": "Preclinical research", "evidence": "Inhibe NNMT y reduce grasa en ratones; no hay ensayos clínicos publicados en humanos.", "keyPoints": ["No es un péptido: es una molécula pequeña inhibidora de NNMT.", "Bloquea la enzima que consume nicotinamida y altera los donantes de metilo.", "Se investiga en obesidad y resistencia a la insulina."], "faq": [{"q": "¿Es un péptido?", "a": "No, aunque se venda junto a ellos: es un compuesto de molécula pequeña."}, {"q": "¿Se puede tomar por vía oral?", "a": "En investigación se ha usado por vía oral, pero no hay datos de seguridad humana."}], "en": {"evidence": "It inhibits NNMT and reduces fat in mice; no human clinical trials have been published.", "keyPoints": ["It is not a peptide: it is a small-molecule NNMT inhibitor.", "It blocks the enzyme that consumes nicotinamide and alters methyl donors.", "It is researched in obesity and insulin resistance."], "faq": [{"q": "Is it a peptide?", "a": "No, although it is sold alongside them: it is a small-molecule compound."}, {"q": "Can it be taken orally?", "a": "Oral use has been explored in research, but there are no human safety data."}], "mistakes": ["Injecting it believing it is a peptide.", "Taking 100 mg orally at once.", "Expecting a GLP-1 effect."]}, "mistakes": ["Inyectarlo creyendo que es un péptido.", "Tomar 100 mg orales de golpe.", "Esperar un efecto GLP-1."]},
      cat: 'Metabolismo',
      vial: 5,
      bac: 2,
      dose: 150,
      unit: 'mcg',
      desc: 'Inhibidor de NNMT de molécula pequeña (NO es un péptido): metilquinolinio que atraviesa las membranas para bloquear la nicotinamida N-metiltransferasa, alterando el manejo de nicotinamida y donantes de metilo (Neelakantan, 2018). Pérdida de grasa, sensibilidad a la insulina y preservación de masa magra, solo preclínico. Vía oral: 25 mg/día de inicio hasta 50-75 mg/día; referencia inyectable 150-500 mcg/día s.c.',
      contra: 'Embarazo/lactancia; IMAO (contraindicado); ISRS u otros serotoninérgicos (precaución); dieta rica en tiramina; hipertensión o hipotensión; enfermedades crónicas; sin ensayos en humanos.',
      halfLife: 'No documentada en humanos',
      freq: 'ORAL 25 mg/día 1-2 sem → 50-75 mg/día. Ciclo 8-12 sem + 4 de descanso.'
    },
    {
      name: 'SLU-PP-332',
      school: {"mw": "290,32 g/mol", "formula": "C₁₈H₁₄N₂O₂", "status": "Preclínico, solo investigación", "statusEn": "Preclinical, research only", "evidence": "En ratones sedentarios aumentó la resistencia al ejercicio y el gasto energético; no hay datos en humanos.", "keyPoints": ["No es un péptido: activa los receptores ERR alfa, beta y gamma.", "Desencadena parte de la señal génica del ejercicio aeróbico.", "Su nombre se asocia a «mimético del ejercicio»."], "faq": [{"q": "¿Sustituye al ejercicio?", "a": "No: los datos son preclínicos y no reproducen los múltiples efectos del ejercicio real."}, {"q": "¿Es seguro?", "a": "No se ha estudiado en humanos; se considera un compuesto exclusivamente de laboratorio."}], "en": {"evidence": "In sedentary mice it increased exercise endurance and energy expenditure; there are no human data.", "keyPoints": ["It is not a peptide: it activates the ERR alpha, beta and gamma receptors.", "It triggers part of the gene signal of aerobic exercise.", "It is marketed as an 'exercise mimetic'."], "faq": [{"q": "Does it replace exercise?", "a": "No: data are preclinical and do not reproduce the many effects of real exercise."}, {"q": "Is it safe?", "a": "It has not been studied in humans; it is strictly a laboratory compound."}], "mistakes": ["Using it without training and expecting an 'exercise effect'.", "25 mg oral doses copied from forums.", "Chronic use without safety data."]}, "mistakes": ["Usarlo sin entrenar esperando el «efecto ejercicio».", "Dosis de 25 mg oral copiadas de foros.", "Uso crónico sin datos de seguridad."]},
      cat: 'Metabolismo',
      vial: 5,
      bac: 2,
      dose: 5,
      unit: 'mg',
      desc: 'Acilhidrazona de molécula pequeña (NO es un péptido) que activa los tres receptores ERR (alfa, beta y gamma): desencadena la señal génica del ejercicio aeróbico, biogénesis mitocondrial y oxidación de grasas. En ratones sedentarios aumentó ~70% el tiempo de carrera (Billon, 2023). Sin datos en humanos: inicio 5 mg/día s.c. o 25 mg oral, ciclos de 4-8 semanas.',
      contra: 'Sin datos de seguridad humana (RUO, solo investigación). Evitar en embarazo/lactancia, insuficiencia hepática o renal, cardiopatía, cáncer activo y menores de 18 años.',
      halfLife: 'No establecida (preclínico)',
      freq: 'Inicio 5 mg/día s.c. (rango de referencia 2-5 mg/día) o 25 mg/día oral; ciclos cortos de 4-8 sem. Referencia preclínica en roedores: 25-50 mg/kg/día.'
    },

  ];

  let currentCategory = 'all';

  function renderList() {
    const isEn = window.MISPEP_I18N && window.MISPEP_I18N.getLang() === 'en';
    const pepEnDict = (window.MISPEP_I18N && window.MISPEP_I18N.peptidesEn) || {};
    const catEnDict = (window.MISPEP_I18N && window.MISPEP_I18N.categoriesEn) || {};
    const t = (k, def) => (window.MISPEP_I18N ? window.MISPEP_I18N.t(k, def) : def);

    const q = (searchInput ? searchInput.value : '').toLowerCase().trim();

    const filtered = peptideLibrary.filter(p => {
      const matchCat = currentCategory === 'all' || p.cat.toLowerCase() === currentCategory.toLowerCase();
      const pEn = pepEnDict[p.name] || {};
      const descText = isEn ? (pEn.desc || p.desc) : p.desc;
      const matchQuery = !q || p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q) || descText.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.88rem; padding:24px;">${t('no_peptides_found', 'No se encontraron péptidos para la búsqueda o categoría seleccionada.')}</p>`;
      return;
    }

    listContainer.innerHTML = filtered.map((p) => {
      const pEn = isEn ? (pepEnDict[p.name] || {}) : {};
      const displayName = (isEn && pEn.name) ? pEn.name : p.name;
      const displayDesc = isEn ? (pEn.desc || p.desc) : p.desc;
      const displayContra = isEn ? (pEn.contra !== undefined ? pEn.contra : p.contra) : p.contra;
      const displayHalfLife = isEn ? (pEn.halfLife || p.halfLife) : p.halfLife;
      const displayFreq = isEn ? (pEn.freq || p.freq) : p.freq;
      const displayCat = isEn ? (catEnDict[p.cat] || p.cat) : p.cat;

      const sc = p.school || null;
      const scLoc = sc && isEn && sc.en ? sc.en : sc;
      let schoolHtml = '';
      if (sc) {
        const chips = [];
        const mwTxt = (isEn && sc.mw) ? sc.mw.replace(/,/g, '.') : sc.mw;
        if (sc.mw) chips.push(`<span class="pep-school-chip">⚖️ ${mwTxt}</span>`);
        if (sc.formula) chips.push(`<span class="pep-school-chip">🧪 ${sc.formula}</span>`);
        const st = (isEn && sc.statusEn) ? sc.statusEn : sc.status;
        if (st) chips.push(`<span class="pep-school-chip">🏷️ ${st}</span>`);

        const kp = (scLoc && scLoc.keyPoints) || [];
        const mis = (scLoc && scLoc.mistakes) || [];
        const faq = (scLoc && scLoc.faq) || [];
        const ev = (scLoc && scLoc.evidence) || '';

        schoolHtml = `
        <details class="pep-school">
          <summary><span>${t('school_sheet', '📖 Ficha de escuela')} <span style="font-weight:700; opacity:.65; font-size:.66rem;">${t('school_sheet_sub', 'datos, mecanismo y evidencia')}</span></span></summary>
          <div class="pep-school-body">
            <div class="pep-school-chips">${chips.join('')}</div>
            ${ev ? `<div class="pep-school-section"><b>${t('school_evidence', 'Qué dice la evidencia')}</b>${ev}</div>` : ''}
            ${kp.length ? `<div class="pep-school-section"><b>${t('school_keypoints', 'Puntos clave')}</b><ul>${kp.map(k => `<li>${k}</li>`).join('')}</ul></div>` : ''}
            ${mis.length ? `<div class="pep-school-section"><b>${t('school_mistakes', 'Errores más frecuentes')}</b><ul>${mis.map(m => `<li>${m}</li>`).join('')}</ul></div>` : ''}
            ${faq.length ? `<div class="pep-school-section"><b>${t('school_faq', 'Preguntas frecuentes')}</b><div class="pep-school-faq">${faq.map(f => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('')}</div></div>` : ''}
          </div>
        </details>`;
      }

      return `
      <div style="background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:14px; padding:14px; margin-bottom:12px; box-shadow:0 4px 12px var(--shadow-ambient);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <div>
            <strong style="font-size:1.02rem; color:var(--text-main); display:block;">${displayName}</strong>
            <span class="badge-tag" style="margin-top:4px;">${displayCat}</span>
          </div>
        </div>
        <p style="font-size:0.82rem; color:var(--text-secondary); margin:8px 0; line-height:1.4;">
          ${displayDesc}
        </p>
        ${schoolHtml}
        ${displayContra ? `<div style="font-size:0.78rem; color:#f0a08a; margin:8px 0; line-height:1.4;">${t('contra_label', '⚠️ Contraindicaciones:')} ${displayContra}</div>` : ''}
        <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:10px; line-height:1.4;">
          • ${t('sugg_vial', 'Vial sugerido:')} <strong>${p.vial} mg</strong> | ${t('bac_water', 'Agua BAC:')} <strong>${p.bac} mL</strong><br>
          • ${t('typical_dose', 'Dosis habitual:')} <strong>${p.dose} ${p.unit}</strong> | ${t('freq_label', 'Frecuencia:')} <strong>${displayFreq}</strong> | ${t('halflife_label', 'Semivida:')} <strong>${displayHalfLife}</strong>
        </div>
        <button class="btn-3d btn-3d-emerald" style="width:100%; padding:9px 12px; font-size:0.84rem;" onclick="loadPeptideInCalc('${p.vial}', '${p.bac}', '${p.dose}', '${p.unit}')">
          ${t('load_in_calc', '⚡ Cargar Parámetros en Calculadora')}
        </button>
        ${getPeptidePkKey(p.name) ? `
        <button class="btn-3d btn-3d-cyan" style="width:100%; padding:9px 12px; font-size:0.84rem; margin-top:8px;" onclick="openPeptideSimulator('${getPeptidePkKey(p.name)}')">
          ${t('sim_pk', '📊 Simulador PK')}
        </button>
        ` : ''}
        <button class="btn-3d" data-pep="${String(p.name).replace(/"/g, '&quot;')}" data-cat="${String(p.cat).replace(/"/g, '&quot;')}"
          ${peptidoEnMedicamentos(p.name) ? 'disabled' : ''}
          style="width:100%; padding:9px 12px; font-size:0.84rem; margin-top:8px;${peptidoEnMedicamentos(p.name) ? ' opacity:0.7;' : ''}"
          onclick="addPeptideToMeds(this.dataset.pep, this.dataset.cat, this)">
          ${peptidoEnMedicamentos(p.name) ? t('in_meds', '✓ En la lista de medicamentos') : t('add_to_meds', '＋ Añadir a Medicamentos')}
        </button>
      </div>
    `;
    }).join('');
  }

  window.renderResearchListGlobal = renderList;

  // Manejo de botones de categoría
  if (catPills) {
    catPills.querySelectorAll('.pill-3d').forEach(pill => {
      pill.addEventListener('click', () => {
        catPills.querySelectorAll('.pill-3d').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentCategory = pill.dataset.cat;
        renderList();
      });
    });
  }

  window.loadPeptideInCalc = function(vial, bac, dose, unit) {
    const vialInput = document.getElementById('calcVialInput');
    const bacInput = document.getElementById('calcBacInput');
    const doseInput = document.getElementById('calcDoseInput');
    const doseUnitSelect = document.getElementById('calcDoseUnit');

    if (vialInput) vialInput.value = vial;
    if (bacInput) bacInput.value = bac;
    if (doseInput) doseInput.value = dose;
    if (doseUnitSelect) doseUnitSelect.value = unit;

    // Disparar cálculo
    vialInput.dispatchEvent(new Event('input'));
    // Cambiar a la vista de Calc
    if (window.switchModule) {
      window.switchModule('calc');
    }
  };

  function getPeptidePkKey(name) {
    const s = String(name || '').toLowerCase();
    if (s.includes('retatrutid')) return 'retatrutide';
    if (s.includes('tirzepatid') || s.includes('mounjaro') || s.includes('zepbound')) return 'tirzepatide';
    if (s.includes('semaglutid') || s.includes('ozempic') || s.includes('wegovy')) return 'semaglutide';
    if (s.includes('cagrilintid')) return 'cagrilintide';
    if (s.includes('survodutid')) return 'survodutide';
    if (s.includes('mazdutid')) return 'mazdutide';
    if (s.includes('tb-500') || s.includes('tb500') || s.includes('timosina beta')) return 'tb500';
    if (s.includes('bpc-157') || s.includes('bpc157')) return 'bpc157';
    if (s.includes('ipamorel')) return 'ipamorelin';
    if (s.includes('pt-141') || s.includes('pt141') || s.includes('bremelanotid')) return 'pt141';
    return null;
  }
  window.getPeptidePkKey = getPeptidePkKey;

  window.openPeptideSimulator = function(key) {
    triggerHaptic(18);
    const modal = document.getElementById('retatrutideSimModal');
    const iframe = document.getElementById('retatrutideSimIframe');
    const pkKey = key || 'retatrutide';
    const headerMap = {
      retatrutide: 'Retatrutide',
      tirzepatide: 'Tirzepatida',
      semaglutide: 'Semaglutida',
      cagrilintide: 'Cagrilintida',
      survodutide: 'Survodutida',
      mazdutide: 'Mazdutida',
      tb500: 'TB-500',
      bpc157: 'BPC-157',
      ipamorelin: 'Ipamorelina',
      pt141: 'PT-141'
    };
    const titleEl = document.getElementById('simModalHeaderTitle');
    if (titleEl) {
      titleEl.textContent = 'Simulador PK · ' + (headerMap[pkKey] || 'Bicompartimental');
    }
    if (modal && iframe) {
      const targetSrc = 'retatrutide-sim.html?pep=' + encodeURIComponent(pkKey);
      if (!iframe.src || iframe.src === 'about:blank' || iframe.src.indexOf('retatrutide-sim.html') === -1) {
        iframe.src = targetSrc;
      } else {
        try {
          if (iframe.contentWindow && iframe.contentWindow.setPeptidePreset) {
            iframe.contentWindow.setPeptidePreset(pkKey);
          } else {
            iframe.src = targetSrc;
          }
        } catch (_) {
          iframe.src = targetSrc;
        }
      }
      modal.style.display = 'flex';
      try { history.pushState({ modal: 'retatrutideSim', peptide: pkKey }, ''); } catch (_) {}
    }
  };

  window.openRetatrutideSimulator = function() {
    window.openPeptideSimulator('retatrutide');
  };

  window.closeRetatrutideSimulator = function() {
    triggerHaptic(12);
    const modal = document.getElementById('retatrutideSimModal');
    if (modal) {
      modal.style.display = 'none';
      try {
        if (history.state && history.state.modal === 'retatrutideSim') {
          history.back();
        }
      } catch (_) {}
    }
  };

  window.addEventListener('popstate', (e) => {
    const modal = document.getElementById('retatrutideSimModal');
    if (modal && modal.style.display === 'flex') {
      modal.style.display = 'none';
    }
  });

  if (searchInput) {
    searchInput.addEventListener('input', renderList);
  }

  renderList();
}

/* ============================================================
   MÓDULO: TODAS LAS MEDICACIONES (Registro para el médico)
   ============================================================ */

// Catálogo de grupos terapéuticos con los medicamentos típicos y sus dosis habituales
const MED_CATALOG = [
  { group: 'Antihipertensivos (IECA / ARA-II)', icon: '🫀', meds: [
    { name: 'Enalapril', presets: ['5 mg', '10 mg', '20 mg'] },
    { name: 'Ramipril', presets: ['2.5 mg', '5 mg', '10 mg'] },
    { name: 'Perindopril', presets: ['4 mg', '8 mg'] },
    { name: 'Lisinopril', presets: ['5 mg', '10 mg', '20 mg'] },
    { name: 'Captopril', presets: ['25 mg', '50 mg'] },
    { name: 'Valsartán', presets: ['80 mg', '160 mg'] },
    { name: 'Telmisartán', presets: ['20 mg', '40 mg', '80 mg'] },
    { name: 'Losartán', presets: ['50 mg', '100 mg'] },
    { name: 'Olmesartán', presets: ['20 mg', '40 mg'] },
    { name: 'Candesartán', presets: ['8 mg', '16 mg', '32 mg'] },
    { name: 'Irbesartán', presets: ['150 mg', '300 mg'] },
    { name: 'Sacubitrilo/Valsartán', presets: ['50 mg', '100 mg', '200 mg'] }
  ]},
  { group: 'Antihipertensivos (Calcioantagonistas)', icon: '🫀', meds: [
    { name: 'Amlodipino', presets: ['5 mg', '10 mg'] },
    { name: 'Lercanidipino', presets: ['10 mg', '20 mg'] },
    { name: 'Nifedipino', presets: ['30 mg', '60 mg'] },
    { name: 'Verapamilo', presets: ['80 mg', '120 mg', '240 mg'] },
    { name: 'Diltiazem', presets: ['120 mg', '180 mg', '240 mg'] }
  ]},
  { group: 'Betabloqueantes', icon: '🫀', meds: [
    { name: 'Bisoprolol', presets: ['1.25 mg', '2.5 mg', '5 mg', '10 mg'] },
    { name: 'Nebivolol', presets: ['5 mg', '10 mg'] },
    { name: 'Metoprolol', presets: ['50 mg', '100 mg', '200 mg'] },
    { name: 'Atenolol', presets: ['25 mg', '50 mg', '100 mg'] },
    { name: 'Carvedilol', presets: ['6.25 mg', '12.5 mg', '25 mg'] },
    { name: 'Propranolol', presets: ['10 mg', '40 mg'] }
  ]},
  { group: 'Diuréticos', icon: '💧', meds: [
    { name: 'Furosemida (Seguril)', presets: ['20 mg', '40 mg'] },
    { name: 'Torasemida', presets: ['5 mg', '10 mg', '20 mg'] },
    { name: 'Hidroclorotiazida', presets: ['12.5 mg', '25 mg'] },
    { name: 'Clortalidona', presets: ['12.5 mg', '25 mg', '50 mg'] },
    { name: 'Indapamida', presets: ['1.5 mg', '2.5 mg'] },
    { name: 'Espironolactona (Aldactone)', presets: ['25 mg', '50 mg', '100 mg'] },
    { name: 'Eplerenona', presets: ['25 mg', '50 mg'] }
  ]},
  { group: 'Dislipemia (Estatinas)', icon: '🧪', meds: [
    { name: 'Atorvastatina (Cardyl)', presets: ['10 mg', '20 mg', '40 mg', '80 mg'] },
    { name: 'Rosuvastatina', presets: ['5 mg', '10 mg', '20 mg', '40 mg'] },
    { name: 'Simvastatina', presets: ['10 mg', '20 mg', '40 mg'] },
    { name: 'Pravastatina', presets: ['20 mg', '40 mg'] },
    { name: 'Pitavastatina', presets: ['1 mg', '2 mg', '4 mg'] }
  ]},
  { group: 'Dislipemia (otros hipolipemiantes)', icon: '🧪', meds: [
    { name: 'Ezetimiba', presets: ['10 mg'] },
    { name: 'Fenofibrato', presets: ['145 mg', '200 mg'] },
    { name: 'Gemfibrozilo', presets: ['600 mg', '900 mg'] },
    { name: 'Ácido bempedoico', presets: ['180 mg'] },
    { name: 'Evolocumab', presets: ['140 mg'] },
    { name: 'Inclisirán', presets: ['284 mg'] }
  ]},
  { group: 'Antidiabéticos', icon: '🍬', meds: [
    { name: 'Metformina', presets: ['500 mg', '850 mg', '1000 mg'] },
    { name: 'Empagliflozina', presets: ['10 mg', '25 mg'] },
    { name: 'Dapagliflozina', presets: ['10 mg'] },
    { name: 'Sitagliptina', presets: ['25 mg', '50 mg', '100 mg'] },
    { name: 'Linagliptina', presets: ['5 mg'] },
    { name: 'Gliclazida', presets: ['30 mg', '60 mg'] },
    { name: 'Insulina glargina', presets: ['10 UI', '20 UI', '30 UI', '40 UI'] },
    { name: 'Insulina lispro', presets: ['4 UI', '8 UI', '12 UI'] }
  ]},
  { group: 'Antiagregantes y Anticoagulantes', icon: '🩸', meds: [
    { name: 'Ácido acetilsalicílico (Adiro / AAS)', presets: ['100 mg'] },
    { name: 'Clopidogrel', presets: ['75 mg'] },
    { name: 'Ticagrelor', presets: ['90 mg'] },
    { name: 'Rivaroxabán', presets: ['10 mg', '15 mg', '20 mg'] },
    { name: 'Apixabán', presets: ['2.5 mg', '5 mg'] },
    { name: 'Edoxabán', presets: ['30 mg', '60 mg'] },
    { name: 'Dabigatrán', presets: ['110 mg', '150 mg'] },
    { name: 'Enoxaparina', presets: ['20 mg', '40 mg', '60 mg'] },
    { name: 'Acenocumarol (Sintrom)', presets: ['1 mg', '4 mg'] }
  ]},
  { group: 'Tiroides', icon: '🦋', meds: [
    { name: 'Levotiroxina (Eutirox)', presets: ['25 mcg', '50 mcg', '75 mcg', '100 mcg', '125 mcg'] },
    { name: 'Metimazol', presets: ['5 mg', '10 mg', '20 mg'] },
    { name: 'Propiltiouracilo', presets: ['50 mg'] }
  ]},
  { group: 'Protectores gástricos (IBP)', icon: '🔥', meds: [
    { name: 'Omeprazol (Losec)', presets: ['10 mg', '20 mg', '40 mg'] },
    { name: 'Pantoprazol', presets: ['20 mg', '40 mg'] },
    { name: 'Esomeprazol', presets: ['20 mg', '40 mg'] },
    { name: 'Lansoprazol', presets: ['15 mg', '30 mg'] },
    { name: 'Rabeprazol', presets: ['10 mg', '20 mg'] }
  ]},
  { group: 'Analgésicos y Antiinflamatorios', icon: '💊', meds: [
    { name: 'Paracetamol', presets: ['500 mg', '650 mg', '1000 mg'] },
    { name: 'Ibuprofeno', presets: ['400 mg', '600 mg'] },
    { name: 'Dexketoprofeno', presets: ['12.5 mg', '25 mg'] },
    { name: 'Naproxeno', presets: ['250 mg', '500 mg'] },
    { name: 'Diclofenaco', presets: ['50 mg'] },
    { name: 'Metamizol (Nolotil)', presets: ['575 mg'] },
    { name: 'Celecoxib', presets: ['100 mg', '200 mg'] },
    { name: 'Tramadol', presets: ['50 mg', '100 mg'] },
    { name: 'Enantyum (dexketoprofeno)', presets: ['12.5 mg', '25 mg'] }
  ]},
  { group: 'Corticoides', icon: '🧴', meds: [
    { name: 'Prednisona', presets: ['5 mg', '10 mg', '30 mg'] },
    { name: 'Deflazacort', presets: ['6 mg', '30 mg'] },
    { name: 'Metilprednisolona', presets: ['4 mg', '40 mg'] },
    { name: 'Hidrocortisona', presets: ['10 mg', '20 mg'] },
    { name: 'Budesonida', presets: ['200 mcg', '400 mcg'] }
  ]},
  { group: 'Antihistamínicos / Alergias', icon: '🤧', meds: [
    { name: 'Cetirizina', presets: ['10 mg'] },
    { name: 'Loratadina', presets: ['10 mg'] },
    { name: 'Desloratadina', presets: ['5 mg'] },
    { name: 'Bilastina', presets: ['20 mg'] },
    { name: 'Ebastina', presets: ['10 mg'] },
    { name: 'Fexofenadina', presets: ['120 mg', '180 mg'] }
  ]},
  { group: 'Antidepresivos y Ansiolíticos', icon: '🧠', meds: [
    { name: 'Sertralina', presets: ['25 mg', '50 mg', '100 mg'] },
    { name: 'Escitalopram', presets: ['5 mg', '10 mg', '20 mg'] },
    { name: 'Fluoxetina', presets: ['20 mg'] },
    { name: 'Paroxetina', presets: ['20 mg'] },
    { name: 'Venlafaxina', presets: ['37.5 mg', '75 mg', '150 mg'] },
    { name: 'Duloxetina', presets: ['30 mg', '60 mg'] },
    { name: 'Mirtazapina', presets: ['15 mg', '30 mg'] },
    { name: 'Pregabalina', presets: ['25 mg', '75 mg', '150 mg'] },
    { name: 'Lorazepam (Orfidal)', presets: ['1 mg', '2 mg'] },
    { name: 'Diazepam (Valium)', presets: ['5 mg', '10 mg'] },
    { name: 'Alprazolam', presets: ['0.25 mg', '0.5 mg', '1 mg'] },
    { name: 'Clonazepam', presets: ['0.5 mg', '2 mg'] }
  ]},
  { group: 'Neurología / Anticonvulsivos', icon: '⚡', meds: [
    { name: 'Gabapentina', presets: ['300 mg', '600 mg', '900 mg'] },
    { name: 'Pregabalina', presets: ['75 mg', '150 mg'] },
    { name: 'Levetiracetam', presets: ['500 mg', '1000 mg'] },
    { name: 'Topiramato', presets: ['25 mg', '50 mg', '100 mg'] },
    { name: 'Carbamazepina', presets: ['200 mg', '400 mg'] },
    { name: 'Sumatriptán', presets: ['50 mg', '100 mg'] }
  ]},
  { group: 'Respiratorio / Asma', icon: '🫁', meds: [
    { name: 'Salbutamol (Ventolín, inhalador)', presets: ['100 mcg'] },
    { name: 'Budesonida/Formoterol', presets: ['160 mcg'] },
    { name: 'Fluticasona/Salmeterol', presets: ['125 mcg', '250 mcg'] },
    { name: 'Montelukast', presets: ['10 mg'] },
    { name: 'Tiotropio', presets: ['18 mcg'] }
  ]},
  { group: 'Urología / Próstata', icon: '🚹', meds: [
    { name: 'Tamsulosina', presets: ['0.4 mg'] },
    { name: 'Silodosina', presets: ['4 mg', '8 mg'] },
    { name: 'Finasterida', presets: ['1 mg', '5 mg'] },
    { name: 'Dutasterida', presets: ['0.5 mg'] },
    { name: 'Solifenacina', presets: ['5 mg', '10 mg'] },
    { name: 'Mirabegrón', presets: ['25 mg', '50 mg'] }
  ]},
  { group: 'Salud ósea', icon: '🦴', meds: [
    { name: 'Calcio + Vitamina D3', presets: ['500 mg', '1000 mg'] },
    { name: 'Colecalciferol (Vitamina D)', presets: ['1000 UI', '25000 UI'] },
    { name: 'Alendronato', presets: ['70 mg'] },
    { name: 'Denosumab', presets: ['60 mg'] },
    { name: 'Ácido zoledrónico', presets: ['5 mg'] }
  ]},
  { group: 'Gota e Hiperuricemia', icon: '🦶', meds: [
    { name: 'Alopurinol (Zyloric)', presets: ['100 mg', '200 mg', '300 mg'] },
    { name: 'Febuxostat', presets: ['80 mg', '120 mg'] },
    { name: 'Colchicina', presets: ['0.5 mg', '1 mg'] },
    { name: 'Benzbromarona', presets: ['100 mg'] },
    { name: 'Probenecid', presets: ['500 mg'] },
    { name: 'Prednisona (crisis de gota)', presets: ['30 mg'] }
  ]},
  { group: 'Antibióticos', icon: '🦠', meds: [
    { name: 'Amoxicilina', presets: ['500 mg', '875 mg'] },
    { name: 'Amoxicilina/Clavulánico', presets: ['500 mg', '875 mg'] },
    { name: 'Azitromicina', presets: ['250 mg', '500 mg'] },
    { name: 'Claritromicina', presets: ['250 mg', '500 mg'] },
    { name: 'Ciprofloxacino', presets: ['250 mg', '500 mg', '750 mg'] },
    { name: 'Levofloxacino', presets: ['500 mg'] },
    { name: 'Doxiciclina', presets: ['100 mg'] },
    { name: 'Fosfomicina', presets: ['3 g'] },
    { name: 'Nitrofurantoína', presets: ['50 mg', '100 mg'] }
  ]},
  { group: 'Antifúngicos y Antivirales', icon: '🧫', meds: [
    { name: 'Fluconazol', presets: ['50 mg', '150 mg', '200 mg'] },
    { name: 'Itraconazol', presets: ['100 mg'] },
    { name: 'Aciclovir', presets: ['200 mg', '400 mg', '800 mg'] },
    { name: 'Valaciclovir', presets: ['500 mg', '1000 mg'] }
  ]},
  { group: 'Digestivo / Gastrointestinal', icon: '🫃', meds: [
    { name: 'Metoclopramida', presets: ['10 mg'] },
    { name: 'Domperidona', presets: ['10 mg'] },
    { name: 'Ondansetrón', presets: ['4 mg', '8 mg'] },
    { name: 'Loperamida', presets: ['2 mg'] },
    { name: 'Simeticona', presets: ['40 mg', '125 mg'] },
    { name: 'Macrogol', presets: ['1 sobre', '2 sobres'] },
    { name: 'Plantago ovata', presets: ['1 sobre'] },
    { name: 'Bisacodilo', presets: ['5 mg'] },
    { name: 'Mebeverina', presets: ['135 mg', '200 mg'] },
    { name: 'Rifaximina', presets: ['550 mg'] }
  ]},
  { group: 'Salud mental / Antipsicóticos', icon: '🧠', meds: [
    { name: 'Quetiapina', presets: ['25 mg', '100 mg', '200 mg'] },
    { name: 'Olanzapina', presets: ['5 mg', '10 mg'] },
    { name: 'Risperidona', presets: ['1 mg', '2 mg'] },
    { name: 'Aripiprazol', presets: ['5 mg', '10 mg', '15 mg'] }
  ]},
  { group: 'Suplementos y Vitaminas', icon: '🌿', meds: [
    { name: 'Vitamina D3', presets: ['1000 UI', '2000 UI', '25000 UI'] },
    { name: 'Vitamina B12 (cianocobalamina)', presets: ['1000 mcg'] },
    { name: 'Ácido fólico', presets: ['0.4 mg', '5 mg'] },
    { name: 'Hierro / Ferroglicina sulfato', presets: ['100 mg'] },
    { name: 'Magnesio', presets: ['300 mg', '400 mg'] },
    { name: 'Zinc', presets: ['15 mg', '25 mg'] },
    { name: 'Omega-3 (EPA/DHA)', presets: ['1000 mg', '2000 mg'] },
    { name: 'Vitamina C', presets: ['500 mg', '1000 mg'] },
    { name: 'Coenzima Q10', presets: ['100 mg', '200 mg'] },
    { name: 'Complejo vitamínico B', presets: ['1 comprimido'] },
    { name: 'Multivitamínico', presets: ['1 comprimido'] },
    { name: 'Creatina monohidrato', presets: ['5 g'] },
    { name: 'Colágeno hidrolizado', presets: ['10 g'] },
    { name: 'Melatonina', presets: ['1 mg', '3 mg', '5 mg'] },
    { name: 'Probióticos', presets: ['1 cápsula'] }
  ]},
  { group: 'Péptidos y Tratamiento Inyectable', icon: '💉', meds: [
    { name: 'Retatrutide', presets: ['1 mg', '1.5 mg', '2 mg', '4 mg', '8 mg', '12 mg'] },
    { name: 'Tirzepatida', presets: ['2.5 mg', '5 mg', '7.5 mg', '10 mg', '15 mg'] },
    { name: 'Semaglutida', presets: ['0.25 mg', '0.5 mg', '1 mg', '2 mg'] },
    { name: 'Liraglutida', presets: ['0.6 mg', '1.2 mg', '1.8 mg'] },
    { name: 'BPC-157', presets: ['250 mcg', '500 mcg'] },
    { name: 'TB-500', presets: ['2.5 mg'] },
    { name: 'Ipamorelina', presets: ['100 mcg', '200 mcg'] },
    { name: 'CJC-1295', presets: ['100 mcg', '200 mcg'] },
    { name: 'Tesamorelina', presets: ['1 mg', '2 mg'] },
    { name: 'Somatropina (HGH)', presets: ['1 UI', '2 UI', '3 UI'] },
    { name: 'NAD+', presets: ['50 mg', '100 mg'] },
    { name: 'Glutatión', presets: ['100 mg', '200 mg'] }
  ]}
];

function escMedHtml(str) {
  return String(str === undefined || str === null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function initMedications() {
  const listEl = document.getElementById('medicationsList');
  const addBtn = document.getElementById('medAddBtn');
  const formCard = document.getElementById('medAddFormCard');
  const cancelBtn = document.getElementById('medCancelBtn');
  const dismissBtn = document.getElementById('medDismissBtn');
  const saveBtn = document.getElementById('medSaveBtn');
  const formTitle = document.getElementById('medFormTitle');

  const catSelect = document.getElementById('medCategorySelect');
  const typicalWrap = document.getElementById('medTypicalWrap');
  const typicalList = document.getElementById('medTypicalList');
  const typicalGroupName = document.getElementById('medTypicalGroupName');
  const doseWrap = document.getElementById('medDoseWrap');
  const dosePresets = document.getElementById('medDosePresets');
  const doseInput = document.getElementById('medDoseInput');
  const doseUnit = document.getElementById('medDoseUnit');
  const freqMode = document.getElementById('medFreqMode');
  const freqDaysRow = document.getElementById('medFreqDaysRow');
  const freqDays = document.getElementById('medFreqDays');
  const noteInput = document.getElementById('medNoteInput');
  const customName = document.getElementById('medCustomName');
  const copyBtn = document.getElementById('medCopyBtn');
  const shareBtn = document.getElementById('medShareBtn');

  if (!listEl) return;

  const STORAGE_KEY = 'mispep_medications';
  let meds = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  let editingId = null;
  let selectedMed = null;   // { name, groupName, presets }

  // Rellenar el selector de grupos
  if (catSelect) {
    catSelect.innerHTML = '<option value="">— Selecciona un grupo —</option>' +
      MED_CATALOG.map((g, i) => `<option value="${i}">${g.icon} ${escMedHtml(g.group)}</option>`).join('');
  }

  function freqLabel(m) {
    switch (m.freqMode) {
      case 'diario': return 'Diario';
      case 'semanal': return `${m.freqDays || 2} días/semana`;
      case 'alternos': return 'Días alternos';
      case 'semanas': return '1 vez/semana';
      case 'quincenal': return 'Cada 15 días';
      case 'mensual': return '1 vez al mes';
      case 'rescate': return 'A demanda';
      default: return 'Diario';
    }
  }

  function freqColor(m) {
    if (m.freqMode === 'diario') return { bg: 'rgba(16,185,129,0.15)', fg: '#34d399', bd: 'rgba(16,185,129,0.4)' };
    if (m.freqMode === 'rescate') return { bg: 'rgba(244,63,94,0.15)', fg: '#fb7185', bd: 'rgba(244,63,94,0.4)' };
    return { bg: 'rgba(245,158,11,0.15)', fg: '#fbbf24', bd: 'rgba(245,158,11,0.4)' };
  }

  function parseDoseUnit(preset) {
    if (!preset) return null;
    const m = String(preset).match(/^([\d.,]+)\s*(.*)$/);
    if (!m) return null;
    return { dose: m[1].replace(',', '.'), unit: (m[2] || '').trim() };
  }

  function renderList() {
    const total = meds.length;
    const daily = meds.filter(m => (m.freqMode || 'diario') === 'diario').length;
    const weekly = total - daily;

    const elT = document.getElementById('medSummaryTotal');
    const elD = document.getElementById('medSummaryDaily');
    const elW = document.getElementById('medSummaryWeekly');
    if (elT) elT.textContent = total;
    if (elD) elD.textContent = daily;
    if (elW) elW.textContent = weekly;

    if (total === 0) {
      listEl.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:26px 16px; font-size:0.88rem; line-height:1.5; background:var(--card-bg); border:1px dashed var(--border-color); border-radius:14px;">
        No tienes medicación registrada.<br>Pulsa <strong style="color:#22d3ee;">＋ Añadir Medicación o Suplemento</strong> para crear tu lista.
      </div>`;
      return;
    }

    listEl.innerHTML = meds.map((m, i) => {
      const fc = freqColor(m);
      const doseText = m.dose ? `${escMedHtml(m.dose)} ${escMedHtml(m.unit || '')}`.trim() : '—';
      return `
        <div style="background:var(--card-bg-elevated); border:1px solid var(--border-color); border-left:3px solid ${fc.fg}; border-radius:14px; padding:12px 13px; margin-bottom:10px; box-shadow:0 4px 12px var(--shadow-ambient);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
            <div style="flex:1; min-width:0;">
              <div style="font-size:1.02rem; font-weight:900; color:var(--text-main); line-height:1.25; word-break:break-word;">${escMedHtml(m.name)}</div>
              <div style="font-size:0.78rem; color:#22d3ee; font-weight:800; margin-top:3px;">${doseText}</div>
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
              <button type="button" class="icon-btn-3d" data-med-edit="${escMedHtml(m.id)}" title="Editar" style="width:34px; height:34px; font-size:0.95rem; background:linear-gradient(180deg, #1e3a5f 0%, #0f2137 100%); border-color:rgba(56,189,248,0.45);">✏️</button>
              <button type="button" class="icon-btn-3d" data-med-del="${escMedHtml(m.id)}" data-arm="0" title="Eliminar" style="width:34px; height:34px; font-size:0.95rem; background:linear-gradient(180deg, #4c1d2a 0%, #2a0f16 100%); border-color:rgba(244,63,94,0.45);">🗑️</button>
            </div>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:9px;">
            <span style="font-size:0.68rem; font-weight:800; padding:3px 9px; border-radius:9px; background:${fc.bg}; color:${fc.fg}; border:1px solid ${fc.bd};">${freqLabel(m)}</span>
            ${m.group ? `<span style="font-size:0.68rem; font-weight:700; padding:3px 9px; border-radius:9px; background:rgba(148,163,184,0.13); color:var(--text-secondary); border:1px solid var(--border-color);">${escMedHtml(m.group)}</span>` : ''}
          </div>
          ${m.note ? `<div style="font-size:0.74rem; color:var(--text-muted); margin-top:7px; line-height:1.4; font-style:italic;">📝 ${escMedHtml(m.note)}</div>` : ''}
        </div>
      `;
    }).join('');

    // Listeners: editar y eliminar (con doble toque de confirmación)
    listEl.querySelectorAll('[data-med-edit]').forEach(btn => {
      btn.addEventListener('click', () => openForEdit(btn.dataset.medEdit));
    });

    listEl.querySelectorAll('[data-med-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.medDel;
        if (btn.dataset.arm === '0') {
          btn.dataset.arm = '1';
          btn.textContent = '⚠️';
          btn.style.background = 'linear-gradient(180deg, #f43f5e 0%, #9f1239 100%)';
          btn.style.borderColor = '#f43f5e';
          showToast('Toca otra vez para confirmar la eliminación');
          setTimeout(() => {
            if (btn.dataset.arm === '1') {
              btn.dataset.arm = '0';
              btn.textContent = '🗑️';
              btn.style.background = 'linear-gradient(180deg, #4c1d2a 0%, #2a0f16 100%)';
              btn.style.borderColor = 'rgba(244,63,94,0.45)';
            }
          }, 3500);
        } else {
          removeMed(id);
        }
      });
    });
  }

  function saveAndRender() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meds));
    renderList();
  }

  function removeMed(id) {
    const idx = meds.findIndex(m => m.id === id);
    if (idx < 0) return;
    const name = meds[idx].name;
    meds.splice(idx, 1);
    saveAndRender();
    showToast(`${name} eliminado de la lista`);
  }

  function resetForm() {
    editingId = null;
    selectedMed = null;
    if (formTitle) formTitle.textContent = 'Nueva Medicación';
    if (catSelect) catSelect.value = '';
    if (typicalWrap) typicalWrap.style.display = 'none';
    if (typicalList) typicalList.innerHTML = '';
    if (doseWrap) doseWrap.style.display = 'none';
    if (dosePresets) dosePresets.innerHTML = '';
    if (doseInput) doseInput.value = '1';
    if (doseUnit) doseUnit.value = 'mg';
    if (freqMode) freqMode.value = 'diario';
    if (freqDaysRow) freqDaysRow.style.display = 'none';
    if (freqDays) freqDays.value = '2';
    if (noteInput) noteInput.value = '';
    if (customName) customName.value = '';
  }

  function showForm() {
    if (formCard) formCard.style.display = 'block';
    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function hideForm() {
    if (formCard) formCard.style.display = 'none';
    resetForm();
  }

  function renderDosePresets(presets) {
    if (!dosePresets) return;
    if (!presets || presets.length === 0) {
      dosePresets.innerHTML = '';
      return;
    }
    dosePresets.innerHTML = presets.map(p =>
      `<button type="button" class="pill-3d" data-dose-preset="${escMedHtml(p)}" style="padding:6px 10px; font-size:0.76rem;">${escMedHtml(p)}</button>`
    ).join('');

    dosePresets.querySelectorAll('[data-dose-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.dosePreset;
        const parsed = parseDoseUnit(p);
        if (parsed) {
          if (doseInput) doseInput.value = parsed.dose;
          if (doseUnit && parsed.unit) {
            const exists = Array.from(doseUnit.options).some(o => o.value === parsed.unit);
            if (exists) doseUnit.value = parsed.unit;
          }
        }
        dosePresets.querySelectorAll('[data-dose-preset]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  function renderTypicalMeds(groupIdx) {
    const g = MED_CATALOG[groupIdx];
    if (!g) return;
    if (typicalGroupName) typicalGroupName.textContent = `(${g.group})`;
    typicalList.innerHTML = g.meds.map((m, mi) =>
      `<div class="med-wheel-item" data-typical-g="${groupIdx}" data-typical-m="${mi}">${escMedHtml(m.name)}</div>`
    ).join('');
    typicalWrap.style.display = 'block';

    typicalList.querySelectorAll('[data-typical-m]').forEach(el => {
      el.addEventListener('click', () => {
        typicalList.querySelectorAll('.med-wheel-item').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        const gi = parseInt(el.dataset.typicalG, 10);
        const mi = parseInt(el.dataset.typicalM, 10);
        const grp = MED_CATALOG[gi];
        const med = grp && grp.meds[mi];
        if (!med) return;
        selectedMed = { name: med.name, groupName: grp.group, presets: med.presets };
        if (customName) customName.value = '';
        renderDosePresets(med.presets);
        doseWrap.style.display = 'block';

        // Precargar la primera dosis habitual
        const first = parseDoseUnit(med.presets[0]);
        if (first) {
          if (doseInput) doseInput.value = first.dose;
          if (doseUnit && first.unit && Array.from(doseUnit.options).some(o => o.value === first.unit)) {
            doseUnit.value = first.unit;
          }
        }
      });
    });
  }

  function openForEdit(id) {
    const m = meds.find(x => x.id === id);
    if (!m) return;
    resetForm();
    editingId = id;
    if (formTitle) formTitle.textContent = 'Editar Medicación';
    if (customName) customName.value = m.name;
    if (doseInput) doseInput.value = m.dose || '1';
    if (doseUnit) doseUnit.value = m.unit || 'mg';
    if (freqMode) freqMode.value = m.freqMode || 'diario';
    if (freqDays) freqDays.value = m.freqDays || 2;
    if (noteInput) noteInput.value = m.note || '';
    freqDaysRow.style.display = (m.freqMode === 'semanal') ? 'flex' : 'none';

    // Si coincide con el catálogo, restaurar grupo y medicamento
    if (m.group) {
      const gi = MED_CATALOG.findIndex(g => g.group === m.group);
      if (gi >= 0) {
        catSelect.value = String(gi);
        renderTypicalMeds(gi);
        doseWrap.style.display = 'block';
        const g = MED_CATALOG[gi];
        const med = g.meds.find(x => x.name === m.name);
        if (med) {
          selectedMed = { name: med.name, groupName: g.group, presets: med.presets };
          renderDosePresets(med.presets);
          const items = typicalList.querySelectorAll('.med-wheel-item');
          items.forEach(x => {
            if (x.textContent.trim() === med.name) x.classList.add('selected');
          });
        }
      }
    }
    showForm();
  }

  function buildDoctorText() {
    const hoy = new Date();
    const fecha = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
    const lineas = [
      'LISTA DE MEDICACIÓN ACTUAL',
      `Fecha: ${fecha}`,
      `Nº de fármacos y suplementos: ${meds.length}`,
      ''
    ];

    // Agrupar por grupo terapéutico; los sueltos van al final
    const grupos = {};
    const sueltos = [];
    meds.forEach(m => {
      if (m.group) {
        if (!grupos[m.group]) grupos[m.group] = [];
        grupos[m.group].push(m);
      } else {
        sueltos.push(m);
      }
    });

    let n = 1;
    Object.keys(grupos).forEach(g => {
      lineas.push(`— ${g.toUpperCase()} —`);
      grupos[g].forEach(m => {
        const doseTxt = m.dose ? `${m.dose} ${m.unit || ''}`.trim() : 'dosis no especificada';
        lineas.push(`${n}. ${m.name} — ${doseTxt} — ${freqLabel(m)}${m.note ? ` (${m.note})` : ''}`);
        n++;
      });
      lineas.push('');
    });

    if (sueltos.length) {
      lineas.push('— OTROS —');
      sueltos.forEach(m => {
        const doseTxt = m.dose ? `${m.dose} ${m.unit || ''}`.trim() : 'dosis no especificada';
        lineas.push(`${n}. ${m.name} — ${doseTxt} — ${freqLabel(m)}${m.note ? ` (${m.note})` : ''}`);
        n++;
      });
      lineas.push('');
    }

    lineas.push('Generado con MisPep — registro personal de medicación.');
    return lineas.join('\n');
  }

  function copyForDoctor() {
    const text = buildDoctorText();
    if (window.AndroidBridge && typeof window.AndroidBridge.copyToClipboard === 'function') {
      window.AndroidBridge.copyToClipboard(text);
      showToast('Lista copiada. Pégala en un mensaje o nota.');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast('Lista copiada al portapapeles'))
        .catch(() => showToast('No se pudo copiar la lista'));
      return;
    }
    showToast('Copia no disponible en este dispositivo');
  }

  function shareForDoctor() {
    const text = buildDoctorText();
    if (window.AndroidBridge && typeof window.AndroidBridge.shareText === 'function') {
      window.AndroidBridge.shareText(text, 'Lista de medicación actual');
      return;
    }
    if (navigator.share) {
      navigator.share({ title: 'Lista de medicación actual', text }).catch(() => {});
      return;
    }
    copyForDoctor();
  }

  // ---- Eventos ----
  if (addBtn) addBtn.addEventListener('click', () => {
    resetForm();
    const visible = formCard && formCard.style.display === 'block';
    if (visible) { hideForm(); } else { showForm(); }
  });
  if (cancelBtn) cancelBtn.addEventListener('click', hideForm);
  if (dismissBtn) dismissBtn.addEventListener('click', hideForm);

  if (catSelect) {
    catSelect.addEventListener('change', () => {
      const idx = parseInt(catSelect.value, 10);
      if (isNaN(idx)) {
        typicalWrap.style.display = 'none';
        doseWrap.style.display = 'none';
        selectedMed = null;
        return;
      }
      selectedMed = null;
      doseWrap.style.display = 'none';
      renderTypicalMeds(idx);
    });
  }

  if (freqMode) {
    freqMode.addEventListener('change', () => {
      freqDaysRow.style.display = (freqMode.value === 'semanal') ? 'flex' : 'none';
    });
  }

  if (customName) {
    customName.addEventListener('input', () => {
      // Al escribir a mano, se prioriza el nombre manual
      if (customName.value.trim().length > 0 && typicalList) {
        typicalList.querySelectorAll('.med-wheel-item').forEach(x => x.classList.remove('selected'));
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const manual = (customName ? customName.value : '').trim();
      let name = manual;
      let group = null;

      // Si el nombre escrito coincide con el del catálogo, conservar su grupo terapéutico
      if (selectedMed && (!manual || manual === selectedMed.name)) {
        name = selectedMed.name;
        group = selectedMed.groupName;
      }

      if (!name) {
        showToast('Selecciona un medicamento del grupo o escríbelo a mano');
        if (catSelect) catSelect.focus();
        return;
      }

      const dose = (doseInput ? doseInput.value : '').toString().trim();
      const unit = doseUnit ? doseUnit.value : 'mg';
      const mode = freqMode ? freqMode.value : 'diario';
      const days = Math.min(6, Math.max(1, parseInt(freqDays ? freqDays.value : 2, 10) || 2));
      const note = (noteInput ? noteInput.value : '').trim();

      const payload = {
        name,
        group,
        dose: dose || '',
        unit: unit || '',
        freqMode: mode,
        freqDays: mode === 'semanal' ? days : null,
        note
      };

      if (editingId) {
        const idx = meds.findIndex(m => m.id === editingId);
        if (idx >= 0) {
          meds[idx] = Object.assign({}, meds[idx], payload);
          showToast(`${name} actualizado`);
        }
      } else {
        payload.id = 'med-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
        payload.createdAt = new Date().toISOString();
        meds.push(payload);
        showToast(`${name} añadido a tu lista`);
        triggerHaptic(30);
      }

      saveAndRender();
      hideForm();
    });
  }

  if (copyBtn) copyBtn.addEventListener('click', copyForDoctor);
  if (shareBtn) shareBtn.addEventListener('click', shareForDoctor);

  renderList();
}

/* ===== Lista de medicamentos compartida con la Biblioteca de Péptidos ===== */
const MEDS_KEY = 'mispep_custom_meds';

function medsGuardados() {
  try {
    return JSON.parse(localStorage.getItem(MEDS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

/* Normaliza para comparar: quita el paréntesis aclaratorio, acentos, signos y la vocal final
   (así 'Retatrutida (LY3437943)' y 'Retatrutide' se reconocen como el mismo compuesto). */
function normalizaMed(n) {
  return String(n || '')
    .split(' (')[0]
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/[ae]$/, '');
}

function guardarMedEnRueda(name, cls) {
  const wheel = document.getElementById('addDoseMedWheel');
  if (!wheel || !name) return false;
  const buscado = normalizaMed(name);
  const ya = Array.from(wheel.querySelectorAll('.med-wheel-item'))
    .some(i => normalizaMed(i.dataset.med) === buscado);
  if (ya) return false;
  const div = document.createElement('div');
  div.className = 'med-wheel-item';
  div.dataset.med = name;
  div.dataset.class = cls || 'Medicamento personalizado';
  div.textContent = name;
  wheel.prepend(div);
  return true;
}

function guardarMedPersonalizado(name, cls) {
  const limpio = String(name || '').trim();
  if (!limpio) return false;
  const etiqueta = cls || 'Medicamento personalizado';
  const meds = medsGuardados();
  const existe = meds.some(m => normalizaMed(m.name) === normalizaMed(limpio));
  if (!existe) {
    meds.push({ name: limpio, cls: etiqueta });
    try { localStorage.setItem(MEDS_KEY, JSON.stringify(meds)); } catch (e) {}
  }
  guardarMedEnRueda(limpio, etiqueta);
  return !existe;
}

function peptidoEnMedicamentos(name) {
  const buscado = normalizaMed(name);
  if (!buscado) return false;
  if (medsGuardados().some(m => normalizaMed(m.name) === buscado)) return true;
  const wheel = document.getElementById('addDoseMedWheel');
  if (!wheel) return false;
  return Array.from(wheel.querySelectorAll('.med-wheel-item'))
    .some(i => normalizaMed(i.dataset.med) === buscado);
}

function addPeptideToMeds(name, cat, btn) {
  const nuevo = guardarMedPersonalizado(name, 'Péptido · ' + (cat || 'Biblioteca'));
  if (btn) {
    btn.textContent = '✓ En la lista de medicamentos';
    btn.disabled = true;
    btn.style.opacity = '0.7';
  }
  if (typeof triggerHaptic === 'function') triggerHaptic(12);
  if (typeof showToast === 'function') {
    showToast(nuevo
      ? '✓ ' + name + ' añadido a la lista de medicamentos'
      : '↺ ' + name + ' ya estaba en la lista');
  }
  return nuevo;
}

function restaurarMedsGuardados() {
  const wheel = document.getElementById('addDoseMedWheel');
  if (!wheel) return 0;
  const meds = medsGuardados();
  let n = 0;
  meds.slice().reverse().forEach(m => {
    if (m && m.name && guardarMedEnRueda(m.name, m.cls)) n++;
  });
  return n;
}

/* ============================================================
   MÓDULO ¿CUÁNTO DURA EL PÉPTIDO? — estimador de estabilidad
   ============================================================ */
window.initDuracionEstimador = function initDuracionEstimador() {
  const result = document.getElementById('durResult');
  const formPills = Array.from(document.querySelectorAll('#durFormPills .pill-3d'));
  const tempPills = Array.from(document.querySelectorAll('#durTempPills .pill-3d'));
  if (!result || formPills.length === 0 || tempPills.length === 0) return;

  const ESTIMACIONES_ES = {
    'liof|cong': '<strong style="color:var(--primary)">12 a 24 meses</strong> — la referencia clásica del polvo a -20 °C: si no lo vas a tocar, aquí está en casa.',
    'liof|frio': '<strong style="color:var(--primary)">Varios meses</strong> — correcto en 2-8 °C para uso regular. Si la cosa se alarga, mejor pasarla al congelador.',
    'liof|amb': '<strong style="color:var(--amber)">Días a semanas</strong> — el liofilizado aguanta el envío, pero minimiza cada minuto fuera del frío.',
    'sol|cong': '<strong style="color:#f0a08a;">No recomendado</strong> — los ciclos de hielo-descongelación rompen la estructura. Solo alícuotas de un solo uso si es imprescindible.',
    'sol|frio': '<strong style="color:var(--primary)">4 a 8 semanas</strong> — la ventana ideal de la solución (máximo ~3 meses) con frío constante y protegido de la luz.',
    'sol|amb': '<strong style="color:#f0a08a;">Horas a pocos días</strong> — solo fuera del frío para manipular y vuelta a la nevera enseguida.'
  };

  const ESTIMACIONES_EN = {
    'liof|cong': '<strong style="color:var(--primary)">12 to 24 months</strong> — classic benchmark for lyophilized powder at -20 °C: optimal long-term storage.',
    'liof|frio': '<strong style="color:var(--primary)">Several months</strong> — acceptable at 2-8 °C for active use. For extended storage, freezer is preferred.',
    'liof|amb': '<strong style="color:var(--amber)">Days to weeks</strong> — powder withstands transit, but minimize time spent outside cold storage.',
    'sol|cong': '<strong style="color:#f0a08a;">Not recommended</strong> — freeze-thaw cycles break down peptide chains. Single-use aliquots only if strictly necessary.',
    'sol|frio': '<strong style="color:var(--primary)">4 to 8 weeks</strong> — ideal window for reconstituted solution (up to ~3 months) with steady cold and light shielding.',
    'sol|amb': '<strong style="color:#f0a08a;">Hours to few days</strong> — keep at room temp only while handling, then return to refrigerator immediately.'
  };

  let forma = 'liof';
  let temp = 'frio';

  function pintar() {
    const isEn = window.MISPEP_I18N && window.MISPEP_I18N.getLang() === 'en';
    const dict = isEn ? ESTIMACIONES_EN : ESTIMACIONES_ES;
    result.innerHTML = dict[forma + '|' + temp] || (isEn ? 'Choose state and storage.' : 'Elige forma y conservación.');
    if (typeof triggerHaptic === 'function') triggerHaptic(10);
  }

  formPills.forEach(pill => pill.addEventListener('click', () => {
    formPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    forma = pill.dataset.durForm;
    pintar();
  }));
  tempPills.forEach(pill => pill.addEventListener('click', () => {
    tempPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    temp = pill.dataset.durTemp;
    pintar();
  }));

  pintar();
};

window.initDuracionEstimador();

// Sincronización instantánea de cambio de idioma: kg <-> lb y textos
window.addEventListener('languageChanged', () => {
  if (typeof refrescarBotonHealthConnect === 'function') refrescarBotonHealthConnect();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof loadHealthDashboard === 'function') loadHealthDashboard();
  if (typeof renderWeightGraph === 'function') renderWeightGraph();
  if (typeof renderWeightGoal === 'function') renderWeightGoal();
  if (typeof currentWZoomCenterIdx !== 'undefined' && currentWZoomCenterIdx >= 0) {
    const zoomSheet = document.getElementById('weightZoomSheetBackdrop');
    if (zoomSheet && zoomSheet.classList.contains('open') && typeof renderWeightZoomView === 'function') {
      renderWeightZoomView(currentWZoomCenterIdx);
    }
  }
  const weightBackdrop = document.getElementById('weightHistoryBackdrop');
  if (weightBackdrop && weightBackdrop.classList.contains('open') && typeof renderWeightModalRecords === 'function') {
    renderWeightModalRecords();
  }
});

