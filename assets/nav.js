/* BestShopio prototypes — SPA menu manifest + changelog (single source of truth).
   Mirrors the real bestvoy-admin layouts/menu.ts. The shell (shell.js) renders ONE
   persistent sidebar from these and routes by hash (no page reloads).

   Two menu CONTEXTS, exactly like the real admin:
   - NAV_MENU      = the main admin menu (Products & Content are expandable parents).
   - NAV_SETTINGS  = the settings menu; when the route starts with #/settings the
                     sidebar switches to this set + a "Settings" bar with an X back.

   Analytics is NOT in the live admin — it's our addition; per product decision it
   sits as a top-level item between Content and Online store. */

window.SITE = { brand: 'BestShopio', store: 'Lovocross', role: 'Owner', email: 'zhengjican@bestfulfill.com' };

/* Stores this signed-in account can access — drives the header store-switcher.
   Mirrors the SSO stores panel (prototypes/account/stores.html). Entering a store
   from the panel opens index.html?store=<name>; the switcher opens others in a new tab. */
window.STORES = [
  { name: 'Lovocross',    url: 'm.lovocross.com' },
  { name: 'Silixwear-ES', url: 'www.silixwear-es.com' },
  { name: 'Gigaxin',      url: 'www.gugaxin.com' },
];

window.NAV_MENU = [
  { id: 'orders',       label: 'Orders',       icon: 'inbox',        route: '#/orders',       desc: 'Orders, fulfillment, refunds and returns.' },
  { id: 'products',     label: 'Products',     icon: 'tag',          route: '#/products',     desc: 'Products, variants, inventory, media and metafields.', children: [
    { id: 'collections', label: 'Collections', route: '#/collections', desc: 'Group products into collections with nesting and SEO.' },
    { id: 'reviews',     label: 'Reviews',     route: '#/reviews',     desc: 'Product reviews, replies and moderation.' },
  ] },
  { id: 'customers',    label: 'Customers',    icon: 'userPen',      route: '#/customers',    desc: 'Customer profiles, orders, subscriptions and timeline.' },
  { id: 'discounts',    label: 'Discounts',    icon: 'badgePercent', route: '#/discounts',    desc: 'Product / order / shipping discounts with stacking rules.' },
  { id: 'content',      label: 'Content',      icon: 'newspaper',    route: '#/blog',         desc: 'Blog posts, pages and storefront menus.', children: [
    { id: 'blog',        label: 'Blog',        route: '#/blog',        desc: 'Blog posts and categories with rich content.' },
    { id: 'page',        label: 'Page',        route: '#/page',        desc: 'Custom pages (About, Contact, policies).' },
    { id: 'menu',        label: 'Menu',        route: '#/menu',        desc: 'Storefront navigation menus (two-level tree).' },
  ] },
  { id: 'analytics',    label: 'Analytics',    icon: 'analytics',    route: '#/analytics',    desc: 'Reports engine, funnels, behavior (Sensors) and live view.', children: [
    { id: 'analytics-reports', label: 'Reports',   route: '#/analytics/reports' },
    { id: 'analytics-live',    label: 'Live View', route: '#/analytics/live' },
  ] },
  { id: 'online-store', label: 'Online store', icon: 'globe',        route: '#/online-store', desc: 'Theme list and the visual store builder.' },
  { id: 'google',       label: 'Google',       icon: 'google',       route: '#/google',       desc: 'Google Merchant Center product / variant sync.' },
];

window.NAV_SETTINGS = [
  { id: 'base',                label: 'Basic settings', icon: 'settings', route: '#/settings/base' },
  { id: 'payments',            label: 'Payments',       icon: 'card',     route: '#/settings/payments' },
  { id: 'currency',            label: 'Currency',       icon: 'coin',     route: '#/settings/currency' },
  { id: 'checkout',            label: 'Checkout',       icon: 'cart',     route: '#/settings/checkout' },
  { id: 'notifications',       label: 'Notifications',  icon: 'bell',     route: '#/settings/notifications' },
  { id: 'domains',             label: 'Domains',        icon: 'globe',    route: '#/settings/domains' },
  { id: 'metafields',          label: 'Metafields',     icon: 'code',     route: '#/settings/metafields' },
  { id: 'shippable-locations', label: 'Ship locations', icon: 'pin',      route: '#/settings/shippable-locations' },
  { id: 'shipping-rates',      label: 'Shipping rates', icon: 'pin',      route: '#/settings/shipping-rates' },
  { id: 'staffperms',          label: 'Staff and permissions', icon: 'userPen', route: '#/settings/roles', children: [
    { id: 'roles', label: 'Roles', route: '#/settings/roles' },
    { id: 'staff', label: 'Staff', route: '#/settings/staff' },
  ] },
];

/* route first-segment -> module folder to lazy-load (router uses this). */
window.ROUTE_MODULE = {
  home: 'home', orders: 'orders', products: 'products', collections: 'collections',
  reviews: 'reviews', customers: 'customers', discounts: 'discounts',
  blog: 'blog', page: 'page', menu: 'menu', analytics: 'analytics',
  'online-store': 'online-store', google: 'google', settings: 'settings',
};

/* Newest first. `modules` lists the route ids each version touched (for the Home changelog). */
window.CHANGELOG = [
  {
    version: 'V1.141', date: '2026-06', title: 'Notifications — configurable order emails',
    modules: [],
    items: [
      'Settings → Notifications: turn order confirmation & shipping emails on/off per store — no code, no redeploy (replaces the hardcoded per-site templates)',
      'Email editor with merge variables + safe dynamic blocks (order summary / tracking) and a starter template library, with a live desktop/mobile preview and test send',
      'Brand settings (logo / color / footer) shared across every notification; extensible event catalog for refund, welcome, verification and more',
    ],
  },
  {
    version: 'V1.139', date: '2026-06', title: 'Self-service store provisioning',
    modules: [],
    items: [
      'Account portal: Create store wizard → live Provisioning progress (database / storage / search / OMS / domain / SSL) in under 3 minutes',
      'Store Home: Setup guide card (Add product · Set up payments · Choose theme · Connect domain · Go live)',
      'Settings → Domains: connect a custom domain with auto DNS detection + automatic SSL (issue & renew)',
    ],
  },
  {
    version: 'V1.129', date: '2026-06', title: 'Staff & permissions + SSO multi-store portal',
    modules: [],
    items: [
      'SSO portal (account/signin.html → stores.html): sign in once, pick a store card to enter its admin',
      'Header store-switcher + account menu (Change password / Sign out) tie the admin back to the portal',
      'Settings → Roles (permission tree) and Staff (5-state lifecycle: Add / Edit / Review / Delete)',
    ],
  },
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
    modules: ['products', 'collections', 'reviews', 'orders', 'discounts', 'customers', 'blog', 'page', 'menu', 'online-store', 'google'],
    items: [
      'Catalog, Sales, Content, Channels and Settings modules built against reference/bestvoy-admin',
      'Orders: 3-layer discounts, refund / fulfill flows',
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
