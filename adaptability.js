/* ═══════════════════════════════════════════════════════════════
   JOMAXPATH — adaptability.js
   Onboarding de personalització (4 passos) + editor de perfil acadèmic
   Depèn de: _supabase, _currentUser, _esc, showToast, showErrorToast (globals de app.js)
═══════════════════════════════════════════════════════════════ */
'use strict';

/* ─── Constants ─── */
const ADAPT_COLORS = ['#7c3aed','#2563eb','#059669','#dc2626','#d97706','#0891b2','#db2777','#65a30d','#9333ea','#0d9488'];
const ADAPT_EMOJIS = ['🔢','➕','📐','🔬','🌍','📖','✏️','🎨','🎵','💻','🏃','🙏','📚','⚗️','🗺️','🏛️','🎭','🌿'];
const ADAPT_CURSOS = ['1r ESO','2n ESO','3r ESO','4t ESO','1r Batxillerat','2n Batxillerat','CFGM','CFGS','Universitat','Altre'];
const ADAPT_GUSTOS = [
  {e:'🎵',t:'Música'},{e:'🎮',t:'Videojocs'},{e:'⚽',t:'Esport'},{e:'📚',t:'Lectura'},
  {e:'🎨',t:'Art'},{e:'🎬',t:'Cinema'},{e:'🍕',t:'Cuina'},{e:'🌍',t:'Viatges'},
  {e:'💻',t:'Tecnologia'},{e:'🎭',t:'Teatre'}
];
const ADAPT_SUGG = {
  batxillerat: ['Matemàtiques','Física','Química','Català','Castellà','Anglès','Història','Filosofia'],
  eso:         ['Matemàtiques','Català','Castellà','Anglès','Ciències Naturals','Història','Ed. Física','Tecnologia','Música'],
  other:       ['Matemàtiques','Llengua','Anglès','Ciències','Història']
};
const _DIES_NOM  = ['Dilluns','Dimarts','Dimecres','Dijous','Divendres'];
const _HORES_GRID = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

/* ─── Estat intern del mòdul ─── */
let _adaptStep        = 0;
let _adaptData        = { curs:'', gustos:[], objectiu_text:'', pomodoros:4, hores_estudi:[], notificacions:false };
let _adaptAssignatures = [];  // [{id, nom, emoji, color, professor}]
let _adaptHorari       = {};  // { "dia_hora": { assg_id } }
let _adaptExtras       = [];  // [{id, nom, emoji, color, dia_setmana, hora_inici, hora_fi, lloc}]
let _adaptPickedColor  = ADAPT_COLORS[0];
let _adaptPickedExtraColor = ADAPT_COLORS[2];

/* ════════════════════════════════════════════════════════════
   ENTRY POINT — comprova si cal mostrar l'onboarding
════════════════════════════════════════════════════════════ */
async function _checkAdaptabilityOnboarding() {
  if (!window._supabase || !window._currentUser) return;
  const uid = window._currentUser.id;
  if (!uid || uid.startsWith('local_')) return;

  try {
    const { data } = await window._supabase
      .from('profiles')
      .select('onboarding_adaptability_completed, curs, gustos, objectiu_diari_pomodoros')
      .eq('id', uid)
      .single();

    if (!data || data.onboarding_adaptability_completed) return;

    // Pre-omple dades existents
    if (data.curs)                      _adaptData.curs      = data.curs;
    if (data.gustos)                    _adaptData.gustos    = data.gustos;
    if (data.objectiu_diari_pomodoros)  _adaptData.pomodoros = data.objectiu_diari_pomodoros;

    setTimeout(() => _showAdaptModal(), 900);
  } catch(_) { /* columnes encara no existents o xarxa → silenci */ }
}

/* ════════════════════════════════════════════════════════════
   MODAL PRINCIPAL
════════════════════════════════════════════════════════════ */
function _showAdaptModal() {
  if (document.getElementById('adapt-modal-root')) return;
  _injectAdaptStyles();

  const root = document.createElement('div');
  root.id = 'adapt-modal-root';
  root.innerHTML = `
    <div class="adapt-backdrop"></div>
    <div class="adapt-modal" role="dialog" aria-modal="true">
      <button class="adapt-skip-btn" onclick="_adaptSkip()">Salta la configuració ✕</button>
      <div class="adapt-progress-bar"><div class="adapt-progress-fill" id="adapt-pb"></div></div>
      <div class="adapt-steps-wrap" id="adapt-steps-wrap"></div>
    </div>`;
  document.body.appendChild(root);

  _adaptStep = 0;
  _adaptRenderStep(false);
}

function _adaptUpdateProgress() {
  const pb = document.getElementById('adapt-pb');
  if (pb) pb.style.width = ((_adaptStep + 1) / 4 * 100) + '%';
}

function _adaptRenderStep(animate) {
  const wrap = document.getElementById('adapt-steps-wrap');
  if (!wrap) return;

  const renderers = [_adaptRenderStep1, _adaptRenderStep2, _adaptRenderStep3, _adaptRenderStep4];

  const prev = wrap.querySelector('.adapt-step');
  const doRender = () => {
    const step = document.createElement('div');
    step.className = 'adapt-step';
    wrap.appendChild(step);
    renderers[_adaptStep]?.(step);
    _adaptUpdateProgress();
  };

  if (prev && animate !== false) {
    prev.style.transform = 'translateX(-100%)';
    prev.style.opacity = '0';
    setTimeout(() => { prev.remove(); doRender(); }, 220);
  } else {
    prev?.remove();
    doRender();
  }
}

function _adaptDots(active) {
  return [0,1,2,3].map(i =>
    `<span class="adapt-dot${i <= active ? ' active' : ''}"></span>`
  ).join('');
}

