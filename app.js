/* ═══════════════════════════════════════════════════════════════
   JOMAXPATH — app.js  v3.0
   Versió final amb tots els botons funcionant
═══════════════════════════════════════════════════════════════ */
'use strict';

/* ─────────────────────────────────────────
   CONSTANTS
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
  if (open) renderThemesGrid();
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
  if (page === 'notes')   renderNotes();

  window.scrollTo({top: 0, behavior: 'smooth'});
}

/* ─────────────────────────────────────────
   AUTH
───────────────────────────────────────── */
let _supabase = null;
try {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    _supabase = supabase.createClient(
      'https://ngyijuqcnelrzujazqom.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5neWlqdXFjbmVscnp1amF6cW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3OTk0MDgsImV4cCI6MjA1OTM3NTQwOH0.pQa8K5wXE9M7E8pu_D9s58hf1m4Wz5aNKbKNFMbQiSk'
    );
  }
} catch {}

function showAuthOverlay() {
  const ov = document.getElementById('auth-overlay');
  if (ov) ov.style.display = 'flex';
}
function switchAuthTab(tab) {
  document.getElementById('auth-login-form').style.display   = tab==='login'?'block':'none';
  document.getElementById('auth-register-form').style.display= tab==='register'?'block':'none';
  document.getElementById('tab-login').classList.toggle('active', tab==='login');
  document.getElementById('tab-register').classList.toggle('active', tab==='register');
}
function authSkip() {
  const ov = document.getElementById('auth-overlay');
  if (ov) ov.style.display = 'none';
  renderHome();
}
async function authLogin() {
  const email = (document.getElementById('auth-email')?.value||'').trim();
  const pass  = document.getElementById('auth-password')?.value||'';
  const msg   = document.getElementById('auth-msg');
  if (!email||!pass) { if(msg) msg.textContent='⚠️ Omple tots els camps'; return; }
  if (_supabase) {
    if(msg) msg.textContent='Entrant...';
    const {error} = await _supabase.auth.signInWithPassword({email,password:pass});
    if (error) { if(msg) msg.textContent='❌ '+error.message; return; }
  }
  document.getElementById('auth-overlay').style.display='none';
  showToast('✅ Sessió iniciada!'); renderHome();
}
async function authRegister() {
  const email = (document.getElementById('auth-reg-email')?.value||'').trim();
  const pass  = document.getElementById('auth-reg-password')?.value||'';
  const msg   = document.getElementById('auth-msg');
  if (!email||!pass) { if(msg) msg.textContent='⚠️ Omple tots els camps'; return; }
  if (pass.length<6) { if(msg) msg.textContent='⚠️ Contrasenya mínima 6 caràcters'; return; }
  if (_supabase) {
    if(msg) msg.textContent='Registrant...';
    const {error} = await _supabase.auth.signUp({email,password:pass});
    if (error) { if(msg) msg.textContent='❌ '+error.message; return; }
  }
  document.getElementById('auth-overlay').style.display='none';
  showToast('✅ Compte creat!'); renderHome();
}
function authShowMenu() { showAuthOverlay(); }

(async function initAuth() {
  if (!_supabase) { authSkip(); return; }
  try {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) authSkip(); else showAuthOverlay();
  } catch { authSkip(); }
})();

/* ─────────────────────────────────────────
   HOME
───────────────────────────────────────── */
const QUOTES = [
  {t:"No t'esperis a tenir ganes. Fes-ho i les ganes vindran.", a:'James Clear'},
  {t:'Cada dia que passes sense fer res et porta un dia més lluny dels teus somnis.', a:'JOmax'},
  {t:"L'únic que et separa del que vols és l'acció.", a:'Tony Robbins'},
  {t:'No és el que ets, és el que fas quan importa.', a:'Aragorn'},
  {t:"L'èxit no és un accident. És treball dur, perseverança i aprenentatge.", a:'Pelé'},
  {t:'Disciplines petites portaran victòries grans.', a:'JOmax'},
  {t:'La millor venjança és un èxit massiu.', a:'Frank Sinatra'},
  {t:"No perdis el temps amb qui no creu en tu. Usa-l per demostrar-los que s'equivocaven.", a:'JOmax'},
];
let _quoteIdx = Math.floor(Math.random()*QUOTES.length);

function refreshQuote() {
  _quoteIdx = (_quoteIdx+1) % QUOTES.length;
  const q = QUOTES[_quoteIdx];
  const el = document.getElementById('dq-text');
  const au = document.getElementById('dq-author');
  if (el) el.textContent = q.t;
  if (au) au.textContent = '— '+q.a;
}

function renderHome() {
  refreshQuote();
  renderStreakWidget();
  renderHabits();
  renderProgress();
  renderTodayPanel();
  renderVictories();
  applyConfig();
}

/* ── Streak ── */
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
  if (btnEl) { btnEl.textContent=doneToday?'✓ JA FETA AVUI':'✓ SESSIÓ FETA'; btnEl.style.opacity=doneToday?'0.5':'1'; }
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
  if (data.last===today) { showToast('Ja has marcat avui! ✓'); return; }
  const yesterday=new Date(); yesterday.setDate(yesterday.getDate()-1);
  if (data.last===yesterday.toDateString()) data.count++; else data.count=1;
  if (data.count>(data.best||0)) data.best=data.count;
  data.last=today;
  if (!data.days) data.days=[];
  data.days.push(today);
  if (data.days.length>30) data.days.shift();
  set(STREAK_KEY,data); renderStreakWidget();
  showToast('🔥 Ratxa: '+data.count+' dies!');
}
function undoStreakToday() {
  const data=get(STREAK_KEY,{count:0,best:0,last:'',label:'dies consecutius',days:[]});
  const today=new Date().toDateString();
  if (data.last!==today) { showToast('Res a desfer'); return; }
  data.count=Math.max(0,data.count-1); data.last='';
  data.days=(data.days||[]).filter(d=>d!==today);
  set(STREAK_KEY,data); renderStreakWidget(); showToast('↺ Ratxa desfeta');
}
function editStreakLabel() {
  const data=get(STREAK_KEY,{label:'dies consecutius'});
  const lbl=prompt("Canvia l'etiqueta:",data.label||'dies consecutius');
  if (lbl!==null&&lbl.trim()) { data.label=lbl.trim(); set(STREAK_KEY,data); renderStreakWidget(); }
}

