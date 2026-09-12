/* ═══════════════════════════════════════════════════════════
   JOMAXPATH — analytics.js  (Millora 9)
   Estadístiques de productivitat llegides de localStorage
═══════════════════════════════════════════════════════════ */
'use strict';

/* ── Variables de charts (per destruir-los en re-render) ── */
let _chartWeekly = null, _chartHours = null, _chartPomo = null;

/* ── Paleta consistent amb el projecte ── */
const _C = {
  accent:  '#7c3aed',
  accent2: '#a78bfa',
  green:   '#10b981',
  orange:  '#f59e0b',
  red:     '#ef4444',
  blue:    '#3b82f6',
  grid:    'rgba(255,255,255,0.06)',
  tick:    '#64748b',
};

/* ═══════════════════════════════════════════════════════════
   FASE 2 — CÀRREGA DE DADES des de localStorage
═══════════════════════════════════════════════════════════ */
function _loadLocalData(days = 90) {
  const cutoff = Date.now() - days * 864e5;

  /* Tasques de totes les llistes */
  let tasks = [];
  try {
    const lists = JSON.parse(localStorage.getItem('jomaxpath_lists_v3') || '[]');
    lists.forEach(l => (l.tasks || []).forEach(t => {
      if (t.done) {
        // Creation time is not evidence of completion time.
        const timestamp = t.completed_at ? new Date(t.completed_at).getTime() : 0;
        const ts = Number.isFinite(timestamp) ? timestamp : 0;
        tasks.push({ ...t, _ts: ts, listName: l.name || '' });
      }
    }));
  } catch {}

  /* Hàbits */
  let habits = [];
  try { habits = JSON.parse(localStorage.getItem('jomaxpath_habits_v2') || '[]'); } catch {}

  /* Pomodoro */
  let pomoData = {};
  try { pomoData = JSON.parse(localStorage.getItem('jomaxpath_pomo_v2') || '{}'); } catch {}

  /* Streak */
  let streakData = {};
  try { streakData = JSON.parse(localStorage.getItem('jomaxpath_streak_v2') || '{}'); } catch {}

  /* Perfil (RPG) */
  let profile = {};
  try { profile = JSON.parse(localStorage.getItem('jomaxpath_hero_v2') || '{}'); } catch {}

  return { tasks, habits, pomoData, streakData, profile, cutoff };
}

function analyticsSummary(tasks, now = Date.now()) {
  const week = 7 * 864e5;
  const dated = tasks.filter(task => task._ts > 0 && task._ts <= now);
  const recent = dated.filter(task => task._ts >= now - week).length;
  const previous = dated.filter(task => task._ts >= now - 2 * week && task._ts < now - week).length;
  const unknown = tasks.filter(task => !task._ts).length;
  let message = `Has completat ${recent} ${recent===1?'tasca':'tasques'} els últims 7 dies.`;
  if (previous > 0) {
    const change = Math.round((recent - previous) / previous * 100);
    message += change === 0 ? ' El mateix nombre que els 7 dies anteriors.' : ` Un ${Math.abs(change)}% ${change > 0 ? 'més' : 'menys'} que els 7 dies anteriors.`;
  }
  if (!dated.length) message = 'Encara no hi ha tasques amb data de completat per comparar el progrés.';
  if (unknown) message += ` ${unknown} tasques antigues no tenen data de completat i no s’inclouen als gràfics temporals.`;
  return message;
}

/* ═══════════════════════════════════════════════════════════
   FASE 3 — STAT CARDS
═══════════════════════════════════════════════════════════ */
function _renderStatCards(data, period) {
  const { tasks, habits, pomoData, streakData, profile } = data;
  const weekMs = 7 * 864e5;
  const weekCutoff = Date.now() - weekMs;
  const periodCutoff = Date.now() - period * 864e5;

  const tasksInPeriod = tasks.filter(t => t._ts >= periodCutoff).length;
  const totalPomos = pomoData.total || 0;
  const pomoToday = pomoData.today || 0;
  const streakCount = streakData.count || 0;
  const rpgLevel = profile.level || 1;

  const cards = [
    { label: `Tasques (${period}d)`, value: tasksInPeriod, icon: '✅', color: _C.green },
    { label: 'Pomodoros totals', value: totalPomos, icon: '🍅', color: _C.orange },
    { label: 'Ratxa actual', value: streakCount + ' dies', icon: '🔥', color: _C.red },
    { label: 'Nivell RPG', value: 'Nv. ' + rpgLevel, icon: '⭐', color: _C.accent },
  ];

  const container = document.getElementById('stats-cards');
  if (!container) return;
  container.innerHTML = cards.map(c => `
    <div class="stat-card" style="border-left:3px solid ${c.color}">
      <div class="stat-card-icon">${c.icon}</div>
      <div class="stat-card-value">${c.value}</div>
      <div class="stat-card-label">${c.label}</div>
    </div>
  `).join('');
}

