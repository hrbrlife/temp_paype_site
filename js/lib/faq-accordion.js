/**
 * FAQ Accordion — independent multi-open behavior.
 * Opening one item does NOT close others.
 * Items with class "featured" show a star marker but do NOT auto-expand.
 * Keyboard accessible with proper ARIA attributes.
 */
(function(){
  var items = document.querySelectorAll('.faq-q');
  if (!items.length) return;

  // Add star marker to featured items (visual only, no auto-expand)
  items.forEach(function(btn){
    var parent = btn.closest('.faq-item');
    if (parent && parent.classList.contains('featured')) {
      if (!btn.querySelector('.faq-star')) {
        var star = document.createElement('span');
        star.className = 'faq-star';
        star.innerHTML = '★ ';
        star.setAttribute('aria-hidden', 'true');
        btn.insertBefore(star, btn.firstChild);
      }
    }
  });

  // Independent accordion: click opens/closes only the clicked item
  items.forEach(function(btn){
    btn.addEventListener('click', function(){
      var expanded = this.getAttribute('aria-expanded') === 'true';
      var answerId = this.getAttribute('aria-controls');
      var answer = document.getElementById(answerId);

      if (expanded) {
        this.setAttribute('aria-expanded', 'false');
        if (answer) answer.classList.remove('open');
      } else {
        this.setAttribute('aria-expanded', 'true');
        if (answer) answer.classList.add('open');
      }
    });

    // Keyboard: Enter/Space to toggle
    btn.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
})();
