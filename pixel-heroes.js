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
// Túnica índigo, bastó cristall, cabell espigat fosc, ulls violetes
// ═══════════════════════════════════════════════════════════════════════════════
function drawMag(ctx, state, t, level, particles) {
  const cx = 24;
  const breatheY = (state === 'idle_front' || state === 'idle_back') ? wave(t, 0.7, 1) : 0;
  const walkBob  = state === 'walk' ? Math.abs(wave(t, 2, 2)) - 1 : 0;
  const bodyOff  = breatheY + walkBob;
  const expr = state === 'celebrate' ? 'happy' : state === 'hurt' ? 'hurt' :
               state === 'sleep' || state === 'rest' ? 'sleep' : 'neutral';
  const isAttack = state === 'attack';

  ellipse(ctx, cx, 46.5, 11, 2.5, 'rgba(0,0,30,0.4)');

  // STAFF (tall, drawn first so arms overlap)
  const staffGlow = 0.5 + 0.5 * Math.sin(t * Math.PI * 3);
  const staffY = Math.round(bodyOff);
  B(ctx, 3, staffY + 2, 3, 40, '#2E1503');
  B(ctx, 4, staffY + 2, 2, 40, '#5C3010');
  B(ctx, 5, staffY + 2, 1, 40, '#7A4015');
  // Crystal orb (5 levels)
  B(ctx, 1, staffY,     7, 7, '#1E1B4B');
  B(ctx, 2, staffY,     5, 6, '#312E81');
  B(ctx, 3, staffY + 1, 3, 4, '#4C1D95');
  B(ctx, 3, staffY + 1, 2, 2, '#A78BFA');
  B(ctx, 2, staffY,     2, 2, '#C4B5FD');
  ctx.save(); ctx.globalAlpha = staffGlow * 0.5;
  circle(ctx, 4.5, staffY + 3, 5, '#7C3AED');
  ctx.restore();
  if (particles && (isAttack || state === 'levelup') && Math.random() < 0.3)
    particles.emit('sparkle', 4, staffY + 3, '#A78BFA');

  // LEFT ARM (purple robe sleeve)
  B(ctx, 7, Math.round(22 + bodyOff), 6, 13, '#2D1B69');
  B(ctx, 8, Math.round(23 + bodyOff), 5, 11, '#4C1D95');
  B(ctx, 9, Math.round(24 + bodyOff), 4,  9, '#6D28D9');

  // RIGHT ARM (casting, raises when attack)
  const armRaise = isAttack ? Math.abs(wave(t, 5, 1)) : 0;
  B(ctx, 35, Math.round(22 + bodyOff - armRaise), 6, 13, '#2D1B69');
  B(ctx, 36, Math.round(23 + bodyOff - armRaise), 5, 11, '#4C1D95');
  B(ctx, 37, Math.round(24 + bodyOff - armRaise), 4,  9, '#6D28D9');
  if (isAttack) {
    ctx.save(); ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * Math.PI * 4);
    circle(ctx, 44, Math.round(22 + bodyOff - armRaise), 6, '#7C3AED');
    circle(ctx, 44, Math.round(22 + bodyOff - armRaise), 4, '#C4B5FD');
    ctx.restore();
  }

  // ROBE (5 levels, wide bell shape)
  const ry = Math.round(22 + bodyOff);
  B(ctx, 9,  ry,     30, 24, '#1E1B4B');
  B(ctx, 10, ry + 1, 28, 22, '#2D1B69');
  B(ctx, 12, ry + 2, 24, 20, '#4C1D95');
  B(ctx, 14, ry + 3, 20, 18, '#6D28D9');
  B(ctx, 16, ry + 4, 16, 14, '#7C3AED');
  B(ctx, 18, ry + 5, 12,  8, '#8B4CF7');
  // Edge shadows
  B(ctx, 10, ry + 1, 2, 22, '#1E1B4B');
  B(ctx, 36, ry + 1, 2, 22, '#1E1B4B');
  // Gold trim top
  B(ctx, 9,  ry,     30, 1, '#F0C840');
  // Hem flare
  B(ctx, 6,  ry + 22, 36, 2, '#1E1B4B');
  B(ctx, 8,  ry + 22, 32, 2, '#2D1B69');
  B(ctx, 10, ry + 23, 28, 2, '#4C1D95');
  B(ctx, 8,  ry + 24,  1,  1, '#C8960C'); // gold hem edge
  B(ctx, 39, ry + 24,  1,  1, '#C8960C');
  // Rune accents
  for (let i = 0; i < 3; i++) {
    const rx2 = 16 + i * 6;
    B(ctx, rx2,     ry + 10, 2, 3, '#A78BFA');
    B(ctx, rx2 + 1, ry + 8,  1, 1, '#C4B5FD');
  }
  // Belt sash
  B(ctx, 11, ry + 13, 26, 3, '#3A2804');
  B(ctx, 12, ry + 13, 24, 2, '#7A5A08');
  B(ctx, 21, ry + 13,  6, 2, '#C8960C');
  B(ctx, 22, ry + 13,  4, 1, '#F0C840');
  // Collar
  B(ctx, 18, ry, 12, 4, '#1E1B4B');
  B(ctx, 19, ry, 10, 3, '#2D1B69');
  B(ctx, 20, ry,  8, 2, '#4C1D95');

  // NECK
  B(ctx, 19, Math.round(18 + bodyOff), 10, 5, '#C49060');
  B(ctx, 20, Math.round(18 + bodyOff),  8, 4, '#D4A574');
  B(ctx, 21, Math.round(18 + bodyOff),  6, 3, '#FDDBB4');

  // HEAD
  const hy = Math.round(2 + bodyOff);

  // HAIR (dark indigo, very tall spiky)
  B(ctx, 11, hy - 2, 26, 10, '#0F0A2E');
  B(ctx, 12, hy - 2, 24,  9, '#1E1B4B');
  B(ctx, 13, hy - 2, 22,  8, '#312E81');
  B(ctx, 15, hy - 3, 18,  6, '#3730A3');
  B(ctx, 17, hy - 4, 14,  6, '#4338CA');
  // Spikes
  B(ctx, 19, hy - 6, 10, 5, '#4338CA');
  B(ctx, 21, hy - 8,  6, 4, '#4F46E5');
  B(ctx, 22, hy - 9,  4, 3, '#6366F1');
  B(ctx, 23, hy -10,  2, 2, '#818CF8');
  // Spike shine
  B(ctx, 22, hy - 6,  4, 1, '#A5B4FC');
  B(ctx, 23, hy - 7,  2, 1, '#C7D2FE');
  // Long side strands
  B(ctx, 11, hy + 4, 3, 18, '#0F0A2E');
  B(ctx, 12, hy + 4, 2, 17, '#1E1B4B');
  B(ctx, 35, hy + 4, 3, 18, '#0F0A2E');
  B(ctx, 35, hy + 4, 2, 17, '#1E1B4B');

  // FACE (22px wide, 19px tall)
  B(ctx, 12, hy + 4, 24, 20, '#C49060');
  B(ctx, 13, hy + 4, 22, 19, '#FDDBB4');
  B(ctx, 13, hy + 4,  2, 19, '#D4A574');
  B(ctx, 33, hy + 4,  2, 19, '#D4A574');
  B(ctx, 13, hy + 10, 1,  9, '#C49060');
  B(ctx, 34, hy + 10, 1,  9, '#C49060');
  B(ctx, 16, hy + 4, 16,  6, '#FFE8C8');
  B(ctx, 18, hy + 4, 12,  4, '#FFFCF0');
  B(ctx, 14, hy + 19, 20, 3, '#D4A574');
  B(ctx, 16, hy + 20, 16, 2, '#C49060');
  B(ctx, 13, hy + 13,  3, 6, '#D4A574');
  B(ctx, 32, hy + 13,  3, 6, '#D4A574');
  ellipse(ctx, 15.5, hy + 16.5, 2.5, 2, 'rgba(255,120,100,0.3)');
  ellipse(ctx, 32.5, hy + 16.5, 2.5, 2, 'rgba(255,120,100,0.3)');

  // EYEBROWS (arched, thin — mage style)
  if (expr === 'hurt' || isAttack) {
    B(ctx, 15, hy + 9, 6, 1, '#1E1B4B'); B(ctx, 20, hy + 8, 2, 2, '#1E1B4B');
    B(ctx, 27, hy + 9, 6, 1, '#1E1B4B'); B(ctx, 26, hy + 8, 2, 2, '#1E1B4B');
  } else {
    B(ctx, 15, hy + 9, 6, 1, '#1E1B4B');
    B(ctx, 27, hy + 9, 6, 1, '#1E1B4B');
  }

  // EYES (8×5px, purple glowing)
  if (expr === 'sleep') {
    B(ctx, 14, hy + 13, 8, 2, '#1E1B4B'); B(ctx, 15, hy + 12, 6, 1, '#312E81');
    B(ctx, 26, hy + 13, 8, 2, '#1E1B4B'); B(ctx, 27, hy + 12, 6, 1, '#312E81');
  } else {
    // Left eye
    B(ctx, 13, hy + 12, 10, 2, '#1E1B4B');
    B(ctx, 12, hy + 13,  1, 1, '#1E1B4B');
    B(ctx, 14, hy + 13,  8, 5, '#FFFFFF');
    B(ctx, 13, hy + 17,  9, 1, '#D4A574');
    B(ctx, 15, hy + 13,  6, 4, '#4C1D95');
    B(ctx, 16, hy + 13,  4, 3, '#6D28D9');
    B(ctx, 17, hy + 14,  3, 2, '#7C3AED');
    B(ctx, 15, hy + 15,  6, 2, '#2D1B69');
    B(ctx, 17, hy + 14,  2, 2, '#1E1B4B');
    B(ctx, 15, hy + 13,  2, 2, '#FFFFFF');
    B(ctx, 20, hy + 16,  1, 1, '#FFFFFF');
    B(ctx, 16, hy + 13,  3, 1, '#C4B5FD');
    ctx.save(); ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * Math.PI * 2);
    B(ctx, 16, hy + 14, 2, 1, '#A78BFA'); ctx.restore();
    // Right eye
    B(ctx, 25, hy + 12, 10, 2, '#1E1B4B');
    B(ctx, 35, hy + 13,  1, 1, '#1E1B4B');
    B(ctx, 26, hy + 13,  8, 5, '#FFFFFF');
    B(ctx, 25, hy + 17,  9, 1, '#D4A574');
    B(ctx, 27, hy + 13,  6, 4, '#4C1D95');
    B(ctx, 28, hy + 13,  4, 3, '#6D28D9');
    B(ctx, 29, hy + 14,  3, 2, '#7C3AED');
    B(ctx, 27, hy + 15,  6, 2, '#2D1B69');
    B(ctx, 29, hy + 14,  2, 2, '#1E1B4B');
    B(ctx, 27, hy + 13,  2, 2, '#FFFFFF');
    B(ctx, 32, hy + 16,  1, 1, '#FFFFFF');
    B(ctx, 28, hy + 13,  3, 1, '#C4B5FD');
    ctx.save(); ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * Math.PI * 2);
    B(ctx, 28, hy + 14, 2, 1, '#A78BFA'); ctx.restore();
  }

  // Nose
  B(ctx, 21, hy + 19, 2, 1, '#C49060');
  B(ctx, 22, hy + 20, 4, 1, '#D4A574');

  // Mouth
  if (expr === 'happy') {
    B(ctx, 18, hy + 22, 12, 1, '#1E1B4B');
    B(ctx, 17, hy + 21,  2, 2, '#1E1B4B');
    B(ctx, 29, hy + 21,  2, 2, '#1E1B4B');
    B(ctx, 18, hy + 22, 12, 1, '#FFFFFF');
    B(ctx, 18, hy + 23, 12, 1, '#D4A574');
  } else if (expr === 'hurt') {
    B(ctx, 18, hy + 22, 12, 1, '#1E1B4B');
    B(ctx, 17, hy + 21,  2, 3, '#1E1B4B');
    B(ctx, 29, hy + 21,  2, 3, '#1E1B4B');
  } else {
    B(ctx, 19, hy + 22, 10, 1, '#1E1B4B');
    B(ctx, 18, hy + 23, 12, 1, '#D4A574');
  }

  // Gold circlet with gem
  B(ctx, 14, hy + 4, 4, 2, '#3A2804'); B(ctx, 15, hy + 4, 3, 1, '#F0C840');
  B(ctx, 30, hy + 4, 4, 2, '#3A2804'); B(ctx, 31, hy + 4, 3, 1, '#F0C840');
  B(ctx, 22, hy + 3, 4, 3, '#3A2804');
  B(ctx, 23, hy + 3, 2, 2, '#C4B5FD');
  B(ctx, 23, hy + 3, 2, 1, '#FFFFFF');

  // Front hair wisps
  B(ctx, 13, hy + 4, 3, 6, '#1E1B4B');
  B(ctx, 14, hy + 5, 2, 5, '#312E81');
  B(ctx, 32, hy + 4, 3, 6, '#1E1B4B');
  B(ctx, 32, hy + 5, 2, 5, '#312E81');

  if (level >= 6) {
    ctx.save(); ctx.globalAlpha = 0.2 + 0.1 * Math.sin(t * Math.PI * 2);
    circle(ctx, cx, Math.round(34 + bodyOff), 20, '#7C3AED'); ctx.restore();
  }
  if (state === 'celebrate' && particles && Math.random() < 0.2)
    particles.emit('sparkle', cx + wave(t, 8, 1), 8, '#A78BFA');
  if (state === 'levelup' && particles && Math.random() < 0.4)
    particles.emit('sparkle', cx + wave(t, 10, 1), 12, '#C4B5FD');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── EL RANGER (Heroi 3) ──────────────────────────────────────────────────────
