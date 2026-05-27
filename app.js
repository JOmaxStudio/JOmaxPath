/* ═══════════════════════════════════════════════════════════════
   JOMAXPATH — app.js
   Funcions principals: navegació, dades, UI
   Versió reconstruïda per compatibilitat total amb index.html
═══════════════════════════════════════════════════════════════ */
'use strict';

/* ─────────────────────────────────────────
   CONSTANTS / CLAUS
───────────────────────────────────────── */
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
const TIMED_KEY    = 'jomaxpath_timed_v1';
const NOTES_KEY    = 'jomaxpath_notes_v1';
const MATCH_KEY    = 'jomaxpath_matches_v1';

/* ─────────────────────────────────────────
   UTILITATS
───────────────────────────────────────── */
function get(key, def=[]) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
function set(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function pad2(n) { return String(n).padStart(2,'0'); }

let _toastTimer;
function showToast(msg, duration=3200) {
  let t = document.getElementById('toast-msg');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast-msg';
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:rgba(20,20,40,0.98);border:1px solid rgba(124,58,237,0.4);color:#e2e8f0;padding:10px 20px;border-radius:12px;font-family:Space Mono,monospace;font-size:12px;z-index:99999;opacity:0;transition:all 0.3s;pointer-events:none;white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis;';
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

/* ─────────────────────────────────────────
   NAVEGACIÓ
───────────────────────────────────────── */
let _currentPage = 'home';

function navTo(page) {
  document.querySelectorAll('.app-page').forEach(p => p.classList.remove('page-active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('page-active');
  _currentPage = page;

  document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
  const bnavMap = {home:0, horari:1, tasques:2, julians:3, focus:4};
  const bnavItems = document.querySelectorAll('.bnav-item');
  if (bnavMap[page] !== undefined && bnavItems[bnavMap[page]])
    bnavItems[bnavMap[page]].classList.add('active');

  if (typeof lsbSetActive === 'function') lsbSetActive(page);

  if (page === 'home')    renderHome();
  if (page === 'horari')  renderHorari();
  if (page === 'tasques') renderTasques();
  if (page === 'focus')   renderFocus();
  if (page === 'julians') initJulians();

  window.scrollTo({top: 0, behavior: 'smooth'});
}

/* ─────────────────────────────────────────
   RELLOTGE
───────────────────────────────────────── */
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
    const mesos=['gener','febrer','març','abril','maig','juny','juliol','agost','setembre','octubre','novembre','desembre'];
    fsd.textContent = `${dies[now.getDay()]}, ${now.getDate()} de ${mesos[now.getMonth()]} de ${now.getFullYear()}`;
  }
}

function toggleClockSeconds() {
  _clockShowSeconds = !_clockShowSeconds;
  const btn = document.getElementById('fs-toggle-seconds');
  if (btn) btn.textContent = _clockShowSeconds ? '⏱ Amagar segons' : '⏱ Mostrar segons';
  _tickClock();
}

function openClockFullscreen() {
  const el = document.getElementById('clock-fullscreen');
  if (el) { el.style.display = 'flex'; _tickClock(); }
}

function closeClockFullscreen() {
  const el = document.getElementById('clock-fullscreen');
  if (el) el.style.display = 'none';
}

setInterval(_tickClock, 1000);
_tickClock();

/* ─────────────────────────────────────────
   HAMBURGER / DRAWER
───────────────────────────────────────── */
function toggleDrawer() {
  const drawer  = document.getElementById('nav-drawer');
  const overlay = document.getElementById('nav-overlay');
  const btn     = document.getElementById('nav-hamburger');
  if (!drawer) return;
  const open = drawer.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open', open);
  if (btn)     btn.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

/* ─────────────────────────────────────────
   AUTH
───────────────────────────────────────── */
let _supabase = null;
const SB_URL  = 'https://ngyijuqcnelrzujazqom.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5neWlqdXFjbmVscnp1amF6cW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3OTk0MDgsImV4cCI6MjA1OTM3NTQwOH0.pQa8K5wXE9M7E8pu_D9s58hf1m4Wz5aNKbKNFMbQiSk';

try {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    _supabase = supabase.createClient(SB_URL, SB_ANON);
  }
} catch {}

function showAuthOverlay() {
  const ov = document.getElementById('auth-overlay');
  if (ov) ov.style.display = 'flex';
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('auth-login-form');
  const regForm   = document.getElementById('auth-register-form');
  const tLogin    = document.getElementById('tab-login');
  const tReg      = document.getElementById('tab-register');
  if (loginForm) loginForm.style.display = tab === 'login' ? 'block' : 'none';
  if (regForm)   regForm.style.display   = tab === 'register' ? 'block' : 'none';
  if (tLogin) tLogin.classList.toggle('active', tab === 'login');
  if (tReg)   tReg.classList.toggle('active', tab === 'register');
}

function authSkip() {
  const ov = document.getElementById('auth-overlay');
  if (ov) ov.style.display = 'none';
  showToast('Treballant en mode local 📱');
  renderHome();
}

async function authLogin() {
  const email = (document.getElementById('auth-email')?.value || '').trim();
  const pass  = document.getElementById('auth-password')?.value || '';
  const msg   = document.getElementById('auth-msg');
  if (!email || !pass) { if (msg) msg.textContent = '⚠️ Omple tots els camps'; return; }
  if (_supabase) {
    if (msg) msg.textContent = 'Entrant...';
    const { error } = await _supabase.auth.signInWithPassword({ email, password: pass });
    if (error) { if (msg) msg.textContent = '❌ ' + error.message; return; }
  }
  const ov = document.getElementById('auth-overlay');
  if (ov) ov.style.display = 'none';
  showToast('✅ Sessió iniciada!');
  renderHome();
}

async function authRegister() {
  const email = (document.getElementById('auth-reg-email')?.value || '').trim();
  const pass  = document.getElementById('auth-reg-password')?.value || '';
  const msg   = document.getElementById('auth-msg');
  if (!email || !pass) { if (msg) msg.textContent = '⚠️ Omple tots els camps'; return; }
  if (pass.length < 6) { if (msg) msg.textContent = '⚠️ Contrasenya mínima 6 caràcters'; return; }
  if (_supabase) {
    if (msg) msg.textContent = 'Registrant...';
    const { error } = await _supabase.auth.signUp({ email, password: pass });
    if (error) { if (msg) msg.textContent = '❌ ' + error.message; return; }
  }
  const ov = document.getElementById('auth-overlay');
  if (ov) ov.style.display = 'none';
  showToast('✅ Compte creat! Benvingut a JOmaxPath.');
  renderHome();
}

function authShowMenu() { showAuthOverlay(); }

(async function() {
  if (!_supabase) { authSkip(); return; }
  const { data: { session } } = await _supabase.auth.getSession();
  if (session) { authSkip(); }
  else { showAuthOverlay(); }
})();

/* ─────────────────────────────────────────
   HOME PAGE
───────────────────────────────────────── */
const QUOTES = [
  {t:'No t\'esperis a tenir ganes. Fes-ho i les ganes vindran.', a:'James Clear'},
  {t:'Cada dia que passes sense fer res et porta un dia més lluny dels teus somnis.', a:'JOmax'},
  {t:'L\'únic que et separa del que vols és l\'acció.', a:'Tony Robbins'},
  {t:'No és el que ets, és el que fas quan importa.', a:'Aragorn'},
  {t:'L\'èxit no és un accident. És treball dur, perseverança i aprenentatge.', a:'Pelé'},
  {t:'No compares el teu capítol 1 amb el capítol 20 d\'algú altre.', a:'JOmax'},
  {t:'Disciplines petites portaran victòries grans.', a:'JOmax'},
  {t:'La millor venjança és un èxit massiu.', a:'Frank Sinatra'},
  {t:'Fes les coses difícils ara, que la vida serà fàcil. Fes les fàcils ara, que serà difícil.', a:'Les Brown'},
  {t:'No perdis el temps amb qui no creu en tu. Usa\'l per demostrar-los que s\'equivocaven.', a:'JOmax'},
];

let _quoteIdx = Math.floor(Math.random() * QUOTES.length);

function refreshQuote() {
  _quoteIdx = (_quoteIdx + 1) % QUOTES.length;
  const q = QUOTES[_quoteIdx];
  const el = document.getElementById('dq-text');
  const au = document.getElementById('dq-author');
  if (el) el.textContent = q.t;
  if (au) au.textContent = '— ' + q.a;
}

function renderHome() {
  refreshQuote();
  renderStreakWidget();
  renderHabits();
  renderProgress();
  renderTodayPanel();
}

/* ── Streak widget ── */
function renderStreakWidget() {
  const data = get(STREAK_KEY, {count:0, best:0, last:'', label:'dies consecutius', days:[]});
  const numEl = document.getElementById('streak-num');
  const lblEl = document.getElementById('streak-label-txt');
  const bestEl= document.getElementById('streak-best');
  const daysEl= document.getElementById('streak-days');
  const btnEl = document.getElementById('streak-btn');
  if (numEl)  numEl.textContent  = data.count || 0;
  if (lblEl)  lblEl.textContent  = data.label || 'dies consecutius';
  if (bestEl) bestEl.textContent = 'Millor ratxa: ' + (data.best || 0);
  const today = new Date().toDateString();
  const doneToday = data.last === today;
  if (btnEl) {
    btnEl.textContent  = doneToday ? '✓ JA FETA AVUI' : '✓ SESSIÓ FETA';
    btnEl.style.opacity= doneToday ? '0.5' : '1';
  }
  if (daysEl) {
    const today_date = new Date();
    let html = '';
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today_date); d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      const done = (data.days || []).includes(ds);
      html += `<div class="streak-day-dot ${done ? 'done' : ''}"></div>`;
    }
    daysEl.innerHTML = html;
  }
}

function markStreakToday() {
  const data = get(STREAK_KEY, {count:0, best:0, last:'', label:'dies consecutius', days:[]});
  const today = new Date().toDateString();
  if (data.last === today) { showToast('Ja has marcat avui! ✓'); return; }
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  if (data.last === yesterday.toDateString()) data.count++;
  else data.count = 1;
  if (data.count > (data.best||0)) data.best = data.count;
  data.last = today;
  if (!data.days) data.days = [];
  data.days.push(today);
  if (data.days.length > 30) data.days.shift();
  set(STREAK_KEY, data);
  renderStreakWidget();
  showToast('🔥 Ratxa actualitzada! ' + data.count + ' dies!');
}