/* ── Habits ── */
function renderHabits() {
  const habits=get(HABITS_KEY,[]);
  const list=document.getElementById('habits-list');
  if (!list) return;
  const today=new Date().toDateString();
  if (habits.length===0) { list.innerHTML='<div style="color:var(--muted);font-size:12px;padding:12px 0;">Afegeix el teu primer hàbit! →</div>'; return; }
  list.innerHTML=habits.map((h,i)=>{
    const done=(h.days||[]).includes(today);
    return `<div class="habit-item ${done?'done':''}" onclick="toggleHabit(${i})">
      <span class="habit-icon">${h.icon||'⭐'}</span>
      <span class="habit-name">${h.name||''}</span>
      <span class="habit-check">${done?'✓':''}</span>
      <button class="habit-del-btn" onclick="event.stopPropagation();deleteHabit(${i})">✕</button>
    </div>`;
  }).join('');
}
function toggleHabitForm() {
  const f=document.getElementById('habit-add-form');
  if (f) f.style.display=f.style.display==='flex'?'none':'flex';
}
function addHabit() {
  const name=(document.getElementById('habit-name-inp')?.value||'').trim();
  const icon=(document.getElementById('habit-icon-inp')?.value||'⭐').trim();
  if (!name) { showToast('⚠️ Escriu un nom'); return; }
  const habits=get(HABITS_KEY,[]);
  habits.push({name,icon,days:[],created:Date.now()});
  set(HABITS_KEY,habits);
  document.getElementById('habit-name-inp').value='';
  document.getElementById('habit-icon-inp').value='⭐';
  toggleHabitForm(); renderHabits(); showToast('✅ Hàbit afegit!');
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
  const habits=get(HABITS_KEY,[]); habits.splice(idx,1);
  set(HABITS_KEY,habits); renderHabits(); showToast('🗑️ Hàbit eliminat');
}
function selectHabitEmoji() {
  const emojis=['⭐','🏃','📚','💧','🧘','💪','🎯','🍎','😴','🔥','✏️','🎵'];
  const sel=prompt('Escull un emoji: '+emojis.join(' '));
  if (sel) { const el=document.getElementById('habit-icon-inp'); if(el) el.value=sel.trim()[0]; }
}

/* ── Progress ── */
const PROG_DEF={chapter:4,total:9,title:'Curs de Programació'};
function renderProgress() {
  const p=get(PROGRESS_KEY,PROG_DEF);
  const title=document.getElementById('prog-title');
  const frac=document.getElementById('prog-fraction');
  const fill=document.getElementById('prog-fill');
  const chaps=document.getElementById('prog-chapters');
  const congrats=document.getElementById('prog-congrats');
  const moto=document.getElementById('moto-sub');
  if (title)   title.textContent='📚 '+(p.title||'Curs de Programació');
  if (frac)    frac.textContent=`Capítol ${p.chapter} de ${p.total}`;
  if (fill)    fill.style.width=Math.round((p.chapter/p.total)*100)+'%';
  if (moto)    moto.textContent=`CAPÍTOL ${p.chapter} → ${p.chapter+1} · EMPRESA PRÒPIA`;
  if (chaps)   chaps.innerHTML=Array.from({length:p.total},(_,i)=>{const n=i+1,done=n<p.chapter,curr=n===p.chapter;return `<div class="prog-chap ${done?'done':''} ${curr?'curr':''}">${n}</div>`;}).join('');
  if (congrats) congrats.textContent=p.chapter>=p.total?'🎉 Curs completat!':'';
}
function changeChapter(delta) {
  const p=get(PROGRESS_KEY,PROG_DEF);
  p.chapter=Math.max(1,Math.min(p.total,(p.chapter||1)+delta));
  set(PROGRESS_KEY,p); renderProgress();
  if (delta>0) showToast('🎉 Capítol '+p.chapter+' completat!');
}
function resetProgress() {
  if (!confirm('Reiniciar el progrés?')) return;
  const p=get(PROGRESS_KEY,PROG_DEF); p.chapter=1;
  set(PROGRESS_KEY,p); renderProgress(); showToast('↺ Reiniciat');
}

/* ── Today panel ── */
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

/* ── Config aplicat ── */
function applyConfig() {
  const cfg=get(CONFIG_KEY,{});
  if (cfg.mainGoal) { const el=document.getElementById('goal-desc'); if(el) el.textContent=cfg.mainGoal; }
}

/* ─────────────────────────────────────────
   HORARI
───────────────────────────────────────── */
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
  if (label) { const end=new Date(monday);end.setDate(monday.getDate()+6);label.textContent=`${monday.getDate()}/${monday.getMonth()+1} – ${end.getDate()}/${end.getMonth()+1}`; }
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
    {label:'Tasques fetes',val:tasks.filter(t=>t.done).length,icon:'✅'},
    {label:'Pendents',val:tasks.filter(t=>!t.done).length,icon:'📋'},
    {label:'Hàbits avui',val:`${habDone}/${habits.length}`,icon:'🌱'},
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
  const type=document.getElementById('dm-type')?.value||'📌 Recordatori';
  if (!name) { showToast('⚠️ Posa una descripció'); return; }
  const colors={'📌 Recordatori':'rgba(124,58,237,0.3)','📚 Escolar':'rgba(59,130,246,0.3)','🏒 Esport':'rgba(239,68,68,0.3)','💻 Programació':'rgba(16,185,129,0.3)','🤖 Robotech':'rgba(0,184,217,0.3)','📝 Examen':'rgba(245,158,11,0.3)','📦 Entrega':'rgba(168,85,247,0.3)','🎯 Altres':'rgba(100,116,139,0.3)'};
  const schedule=get(SCHEDULE_KEY,{});
  if (!schedule[_dayModalDay]) schedule[_dayModalDay]=[];
  if (!Array.isArray(schedule[_dayModalDay])) schedule[_dayModalDay]=Object.values(schedule[_dayModalDay]);
  if (_dayModalEventId) {
    const idx=schedule[_dayModalDay].findIndex(e=>e.id===_dayModalEventId);
    if (idx!==-1) schedule[_dayModalDay][idx]={...schedule[_dayModalDay][idx],time,name,text:name,type};
  } else {
    schedule[_dayModalDay].push({id:Date.now().toString(),time,name,text:name,type,color:colors[type]||'rgba(124,58,237,0.3)',created:Date.now()});
  }
  set(SCHEDULE_KEY,schedule); closeDayModal(); renderWeekDates(); renderTodayPanel(); showToast('✅ Event guardat!');
}
function deleteTimedEvent() {
  if (!_dayModalDay||!_dayModalEventId) return;
  const schedule=get(SCHEDULE_KEY,{});
  if (Array.isArray(schedule[_dayModalDay])) schedule[_dayModalDay]=schedule[_dayModalDay].filter(e=>e.id!==_dayModalEventId);
  set(SCHEDULE_KEY,schedule); closeDayModal(); renderWeekDates(); showToast('🗑️ Event eliminat');
}
function saveTimedEvent() { saveDayEvent(); }
function pickTimedColor() {}

