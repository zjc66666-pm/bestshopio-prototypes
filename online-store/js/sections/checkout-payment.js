/* Checkout · Payment section — the full checkout FORM (wide left column), modelled on the BestVoy
   production checkout: stacked express buttons, Contact (+ Sign in), full Delivery with country
   select + phone code, two Shipping methods, Card with brand marks. Funnel extras (rating line,
   newsletter, shipping-insurance bump, name-on-card, billing row) are OFF by default and turned on
   per-template. Inputs are visual-only (readonly placeholders) styled via the Forms tokens. */
(function () {
  const OS = window.OS;
  const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
  const CARD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>';
  const SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-3Z"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>';
  const USFLAG = '<svg viewBox="0 0 24 16" width="21" height="14" style="border-radius:2px;flex:none"><rect width="24" height="16" fill="#fff"/><g fill="#b22234"><rect width="24" height="2"/><rect y="4.5" width="24" height="2"/><rect y="9" width="24" height="2"/><rect y="13.5" width="24" height="2"/></g><rect width="10" height="8" fill="#3c3b6e"/></svg>';
  const brand = (txt, fg) => '<span style="font-size:8px;font-weight:800;letter-spacing:.02em;color:' + fg + ';background:#fff;border:1px solid #e6e6e9;border-radius:3px;padding:2px 3px;line-height:1">' + txt + '</span>';
  const BRANDS = '<span class="ckp-brands">' + brand('VISA', '#1a1f71') + brand('MC', '#eb001b') + brand('AMEX', '#006fcf') + brand('UPI', '#e21836') + '</span>';

  OS.css('checkout-payment', [
    '.ck-pay{box-sizing:border-box}.ck-pay *{box-sizing:border-box}',
    '.ck-pay .ckp-wrap{max-width:620px;margin:0 auto}',
    '.ck-pay .ckp-exp-label{text-align:center;font-size:13px;font-weight:600;margin-bottom:10px;opacity:.85}',
    '.ck-pay .ckp-exp{display:flex;gap:9px}.ck-pay .ckp-exp .ckp-xbtn{flex:1;min-width:0;font-size:13.5px}',
    '.ck-pay .ckp-alts{display:flex;flex-direction:column;gap:10px;margin-top:10px}',
    '.ck-pay .ckp-alt{display:flex;align-items:center;gap:11px;border:1px solid #eaeaea;border-radius:8px;padding:13px 15px}',
    '.ck-pay .ckp-alt .ckp-alt-logo{flex:none;width:38px;height:24px;border-radius:5px;display:grid;place-items:center;font-size:13px;font-weight:800;color:#1a1a1a}',
    '.ck-pay .ckp-alt b{font-size:14px;font-weight:700}',
    '.ck-pay .ckp-xbtn{height:48px;border:0;border-radius:6px;font-weight:800;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}',
    '.ck-pay .ckp-xbtn i{font-style:normal}',
    '.ck-pay .ckp-gchip{width:30px;height:20px;border-radius:3px;background:linear-gradient(90deg,#4285f4 50%,#34a853 50%);display:inline-block}',
    '.ck-pay .ckp-or{display:flex;align-items:center;gap:12px;margin:16px 0;font-size:12px;letter-spacing:.08em;opacity:.5}',
    '.ck-pay .ckp-or::before,.ck-pay .ckp-or::after{content:"";flex:1;height:1px;background:currentColor;opacity:.4}',
    '.ck-pay .ckp-rate{text-align:center;font-size:11.5px;font-weight:600;letter-spacing:.03em;margin:0 0 18px;opacity:.75}.ck-pay .ckp-rate .ckp-stars{color:#f5a623;letter-spacing:2px}',
    '.ck-pay .ckp-group{margin-bottom:20px}',
    '.ck-pay .ckp-gh-row{display:flex;align-items:baseline;justify-content:space-between;margin:0 0 10px}',
    '.ck-pay .ckp-gh{font-size:17px;font-weight:700;margin:0}',
    '.ck-pay .ckp-signin{font-size:13.5px;text-decoration:none}',
    '.ck-pay .ckp-lbl{font-size:12.5px;margin:0 0 6px;opacity:.85}.ck-pay .ckp-lbl .req{color:#d92d20;margin-right:3px}',
    '.ck-pay .ckp-field{width:100%;margin-bottom:10px}.ck-pay .ckp-input{width:100%;display:block}',
    '.ck-pay .ckp-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ck-pay .ckp-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}',
    '.ck-pay .ckp-sel{display:flex;align-items:center;gap:8px;cursor:pointer}.ck-pay .ckp-sel .ckp-chev{margin-left:auto;opacity:.5;display:flex}.ck-pay .ckp-sel .ckp-chev svg{width:16px;height:16px}',
    '.ck-pay .ckp-ph{opacity:.5}',
    '.ck-pay .ckp-phone{display:flex;gap:8px}.ck-pay .ckp-cc-box{flex:none;display:flex;align-items:center;gap:3px}',
    '.ck-pay .ckp-opt{display:flex;align-items:center;gap:9px;font-size:13px;margin:2px 0 4px}',
    '.ck-pay .ckp-ck{flex:none;width:18px;height:18px;border-radius:5px;display:grid;place-items:center;color:#fff}.ck-pay .ckp-ck svg{width:12px;height:12px}',
    '.ck-pay .ckp-ships{display:flex;flex-direction:column;border:1.5px solid #e4e4e7;border-radius:8px;overflow:hidden}',
    '.ck-pay .ckp-ship{display:flex;align-items:center;gap:11px;padding:13px 15px;font-size:14px}.ck-pay .ckp-ship + .ckp-ship{border-top:1px solid #ededf0}',
    '.ck-pay .ckp-ship.on{background:#f6f7f9}.ck-pay .ckp-ship .ckp-sprice{margin-left:auto;font-weight:700}',
    '.ck-pay .ckp-radio{flex:none;width:18px;height:18px;border-radius:50%;border:2px solid #c4c4cc;display:grid;place-items:center}',
    '.ck-pay .ckp-ship.on .ckp-radio{border-color:currentColor}.ck-pay .ckp-ship.on .ckp-radio::after{content:"";width:9px;height:9px;border-radius:50%;background:currentColor}',
    '.ck-pay .ckp-ins{border:1.5px dashed #c7d2cd;border-radius:8px;padding:12px 14px;display:flex;align-items:center;gap:11px;margin-top:10px}',
    '.ck-pay .ckp-ins-ic{flex:none;width:30px;height:30px;display:grid;place-items:center;opacity:.7}.ck-pay .ckp-ins-ic svg{width:24px;height:24px}',
    '.ck-pay .ckp-ins b{font-size:13px}.ck-pay .ckp-ins .ckp-ins-d{font-size:11.5px;opacity:.7;line-height:1.4}',
    '.ck-pay .ckp-paybox{border:1.5px solid #e4e4e7;border-radius:8px;overflow:hidden}',
    '.ck-pay .ckp-payhd{display:flex;align-items:center;gap:10px;padding:13px 15px;font-size:14px;font-weight:600;border-bottom:1.5px solid #e4e4e7}.ck-pay .ckp-payhd .ckp-ci{display:flex;opacity:.7}.ck-pay .ckp-payhd .ckp-ci svg{width:22px;height:22px}',
    '.ck-pay .ckp-cardfields{padding:14px 15px}',
    '.ck-pay .ckp-cn-wrap{position:relative;margin-bottom:10px}.ck-pay .ckp-brands{position:absolute;right:12px;top:50%;transform:translateY(-50%);display:flex;gap:4px;align-items:center}',
    '.ck-pay .ckp-cn{width:100%}.ck-pay .ckp-cell{width:100%}',
    '.ck-pay .ckp-paynow{width:100%;margin-top:16px}',
    '.ck-pay .ckp-secure{display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;opacity:.6;margin-top:12px}.ck-pay .ckp-secure svg{width:13px;height:13px}',
    '.ck-pay .ckp-terms{font-size:11.5px;opacity:.6;line-height:1.5;text-align:center;margin-top:12px}',
  ].join(''));

  OS.register('checkout-payment', {
    name: 'Payment section', group: 'commerce', icon: 'card', core: true,
    schema: [
      { key: 'show_express', control: 'toggle', label: 'Show express checkout', default: true },
      { key: 'paypal', control: 'toggle', label: 'PayPal', default: true, visibleWhen: (s) => s.show_express },
      { key: 'gpay', control: 'toggle', label: 'Google Pay', default: true, visibleWhen: (s) => s.show_express },
      { key: 'applepay', control: 'toggle', label: 'Apple Pay', default: true, visibleWhen: (s) => s.show_express },
      { key: 'show_signin', control: 'toggle', label: 'Sign-in link', default: true },
      { key: 'alt_pay', control: 'toggle', label: 'Klarna / Afterpay', default: true },
      { key: 'show_rating', control: 'toggle', label: 'Rating line (funnel)', default: false },
      { key: 'newsletter', control: 'toggle', label: 'Newsletter opt-in (funnel)', default: false },
      { key: 'show_insurance', control: 'toggle', label: 'Shipping-insurance bump (funnel)', default: false },
      { key: 'insurance_title', control: 'text', label: 'Insurance · title', default: 'Shipping insurance', visibleWhen: (s) => s.show_insurance },
      { key: 'insurance_price', control: 'text', label: 'Insurance · price', default: '$3.95', visibleWhen: (s) => s.show_insurance },
      { key: 'insurance_desc', control: 'text', label: 'Insurance · description', default: 'Receive your order faster · 88% of people choose this option', visibleWhen: (s) => s.show_insurance },
      { key: 'name_on_card', control: 'toggle', label: 'Name on card', default: false },
      { key: 'billing_row', control: 'toggle', label: 'Billing-address row', default: false },
    ],
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const padV = OS.secSpace(t, mob), padH = OS.ckPad(t, mob);
      const accent = (c.primary_color) || '#103635';
      const hc = (c.heading_color || '#1a1a1a');
      const istyle = OS.inputStyle(t);
      const inp = (ph) => '<input class="ckp-input" readonly placeholder="' + OS.esc(ph) + '" style="' + istyle + ';width:100%">';
      const sel = (inner) => '<div class="ckp-sel" style="' + istyle + ';width:100%">' + inner + '<span class="ckp-chev">' + CHEV + '</span></div>';

      // express buttons — stacked, full width
      let express = '';
      if (s.show_express) {
        const btns = [];
        if (s.paypal) btns.push('<button class="ckp-xbtn" style="background:#ffc439;color:#003087"><i>Pay</i><i style="color:#0070ba">Pal</i></button>');
        if (s.gpay) btns.push('<button class="ckp-xbtn" style="background:#000;color:#fff"><b style="font-weight:700">G</b> Pay <span class="ckp-gchip"></span></button>');
        if (s.applepay) btns.push('<button class="ckp-xbtn" style="background:#000;color:#fff">Apple Pay</button>');
        if (btns.length) express = '<div class="ckp-part" data-ck-part="express"><div class="ckp-exp-label">Express checkout</div><div class="ckp-exp">' + btns.join('') + '</div></div><div class="ckp-or" style="color:' + (c.text_color || '#1a1a1a') + '">OR</div>';
      }
      const rating = s.show_rating ? '<div class="ckp-rate"><span class="ckp-stars">★★★★★</span> &nbsp;RATED 4.8 STARS BY 45,000+ SATISFIED CUSTOMERS</div>' : '';

      const ckbox = '<span class="ckp-ck" style="background:' + accent + '">' + CHECK + '</span>';
      const signin = s.show_signin ? '<a class="ckp-signin" href="#" style="color:' + ((c.link_color) || accent) + '">Sign in</a>' : '';
      const optin = s.newsletter ? '<label class="ckp-opt">' + ckbox + 'Keep me up to date with news and exclusive offers</label>' : '';
      const contact = '<div class="ckp-group" data-ck-part="contact"><div class="ckp-gh-row"><h3 class="ckp-gh" style="color:' + hc + '">Contact</h3>' + signin + '</div>' +
        '<div class="ckp-field">' + inp('Email') + '</div>' + optin + '</div>';

      const delivery = '<div class="ckp-group" data-ck-part="delivery"><h3 class="ckp-gh" style="color:' + hc + ';margin-bottom:10px">Delivery</h3>' +
        '<div class="ckp-lbl"><span class="req">*</span>Country/Region</div>' +
        '<div class="ckp-field">' + sel(USFLAG + '<span>United States</span>') + '</div>' +
        '<div class="ckp-2"><div class="ckp-field">' + inp('First name') + '</div><div class="ckp-field">' + inp('Last name') + '</div></div>' +
        '<div class="ckp-field">' + inp('Address') + '</div>' +
        '<div class="ckp-field">' + inp('Apt, suite, unit, etc (optional)') + '</div>' +
        '<div class="ckp-3"><div class="ckp-field">' + sel('<span class="ckp-ph">State/province</span>') + '</div><div class="ckp-field">' + sel('<span class="ckp-ph">City</span>') + '</div><div class="ckp-field">' + inp('ZIP code') + '</div></div>' +
        '<div class="ckp-phone"><span class="ckp-cc-box" style="' + istyle + '">+1</span><input class="ckp-input" readonly placeholder="Phone number" style="' + istyle + ';flex:1"></div></div>';

      const shipRow = (name, price, on) => '<div class="ckp-ship' + (on ? ' on' : '') + '" style="color:' + (on ? accent : '#c4c4cc') + '"><span class="ckp-radio"></span><span style="color:' + (c.text_color || '#1a1a1a') + '">' + name + '</span><span class="ckp-sprice" style="color:' + (c.text_color || '#1a1a1a') + '">' + price + '</span></div>';
      const insTitle = (s.insurance_title != null && s.insurance_title !== '') ? s.insurance_title : 'Shipping insurance';
      const insDesc = (s.insurance_desc != null) ? s.insurance_desc : '';
      const insPrice = (s.insurance_price != null) ? s.insurance_price : '';
      const insurance = s.show_insurance ? '<div class="ckp-ins"><span class="ckp-ck" style="background:' + accent + '">' + CHECK + '</span><span class="ckp-ins-ic" style="color:' + accent + '">' + SHIELD + '</span>' +
        '<div style="flex:1;min-width:0"><b>' + OS.esc(insTitle) + '</b>' + (insDesc ? '<div class="ckp-ins-d">' + OS.esc(insDesc) + '</div>' : '') + '</div>' +
        (insPrice ? '<span class="ckp-ins-price" style="flex:none;font-weight:800;color:' + accent + '">' + OS.esc(insPrice) + '</span>' : '') + '</div>' : '';
      const shipping = '<div class="ckp-group" data-ck-part="shipping"><h3 class="ckp-gh" style="color:' + hc + ';margin-bottom:10px">Shipping method</h3>' +
        '<div class="ckp-ships">' + shipRow('Basic Shipping', '$8.99', true) + shipRow('VIP Shipping', '$12.99', false) + '</div>' + insurance + '</div>';

      const fbg = (t.forms && t.forms.input_background) || '#fff';
      const ftx = (t.forms && t.forms.input_text) || '#1a1a1a';
      const cellH = (t.forms && t.forms.input_height) || 44;
      const cellPad = (t.forms && t.forms.input_horizontal_padding) || 16;
      const cellRad = (t.forms && t.forms.input_border_radius);
      const cell = (cls, ph, extra) => '<input class="' + cls + '" readonly placeholder="' + OS.esc(ph) + '" style="background:' + fbg + ';color:' + ftx + ';height:' + cellH + 'px;padding:0 ' + cellPad + 'px;font-size:' + OS.fs(t, 14) + 'px;border:1px solid ' + ((t.forms && t.forms.input_border_color) || '#e4e4e7') + ';border-radius:' + (cellRad != null ? cellRad : 8) + 'px;outline:none;' + (extra || '') + '">';
      const nameRow = s.name_on_card ? '<div style="margin-top:10px">' + cell('ckp-cell', 'Name on card') + '</div>' : '';
      const billRow = s.billing_row ? '<label class="ckp-opt" style="margin-top:10px">' + ckbox + 'Use shipping address as billing address</label>' : '';
      const card = '<div class="ckp-group" data-ck-part="payment"><h3 class="ckp-gh" style="color:' + hc + ';margin-bottom:10px">Payment</h3>' +
        '<div class="ckp-paybox">' +
          '<div class="ckp-payhd" style="color:' + (c.text_color || '#1a1a1a') + '"><span class="ckp-radio" style="border-color:' + accent + '"><span style="width:9px;height:9px;border-radius:50%;background:' + accent + ';display:block"></span></span><span class="ckp-ci">' + CARD + '</span>Card</div>' +
          '<div class="ckp-cardfields">' +
            '<div class="ckp-cn-wrap">' + cell('ckp-cn', 'Card number', 'background:#f8f8fa') + BRANDS + '</div>' +
            '<div class="ckp-2">' + cell('ckp-cell', 'MM / YY', 'background:#f8f8fa') + cell('ckp-cell', 'CVC', 'background:#f8f8fa') + '</div>' +
          '</div>' +
        '</div>' + nameRow + billRow + '</div>';

      const altRow = (name, bg, mark) => '<div class="ckp-alt"><span class="ckp-radio" style="border-color:#c4c4cc"></span><span class="ckp-alt-logo" style="background:' + bg + '">' + mark + '</span><b style="color:' + (c.text_color || '#1a1a1a') + '">' + name + '</b></div>';
      const altpay = s.alt_pay ? '<div class="ckp-alts">' + altRow('Klarna', '#ffb3c7', 'K') + altRow('Afterpay', '#b2fce4', 'A') + '</div>' : '';

      const pay = '<div data-ck-part="paynow"><button class="ckp-paynow" style="' + OS.btnStyle(t) + ';width:100%">PAY NOW</button>' +
        '<div class="ckp-secure" style="color:' + (c.text_color || '#1a1a1a') + '">' + OS.icon('lock') + 'Secure &amp; encrypted checkout</div>' +
        '<div class="ckp-terms">By continuing, you agree to our Terms of Service and Privacy Policy.</div></div>';

      // the selected shipping radio needs a filled dot — handled by .ckp-ship.on .ckp-radio::after
      return '<div class="ck-pay" style="background:' + OS.bgOrTransparent(c.background) + ';color:' + (c.text_color || '#1a1a1a') + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div class="ckp-wrap">' + express + rating + contact + delivery + shipping + card + altpay + pay + '</div></div>';
    },
  });
})();
