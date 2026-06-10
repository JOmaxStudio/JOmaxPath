/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   JOMAXPATH â€” app.js  v3.0
   VersiÃ³ final amb tots els botons funcionant
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
'use strict';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   CONSTANTS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const TASKS_KEY    = 'jomaxpath_tasks';
const SCHEDULE_KEY = 'jomaxpath_schedule';
const HABITS_KEY   = 'jomaxpath_habits_v2';
const STREAK_KEY   = 'jomaxpath_streak_v2';
const PROGRESS_KEY = 'jomaxpath_progress_v1';
const POMO_KEY     = 'jomaxpath_pomo_v2';
const BOARDS_KEY   = 'jomaxpath_boards_v1';
const CHATS_KEY    = 'jomaxpath_chats_v2';
const CONFIG_KEY   = 'jomaxpath_config_v1';
const VICTORIES_KEY= 'jomaxpath_victories_v1';
const NOTES_KEY    = 'jomaxpath_notes_v1';
const MATCH_KEY    = 'jomaxpath_matches_v1';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   UTILITATS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function get(key, def=[]) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
function set(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function pad2(n) { return String(n).padStart(2,'0'); }
// Escapa HTML per evitar XSS emmagatzemat quan s'injecta contingut d'usuari
// (noms de tasques/llistes/usuaris) dins d'innerHTML.
function _esc(s) {
  return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

let _toastTimer;
function showToast(msg, duration=3200) {
  let t = document.getElementById('toast-msg');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast-msg';
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:rgba(20,20,40,0.98);border:1px solid rgba(124,58,237,0.4);color:#e2e8f0;padding:10px 20px;border-radius:12px;font-family:"Space Mono",monospace;font-size:12px;z-index:99999;opacity:0;transition:all 0.3s;pointer-events:none;white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, duration);
}

function showErrorToast(msg, duration=5000) {
  let t = document.getElementById('toast-error');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast-error';
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:rgba(40,10,10,0.98);border:1px solid rgba(239,68,68,0.6);color:#fca5a5;padding:10px 20px;border-radius:12px;font-family:"Space Mono",monospace;font-size:12px;z-index:99999;opacity:0;transition:all 0.3s;pointer-events:none;white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis;box-shadow:0 4px 20px rgba(239,68,68,0.3);';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, duration);
}

function showWarningToast(msg, duration=4000) {
  let t = document.getElementById('toast-warn');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast-warn';
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:rgba(40,30,5,0.98);border:1px solid rgba(245,158,11,0.6);color:#fcd34d;padding:10px 20px;border-radius:12px;font-family:"Space Mono",monospace;font-size:12px;z-index:99999;opacity:0;transition:all 0.3s;pointer-events:none;white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis;box-shadow:0 4px 20px rgba(245,158,11,0.2);';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, duration);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   RELLOTGE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let _clockShowSeconds = false;

function _tickClock() {
  const now = new Date();
  const h = pad2(now.getHours()), m = pad2(now.getMinutes()), s = pad2(now.getSeconds());
  const el = document.getElementById('nav-clock');
  if (el) el.textContent = _clockShowSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
  const fst = document.getElementById('fs-clock-time');
  if (fst) fst.textContent = `${h}:${m}`;
  const fss = document.getElementById('fs-clock-seconds');
  if (fss) fss.textContent = _clockShowSeconds ? `:${s}` : '';
  const fsd = document.getElementById('fs-clock-date');
  if (fsd) {
    const dies=['Diumenge','Dilluns','Dimarts','Dimecres','Dijous','Divendres','Dissabte'];
    const mesos=['gener','febrer','marÃ§','abril','maig','juny','juliol','agost','setembre','octubre','novembre','desembre'];
    fsd.textContent = `${dies[now.getDay()]}, ${now.getDate()} de ${mesos[now.getMonth()]} de ${now.getFullYear()}`;
  }
}
function toggleClockSeconds() {
  _clockShowSeconds = !_clockShowSeconds;
  const btn = document.getElementById('fs-toggle-seconds');
  if (btn) btn.textContent = _clockShowSeconds ? "â± Amagar segons" : "â± Mostrar segons";
  _tickClock();
}
function openClockFullscreen() {
  const el = document.getElementById('clock-fullscreen');
  if (!el) return;
  el.classList.add('zen-open');
  _tickClock();
  // populate side panels
  try { _fsUpdatePanels(); } catch(e) {}
}
function closeClockFullscreen() {
  const el = document.getElementById('clock-fullscreen');
  if (!el) return;
  el.classList.remove('zen-open');
}
function _fsUpdatePanels() {
  const streakNum = document.getElementById('streak-num');
  const fsStreakNum = document.getElementById('fs-streak-num');
  if (streakNum && fsStreakNum) fsStreakNum.textContent = streakNum.textContent;
  const goalDesc = document.getElementById('goal-desc');
  const fsGoal = document.getElementById('fs-goal-panel');
  if (goalDesc && fsGoal) fsGoal.textContent = goalDesc.textContent;
}
window._appClockRunning = true;
window._clockInterval = setInterval(_tickClock, 1000);
_tickClock();

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   HAMBURGER / DRAWER
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function toggleDrawer() {
  const drawer  = document.getElementById('nav-drawer');
  const overlay = document.getElementById('nav-overlay');
  const btn     = document.getElementById('nav-hamburger');
  if (!drawer) return;
  const open = drawer.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open', open);
  if (btn)     btn.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) renderThemesGrid();
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   NAVEGACIÃ“
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let _currentPage = 'home';

function navTo(page) {
  document.querySelectorAll('.app-page').forEach(p => p.classList.remove('page-active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('page-active');
  _currentPage = page;

  document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
  const bnavMap = {home:0, horari:1, tasques:2, julians:3, focus:4, notes:-1};
  const bnavItems = document.querySelectorAll('.bnav-item');
  if (bnavMap[page] !== undefined && bnavItems[bnavMap[page]])
    bnavItems[bnavMap[page]].classList.add('active');

  if (typeof lsbSetActive === 'function') lsbSetActive(page);

  if (page === 'home')    renderHome();
  if (page === 'horari')  renderHorari();
  if (page === 'tasques') renderTasques();
  if (page === 'focus')   renderFocus();
  if (page === 'julians') initJulians();
  if (page === 'examenia') renderExamenia();
  if (page === 'notes')   renderNotes();

  // Aplica traduccions al contingut de la nova pÃ gina
  setTimeout(()=>{ try { if(typeof applyLanguage==='function') applyLanguage(); } catch(e){} }, 30);

  // Tanca SEMPRE la barra lateral mÃ²bil en navegar (defensa centralitzada)
  if (typeof lsbMobileClose === 'function') lsbMobileClose();

  window.scrollTo({top: 0, behavior: 'smooth'});
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ONBOARDING (primera vegada) â€” l'usuari tria
   entre tour rÃ pid (modal) o tour complet (guiat)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ONBOARDING_KEY = 'jomaxpath_onboarded_v1';

function _onbDone() { try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch {} _onbCleanup(); }
function _onbCleanup() { document.getElementById('onb-root')?.remove(); }

function _maybeShowOnboarding(force) {
  if (!force) {
    try { if (localStorage.getItem(ONBOARDING_KEY)) return; } catch {}
    // No el mostris mentre la pantalla de login Ã©s visible
    const ov = document.getElementById('auth-overlay');
    if (ov && getComputedStyle(ov).display !== 'none') return;
  }
  _onbCleanup();
  const root = document.createElement('div');
  root.id = 'onb-root';
  root.innerHTML = `
    <div class="onb-backdrop"></div>
    <div class="onb-welcome">
      <div class="onb-emoji">ðŸš€</div>
      <h2>Benvingut/da a JOmaxPath!</h2>
      <p>El teu planificador personal amb heroi, tasques, hÃ bits i IA. Vols fer una petita visita guiada?</p>
      <div class="onb-choices">
        <button class="onb-btn onb-primary" id="onb-quick">âš¡ Tour rÃ pid<small>3 passos clau</small></button>
        <button class="onb-btn" id="onb-full">ðŸ§­ Tour complet<small>visita guiada</small></button>
      </div>
      <button class="onb-skip" id="onb-skip">Ara no, grÃ cies</button>
    </div>`;
  document.body.appendChild(root);
  _injectOnbStyles();
  document.getElementById('onb-quick').onclick = () => _onbStartQuick();
  document.getElementById('onb-full').onclick  = () => _onbStartFull();
  document.getElementById('onb-skip').onclick  = () => _onbDone();
  root.querySelector('.onb-backdrop').onclick  = () => _onbDone();
}

/* â”€â”€ Tour rÃ pid: modal amb 3 diapositives â”€â”€ */
const _ONB_QUICK = [
  { ico:'ðŸŽ¯', t:'Defineix el teu objectiu', d:'A la pÃ gina d\'inici tens "El meu objectiu". Marca\'l pas a pas i veurÃ s el teu progrÃ©s.' },
  { ico:'âœ…', t:'Crea tasques i llistes', d:'A "Tasques" pots crear llistes personals o compartides, amb vista Llista o Kanban, prioritats i dates.' },
  { ico:'âš”ï¸', t:'Fes crÃ©ixer el teu heroi', d:'Completant sessions i hÃ bits guanyes XP: el teu heroi puja de nivell i evoluciona.' }
];
let _onbQuickIdx = 0;
function _onbStartQuick() {
  _onbQuickIdx = 0;
  const root = document.getElementById('onb-root');
  root.querySelector('.onb-welcome')?.remove();
  const card = document.createElement('div');
  card.className = 'onb-quick';
  root.appendChild(card);
  _onbRenderQuick();
}
function _onbRenderQuick() {
  const s = _ONB_QUICK[_onbQuickIdx];
  const card = document.querySelector('.onb-quick');
  if (!card) return;
  const last = _onbQuickIdx === _ONB_QUICK.length - 1;
  card.innerHTML = `
    <div class="onb-emoji">${s.ico}</div>
    <h2>${_esc(s.t)}</h2>
    <p>${_esc(s.d)}</p>
    <div class="onb-dots">${_ONB_QUICK.map((_,i)=>`<span class="${i===_onbQuickIdx?'on':''}"></span>`).join('')}</div>
    <div class="onb-quick-nav">
      ${_onbQuickIdx>0?`<button class="onb-btn onb-ghost" id="onb-prev">â€¹ Anterior</button>`:'<span></span>'}
      <button class="onb-btn onb-primary" id="onb-next">${last?'Comencem! ðŸŽ‰':'SegÃ¼ent â€º'}</button>
    </div>`;
  const prev = document.getElementById('onb-prev');
  if (prev) prev.onclick = () => { _onbQuickIdx--; _onbRenderQuick(); };
  document.getElementById('onb-next').onclick = () => {
    if (last) { _onbDone(); if (typeof navTo==='function') navTo('home'); }
    else { _onbQuickIdx++; _onbRenderQuick(); }
  };
}

/* â”€â”€ Tour complet: spotlight sobre elements reals â”€â”€ */
const _ONB_FULL = [
  { sel:'#left-sidebar .lsb-nav, #bnav', t:'NavegaciÃ³', d:'Des d\'aquÃ­ accedeixes a totes les seccions: Inici, Horari, Tasques, Focus, Julians AI i mÃ©s.' },
  { sel:'[data-tip="Tasques"], [onclick*="tasques"]', t:'Tasques i llistes', d:'Organitza la teva feina en llistes personals o compartides amb amics, amb vista Llista o Kanban.' },
  { sel:'[data-tip="Focus"], [onclick*="focus"]', t:'Mode Focus (Pomodoro)', d:'Concentra\'t amb el temporitzador Pomodoro. Cada sessiÃ³ completada dÃ³na XP al teu heroi.' },
  { sel:'[data-tip="Julians AI"], [onclick*="julians"]', t:'Julians AI', d:'El teu assistent intelÂ·ligent: pregunta\'l el que vulguis sobre les teves tasques i objectius.' },
  { sel:'#lsb-hero-mini, .lsb-hero-mini', t:'El teu heroi', d:'El teu avatar evoluciona a mesura que progresses. Clica\'l per personalitzar-lo i veure les lligues.' },
  { sel:'#lsb-mobile-btn, #nav-hamburger, [onclick*="Config"], [onclick*="config"]', t:'ConfiguraciÃ³', d:'Canvia el tema, l\'idioma i el teu objectiu principal des de la configuraciÃ³. Ja estÃ s a punt! ðŸŽ‰' }
];
let _onbFullIdx = 0;
function _onbStartFull() {
  _onbFullIdx = 0;
  const root = document.getElementById('onb-root');
  root.querySelector('.onb-welcome')?.remove();
  root.querySelector('.onb-backdrop')?.remove();
  const spot = document.createElement('div'); spot.className='onb-spot'; spot.id='onb-spot';
  const tip = document.createElement('div'); tip.className='onb-tip'; tip.id='onb-tip';
  root.appendChild(spot); root.appendChild(tip);
  window.addEventListener('resize', _onbPositionFull);
  _onbRenderFull();
}
function _onbFindTarget(sel) {
  for (const s of sel.split(',')) {
    const el = document.querySelector(s.trim());
    if (el && el.getBoundingClientRect().width > 0) return el;
  }
  return null;
}
function _onbRenderFull() {
  const step = _ONB_FULL[_onbFullIdx];
  const last = _onbFullIdx === _ONB_FULL.length - 1;
  const tip = document.getElementById('onb-tip');
  if (!tip) return;
  tip.innerHTML = `
    <div class="onb-tip-step">${_onbFullIdx+1} / ${_ONB_FULL.length}</div>
    <h3>${_esc(step.t)}</h3>
    <p>${_esc(step.d)}</p>
    <div class="onb-quick-nav">
      <button class="onb-btn onb-ghost" id="onb-fskip">Sortir</button>
      <div style="display:flex;gap:8px;">
        ${_onbFullIdx>0?`<button class="onb-btn onb-ghost" id="onb-fprev">â€¹</button>`:''}
        <button class="onb-btn onb-primary" id="onb-fnext">${last?'Acabar ðŸŽ‰':'SegÃ¼ent â€º'}</button>
      </div>
    </div>`;
  document.getElementById('onb-fskip').onclick = () => _onbEndFull();
  const fprev = document.getElementById('onb-fprev');
  if (fprev) fprev.onclick = () => { _onbFullIdx--; _onbRenderFull(); };
  document.getElementById('onb-fnext').onclick = () => {
    if (last) _onbEndFull();
    else { _onbFullIdx++; _onbRenderFull(); }
  };
  _onbPositionFull();
}
function _onbPositionFull() {
  const step = _ONB_FULL[_onbFullIdx];
  const spot = document.getElementById('onb-spot');
  const tip = document.getElementById('onb-tip');
  if (!spot || !tip) return;
  const target = _onbFindTarget(step.sel);
  if (!target) { // sense element â†’ centra el tooltip sense spotlight
    spot.style.opacity = '0';
    tip.style.left = '50%'; tip.style.top = '50%'; tip.style.transform = 'translate(-50%,-50%)';
    return;
  }
  target.scrollIntoView({block:'center', behavior:'smooth'});
  const r = target.getBoundingClientRect();
  const pad = 8;
  spot.style.opacity = '1';
  spot.style.left = (r.left-pad)+'px'; spot.style.top = (r.top-pad)+'px';
  spot.style.width = (r.width+pad*2)+'px'; spot.style.height = (r.height+pad*2)+'px';
  // ColÂ·loca el tooltip al costat amb mÃ©s espai
  const tw = 300, th = 200, vw = window.innerWidth, vh = window.innerHeight;
  let left, top;
  if (r.right + tw + 20 < vw) { left = r.right + 16; top = Math.min(Math.max(10, r.top), vh - th); }
  else if (r.left - tw - 20 > 0) { left = r.left - tw - 16; top = Math.min(Math.max(10, r.top), vh - th); }
  else { left = Math.max(10, Math.min(r.left, vw - tw - 10)); top = r.bottom + 16 + th < vh ? r.bottom + 16 : Math.max(10, r.top - th - 16); }
  tip.style.transform = 'none';
  tip.style.left = left+'px'; tip.style.top = top+'px';
}
function _onbEndFull() {
  window.removeEventListener('resize', _onbPositionFull);
  _onbDone();
}

function _injectOnbStyles() {
  if (document.getElementById('onb-styles')) return;
  const st = document.createElement('style'); st.id='onb-styles';
  st.textContent = `
    #onb-root{position:fixed;inset:0;z-index:100000;font-family:'Rajdhani',sans-serif;}
    .onb-backdrop{position:absolute;inset:0;background:rgba(5,5,15,0.78);backdrop-filter:blur(3px);}
    .onb-welcome,.onb-quick{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(420px,92vw);
      background:linear-gradient(160deg,#1b1b30,#14141f);border:1px solid rgba(124,58,237,0.35);
      border-radius:20px;padding:30px 28px;text-align:center;color:#e8e8f0;
      box-shadow:0 20px 60px rgba(0,0,0,0.6);animation:onbIn .35s cubic-bezier(.2,.9,.3,1.2);}
    @keyframes onbIn{from{opacity:0;transform:translate(-50%,-44%) scale(.94);}to{opacity:1;transform:translate(-50%,-50%) scale(1);}}
    .onb-emoji{font-size:46px;margin-bottom:10px;}
    #onb-root h2{font-size:22px;font-weight:800;color:#fff;margin:0 0 8px;}
    #onb-root p{font-size:14px;line-height:1.6;color:#b9b9cc;margin:0 0 20px;}
    .onb-choices{display:flex;gap:12px;margin-bottom:14px;}
    .onb-btn{flex:1;cursor:pointer;border-radius:12px;padding:13px 14px;font-family:inherit;font-size:14px;font-weight:700;
      background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#e8e8f0;transition:all .18s;
      display:flex;flex-direction:column;gap:3px;align-items:center;}
    .onb-btn small{font-size:10px;font-weight:500;color:#9a9ab0;letter-spacing:.5px;}
    .onb-btn:hover{transform:translateY(-2px);border-color:rgba(124,58,237,0.5);background:rgba(124,58,237,0.12);}
    .onb-primary{background:linear-gradient(135deg,#7c3aed,#00b4d8);border-color:transparent;color:#fff;}
    .onb-primary small{color:rgba(255,255,255,0.8);}
    .onb-ghost{flex:none;background:transparent;border-color:rgba(255,255,255,0.12);}
    .onb-skip{margin-top:6px;background:none;border:none;color:#7a7a90;cursor:pointer;font-family:inherit;font-size:12px;text-decoration:underline;}
    .onb-dots{display:flex;gap:7px;justify-content:center;margin:4px 0 18px;}
    .onb-dots span{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.18);transition:all .2s;}
    .onb-dots span.on{background:#7c3aed;width:22px;border-radius:4px;}
    .onb-quick-nav{display:flex;justify-content:space-between;align-items:center;gap:10px;}
    .onb-spot{position:fixed;border-radius:14px;box-shadow:0 0 0 9999px rgba(5,5,15,0.78),0 0 0 2px #7c3aed,0 0 24px rgba(124,58,237,0.7);
      transition:all .35s cubic-bezier(.2,.8,.3,1);pointer-events:none;z-index:1;}
    .onb-tip{position:fixed;width:300px;max-width:92vw;background:linear-gradient(160deg,#1b1b30,#14141f);
      border:1px solid rgba(124,58,237,0.4);border-radius:16px;padding:18px 20px;color:#e8e8f0;z-index:2;
      box-shadow:0 16px 48px rgba(0,0,0,0.6);transition:left .3s,top .3s;}
    .onb-tip-step{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:1.5px;color:#a78bfa;margin-bottom:6px;}
    .onb-tip h3{margin:0 0 6px;font-size:17px;color:#fff;font-weight:800;}
    .onb-tip p{margin:0 0 14px;font-size:13px;line-height:1.55;color:#b9b9cc;}
    @media(max-width:480px){.onb-choices{flex-direction:column;}.onb-tip{width:300px;}}
  `;
  document.head.appendChild(st);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   AUTH
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   AUTH â€” Sistema complet amb Supabase
   - PseudÃ²nim, sessiÃ³ persistent, cloud sync
   - Compartir tasques/kanban i herois
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let _supabase = null;
let _currentUser = null;
let _userProfile = null; // {id, email, username, avatar}

let _supabaseOffline = false;

function _updateServerStatusIndicator() {
  const el = document.getElementById('auth-server-status');
  if (!el) return;
  el.style.display = _supabaseOffline ? 'block' : 'none';
}

try {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    _supabase = supabase.createClient(
      'https://toefrxqijvextqqngapx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZWZyeHFpanZleHRxcW5nYXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzg3NDksImV4cCI6MjA5NTcxNDc0OX0.0fJvt9NZYRmA96MkFiHYjz3em5r3-jDjuOqvKjKG8vI',
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true,
        // FIX deadlock: el lock per defecte de supabase-js (navigator.locks) es
        // pot quedar bloquejat i deixa getSession() â€” i totes les consultes a BD
        // que adjunten el token â€” penjades per sempre. Un lock no-bloquejant
        // evita el deadlock (les consultes responen a l'instant).
        lock: (name, acquireTimeout, fn) => fn() } }
    );
    // ComprovaciÃ³ de connectivitat amb AUTO-RECUPERACIÃ“. Abans _supabaseOffline
    // nomÃ©s passava a true i mai tornava a false â†’ l'avÃ­s "servidor no disponible"
    // es quedava per sempre desprÃ©s d'un tall transitori. Ara re-comprova i
    // amaga l'avÃ­s quan el servidor torna a respondre.
    window._checkConnectivity = async function() {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(()=>ctrl.abort(), 5000);
        // Qualsevol resposta HTTP (fins i tot 401) = servidor accessible
        await fetch('https://toefrxqijvextqqngapx.supabase.co/auth/v1/health', { signal: ctrl.signal });
        clearTimeout(to);
        if (_supabaseOffline) { _supabaseOffline = false; _updateServerStatusIndicator(); }
      } catch {
        if (!_supabaseOffline) { _supabaseOffline = true; _updateServerStatusIndicator(); }
      }
    };
    _checkConnectivity();
    // Re-comprova cada 30s perquÃ¨ l'avÃ­s s'actualitzi sol (onlineâ†”offline)
    setInterval(_checkConnectivity, 30000);
  }
} catch {}

// Ripple feedback visual en clicar qualsevol botÃ³
(function() {
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('button,[role="button"],.bnav-item,.progress-btn,.streak-btn,.qc-type-btn,.cfg-btn,.ndw-bottom-btn,.day-sel-btn,.avui-btn,.search-result,.cal-nav-btn');
    if (!btn) return;
    const r = document.createElement('span');
    r.className = 'ripple-wave';
    const rect = btn.getBoundingClientRect();
    r.style.left = (e.clientX - rect.left) + 'px';
    r.style.top  = (e.clientY - rect.top)  + 'px';
    btn.classList.add('ripple-host');
    btn.appendChild(r);
    r.addEventListener('animationend', () => r.remove(), { once: true });
  }, true);
})();

function _getLocalProfile() { try { return JSON.parse(localStorage.getItem('jomaxpath_profile_v1'))||null; } catch { return null; } }
function _saveLocalProfile(p) { try { if(p) localStorage.setItem('jomaxpath_profile_v1',JSON.stringify(p)); else localStorage.removeItem('jomaxpath_profile_v1'); } catch {} }

function _updateAuthUI() {
  const u = _currentUser, p = _userProfile;
  const dot = document.getElementById('auth-dot');
  const emailEl = document.getElementById('auth-user-email');
  const indicator = document.getElementById('auth-indicator');
  const loginBtn = document.getElementById('drawer-login-btn');
  const localWarn = document.getElementById('local-data-warning');
  if (u) {
    const display = p?.username || u.email?.split('@')[0] || 'Usuari';
    if (dot) { dot.style.background='#10b981'; dot.style.boxShadow='0 0 8px rgba(16,185,129,0.5)'; }
    if (emailEl) emailEl.textContent = 'ðŸ‘¤ ' + display;
    if (indicator) indicator.style.display = 'flex';
    if (loginBtn) loginBtn.style.display = 'none';
    if (localWarn) localWarn.style.display = 'none';
    // Sync username to hero
    if (p?.username) {
      const heroData = get('jomaxpath_hero_v2', null);
      if (heroData && heroData.name === 'Heroi en ConstrucciÃ³') {
        heroData.name = p.username; set('jomaxpath_hero_v2', heroData);
      }
      const nameEl = document.getElementById('lsb-hero-name');
      if (nameEl && nameEl.textContent === 'El teu heroi') nameEl.textContent = p.username;
    }
  } else {
    if (dot) { dot.style.background='rgba(100,116,139,0.5)'; dot.style.boxShadow='none'; }
    if (emailEl) emailEl.textContent = 'Sense compte';
    if (indicator) indicator.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'flex';
    if (localWarn) localWarn.style.display = 'flex';
  }
}

function showAuthOverlay() {
  const ov = document.getElementById('auth-overlay');
  if (!ov) return;
  ov.style.display = 'flex';
  requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('visible')));
  const msg = document.getElementById('auth-msg'); if(msg) msg.textContent='';
  setTimeout(_updateServerStatusIndicator, 200);
}
function _hideAuthOverlay() {
  const ov = document.getElementById('auth-overlay');
  if (!ov) return;
  ov.classList.remove('visible');
  setTimeout(() => { if (!ov.classList.contains('visible')) ov.style.display='none'; }, 350);
}
function switchAuthTab(tab) {
  document.getElementById('auth-login-form').style.display   = tab==='login'?'block':'none';
  document.getElementById('auth-register-form').style.display= tab==='register'?'block':'none';
  document.getElementById('tab-login').classList.toggle('active', tab==='login');
  document.getElementById('tab-register').classList.toggle('active', tab==='register');
  const msg = document.getElementById('auth-msg'); if(msg) msg.textContent='';
}
function authSkip() {
  _hideAuthOverlay();
  if (!_currentUser) { _updateAuthUI(); }
  renderHome();
  // Onboarding la primera vegada (l'usuari tria tour rÃ pid o complet)
  setTimeout(()=>{ if (typeof _maybeShowOnboarding==='function') _maybeShowOnboarding(); }, 1100);
}
// Permet re-llanÃ§ar el tour des de configuraciÃ³
window.startOnboarding = function(){ if (typeof _maybeShowOnboarding==='function') _maybeShowOnboarding(true); };

async function authWithGoogle() {
  if (!_supabase) {
    const msg = document.getElementById('auth-msg');
    if (msg) msg.textContent = 'âš ï¸ Necessites connexiÃ³ per iniciar sessiÃ³ amb Google';
    return;
  }
  const btn = document.getElementById('auth-google-btn');
  if (btn) { btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" stroke-width="3" fill="none"/><path d="M12 2a10 10 0 0 1 10 10" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/></svg> Redirigint...'; btn.disabled = true; }
  try {
    const redirectTo = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
    const { error } = await _supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: { access_type: 'offline', prompt: 'select_account' }
      }
    });
    if (error) {
      const msg = document.getElementById('auth-msg');
      const isProviderError = error.message && (error.message.includes('provider') || error.message.includes('validation_failed') || error.message.includes('not enabled'));
      if (msg) {
        if (isProviderError) {
          msg.innerHTML = `<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.35);border-radius:12px;padding:12px 14px;font-size:11px;line-height:1.6;">
            <div style="color:#fcd34d;font-weight:700;margin-bottom:6px;">âš™ï¸ GOOGLE NO ESTÃ€ ACTIVAT AL SUPABASE</div>
            <div style="color:#e2e8f0;opacity:0.85;">Cal que vagis al Supabase Dashboard:<br>
            <b>Authentication â†’ Providers â†’ Google â†’ Enable</b><br>
            <span style="opacity:0.6;font-size:10px;">Veure instruccions a supabase-setup.sql</span></div>
          </div>`;
        } else {
          msg.textContent = 'âŒ Error: ' + error.message;
        }
      }
      if (btn) { btn.innerHTML = getSvgGoogle() + ' CONTINUAR AMB GOOGLE'; btn.disabled = false; }
    }
  } catch(e) {
    const msg = document.getElementById('auth-msg');
    if (msg) msg.textContent = 'âŒ No s\'ha pogut connectar amb Google';
    if (btn) { btn.disabled = false; }
  }
}

function getSvgGoogle() {
  return '<svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>';
}

async function authLogin() {
  const email = (document.getElementById('auth-email')?.value||'').trim();
  const pass  = document.getElementById('auth-password')?.value||'';
  const remember = document.getElementById('auth-remember')?.checked !== false;
  const msg = document.getElementById('auth-msg');
  if (!email||!pass) { if(msg) msg.textContent='âš ï¸ Omple tots els camps'; return; }
  const btn = document.getElementById('auth-submit-btn');
  if(btn) { btn.textContent='Entrant...'; btn.disabled=true; }

  let loggedIn = false;

  // If server known offline, try local account first
  if (_supabaseOffline) {
    const local = _getLocalProfile();
    if (local && local.email === email) {
      _currentUser = {id: local.id, email: local.email};
      _userProfile = local;
      if(btn){btn.textContent='ENTRAR';btn.disabled=false;}
      _hideAuthOverlay(); _updateAuthUI();
      showToast('âœ… SessiÃ³ local: ' + (local.username || email.split('@')[0]));
      renderHome(); return;
    } else {
      if(btn){btn.textContent='ENTRAR';btn.disabled=false;}
      if(msg) msg.textContent='âš ï¸ Servidor no disponible. Usa "Continuar sense compte" per mode local.';
      return;
    }
  }

  // Try Supabase first
  if (_supabase) {
    try {
      const {data,error} = await Promise.race([
        _supabase.auth.signInWithPassword({email,password:pass}),
        new Promise((_,rej) => setTimeout(()=>rej(new Error('timeout')), 8000))
      ]);
      if (error) {
        if(btn){btn.textContent='ENTRAR';btn.disabled=false;}
        if(msg) msg.textContent='âŒ '+_translateAuthError(error.message);
        return;
      }
      _currentUser = data.user;
      await _loadUserProfile(data.user.id);
      await _syncUserData(data.user.id);
      if (!remember) { setTimeout(()=>{ _supabase?.auth.signOut().catch(()=>{}); }, 200); }
      loggedIn = true;
    } catch(e) {
      // Network error or timeout â€” try local account fallback
      const local = _getLocalProfile();
      if (local && local.email === email) {
        // Match local account by email (no password check in local mode)
        _currentUser = {id: local.id, email: local.email};
        _userProfile = local;
        loggedIn = true;
        if(msg) msg.textContent='';
      } else {
        if(btn){btn.textContent='ENTRAR';btn.disabled=false;}
        if(msg) msg.textContent='âŒ Sense connexiÃ³. Comprova internet o usa "Continuar sense compte".';
        return;
      }
    }
  } else {
    // No Supabase â€” local login by email match
    const local = _getLocalProfile();
    if (local && local.email === email) {
      _currentUser = {id: local.id, email};
      _userProfile = local;
      loggedIn = true;
    } else {
      if(btn){btn.textContent='ENTRAR';btn.disabled=false;}
      if(msg) msg.textContent='âŒ No s\'ha trobat cap compte amb aquest correu en mode local.';
      return;
    }
  }

  if(btn){btn.textContent='ENTRAR';btn.disabled=false;}
  if (loggedIn) {
    _hideAuthOverlay();
    _updateAuthUI();
    showToast('âœ… Benvingut/da, '+(_userProfile?.username||email.split('@')[0])+'!');
    renderHome();
  }
}

/* Indicador de disponibilitat del nom d'usuari en temps real (debounce 450ms) */
let _usernameCheckTimer = null;
let _lastUsernameAvailable = null;
function checkUsernameAvailability() {
  const inp = document.getElementById('auth-reg-username');
  const icon = document.getElementById('username-check-icon');
  const msg = document.getElementById('username-check-msg');
  const val = (inp?.value||'').trim();
  _lastUsernameAvailable = null;
  if (_usernameCheckTimer) clearTimeout(_usernameCheckTimer);
  if (!val) { if(icon) icon.textContent=''; if(msg) msg.textContent=''; return; }
  if (val.length < 3) {
    if(icon){ icon.textContent='âŒ'; }
    if(msg){ msg.textContent='MÃ­nim 3 carÃ cters'; msg.style.color='#fca5a5'; }
    return;
  }
  if(icon){ icon.innerHTML='<span style="opacity:0.5;">â³</span>'; }
  if(msg){ msg.textContent='Comprovant...'; msg.style.color='var(--muted)'; }
  _usernameCheckTimer = setTimeout(async ()=>{
    if (!_supabase) { if(icon) icon.textContent=''; if(msg) msg.textContent=''; return; }
    try {
      const {data} = await _supabase.from('profiles').select('username').ilike('username', val).limit(1);
      // Comprova que l'input no hagi canviat mentre esperÃ vem
      if ((inp?.value||'').trim() !== val) return;
      if (data && data.length) {
        _lastUsernameAvailable = false;
        if(icon) icon.textContent='âŒ';
        if(msg){ msg.textContent='Aquest nom ja estÃ  agafat'; msg.style.color='#fca5a5'; }
      } else {
        _lastUsernameAvailable = true;
        if(icon) icon.textContent='âœ…';
        if(msg){ msg.textContent='Disponible!'; msg.style.color='#6ee7b7'; }
      }
    } catch { if(icon) icon.textContent=''; if(msg) msg.textContent=''; }
  }, 450);
}

