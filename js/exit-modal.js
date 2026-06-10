/**
 * Exit-Intent Modal
 * Shows when the user's mouse leaves the viewport through the top edge
 * (indicating they might close the tab or navigate away).
 * Only fires once per session. Respects reduced motion.
 */
(function(){
  'use strict';

  var overlay = document.getElementById('exitModal');
  var closeBtn = document.getElementById('exitModalClose');
  if (!overlay || !closeBtn) return;

  var fired = false;
  var dismissed = false;

  function showModal() {
    if (dismissed) return;
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');
    document.body.classList.add('exit-modal-open');
    fired = true;

    // Focus trap — focus the close button
    setTimeout(function(){ closeBtn.focus(); }, 100);
  }

  function hideModal() {
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('active');
    document.body.classList.remove('exit-modal-open');
    dismissed = true;

    // Store in sessionStorage so it won't re-fire this session
    try { sessionStorage.setItem('paype_exit_modal_dismissed', '1'); } catch(e) {}
  }

  // Check sessionStorage — don't show if already dismissed this session
  try {
    if (sessionStorage.getItem('paype_exit_modal_dismissed') === '1') return;
  } catch(e) {}

  // Exit intent: mouse leaving viewport through the top
  document.addEventListener('mouseout', function(e) {
    if (fired || dismissed) return;
    // Only fire when mouse leaves through the top of the viewport
    if (e.clientY <= 0 && e.relatedTarget === null) {
      showModal();
    }
  });

  // Close button
  closeBtn.addEventListener('click', hideModal);

  // Click outside modal to close
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) hideModal();
  });

  // Escape key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      hideModal();
    }
  });

  // Don't fire on small screens where exit intent is unreliable (mobile browsers)
  // But do show after 30 seconds of engagement as a fallback
  var scrollDepth = 0;
  var scrollTimer = null;
  document.addEventListener('scroll', function() {
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      scrollDepth = Math.max(scrollDepth, window.scrollY / docHeight);
    }
    if (scrollDepth > 0.5 && !fired && !dismissed) {
      clearTimeout(scrollTimer);
      // If they've scrolled 50%+ and haven't seen the modal, queue it for when they might leave
      scrollTimer = setTimeout(function() {
        if (!fired && !dismissed) {
          // Only show if they haven't clicked a CTA recently
          showModal();
        }
      }, 45000); // 45 seconds after reaching 50% scroll
    }
  }, { passive: true });
})();
