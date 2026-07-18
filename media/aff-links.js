/* 億街・展望塔 アフィリンク一元管理
 * ここにURLを入れるだけで、比較ページ・全レビューページのCTAが自動で実リンク化されます
 * (空文字のまま = 「準備中」表示のまま。JS側が自動で出し分け)
 *
 * 更新履歴: 2026-07-18 一元化。FXTF(A8提携済)を投入
 */
var AFF_LINKS={
  /* ===== 国内FX ===== */
  fxtf:"https://px.a8.net/svt/ejp?a8mat=4B83CY+FIGM7M+48D0+5YZ77",              // A8提携済(2026-07-18) 新規口座開設15,000円
  sbi:"",
  minna:"",
  gmo:"",
  dmm:"",
  gaitame:"",
  linefx:"",
  rakuten:"",
  matsui:"",
  hirose:"",
  lightfx:"",
  central:"",
  fxprime:"",
  moneypartners:"",
  gaitameonline:"",
  jfx:"",

  /* ===== 海外FX ===== */
  emc:"",
  mint:"",
  xm:"",
  exness:"",
  titan:"",
  axiory:"",
  fxgt:"",
  bigboss:"",
  threetrader:"",
  ttcm:"",
  vantage:"",
  hfm:"",
  icmarkets:"",
  iforex:"",
  milton:"",
  fbs:"",
  easymarkets:"",

  /* ===== FX環境構築(VPS・サーバー) ===== */
  xserver:"",   // エックスサーバーVPS (A8承認済・リンク取得待ち)
  conoha:""     // ConoHa VPS / GMOインターネット (A8承認済・リンク取得待ち)
};

/* ===== アフィリンクのクリック計測(GA4) =====
 * どの案件がどのページで何回押されたかを計測します。
 * GA4のイベント名: affiliate_click / パラメータ: affiliate(案件キー), page(ページパス)
 * ※ イベント委譲なので、後からDOMに入るリンクも自動で拾います
 */
document.addEventListener('click', function(e){
  var a = e.target && e.target.closest ? e.target.closest('a.js-aff') : null;
  if(!a) return;
  var key = a.dataset ? a.dataset.aff : '';
  if(!key) return;
  if(typeof gtag === 'function'){
    gtag('event','affiliate_click',{affiliate:key, page:location.pathname});
  }
}, true);
