// functions/api/webhook.js
// Cloudflare Pages Function — escolta events de Stripe
// URL del webhook a Stripe: https://jomaxpath.com/api/webhook

export async function onRequestPost(context) {
  const { request, env } = context;

  const body      = await request.text();
  const signature = request.headers.get('stripe-signature');

  // ── Verificar signatura del webhook ──
  // Cloudflare Workers no té crypto natiu de Node, usem SubtleCrypto
  const isValid = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response('Signatura invàlida', { status: 400 });
  }

  const event = JSON.parse(body);
  console.log(`[Webhook] Event rebut: ${event.type}`);

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId  = session.metadata?.userId;

      console.log(`✅ Checkout completat — userId: ${userId}`);

      // ── Actualitzar Supabase ──
      if (userId && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
        await updateSupabasePremium(userId, {
          isPremium:          true,
          stripeCustomerId:   session.customer,
          subscriptionId:     session.subscription,
          subscriptionStatus: 'active',
          premiumSince:       new Date().toISOString(),
        }, env);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const isPremium = sub.status === 'active' || sub.status === 'trialing';
      // Buscar userId per customerId a Supabase
      if (env.SUPABASE_URL) {
        await updateSupabaseByCustomer(sub.customer, {
          subscriptionStatus: sub.status,
          isPremium,
          premiumUntil: new Date(sub.current_period_end * 1000).toISOString(),
        }, env);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      console.log(`❌ Subscripció cancel·lada: ${sub.id}`);
      if (env.SUPABASE_URL) {
        await updateSupabaseByCustomer(sub.customer, {
          subscriptionStatus: 'canceled',
          isPremium: false,
          subscriptionId: null,
        }, env);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.log(`⚠️ Pagament fallat — customer: ${invoice.customer}`);
      // Aquí podries enviar un email via Resend/SendGrid
      break;
    }

    default:
      console.log(`[Webhook] Event no gestionat: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Verificació de signatura Stripe amb SubtleCrypto ──
async function verifyStripeSignature(payload, header, secret) {
  try {
    if (!header || !secret) return false;
    const parts     = Object.fromEntries(header.split(',').map(p => p.split('=')));
    const timestamp = parts['t'];
    const signature = parts['v1'];
    if (!timestamp || !signature) return false;

    const signed    = `${timestamp}.${payload}`;
    const key       = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf    = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
    const computed  = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2,'0')).join('');

    return computed === signature;
  } catch (e) {
    console.error('[Webhook] Error verificant signatura:', e);
    return false;
  }
}

// ── Helpers Supabase ──
async function updateSupabasePremium(userId, data, env) {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method:  'PATCH',
      headers: {
        'Content-Type':  'application/json',
        'apikey':         env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) console.error('[Supabase] Error actualitzant premium:', await res.text());
    else console.log('[Supabase] Premium activat per userId:', userId);
  } catch (e) {
    console.error('[Supabase] Error:', e.message);
  }
}

async function updateSupabaseByCustomer(customerId, data, env) {
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/profiles?stripeCustomerId=eq.${customerId}`,
      {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'apikey':         env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) console.error('[Supabase] Error per customer:', await res.text());
  } catch (e) {
    console.error('[Supabase] Error:', e.message);
  }
}