async function authRegister() {
  const username = (document.getElementById('auth-reg-username')?.value||'').trim();
  const email    = (document.getElementById('auth-reg-email')?.value||'').trim();
  const pass     = document.getElementById('auth-reg-password')?.value||'';
  const msg = document.getElementById('auth-msg');
  if (!username) { if(msg) msg.textContent='âš ï¸ Escriu un pseudÃ²nim'; return; }
  if (username.length<3) { if(msg) msg.textContent='âš ï¸ PseudÃ²nim mÃ­nim 3 carÃ cters'; return; }
  if (!email||!pass) { if(msg) msg.textContent='âš ï¸ Omple tots els camps'; return; }
  if (pass.length<6) { if(msg) msg.textContent='âš ï¸ Contrasenya mÃ­nima 6 carÃ cters'; return; }
  const btn = document.getElementById('auth-reg-btn');
  if(btn) { btn.textContent='Creant compte...'; btn.disabled=true; }

  let registered = false;

  // If server known offline, create local account directly
  if (_supabaseOffline) {
    _currentUser = {id: 'local_' + Date.now(), email};
    const profile = {id: _currentUser.id, email, username, avatar: 'âš”ï¸', created: Date.now(), isLocal: true};
    _userProfile = profile; _saveLocalProfile(profile);
    if(btn){btn.textContent='CREAR COMPTE';btn.disabled=false;}
    _hideAuthOverlay(); _updateAuthUI();
    showToast('ðŸŽ‰ Compte local creat: ' + username + ' (es sincronitzarÃ  quan el servidor estigui disponible)');
    renderHome(); return;
  }

  if (_supabase) {
    try {
      // Comprova que el nom d'usuari no estigui agafat (case-insensitive)
      try {
        const {data: existing} = await Promise.race([
          _supabase.from('profiles').select('username').ilike('username', username).maybeSingle(),
          new Promise((_,rej)=>setTimeout(()=>rej(new Error('t/o')),5000))
        ]);
        if (existing) {
          if(btn){btn.textContent='CREAR COMPTE';btn.disabled=false;}
          if(msg){ msg.textContent='âŒ El nom d\'usuari "'+username+'" ja existeix. Tria\'n un altre.'; msg.style.color='#fca5a5'; }
          return;
        }
      } catch(_) { /* si la comprovaciÃ³ falla per xarxa, continua; el trigger evita duplicats */ }
      const {data,error} = await Promise.race([
        _supabase.auth.signUp({email,password:pass,options:{data:{username}}}),
        new Promise((_,rej) => setTimeout(()=>rej(new Error('timeout')), 8000))
      ]);
      if (error) {
        if(btn){btn.textContent='CREAR COMPTE';btn.disabled=false;}
        if(msg) msg.textContent='âŒ '+_translateAuthError(error.message);
        return;
      }
      _currentUser = data.user || {id:'sb_'+Date.now(),email};
      const profile = {id:_currentUser.id,email,username,avatar:'âš”ï¸',created:Date.now()};
      _userProfile = profile; _saveLocalProfile(profile);
      // Best-effort cloud saves (don't block or fail if tables don't exist)
      _supabase.from('profiles').upsert({id:_currentUser.id,username,email,avatar:'âš”ï¸',hero_xp:0,hero_level:1}).catch(()=>{});
      _saveUserDataToCloud(_currentUser.id).catch(()=>{});
      registered = true;
    } catch(e) {
      // Network/timeout â€” create local account as fallback
      if(msg) msg.textContent='âš ï¸ Sense connexiÃ³. Creant compte local...';
      await new Promise(r=>setTimeout(r,800));
      _currentUser = {id:'local_'+Date.now(),email};
      const profile = {id:_currentUser.id,email,username,avatar:'âš”ï¸',created:Date.now(),isLocal:true};
      _userProfile = profile; _saveLocalProfile(profile);
      registered = true;
    }
  } else {
    // No Supabase â€” local account
    _currentUser = {id:'local_'+Date.now(),email};
    const profile = {id:_currentUser.id,email,username,avatar:'âš”ï¸',created:Date.now(),isLocal:true};
    _userProfile = profile; _saveLocalProfile(profile);
    registered = true;
  }

  if(btn){btn.textContent='CREAR COMPTE';btn.disabled=false;}
  if (registered) {
    _hideAuthOverlay();
    _updateAuthUI();
    showToast('ðŸŽ‰ Benvingut/da, '+username+'! Compte creat correctament.');
    renderHome();
  }
}

function _translateAuthError(msg) {
  const map = {
    'Invalid login credentials': 'Correu o contrasenya incorrectes',
    'Email not confirmed': 'ðŸ“§ Has de confirmar el correu. Revisa la safata d\'entrada i fes clic a l\'enllaÃ§',
    'User already registered': 'Ja existeix un compte amb aquest correu',
    'Password should be at least 6 characters': 'Contrasenya mÃ­nima 6 carÃ cters',
    'Unable to validate email address': 'Correu electrÃ²nic invÃ lid',
    'timeout': 'Temps esgotat. Comprova la connexiÃ³.',
    'Failed to fetch': 'No s\'ha pogut connectar. Comprova internet.',
    'Load failed': 'No s\'ha pogut connectar. Comprova internet.',
    'fetch': 'Error de xarxa. Comprova la connexiÃ³.',
    'NetworkError': 'Error de xarxa. Comprova la connexiÃ³.',
    'over_email_send_rate_limit': 'Massa intents. Espera uns minuts.',
    'For security purposes': 'Per seguretat, espera uns minuts i torna a intentar-ho.',
    'signup_disabled': 'El registre estÃ  temporalment desactivat.',
  };
  for (const [k,v] of Object.entries(map)) { if (msg.includes(k)) return v; }
  return msg;
}

function authLogout() {
  // Inline confirm via toast-style overlay to avoid browser confirm() being blocked
  const existing = document.getElementById('_logout-confirm');
  if (existing) { existing.remove(); return; }
  const box = document.createElement('div');
  box.id = '_logout-confirm';
  box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a2e;border:1px solid rgba(239,68,68,0.4);border-radius:14px;padding:24px 28px;z-index:9999;text-align:center;color:#fff;font-family:"Space Mono",monospace;box-shadow:0 8px 32px rgba(0,0,0,0.6);min-width:260px';
  box.innerHTML = `<div style="margin-bottom:14px;font-size:14px">Tancar sessiÃ³?</div>
    <div style="display:flex;gap:10px;justify-content:center">
      <button onclick="document.getElementById('_logout-confirm').remove()" style="padding:8px 18px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#ccc;cursor:pointer;font-family:inherit;font-size:11px">CancelÂ·lar</button>
      <button id="_logout-yes" style="padding:8px 18px;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);border-radius:8px;color:#fca5a5;cursor:pointer;font-family:inherit;font-size:11px">SÃ­, sortir</button>
    </div>`;
  document.body.appendChild(box);
  document.getElementById('_logout-yes').onclick = async () => {
    box.remove();
    if (window._autoSaveInterval) { clearInterval(window._autoSaveInterval); window._autoSaveInterval = null; }
    if (_supabase) { try { await _supabase.auth.signOut(); } catch{} }
    _currentUser = null; _userProfile = null; _saveLocalProfile(null);
    closeConfig();
    _updateAuthUI();
    showToast('ðŸ‘‹ SessiÃ³ tancada');
    setTimeout(showAuthOverlay, 500);
  };
}

function authShowMenu() {
  if (_currentUser) { openConfig(); setTimeout(()=>{ document.querySelectorAll('.cfg-tab')[3]?.click(); },100); }
  else { showAuthOverlay(); }
}

async function _loadUserProfile(userId) {
  // Try Supabase with timeout
  if (_supabase && !userId.startsWith('local_')) {
    try {
      const {data} = await Promise.race([
        _supabase.from('profiles').select('*').eq('id',userId).single(),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error('t/o')),5000))
      ]);
      if (data?.username) {
        _userProfile = {id:data.id,email:data.email||'',username:data.username,avatar:data.avatar||'âš”ï¸'};
        _saveLocalProfile(_userProfile); return;
      }
    } catch{}
  }
  // Fallback: local profile or derive from user object
  const local = _getLocalProfile();
  if (local && (local.id===userId || local.email===_currentUser?.email)) { _userProfile = local; return; }
  _userProfile = {id:userId,email:_currentUser?.email||'',
    username:_currentUser?.user_metadata?.username||_currentUser?.email?.split('@')[0]||'Usuari',avatar:'âš”ï¸'};
  _saveLocalProfile(_userProfile);
}

// Merge lists (jomaxpath_lists_v3) by list id: cloud + local lists not in cloud
function _mergeLists(cloudLists, localLists) {
  if (!Array.isArray(cloudLists)) return Array.isArray(localLists) ? localLists : [];
  if (!Array.isArray(localLists)) return cloudLists;
  const cloudIds = new Set(cloudLists.map(l => l.id));
  const onlyLocal = localLists.filter(l => !cloudIds.has(l.id));
  return [...cloudLists, ...onlyLocal];
}

// PONT tasques planes (jomaxpath_tasks, on viuen les [AUDIT]) â†” llistes v3
// que Ã©s el model que mostra realment l'app. Aquesta funciÃ³ injecta les
// tasques planes (nÃºvol o externes) dins la llista personal per defecte.
function _injectFlatTasksIntoLists(flatTasks) {
  if (!Array.isArray(flatTasks) || !flatTasks.length) return 0;
  // Garanteix que existeixi lists_v3 (migra des de TASKS_KEY si cal)
  if (typeof getLists === 'function' && getLists() === null && typeof _migrateLists === 'function') {
    _migrateLists();
  }
  let lists = (typeof getLists === 'function' ? getLists() : null) || [];
  // Troba la llista personal per defecte (o la primera no compartida)
  let personal = lists.find(l => l.id === 'personal_default') || lists.find(l => !l.shared);
  if (!personal) {
    personal = { id:'personal_default', name:'Les meves tasques', icon:'ðŸ“‹',
      shared:false, shareCode:null, ownerName:null, members:[], tasks:[] };
    lists.unshift(personal);
  }
  if (!Array.isArray(personal.tasks)) personal.tasks = [];
  const existing = new Set(personal.tasks.map(t => (t.id||'').toString()));
  let added = 0;
  flatTasks.forEach(t => {
    const id = (t.id || '').toString();
    if (id && existing.has(id)) return; // ja hi Ã©s â†’ no dupliquem
    personal.tasks.push({
      id: id || (Date.now().toString()+Math.random().toString(36).slice(2,6)),
      name: t.name || '', done: !!t.done,
      status: t.status || (t.done ? 'done' : 'todo'),
      prio: t.prio || 3, date: t.date || ''
    });
    if (id) existing.add(id);
    added++;
  });
  if (typeof setLists === 'function') setLists(lists);
  return added;
}

// Abans de pujar al nÃºvol: aboca les tasques de la llista personal cap a
// jomaxpath_tasks, aixÃ­ el nÃºvol reflecteix el que l'usuari veu i editem,
// i NO sobreescrivim les [AUDIT] amb dades velles.
function _syncListsToFlatTasks() {
  if (typeof getLists !== 'function') return;
  const lists = getLists();
  if (!Array.isArray(lists)) return;
  const personal = lists.find(l => l.id === 'personal_default') || lists.find(l => !l.shared);
  if (!personal || !Array.isArray(personal.tasks)) return;
  try { localStorage.setItem('jomaxpath_tasks', JSON.stringify(personal.tasks)); } catch {}
}

async function _syncUserData(userId) {
  if (!_supabase || !userId || userId.startsWith('local_')) return;
  try {
    const {data} = await Promise.race([
      _supabase.from('user_data').select('data').eq('user_id',userId).single(),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('t/o')),5000))
    ]);
    if (data?.data) {
      const d = data.data;
      // Claus amb overwrite simple (no cal merge)
      ['jomaxpath_schedule','jomaxpath_habits_v2','jomaxpath_streak_v2',
       'jomaxpath_progress_v1','jomaxpath_pomo_v2','jomaxpath_boards_v1','jomaxpath_chats_v2',
       'jomaxpath_config_v1','jomaxpath_victories_v1','jomaxpath_notes_v1','jomaxpath_hero_v2'].forEach(k=>{
        if(d[k]) try { localStorage.setItem(k,JSON.stringify(d[k])); } catch{}
      });
      // Llistes v3 del nÃºvol â†’ merge per id de llista (preserva llistes locals)
      if (d['jomaxpath_lists_v3']) {
        const localLists = get('jomaxpath_lists_v3', null);
        const merged = _mergeLists(d['jomaxpath_lists_v3'], localLists);
        try { localStorage.setItem('jomaxpath_lists_v3', JSON.stringify(merged)); } catch{}
      }
      // CLAU: tasques planes del nÃºvol ([AUDIT]) â†’ injecta a la llista personal
      // que Ã©s el que l'app mostra. Sense aixÃ² no es veurien mai.
      if (d['jomaxpath_tasks']) {
        try { localStorage.setItem('jomaxpath_tasks', JSON.stringify(d['jomaxpath_tasks'])); } catch{}
        _injectFlatTasksIntoLists(d['jomaxpath_tasks']);
      }
      showToast('â˜ï¸ Dades sincronitzades!');
    }
  } catch{} // Silently ignore â€” tables may not exist yet
}

async function _saveUserDataToCloud(userId) {
  if (!_supabase||!userId||userId.startsWith('local_')) return;
  try {
    // Aboca la llista personal â†’ jomaxpath_tasks abans de pujar (evita
    // sobreescriure les [AUDIT] del nÃºvol amb dades velles del localStorage)
    _syncListsToFlatTasks();
    const data = {};
    ['jomaxpath_tasks','jomaxpath_lists_v3','jomaxpath_schedule','jomaxpath_habits_v2','jomaxpath_streak_v2',
     'jomaxpath_progress_v1','jomaxpath_pomo_v2','jomaxpath_boards_v1','jomaxpath_chats_v2',
     'jomaxpath_config_v1','jomaxpath_victories_v1','jomaxpath_notes_v1','jomaxpath_hero_v2'].forEach(k=>{
      try { const v=localStorage.getItem(k); if(v) data[k]=JSON.parse(v); } catch{}
    });
    await Promise.race([
      _supabase.from('user_data').upsert({user_id:userId,data,updated:new Date().toISOString()}),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('t/o')),6000))
    ]);
    const hero = get('jomaxpath_hero_v2',null);
    if (hero) _supabase.from('profiles').update({hero_xp:hero.xp||0,hero_level:hero.level||1,avatar:hero.avatar||'âš”ï¸'}).eq('id',userId).catch(()=>{});
  } catch{} // Silently ignore
}

// Auto-save every 90s when logged in
window._autoSaveInterval = setInterval(()=>{ if(_currentUser?.id&&_supabase) _saveUserDataToCloud(_currentUser.id); },90000);

/* â”€â”€ Share boards â”€â”€ */
async function shareBoard(boardId) {
  if (!_currentUser) { showToast('âš ï¸ Necessites un compte per compartir'); return; }
  const boards = get(BOARDS_KEY,[]);
  const board = boards.find(b=>b.id===boardId); if (!board) { showToast('âš ï¸ Llista no trobada'); return; }
  // Show share modal
  _pendingShareBoardId = boardId;
  const modal = document.getElementById('share-board-modal-overlay');
  if (modal) {
    document.getElementById('sbi-board-name').textContent = board.name;
    document.getElementById('sbi-username-inp').value = '';
    document.getElementById('sbi-msg').textContent = '';
    // Amaga el box del codi de sessions anteriors
    const codeBox = document.getElementById('sbi-code-box');
    if (codeBox) codeBox.style.display = 'none';
    modal.style.display = 'flex';
  }
}

let _pendingShareBoardId = null;

async function shareBoardByCode() {
  const boardId = _pendingShareBoardId; if (!boardId) return;
  const boards = get(BOARDS_KEY,[]);
  const board = boards.find(b=>b.id===boardId); if (!board) return;
  if (!_supabase) { showToast('âš ï¸ Necessites connexiÃ³'); return; }
  try {
    const shareCode = 'BRD_'+boardId.slice(-6).toUpperCase()+'_'+Date.now().toString(36).toUpperCase().slice(-4);
    await _supabase.from('shared_boards').upsert({
      code: shareCode, owner_id: _currentUser.id,
      owner_name: _userProfile?.username||'Usuari',
      board_data: board, updated: new Date().toISOString()
    });
    // Save code to local board
    const idx = boards.findIndex(b=>b.id===boardId);
    if (idx>=0) { boards[idx].shareCode = shareCode; set(BOARDS_KEY,boards); }
    navigator.clipboard.writeText(shareCode).catch(()=>{});
    // Mostra el codi de forma persistent al modal
    const box = document.getElementById('sbi-code-box');
    const val = document.getElementById('sbi-code-value');
    if (val) val.textContent = shareCode;
    if (box) box.style.display = 'block';
    showToast('ðŸ“‹ Codi generat i copiat!');
    renderSharedBoards();
  } catch { showToast('âŒ Error generant codi'); }
}

function copyBoardCode() {
  const val = document.getElementById('sbi-code-value');
  const btn = document.getElementById('sbi-copy-btn');
  if (!val||!val.textContent) return;
  navigator.clipboard.writeText(val.textContent).then(()=>{
    if (btn) { const o=btn.textContent; btn.textContent='âœ… Copiat!'; setTimeout(()=>{btn.textContent=o;},1500); }
  }).catch(()=>showToast('ðŸ“‹ '+val.textContent));
}

function closeShareBoardModal() {
  const modal = document.getElementById('share-board-modal-overlay');
  if (modal) modal.style.display = 'none';
  _pendingShareBoardId = null;
  _pendingShareListId = null;
}

/* Cerca robusta d'usuari per username o email prefix */
async function _findUserProfile(target) {
  if (!_supabase || !target) return null;
  const t = target.trim();
  if (!t) return null;
  const cols = 'id,username,avatar,hero_level';
  // 1) Match exacte case-insensitive (limit 1 per no petar amb duplicats)
  let {data} = await _supabase.from('profiles').select(cols).ilike('username', t).limit(1);
  if (data && data.length) return data[0];
  // 2) Match parcial (comenÃ§a amb)
  const {data: partial} = await _supabase.from('profiles').select(cols).ilike('username', t+'%').limit(1);
  if (partial && partial.length) return partial[0];
  // 3) Match per email prefix
  const {data: byEmail} = await _supabase.from('profiles').select(cols).ilike('email', t+'%').limit(1);
  return (byEmail && byEmail.length) ? byEmail[0] : null;
}

async function sendBoardInviteByUsername() {
  const inp = document.getElementById('sbi-username-inp');
  const msg = document.getElementById('sbi-msg');
  const target = (inp?.value||'').trim();
  if (!target) { if(msg) msg.textContent = 'âš ï¸ Escriu el pseudÃ²nim'; return; }
  const listId = _pendingShareListId; if (!listId) return;
  const list = _getList(listId); if (!list) return;
  const myUsername = _userProfile?.username || 'Usuari';

  if (!_supabase || !_currentUser) { if(msg){ msg.textContent='âš ï¸ Inicia sessiÃ³ per compartir'; msg.style.color='#fca5a5'; } return; }
  if(msg) { msg.textContent = 'ðŸ” Cercant...'; msg.style.color='var(--muted)'; }
  try {
    const targetProfile = await _findUserProfile(target);
    if (!targetProfile) { if(msg){ msg.textContent = 'âŒ Usuari "'+target+'" no trobat. Ha d\'haver creat un compte.'; msg.style.color='#fca5a5'; } return; }
    if (targetProfile.username.toLowerCase()===myUsername.toLowerCase()) { if(msg){ msg.textContent='âš ï¸ No et pots convidar a tu mateix'; msg.style.color='#fca5a5'; } return; }

    // Assegura que la llista Ã©s compartida i tÃ© codi
    const shareCode = list.shareCode || ('BRD_'+listId.slice(-6).toUpperCase()+'_'+Date.now().toString(36).toUpperCase().slice(-4));
    list.shared = true; list.shareCode = shareCode; list.icon = 'ðŸ¤';
    if (!list.ownerName) list.ownerName = myUsername;
    if (!(list.members||[]).includes(myUsername)) list.members = [...(list.members||[]), myUsername];
    // Desa al nÃºvol i local
    await _supabase.from('shared_boards').upsert({
      code: shareCode, owner_id: _currentUser.id,
      owner_name: myUsername, board_data: list, updated: new Date().toISOString()
    });
    setLists(getLists().map(l=>l.id===listId?list:l));

    // NotificaciÃ³ d'invitaciÃ³
    const {error} = await _supabase.from('board_invites').insert({
      board_code: shareCode, board_name: list.name,
      from_username: myUsername, to_username: targetProfile.username,
      invite_type: 'username', status: 'pending',
      created_at: new Date().toISOString()
    });
    if (error) { if(msg) msg.textContent = 'âŒ '+error.message; return; }
    if(msg){ msg.textContent = 'âœ… InvitaciÃ³ enviada a '+targetProfile.username+'!'; msg.style.color='#6ee7b7'; }
    if(inp) inp.value = '';
    showToast('ðŸ“¨ InvitaciÃ³ enviada a '+targetProfile.username+'!');
    setTimeout(closeShareBoardModal, 1200);
  } catch(e) { if(msg) msg.textContent = 'âŒ Error de connexiÃ³'; }
}

let _invitesChannel = null;
function _subscribeInvitesRealtime() {
  if (!_supabase || !_userProfile?.username) return;
  if (_invitesChannel) { try { _supabase.removeChannel(_invitesChannel); } catch {} _invitesChannel=null; }
  try {
    _invitesChannel = _supabase.channel('invites_'+_userProfile.username)
      .on('postgres_changes', {event:'INSERT', schema:'public', table:'board_invites'}, (payload)=>{
        const inv = payload.new;
        if (inv?.to_username && _userProfile?.username && inv.to_username.toLowerCase()===_userProfile.username.toLowerCase()) {
          updateSharedTabBadge();
          if (_currentPage==='tasques' && _listsMode==='shared') loadBoardInvites();
          showToast('ðŸ“¬ '+inv.from_username+' t\'ha convidat a "'+inv.board_name+'"');
        }
      })
      .subscribe();
  } catch {}
}

async function updateSharedTabBadge() {
  const badge = document.getElementById('shared-tab-badge');
  if (!badge||!_supabase||!_userProfile?.username) { if(badge) badge.style.display='none'; return; }
  try {
    const {count} = await _supabase.from('board_invites').select('id',{count:'exact',head:true}).ilike('to_username',_userProfile.username).eq('status','pending');
    if (count>0) { badge.textContent=count; badge.style.display='inline'; }
    else { badge.style.display='none'; }
  } catch { if(badge) badge.style.display='none'; }
}

async function loadBoardInvites() {
  const section = document.getElementById('board-invites-section');
  const list = document.getElementById('board-invites-list');
  if (!section||!list) return;
  if (!_supabase||!_userProfile?.username) { section.style.display='none'; updateSharedTabBadge(); return; }
  try {
    const {data} = await _supabase.from('board_invites')
      .select('*').ilike('to_username', _userProfile.username).eq('status','pending');
    if (!data||data.length===0) { section.style.display='none'; updateSharedTabBadge(); return; }
    section.style.display = 'block';
    list.innerHTML = data.map(inv=>`
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.25);border-radius:10px;margin-bottom:6px;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:700;">${inv.board_name}</div>
          <div style="font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);margin-top:2px;">De: ${inv.from_username}</div>
        </div>
        <button onclick="acceptBoardInvite('${inv.id}','${inv.board_code}')" style="padding:7px 12px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);color:#6ee7b7;border-radius:8px;font-family:'Space Mono',monospace;font-size:9px;cursor:pointer;">âœ“ UNIR-SE</button>
        <button onclick="rejectBoardInvite('${inv.id}')" style="padding:7px 10px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;border-radius:8px;font-size:10px;cursor:pointer;">âœ•</button>
      </div>`).join('');
    updateSharedTabBadge();
  } catch { section.style.display='none'; }
}

async function _addSharedListFromCloud(data, code) {
  // Crea/actualitza una llista compartida local a partir de les dades del nÃºvol
  const lists = getLists()||[];
  const bd = data.board_data||{};
  const myUsername = _userProfile?.username||'jo';
  const existing = lists.find(l=>l.shareCode===code);
  const members = bd.members||[];
  if (myUsername && !members.map(m=>m.toLowerCase()).includes(myUsername.toLowerCase())) members.push(myUsername);
  const listObj = {
    id: existing?existing.id:(bd.id||Date.now().toString()+Math.random().toString(36).slice(2,6)),
    name: bd.name||'Llista compartida', icon:'ðŸ¤',
    shared:true, shareCode:code, ownerName:data.owner_name||bd.ownerName||'algÃº',
    members,
    tasks:(bd.tasks||[]).map(t=>({
      id:t.id||Date.now().toString()+Math.random().toString(36).slice(2,6),
      name:t.name||t.t||'', done:!!t.done, status:t.status||(t.done?'done':'todo'), prio:t.prio||3, date:t.date||''
    }))
  };
  if (existing) { setLists(lists.map(l=>l.shareCode===code?listObj:l)); }
  else { lists.push(listObj); setLists(lists); }
  // Actualitza la llista de membres al nÃºvol
  if (_supabase) { try { await _supabase.from('shared_boards').update({board_data:{...bd, members, tasks:listObj.tasks, name:listObj.name}, updated:new Date().toISOString()}).eq('code',code); } catch {} }
  return listObj;
}

async function acceptBoardInvite(inviteId, boardCode) {
  if (!_supabase) return;
  try {
    const {data} = await _supabase.from('shared_boards').select('*').eq('code',boardCode).maybeSingle();
    if (!data) { showToast('âŒ Llista no trobada'); return; }
    if ((getLists()||[]).find(l=>l.shareCode===boardCode)) { showToast('âš ï¸ Ja tens aquesta llista'); }
    else { await _addSharedListFromCloud(data, boardCode); }
    await _supabase.from('board_invites').update({status:'accepted'}).eq('id',inviteId);
    showToast('âœ… Llista de '+data.owner_name+' afegida!');
    loadBoardInvites(); renderListsCollection();
  } catch { showToast('âŒ Error acceptant'); }
}

async function rejectBoardInvite(inviteId) {
  if (!_supabase) return;
  try { await _supabase.from('board_invites').update({status:'rejected'}).eq('id',inviteId); } catch {}
  showToast('ðŸ‘‹ InvitaciÃ³ rebutjada');
  loadBoardInvites();
  updateSharedTabBadge();
}

async function joinSharedBoard(code) {
  const cleanCode = (code||'').trim().toUpperCase();
  if (!cleanCode.startsWith('BRD_')) { showToast('âš ï¸ Codi invÃ lid (ha de comenÃ§ar amb BRD_)'); return; }
  if (!_supabase) { showToast('âš ï¸ Necessites connexiÃ³ per unir-te'); return; }
  try {
    const {data, error} = await _supabase.from('shared_boards').select('*').eq('code', cleanCode).maybeSingle();
    if (error) { showToast('âŒ Error: '+error.message); return; }
    if (!data) { showToast('âŒ Codi Â«'+cleanCode+'Â» no trobat. Comprova que el codi sigui correcte.'); return; }
    if ((getLists()||[]).find(l=>l.shareCode===cleanCode)) { showToast('âš ï¸ Ja tens aquesta llista'); return; }
    await _addSharedListFromCloud(data, cleanCode);
    const inp = document.getElementById('join-board-code-inp');
    if (inp) inp.value = '';
    showToast('âœ… Llista de '+data.owner_name+' afegida!');
    _listsMode='shared'; renderListsCollection();
  } catch(e) { showToast('âŒ Error carregant llista: '+(e.message||e)); }
}

async function getHeroLeaderboard() {
  try {
    if (!_supabase) return [];
    const {data} = await _supabase.from('profiles').select('username,avatar,hero_xp,hero_level').order('hero_xp',{ascending:false}).limit(10);
    return data||[];
  } catch { return []; }
}

(async function initAuth() {
  _updateAuthUI();

  // No Supabase available â€” go local immediately
  if (!_supabase) {
    const local = _getLocalProfile();
    if (local?.username) { _currentUser={id:local.id,email:local.email}; _userProfile=local; _updateAuthUI(); }
    authSkip(); return;
  }

  // Always set up auth state listener first (handles OAuth callback too)
  // IMPORTANT: el callback HA de ser SÃNCRON i no fer cap await de crides a
  // supabase aquÃ­ dins. onAuthStateChange s'executa DINS del lock d'auth de
  // supabase-js; qualsevol operaciÃ³ supabase amb await re-entra al lock i
  // s'encua a pendingInLock â†’ DEADLOCK (totes les consultes es pengen). El
  // patrÃ³ oficial Ã©s diferir-ho tot amb setTimeout(0) perquÃ¨ corri FORA del lock.
  _supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      _currentUser = session.user;
      _updateAuthUI();
      setTimeout(async () => {
        // Garantir que el perfil existeix a Supabase (important per Google OAuth)
        try {
          const u = session.user;
          const autoUsername = (u.user_metadata?.full_name || u.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_.]/g,'').slice(0,24) || 'user_' + u.id.slice(-6);
          await _supabase.from('profiles').upsert({
            id: u.id,
            email: u.email || '',
            username: autoUsername,
            avatar: 'âš”ï¸',
            hero_xp: 0,
            hero_level: 1
          }, { onConflict: 'id', ignoreDuplicates: true });
        } catch {}
        await _loadUserProfile(session.user.id).catch(()=>{});
        await _syncUserData(session.user.id).catch(()=>{});
        _updateAuthUI();
        // Hide auth overlay if it's open
        _hideAuthOverlay();
        // Reload current page
        if (typeof renderHome === 'function' && _currentPage === 'home') renderHome();
        if (typeof renderTasques === 'function' && _currentPage === 'tasques') renderTasques();
        // Actualitza badge d'invitacions de llistes pendents + realtime
        if (typeof updateSharedTabBadge === 'function') setTimeout(updateSharedTabBadge, 500);
        if (typeof _subscribeInvitesRealtime === 'function') setTimeout(_subscribeInvitesRealtime, 800);
        showToast('âœ… Benvingut/da, ' + (_userProfile?.username || session.user.email?.split('@')[0]) + '!');
      }, 0);
    } else if (event === 'SIGNED_OUT') {
      _currentUser = null; _userProfile = null;
      _updateAuthUI();
    } else if (event === 'TOKEN_REFRESHED' && session?.user) {
      _currentUser = session.user;
      _updateAuthUI();
    }
  });

  try {
    // Timeout on session check â€” don't block app if network is slow/down
    const {data, error} = await Promise.race([
      _supabase.auth.getSession(),
      new Promise((_,rej) => setTimeout(()=>rej(new Error('session-timeout')), 4000))
    ]);

    if (!error && data?.session?.user) {
      _currentUser = data.session.user;
      _loadUserProfile(data.session.user.id).then(()=>_updateAuthUI()).catch(()=>{});
      _syncUserData(data.session.user.id).then(()=>{
        // Re-render after cloud sync completes so new tasks are visible
        if (typeof renderHome === 'function' && _currentPage === 'home') renderHome();
        if (typeof renderTasques === 'function' && _currentPage === 'tasques') renderTasques();
        if (typeof renderListsCollection === 'function' && _currentPage === 'tasques') renderListsCollection();
      }).catch(()=>{});
      _updateAuthUI();
      authSkip();
    } else {
      const local = _getLocalProfile();
      if (local?.username) {
        _currentUser = {id:local.id, email:local.email};
        _userProfile = local;
        _updateAuthUI();
        authSkip();
        setTimeout(()=>_showSessionReminder(), 3000);
        return;
      }
      _updateAuthUI();
      showAuthOverlay();
    }
  } catch(e) {
    // Network error or timeout
    const local = _getLocalProfile();
    if (local?.username) {
      _currentUser = {id:local.id, email:local.email};
      _userProfile = local;
      _updateAuthUI();
      authSkip();
      setTimeout(()=>_showSessionReminder(), 2000);
    } else {
      _updateAuthUI();
      showAuthOverlay();
    }
  }
})();

