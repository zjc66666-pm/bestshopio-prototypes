/* BestShopio Admin · Reviews prototype — sample data.
   Shaped after reference/bestvoy-admin .../products/type.ts
   (ReviewListItem, ReviewFormState, ReviewSearchField, ReviewType, ReviewStatus,
   ReviewRating) and api/modules/admin/review.ts (GET /store/reply/lst,
   count_statistics, detail/{id}, reply/{id}).
   Product reviews. No real PII / secrets. Media are inline SVG
   data-URIs so the prototype is fully self-contained (offline). */
(function () {
  // ---------- inline SVG helpers (avatars / product / media thumbs) ----------
  const svgURI = (inner, bg) =>
    'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">' +
      '<rect width="120" height="120" fill="' + (bg || '#e6f0ff') + '"/>' + inner + '</svg>');

  // initial-style avatar (colored circle + letter)
  const avatar = (letter, bg) => svgURI(
    '<circle cx="60" cy="60" r="60" fill="' + bg + '"/>' +
    '<text x="60" y="78" font-family="Inter,Arial" font-size="52" font-weight="600" fill="#ffffff" text-anchor="middle">' + letter + '</text>', bg);

  // simple product tile with a label glyph
  const tile = (glyph, bg, fg) => svgURI(
    '<rect width="120" height="120" rx="14" fill="' + bg + '"/>' +
    '<text x="60" y="74" font-family="Inter,Arial" font-size="46" font-weight="700" fill="' + (fg || '#0058c4') + '" text-anchor="middle">' + glyph + '</text>', bg);

  // photo-ish review media thumbnail (gradient + shape)
  const photo = (c1, c2, shape) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
    '<rect width="160" height="160" fill="url(#g)"/>' + shape + '</svg>');

  const PHOTOS = {
    bottle: photo('#bcdcff', '#6aa9ff', '<rect x="60" y="40" width="40" height="84" rx="14" fill="#ffffff" opacity=".85"/><rect x="68" y="26" width="24" height="20" rx="6" fill="#ffffff" opacity=".7"/>'),
    shoe:   photo('#ffe1c2', '#ff9d4d', '<path d="M30 104h74c14 0 24-6 24-16 0-6-40-22-58-40-8 18-40 24-40 40z" fill="#ffffff" opacity=".85"/>'),
    bag:    photo('#d9c8ff', '#9b7bff', '<rect x="48" y="56" width="64" height="60" rx="10" fill="#ffffff" opacity=".85"/><path d="M64 56v-8a16 16 0 0 1 32 0v8" stroke="#ffffff" stroke-width="7" fill="none" opacity=".8"/>'),
    watch:  photo('#cfeede', '#5cc196', '<circle cx="80" cy="80" r="30" fill="#ffffff" opacity=".9"/><rect x="72" y="30" width="16" height="22" fill="#ffffff" opacity=".7"/><rect x="72" y="108" width="16" height="22" fill="#ffffff" opacity=".7"/>'),
    mug:    photo('#ffd6e0', '#ff7a99', '<rect x="50" y="54" width="48" height="56" rx="8" fill="#ffffff" opacity=".9"/><path d="M98 66h14a14 14 0 0 1 0 28H98" stroke="#ffffff" stroke-width="8" fill="none" opacity=".8"/>'),
    lamp:   photo('#fff0bf', '#ffce47', '<path d="M60 44h40l10 30H50z" fill="#ffffff" opacity=".9"/><rect x="76" y="74" width="8" height="44" fill="#ffffff" opacity=".8"/>'),
    plant:  photo('#cdeccd', '#62b562', '<path d="M80 110V70" stroke="#ffffff" stroke-width="8" opacity=".85"/><path d="M80 78c-18-2-30-16-30-30 16 0 30 12 30 30zM80 70c16-4 26-18 26-30-14 2-26 14-26 30z" fill="#ffffff" opacity=".85"/>'),
  };
  // a fake video media (poster + play badge)
  const VIDEO_POSTER = photo('#1e293b', '#475569', '<circle cx="80" cy="80" r="30" fill="#ffffff" opacity=".92"/><path d="M72 66l24 14-24 14z" fill="#1e293b"/>');

  // ---------- Tabs (reviewsList.tsx REVIEW_TABS) ----------
  const TABS = [
    { key: 'all', label: 'All' },
  ];

  // ---------- Keyword-field select (utils.ts REVIEW_SEARCH_FIELD_OPTIONS) ----------
  const SEARCH_FIELDS = [
    { label: 'Review content', value: 'reviewContent' },
    { label: 'Customer name',  value: 'customerName' },
    { label: 'Product name',   value: 'productName' },
    { label: 'Product SPU',    value: 'productSpu' },
    { label: 'Product SKU',    value: 'productSku' },
    { label: 'Product barcode',value: 'productBarcode' },
    { label: 'Product ID',     value: 'productId' },
    { label: 'Variant ID',     value: 'variantId' },
  ];

  // ---------- Status meta (utils.ts REVIEW_STATUS_META) — 0 Visible, 1 Hidden ----------
  // Exact inline colors from the real admin: Visible blue, Hidden gray (bg + dot/text).
  const STATUS = {
    0: { text: 'Visible', bg: '#DCE6FC', dot: '#2563EB' },
    1: { text: 'Hidden',  bg: '#E4E5E8', dot: '#6B7280' },
  };

  // ---------- Reviews (ReviewListItem-shaped; detail superset fields included) ----------
  // Each row carries everything reviewEdit needs: comment, mediaUrls, customer,
  // product subject, status, recommend + priority, merchant reply, sku/spu/barcode.
  const REVIEWS = [
    {
      id: 9043, reviewType: 'product', rating: 5,
      comment: 'Absolutely love this water bottle — keeps drinks cold for the whole day and the matte finish feels premium. Worth every cent.',
      mediaUrls: [PHOTOS.bottle, PHOTOS.mug], firstMediaUrl: PHOTOS.bottle,
      createdAt: '2026-06-04 09:14',
      customerName: 'Emma Whitfield', customerAvatar: avatar('E', '#1677ff'),
      productId: 30481, productName: 'HydroPeak 750ml Insulated Bottle — Matte Black',
      productImage: tile('B', '#e6f0ff'), productSpu: 'SPU-HP750', productSku: 'HP750-MBLK', productBarcode: '8801234500011', variantId: 110481,
      status: 0, recommend: true, priority: 90,
      merchantReplyName: 'Bestshopio Store', merchantReplyContent: 'Thanks so much, Emma! Stay hydrated and enjoy the summer.', merchantReplyTime: '2026-06-04 11:02',
      videoUrl: '', videoPosterUrl: '',
    },
    {
      id: 9041, reviewType: 'product', rating: 4,
      comment: 'Comfortable runners and true to size. Took half a star off because the laces feel a little thin, but overall a solid buy.',
      mediaUrls: [PHOTOS.shoe], firstMediaUrl: PHOTOS.shoe,
      createdAt: '2026-06-03 19:55',
      customerName: 'Priya Nair', customerAvatar: avatar('P', '#13c2c2'),
      productId: 30622, productName: 'StridePro Lightweight Running Shoe — Coral',
      productImage: tile('S', '#fff0e6', '#c2410c'), productSpu: 'SPU-SPRUN', productSku: 'SPRUN-CRL-40', productBarcode: '8801234500288', variantId: 110622,
      status: 0, recommend: false, priority: 0,
      merchantReplyName: '', merchantReplyContent: '', merchantReplyTime: '',
      videoUrl: '', videoPosterUrl: '',
    },
    {
      id: 9040, reviewType: 'product', rating: 2,
      comment: 'The leather tote looks nice but one of the straps started fraying after two weeks. A bit disappointed for the price.',
      mediaUrls: [PHOTOS.bag], firstMediaUrl: PHOTOS.bag,
      createdAt: '2026-06-03 16:10',
      customerName: 'Sofia Marchetti', customerAvatar: avatar('S', '#faad14'),
      productId: 30733, productName: 'Milano Leather Tote — Cognac',
      productImage: tile('M', '#f3ecff', '#6d28d9'), productSpu: 'SPU-MLTOTE', productSku: 'MLTOTE-CGN', productBarcode: '8801234500455', variantId: 110733,
      status: 0, recommend: false, priority: 0,
      merchantReplyName: 'Bestshopio Store', merchantReplyContent: 'We are sorry to hear that, Sofia. Our team has reached out to arrange a replacement strap at no cost.', merchantReplyTime: '2026-06-03 18:22',
      videoUrl: '', videoPosterUrl: '',
    },
    {
      id: 9038, reviewType: 'product', rating: 5,
      comment: 'This smart watch exceeded expectations. Battery easily lasts five days and the sleep tracking is surprisingly accurate.',
      mediaUrls: [VIDEO_POSTER, PHOTOS.watch], firstMediaUrl: VIDEO_POSTER,
      createdAt: '2026-06-02 21:30',
      customerName: 'Daniel Cho', customerAvatar: avatar('D', '#a0d911'),
      productId: 30810, productName: 'PulseFit Smart Watch Series 4 — Graphite',
      productImage: tile('P', '#e8f7ef', '#15803d'), productSpu: 'SPU-PFWATCH', productSku: 'PFW4-GRPH', productBarcode: '8801234500622', variantId: 110810,
      status: 0, recommend: true, priority: 70,
      merchantReplyName: 'Bestshopio Store', merchantReplyContent: 'Awesome to hear, Daniel! Check the app for the new workout modes we just shipped.', merchantReplyTime: '2026-06-03 08:05',
      videoUrl: VIDEO_POSTER, videoPosterUrl: VIDEO_POSTER,
    },
    {
      id: 9037, reviewType: 'product', rating: 1,
      comment: 'Item arrived damaged and the box was crushed. Not what I expected at all.',
      mediaUrls: [PHOTOS.lamp], firstMediaUrl: PHOTOS.lamp,
      createdAt: '2026-06-02 15:02',
      customerName: 'Amelia Watson', customerAvatar: avatar('A', '#1677ff'),
      productId: 30844, productName: 'Aurora Bedside Lamp — Brass',
      productImage: tile('A', '#fff7e0', '#a16207'), productSpu: 'SPU-AURLMP', productSku: 'AURLMP-BRS', productBarcode: '8801234500799', variantId: 110844,
      status: 1, recommend: false, priority: 0,
      merchantReplyName: 'Bestshopio Store', merchantReplyContent: 'So sorry about the damage, Amelia. A replacement has shipped and is on its way to you.', merchantReplyTime: '2026-06-02 17:40',
      videoUrl: '', videoPosterUrl: '',
    },
    {
      id: 9035, reviewType: 'product', rating: 4,
      comment: 'Nice ceramic mug, holds heat well. The handle is a touch small for my hand but the design is gorgeous.',
      mediaUrls: [PHOTOS.mug], firstMediaUrl: PHOTOS.mug,
      createdAt: '2026-06-01 18:44',
      customerName: 'Oliver Bennett', customerAvatar: '',
      productId: 30901, productName: 'Terra Ceramic Mug 350ml — Sand',
      productImage: tile('T', '#fdeef2', '#be185d'), productSpu: 'SPU-TRMUG', productSku: 'TRMUG-SND', productBarcode: '8801234500966', variantId: 110901,
      status: 0, recommend: false, priority: 0,
      merchantReplyName: '', merchantReplyContent: '', merchantReplyTime: '',
      videoUrl: '', videoPosterUrl: '',
    },
    {
      id: 9034, reviewType: 'product', rating: 3,
      comment: 'It is okay. Does the job but feels a little cheaper than the photos suggest. Shipping was fast though.',
      mediaUrls: [], firstMediaUrl: '',
      createdAt: '2026-06-01 13:20',
      customerName: 'Maya Johansson', customerAvatar: avatar('M', '#faad14'),
      productId: 30481, productName: 'HydroPeak 750ml Insulated Bottle — Matte Black',
      productImage: tile('B', '#e6f0ff'), productSpu: 'SPU-HP750', productSku: 'HP750-MBLK', productBarcode: '8801234500011', variantId: 110481,
      status: 0, recommend: false, priority: 0,
      merchantReplyName: '', merchantReplyContent: '', merchantReplyTime: '',
      videoUrl: '', videoPosterUrl: '',
    },
    {
      id: 9032, reviewType: 'product', rating: 5,
      comment: 'Second pair I have bought. Incredibly light and the coral colorway is even nicer in person. Will buy again.',
      mediaUrls: [PHOTOS.shoe, PHOTOS.bottle], firstMediaUrl: PHOTOS.shoe,
      createdAt: '2026-05-31 11:42',
      customerName: 'Isabella Rossi', customerAvatar: avatar('I', '#1677ff'),
      productId: 30622, productName: 'StridePro Lightweight Running Shoe — Coral',
      productImage: tile('S', '#fff0e6', '#c2410c'), productSpu: 'SPU-SPRUN', productSku: 'SPRUN-CRL-38', productBarcode: '8801234500288', variantId: 110623,
      status: 0, recommend: true, priority: 50,
      merchantReplyName: '', merchantReplyContent: '', merchantReplyTime: '',
      videoUrl: '', videoPosterUrl: '',
    },
    {
      id: 9031, reviewType: 'product', rating: 2,
      comment: 'The lamp flickers occasionally on the lowest brightness setting. Customer support was helpful but the product itself is hit or miss.',
      mediaUrls: [], firstMediaUrl: '',
      createdAt: '2026-05-30 17:28',
      customerName: 'William Tan', customerAvatar: '',
      productId: 30844, productName: 'Aurora Bedside Lamp — Brass',
      productImage: tile('A', '#fff7e0', '#a16207'), productSpu: 'SPU-AURLMP', productSku: 'AURLMP-BRS', productBarcode: '8801234500799', variantId: 110844,
      status: 1, recommend: false, priority: 0,
      merchantReplyName: '', merchantReplyContent: '', merchantReplyTime: '',
      videoUrl: '', videoPosterUrl: '',
    },
    {
      id: 9029, reviewType: 'product', rating: 4,
      comment: 'Great value smart watch for the price point. Wish the band had more color options, otherwise no complaints.',
      mediaUrls: [PHOTOS.watch], firstMediaUrl: PHOTOS.watch,
      createdAt: '2026-05-29 22:11',
      customerName: 'Lucas Silva', customerAvatar: avatar('L', '#faad14'),
      productId: 30810, productName: 'PulseFit Smart Watch Series 4 — Graphite',
      productImage: tile('P', '#e8f7ef', '#15803d'), productSpu: 'SPU-PFWATCH', productSku: 'PFW4-GRPH', productBarcode: '8801234500622', variantId: 110810,
      status: 0, recommend: false, priority: 0,
      merchantReplyName: '', merchantReplyContent: '', merchantReplyTime: '',
      videoUrl: '', videoPosterUrl: '',
    },
  ];

  // ---------- Theme-template options (reviewEdit.tsx — only Default today) ----------
  const THEME_TEMPLATES = ['Default'];

  window.DATA_REVIEWS = {
    TABS,
    SEARCH_FIELDS,
    STATUS,
    REVIEWS,
    THEME_TEMPLATES,
  };
})();
