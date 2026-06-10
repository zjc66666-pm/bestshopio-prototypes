/* BestShopio Admin · Orders prototype — sample data.
   Shaped after reference/bestvoy-admin .../orders/type.ts (OrderRecord, OrderItem,
   OrderShippingInfo) and api/modules/admin/orders.ts (ApiOrderDetail).
   Money is in store currency (USD $). No real PII / secrets.

   Fulfillment status is DERIVED from order status in app.js (mirrors
   FulfillmentStatusCell.tsx: shipped/review/archived -> Fulfilled, refund -> '--',
   everything else -> Unfulfilled), so it is not stored on rows. */
(function () {
  // ---- Tabs (orders/type.ts ORDERS_TAB + ORDERS_TAB_OPTIONS) ----
  const TABS = [
    { key: 'all',     label: 'All' },
    { key: 'to_pay',  label: 'To Pay' },
    { key: 'to_ship', label: 'To Ship' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'review',  label: 'Awaiting Review' },
    { key: 'archived',label: 'Archived' },
    { key: 'refund',  label: 'Refund' },
    { key: 'cancel',  label: 'Cancel' },
  ];

  // ---- Keyword-type select (ORDERS_KEYWORD_OPTIONS) ----
  const KEYWORD_OPTIONS = [
    { label: 'Order number',  value: 'order_sn' },
    { label: 'Receiver',      value: 'receiver' },
    { label: 'Email',         value: 'email' },
    { label: 'Phone',         value: 'phone' },
    { label: 'Country/Region',value: 'country' },
    { label: 'Product name',  value: 'store_name' },
    { label: 'Product SPU',   value: 'product_spu' },
    { label: 'Product SKU',   value: 'product_sku' },
    { label: 'Product barcode', value: 'bar_code_number' },
    { label: 'Product ID',    value: 'product_id' },
    { label: 'Variant ID',    value: 'unique' },
    { label: 'User',          value: 'nickname' },
  ];

  // ---- Time-type select (ORDERS_TIME_OPTIONS) ----
  const TIME_OPTIONS = [
    { label: 'Creation time',    value: 'create_date' },
    { label: 'Payment time',     value: 'pay_date' },
    { label: 'Fulfillment time', value: 'delivery_date' },
  ];

  // ---- List rows (OrderRecord / ApiOrderListItem-shaped, flattened for the table) ----
  // order_status drives the OrderStatusCell pill + derived fulfillment. order_type:
  // 0 = standard shipping order, 1/2 = pickup/verify order (drives Verify action).
  const ORDERS = [
    {
      order_id: 5042, order_sn: 'SILIX1042', create_time: '2026-06-04 14:22', order_type: 0,
      user: { nickname: 'Emma Whitfield', uid: 81245 },
      shipping: { name: 'Emma Whitfield', first_name: 'Emma', last_name: 'Whitfield',
        detail: '482 Lakeview Drive', detail2: 'Apt 5B', city: 'Chicago', province: 'IL', post_code: '60614',
        country: 'United States', phone_code: '1', phone: '312 555 0148', email: 'emma.whitfield@example.com' },
      total: 184.60, order_status: 'to_ship', payment_status: 'paid', payment_method: 'Stripe Card',
      pay_time: '2026-06-04 14:24', delivery_time: null,
    },
    {
      order_id: 5041, order_sn: 'SILIX1041', create_time: '2026-06-04 11:08', order_type: 0,
      user: { nickname: 'Liam Sørensen', uid: 80910 },
      shipping: { name: 'Liam Sørensen', first_name: 'Liam', last_name: 'Sørensen',
        detail: '17 Harbour Street', detail2: '', city: 'Sydney', province: 'NSW', post_code: '2000',
        country: 'Australia', phone_code: '61', phone: '2 8123 4567', email: 'liam.sorensen@example.com' },
      total: 96.00, order_status: 'to_pay', payment_status: 'unpaid', payment_method: '--',
      pay_time: null, delivery_time: null,
    },
    {
      order_id: 5040, order_sn: 'SILIX1040', create_time: '2026-06-03 19:41', order_type: 0,
      user: { nickname: 'Olivia Martins', uid: 80877 },
      shipping: { name: 'Olivia Martins', first_name: 'Olivia', last_name: 'Martins',
        detail: '226 Peachtree Rd NE', detail2: 'Suite 12', city: 'Atlanta', province: 'GA', post_code: '30309',
        country: 'United States', phone_code: '1', phone: '404 555 7781', email: 'olivia.martins@example.com' },
      total: 232.80, order_status: 'shipped', payment_status: 'paid', payment_method: 'PayPal',
      pay_time: '2026-06-03 19:43', delivery_time: '2026-06-04 09:15',
    },
    {
      order_id: 5039, order_sn: 'SILIX1039', create_time: '2026-06-03 08:55', order_type: 1,
      user: { nickname: 'Noah Thompson', uid: 80541 },
      shipping: { name: 'Noah Thompson', first_name: 'Noah', last_name: 'Thompson',
        detail: '900 Westheimer Rd', detail2: '', city: 'Houston', province: 'TX', post_code: '77006',
        country: 'United States', phone_code: '1', phone: '713 555 2290', email: 'noah.t@example.com' },
      total: 64.00, order_status: 'review', payment_status: 'paid', payment_method: 'Stripe ApplePay',
      pay_time: '2026-06-03 08:57', delivery_time: '2026-06-03 15:02',
    },
    {
      order_id: 5038, order_sn: 'SILIX1038', create_time: '2026-06-02 22:13', order_type: 0,
      user: { nickname: 'Ava Robinson', uid: 80233 },
      shipping: { name: 'Ava Robinson', first_name: 'Ava', last_name: 'Robinson',
        detail: '54 Collins Street', detail2: 'Level 8', city: 'Melbourne', province: 'VIC', post_code: '3000',
        country: 'Australia', phone_code: '61', phone: '3 9123 8800', email: 'ava.robinson@example.com' },
      total: 148.50, order_status: 'archived', payment_status: 'paid', payment_method: 'PayPal Card',
      pay_time: '2026-06-02 22:15', delivery_time: '2026-06-03 10:40',
    },
    {
      order_id: 5037, order_sn: 'SILIX1037', create_time: '2026-06-02 16:30', order_type: 0,
      user: { nickname: 'William Hughes', uid: 79980 },
      shipping: { name: 'William Hughes', first_name: 'William', last_name: 'Hughes',
        detail: '11 King Street West', detail2: '', city: 'Toronto', province: 'ON', post_code: 'M5H 1A1',
        country: 'Canada', phone_code: '1', phone: '416 555 0199', email: 'w.hughes@example.com' },
      total: 78.00, order_status: 'refund', payment_status: 'paid', payment_method: 'Stripe Card',
      pay_time: '2026-06-02 16:33', delivery_time: null,
    },
    {
      order_id: 5036, order_sn: 'SILIX1036', create_time: '2026-06-01 13:47', order_type: 0,
      user: { nickname: 'Sophia Khan', uid: 79644 },
      shipping: { name: 'Sophia Khan', first_name: 'Sophia', last_name: 'Khan',
        detail: '64 Baker Street', detail2: 'Flat 3', city: 'London', province: 'England', post_code: 'W1U 7DF',
        country: 'United Kingdom', phone_code: '44', phone: '20 7946 0123', email: 'sophia.khan@example.com' },
      total: 112.00, order_status: 'cancel', payment_status: 'unpaid', payment_method: '--',
      pay_time: null, delivery_time: null,
    },
    {
      order_id: 5035, order_sn: 'SILIX1035', create_time: '2026-06-01 09:02', order_type: 0,
      user: { nickname: 'James Becker', uid: 79412 },
      shipping: { name: 'James Becker', first_name: 'James', last_name: 'Becker',
        detail: 'Friedrichstraße 110', detail2: '', city: 'Berlin', province: 'Berlin', post_code: '10117',
        country: 'Germany', phone_code: '49', phone: '30 1234 5678', email: 'james.becker@example.com' },
      total: 205.20, order_status: 'to_ship', payment_status: 'paid', payment_method: 'Stripe Klarna',
      pay_time: '2026-06-01 09:05', delivery_time: null,
    },
    {
      order_id: 5034, order_sn: 'SILIX1034', create_time: '2026-05-31 20:18', order_type: 0,
      user: { nickname: 'Isabella Cruz', uid: 79100 },
      shipping: { name: 'Isabella Cruz', first_name: 'Isabella', last_name: 'Cruz',
        detail: '320 Ocean Drive', detail2: '', city: 'Miami', province: 'FL', post_code: '33139',
        country: 'United States', phone_code: '1', phone: '305 555 6612', email: 'isabella.cruz@example.com' },
      total: 54.00, order_status: 'shipped', payment_status: 'paid', payment_method: 'Stripe GooglePay',
      pay_time: '2026-05-31 20:20', delivery_time: '2026-06-01 11:30',
    },
    {
      order_id: 5033, order_sn: 'SILIX1033', create_time: '2026-05-31 12:44', order_type: 0,
      user: { nickname: 'Benjamin Foster', uid: 78844 },
      shipping: { name: 'Benjamin Foster', first_name: 'Benjamin', last_name: 'Foster',
        detail: '78 Queen Street', detail2: 'Unit 6', city: 'Auckland', province: 'Auckland', post_code: '1010',
        country: 'New Zealand', phone_code: '64', phone: '9 123 4567', email: 'ben.foster@example.com' },
      total: 167.40, order_status: 'review', payment_status: 'paid', payment_method: 'PayPal',
      pay_time: '2026-05-31 12:46', delivery_time: '2026-06-01 08:10',
    },
    {
      order_id: 5032, order_sn: 'SILIX1032', create_time: '2026-05-30 17:09', order_type: 0,
      user: { nickname: 'Mia Andersson', uid: 78510 },
      shipping: { name: 'Mia Andersson', first_name: 'Mia', last_name: 'Andersson',
        detail: 'Drottninggatan 45', detail2: '', city: 'Stockholm', province: 'Stockholm', post_code: '111 21',
        country: 'Sweden', phone_code: '46', phone: '8 123 456', email: 'mia.andersson@example.com' },
      total: 88.00, order_status: 'archived', payment_status: 'paid', payment_method: 'Stripe Card',
      pay_time: '2026-05-30 17:12', delivery_time: '2026-05-31 09:55',
    },
    {
      order_id: 5031, order_sn: 'SILIX1031', create_time: '2026-05-30 10:25', order_type: 0,
      user: { nickname: 'Lucas Meyer', uid: 78233 },
      shipping: { name: 'Lucas Meyer', first_name: 'Lucas', last_name: 'Meyer',
        detail: '12 Rue de Rivoli', detail2: '', city: 'Paris', province: 'Île-de-France', post_code: '75004',
        country: 'France', phone_code: '33', phone: '1 42 60 30 30', email: 'lucas.meyer@example.com' },
      total: 142.20, order_status: 'to_ship', payment_status: 'paid', payment_method: 'Airwallex Card',
      pay_time: '2026-05-30 10:28', delivery_time: null,
    },
    {
      order_id: 5030, order_sn: 'SILIX1030', create_time: '2026-05-29 21:50', order_type: 0,
      user: { nickname: 'Charlotte Reed', uid: 77990 },
      shipping: { name: 'Charlotte Reed', first_name: 'Charlotte', last_name: 'Reed',
        detail: '255 Market Street', detail2: 'Apt 14C', city: 'San Francisco', province: 'CA', post_code: '94105',
        country: 'United States', phone_code: '1', phone: '415 555 3320', email: 'charlotte.reed@example.com' },
      total: 312.00, order_status: 'shipped', payment_status: 'paid', payment_method: 'PayPal',
      pay_time: '2026-05-29 21:52', delivery_time: '2026-05-30 12:00',
    },
    {
      order_id: 5029, order_sn: 'SILIX1029', create_time: '2026-05-29 08:33', order_type: 0,
      user: { nickname: 'Henry Walsh', uid: 77641 },
      shipping: { name: 'Henry Walsh', first_name: 'Henry', last_name: 'Walsh',
        detail: '9 Eyre Square', detail2: '', city: 'Galway', province: 'Connacht', post_code: 'H91 X2K3',
        country: 'Ireland', phone_code: '353', phone: '91 123 456', email: 'henry.walsh@example.com' },
      total: 47.00, order_status: 'to_pay', payment_status: 'unpaid', payment_method: '--',
      pay_time: null, delivery_time: null,
    },
    {
      order_id: 5028, order_sn: 'SILIX1028', create_time: '2026-05-28 15:12', order_type: 0,
      user: { nickname: 'Amelia Novak', uid: 77302 },
      shipping: { name: 'Amelia Novak', first_name: 'Amelia', last_name: 'Novak',
        detail: 'Wenceslas Square 14', detail2: '', city: 'Prague', province: 'Prague', post_code: '110 00',
        country: 'Czechia', phone_code: '420', phone: '221 123 456', email: 'amelia.novak@example.com' },
      total: 129.00, order_status: 'refund', payment_status: 'paid', payment_method: 'Stripe Card',
      pay_time: '2026-05-28 15:15', delivery_time: null,
    },
  ];

  // ---- Full detail records (keyed by order_id), shaped after ApiOrderDetail ----
  // items[] is a flat product list (ProductsCard.tsx renders a flat ant List).
  // product_price = after-discount line price; line_total =
  // pre-discount line price (shown struck-through when discounts exist).
  const IMG = (bg, fg, t) =>
    'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><rect width="44" height="44" rx="6" fill="' + bg + '"/>' +
      '<text x="22" y="27" font-family="Inter,Arial" font-size="13" font-weight="600" fill="' + fg + '" text-anchor="middle">' + t + '</text></svg>');

  const DETAILS = {
    5042: {
      order_id: 5042, order_sn: 'SILIX1042', status: 'to_ship', paid: 1, order_type: 0,
      payment_status: 'paid', verify_code: '',
      create_time: '2026-06-04 14:22', pay_time: '2026-06-04 14:24',
      payment_method: 'Stripe Card',
      delivery_name: '', delivery_id: '',
      user: { nickname: 'Emma Whitfield', uid: 81245 },
      shipping: {
        first_name: 'Emma', last_name: 'Whitfield', detail: '482 Lakeview Drive', detail2: 'Apt 5B',
        city: 'Chicago', province: 'IL', post_code: '60614', country: 'United States',
        phone_code: '1', phone: '312 555 0148', email: 'emma.whitfield@example.com',
      },
      note: 'VIP customer — priority handling. Leave the package at the front desk if no one answers.',
      // amount breakdown (subtotal after product discounts; order + shipping discounts shown separately)
      total_num: 4, subtotal: 191.00, shipping_fee: 12.00, total: 184.60, paid_amount: 184.60,
      order_discounts: [{ name: 'WELCOME10', amount: 18.40 }],
      shipping_discounts: [{ name: 'Free shipping over $150', amount: 12.00 }],
      total_savings: 40.40,
      items: [
        { title: '3D Anti-Cellulite Leggings', sku: 'beige / m', image: IMG('#e6f0ff', '#0058c4', 'L'),
          unit_price: 49.00, qty: 2, line_total: 98.00, product_price: 89.00,
          discounts: [{ name: 'Summer bundle', amount: 9.00 }] },
        { title: 'Pocket Sculpting Leggings', sku: 'grey / l', image: IMG('#efe9ff', '#6d28d9', 'P'),
          unit_price: 39.00, qty: 1, line_total: 39.00, product_price: 39.00, discounts: [] },
        { title: 'Compression Sleeves (pair)', sku: 'black / os', image: IMG('#e0f2ec', '#00684a', 'C'),
          unit_price: 64.00, qty: 1, line_total: 64.00, product_price: 63.00,
          discounts: [{ name: 'WELCOME10', amount: 1.00 }] },
      ],
      timeline: [
        { label: 'Order placed', time: '2026-06-04 14:22' },
        { label: 'Payment captured · Stripe Card', time: '2026-06-04 14:24' },
        { label: 'Buyer notified', time: '2026-06-04 14:24' },
      ],
    },
    5040: {
      order_id: 5040, order_sn: 'SILIX1040', status: 'shipped', paid: 1, order_type: 0,
      payment_status: 'paid', verify_code: '',
      create_time: '2026-06-03 19:41', pay_time: '2026-06-03 19:43',
      payment_method: 'PayPal',
      delivery_name: 'FedEx', delivery_id: 'FX774120938455',
      user: { nickname: 'Olivia Martins', uid: 80877 },
      shipping: {
        first_name: 'Olivia', last_name: 'Martins', detail: '226 Peachtree Rd NE', detail2: 'Suite 12',
        city: 'Atlanta', province: 'GA', post_code: '30309', country: 'United States',
        phone_code: '1', phone: '404 555 7781', email: 'olivia.martins@example.com',
      },
      note: '',
      total_num: 5, subtotal: 232.80, shipping_fee: 0.00, total: 232.80, paid_amount: 232.80,
      order_discounts: [{ name: 'SUMMER20', amount: 12.20 }],
      shipping_discounts: [],
      total_savings: 12.20,
      items: [
        { title: 'Butt-Lifting Capris', sku: 'black / s', image: IMG('#e6f0ff', '#0058c4', 'B'),
          unit_price: 45.00, qty: 3, line_total: 135.00, product_price: 135.00, discounts: [] },
        { title: 'Seamless Briefs (3-pack)', sku: 'nude / m', image: IMG('#fff4e0', '#9a6400', 'S'),
          unit_price: 55.00, qty: 2, line_total: 110.00, product_price: 97.80,
          discounts: [{ name: 'SUMMER20', amount: 12.20 }] },
      ],
      timeline: [
        { label: 'Order placed', time: '2026-06-03 19:41' },
        { label: 'Payment captured · PayPal', time: '2026-06-03 19:43' },
        { label: 'Fulfilled · FedEx FX774120938455', time: '2026-06-03 22:10' },
      ],
    },
    5039: {
      order_id: 5039, order_sn: 'SILIX1039', status: 'review', paid: 1, order_type: 1,
      payment_status: 'paid', verify_code: 'VC-39A7K2',
      create_time: '2026-06-03 08:55', pay_time: '2026-06-03 08:57',
      payment_method: 'Stripe ApplePay',
      delivery_name: '', delivery_id: '',
      user: { nickname: 'Noah Thompson', uid: 80541 },
      shipping: {
        first_name: 'Noah', last_name: 'Thompson', detail: '900 Westheimer Rd', detail2: '',
        city: 'Houston', province: 'TX', post_code: '77006', country: 'United States',
        phone_code: '1', phone: '713 555 2290', email: 'noah.t@example.com',
      },
      note: 'Gift — no invoice in the box please.',
      total_num: 1, subtotal: 64.00, shipping_fee: 0.00, total: 64.00, paid_amount: 64.00,
      order_discounts: [], shipping_discounts: [], total_savings: 0.00,
      items: [
        { title: 'Short Leggings', sku: 'black / m', image: IMG('#e6f0ff', '#0058c4', 'S'),
          unit_price: 64.00, qty: 1, line_total: 64.00, product_price: 64.00, remaining: 1, discounts: [] },
      ],
      timeline: [
        { label: 'Order placed', time: '2026-06-03 08:55' },
        { label: 'Payment captured · Stripe ApplePay', time: '2026-06-03 08:57' },
        { label: 'Verification code issued · VC-39A7K2', time: '2026-06-03 08:57' },
      ],
    },
    5041: {
      order_id: 5041, order_sn: 'SILIX1041', status: 'to_pay', paid: 0, order_type: 0,
      payment_status: 'unpaid', verify_code: '',
      create_time: '2026-06-04 11:08', pay_time: null,
      payment_method: '--',
      delivery_name: '', delivery_id: '',
      user: { nickname: 'Liam Sørensen', uid: 80910 },
      shipping: {
        first_name: 'Liam', last_name: 'Sørensen', detail: '17 Harbour Street', detail2: '',
        city: 'Sydney', province: 'NSW', post_code: '2000', country: 'Australia',
        phone_code: '61', phone: '2 8123 4567', email: 'liam.sorensen@example.com',
      },
      note: '',
      total_num: 2, subtotal: 96.00, shipping_fee: 0.00, total: 96.00, paid_amount: 0.00,
      order_discounts: [], shipping_discounts: [], total_savings: 0.00,
      items: [
        { title: 'Compression Sleeves (pair)', sku: 'black / os', image: IMG('#e0f2ec', '#00684a', 'C'),
          unit_price: 48.00, qty: 2, line_total: 96.00, product_price: 96.00, discounts: [] },
      ],
      timeline: [
        { label: 'Order placed', time: '2026-06-04 11:08' },
        { label: 'Awaiting payment', time: '2026-06-04 11:08' },
      ],
    },
    5037: {
      order_id: 5037, order_sn: 'SILIX1037', status: 'refund', paid: 1, order_type: 0,
      payment_status: 'paid', verify_code: '',
      create_time: '2026-06-02 16:30', pay_time: '2026-06-02 16:33',
      payment_method: 'Stripe Card',
      delivery_name: '', delivery_id: '',
      user: { nickname: 'William Hughes', uid: 79980 },
      shipping: {
        first_name: 'William', last_name: 'Hughes', detail: '11 King Street West', detail2: '',
        city: 'Toronto', province: 'ON', post_code: 'M5H 1A1', country: 'Canada',
        phone_code: '1', phone: '416 555 0199', email: 'w.hughes@example.com',
      },
      note: 'Customer reported wrong size — full refund approved.',
      total_num: 1, subtotal: 78.00, shipping_fee: 0.00, total: 78.00, paid_amount: 0.00,
      order_discounts: [], shipping_discounts: [], total_savings: 0.00,
      items: [
        { title: 'Butt-Lifting Capris', sku: 'grey / l', image: IMG('#e6f0ff', '#0058c4', 'B'),
          unit_price: 78.00, qty: 1, line_total: 78.00, product_price: 78.00, discounts: [] },
      ],
      timeline: [
        { label: 'Order placed', time: '2026-06-02 16:30' },
        { label: 'Payment captured · Stripe Card', time: '2026-06-02 16:33' },
        { label: 'Refund of $78.00 issued · Wrong size', time: '2026-06-02 18:12' },
      ],
    },
  };

  window.DATA_ORDERS = {
    TABS, KEYWORD_OPTIONS, TIME_OPTIONS, ORDERS, DETAILS,
    // Refund reasons (getRefundReasons) — referenced in the Refund modal helper text only
    REFUND_REASONS: [
      'Out of stock', 'Customer changed mind', 'Wrong item shipped',
      'Damaged in transit', 'Size / fit issue', 'Duplicate order', 'Other',
    ],
  };
})();
