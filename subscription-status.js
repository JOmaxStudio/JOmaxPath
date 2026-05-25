// functions/api/cancel-subscription.js
// POST /api/cancel-subscription

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return Response.json({ error: 'Falta subscriptionId' }, { status: 400, headers: corsHeaders });
    }

    // Cancel·lar al final del període (no immediatament)
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ 'cancel_at_period_end': 'true' }).toString(),
    });

    const sub = await res.json();

    if (!res.ok) {
      return Response.json({ error: sub.error?.message }, { status: 500, headers: corsHeaders });
    }

    return Response.json({
      success:  true,
      cancelAt: new Date(sub.cancel_at * 1000).toISOString(),
    }, { headers: corsHeaders });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
