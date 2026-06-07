/* BestShopio Admin · Online store prototype — sample data.
   Shapes mirror the real module 1:1:
     - THEMES[]            -> ThemeListItem (api/modules/admin/designConfig.ts):
                              { id, handle, title, pc_image, h5_image, created_time, updated_time }
     - PAGE_TYPES[]        -> pageTypeOptions in themeEdit.tsx (Home page / Collections / Products)
     - COMPONENT_LIBRARY[] -> the builder's "Add section" block list (componentId + label + group)
     - PAGES{}             -> per page-type component lists keyed HOME / PRODUCT_LIST / PRODUCT_DETAIL,
                              each entry { instanceId, componentId, settings } exactly as pagePresets.ts
     - GLOBAL              -> storefront-header / storefront-footer settings (globalShell in pagePresets.ts)
   Imagery uses the same Unsplash URLs as the real pagePresets seed data. */
(function () {
  // ---------- shared media (storefront photography, mirrors pagePresets.ts) ----------
  const IMG = {
    // hero slides (presetHeroSlides)
    hero1: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    hero2: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
    hero3: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
    hero4: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
    // category tiles (presetCategoryItems)
    cat1: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=700&q=80',
    cat2: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80',
    cat3: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=80',
    cat4: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=80',
    cat5: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=80',
    cat6: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=700&q=80',
    cat7: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=700&q=80',
    cat8: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=700&q=80',
    // promo / editorial floors (presetPromoItems / presetEditorialItems)
    promo1: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
    promo2: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
    promo3: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
    // product cards (mock — real floor pulls live products by id)
    prod1: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
    prod2: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
    prod3: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=600&q=80',
    prod4: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80',
  };

  // theme card thumbnails — rendered storefront-like screenshots (PC wide + H5 narrow)
  const PREVIEW = {
    folastPc: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1100&q=80',
    folastH5: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=520&q=80',
  };

  // ---------- THEME LIST ('My theme' tab — getThemeList / ThemeListItem) ----------
  // The real backend returns one default theme ("Folast"). Fields match the API 1:1.
  const THEMES = [
    {
      id: 1,
      handle: 'folast',
      title: 'Folast',
      pc_image: PREVIEW.folastPc,
      h5_image: PREVIEW.folastH5,
      created_time: '2026-05-06 04:13:15',
      updated_time: '2026-06-04 17:42:08',
    },
  ];

  // ---------- COMPONENT LIBRARY (left panel "Add section", HOME only) ----------
  // componentId values match pagePresets.ts homePagePreset. `pages` gates where a block may be added.
  // Collections / Products are system pages with fixed sections (no add-section library), like the real app.
  const COMPONENT_LIBRARY = [
    { componentId: 'hero-carousel',             label: 'Hero carousel',        desc: 'Full-width rotating banners with CTA',     icon: 'image',   group: 'Banners',    pages: ['HOME'] },
    { componentId: 'coupon-benefit-strip',      label: 'Coupon benefit strip', desc: 'Discount tiers + promo code chips',         icon: 'percent', group: 'Promotions', pages: ['HOME'] },
    { componentId: 'category-quick-entry-grid', label: 'Category quick entry', desc: 'Tappable collection tiles grid',            icon: 'grid',    group: 'Navigation', pages: ['HOME'] },
    { componentId: 'promo-product-floor',       label: 'Promo product floor',  desc: 'Merchandised promo image row',              icon: 'layers',  group: 'Product',    pages: ['HOME'] },
    { componentId: 'editorial-trend-floor',     label: 'Editorial trend floor',desc: 'Editorial trend image row',                icon: 'layers',  group: 'Product',    pages: ['HOME'] },
    { componentId: 'tabbed-product-floor',      label: 'Tabbed product floor', desc: 'Tabbed product grid (BestSellers…)',        icon: 'tabs',    group: 'Product',    pages: ['HOME'] },
  ];

  // descriptors for the fixed system sections used on Collections / Products pages.
  const SYSTEM_SECTIONS = {
    'product-list-page-header':                 { label: 'Collection header',        icon: 'header', desc: 'Title, breadcrumb and sort/filter bar' },
    'product-list-page-content':                { label: 'Collection product grid',  icon: 'grid',   desc: 'Filtered, paginated product grid' },
    'product-detail-page-main':                 { label: 'Product main',             icon: 'layers', desc: 'Gallery, price, variants and add-to-cart' },
    'product-detail-benefits-floor':            { label: 'Product benefits',         icon: 'percent',desc: 'Shipping / returns / guarantee strip' },
    'product-detail-recommendations-floor':     { label: 'You may also like',        icon: 'tabs',   desc: 'Recommended products carousel' },
  };

  // global blocks present on every page (header + footer), not removable
  const GLOBAL_BLOCKS = [
    { componentId: 'storefront-header', label: 'Header', icon: 'header', scope: 'global' },
    { componentId: 'storefront-footer', label: 'Footer', icon: 'footer', scope: 'global' },
  ];

  // ---------- GLOBAL shell settings (globalShell in pagePresets.ts) ----------
  const GLOBAL = {
    header: {
      instanceId: 'global-storefront-header',
      componentId: 'storefront-header',
      settings: {
        utilityText: 'FREE STANDARD SHIPPING $79+',
        utilityLinkText: 'DETAILS',
        utilityLinkHref: '/page/shipping-policy',
        logoText: 'Folast',
        homeHref: '/',
        categories: [
          { label: 'Bestsellers', href: '/products', dropdownColumns: [] },
          { label: 'New Arrivals', href: '/products', dropdownColumns: [] },
          {
            label: 'Clothing',
            href: '/products',
            dropdownColumns: [
              { links: [
                { label: 'Pants', href: '/products' },
                { label: 'Dresses', href: '/products' },
                { label: 'Shorts', href: '/products' },
                { label: 'Tops', href: '/products' },
              ] },
              { links: [
                { label: 'Plus Size', href: '/products' },
                { label: 'Joggers', href: '/products' },
                { label: 'Sports Bras', href: '/products' },
                { label: 'Beachwear', href: '/products' },
              ] },
            ],
          },
          { label: 'Sales', href: '/products', dropdownColumns: [] },
          { label: 'Pants', href: '/products', dropdownColumns: [] },
          { label: 'Dresses', href: '/products', dropdownColumns: [] },
        ],
      },
    },
    footer: {
      instanceId: 'global-storefront-footer',
      componentId: 'storefront-footer',
      settings: {
        linkSections: [
          { title: 'Shop', mobileTitle: '', links: [
            { label: 'Blog', href: '/blog', action: '' },
            { label: 'All Reviews', href: '/all-reviews', action: '' },
            { label: 'Sitemap', href: '/sitemap.html', action: '' },
          ] },
          { title: 'Support', mobileTitle: '', links: [
            { label: 'About Us', href: '/page/about-us', action: '' },
            { label: 'Contact Us', href: '/page/contact-us', action: '' },
            { label: 'Payment Method', href: '/page/payment-method', action: '' },
            { label: 'Order Tracking', href: '/order-tracking', action: '' },
          ] },
          { title: 'Policies', mobileTitle: 'Shopping Info', links: [
            { label: 'Shipping Policy', href: '/page/shipping-policy', action: '' },
            { label: 'Return & Refund Policy', href: '/page/return-refund-policy', action: '' },
            { label: 'Cookie Settings', href: '#cookie-settings', action: 'cookie-settings' },
          ] },
        ],
        contactItems: [
          { label: 'Company', value: 'Richan INC' },
          { label: 'Address', value: '7300 MILLER DR, FREDERICK CO 80504, US' },
          { label: 'Contact Us', value: 'support@bestvoy.com' },
          { label: 'Phone (US)', value: '+1 (508) 204-3308' },
        ],
        socialItems: [
          { label: 'Facebook', href: 'https://facebook.com' },
          { label: 'Instagram', href: 'https://instagram.com' },
          { label: 'Pinterest', href: 'https://pinterest.com' },
        ],
        paymentMethods: [
          { value: 'PayPal' },
          { value: 'Google Pay' },
          { value: 'Apple Pay' },
          { value: 'Visa' },
          { value: 'Mastercard' },
          { value: 'Klarna' },
        ],
        subscribeText: 'Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.',
        subscribePlaceholder: 'Please enter your email address',
        subscribeButtonText: 'Subscribe',
        subscribeSuccessText: 'Thanks for subscribing.',
        trustBadges: [{ value: 'DigiCert' }, { value: 'Trustpilot' }],
        copyrightText: '© 2026 Richan INC. All Rights Reserved.',
      },
    },
  };

  // ---------- PAGE component lists (per page-type, 1:1 with pagePresets.ts) ----------
  const PAGES = {
    // homePagePreset.pc
    HOME: [
      {
        instanceId: 'home-top-hero',
        componentId: 'hero-carousel',
        name: 'Hero carousel',
        settings: {
          eyebrow: '30+ New Daily Arrivals',
          title: 'New Linen-\nFeel Styles',
          ctaText: 'SHOP NOW',
          slides: [
            { id: 'hero-slide-1', url: IMG.hero1, alt: 'Model in a neutral linen look', href: '/collections/dresses' },
            { id: 'hero-slide-2', url: IMG.hero2, alt: 'Model in a soft sage outfit',   href: '/collections/tops' },
            { id: 'hero-slide-3', url: IMG.hero3, alt: 'Editorial shell tone fashion photo', href: '/collections/bottoms' },
            { id: 'hero-slide-4', url: IMG.hero4, alt: 'Street style fashion portrait', href: '/collections/sets' },
          ],
        },
      },
      {
        instanceId: 'home-benefits',
        componentId: 'coupon-benefit-strip',
        name: 'Coupon benefit strip',
        settings: {
          benefits: [
            { title: '10% OFF', subtitle: 'Orders Over $120+', variant: 'stat' },
            { title: '12% OFF', subtitle: 'Orders Over $150+', variant: 'stat' },
            { title: 'CODE',    subtitle: 'Apr2026',           variant: 'code' },
          ],
        },
      },
      {
        instanceId: 'home-top-entry',
        componentId: 'category-quick-entry-grid',
        name: 'Category quick entry',
        settings: {
          items: [
            { url: IMG.cat1, alt: 'Pants collection',     collectionId: 'bottoms' },
            { url: IMG.cat2, alt: 'Denim collection',     collectionId: 'bottoms' },
            { url: IMG.cat3, alt: 'Dresses collection',   collectionId: 'dresses' },
            { url: IMG.cat4, alt: 'Leggings collection',  collectionId: 'bottoms' },
            { url: IMG.cat5, alt: 'Tops collection',      collectionId: 'tops' },
            { url: IMG.cat6, alt: 'Shorts collection',    collectionId: 'bottoms' },
            { url: IMG.cat7, alt: 'Jumpsuits collection', collectionId: 'sets' },
            { url: IMG.cat8, alt: 'Skirts collection',    collectionId: 'bottoms' },
          ],
        },
      },
      {
        instanceId: 'home-sales-floor',
        componentId: 'promo-product-floor',
        name: 'Sales',
        settings: {
          title: 'Sales',
          items: [
            { url: IMG.promo1, alt: 'Buy 2 get 1 campaign',  href: '/collections/sets' },
            { url: IMG.promo2, alt: 'Buy 2 for 59 campaign', href: '/collections/tops' },
            { url: IMG.promo3, alt: 'Buy one get one campaign', href: '/collections/swim' },
            { url: IMG.cat5,   alt: 'Buy 2 for 69 campaign', href: '/collections/dresses' },
            { url: IMG.cat3,   alt: 'Buy 3 for 99 campaign', href: '/collections/accessories' },
            { url: IMG.cat8,   alt: 'Buy 3 for 59 campaign', href: '/collections/bottoms' },
          ],
        },
      },
      {
        instanceId: 'home-trends-floor',
        componentId: 'editorial-trend-floor',
        name: 'Trends',
        settings: {
          title: 'Trends',
          items: [
            { url: IMG.cat5, alt: 'Sportswear trend', href: '/collections/sets' },
            { url: IMG.cat2, alt: 'Linen feel trend', href: '/collections/tops' },
            { url: IMG.cat4, alt: 'Denim style trend', href: '/collections/bottoms' },
            { url: IMG.cat6, alt: 'City commute trend', href: '/collections/dresses' },
          ],
        },
      },
      {
        instanceId: 'home-more-to-love',
        componentId: 'tabbed-product-floor',
        name: 'More To Love',
        settings: {
          title: 'More To Love',
          tabs: [
            { key: 'bestsellers', label: 'BestSellers', productIds: ['pants-1-1', 'pants-2-1', 'pants-3-1', 'pants-4-1'] },
          ],
          // products[] is a render-only mock so the floor preview shows cards; the real floor
          // resolves productIds to live products at runtime.
          products: [
            { url: IMG.prod1, name: 'Linen-feel wide pants', price: '$32.99', compareAt: '$45.00' },
            { url: IMG.prod2, name: 'Sage cropped tank',     price: '$18.99', compareAt: '$26.00' },
            { url: IMG.prod3, name: 'Editorial shell dress', price: '$41.50', compareAt: '$58.00' },
            { url: IMG.prod4, name: 'Street denim jacket',   price: '$54.00', compareAt: '$72.00' },
          ],
        },
      },
    ],

    // productListPagePreset.pc — fixed system sections, config-driven (config: '{}')
    PRODUCT_LIST: [
      {
        instanceId: 'product-list-page-header',
        componentId: 'product-list-page-header',
        name: 'Collection header',
        settings: { config: '{}' },
      },
      {
        instanceId: 'product-list-page-content',
        componentId: 'product-list-page-content',
        name: 'Collection product grid',
        settings: { config: '{}' },
      },
    ],

    // productDetailPagePreset.pc — fixed system sections, config-driven (config: '{}')
    PRODUCT_DETAIL: [
      {
        instanceId: 'product-detail-page-main',
        componentId: 'product-detail-page-main',
        name: 'Product main',
        settings: { config: '{}' },
      },
      {
        instanceId: 'product-detail-benefits-floor',
        componentId: 'product-detail-benefits-floor',
        name: 'Product benefits',
        settings: { config: '{}' },
      },
      {
        instanceId: 'product-detail-recommendations-floor',
        componentId: 'product-detail-recommendations-floor',
        name: 'You may also like',
        settings: { config: '{}' },
      },
    ],
  };

  // page-type switcher options (label -> value) — pageTypeOptions in themeEdit.tsx
  const PAGE_TYPES = [
    { label: 'Home page',   value: 'HOME' },
    { label: 'Collections', value: 'PRODUCT_LIST' },
    { label: 'Products',    value: 'PRODUCT_DETAIL' },
  ];

  window.DATA_ONLINE_STORE = {
    THEMES,
    PAGE_TYPES,
    COMPONENT_LIBRARY,
    SYSTEM_SECTIONS,
    GLOBAL_BLOCKS,
    GLOBAL,
    PAGES,
    IMG,
  };
})();
