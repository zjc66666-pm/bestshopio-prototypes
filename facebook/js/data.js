/* BestShopio Admin · Facebook & Instagram workspace — Meta Pixel + CAPI + Shop + Ads.
   Mirrors Shopline's per-channel sales channel layout. Workspace home is a
   single-column big-card stack (left text + right illustration); each module
   sub-page has its own structure (Data tracking is a 3-section left/right page:
   Website data reporting (P0 — multi-Pixel table + Add modal) / Offline data
   reporting (P1 placeholder) / Social e-commerce conversion event reporting (P1
   placeholder)).

   Illustrations: lightweight inline SVGs (240×140) — own assets, no Shopline
   CDN dependency. Soft-blue radial bg + a single concept shape per module.
*/
(function () {
  // === Illustrations — inline SVG, kept simple geometric. Each is 240×140 to
  // sit on the right side of a workspace home card. Soft-blue bg layer is shared.
  function svgBg() {
    return '<defs>' +
      '<radialGradient id="fbI-bg" cx="50%" cy="50%" r="60%">' +
        '<stop offset="0%" stop-color="#eaf2ff"/>' +
        '<stop offset="100%" stop-color="#eaf2ff" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<circle cx="120" cy="70" r="65" fill="url(#fbI-bg)"/>';
  }
  // Meta brand mark (simplified ∞), used as a small inline accent.
  function metaDot(x, y, size, opacity) {
    var s = size || 22, o = opacity || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + (s / 24) + ')" opacity="' + o + '">' +
      '<circle r="12" cx="12" cy="12" fill="#1877F2"/>' +
      '<path d="M4 12c0-2.5 2-4.5 4.5-4.5 2 0 3 1.5 3.5 3 .5-1.5 1.5-3 3.5-3 2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5c-2 0-3-1.5-3.5-3-.5 1.5-1.5 3-3.5 3-2.5 0-4.5-2-4.5-4.5z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</g>';
  }

  const ILLU = {
    // Domain verification — page card with a green check badge + Meta accent
    domain:
      '<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg">' + svgBg() +
        // page card
        '<rect x="62" y="28" width="116" height="84" rx="8" fill="#fff" stroke="#cfddff" stroke-width="1.2"/>' +
        // page rows
        '<rect x="74" y="42" width="44" height="4" rx="2" fill="#cfddff"/>' +
        '<rect x="74" y="52" width="92" height="3" rx="1.5" fill="#dfe7f7"/>' +
        '<rect x="74" y="60" width="74" height="3" rx="1.5" fill="#dfe7f7"/>' +
        // image placeholder
        '<rect x="74" y="72" width="92" height="28" rx="4" fill="#f0f4fc"/>' +
        // green check seal
        '<circle cx="178" cy="36" r="14" fill="#22c55e"/>' +
        '<path d="m172 36 4.5 4.5L186 31" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        // meta accent
        metaDot(48, 92, 22) +
      '</svg>',

    // Data tracking — chart card + ascending line + user dots + Meta accent
    tracking:
      '<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg">' + svgBg() +
        // card
        '<rect x="70" y="34" width="120" height="76" rx="8" fill="#fff" stroke="#cfddff" stroke-width="1.2"/>' +
        // grid
        '<line x1="82" y1="98" x2="178" y2="98" stroke="#e6ecf7" stroke-width="1"/>' +
        '<line x1="82" y1="82" x2="178" y2="82" stroke="#e6ecf7" stroke-width="1"/>' +
        '<line x1="82" y1="66" x2="178" y2="66" stroke="#e6ecf7" stroke-width="1"/>' +
        // line chart (rising)
        '<polyline points="82,94 100,86 122,76 144,68 164,58 178,52" fill="none" stroke="#1877F2" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
        // dots
        '<circle cx="122" cy="76" r="2.6" fill="#1877F2"/>' +
        '<circle cx="164" cy="58" r="2.6" fill="#1877F2"/>' +
        // user avatars
        '<circle cx="52" cy="50" r="9" fill="#cfddff"/><circle cx="52" cy="50" r="9" fill="none" stroke="#fff" stroke-width="2"/>' +
        '<circle cx="36" cy="76" r="9" fill="#a3c1f7"/><circle cx="36" cy="76" r="9" fill="none" stroke="#fff" stroke-width="2"/>' +
        '<circle cx="48" cy="102" r="9" fill="#7da7f4"/><circle cx="48" cy="102" r="9" fill="none" stroke="#fff" stroke-width="2"/>' +
        // meta accent
        metaDot(192, 96, 22) +
      '</svg>',

    // Shop — F + IG gradient tile + 3 product cards + SHOP tag
    shop:
      '<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg">' +
        '<defs>' +
          '<radialGradient id="fbS-bg" cx="50%" cy="50%" r="60%">' +
            '<stop offset="0%" stop-color="#eaf2ff"/><stop offset="100%" stop-color="#eaf2ff" stop-opacity="0"/></radialGradient>' +
          '<linearGradient id="igGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#feda75"/><stop offset="40%" stop-color="#d62976"/><stop offset="100%" stop-color="#962fbf"/></linearGradient>' +
        '</defs>' +
        '<circle cx="120" cy="70" r="65" fill="url(#fbS-bg)"/>' +
        // FB tile
        '<rect x="42" y="22" width="32" height="32" rx="7" fill="#1877F2"/>' +
        '<path d="M62 32h-2c-1 0-1.5.4-1.5 1.5V36h3l-.4 3h-2.6v8h-3v-8h-2v-3h2v-2.4c0-2 1-3.1 3.3-3.1H62z" fill="#fff"/>' +
        // IG tile
        '<rect x="80" y="22" width="32" height="32" rx="9" fill="url(#igGrad)"/>' +
        '<rect x="86" y="28" width="20" height="20" rx="5" fill="none" stroke="#fff" stroke-width="1.6"/>' +
        '<circle cx="96" cy="38" r="4" fill="none" stroke="#fff" stroke-width="1.6"/>' +
        '<circle cx="102" cy="32" r="1.2" fill="#fff"/>' +
        // 3 product cards
        '<rect x="38" y="68" width="44" height="50" rx="6" fill="#fff" stroke="#cfddff" stroke-width="1"/>' +
        '<rect x="44" y="74" width="32" height="22" rx="3" fill="#e8f0fe"/>' +
        '<rect x="44" y="100" width="20" height="3" rx="1.5" fill="#cfddff"/>' +
        '<rect x="44" y="106" width="14" height="3" rx="1.5" fill="#dfe7f7"/>' +

        '<rect x="92" y="68" width="44" height="50" rx="6" fill="#fff" stroke="#cfddff" stroke-width="1"/>' +
        '<rect x="98" y="74" width="32" height="22" rx="3" fill="#e8f0fe"/>' +
        '<rect x="98" y="100" width="20" height="3" rx="1.5" fill="#cfddff"/>' +
        '<rect x="98" y="106" width="14" height="3" rx="1.5" fill="#dfe7f7"/>' +

        '<rect x="146" y="68" width="44" height="50" rx="6" fill="#fff" stroke="#cfddff" stroke-width="1"/>' +
        '<rect x="152" y="74" width="32" height="22" rx="3" fill="#e8f0fe"/>' +
        '<rect x="152" y="100" width="20" height="3" rx="1.5" fill="#cfddff"/>' +
        '<rect x="152" y="106" width="14" height="3" rx="1.5" fill="#dfe7f7"/>' +
        // SHOP tag
        '<g transform="translate(168,52)">' +
          '<rect x="0" y="0" width="32" height="14" rx="3" fill="#1877F2"/>' +
          '<text x="16" y="10" text-anchor="middle" font-family="-apple-system,system-ui" font-size="8" font-weight="700" fill="#fff">SHOP</text>' +
        '</g>' +
      '</svg>',

    // Advertising — product card + Ad tag + growth badge
    ads:
      '<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg">' + svgBg() +
        // product card
        '<rect x="58" y="22" width="92" height="96" rx="8" fill="#fff" stroke="#cfddff" stroke-width="1.2"/>' +
        '<rect x="68" y="32" width="72" height="50" rx="5" fill="#e8f0fe"/>' +
        // ring earring placeholder
        '<circle cx="92" cy="56" r="9" fill="none" stroke="#1877F2" stroke-width="2"/>' +
        '<circle cx="116" cy="56" r="9" fill="none" stroke="#1877F2" stroke-width="2"/>' +
        // text rows
        '<rect x="68" y="90" width="48" height="4" rx="2" fill="#cfddff"/>' +
        '<rect x="68" y="100" width="32" height="3" rx="1.5" fill="#dfe7f7"/>' +
        // Ad badge top-right
        '<rect x="132" y="14" width="28" height="18" rx="4" fill="#f59e0b"/>' +
        '<text x="146" y="26" text-anchor="middle" font-family="-apple-system,system-ui" font-size="9" font-weight="700" fill="#fff">Ad</text>' +
        // growth badge bottom-right
        '<g transform="translate(150,90)">' +
          '<rect x="0" y="0" width="56" height="22" rx="6" fill="#fff" stroke="#22c55e" stroke-width="1.6"/>' +
          '<text x="16" y="15" text-anchor="middle" font-family="-apple-system,system-ui" font-size="10" font-weight="700" fill="#16a34a">72.9%</text>' +
          '<path d="m40 8 6-4 6 4" stroke="#22c55e" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</g>' +
      '</svg>',

    // Community marketing — Messenger + IG + product (heel) + chat bubbles
    social:
      '<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg">' +
        '<defs>' +
          '<radialGradient id="fbC-bg" cx="50%" cy="50%" r="60%">' +
            '<stop offset="0%" stop-color="#eaf2ff"/><stop offset="100%" stop-color="#eaf2ff" stop-opacity="0"/></radialGradient>' +
          '<linearGradient id="igGrad2" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#feda75"/><stop offset="40%" stop-color="#d62976"/><stop offset="100%" stop-color="#962fbf"/></linearGradient>' +
        '</defs>' +
        '<circle cx="120" cy="70" r="65" fill="url(#fbC-bg)"/>' +
        // IG tile
        '<rect x="38" y="20" width="28" height="28" rx="8" fill="url(#igGrad2)"/>' +
        '<rect x="44" y="26" width="16" height="16" rx="4" fill="none" stroke="#fff" stroke-width="1.4"/>' +
        '<circle cx="52" cy="34" r="3.2" fill="none" stroke="#fff" stroke-width="1.4"/>' +
        // Messenger tile
        '<rect x="74" y="20" width="28" height="28" rx="8" fill="#8b5cf6"/>' +
        '<path d="M88 28c-5 0-8 3.6-8 7.8 0 2.4 1 4.5 2.8 5.9V46l2.6-1.5c.8.2 1.7.4 2.6.4 5 0 8-3.6 8-7.8s-3-7.1-8-7.1z" fill="#fff"/>' +
        '<path d="m83 38 3-3 2 2 5-4" stroke="#8b5cf6" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        // product card (heel)
        '<rect x="110" y="50" width="84" height="76" rx="8" fill="#fff" stroke="#cfddff" stroke-width="1.2"/>' +
        '<path d="M120 100c0-2 1-4 3-5l32-18c4-2 8 0 8 4v2c0 3-2 5-5 5h-30c-4 0-8 4-8 8z M152 80c2-3 6-3 8 0" stroke="#ef4444" stroke-width="2" fill="#fee2e2" stroke-linejoin="round"/>' +
        // bubbles
        '<circle cx="34" cy="70" r="11" fill="#fff" stroke="#cfddff" stroke-width="1.4"/>' +
        '<circle cx="34" cy="68" r="2" fill="#cfddff"/><circle cx="40" cy="68" r="2" fill="#cfddff"/><circle cx="28" cy="68" r="2" fill="#cfddff"/>' +
        '<circle cx="52" cy="98" r="11" fill="#fff" stroke="#cfddff" stroke-width="1.4"/>' +
        '<circle cx="52" cy="96" r="2" fill="#cfddff"/><circle cx="58" cy="96" r="2" fill="#cfddff"/><circle cx="46" cy="96" r="2" fill="#cfddff"/>' +
        '<circle cx="86" cy="118" r="11" fill="#fff" stroke="#cfddff" stroke-width="1.4"/>' +
        '<circle cx="86" cy="116" r="2" fill="#cfddff"/><circle cx="92" cy="116" r="2" fill="#cfddff"/><circle cx="80" cy="116" r="2" fill="#cfddff"/>' +
      '</svg>',
  };

  window.DATA_FACEBOOK = {
    // Workspace home — 5 feature modules (single-column big cards, Shopline-style)
    modules: [
      { id: 'domain',    title: 'Domain verification', sub: 'Verify domain ownership',
        desc: 'Domain ownership lets you retain control over editing links or other content, hence safeguarding your domain from malicious activities.',
        enabled: false, illu: ILLU.domain },
      { id: 'pixel',     title: 'Data tracking', sub: 'Send conversion events back to Meta',
        desc: 'Boost ad efficiency with Website Pixel, CAPI, and Offline CAPI by sending back conversion data to Meta. Connected accounts:',
        enabled: true,  illu: ILLU.tracking, connectedHint: true },
      { id: 'shop',      title: 'Shop', titleBadge: 'NEW', sub: 'Sell your products on Facebook and Instagram',
        desc: 'Showcase your products on social media to increase brand awareness and sales.',
        enabled: false, illu: ILLU.shop },
      { id: 'ads',       title: 'Advertising', sub: 'Expand your customer base using Meta ads',
        desc: 'Use the Ads Management tool to easily handle account setup, ad configuration, performance tracking, and financial reconciliation. Facebook Ads Manager is Facebook\'s native professional ad management tool.',
        enabled: false, illu: ILLU.ads, ctaText: 'Original ad tools' },
      { id: 'messenger', title: 'Community marketing', sub: 'Use Facebook Messenger to sell products to your customers',
        desc: 'Connect multiple Messenger and Instagram accounts to easily manage incoming messages.',
        enabled: false, illu: ILLU.social },
    ],

    // === Data tracking sub-page state — multi-Pixel array (Website data reporting)
    // Each pixel has: pixelId / capiToken (masked or 'verified') / createSource / status
    pixels: [
      { pixelId: '1665673578033672', capiToken: 'EAA*****DZD', createSource: 'Add manually', status: 'verified' },
    ],

    // tracking event dropdown options (Add Pixel modal)
    trackingEvents: [
      { value: 'page_view',      label: 'A customer visits any webpage of the online store' },
      { value: 'view_item',      label: 'A customer views a product or offer page' },
      { value: 'add_to_cart',    label: 'A customer adds a product to cart' },
      { value: 'begin_checkout', label: 'A customer lands on the checkout page' },
      { value: 'add_payment',    label: 'A customer fills in payment information' },
      { value: 'purchase',       label: 'A customer completes a purchase' },
    ],
    pageTypes: [
      { value: 'online_store', label: 'Online store' },
      { value: 'checkout',     label: 'Checkout' },
      { value: 'thank_you',    label: 'Thank-you page' },
    ],

    // P1 placeholder sections (Offline data reporting / Social e-commerce conversion event reporting)
    offlineAuth: { authorized: false },
    messagingAuth: { authorized: false },

    // External help link — Meta Pixel Helper Chrome extension
    pixelHelperUrl: 'https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc',
    pixelHelperLearnUrl: 'https://www.facebook.com/business/help/198406697184833', // duplicate-pixels help
  };
})();
