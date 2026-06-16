/* Blog posts — latest articles from a chosen blog, as image+text cards.
   Single Blog block (max 1) picks which blog; its data-block-id wraps the whole grid. Grid or carousel. */
(function () {
  const OS = window.OS;
  OS.css('blog-posts', [
    '.bpx{box-sizing:border-box}.bpx *{box-sizing:border-box}',
    '.bpx .bp-head{margin-bottom:24px}',
    '.bpx .bp-sub{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.6;margin-bottom:6px}',
    '.bpx h2{margin:0;line-height:1.12}',
    '.bpx .bp-rich{font-size:15px;line-height:1.65;opacity:.8;margin-top:10px;max-width:640px}.bpx .bp-rich a{color:inherit}',
    '.bpx .bp-grid{display:grid;align-items:start}',
    '.bpx .bp-carousel{display:grid;grid-auto-flow:column;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none}',
    '.bpx .bp-carousel::-webkit-scrollbar{display:none}',
    '.bpx .bp-carousel>*{scroll-snap-align:start}',
    '.bpx .bp-card{display:flex;flex-direction:column;text-decoration:none;color:inherit;min-width:0}',
    '.bpx .bp-imgwrap{position:relative;overflow:hidden}',
    '.bpx .bp-img{width:100%;aspect-ratio:4/3;background-size:cover;background-position:center;background-color:#ececec;display:block;transition:transform .4s ease}',
    '.bpx a.bp-card:hover .bp-img{transform:scale(1.04)}',
    '.bpx .bp-chip{display:inline-block;align-self:flex-start;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:4px 9px;border-radius:999px;background:rgba(0,0,0,.06);margin:14px 0 8px}',
    '.bpx .bp-title{font-weight:600;line-height:1.3;margin:8px 0 0}',
    '.bpx .bp-card.has-chip .bp-title{margin-top:2px}',
    '.bpx .bp-excerpt{font-size:14px;line-height:1.6;opacity:.78;margin-top:8px}',
    '.bpx .bp-meta{font-size:12.5px;opacity:.6;margin-top:10px}',
    '.bpx .bp-view{display:flex;margin-top:26px}',
    '.bpx .bp-view a{text-decoration:none;cursor:pointer}',
    '.bpx .bp-empty{padding:28px;text-align:center;opacity:.6;font-size:13px;border:1px dashed rgba(0,0,0,.15);border-radius:12px}',
  ].join(''));

  OS.register('blog-posts', {
    name: 'Blog posts', group: 'content', icon: 'layers',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
      { key: 'heading', control: 'text', label: 'Heading', default: 'From the journal' },
      { key: 'content', control: 'richtext', label: 'Content', default: '' },
      { key: 'show_overview', control: 'toggle', label: 'Show excerpt', default: true },
      { key: 'show_date', control: 'toggle', label: 'Show date', default: true },
      { key: 'show_author', control: 'toggle', label: 'Show author', default: false },
      { key: 'show_category', control: 'toggle', label: 'Show category', default: true },
      { key: 'layout_style', control: 'select', label: 'Layout style', default: 'grid', options: [{ value: 'grid', label: 'Grid' }, { value: 'carousel', label: 'Carousel' }] },
      { key: 'desktop_columns', control: 'select', label: 'Columns · Desktop', default: '3', options: [{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }] },
      { key: 'mobile_columns', control: 'select', label: 'Columns · Mobile', default: '1', options: [{ value: '1', label: '1' }, { value: '2', label: '2' }] },
      { key: 'link_text', control: 'text', label: 'Link text', default: 'View all' },
      { key: 'link_url', control: 'url', label: 'Link URL', default: '' },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true, info: 'Blank inherits the theme text color.' },
    ],
    blocks: {
      name: 'Blog', kind: 'blog', max: 1,
      fields: [
        { key: 'blog', control: 'blog', label: 'Blog', default: 'blog-journal' },
      ],
      defaults: () => ({ blog: 'blog-journal' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('bp'), kind: 'blog', hidden: false, settings: { blog: 'blog-journal' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const headColor = OS.col(s.text, (t.colors && t.colors.heading_color) || '#1a1a1a');
      const bodyColor = OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob), gap = OS.gridGap(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const rad = OS.layoutRadius(t, 'image');
      const colsD = OS.clamp(Number(s.desktop_columns) || 3, 2, 4, 3);
      const colsM = OS.clamp(Number(s.mobile_columns) || 1, 1, 2, 1);

      const blogList = OS.sample.blogs || [];
      const block = (blocks || []).filter((b) => !b.hidden)[0] || null;
      const blogId = block ? block.settings.blog : 'blog-journal';
      const blog = blogList.find((b) => b.id === blogId) || blogList[0] || null;
      const posts = (blog && blog.posts) ? blog.posts.slice(0, colsD * 2) : [];

      const head = '<div class="bp-head" style="color:' + bodyColor + '">' +
        (s.subheading ? '<div class="bp-sub">' + OS.esc(s.subheading) + '</div>' : '') +
        (s.heading ? '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 26 : 34) + 'px;color:' + headColor + '">' + OS.esc(s.heading) + '</h2>' : '') +
        (s.content ? '<div class="bp-rich">' + s.content + '</div>' : '') + '</div>';

      const viewAll = s.link_text
        ? '<div class="bp-view"><a href="' + OS.esc(s.link_url || '#') + '" style="' + OS.btnStyle(t, { variant: 'secondary' }) + '">' + OS.esc(s.link_text) + '</a></div>'
        : '';

      const shell = (inner) => '<div class="bpx" style="background:' + bg + ';color:' + bodyColor + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + head + inner + '</div></div>';

      if (!posts.length) {
        // Keep the Blog block selectable even when the chosen blog has no posts.
        return shell('<div class="bp-empty" data-block-id="' + OS.esc(block ? block.id : '_') + '">Pick a blog with published articles to show its posts.</div>');
      }

      const muted = (t.colors && t.colors.secondary_color) || '#777';
      const cardCss = 'font-family:' + OS.bodyFamily(t);
      const card = (p) => {
        const hasChip = s.show_category && !!p.category;
        const metaBits = [];
        if (s.show_date && p.date) metaBits.push(OS.esc(p.date));
        if (s.show_author && p.author) metaBits.push(OS.esc(p.author));
        const meta = metaBits.join(' · ');
        return '<a class="bp-card' + (hasChip ? ' has-chip' : '') + '" href="#" style="' + cardCss + '">' +
          '<div class="bp-imgwrap" style="border-radius:' + rad + 'px"><div class="bp-img" style="background-image:url(' + OS.esc(p.image) + ');border-radius:' + rad + 'px"></div></div>' +
          (hasChip ? '<span class="bp-chip">' + OS.esc(p.category) + '</span>' : '') +
          '<div class="bp-title" style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.fs(t, 18) + 'px;color:' + headColor + '">' + OS.esc(p.title) + '</div>' +
          (s.show_overview && p.excerpt ? '<div class="bp-excerpt">' + OS.esc(p.excerpt) + '</div>' : '') +
          (meta ? '<div class="bp-meta" style="color:' + muted + '">' + meta + '</div>' : '') +
          '</a>';
      };

      const cells = posts.map(card).join('');
      const carousel = s.layout_style === 'carousel';
      let grid;
      if (carousel) {
        const trackCols = mob ? Math.max(colsM, 1) : colsD;
        const basis = 'minmax(' + Math.round(100 / (trackCols + (mob ? 0.25 : 0.4))) + '%,1fr)';
        grid = '<div class="bp-carousel" style="grid-auto-columns:' + basis + ';gap:' + gap + 'px;padding-bottom:4px">' + cells + '</div>';
      } else {
        const cols = mob ? colsM : colsD;
        grid = '<div class="bp-grid" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr));gap:' + gap + 'px">' + cells + '</div>';
      }

      // The single Blog block wraps the whole grid so selecting it in the tree highlights the posts.
      const gridWrap = '<div data-block-id="' + OS.esc(block ? block.id : '_') + '">' + grid + '</div>';
      return shell(gridWrap + viewAll);
    },
  });
})();
