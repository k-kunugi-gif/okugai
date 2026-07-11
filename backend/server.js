// 億街サロン 決済・会員バックエンド (Phase 1 最小構成)
// Stripe Checkout + Webhook + Discord OAuth/ロール管理。独自ログインは持たない。
import express from 'express';
import Stripe from 'stripe';
import fs from 'fs';

const {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  PRICE_LITE,            // 仮住まい ¥980 の price_xxx
  PRICE_STANDARD,        // 正住民 ¥4,980 の price_xxx
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_BOT_TOKEN,
  DISCORD_GUILD_ID,      // 秘密基地サーバーID
  ROLE_LITE,             // 「仮住民」ロールID
  ROLE_STANDARD,         // 「正住民」ロールID
  BASE_URL,              // 例: https://okugai.jp
  PORT = 4242,
} = process.env;

const stripe = new Stripe(STRIPE_SECRET_KEY);
const app = express();

// ---- 簡易ストア(本番はSQLite/Supabaseへ置換) ----
const STORE = new URL('./members.json', import.meta.url).pathname;
const load = () => (fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, 'utf8')) : {});
const save = (db) => fs.writeFileSync(STORE, JSON.stringify(db, null, 2));

const roleForPrice = (priceId) => (priceId === PRICE_STANDARD ? ROLE_STANDARD : ROLE_LITE);

// ---- 1. Checkoutセッション作成(LPのボタンから叩く) ----
app.get('/checkout/:plan', async (req, res) => {
  const price = req.params.plan === 'standard' ? PRICE_STANDARD : PRICE_LITE;
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    success_url: `${BASE_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/lp/index.html`,
    allow_promotion_codes: true,
  });
  res.redirect(303, session.url);
});

// ---- 2. Stripe Webhook ----
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  const db = load();
  const obj = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      db[obj.customer] = { ...db[obj.customer], sessionId: obj.id, status: 'active' };
      save(db);
      break;
    }
    case 'customer.subscription.deleted': {
      const rec = db[obj.customer];
      if (rec?.discordUserId) removeFromGuild(rec.discordUserId).catch(console.error);
      db[obj.customer] = { ...rec, status: 'canceled' };
      save(db);
      break;
    }
    case 'invoice.payment_failed': {
      db[obj.customer] = { ...db[obj.customer], status: 'past_due' };
      save(db);
      break;
    }
  }
  res.json({ received: true });
});

app.use(express.json());

// ---- 3. 決済完了ページ → Discord連携へ ----
app.get('/welcome', async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  if (session.payment_status !== 'paid') return res.status(403).send('決済が確認できませんでした。');
  const oauth = new URL('https://discord.com/oauth2/authorize');
  oauth.search = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    response_type: 'code',
    scope: 'identify guilds.join',
    redirect_uri: `${BASE_URL}/discord/callback`,
    state: session.id, // セッションIDを引き回して決済と紐付け
  });
  res.send(`<!doctype html><meta charset="utf-8">
    <body style="font-family:sans-serif;background:#05070d;color:#e9edf6;display:grid;place-items:center;height:100vh;text-align:center">
    <div><h1>ようこそ、億街へ。</h1><p>最後のステップ: Discordと連携して「秘密基地」の扉を開けてください。</p>
    <a href="${oauth}" style="display:inline-block;padding:14px 36px;border-radius:999px;background:linear-gradient(135deg,#41d8ff,#8d7bff);color:#05070d;font-weight:bold;text-decoration:none">Discordと連携して移住を完了する</a></div>`);
});

// ---- 4. Discord OAuth callback → サーバー追加+ロール付与 ----
app.get('/discord/callback', async (req, res) => {
  const { code, state: sessionId } = req.query;

  const token = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${BASE_URL}/discord/callback`,
    }),
  }).then((r) => r.json());

  const me = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  }).then((r) => r.json());

  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });
  if (session.payment_status !== 'paid') return res.status(403).send('決済が確認できませんでした。');
  const role = roleForPrice(session.line_items.data[0].price.id);

  // guilds.join でサーバーに追加(既存メンバーならロールのみ付与)
  await fetch(`https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${me.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: token.access_token, roles: [role] }),
  });
  await fetch(`https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${me.id}/roles/${role}`, {
    method: 'PUT',
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
  });

  const db = load();
  db[session.customer] = { ...db[session.customer], discordUserId: me.id, role, status: 'active' };
  save(db);

  res.send('<meta charset="utf-8">移住完了。秘密基地でお会いしましょう。Discordを開いてください。');
});

// ---- 4.5 回覧板: メール登録(HPの無料登録フォームから) ----
const SUBS = new URL('./subscribers.json', import.meta.url).pathname;
app.post('/subscribe', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'invalid email' });
  const list = fs.existsSync(SUBS) ? JSON.parse(fs.readFileSync(SUBS, 'utf8')) : [];
  if (!list.some((s) => s.email === email)) {
    list.push({ email, at: new Date().toISOString() });
    fs.writeFileSync(SUBS, JSON.stringify(list, null, 2));
  }
  res.json({ ok: true });
});

// ---- 5. 解約はStripe Billing Portalへ(自己完結) ----
app.get('/portal', async (req, res) => {
  const { customer } = req.query; // 実運用はメールリンク等でcustomer idを解決
  const portal = await stripe.billingPortal.sessions.create({
    customer,
    return_url: `${BASE_URL}/lp/index.html`,
  });
  res.redirect(303, portal.url);
});

async function removeFromGuild(discordUserId) {
  for (const role of [ROLE_LITE, ROLE_STANDARD]) {
    await fetch(`https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${role}`, {
      method: 'DELETE',
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    });
  }
}

app.listen(PORT, () => console.log(`億街バックエンド起動: http://localhost:${PORT}`));
