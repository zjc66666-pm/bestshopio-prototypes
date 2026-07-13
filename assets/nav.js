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
  { name: 'Nutrofuels',   url: 'nutrofuels.stores.bestshopio.com', homeState: 'setup', stateLabel: 'Setting up' },
  { name: 'Gigaxin',      url: 'www.gugaxin.com' },
];

// Top-level base modules (no group label). Order: Orders / Products / Customers
// / Discounts / Analytics / Content (analytics intentionally before content).
window.NAV_MENU = [
  { id: 'home',         label: 'Home',         icon: 'home',         route: '#/home',         desc: 'Store operations, performance and setup progress.' },
  { id: 'orders',       label: 'Orders',       icon: 'inbox',        route: '#/orders',       desc: 'Orders, fulfillment, refunds and returns.' },
  { id: 'products',     label: 'Products',     icon: 'tag',          route: '#/products',     desc: 'Products, variants, inventory, media and metafields.', children: [
    { id: 'collections', label: 'Collections', route: '#/collections', desc: 'Group products into collections with nesting and SEO.' },
    { id: 'reviews',     label: 'Reviews',     route: '#/reviews',     desc: 'Product reviews, replies and moderation.' },
  ] },
  { id: 'customers',    label: 'Customers',    icon: 'userPen',      route: '#/customers',    desc: 'Customer profiles, orders, subscriptions and timeline.' },
  { id: 'discounts',    label: 'Discounts',    icon: 'badgePercent', route: '#/discounts',    desc: 'Product / order / shipping discounts with stacking rules.' },
  { id: 'analytics',    label: 'Analytics',    icon: 'analytics',    route: '#/analytics',    desc: 'Reports engine, funnels, behavior (Sensors) and live view.', children: [
    { id: 'analytics-reports', label: 'Reports',   route: '#/analytics/reports' },
    { id: 'analytics-live',    label: 'Live View', route: '#/analytics/live' },
  ] },
  { id: 'content',      label: 'Content',      icon: 'newspaper',    route: '#/blog',         desc: 'Blog posts, pages and storefront menus.', children: [
    { id: 'blog',        label: 'Blog',        route: '#/blog',        desc: 'Blog posts and categories with rich content.' },
    { id: 'page',        label: 'Page',        route: '#/page',        desc: 'Custom pages (About, Contact, policies).' },
    { id: 'menu',        label: 'Menu',        route: '#/menu',        desc: 'Storefront navigation menus (two-level tree).' },
  ] },
];

