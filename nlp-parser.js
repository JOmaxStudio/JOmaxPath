/* ─────────────────────────────────────────
   NLP PARSER — Captura Ràpida en Català
───────────────────────────────────────── */

// Límits de paraula que respecten accents catalans (\b falla amb à, é, ó…)
const _WB = '(?<![0-9A-Za-zàèéíòóúïüç])';   // abans
const _WA = '(?![0-9A-Za-zàèéíòóúïüç])';    // després
function _rx(body, flags) { return new RegExp(_WB + body + _WA, flags || 'i'); }

// Format YYYY-MM-DD en hora LOCAL (evita el desfasament d'UTC de toISOString)
function _fmtLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function _getDateStr(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return _fmtLocal(d);
}

function _getNextWeekday(targetDay) {
  const today = new Date();
  const currentDay = today.getDay();
  let diff = targetDay - currentDay;
  if (diff <= 0) diff += 7;
  return _getDateStr(diff);
}

function _getDateFromDay(day) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), day);
  if (target <= now) target.setMonth(target.getMonth() + 1);
  return _fmtLocal(target);
}

function _getDateFromDayMonth(day, month) {
  const now = new Date();
  const target = new Date(now.getFullYear(), month - 1, day);
  if (target <= now) target.setFullYear(target.getFullYear() + 1);
  return _fmtLocal(target);
}

const NLP_PATTERNS = {
  dates: [
    { pattern: _rx('passat demà'), resolve: () => _getDateStr(2) },
    { pattern: _rx('passat dema'), resolve: () => _getDateStr(2) },
    { pattern: _rx('avui'), resolve: () => _getDateStr(0) },
    { pattern: _rx('demà'), resolve: () => _getDateStr(1) },
    { pattern: _rx('dema'), resolve: () => _getDateStr(1) },
    { pattern: _rx('dilluns'), resolve: () => _getNextWeekday(1) },
    { pattern: _rx('dimarts'), resolve: () => _getNextWeekday(2) },
    { pattern: _rx('dimecres'), resolve: () => _getNextWeekday(3) },
    { pattern: _rx('dijous'), resolve: () => _getNextWeekday(4) },
    { pattern: _rx('divendres'), resolve: () => _getNextWeekday(5) },
    { pattern: _rx('dissabte'), resolve: () => _getNextWeekday(6) },
    { pattern: _rx('diumenge'), resolve: () => _getNextWeekday(0) },
    { pattern: _rx('la setmana que ve'), resolve: () => _getDateStr(7) },
    { pattern: _rx('aquesta setmana'), resolve: () => _getDateStr(0) },
    { pattern: /d['']aquí (\d+) dies?/i, resolve: (m) => _getDateStr(parseInt(m[1])) },
    { pattern: /(\d{1,2})[\/\-](\d{1,2})/, resolve: (m) => _getDateFromDayMonth(parseInt(m[1]), parseInt(m[2])) },
    { pattern: /\bel dia (\d{1,2})\b/i, resolve: (m) => _getDateFromDay(parseInt(m[1])) },
    { pattern: /\bel (\d{1,2})\b/i, resolve: (m) => _getDateFromDay(parseInt(m[1])) },
  ],

  // Rangs "de les X a les Y" → inici + fi
  timeRanges: [
    {
      pattern: /de les (\d{1,2})h?(?:[:\.](\d{2}))? (?:a|fins a) les (\d{1,2})h?(?:[:\.]?(\d{2}))?/i,
      resolve: (m) => ({
        hora_inici: `${m[1].padStart(2,'0')}:${m[2]||'00'}`,
        hora_fi: `${m[3].padStart(2,'0')}:${m[4]||'00'}`
      })
    },
  ],

  // Hora fi "fins a les Yh" / "fins a les Y:30" / "fins a les Yh30"
  timeEnds: [
    { pattern: /fins a les (\d{1,2})[h:\.](\d{2})/i, resolve: (m) => `${m[1].padStart(2,'0')}:${m[2]}` },
    { pattern: /fins a les (\d{1,2})h?\b/i, resolve: (m) => `${m[1].padStart(2,'0')}:00` },
  ],

  // Hora inici "a les Xh" / "a les X:30" / "a les Xh30" / "a les X"
  timeStarts: [
    { pattern: /a les (\d{1,2})[:\.](\d{2})/i, resolve: (m) => `${m[1].padStart(2,'0')}:${m[2]}` },
    { pattern: /a les (\d{1,2})h(\d{2})/i, resolve: (m) => `${m[1].padStart(2,'0')}:${m[2]}` },
    { pattern: /a les (\d{1,2})h\b/i, resolve: (m) => `${m[1].padStart(2,'0')}:00` },
    {
      pattern: /a les (\d{1,2})\b/i,
      resolve: (m) => {
        let h = parseInt(m[1]);
        if (h < 8) h += 12; // heurística: matí improbable → tarda
        return `${String(h).padStart(2,'0')}:00`;
      }
    },
  ],

  priorities: [
    { pattern: _rx('prioritat alta'), value: 'urgent' },
    { pattern: _rx('prioritat baixa'), value: 'low' },
    { pattern: _rx('urgent'), value: 'urgent' },
    { pattern: _rx('important'), value: 'important' },
  ],

  // strip:true → prefix etiqueta, s'elimina del títol.
  // strip:false → keyword semàntic, ES el contingut → es conserva.
  types: [
    { pattern: /\bnotes?\s*:/i, value: 'note', strip: true },
    { pattern: /\bnota\s*:/i, value: 'note', strip: true },
    { pattern: /\bevent\s*:/i, value: 'event', strip: true },
    { pattern: _rx('reuni[oó]'), value: 'event', strip: false },
    { pattern: _rx('partit'), value: 'event', strip: false },
    { pattern: _rx('ex[àa]men'), value: 'event', strip: false },
    { pattern: _rx('entrenament'), value: 'event', strip: false },
    { pattern: _rx('festa'), value: 'event', strip: false },
    { pattern: _rx('visita'), value: 'event', strip: false },
    { pattern: _rx('cita'), value: 'event', strip: false },
    { pattern: _rx('concert'), value: 'event', strip: false },
    { pattern: _rx('viatge'), value: 'event', strip: false },
  ],
};