/* ════════════════════════════════════════════════════════════
   PAS 1 — Qui ets?
════════════════════════════════════════════════════════════ */
function _adaptRenderStep1(el) {
  el.innerHTML = `
    <div class="adapt-step-header">
      <div class="adapt-step-dots">${_adaptDots(0)}</div>
      <div class="adapt-step-num">Pas 1 de 4</div>
    </div>
    <div class="adapt-hero-emoji">👋</div>
    <h2 class="adapt-title">Primer de tot, parlem de tu</h2>
    <p class="adapt-subtitle">Aquesta informació personalitza tota la teva experiència a JOmaxPath.</p>

    <div class="adapt-field">
      <label class="adapt-label">En quin curs estàs?</label>
      <select id="a-curs" class="adapt-select">
        <option value="">Tria el teu curs...</option>
        ${ADAPT_CURSOS.map(c => `<option value="${c}"${_adaptData.curs===c?' selected':''}>${c}</option>`).join('')}
      </select>
    </div>

    <div class="adapt-field">
      <label class="adapt-label">Quins són els teus gustos?
        <span class="adapt-label-hint">(Selecciona tots els que vulguis)</span>
      </label>
      <div class="adapt-pills" id="a-gustos">
        ${ADAPT_GUSTOS.map(g =>
          `<button class="adapt-pill${_adaptData.gustos.includes(g.t)?' selected':''}"
            onclick="_adaptToggleGusto('${g.t}',this)">${g.e} ${g.t}</button>`
        ).join('')}
      </div>
    </div>

    <div class="adapt-field">
      <label class="adapt-label">Quin és el teu gran objectiu aquest curs?
        <span class="adapt-label-hint">(opcional)</span>
      </label>
      <input id="a-objectiu" type="text" maxlength="100" class="adapt-input"
        placeholder="Ex: Aprovar selectivitat amb nota alta"
        value="${typeof _esc==='function'?_esc(_adaptData.objectiu_text):_adaptData.objectiu_text}">
      <div class="adapt-char-count"><span id="a-obj-cnt">${_adaptData.objectiu_text.length}</span>/100</div>
    </div>

    <div class="adapt-nav">
      <span></span>
      <button class="adapt-btn-primary" onclick="_adaptNext1()">Assignatures ›</button>
    </div>`;

  document.getElementById('a-objectiu')?.addEventListener('input', function() {
    _adaptData.objectiu_text = this.value;
    const cnt = document.getElementById('a-obj-cnt');
    if (cnt) cnt.textContent = this.value.length;
  });
}

function _adaptToggleGusto(nom, btn) {
  const idx = _adaptData.gustos.indexOf(nom);
  if (idx >= 0) { _adaptData.gustos.splice(idx, 1); btn.classList.remove('selected'); }
  else           { _adaptData.gustos.push(nom);       btn.classList.add('selected'); }
}

async function _adaptNext1() {
  _adaptData.curs = document.getElementById('a-curs')?.value || '';

  if (window._supabase && window._currentUser && !window._currentUser.id?.startsWith('local_')) {
    try {
      await window._supabase.from('profiles').update({
        curs:   _adaptData.curs   || null,
        gustos: _adaptData.gustos.length ? _adaptData.gustos : null
      }).eq('id', window._currentUser.id);
    } catch(_) {}
  }

  _adaptStep = 1;
  _adaptRenderStep();
}

/* ════════════════════════════════════════════════════════════
   PAS 2 — Assignatures
════════════════════════════════════════════════════════════ */
function _adaptRenderStep2(el) {
  const isBatx = _adaptData.curs?.includes('Batxillerat');
  const isESO  = _adaptData.curs?.includes('ESO');
  const sugg   = isBatx ? ADAPT_SUGG.batxillerat : (isESO ? ADAPT_SUGG.eso : ADAPT_SUGG.other);

  el.innerHTML = `
    <div class="adapt-step-header">
      <div class="adapt-step-dots">${_adaptDots(1)}</div>
      <div class="adapt-step-num">Pas 2 de 4</div>
    </div>
    <div class="adapt-hero-emoji">📚</div>
    <h2 class="adapt-title">Quines assignatures fas?</h2>
    <p class="adapt-subtitle">Mínim una per continuar. Les farem servir a l'horari i a l'IA.</p>

    <div id="a-assg-list" class="adapt-assg-list"></div>
    <button class="adapt-btn-secondary" onclick="_adaptShowAssgForm()">+ Afegeix assignatura</button>
    <div id="a-assg-form" style="display:none;margin-top:10px;"></div>

    ${sugg.length ? `
    <div class="adapt-sugg-section">
      <div class="adapt-label" style="margin-bottom:8px;">
        Suggeriments per a ${_adaptData.curs||'el teu curs'}:
      </div>
      <div class="adapt-pills">
        ${sugg.map((s,i) =>
          `<button class="adapt-pill" onclick="_adaptAddSuggestion('${s.replace(/'/g,"\\'")}',${i})">${s}</button>`
        ).join('')}
      </div>
    </div>` : ''}

    <div class="adapt-nav" style="margin-top:20px;">
      <button class="adapt-btn-ghost" onclick="_adaptPrev()">‹ Enrere</button>
      <button class="adapt-btn-primary" id="a-next2" onclick="_adaptNext2()"
        ${_adaptAssignatures.length===0?'disabled':''}>Horari ›</button>
    </div>`;

  _adaptRenderAssgList();
}

function _adaptRenderAssgList() {
  const list = document.getElementById('a-assg-list');
  if (!list) return;
  if (_adaptAssignatures.length === 0) {
    list.innerHTML = `<div class="adapt-empty-hint">Encara no has afegit cap assignatura</div>`;
  } else {
    list.innerHTML = _adaptAssignatures.map((a, i) => `
      <div class="adapt-assg-item">
        <div class="adapt-assg-color" style="background:${a.color}"></div>
        <span class="adapt-assg-emoji">${a.emoji||'📖'}</span>
        <span class="adapt-assg-nom">${typeof _esc==='function'?_esc(a.nom):a.nom}</span>
        ${a.professor ? `<span class="adapt-assg-prof">(${typeof _esc==='function'?_esc(a.professor):a.professor})</span>` : ''}
        <button class="adapt-assg-del" onclick="_adaptDelAssg(${i})">✕</button>
      </div>`).join('');
  }
  const next2 = document.getElementById('a-next2');
  if (next2) next2.disabled = _adaptAssignatures.length === 0;
}

function _adaptShowAssgForm() {
  const form = document.getElementById('a-assg-form');
  if (!form) return;
  _adaptPickedColor = ADAPT_COLORS[_adaptAssignatures.length % ADAPT_COLORS.length];
  form.style.display = 'block';
  form.innerHTML = `
    <div class="adapt-form-inner">
      <input id="af-nom" class="adapt-input" placeholder="Nom de l'assignatura *" style="margin-bottom:8px;">
      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <div style="flex:1;min-width:120px;">
          <div class="adapt-label" style="margin-bottom:4px;">Emoji</div>
          <select id="af-emoji" class="adapt-select" style="font-size:16px;">
            ${ADAPT_EMOJIS.map(e => `<option value="${e}">${e}</option>`).join('')}
          </select>
        </div>
        <div style="flex:2;">
          <div class="adapt-label" style="margin-bottom:4px;">Color</div>
          <div class="adapt-color-palette" id="af-colors">
            ${ADAPT_COLORS.map(c =>
              `<button class="adapt-color-swatch${c===_adaptPickedColor?' sel':''}"
                style="background:${c}" onclick="_adaptPickColor('${c}',this,'af-colors')"></button>`
            ).join('')}
          </div>
        </div>
      </div>
      <input id="af-prof" class="adapt-input" placeholder="Professor/a (opcional)" style="margin-bottom:8px;">
      <div style="display:flex;gap:8px;">
        <button class="adapt-btn-primary" style="flex:1;" onclick="_adaptSaveAssg()">Afegir ✓</button>
        <button class="adapt-btn-ghost" onclick="document.getElementById('a-assg-form').style.display='none'">Cancel·lar</button>
      </div>
    </div>`;
  document.getElementById('af-nom')?.focus();
}

