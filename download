// functions/api/subscription-status.js
// GET /api/subscription-status?userId=xxxx

export async function onRequestGet(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Content-Type': 'application/json',
  };

  const url    = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return Response.json({ error: 'Falta userId' }, { status: 400, headers: corsHeaders });
  }

  try {
    // Consultar Supabase
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
      // Sense Supabase configurat, retornar no-premium
      return Response.json({ isPremium: false, plan: null, expiresAt: null }, { headers: corsHeaders });
    }

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=isPremium,subscriptionStatus,plan,premiumUntil`,
      {
        headers: {
          'apikey':         env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    const rows = await res.json();
    const user = rows?.[0];

    return Response.json({
      isPremium: user?.isPremium === true && user?.subscriptionStatus === 'active',
      plan:      user?.plan      ?? null,
      expiresAt: user?.premiumUntil ?? null,
    }, { headers: corsHeaders });

  } catch (err) {
    return Response.json(
      { isPremium: false, plan: null, expiresAt: null, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
