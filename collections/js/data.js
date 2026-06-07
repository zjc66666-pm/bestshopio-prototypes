/* BestShopio Admin · Collections prototype — sample data.
   Shaped after reference/bestvoy-admin .../products/type.ts:
     CollectionInfo, CollectionRecord, CollectionProductListItem,
     CollectionSubCollectionItem, CollectionProductSortOrder
   and api/modules/admin/collections.ts (lst / detail / product_lst / sub_collection_lst).
   Money is in store currency (USD $). No real PII / secrets. */
(function () {
  // ---- Product sort-order options (CollectionProductSortOrder enum + SORT_ORDER_LABELS) ----
  const SORT_ORDERS = [
    { value: 'custom',           label: 'Custom' },
    { value: 'newest',          label: 'Newest' },
    { value: 'oldest',          label: 'Oldest' },
    { value: 'product_title_az', label: 'Product title A-Z' },
    { value: 'product_title_za', label: 'Product title Z-A' },
    { value: 'highest_price',   label: 'Highest price' },
    { value: 'lowest_price',    label: 'Lowest price' },
  ];

  // ---- Search-field options (search.tsx — only Collection name is supported) ----
  const SEARCH_FIELDS = [{ value: 'name', label: 'Collection name' }];

  // ---- Product-picker search fields (ProductSelect.tsx SEARCH_FIELD_OPTIONS) ----
  const PRODUCT_SEARCH_FIELDS = [
    { value: 'product_name', label: 'Product name' },
    { value: 'product_spu',  label: 'Product SPU' },
    { value: 'product_sku',  label: 'Product SKU' },
    { value: 'barcode',      label: 'Product barcode' },
    { value: 'product_id',   label: 'Product ID' },
    { value: 'variant_id',   label: 'Variant ID' },
  ];

  // ---- Theme templates (Theme template card) ----
  const TEMPLATES = [{ value: 'default', label: 'Default' }];

  // ---- Category options (ProductSelect.tsx TreeCascadeSelect; flattened "Parent / Child" labels for the prototype) ----
  const CATEGORIES = [
    { value: 11, label: 'Apparel / Tops' },
    { value: 12, label: 'Apparel / Knitwear' },
    { value: 13, label: 'Apparel / Bottoms' },
    { value: 14, label: 'Apparel / Outerwear' },
    { value: 21, label: 'Footwear / Sneakers' },
    { value: 31, label: 'Accessories / Bags' },
    { value: 32, label: 'Accessories / Small leather goods' },
    { value: 33, label: 'Accessories / Headwear' },
    { value: 34, label: 'Accessories / Eyewear' },
    { value: 41, label: 'Home & Living / Kitchen' },
    { value: 51, label: 'Outdoor & Travel / Drinkware' },
    { value: 52, label: 'Outdoor & Travel / Packs' },
  ];

  // small inline image data-uris keep the prototype offline + light.
  // solid-tone swatches stand in for product / collection cover images.
  const sw = (hex) =>
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="' + hex + '"/></svg>'
    );

  // ================= LIST: collections =================
  // CollectionInfo-shaped rows (id, name, image_url, type='manual', product_count, handle, create_time)
  const COLLECTIONS = [
    { id: 0, name: 'Best Sellers',        handle: 'best-sellers',        image_url: sw('#2563eb'), type: 'manual', product_count: 48, create_time: '2026-05-28 09:14' },
    { id: 0, name: 'New Arrivals',        handle: 'new-arrivals',        image_url: sw('#0ea5a4'), type: 'manual', product_count: 36, create_time: '2026-05-30 16:02' },
    { id: 0, name: 'Summer Collection',   handle: 'summer-collection',   image_url: sw('#f59e0b'), type: 'manual', product_count: 27, create_time: '2026-05-21 11:48' },
    { id: 0, name: 'Under $50',           handle: 'under-50',            image_url: sw('#7c3aed'), type: 'manual', product_count: 64, create_time: '2026-05-12 08:30' },
    { id: 0, name: "Men's Apparel",       handle: 'mens-apparel',        image_url: sw('#1f2937'), type: 'manual', product_count: 52, create_time: '2026-04-30 14:11' },
    { id: 0, name: "Women's Apparel",     handle: 'womens-apparel',      image_url: sw('#db2777'), type: 'manual', product_count: 58, create_time: '2026-04-30 14:09' },
    { id: 0, name: 'Footwear',            handle: 'footwear',            image_url: sw('#b45309'), type: 'manual', product_count: 31, create_time: '2026-05-04 10:22' },
    { id: 0, name: 'Accessories',         handle: 'accessories',         image_url: sw('#0891b2'), type: 'manual', product_count: 44, create_time: '2026-05-06 19:37' },
    { id: 0, name: 'Staff Picks',         handle: 'staff-picks',         image_url: sw('#16a34a'), type: 'manual', product_count: 12, create_time: '2026-05-18 13:05' },
    { id: 0, name: 'Clearance',           handle: 'clearance',           image_url: '',            type: 'manual', product_count: 73, create_time: '2026-03-29 07:51' },
    { id: 0, name: 'Eco-Friendly',        handle: 'eco-friendly',        image_url: sw('#4d7c0f'), type: 'manual', product_count: 19, create_time: '2026-05-09 09:44' },
    { id: 0, name: 'Gift Ideas',          handle: 'gift-ideas',          image_url: sw('#9333ea'), type: 'manual', product_count: 23, create_time: '2026-05-24 15:28' },
    { id: 0, name: 'Outdoor & Travel',    handle: 'outdoor-travel',      image_url: sw('#0369a1'), type: 'manual', product_count: 38, create_time: '2026-04-18 12:16' },
    { id: 0, name: 'Home & Living',       handle: 'home-living',         image_url: sw('#be123c'), type: 'manual', product_count: 41, create_time: '2026-04-22 17:03' },
  ].map((c, i) => Object.assign(c, { id: 1001 + i }));

  // ================= PRODUCT POOL (for the Add-products picker + collection bodies) =================
  // CollectionProductListItem-shaped: product_id, store_name, image, price_min/max,
  // on_sale_stock, variant_count, inventory_status (0 ok / 1 out / 2 partial), spec_type, is_show, is_del, create_time
  const PRODUCTS = [
    { product_id: 7001, store_name: 'Classic Cotton Crew Tee',     image: sw('#3b82f6'), price_min: 24.0,  price_max: 24.0,  on_sale_stock: 340, variant_count: 5, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, create_time: '2026-05-30 10:00', product_spu: 'TEE-CRW-01', product_sku: 'TEE-CRW-01-BLK-M', pid: 11 },
    { product_id: 7002, store_name: 'Merino Wool Pullover',        image: sw('#0ea5a4'), price_min: 79.0,  price_max: 92.0,  on_sale_stock: 56,  variant_count: 6, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, create_time: '2026-05-22 10:00', product_spu: 'KNT-MER-02', product_sku: 'KNT-MER-02-GRY-L', pid: 12 },
    { product_id: 7003, store_name: 'Slim-Fit Chino Trousers',     image: sw('#a16207'), price_min: 49.0,  price_max: 49.0,  on_sale_stock: 0,   variant_count: 8, inventory_status: 1, spec_type: 1, is_show: 1, is_del: 0, create_time: '2026-05-11 10:00', product_spu: 'PNT-CHN-03', product_sku: 'PNT-CHN-03-KHK-32', pid: 13 },
    { product_id: 7004, store_name: 'Canvas Low-Top Sneakers',     image: sw('#b45309'), price_min: 65.0,  price_max: 65.0,  on_sale_stock: 18,  variant_count: 7, inventory_status: 2, spec_type: 1, is_show: 1, is_del: 0, create_time: '2026-05-04 10:00', product_spu: 'SHO-CVS-04', product_sku: 'SHO-CVS-04-WHT-42', pid: 21 },
    { product_id: 7005, store_name: 'Leather Weekender Bag',       image: sw('#7c2d12'), price_min: 159.0, price_max: 159.0, on_sale_stock: 22,  variant_count: 0, inventory_status: 0, spec_type: 0, is_show: 1, is_del: 0, create_time: '2026-04-28 10:00', product_spu: 'BAG-WKD-05', product_sku: 'BAG-WKD-05-BRN', pid: 31 },
    { product_id: 7006, store_name: 'Recycled Nylon Windbreaker',  image: sw('#4d7c0f'), price_min: 88.0,  price_max: 102.0, on_sale_stock: 64,  variant_count: 5, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, create_time: '2026-05-09 10:00', product_spu: 'JKT-WND-06', product_sku: 'JKT-WND-06-OLV-M', pid: 14 },
    { product_id: 7007, store_name: 'Stainless Insulated Bottle',  image: sw('#0891b2'), price_min: 29.0,  price_max: 34.0,  on_sale_stock: 210, variant_count: 3, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, create_time: '2026-05-06 10:00', product_spu: 'BTL-INS-07', product_sku: 'BTL-INS-07-TEA-750', pid: 51 },
    { product_id: 7008, store_name: 'Organic Linen Shirt',         image: sw('#65a30d'), price_min: 58.0,  price_max: 58.0,  on_sale_stock: 47,  variant_count: 6, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, create_time: '2026-05-15 10:00', product_spu: 'SHT-LIN-08', product_sku: 'SHT-LIN-08-SND-L', pid: 11 },
    { product_id: 7009, store_name: 'Wool-Blend Overcoat',         image: sw('#1f2937'), price_min: 219.0, price_max: 219.0, on_sale_stock: 9,   variant_count: 4, inventory_status: 2, spec_type: 1, is_show: 1, is_del: 0, create_time: '2026-04-19 10:00', product_spu: 'COT-WOL-09', product_sku: 'COT-WOL-09-CHR-M', pid: 14 },
    { product_id: 7010, store_name: 'Performance Running Shorts',  image: sw('#db2777'), price_min: 32.0,  price_max: 32.0,  on_sale_stock: 0,   variant_count: 5, inventory_status: 1, spec_type: 1, is_show: 0, is_del: 0, create_time: '2026-05-02 10:00', product_spu: 'SHR-RUN-10', product_sku: 'SHR-RUN-10-PNK-S', pid: 13 },
    { product_id: 7011, store_name: 'Minimalist Leather Wallet',   image: sw('#92400e'), price_min: 45.0,  price_max: 45.0,  on_sale_stock: 130, variant_count: 0, inventory_status: 0, spec_type: 0, is_show: 1, is_del: 0, create_time: '2026-05-19 10:00', product_spu: 'WAL-LTH-11', product_sku: 'WAL-LTH-11-TAN', pid: 32 },
    { product_id: 7012, store_name: 'Cashmere Beanie',            image: sw('#9333ea'), price_min: 38.0,  price_max: 38.0,  on_sale_stock: 76,  variant_count: 4, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, create_time: '2026-05-24 10:00', product_spu: 'HAT-CSH-12', product_sku: 'HAT-CSH-12-NVY', pid: 33 },
    { product_id: 7013, store_name: 'Quilted Down Vest',          image: sw('#0369a1'), price_min: 95.0,  price_max: 95.0,  on_sale_stock: 28,  variant_count: 5, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, create_time: '2026-04-26 10:00', product_spu: 'VST-DWN-13', product_sku: 'VST-DWN-13-BLU-L', pid: 14 },
    { product_id: 7014, store_name: 'Ceramic Pour-Over Set',      image: sw('#be123c'), price_min: 54.0,  price_max: 54.0,  on_sale_stock: 41,  variant_count: 0, inventory_status: 0, spec_type: 0, is_show: 1, is_del: 0, create_time: '2026-04-22 10:00', product_spu: 'KIT-POV-14', product_sku: 'KIT-POV-14-WHT', pid: 41 },
    { product_id: 7015, store_name: 'Vintage Wash Denim Jacket',  image: sw('#1d4ed8'), price_min: 110.0, price_max: 110.0, on_sale_stock: 15,  variant_count: 6, inventory_status: 2, spec_type: 1, is_show: 1, is_del: 0, create_time: '2026-05-01 10:00', product_spu: 'JKT-DNM-15', product_sku: 'JKT-DNM-15-IND-M', pid: 14 },
    { product_id: 7016, store_name: 'Bamboo Sunglasses',         image: sw('#a3a300'), price_min: 42.0,  price_max: 42.0,  on_sale_stock: 88,  variant_count: 3, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, create_time: '2026-05-17 10:00', product_spu: 'ACC-SUN-16', product_sku: 'ACC-SUN-16-AMB', pid: 34 },
    { product_id: 7017, store_name: 'Archived Knit Scarf',       image: sw('#6b7280'), price_min: 26.0,  price_max: 26.0,  on_sale_stock: 0,   variant_count: 0, inventory_status: 1, spec_type: 0, is_show: 0, is_del: 1, create_time: '2026-03-12 10:00', product_spu: 'ACC-SCF-17', product_sku: 'ACC-SCF-17-RED', pid: 33 },
    { product_id: 7018, store_name: 'Trail Daypack 22L',         image: sw('#15803d'), price_min: 78.0,  price_max: 78.0,  on_sale_stock: 34,  variant_count: 4, inventory_status: 0, spec_type: 1, is_show: 1, is_del: 0, create_time: '2026-04-18 10:00', product_spu: 'BAG-DPK-18', product_sku: 'BAG-DPK-18-FOR', pid: 52 },
  ];

  const findProduct = (id) => PRODUCTS.find((p) => p.product_id === id);

  // helper: build a collection's product list from ids, assigning sort_order
  const productsByIds = (ids) =>
    ids.map((id, i) => Object.assign({}, findProduct(id), { sort_order: i + 1 }));

  // ================= DETAILS (full edit records, keyed by collection id) =================
  // Mirrors getCollectionDetail + getCollectionsProductsList + getCollectionSubCollectionsList.
  const DETAILS = {
    1001: {
      id: 1001,
      name: 'Best Sellers',
      handle: 'best-sellers',
      type: 'manual',
      description:
        'Our most-loved products, ranked by 30-day sales velocity. A curated edit of the styles customers keep coming back for.',
      image_url: sw('#2563eb'),
      seo_title: 'Best Sellers — Shop the Most Popular Products',
      seo_description:
        'Browse our best-selling products across apparel, footwear and accessories. Updated weekly based on customer demand.',
      seo_keywords: ['best sellers', 'popular products', 'top rated', 'trending'],
      template: 'default',
      sort_order: 'custom',
      sub_sort_order: 'custom',
      product_count: 48,
      create_time: '2026-05-28 09:14',
      update_time: '2026-06-03 18:40',
      products: productsByIds([7001, 7004, 7006, 7002, 7007, 7008, 7013, 7015]),
      sub_collections: [
        { id: 1005, name: "Men's Apparel",   image_url: sw('#1f2937'), type: 'manual', product_count: 52, sort_order: 1 },
        { id: 1006, name: "Women's Apparel", image_url: sw('#db2777'), type: 'manual', product_count: 58, sort_order: 2 },
        { id: 1007, name: 'Footwear',        image_url: sw('#b45309'), type: 'manual', product_count: 31, sort_order: 3 },
      ],
    },
    1002: {
      id: 1002,
      name: 'New Arrivals',
      handle: 'new-arrivals',
      type: 'manual',
      description:
        'Fresh drops landing this season. Be the first to shop the latest additions to the catalog.',
      image_url: sw('#0ea5a4'),
      seo_title: 'New Arrivals — Latest Products',
      seo_description: 'Discover the newest products added to our store. Shop new arrivals before they sell out.',
      seo_keywords: ['new arrivals', 'latest', 'new in'],
      template: 'default',
      sort_order: 'newest',
      sub_sort_order: 'custom',
      product_count: 36,
      create_time: '2026-05-30 16:02',
      update_time: '2026-06-02 09:12',
      products: productsByIds([7012, 7008, 7016, 7006, 7018, 7011]),
      sub_collections: [],
    },
    1003: {
      id: 1003,
      name: 'Summer Collection',
      handle: 'summer-collection',
      type: 'manual',
      description: 'Lightweight, breathable styles built for warm days and long evenings.',
      image_url: sw('#f59e0b'),
      seo_title: 'Summer Collection',
      seo_description: 'Shop the summer collection — linen shirts, shorts, sunglasses and more.',
      seo_keywords: ['summer', 'warm weather', 'linen'],
      template: 'default',
      sort_order: 'custom',
      sub_sort_order: 'custom',
      product_count: 27,
      create_time: '2026-05-21 11:48',
      update_time: '2026-05-29 14:30',
      products: productsByIds([7008, 7010, 7016, 7001, 7007]),
      sub_collections: [
        { id: 1008, name: 'Accessories', image_url: sw('#0891b2'), type: 'manual', product_count: 44, sort_order: 1 },
      ],
    },
    1010: {
      id: 1010,
      name: 'Clearance',
      handle: 'clearance',
      type: 'manual',
      description: 'Final markdowns on end-of-season stock. While supplies last.',
      image_url: '',
      seo_title: 'Clearance — Final Sale',
      seo_description: 'Save big on clearance items. Limited stock, no restocks.',
      seo_keywords: ['clearance', 'sale', 'discount', 'markdown'],
      template: 'default',
      sort_order: 'lowest_price',
      sub_sort_order: 'custom',
      product_count: 73,
      create_time: '2026-03-29 07:51',
      update_time: '2026-05-26 11:00',
      products: productsByIds([7003, 7010, 7017, 7009]),
      sub_collections: [],
    },
  };

  window.DATA_COLLECTIONS = {
    SORT_ORDERS: SORT_ORDERS,
    SEARCH_FIELDS: SEARCH_FIELDS,
    PRODUCT_SEARCH_FIELDS: PRODUCT_SEARCH_FIELDS,
    TEMPLATES: TEMPLATES,
    CATEGORIES: CATEGORIES,
    COLLECTIONS: COLLECTIONS,
    PRODUCTS: PRODUCTS,
    DETAILS: DETAILS,
    DOMAIN: 'https://www.bestshopio.com',
  };
})();
