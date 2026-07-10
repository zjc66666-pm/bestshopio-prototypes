/* BestShopio Admin · Subscriptions — mock data for the pluggable Subscription app.
   Subscribe & Save (recurring physical products). Two-layer model (系统架构认知 §2.3):
   the main store owns products/orders; this app owns plans, contracts and the
   recurring billing loop. Recurring charges run through the already-connected
   Airwallex / Stripe / PayPal (all gateway-managed: the gateway charges on schedule and
   webhooks a fresh order back into the main store). Today = 2026-06-18. */
window.DATA_SUBS = {
  // Billing gateways usable for recurring charges — mirrors Settings → Payments.
  gateways: [
    { id: 'airwallex', name: 'Airwallex', connected: true, product: 'Airwallex Billing',     note: 'Gateway-managed — auto-charges on schedule, webhooks each order back.' },
    { id: 'stripe',    name: 'Stripe',    connected: true, product: 'Stripe Billing',         note: 'Gateway-managed — Stripe Billing subscriptions charge on schedule.' },
    { id: 'paypal',    name: 'PayPal',    connected: true, product: 'PayPal Subscriptions',   note: 'Gateway-managed — billing plans drive the recurring charge.' },
  ],

  // ---- Overview KPIs ----
  metrics: {
    mrr: 12840, mrrDelta: 8.4,
    activeSubs: 342, activeDelta: 5.2,
    upcoming30Count: 318, upcoming30Value: 11760,
    churn: 3.1, churnDelta: -0.4,        // monthly %, lower is better (delta negative = improving)
    failedRate: 2.3, ltv: 184, currency: 'USD',
  },
  // 12-month MRR trend (oldest → newest, ending this month)
  mrrTrend: [
    { m: 'Jul', v: 6200 }, { m: 'Aug', v: 6900 }, { m: 'Sep', v: 7600 }, { m: 'Oct', v: 8100 },
    { m: 'Nov', v: 8800 }, { m: 'Dec', v: 9400 }, { m: 'Jan', v: 10100 }, { m: 'Feb', v: 10800 },
    { m: 'Mar', v: 11300 }, { m: 'Apr', v: 11900 }, { m: 'May', v: 12300 }, { m: 'Jun', v: 12840 },
  ],
  // Upcoming charges grouped by day (next ~7 days) for the Overview list.
  upcoming: [
    { date: '2026-06-19', count: 28, value: 742 },
    { date: '2026-06-20', count: 19, value: 588 },
    { date: '2026-06-21', count: 24, value: 696 },
    { date: '2026-06-22', count: 31, value: 814 },
    { date: '2026-06-23', count: 17, value: 452 },
    { date: '2026-06-24', count: 22, value: 634 },
    { date: '2026-06-25', count: 26, value: 708 },
  ],

  // ---- Plans (Subscribe & Save offers) ----
  // cycle = { every, unit }; price is the recurring per-cycle amount; compareAt = one-time price.
  plans: [
    { id: 'PL-1001', name: 'Coffee Club — Monthly',      status: 'active', product: 'Signature Blend Coffee 500g', sku: 'COF-500',
      cycle: { every: 1, unit: 'month' }, price: 24, compareAt: 30, discountPct: 20, currency: 'USD',
      trialDays: 0, minCycles: 3, gateway: 'airwallex', subscribers: 128, createdAt: '2026-01-12' },
    { id: 'PL-1002', name: 'Daily Vitamins — Monthly',   status: 'active', product: 'Daily Multivitamin (60 ct)', sku: 'VIT-60',
      cycle: { every: 1, unit: 'month' }, price: 32, compareAt: 38, discountPct: 16, currency: 'USD',
      trialDays: 7, minCycles: 0, gateway: 'paypal', subscribers: 96, createdAt: '2026-02-03' },
    { id: 'PL-1003', name: 'Skincare Refill — Bimonthly', status: 'active', product: 'Vitamin C Serum Refill 30ml', sku: 'SKN-VC30',
      cycle: { every: 2, unit: 'month' }, price: 45, compareAt: 52, discountPct: 13, currency: 'USD',
      trialDays: 0, minCycles: 0, gateway: 'airwallex', subscribers: 54, createdAt: '2026-02-20' },
    { id: 'PL-1004', name: 'Pet Food — Monthly',         status: 'active', product: 'Grain-Free Dog Food 5kg', sku: 'PET-5K',
      cycle: { every: 1, unit: 'month' }, price: 58, compareAt: 68, discountPct: 15, currency: 'USD',
      trialDays: 0, minCycles: 0, gateway: 'airwallex', subscribers: 41, createdAt: '2026-03-08' },
    { id: 'PL-1005', name: 'Protein Resupply — Monthly', status: 'active', product: 'Whey Protein 1kg', sku: 'PRO-1K',
      cycle: { every: 1, unit: 'month' }, price: 39, compareAt: 46, discountPct: 15, currency: 'USD',
      trialDays: 0, minCycles: 2, gateway: 'paypal', subscribers: 23, createdAt: '2026-04-01' },
    { id: 'PL-1006', name: 'Greens Powder — Monthly',    status: 'draft',  product: 'Super Greens Powder 300g', sku: 'GRN-300',
      cycle: { every: 1, unit: 'month' }, price: 35, compareAt: 42, discountPct: 17, currency: 'USD',
      trialDays: 14, minCycles: 0, gateway: 'airwallex', subscribers: 0, createdAt: '2026-06-10' },
    // BUNDLE plans (itemType:'bundle'): the LIST flags them "Sold as a bundle" and, because a bundle spans multiple pack tiers,
    // shows Cycle "Per pack" + a "from $X" price range. (The editor still configures one tier — its redesign is a separate task.)
    { id: 'PL-1007', name: 'Focus Gum — Subscribe & Save', status: 'active', itemType: 'bundle',
      product: 'Neurix Focus & Energy Gum', bundleId: 'BND-01', bundleTemplate: 'volume', tierIndex: 0,
      cycle: { every: 1, unit: 'month' }, price: 29.74, compareAt: 34.99, discountType: 'percent', discountValue: 15, currency: 'USD',
      trialDays: 0, minCycles: 0, gateway: 'airwallex', subscribers: 64, createdAt: '2026-06-14' },
    { id: 'PL-1008', name: 'Wellness Set — Subscribe & Save', status: 'active', itemType: 'bundle',
      product: 'High Waist Leggings', bundleId: 'BND-03', bundleTemplate: 'ab', tierIndex: 1,
      cycle: { every: 2, unit: 'month' }, price: 41.9, compareAt: 49.30, discountType: 'percent', discountValue: 15, currency: 'USD',
      trialDays: 0, minCycles: 0, gateway: 'airwallex', subscribers: 18, createdAt: '2026-06-16' },
    // Deactivated (draft) bundle plans — one Volume, one A+B Set — so both bundle types appear in the Deactivated tab.
    { id: 'PL-1009', name: 'Coffee Multipack — Subscribe & Save', status: 'draft', itemType: 'bundle',
      product: 'Signature Blend Coffee', bundleId: 'BND-02', bundleTemplate: 'volume', tierIndex: 0,
      cycle: { every: 1, unit: 'month' }, price: 29.74, compareAt: 34.99, discountType: 'percent', discountValue: 15, currency: 'USD',
      trialDays: 0, minCycles: 0, gateway: 'airwallex', subscribers: 0, createdAt: '2026-06-17' },
    { id: 'PL-1010', name: 'Yoga Outfit — Subscribe & Save', status: 'draft', itemType: 'bundle',
      product: 'High Waist Leggings', bundleId: 'BND-04', bundleTemplate: 'ab', tierIndex: 1,
      cycle: { every: 2, unit: 'month' }, price: 41.9, compareAt: 49.30, discountType: 'percent', discountValue: 15, currency: 'USD',
      trialDays: 0, minCycles: 0, gateway: 'airwallex', subscribers: 0, createdAt: '2026-06-18' },
    { id: 'PL-1011', name: 'Coffee Club — Every 2 Months', status: 'draft', itemType: 'product',
      product: 'Signature Blend Coffee 500g', sku: 'COF-500',
      cycle: { every: 2, unit: 'month' }, price: 25.5, compareAt: 30, discountType: 'percent', discountValue: 15, currency: 'USD',
      trialDays: 0, minCycles: 0, gateway: 'airwallex', subscribers: 0, createdAt: '2026-06-19' },
    { id: 'PL-1012', name: 'Coffee Office Pack - Every 2 Months', status: 'active', itemType: 'bundle',
      product: 'Signature Blend Coffee', bundleId: 'BND-07', bundleTemplate: 'volume', tierIndex: 1,
      cycle: { every: 2, unit: 'month' }, price: 48, compareAt: 69.97, discountType: 'fixed', discountValue: 13.99, currency: 'USD',
      trialDays: 0, minCycles: 0, gateway: 'airwallex', subscribers: 1, createdAt: '2026-06-20' },
  ],

  // ---- Contracts (a customer's live subscription) ----
  // status: active | past_due | cancelled. next = next charge date.
  contracts: [
    { id: 'SUB-20451', customer: 'Emma Johnson',  email: 'emma.j@example.com',   plan: 'Coffee Club — Monthly',      planId: 'PL-1001', product: 'Signature Blend Coffee 500g', status: 'active',   next: '2026-06-22', amount: 24, currency: 'USD', cyclesDone: 5, gateway: 'airwallex', method: 'Visa ···· 4242',       qty: 1, startedAt: '2026-01-22', address: '24 Maple St, Austin, TX 78701, US',
      history: [ { id: '#1069', date: '2026-05-22', amount: 24, status: 'paid', cycle: 5 }, { id: '#1061', date: '2026-04-22', amount: 24, status: 'paid', cycle: 4 }, { id: '#1057', date: '2026-03-22', amount: 24, status: 'paid', cycle: 3 } ] },
    { id: 'SUB-20452', customer: 'Liam Smith',     email: 'liam.s@example.com',   plan: 'Daily Vitamins — Monthly',   planId: 'PL-1002', product: 'Daily Multivitamin (60 ct)', status: 'active',   next: '2026-06-19', amount: 32, currency: 'USD', cyclesDone: 3, gateway: 'paypal',    method: 'PayPal',               qty: 1, startedAt: '2026-03-19', address: '9 Oak Ave, Denver, CO 80202, US',
      history: [ { id: '#1066', date: '2026-05-19', amount: 32, status: 'paid', cycle: 3 }, { id: '#1060', date: '2026-04-19', amount: 32, status: 'paid', cycle: 2 } ] },
    { id: 'SUB-20453', customer: 'Olivia Brown',   email: 'olivia.b@example.com', plan: 'Skincare Refill — Bimonthly', planId: 'PL-1003', product: 'Vitamin C Serum Refill 30ml', status: 'active',   next: '2026-07-02', amount: 45, currency: 'USD', cyclesDone: 2, gateway: 'stripe', method: 'Mastercard ···· 5301', qty: 1, startedAt: '2026-03-02', address: '512 Pine Rd, Seattle, WA 98101, US',
      history: [ { id: '#1063', date: '2026-05-02', amount: 45, status: 'paid', cycle: 2 }, { id: '#1054', date: '2026-03-02', amount: 45, status: 'paid', cycle: 1 } ] },
    { id: 'SUB-20454', customer: 'Noah Davis',     email: 'noah.d@example.com',   plan: 'Pet Food — Monthly',         planId: 'PL-1004', product: 'Grain-Free Dog Food 5kg', status: 'past_due', next: '2026-06-16', amount: 58, currency: 'USD', cyclesDone: 7, gateway: 'airwallex', method: 'Visa ···· 1881',       qty: 1, startedAt: '2025-11-16', address: '3 Birch Ln, Portland, OR 97201, US',
      history: [ { id: '#1072', date: '2026-06-16', amount: 58, status: 'failed', cycle: 7 }, { id: '#1065', date: '2026-05-16', amount: 58, status: 'paid', cycle: 6 } ] },
    { id: 'SUB-20455', customer: 'Ava Wilson',     email: 'ava.w@example.com',    plan: 'Coffee Club — Monthly',      planId: 'PL-1001', product: 'Signature Blend Coffee 500g', status: 'active',   next: '2026-07-01', amount: 24, currency: 'USD', cyclesDone: 4, gateway: 'airwallex', method: 'Visa ···· 9032',       qty: 2, startedAt: '2026-02-01', address: '77 Cedar Blvd, Miami, FL 33101, US',
      history: [ { id: '#1062', date: '2026-05-01', amount: 48, status: 'paid', cycle: 4 }, { id: '#1058', date: '2026-04-01', amount: 48, status: 'paid', cycle: 3 } ] },
    { id: 'SUB-20456', customer: 'Sophia Lee',     email: 'sophia.l@example.com', plan: 'Protein Resupply — Monthly', planId: 'PL-1005', product: 'Whey Protein 1kg', status: 'active',   next: '2026-06-25', amount: 39, currency: 'USD', cyclesDone: 6, gateway: 'paypal',    method: 'PayPal',               qty: 1, startedAt: '2025-12-25', address: '140 Elm St, Boston, MA 02108, US',
      history: [ { id: '#1071', date: '2026-05-25', amount: 39, status: 'paid', cycle: 6 } ] },
    { id: 'SUB-20457', customer: 'Mason Garcia',   email: 'mason.g@example.com',  plan: 'Daily Vitamins — Monthly',   planId: 'PL-1002', product: 'Daily Multivitamin (60 ct)', status: 'active',   next: '2026-06-20', amount: 32, currency: 'USD', cyclesDone: 1, gateway: 'paypal',    method: 'PayPal',               qty: 1, startedAt: '2026-05-20', address: '8 Spruce Way, Phoenix, AZ 85001, US',
      history: [ { id: '#1067', date: '2026-05-20', amount: 32, status: 'paid', cycle: 1 } ] },
    { id: 'SUB-20458', customer: 'Isabella Martin', email: 'isabella.m@example.com', plan: 'Skincare Refill — Bimonthly', planId: 'PL-1003', product: 'Vitamin C Serum Refill 30ml', status: 'cancelled', next: '', amount: 45, currency: 'USD', cyclesDone: 8, gateway: 'airwallex', method: 'Visa ···· 6677', qty: 1, startedAt: '2024-09-10', endedAt: '2026-05-10', address: '61 Walnut Dr, Chicago, IL 60601, US',
      history: [ { id: '#1055', date: '2026-03-10', amount: 45, status: 'paid', cycle: 8 } ] },
    { id: 'SUB-20459', customer: 'James Taylor',   email: 'james.t@example.com',  plan: 'Pet Food — Monthly',         planId: 'PL-1004', product: 'Grain-Free Dog Food 5kg', status: 'active',   next: '2026-06-21', amount: 58, currency: 'USD', cyclesDone: 9, gateway: 'stripe', method: 'Amex ···· 1007',       qty: 1, startedAt: '2025-09-21', address: '205 Ash St, Nashville, TN 37201, US',
      history: [ { id: '#1068', date: '2026-05-21', amount: 58, status: 'paid', cycle: 9 } ] },
    { id: 'SUB-20460', customer: 'Mia Anderson',   email: 'mia.a@example.com',    plan: 'Coffee Club — Monthly',      planId: 'PL-1001', product: 'Signature Blend Coffee 500g', status: 'active',   next: '2026-06-23', amount: 24, currency: 'USD', cyclesDone: 2, gateway: 'airwallex', method: 'Visa ···· 4242',       qty: 1, startedAt: '2026-04-23', address: '19 Willow Ct, San Diego, CA 92101, US',
      history: [ { id: '#1070', date: '2026-05-23', amount: 24, status: 'paid', cycle: 2 } ] },
    { id: 'SUB-20471', customer: 'Grace Lee',      email: 'grace.lee@example.com', plan: 'Coffee Office Pack - Every 2 Months', planId: 'PL-1012', product: 'Coffee Office Pack', status: 'active', next: '2026-08-20', amount: 48, currency: 'USD', cyclesDone: 1, gateway: 'airwallex', method: 'Visa ···· 4242', qty: 1, startedAt: '2026-06-20', address: '118 King Street, Suite 6, Seattle, WA 98101, US',
      history: [ { id: '#1073', date: '2026-06-20', amount: 48, status: 'paid', cycle: 1 } ] },
    // Past-due contract: its latest charge is failing and pairs with the recurring order below.
    { id: 'SUB-20461', customer: 'Lucas Moore',    email: 'lucas.m@example.com',  plan: 'Protein Resupply — Monthly', planId: 'PL-1005', product: 'Whey Protein 1kg', status: 'past_due', next: '2026-05-12', amount: 39, currency: 'USD', cyclesDone: 2, gateway: 'paypal',    method: 'PayPal',               qty: 1, startedAt: '2026-03-12', address: '88 Cedar St, Austin, TX 78701, US',
      history: [ { id: '#1059', date: '2026-04-12', amount: 39, status: 'paid', cycle: 2 }, { id: '#1056', date: '2026-03-12', amount: 39, status: 'paid', cycle: 1 } ] },
  ],

  // ---- Subscription orders (one normal store order per successful/attempted charge) ----
  // status: paid | failed | retrying | refunded
  orders: [
    { id: '#1069', contract: 'SUB-20451', customer: 'Emma Johnson',    plan: 'Coffee Club — Monthly',      date: '2026-05-22', amount: 24, currency: 'USD', status: 'paid',     cycle: 5, gateway: 'airwallex' },
    { id: '#1066', contract: 'SUB-20452', customer: 'Liam Smith',      plan: 'Daily Vitamins — Monthly',   date: '2026-05-19', amount: 32, currency: 'USD', status: 'paid',     cycle: 3, gateway: 'paypal' },
    { id: '#1072', contract: 'SUB-20454', customer: 'Noah Davis',      plan: 'Pet Food — Monthly',         date: '2026-06-16', amount: 58, currency: 'USD', status: 'retrying', cycle: 7, gateway: 'airwallex', attempt: 2, nextRetry: '2026-06-19' },
    { id: '#1063', contract: 'SUB-20453', customer: 'Olivia Brown',    plan: 'Skincare Refill — Bimonthly', date: '2026-05-02', amount: 45, currency: 'USD', status: 'paid',     cycle: 2, gateway: 'stripe' },
    { id: '#1062', contract: 'SUB-20455', customer: 'Ava Wilson',      plan: 'Coffee Club — Monthly',      date: '2026-05-01', amount: 48, currency: 'USD', status: 'paid',     cycle: 4, gateway: 'airwallex' },
    { id: '#1071', contract: 'SUB-20456', customer: 'Sophia Lee',      plan: 'Protein Resupply — Monthly', date: '2026-05-25', amount: 39, currency: 'USD', status: 'paid',     cycle: 6, gateway: 'paypal' },
    { id: '#1068', contract: 'SUB-20459', customer: 'James Taylor',   plan: 'Pet Food — Monthly',         date: '2026-05-21', amount: 58, currency: 'USD', status: 'paid',     cycle: 9, gateway: 'stripe' },
    { id: '#1070', contract: 'SUB-20460', customer: 'Mia Anderson',   plan: 'Coffee Club — Monthly',      date: '2026-05-23', amount: 24, currency: 'USD', status: 'paid',     cycle: 2, gateway: 'airwallex' },
    { id: '#1073', contract: 'SUB-20471', customer: 'Grace Lee',      plan: 'Coffee Office Pack - Every 2 Months', date: '2026-06-20', amount: 48, currency: 'USD', status: 'paid', cycle: 1, gateway: 'airwallex' },
    { id: '#1055', contract: 'SUB-20458', customer: 'Isabella Martin', plan: 'Skincare Refill — Bimonthly', date: '2026-03-10', amount: 45, currency: 'USD', status: 'refunded', cycle: 8, gateway: 'airwallex' },
    { id: '#1067', contract: 'SUB-20457', customer: 'Mason Garcia',   plan: 'Daily Vitamins — Monthly',   date: '2026-05-20', amount: 32, currency: 'USD', status: 'paid',     cycle: 1, gateway: 'paypal' },
    { id: '#1064', contract: 'SUB-20461', customer: 'Lucas Moore',    plan: 'Protein Resupply — Monthly', date: '2026-05-12', amount: 39, currency: 'USD', status: 'failed',   cycle: 3, gateway: 'paypal', reason: 'Insufficient funds' },
    { id: '#1058', contract: 'SUB-20455', customer: 'Ava Wilson',     plan: 'Coffee Club — Monthly',      date: '2026-04-01', amount: 48, currency: 'USD', status: 'paid',     cycle: 3, gateway: 'airwallex' },
  ],

  // ---- App-level settings ----
  settings: {
    defaultGateway: 'airwallex',
    dunning: { retries: 3, intervalDays: 3, finalAction: 'cancel' },   // after the last failed retry the subscription is cancelled
    portal: { enabled: true, allowSkip: true, allowSwap: true, allowReschedule: true, allowCancel: true },
    notifications: { upcomingCharge: true, paymentFailed: true, cancelled: true, upcomingChargeDays: 3 },
  },
};