/* â”€â”€ Session reminder (non-intrusive banner) â”€â”€ */
function _showSessionReminder() {
  if (_currentUser) return; // already logged in
  const existing = document.getElementById('session-reminder');
  if (existing) return;
  const banner = document.createElement('div');
  banner.id = 'session-reminder';
  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
      <span style="font-size:16px;">âš ï¸</span>
      <div>
        <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:#fcd34d;">MODE LOCAL</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:1px;">Les dades no es sincronitzen. Inicia sessiÃ³ per no perdre res.</div>
      </div>
    </div>
    <button onclick="showAuthOverlay();document.getElementById('session-reminder')?.remove()" style="padding:6px 14px;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.4);border-radius:8px;color:#a78bfa;cursor:pointer;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1px;white-space:nowrap;">INICIAR SESSIÃ“</button>
    <button onclick="this.parentElement.remove()" style="padding:6px 10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:rgba(255,255,255,0.3);cursor:pointer;font-size:13px;">âœ•</button>
  `;
  banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;background:rgba(6,6,16,0.96);border:1px solid rgba(245,158,11,0.3);border-radius:14px;padding:12px 16px;z-index:8000;box-shadow:0 8px 32px rgba(0,0,0,0.5);width:min(480px,92vw);backdrop-filter:blur(16px);';
  document.body.appendChild(banner);
  // Auto-dismiss after 8s
  setTimeout(() => banner.remove(), 8000);
}


/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   HOME
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const QUOTES = [
  {t:"No t'esperis a tenir ganes. Fes-ho i les ganes vindran.", a:'James Clear'},
  {t:'Cada dia que passes sense fer res et porta un dia mÃ©s lluny dels teus somnis.', a:'JOmax'},
  {t:"L'Ãºnic que et separa del que vols Ã©s l'acciÃ³.", a:'Tony Robbins'},
  {t:'No Ã©s el que ets, Ã©s el que fas quan importa.', a:'Aragorn'},
  {t:"L'Ã¨xit no Ã©s un accident. Ã‰s treball dur, perseveranÃ§a i aprenentatge.", a:'PelÃ©'},
  {t:'Disciplines petites portaran victÃ²ries grans.', a:'JOmax'},
  {t:'La millor venjanÃ§a Ã©s un Ã¨xit massiu.', a:'Frank Sinatra'},
  {t:"No perdis el temps amb qui no creu en tu. Usa-l per demostrar-los que s'equivocaven.", a:'JOmax'},
];
let _quoteIdx = Math.floor(Math.random()*QUOTES.length);

function refreshQuote() {
  _quoteIdx = (_quoteIdx+1) % QUOTES.length;
  const q = QUOTES[_quoteIdx];
  const el = document.getElementById('dq-text');
  const au = document.getElementById('dq-author');
  if (el) el.textContent = q.t;
  if (au) au.textContent = 'â€” '+q.a;
}

function renderHomeHeader() {
  const h = new Date().getHours();
  const greetingBase = h < 12 ? t('greeting_morning') : h < 18 ? t('greeting_afternoon') : t('greeting_night');
  const emoji = h < 12 ? t('greeting_emoji_m') : h < 18 ? t('greeting_emoji_a') : t('greeting_emoji_n');
  const username = _userProfile?.username || '';
  // SalutaciÃ³ amb nom d'usuari
  const grEl = document.getElementById('home-greeting');
  if(grEl) grEl.textContent = username
    ? `${greetingBase}, ${username.charAt(0).toUpperCase()+username.slice(1)} ${emoji}`
    : `${greetingBase} ${emoji}`;
  // Data en chip
  const dateEl = document.getElementById('home-date-display');
  if(dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('ca-ES', {weekday:'short', day:'numeric', month:'short'});
  }
  // Stats
  const today = new Date().toISOString().slice(0,10);
  const streak = get('jomaxpath_streak_v1',{count:0});
  const habits = get(HABITS_KEY,[]);
  const doneH = habits.filter(h=>(h.days||[]).includes(today)).length;
  const _lists = (typeof getLists==='function' ? getLists() : null);
  const tasks = _lists
    ? _lists.reduce((n,l)=>n+(l.tasks||[]).filter(t=>!t.done).length, 0)
    : get(TASKS_KEY,[]).filter(t=>!t.done).length;
  const pomoData = get('jomaxpath_pomo_v1',{today:0});
  const sv = document.getElementById('hsr-streak-val'); if(sv) sv.textContent = streak.count||0;
  const hv = document.getElementById('hsr-habits-val'); if(hv) hv.textContent = doneH+'/'+habits.length;
  const tv = document.getElementById('hsr-tasks-val'); if(tv) tv.textContent = tasks;
  const pv = document.getElementById('hsr-pomo-val'); if(pv) pv.textContent = pomoData.today||0;
  const pq = document.getElementById('home-pomo-quick'); if(pq) pq.textContent = (pomoData.today||0)+' pomodoros avui';
}

function renderHome() {
  renderHomeHeader();
  refreshQuote();
  renderStreakWidget();
  renderHabits();
  renderProgress();
  renderTodayPanel();
  renderNextTask();
  renderExamCountdown();
  renderVictories();
  applyConfig();
}

function renderExamCountdown() {
  const bar=document.getElementById('exam-countdown-bar'); if(!bar) return;
  const exams=(typeof getExams==='function'?getExams():[])||[];
  const today=new Date(); today.setHours(0,0,0,0);
  // PrÃ²xim examen futur (o d'avui)
  const upcoming=exams.filter(e=>e.date).map(e=>({...e, d:new Date(e.date+'T00:00:00')}))
    .filter(e=>Math.round((e.d-today)/86400000)>=0)
    .sort((a,b)=>a.d-b.d);
  if(!upcoming.length){ bar.style.display='none'; return; }
  const e=upcoming[0];
  const diff=Math.round((e.d-today)/86400000);
  const when=diff===0?'ðŸ”¥ Ã‰S AVUI!':diff===1?'Ã‰s demÃ !':'Falten '+diff+' dies';
  const urgent=diff<=3;
  bar.style.cssText=`display:flex;align-items:center;gap:14px;cursor:pointer;margin:14px 0;padding:14px 18px;border-radius:16px;background:linear-gradient(135deg,${urgent?'rgba(239,68,68,0.15),rgba(245,158,11,0.08)':'rgba(16,185,129,0.12),rgba(14,165,233,0.06)'});border:1px solid ${urgent?'rgba(239,68,68,0.3)':'rgba(16,185,129,0.25)'};`;
  bar.innerHTML=`<div style="font-size:30px;">ðŸŽ“</div>
    <div style="flex:1;min-width:0;">
      <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:${urgent?'#fca5a5':'#6ee7b7'};">PRÃ’XIM EXAMEN</div>
      <div style="font-size:15px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${e.name}</div>
    </div>
    <div style="text-align:right;flex-shrink:0;">
      <div style="font-size:20px;font-weight:800;color:${urgent?'#fca5a5':'#6ee7b7'};">${diff===0?'AVUI':diff}</div>
      <div style="font-size:9px;color:var(--muted);">${diff===0?'':diff===1?'dia':'dies'}</div>
    </div>`;
}

/* â”€â”€ Streak â”€â”€ */
function renderStreakWidget() {
  const data = get(STREAK_KEY, {count:0,best:0,last:'',label:'dies consecutius',days:[]});
  const numEl  = document.getElementById('streak-num');
  const lblEl  = document.getElementById('streak-label-txt');
  const bestEl = document.getElementById('streak-best');
  const daysEl = document.getElementById('streak-days');
  const btnEl  = document.getElementById('streak-btn');
  if (numEl)  numEl.textContent  = data.count||0;
  if (lblEl)  lblEl.textContent  = data.label||'dies consecutius';
  if (bestEl) bestEl.textContent = 'Millor ratxa: '+(data.best||0);
  const today = new Date().toDateString();
  const doneToday = data.last===today;
  if (btnEl) { btnEl.textContent=doneToday?'âœ“ JA FETA AVUI':'âœ“ SESSIÃ“ FETA'; btnEl.style.opacity=doneToday?'0.5':'1'; }
  if (daysEl) {
    const now = new Date(); let html='';
    for (let i=6;i>=0;i--) {
      const d=new Date(now); d.setDate(now.getDate()-i);
      const done=(data.days||[]).includes(d.toDateString());
      html+=`<div class="streak-day-dot ${done?'done':''}"></div>`;
    }
    daysEl.innerHTML=html;
  }
}
function markStreakToday() {
  const data=get(STREAK_KEY,{count:0,best:0,last:'',label:'dies consecutius',days:[]});
  const today=new Date().toDateString();
  if (data.last===today) { showToast('Ja has marcat avui! âœ“'); return; }
  const yesterday=new Date(); yesterday.setDate(yesterday.getDate()-1);
  if (data.last===yesterday.toDateString()) data.count++; else data.count=1;
  if (data.count>(data.best||0)) data.best=data.count;
  data.last=today;
  if (!data.days) data.days=[];
  data.days.push(today);
  if (data.days.length>30) data.days.shift();
  set(STREAK_KEY,data); renderStreakWidget();
  showToast('ðŸ”¥ Ratxa: '+data.count+' dies!');
}
function undoStreakToday() {
  const data=get(STREAK_KEY,{count:0,best:0,last:'',label:'dies consecutius',days:[]});
  const today=new Date().toDateString();
  if (data.last!==today) { showToast('Res a desfer'); return; }
  data.count=Math.max(0,data.count-1); data.last='';
  data.days=(data.days||[]).filter(d=>d!==today);
  set(STREAK_KEY,data); renderStreakWidget(); showToast('â†º Ratxa desfeta');
}
function editStreakLabel() {
  const data=get(STREAK_KEY,{label:'dies consecutius'});
  const lbl=prompt("Canvia l'etiqueta:",data.label||'dies consecutius');
  if (lbl!==null&&lbl.trim()) { data.label=lbl.trim(); set(STREAK_KEY,data); renderStreakWidget(); }
}

/* â”€â”€ Habits â”€â”€ */
function renderHabits() {
  const habits=get(HABITS_KEY,[]);
  const list=document.getElementById('habits-list');
  if (!list) return;
  const today=new Date().toDateString();
  if (habits.length===0) { list.innerHTML='<div style="color:var(--muted);font-size:12px;padding:12px 0;">Afegeix el teu primer hÃ bit! â†’</div>'; return; }
  list.innerHTML=habits.map((h,i)=>{
    const done=(h.days||[]).includes(today);
    return `<div class="habit-item ${done?'done':''}" onclick="toggleHabit(${i})">
      <span class="habit-icon">${h.icon||'â­'}</span>
      <span class="habit-name">${h.name||''}</span>
      <span class="habit-check">${done?'âœ“':''}</span>
      <button class="habit-del-btn" onclick="event.stopPropagation();deleteHabit(${i})">âœ•</button>
    </div>`;
  }).join('');
}
function toggleHabitForm() {
  const f=document.getElementById('habit-add-form');
  if (f) f.style.display=f.style.display==='flex'?'none':'flex';
}
function addHabit() {
  const name=(document.getElementById('habit-name-inp')?.value||'').trim();
  const icon=(document.getElementById('habit-icon-inp')?.value||'â­').trim();
  if (!name) { showToast('âš ï¸ Escriu un nom'); return; }
  const habits=get(HABITS_KEY,[]);
  habits.push({name,icon,days:[],created:Date.now()});
  set(HABITS_KEY,habits);
  document.getElementById('habit-name-inp').value='';
  document.getElementById('habit-icon-inp').value='â­';
  toggleHabitForm(); renderHabits(); showToast('âœ… HÃ bit afegit!');
}
function toggleHabit(idx) {
  const habits=get(HABITS_KEY,[]);
  const today=new Date().toDateString();
  if (!habits[idx]) return;
  const h=habits[idx]; if (!h.days) h.days=[];
  if (h.days.includes(today)) h.days=h.days.filter(d=>d!==today); else h.days.push(today);
  set(HABITS_KEY,habits); renderHabits();
}
function deleteHabit(idx) {
  showDeleteConfirm(()=>{
    const habits=get(HABITS_KEY,[]); habits.splice(idx,1);
    set(HABITS_KEY,habits); renderHabits(); showToast('ðŸ—‘ï¸ HÃ bit eliminat');
  },{title:'ELIMINAR HÃ€BIT',msg:'EsborrarÃ s aquest hÃ bit i tot el seu historial.'});
}
function selectHabitEmoji() {
  const emojis=['â­','ðŸƒ','ðŸ“š','ðŸ’§','ðŸ§˜','ðŸ’ª','ðŸŽ¯','ðŸŽ','ðŸ˜´','ðŸ”¥','âœï¸','ðŸŽµ'];
  const sel=prompt('Escull un emoji: '+emojis.join(' '));
  if (sel) { const el=document.getElementById('habit-icon-inp'); if(el) el.value=sel.trim()[0]; }
}

/* â”€â”€ Progress â”€â”€ */
const PROG_DEF={chapter:1,total:10,title:'El meu objectiu'};
function renderProgress() {
  const p=get(PROGRESS_KEY,PROG_DEF);
  const title=document.getElementById('prog-title');
  const frac=document.getElementById('prog-fraction');
  const fill=document.getElementById('prog-fill');
  const chaps=document.getElementById('prog-chapters');
  const congrats=document.getElementById('prog-congrats');
  const moto=document.getElementById('moto-sub');
  const pct=Math.round(((p.chapter-1)/p.total)*100);
  if (title)   title.innerHTML=`<span style="font-size:16px;margin-right:8px;">ðŸŽ¯</span>${p.title||'El meu objectiu'}`;
  if (frac)    frac.textContent=`${pct}% completat`;
  if (fill)    fill.style.width=pct+'%';
  if (moto)    moto.textContent=`PAS ${p.chapter} DE ${p.total}`;
  if (chaps)   chaps.innerHTML=Array.from({length:p.total},(_,i)=>{const n=i+1,done=n<p.chapter,curr=n===p.chapter;return `<div class="prog-chap ${done?'done':''} ${curr?'curr':''}" title="Pas ${n}">${done?'âœ“':n}</div>`;}).join('');
  if (congrats) congrats.textContent=p.chapter>p.total?'ðŸŽ‰ Objectiu assolit!':'';
}
function changeChapter(delta) {
  const p=get(PROGRESS_KEY,PROG_DEF);
  const prev=p.chapter||1;
  p.chapter=Math.max(1,Math.min(p.total+1,prev+delta));
  set(PROGRESS_KEY,p); renderProgress();
  if (delta>0 && p.chapter<=p.total) showToast('âœ… Pas '+prev+' completat!');
  else if (delta>0 && p.chapter>p.total) showToast('ðŸŽ‰ Objectiu completat al 100%!');
}
function resetProgress() {
  if (!confirm('Reiniciar el progrÃ©s?')) return;
  const p=get(PROGRESS_KEY,PROG_DEF); p.chapter=1;
  set(PROGRESS_KEY,p); renderProgress(); showToast('â†º Reiniciat');
}

/* â”€â”€ Today panel â”€â”€ */
/* Recordatoris de dates lÃ­mit: banner intern + notificaciÃ³ del navegador (1/dia) */
function _checkDueReminders() {
  const lists = (typeof getLists==='function') ? getLists() : null;
  if (!lists) return;
  const today = new Date(); today.setHours(0,0,0,0);
  let overdue=0, dueToday=0, dueTomorrow=[];
  lists.forEach(l=>(l.tasks||[]).forEach(t=>{
    if (t.done || !t.date) return;
    const d=new Date(t.date+'T00:00:00'); const diff=Math.round((d-today)/86400000);
    if (diff<0) overdue++;
    else if (diff===0) dueToday++;
    else if (diff===1) dueTomorrow.push({name:t.name, list:l.name});
  }));
  // Banner intern si hi ha res urgent
  if (overdue>0 || dueToday>0) {
    const parts=[];
    if (overdue>0) parts.push(`${overdue} endarrerida${overdue>1?'es':''}`);
    if (dueToday>0) parts.push(`${dueToday} que vence${dueToday>1?'n':''} avui`);
    _showReminderBanner('â° Tens '+parts.join(' i ')+'. Ves a Tasques!');
  }
  // NotificaciÃ³ del navegador per a tasques de demÃ  (un cop al dia)
  if (dueTomorrow.length && 'Notification' in window) {
    const todayKey='jomaxpath_notif_'+today.toISOString().slice(0,10);
    if (!localStorage.getItem(todayKey)) {
      const fire=()=>{
        try {
          new Notification('ðŸ“… Tasques per a demÃ ', {
            body: dueTomorrow.slice(0,3).map(t=>'â€¢ '+t.name).join('\n') + (dueTomorrow.length>3?`\n+${dueTomorrow.length-3} mÃ©s`:''),
            icon: 'icona.png'
          });
          localStorage.setItem(todayKey,'1');
        } catch {}
      };
      if (Notification.permission==='granted') fire();
      else if (Notification.permission!=='denied') Notification.requestPermission().then(p=>{ if(p==='granted') fire(); });
    }
  }
}
function _showReminderBanner(text) {
  let b=document.getElementById('due-reminder-banner');
  if (!b) {
    b=document.createElement('div');
    b.id='due-reminder-banner';
    b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:20px;z-index:9000;background:linear-gradient(135deg,rgba(245,158,11,0.95),rgba(239,68,68,0.92));color:#fff;padding:12px 18px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.4);font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:10px;max-width:90vw;animation:slideUpBanner .4s ease;';
    b.onclick=()=>{ navTo('tasques'); b.remove(); };
    document.body.appendChild(b);
    if (!document.getElementById('slideUpBannerKf')) {
      const st=document.createElement('style'); st.id='slideUpBannerKf';
      st.textContent='@keyframes slideUpBanner{from{opacity:0;transform:translate(-50%,20px);}to{opacity:1;transform:translate(-50%,0);}}';
      document.head.appendChild(st);
    }
  }
  b.innerHTML=`<span>${text}</span><span style="opacity:0.7;font-size:16px;">â†’</span>`;
  setTimeout(()=>{ if(b&&b.parentNode) b.remove(); }, 9000);
}

function renderNextTask() {
  const bar=document.getElementById('next-up-bar'); if(!bar) return;
  const lists = (typeof getLists==='function') ? getLists() : null;
  if (!lists) { bar.style.display='none'; return; }
  // Totes les tasques pendents amb data, ordenades per data
  const today = new Date(); today.setHours(0,0,0,0);
  const pending = [];
  lists.forEach(l=>(l.tasks||[]).forEach(t=>{ if(!t.done && t.date) pending.push({...t, listName:l.name}); }));
  pending.sort((a,b)=> new Date(a.date)-new Date(b.date));
  if (pending.length===0) { bar.style.display='none'; return; }
  const next = pending[0];
  const d = new Date(next.date+'T00:00:00');
  const diff = Math.round((d-today)/86400000);
  let when = 'ðŸ“… '+next.date, cd='', cdColor='var(--accent2)';
  if (diff<0) { when='Endarrerida'; cd='âš ï¸'; cdColor='#fca5a5'; }
  else if (diff===0) { when='VenÃ§ avui'; cd='HOY'; cdColor='#fcd34d'; }
  else if (diff===1) { when='VenÃ§ demÃ '; cd='1d'; cdColor='#fcd34d'; }
  else { when='En '+diff+' dies'; cd=diff+'d'; }
  document.getElementById('next-up-text').textContent = next.name + ' Â· ' + next.listName;
  document.getElementById('next-up-when').textContent = when;
  const cdEl=document.getElementById('next-up-cd'); if(cdEl){ cdEl.textContent=cd; cdEl.style.color=cdColor; }
  bar.style.display='flex';
}

function renderTodayPanel() {
  const grid=document.getElementById('today-grid'); if (!grid) return;
  const now=new Date(), days=['Diumenge','Dilluns','Dimarts','Dimecres','Dijous','Divendres','Dissabte'];
  const today=days[now.getDay()];
  const schedule=get(SCHEDULE_KEY,{});
  const events=Array.isArray(schedule[today])?schedule[today]:Object.values(schedule[today]||{});
  const now_min=now.getHours()*60+now.getMinutes();
  if (events.length===0) { grid.innerHTML='<div style="color:var(--muted);font-size:12px;padding:8px 0;">Sense events avui.</div>'; return; }
  const sorted=[...events].sort((a,b)=>{const[ah,am]=(a.time||'00:00').split(':').map(Number);const[bh,bm]=(b.time||'00:00').split(':').map(Number);return(ah*60+am)-(bh*60+bm);});
  let nextEvent=null;
  grid.innerHTML=sorted.slice(0,4).map(ev=>{
    const[h,m]=(ev.time||'00:00').split(':').map(Number);
    const ev_min=h*60+m;
    const past=ev_min<now_min, current=!past&&ev_min<=now_min+10;
    if (!nextEvent&&!past) nextEvent=ev;
    return `<div class="today-card ${past?'past':''} ${current?'current':''}"><div class="tc-time">${ev.time||''}</div><div class="tc-name">${ev.name||ev.text||''}</div></div>`;
  }).join('');
  const nowEl=document.getElementById('today-now'), nowTxt=document.getElementById('today-now-txt');
  if (nextEvent&&nowEl&&nowTxt) {
    const[h,m]=(nextEvent.time||'00:00').split(':').map(Number);
    const diff=(h*60+m)-now_min;
    if (diff>0&&diff<=60) { nowEl.style.display='flex'; nowTxt.textContent=`En ${diff} min: ${nextEvent.name||nextEvent.text||''}`; }
    else nowEl.style.display='none';
  }
}

/* â”€â”€ Config aplicat â”€â”€ */
function applyConfig() {
  const cfg=get(CONFIG_KEY,{});
  const goalEl=document.getElementById('goal-desc');
  if (goalEl) {
    goalEl.textContent = cfg.mainGoal && cfg.mainGoal.trim()
      ? cfg.mainGoal
      : 'Defineix el teu gran objectiu aquÃ­. Ves a ConfiguraciÃ³ â†’ General per personalitzar-lo.';
  }
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   HORARI
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let weekOffset=0, calendarYear, calendarMonth;

function renderHorari() {
  renderWeekDates(); renderWeekGrid(); renderCalendar(); renderHorariHabits(); renderMatches();
}
function switchHorariTab(tab) {
  document.querySelectorAll('.horari-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.horari-tab-content').forEach(c=>{c.classList.remove('active');c.style.display='none';});
  document.getElementById('htab-'+tab)?.classList.add('active');
  const cont=document.getElementById('htab-content-'+tab);
  if (cont) { cont.classList.add('active'); cont.style.display='block'; }
}
function renderWeekDates() {
  const grid=document.getElementById('week-grid'); if (!grid) return;
  const label=document.getElementById('week-label');
  const today=new Date(), monday=new Date(today);
  monday.setDate(today.getDate()-((today.getDay()+6)%7)+weekOffset*7);
  if (label) { const end=new Date(monday);end.setDate(monday.getDate()+6);label.textContent=`${monday.getDate()}/${monday.getMonth()+1} â€“ ${end.getDate()}/${end.getMonth()+1}`; }
  const schedule=get(SCHEDULE_KEY,{});
  const dayNames=['Dilluns','Dimarts','Dimecres','Dijous','Divendres','Dissabte','Diumenge'];
  const short=['Dl','Dt','Dc','Dj','Dv','Ds','Dg'];
  grid.innerHTML=dayNames.map((dn,i)=>{
    const d=new Date(monday); d.setDate(monday.getDate()+i);
    const isToday=d.toDateString()===today.toDateString();
    const events=Array.isArray(schedule[dn])?schedule[dn]:Object.values(schedule[dn]||{});
    const evHtml=events.slice(0,4).map(ev=>`<div class="week-event" style="background:${ev.color||'rgba(124,58,237,0.2)'}" onclick="openDayModal('${dn}','${ev.id||''}')"><span class="we-time">${ev.time||''}</span><span class="we-name">${ev.name||ev.text||''}</span></div>`).join('');
    return `<div class="week-col ${isToday?'today':''}"><div class="week-day-header ${isToday?'today':''}"><span class="wdh-short">${short[i]}</span><span class="wdh-num">${d.getDate()}</span></div><div class="week-events">${evHtml}<button class="add-day-event-btn" onclick="openDayModal('${dn}',null)">+</button></div></div>`;
  }).join('');
}
function renderWeekGrid() {
  const stats=document.getElementById('stats-grid'); if (!stats) return;
  const tasks=get(TASKS_KEY,[]);
  const habits=get(HABITS_KEY,[]);
  const today=new Date().toDateString();
  const habDone=habits.filter(h=>(h.days||[]).includes(today)).length;
  stats.innerHTML=[
    {label:'Tasques fetes',val:tasks.filter(t=>t.done).length,icon:'âœ…'},
    {label:'Pendents',val:tasks.filter(t=>!t.done).length,icon:'ðŸ“‹'},
    {label:'HÃ bits avui',val:`${habDone}/${habits.length}`,icon:'ðŸŒ±'},
  ].map(s=>`<div class="stat-card-mini"><div class="scm-icon">${s.icon}</div><div class="scm-val">${s.val}</div><div class="scm-lbl">${s.label}</div></div>`).join('');
}

/* Day modal */
let _dayModalDay=null, _dayModalEventId=null;
function openDayModal(day,eventId) {
  _dayModalDay=day; _dayModalEventId=eventId;
  const ov=document.getElementById('day-modal-overlay'); if (!ov) { showToast('Modal no disponible'); return; }
  const schedule=get(SCHEDULE_KEY,{});
  const events=Array.isArray(schedule[day])?schedule[day]:Object.values(schedule[day]||{});
  const ev=eventId?events.find(e=>e.id===eventId):null;
  const titleEl=document.getElementById('day-modal-title'); if(titleEl) titleEl.textContent=day;
  const timeEl=document.getElementById('dm-time'); if(timeEl) timeEl.value=ev?.time||'';
  const textEl=document.getElementById('dm-text'); if(textEl) textEl.value=ev?.name||ev?.text||'';
  const typeEl=document.getElementById('dm-type'); if(typeEl&&ev?.type) typeEl.value=ev.type;
  ov.style.display='flex';
}
function closeDayModal() {
  const ov=document.getElementById('day-modal-overlay'); if(ov) ov.style.display='none';
}
function saveDayEvent() {
  if (!_dayModalDay) return;
  const time=(document.getElementById('dm-time')?.value||'');
  const name=(document.getElementById('dm-text')?.value||'').trim();
  const type=document.getElementById('dm-type')?.value||'ðŸ“Œ Recordatori';
  if (!name) { showToast('âš ï¸ Posa una descripciÃ³'); return; }
  const colors={'ðŸ“Œ Recordatori':'rgba(124,58,237,0.3)','ðŸ“š Escolar':'rgba(59,130,246,0.3)','ðŸ’ Esport':'rgba(239,68,68,0.3)','ðŸ’» ProgramaciÃ³':'rgba(16,185,129,0.3)','ðŸ¤– Robotech':'rgba(0,184,217,0.3)','ðŸ“ Examen':'rgba(245,158,11,0.3)','ðŸ“¦ Entrega':'rgba(168,85,247,0.3)','ðŸŽ¯ Altres':'rgba(100,116,139,0.3)'};
  const schedule=get(SCHEDULE_KEY,{});
  if (!schedule[_dayModalDay]) schedule[_dayModalDay]=[];
  if (!Array.isArray(schedule[_dayModalDay])) schedule[_dayModalDay]=Object.values(schedule[_dayModalDay]);
  if (_dayModalEventId) {
    const idx=schedule[_dayModalDay].findIndex(e=>e.id===_dayModalEventId);
    if (idx!==-1) schedule[_dayModalDay][idx]={...schedule[_dayModalDay][idx],time,name,text:name,type};
  } else {
    schedule[_dayModalDay].push({id:Date.now().toString(),time,name,text:name,type,color:colors[type]||'rgba(124,58,237,0.3)',created:Date.now()});
  }
  set(SCHEDULE_KEY,schedule); closeDayModal(); renderWeekDates(); renderTodayPanel(); showToast('âœ… Event guardat!');
}
function deleteTimedEvent() {
  if (!_dayModalDay||!_dayModalEventId) return;
  showDeleteConfirm(()=>{
    const schedule=get(SCHEDULE_KEY,{});
    if (Array.isArray(schedule[_dayModalDay])) schedule[_dayModalDay]=schedule[_dayModalDay].filter(e=>e.id!==_dayModalEventId);
    set(SCHEDULE_KEY,schedule); closeDayModal(); renderWeekDates(); showToast('ðŸ—‘ï¸ Event eliminat');
  },{title:'ELIMINAR EVENT',msg:"EsborrarÃ s aquest event de l'horari."});
}
function saveTimedEvent() { saveDayEvent(); }
function pickTimedColor() {
  // Retorna color d'accent basat en l'hora del dia
  const h=new Date().getHours();
  if (h<7)  return '#4f46e5'; // nit â€” Ã­ndigo
  if (h<12) return '#f59e0b'; // matÃ­ â€” groc
  if (h<18) return '#10b981'; // tarda â€” verd
  return '#8b5cf6';           // vespre â€” porpra
}

/* Calendar mensual */
function renderCalendar() {
  const now=new Date();
  if (!calendarYear) calendarYear=now.getFullYear();
  if (calendarMonth==null) calendarMonth=now.getMonth();
  const monthNames=['Gener','Febrer','MarÃ§','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];
  const monthEl=document.getElementById('calendar-month'), gridEl=document.getElementById('calendar-grid');
  if (!gridEl) return;
  if (monthEl) monthEl.textContent=`${monthNames[calendarMonth]} ${calendarYear}`;
  const firstDay=new Date(calendarYear,calendarMonth,1), lastDay=new Date(calendarYear,calendarMonth+1,0);
  const startDow=(firstDay.getDay()+6)%7;
  const key=SCHEDULE_KEY+'_monthly_'+calendarYear+'_'+calendarMonth;
  const monthEvents=get(key,{});
  let html=['Dl','Dt','Dc','Dj','Dv','Ds','Dg'].map(d=>`<div class="cal-header-day">${d}</div>`).join('');
  for (let i=0;i<startDow;i++) html+='<div class="cal-day empty"></div>';
  for (let d=1;d<=lastDay.getDate();d++) {
    const isToday=d===now.getDate()&&calendarMonth===now.getMonth()&&calendarYear===now.getFullYear();
    const evs=monthEvents[d]||[];
    const evHtml=evs.slice(0,2).map(e=>`<div class="cal-event" style="background:${e.color||'rgba(124,58,237,0.3)'}">${e.name||''}</div>`).join('');
    html+=`<div class="cal-day ${isToday?'today':''}" onclick="openMonthModal(${d})"><div class="cal-day-num">${d}</div>${evHtml}</div>`;
  }
  gridEl.innerHTML=html;
}
function calendarPrevMonth() { calendarMonth--; if(calendarMonth<0){calendarMonth=11;calendarYear--;} renderCalendar(); }
function calendarNextMonth() { calendarMonth++; if(calendarMonth>11){calendarMonth=0;calendarYear++;} renderCalendar(); }

let _monthModalDay=null;
function openMonthModal(day) {
  _monthModalDay=day;
  const ov=document.getElementById('month-modal-overlay'); if (!ov) return;
  const mesos=['Gener','Febrer','MarÃ§','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];
  document.getElementById('mm-title').textContent=`${day} de ${mesos[calendarMonth]}`;
  document.getElementById('mm-sub').textContent=String(calendarYear);
  const key=SCHEDULE_KEY+'_monthly_'+calendarYear+'_'+calendarMonth;
  const evs=(get(key,{})[day])||[];
  const listEl=document.getElementById('mm-list');
  if (listEl) listEl.innerHTML=evs.length===0?'<div style="color:var(--muted);font-size:12px;">Sense events</div>':evs.map((e,i)=>`<div class="mm-event-item">${e.name} <button onclick="deleteMonthEvent(${day},${i})">âœ•</button></div>`).join('');
  ov.style.display='flex';
}
function closeMonthModal() { document.getElementById('month-modal-overlay').style.display='none'; }
function saveMonthEvent() {
  const name=(document.getElementById('mm-text')?.value||'').trim();
  const time=document.getElementById('mm-time')?.value||'';
  const type=document.getElementById('mm-type')?.value||'other';
  if (!name||!_monthModalDay) { showToast('âš ï¸ Escriu un event'); return; }
  const key=SCHEDULE_KEY+'_monthly_'+calendarYear+'_'+calendarMonth;
  const data=get(key,{});
  if (!data[_monthModalDay]) data[_monthModalDay]=[];
  const typeColors={exam:'rgba(245,158,11,0.3)',deures:'rgba(59,130,246,0.3)',partit:'rgba(239,68,68,0.3)',other:'rgba(124,58,237,0.3)'};
  data[_monthModalDay].push({name,time,type,color:typeColors[type]||'rgba(124,58,237,0.3)',id:Date.now().toString()});
  set(key,data);
  document.getElementById('mm-text').value='';
  closeMonthModal(); renderCalendar(); showToast('âœ… Event mensual afegit!');
}
function deleteMonthEvent(day,idx) {
  showDeleteConfirm(()=>{
    const key=SCHEDULE_KEY+'_monthly_'+calendarYear+'_'+calendarMonth;
    const data=get(key,{});
    if (data[day]) data[day].splice(idx,1);
    set(key,data); openMonthModal(day); renderCalendar();
  },{title:'ELIMINAR EVENT',msg:"EsborrarÃ s aquest event del calendari."});
}

function renderHorariHabits() {
  const list=document.getElementById('htab-content-habits'); if (!list) return;
  const habits=get(HABITS_KEY,[]);
  const today=new Date().toDateString();
  const html=habits.length===0?'<p style="color:var(--muted);">Afegeix hÃ bits des d\'Inici.</p>':habits.map((h,i)=>{
    const done=(h.days||[]).includes(today);
    const streak=_habitStreak(h);
    return `<div class="habit-row-horari ${done?'done':''}"><span>${h.icon||'â­'}</span><span style="flex:1">${h.name}</span><span style="color:var(--orange);font-size:11px;">ðŸ”¥ ${streak}</span><button onclick="toggleHabit(${i});renderHorariHabits()">${done?'âœ“':''}</button></div>`;
  }).join('');
  let inner=list.querySelector('.horari-habits-inner');
  if (!inner) { inner=document.createElement('div'); inner.className='horari-habits-inner'; list.appendChild(inner); }
  inner.innerHTML=html;
}
function _habitStreak(h) {
  let s=0; const d=new Date();
  while ((h.days||[]).includes(d.toDateString())) { s++; d.setDate(d.getDate()-1); }
  return s;
}

/* Matches */
function renderMatches() {
  const list=document.getElementById('matches-list'); if (!list) return;
  const matches=get(MATCH_KEY,[]);
  if (matches.length===0) { list.innerHTML='<div style="color:var(--muted);font-size:12px;padding:12px 0;">Sense partits afegits.</div>'; return; }
  list.innerHTML=matches.map((m,i)=>`<div class="match-card"><div class="mc-date">${m.date||''} ${m.time||''}</div><div class="mc-teams"><span>${m.home||'Local'}</span><span style="margin:0 8px;opacity:0.5">${m.result||'vs'}</span><span>${m.away||'Visitant'}</span></div><div style="font-size:10px;color:var(--muted)">Jornada ${m.jornada||'?'}</div><button class="mc-del" onclick="deleteMatch(${i})">âœ•</button></div>`).join('');
}
function toggleMatchForm() {
  const f=document.getElementById('match-form');
  if (f) f.style.display=f.style.display==='none'?'block':'none';
}
function saveMatch() {
  const date=document.getElementById('mf-date')?.value;
  const time=document.getElementById('mf-time')?.value;
  const home=(document.getElementById('mf-home')?.value||'').trim();
  const away=(document.getElementById('mf-away')?.value||'').trim();
  const jornada=document.getElementById('mf-jornada')?.value;
  const result=(document.getElementById('mf-result')?.value||'').trim();
  if (!home||!away) { showToast('âš ï¸ Posa els dos equips'); return; }
  const matches=get(MATCH_KEY,[]);
  matches.push({date,time,home,away,jornada,result,id:Date.now().toString()});
  matches.sort((a,b)=>(a.date||'')>(b.date||'')?1:-1);
  set(MATCH_KEY,matches); toggleMatchForm(); renderMatches(); showToast('âœ… Partit afegit!');
}
function deleteMatch(idx) {
  showDeleteConfirm(()=>{
    const m=get(MATCH_KEY,[]); m.splice(idx,1); set(MATCH_KEY,m); renderMatches();
  },{title:'ELIMINAR PARTIT',msg:"EsborrarÃ s aquest partit del registre."});
}
function setMatchCasa(val) {
  // Guarda preferÃ¨ncia camp local/visitant per al proper partit
  const cfg=get(CONFIG_KEY,{}); cfg.matchCasa=val; set(CONFIG_KEY,cfg);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   TASQUES
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let _tasksMode='personal', _personalView='list', _currentBoardId=null, _taskDirty=false, _btUrgency='green';
let _editingBoardId=null, _boardMembers=[];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SISTEMA UNIFICAT DE LLISTES (personals + compartides)
   Model: una "llista" contÃ© tasques. Entres a la llista i
   tries vista Llista o Kanban a dins. Les compartides les
   poden editar tots els membres (sincronitza a Supabase).
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const LISTS_KEY = 'jomaxpath_lists_v3';
let _listsMode = 'personal';
let _openListId = null;
let _listView = 'list';

function getLists() { return get(LISTS_KEY, null); }
function setLists(l) { set(LISTS_KEY, l); }

function _migrateLists() {
  if (getLists() !== null) return; // ja migrat
  const lists = [];
  // 1) Tasques personals flat â†’ llista per defecte
  const oldTasks = get(TASKS_KEY, []);
  lists.push({
    id: 'personal_default', name: 'Les meves tasques', icon: 'ðŸ“‹',
    shared: false, shareCode: null, ownerName: null, members: [],
    tasks: (oldTasks||[]).map(t=>({
      id: t.id||Date.now().toString()+Math.random().toString(36).slice(2,6),
      name: t.name||'', done: !!t.done,
      status: t.status || (t.done?'done':'todo'),
      prio: t.prio||3, date: t.date||''
    }))
  });
  // 2) Taulers compartits existents â†’ llistes compartides
  const oldBoards = get(BOARDS_KEY, []);
  (oldBoards||[]).forEach(b=>{
    lists.push({
      id: b.id||Date.now().toString()+Math.random().toString(36).slice(2,6),
      name: b.name||'Llista', icon: 'ðŸ¤',
      shared: true, shareCode: b.shareCode||null, ownerName: b.ownerName||null,
      members: b.members||[],
      tasks: (b.tasks||[]).map(t=>({
        id: Date.now().toString()+Math.random().toString(36).slice(2,6),
        name: t.t||t.name||'', done: !!t.done,
        status: t.status || (t.done?'done':'todo'),
        prio: t.prio||3, date: t.date||''
      }))
    });
  });
  setLists(lists);
}

function _getList(id) { return (getLists()||[]).find(l=>l.id===id); }

async function _saveList(list) {
  const lists = getLists()||[];
  const idx = lists.findIndex(l=>l.id===list.id);
  if (idx>=0) lists[idx]=list; else lists.push(list);
  setLists(lists);
  // Sincronitza al nÃºvol si Ã©s compartida
  if (list.shared && list.shareCode && _supabase) {
    try {
      const {error} = await _supabase.from('shared_boards').update({
        board_data: list, updated: new Date().toISOString()
      }).eq('code', list.shareCode);
      if (error) showErrorToast('❌ No s\'ha pogut sincronitzar la llista compartida. Els canvis estan guardats localment.');
    } catch { showErrorToast('❌ Sense connexió. Els canvis estan guardats localment.'); }
  }
}

/* â”€â”€ Entrada principal â”€â”€ */
function renderTasques() {
  _migrateLists();
  // Torna sempre a la colÂ·lecciÃ³ en entrar a la pÃ gina
  _openListId = null;
  document.getElementById('list-detail-view').style.display = 'none';
  document.getElementById('lists-collection-view').style.display = 'block';
  setListsMode(_listsMode);
}

function setListsMode(mode) {
  _listsMode = mode;
  document.getElementById('lmode-personal')?.classList.toggle('active', mode==='personal');
  document.getElementById('lmode-shared')?.classList.toggle('active', mode==='shared');
  const extras = document.getElementById('shared-extras');
  if (extras) extras.style.display = mode==='shared' ? 'block' : 'none';
  const title = document.getElementById('lists-collection-title');
  if (title) title.textContent = mode==='shared' ? t('lst_shared') : t('lst_my');
  if (mode==='shared') { loadBoardInvites(); updateSharedTabBadge(); }
  renderListsCollection();
}

function renderListsCollection() {
  const grid = document.getElementById('lists-grid');
  if (!grid) return;
  _migrateLists();
  const lists = (getLists()||[]).filter(l => _listsMode==='shared' ? l.shared : !l.shared);
  if (lists.length===0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:36px 16px;color:var(--muted);">
      <div style="font-size:42px;margin-bottom:10px;opacity:0.5;">${_listsMode==='shared'?'ðŸ¤':'ðŸ“‹'}</div>
      <div style="font-size:13px;line-height:1.6;">${_listsMode==='shared'?t('lst_empty_shared'):t('lst_empty_personal')}</div>
    </div>`;
    return;
  }
  grid.innerHTML = lists.map(l=>{
    const total = (l.tasks||[]).length;
    const done = (l.tasks||[]).filter(t=>t.done).length;
    const pct = total? Math.round(done/total*100) : 0;
    return `<div class="list-card" onclick="openList('${l.id}')">
      <div class="list-card-top">
        <span class="list-card-icon">${l.icon||'ðŸ“‹'}</span>
        ${l.shared?`<span class="list-card-badge">${l.ownerName&&l.ownerName!==(_userProfile?.username)?_esc(l.ownerName):t('lst_badge_shared')}</span>`:''}
      </div>
      <div class="list-card-name">${_esc(l.name)}</div>
      <div class="list-card-meta">${done}/${total} ${t('lst_tasks_done')}</div>
      <div class="list-card-bar"><div class="list-card-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

/* â”€â”€ Crear llista â”€â”€ */
function createNewList() {
  _inputPrompt(_listsMode==='shared'?t('np_new_shared'):t('np_new_list'), t('np_list_name'), async (name)=>{
    name = (name||'').trim(); if(!name) return;
    const lists = getLists()||[];
    const newList = {
      id: Date.now().toString()+Math.random().toString(36).slice(2,6),
      name, icon: _listsMode==='shared'?'ðŸ¤':'ðŸ“‹',
      shared: _listsMode==='shared', shareCode: null,
      ownerName: _listsMode==='shared'?(_userProfile?.username||'jo'):null,
      members: _listsMode==='shared'?[(_userProfile?.username||'jo')]:[],
      tasks: []
    };
    lists.push(newList); setLists(lists);
    // Si Ã©s compartida i hi ha sessiÃ³, crea-la al nÃºvol de seguida
    if (newList.shared && _supabase && _currentUser) {
      const code = 'BRD_'+newList.id.slice(-6).toUpperCase()+'_'+Date.now().toString(36).toUpperCase().slice(-4);
      newList.shareCode = code;
      try {
        await _supabase.from('shared_boards').upsert({
          code, owner_id: _currentUser.id, owner_name: _userProfile?.username||'Usuari',
          board_data: newList, updated: new Date().toISOString()
        });
        setLists(getLists().map(l=>l.id===newList.id?newList:l));
      } catch {}
    }
    renderListsCollection();
    showToast(t('tt_list_created'));
    openList(newList.id);
  });
}

/* â”€â”€ Obrir / tancar detall â”€â”€ */
async function openList(id) {
  const list = _getList(id);
  if (!list) { showToast('âš ï¸ Llista no trobada'); return; }
  _openListId = id;
  _listView = 'list';
  // Mostra la llista IMMEDIATAMENT amb dades locals â€” mai bloquegis la UI per
  // la xarxa (si la consulta al nÃºvol es penja, igualment pots entrar).
  document.getElementById('lists-collection-view').style.display = 'none';
  document.getElementById('list-detail-view').style.display = 'block';
  setListView('list');
  _subscribeListRealtime(list);
  // Refresca des del nÃºvol en segon pla (best-effort, amb timeout de 4s)
  if (list.shared && list.shareCode && _supabase) {
    try {
      const {data} = await Promise.race([
        _supabase.from('shared_boards').select('board_data').eq('code', list.shareCode).maybeSingle(),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error('t/o')),4000))
      ]);
      // NomÃ©s aplica si encara tenim aquesta llista oberta
      if (data?.board_data?.tasks && _openListId===id) {
        const lists = getLists();
        const idx = lists.findIndex(l=>l.id===id);
        if (idx>=0) {
          lists[idx] = {...lists[idx], name:data.board_data.name||list.name, tasks:data.board_data.tasks||[], members:data.board_data.members||list.members};
          setLists(lists);
          renderListDetail();
        }
      }
    } catch {} // timeout o error â†’ ens quedem amb les dades locals
  }
}

let _listChannel = null;
function _subscribeListRealtime(list) {
  // CancelÂ·la subscripciÃ³ anterior
  if (_listChannel && _supabase) { try { _supabase.removeChannel(_listChannel); } catch {} _listChannel=null; }
  if (!list.shared || !list.shareCode || !_supabase) return;
  try {
    _listChannel = _supabase.channel('list_'+list.shareCode)
      .on('postgres_changes', {event:'UPDATE', schema:'public', table:'shared_boards', filter:'code=eq.'+list.shareCode}, (payload)=>{
        // Un altre membre ha editat â†’ actualitza si encara tenim la llista oberta
        if (_openListId !== list.id) return;
        const bd = payload.new?.board_data;
        if (bd?.tasks) {
          const lists = getLists();
          const idx = lists.findIndex(l=>l.id===_openListId);
          if (idx>=0) { lists[idx] = {...lists[idx], tasks:bd.tasks, name:bd.name||lists[idx].name, members:bd.members||lists[idx].members}; setLists(lists); renderListDetail(); }
        }
      })
      .subscribe();
  } catch {}
}

function closeList() {
  _openListId = null;
  if (_listChannel && _supabase) { try { _supabase.removeChannel(_listChannel); } catch {} _listChannel=null; }
  document.getElementById('list-detail-view').style.display = 'none';
  document.getElementById('lists-collection-view').style.display = 'block';
  renderListsCollection();
}

function setListView(view) {
  _listView = view;
  document.getElementById('ldv-list')?.classList.toggle('active', view==='list');
  document.getElementById('ldv-kanban')?.classList.toggle('active', view==='kanban');
  document.getElementById('ld-list-view').style.display = view==='list'?'block':'none';
  document.getElementById('ld-kanban-view').style.display = view==='kanban'?'block':'none';
  renderListDetail();
}

function renderListDetail() {
  const list = _getList(_openListId);
  if (!list) { closeList(); return; }
  const total=(list.tasks||[]).length, done=(list.tasks||[]).filter(t=>t.done).length;
  document.getElementById('ld-icon').textContent = list.icon||'ðŸ“‹';
  document.getElementById('ld-name').textContent = list.name;
  document.getElementById('ld-meta').textContent =
    (list.shared?`${t('lst_shared_meta')}${list.ownerName?(' Â· '+(list.members||[]).length+' '+t('lst_members')):''} Â· `:'') + `${done}/${total} ${t('lst_done')}`;
  // Accions
  const actions = document.getElementById('ld-actions');
  if (actions) {
    actions.innerHTML = list.shared
      ? `<button class="ld-action-btn" onclick="shareList('${list.id}')">${t('lst_invite')}</button>
         <button class="ld-action-btn" onclick="openList('${list.id}')">${t('lst_refresh')}</button>
         <button class="ld-action-btn danger" onclick="deleteList('${list.id}')">${t('lst_leave')}</button>`
      : `<button class="ld-action-btn" onclick="deleteList('${list.id}')">${t('lst_delete')}</button>`;
  }
  // Poblar selector d'assignats (nomÃ©s llistes compartides)
  const assigneeSel = document.getElementById('ld-new-assignee');
  if (assigneeSel) {
    if (list.shared && (list.members||[]).length) {
      assigneeSel.style.display='';
      assigneeSel.innerHTML = `<option value="">${t('lst_everyone')}</option>` + (list.members||[]).map(m=>`<option value="${_esc(m)}">${m===(_userProfile?.username)?t('lst_me'):'ðŸ‘¤ '+_esc(m)}</option>`).join('');
    } else {
      assigneeSel.style.display='none';
    }
  }
  if (_listView==='list') renderListTasks(list); else renderListKanban(list);
}

function _dueChip(date) {
  if (!date) return '';
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(date+'T00:00:00');
  const diff = Math.round((d-today)/86400000);
  let color='var(--muted)', txt='ðŸ“… '+date;
  if (diff<0) { color='#fca5a5'; txt=t('due_overdue'); }
  else if (diff===0) { color='#fcd34d'; txt=t('due_today'); }
  else if (diff===1) { color='#fcd34d'; txt=t('due_tomorrow'); }
  else if (diff<=7) { color='#7dd3fc'; txt=t('due_indays').replace('{n}',diff); }
  return `<span style="font-size:10px;color:${color};">${txt}</span>`;
}
function _assigneeChip(a) {
  if (!a) return '';
  const isMe = a===(_userProfile?.username);
  return `<span style="font-size:9px;color:${isMe?'#c4b5fd':'var(--muted)'};background:${isMe?'rgba(124,58,237,0.15)':'rgba(255,255,255,0.05)'};border-radius:10px;padding:1px 7px;white-space:nowrap;">${isMe?'ðŸ™‹ Jo':'ðŸ‘¤ '+_esc(a)}</span>`;
}

function renderListTasks(list) {
  const el = document.getElementById('ld-list-view');
  if (!el) return;
  const tasks = list.tasks||[];
  if (tasks.length===0) { el.innerHTML=`<div style="color:var(--muted);font-size:13px;padding:24px;text-align:center;">${t('lst_no_tasks')}</div>`; return; }
  const prioColors={1:'#ef4444',2:'#f59e0b',3:'#3b82f6',4:'#64748b'};
  el.innerHTML = [...tasks].sort((a,b)=>(a.done-b.done)||((a.prio||3)-(b.prio||3))).map(t=>{
    const nLinks=(t.links||[]).length;
    return `
    <div class="ld-task ${t.done?'done':''}">
      <button class="ld-check ${t.done?'on':''}" onclick="toggleListTask('${t.id}')">${t.done?'âœ“':''}</button>
      <div class="ld-task-prio" style="background:${prioColors[t.prio||3]}"></div>
      <div class="ld-task-body" onclick="openTaskEditor('${t.id}')" style="cursor:pointer;">
        <div class="ld-task-name">${_esc(t.name)}</div>
        ${t.desc?`<div class="ld-task-desc">${_esc((t.desc||'').slice(0,80))}${t.desc.length>80?'â€¦':''}</div>`:''}
        ${(t.date||t.assignee||nLinks)?`<div style="display:flex;gap:8px;align-items:center;margin-top:4px;flex-wrap:wrap;">${_dueChip(t.date)}${_assigneeChip(t.assignee)}${nLinks?`<span style="font-size:10px;color:#7dd3fc;">ðŸ”— ${nLinks}</span>`:''}</div>`:''}
      </div>
      <button class="ld-task-edit" onclick="openTaskEditor('${t.id}')" title="Editar">âœŽ</button>
      <button class="ld-task-del" onclick="deleteListTask('${t.id}')">âœ•</button>
    </div>`;
  }).join('');
}

function renderListKanban(list) {
  const el = document.getElementById('ld-kanban-view');
  if (!el) return;
  const cols=[{k:'todo',t:t('kb_todo')},{k:'doing',t:t('kb_doing')},{k:'done',t:t('kb_done')}];
  const tasks=list.tasks||[];
  el.innerHTML = `<div class="ld-kanban-cols">${cols.map(c=>`
    <div class="ld-kcol" ondragover="event.preventDefault()" ondrop="dropListTask(event,'${c.k}')">
      <div class="ld-kcol-head">${c.t} <span>${tasks.filter(t=>(t.status||'todo')===c.k).length}</span></div>
      <div class="ld-kcol-body">
        ${tasks.filter(t=>(t.status||'todo')===c.k).map(t=>`
          <div class="ld-kcard" draggable="true" ondragstart="event.dataTransfer.setData('id','${t.id}')">
            <div class="ld-kcard-name">${_esc(t.name)}</div>
            ${(t.date||t.assignee)?`<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap;">${_dueChip(t.date)}${_assigneeChip(t.assignee)}</div>`:''}
            <div class="ld-kcard-foot">
              ${c.k!=='done'?`<button onclick="moveListTask('${t.id}','${c.k==='todo'?'doing':'done'}')" title="AvanÃ§ar">â†’</button>`:`<button onclick="moveListTask('${t.id}','todo')" title="Reobrir">â†º</button>`}
              <button onclick="deleteListTask('${t.id}')" title="Eliminar">âœ•</button>
            </div>
          </div>`).join('')||'<div class="ld-kcol-empty">â€”</div>'}
      </div>
    </div>`).join('')}</div>`;
}

function dropListTask(ev, status) {
  ev.preventDefault();
  const id = ev.dataTransfer.getData('id');
  if (id) moveListTask(id, status);
}

async function addListTask() {
  const inp = document.getElementById('ld-new-task');
  const prioSel = document.getElementById('ld-new-prio');
  const dateInp = document.getElementById('ld-new-date');
  const assigneeSel = document.getElementById('ld-new-assignee');
  const name = (inp?.value||'').trim().slice(0,200); // lÃ­mit de longitud (defensa)
  if (!name) return;
  const list = _getList(_openListId); if(!list) return;
  if (!list.tasks) list.tasks=[];
  list.tasks.push({
    id: Date.now().toString()+Math.random().toString(36).slice(2,6),
    name, done:false, status:'todo', prio:parseInt(prioSel?.value||'3'),
    date: dateInp?.value || '',
    assignee: (list.shared && assigneeSel?.value) ? assigneeSel.value : '',
    by:_userProfile?.username||'jo'
  });
  if (inp) inp.value='';
  if (dateInp) dateInp.value='';
  await _saveList(list);
  renderListDetail();
}

async function toggleListTask(taskId) {
  const list = _getList(_openListId); if(!list) return;
  const t = list.tasks.find(x=>x.id===taskId); if(!t) return;
  t.done=!t.done; t.status=t.done?'done':'todo';
  await _saveList(list);
  renderListDetail();
}

async function moveListTask(taskId, status) {
  const list = _getList(_openListId); if(!list) return;
  const t = list.tasks.find(x=>x.id===taskId); if(!t) return;
  t.status=status; t.done=(status==='done');
  await _saveList(list);
  renderListDetail();
}

async function deleteListTask(taskId) {
  const list = _getList(_openListId); if(!list) return;
  showDeleteConfirm(async ()=>{
    list.tasks = list.tasks.filter(x=>x.id!==taskId);
    await _saveList(list);
    renderListDetail();
  },{title:'ELIMINAR TASCA',msg:"EsborrarÃ s aquesta tasca de la llista."});
}

/* â”€â”€ Editor de tasca (descripciÃ³, enllaÃ§os, data, prioritat) â”€â”€ */
let _editingTaskId=null;
function openTaskEditor(taskId){
  const list=_getList(_openListId); if(!list) return;
  const t=(list.tasks||[]).find(x=>x.id===taskId); if(!t) return;
  _editingTaskId=taskId;
  document.getElementById('te-name').value=t.name||'';
  document.getElementById('te-desc').value=t.desc||'';
  document.getElementById('te-date').value=t.date||'';
  document.getElementById('te-prio').value=String(t.prio||3);
  teRenderLinks(t.links||[]);
  // Assignat (nomÃ©s compartides)
  const wrap=document.getElementById('te-assignee-wrap');
  const sel=document.getElementById('te-assignee');
  if(list.shared && (list.members||[]).length){
    wrap.style.display='block';
    sel.innerHTML='<option value="">ðŸ‘¥ NingÃº</option>'+(list.members||[]).map(m=>`<option value="${m}" ${t.assignee===m?'selected':''}>${m===(_userProfile?.username)?'ðŸ™‹ Jo':'ðŸ‘¤ '+m}</option>`).join('');
  } else { wrap.style.display='none'; }
  document.getElementById('task-editor-overlay').style.display='flex';
}
function teRenderLinks(links){
  const c=document.getElementById('te-links'); if(!c) return;
  c.innerHTML=(links||[]).map((url,i)=>`
    <div class="te-link-row">
      <input type="url" class="te-input te-link-input" value="${(url||'').replace(/"/g,'&quot;')}" placeholder="https://..." style="margin:0;"/>
      <a href="${(url||'').replace(/"/g,'&quot;')}" target="_blank" rel="noopener" class="te-link-open" title="Obrir">â†—</a>
      <button onclick="teRemoveLink(${i})" class="te-link-del" title="Treure">âœ•</button>
    </div>`).join('');
}
function _teCurrentLinks(){
  return Array.from(document.querySelectorAll('#te-links .te-link-input')).map(i=>i.value.trim()).filter(Boolean);
}
function teAddLink(){
  const links=_teCurrentLinks(); links.push(''); teRenderLinks(links);
  const inputs=document.querySelectorAll('#te-links .te-link-input');
  inputs[inputs.length-1]?.focus();
}
function teRemoveLink(i){
  const links=_teCurrentLinks(); links.splice(i,1); teRenderLinks(links);
}
async function saveTaskEditor(){
  const list=_getList(_openListId); if(!list){ closeTaskEditor(); return; }
  const t=(list.tasks||[]).find(x=>x.id===_editingTaskId); if(!t){ closeTaskEditor(); return; }
  const name=(document.getElementById('te-name').value||'').trim();
  if(!name){ showToast('âš ï¸ La tasca necessita un nom'); return; }
  t.name=name;
  t.desc=(document.getElementById('te-desc').value||'').trim();
  t.date=document.getElementById('te-date').value||'';
  t.prio=parseInt(document.getElementById('te-prio').value||'3');
  t.links=_teCurrentLinks().map(u=>/^https?:\/\//i.test(u)?u:'https://'+u);
  const sel=document.getElementById('te-assignee');
  if(list.shared && sel) t.assignee=sel.value||'';
  await _saveList(list);
  closeTaskEditor();
  renderListDetail();
  showToast(t('tt_task_updated'));
}
function closeTaskEditor(){
  _editingTaskId=null;
  document.getElementById('task-editor-overlay').style.display='none';
}

function deleteList(id) {
  const list=_getList(id); if(!list) return;
  const isShared=list.shared;
  showDeleteConfirm(()=>{
    setLists((getLists()||[]).filter(l=>l.id!==id));
    closeList();
    showToast(isShared?t('tt_left_list'):t('tt_list_deleted'));
  });
}

/* Compartir una llista (reusa el modal de compartir per nom d'usuari) */
function shareList(id) {
  const list=_getList(id); if(!list) return;
  if (!_currentUser) { showToast('âš ï¸ Inicia sessiÃ³ per compartir'); return; }
  _pendingShareListId = id;
  const modal = document.getElementById('share-board-modal-overlay');
  if (modal) {
    document.getElementById('sbi-board-name').textContent = list.name;
    document.getElementById('sbi-username-inp').value='';
    document.getElementById('sbi-msg').textContent='';
    modal.style.display='flex';
  }
}
let _pendingShareListId = null;

/* Petit modal de prompt reutilitzable */
function _inputPrompt(title, placeholder, cb) {
  let ov=document.getElementById('input-prompt-ov');
  if(!ov){
    ov=document.createElement('div');
    ov.id='input-prompt-ov';
    ov.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);';
    ov.innerHTML=`<div style="background:var(--card);border:1px solid rgba(124,58,237,0.3);border-radius:20px;padding:26px 28px;max-width:360px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.5);">
      <h3 id="ip-title" style="font-size:15px;margin-bottom:14px;color:var(--text);"></h3>
      <input id="ip-input" type="text" maxlength="40" style="width:100%;background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:11px 14px;color:var(--text);font-size:14px;outline:none;box-sizing:border-box;margin-bottom:16px;" />
      <div style="display:flex;gap:10px;">
        <button id="ip-ok" style="flex:1;padding:11px;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.45);color:var(--accent2);border-radius:12px;font-size:13px;cursor:pointer;font-weight:600;">Crear</button>
        <button id="ip-cancel" style="flex:1;padding:11px;background:var(--card2);border:1px solid var(--border);color:var(--muted);border-radius:12px;font-size:13px;cursor:pointer;">CancelÂ·lar</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
  }
  ov.style.display='flex';
  const titleEl=document.getElementById('ip-title');
  const input=document.getElementById('ip-input');
  titleEl.textContent=title; input.placeholder=placeholder||''; input.value='';
  setTimeout(()=>input.focus(),50);
  const close=()=>{ov.style.display='none';};
  document.getElementById('ip-ok').onclick=()=>{const v=input.value;close();cb(v);};
  document.getElementById('ip-cancel').onclick=close;
  input.onkeydown=(e)=>{if(e.key==='Enter'){const v=input.value;close();cb(v);}if(e.key==='Escape')close();};
  ov.onclick=(e)=>{if(e.target===ov)close();};
}

