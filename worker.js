// worker.js — entrada del Worker de jomaxpath (Cloudflare Workers + Static Assets)
// Gestiona /api/julians (proxy segur a Google Gemini) i delega la resta a l'assets binding.
// La clau GEMINI_API_KEY viu com a secret del Worker i mai s'exposa al navegador.

const MODEL_DEFAULT = 'gemini-2.5-flash-lite';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/julians') {
      if (request.method === 'OPTIONS') return corsPreflight(env);
      if (request.method !== 'POST') {
        return json({ error: 'Mètode no permès' }, 405, env);
      }
      return handleJulians(request, env);
    }

    // Tota la resta → fitxers estàtics (index.html, app.js, hero.html, etc.)
    return env.ASSETS.fetch(request);
  },
};

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}
function json(obj, status, env) {
  return new Response(JSON.stringify(obj), { status, headers: corsHeaders(env) });
}
function corsPreflight(env) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function handleJulians(request, env) {
  try {
    if (!env.GEMINI_API_KEY) {
      return json({ error: 'IA no configurada al servidor (falta GEMINI_API_KEY).' }, 503, env);
    }

    const body = await request.json().catch(() => ({}));
    const system = (body.system || '').toString().slice(0, 4000);
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];

    const contents = messages
      .filter((m) => m && m.content)
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: ('' + m.content).slice(0, 8000) }],
      }));

    if (contents.length === 0) return json({ error: 'Cap missatge.' }, 400, env);

    const model = env.GEMINI_MODEL || MODEL_DEFAULT;
    const payload = {
      contents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.8 },
    };
    if (system) payload.system_instruction = { parts: [{ text: system }] };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errTxt = await res.text().catch(() => '');
      return json({ error: 'Error de la IA: ' + res.status, detail: errTxt.slice(0, 900) }, 502, env);
    }

    const data = await res.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ||
      (data?.promptFeedback?.blockReason
        ? 'No puc respondre això (filtrat per seguretat).'
        : 'No he pogut generar resposta. Torna-ho a provar.');

    return json({ reply }, 200, env);
  } catch (e) {
    return json({ error: 'Error intern: ' + (e?.message || e) }, 500, env);
  }
}
