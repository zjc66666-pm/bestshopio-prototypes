/* Checkout Theme · Post-purchase progress indicator.
   Uses a fixed three-stage semantic model so Theme never exposes Funnel routing. */
(function () {
  if (!window.OS) return;
  const { esc } = OS;
  const CART = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4h2l2 11h10l2-8H6"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg>';
  const GIFT = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M12 9v12M2 9h20V5H2zM12 5c-1.7 0-4-.6-4-2.2C8 1.6 9 1 10 1c1.5 0 2 1.7 2 4Zm0 0c1.7 0 4-.6 4-2.2C16 1.6 15 1 14 1c-1.5 0-2 1.7-2 4Z"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>';

  OS.register('checkout-offer-progress', {
    name: 'Progress', icon: 'layers',
    schema: [
      { info: 'This is a generic buyer-facing progress cue, not the real Funnel node path.' },
      { key: 'order_label', label: 'Order stage label', control: 'text', default: 'Order confirmed' },
      { key: 'offer_label', label: 'Offer stage label', control: 'text', default: 'Special offer' },
      { key: 'complete_label', label: 'Complete stage label', control: 'text', default: 'Complete' },
      { key: 'show_labels', label: 'Show stage labels', control: 'toggle', default: false },
      { sub: 'Style' },
      { key: 'active_color', label: 'Active color', control: 'color', default: '' },
      { key: 'inactive_color', label: 'Inactive color', control: 'color', default: '#D9D9D9' },
    ],
    render(s) {
      const active = s.active_color || 'var(--ck-accent)';
      const inactive = s.inactive_color || '#D9D9D9';
      const stage = (cls, ico, label) => '<div class="ckop-stage ' + cls + '">' +
        '<span class="ckop-dot">' + ico + '</span>' +
        (s.show_labels ? '<span class="ckop-label">' + esc(label) + '</span>' : '') +
      '</div>';
      return '<div class="cksec ckop" style="--ckop-active:' + active + ';--ckop-inactive:' + inactive + '">' +
        stage('done', CART, s.order_label || 'Order confirmed') +
        '<span class="ckop-line done"></span>' +
        stage('current', GIFT, s.offer_label || 'Special offer') +
        '<span class="ckop-line"></span>' +
        stage('', CHECK, s.complete_label || 'Complete') +
      '</div>';
    },
  });

  OS.css('ck-offer-progress', `
  .ckop{display:flex;align-items:flex-start;width:100%;padding:6px 0 4px;box-sizing:border-box}
  .ckop-stage{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;flex:none;color:var(--ckop-inactive)}
  .ckop-dot{width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:var(--ck-page-bg);box-sizing:border-box}
  .ckop-stage.done,.ckop-stage.current{color:var(--ckop-active)}
  .ckop-stage.current .ckop-dot{background:var(--ckop-active);color:#fff}
  .ckop-line{height:3px;flex:1;margin:12px 4px 0;border-radius:99px;background:var(--ckop-inactive)}
  .ckop-line.done{background:var(--ckop-active)}
  .ckop-label{max-width:110px;font-size:10px;line-height:1.2;text-align:center;color:currentColor}
  `);
})();