function _adaptPickColor(color, btn, scope) {
  _adaptPickedColor = color;
  document.getElementById(scope)?.querySelectorAll('.adapt-color-swatch').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}

function _adaptSaveAssg() {
  const nom = document.getElementById('af-nom')?.value.trim();
  if (!nom) { if(typeof showToast==='function') showToast('⚠️ Escriu el nom de l\'assignatura'); return; }
  const emoji  = document.getElementById('af-emoji')?.value || '📖';
  const prof   = document.getElementById('af-prof')?.value.trim() || '';
  _adaptAssignatures.push({ id:'local_'+Date.now(), nom, emoji, color:_adaptPickedColor, professor:prof });
  document.getElementById('a-assg-form').style.display = 'none';
  _adaptRenderAssgList();
}

function _adaptAddSuggestion(nom, idx) {
  if (_adaptAssignatures.find(a => a.nom === nom)) {
    if(typeof showToast==='function') showToast('Ja has afegit "'+nom+'"'); return;
  }
  _adaptAssignatures.push({
    id:'local_'+Date.now()+'_'+idx,
    nom, emoji:ADAPT_EMOJIS[idx % ADAPT_EMOJIS.length],
    color:ADAPT_COLORS[idx % ADAPT_COLORS.length], professor:''
  });
  _adaptRenderAssgList();
  if(typeof showToast==='function') showToast('✓ "'+nom+'" afegida');
}

function _adaptDelAssg(idx) {
  _adaptAssignatures.splice(idx, 1);
  _adaptRenderAssgList();
}

async function _adaptNext2() {
  if (_adaptAssignatures.length === 0) {
    if(typeof showToast==='function') showToast('⚠️ Afegeix almenys una assignatura'); return;
  }
  const btn = document.getElementById('a-next2');
  if (btn) { btn.textContent = 'Guardant...'; btn.disabled = true; }

  if (window._supabase && window._currentUser && !window._currentUser.id?.startsWith('local_')) {
    try {
      await window._supabase.from('assignatures').delete().eq('user_id', window._currentUser.id);
      const rows = _adaptAssignatures.map(a => ({
        user_id: window._currentUser.id,
        nom: a.nom, emoji: a.emoji, color: a.color,
        professor: a.professor || null
      }));
      const { data:inserted } = await window._supabase.from('assignatures').insert(rows).select();
      if (inserted) _adaptAssignatures = inserted;
    } catch(e) {
      if(typeof showErrorToast==='function') showErrorToast('⚠️ Error desant assignatures: '+e.message);
    }
  }

  _adaptStep = 2;
  _adaptRenderStep();
}

/* ════════════════════════════════════════════════════════════
   PAS 3 — Horari setmanal
════════════════════════════════════════════════════════════ */
function _adaptRenderStep3(el) {
  el.innerHTML = `
    <div class="adapt-step-header">
      <div class="adapt-step-dots">${_adaptDots(2)}</div>
      <div class="adapt-step-num">Pas 3 de 4</div>
    </div>
    <div class="adapt-hero-emoji">🗓️</div>
    <h2 class="adapt-title">Construïm el teu horari</h2>
    <p class="adapt-subtitle">Clica una cel·la per assignar-hi una classe. Extraescolars amb vora discontínua.</p>

    <div class="adapt-schedule-wrap" id="adapt-schedule-wrap">
      ${_buildGridHTML()}
    </div>

    <div class="adapt-legend" id="adapt-legend">
      ${_buildLegendHTML()}
    </div>

    <button class="adapt-btn-secondary" onclick="_adaptShowExtraForm()" style="margin:10px 0 4px;">
      + Afegeix extraescolar
    </button>
    <div id="a-extra-form" style="display:none;margin-bottom:8px;"></div>
    <div id="a-extras-list"></div>

    <div class="adapt-nav" style="margin-top:20px;">
      <button class="adapt-btn-ghost" onclick="_adaptPrev()">‹ Enrere</button>
      <button class="adapt-btn-primary" onclick="_adaptNext3()">Objectius ›</button>
    </div>`;

  _adaptRenderExtrasList();
}

function _buildGridHTML() {
  let html = `<div class="adapt-grid">
    <div class="adapt-grid-cell adapt-grid-head"></div>
    ${_DIES_NOM.map(d => `<div class="adapt-grid-cell adapt-grid-head">${d.slice(0,2)}</div>`).join('')}`;

  for (const hora of _HORES_GRID) {
    html += `<div class="adapt-grid-cell adapt-grid-hora">${hora}</div>`;
    for (let dia = 0; dia < 5; dia++) {
      const key  = `${dia}_${hora}`;
      const entry = _adaptHorari[key];
      const assg  = entry ? _adaptAssignatures.find(a => a.id === entry.assg_id) : null;
      const bg    = assg ? assg.color + 'CC' : '';
      html += `<div class="adapt-grid-cell adapt-grid-slot${assg?' filled':''}"
        style="${bg?`background:${bg};`:''}"
        onclick="_adaptCellClick('${dia}','${hora}')"
        title="${assg?(typeof _esc==='function'?_esc(assg.nom):assg.nom):'Clica per assignar'}">
        ${assg ? `<span style="font-size:13px;">${assg.emoji}</span><span class="adapt-grid-slot-nom">${typeof _esc==='function'?_esc(assg.nom):assg.nom}</span>` : ''}
      </div>`;
    }
  }
  return html + '</div>';
}

function _buildLegendHTML() {
  return _adaptAssignatures.map(a =>
    `<span class="adapt-legend-item">
      <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${a.color};margin-right:4px;vertical-align:middle;"></span>
      ${typeof _esc==='function'?_esc(a.nom):a.nom}
    </span>`
  ).join('');
}

