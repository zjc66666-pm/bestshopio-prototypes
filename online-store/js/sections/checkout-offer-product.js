/* Checkout Theme · Post-purchase offers.
   The template owns recommendation-rule configuration and editor preview. Production
   availability, Session locking, quote calculation and one-click charge remain service-owned. */
(function () {
  if (!window.OS) return;
  const { esc, money } = OS;

  const RULE_LABELS = {
    best_sellers: 'Best sellers',
    specific: 'Specific products',
    mapping: 'Order product mapping',
    most_expensive: 'Most expensive purchased product',
    least_expensive: 'Least expensive purchased product',
  };
  const currencyDigits = (currency) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: String(currency || 'USD').toUpperCase(),
      }).resolvedOptions().maximumFractionDigits;
    } catch (_) {
      return 2;
    }
  };
  const roundCurrency = (value, currency) => {
    const factor = Math.pow(10, currencyDigits(currency));
    return Math.round((+value + Number.EPSILON) * factor) / factor;
  };
  const formatMoney = (value, currency) => {
    const code = String(currency || 'USD').toUpperCase();
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: code,
        minimumFractionDigits: currencyDigits(code), maximumFractionDigits: currencyDigits(code),
      }).format(+value || 0);
    } catch (_) {
      return money(value);
    }
  };
  const discountValue = (settings) => {
    const value = settings.discount_value == null || settings.discount_value === '' ? 0 : +settings.discount_value;
    return Number.isFinite(value) ? value : 0;
  };
  const quotePrice = (basePrice, quantity, settings, currency) => {
    const base = Math.max(0, +basePrice || 0);
    const qty = Math.max(1, +quantity || 1);
    const type = settings.discount_type || 'percentage';
    const value = discountValue(settings);
    const rawFinal = type === 'fixed'
      ? Math.max(base - value, 0)
      : Math.max(base * (1 - value / 100), 0);
    const finalUnit = roundCurrency(rawFinal, currency);
    const discountAmount = roundCurrency(Math.max(base - finalUnit, 0), currency);
    const subtotal = roundCurrency(finalUnit * qty, currency);
    return {
      basePrice: roundCurrency(base, currency), finalUnit, discountAmount, subtotal, quantity: qty,
      savingsText: type === 'fixed'
        ? 'Save ' + formatMoney(discountAmount, currency)
        : 'Save ' + Math.max(0, value) + '%',
    };
  };
  const activeSubscription = (product) => {
    const plan = product && product.subscription;
    if (!plan || plan.status === 'draft' || plan.status === 'inactive' || plan.status === 'disabled') return null;
    return plan;
  };
  const previewInstrument = () => {
    try {
      const query = String(location.hash || '').split('?')[1] || '';
      return new URLSearchParams(query).get('instrument') === 'one-shot' ? 'one_shot' : '';
    } catch (_) {
      return '';
    }
  };
  const paymentSupportsSubscription = (ctx) => {
    if (previewInstrument() === 'one_shot') return false;
    const payment = ((ctx || {}).checkout || {}).payment || {};
    return payment.supports_subscription !== false;
  };
  const offerableSubscription = (product, ctx) =>
    paymentSupportsSubscription(ctx) ? activeSubscription(product) : null;
  const intervalLabel = (interval) => {
    const every = Math.max(1, +((interval && interval.every) || 1));
    const unit = String((interval && interval.unit) || 'month');
    const plural = every === 1 ? unit : (unit.endsWith('s') ? unit : unit + 's');
    return 'Delivery every ' + every + ' ' + plural;
  };
  const planRecurringUnit = (basePrice, plan, currency) => {
    const base = Math.max(0, +basePrice || 0);
    const discount = (plan && plan.discount) || {};
    const value = +discount.value || 0;
    const raw = discount.type === 'fixed' ? Math.max(base - value, 0) : Math.max(base * (1 - value / 100), 0);
    return roundCurrency(raw, currency);
  };
  const recurringCopy = (amount, currency, interval) =>
    'Then ' + formatMoney(amount, currency) + ' · ' + intervalLabel(interval);
  const maxProducts = (settings) => Math.max(1, Math.min(10, +settings.maximum_products || 4));
  const availableVariant = (variant) => variant && variant.available !== false && +variant.price > 0 &&
    (variant.inventory == null || variant.inventory > 0 || variant.allowOversell);
  const upsellPreviewKey = (ctx) => 'offer-preview-upsell:' +
    String((ctx || {}).checkoutPage === 'upsell'
      ? ((ctx || {}).checkoutTemplateId || 'default')
      : ((ctx || {}).precedingUpsellTemplateId || 'default'));
  const catalogOf = (offer) => {
    const products = Array.isArray(offer && offer.catalog) ? offer.catalog
      : Array.isArray(offer && offer.products) ? offer.products : [offer || {}];
    return products.filter(Boolean);
  };
  const productRef = (value) => {
    if (value && typeof value === 'object') {
      return { productId: String(value.productId || ''), variantId: String(value.variantId || '') };
    }
    const parts = String(value || '').split('::');
    return { productId: parts[0] || '', variantId: parts[1] && parts[1] !== 'default' ? parts[1] : '' };
  };
  const mappingPurchasedVariantRefs = (mapping) => {
    if (mapping && Array.isArray(mapping.purchasedVariantIds)) return mapping.purchasedVariantIds;
    return mapping && mapping.purchasedProductId ? [mapping.purchasedProductId] : [];
  };
  const canonicalVariantRef = (value) => {
    const ref = productRef(value);
    return ref.productId ? ref.productId + '::' + (ref.variantId || 'default') : '';
  };
  const productsForRefs = (values, catalog) => {
    const groups = [];
    (values || []).forEach((value) => {
      const ref = productRef(value);
      let group = groups.find((item) => item.productId === ref.productId);
      if (!group) { group = { productId: ref.productId, variantIds: [], allVariants: false }; groups.push(group); }
      if (ref.variantId) {
        if (group.variantIds.indexOf(ref.variantId) < 0) group.variantIds.push(ref.variantId);
      } else {
        group.allVariants = true;
      }
    });
    return groups.map((group) => {
      const source = catalog.find((product) => product.id === group.productId);
      if (!source) return null;
      const product = Object.assign({}, source);
      if (!group.allVariants && group.variantIds.length && Array.isArray(source.variants) && source.variants.length) {
        product.variants = source.variants.filter((variant) => group.variantIds.indexOf(variant.id) >= 0);
        product.selectedVariantId = group.variantIds[0];
      }
      return product;
    }).filter(Boolean);
  };
  const effectivePrice = (product, settings, currency) => {
    if (!product) return 0;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const selected = variants.find((variant) => variant.id === product.selectedVariantId && availableVariant(variant)) ||
      variants.find(availableVariant);
    const value = +(selected ? selected.price : product.price);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return quotePrice(value, 1, settings, currency).finalUnit;
  };
  const availableProduct = (product) => {
    if (!product || product.deleted || product.status === 'draft' || product.status === 'inactive' ||
        product.published === false || product.marketSupported === false || product.available === false ||
        (product.inventory != null && product.inventory <= 0 && !product.allowOversell)) return false;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (variants.length) {
      if (product.selectedVariantId) {
        return availableVariant(variants.find((variant) => variant.id === product.selectedVariantId));
      }
      return variants.some(availableVariant);
    }
    return +product.price > 0;
  };
  const acceptedIds = () => Object.keys((OS.ckState && OS.ckState['post-purchase-accepted']) || {});
  function orderLines(ctx) {
    const offer = ctx.offer || {};
    const mock = Array.isArray(offer.mockOrderProducts) ? offer.mockOrderProducts : [];
    return { lines: mock.map((line, index) => Object.assign({ orderIndex: index }, line)), usingMock: true };
  }
  function resolveRecommendation(settings, ctx) {
    const offer = ctx.offer || {};
    const catalog = catalogOf(offer);
    const order = orderLines(ctx);
    const orderIds = new Set(order.lines.map((line) => line.productId));
    const liveUpsellState = (OS.ckState || {})[upsellPreviewKey(ctx)] || {};
    const liveUpsell = liveUpsellState.products;
    const livePriorIds = ctx.checkoutPage === 'downsell' && Array.isArray(liveUpsell)
      ? liveUpsell.map((item) => item.productId) : [];
    const priorIds = new Set((offer.previouslyDisplayedProductIds || []).concat(livePriorIds));
    const purchased = new Set(acceptedIds().concat(offer.acceptedProductIds || []));
    const max = maxProducts(settings);
    const rule = settings.recommendation_rule || 'best_sellers';
    let candidateRefs = [], matchedMapping = null;
    let upsellThreshold = null;

    if (rule === 'best_sellers') {
      const ranked = catalog.slice().sort((a, b) =>
        ((a.bestSellerRank == null ? 9999 : a.bestSellerRank) - (b.bestSellerRank == null ? 9999 : b.bestSellerRank))
      ).slice(0, 20);
      if (ctx.checkoutPage === 'downsell') {
        const preceding = liveUpsellState.generated && Array.isArray(liveUpsell)
          ? liveUpsell : (offer.precedingUpsellOfferProducts || []);
        const prices = preceding.map((item) => +item.effectivePrice)
          .filter((price) => Number.isFinite(price) && price >= 0);
        upsellThreshold = prices.length ? Math.min.apply(null, prices) : null;
        candidateRefs = upsellThreshold != null
          ? ranked.filter((product) => effectivePrice(product, settings, offer.currency) < upsellThreshold).map((product) => product.id)
          : [];
      } else {
        candidateRefs = ranked.map((product) => product.id);
      }
    } else if (rule === 'mapping') {
      const mappings = Array.isArray(settings.product_mappings) ? settings.product_mappings : [];
      matchedMapping = mappings.find((mapping) => mappingPurchasedVariantRefs(mapping).some((value) => {
        const ref = productRef(value);
        return order.lines.some((line) => line.productId === ref.productId &&
          (!ref.variantId || ref.variantId === String(line.variantId || 'default')));
      }) && Array.isArray(mapping.recommendedProductIds) && mapping.recommendedProductIds.length) || null;
      candidateRefs = matchedMapping ? matchedMapping.recommendedProductIds.slice() : [];
    } else if (rule === 'most_expensive' || rule === 'least_expensive') {
      const ranked = order.lines.filter((line) => +line.quantity > 0 && (+line.paidAmount / +line.quantity) > 0).sort((a, b) => {
        const delta = (+a.paidAmount / +a.quantity) - (+b.paidAmount / +b.quantity);
        return (rule === 'most_expensive' ? -delta : delta) || ((a.orderIndex || 0) - (b.orderIndex || 0));
      });
      candidateRefs = ranked.map((line) => line.variantId ? line.productId + '::' + line.variantId : line.productId);
    } else {
      candidateRefs = Array.isArray(settings.specific_products) ? settings.specific_products.slice() : [];
    }

    const seen = new Set();
    const filtered = [];
    const allowOriginalPrimary = rule === 'most_expensive' || rule === 'least_expensive';
    const append = (refs, isDefault) => {
      productsForRefs(refs, catalog).forEach((product) => {
        const id = product.id;
        if (allowOriginalPrimary && !isDefault && filtered.length >= 1) return;
        if (filtered.length >= max || seen.has(id)) return;
        seen.add(id);
        if (!availableProduct(product) || purchased.has(id) || priorIds.has(id)) return;
        if (rule === 'best_sellers' && ctx.checkoutPage === 'downsell' &&
            (upsellThreshold == null || effectivePrice(product, settings, offer.currency) >= upsellThreshold)) return;
        if (orderIds.has(id) && !(allowOriginalPrimary && !isDefault)) return;
        filtered.push(product);
      });
    };
    append(candidateRefs, false);
    const primaryCount = filtered.length;
    const defaults = Array.isArray(settings.default_products) ? settings.default_products : [];
    const shouldUseDefaults = primaryCount === 0 || (settings.fill_default_products !== false && primaryCount < max);
    if (shouldUseDefaults) append(defaults, true);

    return {
      products: filtered.slice(0, max),
      rule,
      ruleLabel: RULE_LABELS[rule] || RULE_LABELS.specific,
      matchedMapping,
      order,
      primaryCount,
      defaultProductsUsed: filtered.length > primaryCount,
      noMappingMatched: rule === 'mapping' && !matchedMapping,
      upsellThreshold,
      candidatePoolSize: Math.min(20, catalog.length),
    };
  }
  function discountIssues(settings) {
    const raw = settings.discount_value;
    const value = raw == null || raw === '' ? 0 : +raw;
    if (!Number.isFinite(value)) return ['Enter a valid discount value.'];
    if (value < 0) return ['Discount value must be 0 or greater.'];
    if ((settings.discount_type || 'percentage') === 'percentage' && value > 100) {
      return ['Percentage discount must be between 0 and 100.'];
    }
    if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-8) {
      return ['Discount value supports up to 2 decimal places.'];
    }
    return [];
  }
  function discountPreviewHtml(settings, ctx) {
    const currency = String((((ctx || {}).offer || {}).currency) || 'USD').toUpperCase();
    const type = settings.discount_type || 'percentage';
    const base = type === 'fixed' ? 10 : 50;
    const quote = quotePrice(base, 1, settings, currency);
    const issues = discountIssues(settings);
    return '<div class="cko-disc-preview" data-discount-preview>' +
      '<div class="cko-disc-preview-head"><strong>Price preview</strong><span>' + esc(currency) + '</span></div>' +
      (issues.length
        ? '<div class="cko-disc-error">' + esc(issues[0]) + '</div>'
        : '<p>If your product is ' + formatMoney(base, currency) + ', customer pays <strong>' +
          formatMoney(quote.finalUnit, currency) + '</strong> (saves ' + formatMoney(quote.discountAmount, currency) + ').</p>') +
      '<small>Calculated from the current selling price. Shopify discounts and compare-at price are not applied. On Upsell / Downsell, this is the first-cycle price when the product has an active subscription; renewals use the subscription price.</small>' +
    '</div>';
  }

  OS.register('checkout-offer-product', {
    name: 'Offer', icon: 'cart',
    schema: [
      { sub: 'Product recommendation' },
      { info: 'Choose which products this template recommends. Live storefront eligibility and Session locking are validated by the Offer service.' },
      { key: 'recommendation_rule', label: 'Recommendation rule', control: 'select', default: 'best_sellers', options: [
        { value: 'best_sellers', label: 'Best sellers' },
        { value: 'specific', label: 'Specific products' },
        { value: 'mapping', label: 'Order product mapping' },
        { value: 'most_expensive', label: 'Most expensive purchased product' },
        { value: 'least_expensive', label: 'Least expensive purchased product' },
      ] },
      { info: 'Uses Shopify BEST_SELLING order. The system evaluates a fixed Top 20 candidate pool; ranking and time range are not merchant-configurable. Original order products are always excluded.',
        visibleWhen: (s) => (s.recommendation_rule || 'best_sellers') === 'best_sellers' },
      { sub: 'Rule configuration' },
      { key: 'specific_products', label: 'Specific product variants', control: 'ordered_variants', default: [], max: 10,
        info: 'Select up to 10 products, then choose the eligible variants. Drag to set storefront order.',
        visibleWhen: (s) => (s.recommendation_rule || 'best_sellers') === 'specific' },
      { key: 'product_mappings', label: 'Order product mapping', control: 'product_mappings', default: [], max: 50,
        info: 'Select one or more purchased product variants per mapping. A mapping matches when the order contains any selected variant; the first matched mapping wins.',
        visibleWhen: (s) => s.recommendation_rule === 'mapping' },
      { sub: 'Default products' },
      { key: 'default_products', label: 'Default product variants', control: 'ordered_variants', default: [], max: 10,
        info: 'Select fallback products and their eligible variants, then drag to set priority.' },
      { key: 'fill_default_products', label: 'Fill with default products', control: 'toggle', default: true },
      { sub: 'Product filters' },
      { key: 'maximum_products', label: 'Maximum products', control: 'number', default: 4, min: 1, max: 10,
        info: 'Enter a value from 1 to 10. The storefront displays no more than this number.' },
      { sub: 'Discount' },
      { key: 'discount_type', label: 'Discount type', control: 'select', default: 'percentage', options: (s, ctx) => [
        { value: 'percentage', label: '% Off' },
        { value: 'fixed', label: String((((ctx || {}).offer || {}).currency) || 'USD').toUpperCase() + ' Off' },
      ] },
      { key: 'discount_value', label: 'Discount value', control: 'number', default: 10, min: 0, step: 0.01,
        info: 'Applied to each item’s current selling price. Empty or 0 means no discount.', refreshPanel: true },
      { control: 'discount_preview', render: discountPreviewHtml },
      { sub: 'Layout' },
      { key: 'multiple_layout', label: 'Multiple products layout', control: 'segmented', default: 'stacked', options: [
        { value: 'stacked', label: 'List' }, { value: 'grid', label: '2-column grid' } ],
        info: 'Used when the recommendation returns multiple products. A single product keeps the focused image-and-details layout.' },
      { key: 'layout', label: 'Image position · list', control: 'segmented', default: 'image_left', options: [
        { value: 'image_left', label: 'Image left' }, { value: 'image_right', label: 'Image right' } ] },
      { key: 'image_ratio', label: 'Image ratio', control: 'select', default: 'square', options: [
        { value: 'square', label: 'Square' }, { value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' } ] },
      { key: 'show_compare_price', label: 'Show compare-at price', control: 'toggle', default: true },
      { key: 'show_savings', label: 'Show savings', control: 'toggle', default: true },
      { key: 'show_rating', label: 'Show rating', control: 'toggle', default: true },
      { key: 'show_description', label: 'Show description', control: 'toggle', default: true },
      { key: 'show_variant', label: 'Show variant', control: 'toggle', default: true },
      { key: 'show_quantity', label: 'Show quantity', control: 'toggle', default: true },
      { key: 'quantity_label', label: 'Quantity label', control: 'text', default: 'Quantity', visibleWhen: (s) => s.show_quantity !== false },
      { key: 'show_shipping', label: 'Show shipping', control: 'toggle', default: true },
      { sub: 'Actions' },
      { key: 'accept_text', label: 'Accept button text', control: 'text', default: 'Add to my order · {amount}', info: 'Use {amount} to display the amount supplied by the offer.' },
      { key: 'decline_text', label: 'Decline link text', control: 'text', default: 'No thanks, continue' },
      { key: 'show_payment_note', label: 'Show payment reassurance', control: 'toggle', default: true },
      { key: 'payment_note', label: 'Payment reassurance', control: 'text', default: 'Uses the payment method from your completed checkout', visibleWhen: (s) => s.show_payment_note !== false },
      { sub: 'Style' },
      { key: 'card_background', label: 'Card background', control: 'color', default: '#FFFFFF' },
      { key: 'button_background', label: 'Button background', control: 'color', default: '' },
      { key: 'button_text_color', label: 'Button text', control: 'color', default: '' },
      { key: 'savings_color', label: 'Savings color', control: 'color', default: '#2E8B57' },
      { key: 'border_radius', label: 'Card radius', control: 'number', default: 0, min: 0, max: 24 },
    ],
    defaults() {
      return {
        specific_products: ['p3::p3-blk-m', 'p5::default', 'p6::default', 'p7::default'],
        product_mappings: [
          { id: 'map-p1', purchasedVariantIds: ['p1::default'], recommendedProductIds: ['p3::p3-blk-m', 'p6::default'] },
          { id: 'map-p5', purchasedVariantIds: ['p5::default'], recommendedProductIds: ['p7::default', 'p8::default'] },
        ],
        default_products: [],
      };
    },
    validate(settings) {
      const issues = [];
      const defaults = Array.isArray(settings.default_products) ? settings.default_products : [];
      const rule = settings.recommendation_rule || 'best_sellers';
      if (rule === 'specific' && !(settings.specific_products || []).length && !defaults.length) {
        issues.push('Select at least one product or configure default products.');
      }
      if (rule === 'mapping') {
        const mappings = Array.isArray(settings.product_mappings) ? settings.product_mappings : [];
        if (mappings.length > 50) issues.push('You can create up to 50 product mappings.');
        const seen = new Set();
        mappings.forEach((mapping, index) => {
          const purchasedRefs = mappingPurchasedVariantRefs(mapping).map(canonicalVariantRef).filter(Boolean);
          if (!purchasedRefs.length) {
            issues.push('Mapping ' + (index + 1) + ': Select at least one purchased product variant.');
          } else {
            const duplicate = purchasedRefs.some((ref) => seen.has(ref));
            if (duplicate) issues.push('Mapping ' + (index + 1) + ': A purchased product variant is already used in another mapping.');
            purchasedRefs.forEach((ref) => seen.add(ref));
          }
          if (!Array.isArray(mapping.recommendedProductIds) || !mapping.recommendedProductIds.length) {
            issues.push('Mapping ' + (index + 1) + ': Select at least one recommended product variant.');
          }
        });
      }
      discountIssues(settings).forEach((issue) => issues.push(issue));
      return issues;
    },
    render(s, blocks, ctx) {
      const o = ctx.offer || {};
      const cur = o.currency || 'USD';
      const acceptTemplate = String(s.accept_text || 'Add to my order · {amount}');
      const ratio = { portrait: '3/4', landscape: '4/3', square: '1/1' }[s.image_ratio] || '1/1';
      const paymentNote = s.show_payment_note === false ? '' : '<div class="cko-payment-note">\uD83D\uDD12 ' +
        esc(s.payment_note || 'Uses the payment method from your completed checkout') + '</div>';
      const decline = '<button class="cko-decline" type="button" data-offer-decline>' +
        esc(s.decline_text || 'No thanks, continue') + '</button>';
      const recommendation = resolveRecommendation(s, ctx);
      const products = recommendation.products;
      if (!products.length) {
        if (ctx.checkoutPage === 'upsell') OS.ckSet(upsellPreviewKey(ctx), { products: [], generated: true });
        return '<div class="cksec cko-rec-empty" data-offer-count="0" data-offer-skip>' +
          '<strong>No recommendation result</strong>' +
          '<p>No eligible products matched this preview. The live storefront executes the Funnel node’s Skip route, or continues to the Thank you page.</p>' +
          '<button type="button" data-offer-skip-continue>Continue preview</button>' +
        '</div>';
      }
      const multi = products.length > 1;
      if (ctx.checkoutPage === 'upsell') {
        OS.ckSet(upsellPreviewKey(ctx), {
          generated: true,
          products: products.map((product) => ({
            productId: product.id,
            effectivePrice: effectivePrice(product, s, cur),
          })),
        });
      }
      const cardHtml = products.map((product, index) => {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        const selectedVariant = variants.find((v) => v.id === product.selectedVariantId && availableVariant(v)) ||
          variants.find(availableVariant) || {};
        const shown = Object.assign({}, product, selectedVariant);
        const initialQty = Math.max(1, +product.quantity || 1);
        const quote = quotePrice(+shown.price || +product.price || 0, initialQty, s, cur);
        const amount = formatMoney(quote.subtotal, cur) + ' ' + cur;
        const alreadyAdded = acceptedIds().indexOf(product.id) >= 0;
        const accept = alreadyAdded ? 'Added to order' : acceptTemplate.replace(/\{amount\}/g, amount);
        const compareValue = quote.discountAmount > 0 ? quote.basePrice
          : (+shown.compareAt > quote.basePrice ? +shown.compareAt : 0);
        const compare = s.show_compare_price !== false && compareValue > quote.finalUnit
          ? '<s class="cko-compare" data-offer-base>' + formatMoney(compareValue, cur) + '</s>' : '';
        const savings = s.show_savings !== false && quote.discountAmount > 0
          ? '<span class="cko-save" data-offer-savings style="color:' + (s.savings_color || '#2E8B57') + '">' + esc(quote.savingsText) + '</span>' : '';
        const rating = s.show_rating === false || product.rating == null ? '' :
          '<div class="cko-rating"><span class="stars">\u2605\u2605\u2605\u2605\u2605</span><span>' +
          esc(String(product.rating)) + ' (' + esc(String(product.reviewCount || 0)) + ')</span></div>';
        const desc = s.show_description === false || !product.description ? '' :
          '<p class="cko-desc">' + esc(product.description) + '</p>';
        const variantOptions = variants.map((v) => '<option value="' + esc(v.id) + '"' +
          ' data-base-price="' + (+v.price || +product.price || 0) + '" data-compare="' + (+v.compareAt || 0) + '"' +
          (!availableVariant(v) ? ' disabled' : '') +
          (v.id === selectedVariant.id ? ' selected' : '') + '>' + esc(v.title) + '</option>').join('');
        const variant = s.show_variant === false || !variants.length ? '' :
          '<label class="cko-choice cko-variant-choice"><span>' + esc(product.variantLabel || 'Variant') + '</span>' +
            '<select data-offer-variant' + (alreadyAdded ? ' disabled' : '') + '>' + variantOptions + '</select></label>';
        const quantities = (product.quantityOptions || [product.quantity || 1]).map((q) =>
          '<option value="' + esc(String(q)) + '"' + (+q === initialQty ? ' selected' : '') + '>' + esc(String(q)) + '</option>').join('');
        const qty = s.show_quantity === false ? '' :
          '<label class="cko-choice cko-qty-choice"><span>' + esc(s.quantity_label || 'Quantity') + '</span>' +
            '<select data-offer-qty' + (alreadyAdded ? ' disabled' : '') + '>' + quantities + '</select></label>';
        const choices = variant || qty ? '<div class="cko-choices">' + variant + qty + '</div>' : '';
        const plan = offerableSubscription(product, ctx);
        const recurringUnit = plan ? planRecurringUnit(+shown.price || +product.price || 0, plan, cur) : 0;
        const purchase = plan
          ? '<div class="cko-purchase" data-offer-purchase-wrap>' +
              '<span>Purchase option</span>' +
              '<div class="cko-purchase-opts" role="radiogroup" aria-label="Purchase option">' +
                '<button type="button" class="cko-purchase-opt" data-offer-purchase="one_time"' +
                  (alreadyAdded ? ' disabled' : '') + '>One-time</button>' +
                '<button type="button" class="cko-purchase-opt on" data-offer-purchase="subscribe" aria-pressed="true"' +
                  (alreadyAdded ? ' disabled' : '') + '>Subscribe</button>' +
              '</div></div>' +
              '<div class="cko-recurring" data-offer-recurring>' +
                esc(recurringCopy(roundCurrency(recurringUnit * initialQty, cur), cur, plan.interval)) +
              '</div>'
          : '';
        const shipping = s.show_shipping === false ? '' :
          '<div class="cko-shipping"><span>Shipping</span><strong>' +
            esc(product.shippingLabel || 'Calculated by offer') + '</strong></div>';
        const media = '<div class="cko-media" role="img" aria-label="' + esc(product.title || 'Offer product') +
          '" style="aspect-ratio:' + ratio + ';background-image:url(' + esc(product.image || '') + ')"></div>';
        const singleFlowActions = multi ? '' : decline + paymentNote;
        const info = '<div class="cko-info">' +
          '<div class="cko-titleline"><h2>' + esc(product.title || 'Preview offer product') + '</h2></div>' +
          '<div class="cko-price">' + compare + '<strong data-offer-price>' + formatMoney(quote.finalUnit, cur) + '</strong>' + savings + '</div>' +
          rating + desc + choices + purchase + shipping +
          '<button class="cko-accept" type="button" data-offer-accept data-accept-template="' + esc(acceptTemplate) +
            '" data-offer-id="' + esc(product.id || String(index + 1)) +
            '"' + (alreadyAdded ? ' disabled data-offer-added="1"' : '') +
            ' aria-live="polite"' +
            ' style="background:' + (s.button_background || 'var(--ck-btn-bg)') +
            ';color:' + (s.button_text_color || 'var(--ck-btn-text)') + '">' + esc(accept) + '</button>' +
          singleFlowActions +
        '</div>';
        const reversed = s.layout === 'image_right' ? ' reverse' : '';
        return '<article class="cko-card' + reversed + '" data-offer-card style="background:' +
          (s.card_background || '#fff') + ';border-radius:' + (s.border_radius == null ? 0 : s.border_radius) +
          'px" data-offer-id="' + esc(product.id || String(index + 1)) +
          '" data-offer-title="' + esc(product.title || 'Offer product') +
          '" data-offer-image="' + esc(product.image || '') +
          '" data-base-price="' + quote.basePrice + '"' +
          (plan ? ' data-has-subscription="1" data-purchase="subscribe"' +
            ' data-plan-every="' + esc(String((plan.interval && plan.interval.every) || 1)) +
            '" data-plan-unit="' + esc(String((plan.interval && plan.interval.unit) || 'month')) +
            '" data-plan-discount-type="' + esc(String((plan.discount && plan.discount.type) || 'percent')) +
            '" data-plan-discount-value="' + esc(String((plan.discount && plan.discount.value) || 0)) + '"' : '') +
          '>' + media + info + '</article>';
      }).join('');
      const layout = multi && s.multiple_layout === 'grid' ? ' grid' : ' stacked';
      const sharedFlowActions = multi ? '<div class="cko-flow-actions">' + decline + paymentNote + '</div>' : '';
      return '<div class="cksec cko-offers' + (multi ? ' multi' : ' single') + layout +
        '" data-offer-count="' + products.length + '">' + cardHtml + sharedFlowActions + '</div>';
    },
    hydrate(el, settings, blocks, ctx) {
      const skip = el.querySelector('[data-offer-skip-continue]');
      if (skip) {
        skip.addEventListener('click', (e) => {
          e.preventDefault();
          OS.goCheckoutPage(ctx && ctx.checkoutPage === 'upsell' ? 'downsell' : 'thankyou');
        });
      }
      const decline = el.querySelector('[data-offer-decline]');
      const accepts = Array.from(el.querySelectorAll('[data-offer-accept]'));
      const currency = ((ctx || {}).offer && ctx.offer.currency) || 'USD';
      let adding = false;
      const disableCardChoices = (card, disabled) => {
        if (!card) return;
        card.querySelectorAll('[data-offer-variant],[data-offer-qty],[data-offer-purchase]').forEach((control) => {
          control.disabled = !!disabled;
        });
      };
      const cardPurchase = (card) => {
        if (!card || card.getAttribute('data-has-subscription') !== '1') return 'one_time';
        const selected = card.querySelector('[data-offer-purchase].on');
        return (selected && selected.getAttribute('data-offer-purchase')) || card.getAttribute('data-purchase') || 'subscribe';
      };
      const cardPlan = (card) => ({
        interval: {
          every: card.getAttribute('data-plan-every') || 1,
          unit: card.getAttribute('data-plan-unit') || 'month',
        },
        discount: {
          type: card.getAttribute('data-plan-discount-type') || 'percent',
          value: +card.getAttribute('data-plan-discount-value') || 0,
        },
      });
      const allPurchasableProductsAdded = () => accepts.every((button) =>
        button.hasAttribute('data-offer-added') || button.hasAttribute('data-offer-unavailable'));
      const refreshAcceptAvailability = () => {
        accepts.forEach((button) => {
          if (button.hasAttribute('data-offer-added')) {
            button.disabled = true;
            disableCardChoices(button.closest('[data-offer-card]'), true);
            return;
          }
          const card = button.closest('[data-offer-card]');
          if (card) updateCard(card);
        });
      };
      const updateUpsellThreshold = (card, quote) => {
        if (!ctx || ctx.checkoutPage !== 'upsell') return;
        const stateKey = upsellPreviewKey(ctx);
        const state = Object.assign({ products: [] }, (OS.ckState || {})[stateKey] || {});
        const id = card.getAttribute('data-offer-id');
        const products = Array.isArray(state.products) ? state.products.slice() : [];
        const index = products.findIndex((item) => item.productId === id);
        const next = { productId: id, effectivePrice: quote.finalUnit };
        if (index >= 0) products[index] = next; else products.push(next);
        OS.ckSet(stateKey, { products });
      };
      const updateCard = (card) => {
        const variant = card.querySelector('[data-offer-variant]');
        const option = variant && variant.selectedOptions[0];
        const qtyEl = card.querySelector('[data-offer-qty]');
        const base = option ? (+option.dataset.basePrice || 0) : (+card.dataset.basePrice || 0);
        const qty = qtyEl ? (+qtyEl.value || 1) : 1;
        const quote = quotePrice(base, qty, settings, currency);
        const validPrice = Number.isFinite(base) && base > 0;
        const purchase = cardPurchase(card);
        const plan = cardPlan(card);
        const recurringUnit = card.getAttribute('data-has-subscription') === '1'
          ? planRecurringUnit(base, plan, currency) : 0;
        const recurringSubtotal = roundCurrency(recurringUnit * qty, currency);
        card.dataset.basePrice = String(quote.basePrice);
        card.dataset.finalUnit = String(quote.finalUnit);
        card.dataset.subtotal = String(quote.subtotal);
        card.dataset.purchase = purchase;
        card.dataset.recurringUnit = String(recurringUnit);
        const price = card.querySelector('[data-offer-price]');
        const compare = card.querySelector('[data-offer-base]');
        const savings = card.querySelector('[data-offer-savings]');
        const recurring = card.querySelector('[data-offer-recurring]');
        const accept = card.querySelector('[data-offer-accept]');
        if (price) price.textContent = validPrice ? formatMoney(quote.finalUnit, currency) : 'Unavailable';
        if (compare) {
          const compareValue = quote.discountAmount > 0 ? quote.basePrice : (+((option || {}).dataset || {}).compare || 0);
          compare.textContent = formatMoney(compareValue, currency);
          compare.hidden = compareValue <= quote.finalUnit;
        }
        if (savings) {
          savings.textContent = quote.savingsText;
          savings.hidden = quote.discountAmount <= 0;
        }
        if (recurring) {
          recurring.textContent = recurringCopy(recurringSubtotal, currency, plan.interval);
          recurring.hidden = purchase !== 'subscribe';
        }
        if (accept && !accept.hasAttribute('data-offer-added')) {
          if (!validPrice) {
            accept.disabled = true;
            accept.setAttribute('data-offer-unavailable', '1');
            accept.textContent = 'Product unavailable';
          } else {
            accept.removeAttribute('data-offer-unavailable');
            accept.disabled = adding;
            const amount = formatMoney(quote.subtotal, currency) + ' ' + currency;
            accept.textContent = String(accept.dataset.acceptTemplate || 'Add to my order · {amount}').replace(/\{amount\}/g, amount);
          }
        }
        updateUpsellThreshold(card, quote);
        return Object.assign(quote, { purchase, recurringUnit, recurringSubtotal, plan });
      };
      el.querySelectorAll('[data-offer-card]').forEach((card) => {
        const variant = card.querySelector('[data-offer-variant]');
        const qty = card.querySelector('[data-offer-qty]');
        if (variant) variant.addEventListener('change', () => updateCard(card));
        if (qty) qty.addEventListener('change', () => updateCard(card));
        card.querySelectorAll('[data-offer-purchase]').forEach((button) => {
          button.addEventListener('click', () => {
            if (button.disabled) return;
            card.querySelectorAll('[data-offer-purchase]').forEach((item) => {
              const on = item === button;
              item.classList.toggle('on', on);
              item.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
            updateCard(card);
          });
        });
        updateCard(card);
      });
      accepts.forEach((accept) => {
        accept.addEventListener('click', (e) => {
          e.preventDefault();
          if (accept.disabled || adding) return;
          adding = true;
          accepts.forEach((button) => { button.disabled = true; });
          if (decline) decline.disabled = true;
          accept.textContent = 'Adding\u2026';
          setTimeout(() => {
            const id = accept.getAttribute('data-offer-id');
            const card = accept.closest('[data-offer-card]');
            const quote = card ? updateCard(card) : quotePrice(0, 1, settings, currency);
            const variant = card && card.querySelector('[data-offer-variant]');
            const qty = card && card.querySelector('[data-offer-qty]');
            const current = Object.assign({}, OS.ckState['post-purchase-accepted'] || {});
            if (id) current[id] = true;
            OS.ckSet('post-purchase-accepted', current);
            const locked = Array.isArray(OS.ckState['post-purchase-accepted-lines'])
              ? OS.ckState['post-purchase-accepted-lines'].slice() : [];
            const subscribe = quote.purchase === 'subscribe';
            const line = {
              id: 'offer-' + ((ctx && ctx.checkoutPage) || 'upsell') + '-' + (id || locked.length + 1),
              productId: id,
              title: (card && card.getAttribute('data-offer-title')) || 'Offer product',
              variant: variant && variant.selectedOptions[0] ? variant.selectedOptions[0].textContent : '',
              variantId: variant ? variant.value : '',
              variant_id: variant ? variant.value : '',
              qty: qty ? (+qty.value || 1) : 1,
              price: quote.finalUnit,
              compareAt: quote.discountAmount > 0 ? quote.basePrice : 0,
              base_price: quote.basePrice,
              image: (card && card.getAttribute('data-offer-image')) || '',
              discountType: settings.discount_type || 'percentage',
              discountValue: discountValue(settings),
              discountAmount: quote.discountAmount,
              discount_type: settings.discount_type || 'percentage',
              discount_value: discountValue(settings),
              discount_amount: quote.discountAmount,
              offerFinalPrice: quote.finalUnit,
              offer_final_price: quote.finalUnit,
              purchaseOption: quote.purchase || 'one_time',
              is_subscribe: subscribe,
              recurringPrice: subscribe ? quote.recurringUnit : 0,
              subscription: subscribe ? {
                label: intervalLabel((quote.plan && quote.plan.interval) || {}),
                save: Math.max(0, roundCurrency(quote.basePrice - (quote.recurringUnit || 0), currency)),
              } : undefined,
              currency,
              lineSource: (ctx && ctx.checkoutPage) === 'downsell' ? 'DOWNSELL' : 'UPSELL',
              orderRole: (((OS.ckState || {})['post-purchase-offer-flow'] || {}).mergeWindowClosed)
                ? 'LATE_UPSELL' : 'BASE',
            };
            line[(ctx && ctx.checkoutPage) === 'downsell' ? 'downsell' : 'upsell'] = true;
            const existingLine = locked.findIndex((item) => item.id === line.id);
            if (existingLine >= 0) locked[existingLine] = line; else locked.push(line);
            OS.ckState['post-purchase-accepted-lines'] = locked;
            accept.setAttribute('data-offer-added', '1');
            accept.removeAttribute('data-offer-unavailable');
            disableCardChoices(card, true);
            accept.textContent = 'Added to order';
            adding = false;
            if (allPurchasableProductsAdded()) {
              setTimeout(() => OS.goCheckoutPage('thankyou'), 350);
              return;
            }
            refreshAcceptAvailability();
            if (decline) decline.disabled = false;
          }, 500);
        });
      });
      if (decline) decline.addEventListener('click', (e) => {
        e.preventDefault();
        if (adding) return;
        OS.goCheckoutPage(ctx && ctx.checkoutPage === 'upsell' ? 'downsell' : 'thankyou');
      });
    },
  });

  OS.css('ck-offer-product', `
  .cko-offers{display:flex;flex-direction:column;gap:0}
  .cko-card{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.04fr);gap:34px;align-items:start;padding:0;overflow:hidden;box-sizing:border-box}
  .cko-card.reverse{grid-template-columns:minmax(0,1.04fr) minmax(0,1fr)}
  .cko-card.reverse .cko-media{order:2}.cko-card.reverse .cko-info{order:1}
  .cko-offers.multi.stacked{gap:24px}
  .cko-offers.multi.stacked .cko-card{padding:18px;border:1px solid var(--ck-divider)}
  .cko-offers.multi.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
  .cko-offers.multi.grid .cko-card{display:flex;flex-direction:column;gap:0;border:1px solid var(--ck-divider)}
  .cko-offers.multi.grid .cko-card.reverse .cko-media,.cko-offers.multi.grid .cko-card.reverse .cko-info{order:initial}
  .cko-offers.multi.grid .cko-info{width:100%;padding:18px}
  .cko-offers.multi.grid .cko-media{width:100%}
  .cko-flow-actions{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;padding-top:4px}
  .cko-media{width:100%;background:#f4f4f4 center/cover no-repeat}
  .cko-info{display:flex;flex-direction:column;min-width:0;padding:2px 0}
  .cko-titleline{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
  .cko-titleline h2{margin:0;font-family:var(--ck-heading-font);font-size:calc(var(--ck-heading-fs) + 3px);font-weight:var(--ck-fw-h);line-height:1.25}
  .cko-price{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;margin-top:8px}
  .cko-compare{color:var(--ck-muted);font-size:var(--ck-small-fs)}
  .cko-price strong{font-size:17px}.cko-save{font-weight:700}
  .cko-rating{display:flex;align-items:center;gap:7px;margin-top:8px;color:var(--ck-muted);font-size:var(--ck-small-fs)}
  .cko-rating .stars{color:#f5b301;letter-spacing:1px}
  .cko-desc{margin:10px 0 0;color:var(--ck-text);font-size:var(--ck-base-fs);line-height:1.45}
  .cko-choices{display:block;margin-top:12px}
  .cko-purchase{display:flex;flex-direction:column;gap:8px;margin-top:12px}
  .cko-purchase>span{font-size:10px;color:var(--ck-muted);letter-spacing:.02em;text-transform:uppercase}
  .cko-purchase-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .cko-purchase-opt{height:36px;border:1px solid var(--ck-input-border);border-radius:var(--ck-input-radius);background:#fff;color:var(--ck-text);font:inherit;font-size:13px;font-weight:650;cursor:pointer}
  .cko-purchase-opt.on{border-color:var(--ck-text);background:color-mix(in srgb,var(--ck-text) 8%,#fff)}
  .cko-purchase-opt:disabled{opacity:.6;cursor:default}
  .cko-recurring{margin-top:8px;color:var(--ck-muted);font-size:12px;line-height:1.4}
  .cko-choice{display:flex;min-width:0;flex-direction:column;border:1px solid var(--ck-input-border);border-radius:var(--ck-input-radius);padding:6px 10px;box-sizing:border-box}
  .cko-variant-choice{width:100%}
  .cko-qty-choice{width:175px;margin-top:12px}
  .cko-choice span{font-size:10px;color:var(--ck-muted)}
  .cko-choice select{width:100%;border:0;outline:0;background:transparent;font:inherit;color:var(--ck-text);padding:1px 0}
  .cko-shipping{display:flex;justify-content:space-between;gap:16px;padding:14px 0;margin-top:12px;border-top:1px solid var(--ck-divider);border-bottom:1px solid var(--ck-divider)}
  .cko-shipping strong{font-weight:600}
  .cko-accept{width:100%;height:var(--ck-btn-h);margin-top:14px;border:0;border-radius:var(--ck-btn-radius);font:inherit;font-weight:700;cursor:pointer}
  .cko-accept:disabled{opacity:.72;cursor:default}
  .cko-decline{align-self:center;margin-top:11px;border:0;background:none;color:var(--ck-accent);font:inherit;font-size:var(--ck-small-fs);text-decoration:underline;cursor:pointer}
  .cko-decline:disabled{opacity:.5;cursor:wait}
  .cko-payment-note{margin-top:12px;text-align:center;color:var(--ck-muted);font-size:10.5px;line-height:1.4}
  .cko-rec-empty{padding:28px;border:1px dashed var(--ck-divider);border-radius:10px;background:color-mix(in srgb,var(--ck-page-bg) 88%,#fff);text-align:center}
  .cko-rec-empty strong{display:block;font-family:var(--ck-heading-font);font-size:17px}.cko-rec-empty p{max-width:520px;margin:7px auto 0;color:var(--ck-muted);font-size:12px;line-height:1.5}
  .cko-rec-empty button{min-height:40px;margin-top:14px;padding:0 18px;border:1px solid var(--ck-divider);border-radius:var(--ck-btn-radius);background:#fff;color:var(--ck-text);font:inherit;font-size:12px;font-weight:650;cursor:pointer}
  .cko-disc-preview{margin:12px 0 4px;padding:12px;border:1px solid #d8dde6;border-radius:9px;background:#f8f9fb;color:#2c3440;font-size:11.5px;line-height:1.45}
  .cko-disc-preview-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.cko-disc-preview-head strong{font-size:12.5px}.cko-disc-preview-head span{color:#6a7482;font-size:10.5px}
  .cko-disc-preview p{margin:7px 0 0}.cko-disc-preview small{display:block;margin-top:7px;color:#6a7482}.cko-disc-error{margin-top:8px;color:#a63b32}
  .ckpage.mob .cko-offers.multi,.ckpage.mob .cko-offers.multi.grid{display:flex;flex-direction:column;gap:18px}
  .ckpage.mob .cko-card{display:flex;flex-direction:column;gap:18px}
  .ckpage.mob .cko-card.reverse .cko-media,.ckpage.mob .cko-card.reverse .cko-info{order:initial}
  .ckpage.mob .cko-offers.multi .cko-info{width:100%;padding:16px}
  .ckpage.mob .cko-offers.single .cko-info{width:100%;padding:0}
  .ckpage.mob .cko-qty-choice{width:130px}
  `);
})();
