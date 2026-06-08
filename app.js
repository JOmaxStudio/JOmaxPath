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
  if (btn) btn.textContent = _clockShowSeconds ? "⏱ Amagar segons" : "⏱ Mostrar segons";
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
/* ─────────────────────────────────────────
   AUTH — Sistema complet amb Supabase
   - Pseudònim, sessió persistent, cloud sync
   - Compartir tasques/kanban i herois
───────────────────────────────────────── */
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
      'https://fcoitcesjyjkfcqwrblm.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjb2l0Y2Vzanlqa2ZjcXdyYmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MDUwNDQsImV4cCI6MjA4ODE4MTA0NH0.bvwDg2ThL4HivusLJEUhbV9VdJ7VAuHwE2CtCE0oZ3w',
      { auth: { persistSession: true, autoRefreshToken: true } }
    );
    // Test connectivity — any HTTP response means server is reachable
    Promise.race([
      fetch('https://fcoitcesjyjkfcqwrblm.supabase.co/auth/v1/health'),
      new Promise((_,rej) => setTimeout(()=>rej(new Error('ping-timeout')), 5000))
    ]).then(() => { /* got HTTP response = server is up */ })
      .catch(() => { _supabaseOffline = true; _updateServerStatusIndicator(); });
  }
} catch {}

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
    if (emailEl) emailEl.textContent = '👤 ' + display;
    if (indicator) indicator.style.display = 'flex';
    if (loginBtn) loginBtn.style.display = 'none';
    if (localWarn) localWarn.style.display = 'none';
    // Sync username to hero
    if (p?.username) {
      const heroData = get('jomaxpath_hero_v2', null);
      if (heroData && heroData.name === 'Heroi en Construcció') {
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
}

async function authWithGoogle() {
  if (!_supabase) {
    const msg = document.getElementById('auth-msg');
    if (msg) msg.textContent = '⚠️ Necessites connexió per iniciar sessió amb Google';
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
            <div style="color:#fcd34d;font-weight:700;margin-bottom:6px;">⚙️ GOOGLE NO ESTÀ ACTIVAT AL SUPABASE</div>
            <div style="color:#e2e8f0;opacity:0.85;">Cal que vagis al Supabase Dashboard:<br>
            <b>Authentication → Providers → Google → Enable</b><br>
            <span style="opacity:0.6;font-size:10px;">Veure instruccions a supabase-setup.sql</span></div>
          </div>`;
        } else {
          msg.textContent = '❌ Error: ' + error.message;
        }
      }
      if (btn) { btn.innerHTML = getSvgGoogle() + ' CONTINUAR AMB GOOGLE'; btn.disabled = false; }
    }
  } catch(e) {
    const msg = document.getElementById('auth-msg');
    if (msg) msg.textContent = '❌ No s\'ha pogut connectar amb Google';
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
  if (!email||!pass) { if(msg) msg.textContent='⚠️ Omple tots els camps'; return; }
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
      showToast('✅ Sessió local: ' + (local.username || email.split('@')[0]));
      renderHome(); return;
    } else {
      if(btn){btn.textContent='ENTRAR';btn.disabled=false;}
      if(msg) msg.textContent='⚠️ Servidor no disponible. Usa "Continuar sense compte" per mode local.';
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
        if(msg) msg.textContent='❌ '+_translateAuthError(error.message);
        return;
      }
      _currentUser = data.user;
      await _loadUserProfile(data.user.id);
      await _syncUserData(data.user.id);
      if (!remember) { setTimeout(()=>{ _supabase?.auth.signOut().catch(()=>{}); }, 200); }
      loggedIn = true;
    } catch(e) {
      // Network error or timeout — try local account fallback
      const local = _getLocalProfile();
      if (local && local.email === email) {
        // Match local account by email (no password check in local mode)
        _currentUser = {id: local.id, email: local.email};
        _userProfile = local;
        loggedIn = true;
        if(msg) msg.textContent='';
      } else {
        if(btn){btn.textContent='ENTRAR';btn.disabled=false;}
        if(msg) msg.textContent='❌ Sense connexió. Comprova internet o usa "Continuar sense compte".';
        return;
      }
    }
  } else {
    // No Supabase — local login by email match
    const local = _getLocalProfile();
    if (local && local.email === email) {
      _currentUser = {id: local.id, email};
      _userProfile = local;
      loggedIn = true;
    } else {
      if(btn){btn.textContent='ENTRAR';btn.disabled=false;}
      if(msg) msg.textContent='❌ No s\'ha trobat cap compte amb aquest correu en mode local.';
      return;
    }
  }

  if(btn){btn.textContent='ENTRAR';btn.disabled=false;}
  if (loggedIn) {
    _hideAuthOverlay();
    _updateAuthUI();
    showToast('✅ Benvingut/da, '+(_userProfile?.username||email.split('@')[0])+'!');
    renderHome();
  }
}

async function authRegister() {
  const username = (document.getElementById('auth-reg-username')?.value||'').trim();
  const email    = (document.getElementById('auth-reg-email')?.value||'').trim();
  const pass     = document.getElementById('auth-reg-password')?.value||'';
  const msg = document.getElementById('auth-msg');
  if (!username) { if(msg) msg.textContent='⚠️ Escriu un pseudònim'; return; }
  if (username.length<3) { if(msg) msg.textContent='⚠️ Pseudònim mínim 3 caràcters'; return; }
  if (!email||!pass) { if(msg) msg.textContent='⚠️ Omple tots els camps'; return; }
  if (pass.length<6) { if(msg) msg.textContent='⚠️ Contrasenya mínima 6 caràcters'; return; }
  const btn = document.getElementById('auth-reg-btn');
  if(btn) { btn.textContent='Creant compte...'; btn.disabled=true; }

  let registered = false;

  // If server known offline, create local account directly
  if (_supabaseOffline) {
    _currentUser = {id: 'local_' + Date.now(), email};
    const profile = {id: _currentUser.id, email, username, avatar: '⚔️', created: Date.now(), isLocal: true};
    _userProfile = profile; _saveLocalProfile(profile);
    if(btn){btn.textContent='CREAR COMPTE';btn.disabled=false;}
    _hideAuthOverlay(); _updateAuthUI();
    showToast('🎉 Compte local creat: ' + username + ' (es sincronitzarà quan el servidor estigui disponible)');
    renderHome(); return;
  }

  if (_supabase) {
    try {
      const {data,error} = await Promise.race([
        _supabase.auth.signUp({email,password:pass,options:{data:{username}}}),
        new Promise((_,rej) => setTimeout(()=>rej(new Error('timeout')), 8000))
      ]);
      if (error) {
        if(btn){btn.textContent='CREAR COMPTE';btn.disabled=false;}
        if(msg) msg.textContent='❌ '+_translateAuthError(error.message);
        return;
      }
      _currentUser = data.user || {id:'sb_'+Date.now(),email};
      const profile = {id:_currentUser.id,email,username,avatar:'⚔️',created:Date.now()};
      _userProfile = profile; _saveLocalProfile(profile);
      // Best-effort cloud saves (don't block or fail if tables don't exist)
      _supabase.from('profiles').upsert({id:_currentUser.id,username,email,avatar:'⚔️',hero_xp:0,hero_level:1}).catch(()=>{});
      _saveUserDataToCloud(_currentUser.id).catch(()=>{});
      registered = true;
    } catch(e) {
      // Network/timeout — create local account as fallback
      if(msg) msg.textContent='⚠️ Sense connexió. Creant compte local...';
      await new Promise(r=>setTimeout(r,800));
      _currentUser = {id:'local_'+Date.now(),email};
      const profile = {id:_currentUser.id,email,username,avatar:'⚔️',created:Date.now(),isLocal:true};
      _userProfile = profile; _saveLocalProfile(profile);
      registered = true;
    }
  } else {
    // No Supabase — local account
    _currentUser = {id:'local_'+Date.now(),email};
    const profile = {id:_currentUser.id,email,username,avatar:'⚔️',created:Date.now(),isLocal:true};
    _userProfile = profile; _saveLocalProfile(profile);
    registered = true;
  }

  if(btn){btn.textContent='CREAR COMPTE';btn.disabled=false;}
  if (registered) {
    _hideAuthOverlay();
    _updateAuthUI();
    showToast('🎉 Benvingut/da, '+username+'! Compte creat correctament.');
    renderHome();
  }
}

function _translateAuthError(msg) {
  const map = {
    'Invalid login credentials': 'Correu o contrasenya incorrectes',
    'Email not confirmed': '📧 Has de confirmar el correu. Revisa la safata d\'entrada i fes clic a l\'enllaç',
    'User already registered': 'Ja existeix un compte amb aquest correu',
    'Password should be at least 6 characters': 'Contrasenya mínima 6 caràcters',
    'Unable to validate email address': 'Correu electrònic invàlid',
    'timeout': 'Temps esgotat. Comprova la connexió.',
    'Failed to fetch': 'No s\'ha pogut connectar. Comprova internet.',
    'Load failed': 'No s\'ha pogut connectar. Comprova internet.',
    'fetch': 'Error de xarxa. Comprova la connexió.',
    'NetworkError': 'Error de xarxa. Comprova la connexió.',
    'over_email_send_rate_limit': 'Massa intents. Espera uns minuts.',
    'For security purposes': 'Per seguretat, espera uns minuts i torna a intentar-ho.',
    'signup_disabled': 'El registre està temporalment desactivat.',
  };
  for (const [k,v] of Object.entries(map)) { if (msg.includes(k)) return v; }
  return msg;
}

async function authLogout() {
  if (!confirm('Tancar sessió?')) return;
  // Atura intervals per evitar memory leaks
  if (window._autoSaveInterval) { clearInterval(window._autoSaveInterval); window._autoSaveInterval = null; }
  if (_supabase) { try { await _supabase.auth.signOut(); } catch{} }
  _currentUser = null; _userProfile = null; _saveLocalProfile(null);
  closeConfig();
  _updateAuthUI();
  showToast('👋 Sessió tancada');
  // Reinicia l'auto-save quan es torni a fer login
  setTimeout(showAuthOverlay, 500);
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
        _userProfile = {id:data.id,email:data.email||'',username:data.username,avatar:data.avatar||'⚔️'};
        _saveLocalProfile(_userProfile); return;
      }
    } catch{}
  }
  // Fallback: local profile or derive from user object
  const local = _getLocalProfile();
  if (local && (local.id===userId || local.email===_currentUser?.email)) { _userProfile = local; return; }
  _userProfile = {id:userId,email:_currentUser?.email||'',
    username:_currentUser?.user_metadata?.username||_currentUser?.email?.split('@')[0]||'Usuari',avatar:'⚔️'};
  _saveLocalProfile(_userProfile);
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
      ['jomaxpath_tasks','jomaxpath_schedule','jomaxpath_habits_v2','jomaxpath_streak_v2',
       'jomaxpath_progress_v1','jomaxpath_pomo_v2','jomaxpath_boards_v1','jomaxpath_chats_v2',
       'jomaxpath_config_v1','jomaxpath_victories_v1','jomaxpath_notes_v1','jomaxpath_hero_v2'].forEach(k=>{
        if(d[k]) try { localStorage.setItem(k,JSON.stringify(d[k])); } catch{}
      });
      showToast('☁️ Dades sincronitzades!');
    }
  } catch{} // Silently ignore — tables may not exist yet
}

async function _saveUserDataToCloud(userId) {
  if (!_supabase||!userId||userId.startsWith('local_')) return;
  try {
    const data = {};
    ['jomaxpath_tasks','jomaxpath_schedule','jomaxpath_habits_v2','jomaxpath_streak_v2',
     'jomaxpath_progress_v1','jomaxpath_pomo_v2','jomaxpath_boards_v1','jomaxpath_chats_v2',
     'jomaxpath_config_v1','jomaxpath_victories_v1','jomaxpath_notes_v1','jomaxpath_hero_v2'].forEach(k=>{
      try { const v=localStorage.getItem(k); if(v) data[k]=JSON.parse(v); } catch{}
    });
    await Promise.race([
      _supabase.from('user_data').upsert({user_id:userId,data,updated:new Date().toISOString()}),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('t/o')),6000))
    ]);
    const hero = get('jomaxpath_hero_v2',null);
    if (hero) _supabase.from('profiles').update({hero_xp:hero.xp||0,hero_level:hero.level||1,avatar:hero.avatar||'⚔️'}).eq('id',userId).catch(()=>{});
  } catch{} // Silently ignore
}

// Auto-save every 90s when logged in
window._autoSaveInterval = setInterval(()=>{ if(_currentUser?.id&&_supabase) _saveUserDataToCloud(_currentUser.id); },90000);

/* ── Share boards ── */
async function shareBoard(boardId) {
  if (!_currentUser) { showToast('⚠️ Necessites un compte per compartir'); return; }
  const boards = get(BOARDS_KEY,[]);
  const board = boards.find(b=>b.id===boardId); if (!board) { showToast('⚠️ Llista no trobada'); return; }
  // Show share modal
  _pendingShareBoardId = boardId;
  const modal = document.getElementById('share-board-modal-overlay');
  if (modal) {
    document.getElementById('sbi-board-name').textContent = board.name;
    document.getElementById('sbi-username-inp').value = '';
    document.getElementById('sbi-msg').textContent = '';
    modal.style.display = 'flex';
  }
}

let _pendingShareBoardId = null;

async function shareBoardByCode() {
  const boardId = _pendingShareBoardId; if (!boardId) return;
  const boards = get(BOARDS_KEY,[]);
  const board = boards.find(b=>b.id===boardId); if (!board) return;
  if (!_supabase) { showToast('⚠️ Necessites connexió'); return; }
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
    showToast('📋 Codi copiat: '+shareCode);
    closeShareBoardModal(); renderSharedBoards();
  } catch { showToast('❌ Error generant codi'); }
}

function closeShareBoardModal() {
  const modal = document.getElementById('share-board-modal-overlay');
  if (modal) modal.style.display = 'none';
  _pendingShareBoardId = null;
}

/* Cerca robusta d'usuari per username o email prefix */
async function _findUserProfile(target) {
  if (!_supabase || !target) return null;
  const t = target.trim().toLowerCase();
  // 1) Match exacte case-insensitive
  let {data} = await _supabase.from('profiles').select('id,username,avatar,hero_level').ilike('username', t).maybeSingle();
  if (data) return data;
  // 2) Match parcial (comença amb)
  const {data: partial} = await _supabase.from('profiles').select('id,username,avatar,hero_level').ilike('username', t+'%').limit(1).maybeSingle();
  if (partial) return partial;
  // 3) Match per email prefix (si l'usuari escriu la part de l'email)
  const {data: byEmail} = await _supabase.from('profiles').select('id,username,avatar,hero_level').ilike('email', t+'%').limit(1).maybeSingle();
  return byEmail || null;
}

async function sendBoardInviteByUsername() {
  const inp = document.getElementById('sbi-username-inp');
  const msg = document.getElementById('sbi-msg');
  const target = (inp?.value||'').trim();
  if (!target) { if(msg) msg.textContent = '⚠️ Escriu el pseudònim'; return; }
  const boardId = _pendingShareBoardId; if (!boardId) return;
  const boards = get(BOARDS_KEY,[]);
  const board = boards.find(b=>b.id===boardId); if (!board) return;
  const myUsername = _userProfile?.username || 'Usuari';

  if (!_supabase) { if(msg) msg.textContent = '⚠️ Necessites connexió'; return; }
  if(msg) { msg.textContent = '🔍 Cercant...'; msg.style.color='var(--muted)'; }
  try {
    // Cerca robusta
    const targetProfile = await _findUserProfile(target);
    if (!targetProfile) { if(msg){ msg.textContent = '❌ Usuari "'+target+'" no trobat. Comprova que l\'altre usuari ha iniciat sessió almenys un cop.'; msg.style.color='#fca5a5'; } return; }

    // Save board to shared_boards
    const shareCode = 'BRD_'+boardId.slice(-6).toUpperCase()+'_'+Date.now().toString(36).toUpperCase().slice(-4);
    await _supabase.from('shared_boards').upsert({
      code: shareCode, owner_id: _currentUser.id,
      owner_name: myUsername, board_data: board, updated: new Date().toISOString()
    });

    // Send invite notification
    const {error} = await _supabase.from('board_invites').insert({
      board_code: shareCode, board_name: board.name,
      from_username: myUsername, to_username: targetProfile.username,
      invite_type: 'username', status: 'pending',
      created_at: new Date().toISOString()
    });
    if (error) { if(msg) msg.textContent = '❌ '+error.message; return; }
    if(msg) msg.textContent = '✅ Invitació enviada a '+targetProfile.username+'!';
    if(inp) inp.value = '';
    showToast('📨 Invitació enviada a '+targetProfile.username+'!');
  } catch(e) { if(msg) msg.textContent = '❌ Error de connexió'; }
}

async function updateSharedTabBadge() {
  const badge = document.getElementById('shared-tab-badge');
  if (!badge||!_supabase||!_userProfile?.username) { if(badge) badge.style.display='none'; return; }
  try {
    const {count} = await _supabase.from('board_invites').select('id',{count:'exact',head:true}).eq('to_username',_userProfile.username).eq('status','pending');
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
      .select('*').eq('to_username', _userProfile.username).eq('status','pending');
    if (!data||data.length===0) { section.style.display='none'; updateSharedTabBadge(); return; }
    section.style.display = 'block';
    list.innerHTML = data.map(inv=>`
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.25);border-radius:10px;margin-bottom:6px;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:700;">${inv.board_name}</div>
          <div style="font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);margin-top:2px;">De: ${inv.from_username}</div>
        </div>
        <button onclick="acceptBoardInvite('${inv.id}','${inv.board_code}')" style="padding:7px 12px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);color:#6ee7b7;border-radius:8px;font-family:'Space Mono',monospace;font-size:9px;cursor:pointer;">✓ UNIR-SE</button>
        <button onclick="rejectBoardInvite('${inv.id}')" style="padding:7px 10px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;border-radius:8px;font-size:10px;cursor:pointer;">✕</button>
      </div>`).join('');
    updateSharedTabBadge();
  } catch { section.style.display='none'; }
}

async function acceptBoardInvite(inviteId, boardCode) {
  if (!_supabase) return;
  try {
    const {data} = await _supabase.from('shared_boards').select('*').eq('code',boardCode).single();
    if (!data) { showToast('❌ Llista no trobada'); return; }
    const boards = get(BOARDS_KEY,[]);
    if (!boards.find(b=>b.shareCode===boardCode)) {
      boards.push({...data.board_data, sharedWith:true, ownerName:data.owner_name, shareCode:boardCode});
      set(BOARDS_KEY, boards);
    }
    await _supabase.from('board_invites').update({status:'accepted'}).eq('id',inviteId);
    showToast('✅ Llista de '+data.owner_name+' afegida!');
    loadBoardInvites(); renderSharedBoards?.();
  } catch { showToast('❌ Error acceptant'); }
}

async function rejectBoardInvite(inviteId) {
  if (!_supabase) return;
  try { await _supabase.from('board_invites').update({status:'rejected'}).eq('id',inviteId); } catch {}
  showToast('👋 Invitació rebutjada');
  loadBoardInvites();
  updateSharedTabBadge();
}

async function joinSharedBoard(code) {
  const cleanCode = (code||'').trim().toUpperCase();
  if (!cleanCode.startsWith('BRD_')) { showToast('⚠️ Codi invàlid (ha de començar amb BRD_)'); return; }
  if (!_supabase) { showToast('⚠️ Necessites connexió per unir-te'); return; }
  try {
    const {data, error} = await _supabase.from('shared_boards').select('*').eq('code', cleanCode).maybeSingle();
    if (error) { showToast('❌ Error: '+error.message); return; }
    if (!data) { showToast('❌ Codi «'+cleanCode+'» no trobat. Comprova que el codi sigui correcte.'); return; }
    const boards = get(BOARDS_KEY,[]);
    if (boards.find(b=>b.shareCode===cleanCode)) { showToast('⚠️ Ja tens aquesta llista'); return; }
    const joined = {...(data.board_data||{}), sharedWith:true, ownerName:data.owner_name, shareCode:cleanCode};
    boards.push(joined); set(BOARDS_KEY,boards);
    const inp = document.getElementById('join-board-code-inp');
    if (inp) inp.value = '';
    showToast('✅ Llista de '+data.owner_name+' afegida!');
    renderSharedBoards?.();
  } catch(e) { showToast('❌ Error carregant llista: '+(e.message||e)); }
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

  // No Supabase available — go local immediately
  if (!_supabase) {
    const local = _getLocalProfile();
    if (local?.username) { _currentUser={id:local.id,email:local.email}; _userProfile=local; _updateAuthUI(); }
    authSkip(); return;
  }

  // Always set up auth state listener first (handles OAuth callback too)
  _supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      _currentUser = session.user;
      // Garantir que el perfil existeix a Supabase (important per Google OAuth)
      try {
        const u = session.user;
        const autoUsername = (u.user_metadata?.full_name || u.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_.]/g,'').slice(0,24) || 'user_' + u.id.slice(-6);
        await _supabase.from('profiles').upsert({
          id: u.id,
          email: u.email || '',
          username: autoUsername,
          avatar: '⚔️',
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
      showToast('✅ Benvingut/da, ' + (_userProfile?.username || session.user.email?.split('@')[0]) + '!');
    } else if (event === 'SIGNED_OUT') {
      _currentUser = null; _userProfile = null;
      _updateAuthUI();
    } else if (event === 'TOKEN_REFRESHED' && session?.user) {
      _currentUser = session.user;
      _updateAuthUI();
    }
  });

  try {
    // Timeout on session check — don't block app if network is slow/down
    const {data, error} = await Promise.race([
      _supabase.auth.getSession(),
      new Promise((_,rej) => setTimeout(()=>rej(new Error('session-timeout')), 4000))
    ]);

    if (!error && data?.session?.user) {
      _currentUser = data.session.user;
      _loadUserProfile(data.session.user.id).then(()=>_updateAuthUI()).catch(()=>{});
      _syncUserData(data.session.user.id).catch(()=>{});
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

/* ── Session reminder (non-intrusive banner) ── */
function _showSessionReminder() {
  if (_currentUser) return; // already logged in
  const existing = document.getElementById('session-reminder');
  if (existing) return;
  const banner = document.createElement('div');
  banner.id = 'session-reminder';
  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
      <span style="font-size:16px;">⚠️</span>
      <div>
        <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:#fcd34d;">MODE LOCAL</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:1px;">Les dades no es sincronitzen. Inicia sessió per no perdre res.</div>
      </div>
    </div>
    <button onclick="showAuthOverlay();document.getElementById('session-reminder')?.remove()" style="padding:6px 14px;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.4);border-radius:8px;color:#a78bfa;cursor:pointer;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1px;white-space:nowrap;">INICIAR SESSIÓ</button>
    <button onclick="this.parentElement.remove()" style="padding:6px 10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:rgba(255,255,255,0.3);cursor:pointer;font-size:13px;">✕</button>
  `;
  banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;background:rgba(6,6,16,0.96);border:1px solid rgba(245,158,11,0.3);border-radius:14px;padding:12px 16px;z-index:8000;box-shadow:0 8px 32px rgba(0,0,0,0.5);width:min(480px,92vw);backdrop-filter:blur(16px);';
  document.body.appendChild(banner);
  // Auto-dismiss after 8s
  setTimeout(() => banner.remove(), 8000);
}


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

function renderHomeHeader() {
  const h = new Date().getHours();
  const greetingBase = h < 12 ? 'Bon dia' : h < 18 ? 'Bona tarda' : 'Bona nit';
  const emoji = h < 12 ? '👋' : h < 18 ? '💪' : '🌙';
  const username = _userProfile?.username || '';
  // Salutació amb nom d'usuari
  const grEl = document.getElementById('home-greeting');
  if(grEl) grEl.textContent = username
    ? `${greetingBase}, ${username.charAt(0).toUpperCase()+username.slice(1)} ${emoji}`
    : `${greetingBase} ${emoji}`;
  // Data en chip
  const dateEl = document.getElementById('home-date-display');
  if(dateEl) {
    const now = new Date();
    const opts = {weekday:'short', day:'numeric', month:'short'};
    dateEl.textContent = now.toLocaleDateString('ca-ES', opts);
  }
  // Data
  const dateEl = document.getElementById('home-date-display');
  if(dateEl) dateEl.textContent = new Date().toLocaleDateString('ca',{weekday:'long',day:'numeric',month:'long'});
  // Stats
  const today = new Date().toISOString().slice(0,10);
  const streak = get('jomaxpath_streak_v1',{count:0});
  const habits = get(HABITS_KEY,[]);
  const doneH = habits.filter(h=>(h.days||[]).includes(today)).length;
  const tasks = get(TASKS_KEY,[]).filter(t=>!t.done).length;
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
  if (title)   title.innerHTML=`<span style="font-size:16px;margin-right:8px;">🎯</span>${p.title||'El meu objectiu'}`;
  if (frac)    frac.textContent=`${pct}% completat`;
  if (fill)    fill.style.width=pct+'%';
  if (moto)    moto.textContent=`PAS ${p.chapter} DE ${p.total}`;
  if (chaps)   chaps.innerHTML=Array.from({length:p.total},(_,i)=>{const n=i+1,done=n<p.chapter,curr=n===p.chapter;return `<div class="prog-chap ${done?'done':''} ${curr?'curr':''}" title="Pas ${n}">${done?'✓':n}</div>`;}).join('');
  if (congrats) congrats.textContent=p.chapter>p.total?'🎉 Objectiu assolit!':'';
}
function changeChapter(delta) {
  const p=get(PROGRESS_KEY,PROG_DEF);
  const prev=p.chapter||1;
  p.chapter=Math.max(1,Math.min(p.total+1,prev+delta));
  set(PROGRESS_KEY,p); renderProgress();
  if (delta>0 && p.chapter<=p.total) showToast('✅ Pas '+prev+' completat!');
  else if (delta>0 && p.chapter>p.total) showToast('🎉 Objectiu completat al 100%!');
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
  const goalEl=document.getElementById('goal-desc');
  if (goalEl) {
    goalEl.textContent = cfg.mainGoal && cfg.mainGoal.trim()
      ? cfg.mainGoal
      : 'Defineix el teu gran objectiu aquí. Ves a Configuració → General per personalitzar-lo.';
  }
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
function pickTimedColor() {
  // Retorna color d'accent basat en l'hora del dia
  const h=new Date().getHours();
  if (h<7)  return '#4f46e5'; // nit — índigo
  if (h<12) return '#f59e0b'; // matí — groc
  if (h<18) return '#10b981'; // tarda — verd
  return '#8b5cf6';           // vespre — porpra
}

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
function setMatchCasa(val) {
  // Guarda preferència camp local/visitant per al proper partit
  const cfg=get(CONFIG_KEY,{}); cfg.matchCasa=val; set(CONFIG_KEY,cfg);
}

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
  loadBoardInvites();
  if (boards.length===0) { grid.innerHTML='<div style="color:var(--muted);font-size:13px;padding:16px;">Crea la teva primera llista! →</div>'; return; }
  grid.innerHTML=boards.map(b=>`
    <div class="board-card">
      <div class="bc-name">${b.name}</div>
      <div class="bc-desc">${b.desc||''}</div>
      <div class="bc-meta">${(b.tasks||[]).length} tasques · ${(b.members||[]).length} membres ${b.sharedWith?'· <span style="color:var(--accent2);">compartida</span>':''}</div>
      <div style="display:flex;gap:6px;margin-top:8px;">
        ${!b.sharedWith?`<button onclick="shareBoard('${b.id}')" style="padding:5px 10px;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);color:var(--accent2);border-radius:7px;font-family:'Space Mono',monospace;font-size:8px;cursor:pointer;">📤 COMPARTIR</button>`:''}
        ${b.shareCode?`<button onclick="navigator.clipboard.writeText('${b.shareCode}').then(()=>showToast('📋 Codi copiat!'))" style="padding:5px 10px;background:rgba(0,180,216,0.1);border:1px solid rgba(0,180,216,0.25);color:#38d9f5;border-radius:7px;font-family:'Space Mono',monospace;font-size:8px;cursor:pointer;">🔗 CODI</button>`:''}
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
  document.getElementById('board-members-current').innerHTML=_boardMembers.map((m,i)=>`<span class="board-member-chip">${m} <button onclick="_boardMembers.splice(${i},1);document.getElementById('board-members-current').innerHTML=''">✕</button></span>`).join('');
}
function saveBoardModal() {
  const name=(document.getElementById('board-name-inp')?.value||'').trim(); if (!name) { showToast('⚠️ Posa un nom'); return; }
  const boards=get(BOARDS_KEY,[]);
  boards.push({id:Date.now().toString(),name,desc:document.getElementById('board-desc-inp')?.value||'',members:_boardMembers,tasks:[],created:Date.now()});
  set(BOARDS_KEY,boards); closeBoardModal(); renderSharedBoards(); showToast('✅ Llista creada!');
}
function openBoardDetail(id) {
  const boards=get(BOARDS_KEY,[]);
  const board=boards.find(b=>b.id===id);
  if (!board) { showToast('⚠️ Tauler no trobat'); return; }
  // Selecciona la vista shared i mostra el tauler
  setTasksMode('shared');
  navTo('tasques');
  showToast('📋 '+board.name);
}

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
  // Quan és idle, sempre reinicialitza els segons (fins i tot si quedava algun residu)
  if (_pomoState==='idle') _pomoSeconds=_pomoFocusMin*60;
  // Si és 'paused', continua des d'on estava — _pomoSeconds no es toca
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
  if(!texts.length){showToast('✏️ Escriu almenys una victòria!');return;}
  const weekKey=_getWeekKey(_vicWeekOffset);
  const allVics=get(VICTORIES_KEY,{});
  allVics[weekKey]={texts,date:new Date().toLocaleDateString('ca'),saved:Date.now()};
  set(VICTORIES_KEY,allVics);
  // Feedback visual
  const btn=document.querySelector('.victories-save-btn');
  if(btn){btn.textContent='✅ VICTÒRIES GUARDADES!';btn.style.background='linear-gradient(135deg,rgba(16,185,129,0.25),rgba(6,78,59,0.2))';btn.style.borderColor='rgba(16,185,129,0.5)';btn.style.color='#6ee7b7';setTimeout(()=>{btn.textContent='💾 GUARDAR VICTÒRIES';btn.style.cssText='';},2200);}
  showToast('🏆 Victòries guardades!');
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
  if(!weeks.length){list.innerHTML='<div style="color:var(--muted);font-size:12px;margin-top:8px;">Registra la teva primera victòria!</div>';return;}
  const EMOJIS=['🥇','🥈','🥉'];
  list.innerHTML=weeks.map(wk=>{
    const e=allVics[wk]; if(!e||!e.texts?.length) return '';
    const isActive=wk===weekKey;
    return `<div style="margin-top:10px;padding:10px 12px;border-radius:12px;background:${isActive?'rgba(167,139,250,0.08)':'rgba(255,255,255,0.02)'};border:1px solid ${isActive?'rgba(167,139,250,0.3)':'rgba(255,255,255,0.05)'};">
      <div style="font-family:'Space Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:6px;">${e.date||wk} ${isActive?'· <span style="color:#a78bfa;">ACTUAL</span>':''}</div>
      ${e.texts.filter(Boolean).map((t,i)=>`<div style="font-size:12px;color:var(--text);padding:2px 0;display:flex;gap:8px;align-items:flex-start;"><span style="flex-shrink:0;">${EMOJIS[i]||'✨'}</span><span>${t}</span></div>`).join('')}
    </div>`;
  }).join('');
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

async function updateUsername() {
  const inp = document.getElementById('cfg-new-username');
  const newName = (inp?.value||'').trim().toLowerCase().replace(/[^a-z0-9_.]/g,'');
  if (!newName || newName.length < 2) { showToast('⚠️ El nom ha de tenir mínim 2 caràcters (a-z, 0-9, _, .)'); return; }
  if (!_currentUser || !_supabase) { showToast('⚠️ Necessites connexió'); return; }
  try {
    const {error} = await _supabase.from('profiles').update({username: newName}).eq('id', _currentUser.id);
    if (error) { showToast('❌ Error: '+(error.message.includes('unique')?'Aquest nom ja existeix':error.message)); return; }
    if (_userProfile) { _userProfile.username = newName; _saveLocalProfile(_userProfile); }
    showToast('✅ Nom actualitzat a: '+newName);
    renderConfigBody();
    // Update hero name too
    try { const h=get('jomaxpath_hero_v2',null); if(h){h.name=newName;set('jomaxpath_hero_v2',h);} } catch {}
  } catch(e) { showToast('❌ Error de connexió'); }
}

async function forceSyncProfile() {
  if (!_currentUser || !_supabase) { showToast('⚠️ Sessió no activa'); return; }
  showToast('🔄 Sincronitzant...');
  try {
    const u = _currentUser;
    const hero = get('jomaxpath_hero_v2', null);
    const autoUsername = (_userProfile?.username) ||
      (u.user_metadata?.full_name||'').toLowerCase().replace(/[^a-z0-9_.]/g,'')||
      u.email?.split('@')[0] || 'user_'+u.id.slice(-6);
    const {error} = await _supabase.from('profiles').upsert({
      id: u.id, email: u.email||'',
      username: autoUsername,
      avatar: hero?.avatar || '⚔️',
      hero_xp: hero?.xp || 0,
      hero_level: hero ? (computeLevel ? computeLevel(hero.xp).level : 1) : 1
    }, {onConflict: 'id'});
    if (error) { showToast('❌ '+error.message); return; }
    await _loadUserProfile(u.id);
    showToast('✅ Perfil sincronitzat! Nom: '+(_userProfile?.username||autoUsername));
    renderConfigBody();
  } catch(e) { showToast('❌ Error: '+e.message); }
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
  const username = _userProfile?.username || (_currentUser?.email?.split('@')[0]) || '—';
  const email = _currentUser?.email || '—';
  body.innerHTML=`
    <div style="display:flex;gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;">
      <button onclick="document.querySelectorAll('.cfg-tab').forEach(b=>b.style.background='transparent');this.style.background='rgba(124,58,237,0.2)';document.querySelectorAll('.cfg-panel').forEach(p=>p.style.display='none');document.getElementById('cfgp-general').style.display='block'" class="cfg-tab" style="flex:1;padding:9px;background:rgba(124,58,237,0.2);border:none;color:var(--text);font-size:11px;cursor:pointer;font-family:'Space Mono',monospace;">⚙️ General</button>
      <button onclick="document.querySelectorAll('.cfg-tab').forEach(b=>b.style.background='transparent');this.style.background='rgba(124,58,237,0.2)';document.querySelectorAll('.cfg-panel').forEach(p=>p.style.display='none');document.getElementById('cfgp-ia').style.display='block'" class="cfg-tab" style="flex:1;padding:9px;background:transparent;border:none;color:var(--text);font-size:11px;cursor:pointer;font-family:'Space Mono',monospace;">🔑 IA</button>
      <button onclick="document.querySelectorAll('.cfg-tab').forEach(b=>b.style.background='transparent');this.style.background='rgba(124,58,237,0.2)';document.querySelectorAll('.cfg-panel').forEach(p=>p.style.display='none');document.getElementById('cfgp-temes').style.display='block'" class="cfg-tab" style="flex:1;padding:9px;background:transparent;border:none;color:var(--text);font-size:11px;cursor:pointer;font-family:'Space Mono',monospace;">🎨 Temes</button>
      <button onclick="document.querySelectorAll('.cfg-tab').forEach(b=>b.style.background='transparent');this.style.background='rgba(124,58,237,0.2)';document.querySelectorAll('.cfg-panel').forEach(p=>p.style.display='none');document.getElementById('cfgp-compte').style.display='block'" class="cfg-tab" style="flex:1;padding:9px;background:transparent;border:none;color:var(--text);font-size:11px;cursor:pointer;font-family:'Space Mono',monospace;">👤 Compte</button>
    </div>
    <div id="cfgp-general" class="cfg-panel">
      <div class="cfg-section" style="margin-bottom:16px;">
        <h4 style="margin-bottom:10px;">🌐 Idioma / Language / Idioma</h4>
        <div id="cfg-lang-switcher" style="display:flex;gap:8px;flex-wrap:wrap;"></div>
      </div>
      <div class="cfg-section"><h4>🚀 Objectiu principal</h4><textarea id="cfg-goal" rows="3" style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px;font-size:13px;box-sizing:border-box;">${cfg.mainGoal||''}</textarea></div>
      <div class="cfg-section"><h4>📚 Nom de l'objectiu de progrés</h4><input id="cfg-prog-title" type="text" value="${cfg.progressTitle||''}" placeholder="Ex: Aprendre guitarra, Preparar oposicions..." style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px;font-size:13px;box-sizing:border-box;"/></div>
      <div class="cfg-section"><h4>🔢 Total de passos</h4><input id="cfg-prog-total" type="number" min="1" max="100" value="${cfg.progressTotal||10}" style="width:100px;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px;font-size:13px;"/></div>
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
    </div>
    <div id="cfgp-compte" class="cfg-panel" style="display:none;">
      ${isLoggedIn ? `
      <div class="cfg-section">
        <h4 style="margin-bottom:12px;">👤 El teu compte</h4>
        <div style="display:flex;align-items:center;gap:14px;padding:14px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:12px;margin-bottom:14px;">
          <div style="width:50px;height:50px;border-radius:14px;background:linear-gradient(135deg,rgba(124,58,237,0.3),rgba(0,180,216,0.2));display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">${_userProfile?.avatar||'⚔️'}</div>
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
            <button onclick="updateUsername()" style="padding:9px 14px;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.35);border-radius:9px;color:#a78bfa;cursor:pointer;font-family:'Space Mono',monospace;font-size:9px;white-space:nowrap;">✓ DESAR</button>
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
          <button onclick="_saveUserDataToCloud(_currentUser?.id).then(()=>showToast('☁️ Dades guardades!'))" style="flex:1;padding:10px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.25);border-radius:9px;color:#6ee7b7;cursor:pointer;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1px;">☁️ GUARDAR AL NÚvOL</button>
          <button onclick="forceSyncProfile()" style="flex:1;padding:10px;background:rgba(0,180,216,0.12);border:1px solid rgba(0,180,216,0.25);border-radius:9px;color:var(--cyan2);cursor:pointer;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1px;">🔄 SINCRONITZAR PERFIL</button>
        </div>
      </div>
      <div class="cfg-section" style="border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;margin-top:4px;">
        <button onclick="authLogout()" style="width:100%;padding:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;color:#fca5a5;cursor:pointer;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:2px;transition:all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">🚪 TANCAR SESSIÓ</button>
      </div>
      ` : `
      <div class="cfg-section" style="text-align:center;padding:30px 0;">
        <div style="font-size:40px;margin-bottom:14px;">👤</div>
        <div style="font-size:14px;font-weight:700;margin-bottom:6px;">Sense compte</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:20px;line-height:1.6;">Crea un compte per guardar les teves dades al núvol i compartir llistes amb amics.</div>
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
  if(key) { localStorage.setItem('jomaxpath_anthropic_key',key); showToast('✅ Clau API guardada!'); }
  else { localStorage.removeItem('jomaxpath_anthropic_key'); showToast('🗑️ Clau eliminada'); }
  const s=document.getElementById('cfg-api-status');
  if(s) { s.textContent=key?'✅ Clau guardada':'⚠️ Cap clau configurada'; s.style.color=key?'#6ee7b7':'var(--muted)'; }
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
  if(notes.length===0){list.innerHTML='<div style="text-align:center;color:var(--muted);padding:48px 0;"><div style="font-size:40px;margin-bottom:12px;">📝</div><div style="font-size:14px;">Sense notes. Afegeix-ne una!</div></div>';return;}
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
        <button onclick="deleteNote(${i})" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.22);color:#fca5a5;border-radius:7px;padding:2px 8px;font-size:10px;cursor:pointer;flex-shrink:0;transition:all 0.15s;">✕</button>
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
    // (l'usuari ha d'usar el botó ✕ per esborrar explícitament)
    const cards=document.querySelectorAll('.note-text-edit');
    if (cards[idx]) cards[idx].textContent=notes[idx].text||'';
    return;
  }
  notes[idx].text=trimmed;
  notes[idx].updatedAt=Date.now();
  set(NOTES_KEY,notes);
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
  // Credencials comparades via hash — mai en clar al codi
  const _DEV_H='ZGV2QGpvbWF4cGF0aC5jb206Sk9tYXgyMDI0IQ==';
  const inputHash=btoa((email||'')+':'+(pass||''));
  if (inputHash===_DEV_H) {
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

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
/* ═══════════════════════════════════════════════════
   IDIOMES — sistema multi-llengua (CA / ES / EN)
═══════════════════════════════════════════════════ */
const LANG_KEY = 'jomaxpath_lang_v1';
const LANGS = {
  ca: {
    lang_name:'🐦 Català',
    // Salutacions
    greeting_morning:'Bon dia', greeting_afternoon:'Bona tarda', greeting_night:'Bona nit',
    greeting_emoji_m:'👋', greeting_emoji_a:'💪', greeting_emoji_n:'🌙',
    // Nav / sidebar
    nav_home:'Inici', nav_schedule:'Horari', nav_tasks:'Tasques', nav_notes:'Notes',
    nav_focus:'Focus', nav_hero:'Heroi', nav_ai:'Julians AI',
    // Seccions home
    sec_habits:'🌱 hàbits diaris', sec_streak:'Ratxa', sec_victories:'Victòries de la setmana',
    sec_goal:'Objectiu principal', sec_progress:'El meu objectiu', sec_today:'📍 ara mateix',
    // Stats
    stat_streak_lbl:'dies ratxa', stat_habits_lbl:'hàbits avui', stat_tasks_lbl:'tasques pend.',
    stat_pomo_lbl:'pomodoros avui',
    // Botons
    btn_save:'Guardar', btn_add:'+ Afegir', btn_cancel:'Cancel·lar',
    btn_session:'✓ SESSIÓ FETA', btn_add_habit:'+ AFEGIR',
    // Config
    cfg_title:'Configuració', cfg_general:'⚙️ General', cfg_ai:'🔑 IA',
    cfg_themes:'🎨 Temes', cfg_account:'👤 Compte',
    cfg_goal_lbl:'Objectiu principal', cfg_prog_name:'Nom de l\'objectiu',
    cfg_prog_steps:'Total de passos', cfg_save:'✅ Guardar', cfg_cancel:'Cancel·lar',
    cfg_logout:'🚪 Tancar sessió', cfg_sync:'🔄 Sincronitzar perfil',
    cfg_save_cloud:'☁️ Guardar al núvol',
    // Focus/Pomodoro
    focus_phase:'FOCUS', break_phase:'DESCANS', long_break:'DESCANS LLARG',
    // Tasques
    tasks_title:'Tasques', tasks_add:'Afegir tasca...',
    // Heroi
    hero_title:'El meu heroi',
    // Errors/missatges
    msg_saved:'✅ Guardat!', msg_error:'❌ Error'
  },
  es: {
    lang_name:'🇪🇸 Español',
    greeting_morning:'Buenos días', greeting_afternoon:'Buenas tardes', greeting_night:'Buenas noches',
    greeting_emoji_m:'👋', greeting_emoji_a:'💪', greeting_emoji_n:'🌙',
    nav_home:'Inicio', nav_schedule:'Horario', nav_tasks:'Tareas', nav_notes:'Notas',
    nav_focus:'Focus', nav_hero:'Héroe', nav_ai:'Julians AI',
    sec_habits:'🌱 hábitos diarios', sec_streak:'Racha', sec_victories:'Victorias de la semana',
    sec_goal:'Objetivo principal', sec_progress:'Mi objetivo', sec_today:'📍 ahora mismo',
    stat_streak_lbl:'días racha', stat_habits_lbl:'hábitos hoy', stat_tasks_lbl:'tareas pend.',
    stat_pomo_lbl:'pomodoros hoy',
    btn_save:'Guardar', btn_add:'+ Añadir', btn_cancel:'Cancelar',
    btn_session:'✓ SESIÓN HECHA', btn_add_habit:'+ AÑADIR',
    cfg_title:'Configuración', cfg_general:'⚙️ General', cfg_ai:'🔑 IA',
    cfg_themes:'🎨 Temas', cfg_account:'👤 Cuenta',
    cfg_goal_lbl:'Objetivo principal', cfg_prog_name:'Nombre del objetivo',
    cfg_prog_steps:'Total de pasos', cfg_save:'✅ Guardar', cfg_cancel:'Cancelar',
    cfg_logout:'🚪 Cerrar sesión', cfg_sync:'🔄 Sincronizar perfil',
    cfg_save_cloud:'☁️ Guardar en la nube',
    focus_phase:'ENFOQUE', break_phase:'DESCANSO', long_break:'DESCANSO LARGO',
    tasks_title:'Tareas', tasks_add:'Añadir tarea...',
    hero_title:'Mi héroe',
    msg_saved:'✅ Guardado!', msg_error:'❌ Error'
  },
  en: {
    lang_name:'🇬🇧 English',
    greeting_morning:'Good morning', greeting_afternoon:'Good afternoon', greeting_night:'Good evening',
    greeting_emoji_m:'👋', greeting_emoji_a:'💪', greeting_emoji_n:'🌙',
    nav_home:'Home', nav_schedule:'Schedule', nav_tasks:'Tasks', nav_notes:'Notes',
    nav_focus:'Focus', nav_hero:'Hero', nav_ai:'Julians AI',
    sec_habits:'🌱 daily habits', sec_streak:'Streak', sec_victories:'Week victories',
    sec_goal:'Main goal', sec_progress:'My goal', sec_today:'📍 right now',
    stat_streak_lbl:'day streak', stat_habits_lbl:'habits today', stat_tasks_lbl:'tasks pend.',
    stat_pomo_lbl:'pomodoros today',
    btn_save:'Save', btn_add:'+ Add', btn_cancel:'Cancel',
    btn_session:'✓ SESSION DONE', btn_add_habit:'+ ADD',
    cfg_title:'Settings', cfg_general:'⚙️ General', cfg_ai:'🔑 AI',
    cfg_themes:'🎨 Themes', cfg_account:'👤 Account',
    cfg_goal_lbl:'Main goal', cfg_prog_name:'Goal name',
    cfg_prog_steps:'Total steps', cfg_save:'✅ Save', cfg_cancel:'Cancel',
    cfg_logout:'🚪 Sign out', cfg_sync:'🔄 Sync profile',
    cfg_save_cloud:'☁️ Save to cloud',
    focus_phase:'FOCUS', break_phase:'BREAK', long_break:'LONG BREAK',
    tasks_title:'Tasks', tasks_add:'Add task...',
    hero_title:'My hero',
    msg_saved:'✅ Saved!', msg_error:'❌ Error'
  }
};
function getLang() { return localStorage.getItem(LANG_KEY) || 'ca'; }
function t(key) { return (LANGS[getLang()]||LANGS.ca)[key] || (LANGS.ca[key] || key); }
function setLanguage(lang) {
  localStorage.setItem(LANG_KEY, lang);
  applyLanguage();
  showToast('🌐 Idioma: '+(LANGS[lang]?.lang_name||lang));
}
// Mapa d'element ID → clau de traducció
const LANG_ID_MAP = {
  'pt-home-h2':        'nav_home',
  'pt-horari-h2':      'nav_schedule',
  'pt-tasques-h2':     'nav_tasks',
  'pt-focus-h2':       'nav_focus',
  'hsr-streak-lbl':    'stat_streak_lbl',
  'hsr-habits-lbl':    'stat_habits_lbl',
  'hsr-tasks-lbl':     'stat_tasks_lbl',
  'hsr-pomo-lbl':      'stat_pomo_lbl',
  'goal-title':        'sec_goal',
  'prog-title':        null, // gestionat per renderProgress
  'streak-btn':        'btn_session',
  'cfg-title-text':    'cfg_title',
};
function applyLanguage() {
  const lang = getLang();
  const map = LANGS[lang] || LANGS.ca;
  // Aplica per ID
  Object.entries(LANG_ID_MAP).forEach(([id, key]) => {
    if (!key) return;
    const el = document.getElementById(id);
    if (el && map[key]) el.textContent = map[key];
  });
  // Aplica als elements amb data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (map[key]) el.textContent = map[key];
  });
  // Actualitza botons del selector d'idioma
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const code = btn.getAttribute('data-lang-code');
    btn.style.fontWeight = code === lang ? '700' : '400';
    btn.style.background = code === lang ? 'rgba(124,58,237,0.25)' : 'transparent';
    btn.style.borderColor = code === lang ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)';
  });
  // Títol del browser
  document.title = 'JOmaxPath — ' + (map['nav_home'] || 'Inici');
  // Actualitza salutació (sense cridar renderHome sencer per evitar loops)
  if (typeof renderHomeHeader === 'function') renderHomeHeader();
  // Re-render config panel si és obert per actualitzar textos
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
  const arc=document.getElementById('pomo-arc');
  if(arc) arc.style.strokeDasharray=2*Math.PI*80;
  applyConfig();
  applyStoredTheme();
  applyLanguage();
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