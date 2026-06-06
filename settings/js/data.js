/* BestShopio Admin · Settings prototype — sample data.
   Mirrors reference/bestvoy-admin web-antd settings module field shapes:
     base.ts / payments.ts / currency.ts / checkout.ts / shippingRates.ts
     + admin/metafield.ts + admin/shippableLocation.ts
   SECURITY: no real secrets/keys. Every secret-ish field is masked ("sk_live_••••")
   or empty. App.js reads this global; nothing here is sent anywhere. */
window.DATA_SETTINGS = {
  // ---- the 7-tab left rail (each drives an internal hash sub-route #/<key>) ----
  TABS: [
    { key: 'base',        label: 'Base',                icon: 'store',    desc: 'Store identity, social login and analytics' },
    { key: 'payments',    label: 'Payments',            icon: 'card',     desc: 'Card processor and PayPal' },
    { key: 'currency',    label: 'Currency',            icon: 'coins',    desc: 'Multi-currency and exchange rates' },
    { key: 'checkout',    label: 'Checkout',            icon: 'cart',     desc: 'Cart rules, gift card and order notes' },
    { key: 'metafields',  label: 'Metafields',          icon: 'braces',   desc: 'Custom fields for products and variants' },
    { key: 'locations',   label: 'Shippable locations', icon: 'pin',      desc: 'Countries and states you ship to' },
    { key: 'rates',       label: 'Shipping rates',      icon: 'truck',    desc: 'Profiles, zones and rates' },
  ],

  // =========================================================================
  // BASE  (config_function_settings + tab_oauth_google / tab_oauth_facebook /
  //        tab_google_tag)
  // =========================================================================
  base: {
    store: {
      // site_logo / site_ico / no_data_icon are URLs in prod; here we show
      // upload widgets with a small live preview where one is "set".
      logo:    { name: 'site_logo.png',   set: true,  rec: '112x40px',   format: 'png' },
      favicon: { name: 'favicon.ico',     set: true,  rec: '32x32px',    format: 'ico' },
      noData:  { name: '',                set: false, rec: '274x274px',  format: 'png' },
      fonts: ['Inter', 'Playfair Display'],
      fontOptions: ['Inter', 'Playfair Display', 'Roboto', 'Lato', 'Merriweather', 'Source Sans 3'],
    },
    product: {
      // sys_reply_status / show_ot_price / show_vendor_switch
      reviews:  { on: true,  desc: 'When enabled, product review information is displayed on the homepage, product listing and product detail pages.' },
      original: { on: true,  desc: 'When enabled, the original price and "off" discount label are displayed for the product.' },
      vendor:   { on: false, desc: 'When enabled, product vendor information is displayed on the homepage, product listing and product detail page.' },
    },
    order: {
      // order_id_prefix / auto_close_order_timer (minutes) / auto_take_order_timer (days)
      prefix: 'EN',
      autoCancelMinutes: 360,
      autoReceiveDays: 7,
    },
    // social login + analytics — secrets ALWAYS masked / empty
    social: [
      {
        key: 'google', name: 'Google login', linked: true,
        desc: 'Allows users to sign up and log in with their Google account.',
        fields: {
          // oauth_google_client_id / _client_secret / _redirect_uris
          appId: '8417263905-prototype.apps.googleusercontent.com',
          appSecret: 'GOCSPX-••••••••••••••••',           // masked
          redirectUris: 'https://silix.bestshopio.com/auth/google/callback',
        },
      },
      {
        key: 'facebook', name: 'Facebook login', linked: false,
        desc: 'Allows users to sign up and log in with their Facebook account.',
        fields: { appId: '', appSecret: '', redirectUris: '' },
      },
    ],
    analytics: {
      // tab_google_tag -> google_measurement_id
      key: 'ga4', name: 'Google Analytics', linked: true,
      desc: 'Track store traffic and conversions by connecting Google Analytics (GA4).',
      measurementId: 'G-PROTO4XK2P',
    },
  },

  // =========================================================================
  // PAYMENTS  (tab_switch_payment_processor + tab_pay_stripe / _airwallex / _paypal)
  //   Only ONE card processor is active at a time (Stripe XOR Airwallex).
  //   PayPal is a separate, independently-connected method.
  // =========================================================================
  payments: {
    activeProcessor: 'stripe', // 'stripe' | 'airwallex'  (payment_processor)
    cardMethods: ['Visa', 'Mastercard', 'American Express', 'Discover', 'Diners Club', 'JCB', 'UnionPay', 'Apple Pay', 'Google Pay', 'Afterpay', 'Klarna'],
    providers: {
      stripe: {
        key: 'stripe', name: 'Stripe', linked: true, kind: 'card',
        blurb: 'Allows users to pay with Card, Apple Pay, Google Pay, Link, Amazon Pay and Klarna (where available).',
        extraMethods: ['Link', 'Amazon Pay'],
        fields: [
          // stripe_publishable_key / _secret_key / _webhook_secret
          { label: 'Publishable Key', value: 'pk_live_51PdQ8xK2Pj7nProto0a1b2c', secret: false },
          { label: 'Secret Key',      value: 'sk_live_••••••••••••••••••••', secret: true },
          { label: 'Signing secret',  value: 'whsec_••••••••••••••••',       secret: true },
        ],
      },
      airwallex: {
        key: 'airwallex', name: 'Airwallex', linked: false, kind: 'card',
        blurb: 'Allows users to pay with Visa, Mastercard, American Express, Discover, Diners Club, JCB, Afterpay, Klarna, Apple Pay and Google Pay.',
        extraMethods: [],
        fields: [
          // airwallex_client_id / _api_key / _base_url / _webhook_secret / _ip_whitelist
          { label: 'Client ID',                       value: '', secret: false },
          { label: 'App Key',                          value: '', secret: true },
          { label: 'API endpoints',                    value: '', secret: false, learnMore: 'https://www.airwallex.com/docs/api' },
          { label: 'Webhook Secret Key',               value: '', secret: true },
          { label: 'Webhook Whitelist IP addresses',   value: '', secret: false },
        ],
        domainFile: '',
      },
    },
    paypal: {
      key: 'paypal', name: 'PayPal', linked: true, kind: 'wallet',
      blurb: 'Allows users to pay with PayPal (Buy Now and Pay Later).',
      mode: 'live', // live | sandbox  (paypal_mode)
      fields: [
        // paypal_client_id / _client_secret / _webhook_secret
        { label: 'Client ID',  value: 'Aa1bProtoClientId2c3dXXXXXXXXXXXXXXXXXXXXXXXXXXXX', secret: false },
        { label: 'Secret key', value: 'EL••••••••••••••••••••••••', secret: true },
        { label: 'Webhook ID', value: '5GA••••••••••••', secret: true },
      ],
    },
  },

  // =========================================================================
  // CURRENCY  (/country/currency/list)  — CurrencyItem shape
  // =========================================================================
  currency: {
    defaultCurrency: 'USD $',
    list: [
      // exchange_rate_type: 0 = automatic, 1 = manual
      { id: 1, country: 'United States',  code: 'USD', symbol: '$',  status: 1, rateType: 'Automatic', rate: '1.0000',   rounding: 'Do not round prices',                decimal: 2, base: true },
      { id: 2, country: 'United Kingdom', code: 'GBP', symbol: '£',  status: 1, rateType: 'Automatic', rate: '0.7820',   rounding: 'Round up to the nearest £',          decimal: 2 },
      { id: 3, country: 'Eurozone',       code: 'EUR', symbol: '€',  status: 1, rateType: 'Manual',    rate: '0.9200',   rounding: 'Round up to the nearest €',          decimal: 2 },
      { id: 4, country: 'Canada',         code: 'CAD', symbol: 'C$', status: 1, rateType: 'Automatic', rate: '1.3650',   rounding: 'Do not round prices',                decimal: 2 },
      { id: 5, country: 'Australia',      code: 'AUD', symbol: 'A$', status: 0, rateType: 'Automatic', rate: '1.5120',   rounding: 'Do not round prices',                decimal: 2 },
      { id: 6, country: 'Japan',          code: 'JPY', symbol: '¥',  status: 1, rateType: 'Manual',    rate: '157.4000', rounding: 'Round up to the nearest ¥',          decimal: 0 },
      { id: 7, country: 'Singapore',      code: 'SGD', symbol: 'S$', status: 0, rateType: 'Automatic', rate: '1.3480',   rounding: 'Do not round prices',                decimal: 2 },
    ],
  },

  // =========================================================================
  // CHECKOUT  (tab_checkout_settings: logo customization)  +  cart / gift card /
  //   order-note rules (faithful spec extension on top of the logo card)
  // =========================================================================
  checkout: {
    logo: {
      set: false, // checkout_logo (falls back to store logo)
      width: 220,              // checkout_width  (50–300 px)
      alignment: 'center',     // checkout_logo_alignment
      position: 'checkout_form', // checkout_logo_position
      alignmentOptions: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }],
      positionOptions: [{ value: 'checkout_form', label: 'Checkout form' }, { value: 'order_summary', label: 'Order summary' }],
    },
    cart: {
      minOrderEnabled: true,
      minOrderAmount: 25,
      maxQtyPerItem: 10,
      autoEmptyHours: 72, // abandoned-cart auto empty
    },
    orderNote: {
      enabled: true,
      required: false,
      label: 'Order note',
      placeholder: 'Add a note to your order (optional)',
      maxLength: 200,
    },
    giftCard: {
      enabled: true,
      allowAtCheckout: true,
      expiryMonths: 24,
    },
    shippingMethod: 'flat', // default presentation: 'flat' | 'calculated' | 'pickup'
    shippingMethodOptions: [
      { value: 'flat',       label: 'Flat rate (from Shipping rates)' },
      { value: 'calculated', label: 'Carrier-calculated' },
      { value: 'pickup',     label: 'Local pickup only' },
    ],
    tipping: false,
  },

  // =========================================================================
  // METAFIELDS  (admin/metafield.ts)  — definitions per owner_resource
  // =========================================================================
  metafields: {
    resources: [
      { key: 'products', title: 'Product',          desc: 'Define metafields that apply to products.' },
      { key: 'variants', title: 'Product variants', desc: 'Define metafields that apply to product variants.' },
    ],
    // namespace.key + type + system flag (is_system)
    definitions: {
      products: [
        { id: 101, name: 'Care instructions', nsKey: 'custom.care_instructions', type: 'multi_line_text', typeLabel: 'Multi-line text', system: false, usedIn: 128 },
        { id: 102, name: 'Country of origin', nsKey: 'custom.country_of_origin', type: 'single_line_text', typeLabel: 'Single line text', system: false, usedIn: 96 },
        { id: 103, name: 'Warranty period',   nsKey: 'custom.warranty_months',   type: 'number_integer',   typeLabel: 'Integer',          system: false, usedIn: 54 },
        { id: 104, name: 'Is eco-friendly',   nsKey: 'custom.is_eco_friendly',   type: 'boolean',          typeLabel: 'True / false',     system: false, usedIn: 41 },
        { id: 105, name: 'Google: Age group', nsKey: 'google.age_group',         type: 'choice_list',      typeLabel: 'Choice list',      system: true,  usedIn: 210 },
        { id: 106, name: 'Spec sheet',        nsKey: 'custom.spec_sheet_url',    type: 'url',              typeLabel: 'URL',              system: false, usedIn: 33 },
      ],
      variants: [
        { id: 201, name: 'Net weight',     nsKey: 'custom.net_weight',     type: 'weight',           typeLabel: 'Weight',           system: false, usedIn: 312 },
        { id: 202, name: 'Box dimensions', nsKey: 'custom.box_dimensions', type: 'dimension',        typeLabel: 'Dimension',        system: false, usedIn: 188 },
        { id: 203, name: 'Barcode (UPC)',  nsKey: 'custom.upc',            type: 'single_line_text', typeLabel: 'Single line text', system: false, usedIn: 405 },
        { id: 204, name: 'Google: Color',  nsKey: 'google.color',          type: 'single_line_text', typeLabel: 'Single line text', system: true,  usedIn: 405 },
      ],
    },
    // type picker for the add-definition modal (admin/metafield const EnumType)
    typeOptions: [
      { group: 'Text',   types: [ { type: 'single_line_text', label: 'Single line text' }, { type: 'multi_line_text', label: 'Multi-line text' } ] },
      { group: 'Number', types: [ { type: 'number_integer', label: 'Integer' }, { type: 'number_decimal', label: 'Decimal' }, { type: 'money', label: 'Money' } ] },
      { group: 'Other',  types: [ { type: 'boolean', label: 'True / false' }, { type: 'choice_list', label: 'Choice list' }, { type: 'date', label: 'Date' }, { type: 'date_time', label: 'Date and time' }, { type: 'url', label: 'URL' }, { type: 'json', label: 'JSON' }, { type: 'weight', label: 'Weight' }, { type: 'dimension', label: 'Dimension' } ] },
    ],
  },

  // =========================================================================
  // SHIPPABLE LOCATIONS  (admin/shippableLocation.ts — /store/city/list tree)
  //   Checkable continent > country > state tree; is_show drives "shippable".
  // =========================================================================
  locations: {
    tree: [
      {
        id: 1, name: 'North America', level: 1, shippable: true, children: [
          { id: 11, name: 'United States', code: 'US', level: 2, shippable: true, children: [
            { id: 111, name: 'California', code: 'US-CA', level: 3, shippable: true },
            { id: 112, name: 'New York',   code: 'US-NY', level: 3, shippable: true },
            { id: 113, name: 'Texas',      code: 'US-TX', level: 3, shippable: true },
            { id: 114, name: 'Hawaii',     code: 'US-HI', level: 3, shippable: false },
          ] },
          { id: 12, name: 'Canada', code: 'CA', level: 2, shippable: true, children: [
            { id: 121, name: 'Ontario',          code: 'CA-ON', level: 3, shippable: true },
            { id: 122, name: 'British Columbia', code: 'CA-BC', level: 3, shippable: true },
            { id: 123, name: 'Quebec',           code: 'CA-QC', level: 3, shippable: false },
          ] },
          { id: 13, name: 'Mexico', code: 'MX', level: 2, shippable: false },
        ],
      },
      {
        id: 2, name: 'Europe', level: 1, shippable: true, children: [
          { id: 21, name: 'United Kingdom', code: 'GB', level: 2, shippable: true },
          { id: 22, name: 'Germany',        code: 'DE', level: 2, shippable: true },
          { id: 23, name: 'France',         code: 'FR', level: 2, shippable: true },
          { id: 24, name: 'Spain',          code: 'ES', level: 2, shippable: false },
        ],
      },
      {
        id: 3, name: 'Asia Pacific', level: 1, shippable: false, children: [
          { id: 31, name: 'Australia', code: 'AU', level: 2, shippable: true },
          { id: 32, name: 'Japan',     code: 'JP', level: 2, shippable: false },
          { id: 33, name: 'Singapore', code: 'SG', level: 2, shippable: false },
        ],
      },
    ],
  },

  // =========================================================================
  // SHIPPING RATES  (shippingRates.ts — profiles -> zones -> rates)
  //   condition_type: 'none' | 'weight' | 'price' ; price 0 => Free
  // =========================================================================
  rates: {
    currencySymbol: '$',
    profiles: [
      {
        id: 1, name: 'General shipping rates', general: true,
        desc: 'All products that are not in other shipping profiles.',
        productsCount: 0, regionsCount: 28,
        zones: [
          {
            id: 11, name: 'United States', areas: ['United States'],
            rates: [
              { id: 111, name: 'Standard (5–8 business days)', condition_type: 'price',  min_value: 0,   max_value: 50, price: 6.99 },
              { id: 112, name: 'Free shipping over $50',       condition_type: 'price',  min_value: 50,  max_value: null, price: 0 },
              { id: 113, name: 'Express (2–3 business days)',  condition_type: 'none',   min_value: null, max_value: null, price: 14.99 },
            ],
          },
          {
            id: 12, name: 'Canada', areas: ['Canada'],
            rates: [
              { id: 121, name: 'Standard (7–12 business days)', condition_type: 'weight', min_value: 0,    max_value: 1000, price: 9.99 },
              { id: 122, name: 'Heavy parcel (over 1kg)',       condition_type: 'weight', min_value: 1000, max_value: null, price: 19.99 },
            ],
          },
          {
            id: 13, name: 'Europe', areas: ['United Kingdom', 'Germany', 'France'],
            rates: [], // intentionally empty -> "missing rates" warning state
          },
        ],
        // no_charge_areas / areas_without_rates
        noChargeAreas: ['Mexico', 'Spain', 'Australia', 'Japan', 'Singapore'],
      },
      {
        id: 2, name: 'Oversized furniture', general: false,
        desc: 'Custom rates for a group of products.',
        productsCount: 12, regionsCount: 2,
        zones: [
          {
            id: 21, name: 'United States', areas: ['United States'],
            rates: [
              { id: 211, name: 'Freight delivery', condition_type: 'price', min_value: 0, max_value: null, price: 79.0 },
            ],
          },
        ],
        noChargeAreas: [],
      },
    ],
    rateNameSuggestions: ['Standard', 'Express', 'Economy', 'Free shipping', 'Next day delivery', 'Local pickup'],
  },
};