/* Calendar mensual */
function renderCalendar() {
  const now=new Date();
  if (!calendarYear) calendarYear=now.getFullYear();
  if (calendarMonth==null) calendarMonth=now.getMonth();
  const monthNames=['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];
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
  const mesos=['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];
  document.getElementById('mm-title').textContent=`${day} de ${mesos[calendarMonth]}`;
  document.getElementById('mm-sub').textContent=String(calendarYear);
  const key=SCHEDULE_KEY+'_monthly_'+calendarYear+'_'+calendarMonth;
  const evs=(get(key,{})[day])||[];
  const listEl=document.getElementById('mm-list');
  if (listEl) listEl.innerHTML=evs.length===0?'<div style="color:var(--muted);font-size:12px;">Sense events</div>':evs.map((e,i)=>`<div class="mm-event-item">${e.name} <button onclick="deleteMonthEvent(${day},${i})">✕</button></div>`).join('');
  ov.style.display='flex';
}
function closeMonthModal() { document.getElementById('month-modal-overlay').style.display='none'; }
function saveMonthEvent() {
  const name=(document.getElementById('mm-text')?.value||'').trim();
  const time=document.getElementById('mm-time')?.value||'';
  const type=document.getElementById('mm-type')?.value||'other';
  if (!name||!_monthModalDay) { showToast('⚠️ Escriu un event'); return; }
  const key=SCHEDULE_KEY+'_monthly_'+calendarYear+'_'+calendarMonth;
  const data=get(key,{});
  if (!data[_monthModalDay]) data[_monthModalDay]=[];
  const typeColors={exam:'rgba(245,158,11,0.3)',deures:'rgba(59,130,246,0.3)',partit:'rgba(239,68,68,0.3)',other:'rgba(124,58,237,0.3)'};
  data[_monthModalDay].push({name,time,type,color:typeColors[type]||'rgba(124,58,237,0.3)',id:Date.now().toString()});
  set(key,data);
  document.getElementById('mm-text').value='';
  closeMonthModal(); renderCalendar(); showToast('✅ Event mensual afegit!');
}
function deleteMonthEvent(day,idx) {
  const key=SCHEDULE_KEY+'_monthly_'+calendarYear+'_'+calendarMonth;
  const data=get(key,{});
  if (data[day]) data[day].splice(idx,1);
  set(key,data); openMonthModal(day); renderCalendar();
}

function renderHorariHabits() {
  const list=document.getElementById('htab-content-habits'); if (!list) return;
  const habits=get(HABITS_KEY,[]);
  const today=new Date().toDateString();
  const html=habits.length===0?'<p style="color:var(--muted);">Afegeix hàbits des d\'Inici.</p>':habits.map((h,i)=>{
    const done=(h.days||[]).includes(today);
    const streak=_habitStreak(h);
    return `<div class="habit-row-horari ${done?'done':''}"><span>${h.icon||'⭐'}</span><span style="flex:1">${h.name}</span><span style="color:var(--orange);font-size:11px;">🔥 ${streak}</span><button onclick="toggleHabit(${i});renderHorariHabits()">${done?'✓':''}</button></div>`;
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
  list.innerHTML=matches.map((m,i)=>`<div class="match-card"><div class="mc-date">${m.date||''} ${m.time||''}</div><div class="mc-teams"><span>${m.home||'Local'}</span><span style="margin:0 8px;opacity:0.5">${m.result||'vs'}</span><span>${m.away||'Visitant'}</span></div><div style="font-size:10px;color:var(--muted)">Jornada ${m.jornada||'?'}</div><button class="mc-del" onclick="deleteMatch(${i})">✕</button></div>`).join('');
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
  if (!home||!away) { showToast('⚠️ Posa els dos equips'); return; }
  const matches=get(MATCH_KEY,[]);
  matches.push({date,time,home,away,jornada,result,id:Date.now().toString()});
  matches.sort((a,b)=>(a.date||'')>(b.date||'')?1:-1);
  set(MATCH_KEY,matches); toggleMatchForm(); renderMatches(); showToast('✅ Partit afegit!');
}
function deleteMatch(idx) {
  const m=get(MATCH_KEY,[]); m.splice(idx,1); set(MATCH_KEY,m); renderMatches();
}
function setMatchCasa(val) {}

/* ─────────────────────────────────────────
   TASQUES
───────────────────────────────────────── */
let _tasksMode='personal', _personalView='list', _currentBoardId=null, _taskDirty=false, _btUrgency='green';
let _editingBoardId=null, _boardMembers=[];

function renderTasques() { renderExamList(); renderPersonalKanban(); renderSharedBoards(); }

function setTasksMode(mode) {
  _tasksMode=mode;
  document.getElementById('tasks-personal-view').style.display=mode==='personal'?'block':'none';
  document.getElementById('tasks-shared-view').style.display=mode==='shared'?'block':'none';
  document.querySelectorAll('.tasks-mode-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tmode-'+mode)?.classList.add('active');
  if (mode==='shared') renderSharedBoards();
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
  if (!name) { showToast('⚠️ Escriu un nom'); return; }
  const tasks=get(TASKS_KEY,[]);
  tasks.push({id:Date.now().toString(),name,date,type,prio,done:false,status:'todo',urgency:'green',created:Date.now()});
  set(TASKS_KEY,tasks); document.getElementById('exam-name').value='';
  toggleExamForm(); renderExamList(); showToast('✅ Tasca afegida!');
}
function renderExamList() {
  const list=document.getElementById('exam-list'); if (!list) return;
  const tasks=get(TASKS_KEY,[]).filter(t=>!t.board);
  if (tasks.length===0) { list.innerHTML='<div style="color:var(--muted);font-size:12px;padding:16px 0;text-align:center;">Sense tasques. Afegeix-ne una! ↑</div>'; return; }
  const typeIcons={deures:'📚',treball:'📄',tasca:'🗂️',personal:'🙋'};
  const prioColors={1:'#ef4444',2:'#f59e0b',3:'#3b82f6',4:'#64748b'};
  list.innerHTML=[...tasks].sort((a,b)=>(a.prio||3)-(b.prio||3)).map(t=>`
    <div class="exam-item ${t.done?'done':''}" onclick="openTaskDetail('${t.id}')">
      <div class="ei-left">
        <div class="ei-prio-dot" style="background:${prioColors[t.prio||3]}"></div>
        <span class="ei-icon">${typeIcons[t.type]||'🗂️'}</span>
        <div class="ei-info"><div class="ei-name ${t.done?'done':''}">${t.name}</div>${t.date?`<div class="ei-date">📅 ${t.date}</div>`:''}</div>
      </div>
      <div class="ei-right">
        <button class="ei-check ${t.done?'done':''}" onclick="event.stopPropagation();toggleTaskDone('${t.id}')">${t.done?'✓':''}</button>
        <button class="ei-del" onclick="event.stopPropagation();deleteTask('${t.id}')">✕</button>
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
    renderExamList(); renderPersonalKanban(); showToast('🗑️ Tasca eliminada');
  });
}
function showDeleteConfirm(onConfirm) {
  let ov=document.getElementById('del-confirm-ov');
  if(!ov){
    ov=document.createElement('div');
    ov.id='del-confirm-ov';
    ov.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);';
    ov.innerHTML=`<div style="background:var(--card);border:1px solid rgba(239,68,68,0.3);border-radius:20px;padding:28px 32px;max-width:340px;width:90%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.5);">
      <div style="font-size:36px;margin-bottom:10px;">🗑️</div>
      <h3 style="font-family:'Space Mono',monospace;font-size:14px;color:var(--text);margin-bottom:8px;letter-spacing:1px;">ELIMINAR TASCA</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:22px;">Estàs segur? Aquesta acció no es pot desfer.</p>
      <div style="display:flex;gap:10px;">
        <button id="del-confirm-yes" style="flex:1;padding:11px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#fca5a5;border-radius:12px;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.3)'" onmouseout="this.style.background='rgba(239,68,68,0.15)'">✓ ELIMINAR</button>
        <button id="del-confirm-no" style="flex:1;padding:11px;background:var(--card2);border:1px solid var(--border);color:var(--muted);border-radius:12px;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1px;cursor:pointer;">✕ CANCEL·LAR</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
  }
  ov.style.display='flex';
  document.getElementById('del-confirm-yes').onclick=()=>{ov.style.display='none';onConfirm();};
  document.getElementById('del-confirm-no').onclick=()=>{ov.style.display='none';};
  ov.onclick=(e)=>{if(e.target===ov)ov.style.display='none';};
}

/* ── Kanban personal ── */
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
        ${t.date?`<div style="font-size:10px;color:var(--muted);">📅 ${t.date}</div>`:''}
        <button onclick="event.stopPropagation();deleteTask('${t.id}')" style="position:absolute;top:6px;right:6px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;opacity:0;transition:opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">✕</button>
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
    set(TASKS_KEY,tasks); renderPersonalKanban(); showToast('✅ Tasca afegida!');
  }
}
function selectBtUrgency(btn) {
  document.querySelectorAll('.bt-urg-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); _btUrgency=btn.dataset.u||'green';
}
function saveBoardTask() {
  const title=(document.getElementById('bt-title-inp')?.value||'').trim();
  if (!title) { showToast('⚠️ Escriu un títol'); return; }
  const due=document.getElementById('bt-due-inp')?.value;
  const assignee=document.getElementById('bt-assignee-inp')?.value;
  const tasks=get(TASKS_KEY,[]);
  tasks.push({id:Date.now().toString(),name:title,status:_kanbanAddStatus,done:_kanbanAddStatus==='done',urgency:_btUrgency,date:due,assignees:assignee?[assignee]:[],prio:3,created:Date.now()});
  set(TASKS_KEY,tasks); closeBoardTaskModal(); renderPersonalKanban(); renderExamList(); showToast('✅ Tasca afegida!');
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
  el.innerHTML=items.map((item,i)=>`<span class="tdm-chip">${item} <button onclick="removeTdmChip('${cId}',${i})">✕</button></span>`).join('');
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
  el.innerHTML=(links||[]).map((l,i)=>`<div class="tdm-link-row"><a href="${l.url}" target="_blank">${l.label||l.url}</a><button onclick="removeTdmLink(${i})">✕</button></div>`).join('');
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
  el.innerHTML=(notes||[]).map((n,i)=>`<div class="tdm-note-row"><span class="tn-date">${n.date||''}</span> <span>${n.text}</span><button onclick="removeTdmNote(${i})">✕</button></div>`).join('');
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
  renderExamList(); renderPersonalKanban(); showToast('✅ Tasca guardada!');
}
function updateTaskStatusFromDetail(status) { tdmSetStatus(status,null); }

/* Shared boards */
function renderSharedBoards() {
  const grid=document.getElementById('shared-boards-grid'); if (!grid) return;
  const boards=get(BOARDS_KEY,[]);
  if (boards.length===0) { grid.innerHTML='<div style="color:var(--muted);font-size:13px;padding:16px;">Crea la teva primera llista! →</div>'; return; }
  grid.innerHTML=boards.map(b=>`<div class="board-card" onclick="showToast('Tauler: ${b.name}')"><div class="bc-name">${b.name}</div><div class="bc-desc">${b.desc||''}</div><div class="bc-meta">${(b.tasks||[]).length} tasques · ${(b.members||[]).length} membres</div></div>`).join('');
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
  document.getElementById('board-members-current').innerHTML=_boardMembers.map((m,i)=>`<span class="board-member-chip">${m} <button onclick="_boardMembers.splice(${i},1);document.getElementById('board-members-current').innerHTML=''">✕</button></span>`).join('');
}
function saveBoardModal() {
  const name=(document.getElementById('board-name-inp')?.value||'').trim(); if (!name) { showToast('⚠️ Posa un nom'); return; }
  const boards=get(BOARDS_KEY,[]);
  boards.push({id:Date.now().toString(),name,desc:document.getElementById('board-desc-inp')?.value||'',members:_boardMembers,tasks:[],created:Date.now()});
  set(BOARDS_KEY,boards); closeBoardModal(); renderSharedBoards(); showToast('✅ Llista creada!');
}
function openBoardDetail(id) { showToast('Tauler obert'); }

/* ─────────────────────────────────────────
   FOCUS — POMODORO
───────────────────────────────────────── */
let _pomoFocusMin=25, _pomoBreakMin=5, _pomoSessions=4;
let _pomoCurrent=0, _pomoState='idle', _pomoSeconds=0, _pomoInterval=null;

const POMO_LEVELS=[
  {lvl:1,name:'APRENENT',xpNeeded:0},{lvl:2,name:'ESTUDIÓS',xpNeeded:10},
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
  // Only reset seconds if idle from scratch (not resuming)
  if (_pomoState==='idle' && _pomoSeconds===0) _pomoSeconds=_pomoFocusMin*60;
  _pomoState='focus';
  clearInterval(_pomoInterval); _pomoInterval=setInterval(_pomoTick,1000);
  const btn=document.getElementById('pomo-start'); if(btn) btn.textContent='⏸ PAUSA';
  const fsbtn=document.getElementById('pomo-fs-start'); if(fsbtn) fsbtn.textContent='⏸ PAUSA';
  updatePomoDisplay();
}
function _pomoResume() {
  _pomoState='focus';
  clearInterval(_pomoInterval); _pomoInterval=setInterval(_pomoTick,1000);
  const btn=document.getElementById('pomo-start'); if(btn) btn.textContent='⏸ PAUSA';
  const fsbtn=document.getElementById('pomo-fs-start'); if(fsbtn) fsbtn.textContent='⏸ PAUSA';
  updatePomoDisplay();
}
function _pomoPause() {
  clearInterval(_pomoInterval); _pomoInterval=null; _pomoState='paused';
  const btn=document.getElementById('pomo-start'); if(btn) btn.textContent='▶ REPRENDRE';
  const fsbtn=document.getElementById('pomo-fs-start'); if(fsbtn) fsbtn.textContent='▶ REPRENDRE';
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
  set(POMO_KEY,data); showToast('🍅 Pomodoro completat! +5 XP');
  updatePomoLevel(data); updatePomoStats(data); updatePomoDailyGoal(data);
  if (_pomoCurrent>=_pomoSessions) { showToast('🏆 Sessió completada!'); _pomoCurrent=0; }
  _pomoState='break'; _pomoSeconds=_pomoBreakMin*60;
  const btn=document.getElementById('pomo-start'); if(btn) btn.textContent='⏭ SALTAR DESCANS';
  _pomoInterval=setInterval(_pomoTick,1000); updatePomoDisplay();
}
function _pomoCompleteBreak() {
  clearInterval(_pomoInterval); _pomoState='idle'; _pomoSeconds=0;
  const btn=document.getElementById('pomo-start'); if(btn) btn.textContent='▶ INICIAR';
  _playPomoAlarm();
  updatePomoDisplay(); showToast('✅ Descans acabat! Llest per al següent focus 🚀');
}
function _pomoSkipBreak() {
  clearInterval(_pomoInterval); _pomoState='idle'; _pomoSeconds=0;
  const btn=document.getElementById('pomo-start'); if(btn) btn.textContent='▶ INICIAR';
  updatePomoDisplay();
}
function pomoReset() {
  clearInterval(_pomoInterval); _pomoInterval=null; _pomoState='idle'; _pomoSeconds=0; _pomoCurrent=0;
  const btn=document.getElementById('pomo-start'); if(btn) btn.textContent='▶ INICIAR';
  const fsbtn=document.getElementById('pomo-fs-start'); if(fsbtn) fsbtn.textContent='▶ INICIAR';
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
  if(ratio) ratio.textContent=`Ràtio: 1:${brk} · ${brk} min de descans per cada ${focus} de treball`;
}
function adjustPomoCust(type,delta) {
  if (type==='focus') { _pomoFocusMin=Math.max(5,Math.min(120,_pomoFocusMin+delta)); const el=document.getElementById('pomo-cust-focus'); if(el) el.textContent=_pomoFocusMin; }
  else { _pomoBreakMin=Math.max(1,Math.min(60,_pomoBreakMin+delta)); const el=document.getElementById('pomo-cust-break'); if(el) el.textContent=_pomoBreakMin; }
}
function applyPomoCustom() {
  pomoReset(); showToast(`✅ ${_pomoFocusMin}/${_pomoBreakMin} min aplicat`);
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
  if(status) { const rem=Math.max(0,(data.goalToday||4)-(data.today||0)); status.textContent=rem===0?'🎉 Objectiu assolit!':`${rem} pomodoros restants`; }
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
  if(ov){ ov.style.display='flex'; updatePomoDisplay(); }
  // Sync digits
  const mainDigits=document.getElementById('pomo-digits');
  const fsDigits=document.getElementById('pomo-fs-digits');
  if(mainDigits&&fsDigits) fsDigits.textContent=mainDigits.textContent;
  const mainLbl=document.getElementById('pomo-lbl');
  const fsPhase=document.getElementById('pomo-fs-phase');
  if(mainLbl&&fsPhase) fsPhase.textContent=mainLbl.textContent;
}
function closePomoFullscreen() { const ov=document.getElementById('pomo-fullscreen'); if(ov) ov.style.display='none'; }
function pomoFsAction() { pomoAction(); }
function pomoFsReset() { pomoReset(); }
function handlePomoFsClick(e) {
  // Tancar només si s'ha clicat el fons (no els controls)
  if(e.target===document.getElementById('pomo-fullscreen') || e.target.id==='pomo-fs-close-hint') {
    closePomoFullscreen();
  }
}
function loadSpotify() {
  const url=(document.getElementById('spotify-url-input')?.value||'').trim();
  const match=url.match(/playlist\/([a-zA-Z0-9]+)/);
  const embedId=match?match[1]:'37i9dQZF1DX8NTLI2TtZa6';
  const container=document.getElementById('spotify-embed-container');
  if(container){container.innerHTML=`<iframe style="border-radius:12px;width:100%;height:152px;border:none;" src="https://open.spotify.com/embed/playlist/${embedId}?utm_source=generator&theme=0" allowfullscreen allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture" loading="lazy"></iframe>`;showToast('🎵 Playlist carregada!');}
}
function saveVictories() {
  const inp=document.getElementById('victories-inp'); if(!inp) return;
  const text=inp.value.trim(); if(!text) return;
  const vics=get(VICTORIES_KEY,[]); vics.unshift({text,date:new Date().toLocaleDateString('ca'),id:Date.now().toString()});
  if(vics.length>20) vics.pop(); set(VICTORIES_KEY,vics); inp.value=''; renderVictories(); showToast('🏆 Victòria guardada!');
}
function changeVictoriesWeek() { renderVictories(); }
function renderVictories() {
  const list=document.getElementById('victories-list'); if(!list) return;
  const vics=get(VICTORIES_KEY,[]);
  list.innerHTML=vics.length===0?'<div style="color:var(--muted);font-size:12px;">Registra la teva primera victòria!</div>':vics.map(v=>`<div class="victory-item"><span class="vi-date">${v.date}</span><span class="vi-text">${v.text}</span></div>`).join('');
}

/* ─────────────────────────────────────────
   JULIANS AI
───────────────────────────────────────── */
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
    container.innerHTML=`<div class="ai-welcome"><div class="ai-welcome-icon">🧠</div><h3>Sóc Julians AI</h3><p>El teu assistent personal intel·ligent. Pregunta'm qualsevol cosa!</p></div>`;
    return;
  }
  container.innerHTML=chat.messages.map(m=>`<div class="ai-msg ${m.role}"><div class="ai-msg-bubble">${m.content.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}</div></div>`).join('');
  container.scrollTop=container.scrollHeight;
}
function setAIMode(mode) {
  _aiMode=mode;
  document.querySelectorAll('.ai-mode-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('mode-'+mode)?.classList.add('active');
  const labels={rapid:'⚡ Respostes concises',extens:'📝 Respostes detallades',profund:'🔬 Anàlisi profunda',estudi:'📚 Mode estudi'};
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
  typing.innerHTML='<div class="ai-msg-bubble">💭 Pensant...</div>';
  if(container){container.appendChild(typing);container.scrollTop=container.scrollHeight;}
  try {
    const response=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:(()=>{const k=localStorage.getItem('jomaxpath_anthropic_key');const h={'Content-Type':'application/json','anthropic-dangerous-direct-browser-access':'true'};if(k)h['x-api-key']=k;return h;})(),
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1024,system:_buildSystemPrompt(),messages:chat.messages.slice(-10).map(m=>({role:m.role,content:m.content}))})
    });
    if(!response.ok){const err=await response.json().catch(()=>({error:{message:response.statusText}}));throw new Error(err.error?.message||response.statusText);}
    const data=await response.json();
    const reply=data.content?.[0]?.text||'Error en la resposta.';
    if(container&&typing.parentNode) container.removeChild(typing);
    _chats=get(CHATS_KEY,[]); chat=_chats.find(c=>c.id===_currentChatId);
    if(chat){chat.messages.push({role:'assistant',content:reply,ts:Date.now()});set(CHATS_KEY,_chats);}
  } catch {
    if(container&&typing.parentNode) container.removeChild(typing);
    _chats=get(CHATS_KEY,[]); chat=_chats.find(c=>c.id===_currentChatId);
    if(chat){chat.messages.push({role:'assistant',content:`⚠️ No s'ha pogut connectar. Comprova que has afegit la clau API d'Anthropic a la Configuració → IA.`,ts:Date.now()});set(CHATS_KEY,_chats);}
  }
  _attachment=null;
  const docPrev=document.getElementById('ai-doc-preview'); if(docPrev) docPrev.style.display='none';
  renderMessages();
}
function _buildSystemPrompt() {
  const modeP={rapid:'Respon concís. Màxim 3 paràgrafs.',extens:'Respon detalladament amb exemples.',profund:'Analitza en profunditat, pros i contres.',estudi:`Submode ${_estudiSub}.`};
  const tasks=get(TASKS_KEY,[]).filter(t=>!t.done).slice(0,3).map(t=>t.name).join(', ');
  const hero=get('jomaxpath_hero_v2',null);
  return `Ets Julians AI, l'assistent personal de JOmaxPath creat per JOmax. Intel·ligent, directe i motivador. Parles en català informal.${hero?` Usuari: ${hero.name}, NV.${hero.level}.`:''}${tasks?` Tasques: ${tasks}.`:''}
Mode: ${modeP[_aiMode]||modeP.rapid} Data: ${new Date().toLocaleDateString('ca')}.`;
}
function clearCurrentChat() {
  if (!confirm('Netejar el xat?')) return;
  _chats=get(CHATS_KEY,[]); const chat=_chats.find(c=>c.id===_currentChatId);
  if(chat){chat.messages=[];chat.title='Nou xat';set(CHATS_KEY,_chats);} renderMessages(); showToast('🗑️ Xat netejat');
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
  aiCancelSelectMode(); renderMessages(); showToast('🗑️ Eliminats');
}
function toggleAISidebar() {
  const sb=document.getElementById('ai-sidebar'),btn=document.getElementById('ai-sidebar-toggle');
  if(sb){const open=sb.style.display!=='none';sb.style.display=open?'none':'flex';if(btn)btn.textContent=open?'▶':'◀';}
}
function handleFileAttach(input) {
  const file=input.files?.[0]; if(!file) return;
  _attachment={name:file.name};
  const prev=document.getElementById('ai-doc-preview'); if(prev) prev.style.display='flex';
  const icon=document.getElementById('ai-doc-icon'); if(icon) icon.textContent=file.name.endsWith('.pdf')?'📄':'📝';
  const name=document.getElementById('ai-doc-name'); if(name) name.textContent=file.name;
  showToast(`📎 "${file.name}" adjuntat`);
}
function removeAttachment() {
  _attachment=null;
  const prev=document.getElementById('ai-doc-preview'); if(prev) prev.style.display='none';
  const inp=document.getElementById('ai-file-input'); if(inp) inp.value='';
}