function undoStreakToday() {
  const data = get(STREAK_KEY, {count:0, best:0, last:'', label:'dies consecutius', days:[]});
  const today = new Date().toDateString();
  if (data.last !== today) { showToast('No hi ha res a desfer'); return; }
  data.count = Math.max(0, data.count-1);
  data.last = '';
  data.days = (data.days||[]).filter(d => d !== today);
  set(STREAK_KEY, data);
  renderStreakWidget();
  showToast('↺ Ratxa desfeta');
}

function editStreakLabel() {
  const data = get(STREAK_KEY, {count:0, best:0, last:'', label:'dies consecutius', days:[]});
  const newLabel = prompt('Canvia l\'etiqueta de la ratxa:', data.label || 'dies consecutius');
  if (newLabel !== null && newLabel.trim()) {
    data.label = newLabel.trim();
    set(STREAK_KEY, data);
    renderStreakWidget();
  }
}

/* ── Habits ── */
function renderHabits() {
  const habits = get(HABITS_KEY, []);
  const list = document.getElementById('habits-list');
  if (!list) return;
  const today = new Date().toDateString();
  if (habits.length === 0) {
    list.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:12px 0;">Afegeix el teu primer hàbit! →</div>';
    return;
  }
  list.innerHTML = habits.map((h,i) => {
    const done = (h.days||[]).includes(today);
    return `<div class="habit-item ${done?'done':''}" onclick="toggleHabit(${i})">
      <span class="habit-icon">${h.icon||'⭐'}</span>
      <span class="habit-name">${h.name||''}</span>
      <span class="habit-check">${done?'✓':''}</span>
      <button class="habit-del-btn" onclick="event.stopPropagation();deleteHabit(${i})" title="Eliminar">✕</button>
    </div>`;
  }).join('');
}

function toggleHabitForm() {
  const f = document.getElementById('habit-add-form');
  if (f) f.style.display = f.style.display === 'flex' ? 'none' : 'flex';
}

function addHabit() {
  const name = (document.getElementById('habit-name-inp')?.value || '').trim();
  const icon = (document.getElementById('habit-icon-inp')?.value || '⭐').trim();
  if (!name) { showToast('⚠️ Escriu un nom per al hàbit'); return; }
  const habits = get(HABITS_KEY, []);
  habits.push({name, icon, days:[], created: Date.now()});
  set(HABITS_KEY, habits);
  document.getElementById('habit-name-inp').value = '';
  document.getElementById('habit-icon-inp').value = '⭐';
  toggleHabitForm();
  renderHabits();
  showToast('✅ Hàbit afegit!');
}

function toggleHabit(idx) {
  const habits = get(HABITS_KEY, []);
  const today  = new Date().toDateString();
  if (!habits[idx]) return;
  const h = habits[idx];
  if (!h.days) h.days = [];
  if (h.days.includes(today)) h.days = h.days.filter(d => d !== today);
  else h.days.push(today);
  set(HABITS_KEY, habits);
  renderHabits();
}

function deleteHabit(idx) {
  const habits = get(HABITS_KEY, []);
  habits.splice(idx, 1);
  set(HABITS_KEY, habits);
  renderHabits();
  showToast('🗑️ Hàbit eliminat');
}

function selectHabitEmoji() {
  const emojis = ['⭐','🏃','📚','💧','🧘','💪','🎯','🍎','😴','🔥','✏️','🎵'];
  const sel = prompt('Escull un emoji: ' + emojis.join(' '));
  if (sel) { const el = document.getElementById('habit-icon-inp'); if (el) el.value = sel.trim().charAt(0); }
}

/* ── Progress ── */
const PROG_DEF = {chapter: 4, total: 9, title: 'Curs de Programació'};

function renderProgress() {
  const p = get(PROGRESS_KEY, PROG_DEF);
  const title  = document.getElementById('prog-title');
  const frac   = document.getElementById('prog-fraction');
  const fill   = document.getElementById('prog-fill');
  const chaps  = document.getElementById('prog-chapters');
  const congrats = document.getElementById('prog-congrats');
  const moto   = document.getElementById('moto-sub');
  if (title)  title.textContent   = '📚 ' + (p.title || 'Curs de Programació');
  if (frac)   frac.textContent    = `Capítol ${p.chapter} de ${p.total}`;
  if (fill)   fill.style.width    = Math.round((p.chapter / p.total)*100) + '%';
  if (moto)   moto.textContent    = `CAPÍTOL ${p.chapter} → ${p.chapter+1} · EMPRESA PRÒPIA`;
  if (chaps) {
    chaps.innerHTML = Array.from({length: p.total}, (_,i) => {
      const n = i+1, done = n < p.chapter, curr = n === p.chapter;
      return `<div class="prog-chap ${done?'done':''} ${curr?'curr':''}" title="Capítol ${n}">${n}</div>`;
    }).join('');
  }
  if (congrats) congrats.textContent = p.chapter >= p.total ? '🎉 Curs completat! Ets increïble.' : '';
}

function changeChapter(delta) {
  const p = get(PROGRESS_KEY, PROG_DEF);
  p.chapter = Math.max(1, Math.min(p.total, (p.chapter||1) + delta));
  set(PROGRESS_KEY, p);
  renderProgress();
  if (delta > 0) showToast('🎉 Capítol ' + p.chapter + ' completat!');
}

function resetProgress() {
  if (!confirm('Reiniciar el progrés del curs?')) return;
  const p = get(PROGRESS_KEY, PROG_DEF);
  p.chapter = 1;
  set(PROGRESS_KEY, p);
  renderProgress();
  showToast('↺ Progrés reiniciat');
}

/* ── Today panel ── */
function renderTodayPanel() {
  const grid = document.getElementById('today-grid');
  if (!grid) return;
  const now     = new Date();
  const days    = ['Diumenge','Dilluns','Dimarts','Dimecres','Dijous','Divendres','Dissabte'];
  const today   = days[now.getDay()];
  const schedule= get(SCHEDULE_KEY, {});
  const events  = Array.isArray(schedule[today]) ? schedule[today] : Object.values(schedule[today]||{});
  const now_min = now.getHours()*60 + now.getMinutes();

  if (events.length === 0) {
    grid.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:8px 0;">Sense events programats avui.</div>';
    return;
  }

  const sorted = [...events].sort((a,b) => {
    const [ah,am] = (a.time||'00:00').split(':').map(Number);
    const [bh,bm] = (b.time||'00:00').split(':').map(Number);
    return (ah*60+am) - (bh*60+bm);
  });

  let nextEvent = null;
  grid.innerHTML = sorted.slice(0,4).map(ev => {
    const [h,m] = (ev.time||'00:00').split(':').map(Number);
    const ev_min = h*60+m;
    const past   = ev_min < now_min;
    const current= !past && ev_min <= now_min+10;
    if (!nextEvent && !past) nextEvent = ev;
    return `<div class="today-card ${past?'past':''} ${current?'current':''}">
      <div class="tc-time">${ev.time||''}</div>
      <div class="tc-name">${ev.name||ev.text||''}</div>
    </div>`;
  }).join('');

  const nowEl  = document.getElementById('today-now');
  const nowTxt = document.getElementById('today-now-txt');
  if (nextEvent && nowEl && nowTxt) {
    const [h,m] = (nextEvent.time||'00:00').split(':').map(Number);
    const diff = (h*60+m) - now_min;
    if (diff > 0 && diff <= 60) {
      nowEl.style.display = 'flex';
      nowTxt.textContent  = `En ${diff} min: ${nextEvent.name||nextEvent.text||''}`;
    } else { nowEl.style.display = 'none'; }
  }
}

/* ─────────────────────────────────────────
   HORARI
───────────────────────────────────────── */
let weekOffset = 0;
let calendarYear, calendarMonth;

function renderHorari() {
  renderWeekDates();
  renderWeekGrid();
  renderCalendar();
  renderHorariHabits();
  renderMatches();
}

function switchHorariTab(tab) {
  document.querySelectorAll('.horari-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.horari-tab-content').forEach(c => { c.classList.remove('active'); c.style.display='none'; });
  const tabEl = document.getElementById('htab-' + tab);
  const contEl = document.getElementById('htab-content-' + tab);
  if (tabEl)  tabEl.classList.add('active');
  if (contEl) { contEl.classList.add('active'); contEl.style.display='block'; }
}

function renderWeekDates() {
  const grid  = document.getElementById('week-grid');
  const label = document.getElementById('week-label');
  if (!grid) return;
  const days = ['Dl','Dt','Dc','Dj','Dv','Ds','Dg'];
  const today = new Date();
  const monday = new Date(today);
  const dow = (today.getDay()+6)%7;
  monday.setDate(today.getDate() - dow + weekOffset*7);

  if (label) {
    const end = new Date(monday); end.setDate(monday.getDate()+6);
    label.textContent = `${monday.getDate()}/${monday.getMonth()+1} – ${end.getDate()}/${end.getMonth()+1}`;
  }

  const schedule = get(SCHEDULE_KEY, {});
  const dayNames = ['Dilluns','Dimarts','Dimecres','Dijous','Divendres','Dissabte','Diumenge'];

  grid.innerHTML = dayNames.map((dn, i) => {
    const d = new Date(monday); d.setDate(monday.getDate()+i);
    const isToday = d.toDateString() === today.toDateString();
    const events = Array.isArray(schedule[dn]) ? schedule[dn] : Object.values(schedule[dn]||{});
    const evHtml = events.slice(0,4).map(ev =>
      `<div class="week-event" style="background:${ev.color||'rgba(124,58,237,0.2)'}" onclick="openDayModal('${dn}','${ev.id||''}')">
        <span class="we-time">${ev.time||''}</span>
        <span class="we-name">${ev.name||ev.text||''}</span>
      </div>`
    ).join('');
    return `<div class="week-col ${isToday?'today':''}">
      <div class="week-day-header ${isToday?'today':''}">
        <span class="wdh-short">${days[i]}</span>
        <span class="wdh-num">${d.getDate()}</span>
      </div>
      <div class="week-events">
        ${evHtml}
        <button class="add-day-event-btn" onclick="openDayModal('${dn}',null)">+</button>
      </div>
    </div>`;
  }).join('');
}

