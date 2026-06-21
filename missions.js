/* ═══════════════════════════════════════════════════════════════
   JOMAXPATH — missions.js
   Missions diàries: generació, tracking, recompenses
   Depèn de: _supabase, _currentUser, showToast, awardXP, awardGold (globals)
═══════════════════════════════════════════════════════════════ */
'use strict';

/* ─── Pool de missions possibles ─── */
const _MISSION_POOL = [
  { id:'tasks3',   text:'Completa 3 tasques avui',              type:'task',    target:3, reward_xp:30, reward_gold:15 },
  { id:'tasks5',   text:'Completa 5 tasques avui',              type:'task',    target:5, reward_xp:50, reward_gold:25 },
  { id:'tasks7',   text:'Completa 7 tasques avui',              type:'task',    target:7, reward_xp:70, reward_gold:35 },
  { id:'pomo2',    text:'Fes 2 Pomodoros',                      type:'pomodoro',target:2, reward_xp:20, reward_gold:10 },
  { id:'pomo3',    text:'Fes 3 Pomodoros',                      type:'pomodoro',target:3, reward_xp:35, reward_gold:18 },
  { id:'pomo4',    text:'Fes 4 Pomodoros',                      type:'pomodoro',target:4, reward_xp:50, reward_gold:25 },
  { id:'habit1',   text:'Completa 1 hàbit',                     type:'habit',   target:1, reward_xp:15, reward_gold:5  },
  { id:'habit2',   text:'Completa 2 hàbits',                    type:'habit',   target:2, reward_xp:25, reward_gold:12 },
  { id:'taskhigh', text:'Completa una tasca d\'alta prioritat', type:'task_high',target:1,reward_xp:40, reward_gold:20 },
  { id:'ai',       text:'Usa el Julians AI',                    type:'ai',      target:1, reward_xp:10, reward_gold:5  },
  { id:'streak',   text:'Manté la teva ratxa avui',             type:'streak',  target:1, reward_xp:20, reward_gold:10 },
  { id:'newtasks', text:'Afegeix 2 tasques noves',              type:'new_task',target:2, reward_xp:15, reward_gold:8  },
];

/* ─── Cache de missions d'avui ─── */
let _todayMissions = null;
let _missionDate   = '';

function _todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/* ════════════════════════════════════════════════════════════
   GENERA O CARREGA MISSIONS DIÀRIES
════════════════════════════════════════════════════════════ */
async function generateDailyMissions(userId) {
  if (!userId || userId.startsWith('local_')) return _getLocalMissions();
  if (!window._supabase) return _getLocalMissions();

  const today = _todayStr();
  if (_todayMissions && _missionDate === today) return _todayMissions;

  try {
    // Comprova si ja existeixen missions per avui
    const { data: existing } = await window._supabase
      .from('daily_missions')
      .select('missions')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing?.missions) {
      _todayMissions = existing.missions;
      _missionDate = today;
      return _todayMissions;
    }

    // Genera 3 missions aleatòries
    const missions = _pickMissions(3);

    const { data: inserted } = await window._supabase
      .from('daily_missions')
      .insert({ user_id: userId, date: today, missions })
      .select('missions')
      .single();

    _todayMissions = inserted?.missions || missions;
    _missionDate = today;
    return _todayMissions;
  } catch (e) {
    console.warn('[Missions] generateDailyMissions error:', e.message);
    return _getLocalMissions();
  }
}

function _pickMissions(n) {
  const shuffled = [..._MISSION_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n).map(m => ({
    id: m.id + '_' + Date.now(),
    pool_id: m.id,
    text: m.text,
    type: m.type,
    target: m.target,
    progress: 0,
    completed: false,
    reward_xp: m.reward_xp,
    reward_gold: m.reward_gold
  }));
}

function _getLocalMissions() {
  const today = _todayStr();
  try {
    const stored = JSON.parse(localStorage.getItem('jomaxpath_missions_v1') || 'null');
    if (stored?.date === today) { _todayMissions = stored.missions; _missionDate = today; return stored.missions; }
  } catch (_) {}
  const missions = _pickMissions(3);
  try { localStorage.setItem('jomaxpath_missions_v1', JSON.stringify({ date: today, missions })); } catch (_) {}
  _todayMissions = missions;
  _missionDate = today;
  return missions;
}

