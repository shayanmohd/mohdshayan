// Shared behaviour for every page: theme toggle, mobile drawer, scroll reveal.
(function () {
  // Theme toggle (light is the designed default; the choice persists in localStorage and a cookie shared with subdomains such as demo.mohdshayan.com)
  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    var themeIcon = themeToggle.querySelector('[data-theme-icon]');
    var themeMetas = document.querySelectorAll('meta[name="theme-color"], meta[name="msapplication-TileColor"]');
    var applyTheme = function (dark, persist) {
      if (dark) document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
      themeIcon.querySelector('use').setAttribute('href', dark ? '/assets/icons.svg#i-sun' : '/assets/icons.svg#i-moon');
      themeToggle.setAttribute('aria-pressed', String(dark));
      themeMetas.forEach(function (m) { m.setAttribute('content', dark ? '#14120e' : '#faf8f3'); });
      if (persist) {
        try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
        // Shared with every *.mohdshayan.com site, which cannot read this origin's localStorage
        var shared = /(^|\.)mohdshayan\.com$/.test(location.hostname) ? '; domain=.mohdshayan.com' : '';
        document.cookie = 'theme=' + (dark ? 'dark' : 'light') + '; path=/; max-age=31536000; SameSite=Lax' + shared;
      }
    };
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark', false);
    themeToggle.addEventListener('click', function () {
      applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark', true);
    });
    // Follow the OS if the visitor has never chosen explicitly
    try {
      var stored = /(?:^|; )theme=(dark|light)/.test(document.cookie) || localStorage.getItem('theme');
      if (!stored && window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) { applyTheme(e.matches, false); });
    } catch (e) {}
  }

  // Mobile drawer with focus trap
  var drawer = document.getElementById('drawer');
  var menuBtn = document.getElementById('menu-btn');
  if (drawer && menuBtn) {
    var openDrawer = function () { drawer.classList.add('open'); document.body.classList.add('overflow-hidden'); menuBtn.setAttribute('aria-expanded', 'true'); var f = drawer.querySelector('a[href]'); if (f) f.focus(); };
    var closeDrawer = function () { drawer.classList.remove('open'); document.body.classList.remove('overflow-hidden'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus(); };
    menuBtn.addEventListener('click', function () { drawer.classList.contains('open') ? closeDrawer() : openDrawer(); });
    drawer.querySelectorAll('.drawer-link, nav a').forEach(function (el) { el.addEventListener('click', closeDrawer); });
    if (window.matchMedia) window.matchMedia('(min-width: 1024px)').addEventListener('change', function (e) { if (e.matches && drawer.classList.contains('open')) closeDrawer(); });
    document.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('open')) return;
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key === 'Tab') {
        var inner = drawer.querySelectorAll('a[href], button');
        var first = menuBtn, last = inner[inner.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  // Scroll reveal (IntersectionObserver, once)
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    // Small blocks reveal once 12% of them is on screen. A block taller than
    // most of the viewport (an article body on a phone) can never reach 12%,
    // so it reveals as soon as any of it enters the viewport instead.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var rootHeight = entry.rootBounds ? entry.rootBounds.height : window.innerHeight;
        var tall = entry.boundingClientRect.height > rootHeight * 0.6;
        if (tall || entry.intersectionRatio >= 0.12) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: [0, 0.12], rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // Copy-to-clipboard buttons: data-copy names the input to copy
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var input = document.getElementById(btn.getAttribute('data-copy'));
    var status = document.getElementById(btn.getAttribute('data-copy') + '-status');
    if (!input) return;
    input.addEventListener('focus', function () { input.select(); });
    btn.addEventListener('click', function () {
      var done = function () {
        btn.textContent = 'Copied';
        if (status) status.textContent = 'Feed address copied.';
        setTimeout(function () { btn.textContent = 'Copy'; if (status) status.textContent = ''; }, 2000);
      };
      var fallback = function () { input.focus(); input.select(); if (status) status.textContent = 'Press Ctrl+C or Cmd+C to copy.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(input.value).then(done, fallback);
      else fallback();
    });
  });

  // Gallery lightbox (philanthropy page): <dialog> driven, keyboard friendly
  var lightbox = document.getElementById('lightbox');
  if (lightbox) {
    var lbImg = lightbox.querySelector('img'), lbFrame = lightbox.querySelector('iframe'), lbCap = lightbox.querySelector('[data-caption]');
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
    var idx = -1;
    var show = function (i) {
      idx = (i + items.length) % items.length;
      var el = items[idx];
      var video = el.getAttribute('data-video');
      if (video) { lbImg.hidden = true; lbFrame.hidden = false; lbFrame.src = video + '?autoplay=1&rel=0'; }
      else { lbFrame.hidden = true; lbFrame.src = ''; lbImg.hidden = false; lbImg.src = el.getAttribute('data-full') || el.querySelector('img').src; lbImg.alt = el.querySelector('img').alt; }
      lbCap.textContent = el.getAttribute('data-caption') || '';
      if (!lightbox.open) lightbox.showModal();
    };
    items.forEach(function (el, i) { el.addEventListener('click', function (e) { e.preventDefault(); show(i); }); });
    lightbox.querySelector('[data-close]').addEventListener('click', function () { lightbox.close(); });
    lightbox.querySelector('[data-prev]').addEventListener('click', function () { show(idx - 1); });
    lightbox.querySelector('[data-next]').addEventListener('click', function () { show(idx + 1); });
    lightbox.addEventListener('close', function () { lbFrame.src = ''; });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lightbox.close(); });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.open) return;
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  // Blog index sort: reorders the post list in place and keeps the choice in ?sort= so it survives back/forward and sharing
  var sortSelect = document.getElementById('blog-sort');
  var postList = document.getElementById('post-list');
  if (sortSelect && postList) {
    var rows = Array.prototype.slice.call(postList.children).filter(function (li) { return li.hasAttribute('data-date'); });
    var collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
    var newest = function (a, b) { return a.dataset.date < b.dataset.date ? 1 : a.dataset.date > b.dataset.date ? -1 : 0; };
    var sorts = {
      newest: newest,
      oldest: function (a, b) { return newest(b, a); },
      title: function (a, b) { return collator.compare(a.dataset.title, b.dataset.title); },
      topic: function (a, b) { return collator.compare(a.dataset.topic, b.dataset.topic) || newest(a, b); },
      longest: function (a, b) { return b.dataset.minutes - a.dataset.minutes || newest(a, b); },
      shortest: function (a, b) { return a.dataset.minutes - b.dataset.minutes || newest(a, b); }
    };
    var sortStatus = document.getElementById('blog-sort-status');
    var applySort = function (key, announce) {
      if (!sorts[key]) key = 'newest';
      sortSelect.value = key;
      Array.prototype.slice.call(postList.querySelectorAll('.sort-group')).forEach(function (g) { g.remove(); });
      var frag = document.createDocumentFragment();
      var group = null;
      rows.slice().sort(sorts[key]).forEach(function (li) {
        var title = li.querySelector('h2');
        if (key === 'topic') {
          // Topic headings are h2, so post titles drop to level 3 for assistive tech while grouped
          title.setAttribute('aria-level', '3');
          if (li.dataset.topic !== group) {
            group = li.dataset.topic;
            var count = rows.filter(function (r) { return r.dataset.topic === group; }).length;
            var head = document.createElement('li');
            head.className = 'sort-group';
            head.innerHTML = '<h2 class="eyebrow"></h2><span class="mono-meta text-muted"></span>';
            head.firstChild.textContent = group;
            head.lastChild.textContent = count + (count === 1 ? ' essay' : ' essays');
            frag.appendChild(head);
          }
        } else {
          title.removeAttribute('aria-level');
        }
        frag.appendChild(li);
      });
      postList.appendChild(frag);
      var url = new URL(window.location.href);
      if (key === 'newest') url.searchParams.delete('sort'); else url.searchParams.set('sort', key);
      history.replaceState(history.state, '', url);
      if (announce && sortStatus) sortStatus.textContent = 'Posts sorted by ' + sortSelect.options[sortSelect.selectedIndex].text.toLowerCase() + '.';
    };
    sortSelect.addEventListener('change', function () { applySort(sortSelect.value, true); });
    applySort(new URLSearchParams(window.location.search).get('sort'), false);
    sortSelect.closest('.blog-sort').hidden = false;
  }
})();
