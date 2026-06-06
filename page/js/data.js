/* BestShopio Admin · Page (Content > Pages) prototype — sample data.
   Field names mirror reference/bestvoy-admin .../admin/page/type.ts
   (PageListItem / PageDetail): page_id, title, status (0 Hidden | 1 Visible),
   path, seo_title, seo_description, seo_keywords, sort, template,
   create_time, update_time, content. */
(function () {
  // Search field options (real list ships a single option: Page title)
  var FIELD_OPTIONS = [{ label: 'Page title', value: 'title' }];

  // Status options for the multi-select (1 Visible / 0 Hidden)
  var STATUS_OPTIONS = [
    { label: 'Visible', value: 1 },
    { label: 'Hidden', value: 0 },
  ];

  // Rich-text bodies (kept compact; rendered as HTML inside the content card)
  var BODY_ABOUT =
    '<h2>About Silix</h2>' +
    '<p>Silix designs everyday carry goods for people who move through cities. ' +
    'We started in 2019 with a single weekender bag and a simple belief: durable ' +
    'things should also be beautiful.</p>' +
    '<p>Every product is built from recycled materials and backed by our lifetime ' +
    'repair promise. Today we ship to 30+ countries from our studio in Lisbon.</p>' +
    '<h3>Our promise</h3>' +
    '<ul><li>Carbon-neutral shipping on every order</li>' +
    '<li>Lifetime repairs, no questions asked</li>' +
    '<li>1% of revenue donated to ocean cleanup</li></ul>';

  var BODY_CONTACT =
    '<h2>Get in touch</h2>' +
    '<p>Our support team replies within one business day. For order questions, ' +
    'please include your order number.</p>' +
    '<p><strong>Email:</strong> support@silix.example<br/>' +
    '<strong>Hours:</strong> Mon&ndash;Fri, 9am&ndash;6pm WET</p>' +
    '<p>Press &amp; partnerships: press@silix.example</p>';

  var BODY_SHIPPING =
    '<h2>Shipping &amp; Delivery</h2>' +
    '<p>Orders are processed within 1&ndash;2 business days. Standard delivery ' +
    'takes 3&ndash;7 business days depending on destination.</p>' +
    '<h3>Rates</h3>' +
    '<ul><li>Standard (3&ndash;7 days): Free over $60</li>' +
    '<li>Express (1&ndash;3 days): $12 flat</li></ul>' +
    '<p>You will receive a tracking link by email as soon as your order ships.</p>';

  var BODY_RETURNS =
    '<h2>Returns &amp; Refunds</h2>' +
    '<p>Not in love with your purchase? Return any unused item within 30 days for ' +
    'a full refund. Original tags must be attached.</p>' +
    '<p>Start a return from your account under <em>My orders</em>, or email us and ' +
    'we will send a prepaid label.</p>';

  var BODY_PRIVACY =
    '<h2>Privacy Policy</h2>' +
    '<p>This policy explains what data we collect, why we collect it, and how we ' +
    'keep it safe. We never sell your personal information.</p>' +
    '<p>You can request a copy of your data or ask us to delete it at any time by ' +
    'contacting privacy@silix.example.</p>';

  var BODY_TERMS =
    '<h2>Terms of Service</h2>' +
    '<p>By accessing this store you agree to the terms below. Please read them ' +
    'carefully before placing an order.</p>' +
    '<p>These terms may be updated from time to time. Continued use of the store ' +
    'constitutes acceptance of any changes.</p>';

  // ---- list rows (~12) ----
  var PAGES = [
    {
      page_id: 1024, title: 'About us', status: 1, sort: 1, path: '/about-us',
      seo_title: 'About Silix — Everyday carry, built to last',
      seo_description: 'Silix designs durable, beautiful everyday carry goods from recycled materials, backed by a lifetime repair promise.',
      seo_keywords: ['about silix', 'sustainable bags', 'brand story'],
      template: 'default', create_time: '2025-08-12 10:24:00', update_time: '2026-05-28 14:09:00',
      content: BODY_ABOUT,
    },
    {
      page_id: 1025, title: 'Contact', status: 1, sort: 2, path: '/contact',
      seo_title: 'Contact Silix — Support & press',
      seo_description: 'Reach the Silix support team for order help, returns, press and partnership enquiries.',
      seo_keywords: ['contact', 'customer support', 'help'],
      template: 'default', create_time: '2025-08-12 10:31:00', update_time: '2026-05-20 09:47:00',
      content: BODY_CONTACT,
    },
    {
      page_id: 1026, title: 'Shipping & Delivery', status: 1, sort: 3, path: '/shipping',
      seo_title: 'Shipping & Delivery — rates and timelines',
      seo_description: 'Standard and express shipping rates, processing times and tracking details for Silix orders.',
      seo_keywords: ['shipping', 'delivery', 'tracking'],
      template: 'default', create_time: '2025-09-02 16:12:00', update_time: '2026-06-01 11:02:00',
      content: BODY_SHIPPING,
    },
    {
      page_id: 1027, title: 'Returns & Refunds', status: 1, sort: 4, path: '/returns',
      seo_title: 'Returns & Refunds — 30-day policy',
      seo_description: 'Return any unused item within 30 days for a full refund. Learn how to start a return.',
      seo_keywords: ['returns', 'refunds', 'exchange'],
      template: 'default', create_time: '2025-09-02 16:20:00', update_time: '2026-05-14 13:38:00',
      content: BODY_RETURNS,
    },
    {
      page_id: 1028, title: 'Privacy Policy', status: 1, sort: 5, path: '/privacy-policy',
      seo_title: 'Privacy Policy',
      seo_description: 'How Silix collects, uses and protects your personal data.',
      seo_keywords: ['privacy', 'data protection', 'gdpr'],
      template: 'default', create_time: '2025-07-30 08:05:00', update_time: '2026-04-22 17:51:00',
      content: BODY_PRIVACY,
    },
    {
      page_id: 1029, title: 'Terms of Service', status: 1, sort: 6, path: '/terms-of-service',
      seo_title: 'Terms of Service',
      seo_description: 'The terms and conditions that govern your use of the Silix online store.',
      seo_keywords: ['terms', 'conditions', 'legal'],
      template: 'default', create_time: '2025-07-30 08:11:00', update_time: '2026-03-18 10:14:00',
      content: BODY_TERMS,
    },
    {
      page_id: 1030, title: 'Size Guide', status: 1, sort: 7, path: '/size-guide',
      seo_title: 'Size Guide — find your fit',
      seo_description: 'Measurements and capacity guidance to help you pick the right Silix bag.',
      seo_keywords: ['size guide', 'measurements', 'fit'],
      template: 'default', create_time: '2025-10-15 12:40:00', update_time: '2026-05-09 15:26:00',
      content: '<h2>Size Guide</h2><p>Compare dimensions and capacity across the range to find the bag that fits your daily haul.</p>',
    },
    {
      page_id: 1031, title: 'FAQ', status: 1, sort: 8, path: '/faq',
      seo_title: 'Frequently Asked Questions',
      seo_description: 'Answers to common questions about orders, shipping, returns and warranty.',
      seo_keywords: ['faq', 'questions', 'help'],
      template: 'default', create_time: '2025-10-21 09:18:00', update_time: '2026-04-30 18:03:00',
      content: '<h2>Frequently Asked Questions</h2><p>Find quick answers about ordering, shipping, returns and our lifetime repair promise.</p>',
    },
    {
      page_id: 1032, title: 'Our Materials', status: 1, sort: 9, path: '/materials',
      seo_title: 'Our Materials — recycled and built to last',
      seo_description: 'Learn about the recycled fabrics and hardware that go into every Silix product.',
      seo_keywords: ['materials', 'recycled', 'sustainability'],
      template: 'default', create_time: '2026-01-08 11:55:00', update_time: '2026-05-26 09:31:00',
      content: '<h2>Our Materials</h2><p>From recycled ocean-bound nylon to YKK&reg; zippers, every component is chosen to last.</p>',
    },
    {
      page_id: 1033, title: 'Spring Lookbook 2026', status: 0, sort: 10, path: '/spring-lookbook-2026',
      seo_title: 'Spring Lookbook 2026',
      seo_description: 'A first look at the Spring 2026 collection. Coming soon.',
      seo_keywords: ['lookbook', 'spring 2026', 'collection'],
      template: 'default', create_time: '2026-02-19 14:02:00', update_time: '2026-06-03 16:48:00',
      content: '<h2>Spring Lookbook 2026</h2><p>Draft page — campaign imagery and styling notes for the upcoming spring drop.</p>',
    },
    {
      page_id: 1034, title: 'Wholesale', status: 0, sort: 11, path: '/wholesale',
      seo_title: 'Wholesale — partner with Silix',
      seo_description: 'Apply to stock Silix in your store. Trade pricing and minimums available on request.',
      seo_keywords: ['wholesale', 'trade', 'stockist'],
      template: 'default', create_time: '2026-03-04 10:09:00', update_time: '2026-05-02 12:15:00',
      content: '<h2>Wholesale</h2><p>Draft — outline of trade terms, minimums and the stockist application flow.</p>',
    },
    {
      page_id: 1035, title: 'Careers', status: 0, sort: 12, path: '/careers',
      seo_title: 'Careers at Silix',
      seo_description: 'Open roles and what it is like to work at Silix.',
      seo_keywords: ['careers', 'jobs', 'hiring'],
      template: 'default', create_time: '2026-03-22 09:44:00', update_time: '2026-04-11 17:20:00',
      content: '<h2>Careers</h2><p>Draft — team values and a placeholder for open positions.</p>',
    },
  ];

  // detail map keyed by page_id (full PageDetail-shaped records reuse the list rows)
  var DETAILS = {};
  PAGES.forEach(function (p) { DETAILS[p.page_id] = p; });

  // Blank template for a brand-new page (id 0 -> "Add page")
  var NEW_PAGE = {
    page_id: 0, title: '', status: 1, sort: 0, path: '',
    seo_title: '', seo_description: '', seo_keywords: [],
    template: 'default', create_time: '', update_time: '', content: '',
  };

  window.DATA_PAGE = {
    PAGES: PAGES,
    DETAILS: DETAILS,
    NEW_PAGE: NEW_PAGE,
    FIELD_OPTIONS: FIELD_OPTIONS,
    STATUS_OPTIONS: STATUS_OPTIONS,
    SHOP_URL: 'https://www.bestvoy.com',
    TEMPLATE_OPTIONS: [{ label: 'Default', value: 'default' }],
  };
})();