function _adaptCellClick(dia, hora) {
  document.getElementById('adapt-cell-drop')?.remove();

  const modal = document.querySelector('.adapt-modal');
  const cell  = document.querySelector(`.adapt-grid-slot[onclick="_adaptCellClick('${dia}','${hora}')"]`);
  if (!modal || !cell) return;

  const drop = document.createElement('div');
  drop.id = 'adapt-cell-drop';
  drop.className = 'adapt-cell-dropdown';

  const cellRect  = cell.getBoundingClientRect();
  const modalRect = modal.getBoundingClientRect();
  drop.style.top  = (cellRect.bottom - modalRect.top + modal.scrollTop + 4) + 'px';
  drop.style.left = Math.min(cellRect.left - modalRect.left, modalRect.width - 185) + 'px';

  drop.innerHTML = `
    <div class="adapt-drop-header">${_DIES_NOM[parseInt(dia)]} ${hora}</div>
    <button class="adapt-drop-item" onclick="_adaptAssignCell('${dia}_${hora}',null)">— Buit —</button>
    ${_adaptAssignatures.map(a =>
      `<button class="adapt-drop-item" onclick="_adaptAssignCell('${dia}_${hora}','${a.id}')"
        style="border-left:3px solid ${a.color}">${a.emoji} ${typeof _esc==='function'?_esc(a.nom):a.nom}</button>`
    ).join('')}
    <button class="adapt-drop-cancel" onclick="document.getElementById('adapt-cell-drop')?.remove()">✕ Cancel·lar</button>`;

  modal.appendChild(drop);
}

function _adaptAssignCell(key, assgId) {
  if (!assgId) delete _adaptHorari[key];
  else _adaptHorari[key] = { assg_id: assgId };
  document.getElementById('adapt-cell-drop')?.remove();

  const wrap = document.getElementById('adapt-schedule-wrap');
  if (wrap) wrap.innerHTML = _buildGridHTML();
  const leg = document.getElementById('adapt-legend');
  if (leg) leg.innerHTML = _buildLegendHTML();
}

/* ── Extraescolars ── */
function _adaptShowExtraForm() {
  const form = document.getElementById('a-extra-form');
  if (!form) return;
  _adaptPickedExtraColor = ADAPT_COLORS[2];
  form.style.display = 'block';
  form.innerHTML = `
    <div class="adapt-form-inner">
      <div style="display:grid;grid-template-columns:1fr 80px;gap:8px;margin-bottom:8px;">
        <input id="ef-nom"   class="adapt-input" placeholder="Nom (ex: Bàsquet) *">
        <input id="ef-emoji" class="adapt-input" placeholder="🏀" maxlength="4">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:8px;">
        <select id="ef-dia" class="adapt-select">
          ${_DIES_NOM.map((d,i) => `<option value="${i}">${d}</option>`).join('')}
        </select>
        <input id="ef-hi"   class="adapt-input" type="time" value="16:00">
        <input id="ef-hf"   class="adapt-input" type="time" value="18:00">
        <input id="ef-lloc" class="adapt-input" placeholder="Lloc">
      </div>
      <div class="adapt-color-palette" id="ef-colors" style="margin-bottom:8px;">
        ${ADAPT_COLORS.map((c,i) =>
          `<button class="adapt-color-swatch${i===2?' sel':''}" style="background:${c}"
            onclick="_adaptPickExtraColor('${c}',this)"></button>`
        ).join('')}
      </div>
      <div style="display:flex;gap:8px;">
        <button class="adapt-btn-primary" style="flex:1;" onclick="_adaptSaveExtra()">Afegir ✓</button>
        <button class="adapt-btn-ghost" onclick="document.getElementById('a-extra-form').style.display='none'">Cancel·lar</button>
      </div>
    </div>`;
  document.getElementById('ef-nom')?.focus();
}

function _adaptPickExtraColor(color, btn) {
  _adaptPickedExtraColor = color;
  document.getElementById('ef-colors')?.querySelectorAll('.adapt-color-swatch').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}

function _adaptSaveExtra() {
  const nom = document.getElementById('ef-nom')?.value.trim();
  if (!nom) { if(typeof showToast==='function') showToast('⚠️ Escriu el nom'); return; }
  _adaptExtras.push({
    id: 'extra_'+Date.now(),
    nom,
    emoji:        document.getElementById('ef-emoji')?.value.trim() || '⭐',
    dia_setmana:  parseInt(document.getElementById('ef-dia')?.value || '0'),
    hora_inici:   document.getElementById('ef-hi')?.value  || '16:00',
    hora_fi:      document.getElementById('ef-hf')?.value  || '18:00',
    lloc:         document.getElementById('ef-lloc')?.value.trim() || '',
    color:        _adaptPickedExtraColor
  });
  document.getElementById('a-extra-form').style.display = 'none';
  _adaptRenderExtrasList();
  if(typeof showToast==='function') showToast('✓ "'+nom+'" afegida');
}

function _adaptRenderExtrasList() {
  const list = document.getElementById('a-extras-list');
  if (!list || _adaptExtras.length === 0) { if(list) list.innerHTML=''; return; }
  list.innerHTML = `<div class="adapt-label" style="margin:4px 0;">Extraescolars:</div>` +
    _adaptExtras.map((e,i) => `
      <div class="adapt-assg-item">
        <div class="adapt-assg-color" style="background:${e.color};border:1px dashed rgba(255,255,255,0.4);"></div>
        <span>${e.emoji}</span>
        <span class="adapt-assg-nom">${typeof _esc==='function'?_esc(e.nom):e.nom}</span>
        <span class="adapt-assg-prof">${_DIES_NOM[e.dia_setmana]} ${e.hora_inici}–${e.hora_fi}</span>
        <button class="adapt-assg-del" onclick="_adaptDelExtra(${i})">✕</button>
      </div>`).join('');
}

function _adaptDelExtra(idx) { _adaptExtras.splice(idx, 1); _adaptRenderExtrasList(); }

