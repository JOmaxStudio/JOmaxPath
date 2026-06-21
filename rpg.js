/* ═══════════════════════════════════════════════════════════════
   JOMAXPATH — rpg.js
   Sistema de gamificació RPG: XP, gold, nivells, títols, animacions
   Depèn de: _supabase, _currentUser, showToast (globals de app.js)
═══════════════════════════════════════════════════════════════ */
'use strict';

/* ─── Constants ─── */
const XP_REWARDS = {
  task_low:      10,
  task_medium:   25,
  task_high:     50,
  task_subtask:   5,
  pomodoro:      15,
  habit:          8,
  streak_7days:  100,
  streak_30days: 300
};

const GOLD_REWARDS = {
  pomodoro:      5,
  streak_7days:  50,
  streak_30days: 150
};

const LEVEL_TITLES = {
   1: 'Aprenent 🌱',
   5: 'Estudiant 📖',
  10: 'Aplicat ⭐',
  20: 'Dedicat 🔥',
  30: 'Expert 💎',
  50: 'Mestre 👑'
};

/* ─── Cache en memòria ─── */
let _rpgProfile = null;  // { xp, level, gold, total_pomodoros }

/* ════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════ */
function getLevelTitle(level) {
  const thresholds = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
  const t = thresholds.find(t => level >= t);
  return LEVEL_TITLES[t] || 'Aprenent 🌱';
}

function _xpForNextLevel(level) { return level * 100; }
function _xpInLevel(totalXp, level) {
  let used = 0;
  for (let l = 1; l < level; l++) used += _xpForNextLevel(l);
  return totalXp - used;
}

function _calcLevel(totalXp) {
  let level = 1, remaining = totalXp;
  while (remaining >= _xpForNextLevel(level)) {
    remaining -= _xpForNextLevel(level);
    level++;
  }
  return level;
}

async function _getProfile() {
  if (_rpgProfile) return _rpgProfile;
  if (!window._supabase || !window._currentUser) return null;
  const uid = window._currentUser.id;
  if (!uid || uid.startsWith('local_')) return null;
  try {
    const { data } = await window._supabase
      .from('profiles')
      .select('xp, level, gold, total_pomodoros')
      .eq('id', uid).single();
    _rpgProfile = data || { xp: 0, level: 1, gold: 0, total_pomodoros: 0 };
    return _rpgProfile;
  } catch (_) { return null; }
}

function _invalidateCache() { _rpgProfile = null; }

/* ════════════════════════════════════════════════════════════
   AWARD XP
════════════════════════════════════════════════════════════ */
async function awardXP(userId, amount, reason, eventEl) {
  if (!amount || amount <= 0) return;
  if (!window._supabase || !userId || userId.startsWith('local_')) {
    showFloat('+' + amount + ' XP', 'xp', eventEl);
    return;
  }

  try {
    const profile = await _getProfile();
    if (!profile) return;

    const oldLevel = profile.level || 1;
    const newXp    = (profile.xp || 0) + amount;
    const newLevel = _calcLevel(newXp);

    await window._supabase.from('profiles')
      .update({ xp: newXp, level: newLevel })
      .eq('id', userId);

    _rpgProfile = { ...profile, xp: newXp, level: newLevel };

    showFloat('+' + amount + ' XP', 'xp', eventEl);
    _updateRpgUI(newXp, newLevel, profile.gold);

    if (newLevel > oldLevel) {
      setTimeout(() => _showLevelUpOverlay(newLevel), 400);
    }
  } catch (e) {
    console.warn('[RPG] awardXP error:', e.message);
  }
}

/* ════════════════════════════════════════════════════════════
   AWARD GOLD
════════════════════════════════════════════════════════════ */
async function awardGold(userId, amount, reason, eventEl) {
  if (!amount || amount <= 0) return;
  if (!window._supabase || !userId || userId.startsWith('local_')) {
    showFloat('+' + amount + ' 🪙', 'gold', eventEl);
    return;
  }

  try {
    const profile = await _getProfile();
    if (!profile) return;

    const newGold = (profile.gold || 0) + amount;
    await window._supabase.from('profiles')
      .update({ gold: newGold })
      .eq('id', userId);

    _rpgProfile = { ...profile, gold: newGold };

    showFloat('+' + amount + ' 🪙', 'gold', eventEl);
    _updateRpgUI(profile.xp, profile.level, newGold);
  } catch (e) {
    console.warn('[RPG] awardGold error:', e.message);
  }
}