function renderWeekGrid() {
  const stats = document.getElementById('stats-grid');
  if (!stats) return;
  const tasks   = get(TASKS_KEY, []);
  const done    = tasks.filter(t => t.done).length;
  const pending = tasks.filter(t => !t.done).length;
  const habits  = get(HABITS_KEY, []);
  const today   = new Date().toDateString();
  const habDone = habits.filter(h => (h.days||[]).includes(today)).length;
  stats.innerHTML = [
    {label:'Tasques fetes',  val: done,    icon:'✅'},
    {label:'Tasques pendents',val: pending, icon:'📋'},
    {label:'Hàbits avui',   val: `${habDone}/${habits.length}`, icon:'🌱'},
  ].map(s => `<div class="stat-card-mini"><div class="scm-icon">${s.icon}</div><div class="scm-val">${s.val}</div><div class="scm-lbl">${s.label}</div></div>`).join('');
}

/* Day modal */
let _dayModalDay = null, _dayModalEventId = null;
function openDayModal(day, eventId) {
  _dayModalDay = day; _dayModalEventId = eventId;
  const ov = document.getElementById('day-modal-overlay');
  if (!ov) { showToast('Modal no trobat'); return; }
  const schedule = get(SCHEDULE_KEY, {});
  const events   = Array.isArray(schedule[day]) ? schedule[day] : Object.values(schedule[day]||{});
  const ev = eventId ? events.find(e => e.id === eventId) : null;
  const titleEl = document.getElementById('day-modal-title');
  if (titleEl) titleEl.textContent = day;
  const timeEl = document.getElementById('dm-time');
  if (timeEl) timeEl.value = ev?.time || '';
  const textEl = document.getElementById('dm-text');
  if (textEl) textEl.value = ev?.name || ev?.text || '';
  ov.style.display = 'flex';
}

function closeDayModal() {
  const ov = document.getElementById('day-modal-overlay');
  if (ov) ov.style.display = 'none';
}

function saveDayEvent() {
  if (!_dayModalDay) return;
  const time  = document.getElementById('dm-time')?.value || '';
  const name  = (document.getElementById('dm-text')?.value || '').trim();
  const type  = document.getElementById('dm-type')?.value || '📌 Recordatori';
  if (!name) { showToast('⚠️ Posa una descripció'); return; }
  const colors = {
    '📌 Recordatori':'rgba(124,58,237,0.3)',
    '📚 Escolar':'rgba(59,130,246,0.3)',
    '🏒 Esport':'rgba(239,68,68,0.3)',
    '💻 Programació':'rgba(16,185,129,0.3)',
    '🤖 Robotech':'rgba(0,184,217,0.3)',
    '📝 Examen':'rgba(245,158,11,0.3)',
    '📦 Entrega':'rgba(168,85,247,0.3)',
    '🎯 Altres':'rgba(100,116,139,0.3)'
  };
  const schedule = get(SCHEDULE_KEY, {});
  if (!schedule[_dayModalDay]) schedule[_dayModalDay] = [];
  if (!Array.isArray(schedule[_dayModalDay])) schedule[_dayModalDay] = Object.values(schedule[_dayModalDay]);
  if (_dayModalEventId) {
    const idx = schedule[_dayModalDay].findIndex(e => e.id === _dayModalEventId);
    if (idx !== -1) schedule[_dayModalDay][idx] = {...schedule[_dayModalDay][idx], time, name, text:name, type};
  } else {
    schedule[_dayModalDay].push({
      id: Date.now().toString(), time, name, text:name, type,
      color: colors[type]||'rgba(124,58,237,0.3)', created: Date.now()
    });
  }
  set(SCHEDULE_KEY, schedule);
  closeDayModal();
  renderWeekDates();
  renderTodayPanel();
  showToast('✅ Event guardat!');
}

function deleteTimedEvent() {
  if (!_dayModalDay || !_dayModalEventId) return;
  const schedule = get(SCHEDULE_KEY, {});
  if (Array.isArray(schedule[_dayModalDay])) {
    schedule[_dayModalDay] = schedule[_dayModalDay].filter(e => e.id !== _dayModalEventId);
  }
  set(SCHEDULE_KEY, schedule);
  closeDayModal();
  renderWeekDates();
  showToast('🗑️ Event eliminat');
}

function saveTimedEvent() { saveDayEvent(); }
function pickTimedColor(color) {}

/* Month calendar */
function renderCalendar() {
  const now = new Date();
  if (!calendarYear)  calendarYear  = now.getFullYear();
  if (calendarMonth == null) calendarMonth = now.getMonth();

  const monthNames = ['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];
  const monthEl = document.getElementById('calendar-month');
  const gridEl  = document.getElementById('calendar-grid');
  if (!gridEl) return;
  if (monthEl) monthEl.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay  = new Date(calendarYear, calendarMonth+1, 0);
  const startDow = (firstDay.getDay()+6)%7;

  const monthEvents = get(SCHEDULE_KEY+'_monthly_'+calendarYear+'_'+calendarMonth, {});

  let html = ['Dl','Dt','Dc','Dj','Dv','Ds','Dg'].map(d => `<div class="cal-header-day">${d}</div>`).join('');
  for (let i = 0; i < startDow; i++) html += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const isToday = d===now.getDate() && calendarMonth===now.getMonth() && calendarYear===now.getFullYear();
    const evs = monthEvents[d] || [];
    const evHtml = evs.slice(0,2).map(e => `<div class="cal-event" style="background:${e.color||'rgba(124,58,237,0.3)'}">${e.name||''}</div>`).join('');
    html += `<div class="cal-day ${isToday?'today':''}" onclick="openMonthModal(${d})"><div class="cal-day-num">${d}</div>${evHtml}</div>`;
  }
  gridEl.innerHTML = html;
}

function calendarPrevMonth() {
  calendarMonth--;
  if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
  renderCalendar();
}
function calendarNextMonth() {
  calendarMonth++;
  if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
  renderCalendar();
}

let _monthModalDay = null;
function openMonthModal(day) {
  _monthModalDay = day;
  const ov = document.getElementById('month-modal-overlay');
  if (!ov) return;
  const titleEl = document.getElementById('mm-title');
  const subEl   = document.getElementById('mm-sub');
  const mesos = ['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];
  if (titleEl) titleEl.textContent = `${day} de ${mesos[calendarMonth]}`;
  if (subEl)   subEl.textContent   = String(calendarYear);
  // Show existing events
  const monthEvents = get(SCHEDULE_KEY+'_monthly_'+calendarYear+'_'+calendarMonth, {});
  const evs = monthEvents[day] || [];
  const listEl = document.getElementById('mm-list');
  if (listEl) {
    listEl.innerHTML = evs.length === 0
      ? '<div style="color:var(--muted);font-size:12px;">Sense events</div>'
      : evs.map((e,i) => `<div class="mm-event-item">${e.name||''} <button onclick="deleteMonthEvent(${day},${i})">✕</button></div>`).join('');
  }
  ov.style.display = 'flex';
}

function closeMonthModal() {
  const ov = document.getElementById('month-modal-overlay');
  if (ov) ov.style.display = 'none';
}

function saveMonthEvent() {
  const name = (document.getElementById('mm-text')?.value||'').trim();
  const time = document.getElementById('mm-time')?.value || '';
  const type = document.getElementById('mm-type')?.value || 'other';
  if (!name || !_monthModalDay) { showToast('⚠️ Escriu un event'); return; }
  const key = SCHEDULE_KEY+'_monthly_'+calendarYear+'_'+calendarMonth;
  const data = get(key, {});
  if (!data[_monthModalDay]) data[_monthModalDay] = [];
  const typeColors = {exam:'rgba(245,158,11,0.3)',deures:'rgba(59,130,246,0.3)',partit:'rgba(239,68,68,0.3)',other:'rgba(124,58,237,0.3)'};
  data[_monthModalDay].push({name, time, type, color:typeColors[type]||'rgba(124,58,237,0.3)', id:Date.now().toString()});
  set(key, data);
  const inp = document.getElementById('mm-text');
  if (inp) inp.value = '';
  closeMonthModal();
  renderCalendar();
  showToast('✅ Event mensual afegit!');
}

function deleteMonthEvent(day, idx) {
  const key = SCHEDULE_KEY+'_monthly_'+calendarYear+'_'+calendarMonth;
  const data = get(key, {});
  if (data[day]) data[day].splice(idx,1);
  set(key, data);
  openMonthModal(day);
  renderCalendar();
}

/* Horari Habits tab */
function renderHorariHabits() {
  const list = document.getElementById('htab-content-habits');
  if (!list) return;
  const habits = get(HABITS_KEY, []);
  const today  = new Date().toDateString();
  const habitsHtml = habits.length === 0
    ? '<p style="color:var(--muted);font-size:13px;">Afegeix hàbits des de la pàgina d\'Inici.</p>'
    : habits.map((h,i) => {
        const done = (h.days||[]).includes(today);
        const streak = _getHabitStreak(h);
        return `<div class="habit-row-horari ${done?'done':''}">
          <span class="hr-icon">${h.icon||'⭐'}</span>
          <span class="hr-name">${h.name}</span>
          <span class="hr-streak">🔥 ${streak}</span>
          <button class="hr-btn ${done?'done':''}" onclick="toggleHabit(${i});renderHorariHabits()">${done?'✓':''}</button>
        </div>`;
      }).join('');
  const existing = list.querySelector('.horari-habits-inner');
  if (existing) { existing.innerHTML = habitsHtml; }
  else {
    const div = document.createElement('div');
    div.className = 'horari-habits-inner';
    div.innerHTML = habitsHtml;
    list.appendChild(div);
  }
}

function _getHabitStreak(h) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const ds = d.toDateString();
    if ((h.days||[]).includes(ds)) { streak++; d.setDate(d.getDate()-1); }
    else break;
  }
  return streak;
}

