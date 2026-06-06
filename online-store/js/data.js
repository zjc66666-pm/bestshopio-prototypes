/* BestShopio Admin · Online store prototype — sample data.
   Shapes mirror the real module:
     - THEMES[]            -> ThemeListItem (designConfig.ts): id, handle, title, pc_image, h5_image, created_time, updated_time
     - COMPONENT_LIBRARY[] -> the builder's draggable block list (componentId + label + group)
     - PAGES{}             -> per page-type component lists (HOME / PRODUCT_LIST / PRODUCT_DETAIL),
                              each component { instanceId, componentId, settings } after pagePresets.ts
     - GLOBAL              -> storefront-header / storefront-footer settings (the global shell)
   All imagery uses Unsplash source URLs (same as the real pagePresets seed data). */
(function () {
  // ---------- shared media (storefront photography) ----------
  const IMG = {
    hero1: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    hero2: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
    hero3: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
    hero4: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
    cat1: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=700&q=80',
    cat2: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80',
    cat3: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=80',
    cat4: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=80',
    cat5: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=80',
    cat6: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=700&q=80',
    cat7: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=700&q=80',
    cat8: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=700&q=80',
    prod1: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
    prod2: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
    prod3: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=600&q=80',
    prod4: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80',
  };

  // thumbnail previews for the theme cards (rendered, store-like screenshots)
  const PREVIEW = {
    folastPc: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
    folastH5: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80',
    auroraPc: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=900&q=80',
    auroraH5: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=500&q=80',
    driftPc: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80',
    driftH5: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=500&q=80',
  };

  // ---------- THEME LIST ('My theme' tab) ----------
  // The published theme is first; the others are saved drafts the merchant can switch to.
  const THEMES = [
    {
      id: 1,
      handle: 'folast',
      title: 'Folast — Linen Feel',
      pc_image: PREVIEW.folastPc,
      h5_image: PREVIEW.folastH5,
      created_time: '2026-01-12 09:24',
      updated_time: '2026-06-04 17:42',
      published: true,
      role: 'Current theme',
    },
    {
      id: 2,
      handle: 'aurora',
      title: 'Aurora — Minimal Mono',
      pc_image: PREVIEW.auroraPc,
      h5_image: PREVIEW.auroraH5,
      created_time: '2026-03-02 11:10',
      updated_time: '2026-05-21 14:08',
      published: false,
      role: 'Draft',
    },
    {
      id: 3,
      handle: 'drift',
      title: 'Drift — Summer Sale',
      pc_image: PREVIEW.driftPc,
      h5_image: PREVIEW.driftH5,
      created_time: '2026-04-19 16:55',
      updated_time: '2026-05-30 10:33',
      published: false,
      role: 'Draft',
    },
  ];

  // ---------- COMPONENT LIBRARY (left panel "Add section") ----------
  // componentId values match pagePresets.ts; `pages` restricts where a block can be added.
  const COMPONENT_LIBRARY = [
    { componentId: 'hero-carousel',             label: 'Hero carousel',        desc: 'Full-width rotating banners with CTA', icon: 'image',   group: 'Banners',  pages: ['HOME'] },
    { componentId: 'coupon-benefit-strip',      label: 'Coupon benefit strip', desc: 'Discount tiers + promo code chips',     icon: 'percent', group: 'Promotions', pages: ['HOME'] },
    { componentId: 'category-quick-entry-grid', label: 'Category quick entry', desc: 'Tappable collection tiles grid',        icon: 'grid',    group: 'Navigation', pages: ['HOME', 'PRODUCT_LIST'] },
    { componentId: 'promo-product-floor',       label: 'Promo product floor',  desc: 'Merchandised promo image row',         icon: 'layers',  group: 'Product',  pages: ['HOME', 'PRODUCT_LIST'] },
    { componentId: 'tabbed-product-floor',      label: 'Tabbed product floor', desc: 'Tabbed product grid (BestSellers…)',   icon: 'tabs',    group: 'Product',  pages: ['HOME', 'PRODUCT_LIST', 'PRODUCT_DETAIL'] },
  ];

  // global blocks always present on every page (header + footer), not removable
  const GLOBAL_BLOCKS = [
    { componentId: 'storefront-header', label: 'Header',  icon: 'header', scope: 'global' },
    { componentId: 'storefront-footer', label: 'Footer',  icon: 'footer', scope: 'global' },
  ];

  // ---------- GLOBAL shell settings (header / footer) ----------
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
          { label: 'Bestsellers', href: '/products' },
          { label: 'New Arrivals', href: '/products' },
          { label: 'Clothing', href: '/products' },
          { label: 'Sales', href: '/products' },
          { label: 'Pants', href: '/products' },
          { label: 'Dresses', href: '/products' },
        ],
      },
    },
    footer: {
      instanceId: 'global-storefront-footer',
      componentId: 'storefront-footer',
      settings: {
        linkSections: [
          { title: 'Shop', links: [
            { label: 'Blog', href: '/blog' },
            { label: 'All Reviews', href: '/all-reviews' },
            { label: 'Sitemap', href: '/sitemap.html' },
          ] },
          { title: 'Support', links: [
            { label: 'About Us', href: '/page/about-us' },
            { label: 'Contact Us', href: '/page/contact-us' },
            { label: 'Payment Method', href: '/page/payment-method' },
            { label: 'Order Tracking', href: '/order-tracking' },
          ] },
          { title: 'Policies', links: [
            { label: 'Shipping Policy', href: '/page/shipping-policy' },
            { label: 'Return & Refund Policy', href: '/page/return-refund-policy' },
            { label: 'Cookie Settings', href: '#cookie-settings' },
          ] },
        ],
        contactItems: [
          { label: 'Company', value: 'Richan INC' },
          { label: 'Address', value: '7300 MILLER DR, FREDERICK CO 80504, US' },
          { label: 'Contact Us', value: 'support@bestvoy.com' },
          { label: 'Phone (US)', value: '+1 (508) 204-3308' },
        ],
        paymentMethods: ['PayPal', 'Google Pay', 'Apple Pay', 'Visa', 'Mastercard', 'Klarna'],
        subscribeText: 'Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.',
        subscribePlaceholder: 'Please enter your email address',
        subscribeButtonText: 'Subscribe',
        copyrightText: '© 2026 Richan INC. All Rights Reserved.',
      },
    },
  };

  // ---------- PAGE component lists (per page-type) ----------
  const PAGES = {
    HOME: [
      {
        instanceId: 'home-top-hero',
        componentId: 'hero-carousel',
        name: 'Hero carousel',
        settings: {
          eyebrow: '30+ New Daily Arrivals',
          title: 'New Linen-\nFeel Styles',
          ctaText: 'SHOP NOW',
          autoplay: true,
          intervalMs: 5000,
          slides: [
            { id: 'hero-slide-1', url: IMG.hero1, alt: 'Model in a neutral linen look', href: '/collections/dresses' },
            { id: 'hero-slide-2', url: IMG.hero2, alt: 'Model in a soft sage outfit',    href: '/collections/tops' },
            { id: 'hero-slide-3', url: IMG.hero3, alt: 'Editorial shell tone photo',     href: '/collections/bottoms' },
            { id: 'hero-slide-4', url: IMG.hero4, alt: 'Street style portrait',          href: '/collections/sets' },
          ],
        },
      },
      {
        instanceId: 'home-benefits',
        componentId: 'coupon-benefit-strip',
        name: 'Coupon benefit strip',
        settings: {
          background: '#fff5ec',
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
          columns: 4,
          items: [
            { url: IMG.cat1, alt: 'Pants',     collectionId: 'bottoms' },
            { url: IMG.cat2, alt: 'Denim',     collectionId: 'bottoms' },
            { url: IMG.cat3, alt: 'Dresses',   collectionId: 'dresses' },
            { url: IMG.cat4, alt: 'Leggings',  collectionId: 'bottoms' },
            { url: IMG.cat5, alt: 'Tops',      collectionId: 'tops' },
            { url: IMG.cat6, alt: 'Shorts',    collectionId: 'bottoms' },
            { url: IMG.cat7, alt: 'Jumpsuits', collectionId: 'sets' },
            { url: IMG.cat8, alt: 'Skirts',    collectionId: 'bottoms' },
          ],
        },
      },
      {
        instanceId: 'home-sales-floor',
        componentId: 'promo-product-floor',
        name: 'Promo floor — Sales',
        settings: {
          title: 'Sales',
          items: [
            { url: IMG.hero4, alt: 'Buy 2 get 1 campaign',  href: '/collections/sets' },
            { url: IMG.cat1,  alt: 'Buy 2 for 59 campaign', href: '/collections/tops' },
            { url: IMG.hero3, alt: 'Buy one get one',        href: '/collections/swim' },
          ],
        },
      },
      {
        instanceId: 'home-more-to-love',
        componentId: 'tabbed-product-floor',
        name: 'Tabbed floor — More To Love',
        settings: {
          title: 'More To Love',
          tabs: [
            { key: 'bestsellers', label: 'BestSellers', productCount: 8 },
            { key: 'new',         label: 'New In',       productCount: 8 },
            { key: 'sale',        label: 'On Sale',      productCount: 8 },
          ],
          products: [
            { url: IMG.prod1, name: 'Linen-feel wide pants', price: '$32.99', compareAt: '$45.00' },
            { url: IMG.prod2, name: 'Sage cropped tank',     price: '$18.99', compareAt: '$26.00' },
            { url: IMG.prod3, name: 'Editorial shell dress', price: '$41.50', compareAt: '$58.00' },
            { url: IMG.prod4, name: 'Street denim jacket',   price: '$54.00', compareAt: '$72.00' },
          ],
        },
      },
    ],

    PRODUCT_LIST: [
      {
        instanceId: 'product-list-quick-entry',
        componentId: 'category-quick-entry-grid',
        name: 'Category quick entry',
        settings: {
          columns: 4,
          items: [
            { url: IMG.cat3, alt: 'Dresses', collectionId: 'dresses' },
            { url: IMG.cat5, alt: 'Tops',    collectionId: 'tops' },
            { url: IMG.cat1, alt: 'Pants',   collectionId: 'bottoms' },
            { url: IMG.cat8, alt: 'Skirts',  collectionId: 'bottoms' },
          ],
        },
      },
      {
        instanceId: 'product-list-floor',
        componentId: 'tabbed-product-floor',
        name: 'Tabbed floor — Collection',
        settings: {
          title: 'Women · New Arrivals',
          tabs: [
            { key: 'all',     label: 'All',      productCount: 240 },
            { key: 'tops',    label: 'Tops',     productCount: 86 },
            { key: 'bottoms', label: 'Bottoms',  productCount: 74 },
          ],
          products: [
            { url: IMG.prod3, name: 'Editorial shell dress', price: '$41.50', compareAt: '$58.00' },
            { url: IMG.prod2, name: 'Sage cropped tank',     price: '$18.99', compareAt: '$26.00' },
            { url: IMG.prod1, name: 'Linen-feel wide pants', price: '$32.99', compareAt: '$45.00' },
            { url: IMG.prod4, name: 'Street denim jacket',   price: '$54.00', compareAt: '$72.00' },
          ],
        },
      },
    ],

    PRODUCT_DETAIL: [
      {
        instanceId: 'product-detail-benefits',
        componentId: 'coupon-benefit-strip',
        name: 'Coupon benefit strip',
        settings: {
          background: '#f1f6ff',
          benefits: [
            { title: 'FREE SHIP', subtitle: 'Orders $79+',     variant: 'stat' },
            { title: '30-DAY',    subtitle: 'Easy returns',     variant: 'stat' },
            { title: 'CODE',      subtitle: 'NEW10',            variant: 'code' },
          ],
        },
      },
      {
        instanceId: 'product-detail-recommendations',
        componentId: 'tabbed-product-floor',
        name: 'Tabbed floor — You may also like',
        settings: {
          title: 'You May Also Like',
          tabs: [
            { key: 'similar',  label: 'Similar',         productCount: 8 },
            { key: 'together', label: 'Bought Together', productCount: 8 },
          ],
          products: [
            { url: IMG.prod4, name: 'Street denim jacket',   price: '$54.00', compareAt: '$72.00' },
            { url: IMG.prod1, name: 'Linen-feel wide pants', price: '$32.99', compareAt: '$45.00' },
            { url: IMG.prod3, name: 'Editorial shell dress', price: '$41.50', compareAt: '$58.00' },
            { url: IMG.prod2, name: 'Sage cropped tank',     price: '$18.99', compareAt: '$26.00' },
          ],
        },
      },
    ],
  };

  // page-type switcher options (label -> value), mirrors pageTypeOptions in themeEdit.tsx
  const PAGE_TYPES = [
    { label: 'Home page',   value: 'HOME' },
    { label: 'Collections', value: 'PRODUCT_LIST' },
    { label: 'Products',    value: 'PRODUCT_DETAIL' },
  ];

  window.DATA_ONLINE_STORE = {
    THEMES,
    COMPONENT_LIBRARY,
    GLOBAL_BLOCKS,
    GLOBAL,
    PAGES,
    PAGE_TYPES,
    IMG,
  };
})();
