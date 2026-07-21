import re, json, glob

idx = open("index.html").read()

# --- 共有シェルの抽出 ---
style = re.search(r'<style>.*?</style>', idx, re.S).group(0)
header = re.search(r'<header>.*?</header>', idx, re.S).group(0)
footer = re.search(r'<footer>.*?</footer>', idx, re.S).group(0)
sticky = re.search(r'<div class="sticky-cta">.*?</div>\s*</div>', idx, re.S)
sticky = sticky.group(0) if sticky else ''
totop = re.search(r'<a class="totop".*?</a>', idx, re.S)
totop = totop.group(0) if totop else ''
# nav-toggle と room-link のスクリプトだけ拾う(検索スクリプトは重いので除外)
scripts = ''.join(re.findall(r'<script>(?:(?!</script>).)*?(?:nav-toggle|room-link|classList\.toggle)(?:(?!</script>).)*?</script>', idx, re.S))

# --- 記事メタ ---
arts = json.load(open("/tmp/arts.json"))

# --- カテゴリ定義 ---
CATS = [
  {"cat":"検証・手法","slug":"hub-kensho","kicker":"VERIFICATION","lead":"手法は「試す」ものではなく「確かめる」もの。バックテスト、フォワードテスト、検証ノート——億街が最も大切にする“検証の技術”をまとめました。聖杯を探すより、目の前の手法を数字で確かめられるようになること。遠回りに見えて、それが一番の近道です。","money":None},
  {"cat":"資金管理・マインド","slug":"hub-shikin","kicker":"RISK & MIND","lead":"退場の多くは、手法ではなく資金管理とメンタルで起きます。ロット計算、破産確率、損益比、プロスペクト理論——「まず生き残るための技術」を集めました。攻める前に、退場しないこと。","money":("fx-hikaku.html","国内FX口座 比較——少額から始めるなら")},
  {"cat":"基礎・入門","slug":"hub-nyumon","kicker":"BASICS","lead":"FXとは何か、から。口座の仕組み、注文方法、スプレッド、レバレッジ——最初につまずくポイントを、遠回りせず一つずつ。ここを固めておくと、後の検証がぐっと楽になります。","money":("fx-hikaku.html","はじめての口座は国内から——国内FX比較")},
  {"cat":"口座・環境","slug":"hub-koza","kicker":"BROKER & SETUP","lead":"同じ手法でも、口座と環境で結果は変わります。国内と海外の使い分け、ゴールドや仮想通貨の口座、VPS——「どこで・どう取引するか」の判断材料を集めました。各口座の詳しい条件は、下の比較ページで。","money":("kaigai-fx.html","海外FX口座 比較")},
]

def card(a):
    return f'''      <a class="colcard" href="{a['file']}" data-ghost="{a['n']}">
        <div class="body">
          <div class="meta"><span>VOL.{a['n']}</span></div>
          <h3>{a['h1']}</h3>
          <p>{a['desc'][:80]}</p>
          <span class="go">読む →</span>
        </div>
      </a>'''

for c in CATS:
    items = [a for a in arts if a["cat"]==c["cat"]]
    items.sort(key=lambda x:x["n"])
    cards = "\n".join(card(a) for a in items)
    ld_items = ",".join(f'{{"@type":"ListItem","position":{i+1},"name":{json.dumps(a["h1"],ensure_ascii=False)},"url":"https://okugai.net/media/{a["file"]}"}}' for i,a in enumerate(items))
    money = ""
    if c["money"]:
        href,label = c["money"]
        money = f'''    <a class="hub-money" href="{href}">
      <span class="hm-t">▶ 関連する口座比較</span>
      <span class="hm-l">{label}</span>
    </a>'''
    title = f"{c['cat']}のコラム一覧｜FX検証メディア 億街 展望塔"
    desc = c["lead"][:110]
    canonical = f"https://okugai.net/media/{c['slug']}"
    ld = ('{"@context":"https://schema.org","@graph":['
      '{"@type":"BreadcrumbList","itemListElement":['
      '{"@type":"ListItem","position":1,"name":"億街","item":"https://okugai.net/"},'
      '{"@type":"ListItem","position":2,"name":"展望塔","item":"https://okugai.net/media/"},'
      f'{{"@type":"ListItem","position":3,"name":{json.dumps(c["cat"],ensure_ascii=False)},"item":"{canonical}"}}]}},'
      f'{{"@type":"CollectionPage","name":{json.dumps(c["cat"]+"のコラム",ensure_ascii=False)},"url":"{canonical}",'
      f'"mainEntity":{{"@type":"ItemList","numberOfItems":{len(items)},"itemListElement":[{ld_items}]}}}}]}}')

    extra_css = '''
.hub-head{padding:76px 0 24px}
.hub-kicker{font-size:11px;font-weight:900;letter-spacing:.34em;color:var(--cyan);margin-bottom:14px}
.hub-head h1{font-family:var(--serif);font-size:clamp(28px,5vw,42px);font-weight:800;letter-spacing:.04em;line-height:1.5;margin-bottom:20px}
.hub-lead{color:var(--sub);font-size:15px;line-height:2;max-width:720px}
.hub-count{margin-top:18px;font-size:12px;font-weight:700;letter-spacing:.1em;color:var(--sub)}
.hub-money{display:flex;flex-direction:column;gap:4px;max-width:520px;margin:26px 0 0;padding:18px 24px;border-radius:16px;border:1px solid rgba(65,216,255,.4);background:linear-gradient(120deg,rgba(65,216,255,.08),rgba(141,123,255,.1)),rgba(5,7,13,.7);transition:transform .2s,border-color .2s}
.hub-money:hover{transform:translateY(-2px);border-color:rgba(65,216,255,.8)}
.hub-money .hm-t{font-size:11px;font-weight:900;letter-spacing:.14em;color:var(--cyan)}
.hub-money .hm-l{font-family:var(--serif);font-size:16px;font-weight:700;color:var(--text)}
.hub-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin:36px 0 0}
@media(max-width:760px){.hub-grid{grid-template-columns:1fr}}
.hub-back{display:inline-block;margin:40px 0 0;font-size:13px;color:var(--cyan)}'''

    page = f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#05070d">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canonical}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
<meta property="og:type" content="website">
<meta property="og:site_name" content="億街サロン">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
{ld}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap" rel="stylesheet">
{style[:-8]}{extra_css}
</style>
</head>
<body id="top">
{header}

<div class="container hub-head">
  <div class="crumb" style="font-size:11.5px;color:var(--sub);margin-bottom:22px"><a href="index.html" style="color:var(--sub)">展望塔</a> / {c['cat']}</div>
  <div class="hub-kicker">{c['kicker']}</div>
  <h1>{c['cat']}</h1>
  <p class="hub-lead">{c['lead']}</p>
  <div class="hub-count">全 {len(items)} 本</div>
{money}
</div>

<section class="container">
  <div class="hub-grid">
{cards}
  </div>
  <a class="hub-back" href="index.html">← 展望塔トップへ</a>
</section>

{sticky}
{totop}
{footer}
{scripts}
</body>
</html>'''
    open(f"{c['slug']}.html","w").write(page)
    print(f"生成: {c['slug']}.html ({len(items)}本, money={'あり' if c['money'] else 'なし'})")