function parseNaturalLanguage(input) {
  let text = input.trim();
  const result = {
    title: '',
    type: 'task',
    date: null,
    hora_inici: null,
    hora_fi: null,
    priority: 'normal',
    raw: input
  };

  // 1. TIPUS
  for (const t of NLP_PATTERNS.types) {
    if (t.pattern.test(text)) {
      result.type = t.value;
      if (t.strip) text = text.replace(t.pattern, ' ').trim();
      break;
    }
  }

  // 2. PRIORITAT
  for (const p of NLP_PATTERNS.priorities) {
    if (p.pattern.test(text)) {
      result.priority = p.value;
      text = text.replace(p.pattern, ' ').trim();
      break;
    }
  }

  // 3. RANG horari "de les X a les Y"
  for (const t of NLP_PATTERNS.timeRanges) {
    const m = text.match(t.pattern);
    if (m) {
      const r = t.resolve(m);
      result.hora_inici = r.hora_inici;
      result.hora_fi = r.hora_fi;
      text = text.replace(t.pattern, ' ').trim();
      break;
    }
  }

  // 4. HORA FI "fins a les Y"
  if (!result.hora_fi) {
    for (const t of NLP_PATTERNS.timeEnds) {
      const m = text.match(t.pattern);
      if (m) {
        result.hora_fi = t.resolve(m);
        text = text.replace(t.pattern, ' ').trim();
        break;
      }
    }
  }

  // 5. HORA INICI "a les X"
  if (!result.hora_inici) {
    for (const t of NLP_PATTERNS.timeStarts) {
      const m = text.match(t.pattern);
      if (m) {
        result.hora_inici = t.resolve(m);
        text = text.replace(t.pattern, ' ').trim();
        break;
      }
    }
  }

  // Hora fi automàtica: +1h si hi ha inici i no fi
  if (result.hora_inici && !result.hora_fi) {
    const [h, mm] = result.hora_inici.split(':').map(Number);
    const endH = (h + 1) % 24;
    result.hora_fi = `${String(endH).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  }

  // 6. DATA
  for (const d of NLP_PATTERNS.dates) {
    const m = text.match(d.pattern);
    if (m) {
      result.date = d.resolve(m);
      text = text.replace(d.pattern, ' ').trim();
      break;
    }
  }

  // 7. Si té hora però no data → avui (o demà si ja ha passat)
  if ((result.hora_inici || result.hora_fi) && !result.date) {
    const ref = result.hora_inici || result.hora_fi;
    const [h] = ref.split(':').map(Number);
    result.date = h <= new Date().getHours() ? _getDateStr(1) : _getDateStr(0);
  }

  // 8. Si té hora → event (si encara és tasca per defecte)
  if ((result.hora_inici || result.hora_fi) && result.type === 'task') {
    result.type = 'event';
  }

  // 9. Neteja del títol
  result.title = text
    .replace(/^(i|a|de|del|d'|el|la|els|les|un|una)\s+/i, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,;:·.-]+|[\s,;:·.-]+$/g, '')
    .trim();

  if (result.title) {
    result.title = result.title.charAt(0).toUpperCase() + result.title.slice(1);
  }

  return result;
}