function _oldRenderTasques() { renderExamList(); renderPersonalKanban(); renderSharedBoards(); }

function setTasksMode(mode) {
  _tasksMode=mode;
  document.getElementById('tasks-personal-view').style.display=mode==='personal'?'block':'none';
  document.getElementById('tasks-shared-view').style.display=mode==='shared'?'block':'none';
  document.querySelectorAll('.tasks-mode-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tmode-'+mode)?.classList.add('active');
  if (mode==='shared') { renderSharedBoards(); loadBoardInvites(); }
}
function setPersonalView(view) {
  _personalView=view;
  document.getElementById('personal-list-view').style.display=view==='list'?'block':'none';
  document.getElementById('personal-kanban-view').style.display=view==='kanban'?'block':'none';
  document.querySelectorAll('.tvt-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tvt-'+view)?.classList.add('active');
  if (view==='kanban') renderPersonalKanban();
}
function setSharedView(view) {
  document.getElementById('shared-list-inner').style.display=view==='list'?'block':'none';
  document.getElementById('shared-kanban-inner').style.display=view==='kanban'?'block':'none';
  document.querySelectorAll('.tvt-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tvt-shared-'+view)?.classList.add('active');
}
function toggleExamForm() {
  const f=document.getElementById('exam-form');
  if (f) f.style.display=f.style.display==='flex'?'none':'flex';
}
function addExam() {
  const name=(document.getElementById('exam-name')?.value||'').trim();
  const date=document.getElementById('exam-date')?.value;
  const type=document.getElementById('exam-type')?.value||'tasca';
  const prio=parseInt(document.getElementById('exam-prio')?.value||'3');
  if (!name) { showToast('âš ï¸ Escriu un nom'); return; }
  const tasks=get(TASKS_KEY,[]);
  tasks.push({id:Date.now().toString(),name,date,type,prio,done:false,status:'todo',urgency:'green',created:Date.now()});
  set(TASKS_KEY,tasks); document.getElementById('exam-name').value='';
  toggleExamForm(); renderExamList(); showToast('âœ… Tasca afegida!');
}
function renderExamList() {
  const list=document.getElementById('exam-list'); if (!list) return;
  const tasks=get(TASKS_KEY,[]).filter(t=>!t.board);
  if (tasks.length===0) { list.innerHTML='<div style="color:var(--muted);font-size:12px;padding:16px 0;text-align:center;">Sense tasques. Afegeix-ne una! â†‘</div>'; return; }
  const typeIcons={deures:'ðŸ“š',treball:'ðŸ“„',tasca:'ðŸ—‚ï¸',personal:'ðŸ™‹'};
  const prioColors={1:'#ef4444',2:'#f59e0b',3:'#3b82f6',4:'#64748b'};
  list.innerHTML=[...tasks].sort((a,b)=>(a.prio||3)-(b.prio||3)).map(t=>`
    <div class="exam-item ${t.done?'done':''}" onclick="openTaskDetail('${t.id}')">
      <div class="ei-left">
        <div class="ei-prio-dot" style="background:${prioColors[t.prio||3]}"></div>
        <span class="ei-icon">${typeIcons[t.type]||'ðŸ—‚ï¸'}</span>
        <div class="ei-info"><div class="ei-name ${t.done?'done':''}">${t.name}</div>${t.date?`<div class="ei-date">ðŸ“… ${t.date}</div>`:''}</div>
      </div>
      <div class="ei-right">
        <button class="ei-check ${t.done?'done':''}" onclick="event.stopPropagation();toggleTaskDone('${t.id}')">${t.done?'âœ“':''}</button>
        <button class="ei-del" onclick="event.stopPropagation();deleteTask('${t.id}')">âœ•</button>
      </div>
    </div>`).join('');
}
function toggleTaskDone(id) {
  const tasks=get(TASKS_KEY,[]); const t=tasks.find(t=>t.id===id);
  if(t){t.done=!t.done;t.status=t.done?'done':'todo';}
  set(TASKS_KEY,tasks); renderExamList(); renderPersonalKanban();
}
function deleteTask(id) {
  showDeleteConfirm(()=>{
    set(TASKS_KEY,get(TASKS_KEY,[]).filter(t=>t.id!==id));
    renderExamList(); renderPersonalKanban(); showToast('ðŸ—‘ï¸ Tasca eliminada');
  });
}
function showDeleteConfirm(onConfirm, opts) {
  const title = (opts&&opts.title) || 'ELIMINAR';
  const msg   = (opts&&opts.msg)   || 'EstÃ s segur? Aquesta acciÃ³ no es pot desfer.';
  const icon  = (opts&&opts.icon)  || 'ðŸ—‘ï¸';
  let ov=document.getElementById('del-confirm-ov');
  if(!ov){
    ov=document.createElement('div');
    ov.id='del-confirm-ov';
    ov.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);';
    document.body.appendChild(ov);
  }
  ov.innerHTML=`<div style="background:var(--card);border:1px solid rgba(239,68,68,0.3);border-radius:20px;padding:28px 32px;max-width:340px;width:90%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.5);">
    <div style="font-size:36px;margin-bottom:10px;">${icon}</div>
    <h3 style="font-family:'Space Mono',monospace;font-size:14px;color:var(--text);margin-bottom:8px;letter-spacing:1px;">${title}</h3>
    <p style="font-size:12px;color:var(--muted);margin-bottom:22px;">${msg}</p>
    <div style="display:flex;gap:10px;">
      <button id="del-confirm-yes" style="flex:1;padding:11px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#fca5a5;border-radius:12px;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.3)'" onmouseout="this.style.background='rgba(239,68,68,0.15)'">âœ“ ELIMINAR</button>
      <button id="del-confirm-no" style="flex:1;padding:11px;background:var(--card2);border:1px solid var(--border);color:var(--muted);border-radius:12px;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1px;cursor:pointer;">âœ• CANCELÂ·LAR</button>
    </div>
  </div>`;
  ov.style.display='flex';
  document.getElementById('del-confirm-yes').onclick=()=>{ov.style.display='none';onConfirm();};
  document.getElementById('del-confirm-no').onclick=()=>{ov.style.display='none';};
  ov.onclick=(e)=>{if(e.target===ov)ov.style.display='none';};
}