/* ── MATCHES ── */
function renderMatches() {
  const list = document.getElementById('matches-list');
  if (!list) return;
  const matches = get(MATCH_KEY, []);
  if (matches.length === 0) {
    list.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:12px 0;">Sense partits afegits.</div>';
    return;
  }
  list.innerHTML = matches.map((m,i) => `
    <div class="match-card">
      <div class="mc-date">${m.date||''} ${m.time||''}</div>
      <div class="mc-teams">
        <span class="mc-home">${m.home||'Local'}</span>
        <span class="mc-score">${m.result||'vs'}</span>
        <span class="mc-away">${m.away||'Visitant'}</span>
      </div>
      <div class="mc-jornada">Jornada ${m.jornada||'?'}</div>
      <button class="mc-del" onclick="deleteMatch(${i})">✕</button>
    </div>
  `).join('');
}

function toggleMatchForm() {
  const f = document.getElementById('match-form');
  if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
}
function saveMatch() {
  const date    = document.getElementById('mf-date')?.value;
  const time    = document.getElementById('mf-time')?.value;
  const home    = (document.getElementById('mf-home')?.value||'').trim();
  const away    = (document.getElementById('mf-away')?.value||'').trim();
  const jornada = document.getElementById('mf-jornada')?.value;
  const result  = (document.getElementById('mf-result')?.value||'').trim();
  if (!home || !away) { showToast('⚠️ Posa els dos equips'); return; }
  const matches = get(MATCH_KEY, []);
  matches.push({date,time,home,away,jornada,result,id:Date.now().toString()});
  matches.sort((a,b) => (a.date||'') > (b.date||'') ? 1 : -1);
  set(MATCH_KEY, matches);
  toggleMatchForm();
  renderMatches();
  showToast('✅ Partit afegit!');
}
function deleteMatch(idx) {
  const matches = get(MATCH_KEY, []);
  matches.splice(idx,1);
  set(MATCH_KEY, matches);
  renderMatches();
}

/* ─────────────────────────────────────────
   TASQUES
───────────────────────────────────────── */
let _tasksMode     = 'personal';
let _personalView  = 'list';
let _currentBoardId= null;
let _currentTaskId = null;
let _taskDirty     = false;
let _btUrgency     = 'green';

function renderTasques() {
  renderExamList();
  renderPersonalKanban();
  renderSharedBoards();
}

function setTasksMode(mode) {
  _tasksMode = mode;
  document.getElementById('tasks-personal-view').style.display  = mode==='personal'?'block':'none';
  document.getElementById('tasks-shared-view').style.display    = mode==='shared'?'block':'none';
  document.querySelectorAll('.tasks-mode-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tmode-'+mode);
  if (btn) btn.classList.add('active');
  if (mode==='shared') renderSharedBoards();
}

function setPersonalView(view) {
  _personalView = view;
  document.getElementById('personal-list-view').style.display   = view==='list'?'block':'none';
  document.getElementById('personal-kanban-view').style.display = view==='kanban'?'block':'none';
  document.querySelectorAll('.tvt-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tvt-'+view)?.classList.add('active');
  if (view==='kanban') renderPersonalKanban();
}

function toggleExamForm() {
  const f = document.getElementById('exam-form');
  if (f) f.style.display = f.style.display==='flex'?'none':'flex';
}

function addExam() {
  const name  = (document.getElementById('exam-name')?.value||'').trim();
  const date  = document.getElementById('exam-date')?.value;
  const type  = document.getElementById('exam-type')?.value || 'tasca';
  const prio  = parseInt(document.getElementById('exam-prio')?.value||'3');
  if (!name) { showToast('⚠️ Escriu un nom per la tasca'); return; }
  const tasks = get(TASKS_KEY, []);
  tasks.push({id:Date.now().toString(), name, date, type, prio, done:false, status:'todo', urgency:'green', created:Date.now()});
  set(TASKS_KEY, tasks);
  document.getElementById('exam-name').value = '';
  toggleExamForm();
  renderExamList();
  showToast('✅ Tasca afegida!');
}

