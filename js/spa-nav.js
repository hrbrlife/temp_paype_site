/**
 * paype.cc SPA Navigation — smooth page transitions without full reload.
 * Cache-busts assets via content hash, intercepts internal links,
 * fetches new pages and swaps <main> content with a fade transition.
 * Pure vanilla JS, no framework. ~2KB.
 */
(function(){
  'use strict';

  var CACHE_VERSION = '{{CACHE_VERSION}}';
  var mainEl = document.getElementById('main-content');
  if (!mainEl) return;

  // Derive site base path from Hugo-injected meta (e.g. '/temp_paype_site/' on GH Pages, '/' on production)
  var siteBasePath = '/';
  try {
    var _bm = document.querySelector('meta[name="paype-base-url"]');
    if (_bm) { siteBasePath = new URL(_bm.content).pathname || '/'; }
    if (!siteBasePath.endsWith('/')) siteBasePath += '/';
  } catch(e) {}

  // ── Prefetch on hover ──────────────────────────────────────
  var prefetched = {};
  document.addEventListener('mouseover', function(e){
    var a = e.target.closest('a');
    if (!a || !isInternal(a.href)) return;
    var url = a.href;
    if (prefetched[url]) return;
    prefetched[url] = fetch(url).then(function(r){ return r.text(); }).catch(function(){});
  }, {passive: true});

  document.addEventListener('touchstart', function(e){
    var a = e.target.closest('a');
    if (!a || !isInternal(a.href)) return;
    var url = a.href;
    if (prefetched[url]) return;
    prefetched[url] = fetch(url).then(function(r){ return r.text(); }).catch(function(){});
  }, {passive: true});

  // ── Click interception ─────────────────────────────────────
  document.addEventListener('click', function(e){
    var a = e.target.closest('a');
    if (!a) return;

    // Skip: external links, new-tab, download, mailto, tel, javascript, hash-only
    var href = a.getAttribute('href');
    if (!href) return;
    if (!isInternal(href)) return;
    if (a.target === '_blank') return;
    if (a.hasAttribute('download')) return;
    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) return; // user wants new tab

    // Skip: buttons styled as links (they have their own JS handlers)
    if (a.closest('.btn-nav') || a.closest('.claire-chat-fab') || a.getAttribute('role') === 'button') return;

    e.preventDefault();
    navigateTo(href);
  });

  // ── Back/forward ───────────────────────────────────────────
  window.addEventListener('popstate', function(e){
    if (e.state && e.state.html) {
      restorePage(e.state);
    } else {
      // Fallback: full reload for pages not in history
      window.location.reload();
    }
  });

  // ── Core navigation ────────────────────────────────────────
  function navigateTo(url) {
    // Show transition overlay
    mainEl.style.transition = 'opacity 0.15s ease';
    mainEl.style.opacity = '0';

    // Check prefetch cache
    var promise = prefetched[url] || fetch(url).then(function(r){ return r.text(); });

    promise.then(function(html){
      // Parse new page
      var doc = parseHTML(html);
      updatePage(doc, url);
      prefetched[url] = null; // clear cache
    }).catch(function(){
      // Fallback: full navigation on error
      window.location.href = url;
    });
  }

  function updatePage(doc, url) {
    // Update title
    var newTitle = doc.querySelector('title');
    if (newTitle) document.title = newTitle.textContent;

    // Update meta description
    var newMeta = doc.querySelector('meta[name="description"]');
    if (newMeta) {
      var existing = document.querySelector('meta[name="description"]');
      if (existing) existing.setAttribute('content', newMeta.getAttribute('content'));
    }

    // Update canonical
    var newCanonical = doc.querySelector('link[rel="canonical"]');
    if (newCanonical) {
      var existing = document.querySelector('link[rel="canonical"]');
      if (existing) existing.setAttribute('href', newCanonical.getAttribute('href'));
    }

    // Extract main content
    var newMain = doc.querySelector('#main-content');
    if (!newMain) { window.location.href = url; return; }

    // Load any new page-specific CSS
    var newStyles = doc.querySelectorAll('link[rel="stylesheet"]');
    newStyles.forEach(function(link){
      var href = link.getAttribute('href');
      if (href && !document.querySelector('link[rel="stylesheet"][href="'+href+'"]')) {
        var clone = document.createElement('link');
        clone.rel = 'stylesheet';
        clone.href = href;
        document.head.appendChild(clone);
      }
    });

    // Swap main content
    setTimeout(function(){
      mainEl.innerHTML = newMain.innerHTML;
      mainEl.style.opacity = '1';

      // Scroll to top after page swap
      window.scrollTo(0, 0);

      // Update nav language links + active states for new URL
      updateNavAfterSPA(url);

      // Execute any new page scripts (deferred)
      var scripts = newMain.querySelectorAll('script');
      scripts.forEach(function(s){
        if (s.src) {
          // Only load new scripts not already loaded
          if (!document.querySelector('script[src="'+s.src+'"]')) {
            var script = document.createElement('script');
            script.src = s.src;
            script.defer = true;
            document.body.appendChild(script);
          }
        } else if (s.textContent) {
          // Execute inline scripts
          try { (new Function(s.textContent))(); } catch(e){}
        }
      });

      // Dispatch event for components to re-initialize
      window.dispatchEvent(new CustomEvent('paype:pagechange', {detail: {url: url}}));
    }, 180);

    // Push state
    var state = {url: url, html: mainEl.innerHTML, title: document.title};
    try { history.pushState(state, '', url); } catch(e){}
  }

  function restorePage(state) {
    document.title = state.title;
    mainEl.style.opacity = '0';
    setTimeout(function(){
      mainEl.innerHTML = state.html;
      mainEl.style.opacity = '1';
      window.scrollTo(0, 0);
      updateNavAfterSPA(state.url);
      window.dispatchEvent(new CustomEvent('paype:pagechange', {detail: {url: state.url}}));
    }, 150);
  }

  function updateNavAfterSPA(url) {
    var knownLangs = ['de', 'es', 'fr', 'pt', 'ru', 'zh'];
    var fullPath = url.replace(/^https?:\/\/[^/]+/, '');

    // Strip site base path (e.g. '/temp_paype_site/') to get lang-relative path
    var sitePath = fullPath;
    if (siteBasePath.length > 1 && fullPath.startsWith(siteBasePath)) {
      sitePath = '/' + fullPath.slice(siteBasePath.length); // e.g. '/pt/cards/'
    }

    var pagePath = sitePath; // page path within language, e.g. '/cards/'
    var currentLang = 'en';

    for (var i = 0; i < knownLangs.length; i++) {
      var pfx = '/' + knownLangs[i] + '/';
      if (sitePath === '/' + knownLangs[i]) {
        currentLang = knownLangs[i]; pagePath = '/'; break;
      }
      if (sitePath.startsWith(pfx)) {
        currentLang = knownLangs[i];
        pagePath = sitePath.slice(pfx.length - 1); // '/cards/'
        break;
      }
    }

    // Update lang switcher hrefs + active
    var langItems = document.querySelectorAll('.nav-lang-item');
    langItems.forEach(function(item) {
      var lang = item.getAttribute('data-lang');
      // EN: /temp_paype_site/ + cards/   Other: /temp_paype_site/ + pt + /cards/
      var newHref = lang === 'en'
        ? siteBasePath + pagePath.slice(1)
        : siteBasePath + lang + pagePath;
      item.setAttribute('href', newHref);
      item.classList.toggle('active', lang === currentLang);
    });
    var langLabel = document.querySelector('.nav-lang-label');
    if (langLabel) langLabel.textContent = currentLang;

    // Update nav link active states
    var navAs = document.querySelectorAll('.nav-links > a, .nav-dropdown-menu a');
    navAs.forEach(function(a) {
      var href = a.getAttribute('href');
      if (!href) return;
      a.classList.remove('active');
      if (a.classList.contains('nav-home-icon')) {
        a.classList.toggle('active', pagePath === '/');
      } else if (href && href !== siteBasePath && href !== '/' && fullPath.indexOf(href) !== -1) {
        a.classList.add('active');
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────
  function isInternal(href) {
    if (!href) return false;
    if (href.startsWith('http')) {
      return href.indexOf(window.location.origin) === 0;
    }
    return href.startsWith('/') && !href.startsWith('//');
  }

  function parseHTML(html) {
    var parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  // ── Cache busting ──────────────────────────────────────────
  // Auto-version CSS/JS based on build time (injected by Hugo)
  if (CACHE_VERSION && CACHE_VERSION !== '{{CACHE_VERSION}}') {
    // Cache version is already baked into script URLs by Hugo
    // This module just signals readiness
  }

  // ── Signal ready ───────────────────────────────────────────
  window.__paypeSPA = { ready: true, navigateTo: navigateTo };

})();
