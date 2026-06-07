/* BestShopio Admin · Vendors prototype — sample data.
   Shaped after reference/bestvoy-admin .../products/type.ts
   (VendorListItem, VendorDetail, VendorFormState, VendorProductItem) and
   api/modules/admin/vendor.ts. Multi-vendor marketplace.
   Money is store currency (USD $). No real PII / secrets. */
(function () {
  // image helper — deterministic placeholder per seed (no external secrets)
  const img = (seed, s) => 'https://picsum.photos/seed/' + seed + '/' + (s || 80) + '/' + (s || 80);

  // ---- Search field select (search.tsx SEARCH_FIELD_OPTIONS) ----
  const SEARCH_FIELDS = [
    { label: 'Vendor name', value: 'name' },
    { label: 'Address',     value: 'address' },
  ];

  // ---- Status options (search.tsx SelectMulti + table.tsx STATUS_COLOR) ----
  // VendorStatus: 1 = Visible, 0 = Hidden
  const STATUS_OPTIONS = [
    { label: 'Visible', value: 1 },
    { label: 'Hidden',  value: 0 },
  ];

  // ---- Add-products picker search fields (products list search.tsx SEARCH_FIELD_OPTIONS subset) ----
  const PRODUCT_SEARCH_FIELDS = [
    { label: 'Product name', value: 'product_name' },
    { label: 'Product SPU',  value: 'product_spu' },
    { label: 'Product SKU',  value: 'product_sku' },
    { label: 'Product ID',   value: 'product_id' },
  ];

  // ---- Add-products picker status filter (AddProductsModal STATUS_OPTIONS) ----
  // 1 = Activated, 2 = Deactivated, 5 = Archived
  const PRODUCT_STATUS_OPTIONS = [
    { label: 'Activated',   value: 1 },
    { label: 'Deactivated', value: 2 },
    { label: 'Archived',    value: 5 },
  ];

  // ---- Sort orders for the Vendor products table (CollectionProductSortOrder) ----
  const SORT_ORDERS = [
    { label: 'Custom',          value: 'custom' },
    { label: 'Newest',          value: 'newest' },
    { label: 'Oldest',          value: 'oldest' },
    { label: 'Product title A-Z', value: 'product_title_az' },
    { label: 'Product title Z-A', value: 'product_title_za' },
    { label: 'Highest price',   value: 'highest_price' },
    { label: 'Lowest price',    value: 'lowest_price' },
  ];

  const TEMPLATES = ['Default'];

  // ---- Vendor list (VendorListItem: id, name, image, address, productCount, status) ----
  const VENDORS = [
    { id: 1,  name: 'Silix Official',        image: img('silix'),     address: '500 Terry Francois Blvd, San Francisco, CA 94158, United States', productCount: 64, status: 1 },
    { id: 2,  name: 'BumpBabe',              image: img('bumpbabe'),  address: '88 Collins Street, Melbourne, VIC 3000, Australia',                productCount: 37, status: 1 },
    { id: 3,  name: 'Folast Apparel',        image: img('folast'),    address: '12 Hoxton Square, London N1 6NT, United Kingdom',                  productCount: 51, status: 1 },
    { id: 4,  name: 'Lovocross',             image: img('lovocross'), address: '240 Rue de Rivoli, 75001 Paris, France',                           productCount: 28, status: 1 },
    { id: 5,  name: 'Minilizm Home',         image: img('minilizm'),  address: '1-7-1 Konan, Minato City, Tokyo 108-0075, Japan',                  productCount: 19, status: 0 },
    { id: 6,  name: 'NorthPeak Outdoors',    image: img('northpeak'), address: '1201 3rd Avenue, Seattle, WA 98101, United States',                productCount: 73, status: 1 },
    { id: 7,  name: 'Maison Lumiere',        image: img('maison'),    address: 'Friedrichstrasse 43, 10117 Berlin, Germany',                       productCount: 12, status: 1 },
    { id: 8,  name: 'CoastBrew Coffee',      image: '',               address: '45 Marina Boulevard, Singapore 018981',                            productCount: 8,  status: 0 },
    { id: 9,  name: 'PebblePets Supply',     image: img('pebble'),    address: '600 Bay Street, Toronto, ON M5G 1M6, Canada',                       productCount: 42, status: 1 },
    { id: 10, name: 'Aurora Skincare',       image: img('aurora'),    address: 'Gran Via 28, 28013 Madrid, Spain',                                 productCount: 24, status: 1 },
    { id: 11, name: 'Verdant Greens',        image: img('verdant'),   address: '350 Mission Street, San Francisco, CA 94105, United States',        productCount: 0,  status: 0 },
    { id: 12, name: 'Tidal Surfworks',       image: img('tidal'),     address: '17 Campbell Parade, Bondi Beach, NSW 2026, Australia',              productCount: 31, status: 1 },
    { id: 13, name: 'Kettle & Co.',          image: img('kettle'),    address: '78 Grafton Street, Dublin 2, D02 VK60, Ireland',                    productCount: 16, status: 1 },
    { id: 14, name: 'UrbanForge Gear',       image: img('urban'),     address: '233 South Wacker Drive, Chicago, IL 60606, United States',          productCount: 55, status: 1 },
    { id: 15, name: 'Petalworks Florals',    image: '',               address: 'Keizersgracht 123, 1015 CJ Amsterdam, Netherlands',                productCount: 9,  status: 0 },
  ];

  // ---- Product pool used by the picker modal + vendor detail (VendorProductItem / ProductInfo) ----
  // is_show 1 = Activated, is_del 1 = Archived, otherwise Deactivated.
  // `vendor.name` drives the picker's Vendor column ("in {name}"); products with no
  // vendor show "-". Products already in the open vendor render "in current vendor".
  const PRODUCT_POOL = [
    { product_id: 101, store_name: '3D Anti-Cellulite Leggings',    product_spu: 'SPU-AC101', product_sku: 'SLX-LEG-001', image: img('p101', 60), price_min: 29.9, price_max: 39.9, on_sale_stock: 1280, variant_count: 6, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, vendor: { name: 'Silix Official' } },
    { product_id: 102, store_name: 'Pocket Sculpting Leggings',     product_spu: 'SPU-PS102', product_sku: 'SLX-LEG-002', image: img('p102', 60), price_min: 34.0, price_max: 34.0, on_sale_stock: 940,  variant_count: 4, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, vendor: { name: 'Silix Official' } },
    { product_id: 103, store_name: 'Seamless Compression Briefs',   product_spu: 'SPU-CB103', product_sku: 'SLX-BRF-003', image: img('p103', 60), price_min: 18.5, price_max: 22.0, on_sale_stock: 0,    variant_count: 5, inventory_status: 1, spec_type: 1, is_show: 1, is_del: 0, vendor: { name: 'Silix Official' } },
    { product_id: 104, store_name: 'High-Waist Yoga Capris',        product_spu: 'SPU-YC104', product_sku: 'BMP-CAP-004', image: img('p104', 60), price_min: 27.0, price_max: 31.0, on_sale_stock: 56,   variant_count: 5, inventory_status: 2, spec_type: 1, is_show: 1, is_del: 0, vendor: { name: 'BumpBabe' } },
    { product_id: 105, store_name: 'Butt-Lifting Active Shorts',    product_spu: 'SPU-AS105', product_sku: 'SLX-SHT-005', image: img('p105', 60), price_min: 21.0, price_max: 25.0, on_sale_stock: 410,  variant_count: 4, inventory_status: 0, spec_type: 1, is_show: 0, is_del: 0, vendor: { name: 'Silix Official' } },
    { product_id: 106, store_name: 'Ribbed Sports Bra',            product_spu: 'SPU-SB106', product_sku: 'BMP-BRA-006', image: img('p106', 60), price_min: 19.9, price_max: 24.9, on_sale_stock: 730,  variant_count: 6, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, vendor: { name: 'BumpBabe' } },
    { product_id: 107, store_name: 'Quick-Dry Running Tee',         product_spu: 'SPU-RT107', product_sku: 'SLX-TEE-007', image: img('p107', 60), price_min: 16.0, price_max: 16.0, on_sale_stock: 0,    variant_count: 3, inventory_status: 1, spec_type: 1, is_show: 1, is_del: 0, vendor: { name: 'Silix Official' } },
    { product_id: 108, store_name: 'Merino Wool Beanie',            product_spu: 'SPU-MB108', product_sku: 'NPK-HAT-008', image: img('p108', 60), price_min: 24.0, price_max: 24.0, on_sale_stock: 220,  variant_count: 0, inventory_status: 0, spec_type: 0, is_show: 1, is_del: 0, vendor: { name: 'NorthPeak Outdoors' } },
    { product_id: 109, store_name: 'Insulated Trail Bottle 750ml',  product_spu: 'SPU-TB109', product_sku: 'NPK-BTL-009', image: img('p109', 60), price_min: 32.0, price_max: 38.0, on_sale_stock: 145,  variant_count: 3, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, vendor: { name: 'NorthPeak Outdoors' } },
    { product_id: 110, store_name: 'Organic Cotton Crew Socks',     product_spu: 'SPU-CS110', product_sku: 'NPK-SCK-010', image: img('p110', 60), price_min: 9.0,  price_max: 12.0, on_sale_stock: 1620, variant_count: 4, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, vendor: { name: 'NorthPeak Outdoors' } },
    { product_id: 111, store_name: 'Linen Throw Pillow Cover',      product_spu: 'SPU-PC111', product_sku: 'MNL-PIL-011', image: img('p111', 60), price_min: 14.0, price_max: 18.0, on_sale_stock: 0,    variant_count: 5, inventory_status: 1, spec_type: 1, is_show: 1, is_del: 1, vendor: { name: 'Maison Lumiere' } },
    { product_id: 112, store_name: 'Ceramic Pour-Over Dripper',     product_spu: 'SPU-PD112', product_sku: 'CBC-DRP-012', image: img('p112', 60), price_min: 26.0, price_max: 26.0, on_sale_stock: 88,   variant_count: 0, inventory_status: 0, spec_type: 0, is_show: 1, is_del: 0, vendor: { name: 'CoastBrew Coffee' } },
    { product_id: 113, store_name: 'Single-Origin Coffee Beans 1kg',product_spu: 'SPU-CB113', product_sku: 'CBC-BEAN-013', image: img('p113', 60), price_min: 22.0, price_max: 28.0, on_sale_stock: 300,  variant_count: 3, inventory_status: 0, spec_type: 1, is_show: 0, is_del: 0, vendor: { name: 'CoastBrew Coffee' } },
    { product_id: 114, store_name: 'Hydrating Vitamin C Serum',     product_spu: 'SPU-VS114', product_sku: 'AUR-SER-014', image: img('p114', 60), price_min: 39.0, price_max: 39.0, on_sale_stock: 510,  variant_count: 0, inventory_status: 0, spec_type: 0, is_show: 1, is_del: 0, vendor: { name: 'Aurora Skincare' } },
    { product_id: 115, store_name: 'Bamboo Pet Travel Bowl',        product_spu: 'SPU-PB115', product_sku: 'PBL-BWL-015', image: img('p115', 60), price_min: 11.0, price_max: 15.0, on_sale_stock: 0,    variant_count: 4, inventory_status: 1, spec_type: 1, is_show: 1, is_del: 0, vendor: { name: 'PebblePets Supply' } },
    { product_id: 116, store_name: 'Recycled Surf Board Bag',       product_spu: 'SPU-SB116', product_sku: 'TDL-BAG-016', image: img('p116', 60), price_min: 58.0, price_max: 72.0, on_sale_stock: 34,   variant_count: 3, inventory_status: 2, spec_type: 1, is_show: 1, is_del: 0, vendor: { name: 'Tidal Surfworks' } },
    { product_id: 117, store_name: 'Stainless Travel Tumbler',      product_spu: 'SPU-TT117', product_sku: 'NPK-TUM-017', image: img('p117', 60), price_min: 19.0, price_max: 23.0, on_sale_stock: 760,  variant_count: 5, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, vendor: { name: 'NorthPeak Outdoors' } },
    { product_id: 118, store_name: 'Waxed Canvas Tool Roll',        product_spu: 'SPU-TR118', product_sku: 'URB-ROL-018', image: img('p118', 60), price_min: 44.0, price_max: 44.0, on_sale_stock: 120,  variant_count: 0, inventory_status: 0, spec_type: 0, is_show: 1, is_del: 0, vendor: { name: 'UrbanForge Gear' } },
    { product_id: 119, store_name: 'Reusable Beeswax Food Wrap',    product_spu: 'SPU-FW119', product_sku: '', image: img('p119', 60), price_min: 13.0, price_max: 17.0, on_sale_stock: 240,  variant_count: 3, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0 },
    { product_id: 120, store_name: 'Cold Brew Glass Carafe',        product_spu: 'SPU-GC120', product_sku: '', image: img('p120', 60), price_min: 28.0, price_max: 28.0, on_sale_stock: 0,    variant_count: 0, inventory_status: 1, spec_type: 0, is_show: 1, is_del: 0 },
  ];

  // helper to attach a sort_order to a slice of the pool
  const withSort = (ids) => ids.map((pid, i) => {
    const p = PRODUCT_POOL.find((x) => x.product_id === pid);
    return Object.assign({}, p, { sort_order: i + 1 });
  });

  // ---- Vendor detail records (VendorDetail / VendorFormState) keyed by id ----
  const DETAILS = {
    1: {
      id: 1, name: 'Silix Official', address: '500 Terry Francois Blvd, San Francisco, CA 94158, United States',
      description: 'House brand for performance shapewear and activewear. All inventory is self-operated and fulfilled from the San Francisco warehouse.',
      image: img('silix'), status: 1,
      handle: 'silix-official',
      seoTitle: 'Silix Official — Performance Shapewear & Activewear',
      seoDescription: 'Shop Silix Official: sculpting leggings, compression briefs and seamless activewear engineered for everyday performance.',
      seoKeywords: ['shapewear', 'sculpting leggings', 'activewear', 'compression'],
      template: 'Default', sortOrder: 'custom',
      createdAt: '2025-03-14 09:21',
      products: withSort([101, 102, 103, 104, 105, 106, 107]),
    },
    2: {
      id: 2, name: 'BumpBabe', address: '88 Collins Street, Melbourne, VIC 3000, Australia',
      description: 'Maternity and postpartum essentials. Curated third-party vendor with a focus on soft, supportive fabrics.',
      image: img('bumpbabe'), status: 1,
      handle: 'bumpbabe',
      seoTitle: 'BumpBabe — Maternity & Postpartum Essentials',
      seoDescription: 'Comfortable maternity leggings, support bands and nursing-friendly basics from BumpBabe.',
      seoKeywords: ['maternity', 'postpartum', 'nursing'],
      template: 'Default', sortOrder: 'newest',
      createdAt: '2025-04-02 14:05',
      products: withSort([104, 106, 110, 102]),
    },
    6: {
      id: 6, name: 'NorthPeak Outdoors', address: '1201 3rd Avenue, Seattle, WA 98101, United States',
      description: 'Outdoor and trail gear vendor. Ships hydration, headwear and bags from the Pacific Northwest.',
      image: img('northpeak'), status: 1,
      handle: 'northpeak-outdoors',
      seoTitle: 'NorthPeak Outdoors — Trail & Hydration Gear',
      seoDescription: 'Insulated bottles, merino headwear and durable trail bags built for the backcountry.',
      seoKeywords: ['outdoor', 'hydration', 'trail gear', 'merino'],
      template: 'Default', sortOrder: 'custom',
      createdAt: '2025-02-19 11:48',
      products: withSort([108, 109, 117, 118, 110]),
    },
    11: {
      id: 11, name: 'Verdant Greens', address: '350 Mission Street, San Francisco, CA 94105, United States',
      description: 'Newly onboarded vendor. No products assigned yet — pending catalog upload.',
      image: img('verdant'), status: 0,
      handle: 'verdant-greens',
      seoTitle: 'Verdant Greens', seoDescription: '',
      seoKeywords: [],
      template: 'Default', sortOrder: 'custom',
      createdAt: '2026-05-28 16:32',
      products: [],
    },
  };

  // expose
  window.DATA_VENDORS = {
    SEARCH_FIELDS, STATUS_OPTIONS, SORT_ORDERS, TEMPLATES,
    PRODUCT_SEARCH_FIELDS, PRODUCT_STATUS_OPTIONS,
    VENDORS, PRODUCT_POOL, DETAILS,
    WEBSITE_DOMAIN: 'https://www.silix.com',
  };
})();
