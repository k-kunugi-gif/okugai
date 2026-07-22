# -*- coding: utf-8 -*-
import re, json
p = "column-041.html"
s = open(p).read()

TITLE = "FX自動売買(EA)は儲かる？｜買う前に確かめる・詐欺EAの見分け方 | 億街"
DESC = "FX自動売買(EA)で勝てないのは「買って終わり」だから。EAは自動で動くルールにすぎない。買う前に確かめる最小4ステップ(バックテスト→フォワード→少額→本番)、儲かるEAを宣伝でなく数字で見抜く方法、詐欺EAの3つの赤信号、動かす環境(VPS・MT対応口座)まで解説。"
OG_TITLE = "EAは「買う」ものじゃない。「確かめる」ものだ。"
OG_DESC = "自動で稼ぐ箱を探すのをやめた日から、自動売買は武器になる。"

# --- head meta ---
s = s.replace('<title>FX用VPSの選び方|EAを24時間動かす環境構築とスペックの目安 | 億街</title>', f'<title>{TITLE}</title>')
s = s.replace('<meta name="description" content="EAを24時間止めずに動かすためのVPS入門。自宅PCが止まる3つの瞬間、必要スペックの目安(MT4の数×0.5GB+2GB)、レイテンシが効く場面、契約からMT4常駐までの手順、月額を何pipsで回収するかの考え方まで解説。">', f'<meta name="description" content="{DESC}">')
s = s.replace('<link rel="canonical" href="https://okugai.net/media/column-040">', '<link rel="canonical" href="https://okugai.net/media/column-041">')
s = s.replace('<meta property="og:title" content="世界は、眠らない。——FX用VPSの選び方">', f'<meta property="og:title" content="{OG_TITLE}">')
s = s.replace('<meta property="og:description" content="無料で、高機能で、世界中の資産が使える作業台。">', f'<meta property="og:description" content="{OG_DESC}">')
s = s.replace('<meta property="og:url" content="https://okugai.net/media/column-040">', '<meta property="og:url" content="https://okugai.net/media/column-041">')
s = s.replace('<meta property="og:image" content="https://okugai.net/assets/ogp/og-column-040.jpg">', '<meta property="og:image" content="https://okugai.net/assets/ogp/og-column-041.jpg">')

# --- JSON-LD Article ---
s = s.replace(
'{"@type":"Article","headline":"世界は、眠らない。——FX用VPSの選び方","description":"EAを24時間動かすためのVPSの選び方・スペック目安・導入手順・コスト回収の考え方を解説。","image":"https://okugai.net/assets/ogp/og-column-040.jpg","inLanguage":"ja","author":{"@type":"Organization","name":"億街サロン"},"publisher":{"@type":"Organization","name":"億街サロン","logo":{"@type":"ImageObject","url":"https://okugai.net/assets/favicon.svg"}},"mainEntityOfPage":"https://okugai.net/media/column-040.html"},',
'{"@type":"Article","headline":"EAは「買う」ものじゃない。「確かめる」ものだ。","description":"FX自動売買(EA)で負けるのは「買って終わり」だから。買う前に確かめる最小4ステップと、詐欺EAの見分け方を解説。","image":"https://okugai.net/assets/ogp/og-column-041.jpg","inLanguage":"ja","author":{"@type":"Organization","name":"億街サロン"},"publisher":{"@type":"Organization","name":"億街サロン","logo":{"@type":"ImageObject","url":"https://okugai.net/assets/favicon.svg"}},"mainEntityOfPage":"https://okugai.net/media/column-041.html"},')

# --- JSON-LD Breadcrumb ---
s = s.replace(
'{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"展望塔","item":"https://okugai.net/media/"},{"@type":"ListItem","position":2,"name":"口座・環境","item":"https://okugai.net/media/#columns"},{"@type":"ListItem","position":3,"name":"FX用VPSの選び方","item":"https://okugai.net/media/column-040.html"}]},',
'{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"展望塔","item":"https://okugai.net/media/"},{"@type":"ListItem","position":2,"name":"検証・手法","item":"https://okugai.net/media/hub-kensho"},{"@type":"ListItem","position":3,"name":"FX自動売買(EA)は儲かる？","item":"https://okugai.net/media/column-041.html"}]},')

# --- JSON-LD FAQPage (差し替え) ---
old_faq_start = s.find('{"@type":"FAQPage"')
old_faq_end = s.find(']}\n]}\n</script>')
new_faq = ('{"@type":"FAQPage","mainEntity":['
 '{"@type":"Question","name":"EAを買えば自動で稼げますか？","acceptedAnswer":{"@type":"Answer","text":"いいえ。EAは「あなたの代わりにルールを自動で実行する道具」であって、利益を保証する箱ではありません。中身のルールに優位性がなければ、自動で負けるだけです。だから重要なのは「どのEAを買うか」ではなく「そのルールを、動かす前に自分で確かめたか」です。"}},'
 '{"@type":"Question","name":"儲かるEAはどう見分けますか？","acceptedAnswer":{"@type":"Answer","text":"宣伝文句や右肩上がりの実績画像では見分けられません。見るべきは3つの数字——最大ドローダウン(最悪期にどこまで沈んだか)、プロフィットファクター、そして検証期間に上げ・下げ・レンジの相場が含まれているか。この3つを開示できないEAは、優位性を証明していないのと同じです。"}},'
 '{"@type":"Question","name":"バックテストで好成績でも実運用で負けるのはなぜですか？","acceptedAnswer":{"@type":"Answer","text":"過去データに合わせ込みすぎた(カーブフィッティング)場合と、スプレッド・スリッページなど実際のコストを検証に含めていない場合が典型です。だからバックテストの後に必ずフォワードテスト(未来のデータで検証)と少額の実弾運用を挟み、想定と現実のズレを確認してから本番に上げます。"}},'
 '{"@type":"Question","name":"自動売買はどの口座・環境で動かせばいいですか？","acceptedAnswer":{"@type":"Answer","text":"EAはMT4/MT5というプラットフォームで動きます。国内ではFXTFなど一部、海外FXはほぼ全社が対応。24時間止めずに動かすにはVPS(データセンターにある止まらないPC)を借りるのが基本です。スプレッドと約定品質が成績に直結するため、口座選びは検証と同じくらい重要です。"}}]}')
s = s[:old_faq_start] + new_faq + s[old_faq_end+2:]  # +2 to keep the ]}\n]} closing structure? adjust below

open(p,"w").write(s)
print("PART1(head/JSON-LD) done. FAQ boundary check:", old_faq_start>0, old_faq_end>0)
