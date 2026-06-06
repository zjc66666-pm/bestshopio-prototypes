/* BestShopio prototypes — module manifest + changelog (single source of truth).
   - shell.js renders the sidebar from NAV_MODULES + NAV_FOOTER (grouped by `group`).
   - index.html (the hub) renders the module map + changelog from these.

   Mirrors the REAL merchant admin (reference/bestvoy-admin) module surface so the
   online prototype set covers every live module.

   status: 'ready'    = built prototype, clickable
           'scaffold' = page exists on the shell but content is a placeholder, clickable
           'planned'  = no page yet, shown greyed-out in the sidebar / map

   Add a module:   add an entry (status:'planned') -> build <id>/index.html -> flip to 'ready'.
   Log a version:  prepend an entry to CHANGELOG (newest first); list touched module ids in `modules`.
   NOTE: version strings below are seeded/illustrative — set them to your real PRD mapping. */

window.SITE = { brand: 'BestShopio', store: 'Silix', role: 'Owner' };

window.NAV_MODULES = [
  { id: 'home',         label: 'Home',         icon: 'home',         path: 'index.html',              status: 'ready', group: null,       desc: 'Overview, what changed per version, and a map of every module.' },

  // Catalog
  { id: 'products',     label: 'Products',     icon: 'tag',          path: 'products/index.html',     status: 'ready', group: 'Catalog',  desc: 'Products, variants, inventory, media, metafields and vendor.' },
  { id: 'collections',  label: 'Collections',  icon: 'collections',  path: 'collections/index.html',  status: 'ready', group: 'Catalog',  desc: 'Group products into collections with nesting and SEO.' },
  { id: 'vendors',      label: 'Vendors',      icon: 'vendors',      path: 'vendors/index.html',      status: 'ready', group: 'Catalog',  desc: 'Multi-vendor marketplace: stores, product assignment and SEO.' },
  { id: 'reviews',      label: 'Reviews',      icon: 'reviews',      path: 'reviews/index.html',      status: 'ready', group: 'Catalog',  desc: 'Product and vendor reviews, replies and moderation.' },

  // Sales
  { id: 'orders',       label: 'Orders',       icon: 'inbox',        path: 'orders/index.html',       status: 'ready', group: 'Sales',    desc: 'Orders, fulfillment, refunds and split-order by vendor.' },
  { id: 'discounts',    label: 'Discounts',    icon: 'badgePercent', path: 'discounts/index.html',    status: 'ready', group: 'Sales',    desc: 'Product / order / shipping discounts with stacking rules.' },
  { id: 'customers',    label: 'Customers',    icon: 'userPen',      path: 'customers/index.html',    status: 'ready', group: 'Sales',    desc: 'Customer profiles, orders, subscriptions and timeline.' },

  // Content
  { id: 'blog',         label: 'Blog',         icon: 'newspaper',    path: 'blog/index.html',         status: 'ready', group: 'Content',  desc: 'Blog posts and categories with rich content.' },
  { id: 'page',         label: 'Page',         icon: 'page',         path: 'page/index.html',         status: 'ready', group: 'Content',  desc: 'Custom pages (About, Contact, policies).' },
  { id: 'menu',         label: 'Menu',         icon: 'menu',         path: 'menu/index.html',         status: 'ready', group: 'Content',  desc: 'Storefront navigation menus (two-level tree).' },

  // Channels
  { id: 'online-store', label: 'Online store', icon: 'globe',        path: 'online-store/index.html', status: 'ready', group: 'Channels', desc: 'Theme list and the visual store builder.' },
  { id: 'google',       label: 'Google',       icon: 'google',       path: 'google/index.html',       status: 'ready', group: 'Channels', desc: 'Google Merchant Center product / variant sync.' },

  // Insights
  { id: 'analytics',    label: 'Analytics',    icon: 'analytics',    path: 'analytics/index.html',    status: 'ready', group: 'Insights', version: 'V1.137', desc: 'Reports engine, funnels, behavior (Sensors / 神策) and live view.' },
];

window.NAV_FOOTER = [
  { id: 'settings', label: 'Settings', icon: 'settings', path: 'settings/index.html', status: 'ready', group: null, desc: 'Store, payments, currency, checkout, metafields and shipping.' },
];

/* Newest first. `modules` lists the module ids each version touched. */
window.CHANGELOG = [
  {
    version: 'Modules', date: '2026-06', title: 'Full merchant-admin module set — 13 high-fidelity prototypes',
    modules: ['products', 'collections', 'vendors', 'reviews', 'orders', 'discounts', 'customers', 'blog', 'page', 'menu', 'online-store', 'google', 'settings'],
    items: [
      'Catalog: Products (variants / SKU, metafields), Collections (nesting), Vendors, Reviews',
      'Sales: Orders (split-order by vendor, 3-layer discounts, refund / fulfill), Discounts, Customers',
      'Content: Blog, Page, Menu  —  Channels: Online store builder, Google (GMC)',
      'Settings: store, payments, currency, checkout, metafields, shippable locations, shipping rates',
      'Built faithfully against reference/bestvoy-admin and verified rendering on the shared shell',
    ],
  },
  {
    version: 'V1.137', date: '2026-06', title: 'Analytics module — reports engine + behavior data',
    modules: ['analytics'],
    items: [
      'Commerce dimension reports (T2) with Social -> platform drill-down',
      'Edit drawer: catalog-driven column / metric picker',
      'Reports library rebuilt as a SHOPLINE card-grid',
      'Behavior data wired to a self-hosted Sensors (神策) SDK',
    ],
  },
  {
    version: 'Setup', date: '2026-06', title: 'Prototype hub — shared shell + module map',
    modules: ['home', 'orders'],
    items: [
      'One shared sidebar + header shell and one design system (theme.css)',
      'Home hub: module map with status, version badges and this changelog',
      'Hub map expanded to the full real admin surface (Catalog / Sales / Content / Channels / Settings)',
    ],
  },
];
