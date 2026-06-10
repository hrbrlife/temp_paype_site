/**
 * paype.cc — Open Account routing  (PWA-first)
 *
 * Decision tree (evaluated in order):
 *
 *  ① Desktop / standalone PWA     →  same-tab navigate to ACCOUNT_URL
 *
 *  ② In-app browser (any platform)
 *     Android                     →  intent:// (no package) + overlay fallback
 *     iOS                         →  overlay "Open in Safari / Chrome"
 *
 *  ③ Android — wrong browser
 *     (Samsung, Brave, Firefox, Opera, DDG, UC, YaBrowser, …)
 *                                  →  intent targeting com.android.chrome + overlay
 *     ALLOWED: Chrome, Edge        →  navigate
 *
 *  ④ iOS — any real browser
 *     (Safari, Chrome iOS, Edge iOS, Firefox iOS, DDG iOS, …)
 *                                  →  navigate  ✓
 *     iOS 16.4+: all real browsers support Add to Home Screen via Share sheet.
 *     Only in-app WebViews (case ②) can't install — those are blocked above.
 *     No programmatic redirect to Safari possible or needed.
 *
 * Brave on Android spoofs Chrome UA completely.
 * Detected via: navigator.brave (async) + navigator.userAgentData.brands (Client Hints).
 * Both are started at page load so the flag is ready before any tap.
 *
 * Promo/coupon codes:
 *   ?UPGRADECODEC3B589           — valueless single param  (key IS the code)
 *   ?code=UPGRADECODEC3B589      — named param
 *   ?promo=X  ?ref=X  ?coupon=X — aliases
 *   Code is stored in localStorage (survives tab-close, multi-page browsing).
 *   URL is silently cleaned via history.replaceState immediately after extraction.
 *   On Open Account → re-injected as ?code=X on the destination URL.
 *
 * All [data-open-account] elements handled via event delegation (dynamic-safe).
 *
 * Research sources (2024-2025):
 *   - beforeinstallprompt: Chrome ✓, Edge ✓, Samsung (broken v27) ✗, Brave (shortcut only) ✗
 *   - iOS PWA install from non-Safari: supported since iOS 16.4 via Share sheet
 *   - intent:// must originate from a user gesture (click), not a timer
 *   - Brave issue #40858 closed "not planned" — shortcut, not true PWA
 */
