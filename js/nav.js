/* ═══════════════════════════════════════════════════════════════
   PAYPE.CC — NAVIGATION JAVASCRIPT
   Mobile nav toggle, scroll behavior
   ═══════════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    var nav = document.getElementById('nav');
    var navToggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');
    var navCloseBtn = document.getElementById('navCloseBtn');

    if (!nav || !navToggle || !navLinks) return;

    function closeMenu() {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
    }

    function openMenu() {
        navLinks.classList.add('active');
        navToggle.classList.add('active');
        navToggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('nav-open');
    }

    // Scroll behavior
    function onScroll() {
        nav.classList.toggle('scrolled', window.scrollY > 24);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile toggle
    navToggle.addEventListener('click', function() {
        navLinks.classList.contains('active') ? closeMenu() : openMenu();
    });

    // Close button inside menu
    if (navCloseBtn) {
        navCloseBtn.addEventListener('click', closeMenu);
    }

    // Close on link click (inside menu)
    navLinks.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            closeMenu();
        }
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            navLinks.classList.remove('active');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            closeAllDropdowns();
        }
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
        if (!(e.target instanceof Element)) return;
        if (!e.target.closest('.nav-links') && !e.target.closest('.nav-toggle')) {
            navLinks.classList.remove('active');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            closeAllDropdowns();
        }
    });

    // Dropdown toggle — click to open/close (needed for mobile/touch where hover doesn't work)
    var dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');
    dropdownToggles.forEach(function(toggle) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var expanded = this.getAttribute('aria-expanded') === 'true';
            closeAllDropdowns();
            if (!expanded) {
                this.setAttribute('aria-expanded', 'true');
                var menu = this.nextElementSibling;
                if (menu) menu.style.display = 'block';
            }
        });
    });

    function closeAllDropdowns() {
        dropdownToggles.forEach(function(t) {
            t.setAttribute('aria-expanded', 'false');
            var m = t.nextElementSibling;
            if (m) m.style.display = '';
        });
    }

    // Language switcher toggle
    var langBtn = document.querySelector('.nav-lang-btn');
    if (langBtn) {
        langBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });
        // Close lang menu on outside click
        document.addEventListener('click', function(e) {
            if (!(e.target instanceof Element)) return;
            if (!e.target.closest('.nav-lang-switcher')) {
                langBtn.setAttribute('aria-expanded', 'false');
            }
        });
        // Lang item click — navigate to the real translated URL
        var langItems = document.querySelectorAll('.nav-lang-item');
        langItems.forEach(function(item) {
            item.addEventListener('click', function(e) {
                var href = this.getAttribute('href');
                langItems.forEach(function(i) { i.classList.remove('active'); });
                this.classList.add('active');
                var lang = this.getAttribute('data-lang');
                document.querySelector('.nav-lang-label').textContent = lang;
                langBtn.setAttribute('aria-expanded', 'false');
                // Navigate to the translated page if it has a real URL
                if (href && href !== '#') {
                    window.location.href = href;
                }
                e.preventDefault();
            });
        });
    }
})();
