/* BestShopio prototypes — shared shell (sidebar + header).
   Renders the SAME chrome as the Analytics module so the whole set looks like one app.

   Drop into any page:
     <div id="app" class="flex h-screen overflow-hidden">
       <div id="content-col" class="flex-1 flex flex-col min-w-0">
         <main id="view" class="flex-1 overflow-auto scroll-thin"> ...page content... </main>
       </div>
     </div>
     <script src="<base>assets/nav.js"></script>
     <script src="<base>assets/shell.js" data-base="<base>" data-active="<moduleId>"></script>
   <base> is '' on the hub (prototypes/) and '../' on a module page (prototypes/<id>/).
   shell.js also exposes window.ICONS for pages that want the same icon set. */
(function () {
  var me = document.currentScript;
  var BASE = (me && me.getAttribute('data-base')) || '';
  var ACTIVE = (me && me.getAttribute('data-active')) || 'home';

  var s = function (p) {
    return '<svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  };
  var ICONS = {
    home: s('<path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10h14V10"/>'),
    inbox: s('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'),
    tag: s('<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.3"/>'),
    userPen: s('<path d="M2 21a8 8 0 0 1 10.4-7.6"/><circle cx="10" cy="8" r="5"/><path d="M21.4 12.6a2 2 0 0 1 0 2.8L17 19.8 14 20l.2-3 4.4-4.4a2 2 0 0 1 2.8 0z"/>'),
    badgePercent: s('<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m15 9-6 6"/><path d="M9 9h.01"/><path d="M15 15h.01"/>'),
    newspaper: s('<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M16 6h-6v4h6z"/><path d="M16 14h-6M13 18h-3"/>'),
    globe: s('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14.5 14.5 0 0 0 0 18 14.5 14.5 0 0 0 0-18"/>'),
    analytics: s('<path d="M4 4v16h16"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>'),
    google: s('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
    settings: s('<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.3-1.3L14 1h-4l-.3 2.5a7 7 0 0 0-2.3 1.3l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.3l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.3 1.3L10 23h4l.3-2.5a7 7 0 0 0 2.3-1.3l2.3 1 2-3.4-2-1.5A7 7 0 0 0 19 12z"/>'),
    search: s('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    bell: s('<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'),
    chevDown: s('<path d="m6 9 6 6 6-6"/>'),
    menu: s('<path d="M3 6h18M3 12h18M3 18h18"/>'),
  };
  window.ICONS = ICONS;

  var MODS = window.NAV_MODULES || [];
  var FOOT = window.NAV_FOOTER || [];
  var SITE = window.SITE || { store: 'Store', role: 'U' };

  function navItem(m) {
    var icon = ICONS[m.icon] || ICONS.tag;
    var active = m.id === ACTIVE ? ' active' : '';
    var linkable = m.status === 'ready' || m.status === 'scaffold';
    if (linkable) {
      var wip = m.status === 'scaffold' ? '<span class="nav-soon">WIP</span>' : '';
      return '<a class="nav-item' + active + '" href="' + BASE + m.path + '">' + icon + '<span>' + m.label + '</span>' + wip + '</a>';
    }
    return '<div class="nav-item planned" title="Planned">' + icon + '<span>' + m.label + '</span><span class="nav-soon">Soon</span></div>';
  }

  function build() {
    var app = document.getElementById('app');
    var col = document.getElementById('content-col');
    if (!app || !col) return;

    var aside = document.createElement('aside');
    aside.className = 'app-sidebar scroll-thin';
    aside.innerHTML =
      '<a class="brand-row" href="' + BASE + 'index.html" title="Home">' +
        '<div class="brand-mark">' + String(SITE.store || 'S').charAt(0) + '</div>' +
        '<div style="font-weight:600;font-size:15px">' + (SITE.store || 'Store') + '</div>' +
        '<div style="margin-left:auto" class="muted">' + ICONS.chevDown + '</div>' +
      '</a>' +
      '<nav class="nav-scroll scroll-thin">' + MODS.map(navItem).join('') + '</nav>' +
      '<div style="border-top:1px solid var(--hair);padding:8px">' + FOOT.map(navItem).join('') + '</div>';

    var header = document.createElement('header');
    header.className = 'app-header';
    header.innerHTML =
      '<button class="sidebar-toggle" aria-label="Menu">' + ICONS.menu + '</button>' +
      '<div class="search-box">' + ICONS.search + '<span>Search</span><span style="margin-left:auto" class="kbd">Ctrl K</span></div>' +
      '<button class="hdr-ico" title="Notifications">' + ICONS.bell + '</button>' +
      '<div class="avatar">' + String(SITE.role || 'U').charAt(0) + '</div>';

    app.insertBefore(aside, app.firstChild);
    col.insertBefore(header, col.firstChild);

    var backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
    var toggle = header.querySelector('.sidebar-toggle');
    var close = function () { aside.classList.remove('open'); backdrop.classList.remove('show'); };
    if (toggle) toggle.addEventListener('click', function () { aside.classList.toggle('open'); backdrop.classList.toggle('show'); });
    backdrop.addEventListener('click', close);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
