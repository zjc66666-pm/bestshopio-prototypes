/* BestShopio prototypes — module manifest + changelog (single source of truth).
   - shell.js renders the sidebar from NAV_MODULES + NAV_FOOTER.
   - index.html (the hub) renders the module map + changelog from these.

   status: 'ready'    = built prototype, clickable
           'scaffold' = page exists on the shell but content is a placeholder, clickable
           'planned'  = no page yet, shown greyed-out in the sidebar / map

   Add a module:   add an entry (status:'planned') -> build <id>/index.html -> flip to 'ready'.
   Log a version:  prepend an entry to CHANGELOG (newest first); list touched module ids in `modules`.
   NOTE: version strings below are seeded/illustrative — set them to your real PRD mapping. */

window.SITE = { brand: 'BestShopio', store: 'Silix', role: 'Owner' };

window.NAV_MODULES = [
  { id: 'home',         label: 'Home',         icon: 'home',         path: 'index.html',              status: 'ready',    section: null,                  desc: 'Overview, what changed per version, and a map of every module.' },
  { id: 'orders',       label: 'Orders',       icon: 'inbox',        path: 'orders/index.html',       status: 'scaffold', section: 'Sell',                desc: 'Order list, fulfillment and the three-layer / split-order view.' },
  { id: 'products',     label: 'Products',     icon: 'tag',          path: 'products/index.html',     status: 'planned',  section: 'Sell',                desc: 'Products, variants, inventory, collections, vendors and reviews.' },
  { id: 'customers',    label: 'Customers',    icon: 'userPen',      path: 'customers/index.html',    status: 'planned',  section: 'Sell',                desc: 'Customer profiles, segments and lifetime value.' },
  { id: 'discounts',    label: 'Discounts',    icon: 'badgePercent', path: 'discounts/index.html',    status: 'planned',  section: 'Sell',                desc: 'Discount codes, automatic offers and promotions.' },
  { id: 'content',      label: 'Content',      icon: 'newspaper',    path: 'content/index.html',      status: 'planned',  section: 'Channels & content',  desc: 'Blog posts, pages and storefront menus.' },
  { id: 'online_store', label: 'Online store', icon: 'globe',        path: 'online-store/index.html', status: 'planned',  section: 'Channels & content',  desc: 'Theme, navigation and storefront preview.' },
  { id: 'google',       label: 'Google',       icon: 'google',       path: 'google/index.html',       status: 'planned',  section: 'Channels & content',  desc: 'Google channel: product feed and Merchant Center sync.' },
  { id: 'analytics',    label: 'Analytics',    icon: 'analytics',    path: 'analytics/index.html',    status: 'ready',    section: 'Insights', version: 'V1.137', desc: 'Reports engine, funnels, behavior (Sensors / 神策) and live view.' },
];

window.NAV_FOOTER = [
  { id: 'settings', label: 'Settings', icon: 'settings', path: 'settings/index.html', status: 'planned' },
];

/* Newest first. `modules` lists the module ids each version touched. */
window.CHANGELOG = [
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
      'Orders added as the first scaffold page on the new shell',
    ],
  },
];