function renderExamList() {
  const list = document.getElementById('exam-list');
  if (!list) return;
  const tasks = get(TASKS_KEY, []).filter(t => !t.board);
  if (tasks.length === 0) {
    list.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:16px 0;text-align:center;">Sense tasques. Afegeix-ne una! ↑</div>';
    return;
  }
  const typeIcons = {deures:'📚',treball:'📄',tasca:'🗂️',personal:'🙋'};
  const prioColors = {1:'#ef4444',2:'#f59e0b',3:'#3b82f6',4:'#64748b'};
  const sorted = [...tasks].sort((a,b) => (a.prio||3) - (b.prio||3));
  list.innerHTML = sorted.map(t => `
    <div class="exam-item ${t.done?'done':''}" onclick="openTaskDetail('${t.id}')">
      <div class="ei-left">
        <div class="ei-prio-dot" style="background:${prioColors[t.prio||3]}"></div>
        <span class="ei-icon">${typeIcons[t.type]||'🗂️'}</span>
        <div class="ei-info">
          <div class="ei-name ${t.done?'done':''}">${t.name}</div>
          ${t.date?`<div class="ei-date">📅 ${t.date}</div>`:''}
        </div>
      </div>
      <div class="ei-right">
        <button class="ei-check ${t.done?'done':''}" onclick="event.stopPropagation();toggleTaskDone('${t.id}')">${t.done?'✓':''}</button>
        <button class="ei-del" onclick="event.stopPropagation();deleteTask('${t.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

function toggleTaskDone(id) {
  const tasks = get(TASKS_KEY, []);
  const t = tasks.find(t => t.id===id);
  if (t) { t.done = !t.done; t.status = t.done ? 'done' : 'todo'; }
  set(TASKS_KEY, tasks);
  renderExamList();
  renderPersonalKanban();
}

function deleteTask(id) {
  const tasks = get(TASKS_KEY, []).filter(t => t.id !== id);
  set(TASKS_KEY, tasks);
  renderExamList();
  renderPersonalKanban();
  showToast('🗑️ Tasca eliminada');
}

const KANBAN_COLS = [{id:'todo',name:'Per fer',color:'#64748b'},{id:'doing',name:'En curs',color:'#3b82f6'},{id:'done',name:'Fetes',color:'#10b981'}];

function renderPersonalKanban() {
  const board = document.getElementById('personal-kanban-board');
  if (!board) return;
  const tasks = get(TASKS_KEY, []).filter(t => !t.board);
  board.innerHTML = KANBAN_COLS.map(col => {
    const colTasks = tasks.filter(t => (t.status||'todo') === col.id);
    return `<div class="kb-col" id="kbc-${col.id}">
      <div class="kb-col-header" style="border-color:${col.color}">
        <span class="kbc-title">${col.name}</span>
        <span class="kbc-count">${colTasks.length}</span>
      </div>
      <div class="kb-cards" id="kbcards-${col.id}">
        ${colTasks.map(t => `
          <div class="kb-card" onclick="openTaskDetail('${t.id}')">
            <div class="kbc-name">${t.name}</div>
            ${t.date?`<div class="kbc-date">📅 ${t.date}</div>`:''}
          </div>
        `).join('')}
      </div>
      <button class="kb-add-btn" onclick="openPersonalKanbanModal('${col.id}')">+ Afegir</button>
    </div>`;
  }).join('');
}

let _kanbanAddStatus = 'todo';
function openPersonalKanbanModal(status) {
  _kanbanAddStatus = status || 'todo';
  const ov = document.getElementById('board-task-modal-overlay');
  if (ov) { ov.style.display = 'flex'; }
  else {
    const name = prompt('Nom de la tasca:');
    if (!name?.trim()) return;
    const tasks = get(TASKS_KEY, []);
    tasks.push({id:Date.now().toString(), name:name.trim(), status:_kanbanAddStatus, done:_kanbanAddStatus==='done', prio:3, created:Date.now()});
    set(TASKS_KEY, tasks);
    renderPersonalKanban();
    showToast('✅ Tasca afegida!');
  }
}

function selectBtUrgency(btn) {
  document.querySelectorAll('.bt-urg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _btUrgency = btn.dataset.u || 'green';
}

function saveBoardTask() {
  const title = (document.getElementById('bt-title-inp')?.value||'').trim();
  if (!title) { showToast('⚠️ Escriu un títol'); return; }
  const due      = document.getElementById('bt-due-inp')?.value;
  const assignee = document.getElementById('bt-assignee-inp')?.value;
  const tasks    = get(TASKS_KEY, []);
  tasks.push({id:Date.now().toString(), name:title, status:_kanbanAddStatus, done:_kanbanAddStatus==='done', urgency:_btUrgency, date:due, assignees:assignee?[assignee]:[], prio:3, created:Date.now()});
  set(TASKS_KEY, tasks);
  closeBoardTaskModal();
  renderPersonalKanban();
  renderExamList();
  showToast('✅ Tasca afegida!');
}

function closeBoardTaskModal() {
  const ov = document.getElementById('board-task-modal-overlay');
  if (ov) ov.style.display = 'none';
}

/* Task Detail Modal */
let _tdmTaskId = null;
function openTaskDetail(id) {
  const tasks = get(TASKS_KEY, []);
  const t = tasks.find(t => t.id===id);
  if (!t) return;
  _tdmTaskId = id;
  _taskDirty = false;
  const ov = document.getElementById('task-detail-overlay');
  if (!ov) return;
  document.getElementById('tdm-title').value = t.name || '';
  document.getElementById('tdm-desc').value  = t.desc || '';
  document.getElementById('tdm-due').value   = t.date || '';
  document.getElementById('tdm-status').value= t.status || 'todo';
  document.querySelectorAll('.tdm-status-pill').forEach(p => p.classList.toggle('active', p.dataset.s === (t.status||'todo')));
  document.querySelectorAll('.tdm-urg-pill').forEach(p => p.classList.toggle('active', p.dataset.u === (t.urgency||'green')));
  const bar = document.getElementById('tdm-urgency-bar');
  if (bar) { const uc={green:'#10b981',yellow:'#f59e0b',red:'#ef4444'}; bar.style.background=uc[t.urgency||'green']||'#10b981'; }
  renderTdmChips('tdm-assignees-chips', t.assignees||[]);
  renderTdmLinks(t.links||[]);
  renderTdmNotes(t.notes||[]);
  const saveBtn = document.getElementById('tdm-save-btn');
  if (saveBtn) saveBtn.style.display = 'none';
  ov.style.display = 'flex';
}

function closeTaskDetail() {
  if (_taskDirty) {
    if (confirm('Guardar canvis?')) tdmSaveChanges();
  }
  const ov = document.getElementById('task-detail-overlay');
  if (ov) ov.style.display = 'none';
  _tdmTaskId = null;
}

function tdmMarkDirty() {
  _taskDirty = true;
  const btn = document.getElementById('tdm-save-btn');
  if (btn) btn.style.display = 'block';
}

function tdmSetStatus(status, btn) {
  document.querySelectorAll('.tdm-status-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('tdm-status').value = status;
  tdmMarkDirty();
}

function tdmSetUrgency(urg, btn) {
  document.querySelectorAll('.tdm-urg-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const bar = document.getElementById('tdm-urgency-bar');
  if (bar) { const uc={green:'#10b981',yellow:'#f59e0b',red:'#ef4444'}; bar.style.background=uc[urg]; }
  tdmMarkDirty();
}

function tdmAddAssignee() {
  const inp = document.getElementById('tdm-assignee-inp');
  const val = (inp?.value||'').trim();
  if (!val) return;
  const tasks = get(TASKS_KEY, []);
  const t = tasks.find(t => t.id===_tdmTaskId);
  if (!t) return;
  if (!t.assignees) t.assignees = [];
  t.assignees.push(val);
  set(TASKS_KEY, tasks);
  renderTdmChips('tdm-assignees-chips', t.assignees);
  if (inp) inp.value = '';
}

function renderTdmChips(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.map((item,i) => `<span class="tdm-chip">${item} <button onclick="removeTdmChip('${containerId}',${i})">✕</button></span>`).join('');
}

function removeTdmChip(containerId, idx) {
  const tasks = get(TASKS_KEY, []);
  const t = tasks.find(t => t.id===_tdmTaskId);
  if (!t) return;
  const key = containerId === 'tdm-assignees-chips' ? 'assignees' : 'tags';
  if (t[key]) t[key].splice(idx,1);
  set(TASKS_KEY, tasks);
  renderTdmChips(containerId, t[key]||[]);
}

function tdmAddLink() {
  const url   = (document.getElementById('tdm-link-url-inp')?.value||'').trim();
  const label = (document.getElementById('tdm-link-label-inp')?.value||url).trim();
  if (!url) return;
  const tasks = get(TASKS_KEY, []);
  const t = tasks.find(t => t.id===_tdmTaskId);
  if (!t) return;
  if (!t.links) t.links = [];
  t.links.push({url, label});
  set(TASKS_KEY, tasks);
  renderTdmLinks(t.links);
  document.getElementById('tdm-link-url-inp').value='';
  document.getElementById('tdm-link-label-inp').value='';
}

function renderTdmLinks(links) {
  const el = document.getElementById('tdm-links-list');
  if (!el) return;
  el.innerHTML = (links||[]).map((l,i) => `<div class="tdm-link-row"><a href="${l.url}" target="_blank">${l.label||l.url}</a><button onclick="removeTdmLink(${i})">✕</button></div>`).join('');
}

function removeTdmLink(idx) {
  const tasks = get(TASKS_KEY, []);
  const t = tasks.find(t => t.id===_tdmTaskId);
  if (!t || !t.links) return;
  t.links.splice(idx,1);
  set(TASKS_KEY, tasks);
  renderTdmLinks(t.links);
}

function addNoteToTask() {
  const inp = document.getElementById('tdm-note-inp');
  const val = (inp?.value||'').trim();
  if (!val) return;
  const tasks = get(TASKS_KEY, []);
  const t = tasks.find(t => t.id===_tdmTaskId);
  if (!t) return;
  if (!t.notes) t.notes = [];
  t.notes.push({text:val, date:new Date().toLocaleDateString('ca')});
  set(TASKS_KEY, tasks);
  renderTdmNotes(t.notes);
  if (inp) inp.value='';
}

function renderTdmNotes(notes) {
  const el = document.getElementById('tdm-notes-list');
  if (!el) return;
  el.innerHTML = (notes||[]).map((n,i) => `<div class="tdm-note-row"><span class="tn-date">${n.date||''}</span> <span class="tn-text">${n.text||''}</span><button onclick="removeTdmNote(${i})">✕</button></div>`).join('');
}

function removeTdmNote(idx) {
  const tasks = get(TASKS_KEY, []);
  const t = tasks.find(t => t.id===_tdmTaskId);
  if (!t || !t.notes) return;
  t.notes.splice(idx,1);
  set(TASKS_KEY, tasks);
  renderTdmNotes(t.notes);
}

function tdmSaveChanges() {
  if (!_tdmTaskId) return;
  const tasks = get(TASKS_KEY, []);
  const t = tasks.find(t => t.id===_tdmTaskId);
  if (!t) return;
  t.name   = document.getElementById('tdm-title')?.value || t.name;
  t.desc   = document.getElementById('tdm-desc')?.value  || '';
  t.date   = document.getElementById('tdm-due')?.value   || '';
  t.status = document.getElementById('tdm-status')?.value|| 'todo';
  t.done   = t.status === 'done';
  const urgPill = document.querySelector('.tdm-urg-pill.active');
  if (urgPill) t.urgency = urgPill.dataset.u;
  set(TASKS_KEY, tasks);
  _taskDirty = false;
  const btn = document.getElementById('tdm-save-btn');
  if (btn) btn.style.display = 'none';
  renderExamList();
  renderPersonalKanban();
  showToast('✅ Tasca guardada!');
}

function updateTaskStatusFromDetail(status) { tdmSetStatus(status, null); }

/* Shared boards */
function renderSharedBoards() {
  const grid = document.getElementById('shared-boards-grid');
  if (!grid) return;
  const boards = get(BOARDS_KEY, []);
  if (boards.length === 0) {
    grid.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:16px;">Crea la teva primera llista compartida! →</div>';
    return;
  }
  grid.innerHTML = boards.map(b => `
    <div class="board-card" onclick="openBoardDetail('${b.id}')">
      <div class="bc-name">${b.name}</div>
      <div class="bc-desc">${b.desc||''}</div>
      <div class="bc-meta">${(b.tasks||[]).length} tasques · ${(b.members||[]).length} membres</div>
    </div>
  `).join('');
}

let _editingBoardId = null, _boardMembers = [];
function openCreateBoardModal() {
  _editingBoardId = null; _boardMembers = [];
  const ov = document.getElementById('board-modal-overlay');
  if (!ov) return;
  document.getElementById('board-name-inp').value = '';
  document.getElementById('board-desc-inp').value = '';
  document.getElementById('board-modal-title').textContent = 'Nova llista compartida';
  document.getElementById('bm-save-btn').textContent = 'Crear llista';
  document.getElementById('board-members-current').innerHTML = '';
  ov.style.display = 'flex';
}

function closeBoardModal() {
  const ov = document.getElementById('board-modal-overlay');
  if (ov) ov.style.display = 'none';
}

function saveBoardModal() {
  const name = (document.getElementById('board-name-inp')?.value||'').trim();
  if (!name) { showToast('⚠️ Posa un nom a la llista'); return; }
  const desc = document.getElementById('board-desc-inp')?.value||'';
  const boards = get(BOARDS_KEY, []);
  if (_editingBoardId) {
    const b = boards.find(b => b.id===_editingBoardId);
    if (b) { b.name=name; b.desc=desc; b.members=_boardMembers; }
  } else {
    boards.push({id:Date.now().toString(), name, desc, members:_boardMembers, tasks:[], created:Date.now()});
  }
  set(BOARDS_KEY, boards);
  closeBoardModal();
  renderSharedBoards();
  showToast('✅ Llista ' + (_editingBoardId?'actualitzada':'creada') + '!');
}

function openBoardDetail(boardId) {
  _currentBoardId = boardId;
  showToast('Tauler obert');
}

/* ─────────────────────────────────────────
   FOCUS — POMODORO
───────────────────────────────────────── */
let _pomoFocusMin  = 25;
let _pomoBreakMin  = 5;
let _pomoSessions  = 4;
let _pomoCurrent   = 0;
let _pomoState     = 'idle';
let _pomoSeconds   = 0;
let _pomoInterval  = null;
let _pomoDailyGoal = 4;
let _pomoTodayCount= 0;

const POMO_LEVELS = [
  {lvl:1,name:'APRENENT',xpNeeded:0},{lvl:2,name:'ESTUDIÓS',xpNeeded:10},
  {lvl:3,name:'CONSTANT',xpNeeded:30},{lvl:4,name:'DEDICAT',xpNeeded:60},
  {lvl:5,name:'ENFOCANT',xpNeeded:100},{lvl:6,name:'DISCIPLINAT',xpNeeded:150},
  {lvl:7,name:'EXPERT',xpNeeded:210},{lvl:8,name:'MESTRE',xpNeeded:280},
  {lvl:9,name:'LLEGENDA',xpNeeded:360},{lvl:10,name:'TRANSCENDENT',xpNeeded:450},
];

function renderFocus() {
  const data = get(POMO_KEY, {xp:0,total:0,week:0,today:0,goalToday:4,todayDate:''});
  const today = new Date().toDateString();
  if (data.todayDate !== today) { data.today=0; data.todayDate=today; set(POMO_KEY,data); }
  _pomoTodayCount = data.today || 0;
  _pomoDailyGoal  = data.goalToday || 4;
  updatePomoDisplay();
  updatePomoStats(data);
  updatePomoLevel(data);
  updatePomoDailyGoal(data);
}

function updatePomoDisplay() {
  const secs = _pomoSeconds > 0 ? _pomoSeconds : _pomoFocusMin*60;
  const m = Math.floor(secs/60), s = secs%60;
  const digits = document.getElementById('pomo-digits');
  const lbl    = document.getElementById('pomo-lbl');
  const arc    = document.getElementById('pomo-arc');
  if (digits) digits.textContent = `${pad2(m)}:${pad2(s)}`;
  if (lbl)    lbl.textContent    = _pomoState==='break'?'DESCANS':'FOCUS';
  const total = (_pomoState==='break'?_pomoBreakMin:_pomoFocusMin)*60;
  const elapsed= total - secs;
  const pct   = total>0 ? elapsed/total : 0;
  const circ  = 2*Math.PI*80;
  if (arc) { arc.style.strokeDasharray = circ; arc.style.strokeDashoffset = circ*(1-pct); }
  const sessions = document.getElementById('pomo-sessions');
  if (sessions) {
    sessions.innerHTML = Array.from({length:_pomoSessions},(_,i) =>
      `<div class="pomo-session-dot ${i<_pomoCurrent?'done':i===_pomoCurrent&&_pomoState!=='idle'?'active':''}"></div>`
    ).join('');
  }
}

function pomoAction() {
  if (_pomoState === 'idle')  _pomoStart();
  else if (_pomoState==='focus') _pomoPause();
  else if (_pomoState==='break') _pomoSkipBreak();
}

function _pomoStart() {
  _pomoState   = 'focus';
  _pomoSeconds = _pomoFocusMin * 60;
  clearInterval(_pomoInterval);
  _pomoInterval = setInterval(_pomoTick, 1000);
  const btn = document.getElementById('pomo-start');
  if (btn) btn.textContent = '⏸ PAUSA';
  updatePomoDisplay();
}

function _pomoPause() {
  clearInterval(_pomoInterval); _pomoInterval = null;
  _pomoState = 'idle';
  const btn = document.getElementById('pomo-start');
  if (btn) btn.textContent = '▶ INICIAR';
  updatePomoDisplay();
}

function _pomoTick() {
  _pomoSeconds--;
  updatePomoDisplay();
  if (_pomoSeconds <= 0) {
    if (_pomoState === 'focus') _pomoCompleteFocus();
    else if (_pomoState === 'break') _pomoCompleteBreak();
  }
}

function _pomoCompleteFocus() {
  clearInterval(_pomoInterval);
  _pomoCurrent++;
  const data = get(POMO_KEY, {xp:0,total:0,week:0,today:0,goalToday:4,todayDate:new Date().toDateString()});
  data.xp=(data.xp||0)+5; data.total=(data.total||0)+1; data.today=(data.today||0)+1; data.week=(data.week||0)+1;
  set(POMO_KEY, data);
  _pomoTodayCount = data.today;
  showToast('🍅 Pomodoro completat! +5 XP');
  updatePomoLevel(data); updatePomoStats(data); updatePomoDailyGoal(data);
  if (_pomoCurrent >= _pomoSessions) { showToast('🏆 Sessió completada!'); _pomoCurrent = 0; }
  _pomoState = 'break'; _pomoSeconds = _pomoBreakMin * 60;
  const btn = document.getElementById('pomo-start');
  if (btn) btn.textContent = '⏭ SALTAR DESCANS';
  _pomoInterval = setInterval(_pomoTick, 1000);
  updatePomoDisplay();
}

function _pomoCompleteBreak() {
  clearInterval(_pomoInterval);
  _pomoState = 'idle'; _pomoSeconds = 0;
  const btn = document.getElementById('pomo-start');
  if (btn) btn.textContent = '▶ INICIAR';
  updatePomoDisplay();
  showToast('✅ Descans acabat!');
}

function _pomoSkipBreak() {
  clearInterval(_pomoInterval);
  _pomoState = 'idle'; _pomoSeconds = 0;
  const btn = document.getElementById('pomo-start');
  if (btn) btn.textContent = '▶ INICIAR';
  updatePomoDisplay();
}

function pomoReset() {
  clearInterval(_pomoInterval); _pomoInterval = null;
  _pomoState = 'idle'; _pomoSeconds = 0; _pomoCurrent = 0;
  const btn = document.getElementById('pomo-start');
  if (btn) btn.textContent = '▶ INICIAR';
  updatePomoDisplay();
}

function setPomoPreset(focus, brk, sessions) {
  _pomoFocusMin = focus; _pomoBreakMin = brk; _pomoSessions = sessions;
  pomoReset();
  document.querySelectorAll('.pomo-preset-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('preset-'+focus)?.classList.add('active');
  const digits = document.getElementById('pomo-digits');
  if (digits) digits.textContent = `${pad2(focus)}:00`;
  const custF = document.getElementById('pomo-cust-focus');
  const custB = document.getElementById('pomo-cust-break');
  if (custF) custF.textContent = focus;
  if (custB) custB.textContent = brk;
}

function adjustPomoCust(type, delta) {
  if (type==='focus') {
    _pomoFocusMin = Math.max(5, Math.min(120, _pomoFocusMin + delta));
    const el = document.getElementById('pomo-cust-focus');
    if (el) el.textContent = _pomoFocusMin;
  } else {
    _pomoBreakMin = Math.max(1, Math.min(60, _pomoBreakMin + delta));
    const el = document.getElementById('pomo-cust-break');
    if (el) el.textContent = _pomoBreakMin;
  }
}

function applyPomoCustom() {
  pomoReset();
  showToast(`✅ Pomodoro: ${_pomoFocusMin}/${_pomoBreakMin} min`);
  const digits = document.getElementById('pomo-digits');
  if (digits) digits.textContent = `${pad2(_pomoFocusMin)}:00`;
}

function changeDailyGoal(delta) {
  const data = get(POMO_KEY, {xp:0,total:0,week:0,today:0,goalToday:4,todayDate:new Date().toDateString()});
  data.goalToday = Math.max(1, Math.min(12, (data.goalToday||4) + delta));
  _pomoDailyGoal = data.goalToday;
  set(POMO_KEY, data);
  updatePomoDailyGoal(data);
  const el = document.getElementById('pomo-goal-num');
  if (el) el.textContent = data.goalToday;
}

function updatePomoDailyGoal(data) {
  const dots   = document.getElementById('pomo-goal-dots');
  const status = document.getElementById('pomo-goal-status');
  const numEl  = document.getElementById('pomo-goal-num');
  if (numEl)  numEl.textContent = data.goalToday || 4;
  if (status) {
    const remaining = Math.max(0, (data.goalToday||4) - (data.today||0));
    status.textContent = remaining===0 ? '🎉 Objectiu assolit!' : `${remaining} pomodoros restants per avui`;
  }
  if (dots) {
    dots.innerHTML = Array.from({length: data.goalToday||4}, (_,i) =>
      `<div class="pomo-goal-dot ${i<(data.today||0)?'done':''}" style="width:24px;height:24px;border-radius:6px;background:${i<(data.today||0)?'var(--red)':'rgba(255,255,255,0.07)'};transition:background 0.3s;"></div>`
    ).join('');
  }
}

function updatePomoStats(data) {
  const todayEl = document.getElementById('pomo-today');
  const weekEl  = document.getElementById('pomo-week');
  const totalEl = document.getElementById('pomo-total');
  if (todayEl) todayEl.textContent = data.today || 0;
  if (weekEl)  weekEl.textContent  = data.week  || 0;
  if (totalEl) totalEl.textContent = data.total || 0;
}

function updatePomoLevel(data) {
  const xp = data.xp || 0;
  let lvlData = POMO_LEVELS[0];
  for (const l of POMO_LEVELS) { if (xp >= l.xpNeeded) lvlData = l; else break; }
  const nextLvl = POMO_LEVELS.find(l => l.lvl > lvlData.lvl);
  const xpInLvl = xp - lvlData.xpNeeded;
  const xpNeeded = nextLvl ? nextLvl.xpNeeded - lvlData.xpNeeded : 1;
  const pct = Math.min(100, Math.round((xpInLvl/xpNeeded)*100));
  const numEl   = document.getElementById('pomo-level-num');
  const nameEl  = document.getElementById('pomo-level-name');
  const xpBarEl = document.getElementById('pomo-xp-bar');
  const xpTxtEl = document.getElementById('pomo-xp-txt');
  if (numEl)   numEl.textContent  = lvlData.lvl;
  if (nameEl)  nameEl.textContent = lvlData.name;
  if (xpBarEl) xpBarEl.style.width = pct + '%';
  if (xpTxtEl) xpTxtEl.textContent = `${xp} / ${nextLvl?nextLvl.xpNeeded:'MAX'} XP`;
}

function openPomoFullscreen() {
  const ov = document.getElementById('pomo-fullscreen');
  if (ov) ov.style.display = 'flex';
}
function pomoFsAction() { pomoAction(); }
function pomoFsReset()  { pomoReset(); }
function handlePomoFsClick() {
  const ov = document.getElementById('pomo-fullscreen');
  if (ov) ov.style.display = 'none';
}

function loadSpotify() {
  const url = (document.getElementById('spotify-url-input')?.value||'').trim();
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
  const embedId = match ? match[1] : '37i9dQZF1DX8NTLI2TtZa6';
  const container = document.getElementById('spotify-embed-container');
  if (container) {
    container.innerHTML = `<iframe style="border-radius:12px;width:100%;height:152px;border:none;" src="https://open.spotify.com/embed/playlist/${embedId}?utm_source=generator&theme=0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
    showToast('🎵 Playlist carregada!');
  }
}

