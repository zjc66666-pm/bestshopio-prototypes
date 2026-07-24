/* BestShopio Admin · Apps — display detail for the marketplace cards/drawer.
   The canonical app registry (id, menu, enable-state) lives in assets/nav.js
   (window.PLUGGABLE_APPS / window.AppState). This file only adds the richer
   "what you get" copy shown when a merchant opens an app's detail panel. */
window.DATA_APPS = {
  details: {
    subscriptions: {
      tagline: 'Recurring revenue, built in.',
      features: [
        'Subscribe & Save: let customers pick one-time or recurring right on the product page',
        'Flexible plans — weekly / monthly / yearly cycles, free trials, subscription discounts and minimum commitments',
        'Automatic recurring billing through your already-connected Airwallex, Stripe or PayPal — no new gateway setup',
        'Self-serve customer portal: pause, skip a delivery, swap products, reschedule or cancel',
        'Failed-payment recovery (dunning) with automatic retries and reminder emails',
        'MRR, active subscribers, churn and an upcoming-charges forecast on the Overview',
      ],
      // Mirrors the two-layer model in 系统架构认知 §2.3.
      worksWith: 'Reuses your connected payment gateways and writes recurring orders straight into your main Orders — turn it off and the store runs exactly as before.',
    },
    loyalty:   { features: ['Points for purchases, reviews and referrals', 'Reward tiers and a redeemable points store'] },
    wholesale: { features: ['Wholesale price lists and per-customer pricing', 'Minimum order quantities and B2B customer groups'] },
    affiliate: { features: ['Referral links and discount codes per affiliate', 'Commission tracking and payout reports'] },
  },
};
