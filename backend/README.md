# 億街サロン 決済・会員バックエンド

Stripe(決済) × Discord(会員エリア)連携の最小構成。**独自のログイン機能・パスワード管理は持たない**設計。

## アーキテクチャ(Phase 1: ローンチ構成)

```
LP「移住する」ボタン
 └─ Stripe Checkout(サブスク決済ページ / Stripe側でカード情報処理)
     └─ 決済成功 → success_url へ戻る
         └─ /welcome ページ「Discordと連携して基地に入る」ボタン
             └─ Discord OAuth2 → 本バックエンドが会員をサーバーに追加+「住民」ロール付与
                 (stripe_customer_id ⇔ discord_user_id を保存)

Stripe Webhook(本バックエンドが受信)
 ├─ checkout.session.completed   → 会員記録を作成
 ├─ invoice.payment_failed        → 猶予フラグ
 └─ customer.subscription.deleted → Discordロール剥奪(退去)

解約: Stripe Billing Portal(カスタマーポータル)で自己完結。こちらの実装は「ポータルへのリンク」だけ
```

### なぜ独自ログインを作らないか
1. **会員エリアはDiscord** — 認証はDiscordが持っている。二重にログインを作ると UX も保守も悪化
2. **カード情報・パスワードを一切保持しない** — 漏えいリスクと特商法/個人情報保護の負担を最小化
3. **後から足せる** — Web上の会員限定アーカイブが必要になったら Supabase Auth(Discord OAuthログイン)を追加すれば、この構成のまま拡張できる(Phase 2)

## セットアップ(ユーザー作業)

1. **Stripe**: アカウント作成 → 商品2つ(仮住まい¥980/正住民¥4,980 のrecurring price)→ APIキー(テスト)取得 → Webhookエンドポイント登録
2. **Discord**: サーバー「秘密基地」作成 → Developer PortalでBot作成(SERVER MEMBERS INTENT有効)→ Botをサーバーに招待(ロール管理権限)→ OAuth2 redirect に `/discord/callback` を登録
3. `.env.example` をコピーして `.env` を作成し、各キーを記入
4. `npm install && npm start` (本番は Cloudflare Workers / Render / Railway 等へ)

## ファイル

- `server.js` — Express。Webhook受信 / Checkoutセッション作成 / Discord OAuth連携 / ロール付与・剥奪
- `.env.example` — 必要な環境変数の一覧
- `members.json` — 簡易ストア(本番はSQLite/Supabaseに置換推奨)

## テスト手順

1. `stripe listen --forward-to localhost:4242/webhook` (Stripe CLI)
2. テストカード `4242 4242 4242 4242` で Checkout を通す
3. /welcome → Discord連携 → サーバーに「住民」ロールが付くことを確認
4. Stripeダッシュボードでサブスクをキャンセル → ロールが外れることを確認