/* ═══════════════════════════════════════════════════════════
   FASE 4 — HEATMAP (90 dies, estil GitHub)
═══════════════════════════════════════════════════════════ */
function _renderHeatmap(tasks) {
  const container = document.getElementById('heatmap-container');
  if (!container) return;

  /* Agrupa per dia (ISO date string) */
  const byDay = {};
  tasks.forEach(t => {
    if (!t._ts) return;
    const day = _localDateStr(new Date(t._ts));
    byDay[day] = (byDay[day] || 0) + 1;
  });

  /* Genera els últims 91 dies (alineats a dilluns) */
  const days = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    days.push(_localDateStr(d));
  }

  const maxCount = Math.max(...Object.values(byDay), 1);
  const getColor = n => {
    if (!n) return 'rgba(255,255,255,0.05)';
    const r = n / maxCount;
    if (r < 0.25) return 'rgba(124,58,237,0.25)';
    if (r < 0.5)  return 'rgba(124,58,237,0.5)';
    if (r < 0.75) return 'rgba(124,58,237,0.75)';
    return '#7c3aed';
  };

  container.innerHTML = days.map(day => {
    const n = byDay[day] || 0;
    const label = new Date(day + 'T00:00:00').toLocaleDateString('ca-ES',
      { weekday: 'short', day: 'numeric', month: 'short' });
    return `<div class="heatmap-cell" style="background:${getColor(n)}"
      title="${label}: ${n} ${n===1?'tasca':'tasques'}" aria-label="${label}: ${n} ${n===1?'tasca':'tasques'}"></div>`;
  }).join('');

  /* Llegenda */
  const legend = document.getElementById('heatmap-legend-cells');
  if (legend) {
    legend.innerHTML = ['rgba(255,255,255,0.05)', 'rgba(124,58,237,0.25)',
      'rgba(124,58,237,0.5)', 'rgba(124,58,237,0.75)', '#7c3aed']
      .map(c => `<div class="heatmap-cell" style="background:${c}"></div>`).join('');
  }
}

/* ═══════════════════════════════════════════════════════════
   FASE 5 — GRÀFICS Chart.js
═══════════════════════════════════════════════════════════ */

/* Gràfic 1: Tasques per setmana (línia) */
function _renderWeeklyChart(tasks, period) {
  const ctx = document.getElementById('weekly-tasks-chart');
  if (!ctx || !window.Chart) return;
  if (_chartWeekly) { _chartWeekly.destroy(); _chartWeekly = null; }

  const numWeeks = Math.min(Math.ceil(period / 7), 12);
  const weeks = [];
  for (let i = numWeeks - 1; i >= 0; i--) {
    const wStart = new Date(Date.now() - (i + 1) * 7 * 864e5);
    const wEnd   = new Date(Date.now() - i * 7 * 864e5);
    const label  = wStart.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' });
    const count  = tasks.filter(t => t._ts >= wStart.getTime() && t._ts < wEnd.getTime()).length;
    weeks.push({ label, count });
  }

  _chartWeekly = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weeks.map(w => w.label),
      datasets: [{
        label: 'Tasques',
        data: weeks.map(w => w.count),
        borderColor: _C.accent,
        backgroundColor: 'rgba(124,58,237,0.12)',
        borderWidth: 2, fill: true, tension: 0.4,
        pointBackgroundColor: _C.accent, pointRadius: 4, pointHoverRadius: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, color: _C.tick }, grid: { color: _C.grid } },
        x: { ticks: { color: _C.tick, maxRotation: 45 }, grid: { display: false } },
      },
    },
  });
}

/* Gràfic 2: Hora del dia (barres) */
function _renderHoursChart(tasks) {
  const ctx = document.getElementById('hours-chart');
  if (!ctx || !window.Chart) return;
  if (_chartHours) { _chartHours.destroy(); _chartHours = null; }

  const counts = Array(24).fill(0);
  tasks.forEach(t => { if (t._ts) counts[new Date(t._ts).getHours()]++; });
  const max = Math.max(...counts, 1);

  _chartHours = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
      datasets: [{
        data: counts,
        backgroundColor: counts.map(n => `rgba(124,58,237,${(0.2 + (n / max) * 0.8).toFixed(2)})`),
        borderRadius: 4, borderSkipped: false,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, display: false },
        x: {
          ticks: { color: _C.tick, maxRotation: 0,
            callback: (_, i) => i % 6 === 0 ? `${i}h` : '' },
          grid: { display: false },
        },
      },
    },
  });
}

