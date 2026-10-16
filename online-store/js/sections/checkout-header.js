/* Checkout · Header (PRD §5.1) — brand bar at the top of the checkout.
   Composable model: a structural axis (Logo alignment) + independent content
   modules (Trust message / Contact / Cart). Each module is an on/off toggle so
   the layout is extensible — new modules slot into the start / center / end
   regions without inventing a new fixed-combo enum. No nav / search / account
   (focused, trustworthy transaction environment). Logo falls back to the store
   brand name (AURA). */
(function () {
  if (!window.OS) return;
  const { esc, icon } = OS;

  OS.register('checkout-header', {
    name: 'Header', icon: 'image',
    schema: [
      { sub: 'Logo' },
      { key: 'logo_image', label: 'Logo image', control: 'image', default: '' },
      { key: 'logo_width', label: 'Logo width PC', control: 'range', min: 40, max: 300, step: 1, unit: 'px', default: 120 },
      { key: 'logo_width_mobile', label: 'Logo width mobile', control: 'range', min: 40, max: 240, step: 1, unit: 'px', default: 100 },
      { key: 'logo_position', label: 'Logo alignment', control: 'select', default: 'left', options: [
        { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' } ] },
      { sub: 'Trust message' },
      { key: 'show_trust_text', label: 'Show trust message', control: 'toggle', default: true },
      { key: 'trust_text', label: 'Text', control: 'text', default: 'Secure checkout', placeholder: 'Please enter', visibleWhen: (v) => v.show_trust_text !== false },
      { sub: 'Secure badge' },
      { key: 'show_secure_badge', label: 'Show secure badge', control: 'toggle', default: false },
      { key: 'secure_text', label: 'Text', control: 'text', default: 'SSL secure', placeholder: 'Please enter', visibleWhen: (v) => !!v.show_secure_badge },
      { sub: 'Contact' },
      { key: 'show_contact_info', label: 'Show contact', control: 'toggle', default: false },
      { key: 'contact_title', label: 'Title', control: 'text', default: '', placeholder: 'Please enter', visibleWhen: (v) => !!v.show_contact_info },
      { key: 'contact_email', label: 'Email', control: 'text', default: '', placeholder: 'Please enter', visibleWhen: (v) => !!v.show_contact_info },
      { key: 'contact_phone', label: 'Phone', control: 'text', default: '', placeholder: 'Please enter', visibleWhen: (v) => !!v.show_contact_info },
      // Cart is meaningless on the Thank you page (order already placed), so the whole Cart
      // config is hidden there — the Thank you header is otherwise identical to Checkout.
      { sub: 'Cart', visibleWhen: (v, ctx) => !(ctx && ctx.isThankyou) },
      { key: 'show_cart_icon', label: 'Show cart icon', control: 'toggle', default: true, visibleWhen: (v, ctx) => !(ctx && ctx.isThankyou) },
      { sub: 'Colors' },
      { key: 'background_color', label: 'Background color', control: 'color', default: '' },
      { key: 'text_color', label: 'Text color', control: 'color', default: '' },
      { key: 'accent_color', label: 'Accent color', control: 'color', default: '', info: 'Cart icon, links.' },
      { key: 'show_divider', label: 'Show divider', control: 'toggle', default: true },
      { sub: 'Advanced' },
      { key: 'custom_css', label: 'Custom CSS', control: 'custom_css', default: '', info: 'Applies to this header only.' },
    ],
    render(s, blocks, ctx) {
      const tk = ctx.tokens || {}; const L = tk.layout || {};
      const mob = ctx.mob;
      const store = (ctx.checkout && ctx.checkout.storeName) || 'AURA';
      const bg = s.background_color || 'var(--ck-h-bg)';
      const txt = s.text_color || 'var(--ck-h-text)';
      const accent = s.accent_color || 'var(--ck-h-accent)';
      const height = (mob ? (tk.header && tk.header.header_height_mobile) || 56 : (tk.header && tk.header.header_height_pc) || 64);
      const lwPc = Number(s.logo_width); const lwMob = Number(s.logo_width_mobile);
      const logoW = isFinite(lwPc) && lwPc > 0 ? lwPc : 120;
      const logoWMob = isFinite(lwMob) && lwMob > 0 ? lwMob : 100;
      const maxw = (L.page_max_width_pc || 980);
      const axis = s.logo_position || 'left'; // left | center | right
      const center = axis === 'center';

      // Width drives the logo size; height follows aspect ratio and the header row
      // grows to fit (see min-height below). For the text fallback we map the same
      // width slider onto the brand font-size so the control is never a no-op.
      const logo = s.logo_image
        ? '<img class="ck-logo-img" src="' + esc(s.logo_image) + '" alt="' + esc(store) + '">'
        : '<span class="ck-logo" style="color:' + txt + '">' + esc(store) + '</span>';

      // Independent content modules — hidden on mobile to protect the compact bar.
      const trust = (s.show_trust_text !== false && s.trust_text && !mob)
        ? '<div class="ck-trust" style="color:' + txt + '">' + esc(s.trust_text) + '</div>' : '';

      const secure = (s.show_secure_badge && s.secure_text && !mob)
        ? '<div class="ck-h-secure" style="color:' + txt + '">' + icon('lock') + '<span>' + esc(s.secure_text) + '</span></div>' : '';

      // Title stacks above the email / phone so a taller header reads as Need help? ▸ contacts.
      const ccLinks = (s.contact_email || s.contact_phone)
        ? '<div class="ck-h-cc-links">' +
            (s.contact_email ? '<a href="mailto:' + esc(s.contact_email) + '" style="color:' + accent + '">' + esc(s.contact_email) + '</a>' : '') +
            (s.contact_phone ? '<a href="tel:' + esc(s.contact_phone) + '" style="color:' + accent + '">' + esc(s.contact_phone) + '</a>' : '') +
          '</div>' : '';
      const contact = (s.show_contact_info && (s.contact_title || s.contact_email || s.contact_phone) && !mob)
        ? '<div class="ck-h-contact" style="color:' + accent + '">' +
            (s.contact_title ? '<span class="ck-h-ct" style="color:' + txt + '">' + esc(s.contact_title) + '</span>' : '') +
            ccLinks +
          '</div>' : '';

      // No cart on the Thank you page (order already placed) — the rest of the header
      // stays identical to Checkout.
      const showCart = s.show_cart_icon && ctx.checkoutPage !== 'thankyou';
      const cart = showCart ? '<a class="ck-h-cart" style="color:' + accent + '">' + icon('cart') + '</a>' : '';
      const cluster = secure + contact + cart; // secondary modules travel together

      // Three regions: start / center / end. Module placement depends on the axis.
      let c1 = '', c2 = '', c3 = '';
      if (mob) {
        c2 = logo; c3 = cart;
      } else if (center) {
        c2 = logo + trust + secure + contact; c3 = cart;
      } else if (axis === 'right') {
        c1 = cluster; c2 = trust; c3 = logo;
      } else {
        c1 = logo; c2 = trust; c3 = cluster;
      }

      const divider = s.show_divider !== false && (tk.header ? tk.header.header_divider !== false : true);
      const inStyle = 'min-height:' + height + 'px;padding-top:8px;padding-bottom:8px;max-width:' + maxw + 'px;background:' + bg;
      const inner = '<div class="ck-header-in" style="' + inStyle + '">' +
        '<div class="ck-h-slot start">' + c1 + '</div>' +
        '<div class="ck-h-slot center">' + c2 + '</div>' +
        '<div class="ck-h-slot end">' + c3 + '</div>' +
        '</div>';
      const css = s.custom_css ? '<style>' + s.custom_css + '</style>' : '';
      return '<div class="ck-header' + (divider ? ' divline' : '') + '" style="--ck-logo-w:' + logoW + 'px;--ck-logo-w-mob:' + logoWMob + 'px;background:' + bg + ';color:' + txt + '">' + inner + css + '</div>';
    },
  });
})();
