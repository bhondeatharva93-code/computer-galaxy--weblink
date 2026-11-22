/* Home page: PC finder, category list, best sellers, deals, EMI calculator, FAQ. */
(function (PCS) {
  'use strict';
  const { $, $$, esc, money, short, emi } = PCS.util;
  const cfg = PCS.config, icon = PCS.icon, ui = PCS.ui, store = PCS.store;

  ui.mount('home');
  const monthly = price => emi(price, 12, cfg.emi.annualInterestPct);

  /* ---------- Hero copy ---------- */
  $('#proof').innerHTML = [
    'Every part is listed, so you know what you pay for',
    'Change any part: message us or use the custom builder',
    'Brand warranty on parts, with help on claims'
  ].map(t => `<li>${icon('checkcircle', 20)}<span>${t}</span></li>`).join('');

  /* ---------- PC finder (use + budget -> best prebuilt PC that fits) ---------- */
  const pcs = PCS.products.filter(p => p.cat === 'prebuilt' && p.stock);
  const prices = pcs.map(p => p.price);
  const MIN = Math.floor(Math.min.apply(null, prices) / 10000) * 10000;
  const MAX = Math.ceil(Math.max.apply(null, prices) / 10000) * 10000;
  const state = { use: 'gaming', budget: PCS.util.clamp(70000, MIN, MAX) };
  const PART_LABELS = [['cpu', 'Processor'], ['gpu', 'Graphics'], ['ram', 'Memory'], ['ssd', 'Storage'], ['psu', 'Power supply'], ['case', 'Cabinet']];

  const tuner = $('#tuner');
  tuner.innerHTML = `
    <p class="tuner__label" id="use-label">What will you use it for?</p>
    <div class="uses" role="group" aria-labelledby="use-label">
      ${PCS.uses.map(u => `<button class="use" type="button" data-use="${u.id}" style="--c:${u.hue};--t:${u.text}" aria-pressed="false">${icon(u.icon, 26)}<span>${u.label}</span></button>`).join('')}
    </div>
    <div class="tuner__budget">
      <label class="tuner__label" for="budget" style="margin:0">Your budget</label>
      <output class="tuner__amount" id="budget-out" for="budget"></output>
    </div>
    <input class="range" id="budget" type="range" min="${MIN}" max="${MAX}" step="1000" value="${state.budget}">
    <div class="range-ends"><span>${short(MIN)}</span><span>${short(MAX)}</span></div>
    <div class="tuner__result" id="tuner-result" aria-live="polite"></div>`;

  const slider = $('#budget', tuner), out = $('#budget-out', tuner), result = $('#tuner-result', tuner);

  function drawTuner() {
    const use = PCS.useById[state.use];
    tuner.style.setProperty('--use', use.hue);
    $$('.use', tuner).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.use === state.use)));
    out.textContent = money(state.budget);
    slider.value = state.budget;
    slider.style.setProperty('--pct', ((state.budget - MIN) / (MAX - MIN) * 100) + '%');

    const list = pcs.filter(p => p.use === state.use).sort((a, b) => a.price - b.price);
    const fit = list.filter(p => p.price <= state.budget);
    const best = fit[fit.length - 1];
    if (!best) {
      const first = list[0];
      result.innerHTML = `<div class="tuner__note"><p>No ${use.label.toLowerCase()} PC fits ${money(state.budget)}. They start at ${money(first.price)}.</p>
        <p style="margin-top:12px"><button class="btn btn--amber btn--sm" type="button" data-budget="${first.price}">Show the ${money(first.price)} PC</button></p></div>`;
      return;
    }
    const rows = PART_LABELS.filter(([k]) => best.parts[k]).map(([k, label]) => `<div><dt>${label}</dt><dd>${esc(best.parts[k])}</dd></div>`).join('');
    result.innerHTML = `
      <div class="tuner__art"><div class="art art--pc" style="--hue:${use.hue}">${PCS.tower(use.hue)}</div></div>
      <div>
        <h3>${esc(best.name)}</h3>
        <dl class="sheet sheet--navy">${rows}</dl>
        <p class="tuner__price"><strong>${money(best.price)}</strong>${best.mrp > best.price ? `<s>${money(best.mrp)}</s>` : ''}
          <span>EMI from ${money(monthly(best.price))} a month for 12 months</span></p>
        <div class="btn-row">
          <a class="btn btn--amber btn--sm" href="product.html?id=${best.id}">See this PC</a>
          <button class="btn btn--ghost btn--sm" type="button" data-add="${best.id}">Add to cart</button>
        </div>
      </div>`;
  }
  tuner.addEventListener('click', e => {
    const u = e.target.closest('[data-use]');
    if (u) { state.use = u.dataset.use; drawTuner(); return; }
    const b = e.target.closest('[data-budget]');
    if (b) { state.budget = Number(b.dataset.budget); drawTuner(); }
  });
  slider.addEventListener('input', () => { state.budget = Number(slider.value); drawTuner(); });
  drawTuner();

  /* ---------- Categories ---------- */
  const countIn = id => PCS.products.filter(p => p.cat === id).length;
  $('#cats').innerHTML = PCS.groups.map(g => `
    <h3 class="group-label">${esc(g.label)}</h3>
    <div class="cats">${PCS.categories.filter(c => c.group === g.id).map(c =>
      `<a class="cat" href="shop.html?cat=${c.id}">${icon(c.icon, 28)}<span>${esc(c.label)}<small>${countIn(c.id)} products</small></span></a>`).join('')}</div>`).join('');

  /* ---------- Best sellers ---------- */
  const groupOf = p => PCS.catById[p.cat].group;
  const TABS = [
    { id: 'gaming', label: 'Gaming PCs', pick: p => p.cat === 'prebuilt' && p.use === 'gaming', pc: true },
    { id: 'editing', label: 'Editing PCs', pick: p => p.cat === 'prebuilt' && p.use === 'editing', pc: true },
    { id: 'trading', label: 'Trading PCs', pick: p => p.cat === 'prebuilt' && p.use === 'trading', pc: true },
    { id: 'office', label: 'Office and study PCs', pick: p => p.cat === 'prebuilt' && p.use === 'office', pc: true },
    { id: 'parts', label: 'Components', pick: p => groupOf(p) === 'parts' },
    { id: 'gear', label: 'Peripherals', pick: p => groupOf(p) === 'gear' }
  ];
  function topFour(pick) {
    const all = PCS.products.filter(p => p.stock && pick(p));
    const best = all.filter(p => p.tags.includes('best'));
    const rest = all.filter(p => !p.tags.includes('best')).sort((a, b) => PCS.discount(b) - PCS.discount(a));
    return best.concat(rest).slice(0, 4);
  }
  let tab = 'gaming';
  function drawBest() {
    $('#best-tabs').innerHTML = TABS.map(t => `<button class="chip" type="button" data-tab="${t.id}" aria-pressed="${t.id === tab}">${t.label}</button>`).join('');
    const t = TABS.filter(x => x.id === tab)[0];
    $('#best-grid').innerHTML = `<div class="grid${t.pc ? ' grid--pc' : ''}">${topFour(t.pick).map(ui.card).join('')}</div>`;
    ui.refresh();
  }
  $('#best-tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (b) { tab = b.dataset.tab; drawBest(); $('#best-tabs [aria-pressed="true"]').focus(); }
  });
  drawBest();

  /* ---------- Deals and recently viewed ---------- */
  $('#deals').innerHTML = PCS.products.filter(p => p.stock).sort((a, b) => PCS.discount(b) - PCS.discount(a)).slice(0, 10).map(ui.card).join('');
  const recent = store.recent.list();
  if (recent.length) { $('#recent-sec').hidden = false; $('#recent').innerHTML = recent.slice(0, 8).map(ui.card).join(''); }

  /* ---------- Build banner ---------- */
  [['cpu', 'Processor and board', 'Same socket'], ['ram', 'Memory', 'DDR4 or DDR5 to match'], ['case', 'Cabinet', 'Board size fits'],
   ['fan', 'CPU cooler', 'Mounts on your socket'], ['psu', 'Power supply', 'Enough watts to spare']].forEach((r, i) => {
    $('#slot-' + (i + 1)).innerHTML = `${icon(r[0], 22)}<strong>${r[1]}</strong><span>${r[2]}</span>`;
  });
  $('#build-wa').href = PCS.wa('Hi, I want to build a custom PC.');

  /* ---------- Commitments and test report ---------- */
  $('#facts').innerHTML = cfg.commitments.map(c => `<li>${icon(c.icon, 24)}<div><strong>${esc(c.title)}</strong><span>${esc(c.text)}</span></div></li>`).join('');
  $('#report').innerHTML = `
    <h3>Stress-test report</h3>
    <p class="report__meta">A sample sheet. Every PC gets its own before it ships.</p>
    <dl class="sheet">${cfg.testSheet.map(r => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>
    <div class="report__sign"><span>Tested by</span><span>Date</span></div>`;

  /* ---------- EMI calculator ---------- */
  const tenures = cfg.emi.tenures, rate = cfg.emi.annualInterestPct;
  const calc = { price: 50000, months: tenures[tenures.length - 1] };
  $('#calc').innerHTML = `
    <div>
      <label class="field-label" for="emi-price">PC price</label>
      <output class="calc__amount" id="emi-amount" for="emi-price"></output>
      <input class="range range--light" id="emi-price" type="range" min="10000" max="200000" step="1000" value="${calc.price}">
      <div class="range-ends" style="color:var(--muted)"><span>${short(10000)}</span><span>${short(200000)}</span></div>
      <p class="field-label" style="margin-top:22px" id="emi-ten">Pay over</p>
      <div class="chips" role="group" aria-labelledby="emi-ten">${tenures.map(m => `<button class="chip" type="button" data-months="${m}" aria-pressed="false">${m} months</button>`).join('')}</div>
    </div>
    <div class="calc__out">
      <span class="note">You pay about</span>
      <strong id="emi-out"></strong>
      <p id="emi-note"></p>
      <a class="btn btn--sm" id="emi-link" href="shop.html?cat=prebuilt">See PCs in this budget</a>
    </div>`;
  function drawCalc() {
    const s = $('#emi-price');
    $('#emi-amount').textContent = money(calc.price);
    s.style.setProperty('--pct', ((calc.price - 10000) / 190000 * 100) + '%');
    $$('#calc [data-months]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.months) === calc.months)));
    const m = emi(calc.price, calc.months, rate);
    $('#emi-out').textContent = money(m) + ' a month';
    $('#emi-note').textContent = (rate ? `For ${calc.months} months at ${rate}% a year. Total ${money(m * calc.months)}.` : `For ${calc.months} months with no interest: the price divided by the months.`) +
      ' Approval and tenure depend on your bank or EMI partner.';
    $('#emi-link').href = 'shop.html?cat=prebuilt&max=' + calc.price;
  }
  $('#emi-price').addEventListener('input', e => { calc.price = Number(e.target.value); drawCalc(); });
  $('#calc').addEventListener('click', e => {
    const b = e.target.closest('[data-months]');
    if (b) { calc.months = Number(b.dataset.months); drawCalc(); }
  });
  drawCalc();

  /* ---------- Steps, brands, FAQ, help ---------- */
  $('#steps').innerHTML = cfg.steps.map(s => `<li><strong>${esc(s.title)}</strong><span>${esc(s.text)}</span></li>`).join('');
  $('#brands').innerHTML = PCS.brands.map(b => `<a class="chip" href="shop.html?brand=${encodeURIComponent(b)}">${esc(b)}</a>`).join('');
  $('#faq').innerHTML = cfg.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('');
  $('#cta-wa').href = PCS.wa('Hi, I need help choosing a PC. My budget is about ');
  const call = $('#cta-call');
  call.href = 'tel:' + cfg.phoneTel;
  call.textContent = 'Call ' + cfg.phone;
})(window.PCS);