/* Victories */
function saveVictories() {
  const inp = document.getElementById('victories-inp');
  if (!inp) return;
  const text = inp.value.trim();
  if (!text) return;
  const vics = get(VICTORIES_KEY, []);
  vics.unshift({text, date:new Date().toLocaleDateString('ca'), id:Date.now().toString()});
  if (vics.length > 20) vics.pop();
  set(VICTORIES_KEY, vics);
  inp.value = '';
  renderVictories();
  showToast('🏆 Victòria guardada!');
}

function changeVictoriesWeek() { renderVictories(); }

function renderVictories() {
  const list = document.getElementById('victories-list');
  if (!list) return;
  const vics = get(VICTORIES_KEY, []);
  list.innerHTML = vics.length===0
    ? '<div style="color:var(--muted);font-size:12px;">Registra la teva primera victòria!</div>'
    : vics.map(v => `<div class="victory-item"><span class="vi-date">${v.date}</span><span class="vi-text">${v.text}</span></div>`).join('');
}

/* ─────────────────────────────────────────
   JULIANS AI
───────────────────────────────────────── */
let _chats = [], _currentChatId = null, _aiMode = 'rapid', _estudiSub = 'pla';
let _attachment = null, _aiSelMode = false, _selectedChats = new Set();

function initJulians() {
  _chats = get(CHATS_KEY, []);
  if (_chats.length === 0) createNewChat();
  else { _currentChatId = _chats[0].id; renderChatList(); renderMessages(); }
}

