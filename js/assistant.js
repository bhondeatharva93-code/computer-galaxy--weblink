/* ==========================================================================
   Store assistant: the chat window
   Draws the chat button and window, keeps the conversation for the browser
   session, and asks PCS.brain (js/assistant-brain.js) for each answer.
   Nothing leaves the browser unless you set PCS.config.assistant.endpoint,
   and even then it is only used for questions the built-in brain cannot answer.
   Turn it off with PCS.config.assistant.enabled = false in js/config.js.
   ========================================================================== */
(function (PCS) {
  'use strict';

  const cfg = (PCS.config && PCS.config.assistant) || {};
  if (cfg.enabled === false || !PCS.brain || !PCS.store) return;

  const esc = PCS.util.esc, money = PCS.util.money, icon = PCS.icon, brain = PCS.brain;
  const KEY = 'pcs.chat';
  const MAX_KEPT = 40;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fine = () => !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
  const phone = () => !!(window.matchMedia && window.matchMedia('(max-width: 640px)').matches);

  /* ---------- Saved conversation (this browser tab only) ---------- */
  let S = { msgs: [], state: brain.initialState(), open: false };
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY));
    if (saved && Array.isArray(saved.msgs)) S = { msgs: saved.msgs, state: Object.assign(brain.initialState(), saved.state || {}), open: !!saved.open };
  } catch (e) { /* private mode or blocked storage: the chat still works, it just forgets on the next page */ }
  function save() {
    try { sessionStorage.setItem(KEY, JSON.stringify({ msgs: S.msgs.slice(-MAX_KEPT), state: S.state, open: S.open })); } catch (e) { /* ignore */ }
  }
  let busy = false;

  /* ---------- Where the shopper is ---------- */
  function env() {
    const page = document.body.dataset.page || '';
    const id = page === 'product' ? PCS.util.params().get('id') || '' : '';
    return { page: page, pageProductId: PCS.byId[id] ? id : '' };
  }
  function greeting() {
    const e = env(), p = e.pageProductId ? PCS.byId[e.pageProductId] : null;
    const text = (cfg.greeting || 'Hi, how can I help?') + (p ? '\n\nYou are looking at the ' + p.name + '. Ask me about it, or for something cheaper or more powerful.' : '');
    return { who: 'bot', m: { text: text, cards: [], after: '', chips: brain.startChips(e), actions: [], conf: 'high' } };
  }
  function resetLog() { S.msgs = [greeting()]; }
  if (!S.msgs.some(m => m.who === 'me')) resetLog();            // nothing asked yet, so the greeting can follow the page

  /* ---------- Turning a message into HTML ---------- */
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  function fmt(text) {                                           // **bold**, "- " bullets and blank-line paragraphs only
    const out = [];
    let list = [];
    const flush = () => { if (list.length) { out.push('<ul>' + list.join('') + '</ul>'); list = []; } };
    String(text || '').split('\n').forEach(line => {
      if (/^- /.test(line)) list.push('<li>' + inline(line.slice(2)) + '</li>');
      else { flush(); if (line.trim()) out.push('<p>' + inline(line) + '</p>'); }
    });
    flush();
    return out.join('');
  }

  function cardHtml(c) {
    const p = PCS.byId[c.id];
    if (!p) return '';
    const use = p.use ? PCS.useById[p.use] : null, off = PCS.discount(p);
    const href = 'product.html?id=' + encodeURIComponent(p.id);
    const thumb = p.cat === 'prebuilt' ? PCS.tower((use || PCS.uses[0]).hue) : icon(PCS.catById[p.cat].icon, 32);
    return '<article class="ca-card">' +
      '<span class="ca-thumb' + (p.cat === 'prebuilt' ? ' ca-thumb--pc' : '') + '"' + (use ? ' style="--hue:' + use.hue + '"' : '') + ' aria-hidden="true">' + thumb + '</span>' +
      '<div class="ca-card__body">' +
        (c.note ? '<span class="ca-note">' + esc(c.note) + '</span>' : '') +
        '<a class="ca-card__name" href="' + href + '">' + esc(p.name) + '</a>' +
        '<p class="ca-price"><strong>' + money(p.price) + '</strong>' + (p.mrp > p.price ? '<s>' + money(p.mrp) + '</s>' : '') + (off >= 5 ? '<span>' + off + '% off</span>' : '') + '</p>' +
        '<div class="ca-card__btns">' +
          (p.stock !== false ? '<button class="btn btn--sm" type="button" data-add="' + esc(p.id) + '">Add to cart</button>' : '<span class="ca-out">Out of stock</span>') +
          '<a class="ca-link" href="' + href + '">Details</a>' +
        '</div>' +
      '</div></article>';
  }

  const actionHtml = a => '<a class="ca-act" href="' + esc(a.href) + '"' + (a.external ? ' target="_blank" rel="noopener"' : '') + '>' + esc(a.label) + '</a>';

  function msgHtml(entry, withChips) {
    if (entry.who === 'me') return '<div class="ca-msg ca-msg--me"><div class="ca-bubble">' + esc(entry.text) + '</div></div>';
    const m = entry.m || {};
    return '<div class="ca-msg ca-msg--bot"><div class="ca-bubble">' + fmt(m.text) + '</div>' +
      (m.cards && m.cards.length ? '<div class="ca-cards">' + m.cards.map(cardHtml).join('') + '</div>' : '') +
      (m.after ? '<div class="ca-after">' + fmt(m.after) + '</div>' : '') +
      (m.actions && m.actions.length ? '<div class="ca-actions">' + m.actions.map(actionHtml).join('') + '</div>' : '') +
      (withChips && m.chips && m.chips.length ? '<div class="ca-chips">' + m.chips.map(c => '<button class="ca-chip" type="button" data-chip="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>' : '') +
      '</div>';
  }

  /* ---------- The window ---------- */
  const name = esc(cfg.name || 'Store assistant');
  const root = document.createElement('div');
  root.className = 'ca';
  root.innerHTML =
    '<button class="ca-launch" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="ca-panel">' +
      icon('chat', 22) + '<span class="ca-launch__text">Help me choose</span></button>' +
    '<section class="ca-panel" id="ca-panel" role="dialog" aria-labelledby="ca-title" hidden>' +
      '<header class="ca-head">' +
        '<div class="ca-head__title"><strong id="ca-title">' + name + '</strong><span>' + (cfg.endpoint ? 'Automated assistant. Some answers use an AI model.' : 'Automated assistant, not a person') + '</span></div>' +
        '<button class="ca-icon" type="button" data-ca="reset" aria-label="Start a new chat">' + icon('reset', 20) + '</button>' +
        '<button class="ca-icon" type="button" data-ca="close" aria-label="Close the assistant">' + icon('x', 22) + '</button>' +
      '</header>' +
      '<div class="ca-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation"></div>' +
      '<form class="ca-form" autocomplete="off">' +
        '<label class="ca-sr" for="ca-input">Your message</label>' +
        '<input id="ca-input" type="text" maxlength="300" placeholder="Ask about PCs, parts or EMI" enterkeyhint="send">' +
        '<button class="ca-send" type="submit" aria-label="Send message"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 3 3 10.5l7 3 3 7L21 3Z"/><path d="m10 13.5 4.5-4.5"/></svg></button>' +
      '</form>' +
    '</section>';
  document.body.appendChild(root);

  const launch = root.querySelector('.ca-launch'), panel = root.querySelector('.ca-panel');
  const log = root.querySelector('.ca-log'), form = root.querySelector('.ca-form'), input = root.querySelector('#ca-input');

  function draw() {
    const lastBot = S.msgs.reduce((n, m, i) => (m.who === 'bot' ? i : n), -1);
    log.innerHTML = S.msgs.map((m, i) => msgHtml(m, i === lastBot)).join('');
    log.scrollTop = log.scrollHeight;
  }
  function stripChips() { log.querySelectorAll('.ca-chips').forEach(n => n.remove()); }
  function append(entry) {
    log.insertAdjacentHTML('beforeend', msgHtml(entry, entry.who === 'bot'));
    const node = log.lastElementChild;
    if (entry.who === 'bot') log.scrollTop = Math.max(0, node.offsetTop - 10);   // start of the answer, so a long one is read from the top
    else log.scrollTop = log.scrollHeight;
    return node;
  }

  function open(focus) {
    S.open = true;
    panel.hidden = false;
    launch.setAttribute('aria-expanded', 'true');
    document.body.classList.add('ca-lock');
    if (!log.childElementCount) draw();
    if (focus !== false) input.focus({ preventScroll: true });
    save();
  }
  function close() {
    S.open = false;
    panel.hidden = true;
    launch.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('ca-lock');
    save();
  }
  function reset() {
    S = { msgs: [], state: brain.initialState(), open: true };
    resetLog();
    draw();
    save();
    input.focus({ preventScroll: true });
  }

  /* ---------- Asking ---------- */
  function history() {
    return S.msgs.slice(-8).map(m => (m.who === 'me' ? { role: 'user', content: m.text } : { role: 'assistant', content: String((m.m && m.m.text) || '').slice(0, 600) }));
  }
  async function askServer() {                                   // optional: your own server in front of a hosted AI model
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 12000);
    try {
      const e = env();
      const res = await fetch(cfg.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
        body: JSON.stringify({ messages: history(), page: e.page, productId: e.pageProductId })
      });
      if (!res.ok) throw new Error('status ' + res.status);
      const d = await res.json();
      if (!d || typeof d.reply !== 'string' || !d.reply.trim()) throw new Error('empty reply');
      const ids = (Array.isArray(d.products) ? d.products : []).filter(id => PCS.byId[id]).slice(0, 3);
      return { text: d.reply.slice(0, 1500), cards: ids.map(id => ({ id: id, note: '' })), after: '', chips: brain.startChips(env()).slice(0, 3), actions: [], conf: 'high' };
    } finally { clearTimeout(timer); }
  }

  async function send(raw) {
    const text = String(raw || '').trim().slice(0, 300);
    if (!text || busy) return;
    busy = true;
    const me = { who: 'me', text: text };
    S.msgs.push(me);
    stripChips();
    append(me);
    input.value = '';
    const dots = document.createElement('div');
    dots.className = 'ca-msg ca-msg--bot';
    dots.innerHTML = '<span class="ca-typing" aria-hidden="true"><i></i><i></i><i></i></span>';
    log.appendChild(dots);
    log.scrollTop = log.scrollHeight;

    let bot, remote = false;
    try {
      const r = brain.reply(text, S.state, env());
      S.state = r.state;
      bot = r.message;
      if (r.conf === 'low' && cfg.endpoint) {
        try { bot = await askServer(); remote = true; } catch (err) { /* keep the built-in answer */ }
      }
    } catch (err) {
      bot = { text: 'Sorry, something went wrong on my side. Please try again, or ask the team on WhatsApp.', cards: [], after: '', chips: brain.startChips(env()), actions: brain.contactActions(S.state), conf: 'low' };
    }
    if (!remote && !PCS.util.prefersReducedMotion()) await wait(380);
    dots.remove();
    const entry = { who: 'bot', m: bot };
    S.msgs.push(entry);
    append(entry);
    busy = false;
    save();
  }

  /* Add to cart from a product card in the chat. The page's own handler would show a pop-up over the chat, so the confirmation is a chat message instead. */
  function addToCart(id) {
    const p = PCS.byId[id];
    if (!p || !PCS.store.cart.add(id, 1)) return;
    S.state.focusId = id;
    const n = PCS.store.cart.count();
    const more = p.cat === 'prebuilt' ? ['Show UPS options', 'Show monitors'] : (p.cat === 'gpu' || p.cat === 'cpu') ? ['Which power supply for this?'] : [];
    stripChips();
    const entry = { who: 'bot', m: {
      text: 'Added the **' + p.name + '** to your cart. You have ' + n + (n === 1 ? ' item' : ' items') + ', ' + money(PCS.store.cart.subtotal()) + ' before shipping.',
      cards: [], after: '', conf: 'high',
      actions: [{ label: 'Go to your cart', href: 'cart.html' }],
      chips: ['EMI on my cart', 'Delivery charges'].concat(more).slice(0, 4)
    } };
    S.msgs.push(entry);
    append(entry);
    save();
  }

  /* ---------- Events ---------- */
  launch.addEventListener('click', () => (S.open ? close() : open()));
  form.addEventListener('submit', e => { e.preventDefault(); send(input.value); });
  panel.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    if (add) { e.stopPropagation(); addToCart(add.dataset.add); return; }
    const chip = e.target.closest('[data-chip]');
    if (chip) { send(chip.dataset.chip); if (fine()) input.focus({ preventScroll: true }); return; }
    const btn = e.target.closest('[data-ca]');
    if (!btn) return;
    if (btn.dataset.ca === 'close') { close(); launch.focus(); }
    if (btn.dataset.ca === 'reset') reset();
  });
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && S.open) { close(); launch.focus(); } });

  if (S.open && !phone()) open(false);                           // keep it open across pages on a computer, but never cover a phone screen on arrival
  else if (S.open) { S.open = false; save(); }

  document.addEventListener('click', e => { if (e.target.closest('[data-ask-ai]')) { e.preventDefault(); open(); } });   // the Ask AI button in the header

  PCS.assistant = { open: open, close: close, ask: send, reset: reset };
})(window.PCS);
