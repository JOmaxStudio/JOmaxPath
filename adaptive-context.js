/* ═══════════════════════════════════════════════════════════════
   JOMAXPATH — adaptive-context.js
   Context adaptatiu: widget "El teu dia d'avui" + sugeriment Pomodoro + system prompt IA
   Depèn de: _supabase, _currentUser, _esc (globals de app.js)
═══════════════════════════════════════════════════════════════ */
'use strict';

/* ─── Cache de context ─── */
let _adaptCtx   = null;
let _adaptCtxTs = 0;
const _ADAPT_TTL = 5 * 60 * 1000; // 5 min

const _DIES_CURT = ['Dl','Dt','Dc','Dj','Dv','Ds','Dg'];
const _DIES_LLARG= ['Dilluns','Dimarts','Dimecres','Dijous','Divendres','Dissabte','Diumenge'];

/* ════════════════════════════════════════════════════════════
   CÀRREGA DEL CONTEXT ACADÈMIC
════════════════════════════════════════════════════════════ */
async function _loadAdaptContext(force) {
  if (!window._supabase || !window._currentUser) return null;
  const uid = window._currentUser.id;
  if (!uid || uid.startsWith('local_')) return null;
  if (!force && _adaptCtx && (Date.now() - _adaptCtxTs) < _ADAPT_TTL) return _adaptCtx;

  try {
    const [profR, assgR, horariR, extR] = await Promise.all([
      window._supabase.from('profiles')
        .select('curs, gustos, objectiu_diari_pomodoros, dies_estudi_preferits, onboarding_adaptability_completed')
        .eq('id', uid).single(),
      window._supabase.from('assignatures')
        .select('id, nom, emoji, color, professor').eq('user_id', uid).order('nom'),
      window._supabase.from('horari_classes')
        .select('id, assignatura_id, dia_setmana, hora_inici, hora_fi, aula').eq('user_id', uid),
      window._supabase.from('extraescolars')
        .select('id, nom, emoji, color, dia_setmana, hora_inici, hora_fi, lloc').eq('user_id', uid)
    ]);

    _adaptCtx = {
      profile:     profR.data  || {},
      assignatures: assgR.data || [],
      horari:      horariR.data || [],
      extraescolars: extR.data  || []
    };
    _adaptCtxTs = Date.now();
    return _adaptCtx;
  } catch(_) { return null; }
}

function _adaptContextRefresh() {
  _adaptCtx   = null;
  _adaptCtxTs = 0;
  if (typeof renderTodayScheduleWidget === 'function') renderTodayScheduleWidget();
  if (typeof renderPomodoroSuggestion   === 'function') renderPomodoroSuggestion();
}

/* ════════════════════════════════════════════════════════════
   SYSTEM PROMPT ADAPTATIU PER A JULIANS IA
════════════════════════════════════════════════════════════ */
async function buildAdaptiveSystemPrompt(basePrompt) {
  try {
    const ctx = await _loadAdaptContext();
    if (!ctx || !ctx.profile?.onboarding_adaptability_completed) return basePrompt;

    const p   = ctx.profile;
    const now = new Date();
    const dia = now.getDay(); // 0=dg
    const diaLabel = _DIES_LLARG[dia] || '';

    const assgAvui = _getAvuiClasses(ctx, dia);
    const extAvui  = (ctx.extraescolars||[]).filter(e => e.dia_setmana === (dia === 0 ? 6 : dia - 1));

    let acadBlock = '\n\n---\nPERFIL ACADÈMIC DE L\'ALUMNE:';
    if (p.curs)                       acadBlock += `\n- Curs: ${p.curs}`;
    if (p.gustos?.length)             acadBlock += `\n- Gustos: ${p.gustos.join(', ')}`;
    if (p.objectiu_diari_pomodoros)   acadBlock += `\n- Objectiu diari: ${p.objectiu_diari_pomodoros} Pomodoros (${p.objectiu_diari_pomodoros*25} min de focus)`;
    if (ctx.assignatures?.length)     acadBlock += `\n- Assignatures: ${ctx.assignatures.map(a=>`${a.emoji||'📖'} ${a.nom}${a.professor?` (${a.professor})`:''}`).join(', ')}`;

    if (assgAvui.length || extAvui.length) {
      acadBlock += `\n- Avui ${diaLabel}:`;
      assgAvui.forEach(h => {
        const a = ctx.assignatures.find(x => x.id === h.assignatura_id);
        if (a) acadBlock += `\n  · ${h.hora_inici.slice(0,5)}–${h.hora_fi.slice(0,5)} ${a.emoji||'📖'} ${a.nom}${h.aula?` (${h.aula})`:''}`;
      });
      extAvui.forEach(e => {
        acadBlock += `\n  · ${e.hora_inici.slice(0,5)}–${e.hora_fi.slice(0,5)} ${e.emoji||'⭐'} ${e.nom} [extraescolar]${e.lloc?` (${e.lloc})`:''}`;
      });
    }
    acadBlock += '\n---';

    return basePrompt + acadBlock;
  } catch(_) { return basePrompt; }
}

