/**
 * Claire Chat — AI Office assistant floating widget.
 * Rule-based with graceful fallback to human contact.
 * Styled to BROADSHEET design system.
 */
(function(){
  'use strict';

  var fab = document.getElementById('claireChatFab');
  var mobileBtn = document.getElementById('claireMobileBtn');
  var panel = document.getElementById('claireChatPanel');
  var close = document.getElementById('claireChatClose');
  var widget = document.getElementById('claireChat');
  var input = document.getElementById('claireChatInput');
  var send = document.getElementById('claireChatSend');
  var messages = document.getElementById('claireChatMessages');
  var suggestions = document.getElementById('claireChatSuggestions');
  if (!fab || !panel || !widget) return;

  var open = false;

  // ── Toggle ────────────────────────────────────────────────
  function openChat() {
    open = true;
    widget.setAttribute('aria-hidden', 'false');
    widget.classList.add('open');
    // Lock body scroll on mobile when full-screen
    if (window.innerWidth <= 500) {
      document.body.style.overflow = 'hidden';
    }
    setTimeout(function(){ input.focus(); }, 300);
  }

  function closeChat() {
    open = false;
    widget.setAttribute('aria-hidden', 'true');
    widget.classList.remove('open');
    document.body.style.overflow = '';
  }

  fab.addEventListener('click', function() {
    open ? closeChat() : openChat();
  });

  // Mobile bottom bar Claire button
  if (mobileBtn) {
    mobileBtn.addEventListener('click', function() {
      open ? closeChat() : openChat();
    });
  }

  close.addEventListener('click', closeChat);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && open) { closeChat(); fab.focus(); }
  });

  // ── Knowledge base ─────────────────────────────────────────
  var KB = [
    {
      qs: ['who can open', 'eligibility', 'who can', 'countries', 'supported countries', 'where'],
      a: 'Accounts are open to <strong>companies worldwide</strong> and <strong>Montana, US residents</strong>. Global individuals (except Canada, NZ, Australia, EU) can also open personal accounts. CA/NZ/AU/EU companies are welcome; individuals in those countries are coming soon. <a href="/compliance/">See full eligibility →</a>'
    },
    {
      qs: ['fees', 'pricing', 'cost', 'how much', 'fee schedule', 'rates'],
      a: 'Everyone starts on <strong>Melody</strong> (standard rates). Spend $500+/month in fees → auto-upgrade to <strong>Big Band</strong> (25% off). Spend $1,000+/year → auto-upgrade to <strong>Orchestra</strong> (40% off). No sales call, no contract. P2P is free on all tiers. SWIFT from $15 + 0.45% on Orchestra. <a href="/pricing/">Full fee schedule →</a>'
    },
    {
      qs: ['client pay', 'get paid', 'receive money', 'payment request', 'invoice', 'clients pay'],
      a: 'Create a <strong>payment request</strong> in the app and share a hosted link. Your client opens it and pays by card, bank transfer, or crypto — <strong>no paype account required</strong> on their end. Funds land in your balance. Works for both personal and business accounts. <a href="/how-it-works/">How it works →</a>'
    },
    {
      qs: ['introducer', 'referral', 'refer', 'commission', 'earn', 'affiliate'],
      a: 'The <strong>Introducer Programme</strong> pays <strong>10%</strong> on fees from businesses you introduce directly, plus <strong>5%</strong> on fees from businesses <em>they</em> introduce. Two levels, no cap, platform-funded (not deducted from anyone\'s balance). Open to anyone outside the EU/EEA. <a href="/refer/">Learn more →</a>'
    },
    {
      qs: ['kyc', 'verify', 'id', 'identity', 'document', 'open account', 'sign up', 'onboarding'],
      a: 'Download the app, snap your government-issued ID and a selfie. Automated KYC — most accounts verified in <strong>minutes</strong>. It\'s free and you only do it once. Your verified identity travels with you across paype services. <a href="https://my.paype.cc/shared/_HWhUqMR9r7ZGO75Gd9HUcEbj9DZbOvaoco7JhQ_bpU" data-open-account>Open your account →</a>'
    },
    {
      qs: ['crypto', 'bitcoin', 'btc', 'eth', 'usdt', 'usdc', 'stablecoin', 'swap'],
      a: 'Buy, sell, and swap <strong>BTC, ETH, USDT, USDC</strong> — then settle straight to your USD balance. Instant swaps from 0.30% on Orchestra (0.50% on Melody). Spot buy/sell from 0.12% on Orchestra. Network fees pass through at cost. <a href="/crypto/">Crypto details →</a>'
    },
    {
      qs: ['card', 'apple pay', 'google pay', 'spend', 'physical card', 'virtual card'],
      a: 'Your <strong>virtual card</strong> is ready the moment your account is active — add to Apple Pay or Google Pay in seconds. First card free. Additional virtual cards $1/month. Physical card $15 one-time. No paype fee on card spend. <a href="/cards/">Cards page →</a>'
    },
    {
      qs: ['sub-account', 'subaccounts', 'wallet', 'multiple accounts', 'separate'],
      a: 'Create <strong>unlimited sub-accounts</strong> — each with its own balance, card(s), spending limits, and user permissions. Run operating funds, reserves, client escrow, and per-project wallets inside one paype account. <a href="/business/">Business accounts →</a>'
    },
    {
      qs: ['fdic', 'insured', 'safe', 'insurance', 'bank', 'deposit'],
      a: 'paype.cc is an <strong>MSB, not a bank</strong> — balances are not FDIC-insured. Your funds are held in <strong>segregated accounts</strong> separate from paype\'s operating money. Every transaction is cryptographically signed. <a href="/legal/sailor-beware/">Read the risk disclosure →</a>'
    },
    {
      qs: ['business', 'company', 'business account', 'team'],
      a: 'Business accounts are <strong>free to open</strong> — same fee schedule as personal. Three roles: Client (full access), Client Assistant (drafts), Client View-Only (read-only). Unlimited sub-accounts, accounting export, cryptographic audit trail. Companies registered anywhere in the world. <a href="/business/">For business →</a>'
    },
    {
      qs: ['swift', 'sepa', 'international', 'wire', 'transfer', 'bank transfer'],
      a: '<strong>SWIFT</strong> — 170+ countries, $15 + 0.45% on Orchestra ($25 + 0.75% on Melody). <strong>SEPA</strong> — EUR to EU banks, $3 + 0.21% on Orchestra. All fees shown before you confirm. <a href="/methods/">All methods →</a>'
    },
    {
      qs: ['contact', 'support', 'help', 'human', 'email', 'telegram'],
      a: 'Fastest: <a href="https://t.me/paype">Telegram @paype</a> for real-time chat. <a href="/company/contact/">Contact form</a> for async inquiries. <a href="https://wa.me/paype">WhatsApp</a> during business hours. Email: <a href="mailto:hello@paype.cc">hello@paype.cc</a>. Or just ask me — I can help with most questions!'
    }
  ];

  // ── Message rendering ──────────────────────────────────────
  function addMessage(text, isUser) {
    var div = document.createElement('div');
    div.className = 'claire-msg ' + (isUser ? 'claire-msg-from-user' : 'claire-msg-from-bot');
    var bubble = document.createElement('div');
    bubble.className = 'claire-bubble';
    bubble.innerHTML = '<p>' + text + '</p>';
    div.appendChild(bubble);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTyping() {
    var div = document.createElement('div');
    div.className = 'claire-msg claire-msg-from-bot claire-typing';
    div.innerHTML = '<div class="claire-bubble"><span class="claire-dot"></span><span class="claire-dot"></span><span class="claire-dot"></span></div>';
    div.id = 'claireTyping';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    var el = document.getElementById('claireTyping');
    if (el) el.remove();
  }

  // ── Matching ───────────────────────────────────────────────
  function findAnswer(query) {
    var q = query.toLowerCase().trim();
    var best = null;
    var bestScore = 0;
    KB.forEach(function(entry) {
      entry.qs.forEach(function(keyword) {
        if (q.includes(keyword)) {
          var score = keyword.length;
          if (score > bestScore) { bestScore = score; best = entry; }
        }
      });
    });
    return best;
  }

  function getFallback() {
    return 'Good question! I don\'t have a perfect answer for that yet — but I\'m learning. Reach the human team on <a href="https://t.me/paype">Telegram @paype</a>, via our <a href="/company/contact/">contact form</a>, or check the <a href="/knowledge/">Knowledge Base</a>.';
  }

  // ── Send ───────────────────────────────────────────────────
  function sendMessage(text) {
    if (!text || !text.trim()) return;
    text = text.trim();
    addMessage(text, true);
    if (suggestions) suggestions.style.display = 'none';
    input.value = '';
    input.disabled = true;
    send.disabled = true;

    addTyping();

    setTimeout(function() {
      removeTyping();
      var entry = findAnswer(text);
      addMessage(entry ? entry.a : getFallback(), false);
      input.disabled = false;
      send.disabled = false;
      input.focus();
    }, 800 + Math.random() * 600);
  }

  send.addEventListener('click', function() { sendMessage(input.value); });
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { sendMessage(input.value); }
  });

  // ── Suggestions ────────────────────────────────────────────
  if (suggestions) {
    suggestions.addEventListener('click', function(e) {
      var btn = e.target.closest('.claire-suggestion');
      if (btn) { sendMessage(btn.getAttribute('data-q')); }
    });
  }

  // ── Show after 25s ─────────────────────────────────────────
  setTimeout(function() {
    fab.classList.add('visible');
  }, 25000);

  // Show immediately if they've scrolled halfway
  var scrollShown = false;
  window.addEventListener('scroll', function() {
    if (scrollShown) return;
    var pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    if (pct > 0.4) { fab.classList.add('visible'); scrollShown = true; }
  }, { passive: true });
})();
