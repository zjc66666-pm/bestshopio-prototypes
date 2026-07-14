/* BestShopio Admin · Post purchase — demo data and isolated App state.
   The App owns its funnel, eligibility and session data. Checkout hosts only ask
   for a decision; a disabled or ineligible session returns `skip` and continues
   directly to Thank you. */
(function () {
  var SEED = {
    settings: {
      enabled: true,
      nativeCheckout: true,
      bestCheckout: true,
      fallback: 'thank_you',
      maxSteps: 3,
      offerWindow: 8,
      defaultLanguage: 'English',
      languages: ['English', 'French', 'German'],
      excludeExistingProducts: true,
      inventoryGuard: true,
      variantGuard: true,
      marginGuard: true,
      minMargin: 35,
      orderUpdateMode: 'append_original',
    },
    products: [
      { id: 'p-sleep', name: 'Magnesium Sleep Formula', variant: '60 capsules', sku: 'MAG-60', price: 39, compareAt: 49, stock: 182, margin: 62, img: 'https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?auto=format&fit=crop&w=160&q=80' },
      { id: 'p-gummies', name: 'Nighttime Gummies', variant: 'Mixed berry, 30 count', sku: 'NGM-30', price: 24, compareAt: 30, stock: 146, margin: 58, img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=160&q=80' },
      { id: 'p-mask', name: 'Cooling Sleep Mask', variant: 'Midnight blue', sku: 'MSK-MID', price: 18, compareAt: 24, stock: 93, margin: 51, img: 'https://images.unsplash.com/photo-1571272718568-95c8c0d9b0e0?auto=format&fit=crop&w=160&q=80' },
      { id: 'p-pouch', name: 'Travel Supplement Pouch', variant: 'Small', sku: 'TP-S', price: 12, compareAt: 16, stock: 36, margin: 47, img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=160&q=80' },
      { id: 'p-bundle', name: 'Sleep Reset Bundle', variant: 'Formula + mask + gummies', sku: 'SRB-01', price: 64, compareAt: 81, stock: 58, margin: 55, img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=160&q=80' },
      { id: 'p-refill', name: 'Magnesium Formula Refill', variant: '60 capsules', sku: 'MAG-R60', price: 32, compareAt: 39, stock: 212, margin: 59, img: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=160&q=80' },
    ],
    templates: [
      { id: 'related', name: 'Related add-on', description: 'Offer a product frequently bought with the completed order.', nodes: 'Upsell -> Downsell -> Thank you', icon: 'spark' },
      { id: 'bundle', name: 'One-click bundle', description: 'Let buyers complete the set with a pre-priced bundle.', nodes: 'Upsell -> Thank you', icon: 'box' },
      { id: 'upgrade', name: 'Upgrade the order', description: 'Offer a higher-value version, then a lower-priced fallback.', nodes: 'Upsell -> Downsell -> Thank you', icon: 'arrowUp' },
      { id: 'recovery', name: 'Accessory recovery', description: 'Show a single accessory only after a qualifying product purchase.', nodes: 'Upsell -> Thank you', icon: 'refresh' },
    ],
    funnels: [
      {
        id: 'f-sleep-reset',
        name: 'Sleep Reset add-on',
        status: 'active',
        priority: 1,
        hosts: ['native', 'bestcheckout'],
        traffic: 100,
        created: 'Jul 2, 2026',
        updated: '18 min ago',
        triggerSummary: 'Magnesium Sleep Formula or Sleep collection',
        stats: { shown: 1842, accepted: 276, acceptRate: 15.0, revenue: 6624, avgLift: 24.00, skipped: 138 },
        rules: [
          { id: 'r1', group: 'Order', field: 'Purchased product', op: 'includes any', value: 'Magnesium Sleep Formula, Sleep collection', enabled: true },
          { id: 'r2', group: 'Order', field: 'Order value', op: 'is at least', value: '$35', enabled: true },
          { id: 'r3', group: 'Customer', field: 'Customer type', op: 'is', value: 'New or returning', enabled: true },
        ],
        exclusions: ['Existing items in the order', 'Out-of-stock variants', 'Orders below 35% margin'],
        nodes: [
          { id: 'entry', type: 'entry', title: 'Payment succeeded', detail: 'Eligible completed checkout', locked: true },
          { id: 'up1', type: 'upsell', title: 'Complete the bedtime routine', detail: 'Frequently bought together', productId: 'p-gummies', source: 'Frequently bought together', discount: 20, quantity: 1, branch: 'accepted', test: { enabled: true, split: 50, variantB: 'p-mask', bDiscount: 15, winner: null } },
          { id: 'down1', type: 'downsell', title: 'Try a smaller add-on', detail: 'Only after decline', productId: 'p-mask', source: 'Manual product', discount: 25, quantity: 1, branch: 'declined' },
          { id: 'thank', type: 'thank', title: 'Thank you', detail: 'Finalized order and receipt', locked: true },
        ],
        edges: [
          { from: 'entry', to: 'up1', label: 'eligible' },
          { from: 'up1', to: 'thank', label: 'accepted' },
          { from: 'up1', to: 'down1', label: 'declined' },
          { from: 'down1', to: 'thank', label: 'accepted or declined' },
        ],
      },
      {
        id: 'f-bundle-upgrade',
        name: 'Sleep Reset bundle upgrade',
        status: 'active',
        priority: 2,
        hosts: ['bestcheckout'],
        traffic: 100,
        created: 'Jun 28, 2026',
        updated: 'Yesterday',
        triggerSummary: 'Cart value $60+ and no Sleep Reset Bundle',
        stats: { shown: 712, accepted: 91, acceptRate: 12.8, revenue: 3185, avgLift: 35.00, skipped: 46 },
        rules: [
          { id: 'r1', group: 'Order', field: 'Order value', op: 'is at least', value: '$60', enabled: true },
          { id: 'r2', group: 'Order', field: 'Purchased product', op: 'excludes', value: 'Sleep Reset Bundle', enabled: true },
          { id: 'r3', group: 'Checkout', field: 'Channel', op: 'is', value: 'BestCheckout', enabled: true },
        ],
        exclusions: ['Out-of-stock variants', 'Multi-currency checkout'],
        nodes: [
          { id: 'entry', type: 'entry', title: 'Payment succeeded', detail: 'Eligible BestCheckout payment', locked: true },
          { id: 'up1', type: 'upsell', title: 'Upgrade to the full routine', detail: 'Manual bundle offer', productId: 'p-bundle', source: 'Manual product', discount: 10, quantity: 1, branch: 'accepted', test: { enabled: false, split: 50, variantB: 'p-bundle', bDiscount: 15, winner: null } },
          { id: 'thank', type: 'thank', title: 'Thank you', detail: 'Finalized order and receipt', locked: true },
        ],
        edges: [
          { from: 'entry', to: 'up1', label: 'eligible' },
          { from: 'up1', to: 'thank', label: 'accepted or declined' },
        ],
      },
      {
        id: 'f-refill',
        name: 'Formula refill for repeat buyers',
        status: 'paused',
        priority: 3,
        hosts: ['native', 'bestcheckout'],
        traffic: 100,
        created: 'Jun 19, 2026',
        updated: '3 days ago',
        triggerSummary: 'Returning customer, last purchase 28 to 45 days ago',
        stats: { shown: 430, accepted: 49, acceptRate: 11.4, revenue: 1254, avgLift: 25.59, skipped: 17 },
        rules: [
          { id: 'r1', group: 'Customer', field: 'Order history', op: 'last purchase was', value: '28 to 45 days ago', enabled: true },
          { id: 'r2', group: 'Customer', field: 'Customer type', op: 'is', value: 'Returning', enabled: true },
        ],
        exclusions: ['Existing items in the order', 'Offer shown once per customer'],
        nodes: [
          { id: 'entry', type: 'entry', title: 'Payment succeeded', detail: 'Eligible completed checkout', locked: true },
          { id: 'up1', type: 'upsell', title: 'Time for a refill?', detail: 'Repeat-customer recommendation', productId: 'p-refill', source: 'Manual product', discount: 12, quantity: 1, branch: 'accepted', test: { enabled: false, split: 50, variantB: 'p-refill', bDiscount: 15, winner: null } },
          { id: 'thank', type: 'thank', title: 'Thank you', detail: 'Finalized order and receipt', locked: true },
        ],
        edges: [
          { from: 'entry', to: 'up1', label: 'eligible' },
          { from: 'up1', to: 'thank', label: 'accepted or declined' },
        ],
      },
      {
        id: 'f-travel',
        name: 'Travel pouch fallback',
        status: 'draft',
        priority: 4,
        hosts: ['native'],
        traffic: 50,
        created: 'Jul 10, 2026',
        updated: 'Draft',
        triggerSummary: 'Orders with 2+ supplements',
        stats: { shown: 0, accepted: 0, acceptRate: 0, revenue: 0, avgLift: 0, skipped: 0 },
        rules: [
          { id: 'r1', group: 'Order', field: 'Product quantity', op: 'is at least', value: '2 supplements', enabled: true },
        ],
        exclusions: ['Out-of-stock variants'],
        nodes: [
          { id: 'entry', type: 'entry', title: 'Payment succeeded', detail: 'Eligible completed checkout', locked: true },
          { id: 'up1', type: 'upsell', title: 'Take the routine with you', detail: 'Manual accessory', productId: 'p-pouch', source: 'Manual product', discount: 15, quantity: 1, branch: 'accepted', test: { enabled: false, split: 50, variantB: 'p-pouch', bDiscount: 20, winner: null } },
          { id: 'thank', type: 'thank', title: 'Thank you', detail: 'Finalized order and receipt', locked: true },
        ],
        edges: [
          { from: 'entry', to: 'up1', label: 'eligible' },
          { from: 'up1', to: 'thank', label: 'accepted or declined' },
        ],
      },
    ],
    activity: [
      { id: 'pp-10482', time: 'Just now', order: '#10482', session: 'PP-7EF4', host: 'Native checkout', funnelId: 'f-sleep-reset', outcome: 'accepted', title: 'Nighttime Gummies added to the original order', amount: 19.20, detail: 'Card token reused. Order update synced.', steps: [ ['Payment succeeded', 'Completed with Visa'], ['Eligibility passed', 'Sleep Formula matched. Order value $58.00.'], ['Offer shown', 'Variant A: Nighttime Gummies at 20% off'], ['Accepted', 'One-click additional charge approved'], ['Order updated', 'Line item appended to #10482'], ['Thank you', 'Final order receipt displayed'] ] },
      { id: 'pp-10481', time: '6 min ago', order: '#10481', session: 'PP-7EF3', host: 'BestCheckout', funnelId: 'f-sleep-reset', outcome: 'declined', title: 'Downsell was declined', amount: 0, detail: 'Buyer reached Thank you with the original order unchanged.', steps: [ ['Payment succeeded', 'Completed with Mastercard'], ['Eligibility passed', 'Sleep Formula matched.'], ['Upsell declined', 'Nighttime Gummies was declined'], ['Downsell shown', 'Cooling Sleep Mask at 25% off'], ['Downsell declined', 'No additional charge'], ['Thank you', 'Original order finalized'] ] },
      { id: 'pp-10480', time: '15 min ago', order: '#10480', session: 'PP-7EF2', host: 'Native checkout', funnelId: '', outcome: 'skipped', title: 'Skipped: unsupported wallet', amount: 0, detail: 'Apple Pay cannot authorize a post-purchase one-click charge for this checkout.', steps: [ ['Payment succeeded', 'Completed with Apple Pay'], ['Eligibility skipped', 'Unsupported payment method: Apple Pay'], ['Fallback', 'Sent directly to Thank you'] ] },
      { id: 'pp-10479', time: '27 min ago', order: '#10479', session: 'PP-7EF1', host: 'Native checkout', funnelId: '', outcome: 'skipped', title: 'Skipped: multi-currency checkout', amount: 0, detail: 'Checkout was completed in EUR. One-click post-purchase is limited to the store base currency.', steps: [ ['Payment succeeded', 'Completed in EUR'], ['Eligibility skipped', 'Multi-currency checkout'], ['Fallback', 'Sent directly to Thank you'] ] },
      { id: 'pp-10478', time: '39 min ago', order: '#10478', session: 'PP-7EF0', host: 'BestCheckout', funnelId: 'f-bundle-upgrade', outcome: 'charge_failed', title: 'Additional charge was not approved', amount: 57.60, detail: 'The original order remains paid. The buyer saw a clear confirmation and continued to Thank you.', steps: [ ['Payment succeeded', 'Completed with Visa'], ['Eligibility passed', 'Bundle upgrade rules matched.'], ['Offer accepted', 'Sleep Reset Bundle at 10% off'], ['Additional charge failed', 'Issuer declined the new authorization'], ['Order unchanged', 'No extra line item was created'], ['Thank you', 'Original order finalized'] ] },
      { id: 'pp-10477', time: '1 hr ago', order: '#10477', session: 'PP-7EEF', host: 'Native checkout', funnelId: '', outcome: 'skipped', title: 'Skipped: no matching variant', amount: 0, detail: 'The product mapping requires a matching size variant, but the order contained an excluded size.', steps: [ ['Payment succeeded', 'Completed with Shop Pay'], ['Eligibility skipped', 'No matching variant for selected mapping'], ['Fallback', 'Sent directly to Thank you'] ] },
      { id: 'pp-10476', time: '2 hr ago', order: '#10476', session: 'PP-7EEE', host: 'BestCheckout', funnelId: 'f-sleep-reset', outcome: 'accepted', title: 'Cooling Sleep Mask added to the original order', amount: 13.50, detail: 'Downsell accepted after the first offer was declined.', steps: [ ['Payment succeeded', 'Completed with Visa'], ['Eligibility passed', 'Sleep Formula matched.'], ['Upsell declined', 'Nighttime Gummies was declined'], ['Downsell accepted', 'Cooling Sleep Mask at 25% off'], ['Order updated', 'Line item appended to #10476'], ['Thank you', 'Final order receipt displayed'] ] },
    ],
    compatibility: [
      { label: 'Credit / debit card', state: 'supported', note: 'Vaulted payment token can be used for an additional one-click charge.' },
      { label: 'Shop Pay', state: 'supported', note: 'Supported only for full-payment checkouts.' },
      { label: 'PayPal Express', state: 'conditional', note: 'Requires Reference Transactions / Automatic Payments.' },
      { label: 'Apple Pay, Google Pay, installments', state: 'unsupported', note: 'The App returns skip and sends the buyer straight to Thank you.' },
      { label: 'Multi-currency and duties', state: 'unsupported', note: 'Eligible only when checkout uses the store base currency.' },
      { label: 'Gift card, COD, manual payment', state: 'unsupported', note: 'No payment token is available for a one-click additional charge.' },
    ],
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function key() { return 'bsio_post_purchase_state_v1'; }
  function normalize(value) {
    var next = value && typeof value === 'object' ? value : clone(SEED);
    next.settings = next.settings || {};
    // These safeguards protect fulfillment correctness, so a stale local demo
    // state must never turn them off.
    next.settings.inventoryGuard = true;
    next.settings.variantGuard = true;
    if (next.settings.marginGuard == null) next.settings.marginGuard = true;
    if (next.settings.excludeExistingProducts == null) next.settings.excludeExistingProducts = true;
    return next;
  }
  function read() {
    try {
      var saved = localStorage.getItem(key());
      if (saved) return normalize(JSON.parse(saved));
    } catch (e) {}
    return normalize(clone(SEED));
  }
  function write(value) {
    var next = normalize(value);
    try { localStorage.setItem(key(), JSON.stringify(next)); } catch (e) {}
    return next;
  }
  function reset() {
    var fresh = clone(SEED);
    write(fresh);
    return fresh;
  }

  window.DATA_POST_PURCHASE = SEED;
  window.PostPurchaseStore = { key: key, read: read, write: write, reset: reset, clone: clone };
})();
