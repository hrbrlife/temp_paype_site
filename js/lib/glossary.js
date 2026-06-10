/**
 * PAYPE.CC GLOSSARY TOOLTIPS
 * Detects <span class="glossary-term" data-term="xxx"> in page content,
 * shows tooltip on hover/click with term name, category, short definition,
 * and "Read full →" link. First-occurrence-only per page.
 * Mobile: tap to open, tap again or scroll to close.
 */
(function(){
  'use strict';

  let tooltipEl = null;
  let hideTimeout = null;
  const seenTerms = new Set();
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Embedded glossary — mirrors /knowledge/glossary/
  const glossaryData = {
    "ach": { term: "ACH", shortDefinition: "Automated Clearing House — the US electronic bank-to-bank payment network. Free on paype, both directions.", category: "Payments" },
    "aml": { term: "AML", shortDefinition: "Anti-Money Laundering — laws and procedures to prevent criminals disguising illegal funds. paype runs continuous AML screening.", category: "Compliance" },
    "bsa": { term: "BSA (Bank Secrecy Act)", shortDefinition: "The primary US anti-money laundering law requiring financial institutions to maintain compliance programs and file reports.", category: "Compliance" },
    "cryptographic-audit-trail": { term: "Cryptographic Audit Trail", shortDefinition: "A tamper-evident record of every action on your account. Every entry carries a signature verifiable by anyone with your public key.", category: "Security" },
    "fincen": { term: "FinCEN", shortDefinition: "Financial Crimes Enforcement Network — US Treasury bureau that regulates Money Services Businesses. paype.cc is FinCEN-registered.", category: "Compliance" },
    "kyc": { term: "KYC / KYB", shortDefinition: "Know Your Customer / Know Your Business — identity verification required at account opening. Photo ID + selfie, automated in-app.", category: "Compliance" },
    "melusina": { term: "Melusina", shortDefinition: "The open-source financial infrastructure powering paype.cc — multi-party custody, cryptographic signing, and compliance engine.", category: "Technology" },
    "msb": { term: "MSB (Money Services Business)", shortDefinition: "A financial service provider regulated by FinCEN under the Bank Secrecy Act. NOT a bank — not FDIC-insured.", category: "Compliance" },
    "ofac": { term: "OFAC", shortDefinition: "Office of Foreign Assets Control — US Treasury agency administering economic sanctions. paype screens all transactions in real time.", category: "Compliance" },
    "payment-request": { term: "Payment Request", shortDefinition: "A hosted payment link you share — the recipient pays by card, bank, or crypto without a paype account.", category: "Features" },
    "sepa": { term: "SEPA", shortDefinition: "Single Euro Payments Area — EU-wide network for euro transfers. On paype: $3 + 0.21% on Orchestra.", category: "Payments" },
    "segregated-accounts": { term: "Segregated Accounts", shortDefinition: "Your funds held separate from paype's operating money. paype's business finances cannot touch your balance.", category: "Security" },
    "swift": { term: "SWIFT", shortDefinition: "Global messaging network for international bank transfers. On paype: $15 + 0.45% on Orchestra to 170+ countries.", category: "Payments" },
    "tokenization": { term: "Tokenization", shortDefinition: "Replacing your real card number with device-specific tokens. Apple Pay / Google Pay generate unique tokens per transaction.", category: "Security" },
    "ubo": { term: "UBO (Ultimate Beneficial Owner)", shortDefinition: "Each person holding 25%+ of a business. Must be verified with photo ID and proof of address for business accounts.", category: "Compliance" },
    "orchestra": { term: "Orchestra", shortDefinition: "paype's top volume tier — 40% off all fees after $1,000 in yearly fees. Automatic. No sales call, no contract.", category: "Pricing" },
    "big-band": { term: "Big Band", shortDefinition: "paype's mid volume tier — 25% off all fees after $500 in monthly fees. Resets monthly, triggers automatically.", category: "Pricing" },
    "melody": { term: "Melody", shortDefinition: "paype's default tier — everyone starts here. Standard rates. No qualifier, no fees to unlock.", category: "Pricing" },
    "sub-accounts": { term: "Sub-Accounts", shortDefinition: "Separate wallets inside your paype account — each with its own balance, card, spending limits, and assigned users. Unlimited.", category: "Features" },
    "payment-rails": { term: "Payment Rails", shortDefinition: "The underlying networks that move money — ACH, SWIFT, SEPA, card networks, and blockchain. paype connects all of them.", category: "Payments" }
  };

  function init() {
    createTooltip();
    enhanceTerms();
    setupListeners();
  }

  function createTooltip() {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'glossary-tooltip';
    tooltipEl.setAttribute('aria-hidden', 'true');
    tooltipEl.innerHTML = `
      <div class="glossary-tooltip-inner">
        <div class="glossary-tooltip-head">
          <span class="glossary-tooltip-term"></span>
          <span class="glossary-tooltip-cat"></span>
        </div>
        <p class="glossary-tooltip-def"></p>
        <a href="#" class="glossary-tooltip-cta">Read full definition →</a>
      </div>`;
    document.body.appendChild(tooltipEl);
  }

  function enhanceTerms() {
    const terms = document.querySelectorAll('.glossary-term[data-term]');
    terms.forEach(function(el) {
      const key = el.getAttribute('data-term');
      if (seenTerms.has(key)) {
        el.classList.remove('glossary-term');
        el.removeAttribute('data-term');
        return;
      }
      seenTerms.add(key);
    });
  }

  function setupListeners() {
    document.addEventListener('mouseenter', function(e) {
      const term = e.target.closest('.glossary-term');
      if (!term || isTouch) return;
      clearTimeout(hideTimeout);
      showTooltip(term);
    }, true);

    document.addEventListener('mouseleave', function(e) {
      const term = e.target.closest('.glossary-term');
      if (!term || isTouch) return;
      hideTimeout = setTimeout(hideTooltip, 200);
    }, true);

    document.addEventListener('click', function(e) {
      const term = e.target.closest('.glossary-term');
      if (!term) { hideTooltip(); return; }
      if (e.target.tagName === 'A') return;
      e.preventDefault();
      if (tooltipEl.style.opacity === '1') {
        hideTooltip();
      } else {
        showTooltip(term);
      }
    }, true);

    tooltipEl.addEventListener('mouseenter', function() { clearTimeout(hideTimeout); });
    tooltipEl.addEventListener('mouseleave', function() { hideTooltip(); });

    window.addEventListener('scroll', function() { hideTooltip(); }, { passive: true });
    window.addEventListener('resize', function() { hideTooltip(); }, { passive: true });
  }

  function showTooltip(el) {
    const key = el.getAttribute('data-term');
    const data = glossaryData[key];
    if (!data) return;

    tooltipEl.querySelector('.glossary-tooltip-term').textContent = data.term;
    tooltipEl.querySelector('.glossary-tooltip-cat').textContent = data.category;
    tooltipEl.querySelector('.glossary-tooltip-def').textContent = data.shortDefinition;
    tooltipEl.querySelector('.glossary-tooltip-cta').href = '/knowledge/glossary/#' + key;
    tooltipEl.setAttribute('aria-hidden', 'false');

    positionTooltip(el);
    tooltipEl.style.opacity = '1';
  }

  function hideTooltip() {
    tooltipEl.style.opacity = '0';
    tooltipEl.setAttribute('aria-hidden', 'true');
  }

  function positionTooltip(el) {
    const rect = el.getBoundingClientRect();
    const ttRect = tooltipEl.getBoundingClientRect();
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Prefer above
    let top = rect.top - ttRect.height - margin + window.scrollY;
    let arrowBelow = true;
    if (top < margin + window.scrollY) {
      // Flip below
      top = rect.bottom + margin + window.scrollY;
      arrowBelow = false;
    }
    // Clamp to viewport
    if (top + ttRect.height > vh + window.scrollY - margin) {
      top = vh - ttRect.height - margin + window.scrollY;
    }

    let left = rect.left + rect.width / 2 - ttRect.width / 2;
    if (left < margin) left = margin;
    if (left + ttRect.width > vw - margin) left = vw - ttRect.width - margin;

    tooltipEl.style.top = top + 'px';
    tooltipEl.style.left = left + 'px';
    tooltipEl.classList.toggle('arrow-below', arrowBelow);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