/* ════════════════════════════════════════════════════════════
   WIDGET "EL TEU DIA D'AVUI"
════════════════════════════════════════════════════════════ */
async function renderTodayScheduleWidget() {
  const el = document.getElementById('today-schedule-widget');
  if (!el) return;

  _injectAdaptWidgetStyles();

  const ctx = await _loadAdaptContext();
  if (!ctx || !ctx.profile?.onboarding_adaptability_completed) {
    el.style.display = 'none';
    return;
  }

  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const dia    = now.getDay(); // 0=dg, 1=dl...
  const diaIdx = dia === 0 ? 6 : dia - 1; // 0=dl, 4=dv, 5=ds, 6=dg

  const classes   = _getAvuiClasses(ctx, dia);
  const extras    = (ctx.extraescolars||[]).filter(e => e.dia_setmana === diaIdx);
  const pomodoros = ctx.profile.objectiu_diari_pomodoros || 4;

  // Combinar i ordenar
  const events = [
    ...classes.map(h => {
      const a = ctx.assignatures.find(x => x.id === h.assignatura_id);
      return a ? { type:'class', emoji:a.emoji||'📖', nom:a.nom, color:a.color,
        hi: _timeToMin(h.hora_inici), hf: _timeToMin(h.hora_fi),
        hiLabel: h.hora_inici.slice(0,5), hfLabel: h.hora_fi.slice(0,5),
        extra: h.aula ? `Aula ${h.aula}` : '' } : null;
    }).filter(Boolean),
    ...extras.map(e => ({
      type:'extra', emoji:e.emoji||'⭐', nom:e.nom, color:e.color,
      hi: _timeToMin(e.hora_inici), hf: _timeToMin(e.hora_fi),
      hiLabel: e.hora_inici.slice(0,5), hfLabel: e.hora_fi.slice(0,5),
      extra: e.lloc || ''
    }))
  ].sort((a,b) => a.hi - b.hi);

  const isWeekend = diaIdx >= 5;
  const isEmpty   = events.length === 0;

  // Calcula temps lliure
  let freeMin = 0;
  if (!isEmpty) {
    let busyMin = 0;
    events.forEach(e => busyMin += (e.hf - e.hi));
    const span = events[events.length-1].hf - events[0].hi;
    freeMin = Math.max(0, span - busyMin);
  }

  el.style.display = 'block';
  el.innerHTML = `
    <div class="adapt-widget-card">
      <div class="adapt-widget-header">
        <span class="adapt-widget-icon">📅</span>
        <span class="adapt-widget-title">El teu dia d'avui</span>
        <span class="adapt-widget-day">${_DIES_LLARG[dia]}</span>
      </div>
      ${isWeekend || isEmpty ? `
        <div class="adapt-widget-empty">
          ${isWeekend ? '🏖️ Cap de setmana! Temps per recarregar.' : '✨ Cap classe avui. Bon moment per avançar!'}
        </div>` : `
        <div class="adapt-widget-timeline">
          ${events.map(ev => {
            const isNow  = nowMin >= ev.hi && nowMin < ev.hf;
            const isPast = nowMin >= ev.hf;
            return `<div class="adapt-ev${isNow?' adapt-ev-now':''}${isPast?' adapt-ev-past':''}"
              style="--ev-color:${ev.color}">
              <div class="adapt-ev-bar"></div>
              <div class="adapt-ev-info">
                <span class="adapt-ev-time">${ev.hiLabel}–${ev.hfLabel}</span>
                <span class="adapt-ev-nom">${ev.emoji} ${typeof _esc==='function'?_esc(ev.nom):ev.nom}</span>
                ${ev.extra?`<span class="adapt-ev-extra">${typeof _esc==='function'?_esc(ev.extra):ev.extra}</span>`:''}
              </div>
              ${isNow?'<div class="adapt-ev-now-badge">EN CURS</div>':''}
            </div>`;
          }).join('')}
        </div>`}
      <div class="adapt-widget-footer">
        <span>🍅 Objectiu: <strong>${pomodoros}</strong> Pomodoros (${pomodoros*25} min)</span>
        ${!isEmpty && freeMin > 0 ? `<span>⏱ Temps lliure: ~${Math.round(freeMin/5)*5} min</span>` : ''}
      </div>
    </div>`;
}