// "Channels" group — per-platform sales-channel workspaces (Shopify-style channels).
// Mirrors the BestShopio Planning Map's Channel column.
window.NAV_CHANNELS = [
  { id: 'online-store', label: 'Online store', icon: 'globe',    route: '#/online-store', desc: 'Theme list and the visual store builder.' },
  { id: 'google',       label: 'Google',       icon: 'google',   route: '#/google',       desc: 'Tracking pixels (GA4 / Google Ads), domain verification and Merchant Center product sync.' },
  { id: 'facebook',     label: 'Facebook',     icon: 'facebook', route: '#/facebook',     desc: 'Meta Pixel + Conversion API, domain verification, FB & IG Shop, and ad management.' },
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

/* ---------- Subscriptions workspace (V1.142) ----------
   See 系统架构认知 §2: the main site keeps the base infrastructure (subscription
   product type, subscription orders); this app wraps the recurring logic. The
   workspace is a resident top-level item in the sidebar — the separate "Apps"
   shell was dropped as redundant while there's a single built-in app.
   PLUGGABLE_APPS / AppState are kept for a future app marketplace. */
// Apps Store — order matters for the "Apps" sidebar group:
// BestCheckout first (focus app, sits under the Channels group), then
// Subscriptions and Bundles (older built-ins).
window.PLUGGABLE_APPS = [
  {
    id: 'bestcheckout', name: 'BestCheckout', icon: 'card', builtin: true, category: 'Selling', status: 'available',
    tagline: 'High-converting external checkout for your Shopify store — and your on-ramp to BestShopio.',
    blurb: 'Bring your Shopify store: products, discounts, shipping and customers sync automatically from Shopify for checkout. Paid orders write back to Shopify for fulfillment. Sell through a faster checkout with one-click post-purchase upsells and multi-MID payment routing, then migrate to a native BestShopio store with a single domain switch. Subscriptions reuse the Subscriptions app.',
    permissions: ['Connect a Shopify store (OAuth)', 'Auto-sync products, collections, discounts, shipping and customers from Shopify', 'Write paid orders back to Shopify to trigger fulfillment', 'Use connected payment gateways for checkout & routing'],
    // App workspace with a second-level menu (like Subscriptions / Analytics): parent = Overview, children below.
    menu: { id: 'bestcheckout', label: 'BestCheckout', icon: 'card', route: '#/bestcheckout', desc: 'External high-converting checkout, payment routing & post-purchase for a connected Shopify store.',
      children: [
        { id: 'bestcheckout-funnel',     label: 'Funnel',     route: '#/bestcheckout/funnel' },
        { id: 'bestcheckout-connect',    label: 'Connection', route: '#/bestcheckout/connect' },
      ] },
  },
  {
    id: 'subscriptions', name: 'Subscriptions', icon: 'refresh', builtin: true, category: 'Selling', status: 'available',
    tagline: 'Sell products on a recurring schedule — Subscribe & Save.',
    blurb: 'Turn one-off products into recurring revenue. Customers subscribe on the product page and are billed automatically through your connected Airwallex, Stripe or PayPal; every cycle drops a fresh order into Orders.',
    permissions: ['Read products and customers', 'Create orders on the main store', 'Use connected payment gateways for recurring charges'],
    // Workspace menu item, injected into the sidebar only when the app is ON.
    menu: { id: 'subscriptions', label: 'Subscriptions', icon: 'refresh', route: '#/subscriptions',
      desc: 'Subscription plans, contracts, recurring orders and billing.',
      children: [
        { id: 'subscriptions-plans',      label: 'Plans',         route: '#/subscriptions/plans' },
        { id: 'subscriptions-contracts',  label: 'Subscriptions', route: '#/subscriptions/contracts' },
      ] },
  },
  {
    id: 'bundles', name: 'Bundles', icon: 'box', builtin: true, category: 'Selling', status: 'available',
    tagline: 'Quantity breaks and build-a-box bundles.',
    blurb: 'Sell more per order with quantity-break offers (Buy 1 / BOGO / N-pack + gifts) or let customers build their own box. Bundles can be one-time or subscription.',
    menu: { id: 'bundles', label: 'Bundles', icon: 'box', route: '#/bundles', desc: 'Quantity-break and build-a-box bundles.' },
  },
  { id: 'loyalty',   name: 'Loyalty & Rewards', icon: 'badgePercent', builtin: true, category: 'Marketing', status: 'coming_soon', tagline: 'Points, rewards and a loyalty program.' },
  { id: 'wholesale', name: 'Wholesale / B2B',   icon: 'tag',          builtin: true, category: 'Selling',   status: 'coming_soon', tagline: 'Wholesale pricing, minimum order quantity and B2B customers.' },
  { id: 'affiliate', name: 'Affiliate',         icon: 'userPen',      builtin: true, category: 'Marketing', status: 'coming_soon', tagline: 'Referral links and commission payouts.' },
];

/* Per-store app enable-state (prototype: localStorage; real admin: store config). */
window.AppState = {
  k: function (id) { return 'bsio_app_' + id; },
  isEnabled: function (id) { try { return localStorage.getItem(this.k(id)) === '1'; } catch (e) { return false; } },
  setEnabled: function (id, on) { try { localStorage.setItem(this.k(id), on ? '1' : '0'); } catch (e) {} },
};

/* Sidebar menu = base modules + Channels group + Apps group.
   Entries with `_group` are section dividers (rendered as <div class="nav-group-label">)
   by shell.js renderSidebar. Order:
     base modules (NAV_MENU)
     → "Channels" divider → NAV_CHANNELS
     → "Apps" divider → enabled PLUGGABLE_APPS in declaration order */
window.buildMenu = function () {
  var apps = window.PLUGGABLE_APPS
    .filter(function (a) { return a.menu && a.status === 'available'; })
    .map(function (a) { return a.menu; });
  return window.NAV_MENU
    .concat([{ _group: 'Channels' }])
    .concat(window.NAV_CHANNELS || [])
    .concat([{ _group: 'Apps' }])
    .concat(apps);
};

/* route first-segment -> module folder to lazy-load (router uses this). */
window.ROUTE_MODULE = {
  home: 'home', orders: 'orders', products: 'products', collections: 'collections',
  reviews: 'reviews', customers: 'customers', discounts: 'discounts',
  blog: 'blog', page: 'page', menu: 'menu', analytics: 'analytics',
  'online-store': 'online-store', google: 'google', facebook: 'facebook', settings: 'settings',
  apps: 'apps', subscriptions: 'subscriptions', bundles: 'bundles', bestcheckout: 'bestcheckout',
};

/* Newest first. `modules` lists the route ids each version touched (for the Home changelog). */
window.CHANGELOG = [
  {
    version: 'V1.143', date: '2026-06', title: 'BestCheckout — external checkout for Shopify merchants',
    modules: [],
    items: [
      'New app (sits under Bundles): connect a Shopify store and sell through a faster external checkout with one-click post-purchase upsells and multi-MID payment routing',
      'Shopify auto-sync — products, collections, discounts, shipping and customers are read from Shopify for checkout; paid orders write back to trigger the merchant’s existing fulfillment apps',
      'Connection hub gathers the whole Shopify bridge — authorization (OAuth), Shopify data auto-sync, checkout injection (App Embed) and the checkout domain — and retires at migration',
      'One-domain-switch migration to a native BestShopio store; subscriptions reuse the Subscriptions app rather than a second engine',
    ],
  },
  {
    version: 'V1.142', date: '2026-06', title: 'Subscriptions — sell on a recurring schedule',
    modules: [],
    items: [
      'Subscriptions: a new top-level workspace — click it for the Overview (MRR / active / upcoming charges / churn)',
      'Plans, Subscriptions (contracts), Orders and Settings sit under it',
      'Recurring billing through your connected Airwallex, Stripe or PayPal — Subscribe & Save with trials, subscription discounts and failed-payment retries (dunning)',
      'Storefront: One-time vs Subscribe & Save on the product page, plus a customer portal to pause / skip / change / cancel',
    ],
  },
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
