#!/usr/bin/env bash
# 保留したアフィリエイト面(案件紹介所＋海外FX 19ページ)を元に戻す。
#   使い方:  bash tools/restore-affiliate-pages.sh
#
# commit 65c671b で退避したものを戻すが、同じcommitに入っている
# 「残したい変更」(審査用ログイン口・特商法・featグリッド・docs非公開)は保持する。
# 素の `git revert 65c671b` だとそれらまで巻き戻るので、このスクリプトを使うこと。
set -euo pipefail
cd "$(dirname "$0")/.."

HIDE_COMMIT=65c671b

echo "▶ 作業ツリーが綺麗か確認"
if [ -n "$(git status --porcelain)" ]; then
  echo "  ✗ 未コミットの変更があります。先に commit か stash してください。"; exit 1
fi

echo "▶ 退避commitを打ち消す(コミットはまだしない)"
git revert --no-commit "$HIDE_COMMIT"

echo "▶ 巻き戻したくない変更を復元"
git checkout "$HIDE_COMMIT" -- room/index.html lp/tokushoho.html .gitignore
# media/index.html は「海外/案件カードの削除」と「featグリッド修正」が同居しているため、
# グリッドだけ修正版に戻す
perl -0pi -e 's/\.feature\{display:grid;grid-template-columns:repeat\(4,1fr\);gap:16px\}/.feature{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}/' media/index.html

echo "▶ 検証"
ok=1
n=$(ls media/ | grep -cE '^(kaigai-fx|deals|review-(xm|exness|emc|mint|fxgt|hfm|axiory|bigboss|easymarkets|fbs|icmarkets|iforex|milton|threetrader|titan|ttcm|vantage))\.html$' || true)
[ "$n" = "19" ] && echo "  ✓ 19ページ復活" || { echo "  ✗ 復活したのは $n ページ"; ok=0; }
[ "$(grep -c 'mail-toggle' room/index.html)" != "0" ] && echo "  ✓ 審査用ログイン口は健在" || { echo "  ✗ 審査用ログイン口が消えた"; ok=0; }
[ "$(grep -c 'クレジットカード決済（Stripe）' lp/tokushoho.html)" = "0" ] && echo "  ✓ 特商法は現行のまま" || { echo "  ✗ 特商法にStripe表記が復活した"; ok=0; }
grep -q 'auto-fit,minmax(240px' media/index.html && echo "  ✓ featグリッドは修正版" || { echo "  ✗ featグリッドが4列固定に戻った"; ok=0; }
[ "$(grep -c '^docs/$' .gitignore)" = "1" ] && echo "  ✓ docs/ は非公開のまま" || { echo "  ✗ docs/ が公開対象になった"; ok=0; }
grep -q 'kaigai-fx' sitemap.xml && echo "  ✓ sitemapに復帰" || { echo "  ✗ sitemapに戻っていない"; ok=0; }

echo
if [ "$ok" = "1" ]; then
  echo "すべてOK。この後:"
  echo "  git commit -m 'アフィリエイト面の保留を解除'"
  echo "  git push origin main"
  echo "  → Cloudflareで「すべてを削除(Purge Everything)」"
else
  echo "検証に失敗しました。git revert --abort / git checkout . で元に戻せます。"; exit 1
fi
