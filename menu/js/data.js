/* BestShopio Admin · Menu prototype — sample data.
   Shaped after reference/bestvoy-admin .../views/admin/menu/type.ts:
     MenuListItem { id, title, handle, items[] }
     MenuItem     { level, label, link, sort, children[] }   (two-level tree)
     EditableMenuItem adds a localId; detail edit form uses `item[]`.
   Storefront navigation menus. Items render top-down by `sort` DESCENDING
   ("Higher sort show first" — see utils.normalizeMenuItems). No real PII / secrets. */
(function () {
  // ---- Detail records (edit-form `item[]`: two-level trees) ----
  // sort: higher shows first. children null on level-2 nodes.
  const DETAILS = {
    1: {
      id: 1, title: 'Main menu', handle: 'main-menu',
      item: [
        { level: 1, label: 'Home', link: '/', sort: 60, children: [] },
        { level: 1, label: 'Shop', link: '/collections/all', sort: 50, children: [
          { level: 2, label: 'New Arrivals', link: '/collections/new-arrivals', sort: 40, children: null },
          { level: 2, label: 'Best Sellers', link: '/collections/best-sellers', sort: 30, children: null },
          { level: 2, label: "Men's", link: '/collections/mens', sort: 20, children: null },
          { level: 2, label: "Women's", link: '/collections/womens', sort: 10, children: null },
        ] },
        { level: 1, label: 'Collections', link: '/collections', sort: 40, children: [
          { level: 2, label: 'Footwear', link: '/collections/footwear', sort: 20, children: null },
          { level: 2, label: 'Accessories', link: '/collections/accessories', sort: 10, children: null },
        ] },
        { level: 1, label: 'Sale', link: '/collections/sale', sort: 30, children: [] },
        { level: 1, label: 'About', link: '/pages/about-us', sort: 20, children: [] },
        { level: 1, label: 'Contact', link: '/pages/contact', sort: 10, children: [] },
      ],
    },
    2: {
      id: 2, title: 'Footer menu', handle: 'footer',
      item: [
        // Group headers with no link (link allowed empty — group-only display)
        { level: 1, label: 'Customer care', link: '', sort: 30, children: [
          { level: 2, label: 'Contact us', link: '/pages/contact', sort: 40, children: null },
          { level: 2, label: 'Shipping & returns', link: '/policies/shipping-policy', sort: 30, children: null },
          { level: 2, label: 'Size guide', link: '/pages/size-guide', sort: 20, children: null },
          { level: 2, label: 'FAQ', link: '/pages/faq', sort: 10, children: null },
        ] },
        { level: 1, label: 'Company', link: '', sort: 20, children: [
          { level: 2, label: 'About us', link: '/pages/about-us', sort: 30, children: null },
          { level: 2, label: 'Store locator', link: '/pages/store-locator', sort: 20, children: null },
          { level: 2, label: 'Careers', link: 'https://careers.silix.example.com', sort: 10, children: null },
        ] },
        { level: 1, label: 'Legal', link: '', sort: 10, children: [
          { level: 2, label: 'Refund policy', link: '/policies/refund-policy', sort: 30, children: null },
          { level: 2, label: 'Privacy policy', link: '/policies/privacy-policy', sort: 20, children: null },
          { level: 2, label: 'Terms of service', link: '/policies/terms-of-service', sort: 10, children: null },
        ] },
      ],
    },
    3: {
      id: 3, title: 'Header promo bar', handle: 'header-promo',
      item: [
        { level: 1, label: 'Free shipping over $75', link: '/policies/shipping-policy', sort: 20, children: [] },
        { level: 1, label: 'Download the app', link: 'https://app.silix.example.com', sort: 10, children: [] },
      ],
    },
    4: {
      id: 4, title: 'Mobile menu', handle: 'mobile-menu',
      item: [
        { level: 1, label: 'Shop all', link: '/collections/all', sort: 50, children: [] },
        { level: 1, label: 'New Arrivals', link: '/collections/new-arrivals', sort: 40, children: [] },
        { level: 1, label: 'Best Sellers', link: '/collections/best-sellers', sort: 30, children: [] },
        { level: 1, label: 'Sale', link: '/collections/sale', sort: 20, children: [] },
        { level: 1, label: 'My account', link: '/account', sort: 10, children: [] },
      ],
    },
  };

  // ---- List rows (MenuListItem-shaped). items[] kept so the list can show
  //      the comma-joined labels column. Rows 1-4 reuse their detail trees. ----
  function flatLabels(items) {
    // top-level then its children, by sort desc (mirrors flattenMenuItemLabels + normalize)
    const tops = (items || []).slice().sort((a, b) => b.sort - a.sort);
    const out = [];
    tops.forEach((t) => {
      out.push(t.label);
      (t.children || []).slice().sort((a, b) => b.sort - a.sort).forEach((c) => out.push(c.label));
    });
    return out;
  }

  const MENUS = [
    { id: 1, title: 'Main menu',        handle: 'main-menu',     items: DETAILS[1].item },
    { id: 2, title: 'Footer menu',      handle: 'footer',        items: DETAILS[2].item },
    { id: 3, title: 'Header promo bar', handle: 'header-promo',  items: DETAILS[3].item },
    { id: 4, title: 'Mobile menu',      handle: 'mobile-menu',   items: DETAILS[4].item },
    // remaining rows: lightweight label lists only (no editable detail in this prototype)
    { id: 5, title: 'Account menu',     handle: 'account', items: [
      { level: 1, label: 'My orders', link: '/account/orders', sort: 40, children: [] },
      { level: 1, label: 'Addresses', link: '/account/addresses', sort: 30, children: [] },
      { level: 1, label: 'Wishlist', link: '/account/wishlist', sort: 20, children: [] },
      { level: 1, label: 'Log out', link: '/account/logout', sort: 10, children: [] },
    ] },
    { id: 6, title: 'Sale landing nav', handle: 'sale-landing', items: [
      { level: 1, label: 'Up to 50% off', link: '/collections/sale', sort: 30, children: [] },
      { level: 1, label: 'Clearance', link: '/collections/clearance', sort: 20, children: [] },
      { level: 1, label: 'Last chance', link: '/collections/last-chance', sort: 10, children: [] },
    ] },
    { id: 7, title: 'Wholesale menu',   handle: 'wholesale', items: [
      { level: 1, label: 'Catalogue', link: '/pages/wholesale-catalogue', sort: 20, children: [] },
      { level: 1, label: 'Apply for an account', link: '/pages/wholesale-apply', sort: 10, children: [] },
    ] },
    { id: 8, title: 'Holiday gift guide', handle: 'holiday-2025', items: [
      { level: 1, label: 'Gifts under $25', link: '/collections/gifts-under-25', sort: 30, children: [] },
      { level: 1, label: 'Gifts under $50', link: '/collections/gifts-under-50', sort: 20, children: [] },
      { level: 1, label: 'Gift cards', link: '/collections/gift-cards', sort: 10, children: [] },
    ] },
    { id: 9, title: 'Brand stories',    handle: 'brand-stories', items: [
      { level: 1, label: 'Our story', link: '/pages/our-story', sort: 30, children: [] },
      { level: 1, label: 'Sustainability', link: '/pages/sustainability', sort: 20, children: [] },
      { level: 1, label: 'Journal', link: '/blogs/style-journal', sort: 10, children: [] },
    ] },
    { id: 10, title: 'Returns center',  handle: 'returns', items: [
      { level: 1, label: 'Start a return', link: '/pages/returns', sort: 20, children: [] },
      { level: 1, label: 'Return policy', link: '/policies/refund-policy', sort: 10, children: [] },
    ] },
  ];

  window.DATA_MENU = { MENUS, DETAILS, flatLabels };
})();
