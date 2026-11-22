/* ==========================================================================
   RGB Gaming Hero Banner
   Renders the hero banner inside #rgb-hero using existing PCS data, icons,
   and shop/product/builder routing.
   ========================================================================== */
(function (PCS) {
  'use strict';

  var util = PCS.util || {};
  var cfg = PCS.config || {};
  var icon = PCS.icon || function () { return ''; };

  function selectFeaturedPcs(products) {
    var list = (products || []).filter(function (p) {
      return p && p.cat === 'prebuilt' && p.use === 'gaming' && p.stock !== false;
    });
    if (!list.length) {
      list = (products || []).filter(function (p) {
        return p && p.cat === 'prebuilt' && p.stock !== false;
      });
    }
    var score = function (p) {
      var tags = p.tags || [];
      return (tags.indexOf('hot') !== -1 ? 4 : 0) +
        (tags.indexOf('best') !== -1 ? 2 : 0) +
        (tags.indexOf('new') !== -1 ? 1 : 0);
    };
    return list.slice().sort(function (a, b) {
      return score(b) - score(a);
    }).slice(0, 4);
  }

  function buildSearchHref(rawQuery) {
    var q = String(rawQuery || '').trim();
    return q ? 'shop.html?q=' + encodeURIComponent(q) : 'shop.html';
  }

  function formatProductSummary(p, discountFn, emiFn, emiCfg) {
    var off = discountFn ? discountFn(p) : 0;
    var parts = p.parts || {};
    var specLine = [parts.cpu, parts.gpu].filter(Boolean).join(' · ') ||
      ((p.specs || []).slice(0, 2).join(' · '));
    var emiMonths = (emiCfg && emiCfg.tenures && emiCfg.tenures.length)
      ? emiCfg.tenures[emiCfg.tenures.length - 1]
      : 12;
    var rate = emiCfg ? emiCfg.annualInterestPct : 0;
    var monthly = (emiFn && p.price >= 10000) ? emiFn(p.price, emiMonths, rate) : 0;
    return {
      id: p.id,
      name: p.name,
      href: 'product.html?id=' + encodeURIComponent(p.id),
      specLine: specLine,
      price: p.price,
      mrp: p.mrp,
      off: off,
      emiMonths: emiMonths,
      monthly: monthly
    };
  }

  var YOUTUBE_URL = 'https://www.youtube.com/watch?v=U8A96GBDaaA';
  var PREVIEW_SECONDS = 18;

  function extractYoutubeId(url) {
    var m = String(url || '').match(/(?:v=|youtu\.be\/|\/embed\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : '';
  }

  function buildYoutubeEmbedUrl(videoId, seconds, autoplay) {
    var id = String(videoId || '').trim();
    var dur = Math.max(15, Math.min(20, Number(seconds) || PREVIEW_SECONDS));
    if (!id) return '';
    return 'https://www.youtube.com/embed/' + encodeURIComponent(id) +
      '?autoplay=' + (autoplay === false ? '0' : '1') +
      '&mute=1&start=0&end=' + dur +
      '&controls=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1';
  }

  PCS.rgbHeroLogic = {
    selectFeaturedPcs: selectFeaturedPcs,
    buildSearchHref: buildSearchHref,
    formatProductSummary: formatProductSummary,
    extractYoutubeId: extractYoutubeId,
    buildYoutubeEmbedUrl: buildYoutubeEmbedUrl
  };

  if (typeof document === 'undefined') return;

  var root = util.$ && util.$('#rgb-hero');
  if (!root) return;

  var esc = util.esc;
  var money = util.money;
  var featured = selectFeaturedPcs(PCS.products);
  if (!featured.length) return;

  var hues = ['#8b3dff', '#00d2ff', '#ff2e93', '#22e58a'];
  var activeIndex = 0;
  var timer = null;
  var videoId = extractYoutubeId(YOUTUBE_URL);
  var reducedMotion = !!(util.prefersReducedMotion && util.prefersReducedMotion());
  var embedUrl = buildYoutubeEmbedUrl(videoId, PREVIEW_SECONDS, !reducedMotion);
  var posterUrl = 'https://i.ytimg.com/vi/' + encodeURIComponent(videoId) + '/hqdefault.jpg';

  var trustItems = [
    { icon: 'bolt', label: 'Stress-Tested Before Dispatch' },
    { icon: 'shield', label: 'Brand Warranty & GST Invoice' },
    { icon: 'truck', label: 'Pan India Delivery' },
    { icon: 'card', label: 'Easy EMI (3–12 Months)' }
  ];

  root.innerHTML =
    '<div class="wrap rgb-hero__grid">' +
      '<div class="rgb-hero__left">' +
        '<form class="rgb-search" action="shop.html" method="get" role="search">' +
          '<span class="rgb-search__ico" aria-hidden="true">' + icon('search', 18) + '</span>' +
          '<label class="sr" for="rgb-hero-search">Search Gaming PCs and Components</label>' +
          '<input id="rgb-hero-search" name="q" type="search" placeholder="Search Gaming PCs, Components..." autocomplete="off">' +
          '<button class="rgb-search__btn" type="submit">SEARCH</button>' +
        '</form>' +
        '<div class="rgb-video" id="rgb-video"' + (reducedMotion ? ' data-ended="true"' : '') + '>' +
          '<div class="rgb-video__media">' +
            '<img class="rgb-video__poster" src="' + esc(posterUrl) + '" alt="Featured RGB PC build showcase preview" loading="lazy">' +
            (!reducedMotion
              ? '<iframe class="rgb-video__frame" id="rgb-video-frame" src="' + esc(embedUrl) + '" title="Gaming PC showcase preview" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe>'
              : '') +
            '<span class="rgb-video__tag"><span class="rgb-video__dot" aria-hidden="true"></span><span>18s Preview</span></span>' +
          '</div>' +
          '<div class="rgb-video__info">' +
            '<strong class="rgb-video__title">Watch PC Build Showcase</strong>' +
            '<span class="rgb-video__sub">Auto-plays for 18s · Click to watch full video on YouTube</span>' +
          '</div>' +
          '<span class="rgb-video__cta" aria-hidden="true">' + icon('youtube', 18) + '<span>YouTube</span></span>' +
          '<a class="rgb-video__link" href="' + esc(YOUTUBE_URL) + '" target="_blank" rel="noopener noreferrer" aria-label="Watch full video on YouTube"></a>' +
        '</div>' +
        '<div class="rgb-pill">' +
          '<span class="rgb-pill__dot" aria-hidden="true"></span>' +
          '<span>Ready-to-ship Gaming PCs | Delivered Across India</span>' +
        '</div>' +
        '<h1 class="rgb-hero__title">Your <span class="rgb-hero__grad">RGB Dream PC</span>, Built &amp; Delivered.</h1>' +
        '<p class="rgb-hero__desc">Gaming, editing, streaming &amp; professional work PCs — expertly assembled, stress-tested and safely delivered anywhere in India. Enjoy flexible EMI options.</p>' +
        '<div class="rgb-hero__ctas">' +
          '<a class="rgb-btn rgb-btn--primary" href="shop.html?cat=prebuilt">' + icon('bolt', 18) + '<span>Shop Prebuilt PCs</span></a>' +
          '<a class="rgb-btn rgb-btn--secondary" href="build.html">' + icon('wrench', 18) + '<span>Build Your Own</span></a>' +
        '</div>' +
        '<ul class="rgb-trust" aria-label="Store highlights">' +
          trustItems.map(function (t) {
            return '<li class="rgb-trust__item">' + icon(t.icon, 16) + '<span>' + esc(t.label) + '</span></li>';
          }).join('') +
        '</ul>' +
      '</div>' +
      '<div class="rgb-showcase" aria-roledescription="carousel" aria-label="Featured RGB gaming PCs">' +
        '<div class="rgb-stage">' +
          '<div class="rgb-fbadge rgb-fbadge--top">' + icon('gamepad', 15) + '<span>RGB Gaming Ready</span></div>' +
          '<div class="rgb-fbadge rgb-fbadge--offer" id="rgb-offer-badge">' + icon('flame', 15) + '<span>SPECIAL OFFER</span></div>' +
          '<div class="rgb-fbadge rgb-fbadge--emi">' + icon('card', 15) + '<span>Easy EMI Available</span></div>' +
          '<div class="rgb-orb">' +
            '<div class="rgb-ring" aria-hidden="true"></div>' +
            '<div class="rgb-frame">' +
              '<div class="rgb-pc-art" id="rgb-pc-art"></div>' +
            '</div>' +
          '</div>' +
          '<article class="rgb-pcard" id="rgb-pcard" aria-live="polite"></article>' +
        '</div>' +
        (featured.length > 1
          ? '<div class="rgb-dots" role="group" aria-label="Choose featured PC">' +
              featured.map(function (p, i) {
                return '<button class="rgb-dot" type="button" data-slide="' + i + '" aria-label="Show ' + esc(p.name) + '" aria-current="' + (i === 0 ? 'true' : 'false') + '"></button>';
              }).join('') +
            '</div>'
          : '') +
      '</div>' +
    '</div>';

  var searchForm = util.$('.rgb-search', root);
  var searchInput = util.$('#rgb-hero-search', root);
  var artEl = util.$('#rgb-pc-art', root);
  var cardEl = util.$('#rgb-pcard', root);
  var offerBadge = util.$('#rgb-offer-badge', root);
  var showcaseEl = util.$('.rgb-showcase', root);

  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var val = searchInput.value.trim();
    if (!val) {
      searchInput.focus();
      return;
    }
    location.href = buildSearchHref(val);
  });

  function renderSlide(idx, animate) {
    activeIndex = (idx + featured.length) % featured.length;
    var p = featured[activeIndex];
    var info = formatProductSummary(p, PCS.discount, util.emi, cfg.emi);
    var hue = hues[activeIndex % hues.length];

    if (offerBadge) {
      offerBadge.hidden = !(info.off >= 5);
    }

    var draw = function () {
      artEl.innerHTML = PCS.tower ? PCS.tower(hue) : '';
      cardEl.innerHTML =
        '<div class="rgb-pcard__top">' +
          '<span class="rgb-pcard__specs">' + esc(info.specLine) + '</span>' +
          (info.off >= 5 ? '<span class="rgb-pcard__off">' + info.off + '% OFF</span>' : '') +
        '</div>' +
        '<h2 class="rgb-pcard__name"><a href="' + info.href + '">' + esc(info.name) + '</a></h2>' +
        '<div class="rgb-pcard__foot">' +
          '<div class="rgb-pcard__prices">' +
            '<strong>' + money(info.price) + '</strong>' +
            (info.mrp > info.price ? '<s>' + money(info.mrp) + '</s>' : '') +
            (info.monthly ? '<span class="rgb-pcard__emi">EMI from ' + money(info.monthly) + '/mo</span>' : '') +
          '</div>' +
          '<a class="rgb-buy-btn" href="' + info.href + '">Buy Now</a>' +
        '</div>';
    };

    if (animate && !(util.prefersReducedMotion && util.prefersReducedMotion())) {
      artEl.classList.add('is-switching');
      setTimeout(function () {
        draw();
        artEl.classList.remove('is-switching');
      }, 150);
    } else {
      draw();
    }

    util.$$('.rgb-dot', root).forEach(function (dot, i) {
      dot.setAttribute('aria-current', i === activeIndex ? 'true' : 'false');
    });
  }

  function startAuto() {
    if (featured.length < 2 || (util.prefersReducedMotion && util.prefersReducedMotion())) return;
    stopAuto();
    timer = setInterval(function () {
      renderSlide(activeIndex + 1, true);
    }, 5200);
  }

  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  root.addEventListener('click', function (e) {
    var dot = e.target.closest('[data-slide]');
    if (!dot) return;
    var nextIdx = Number(dot.dataset.slide);
    if (!isNaN(nextIdx) && nextIdx !== activeIndex) {
      renderSlide(nextIdx, true);
      startAuto();
    }
  });

  if (showcaseEl) {
    showcaseEl.addEventListener('mouseenter', stopAuto);
    showcaseEl.addEventListener('mouseleave', startAuto);
    showcaseEl.addEventListener('focusin', stopAuto);
    showcaseEl.addEventListener('focusout', startAuto);
  }

  var videoEl = util.$('#rgb-video', root);
  var videoFrame = util.$('#rgb-video-frame', root);
  if (videoEl && videoFrame && !reducedMotion) {
    setTimeout(function () {
      videoEl.setAttribute('data-ended', 'true');
      videoFrame.removeAttribute('src');
    }, PREVIEW_SECONDS * 1000);
  }

  renderSlide(0, false);
  startAuto();
})(window.PCS = window.PCS || {});