/* Gràfic 3: Pomodoros (últimes setmanes, barra) */
function _renderPomoChart(pomoData, period) {
  const ctx = document.getElementById('pomo-chart');
  if (!ctx || !window.Chart) return;
  if (_chartPomo) { _chartPomo.destroy(); _chartPomo = null; }

  /* Only dated daily data and the recorded lifetime total are reliable here. */
  const today = pomoData.todayDate===new Date().toDateString() ? pomoData.today || 0 : 0;
  const total = pomoData.total || 0;

  /* The legacy week counter has no week boundary, so do not label it as this week. */
  _chartPomo = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Avui', 'Total'],
      datasets: [{
        data: [today, total],
        backgroundColor: [_C.orange, _C.accent, _C.green],
        borderRadius: 8, borderSkipped: false,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, color: _C.tick }, grid: { color: _C.grid } },
        x: { ticks: { color: _C.tick }, grid: { display: false } },
      },
    },
  });
}

/* ═══════════════════════════════════════════════════════════
   FASE 6 — HÀBITS: ratxa actual i millor
═══════════════════════════════════════════════════════════ */
function _calcHabitStreaks(habit) {
  const days = [...new Set(habit.days || [])].filter(day=>Number.isFinite(new Date(day).getTime())).sort((a,b)=>new Date(a)-new Date(b));
  if (!days.length) return { current: 0, best: 0 };

  let current = 0, best = 0, streak = 1;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 864e5).toDateString();

  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = Math.round((curr - prev) / 864e5);
    if (diff === 1) { streak++; } else { best = Math.max(best, streak); streak = 1; }
  }
  best = Math.max(best, streak);

  /* Ratxa actual: compta des d'ahir o avui cap enrere */
  const lastDay = days[days.length - 1];
  if (lastDay === today || lastDay === yesterday) {
    current = streak;
  }

  return { current, best };
}