/* ════════════════════════════════════════════════════════════
   SUGERIMENT POMODORO INTEL·LIGENT
════════════════════════════════════════════════════════════ */
async function renderPomodoroSuggestion() {
  const el = document.getElementById('pomo-adapt-hint');
  if (!el) return;

  const ctx = await _loadAdaptContext();
  if (!ctx || !ctx.profile?.onboarding_adaptability_completed) {
    el.style.display = 'none';
    return;
  }

  _injectPomoHintStyle();

  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const dia    = now.getDay();
  const diaIdx = dia === 0 ? 6 : dia - 1;

  const classes = _getAvuiClasses(ctx, dia);
  const extras  = (ctx.extraescolars||[]).filter(e => e.dia_setmana === diaIdx);
  const pom     = ctx.profile.objectiu_diari_pomodoros || 4;

  // Pròxima activitat
  const allEvents = [...classes.map(h => {
    const a = ctx.assignatures.find(x => x.id === h.assignatura_id);
    return a ? { nom: a.nom, emoji: a.emoji||'📖', hi: _timeToMin(h.hora_inici), hf: _timeToMin(h.hora_fi) } : null;
  }).filter(Boolean), ...extras.map(e => ({
    nom: e.nom, emoji: e.emoji||'⭐', hi: _timeToMin(e.hora_inici), hf: _timeToMin(e.hora_fi)
  }))].sort((a,b) => a.hi - b.hi);

  const next   = allEvents.find(e => e.hi > nowMin);
  const inNow  = allEvents.find(e => nowMin >= e.hi && nowMin < e.hf);

  let msg = '', icon = '💡';

  if (inNow) {
    msg  = `Ara tens <strong>${inNow.emoji} ${typeof _esc==='function'?_esc(inNow.nom):inNow.nom}</strong>. Fins les ${_minToLabel(inNow.hf)} — recorda tornar al focus!`;
    icon = '📚';
  } else if (next) {
    const minsLliures = next.hi - nowMin;
    const pomsPossibles = Math.floor(minsLliures / 30);
    if (pomsPossibles >= 1) {
      msg  = `Tens <strong>${minsLliures} min lliures</strong> fins a ${next.emoji} ${typeof _esc==='function'?_esc(next.nom):next.nom}. Perfecte per a <strong>${pomsPossibles} Pomodoro${pomsPossibles>1?'s':''}!</strong>`;
      icon = '🍅';
    } else if (minsLliures > 5) {
      msg  = `En ${minsLliures} min comença <strong>${next.emoji} ${typeof _esc==='function'?_esc(next.nom):next.nom}</strong>. Aprofita per repassar apunts!`;
      icon = '⏱';
    } else {
      msg  = `Ara comença <strong>${next.emoji} ${typeof _esc==='function'?_esc(next.nom):next.nom}</strong>. Molta sort! 💪`;
      icon = '🎯';
    }
  } else if (allEvents.length > 0) {
    msg  = `Ja has acabat les classes d'avui. Moment ideal per completar l'objectiu de <strong>${pom} Pomodoros</strong>! 🏆`;
    icon = '🌟';
  } else {
    el.style.display = 'none';
    return;
  }

  el.style.display = 'block';
  el.innerHTML = `
    <div class="pomo-hint-card">
      <span class="pomo-hint-icon">${icon}</span>
      <p class="pomo-hint-text">${msg}</p>
      <button class="pomo-hint-close" onclick="this.parentElement.parentElement.style.display='none'" aria-label="Tanca">✕</button>
    </div>`;
}

