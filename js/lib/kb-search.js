/**
 * Knowledge Base — client-side unified search.
 * Filters glossary terms, FAQ items, guide cards, doc sections, and blog posts
 * as the user types. Works on /knowledge/ and /knowledge/glossary/ pages.
 */
(function(){
  'use strict';

  var searchInput = document.getElementById('kbSearch') || document.getElementById('glossarySearch');
  if (!searchInput) return;

  // Items to search: [element, searchText, type]
  function gatherItems() {
    var items = [];

    // Glossary term entries
    document.querySelectorAll('.glossary-term-entry').forEach(function(el){
      var text = (el.textContent || '').toLowerCase();
      items.push({ el: el, text: text, type: 'glossary' });
    });

    // FAQ items
    document.querySelectorAll('.faq-item').forEach(function(el){
      var text = (el.textContent || '').toLowerCase();
      items.push({ el: el, text: text, type: 'faq' });
    });

    // Feature grid cards (guides, docs, blog)
    document.querySelectorAll('.card-feature, .doc-item').forEach(function(el){
      var text = (el.textContent || '').toLowerCase();
      items.push({ el: el, text: text, type: 'card' });
    });

    return items;
  }

  var allItems = gatherItems();

  searchInput.addEventListener('input', function(){
    var q = this.value.toLowerCase().trim();

    if (!q) {
      // Show all, remove highlights
      allItems.forEach(function(item){ item.el.style.display = ''; });
      // Hide "no results" if present
      var nr = document.getElementById('kbNoResults');
      if (nr) nr.style.display = 'none';
      return;
    }

    var visibleCount = 0;
    var tokens = q.split(/\s+/);

    allItems.forEach(function(item){
      var match = tokens.every(function(t){ return item.text.indexOf(t) !== -1; });
      if (match) {
        item.el.style.display = '';
        visibleCount++;
      } else {
        item.el.style.display = 'none';
      }
    });

    // Show/hide parent sections
    document.querySelectorAll('.faq-list').forEach(function(list){
      var anyVisible = list.querySelectorAll('.faq-item[style*="display:"]').length < list.querySelectorAll('.faq-item').length;
      // If all hidden, hide the parent heading too
      var heading = list.previousElementSibling;
      if (heading && heading.tagName === 'H2') {
        var allHidden = list.querySelectorAll('.faq-item').length > 0 &&
          Array.from(list.querySelectorAll('.faq-item')).every(function(it){ return it.style.display === 'none'; });
        heading.style.display = allHidden ? 'none' : '';
      }
    });

    // No results message
    var nr = document.getElementById('kbNoResults');
    if (!nr) {
      nr = document.createElement('p');
      nr.id = 'kbNoResults';
      nr.style.cssText = 'text-align:center;padding:32px;color:var(--color-text-muted);font-size:1.1rem';
      nr.textContent = 'No results found. Try a different search.';
      searchInput.parentNode.appendChild(nr);
    }
    nr.style.display = visibleCount === 0 ? '' : 'none';
  });
})();
