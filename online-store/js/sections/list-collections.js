/* List collections — the all-collections directory grid for the "Collection list" page (/collections).
   Ported from the team's collection-canvas-demo (listCollections section). Auto-lists every active
   collection by default; pick a subset to show specific collections in a chosen order. Unlike the
   Collection list *section* (curated blocks), this one is data-driven and applies one uniform
   overlay / text color to every card. Re-homed onto the BestShopio OS section framework. */
(function () {
  const OS = window.OS;
  OS.css('list-collections', [
    '.lcx{box-sizing:border-box}.lcx *{box-sizing:border-box}',
    '.lcx h2{margin:0 0 22px;line-height:1.12}',
    '.lcx .lc-grid{display:grid}',
    '.lcx .lc-card{position:relative;display:block;overflow:hidden;aspect-ratio:3/4;text-decoration:none;border-radius:10px}',
    '.lcx .lc-card .bg{position:absolute;inset:0;background-size:cover;background-position:center;transition:transform .4s}',
    '.lcx .lc-card:hover .bg{transform:scale(1.05)}',
    '.lcx .lc-card .ov{position:absolute;inset:0}',
    '.lcx .lc-card .cont{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:18px;z-index:2}',
    '.lcx .lc-card .ch{font-weight:700;line-height:1.15}',
    '.lcx .lc-card .ccount{font-size:12px;opacity:.85;margin-top:4px}',
    '.lcx .lc-empty{border:1px dashed rgba(0,0,0,.2);border-radius:10px;padding:40px 20px;text-align:center;opacity:.6;font-size:14px}',
  ].join(''));

  OS.register('list-collections', {
    name: 'List collections', group: 'collection', icon: 'grid',
    schema: [
      { sub: 'Collections' },
      { key: 'selected_collections', control: 'collections', label: 'Selected collections', default: [], info: 'Leave empty to show all active collections. Selected collections display in the chosen order.' },
      { sub: 'Layout' },
      { key: 'collections_per_row_mobile', control: 'segmented', label: 'Collections per row · Mobile', default: '1', options: [{ value: '1', label: '1' }, { value: '2', label: '2' }] },
      { key: 'collections_per_row_desktop', control: 'range', label: 'Collections per row · Desktop', default: 3, min: 2, max: 6, step: 1 },
      { sub: 'Colors' },
      { key: 'text_color', control: 'color', label: 'Text', default: '#FFFFFF' },
      { key: 'overlay_color', control: 'color', label: 'Overlay', default: '#000000' },
      { key: 'overlay_opacity', control: 'range', label: 'Overlay opacity', min: 0, max: 80, step: 1, unit: '%', default: 30 },
      { sub: 'Advanced' },
      { info: 'Theme settings are inherited globally; this section only exposes its own overrides.' },
      { key: 'custom_css', control: 'custom_css', label: 'Custom CSS', default: '' },
    ],
    defaults: () => ({ selected_collections: [] }),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const headColor = (t.colors && t.colors.heading_color) || '#1a1a1a';
      const textColor = (t.colors && t.colors.text_color) || '#1a1a1a';
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob), gap = OS.gridGap(t, mob);
      const maxW = OS.pageWidth(t) + 'px';
      const cols = mob ? (Number(s.collections_per_row_mobile) || 1) : OS.clamp(s.collections_per_row_desktop, 2, 6, 3);

      // selected subset (in order) or all active collections
      const all = OS.sample.collections || [];
      const sel = Array.isArray(s.selected_collections) ? s.selected_collections : [];
      const list = sel.length ? sel.map((id) => all.find((c) => c.id === id)).filter(Boolean) : all;

      const cards = list.map((c) => {
        const img = c.image || OS.sample.IMG.cat1;
        return '<a class="lc-card" href="/collections/' + OS.esc(c.id) + '">' +
          '<div class="bg" style="background-image:url(' + OS.esc(img) + ')"></div>' +
          '<div class="ov" style="background:' + OS.bgOrTransparent(s.overlay_color) + ';opacity:' + ((s.overlay_opacity || 0) / 100) + '"></div>' +
          '<div class="cont" style="color:' + (s.text_color || '#fff') + '">' +
          '<div class="ch" style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 18 : 22) + 'px">' + OS.esc(c.title) + '</div>' +
          (c.count != null ? '<div class="ccount">' + c.count + ' products</div>' : '') + '</div></a>';
      }).join('');

      return '<div class="lcx" style="color:' + textColor + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' +
        '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 26 : 34) + 'px;color:' + headColor + '">All collections</h2>' +
        '<div class="lc-grid" style="grid-template-columns:repeat(' + cols + ',1fr);gap:' + gap + 'px">' +
        (list.length ? cards : '<div class="lc-empty">No collections to show. Pick collections on the right, or add collections to your store.</div>') +
        '</div></div>' + (s.custom_css ? '<style>' + s.custom_css + '</style>' : '') + '</div>';
    },
  });
})();
