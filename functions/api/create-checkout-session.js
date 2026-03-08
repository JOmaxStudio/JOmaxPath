// functions/api/create-checkout-session.js
// Cloudflare Pages Function — crea una sessió de Stripe Checkout (Prebuilt form)
// Desplegament automàtic quan fas push al teu repo de Git

export async function onRequestPost(context) {
  const { request, env } = context;

  // ── CORS — permet peticions des del teu domini ──
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId, userId, email } = await request.json();

    if (!priceId || !userId || !email) {
      return Response.json(
        { error: 'Falten paràmetres: priceId, userId, email' },
        { status: 400, headers: corsHeaders }
      );
    }

    // ── Cridar l'API de Stripe directament (sense SDK, Cloudflare Workers no suporta Node) ──
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]':        'card',
        'mode':                          'subscription',
        'line_items[0][price]':          priceId,
        'line_items[0][quantity]':       '1',
        'customer_email':                email,
        'metadata[userId]':              userId,
        'ui_mode':                       'embedded',        // ← Prebuilt embedded form
        'return_url':                    `${env.SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
        'allow_promotion_codes':         'true',
        'locale':                        'auto',
      }).toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('[Stripe] Error:', session.error?.message);
      return Response.json(
        { error: session.error?.message || 'Error de Stripe' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Retornem el client_secret per al formulari embegut
    return Response.json(
      { clientSecret: session.client_secret, sessionId: session.id },
      { headers: corsHeaders }
    );

  } catch (err) {
    console.error('[Worker] Error:', err.message);
    return Response.json(
      { error: 'Error intern del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}
