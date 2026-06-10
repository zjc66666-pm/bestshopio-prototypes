/* BestShopio Admin · Products prototype — sample data.
   Shaped after reference/bestvoy-admin .../products/type.ts + components/edit/*:
     - list rows  -> ProductInfo / ProductRecord
       (product_id, store_name, image, price_min/max, on_sale_stock, variant_count,
        inventory_status, is_show, is_del, spec_type)
     - detail/edit -> ProductDetail + ProductFormData + ProductSettings
     - metafields -> MetafieldGroup definitions (typed) + values map, by namespace
   No real PII / secrets. Money in store currency (USD $). */
(function () {
  // ---- Status filter tabs (list.tsx statusMap: All / Activated / Deactivated / Archived) ----
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

  // ---- Category tree (settings.tsx / TreeCascadeSelect; cate_id) ----
  // Flat list — used by the LIST view filter <select> ("Parent / Child" labels; parent value
  // includes its children). cate_id on products/details points at these leaf values.
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

  // Nested tree — used by the EDIT rail's cascading Category picker (TreeCascadeSelect):
  // top categories each show a child count + ">" and drill into subcategories. childrenCount is the
  // displayed badge; leaf rows (no children) select & close. Top-level mirrors the live admin
  // (Games and toys, School supplies, Clothes, Shoes, Accessories, Supplements, Babies & Kids);
  // the Clothes > Activewear / Shapewear and Accessories branches reuse the leaf IDs above so a
  // product's saved cate_id (e.g. 12, 32) resolves to a readable path.
  const CATEGORY_TREE = [
    { value: 100, label: 'Games and toys', children: [
      { value: 101, label: 'Board games' }, { value: 102, label: 'Puzzles' },
      { value: 103, label: 'Outdoor toys' }, { value: 104, label: 'Educational toys' },
    ] },
    { value: 110, label: 'School supplies', children: [
      { value: 111, label: 'Notebooks' }, { value: 112, label: 'Pens & pencils' },
      { value: 113, label: 'Backpacks' },
    ] },
    { value: 120, label: 'Clothes', children: [
      { value: 11, label: 'Activewear', children: [
        { value: 12, label: 'Leggings' }, { value: 13, label: 'Sports bras' },
        { value: 121, label: 'Tank tops' },
      ] },
      { value: 21, label: 'Shapewear', children: [
        { value: 22, label: 'Bodysuits' }, { value: 122, label: 'Briefs' }, { value: 123, label: 'Thongs' },
      ] },
      { value: 124, label: 'Dresses' }, { value: 125, label: 'Outerwear' },
    ] },
    { value: 130, label: 'Shoes', children: [
      { value: 131, label: 'Sneakers' }, { value: 132, label: 'Sandals' }, { value: 133, label: 'Boots' },
    ] },
    { value: 31, label: 'Accessories', children: [
      { value: 32, label: 'Socks' }, { value: 141, label: 'Hats' }, { value: 142, label: 'Bags' },
    ] },
    { value: 150, label: 'Supplements', children: [
      { value: 151, label: 'Protein' }, { value: 152, label: 'Vitamins' }, { value: 153, label: 'Pre-workout' },
    ] },
    { value: 160, label: 'Babies & Kids', children: [
      { value: 161, label: 'Clothing' }, { value: 162, label: 'Feeding' }, { value: 163, label: 'Strollers' },
    ] },
  ];

  // ---- Variant option name suggestions (Variants.tsx defaultOptions) ----
  const OPTION_NAMES = ['Color', 'Size', 'Material', 'Style'];

  // ---- Theme templates (settings.tsx templateOptions) ----
  const TEMPLATES = [
    { value: 'default', label: 'Default' },
    { value: 'one_page_checkout', label: 'One page checkout' },
  ];

  // ---- Media support text (AddImageVideo DEFAULT_SUPPORT_TEXT, utils/upload IMAGE/VIDEO_FILE_EXTENSIONS) ----
  // Mirrors the live admin's full extension lists verbatim.
  const IMAGE_EXTS = '.jpg, .jpeg, .png, .gif, .webp, .avif, .heic, .heif, .tiff, .tif, .bmp, .jfif, .svg, .ico';
  const VIDEO_EXTS = '.mp4, .avi, .wmv, .rm, .mpg, .mpeg, .mov, .flv, .swf, .mkv, .webm';
  const MEDIA_SUPPORT_TEXT =
    'Supports images in ' + IMAGE_EXTS + ' formats and videos in ' + VIDEO_EXTS +
    ' formats. Files smaller than 4MB work better, and .gif files shouldn’t be larger than 8MB. Maximum file size 10MB.';

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
  // a tiny inline mp4 placeholder is not feasible; videos in the mock are flagged with type:'video'
  // and rendered with a play overlay over a poster swatch.

  // inventory_status: 0 = in stock, 1 = out of stock, 2 = partial / some out of stock
  // spec_type: 1 = has variants, 0 = single
  const PRODUCTS = [
    { product_id: 50421, store_name: '3D Anti-Cellulite Compression Leggings', image: IMG.legging, cate_id: 12,
      price_min: 39.9, price_max: 49.9, on_sale_stock: 1280, variant_count: 12, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 1 },
    { product_id: 50420, store_name: 'High-Waist Pocket Sculpting Leggings', image: IMG.pocket, cate_id: 12,
      price_min: 42.0, price_max: 42.0, on_sale_stock: 64, variant_count: 9, inventory_status: 2,
      is_show: 1, is_del: 0, spec_type: 1 },
    { product_id: 50419, store_name: 'Graduated Compression Calf Sleeves', image: IMG.sleeve, cate_id: 11,
      price_min: 18.5, price_max: 18.5, on_sale_stock: 0, variant_count: 4, inventory_status: 1,
      is_show: 1, is_del: 0, spec_type: 1 },
    { product_id: 50418, store_name: 'Seamless Short Biker Leggings', image: IMG.short, cate_id: 12,
      price_min: 24.0, price_max: 29.0, on_sale_stock: 530, variant_count: 8, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 1 },
    { product_id: 50417, store_name: 'Butt-Lifting Capri Leggings', image: IMG.capri, cate_id: 12,
      price_min: 37.0, price_max: 37.0, on_sale_stock: 212, variant_count: 6, inventory_status: 0,
      is_show: 0, is_del: 0, spec_type: 1 },
    { product_id: 50416, store_name: 'Seamless Sculpting Briefs (3-Pack)', image: IMG.brief, cate_id: 21,
      price_min: 15.9, price_max: 15.9, on_sale_stock: 980, variant_count: 5, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 1 },
    { product_id: 50415, store_name: 'Lightweight Racerback Sports Bra', image: IMG.bra, cate_id: 13,
      price_min: 22.0, price_max: 26.0, on_sale_stock: 47, variant_count: 10, inventory_status: 2,
      is_show: 1, is_del: 0, spec_type: 1 },
    { product_id: 50414, store_name: 'Tummy-Control Shaping Bodysuit', image: IMG.bodysuit, cate_id: 22,
      price_min: 45.0, price_max: 52.0, on_sale_stock: 0, variant_count: 9, inventory_status: 1,
      is_show: 0, is_del: 0, spec_type: 1 },
    { product_id: 50413, store_name: 'Cushioned No-Show Ankle Socks (6-Pack)', image: IMG.sock, cate_id: 32,
      price_min: 12.0, price_max: 12.0, on_sale_stock: 3400, variant_count: 0, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 0 },
    { product_id: 50412, store_name: 'Classic High-Waist Yoga Leggings', image: IMG.waist, cate_id: 12,
      price_min: 34.0, price_max: 34.0, on_sale_stock: 760, variant_count: 12, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 1 },
    { product_id: 50411, store_name: 'Seamless Ribbed Tank Top', image: IMG.tank, cate_id: 11,
      price_min: 19.0, price_max: 19.0, on_sale_stock: 88, variant_count: 7, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 1 },
    { product_id: 50410, store_name: 'Cross-Waist Flare Yoga Pants', image: IMG.flare, cate_id: 12,
      price_min: 41.0, price_max: 46.0, on_sale_stock: 0, variant_count: 8, inventory_status: 1,
      is_show: 0, is_del: 1, spec_type: 1 },
    { product_id: 50409, store_name: 'No-Show Seamless Thong (5-Pack)', image: IMG.thong, cate_id: 21,
      price_min: 17.0, price_max: 17.0, on_sale_stock: 1240, variant_count: 5, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 1 },
    { product_id: 50408, store_name: 'Padded Longline Sports Bra', image: IMG.bra, cate_id: 13,
      price_min: 28.0, price_max: 32.0, on_sale_stock: 156, variant_count: 9, inventory_status: 2,
      is_show: 1, is_del: 0, spec_type: 1 },
    { product_id: 50407, store_name: 'Discontinued Mesh Panel Capris', image: IMG.capri, cate_id: 12,
      price_min: 33.0, price_max: 33.0, on_sale_stock: 0, variant_count: 6, inventory_status: 1,
      is_show: 0, is_del: 1, spec_type: 1 },
    { product_id: 50406, store_name: 'Compression Postpartum Support Shorts', image: IMG.short, cate_id: 12,
      price_min: 36.0, price_max: 36.0, on_sale_stock: 420, variant_count: 8, inventory_status: 0,
      is_show: 1, is_del: 0, spec_type: 1 },
  ];

  // ---------- Metafield definitions (MetafieldGroup / settings/metafields const) ----------
  // type values match EnumType: single_line_text, multi_line_text, number_integer,
  // number_decimal, boolean, url, choice_list, date, etc. Each def carries validation + a value.
  // Shop (custom namespace) product definitions
  const SHOP_PRODUCT_DEFS = [
    { metafield_definition_id: 'p-fabric-weight', namespace: 'custom', key: 'fabric_weight', name: 'Fabric weight', type: 'single_line_text', description: 'Knit weight in grams per square metre.', validation: { assignment_type: 'single_value', max_length: 40 } },
    { metafield_definition_id: 'p-fit-guide', namespace: 'custom', key: 'fit_guide', name: 'Fit guide', type: 'choice_list', description: 'Recommended fit relative to standard sizing.', validation: { selection_type: 'single', choices: ['Runs small', 'True to size', 'Runs large'] } },
    { metafield_definition_id: 'p-care', namespace: 'custom', key: 'care_instructions', name: 'Care instructions', type: 'multi_line_text', description: 'How to wash and care for this product.', validation: { max_length: 500 } },
    { metafield_definition_id: 'p-launched', namespace: 'custom', key: 'launch_date', name: 'Launch date', type: 'date', description: '', validation: {} },
    { metafield_definition_id: 'p-bestseller', namespace: 'custom', key: 'is_bestseller', name: 'Bestseller', type: 'boolean', description: 'Show a bestseller badge on the storefront.', validation: {} },
  ];
  // Google (google namespace) product definitions — feed / Shopping attributes
  const GOOGLE_PRODUCT_DEFS = [
    { metafield_definition_id: 'g-gender', namespace: 'google', key: 'gender', name: 'Gender', type: 'choice_list', description: 'Google Shopping gender attribute.', validation: { selection_type: 'single', choices: ['female', 'male', 'unisex'] } },
    { metafield_definition_id: 'g-age', namespace: 'google', key: 'age_group', name: 'Age group', type: 'choice_list', description: 'Google Shopping age group attribute.', validation: { selection_type: 'single', choices: ['newborn', 'infant', 'toddler', 'kids', 'adult'] } },
    { metafield_definition_id: 'g-material', namespace: 'google', key: 'material', name: 'Material', type: 'single_line_text', description: 'Primary material of the product.', validation: { assignment_type: 'single_value', max_length: 60 } },
    { metafield_definition_id: 'g-condition', namespace: 'google', key: 'condition', name: 'Condition', type: 'choice_list', description: '', validation: { selection_type: 'single', choices: ['new', 'refurbished', 'used'] } },
  ];
  // Variant-level definitions (custom + google) — used by the SKU-row metafields modal
  const SHOP_VARIANT_DEFS = [
    { metafield_definition_id: 'v-color-hex', namespace: 'custom', key: 'color_hex', name: 'Color hex', type: 'single_line_text', description: 'Swatch colour as a hex value.', validation: { assignment_type: 'single_value', max_length: 7 } },
    { metafield_definition_id: 'v-restock', namespace: 'custom', key: 'restock_eta', name: 'Restock ETA', type: 'date', description: '', validation: {} },
  ];
  const GOOGLE_VARIANT_DEFS = [
    { metafield_definition_id: 'gv-gtin', namespace: 'google', key: 'gtin', name: 'GTIN', type: 'single_line_text', description: 'Global Trade Item Number for this variant.', validation: { assignment_type: 'single_value', max_length: 14 } },
    { metafield_definition_id: 'gv-mpn', namespace: 'google', key: 'mpn', name: 'MPN', type: 'single_line_text', description: 'Manufacturer Part Number.', validation: { assignment_type: 'single_value', max_length: 40 } },
  ];

  // ---------- Full detail/edit records (ProductDetail + ProductFormData + ProductSettings) ----------
  // keyed by product_id. metafields hold a VALUES map per namespace, composite key `namespace:key`.
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
        { uid: 'i1', name: 'front.jpg', url: IMG.legging },
        { uid: 'i2', name: 'back.jpg', url: IMG.pocket },
        { uid: 'i3', name: 'detail.jpg', url: IMG.waist },
        { uid: 'i4', name: 'demo.mp4', url: IMG.short, type: 'video' },
      ],
      hasVariants: true, spec_type: 1,
      // options (attr) -> Variants.tsx
      attr: [
        { value: 'Color', detail: [{ pic: '', value: 'Black' }, { pic: '', value: 'Grey' }, { pic: '', value: 'Navy' }] },
        { value: 'Size', detail: [{ pic: '', value: 'S' }, { pic: '', value: 'M' }, { pic: '', value: 'L' }, { pic: '', value: 'XL' }] },
      ],
      // SKU rows (attrValue) -> SkuList.tsx; a representative subset of the 12 combos.
      // detail is an object {Color, Size}; getVariantTitle joins values with ' • '.
      attrValue: [
        { unique: 'V-3DAC-BK-S', detail: { Color: 'Black', Size: 'S' }, image: IMG.legging, bar_code: 'LEG-3DAC-BK-S', price: '39.90', ot_price: '49.90', cost: '14.20', stock: 120, weight: '180', bar_code_number: '0850001000011', is_show: 1, is_default_select: 1 },
        { unique: 'V-3DAC-BK-M', detail: { Color: 'Black', Size: 'M' }, image: IMG.legging, bar_code: 'LEG-3DAC-BK-M', price: '39.90', ot_price: '49.90', cost: '14.20', stock: 210, weight: '185', bar_code_number: '0850001000028', is_show: 1, is_default_select: 0 },
        { unique: 'V-3DAC-BK-L', detail: { Color: 'Black', Size: 'L' }, image: IMG.legging, bar_code: 'LEG-3DAC-BK-L', price: '42.90', ot_price: '49.90', cost: '14.60', stock: 175, weight: '190', bar_code_number: '0850001000035', is_show: 1, is_default_select: 0 },
        { unique: 'V-3DAC-GR-M', detail: { Color: 'Grey', Size: 'M' }, image: IMG.waist, bar_code: 'LEG-3DAC-GR-M', price: '39.90', ot_price: '49.90', cost: '14.20', stock: 96, weight: '185', bar_code_number: '0850001000042', is_show: 1, is_default_select: 0 },
        { unique: 'V-3DAC-GR-L', detail: { Color: 'Grey', Size: 'L' }, image: IMG.waist, bar_code: 'LEG-3DAC-GR-L', price: '42.90', ot_price: '49.90', cost: '14.60', stock: 88, weight: '190', bar_code_number: '0850001000059', is_show: 1, is_default_select: 0 },
        { unique: 'V-3DAC-NV-M', detail: { Color: 'Navy', Size: 'M' }, image: IMG.capri, bar_code: 'LEG-3DAC-NV-M', price: '39.90', ot_price: '49.90', cost: '14.20', stock: 60, weight: '185', bar_code_number: '0850001000066', is_show: 1, is_default_select: 0 },
        { unique: 'V-3DAC-NV-XL', detail: { Color: 'Navy', Size: 'XL' }, image: IMG.capri, bar_code: 'LEG-3DAC-NV-XL', price: '44.90', ot_price: '52.00', cost: '15.10', stock: 0, weight: '200', bar_code_number: '0850001000073', is_show: 0, is_default_select: 0 },
      ],
      // single-product price/inventory fallback (used when hasVariants=false)
      price: 39.9, compareAtPrice: 49.9, itemCost: 14.2, sku: 'LEG-3DAC', barcode: '0850001000011', inventoryQuantity: 1280,
      // product specifics (params) -> ProductSpecifics.tsx (name + single)
      params: [
        { name: 'Fabric', values: [], sort: 0, single: '78% Nylon, 22% Spandex' },
        { name: 'Rise', values: [], sort: 1, single: 'High waist' },
        { name: 'Care', values: [], sort: 2, single: 'Machine wash cold' },
      ],
      // metafields — VALUES map per namespace (composite key namespace:key)
      metafields: {
        custom: {
          'custom:fabric_weight': '240 gsm',
          'custom:fit_guide': 'True to size',
          'custom:care_instructions': 'Machine wash cold with like colours. Hang dry. Do not bleach or iron.',
          'custom:launch_date': '2026-01-15',
          'custom:is_bestseller': true,
        },
        google: {
          'google:gender': 'female',
          'google:age_group': 'adult',
          'google:material': 'Nylon / Spandex',
          'google:condition': 'new',
        },
      },
      // settings / right rail (ProductSettings) — NOTE: tags & collections are commented out in real admin
      settings: {
        activated: true, status: 'activated', spu: 'SPU-LEG-3DAC', weight: 185,
        category: 12,
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
        { uid: 's1', name: 'pack.jpg', url: IMG.sock },
        { uid: 's2', name: 'detail.jpg', url: IMG.tank },
      ],
      hasVariants: false, spec_type: 0,
      attr: [],
      attrValue: [
        { unique: 'V-SOCK6-OS', detail: { Title: 'Default' }, image: IMG.sock, bar_code: 'ACC-SOCK6', price: '12.00', ot_price: '16.00', cost: '3.40', stock: 3400, weight: '140', bar_code_number: '0850002000018', is_show: 1, is_default_select: 1 },
      ],
      price: 12.0, compareAtPrice: 16.0, itemCost: 3.4, sku: 'ACC-SOCK6', barcode: '0850002000018', inventoryQuantity: 3400,
      params: [
        { name: 'Pack size', values: [], sort: 0, single: '6 pairs' },
        { name: 'Fits', values: [], sort: 1, single: 'US 6 - 11' },
      ],
      metafields: {
        custom: {
          'custom:fabric_weight': '200 gsm',
          'custom:fit_guide': 'True to size',
          'custom:is_bestseller': true,
        },
        google: {
          'google:gender': 'unisex',
          'google:age_group': 'adult',
          'google:material': 'Combed cotton',
          'google:condition': 'new',
        },
      },
      settings: {
        activated: true, status: 'activated', spu: 'SPU-ACC-SOCK6', weight: 140,
        category: 32,
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
      images: [{ uid: 'f1', name: 'front.jpg', url: IMG.flare }],
      hasVariants: true, spec_type: 1,
      attr: [
        { value: 'Color', detail: [{ pic: '', value: 'Black' }, { pic: '', value: 'Mocha' }] },
        { value: 'Size', detail: [{ pic: '', value: 'S' }, { pic: '', value: 'M' }, { pic: '', value: 'L' }, { pic: '', value: 'XL' }] },
      ],
      attrValue: [
        { unique: 'V-XFLARE-BK-S', detail: { Color: 'Black', Size: 'S' }, image: IMG.flare, bar_code: 'LEG-XFLARE-BK-S', price: '41.00', ot_price: '46.00', cost: '16.00', stock: 0, weight: '230', bar_code_number: '0850003000010', is_show: 1, is_default_select: 1 },
        { unique: 'V-XFLARE-MC-M', detail: { Color: 'Mocha', Size: 'M' }, image: IMG.capri, bar_code: 'LEG-XFLARE-MC-M', price: '41.00', ot_price: '46.00', cost: '16.00', stock: 0, weight: '235', bar_code_number: '0850003000027', is_show: 1, is_default_select: 0 },
      ],
      price: 41.0, compareAtPrice: 46.0, itemCost: 16.0, sku: 'LEG-XFLARE', barcode: '0850003000010', inventoryQuantity: 0,
      params: [{ name: 'Inseam', values: [], sort: 0, single: '33 in' }, { name: 'Leg', values: [], sort: 1, single: 'Flared / bootcut' }],
      metafields: {
        custom: {
          'custom:fit_guide': 'True to size',
          'custom:care_instructions': 'Machine wash cold. Tumble dry low.',
        },
        google: {
          'google:gender': 'female',
          'google:condition': 'new',
        },
      },
      settings: {
        activated: false, status: 'deactivated', spu: 'SPU-LEG-XFLARE', weight: 232,
        category: 12, archived: true,
        metaTitle: 'Cross-Waist Flare Yoga Pants | Silix',
        metaDescription: 'Crossover-waist flared yoga pants with buttery-soft brushed fabric.',
        urlHandle: 'cross-waist-flare-yoga-pants',
        seoKeywords: ['flare yoga pants', 'crossover waist leggings'],
        homeTemplate: 'default',
      },
    },
  };

  // Enrich list rows with searchable identifiers (product_spu / sku / barcode / variant_id) so the
  // keyword-field search behaves realistically. Reuse the detail record's real values when present;
  // otherwise derive a stable code from the product name + id (mirrors the SPU-XXX / 0850… style).
  const abbr = (name) => name.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean)
    .slice(0, 2).map((w) => w.slice(0, 3).toUpperCase()).join('') || 'PRD';
  PRODUCTS.forEach((p) => {
    const d = DETAILS[p.product_id];
    const base = abbr(p.store_name);
    p.product_spu = (d && d.product_spu) || ('SPU-' + base + '-' + p.product_id);
    p.sku = (d && d.sku) || (base + '-' + p.product_id);
    p.barcode = (d && d.barcode) || ('0850' + String(p.product_id).padStart(9, '0'));
    p.variant_id = (d && d.attrValue && d.attrValue[0] && d.attrValue[0].unique) || ('V-' + p.product_id);
  });

  window.DATA_PRODUCTS = {
    TABS, SEARCH_FIELDS, CATEGORIES, CATEGORY_TREE, OPTION_NAMES, TEMPLATES,
    MEDIA_SUPPORT_TEXT, IMAGE_EXTS, VIDEO_EXTS,
    SHOP_PRODUCT_DEFS, GOOGLE_PRODUCT_DEFS, SHOP_VARIANT_DEFS, GOOGLE_VARIANT_DEFS,
    PRODUCTS, DETAILS,
  };
})();
