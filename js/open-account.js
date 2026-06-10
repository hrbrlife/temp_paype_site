/**
 * paype.cc — Open Account routing.
 *
 * Detects: Desktop | iOS | Android, Real browser | In-app browser, Standalone PWA.
 * Behaviour:
 *   Desktop / PWA standalone  →  same-tab navigation to ACCOUNT_URL
 *   Mobile real browser       →  same-tab navigation (PWA install prompt works)
 *   Mobile in-app browser     →  Android: Chrome intent URI (breakout)
 *                                iOS:     overlay with "Open in Safari" instructions
 *
 * All elements with [data-open-account] are handled via event delegation,
 * so dynamically-injected buttons work automatically.
 */
(function () {
  'use strict';

  var ACCOUNT_URL = 'https://pay.paype.cc';
  var ua = navigator.userAgent || '';

  // ── Platform ──────────────────────────────────────────────────
  var isIOS     = /iPhone|iPad|iPod/i.test(ua);
  var isAndroid = /Android/i.test(ua);
  var isMobile  = isIOS || isAndroid;

  // ── PWA standalone ────────────────────────────────────────────
  var isStandalone = !!(
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone
  );

  // ── In-app browser fingerprints ───────────────────────────────
  // UA tokens that reliably indicate a named in-app WebView
  var IA = {
    facebook:  /FBAN|FBAV|FB_IAB|FBIOS|FB4A|FBDV/i.test(ua),
    instagram: /Instagram/i.test(ua),
    tiktok:    /BytedanceWebview|musical_ly/i.test(ua),
    wechat:    /MicroMessenger/i.test(ua),
    twitter:   /\bTwitter\b/i.test(ua),
    linkedin:  /LinkedInApp/i.test(ua),
    snapchat:  /Snapchat/i.test(ua),
    line:      /\bLine\/\d/i.test(ua),
    reddit:    /\bReddit\b/i.test(ua),
    pinterest: /Pinterest/i.test(ua),
    telegram:  /\bTelegram\b/i.test(ua),
    whatsapp:  /WhatsApp/i.test(ua),
    discord:   /Discord/i.test(ua),
  };

  // Generic Android WebView: 'wv' token in UA (absent from real Chrome/Firefox/Samsung)
  // e.g. "... Mobile Safari/537.36 (wv)"
  var isAndroidWV = isAndroid && /\bwv\b/.test(ua) && !/SamsungBrowser|OPR\/|EdgA\//i.test(ua);

  var isInApp = isAndroidWV || Object.keys(IA).some(function (k) { return IA[k]; });

  var inAppName = (function () {
    if (IA.facebook)  return 'Facebook';
    if (IA.instagram) return 'Instagram';
    if (IA.tiktok)    return 'TikTok';
    if (IA.wechat)    return 'WeChat';
    if (IA.twitter)   return 'X (Twitter)';
    if (IA.linkedin)  return 'LinkedIn';
    if (IA.snapchat)  return 'Snapchat';
    if (IA.line)      return 'Line';
    if (IA.reddit)    return 'Reddit';
    if (IA.pinterest) return 'Pinterest';
    if (IA.telegram)  return 'Telegram';
    if (IA.whatsapp)  return 'WhatsApp';
    if (IA.discord)   return 'Discord';
    return 'this app';
  })();

  // Expose for debugging and other modules
  window.__paypeDevice = {
    ua: ua,
    isIOS: isIOS, isAndroid: isAndroid, isMobile: isMobile,
    isStandalone: isStandalone,
    isInApp: isInApp, inAppName: inAppName, inAppSignals: IA,
    accountURL: ACCOUNT_URL
  };

  // ── Core handler ──────────────────────────────────────────────
  function openAccount(e) {
    // Desktop or already in PWA: plain same-tab navigation
    if (!isMobile || isStandalone) {
      e.preventDefault();
      window.location.href = ACCOUNT_URL;
      return;
    }

    // Real mobile browser: navigate directly (Safari / Chrome install prompt works)
    if (!isInApp) {
      e.preventDefault();
      window.location.href = ACCOUNT_URL;
      return;
    }

    // ── In-app browser breakout ────────────────────────────────
    e.preventDefault();

    if (isAndroid) {
      // Chrome intent URI: asks Android to open URL in the default browser
      // Falls back to ACCOUNT_URL if no suitable browser found
      var intentUrl =
        'intent://' + ACCOUNT_URL.replace(/^https?:\/\//, '') +
        '#Intent;scheme=https;' +
        'S.browser_fallback_url=' + encodeURIComponent(ACCOUNT_URL) + ';end';
      window.location.href = intentUrl;
      // Show overlay after a short wait in case the intent was not handled
      setTimeout(showOverlay, 1400);
    } else {
      // iOS — no reliable programmatic scheme; guide the user manually
      showOverlay();
    }
  }

  // ── Breakout overlay ──────────────────────────────────────────
  function showOverlay() {
    if (document.getElementById('paype-breakout')) return;

    var browserName = isIOS ? 'Safari' : 'Chrome';
    var instruction = isIOS
      ? 'Tap <strong>⋯</strong> or <strong>↗&thinsp;Share</strong> → <strong>Open in Safari</strong>'
      : 'Tap <strong>⋮</strong> → <strong>Open in Chrome</strong>';

    var el = document.createElement('div');
    el.id = 'paype-breakout';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML =
      '<div class="pb-bd" aria-hidden="true"></div>' +
      '<div class="pb-card">' +
      '  <p class="pb-logo">PAYPE<span>.cc</span></p>' +
      '  <p class="pb-title">Open in ' + browserName + '</p>' +
      '  <p class="pb-body">You\'re in ' + inAppName + '\'s browser. ' +
      '  To open a paype.cc account (and install the app), please switch to ' + browserName + '.</p>' +
      '  <p class="pb-inst">' + instruction + '</p>' +
      '  <button class="pb-copy" data-url="' + ACCOUNT_URL + '">Copy link</button>' +
      '  <button class="pb-dismiss">Dismiss</button>' +
      '</div>';

    document.body.appendChild(el);

    // Two rAF frames so the transition fires after paint
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('pb-open'); });
    });

    function close() {
      el.classList.remove('pb-open');
      setTimeout(function () { if (el.parentNode) el.remove(); }, 300);
    }

    el.querySelector('.pb-bd').addEventListener('click', close);
    el.querySelector('.pb-dismiss').addEventListener('click', close);
    document.addEventListener('keydown', function esc(ev) {
      if (ev.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    el.querySelector('.pb-copy').addEventListener('click', function () {
      var btn = this;
      var text = btn.getAttribute('data-url');
      var done = function () { btn.textContent = '✓ Copied!'; };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    });
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* silent */ }
    ta.remove();
  }

  // ── Event delegation ──────────────────────────────────────────
  // Handles both static and dynamically injected [data-open-account] elements
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-open-account]');
    if (!el) return;
    openAccount(e);
  });

  // ── Overlay styles (injected; keeps CSS in one deployable file) ─
  var css = [
    '#paype-breakout{position:fixed;inset:0;z-index:9000;display:flex;align-items:flex-end;justify-content:center;pointer-events:none}',
    '#paype-breakout.pb-open{pointer-events:auto}',
    '#paype-breakout .pb-bd{position:absolute;inset:0;background:transparent;transition:background .25s ease}',
    '#paype-breakout.pb-open .pb-bd{background:rgba(0,0,0,.6)}',
    '#paype-breakout .pb-card{position:relative;width:100%;max-width:520px;background:#0d0d0d;border:1px solid rgba(255,255,255,.12);border-radius:18px 18px 0 0;padding:28px 22px 44px;transform:translateY(100%);transition:transform .3s cubic-bezier(.32,.72,0,1)}',
    '#paype-breakout.pb-open .pb-card{transform:translateY(0)}',
    '#paype-breakout .pb-logo{font-family:"Barlow Condensed","Barlow Semi Condensed",sans-serif;font-weight:900;font-size:1.4rem;letter-spacing:.06em;color:#fff;margin:0 0 14px}',
    '#paype-breakout .pb-logo span{color:#b8ff5a}',
    '#paype-breakout .pb-title{font-size:1.1rem;font-weight:700;color:#fff;margin:0 0 8px}',
    '#paype-breakout .pb-body{font-size:.9rem;color:rgba(255,255,255,.65);margin:0 0 14px;line-height:1.55}',
    '#paype-breakout .pb-inst{font-size:.92rem;color:#fff;background:rgba(255,255,255,.08);border-radius:10px;padding:12px 14px;margin:0 0 18px;line-height:1.6}',
    '#paype-breakout .pb-copy{display:block;width:100%;padding:14px;background:#b8ff5a;color:#0d0d0d;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;margin-bottom:10px;text-align:center}',
    '#paype-breakout .pb-dismiss{display:block;width:100%;padding:12px;background:transparent;color:rgba(255,255,255,.45);border:1px solid rgba(255,255,255,.15);border-radius:10px;font-size:.88rem;cursor:pointer;text-align:center}',
  ].join('');
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

})();
