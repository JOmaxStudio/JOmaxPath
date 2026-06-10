/* ═══════════════════════════════════════════════════════════════════════
   pixel-heroes.js — JOmaxPath Character Engine v2
   6 herois pixel art chibi · 10 estats animats · Canvas RAF
   ═══════════════════════════════════════════════════════════════════════ */
(function(global) {
'use strict';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const S = 2;              // scale: game px → canvas px (48×48 → 96×96)
const GW = 48, GH = 48;  // game resolution
const CW = GW * S, CH = GH * S; // canvas resolution
const CHAR_KEY = 'jomaxpath_selected_char_v2';

// ─── DRAWING PRIMITIVES ──────────────────────────────────────────────────────

function B(ctx, x, y, w, h, c) {
  if (!c || c === '.') return;
  ctx.fillStyle = c;
  ctx.fillRect(x * S, y * S, w * S, h * S);
}

function BG(ctx, x, y, w, h, grad) {
  ctx.fillStyle = grad;
  ctx.fillRect(x * S, y * S, w * S, h * S);
}

function ellipse(ctx, cx, cy, rx, ry, c, alpha) {
  ctx.save();
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx * S, cy * S, rx * S, ry * S, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function circle(ctx, cx, cy, r, c, alpha) {
  ellipse(ctx, cx, cy, r, r, c, alpha);
}

// ─── ANIMATION HELPERS ───────────────────────────────────────────────────────

function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function bounce(t) { return Math.abs(Math.sin(t * Math.PI)); }
function wave(t, amp, freq) { return amp * Math.sin(t * Math.PI * 2 * freq); }

// ─── COMMON DRAWING UTILS ────────────────────────────────────────────────────

function drawShadow(ctx, cx, scale) {
  ellipse(ctx, cx, 46, 10 * scale, 2.5, 'rgba(0,0,30,0.35)');
}

function drawEye(ctx, x, y, iris, facing) {
  // whites
  B(ctx, x,   y,   5, 4, '#FFFFFF');
  // iris
  B(ctx, x+1, y+1, 3, 2, iris);
  // pupil
  B(ctx, x+2, y+2, 1, 1, '#0A0820');
  // catchlight
  B(ctx, x+1, y+1, 1, 1, 'rgba(255,255,255,0.8)');
  // outline top
  B(ctx, x,   y-1, 5, 1, '#1A0810');
  B(ctx, x-1, y,   1, 4, '#1A0810');
  B(ctx, x+5, y,   1, 4, '#1A0810');
}

function drawEyeClosed(ctx, x, y, c) {
  B(ctx, x,   y+1, 5, 2, c || '#1A0810');
  B(ctx, x+1, y,   3, 1, c || '#1A0810');
}

function drawMouth(ctx, x, y, expr) {
  if (expr === 'happy') {
    B(ctx, x,   y,   8, 1, '#1A0810');
    B(ctx, x+1, y+1, 6, 1, '#1A0810');
    B(ctx, x,   y+1, 2, 1, '#1A0810');
    B(ctx, x+6, y+1, 2, 1, '#1A0810');
  } else if (expr === 'hurt') {
    B(ctx, x+1, y+1, 6, 1, '#1A0810');
    B(ctx, x,   y,   2, 2, '#1A0810');
    B(ctx, x+6, y,   2, 2, '#1A0810');
  } else if (expr === 'sleep') {
    B(ctx, x+1, y,   6, 1, '#1A0810');
    B(ctx, x,   y+1, 2, 1, '#1A0810');
    B(ctx, x+6, y+1, 2, 1, '#1A0810');
  } else { // neutral
    B(ctx, x+1, y,   6, 1, '#1A0810');
  }
}

function drawCheeks(ctx, lx, rx, y) {
  circle(ctx, lx, y, 2.5, 'rgba(255,140,120,0.35)');
  circle(ctx, rx, y, 2.5, 'rgba(255,140,120,0.35)');
}

// ─── PARTICLES ───────────────────────────────────────────────────────────────

class ParticleSystem {
  constructor() { this.particles = []; }

  emit(type, x, y, color) {
    if (type === 'star') {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        this.particles.push({
          x, y, vx: Math.cos(a) * (1 + Math.random() * 2),
          vy: Math.sin(a) * (1 + Math.random() * 2) - 2,
          life: 1, color, type: 'star', size: 1 + Math.random()
        });
      }
    } else if (type === 'sparkle') {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        this.particles.push({
          x: x + wave(Math.random(), 6, 1), y: y + wave(Math.random(), 6, 1),
          vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5 - 1,
          life: 1, color: color || '#FFD700', type: 'sparkle', size: 2
        });
      }
    } else if (type === 'question') {
      this.particles.push({ x, y, vx: 0, vy: -0.5, life: 1, color: '#FFFFFF', type: 'text', text: '?' });
    } else if (type === 'zzz') {
      this.particles.push({ x, y, vx: 0.3, vy: -0.4, life: 1, color: '#88AAFF', type: 'text', text: 'z' });
    } else if (type === 'xp') {
      this.particles.push({ x, y, vx: 0, vy: -1.5, life: 1, color: '#FFD700', type: 'text', text: '+XP' });
    }
  }

  update(dt) {
    this.particles = this.particles.filter(p => {
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += 0.03 * dt * 60;
      p.life -= dt * 1.5;
      return p.life > 0;
    });
  }

  draw(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.type === 'text') {
        ctx.fillStyle = p.color;
        ctx.font = `bold ${Math.round(8 * p.life + 4)}px 'Space Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x * S, p.y * S);
      } else {
        ctx.fillStyle = p.color;
        const sz = p.size * S * p.life;
        ctx.fillRect(p.x * S - sz/2, p.y * S - sz/2, sz, sz);
      }
      ctx.restore();
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── EL GUERRER (Heroi 1) ─────────────────────────────────────────────────────
// Armadura dauro-blava, espasa gran, capa vermella, cap chibi gegant
// ═══════════════════════════════════════════════════════════════════════════════
function drawGuerrer(ctx, state, t, level, particles) {
  const cx = 24;
  const breatheY = (state === 'idle_front' || state === 'idle_back') ? wave(t, 0.7, 1) : 0;
  const walkBob  = state === 'walk' ? Math.abs(wave(t, 2, 2)) - 1 : 0;
  const legSwing = state === 'walk' ? wave(t, 4, 2) : 0;
  const bodyOff  = breatheY + walkBob;
  const expr = state === 'celebrate' ? 'happy' : state === 'hurt' ? 'hurt' :
               state === 'sleep' || state === 'rest' ? 'sleep' : 'neutral';
  const isAttack = state === 'attack';
  const isDefend = state === 'defend';

  // ── GROUND SHADOW
  ellipse(ctx, cx, 46.5, 12, 2.8, 'rgba(0,0,30,0.4)');

  // ── RED CAPE (behind everything)
  const capeSway = state === 'walk' ? wave(t, 2.5, 2) : wave(t, 0.5, 1);
  const capeOff = Math.round(capeSway * 0.6);
  const capeY = Math.round(20 + bodyOff);
  // Cape outer dark edge
  B(ctx, 5 + capeOff,  capeY,     7, 24, '#3B0A0A');
  B(ctx, 36 - capeOff, capeY,     7, 24, '#3B0A0A');
  // Cape shadow
  B(ctx, 7 + capeOff,  capeY,     6, 22, '#7F1D1D');
  B(ctx, 35 - capeOff, capeY,     6, 22, '#7F1D1D');
  // Cape base
  B(ctx, 8 + capeOff,  capeY + 1, 5, 20, '#B91C1C');
  B(ctx, 35 - capeOff, capeY + 1, 5, 20, '#B91C1C');
  // Cape inner highlight
  B(ctx, 9 + capeOff,  capeY + 2, 3, 16, '#DC2626');
  B(ctx, 36 - capeOff, capeY + 2, 3, 16, '#DC2626');
  // Cape collar (attached to shoulders)
  B(ctx, 7,  capeY,     34, 3, '#3B0A0A');
  B(ctx, 8,  capeY,     32, 2, '#7F1D1D');
  B(ctx, 10, capeY,     28, 1, '#B91C1C');
  // Cape bottom spread
  B(ctx, 4 + capeOff,  capeY + 21, 12, 4, '#7F1D1D');
  B(ctx, 32 - capeOff, capeY + 21, 12, 4, '#7F1D1D');

  // ── SHIELD (left)
  const shieldY = isDefend ? Math.round(14 + bodyOff) : Math.round(24 + bodyOff);
  const shieldX = isDefend ? 0 : 1;
  B(ctx, shieldX,     shieldY,      12, 19, '#3A2804'); // rim outline
  B(ctx, shieldX + 1, shieldY + 1,  10, 17, '#7F1D1D'); // dark red
  B(ctx, shieldX + 2, shieldY + 1,  8,  15, '#B91C1C'); // mid red
  B(ctx, shieldX + 3, shieldY + 2,  6,  13, '#DC2626'); // bright
  // Gold rim highlights
  B(ctx, shieldX + 1, shieldY + 1,  9,  1,  '#F0C840'); // top rim
  B(ctx, shieldX + 1, shieldY + 16, 9,  1,  '#C8960C'); // bottom rim
  B(ctx, shieldX + 1, shieldY + 1,  1,  16, '#F0C840'); // left rim
  B(ctx, shieldX + 10,shieldY + 1,  1,  16, '#C8960C'); // right rim
  // Gold cross
  B(ctx, shieldX + 2, shieldY + 7,  8,  2,  '#C8960C');
  B(ctx, shieldX + 5, shieldY + 2,  2,  13, '#C8960C');
  B(ctx, shieldX + 5, shieldY + 7,  2,  2,  '#F0C840'); // center boss
  B(ctx, shieldX + 4, shieldY + 6,  4,  4,  '#C8960C');
  B(ctx, shieldX + 5, shieldY + 7,  2,  2,  '#FFFFC0');

  // ── LEFT ARM (gold plate)
  const laY = Math.round(22 + bodyOff);
  B(ctx, 7,  laY,     7, 13, '#3A2804');
  B(ctx, 8,  laY + 1, 5, 11, '#7A5A08');
  B(ctx, 9,  laY + 1, 4, 10, '#C8960C');
  B(ctx, 10, laY + 2, 3, 8,  '#F0C840');
  B(ctx, 7,  laY + 12,8, 4,  '#3A2804'); // gauntlet
  B(ctx, 8,  laY + 12,6, 3,  '#7A5A08');
  B(ctx, 9,  laY + 13,4, 2,  '#C8960C');

  // ── RIGHT ARM + SWORD
  const swordRaise = isAttack ? wave(t, 7, 1) : 0;
  const raY = Math.round(22 + bodyOff - swordRaise * 0.3);
  B(ctx, 34, raY,     7, 13, '#3A2804');
  B(ctx, 35, raY + 1, 5, 11, '#7A5A08');
  B(ctx, 36, raY + 1, 4, 10, '#C8960C');
  B(ctx, 37, raY + 2, 3, 8,  '#F0C840');
  B(ctx, 34, raY + 12,8, 4,  '#3A2804'); // gauntlet
  B(ctx, 35, raY + 12,6, 3,  '#7A5A08');
  // Sword blade
  const swOff = Math.round(-swordRaise);
  B(ctx, 41, 6 + swOff,  2, 32, '#3A2804');    // blade outline
  B(ctx, 41, 7 + swOff,  2, 30, '#6B7280');    // blade shadow
  B(ctx, 42, 7 + swOff,  2, 30, '#9CA3AF');    // blade base
  B(ctx, 43, 7 + swOff,  1, 30, '#D1D5DB');    // bright edge
  B(ctx, 43, 7 + swOff,  1, 5,  '#FFFFFF');    // tip shine
  B(ctx, 42, 7 + swOff,  1, 5,  '#FFFFFF');
  // Crossguard
  const cgY = Math.round(24 + bodyOff + swOff * 0.4);
  B(ctx, 37, cgY,     12, 3, '#3A2804');
  B(ctx, 38, cgY,     10, 2, '#C8960C');
  B(ctx, 39, cgY,     8,  1, '#F0C840');
  // Grip
  B(ctx, 41, Math.round(26 + bodyOff + swOff*0.2), 3, 8, '#2E1503');
  B(ctx, 42, Math.round(27 + bodyOff + swOff*0.2), 1, 6, '#5C3010');
  // Pommel
  B(ctx, 40, Math.round(33 + bodyOff), 5, 4, '#3A2804');
  B(ctx, 41, Math.round(34 + bodyOff), 3, 2, '#C8960C');
  B(ctx, 42, Math.round(34 + bodyOff), 1, 1, '#F0C840');

  // ── CHEST ARMOR (gold main + blue panels)
  const by = Math.round(20 + bodyOff);
  // Blue shoulder pauldrons
  B(ctx, 9,  by,     8, 7, '#0A1440');
  B(ctx, 10, by + 1, 6, 6, '#1E3A8A');
  B(ctx, 11, by + 1, 5, 5, '#2563EB');
  B(ctx, 12, by + 2, 3, 3, '#60A5FA');
  B(ctx, 9,  by,     8, 1, '#F0C840');    // gold top trim
  B(ctx, 10, by + 6, 6, 1, '#C8960C');   // gold bottom trim
  B(ctx, 31, by,     8, 7, '#0A1440');
  B(ctx, 32, by + 1, 6, 6, '#1E3A8A');
  B(ctx, 33, by + 1, 5, 5, '#2563EB');
  B(ctx, 34, by + 2, 3, 3, '#60A5FA');
  B(ctx, 31, by,     8, 1, '#F0C840');
  B(ctx, 32, by + 6, 6, 1, '#C8960C');
  // Gold chest plate (5 shading levels)
  B(ctx, 12, by + 1, 24, 14, '#3A2804');  // outline
  B(ctx, 13, by + 2, 22, 12, '#7A5A08');  // deep shadow
  B(ctx, 14, by + 2, 20, 11, '#C8960C');  // base gold
  B(ctx, 16, by + 3, 16, 9,  '#E8B020');  // mid gold
  B(ctx, 18, by + 4, 12, 7,  '#F0C840');  // bright gold
  B(ctx, 20, by + 5, 8,  3,  '#FFFFC0'); // shine
  B(ctx, 13, by + 2, 1, 12,  '#5A3A06');  // left panel edge
  B(ctx, 34, by + 2, 1, 12,  '#5A3A06');  // right panel edge
  // Blue accent panel (chest)
  B(ctx, 18, by + 2, 12, 5, '#0A1440');
  B(ctx, 19, by + 3, 10, 4, '#1E3A8A');
  B(ctx, 20, by + 3, 8,  3, '#2563EB');
  B(ctx, 21, by + 4, 6,  1, '#60A5FA');
  // Gold star emblem
  B(ctx, 23, by + 9,  2, 5, '#3A2804');
  B(ctx, 21, by + 11, 6, 2, '#3A2804');
  B(ctx, 23, by + 9,  2, 4, '#F0C840');
  B(ctx, 21, by + 11, 6, 1, '#F0C840');
  B(ctx, 23, by + 9,  2, 1, '#FFFFC0');
  // Belt
  B(ctx, 12, by + 14, 24, 3, '#3A2804');
  B(ctx, 13, by + 14, 22, 2, '#7A5A08');
  B(ctx, 14, by + 15, 4,  1, '#C8960C');
  B(ctx, 30, by + 15, 4,  1, '#C8960C');
  B(ctx, 21, by + 14, 6,  3, '#3A2804'); // buckle
  B(ctx, 22, by + 14, 4,  2, '#C8960C');
  B(ctx, 23, by + 14, 2,  1, '#F0C840');

  // ── LEGS (gold plate with blue knee guards)
  const lly = Math.round(35 + bodyOff);
  const lleg = Math.round(legSwing * 0.5);
  B(ctx, 12, lly - lleg,     11, 10, '#3A2804');
  B(ctx, 13, lly - lleg + 1, 9,  8,  '#7A5A08');
  B(ctx, 14, lly - lleg + 1, 7,  7,  '#C8960C');
  B(ctx, 15, lly - lleg + 2, 5,  5,  '#F0C840');
  B(ctx, 13, lly - lleg,     9,  2,  '#0A1440'); // blue knee guard
  B(ctx, 14, lly - lleg,     7,  1,  '#2563EB');
  B(ctx, 11, lly - lleg + 9, 12, 4,  '#1A0800'); // boot outline
  B(ctx, 12, lly - lleg + 9, 10, 3,  '#2E1503');
  B(ctx, 12, lly - lleg + 10,5,  1,  '#5C3010'); // toe highlight
  B(ctx, 25, lly + lleg,     11, 10, '#3A2804');
  B(ctx, 26, lly + lleg + 1, 9,  8,  '#7A5A08');
  B(ctx, 27, lly + lleg + 1, 7,  7,  '#C8960C');
  B(ctx, 28, lly + lleg + 2, 5,  5,  '#F0C840');
  B(ctx, 26, lly + lleg,     9,  2,  '#0A1440');
  B(ctx, 27, lly + lleg,     7,  1,  '#2563EB');
  B(ctx, 24, lly + lleg + 9, 12, 4,  '#1A0800');
  B(ctx, 25, lly + lleg + 9, 10, 3,  '#2E1503');
  B(ctx, 25, lly + lleg + 10,5,  1,  '#5C3010');

  // ── NECK
  const ny = Math.round(18 + bodyOff);
  B(ctx, 19, ny,     10, 5, '#C49060');
  B(ctx, 20, ny,     8,  4, '#D4A574');
  B(ctx, 21, ny,     6,  3, '#FDDBB4');
  B(ctx, 22, ny,     4,  2, '#FFE8C8');

  // ══════════════════ CAP CHIBI (molt gran) ══════════════════
  const hy = Math.round(2 + bodyOff);

  // ── CABELL (voluminós, múltiples capes de shading)
  // Massa posterior (contorn fosc exterior)
  B(ctx, 11, hy - 2, 26, 10, '#1A0800');
  B(ctx, 12, hy - 2, 24, 9,  '#2E1503');
  B(ctx, 13, hy - 2, 22, 8,  '#3D1F08');
  // Capa base
  B(ctx, 14, hy - 1, 20, 7,  '#5C3010');
  B(ctx, 16, hy - 2, 16, 6,  '#7C4020');
  // Banda de color mitja
  B(ctx, 17, hy - 3, 14, 5,  '#8B5020');
  B(ctx, 19, hy - 4, 10, 5,  '#C07030');
  // Punta dels pics (highlight)
  B(ctx, 21, hy - 6, 6,  4,  '#E09050');
  B(ctx, 22, hy - 7, 4,  3,  '#F0A850');
  B(ctx, 23, hy - 8, 2,  2,  '#F8C080'); // molt punxegut
  // Reflex de llum al cabell
  B(ctx, 21, hy - 4, 6,  1,  '#FFFFC0');
  B(ctx, 22, hy - 5, 4,  1,  '#F8D080');
  // Costats del cabell (penjant)
  B(ctx, 11, hy + 4, 3, 17, '#1A0800');
  B(ctx, 12, hy + 4, 2, 16, '#2E1503');
  B(ctx, 12, hy + 6, 2, 12, '#3D1F08');
  B(ctx, 35, hy + 4, 3, 17, '#1A0800');
  B(ctx, 35, hy + 4, 2, 16, '#2E1503');
  B(ctx, 35, hy + 6, 2, 12, '#3D1F08');

  // ── CARA (22px ample × 19px alt — CAP ENORME chibi)
  // Contorn ombra exterior
  B(ctx, 12, hy + 4, 24, 20, '#C49060');
  // Pell base
  B(ctx, 13, hy + 4, 22, 19, '#FDDBB4');
  // Ombres laterals (dona forma rodona)
  B(ctx, 13, hy + 4,  2, 19, '#D4A574');
  B(ctx, 33, hy + 4,  2, 19, '#D4A574');
  B(ctx, 13, hy + 10, 1,  9, '#C49060');  // ombra lateral profunda
  B(ctx, 34, hy + 10, 1,  9, '#C49060');
  // Front brillant
  B(ctx, 16, hy + 4, 16,  6, '#FFE8C8');
  B(ctx, 18, hy + 4, 12,  4, '#FFFCF0');
  // Ombra mentó
  B(ctx, 14, hy + 19, 20,  3, '#D4A574');
  B(ctx, 16, hy + 20, 16,  2, '#C49060');
  // Galtes rodones (ombra)
  B(ctx, 13, hy + 13, 3, 6, '#D4A574');
  B(ctx, 32, hy + 13, 3, 6, '#D4A574');
  // Galtes rosades (cute)
  ellipse(ctx, 15.5, hy + 16.5, 3, 2.5, 'rgba(255,120,100,0.35)');
  ellipse(ctx, 32.5, hy + 16.5, 3, 2.5, 'rgba(255,120,100,0.35)');

  // ── CELLES (expressives)
  if (expr === 'hurt' || isAttack) {
    B(ctx, 15, hy + 9,  6, 1, '#2E1503');
    B(ctx, 14, hy + 10, 2, 1, '#2E1503');  // cua externa baixa
    B(ctx, 28, hy + 9,  6, 1, '#2E1503');
    B(ctx, 32, hy + 10, 2, 1, '#2E1503');
    B(ctx, 20, hy + 8,  2, 2, '#2E1503');  // interior aixecat (enuig)
    B(ctx, 26, hy + 8,  2, 2, '#2E1503');
  } else if (expr === 'happy') {
    B(ctx, 15, hy + 9,  6, 1, '#2E1503');
    B(ctx, 20, hy + 10, 1, 1, '#2E1503');
    B(ctx, 28, hy + 9,  6, 1, '#2E1503');
    B(ctx, 27, hy + 10, 1, 1, '#2E1503');
  } else {
    B(ctx, 14, hy + 9,  7, 2, '#2E1503');
    B(ctx, 28, hy + 9,  7, 2, '#2E1503');
  }

  // ── ULLS (grans, estil anime chibi, 8×6px)
  if (expr === 'sleep') {
    B(ctx, 14, hy + 13, 8,  2, '#1A0800');
    B(ctx, 15, hy + 12, 6,  1, '#3D1F08');
    B(ctx, 26, hy + 13, 8,  2, '#1A0800');
    B(ctx, 27, hy + 12, 6,  1, '#3D1F08');
  } else {
    // ULL ESQUERRE (complet)
    B(ctx, 13, hy + 12, 10, 2, '#1A0800'); // pàrpade superior gruixut
    B(ctx, 12, hy + 13, 1,  1, '#1A0800'); // pestanya exterior
    B(ctx, 23, hy + 12, 1,  1, '#1A0800'); // pestanya interior
    B(ctx, 14, hy + 13, 8,  5, '#FFFFFF'); // blanc de l'ull
    B(ctx, 13, hy + 17, 9,  1, '#D4A574'); // pàrpade inferior
    // Iris (blau intens)
    B(ctx, 15, hy + 13, 6, 4, '#1040C0');
    B(ctx, 16, hy + 13, 4, 3, '#2060D0');
    B(ctx, 17, hy + 14, 3, 2, '#3078E8');
    B(ctx, 15, hy + 15, 6, 2, '#0A2080'); // ombra iris inferior
    // Pupila
    B(ctx, 17, hy + 14, 2, 2, '#060818');
    // Catchlights (reflexos llum)
    B(ctx, 15, hy + 13, 2, 2, '#FFFFFF');  // catchlight principal
    B(ctx, 20, hy + 16, 1, 1, '#FFFFFF');  // catchlight secundari
    B(ctx, 16, hy + 13, 3, 1, '#80BBFF'); // shine iris superior

    // ULL DRET (mirall)
    B(ctx, 25, hy + 12, 10, 2, '#1A0800');
    B(ctx, 24, hy + 13, 1,  1, '#1A0800');
    B(ctx, 35, hy + 12, 1,  1, '#1A0800');
    B(ctx, 26, hy + 13, 8,  5, '#FFFFFF');
    B(ctx, 25, hy + 17, 9,  1, '#D4A574');
    B(ctx, 27, hy + 13, 6,  4, '#1040C0');
    B(ctx, 28, hy + 13, 4,  3, '#2060D0');
    B(ctx, 29, hy + 14, 3,  2, '#3078E8');
    B(ctx, 27, hy + 15, 6,  2, '#0A2080');
    B(ctx, 29, hy + 14, 2,  2, '#060818');
    B(ctx, 27, hy + 13, 2,  2, '#FFFFFF');
    B(ctx, 32, hy + 16, 1,  1, '#FFFFFF');
    B(ctx, 28, hy + 13, 3,  1, '#80BBFF');
  }

  // ── NAS (subtil)
  B(ctx, 21, hy + 19, 2, 1, '#C49060');
  B(ctx, 22, hy + 20, 4, 1, '#D4A574');

  // ── BOCA (expressiva)
  if (expr === 'happy') {
    B(ctx, 18, hy + 22, 12, 1, '#1A0800');
    B(ctx, 17, hy + 21, 2,  2, '#1A0800');
    B(ctx, 29, hy + 21, 2,  2, '#1A0800');
    B(ctx, 18, hy + 22, 12, 1, '#FFFFFF');  // dents
    B(ctx, 18, hy + 23, 12, 1, '#D4A574');  // ombra mentó
  } else if (expr === 'hurt') {
    B(ctx, 18, hy + 22, 12, 1, '#1A0800');
    B(ctx, 17, hy + 21, 2,  3, '#1A0800');
    B(ctx, 29, hy + 21, 2,  3, '#1A0800');
  } else {
    B(ctx, 19, hy + 22, 10, 1, '#1A0800');
    B(ctx, 18, hy + 23, 12, 1, '#D4A574');
  }

  // ── PROTECTORS D'ORELLA (or)
  B(ctx, 11, hy + 12, 3, 7, '#3A2804');
  B(ctx, 12, hy + 13, 2, 5, '#C8960C');
  B(ctx, 12, hy + 13, 1, 4, '#F0C840');
  B(ctx, 34, hy + 12, 3, 7, '#3A2804');
  B(ctx, 34, hy + 13, 2, 5, '#C8960C');
  B(ctx, 35, hy + 13, 1, 4, '#F0C840');

  // Cabells frontals (mechons sobre la cara)
  B(ctx, 13, hy + 4, 3, 6, '#2E1503');
  B(ctx, 14, hy + 5, 2, 5, '#5C3010');
  B(ctx, 32, hy + 4, 3, 6, '#2E1503');
  B(ctx, 32, hy + 5, 2, 5, '#5C3010');

  // ── EFECTES DE NIVELL
  if (level >= 6) {
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * Math.PI * 2);
    ctx.shadowColor = '#F0C040';
    ctx.shadowBlur = 12 * S;
    B(ctx, 13, Math.round(4 + bodyOff), 22, 19, '#FFD700');
    ctx.restore();
  }
  if (level >= 16) {
    const auraA = 0.15 + 0.08 * Math.sin(t * Math.PI * 2);
    const g = ctx.createRadialGradient(cx*S, 32*S, 0, cx*S, 32*S, 28*S);
    g.addColorStop(0, `rgba(240,192,64,${auraA*1.5})`);
    g.addColorStop(1, 'rgba(240,192,64,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CW, CH);
  }

  // ── PARTÍCULES
  if (state === 'celebrate' && particles && Math.random() < 0.2) {
    particles.emit('star', cx + wave(t, 8, 1), 8, '#FFD700');
  }
  if (state === 'levelup' && particles) {
    if (Math.random() < 0.4) particles.emit('sparkle', cx + wave(t, 10, 1), 12, '#FFFFC0');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── EL MAG (Heroi 2) ─────────────────────────────────────────────────────────
// Túnica morada, bastó màgic, cabell llarg punxegut
// ═══════════════════════════════════════════════════════════════════════════════
function drawMag(ctx, state, t, level, particles) {
  const cx = 24;
  const breatheY = (state === 'idle_front' || state === 'idle_back') ? wave(t, 0.6, 1) : 0;
  const bodyOff = breatheY;
  const expr = state === 'celebrate' ? 'happy' : state === 'hurt' ? 'hurt' : state === 'sleep' || state === 'rest' ? 'sleep' : 'neutral';

  drawShadow(ctx, cx, 1);

  // ── ROBE (long, purple)
  const ry = Math.round(20 + bodyOff);
  B(ctx, 10, ry,    28, 24, '#2D1B69');
  B(ctx, 12, ry+1,  24, 22, '#4C1D95');
  B(ctx, 14, ry+2,  20, 20, '#6D28D9');
  B(ctx, 16, ry+3,  16, 18, '#7C3AED');
  // robe shading edges
  B(ctx, 12, ry+1,   2, 22, '#2D1B69');
  B(ctx, 34, ry+1,   2, 22, '#2D1B69');
  // robe gold trim
  B(ctx, 10, ry,    28,  1, '#C8960C');
  B(ctx, 10, ry+23, 28,  1, '#C8960C');
  // robe hem runes
  B(ctx, 12, ry+21,  2, 2, '#A78BFA');
  B(ctx, 16, ry+21,  2, 2, '#A78BFA');
  B(ctx, 20, ry+21,  2, 2, '#A78BFA');
  B(ctx, 24, ry+21,  2, 2, '#A78BFA');
  B(ctx, 28, ry+21,  2, 2, '#A78BFA');
  B(ctx, 32, ry+21,  2, 2, '#A78BFA');

  // ── LEFT ARM
  B(ctx, 7, Math.round(22+bodyOff), 6, 12, '#4C1D95');
  B(ctx, 8, Math.round(23+bodyOff), 4, 10, '#6D28D9');

  // ── STAFF (left side)
  const staffGlow = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
  B(ctx, 3, Math.round(6+bodyOff), 2, 36, '#5C3010');
  B(ctx, 4, Math.round(6+bodyOff), 1, 36, '#92400E');
  // crystal orb
  B(ctx, 0, Math.round(2+bodyOff), 8, 8, '#1E1B4B');
  B(ctx, 1, Math.round(2+bodyOff), 6, 6, '#4C1D95');
  B(ctx, 2, Math.round(3+bodyOff), 4, 4, '#7C3AED');
  B(ctx, 3, Math.round(3+bodyOff), 2, 2, '#A78BFA');
  B(ctx, 1, Math.round(2+bodyOff), 2, 2, '#C4B5FD');
  // orb glow
  ctx.save();
  ctx.globalAlpha = staffGlow * 0.4;
  circle(ctx, 4, Math.round(6+bodyOff), 6, '#7C3AED');
  ctx.restore();
  if (particles && (state === 'attack' || state === 'levelup') && Math.random() < 0.3) {
    particles.emit('sparkle', 4, Math.round(6+bodyOff), '#A78BFA');
  }

  // ── RIGHT ARM
  const armR = state === 'attack' ? wave(t, 4, 1) : 0;
  B(ctx, 35, Math.round(22+bodyOff-armR), 6, 12, '#4C1D95');
  B(ctx, 36, Math.round(23+bodyOff-armR), 4, 10, '#6D28D9');
  // spell casting hand effect
  if (state === 'attack') {
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * Math.PI * 4);
    circle(ctx, 42, Math.round(22+bodyOff-armR), 5, '#7C3AED');
    circle(ctx, 42, Math.round(22+bodyOff-armR), 3, '#A78BFA');
    ctx.restore();
  }

  // ── NECK
  B(ctx, 20, Math.round(18+bodyOff), 8, 4, '#D4A574');
  B(ctx, 21, Math.round(18+bodyOff), 6, 3, '#FDDBB4');

  // ── HEAD
  const hy = Math.round(2 + bodyOff);
  // Long spiky hair
  B(ctx, 11, hy,    26, 8, '#1E1B4B');
  B(ctx, 13, hy,    22, 6, '#312E81');
  // spikes
  B(ctx, 11, hy-2,   3, 4, '#1E1B4B');
  B(ctx, 16, hy-3,   3, 5, '#312E81');
  B(ctx, 20, hy-4,   4, 6, '#4338CA');
  B(ctx, 25, hy-3,   3, 5, '#312E81');
  B(ctx, 30, hy-2,   3, 4, '#1E1B4B');
  B(ctx, 34, hy-1,   2, 3, '#1E1B4B');
  // hair tips highlight
  B(ctx, 21, hy-4,   2, 2, '#6366F1');
  // long side strands
  B(ctx, 11, hy+4,   3, 14, '#1E1B4B'); // left
  B(ctx, 34, hy+4,   3, 14, '#1E1B4B'); // right
  B(ctx, 12, hy+5,   2, 12, '#312E81');
  B(ctx, 34, hy+5,   2, 12, '#312E81');
  // Head skin
  B(ctx, 14, hy+5, 20, 14, '#FDDBB4');
  B(ctx, 14, hy+5,  2, 14, '#D4A574');
  B(ctx, 32, hy+5,  2, 14, '#D4A574');
  B(ctx, 14, hy+17, 20, 2, '#C49060');
  // Head outline
  B(ctx, 13, hy+5,  1, 14, '#1A0810');
  B(ctx, 33, hy+5,  1, 14, '#1A0810');

  // eyebrows
  B(ctx, 15, hy+7, 5, 1, '#1E1B4B');
  B(ctx, 28, hy+7, 5, 1, '#1E1B4B');

  // Eyes (purple)
  if (state === 'sleep' || state === 'rest') {
    drawEyeClosed(ctx, 15, hy+10, '#1E1B4B');
    drawEyeClosed(ctx, 28, hy+10, '#1E1B4B');
  } else {
    drawEye(ctx, 15, hy+9, '#6D28D9', 1);
    drawEye(ctx, 28, hy+9, '#6D28D9', 1);
    // glow pupils
    ctx.save();
    ctx.globalAlpha = 0.4 + 0.2 * Math.sin(t*Math.PI*2);
    B(ctx, 17, hy+10, 1, 1, '#A78BFA');
    B(ctx, 30, hy+10, 1, 1, '#A78BFA');
    ctx.restore();
  }

  B(ctx, 22, hy+14, 2, 2, '#D4A574');
  drawMouth(ctx, 19, hy+17, expr);
  if (state === 'celebrate') drawCheeks(ctx, 16, 32, hy+14);

  // hat / hood top
  B(ctx, 12, hy, 24, 4, '#1E1B4B');

  // level fx
  if (level >= 6) {
    ctx.save();
    ctx.globalAlpha = 0.2 + 0.1 * Math.sin(t * Math.PI * 2);
    circle(ctx, cx, Math.round(30+bodyOff), 18, '#7C3AED');
    ctx.restore();
  }

  if (state === 'celebrate' && particles && Math.random() < 0.2) {
    particles.emit('sparkle', cx + wave(t, 8, 1), 15, '#A78BFA');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── EL RANGER (Heroi 3) ──────────────────────────────────────────────────────
// Armadura verda lleugera, arc i fletxes, bandana, àgil
// ═══════════════════════════════════════════════════════════════════════════════
function drawRanger(ctx, state, t, level, particles) {
  const cx = 24;
  const breatheY = (state === 'idle_front' || state === 'idle_back') ? wave(t, 0.6, 1) : 0;
  const walkBob  = state === 'walk' ? Math.abs(wave(t, 2, 2)) - 1 : 0;
  const legSwing = state === 'walk' ? wave(t, 4, 2) : 0;
  const bodyOff  = breatheY + walkBob;
  const expr = state === 'celebrate' ? 'happy' : state === 'hurt' ? 'hurt' : state === 'rest' || state === 'sleep' ? 'sleep' : 'neutral';

  drawShadow(ctx, cx, 1);

  // ── QUIVER (behind right shoulder)
  B(ctx, 35, Math.round(16+bodyOff), 5, 18, '#5C3010');
  B(ctx, 36, Math.round(17+bodyOff), 3, 16, '#78350F');
  B(ctx, 36, Math.round(15+bodyOff), 3, 3,  '#065F46'); // feathers
  B(ctx, 37, Math.round(14+bodyOff), 1, 2,  '#A7F3D0');

  // ── CHEST / LEATHER ARMOR
  const by = Math.round(20 + bodyOff);
  B(ctx, 12, by,   24, 15, '#064E3B');
  B(ctx, 13, by+1, 22, 13, '#065F46');
  B(ctx, 15, by+2, 18, 11, '#10B981');
  // leather stitching
  B(ctx, 15, by+4,  1, 8,  '#047857');
  B(ctx, 32, by+4,  1, 8,  '#047857');
  B(ctx, 18, by+2, 12, 1,  '#047857');
  // belt
  B(ctx, 12, by+14, 24, 3, '#78350F');
  B(ctx, 22, by+14,  4, 3, '#A16207');

  // ── LEFT ARM
  B(ctx, 6, Math.round(22+bodyOff), 7, 12, '#065F46');
  B(ctx, 7, Math.round(23+bodyOff), 5, 10, '#10B981');

  // ── BOW (left, always present)
  const bowDraw = state === 'attack' ? wave(t, 4, 1) : 0;
  // bow limbs
  B(ctx, 1, Math.round(8+bodyOff),  2, 6,  '#92400E');
  B(ctx, 1, Math.round(32+bodyOff), 2, 6,  '#92400E');
  // bow grip
  B(ctx, 1, Math.round(14+bodyOff), 2, 18, '#B45309');
  // bowstring
  B(ctx, 2, Math.round(8+bodyOff),  1, 30, '#FDE68A');
  // arrow (drawn if attacking)
  if (state === 'attack') {
    B(ctx, 2, Math.round(22+bodyOff-bowDraw*0.5), 14, 1, '#92400E');
    B(ctx, 14, Math.round(21+bodyOff-bowDraw*0.5), 2, 3,  '#065F46'); // feathers
    B(ctx, 2,  Math.round(22+bodyOff-bowDraw*0.5), 1, 1,  '#D97706'); // tip
    // string pulled back
    B(ctx, 2, Math.round(8+bodyOff),  1, Math.round(14-bowDraw*0.3), '#FDE68A');
    B(ctx, 2, Math.round(22+bodyOff+bowDraw*0.3), 1, Math.round(16-bowDraw*0.3), '#FDE68A');
  }

  // ── RIGHT ARM
  B(ctx, 35, Math.round(22+bodyOff), 7, 12, '#065F46');
  B(ctx, 36, Math.round(23+bodyOff), 5, 10, '#10B981');

  // ── LEGS (greens with brown boots)
  const lly = Math.round(35+bodyOff);
  const ll = Math.round(legSwing * 0.5);
  B(ctx, 13, lly-ll, 10, 10, '#064E3B');
  B(ctx, 14, lly-ll+1, 8, 8, '#065F46');
  B(ctx, 15, lly-ll+1, 6, 7, '#10B981');
  B(ctx, 13, lly-ll+9, 10, 4, '#78350F');
  B(ctx, 25, lly+ll, 10, 10, '#064E3B');
  B(ctx, 26, lly+ll+1, 8, 8, '#065F46');
  B(ctx, 27, lly+ll+1, 6, 7, '#10B981');
  B(ctx, 25, lly+ll+9, 10, 4, '#78350F');

  // ── NECK
  B(ctx, 20, Math.round(18+bodyOff), 8, 4, '#D4A574');
  B(ctx, 21, Math.round(18+bodyOff), 6, 3, '#FDDBB4');

  // ── HEAD
  const hy = Math.round(4+bodyOff);
  // Hair (messy dark brown)
  B(ctx, 13, hy,   22, 7, '#3D1F08');
  B(ctx, 15, hy-1, 18, 3, '#5C3010');
  B(ctx, 18, hy-2, 12, 3, '#5C3010');
  B(ctx, 13, hy+3,  2, 8, '#3D1F08');
  B(ctx, 33, hy+3,  2, 8, '#3D1F08');
  // messy tufts
  B(ctx, 18, hy-1,  3, 2, '#8B5020');
  B(ctx, 27, hy-1,  3, 2, '#8B5020');
  // bandana (green)
  B(ctx, 13, hy+4, 22, 3, '#064E3B');
  B(ctx, 14, hy+4, 20, 2, '#10B981');
  B(ctx, 14, hy+4,  2, 2, '#A7F3D0'); // bandana highlight
  // bandana knot back
  B(ctx, 33, hy+4,  4, 3, '#064E3B');
  B(ctx, 34, hy+4,  3, 2, '#10B981');

  // Head skin
  B(ctx, 14, hy+6, 20, 13, '#FDDBB4');
  B(ctx, 14, hy+6,  2, 13, '#D4A574');
  B(ctx, 32, hy+6,  2, 13, '#D4A574');
  B(ctx, 14, hy+17, 20, 2, '#C49060');
  B(ctx, 13, hy+6,   1, 13, '#1A0810');
  B(ctx, 33, hy+6,   1, 13, '#1A0810');

  B(ctx, 15, hy+8, 5, 1, '#3D1F08');
  B(ctx, 28, hy+8, 5, 1, '#3D1F08');

  if (state === 'sleep' || state === 'rest') {
    drawEyeClosed(ctx, 15, hy+10, '#3D1F08');
    drawEyeClosed(ctx, 28, hy+10, '#3D1F08');
  } else {
    drawEye(ctx, 15, hy+9, '#065F46', 1);
    drawEye(ctx, 28, hy+9, '#065F46', 1);
  }

  B(ctx, 22, hy+14, 2, 2, '#D4A574');
  drawMouth(ctx, 19, hy+16, expr);
  if (state === 'celebrate') drawCheeks(ctx, 16, 32, hy+13);

  if (state === 'celebrate' && particles && Math.random() < 0.2) {
    particles.emit('star', cx + wave(t, 8, 1), 12, '#10B981');
  }
  if (level >= 6) {
    ctx.save(); ctx.globalAlpha = 0.15 + 0.08*Math.sin(t*Math.PI*2);
    B(ctx, 14, hy, 20, 14, '#34D399'); ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LA PALADINA (Heroïna 1) ──────────────────────────────────────────────────
// Armadura plateada elegant, espasa i escut, trenes daurades
// ═══════════════════════════════════════════════════════════════════════════════
function drawPaladina(ctx, state, t, level, particles) {
  const cx = 24;
  const breatheY = (state === 'idle_front' || state === 'idle_back') ? wave(t, 0.6, 1) : 0;
  const walkBob  = state === 'walk' ? Math.abs(wave(t, 2, 2)) - 1 : 0;
  const legSwing = state === 'walk' ? wave(t, 4, 2) : 0;
  const bodyOff  = breatheY + walkBob;
  const expr = state === 'celebrate' ? 'happy' : state === 'hurt' ? 'hurt' : state === 'rest' || state === 'sleep' ? 'sleep' : 'neutral';

  drawShadow(ctx, cx, 1);

  // ── BRAIDS (golden, behind body)
  const braidSway = wave(t, 1, 1);
  B(ctx, 9+Math.round(braidSway), Math.round(14+bodyOff), 3, 22, '#A07020');
  B(ctx, 10+Math.round(braidSway), Math.round(14+bodyOff), 2, 22, '#C8960C');
  B(ctx, 9+Math.round(braidSway), Math.round(14+bodyOff), 2, 22, '#F0C040');
  B(ctx, 36-Math.round(braidSway), Math.round(14+bodyOff), 3, 22, '#A07020');
  B(ctx, 36-Math.round(braidSway), Math.round(14+bodyOff), 2, 22, '#C8960C');
  // braid details
  for (let i = 0; i < 6; i++) {
    B(ctx, 9+Math.round(braidSway), Math.round(14+bodyOff+i*3), 2, 1, '#F0D060');
    B(ctx, 37-Math.round(braidSway), Math.round(14+bodyOff+i*3), 2, 1, '#F0D060');
  }

  // ── SILVER ARMOR CHEST
  const by = Math.round(20 + bodyOff);
  B(ctx, 9, by, 30, 5, '#6B7280'); // shoulder broad
  B(ctx, 10, by+1, 28, 4, '#9CA3AF');
  B(ctx, 11, by, 26, 15, '#6B7280');
  B(ctx, 12, by+1, 24, 13, '#9CA3AF');
  B(ctx, 14, by+2, 20, 11, '#D1D5DB');
  B(ctx, 16, by+3, 16, 8, '#F3F4F6');
  // silver trim gold
  B(ctx, 11, by, 26, 1, '#F0C040');
  B(ctx, 11, by+14, 26, 1, '#F0C040');
  // cross emblem
  B(ctx, 22, by+4, 4, 8, '#F0C040');
  B(ctx, 18, by+7, 12, 2, '#F0C040');
  // shading
  B(ctx, 12, by+1, 2, 13, '#6B7280');
  B(ctx, 34, by+1, 2, 13, '#6B7280');
  // skirt/tassets
  B(ctx, 11, by+14, 26, 6, '#4B5563');
  B(ctx, 12, by+14, 24, 5, '#6B7280');
  B(ctx, 14, by+14, 20, 4, '#9CA3AF');

  // ── LEFT ARM + SHIELD
  if (state === 'defend') {
    B(ctx, 4, Math.round(18+bodyOff), 8, 5, '#6B7280');
    B(ctx, 2, Math.round(15+bodyOff), 10, 18, '#4B5563');
    B(ctx, 3, Math.round(16+bodyOff), 8, 16, '#6B7280');
    B(ctx, 4, Math.round(17+bodyOff), 6, 14, '#9CA3AF');
    B(ctx, 5, Math.round(22+bodyOff), 4, 4, '#F0C040'); // cross
    B(ctx, 6, Math.round(19+bodyOff), 2, 10, '#F0C040');
  } else {
    B(ctx, 7, Math.round(22+bodyOff), 6, 12, '#6B7280');
    B(ctx, 8, Math.round(23+bodyOff), 4, 10, '#9CA3AF');
    // shield at side (oval)
    B(ctx, 1, Math.round(24+bodyOff), 8, 12, '#4B5563');
    B(ctx, 2, Math.round(25+bodyOff), 6, 10, '#6B7280');
    B(ctx, 3, Math.round(26+bodyOff), 4, 8, '#9CA3AF');
    B(ctx, 4, Math.round(29+bodyOff), 2, 2, '#F0C040');
    B(ctx, 3, Math.round(27+bodyOff), 1, 6, '#F0C040');
  }

  // ── RIGHT ARM + SWORD
  const swordOff = state === 'attack' ? wave(t, 6, 1) : 0;
  B(ctx, 35, Math.round(22+bodyOff), 6, 12, '#6B7280');
  B(ctx, 36, Math.round(23+bodyOff), 4, 10, '#9CA3AF');
  B(ctx, 40, Math.round(10+bodyOff-swordOff), 2, 28, '#D1D5DB');
  B(ctx, 41, Math.round(10+bodyOff-swordOff), 1, 28, '#FFFFFF');
  B(ctx, 40, Math.round(10+bodyOff-swordOff), 1, 28, '#9CA3AF');
  B(ctx, 37, Math.round(23+bodyOff-swordOff*0.5), 8, 2, '#F0C040');
  B(ctx, 40, Math.round(25+bodyOff), 2, 8, '#6B7280');
  B(ctx, 39, Math.round(32+bodyOff), 4, 3, '#D1D5DB');

  // ── LEGS
  const lly = Math.round(38+bodyOff);
  const ll = Math.round(legSwing * 0.5);
  B(ctx, 13, lly-ll, 10, 8, '#4B5563');
  B(ctx, 14, lly-ll, 8, 7, '#6B7280');
  B(ctx, 15, lly-ll+1, 6, 6, '#9CA3AF');
  B(ctx, 13, lly-ll+7, 10, 3, '#374151');
  B(ctx, 25, lly+ll, 10, 8, '#4B5563');
  B(ctx, 26, lly+ll, 8, 7, '#6B7280');
  B(ctx, 27, lly+ll+1, 6, 6, '#9CA3AF');
  B(ctx, 25, lly+ll+7, 10, 3, '#374151');

  // ── NECK
  B(ctx, 20, Math.round(18+bodyOff), 8, 4, '#D4A574');
  B(ctx, 21, Math.round(18+bodyOff), 6, 3, '#FDDBB4');

  // ── HEAD
  const hy = Math.round(3 + bodyOff);
  // Golden hair
  B(ctx, 13, hy, 22, 6, '#A07020');
  B(ctx, 15, hy, 18, 5, '#C8960C');
  B(ctx, 17, hy, 14, 3, '#F0C040');
  B(ctx, 19, hy-1, 10, 2, '#F0C040');
  B(ctx, 22, hy-2, 4, 2, '#FDE68A');
  B(ctx, 13, hy+4, 2, 8, '#A07020');
  B(ctx, 33, hy+4, 2, 8, '#A07020');

  // crown/circlet
  B(ctx, 14, hy+1, 20, 2, '#C8960C');
  B(ctx, 19, hy-1,  3, 3, '#F0C040');
  B(ctx, 21, hy-2,  1, 2, '#FFFFFF');
  B(ctx, 26, hy-1,  3, 3, '#F0C040');

  // Head skin
  B(ctx, 14, hy+5, 20, 14, '#FDDBB4');
  B(ctx, 14, hy+5, 2, 14, '#D4A574');
  B(ctx, 32, hy+5, 2, 14, '#D4A574');
  B(ctx, 14, hy+17, 20, 2, '#C49060');
  B(ctx, 13, hy+5, 1, 14, '#1A0810');
  B(ctx, 33, hy+5, 1, 14, '#1A0810');

  B(ctx, 15, hy+7, 5, 1, '#A07020');
  B(ctx, 28, hy+7, 5, 1, '#A07020');

  if (state === 'sleep' || state === 'rest') {
    drawEyeClosed(ctx, 15, hy+9, '#A07020');
    drawEyeClosed(ctx, 28, hy+9, '#A07020');
  } else {
    drawEye(ctx, 15, hy+8, '#0EA5E9', 1);
    drawEye(ctx, 28, hy+8, '#0EA5E9', 1);
  }

  B(ctx, 22, hy+13, 2, 2, '#D4A574');
  drawMouth(ctx, 19, hy+16, expr);
  if (state === 'celebrate') drawCheeks(ctx, 16, 32, hy+13);

  if (state === 'celebrate' && particles && Math.random() < 0.2) {
    particles.emit('star', cx + wave(t, 8, 1), 12, '#F0C040');
  }
  if (level >= 6) {
    ctx.save(); ctx.globalAlpha = 0.2+0.1*Math.sin(t*Math.PI*2);
    B(ctx, 12, Math.round(20+bodyOff), 24, 15, '#F8FAFC'); ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LA BRUIXA (Heroïna 2) ────────────────────────────────────────────────────
// Vestit negre/violeta, barret de bruixa, cabell fosc ondulat, vareta
// ═══════════════════════════════════════════════════════════════════════════════
function drawBruixa(ctx, state, t, level, particles) {
  const cx = 24;
  const breatheY = (state === 'idle_front' || state === 'idle_back') ? wave(t, 0.5, 1) : 0;
  const bodyOff = breatheY;
  const hatSway = wave(t, 0.8, 1);
  const expr = state === 'celebrate' ? 'happy' : state === 'hurt' ? 'hurt' : state === 'rest' || state === 'sleep' ? 'sleep' : 'neutral';

  drawShadow(ctx, cx, 1);

  // ── HAT (big witch hat)
  const hatY = Math.round(-4 + bodyOff);
  // hat shadow
  B(ctx, 14, hatY+14, 20, 2, '#0A0A14');
  // hat brim
  B(ctx, 8, hatY+13, 32, 4, '#0A0A14');
  B(ctx, 9, hatY+13, 30, 3, '#1A1A2E');
  B(ctx, 10, hatY+13, 28, 2, '#2D2D44');
  // brim band gold
  B(ctx, 10, hatY+13, 28, 1, '#C8960C');
  // hat cone
  B(ctx, 16, hatY+1, 16, 13, '#0A0A14');
  B(ctx, 18, hatY+1, 12, 12, '#1A1A2E');
  B(ctx, 20, hatY+2, 8, 10, '#2D1B69');
  // hat tip
  B(ctx, 21, hatY-1, 6, 3, '#0A0A14');
  B(ctx, 22, hatY-2, 4, 2, '#1A1A2E');
  B(ctx, 23, hatY-3, 2, 2, '#2D1B69');
  // hat star
  B(ctx, 22, hatY+6, 2, 4, '#F0C040');
  B(ctx, 20, hatY+8, 6, 1, '#F0C040');
  B(ctx, 21, hatY+7, 1, 2, '#F0C040');
  B(ctx, 25, hatY+7, 1, 2, '#F0C040');
  // wavy hair under hat
  B(ctx, 10, hatY+14, 4, 18, '#1C0A2E');
  B(ctx, 34, hatY+14, 4, 18, '#1C0A2E');
  B(ctx, 11, hatY+14, 3, 17, '#2D1B69');
  B(ctx, 34, hatY+14, 3, 17, '#2D1B69');
  B(ctx, 11, hatY+16, 2, 12, '#3D2280');
  // hair waves
  for (let i = 0; i < 5; i++) {
    const wv = Math.round(Math.sin(i) * 1.5);
    B(ctx, 10+wv, hatY+16+i*2, 3, 1, '#4C1D95');
    B(ctx, 35-wv, hatY+16+i*2, 3, 1, '#4C1D95');
  }

  // ── DRESS (black/purple flowing)
  const dy = Math.round(22 + bodyOff);
  B(ctx, 10, dy, 28, 22, '#0A0A14');
  B(ctx, 12, dy+1, 24, 20, '#1A1A2E');
  B(ctx, 14, dy+2, 20, 18, '#2D1B69');
  B(ctx, 16, dy+3, 16, 16, '#3B1D8B');
  // dress details
  B(ctx, 16, dy+3, 1, 16, '#2D1B69'); // seam
  B(ctx, 31, dy+3, 1, 16, '#2D1B69');
  // magical sparkles on dress
  if (state === 'idle_front' || state === 'celebrate') {
    const gg = 0.5 + 0.5*Math.sin(t*Math.PI*2);
    ctx.save(); ctx.globalAlpha = gg * 0.5;
    B(ctx, 17, dy+5, 2, 2, '#A78BFA');
    B(ctx, 28, dy+8, 2, 2, '#C4B5FD');
    B(ctx, 21, dy+14, 2, 2, '#8B5CF6');
    ctx.restore();
  }
  // collar
  B(ctx, 18, dy, 12, 3, '#0A0A14');
  B(ctx, 19, dy, 10, 2, '#1A1A2E');

  // ── ARMS
  B(ctx, 7,  Math.round(22+bodyOff), 6, 14, '#1A1A2E');
  B(ctx, 8,  Math.round(23+bodyOff), 4, 12, '#2D1B69');
  B(ctx, 35, Math.round(22+bodyOff), 6, 14, '#1A1A2E');
  B(ctx, 36, Math.round(23+bodyOff), 4, 12, '#2D1B69');

  // ── WAND (right hand)
  const wandWave = wave(t, 1, 1);
  const wandY = state === 'attack' ? wave(t, 5, 1) : 0;
  B(ctx, 40, Math.round(12+bodyOff+wandWave-wandY), 2, 24, '#5C3010');
  B(ctx, 41, Math.round(12+bodyOff+wandWave-wandY), 1, 24, '#92400E');
  // wand star tip
  B(ctx, 38, Math.round(8+bodyOff+wandWave-wandY), 6, 6, '#F0C040');
  B(ctx, 39, Math.round(7+bodyOff+wandWave-wandY), 4, 4, '#FDE68A');
  B(ctx, 40, Math.round(8+bodyOff+wandWave-wandY), 2, 2, '#FFFFFF');
  // wand glow
  const wg = 0.3 + 0.3*Math.sin(t*Math.PI*3);
  ctx.save(); ctx.globalAlpha = wg;
  circle(ctx, 41, Math.round(10+bodyOff+wandWave-wandY), 5, '#A78BFA');
  ctx.restore();
  if ((state === 'attack' || state === 'levelup') && particles && Math.random() < 0.3) {
    particles.emit('sparkle', 41, Math.round(10+bodyOff-wandY), '#C4B5FD');
  }

  // ── NECK
  B(ctx, 20, Math.round(20+bodyOff), 8, 4, '#D4A574');
  B(ctx, 21, Math.round(20+bodyOff), 6, 3, '#FDDBB4');

  // ── HEAD
  const hy = Math.round(10 + bodyOff);
  B(ctx, 14, hy, 20, 13, '#FDDBB4');
  B(ctx, 14, hy, 2, 13, '#D4A574');
  B(ctx, 32, hy, 2, 13, '#D4A574');
  B(ctx, 14, hy+12, 20, 1, '#C49060');
  B(ctx, 13, hy, 1, 13, '#1A0810');
  B(ctx, 33, hy, 1, 13, '#1A0810');

  // eyebrows
  B(ctx, 15, hy+2, 5, 1, '#1C0A2E');
  B(ctx, 28, hy+2, 5, 1, '#1C0A2E');

  if (state === 'sleep' || state === 'rest') {
    drawEyeClosed(ctx, 15, hy+4, '#1C0A2E');
    drawEyeClosed(ctx, 28, hy+4, '#1C0A2E');
  } else {
    drawEye(ctx, 15, hy+3, '#7C3AED', 1);
    drawEye(ctx, 28, hy+3, '#7C3AED', 1);
    // glowing eyes
    ctx.save(); ctx.globalAlpha = 0.3+0.2*Math.sin(t*Math.PI*2);
    B(ctx, 17, hy+4, 1, 1, '#DDD6FE'); B(ctx, 30, hy+4, 1, 1, '#DDD6FE');
    ctx.restore();
  }

  B(ctx, 22, hy+8, 2, 2, '#D4A574');
  drawMouth(ctx, 19, hy+10, expr);
  if (state === 'celebrate') drawCheeks(ctx, 16, 32, hy+8);

  if (state === 'celebrate' && particles && Math.random() < 0.2) {
    particles.emit('sparkle', cx, 20, '#C4B5FD');
  }
  if (level >= 6) {
    ctx.save(); ctx.globalAlpha = 0.15+0.1*Math.sin(t*Math.PI*2);
    circle(ctx, cx, Math.round(33+bodyOff), 18, '#4C1D95'); ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LA ARQUERA (Heroïna 3) ───────────────────────────────────────────────────
// Armadura verda-marró, arc elfí, orelles punxegudes, cua de cavall
// ═══════════════════════════════════════════════════════════════════════════════
function drawArquera(ctx, state, t, level, particles) {
  const cx = 24;
  const breatheY = (state === 'idle_front' || state === 'idle_back') ? wave(t, 0.6, 1) : 0;
  const walkBob = state === 'walk' ? Math.abs(wave(t, 2, 2)) - 1 : 0;
  const legSwing = state === 'walk' ? wave(t, 4, 2) : 0;
  const bodyOff = breatheY + walkBob;
  const expr = state === 'celebrate' ? 'happy' : state === 'hurt' ? 'hurt' : state === 'rest' || state === 'sleep' ? 'sleep' : 'neutral';

  drawShadow(ctx, cx, 1);

  // ── PONYTAIL (high, behind)
  const ptSway = wave(t, 1.5, 1);
  B(ctx, 13+Math.round(ptSway), Math.round(-1+bodyOff), 6, 2, '#5C3010');
  B(ctx, 14+Math.round(ptSway), Math.round(0+bodyOff),  4, 20, '#5C3010');
  B(ctx, 15+Math.round(ptSway), Math.round(1+bodyOff),  3, 18, '#7C4020');
  B(ctx, 15+Math.round(ptSway), Math.round(2+bodyOff),  2, 16, '#8B5020');
  // hair tie
  B(ctx, 13+Math.round(ptSway), Math.round(1+bodyOff), 6, 2, '#065F46');

  // ── QUIVER
  B(ctx, 35, Math.round(14+bodyOff), 5, 18, '#5C3010');
  B(ctx, 36, Math.round(15+bodyOff), 3, 16, '#78350F');
  B(ctx, 36, Math.round(13+bodyOff), 3, 3, '#065F46');

  // ── LEATHER ARMOR (green-brown)
  const by = Math.round(20 + bodyOff);
  B(ctx, 11, by, 26, 5, '#3D1F08');
  B(ctx, 12, by+1, 24, 4, '#5C3010');
  B(ctx, 12, by, 26, 14, '#3D1F08');
  B(ctx, 13, by+1, 22, 12, '#5C3010');
  B(ctx, 15, by+2, 18, 10, '#78350F');
  B(ctx, 17, by+3, 14, 8, '#065F46');
  // leather vest details
  B(ctx, 18, by+2, 1, 10, '#3D1F08');
  B(ctx, 29, by+2, 1, 10, '#3D1F08');
  B(ctx, 17, by+3, 14, 1, '#10B981'); // trim line
  // belt
  B(ctx, 12, by+13, 24, 3, '#3D1F08');
  B(ctx, 21, by+13, 6, 3, '#5C3010');
  B(ctx, 22, by+14, 4, 2, '#78350F');

  // ── LEFT ARM + BOW
  B(ctx, 7, Math.round(22+bodyOff), 6, 12, '#5C3010');
  B(ctx, 8, Math.round(23+bodyOff), 4, 10, '#78350F');
  // Elven bow (curved)
  const bowPull = state === 'attack' ? wave(t, 4, 1) : 0;
  B(ctx, 1, Math.round(7+bodyOff), 2, 5,  '#B45309');
  B(ctx, 1, Math.round(30+bodyOff), 2, 5, '#B45309');
  B(ctx, 1, Math.round(12+bodyOff), 2, 18, '#78350F');
  B(ctx, 2, Math.round(8+bodyOff), 1, 30, '#FDE68A'); // string
  // bow leaf tips (elven)
  B(ctx, 0, Math.round(5+bodyOff), 4, 3, '#065F46');
  B(ctx, 0, Math.round(33+bodyOff), 4, 3, '#065F46');
  if (state === 'attack') {
    B(ctx, 3, Math.round(22+bodyOff-bowPull*0.5), 12, 1, '#B45309');
    B(ctx, 13, Math.round(21+bodyOff-bowPull*0.5), 2, 3, '#065F46');
    B(ctx, 3, Math.round(22+bodyOff-bowPull*0.5), 1, 1, '#FCD34D');
    if (particles && Math.random() < 0.3) {
      particles.emit('star', 3, Math.round(22+bodyOff-bowPull*0.5), '#10B981');
    }
  }

  // ── RIGHT ARM
  B(ctx, 35, Math.round(22+bodyOff), 6, 12, '#5C3010');
  B(ctx, 36, Math.round(23+bodyOff), 4, 10, '#78350F');

  // ── LEGS
  const lly = Math.round(36 + bodyOff);
  const ll = Math.round(legSwing * 0.5);
  B(ctx, 13, lly-ll, 10, 10, '#3D1F08');
  B(ctx, 14, lly-ll+1, 8, 8, '#5C3010');
  B(ctx, 15, lly-ll+1, 6, 7, '#78350F');
  B(ctx, 13, lly-ll+9, 10, 4, '#1A0800');
  B(ctx, 25, lly+ll, 10, 10, '#3D1F08');
  B(ctx, 26, lly+ll+1, 8, 8, '#5C3010');
  B(ctx, 27, lly+ll+1, 6, 7, '#78350F');
  B(ctx, 25, lly+ll+9, 10, 4, '#1A0800');

  // ── NECK
  B(ctx, 20, Math.round(18+bodyOff), 8, 4, '#D4A574');
  B(ctx, 21, Math.round(18+bodyOff), 6, 3, '#FDDBB4');

  // ── HEAD
  const hy = Math.round(4 + bodyOff);
  // Hair (dark brown, pulled back)
  B(ctx, 14, hy, 20, 6, '#3D1F08');
  B(ctx, 16, hy, 16, 5, '#5C3010');
  B(ctx, 18, hy, 12, 3, '#7C4020');
  B(ctx, 14, hy+4, 2, 8, '#3D1F08');
  B(ctx, 32, hy+4, 2, 8, '#3D1F08');

  // Head skin
  B(ctx, 14, hy+5, 20, 14, '#FDDBB4');
  B(ctx, 14, hy+5, 2, 14, '#D4A574');
  B(ctx, 32, hy+5, 2, 14, '#D4A574');
  B(ctx, 14, hy+17, 20, 2, '#C49060');
  B(ctx, 13, hy+5, 1, 14, '#1A0810');
  B(ctx, 33, hy+5, 1, 14, '#1A0810');

  // POINTED EARS (elf!)
  B(ctx, 12, hy+7, 2, 5, '#FDDBB4');
  B(ctx, 11, hy+5, 2, 3, '#FDDBB4'); // tip
  B(ctx, 10, hy+4, 2, 2, '#FDDBB4'); // pointed tip
  B(ctx, 12, hy+7, 1, 5, '#D4A574'); // ear shadow
  B(ctx, 34, hy+7, 2, 5, '#FDDBB4');
  B(ctx, 35, hy+5, 2, 3, '#FDDBB4');
  B(ctx, 36, hy+4, 2, 2, '#FDDBB4');
  B(ctx, 35, hy+7, 1, 5, '#D4A574');

  B(ctx, 15, hy+7, 5, 1, '#3D1F08');
  B(ctx, 28, hy+7, 5, 1, '#3D1F08');

  if (state === 'sleep' || state === 'rest') {
    drawEyeClosed(ctx, 15, hy+9, '#3D1F08');
    drawEyeClosed(ctx, 28, hy+9, '#3D1F08');
  } else {
    drawEye(ctx, 15, hy+8, '#047857', 1);
    drawEye(ctx, 28, hy+8, '#047857', 1);
    // slightly almond eyes (elf)
    B(ctx, 15, hy+8, 6, 1, '#1A0810'); // top line slightly longer
    B(ctx, 28, hy+8, 6, 1, '#1A0810');
  }

  B(ctx, 22, hy+13, 2, 2, '#D4A574');
  drawMouth(ctx, 19, hy+16, expr);
  if (state === 'celebrate') drawCheeks(ctx, 16, 32, hy+13);

  if (state === 'celebrate' && particles && Math.random() < 0.2) {
    particles.emit('star', cx + wave(t, 8, 1), 12, '#10B981');
  }
  if (level >= 6) {
    ctx.save(); ctx.globalAlpha = 0.15+0.1*Math.sin(t*Math.PI*2);
    B(ctx, 14, hy, 20, 14, '#6EE7B7'); ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CHARACTERS TABLE ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const CHARACTERS = {
  guerrer: {
    id: 'guerrer', name: 'El Guerrer', cls: 'Força Bruta',
    emoji: '⚔️', color: '#F0C040', bg: 'rgba(240,192,64,0.2)',
    desc: 'Armadura daurada, espasa gran. Força bruta.',
    draw: drawGuerrer
  },
  mag: {
    id: 'mag', name: 'El Mag', cls: 'Intel·ligència Arcana',
    emoji: '🔮', color: '#7C3AED', bg: 'rgba(124,58,237,0.2)',
    desc: 'Túnica morada, bastó màgic. Poder arcà.',
    draw: drawMag
  },
  ranger: {
    id: 'ranger', name: 'El Ranger', cls: 'Velocitat i Natura',
    emoji: '🏹', color: '#10B981', bg: 'rgba(16,185,129,0.2)',
    desc: 'Armadura de cuir verda, arc. Àgil i precís.',
    draw: drawRanger
  },
  paladina: {
    id: 'paladina', name: 'La Paladina', cls: 'Lideratge i Llum',
    emoji: '🛡️', color: '#9CA3AF', bg: 'rgba(156,163,175,0.2)',
    desc: 'Armadura plateada, espasa i escut. Elegant i letal.',
    draw: drawPaladina
  },
  bruixa: {
    id: 'bruixa', name: 'La Bruixa', cls: 'Misteri i Ombra',
    emoji: '🧙‍♀️', color: '#A78BFA', bg: 'rgba(167,139,250,0.2)',
    desc: 'Vestit negre, barret, vareta. Poder fosc.',
    draw: drawBruixa
  },
  arquera: {
    id: 'arquera', name: "L'Arquera", cls: 'Precisió Elfica',
    emoji: '🎯', color: '#34D399', bg: 'rgba(52,211,153,0.2)',
    desc: 'Armadura verda-marró, arc elfí. Orelles punxegudes.',
    draw: drawArquera
  }
};

// ─── ANIMATION STATE MACHINE ─────────────────────────────────────────────────
const ANIM_STATES = ['idle_front','idle_back','walk','attack','defend','celebrate','levelup','rest','hurt','sleep'];
const FRAME_MS = 150;

class CharacterRenderer {
  constructor(canvas, characterId, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.charId = characterId || localStorage.getItem(CHAR_KEY) || 'guerrer';
    this.state = 'idle_front';
    this.t = 0;
    this.lastTime = 0;
    this.raf = null;
    this.particles = new ParticleSystem();
    this.level = opts && opts.level || 1;
    this.stateQueue = [];
    this.stateDuration = 0;
    this.stateTimer = 0;
    this._scale = opts && opts.scale || S;
    this._loop = this._loop.bind(this);
    this.start();
  }

  setChar(id) {
    if (CHARACTERS[id]) { this.charId = id; }
  }

  setLevel(lvl) { this.level = lvl; }

  setState(state, durationMs) {
    if (ANIM_STATES.includes(state)) {
      this.state = state;
      this.t = 0;
      this.stateTimer = 0;
      this.stateDuration = durationMs || 0;
    }
  }

  queueStates(arr) {
    // arr = [state, durationMs, state2, durationMs2, ...]
    this.stateQueue = [];
    for (let i = 0; i < arr.length; i += 2) {
      this.stateQueue.push({ state: arr[i], duration: arr[i+1] || 2000 });
    }
    if (this.stateQueue.length) {
      const first = this.stateQueue.shift();
      this.setState(first.state, first.duration);
    }
  }

  start() {
    if (!this.raf) this.raf = requestAnimationFrame(this._loop);
  }

  stop() {
    if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
  }

  _loop(ts) {
    this.raf = requestAnimationFrame(this._loop);
    const dt = Math.min((ts - this.lastTime) / 1000, 0.1);
    this.lastTime = ts;

    this.t += dt;
    if (this.t > 1) this.t -= 1;

    if (this.stateDuration > 0) {
      this.stateTimer += dt * 1000;
      if (this.stateTimer >= this.stateDuration) {
        this.stateTimer = 0;
        this.stateDuration = 0;
        if (this.stateQueue.length) {
          const next = this.stateQueue.shift();
          this.setState(next.state, next.duration);
        } else {
          this.setState('idle_front');
        }
      }
    }

    this.particles.update(dt);
    this._draw();
  }

  _draw() {
    const ctx = this.ctx;
    const char = CHARACTERS[this.charId] || CHARACTERS.guerrer;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    if (this._scale !== S) {
      const ratio = this._scale / S;
      ctx.scale(ratio, ratio);
    }
    char.draw(ctx, this.state, this.t, this.level, this.particles);
    this.particles.draw(ctx);
    ctx.restore();
  }
}

// ─── EVENT → STATE MAPPING ───────────────────────────────────────────────────
const EVENT_MAP = {
  'task_complete':     ['attack', 600, 'celebrate', 2200, 'idle_front'],
  'task_create':       ['idle_front', 500],  // + question mark particle
  'pomodoro_start':    'walk',
  'pomodoro_complete': ['levelup', 800, 'celebrate', 2500, 'idle_front'],
  'habit_marked':      ['defend', 400, 'celebrate', 1800, 'idle_front'],
  'level_up':          ['levelup', 3500, 'celebrate', 2000, 'idle_front'],
  'idle_30s':          'idle_front',
  'idle_5min':         'rest',
  'app_start':         'idle_front',
  'error':             ['hurt', 1200, 'idle_front']
};

// ─── FLOATING WIDGET ─────────────────────────────────────────────────────────
let floatRenderer = null;
let floatCanvas = null;
let idleTimer = null;

function initFloatingWidget() {
  if (document.getElementById('ph-float-widget')) return;

  const wrap = document.createElement('div');
  wrap.id = 'ph-float-widget';
  wrap.style.cssText = `
    position:fixed; bottom:16px; right:16px; z-index:9999;
    display:flex; flex-direction:column; align-items:center;
    cursor:pointer; user-select:none;
    filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5));
    transition:transform .2s;
  `;
  wrap.title = 'El teu heroi — clica per canviar';

  floatCanvas = document.createElement('canvas');
  floatCanvas.width = CW;
  floatCanvas.height = CH;
  floatCanvas.style.cssText = `
    width:96px; height:96px;
    image-rendering:pixelated;
    image-rendering:crisp-edges;
  `;

  const nameTag = document.createElement('div');
  nameTag.id = 'ph-float-name';
  nameTag.style.cssText = `
    font-family:'Space Mono',monospace; font-size:7px; letter-spacing:1.5px;
    color:rgba(255,255,255,0.7); text-align:center; margin-top:2px;
    background:rgba(0,0,10,0.6); border-radius:4px; padding:2px 6px;
    white-space:nowrap; pointer-events:none;
  `;

  wrap.appendChild(floatCanvas);
  wrap.appendChild(nameTag);
  document.body.appendChild(wrap);

  wrap.addEventListener('mouseenter', () => { wrap.style.transform = 'scale(1.08)'; });
  wrap.addEventListener('mouseleave', () => { wrap.style.transform = 'scale(1)'; });
  wrap.addEventListener('click', openCharSelector);

  const selId = localStorage.getItem(CHAR_KEY) || 'guerrer';
  const char = CHARACTERS[selId];
  nameTag.textContent = char ? char.name.toUpperCase() : 'HEROI';

  const lvl = _getHeroLevel();
  floatRenderer = new CharacterRenderer(floatCanvas, selId, { level: lvl });

  // Idle timers
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    if (floatRenderer && floatRenderer.state === 'rest') {
      floatRenderer.setState('idle_front');
    }
    idleTimer = setTimeout(() => {
      if (floatRenderer) floatRenderer.setState('rest');
    }, 5 * 60 * 1000);
  }
  ['mousemove','keydown','click','touchstart'].forEach(ev => {
    document.addEventListener(ev, resetIdleTimer, { passive: true });
  });
  resetIdleTimer();

  // Responsive size
  function updateSize() {
    const isMobile = window.innerWidth < 640;
    floatCanvas.style.width = isMobile ? '72px' : '96px';
    floatCanvas.style.height = isMobile ? '72px' : '96px';
    wrap.style.bottom = isMobile ? '12px' : '16px';
    wrap.style.right = isMobile ? '12px' : '16px';
  }
  window.addEventListener('resize', updateSize);
  updateSize();
}

function _getHeroLevel() {
  try {
    const h = JSON.parse(localStorage.getItem('jomaxpath_hero_v2') || '{}');
    if (!h.xp) return 1;
    let lvl = 1, left = h.xp;
    while (left >= lvl * 100) { left -= lvl * 100; lvl++; }
    return lvl;
  } catch { return 1; }
}

// ─── CHARACTER SELECTOR MODAL ─────────────────────────────────────────────────
function buildSelectorHTML() {
  return `
<div id="ph-selector-overlay" style="position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.8);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:16px;" onclick="if(event.target===this)window.PixelHeroes.closeSelector()">
  <div style="background:#0c0c1e;border:1px solid rgba(124,58,237,0.35);border-radius:20px;padding:24px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;">
    <div style="font-family:'Space Mono',monospace;font-size:10px;letter-spacing:3px;color:#a78bfa;text-align:center;margin-bottom:6px;">✦ TRIA EL TEU HEROI</div>
    <div style="font-size:11px;color:#64748b;text-align:center;margin-bottom:20px;">Cada heroi manté el teu nivell. Pots canviar quan vulguis.</div>
    <div id="ph-sel-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;"></div>
    <button onclick="window.PixelHeroes.closeSelector()" style="width:100%;padding:10px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#64748b;cursor:pointer;font-size:13px;">Tancar</button>
  </div>
</div>`;
}

function openCharSelector() {
  if (document.getElementById('ph-selector-overlay')) return;
  document.body.insertAdjacentHTML('beforeend', buildSelectorHTML());

  const grid = document.getElementById('ph-sel-grid');
  const current = localStorage.getItem(CHAR_KEY) || 'guerrer';
  const lvl = _getHeroLevel();

  Object.values(CHARACTERS).forEach(char => {
    const card = document.createElement('div');
    const isSel = char.id === current;
    card.style.cssText = `
      border:2px solid ${isSel ? char.color : 'rgba(255,255,255,0.07)'};
      border-radius:14px; padding:12px 8px; cursor:pointer;
      text-align:center; background:${isSel ? char.bg : 'rgba(255,255,255,0.02)'};
      transition:all .2s; position:relative;
    `;

    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = CW;
    previewCanvas.height = CH;
    previewCanvas.style.cssText = 'width:80px;height:80px;image-rendering:pixelated;image-rendering:crisp-edges;';
    card.appendChild(previewCanvas);

    card.innerHTML += `
      <div style="font-family:'Space Mono',monospace;font-size:7.5px;letter-spacing:1.5px;color:#e2e8f0;margin-top:6px;">${char.name.toUpperCase()}</div>
      <div style="font-size:9px;color:#64748b;margin-top:2px;">${char.cls}</div>
      ${isSel ? '<div style="position:absolute;top:6px;right:8px;font-size:9px;font-family:\'Space Mono\',monospace;color:#a78bfa;">✓</div>' : ''}
    `;

    // mini renderer for preview
    const previewRenderer = new CharacterRenderer(previewCanvas, char.id, { level: lvl });
    previewRenderer.setState('idle_front');

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-3px)';
      card.style.borderColor = char.color;
      previewRenderer.setState('celebrate', 1500);
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.borderColor = isSel ? char.color : 'rgba(255,255,255,0.07)';
      previewRenderer.setState('idle_front');
    });
    card.onclick = () => {
      previewRenderer.stop();
      window.PixelHeroes.selectChar(char.id);
    };

    // put canvas first
    card.insertBefore(previewCanvas, card.firstChild);
    grid.appendChild(card);
  });
}

function closeCharSelector() {
  const ov = document.getElementById('ph-selector-overlay');
  if (ov) ov.remove();
}

// ─── EVENT BUS ───────────────────────────────────────────────────────────────
function triggerEvent(eventType) {
  const mapping = EVENT_MAP[eventType];
  if (!mapping) return;

  [stageRenderer].forEach(r => {
    if (!r) return;
    if (Array.isArray(mapping)) {
      r.queueStates([...mapping]);
    } else if (typeof mapping === 'string') {
      r.setState(mapping);
    }
    if (eventType === 'task_create' && r.particles) {
      r.particles.emit('question', 24, 8, '#FFFFFF');
    }
    if (eventType === 'level_up' && r.particles) {
      r.particles.emit('xp', 24, 5, '#FFD700');
    }
  });
}

// ─── MAIN HERO STAGE CANVAS (for hero.html) ──────────────────────────────────
let stageRenderer = null;

function initHeroStage(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const selId = localStorage.getItem(CHAR_KEY) || 'guerrer';
  const lvl = _getHeroLevel();
  stageRenderer = new CharacterRenderer(canvas, selId, { level: lvl, scale: 4 });
  stageRenderer.setState('idle_front');
  return stageRenderer;
}

function updateStageLevel(lvl) {
  if (stageRenderer) stageRenderer.setLevel(lvl);
}

// ─── AUTO-INIT ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Floating widget disabled (removed per user request)
});

// ─── PUBLIC API ──────────────────────────────────────────────────────────────
global.PixelHeroes = {
  CHARACTERS,
  CharacterRenderer,
  triggerEvent,
  openSelector: openCharSelector,
  closeSelector: closeCharSelector,
  initHeroStage,
  updateStageLevel,
  get stageRenderer() { return stageRenderer; },
  get floatRenderer() { return floatRenderer; },
  selectChar(id) {
    if (!CHARACTERS[id]) return;
    localStorage.setItem(CHAR_KEY, id);
    if (stageRenderer) stageRenderer.setChar(id);
    closeCharSelector();
    if (stageRenderer) stageRenderer.queueStates(['celebrate', 1500, 'idle_front']);
    // sync amb hero.html si existeix
    if (typeof renderHeroSkin === 'function') renderHeroSkin();
    if (typeof showToast === 'function') showToast('✦ Heroi canviat a ' + CHARACTERS[id].name + '!');
  },
  getSelectedChar() { return localStorage.getItem(CHAR_KEY) || 'guerrer'; },
  getCharacters() { return CHARACTERS; }
};

})(typeof window !== 'undefined' ? window : this);