/* ─────────────────────────────────────────
   CERCA
───────────────────────────────────────── */
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
  const items=[...tasks.map(t=>({icon:'📋',label:t.name,sub:'Tasca',action:"navTo('tasques')"})),...habits.map(h=>({icon:h.icon||'🌱',label:h.name,sub:'Hàbit',action:"navTo('home')"}))];
  results.innerHTML=items.length===0?`<div class="sr-empty">Sense resultats per "${q}"</div>`:items.map(it=>`<div class="sr-item" onclick="${it.action};closeSearch()"><span class="sr-icon">${it.icon}</span><div><div class="sr-label">${it.label}</div><div class="sr-sub">${it.sub}</div></div></div>`).join('');
}

/* ─────────────────────────────────────────
   CONFIG
───────────────────────────────────────── */
function openConfig() {
  const ov=document.getElementById('config-overlay'); if(!ov) return;
  ov.style.display='flex'; renderConfigBody();
}
function closeConfig() { document.getElementById('config-overlay').style.display='none'; }
function renderConfigBody() {
  const body=document.getElementById('config-body'); if(!body) return;
  const cfg=get(CONFIG_KEY,{progressTitle:'Curs de Programació',progressTotal:9,mainGoal:"Crear la meva empresa abans de complir els 18 anys."});
  const apiKey=localStorage.getItem('jomaxpath_anthropic_key')||'';
  body.innerHTML=`
    <div style="display:flex;gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;">
      <button onclick="document.querySelectorAll('.cfg-tab').forEach(b=>b.style.background='transparent');this.style.background='rgba(124,58,237,0.2)';document.querySelectorAll('.cfg-panel').forEach(p=>p.style.display='none');document.getElementById('cfgp-general').style.display='block'" class="cfg-tab" style="flex:1;padding:9px;background:rgba(124,58,237,0.2);border:none;color:var(--text);font-size:11px;cursor:pointer;font-family:'Space Mono',monospace;">⚙️ General</button>
      <button onclick="document.querySelectorAll('.cfg-tab').forEach(b=>b.style.background='transparent');this.style.background='rgba(124,58,237,0.2)';document.querySelectorAll('.cfg-panel').forEach(p=>p.style.display='none');document.getElementById('cfgp-ia').style.display='block'" class="cfg-tab" style="flex:1;padding:9px;background:transparent;border:none;color:var(--text);font-size:11px;cursor:pointer;font-family:'Space Mono',monospace;">🔑 IA</button>
      <button onclick="document.querySelectorAll('.cfg-tab').forEach(b=>b.style.background='transparent');this.style.background='rgba(124,58,237,0.2)';document.querySelectorAll('.cfg-panel').forEach(p=>p.style.display='none');document.getElementById('cfgp-temes').style.display='block'" class="cfg-tab" style="flex:1;padding:9px;background:transparent;border:none;color:var(--text);font-size:11px;cursor:pointer;font-family:'Space Mono',monospace;">🎨 Temes</button>
    </div>
    <div id="cfgp-general" class="cfg-panel">
      <div class="cfg-section"><h4>🚀 Objectiu principal</h4><textarea id="cfg-goal" rows="3" style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px;font-size:13px;box-sizing:border-box;">${cfg.mainGoal||''}</textarea></div>
      <div class="cfg-section"><h4>📚 Nom del progrés</h4><input id="cfg-prog-title" type="text" value="${cfg.progressTitle||''}" style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px;font-size:13px;box-sizing:border-box;"/></div>
      <div class="cfg-section"><h4>🔢 Total capítols</h4><input id="cfg-prog-total" type="number" min="1" max="100" value="${cfg.progressTotal||9}" style="width:100px;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px;font-size:13px;"/></div>
      <div style="margin-top:20px;display:flex;gap:10px;">
        <button onclick="saveConfig()" style="flex:1;padding:12px;background:linear-gradient(135deg,var(--accent),var(--cyan));border:none;border-radius:12px;color:#fff;font-weight:700;cursor:pointer;font-size:14px;">✅ Guardar</button>
        <button onclick="closeConfig()" style="padding:12px 20px;background:var(--card2);border:1px solid var(--border);border-radius:12px;color:var(--muted);cursor:pointer;">Cancel·lar</button>
      </div>
    </div>
    <div id="cfgp-ia" class="cfg-panel" style="display:none;">
      <div class="cfg-section">
        <h4 style="margin-bottom:6px;">🔑 Clau API d'Anthropic</h4>
        <p style="font-size:11px;color:var(--muted);margin-bottom:10px;line-height:1.5;">Necessites una clau API d'Anthropic per usar Julians AI. <a href="https://console.anthropic.com" target="_blank" style="color:var(--accent2);">Obtén-la aquí →</a></p>
        <input id="cfg-api-key" type="password" placeholder="sk-ant-api03-..." value="${apiKey}" style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px;font-size:13px;box-sizing:border-box;font-family:'Space Mono',monospace;"/>
        <div style="margin-top:8px;display:flex;gap:8px;">
          <button onclick="saveApiKey()" style="flex:1;padding:10px;background:linear-gradient(135deg,var(--accent),var(--cyan));border:none;border-radius:10px;color:#fff;font-weight:700;cursor:pointer;font-size:13px;">💾 Guardar clau</button>
          <button onclick="document.getElementById('cfg-api-key').type=document.getElementById('cfg-api-key').type==='password'?'text':'password'" style="padding:10px 14px;background:var(--card2);border:1px solid var(--border);border-radius:10px;color:var(--muted);cursor:pointer;font-size:13px;">👁</button>
        </div>
        <div id="cfg-api-status" style="margin-top:8px;font-size:11px;color:${apiKey?'#6ee7b7':'var(--muted)'};">${apiKey?'✅ Clau guardada':'⚠️ Cap clau configurada'}</div>
      </div>
    </div>
    <div id="cfgp-temes" class="cfg-panel" style="display:none;">
      <h4 style="margin-bottom:12px;">🎨 Tria el teu tema</h4>
      <div id="cfg-themes-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;"></div>
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
  },50);
}
function saveApiKey() {
  const key=(document.getElementById('cfg-api-key')?.value||'').trim();
  if(key) { localStorage.setItem('jomaxpath_anthropic_key',key); showToast('✅ Clau API guardada!'); }
  else { localStorage.removeItem('jomaxpath_anthropic_key'); showToast('🗑️ Clau eliminada'); }
  const s=document.getElementById('cfg-api-status');
  if(s) { s.textContent=key?'✅ Clau guardada':'⚠️ Cap clau configurada'; s.style.color=key?'#6ee7b7':'var(--muted)'; }
}
function saveConfig() {
  const cfg=get(CONFIG_KEY,{});
  cfg.mainGoal=document.getElementById('cfg-goal')?.value||'';
  cfg.progressTitle=document.getElementById('cfg-prog-title')?.value||'Curs';
  cfg.progressTotal=parseInt(document.getElementById('cfg-prog-total')?.value||'9');
  set(CONFIG_KEY,cfg);
  const p=get(PROGRESS_KEY,{chapter:1,total:9,title:'Curs'});
  p.title=cfg.progressTitle; p.total=cfg.progressTotal; set(PROGRESS_KEY,p);
  const gd=document.getElementById('goal-desc'); if(gd&&cfg.mainGoal) gd.textContent=cfg.mainGoal;
  closeConfig(); renderProgress(); showToast('✅ Configuració guardada!');
}

/* ─────────────────────────────────────────
   INFO
───────────────────────────────────────── */
const INFO_DATA={
  home:{icon:'🏠',title:"Pàgina d'Inici",body:'El teu hub principal. Ratxa, hàbits, progrés i events del dia.'},
  streak:{icon:'🔥',title:'Ratxa diària',body:'Marca cada dia. Si no marques, la ratxa es trenca.'},
  habits:{icon:'🌱',title:'Hàbits diaris',body:'Els teus hàbits recurrents. Marca-les cada dia.'},
  horari:{icon:'📅',title:'Horari',body:'Calendari setmanal i mensual. Afegeix events i notes.'},
  tasques:{icon:'📋',title:'Tasques',body:'Gestiona tasques per prioritat, kanban o llistes compartides.'},
  focus:{icon:'🎯',title:'Focus',body:'Pomodoro per mantenir el focus. Completa sessions i guanya XP.'},
  pomodoro:{icon:'🍅',title:'Tècnica Pomodoro',body:'25 min treball + 5 min descans. Científicament provat.'},
  julians:{icon:'🧠',title:'Julians AI',body:"L'assistent d'intel·ligència artificial. Pregunta-li qualsevol cosa."},
  tips:{icon:'💡',title:'Consells Focus',body:'Silencia el mòbil i tanca les xarxes socials mentre treballes.'},
};
function showInfo(page) {
  const data=INFO_DATA[page]; if(!data) return;
  const ov=document.getElementById('info-tooltip-overlay'); if(!ov) return;
  const icon=document.getElementById('info-icon'),title=document.getElementById('info-title'),body=document.getElementById('info-body');
  if(icon) icon.textContent=data.icon; if(title) title.textContent=data.title; if(body) body.textContent=data.body;
  ov.style.display='flex';
}
function closeInfo() { const ov=document.getElementById('info-tooltip-overlay'); if(ov) ov.style.display='none'; }

/* ─────────────────────────────────────────
   QUICK CAPTURE
───────────────────────────────────────── */
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
  if(!text){showToast('⚠️ Escriu algo!');return;}
  if (_qcType==='tasca'){const tasks=get(TASKS_KEY,[]);tasks.push({id:Date.now().toString(),name:text,status:'todo',done:false,prio:3,created:Date.now()});set(TASKS_KEY,tasks);showToast('✅ Tasca capturada!');}
  else if(_qcType==='nota'){const notes=get(NOTES_KEY,[]);notes.unshift({id:Date.now().toString(),text,created:Date.now()});set(NOTES_KEY,notes);showToast('📝 Nota guardada!');}
  else if(_qcType==='habit'){const habits=get(HABITS_KEY,[]);habits.push({name:text,icon:'⭐',days:[],created:Date.now()});set(HABITS_KEY,habits);showToast('🌱 Hàbit afegit!');}
  document.getElementById('qc-input').value=''; closeQuickCapture(); renderHome(); renderTasques();
}
function toggleNotePicker() { navTo('notes'); lsbMobileClose(); }
function createNote() { openQuickCapture(); setQCType('nota'); }
function renderNotes() {
  const list=document.getElementById('notes-page-list'); if(!list) return;
  const notes=get(NOTES_KEY,[]);
  if(notes.length===0){list.innerHTML='<div style="text-align:center;color:var(--muted);padding:48px 0;"><div style="font-size:40px;margin-bottom:12px;">📝</div><div style="font-size:14px;">Sense notes. Afegeix-ne una!</div></div>';return;}
  list.innerHTML=notes.map((n,i)=>`
    <div class="note-card" style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;gap:8px;position:relative;transition:border-color 0.2s;" onmouseover="this.style.borderColor='rgba(167,139,250,0.4)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="font-size:9px;color:var(--muted);font-family:'Space Mono',monospace;letter-spacing:1px;">${new Date(n.created||Date.now()).toLocaleDateString('ca',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
      <div class="note-text-edit" contenteditable="true" style="font-size:14px;color:var(--text);line-height:1.6;outline:none;min-height:24px;" onblur="saveNoteEdit(${i},this.textContent)">${n.text||''}</div>
      <button onclick="deleteNote(${i})" style="position:absolute;top:10px;right:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#fca5a5;border-radius:7px;padding:3px 9px;font-size:11px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.25)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">✕</button>
    </div>`).join('');
}
function saveNoteEdit(idx,text) {
  const notes=get(NOTES_KEY,[]); if(!notes[idx]) return;
  notes[idx].text=text.trim()||notes[idx].text; set(NOTES_KEY,notes);
}
function deleteNote(idx) {
  const notes=get(NOTES_KEY,[]); notes.splice(idx,1); set(NOTES_KEY,notes); renderNotes(); showToast('🗑️ Nota eliminada');
}
function addNewNote() {
  const notes=get(NOTES_KEY,[]); notes.unshift({id:Date.now().toString(),text:'Nova nota...',created:Date.now()}); set(NOTES_KEY,notes); renderNotes();
  setTimeout(()=>{ const cards=document.querySelectorAll('.note-text-edit'); if(cards[0]){cards[0].focus();const r=document.createRange();r.selectNodeContents(cards[0]);r.collapse(false);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(r);} },100);
}

/* ─────────────────────────────────────────
   SHORTCUTS / DEV
───────────────────────────────────────── */
function openShortcuts() { const ov=document.getElementById('shortcuts-overlay'); if(ov) ov.style.display='flex'; }
function closeShortcuts() { const ov=document.getElementById('shortcuts-overlay'); if(ov) ov.style.display='none'; }
function openDevMode() { const ov=document.getElementById('dev-modal-overlay'); if(ov) ov.style.display='flex'; }
function closeDevMode() { const ov=document.getElementById('dev-modal-overlay'); if(ov) ov.style.display='none'; }
function submitDevMode() {
  const email=document.getElementById('dev-email')?.value;
  const pass=document.getElementById('dev-pass')?.value;
  const err=document.getElementById('dev-error');
  if (email==='dev@jomaxpath.com'&&pass==='JOmax2024!') {
    if(err) err.textContent=''; showToast('✅ Mode Dev activat!'); setTimeout(closeDevMode,1500);
  } else { if(err) err.textContent='⚠️ Credencials incorrectes'; }
}

/* ─────────────────────────────────────────
   KEYBOARD SHORTCUTS
───────────────────────────────────────── */
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  if(e.key==='/'&&!e.ctrlKey){e.preventDefault();openSearch();}
  if(e.key==='q'||e.key==='Q'){e.preventDefault();openQuickCapture();}
  if(e.key==='Escape'){
    closeSearch();closeQuickCapture();closeInfo();closeConfig();closeShortcuts();
    closeClockFullscreen();closeDayModal();closeMonthModal();closeTaskDetail();
    const drawer=document.getElementById('nav-drawer');
    if(drawer?.classList.contains('open')) toggleDrawer();
  }
  if(e.key==='?'&&e.shiftKey) openShortcuts();
});

/* ─────────────────────────────────────────
   MISC
───────────────────────────────────────── */
window.goToHero    = ()=>window.open('hero.html','_self');
window.goToPricing = ()=>window.open('pricing.html','_self');
const THEMES_DATA=[
  {id:'default', name:'Fosc', bg:'#060610', accent:'#7c3aed', dot1:'#060610', dot2:'#7c3aed'},
  {id:'blanc',   name:'Blanc', bg:'#f0f2f8', accent:'#7c3aed', dot1:'#f0f2f8', dot2:'#7c3aed'},
  {id:'ocean',   name:'Oceà', bg:'#030f1f', accent:'#0ea5e9', dot1:'#030f1f', dot2:'#0ea5e9'},
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
  renderThemesGrid(); showToast('🎨 Tema '+THEMES_DATA.find(t=>t.id===id)?.name+' activat!');
}
function applyStoredTheme() {
  const cfg=get(CONFIG_KEY,{}); const id=cfg.theme||'default';
  if(id!=='default') document.body.classList.add('theme-'+id);
}
function setLayoutMode(mode) {
  const cfg=get(CONFIG_KEY,{}); cfg.layout=mode; set(CONFIG_KEY,cfg);
  const homeLeft=document.querySelector('.home-col-left');
  const homeRight=document.querySelector('.home-col-right');
  const twoCol=document.querySelector('.home-two-col');
  if(mode==='ample') {
    if(twoCol) twoCol.style.cssText='display:flex!important;flex-direction:column!important;';
    if(homeLeft) homeLeft.style.width='100%';
    if(homeRight) homeRight.style.width='100%';
  } else {
    if(twoCol) twoCol.style.cssText='';
    if(homeLeft) homeLeft.style.width='';
    if(homeRight) homeRight.style.width='';
  }
  document.querySelectorAll('.ndw-view-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('ndw-layout-'+mode)?.classList.add('active');
  showToast('Vista: '+mode);
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  const arc=document.getElementById('pomo-arc');
  if(arc) arc.style.strokeDasharray=2*Math.PI*80;
  applyConfig();
  applyStoredTheme();
  renderThemesGrid();
  navTo('home');
  try {
    const h=JSON.parse(localStorage.getItem('jomaxpath_hero_v2'));
    if(h){
      const nameEl=document.getElementById('lsb-hero-name'); if(nameEl) nameEl.textContent=h.name||'El teu heroi';
      const lvlEl=document.getElementById('lsb-lvl-num'); if(lvlEl) lvlEl.textContent=h.level||1;
    }
  } catch {}
  console.log('%cJOmaxPath app.js v3.0 ✓','color:#7c3aed;font-weight:bold;font-size:14px;');
});