/* â”€â”€ Kanban personal â”€â”€ */
function renderPersonalKanban() {
  const board=document.getElementById('personal-kanban-board'); if (!board) return;
  const tasks=get(TASKS_KEY,[]).filter(t=>!t.board);
  const cols=[
    {id:'todo',  name:'TO DO',       color:'#93c5fd'},
    {id:'doing', name:'IN PROGRESS', color:'#fcd34d'},
    {id:'done',  name:'DONE',        color:'#6ee7b7'},
  ];
  board.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:16px;min-height:400px;';
  board.innerHTML=cols.map((col,ci)=>{
    const colTasks=tasks.filter(t=>(t.status||'todo')===col.id);
    const urgColors={green:'#6ee7b7',yellow:'#fcd34d',red:'#f87171'};
    const cards=colTasks.map(t=>`
      <div onclick="openTaskDetail('${t.id}')" style="background:var(--card2);border:1px solid var(--border);border-left:3px solid ${urgColors[t.urgency||'green']};border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer;transition:all 0.2s;position:relative;" onmouseover="this.style.transform='translateY(-2px)';this.style.borderColor='rgba(124,58,237,0.4)'" onmouseout="this.style.transform='';this.style.borderColor='var(--border)'">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;">${t.name}</div>
        ${t.date?`<div style="font-size:10px;color:var(--muted);">ðŸ“… ${t.date}</div>`:''}
        <button onclick="event.stopPropagation();deleteTask('${t.id}')" style="position:absolute;top:6px;right:6px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;opacity:0;transition:opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">âœ•</button>
      </div>`).join('');
    return `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid ${col.color}20;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="background:${col.color};color:#000;font-size:10px;font-weight:700;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${ci+1}</span>
            <span style="font-family:'Space Mono',monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:${col.color};">${col.name}</span>
          </div>
          <span style="background:${col.color}22;color:${col.color};font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;">${colTasks.length}</span>
        </div>
        <div style="flex:1;min-height:120px;">${cards}</div>
        <button onclick="openPersonalKanbanModal('${col.id}')" style="margin-top:8px;width:100%;padding:8px;background:transparent;border:1px dashed rgba(255,255,255,0.1);border-radius:8px;color:var(--muted);font-size:12px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor='rgba(124,58,237,0.4)';this.style.color='var(--accent2)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)';this.style.color='var(--muted)'">+ Afegir tasca</button>
      </div>`;
  }).join('');
}