/* ════════════════════════════════════════════════════════════
   STREAK BONUS
════════════════════════════════════════════════════════════ */
async function checkStreakBonus(userId, streakDays) {
  if (!userId || !streakDays) return;
  if (streakDays === 7) {
    await awardXP(userId,   XP_REWARDS.streak_7days,   'streak_7days');
    await awardGold(userId, GOLD_REWARDS.streak_7days,  'streak_7days');
    if (typeof showToast === 'function')
      showToast('🔥 7 DIES DE RATXA! +100 XP +50 🪙 — Increïble constància!');
  } else if (streakDays === 30) {
    await awardXP(userId,   XP_REWARDS.streak_30days,   'streak_30days');
    await awardGold(userId, GOLD_REWARDS.streak_30days,  'streak_30days');
    if (typeof showToast === 'function')
      showToast('🏆 30 DIES DE RATXA! +300 XP +150 🪙 — Ets una llegenda!');
  }
}

/* ════════════════════════════════════════════════════════════
   POMODORO RPG (cridada des de app.js)
════════════════════════════════════════════════════════════ */
async function rpgOnPomodoro() {
  const uid = window._currentUser?.id;
  if (!uid) return;
  await Promise.all([
    awardXP(uid,   XP_REWARDS.pomodoro,   'pomodoro'),
    awardGold(uid, GOLD_REWARDS.pomodoro,  'pomodoro')
  ]);
  // Increment total_pomodoros
  try {
    const profile = await _getProfile();
    if (profile && window._supabase) {
      const total = (profile.total_pomodoros || 0) + 1;
      await window._supabase.from('profiles')
        .update({ total_pomodoros: total }).eq('id', uid);
      if (_rpgProfile) _rpgProfile.total_pomodoros = total;
    }
  } catch (_) {}
}

