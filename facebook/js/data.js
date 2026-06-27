/* BestShopio Admin · Facebook & Instagram workspace — Meta Pixel + Conversion API + Shop + Ads.
   Mirrors Shopline's per-channel workspace layout (sales channels approach):
   the workspace home is a card grid of feature modules; each module is its own
   sub-page. P0 ships only Data tracking (Pixel + CAPI); the rest are placeholders.

   Data tracking event map matches BestCheckout's auto-fired events (Order journey
   diagram: BestCheckout assembles + fires events server-side via CAPI in parallel
   with the storefront Pixel, sharing event_id for dedup).
*/
window.DATA_FACEBOOK = {
  // Meta Pixel + Conversion API config (was in DATA_SETTINGS.pixels.platforms.meta)
  pixel: {
    enabled: true,
    pixelId: '102938475610293',
    capiToken: 'EAA•••••••••••••••',
    testEventCode: '',
    advMatching: true,
    docs: 'https://www.facebook.com/business/help/952192354843755',
  },
  // BestShopio's unified event catalog -> Meta vendor names (subset of the matrix in DATA_SETTINGS.pixels.events)
  events: [
    { id: 'page_view',      name: 'Page view',                    meta: 'PageView',         fires: 'Every storefront page load' },
    { id: 'view_item',      name: 'View product / offer',         meta: 'ViewContent',      fires: 'Product page, upsell offer, downsell offer' },
    { id: 'add_to_cart',    name: 'Add to cart / accept upsell',  meta: 'AddToCart',        fires: 'Cart add + one-click upsell accept' },
    { id: 'begin_checkout', name: 'Begin checkout',               meta: 'InitiateCheckout', fires: 'Buyer lands on the checkout page' },
    { id: 'add_payment',    name: 'Payment info added',           meta: 'AddPaymentInfo',   fires: 'Buyer fills payment method' },
    { id: 'purchase',       name: 'Purchase',                     meta: 'Purchase',         fires: 'Order written back (Thank-you / order_create webhook)' },
  ],
  // Workspace home — feature modules. P0 = Data tracking only; others ship later.
  modules: [
    { id: 'domain',    title: 'Domain verification', subtitle: 'Claim ownership of your domain',
      desc: 'Owning the domain lets you control link / asset editing permissions and prevents misuse.',
      enabled: false, badge: 'P1' },
    { id: 'pixel',     title: 'Data tracking', subtitle: 'Meta Pixel + Conversion API',
      desc: 'Send conversion events to Meta via Pixel and Conversion API to evaluate and optimize ad performance.',
      enabled: true,  badge: 'P0' },
    { id: 'shop',      title: 'Sell via Facebook & Instagram Shop', subtitle: 'FB Shop + IG Shop',
      desc: 'Showcase and sell products on your social pages so customers can buy on Facebook and Instagram without leaving the app.',
      enabled: false, badge: 'P1' },
    { id: 'ads',       title: 'Ad management', subtitle: 'Use Facebook Ads to expand your audience',
      desc: 'Open accounts, configure campaigns, track performance and reconcile finance from one place. Facebook Ads Manager is the native ad tool.',
      enabled: false, badge: 'P1' },
    { id: 'messenger', title: 'Social marketing', subtitle: 'Talk to customers via Messenger',
      desc: 'Manage Messenger and Instagram messages and posts for multiple Pages in one place.',
      enabled: false, badge: 'P1' },
  ],
};
