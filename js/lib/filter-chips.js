/**
 * PAYPE.CC FILTER CHIPS
 *
 * Horizontal chip strip for filtering lists by category.
 * Works alongside kb-search.js — uses a CSS class (filtered-out)
 * so both search and category filter can be active simultaneously.
 *
 * Usage:
 *   <div class="filter-chips" data-target=".glossary-term-entry">
 *     <button class="filter-chip active" data-filter="all">All</button>
 *     <button class="filter-chip" data-filter="payments">Payments</button>
 *   </div>
 *
 * Items need: data-category="payments" (or whatever matches data-filter)
 */
(function () {
  'use strict';

  function init() {
    document.querySelectorAll('.filter-chips').forEach(function (chips) {
      var targetSel = chips.getAttribute('data-target') || '.glossary-term-entry';

      chips.querySelectorAll('.filter-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          // Deactivate all
          chips.querySelectorAll('.filter-chip').forEach(function (c) {
            c.classList.remove('active');
            c.setAttribute('aria-selected', 'false');
          });
          chip.classList.add('active');
          chip.setAttribute('aria-selected', 'true');

          var filter = chip.getAttribute('data-filter');

          // Apply to target items
          document.querySelectorAll(targetSel).forEach(function (item) {
            var cat = item.getAttribute('data-category') || '';
            if (filter === 'all' || cat === filter) {
              item.classList.remove('filtered-out');
            } else {
              item.classList.add('filtered-out');
            }
          });

          // Shallow URL update (no reload)
          try {
            var url = new URL(window.location.href);
            if (filter === 'all') {
              url.searchParams.delete('filter');
            } else {
              url.searchParams.set('filter', filter);
            }
            history.replaceState(null, '', url.toString());
          } catch (e) {}
        });
      });

      // Restore from URL on page load
      try {
        var urlFilter = new URL(window.location.href).searchParams.get('filter');
        if (urlFilter) {
          var chip = chips.querySelector('[data-filter="' + urlFilter + '"]');
          if (chip) chip.click();
        }
      } catch (e) {}
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
