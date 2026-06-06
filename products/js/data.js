/* BestShopio Admin · Products prototype — sample data.
   Shaped after reference/bestvoy-admin .../products/type.ts:
     - list rows  -> ProductInfo / ProductRecord
       (product_id, store_name, image, price_min/max, on_sale_stock, variant_count,
        inventory_status, is_show, is_del, spec_type, sku_sync_stats, vendor)
     - detail/edit -> ProductDetail + ProductFormData + ProductSettings
   No real PII / secrets. Money in store currency (USD $). */
(function () {
  // ---- Status filter tabs (products.vue: 0 All / 1 Activated / 2 Deactivated / 3 Archived) ----
  // status derived from is_show + is_del (table.tsx getProductStatus):
  //   is_del=1 -> archived ; is_show=1 -> activated ; else deactivated
  const TABS = [
    { key: 0, label: 'All' },
    { key: 1, label: 'Activated' },
    { key: 2, label: 'Deactivated' },
    { key: 3, label: 'Archived' },
  ];

  // ---- Keyword field select (list/search.tsx SEARCH_FIELD_OPTIONS) ----
  const SEARCH_FIELDS = [
    { label: 'Product name', value: 'product_name' },
    { label: 'Product SPU', value: 'product_spu' },
    { label: 'Product SKU', value: 'product_sku' },
    { label: 'Product barcode', value: 'barcode' },
    { label: 'Product ID', value: 'product_id' },
    { label: 'Variant ID', value: 'variant_id' },
  ];

  // ---- Sort options (type.ts: sort_field price|stock, sort_order asc|desc) ----
  const SORT_OPTIONS = [
    { label: 'Default', value: '' },
    { label: 'Price: low to high', value: 'price_asc' },
    { label: 'Price: high to low', value: 'price_desc' },
    { label: 'Stock: low to high', value: 'stock_asc' },
    { label: 'Stock: high to low', value: 'stock_desc' },
  ];

  // ---- Category tree (settings.tsx / TreeCascadeSelect; cate_id) ----
  const CATEGORIES = [
    { value: 0, label: 'All categories' },
    { value: 11, label: 'Activewear' },
    { value: 12, label: 'Activewear / Leggings' },
    { value: 13, label: 'Activewear / Sports bras' },
    { value: 21, label: 'Shapewear' },
    { value: 22, label: 'Shapewear / Bodysuits' },
    { value: 31, label: 'Accessories' },
    { value: 32, label: 'Accessories / Socks' },
  ];

  // ---- Vendors (settings.tsx vendor select) ----
  const VENDORS = [
    { value: 1, label: 'Silix Official' },
    { value: 2, label: 'BumpBabe' },
    { value: 3, label: 'Folast' },
    { value: 4, label: 'Lovocross' },
    { value: 5, label: 'Minilizm' },
  ];

  // ---- Variant option name suggestions (Variants.tsx defaultOptions) ----
  const OPTION_NAMES = ['Color', 'Size', 'Material', 'Style'];

  // ---- Theme templates (settings.tsx templateOptions) ----
  const TEMPLATES = [
    { value: 'default', label: 'Default' },
    { value: 'one_page_checkout', label: 'One page checkout' },
  ];

  // small inline data-URI placeholder swatches (no external assets)
  const sw = (hex) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" rx="6" fill="' + hex + '"/></svg>');
  const IMG = {
    legging: sw('#1f2937'), pocket: sw('#374151'), sleeve: sw('#0ea5e9'),
    short: sw('#475569'), capri: sw('#312e81'), brief: sw('#9333ea'),
    bra: sw('#db2777'), bodysuit: sw('#0f766e'), sock: sw('#f59e0b'),
    waist: sw('#111827'), seamless: sw('#6d28d9'), tank: sw('#0891b2'),
    biker: sw('#1e293b'), flare: sw('#7c3aed'), thong: sw('#be185d'),
  };

  // sku_sync_stats — mirrors SkuSyncStats; drives the "SKU sync" column pill
  const SY = {
    synced: (n) => ({ total_skus: n, synchronized: n, not_synchronized: 0, processing: 0, failed: 0, deleted: 0, is_partially_synced: false }),
    partial: (n, done) => ({ total_skus: n, synchronized: done, not_synchronized: n - done, processing: 0, failed: 0, deleted: 0, is_partially_synced: true }),
    processing: (n) => ({ total_skus: n, synchronized: 0, not_synchronized: 0, processing: n, failed: 0, deleted: 0, is_partially_synced: false }),
    failed: (n, fail) => ({ total_skus: n, synchronized: n - fail, not_synchronized: 0, processing: 0, failed: fail, deleted: 0, is_partially_synced: true }),
    none: () => ({ total_skus: 0, synchronized: 0, not_synchronized: 0, processing: 0, failed: 0, deleted: 0, is_partially_synced: false }),
  };

  // inventory_status: 0 = in stock, 1 = out of stock, 2 = partial / some out of stock
  // spec_type: 1 = has variants, 0 = single
  const PRODUCTS = [
    { product_id: 50421, store_name: '3D Anti-Cellulite Compression Leggings', image: IMG.legging,
      price_min: 39.9, price_max: 49.9, on_sale_stock: 1280, variant_count: 12, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 1, sku_sync_stats: SY.synced(12), vendor: { name: 'Silix Official' } },
    { product_id: 50420, store_name: 'High-Waist Pocket Sculpting Leggings', image: IMG.pocket,
      price_min: 42.0, price_max: 42.0, on_sale_stock: 64, variant_count: 9, inventory_status: 2,
      is_show: 1, is_del: 0, spec_type: 1, sku_sync_stats: SY.partial(9, 6), vendor: { name: 'Silix Official' } },
    { product_id: 50419, store_name: 'Graduated Compression Calf Sleeves', image: IMG.sleeve,
      price_min: 18.5, price_max: 18.5, on_sale_stock: 0, variant_count: 4, inventory_status: 1,
      is_show: 1, is_del: 0, spec_type: 1, sku_sync_stats: SY.synced(4), vendor: { name: 'Folast' } },
    { product_id: 50418, store_name: 'Seamless Short Biker Leggings', image: IMG.short,
      price_min: 24.0, price_max: 29.0, on_sale_stock: 530, variant_count: 8, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 1, sku_sync_stats: SY.processing(8), vendor: { name: 'Silix Official' } },
    { product_id: 50417, store_name: 'Butt-Lifting Capri Leggings', image: IMG.capri,
      price_min: 37.0, price_max: 37.0, on_sale_stock: 212, variant_count: 6, inventory_status: 0,
      is_show: 0, is_del: 0, spec_type: 1, sku_sync_stats: SY.failed(6, 2), vendor: { name: 'Lovocross' } },
    { product_id: 50416, store_name: 'Seamless Sculpting Briefs (3-Pack)', image: IMG.brief,
      price_min: 15.9, price_max: 15.9, on_sale_stock: 980, variant_count: 5, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 1, sku_sync_stats: SY.synced(5), vendor: { name: 'BumpBabe' } },
    { product_id: 50415, store_name: 'Lightweight Racerback Sports Bra', image: IMG.bra,
      price_min: 22.0, price_max: 26.0, on_sale_stock: 47, variant_count: 10, inventory_status: 2,
      is_show: 1, is_del: 0, spec_type: 1, sku_sync_stats: SY.partial(10, 7), vendor: { name: 'Silix Official' } },
    { product_id: 50414, store_name: 'Tummy-Control Shaping Bodysuit', image: IMG.bodysuit,
      price_min: 45.0, price_max: 52.0, on_sale_stock: 0, variant_count: 9, inventory_status: 1,
      is_show: 0, is_del: 0, spec_type: 1, sku_sync_stats: SY.none(), vendor: { name: 'Minilizm' } },
    { product_id: 50413, store_name: 'Cushioned No-Show Ankle Socks (6-Pack)', image: IMG.sock,
      price_min: 12.0, price_max: 12.0, on_sale_stock: 3400, variant_count: 0, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 0, sku_sync_stats: SY.synced(1), vendor: { name: 'Folast' } },
    { product_id: 50412, store_name: 'Classic High-Waist Yoga Leggings', image: IMG.waist,
      price_min: 34.0, price_max: 34.0, on_sale_stock: 760, variant_count: 12, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 1, sku_sync_stats: SY.synced(12), vendor: { name: 'Silix Official' } },
    { product_id: 50411, store_name: 'Seamless Ribbed Tank Top', image: IMG.tank,
      price_min: 19.0, price_max: 19.0, on_sale_stock: 88, variant_count: 7, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 1, sku_sync_stats: SY.partial(7, 5), vendor: { name: 'BumpBabe' } },
    { product_id: 50410, store_name: 'Cross-Waist Flare Yoga Pants', image: IMG.flare,
      price_min: 41.0, price_max: 46.0, on_sale_stock: 0, variant_count: 8, inventory_status: 1,
      is_show: 0, is_del: 1, spec_type: 1, sku_sync_stats: SY.none(), vendor: { name: 'Lovocross' } },
    { product_id: 50409, store_name: 'No-Show Seamless Thong (5-Pack)', image: IMG.thong,
      price_min: 17.0, price_max: 17.0, on_sale_stock: 1240, variant_count: 5, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 1, sku_sync_stats: SY.synced(5), vendor: { name: 'BumpBabe' } },
    { product_id: 50408, store_name: 'Padded Longline Sports Bra', image: IMG.bra,
      price_min: 28.0, price_max: 32.0, on_sale_stock: 156, variant_count: 9, inventory_status: 2,
      is_show: 1, is_del: 0, spec_type: 1, sku_sync_stats: SY.failed(9, 1), vendor: { name: 'Silix Official' } },
    { product_id: 50407, store_name: 'Discontinued Mesh Panel Capris', image: IMG.capri,
      price_min: 33.0, price_max: 33.0, on_sale_stock: 0, variant_count: 6, inventory_status: 1,
      is_show: 0, is_del: 1, spec_type: 1, sku_sync_stats: SY.none(), vendor: { name: 'Minilizm' } },
    { product_id: 50406, store_name: 'Compression Postpartum Support Shorts', image: IMG.short,
      price_min: 36.0, price_max: 36.0, on_sale_stock: 420, variant_count: 8, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 1, sku_sync_stats: SY.synced(8), vendor: { name: 'BumpBabe' } },
  ];

  // ---------- Full detail/edit records (ProductDetail + ProductFormData + ProductSettings) ----------
  // keyed by product_id
  const DETAILS = {
    50421: {
      product_id: 50421,
      name: '3D Anti-Cellulite Compression Leggings',
      summary: 'High-compression leggings with a 3D honeycomb knit that smooths and shapes.',
      highlights: [
        'Patented 3D honeycomb compression knit',
        'Squat-proof, four-way stretch fabric',
        'High waistband with hidden pocket',
      ],
      description: 'Designed for everyday wear and training. The 3D anti-cellulite texture gently massages skin while the high-rise waistband stays put through any movement. Moisture-wicking and breathable.',
      detail: '<h3>Fabric &amp; care</h3><p>78% nylon, 22% spandex. Machine wash cold, hang dry. Do not bleach.</p><h3>Fit</h3><p>True to size. Model is 5\'8" wearing size M.</p>',
      cate_id: 12, category_label: 'Activewear / Leggings',
      product_spu: 'SPU-LEG-3DAC',
      images: [
        { uid: 'i1', name: 'front.jpg', url: IMG.legging, cover: true },
        { uid: 'i2', name: 'back.jpg', url: IMG.pocket },
        { uid: 'i3', name: 'detail.jpg', url: IMG.waist },
        { uid: 'i4', name: 'video.mp4', url: IMG.short, type: 'video' },
      ],
      hasVariants: true, spec_type: 1,
      // options (attr) -> Variants.tsx
      attr: [
        { value: 'Color', detail: [{ value: 'Black' }, { value: 'Grey' }, { value: 'Navy' }] },
        { value: 'Size', detail: [{ value: 'S' }, { value: 'M' }, { value: 'L' }, { value: 'XL' }] },
      ],
      // SKU rows (attrValue) -> SkuList.tsx; a representative subset of the 12 combos
      attrValue: [
        { unique: 'V-3DAC-BK-S', title: 'Black • S', image: IMG.legging, sku: 'LEG-3DAC-BK-S', price: 39.9, ot_price: 49.9, cost: 14.2, stock: 120, weight: 180, bar_code_number: '0850001000011', is_show: 1, is_default_select: 1 },
        { unique: 'V-3DAC-BK-M', title: 'Black • M', image: IMG.legging, sku: 'LEG-3DAC-BK-M', price: 39.9, ot_price: 49.9, cost: 14.2, stock: 210, weight: 185, bar_code_number: '0850001000028', is_show: 1, is_default_select: 0 },
        { unique: 'V-3DAC-BK-L', title: 'Black • L', image: IMG.legging, sku: 'LEG-3DAC-BK-L', price: 42.9, ot_price: 49.9, cost: 14.6, stock: 175, weight: 190, bar_code_number: '0850001000035', is_show: 1, is_default_select: 0 },
        { unique: 'V-3DAC-GR-M', title: 'Grey • M', image: IMG.waist, sku: 'LEG-3DAC-GR-M', price: 39.9, ot_price: 49.9, cost: 14.2, stock: 96, weight: 185, bar_code_number: '0850001000042', is_show: 1, is_default_select: 0 },
        { unique: 'V-3DAC-GR-L', title: 'Grey • L', image: IMG.waist, sku: 'LEG-3DAC-GR-L', price: 42.9, ot_price: 49.9, cost: 14.6, stock: 88, weight: 190, bar_code_number: '0850001000059', is_show: 1, is_default_select: 0 },
        { unique: 'V-3DAC-NV-M', title: 'Navy • M', image: IMG.capri, sku: 'LEG-3DAC-NV-M', price: 39.9, ot_price: 49.9, cost: 14.2, stock: 60, weight: 185, bar_code_number: '0850001000066', is_show: 1, is_default_select: 0 },
        { unique: 'V-3DAC-NV-XL', title: 'Navy • XL', image: IMG.capri, sku: 'LEG-3DAC-NV-XL', price: 44.9, ot_price: 52.0, cost: 15.1, stock: 0, weight: 200, bar_code_number: '0850001000073', is_show: 0, is_default_select: 0 },
      ],
      // single-product price/inventory fallback (used when hasVariants=false)
      price: 39.9, compareAtPrice: 49.9, itemCost: 14.2, sku: 'LEG-3DAC', barcode: '0850001000011', inventoryQuantity: 1280,
      // product specifics (params)
      params: [
        { name: 'Fabric', single: '78% Nylon, 22% Spandex' },
        { name: 'Rise', single: 'High waist' },
        { name: 'Care', single: 'Machine wash cold' },
      ],
      // metafields (shop + google namespaces)
      metafields: {
        shop: [
          { key: 'fabric_weight', type: 'Single line text', value: '240 gsm' },
          { key: 'fit_guide', type: 'Single line text', value: 'True to size' },
        ],
        google: [
          { key: 'gender', type: 'Single line text', value: 'Female' },
          { key: 'age_group', type: 'Single line text', value: 'Adult' },
          { key: 'material', type: 'Single line text', value: 'Nylon' },
        ],
      },
      // settings / right rail (ProductSettings)
      settings: {
        activated: true, status: 'activated', spu: 'SPU-LEG-3DAC', weight: 185, vendor_id: 1,
        category: 12, tags: ['bestseller', 'compression', 'high-waist'],
        metaTitle: '3D Anti-Cellulite Compression Leggings | Silix',
        metaDescription: 'Shop high-compression 3D anti-cellulite leggings. Squat-proof, breathable, with a hidden waistband pocket.',
        urlHandle: '3d-anti-cellulite-compression-leggings',
        seoKeywords: ['compression leggings', 'anti-cellulite', 'high waist leggings'],
        homeTemplate: 'default',
      },
    },

    50413: {
      product_id: 50413,
      name: 'Cushioned No-Show Ankle Socks (6-Pack)',
      summary: 'Breathable cushioned ankle socks that stay hidden in any sneaker.',
      highlights: [
        'Stay-put heel tab — no slipping',
        'Cushioned sole, mesh top for airflow',
        '6 pairs per pack',
      ],
      description: 'Soft combed-cotton blend with arch support and a low-profile cut that disappears below the shoe line. Reinforced heel and toe for durability.',
      detail: '<h3>Material</h3><p>80% combed cotton, 17% polyester, 3% spandex.</p><h3>Sizing</h3><p>One size fits US 6–11.</p>',
      cate_id: 32, category_label: 'Accessories / Socks',
      product_spu: 'SPU-ACC-SOCK6',
      images: [
        { uid: 's1', name: 'pack.jpg', url: IMG.sock, cover: true },
        { uid: 's2', name: 'detail.jpg', url: IMG.tank },
      ],
      hasVariants: false, spec_type: 0,
      attr: [],
      attrValue: [
        { unique: 'V-SOCK6-OS', title: 'Default', image: IMG.sock, sku: 'ACC-SOCK6', price: 12.0, ot_price: 16.0, cost: 3.4, stock: 3400, weight: 140, bar_code_number: '0850002000018', is_show: 1, is_default_select: 1 },
      ],
      price: 12.0, compareAtPrice: 16.0, itemCost: 3.4, sku: 'ACC-SOCK6', barcode: '0850002000018', inventoryQuantity: 3400,
      params: [
        { name: 'Pack size', single: '6 pairs' },
        { name: 'Fits', single: 'US 6 - 11' },
      ],
      metafields: {
        shop: [{ key: 'pack_count', type: 'Integer', value: '6' }],
        google: [
          { key: 'gender', type: 'Single line text', value: 'Unisex' },
          { key: 'age_group', type: 'Single line text', value: 'Adult' },
        ],
      },
      settings: {
        activated: true, status: 'activated', spu: 'SPU-ACC-SOCK6', weight: 140, vendor_id: 3,
        category: 32, tags: ['socks', 'multipack'],
        metaTitle: 'Cushioned No-Show Ankle Socks (6-Pack) | Silix',
        metaDescription: 'Breathable cushioned no-show ankle socks with a stay-put heel tab. 6 pairs per pack.',
        urlHandle: 'cushioned-no-show-ankle-socks-6-pack',
        seoKeywords: ['no-show socks', 'ankle socks', 'cushioned socks'],
        homeTemplate: 'default',
      },
    },

    50410: {
      product_id: 50410,
      name: 'Cross-Waist Flare Yoga Pants',
      summary: 'Flared yoga pants with a flattering crossover waistband. (Archived)',
      highlights: ['Crossover V-waistband', 'Buttery-soft brushed fabric', 'Flared bootcut leg'],
      description: 'A retired style kept for historical orders and reporting. Crossover waist with a wide flared leg.',
      detail: '<p>Archived product — hidden from all sales channels.</p>',
      cate_id: 12, category_label: 'Activewear / Leggings',
      product_spu: 'SPU-LEG-XFLARE',
      images: [{ uid: 'f1', name: 'front.jpg', url: IMG.flare, cover: true }],
      hasVariants: true, spec_type: 1,
      attr: [
        { value: 'Color', detail: [{ value: 'Black' }, { value: 'Mocha' }] },
        { value: 'Size', detail: [{ value: 'S' }, { value: 'M' }, { value: 'L' }, { value: 'XL' }] },
      ],
      attrValue: [
        { unique: 'V-XFLARE-BK-S', title: 'Black • S', image: IMG.flare, sku: 'LEG-XFLARE-BK-S', price: 41.0, ot_price: 46.0, cost: 16.0, stock: 0, weight: 230, bar_code_number: '0850003000010', is_show: 1, is_default_select: 1 },
        { unique: 'V-XFLARE-MC-M', title: 'Mocha • M', image: IMG.capri, sku: 'LEG-XFLARE-MC-M', price: 41.0, ot_price: 46.0, cost: 16.0, stock: 0, weight: 235, bar_code_number: '0850003000027', is_show: 1, is_default_select: 0 },
      ],
      price: 41.0, compareAtPrice: 46.0, itemCost: 16.0, sku: 'LEG-XFLARE', barcode: '0850003000010', inventoryQuantity: 0,
      params: [{ name: 'Inseam', single: '33 in' }, { name: 'Leg', single: 'Flared / bootcut' }],
      metafields: {
        shop: [{ key: 'status_note', type: 'Single line text', value: 'Retired Spring 2026' }],
        google: [{ key: 'gender', type: 'Single line text', value: 'Female' }],
      },
      settings: {
        activated: false, status: 'deactivated', spu: 'SPU-LEG-XFLARE', weight: 232, vendor_id: 4,
        category: 12, tags: ['archived', 'flare'], archived: true,
        metaTitle: 'Cross-Waist Flare Yoga Pants | Silix',
        metaDescription: 'Crossover-waist flared yoga pants with buttery-soft brushed fabric.',
        urlHandle: 'cross-waist-flare-yoga-pants',
        seoKeywords: ['flare yoga pants', 'crossover waist leggings'],
        homeTemplate: 'default',
      },
    },
  };

  // metafield type options (for editor selects)
  const METAFIELD_TYPES = ['Single line text', 'Multi-line text', 'Integer', 'Decimal', 'Boolean', 'URL', 'Date'];

  window.DATA_PRODUCTS = {
    TABS, SEARCH_FIELDS, SORT_OPTIONS, CATEGORIES, VENDORS, OPTION_NAMES, TEMPLATES,
    METAFIELD_TYPES, PRODUCTS, DETAILS,
  };
})();