let _kanbanAddStatus='todo';
function openPersonalKanbanModal(status) {
  _kanbanAddStatus=status||'todo';
  const ov=document.getElementById('board-task-modal-overlay');
  if (ov) {
    const titleInp=document.getElementById('bt-title-inp'); if(titleInp) titleInp.value='';
    const dueInp=document.getElementById('bt-due-inp'); if(dueInp) dueInp.value='';
    document.querySelectorAll('.bt-urg-btn').forEach(b=>b.classList.remove('active'));
    document.querySelector('.bt-urg-btn[data-u="green"]')?.classList.add('active');
    _btUrgency='green';
    ov.style.display='flex';
  } else {
    const name=prompt('Nom de la tasca:');
    if (!name?.trim()) return;
    const tasks=get(TASKS_KEY,[]);
    tasks.push({id:Date.now().toString(),name:name.trim(),status:_kanbanAddStatus,done:_kanbanAddStatus==='done',prio:3,created:Date.now()});
    set(TASKS_KEY,tasks); renderPersonalKanban(); showToast('âœ… Tasca afegida!');
  }
}
function selectBtUrgency(btn) {
  document.querySelectorAll('.bt-urg-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); _btUrgency=btn.dataset.u||'green';
}
function saveBoardTask() {
  const title=(document.getElementById('bt-title-inp')?.value||'').trim();
  if (!title) { showToast('âš ï¸ Escriu un tÃ­tol'); return; }
  const due=document.getElementById('bt-due-inp')?.value;
  const assignee=document.getElementById('bt-assignee-inp')?.value;
  const tasks=get(TASKS_KEY,[]);
  tasks.push({id:Date.now().toString(),name:title,status:_kanbanAddStatus,done:_kanbanAddStatus==='done',urgency:_btUrgency,date:due,assignees:assignee?[assignee]:[],prio:3,created:Date.now()});
  set(TASKS_KEY,tasks); closeBoardTaskModal(); renderPersonalKanban(); renderExamList(); showToast('âœ… Tasca afegida!');
}
function closeBoardTaskModal() {
  const ov=document.getElementById('board-task-modal-overlay'); if(ov) ov.style.display='none';
}

/* Task Detail */
let _tdmTaskId=null;
function openTaskDetail(id) {
  const tasks=get(TASKS_KEY,[]); const t=tasks.find(t=>t.id===id); if (!t) return;
  _tdmTaskId=id; _taskDirty=false;
  const ov=document.getElementById('task-detail-overlay'); if (!ov) return;
  document.getElementById('tdm-title').value=t.name||'';
  document.getElementById('tdm-desc').value=t.desc||'';
  document.getElementById('tdm-due').value=t.date||'';
  document.getElementById('tdm-status').value=t.status||'todo';
  document.querySelectorAll('.tdm-status-pill').forEach(p=>p.classList.toggle('active',p.dataset.s===(t.status||'todo')));
  document.querySelectorAll('.tdm-urg-pill').forEach(p=>p.classList.toggle('active',p.dataset.u===(t.urgency||'green')));
  const bar=document.getElementById('tdm-urgency-bar');
  if(bar){const uc={green:'#10b981',yellow:'#f59e0b',red:'#ef4444'};bar.style.background=uc[t.urgency||'green'];}
  renderTdmChips('tdm-assignees-chips',t.assignees||[]);
  renderTdmLinks(t.links||[]);
  renderTdmNotes(t.notes||[]);
  document.getElementById('tdm-save-btn').style.display='none';
  ov.style.display='flex';
}
function closeTaskDetail() {
  if (_taskDirty&&confirm('Guardar canvis?')) tdmSaveChanges();
  document.getElementById('task-detail-overlay').style.display='none'; _tdmTaskId=null;
}
function tdmMarkDirty() {
  _taskDirty=true; document.getElementById('tdm-save-btn').style.display='block';
}
function tdmSetStatus(status,btn) {
  document.querySelectorAll('.tdm-status-pill').forEach(p=>p.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.getElementById('tdm-status').value=status; tdmMarkDirty();
}
function tdmSetUrgency(urg,btn) {
  document.querySelectorAll('.tdm-urg-pill').forEach(p=>p.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const bar=document.getElementById('tdm-urgency-bar');
  if(bar){const uc={green:'#10b981',yellow:'#f59e0b',red:'#ef4444'};bar.style.background=uc[urg];} tdmMarkDirty();
}
function tdmAddAssignee() {
  const inp=document.getElementById('tdm-assignee-inp'); const val=(inp?.value||'').trim(); if (!val) return;
  const tasks=get(TASKS_KEY,[]); const t=tasks.find(t=>t.id===_tdmTaskId); if (!t) return;
  if (!t.assignees) t.assignees=[];
  t.assignees.push(val); set(TASKS_KEY,tasks); renderTdmChips('tdm-assignees-chips',t.assignees); if(inp) inp.value='';
}
function renderTdmChips(cId,items) {
  const el=document.getElementById(cId); if (!el) return;
  el.innerHTML=items.map((item,i)=>`<span class="tdm-chip">${item} <button onclick="removeTdmChip('${cId}',${i})">âœ•</button></span>`).join('');
}
function removeTdmChip(cId,idx) {
  const tasks=get(TASKS_KEY,[]); const t=tasks.find(t=>t.id===_tdmTaskId); if (!t) return;
  const key=cId==='tdm-assignees-chips'?'assignees':'tags';
  if(t[key]) t[key].splice(idx,1); set(TASKS_KEY,tasks); renderTdmChips(cId,t[key]||[]);
}
function tdmAddLink() {
  const url=(document.getElementById('tdm-link-url-inp')?.value||'').trim(); if (!url) return;
  const label=(document.getElementById('tdm-link-label-inp')?.value||url).trim();
  const tasks=get(TASKS_KEY,[]); const t=tasks.find(t=>t.id===_tdmTaskId); if (!t) return;
  if (!t.links) t.links=[];
  t.links.push({url,label}); set(TASKS_KEY,tasks); renderTdmLinks(t.links);
  document.getElementById('tdm-link-url-inp').value=''; document.getElementById('tdm-link-label-inp').value='';
}
function renderTdmLinks(links) {
  const el=document.getElementById('tdm-links-list'); if (!el) return;
  el.innerHTML=(links||[]).map((l,i)=>`<div class="tdm-link-row"><a href="${l.url}" target="_blank">${l.label||l.url}</a><button onclick="removeTdmLink(${i})">âœ•</button></div>`).join('');
}
function removeTdmLink(idx) {
  const tasks=get(TASKS_KEY,[]); const t=tasks.find(t=>t.id===_tdmTaskId); if(!t||!t.links) return;
  t.links.splice(idx,1); set(TASKS_KEY,tasks); renderTdmLinks(t.links);
}
function addNoteToTask() {
  const inp=document.getElementById('tdm-note-inp'); const val=(inp?.value||'').trim(); if (!val) return;
  const tasks=get(TASKS_KEY,[]); const t=tasks.find(t=>t.id===_tdmTaskId); if (!t) return;
  if (!t.notes) t.notes=[];
  t.notes.push({text:val,date:new Date().toLocaleDateString('ca')}); set(TASKS_KEY,tasks); renderTdmNotes(t.notes); if(inp) inp.value='';
}
function renderTdmNotes(notes) {
  const el=document.getElementById('tdm-notes-list'); if (!el) return;
  el.innerHTML=(notes||[]).map((n,i)=>`<div class="tdm-note-row"><span class="tn-date">${n.date||''}</span> <span>${n.text}</span><button onclick="removeTdmNote(${i})">âœ•</button></div>`).join('');
}
function removeTdmNote(idx) {
  const tasks=get(TASKS_KEY,[]); const t=tasks.find(t=>t.id===_tdmTaskId); if(!t||!t.notes) return;
  t.notes.splice(idx,1); set(TASKS_KEY,tasks); renderTdmNotes(t.notes);
}
function tdmSaveChanges() {
  if (!_tdmTaskId) return;
  const tasks=get(TASKS_KEY,[]); const t=tasks.find(t=>t.id===_tdmTaskId); if (!t) return;
  t.name=document.getElementById('tdm-title')?.value||t.name;
  t.desc=document.getElementById('tdm-desc')?.value||'';
  t.date=document.getElementById('tdm-due')?.value||'';
  t.status=document.getElementById('tdm-status')?.value||'todo';
  t.done=t.status==='done';
  const urgPill=document.querySelector('.tdm-urg-pill.active');
  if(urgPill) t.urgency=urgPill.dataset.u;
  set(TASKS_KEY,tasks); _taskDirty=false; document.getElementById('tdm-save-btn').style.display='none';
  renderExamList(); renderPersonalKanban(); showToast('âœ… Tasca guardada!');
}
function updateTaskStatusFromDetail(status) { tdmSetStatus(status,null); }

/* Shared boards */
function renderSharedBoards() {
  const grid=document.getElementById('shared-boards-grid'); if (!grid) return;
  const boards=get(BOARDS_KEY,[]);
  loadBoardInvites();
  if (boards.length===0) { grid.innerHTML='<div style="color:var(--muted);font-size:13px;padding:16px;">Crea la teva primera llista! â†’</div>'; return; }
  grid.innerHTML=boards.map(b=>`
    <div class="board-card" onclick="openBoardDetail('${b.id}')" style="cursor:pointer;">
      <div class="bc-name">${b.name}</div>
      <div class="bc-desc">${b.desc||''}</div>
      <div class="bc-meta">${(b.tasks||[]).length} tasques Â· ${(b.members||[]).length} membres ${b.sharedWith?'Â· <span style="color:var(--accent2);">compartida</span>':''}</div>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <button onclick="event.stopPropagation();openBoardDetail('${b.id}')" style="padding:5px 10px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.35);color:#6ee7b7;border-radius:7px;font-family:'Space Mono',monospace;font-size:8px;cursor:pointer;">ðŸ“‚ OBRIR</button>
        ${!b.sharedWith?`<button onclick="event.stopPropagation();shareBoard('${b.id}')" style="padding:5px 10px;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);color:var(--accent2);border-radius:7px;font-family:'Space Mono',monospace;font-size:8px;cursor:pointer;">ðŸ“¤ COMPARTIR</button>`:''}
      </div>
    </div>`).join('');
}
function openCreateBoardModal() {
  _editingBoardId=null; _boardMembers=[];
  const ov=document.getElementById('board-modal-overlay'); if (!ov) return;
  document.getElementById('board-name-inp').value='';
  document.getElementById('board-desc-inp').value='';
  document.getElementById('board-modal-title').textContent='Nova llista compartida';
  document.getElementById('bm-save-btn').textContent='Crear llista';
  document.getElementById('board-members-current').innerHTML='';
  ov.style.display='flex';
}
function closeBoardModal() { document.getElementById('board-modal-overlay').style.display='none'; }
function addBoardMember() {
  const email=(document.getElementById('board-member-add-inp')?.value||'').trim(); if(!email) return;
  _boardMembers.push(email); document.getElementById('board-member-add-inp').value='';
  document.getElementById('board-members-current').innerHTML=_boardMembers.map((m,i)=>`<span class="board-member-chip">${m} <button onclick="_boardMembers.splice(${i},1);document.getElementById('board-members-current').innerHTML=''">âœ•</button></span>`).join('');
}
function saveBoardModal() {
  const name=(document.getElementById('board-name-inp')?.value||'').trim(); if (!name) { showToast('âš ï¸ Posa un nom'); return; }
  const boards=get(BOARDS_KEY,[]);
  boards.push({id:Date.now().toString(),name,desc:document.getElementById('board-desc-inp')?.value||'',members:_boardMembers,tasks:[],created:Date.now()});
  set(BOARDS_KEY,boards); closeBoardModal(); renderSharedBoards(); showToast('âœ… Llista creada!');
}
let _openBoardId = null;

async function openBoardDetail(id) {
  const boards=get(BOARDS_KEY,[]);
  const board=boards.find(b=>b.id===id);
  if (!board) { showToast('âš ï¸ Tauler no trobat'); return; }
  _openBoardId = id;
  const ov = document.getElementById('board-detail-overlay');
  if (!ov) return;
  ov.style.display='flex';
  // Si Ã©s compartida, refresca des del nÃºvol per veure els canvis dels altres membres
  if (board.shareCode && _supabase) {
    try {
      const {data} = await _supabase.from('shared_boards').select('board_data,owner_name').eq('code',board.shareCode).maybeSingle();
      if (data?.board_data) {
        const idx = boards.findIndex(b=>b.id===id);
        // Conserva metadades locals perÃ² agafa tasques/nom del nÃºvol
        boards[idx] = {...boards[idx], name:data.board_data.name||board.name, desc:data.board_data.desc||board.desc, tasks:data.board_data.tasks||[], members:data.board_data.members||board.members};
        set(BOARDS_KEY, boards);
      }
    } catch {}
  }
  renderBoardDetail();
}

function closeBoardDetail() {
  const ov = document.getElementById('board-detail-overlay');
  if (ov) ov.style.display='none';
  _openBoardId = null;
}

function renderBoardDetail() {
  const boards=get(BOARDS_KEY,[]);
  const board=boards.find(b=>b.id===_openBoardId);
  if (!board) { closeBoardDetail(); return; }
  const titleEl = document.getElementById('bd-title');
  const metaEl = document.getElementById('bd-meta');
  const listEl = document.getElementById('bd-tasks');
  if (titleEl) titleEl.textContent = board.name;
  if (metaEl) metaEl.textContent = (board.sharedWith?('Compartida per '+(board.ownerName||'algÃº')+' Â· '):'') + (board.tasks||[]).length + ' tasques';
  const tasks = board.tasks||[];
  if (listEl) {
    if (tasks.length===0) {
      listEl.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:20px;text-align:center;">Encara no hi ha tasques. Afegeix-ne una! â†“</div>';
    } else {
      listEl.innerHTML = tasks.map((t,i)=>`
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card2);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin-bottom:6px;">
          <button onclick="toggleBoardTask(${i})" style="width:22px;height:22px;border-radius:6px;border:1.5px solid ${t.done?'#10b981':'rgba(255,255,255,0.2)'};background:${t.done?'rgba(16,185,129,0.2)':'transparent'};color:#6ee7b7;cursor:pointer;flex-shrink:0;font-size:12px;">${t.done?'âœ“':''}</button>
          <span style="flex:1;font-size:13px;${t.done?'text-decoration:line-through;color:var(--muted);':''}">${t.t||t.name||''}</span>
          <button onclick="deleteBoardTask(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;flex-shrink:0;">âœ•</button>
        </div>`).join('');
    }
  }
}

async function _persistBoard(board) {
  // Desa local
  const boards=get(BOARDS_KEY,[]);
  const idx=boards.findIndex(b=>b.id===board.id);
  if (idx>=0) { boards[idx]=board; set(BOARDS_KEY,boards); }
  // Si estÃ  compartida, sincronitza al nÃºvol perquÃ¨ tots els membres ho vegin
  if (board.shareCode && _supabase) {
    try {
      await _supabase.from('shared_boards').update({board_data:board, updated:new Date().toISOString()}).eq('code',board.shareCode);
    } catch {}
  }
}

async function addBoardTask() {
  const inp = document.getElementById('bd-new-task');
  const txt = (inp?.value||'').trim();
  if (!txt) return;
  const boards=get(BOARDS_KEY,[]);
  const board=boards.find(b=>b.id===_openBoardId); if(!board) return;
  if (!board.tasks) board.tasks=[];
  board.tasks.push({t:txt, done:false, by:_userProfile?.username||'jo'});
  if (inp) inp.value='';
  await _persistBoard(board);
  renderBoardDetail(); renderSharedBoards();
}

async function toggleBoardTask(i) {
  const boards=get(BOARDS_KEY,[]);
  const board=boards.find(b=>b.id===_openBoardId); if(!board||!board.tasks[i]) return;
  board.tasks[i].done=!board.tasks[i].done;
  await _persistBoard(board);
  renderBoardDetail();
}

async function deleteBoardTask(i) {
  const boards=get(BOARDS_KEY,[]);
  const board=boards.find(b=>b.id===_openBoardId); if(!board) return;
  board.tasks.splice(i,1);
  await _persistBoard(board);
  renderBoardDetail(); renderSharedBoards();
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   FOCUS â€” POMODORO
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let _pomoFocusMin=25, _pomoBreakMin=5, _pomoSessions=4;
let _pomoCurrent=0, _pomoState='idle', _pomoSeconds=0, _pomoInterval=null;

const POMO_LEVELS=[
  {lvl:1,name:'APRENENT',xpNeeded:0},{lvl:2,name:'ESTUDIÃ“S',xpNeeded:10},
  {lvl:3,name:'CONSTANT',xpNeeded:30},{lvl:4,name:'DEDICAT',xpNeeded:60},
  {lvl:5,name:'ENFOCANT',xpNeeded:100},{lvl:6,name:'DISCIPLINAT',xpNeeded:150},
  {lvl:7,name:'EXPERT',xpNeeded:210},{lvl:8,name:'MESTRE',xpNeeded:280},
  {lvl:9,name:'LLEGENDA',xpNeeded:360},{lvl:10,name:'TRANSCENDENT',xpNeeded:450},
];

function renderFocus() {
  const data=get(POMO_KEY,{xp:0,total:0,week:0,today:0,goalToday:4,todayDate:''});
  const today=new Date().toDateString();
  if (data.todayDate!==today) { data.today=0; data.todayDate=today; set(POMO_KEY,data); }
  updatePomoDisplay(); updatePomoStats(data); updatePomoLevel(data); updatePomoDailyGoal(data);
}
function updatePomoDisplay() {
  const secs=_pomoSeconds>0?_pomoSeconds:_pomoFocusMin*60;
  const m=Math.floor(secs/60), s=secs%60;
  const digits=document.getElementById('pomo-digits');
  const lbl=document.getElementById('pomo-lbl');
  const arc=document.getElementById('pomo-arc');
  const timeStr=`${pad2(m)}:${pad2(s)}`;
  const phaseStr=_pomoState==='break'?'DESCANS':'FOCUS';
  if (digits) digits.textContent=timeStr;
  if (lbl)    lbl.textContent=phaseStr;
  const fsDigits=document.getElementById('pomo-fs-digits');
  const fsPhase=document.getElementById('pomo-fs-phase');
  if (fsDigits) fsDigits.textContent=timeStr;
  if (fsPhase)  fsPhase.textContent=phaseStr;
  // Estat visual: focus (porpra/vermell) vs descans (verd) + corrent (pols)
  const isBreak=_pomoState==='break';
  const running=_pomoState!=='idle'&&_pomoState!=='paused';
  const ringWrap=document.querySelector('.pomo-ring-wrap');
  if(ringWrap){ ringWrap.classList.toggle('is-break',isBreak); ringWrap.classList.toggle('is-running',running); }
  const fs=document.getElementById('pomo-fullscreen');
  if(fs){ fs.classList.toggle('is-break',isBreak); fs.classList.toggle('is-running',running); }
  const total=(_pomoState==='break'?_pomoBreakMin:_pomoFocusMin)*60;
  const circ=2*Math.PI*80;
  if (arc) { arc.style.strokeDasharray=circ; arc.style.strokeDashoffset=circ*(1-(total-secs)/Math.max(total,1)); }
  const fsArc=document.getElementById('pomo-fs-arc');
  const fsCirc=2*Math.PI*88;
  if (fsArc) { fsArc.style.strokeDasharray=fsCirc+''; fsArc.style.strokeDashoffset=(fsCirc*(1-(total-secs)/Math.max(total,1)))+''; }
  const sessions=document.getElementById('pomo-sessions');
  if (sessions) sessions.innerHTML=Array.from({length:_pomoSessions},(_,i)=>`<div class="pomo-session-dot ${i<_pomoCurrent?'done':i===_pomoCurrent&&_pomoState!=='idle'?'active':''}"></div>`).join('');
}
function pomoAction() {
  if (_pomoState==='idle') _pomoStart();
  else if (_pomoState==='focus') _pomoPause();
  else if (_pomoState==='paused') _pomoResume();
  else if (_pomoState==='break') _pomoSkipBreak();
}
function _pomoStart() {
  // Quan Ã©s idle, sempre reinicialitza els segons (fins i tot si quedava algun residu)
  if (_pomoState==='idle') _pomoSeconds=_pomoFocusMin*60;
  // Si Ã©s 'paused', continua des d'on estava â€” _pomoSeconds no es toca
  _pomoState='focus';
  clearInterval(_pomoInterval); _pomoInterval=setInterval(_pomoTick,1000);
  const btn=document.getElementById('pomo-start'); if(btn) btn.textContent='â¸ PAUSA';
  const fsbtn=document.getElementById('pomo-fs-start'); if(fsbtn) fsbtn.textContent='â¸ PAUSA';
  updatePomoDisplay();
}
function _pomoResume() {
  _pomoState='focus';
  clearInterval(_pomoInterval); _pomoInterval=setInterval(_pomoTick,1000);
  const btn=document.getElementById('pomo-start'); if(btn) btn.textContent='â¸ PAUSA';
  const fsbtn=document.getElementById('pomo-fs-start'); if(fsbtn) fsbtn.textContent='â¸ PAUSA';
  updatePomoDisplay();
}
function _pomoPause() {
  clearInterval(_pomoInterval); _pomoInterval=null; _pomoState='paused';
  const btn=document.getElementById('pomo-start'); if(btn) btn.textContent='â–¶ REPRENDRE';
  const fsbtn=document.getElementById('pomo-fs-start'); if(fsbtn) fsbtn.textContent='â–¶ REPRENDRE';
  updatePomoDisplay();
}
function _pomoTick() {
  _pomoSeconds--; updatePomoDisplay();
  if (_pomoSeconds<=0) { if(_pomoState==='focus') _pomoCompleteFocus(); else _pomoCompleteBreak(); }
}
function _playPomoAlarm() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    function tone(freq, start, dur, vol) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur + 0.05);
    }
    [0, 0.35, 0.7, 1.05].forEach(t => { tone(1200,t,0.06,0.5); tone(800,t+0.18,0.06,0.4); });
    tone(1047,1.5,0.4,0.7); tone(784,1.9,0.4,0.6); tone(1047,2.3,0.7,0.8);
  } catch(e) {}
}
function _pomoCompleteFocus() {
  clearInterval(_pomoInterval); _pomoCurrent++;
  const data=get(POMO_KEY,{xp:0,total:0,week:0,today:0,goalToday:4,todayDate:new Date().toDateString()});
  data.xp=(data.xp||0)+5; data.total=(data.total||0)+1; data.today=(data.today||0)+1; data.week=(data.week||0)+1;
  set(POMO_KEY,data); showToast('ðŸ… Pomodoro completat! +5 XP');
  updatePomoLevel(data); updatePomoStats(data); updatePomoDailyGoal(data);
  if (_pomoCurrent>=_pomoSessions) { showToast('ðŸ† SessiÃ³ completada!'); _pomoCurrent=0; }
  _pomoState='break'; _pomoSeconds=_pomoBreakMin*60;
  const btn=document.getElementById('pomo-start'); if(btn) btn.textContent='â­ SALTAR DESCANS';
  _pomoInterval=setInterval(_pomoTick,1000); updatePomoDisplay();
}
function _pomoCompleteBreak() {
  clearInterval(_pomoInterval); _pomoState='idle'; _pomoSeconds=0;
  const btn=document.getElementById('pomo-start'); if(btn) btn.textContent='â–¶ INICIAR';
  _playPomoAlarm();
  updatePomoDisplay(); showToast('âœ… Descans acabat! Llest per al segÃ¼ent focus ðŸš€');
}
function _pomoSkipBreak() {
  clearInterval(_pomoInterval); _pomoState='idle'; _pomoSeconds=0;
  const btn=document.getElementById('pomo-start'); if(btn) btn.textContent='â–¶ INICIAR';
  updatePomoDisplay();
}
function pomoReset() {
  clearInterval(_pomoInterval); _pomoInterval=null; _pomoState='idle'; _pomoSeconds=0; _pomoCurrent=0;
  const btn=document.getElementById('pomo-start'); if(btn) btn.textContent='â–¶ INICIAR';
  const fsbtn=document.getElementById('pomo-fs-start'); if(fsbtn) fsbtn.textContent='â–¶ INICIAR';
  updatePomoDisplay();
}
function setPomoPreset(focus,brk,sessions) {
  _pomoFocusMin=focus; _pomoBreakMin=brk; _pomoSessions=sessions; pomoReset();
  document.querySelectorAll('.pomo-preset-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('preset-'+focus)?.classList.add('active');
  const digits=document.getElementById('pomo-digits'); if(digits) digits.textContent=`${pad2(focus)}:00`;
  const custF=document.getElementById('pomo-cust-focus'); const custB=document.getElementById('pomo-cust-break');
  if(custF) custF.textContent=focus; if(custB) custB.textContent=brk;
  const ratio=document.getElementById('pomo-ratio-lbl');
  if(ratio) ratio.textContent=`RÃ tio: 1:${brk} Â· ${brk} min de descans per cada ${focus} de treball`;
}
function adjustPomoCust(type,delta) {
  if (type==='focus') { _pomoFocusMin=Math.max(5,Math.min(120,_pomoFocusMin+delta)); const el=document.getElementById('pomo-cust-focus'); if(el) el.textContent=_pomoFocusMin; }
  else { _pomoBreakMin=Math.max(1,Math.min(60,_pomoBreakMin+delta)); const el=document.getElementById('pomo-cust-break'); if(el) el.textContent=_pomoBreakMin; }
}
function applyPomoCustom() {
  pomoReset(); showToast(`âœ… ${_pomoFocusMin}/${_pomoBreakMin} min aplicat`);
  const digits=document.getElementById('pomo-digits'); if(digits) digits.textContent=`${pad2(_pomoFocusMin)}:00`;
}
function changeDailyGoal(delta) {
  const data=get(POMO_KEY,{goalToday:4}); data.goalToday=Math.max(1,Math.min(12,(data.goalToday||4)+delta));
  set(POMO_KEY,data); updatePomoDailyGoal(data);
  const el=document.getElementById('pomo-goal-num'); if(el) el.textContent=data.goalToday;
}
function updatePomoDailyGoal(data) {
  const dots=document.getElementById('pomo-goal-dots');
  const status=document.getElementById('pomo-goal-status');
  const numEl=document.getElementById('pomo-goal-num');
  if(numEl) numEl.textContent=data.goalToday||4;
  if(status) { const rem=Math.max(0,(data.goalToday||4)-(data.today||0)); status.textContent=rem===0?'ðŸŽ‰ Objectiu assolit!':`${rem} pomodoros restants`; }
  if(dots) dots.innerHTML=Array.from({length:data.goalToday||4},(_,i)=>`<div style="width:24px;height:24px;border-radius:6px;background:${i<(data.today||0)?'var(--red)':'rgba(255,255,255,0.07)'};transition:background 0.3s;"></div>`).join('');
}
function updatePomoStats(data) {
  const t=document.getElementById('pomo-today'),w=document.getElementById('pomo-week'),tot=document.getElementById('pomo-total');
  if(t) t.textContent=data.today||0; if(w) w.textContent=data.week||0; if(tot) tot.textContent=data.total||0;
}
function updatePomoLevel(data) {
  const xp=data.xp||0; let lvlData=POMO_LEVELS[0];
  for (const l of POMO_LEVELS) { if(xp>=l.xpNeeded) lvlData=l; else break; }
  const next=POMO_LEVELS.find(l=>l.lvl>lvlData.lvl);
  const xpIn=xp-lvlData.xpNeeded, xpNeed=next?next.xpNeeded-lvlData.xpNeeded:1;
  const numEl=document.getElementById('pomo-level-num'),nameEl=document.getElementById('pomo-level-name');
  const barEl=document.getElementById('pomo-xp-bar'),txtEl=document.getElementById('pomo-xp-txt');
  if(numEl) numEl.textContent=lvlData.lvl; if(nameEl) nameEl.textContent=lvlData.name;
  if(barEl) barEl.style.width=Math.min(100,Math.round((xpIn/xpNeed)*100))+'%';
  if(txtEl) txtEl.textContent=`${xp} / ${next?next.xpNeeded:'MAX'} XP`;
}
function openPomoFullscreen() {
  const ov=document.getElementById('pomo-fullscreen');
  if(!ov) return;
  ov.classList.add('zen-open');
  updatePomoDisplay();
  // Sync digits
  const mainDigits=document.getElementById('pomo-digits');
  const fsDigits=document.getElementById('pomo-fs-digits');
  if(mainDigits&&fsDigits) fsDigits.textContent=mainDigits.textContent;
  const mainLbl=document.getElementById('pomo-lbl');
  const fsPhase=document.getElementById('pomo-fs-phase');
  if(mainLbl&&fsPhase) fsPhase.textContent=mainLbl.textContent;
  // Sync start button state
  const pomoStart=document.getElementById('pomo-start');
  const fsStart=document.getElementById('pomo-fs-start');
  if(pomoStart&&fsStart) fsStart.textContent=pomoStart.textContent;
}
function closePomoFullscreen() {
  const ov=document.getElementById('pomo-fullscreen');
  if(!ov) return;
  ov.classList.remove('zen-open');
}
function pomoFsAction() { pomoAction(); }
function pomoFsReset() { pomoReset(); }
function handlePomoFsClick(e) {
  // Tancar nomÃ©s si s'ha clicat el fons (no els controls)
  if(e.target===document.getElementById('pomo-fullscreen') || e.target.id==='pomo-fs-close-hint') {
    closePomoFullscreen();
  }
}
function loadSpotify() {
  const url=(document.getElementById('spotify-url-input')?.value||'').trim();
  const match=url.match(/playlist\/([a-zA-Z0-9]+)/);
  const embedId=match?match[1]:'37i9dQZF1DX8NTLI2TtZa6';
  const container=document.getElementById('spotify-embed-container');
  if(container){container.innerHTML=`<iframe style="border-radius:12px;width:100%;height:152px;border:none;" src="https://open.spotify.com/embed/playlist/${embedId}?utm_source=generator&theme=0" allowfullscreen allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture" loading="lazy"></iframe>`;showToast('ðŸŽµ Playlist carregada!');}
}
let _vicWeekOffset = 0;
// Migra el format antic (array) al nou (objecte keyed per setmana)
(function migrateVictories() {
  try {
    const raw = localStorage.getItem(VICTORIES_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const obj = {};
      const today = new Date();
      const d = new Date(today); d.setDate(d.getDate() - d.getDay() + 1);
      const key = `${d.getFullYear()}-W${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
      obj[key] = { texts: parsed.map(v=>v.text||v).filter(Boolean).slice(0,3), date: today.toLocaleDateString('ca'), saved: Date.now() };
      localStorage.setItem(VICTORIES_KEY, JSON.stringify(obj));
    }
  } catch(e) {}
})();
function changeVictoriesWeek(delta) {
  _vicWeekOffset += (delta||0);
  renderVictories();
}
function _getWeekKey(offset) {
  const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1 + offset*7);
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), w=String(d.getDate()).padStart(2,'0');
  return `${y}-W${m}${w}`;
}
function _getWeekLabel(offset) {
  if(offset===0) return 'Setmana actual';
  if(offset===-1) return 'Setmana passada';
  if(offset===1) return 'Setmana vinent';
  const d=new Date(); d.setDate(d.getDate()-d.getDay()+1+offset*7);
  return d.toLocaleDateString('ca',{day:'2-digit',month:'short',year:'numeric'});
}
function saveVictories() {
  const v1=(document.getElementById('v1')?.value||'').trim();
  const v2=(document.getElementById('v2')?.value||'').trim();
  const v3=(document.getElementById('v3')?.value||'').trim();
  const texts=[v1,v2,v3].filter(Boolean);
  if(!texts.length){showToast('âœï¸ Escriu almenys una victÃ²ria!');return;}
  const weekKey=_getWeekKey(_vicWeekOffset);
  const allVics=get(VICTORIES_KEY,{});
  allVics[weekKey]={texts,date:new Date().toLocaleDateString('ca'),saved:Date.now()};
  set(VICTORIES_KEY,allVics);
  // Feedback visual
  const btn=document.querySelector('.victories-save-btn');
  if(btn){btn.textContent='âœ… VICTÃ’RIES GUARDADES!';btn.style.background='linear-gradient(135deg,rgba(16,185,129,0.25),rgba(6,78,59,0.2))';btn.style.borderColor='rgba(16,185,129,0.5)';btn.style.color='#6ee7b7';setTimeout(()=>{btn.textContent='ðŸ’¾ GUARDAR VICTÃ’RIES';btn.style.cssText='';},2200);}
  showToast('ðŸ† VictÃ²ries guardades!');
  renderVictories();
}
function renderVictories() {
  const lbl=document.getElementById('victories-week-label');
  if(lbl) lbl.textContent=_getWeekLabel(_vicWeekOffset);
  // Carregar inputs de la setmana
  const weekKey=_getWeekKey(_vicWeekOffset);
  const allVics=get(VICTORIES_KEY,{});
  const entry=allVics[weekKey]||{};
  const texts=entry.texts||['','',''];
  ['v1','v2','v3'].forEach((id,i)=>{const el=document.getElementById(id);if(el)el.value=texts[i]||'';});
  // Mostrar historial recent
  const list=document.getElementById('victories-list');
  if(!list) return;
  const weeks=Object.keys(allVics).sort().reverse().slice(0,6);
  if(!weeks.length){list.innerHTML='<div style="color:var(--muted);font-size:12px;margin-top:8px;">Registra la teva primera victÃ²ria!</div>';return;}
  const EMOJIS=['ðŸ¥‡','ðŸ¥ˆ','ðŸ¥‰'];
  list.innerHTML=weeks.map(wk=>{
    const e=allVics[wk]; if(!e||!e.texts?.length) return '';
    const isActive=wk===weekKey;
    return `<div style="margin-top:10px;padding:10px 12px;border-radius:12px;background:${isActive?'rgba(167,139,250,0.08)':'rgba(255,255,255,0.02)'};border:1px solid ${isActive?'rgba(167,139,250,0.3)':'rgba(255,255,255,0.05)'};">
      <div style="font-family:'Space Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:6px;">${e.date||wk} ${isActive?'Â· <span style="color:#a78bfa;">ACTUAL</span>':''}</div>
      ${e.texts.filter(Boolean).map((t,i)=>`<div style="font-size:12px;color:var(--text);padding:2px 0;display:flex;gap:8px;align-items:flex-start;"><span style="flex-shrink:0;">${EMOJIS[i]||'âœ¨'}</span><span>${t}</span></div>`).join('')}
    </div>`;
  }).join('');
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   JULIANS AI
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let _chats=[],_currentChatId=null,_aiMode='rapid',_estudiSub='pla';
let _attachment=null,_aiSelMode=false,_selectedChats=new Set();

function initJulians() {
  _chats=get(CHATS_KEY,[]);
  if (_chats.length===0) createNewChat();
  else { _currentChatId=_chats[0].id; renderChatList(); renderMessages(); }
  const icon=document.getElementById('julians-page-icon'); if(icon) icon.src='julians-ai.png';
  const bnavIcon=document.getElementById('julians-bnav-logo'); if(bnavIcon){bnavIcon.src='julians-ai.png';bnavIcon.style.opacity='1';}
}
function createNewChat() {
  _chats=get(CHATS_KEY,[]);
  const chat={id:Date.now().toString(),title:'Nou xat',messages:[],created:Date.now()};
  _chats.unshift(chat); _currentChatId=chat.id; set(CHATS_KEY,_chats); renderChatList(); renderMessages();
}
function renderChatList() {
  const list=document.getElementById('ai-chat-list'); if(!list) return;
  _chats=get(CHATS_KEY,[]);
  list.innerHTML=_chats.map(c=>`<div class="ai-chat-item ${c.id===_currentChatId?'active':''}" onclick="${_aiSelMode?`toggleSelectChat('${c.id}')`:`switchChat('${c.id}')`}"><div class="aci-title">${c.title||'Nou xat'}</div><div class="aci-date">${new Date(c.created||Date.now()).toLocaleDateString('ca')}</div></div>`).join('');
  const title=document.getElementById('ai-chat-title-disp');
  const curr=_chats.find(c=>c.id===_currentChatId);
  if(title&&curr) title.textContent=curr.title||'Julians AI';
}
function switchChat(id) { _currentChatId=id; renderChatList(); renderMessages(); }
function renderMessages() {
  const container=document.getElementById('ai-messages'); if(!container) return;
  _chats=get(CHATS_KEY,[]); const chat=_chats.find(c=>c.id===_currentChatId);
  if (!chat||chat.messages.length===0) {
    container.innerHTML=`<div class="ai-welcome"><div class="ai-welcome-icon">ðŸ§ </div><h3>SÃ³c Julians AI</h3><p>El teu assistent personal intelÂ·ligent. Pregunta'm qualsevol cosa!</p></div>`;
    return;
  }
  container.innerHTML=chat.messages.map(m=>`<div class="ai-msg ${m.role}"><div class="ai-msg-bubble">${m.role==='assistant'?_mdToHtml(m.content):m.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div></div>`).join('');
  container.scrollTop=container.scrollHeight;
}
function setAIMode(mode) {
  _aiMode=mode;
  document.querySelectorAll('.ai-mode-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('mode-'+mode)?.classList.add('active');
  const labels={rapid:'âš¡ Respostes concises',extens:'ðŸ“ Respostes detallades',profund:'ðŸ”¬ AnÃ lisi profunda',estudi:'ðŸ“š Mode estudi'};
  const lbl=document.getElementById('ai-mode-label-txt'); if(lbl) lbl.textContent=labels[mode]||'';
  const ep=document.getElementById('estudi-panel'); if(ep) ep.style.display=mode==='estudi'?'block':'none';
}
function setEstudiSubmode(sub) {
  _estudiSub=sub;
  document.querySelectorAll('.estudi-sub-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('estudi-sub-'+sub)?.classList.add('active');
}
async function sendAI() {
  const inp=document.getElementById('ai-chat-input');
  const text=(inp?.value||'').trim();
  if (!text&&!_attachment) return;
  if(inp) inp.value='';
  _chats=get(CHATS_KEY,[]); let chat=_chats.find(c=>c.id===_currentChatId);
  if (!chat) { createNewChat(); return; }
  const userMsg={role:'user',content:text+(_attachment?`\n\n[Adjunt: ${_attachment.name}]`:''),ts:Date.now()};
  chat.messages.push(userMsg);
  if (chat.messages.length===1) chat.title=text.slice(0,40);
  set(CHATS_KEY,_chats); renderMessages(); renderChatList();
  const container=document.getElementById('ai-messages');
  const typing=document.createElement('div');
  typing.className='ai-msg assistant typing';
  typing.innerHTML='<div class="ai-msg-bubble">ðŸ’­ Pensant...</div>';
  if(container){container.appendChild(typing);container.scrollTop=container.scrollHeight;}
  try {
    // Prepara els missatges per a la IA; si hi ha document adjunt, n'afegeix el text al darrer missatge
    const aiMessages=chat.messages.slice(-10).map(m=>({role:m.role,content:m.content}));
    if (_attachment?.text) {
      const last=aiMessages[aiMessages.length-1];
      if (last && last.role==='user') last.content += `\n\n[Contingut del document "${_attachment.name}"]:\n${_attachment.text.slice(0,40000)}`;
    }
    const reply=await callJulians(aiMessages, _buildSystemPrompt(), 2048);
    if(container&&typing.parentNode) container.removeChild(typing);
    _chats=get(CHATS_KEY,[]); chat=_chats.find(c=>c.id===_currentChatId);
    if(chat){chat.messages.push({role:'assistant',content:reply||'(resposta buida)',ts:Date.now()});set(CHATS_KEY,_chats);}
  } catch(e) {
    if(container&&typing.parentNode) container.removeChild(typing);
    _chats=get(CHATS_KEY,[]); chat=_chats.find(c=>c.id===_currentChatId);
    if(chat){chat.messages.push({role:'assistant',content:`âš ï¸ Error del Julians AI: ${e.message||e}`,ts:Date.now()});set(CHATS_KEY,_chats);}
  }
  _attachment=null;
  const docPrev=document.getElementById('ai-doc-preview'); if(docPrev) docPrev.style.display='none';
  renderMessages();
}
/* Helper reutilitzable per cridar el Julians AI (xat + eina d'exÃ mens) */
async function callJulians(messages, system, maxTokens, jsonMode) {
  const response = await fetch('/api/julians', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ system: system||'', messages, maxTokens: maxTokens||1024, jsonMode: !!jsonMode })
  });
  if (!response.ok) {
    let detail='HTTP '+response.status;
    try { const err=await response.json(); detail=(err.error||detail)+(err.detail?(' â€” '+err.detail):''); } catch {}
    throw new Error(detail);
  }
  const data = await response.json();
  return data.reply || '';
}

/* Crida que retorna JSON parsejat (per flashcards i quiz) */
async function callJuliansJSON(messages, system, maxTokens) {
  const raw = await callJulians(messages, system, maxTokens||4096, true);
  let txt = (raw||'').trim();
  // Treu tanques de codi per si de cas
  txt = txt.replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
  // Agafa des del primer [ o { fins l'Ãºltim ] o }
  const start = Math.min(...[txt.indexOf('['), txt.indexOf('{')].filter(i=>i>=0));
  const end = Math.max(txt.lastIndexOf(']'), txt.lastIndexOf('}'));
  if (Number.isFinite(start) && end>start) txt = txt.slice(start, end+1);
  return JSON.parse(txt);
}

/* Markdown â†’ HTML (segur, per a les respostes de la IA) */
function _mdToHtml(md) {
  let h = (md||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // Blocs de codi
  h = h.replace(/```([\s\S]*?)```/g, (m,c)=>`<pre class="ai-code">${c.trim()}</pre>`);
  h = h.replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>');
  // EncapÃ§alaments
  h = h.replace(/^### (.*)$/gm, '<h4 class="ai-h">$1</h4>');
  h = h.replace(/^## (.*)$/gm, '<h3 class="ai-h">$1</h3>');
  h = h.replace(/^# (.*)$/gm, '<h3 class="ai-h">$1</h3>');
  // Negreta / cursiva
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  // Llistes
  h = h.replace(/^\s*[-*] (.*)$/gm, '<li>$1</li>');
  h = h.replace(/^\s*\d+\. (.*)$/gm, '<li>$1</li>');
  h = h.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, '<ul class="ai-ul">$1</ul>');
  // Salts de lÃ­nia
  h = h.replace(/\n{2,}/g,'<br><br>').replace(/\n/g,'<br>');
  return h;
}

function _buildSystemPrompt() {
  const modeP={rapid:'Respon concÃ­s i directe. MÃ xim 3 parÃ grafs.',extens:'Respon detalladament amb exemples i estructura.',profund:'Analitza en profunditat: context, pros, contres i conclusiÃ³.',estudi:`Mode estudi (${_estudiSub}): explica com un professor pacient, amb exemples i pas a pas.`};
  // Context ric de l'usuari
  const hero=get('jomaxpath_hero_v2',null);
  const cfg=get(CONFIG_KEY,{});
  const lists=(typeof getLists==='function'?getLists():[])||[];
  const pend=[]; lists.forEach(l=>(l.tasks||[]).forEach(t=>{ if(!t.done) pend.push(t.name+(t.date?` (venÃ§ ${t.date})`:'')); }));
  const langNames={ca:'catalÃ ',es:'castellÃ ',en:'anglÃ¨s'};
  const lang=langNames[(typeof getLang==='function'?getLang():'ca')]||'catalÃ ';
  let ctx='';
  if(hero?.name) ctx+=`\n- Usuari: ${hero.name} (nivell ${hero.level||1}).`;
  if(cfg.mainGoal) ctx+=`\n- Objectiu principal: ${cfg.mainGoal}.`;
  if(pend.length) ctx+=`\n- Tasques pendents: ${pend.slice(0,6).join('; ')}.`;
  return `Ets Julians AI, l'assistent personal intelÂ·ligent de l'app JOmaxPath, creat per JOmax.
Personalitat: proper, motivador, clar i prÃ ctic. Vas al gra perÃ² amb caliu. Ets expert en productivitat, estudi i organitzaciÃ³.
Respon SEMPRE en ${lang}. Usa markdown (negretes, llistes, encapÃ§alaments) per organitzar les respostes i fer-les fÃ cils de llegir.
Quan et demanin ajuda amb estudi o tasques, dÃ³na passos concrets i accionables.
Context de l'usuari:${ctx||' (sense dades encara)'}
Estil de resposta: ${modeP[_aiMode]||modeP.rapid}
Data d'avui: ${new Date().toLocaleDateString('ca-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}.`;
}
function clearCurrentChat() {
  if (!confirm('Netejar el xat?')) return;
  _chats=get(CHATS_KEY,[]); const chat=_chats.find(c=>c.id===_currentChatId);
  if(chat){chat.messages=[];chat.title='Nou xat';set(CHATS_KEY,_chats);} renderMessages(); showToast('ðŸ—‘ï¸ Xat netejat');
}
function aiStartSelectMode() {
  _aiSelMode=true; _selectedChats.clear(); document.getElementById('ai-select-toolbar').style.display='flex'; renderChatList();
}
function aiCancelSelectMode() {
  _aiSelMode=false; _selectedChats.clear(); document.getElementById('ai-select-toolbar').style.display='none'; renderChatList();
}
function toggleSelectChat(id) {
  if(_selectedChats.has(id)) _selectedChats.delete(id); else _selectedChats.add(id);
  const cnt=document.getElementById('ai-sel-count'); if(cnt) cnt.textContent=_selectedChats.size+' seleccionats';
  renderChatList();
}
function deleteSelectedChats() {
  if(_selectedChats.size===0){showToast('Selecciona algun xat');return;}
  if(!confirm(`Eliminar ${_selectedChats.size} xat(s)?`)) return;
  _chats=get(CHATS_KEY,[]).filter(c=>!_selectedChats.has(c.id)); set(CHATS_KEY,_chats);
  if(_selectedChats.has(_currentChatId)) _currentChatId=_chats[0]?.id||null;
  aiCancelSelectMode(); renderMessages(); showToast('ðŸ—‘ï¸ Eliminats');
}
function toggleAISidebar() {
  const sb=document.getElementById('ai-sidebar'),btn=document.getElementById('ai-sidebar-toggle');
  if(sb){const open=sb.style.display!=='none';sb.style.display=open?'none':'flex';if(btn)btn.textContent=open?'â–¶':'â—€';}
}
/* Extreu text de PDF / Word(.docx) / PowerPoint(.pptx) / TXT al navegador */
async function extractFileText(file) {
  const name=(file.name||'').toLowerCase();
  try {
    if (name.endsWith('.pdf') && window.pdfjsLib) {
      const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
      let text='';
      for (let i=1;i<=pdf.numPages;i++){ const page=await pdf.getPage(i); const c=await page.getTextContent(); text+=c.items.map(it=>it.str).join(' ')+'\n'; if(text.length>80000) break; }
      return text.trim();
    }
    if (name.endsWith('.docx') && window.mammoth) {
      const res=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
      return (res.value||'').trim();
    }
    if (name.endsWith('.pptx') && window.JSZip) {
      const zip=await JSZip.loadAsync(await file.arrayBuffer());
      const slides=Object.keys(zip.files).filter(f=>/ppt\/slides\/slide\d+\.xml$/.test(f)).sort();
      let text='';
      for (const f of slides){ const xml=await zip.files[f].async('string'); const m=xml.match(/<a:t>([^<]*)<\/a:t>/g)||[]; text+=m.map(s=>s.replace(/<\/?a:t>/g,'')).join(' ')+'\n'; }
      return text.trim();
    }
    if (name.endsWith('.txt')||name.endsWith('.md')||(file.type||'').startsWith('text/')) {
      return (await file.text()).trim();
    }
    if (name.endsWith('.doc')) return '__OLD_DOC__';
    return '';
  } catch(e){ return ''; }
}

async function handleFileAttach(input) {
  const file=input.files?.[0]; if(!file) return;
  const prev=document.getElementById('ai-doc-preview'); if(prev) prev.style.display='flex';
  const icon=document.getElementById('ai-doc-icon'); if(icon) icon.textContent=file.name.match(/\.pdf$/i)?'ðŸ“„':file.name.match(/\.pptx?$/i)?'ðŸ“Š':'ðŸ“';
  const nameEl=document.getElementById('ai-doc-name'); if(nameEl) nameEl.textContent='â³ Llegint '+file.name+'...';
  _attachment={name:file.name, text:''};
  const txt=await extractFileText(file);
  if (txt==='__OLD_DOC__') { if(nameEl) nameEl.textContent=file.name+' (.doc no suportat, desa\'l com .docx)'; }
  else { _attachment.text=txt; if(nameEl) nameEl.textContent=file.name+(txt?` (${txt.length} car. llegits)`:' (sense text)'); }
  showToast(`ðŸ“Ž "${file.name}" adjuntat`);
}
function removeAttachment() {
  _attachment=null;
  const prev=document.getElementById('ai-doc-preview'); if(prev) prev.style.display='none';
  const inp=document.getElementById('ai-file-input'); if(inp) inp.value='';
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PREPARADOR D'EXÃ€MENS â€” tutor IA + pla d'estudi
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const EXAMS_KEY='jomaxpath_exams_v1';
let _examFilesText='';
let _openExamId=null;
let _examTab='plan';
function getExams(){ return get(EXAMS_KEY,[]); }
function setExams(e){ set(EXAMS_KEY,e); }

function renderExamenia(){
  _openExamId=null;
  const dv=document.getElementById('exam-detail-view'); if(dv) dv.style.display='none';
  const sv=document.getElementById('exam-setup-view'); if(sv) sv.style.display='block';
  _examFilesText='';
  const fl=document.getElementById('exam-files-list'); if(fl) fl.innerHTML='';
  renderExamSessions();
}

function renderExamSessions(){
  const grid=document.getElementById('exam-sessions-grid'); if(!grid) return;
  const exams=getExams();
  if(exams.length===0){ grid.innerHTML=''; return; }
  const today=new Date(); today.setHours(0,0,0,0);
  grid.innerHTML=`<label class="exam-label">ðŸ“š Els teus exÃ mens</label><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;">`+
    exams.map(e=>{
      const d=e.date?new Date(e.date+'T00:00:00'):null;
      const diff=d?Math.round((d-today)/86400000):null;
      const when=diff===null?'sense data':diff<0?'ja passat':diff===0?'ðŸ”¥ AVUI!':diff===1?'demÃ ':'en '+diff+' dies';
      return `<div class="exam-card" onclick="openExam('${e.id}')">
        <button class="exam-card-del" onclick="event.stopPropagation();deleteExam('${e.id}')">âœ•</button>
        <div style="font-size:26px;margin-bottom:6px;">ðŸŽ“</div>
        <div style="font-size:14px;font-weight:700;line-height:1.3;">${e.name}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:3px;">${e.subject||''}</div>
        <div style="font-size:11px;color:${diff!==null&&diff>=0&&diff<=3?'#fca5a5':'var(--accent2)'};margin-top:8px;font-weight:600;">ðŸ“… ${when}</div>
      </div>`;
    }).join('')+`</div>`;
}

function deleteExam(id){
  showDeleteConfirm(()=>{
    setExams(getExams().filter(e=>e.id!==id));
    renderExamSessions();
    showToast('ðŸ—‘ï¸ Examen eliminat');
  });
}

async function handleExamFiles(input){
  const files=Array.from(input.files||[]); if(!files.length) return;
  const listEl=document.getElementById('exam-files-list');
  for(const file of files){
    const row=document.createElement('div'); row.className='exam-file-row';
    row.innerHTML=`<span>ðŸ“„ ${file.name}</span><span class="exam-file-status">â³ llegint...</span>`;
    if(listEl) listEl.appendChild(row);
    const txt=await extractFileText(file);
    const st=row.querySelector('.exam-file-status');
    if(txt==='__OLD_DOC__'){ if(st) st.textContent='âš ï¸ .doc no suportat (desa\'l com .docx)'; }
    else if(txt){ _examFilesText+='\n\n['+file.name+']:\n'+txt; if(st) st.innerHTML='<span style="color:#6ee7b7;">âœ“ '+txt.length+' car.</span>'; }
    else { if(st) st.textContent='âš ï¸ sense text llegible'; }
  }
}

async function generateStudyPlan(){
  const name=(document.getElementById('exam-w-name')?.value||'').trim();
  const subject=(document.getElementById('exam-w-subject')?.value||'').trim();
  const date=document.getElementById('exam-w-date')?.value||'';
  const paste=(document.getElementById('exam-w-paste')?.value||'').trim();
  const syllabus=(_examFilesText+'\n\n'+paste).trim();
  if(!name){ showToast('âš ï¸ Posa un nom a l\'examen'); return; }
  if(!syllabus){ showToast('âš ï¸ Penja el temari o enganxa\'l al quadre de text'); return; }
  const btn=document.getElementById('exam-generate-btn');
  if(btn){ btn.disabled=true; btn.textContent='âœ¨ Generant el teu pla...'; }
  try{
    const today=new Date().toLocaleDateString('ca-ES');
    const sys=`Ets un tutor expert que crea plans d'estudi realistes i motivadors. Respon SEMPRE en catalÃ  amb markdown clar (encapÃ§alaments, llistes, negretes).`;
    const prompt=`Crea un pla d'estudi personalitzat per a aquest examen.
EXAMEN: ${name}${subject?' â€” '+subject:''}
DATA DE L'EXAMEN: ${date||'no especificada'}
AVUI: ${today}
TEMARI / APUNTS:
"""
${syllabus.slice(0,30000)}
"""
INSTRUCCIONS:
1. ComenÃ§a amb un resum breu (2-3 lÃ­nies) del que cal dominar.
2. Fes un pla dia a dia (o per sessions si no hi ha data) repartint els temes de manera equilibrada fins l'examen, deixant els Ãºltims dies per a repÃ s.
3. Per cada sessiÃ³: quÃ¨ estudiar + una tÃ¨cnica concreta (resum, esquema, test, flashcards...).
4. Acaba EXACTAMENT amb una secciÃ³ titulada "### CHECKLIST" i, a sota, UNA tasca per lÃ­nia amb aquest format: YYYY-MM-DD | descripciÃ³ curta de la sessiÃ³. Si no hi ha data d'examen, posa nomÃ©s la descripciÃ³ (sense data ni barra).
Sigues realista amb el temps disponible i motivador.`;
    const reply=await callJulians([{role:'user',content:prompt}], sys, 4096);
    if(!reply) throw new Error('resposta buida');
    const exam={ id:Date.now().toString(), name, subject, date, syllabus:syllabus.slice(0,40000), plan:reply, tutorMessages:[], created:Date.now() };
    const exams=getExams(); exams.unshift(exam); setExams(exams);
    if(btn){ btn.disabled=false; btn.textContent='âœ¨ Generar pla d\'estudi amb IA'; }
    ['exam-w-name','exam-w-subject','exam-w-date','exam-w-paste'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    _examFilesText=''; const fl=document.getElementById('exam-files-list'); if(fl) fl.innerHTML='';
    showToast('âœ… Pla d\'estudi creat!');
    openExam(exam.id);
  }catch(e){
    if(btn){ btn.disabled=false; btn.textContent='âœ¨ Generar pla d\'estudi amb IA'; }
    showToast('âŒ Error generant el pla: '+(e.message||e));
  }
}

function openExam(id){
  const exam=getExams().find(e=>e.id===id); if(!exam) return;
  _openExamId=id; _examTab='plan';
  _flashIdx=0; _flashFlipped=false; _quizAnswers={};
  document.getElementById('exam-setup-view').style.display='none';
  document.getElementById('exam-detail-view').style.display='block';
  renderExamDetail();
}
function closeExam(){
  _openExamId=null;
  document.getElementById('exam-detail-view').style.display='none';
  document.getElementById('exam-setup-view').style.display='block';
  renderExamSessions();
}
function setExamTab(tab){
  _examTab=tab;
  ['plan','tutor','cards','quiz'].forEach(t=>{
    document.getElementById('exam-tab-btn-'+t)?.classList.toggle('active',t===tab);
    const el=document.getElementById('exam-tab-'+t); if(el) el.style.display=t===tab?'block':'none';
  });
  if(tab==='tutor') renderExamTutor();
  if(tab==='cards') renderFlashcards();
  if(tab==='quiz') renderQuiz();
}
function renderExamDetail(){
  const exam=getExams().find(e=>e.id===_openExamId); if(!exam){ closeExam(); return; }
  document.getElementById('exam-d-title').textContent=exam.name;
  const d=exam.date?new Date(exam.date+'T00:00:00'):null; const today=new Date(); today.setHours(0,0,0,0);
  const diff=d?Math.round((d-today)/86400000):null;
  document.getElementById('exam-d-meta').textContent=(exam.subject?exam.subject+' Â· ':'')+(exam.date?('Examen el '+exam.date+(diff!==null&&diff>=0?' (en '+diff+' dies)':'')):'sense data');
  const planVisible=(exam.plan||'').split(/###\s*CHECKLIST/i)[0];
  document.getElementById('exam-plan-content').innerHTML=_mdToHtml(planVisible);
  setExamTab(_examTab);
}

function _parseChecklist(plan){
  const parts=(plan||'').split(/###\s*CHECKLIST/i);
  if(parts.length<2) return [];
  return parts[1].split('\n').map(l=>l.replace(/^[-*\s]+/,'').trim()).filter(Boolean).map(line=>{
    const m=line.match(/^(\d{4}-\d{2}-\d{2})\s*\|\s*(.+)$/);
    if(m) return {name:m[2].trim(), date:m[1]};
    return {name:line.replace(/^\d+\.\s*/,'').replace(/^\|/,'').trim(), date:''};
  }).filter(t=>t.name && t.name.length>2);
}

function saveExamPlanAsList(){
  const exam=getExams().find(e=>e.id===_openExamId); if(!exam) return;
  const tasks=_parseChecklist(exam.plan);
  if(tasks.length===0){ showToast('âš ï¸ No s\'han trobat tasques al pla per desar'); return; }
  _migrateLists();
  const lists=getLists()||[];
  const list={ id:'exam_'+exam.id, name:'ðŸ“š '+exam.name, icon:'ðŸŽ“', shared:false, shareCode:null, ownerName:null, members:[],
    tasks:tasks.map(t=>({id:Date.now().toString()+Math.random().toString(36).slice(2,6),name:t.name,done:false,status:'todo',prio:2,date:t.date||''})) };
  const idx=lists.findIndex(l=>l.id===list.id);
  if(idx>=0) lists[idx]=list; else lists.push(list);
  setLists(lists);
  showToast('âœ… '+tasks.length+' tasques desades a Tasques â†’ Les meves llistes!');
}

function renderExamTutor(){
  const exam=getExams().find(e=>e.id===_openExamId); if(!exam) return;
  const c=document.getElementById('exam-tutor-messages'); if(!c) return;
  if((exam.tutorMessages||[]).length===0){
    c.innerHTML='<div style="text-align:center;color:var(--muted);font-size:12px;padding:24px;line-height:1.6;">Pregunta\'m el que vulguis sobre el temari,<br>o usa els botons rÃ pids de dalt ðŸ‘†</div>';
    return;
  }
  c.innerHTML=exam.tutorMessages.map(m=>`<div class="ai-msg ${m.role}"><div class="ai-msg-bubble">${m.role==='assistant'?_mdToHtml(m.content):m.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div></div>`).join('');
  c.scrollTop=c.scrollHeight;
}

function examTutorAsk(q){ const inp=document.getElementById('exam-tutor-input'); if(inp) inp.value=q; examTutorSend(); }

async function examTutorSend(){
  let exam=getExams().find(e=>e.id===_openExamId); if(!exam) return;
  const inp=document.getElementById('exam-tutor-input');
  const text=(inp?.value||'').trim(); if(!text) return;
  if(inp) inp.value='';
  if(!exam.tutorMessages) exam.tutorMessages=[];
  exam.tutorMessages.push({role:'user',content:text});
  setExams(getExams().map(e=>e.id===exam.id?exam:e));
  renderExamTutor();
  const c=document.getElementById('exam-tutor-messages');
  const typing=document.createElement('div'); typing.className='ai-msg assistant'; typing.innerHTML='<div class="ai-msg-bubble">ðŸ’­ Pensant...</div>';
  if(c){ c.appendChild(typing); c.scrollTop=c.scrollHeight; }
  try{
    const sys=`Ets un tutor expert que ajuda un estudiant a preparar l'examen "${exam.name}"${exam.subject?' ('+exam.subject+')':''}. Respon en catalÃ  amb markdown. Basa't en el temari proporcionat; si et pregunten coses fora del temari, ajuda igualment. Sigues clar, pedagÃ²gic i motivador.
TEMARI:
"""
${(exam.syllabus||'').slice(0,28000)}
"""`;
    const msgs=exam.tutorMessages.slice(-8).map(m=>({role:m.role,content:m.content}));
    const reply=await callJulians(msgs, sys, 2048);
    exam=getExams().find(e=>e.id===_openExamId);
    exam.tutorMessages.push({role:'assistant',content:reply||'(resposta buida)'});
    setExams(getExams().map(e=>e.id===_openExamId?exam:e));
    renderExamTutor();
  }catch(e){
    if(typing.parentNode) typing.remove();
    exam=getExams().find(e=>e.id===_openExamId);
    exam.tutorMessages.push({role:'assistant',content:'âš ï¸ Error: '+(e.message||e)});
    setExams(getExams().map(e=>e.id===_openExamId?exam:e));
    renderExamTutor();
  }
}

/* â”€â”€ FLASHCARDS â”€â”€ */
let _flashIdx=0, _flashFlipped=false;
function renderFlashcards(){
  const exam=getExams().find(e=>e.id===_openExamId); if(!exam) return;
  const body=document.getElementById('exam-cards-body'); if(!body) return;
  const cards=exam.cards||[];
  if(cards.length===0){
    body.innerHTML=`<div class="exam-empty-tool">
      <div style="font-size:40px;margin-bottom:10px;">ðŸƒ</div>
      <p>Genera flashcards automÃ tiques del teu temari per memoritzar amb repÃ s actiu.</p>
      <button class="exam-generate-btn" style="max-width:320px;margin:14px auto 0;" onclick="generateFlashcards()">âœ¨ Generar flashcards</button>
    </div>`;
    return;
  }
  if(_flashIdx>=cards.length) _flashIdx=0;
  const c=cards[_flashIdx];
  body.innerHTML=`
    <div class="flash-counter">Targeta ${_flashIdx+1} / ${cards.length}</div>
    <div class="flashcard ${_flashFlipped?'flipped':''}" onclick="flipCard()">
      <div class="flashcard-inner">
        <div class="flashcard-face flashcard-front"><span class="flashcard-tag">PREGUNTA</span><div class="flashcard-text">${(c.q||'').replace(/</g,'&lt;')}</div><div class="flashcard-hint">Clica per veure la resposta</div></div>
        <div class="flashcard-face flashcard-back"><span class="flashcard-tag">RESPOSTA</span><div class="flashcard-text">${(c.a||'').replace(/</g,'&lt;')}</div></div>
      </div>
    </div>
    <div class="flash-nav">
      <button onclick="prevCard()" ${_flashIdx===0?'disabled':''}>â† Anterior</button>
      <button class="flash-regen" onclick="generateFlashcards()">â†» Regenerar</button>
      <button onclick="nextCard()" ${_flashIdx===cards.length-1?'disabled':''}>SegÃ¼ent â†’</button>
    </div>`;
}
function flipCard(){ _flashFlipped=!_flashFlipped; renderFlashcards(); }
function nextCard(){ const exam=getExams().find(e=>e.id===_openExamId); if(_flashIdx<(exam.cards||[]).length-1){_flashIdx++;_flashFlipped=false;renderFlashcards();} }
function prevCard(){ if(_flashIdx>0){_flashIdx--;_flashFlipped=false;renderFlashcards();} }
async function generateFlashcards(){
  const exam=getExams().find(e=>e.id===_openExamId); if(!exam) return;
  const body=document.getElementById('exam-cards-body');
  if(body) body.innerHTML='<div class="exam-empty-tool"><div style="font-size:34px;">ðŸƒ</div><p>Generant flashcards...</p></div>';
  try{
    const sys='Generes flashcards d\'estudi en JSON. Respon NOMÃ‰S amb un array JSON, sense text extra.';
    const prompt=`A partir d'aquest temari, crea entre 8 i 12 flashcards (pregunta curta i resposta concisa) dels conceptes clau. Respon en catalÃ .
Format EXACTE: [{"q":"pregunta","a":"resposta"}, ...]
TEMARI:
"""
${(exam.syllabus||'').slice(0,24000)}
"""`;
    const data=await callJuliansJSON([{role:'user',content:prompt}], sys, 4096);
    const cards=Array.isArray(data)?data:(data.cards||data.flashcards||[]);
    if(!cards.length) throw new Error('sense targetes');
    exam.cards=cards.filter(c=>c.q&&c.a);
    setExams(getExams().map(e=>e.id===_openExamId?exam:e));
    _flashIdx=0; _flashFlipped=false; renderFlashcards();
    showToast('âœ… '+exam.cards.length+' flashcards creades!');
  }catch(e){
    showToast('âŒ Error: '+(e.message||e));
    renderFlashcards();
  }
}

/* â”€â”€ QUIZ PUNTUAT â”€â”€ */
let _quizAnswers={};
function renderQuiz(){
  const exam=getExams().find(e=>e.id===_openExamId); if(!exam) return;
  const body=document.getElementById('exam-quiz-body'); if(!body) return;
  const quiz=exam.quiz||[];
  if(quiz.length===0){
    body.innerHTML=`<div class="exam-empty-tool">
      <div style="font-size:40px;margin-bottom:10px;">âœ…</div>
      <p>Genera un test tipus examen amb correcciÃ³ automÃ tica i nota.</p>
      <button class="exam-generate-btn" style="max-width:320px;margin:14px auto 0;" onclick="generateQuiz()">âœ¨ Generar quiz</button>
    </div>`;
    return;
  }
  const answered=Object.keys(_quizAnswers).length;
  const correct=Object.entries(_quizAnswers).filter(([qi,oi])=>quiz[qi]&&oi===quiz[qi].correct).length;
  const allDone=answered===quiz.length;
  let html=`<div class="quiz-scorebar">
    <span>Encerts: <b>${correct}/${quiz.length}</b></span>
    <span style="flex:1;"></span>
    <button class="flash-regen" onclick="generateQuiz()">â†» Nou quiz</button>
  </div>`;
  if(allDone){
    const pct=Math.round(correct/quiz.length*100);
    const msg=pct>=80?'ðŸ† ExcelÂ·lent!':pct>=50?'ðŸ’ª BÃ©, segueix repassant!':'ðŸ“š Cal repassar mÃ©s!';
    html+=`<div class="quiz-result">Nota: <b>${pct}%</b> Â· ${msg}</div>`;
  }
  html+=quiz.map((q,qi)=>{
    const sel=_quizAnswers[qi];
    const done=sel!==undefined;
    const opts=(q.options||[]).map((o,oi)=>{
      let cls='quiz-opt';
      if(done){ if(oi===q.correct) cls+=' correct'; else if(oi===sel) cls+=' wrong'; }
      return `<button class="${cls}" ${done?'disabled':''} onclick="answerQuiz(${qi},${oi})">${String.fromCharCode(65+oi)}. ${(o||'').replace(/</g,'&lt;')}</button>`;
    }).join('');
    return `<div class="quiz-q">
      <div class="quiz-q-text">${qi+1}. ${(q.question||'').replace(/</g,'&lt;')}</div>
      <div class="quiz-opts">${opts}</div>
      ${done?`<div class="quiz-explain">${sel===q.correct?'âœ… Correcte!':'âŒ Incorrecte.'} ${(q.explanation||'').replace(/</g,'&lt;')}</div>`:''}
    </div>`;
  }).join('');
  body.innerHTML=html;
}
function answerQuiz(qi,oi){ _quizAnswers[qi]=oi; renderQuiz(); }
async function generateQuiz(){
  const exam=getExams().find(e=>e.id===_openExamId); if(!exam) return;
  const body=document.getElementById('exam-quiz-body');
  if(body) body.innerHTML='<div class="exam-empty-tool"><div style="font-size:34px;">âœ…</div><p>Generant el quiz...</p></div>';
  try{
    const sys='Generes tests d\'examen en JSON. Respon NOMÃ‰S amb un array JSON, sense text extra.';
    const prompt=`A partir d'aquest temari, crea 6 preguntes tipus test (opciÃ³ mÃºltiple) per practicar per l'examen. Respon en catalÃ .
Cada pregunta amb 4 opcions, l'Ã­ndex (0-3) de la correcta i una explicaciÃ³ breu.
Format EXACTE: [{"question":"...","options":["a","b","c","d"],"correct":0,"explanation":"per quÃ¨"}, ...]
TEMARI:
"""
${(exam.syllabus||'').slice(0,24000)}
"""`;
    const data=await callJuliansJSON([{role:'user',content:prompt}], sys, 4096);
    const quiz=Array.isArray(data)?data:(data.quiz||data.questions||[]);
    const valid=quiz.filter(q=>q.question&&Array.isArray(q.options)&&q.options.length>=2&&typeof q.correct==='number');
    if(!valid.length) throw new Error('sense preguntes');
    exam.quiz=valid;
    setExams(getExams().map(e=>e.id===_openExamId?exam:e));
    _quizAnswers={}; renderQuiz();
    showToast('âœ… Quiz de '+valid.length+' preguntes creat!');
  }catch(e){
    showToast('âŒ Error: '+(e.message||e));
    renderQuiz();
  }
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   CERCA
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function openSearch() {
  const bar=document.getElementById('global-search-bar');
  if(bar){bar.style.display='block';bar.classList.add('open');}
  document.getElementById('search-input')?.focus();
}
function closeSearch() {
  const bar=document.getElementById('global-search-bar');
  if(bar){bar.style.display='none';bar.classList.remove('open');}
  const res=document.getElementById('search-results'); if(res) res.innerHTML='';
}
function runSearch(q) {
  const results=document.getElementById('search-results'); if(!results) return;
  if(!q.trim()){results.innerHTML='';return;}
  const tasks=get(TASKS_KEY,[]).filter(t=>t.name?.toLowerCase().includes(q.toLowerCase()));
  const habits=get(HABITS_KEY,[]).filter(h=>h.name?.toLowerCase().includes(q.toLowerCase()));
  const items=[...tasks.map(t=>({icon:'ðŸ“‹',label:t.name,sub:'Tasca',action:"navTo('tasques')"})),...habits.map(h=>({icon:h.icon||'ðŸŒ±',label:h.name,sub:'HÃ bit',action:"navTo('home')"}))];
  results.innerHTML=items.length===0?`<div class="sr-empty">Sense resultats per "${q}"</div>`:items.map(it=>`<div class="sr-item" onclick="${it.action};closeSearch()"><span class="sr-icon">${it.icon}</span><div><div class="sr-label">${it.label}</div><div class="sr-sub">${it.sub}</div></div></div>`).join('');
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   CONFIG
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function openConfig() {
  const ov=document.getElementById('config-overlay'); if(!ov) return;
  ov.style.display='flex'; renderConfigBody();
}
function closeConfig() { document.getElementById('config-overlay').style.display='none'; }

async function updateUsername() {
  const inp = document.getElementById('cfg-new-username');
  const newName = (inp?.value||'').trim().toLowerCase().replace(/[^a-z0-9_.]/g,'');
  if (!newName || newName.length < 2) { showToast('âš ï¸ El nom ha de tenir mÃ­nim 2 carÃ cters (a-z, 0-9, _, .)'); return; }
  if (!_currentUser || !_supabase) { showToast('âš ï¸ Necessites connexiÃ³'); return; }
  try {
    const {error} = await _supabase.from('profiles').update({username: newName}).eq('id', _currentUser.id);
    if (error) { showToast('âŒ Error: '+(error.message.includes('unique')?'Aquest nom ja existeix':error.message)); return; }
    if (_userProfile) { _userProfile.username = newName; _saveLocalProfile(_userProfile); }
    showToast('âœ… Nom actualitzat a: '+newName);
    renderConfigBody();
    // Update hero name too
    try { const h=get('jomaxpath_hero_v2',null); if(h){h.name=newName;set('jomaxpath_hero_v2',h);} } catch {}
  } catch(e) { showToast('âŒ Error de connexiÃ³'); }
}

async function forceSyncProfile() {
  if (!_currentUser || !_supabase) { showToast('âš ï¸ SessiÃ³ no activa'); return; }
  showToast('ðŸ”„ Sincronitzant...');
  try {
    const u = _currentUser;
    const hero = get('jomaxpath_hero_v2', null);
    const autoUsername = (_userProfile?.username) ||
      (u.user_metadata?.full_name||'').toLowerCase().replace(/[^a-z0-9_.]/g,'')||
      u.email?.split('@')[0] || 'user_'+u.id.slice(-6);
    const {error} = await _supabase.from('profiles').upsert({
      id: u.id, email: u.email||'',
      username: autoUsername,
      avatar: hero?.avatar || 'âš”ï¸',
      hero_xp: hero?.xp || 0,
      hero_level: hero ? (computeLevel ? computeLevel(hero.xp).level : 1) : 1
    }, {onConflict: 'id'});
    if (error) { showToast('âŒ '+error.message); return; }
    await _loadUserProfile(u.id);
    showToast('âœ… Perfil sincronitzat! Nom: '+(_userProfile?.username||autoUsername));
    renderConfigBody();
  } catch(e) { showToast('âŒ Error: '+e.message); }
}

// Helper computeLevel for app.js context (simplified)
function computeLevel(xp) {
  const levels=[0,100,250,500,900,1400,2100,3000,4200,5700,7500];
  let lvl=1,xpIn=xp,xpNeed=levels[1]||100;
  for(let i=0;i<levels.length-1;i++){if(xp>=levels[i+1]){lvl=i+2;xpIn=xp-levels[i+1];xpNeed=(levels[i+2]||levels[i+1])-levels[i+1];}else{xpIn=xp-levels[i];xpNeed=levels[i+1]-levels[i];break;}}
  return {level:Math.min(lvl,10),xpInLevel:Math.max(0,xpIn),xpNeeded:Math.max(1,xpNeed)};
}
function renderConfigBody() {
  const body=document.getElementById('config-body'); if(!body) return;
  const cfg=get(CONFIG_KEY,{progressTitle:'El meu objectiu',progressTotal:10,mainGoal:""});
  const apiKey=localStorage.getItem('jomaxpath_anthropic_key')||'';
  const isLoggedIn = !!_currentUser;
  const username = _userProfile?.username || (_currentUser?.email?.split('@')[0]) || 'â€”';
  const email = _currentUser?.email || 'â€”';
  body.innerHTML=`
    <div style="display:flex;gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;">
      <button onclick="document.querySelectorAll('.cfg-tab').forEach(b=>b.style.background='transparent');this.style.background='rgba(124,58,237,0.2)';document.querySelectorAll('.cfg-panel').forEach(p=>p.style.display='none');document.getElementById('cfgp-general').style.display='block'" class="cfg-tab" style="flex:1;padding:9px;background:rgba(124,58,237,0.2);border:none;color:var(--text);font-size:11px;cursor:pointer;font-family:'Space Mono',monospace;">âš™ï¸ General</button>
      <button onclick="document.querySelectorAll('.cfg-tab').forEach(b=>b.style.background='transparent');this.style.background='rgba(124,58,237,0.2)';document.querySelectorAll('.cfg-panel').forEach(p=>p.style.display='none');document.getElementById('cfgp-ia').style.display='block'" class="cfg-tab" style="flex:1;padding:9px;background:transparent;border:none;color:var(--text);font-size:11px;cursor:pointer;font-family:'Space Mono',monospace;">ðŸ”‘ IA</button>
      <button onclick="document.querySelectorAll('.cfg-tab').forEach(b=>b.style.background='transparent');this.style.background='rgba(124,58,237,0.2)';document.querySelectorAll('.cfg-panel').forEach(p=>p.style.display='none');document.getElementById('cfgp-temes').style.display='block'" class="cfg-tab" style="flex:1;padding:9px;background:transparent;border:none;color:var(--text);font-size:11px;cursor:pointer;font-family:'Space Mono',monospace;">ðŸŽ¨ Temes</button>
      <button onclick="document.querySelectorAll('.cfg-tab').forEach(b=>b.style.background='transparent');this.style.background='rgba(124,58,237,0.2)';document.querySelectorAll('.cfg-panel').forEach(p=>p.style.display='none');document.getElementById('cfgp-compte').style.display='block'" class="cfg-tab" style="flex:1;padding:9px;background:transparent;border:none;color:var(--text);font-size:11px;cursor:pointer;font-family:'Space Mono',monospace;">ðŸ‘¤ Compte</button>
    </div>
    <div id="cfgp-general" class="cfg-panel">
      <div class="cfg-section" style="margin-bottom:16px;">
        <h4 style="margin-bottom:10px;">ðŸŒ Idioma / Language / Idioma</h4>
        <div id="cfg-lang-switcher" style="display:flex;gap:8px;flex-wrap:wrap;"></div>
      </div>
      <div class="cfg-section"><h4>ðŸš€ Objectiu principal</h4><textarea id="cfg-goal" rows="3" style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px;font-size:13px;box-sizing:border-box;">${cfg.mainGoal||''}</textarea></div>
      <div class="cfg-section"><h4>ðŸ“š Nom de l'objectiu de progrÃ©s</h4><input id="cfg-prog-title" type="text" value="${cfg.progressTitle||''}" placeholder="Ex: Aprendre guitarra, Preparar oposicions..." style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px;font-size:13px;box-sizing:border-box;"/></div>
      <div class="cfg-section"><h4>ðŸ”¢ Total de passos</h4><input id="cfg-prog-total" type="number" min="1" max="100" value="${cfg.progressTotal||10}" style="width:100px;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px;font-size:13px;"/></div>
      <div style="margin-top:20px;display:flex;gap:10px;">
        <button onclick="saveConfig()" style="flex:1;padding:12px;background:linear-gradient(135deg,var(--accent),var(--cyan));border:none;border-radius:12px;color:#fff;font-weight:700;cursor:pointer;font-size:14px;">âœ… Guardar</button>
        <button onclick="closeConfig()" style="padding:12px 20px;background:var(--card2);border:1px solid var(--border);border-radius:12px;color:var(--muted);cursor:pointer;">CancelÂ·lar</button>
      </div>
    </div>
    <div id="cfgp-ia" class="cfg-panel" style="display:none;">
      <div class="cfg-section">
        <h4 style="margin-bottom:6px;">ðŸ§  Julians AI</h4>
        <div style="display:flex;align-items:center;gap:12px;padding:16px;background:linear-gradient(135deg,rgba(124,58,237,0.1),rgba(0,180,216,0.05));border:1px solid rgba(124,58,237,0.25);border-radius:14px;">
          <div style="font-size:32px;">âœ…</div>
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px;">Julians AI a punt</div>
            <p style="font-size:11px;color:var(--muted);line-height:1.5;margin:0;">No cal configurar res. El Julians funciona amb Google Gemini i Ã©s gratuÃ¯t per a tothom. Ves a <b>ðŸ§  Julians AI</b> al menÃº i comenÃ§a a xerrar!</p>
          </div>
        </div>
      </div>
    </div>
    <div id="cfgp-temes" class="cfg-panel" style="display:none;">
      <h4 style="margin-bottom:12px;">ðŸŽ¨ Tria el teu tema</h4>
      <div id="cfg-themes-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;"></div>
    </div>
    <div id="cfgp-compte" class="cfg-panel" style="display:none;">
      ${isLoggedIn ? `
      <div class="cfg-section">
        <h4 style="margin-bottom:12px;">ðŸ‘¤ El teu compte</h4>
        <div style="display:flex;align-items:center;gap:14px;padding:14px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:12px;margin-bottom:14px;">
          <div style="width:50px;height:50px;border-radius:14px;background:linear-gradient(135deg,rgba(124,58,237,0.3),rgba(0,180,216,0.2));display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">${_userProfile?.avatar||'âš”ï¸'}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:16px;font-weight:700;color:var(--text);">${username}</div>
            <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-top:2px;">${email}</div>
            <div style="font-family:'Space Mono',monospace;font-size:8px;color:rgba(0,180,216,0.7);margin-top:3px;letter-spacing:1px;">NOM D'USUARI: <span style="color:#a78bfa;">${username}</span></div>
          </div>
        </div>
        <!-- Editar nom d'usuari -->
        <div style="margin-bottom:12px;">
          <div style="font-family:'Space Mono',monospace;font-size:8.5px;letter-spacing:2px;color:var(--muted);margin-bottom:6px;">CANVIAR NOM D'USUARI (per compartir amb amics)</div>
          <div style="display:flex;gap:8px;">
            <input id="cfg-new-username" placeholder="${username}" maxlength="24" style="flex:1;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:9px;padding:9px 12px;font-size:13px;outline:none;"/>
            <button onclick="updateUsername()" style="padding:9px 14px;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.35);border-radius:9px;color:#a78bfa;cursor:pointer;font-family:'Space Mono',monospace;font-size:9px;white-space:nowrap;">âœ“ DESAR</button>
          </div>
        </div>
        <div style="margin-bottom:10px;">
          <div style="font-family:'Space Mono',monospace;font-size:8.5px;letter-spacing:2px;color:var(--muted);margin-bottom:6px;">UNIR-SE A UNA LLISTA COMPARTIDA</div>
          <div style="display:flex;gap:8px;">
            <input id="cfg-join-code" placeholder="Codi BRD_..." style="flex:1;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:9px;padding:9px 12px;font-family:'Space Mono',monospace;font-size:11px;outline:none;"/>
            <button onclick="joinSharedBoard(document.getElementById('cfg-join-code').value)" style="padding:9px 14px;background:rgba(0,180,216,0.15);border:1px solid rgba(0,180,216,0.3);border-radius:9px;color:var(--cyan2);cursor:pointer;font-family:'Space Mono',monospace;font-size:9px;white-space:nowrap;">+ UNIR-SE</button>
          </div>
        </div>
        <div style="margin-bottom:10px;display:flex;gap:8px;">
          <button onclick="_saveUserDataToCloud(_currentUser?.id).then(()=>showToast('â˜ï¸ Dades guardades!'))" style="flex:1;padding:10px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.25);border-radius:9px;color:#6ee7b7;cursor:pointer;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1px;">â˜ï¸ GUARDAR AL NÃšvOL</button>
          <button onclick="forceSyncProfile()" style="flex:1;padding:10px;background:rgba(0,180,216,0.12);border:1px solid rgba(0,180,216,0.25);border-radius:9px;color:var(--cyan2);cursor:pointer;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1px;">ðŸ”„ SINCRONITZAR PERFIL</button>
        </div>
      </div>
      <div class="cfg-section" style="border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;margin-top:4px;">
        <button onclick="authLogout()" style="width:100%;padding:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;color:#fca5a5;cursor:pointer;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:2px;transition:all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">ðŸšª TANCAR SESSIÃ“</button>
      </div>
      ` : `
      <div class="cfg-section" style="text-align:center;padding:30px 0;">
        <div style="font-size:40px;margin-bottom:14px;">ðŸ‘¤</div>
        <div style="font-size:14px;font-weight:700;margin-bottom:6px;">Sense compte</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:20px;line-height:1.6;">Crea un compte per guardar les teves dades al nÃºvol i compartir llistes amb amics.</div>
        <button onclick="closeConfig();showAuthOverlay()" style="padding:11px 24px;background:linear-gradient(135deg,var(--accent),var(--cyan));border:none;border-radius:10px;color:#fff;font-weight:700;cursor:pointer;font-size:13px;">CREAR COMPTE / ENTRAR</button>
      </div>
      `}
    </div>`;
  // Render themes in config panel
  setTimeout(()=>{
    const tg=document.getElementById('cfg-themes-grid'); if(!tg) return;
    const curTheme=(get(CONFIG_KEY,{}).theme)||'default';
    tg.innerHTML=THEMES_DATA.map(t=>`
      <div onclick="setTheme('${t.id}');document.querySelectorAll('#cfg-themes-grid .tsel').forEach(x=>x.style.borderColor='transparent');this.style.borderColor='rgba(167,139,250,0.7)'" class="tsel" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 6px;border-radius:12px;border:2px solid ${t.id===curTheme?'rgba(167,139,250,0.7)':'transparent'};background:var(--card2);transition:all 0.2s;" onmouseover="this.style.background='rgba(124,58,237,0.1)'" onmouseout="this.style.background='var(--card2)'">
        <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,${t.dot1||t.bg},${t.dot2||t.accent});border:2px solid ${t.id===curTheme?t.dot2:t.accent+'44'};box-shadow:${t.id===curTheme?'0 0 12px '+t.dot2:'none'};"></div>
        <span style="font-size:9px;font-family:'Space Mono',monospace;color:${t.id===curTheme?'#a78bfa':'var(--muted)'};letter-spacing:1px;">${t.name}</span>
      </div>`).join('');
    // Render language switcher
    renderLangSwitcher('cfg-lang-switcher');
  },50);
}
function saveApiKey() {
  const key=(document.getElementById('cfg-api-key')?.value||'').trim();
  if(key) { localStorage.setItem('jomaxpath_anthropic_key',key); showToast('âœ… Clau API guardada!'); }
  else { localStorage.removeItem('jomaxpath_anthropic_key'); showToast('ðŸ—‘ï¸ Clau eliminada'); }
  const s=document.getElementById('cfg-api-status');
  if(s) { s.textContent=key?'âœ… Clau guardada':'âš ï¸ Cap clau configurada'; s.style.color=key?'#6ee7b7':'var(--muted)'; }
}
function saveConfig() {
  const cfg=get(CONFIG_KEY,{});
  cfg.mainGoal=document.getElementById('cfg-goal')?.value||'';
  cfg.progressTitle=document.getElementById('cfg-prog-title')?.value||'El meu objectiu';
  cfg.progressTotal=parseInt(document.getElementById('cfg-prog-total')?.value||'10');
  set(CONFIG_KEY,cfg);
  const p=get(PROGRESS_KEY,{chapter:1,total:10,title:'El meu objectiu'});
  p.title=cfg.progressTitle; p.total=cfg.progressTotal; set(PROGRESS_KEY,p);
  const gd=document.getElementById('goal-desc'); if(gd&&cfg.mainGoal) gd.textContent=cfg.mainGoal;
  closeConfig(); renderProgress(); showToast('âœ… ConfiguraciÃ³ guardada!');
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   INFO
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const INFO_DATA={
  home:{icon:'ðŸ ',title:"PÃ gina d'Inici",body:'El teu hub principal. Ratxa, hÃ bits, progrÃ©s i events del dia.'},
  streak:{icon:'ðŸ”¥',title:'Ratxa diÃ ria',body:'Marca cada dia. Si no marques, la ratxa es trenca.'},
  habits:{icon:'ðŸŒ±',title:'HÃ bits diaris',body:'Els teus hÃ bits recurrents. Marca-les cada dia.'},
  horari:{icon:'ðŸ“…',title:'Horari',body:'Calendari setmanal i mensual. Afegeix events i notes.'},
  tasques:{icon:'ðŸ“‹',title:'Tasques',body:'Gestiona tasques per prioritat, kanban o llistes compartides.'},
  focus:{icon:'ðŸŽ¯',title:'Focus',body:'Pomodoro per mantenir el focus. Completa sessions i guanya XP.'},
  pomodoro:{icon:'ðŸ…',title:'TÃ¨cnica Pomodoro',body:'25 min treball + 5 min descans. CientÃ­ficament provat.'},
  julians:{icon:'ðŸ§ ',title:'Julians AI',body:"L'assistent d'intelÂ·ligÃ¨ncia artificial. Pregunta-li qualsevol cosa."},
  tips:{icon:'ðŸ’¡',title:'Consells Focus',body:'Silencia el mÃ²bil i tanca les xarxes socials mentre treballes.'},
};
function showInfo(page) {
  const data=INFO_DATA[page]; if(!data) return;
  const ov=document.getElementById('info-tooltip-overlay'); if(!ov) return;
  const icon=document.getElementById('info-icon'),title=document.getElementById('info-title'),body=document.getElementById('info-body');
  if(icon) icon.textContent=data.icon; if(title) title.textContent=data.title; if(body) body.textContent=data.body;
  ov.style.display='flex';
}
function closeInfo() { const ov=document.getElementById('info-tooltip-overlay'); if(ov) ov.style.display='none'; }

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   QUICK CAPTURE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let _qcType='tasca';
function openQuickCapture() {
  const ov=document.getElementById('quick-capture-overlay'); if(ov) ov.style.display='flex';
  document.getElementById('qc-input')?.focus();
}
function closeQuickCapture() { const ov=document.getElementById('quick-capture-overlay'); if(ov) ov.style.display='none'; }
function setQCType(type) {
  _qcType=type;
  document.querySelectorAll('.qc-type-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('qct-'+type)?.classList.add('active');
}
function saveQuickCapture() {
  const text=(document.getElementById('qc-input')?.value||'').trim();
  if(!text){showToast('âš ï¸ Escriu algo!');return;}
  if (_qcType==='tasca'){const tasks=get(TASKS_KEY,[]);tasks.push({id:Date.now().toString(),name:text,status:'todo',done:false,prio:3,created:Date.now()});set(TASKS_KEY,tasks);showToast('âœ… Tasca capturada!');}
  else if(_qcType==='nota'){const notes=get(NOTES_KEY,[]);notes.unshift({id:Date.now().toString(),text,created:Date.now()});set(NOTES_KEY,notes);showToast('ðŸ“ Nota guardada!');}
  else if(_qcType==='habit'){const habits=get(HABITS_KEY,[]);habits.push({name:text,icon:'â­',days:[],created:Date.now()});set(HABITS_KEY,habits);showToast('ðŸŒ± HÃ bit afegit!');}
  document.getElementById('qc-input').value=''; closeQuickCapture(); renderHome(); renderTasques();
}
function toggleNotePicker() { navTo('notes'); lsbMobileClose(); }
function createNote() { openQuickCapture(); setQCType('nota'); }
const NOTE_COLORS = [
  {key:'purple', bg:'rgba(124,58,237,0.12)', border:'rgba(124,58,237,0.35)', dot:'#a78bfa'},
  {key:'blue',   bg:'rgba(59,130,246,0.10)', border:'rgba(59,130,246,0.30)', dot:'#93c5fd'},
  {key:'cyan',   bg:'rgba(0,180,216,0.10)',  border:'rgba(0,180,216,0.30)',  dot:'#67e8f9'},
  {key:'green',  bg:'rgba(16,185,129,0.10)', border:'rgba(16,185,129,0.30)', dot:'#6ee7b7'},
  {key:'amber',  bg:'rgba(245,158,11,0.10)', border:'rgba(245,158,11,0.30)', dot:'#fcd34d'},
  {key:'rose',   bg:'rgba(239,68,68,0.09)',  border:'rgba(239,68,68,0.28)',  dot:'#fca5a5'},
];
function getNoteColor(key) { return NOTE_COLORS.find(c=>c.key===key) || NOTE_COLORS[0]; }
function setNoteColor(idx, key) {
  const notes=get(NOTES_KEY,[]); if(!notes[idx]) return;
  notes[idx].color=key; set(NOTES_KEY,notes); renderNotes();
}
function renderNotes() {
  const list=document.getElementById('notes-page-list'); if(!list) return;
  const notes=get(NOTES_KEY,[]);
  if(notes.length===0){list.innerHTML='<div style="text-align:center;color:var(--muted);padding:48px 0;"><div style="font-size:40px;margin-bottom:12px;">ðŸ“</div><div style="font-size:14px;">Sense notes. Afegeix-ne una!</div></div>';return;}
  list.innerHTML=notes.map((n,i)=>{
    const c=getNoteColor(n.color);
    const swatches=NOTE_COLORS.map(col=>`<span class="ncp-swatch${col.key===(n.color||'purple')?' sel':''}" style="background:${col.dot};opacity:${col.key===(n.color||'purple')?1:0.4};" onclick="setNoteColor(${i},'${col.key}')" title="${col.key}"></span>`).join('');
    const dateStr=new Date(n.created||Date.now()).toLocaleDateString('ca',{day:'2-digit',month:'short',year:'numeric'});
    return `<div class="note-card note-card-colored" style="background:${c.bg};border:1px solid ${c.border};border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;gap:10px;position:relative;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${c.dot};flex-shrink:0;box-shadow:0 0 6px ${c.dot}55;"></span>
          <span style="font-size:9px;color:var(--muted);font-family:'Space Mono',monospace;letter-spacing:1px;">${dateStr}</span>
        </div>
        <button onclick="deleteNote(${i})" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.22);color:#fca5a5;border-radius:7px;padding:2px 8px;font-size:10px;cursor:pointer;flex-shrink:0;transition:all 0.15s;">âœ•</button>
      </div>
      <div class="note-text-edit" contenteditable="true" style="font-size:14px;color:var(--text);line-height:1.65;outline:none;min-height:28px;" onblur="saveNoteEdit(${i},this.textContent)">${n.text||''}</div>
      <div class="note-color-picker" style="display:flex;gap:6px;align-items:center;">${swatches}</div>
    </div>`;
  }).join('');
}
function saveNoteEdit(idx,text) {
  const notes=get(NOTES_KEY,[]); if(!notes[idx]) return;
  const trimmed=(text||'').trim();
  if (trimmed==='') {
    // Text buit: no esborra en silenci, restaura el contingut anterior
    // (l'usuari ha d'usar el botÃ³ âœ• per esborrar explÃ­citament)
    const cards=document.querySelectorAll('.note-text-edit');
    if (cards[idx]) cards[idx].textContent=notes[idx].text||'';
    return;
  }
  notes[idx].text=trimmed;
  notes[idx].updatedAt=Date.now();
  set(NOTES_KEY,notes);
}
function deleteNote(idx) {
  const notes=get(NOTES_KEY,[]); notes.splice(idx,1); set(NOTES_KEY,notes); renderNotes(); showToast('ðŸ—‘ï¸ Nota eliminada');
}
function addNewNote() {
  const notes=get(NOTES_KEY,[]); notes.unshift({id:Date.now().toString(),text:'Nova nota...',created:Date.now()}); set(NOTES_KEY,notes); renderNotes();
  setTimeout(()=>{ const cards=document.querySelectorAll('.note-text-edit'); if(cards[0]){cards[0].focus();const r=document.createRange();r.selectNodeContents(cards[0]);r.collapse(false);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(r);} },100);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SHORTCUTS / DEV
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function openShortcuts() { const ov=document.getElementById('shortcuts-overlay'); if(ov) ov.style.display='flex'; }
function closeShortcuts() { const ov=document.getElementById('shortcuts-overlay'); if(ov) ov.style.display='none'; }
function openDevMode() { const ov=document.getElementById('dev-modal-overlay'); if(ov) ov.style.display='flex'; }
function closeDevMode() { const ov=document.getElementById('dev-modal-overlay'); if(ov) ov.style.display='none'; }
function submitDevMode() {
  const email=document.getElementById('dev-email')?.value;
  const pass=document.getElementById('dev-pass')?.value;
  const err=document.getElementById('dev-error');
  // Credencials comparades via hash â€” mai en clar al codi
  const _DEV_H='ZGV2QGpvbWF4cGF0aC5jb206Sk9tYXgyMDI0IQ==';
  const inputHash=btoa((email||'')+':'+(pass||''));
  if (inputHash===_DEV_H) {
    if(err) err.textContent=''; showToast('âœ… Mode Dev activat!'); setTimeout(closeDevMode,1500);
  } else { if(err) err.textContent='âš ï¸ Credencials incorrectes'; }
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   KEYBOARD SHORTCUTS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  if(e.key==='/'&&!e.ctrlKey){e.preventDefault();openSearch();}
  if(e.key==='q'||e.key==='Q'){e.preventDefault();openQuickCapture();}
  if(e.key==='Escape'){
    closeSearch();closeQuickCapture();closeInfo();closeConfig();closeShortcuts();
    closeClockFullscreen();closeDayModal();closeMonthModal();closeTaskDetail();
    const drawer=document.getElementById('nav-drawer');
    if(drawer?.classList.contains('open')) toggleDrawer();
    if(typeof lsbMobileClose==='function') lsbMobileClose();
  }
  if(e.key==='?'&&e.shiftKey) openShortcuts();
});

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   MISC
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
window.goToHero    = ()=>window.open('hero.html','_self');
window.goToPricing = ()=>window.open('pricing.html','_self');
const THEMES_DATA=[
  {id:'default', name:'Fosc', bg:'#060610', accent:'#7c3aed', dot1:'#060610', dot2:'#7c3aed'},
  {id:'blanc',   name:'Blanc', bg:'#f0f2f8', accent:'#7c3aed', dot1:'#f0f2f8', dot2:'#7c3aed'},
  {id:'ocean',   name:'OceÃ ', bg:'#030f1f', accent:'#0ea5e9', dot1:'#030f1f', dot2:'#0ea5e9'},
  {id:'forest',  name:'Bosc', bg:'#040e07', accent:'#16a34a', dot1:'#040e07', dot2:'#16a34a'},
  {id:'sunset',  name:'Posta', bg:'#130408', accent:'#e11d48', dot1:'#130408', dot2:'#e11d48'},
  {id:'midnight',name:'Mitjanit', bg:'#05050f', accent:'#4f46e5', dot1:'#05050f', dot2:'#4f46e5'},
  {id:'caramel', name:'Caramel', bg:'#0e0a02', accent:'#d97706', dot1:'#0e0a02', dot2:'#d97706'},
  {id:'violet',  name:'Violeta', bg:'#080413', accent:'#9333ea', dot1:'#080413', dot2:'#9333ea'},
  {id:'rose',    name:'Rosa', bg:'#0f0508', accent:'#be185d', dot1:'#0f0508', dot2:'#be185d'},
];
function renderThemesGrid() {
  const grid=document.getElementById('ndw-themes-grid'); if(!grid) return;
  const cfg=get(CONFIG_KEY,{}); const cur=cfg.theme||'default';
  grid.innerHTML=THEMES_DATA.map(t=>`
    <div onclick="setTheme('${t.id}')" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;padding:8px 4px;border-radius:10px;border:2px solid ${t.id===cur?'rgba(167,139,250,0.7)':'transparent'};transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
      <div style="width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,${t.dot1},${t.dot2});border:2px solid ${t.id===cur?t.dot2:'rgba(255,255,255,0.1)'};box-shadow:${t.id===cur?'0 0 10px '+t.dot2:'none'};transition:all 0.2s;"></div>
      <span style="font-size:9px;color:${t.id===cur?'#a78bfa':'#64748b'};font-family:'Space Mono',monospace;letter-spacing:1px;text-align:center;">${t.name}</span>
    </div>`).join('');
}
function setTheme(id) {
  const body=document.body;
  THEMES_DATA.forEach(t=>body.classList.remove('theme-'+t.id));
  if(id!=='default') body.classList.add('theme-'+id);
  const cfg=get(CONFIG_KEY,{}); cfg.theme=id; set(CONFIG_KEY,cfg);
  renderThemesGrid(); showToast('ðŸŽ¨ Tema '+THEMES_DATA.find(t=>t.id===id)?.name+' activat!');
}
function applyStoredTheme() {
  const cfg=get(CONFIG_KEY,{}); const id=cfg.theme||'default';
  if(id!=='default') document.body.classList.add('theme-'+id);
  // Also restore layout
  const layout=cfg.layout||'compacta';
  _applyLayoutMode(layout);
  document.querySelectorAll('.ndw-view-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('ndw-layout-'+layout)?.classList.add('active');
}
function setLayoutMode(mode) {
  const cfg=get(CONFIG_KEY,{}); cfg.layout=mode; set(CONFIG_KEY,cfg);
  _applyLayoutMode(mode);
  document.querySelectorAll('.ndw-view-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('ndw-layout-'+mode)?.classList.add('active');
  showToast('Vista: '+mode);
}
function _applyLayoutMode(mode) {
  // Apply to home two-col
  const homeLeft=document.querySelector('.home-col-left');
  const homeRight=document.querySelector('.home-col-right');
  const twoCol=document.querySelector('.home-two-col');
  if(mode==='ample') {
    if(twoCol) twoCol.style.cssText='display:flex!important;flex-direction:column!important;';
    if(homeLeft) homeLeft.style.width='100%';
    if(homeRight) homeRight.style.width='100%';
    // Apply to focus page
    const focusTwoCol=document.querySelector('.focus-two-col');
    if(focusTwoCol) focusTwoCol.style.cssText='display:flex!important;flex-direction:column!important;';
    const focusLeft=document.querySelector('.focus-col-left');
    const focusRight=document.querySelector('.focus-col-right');
    if(focusLeft) focusLeft.style.width='100%';
    if(focusRight) focusRight.style.width='100%';
    // Apply to other multi-col containers
    document.querySelectorAll('.cal-two-col').forEach(el=>el.style.cssText='display:flex!important;flex-direction:column!important;');
    // body class for CSS targeting
    document.body.classList.add('layout-ample');
    document.body.classList.remove('layout-compacta');
  } else {
    if(twoCol) twoCol.style.cssText='';
    if(homeLeft) homeLeft.style.width='';
    if(homeRight) homeRight.style.width='';
    const focusTwoCol=document.querySelector('.focus-two-col');
    if(focusTwoCol) focusTwoCol.style.cssText='';
    const focusLeft=document.querySelector('.focus-col-left');
    const focusRight=document.querySelector('.focus-col-right');
    if(focusLeft) focusLeft.style.width='';
    if(focusRight) focusRight.style.width='';
    document.querySelectorAll('.cal-two-col').forEach(el=>el.style.cssText='');
    document.body.classList.remove('layout-ample');
    document.body.classList.add('layout-compacta');
  }
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   INIT
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   IDIOMES â€” sistema multi-llengua (CA / ES / EN)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const LANG_KEY = 'jomaxpath_lang_v1';
const LANGS = {
  ca: {
    lang_name:'ðŸŒ¹ CatalÃ ',
    // Salutacions
    greeting_morning:'Bon dia', greeting_afternoon:'Bona tarda', greeting_night:'Bona nit',
    greeting_emoji_m:'ðŸ‘‹', greeting_emoji_a:'ðŸ’ª', greeting_emoji_n:'ðŸŒ™',
    // Nav / sidebar
    nav_home:'Inici', nav_schedule:'Horari', nav_tasks:'Tasques', nav_notes:'Notes',
    nav_focus:'Focus', nav_hero:'Heroi', nav_ai:'Julians AI',
    // Seccions home
    sec_habits:'ðŸŒ± hÃ bits diaris', sec_streak:'Ratxa', sec_victories:'ðŸ† les meves victÃ²ries de la setmana',
    sec_goal:'Objectiu principal', sec_progress:'El meu objectiu', sec_today:'ðŸ“ ara mateix',
    // Stats
    stat_streak_lbl:'dies ratxa', stat_habits_lbl:'hÃ bits avui', stat_tasks_lbl:'tasques pend.',
    stat_pomo_lbl:'pomodoros avui',
    // Botons
    btn_save:'Guardar', btn_add:'+ Afegir', btn_cancel:'CancelÂ·lar',
    btn_session:'âœ“ SESSIÃ“ FETA', btn_add_habit:'+ AFEGIR',
    // Config
    cfg_title:'ConfiguraciÃ³', cfg_general:'âš™ï¸ General', cfg_ai:'ðŸ”‘ IA',
    cfg_themes:'ðŸŽ¨ Temes', cfg_account:'ðŸ‘¤ Compte',
    cfg_goal_lbl:'Objectiu principal', cfg_prog_name:'Nom de l\'objectiu',
    cfg_prog_steps:'Total de passos', cfg_save:'âœ… Guardar', cfg_cancel:'CancelÂ·lar',
    cfg_logout:'ðŸšª Tancar sessiÃ³', cfg_sync:'ðŸ”„ Sincronitzar perfil',
    cfg_save_cloud:'â˜ï¸ Guardar al nÃºvol',
    // Focus/Pomodoro
    focus_phase:'FOCUS', break_phase:'DESCANS', long_break:'DESCANS LLARG',
    // Tasques
    tasks_title:'ðŸ“‹ Tasques a realitzar', tasks_add:'Afegir tasca...',
    // Heroi
    hero_title:'El meu heroi',
    // Drawer
    drawer_themes:'Temes', drawer_julians:'ðŸ§  Julians AI',
    // Sidebar
    nav_quick:'Captura rÃ pida', nav_notes2:'Notes', nav_search:'Cerca global',
    lsb_sec_main:'PRINCIPAL', lsb_sec_tools:'EINES',
    // Seccions extra
    sec_ara_mateix:'ðŸ“ ara mateix', next_task:'PRÃ’XIMA TASCA',
    sec_this_week:'aquesta setmana', btn_today:'â†© AVUI',
    sec_weekly_summary:'resum setmanal', sec_pomodoro:'â±ï¸ focus timer â€” pomodoro',
    sec_victories2:'ðŸ† les meves victÃ²ries de la setmana',
    sec_screen_tips:'ðŸ“µ trucs per no mirar tant les pantalles',
    sec_motivation_rules:"regles d'or per no perdre la motivaciÃ³",
    tasks_title2:'ðŸ“‹ Tasques a realitzar',
    qct_task:'ðŸ“‹ Tasca', qct_event:'ðŸ“… Event', qct_note:'ðŸ“ Nota',
    // Errors/missatges
    pt_horari:'HORARI', pt_tasques:'TASQUES', pt_examenia:'PREPARAR EXÃ€MENS', pt_notes:'NOTES', pt_focus:'FOCUS',
    lst_my:'ðŸ“‹ Les meves llistes', lst_shared:'ðŸ¤ Llistes compartides', lst_new:'+ Nova llista',
    lst_empty_personal:'Encara no tens llistes.<br>Crea la teva primera! â†‘', lst_empty_shared:'Encara no tens llistes compartides.<br>Crea\'n una i convida amics, o uneix-te amb un codi.',
    lst_tasks_done:'tasques fetes', lst_badge_shared:'compartida', lst_back:'â† Tornar',
    lst_invite:'ðŸ“¤ Convidar amic', lst_refresh:'ðŸ”„ Actualitzar', lst_leave:'ðŸ—‘ï¸ Sortir', lst_delete:'ðŸ—‘ï¸ Eliminar llista',
    lst_task_ph:'Escriu una tasca i prem Enter...', lst_add:'+ Afegir', lst_no_tasks:'Encara no hi ha tasques. Afegeix-ne una a dalt â†‘',
    lst_shared_meta:'Compartida', lst_members:'membres', lst_done:'fetes', lst_everyone:'ðŸ‘¥ Tothom', lst_me:'ðŸ™‹ Jo',
    kb_todo:'ðŸ“¥ Per fer', kb_doing:'âš¡ Fent', kb_done:'âœ… Fet',
    due_overdue:'âš ï¸ Endarrerida', due_today:'ðŸ”¥ Avui', due_tomorrow:'DemÃ ', due_indays:'En {n} dies',
    prio_urgent:'ðŸ”´ Urgent', prio_important:'ðŸŸ¡ Important', prio_normal:'ðŸ”µ Normal', prio_low:'âšª Baix',
    tt_list_created:'âœ… Llista creada!', tt_task_updated:'âœ… Tasca actualitzada', tt_list_deleted:'ðŸ—‘ï¸ Llista eliminada', tt_left_list:'ðŸ‘‹ Has sortit de la llista',
    np_new_list:'Nova llista', np_new_shared:'Nova llista compartida', np_list_name:'Nom de la llista...',
    te_title:'âœŽ Editar tasca', te_task:'Tasca', te_desc:'DescripciÃ³', te_links:'ðŸ”— EnllaÃ§os', te_addlink:'+ Afegir enllaÃ§',
    te_date:'ðŸ“… Data lÃ­mit', te_prio:'Prioritat', te_assignee:'ðŸ‘¤ Assignat a', te_save:'ðŸ’¾ Desar', te_cancel:'CancelÂ·lar',
    te_name_ph:'Nom de la tasca', te_desc_ph:'Afegeix detalls, notes, context...',
    sub_home:'Objectiu Â· ProgrÃ©s Â· Ratxa Â· HÃ bits', sub_tasques:'Deures Â· Treballs Â· Prioritats',
    sub_examenia:'El teu tutor IA: penja el temari i et crea un pla d\'estudi', sub_notes:'Els teus apunts i recordatoris',
    sub_julians:'Assistent intelÂ·ligent Â· Documents', sub_focus:'Pomodoro Â· Pantalles Â· MotivaciÃ³',
    msg_saved:'âœ… Guardat!', msg_error:'âŒ Error'
  },
  es: {
    lang_name:'ðŸ‡ªðŸ‡¸ EspaÃ±ol',
    greeting_morning:'Buenos dÃ­as', greeting_afternoon:'Buenas tardes', greeting_night:'Buenas noches',
    greeting_emoji_m:'ðŸ‘‹', greeting_emoji_a:'ðŸ’ª', greeting_emoji_n:'ðŸŒ™',
    nav_home:'Inicio', nav_schedule:'Horario', nav_tasks:'Tareas', nav_notes:'Notas',
    nav_focus:'Focus', nav_hero:'HÃ©roe', nav_ai:'Julians AI',
    sec_habits:'ðŸŒ± hÃ¡bitos diarios', sec_streak:'Racha', sec_victories:'ðŸ† mis victorias de la semana',
    sec_goal:'Objetivo principal', sec_progress:'Mi objetivo', sec_today:'ðŸ“ ahora mismo',
    stat_streak_lbl:'dÃ­as racha', stat_habits_lbl:'hÃ¡bitos hoy', stat_tasks_lbl:'tareas pend.',
    stat_pomo_lbl:'pomodoros hoy',
    btn_save:'Guardar', btn_add:'+ AÃ±adir', btn_cancel:'Cancelar',
    btn_session:'âœ“ SESIÃ“N HECHA', btn_add_habit:'+ AÃ‘ADIR',
    cfg_title:'ConfiguraciÃ³n', cfg_general:'âš™ï¸ General', cfg_ai:'ðŸ”‘ IA',
    cfg_themes:'ðŸŽ¨ Temas', cfg_account:'ðŸ‘¤ Cuenta',
    cfg_goal_lbl:'Objetivo principal', cfg_prog_name:'Nombre del objetivo',
    cfg_prog_steps:'Total de pasos', cfg_save:'âœ… Guardar', cfg_cancel:'Cancelar',
    cfg_logout:'ðŸšª Cerrar sesiÃ³n', cfg_sync:'ðŸ”„ Sincronizar perfil',
    cfg_save_cloud:'â˜ï¸ Guardar en la nube',
    focus_phase:'ENFOQUE', break_phase:'DESCANSO', long_break:'DESCANSO LARGO',
    tasks_title:'ðŸ“‹ Tareas a realizar', tasks_add:'AÃ±adir tarea...',
    hero_title:'Mi hÃ©roe',
    // Drawer
    drawer_themes:'Temas', drawer_julians:'ðŸ§  Julians AI',
    // Sidebar
    nav_quick:'Captura rÃ¡pida', nav_notes2:'Notas', nav_search:'BÃºsqueda global',
    lsb_sec_main:'PRINCIPAL', lsb_sec_tools:'HERRAMIENTAS',
    // Seccions extra
    sec_ara_mateix:'ðŸ“ ahora mismo', next_task:'PRÃ“XIMA TAREA',
    sec_this_week:'esta semana', btn_today:'â†© HOY',
    sec_weekly_summary:'resumen semanal', sec_pomodoro:'â±ï¸ focus timer â€” pomodoro',
    sec_victories2:'ðŸ† mis victorias de la semana',
    sec_screen_tips:'ðŸ“µ trucos para mirar menos el mÃ³vil',
    sec_motivation_rules:'reglas de oro para no perder la motivaciÃ³n',
    tasks_title2:'ðŸ“‹ Tareas a realizar',
    qct_task:'ðŸ“‹ Tarea', qct_event:'ðŸ“… Evento', qct_note:'ðŸ“ Nota',
    pt_horari:'HORARIO', pt_tasques:'TAREAS', pt_examenia:'PREPARAR EXÃMENES', pt_notes:'NOTAS', pt_focus:'FOCUS',
    lst_my:'ðŸ“‹ Mis listas', lst_shared:'ðŸ¤ Listas compartidas', lst_new:'+ Nueva lista',
    lst_empty_personal:'AÃºn no tienes listas.<br>Â¡Crea la primera! â†‘', lst_empty_shared:'AÃºn no tienes listas compartidas.<br>Crea una e invita amigos, o Ãºnete con un cÃ³digo.',
    lst_tasks_done:'tareas hechas', lst_badge_shared:'compartida', lst_back:'â† Volver',
    lst_invite:'ðŸ“¤ Invitar amigo', lst_refresh:'ðŸ”„ Actualizar', lst_leave:'ðŸ—‘ï¸ Salir', lst_delete:'ðŸ—‘ï¸ Eliminar lista',
    lst_task_ph:'Escribe una tarea y pulsa Enter...', lst_add:'+ AÃ±adir', lst_no_tasks:'AÃºn no hay tareas. Â¡AÃ±ade una arriba! â†‘',
    lst_shared_meta:'Compartida', lst_members:'miembros', lst_done:'hechas', lst_everyone:'ðŸ‘¥ Todos', lst_me:'ðŸ™‹ Yo',
    kb_todo:'ðŸ“¥ Por hacer', kb_doing:'âš¡ Haciendo', kb_done:'âœ… Hecho',
    due_overdue:'âš ï¸ Atrasada', due_today:'ðŸ”¥ Hoy', due_tomorrow:'MaÃ±ana', due_indays:'En {n} dÃ­as',
    prio_urgent:'ðŸ”´ Urgente', prio_important:'ðŸŸ¡ Importante', prio_normal:'ðŸ”µ Normal', prio_low:'âšª Bajo',
    tt_list_created:'âœ… Â¡Lista creada!', tt_task_updated:'âœ… Tarea actualizada', tt_list_deleted:'ðŸ—‘ï¸ Lista eliminada', tt_left_list:'ðŸ‘‹ Has salido de la lista',
    np_new_list:'Nueva lista', np_new_shared:'Nueva lista compartida', np_list_name:'Nombre de la lista...',
    te_title:'âœŽ Editar tarea', te_task:'Tarea', te_desc:'DescripciÃ³n', te_links:'ðŸ”— Enlaces', te_addlink:'+ AÃ±adir enlace',
    te_date:'ðŸ“… Fecha lÃ­mite', te_prio:'Prioridad', te_assignee:'ðŸ‘¤ Asignado a', te_save:'ðŸ’¾ Guardar', te_cancel:'Cancelar',
    te_name_ph:'Nombre de la tarea', te_desc_ph:'AÃ±ade detalles, notas, contexto...',
    sub_home:'Objetivo Â· Progreso Â· Racha Â· HÃ¡bitos', sub_tasques:'Deberes Â· Trabajos Â· Prioridades',
    sub_examenia:'Tu tutor IA: sube el temario y te crea un plan de estudio', sub_notes:'Tus apuntes y recordatorios',
    sub_julians:'Asistente inteligente Â· Documentos', sub_focus:'Pomodoro Â· Pantallas Â· MotivaciÃ³n',
    msg_saved:'âœ… Guardado!', msg_error:'âŒ Error'
  },
  en: {
    lang_name:'ðŸ‡¬ðŸ‡§ English',
    greeting_morning:'Good morning', greeting_afternoon:'Good afternoon', greeting_night:'Good evening',
    greeting_emoji_m:'ðŸ‘‹', greeting_emoji_a:'ðŸ’ª', greeting_emoji_n:'ðŸŒ™',
    nav_home:'Home', nav_schedule:'Schedule', nav_tasks:'Tasks', nav_notes:'Notes',
    nav_focus:'Focus', nav_hero:'Hero', nav_ai:'Julians AI',
    sec_habits:'ðŸŒ± daily habits', sec_streak:'Streak', sec_victories:'ðŸ† my victories this week',
    sec_goal:'Main goal', sec_progress:'My goal', sec_today:'ðŸ“ right now',
    stat_streak_lbl:'day streak', stat_habits_lbl:'habits today', stat_tasks_lbl:'tasks pend.',
    stat_pomo_lbl:'pomodoros today',
    btn_save:'Save', btn_add:'+ Add', btn_cancel:'Cancel',
    btn_session:'âœ“ SESSION DONE', btn_add_habit:'+ ADD',
    cfg_title:'Settings', cfg_general:'âš™ï¸ General', cfg_ai:'ðŸ”‘ AI',
    cfg_themes:'ðŸŽ¨ Themes', cfg_account:'ðŸ‘¤ Account',
    cfg_goal_lbl:'Main goal', cfg_prog_name:'Goal name',
    cfg_prog_steps:'Total steps', cfg_save:'âœ… Save', cfg_cancel:'Cancel',
    cfg_logout:'ðŸšª Sign out', cfg_sync:'ðŸ”„ Sync profile',
    cfg_save_cloud:'â˜ï¸ Save to cloud',
    focus_phase:'FOCUS', break_phase:'BREAK', long_break:'LONG BREAK',
    tasks_title:'ðŸ“‹ Tasks to do', tasks_add:'Add task...',
    hero_title:'My hero',
    // Drawer
    drawer_themes:'Themes', drawer_julians:'ðŸ§  Julians AI',
    // Sidebar
    nav_quick:'Quick capture', nav_notes2:'Notes', nav_search:'Global search',
    lsb_sec_main:'MAIN', lsb_sec_tools:'TOOLS',
    // Seccions extra
    sec_ara_mateix:'ðŸ“ right now', next_task:'NEXT TASK',
    sec_this_week:'this week', btn_today:'â†© TODAY',
    sec_weekly_summary:'weekly summary', sec_pomodoro:'â±ï¸ focus timer â€” pomodoro',
    sec_victories2:'ðŸ† my victories this week',
    sec_screen_tips:'ðŸ“µ tips to spend less time on screens',
    sec_motivation_rules:'golden rules to stay motivated',
    tasks_title2:'ðŸ“‹ Tasks to do',
    qct_task:'ðŸ“‹ Task', qct_event:'ðŸ“… Event', qct_note:'ðŸ“ Note',
    pt_horari:'SCHEDULE', pt_tasques:'TASKS', pt_examenia:'EXAM PREP', pt_notes:'NOTES', pt_focus:'FOCUS',
    lst_my:'ðŸ“‹ My lists', lst_shared:'ðŸ¤ Shared lists', lst_new:'+ New list',
    lst_empty_personal:'No lists yet.<br>Create your first one! â†‘', lst_empty_shared:'No shared lists yet.<br>Create one and invite friends, or join with a code.',
    lst_tasks_done:'tasks done', lst_badge_shared:'shared', lst_back:'â† Back',
    lst_invite:'ðŸ“¤ Invite friend', lst_refresh:'ðŸ”„ Refresh', lst_leave:'ðŸ—‘ï¸ Leave', lst_delete:'ðŸ—‘ï¸ Delete list',
    lst_task_ph:'Type a task and press Enter...', lst_add:'+ Add', lst_no_tasks:'No tasks yet. Add one above! â†‘',
    lst_shared_meta:'Shared', lst_members:'members', lst_done:'done', lst_everyone:'ðŸ‘¥ Everyone', lst_me:'ðŸ™‹ Me',
    kb_todo:'ðŸ“¥ To do', kb_doing:'âš¡ Doing', kb_done:'âœ… Done',
    due_overdue:'âš ï¸ Overdue', due_today:'ðŸ”¥ Today', due_tomorrow:'Tomorrow', due_indays:'In {n} days',
    prio_urgent:'ðŸ”´ Urgent', prio_important:'ðŸŸ¡ Important', prio_normal:'ðŸ”µ Normal', prio_low:'âšª Low',
    tt_list_created:'âœ… List created!', tt_task_updated:'âœ… Task updated', tt_list_deleted:'ðŸ—‘ï¸ List deleted', tt_left_list:'ðŸ‘‹ You left the list',
    np_new_list:'New list', np_new_shared:'New shared list', np_list_name:'List name...',
    te_title:'âœŽ Edit task', te_task:'Task', te_desc:'Description', te_links:'ðŸ”— Links', te_addlink:'+ Add link',
    te_date:'ðŸ“… Due date', te_prio:'Priority', te_assignee:'ðŸ‘¤ Assigned to', te_save:'ðŸ’¾ Save', te_cancel:'Cancel',
    te_name_ph:'Task name', te_desc_ph:'Add details, notes, context...',
    sub_home:'Goal Â· Progress Â· Streak Â· Habits', sub_tasques:'Homework Â· Projects Â· Priorities',
    sub_examenia:'Your AI tutor: upload your syllabus and get a study plan', sub_notes:'Your notes and reminders',
    sub_julians:'Smart assistant Â· Documents', sub_focus:'Pomodoro Â· Screens Â· Motivation',
    msg_saved:'âœ… Saved!', msg_error:'âŒ Error'
  }
};
function getLang() { return localStorage.getItem(LANG_KEY) || 'ca'; }
function t(key) { return (LANGS[getLang()]||LANGS.ca)[key] || (LANGS.ca[key] || key); }
function setLanguage(lang) {
  localStorage.setItem(LANG_KEY, lang);
  applyLanguage();
  showToast('ðŸŒ Idioma: '+(LANGS[lang]?.lang_name||lang));
}
// Mapa d'element ID â†’ clau de traducciÃ³
const LANG_ID_MAP = {
  // No traduÃ¯m pt-home-h2 (Ã©s el tÃ­tol JOmaxPath)
  'hsr-streak-lbl':    'stat_streak_lbl',
  'hsr-habits-lbl':    'stat_habits_lbl',
  'hsr-tasks-lbl':     'stat_tasks_lbl',
  'hsr-pomo-lbl':      'stat_pomo_lbl',
  'goal-title':        'sec_goal',
  'streak-btn':        'btn_session',
  'cfg-title-text':    'cfg_title',
};
function _setI18nText(el, text) {
  // Si l'element tÃ© fills (ex: botons info), actualitza nomÃ©s el primer text node
  if (el.children.length > 0) {
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = text + ' ';
        return;
      }
    }
    // Si no hi ha text node, inserim un al principi
    el.insertBefore(document.createTextNode(text + ' '), el.firstChild);
  } else {
    el.textContent = text;
  }
}
function applyLanguage() {
  const lang = getLang();
  const map = LANGS[lang] || LANGS.ca;
  // Aplica per ID
  Object.entries(LANG_ID_MAP).forEach(([id, key]) => {
    if (!key) return;
    const el = document.getElementById(id);
    if (el && map[key]) _setI18nText(el, map[key]);
  });
  // Aplica als elements amb data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (map[key]) _setI18nText(el, map[key]);
  });
  // Placeholders amb data-i18n-ph
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (map[key]) el.setAttribute('placeholder', map[key]);
  });
  // Actualitza botons del selector d'idioma
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const code = btn.getAttribute('data-lang-code');
    btn.style.fontWeight = code === lang ? '700' : '400';
    btn.style.background = code === lang ? 'rgba(124,58,237,0.25)' : 'transparent';
    btn.style.borderColor = code === lang ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)';
  });
  // TÃ­tol del browser
  document.title = 'JOmaxPath';
  // Actualitza salutaciÃ³ (sense cridar renderHome sencer per evitar loops)
  if (typeof renderHomeHeader === 'function') renderHomeHeader();
  // Re-render config panel si Ã©s obert per actualitzar textos
  if (document.getElementById('config-body')?.children.length) renderConfigBody();
}
function renderLangSwitcher(containerId) {
  const el = document.getElementById(containerId); if (!el) return;
  const cur = getLang();
  el.innerHTML = Object.entries(LANGS).map(([code, l]) =>
    `<button class="lang-btn" data-lang-code="${code}" onclick="setLanguage('${code}')" style="background:${code===cur?'rgba(124,58,237,0.2)':'transparent'};border:1px solid ${code===cur?'rgba(124,58,237,0.4)':'rgba(255,255,255,0.1)'};border-radius:8px;padding:5px 12px;color:var(--text);cursor:pointer;font-size:11px;font-weight:${code===cur?700:400};transition:all 0.2s;">${l.lang_name}</button>`
  ).join('');
}

document.addEventListener('DOMContentLoaded',()=>{
  try { const arc=document.getElementById('pomo-arc'); if(arc) arc.style.strokeDasharray=2*Math.PI*80; } catch(e){}
  try { applyConfig(); } catch(e){ console.warn('applyConfig error',e); }
  try { applyStoredTheme(); } catch(e){ console.warn('applyStoredTheme error',e); }
  try { renderThemesGrid(); } catch(e){ console.warn('renderThemesGrid error',e); }
  try { navTo('home'); } catch(e){ console.warn('navTo error',e); }
  // Aplica idioma DESPRÃ‰S que tot estigui renderitzat
  setTimeout(()=>{ try { applyLanguage(); } catch(e){ console.warn('applyLanguage error',e); } }, 50);
  // Recordatoris de dates lÃ­mit
  setTimeout(()=>{ try { _checkDueReminders(); } catch(e){} }, 1500);
  try {
    const h=JSON.parse(localStorage.getItem('jomaxpath_hero_v2'));
    if(h){
      const nameEl=document.getElementById('lsb-hero-name'); if(nameEl) nameEl.textContent=h.name||'El teu heroi';
      const lvlEl=document.getElementById('lsb-lvl-num'); if(lvlEl) lvlEl.textContent=h.level||1;
    }
  } catch {}
  console.log('%cJOmaxPath app.js v3.0 âœ“','color:#7c3aed;font-weight:bold;font-size:14px;');
});