#!/usr/bin/env bash
# 特商法(日/英)の所在地を実住所に差し替える。
#   使い方: bash tools/set-address.sh "東京都〇〇区〇〇1-2-3 〇〇マンション101"
#
# ※住民票どおりの表記にすること(決済代行が住民票と突き合わせるため)。
# ※苦情処理対応マニュアルの所在地は scratchpad の gen_kujo.js 側で差し替える。
set -euo pipefail
cd "$(dirname "$0")/.."

ADDR="${1:-}"
if [ -z "$ADDR" ]; then
  echo "住所を引数で渡してください。"
  echo '例: bash tools/set-address.sh "東京都渋谷区〇〇1-2-3 〇〇ハイツ101"'
  exit 1
fi

OLD_JA='請求があれば遅滞なく開示します（お問い合わせはまずメールにて）'
OLD_EN='Address is disclosed without delay upon request. Please contact us by email first.'

echo "▶ 日本語版 lp/tokushoho.html"
if grep -q "<tr><th>所在地</th><td>${OLD_JA}</td></tr>" lp/tokushoho.html; then
  perl -0pi -e "s{<tr><th>所在地</th><td>\Q${OLD_JA}\E</td></tr>}{<tr><th>所在地</th><td>${ADDR}</td></tr>}" lp/tokushoho.html
  echo "  ✓ 差し替え"
else
  echo "  ! 既定の文言が見つかりません。手動で確認してください。"
fi

echo "▶ 英語版 lp/en/tokushoho.html"
if grep -q "${OLD_EN}" lp/en/tokushoho.html; then
  perl -0pi -e "s{\Q${OLD_EN}\E}{Address: ${ADDR}}" lp/en/tokushoho.html
  echo "  ✓ 差し替え"
else
  echo "  ! 既定の文言が見つかりません。手動で確認してください。"
fi

echo
echo "▶ 検証"
grep -o '<tr><th>所在地</th><td>[^<]*' lp/tokushoho.html
grep -o 'Address: [^<]*' lp/en/tokushoho.html | head -1
echo
echo "残る『請求があれば開示』の箇所: $(grep -c "${OLD_JA}" lp/tokushoho.html || true) (0が正解)"
echo
echo "この後: git add -A && git commit -m '特商法に所在地を記載' && git push origin main"
