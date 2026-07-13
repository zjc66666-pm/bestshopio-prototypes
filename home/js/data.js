/* BestShopio Admin - Home dashboard mock.
   Period summaries are intentionally aggregated here so Home stays independent
   from the lazy-loaded Analytics workspace. */
(function () {
  window.DATA_HOME = {
    periods: {
      today: {
        label: 'Today',
        comparison: 'vs yesterday',
        metrics: [
          { title: 'Sales', value: '$1,284.60', change: '+12.4%', href: '#/analytics/reports' },
          { title: 'Paid orders', value: '27', change: '+8.0%', href: '#/orders' },
          { title: 'Store sessions', value: '1,638', change: '+6.1%', href: '#/analytics/reports' },
          { title: 'Storefront conversion', value: '1.65%', change: '+0.2 pts', href: '#/analytics/reports' }
        ],
        series: [310, 468, 392, 624, 545, 812, 701, 982],
        labels: ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00', 'Now']
      },
      '7d': {
        label: 'Last 7 days',
        comparison: 'vs previous 7 days',
        metrics: [
          { title: 'Sales', value: '$8,642.90', change: '+14.8%', href: '#/analytics/reports' },
          { title: 'Paid orders', value: '186', change: '+10.7%', href: '#/orders' },
          { title: 'Store sessions', value: '11,340', change: '+8.6%', href: '#/analytics/reports' },
          { title: 'Storefront conversion', value: '1.64%', change: '+0.1 pts', href: '#/analytics/reports' }
        ],
        series: [842, 1186, 1054, 1318, 1146, 1438, 1659],
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      '30d': {
        label: 'Last 30 days',
        comparison: 'vs previous 30 days',
        metrics: [
          { title: 'Sales', value: '$31,624.20', change: '+9.3%', href: '#/analytics/reports' },
          { title: 'Paid orders', value: '684', change: '+7.6%', href: '#/orders' },
          { title: 'Store sessions', value: '43,501', change: '+5.5%', href: '#/analytics/reports' },
          { title: 'Storefront conversion', value: '1.57%', change: '+0.1 pts', href: '#/analytics/reports' }
        ],
        series: [702, 816, 768, 946, 1092, 986, 1250, 1118, 1374, 1480],
        labels: ['Jun 14', 'Jun 17', 'Jun 20', 'Jun 23', 'Jun 26', 'Jun 29', 'Jul 2', 'Jul 5', 'Jul 8', 'Today']
      }
    },
    storeHealth: [
      { label: 'Online store', value: 'Live', detail: 'lovocross.com', tone: 'ok', href: '#/online-store' },
      { label: 'Payments', value: '3 connected', detail: 'Airwallex, Stripe, PayPal', tone: 'ok', href: '#/settings/payments' },
      { label: 'Domain', value: 'Connected', detail: 'SSL active', tone: 'ok', href: '#/settings/domains' },
      { label: 'Tracking', value: 'Needs review', detail: 'Google and Meta events', tone: 'warn', href: '#/google' }
    ],
    update: {
      version: 'V1.143',
      title: 'BestCheckout is ready to review',
      detail: 'Check the Shopify connection before sending more traffic to the external checkout.',
      href: '#/bestcheckout/connect'
    }
  };
}());