/* ════════════════════════════════════════════════════════════
   FLOATING ANIMATION
════════════════════════════════════════════════════════════ */
function showFloat(text, type, refEl) {
  _injectRpgStyles();
  let x = window.innerWidth / 2 - 30;
  let y = window.innerHeight / 2 - 60;
  if (refEl) {
    const r = (typeof refEl === 'string'
      ? document.getElementById(refEl)
      : refEl)?.getBoundingClientRect?.();
    if (r) { x = r.left + r.width / 2; y = r.top; }
  }
  const el = document.createElement('div');
  el.className = type === 'xp' ? 'rpg-float rpg-float-xp' : 'rpg-float rpg-float-gold';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

/* ════════════════════════════════════════════════════════════
   LEVEL UP OVERLAY
════════════════════════════════════════════════════════════ */
function _showLevelUpOverlay(newLevel) {
  _injectRpgStyles();
  document.getElementById('rpg-lvlup')?.remove();
  const title = getLevelTitle(newLevel);
  const ov = document.createElement('div');
  ov.id = 'rpg-lvlup';
  ov.innerHTML = `
    <div class="rpg-lvlup-box">
      <div class="rpg-lvlup-icon">⬆️</div>
      <div class="rpg-lvlup-title">LEVEL UP!</div>
      <div class="rpg-lvlup-sub">Ara ets <strong>Nivell ${newLevel}</strong></div>
      <div class="rpg-lvlup-title2">${title}</div>
    </div>`;
  document.body.appendChild(ov);
  setTimeout(() => {
    ov.style.opacity = '0';
    ov.style.transition = 'opacity 0.5s';
    setTimeout(() => ov.remove(), 500);
  }, 2500);
  if (typeof showToast === 'function')
    showToast('⬆️ LEVEL UP! Ara ets nivell ' + newLevel + ' — ' + title);
}

/* ════════════════════════════════════════════════════════════
   ACTUALITZA UI SIDEBAR
════════════════════════════════════════════════════════════ */
function _updateRpgUI(totalXp, level, gold) {
  // Level num
  const lvlEl = document.getElementById('lsb-lvl-num');
  if (lvlEl) lvlEl.textContent = level || 1;

  // Title al sidebar
  const lvlRow = document.getElementById('lsb-hero-lvl');
  if (lvlRow) lvlRow.textContent = getLevelTitle(level || 1) + ' · NV. ' + (level || 1);

  // XP bar
  const xpFill = document.getElementById('lsb-xp-fill');
  if (xpFill) {
    const xpIn   = _xpInLevel(totalXp || 0, level || 1);
    const xpNeed = _xpForNextLevel(level || 1);
    xpFill.style.width = Math.min(100, Math.round(xpIn / xpNeed * 100)) + '%';
  }

  // Gold counter
  const goldEl = document.getElementById('rpg-gold-count');
  if (goldEl) goldEl.textContent = gold || 0;

  // XP text detallat
  const xpDetailEl = document.getElementById('rpg-xp-detail');
  if (xpDetailEl && totalXp !== undefined) {
    const xpIn   = _xpInLevel(totalXp, level || 1);
    const xpNeed = _xpForNextLevel(level || 1);
    xpDetailEl.textContent = xpIn + ' / ' + xpNeed + ' XP';
  }
}

/* ════════════════════════════════════════════════════════════
   INICIALITZACIÓ (crida al login)
════════════════════════════════════════════════════════════ */
async function rpgInit() {
  _invalidateCache();
  const profile = await _getProfile();
  if (!profile) return;
  _updateRpgUI(profile.xp || 0, profile.level || 1, profile.gold || 0);
}

/* ════════════════════════════════════════════════════════════
   ESTILOS INJECTATS
════════════════════════════════════════════════════════════ */
function _injectRpgStyles() {
  if (document.getElementById('rpg-styles')) return;
  const s = document.createElement('style');
  s.id = 'rpg-styles';
  s.textContent = `
@keyframes rpgFloatUp{0%{opacity:1;transform:translateY(0) scale(1)}60%{opacity:1}100%{opacity:0;transform:translateY(-55px) scale(0.85)}}
@keyframes rpgLvlUp{0%{opacity:0;transform:translate(-50%,-50%) scale(0.4)}60%{transform:translate(-50%,-50%) scale(1.08)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}

.rpg-float{position:fixed;font-weight:700;font-size:14px;pointer-events:none;z-index:9999;
  animation:rpgFloatUp 1.5s ease-out forwards;white-space:nowrap;
  text-shadow:0 1px 4px rgba(0,0,0,0.6);}
.rpg-float-xp{color:#a78bfa;}
.rpg-float-gold{color:#fbbf24;}

#rpg-lvlup{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9990;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);}
.rpg-lvlup-box{text-align:center;animation:rpgLvlUp 0.5s ease-out forwards;background:linear-gradient(135deg,rgba(124,58,237,0.25),rgba(0,180,216,0.15));border:2px solid rgba(167,139,250,0.5);border-radius:24px;padding:36px 48px;max-width:340px;}
.rpg-lvlup-icon{font-size:52px;margin-bottom:8px;}
.rpg-lvlup-title{font-family:'Space Mono',monospace;font-size:28px;font-weight:700;letter-spacing:4px;color:#a78bfa;text-shadow:0 0 20px rgba(124,58,237,0.8);}
.rpg-lvlup-sub{font-size:14px;color:#e2e8f0;margin:10px 0 4px;}
.rpg-lvlup-title2{font-size:18px;font-weight:700;color:#fcd34d;}

/* Gold counter al sidebar */
.rpg-gold-badge{display:flex;align-items:center;gap:5px;padding:5px 10px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);border-radius:20px;font-size:12px;font-weight:700;color:#fbbf24;margin:4px 8px 0;cursor:default;}
.rpg-gold-badge span{font-size:14px;}

/* XP detail text */
.rpg-xp-detail{font-family:'Space Mono',monospace;font-size:8px;color:rgba(255,255,255,0.35);margin-top:3px;text-align:right;}
`;
  document.head.appendChild(s);
}
