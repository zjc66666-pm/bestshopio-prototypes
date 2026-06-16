/* FAQ — accordion questions + support panel. Ported from faq.canvas.tsx.
   Homogeneous Item blocks (question / answer, max 20). Two layouts: FAQ-and-text / FAQ-and-media. */
(function () {
  const OS = window.OS;
  OS.css('faq', [
    '.faqx{box-sizing:border-box}',
    '.faqx *{box-sizing:border-box}',
    '.faqx .faq-sub{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin-bottom:8px}',
    '.faqx h2{margin:0 0 12px;line-height:1.15}',
    '.faqx .faq-rich{font-size:14px;line-height:1.6;opacity:.85}.faqx .faq-rich a{color:inherit}',
    '.faqx .faq-acc{margin-top:18px;border-radius:12px;overflow:hidden}',
    '.faqx .faq-item{border-bottom:1px solid rgba(0,0,0,.08)}',
    '.faqx .faq-q{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;text-align:left;border:0;background:none;cursor:pointer;padding:16px 14px;font-size:15px;font-weight:600;color:inherit;font-family:inherit}',
    '.faqx .faq-chev{flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.06);transition:transform .2s}',
    '.faqx .faq-item.open .faq-chev{transform:rotate(180deg)}',
    '.faqx .faq-a{display:grid;grid-template-rows:0fr;transition:grid-template-rows .22s ease}',
    '.faqx .faq-item.open .faq-a{grid-template-rows:1fr}',
    '.faqx .faq-a-in{overflow:hidden}.faqx .faq-a-in .pad{padding:0 14px 16px;font-size:14px;line-height:1.6;opacity:.85}',
    '.faqx .faq-btn{display:inline-flex;align-items:center;justify-content:center;border:0;cursor:pointer;border-radius:999px;padding:13px 32px;font-size:13px;font-weight:600;margin-top:20px;font-family:inherit}',
    '.faqx .faq-support{margin-top:18px;font-size:13px;opacity:.8;line-height:1.7}',
    '.faqx .faq-media{border-radius:14px;overflow:hidden;background-size:cover;background-position:center;min-height:280px}',
    '.faqx .faq-grid{display:grid;gap:48px;align-items:start}',
    '.faqx .faq-empty{padding:24px;text-align:center;opacity:.6;font-size:13px}',
  ].join(''));

  OS.register('faq', {
    name: 'FAQ', group: 'engagement', icon: 'layers',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'layout_style', control: 'select', label: 'Layout style', default: 'and-text', options: [{ value: 'and-text', label: 'FAQ and text' }, { value: 'and-media', label: 'FAQ and media' }] },
      { sub: 'Content' },
      { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
      { key: 'heading', control: 'text', label: 'Heading', default: 'FAQ' },
      { key: 'content', control: 'richtext', label: 'Content', default: 'Still have questions? Reach out any time at <a href="mailto:hello@aura.shop">hello@aura.shop</a>.' },
      { key: 'support_hours', control: 'text', label: 'Support operating hours', default: 'Our support team is available every day.', visibleWhen: (s) => s.layout_style === 'and-text' },
      { key: 'answer_time', control: 'text', label: 'Average answer time', default: 'Average answer time: 12–24h', visibleWhen: (s) => s.layout_style === 'and-text' },
      { key: 'text_position', control: 'segmented', label: 'Text position', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }], visibleWhen: (s) => s.layout_style === 'and-text' },
      { key: 'media_image', control: 'image', label: 'Media image', default: '', visibleWhen: (s) => s.layout_style === 'and-media' },
      { key: 'media_position', control: 'segmented', label: 'Media position', default: 'right', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }], visibleWhen: (s) => s.layout_style === 'and-media' },
      { key: 'media_width', control: 'range', label: 'Media width', min: 30, max: 60, step: 1, unit: '%', default: 50, visibleWhen: (s) => s.layout_style === 'and-media' },
      { sub: 'Call to action' },
      { key: 'button_text', control: 'text', label: 'Button text', default: 'Get in touch' },
      { key: 'button_link', control: 'url', label: 'Button link', default: '#' },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'heading_color', control: 'color', label: 'Heading', default: '', allowTransparent: true, info: 'Blank inherits the theme heading color.' },
      { key: 'button_background', control: 'color', label: 'Button background', default: '#0F0F0F' },
      { key: 'button_text_color', control: 'color', label: 'Button text', default: '#FFFFFF' },
      { key: 'accordion_background', control: 'color', label: 'Accordion background', default: '#F4F4F4', allowTransparent: true },
    ],
    blocks: {
      name: 'Item', kind: 'item', max: 20,
      fields: [
        { key: 'question', control: 'text', label: 'Question', default: '', required: true },
        { key: 'answer', control: 'richtext', label: 'Answer', default: '', required: true },
      ],
      defaults: () => ({ question: 'New question', answer: 'Answer text goes here.' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('faq'), kind: 'item', hidden: false, settings: { question: 'Do you ship overseas?', answer: 'Yes — we ship worldwide. Shipping is calculated at checkout based on your destination.' } },
      { id: OS.uid('faq'), kind: 'item', hidden: false, settings: { question: 'How long does delivery take?', answer: 'Standard delivery is 5–8 business days. Express options are available at checkout.' } },
      { id: OS.uid('faq'), kind: 'item', hidden: false, settings: { question: 'What is your return policy?', answer: 'Returns are free within 30 days of delivery. Items must be unworn with tags attached.' } },
      { id: OS.uid('faq'), kind: 'item', hidden: false, settings: { question: 'Need help with your order?', answer: 'Reach our team any time — we usually reply within a day.' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const head = OS.col(s.heading_color, (t.colors && t.colors.heading_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const items = (blocks || []).filter((b) => !b.hidden && b.settings.question);
      const accBg = OS.bgOrTransparent(s.accordion_background);
      const acc = items.length
        ? '<div class="faq-acc" style="background:' + accBg + '">' + items.map((b) =>
            '<div class="faq-item" data-block-id="' + OS.esc(b.id) + '"><button class="faq-q">' + OS.esc(b.settings.question) +
            '<span class="faq-chev">' + OS.icon('chev') + '</span></button>' +
            '<div class="faq-a"><div class="faq-a-in"><div class="pad faq-rich">' + (b.settings.answer || '') + '</div></div></div></div>').join('') + '</div>'
        : '<div class="faq-empty">Add an FAQ item to get started.</div>';
      const headerBlk = (align) =>
        (s.subheading ? '<div class="faq-sub">' + OS.esc(s.subheading) + '</div>' : '') +
        '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 26 : 34) + 'px;color:' + head + ';text-align:' + align + '">' + OS.esc(s.heading || 'FAQ') + '</h2>' +
        (s.content ? '<div class="faq-rich" style="text-align:' + align + '">' + s.content + '</div>' : '');
      const btn = s.button_text ? '<a class="faq-btn" href="' + OS.esc(s.button_link || '#') + '" style="background:' + (s.button_background || '#0f0f0f') + ';color:' + (s.button_text_color || '#fff') + '">' + OS.esc(s.button_text) + '</a>' : '';
      const support = (s.support_hours || s.answer_time) ? '<div class="faq-support">' + OS.esc(s.support_hours || '') + (s.answer_time ? '<br>' + OS.esc(s.answer_time) : '') + '</div>' : '';

      let inner;
      if (s.layout_style === 'and-media' && !mob) {
        const mw = OS.clamp(s.media_width, 30, 60, 50);
        const media = '<div class="faq-media" style="background-image:url(' + OS.esc(s.media_image || OS.sample.IMG.iwt) + ')"></div>';
        const text = '<div>' + headerBlk('left') + acc + '<div style="text-align:center">' + btn + '</div></div>';
        const cols = s.media_position === 'left' ? (mw + '% 1fr') : ('1fr ' + mw + '%');
        inner = '<div class="faq-grid" style="grid-template-columns:' + cols + '">' + (s.media_position === 'left' ? media + text : text + media) + '</div>';
      } else if (s.layout_style === 'and-text' && !mob && s.text_position !== 'center') {
        const text = '<div>' + headerBlk('left') + support + btn + '</div>';
        inner = '<div class="faq-grid" style="grid-template-columns:4fr 6fr">' + (s.text_position === 'right' ? acc + text : text + acc) + '</div>';
      } else {
        inner = '<div style="max-width:760px;margin:0 auto;text-align:' + (mob ? 'center' : (s.text_position || 'left')) + '">' + headerBlk(mob ? 'center' : (s.text_position || 'left')) + acc + support + '<div style="text-align:center">' + btn + '</div></div>';
      }
      return '<div class="faqx" style="background:' + bg + ';color:' + ((t.colors && t.colors.text_color) || '#1a1a1a') + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + inner + '</div></div>';
    },
    hydrate: function (root) {
      root.querySelectorAll('.faq-q').forEach((q) => q.addEventListener('click', () => { q.closest('.faq-item').classList.toggle('open'); }));
    },
  });
})();
