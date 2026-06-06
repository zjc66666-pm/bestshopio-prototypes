/* BestShopio Admin · Blog prototype — sample data.
   Field names mirror reference/bestvoy-admin .../admin/blog/type.ts
   (article_id, cid, title, image_input, author, status, is_recommend,
    sort, background_color, synopsis, seo_*, article_seo_title, template,
    create_time, articleCategory, content). No real secrets. English only. */
window.DATA_BLOG = (function () {
  // image_input uses a tiny inline data-URI thumbnail (solid tint) so the
  // prototype is fully self-contained with no network image dependency.
  const tint = (hex) =>
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">' +
        '<rect width="40" height="40" rx="4" fill="' + hex + '"/>' +
        '<path d="M9 27l6-7 4 4 5-6 7 9z" fill="rgba(255,255,255,.55)"/>' +
        '<circle cx="14" cy="14" r="3" fill="rgba(255,255,255,.65)"/>' +
      '</svg>'
    );

  // article categories (cid -> articleCategory)  — mirrors BlogCategory
  const CATEGORIES = [
    { article_category_id: 1, title: 'Product news',   seo_path: 'product-news' },
    { article_category_id: 2, title: 'Buying guides',  seo_path: 'buying-guides' },
    { article_category_id: 3, title: 'Brand stories',  seo_path: 'brand-stories' },
    { article_category_id: 4, title: 'Promotions',     seo_path: 'promotions' },
    { article_category_id: 5, title: 'Care & support', seo_path: 'care-support' },
  ];
  const catById = (id) => CATEGORIES.find((c) => c.article_category_id === id) || null;

  // ---- list rows (BlogListItem-shaped) ----
  const POSTS = [
    { article_id: 101, cid: 1, title: 'Introducing the AeroLite Carry-On 2.0',              image_input: tint('#2563eb'), author: 'Maya Lindqvist',  status: 1, is_recommend: 1, is_hot: 1, sort: 90, create_time: '2026-05-28 10:24' },
    { article_id: 102, cid: 2, title: 'How to choose the right suitcase size for any trip', image_input: tint('#0ea5e9'), author: 'Editorial Team',   status: 1, is_recommend: 1, is_hot: 0, sort: 80, create_time: '2026-05-22 14:05' },
    { article_id: 103, cid: 4, title: 'Summer Sale: up to 30% off best-selling luggage',     image_input: tint('#f97316'), author: 'Marketing',       status: 1, is_recommend: 0, is_hot: 1, sort: 0,  create_time: '2026-05-19 09:00' },
    { article_id: 104, cid: 3, title: 'The story behind our recycled-shell collection',      image_input: tint('#16a34a'), author: 'Priya Nair',      status: 1, is_recommend: 0, is_hot: 0, sort: 0,  create_time: '2026-05-14 16:42' },
    { article_id: 105, cid: 2, title: 'Packing cubes 101: fit 40% more in your bag',          image_input: tint('#7c3aed'), author: 'Editorial Team',   status: 0, is_recommend: 0, is_hot: 0, sort: 0,  create_time: '2026-05-11 11:18' },
    { article_id: 106, cid: 5, title: 'Warranty & repairs: what is covered',                  image_input: tint('#0891b2'), author: 'Support',         status: 1, is_recommend: 0, is_hot: 0, sort: 0,  create_time: '2026-05-08 08:30' },
    { article_id: 107, cid: 1, title: 'New colorways just dropped for spring',                image_input: tint('#db2777'), author: 'Maya Lindqvist',  status: 1, is_recommend: 0, is_hot: 1, sort: 0,  create_time: '2026-05-04 13:55' },
    { article_id: 108, cid: 2, title: 'Carry-on vs. checked: a frequent flyer guide',         image_input: tint('#4f46e5'), author: 'Editorial Team',   status: 0, is_recommend: 0, is_hot: 0, sort: 0,  create_time: '2026-04-29 17:10' },
    { article_id: 109, cid: 3, title: 'Behind the design: the 4-wheel spinner system',        image_input: tint('#059669'), author: 'Liam Carter',     status: 1, is_recommend: 0, is_hot: 0, sort: 0,  create_time: '2026-04-25 10:02' },
    { article_id: 110, cid: 4, title: 'Bundle & save: travel sets for families',              image_input: tint('#ea580c'), author: 'Marketing',       status: 1, is_recommend: 0, is_hot: 0, sort: 0,  create_time: '2026-04-21 12:48' },
    { article_id: 111, cid: 5, title: 'How to clean and store your luggage off-season',        image_input: tint('#0d9488'), author: 'Support',         status: 1, is_recommend: 0, is_hot: 0, sort: 0,  create_time: '2026-04-16 15:33' },
    { article_id: 112, cid: 1, title: 'The lightest hard-shell we have ever made',             image_input: tint('#1d4ed8'), author: 'Maya Lindqvist',  status: 0, is_recommend: 0, is_hot: 0, sort: 0,  create_time: '2026-04-12 09:27' },
    { article_id: 113, cid: 2, title: 'Carry-on essentials checklist for 2026',                image_input: tint('#9333ea'), author: 'Editorial Team',   status: 1, is_recommend: 0, is_hot: 0, sort: 0,  create_time: '2026-04-07 11:44' },
    { article_id: 114, cid: 3, title: 'Meet the makers: our factory in Porto',                 image_input: tint('#15803d'), author: 'Priya Nair',      status: 1, is_recommend: 0, is_hot: 0, sort: 0,  create_time: '2026-04-02 14:19' },
  ].map((p) => Object.assign(p, { articleCategory: catById(p.cid) }));

  // ---- full detail records (BlogDetail + BlogFormData-shaped) keyed by id ----
  // A couple of fleshed-out records used by the edit view.
  const DETAILS = {
    101: {
      article_id: 101, cid: 1, title: 'Introducing the AeroLite Carry-On 2.0',
      author: 'Maya Lindqvist', image_input: tint('#2563eb'),
      status: 1, is_recommend: 1, is_hot: 1, is_banner: 0, sort: 90,
      background_color: '#E6F0FF', template: 'default',
      synopsis: 'Our flagship carry-on just got a major upgrade: a lighter recycled shell, a smoother 4-wheel spinner system and a built-in USB pass-through. Here is everything that changed.',
      seo_title: 'AeroLite Carry-On 2.0 — lighter, smarter travel',
      seo_description: 'Meet the AeroLite Carry-On 2.0: a lighter recycled shell, smoother spinner wheels and a built-in USB pass-through for the modern traveler.',
      seo_keywords: ['carry-on', 'lightweight luggage', 'AeroLite', 'travel'],
      article_seo_title: 'aerolite-carry-on-2',
      create_time: '2026-05-28 10:24',
      articleCategory: catById(1),
      content: {
        article_content_id: 9101,
        content: '<h2>A lighter shell, by design</h2><p>The new AeroLite shell is made from 100% recycled polycarbonate, shaving 280g off the previous model while keeping the same drop-test rating.</p><p>We re-engineered the corners to absorb impact and added a soft-grip telescopic handle that locks at three heights.</p><h2>Smoother on every surface</h2><p>The upgraded 4-wheel spinner system glides silently across tile, carpet and cobblestone — no more dragging at the gate.</p>',
      },
    },
    102: {
      article_id: 102, cid: 2, title: 'How to choose the right suitcase size for any trip',
      author: 'Editorial Team', image_input: tint('#0ea5e9'),
      status: 1, is_recommend: 1, is_hot: 0, is_banner: 0, sort: 80,
      background_color: '#E0F2FE', template: 'default',
      synopsis: 'Weekend break or three-week expedition? This guide breaks down cabin, medium and large sizes so you pack exactly what you need.',
      seo_title: 'Suitcase size guide: cabin, medium & large',
      seo_description: 'Not sure which suitcase size to buy? Our guide compares cabin, medium and large luggage by trip length, airline rules and packing style.',
      seo_keywords: ['suitcase size', 'luggage guide', 'cabin bag'],
      article_seo_title: 'suitcase-size-guide',
      create_time: '2026-05-22 14:05',
      articleCategory: catById(2),
      content: {
        article_content_id: 9102,
        content: '<h2>Match the bag to the trip</h2><p>As a rule of thumb: a cabin case (35–45L) covers 1–3 nights, a medium case (60–75L) covers 4–7 nights, and a large case (90L+) is for longer trips or shared packing.</p><p>Always check your airline’s cabin allowance before you fly — limits vary by carrier and fare class.</p>',
      },
    },
    103: {
      article_id: 103, cid: 4, title: 'Summer Sale: up to 30% off best-selling luggage',
      author: 'Marketing', image_input: tint('#f97316'),
      status: 1, is_recommend: 0, is_hot: 1, is_banner: 1, sort: 0,
      background_color: '#FFEDD5', template: 'default',
      synopsis: 'For two weeks only, our best-selling carry-ons and travel sets are up to 30% off. Free shipping on every order over $99.',
      seo_title: 'Summer Sale — up to 30% off luggage',
      seo_description: 'Save up to 30% on best-selling carry-ons and travel sets in our Summer Sale. Free shipping over $99. Limited time only.',
      seo_keywords: ['summer sale', 'luggage deals', 'discount'],
      article_seo_title: 'summer-sale-2026',
      create_time: '2026-05-19 09:00',
      articleCategory: catById(4),
      content: {
        article_content_id: 9103,
        content: '<h2>Two weeks of savings</h2><p>From May 19 to June 2, take up to 30% off select carry-ons, checked cases and packing accessories. No code needed — discounts are applied at checkout.</p>',
      },
    },
    105: {
      article_id: 105, cid: 2, title: 'Packing cubes 101: fit 40% more in your bag',
      author: 'Editorial Team', image_input: tint('#7c3aed'),
      status: 0, is_recommend: 0, is_hot: 0, is_banner: 0, sort: 0,
      background_color: '#EDE9FE', template: 'default',
      synopsis: 'Packing cubes keep your case tidy and squeeze in more than you would think. Here is how to use them like a pro.',
      seo_title: 'Packing cubes 101 — pack 40% more',
      seo_description: 'Learn how packing cubes help you fit up to 40% more in your suitcase while keeping everything organized and crease-free.',
      seo_keywords: ['packing cubes', 'packing tips'],
      article_seo_title: 'packing-cubes-101',
      create_time: '2026-05-11 11:18',
      articleCategory: catById(2),
      content: {
        article_content_id: 9105,
        content: '<h2>Roll, don’t fold</h2><p>Rolling soft garments and grouping them in cubes by type (tops, bottoms, layers) means you can find anything without unpacking the whole case.</p>',
      },
    },
  };

  // ---- filter option lists (mirror search.tsx) ----
  const SEARCH_FIELDS = [
    { value: 'title',  label: 'Blog title' },
    { value: 'author', label: 'Author' },
  ];
  const STATUS_OPTIONS = [
    { value: 1, label: 'Visible' },
    { value: 0, label: 'Hidden' },
  ];

  // status pill mapping (mirror STATUS_COLOR in table.tsx)
  const STATUS_PILL = {
    1: { text: 'Visible', cls: 'pill-blue' },
    0: { text: 'Hidden',  cls: 'pill-gray' },
  };

  const SHOP_URL = 'https://www.bestvoy.com';

  return {
    POSTS, DETAILS, CATEGORIES,
    SEARCH_FIELDS, STATUS_OPTIONS, STATUS_PILL,
    SHOP_URL, tint,
  };
})();