async function _adaptNext3() {
  const btn = document.querySelector('#adapt-steps-wrap .adapt-btn-primary:last-child');
  if (btn) { btn.textContent='Guardant...'; btn.disabled=true; }

  if (window._supabase && window._currentUser && !window._currentUser.id?.startsWith('local_')) {
    const uid = window._currentUser.id;
    try {
      // Horari classes
      const horariRows = [];
      for (const [key, entry] of Object.entries(_adaptHorari)) {
        if (!entry?.assg_id) continue;
        const [diaStr, hora] = key.split('_');
        const [hh] = hora.split(':');
        const hfi = String(parseInt(hh)+1).padStart(2,'0')+':00:00';
        horariRows.push({
          user_id: uid, assignatura_id: entry.assg_id,
          dia_setmana: parseInt(diaStr),
          hora_inici: hora+':00', hora_fi: hfi
        });
      }
      await window._supabase.from('horari_classes').delete().eq('user_id', uid);
      if (horariRows.length) await window._supabase.from('horari_classes').insert(horariRows);

      // Extraescolars
      await window._supabase.from('extraescolars').delete().eq('user_id', uid);
      if (_adaptExtras.length) {
        const extRows = _adaptExtras.map(e => ({
          user_id: uid, nom: e.nom, emoji: e.emoji, color: e.color,
          dia_setmana: e.dia_setmana,
          hora_inici: e.hora_inici+':00',
          hora_fi:    e.hora_fi+':00',
          lloc:       e.lloc || null
        }));
        await window._supabase.from('extraescolars').insert(extRows);
      }
    } catch(e) {
      if(typeof showErrorToast==='function') showErrorToast('⚠️ Error desant horari: '+e.message);
    }
  }

  _adaptStep = 3;
  _adaptRenderStep();
}

/* ════════════════════════════════════════════════════════════
   PAS 4 — Objectius
════════════════════════════════════════════════════════════ */
const _HORES_DIA = [
  {id:'mati',  e:'🌅', t:'Al matí (7-12h)'},
  {id:'migdia',e:'☀️', t:'Al migdia (12-15h)'},
  {id:'tarda', e:'🌆', t:'A la tarda (15-19h)'},
  {id:'vespre',e:'🌙', t:'Al vespre (19-22h)'}
];

function _adaptRenderStep4(el) {
  const pom   = _adaptData.pomodoros;
  const mins  = pom * 25;
  const nom   = window._userProfile?.username || window._currentUser?.email?.split('@')[0] || 'campeó';
  const numA  = _adaptAssignatures.length;

  el.innerHTML = `
    <div class="adapt-step-header">
      <div class="adapt-step-dots">${_adaptDots(3)}</div>
      <div class="adapt-step-num">Pas 4 de 4</div>
    </div>
    <div class="adapt-hero-emoji">🎯</div>
    <h2 class="adapt-title">Quant vols estudiar cada dia?</h2>

    <div class="adapt-field">
      <label class="adapt-label">Pomodoros diaris (sessions de 25 min)</label>
      <div class="adapt-slider-wrap">
        <input type="range" id="a-pomo-slider" min="1" max="8" value="${pom}"
          class="adapt-slider" oninput="_adaptPomoSlide(this.value)">
        <div class="adapt-slider-labels">${[1,2,3,4,5,6,7,8].map(n=>`<span>${n}</span>`).join('')}</div>
        <div class="adapt-pomo-display">
          <span class="adapt-pomo-num" id="a-pomo-num">${pom}</span>
          <span class="adapt-pomo-eq"  id="a-pomo-eq">${Math.floor(mins/60)}h ${mins%60?mins%60+'min':''} de focus</span>
        </div>
      </div>
    </div>

    <div class="adapt-field">
      <label class="adapt-label">Quan prefereixes estudiar?</label>
      <div class="adapt-pills">
        ${_HORES_DIA.map(h =>
          `<button class="adapt-pill${_adaptData.hores_estudi.includes(h.id)?' selected':''}"
            onclick="_adaptToggleHora('${h.id}',this)">${h.e} ${h.t}</button>`
        ).join('')}
      </div>
    </div>

    <div class="adapt-field">
      <div class="adapt-toggle-row">
        <div>
          <div class="adapt-toggle-title">Avisos intel·ligents</div>
          <div class="adapt-toggle-desc">T'avisem quan tens temps lliure entre classes</div>
        </div>
        <label class="adapt-toggle">
          <input type="checkbox" id="a-notif" ${_adaptData.notificacions?'checked':''}
            onchange="_adaptData.notificacions=this.checked">
          <span class="adapt-toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="adapt-final-msg">
      Perfecte, <strong>${typeof _esc==='function'?_esc(nom):nom}</strong>!
      Ets de <strong>${typeof _esc==='function'?_esc(_adaptData.curs||'el teu curs'):_adaptData.curs}</strong>,
      fas <strong>${numA} assignatura${numA!==1?'s':''}</strong> i vols completar
      <strong id="a-final-pom">${pom} Pomodoros</strong> al dia.
      JOmaxPath t'ajudarà a arribar al teu màxim 🚀
    </div>

    <div class="adapt-nav" style="flex-direction:column;gap:8px;">
      <button class="adapt-btn-primary adapt-btn-big" id="a-finish-btn" onclick="_adaptFinish()">
        Comença el meu camí →
      </button>
      <button class="adapt-btn-ghost" onclick="_adaptPrev()">‹ Enrere</button>
    </div>`;
}

function _adaptPomoSlide(val) {
  const v = parseInt(val);
  _adaptData.pomodoros = v;
  const mins = v * 25;
  const eq  = document.getElementById('a-pomo-eq');
  const num = document.getElementById('a-pomo-num');
  const fp  = document.getElementById('a-final-pom');
  if (eq)  eq.textContent  = `${Math.floor(mins/60)}h ${mins%60?mins%60+'min':''} de focus`.trim();
  if (num) num.textContent = v;
  if (fp)  fp.textContent  = v + ' Pomodoros';
}

function _adaptToggleHora(id, btn) {
  const idx = _adaptData.hores_estudi.indexOf(id);
  if (idx >= 0) { _adaptData.hores_estudi.splice(idx,1); btn.classList.remove('selected'); }
  else           { _adaptData.hores_estudi.push(id);      btn.classList.add('selected'); }
}