(function () {
  'use strict';

  var ACCOUNT_URL = 'https://pay.paype.cc';
  var PROMO_KEY   = 'paype_promo';

  // ── Promo code extraction & URL cleaning ──────────────────────
  // Runs once at page load. Supports:
  //   ?MYCODE          → valueless param; the key itself is the code
  //   ?code=MYCODE     → canonical named param
  //   ?promo/ref/coupon=MYCODE → aliases
  // After extraction the query string is stripped from the visible URL.
  (function extractPromo() {
    var search = window.location.search;
    if (!search || search.length < 3) return;

    var params;
    try { params = new URLSearchParams(search); } catch (e) { return; }

    var code = params.get('code') || params.get('promo') ||
               params.get('ref') || params.get('coupon');

    // Valueless single-param style: ?UPGRADECODEC3B589
    if (!code) {
      var entries = [];
      params.forEach(function (v, k) { entries.push([k, v]); });
      if (entries.length === 1 && entries[0][1] === '') {
        code = entries[0][0];
      }
    }

    if (!code) return;

    try { localStorage.setItem(PROMO_KEY, code); } catch (e) { /* private-mode */ }

    // Strip query string from URL bar without reloading
    var clean = window.location.pathname + (window.location.hash || '');
    try { history.replaceState(null, '', clean); } catch (e) { /* old browser */ }
  })();

  // Returns the destination URL, appending ?code=X if a promo is stored.
  function getAccountURL() {
    var code;
    try { code = localStorage.getItem(PROMO_KEY); } catch (e) { code = null; }
    if (code) return ACCOUNT_URL + '?code=' + encodeURIComponent(code);
    return ACCOUNT_URL;
  }
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
  // Generic Android WebView: 'wv' token (absent from standalone browsers)
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

  // ── Android browser classification ────────────────────────────
  // Check order matters: Samsung contains Chrome/, Edge contains Chrome/, etc.
  // so we must identify them before falling through to the generic Chrome check.
  //
  // PWA-capable (true beforeinstallprompt + app-drawer install):
  //   Chrome ✓  |  Edge ✓
  // Broken / shortcut-only / not supported:
  //   Samsung Internet (v27+ beforeinstallprompt broken, WebAPKs flagged by Play Protect)
  //   Firefox (no beforeinstallprompt, no app drawer)
  //   Opera (beforeinstallprompt unreliable)
  //   DuckDuckGo (shortcut only)
  //   UC Browser (no PWA)
  //   Yandex Browser (no PWA)
  //   Brave (shortcut only — issue #40858 closed "not planned")

  var isEdgeAndroid    = isAndroid && /EdgA\//i.test(ua);
  var isChromeAndroid  = isAndroid && !isEdgeAndroid && !isInApp &&
    /Chrome\/\d/.test(ua) &&
    !/SamsungBrowser|OPR\/|Firefox|DuckDuckGo|UCBrowser|YaBrowser/i.test(ua);
  // Note: Brave passes the isChromeAndroid test above — corrected async below.

  // ── Brave detection (two methods, both async-safe) ────────────
  // Method 1: navigator.brave.isBrave() — official Brave API, returns Promise.
  // Method 2: navigator.userAgentData.brands — Client Hints, Brave exposes "Brave" brand.
  // We start both at page load; by the time the user taps a button, the flag is set.
  var isBraveMobile = false;
  if (isMobile && !isInApp) {
    // Method 1
    if (window.navigator.brave) {
      try {
        var p = window.navigator.brave.isBrave();
        if (p && typeof p.then === 'function') {
          p.then(function (v) { if (v) isBraveMobile = true; }).catch(function () { isBraveMobile = true; });
        } else {
          isBraveMobile = true;
        }
      } catch (e) { isBraveMobile = true; }
    }
    // Method 2 (Client Hints — synchronous, Chromium only)
    if (!isBraveMobile && navigator.userAgentData && navigator.userAgentData.brands) {
      isBraveMobile = navigator.userAgentData.brands.some(function (b) {
        return b.brand === 'Brave';
      });
    }
  }

  // ── PWA-capable on Android ─────────────────────────────────────
  // Returns true at click time (after async Brave check has had time to resolve).
  function isPWACapableAndroid() {
    return (isChromeAndroid || isEdgeAndroid) && !isBraveMobile;
  }

  // Expose detection state for debugging / other modules
  window.__paypeDevice = {
    ua: ua,
    isIOS: isIOS, isAndroid: isAndroid, isMobile: isMobile,
    isStandalone: isStandalone,
    isInApp: isInApp, inAppName: inAppName, inAppSignals: IA,
    isChromeAndroid: isChromeAndroid, isEdgeAndroid: isEdgeAndroid,
    get isBrave() { return isBraveMobile; },
    get accountURL() { return getAccountURL(); }
  };

  // ── Core handler ──────────────────────────────────────────────
  function openAccount(e) {
    e.preventDefault();

    // ① Desktop or running as installed PWA — navigate directly
    if (!isMobile || isStandalone) {
      window.location.href = getAccountURL();
      return;
    }

    // ② In-app browser — must break out; can't install from here
    if (isInApp) {
      if (isAndroid) {
        // No package specified: Android picks the default browser
        intentTo(null, function () {
          showOverlay({
            title: 'Open in Chrome',
            body: 'You\'re in ' + inAppName + '\'s browser — it can\'t install the paype.cc app.',
            inst: 'Tap <strong>⋮</strong> → <strong>Open in Chrome</strong> (or your default browser)',
          });
        });
      } else {
        // iOS — no programmatic breakout; show instructions
        showOverlay({
          title: 'Open in your browser',
          body: 'You\'re in ' + inAppName + '\'s browser — it can\'t install the paype.cc app.',
          inst: 'Tap <strong>⋯</strong> or <strong>↗ Share</strong> → <strong>Open in Safari</strong> (or Chrome)',
        });
      }
      return;
    }

    // ③ Android — non-PWA-capable browser
    //   (Samsung, Brave, Firefox, Opera, DDG, UC, Yandex, unknown Chromium forks, …)
    if (isAndroid && !isPWACapableAndroid()) {
      intentTo('com.android.chrome', function () {
        showOverlay({
          title: 'Open in Chrome',
          body: 'paype.cc needs Chrome (or Edge) to install as a home-screen app. Your current browser doesn\'t support this.',
          inst: 'Tap <strong>⋮</strong> → <strong>Open in Chrome</strong>, or copy the link and paste it in Chrome.',
        });
      });
      return;
    }

    // ④ iOS real browser (Safari, Chrome iOS, Edge iOS, Firefox iOS, DDG, …)
    //    iOS 16.4+: all real browsers support Add to Home Screen via Share sheet.
    //    No redirect needed — navigate directly.
    if (isIOS) {
      window.location.href = getAccountURL();
      return;
    }

    // ⑤ Chrome / Edge on Android — navigate
    window.location.href = getAccountURL();
  }

  // ── Intent helper ─────────────────────────────────────────────
  // pkg: Android package name (string) or null for default browser.
  // fallback: called after 1.4s if the intent was not handled.
  // MUST be called from a user-gesture handler (click) — Chrome blocks intent:// otherwise.
  function intentTo(pkg, fallback) {
    var dest = getAccountURL();
    var base = dest.replace(/^https?:\/\//, '');
    var intent = 'intent://' + base + '#Intent;scheme=https;' +
      (pkg ? 'package=' + pkg + ';' : '') +
      'S.browser_fallback_url=' + encodeURIComponent(dest) + ';end';
    window.location.href = intent;
    setTimeout(fallback, 1400);
  }

  // ── Overlay ────────────────────────────────────────────────────
  function showOverlay(opts) {
    if (document.getElementById('paype-breakout')) return;

    var dest = getAccountURL();
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
      '  <button class="pb-copy" data-url="' + dest + '">Copy link</button>' +
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
      var done = function () { btn.textContent = '✓ Copied!'; };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(dest).then(done).catch(function () { fallbackCopy(dest); done(); });
      } else { fallbackCopy(dest); done(); }
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

  // ── Event delegation (static + dynamic elements) ──────────────
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
