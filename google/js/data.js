/* BestShopio Admin · Google (Merchant Center) prototype — sample data.
   Shaped after reference/bestvoy-admin google module:
     - ProductRecord (products table): product_id, store_name, image, submit_status,
       variant_stats {total, submitted, approved}, issues_stats {disapproved, demoted, not_impacted}, last_sync_time
     - VariantRecord (variants table): value_id, product_id, unique, sku, price, stock, image,
       detail {Option: value...}, submit_status, gmc_destinations {FREE_LISTINGS|SHOPPING_ADS|DISPLAY_ADS}
     - VariantDetail (variant edit): gmc_assembled_data (snake_case attrs) + gmc_destinations + submit_status
   submit_status enum: 0 All, 1 Unsubmitted, 2 Submitted, 3 Partial submitted, 4 Pending
   No real secrets. English-only copy. */
(function () {
  // small picsum-style placeholders keyed by seed (deterministic, offline-friendly fallback handled in app)
  const img = (seed) => 'https://picsum.photos/seed/bs-gmc-' + seed + '/80/80';

  // ---- status enum maps (mirror table.tsx statusNameMap / statusColorMap) ----
  const SUBMIT_STATUS = ['All', 'Unsubmitted', 'Submitted', 'Partial submitted', 'Pending'];

  // ---- products list (GMC sync status per product) ----
  const PRODUCTS = [
    { product_id: 80142, store_name: 'Aurora Linen Midi Dress',        image: img(1),  submit_status: 2, variant_stats: { total: 12, submitted: 12, approved: 11 }, issues_stats: { disapproved: 0, demoted: 1, not_impacted: 2 }, last_sync_time: 1749081600 },
    { product_id: 80143, store_name: 'Drift Merino Crew Knit',          image: img(2),  submit_status: 3, variant_stats: { total: 9,  submitted: 6,  approved: 4  }, issues_stats: { disapproved: 2, demoted: 0, not_impacted: 1 }, last_sync_time: 1749038400 },
    { product_id: 80144, store_name: 'Coastline Canvas Tote',           image: img(3),  submit_status: 2, variant_stats: { total: 3,  submitted: 3,  approved: 3  }, issues_stats: { disapproved: 0, demoted: 0, not_impacted: 0 }, last_sync_time: 1748952000 },
    { product_id: 80145, store_name: 'Nimbus Running Jacket',           image: img(4),  submit_status: 1, variant_stats: { total: 8,  submitted: 0,  approved: 0  }, issues_stats: { disapproved: 0, demoted: 0, not_impacted: 0 }, last_sync_time: 0 },
    { product_id: 80146, store_name: 'Sierra Hiking Backpack 28L',      image: img(5),  submit_status: 2, variant_stats: { total: 4,  submitted: 4,  approved: 2  }, issues_stats: { disapproved: 1, demoted: 1, not_impacted: 0 }, last_sync_time: 1749124800 },
    { product_id: 80147, store_name: 'Halcyon Ceramic Mug Set',         image: img(6),  submit_status: 3, variant_stats: { total: 6,  submitted: 4,  approved: 3  }, issues_stats: { disapproved: 0, demoted: 2, not_impacted: 1 }, last_sync_time: 1748908800 },
    { product_id: 80148, store_name: 'Vela Wireless Earbuds Pro',       image: img(7),  submit_status: 2, variant_stats: { total: 2,  submitted: 2,  approved: 2  }, issues_stats: { disapproved: 0, demoted: 0, not_impacted: 0 }, last_sync_time: 1749168000 },
    { product_id: 80149, store_name: 'Meadow Organic Cotton Tee',       image: img(8),  submit_status: 4, variant_stats: { total: 15, submitted: 9,  approved: 0  }, issues_stats: { disapproved: 0, demoted: 0, not_impacted: 0 }, last_sync_time: 1749211200 },
    { product_id: 80150, store_name: 'Onyx Leather Card Holder',        image: img(9),  submit_status: 1, variant_stats: { total: 5,  submitted: 0,  approved: 0  }, issues_stats: { disapproved: 0, demoted: 0, not_impacted: 0 }, last_sync_time: 0 },
    { product_id: 80151, store_name: 'Pebble Insulated Bottle 750ml',   image: img(10), submit_status: 2, variant_stats: { total: 7,  submitted: 7,  approved: 6  }, issues_stats: { disapproved: 0, demoted: 0, not_impacted: 3 }, last_sync_time: 1748865600 },
    { product_id: 80152, store_name: 'Lumen Desk Lamp (Warm)',          image: img(11), submit_status: 3, variant_stats: { total: 3,  submitted: 2,  approved: 1  }, issues_stats: { disapproved: 1, demoted: 0, not_impacted: 0 }, last_sync_time: 1748822400 },
    { product_id: 80153, store_name: 'Tundra Fleece Beanie',            image: img(12), submit_status: 2, variant_stats: { total: 10, submitted: 10, approved: 9  }, issues_stats: { disapproved: 0, demoted: 1, not_impacted: 0 }, last_sync_time: 1749254400 },
    { product_id: 80154, store_name: 'Cove Linen Throw Pillow',         image: img(13), submit_status: 1, variant_stats: { total: 6,  submitted: 0,  approved: 0  }, issues_stats: { disapproved: 0, demoted: 0, not_impacted: 0 }, last_sync_time: 0 },
    { product_id: 80155, store_name: 'Atlas Travel Packing Cubes',      image: img(14), submit_status: 2, variant_stats: { total: 4,  submitted: 4,  approved: 4  }, issues_stats: { disapproved: 0, demoted: 0, not_impacted: 1 }, last_sync_time: 1748779200 },
  ];

  // ---- destination cell builder (mirrors gmc_destinations shape) ----
  // status: Approved | Pending | Disapproved ; severity of itemLevelIssues: DISAPPROVED | DEMOTED | NOT_IMPACTED
  const dest = (status, issues) => {
    const out = { destinationStatuses: status };
    if (issues && issues.length) out.itemLevelIssues = issues;
    return out;
  };
  const issue = (severity, description, opts) => Object.assign({
    code: (opts && opts.code) || 'generic_issue',
    severity, description,
    resolution: (opts && opts.resolution) || 'merchant_action',
    attribute: (opts && opts.attribute) || '',
    reportingContext: (opts && opts.reportingContext) || 'SHOPPING_ADS',
  }, {});

  // ---- variants per product (only a few products carry a full variant list; others fall back) ----
  // Aurora Linen Midi Dress (80142) — Submitted, mixed destination health
  const VARIANTS = {
    80142: [
      {
        value_id: 510201, product_id: 80142, unique: 'gmc-510201', sku: 'AUR-DRS-XS-SAGE', price: '89.00', stock: 14, image: img(101),
        detail: { Size: 'XS', Color: 'Sage' }, submit_status: 2,
        gmc_destinations: {
          FREE_LISTINGS: dest('Approved'),
          SHOPPING_ADS: dest('Approved'),
          DISPLAY_ADS: dest('Approved'),
        },
      },
      {
        value_id: 510202, product_id: 80142, unique: 'gmc-510202', sku: 'AUR-DRS-S-SAGE', price: '89.00', stock: 22, image: img(102),
        detail: { Size: 'S', Color: 'Sage' }, submit_status: 2,
        gmc_destinations: {
          FREE_LISTINGS: dest('Approved'),
          SHOPPING_ADS: dest('Approved', [issue('DEMOTED', 'Image too small [image link]', { code: 'image_link_too_small', attribute: 'image_link' })]),
          DISPLAY_ADS: dest('Approved'),
        },
      },
      {
        value_id: 510203, product_id: 80142, unique: 'gmc-510203', sku: 'AUR-DRS-M-CLAY', price: '89.00', stock: 8, image: img(103),
        detail: { Size: 'M', Color: 'Clay' }, submit_status: 2,
        gmc_destinations: {
          FREE_LISTINGS: dest('Approved'),
          SHOPPING_ADS: dest('Approved'),
          DISPLAY_ADS: dest('Pending'),
        },
      },
      {
        value_id: 510204, product_id: 80142, unique: 'gmc-510204', sku: 'AUR-DRS-L-CLAY', price: '89.00', stock: 0, image: img(104),
        detail: { Size: 'L', Color: 'Clay' }, submit_status: 2,
        gmc_destinations: {
          FREE_LISTINGS: dest('Disapproved', [issue('DISAPPROVED', 'Missing value [GTIN]', { code: 'missing_gtin', attribute: 'gtin', reportingContext: 'FREE_LISTINGS' })]),
          SHOPPING_ADS: dest('Disapproved', [issue('DISAPPROVED', 'Missing value [GTIN]', { code: 'missing_gtin', attribute: 'gtin' })]),
          DISPLAY_ADS: dest('Approved'),
        },
      },
      {
        value_id: 510205, product_id: 80142, unique: 'gmc-510205', sku: 'AUR-DRS-XL-NAVY', price: '94.00', stock: 5, image: img(105),
        detail: { Size: 'XL', Color: 'Navy' }, submit_status: 4,
        gmc_destinations: {
          FREE_LISTINGS: dest('Pending'),
          SHOPPING_ADS: dest('Pending'),
          DISPLAY_ADS: dest('Pending'),
        },
      },
    ],
    // Drift Merino Crew Knit (80143) — Partial submitted
    80143: [
      {
        value_id: 510301, product_id: 80143, unique: 'gmc-510301', sku: 'DRF-KNT-S-OAT', price: '120.00', stock: 18, image: img(111),
        detail: { Size: 'S', Color: 'Oatmeal' }, submit_status: 2,
        gmc_destinations: {
          FREE_LISTINGS: dest('Approved'),
          SHOPPING_ADS: dest('Approved'),
          DISPLAY_ADS: dest('Approved'),
        },
      },
      {
        value_id: 510302, product_id: 80143, unique: 'gmc-510302', sku: 'DRF-KNT-M-OAT', price: '120.00', stock: 12, image: img(112),
        detail: { Size: 'M', Color: 'Oatmeal' }, submit_status: 2,
        gmc_destinations: {
          FREE_LISTINGS: dest('Approved', [issue('NOT_IMPACTED', 'Limited performance due to missing value [color]', { code: 'missing_color', severity: 'NOT_IMPACTED', attribute: 'color' })]),
          SHOPPING_ADS: dest('Approved'),
          DISPLAY_ADS: dest('Approved'),
        },
      },
      {
        value_id: 510303, product_id: 80143, unique: 'gmc-510303', sku: 'DRF-KNT-L-FOREST', price: '120.00', stock: 3, image: img(113),
        detail: { Size: 'L', Color: 'Forest' }, submit_status: 2,
        gmc_destinations: {
          FREE_LISTINGS: dest('Disapproved', [issue('DISAPPROVED', 'Mismatched value (page crawl) [price]', { code: 'mismatched_price', attribute: 'price', reportingContext: 'FREE_LISTINGS' })]),
          SHOPPING_ADS: dest('Disapproved', [issue('DISAPPROVED', 'Mismatched value (page crawl) [price]', { code: 'mismatched_price', attribute: 'price' })]),
          DISPLAY_ADS: dest('Disapproved', [issue('DISAPPROVED', 'Mismatched value (page crawl) [price]', { code: 'mismatched_price', attribute: 'price', reportingContext: 'DISPLAY_ADS' })]),
        },
      },
      {
        value_id: 510304, product_id: 80143, unique: 'gmc-510304', sku: 'DRF-KNT-XL-FOREST', price: '124.00', stock: 7, image: img(114),
        detail: { Size: 'XL', Color: 'Forest' }, submit_status: 1,
      },
      {
        value_id: 510305, product_id: 80143, unique: 'gmc-510305', sku: 'DRF-KNT-S-CHARCOAL', price: '120.00', stock: 9, image: img(115),
        detail: { Size: 'S', Color: 'Charcoal' }, submit_status: 1,
      },
    ],
    // Coastline Canvas Tote (80144) — fully approved
    80144: [
      {
        value_id: 510401, product_id: 80144, unique: 'gmc-510401', sku: 'CST-TOT-NAT', price: '48.00', stock: 40, image: img(121),
        detail: { Color: 'Natural' }, submit_status: 2,
        gmc_destinations: { FREE_LISTINGS: dest('Approved'), SHOPPING_ADS: dest('Approved'), DISPLAY_ADS: dest('Approved') },
      },
      {
        value_id: 510402, product_id: 80144, unique: 'gmc-510402', sku: 'CST-TOT-BLK', price: '48.00', stock: 35, image: img(122),
        detail: { Color: 'Black' }, submit_status: 2,
        gmc_destinations: { FREE_LISTINGS: dest('Approved'), SHOPPING_ADS: dest('Approved'), DISPLAY_ADS: dest('Approved') },
      },
      {
        value_id: 510403, product_id: 80144, unique: 'gmc-510403', sku: 'CST-TOT-OLV', price: '52.00', stock: 28, image: img(123),
        detail: { Color: 'Olive' }, submit_status: 2,
        gmc_destinations: { FREE_LISTINGS: dest('Approved'), SHOPPING_ADS: dest('Approved'), DISPLAY_ADS: dest('Approved') },
      },
    ],
    // Nimbus Running Jacket (80145) — unsubmitted
    80145: [
      { value_id: 510501, product_id: 80145, unique: 'gmc-510501', sku: 'NMB-JKT-S-BLK', price: '149.00', stock: 11, image: img(131), detail: { Size: 'S', Color: 'Black' }, submit_status: 1 },
      { value_id: 510502, product_id: 80145, unique: 'gmc-510502', sku: 'NMB-JKT-M-BLK', price: '149.00', stock: 14, image: img(132), detail: { Size: 'M', Color: 'Black' }, submit_status: 1 },
      { value_id: 510503, product_id: 80145, unique: 'gmc-510503', sku: 'NMB-JKT-L-SLATE', price: '149.00', stock: 6, image: img(133), detail: { Size: 'L', Color: 'Slate' }, submit_status: 1 },
      { value_id: 510504, product_id: 80145, unique: 'gmc-510504', sku: 'NMB-JKT-XL-SLATE', price: '149.00', stock: 4, image: img(134), detail: { Size: 'XL', Color: 'Slate' }, submit_status: 1 },
    ],
  };

  // ---- full variant detail records (gmc_assembled_data) keyed by unique ----
  // shape mirrors format.tsx formatGmcData(): snake_case attributes + nested shipping
  const mkDetail = (over) => Object.assign({
    submit_status: 2,
    detail: {},
    gmc_destinations: {
      FREE_LISTINGS: dest('Approved'),
      SHOPPING_ADS: dest('Approved'),
      DISPLAY_ADS: dest('Approved'),
    },
    gmc_assembled_data: {
      // Basic information
      name: 'products/online:en:US:gmc-510202',
      version_number: '7',
      offer_id: 'gmc-510202',
      item_group_id: '80142',
      content_language: 'en',
      feed_label: 'US',
      // Basic product data
      title: 'Aurora Linen Midi Dress - S / Sage',
      description: 'Breathable 100% European flax linen midi dress with a relaxed A-line silhouette, side seam pockets and a covered back zip. Pre-washed for a soft, lived-in feel.',
      link: 'https://silix.example/products/aurora-linen-midi-dress?variant=510202',
      image_link: 'https://picsum.photos/seed/bs-gmc-102/800/800',
      additional_image_links: [
        'https://picsum.photos/seed/bs-gmc-102a/800/800',
        'https://picsum.photos/seed/bs-gmc-102b/800/800',
      ],
      model3d_link: '',
      mobile_link: 'https://m.silix.example/products/aurora-linen-midi-dress?variant=510202',
      canonical_link: 'https://silix.example/products/aurora-linen-midi-dress',
      structured_title_digital_source_type: 'trained_algorithmic_media',
      structured_description_digital_source_type: 'default',
      // Price and availability
      availability: 'in_stock',
      availability_date: '',
      cost_price: '38.00',
      price: '89.00',
      price_currency: 'USD',
      sale_price: '75.00',
      sale_price_effective_date: '2026-06-01T00:00:00Z/2026-06-15T23:59:59Z',
      expiration_date: '2026-09-01',
      auto_pricing_min_price: '69.00',
      sell_on_google_quantity: '22',
      // Product category
      google_product_category: 'Apparel & Accessories > Clothing > Dresses',
      product_types: ['Home > Women > Dresses > Linen'],
      // Product identifiers
      brand: 'Aurora',
      gtin: '0840391150027',
      mpn: 'AUR-DRS-S-SAGE',
      identifier_exists: 'true',
      // Detailed product description
      condition: 'new',
      adult: 'false',
      bundle: 'false',
      multipack: '0',
      color: 'Sage',
      material: 'Linen',
      size: 'S',
      age_group: 'adult',
      gender: 'female',
      pattern: 'Solid',
      size_system: 'US',
      size_type: 'regular',
      product_length: '0',
      product_width: '0',
      product_height: '0',
      product_weight: '320',
      product_highlights: [
        '100% European flax linen, OEKO-TEX certified',
        'Hidden side seam pockets',
        'Machine washable, cold',
      ],
      // Shopping campaigns
      ads_redirect: '',
      custom_label_0: 'SS26-core',
      custom_label_1: 'margin-high',
      custom_label_2: 'restock-weekly',
      custom_label_3: '',
      custom_label_4: '',
      promotion_id: 'SUMMER15',
      lifestyle_image_links: ['https://picsum.photos/seed/bs-gmc-102c/1200/800'],
      // Destinations
      excluded_destination: [],
      included_destination: ['shopping_ads', 'free_listings', 'display_ads'],
      pause: 'No',
      // Shipping
      shipping: {
        price: '0',
        price_currency: 'USD',
        country: 'US',
        region: 'CA',
        service: 'Standard (3-5 business days)',
        location_id: '1014044',
        location_group_name: 'US-lower-48',
        postal_code: '',
        min_handling_time: '1',
        max_handling_time: '2',
        min_transit_time: '3',
        max_transit_time: '5',
        shipping_label: 'apparel-light',
        shipping_weight: '320',
        shipping_length: '32',
        shipping_width: '24',
        shipping_height: '4',
        free_shipping_threshold: '75',
      },
    },
  }, over || {});

  const DETAILS = {
    // Approved variant (full)
    'gmc-510202': mkDetail(),
    // Disapproved variant — shows red destination cards + issues, no "View raw data" suppressed (still submitted)
    'gmc-510204': mkDetail({
      submit_status: 2,
      detail: { Size: 'L', Color: 'Clay' },
      gmc_destinations: {
        FREE_LISTINGS: dest('Disapproved', [issue('DISAPPROVED', 'Missing value [GTIN]', { code: 'missing_gtin', attribute: 'gtin', reportingContext: 'FREE_LISTINGS' })]),
        SHOPPING_ADS: dest('Disapproved', [issue('DISAPPROVED', 'Missing value [GTIN]', { code: 'missing_gtin', attribute: 'gtin' })]),
        DISPLAY_ADS: dest('Approved'),
      },
      gmc_assembled_data: Object.assign({}, mkDetail().gmc_assembled_data, {
        offer_id: 'gmc-510204', name: 'products/online:en:US:gmc-510204',
        title: 'Aurora Linen Midi Dress - L / Clay',
        image_link: 'https://picsum.photos/seed/bs-gmc-104/800/800',
        color: 'Clay', size: 'L', mpn: 'AUR-DRS-L-CLAY',
        gtin: '', identifier_exists: 'false',
        availability: 'out_of_stock', sell_on_google_quantity: '0',
      }),
    }),
    // Pending variant
    'gmc-510205': mkDetail({
      submit_status: 4,
      detail: { Size: 'XL', Color: 'Navy' },
      gmc_destinations: {
        FREE_LISTINGS: dest('Pending'),
        SHOPPING_ADS: dest('Pending'),
        DISPLAY_ADS: dest('Pending'),
      },
      gmc_assembled_data: Object.assign({}, mkDetail().gmc_assembled_data, {
        offer_id: 'gmc-510205', name: 'products/online:en:US:gmc-510205',
        title: 'Aurora Linen Midi Dress - XL / Navy', price: '94.00',
        image_link: 'https://picsum.photos/seed/bs-gmc-105/800/800',
        color: 'Navy', size: 'XL', mpn: 'AUR-DRS-XL-NAVY', gtin: '0840391150058',
      }),
    }),
    // Another approved variant from a different product
    'gmc-510401': mkDetail({
      detail: { Color: 'Natural' },
      gmc_assembled_data: Object.assign({}, mkDetail().gmc_assembled_data, {
        offer_id: 'gmc-510401', name: 'products/online:en:US:gmc-510401', item_group_id: '80144',
        title: 'Coastline Canvas Tote - Natural', price: '48.00', sale_price: '',
        sale_price_effective_date: '', promotion_id: '',
        image_link: 'https://picsum.photos/seed/bs-gmc-121/800/800',
        google_product_category: 'Apparel & Accessories > Handbags, Wallets & Cases > Handbags',
        product_types: ['Home > Bags > Totes'],
        brand: 'Coastline', color: 'Natural', size: '', material: 'Cotton canvas',
        age_group: 'adult', gender: 'unisex', mpn: 'CST-TOT-NAT', gtin: '0840391150300',
        product_weight: '410', custom_label_0: 'evergreen', custom_label_1: 'margin-mid',
      }),
    }),
  };

  // ---- raw data JSON (variantsRawData.vue product_attributes) keyed by unique ----
  // the real viewer JSON.parses data.product_attributes; we store the parsed object directly.
  const RAW_DATA = {
    'gmc-510202': {
      id: 'online:en:US:gmc-510202',
      offerId: 'gmc-510202',
      title: 'Aurora Linen Midi Dress - S / Sage',
      description: 'Breathable 100% European flax linen midi dress with a relaxed A-line silhouette.',
      link: 'https://silix.example/products/aurora-linen-midi-dress?variant=510202',
      imageLink: 'https://picsum.photos/seed/bs-gmc-102/800/800',
      contentLanguage: 'en',
      targetCountry: 'US',
      feedLabel: 'US',
      channel: 'online',
      availability: 'in stock',
      condition: 'new',
      brand: 'Aurora',
      gtin: '0840391150027',
      mpn: 'AUR-DRS-S-SAGE',
      googleProductCategory: 'Apparel & Accessories > Clothing > Dresses',
      itemGroupId: '80142',
      color: 'Sage',
      size: 'S',
      ageGroup: 'adult',
      gender: 'female',
      material: 'Linen',
      price: { value: '89.00', currency: 'USD' },
      salePrice: { value: '75.00', currency: 'USD' },
      salePriceEffectiveDate: '2026-06-01T00:00:00Z/2026-06-15T23:59:59Z',
      shipping: [
        { country: 'US', service: 'Standard (3-5 business days)', price: { value: '0.00', currency: 'USD' }, minHandlingTime: '1', maxHandlingTime: '2', minTransitTime: '3', maxTransitTime: '5' },
      ],
      shippingWeight: { value: '320', unit: 'g' },
      customLabel0: 'SS26-core',
      customLabel1: 'margin-high',
      productHighlights: [
        '100% European flax linen, OEKO-TEX certified',
        'Hidden side seam pockets',
        'Machine washable, cold',
      ],
    },
    'gmc-510401': {
      id: 'online:en:US:gmc-510401',
      offerId: 'gmc-510401',
      title: 'Coastline Canvas Tote - Natural',
      link: 'https://silix.example/products/coastline-canvas-tote?variant=510401',
      imageLink: 'https://picsum.photos/seed/bs-gmc-121/800/800',
      contentLanguage: 'en',
      targetCountry: 'US',
      feedLabel: 'US',
      channel: 'online',
      availability: 'in stock',
      condition: 'new',
      brand: 'Coastline',
      gtin: '0840391150300',
      mpn: 'CST-TOT-NAT',
      googleProductCategory: 'Apparel & Accessories > Handbags, Wallets & Cases > Handbags',
      itemGroupId: '80144',
      color: 'Natural',
      material: 'Cotton canvas',
      price: { value: '48.00', currency: 'USD' },
      shipping: [
        { country: 'US', service: 'Standard (3-5 business days)', price: { value: '0.00', currency: 'USD' } },
      ],
      shippingWeight: { value: '410', unit: 'g' },
    },
  };

  // ---- account header context (GMC linkage) ----
  const ACCOUNT = {
    merchant_id: '5093817642',
    account_name: 'Silix Storefront',
    feed_label: 'US',
    content_language: 'en',
    website_claimed: true,
    last_full_sync: '2026-06-05 08:00 UTC',
  };

  // keyword/range filter option sets (mirror search.tsx)
  const PRODUCT_KEYWORD_OPTIONS = [
    { value: 'product_name', label: 'Product name' },
    { value: 'product_id', label: 'Product ID' },
    { value: 'variant_id', label: 'Variant ID' },
  ];
  const VARIANT_KEYWORD_OPTIONS = [
    { value: 'variant', label: 'Variant' },
    { value: 'variant_id', label: 'Variant ID' },
  ];

  const PRODUCT_TABS = [
    { key: 0, label: 'All' },
    { key: 1, label: 'Unsubmitted' },
    { key: 2, label: 'Submitted' },
    { key: 3, label: 'Partial submitted' },
  ];
  const VARIANT_TABS = [
    { key: 0, label: 'All' },
    { key: 1, label: 'Unsubmitted' },
    { key: 2, label: 'Submitted' },
    { key: 4, label: 'Pending' },
  ];

  // Build a full variant-detail record on the fly from a variant's base meta, so EVERY
  // variant opens a real detail page (DETAILS only carries a few hand-authored ones).
  function buildDetail(meta) {
    if (!meta) return null;
    const prod = PRODUCTS.find((p) => p.product_id === meta.product_id) || {};
    const opts = meta.detail || {};
    const optStr = Object.values(opts).join(' / ');
    const inStock = Number(meta.stock || 0) > 0;
    return mkDetail({
      submit_status: meta.submit_status != null ? meta.submit_status : 2,
      detail: opts,
      gmc_destinations: meta.gmc_destinations || {
        FREE_LISTINGS: dest('Approved'), SHOPPING_ADS: dest('Approved'), DISPLAY_ADS: dest('Approved'),
      },
      gmc_assembled_data: Object.assign({}, mkDetail().gmc_assembled_data, {
        name: 'products/online:en:US:' + meta.unique,
        offer_id: meta.unique,
        item_group_id: String(meta.product_id),
        title: (prod.store_name || 'Product') + (optStr ? ' - ' + optStr : ''),
        link: 'https://silix.example/products/' + meta.product_id + '?variant=' + meta.value_id,
        image_link: meta.image || '',
        additional_image_links: [],
        mobile_link: '', model3d_link: '',
        mpn: meta.sku || '',
        gtin: '', identifier_exists: 'false',
        price: meta.price || '', sale_price: '', sale_price_effective_date: '', promotion_id: '',
        sell_on_google_quantity: String(meta.stock != null ? meta.stock : '0'),
        availability: inStock ? 'in_stock' : 'out_of_stock',
        color: opts.Color || '', size: opts.Size || '',
      }),
    });
  }

  window.DATA_GOOGLE = {
    SUBMIT_STATUS,
    PRODUCTS,
    VARIANTS,
    DETAILS,
    buildDetail,
    RAW_DATA,
    ACCOUNT,
    PRODUCT_KEYWORD_OPTIONS,
    VARIANT_KEYWORD_OPTIONS,
    PRODUCT_TABS,
    VARIANT_TABS,
  };
})();