// Armadura verda lleugera, arc i fletxes, bandana, àgil
// ═══════════════════════════════════════════════════════════════════════════════
function drawRanger(ctx, state, t, level, particles) {
  const cx = 24;
  const breatheY = (state === 'idle_front' || state === 'idle_back') ? wave(t, 0.7, 1) : 0;
  const walkBob  = state === 'walk' ? Math.abs(wave(t, 2, 2)) - 1 : 0;
  const legSwing = state === 'walk' ? wave(t, 4, 2) : 0;
  const bodyOff  = breatheY + walkBob;
  const expr = state === 'celebrate' ? 'happy' : state === 'hurt' ? 'hurt' :
               state === 'sleep' || state === 'rest' ? 'sleep' : 'neutral';
  const isAttack = state === 'attack';

  ellipse(ctx, cx, 46.5, 12, 2.8, 'rgba(0,0,30,0.4)');

  // QUIVER (right back)
  B(ctx, 35, Math.round(14 + bodyOff), 6, 20, '#2E1503');
  B(ctx, 36, Math.round(15 + bodyOff), 4, 18, '#5C3010');
  B(ctx, 36, Math.round(13 + bodyOff), 4, 4,  '#065F46');
  B(ctx, 37, Math.round(12 + bodyOff), 2, 3,  '#10B981');

  // BOW (left, curved with elven leaf tips)
  const bowPull = isAttack ? Math.abs(wave(t, 4, 1)) : 0;
  B(ctx, 1, Math.round( 8 + bodyOff), 3, 5,  '#78350F');
  B(ctx, 1, Math.round(32 + bodyOff), 3, 5,  '#78350F');
  B(ctx, 1, Math.round(13 + bodyOff), 3, 19, '#B45309');
  B(ctx, 2, Math.round( 9 + bodyOff), 1, 30, '#FDE68A');
  B(ctx, 0, Math.round( 5 + bodyOff), 4, 4,  '#064E3B');
  B(ctx, 0, Math.round(34 + bodyOff), 4, 4,  '#064E3B');
  B(ctx, 1, Math.round( 6 + bodyOff), 2, 2,  '#10B981');
  B(ctx, 1, Math.round(35 + bodyOff), 2, 2,  '#10B981');
  if (isAttack) {
    const arrowY = Math.round(22 + bodyOff - bowPull * 0.5);
    B(ctx, 2, arrowY, 16, 1, '#78350F');
    B(ctx, 2, arrowY, 1,  1, '#F59E0B');
    B(ctx, 14, arrowY - 1, 4, 3, '#065F46');
    if (particles && Math.random() < 0.3) particles.emit('star', 2, arrowY, '#10B981');
  }

  // LEFT ARM
  B(ctx, 7, Math.round(22 + bodyOff), 7, 13, '#064E3B');
  B(ctx, 8, Math.round(23 + bodyOff), 5, 11, '#065F46');
  B(ctx, 9, Math.round(24 + bodyOff), 4,  9, '#10B981');

  // RIGHT ARM
  B(ctx, 34, Math.round(22 + bodyOff), 7, 13, '#064E3B');
  B(ctx, 35, Math.round(23 + bodyOff), 5, 11, '#065F46');
  B(ctx, 36, Math.round(24 + bodyOff), 4,  9, '#10B981');

  // LEATHER CHEST ARMOR (5-level shading)
  const by = Math.round(20 + bodyOff);
  // Green shoulder pads
  B(ctx, 9,  by,     8, 6, '#064E3B'); B(ctx, 10, by + 1, 6, 5, '#065F46');
  B(ctx, 11, by + 1, 5, 4, '#10B981'); B(ctx, 9,  by,     8, 1, '#34D399');
  B(ctx, 31, by,     8, 6, '#064E3B'); B(ctx, 32, by + 1, 6, 5, '#065F46');
  B(ctx, 33, by + 1, 5, 4, '#10B981'); B(ctx, 31, by,     8, 1, '#34D399');
  // Main vest (brown + green panel)
  B(ctx, 12, by + 1, 24, 14, '#3D1F08');
  B(ctx, 13, by + 2, 22, 12, '#5C3010');
  B(ctx, 14, by + 2, 20, 11, '#78350F');
  B(ctx, 16, by + 3, 16,  9, '#065F46');
  B(ctx, 18, by + 4, 12,  7, '#10B981');
  B(ctx, 13, by + 2, 1, 12, '#2E1503');
  B(ctx, 34, by + 2, 1, 12, '#2E1503');
  // Strap details
  B(ctx, 18, by + 2, 12, 1, '#064E3B');
  B(ctx, 20, by + 2,  2, 10, '#3D1F08');
  B(ctx, 26, by + 2,  2, 10, '#3D1F08');
  // Belt
  B(ctx, 12, by + 14, 24, 3, '#3D1F08');
  B(ctx, 13, by + 14, 22, 2, '#5C3010');
  B(ctx, 20, by + 14,  8, 2, '#78350F');
  B(ctx, 22, by + 14,  4, 1, '#B45309');

  // LEGS (green with brown boots)
  const lly = Math.round(35 + bodyOff);
  const lleg = Math.round(legSwing * 0.5);
  B(ctx, 12, lly - lleg,     11, 9, '#064E3B'); B(ctx, 13, lly - lleg + 1, 9, 7, '#065F46');
  B(ctx, 14, lly - lleg + 1,  7, 6, '#10B981'); B(ctx, 15, lly - lleg + 2, 5, 4, '#34D399');
  B(ctx, 11, lly - lleg + 8, 12, 4, '#3D1F08'); B(ctx, 12, lly - lleg + 9, 10, 3, '#5C3010');
  B(ctx, 25, lly + lleg,     11, 9, '#064E3B'); B(ctx, 26, lly + lleg + 1, 9, 7, '#065F46');
  B(ctx, 27, lly + lleg + 1,  7, 6, '#10B981'); B(ctx, 28, lly + lleg + 2, 5, 4, '#34D399');
  B(ctx, 24, lly + lleg + 8, 12, 4, '#3D1F08'); B(ctx, 25, lly + lleg + 9, 10, 3, '#5C3010');

  // NECK
  B(ctx, 19, Math.round(18 + bodyOff), 10, 5, '#C49060');
  B(ctx, 20, Math.round(18 + bodyOff),  8, 4, '#D4A574');
  B(ctx, 21, Math.round(18 + bodyOff),  6, 3, '#FDDBB4');

  // HEAD
  const hy = Math.round(2 + bodyOff);

  // HAIR (messy dark brown, 5-level)
  B(ctx, 11, hy - 2, 26, 9, '#1A0800'); B(ctx, 12, hy - 2, 24, 8, '#2E1503');
  B(ctx, 13, hy - 2, 22, 7, '#3D1F08'); B(ctx, 15, hy - 3, 18, 5, '#5C3010');
  B(ctx, 17, hy - 3, 14, 4, '#7C4020');
  // Messy tufts
  B(ctx, 18, hy - 4, 5, 3, '#8B5020'); B(ctx, 25, hy - 3, 4, 3, '#8B5020');
  B(ctx, 22, hy - 5, 4, 2, '#C07030');
  B(ctx, 21, hy - 3, 6, 1, '#C07030'); // highlight
  // Side strands
  B(ctx, 11, hy + 4, 3, 14, '#1A0800'); B(ctx, 12, hy + 4, 2, 13, '#2E1503');
  B(ctx, 35, hy + 4, 3, 14, '#1A0800'); B(ctx, 35, hy + 4, 2, 13, '#2E1503');
  // GREEN BANDANA
  B(ctx, 12, hy + 4, 24, 4, '#064E3B'); B(ctx, 13, hy + 4, 22, 3, '#065F46');
  B(ctx, 14, hy + 4, 20, 2, '#10B981'); B(ctx, 14, hy + 4,  4, 2, '#34D399');
  // Bandana knot right
  B(ctx, 34, hy + 3, 5, 4, '#064E3B'); B(ctx, 35, hy + 3, 4, 3, '#065F46');
  B(ctx, 35, hy + 3, 2, 2, '#10B981');

  // FACE (22px wide, 17px tall — bandana takes 2px at top)
  B(ctx, 12, hy + 6, 24, 18, '#C49060');
  B(ctx, 13, hy + 6, 22, 17, '#FDDBB4');
  B(ctx, 13, hy + 6,  2, 17, '#D4A574');
  B(ctx, 33, hy + 6,  2, 17, '#D4A574');
  B(ctx, 13, hy + 12, 1,  7, '#C49060'); B(ctx, 34, hy + 12, 1, 7, '#C49060');
  B(ctx, 16, hy + 6, 16,  5, '#FFE8C8'); B(ctx, 18, hy + 6, 12, 3, '#FFFCF0');
  B(ctx, 14, hy + 19, 20, 3, '#D4A574'); B(ctx, 16, hy + 20, 16, 2, '#C49060');
  B(ctx, 13, hy + 13, 3,  5, '#D4A574'); B(ctx, 32, hy + 13, 3, 5, '#D4A574');
  ellipse(ctx, 15.5, hy + 15.5, 2.5, 2, 'rgba(255,120,100,0.3)');
  ellipse(ctx, 32.5, hy + 15.5, 2.5, 2, 'rgba(255,120,100,0.3)');

  // EYEBROWS
  if (expr === 'hurt' || isAttack) {
    B(ctx, 15, hy + 9, 6, 1, '#2E1503'); B(ctx, 14, hy + 10, 2, 1, '#2E1503');
    B(ctx, 27, hy + 9, 6, 1, '#2E1503'); B(ctx, 32, hy + 10, 2, 1, '#2E1503');
    B(ctx, 20, hy + 8, 2, 2, '#2E1503'); B(ctx, 26, hy + 8, 2, 2, '#2E1503');
  } else {
    B(ctx, 14, hy + 9, 7, 2, '#2E1503');
    B(ctx, 27, hy + 9, 7, 2, '#2E1503');
  }

  // EYES (8×5px, green)
  if (expr === 'sleep') {
    B(ctx, 14, hy + 13, 8, 2, '#064E3B'); B(ctx, 15, hy + 12, 6, 1, '#065F46');
    B(ctx, 26, hy + 13, 8, 2, '#064E3B'); B(ctx, 27, hy + 12, 6, 1, '#065F46');
  } else {
    // Left eye
    B(ctx, 13, hy + 12, 10, 2, '#1A0800'); B(ctx, 12, hy + 13, 1, 1, '#1A0800');
    B(ctx, 14, hy + 13,  8, 5, '#FFFFFF'); B(ctx, 13, hy + 17, 9, 1, '#D4A574');
    B(ctx, 15, hy + 13,  6, 4, '#064E3B'); B(ctx, 16, hy + 13, 4, 3, '#065F46');
    B(ctx, 17, hy + 14,  3, 2, '#10B981'); B(ctx, 15, hy + 15, 6, 2, '#022C22');
    B(ctx, 17, hy + 14,  2, 2, '#011811'); B(ctx, 15, hy + 13, 2, 2, '#FFFFFF');
    B(ctx, 20, hy + 16,  1, 1, '#FFFFFF'); B(ctx, 16, hy + 13, 3, 1, '#6EE7B7');
    // Right eye
    B(ctx, 25, hy + 12, 10, 2, '#1A0800'); B(ctx, 35, hy + 13, 1, 1, '#1A0800');
    B(ctx, 26, hy + 13,  8, 5, '#FFFFFF'); B(ctx, 25, hy + 17, 9, 1, '#D4A574');
    B(ctx, 27, hy + 13,  6, 4, '#064E3B'); B(ctx, 28, hy + 13, 4, 3, '#065F46');
    B(ctx, 29, hy + 14,  3, 2, '#10B981'); B(ctx, 27, hy + 15, 6, 2, '#022C22');
    B(ctx, 29, hy + 14,  2, 2, '#011811'); B(ctx, 27, hy + 13, 2, 2, '#FFFFFF');
    B(ctx, 32, hy + 16,  1, 1, '#FFFFFF'); B(ctx, 28, hy + 13, 3, 1, '#6EE7B7');
  }

  // Nose + mouth
  B(ctx, 21, hy + 19, 2, 1, '#C49060'); B(ctx, 22, hy + 20, 4, 1, '#D4A574');
  if (expr === 'happy') {
    B(ctx, 18, hy + 22, 12, 1, '#1A0800'); B(ctx, 17, hy + 21, 2, 2, '#1A0800');
    B(ctx, 29, hy + 21,  2, 2, '#1A0800'); B(ctx, 18, hy + 22, 12, 1, '#FFFFFF');
    B(ctx, 18, hy + 23, 12, 1, '#D4A574');
  } else if (expr === 'hurt') {
    B(ctx, 18, hy + 22, 12, 1, '#1A0800');
    B(ctx, 17, hy + 21, 2, 3, '#1A0800'); B(ctx, 29, hy + 21, 2, 3, '#1A0800');
  } else {
    B(ctx, 19, hy + 22, 10, 1, '#1A0800'); B(ctx, 18, hy + 23, 12, 1, '#D4A574');
  }

  // Front hair wisps
  B(ctx, 13, hy + 4, 3, 6, '#2E1503'); B(ctx, 14, hy + 5, 2, 5, '#5C3010');
  B(ctx, 32, hy + 4, 3, 6, '#2E1503'); B(ctx, 32, hy + 5, 2, 5, '#5C3010');

  if (level >= 6) {
    ctx.save(); ctx.globalAlpha = 0.15 + 0.1 * Math.sin(t * Math.PI * 2);
    B(ctx, 13, hy, 22, 19, '#34D399'); ctx.restore();
  }
  if (state === 'celebrate' && particles && Math.random() < 0.2)
    particles.emit('star', cx + wave(t, 8, 1), 8, '#10B981');
  if (state === 'levelup' && particles && Math.random() < 0.4)
    particles.emit('sparkle', cx + wave(t, 10, 1), 12, '#6EE7B7');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LA PALADINA (Heroïna 1) ──────────────────────────────────────────────────
// Armadura plateada elegant, espasa i escut, trenes daurades
// ═══════════════════════════════════════════════════════════════════════════════
function drawPaladina(ctx, state, t, level, particles) {
  const cx = 24;
  const breatheY = (state === 'idle_front' || state === 'idle_back') ? wave(t, 0.7, 1) : 0;
  const walkBob  = state === 'walk' ? Math.abs(wave(t, 2, 2)) - 1 : 0;
  const legSwing = state === 'walk' ? wave(t, 4, 2) : 0;
  const bodyOff  = breatheY + walkBob;
  const expr = state === 'celebrate' ? 'happy' : state === 'hurt' ? 'hurt' :
               state === 'sleep' || state === 'rest' ? 'sleep' : 'neutral';
  const isAttack = state === 'attack';
  const isDefend = state === 'defend';

  ellipse(ctx, cx, 46.5, 12, 2.8, 'rgba(0,0,30,0.4)');

  // GOLDEN BRAIDS (behind body, animated sway)
  const bs = Math.round(wave(t, 1.2, 1) * 0.5);
  B(ctx, 9 + bs,  Math.round(14 + bodyOff), 4, 24, '#7A5A08');
  B(ctx, 10 + bs, Math.round(14 + bodyOff), 3, 23, '#C8960C');
  B(ctx, 10 + bs, Math.round(14 + bodyOff), 2, 23, '#F0C840');
  for (let i = 0; i < 7; i++) {
    B(ctx, 9 + bs, Math.round(14 + bodyOff + i * 3), 3, 1, '#FDE68A');
    B(ctx, 10 + bs, Math.round(15 + bodyOff + i * 3), 2, 1, '#A07020');
  }
  B(ctx, 35 - bs, Math.round(14 + bodyOff), 4, 24, '#7A5A08');
  B(ctx, 35 - bs, Math.round(14 + bodyOff), 3, 23, '#C8960C');
  B(ctx, 36 - bs, Math.round(14 + bodyOff), 2, 23, '#F0C840');
  for (let i = 0; i < 7; i++) {
    B(ctx, 35 - bs, Math.round(14 + bodyOff + i * 3), 3, 1, '#FDE68A');
    B(ctx, 36 - bs, Math.round(15 + bodyOff + i * 3), 2, 1, '#A07020');
  }

  // ROUND SHIELD (left)
  const shieldY = isDefend ? Math.round(14 + bodyOff) : Math.round(24 + bodyOff);
  B(ctx, 1, shieldY,      12, 19, '#374151');
  B(ctx, 2, shieldY + 1,  10, 17, '#4B5563');
  B(ctx, 3, shieldY + 1,   8, 15, '#6B7280');
  B(ctx, 4, shieldY + 2,   6, 13, '#9CA3AF');
  B(ctx, 5, shieldY + 3,   4,  4, '#D1D5DB');
  // Gold cross
  B(ctx, 2, shieldY + 8,   10, 2, '#F0C840'); B(ctx, 6, shieldY + 2, 2, 14, '#F0C840');
  B(ctx, 6, shieldY + 8,    2, 2, '#FFFFC0');
  // Rim
  B(ctx, 2, shieldY + 1,    9, 1, '#F0C840'); B(ctx, 2, shieldY + 16, 9, 1, '#C8960C');
  B(ctx, 2, shieldY + 1,    1, 16, '#F0C840'); B(ctx, 11, shieldY + 1, 1, 16, '#C8960C');

  // LIGHT BLUE CAPE SIDES
  const capeY = Math.round(20 + bodyOff);
  B(ctx, 6,  capeY, 5, 22, '#374151'); B(ctx, 37, capeY, 5, 22, '#374151');
  B(ctx, 7,  capeY + 1, 4, 20, '#E0F2FE'); B(ctx, 37, capeY + 1, 4, 20, '#E0F2FE');
  B(ctx, 8,  capeY + 2, 3, 17, '#BAE6FD'); B(ctx, 38, capeY + 2, 3, 17, '#BAE6FD');

  // LEFT ARM (silver plate)
  B(ctx, 7,  Math.round(22 + bodyOff), 7, 13, '#4B5563');
  B(ctx, 8,  Math.round(23 + bodyOff), 5, 11, '#6B7280');
  B(ctx, 9,  Math.round(23 + bodyOff), 4, 10, '#9CA3AF');
  B(ctx, 10, Math.round(24 + bodyOff), 3,  8, '#D1D5DB');

  // RIGHT ARM + SWORD
  const swordRaise = isAttack ? Math.abs(wave(t, 7, 1)) : 0;
  B(ctx, 34, Math.round(22 + bodyOff), 7, 13, '#4B5563');
  B(ctx, 35, Math.round(23 + bodyOff), 5, 11, '#6B7280');
  B(ctx, 36, Math.round(23 + bodyOff), 4, 10, '#9CA3AF');
  // Slim elegant sword
  const swOff = Math.round(-swordRaise);
  B(ctx, 42, 6 + swOff,  2, 30, '#4B5563');
  B(ctx, 42, 7 + swOff,  2, 28, '#9CA3AF');
  B(ctx, 43, 7 + swOff,  1, 28, '#F3F4F6');
  B(ctx, 43, 7 + swOff,  1, 6,  '#FFFFFF');
  // Gold crossguard
  B(ctx, 37, Math.round(24 + bodyOff + swOff * 0.4), 12, 2, '#4B5563');
  B(ctx, 38, Math.round(24 + bodyOff + swOff * 0.4), 10, 1, '#F0C840');
  // Grip
  B(ctx, 42, Math.round(26 + bodyOff + swOff * 0.2), 2, 6, '#2E1503');
  // Pommel
  B(ctx, 41, Math.round(31 + bodyOff), 4, 4, '#4B5563');
  B(ctx, 42, Math.round(32 + bodyOff), 2, 2, '#D1D5DB');

  // SILVER CHEST ARMOR (5-level)
  const by = Math.round(20 + bodyOff);
  // Shoulders
  B(ctx, 9,  by,     8, 6, '#374151'); B(ctx, 10, by + 1, 6, 5, '#4B5563');
  B(ctx, 11, by + 1, 5, 4, '#6B7280'); B(ctx, 12, by + 2, 3, 3, '#9CA3AF');
  B(ctx, 9,  by,     8, 1, '#F0C840');
  B(ctx, 31, by,     8, 6, '#374151'); B(ctx, 32, by + 1, 6, 5, '#4B5563');
  B(ctx, 33, by + 1, 5, 4, '#6B7280'); B(ctx, 34, by + 2, 3, 3, '#9CA3AF');
  B(ctx, 31, by,     8, 1, '#F0C840');
  // Main chest
  B(ctx, 12, by + 1, 24, 14, '#374151');
  B(ctx, 13, by + 2, 22, 12, '#4B5563');
  B(ctx, 14, by + 2, 20, 11, '#6B7280');
  B(ctx, 16, by + 3, 16,  9, '#9CA3AF');
  B(ctx, 18, by + 4, 12,  7, '#D1D5DB');
  B(ctx, 20, by + 5,  8,  4, '#F3F4F6');
  B(ctx, 13, by + 2,  1, 12, '#374151'); B(ctx, 34, by + 2, 1, 12, '#374151');
  // Gold cross emblem
  B(ctx, 23, by + 3, 2, 8, '#3A2804'); B(ctx, 20, by + 7, 8, 2, '#3A2804');
  B(ctx, 23, by + 3, 2, 7, '#F0C840'); B(ctx, 20, by + 7, 8, 1, '#F0C840');
  B(ctx, 23, by + 3, 2, 1, '#FFFFC0');
  // Gold trim lines
  B(ctx, 12, by + 1,  24, 1, '#F0C840'); B(ctx, 12, by + 14, 24, 1, '#C8960C');
  // Tasset/skirt
  B(ctx, 11, by + 14, 26, 6, '#374151'); B(ctx, 12, by + 14, 24, 5, '#4B5563');
  B(ctx, 14, by + 14, 20, 4, '#6B7280'); B(ctx, 16, by + 15, 16, 2, '#9CA3AF');
  B(ctx, 11, by + 14, 26, 1, '#F0C840');

  // LEGS (silver greaves)
  const lly = Math.round(37 + bodyOff);
  const lleg = Math.round(legSwing * 0.5);
  B(ctx, 12, lly - lleg,      11, 9, '#374151'); B(ctx, 13, lly - lleg + 1,  9, 7, '#4B5563');
  B(ctx, 14, lly - lleg + 1,   7, 6, '#6B7280'); B(ctx, 15, lly - lleg + 2,  5, 4, '#9CA3AF');
  B(ctx, 13, lly - lleg,       9, 2, '#F0C840'); // gold knee
  B(ctx, 11, lly - lleg + 8,  12, 4, '#374151'); B(ctx, 12, lly - lleg + 8, 10, 3, '#4B5563');
  B(ctx, 25, lly + lleg,      11, 9, '#374151'); B(ctx, 26, lly + lleg + 1,  9, 7, '#4B5563');
  B(ctx, 27, lly + lleg + 1,   7, 6, '#6B7280'); B(ctx, 28, lly + lleg + 2,  5, 4, '#9CA3AF');
  B(ctx, 26, lly + lleg,       9, 2, '#F0C840');
  B(ctx, 24, lly + lleg + 8,  12, 4, '#374151'); B(ctx, 25, lly + lleg + 8, 10, 3, '#4B5563');

  // NECK
  B(ctx, 19, Math.round(18 + bodyOff), 10, 5, '#C49060');
  B(ctx, 20, Math.round(18 + bodyOff),  8, 4, '#D4A574');
  B(ctx, 21, Math.round(18 + bodyOff),  6, 3, '#FDDBB4');

  // HEAD
  const hy = Math.round(2 + bodyOff);

  // GOLDEN HAIR (volumetric, 5-level)
  B(ctx, 11, hy - 2, 26, 9, '#7A5A08'); B(ctx, 12, hy - 2, 24, 8, '#A07020');
  B(ctx, 13, hy - 2, 22, 7, '#C8960C'); B(ctx, 15, hy - 3, 18, 5, '#E8A820');
  B(ctx, 17, hy - 4, 14, 5, '#F0C040'); B(ctx, 19, hy - 5, 10, 4, '#F8D040');
  B(ctx, 21, hy - 6,  6, 3, '#FDE68A'); B(ctx, 22, hy - 6,  4, 1, '#FFFFC0');
  B(ctx, 21, hy - 4,  6, 1, '#FFFFC0'); // shine
  // Side strands
  B(ctx, 11, hy + 4, 3, 16, '#7A5A08'); B(ctx, 12, hy + 4, 2, 15, '#C8960C');
  B(ctx, 35, hy + 4, 3, 16, '#7A5A08'); B(ctx, 35, hy + 4, 2, 15, '#C8960C');

  // FACE (22px wide, 19px tall)
  B(ctx, 12, hy + 4, 24, 20, '#C49060');
  B(ctx, 13, hy + 4, 22, 19, '#FDDBB4');
  B(ctx, 13, hy + 4,  2, 19, '#D4A574'); B(ctx, 33, hy + 4, 2, 19, '#D4A574');
  B(ctx, 13, hy + 10, 1,  9, '#C49060'); B(ctx, 34, hy + 10, 1, 9, '#C49060');
  B(ctx, 16, hy + 4, 16,  6, '#FFE8C8'); B(ctx, 18, hy + 4, 12, 4, '#FFFCF0');
  B(ctx, 14, hy + 19, 20, 3, '#D4A574'); B(ctx, 16, hy + 20, 16, 2, '#C49060');
  B(ctx, 13, hy + 13, 3,  6, '#D4A574'); B(ctx, 32, hy + 13, 3, 6, '#D4A574');
  ellipse(ctx, 15.5, hy + 16.5, 3, 2.5, 'rgba(255,140,120,0.4)');
  ellipse(ctx, 32.5, hy + 16.5, 3, 2.5, 'rgba(255,140,120,0.4)');

  // CIRCLET with gem
  B(ctx, 13, hy + 4, 22, 2, '#4B5563'); B(ctx, 14, hy + 4, 20, 1, '#9CA3AF');
  B(ctx, 21, hy + 2,  6, 4, '#3A2804'); B(ctx, 22, hy + 2, 4, 3, '#F0C840');
  B(ctx, 23, hy + 1,  2, 3, '#FFFFFF');

  // EYEBROWS (elegant thin)
  if (expr === 'hurt') {
    B(ctx, 15, hy + 9, 6, 1, '#A07020'); B(ctx, 20, hy + 8, 2, 2, '#A07020');
    B(ctx, 27, hy + 9, 6, 1, '#A07020'); B(ctx, 26, hy + 8, 2, 2, '#A07020');
  } else {
    B(ctx, 15, hy + 9, 6, 1, '#A07020'); B(ctx, 27, hy + 9, 6, 1, '#A07020');
  }

  // EYES (8×5px, warm blue)
  if (expr === 'sleep') {
    B(ctx, 14, hy + 13, 8, 2, '#4B5563'); B(ctx, 26, hy + 13, 8, 2, '#4B5563');
  } else {
    // Left eye
    B(ctx, 13, hy + 12, 10, 2, '#1A0810'); B(ctx, 12, hy + 13, 1, 1, '#1A0810');
    B(ctx, 14, hy + 13,  8, 5, '#FFFFFF'); B(ctx, 13, hy + 17, 9, 1, '#D4A574');
    B(ctx, 15, hy + 13,  6, 4, '#0369A1'); B(ctx, 16, hy + 13, 4, 3, '#0EA5E9');
    B(ctx, 17, hy + 14,  3, 2, '#38BDF8'); B(ctx, 15, hy + 15, 6, 2, '#082F49');
    B(ctx, 17, hy + 14,  2, 2, '#0C1A26'); B(ctx, 15, hy + 13, 2, 2, '#FFFFFF');
    B(ctx, 20, hy + 16,  1, 1, '#FFFFFF'); B(ctx, 16, hy + 13, 3, 1, '#BAE6FD');
    // Right eye
    B(ctx, 25, hy + 12, 10, 2, '#1A0810'); B(ctx, 35, hy + 13, 1, 1, '#1A0810');
    B(ctx, 26, hy + 13,  8, 5, '#FFFFFF'); B(ctx, 25, hy + 17, 9, 1, '#D4A574');
    B(ctx, 27, hy + 13,  6, 4, '#0369A1'); B(ctx, 28, hy + 13, 4, 3, '#0EA5E9');
    B(ctx, 29, hy + 14,  3, 2, '#38BDF8'); B(ctx, 27, hy + 15, 6, 2, '#082F49');
    B(ctx, 29, hy + 14,  2, 2, '#0C1A26'); B(ctx, 27, hy + 13, 2, 2, '#FFFFFF');
    B(ctx, 32, hy + 16,  1, 1, '#FFFFFF'); B(ctx, 28, hy + 13, 3, 1, '#BAE6FD');
  }

  // Nose + mouth
  B(ctx, 21, hy + 19, 2, 1, '#C49060'); B(ctx, 22, hy + 20, 4, 1, '#D4A574');
  if (expr === 'happy') {
    B(ctx, 18, hy + 22, 12, 1, '#1A0810'); B(ctx, 17, hy + 21, 2, 2, '#1A0810');
    B(ctx, 29, hy + 21,  2, 2, '#1A0810'); B(ctx, 18, hy + 22, 12, 1, '#FFFFFF');
    B(ctx, 18, hy + 23, 12, 1, '#D4A574');
  } else if (expr === 'hurt') {
    B(ctx, 18, hy + 22, 12, 1, '#1A0810');
    B(ctx, 17, hy + 21, 2, 3, '#1A0810'); B(ctx, 29, hy + 21, 2, 3, '#1A0810');
  } else {
    B(ctx, 19, hy + 22, 10, 1, '#1A0810'); B(ctx, 18, hy + 23, 12, 1, '#D4A574');
  }

  // Front hair wisps
  B(ctx, 13, hy + 4, 3, 6, '#A07020'); B(ctx, 14, hy + 5, 2, 5, '#C8960C');
  B(ctx, 32, hy + 4, 3, 6, '#A07020'); B(ctx, 32, hy + 5, 2, 5, '#C8960C');

  if (level >= 6) {
    ctx.save(); ctx.globalAlpha = 0.2 + 0.1 * Math.sin(t * Math.PI * 2);
    B(ctx, 13, hy, 22, 19, '#F3F4F6'); ctx.restore();
  }
  if (state === 'celebrate' && particles && Math.random() < 0.2)
    particles.emit('star', cx + wave(t, 8, 1), 8, '#F0C840');
  if (state === 'levelup' && particles && Math.random() < 0.4)
    particles.emit('sparkle', cx + wave(t, 10, 1), 12, '#FFFFC0');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LA BRUIXA (Heroïna 2) ────────────────────────────────────────────────────
// Vestit negre/violeta, barret de bruixa, cabell fosc ondulat, vareta
// ═══════════════════════════════════════════════════════════════════════════════
function drawBruixa(ctx, state, t, level, particles) {
  const cx = 24;
  const breatheY = (state === 'idle_front' || state === 'idle_back') ? wave(t, 0.6, 1) : 0;
  const bodyOff  = breatheY;
  const expr = state === 'celebrate' ? 'happy' : state === 'hurt' ? 'hurt' :
               state === 'sleep' || state === 'rest' ? 'sleep' : 'neutral';
  const isAttack = state === 'attack';
  const hs = Math.round(wave(t, 0.9, 1) * 0.5);

  ellipse(ctx, cx, 46.5, 11, 2.5, 'rgba(0,0,30,0.4)');

  // BIG WITCH HAT (4-level cone + wide brim)
  const hatY = Math.round(-4 + bodyOff);
  // Hat brim (very wide)
  B(ctx, 5,  hatY + 14, 38, 5, '#0A0A14');
  B(ctx, 6,  hatY + 14, 36, 4, '#1A1A2E');
  B(ctx, 7,  hatY + 14, 34, 3, '#2D2D44');
  B(ctx, 7,  hatY + 14, 34, 1, '#C8960C'); // gold band
  // Cone (tapers, sways slightly)
  B(ctx, 14 + hs, hatY + 1,  20, 14, '#0A0A14');
  B(ctx, 15 + hs, hatY + 1,  18, 13, '#1A1A2E');
  B(ctx, 16 + hs, hatY + 2,  16, 11, '#2D1B69');
  B(ctx, 18 + hs, hatY + 3,  12,  9, '#3B1D8B');
  B(ctx, 19 + hs, hatY + 4,  10,  7, '#4C1D95');
  // Hat tip
  B(ctx, 21 + hs, hatY - 2,   6,  4, '#0A0A14');
  B(ctx, 22 + hs, hatY - 2,   4,  3, '#1A1A2E');
  B(ctx, 23 + hs, hatY - 3,   2,  2, '#2D1B69');
  // Gold star on hat
  B(ctx, 21 + hs, hatY + 7, 2, 5, '#F0C840');
  B(ctx, 19 + hs, hatY + 9, 6, 1, '#F0C840');
  B(ctx, 20 + hs, hatY + 8, 1, 3, '#F0C840'); B(ctx, 24 + hs, hatY + 8, 1, 3, '#F0C840');
  B(ctx, 21 + hs, hatY + 7, 2, 1, '#FFFFC0');

  // DARK WAVY HAIR (under hat, sides)
  B(ctx, 8,  Math.round(hatY + 16), 4, 20, '#1C0A2E');
  B(ctx, 36, Math.round(hatY + 16), 4, 20, '#1C0A2E');
  B(ctx, 9,  Math.round(hatY + 16), 3, 19, '#2D1B69');
  B(ctx, 36, Math.round(hatY + 16), 3, 19, '#2D1B69');
  B(ctx, 9,  Math.round(hatY + 18), 2, 14, '#4C1D95');
  for (let i = 0; i < 5; i++) {
    const wv = Math.round(Math.sin(i * 1.2) * 1.5);
    B(ctx, 8 + wv,  Math.round(hatY + 18 + i * 3), 3, 2, '#6D28D9');
    B(ctx, 37 - wv, Math.round(hatY + 18 + i * 3), 3, 2, '#6D28D9');
  }

  // WAND (right hand, animated wave)
  const wandBase = Math.round(bodyOff + wave(t, 1, 1) * 1.5);
  const wandRaise = isAttack ? Math.abs(wave(t, 6, 1)) : 0;
  const wt = 12 + wandBase - wandRaise;
  B(ctx, 39, wt, 2, 28, '#2E1503'); B(ctx, 40, wt, 2, 28, '#5C3010');
  B(ctx, 41, wt, 1, 28, '#7A4015');
  // Star tip
  B(ctx, 37, wt - 5, 6, 7, '#3A2804'); B(ctx, 38, wt - 4, 4, 5, '#F0C840');
  B(ctx, 39, wt - 4, 2, 3, '#FFFFC0'); B(ctx, 39, wt - 5, 2, 1, '#FFFFFF');
  const wg = 0.4 + 0.3 * Math.sin(t * Math.PI * 3);
  ctx.save(); ctx.globalAlpha = wg; circle(ctx, 40, wt - 2, 5, '#A78BFA'); ctx.restore();
  if ((isAttack || state === 'levelup') && particles && Math.random() < 0.3)
    particles.emit('sparkle', 40, wt - 2, '#C4B5FD');

  // LEFT ARM
  B(ctx, 7, Math.round(22 + bodyOff), 6, 14, '#1A1A2E');
  B(ctx, 8, Math.round(23 + bodyOff), 5, 12, '#2D1B69');
  B(ctx, 9, Math.round(24 + bodyOff), 4, 10, '#4C1D95');

  // RIGHT ARM
  B(ctx, 35, Math.round(22 + bodyOff), 6, 14, '#1A1A2E');
  B(ctx, 36, Math.round(23 + bodyOff), 5, 12, '#2D1B69');
  B(ctx, 37, Math.round(24 + bodyOff), 4, 10, '#4C1D95');

  // FLOWING DRESS (5-level black/purple, wide)
  const dy = Math.round(22 + bodyOff);
  B(ctx, 7,  dy,     34, 24, '#0A0A14');
  B(ctx, 9,  dy + 1, 30, 22, '#1A1A2E');
  B(ctx, 11, dy + 2, 26, 20, '#2D1B69');
  B(ctx, 13, dy + 3, 22, 18, '#3B1D8B');
  B(ctx, 15, dy + 4, 18, 15, '#4C1D95');
  B(ctx, 17, dy + 5, 14, 10, '#5E20B0');
  // Edge shadows
  B(ctx, 9,  dy + 1, 2, 22, '#0A0A14'); B(ctx, 37, dy + 1, 2, 22, '#0A0A14');
  // Hem flare
  B(ctx, 5,  dy + 22, 38, 2, '#0A0A14'); B(ctx, 7, dy + 22, 34, 2, '#1A1A2E');
  B(ctx, 9,  dy + 23, 30, 1, '#2D1B69');
  // Gold collar
  B(ctx, 17, dy, 14, 3, '#3A2804'); B(ctx, 18, dy, 12, 2, '#C8960C');
  B(ctx, 19, dy, 10, 1, '#F0C840');
  // Animated sparkles on dress
  const sg = 0.4 + 0.4 * Math.sin(t * Math.PI * 2);
  ctx.save(); ctx.globalAlpha = sg;
  B(ctx, 17, dy + 6,  2, 2, '#A78BFA'); B(ctx, 28, dy + 9,  2, 2, '#C4B5FD');
  B(ctx, 21, dy + 15, 2, 2, '#8B5CF6'); B(ctx, 32, dy + 14, 2, 2, '#A78BFA');
  ctx.restore();

  // NECK
  B(ctx, 19, Math.round(20 + bodyOff), 10, 4, '#C49060');
  B(ctx, 20, Math.round(20 + bodyOff),  8, 3, '#D4A574');
  B(ctx, 21, Math.round(20 + bodyOff),  6, 2, '#FDDBB4');

  // HEAD (shorter visible area — hat takes top)
  const hy = Math.round(10 + bodyOff);

  // FACE (22px wide, 14px tall)
  B(ctx, 12, hy, 24, 14, '#C49060');
  B(ctx, 13, hy, 22, 13, '#FDDBB4');
  B(ctx, 13, hy,  2, 13, '#D4A574'); B(ctx, 33, hy, 2, 13, '#D4A574');
  B(ctx, 13, hy + 5, 1,  7, '#C49060'); B(ctx, 34, hy + 5, 1, 7, '#C49060');
  B(ctx, 16, hy,  16,  4, '#FFE8C8'); B(ctx, 18, hy, 12, 2, '#FFFCF0');
  B(ctx, 14, hy + 10, 20, 3, '#D4A574'); B(ctx, 16, hy + 11, 16, 2, '#C49060');
  B(ctx, 13, hy + 7,  3,  5, '#D4A574'); B(ctx, 32, hy + 7, 3, 5, '#D4A574');
  ellipse(ctx, 15.5, hy + 10.5, 2.5, 2, 'rgba(255,120,100,0.35)');
  ellipse(ctx, 32.5, hy + 10.5, 2.5, 2, 'rgba(255,120,100,0.35)');

  // EYEBROWS
  B(ctx, 15, hy + 3, 6, 1, '#1C0A2E'); B(ctx, 27, hy + 3, 6, 1, '#1C0A2E');
  if (expr === 'hurt' || isAttack) {
    B(ctx, 20, hy + 2, 2, 2, '#1C0A2E'); B(ctx, 26, hy + 2, 2, 2, '#1C0A2E');
  }

  // EYES (8×5px, purple glowing)
  if (expr === 'sleep') {
    B(ctx, 14, hy + 6, 8, 2, '#1C0A2E'); B(ctx, 26, hy + 6, 8, 2, '#1C0A2E');
  } else {
    // Left eye
    B(ctx, 13, hy + 5, 10, 2, '#0A0A14'); B(ctx, 12, hy + 6, 1, 1, '#0A0A14');
    B(ctx, 14, hy + 6,  8, 4, '#FFFFFF'); B(ctx, 13, hy + 9, 9, 1, '#D4A574');
    B(ctx, 15, hy + 6,  6, 3, '#4C1D95'); B(ctx, 16, hy + 6, 4, 2, '#7C3AED');
    B(ctx, 17, hy + 7,  2, 2, '#9F5CF6'); B(ctx, 15, hy + 8, 5, 1, '#1E1B4B');
    B(ctx, 17, hy + 7,  2, 1, '#0A0A14'); B(ctx, 15, hy + 6, 2, 2, '#FFFFFF');
    B(ctx, 20, hy + 8,  1, 1, '#FFFFFF'); B(ctx, 16, hy + 6, 3, 1, '#DDD6FE');
    ctx.save(); ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * Math.PI * 2);
    B(ctx, 16, hy + 7, 2, 1, '#A78BFA'); ctx.restore();
    // Right eye
    B(ctx, 25, hy + 5, 10, 2, '#0A0A14'); B(ctx, 35, hy + 6, 1, 1, '#0A0A14');
    B(ctx, 26, hy + 6,  8, 4, '#FFFFFF'); B(ctx, 25, hy + 9, 9, 1, '#D4A574');
    B(ctx, 27, hy + 6,  6, 3, '#4C1D95'); B(ctx, 28, hy + 6, 4, 2, '#7C3AED');
    B(ctx, 29, hy + 7,  2, 2, '#9F5CF6'); B(ctx, 27, hy + 8, 5, 1, '#1E1B4B');
    B(ctx, 29, hy + 7,  2, 1, '#0A0A14'); B(ctx, 27, hy + 6, 2, 2, '#FFFFFF');
    B(ctx, 32, hy + 8,  1, 1, '#FFFFFF'); B(ctx, 28, hy + 6, 3, 1, '#DDD6FE');
    ctx.save(); ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * Math.PI * 2);
    B(ctx, 28, hy + 7, 2, 1, '#A78BFA'); ctx.restore();
  }

  // Nose + mouth
  B(ctx, 21, hy + 11, 2, 1, '#C49060'); B(ctx, 22, hy + 12, 4, 1, '#D4A574');
  if (expr === 'happy') {
    B(ctx, 18, hy + 14, 12, 1, '#0A0A14'); B(ctx, 17, hy + 13, 2, 2, '#0A0A14');
    B(ctx, 29, hy + 13,  2, 2, '#0A0A14'); B(ctx, 18, hy + 14, 12, 1, '#FFFFFF');
  } else if (expr === 'hurt') {
    B(ctx, 18, hy + 14, 12, 1, '#0A0A14');
    B(ctx, 17, hy + 13, 2, 3, '#0A0A14'); B(ctx, 29, hy + 13, 2, 3, '#0A0A14');
  } else {
    B(ctx, 19, hy + 14, 10, 1, '#0A0A14'); B(ctx, 18, hy + 15, 12, 1, '#D4A574');
  }

  // Hat shadow over forehead
  B(ctx, 14, hy, 6, 3, '#0A0A14'); B(ctx, 28, hy, 6, 3, '#0A0A14');

  if (level >= 6) {
    ctx.save(); ctx.globalAlpha = 0.15 + 0.1 * Math.sin(t * Math.PI * 2);
    circle(ctx, cx, Math.round(34 + bodyOff), 18, '#4C1D95'); ctx.restore();
  }
  if (state === 'celebrate' && particles && Math.random() < 0.2)
    particles.emit('sparkle', cx, 20, '#C4B5FD');
  if (state === 'levelup' && particles && Math.random() < 0.4)
    particles.emit('sparkle', cx + wave(t, 10, 1), 15, '#A78BFA');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LA ARQUERA (Heroïna 3) ───────────────────────────────────────────────────
// Armadura verda-marró, arc elfí, orelles punxegudes, cua de cavall
// ═══════════════════════════════════════════════════════════════════════════════
function drawArquera(ctx, state, t, level, particles) {
  const cx = 24;
  const breatheY = (state === 'idle_front' || state === 'idle_back') ? wave(t, 0.7, 1) : 0;
  const walkBob  = state === 'walk' ? Math.abs(wave(t, 2, 2)) - 1 : 0;
  const legSwing = state === 'walk' ? wave(t, 4, 2) : 0;
  const bodyOff  = breatheY + walkBob;
  const expr = state === 'celebrate' ? 'happy' : state === 'hurt' ? 'hurt' :
               state === 'sleep' || state === 'rest' ? 'sleep' : 'neutral';
  const isAttack = state === 'attack';

  ellipse(ctx, cx, 46.5, 12, 2.8, 'rgba(0,0,30,0.4)');

  // HIGH PONYTAIL (animated sway, behind head)
  const ps = Math.round(wave(t, 1.5, 1) * 0.8);
  B(ctx, 22 + ps, Math.round(-1 + bodyOff), 8, 3, '#1A0800');
  B(ctx, 23 + ps, Math.round( 0 + bodyOff), 6, 2, '#2E1503');
  B(ctx, 14 + ps, Math.round( 2 + bodyOff), 5, 22, '#1A0800');
  B(ctx, 15 + ps, Math.round( 2 + bodyOff), 4, 21, '#2E1503');
  B(ctx, 15 + ps, Math.round( 3 + bodyOff), 3, 19, '#5C3010');
  B(ctx, 16 + ps, Math.round( 4 + bodyOff), 2, 17, '#7C4020');
  // Hair tie (green)
  B(ctx, 14 + ps, Math.round(2 + bodyOff), 6, 2, '#065F46');
  B(ctx, 15 + ps, Math.round(2 + bodyOff), 4, 1, '#10B981');

  // QUIVER (right back)
  B(ctx, 35, Math.round(14 + bodyOff), 6, 20, '#2E1503');
  B(ctx, 36, Math.round(15 + bodyOff), 4, 18, '#5C3010');
  B(ctx, 36, Math.round(13 + bodyOff), 4, 4,  '#065F46');
  B(ctx, 37, Math.round(12 + bodyOff), 2, 3,  '#10B981');

  // ELVEN BOW (left, elegant curved with leaf tips)
  const bowPull = isAttack ? Math.abs(wave(t, 4, 1)) : 0;
  B(ctx, 0, Math.round( 8 + bodyOff), 3, 4,  '#5C3010');
  B(ctx, 0, Math.round(33 + bodyOff), 3, 4,  '#5C3010');
  B(ctx, 0, Math.round(12 + bodyOff), 3, 21, '#78350F');
  B(ctx, 1, Math.round( 9 + bodyOff), 1, 28, '#FDE68A');
  // Elven leaf tips
  B(ctx, -1, Math.round( 5 + bodyOff), 5, 5,  '#065F46');
  B(ctx, -1, Math.round(35 + bodyOff), 5, 5,  '#065F46');
  B(ctx,  0, Math.round( 6 + bodyOff), 3, 3,  '#10B981');
  B(ctx,  0, Math.round(36 + bodyOff), 3, 3,  '#10B981');
  B(ctx,  0, Math.round( 7 + bodyOff), 2, 1,  '#34D399');
  B(ctx,  0, Math.round(37 + bodyOff), 2, 1,  '#34D399');
  if (isAttack) {
    const arrowY = Math.round(22 + bodyOff - bowPull * 0.5);
    B(ctx, 1, arrowY, 16, 1, '#78350F'); B(ctx, 1, arrowY, 1, 1, '#FBBF24');
    B(ctx, 13, arrowY - 1, 4, 3, '#065F46');
    if (particles && Math.random() < 0.3) particles.emit('star', 1, arrowY, '#10B981');
  }

  // LEFT ARM
  B(ctx, 7, Math.round(22 + bodyOff), 7, 13, '#3D1F08');
  B(ctx, 8, Math.round(23 + bodyOff), 5, 11, '#5C3010');
  B(ctx, 9, Math.round(24 + bodyOff), 4,  9, '#78350F');

  // RIGHT ARM
  B(ctx, 34, Math.round(22 + bodyOff), 7, 13, '#3D1F08');
  B(ctx, 35, Math.round(23 + bodyOff), 5, 11, '#5C3010');
  B(ctx, 36, Math.round(24 + bodyOff), 4,  9, '#78350F');

  // LEATHER ARMOR (green-brown, 5-level)
  const by = Math.round(20 + bodyOff);
  // Shoulder guards
  B(ctx, 9,  by,     8, 6, '#3D1F08'); B(ctx, 10, by + 1, 6, 5, '#5C3010');
  B(ctx, 11, by + 1, 5, 4, '#78350F'); B(ctx, 9,  by,     8, 1, '#10B981');
  B(ctx, 31, by,     8, 6, '#3D1F08'); B(ctx, 32, by + 1, 6, 5, '#5C3010');
  B(ctx, 33, by + 1, 5, 4, '#78350F'); B(ctx, 31, by,     8, 1, '#10B981');
  // Main vest
  B(ctx, 12, by + 1, 24, 14, '#3D1F08');
  B(ctx, 13, by + 2, 22, 12, '#5C3010');
  B(ctx, 14, by + 2, 20, 11, '#78350F');
  B(ctx, 16, by + 3, 16,  9, '#065F46');
  B(ctx, 18, by + 4, 12,  7, '#10B981');
  B(ctx, 20, by + 5,  8,  4, '#34D399');
  B(ctx, 13, by + 2,  1, 12, '#2E1503'); B(ctx, 34, by + 2, 1, 12, '#2E1503');
  // Stitching
  B(ctx, 18, by + 2, 1, 10, '#3D1F08'); B(ctx, 29, by + 2, 1, 10, '#3D1F08');
  B(ctx, 17, by + 3, 14, 1, '#10B981');
  // Belt
  B(ctx, 12, by + 14, 24, 3, '#3D1F08'); B(ctx, 13, by + 14, 22, 2, '#5C3010');
  B(ctx, 20, by + 14,  8, 2, '#78350F'); B(ctx, 22, by + 14, 4, 1, '#B45309');

  // LEGS (brown leather + green knee pads + dark boots)
  const lly = Math.round(35 + bodyOff);
  const lleg = Math.round(legSwing * 0.5);
  B(ctx, 12, lly - lleg,      11, 9, '#3D1F08'); B(ctx, 13, lly - lleg + 1,  9, 7, '#5C3010');
  B(ctx, 14, lly - lleg + 1,   7, 6, '#78350F'); B(ctx, 15, lly - lleg + 2,  5, 4, '#A16207');
  B(ctx, 13, lly - lleg,       9, 2, '#065F46'); B(ctx, 14, lly - lleg,     7, 1, '#10B981');
  B(ctx, 11, lly - lleg + 8,  12, 4, '#1A0800'); B(ctx, 12, lly - lleg + 9, 10, 3, '#2E1503');
  B(ctx, 25, lly + lleg,      11, 9, '#3D1F08'); B(ctx, 26, lly + lleg + 1,  9, 7, '#5C3010');
  B(ctx, 27, lly + lleg + 1,   7, 6, '#78350F'); B(ctx, 28, lly + lleg + 2,  5, 4, '#A16207');
  B(ctx, 26, lly + lleg,       9, 2, '#065F46'); B(ctx, 27, lly + lleg,     7, 1, '#10B981');
  B(ctx, 24, lly + lleg + 8,  12, 4, '#1A0800'); B(ctx, 25, lly + lleg + 9, 10, 3, '#2E1503');

  // NECK
  B(ctx, 19, Math.round(18 + bodyOff), 10, 5, '#C49060');
  B(ctx, 20, Math.round(18 + bodyOff),  8, 4, '#D4A574');
  B(ctx, 21, Math.round(18 + bodyOff),  6, 3, '#FDDBB4');

  // HEAD
  const hy = Math.round(2 + bodyOff);

  // HAIR (dark brown, tight — pulled into ponytail, 5-level)
  B(ctx, 11, hy - 2, 26, 8, '#1A0800'); B(ctx, 12, hy - 2, 24, 7, '#2E1503');
  B(ctx, 13, hy - 2, 22, 6, '#3D1F08'); B(ctx, 15, hy - 2, 18, 5, '#5C3010');
  B(ctx, 17, hy - 2, 14, 3, '#7C4020'); B(ctx, 19, hy - 2, 10, 2, '#8B5020');
  B(ctx, 21, hy - 2,  6, 1, '#C07030'); // shine
  // Tight side (less volume — hair pulled back)
  B(ctx, 11, hy + 4, 3, 14, '#1A0800'); B(ctx, 12, hy + 4, 2, 13, '#2E1503');
  B(ctx, 35, hy + 4, 3, 14, '#1A0800'); B(ctx, 35, hy + 4, 2, 13, '#2E1503');

  // ELF EARS (long pointed tips)
  B(ctx, 11, hy + 8, 2, 6, '#FDDBB4'); B(ctx, 10, hy + 6, 2, 4, '#FDDBB4');
  B(ctx,  9, hy + 5, 2, 2, '#FDDBB4'); B(ctx,  9, hy + 4, 1, 2, '#FFE8C8');
  B(ctx, 11, hy + 8, 1, 5, '#D4A574'); B(ctx,  9, hy + 5, 1, 1, '#C49060');
  B(ctx, 35, hy + 8, 2, 6, '#FDDBB4'); B(ctx, 36, hy + 6, 2, 4, '#FDDBB4');
  B(ctx, 37, hy + 5, 2, 2, '#FDDBB4'); B(ctx, 38, hy + 4, 1, 2, '#FFE8C8');
  B(ctx, 36, hy + 8, 1, 5, '#D4A574'); B(ctx, 38, hy + 5, 1, 1, '#C49060');

  // FACE (22px wide, 19px tall)
  B(ctx, 12, hy + 4, 24, 20, '#C49060');
  B(ctx, 13, hy + 4, 22, 19, '#FDDBB4');
  B(ctx, 13, hy + 4,  2, 19, '#D4A574'); B(ctx, 33, hy + 4, 2, 19, '#D4A574');
  B(ctx, 13, hy + 10, 1,  9, '#C49060'); B(ctx, 34, hy + 10, 1, 9, '#C49060');
  B(ctx, 16, hy + 4, 16,  6, '#FFE8C8'); B(ctx, 18, hy + 4, 12, 4, '#FFFCF0');
  B(ctx, 14, hy + 19, 20, 3, '#D4A574'); B(ctx, 16, hy + 20, 16, 2, '#C49060');
  B(ctx, 13, hy + 13, 3,  6, '#D4A574'); B(ctx, 32, hy + 13, 3, 6, '#D4A574');
  ellipse(ctx, 15.5, hy + 16.5, 2.5, 2, 'rgba(255,120,100,0.3)');
  ellipse(ctx, 32.5, hy + 16.5, 2.5, 2, 'rgba(255,120,100,0.3)');

  // EYEBROWS (sharp, pointed — elven)
  if (expr === 'hurt' || isAttack) {
    B(ctx, 15, hy + 9, 6, 1, '#2E1503'); B(ctx, 20, hy + 8, 2, 2, '#2E1503');
    B(ctx, 27, hy + 9, 6, 1, '#2E1503'); B(ctx, 26, hy + 8, 2, 2, '#2E1503');
  } else {
    B(ctx, 15, hy + 9, 6, 1, '#2E1503'); B(ctx, 14, hy + 9, 1, 1, '#2E1503');
    B(ctx, 27, hy + 9, 6, 1, '#2E1503'); B(ctx, 33, hy + 9, 1, 1, '#2E1503');
  }

  // EYES (8×5px, forest green, slightly almond — elven)
  if (expr === 'sleep') {
    B(ctx, 14, hy + 13, 8, 2, '#064E3B'); B(ctx, 26, hy + 13, 8, 2, '#064E3B');
  } else {
    // Left eye
    B(ctx, 13, hy + 12, 10, 2, '#1A0800'); B(ctx, 12, hy + 13, 1, 1, '#1A0800');
    B(ctx, 23, hy + 12,  1, 1, '#1A0800'); // inner corner — elongated elf eye
    B(ctx, 14, hy + 13,  9, 5, '#FFFFFF'); B(ctx, 13, hy + 17, 9, 1, '#D4A574');
    B(ctx, 15, hy + 13,  6, 4, '#047857'); B(ctx, 16, hy + 13, 4, 3, '#065F46');
    B(ctx, 17, hy + 14,  3, 2, '#10B981'); B(ctx, 15, hy + 15, 6, 2, '#022C22');
    B(ctx, 17, hy + 14,  2, 2, '#011811'); B(ctx, 15, hy + 13, 2, 2, '#FFFFFF');
    B(ctx, 20, hy + 16,  1, 1, '#FFFFFF'); B(ctx, 16, hy + 13, 3, 1, '#6EE7B7');
    // Right eye
    B(ctx, 25, hy + 12, 10, 2, '#1A0800'); B(ctx, 24, hy + 13, 1, 1, '#1A0800');
    B(ctx, 35, hy + 12,  1, 1, '#1A0800');
    B(ctx, 26, hy + 13,  9, 5, '#FFFFFF'); B(ctx, 25, hy + 17, 9, 1, '#D4A574');
    B(ctx, 27, hy + 13,  6, 4, '#047857'); B(ctx, 28, hy + 13, 4, 3, '#065F46');
    B(ctx, 29, hy + 14,  3, 2, '#10B981'); B(ctx, 27, hy + 15, 6, 2, '#022C22');
    B(ctx, 29, hy + 14,  2, 2, '#011811'); B(ctx, 27, hy + 13, 2, 2, '#FFFFFF');
    B(ctx, 32, hy + 16,  1, 1, '#FFFFFF'); B(ctx, 28, hy + 13, 3, 1, '#6EE7B7');
  }

  // Nose + mouth
  B(ctx, 21, hy + 19, 2, 1, '#C49060'); B(ctx, 22, hy + 20, 4, 1, '#D4A574');
  if (expr === 'happy') {
    B(ctx, 18, hy + 22, 12, 1, '#1A0800'); B(ctx, 17, hy + 21, 2, 2, '#1A0800');
    B(ctx, 29, hy + 21,  2, 2, '#1A0800'); B(ctx, 18, hy + 22, 12, 1, '#FFFFFF');
    B(ctx, 18, hy + 23, 12, 1, '#D4A574');
  } else if (expr === 'hurt') {
    B(ctx, 18, hy + 22, 12, 1, '#1A0800');
    B(ctx, 17, hy + 21, 2, 3, '#1A0800'); B(ctx, 29, hy + 21, 2, 3, '#1A0800');
  } else {
    B(ctx, 19, hy + 22, 10, 1, '#1A0800'); B(ctx, 18, hy + 23, 12, 1, '#D4A574');
  }

  // Front hair wisps
  B(ctx, 13, hy + 4, 3, 6, '#2E1503'); B(ctx, 14, hy + 5, 2, 5, '#5C3010');
  B(ctx, 32, hy + 4, 3, 6, '#2E1503'); B(ctx, 32, hy + 5, 2, 5, '#5C3010');

  if (level >= 6) {
    ctx.save(); ctx.globalAlpha = 0.15 + 0.1 * Math.sin(t * Math.PI * 2);
    B(ctx, 13, hy, 22, 19, '#6EE7B7'); ctx.restore();
  }
  if (state === 'celebrate' && particles && Math.random() < 0.2)
    particles.emit('star', cx + wave(t, 8, 1), 8, '#10B981');
  if (state === 'levelup' && particles && Math.random() < 0.4)
    particles.emit('sparkle', cx + wave(t, 10, 1), 12, '#34D399');
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
