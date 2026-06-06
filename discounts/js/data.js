/* BestShopio Admin · Discounts prototype — sample data.
   Shaped after reference/bestvoy-admin .../discounts/type.ts (DiscountActivityItem,
   DiscountStatusCounts) and api/modules/admin/discount.ts (DiscountActivityDetail,
   DiscountActivityTimelineItem). Money is in store currency (USD $). No real PII.

   Dimension enum (discount_dimension):  1 = order, 2 = product, 3 = shipping
   Method enum    (discount_form):       1 = code,  2 = automatic
   Value enum     (discount_type):       1 = percentage, 2 = fixed (7 = free shipping)
   run_status:    Active | Scheduled | Expired
*/
(function () {
  // ---- List tabs (pages/list.tsx statusMap) ----
  const TABS = [
    { key: 'All',       label: 'All' },
    { key: 'Active',    label: 'Active' },
    { key: 'Scheduled', label: 'Scheduled' },
    { key: 'Expired',   label: 'Expired' },
  ];

  // ---- Filter options (components/list/search.tsx) ----
  const TYPE_OPTIONS = [
    { label: 'Amount off products', value: 2 },
    { label: 'Amount off order',    value: 1 },
    { label: 'Free shipping',       value: 3 },
  ];
  const METHOD_OPTIONS = [
    { label: 'Code',      value: 1 },
    { label: 'Automatic', value: 2 },
  ];
  const COMBINES_OPTIONS = [
    { label: 'Product discounts',  value: 'product_discount' },
    { label: 'Order discounts',    value: 'order_discount' },
    { label: 'Shipping discounts', value: 'shipping_discount' },
  ];

  // ---- "Select discount type" modal (pages/list.tsx create flow) ----
  const TYPE_CARDS = [
    { key: 'product',  label: 'Amount off products', desc: 'Discount specific products or collections of products.', icon: 'tag' },
    { key: 'order',    label: 'Amount off order',    desc: 'Discount the total order amount.',                        icon: 'inbox' },
    { key: 'shipping', label: 'Free shipping',       desc: 'Offer free shipping on an order.',                        icon: 'truck' },
  ];

  // type_text helpers per dimension
  const TYPE_TEXT = { 1: 'Amount off order', 2: 'Amount off products', 3: 'Free shipping' };

  // ---- List rows (DiscountActivityItem-shaped) ----
  // second_line_info = { discount_info, minimum_purchase, maximum_uses }
  const DISCOUNTS = [
    {
      activity_id: 7012, run_status: 'Active', discount_dimension: 2, discount_form: 1,
      type_text: 'Amount off products', method_text: 'Code', title_display: 'SUMMER25',
      combinations: { product_discount: false, order_discount: true, shipping_discount: true },
      second_line_info: { discount_info: '25% off 12 products', minimum_purchase: 'No minimum', maximum_uses: 'Used 348 times' },
      total_used: 348, total_sales: 18420.55, start_date: '2026-05-01',
    },
    {
      activity_id: 7011, run_status: 'Active', discount_dimension: 1, discount_form: 1,
      type_text: 'Amount off order', method_text: 'Code', title_display: 'WELCOME10',
      combinations: { product_discount: true, order_discount: false, shipping_discount: false },
      second_line_info: { discount_info: '$10 off entire order', minimum_purchase: 'Min purchase of $60.00', maximum_uses: '1 per customer' },
      total_used: 1290, total_sales: 64500.00, start_date: '2026-01-15',
    },
    {
      activity_id: 7010, run_status: 'Active', discount_dimension: 3, discount_form: 2,
      type_text: 'Free shipping', method_text: 'Automatic', title_display: 'Free shipping over $75',
      combinations: { product_discount: true, order_discount: true, shipping_discount: false },
      second_line_info: { discount_info: 'Free shipping on all products', minimum_purchase: 'Min purchase of $75.00', maximum_uses: '' },
      total_used: 2104, total_sales: 0, start_date: '2026-02-01',
    },
    {
      activity_id: 7009, run_status: 'Active', discount_dimension: 2, discount_form: 2,
      type_text: 'Amount off products', method_text: 'Automatic', title_display: 'Sneaker clearance -30%',
      combinations: { product_discount: false, order_discount: false, shipping_discount: false },
      second_line_info: { discount_info: '30% off 8 products', minimum_purchase: 'No minimum', maximum_uses: '' },
      total_used: 567, total_sales: 22890.40, start_date: '2026-04-20',
    },
    {
      activity_id: 7008, run_status: 'Scheduled', discount_dimension: 1, discount_form: 1,
      type_text: 'Amount off order', method_text: 'Code', title_display: 'BLACKFRIDAY40',
      combinations: { product_discount: true, order_discount: false, shipping_discount: true },
      second_line_info: { discount_info: '40% off entire order', minimum_purchase: 'Min purchase of $120.00', maximum_uses: 'Limit 5000 uses' },
      total_used: 0, total_sales: 0, start_date: '2026-11-27',
    },
    {
      activity_id: 7007, run_status: 'Scheduled', discount_dimension: 3, discount_form: 1,
      type_text: 'Free shipping', method_text: 'Code', title_display: 'SHIPFREE',
      combinations: { product_discount: false, order_discount: true, shipping_discount: false },
      second_line_info: { discount_info: 'Free shipping on all products', minimum_purchase: 'No minimum', maximum_uses: '1 per customer' },
      total_used: 0, total_sales: 0, start_date: '2026-07-01',
    },
    {
      activity_id: 7006, run_status: 'Scheduled', discount_dimension: 2, discount_form: 2,
      type_text: 'Amount off products', method_text: 'Automatic', title_display: 'Back to school 15%',
      combinations: { product_discount: false, order_discount: true, shipping_discount: false },
      second_line_info: { discount_info: '15% off 24 products', minimum_purchase: 'Min 2 items', maximum_uses: '' },
      total_used: 0, total_sales: 0, start_date: '2026-08-15',
    },
    {
      activity_id: 7005, run_status: 'Active', discount_dimension: 1, discount_form: 2,
      type_text: 'Amount off order', method_text: 'Automatic', title_display: 'Spend $200 save $30',
      combinations: { product_discount: true, order_discount: false, shipping_discount: true },
      second_line_info: { discount_info: '$30 off entire order', minimum_purchase: 'Min purchase of $200.00', maximum_uses: '' },
      total_used: 211, total_sales: 51300.00, start_date: '2026-03-10',
    },
    {
      activity_id: 7004, run_status: 'Expired', discount_dimension: 2, discount_form: 1,
      type_text: 'Amount off products', method_text: 'Code', title_display: 'SPRING20',
      combinations: { product_discount: false, order_discount: false, shipping_discount: false },
      second_line_info: { discount_info: '20% off 16 products', minimum_purchase: 'No minimum', maximum_uses: 'Used 902 times' },
      total_used: 902, total_sales: 40115.75, start_date: '2026-03-01',
    },
    {
      activity_id: 7003, run_status: 'Expired', discount_dimension: 1, discount_form: 1,
      type_text: 'Amount off order', method_text: 'Code', title_display: 'NEWYEAR15',
      combinations: { product_discount: true, order_discount: false, shipping_discount: false },
      second_line_info: { discount_info: '15% off entire order', minimum_purchase: 'Min purchase of $50.00', maximum_uses: 'Limit 2000 uses' },
      total_used: 2000, total_sales: 88200.00, start_date: '2025-12-26',
    },
    {
      activity_id: 7002, run_status: 'Expired', discount_dimension: 3, discount_form: 2,
      type_text: 'Free shipping', method_text: 'Automatic', title_display: 'Holiday free shipping',
      combinations: { product_discount: true, order_discount: true, shipping_discount: false },
      second_line_info: { discount_info: 'Free shipping on all products', minimum_purchase: 'No minimum', maximum_uses: '' },
      total_used: 3401, total_sales: 0, start_date: '2025-12-01',
    },
    {
      activity_id: 7001, run_status: 'Expired', discount_dimension: 2, discount_form: 2,
      type_text: 'Amount off products', method_text: 'Automatic', title_display: 'Flash sale -50%',
      combinations: { product_discount: false, order_discount: false, shipping_discount: false },
      second_line_info: { discount_info: '50% off 4 products', minimum_purchase: 'No minimum', maximum_uses: '' },
      total_used: 145, total_sales: 7320.00, start_date: '2026-04-01',
    },
    {
      activity_id: 7000, run_status: 'Active', discount_dimension: 1, discount_form: 1,
      type_text: 'Amount off order', method_text: 'Code', title_display: 'VIP5OFF',
      combinations: { product_discount: true, order_discount: false, shipping_discount: true },
      second_line_info: { discount_info: '5% off entire order', minimum_purchase: 'No minimum', maximum_uses: '1 per customer' },
      total_used: 78, total_sales: 9650.00, start_date: '2026-05-20',
    },
    {
      activity_id: 6999, run_status: 'Active', discount_dimension: 2, discount_form: 1,
      type_text: 'Amount off products', method_text: 'Code', title_display: 'BUNDLE12',
      combinations: { product_discount: false, order_discount: true, shipping_discount: true },
      second_line_info: { discount_info: '$12 off 6 products', minimum_purchase: 'Min 3 items', maximum_uses: 'Used 64 times' },
      total_used: 64, total_sales: 3120.00, start_date: '2026-05-28',
    },
  ];

  // ---- status counts (DiscountStatusCounts) ----
  const STATUS_COUNTS = {
    all: DISCOUNTS.length,
    active: DISCOUNTS.filter((d) => d.run_status === 'Active').length,
    scheduled: DISCOUNTS.filter((d) => d.run_status === 'Scheduled').length,
    expired: DISCOUNTS.filter((d) => d.run_status === 'Expired').length,
  };

  // ---- Detail records (DiscountActivityDetail + form mapping) ----
  // Keyed by activity_id. dimension: 'product' | 'order' | 'shipping'.
  const DETAILS = {
    7012: {
      activity_id: 7012, dimension: 'product', run_status: 'Active', status: 1,
      method: 'code', discount_code: 'SUMMER25', title: '',
      discount_value_type: 'percentage', discount_value: '25',
      applies_to: 'specific_products',
      products: [
        { id: 901, name: 'Aero Running Tee', store: 'BestShop Athletics', selected: 3, total: 5, has_variants: true,  image: '' },
        { id: 902, name: 'Featherlite Shorts', store: 'BestShop Athletics', selected: 1, total: 1, has_variants: false, image: '' },
        { id: 903, name: 'Trail Cap', store: 'BestShop Athletics', selected: 2, total: 4, has_variants: true,  image: '' },
      ],
      minimum_purchase_type: 'none', minimum_purchase_value: '',
      maximum_uses: { totalEnabled: false, total: '', customerEnabled: true, customer: '3', oncePerOrder: true },
      customer_scope: 'All customers',
      countries: 'all',
      combinations: { product_discount: false, order_discount: true, shipping_discount: true },
      start_date: '2026-05-01 00:00:00', end_date: '2026-08-31 23:59:59', never_expires: false,
      total_used: 348, total_sales: 18420.55,
      logs: [
        { log_id: 5, content: 'Sophia Reyes turned on discount',  create_time: '2026-05-01 09:02' },
        { log_id: 4, content: 'Sophia Reyes edited discount',      create_time: '2026-04-29 16:41' },
        { log_id: 3, content: 'Marcus Lee edited discount value',  create_time: '2026-04-28 11:15' },
        { log_id: 2, content: 'Marcus Lee added 3 products',       create_time: '2026-04-28 11:10' },
        { log_id: 1, content: 'Marcus Lee created discount',       create_time: '2026-04-28 10:58' },
      ],
    },
    7011: {
      activity_id: 7011, dimension: 'order', run_status: 'Active', status: 1,
      method: 'code', discount_code: 'WELCOME10', title: '',
      discount_value_type: 'fixed', discount_value: '10',
      applies_to: 'all_order', products: [],
      minimum_purchase_type: 'amount', minimum_purchase_value: '60',
      maximum_uses: { totalEnabled: false, total: '', customerEnabled: true, customer: '1', oncePerOrder: false },
      customer_scope: 'All customers',
      countries: 'all',
      combinations: { product_discount: true, order_discount: false, shipping_discount: false },
      start_date: '2026-01-15 00:00:00', end_date: '', never_expires: true,
      total_used: 1290, total_sales: 64500.00,
      logs: [
        { log_id: 3, content: 'System turned on discount',     create_time: '2026-01-15 00:00' },
        { log_id: 2, content: 'Aisha Khan edited eligibility',  create_time: '2026-01-14 14:22' },
        { log_id: 1, content: 'Aisha Khan created discount',    create_time: '2026-01-14 14:05' },
      ],
    },
    7010: {
      activity_id: 7010, dimension: 'shipping', run_status: 'Active', status: 1,
      method: 'automatic', discount_code: '', title: 'Free shipping over $75',
      discount_value_type: 'percentage', discount_value: '',
      applies_to: 'all_order', products: [],
      minimum_purchase_type: 'amount', minimum_purchase_value: '75',
      maximum_uses: { totalEnabled: false, total: '', customerEnabled: false, customer: '', oncePerOrder: false },
      customer_scope: 'All customers',
      countries: 'all',
      combinations: { product_discount: true, order_discount: true, shipping_discount: false },
      start_date: '2026-02-01 00:00:00', end_date: '', never_expires: true,
      total_used: 2104, total_sales: 0,
      logs: [
        { log_id: 2, content: 'System turned on discount',  create_time: '2026-02-01 00:00' },
        { log_id: 1, content: 'Diego Alvarez created discount', create_time: '2026-01-31 17:30' },
      ],
    },
    7008: {
      activity_id: 7008, dimension: 'order', run_status: 'Scheduled', status: 0,
      method: 'code', discount_code: 'BLACKFRIDAY40', title: '',
      discount_value_type: 'percentage', discount_value: '40',
      applies_to: 'all_order', products: [],
      minimum_purchase_type: 'amount', minimum_purchase_value: '120',
      maximum_uses: { totalEnabled: true, total: '5000', customerEnabled: true, customer: '2', oncePerOrder: false },
      customer_scope: 'All customers',
      countries: 'all',
      combinations: { product_discount: true, order_discount: false, shipping_discount: true },
      start_date: '2026-11-27 00:00:00', end_date: '2026-11-30 23:59:59', never_expires: false,
      total_used: 0, total_sales: 0,
      logs: [
        { log_id: 1, content: 'Marcus Lee created discount', create_time: '2026-06-02 13:44' },
      ],
    },
    7009: {
      activity_id: 7009, dimension: 'product', run_status: 'Active', status: 1,
      method: 'automatic', discount_code: '', title: 'Sneaker clearance -30%',
      discount_value_type: 'percentage', discount_value: '30',
      applies_to: 'specific_products',
      products: [
        { id: 811, name: 'Velocity Runner X', store: 'BestShop Footwear', selected: 6, total: 6, has_variants: true, image: '' },
        { id: 812, name: 'Court Classic Low', store: 'BestShop Footwear', selected: 2, total: 8, has_variants: true, image: '' },
      ],
      minimum_purchase_type: 'none', minimum_purchase_value: '',
      maximum_uses: { totalEnabled: false, total: '', customerEnabled: false, customer: '', oncePerOrder: false },
      customer_scope: 'All customers',
      countries: 'all',
      combinations: { product_discount: false, order_discount: false, shipping_discount: false },
      start_date: '2026-04-20 00:00:00', end_date: '', never_expires: true,
      total_used: 567, total_sales: 22890.40,
      logs: [
        { log_id: 2, content: 'System turned on discount',     create_time: '2026-04-20 00:00' },
        { log_id: 1, content: 'Sophia Reyes created discount',  create_time: '2026-04-19 10:12' },
      ],
    },
    7004: {
      activity_id: 7004, dimension: 'product', run_status: 'Expired', status: 1,
      method: 'code', discount_code: 'SPRING20', title: '',
      discount_value_type: 'percentage', discount_value: '20',
      applies_to: 'specific_products',
      products: [
        { id: 701, name: 'Bloom Linen Dress', store: 'BestShop Apparel', selected: 4, total: 4, has_variants: true, image: '' },
        { id: 702, name: 'Garden Tote Bag',   store: 'BestShop Apparel', selected: 1, total: 1, has_variants: false, image: '' },
      ],
      minimum_purchase_type: 'none', minimum_purchase_value: '',
      maximum_uses: { totalEnabled: false, total: '', customerEnabled: false, customer: '', oncePerOrder: true },
      customer_scope: 'All customers',
      countries: 'all',
      combinations: { product_discount: false, order_discount: false, shipping_discount: false },
      start_date: '2026-03-01 00:00:00', end_date: '2026-03-31 23:59:59', never_expires: false,
      total_used: 902, total_sales: 40115.75,
      logs: [
        { log_id: 3, content: 'System expired discount',       create_time: '2026-04-01 00:00' },
        { log_id: 2, content: 'System turned on discount',     create_time: '2026-03-01 00:00' },
        { log_id: 1, content: 'Aisha Khan created discount',   create_time: '2026-02-26 15:20' },
      ],
    },
  };

  window.DATA_DISCOUNTS = {
    TABS, TYPE_OPTIONS, METHOD_OPTIONS, COMBINES_OPTIONS, TYPE_CARDS,
    TYPE_TEXT, DISCOUNTS, STATUS_COUNTS, DETAILS,
  };
})();
