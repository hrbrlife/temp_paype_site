/**
 * paype.cc — Open Account routing.
 *
 * Detection matrix (evaluated in order):
 *   Desktop / PWA standalone    →  same-tab → ACCOUNT_URL
 *   Mobile in-app browser       →  breakout: Android intent:// + overlay, iOS overlay
 *   Android non-Chrome          →  intent targeting Chrome + overlay fallback
 *     (incl. Brave, Samsung, Firefox, Opera, Edge, DDG, UC…)
 *   iOS non-Safari              →  overlay "Open in Safari"
 *     (incl. Chrome for iOS, Firefox iOS, Edge iOS, DDG…)
 *   Correct mobile browser      →  same-tab → ACCOUNT_URL  (PWA install works)
 *
 * Brave on Android spoofs Chrome UA — detected via navigator.brave (async).
 * All [data-open-account] elements handled via event delegation (dynamic-safe).
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
  // Generic Android WebView ('wv' token, absent from real standalone browsers)
  var isAndroidWV = isAndroid && /\bwv\b/.test(ua);
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

  // ── Primary browser detection ─────────────────────────────────
  // iOS Safari: absence of all known iOS-wrapper markers
  // (CriOS=Chrome, FxiOS=Firefox, EdgiOS=Edge, OPiOS=Opera, DDG, Brave etc.)
  var isSafariIOS = isIOS && !isInApp &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Brave/i.test(ua);

  // Android Chrome: has Chrome/ token AND none of the known non-Chrome UA markers.
  // Brave spoofs as Chrome (no UA marker) — caught separately via navigator.brave.
  var isChromeAndroid = isAndroid && !isInApp &&
    /Chrome\/\d/.test(ua) &&
    !/SamsungBrowser|OPR\/|EdgA\/|Firefox|DuckDuckGo|UCBrowser|YaBrowser|Brave/i.test(ua);

  // Brave detection: navigator.brave exists in Brave (Chrome-spoof).
  // isBrave.isBrave() is async in modern Brave; we kick it off at page load
  // so the flag is set long before any user click.
  var isBraveMobile = false;
  if (isMobile && !isInApp && window.navigator.brave) {
    try {
      var braveResult = window.navigator.brave.isBrave();
      if (braveResult && typeof braveResult.then === 'function') {
        braveResult.then(function (v) { isBraveMobile = !!v; }).catch(function () { isBraveMobile = true; });
      } else {
        isBraveMobile = true; // older sync API
      }
    } catch (e) { isBraveMobile = true; }
  }

  // Expose for debugging / other modules
  window.__paypeDevice = {
    ua: ua,
    isIOS: isIOS, isAndroid: isAndroid, isMobile: isMobile,
    isStandalone: isStandalone,
    isInApp: isInApp, inAppName: inAppName, inAppSignals: IA,
    isSafariIOS: isSafariIOS, isChromeAndroid: isChromeAndroid,
    get isBrave() { return isBraveMobile; },
    accountURL: ACCOUNT_URL
  };

  // ── Core handler ──────────────────────────────────────────────
  function openAccount(e) {
    e.preventDefault();

    // ① Desktop or already running as PWA — navigate directly
    if (!isMobile || isStandalone) {
      window.location.href = ACCOUNT_URL;
      return;
    }

    // ② In-app browser — must break out first
    if (isInApp) {
      if (isAndroid) {
        // Intent with no package = Android picks default browser (best for in-app)
        var intent = 'intent://' + ACCOUNT_URL.replace(/^https?:\/\//, '') +
          '#Intent;scheme=https;S.browser_fallback_url=' + encodeURIComponent(ACCOUNT_URL) + ';end';
        window.location.href = intent;
        setTimeout(function () {
          showOverlay({
            title: 'Open in Chrome',
            body: 'You\'re in ' + inAppName + '\'s browser — it can\'t install paype.cc as an app.',
            inst: 'Tap <strong>⋮</strong> → <strong>Open in Chrome</strong> (or your default browser)',
          });
        }, 1400);
      } else {
        showOverlay({
          title: 'Open in Safari',
          body: 'You\'re in ' + inAppName + '\'s browser — it can\'t install paype.cc as an app.',
          inst: 'Tap <strong>⋯</strong> or <strong>↗ Share</strong> → <strong>Open in Safari</strong>',
        });
      }
      return;
    }

    // ③ Android — non-Chrome (Brave, Samsung, Firefox, Opera, Edge, DDG, UC, …)
    if (isAndroid && (!isChromeAndroid || isBraveMobile)) {
      // Intent targeting Chrome specifically; fallback URL opens default browser if Chrome absent
      var chromeIntent = 'intent://' + ACCOUNT_URL.replace(/^https?:\/\//, '') +
        '#Intent;scheme=https;' +
        'package=com.android.chrome;' +
        'S.browser_fallback_url=' + encodeURIComponent(ACCOUNT_URL) + ';end';
      window.location.href = chromeIntent;
      setTimeout(function () {
        showOverlay({
          title: 'Open in Chrome',
          body: 'paype.cc needs Chrome to install as a home-screen app and work offline. Your current browser doesn\'t support this.',
          inst: 'Tap <strong>⋮</strong> → <strong>Open in Chrome</strong>, or paste the link in Chrome.',
        });
      }, 1400);
      return;
    }

    // ④ iOS — non-Safari (Chrome for iOS, Firefox iOS, Edge iOS, DDG, …)
    if (isIOS && !isSafariIOS) {
      showOverlay({
        title: 'Open in Safari',
        body: 'paype.cc needs Safari to install as a home-screen app on iPhone. Other iOS browsers can\'t do this.',
        inst: 'Tap <strong>↗ Share</strong> → <strong>Open in Safari</strong>, or copy the link and paste it in Safari.',
      });
      return;
    }

    // ⑤ Correct browser (Chrome on Android, Safari on iOS) — go
    window.location.href = ACCOUNT_URL;
  }

  // ── Overlay (shared by all scenarios) ─────────────────────────
  function showOverlay(opts) {
    if (document.getElementById('paype-breakout')) return;

    var el = document.createElement('div');
    el.id = 'paype-breakout';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML =
      '<div class="pb-bd" aria-hidden="true"></div>' +
      '<div class="pb-card">' +
      '  <p class="pb-logo">PAYPE<span>.cc</span></p>' +
      '  <p class="pb-title">' + opts.title + '</p>' +
      '  <p class="pb-body">' + opts.body + '</p>' +
      '  <p class="pb-inst">' + opts.inst + '</p>' +
      '  <button class="pb-copy" data-url="' + ACCOUNT_URL + '">Copy link</button>' +
      '  <button class="pb-dismiss">Dismiss</button>' +
      '</div>';

    document.body.appendChild(el);
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
      var text = ACCOUNT_URL;
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
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-open-account]');
    if (!el) return;
    openAccount(e);
  });

  // ── Overlay styles ────────────────────────────────────────────
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
  var s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);

})();