async function _adaptFinish() {
  const btn = document.getElementById('a-finish-btn');
  if (btn) { btn.textContent = 'Guardant...'; btn.disabled = true; }

  const pom = parseInt(document.getElementById('a-pomo-slider')?.value || '4');
  _adaptData.pomodoros = pom;

  if (window._supabase && window._currentUser && !window._currentUser.id?.startsWith('local_')) {
    try {
      await window._supabase.from('profiles').update({
        onboarding_adaptability_completed: true,
        objectiu_diari_pomodoros: pom
      }).eq('id', window._currentUser.id);
    } catch(e) {
      if(typeof showErrorToast==='function') showErrorToast('⚠️ Error: '+e.message);
    }
  }

  try { localStorage.setItem('jomaxpath_adapt_v1', JSON.stringify({
    curs: _adaptData.curs, gustos: _adaptData.gustos, pomodoros: pom, completed: true
  })); } catch(_) {}

  if (typeof _adaptContextRefresh === 'function') _adaptContextRefresh();

  _showConfetti();

  setTimeout(() => {
    const root = document.getElementById('adapt-modal-root');
    if (root) { root.style.opacity='0'; root.style.transition='opacity 0.5s'; setTimeout(()=>root.remove(),500); }
    if(typeof showToast==='function') showToast('🎉 Perfil configurat! Benvingut/da al teu camí personalitzat.');
    if(typeof renderHome==='function') renderHome();
    if(typeof renderTodayScheduleWidget==='function') renderTodayScheduleWidget();
  }, 2300);
}

/* ─── Navegació ─── */
function _adaptPrev() {
  if (_adaptStep > 0) { _adaptStep--; _adaptRenderStep(); }
}

function _adaptSkip() {
  if (!confirm('Segur que vols saltar la configuració? Podràs fer-ho més tard des de Configuració → 📚 Acadèmic.')) return;
  if (window._supabase && window._currentUser && !window._currentUser.id?.startsWith('local_')) {
    window._supabase.from('profiles')
      .update({ onboarding_adaptability_completed: true })
      .eq('id', window._currentUser.id).then(()=>{}).catch(()=>{});
  }
  document.getElementById('adapt-modal-root')?.remove();
}

/* ════════════════════════════════════════════════════════════
   CONFETI CSS (sense llibreries externes)
════════════════════════════════════════════════════════════ */
function _showConfetti() {
  if (!document.getElementById('confetti-kf')) {
    const s = document.createElement('style');
    s.id = 'confetti-kf';
    s.textContent = `@keyframes confetti-fall{0%{top:-10px;opacity:1}100%{top:105vh;opacity:0}}`;
    document.head.appendChild(s);
  }
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99998;overflow:hidden;';
  document.body.appendChild(box);
  const colors = ['#7c3aed','#2563eb','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#a3e635'];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('div');
    const c = colors[i % colors.length];
    const sz = 5 + Math.random()*9;
    p.style.cssText = `position:absolute;top:-10px;left:${Math.random()*100}%;`+
      `width:${sz}px;height:${sz}px;background:${c};`+
      `border-radius:${Math.random()>.5?'50%':'2px'};`+
      `animation:confetti-fall ${1.4+Math.random()*.9}s ${Math.random()*.8}s ease-in forwards;`+
      `transform:rotate(${Math.random()*360}deg) translateX(${(Math.random()-.5)*80}px);`;
    box.appendChild(p);
  }
  setTimeout(() => box.remove(), 2800);
}

/* ════════════════════════════════════════════════════════════
   EDITOR DE PERFIL ACADÈMIC (per a Configuració → tab 📚)
════════════════════════════════════════════════════════════ */
async function renderAcademicProfilePanel(container) {
  if (!container) return;
  if (!window._supabase || !window._currentUser || window._currentUser.id?.startsWith('local_')) {
    container.innerHTML = `<div class="adapt-empty-hint" style="padding:20px;text-align:center;">
      Cal iniciar sessió per gestionar el perfil acadèmic.</div>`;
    return;
  }
  container.innerHTML = `<div class="adapt-empty-hint" style="padding:16px;text-align:center;">Carregant...</div>`;
  const uid = window._currentUser.id;

  try {
    const [profR, assgR, extR] = await Promise.all([
      window._supabase.from('profiles').select('curs,gustos,objectiu_diari_pomodoros').eq('id',uid).single(),
      window._supabase.from('assignatures').select('*').eq('user_id',uid).order('nom'),
      window._supabase.from('extraescolars').select('*').eq('user_id',uid).order('dia_setmana')
    ]);

    const profile = profR.data || {};
    _adaptAssignatures = (assgR.data||[]).map(a=>({...a}));
    _adaptExtras = (extR.data||[]).map(e=>({
      ...e,
      hora_inici: (e.hora_inici||'16:00:00').slice(0,5),
      hora_fi:    (e.hora_fi   ||'17:00:00').slice(0,5)
    }));
    if (profile.curs)   _adaptData.curs   = profile.curs;
    if (profile.gustos) _adaptData.gustos = profile.gustos;
    const pom = profile.objectiu_diari_pomodoros || 4;
    _adaptData.pomodoros = pom;

    container.innerHTML = `
      <div class="adapt-cfg-section">
        <h4 style="margin:0 0 14px;font-size:14px;color:var(--text);">📚 Perfil acadèmic</h4>

        <div class="adapt-field">
          <label class="adapt-label">Curs</label>
          <select id="cfg-a-curs" class="adapt-select">
            <option value="">Tria el teu curs...</option>
            ${ADAPT_CURSOS.map(c=>`<option value="${c}"${profile.curs===c?' selected':''}>${c}</option>`).join('')}
          </select>
        </div>

        <div class="adapt-field">
          <label class="adapt-label">Gustos personals</label>
          <div class="adapt-pills">
            ${ADAPT_GUSTOS.map(g=>
              `<button class="adapt-pill${(profile.gustos||[]).includes(g.t)?' selected':''}"
                onclick="_adaptToggleGusto('${g.t}',this)">${g.e} ${g.t}</button>`
            ).join('')}
          </div>
        </div>

        <div class="adapt-field">
          <label class="adapt-label">Pomodoros diaris</label>
          <div class="adapt-slider-wrap">
            <input type="range" id="cfg-a-pomo" min="1" max="8" value="${pom}"
              class="adapt-slider" oninput="_adaptPomoSlide(this.value)">
            <div class="adapt-slider-labels">${[1,2,3,4,5,6,7,8].map(n=>`<span>${n}</span>`).join('')}</div>
            <div class="adapt-pomo-display">
              <span class="adapt-pomo-num" id="a-pomo-num">${pom}</span>
              <span class="adapt-pomo-eq"  id="a-pomo-eq">${pom*25}min de focus</span>
            </div>
          </div>
        </div>

        <div class="adapt-field">
          <label class="adapt-label">Assignatures (${_adaptAssignatures.length})</label>
          <div id="a-assg-list"></div>
          <button class="adapt-btn-secondary" onclick="_adaptShowAssgForm()" style="margin-top:6px;">+ Afegir</button>
          <div id="a-assg-form" style="display:none;margin-top:8px;"></div>
        </div>

        <div class="adapt-field">
          <label class="adapt-label">Extraescolars (${_adaptExtras.length})</label>
          <div id="a-extras-list"></div>
          <button class="adapt-btn-secondary" onclick="_adaptShowExtraForm()" style="margin-top:6px;">+ Afegir</button>
          <div id="a-extra-form" style="display:none;margin-top:8px;"></div>
        </div>

        <button class="adapt-btn-primary" onclick="_saveAcademicProfile()" style="width:100%;margin-top:12px;">
          ✅ Desar perfil acadèmic
        </button>
        <button class="adapt-btn-secondary" onclick="_adaptShowOnboardingAgain()" style="width:100%;margin-top:8px;">
          🔄 Refer la configuració inicial
        </button>
      </div>`;

    _adaptRenderAssgList();
    _adaptRenderExtrasList();
  } catch(e) {
    container.innerHTML = `<div style="color:#fca5a5;padding:12px;font-size:12px;">
      ❌ Error carregant el perfil: ${typeof _esc==='function'?_esc(e.message):e.message}</div>`;
  }
}

