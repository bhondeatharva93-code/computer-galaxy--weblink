/* Header, footer, product cards, toasts. Used by every page.
   Each page has <div id="site-header"></div> and <div id="site-footer"></div>,
   then calls PCS.ui.mount('page-name'). */
(function (PCS) {
  'use strict';
  const { $, $$, esc, money, el } = PCS.util;
  const cfg = PCS.config, store = PCS.store, icon = PCS.icon;

  const NAV = [
    { label: 'Prebuilt PCs', href: 'shop.html?cat=prebuilt' },
    { label: 'Custom build', href: 'build.html', page: 'build', hot: true },
    { label: 'Components', href: 'shop.html?group=parts' },
    { label: 'Peripherals', href: 'shop.html?group=gear' },
    { label: 'Office and security', href: 'shop.html?group=office' },
    { label: 'Deals', href: 'shop.html?sort=discount' },
    { label: 'Support', href: 'contact.html', page: 'contact' }
  ];

  /* The logo mark takes its colour from the text around it. */
  function logo() {
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="7" width="18" height="18" rx="3" fill="currentColor"/>' +
      '<rect x="12" y="12" width="8" height="8" rx="1.5" fill="#ffb400"/>' +
      '<path d="M11 3v4M16 3v4M21 3v4M11 25v4M16 25v4M21 25v4M3 11h4M3 16h4M3 21h4M25 11h4M25 16h4M25 21h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function headerHtml(page) {
    const links = NAV.map(n =>
      `<li><a href="${n.href}"${n.hot ? ' class="nav__hot"' : ''}${n.page === page ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('');
    return `
      <a class="skip" href="#main">Skip to content</a>
      <div class="ticker"><div class="wrap"><ul>${cfg.ticker.map(t => `<li>${icon('check', 16)}<span>${esc(t)}</span></li>`).join('')}</ul></div></div>
      <header class="hdr">
        <div class="wrap">
          <div class="hdr__row">
            <a class="brand" href="index.html" aria-label="${esc(cfg.name)} home">${logo()}<span>${esc(cfg.name)}</span></a>
            <form class="search" action="shop.html" method="get" role="search">
              <label class="sr" for="site-search">Search products</label>
              <input id="site-search" name="q" type="search" placeholder="Search PCs, parts and brands" autocomplete="off">
              <button type="submit" aria-label="Search">${icon('search', 20)}</button>
            </form>
            <div class="hdr__actions">
              ${PCS.config.assistant && PCS.config.assistant.enabled !== false ? `<button class="ask-ai" type="button" data-ask-ai>${icon('chat', 20)}<span>Ask AI</span></button>` : ''}
              <a class="icon-btn" href="shop.html?wish=1" aria-label="Wishlist">${icon('heart', 22)}<span class="badge" data-wish-count></span></a>
              <a class="icon-btn" href="cart.html" aria-label="Cart">${icon('cart', 22)}<span class="badge" data-cart-count></span></a>
              <button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu">${icon('menu', 24)}</button>
            </div>
          </div>
        </div>
        <nav class="nav" id="nav" aria-label="Main"><div class="wrap"><ul>${links}</ul></div></nav>
      </header>`;
  }

  function footerHtml() {
    const social = (cfg.social || []).map(s =>
      `<li><a href="${esc(s.url)}" aria-label="${esc(s.name)}" rel="noopener" target="_blank">${icon(s.icon, 20)}</a></li>`).join('');
    const wa = PCS.wa('Hi, I have a question.');
    return `
      <footer class="ftr">
        <div class="wrap">
          <div class="ftr__grid">
            <div>
              <a class="brand" href="index.html">${logo()}<span>${esc(cfg.name)}</span></a>
              <p>${esc(cfg.tagline)}</p>
              ${social ? `<ul class="ftr__social">${social}</ul>` : ''}
            </div>
            <div>
              <h3>Shop</h3>
              <ul>
                <li><a href="shop.html?cat=prebuilt">Prebuilt PCs</a></li>
                <li><a href="build.html">Custom build</a></li>
                <li><a href="shop.html?group=parts">Components</a></li>
                <li><a href="shop.html?group=gear">Peripherals</a></li>
                <li><a href="shop.html?group=office">Office and security</a></li>
                <li><a href="shop.html?sort=discount">Deals</a></li>
              </ul>
            </div>
            <div>
              <h3>Help</h3>
              <ul>
                <li><a href="contact.html">Contact and service requests</a></li>
                <li><a href="policies.html#shipping">Shipping</a></li>
                <li><a href="policies.html#returns">Returns and refunds</a></li>
                <li><a href="policies.html#warranty">Warranty</a></li>
                <li><a href="policies.html#privacy">Privacy</a></li>
                <li><a href="policies.html#terms">Terms</a></li>
              </ul>
            </div>
            <div>
              <h3>Visit or call</h3>
              <address>
                <span>${cfg.address.map(esc).join('<br>')}</span>
                <span>${esc(cfg.hours)}</span>
                <a href="tel:${esc(cfg.phoneTel)}">${esc(cfg.phone)}</a>
                <a href="${esc(wa)}" target="_blank" rel="noopener">Message on WhatsApp</a>
                <a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a>
                <a href="${esc(cfg.mapsUrl)}" target="_blank" rel="noopener">Get directions</a>
              </address>
            </div>
          </div>
          <div class="ftr__bar">
            <span>&copy; ${new Date().getFullYear()} ${esc(cfg.name)}</span>
            <span>Demo store. Products, prices and policies are samples.</span>
          </div>
        </div>
      </footer>`;
  }

  /* ---------- Product card ---------- */
  function emiLine(p) {
    if (p.price < 10000) return '';
    return `<p class="card__emi">EMI from ${money(PCS.util.emi(p.price, 12, cfg.emi.annualInterestPct))} a month</p>`;
  }

  function card(p) {
    const off = PCS.discount(p);
    const use = p.use ? PCS.useById[p.use] : null;
    const tags = [];
    if (off >= 5) tags.push(`<span class="tag">${off}% off</span>`);
    if (p.tags.includes('rgb')) tags.push('<span class="tag tag--rgb">RGB</span>');
    if (p.tags.includes('new')) tags.push('<span class="tag tag--ink">New</span>');
    if (!p.stock) tags.push('<span class="tag tag--out">Out of stock</span>');
    const wished = store.wish.has(p.id);
    const href = 'product.html?id=' + encodeURIComponent(p.id);
    return `
      <article class="card"${use ? ` data-use="${use.id}" style="--c:${use.hue}"` : ''}>
        <a class="card__art" href="${href}" tabindex="-1" aria-hidden="true">${PCS.art(p)}</a>
        <div class="card__tags">${tags.join('')}</div>
        <button class="wish" type="button" data-wish="${p.id}" aria-pressed="${wished}" aria-label="Save to wishlist: ${esc(p.name)}">${icon('heart', 20)}</button>
        <div class="card__body">
          <p class="card__brand">${use ? esc(use.label) + ' PC' : esc(p.brand)}</p>
          <h3 class="card__name"><a href="${href}">${esc(p.name)}</a></h3>
          <ul class="card__specs">${p.specs.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
          <div class="card__foot">
            <p class="price"><strong>${money(p.price)}</strong>${p.mrp > p.price ? `<s>${money(p.mrp)}</s>` : ''}</p>
            ${p.stock
              ? `<button class="btn btn--sm" type="button" data-add="${p.id}">Add to cart</button>`
              : '<button class="btn btn--sm" type="button" disabled>Out of stock</button>'}
          </div>
          ${emiLine(p)}
        </div>
      </article>`;
  }

  function toast(html) {
    let box = $('#toasts');
    if (!box) {
      box = el('<div class="toasts" id="toasts" role="status" aria-live="polite"></div>');
      document.body.appendChild(box);
    }
    const t = el(`<div class="toast">${html}</div>`);
    box.appendChild(t);
    setTimeout(() => t.remove(), 3800);
  }

  /* ---------- Live bits: cart count, wishlist hearts ---------- */
  function refresh() {
    $$('[data-cart-count]').forEach(b => { const n = store.cart.count(); b.textContent = n || ''; });
    $$('[data-wish-count]').forEach(b => { const n = store.wish.count(); b.textContent = n || ''; });
    $$('[data-wish]').forEach(b => b.setAttribute('aria-pressed', String(store.wish.has(b.dataset.wish))));
  }

  document.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    if (add) {
      const qty = Number(add.dataset.qty) || 1;
      if (store.cart.add(add.dataset.add, qty)) {
        toast(`${icon('check', 18)}<span>Added to cart: ${esc(PCS.byId[add.dataset.add].name)}</span><a href="cart.html">View cart</a>`);
      }
      return;
    }
    const w = e.target.closest('[data-wish]');
    if (w) {
      const on = store.wish.toggle(w.dataset.wish);
      toast(`${icon('heart', 18)}<span>${on ? 'Saved to your wishlist' : 'Removed from your wishlist'}</span>`);
    }
  });

  /* title is the page name, e.g. "Cart". The home page passes none. */
  function mount(page, title) {
    document.body.dataset.page = page || '';
    document.title = title ? title + ' | ' + cfg.name : cfg.name + ' | ' + cfg.tagline;
    const head = $('#site-header'), foot = $('#site-footer');
    if (head) head.outerHTML = headerHtml(page);
    if (foot) foot.outerHTML = footerHtml();

    const btn = $('.menu-btn'), nav = $('#nav');
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    const q = PCS.util.params().get('q');
    if (q) $('#site-search').value = q;

    store.on(refresh);
    refresh();
  }

  PCS.ui = { mount, card, toast, refresh, emiLine };
})(window.PCS);
