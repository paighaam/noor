/* ============================================================
   Noor POC — theme manager + top app-bar chrome
   Include in the real <head> right after support.js:
     <script src="./_theme/chrome.js"></script>
   Modes: 'light' | 'dark' | 'system' (default), persisted in
   localStorage. Resolved theme lands on <html data-theme="…">
   and a 'noortheme' event fires on window for JS consumers
   (the iOS device frame listens to restyle its status bar).
   ============================================================ */
(function () {
  var KEY = 'noor-theme-mode';
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function getMode() {
    try {
      var m = localStorage.getItem(KEY);
      return m === 'light' || m === 'dark' || m === 'system' ? m : 'system';
    } catch (e) { return 'system'; }
  }

  function resolved(mode) {
    mode = mode || getMode();
    if (mode === 'system') return media && media.matches ? 'dark' : 'light';
    return mode;
  }

  function apply() {
    document.documentElement.setAttribute('data-theme', resolved());
    try { window.dispatchEvent(new CustomEvent('noortheme', { detail: { mode: getMode(), theme: resolved() } })); } catch (e) {}
    syncChrome();
  }

  function setMode(mode) {
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    apply();
  }

  window.NoorTheme = { getMode: getMode, setMode: setMode, resolved: resolved };

  /* apply ASAP to avoid a light flash */
  apply();

  if (media && media.addEventListener) {
    media.addEventListener('change', function () { if (getMode() === 'system') apply(); });
  }
  /* keep pages in sync when the mode is changed on another page */
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(); });

  /* ---------- top app-bar chrome ---------- */
  var BAR_H = 52;
  var MODES = [
    { id: 'light', icon: 'light_mode', label: 'Light' },
    { id: 'system', icon: 'contrast', label: 'System' },
    { id: 'dark', icon: 'dark_mode', label: 'Dark' }
  ];

  /* ---------- site map (single source of truth) ----------
     Shared by the left nav drawer here and the Index cover page,
     which reads window.NoorSiteMap. `file` paths are relative to
     src/; the drawer prefixes them for the current page depth. */
  var NAV = [
    { id: 'foundations', num: '00', title: 'Foundation', items: [
      { name: 'Primitives', file: 'foundation/Primitives.dc.html', icon: 'widgets', meta: 'Page 01 · surfaces, states, motion' },
      { name: 'Tokens', file: 'foundation/Tokens.dc.html', icon: 'palette', meta: 'Page 02 · color, type, spacing' },
      { name: 'Theme', file: 'foundation/Theme.dc.html', icon: 'dark_mode', meta: 'Page 03 · light & dark modes' },
      { name: 'Font Lab', file: 'foundation/FontLab.dc.html', icon: 'format_quote', meta: 'Lab · title/body pairing candidates' }
    ]},
    { id: 'components', num: '01', title: 'Components', items: [
      { name: 'Atoms', file: 'components/atoms/Atoms.dc.html', icon: 'widgets', meta: 'Page 04 · button, icon, input, toggles, chip, surface' },
      { name: 'Molecules', file: 'components/molecules/Molecules.dc.html', icon: 'bubble_chart', meta: 'Page 05 · fields, search, list, OTP, tabs, snackbar' },
      { name: 'Organisms', file: 'components/organisms/Organisms.dc.html', icon: 'dashboard', meta: 'Page 06 · dialog, sheet, nudge, bars, picker' }
    ]},
    { id: 'onboarding', num: '02', title: 'Onboarding', items: [
      { name: 'Splash', file: 'onboarding/Splash.dc.html#current', icon: 'auto_awesome', meta: 'Board · logo reveal · current + 15 variations' },
      { name: 'Sign in', file: 'onboarding/Onboarding.dc.html#intro', icon: 'login', meta: 'Board · intro → phone → OTP' },
      { name: 'Complete Profile', file: 'personal-details/Personal Details.dc.html#details', icon: 'person', meta: 'Board · details → welcome · 6 states' }
    ]},
    { id: 'core', num: '03', title: 'Core app', items: [
      { name: 'Home Broadcast Studio', file: 'home/Home Broadcast Studio.dc.html', icon: 'splitscreen', meta: 'Section board · Home, Qaum, Quran, Salaah, Profile + console entry' },
      { name: 'Explore Masjids', file: 'masjid-explore/Explore Masjids.dc.html#map', icon: 'travel_explore', meta: 'Section board · map · list · pincode · QR · 10 states' },
      { name: 'Sign-in & Nudge States', file: 'nudge-states/Sign-in & Nudge States.dc.html', icon: 'notifications', meta: 'Board · guest · no-masjid · notifications · 17 states' },
      { name: 'Quran', file: 'Quran.dc.html#home', icon: 'auto_stories', meta: 'Section board · Home → index → reader · 9 states' }
    ]},
    { id: 'masjid', num: '04', title: 'Masjid', items: [
      { name: 'Masjid Onboarding', file: 'masjid-register/Masjid Onboarding.dc.html#entry', icon: 'add_home_work', meta: 'Section board · My Masjids sheet · screen-by-screen storyboard · 41 states' },
      { name: 'Masjid Console', file: 'masjid-operations/Masjid Console.dc.html', icon: 'campaign', meta: 'Section board · the masjid console · hub → committee · musalleen · details · invitations · send a paigham · 74 states' },
      { name: 'Salaah Timing Rules', file: 'masjid-operations/Salaah Timing Rules.dc.html', icon: 'schedule', meta: 'Section board · the whole Salaah section · the day dragged by rule · board scan · per-prayer rule · publish · 33 states' },
      { name: 'Admin Console', file: 'admin/Admin Console.dc.html', icon: 'dashboard', meta: 'Section board · platform admin · approvals queue · claimed masjid pick-and-merge · 15 states' }
    ]},
    { id: 'content', num: '05', title: 'Content & tools', items: [
      { name: 'Find Sehri', file: 'sehri/Sehri.dc.html#map', icon: 'restaurant', meta: 'Section board · Home → permission → map · list · 5 states' },
      { name: 'Dua & Dikhr', file: 'dua-dikhr/Dua & Dikhr.dc.html#categories', icon: 'volunteer_activism', meta: 'Section board · Hisnul Muslim · 5 states' },
      { name: 'Asma ul Husna', file: 'asma-ul-husna/Asma ul Husna.dc.html', icon: 'auto_awesome', meta: 'Section board · 99 names · detail overlay · 7 states' },
      { name: 'Qibla', file: 'qibla/Qibla.dc.html#permissions', icon: 'explore', meta: 'Section board · permissions → recovery → AR compass · 9 states' },
      { name: 'Hijri', file: 'hijri/Hijri.dc.html', icon: 'calendar_month', meta: 'Section board · adaptive calendar · 7 states' },
      { name: 'Zakaat', file: 'zakaat/Zakaat.dc.html', icon: 'savings', meta: 'Section board · 6-step calculator' }
    ]}
  ];
  window.NoorSiteMap = NAV;

  /* sidebar-toggle glyph (macOS-style split panel) */
  var SIDEBAR_SVG = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="3" y="4.5" width="18" height="15" rx="3.4" stroke="currentColor" stroke-width="1.8"/>' +
    '<line x1="9.3" y1="4.5" x2="9.3" y2="19.5" stroke="currentColor" stroke-width="1.8"/>' +
    '</svg>';

  /* back-arrow glyph */
  var BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  /* home glyph */
  var HOME_SVG = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M4.5 10.4 12 4.4l7.5 6M6.2 9.1V19a.9.9 0 0 0 .9.9h3.1v-4.9h3.6v4.9h3.1a.9.9 0 0 0 .9-.9V9.1" ' +
    'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  function syncChrome() {
    var bar = document.getElementById('noor-chrome');
    if (!bar) return;
    var mode = getMode();
    MODES.forEach(function (m) {
      var btn = document.getElementById('noor-chrome-' + m.id);
      if (btn) btn.setAttribute('data-active', mode === m.id ? '1' : '0');
    });
  }

  /* ---------- app-bar title ----------
     Boards push their descriptive title via window.NoorSetChromeTitle
     (called from BoardHeader). Plain screens fall back to their site-map
     name; the cover falls back to 'Noor'. */
  function pathMatchesItem(curPath, itemFile) {
    var fileNoHash = itemFile.split('#')[0];
    var matchPath = fileNoHash.charAt(0) === '/' ? fileNoHash : '/' + fileNoHash;
    return curPath.indexOf(matchPath) !== -1;
  }
  function navItemFor(curPath) {
    for (var i = 0; i < NAV.length; i++) {
      var items = NAV[i].items;
      for (var j = 0; j < items.length; j++) {
        if (pathMatchesItem(curPath, items[j].file)) return items[j];
      }
    }
    return null;
  }
  function setChromeTitle(text) {
    var el = document.getElementById('noor-chrome-title');
    if (el && text) el.textContent = text;
  }
  window.NoorSetChromeTitle = setChromeTitle;
  function setChromeSubtitle(text) {
    var el = document.getElementById('noor-chrome-sub');
    if (!el) return;
    el.textContent = text || '';
    el.style.display = text ? '' : 'none';
  }
  window.NoorSetChromeSubtitle = setChromeSubtitle;

  /* ---------- left nav drawer ---------- */
  function revealCurrentDrawerItem() {
    var current = document.querySelector('#noor-nav .nn-item.current');
    if (current) current.scrollIntoView({ block: 'center', inline: 'nearest' });
  }
  function setDrawerOpen(isOpen) {
    document.documentElement.classList.toggle('noor-nav-open', isOpen);
    var toggle = document.getElementById('noor-nav-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (isOpen) requestAnimationFrame(revealCurrentDrawerItem);
  }
  function openDrawer() { setDrawerOpen(true); }
  function closeDrawer() { setDrawerOpen(false); }
  function toggleDrawer() { setDrawerOpen(!document.documentElement.classList.contains('noor-nav-open')); }

  function buildDrawer(prefix) {
    if (document.getElementById('noor-nav')) return;
    var curPath = '';
    try { curPath = decodeURIComponent(window.location.pathname); } catch (e) { curPath = window.location.pathname; }

    var scrim = document.createElement('div');
    scrim.id = 'noor-nav-scrim';
    scrim.addEventListener('click', closeDrawer);

    var nav = document.createElement('aside');
    nav.id = 'noor-nav';

    var list = document.createElement('div');
    list.className = 'nn-list';
    NAV.forEach(function (sec) {
      var secLabel = document.createElement('div');
      secLabel.className = 'nn-sec';
      secLabel.textContent = sec.num + ' · ' + sec.title;
      list.appendChild(secLabel);
      sec.items.forEach(function (p) {
        var a = document.createElement('a');
        a.className = 'nn-item';
        a.href = prefix + p.file;
        if (pathMatchesItem(curPath, p.file)) {
          a.classList.add('current');
          a.setAttribute('aria-current', 'page');
        }
        var ic = document.createElement('span');
        ic.className = 'nn-ic';
        // Local icon kit (_theme/icons.css renders the SVG through a CSS mask). The old
        // material-symbols ligature only rendered on pages that happened to load the Google
        // font, so on every other page the chrome printed the ligature NAME as text.
        ic.innerHTML = '<span class="mi"></span>';
        ic.firstChild.setAttribute('data-i', p.icon);
        var tx = document.createElement('span');
        tx.className = 'nn-tx';
        var nm = document.createElement('span');
        nm.className = 'nn-name';
        nm.textContent = p.name;
        var mt = document.createElement('span');
        mt.className = 'nn-meta';
        mt.textContent = p.meta;
        tx.appendChild(nm);
        tx.appendChild(mt);
        a.appendChild(ic);
        a.appendChild(tx);
        list.appendChild(a);
      });
    });
    nav.appendChild(list);

    document.body.appendChild(scrim);
    document.body.appendChild(nav);

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  function buildChrome() {
    if (document.getElementById('noor-chrome')) return;

    var css = [
      '#noor-chrome{position:fixed;top:0;left:0;right:0;height:' + BAR_H + 'px;z-index:99999;',
      'display:flex;align-items:center;justify-content:space-between;padding:0 20px;box-sizing:border-box;',
      'background:color-mix(in oklab,var(--color-surface-primary,#fff) 72%,transparent);',
      'backdrop-filter:blur(18px) saturate(160%);-webkit-backdrop-filter:blur(18px) saturate(160%);',
      'border-bottom:1px solid var(--color-neutral-border,#E4E4E7);font-family:var(--font-body,"Plus Jakarta Sans",sans-serif)}',
      /* reserve space so page content clears the fixed bar */
      'body{padding-top:64px !important}',
      '#noor-chrome .noor-chrome-left{display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden}',
      '#noor-chrome .noor-chrome-toggle{width:34px;height:30px;flex:none;border:none;background:transparent;border-radius:9px;cursor:pointer;',
      'color:var(--color-info-secondary,#71717B);display:flex;align-items:center;justify-content:center;padding:0}',
      '#noor-chrome .noor-chrome-toggle:hover{background:var(--color-surface-secondary,#F0FDF4);color:var(--color-info-primary,#09090B)}',
      '#noor-chrome .noor-chrome-toggle svg{width:19px;height:19px;display:block}',
      '#noor-chrome a.noor-chrome-toggle{text-decoration:none;box-sizing:border-box}',
      '#noor-chrome .noor-chrome-titles{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:0 2px}',
      '#noor-chrome .noor-chrome-title{font-family:var(--font-title,serif);font-size:16px;line-height:1.15;color:var(--color-info-primary,#09090B);letter-spacing:-0.2px;',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}',
      '#noor-chrome .noor-chrome-sub{font-size:11.5px;line-height:1.2;color:var(--color-info-secondary,#71717B);margin-top:1px;',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}',
      '#noor-chrome .noor-chrome-seg{display:flex;align-items:center;gap:2px;background:var(--color-action-background,#E4E4E7);border-radius:12px;padding:3px}',
      '#noor-chrome .noor-chrome-seg button{width:34px;height:28px;border:none;background:transparent;border-radius:9px;',
      'cursor:pointer;color:var(--color-info-secondary,#71717B);display:flex;align-items:center;justify-content:center;padding:0}',
      '#noor-chrome .noor-chrome-seg button[data-active="1"]{background:var(--color-action-primary,#00C950);color:var(--color-action-primary-inverse,#F0FDF4)}',
      '#noor-chrome .noor-chrome-seg button:not([data-active="1"]):hover{color:var(--color-info-primary,#09090B)}',
      '#noor-chrome .mi{font-size:18px}',
      /* ---- left nav drawer ---- */
      '#noor-nav-scrim{position:fixed;inset:0;z-index:100000;background:color-mix(in oklab,var(--color-info-primary,#000) 26%,transparent);',
      'backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);opacity:0;pointer-events:none;transition:opacity .3s ease}',
      'html.noor-nav-open #noor-nav-scrim{opacity:1;pointer-events:auto}',
      /* floating "liquid glass" panel — detached from the edges */
      '#noor-nav{position:fixed;top:64px;left:14px;bottom:14px;width:314px;max-width:86vw;z-index:100001;box-sizing:border-box;overflow:hidden;',
      'background:color-mix(in oklab,var(--color-surface-primary,#fff) 76%,transparent);',
      'backdrop-filter:blur(26px) saturate(180%);-webkit-backdrop-filter:blur(26px) saturate(180%);',
      'border:1px solid color-mix(in oklab,var(--color-neutral-border,#E4E4E7) 55%,transparent);border-radius:24px;',
      'box-shadow:0 28px 64px -16px rgba(0,0,0,.34),0 10px 28px -12px rgba(0,0,0,.20);',
      'transform:translateX(calc(-100% - 22px));opacity:0;',
      'transition:transform .36s cubic-bezier(.2,.9,.25,1),opacity .28s ease;display:flex;flex-direction:column;font-family:var(--font-body,"Plus Jakarta Sans",sans-serif)}',
      'html.noor-nav-open #noor-nav{transform:translateX(0);opacity:1}',
      '#noor-nav .nn-list{flex:1;min-height:0;overflow-y:auto;padding:6px 10px 22px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-gutter:stable}',
      '#noor-nav .nn-sec{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--color-info-secondary,#71717B);padding:16px 12px 6px}',
      '#noor-nav .nn-item{display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:12px;text-decoration:none;color:var(--color-info-primary,#09090B)}',
      '#noor-nav .nn-item:hover{background:var(--color-surface-secondary,#F0FDF4)}',
      '#noor-nav .nn-item.current{background:var(--color-action-background,#DCFCE7)}',
      '#noor-nav .nn-ic{width:34px;height:34px;flex:none;border-radius:10px;background:var(--color-surface-secondary,#F0FDF4);',
      'display:flex;align-items:center;justify-content:center;color:var(--color-action-primary,#00C950)}',
      '#noor-nav .nn-item.current .nn-ic{background:var(--color-action-primary,#00C950);color:var(--color-action-primary-inverse,#F0FDF4)}',
      '#noor-nav .nn-ic .mi{font-size:20px}',
      '#noor-nav .nn-tx{min-width:0;display:flex;flex-direction:column}',
      '#noor-nav .nn-name{font-size:14px;font-weight:700;line-height:1.2}',
      '#noor-nav .nn-meta{font-size:11px;color:var(--color-info-secondary,#71717B);line-height:1.3;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    ].join('');
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.id = 'noor-chrome';

    var left = document.createElement('div');
    left.className = 'noor-chrome-left';

    var prefix = '';
    var path = window.location.pathname;
    if (path) {
      var parts = path.split('/').filter(Boolean);
      var isFile = parts.length > 0 && parts[parts.length - 1].indexOf('.') !== -1;
      var folderCount = isFile ? parts.length - 1 : parts.length;
      for (var d = 0; d < folderCount - 1; d++) {
        prefix += '../';
      }
    }

    /* back button — returns to the previous page (Index if none) */
    var back = document.createElement('button');
    back.className = 'noor-chrome-toggle';
    back.type = 'button';
    back.title = 'Back';
    back.setAttribute('aria-label', 'Go back');
    back.innerHTML = BACK_SVG;
    back.addEventListener('click', function () {
      if (window.history.length > 1) window.history.back();
      else window.location.href = prefix + 'Index.dc.html';
    });
    left.appendChild(back);

    /* home — straight to the cover index */
    var home = document.createElement('a');
    home.className = 'noor-chrome-toggle';
    home.href = prefix + 'Index.dc.html';
    home.title = 'Home';
    home.setAttribute('aria-label', 'Go to the cover index page');
    home.innerHTML = HOME_SVG;
    left.appendChild(home);

    /* sidebar toggle — opens the nav pane */
    var toggle = document.createElement('button');
    toggle.className = 'noor-chrome-toggle';
    toggle.id = 'noor-nav-toggle';
    toggle.type = 'button';
    toggle.title = 'Navigation';
    toggle.setAttribute('aria-label', 'Toggle navigation');
    toggle.setAttribute('aria-controls', 'noor-nav');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = SIDEBAR_SVG;
    toggle.addEventListener('click', toggleDrawer);
    left.appendChild(toggle);

    /* page title + subtitle — boards override these via
       window.NoorSetChromeTitle / window.NoorSetChromeSubtitle */
    var curPath = '';
    try { curPath = decodeURIComponent(path || ''); } catch (e) { curPath = path || ''; }
    var navItem = navItemFor(curPath);
    var titles = document.createElement('div');
    titles.className = 'noor-chrome-titles';
    var title = document.createElement('div');
    title.id = 'noor-chrome-title';
    title.className = 'noor-chrome-title';
    title.textContent = (navItem && navItem.name) || 'Noor';
    titles.appendChild(title);
    var sub = document.createElement('div');
    sub.id = 'noor-chrome-sub';
    sub.className = 'noor-chrome-sub';
    sub.style.display = 'none';
    /* subtitle: <meta name="noor-subtitle"> wins, else the site-map meta line;
       boards override it later through window.NoorSetChromeSubtitle */
    var metaSub = document.querySelector('meta[name="noor-subtitle"]');
    var subText = (metaSub && metaSub.getAttribute('content')) || (navItem && navItem.meta) || '';
    if (subText) {
      sub.textContent = subText;
      sub.style.display = '';
    }
    titles.appendChild(sub);
    left.appendChild(titles);

    bar.appendChild(left);
    buildDrawer(prefix);

    var seg = document.createElement('div');
    seg.className = 'noor-chrome-seg';
    MODES.forEach(function (m) {
      var btn = document.createElement('button');
      btn.id = 'noor-chrome-' + m.id;
      btn.title = m.label;
      btn.innerHTML = '<span class="mi"></span>';
      btn.firstChild.setAttribute('data-i', m.icon);
      btn.addEventListener('click', function () { setMode(m.id); });
      seg.appendChild(btn);
    });
    bar.appendChild(seg);

    document.body.appendChild(bar);
    syncChrome();
  }

  /* ---------- shared helpers ---------- */
  function isInteractive(t) {
    if (!t || !t.closest) return false;
    return !!t.closest('.poc-live, #noor-chrome, #noor-nav, #noor-nav-scrim, a, button, input, textarea, select, [onclick], .kp-key');
  }

  /* ---------- Figma-style canvas (board pages) ----------
     The storyboard (.poc-frames) becomes a free canvas driven by
     translate+scale: drag or two-finger-scroll pans in ANY
     direction (unbounded), pinch / ctrl+wheel zooms the BOARD
     ONLY, toward the cursor. The live device and top bar never
     move or zoom. The document itself does not scroll. */
  function initCanvas(frames) {
    var root = document.documentElement;
    root.classList.add('noor-canvas-mode');
    var px = 0, py = 0, z = 1, badge = null;

    function apply() {
      /* CSS vars on <html> drive the .poc-frames transform via the
         stylesheet — immune to the runtime re-rendering the node */
      root.style.setProperty('--noor-px', px + 'px');
      root.style.setProperty('--noor-py', py + 'px');
      root.style.setProperty('--noor-z', z);
      root.style.setProperty('background-position', px + 'px ' + py + 'px', 'important');
      root.style.setProperty('background-size', (22 * z) + 'px ' + (22 * z) + 'px', 'important');
      if (badge) badge.textContent = Math.round(z * 100) + '%';
    }

    function zoomAt(cx, cy, factor) {
      var nz = Math.min(2.5, Math.max(0.2, z * factor));
      if (nz === z) return;
      px = cx - (cx - px) * (nz / z);
      py = cy - (cy - py) * (nz / z);
      z = nz;
      apply();
    }

    /* wheel: two-finger pan in any direction; ctrl/cmd+wheel (and
       trackpad pinch, which Chrome reports as ctrl+wheel) zooms.
       CAPTURE phase so the canvas claims the gesture before any frame
       content can stopPropagation() it (e.g. a sheet scrim's onWheel) —
       otherwise panning dies over storyboard frames that show a sheet.
       The .poc-live check still exempts the live device so it scrolls. */
    window.addEventListener('wheel', function (e) {
      if (e.target && e.target.closest && e.target.closest('.poc-live, #noor-chrome, #noor-nav')) return;
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
      } else {
        px -= e.deltaX; py -= e.deltaY;
        apply();
      }
    }, { passive: false, capture: true });

    /* Safari trackpad pinch */
    var gestureBase = 1;
    window.addEventListener('gesturestart', function (e) { e.preventDefault(); gestureBase = z; });
    window.addEventListener('gesturechange', function (e) {
      e.preventDefault();
      var target = Math.min(2.5, Math.max(0.2, gestureBase * e.scale));
      zoomAt(e.clientX, e.clientY, target / z);
    });
    window.addEventListener('gestureend', function (e) { e.preventDefault(); });

    /* drag to pan */
    var panning = false, lx = 0, ly = 0;
    document.addEventListener('mousedown', function (e) {
      if (e.button !== 0 || isInteractive(e.target)) return;
      panning = true; lx = e.clientX; ly = e.clientY;
      root.classList.add('noor-panning');
      e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) {
      if (!panning) return;
      px += e.clientX - lx; py += e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      apply();
    });
    function endPan() { panning = false; root.classList.remove('noor-panning'); }
    window.addEventListener('mouseup', endPan);
    window.addEventListener('blur', endPan);

    /* zoom badge in the top bar — click to reset to 100% */
    var seg = document.querySelector('#noor-chrome .noor-chrome-seg');
    if (seg && seg.parentElement) {
      badge = document.createElement('button');
      badge.id = 'noor-zoom-badge';
      badge.title = 'Reset zoom & position';
      badge.addEventListener('click', function () { px = 0; py = 0; z = 1; apply(); });
      seg.parentElement.insertBefore(badge, seg);
    }

    /* ---- follow the state: auto-pan to the frame that gains the
       active ring, so the storyboard tracks the live device.
       Manual panning always wins (skipped mid-drag). ---- */
    var animTimer = null;
    function animatePan(dx, dy) {
      /* interval-driven (rAF starves in occluded tabs) with an
         eased curve and a guaranteed final snap */
      var sx = px, sy = py, t0 = Date.now(), D = 380;
      if (animTimer) clearInterval(animTimer);
      animTimer = setInterval(function () {
        var k = Math.min(1, (Date.now() - t0) / D);
        k = 1 - Math.pow(1 - k, 3);
        px = sx + dx * k; py = sy + dy * k;
        apply();
        if (k >= 1) { clearInterval(animTimer); animTimer = null; }
      }, 16);
    }
    function panIntoView(el) {
      var r = el.getBoundingClientRect();
      var pad = 48;
      var top = 52 + pad, left = pad;
      var right = window.innerWidth - 400 - pad;   /* clear of the live panel */
      var bottom = window.innerHeight - pad;
      var dx = 0, dy = 0;
      if (r.left < left) dx = left - r.left;
      else if (r.right > right) dx = right - r.right;
      if (r.height > bottom - top) dy = top - r.top;
      else if (r.top < top) dy = top - r.top;
      else if (r.bottom > bottom) dy = bottom - r.bottom;
      if (dx || dy) animatePan(dx, dy);
    }
    var mo = new MutationObserver(function (muts) {
      if (panning) return;
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        /* class flipped on an existing frame */
        if (m.type === 'attributes') {
          var t = m.target;
          if (t.nodeType === 1 && t.classList && t.classList.contains('is-active') &&
              String(m.oldValue || '').indexOf('is-active') < 0) {
            panIntoView(t);
            return;
          }
        }
        /* row re-rendered wholesale (innerHTML swap) — look inside added nodes */
        if (m.type === 'childList') {
          for (var j = 0; j < m.addedNodes.length; j++) {
            var n = m.addedNodes[j];
            if (n.nodeType !== 1) continue;
            var hit = n.classList && n.classList.contains('is-active') && n.classList.contains('noor-frame')
              ? n : (n.querySelector ? n.querySelector('.noor-frame.is-active') : null);
            if (hit) { panIntoView(hit); return; }
          }
        }
      }
    });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    /* debug hooks (harmless in production) */
    window.__noorCanvas = { panIntoView: panIntoView, isPanning: function () { return panning; }, state: function () { return { px: px, py: py, z: z }; } };
    /* initial: bring the currently-active frame into view (hash deep links) */
    setTimeout(function () {
      var act = document.querySelector('.noor-frame.is-active');
      if (act) panIntoView(act);
    }, 500);

    apply();
  }

  /* ---------- drag-to-scroll (non-board pages, e.g. Index) ---------- */
  function initScrollPan() {
    var panning = false, lx = 0, ly = 0;
    document.addEventListener('mousedown', function (e) {
      if (e.button !== 0 || isInteractive(e.target)) return;
      panning = true; lx = e.clientX; ly = e.clientY;
      document.documentElement.classList.add('noor-panning');
      e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) {
      if (!panning) return;
      window.scrollBy(lx - e.clientX, ly - e.clientY);
      lx = e.clientX; ly = e.clientY;
    });
    function endPan() { panning = false; document.documentElement.classList.remove('noor-panning'); }
    window.addEventListener('mouseup', endPan);
    window.addEventListener('blur', endPan);
  }

  function initPan() {
    /* board pages get the free canvas; the runtime may mount the
       template a tick after DOMContentLoaded, so retry briefly */
    var tries = 0;
    (function arm() {
      var frames = document.querySelector('.poc-stage .poc-frames');
      if (frames) { initCanvas(frames); return; }
      if (++tries < 40) { setTimeout(arm, 50); return; }
      initScrollPan();
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { buildChrome(); initPan(); });
  } else {
    buildChrome();
    initPan();
  }
})();
