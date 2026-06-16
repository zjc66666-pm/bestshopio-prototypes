/* Newsletter — email capture block (no child blocks). Ported from newsletter.canvas.tsx.
   The email input honours the global Forms tokens (cascade demo); layout stacked / inline / image-side. */
(function () {
  const OS = window.OS;
  OS.css('newsletter', [
    '.nlx{box-sizing:border-box}.nlx *{box-sizing:border-box}',
    '.nlx h2{margin:0 0 10px;line-height:1.15}',
    '.nlx .nl-rich{font-size:15px;line-height:1.6;opacity:.9;margin-bottom:18px}.nlx .nl-rich a{color:inherit}',
    '.nlx .nl-form{display:flex;gap:10px;flex-wrap:wrap}',
    '.nlx .nl-input{flex:1;min-width:200px;font-family:inherit}',
    '.nlx .nl-btn{display:inline-flex;align-items:center;justify-content:center;border:0;cursor:pointer;font-weight:600;font-family:inherit}',
    '.nlx .nl-sub{font-size:12px;opacity:.7;margin-top:12px;line-height:1.5}.nlx .nl-sub a{color:inherit}',
    '.nlx .nl-img{background-size:cover;background-position:center;border-radius:14px;min-height:240px}',
    '.nlx .nl-grid{display:grid;gap:40px;align-items:center}',
  ].join(''));

  OS.register('newsletter', {
    name: 'Newsletter', group: 'engagement', icon: 'layers',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'layout', control: 'segmented', label: 'Layout', default: 'stacked', options: [{ value: 'stacked', label: 'Stacked' }, { value: 'inline', label: 'Inline' }, { value: 'image', label: 'Image side' }] },
      { key: 'image', control: 'image', label: 'Image', default: '', visibleWhen: (s) => s.layout === 'image' },
      { key: 'image_position', control: 'segmented', label: 'Image position', default: 'left', options: [{ value: 'left', label: 'Image left' }, { value: 'right', label: 'Image right' }], visibleWhen: (s) => s.layout === 'image' },
      { sub: 'Content' },
      { key: 'heading', control: 'text', label: 'Heading', default: 'Join the list, save 10%' },
      { key: 'content', control: 'richtext', label: 'Content', default: 'Sign up for promotions, new arrivals and once-in-a-lifetime deals.' },
      { key: 'email_placeholder', control: 'text', label: 'Email placeholder', default: 'Enter your email' },
      { key: 'button', control: 'text', label: 'Button', default: 'Subscribe' },
      { key: 'show_privacy', control: 'toggle', label: 'Show privacy text', default: true },
      { key: 'privacy_text', control: 'richtext', label: 'Privacy text', default: 'By subscribing you agree to our <a href="/pages/privacy">Privacy Policy</a>.', visibleWhen: (s) => s.show_privacy },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: '#103635', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '#FFFFFF' },
      { key: 'button_background', control: 'color', label: 'Button background', default: '#FFFFFF' },
      { key: 'button_text_color', control: 'color', label: 'Button text', default: '#103635' },
    ],
    defaults: () => ({}),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const bg = OS.bgOrTransparent(s.background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const inputH = (t.forms && t.forms.input_height) || 44;
      const inp = '<input class="nl-input ts-storefront-input" placeholder="' + OS.esc(s.email_placeholder || 'Enter your email') + '" style="' + OS.inputStyle(t) + '">';
      const btn = '<button class="nl-btn" style="background:' + (s.button_background || '#fff') + ';color:' + (s.button_text_color || '#103635') + ';height:' + inputH + 'px;padding:0 22px;border-radius:' + ((t.forms && t.forms.input_border_radius) || 0) + 'px;font-size:' + OS.fs(t, 13) + 'px">' + OS.esc(s.button || 'Subscribe') + '</button>';
      const heading = '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 24 : 32) + 'px;color:' + (s.text || '#fff') + '">' + OS.esc(s.heading || 'Newsletter') + '</h2>';
      const content = s.content ? '<div class="nl-rich">' + s.content + '</div>' : '';
      const privacy = s.show_privacy && s.privacy_text ? '<div class="nl-sub">' + s.privacy_text + '</div>' : '';
      const block =
        (s.layout === 'inline' && !mob
          ? '<div style="display:flex;align-items:center;gap:32px;justify-content:space-between;flex-wrap:wrap"><div style="flex:1;min-width:260px">' + heading + content + '</div><div style="flex:1;min-width:280px"><div class="nl-form">' + inp + btn + '</div>' + privacy + '</div></div>'
          : '<div style="max-width:520px;' + (s.layout === 'image' ? '' : 'margin:0 auto;text-align:center') + '">' + heading + content + '<div class="nl-form">' + inp + btn + '</div>' + privacy + '</div>');
      let inner = block;
      if (s.layout === 'image' && !mob) {
        const media = '<div class="nl-img" style="background-image:url(' + OS.esc(s.image || OS.sample.IMG.iwt) + ')"></div>';
        inner = '<div class="nl-grid" style="grid-template-columns:1fr 1fr">' + (s.image_position === 'right' ? '<div>' + block + '</div>' + media : media + '<div>' + block + '</div>') + '</div>';
      }
      return '<div class="nlx" style="background:' + bg + ';color:' + (s.text || '#fff') + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + inner + '</div></div>';
    },
  });
})();
