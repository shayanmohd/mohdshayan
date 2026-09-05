// Shared behaviour for every page: theme toggle, mobile drawer, scroll reveal.
(function () {
  // Theme toggle (light is the designed default; choice persists in localStorage)
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
      if (persist) { try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {} }
    };
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark', false);
    themeToggle.addEventListener('click', function () {
      applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark', true);
    });
    // Follow the OS if the visitor has never chosen explicitly
    try {
      var stored = localStorage.getItem('theme');
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
    if (window.matchMedia) window.matchMedia('(min-width: 768px)').addEventListener('change', function (e) { if (e.matches && drawer.classList.contains('open')) closeDrawer(); });
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
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

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
})();
