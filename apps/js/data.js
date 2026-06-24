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
    bestcheckout: {
      tagline: 'Win the checkout. Keep the customer.',
      features: [
        'External high-converting checkout: one-page checkout with order bumps and one-click post-purchase upsell / downsell — no re-entering the card',
        'Multi-MID payment routing (ATRI): cascade on soft declines, load-balance across processors, recycle failed rebills',
        'Bring your Shopify store: products, collections, discounts and shipping sync both ways and stay editable here in BestShopio',
        'Paid orders write back to Shopify and trigger your existing fulfillment apps (Bestfulfill / Zendrop) — nothing to re-wire',
        'Connection hub for the Shopify bridge: OAuth authorization, two-way data sync, checkout injection (App Embed) and the checkout domain',
        'Funnel editor reuses the BestShopio theme builder; one-domain-switch migration to a native store',
      ],
      worksWith: 'Reuses your connected payment gateways, the Subscriptions app for recurring billing, and your native Products / Discounts / Shipping / Orders — which is exactly why migrating later is just a domain switch.',
    },
    loyalty:   { features: ['Points for purchases, reviews and referrals', 'Reward tiers and a redeemable points store'] },
    wholesale: { features: ['Wholesale price lists and per-customer pricing', 'Minimum order quantities and B2B customer groups'] },
    affiliate: { features: ['Referral links and discount codes per affiliate', 'Commission tracking and payout reports'] },
  },
};
