/* ═══════════════════════════════════════════════════════════════
   JOMAXPATH — theme.js
   Dark/Light mode: FOUC prevention + toggle + system preference sync
   Ha de carregar-se com a PRIMER script del <head> (sense defer/async)
═══════════════════════════════════════════════════════════════ */

/* ── IIFE: aplica el tema ABANS de pintar res → evita FOUC ── */
(function () {
  'use strict';
  var CFG_KEY   = 'jomaxpath_config_v1';
  var THEME_KEY = 'jomaxpath-theme'; // key pròpia per al toggle ràpid

  function _resolveTheme() {
    // 1. Prioritat: toggle ràpid (no canvia el tema del selector de temes)
    var quick = localStorage.getItem(THEME_KEY);
    if (quick === 'light' || quick === 'dark') return quick;

    // 2. Sistema de temes existent (CONFIG_KEY)
    try {
      var cfg = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      if (cfg.theme === 'blanc') return 'light';
    } catch (_) {}

    // 3. Preferència del sistema operatiu
    try {
      if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    } catch (_) {}

    return 'dark'; // default — l'app ja és fosca
  }

  var theme = _resolveTheme();
  document.documentElement.setAttribute('data-theme', theme);

  // Aplica la classe body si DOM ja existeix (cas raríssim, però segur)
  if (document.body && theme === 'light') {
    document.body.classList.add('theme-blanc');
  }
})();

/* ── Sincronitza la classe body quan el DOM estigui llest ── */
document.addEventListener('DOMContentLoaded', function () {
  var theme = document.documentElement.getAttribute('data-theme') || 'dark';
  if (theme === 'light') document.body.classList.add('theme-blanc');
  _updateThemeToggleIcon(theme);
});

/* ════════════════════════════════════════════════════════════
   API PÚBLICA
════════════════════════════════════════════════════════════ */

/** Alterna entre dark i light. Ponts amb el sistema existent setTheme(). */
function toggleTheme() {
  var html    = document.documentElement;
  var current = html.getAttribute('data-theme') || 'dark';
  var next    = current === 'dark' ? 'light' : 'dark';

  html.setAttribute('data-theme', next);
  localStorage.setItem('jomaxpath-theme', next);

  if (next === 'light') {
    document.body.classList.add('theme-blanc');
    // Pont amb el sistema de temes existent (carregat amb app.js)
    if (typeof setTheme === 'function') {
      try { setTheme('blanc'); } catch (_) {}
    } else {
      // setTheme no disponible encara — aplica la classe directament
      // i sincronitza el CONFIG_KEY perquè applyStoredTheme ho recordi
      var CFG_KEY = 'jomaxpath_config_v1';
      try {
        var cfg = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
        cfg.theme = 'blanc';
        localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
      } catch (_) {}
    }
  } else {
    document.body.classList.remove('theme-blanc');
    if (typeof setTheme === 'function') {
      try { setTheme('default'); } catch (_) {}
    } else {
      var CFG_KEY2 = 'jomaxpath_config_v1';
      try {
        var cfg2 = JSON.parse(localStorage.getItem(CFG_KEY2) || '{}');
        cfg2.theme = 'default';
        localStorage.setItem(CFG_KEY2, JSON.stringify(cfg2));
      } catch (_) {}
    }
  }

  _updateThemeToggleIcon(next);
}

function _updateThemeToggleIcon(theme) {
  var row = document.getElementById('theme-toggle-btn');
  if (row) {
    var ico = row.querySelector('span:first-child');
    if (ico) ico.textContent = theme === 'dark' ? '☀️' : '🌙';
    row.title = theme === 'dark' ? 'Canviar a mode clar' : 'Canviar a mode fosc';
    row.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
  }
}

/* ── Escolta canvis de preferència del sistema ── */
try {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    // Només actua si l'usuari NO ha fet cap elecció manual
    var hasManual = localStorage.getItem('jomaxpath-theme');
    try {
      var cfg = JSON.parse(localStorage.getItem('jomaxpath_config_v1') || '{}');
      if (cfg.theme && cfg.theme !== 'default') hasManual = true;
    } catch (_) {}

    if (!hasManual) {
      var newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      if (newTheme === 'light') document.body.classList.add('theme-blanc');
      else document.body.classList.remove('theme-blanc');
      _updateThemeToggleIcon(newTheme);
    }
  });
} catch (_) {}
