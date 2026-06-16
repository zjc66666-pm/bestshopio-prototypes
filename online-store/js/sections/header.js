/* Header — global site nav. Ported (lean) from header-v2.canvas.tsx.
   Nav comes from a Menu resource (no blocks). Desktop dropdown / mega on hover; mobile = drawer.
   Search input honours global Forms tokens. */
(function () {
  const OS = window.OS;
  OS.css('header', [
    '.hdx{position:relative;font-family:inherit}.hdx *{box-sizing:border-box}',
    '.hdx .hd-bar{display:flex;align-items:center;gap:18px;padding:16px 0;min-height:64px}',
    '.hdx .hd-inner{margin:0 auto;width:100%}',
    '.hdx .hd-logo{font-weight:800;letter-spacing:-.02em;line-height:1;flex:none}',
    '.hdx .hd-logo img{display:block;object-fit:contain}',
    '.hdx .hd-nav{display:flex;gap:22px;align-items:center;flex:1}',
    '.hdx .hd-nav.center{justify-content:center}.hdx .hd-nav.right{justify-content:flex-end}',
    '.hdx .hd-li{position:relative}',
    '.hdx .hd-link{display:inline-flex;align-items:center;gap:4px;font-size:13.5px;font-weight:600;cursor:pointer;white-space:nowrap;color:inherit;text-decoration:none}',
    '.hdx .hd-link .cv{font-size:9px;opacity:.6}',
    '.hdx .hd-drop{position:absolute;top:100%;left:0;background:#fff;color:#111;border:1px solid #eee;box-shadow:0 12px 30px rgba(0,0,0,.12);border-radius:10px;padding:14px;min-width:200px;opacity:0;visibility:hidden;transform:translateY(6px);transition:.15s;z-index:20}',
    '.hdx .hd-li:hover .hd-drop{opacity:1;visibility:visible;transform:none}',
    '.hdx .hd-drop.mega{display:grid;gap:18px}',
    '.hdx .hd-col-h{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9aa3b0;margin-bottom:8px}',
    '.hdx .hd-da{display:block;font-size:13px;color:#333;padding:5px 0;text-decoration:none;white-space:nowrap}.hdx .hd-da:hover{color:var(--brand,#0066e6)}',
    '.hdx .hd-icons{display:flex;align-items:center;gap:8px;flex:none}',
    '.hdx .hd-ic{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:inherit;background:none;border:0}',
    '.hdx .hd-ic:hover{background:rgba(0,0,0,.06)}.hdx .hd-ic svg{width:20px;height:20px}',
    '.hdx .hd-pill{font-size:12px;font-weight:600;padding:6px 10px;border-radius:999px;cursor:pointer;display:inline-flex;align-items:center;gap:4px}',
    '.hdx .hd-search{flex:1;max-width:520px;margin:0 auto}',
    '.hdx .hd-hamb{display:none;background:none;border:0;cursor:pointer;color:inherit;padding:0}',
    '.hdx.mob .hd-nav,.hdx.mob .hd-search{display:none}.hdx.mob .hd-hamb{display:grid;place-items:center;width:38px;height:38px}',
    '.hdx.mob .hd-bar{min-height:56px;padding:12px 0}',
    '.hdx .hd-drawer{position:absolute;top:0;left:0;bottom:0;width:min(86%,320px);background:#fff;color:#111;z-index:40;transform:translateX(-100%);transition:transform .2s;box-shadow:8px 0 24px rgba(0,0,0,.12);display:flex;flex-direction:column;height:100%}',
    '.hdx .hd-drawer.open{transform:none}',
    '.hdx .hd-scrim{position:absolute;inset:0;background:rgba(0,0,0,.35);opacity:0;visibility:hidden;transition:.2s;z-index:39}.hdx .hd-scrim.open{opacity:1;visibility:visible}',
    '.hdx .hd-dh{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #eee;font-weight:700}',
    '.hdx .hd-dl{padding:8px 0;overflow:auto;flex:1}',
    '.hdx .hd-drow{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;font-size:15px;cursor:pointer;border-bottom:1px solid #f4f4f4}',
    '.hdx .hd-dsub{background:#fafafa}.hdx .hd-dsub .hd-drow{padding-left:28px;font-size:14px;color:#555}',
  ].join(''));

  function menuOf(s) { return OS.sample.menus.find((m) => m.id === s.menu) || OS.sample.menus[0]; }

  OS.register('header', {
    name: 'Header', group: 'header', icon: 'header',
    schema: [
      { key: 'variant', control: 'segmented', label: 'Header variant', default: 'basic', options: [{ value: 'basic', label: 'Basic header' }, { value: 'search', label: 'Search header' }] },
      { key: 'layout', control: 'segmented', label: 'Header layout', default: 'logoLeft', options: [{ value: 'logoLeft', label: 'Logo left' }, { value: 'logoTopCenter', label: 'Logo top center' }], visibleWhen: (s) => s.variant === 'basic' },
      { sub: 'Logo' },
      { key: 'logo_image', control: 'image', label: 'Logo image', default: '' },
      { key: 'logo_text', control: 'text', label: 'Logo text', default: 'AURA' },
      { key: 'logo_width', control: 'range', label: 'Logo width (desktop)', min: 48, max: 220, step: 4, unit: 'px', default: 96 },
      { sub: 'Menu' },
      { key: 'menu', control: 'menu', label: 'Main menu', default: 'menu-main' },
      { key: 'menu_alignment', control: 'segmented', label: 'Menu alignment', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }], visibleWhen: (s) => s.variant === 'search' || s.layout === 'logoTopCenter' },
      { sub: 'Search · Account · Cart' },
      { key: 'show_search', control: 'toggle', label: 'Show search', default: false, visibleWhen: (s) => s.variant === 'basic' },
      { key: 'search_placeholder', control: 'text', label: 'Search placeholder', default: 'Search products' },
      { key: 'show_account', control: 'toggle', label: 'Show account', default: true },
      { key: 'show_cart', control: 'toggle', label: 'Show cart', default: true },
      { key: 'show_language', control: 'toggle', label: 'Show language selector', default: true },
      { key: 'show_currency', control: 'toggle', label: 'Show currency selector', default: true },
      { sub: 'Behavior' },
      { key: 'sticky', control: 'toggle', label: 'Sticky on scroll', default: true },
      { key: 'border_bottom', control: 'toggle', label: 'Bottom border', default: true },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: '#FFFFFF', allowTransparent: true },
      { key: 'text_color', control: 'color', label: 'Text / icon', default: '#111827' },
    ],
    defaults: () => ({}),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const bg = OS.bgOrTransparent(s.background), fg = s.text_color || '#111';
      const padH = OS.pagePad(t, mob), maxW = OS.pageWidth(t);
      const isSearch = s.variant === 'search';
      const menu = menuOf(s);
      const logo = s.logo_image
        ? '<img src="' + OS.esc(s.logo_image) + '" style="width:' + OS.clamp(s.logo_width, 48, 220, 96) + 'px" alt="logo">'
        : '<span class="hd-logo" style="font-size:' + OS.fs(t, 22) + 'px;color:' + fg + '">' + OS.esc(s.logo_text || 'LOGO') + '</span>';
      const navItem = (it) => {
        const kids = it.children || [];
        if (!kids.length) return '<li class="hd-li"><a class="hd-link" href="' + OS.esc(it.url) + '" style="color:' + fg + '">' + OS.esc(it.title) + '</a></li>';
        const mega = kids.some((k) => (k.children || []).length);
        const drop = mega
          ? '<div class="hd-drop mega" style="grid-template-columns:repeat(' + Math.min(kids.length, 4) + ',minmax(150px,1fr))">' + kids.map((k) => '<div><div class="hd-col-h">' + OS.esc(k.title) + '</div>' + ((k.children || []).length ? k.children : [k]).map((c) => '<a class="hd-da" href="' + OS.esc(c.url) + '">' + OS.esc(c.title) + '</a>').join('') + '</div>').join('') + '</div>'
          : '<div class="hd-drop">' + kids.map((k) => '<a class="hd-da" href="' + OS.esc(k.url) + '">' + OS.esc(k.title) + '</a>').join('') + '</div>';
        return '<li class="hd-li"><a class="hd-link" href="' + OS.esc(it.url) + '" style="color:' + fg + '">' + OS.esc(it.title) + '<span class="cv">▾</span></a>' + drop + '</li>';
      };
      const nav = '<ul class="hd-nav ' + (isSearch || s.layout === 'logoTopCenter' ? (s.menu_alignment || 'center') : '') + '" style="list-style:none;margin:0;padding:0">' + (menu.items || []).map(navItem).join('') + '</ul>';
      const searchBar = '<div class="hd-search"><input class="ts-storefront-input" placeholder="' + OS.esc(s.search_placeholder || 'Search') + '" style="' + OS.inputStyle(t) + ';width:100%"></div>';
      const ico = (name) => '<button class="hd-ic" style="color:' + fg + '">' + OS.icon(name) + '</button>';
      const pills = (!mob ? (s.show_language ? '<span class="hd-pill" style="color:' + fg + '">EN ▾</span>' : '') + (s.show_currency ? '<span class="hd-pill" style="color:' + fg + '">USD ▾</span>' : '') : '');
      const icons = '<div class="hd-icons">' + pills + ((s.show_search || isSearch) && mob ? ico('search') : '') + (s.show_account ? ico('user') : '') + (s.show_cart ? ico('cart') : '') + '</div>';

      let bar;
      if (mob) {
        bar = '<button class="hd-hamb" data-hd-open style="color:' + fg + '">' + OS.icon('menu') + '</button>' + logo + '<div style="flex:1"></div>' + icons;
      } else if (isSearch) {
        bar = logo + searchBar + icons + '<div style="position:absolute;left:0;right:0;top:100%">' + '</div>';
      } else if (s.layout === 'logoTopCenter') {
        bar = '<div style="flex:1"></div>' + logo + '<div style="flex:1;display:flex;justify-content:flex-end">' + icons + '</div>';
      } else {
        bar = logo + nav + ((s.show_search) ? '<div class="hd-ic" style="color:' + fg + '">' + OS.icon('search') + '</div>' : '') + icons;
      }
      const secondRow = (!mob && (isSearch || s.layout === 'logoTopCenter')) ? '<div style="padding-bottom:12px">' + nav + '</div>' : '';
      const drawer = mob ? drawerHtml(menu, fg) : '';
      return '<div class="hdx' + (mob ? ' mob' : '') + '" style="background:' + bg + ';' + (s.border_bottom ? 'border-bottom:1px solid ' + ((t.colors && t.colors.border_color) || '#eee') + ';' : '') + 'font-family:' + OS.bodyFamily(t) + '">' +
        '<div class="hd-inner" style="max-width:' + maxW + 'px;padding:0 ' + padH + 'px"><div class="hd-bar">' + bar + '</div>' + secondRow + '</div>' + drawer + '</div>';
    },
    hydrate: function (root) {
      const open = root.querySelector('[data-hd-open]'); const dr = root.querySelector('.hd-drawer'); const sc = root.querySelector('.hd-scrim'); const cl = root.querySelector('[data-hd-close]');
      const setOpen = (v) => { if (dr) dr.classList.toggle('open', v); if (sc) sc.classList.toggle('open', v); };
      if (open) open.onclick = (e) => { e.stopPropagation(); setOpen(true); };
      if (cl) cl.onclick = (e) => { e.stopPropagation(); setOpen(false); };
      if (sc) sc.onclick = (e) => { e.stopPropagation(); setOpen(false); };
      root.querySelectorAll('[data-hd-acc]').forEach((r) => r.onclick = (e) => { e.stopPropagation(); const sub = r.nextElementSibling; if (sub) sub.style.display = sub.style.display === 'none' ? 'block' : 'none'; });
    },
  });

  function drawerHtml(menu, fg) {
    const rows = (menu.items || []).map((it) => {
      const kids = it.children || [];
      if (!kids.length) return '<div class="hd-drow">' + OS.esc(it.title) + '</div>';
      return '<div class="hd-drow" data-hd-acc>' + OS.esc(it.title) + '<span>▾</span></div><div class="hd-dsub" style="display:none">' + kids.map((k) => '<div class="hd-drow">' + OS.esc(k.title) + '</div>').join('') + '</div>';
    }).join('');
    return '<div class="hd-scrim" data-hd-close></div><div class="hd-drawer"><div class="hd-dh">Menu<button class="hd-ic" data-hd-close style="color:#111">' + OS.icon('x') + '</button></div><div class="hd-dl">' + rows + '</div></div>';
  }
})();
