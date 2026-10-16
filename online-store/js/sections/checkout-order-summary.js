/* Checkout · Order Summary (PRD §5.10) — the order confirmation surface.
   Reuses the order calculation service; amounts here are mock and illustrative.
   Children (Cart Lines / Coupon / Subtotal / Discount / Shipping / Tax / Total)
   are locked blocks — selectable & configurable but not addable / removable. */
(function () {
  if (!window.OS) return;
  const { esc, money, ckFloat } = OS;

  const blk = (id, html, sel) => '<div class="ck-blk' + (sel ? ' os-block-sel' : '') + '" data-block-id="' + esc(id) + '">' + html + '</div>';
  const TAG = '<svg class="ck-tag-i" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
  const SUB = '<svg class="ck-tag-i" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v5h-5"/></svg>';
  const lineDealAmount = (l) => {
    if (!l.compareAt || l.compareAt <= l.price) return 0;
    const subSave = l.subscription && l.subscription.save ? Number(l.subscription.save) : 0;
    return Math.max(0, (l.compareAt - l.price - subSave) * (l.qty || 1));
  };
  const discountPart = (item, key) => {
    const direct = +((item || {})[key]) || 0;
    if (direct || key !== 'order') return direct;
    // Backward-compatible snapshot rows used `amount` for an order-level discount.
    return !(+item.product || +item.shipping) ? (+item.amount || 0) : 0;
  };
  const discountCode = (item) => esc(item.code || item.label || 'Discount');

  function multiOrderCard(order, currency) {
    const lines = (order.lines || []).map((line) => {
      const source = line.lineSource || (line.downsell ? 'DOWNSELL' : (line.upsell ? 'UPSELL' : ''));
      const flag = source === 'UPSELL' || source === 'DOWNSELL'
        ? '<span class="ck-mo-flag offer">Special offer</span>' : '';
      const qty = +line.qty || 1;
      const finalPrice = (+line.price || 0) * qty;
      const comparePrice = (+line.compareAt || 0) * qty;
      const compareHtml = comparePrice > finalPrice
        ? '<span class="ck-mo-price-cmp">' + money(comparePrice) + '</span>' : '';
      const dealAmt = lineDealAmount(line);
      const deal = line.deal && dealAmt > 0
        ? '<div class="ck-mo-meta">' + TAG + '<span>' + esc(line.deal) + ' (−' + money(dealAmt) + ')</span></div>'
        : '';
      const subscription = line.subscription
        ? '<div class="ck-mo-meta">' + SUB + '<span>' + esc(line.subscription.label) +
          (line.subscription.save ? ' (−' + money(line.subscription.save) + ')' : '') + '</span></div>'
        : '';
      const image = line.bundle
        ? '<div class="ck-mo-bundle-badge i18n-skip">Bundle</div>'
        : '<div class="ck-mo-img"><img src="' + esc(line.image || '') + '" alt=""><span>' + qty + '</span></div>';
      const children = line.bundle
        ? '<div class="ck-mo-bundle-items">' + (line.bundleItems || []).map((item) =>
            '<div class="ck-mo-bundle-child">' +
              '<div class="ck-mo-child-img"><img src="' + esc(item.image || '') + '" alt=""><span>' + (+item.qty || 1) + '</span></div>' +
              '<div class="ck-mo-info"><div class="ck-mo-child-title"><span>Included</span>' + esc(item.title || 'Bundle item') + '</div>' +
                (item.variant ? '<div class="ck-mo-variant">' + esc(item.variant) + '</div>' : '') +
              '</div>' +
            '</div>'
          ).join('') + '</div>'
        : '';
      return '<div class="ck-mo-line-group"><div class="ck-mo-line' + (line.bundle ? ' bundle' : '') + '">' +
        image +
        '<div class="ck-mo-info"><div class="ck-mo-title">' + esc(line.title || 'Product') + flag + '</div>' +
          (line.variant ? '<div class="ck-mo-variant">' + esc(line.variant) + '</div>' : '') +
          subscription + deal +
        '</div>' +
        '<div class="ck-mo-price">' + compareHtml + '<strong>' + money(finalPrice) + '</strong></div>' +
      '</div>' + children + '</div>';
    }).join('');
    const applied = order.discounts || [];
    const productDiscount = applied.reduce((sum, item) => sum + discountPart(item, 'product'), 0);
    const orderDiscounts = applied.filter((item) => discountPart(item, 'order') > 0);
    const shippingDiscounts = applied.filter((item) => discountPart(item, 'shipping') > 0);
    const shippingDiscount = shippingDiscounts.reduce((sum, item) => sum + discountPart(item, 'shipping'), 0);
    const productDiscountHtml = productDiscount > 0
      ? '<div class="ck-mo-row discount"><span>Product Discount</span><b>−' + money(productDiscount) + '</b></div>' : '';
    const orderDiscountHtml = orderDiscounts.length
      ? '<div class="ck-mo-row ck-mo-discount-title"><span>Order Discount</span><b></b></div>' +
        orderDiscounts.map((item) =>
          '<div class="ck-mo-row discount code"><span>' + TAG + discountCode(item) + '</span><b>−' + money(discountPart(item, 'order')) + '</b></div>'
        ).join('')
      : '';
    const shipping = +order.shipping || 0;
    const shippingNet = Math.max(0, shipping - shippingDiscount);
    const shippingPrice = shippingDiscount > 0 && shipping > 0
      ? '<span class="ck-mo-ship-prices"><s>' + money(shipping) + '</s><strong>' + (shippingNet > 0 ? money(shippingNet) : 'FREE') + '</strong></span>'
      : (shipping ? money(shipping) : 'FREE');
    const shippingCodes = shippingDiscounts.map((item) =>
      '<div class="ck-mo-row discount code"><span>' + TAG + discountCode(item) + '</span><b>−' + money(discountPart(item, 'shipping')) + '</b></div>'
    ).join('');
    return '<section class="ck-mo-card">' +
      '<header class="ck-mo-head"><div><span class="ck-mo-kicker">Order</span><strong>' + esc(order.orderNumber || '') + '</strong></div></header>' +
      '<div class="ck-mo-lines">' + lines + '</div>' +
      '<div class="ck-mo-totals">' +
        '<div class="ck-mo-row"><span>Subtotal · ' + (order.lines || []).reduce((n, line) => n + (+line.qty || 1), 0) + ' items</span><b>' + money(order.subtotal || 0) + '</b></div>' +
        productDiscountHtml + orderDiscountHtml +
        '<div class="ck-mo-row"><span>Shipping</span><b>' + shippingPrice + '</b></div>' +
        shippingCodes +
        '<div class="ck-mo-row total"><span>Total</span><b><small>' + esc(currency) + '</small>' + money(order.total || 0) + '</b></div>' +
      '</div>' +
    '</section>';
  }
  function renderMultiOrderSummary(s, ctx, snap) {
    const orders = (snap.orders || []).filter((order) => (order.lines || []).length);
    const currency = snap.currency || 'USD';
    const totalPaid = snap.totalPaid != null
      ? +snap.totalPaid
      : orders.reduce((total, order) => total + (+order.paid || +order.total || 0), 0);
    const cards = orders.map((order) => multiOrderCard(order, order.currency || currency)).join('');
    const overview = '<div class="ck-mo-overview"><div><strong>' + orders.length + ' orders placed</strong></div>' +
      '<div><span>Total paid</span><strong><small>' + esc(currency) + '</small>' + money(totalPaid) + '</strong></div></div>';
    if (ctx.mob) {
      const collapsed = (s.mobile_default || 'collapsed') === 'collapsed';
      const head = s.heading || 'Order summary';
      const bg = s.background_color || 'var(--ck-sum-bg)';
      const txt = s.text_color || 'var(--ck-sum-text)';
      const totalColor = s.total_color || txt;
      return '<div class="ck-summary mob tymob ck-multi-mobile' + (collapsed ? ' collapsed' : '') + '" data-ck-summary style="background:' + bg + ';color:' + txt + ';--ck-mo-text:' + txt + ';--ck-mo-total:' + totalColor + '">' +
        '<button class="ck-tymsum-head" type="button" data-ck-sum-toggle>' +
          '<span class="ck-tymsum-title">' + esc(head) + '<span class="ck-tymsum-chev">▾</span></span>' +
          '<span class="ck-tymsum-total" style="color:' + totalColor + '"><span class="cur">' + esc(currency) + '</span>' + money(totalPaid) + '</span>' +
        '</button>' +
        '<div class="ck-summary-body"><div class="ck-multi-summary">' + cards + '</div></div>' +
      '</div>';
    }
    const heading = s.show_heading_pc
      ? '<h3 class="ck-sum-h">' + esc(s.heading || 'Order summary') + '</h3>' : '';
    const txt = s.text_color || 'var(--ck-sum-text)';
    const totalColor = s.total_color || txt;
    return '<div class="ck-summary ck-multi-shell" style="color:' + txt + ';--ck-mo-text:' + txt + ';--ck-mo-total:' + totalColor + '"><div class="ck-multi-summary">' +
      heading + cards + overview +
    '</div></div>';
  }

  OS.register('checkout-order-summary', {
    name: 'Order Summary', icon: 'cart',
    schema: [
      { key: 'heading', label: 'Heading', control: 'text', default: 'Order summary' },
      { key: 'show_heading_pc', label: 'Show heading · PC', control: 'toggle', default: false },
      { key: 'show_heading_mobile', label: 'Show heading · Mobile', control: 'toggle', default: true },
      { key: 'mobile_default', label: 'Mobile default state', control: 'select', default: 'collapsed', options: [
        { value: 'collapsed', label: 'Collapsed' }, { value: 'expanded', label: 'Expanded' } ] },
      { sub: 'Colors' },
      { key: 'background_color', label: 'Background color', control: 'color', default: '', info: 'Leave empty to inherit Checkout settings.' },
      { key: 'text_color', label: 'Text color', control: 'color', default: '' },
      { key: 'total_color', label: 'Total color', control: 'color', default: '' },
    ],
    blocks: { kinds: {
      'cart-lines': { name: 'Cart Lines', fields: [] },
      'coupon': { name: 'Coupon', fields: [
        { key: 'show_coupon', label: 'Show coupon', control: 'toggle', default: true },
        { key: 'placeholder', label: 'Placeholder', control: 'text', default: 'Discount code' },
      ] },
      'subtotal': { name: 'Subtotal', fields: [ { key: 'row_label', label: 'Label', control: 'text', default: 'Subtotal' } ] },
      'discount': { name: 'Discount', fields: [ { key: 'row_label', label: 'Label', control: 'text', default: 'Discount' } ] },
      'shipping': { name: 'Shipping', fields: [ { key: 'row_label', label: 'Label', control: 'text', default: 'Shipping' } ] },
      'tax': { name: 'Tax', fields: [ { key: 'row_label', label: 'Label', control: 'text', default: 'Taxes' } ] },
      'total': { name: 'Total', fields: [ { key: 'row_label', label: 'Label', control: 'text', default: 'Total' } ] },
    } },

    render(s, blocks, ctx) {
      // Thank-you page reads the Final Order Snapshot (read-only final order,
      // Checkout items + accepted upsell/downsell) instead of the live cart, and
      // hides every interactive bit — no coupon input, no editable qty (PRD §5.3/§14).
      const snap = ctx.snapshot;
      const mock = ctx.checkout || {};
      if (snap && Array.isArray(snap.orders) && snap.orders.filter((order) => (order.lines || []).length).length > 1) {
        return renderMultiOrderSummary(s, ctx, snap);
      }
      // Live add-ons: upsell picks become extra cart lines; insurance / VIP become
      // their own summary rows (computed centrally in app.js, shared by every surface).
      const add = snap ? { rows: [], lines: [] } : (ctx.ckAddons || { rows: [], lines: [] });
      const cart = snap ? (snap.lines || []) : (mock.cart || []).concat(add.lines || []);
      const cur = (snap ? snap.currency : mock.currency) || 'USD';
      const find = (k) => (blocks || []).find((b) => b.kind === k) || { id: '', settings: {} };
      const sel = ctx.selectedBlockId;

      const subtotal = snap ? (snap.subtotal != null ? snap.subtotal : cart.reduce((t, l) => t + l.price * l.qty, 0)) : cart.reduce((t, l) => t + l.price * l.qty, 0);
      // Shipping selection is shared runtime state (Item 1/3) so the summary follows
      // whichever method is chosen in the Delivery card / Shipping Method section.
      const shipId = ((OS.ckState || {})['ck-shipping'] || {}).id || mock.selectedShipping;
      const ship = (mock.shippingMethods || []).find((m) => m.id === shipId) || (mock.shippingMethods || [])[0] || { price: 0 };
      const shipPrice = snap ? (snap.shipping || 0) : (ship.price || 0);
      // Applied coupons live in a shared runtime key so every summary surface (PC,
      // mobile, top bar) reflects the same discounts. Multiple coupons can stack —
      // each carries its own {product, order, shipping} breakdown. Default: none.
      // Applied discounts. Checkout reads the live coupon runtime; Thank you reads the
      // read-only snapshot breakdown (same {code, product, order, shipping} shape) so both
      // surfaces itemise identically.
      const appliedList = snap ? (snap.discounts || []) : (((OS.ckState || {})['ck-coupons']) || []);
      // Item 2 — Shopify itemises discounts into three types: product (line-item),
      // order, and shipping. Each type sums across every applied coupon; each non-zero
      // type renders its own row and all of them deduct from the Total.
      const dProduct = appliedList.reduce((t, c) => t + discountPart(c, 'product'), 0);
      const dOrder = appliedList.reduce((t, c) => t + discountPart(c, 'order'), 0);
      const dShip = appliedList.reduce((t, c) => t + discountPart(c, 'shipping'), 0);
      const discount = dProduct + dOrder + dShip;
      const tax = snap ? (snap.tax || 0) : (mock.tax || 0);
      const addonTotal = (add.rows || []).reduce((t, r) => t + (+r.amount || 0), 0);
      const total = snap ? (snap.total != null ? snap.total : subtotal - discount + shipPrice + tax) : subtotal - discount + shipPrice + tax + addonTotal;
      const itemCount = cart.reduce((t, l) => t + l.qty, 0);
      const lineSavings = cart.reduce((t, l) => t + (l.compareAt && l.compareAt > l.price ? (l.compareAt - l.price) * l.qty : 0), 0);
      const savings = lineSavings + discount;

      const bg = s.background_color || 'var(--ck-sum-bg)';
      const txt = s.text_color || 'var(--ck-sum-text)';
      const totalColor = s.total_color || txt;

      // ---- cart lines block ----
      const lb = find('cart-lines');
      const imgHtml = (src, qty, extra) => '<div class="ck-line-img' + (extra || '') + '" style="background-image:url(' + esc(src) + ')"><span class="ck-line-qty">' + (qty == null ? 1 : qty) + '</span></div>';
      const lines = cart.map((l) => {
        const cmp = l.compareAt && l.compareAt > l.price ? '<span class="ck-line-cmp">' + money(l.compareAt) + '</span>' : '';
        const dealAmt = lineDealAmount(l);
        const deal = (l.deal && dealAmt > 0)
          ? '<div class="ck-line-deal">' + TAG + '<span>' + esc(l.deal) + ' (−' + money(dealAmt) + ')</span></div>' : '';
        // Base-order previews use one buyer-facing label for either offer source.
        const source = l.lineSource || (l.downsell ? 'DOWNSELL' : (l.upsell ? 'UPSELL' : ''));
        const flag = source === 'UPSELL' || source === 'DOWNSELL'
          ? '<span class="ck-line-flag">Special offer</span>' : '';
        const variantHtml = l.variant ? '<div class="ck-line-v">' + esc(l.variant) + '</div>' : '';
        // Item 3 — subscription cadence tag (the (−$x) is the subscription saving).
        const subTag = l.subscription
          ? '<div class="ck-line-sub">' + SUB + '<span>' + esc(l.subscription.label) +
            (l.subscription.save ? ' (−' + money(l.subscription.save) + ')' : '') + '</span></div>' : '';
        // Item 3 — bundle parent: black "Bundle" badge instead of the thumb, then
        // indented "Included" children (small thumb + orange pill, no own price).
        if (l.bundle) {
          const kids = (l.bundleItems || []).map((c) =>
            '<div class="ck-bundle-child">' +
              imgHtml(c.image, c.qty, ' sm') +
              '<div class="ck-line-info"><div class="ck-line-t"><span class="ck-line-included">Included</span>' + esc(c.title) + '</div>' +
              (c.variant ? '<div class="ck-line-v">' + esc(c.variant) + '</div>' : '') + '</div>' +
            '</div>').join('');
          return '<div class="ck-line ck-line--bundle">' +
              '<div class="ck-line-info">' +
                '<div class="ck-line-head">' +
                  '<span class="ck-line-bundle-badge i18n-skip">Bundle</span>' +
                  '<span class="ck-line-t">' + esc(l.title) + flag + '</span>' +
                  '<span class="ck-line-pr">' + cmp + money(l.price * l.qty) + '</span>' +
                '</div>' + variantHtml + deal + subTag +
              '</div>' +
            '</div>' + kids;
        }
        return '<div class="ck-line">' +
          imgHtml(l.image, l.qty) +
          '<div class="ck-line-info"><div class="ck-line-t">' + esc(l.title) + flag + '</div>' + variantHtml + subTag + deal + '</div>' +
          '<div class="ck-line-pr">' + cmp + money(l.price * l.qty) + '</div>' +
        '</div>';
      }).join('');
      const linesBlk = blk(lb.id, '<div class="ck-lines">' + lines + '</div>', sel === lb.id);

      // ---- coupon block ---- (read-only on Thank you: no coupon entry, PRD §5.3)
      // The discount-code input + Apply ALWAYS stay visible. Each applied coupon
      // renders as its own chip row below the input (multiple coupons can stack);
      // removing one via "×" drops just that coupon and re-applying still works.
      const cb = find('coupon'); const cs = cb.settings || {};
      let couponInner = '<div class="ck-coupon">' + ckFloat('<input class="ck-input" data-ck-coupon-input placeholder="' + esc(cs.placeholder || 'Discount code') + '">', cs.placeholder || 'Discount code') + '<button class="ck-coupon-btn" type="button" data-ck-apply>Apply</button></div>' +
        '<div class="ck-coupon-err" data-ck-coupon-err hidden></div>';
      couponInner += appliedList.map((c) => {
        const off = (+c.product || 0) + (+c.order || 0) + (+c.shipping || 0);
        return '<div class="ck-coupon-applied below" data-ck-coupon-applied>' +
          '<span class="ck-coupon-chip">' + TAG + '<span class="code">' + esc(c.code) + '</span>' +
          '<button class="ck-coupon-x" type="button" data-ck-coupon-remove="' + esc(c.code) + '" aria-label="Remove discount">×</button></span>' +
          '<span class="ck-coupon-off">−' + money(off) + '</span>' +
        '</div>';
      }).join('');
      const couponBlk = (snap || cs.show_coupon === false) ? '' : blk(cb.id, couponInner, sel === cb.id);

      // ---- totals ----
      const row = (b, val, opts) => {
        opts = opts || {};
        const bs = (b.settings || {});
        const lbl = esc(bs.row_label || b.kind) + (opts.suffix || '') + (opts.info ? '<span class="ck-info" title="Calculated at the next step">?</span>' : '');
        return blk(b.id, '<div class="ck-trow"><span class="lbl">' + lbl + '</span><span class="amt">' + val + '</span></div>', sel === b.id);
      };
      const sub = find('subtotal'), dis = find('discount'), shp = find('shipping'), tx = find('tax'), tot = find('total');
      const savingsLine = savings > 0 ? '<div class="ck-savings">' + TAG + '<span>Total savings ' + money(savings) + '</span></div>' : '';
      const addonRows = (add.rows || []).map((r) => '<div class="ck-trow ck-addon"><span class="lbl">' + esc(r.label) + '</span><span class="amt">' + money(r.amount) + '</span></div>').join('');
      // Shopify-style grouping: Order Discount is a heading followed by each code and
      // its amount; Shipping shows gross → net, followed by each shipping code.
      const productDiscountRow = dProduct > 0
        ? '<div class="ck-trow ck-disc"><span class="lbl">Product Discount</span><span class="amt">−' + money(dProduct) + '</span></div>'
        : '';
      const orderDiscountItems = appliedList.filter((item) => discountPart(item, 'order') > 0);
      const orderDiscountRows = orderDiscountItems.length
        ? '<div class="ck-trow ck-disc-heading"><span class="lbl">Order Discount</span><span class="amt"></span></div>' +
          orderDiscountItems.map((item) =>
            '<div class="ck-trow ck-disc-code"><span class="lbl">' + TAG + '<span class="code">' + discountCode(item) + '</span></span>' +
              '<span class="amt">−' + money(discountPart(item, 'order')) + '</span></div>'
          ).join('')
        : '';
      const discInner = productDiscountRow + orderDiscountRows;
      const discountHtml = discInner
        ? blk(dis.id, discInner, sel === dis.id)
        : '';
      const shippingDiscountItems = appliedList.filter((item) => discountPart(item, 'shipping') > 0);
      const shippingNet = Math.max(0, shipPrice - dShip);
      const shippingAmount = dShip > 0 && shipPrice > 0
        ? '<span class="ck-ship-prices"><s>' + money(shipPrice) + '</s><strong>' + (shippingNet > 0 ? money(shippingNet) : 'FREE') + '</strong></span>'
        : (shipPrice ? money(shipPrice) : 'FREE');
      const shippingCodeRows = shippingDiscountItems.map((item) =>
        '<div class="ck-trow ck-disc-code ck-ship-code"><span class="lbl">' + TAG + '<span class="code">' + discountCode(item) + '</span></span>' +
          '<span class="amt">−' + money(discountPart(item, 'shipping')) + '</span></div>'
      ).join('');
      const shippingSettings = shp.settings || {};
      const shippingHtml = blk(shp.id,
        '<div class="ck-trow ck-shipping-main"><span class="lbl">' + esc(shippingSettings.row_label || 'Shipping') + '</span><span class="amt">' + shippingAmount + '</span></div>' +
        shippingCodeRows,
        sel === shp.id);
      const totals = '<div class="ck-totals">' +
        row(sub, money(subtotal), { suffix: ' <span class="ck-itemc">· ' + itemCount + ' items</span>' }) +
        discountHtml +
        shippingHtml +
        (snap ? '' : row(tx, money(tax))) +
        addonRows +
        blk(tot.id, '<div class="ck-trow grand" style="color:' + totalColor + '"><span class="lbl">' + esc((tot.settings || {}).row_label || 'Total') + '</span><span class="amt"><span class="cur">' + esc(cur) + '</span>' + money(total) + '</span></div>', sel === tot.id) +
        savingsLine +
      '</div>';

      // ---- mobile (Shopify-style): collapsed = "Add discount" pill + recap bar;
      //      expanded = "Order summary" header + line items + discount code + totals ----
      if (ctx.mob) {
        const collapsed = (s.mobile_default || 'collapsed') === 'collapsed';
        const head = s.heading || 'Order summary';
        // Thank-you (snapshot present) uses a clean Shopify-style collapsed header:
        // "Order summary ⌄" on the left, grand total on the right — no thumbnail or item
        // count. Gated on `snap` so the Checkout mobile recap card below is untouched.
        if (snap) {
          return '<div class="ck-summary mob tymob' + (collapsed ? ' collapsed' : '') + '" data-ck-summary style="background:' + bg + ';color:' + txt + '">' +
            '<button class="ck-tymsum-head" type="button" data-ck-sum-toggle>' +
              '<span class="ck-tymsum-title">' + esc(head) + '<span class="ck-tymsum-chev">▾</span></span>' +
              '<span class="ck-tymsum-total" style="color:' + totalColor + '"><span class="cur">' + esc(cur) + '</span>' + money(total) + '</span>' +
            '</button>' +
            '<div class="ck-summary-body">' + linesBlk + totals + '</div>' +
          '</div>';
        }
        const thumb = cart[0] ? '<div class="ck-msum-thumb" style="background-image:url(' + esc(cart[0].image) + ')"></div>' : '';
        const savLine = savings > 0 ? '<div class="ck-msum-sav">' + TAG + '<span>Total savings ' + money(savings) + '</span></div>' : '';
        return '<div class="ck-summary mob' + (collapsed ? ' collapsed' : '') + '" data-ck-summary style="background:' + bg + ';color:' + txt + '">' +
          (snap ? '' : '<button class="ck-msum-adddisc" type="button" data-ck-sum-toggle>' + TAG + '<span>Add discount</span></button>') +
          '<div class="ck-msum-bar" data-ck-sum-toggle>' +
            thumb +
            '<div class="ck-msum-meta">' +
              '<span class="ck-msum-lbl ck-when-collapsed">Total</span>' +
              (s.show_heading_mobile === false ? '' : '<span class="ck-msum-lbl ck-when-expanded">' + esc(head) + '</span>') +
              '<span class="ck-msum-items ck-when-collapsed">' + itemCount + ' items</span>' +
            '</div>' +
            '<div class="ck-msum-amt">' +
              '<span class="amt" style="color:' + totalColor + '"><span class="cur">' + esc(cur) + '</span>' + money(total) + ' <span class="ck-chev">▾</span></span>' +
              savLine +
            '</div>' +
            '<span class="ck-chev-exp ck-when-expanded">▾</span>' +
          '</div>' +
          '<div class="ck-summary-body">' + linesBlk + couponBlk + totals + '</div>' +
        '</div>';
      }

      // Desktop: the surface colour is painted as a full-bleed band behind the side column
      // (see app.js .ckcol.side::before, driven by --ck-sum-bg), so the panel itself stays
      // transparent here — only carry the text colour when overridden.
      const heading = s.show_heading_pc ? '<h3 class="ck-sum-h">' + esc(s.heading || 'Order summary') + '</h3>' : '';
      return '<div class="ck-summary" style="color:' + txt + '">' + heading + linesBlk + couponBlk + totals + '</div>';
    },

    hydrate(el) {
      const wrap = el.querySelector('[data-ck-summary]');
      if (wrap) el.querySelectorAll('[data-ck-sum-toggle]').forEach((t) => {
        t.addEventListener('click', (e) => { e.stopPropagation(); wrap.classList.toggle('collapsed'); });
      });
      const apply = el.querySelector('[data-ck-apply]');
      if (apply) {
        const input = el.querySelector('[data-ck-coupon-input]');
        const err = el.querySelector('[data-ck-coupon-err]');
        const showErr = (msg) => { if (err) { err.textContent = msg; err.removeAttribute('hidden'); } };
        apply.addEventListener('click', () => {
          const code = (input && input.value || '').trim();
          if (err) err.setAttribute('hidden', '');
          if (!code) { if (input) input.focus(); return; }
          apply.textContent = 'Applying…'; apply.disabled = true;
          setTimeout(() => {
            const codes = (OS.data && OS.data.CHECKOUT_MOCK && OS.data.CHECKOUT_MOCK.coupons) || {};
            const key = code.toUpperCase();
            const entry = codes[key];
            if (entry == null) {
              apply.textContent = 'Apply'; apply.disabled = false;
              showErr('Enter a valid discount code');
              return;
            }
            const list = ((OS.ckState || {})['ck-coupons'] || []).slice();
            if (list.some((c) => c.code === key)) {
              apply.textContent = 'Apply'; apply.disabled = false;
              showErr('This code is already applied');
              return;
            }
            // Item 2 — normalise to a {product, order, shipping} breakdown. A plain
            // number is treated as a product discount (backward-compat). Multiple
            // coupons stack, so push onto the shared list (dedupe by code above).
            const norm = (typeof entry === 'number') ? { product: entry } : (entry || {});
            const product = +norm.product || 0, order = +norm.order || 0, shipping = +norm.shipping || 0;
            list.push({ code: key, product: product, order: order, shipping: shipping, amount: product + order + shipping });
            OS.ckState['ck-coupons'] = list;
            OS.ckRecalc();
          }, 600);
        });
      }
      el.querySelectorAll('[data-ck-coupon-remove]').forEach((remove) => remove.addEventListener('click', (e) => {
        e.preventDefault();
        const code = remove.getAttribute('data-ck-coupon-remove');
        OS.ckState['ck-coupons'] = ((OS.ckState || {})['ck-coupons'] || []).filter((c) => c.code !== code);
        OS.ckRecalc();
      }));
    },
  });

  OS.css('ck-multi-order-summary', `
  .ck-trow.ck-disc-heading{margin-bottom:7px}.ck-trow.ck-disc-heading .lbl{font-weight:500}
  .ck-trow.ck-disc-code{margin-bottom:10px;padding-left:0;color:var(--ck-sum-muted);font-size:var(--ck-small-fs)}
  .ck-trow.ck-disc-code .lbl{color:var(--ck-sum-muted);gap:7px}.ck-trow.ck-disc-code .ck-tag-i{flex:none}
  .ck-trow.ck-disc-code .code{letter-spacing:.01em}.ck-trow.ck-disc-code .amt{color:var(--ck-sum-text);font-size:var(--ck-base-fs)}
  .ck-trow.ck-shipping-main{margin-bottom:7px}.ck-ship-prices{display:inline-flex;align-items:center;gap:8px}
  .ck-ship-prices s{color:var(--ck-sum-muted);font-weight:400}.ck-ship-prices strong{font-weight:500;color:var(--ck-sum-text)}
  .ck-multi-summary{display:flex;flex-direction:column;gap:14px}
  .ck-mo-overview{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding:16px;border:1px solid var(--ck-divider);border-radius:10px;background:rgba(255,255,255,.6)}
  .ck-mo-overview>div{display:flex;flex-direction:column;gap:3px}.ck-mo-overview strong{color:var(--ck-mo-text,var(--ck-text));font-size:15px}
  .ck-mo-overview span{color:var(--ck-muted);font-size:11px;line-height:1.45}.ck-mo-overview>div:last-child{text-align:right;flex:none}
  .ck-mo-overview>div:last-child strong{font-size:20px;color:var(--ck-mo-total,var(--ck-mo-text,var(--ck-text)))}.ck-mo-overview small,.ck-mo-row.total small{font-size:10px;font-weight:500;color:var(--ck-muted);margin-right:5px}
  .ck-mo-card{border:1px solid var(--ck-divider);border-radius:10px;background:rgba(255,255,255,.74);overflow:hidden}
  .ck-mo-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 14px;border-bottom:1px solid var(--ck-divider)}
  .ck-mo-head>div{display:flex;align-items:baseline;gap:7px;min-width:0}.ck-mo-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--ck-muted)}
  .ck-mo-head strong{font-size:13px;color:var(--ck-mo-text,var(--ck-text));overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ck-mo-lines{padding:2px 14px}.ck-mo-line-group{border-bottom:1px solid var(--ck-divider)}.ck-mo-line-group:last-child{border-bottom:0}
  .ck-mo-line{display:grid;grid-template-columns:48px minmax(0,1fr) auto;align-items:center;gap:11px;padding:12px 0}.ck-mo-line.bundle{align-items:flex-start;padding-bottom:8px}
  .ck-mo-img{position:relative;width:48px;height:48px;border-radius:8px;background:#f4f4f4;overflow:visible}
  .ck-mo-img img{width:100%;height:100%;display:block;object-fit:cover;border-radius:8px}.ck-mo-img>span{position:absolute;right:-6px;top:-6px;min-width:19px;height:19px;padding:0 4px;border-radius:10px;background:#707070;color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center}
  .ck-mo-info{min-width:0}.ck-mo-title{font-size:12px;color:var(--ck-mo-text,var(--ck-text));line-height:1.35;display:flex;align-items:center;gap:6px;flex-wrap:wrap}.ck-mo-variant{font-size:10.5px;color:var(--ck-muted);margin-top:3px}
  .ck-mo-meta{display:flex;align-items:center;gap:5px;margin-top:4px;color:var(--ck-muted);font-size:10.5px}.ck-mo-meta .ck-tag-i{flex:none}
  .ck-mo-bundle-badge{width:48px;min-height:30px;display:flex;align-items:center;justify-content:center;border-radius:7px;background:#111;color:#fff;font-size:10px;font-weight:700;padding:5px}
  .ck-mo-bundle-items{padding:0 0 10px 59px}.ck-mo-bundle-child{display:grid;grid-template-columns:36px minmax(0,1fr);gap:9px;align-items:center;padding:6px 0}
  .ck-mo-child-img{position:relative;width:36px;height:36px}.ck-mo-child-img img{width:100%;height:100%;object-fit:cover;border-radius:6px}.ck-mo-child-img>span{position:absolute;right:-5px;top:-5px;min-width:16px;height:16px;border-radius:9px;background:#707070;color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center}
  .ck-mo-child-title{font-size:10.5px;color:var(--ck-mo-text,var(--ck-text));line-height:1.35}.ck-mo-child-title>span{display:inline-block;margin-right:6px;padding:2px 6px;border-radius:5px;background:#fff2e3;color:#d9822b;font-size:9px;font-weight:700}
  .ck-mo-price{font-size:12px;color:var(--ck-mo-text,var(--ck-text));white-space:nowrap;display:flex;flex-direction:column;align-items:flex-end;gap:2px}.ck-mo-price strong{font-weight:600}.ck-mo-price-cmp{font-size:10px;font-weight:400;color:var(--ck-muted);text-decoration:line-through}.ck-mo-flag{font-size:9px;font-weight:700;line-height:1;border-radius:999px;padding:4px 6px;text-transform:uppercase;letter-spacing:.035em}
  .ck-mo-flag.offer{background:#edf5f0;color:#35634b}
  .ck-mo-totals{border-top:1px solid var(--ck-divider);padding:9px 14px 12px}.ck-mo-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0;font-size:11px;color:var(--ck-mo-text,var(--ck-text))}
  .ck-mo-row b{font-weight:500;color:var(--ck-mo-text,var(--ck-text));white-space:nowrap}.ck-mo-row.discount span{display:inline-flex;align-items:center;gap:5px}.ck-mo-row.discount{color:#59655f}
  .ck-mo-row.ck-mo-discount-title{padding-bottom:1px}.ck-mo-row.ck-mo-discount-title span{font-weight:500}.ck-mo-row.discount.code{font-size:10.5px;padding-top:2px}.ck-mo-row.discount.code .ck-tag-i{flex:none}
  .ck-mo-ship-prices{display:inline-flex;align-items:center;gap:7px}.ck-mo-ship-prices s{color:var(--ck-muted);font-weight:400}.ck-mo-ship-prices strong{color:var(--ck-mo-text,var(--ck-text));font-weight:500}
  .ck-mo-row.total{border-top:1px solid var(--ck-divider);margin-top:5px;padding-top:10px;font-size:14px;color:var(--ck-mo-total,var(--ck-mo-text,var(--ck-text)))}.ck-mo-row.total b{font-size:15px;font-weight:700;color:var(--ck-mo-total,var(--ck-mo-text,var(--ck-text)))}
  .ckpage.mob .ck-multi-summary{gap:12px}.ckpage.mob .ck-mo-overview{border-left:0;border-right:0;border-radius:0;padding:14px var(--ck-mob-pad)}
  .ckpage.mob .ck-mo-overview>div:first-child span{display:none}.ckpage.mob .ck-mo-card{margin:0 var(--ck-mob-pad);border-radius:8px}
  .ckpage.mob .ck-multi-mobile .ck-mo-overview{padding:0 0 12px;border:0;border-bottom:1px solid var(--ck-divider)}
  .ckpage.mob .ck-multi-mobile .ck-mo-card{margin:0}
  .ck-multi-mobile .ck-tymsum-title{color:var(--ck-mo-text,var(--ck-text))}
  @media(max-width:440px){.ck-mo-overview{align-items:center}.ck-mo-overview>div:last-child strong{font-size:17px}.ck-mo-line{grid-template-columns:44px minmax(0,1fr) auto}.ck-mo-img{width:44px;height:44px}}
  `);
})();