function _renderHabitsStats(habits) {
  const container = document.getElementById('habits-stats');
  if (!container) return;

  if (!habits.length) {
    container.innerHTML = '<p style="color:var(--muted);font-size:12px;text-align:center;padding:20px 0;">Cap hàbit configurat encara</p>';
    return;
  }

  container.innerHTML = habits.map(h => {
    const { current, best } = _calcHabitStreaks(h);
    const pct = best > 0 ? Math.min(100, Math.round((current / best) * 100)) : 0;
    return `
      <div class="habit-stat-row">
        <div class="habit-stat-header">
          <span class="habit-stat-name">${h.icon || '🔥'} ${(h.name || '').replace(/</g,'&lt;')}</span>
          <span class="habit-stat-numbers">
            <strong>${current}</strong> dies
            <span class="habit-stat-best">(millor: ${best})</span>
          </span>
        </div>
        <div class="habit-stat-bar">
          <div class="habit-stat-fill" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════
   FASE 8 — SKELETON LOADING
═══════════════════════════════════════════════════════════ */
function _showAnalyticsSkeleton() {
  const cards = document.getElementById('stats-cards');
  if (cards) cards.innerHTML = Array(4).fill(`
    <div class="stat-card">
      <div class="skeleton" style="width:30px;height:30px;border-radius:50%;margin-bottom:8px"></div>
      <div class="skeleton" style="width:55%;height:22px;margin-bottom:6px"></div>
      <div class="skeleton" style="width:80%;height:12px"></div>
    </div>`).join('');

  const heatmap = document.getElementById('heatmap-container');
  if (heatmap) heatmap.innerHTML = Array(91).fill(
    '<div class="heatmap-cell skeleton"></div>').join('');
}

/* ═══════════════════════════════════════════════════════════
   FUNCIÓ PRINCIPAL
═══════════════════════════════════════════════════════════ */
function renderAnalytics() {
  _showAnalyticsSkeleton();

  const periodEl = document.getElementById('analytics-period');
  const period = parseInt(periodEl?.value || '30', 10);

  /* Petit delay per mostrar el skeleton */
  setTimeout(() => {
    const data = _loadLocalData(period);
    const summary = document.getElementById('analytics-summary');
    if (summary) summary.textContent = analyticsSummary(data.tasks);
    _renderStatCards(data, period);
    _renderHeatmap(data.tasks); // sempre 90 dies
    _renderWeeklyChart(data.tasks, period);
    _renderHoursChart(data.tasks.filter(task=>task._ts>=data.cutoff && task._ts<=Date.now()));
    _renderPomoChart(data.pomoData, period);
    _renderHabitsStats(data.habits);
  }, 80);
}

/* Canvi de període */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('analytics-period')
    ?.addEventListener('change', renderAnalytics);
});

/* ═══════════════════════════════════════════════════════════
   CSS INJECTAT — styles per a la pantalla d'estadístiques
═══════════════════════════════════════════════════════════ */
(function _injectAnalyticsCSS() {
  if (document.getElementById('analytics-css')) return;
  const style = document.createElement('style');
  style.id = 'analytics-css';
  style.textContent = `
/* ── Stat cards ── */
.stats-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
@media (max-width: 767px) {
  .stats-cards-grid { grid-template-columns: repeat(2, 1fr); }
}
.stat-card {
  background: var(--card, #0e0e1e);
  border: 1px solid var(--border, rgba(124,58,237,0.18));
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-card-icon { font-size: 22px; margin-bottom: 2px; }
.stat-card-value { font-size: 22px; font-weight: 700; color: var(--text, #e2e8f0); }
.stat-card-label { font-size: 11px; color: var(--muted, #64748b); font-family: 'Space Mono', monospace; }

/* ── Heatmap ── */
.heatmap-grid {
  display: grid;
  grid-template-rows: repeat(7, 13px);
  grid-auto-flow: column;
  gap: 2px;
}
.heatmap-cell {
  width: 13px; height: 13px;
  border-radius: 2px; cursor: pointer;
  transition: opacity 0.15s;
}
.heatmap-cell:hover { opacity: 0.7; }
.heatmap-labels-days {
  display: grid;
  grid-template-rows: repeat(7, 13px);
  gap: 2px;
  font-size: 9px;
  color: var(--muted, #64748b);
  align-items: center;
  flex-shrink: 0;
}
.heatmap-legend {
  display: flex; align-items: center; gap: 6px;
  margin-top: 10px; font-size: 10px; color: var(--muted, #64748b);
  font-family: 'Space Mono', monospace;
}
.heatmap-legend-cells { display: flex; gap: 2px; }

/* ── Charts grid ── */
.analytics-charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
@media (max-width: 767px) {
  .analytics-charts-grid { grid-template-columns: 1fr; }
}

/* ── Analytics card ── */
.analytics-card {
  background: var(--card, #0e0e1e);
  border: 1px solid var(--border, rgba(124,58,237,0.18));
  border-radius: 14px;
  padding: 16px 18px;
}
.analytics-card-title {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--muted, #64748b);
  margin-bottom: 16px;
}

/* ── Hàbits stats ── */
.habit-stat-row { margin-bottom: 14px; }
.habit-stat-header {
  display: flex; justify-content: space-between;
  align-items: center; margin-bottom: 6px; font-size: 12px;
}
.habit-stat-name { color: var(--text, #e2e8f0); font-weight: 500; }
.habit-stat-numbers { color: var(--muted, #64748b); font-size: 11px; }
.habit-stat-best { font-size: 10px; color: var(--muted, #64748b); opacity: 0.7; }
.habit-stat-bar {
  height: 5px; background: rgba(255,255,255,0.07);
  border-radius: 3px; overflow: hidden;
}
.habit-stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #7c3aed, #10b981);
  border-radius: 3px; transition: width 0.8s ease;
}

/* ── Skeleton loading ── */
.skeleton {
  background: linear-gradient(90deg,
    var(--card, #0e0e1e) 25%,
    rgba(255,255,255,0.06) 50%,
    var(--card, #0e0e1e) 75%);
  background-size: 200% 100%;
  animation: skeletonPulse 1.5s infinite;
  border-radius: 6px;
}
@keyframes skeletonPulse {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Tema blanc ── */
body.theme-blanc .analytics-card,
body.theme-blanc .stat-card {
  background: #fff !important;
  border-color: rgba(109,40,217,0.12) !important;
}
body.theme-blanc .analytics-card-title,
body.theme-blanc .stat-card-label,
body.theme-blanc .habit-stat-numbers { color: #64748b !important; }
body.theme-blanc .stat-card-value { color: #1a1a2e !important; }
body.theme-blanc .habit-stat-bar { background: rgba(0,0,0,0.07) !important; }
body.theme-blanc .skeleton { background: linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%) !important; background-size: 200% 100% !important; }
`;
  document.head.appendChild(style);
})();
