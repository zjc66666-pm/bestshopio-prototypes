/* BestShopio Admin · Settings prototype — sample data.
   Mirrors reference/bestvoy-admin web-antd settings module field shapes & copy:
     base/components/render.tsx + EditForm.tsx (config_function_settings,
       tab_oauth_google/_facebook, tab_google_tag)
     payments/components/* (tab_switch_payment_processor + tab_pay_stripe/
       _airwallex/_paypal — credentials live in per-provider modals)
     currency/index.vue + edit.vue (/country/currency/list, CurrencyItem)
     checkout/components/EditForm.tsx (tab_checkout_settings — ONLY the
       "Customize checkout" logo card; nothing else)
     metafields/components/* + admin/metafield.ts (definitions per owner_resource)
     shippableLocations/* + admin/shippableLocation.ts (/store/city/list table)
     shippingRates/* + settings/shippingRates.ts (profiles -> zones -> rates)
   SECURITY: no real secrets/keys. Secret-ish fields are masked ("sk_live_••••")
   or empty. App.js reads this global; nothing here is sent anywhere. */
window.DATA_SETTINGS = {
  // =========================================================================
  // NOTIFICATIONS (V1.141) — transactional email config, per store.
  //   Mirrors the PRD: shared brand tokens (eb_notification_brand) + per-event
  //   editable templates (eb_notification_template) + a starter template library
  //   (eb_notification_preset). Merge tags expand against order data; dynamic
  //   "block" tags render structured sections so the body can't be broken.
  //   Editing here is local-only (prototype) — nothing is sent anywhere.
  // =========================================================================
  notifications: {
    // shared brand — injected into every notification (set once, applies to all)
    brand: {
      storeName: 'Lovocross',
      logo: { name: 'lovocross-email-logo.png', set: true },
      primaryColor: '#0066e6',
      contactEmail: 'service@lovocross.com',
      footerText: 'Lovocross · All rights reserved.',
      address: '2261 Market St, San Francisco, CA 94114, US',
    },
    // store languages — single language for now (Silixwear-ES retired). Framework keeps locale capability.
    locales: [ { code: 'en', label: 'English' } ],
    // verified sending domain (custom domain DKIM is a roadmap item — see PRD §10)
    sendingDomain: 'mail.bestshopio.com',
    // merge tags offered by the "Insert variable" picker, by scope
    mergeTags: {
      common: ['store.name', 'store.url', 'store.contact_email', 'customer.name', 'customer.first_name', 'order.number', 'order.detail_url'],
      order_paid: ['order.subtotal', 'order.shipping', 'order.total', 'order.currency', 'order.shipping_address', 'order.payment_method'],
      order_shipped: ['shipment.tracking_number', 'shipment.carrier', 'shipment.tracking_url'],
    },
    // dynamic blocks (render to safe HTML — merchant inserts, never hand-codes the loop)
    blocks: {
      order_paid: [ { tag: 'block.order_summary', label: 'Order summary (items + totals)' }, { tag: 'block.shipping_address', label: 'Shipping address' }, { tag: 'block.line_items', label: 'Line items only' }, { tag: 'block.cta_button', label: 'Buttons (View order / Visit store)' } ],
      order_shipped: [ { tag: 'block.tracking', label: 'Tracking module' }, { tag: 'block.shipment_items', label: 'Items in this shipment' }, { tag: 'block.cta_button', label: 'Buttons (View order / Visit store)' } ],
    },
    // starter template library (platform-provided presets)
    presets: {
      order_paid: [
        { code: 'order_paid_minimal', name: 'Minimal', subject: 'Order #{{order.number}} confirmed',
          body: '<h2 class="nf-h">Order confirmed</h2>\n<p class="nf-lead">Hi {{customer.first_name}}, thanks for your order. We’re getting it ready and will email you tracking as soon as it ships.</p>\n{{block.cta_button}}\n{{block.order_summary}}\n{{block.shipping_address}}' },
        { code: 'order_paid_branded', name: 'Branded + thank-you', subject: 'Thank you for your order, {{customer.first_name}}!',
          body: '<h2 class="nf-h">Thanks for your order</h2>\n<p class="nf-lead">Your {{store.name}} order is confirmed and being packed with care. Here’s a summary of what’s on the way.</p>\n{{block.order_summary}}\n{{block.shipping_address}}\n{{block.cta_button}}\n<p class="nf-fine">Questions? Just reply to this email — we’re happy to help.</p>' },
      ],
      order_shipped: [
        { code: 'order_shipped_minimal', name: 'Minimal', subject: 'Your order #{{order.number}} is on its way',
          body: '<h2 class="nf-h">Your order has shipped</h2>\n<p class="nf-lead">Good news {{customer.first_name}} — your order is on its way. Track it anytime with the link below.</p>\n{{block.tracking}}\n{{block.cta_button}}' },
        { code: 'order_shipped_branded', name: 'Branded + items', subject: 'It’s on the way! Order #{{order.number}}',
          body: '<h2 class="nf-h">Your order has shipped</h2>\n<p class="nf-lead">Your {{store.name}} order is on its way. We’ll let you know the moment it’s delivered.</p>\n{{block.tracking}}\n{{block.shipment_items}}\n{{block.cta_button}}' },
      ],
    },
    // event catalog (grouped). config = the editable per-event template instance.
    groups: [
      { key: 'orders', label: 'Orders', events: [
        { code: 'order_paid', name: 'Order confirmation', cls: 'Transactional', priority: 'P0',
          desc: 'Sent to the customer right after payment succeeds.',
          config: { enabled: true, fromName: 'Lovocross', fromEmail: 'orders@mail.bestshopio.com', replyTo: 'service@lovocross.com',
            subject: 'Order #{{order.number}} confirmed', preheader: 'Thanks for your purchase — here are your order details.', updatedAt: '2026-06-09',
            body: '<h2 class="nf-h">Order confirmed</h2>\n<p class="nf-lead">Hi {{customer.first_name}}, thanks for your order. We’re getting it ready and will email you tracking as soon as it ships.</p>\n{{block.cta_button}}\n{{block.order_summary}}\n{{block.shipping_address}}' } },
        { code: 'order_shipped', name: 'Shipping confirmation', cls: 'Transactional', priority: 'P0',
          desc: 'Sent when the order is fulfilled, with tracking details.',
          config: { enabled: true, fromName: 'Lovocross', fromEmail: 'orders@mail.bestshopio.com', replyTo: 'service@lovocross.com',
            subject: 'Your order #{{order.number}} is on its way', preheader: 'Your order has shipped — track it here.', updatedAt: '2026-06-09',
            body: '<h2 class="nf-h">Your order has shipped</h2>\n<p class="nf-lead">Good news {{customer.first_name}} — your order is on its way. Track it anytime with the link below.</p>\n{{block.tracking}}\n{{block.cta_button}}' } },
        { code: 'order_refunded', name: 'Refund processed', cls: 'Transactional', priority: 'P1',
          desc: 'Sent when a refund is approved for the customer.',
          config: { enabled: false, fromName: 'Lovocross', fromEmail: 'orders@mail.bestshopio.com', replyTo: 'service@lovocross.com',
            subject: 'Your refund for order #{{order.number}}', preheader: 'We’ve processed your refund.', updatedAt: '',
            body: '<h2 class="nf-h">Refund processed</h2>\n<p class="nf-lead">Hi {{customer.first_name}}, we’ve processed a refund for order #{{order.number}}. It may take 3–5 business days to appear on your statement.</p>\n{{block.cta_button}}' } },
      ] },
      { key: 'account', label: 'Account', events: [
        { code: 'account_welcome', name: 'Welcome', cls: 'Transactional', priority: 'P1',
          desc: 'Sent after a customer creates an account.',
          config: { enabled: false, fromName: 'Lovocross', fromEmail: 'hello@mail.bestshopio.com', replyTo: 'service@lovocross.com',
            subject: 'Welcome to {{store.name}}', preheader: 'Your account is ready.', updatedAt: '',
            body: '<h2 class="nf-h">Welcome!</h2>\n<p class="nf-lead">Hi {{customer.first_name}}, welcome to {{store.name}}. Your account is ready — start exploring whenever you like.</p>\n{{block.cta_button}}' } },
        { code: 'email_verification', name: 'Email verification code', cls: 'Transactional', priority: 'P1',
          desc: 'One-time code for sign-up and password reset.',
          config: { enabled: false, fromName: 'Lovocross', fromEmail: 'hello@mail.bestshopio.com', replyTo: 'service@lovocross.com',
            subject: 'Your {{store.name}} verification code', preheader: 'Use this code to continue.', updatedAt: '',
            body: '<h2 class="nf-h">Verification code</h2>\n<p class="nf-lead">Hi {{customer.first_name}}, use the code below to verify your email. It expires in 10 minutes.</p>' } },
      ] },
      { key: 'marketing', label: 'Marketing', locked: true,
        note: 'Marketing emails need consent management and an unsubscribe center. Coming in a later release.',
        events: [
          { code: 'abandoned_cart', name: 'Abandoned cart', cls: 'Marketing', priority: 'P2', desc: 'Remind shoppers who left items in their cart.' },
          { code: 'back_in_stock', name: 'Back in stock', cls: 'Marketing', priority: 'P2', desc: 'Notify shoppers when a sold-out item returns.' },
          { code: 'review_request', name: 'Review request', cls: 'Marketing', priority: 'P2', desc: 'Ask for a review after delivery.' },
        ] },
    ],
  },

  // =========================================================================
  // BASE  (config_function_settings + tab_oauth_google / tab_oauth_facebook /
  //        tab_google_tag).  Page title in real admin: "Basic settings".
  // =========================================================================
  base: {
    store: {
      // site_logo (.png) / site_ico (.ico) / no_data_icon (.png) — URLs in prod.
      logo:   { name: 'site_logo.png', set: true,  rec: '112x40px',  format: 'png' },
      ico:    { name: 'favicon.ico',   set: true,  rec: '32x32px',   format: 'ico' },
      noData: { name: '',              set: false, rec: '274x274px', format: 'png' },
      // site_font (multi-select). Options come from the rule in prod.
      fonts: ['Inter', 'Playfair Display'],
      fontOptions: ['Inter', 'Playfair Display', 'Roboto', 'Lato', 'Merriweather', 'Source Sans 3'],
    },
    product: {
      // sys_reply_status / show_ot_price  ('1' on / '0' off)
      reviews:  { on: true,  desc: 'When enabled, product review information will be displayed on the homepage, product listing, and product detail pages.' },
      original: { on: true,  desc: 'When enabled, the original price and "off" discount label will be displayed for the product.' },
    },
    order: {
      // order_id_prefix / auto_close_order_timer (minutes, default 360) /
      // auto_take_order_timer (days, default 7)
      prefix: 'EN',
      autoCancelMinutes: 360,
      autoReceiveDays: 7,
    },
    // Social login — in the live admin only Google login is rendered (the
    // Facebook row is commented out in render.tsx). Secrets ALWAYS masked/empty.
    social: [
      {
        key: 'googleLogin', name: 'Google login', linked: true,
        modalTitle: 'Connect Google developer account',
        blurb: 'Allows users to sign up and login with their Google account.',
        fields: {
          // oauth_google_client_id / _client_secret / _redirect_uris
          appId: '8417263905-prototype.apps.googleusercontent.com',
          appSecret: 'GOCSPX-••••••••••••••••',           // masked
          redirectUris: 'https://silix.bestshopio.com/auth/google/callback',
        },
      },
    ],
    analytics: {
      // tab_google_tag -> google_measurement_id
      key: 'googleAnalytics', name: 'Google Analytics', linked: true,
      modalTitle: 'Connect Google developer account',
      blurb: 'Track store traffic & conversions by connecting Google Analytics.',
      measurementId: 'G-PROTO4XK2P',
    },
  },

  // =========================================================================
  // PAYMENTS  (tab_switch_payment_processor + tab_pay_airwallex/_stripe/_paypal)
  //   The page itself only persists the processor radio; each provider's
  //   credentials are entered in its own modal. Card order in real admin:
  //   Airwallex first, then Stripe. PayPal is a separate card.
  // =========================================================================
  payments: {
    activeProcessor: 'airwallex', // 'airwallex' | 'stripe' (payment_processor; default airwallex)
    processorOptions: [
      { label: 'Airwallex', value: 'airwallex' },
      { label: 'Stripe',    value: 'stripe' },
    ],
    // Card brand / wallet method chips shown under each card processor.
    cardMethods: ['Visa', 'Mastercard', 'American Express', 'Diners Club', 'Discover', 'UnionPay', 'JCB', 'Apple Pay', 'Google Pay', 'Afterpay', 'Klarna'],
    stripeExtraMethods: ['Link', 'Amazon Pay'],
    providers: {
      airwallex: {
        key: 'airwallexPayments', name: 'Airwallex', linked: false, kind: 'card',
        modalTitle: 'Connect Airwallex developer account',
        blurb: 'Allows users to pay with Visa, Master Card, American Express, Discover, Diners Club, JCB, Afterpay, Klarna, Apple Pay, Google Pay',
        fields: [
          // airwallex_client_id / _api_key / _base_url / _webhook_secret / _ip_whitelist
          { label: 'Client ID',                     value: '', secret: false },
          { label: 'App Key',                        value: '', secret: true },
          { label: 'API endpoints',                  value: '', secret: false, learnMore: 'https://www.airwallex.com/docs/api' },
          { label: 'Webhook Secret Key',             value: '', secret: true },
          { label: 'Webhook Whitelist IP addresses', value: '', secret: false, learnMore: 'https://www.airwallex.com/docs/developer-tools/webhooks/listen-for-webhook-events#whitelist-ip-addresses' },
        ],
        domainFile: '', // airwallex_domain_verification_file (zip up to 1MB)
      },
      stripe: {
        key: 'stripePayments', name: 'Stripe', linked: true, kind: 'card',
        modalTitle: 'Connect Stripe account',
        blurb: 'Allows users to pay with Card, Apple Pay, Google Pay, Link, Amazon Pay, and Klarna (where available).',
        fields: [
          // stripe_publishable_key / _secret_key / _webhook_secret
          { label: 'Publishable Key', value: 'pk_live_51PdQ8xK2Pj7nProto0a1b2c', secret: false },
          { label: 'Secret Key',      value: 'sk_live_••••••••••••••••••••',     secret: true },
          { label: 'Signing secret',  value: 'whsec_••••••••••••••••',           secret: true },
        ],
      },
    },
    paypal: {
      key: 'paypalPayments', name: 'PayPal', linked: true, kind: 'wallet',
      modalTitle: 'Connect Paypal developer account',
      blurb: 'Allows users to pay with PayPal.',
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
  // CURRENCY  (/country/currency/list)  — CurrencyItem shape.
  //   Columns: Country / Currency code / Currency symbol / Status /
  //   Exchange rate (text) / Price rounding (text) / Action.  No "Rate" column.
  // =========================================================================
  currency: {
    defaultCurrency: 'USD $',
    list: [
      // exchange_rate_type: 0 = automatic, 1 = manual (matches edit.vue)
      // exchange_rate_round_type: 0 = do not round, 1 = round up
      { id: 1, country_name: 'United States',  country_code: 'US', original_currency: 'USD', currency_code: 'USD', currency_symbol: '$',  currency_status: 1, exchange_rate_type: 0, exchange_rate_type_text: 'Automatic', exchange_rate: '1.0000',   exchange_rate_auto_value: '1.0000',   exchange_rate_round_type: 0, exchange_rate_round: 0, exchange_rate_round_type_text: 'Do not round prices',          exchange_rate_decimal: 2 },
      { id: 2, country_name: 'United Kingdom', country_code: 'GB', original_currency: 'USD', currency_code: 'GBP', currency_symbol: '£',  currency_status: 1, exchange_rate_type: 0, exchange_rate_type_text: 'Automatic', exchange_rate: '0.7820',   exchange_rate_auto_value: '0.7820',   exchange_rate_round_type: 1, exchange_rate_round: 1, exchange_rate_round_type_text: 'Round up to the nearest GBP £', exchange_rate_decimal: 2 },
      { id: 3, country_name: 'Eurozone',       country_code: 'EU', original_currency: 'USD', currency_code: 'EUR', currency_symbol: '€',  currency_status: 1, exchange_rate_type: 1, exchange_rate_type_text: 'Manual',    exchange_rate: '0.9200',   exchange_rate_auto_value: '0.9180',   exchange_rate_round_type: 1, exchange_rate_round: 1, exchange_rate_round_type_text: 'Round up to the nearest EUR €', exchange_rate_decimal: 2 },
      { id: 4, country_name: 'Canada',         country_code: 'CA', original_currency: 'USD', currency_code: 'CAD', currency_symbol: 'C$', currency_status: 1, exchange_rate_type: 0, exchange_rate_type_text: 'Automatic', exchange_rate: '1.3650',   exchange_rate_auto_value: '1.3650',   exchange_rate_round_type: 0, exchange_rate_round: 0, exchange_rate_round_type_text: 'Do not round prices',          exchange_rate_decimal: 2 },
      { id: 5, country_name: 'Australia',      country_code: 'AU', original_currency: 'USD', currency_code: 'AUD', currency_symbol: 'A$', currency_status: 0, exchange_rate_type: 0, exchange_rate_type_text: 'Automatic', exchange_rate: '1.5120',   exchange_rate_auto_value: '1.5120',   exchange_rate_round_type: 0, exchange_rate_round: 0, exchange_rate_round_type_text: 'Do not round prices',          exchange_rate_decimal: 2 },
      { id: 6, country_name: 'Japan',          country_code: 'JP', original_currency: 'USD', currency_code: 'JPY', currency_symbol: '¥',  currency_status: 1, exchange_rate_type: 1, exchange_rate_type_text: 'Manual',    exchange_rate: '157.4000', exchange_rate_auto_value: '157.1000', exchange_rate_round_type: 1, exchange_rate_round: 1, exchange_rate_round_type_text: 'Round up to the nearest JPY ¥', exchange_rate_decimal: 0 },
      { id: 7, country_name: 'Singapore',      country_code: 'SG', original_currency: 'USD', currency_code: 'SGD', currency_symbol: 'S$', currency_status: 0, exchange_rate_type: 0, exchange_rate_type_text: 'Automatic', exchange_rate: '1.3480',   exchange_rate_auto_value: '1.3480',   exchange_rate_round_type: 0, exchange_rate_round: 0, exchange_rate_round_type_text: 'Do not round prices',          exchange_rate_decimal: 2 },
    ],
    // search bar (SearchForm.vue): field selector + keyword + Status + Exchange rate
    searchFieldOptions: [
      { label: 'Country',         value: 'country_name' },
      { label: 'Currency code',   value: 'currency_code' },
      { label: 'Currency symbol', value: 'currency_symbol' },
    ],
  },

  // =========================================================================
  // CHECKOUT  (tab_checkout_settings).  The live admin Checkout page is ONLY
  //   the "Customize checkout" logo card — there is NO cart / shipping / gift
  //   card / order-note section.
  // =========================================================================
  checkout: {
    logo: {
      set: false, // checkout_logo (falls back to store logo)
      width: 300,              // checkout_width  (50–300 px, default 300)
      alignment: 'center',     // checkout_logo_alignment
      position: 'checkout_form', // checkout_logo_position
      alignmentOptions: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }],
      positionOptions: [{ value: 'checkout_form', label: 'Checkout form' }, { value: 'order_summary', label: 'Order summary' }],
    },
  },

  // =========================================================================
  // METAFIELDS  (admin/metafield.ts).  Resource picker -> definitions list
  //   (Name / Data Type / Used in) -> add/edit form. No namespace.key column,
  //   no System pill in the list.  "Used in" = value_count.
  // =========================================================================
  metafields: {
    resources: [
      { key: 'products', title: 'Product',          badge: '',    desc: 'Define metafields that apply to products.' },
      { key: 'variants', title: 'Product variants', badge: 'SKU', desc: 'Define metafields that apply to product variants.' },
    ],
    // definitions per owner_resource. typeLabel = type_label; usedIn = value_count.
    definitions: {
      products: [
        { id: 101, name: 'Care instructions', type: 'multi_line_text',  typeLabel: 'Multi-line text', usedIn: 128 },
        { id: 102, name: 'Country of origin', type: 'single_line_text', typeLabel: 'Single line text', usedIn: 96 },
        { id: 103, name: 'Warranty period',   type: 'number_integer',   typeLabel: 'Integer',          usedIn: 54 },
        { id: 104, name: 'Is eco-friendly',   type: 'boolean',          typeLabel: 'True / false',     usedIn: 41 },
        { id: 105, name: 'Spec sheet',        type: 'url',              typeLabel: 'URL',              usedIn: 33 },
      ],
      variants: [
        { id: 201, name: 'Net weight',     type: 'weight',           typeLabel: 'Weight',           usedIn: 312 },
        { id: 202, name: 'Box dimensions', type: 'dimension',        typeLabel: 'Dimension',        usedIn: 188 },
        { id: 203, name: 'Barcode (UPC)',  type: 'single_line_text', typeLabel: 'Single line text', usedIn: 405 },
      ],
    },
    // type picker for the add-definition form (getMetafieldTypes — grouped).
    typeOptions: [
      { group: 'Text',   types: [ { type: 'single_line_text', label: 'Single line text' }, { type: 'multi_line_text', label: 'Multi-line text' } ] },
      { group: 'Number', types: [ { type: 'number_integer', label: 'Integer' }, { type: 'number_decimal', label: 'Decimal' }, { type: 'money', label: 'Money' } ] },
      { group: 'Other',  types: [ { type: 'boolean', label: 'True / false' }, { type: 'choice_list', label: 'Choice list' }, { type: 'date', label: 'Date' }, { type: 'date_time', label: 'Date and time' }, { type: 'url', label: 'URL' }, { type: 'json', label: 'JSON' }, { type: 'weight', label: 'Weight' }, { type: 'dimension', label: 'Dimension' } ] },
    ],
  },

  // =========================================================================
  // SHIPPABLE LOCATIONS  ("Ship locations", /store/city/list).  Expandable
  //   table (continent > country > province): Country/Region / Located in /
  //   Status (is_show -> Visible/Hidden) / Sort / Action (edit+delete).
  // =========================================================================
  locations: {
    // top-level rows; children are lazy-loaded in prod (here inlined).
    tree: [
      {
        id: 1, name: 'North America', level: 1, code: '', is_show: 1, sort: 100, snum: 3, located_in: '', children: [
          { id: 11, name: 'United States', level: 2, code: 'US', is_show: 1, sort: 30, snum: 4, located_in: 'North America', children: [
            { id: 111, name: 'California', level: 3, code: 'US-CA', is_show: 1, sort: 0, located_in: 'North America > United States' },
            { id: 112, name: 'New York',   level: 3, code: 'US-NY', is_show: 1, sort: 0, located_in: 'North America > United States' },
            { id: 113, name: 'Texas',      level: 3, code: 'US-TX', is_show: 1, sort: 0, located_in: 'North America > United States' },
            { id: 114, name: 'Hawaii',     level: 3, code: 'US-HI', is_show: 0, sort: 0, located_in: 'North America > United States' },
          ] },
          { id: 12, name: 'Canada', level: 2, code: 'CA', is_show: 1, sort: 20, snum: 3, located_in: 'North America', children: [
            { id: 121, name: 'Ontario',          level: 3, code: 'CA-ON', is_show: 1, sort: 0, located_in: 'North America > Canada' },
            { id: 122, name: 'British Columbia', level: 3, code: 'CA-BC', is_show: 1, sort: 0, located_in: 'North America > Canada' },
            { id: 123, name: 'Quebec',           level: 3, code: 'CA-QC', is_show: 0, sort: 0, located_in: 'North America > Canada' },
          ] },
          { id: 13, name: 'Mexico', level: 2, code: 'MX', is_show: 0, sort: 0, snum: 0, located_in: 'North America' },
        ],
      },
      {
        id: 2, name: 'Europe', level: 1, code: '', is_show: 1, sort: 90, snum: 4, located_in: '', children: [
          { id: 21, name: 'United Kingdom', level: 2, code: 'GB', is_show: 1, sort: 0, snum: 0, located_in: 'Europe' },
          { id: 22, name: 'Germany',        level: 2, code: 'DE', is_show: 1, sort: 0, snum: 0, located_in: 'Europe' },
          { id: 23, name: 'France',         level: 2, code: 'FR', is_show: 1, sort: 0, snum: 0, located_in: 'Europe' },
          { id: 24, name: 'Spain',          level: 2, code: 'ES', is_show: 0, sort: 0, snum: 0, located_in: 'Europe' },
        ],
      },
      {
        id: 3, name: 'Asia Pacific', level: 1, code: '', is_show: 0, sort: 0, snum: 3, located_in: '', children: [
          { id: 31, name: 'Australia', level: 2, code: 'AU', is_show: 1, sort: 0, snum: 0, located_in: 'Asia Pacific' },
          { id: 32, name: 'Japan',     level: 2, code: 'JP', is_show: 0, sort: 0, snum: 0, located_in: 'Asia Pacific' },
          { id: 33, name: 'Singapore', level: 2, code: 'SG', is_show: 0, sort: 0, snum: 0, located_in: 'Asia Pacific' },
        ],
      },
    ],
  },

  // =========================================================================
  // SHIPPING RATES  (shippingRates.ts — profiles -> zones -> rates).
  //   condition_type: 'none' | 'weight' | 'price' ; price 0 => Free.
  // =========================================================================
  rates: {
    currencySymbol: '$',
    profiles: [
      {
        id: 1, name: 'General shipping rates', is_general: 1,
        zones_count: 3, products_count: 0, regions_count: 28,
        zones: [
          {
            id: 11, name: 'United States', areas: ['United States'],
            rates: [
              { id: 111, name: 'Standard (5-8 business days)', condition_type: 'price',  min_value: 0,   max_value: 50,   price: 6.99 },
              { id: 112, name: 'Free shipping over $50',       condition_type: 'price',  min_value: 50,  max_value: null, price: 0 },
              { id: 113, name: 'Express (2-3 business days)',  condition_type: 'none',   min_value: null, max_value: null, price: 14.99 },
            ],
          },
          {
            id: 12, name: 'Canada', areas: ['Canada'],
            rates: [
              { id: 121, name: 'Standard (7-12 business days)', condition_type: 'weight', min_value: 0,    max_value: 1000, price: 9.99 },
              { id: 122, name: 'Heavy parcel (over 1kg)',       condition_type: 'weight', min_value: 1000, max_value: null, price: 19.99 },
            ],
          },
          {
            id: 13, name: 'Europe', areas: ['United Kingdom', 'Germany', 'France'],
            rates: [], // intentionally empty -> "no rates" warning state
          },
        ],
      },
      {
        id: 2, name: 'Oversized furniture', is_general: 0,
        zones_count: 1, products_count: 12, regions_count: 2,
        // custom-profile products (custom/ProductsPanel — store_name + variants)
        products: [
          { product_id: 9001, store_name: 'Sectional sofa — 3 seat', spec_type: 1, variantNum: 4 },
          { product_id: 9002, store_name: 'Oak dining table', spec_type: 0, variantNum: 0 },
        ],
        zones: [
          {
            id: 21, name: 'United States', areas: ['United States'],
            rates: [
              { id: 211, name: 'Freight delivery', condition_type: 'price', min_value: 0, max_value: null, price: 79.0 },
            ],
          },
        ],
      },
    ],
    // areas not covered by any zone (NoChargeAreas) — derived in prod.
    noChargeAreas: ['Mexico', 'Spain', 'Australia', 'Japan', 'Singapore'],
    // ShippingRateNameSelect suggestions (getShippingRateExistNames)
    rateNameSuggestions: ['Standard', 'Express', 'Economy', 'Free shipping', 'Next day delivery', 'Local pickup'],
  },
};
