/* BestShopio prototypes — SPA menu manifest + changelog (single source of truth).
   Mirrors the real bestvoy-admin layouts/menu.ts. The shell (shell.js) renders ONE
   persistent sidebar from these and routes by hash (no page reloads).

   Two menu CONTEXTS, exactly like the real admin:
   - NAV_MENU      = the main admin menu (Products & Content are expandable parents).
   - NAV_SETTINGS  = the settings menu; when the route starts with #/settings the
                     sidebar switches to this set + a "Settings" bar with an X back.

   Analytics is NOT in the live admin — it's our addition; per product decision it
   sits as a top-level item between Content and Online store. */

window.SITE = { brand: 'BestShopio', store: 'Silix', role: 'Owner' };

window.NAV_MENU = [
  { id: 'orders',       label: 'Orders',       icon: 'inbox',        route: '#/orders',       desc: 'Orders, fulfillment, refunds and split-order by vendor.' },
  { id: 'products',     label: 'Products',     icon: 'tag',          route: '#/products',     desc: 'Products, variants, inventory, media and metafields.', children: [
    { id: 'collections', label: 'Collections', route: '#/collections', desc: 'Group products into collections with nesting and SEO.' },
    { id: 'vendors',     label: 'Vendors',     route: '#/vendors',     desc: 'Multi-vendor marketplace: stores, products and SEO.' },
    { id: 'reviews',     label: 'Reviews',     route: '#/reviews',     desc: 'Product and vendor reviews, replies and moderation.' },
  ] },
  { id: 'customers',    label: 'Customers',    icon: 'userPen',      route: '#/customers',    desc: 'Customer profiles, orders, subscriptions and timeline.' },
  { id: 'discounts',    label: 'Discounts',    icon: 'badgePercent', route: '#/discounts',    desc: 'Product / order / shipping discounts with stacking rules.' },
  { id: 'content',      label: 'Content',      icon: 'newspaper',    route: '#/blog',         desc: 'Blog posts, pages and storefront menus.', children: [
    { id: 'blog',        label: 'Blog',        route: '#/blog',        desc: 'Blog posts and categories with rich content.' },
    { id: 'page',        label: 'Page',        route: '#/page',        desc: 'Custom pages (About, Contact, policies).' },
    { id: 'menu',        label: 'Menu',        route: '#/menu',        desc: 'Storefront navigation menus (two-level tree).' },
  ] },
  { id: 'analytics',    label: 'Analytics',    icon: 'analytics',    route: '#/analytics',    desc: 'Reports engine, funnels, behavior (Sensors) and live view.' },
  { id: 'online-store', label: 'Online store', icon: 'globe',        route: '#/online-store', desc: 'Theme list and the visual store builder.' },
  { id: 'google',       label: 'Google',       icon: 'google',       route: '#/google',       desc: 'Google Merchant Center product / variant sync.' },
];

window.NAV_SETTINGS = [
  { id: 'base',                label: 'Basic settings', icon: 'settings', route: '#/settings/base' },
  { id: 'payments',            label: 'Payments',       icon: 'card',     route: '#/settings/payments' },
  { id: 'currency',            label: 'Currency',       icon: 'coin',     route: '#/settings/currency' },
  { id: 'checkout',            label: 'Checkout',       icon: 'cart',     route: '#/settings/checkout' },
  { id: 'metafields',          label: 'Metafields',     icon: 'code',     route: '#/settings/metafields' },
  { id: 'shippable-locations', label: 'Ship locations', icon: 'pin',      route: '#/settings/shippable-locations' },
  { id: 'shipping-rates',      label: 'Shipping rates', icon: 'pin',      route: '#/settings/shipping-rates' },
];

/* route first-segment -> module folder to lazy-load (router uses this). */
window.ROUTE_MODULE = {
  home: 'home', orders: 'orders', products: 'products', collections: 'collections',
  vendors: 'vendors', reviews: 'reviews', customers: 'customers', discounts: 'discounts',
  blog: 'blog', page: 'page', menu: 'menu', analytics: 'analytics',
  'online-store': 'online-store', google: 'google', settings: 'settings',
};

/* Newest first. `modules` lists the route ids each version touched (for the Home changelog). */
window.CHANGELOG = [
  {
    version: 'SPA', date: '2026-06', title: 'Single-page app — one persistent shell, instant routing',
    modules: ['orders', 'products', 'analytics'],
    items: [
      'Converted to a SPA: one shell + hash router, no per-click reload (matches the live admin)',
      'Menu rebuilt to mirror menu.ts: expandable Products/Content, Settings as its own menu context',
      'Analytics placed as a top-level item between Content and Online store',
    ],
  },
  {
    version: 'Modules', date: '2026-06', title: 'Full merchant-admin module set',
    modules: ['products', 'collections', 'vendors', 'reviews', 'orders', 'discounts', 'customers', 'blog', 'page', 'menu', 'online-store', 'google'],
    items: [
      'Catalog, Sales, Content, Channels and Settings modules built against reference/bestvoy-admin',
      'Orders: split-order by vendor, 3-layer discounts, refund / fulfill flows',
    ],
  },
  {
    version: 'V1.137', date: '2026-06', title: 'Analytics module — reports engine + behavior data',
    modules: ['analytics'],
    items: [
      'Commerce dimension reports with Social -> platform drill-down',
      'Behavior data wired to a self-hosted Sensors (神策) SDK',
    ],
  },
];
