/* 億街サロン — Stripe → Supabase 連携Webhook (Cloudflare Pages Function)
 *
 * 役割: Stripeの支払いイベントを受け取り、Supabaseの profiles.plan を更新する。
 *   - 支払い成功(checkout.session.completed) → plan = 'kichi'(秘密基地)
 *   - 解約(customer.subscription.deleted)     → plan = 'free'(見学)
 *   - 状態変更(customer.subscription.updated)  → active/trialing なら 'kichi'、それ以外 'free'
 *
 * ユーザーの紐付け: 「メールアドレス一致」
 *   Stripe決済時のメール == Discordログイン(=Supabase)のメール で照合する。
 *   ※会員には「Discordログインと同じメールで支払う」よう案内すること。
 *
 * 必要な環境変数 (Cloudflare Pages > プロジェクト > Settings > 環境変数):
 *   STRIPE_WEBHOOK_SECRET  … Stripeのwebhook署名シークレット (whsec_...)
 *   SUPABASE_URL           … https://xtrtbgymwsexzadrjedg.supabase.co
 *   SUPABASE_SERVICE_ROLE  … Supabaseの service_role キー(秘密・絶対に公開しない)
 *
 * 事前にSupabaseで1回だけ実行するSQL(profilesにemail/stripe_customer_id列＋signup自動作成トリガー)は
 * 別途セットアップ手順を参照。
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') || '';

  // --- Stripe署名の検証 (改ざん・なりすまし防止) ---
  const valid = await verifySig(body, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return new Response('invalid signature', { status: 400 });

  let event;
  try { event = JSON.parse(body); } catch (e) { return new Response('bad json', { status: 400 }); }
  const o = (event.data && event.data.object) || {};

  try {
    if (event.type === 'checkout.session.completed') {
      const email = (o.customer_details && o.customer_details.email) || o.customer_email;
      await setPlanByEmail(env, email, o.customer, 'kichi');
    } else if (event.type === 'customer.subscription.deleted') {
      await setPlanByCustomer(env, o.customer, 'free');
    } else if (event.type === 'customer.subscription.updated') {
      const active = o.status === 'active' || o.status === 'trialing';
      await setPlanByCustomer(env, o.customer, active ? 'kichi' : 'free');
    }
    // それ以外のイベントは無視(200を返す)
  } catch (e) {
    return new Response('handler error: ' + e.message, { status: 500 });
  }
  return new Response('ok', { status: 200 });
}

// Stripe-Signature を Web Crypto (HMAC-SHA256) で検証
async function verifySig(payload, header, secret) {
  if (!secret || !header) return false;
  const parts = {};
  header.split(',').forEach(function (p) { const i = p.indexOf('='); if (i > 0) parts[p.slice(0, i)] = p.slice(i + 1); });
  const t = parts.t, v1 = parts.v1;
  if (!t || !v1) return false;
  // 署名タイムスタンプが5分以上ずれていたら拒否(リプレイ対策)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(t)) > 300) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(t + '.' + payload));
  const hex = [...new Uint8Array(mac)].map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  if (hex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

function sbHeaders(env) {
  return {
    'apikey': env.SUPABASE_SERVICE_ROLE,
    'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE,
    'Content-Type': 'application/json'
  };
}

// メール一致で profiles.plan を更新(＋stripe_customer_idを記録=後の解約照合用)
async function setPlanByEmail(env, email, customer, plan) {
  if (!email) return;
  const url = env.SUPABASE_URL + '/rest/v1/profiles?email=eq.' + encodeURIComponent(email);
  await fetch(url, {
    method: 'PATCH',
    headers: Object.assign(sbHeaders(env), { 'Prefer': 'return=minimal' }),
    body: JSON.stringify({ plan: plan, stripe_customer_id: customer || null })
  });
}

// stripe_customer_id 一致で profiles.plan を更新(解約・状態変更時)
async function setPlanByCustomer(env, customer, plan) {
  if (!customer) return;
  const url = env.SUPABASE_URL + '/rest/v1/profiles?stripe_customer_id=eq.' + encodeURIComponent(customer);
  await fetch(url, {
    method: 'PATCH',
    headers: Object.assign(sbHeaders(env), { 'Prefer': 'return=minimal' }),
    body: JSON.stringify({ plan: plan })
  });
}