async function _saveAcademicProfile() {
  if (!window._supabase || !window._currentUser) return;
  const uid  = window._currentUser.id;
  const curs = document.getElementById('cfg-a-curs')?.value || null;
  const pom  = parseInt(document.getElementById('cfg-a-pomo')?.value || '4');

  try {
    await window._supabase.from('profiles').update({
      curs, gustos: _adaptData.gustos.length ? _adaptData.gustos : null,
      objectiu_diari_pomodoros: pom
    }).eq('id', uid);

    await window._supabase.from('assignatures').delete().eq('user_id', uid);
    if (_adaptAssignatures.length) {
      await window._supabase.from('assignatures').insert(
        _adaptAssignatures.map(a=>({user_id:uid, nom:a.nom, emoji:a.emoji, color:a.color, professor:a.professor||null}))
      );
    }

    await window._supabase.from('extraescolars').delete().eq('user_id', uid);
    if (_adaptExtras.length) {
      await window._supabase.from('extraescolars').insert(
        _adaptExtras.map(e=>({
          user_id:uid, nom:e.nom, emoji:e.emoji, color:e.color,
          dia_setmana:e.dia_setmana,
          hora_inici: e.hora_inici+':00',
          hora_fi:    e.hora_fi+':00',
          lloc: e.lloc||null
        }))
      );
    }

    if (typeof _adaptContextRefresh === 'function') _adaptContextRefresh();
    if(typeof showToast==='function') showToast('✅ Perfil acadèmic desat!');
  } catch(e) {
    if(typeof showErrorToast==='function') showErrorToast('❌ Error: '+e.message);
  }
}

function _adaptShowOnboardingAgain() {
  _adaptAssignatures = [];
  _adaptExtras = [];
  _adaptHorari = {};
  if (typeof closeConfig === 'function') closeConfig();
  _showAdaptModal();
}

