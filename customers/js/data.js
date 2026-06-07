/* BestShopio Admin · Customers prototype — sample data.
   Shaped after reference/bestvoy-admin .../customer/type.ts
   (CustomerListItem, CustomerDetail, CustomerAddress, CustomerOrderItem,
   CustomerTimelineLog) and api/modules/admin/customer.ts.
   Money is in store currency (USD $). No real PII / secrets. */
(function () {
  // ---- Keyword-type select (CUSTOMER_KEYWORD_OPTIONS) ----
  const KEYWORD_OPTIONS = [
    { label: 'Customer name', value: 'customer_name' },
    { label: 'Email',         value: 'email' },
    { label: 'Phone',         value: 'phone' },
  ];

  // ---- Email subscription multi-select (CUSTOMER_MARKETING_STATUS_OPTIONS) ----
  const MARKETING_OPTIONS = [
    { label: 'Subscribed',      value: 'subscribed' },
    { label: 'Not subscribed',  value: 'not_subscribed' },
    { label: 'Unsubscribed',    value: 'unsubscribed' },
  ];

  // ---- Account status multi-select (CUSTOMER_ACCOUNT_STATUS_OPTIONS) ----
  const ACCOUNT_OPTIONS = [
    { label: 'Registered', value: 'registered' },
    { label: 'Guest',      value: 'guest' },
  ];

  // Real list shows a single static "All" tab with the total count (pages/list.tsx
  // renders <Tabs activeKey="All"> with one TabPane). Account status is a filter, not a tab.
  const TABS = [
    { key: 'all', label: 'All' },
  ];

  // ---- List rows (CustomerListItem-shaped) ----
  // location is a CustomerAddress object (the list renders city / province / post_code / country lines).
  const CUSTOMERS = [
    {
      id: 81245, first_name: 'Emma', last_name: 'Whitfield',
      email: 'emma.whitfield@example.com', phone: '312 555 0148', phone_code: '1',
      account_status: 'registered', marketing_status: 'subscribed',
      orders_count: 12, total_spent: '2184.60', last_order_at: '2026-06-04 14:22',
      source: 'Online Store', create_time: '2024-03-11 09:41',
      location: { first_name: 'Emma', last_name: 'Whitfield', detail: '482 Lakeview Drive', detail2: 'Apt 5B',
        city: 'Chicago', province: 'IL', post_code: '60614', country: 'United States' },
    },
    {
      id: 80910, first_name: 'Liam', last_name: 'Sørensen',
      email: 'liam.sorensen@example.com', phone: '400 1234 567', phone_code: '61',
      account_status: 'registered', marketing_status: 'not_subscribed',
      orders_count: 4, total_spent: '612.00', last_order_at: '2026-06-04 11:08',
      source: 'Online Store', create_time: '2024-09-02 18:20',
      location: { first_name: 'Liam', last_name: 'Sørensen', detail: '17 Harbour Street', detail2: '',
        city: 'Sydney', province: 'NSW', post_code: '2000', country: 'Australia' },
    },
    {
      id: 80755, first_name: 'Sofia', last_name: 'Rossi',
      email: 'sofia.rossi@example.com', phone: '345 678 9012', phone_code: '39',
      account_status: 'registered', marketing_status: 'subscribed',
      orders_count: 7, total_spent: '1340.25', last_order_at: '2026-05-29 20:14',
      source: 'Instagram', create_time: '2023-12-19 11:05',
      location: { first_name: 'Sofia', last_name: 'Rossi', detail: 'Via Roma 24', detail2: 'Interno 3',
        city: 'Milan', province: 'MI', post_code: '20121', country: 'Italy' },
    },
    {
      id: 80612, first_name: 'James', last_name: 'O’Connor',
      email: 'james.oconnor@example.com', phone: '85 1234 5678', phone_code: '353',
      account_status: 'registered', marketing_status: 'unsubscribed',
      orders_count: 2, total_spent: '198.50', last_order_at: '2026-05-21 08:47',
      source: 'Online Store', create_time: '2025-01-30 14:52',
      location: { first_name: 'James', last_name: 'O’Connor', detail: '9 Patrick Street', detail2: '',
        city: 'Cork', province: 'Munster', post_code: 'T12 X70F', country: 'Ireland' },
    },
    {
      id: 80488, first_name: 'Yuki', last_name: 'Tanaka',
      email: 'yuki.tanaka@example.com', phone: '90 1234 5678', phone_code: '81',
      account_status: 'registered', marketing_status: 'subscribed',
      orders_count: 19, total_spent: '4820.00', last_order_at: '2026-06-01 06:33',
      source: 'Online Store', create_time: '2023-06-08 22:10',
      location: { first_name: 'Yuki', last_name: 'Tanaka', detail: '2-14-1 Shibuya', detail2: 'Shibuya Tower 12F',
        city: 'Tokyo', province: 'Tokyo', post_code: '150-0002', country: 'Japan' },
    },
    {
      id: 80344, first_name: '', last_name: '',
      email: 'guest.shopper.4471@example.com', phone: '', phone_code: '',
      account_status: 'guest', marketing_status: 'not_subscribed',
      orders_count: 1, total_spent: '74.90', last_order_at: '2026-05-18 16:02',
      source: 'Online Store', create_time: '2026-05-18 16:00',
      location: { first_name: 'Guest', last_name: '', detail: '120 Market Square', detail2: '',
        city: 'Toronto', province: 'ON', post_code: 'M5H 2N2', country: 'Canada' },
    },
    {
      id: 80201, first_name: 'Chloé', last_name: 'Dubois',
      email: 'chloe.dubois@example.com', phone: '6 12 34 56 78', phone_code: '33',
      account_status: 'registered', marketing_status: 'subscribed',
      orders_count: 9, total_spent: '1965.40', last_order_at: '2026-05-30 13:25',
      source: 'Facebook', create_time: '2024-02-14 10:18',
      location: { first_name: 'Chloé', last_name: 'Dubois', detail: '14 Rue de Rivoli', detail2: '',
        city: 'Paris', province: 'Île-de-France', post_code: '75004', country: 'France' },
    },
    {
      id: 80087, first_name: 'Mateus', last_name: 'Silva',
      email: 'mateus.silva@example.com', phone: '11 91234 5678', phone_code: '55',
      account_status: 'registered', marketing_status: 'not_subscribed',
      orders_count: 3, total_spent: '421.10', last_order_at: '2026-05-12 09:55',
      source: 'Online Store', create_time: '2025-04-22 19:40',
      location: { first_name: 'Mateus', last_name: 'Silva', detail: 'Av. Paulista 1578', detail2: 'Conj. 402',
        city: 'São Paulo', province: 'SP', post_code: '01310-200', country: 'Brazil' },
    },
    {
      id: 79944, first_name: 'Olivia', last_name: 'Nguyen',
      email: 'olivia.nguyen@example.com', phone: '412 345 678', phone_code: '61',
      account_status: 'registered', marketing_status: 'subscribed',
      orders_count: 6, total_spent: '1102.75', last_order_at: '2026-05-27 21:11',
      source: 'TikTok', create_time: '2024-07-01 08:00',
      location: { first_name: 'Olivia', last_name: 'Nguyen', detail: '88 Collins Street', detail2: 'Level 9',
        city: 'Melbourne', province: 'VIC', post_code: '3000', country: 'Australia' },
    },
    {
      id: 79810, first_name: '', last_name: '',
      email: 'guest.shopper.3920@example.com', phone: '', phone_code: '',
      account_status: 'guest', marketing_status: 'not_subscribed',
      orders_count: 1, total_spent: '39.00', last_order_at: '2026-04-30 12:48',
      source: 'Online Store', create_time: '2026-04-30 12:46',
      location: '',
    },
    {
      id: 79677, first_name: 'Hannah', last_name: 'Müller',
      email: 'hannah.mueller@example.com', phone: '151 2345 6789', phone_code: '49',
      account_status: 'registered', marketing_status: 'subscribed',
      orders_count: 14, total_spent: '3310.80', last_order_at: '2026-06-02 07:29',
      source: 'Online Store', create_time: '2023-11-03 15:12',
      location: { first_name: 'Hannah', last_name: 'Müller', detail: 'Friedrichstraße 43', detail2: '',
        city: 'Berlin', province: 'Berlin', post_code: '10117', country: 'Germany' },
    },
    {
      id: 79502, first_name: 'Daniel', last_name: 'Kim',
      email: 'daniel.kim@example.com', phone: '10 1234 5678', phone_code: '82',
      account_status: 'registered', marketing_status: 'unsubscribed',
      orders_count: 5, total_spent: '889.99', last_order_at: '2026-05-24 18:36',
      source: 'Online Store', create_time: '2024-05-17 13:33',
      location: { first_name: 'Daniel', last_name: 'Kim', detail: '29 Gangnam-daero', detail2: 'Apt 1203',
        city: 'Seoul', province: 'Seoul', post_code: '06236', country: 'South Korea' },
    },
    {
      id: 79388, first_name: 'Ava', last_name: 'Johnson',
      email: 'ava.johnson@example.com', phone: '212 555 0199', phone_code: '1',
      account_status: 'registered', marketing_status: 'subscribed',
      orders_count: 21, total_spent: '5740.30', last_order_at: '2026-06-03 23:04',
      source: 'Online Store', create_time: '2022-09-25 17:48',
      location: { first_name: 'Ava', last_name: 'Johnson', detail: '350 5th Avenue', detail2: 'Suite 7800',
        city: 'New York', province: 'NY', post_code: '10118', country: 'United States' },
    },
    {
      id: 79255, first_name: 'Noah', last_name: 'García',
      email: 'noah.garcia@example.com', phone: '612 34 56 78', phone_code: '34',
      account_status: 'registered', marketing_status: 'not_subscribed',
      orders_count: 8, total_spent: '1488.00', last_order_at: '2026-05-26 10:42',
      source: 'Online Store', create_time: '2024-01-08 09:09',
      location: { first_name: 'Noah', last_name: 'García', detail: 'Calle Gran Vía 28', detail2: '',
        city: 'Madrid', province: 'Madrid', post_code: '28013', country: 'Spain' },
    },
    {
      id: 79101, first_name: 'Isabella', last_name: 'Costa',
      email: 'isabella.costa@example.com', phone: '21 98765 4321', phone_code: '351',
      account_status: 'guest', marketing_status: 'not_subscribed',
      orders_count: 0, total_spent: '0.00', last_order_at: null,
      source: 'Online Store', create_time: '2026-05-09 11:27',
      location: { first_name: 'Isabella', last_name: 'Costa', detail: 'Rua Augusta 102', detail2: '',
        city: 'Lisbon', province: 'Lisboa', post_code: '1100-053', country: 'Portugal' },
    },
  ];

  // ---- Detail records (CustomerDetail-shaped), keyed by id ----
  // Each detail adds: last_time, subscription, logs, and an ORDERS map (CustomerOrderItem[]).
  const DETAILS = {
    81245: {
      id: 81245, first_name: 'Emma', last_name: 'Whitfield',
      email: 'emma.whitfield@example.com', phone: '312 555 0148', phone_code: '1',
      account_status: 'registered', marketing_status: 'subscribed',
      orders_count: 12, total_spent: '2184.60', last_order_at: '2026-06-04 14:22',
      source: 'Online Store', create_time: '2024-03-11 09:41', last_time: '2026-06-04 14:18',
      note: 'VIP — prefers DHL Express. Reached out about a wholesale tier in May.',
      subscription: { subscribe_time: '2024-03-11 09:42' },
      location: { first_name: 'Emma', last_name: 'Whitfield', detail: '482 Lakeview Drive', detail2: 'Apt 5B',
        city: 'Chicago', province: 'IL', post_code: '60614', country: 'United States',
        email: 'emma.whitfield@example.com', phone: '312 555 0148', phone_code: '1' },
      logs: [
        { id: 5, content: 'Placed order SILIX1042', create_time: '2026-06-04 14:22' },
        { id: 4, content: 'Updated default shipping address', create_time: '2026-05-20 10:11' },
        { id: 3, content: 'Subscribed to email marketing', create_time: '2024-03-11 09:42' },
        { id: 2, content: 'Placed first order SILIX0418', create_time: '2024-03-11 09:55' },
        { id: 1, content: 'Account created from Online Store', create_time: '2024-03-11 09:41' },
      ],
    },
    80488: {
      id: 80488, first_name: 'Yuki', last_name: 'Tanaka',
      email: 'yuki.tanaka@example.com', phone: '90 1234 5678', phone_code: '81',
      account_status: 'registered', marketing_status: 'subscribed',
      orders_count: 19, total_spent: '4820.00', last_order_at: '2026-06-01 06:33',
      source: 'Online Store', create_time: '2023-06-08 22:10', last_time: '2026-06-01 06:30',
      note: '',
      subscription: { subscribe_time: '2023-06-08 22:12' },
      location: { first_name: 'Yuki', last_name: 'Tanaka', detail: '2-14-1 Shibuya', detail2: 'Shibuya Tower 12F',
        city: 'Tokyo', province: 'Tokyo', post_code: '150-0002', country: 'Japan',
        email: 'yuki.tanaka@example.com', phone: '90 1234 5678', phone_code: '81' },
      logs: [
        { id: 4, content: 'Placed order SILIX1039', create_time: '2026-06-01 06:33' },
        { id: 3, content: 'Reached 4,000 lifetime spend', create_time: '2026-03-18 12:00' },
        { id: 2, content: 'Subscribed to email marketing', create_time: '2023-06-08 22:12' },
        { id: 1, content: 'Account created from Online Store', create_time: '2023-06-08 22:10' },
      ],
    },
    79388: {
      id: 79388, first_name: 'Ava', last_name: 'Johnson',
      email: 'ava.johnson@example.com', phone: '212 555 0199', phone_code: '1',
      account_status: 'registered', marketing_status: 'subscribed',
      orders_count: 21, total_spent: '5740.30', last_order_at: '2026-06-03 23:04',
      source: 'Online Store', create_time: '2022-09-25 17:48', last_time: '2026-06-03 22:51',
      note: 'Top customer. Comped shipping on the March return — see ticket #4821.',
      subscription: { subscribe_time: '2022-09-25 17:50' },
      location: { first_name: 'Ava', last_name: 'Johnson', detail: '350 5th Avenue', detail2: 'Suite 7800',
        city: 'New York', province: 'NY', post_code: '10118', country: 'United States',
        email: 'ava.johnson@example.com', phone: '212 555 0199', phone_code: '1' },
      logs: [
        { id: 6, content: 'Placed order SILIX1040', create_time: '2026-06-03 23:04' },
        { id: 5, content: 'Refund issued on SILIX0991 ($45.00)', create_time: '2026-03-12 15:20' },
        { id: 4, content: 'Reached 5,000 lifetime spend', create_time: '2026-01-09 08:30' },
        { id: 3, content: 'Updated phone number', create_time: '2025-07-22 19:05' },
        { id: 2, content: 'Subscribed to email marketing', create_time: '2022-09-25 17:50' },
        { id: 1, content: 'Account created from Online Store', create_time: '2022-09-25 17:48' },
      ],
    },
    80344: {
      id: 80344, first_name: '', last_name: '',
      email: 'guest.shopper.4471@example.com', phone: '', phone_code: '',
      account_status: 'guest', marketing_status: 'not_subscribed',
      orders_count: 1, total_spent: '74.90', last_order_at: '2026-05-18 16:02',
      source: 'Online Store', create_time: '2026-05-18 16:00', last_time: '2026-05-18 16:00',
      note: '',
      subscription: null,
      location: { first_name: 'Guest', last_name: '', detail: '120 Market Square', detail2: '',
        city: 'Toronto', province: 'ON', post_code: 'M5H 2N2', country: 'Canada',
        email: 'guest.shopper.4471@example.com', phone: '', phone_code: '' },
      logs: [
        { id: 2, content: 'Placed guest order SILIX1037', create_time: '2026-05-18 16:02' },
        { id: 1, content: 'Guest checkout started', create_time: '2026-05-18 16:00' },
      ],
    },
  };

  // ---- Per-customer order lists (CustomerOrderItem-shaped) ----
  // Faithful to type.ts CustomerOrderItem: numeric `status` + `paid` + `is_del` + `order_type`
  // drive the three status pills (OrderStatusCell / PaymentStatusCell / FulfillmentStatusCell).
  // status codes (order_type 0/2): 0 To ship, 1 Shipped, 2 Awaiting Review, 3 Done, -1 Refunded.
  // total_postage = shipping; orderDiscountInfo.shipping_discounts = free-shipping promos;
  // discount_info.discount_price / shipping_discount_total feed the TOTAL SAVINGS row.
  const ORDERS = {
    81245: [
      {
        order_id: 5042, order_sn: 'SILIX1042', create_time: '2026-06-04 14:22',
        status: 0, paid: 1, is_del: 0, order_type: 0,
        pay_price: '189.60', total_price: '199.60', total_num: 3, total_postage: '0.00',
        country_currency_dto: { currency_symbol: '$' },
        orderProduct: [
          { order_product_id: 9101, product_num: 1, product_price: '89.00', total_price: '99.00',
            cart_info: { product: { store_name: 'Linen Wrap Dress', image: '' }, productAttr: { sku: 'LWD-NAVY-M' } },
            discount_detail: { activity_name: 'Spring Sale', discount_amount: '10.00', discount_dimension: 2 } },
          { order_product_id: 9102, product_num: 2, product_price: '100.60', total_price: '100.60',
            cart_info: { product: { store_name: 'Cotton Crew Socks (3-pack)', image: '' }, productAttr: { sku: 'CCS-WHT' } } },
        ],
        orderDiscount: [{ activity_name: 'WELCOME5', discount_amount: '5.00', discount_dimension: 1, discount_form: 1 }],
        orderDiscountInfo: { shipping_discounts: [{ activity_name: 'Free Shipping', discount_amount: '8.00' }] },
        discount_info: { discount_price: '15.00', shipping_discount_total: '8.00' },
      },
      {
        order_id: 4418, order_sn: 'SILIX0418', create_time: '2024-03-11 09:55',
        status: 3, paid: 1, is_del: 0, order_type: 0,
        pay_price: '134.00', total_price: '134.00', total_num: 2, total_postage: '6.00',
        country_currency_dto: { currency_symbol: '$' },
        orderProduct: [
          { order_product_id: 8801, product_num: 2, product_price: '128.00', total_price: '128.00',
            cart_info: { product: { store_name: 'Merino Beanie', image: '' }, productAttr: { sku: 'MB-CHARCOAL' } } },
        ],
        orderDiscount: [],
      },
    ],
    80488: [
      {
        order_id: 5039, order_sn: 'SILIX1039', create_time: '2026-06-01 06:33',
        status: 1, paid: 1, is_del: 0, order_type: 0,
        pay_price: '342.00', total_price: '342.00', total_num: 4, total_postage: '0.00',
        country_currency_dto: { currency_symbol: '$' },
        orderProduct: [
          { order_product_id: 9301, product_num: 1, product_price: '210.00', total_price: '210.00',
            cart_info: { product: { store_name: 'Wool Overcoat', image: '' }, productAttr: { sku: 'WO-CAMEL-L' } } },
          { order_product_id: 9302, product_num: 3, product_price: '132.00', total_price: '132.00',
            cart_info: { product: { store_name: 'Leather Card Holder', image: '' }, productAttr: { sku: 'LCH-BLK' } } },
        ],
        orderDiscount: [],
      },
      {
        order_id: 5012, order_sn: 'SILIX1012', create_time: '2026-04-19 08:51',
        status: 0, paid: 0, is_del: 0, order_type: 0,
        pay_price: '96.00', total_price: '96.00', total_num: 1, total_postage: '6.00',
        country_currency_dto: { currency_symbol: '$' },
        orderProduct: [
          { order_product_id: 9201, product_num: 1, product_price: '90.00', total_price: '90.00',
            cart_info: { product: { store_name: 'Ribbed Turtleneck', image: '' }, productAttr: { sku: 'RT-GREY-M' } } },
        ],
        orderDiscount: [],
      },
    ],
    79388: [
      {
        order_id: 5040, order_sn: 'SILIX1040', create_time: '2026-06-03 23:04',
        status: 0, paid: 1, is_del: 0, order_type: 0,
        pay_price: '486.30', total_price: '521.30', total_num: 5, total_postage: '0.00',
        country_currency_dto: { currency_symbol: '$' },
        orderProduct: [
          { order_product_id: 9401, product_num: 1, product_price: '299.00', total_price: '329.00',
            cart_info: { product: { store_name: 'Cashmere Sweater', image: '' }, productAttr: { sku: 'CS-IVORY-S' } },
            discount_detail: { activity_name: 'Member Price', discount_amount: '30.00', discount_dimension: 2 } },
          { order_product_id: 9402, product_num: 4, product_price: '187.30', total_price: '192.30',
            cart_info: { product: { store_name: 'Silk Scarf', image: '' }, productAttr: { sku: 'SS-FLORAL' } } },
        ],
        orderDiscount: [{ activity_name: 'VIP10', discount_amount: '35.00', discount_dimension: 1, discount_form: 2 }],
        discount_info: { discount_price: '65.00', shipping_discount_total: '0.00' },
      },
      {
        order_id: 4991, order_sn: 'SILIX0991', create_time: '2026-03-12 14:40',
        status: -1, paid: 1, is_del: 0, order_type: 0,
        pay_price: '120.00', total_price: '120.00', total_num: 1, total_postage: '0.00',
        country_currency_dto: { currency_symbol: '$' },
        orderProduct: [
          { order_product_id: 8901, product_num: 1, product_price: '120.00', total_price: '120.00',
            cart_info: { product: { store_name: 'Quilted Tote Bag', image: '' }, productAttr: { sku: 'QTB-OLIVE' } } },
        ],
        orderDiscount: [],
      },
    ],
    80344: [
      {
        order_id: 5037, order_sn: 'SILIX1037', create_time: '2026-05-18 16:02',
        status: 3, paid: 1, is_del: 0, order_type: 0,
        pay_price: '74.90', total_price: '74.90', total_num: 1, total_postage: '0.00',
        country_currency_dto: { currency_symbol: '$' },
        orderProduct: [
          { order_product_id: 8701, product_num: 1, product_price: '74.90', total_price: '74.90',
            cart_info: { product: { store_name: 'Canvas Sneakers', image: '' }, productAttr: { sku: 'CS-WHT-42' } } },
        ],
        orderDiscount: [],
      },
    ],
  };

  window.DATA_CUSTOMERS = {
    KEYWORD_OPTIONS, MARKETING_OPTIONS, ACCOUNT_OPTIONS, TABS,
    CUSTOMERS, DETAILS, ORDERS,
  };
})();
