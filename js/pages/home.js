/* ═══════════════════════════════════════════════════════════════
   PAYPE.CC — HOME PAGE JAVASCRIPT
   Scroll reveal, parallax, hero card tilt, referral copy, sticky CTA
   ═══════════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Referral copy-to-clipboard
    var copyBtn = document.getElementById('copyRef');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            var el = document.getElementById('refLink');
            var text = el ? el.textContent : 'paype.cc/r/sailor';
            if (navigator.clipboard) navigator.clipboard.writeText(text);
            var orig = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(function() { copyBtn.textContent = orig; }, 1400);
        });
    }

    // Sticky CTA body class on mobile
    if (window.matchMedia('(max-width:680px)').matches) {
        document.body.classList.add('has-sticky');
    }

    // Skip animations if reduced motion
    if (reduce) return;

    // Scroll reveal
    var srEls = document.querySelectorAll('.sr');
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function(entries) {
            entries.forEach(function(e) {
                if (e.isIntersecting) {
                    e.target.classList.add('in');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
        srEls.forEach(function(el) { io.observe(el); });
    } else {
        srEls.forEach(function(el) { el.classList.add('in'); });
    }

    // Parallax
    var pEls = [].slice.call(document.querySelectorAll('.parallax'));
    var ticking = false;

    function px() {
        var vh = window.innerHeight;
        pEls.forEach(function(el) {
            var speed = parseFloat(el.getAttribute('data-speed')) || 0;
            var rect = el.getBoundingClientRect();
            var dist = (rect.top + rect.height / 2) - vh / 2;
            el.style.transform = 'translate3d(0,' + (dist * speed).toFixed(1) + 'px,0)';
        });
        ticking = false;
    }

    function rq() {
        if (!ticking) { ticking = true; requestAnimationFrame(px); }
    }

    window.addEventListener('scroll', rq, { passive: true });
    window.addEventListener('resize', rq);
    px();

    // Hero card mouse tilt
    var card = document.getElementById('heroCard');
    var vis = card ? card.closest('.hero-visual') : null;
    if (card && vis && window.matchMedia('(pointer:fine)').matches) {
        vis.addEventListener('mousemove', function(e) {
            var r = vis.getBoundingClientRect();
            var x = (e.clientX - r.left) / r.width - 0.5;
            var y = (e.clientY - r.top) / r.height - 0.5;
            card.style.setProperty('--ry', (-8 + x * 16).toFixed(2) + 'deg');
            card.style.setProperty('--rx', (y * -12).toFixed(2) + 'deg');
        });
        vis.addEventListener('mouseleave', function() {
            card.style.setProperty('--ry', '-8deg');
            card.style.setProperty('--rx', '0deg');
        });
    }
})();