/* ════════════════════════════════════════════════════════════
   ESTILOS INJECTATS
════════════════════════════════════════════════════════════ */
function _injectAdaptStyles() {
  if (document.getElementById('adapt-styles')) return;
  const s = document.createElement('style');
  s.id = 'adapt-styles';
  s.textContent = `
/* ── Modal root ── */
#adapt-modal-root{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;}
.adapt-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(4px);}
.adapt-modal{position:relative;background:var(--card,#13132a);border:1px solid rgba(124,58,237,0.3);border-radius:20px;width:min(560px,95vw);max-height:90dvh;overflow-y:auto;padding:28px 30px 24px;box-shadow:0 20px 60px rgba(0,0,0,0.6);scrollbar-width:thin;scrollbar-color:rgba(124,58,237,0.3) transparent;}
@media(max-width:480px){.adapt-modal{padding:16px 14px;border-radius:14px;}}

/* ── Skip + progress ── */
.adapt-skip-btn{position:sticky;top:0;float:right;background:none;border:none;color:var(--muted,#6b7280);cursor:pointer;font-size:10px;font-family:'Space Mono',monospace;letter-spacing:1px;padding:4px 8px;border-radius:6px;z-index:1;}
.adapt-skip-btn:hover{color:var(--text,#e2e8f0);}
.adapt-progress-bar{clear:both;height:3px;background:rgba(255,255,255,0.08);border-radius:2px;margin-bottom:22px;overflow:hidden;}
.adapt-progress-fill{height:100%;background:linear-gradient(90deg,#7c3aed,#00b4d8);border-radius:2px;transition:width .4s ease;}

/* ── Step transitions ── */
.adapt-steps-wrap{position:relative;overflow:hidden;}
.adapt-step{transition:transform .22s ease,opacity .22s ease;}

/* ── Step header ── */
.adapt-step-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
.adapt-step-dots{display:flex;gap:6px;}
.adapt-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.12);transition:background .3s;}
.adapt-dot.active{background:#7c3aed;}
.adapt-step-num{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted,#6b7280);letter-spacing:2px;}

/* ── Content ── */
.adapt-hero-emoji{font-size:44px;text-align:center;margin:2px 0 10px;line-height:1;}
.adapt-title{font-size:20px;font-weight:700;color:var(--text,#e2e8f0);text-align:center;margin:0 0 5px;}
.adapt-subtitle{font-size:12px;color:var(--muted,#6b7280);text-align:center;margin:0 0 18px;line-height:1.5;}
.adapt-field{margin-bottom:14px;}
.adapt-label{display:block;font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:1.5px;color:var(--muted,#6b7280);margin-bottom:6px;text-transform:uppercase;}
.adapt-label-hint{text-transform:none;font-size:10px;letter-spacing:0;margin-left:4px;}
.adapt-char-count{text-align:right;font-size:10px;color:var(--muted);margin-top:2px;}
.adapt-empty-hint{text-align:center;color:var(--muted);font-size:12px;padding:12px;}

/* ── Inputs ── */
.adapt-select,.adapt-input{width:100%;background:var(--card2,#1e1e3a);border:1px solid var(--border,rgba(255,255,255,0.1));color:var(--text,#e2e8f0);border-radius:10px;padding:9px 12px;font-size:13px;outline:none;box-sizing:border-box;transition:border-color .2s;}
.adapt-select:focus,.adapt-input:focus{border-color:rgba(124,58,237,0.5);}

/* ── Pills ── */
.adapt-pills{display:flex;flex-wrap:wrap;gap:7px;}
.adapt-pill{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--muted,#6b7280);border-radius:20px;padding:6px 13px;font-size:12px;cursor:pointer;transition:all .2s;}
.adapt-pill.selected{background:rgba(124,58,237,0.22);border-color:rgba(124,58,237,0.55);color:#a78bfa;font-weight:600;}

/* ── Buttons ── */
.adapt-nav{display:flex;justify-content:space-between;align-items:center;margin-top:22px;gap:10px;}
.adapt-btn-primary{background:linear-gradient(135deg,#7c3aed,#2563eb);border:none;color:#fff;border-radius:12px;padding:11px 22px;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .2s;}
.adapt-btn-primary:hover{opacity:.88;}
.adapt-btn-primary:disabled{opacity:.35;cursor:not-allowed;}
.adapt-btn-big{width:100%;padding:15px;font-size:15px;border-radius:14px;}
.adapt-btn-ghost{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--muted,#6b7280);border-radius:12px;padding:10px 18px;font-size:12px;cursor:pointer;transition:all .2s;}
.adapt-btn-ghost:hover{background:rgba(255,255,255,0.09);color:var(--text);}
.adapt-btn-secondary{background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.28);color:#a78bfa;border-radius:10px;padding:8px 14px;font-size:12px;cursor:pointer;transition:all .2s;}
.adapt-btn-secondary:hover{background:rgba(124,58,237,0.2);}

/* ── Assignatures ── */
.adapt-assg-list{margin-bottom:8px;}
.adapt-assg-item{display:flex;align-items:center;gap:7px;padding:8px 11px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin-bottom:5px;}
.adapt-assg-color{width:10px;height:10px;border-radius:3px;flex-shrink:0;}
.adapt-assg-emoji{font-size:15px;flex-shrink:0;}
.adapt-assg-nom{flex:1;font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.adapt-assg-prof{font-size:10px;color:var(--muted);}
.adapt-assg-del{background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;flex-shrink:0;padding:2px 4px;border-radius:4px;transition:color .2s;}
.adapt-assg-del:hover{color:#fca5a5;}
.adapt-form-inner{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:12px;}
.adapt-color-palette{display:flex;gap:6px;flex-wrap:wrap;}
.adapt-color-swatch{width:22px;height:22px;border-radius:6px;border:2px solid transparent;cursor:pointer;transition:transform .15s,border-color .15s;}
.adapt-color-swatch:hover{transform:scale(1.2);}
.adapt-color-swatch.sel{border-color:#fff;transform:scale(1.2);}
.adapt-sugg-section{margin-top:12px;padding:11px;background:rgba(0,180,216,0.05);border:1px solid rgba(0,180,216,0.13);border-radius:12px;}

/* ── Grid horari ── */
.adapt-schedule-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:8px;border-radius:10px;}
.adapt-grid{display:grid;grid-template-columns:48px repeat(5,1fr);gap:2px;min-width:300px;}
.adapt-grid-cell{min-height:40px;display:flex;align-items:center;justify-content:center;border-radius:5px;flex-direction:column;gap:1px;}
.adapt-grid-head{background:rgba(124,58,237,0.1);font-family:'Space Mono',monospace;font-size:8px;letter-spacing:1px;color:var(--muted);font-weight:700;}
.adapt-grid-hora{background:rgba(255,255,255,0.03);font-family:'Space Mono',monospace;font-size:8px;color:var(--muted);}
.adapt-grid-slot{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:all .15s;color:var(--text);text-align:center;padding:2px;overflow:hidden;}
.adapt-grid-slot:hover{background:rgba(124,58,237,0.15);border-color:rgba(124,58,237,0.3);}
.adapt-grid-slot.filled{font-weight:600;}
.adapt-grid-slot-nom{font-size:8px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:100%;display:block;}

/* ── Cell dropdown ── */
.adapt-cell-dropdown{position:absolute;background:var(--card,#13132a);border:1px solid rgba(124,58,237,0.35);border-radius:12px;padding:10px;z-index:200;min-width:170px;box-shadow:0 8px 30px rgba(0,0,0,0.5);}
.adapt-drop-header{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:6px;letter-spacing:1px;}
.adapt-drop-item{display:block;width:100%;text-align:left;background:none;border:none;color:var(--text);padding:7px 10px;border-radius:7px;cursor:pointer;font-size:11px;transition:background .15s;border-left:3px solid transparent;}
.adapt-drop-item:hover{background:rgba(124,58,237,0.15);}
.adapt-drop-cancel{display:block;width:100%;text-align:center;background:none;border:none;color:var(--muted);padding:5px;border-radius:7px;cursor:pointer;font-size:10px;margin-top:4px;}
.adapt-legend{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px;}
.adapt-legend-item{font-size:11px;color:var(--muted);display:flex;align-items:center;}

/* ── Slider ── */
.adapt-slider-wrap{padding:2px 0;}
.adapt-slider{width:100%;accent-color:#7c3aed;cursor:pointer;margin:4px 0;}
.adapt-slider-labels{display:flex;justify-content:space-between;font-size:9px;color:var(--muted);padding:0 2px;}
.adapt-pomo-display{text-align:center;margin-top:10px;padding:10px;background:rgba(124,58,237,0.1);border-radius:10px;}
.adapt-pomo-num{font-size:30px;font-weight:700;color:#a78bfa;}
.adapt-pomo-eq{display:block;font-size:11px;color:var(--muted);margin-top:2px;}

/* ── Toggle ── */
.adapt-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;background:rgba(255,255,255,0.04);border-radius:10px;}
.adapt-toggle-title{font-size:13px;font-weight:600;color:var(--text);}
.adapt-toggle-desc{font-size:11px;color:var(--muted);margin-top:2px;}
.adapt-toggle{position:relative;display:inline-block;width:42px;height:22px;flex-shrink:0;}
.adapt-toggle input{opacity:0;width:0;height:0;}
.adapt-toggle-slider{position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,0.12);border-radius:22px;transition:.3s;}
.adapt-toggle-slider:before{content:"";position:absolute;height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.3s;}
.adapt-toggle input:checked+.adapt-toggle-slider{background:#7c3aed;}
.adapt-toggle input:checked+.adapt-toggle-slider:before{transform:translateX(20px);}

/* ── Final message ── */
.adapt-final-msg{background:linear-gradient(135deg,rgba(124,58,237,0.1),rgba(0,180,216,0.06));border:1px solid rgba(124,58,237,0.22);border-radius:14px;padding:14px;font-size:13px;color:var(--text);line-height:1.6;margin:14px 0;text-align:center;}

/* ── Config panel ── */
.adapt-cfg-section{padding:2px 0;}
`;
  document.head.appendChild(s);
}
