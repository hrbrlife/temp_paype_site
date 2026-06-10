/**
 * PAYPE.CC GLOSSARY TOOLTIPS
 *
 * Annotates <span class="glossary-term" data-term="slug"> in page content.
 * First occurrence per term per page only.
 * Desktop: inline floating tooltip on hover.
 * Mobile (< 600px): slide-up bottom sheet on tap.
 */
(function () {
  'use strict';

  var tooltipEl = null;
  var backdropEl = null;
  var hideTimer = null;
  var activeEl = null;
  var seen = {};

  var MOBILE_BP = 600;
  function isMobile() { return window.innerWidth < MOBILE_BP; }

  var data = {
    'ach':                       { term: 'ACH',                       def: 'The US electronic bank-to-bank payment network. Free on paype, both directions. Settles in 1–2 business days.' },
    'aml':                       { term: 'AML',                       def: 'Anti-Money Laundering — laws preventing dirty money entering the financial system. paype runs continuous screening.' },
    'bsa':                       { term: 'BSA',                       def: 'Bank Secrecy Act — the US law requiring financial institutions to maintain AML compliance programs.' },
    'cryptographic-audit-trail': { term: 'Cryptographic Audit Trail', def: 'A tamper-evident record of every action on your account. Every entry carries a verifiable cryptographic signature.' },
    'fincen':                    { term: 'FinCEN',                    def: 'Financial Crimes Enforcement Network — US Treasury bureau that regulates Money Services Businesses. paype is FinCEN-registered.' },
    'kyc':                       { term: 'KYC / KYB',                 def: 'Know Your Customer / Know Your Business — identity verification at account opening. Photo ID + selfie, automated in-app.', slug: 'kyc-kyb' },
    'kyc-kyb':                   { term: 'KYC / KYB',                 def: 'Know Your Customer / Know Your Business — identity verification at account opening. Photo ID + selfie, automated in-app.' },
    'melusina':                  { term: 'Melusina',                  def: 'The open-source infrastructure powering paype.cc — multi-party custody, cryptographic signing, and compliance engine.' },
    'msb':                       { term: 'MSB',                       def: 'Money Services Business — a FinCEN-regulated financial service provider. paype is an MSB, not a bank.' },
    'ofac':                      { term: 'OFAC',                      def: 'Office of Foreign Assets Control — the US Treasury agency administering sanctions. paype screens all transactions in real time.' },
    'payment-request':           { term: 'Payment Request',           def: 'A hosted payment link you share — the recipient pays by card, bank, or crypto. No paype account needed on their end.' },
    'payment-rails':             { term: 'Payment Rails',             def: 'The networks that move money: ACH, SWIFT, SEPA, card networks, blockchain. paype connects all of them.' },
    'sepa':                      { term: 'SEPA',                      def: 'Single Euro Payments Area — the EU-wide euro payment network. On paype: from $3 + 0.21% on Orchestra.' },
    'segregated-accounts':       { term: 'Segregated Accounts',       def: 'Your funds held separately from paype\'s operating money. paype\'s business finances cannot touch your balance.' },
    'sub-accounts':              { term: 'Sub-Accounts',              def: 'Separate wallets inside your paype account — each with its own balance, card, and spending limits. Unlimited.' },
    'swift':                     { term: 'SWIFT',                     def: 'Global bank messaging network for international transfers. On paype: from $15 + 0.45% on Orchestra, to 170+ countries.' },
    'tokenization':              { term: 'Tokenization',              def: 'Replacing your real card number with device-specific tokens for Apple Pay / Google Pay. Merchants never see your actual number.' },
    'ubo':                       { term: 'UBO',                       def: 'Ultimate Beneficial Owner — each person holding 25%+ of a business. Must be verified with photo ID at account opening.' },
    'orchestra':                 { term: 'Orchestra',                 def: 'paype\'s highest volume tier — 40% off all fees after $1,000 in yearly fees. Triggers automatically, no contract.' },
    'big-band':                  { term: 'Big Band',                  def: 'paype\'s mid-volume tier — 25% off all fees when you hit $500 in monthly fees. Resets monthly, no application.' },
    'melody':                    { term: 'Melody',                    def: 'paype\'s default tier — standard rates, no qualifier needed. Every account starts here.' }
  };

  /* ── DOM SETUP ──────────────────────────────────────────── */

  function build() {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'glossary-tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    tooltipEl.setAttribute('aria-hidden', 'true');
    tooltipEl.innerHTML =
      '<div class="glossary-tooltip-inner">' +
        '<span class="glossary-tooltip-term"></span>' +
        '<p class="glossary-tooltip-def"></p>' +
        '<a class="glossary-tooltip-cta" href="#">Full definition →</a>' +
      '</div>';
    document.body.appendChild(tooltipEl);

    backdropEl = document.createElement('div');
    backdropEl.className = 'glossary-backdrop';
    backdropEl.addEventListener('click', hide);
    document.body.appendChild(backdropEl);
  }

  /* ── FIRST-OCCURRENCE MARKING ───────────────────────────── */

  function mark() {
    document.querySelectorAll('.glossary-term[data-term]').forEach(function (el) {
      var key = el.getAttribute('data-term');
      if (seen[key]) {
        el.classList.remove('glossary-term');
        el.removeAttribute('data-term');
      } else {
        seen[key] = true;
      }
    });
  }

  /* ── SHOW / HIDE ────────────────────────────────────────── */

  function show(el) {
    var key = el.getAttribute('data-term');
    var d = data[key];
    if (!d) return;

    activeEl = el;
    var slug = d.slug || key;

    tooltipEl.querySelector('.glossary-tooltip-term').textContent = d.term;
    tooltipEl.querySelector('.glossary-tooltip-def').textContent = d.def;
    tooltipEl.querySelector('.glossary-tooltip-cta').href = '/knowledge/glossary/' + slug + '/';
    tooltipEl.setAttribute('aria-hidden', 'false');

    if (isMobile()) {
      showSheet();
    } else {
      closeMobileSheet(true);
      position(el);
    }
  }

  function hide() {
    activeEl = null;
    if (isMobile()) {
      closeMobileSheet();
    } else {
      tooltipEl.style.opacity = '0';
      tooltipEl.style.pointerEvents = 'none';
    }
    tooltipEl.setAttribute('aria-hidden', 'true');
  }

  function showSheet() {
    tooltipEl.classList.add('is-mobile');
    backdropEl.classList.add('is-visible');
    // Next frame so CSS transition fires
    requestAnimationFrame(function () {
      tooltipEl.classList.add('is-open');
    });
  }

  function closeMobileSheet(skipClass) {
    tooltipEl.classList.remove('is-open');
    backdropEl.classList.remove('is-visible');
    if (!skipClass) {
      // Remove is-mobile after transition so opacity doesn't interfere on desktop
      setTimeout(function () {
        tooltipEl.classList.remove('is-mobile');
      }, 260);
    }
  }

  /* ── DESKTOP POSITIONING ────────────────────────────────── */

  function position(el) {
    // Measure with opacity hidden
    tooltipEl.style.opacity = '0';
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.top = '0px';
    tooltipEl.style.left = '0px';

    var elRect = el.getBoundingClientRect();
    var ttRect = tooltipEl.getBoundingClientRect();
    var margin = 10;
    var vw = window.innerWidth;
    var scrollY = window.scrollY || window.pageYOffset;

    // Prefer above
    var top = elRect.top + scrollY - ttRect.height - margin;
    if (top < scrollY + margin) {
      top = elRect.bottom + scrollY + margin;
    }

    var left = elRect.left + elRect.width / 2 - ttRect.width / 2;
    if (left < margin) left = margin;
    if (left + ttRect.width > vw - margin) left = vw - ttRect.width - margin;

    tooltipEl.style.top = top + 'px';
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.opacity = '1';
    tooltipEl.style.pointerEvents = 'auto';
  }

  /* ── EVENT WIRING ───────────────────────────────────────── */

  function wire() {
    // Desktop hover — open
    document.addEventListener('mouseenter', function (e) {
      if (isMobile()) return;
      var term = e.target.closest && e.target.closest('.glossary-term');
      if (!term) return;
      clearTimeout(hideTimer);
      show(term);
    }, true);

    // Desktop hover — close with delay
    document.addEventListener('mouseleave', function (e) {
      if (isMobile()) return;
      var term = e.target.closest && e.target.closest('.glossary-term');
      if (!term) return;
      hideTimer = setTimeout(hide, 150);
    }, true);

    // Keep tooltip open when hovering it (desktop)
    tooltipEl.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
    tooltipEl.addEventListener('mouseleave', hide);

    // Click / tap
    document.addEventListener('click', function (e) {
      var term = e.target.closest && e.target.closest('.glossary-term');
      if (!term) {
        if (!isMobile()) hide();
        return;
      }
      if (e.target.tagName === 'A') return;
      e.preventDefault();
      if (activeEl === term && !isMobile()) {
        hide();
      } else {
        show(term);
      }
    }, true);

    // Dismiss on outside events (desktop)
    window.addEventListener('scroll', function () {
      if (!isMobile()) hide();
    }, { passive: true });

    window.addEventListener('resize', function () { hide(); }, { passive: true });
  }

  /* ── INIT ───────────────────────────────────────────────── */

  function init() {
    build();
    mark();
    wire();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