/* ─── Helpers ─── */
function _timeToMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function _minToLabel(m) {
  return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
}

function _getAvuiClasses(ctx, dayOfWeek) {
  // dayOfWeek: 0=dg,1=dl,...6=ds; horari_classes.dia_setmana: 0=dl,...6=dg
  const diaIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return (ctx.horari||[]).filter(h => h.dia_setmana === diaIdx)
    .sort((a,b) => a.hora_inici.localeCompare(b.hora_inici));
}

/* ════════════════════════════════════════════════════════════
   ESTILOS INJECTATS
════════════════════════════════════════════════════════════ */
function _injectAdaptWidgetStyles() {
  if (document.getElementById('adapt-widget-styles')) return;
  const s = document.createElement('style');
  s.id = 'adapt-widget-styles';
  s.textContent = `
.adapt-widget-card{background:var(--card,#13132a);border:1px solid rgba(124,58,237,0.22);border-radius:16px;padding:14px 16px;margin-bottom:14px;}
.adapt-widget-header{display:flex;align-items:center;gap:7px;margin-bottom:10px;}
.adapt-widget-icon{font-size:16px;}
.adapt-widget-title{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted,#6b7280);flex:1;}
.adapt-widget-day{font-size:10px;color:var(--accent,#7c3aed);font-weight:700;}
.adapt-widget-empty{text-align:center;color:var(--muted);font-size:12px;padding:10px 0;}
.adapt-widget-timeline{display:flex;flex-direction:column;gap:5px;margin-bottom:10px;}
.adapt-ev{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:9px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);transition:all .2s;position:relative;overflow:hidden;}
.adapt-ev-bar{width:3px;align-self:stretch;border-radius:2px;background:var(--ev-color,#7c3aed);flex-shrink:0;}
.adapt-ev-info{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0;}
.adapt-ev-time{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);}
.adapt-ev-nom{font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.adapt-ev-extra{font-size:10px;color:var(--muted);}
.adapt-ev-now{background:rgba(124,58,237,0.12);border-color:rgba(124,58,237,0.3);}
.adapt-ev-past{opacity:.45;}
.adapt-ev-now-badge{font-family:'Space Mono',monospace;font-size:7px;letter-spacing:1px;color:#a78bfa;background:rgba(124,58,237,0.18);padding:2px 6px;border-radius:6px;flex-shrink:0;}
.adapt-widget-footer{display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;border-top:1px solid rgba(255,255,255,0.06);padding-top:8px;font-size:11px;color:var(--muted);}
.adapt-widget-footer strong{color:var(--text);}
`;
  document.head.appendChild(s);
}

function _injectPomoHintStyle() {
  if (document.getElementById('pomo-hint-styles')) return;
  const s = document.createElement('style');
  s.id = 'pomo-hint-styles';
  s.textContent = `
.pomo-hint-card{display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(124,58,237,0.1),rgba(0,180,216,0.07));border:1px solid rgba(124,58,237,0.25);border-radius:12px;padding:11px 14px;position:relative;}
.pomo-hint-icon{font-size:20px;flex-shrink:0;}
.pomo-hint-text{font-size:12px;color:var(--text);margin:0;flex:1;line-height:1.5;}
.pomo-hint-text strong{color:#a78bfa;}
.pomo-hint-close{background:none;border:none;color:var(--muted);cursor:pointer;font-size:11px;padding:2px 5px;border-radius:4px;flex-shrink:0;transition:color .2s;}
.pomo-hint-close:hover{color:var(--text);}
`;
  document.head.appendChild(s);
}
