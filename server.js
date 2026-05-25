// ══════════════════════════════════════════════════════════════
//  JomaxPath — Backend de Pagaments amb Stripe
//  Fitxer: server.js
//  Execució: node server.js
//  Instal·lació: npm install express stripe dotenv cors
// ══════════════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors    = require('cors');

const app = express();

// ── CORS (permet peticions del frontend) ──
app.use(cors({
  origin: ['https://jomaxpath.com', 'http://localhost:3000'],
}));

// ── Serveix els fitxers estàtics de l'app (opcional) ──
// app.use(express.static('public'));

// ══════════════════════════════════════════════════════════════
//  WEBHOOK DE STRIPE
//  ⚠️  Ha d'anar ABANS de express.json() per rebre el raw body
// ══════════════════════════════════════════════════════════════
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ── Gestió d'esdeveniments ──
  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId  = session.metadata?.userId;
      const customerId     = session.customer;
      const subscriptionId = session.subscription;

      console.log(`✅ Checkout completat per usuari: ${userId}`);

      // TODO: Actualitzar la BD amb les dades de subscripció
      // Exemple amb Supabase:
      // await supabase.from('users').update({
      //   stripeCustomerId:    customerId,
      //   subscriptionId:      subscriptionId,
      //   subscriptionStatus:  'active',
      //   premiumSince:        new Date().toISOString(),
      // }).eq('id', userId);

      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      console.log(`🔄 Subscripció actualitzada: ${sub.id} → ${sub.status}`);

      // TODO: Actualitzar estat a la BD
      // await db.users.update({
      //   subscriptionStatus: sub.status,
      //   plan: sub.items.data[0].price.id === process.env.STRIPE_PRICE_YEARLY ? 'yearly' : 'monthly',
      //   premiumUntil: new Date(sub.current_period_end * 1000).toISOString(),
      // })

      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      console.log(`❌ Subscripció cancel·lada: ${sub.id}`);

      // TODO: Desactivar Premium a la BD
      // await db.users.update({
      //   subscriptionStatus: 'canceled',
      //   plan: null,
      // })

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.log(`⚠️  Pagament fallat per customer: ${invoice.customer}`);

      // TODO: Notificar l'usuari per email
      // await sendEmail({
      //   to: invoice.customer_email,
      //   subject: 'Problema amb el teu pagament de JomaxPath Premium',
      //   body: '...',
      // });

      break;
    }

    default:
      console.log(`Esdeveniment no gestionat: ${event.type}`);
  }

  res.json({ received: true });
});

// ── JSON per a la resta d'endpoints ──
app.use(express.json());

// ══════════════════════════════════════════════════════════════
//  POST /api/create-checkout-session
//  Crea una sessió de Stripe Checkout i retorna la URL
// ══════════════════════════════════════════════════════════════
app.post('/api/create-checkout-session', async (req, res) => {
  const { priceId, userId, email } = req.body;

  if (!priceId || !userId || !email) {
    return res.status(400).json({ error: 'Falten paràmetres: priceId, userId, email' });
  }

  try {
    // Comprovar si l'usuari ja té un customer de Stripe
    // const user = await db.users.findUnique({ where: { id: userId } });
    // const customerId = user?.stripeCustomerId || undefined;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      // customer: customerId,   // si ja existeix
      customer_email: email,    // si és nou
      metadata: { userId },
      success_url: `${process.env.SUCCESS_URL}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  process.env.CANCEL_URL,
      allow_promotion_codes: true,
      locale: 'ca', // català
    });

    console.log(`💳 Sessió de checkout creada: ${session.id} per usuari ${userId}`);
    res.json({ url: session.url });

  } catch (err) {
    console.error('Error creant checkout session:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  GET /api/subscription-status?userId=xxxx
//  Retorna l'estat de subscripció de l'usuari
// ══════════════════════════════════════════════════════════════
app.get('/api/subscription-status', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Falta el paràmetre userId' });
  }

  try {
    // TODO: consultar la teva BD per userId
    // const user = await db.users.findUnique({ where: { id: userId } });

    // Exemple de resposta (substituir amb dades reals):
    const mockUser = {
      subscriptionStatus: null,
      plan: null,
      premiumUntil: null,
    };

    const isPremium = mockUser.subscriptionStatus === 'active';

    res.json({
      isPremium,
      plan:      mockUser.plan,       // 'monthly' | 'yearly' | null
      expiresAt: mockUser.premiumUntil,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  POST /api/cancel-subscription
//  Cancel·la la subscripció al final del període actual
// ══════════════════════════════════════════════════════════════
app.post('/api/cancel-subscription', async (req, res) => {
  const { subscriptionId } = req.body;

  if (!subscriptionId) {
    return res.status(400).json({ error: 'Falta el subscriptionId' });
  }

  try {
    // cancel_at_period_end=true → no cancel·la immediatament
    const sub = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    console.log(`📅 Subscripció ${subscriptionId} cancel·larà el ${new Date(sub.cancel_at * 1000).toLocaleDateString('ca')}`);

    res.json({
      success:  true,
      cancelAt: new Date(sub.cancel_at * 1000).toISOString(),
    });

  } catch (err) {
    console.error('Error cancel·lant subscripció:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  Inici del servidor
// ══════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
  ⚡ JomaxPath Backend actiu
  ─────────────────────────
  Port:    ${PORT}
  Mode:    ${process.env.NODE_ENV || 'development'}
  Stripe:  ${process.env.STRIPE_SECRET_KEY ? '✅ Configurat' : '❌ Falta STRIPE_SECRET_KEY'}
  `);
});