function createNewChat() {
  _chats = get(CHATS_KEY, []);
  const chat = {id:Date.now().toString(), title:'Nou xat', messages:[], created:Date.now()};
  _chats.unshift(chat);
  _currentChatId = chat.id;
  set(CHATS_KEY, _chats);
  renderChatList();
  renderMessages();
}

function renderChatList() {
  const list = document.getElementById('ai-chat-list');
  if (!list) return;
  _chats = get(CHATS_KEY, []);
  list.innerHTML = _chats.map(c => `
    <div class="ai-chat-item ${c.id===_currentChatId?'active':''}"
         onclick="${_aiSelMode?`toggleSelectChat('${c.id}')`:`switchChat('${c.id}')`}">
      <div class="aci-title">${c.title||'Nou xat'}</div>
      <div class="aci-date">${new Date(c.created||Date.now()).toLocaleDateString('ca')}</div>
    </div>
  `).join('');
  const title = document.getElementById('ai-chat-title-disp');
  const curr = _chats.find(c => c.id===_currentChatId);
  if (title && curr) title.textContent = curr.title||'Julians AI';
}

function switchChat(id) {
  _currentChatId = id;
  renderChatList();
  renderMessages();
}

function renderMessages() {
  const container = document.getElementById('ai-messages');
  if (!container) return;
  _chats = get(CHATS_KEY, []);
  const chat = _chats.find(c => c.id===_currentChatId);
  if (!chat || chat.messages.length===0) {
    container.innerHTML = `<div class="ai-welcome">
      <div class="ai-welcome-icon">🧠</div>
      <h3>Sóc Julians AI</h3>
      <p>El teu assistent personal. Pregunta'm qualsevol cosa sobre productivitat, estudi, codi o la teva vida.</p>
    </div>`;
    return;
  }
  container.innerHTML = chat.messages.map(m => `
    <div class="ai-msg ${m.role}">
      <div class="ai-msg-bubble">${m.content.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}</div>
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}

function setAIMode(mode) {
  _aiMode = mode;
  document.querySelectorAll('.ai-mode-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('mode-'+mode)?.classList.add('active');
  const modeLabels = {
    rapid:'⚡ Respostes concises i immediates',
    extens:'📝 Respostes detallades i exhaustives',
    profund:'🔬 Anàlisi profunda i crítica',
    estudi:'📚 Mode estudi actiu'
  };
  const lbl = document.getElementById('ai-mode-label-txt');
  if (lbl) lbl.textContent = modeLabels[mode]||'';
  const estudiPanel = document.getElementById('estudi-panel');
  if (estudiPanel) estudiPanel.style.display = mode==='estudi'?'block':'none';
}

function setEstudiSubmode(sub) {
  _estudiSub = sub;
  document.querySelectorAll('.estudi-sub-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('estudi-sub-'+sub)?.classList.add('active');
}

async function sendAI() {
  const inp  = document.getElementById('ai-chat-input');
  const text = (inp?.value||'').trim();
  if (!text && !_attachment) return;
  if (inp) inp.value = '';

  _chats = get(CHATS_KEY, []);
  let chat = _chats.find(c => c.id===_currentChatId);
  if (!chat) { createNewChat(); return; }

  const userMsg = {role:'user', content: text + (_attachment?`\n\n[Document adjunt: ${_attachment.name}]`:''), ts:Date.now()};
  chat.messages.push(userMsg);
  if (chat.messages.length===1) chat.title = text.slice(0,40);
  set(CHATS_KEY, _chats);
  renderMessages();
  renderChatList();

  const container = document.getElementById('ai-messages');
  const typing = document.createElement('div');
  typing.className = 'ai-msg assistant typing';
  typing.innerHTML = '<div class="ai-msg-bubble">💭 Pensant...</div>';
  if (container) { container.appendChild(typing); container.scrollTop = container.scrollHeight; }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:1000,
        system: _buildSystemPrompt(),
        messages: chat.messages.slice(-10).map(m => ({role:m.role, content:m.content}))
      })
    });
    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Error en la resposta.';
    if (container && typing.parentNode) container.removeChild(typing);
    _chats = get(CHATS_KEY, []);
    chat = _chats.find(c => c.id===_currentChatId);
    if (chat) { chat.messages.push({role:'assistant', content:reply, ts:Date.now()}); set(CHATS_KEY, _chats); }
  } catch(e) {
    if (container && typing.parentNode) container.removeChild(typing);
    _chats = get(CHATS_KEY, []);
    chat = _chats.find(c => c.id===_currentChatId);
    if (chat) { chat.messages.push({role:'assistant', content:'⚠️ No s\'ha pogut connectar.', ts:Date.now()}); set(CHATS_KEY, _chats); }
  }
  _attachment = null;
  const docPrev = document.getElementById('ai-doc-preview');
  if (docPrev) docPrev.style.display='none';
  renderMessages();
}

function _buildSystemPrompt() {
  const modePrompts = {
    rapid:'Respon de forma concisa i directa. Màxim 3 paràgrafs.',
    extens:'Respon de forma detallada i exhaustiva. Usa exemples.',
    profund:'Analitza en profunditat. Posa pros i contres. Sigues crític.',
    estudi:`Mode estudi — submode: ${_estudiSub}.`
  };
  const tasks = get(TASKS_KEY, []).filter(t=>!t.done).slice(0,3).map(t=>t.name).join(', ');
  return `Ets Julians AI, l'assistent personal de JOmaxPath creat per JOmax. Ets intel·ligent, directe i motivador. Parles sempre en català informal.${tasks?` Tasques pendents: ${tasks}.`:''}
Mode: ${modePrompts[_aiMode]||modePrompts.rapid}
Data: ${new Date().toLocaleDateString('ca')}.`;
}

function clearCurrentChat() {
  if (!confirm('Netejar el xat actual?')) return;
  _chats = get(CHATS_KEY, []);
  const chat = _chats.find(c => c.id===_currentChatId);
  if (chat) { chat.messages=[]; chat.title='Nou xat'; set(CHATS_KEY,_chats); }
  renderMessages();
  showToast('🗑️ Xat netejat');
}

function aiStartSelectMode() {
  _aiSelMode = true; _selectedChats.clear();
  document.getElementById('ai-select-toolbar')?.style.setProperty('display','flex');
  renderChatList();
}

function aiCancelSelectMode() {
  _aiSelMode = false; _selectedChats.clear();
  const toolbar = document.getElementById('ai-select-toolbar');
  if (toolbar) toolbar.style.display='none';
  renderChatList();
}

function toggleSelectChat(id) {
  if (_selectedChats.has(id)) _selectedChats.delete(id); else _selectedChats.add(id);
  const cnt = document.getElementById('ai-sel-count');
  if (cnt) cnt.textContent = _selectedChats.size + ' seleccionats';
  renderChatList();
}

function deleteSelectedChats() {
  if (_selectedChats.size===0) { showToast('Selecciona algun xat'); return; }
  if (!confirm(`Eliminar ${_selectedChats.size} xat(s)?`)) return;
  _chats = get(CHATS_KEY, []).filter(c => !_selectedChats.has(c.id));
  set(CHATS_KEY, _chats);
  if (_selectedChats.has(_currentChatId)) _currentChatId = _chats[0]?.id || null;
  aiCancelSelectMode();
  renderMessages();
  showToast('🗑️ Xats eliminats');
}

function toggleAISidebar() {
  const sb  = document.getElementById('ai-sidebar');
  const btn = document.getElementById('ai-sidebar-toggle');
  if (sb) {
    const isOpen = sb.style.display !== 'none';
    sb.style.display = isOpen ? 'none' : 'flex';
    if (btn) btn.textContent = isOpen ? '▶' : '◀';
  }
}

function handleFileAttach(input) {
  const file = input.files?.[0];
  if (!file) return;
  _attachment = {name:file.name};
  const prev = document.getElementById('ai-doc-preview');
  if (prev) prev.style.display='flex';
  const icon = document.getElementById('ai-doc-icon');
  const name = document.getElementById('ai-doc-name');
  if (icon) icon.textContent = file.name.endsWith('.pdf')?'📄':'📝';
  if (name) name.textContent = file.name;
  showToast(`📎 "${file.name}" adjuntat`);
}

function removeAttachment() {
  _attachment = null;
  const prev = document.getElementById('ai-doc-preview');
  if (prev) prev.style.display='none';
  const inp = document.getElementById('ai-file-input');
  if (inp) inp.value='';
}

/* ─────────────────────────────────────────
   CERCA GLOBAL
───────────────────────────────────────── */
function openSearch() {
  const bar = document.getElementById('global-search-bar');
  if (bar) { bar.style.display='block'; bar.classList.add('open'); }
  document.getElementById('search-input')?.focus();
}

function closeSearch() {
  const bar = document.getElementById('global-search-bar');
  if (bar) { bar.style.display='none'; bar.classList.remove('open'); }
  const res = document.getElementById('search-results');
  if (res) res.innerHTML='';
}

function runSearch(q) {
  const results = document.getElementById('search-results');
  if (!results || !q.trim()) { if (results) results.innerHTML=''; return; }
  const tasks  = get(TASKS_KEY, []).filter(t => t.name?.toLowerCase().includes(q.toLowerCase()));
  const habits = get(HABITS_KEY, []).filter(h => h.name?.toLowerCase().includes(q.toLowerCase()));
  const items  = [
    ...tasks.map(t => ({icon:'📋', label:t.name, sub:'Tasca', action:`navTo('tasques')`})),
    ...habits.map(h => ({icon:h.icon||'🌱', label:h.name, sub:'Hàbit', action:`navTo('home')`})),
  ];
  results.innerHTML = items.length===0
    ? `<div class="sr-empty">Sense resultats per "${q}"</div>`
    : items.map(it => `<div class="sr-item" onclick="${it.action};closeSearch()"><span class="sr-icon">${it.icon}</span><div><div class="sr-label">${it.label}</div><div class="sr-sub">${it.sub}</div></div></div>`).join('');
}

/* ─────────────────────────────────────────
   CONFIG
───────────────────────────────────────── */
function openConfig() {
  const ov = document.getElementById('config-overlay');
  if (!ov) return;
  ov.style.display='flex';
  renderConfigBody();
}

function closeConfig() {
  const ov = document.getElementById('config-overlay');
  if (ov) ov.style.display='none';
}

function renderConfigBody() {
  const body = document.getElementById('config-body');
  if (!body) return;
  const cfg = get(CONFIG_KEY, {progressTitle:'Curs de Programació',progressTotal:9,streakLabel:'dies consecutius',mainGoal:'Crear la meva empresa abans de complir els 18 anys.'});
  body.innerHTML = `
    <div class="cfg-section">
      <h4>🚀 Objectiu principal</h4>
      <textarea id="cfg-goal" rows="3" style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px;font-size:13px;">${cfg.mainGoal||''}</textarea>
    </div>
    <div class="cfg-section">
      <h4>📚 Nom del progrés</h4>
      <input id="cfg-prog-title" type="text" value="${cfg.progressTitle||''}" style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px;font-size:13px;box-sizing:border-box;" />
    </div>
    <div class="cfg-section">
      <h4>🔢 Total capítols/fases</h4>
      <input id="cfg-prog-total" type="number" min="1" max="100" value="${cfg.progressTotal||9}" style="width:100px;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px;font-size:13px;" />
    </div>
    <div style="margin-top:20px;display:flex;gap:10px;">
      <button onclick="saveConfig()" style="flex:1;padding:12px;background:linear-gradient(135deg,var(--accent),var(--cyan));border:none;border-radius:12px;color:#fff;font-weight:700;cursor:pointer;font-size:14px;">✅ Guardar</button>
      <button onclick="closeConfig()" style="padding:12px 20px;background:var(--card2);border:1px solid var(--border);border-radius:12px;color:var(--muted);cursor:pointer;">Cancel·lar</button>
    </div>
  `;
}

function saveConfig() {
  const cfg = get(CONFIG_KEY, {});
  cfg.mainGoal      = document.getElementById('cfg-goal')?.value||'';
  cfg.progressTitle = document.getElementById('cfg-prog-title')?.value||'Curs';
  cfg.progressTotal = parseInt(document.getElementById('cfg-prog-total')?.value||'9');
  set(CONFIG_KEY, cfg);
  const p = get(PROGRESS_KEY, {chapter:1,total:9,title:'Curs de Programació'});
  p.title = cfg.progressTitle; p.total = cfg.progressTotal;
  set(PROGRESS_KEY, p);
  const goalDesc = document.getElementById('goal-desc');
  if (goalDesc && cfg.mainGoal) goalDesc.textContent = cfg.mainGoal;
  closeConfig();
  renderProgress();
  showToast('✅ Configuració guardada!');
}

/* ─────────────────────────────────────────
   INFO TOOLTIPS
───────────────────────────────────────── */
const INFO_DATA = {
  home:    {icon:'🏠',title:'Pàgina d\'Inici',body:'El teu hub principal.'},
  streak:  {icon:'🔥',title:'Ratxa diària',body:'Marca cada dia que completes la teva sessió.'},
  habits:  {icon:'🌱',title:'Hàbits diaris',body:'Els teus hàbits recurrents.'},
  horari:  {icon:'📅',title:'Horari',body:'Gestiona el teu calendari setmanal i mensual.'},
  tasques: {icon:'📋',title:'Tasques',body:'Organitza les teves tasques per prioritat.'},
  focus:   {icon:'🎯',title:'Focus',body:'El temporitzador Pomodoro t\'ajuda a mantenir el focus.'},
  pomodoro:{icon:'🍅',title:'Tècnica Pomodoro',body:'Treballa 25 minuts concentrat, descansa 5.'},
  julians: {icon:'🧠',title:'Julians AI',body:'El teu assistent d\'intel·ligència artificial.'},
  tips:    {icon:'💡',title:'Consells Focus',body:'Silencia el mòbil, tanca les xarxes socials.'},
};

function showInfo(page) {
  const data = INFO_DATA[page];
  if (!data) return;
  const ov = document.getElementById('info-tooltip-overlay');
  if (!ov) return;
  document.getElementById('info-icon')?.textContent.replace('', data.icon);
  const icon = document.getElementById('info-icon');
  const title= document.getElementById('info-title');
  const body = document.getElementById('info-body');
  if (icon)  icon.textContent  = data.icon;
  if (title) title.textContent = data.title;
  if (body)  body.textContent  = data.body;
  ov.style.display = 'flex';
}

function closeInfo() {
  const ov = document.getElementById('info-tooltip-overlay');
  if (ov) ov.style.display = 'none';
}

/* ─────────────────────────────────────────
   QUICK CAPTURE
───────────────────────────────────────── */
let _qcType = 'tasca';

function openQuickCapture() {
  const ov = document.getElementById('quick-capture-overlay');
  if (ov) ov.style.display = 'flex';
  document.getElementById('qc-input')?.focus();
}

function closeQuickCapture() {
  const ov = document.getElementById('quick-capture-overlay');
  if (ov) ov.style.display = 'none';
}

function setQCType(type) {
  _qcType = type;
  document.querySelectorAll('.qc-type-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('qct-'+type)?.classList.add('active');
}

function saveQuickCapture() {
  const text = (document.getElementById('qc-input')?.value||'').trim();
  if (!text) { showToast('⚠️ Escriu algo primer!'); return; }
  if (_qcType === 'tasca') {
    const tasks = get(TASKS_KEY, []);
    tasks.push({id:Date.now().toString(), name:text, status:'todo', done:false, prio:3, created:Date.now()});
    set(TASKS_KEY, tasks);
    showToast('✅ Tasca capturada!');
  } else if (_qcType === 'nota') {
    const notes = get(NOTES_KEY, []);
    notes.unshift({id:Date.now().toString(), text, created:Date.now()});
    set(NOTES_KEY, notes);
    showToast('📝 Nota guardada!');
  } else if (_qcType === 'habit') {
    const habits = get(HABITS_KEY, []);
    habits.push({name:text, icon:'⭐', days:[], created:Date.now()});
    set(HABITS_KEY, habits);
    showToast('🌱 Hàbit afegit!');
  }
  document.getElementById('qc-input').value = '';
  closeQuickCapture();
  renderHome();
  renderTasques();
}

function toggleNotePicker() {
  const notes = get(NOTES_KEY, []);
  showToast(notes.length===0 ? 'Sense notes' : `${notes.length} nota(es) guardada(es)`);
}
function createNote() { openQuickCapture(); setQCType('nota'); }

/* ─────────────────────────────────────────
   SHORTCUTS
───────────────────────────────────────── */
function openShortcuts() {
  const ov = document.getElementById('shortcuts-overlay');
  if (ov) ov.style.display = 'flex';
}
function closeShortcuts() {
  const ov = document.getElementById('shortcuts-overlay');
  if (ov) ov.style.display = 'none';
}

/* ─────────────────────────────────────────
   DEV MODE
───────────────────────────────────────── */
function openDevMode() {
  const ov = document.getElementById('dev-modal-overlay');
  if (ov) ov.style.display='flex';
}
function closeDevMode() {
  const ov = document.getElementById('dev-modal-overlay');
  if (ov) ov.style.display='none';
}
function submitDevMode() {
  const email = document.getElementById('dev-email')?.value;
  const pass  = document.getElementById('dev-pass')?.value;
  const err   = document.getElementById('dev-error');
  if (email==='dev@jomaxpath.com' && pass==='JOmax2024!') {
    if (err) err.textContent='';
    showToast('✅ Mode Desenvolupador activat!');
    setTimeout(closeDevMode, 1500);
  } else {
    if (err) err.textContent='⚠️ Credencials incorrectes';
  }
}

/* ─────────────────────────────────────────
   KEYBOARD SHORTCUTS
───────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  if (e.key==='/' && !e.ctrlKey) { e.preventDefault(); openSearch(); }
  if (e.key==='q' || e.key==='Q') { e.preventDefault(); openQuickCapture(); }
  if (e.key==='Escape') {
    closeSearch(); closeQuickCapture(); closeInfo(); closeConfig(); closeShortcuts();
    closeClockFullscreen(); closeDayModal(); closeMonthModal(); closeTaskDetail();
    const drawer = document.getElementById('nav-drawer');
    if (drawer?.classList.contains('open')) toggleDrawer();
  }
  if (e.key==='?' && e.shiftKey) openShortcuts();
});

/* ─────────────────────────────────────────
   ALIASES
───────────────────────────────────────── */
window.goToHero    = () => window.open('hero.html','_self');
window.goToPricing = () => window.open('pricing.html','_self');
function setLayoutMode(mode) { showToast('Mode: ' + mode); }
function addBoardMember() {
  const email = (document.getElementById('board-member-add-inp')?.value||'').trim();
  if (!email) return;
  _boardMembers.push(email);
  document.getElementById('board-member-add-inp').value = '';
  const curr = document.getElementById('board-members-current');
  if (curr) curr.innerHTML = _boardMembers.map((m,i) => `<span class="board-member-chip">${m} <button onclick="_boardMembers.splice(${i},1);document.getElementById('board-members-current').innerHTML=''">✕</button></span>`).join('');
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const arc = document.getElementById('pomo-arc');
  if (arc) arc.style.strokeDasharray = 2*Math.PI*80;

  const cfg = get(CONFIG_KEY, {});
  if (cfg.mainGoal) {
    const goalDesc = document.getElementById('goal-desc');
    if (goalDesc) goalDesc.textContent = cfg.mainGoal;
  }

  navTo('home');

  console.log('%cJOmaxPath app.js carregat ✓', 'color:#7c3aed;font-weight:bold;font-size:14px;');
});