/* ════════════════════════════════════════════════════════════
   ACTUALITZA PROGRÉS D'UNA MISSIÓ
════════════════════════════════════════════════════════════ */
async function updateMissionProgress(missionType, extraData) {
  const uid = window._currentUser?.id;
  const today = _todayStr();

  if (!_todayMissions || _missionDate !== today) {
    await generateDailyMissions(uid);
  }
  if (!_todayMissions) return;

  let changed = false;

  for (const m of _todayMissions) {
    if (m.completed) continue;

    const matches = _missionMatches(m, missionType, extraData);
    if (!matches) continue;

    m.progress = (m.progress || 0) + 1;
    changed = true;

    if (m.progress >= m.target) {
      m.completed = true;
      // Atorga recompenses
      if (uid && !uid.startsWith('local_')) {
        await awardXP(uid,   m.reward_xp,   'mission');
        await awardGold(uid, m.reward_gold, 'mission');
      }
      if (typeof showToast === 'function')
        showToast('🎯 Missió completada: "' + m.text + '"! +' + m.reward_xp + ' XP +' + m.reward_gold + ' 🪙');
    }
  }

  if (!changed) return;

  // Persisteix
  if (uid && !uid.startsWith('local_') && window._supabase) {
    try {
      await window._supabase
        .from('daily_missions')
        .update({ missions: _todayMissions })
        .eq('user_id', uid)
        .eq('date', today);
    } catch (e) {
      console.warn('[Missions] updateMissionProgress error:', e.message);
    }
  } else {
    try { localStorage.setItem('jomaxpath_missions_v1', JSON.stringify({ date: today, missions: _todayMissions })); } catch (_) {}
  }

  renderMissionsWidget();
}

function _missionMatches(mission, type, extra) {
  const t = mission.type;
  if (type === 'task')      return t === 'task' || t === 'new_task';
  if (type === 'task_done') return t === 'task';
  if (type === 'task_high') return t === 'task_high' || t === 'task';
  if (type === 'new_task')  return t === 'new_task';
  if (type === 'pomodoro')  return t === 'pomodoro';
  if (type === 'habit')     return t === 'habit';
  if (type === 'ai')        return t === 'ai';
  if (type === 'streak')    return t === 'streak';
  return false;
}

/* ════════════════════════════════════════════════════════════
   WIDGET DE MISSIONS AL DASHBOARD
════════════════════════════════════════════════════════════ */
async function renderMissionsWidget() {
  const el = document.getElementById('missions-widget');
  if (!el) return;

  _injectMissionStyles();

  const uid = window._currentUser?.id;
  const missions = await generateDailyMissions(uid);

  if (!missions || missions.length === 0) {
    el.style.display = 'none';
    return;
  }

  el.style.display = 'block';
  const allDone = missions.every(m => m.completed);

  el.innerHTML = `
    <div class="mw-card">
      <div class="mw-header">
        <span class="mw-icon">🎯</span>
        <span class="mw-title">Missions d'avui</span>
        ${allDone ? '<span class="mw-all-done">✓ Totes completades!</span>' : ''}
      </div>
      <div class="mw-list">
        ${missions.map(m => {
          const pct = Math.min(100, Math.round((m.progress || 0) / m.target * 100));
          return `<div class="mw-mission ${m.completed ? 'done' : ''}">
            <div class="mw-mission-top">
              <span class="mw-check">${m.completed ? '✓' : '○'}</span>
              <span class="mw-text">${_esc ? _esc(m.text) : m.text}</span>
              <span class="mw-rew ${m.completed ? 'earned' : ''}">+${m.reward_xp} XP</span>
            </div>
            <div class="mw-bar">
              <div class="mw-bar-fill ${m.completed ? 'done' : ''}" style="width:${pct}%"></div>
            </div>
            <div class="mw-prog">${m.progress || 0}/${m.target}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* ════════════════════════════════════════════════════════════
   ESTILOS INJECTATS
════════════════════════════════════════════════════════════ */
function _injectMissionStyles() {
  if (document.getElementById('mission-styles')) return;
  const s = document.createElement('style');
  s.id = 'mission-styles';
  s.textContent = `
.mw-card{background:var(--card,#13132a);border:1px solid rgba(124,58,237,0.22);border-radius:16px;padding:14px 16px;margin-bottom:14px;}
.mw-header{display:flex;align-items:center;gap:7px;margin-bottom:12px;}
.mw-icon{font-size:16px;}
.mw-title{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted,#6b7280);flex:1;}
.mw-all-done{font-size:10px;color:#34d399;font-weight:700;}
.mw-list{display:flex;flex-direction:column;gap:8px;}
.mw-mission{padding:9px 11px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);transition:all .2s;}
.mw-mission.done{opacity:.6;background:rgba(52,211,153,0.04);border-color:rgba(52,211,153,0.15);}
.mw-mission-top{display:flex;align-items:center;gap:7px;margin-bottom:6px;}
.mw-check{font-size:13px;color:var(--muted);width:16px;text-align:center;flex-shrink:0;}
.mw-mission.done .mw-check{color:#34d399;}
.mw-text{flex:1;font-size:12px;color:var(--text);}
.mw-mission.done .mw-text{text-decoration:line-through;color:var(--muted);}
.mw-rew{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);white-space:nowrap;}
.mw-rew.earned{color:#fbbf24;}
.mw-bar{height:3px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden;margin-bottom:3px;}
.mw-bar-fill{height:100%;background:linear-gradient(90deg,#7c3aed,#00b4d8);border-radius:2px;transition:width .5s ease;}
.mw-bar-fill.done{background:linear-gradient(90deg,#34d399,#10b981);}
.mw-prog{font-family:'Space Mono',monospace;font-size:8px;color:var(--muted);text-align:right;}
`;
  document.head.appendChild(s);
}
