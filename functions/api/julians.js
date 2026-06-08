// functions/api/julians.js
// Cloudflare Pages Function — proxy segur a Google Gemini per al Julians AI.
// La clau viu com a variable d'entorn (GEMINI_API_KEY) i NO s'exposa mai al navegador.
// Tots els usuaris poden fer servir el Julians sense enganxar cap clau.

const MODEL_DEFAULT = 'gemini-2.0-flash';

export async function onRequestPost(context) {
  const { request, env } = context;
  const cors = {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'IA no configurada al servidor (falta GEMINI_API_KEY).' }), { status: 503, headers: cors });
    }

    const body = await request.json().catch(() => ({}));
    const system = (body.system || '').toString().slice(0, 4000);
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];

    // Mapeja els missatges al format de Gemini (assistant -> model)
    const contents = messages
      .filter(m => m && m.content)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: ('' + m.content).slice(0, 8000) }],
      }));

    if (contents.length === 0) {
      return new Response(JSON.stringify({ error: 'Cap missatge.' }), { status: 400, headers: cors });
    }

    const model = env.GEMINI_MODEL || MODEL_DEFAULT;
    const payload = {
      contents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.8 },
    };
    if (system) payload.system_instruction = { parts: [{ text: system }] };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errTxt = await res.text().catch(() => '');
      return new Response(JSON.stringify({ error: 'Error de la IA: ' + res.status, detail: errTxt.slice(0, 300) }), { status: 502, headers: cors });
    }

    const data = await res.json();
    // Bloquejat per filtres de seguretat o resposta buida
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ||
      (data?.promptFeedback?.blockReason ? 'No puc respondre això (filtrat per seguretat).' : 'No he pogut generar resposta. Torna-ho a provar.');

    return new Response(JSON.stringify({ reply }), { status: 200, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error intern: ' + (e?.message || e) }), { status: 500, headers: cors });
  }
}

export async function onRequestOptions(context) {
  const { env } = context;
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
