/* BestShopio Admin · Settings prototype — sample data.
   Mirrors reference/bestvoy-admin web-antd settings module field shapes & copy:
     base/components/render.tsx + EditForm.tsx (config_function_settings,
       tab_oauth_google/_facebook)
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
  // NOTIFICATIONS — store-level sender identity + native transactional email.
  // Bestreach returns the verification records. This surface never owns the
  // storefront/checkout domain, DNS, or SSL lifecycle.
  // =========================================================================
  notifications: {
    // shared brand — injected into every notification (set once, applies to all)
    brand: {
      storeName: 'Lovocross',
      logo: { name: 'lovocross-email-logo.png', set: true },
      primaryColor: '#0066e6',
      // A configured service inbox may be added later. Until then, transactional
      // emails use the address of the account that registered this store.
      contactEmail: '',
      storeOwnerEmail: 'zjc66666@gmail.com',
      footerText: 'Lovocross · All rights reserved.',
      address: '2261 Market St, San Francisco, CA 94114, US',
    },
    // store languages — single language for now (Silixwear-ES retired). Framework keeps locale capability.
    locales: [ { code: 'en', label: 'English' } ],
    // One sender identity is shared by all shop transactional messages.
    sender: {
      activeDomainId: 'lovocross-bestshopio-default',
      // Bestreach currently has no store-creation API. All BestShopio stores use
      // this shared technical container; merchant/store ownership stays in BestShopio.
      bestreachStoreId: 'bestshopio-shared-sender-store',
      // The platform domain is shared. This store-owned prefix is provisioned once and cannot be edited.
      platformLocalPart: 'lovocross',
      profile: { fromName: 'Lovocross', localPart: 'lovocross', replyTo: '' },
      domains: [
        { id: 'lovocross-bestshopio-default', domain: 'mail.bestshopio.com', status: 'platform', default: true, records: [] },
      ],
    },
    deliveryLog: [],
    groups: [
      { key: 'transactional', label: 'Transactional emails', events: [
        // `order_paid` remains the prototype/template route key for compatibility.
        // Production dispatch must subscribe to `trigger`, not to the first payment event.
        { code: 'order_paid', name: 'Order confirmation', cls: 'Transactional', priority: 'P0',
          trigger: 'order.purchase_finalized',
          desc: 'Sent once after post-purchase offers finish and the final order total is confirmed.',
          config: { enabled: true, subject: 'Order #{{order.number}} confirmed', preheader: 'Thanks for your purchase — here are your order details.',
            headline: 'Thank you for your order!', copy: 'We’ve received your payment and your order is being prepared. We’ll send tracking details when it ships.', updatedAt: '2026-07-27' } },
        { code: 'order_shipped', name: 'Shipping confirmation', cls: 'Transactional', priority: 'P0',
          desc: 'Sent when the order is fulfilled, with tracking details.',
          config: { enabled: true, subject: 'A shipment from order #{{order.number}} is on the way', preheader: 'Your order is on the way. Track your shipment to see the delivery status.',
            headline: 'Your order is on the way', copy: 'Your order is on the way. Track your shipment to see the delivery status.', updatedAt: '2026-07-27' } },
        { code: 'order_refunded', name: 'Order refund', cls: 'Transactional', priority: 'P1',
          desc: 'Sent when a refund is approved for the customer.',
          config: { enabled: false, subject: 'Refund notification', preheader: 'Total amount refunded: {{refund.amount}}. It may take up to 10 days for this refund to appear in your account.',
            headline: 'Your order has been refunded', copy: 'Total amount refunded: {{refund.amount}}. It may take up to 10 days for this refund to appear in your account.', updatedAt: '' } },
      ] },
      { key: 'account', label: 'Account', events: [
        { code: 'account_welcome', name: 'Welcome', cls: 'Transactional', priority: 'P1',
          desc: 'Sent after a customer creates an account.',
          config: { enabled: false, subject: 'Customer account confirmation', preheader: 'You\'ve activated your customer account. Next time you shop with us, log in for faster checkout.',
            headline: 'Welcome to {{store.name}}!', copy: 'You\'ve activated your customer account. Next time you shop with us, log in for faster checkout.', updatedAt: '' } },
        { code: 'email_verification', name: 'Email verification code', cls: 'Transactional', priority: 'P1', required: true,
          desc: 'One-time code for password reset.',
          config: { enabled: true, subject: '{{verification.code}} is your code', preheader: 'Use this code to continue.',
            headline: 'Verification code', copy: 'Hi {{customer.first_name}}, use the code below to verify your email. It expires in 10 minutes.', updatedAt: '' } },
      ] },
    ],
  },

  // =========================================================================
  // BASE  (config_function_settings + tab_oauth_google / tab_oauth_facebook).
  // Page title in real admin: "Basic settings".
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
    // Bestfulfill OMS identifiers. These stay blank until the merchant maps
    // this store to its fulfillment ERP.
    bestfulfill: {
      omsStoreId: '',
      omsIdentifier: '',
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
  },

  // =========================================================================
  // PAYMENTS  (tab_switch_payment_processor + tab_pay_airwallex/_stripe/_paypal)
  //   The page itself only persists the processor radio; each provider's
  //   credentials are entered in its own modal. Card-processor chip order matches
  //   live admin: Airwallex, Stripe, PayPal, Adyen, Checkout, NMI, Braintree,
  //   Mollie, Oceanpayment, then Tazapay, Square, Poynt. Prototype-only processors
  //   stay after Poynt. PayPal contributes one shared account to
  //   both PayPal Wallet and (when eligible) the primary Cards slot.
  // =========================================================================
  // v2 渠道/方式模型（见 app.js renderPayments + docs/支付对接现状_Stripe_Airwallex.md）
  //   卡+Express = 单处理方槽位（cardProcessor，仅 active 一个）；PayPal Wallet /
  //   Klarna 自有直连为独立方式。PayPal Cards 复用 PayPal 账户，但仍受主卡槽位互斥约束。
  //   phase 1 = 上线版（3 BYO）；phase 2 = 渠道扩展（更多 PSP + Klarna 直连）。
  payments: {
    phase: 1,                 // 1 = 一期上线版；2 = 二期渠道扩展（演示路线图）
    cardProcessor: 'paypal_cards',  // 当前 active 的卡+Express 处理方（必须已连接）
    cardsOn: true,            // 结账页是否挂卡输入
    expressOn: true,          // 结账页是否挂 Express 块
    // 可连接的卡处理方（同一时间只能 active 一个）；phase2 的在一期标「二期」
    processors: [
      { key: 'airwallex', name: 'Airwallex',    logo: 'airwallex.svg', connected: false, mode: 'live' },
      { key: 'stripe',    name: 'Stripe',       logo: 'stripe.svg',    connected: true, mode: 'live' },
      { key: 'adyen',     name: 'Adyen',        connected: false, phase2: true, mode: 'live' },
      { key: 'checkout',  name: 'Checkout.com', connected: false, phase2: true, mode: 'live' },
      { key: 'nmi',       name: 'NMI',          connected: false, phase2: true, mode: 'sandbox' }, // Apple Pay / Google Pay under Cards; fixed address; no subscription or additional charge
      { key: 'braintree', name: 'Braintree',    connected: false, phase2: true, mode: 'live' },
      { key: 'mollie',    name: 'Mollie',       connected: false, phase2: true, mode: 'live' },
      { key: 'oceanpay',  name: 'Oceanpayment',     connected: false, mode: 'sandbox' }, // Google Pay under Cards; fixed address; no Apple Pay
      { key: 'tazapay',   name: 'Tazapay',      connected: false, mode: 'sandbox', qrMethods: [] },
      { key: 'square',    name: 'Square',       connected: false, mode: 'sandbox' },
      { key: 'poynt',     name: 'Poynt',        connected: false, mode: 'live' },
      // Prototype-only processors stay after Poynt.
      { key: 'worldpay',  name: 'Worldpay',     connected: false, mode: 'live' }, // Access Checkout SDK: cards only
      { key: 'nuvei',     name: 'Nuvei',        connected: false, mode: 'live' }, // Web SDK cards + Apple Pay + Google Pay; no local APMs
      { key: 'antom',     name: 'Antom',        connected: false, mode: 'live' }, // Cards plus wallets from the same account
      { key: 'useepay',   name: 'UseePay',      connected: false, mode: 'live' }, // Cards + Apple Pay
    ],
    // PayPal 账户只连一次：Wallet 可独立启用；Cards、Apple Pay、Google Pay
    // 均由同一 PayPal 收款账户提供。钱包是否出现取决于服务端能力、域名状态和买家环境，
    // 不是商家在主题中可以强制打开的开关。
    paypal: {
      connected: true,
      walletOn: true,
      mode: 'live',
      capabilities: { cards: 'enabled', wallet: 'enabled', applePay: 'enabled', googlePay: 'enabled', venmo: 'enabled' },
      domain: { checkout: 'checkout.lovecross.com', applePay: 'verified' },
      lastSynced: 'just now',
    },
    klarna: { directConnected: true, directOn: true, mode: 'live' }, // 自有直连，仅二期展示
  },

  // =========================================================================
  // TRACKING PIXELS (platform-level)
  //   Cross-app — Online Store, BestCheckout, Subscriptions all read the same pixel
  //   IDs from here. BestShopio fires standard events on the merchant's behalf
  //   (PageView, InitiateCheckout, Purchase, etc.) so they don't have to hand-roll
  //   tracking code per app. Conversion API tokens enable server-side de-duped events
  //   — critical post-iOS 14 because client-side pixels miss 30-50% of conversions.
  // =========================================================================
  pixels: {
    platforms: {
      meta: {
        key: 'meta', name: 'Meta Pixel', vendor: 'Facebook · Instagram', logo: 'meta',
        enabled: true, pixelId: '102938475610293', capiToken: 'EAA•••••••••••••••', testEventCode: '',
        advMatching: true,
        docs: 'https://www.facebook.com/business/help/952192354843755',
      },
      ga4: {
        key: 'ga4', name: 'Google Analytics 4', vendor: 'GA4 · GTM', logo: 'ga4',
        enabled: true, measurementId: 'G-AB12CD34EF', apiSecret: 'gtm_•••••••••', gtmId: '',
        docs: 'https://developers.google.com/analytics/devguides/collection/ga4',
      },
      tiktok: {
        key: 'tiktok', name: 'TikTok Pixel', vendor: 'TikTok Ads', logo: 'tiktok',
        enabled: false, pixelId: '', accessToken: '', testCode: '',
        docs: 'https://ads.tiktok.com/marketing_api/docs?id=1739584847324162',
      },
      googleAds: {
        key: 'googleAds', name: 'Google Ads Conversion', vendor: 'Google Ads', logo: 'gads',
        enabled: false, conversionId: '', purchaseLabel: '', leadLabel: '',
        docs: 'https://support.google.com/google-ads/answer/6095821',
      },
      custom: {
        key: 'custom', name: 'Custom tracking code', vendor: 'Head & Body scripts', logo: 'code',
        enabled: false, headScript: '', bodyScript: '',
      },
    },
    // Standard events BestShopio fires automatically. Merchants don't pick these — the platform
    // maps a unified internal event ("buyer reached checkout") to each platform's vendor name.
    events: [
      { id: 'page_view',     name: 'Page view',          meta: 'PageView',         ga4: 'page_view',       tiktok: 'PageView',         gads: '—',                       fires: 'Every storefront page load' },
      { id: 'view_item',     name: 'View product / offer', meta: 'ViewContent',    ga4: 'view_item',       tiktok: 'ViewContent',      gads: '—',                       fires: 'Product page, upsell offer, downsell offer' },
      { id: 'add_to_cart',   name: 'Add to cart / accept upsell', meta: 'AddToCart', ga4: 'add_to_cart',  tiktok: 'AddToCart',        gads: '—',                       fires: 'Cart add + one-click upsell accept' },
      { id: 'begin_checkout', name: 'Begin checkout',    meta: 'InitiateCheckout', ga4: 'begin_checkout', tiktok: 'InitiateCheckout', gads: '—',                       fires: 'Buyer lands on the checkout page' },
      { id: 'add_payment',   name: 'Payment info added', meta: 'AddPaymentInfo',   ga4: 'add_payment_info', tiktok: 'AddPaymentInfo', gads: '—',                       fires: 'Buyer fills payment method' },
      { id: 'purchase',      name: 'Purchase',           meta: 'Purchase',         ga4: 'purchase',        tiktok: 'CompletePayment',  gads: 'Conversion (Purchase)',   fires: 'Order written back (Thank-you / order_create webhook)' },
    ],
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
