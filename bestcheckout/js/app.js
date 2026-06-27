/* BestCheckout module — the Checkout-Champ-style layer on BestShopio, built as an
   "增强式" Shopify-connect App: external high-converting checkout + multi-MID payment
   routing (ATRI) + native subscriptions + post-purchase upsell, syncing back to Shopify.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file renders the
   module body into #root and registers window.VIEWS.bestcheckout. Mirrors the page
   pattern of the other modules (page-title / panel / tbl / filter-select / pagination). */
(function () {
  const D = window.DATA_BC;
  let root, chart = null;
  // Shopify-connected state. The merchant always sees the FULL BestShopio platform (no install-scope
  // narrowing) — this flag is only whether THIS store has linked a Shopify store; it drives the
  // first-run welcome vs the live dashboard and the "migrate" prompt. Default = connected (demo lands
  // on the live app; set localStorage bsio_bc_connected='0' to replay the first-run welcome).
  function bcConnected() { try { return localStorage.getItem('bsio_bc_connected') !== '0'; } catch (e) { return true; } }
  function setBcConnected(v) { try { localStorage.setItem('bsio_bc_connected', v ? '1' : '0'); } catch (e) {} }
  // Activation-checklist state. Demo seeds the auto-handled steps (sync done, shipping inherited,
  // standard template OK) so the merchant only sees the actual manual work they have to do.
  function bcSetup() {
    var def = { sync_done: true, payment_accounts: [], payment_done: false, embed_enabled: false,
                shipping_configured: true, domain_set: false, smtp_configured: false,
                template_chosen: true, first_order: false, collapsed: false };
    try { var saved = JSON.parse(localStorage.getItem('bsio_bc_setup') || '{}'); for (var k in saved) def[k] = saved[k]; return def; }
    catch (e) { return def; }
  }
  function bcSetupSave(s) { try { localStorage.setItem('bsio_bc_setup', JSON.stringify(s)); } catch (e) {} }
  // Each step declares: required (blocker for launch), how to read its done-state, and the CTA.
  // `custom:'payment'` triggers the inline "which accounts do you have?" branch question.
  var SETUP_STEPS = [
    { id: 'connect',  label: 'Shopify connected',       required: true,  hint: '',                                                                    cta: 'Reconnect',         hash: '#/bestcheckout/connect', check: function (s) { return bcConnected(); } },
    { id: 'sync',     label: 'Data synced',             required: true,  hint: 'Products, inventory, discounts pulled from Shopify',                  cta: 'View sync status',  hash: '#/bestcheckout/connect', check: function (s) { return s.sync_done; } },
    { id: 'payment',  label: 'Configure payments',      required: true,  hint: 'Card processor (Airwallex / Stripe / PayPal Advanced) + PayPal wallet', custom: 'payment',                                       check: function (s) { return s.payment_done; } },
    { id: 'embed',    label: 'Enable checkout intercept', required: true, hint: 'App Embed catches your cart Checkout button — no theme edits',         cta: 'Open Shopify theme', hash: '#/bestcheckout/connect', check: function (s) { return s.embed_enabled; } },
    { id: 'shipping', label: 'Shipping rules',          required: true,  hint: 'Inherits Shopify shipping by default — confirm or customize',         cta: 'Review',            hash: '#/settings/shipping',    check: function (s) { return s.shipping_configured; } },
    { id: 'domain',   label: 'Custom checkout domain',  required: false, hint: 'checkout.yourbrand.com — branded, auto-SSL',                          cta: 'Set CNAME',         hash: '#/bestcheckout/connect', check: function (s) { return s.domain_set; } },
    { id: 'smtp',     label: 'Sender email / SMTP',     required: false, hint: 'Order confirmations from your own domain (lifts deliverability)',     cta: 'Configure',         hash: '#/settings/notifications', check: function (s) { return s.smtp_configured; } },
    { id: 'template', label: 'Pick / customize template', required: false, hint: 'Standard works out of the box — switch to Conversion or customize', cta: 'Open funnel',       hash: '#/bestcheckout/funnel',  check: function (s) { return s.template_chosen; } },
    { id: 'live',     label: 'First order',             required: false, hint: 'Auto-checked when the first BestCheckout order writes back to Shopify', cta: 'Mark as live (demo)', mark: 'first_order',                                    check: function (s) { return s.first_order; } },
  ];
  function bcSetupProgress() {
    var s = bcSetup();
    var done = SETUP_STEPS.filter(function (st) { return st.check(s); }).length;
    var requiredLeft = SETUP_STEPS.filter(function (st) { return st.required && !st.check(s); }).length;
    return { done: done, total: SETUP_STEPS.length, requiredLeft: requiredLeft, setup: s };
  }

  // Funnel page builder (theme-builder-grade) lives in a sibling file, loaded on demand.
  const PB_BASE = (function () { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/app\.js.*$/, '') : 'bestcheckout/js/'; })();
  let _pbP = null;
  function ensurePageBuilder() { if (window.BC_PB) return Promise.resolve(); if (_pbP) return _pbP; _pbP = new Promise(function (res) { var sc = document.createElement('script'); sc.src = PB_BASE + 'pagebuilder.js?v=' + Date.now(); sc.onload = res; sc.onerror = res; document.body.appendChild(sc); }); return _pbP; }

  // "Checkout design" = a one-click TEMPLATE GALLERY (this is what the 二级菜单 lands on).
  // Each card applies a preset (CHECKOUT_TEMPLATES in online-store/data.js) into the SHARED theme
  // builder via ?tpl=<id>; exiting the builder returns here, so this gallery is the home for
  // checkout work. Card metadata is local (presentational) — only the tpl id links to the seeds.
  // ===== Template model — 1.0 exposes BestCheckout page types; the model is generic (page type →
  // many templates: SYSTEM starters + SAVED merchant versions), so Online Store reuses it later. =====
  var PAGE_TYPES = [
    { key: 'checkout', label: 'Checkout',  page: 'checkout',  desc: 'Cart source · order summary' },
    { key: 'thankyou', label: 'Thank-you', page: 'thank-you', desc: 'Confirmation · tracking · reviews' },
    { key: 'upsell',   label: 'Upsell',    page: 'upsell',    desc: 'Post-purchase one-click add' },
    { key: 'downsell', label: 'Downsell',  page: 'downsell',  desc: 'Lower-price save' },
  ];
  var SYS_TPL = {
    checkout: [
      { id: 'standard', name: 'Standard', tag: 'Cart checkout — clean & trusted', accent: '#1a1a1a', layout: '2col', rec: true },
      { id: 'express-funnel', name: 'Conversion', tag: 'Cart + full funnel extras', accent: '#c0392b', layout: '2col', urgency: true },
      { id: 'offer-funnel', name: 'Single-page funnel', tag: 'Offer picker for paid-media traffic', accent: '#2b62d6', layout: 'offer', soon: true },
    ],
    thankyou: [ { id: 'default', name: 'Standard', tag: 'Confirmation + tracking + reviews', accent: '#1a8a5a', layout: '2col' } ],
    upsell:   [ { id: 'default', name: 'One-click upsell', tag: 'Post-purchase add in one click', accent: '#2b62d6', layout: 'solo' } ],
    downsell: [ { id: 'default', name: 'Downsell', tag: 'Lower-price save offer', accent: '#7b4bd0', layout: 'solo' } ],
  };
  function bcSavedTpls() { try { return JSON.parse(localStorage.getItem('bsio_bc_templates') || '{}'); } catch (e) { return {}; } }
  function bcTplList(k) { return (SYS_TPL[k] || []).map(function (x) { return Object.assign({ system: true }, x); }).concat((bcSavedTpls()[k] || []).map(function (x) { return Object.assign({ saved: true }, x); })); }
  function bcPage(k) { var p = PAGE_TYPES.filter(function (x) { return x.key === k; })[0]; return p ? p.page : k; }
  function bcEditHash(k, tplId) {
    var b = '#/online-store/edit/aura/' + bcPage(k) + '?from=bestcheckout';
    if ((bcSavedTpls()[k] || []).filter(function (x) { return x.id === tplId; })[0]) return b + '&saved=' + encodeURIComponent(tplId);
    return (k === 'checkout' && tplId && tplId !== 'default') ? b + '&tpl=' + encodeURIComponent(tplId) : b;
  }
  function bcDeleteTpl(k, id) { var s = bcSavedTpls(); s[k] = (s[k] || []).filter(function (x) { return x.id !== id; }); try { localStorage.setItem('bsio_bc_templates', JSON.stringify(s)); } catch (e) {} }
  function bcTplThumb(tp) {
    var body = tp.layout === 'offer' ? '<div class="cg-t-offer"><span></span><span class="sel"></span><span></span></div>'
      : tp.layout === 'solo' ? '<div class="cg-t-solo"><i></i><i></i><b></b></div>'
      : '<div class="cg-t-cols"><div class="cg-t-main"><span></span><span></span><span class="w"></span></div><div class="cg-t-side"><i></i><i></i><b></b></div></div>';
    return '<div class="cg-thumb" style="--acc:' + tp.accent + '">' + (tp.urgency ? '<div class="cg-t-bar"></div>' : '<div class="cg-t-gap"></div>') + body + '<div class="cg-t-foot"></div></div>';
  }
  function bcTplName(k, id) { var l = bcTplList(k).filter(function (x) { return x.id === id; })[0]; return l ? l.name : id; }

  // ---- Templates library (each page type: SYSTEM + SAVED) ----
  function renderTemplates() {
    var group = function (pt) {
      var cards = bcTplList(pt.key).map(function (tp) {
        var badge = tp.saved ? '<span class="tp-saved">' + t('Saved') + '</span>' : (tp.soon ? '<span class="cg-soonbadge">P1</span>' : '<span class="tp-sys">' + t('System') + '</span>');
        var action = tp.soon ? '<button class="btn btn-default" disabled style="flex:1;justify-content:center;opacity:.55;cursor:not-allowed">' + t('Coming soon') + '</button>'
          : '<a class="btn btn-primary" href="' + bcEditHash(pt.key, tp.id) + '">' + t('Customize') + '</a>' +
            (tp.saved ? '<button class="btn btn-default tp-del" data-del="' + pt.key + ':' + tp.id + '" title="' + t('Delete') + '" style="flex:none;padding:0 10px">✕</button>' : '');
        var tag = tp.tag ? t(tp.tag) : (tp.saved ? t('Saved from the builder') : '');
        return '<div class="cg-card' + (tp.soon ? ' cg-soon' : '') + '">' + bcTplThumb(tp) +
          '<div class="cg-body"><div class="cg-name">' + esc(tp.name) + badge + '</div>' + (tag ? '<div class="cg-tag muted">' + tag + '</div>' : '') +
          '<div class="cg-actions">' + action + '</div></div></div>';
      }).join('');
      return '<div class="tp-group"><div class="tp-group-h"><span class="tp-group-name">' + t(pt.label) + '</span><span class="muted" style="font-size:12.5px">' + t(pt.desc) + '</span></div><div class="cg-grid">' + cards + '</div></div>';
    };
    root.innerHTML = wrap(GSTYLE + FSTYLE + head(t('Templates')) +
      '<div class="muted" style="font-size:13px;margin:2px 0 18px;line-height:1.6;max-width:700px">' + t('Every page type has a template library — our system starters plus the versions you save. Open one to customize, then save it back as a new template. The Funnel and A/B tests both pull from here.') + '</div>' +
      PAGE_TYPES.map(group).join(''));
    root.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var p = b.getAttribute('data-del').split(':'); bcDeleteTpl(p[0], p[1]); toast(t('Template deleted')); renderTemplates(); }; });
    bcI18n(root);
  }

  // ---- Funnel state (per-node template + optional A/B), persisted in localStorage ----
  // Page types. The real entry is the Shopify store (a SOURCE node — buyers come from there); every
  // other type is a customizable, A/B-testable PAGE. `type` doubles as the template-library key.
  // `buttons` declares which page-button outcomes a node can route on. Only Upsell/Downsell pages have
  // explicit Accept/Decline buttons; Shopify/Checkout don't, so their out-edges can only use random or
  // predicate rules. New page types just need to declare their buttons here — the menu auto-adapts.
  var FN_TYPES = {
    shopify:  { label: 'Shopify store', source: true },
    checkout: { label: 'Checkout' },
    upsell:   { label: 'Upsell',   buttons: [{ value: 'YES', label: 'Accepted', kind: 'accept' }, { value: 'NO', label: 'Declined', kind: 'decline' }] },
    downsell: { label: 'Downsell', buttons: [{ value: 'YES', label: 'Added',    kind: 'accept' }, { value: 'NO', label: 'Declined', kind: 'decline' }] },
    thankyou: { label: 'Thank-you' },
    control:  { label: 'Shopify checkout', control: true },
  };
  // 1.0 ships one predicate dimension (new vs returning customer). Add more keys here and the rule
  // editor's predicate tab will pick them up automatically — that's the whole point of unifying.
  // Routing condition fields — Azoya-style segment builder. Each field declares its data kind, which
  // drives both the operator list and the value input. Adding a routing dimension = adding one row
  // here; the editor + edge labels pick it up automatically. Tag options are seeded from a "Shopify
  // sync" demo list and would in production come from `/customers?fields=tags` aggregation.
  var SHOPIFY_TAGS_DEMO = ['VIP', '高净值', 'Wholesale', 'Early adopter', 'Newsletter', '黑名单'];
  var FIELD_CATALOG = {
    'customer.type':      { group: 'basic',     label: 'New vs returning', kind: 'enum',     options: [
      { value: 'new',       label: 'New customer',       short: 'New' },
      { value: 'returning', label: 'Returning customer', short: 'Returning' },
    ] },
    'customer.tag':       { group: 'tag',       label: 'Customer tag',     kind: 'multitag', source: 'shopify', options: SHOPIFY_TAGS_DEMO.map(function (t) { return { value: t, label: t }; }) },
    'customer.country':   { group: 'basic',     label: 'Country',          kind: 'enum',     options: [
      { value: 'US', label: 'United States', short: 'US' }, { value: 'CA', label: 'Canada', short: 'CA' },
      { value: 'GB', label: 'United Kingdom', short: 'UK' }, { value: 'AU', label: 'Australia', short: 'AU' },
      { value: 'CN', label: 'China', short: 'CN' }, { value: 'JP', label: 'Japan', short: 'JP' },
    ] },
    'orders.count':       { group: 'behavior',  label: 'Past orders',      kind: 'number_op', unit: '' },
    'cart.total':         { group: 'value',     label: 'Cart total',       kind: 'number_op', unit: '$' },
    'device.type':        { group: 'basic',     label: 'Device',           kind: 'enum',     options: [
      { value: 'mobile',  label: 'Mobile',  short: 'Mobile' },
      { value: 'desktop', label: 'Desktop', short: 'Desktop' },
    ] },
    'action.upsell':      { group: 'action',    label: 'Upsell decision',  kind: 'enum',     options: [
      { value: 'accept',  label: 'Accepted (YES)', short: 'Accepted' },
      { value: 'decline', label: 'Declined (NO)',  short: 'Declined' },
    ], hint: 'Only applicable to edges leaving an Upsell node' },
    'action.downsell':    { group: 'action',    label: 'Downsell decision', kind: 'enum',    options: [
      { value: 'accept',  label: 'Added (YES)',    short: 'Added' },
      { value: 'decline', label: 'Declined (NO)',  short: 'Declined' },
    ], hint: 'Only applicable to edges leaving a Downsell node' },
    'random':             { group: 'random',    label: 'Traffic %',        kind: 'percent' },
  };
  // Each kind declares the operators available + the value control shape.
  var OP_KINDS = {
    enum:      { ops: [{ value: 'eq', label: 'is' }, { value: 'ne', label: 'is not' }],
                 value: 'select' },
    multitag:  { ops: [{ value: 'any', label: 'is any of' }, { value: 'all', label: 'is all of' }, { value: 'none', label: 'is none of' }],
                 value: 'multi' },
    number_op: { ops: [{ value: 'eq', label: '=' }, { value: 'gt', label: '>' }, { value: 'lt', label: '<' }, { value: 'between', label: 'between' }],
                 value: 'number' },
    bool:      { ops: [{ value: 'is_true', label: 'is true' }, { value: 'is_false', label: 'is false' }],
                 value: 'none' },
    percent:   { ops: [{ value: 'pct', label: '%' }],
                 value: 'number' },
    date:      { ops: [{ value: 'before', label: 'before' }, { value: 'after', label: 'after' }, { value: 'between', label: 'between' }],
                 value: 'date' },
  };
  // Display groups (left side of the field dropdown).
  var FIELD_GROUPS = [
    { key: 'basic',    label: 'Basic attributes' },
    { key: 'behavior', label: 'Behavior' },
    { key: 'value',    label: 'Value' },
    { key: 'tag',      label: 'Customer tags' },
    { key: 'action',   label: 'Upstream actions' },
    { key: 'random',   label: 'Traffic split' },
  ];
  function fnFieldsByGroup() {
    var by = {}; FIELD_GROUPS.forEach(function (g) { by[g.key] = []; });
    Object.keys(FIELD_CATALOG).forEach(function (k) { var f = FIELD_CATALOG[k]; (by[f.group] = by[f.group] || []).push(Object.assign({ key: k }, f)); });
    return by;
  }
  var FC_W = 1460, FC_H = 580, fcZoom = null, fcEdges = [], fcSel = null;
  function fnLabel(type) { return (FN_TYPES[type] || {}).label || type; }
  function fnIsSource(type) { return !!(FN_TYPES[type] || {}).source; }
  function fnIsControl(type) { return !!(FN_TYPES[type] || {}).control; }
  function fnButtons(type) { return (FN_TYPES[type] || {}).buttons || []; }
  // Simple hierarchical auto-layout: nodes are placed in vertical columns by graph depth (longest path
  // from a source), each column is vertically centered, and source / multi-parent nodes are recentered
  // on their neighbours' Y so arrows fan out cleanly. Good enough for arbitrary funnels merchants build.
  function fnAutoLayout(s) {
    s.nodes = s.nodes || []; s.edges = s.edges || [];
    if (!s.nodes.length) return;
    var X0 = 50, COL = 310, VGAP = 220, ROW0 = 50, ROW_BUDGET = 700;
    var byId = {}, inc = {};
    s.nodes.forEach(function (n) { byId[n.id] = n; inc[n.id] = []; });
    s.edges.forEach(function (e) { if (inc[e.to]) inc[e.to].push(e.from); });
    var depth = {};
    var compute = function (id, seen) {
      if (depth[id] != null) return depth[id];
      if (seen[id]) return 0;
      seen[id] = true;
      var p = inc[id] || [];
      if (!p.length) return depth[id] = 0;
      var d = 0;
      p.forEach(function (pid) { d = Math.max(d, compute(pid, seen) + 1); });
      return depth[id] = d;
    };
    s.nodes.forEach(function (n) { compute(n.id, {}); });
    var maxD = 0; Object.keys(depth).forEach(function (k) { if (depth[k] > maxD) maxD = depth[k]; });
    var cols = []; for (var i = 0; i <= maxD; i++) cols.push([]);
    s.nodes.forEach(function (n) { cols[depth[n.id]].push(n); });
    cols.forEach(function (col) { col.sort(function (a, b) { return a.id < b.id ? -1 : 1; }); });
    cols.forEach(function (col, d) {
      var n = col.length;
      var span = n > 1 ? VGAP * (n - 1) : 0;
      var y0 = ROW0 + Math.max(0, (ROW_BUDGET - span) / 2);
      col.forEach(function (node, i) { node.pos = { x: X0 + d * COL, y: Math.round(y0 + i * VGAP) }; });
    });
    // Sources sit slightly above their children's centroid so arrows always have visible angle (no
    // perfectly horizontal line into a "middle" child). Multi-parent nodes recenter on parents.
    for (var pass = 0; pass < 3; pass++) {
      s.nodes.forEach(function (n) {
        var d = depth[n.id];
        if (d === 0) {
          var kids = (s.edges || []).filter(function (e) { return e.from === n.id; }).map(function (e) { return byId[e.to]; }).filter(Boolean);
          if (kids.length) {
            var ys = kids.map(function (c) { return c.pos.y; });
            var mid = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
            n.pos.y = Math.max(20, Math.round(mid - 30));
          }
        } else {
          var parents = (inc[n.id] || []).map(function (pid) { return byId[pid]; }).filter(Boolean);
          if (parents.length >= 2) {
            var pys = parents.map(function (p) { return p.pos.y; });
            n.pos.y = Math.max(20, Math.round((Math.min.apply(null, pys) + Math.max.apply(null, pys)) / 2));
          }
        }
      });
    }
  }
  // Default funnel: Shopify forks 3 ways — two parallel Checkout pages (the page-level A/B) plus the
  // Shopify-native control. Both checkouts converge into Upsell; Upsell YES→Thank-you / NO→Downsell→Thank-you.
  // Default funnel = a richer "starter pack" that showcases every routing dimension at once, so the
  // merchant doesn't start from zero and learns from a working example:
  //   • Segmentation by customer.type → 新客 走标准版 / 老客 走转化版 / 兜底走 Shopify 原生
  //   • 上游按钮路由 → Upsell 接受→致谢 / 拒绝→降级
  //   • Multi-parent convergence → 两个 checkout 都收敛到 Upsell;Downsell 也回致谢
  // 商户可改可删可加,整理布局一键复位。
  function fnDefault() {
    var s = {
      nodes: [
        { id: 'src',  type: 'shopify' },
        { id: 'co',   type: 'checkout', tpl: 'standard' },
        { id: 'co2',  type: 'checkout', tpl: 'express-funnel' },
        { id: 'ctrl', type: 'control' },
        { id: 'up',   type: 'upsell',   tpl: 'default' },
        { id: 'down', type: 'downsell', tpl: 'default' },
        { id: 'ty',   type: 'thankyou', tpl: 'default' },
      ],
      edges: [
        { from: 'src',  to: 'co',   rule: { type: 'expression', conditions: [{ field: 'customer.type', op: 'eq', value: 'new' }] } },
        { from: 'src',  to: 'co2',  rule: { type: 'expression', conditions: [{ field: 'customer.type', op: 'eq', value: 'returning' }] } },
        { from: 'src',  to: 'ctrl', rule: { type: 'expression', conditions: [], fallback: true } },
        { from: 'co',   to: 'up' },
        { from: 'co2',  to: 'up' },
        { from: 'up',   to: 'ty',   fromY: 0.34, rule: { type: 'expression', conditions: [{ field: 'action.upsell', op: 'eq', value: 'accept' }] } },
        { from: 'up',   to: 'down', fromY: 0.72, rule: { type: 'expression', conditions: [{ field: 'action.upsell', op: 'eq', value: 'decline' }], fallback: true } },
        { from: 'down', to: 'ty' },
      ],
    };
    fnAutoLayout(s);
    return s;
  }
  function bcFunnel() {
    try { var s = JSON.parse(localStorage.getItem('bsio_bc_funnel') || 'null'); if (s && s.nodes) { fnMigrateRules(s); return s; } } catch (e) {}
    var def = fnDefault(); fnMigrateRules(def); return def;
  }
  function bcFunnelSave(s) { try { localStorage.setItem('bsio_bc_funnel', JSON.stringify(s)); } catch (e) {} }
  // Unified edge rule model. Legacy {label,kind,split} → {rule:{type,value}}. Idempotent.
  //   button:    { type:'button',    value:'YES'|'NO' }     — only valid when source has buttons
  //   random:    { type:'random',    value:N|null }         — N% (null = even-split with siblings)
  //   predicate: { type:'predicate', key:'customer.type', value:'new'|'returning'|... }
  // Edge rule = an Azoya-style expression: a list of AND'd conditions, each `{field,op,value}`.
  // `fallback:true` means "match anything not caught by sibling edges". Migration covers every prior
  // shape (button/random/predicate union) so old funnels keep working — idempotent.
  function fnMigrateRules(s) {
    var typeOf = {}; (s.nodes || []).forEach(function (n) { typeOf[n.id] = n.type; });
    var actionFieldFor = function (fromId) { var t = typeOf[fromId]; return t === 'downsell' ? 'action.downsell' : 'action.upsell'; };
    (s.edges || []).forEach(function (e) {
      // Legacy {label,kind,split} → expression
      if (!e.rule) {
        if (e.kind === 'accept' || e.label === 'YES') e.rule = { type: 'expression', conditions: [{ field: actionFieldFor(e.from), op: 'eq', value: 'accept' }] };
        else if (e.kind === 'decline' || e.label === 'NO') e.rule = { type: 'expression', conditions: [{ field: actionFieldFor(e.from), op: 'eq', value: 'decline' }] };
        else if (e.split != null) e.rule = { type: 'expression', conditions: [{ field: 'random', op: 'pct', value: e.split }] };
        else e.rule = { type: 'expression', conditions: [] };
      }
      // Previous round's rule model (button/random/predicate union) → expression
      if (e.rule.type === 'button') {
        e.rule = { type: 'expression', conditions: [{ field: actionFieldFor(e.from), op: 'eq', value: e.rule.value === 'NO' ? 'decline' : 'accept' }] };
      } else if (e.rule.type === 'random') {
        var v = e.rule.value; e.rule = { type: 'expression', conditions: v != null ? [{ field: 'random', op: 'pct', value: v }] : [] };
      } else if (e.rule.type === 'predicate') {
        e.rule = { type: 'expression', conditions: e.rule.value != null ? [{ field: e.rule.key || 'customer.type', op: 'eq', value: e.rule.value }] : [], fallback: e.rule.value == null };
      }
      e.rule.conditions = e.rule.conditions || [];
    });
    // Guarantee exactly one fallback per fork. If none, mark the first branch with empty conditions;
    // if all branches have conditions, mark the last branch (= "safety net"). One-of semantics.
    var byFrom = {};
    (s.edges || []).forEach(function (e) { (byFrom[e.from] = byFrom[e.from] || []).push(e); });
    Object.keys(byFrom).forEach(function (k) {
      var arr = byFrom[k]; if (arr.length < 2) { arr.forEach(function (e) { delete e.rule.fallback; }); return; }
      var fallbacks = arr.filter(function (e) { return e.rule && e.rule.fallback; });
      if (fallbacks.length === 1) return;                            // exactly one → good
      arr.forEach(function (e) { e.rule.fallback = false; });        // reset
      var empty = arr.filter(function (e) { return (e.rule.conditions || []).length === 0; })[0];
      (empty || arr[arr.length - 1]).rule.fallback = true;           // pick a default
    });
  }
  function fnRuleConds(e) { return (e && e.rule && e.rule.conditions) || []; }
  // Fallback = an explicit role per fork. The branch the system routes to when no sibling's
  // conditions match. Exactly one per fork. Conditions stay editable for fallback branches —
  // they're treated as "preference" but the branch acts as the safety net regardless.
  function fnRuleIsFallback(e) { return !!(e && e.rule && e.rule.fallback); }
  // The kind class used for arrow color/marker — derived from which fields the conditions reference.
  // Priority: action.* (accept/decline) > predicate (purple) > random (blue dash) > fallback (gray).
  // Fallback only wins if there are no conditions at all (purely the safety net).
  function fnRuleKind(e) {
    var conds = fnRuleConds(e);
    var act = conds.filter(function (c) { return /^action\./.test(c.field); })[0];
    if (act) return act.value === 'decline' ? 'decline' : 'accept';
    var hasRandom = conds.some(function (c) { return c.field === 'random'; });
    var hasOther = conds.some(function (c) { return c.field !== 'random'; });
    if (hasOther) return 'predicate';
    if (hasRandom) return 'random';
    return 'fallback';
  }
  // Build a short, comma-joined display label for the edge. Empty-conditions fallback shows "兜底";
  // a fallback WITH conditions shows the conditions + an "⚑" marker prefix so merchants can see both.
  function fnRuleLabel(e) {
    var conds = fnRuleConds(e);
    if (!conds.length) return t('Fallback');
    var prefix = fnRuleIsFallback(e) ? '⚑ ' : '';
    // Stable order: filters first (alphabetical by field), random last — so same conditions always
    // render in the same order across siblings ("老用户, 40%" not "40%, 老用户" depending on add order).
    conds = conds.slice().sort(function (a, b) {
      var ar = a.field === 'random', br = b.field === 'random';
      if (ar && !br) return 1;
      if (!ar && br) return -1;
      return a.field < b.field ? -1 : a.field > b.field ? 1 : 0;
    });
    var parts = conds.map(function (c) {
      var f = FIELD_CATALOG[c.field] || {};
      if (f.kind === 'percent') return (c.value != null ? c.value : '?') + '%';
      if (f.kind === 'multitag') {
        var v = Array.isArray(c.value) ? c.value : (c.value ? [c.value] : []);
        if (!v.length) return '?';
        var pre = c.op === 'none' ? '!' : '';
        return pre + v.join('+');
      }
      if (f.kind === 'enum') {
        var opt = (f.options || []).filter(function (o) { return o.value === c.value; })[0];
        return (c.op === 'ne' ? '!' : '') + (opt ? t(opt.short || opt.label) : c.value);
      }
      if (f.kind === 'number_op') {
        var unit = f.unit || ''; var sign = c.op === 'gt' ? '>' : c.op === 'lt' ? '<' : c.op === 'between' ? '' : '=';
        if (c.op === 'between' && Array.isArray(c.value)) return unit + c.value[0] + '~' + unit + c.value[1];
        return sign + unit + (c.value != null ? c.value : '?');
      }
      if (f.kind === 'bool') return (c.op === 'is_false' ? '!' : '') + t(f.label);
      return c.value;
    });
    return prefix + parts.join(', ');
  }
  function fnNode(s, id) { return (s.nodes || []).filter(function (n) { return n.id === id; })[0]; }
  function fnUid() { return 'n' + Math.random().toString(36).slice(2, 7); }

  // ---- Funnel canvas (Shopify source → pages; add/remove pages; in-node A/B with auto-winner) ----
  function renderFunnel() {
    var st = bcFunnel();
    fcEdges = st.edges || [];
    var node = function (nd) {
      var pos = nd.pos || { x: 40, y: 40 };
      if (fnIsSource(nd.type)) {
        return '<div class="fc-node fc-src t-shopify" data-id="' + nd.id + '" style="left:' + pos.x + 'px;top:' + pos.y + 'px">' +
          '<div class="fc-node-bar"><span class="fc-sicon">S</span><span class="fc-node-type">' + t('Shopify store') + '</span><span class="fc-grip">⠿</span></div>' +
          '<div class="fc-node-body"><div class="fc-src-dom">lovocross.myshopify.com</div>' +
            '<div class="fc-src-tag">' + t('Traffic source — buyers enter the funnel here') + '</div>' +
            '<div class="fn-acts"><a class="btn btn-default" href="#/bestcheckout/connect">' + t('Manage connection') + '</a></div></div>' +
          '<span class="fc-port" title="' + t('Drag to another node to connect') + '"></span></div>';
      }
      if (fnIsControl(nd.type)) {
        return '<div class="fc-node fc-ctrl t-control" data-id="' + nd.id + '" style="left:' + pos.x + 'px;top:' + pos.y + 'px">' +
          '<div class="fc-node-bar"><span class="fc-cicon">S</span><span class="fc-node-type">' + t('Shopify checkout') + '</span><button class="fc-del" data-del="' + nd.id + '" title="' + t('Remove control group') + '">✕</button><span class="fc-grip">⠿</span></div>' +
          '<div class="fc-node-body"><div class="fc-ctrl-tag">' + t('Control group — the rest of the cart stays on Shopify’s native checkout.') + '</div></div>' +
        '<span class="fc-port" title="' + t('Drag to another node to connect') + '"></span></div>';
      }
      var n = nd, body;
      if (n.ab) {
        var splitA = n.ab.splitA != null ? n.ab.splitA : 50;
        var sA = n.ab.sA || 0, oA = n.ab.oA || 0, sB = n.ab.sB || 0, oB = n.ab.oB || 0;
        var crA = sA ? oA / sA * 100 : 0, crB = sB ? oB / sB * 100 : 0, has = sA > 0 && sB > 0;
        var lead = crB > crA ? 'B' : 'A', up = has ? Math.abs(crB - crA) / Math.max(0.01, Math.min(crA, crB)) * 100 : 0;
        var byUser = n.ab.splitBy === 'user';
        var abRow = function (k, col, seg, pct, cr) {
          var meter = byUser ? '<span class="fn-ab-seg">' + esc(seg) + '</span>' : '<span class="fn-ab-track"><span style="width:' + pct + '%;background:' + col + '"></span></span>';
          var metric = byUser ? (has ? cr.toFixed(1) + '%' : '·') : (pct + '%' + (has ? ' · ' + cr.toFixed(1) + '%' : ''));
          return '<div class="fn-ab-row"><b>' + k + '</b>' + meter + '<i>' + metric + '</i></div>';
        };
        body = '<div class="fn-ab"><div class="fn-ab-h">A/B · ' + esc(bcTplName(n.type, n.tpl)) + ' vs ' + esc(bcTplName(n.type, n.ab.b)) + (byUser ? ' <span class="fn-ab-mode">' + t('by user type') + '</span>' : '') + '</div>' +
          abRow('A', '#2b62d6', t('New'), splitA, crA) +
          abRow('B', '#7b4bd0', t('Returning'), 100 - splitA, crB) +
          (has
            ? '<div class="fn-ab-win">' + t('Variant') + ' ' + lead + ' +' + up.toFixed(0) + '% · ' + (n.ab.conf || 0) + '% · <a href="#" data-win="' + n.id + '">' + t('auto-pick winner') + '</a></div>'
            : '<div class="fn-ab-win" style="color:var(--ink-muted)">' + t('Collecting data — no winner yet') + '</div>') +
          '<div class="fn-ab-foot"><a href="' + bcEditHash(n.type, n.tpl) + '">' + t('Edit A') + '</a> · <a href="' + bcEditHash(n.type, n.ab.b) + '">' + t('Edit B') + '</a> · <a href="#" data-rmab="' + n.id + '">' + t('Remove A/B') + '</a></div></div>';
      } else {
        body = '<div class="fn-tpl">' + t('Template') + ': <b>' + esc(bcTplName(n.type, n.tpl)) + '</b> · <a href="#" data-swap="' + n.id + '">' + t('Change') + '</a></div>';
      }
      return '<div class="fc-node t-' + n.type + '" data-id="' + n.id + '" style="left:' + pos.x + 'px;top:' + pos.y + 'px">' +
        '<div class="fc-node-bar"><span class="fc-dot"></span><span class="fc-node-type">' + t(fnLabel(n.type)) + '</span><button class="fc-del" data-del="' + n.id + '" title="' + t('Remove page') + '">✕</button><span class="fc-grip">⠿</span></div>' +
        '<div class="fc-node-body">' + body +
          '<div class="fn-acts"><a class="btn btn-default" href="' + bcEditHash(n.type, n.tpl) + '">' + t('Edit') + '</a></div>' +
        '</div>' +
        '<span class="fc-port" title="' + t('Drag to another node to connect') + '"></span>' +
      '</div>';
    };
    var nodes = (st.nodes || []).map(node).join('');
    root.innerHTML = wrap(GSTYLE + FSTYLE + XSTYLE + head(t('Funnel')) +
      '<div class="muted" style="font-size:13px;margin:2px 0 14px;line-height:1.6;max-width:820px">' + t('Your funnel as a canvas. Cart traffic splits at your Shopify store — part runs through the BestCheckout funnel, the rest stays on Shopify’s native checkout as the control. Branch any node with Add page or the ⌁ handle; drag to rearrange.') + '</div>' +
      '<div class="fc-bar">' +
        '<button class="btn btn-primary" id="fc-addbtn">+ ' + t('Add page') + '</button>' +
        '<span class="fc-sep"></span>' +
        // Tidy layout / Reset funnel removed — fnAutoLayout() runs automatically when a node is added or
// removed, so an explicit "tidy" button is redundant; "reset" was a developer convenience that
// merchants would only ever hit by accident.
'<button class="btn btn-default" data-z="out" title="Zoom out">−</button><span class="fc-zval" id="fc-z">100%</span><button class="btn btn-default" data-z="in" title="Zoom in">+</button><button class="btn btn-default" data-z="fit">' + t('Fit') + '</button>' +
        '<span class="fc-hint" id="fc-hint">' + t('Click a node to branch from it · drag the title bar to move') + '</span></div>' +
      '<div class="fc-scroll" id="fc-scroll"><div class="fc-sizer" id="fc-sizer"><div class="fc-canvas" id="fc-canvas" style="width:' + FC_W + 'px;height:' + FC_H + 'px">' +
        '<svg class="fc-edges" id="fc-edges"></svg><div class="fc-labels" id="fc-labels"></div>' + nodes +
      '</div></div></div>');
    var canvas = root.querySelector('#fc-canvas');
    root.querySelectorAll('[data-ab]').forEach(function (b) { b.onclick = function () { openFunnelAB(b.getAttribute('data-ab')); }; });
    root.querySelectorAll('[data-win]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); var s = bcFunnel(), n = fnNode(s, a.getAttribute('data-win')); if (n && n.ab) { var cA = n.ab.sA ? n.ab.oA / n.ab.sA : 0, cB = n.ab.sB ? n.ab.oB / n.ab.sB : 0; if (cB >= cA) n.tpl = n.ab.b; n.ab = null; bcFunnelSave(s); } toast(t('Winner rolled out to 100%')); renderFunnel(); }; });
    root.querySelectorAll('[data-rmab]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); var s = bcFunnel(), n = fnNode(s, a.getAttribute('data-rmab')); if (n) n.ab = null; bcFunnelSave(s); toast(t('A/B test removed')); renderFunnel(); }; });
    root.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); fnDeletePage(b.getAttribute('data-del')); }; });
    var applySel = function () { canvas.querySelectorAll('.fc-node').forEach(function (el) { el.classList.toggle('sel', el.getAttribute('data-id') === fcSel); }); };
    (st.nodes || []).forEach(function (nd) {
      var el = canvas.querySelector('.fc-node[data-id="' + nd.id + '"]'); if (!el) return;
      fcDrag(canvas, el, nd.id);
      fcPortDrag(canvas, el, nd.id);
      el.addEventListener('click', function (e) {
        if (e.target.closest('a,button')) return;
        fcSel = (fcSel === nd.id ? null : nd.id); applySel();
      });
    });
    var sc0 = root.querySelector('#fc-scroll'); if (sc0) sc0.addEventListener('click', function (e) {
      if (e.target.closest('.fc-node') || e.target.closest('.fc-ehit')) return;
      fcSel = null; applySel();
    });
    var addBtn = root.querySelector('#fc-addbtn'); if (addBtn) addBtn.onclick = function () { openPagePicker({ mode: 'add' }); };
    root.querySelectorAll('[data-swap]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); var s = bcFunnel(), n = fnNode(s, a.getAttribute('data-swap')); if (n) openPagePicker({ mode: 'swap', id: n.id, type: n.type }); }; });
    var applyZoom = function () { canvas.style.transform = 'scale(' + fcZoom + ')'; var sz = root.querySelector('#fc-sizer'); if (sz) { sz.style.width = (FC_W * fcZoom) + 'px'; sz.style.height = (FC_H * fcZoom) + 'px'; } var zl = root.querySelector('#fc-z'); if (zl) zl.textContent = Math.round(fcZoom * 100) + '%'; };
    root.querySelectorAll('[data-z]').forEach(function (b) { b.onclick = function () {
      var k = b.getAttribute('data-z');
      if (k === 'reset') { localStorage.removeItem('bsio_bc_funnel'); fcZoom = null; renderFunnel(); return; }
      if (k === 'tidy') { var s = bcFunnel(); fnAutoLayout(s); bcFunnelSave(s); toast(t('Layout tidied')); renderFunnel(); return; }
      if (k === 'fit') fcZoom = fcFit();
      else if (k === 'in') fcZoom = Math.min(1.3, Math.round(((fcZoom || 1) + 0.1) * 10) / 10);
      else fcZoom = Math.max(0.4, Math.round(((fcZoom || 1) - 0.1) * 10) / 10);
      applyZoom(); fcDrawEdges(canvas);
    }; });
    if (fcZoom == null) fcZoom = fcFit();
    applyZoom();
    fcAutoHeight(canvas);
    fcDrawEdges(canvas);
    applySel();
    bcI18n(root);
  }
  function fcFit() { var sc = document.querySelector('#fc-scroll'); return sc ? Math.max(0.4, Math.min(1, (sc.clientWidth - 26) / FC_W)) : 0.8; }
  // Canvas hugs its content: height = lowest node bottom + padding. Recomputed on render + drag.
  function fcAutoHeight(canvas) {
    // 1) the scroll window fills the viewport down to the bottom of the screen (no short card over white space)
    var scroll = document.querySelector('#fc-scroll');
    if (scroll) { var top = scroll.getBoundingClientRect().top; scroll.style.height = Math.max(380, Math.round(window.innerHeight - top - 18)) + 'px'; }
    // 2) the canvas plane hugs the content, but never shorter than the window (so the dotted area fills it)
    var max = 320;
    canvas.querySelectorAll('.fc-node').forEach(function (el) { max = Math.max(max, el.offsetTop + el.offsetHeight); });
    var fill = scroll ? Math.round((scroll.clientHeight - 6) / (fcZoom || 1)) : 0;
    FC_H = Math.max(Math.round(max + 46), fill);
    canvas.style.height = FC_H + 'px';
    var sz = document.querySelector('#fc-sizer'); if (sz) sz.style.height = (FC_H * (fcZoom || 1)) + 'px';
  }
  function fcDeleteEdge(from, to) {
    var s = bcFunnel(); s.edges = (s.edges || []).filter(function (e) { return !(e.from === from && e.to === to); });
    bcFunnelSave(s); toast(t('Connection removed')); renderFunnel();
  }
  // Click a connection → minimal menu: open the rule builder, or delete. The builder handles every
  // routing dimension (button outcomes, traffic %, customer attributes, tags…). Single-out-edge case
  // skips the routing rule option entirely — no fork, nothing to route between.
  function openEdgeMenu(from, to, x, y) {
    var ex = document.querySelector('.fc-emenu'); if (ex) ex.remove();
    var s0 = bcFunnel(), edge = (s0.edges || []).filter(function (e) { return e.from === from && e.to === to; })[0];
    if (!edge) return;
    var siblingsCount = (s0.edges || []).filter(function (e) { return e.from === from; }).length;
    var menu = document.createElement('div'); menu.className = 'fc-emenu';
    var items = '';
    if (siblingsCount < 2) {
      items = '<div class="fc-emh">' + t('Connection') + '</div>' +
              '<div class="fc-emi-info">' + t('Single path — add another branch from this node to use a routing rule.') + '</div>' +
              '<div class="fc-emsep"></div>' +
              '<button class="fc-emi del" data-act="del">' + t('Remove connection') + '</button>';
    } else {
      items = '<div class="fc-emh">' + t('Routing rule') + '</div>' +
              '<button class="fc-emi predicate" data-act="edit">' + t('Configure routing rule…') + '</button>' +
              '<div class="fc-emsep"></div>' +
              '<button class="fc-emi del" data-act="del">' + t('Remove connection') + '</button>';
    }
    menu.innerHTML = items;
    menu.style.cssText = 'position:fixed;left:' + Math.min(x, window.innerWidth - 240) + 'px;top:' + Math.min(y, window.innerHeight - 160) + 'px;z-index:120';
    document.body.appendChild(menu); bcI18n(menu);
    var close = function () { if (menu.parentNode) menu.remove(); document.removeEventListener('mousedown', outside); };
    var outside = function (e) { if (!menu.contains(e.target)) close(); };
    setTimeout(function () { document.addEventListener('mousedown', outside); }, 0);
    menu.querySelectorAll('[data-act]').forEach(function (b) { b.onclick = function () {
      var act = b.getAttribute('data-act');
      var s = bcFunnel();
      if (act === 'del') { s.edges = s.edges.filter(function (x) { return !(x.from === from && x.to === to); }); bcFunnelSave(s); close(); renderFunnel(); return; }
      if (act === 'edit') { close(); openRuleEditor(from); return; }
    }; });
  }
  // Fork edges = every out-edge from the source. The builder shows one row per edge with its conditions.
  function fnForkEdges(s, fromId) { return (s.edges || []).filter(function (e) { return e.from === fromId; }); }
  // ─── Routing rule builder (Azoya-style) ────────────────────────────────────────────────────────
  // The fork = a list of edges from `fromId`. Each edge has an `expression` rule = AND'd conditions.
  // For each edge we render: target name + condition rows + "+ add condition" + fallback checkbox.
  // Field dropdown is grouped (Basic / Behavior / Value / Tags / Action / Random); operator + value
  // controls switch based on the field's `kind`. State is buffered locally and committed on Apply.
  function openRuleEditor(fromId) {
    var s0 = bcFunnel(), branches = fnForkEdges(s0, fromId);
    if (branches.length < 2) return;
    // Deep-clone branch rules into a buffer so cancel = no save.
    var buf = branches.map(function (e) { return { from: e.from, to: e.to, rule: JSON.parse(JSON.stringify(e.rule || { type: 'expression', conditions: [] })) }; });
    var nodeOf = function (id) { var n = fnNode(s0, id) || {}; return fnIsControl(n.type) ? t('Shopify checkout') : t(fnLabel(n.type)); };
    var headTitle = t('Routing rules') + ' · ' + esc(t(fnLabel((fnNode(s0, fromId) || {}).type)));
    var m = document.createElement('div'); m.className = 'xp-modal';
    m.innerHTML = XSTYLE + FSTYLE +
      '<div class="xp-mc rb-mc"><div class="xp-mh">' + headTitle + '</div>' +
        '<div class="xp-mb"><div class="rb-list" id="rb-list"></div></div>' +
        '<div class="xp-mf"><div class="rb-msg" id="rb-msg"></div><button class="btn btn-default" id="rb-cancel">' + t('Cancel') + '</button><button class="btn btn-primary" id="rb-ok">' + t('Apply') + '</button></div>' +
      '</div>';
    document.body.appendChild(m); bcI18n(m);
    var listEl = m.querySelector('#rb-list'), msgEl = m.querySelector('#rb-msg'), okBtn = m.querySelector('#rb-ok'), cancelBtn = m.querySelector('#rb-cancel');
    var close = function () { m.remove(); };
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    cancelBtn.onclick = close;
    // Render one branch row. Fallback = explicit radio (exactly one per fork). Conditions stay
    // editable on the fallback branch too — its conditions are "preferred" but if no sibling
    // matches, traffic comes here regardless. Group `name="rb-fb-{token}"` ties the radios.
    var fbGroup = 'rb-fb-' + Math.random().toString(36).slice(2, 7);
    // Default: if no branch is marked fallback yet, set the last one (or one with no conditions)
    if (!buf.some(function (br) { return br.rule.fallback; })) {
      var empty = buf.filter(function (br) { return (br.rule.conditions || []).length === 0; })[0];
      (empty || buf[buf.length - 1]).rule.fallback = true;
    }
    // Split conditions visually into "user filter" (predicates) and "traffic weight" (random).
    // Same underlying data — `field:'random'` is still a condition — but the UI separates them so
    // merchants don't get confused about whether "45% AND new customer" means "45% of all, also new"
    // or "45% of new customers". The split makes it obvious: filters first, then % distribution.
    function render() {
      var html = '';
      buf.forEach(function (br, bi) {
        var name = nodeOf(br.to);
        var conds = (br.rule.conditions || []);
        var fb = !!br.rule.fallback;
        // Split conditions
        var filterConds = [], randomCond = null;
        conds.forEach(function (c, ci) { if (c.field === 'random') randomCond = { ci: ci, c: c }; else filterConds.push({ ci: ci, c: c }); });
        var filterHtml = filterConds.length ?
          filterConds.map(function (x) { return condRow(bi, x.ci, x.c); }).join('') :
          '<div class="rb-empty">' + t('No user filters — anyone is eligible for this branch.') + '</div>';
        var weightHtml = '';
        if (randomCond) {
          weightHtml = '<div class="rb-weight-row"><span class="rb-weight-prefix">' + t('Takes') + '</span>' +
            '<input type="number" class="rb-weight-input" data-bi="' + bi + '" min="0" max="100" value="' + esc(randomCond.c.value == null ? '' : String(randomCond.c.value)) + '">' +
            '<span class="rb-weight-suffix">' + t('% of the matched traffic') + '</span>' +
            '<button class="rb-weight-rm" data-rmw="' + bi + '" title="' + t('Remove weight') + '">✕</button></div>';
        } else {
          weightHtml = '<button class="rb-addc rb-addw" data-addw="' + bi + '">+ ' + t('Set traffic weight') + '</button>';
        }
        html += '<div class="rb-branch ' + (fb ? 'fallback' : '') + '" data-bi="' + bi + '">' +
          '<div class="rb-branch-h"><span class="rb-arrow">→</span> <b class="rb-target">' + esc(name) + '</b>' +
            '<label class="rb-fb"><input type="radio" name="' + fbGroup + '" data-fb="' + bi + '"' + (fb ? ' checked' : '') + '> ' + t('Fallback') +
              ' <span class="rb-hint" tabindex="0">?<span class="rb-tip">' + t('Traffic that no sibling branch matches goes here. The conditions below are still respected as a preference, but this branch always catches the unmatched.') + '</span></span>' +
            '</label>' +
          '</div>' +
          '<div class="rb-section-l">' + t('Who is eligible (AND):') + '</div>' +
          '<div class="rb-conds">' + filterHtml + '</div>' +
          '<button class="rb-addc" data-addc="' + bi + '">+ ' + t('Add user filter') + '</button>' +
          '<div class="rb-sep"></div>' +
          '<div class="rb-section-l">' + t('Traffic share among the eligible:') + '</div>' +
          weightHtml +
        '</div>';
      });
      listEl.innerHTML = html;
      bcI18n(listEl);
      wireBranchControls();
      validate();
    }
    function condRow(bi, ci, c) {
      var field = FIELD_CATALOG[c.field] || {};
      var kind = field.kind;
      var opMeta = OP_KINDS[kind] || { ops: [], value: 'none' };
      // Field dropdown — grouped optgroups. Random is excluded (it has its own weight UI).
      var fieldOpts = FIELD_GROUPS.filter(function (g) { return g.key !== 'random'; }).map(function (g) {
        var fs = Object.keys(FIELD_CATALOG).filter(function (k) { return FIELD_CATALOG[k].group === g.key; });
        if (!fs.length) return '';
        return '<optgroup label="' + esc(t(g.label)) + '">' + fs.map(function (k) {
          return '<option value="' + esc(k) + '"' + (k === c.field ? ' selected' : '') + '>' + esc(t(FIELD_CATALOG[k].label)) + '</option>';
        }).join('') + '</optgroup>';
      }).join('');
      // Op dropdown
      var opOpts = (opMeta.ops || []).map(function (o) { return '<option value="' + esc(o.value) + '"' + (o.value === c.op ? ' selected' : '') + '>' + esc(t(o.label)) + '</option>'; }).join('');
      // Value control
      var valHtml = '';
      if (opMeta.value === 'select') {
        var vOpts = (field.options || []).map(function (o) { return '<option value="' + esc(o.value) + '"' + (o.value === c.value ? ' selected' : '') + '>' + esc(t(o.label)) + '</option>'; }).join('');
        valHtml = '<select class="rb-val" data-bi="' + bi + '" data-ci="' + ci + '"><option value="">' + t('Select…') + '</option>' + vOpts + '</select>';
      } else if (opMeta.value === 'multi') {
        var sel = Array.isArray(c.value) ? c.value : [];
        valHtml = '<div class="rb-tags" data-bi="' + bi + '" data-ci="' + ci + '">' +
          sel.map(function (v) { return '<span class="rb-tag">' + esc(v) + '<button data-rmtag="' + esc(v) + '">×</button></span>'; }).join('') +
          '<select class="rb-tagadd"><option value="">+ ' + t('Add tag') + '</option>' + (field.options || []).filter(function (o) { return sel.indexOf(o.value) < 0; }).map(function (o) { return '<option value="' + esc(o.value) + '">' + esc(t(o.label)) + '</option>'; }).join('') + '</select>' +
        '</div>';
      } else if (opMeta.value === 'number') {
        if (c.op === 'between') {
          var lo = Array.isArray(c.value) ? c.value[0] : '', hi = Array.isArray(c.value) ? c.value[1] : '';
          valHtml = '<input type="number" class="rb-val rb-num2-lo" data-bi="' + bi + '" data-ci="' + ci + '" value="' + esc(lo == null ? '' : String(lo)) + '" placeholder="' + t('min') + '"><span class="rb-tilde">~</span><input type="number" class="rb-val rb-num2-hi" data-bi="' + bi + '" data-ci="' + ci + '" value="' + esc(hi == null ? '' : String(hi)) + '" placeholder="' + t('max') + '">';
        } else {
          valHtml = '<input type="number" class="rb-val" data-bi="' + bi + '" data-ci="' + ci + '" value="' + esc(c.value == null ? '' : String(c.value)) + '"' + (field.unit === '$' ? ' min="0"' : '') + '>' + (field.kind === 'percent' ? '<span class="rb-tilde">%</span>' : (field.unit ? '<span class="rb-tilde">' + esc(field.unit) + '</span>' : ''));
        }
      } // else: bool — no value control
      var hint = field.hint ? ' <span class="rb-hint" tabindex="0">?<span class="rb-tip">' + esc(t(field.hint)) + '</span></span>' : '';
      return '<div class="rb-cond" data-bi="' + bi + '" data-ci="' + ci + '">' +
        '<select class="rb-field">' + fieldOpts + '</select>' +
        '<select class="rb-op">' + opOpts + '</select>' +
        '<span class="rb-vwrap">' + valHtml + hint + '</span>' +
        '<button class="rb-rm" data-rm="' + bi + ',' + ci + '" title="' + t('Remove condition') + '">✕</button>' +
      '</div>';
    }
    function wireBranchControls() {
      // fallback radio — exactly one branch per fork; selecting one unmarks the others.
      listEl.querySelectorAll('[data-fb]').forEach(function (r) { r.onchange = function () {
        var bi = +r.getAttribute('data-fb');
        buf.forEach(function (br, i) { br.rule.fallback = (i === bi); });
        render();
      }; });
      // add condition
      listEl.querySelectorAll('[data-addc]').forEach(function (b) { b.onclick = function () {
        var bi = +b.getAttribute('data-addc');
        buf[bi].rule.conditions = buf[bi].rule.conditions || [];
        buf[bi].rule.conditions.push(defaultCondition(bi));
        render();
      }; });
      // remove condition (works on any branch, including the fallback)
      listEl.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () {
        var p = b.getAttribute('data-rm').split(','), bi = +p[0], ci = +p[1];
        buf[bi].rule.conditions.splice(ci, 1);
        render();
      }; });
      // add weight (random condition)
      listEl.querySelectorAll('[data-addw]').forEach(function (b) { b.onclick = function () {
        var bi = +b.getAttribute('data-addw');
        buf[bi].rule.conditions = buf[bi].rule.conditions || [];
        buf[bi].rule.conditions.push({ field: 'random', op: 'pct', value: 50 });
        render();
      }; });
      // remove weight
      listEl.querySelectorAll('[data-rmw]').forEach(function (b) { b.onclick = function () {
        var bi = +b.getAttribute('data-rmw');
        buf[bi].rule.conditions = (buf[bi].rule.conditions || []).filter(function (c) { return c.field !== 'random'; });
        render();
      }; });
      // weight input
      listEl.querySelectorAll('.rb-weight-input').forEach(function (inp) { inp.oninput = function () {
        var bi = +inp.getAttribute('data-bi');
        var rc = (buf[bi].rule.conditions || []).filter(function (c) { return c.field === 'random'; })[0];
        if (rc) { rc.value = inp.value === '' ? null : Number(inp.value); validate(); }
      }; });
      // field change
      listEl.querySelectorAll('.rb-cond').forEach(function (row) {
        var bi = +row.getAttribute('data-bi'), ci = +row.getAttribute('data-ci');
        var fieldSel = row.querySelector('.rb-field'), opSel = row.querySelector('.rb-op');
        fieldSel.onchange = function () {
          var nf = fieldSel.value, kind = (FIELD_CATALOG[nf] || {}).kind, opMeta = OP_KINDS[kind] || { ops: [] };
          buf[bi].rule.conditions[ci] = { field: nf, op: (opMeta.ops[0] || {}).value, value: kind === 'multitag' ? [] : null };
          render();
        };
        opSel.onchange = function () {
          var prev = buf[bi].rule.conditions[ci];
          var newOp = opSel.value;
          // For between switch, reset value shape
          if (newOp === 'between') buf[bi].rule.conditions[ci] = { field: prev.field, op: newOp, value: [null, null] };
          else if (prev.op === 'between') buf[bi].rule.conditions[ci] = { field: prev.field, op: newOp, value: null };
          else buf[bi].rule.conditions[ci].op = newOp;
          render();
        };
        // value inputs
        var vSel = row.querySelector('select.rb-val');
        if (vSel) vSel.onchange = function () { buf[bi].rule.conditions[ci].value = vSel.value || null; validate(); };
        var vNums = row.querySelectorAll('input.rb-val');
        if (vNums.length === 1 && !row.querySelector('.rb-num2-lo')) {
          vNums[0].oninput = function () { buf[bi].rule.conditions[ci].value = vNums[0].value === '' ? null : Number(vNums[0].value); validate(); };
        } else if (row.querySelector('.rb-num2-lo')) {
          var lo = row.querySelector('.rb-num2-lo'), hi = row.querySelector('.rb-num2-hi');
          [lo, hi].forEach(function (el) { el.oninput = function () {
            buf[bi].rule.conditions[ci].value = [lo.value === '' ? null : Number(lo.value), hi.value === '' ? null : Number(hi.value)];
            validate();
          }; });
        }
        // multitag controls
        var tagWrap = row.querySelector('.rb-tags');
        if (tagWrap) {
          tagWrap.querySelectorAll('[data-rmtag]').forEach(function (rb) { rb.onclick = function () {
            var v = rb.getAttribute('data-rmtag');
            buf[bi].rule.conditions[ci].value = (buf[bi].rule.conditions[ci].value || []).filter(function (x) { return x !== v; });
            render();
          }; });
          var addSel = tagWrap.querySelector('.rb-tagadd');
          if (addSel) addSel.onchange = function () {
            if (!addSel.value) return;
            var cur = buf[bi].rule.conditions[ci].value || [];
            buf[bi].rule.conditions[ci].value = cur.concat([addSel.value]);
            render();
          };
        }
      });
    }
    function defaultCondition(bi) {
      var srcType = (fnNode(s0, fromId) || {}).type;
      // Pick a sensible default based on source: Upsell/Downsell → action; otherwise → customer.type
      if (srcType === 'upsell') return { field: 'action.upsell', op: 'eq', value: 'accept' };
      if (srcType === 'downsell') return { field: 'action.downsell', op: 'eq', value: 'accept' };
      return { field: 'customer.type', op: 'eq', value: 'new' };
    }
    // Validation: at most one fallback per fork; no two non-fallback branches with the same conditions
    // (catches "both branches set to '新客'"); random conditions on the same source sum to 100 if any.
    function validate() {
      var errs = [];
      // Radio enforces "exactly one fallback" so no count check needed — but a defensive nudge if 0.
      if (!buf.some(function (b) { return b.rule.fallback; })) errs.push(t('Pick one branch as the fallback.'));
      // Random % sum check — per FILTER GROUP, not global. Branches with the same filter signature
      // share the segment, and weights within that segment must sum to 100. Different segments are
      // independent (e.g. new@20+new@80 = 100, returning@60+returning@40 = 100, fallback catches rest).
      var sumGroups = {};
      buf.forEach(function (b) {
        if (b.rule.fallback) return;
        var conds = b.rule.conditions || [];
        var randomC = conds.filter(function (c) { return c.field === 'random'; })[0];
        if (!randomC) return;
        var sig = conds.filter(function (c) { return c.field !== 'random'; }).map(function (c) { return c.field + ':' + c.op + ':' + JSON.stringify(c.value); }).sort().join('|');
        (sumGroups[sig] = sumGroups[sig] || []).push(randomC);
      });
      Object.keys(sumGroups).forEach(function (sig) {
        var arr = sumGroups[sig]; if (arr.length < 2) return;
        var sum = arr.reduce(function (a, c) { return a + (c.value != null ? Number(c.value) : 0); }, 0);
        if (sum !== 100) errs.push(t('Traffic %s for this segment must total 100') + ' (' + t('now') + ' ' + sum + ')');
      });
      // Duplicate-rule detection — only fires when both branches have IDENTICAL user filters AND
      // NEITHER has a random weight (weight is a valid differentiator). So 45/45 split with no
      // filters is fine (it's an A/B test); but two branches with the same filter and no random is
      // ambiguous.
      var sigs = {}, dup = null;
      buf.forEach(function (b) {
        if (b.rule.fallback) return;
        var hasRandom = (b.rule.conditions || []).some(function (c) { return c.field === 'random'; });
        if (hasRandom) return;
        var filterConds = (b.rule.conditions || []).filter(function (c) { return c.field !== 'random'; });
        if (!filterConds.length) return;  // empty filter without random → handled by fallback/A-B with random
        var key = filterConds.map(function (c) { return c.field + ':' + c.op + ':' + JSON.stringify(c.value); }).sort().join('|');
        if (sigs[key]) dup = b; else sigs[key] = true;
      });
      if (dup) errs.push(t('Two branches share the same user filters with no traffic weight — add a filter or weight to differentiate.'));
      // Missing values (any branch — even fallback's conditions should be complete).
      var missing = false;
      buf.forEach(function (b) {
        (b.rule.conditions || []).forEach(function (c) {
          var f = FIELD_CATALOG[c.field] || {};
          if (f.kind === 'multitag') { if (!Array.isArray(c.value) || !c.value.length) missing = true; }
          else if (f.kind === 'bool') { /* no value */ }
          else if (c.op === 'between') { if (!Array.isArray(c.value) || c.value[0] == null || c.value[1] == null) missing = true; }
          else { if (c.value == null || c.value === '') missing = true; }
        });
      });
      if (missing) errs.push(t('Some conditions are missing values.'));
      msgEl.textContent = errs[0] || '';
      msgEl.className = 'rb-msg' + (errs.length ? ' err' : '');
      okBtn.disabled = errs.length > 0;
    }
    okBtn.onclick = function () {
      var s = bcFunnel(), live = fnForkEdges(s, fromId);
      buf.forEach(function (br, i) { if (live[i]) live[i].rule = JSON.parse(JSON.stringify(br.rule)); });
      bcFunnelSave(s); close(); toast(t('Routing rules updated')); renderFunnel();
    };
    render();
  }
  // Small confirm/info modal (reuses the xp-modal shell) for demo actions that would call out to Shopify.
  function bcModal(title, html, okText, onOk) {
    var m = document.createElement('div'); m.className = 'xp-modal';
    // bcModal can be opened from pages that don't inject the funnel styles (e.g. Connect) — carry them.
    m.innerHTML = XSTYLE + FSTYLE + '<div class="xp-mc"><div class="xp-mh">' + esc(title) + '</div><div class="xp-mb">' + html + '</div>' +
      '<div class="xp-mf"><button class="btn btn-default" id="bm-cancel">' + t('Cancel') + '</button><button class="btn btn-primary" id="bm-ok">' + esc(okText) + '</button></div></div>';
    document.body.appendChild(m); bcI18n(m);
    var close = function () { m.remove(); };
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    m.querySelector('#bm-cancel').onclick = close;
    m.querySelector('#bm-ok').onclick = function () { close(); if (onOk) onOk(); };
    return m;
  }
  // Append a page, branched from the SELECTED node (or the last node if nothing is selected). Two
  // children off one node = a traffic-split fork (a page-level A/B), which fcDrawEdges labels with %.
  // Smart default parent for "Add page" — pick the most likely upstream node by type, so the
  // merchant doesn't have to think. E.g. adding a checkout? branch from Shopify. Adding an upsell?
  // branch from the latest checkout. Falls through to source if nothing matches.
  function fnDefaultParent(s, type) {
    var nodes = s.nodes || [];
    var lastOf = function (preds) { for (var i = nodes.length - 1; i >= 0; i--) if (preds.indexOf(nodes[i].type) >= 0) return nodes[i].id; return null; };
    var src = nodes.filter(function (n) { return fnIsSource(n.type); })[0];
    if (type === 'checkout') return src ? src.id : null;
    if (type === 'upsell')   return lastOf(['checkout']) || lastOf(['upsell']) || (src && src.id);
    if (type === 'downsell') return lastOf(['upsell'])   || lastOf(['checkout']) || (src && src.id);
    if (type === 'thankyou') return lastOf(['upsell', 'downsell']) || lastOf(['checkout']) || (src && src.id);
    return src ? src.id : null;
  }
  function fnAddPage(type, tpl, parentIdOverride) {
    var s = bcFunnel();
    s.nodes = s.nodes || []; s.edges = s.edges || [];
    var parentId = parentIdOverride === undefined ? (fcSel || null) : parentIdOverride;  // '' / null = free
    var parent = parentId ? fnNode(s, parentId) : null;
    var id = fnUid(), pos;
    if (parent) {
      var pp = parent.pos || { x: 60, y: 80 };
      var sibs = s.edges.filter(function (e) { return e.from === parent.id; }).length;
      pos = { x: Math.min(FC_W - 250, pp.x + 280), y: Math.max(16, pp.y + sibs * 150) };
    } else {
      var maxB = 40; s.nodes.forEach(function (n) { if (n.pos) maxB = Math.max(maxB, n.pos.y + 150); });
      pos = { x: 60, y: maxB + 24 };   // drop in open space below; wire it with the ⌁ handle
    }
    s.nodes.push({ id: id, type: type, tpl: tpl || (type === 'checkout' ? 'standard' : 'default'), pos: pos });
    if (parent) s.edges.push({ from: parent.id, to: id });
    bcFunnelSave(s); toast(parent ? t('Page added') : t('Page added — connect it with the ⌁ handle')); renderFunnel();
  }
  // Contextual template picker — replaces the standalone Templates library. Add mode: pick page type,
  // then a template (system + the merchant's saved ones) for it. Swap mode: change one node's template.
  function openPagePicker(opts) {
    opts = opts || {}; var mode = opts.mode || 'add';
    var TYPES = ['checkout', 'upsell', 'downsell', 'thankyou'];
    var s0 = bcFunnel();
    var selType = mode === 'swap' ? opts.type : 'checkout';
    var selTpl = mode === 'swap' ? (fnNode(s0, opts.id) || {}).tpl : null;
    var m = document.createElement('div'); m.className = 'xp-modal';
    var selParent = null;
    var parentLabel = function (n) {
      if (fnIsSource(n.type)) return t('Shopify store');
      if (fnIsControl(n.type)) return t('Shopify checkout');
      return t(fnLabel(n.type)) + ' #' + n.id.slice(-3);
    };
    var renderFromRow = function () {
      var sCur = bcFunnel();
      var defId = fcSel || fnDefaultParent(sCur, selType);
      if (selParent === null) selParent = defId || '';
      var opts = (sCur.nodes || []).map(function (n) {
        return '<option value="' + esc(n.id) + '"' + (n.id === selParent ? ' selected' : '') + '>' + esc(parentLabel(n)) + '</option>';
      }).join('');
      var noneSel = (selParent === '' || selParent == null) ? ' selected' : '';
      return '<div class="xp-f"><label>' + t('Branch from') + '</label>' +
        '<select class="se-pred" id="pp-from"><option value=""' + noneSel + '>' + t('(Free — connect later with the drag handle)') + '</option>' + opts + '</select>' +
      '</div>';
    };
    var fromRow = mode === 'add' ? renderFromRow() : '';
    var typeRow = mode === 'add' ? '<div class="xp-f"><label>' + t('Page type') + '</label><div class="pp-types">' +
      TYPES.map(function (ty) { return '<button type="button" class="pp-type' + (ty === selType ? ' on' : '') + '" data-ty="' + ty + '">' + t(fnLabel(ty)) + '</button>'; }).join('') + '</div></div>' : '';
    m.innerHTML = '<div class="xp-mc"><div class="xp-mh">' + (mode === 'swap' ? t('Change template') : t('Add a page')) + '</div><div class="xp-mb">' +
      typeRow + '<div class="xp-f"><label>' + t('Template') + '</label><div class="pp-tpls" id="pp-tpls"></div></div>' + fromRow +
      '</div><div class="xp-mf"><button class="btn btn-default" id="pp-cancel">' + t('Cancel') + '</button><button class="btn btn-primary" id="pp-ok">' + (mode === 'swap' ? t('Apply') : t('Add page')) + '</button></div></div>';
    document.body.appendChild(m);
    var wireFromSel = function () {
      var sel = m.querySelector('#pp-from'); if (sel) sel.onchange = function () { selParent = sel.value; };
    };
    wireFromSel();
    var renderTpls = function () {
      var list = bcTplList(selType).filter(function (x) { return !x.soon; });
      if (!selTpl || !list.some(function (x) { return x.id === selTpl; })) selTpl = list[0] && list[0].id;
      m.querySelector('#pp-tpls').innerHTML = list.map(function (x) {
        return '<button type="button" class="pp-tpl' + (x.id === selTpl ? ' on' : '') + '" data-tpl="' + x.id + '">' +
          '<span class="pp-thumb-wrap">' + bcTplThumb(x) + '</span>' +
          '<span class="pp-tpl-info"><span class="pp-tpl-nm">' + esc(x.name) + '</span>' +
            (x.tag ? '<span class="pp-tpl-tag">' + esc(t(x.tag)) + '</span>' : '') +
          '</span>' +
          (x.system ? '<span class="tp-sys">' + t('System') + '</span>' : '<span class="tp-saved">' + t('Saved') + '</span>') + '</button>';
      }).join('');
      m.querySelectorAll('#pp-tpls [data-tpl]').forEach(function (b) { b.onclick = function () { selTpl = b.getAttribute('data-tpl'); renderTpls(); }; });
    };
    renderTpls(); bcI18n(m);
    m.querySelectorAll('[data-ty]').forEach(function (b) { b.onclick = function () {
      selType = b.getAttribute('data-ty'); m.querySelectorAll('[data-ty]').forEach(function (x) { x.classList.toggle('on', x === b); });
      selTpl = null; selParent = null;  // reset so renderFromRow recomputes by new type
      // re-render the "branch from" row
      var fromHostBefore = m.querySelector('#pp-from'); if (fromHostBefore) { var newRow = renderFromRow(); fromHostBefore.closest('.xp-f').outerHTML = newRow; wireFromSel(); }
      renderTpls(); bcI18n(m);
    }; });
    var close = function () { m.remove(); };
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    m.querySelector('#pp-cancel').onclick = close;
    m.querySelector('#pp-ok').onclick = function () {
      if (!selTpl) { close(); return; }
      if (mode === 'swap') { var s = bcFunnel(), n = fnNode(s, opts.id); if (n) n.tpl = selTpl; bcFunnelSave(s); close(); toast(t('Template changed')); renderFunnel(); }
      else { close(); fnAddPage(selType, selTpl, selParent || ''); }
    };
  }
  function fnDeletePage(id) {
    var s = bcFunnel();
    s.nodes = (s.nodes || []).filter(function (n) { return n.id !== id; });
    s.edges = (s.edges || []).filter(function (e) { return e.from !== id && e.to !== id; });
    bcFunnelSave(s); toast(t('Page removed')); renderFunnel();
  }
  // Draw the routing arrows by measuring the live node boxes — handles drag + variable A/B-node height.
  function fcDrawEdges(canvas) {
    var svg = canvas.querySelector('#fc-edges'), labels = canvas.querySelector('#fc-labels');
    if (!svg) return;
    var paths = '', lab = '';
    // Sibling count per source for "is this edge in a fork?" — drives whether label is clickable.
    var siblings = {};
    fcEdges.forEach(function (e) { siblings[e.from] = (siblings[e.from] || 0) + 1; });
    var COLS = { accept: '#1f8f4e', decline: '#d98a2b', random: '#2b62d6', predicate: '#7b4bd0', fallback: '#9aa3af' };
    var MARKS = { accept: 'fcAa', decline: 'fcAd', random: 'fcAs', predicate: 'fcAp', fallback: 'fcA' };
    fcEdges.forEach(function (e) {
      var a = canvas.querySelector('.fc-node[data-id="' + e.from + '"]'), b = canvas.querySelector('.fc-node[data-id="' + e.to + '"]');
      if (!a || !b) return;
      var ax = a.offsetLeft + a.offsetWidth, ay = a.offsetTop + a.offsetHeight * (e.fromY || 0.5);
      // Back off the endpoint by ~6px so the arrowhead tip sits *just outside* the node border
      // rather than overlapping the body content (markers in strokeWidth units overshoot otherwise).
      // -10 leaves room for the SVG marker so the arrow head doesn't visually pierce
      // the target node's body. -6 was still too short on dense layouts.
      var bx = b.offsetLeft - 10, by = b.offsetTop + b.offsetHeight * 0.5;
      var dx = Math.max(46, Math.abs(bx - ax) / 2);
      var kind = fnRuleKind(e);
      var col = COLS[kind] || '#9aa3af', mk = MARKS[kind] || 'fcA';
      // dashed if any random condition is present (visual: "split" still reads as dashed line)
      var hasRandom = fnRuleConds(e).some(function (c) { return c.field === 'random'; });
      var dash = (hasRandom && kind !== 'accept' && kind !== 'decline' ? ' stroke-dasharray="6 4"' : '');
      var d = 'M' + ax + ' ' + ay + ' C' + (ax + dx) + ' ' + ay + ',' + (bx - dx) + ' ' + by + ',' + bx + ' ' + by;
      paths += '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2"' + dash + ' marker-end="url(#' + mk + ')"/>' +
        '<path class="fc-ehit" data-ef="' + esc(e.from) + '" data-et="' + esc(e.to) + '" d="' + d + '" fill="none" stroke="transparent" stroke-width="16"><title>' + t('Click to configure this connection') + '</title></path>';
      // Label = comma-joined condition values (from fnRuleLabel). Show only if it's a fork.
      var labelText = (siblings[e.from] >= 2) ? fnRuleLabel(e) : '';
      var editAttr = labelText ? ' data-edit="' + esc(e.from) + '" title="' + t('Click to edit the routing rules') + '"' : '';
      if (labelText) { var mx = (ax + bx) / 2, my = (ay + by) / 2 - 1; lab += '<div class="fc-elabel ' + kind + '"' + editAttr + ' style="left:' + mx + 'px;top:' + my + 'px">' + esc(labelText) + '</div>'; }
    });
    svg.innerHTML = '<defs>' +
      '<marker id="fcA" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0 0L7 3L0 6Z" fill="#9aa3af"/></marker>' +
      '<marker id="fcAa" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0 0L7 3L0 6Z" fill="#1f8f4e"/></marker>' +
      '<marker id="fcAd" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0 0L7 3L0 6Z" fill="#d98a2b"/></marker>' +
      '<marker id="fcAs" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0 0L7 3L0 6Z" fill="#2b62d6"/></marker>' +
      '<marker id="fcAp" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0 0L7 3L0 6Z" fill="#7b4bd0"/></marker>' +
      '</defs>' + paths;
    if (labels) { labels.innerHTML = lab; labels.querySelectorAll('[data-edit]').forEach(function (el) { el.onclick = function (ev) { ev.stopPropagation(); openRuleEditor(el.getAttribute('data-edit')); }; }); }
    svg.querySelectorAll('.fc-ehit').forEach(function (p) { p.onclick = function (ev) { ev.stopPropagation(); openEdgeMenu(p.getAttribute('data-ef'), p.getAttribute('data-et'), ev.clientX, ev.clientY); }; });
  }
  // Drag a node by its title bar; persist node.pos by id so the layout sticks across reloads.
  function fcDrag(canvas, node, id) {
    var bar = node.querySelector('.fc-node-bar'); if (!bar) return;
    bar.addEventListener('mousedown', function (ev) {
      if (ev.button !== 0 || (ev.target.closest && ev.target.closest('.fc-del'))) return;
      ev.preventDefault();
      var sx = ev.clientX, sy = ev.clientY, ol = node.offsetLeft, ot = node.offsetTop;
      node.style.zIndex = '5';
      var mv = function (e) {
        node.style.left = Math.max(0, ol + (e.clientX - sx) / fcZoom) + 'px';
        node.style.top = Math.max(0, ot + (e.clientY - sy) / fcZoom) + 'px';
        fcDrawEdges(canvas); fcAutoHeight(canvas);
      };
      var up = function () {
        document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up);
        node.style.zIndex = '';
        var s = bcFunnel(), n = fnNode(s, id); if (n) { n.pos = { x: node.offsetLeft, y: node.offsetTop }; bcFunnelSave(s); }
      };
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
    });
  }
  // Feishu/draw.io-style "drag from port" connection. Hover a node → blue dot appears on its right
  // edge; drag from the dot → SVG ghost line follows the cursor; release over another node → edge
  // created. Keeps the ⌁ button as a click-based fallback so keyboard users aren't stranded.
  function fcPortDrag(canvas, node, id) {
    var port = node.querySelector('.fc-port'); if (!port) return;
    port.addEventListener('mousedown', function (ev) {
      if (ev.button !== 0) return;
      ev.preventDefault(); ev.stopPropagation();
      var svg = canvas.querySelector('#fc-edges'); if (!svg) return;
      var rect = canvas.getBoundingClientRect();
      var sx = node.offsetLeft + node.offsetWidth, sy = node.offsetTop + node.offsetHeight / 2;
      var ghost = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      ghost.setAttribute('stroke', '#2b62d6'); ghost.setAttribute('stroke-width', '2');
      ghost.setAttribute('stroke-dasharray', '5 3'); ghost.setAttribute('fill', 'none');
      ghost.setAttribute('marker-end', 'url(#fcAs)');
      svg.appendChild(ghost);
      canvas.classList.add('fc-connecting');
      var lastTarget = null;
      function mv(e) {
        var z = fcZoom || 1;
        var cx = (e.clientX - rect.left) / z, cy = (e.clientY - rect.top) / z;
        var dx = Math.max(46, Math.abs(cx - sx) / 2);
        ghost.setAttribute('d', 'M' + sx + ' ' + sy + ' C' + (sx + dx) + ' ' + sy + ',' + (cx - dx) + ' ' + cy + ',' + cx + ' ' + cy);
        var hover = document.elementFromPoint(e.clientX, e.clientY);
        var tn = hover ? hover.closest('.fc-node') : null;
        if (tn === node) tn = null;
        if (tn !== lastTarget) {
          if (lastTarget) lastTarget.classList.remove('fc-drop-target');
          if (tn) tn.classList.add('fc-drop-target');
          lastTarget = tn;
        }
      }
      function up(e) {
        document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up);
        ghost.remove();
        canvas.classList.remove('fc-connecting');
        if (lastTarget) lastTarget.classList.remove('fc-drop-target');
        var hover = document.elementFromPoint(e.clientX, e.clientY);
        var target = hover ? hover.closest('.fc-node') : null;
        if (target && target !== node) {
          var targetId = target.getAttribute('data-id');
          var s = bcFunnel(); s.edges = s.edges || [];
          if (!s.edges.some(function (e2) { return e2.from === id && e2.to === targetId; })) {
            s.edges.push({ from: id, to: targetId, rule: { type: 'expression', conditions: [], fallback: true } });
            bcFunnelSave(s); toast(t('Connected')); renderFunnel();
          }
        }
      }
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
    });
  }
  function openFunnelAB(id) {
    var s0 = bcFunnel(), nd = fnNode(s0, id); if (!nd) return;
    var type = nd.type;
    var tpls = bcTplList(type).filter(function (x) { return !x.soon; });
    var cur = nd.tpl || (tpls[0] && tpls[0].id);
    var opts = tpls.filter(function (x) { return x.id !== cur; }).map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join('');
    if (!opts) { toast(t('This page has only one template — open 装修, then “Save as template” to make variant B, and A/B-test it.')); location.hash = bcEditHash(type, cur); return; }
    var m = document.createElement('div'); m.className = 'xp-modal';
    m.innerHTML = '<div class="xp-mc"><div class="xp-mh">' + t('New A/B test') + ' · ' + t(fnLabel(type)) + '</div><div class="xp-mb">' +
      '<div class="xp-f"><label>' + t('Variant A (current)') + '</label><input readonly value="' + esc(bcTplName(type, cur)) + '" style="height:38px;border:1px solid var(--line);border-radius:8px;padding:0 11px;font-size:13.5px;color:var(--ink-muted);background:var(--panel)"></div>' +
      '<div class="xp-f"><label>' + t('Variant B') + '</label><select id="fab-b">' + opts + '</select></div>' +
      '<div class="xp-f"><label>' + t('Split by') + '</label><div class="fab-seg"><button type="button" class="fab-segbtn on" data-by="traffic">' + t('Traffic %') + '</button><button type="button" class="fab-segbtn" data-by="user">' + t('User type') + '</button></div></div>' +
      '<div class="xp-f" id="fab-traffic"><label>' + t('Traffic split') + ' · <span id="fab-sl">50% / 50%</span></label><div class="xp-split"><b>A</b><input type="range" id="fab-split" min="10" max="90" step="5" value="50"><b>B</b></div></div>' +
      '<div class="xp-f" id="fab-usernote" hidden><div class="fab-note"><b>A → ' + t('New') + '</b> · ' + t('no paid order yet') + '<br><b>B → ' + t('Returning') + '</b> · ' + t('1+ paid order') + '<br><span style="opacity:.7">' + t('Read from the connected Shopify customer record.') + '</span></div></div>' +
      '</div><div class="xp-mf"><button class="btn btn-default" id="fab-cancel">' + t('Cancel') + '</button><button class="btn btn-primary" id="fab-start">' + t('Start A/B test') + '</button></div></div>';
    document.body.appendChild(m); bcI18n(m);
    var close = function () { m.remove(); };
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    m.querySelector('#fab-cancel').onclick = close;
    var by = 'traffic';
    m.querySelectorAll('[data-by]').forEach(function (b) { b.onclick = function () {
      by = b.getAttribute('data-by');
      m.querySelectorAll('[data-by]').forEach(function (x) { x.classList.toggle('on', x === b); });
      m.querySelector('#fab-traffic').hidden = (by === 'user');
      m.querySelector('#fab-usernote').hidden = (by !== 'user');
    }; });
    var sl = m.querySelector('#fab-split'), sll = m.querySelector('#fab-sl');
    sl.oninput = function () { sll.textContent = sl.value + '% / ' + (100 - sl.value) + '%'; };
    m.querySelector('#fab-start').onclick = function () {
      var s = bcFunnel(), n = fnNode(s, id); if (!n) { close(); return; }
      n.tpl = cur; n.ab = { b: m.querySelector('#fab-b').value, splitBy: by, splitA: by === 'user' ? 50 : parseInt(sl.value, 10), sA: 0, oA: 0, sB: 0, oB: 0, conf: 0 };
      bcFunnelSave(s); close(); toast(t('A/B test started — collecting data')); renderFunnel();
    };
  }
  // Register the BestCheckout sub-menu labels with the runtime-i18n overlay (sidebar is shell-rendered,
  // outside this module's bcI18n scope, so it needs the global DICT to show ZH).
  if (window.I18N && window.I18N.extend) window.I18N.extend({ 'Funnel': '漏斗', 'Templates': '模板库', 'Connection': '连接' });

  // ---- i18n (EN / 中文). The module renders English; a post-render DOM pass swaps
  //      exact-match UI strings to 中文 when the admin language is zh. Demo data
  //      (names / products / numbers) isn't in the map, so it stays as-is. ----
  const ZH = {
    'Overview': '总览', 'Payment routing': '支付路由', 'Subscriptions': '订阅', 'Post-purchase': '购后追加', 'Funnel editor': '漏斗编辑器', 'Shopify connect': 'Shopify 接入', 'Reports': '报表',
    /* Onboarding / activation checklist */
    'Get BestCheckout live': '让 BestCheckout 跑起来', 'Activation progress': '激活进度', 'Required left': '剩余必填',
    'done': '已完成', 'Collapse': '折叠', 'Required to launch': '上线还差', 'more steps': '步',
    'All required steps done — your funnel is ready to take orders.': '必填项全部完成——漏斗已可接单。',
    'Shopify connected': 'Shopify 已连接', 'Reconnect': '重新连接',
    'Data synced': '数据已同步', 'Products, inventory, discounts pulled from Shopify': '商品、库存、折扣从 Shopify 同步过来', 'View sync status': '查看同步状态',
    'Configure payments': '配置支付', 'Card processor (Airwallex / Stripe / PayPal Advanced) + PayPal wallet': '卡通道(Airwallex / Stripe / PayPal Advanced)+ PayPal 钱包',
    'Enable checkout intercept': '启用结账拦截', 'App Embed catches your cart Checkout button — no theme edits': 'App Embed 拦截购物车「Checkout」按钮——不改主题代码', 'Open Shopify theme': '打开 Shopify 主题',
    'Shipping rules': '物流规则', 'Inherits Shopify shipping by default — confirm or customize': '默认继承 Shopify 运费——确认或自定义', 'Review': '查看',
    'Custom checkout domain': '自定义结账域名', 'checkout.yourbrand.com — branded, auto-SSL': 'checkout.yourbrand.com——品牌化,SSL 自动签发', 'Set CNAME': '设置 CNAME',
    'Sender email / SMTP': '发件邮箱 / SMTP', 'Order confirmations from your own domain (lifts deliverability)': '订单确认邮件用品牌域名发出(提升到达率)', 'Configure': '配置',
    'Pick / customize template': '选 / 装修结账模板', 'Standard works out of the box — switch to Conversion or customize': '标准版开箱即用——可换成转化版或装修', 'Open funnel': '打开漏斗',
    'First order': '首单到账', 'Auto-checked when the first BestCheckout order writes back to Shopify': '首笔 BestCheckout 订单写回 Shopify 时自动勾选', 'Mark as live (demo)': '标记为已上线 (演示)', 'Marked complete': '已标记完成',
    '(recommended)': '(推荐)',
    /* Payment branch question */
    'Which payment accounts do you have?': '你有哪些支付账号?',
    'None yet': '暂时没有',
    'Tell us what you have — we’ll recommend the right combo.': '告诉我们你有什么——我们推荐合适的组合。',
    'No problem — Airwallex is easiest to apply for. Stripe is fastest in most regions.': '没问题——Airwallex 申请最容易,Stripe 在大多数地区开通最快。',
    'processes Card · Apple Pay · Google Pay': '处理 Card · Apple Pay · Google Pay',
    'use PayPal Advanced for Card. Note: PayPal Express wallet is paused for IG/FB compat.': '用 PayPal Advanced 收卡。注意:PayPal Express 钱包按钮因 IG/FB 兼容问题暂未上线。',
    'Connect now': '现在去连接', 'Apply for Airwallex': '申请 Airwallex',
    'Approval rate': '过单率', 'AOV': '客单价', 'Subscription retention': '订阅留存', 'Chargeback rate': '拒付率', 'GMV · 30d': 'GMV · 30 天', 'Recovered by routing': '路由救回',
    'multi-MID routing + cascade': '多 MID 路由 + 级联', 'post-purchase + order bumps': '购后追加 + 凑单', 'cycle-over-cycle': '逐周期', 'RDR + Ethoca + 3DS': 'RDR + Ethoca + 3DS', 'routed via BestCheckout': '经 BestCheckout 路由', 'cascade + recycle saves': '级联 + 回收救回',
    'Routing performance': '路由表现', 'AI recommendations': 'AI 建议', 'View all': '查看全部', 'Recent high-impact activity': '近期高价值动作', 'Approval %': '过单率', 'Recovered': '救回',
    'Cascade': '级联', 'Recycle': '回收', 'Routing': '路由', 'Churn': '挽留', 'RDR': 'RDR',
    '+1 save': '+1 救回', 'rule fired': '规则触发', 'retained': '已挽留', 'CB avoided': '避免拒付',
    'Blended approval': '综合过单率', 'Cascade saves · 30d': '级联救回 · 30 天', 'Recycle saves · 30d': '回收救回 · 30 天', 'Active MIDs': '活跃 MID', '1 backup': '1 个备用',
    'Gateways & MIDs': '网关 / MID', 'Add MID': '添加 MID', 'MID / gateway': 'MID / 网关', 'Processor': '处理器', 'Category': '类目', 'MTD / cap': '本月 / 上限', 'Approval': '过单率', 'DR · txn · CB': '折扣率 · 笔费 · 拒付费', 'Cards': '卡种', 'Status': '状态', 'no cap': '无上限',
    'Routing rules (ATRI)': '路由规则（ATRI）', 'New rule': '新建规则', 'Rule': '规则', 'Algorithm': '算法', 'Condition': '条件',
    'Cascade — soft-decline retry': '级联 — 软拒重试', 'Recycle — failed-rebill recovery': '回收 — 续费失败救回', 'Attempt': '尝试', 'Wait': '等待', 'Price': '价格',
    'Try 1': '第 1 次', 'Try 2–5': '第 2–5 次', 'Stop': '停止', 'Best MID by rule': '按规则选最优 MID', 'Next-best MID, never repeat': '次优 MID，不重复', 'Hard decline or 5 tries': '硬拒或满 5 次',
    'All': '全部', 'Trial': '试用', 'Active': '活跃', 'Cancelled': '已取消', 'Recycle failed': '回收失败', 'Backup': '备用', 'On': '开', 'Off': '关',
    'Customer': '客户', 'Product': '产品', 'Frequency': '频率', 'Cycle': '周期', 'Next bill': '下次扣款', 'Amount': '金额', 'Next MID': '下次 MID', 'Action': '操作', 'Manage': '管理',
    'Subscribe & Save profiles': 'Subscribe & Save 方案', 'Profile': '方案', 'Base product': '基础产品', 'Frequencies': '频率', 'Discount': '折扣', 'Subs': '订阅数',
    'Churn-saver — cancel workflow': '挽留 — 取消工作流',
    'The funnel': '转化漏斗', 'Checkout': '结账', 'Upsell': '追加', 'Downsell': '降级', 'Thank you': '致谢页', 'Order bump': '凑单',
    'Single-page · order bump': '单页 · 凑单', 'One-click, no re-enter card': '一键，无需重输卡', 'On decline of the upsell': '追加被拒时', 'Write order back to Shopify': '订单写回 Shopify',
    'Offers': '报价', 'New offer': '新建报价', 'Offer': '报价', 'Type': '类型', 'Trigger': '触发', 'Take rate': '接受率', 'Edit': '编辑',
    'Connected': '已连接', 'OK': '正常', 'Re-sync now': '立即重新同步', 'Disconnect': '断开连接', 'Sync status': '同步状态', 'Entity': '实体', 'Direction': '方向', 'Synced': '已同步', 'Mapped': '已映射', 'Webhooks': 'Webhooks',
    'Retention — cycle by cycle': '留存 — 逐周期', 'Attempted': '尝试', 'Approvals': '通过', 'Recycle saves': '回收救回', 'Retention': '留存', 'Net': '净额',
    'Card processing — by BIN': '过单 — 按 BIN', 'BIN': 'BIN', 'Brand': '卡组织', 'Issuer': '发卡行', 'Rebill appr.': '续费过单', 'CB %': '拒付率', 'Overall': '综合',
    'Page types': '页面类型', 'Funnel': '漏斗', 'Settings': '设置', 'Save': '保存', 'Preview': '预览', 'Locked': '锁定',
    'Landing page': '落地页', 'Landing': '落地页', 'Survey': '调查', 'Generic page': '通用页', 'Generic': '通用页',
    'Step name': '步骤名称', 'Route on accept': '接受后跳转', 'Route on decline': '拒绝后跳转',
    'Drag a page type onto the funnel, or reorder steps by dragging. Checkout & Thank you are locked.': '把页面类型拖到漏斗里，或拖动步骤重新排序。结账与致谢页已锁定。',
    'Step added': '已添加步骤', 'Step removed': '已删除步骤', 'Saved': '已保存',
    'Add a page': '添加页面', 'Funnel flow': '漏斗流程', 'Back to funnel': '返回漏斗', 'Blocks': '区块', 'Add block': '添加区块', 'Block settings': '区块设置',
    'Block added': '已添加区块', 'Block removed': '已删除区块',
    'No blocks yet.': '暂无区块。', 'Select a block to edit it.': '选择一个区块进行编辑。', 'No editable settings for this block.': '该区块暂无可编辑设置。', 'Add blocks to design this page': '添加区块来设计此页面',
    'Click a page type to add it before Thank you, drag a step to reorder, then click Edit on any step to design its page. Checkout and Thank you can be edited but not removed.': '点击页面类型即可在「致谢页」前添加；拖动步骤可重新排序；点击任意步骤的「编辑」即可设计该页面。结账页与致谢页可编辑但不可删除。',
    'Headline': '标题', 'Text': '文本', 'Image': '图片', 'Button': '按钮', 'Yes / No buttons': '是 / 否按钮', 'Countdown timer': '倒计时', 'Reviews': '评价', 'Feature list': '功能列表', 'Hero': '主视觉', 'Logo': 'Logo', 'Contact': '联系方式', 'Shipping': '配送', 'Payment': '支付', 'Order summary': '订单摘要', 'Tracking': '物流追踪',
    'Subtitle': '副标题', 'Button label': '按钮文字', 'Product name': '产品名称', 'Compare-at (optional)': '原价（可选）', 'Label': '文字', 'Color': '颜色', 'Yes button': '“是”按钮', 'Decline link': '拒绝链接', 'Title': '标题', 'Add-on price': '加购价格', 'Minutes': '分钟', 'Brand text': '品牌文字', 'Section title': '区块标题',
    'Welcome to BestCheckout': '欢迎使用 BestCheckout',
    'Connect your Shopify store to start — your storefront stays on Shopify, orders sync back.': '先连接你的 Shopify 店铺即可开始——店铺前台仍在 Shopify,订单自动回写。',
    'Connect your Shopify store': '连接你的 Shopify 店铺', 'Connect Shopify': '连接 Shopify', 'Connected to Shopify': '已连接 Shopify',
    'We never touch your Shopify storefront checkout. BestCheckout runs your funnel, subscriptions and post-purchase, then writes orders back to Shopify via API — no App Store review needed.': '我们不碰你 Shopify 店铺前台的原生结账。BestCheckout 负责漏斗、订阅与购后,再通过 API 把订单写回 Shopify——无需经过 App Store 审核。',
    'OAuth — read products, write orders back.': 'OAuth——读取商品,回写订单。', 'Add a payment MID': '接入支付 MID', 'Connect a gateway so routing can begin.': '连接一个网关,路由即可开始。',
    'Sync products from Shopify': '从 Shopify 同步商品', 'Mirror your catalog (read-only) for funnels.': '镜像你的商品(只读)供漏斗使用。',
    'Build your first funnel': '搭建首个漏斗', 'Checkout + one-click upsell in the editor.': '在编辑器里做结账 + 一键追加。', 'Go live': '上线', 'Send traffic to your BestCheckout funnel.': '把流量导向你的 BestCheckout 漏斗。',
    '68% of your orders now run through BestCheckout': '你已有 68% 的订单跑在 BestCheckout', 'Bring your whole store onto BestShopio — your data is already here.': '把整个店铺也搬到 BestShopio——你的数据本就在这里。', 'See 1-click migration': '看看一键迁移',
    'Migrate to BestShopio': '迁移到 BestShopio', 'Back to overview': '返回总览',
    'Your data: zero migration': '你的数据:零搬迁', 'Products, customers, orders and subscriptions already live in BestShopio — they have been syncing the whole time. Nothing to move.': '商品、客户、订单与订阅本就在 BestShopio 里——一路都在同步,无需搬迁。',
    'Your storefront: one-click stand-up': '你的店铺前台:一键起底', 'We spin up a BestShopio storefront with the same visual builder, pre-filled with your catalog. Adjust the theme, no rebuild from scratch.': '用同一套可视化搭建引擎为你起一个 BestShopio 店铺前台,商品预填好。调主题即可,无需从零重做。',
    'Your domain: guided switch': '你的域名:向导式切换', 'A wizard repoints your domain with automatic SSL, with redirects in place. This is the only real cut-over moment.': '向导帮你把域名重新指向并自动签发 SSL,并做好重定向。这是唯一真正的切换时刻。',
    'Because you came in through BestCheckout, this is an unlock — not the cold Shopify-to-BestShopio migration. That is the moat a standalone checkout tool can never offer.': '因为你是从 BestCheckout 进来的,这一步是"解锁"而非 Shopify→BestShopio 的冷迁移。这正是独立结账工具永远给不了的护城河。',
    'Unlock the full platform': '解锁全平台', 'Full platform unlocked': '已解锁全平台',
    'Options': '选项', 'Analytics': '分析', 'Publish': '发布', 'Published': '已发布', 'Live site': '线上站点', 'Opening live site': '正在打开线上站点', 'A/B test': 'A/B 测试',
    'Funnel visualizer': '漏斗可视化', 'Page': '页面', 'Page name': '页面名称', 'Page type': '页面类型', 'Edit page': '编辑页面', 'Delete': '删除',
    'Click a page to select it; its Edit button opens the page builder. Click an arrow to set its routing (button, dynamic upsells, country, new vs repeat customer). Click a page type on the left to add a page; use the + on a page, then click another page, to connect them.': '点击页面即可选中；它的「编辑」按钮会打开页面搭建器。点击箭头可设置该连线的路由（触发按钮、动态追加、国家、新客 / 复购客户）。点击左侧的页面类型可添加页面；点页面上的 +，再点另一个页面，即可把两者连接起来。',
    'Connection routing': '连线路由', 'Buttons / Links of': '按钮 / 链接：', 'Dynamic Upsells': '动态追加',
    'Products / tags that navigate with this arrow (blank = all).': '随此箭头跳转的商品 / 标签（留空 = 全部）。', 'blank = all products': '留空 = 全部商品',
    'Add product…': '添加商品…', 'Add': '添加', 'Enter product tags': '输入商品标签',
    'Match all selected products and tags': '匹配所有所选商品与标签', 'Include products previously purchased': '包含此前已购商品',
    'Countries': '国家', 'Ship countries that navigate with this arrow (blank = all).': '随此箭头跳转的配送国家（留空 = 全部）。', 'Choose Country (blank = all)': '选择国家（留空 = 全部）',
    'Customers': '客户', 'All Customers': '全部客户', 'New Customers Only': '仅新客户', 'Repeat Customers Only': '仅复购客户', 'Delete connection': '删除连线',
    'New': '新客', 'Repeat': '复购', 'Click a target page to connect': '点击目标页面以连接', 'Already connected': '已存在连线', 'Connection added': '已添加连线', 'Connection removed': '已删除连线', 'Page added': '已添加页面', 'Page removed': '已删除页面',
    'Presell page': '预售页', 'Lead page': '引导页', 'Checkout page': '结账页', 'Upsell page': '追加页', 'Downsell page': '降级页', 'Thank you page': '致谢页',
    'Configure your new checkout': '配置你的新结账', 'Set up your store connection, domain and accounts — your storefront stays on Shopify, orders sync back.': '配置店铺连接、域名与各项账户——店铺前台仍在 Shopify，订单自动回写。',
    'Choose checkout': '选择结账平台', 'Domain entry': '域名录入', 'Merchant account': '收单账户', 'PayPal account': 'PayPal 账户', 'Fulfillment': '履约',
    'Route your Shopify cart to BestCheckout for checkout': '将 Shopify 购物车路由到 BestCheckout 结账', 'Route your WooCommerce cart to BestCheckout': '将 WooCommerce 购物车路由到 BestCheckout', 'Route your BigCommerce cart to BestCheckout': '将 BigCommerce 购物车路由到 BestCheckout', 'Custom / API integration': '自定义 / API 接入',
    'Selected': '已选择', 'Choose': '选择', 'Store URL': '店铺 URL',
    'Shopify integration uses a private app in your store (OAuth + Admin API). Enter the API key and password below. No Shopify App Store listing or review is involved.': 'Shopify 接入使用你店铺里的私有应用（OAuth + Admin API）。在下方填入 API key 与密码。全程不涉及 Shopify App Store 上架或审核。',
    'Skip Product Sync': '跳过商品同步', 'Sync Products': '同步商品',
    'Funnel domain': '漏斗域名', 'Point a subdomain at BestCheckout; we issue and renew SSL automatically.': '把一个子域名指向 BestCheckout；我们自动签发并续期 SSL。',
    'Brand logo': '品牌 Logo', 'Drag a logo here, or click to upload (PNG / SVG)': '把 Logo 拖到这里，或点击上传（PNG / SVG）',
    'Gateway': '网关', 'Merchant ID (MID)': '收单号 (MID)', 'Add more MIDs later in Payment routing to enable multi-MID load balancing and cascade.': '稍后可在「支付路由」里添加更多 MID，启用多 MID 负载均衡与级联。',
    'PayPal email': 'PayPal 邮箱', 'Connect PayPal': '连接 PayPal', 'SMTP host': 'SMTP 主机', 'Port': '端口', 'Username': '用户名', 'Password': '密码',
    'Fulfillment provider': '履约服务商', 'Orders captured by BestCheckout route to fulfillment and write back to Shopify.': 'BestCheckout 捕获的订单进入履约，并回写到 Shopify。',
    'Back': '上一步', 'Continue': '下一步', 'Finish setup': '完成设置', 'Setup complete': '设置完成',
    // ---- Connection hub ----
    'Connection': '连接', 'The Shopify bridge': 'Shopify 接入桥', 'Two-way': '双向',
    'Checkout design': '结账页装修', 'Thank-you design': '致谢页装修', 'Open the theme builder': '打开装修器',
    // Checkout template gallery
    'Use this template': '使用此模板', 'Most popular': '最受欢迎',
    'Pick a proven, high-converting checkout — apply it in one click, then fine-tune everything in the shared theme builder.': '挑一套验证过的高转化结账,一键套用,再到共享 theme 装修器里逐项细调。',
    'More building blocks are on the way: specialist / doctor endorsement, photo-review wall, and a Trustpilot rating bar.': '更多区块陆续上线:专家/医生背书、照片墙评价、Trustpilot 评分条。',
    'Pack-size value ladder — buy more, save more': '套餐价梯——买得越多省得越多',
    'Advertorial funnel — express pay + value props': '广告漏斗——Express 支付 + 价值主张',
    'Clean single-column checkout': '极简单列结账',
    // Page subtitle ("xxx · External checkout on lovocross.myshopify.com · orders write back to Shopify")
    // Translated as separate text-node fragments (the inline <b>domain</b> splits the line).
    'External checkout on': '外置结账在',
    'orders write back to Shopify': '订单回写 Shopify',
    '· orders write back to Shopify': '· 订单回写 Shopify', // kept for legacy callers that still go through bcI18n
    'Countdown': '倒计时', 'Pack tiers': '套餐档位', 'Add-on': '加购', 'Guarantee': '退款保证',
    'Reserve timer': '预留倒计时', 'Value props': '价值主张', 'Trust row': '信任条',
    // Funnel + Templates (新 IA)
    'Funnel': '漏斗', 'Templates': '模板库', 'Customize': '装修', 'Edit': '装修', 'System': '系统', 'Saved': '已保存', 'Template': '模板', 'auto-pick winner': '自动判赢', 'leading': '领先', 'Delete': '删除', 'Template deleted': '模板已删除', 'Saved from the builder': '从装修器保存',
    'Collecting data — no winner yet': '数据收集中——暂无获胜方', 'Edit A': '装修 A', 'Edit B': '装修 B', 'Remove A/B': '移除 A/B',
    'Fit': '适应', 'Reset layout': '重置布局', 'Reset funnel': '重置漏斗', 'Tidy layout': '整理布局', 'Layout tidied': '已整理布局', 'YES': '接受', 'NO': '拒绝',
    'Add page': '加页面', 'Remove page': '移除页面', 'Page added': '已加页面', 'Page removed': '已移除页面', 'Click a node to branch from it · drag the title bar to move': '点选节点,新页面从它分支 · 拖标题栏可移动',
    'Add a page': '添加页面', 'Change template': '更换模板', 'Page type': '页面类型', 'Branches from': '分支自', 'Branch from': '从哪个节点接入', 'Apply': '应用', 'Change': '更换', 'Template changed': '模板已更换',
    '(Free — connect later with the drag handle)': '(不自动连接 — 稍后用蓝点手动拖)',
    'Connected': '已连接', 'Connection removed': '已移除连接', 'Click to remove this connection': '点击设置或删除这条连线', 'Page added — connect it with the ⌁ handle': '已加页面——拖动右侧蓝点连到目标节点',
    'Drag to another node to connect': '拖动到另一个节点以建立连接',
    'Mark as “Accepted” (YES)': '设为「接受」(YES)', 'Mark as “Declined” (NO)': '设为「拒绝」(NO)', 'Make it a traffic split': '设为流量分流', 'Remove connection': '删除连线',
    'Routing rule': '路由规则', 'Routing rules': '路由规则', 'Set as': '设为', 'Accepted': '接受', 'Declined': '拒绝', 'Added': '加入', 'Accept button': '接受按钮', 'Decline button': '拒绝按钮',
    /* Rule builder (Azoya-style) */
    'Configure routing rule…': '配置路由规则…',
    'Fallback (catch-all)': '兜底(其他都不匹配)', 'Fallback': '兜底',
    'This branch catches anything not matched by the siblings above.': '这条支线接收上面所有兄弟支线都没匹配到的流量。',
    'No extra conditions — this branch is purely the catch-all.': '没有额外条件——纯粹作为兜底接收所有未匹配流量。',
    'Traffic that no sibling branch matches goes here. The conditions below are still respected as a preference, but this branch always catches the unmatched.': '所有兄弟支线都未匹配到的流量走这里。下面的条件仍作为「偏好」生效——但这条支线总是兜住没匹配到的流量。',
    'Pick one branch as the fallback.': '请选一条支线作为兜底。',
    'Who is eligible (AND):': '谁有资格走这条(全部满足):',
    'Traffic share among the eligible:': '在符合条件的用户里,流量配比:',
    'No user filters — anyone is eligible for this branch.': '无用户筛选——所有用户都符合资格。',
    'Add user filter': '添加用户筛选',
    'Set traffic weight': '设置流量配比',
    'Takes': '占',
    '% of the matched traffic': '% 的匹配流量',
    'Remove weight': '删除配比',
    'Add condition': '添加条件', 'Remove condition': '删除条件',
    'Select…': '请选择…', 'Add tag': '添加标签', 'min': '最小值', 'max': '最大值',
    'Only one branch can be the fallback.': '只能有一条支线作为兜底。',
    'Traffic %s on this fork must total 100': '本分叉的流量百分比之和必须等于 100', 'now': '当前',
    'Traffic %s for this segment must total 100': '同一分群的流量百分比之和必须等于 100',
    'Two branches share the same conditions — add or change one to differentiate.': '两条支线条件完全相同——给其中一条改/加条件以区分。',
    'Two branches share the same user filters with no traffic weight — add a filter or weight to differentiate.': '两条支线用户筛选完全相同且都没设流量配比——加筛选或加配比以区分。',
    'Some conditions are missing values.': '部分条件缺少取值。',
    'Routing rules updated': '路由规则已更新',
    'Click to edit the routing rules': '点击编辑路由规则',
    /* Field group labels */
    'Basic attributes': '基本属性', 'Behavior': '用户行为', 'Value': '用户价值',
    'Customer tags': '用户标签', 'Upstream actions': '上游动作', 'Traffic split': '流量分流',
    /* Field labels */
    'New vs returning': '新老客户', 'Customer tag': '客户标签',
    'Country': '常驻国家', 'Past orders': '历史订单数', 'Cart total': '当前购物车额',
    'Device': '设备', 'Upsell decision': 'Upsell 决定', 'Downsell decision': 'Downsell 决定',
    'Only applicable to edges leaving an Upsell node': '只适用于 Upsell 节点的出边',
    'Only applicable to edges leaving a Downsell node': '只适用于 Downsell 节点的出边',
    'Traffic %': '流量百分比',
    /* Operators */
    'is': '等于', 'is not': '不等于', 'is any of': '包含任一', 'is all of': '包含全部',
    'is none of': '都不包含', 'between': '区间', 'before': '早于', 'after': '晚于',
    'is true': '是', 'is false': '否',
    /* Enum values */
    'United States': '美国', 'Canada': '加拿大', 'United Kingdom': '英国', 'Australia': '澳大利亚',
    'China': '中国', 'Japan': '日本',
    'Mobile': '移动端', 'Desktop': '电脑',
    'Accepted (YES)': '已接受 (YES)', 'Declined (NO)': '已拒绝 (NO)', 'Added (YES)': '已加入 (YES)',
    'Traffic split (%)': '流量分流 (%)', 'Customer segment': '客户分群', 'New / Returning': '新客 / 老客',
    'Click to configure this connection': '点击配置此连线', 'Click to edit this rule': '点击编辑规则',
    'Match traffic by': '按此匹配流量', 'Customer type': '客户类型', '(unmapped)': '(未指定)', 'Segment routing updated': '分群路由已更新',
    'New customer': '新客', 'Returning customer': '老客',
    'Connection': '连线', 'Single path — add another branch from this node to use a routing rule.': '单路径——从此节点再连一条边才能使用路由规则。',
    'Everyone else (catch-all)': '其他人(兜底)', 'Others': '其他',
    'Two branches can’t both route to': '两条支线不能同时路由到', 'Only one branch can be the catch-all.': '只能有一条支线作为兜底。',
    'Add another branch from this node first — a split needs at least two paths.': '请先从此节点再连出一条边——分流至少需要两条路径。',
    'This page has only one template — open 装修, then “Save as template” to make variant B, and A/B-test it.': '这个页面只有一个模板——先进「装修」,用「另存为模板」存出变体 B,再来做 A/B。',
    'Shopify checkout': 'Shopify 原生结账', 'Control group — the rest of the cart stays on Shopify’s native checkout.': '对照组——其余购物车流量留在 Shopify 原生结账。', 'Split rules': '分流规则', 'Remove control group': '移除对照组',
    'Click to edit the traffic split': '点击编辑分流比例', 'Traffic split updated': '分流比例已更新', 'Total': '合计', 'must total 100%': '需合计 100%',
    'New A/B test': '新建 A/B 测试', 'Variant A (current)': '变体 A(当前)', 'Start A/B test': '开始 A/B 测试', 'A/B test started — collecting data': 'A/B 测试已开始 · 数据收集中', 'A/B test removed': 'A/B 测试已移除', 'Save another template for this page first, then A/B test it': '先给这个页面另存一个模板,再做 A/B',
    'Split by': '分流方式', 'Traffic %': '按流量', 'User type': '按用户类型', 'by user type': '按用户类型', 'New': '新用户', 'Returning': '老用户', 'no paid order yet': '尚无支付订单', '1+ paid order': '有支付订单', 'Read from the connected Shopify customer record.': '取自已连接的 Shopify 客户记录。',
    'Checkout': '结账', 'Thank-you': '致谢', 'Upsell': '追加', 'Downsell': '降级', 'Shopify store': 'Shopify 店铺', 'Manage connection': '管理连接', 'Traffic source — buyers enter the funnel here': '流量来源——买家从这里进入漏斗',
    'Cart source · order summary': '购物车来源 · 订单摘要', 'Confirmation · tracking · reviews': '订单确认 · 物流追踪 · 评价', 'Post-purchase one-click add': '购后一键加购', 'Lower-price save': '更低价挽回',
    'Cart checkout — clean & trusted': '购物车结账 · 干净可信赖', 'Cart + full funnel extras': '购物车 + 全套漏斗增强', 'Offer picker for paid-media traffic': 'Offer 选择器 · 买量流量', 'Confirmation + tracking + reviews': '订单确认 + 物流 + 评价', 'Post-purchase add in one click': '购后一键加购', 'Lower-price save offer': '更低价挽回 offer',
    'YES → Thank-you · NO → Downsell': 'YES → 致谢 · NO → 降级', '→ Thank-you': '→ 致谢',
    'Every page type has a template library — our system starters plus the versions you save. Open one to customize, then save it back as a new template. The Funnel and A/B tests both pull from here.': '每个页面类型都有自己的模板库——我们给的系统起步款 + 你自己保存的版本。点开装修,再另存为新模板。漏斗和 A/B 都从这里取模板。',
    'Your funnel as a canvas. Cart traffic splits at your Shopify store — part runs through the BestCheckout funnel, the rest stays on Shopify’s native checkout as the control. Branch any node with Add page or the ⌁ handle; drag to rearrange.': '把漏斗画成画布:购物车流量在 Shopify 店铺这里分流——一部分走 BestCheckout 漏斗,其余留在 Shopify 原生结账作对照。用「加页面」或 ⌁ 手柄从任意节点分支;拖动可排列。',
    'Add a 2nd template as variant B from the library': '去模板库选第二个模板作为变体 B',
    'Standard': '标准版', 'Recommended': '推荐', 'The BestVoy production checkout — clean & trusted': 'BestVoy 生产环境结账——干净、可信赖',
    'Express pay': 'Express 支付', 'Full address': '完整地址', '2 shipping rates': '两档运费', 'Card': '银行卡', 'Form': '表单', 'Rating': '评分',
    'Advertorial funnel — timer, insurance bump, specialist card': '广告漏斗——倒计时、运费险加购、专家背书', 'Insurance bump': '运费险加购', 'Specialist': '专家背书',
    'Conversion': '转化版', 'Single-page funnel': '单页漏斗', 'Coming soon': '即将推出', 'Offer picker': '档位选择器', 'No cart summary': '无购物车摘要',
    'BestVoy production checkout — cart source, clean & trusted': 'BestVoy 生产结账——购物车来源,干净可信赖',
    'Cart checkout + full funnel: timer, insurance bump, specialist, reviews': '购物车结账 + 全套漏斗:倒计时、运费险、专家背书、评价',
    'Offer / Bundle picker for paid-media (AppLovin) landing-page traffic': 'Offer/Bundle 选择器,服务买量(AppLovin)落地页流量',
    'Checkout source = Cart (1.0): cart line items show in the order summary. Pick a proven layout, apply in one click, then fine-tune in the shared theme builder.': '结账数据来源 = 购物车(1.0):购物车行项进订单摘要。挑一套验证过的版式,一键套用,再到共享装修器细调。',
    'Single-page funnel (Offer source) is the paid-media landing-page line — P1. Post-purchase one-click upsell is already built into the Thank-you page.': '单页漏斗(Offer 来源)= 买量落地页那条线,P1。购后一键加购已并入致谢页。',
    // A/B tests
    'A/B tests': 'A/B 测试',
    'Split traffic across checkout variants, see what converts, and roll out the winner. Your Checkout templates double as variants.': '把流量拆给不同结账变体,看哪个转化更高,再全量上线获胜方。你的结账模板可直接当变体。',
    'New experiment': '新建实验', 'Goal': '目标', 'days': '天', 'sessions': '次访问', 'not started': '未开始',
    'Uplift': '提升', 'Confidence': '置信度', 'Draft': '草稿', 'Running': '进行中', 'Completed': '已结束',
    'Sessions': '访问量', 'Average order value': '客单价', 'Upsell accept rate': 'Upsell 接受率', 'Checkout conversion rate': '结账转化率', 'Revenue / visitor': '访客均收入',
    'Winner': '获胜', 'Leading variant': '领先变体', 'No clear leader yet': '暂无明显领先', 'Variant': '变体', 'uplift': '提升', 'Statistical confidence': '统计置信度',
    'End test & roll out winner': '结束并全量上线获胜方', 'Adjust traffic split': '调整流量分配', 'Winner rolled out to 100%': '获胜方已全量上线', 'Launch experiment': '启动实验', 'All experiments': '全部实验', 'Started': '开始于',
    'This experiment is a draft — launch it to start splitting traffic and collecting data.': '这是草稿实验——启动后才会开始分流并收集数据。',
    'Winner rolled out': '获胜方已上线', 'Experiment launched': '实验已启动', 'Traffic split — coming soon': '流量分配——即将上线',
    'New A/B experiment': '新建 A/B 实验', 'Experiment name': '实验名称', 'e.g. Checkout template test': '例如:结账模板对比', 'Test page': '测试页面', 'Variant A': '变体 A', 'Variant B': '变体 B', 'Traffic split': '流量分配', 'Primary goal': '主指标', 'Cancel': '取消', 'Current checkout design': '当前结账设计', 'Untitled experiment': '未命名实验',
    'Checkout template — Pack & Save vs Express Funnel': '结账模板 — Pack & Save vs Express Funnel', 'Guarantee — 90-day vs 120-day': '退款保证 — 90 天 vs 120 天', 'Urgency bar — on vs off': '倒计时条 — 开 vs 关',
    '90-day guarantee': '90 天保证', '120-day guarantee': '120 天保证', 'With countdown': '有倒计时', 'No countdown': '无倒计时',
    'Edit on the shared store theme builder — the same system as your storefront theme. Checkout & Thank-you are pages in it.': '在共享的店铺 theme 装修器里编辑——和店铺前台主题同一套体系。结账页与致谢页都是其中的页面。',
    'Everything on this page connects you to Shopify. A full BestShopio store never sees it — and it all goes away when you migrate.': '本页的一切都用于对接 Shopify。完整的 BestShopio 店铺看不到它——迁移之后整块拆除。',
    'Mode': '模式', 'connected since': '连接于', 'last sync': '上次同步', 'last received': '上次接收',
    'Authorization': '店铺授权', 'Data sync': '数据同步', 'Checkout injection': '结账注入', 'Checkout domain': '结账域名',
    'Installed via a private app (OAuth + Admin API) — no Shopify App Store listing or review. These are the permissions you granted at install:': '通过私有应用安装（OAuth + Admin API）——不上 Shopify App Store、不走审核。你在安装时授予了以下权限：',
    'Two-way sync of products, variants & collections': '双向同步商品、变体与集合', 'Write paid orders back to Shopify to trigger fulfillment': '把已付款订单写回 Shopify 以触发履约',
    'Read inventory — Shopify stays source of truth': '读取库存——库存以 Shopify 为准', 'Two-way sync of discounts': '双向同步促销',
    'Read shipping zones & rates': '读取运费区与费率', 'Two-way sync of customers': '双向同步客户',
    'Re-authorize': '重新授权',
    'Re-opens the Shopify OAuth consent screen to refresh the access token and scopes. Your store stays connected — nothing is removed.': '重新打开 Shopify OAuth 授权页,刷新访问令牌与权限范围。店铺保持连接——不会移除任何东西。',
    'Two-way sync · products, collections, discounts, shipping': '双向同步 · 商品、专辑、折扣、运费', 'Write paid orders back to Shopify': '已付款订单写回 Shopify', 'Read customers (for the New vs Returning A/B)': '读取客户(用于 新客/老客 A/B)',
    'Re-authorize on Shopify': '在 Shopify 上重新授权', 'Token refreshed · scopes re-granted': '令牌已刷新 · 权限已重新授予',
    'Deep-links to Online Store → Themes → Customize → App embeds. Turn the BestCheckout embed on — it intercepts the cart “Checkout” button without editing theme code.': '深链到 网上商店 → 模板 → 自定义 → App 嵌入。打开 BestCheckout 嵌入即可拦截购物车「结账」按钮,无需改主题代码。',
    'Enabled': '已启用', 'Open Shopify': '打开 Shopify', 'Opening Shopify theme editor…': '正在打开 Shopify 主题编辑器……',
    'two-way · BestShopio is your workspace': '双向 · 把 BestShopio 当作日常操作台',
    'Edit products, collections, discounts and shipping right here in BestShopio — changes sync back to Shopify automatically. Your team moves into BestShopio now, so migrating later is just a domain switch.': '商品、集合、促销、运费都直接在 BestShopio 里改——改动会自动同步回 Shopify。让团队现在就搬进 BestShopio，日后迁移只剩切个域名。',
    'Source of truth': '数据真源', 'Items': '条目', 'Last sync': '上次同步',
    'Fulfillment apps decrement stock on Shopify, so Shopify stays the source of truth.': '已装的发货 App 在 Shopify 侧扣减库存，故库存以 Shopify 为准。',
    'Paid BestCheckout orders write back to Shopify and trigger the installed fulfillment app.': 'BestCheckout 的已付款订单写回 Shopify，触发商家已装的发货 App。',
    'A one-line App Embed block in your live theme adds a "Checkout" interceptor — no theme code edits, survives theme updates.': '在当前主题里启用一个 App Embed 区块即可拦截「结账」——不改主题代码，主题更新也不会被覆盖。',
    'Live theme': '当前主题', 'last seen': '上次检测', 'Intercepts': '拦截位置', 'Enabled': '已启用',
    'Open in Shopify theme editor': '在 Shopify 主题编辑器中打开', 'split': '分流',
    'Send a slice of carts to BestCheckout; keep the rest on Shopify as a control. Ramp up as approval & AOV prove out.': '先把一部分购物车导向 BestCheckout，其余留在 Shopify 作为对照。过单率与客单价跑赢后再逐步放量。',
    'Edit routing rules': '编辑分流规则', 'replaced by main-domain switch at migration': '迁移时由主域名切换取代',
    'Your branded checkout lives on this subdomain. Point one CNAME at us and we issue & renew SSL automatically.': '你的品牌化结账跑在这个子域名上。把一条 CNAME 指向我们，SSL 自动签发与续期。',
    'Type': '类型', 'Host': '主机记录', 'Value': '记录值', 'Copy': '复制',
    'At migration, this subdomain is retired — your main domain points straight at the BestShopio storefront instead. See Migrate.': '迁移时这个子域名退役——主域名直接指向 BestShopio 店面。详见「迁移」。',
    'Queued a full re-sync': '已排入一次全量重新同步', 'Demo: disconnect confirmation': '演示：断开连接确认',
    'Demo: re-opens the Shopify OAuth consent screen': '演示：重新打开 Shopify OAuth 授权页',
    'Demo: deep-links to Online Store → Themes → Customize → App embeds': '演示：深链到 Online Store → Themes → Customize → App embeds',
    'Demo: opens the A/B routing-rule builder': '演示：打开 A/B 分流规则编辑器', 'Copied': '已复制',
    // ---- Overview onboarding / migrate ----
    'Connect your store, sell through your new checkout, and move into BestShopio at your own pace.': '连接店铺、用新结账卖货，再按你自己的节奏搬进 BestShopio。',
    'Your activation path': '你的上手路径', 'Done': '完成', 'Start': '开始',
    'Synced from Shopify': '已从 Shopify 同步', 'products': '个商品', 'discounts': '条促销', 'shipping rates': '条运费',
    'Connect Shopify & sync your store': '连接 Shopify 并同步店铺', 'OAuth in one click; we pull products, discounts and shipping.': '一键 OAuth；我们拉取商品、促销与运费。',
    'Connect your payment accounts': '连接你的收款账户', 'Reuse your Airwallex / Stripe / PayPal.': '复用你的 Airwallex / Stripe / PayPal。',
    'Set your checkout domain': '设置结账域名', 'Point checkout.yourbrand.com at BestCheckout — auto-SSL.': '把 checkout.yourbrand.com 指向 BestCheckout——自动 SSL。',
    'Turn on checkout injection': '开启结账注入', 'Enable the App Embed and start with a small A/B split.': '启用 App Embed，先用小比例 A/B 起步。',
    'Build your first funnel': '搭建首个漏斗', 'Design checkout + one-click upsell in the editor.': '在编辑器里做结账 + 一键追加。',
    'Go live': '上线', 'Ramp up traffic; orders write back to Shopify.': '逐步放量；订单自动写回 Shopify。',
    'Ready to make BestShopio your store?': '准备好把 BestShopio 变成你的正式店铺了吗？',
    'Pre-flight: your data is already in BestShopio': '迁移前检查：你的数据已在 BestShopio',
    'Switch the main domain': '切换主域名', 'Stand up the storefront': '一键起店面',
    'This is the one real cut-over — repoint your main domain from Shopify to BestShopio.': '这是唯一真正的切换——把主域名从 Shopify 重新指向 BestShopio。',
    'Your data is already here': '数据本就在这里',
    'Products, discounts, shipping, orders and customers have been syncing the whole time. Nothing to move.': '商品、促销、运费、订单与客户一路都在同步，无需搬迁。',
    'Stand up your storefront': '起一个店面',
    'Spin up a BestShopio storefront with the same visual builder, pre-filled with your catalog. Adjust the theme — no rebuild.': '用同一套可视化搭建器起一个 BestShopio 店面，商品预填好。调主题即可——无需重做。',
    'Switch your main domain': '切换主域名',
    'Repoint your main domain (now on Shopify) to BestShopio, with automatic SSL. This is the one real cut-over.': '把主域名（现在 Shopify 上）重新指向 BestShopio，自动 SSL。这是唯一真正的切换。',
    'Demo: spins up a BestShopio storefront from your synced catalog': '演示：用你已同步的目录起一个 BestShopio 店面',
    // ---- Shopify OAuth consent (the "this is Shopify's page" step) ----
    'Continue to Shopify': '前往 Shopify 授权',
    'Install BestCheckout?': '安装 BestCheckout？', 'by Bestfulfill': '由 Bestfulfill 提供',
    'BestCheckout will be able to:': 'BestCheckout 将可以：',
    'Products & collections': '商品与商品系列', 'View and edit products, collections and inventory': '查看与编辑商品、商品系列与库存',
    'Orders': '订单', 'View and create orders — write paid orders back for fulfillment': '查看与创建订单——把已付款订单回写以触发发货',
    'Discounts': '折扣', 'View and edit discounts and price rules': '查看与编辑折扣与价格规则',
    'Shipping': '配送', 'View shipping zones and rates': '查看配送区域与运费',
    'Customers': '客户', 'View and edit customers': '查看与编辑客户',
    'This is a custom (private) app installed via a one-time link — it is not listed on the Shopify App Store. By clicking Install, you grant the access above; you can uninstall anytime from Settings → Apps.': '这是通过一次性链接安装的自定义（私有）应用——未在 Shopify App Store 上架。点击「安装」即授予以上权限；你可随时在 设置 → 应用 中卸载。',
    'Install app': '安装应用',
    // ---- init flow: store / importing / connected steps ----
    'BestCheckout installs as a private app via OAuth — no App Store listing, no review. We import your products, discounts and shipping, and write orders back to Shopify.': 'BestCheckout 通过 OAuth 以私有应用方式安装——不上架、不审核。我们会导入你的商品、折扣与运费，并把订单回写到 Shopify。',
    'Your Shopify store URL': '你的 Shopify 店铺网址', 'soon': '即将上线',
    'Connecting to': '正在连接', 'Syncing your catalog and registering webhooks — this usually takes a few seconds.': '正在同步你的目录并注册 webhooks——通常只需几秒。',
    'Access granted (OAuth)': '已授权（OAuth）', 'Importing products': '导入商品', 'Importing collections': '导入商品系列', 'Importing discounts': '导入折扣', 'Importing shipping rates': '导入运费', 'Registering webhooks': '注册 webhooks', 'Building the catalog mapping': '建立目录映射',
    'You’re connected!': '连接成功！',
    'Your Shopify catalog is now in BestShopio — edit it right here and changes sync back to Shopify. Orders you capture write back automatically.': '你的 Shopify 目录现已在 BestShopio——直接在这里编辑，改动会同步回 Shopify；你捕获的订单也会自动回写。',
    'collections': '个商品系列',
    'Next: connect payments · set your checkout domain · turn on checkout injection · build your first funnel.': '接下来：接入收款 · 设置结账域名 · 开启结账注入 · 搭建首个漏斗。',
    'Enter BestCheckout': '进入 BestCheckout',
    // ---- Overview (MVP, checkout/upsell focus) ----
    'Checkout conversion': '结账转化率', 'Upsell take rate': 'Upsell 接受率', 'Orders · 30d': '订单 · 30 天',
    'fast single-page checkout': '极速单页结账', 'post-purchase upsell + order bumps': '购后追加 + 凑单', 'one-click, no re-enter card': '一键，无需重输卡', 'captured, written back to Shopify': '已捕获并回写 Shopify', 'through BestCheckout': '经 BestCheckout', '3DS on high-risk orders': '高风险订单走 3DS',
    'Checkout performance': '结账表现', 'Checkout conversion & orders captured — last 30 days.': '结账转化率与订单量 — 近 30 天。',
    // AI recommendations (whole-phrase keys so the fragment "Add" isn't half-translated)
    'Add a free-shipping order bump on the checkout page': '在结账页加一个「免邮」凑单',
    'Add a downsell after the “Sleep Bundle” upsell': '在「Sleep Bundle」追加之后加一个降级 offer',
    'Default repeat customers to Subscribe & Save 15%': '老客默认勾选「订阅省 15%」',
    'Collapse the checkout to a single step': '把结账并成单步',
    'Est. AOV +$3.10 / order': '预计客单价 +$3.10 / 单', 'Est. +9.8% recovered on upsell declines': '预计在拒绝追加时多挽回 9.8%', 'Est. subscription rate +6 pts': '预计订阅渗透 +6 个百分点', 'Est. conversion +2.4 pts': '预计转化 +2.4 个百分点',
    // Activity feed
    'Subscription': '订阅', 'paid': '已付款', 'recurring': '周期续费',
    'accepted — Calm Tea added at 15% off': '已接受——以 85 折加购 Calm Tea',
    'free-shipping protection added at checkout': '结账时加购了免邮保障',
    'Magnesium 30ct accepted after the upsell decline': '拒绝追加后接受了 Magnesium 30 粒装',
    'order completed, written back to Shopify (#1042)': '订单完成，已回写 Shopify（#1042）',
    'new Daily Greens monthly started from the checkout': '从结账页发起了 Daily Greens 月度订阅',
  };
  const t = (s) => (window.I18N && window.I18N.lang === 'zh' && ZH[s]) ? ZH[s] : s;
  function bcI18n(scope) {
    if (!window.I18N || window.I18N.lang !== 'zh') return;
    try {
      const w = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
      const nodes = []; let n; while ((n = w.nextNode())) nodes.push(n);
      nodes.forEach((node) => { const tr = node.nodeValue.trim(); if (tr && ZH[tr]) node.nodeValue = node.nodeValue.replace(tr, ZH[tr]); });
    } catch (e) {}
  }
  const ED = { sel: null };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    up: svg('<path d="M7 17 17 7M9 7h8v8"/>', 14),
    bolt: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7l1-6z"/>', 16),
    route: svg('<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H15a3 3 0 0 1 3 3v6"/>', 16),
    repeat: svg('<path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>', 16),
    cart: svg('<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2 3h3l2.4 12.4a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L22 7H6"/>', 16),
    link: svg('<path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 0 1 0 10h-2"/><path d="M8 12h8"/>', 16),
    ai: svg('<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><rect x="7" y="7" width="10" height="10" rx="2"/>', 15),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 15),
    dot: svg('<circle cx="12" cy="12" r="3"/>', 8),
    check: svg('<path d="M20 6 9 17l-5-5"/>', 14),
  };
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1800); };

  const STYLE = '<style>' +
    '.bc-head{margin-bottom:8px}.bc-h1{font-size:22px;font-weight:700;color:var(--ink)}.bc-sub{font-size:13px;color:var(--ink-muted);margin-top:3px}' +
    '.bc-subnav{display:flex;gap:2px;border-bottom:1px solid var(--hair);margin:14px 0 20px;flex-wrap:wrap}' +
    '.bc-tab{padding:9px 14px;font-size:13.5px;color:var(--ink-muted);border-bottom:2px solid transparent;text-decoration:none;white-space:nowrap}' +
    '.bc-tab:hover{color:var(--ink)}.bc-tab.active{color:var(--ink);font-weight:600;border-bottom-color:var(--brand)}' +
    '.bc-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:14px;margin-bottom:18px}' +
    '.bc-kpi{padding:15px 17px}.bc-kpi-l{font-size:12.5px;color:var(--ink-muted)}.bc-kpi-v{font-size:25px;font-weight:700;color:var(--ink);margin:5px 0 3px;letter-spacing:-.5px}' +
    '.bc-kpi-row{display:flex;align-items:center;gap:8px}.bc-kpi-s{font-size:11.5px;color:var(--ink-muted);margin-top:3px}' +
    '.bc-delta{font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:2px}.bc-delta.up{color:#1f8f4e}.bc-delta.down{color:#c0392b}' +
    '.bc-grid2{display:grid;grid-template-columns:1.55fr 1fr;gap:18px}.bc-grid2b{display:grid;grid-template-columns:1fr 1fr;gap:18px}' +
    '.bc-chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:3px 9px;border-radius:999px;white-space:nowrap}.bc-chip .d{width:6px;height:6px;border-radius:50%}' +
    '.bc-chip.green{background:#e7f7ee;color:#1f8f4e}.bc-chip.green .d{background:#1f8f4e}' +
    '.bc-chip.blue{background:#e8f0fe;color:#2b62d6}.bc-chip.blue .d{background:#2b62d6}' +
    '.bc-chip.amber{background:#fef3e0;color:#b9770e}.bc-chip.amber .d{background:#e0900e}' +
    '.bc-chip.gray{background:#eef0f2;color:#5b6470}.bc-chip.gray .d{background:#9aa3ad}' +
    '.bc-chip.red{background:#fdecec;color:#c0392b}.bc-chip.red .d{background:#c0392b}' +
    '.bc-chip.violet{background:#f0ebfb;color:#7b4bd0}.bc-chip.violet .d{background:#7b4bd0}' +
    '.bc-rec{display:flex;gap:11px;align-items:flex-start;padding:12px 13px;border-radius:10px;margin-bottom:9px;border:1px solid var(--hair)}' +
    '.bc-rec .ic{width:30px;height:30px;border-radius:8px;flex:none;display:inline-flex;align-items:center;justify-content:center}' +
    '.bc-rec.blue .ic{background:#e8f0fe;color:#2b62d6}.bc-rec.amber .ic{background:#fef3e0;color:#b9770e}.bc-rec.green .ic{background:#e7f7ee;color:#1f8f4e}.bc-rec.violet .ic{background:#f0ebfb;color:#7b4bd0}' +
    '.bc-rec .t{font-size:13.5px;font-weight:600;color:var(--ink);line-height:1.4}.bc-rec .m{font-size:12px;color:var(--ink-muted);margin-top:2px}' +
    '.bc-act{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--hair)}.bc-act:first-child{border-top:0}' +
    '.bc-act .av{width:30px;height:30px;border-radius:50%;flex:none;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}' +
    '.bc-act .at{flex:1;min-width:0;font-size:13px;color:var(--ink)}.bc-act .aw{font-size:11.5px;color:var(--ink-muted)}' +
    /* Activation checklist (onboarding card on Overview) */
    '.bc-onb{background:#fff;border:1.5px solid #d8c8f0;border-radius:14px;padding:18px 20px;margin-bottom:18px;background:linear-gradient(180deg,#faf7ff 0%,#fff 50px)}' +
    '.bc-onb-collapsed{padding:11px 18px;cursor:pointer;display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--ink)}' +
    '.bc-onb-collapsed:hover{background:linear-gradient(180deg,#f5efff 0%,#fafafe 100%)}' +
    '.bc-onb-rocket{font-size:17px}' +
    '.bc-onb-head{display:flex;align-items:center;gap:12px;margin-bottom:5px}' +
    '.bc-onb-h-l{font-size:15.5px;color:var(--ink)}.bc-onb-h-l b{font-weight:700}' +
    '.bc-onb-meta{font-size:12.5px;color:var(--ink-muted);margin-left:auto}' +
    '.bc-onb-tog{height:28px;padding:0 9px;min-width:28px;font-size:13px}' +
    '.bc-onb-sub{font-size:12.5px;color:var(--ink-muted);margin-bottom:11px}' +
    '.bc-onb-bar{height:6px;background:#eef0f3;border-radius:4px;margin-bottom:14px;overflow:hidden}' +
    '.bc-onb-bar span{display:block;height:100%;background:#7b4bd0;border-radius:4px;transition:width .3s}' +
    '.bc-onb-steps{display:flex;flex-direction:column;gap:3px}' +
    '.bc-onb-step{padding:9px 11px;border-radius:9px;border:1px solid transparent}' +
    '.bc-onb-step.current{background:#f6f0ff;border-color:#d8c8f0}' +
    '.bc-onb-step.done{opacity:.58}.bc-onb-step.done b{font-weight:600;color:var(--ink-muted);text-decoration:line-through;text-decoration-color:#cfd5dd}' +
    '.bc-onb-step-h{display:flex;align-items:flex-start;gap:10px}' +
    '.bc-onb-icon{flex:none;width:18px;height:18px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:800;line-height:1;margin-top:1px}' +
    '.bc-onb-step.done .bc-onb-icon{background:#1f8f4e;color:#fff}' +
    '.bc-onb-step.current .bc-onb-icon{background:#7b4bd0;color:#fff}' +
    '.bc-onb-step.pending .bc-onb-icon{background:#fff;color:#c2c8d0;border:1.5px solid #d8dce2}' +
    '.bc-onb-text{flex:1;min-width:0;font-size:13.5px;color:var(--ink)}.bc-onb-text b{font-weight:700}' +
    '.bc-onb-hint{font-size:12px;color:var(--ink-muted);margin-top:3px;line-height:1.5}' +
    '.bc-onb-opt{font-size:11px;color:var(--ink-muted);font-weight:500;margin-left:4px}' +
    '.bc-onb-actions{display:flex;gap:8px;flex:none;align-items:flex-start}' +
    '.bc-onb-actions .btn{padding:5px 12px;font-size:12.5px;height:28px}' +
    '.bc-onb-current-actions{margin-top:10px;padding-left:28px}' +
    '.bc-onb-current-actions .btn{padding:7px 14px;font-size:13px}' +
    '.bc-onb-branch{margin-top:8px;padding:12px 14px;background:#fff;border:1px solid var(--hair);border-radius:10px}' +
    '.bc-onb-q{font-size:13px;font-weight:600;margin-bottom:9px;color:var(--ink)}' +
    '.bc-onb-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}' +
    '.bc-onb-chip{font-size:12.5px;padding:6px 13px;border:1px solid var(--hair);border-radius:999px;background:#fff;cursor:pointer;color:var(--ink-body);font-weight:500}' +
    '.bc-onb-chip:hover{border-color:#aeb6c0}.bc-onb-chip.on{background:#7b4bd0;color:#fff;border-color:#7b4bd0}' +
    '.bc-onb-rec{font-size:12.5px;color:var(--ink-body);line-height:1.7;background:#faf7ff;border-radius:7px;padding:9px 11px}.bc-onb-rec.muted{color:var(--ink-muted);font-style:italic;background:#f6f7f9}' +
    '.bc-flow{display:flex;align-items:stretch;gap:0;flex-wrap:wrap}.bc-step{flex:1;min-width:150px;border:1px solid var(--hair);border-radius:10px;padding:12px 13px;position:relative}' +
    '.bc-step .n{font-size:12px;font-weight:700;color:var(--brand)}.bc-step .o{font-size:12.5px;color:var(--ink);margin-top:4px;line-height:1.4}.bc-step .k{font-size:11px;color:var(--ink-muted);margin-top:6px}' +
    '.bc-arrow{align-self:center;color:var(--ink-muted);padding:0 4px;font-size:18px}' +
    '.bc-note{font-size:12.5px;color:var(--ink-muted);background:var(--panel);border-radius:8px;padding:11px 13px;line-height:1.55}' +
    '.bc-badge-rt{font-size:11px;font-weight:700;color:#b9770e;background:#fef3e0;border-radius:5px;padding:2px 7px;margin-left:8px;vertical-align:middle}' +
    '@media(max-width:1000px){.bc-grid2,.bc-grid2b{grid-template-columns:1fr}}' +
  '</style>';

  // Checkout template gallery (the "Checkout design" submenu).
  const GSTYLE = '<style>' +
    '.cg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(284px,1fr));gap:16px}' +
    '.cg-card{border:1px solid var(--hair);border-radius:14px;overflow:hidden;background:#fff;display:flex;flex-direction:column;transition:box-shadow .15s,border-color .15s}' +
    '.cg-card:hover{box-shadow:var(--float-shadow);border-color:#d4d8de}' +
    '.cg-thumb{height:152px;background:#f6f7f9;padding:12px;display:flex;flex-direction:column;gap:8px;border-bottom:1px solid var(--hair)}' +
    '.cg-t-bar{height:14px;border-radius:4px;background:var(--acc);opacity:.9}.cg-t-gap{height:14px}' +
    '.cg-t-cols{flex:1;display:grid;grid-template-columns:1fr .68fr;gap:8px;min-height:0}' +
    '.cg-t-main{display:flex;flex-direction:column;gap:6px}.cg-t-main span{height:9px;border-radius:3px;background:#dfe3e8}.cg-t-main span.w{width:62%}' +
    '.cg-t-side{background:#fff;border:1px solid #e3e6ea;border-radius:6px;padding:7px;display:flex;flex-direction:column;gap:5px}' +
    '.cg-t-side i{height:8px;border-radius:3px;background:#e6e9ed}.cg-t-side b{height:13px;border-radius:4px;background:var(--acc);margin-top:auto}' +
    '.cg-t-solo{flex:1;width:72%;margin:0 auto;background:#fff;border:1px solid #e3e6ea;border-radius:6px;padding:9px;display:flex;flex-direction:column;gap:6px}' +
    '.cg-t-solo i{height:9px;border-radius:3px;background:#e6e9ed}.cg-t-solo b{height:14px;border-radius:4px;background:var(--acc);margin-top:4px}' +
    '.cg-t-foot{height:10px;border-radius:3px;background:#e9ebef}' +
    '.cg-body{padding:13px 15px 15px;display:flex;flex-direction:column;gap:7px;flex:1}' +
    '.cg-name{font-size:15px;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:8px}' +
    '.cg-pop{font-size:10.5px;font-weight:700;color:#b9770e;background:#fef3e0;border-radius:5px;padding:2px 7px}' +
    '.cg-rec{font-size:10.5px;font-weight:700;color:#1f8f4e;background:#e7f7ee;border-radius:5px;padding:2px 7px}' +
    '.cg-soonbadge{font-size:10.5px;font-weight:700;color:#5b6470;background:#eef0f2;border-radius:5px;padding:2px 7px}.cg-soon{opacity:.92}' +
    '.cg-t-offer{flex:1;display:flex;flex-direction:column;gap:6px;justify-content:center}.cg-t-offer span{height:18px;border-radius:5px;background:#e3e6ea;border:1px solid #dfe3e8}.cg-t-offer span.sel{background:var(--acc);opacity:.85;border-color:transparent}' +
    '.cg-tag{font-size:12.5px;line-height:1.5}' +
    '.cg-chips{display:flex;flex-wrap:wrap;gap:5px;margin:1px 0 3px}' +
    '.cg-cm{font-size:11px;color:var(--ink-muted);background:var(--panel);border-radius:999px;padding:3px 9px}' +
    '.cg-actions{margin-top:auto;display:flex;gap:8px;padding-top:3px}.cg-actions .btn{flex:1;justify-content:center}' +
  '</style>';

  // Funnel canvas + Templates library
  const FSTYLE = '<style>' +
    '.tp-group{margin-bottom:26px}.tp-group-h{display:flex;align-items:baseline;gap:10px;margin-bottom:11px}.tp-group-name{font-size:15px;font-weight:700;color:var(--ink)}' +
    '.tp-sys{font-size:10.5px;font-weight:700;color:#2b62d6;background:#e8f0fe;border-radius:5px;padding:2px 7px}' +
    '.tp-saved{font-size:10.5px;font-weight:700;color:#1f8f4e;background:#e7f7ee;border-radius:5px;padding:2px 7px}' +
    '.fc-bar{display:flex;align-items:center;gap:8px;margin:0 0 12px;flex-wrap:wrap}.fc-bar .btn{padding:5px 11px;font-size:13px;min-width:34px;justify-content:center}' +
    '.fc-zval{font-size:12.5px;color:var(--ink-muted);min-width:46px;text-align:center}.fc-hint{font-size:12px;color:var(--ink-muted);margin-left:4px}' +
    '.fc-scroll{position:relative;overflow:auto;border:1px solid var(--hair);border-radius:14px;background:#fbfcfd;min-height:380px}' +
    '.fc-sizer{position:relative}' +
    '.fc-canvas{position:relative;transform-origin:0 0;background-image:radial-gradient(#dde2e8 1.1px,transparent 1.1px);background-size:22px 22px;background-position:8px 8px}' +
    '.fc-edges{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible}.fc-edges .fc-ehit{pointer-events:stroke;cursor:pointer}' +
    '.fc-labels{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}' +
    '.fc-elabel{position:absolute;transform:translate(-50%,-50%);font-size:10px;font-weight:800;letter-spacing:.04em;padding:2px 8px;border-radius:20px;background:#fff;border:1.5px solid #cfd5dd;color:#5b6470;white-space:nowrap;box-shadow:0 1px 2px rgba(20,30,50,.06);z-index:3}' +
    '.fc-elabel.accept{border-color:#bfe3cd;color:#1f8f4e}.fc-elabel.decline{border-color:#f0d4a8;color:#b9770e}.fc-elabel.random{border-color:#bcd0f5;color:#2b62d6;font-weight:800}.fc-elabel.predicate{border-color:#d8c8f0;color:#7b4bd0;font-weight:800}' +
    '.fc-elabel[data-edit]{pointer-events:auto;cursor:pointer}.fc-elabel[data-edit].random:hover{background:#eef3fe;border-color:#2b62d6}.fc-elabel[data-edit].predicate:hover{background:#f5eef9;border-color:#7b4bd0}' +
    '.se-list{display:flex;flex-direction:column;gap:8px}.se-row{display:flex;align-items:center;gap:10px}.se-name{flex:1;font-size:13.5px;color:var(--ink);font-weight:600}.se-pct{width:74px;height:36px;border:1px solid var(--line);border-radius:8px;padding:0 10px;font-size:14px;text-align:right}.se-sign{color:var(--ink-muted);font-size:13px}' +
    '.se-total{margin-top:12px;font-size:12.5px;color:var(--ink-muted)}' +
    '.fc-emenu{background:#fff;border:1px solid var(--hair);border-radius:10px;box-shadow:var(--float-shadow);padding:6px;min-width:236px;display:flex;flex-direction:column;gap:1px}' +
    '.fc-emh{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);padding:3px 10px 5px}' +
    '.fc-emsep{height:1px;background:var(--hair);margin:5px 0}' +
    '.fc-emi{display:flex;align-items:center;gap:8px;text-align:left;font-size:13px;color:var(--ink);background:transparent;border:0;border-radius:7px;padding:8px 10px;cursor:pointer}.fc-emi:hover{background:var(--panel)}.fc-emi.on{background:var(--panel);font-weight:600}' +
    '.fc-emi-x{margin-left:auto;font-size:11.5px;color:var(--ink-muted);font-weight:400}' +
    '.fc-emi-info{font-size:12px;color:var(--ink-muted);padding:4px 10px 7px;line-height:1.5}' +
    '.fc-emi.accept{color:#1f8f4e}.fc-emi.decline{color:#b9770e}.fc-emi.random{color:#2b62d6}.fc-emi.predicate{color:#7b4bd0}' +
    '.fc-emi.del{color:#d64545}.fc-emi.del:hover{background:#fdeaea}' +
    '.se-pred{height:36px;border:1px solid var(--line);border-radius:8px;padding:0 11px;font-size:13.5px;background:#fff;color:var(--ink);min-width:170px}' +
    /* Routing rule builder (Azoya-style multi-condition AND) */
    '.rb-mc{width:640px;max-width:96vw}' +
    '.rb-list{display:flex;flex-direction:column;gap:14px;max-height:60vh;overflow:auto}' +
    '.rb-branch{border:1px solid var(--hair);border-radius:10px;padding:12px 14px;background:#fff;transition:border-color .15s,background .15s}' +
    '.rb-branch.fallback{border-color:#bcd0f5;background:linear-gradient(180deg,#f3f8ff 0%,#fff 40px)}' +
    '.rb-branch-h{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13.5px}' +
    '.rb-arrow{color:var(--ink-muted);font-weight:700}' +
    '.rb-target{color:var(--ink);font-weight:700}' +
    '.rb-fb{margin-left:auto;font-size:12.5px;color:var(--ink-muted);display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-weight:500}' +
    '.rb-fb input{margin:0}' +
    '.rb-fb-note{font-size:12px;color:var(--ink-muted);background:var(--panel);border-radius:7px;padding:8px 10px;line-height:1.5}' +
    '.rb-conds{display:flex;flex-direction:column;gap:7px;margin-bottom:8px}' +
    '.rb-cond{display:flex;align-items:center;gap:6px;background:var(--panel);border-radius:8px;padding:5px}' +
    '.rb-cond select,.rb-cond input.rb-val{height:32px;border:1px solid var(--line);border-radius:7px;padding:0 8px;font-size:12.5px;background:#fff;color:var(--ink)}' +
    '.rb-cond .rb-field{flex:0 0 150px;font-weight:500}' +
    '.rb-cond .rb-op{flex:0 0 92px}' +
    '.rb-cond .rb-vwrap{flex:1;min-width:0;display:flex;align-items:center;gap:5px}' +
    '.rb-cond .rb-vwrap select.rb-val,.rb-cond .rb-vwrap input.rb-val{flex:1;min-width:0}' +
    '.rb-cond .rb-tilde{color:var(--ink-muted);font-size:12px}' +
    '.rb-cond .rb-rm{width:26px;height:26px;border:0;background:transparent;color:#c2c8d0;font-size:12px;cursor:pointer;border-radius:5px;flex:none}.rb-cond .rb-rm:hover{background:#fdeaea;color:#d64545}' +
    '.rb-tags{flex:1;display:flex;flex-wrap:wrap;align-items:center;gap:5px;min-height:32px;padding:3px 6px;background:#fff;border:1px solid var(--line);border-radius:7px}' +
    '.rb-tag{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;color:#7b4bd0;background:#f1ecfb;border-radius:5px;padding:3px 4px 3px 8px}' +
    '.rb-tag button{border:0;background:transparent;color:#7b4bd0;cursor:pointer;font-size:13px;padding:0 3px}' +
    '.rb-tagadd{flex:none;height:24px;border:0;background:transparent;color:var(--brand);font-size:12px;cursor:pointer}' +
    '.rb-hint{display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;background:#e6e9ee;color:#6e7682;font-size:10px;font-weight:700;cursor:help;position:relative}.rb-hint:hover,.rb-hint:focus{background:#7b4bd0;color:#fff;outline:none}' +
    '.rb-hint .rb-tip{display:none;position:absolute;top:calc(100% + 9px);right:-6px;background:#3a3f4a;color:#fff;padding:9px 12px;border-radius:6px;font-size:12px;font-weight:400;line-height:1.55;width:280px;text-align:left;letter-spacing:0;z-index:200;box-shadow:0 4px 14px rgba(20,30,50,.22);white-space:normal;pointer-events:none}' +
    '.rb-hint .rb-tip::after{content:"";position:absolute;bottom:100%;right:10px;border:5px solid transparent;border-bottom-color:#3a3f4a}' +
    '.rb-hint:hover .rb-tip,.rb-hint:focus .rb-tip{display:block}' +
    '.rb-addc{margin-top:2px;font-size:12.5px;color:var(--brand);background:transparent;border:1px dashed var(--brand);border-radius:7px;padding:6px 11px;cursor:pointer}.rb-addc:hover{background:#eef3fe}' +
    '.rb-msg{flex:1;font-size:12px;color:var(--ink-muted)}.rb-msg.err{color:#d92d20}' +
    '.rb-section-l{font-size:11px;font-weight:600;color:var(--ink-muted);letter-spacing:.04em;margin:2px 0 5px;text-transform:uppercase}' +
    '.rb-empty{font-size:12.5px;color:var(--ink-muted);padding:8px 10px;background:#fafafa;border-radius:7px;border:1px dashed var(--hair)}' +
    '.rb-sep{height:1px;background:var(--hair);margin:14px 0 12px}' +
    '.rb-weight-row{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ink)}' +
    '.rb-weight-prefix{color:var(--ink-body)}' +
    '.rb-weight-suffix{color:var(--ink-body)}' +
    '.rb-weight-input{width:72px;height:32px;border:1px solid var(--line);border-radius:7px;padding:0 9px;font-size:13px;text-align:right;background:#fff;color:var(--ink)}' +
    '.rb-weight-rm{width:26px;height:26px;border:0;background:transparent;color:#c2c8d0;font-size:12px;cursor:pointer;border-radius:5px;margin-left:auto}.rb-weight-rm:hover{background:#fdeaea;color:#d64545}' +
    '.rb-addw{margin-top:0}' +
    '.fc-node{position:absolute;width:230px;background:#fff;border:1px solid var(--hair);border-radius:12px;box-shadow:0 1px 3px rgba(20,30,50,.07);cursor:pointer}.fc-node .fc-node-bar,.fc-node .fc-node-body{overflow:hidden;border-radius:inherit}.fc-node .fc-node-bar{border-radius:12px 12px 0 0}.fc-node .fc-node-body{border-radius:0 0 12px 12px}' +
    '.fc-node.sel{box-shadow:0 0 0 2px var(--brand),0 4px 14px rgba(20,30,50,.14)}' +
    '.fc-node-bar{display:flex;align-items:center;gap:7px;padding:9px 11px;cursor:grab;border-bottom:1px solid var(--hair);user-select:none;background:#fbfcfd}.fc-node-bar:active{cursor:grabbing}' +
    '.fc-dot{width:8px;height:8px;border-radius:50%;flex:none;background:#9aa3af}' +
    '.fc-node-type{font-size:13.5px;font-weight:700;color:var(--ink)}.fc-grip{margin-left:6px;color:#c2c8d0;font-size:12px}' +
    '.t-checkout .fc-dot{background:#2b62d6}.t-upsell .fc-dot{background:#1f8f4e}.t-downsell .fc-dot{background:#d98a2b}.t-thankyou .fc-dot{background:#7b4bd0}' +
    '.fc-node-body{padding:12px}' +
    '.fc-del{margin-left:auto;width:18px;height:18px;border:0;background:transparent;color:#c2c8d0;font-size:11px;cursor:pointer;border-radius:5px;display:grid;place-items:center;padding:0}.fc-del:hover{background:#fdeaea;color:#d64545}' +
    '.fc-canvas.fc-connecting{cursor:crosshair}' +
    /* Feishu-style drag-from-port: a blue dot on the right edge of every node. Hover-discoverable; */
    /* mousedown starts a drag with a ghost SVG line; release over a node creates the edge. */
    '.fc-port{position:absolute;right:-8px;top:50%;width:16px;height:16px;border-radius:50%;background:#2b62d6;border:2.5px solid #fff;box-shadow:0 0 0 1px #2b62d6,0 1px 3px rgba(20,30,50,.18);opacity:0;cursor:crosshair;transition:opacity .18s,transform .15s;z-index:4;transform:translateY(-50%)}' +
    '.fc-port::after{content:"";position:absolute;inset:3px;border-radius:50%;background:#fff;opacity:0;transition:opacity .15s}' +
    '.fc-node:hover .fc-port,.fc-port:hover,.fc-canvas.fc-connecting .fc-port{opacity:1}' +
    '.fc-port:hover{transform:translateY(-50%) scale(1.25)}.fc-port:hover::after{opacity:1}' +
    '.fc-node.fc-drop-target{box-shadow:0 0 0 2px #1f8f4e,0 4px 14px rgba(31,143,78,.22)!important}.fc-node.fc-drop-target .fc-node-bar{background:#eaf7ee}' +
    '.fc-src .fc-node-bar{background:#f3f9f4}.fc-src .fc-grip{margin-left:6px}.fc-sicon{width:18px;height:18px;border-radius:5px;background:#95bf47;color:#fff;font-weight:800;font-size:12px;display:grid;place-items:center;flex:none}' +
    '.fc-src-dom{font-size:12.5px;font-weight:700;color:var(--ink);word-break:break-all}.fc-src-tag{font-size:11.5px;color:var(--ink-muted);line-height:1.45;margin:4px 0 2px}' +
    '.fc-ctrl .fc-node-bar{background:#f3f9f4}.fc-ctrl .fc-del{margin-left:auto}.fc-ctrl .fc-grip{margin-left:6px}.fc-cicon{width:18px;height:18px;border-radius:5px;background:#95bf47;color:#fff;font-weight:800;font-size:12px;display:grid;place-items:center;flex:none}' +
    '.fc-ctrl-tag{font-size:11.5px;color:var(--ink-muted);line-height:1.45;margin:0 0 2px}' +
    '.fc-add{position:relative;display:inline-flex}.fc-add-menu{position:absolute;top:calc(100% + 5px);left:0;z-index:60;background:#fff;border:1px solid var(--hair);border-radius:10px;box-shadow:var(--float-shadow);padding:5px;min-width:158px;display:flex;flex-direction:column;gap:2px}.fc-add-menu[hidden]{display:none}' +
    '.fc-add-menu button{text-align:left;font-size:13px;color:var(--ink);background:transparent;border:0;border-radius:7px;padding:8px 10px;cursor:pointer}.fc-add-menu button:hover{background:var(--panel)}' +
    '.fc-sep{width:1px;height:22px;background:var(--hair);margin:0 4px}' +
    '.fn-node-type{font-size:15px;font-weight:700;color:var(--ink)}' +
    '.fn-tpl{font-size:12.5px;color:var(--ink-muted)}.fn-tpl b{color:var(--ink)}' +
    '.fn-ab{border:1px solid #e3e6ea;border-radius:9px;padding:9px 10px;background:#fafbfc}' +
    '.fn-ab-h{font-size:11.5px;font-weight:600;color:var(--ink);margin-bottom:7px}' +
    '.fn-ab-row{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--ink-muted);margin:4px 0}.fn-ab-row b{width:11px;font-weight:700}.fn-ab-row i{width:40px;text-align:right;font-style:normal}.fn-ab-track{flex:1;height:8px;background:#eef0f2;border-radius:4px;overflow:hidden}.fn-ab-track span{display:block;height:100%}' +
    '.fn-ab-seg{flex:1;font-size:10.5px;font-weight:700;color:#5b6470;background:#eef1f5;border-radius:5px;padding:2px 7px;text-align:center}' +
    '.fn-ab-mode{font-size:9.5px;font-weight:700;color:#7b4bd0;background:#f1ecfb;border-radius:5px;padding:1px 6px;letter-spacing:.02em}' +
    '.fab-seg{display:flex;gap:6px}.fab-segbtn{flex:1;font-size:12.5px;font-weight:600;color:var(--ink-body);background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px 0;cursor:pointer}.fab-segbtn.on{border-color:var(--brand);color:var(--brand);background:#eef3fe}' +
    '.fab-note{font-size:12px;color:var(--ink-body);line-height:1.6;background:var(--panel);border-radius:8px;padding:10px 12px}' +
    '.pp-types{display:flex;gap:6px;flex-wrap:wrap}.pp-type{flex:1;min-width:70px;font-size:12.5px;font-weight:600;color:var(--ink-body);background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px 4px;cursor:pointer}.pp-type.on{border-color:var(--brand);color:var(--brand);background:#eef3fe}' +
    '.pp-tpls{display:flex;flex-direction:column;gap:7px;max-height:230px;overflow:auto}' +
    '.pp-tpl{display:flex;align-items:center;gap:11px;text-align:left;font-size:13px;color:var(--ink);background:#fff;border:1.5px solid var(--line);border-radius:9px;padding:10px 12px;cursor:pointer}.pp-tpl:hover{border-color:#d4d8de}.pp-tpl.on{border-color:var(--brand);box-shadow:inset 0 0 0 1px var(--brand)}' +
    '.pp-thumb-wrap{flex:none;width:96px;height:60px;border:1px solid var(--hair);border-radius:6px;overflow:hidden;background:#f6f7f9}' +
    '.pp-thumb-wrap .cg-thumb{height:100%;padding:5px;gap:3px;border-bottom:0}' +
    '.pp-thumb-wrap .cg-t-bar,.pp-thumb-wrap .cg-t-gap{height:6px;border-radius:2px}' +
    '.pp-thumb-wrap .cg-t-cols{gap:3px}' +
    '.pp-thumb-wrap .cg-t-main span{height:5px;border-radius:2px}.pp-thumb-wrap .cg-t-side i,.pp-thumb-wrap .cg-t-side b{border-radius:2px}' +
    '.pp-thumb-wrap .cg-t-foot{height:4px;border-radius:2px}' +
    '.pp-thumb-wrap .cg-t-solo{padding:4px;gap:2px}.pp-thumb-wrap .cg-t-solo i,.pp-thumb-wrap .cg-t-solo b{border-radius:2px}' +
    '.pp-tpl-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}' +
    '.pp-tpl-nm{font-weight:600;font-size:13.5px;color:var(--ink)}' +
    '.pp-tpl-tag{font-size:11.5px;color:var(--ink-muted);line-height:1.4}' +
    '.pp-from{font-size:12px;color:var(--ink-muted);margin-top:2px}.pp-from b{color:var(--ink)}' +
    '.bm-scopes{margin:12px 0 0;padding-left:18px;font-size:13px;color:var(--ink-body);line-height:1.75}' +
    '.bm-embed{margin-top:12px;border:1px solid var(--hair);border-radius:9px;padding:11px 13px;display:flex;align-items:center;gap:9px;font-size:13px;color:var(--ink)}' +
    '.bm-toggle{flex:none;width:34px;height:18px;border-radius:20px;background:#1f8f4e;position:relative}.bm-toggle::after{content:"";position:absolute;right:2px;top:2px;width:14px;height:14px;border-radius:50%;background:#fff}' +
    '.fn-ab-win{font-size:11px;color:#1f8f4e;margin-top:6px;line-height:1.4}.fn-ab-win a{color:#1f8f4e;font-weight:600;text-decoration:underline}' +
    '.fn-ab-foot{font-size:10.5px;margin-top:7px;color:var(--ink-muted)}.fn-ab-foot a{color:var(--brand);text-decoration:none}.fn-ab-foot a:hover{text-decoration:underline}' +
    '.fn-branch{font-size:11.5px;color:#b9770e;background:#fef3e0;border-radius:6px;padding:6px 9px;line-height:1.4}' +
    '.fn-acts{margin-top:auto;display:flex;gap:7px}.fn-acts .btn{flex:1;justify-content:center;font-size:12.5px}' +
    '.fc-node-body .fn-acts{margin-top:10px}' +
    '@media(max-width:760px){.fc-hint{display:none}}' +
  '</style>';

  // A/B test (split testing) — boss-requested; the Checkout Champ core feature.
  const XSTYLE = '<style>' +
    '.xp-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px;flex-wrap:wrap}' +
    '.xp-list{display:flex;flex-direction:column;gap:12px}' +
    '.xp-card{border:1px solid var(--hair);border-radius:12px;padding:15px 17px;cursor:pointer;transition:box-shadow .15s,border-color .15s;background:#fff}' +
    '.xp-card:hover{box-shadow:var(--float-shadow);border-color:#d4d8de}' +
    '.xp-card-top{display:flex;align-items:center;gap:9px;margin-bottom:4px;flex-wrap:wrap}.xp-name{font-size:15px;font-weight:700;color:var(--ink)}' +
    '.xp-meta{font-size:12px;color:var(--ink-muted);margin-bottom:12px}' +
    '.xp-vs{display:grid;grid-template-columns:1fr 30px 1fr;align-items:stretch;gap:10px}' +
    '.xp-v{border:1px solid var(--hair);border-radius:9px;padding:9px 11px}.xp-v.lead{border-color:#bfe3cd;background:#f4fbf6}' +
    '.xp-v-h{display:flex;align-items:center;gap:7px;margin-bottom:4px}' +
    '.xp-v-badge{width:18px;height:18px;border-radius:5px;display:grid;place-items:center;font-size:11px;font-weight:800;color:#fff;background:#5b6470;flex:none}' +
    '.xp-v.A .xp-v-badge{background:#2b62d6}.xp-v.B .xp-v-badge{background:#7b4bd0}' +
    '.xp-v-name{font-size:13px;font-weight:600;color:var(--ink)}' +
    '.xp-v-metric{font-size:21px;font-weight:700;color:var(--ink);letter-spacing:-.5px;margin-top:2px}.xp-v-sub{font-size:11.5px;color:var(--ink-muted)}' +
    '.xp-vsx{display:grid;place-items:center;font-size:11px;font-weight:800;color:var(--ink-muted)}' +
    '.xp-right{display:flex;gap:20px;align-items:center;justify-content:flex-end;margin-top:12px;flex-wrap:wrap}' +
    '.xp-stat{text-align:right}.xp-stat .l{font-size:11px;color:var(--ink-muted)}.xp-stat .v{font-size:15px;font-weight:700;color:var(--ink)}.xp-up{color:#1f8f4e}' +
    '.xp-back{font-size:13px;color:var(--brand);text-decoration:none;display:inline-block;margin-bottom:12px}' +
    '.xp-grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:14px 0}' +
    '.xp-rv{border:1px solid var(--hair);border-radius:12px;padding:16px 18px;position:relative}.xp-rv.win{border-color:#bfe3cd;background:#f4fbf6}' +
    '.xp-rv-win{position:absolute;top:13px;right:13px;font-size:11px;font-weight:700;color:#1f8f4e;background:#e7f7ee;border-radius:6px;padding:3px 9px}' +
    '.xp-rv-h{display:flex;align-items:center;gap:8px;margin-bottom:9px;flex-wrap:wrap}' +
    '.xp-rv-metric{font-size:34px;font-weight:800;color:var(--ink);letter-spacing:-1px;line-height:1}.xp-rv-ml{font-size:12px;color:var(--ink-muted);margin-bottom:13px}' +
    '.xp-rv-row{display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-top:1px solid var(--hair)}.xp-rv-row .k{color:var(--ink-muted)}.xp-rv-row .v{font-weight:600;color:var(--ink)}' +
    '.xp-sum{border:1px solid var(--hair);border-radius:12px;padding:15px 17px;margin-bottom:6px;display:flex;align-items:center;gap:20px;flex-wrap:wrap}' +
    '.xp-bar{flex:1;min-width:230px}.xp-bar-row{display:flex;align-items:center;gap:9px;margin:6px 0}' +
    '.xp-bar-row .lbl{width:18px;font-size:11px;font-weight:800;color:#fff;border-radius:4px;text-align:center;padding:2px 0}' +
    '.xp-bar-track{flex:1;height:14px;background:#eef0f2;border-radius:7px;overflow:hidden}.xp-bar-fill{height:100%;border-radius:7px;transition:width .4s}' +
    '.xp-bar-val{width:58px;text-align:right;font-size:12.5px;font-weight:700;color:var(--ink)}' +
    '.xp-modal{position:fixed;inset:0;background:rgba(20,24,32,.45);z-index:80;display:flex;align-items:center;justify-content:center;padding:20px}' +
    '.xp-mc{background:#fff;border-radius:14px;width:560px;max-width:100%;max-height:90vh;overflow:auto;box-shadow:var(--float-shadow)}' +
    '.xp-mh{padding:16px 20px;border-bottom:1px solid var(--hair);font-size:16px;font-weight:700;color:var(--ink)}' +
    '.xp-mb{padding:18px 20px;display:flex;flex-direction:column;gap:14px}' +
    '.xp-f{display:flex;flex-direction:column;gap:6px}.xp-f label{font-size:12.5px;font-weight:600;color:var(--ink)}' +
    '.xp-f input,.xp-f select{height:38px;border:1px solid var(--line);border-radius:8px;padding:0 11px;font-size:13.5px;color:var(--ink);background:#fff}' +
    '.xp-split{display:flex;align-items:center;gap:12px}.xp-split input[type=range]{flex:1}' +
    '.xp-mf{padding:14px 20px;border-top:1px solid var(--hair);display:flex;justify-content:flex-end;gap:9px}' +
    '@media(max-width:760px){.xp-grid2{grid-template-columns:1fr}.xp-vs{grid-template-columns:1fr}.xp-vsx{display:none}}' +
  '</style>';

  const SECTIONS = [
    { key: '',              label: 'Overview',         route: '#/bestcheckout' },
    { key: 'checkout',      label: 'Checkout design',  route: '#/bestcheckout/checkout' },
    { key: 'thankyou',      label: 'Thank-you design', route: '#/bestcheckout/thankyou' },
    { key: 'post-purchase', label: 'Post-purchase',    route: '#/bestcheckout/post-purchase' },
    { key: 'connect',       label: 'Connection',       route: '#/bestcheckout/connect' },
  ];
  // Sections are navigated from the sidebar second-level menu (PLUGGABLE_APPS children) — no in-page tabs.
  const subnav = () => '';
  // Use t() up-front for the surrounding English text so the bcI18n textNode walker
  // doesn't choke on a "漏斗 · External checkout on" mixed string it can't dict-match.
  const head = (sub) => '<div class="bc-head"><div class="bc-h1">BestCheckout</div>' +
    '<div class="bc-sub">' + sub + '　·　' + t('External checkout on') + ' <b>lovocross.myshopify.com</b> · ' + t('orders write back to Shopify') + '</div></div>';
  const chip = (text, cls) => '<span class="bc-chip ' + cls + '"><span class="d"></span>' + esc(text) + '</span>';
  const wrap = (inner) => '<div class="view-wrap">' + STYLE + inner + '</div>';
  const money = (n) => '$' + Number(n).toFixed(2);

  const statusChip = (s) => ({
    active: chip('Active', 'blue'), trial: chip('Trial', 'amber'), recycle: chip('Recycle', 'amber'),
    cancelled: chip('Cancelled', 'gray'), recycle_failed: chip('Recycle failed', 'red'),
    backup: chip('Backup', 'gray'), on: chip('On', 'green'), off: chip('Off', 'gray'),
  }[s] || chip(s, 'gray'));

  // ============ Shopify authorization — the first-run INITIALIZATION flow ============
  // Shown until the store is connected (bcConnected() === false). Four steps:
  // store URL → OAuth consent (scopes) → import progress → connected. This is the
  // on-ramp; once authorized the merchant works inside the full BestShopio platform.
  const CF = { step: 'store', store: 'lovocross.myshopify.com' };
  const CFSTYLE = '<style>' +
    '.cf{max-width:560px;margin:20px auto}' +
    '.cf-card{border:1px solid var(--hair);border-radius:14px;background:#fff;padding:26px 26px 22px;box-shadow:0 1px 2px rgba(20,30,50,.04)}' +
    '.cf-steps{display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:18px}' +
    '.cf-dot{width:7px;height:7px;border-radius:50%;background:var(--ctl);transition:all .2s}.cf-dot.on{background:var(--brand);width:22px;border-radius:4px}' +
    '.cf-sb{width:46px;height:46px;border-radius:12px;background:#95bf47;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px;margin:0 auto 14px}' +
    '.cf-h{font-size:20px;font-weight:700;color:var(--ink);text-align:center}' +
    '.cf-p{font-size:13px;color:var(--ink-muted);text-align:center;margin:8px auto 18px;line-height:1.6;max-width:440px}' +
    '.cf-fl{font-size:12px;color:var(--ink-muted);margin:0 0 6px;font-weight:600}' +
    '.cf-in{width:100%;height:40px;border:1px solid var(--ctl);border-radius:9px;padding:0 12px;font-size:13.5px;background:#fff;color:var(--ink)}' +
    '.cf-plats{display:flex;gap:8px;margin:14px 0 2px}' +
    '.cf-plat{flex:1;border:1px solid var(--hair);border-radius:9px;padding:10px 8px;text-align:center;font-size:12.5px;font-weight:600;color:var(--ink)}' +
    '.cf-plat.on{border-color:var(--brand);box-shadow:0 0 0 2px rgba(0,102,230,.12)}.cf-plat.soon{color:var(--ink-muted);background:var(--panel);font-weight:500}' +
    '.cf-scope{display:flex;gap:9px;align-items:flex-start;padding:9px 0;border-top:1px solid var(--hair)}.cf-scope:first-of-type{border-top:0}.cf-scope svg{color:#1f8f4e;flex:none;margin-top:2px}.cf-scope .k{font-size:13px;color:var(--ink)}' +
    '.cf-sync{display:flex;align-items:center;gap:11px;padding:8px 0;font-size:13px;color:var(--ink)}.cf-sync .ck{width:20px;height:20px;border-radius:50%;background:#e7f7ee;color:#1f8f4e;display:flex;align-items:center;justify-content:center;flex:none;opacity:0;transform:scale(.5);animation:cfpop .3s ease forwards}.cf-sync .ck svg{width:12px;height:12px}' +
    '@keyframes cfpop{to{opacity:1;transform:scale(1)}}' +
    '.cf-bar{height:6px;border-radius:999px;background:var(--panel);overflow:hidden;margin:6px 0 16px}.cf-bar i{display:block;height:100%;background:var(--brand);width:8%;animation:cffill 2.1s ease forwards}@keyframes cffill{to{width:100%}}' +
    '.cf-done-ic{width:56px;height:56px;border-radius:50%;background:#e7f7ee;color:#1f8f4e;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}.cf-done-ic svg{width:30px;height:30px}' +
    '.cf-sum{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin:2px 0 14px}' +
    '.cf-next{font-size:12.5px;color:var(--ink-muted);text-align:center;line-height:1.6;margin-bottom:4px}' +
    '.cf-foot{display:flex;justify-content:space-between;gap:10px;margin-top:20px}' +
    // The OAuth consent step is rendered as a full-screen, Shopify-looking page (it represents the
    // redirect to Shopify — in reality this screen is hosted by Shopify, not by us).
    '.cf-sf{position:fixed;inset:0;z-index:200;background:#f6f6f7;display:flex;flex-direction:column;overflow:auto}' +
    '.cf-sf-top{height:56px;background:#1a1a1a;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 22px;flex:none}' +
    '.cf-sf-l{display:flex;align-items:center;gap:9px;font-weight:700;font-size:15px}' +
    '.cf-sf-l .m{width:22px;height:22px;border-radius:6px;background:#95bf47;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px}' +
    '.cf-sf-shop{font-size:13px;color:#c9c9c9}' +
    '.cf-sf-body{flex:1;display:flex;align-items:flex-start;justify-content:center;padding:42px 20px}' +
    '.cf-oauth{width:100%;max-width:600px;background:#fff;border:1px solid #e1e3e5;border-radius:14px;overflow:hidden}' +
    '.cf-oauth-h{display:flex;align-items:center;gap:13px;padding:20px 22px;border-bottom:1px solid #e1e3e5}' +
    '.cf-oauth-ico{width:46px;height:46px;border-radius:11px;background:var(--brand);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;flex:none}' +
    '.cf-oauth-t{font-size:17px;font-weight:700;color:#1a1a1a}.cf-oauth-s{font-size:13px;color:#6d7175;margin-top:2px}' +
    '.cf-oauth-b{padding:18px 22px}.cf-oauth-lbl{font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:6px}' +
    '.cf-oauth-row{display:flex;gap:10px;padding:8px 0;font-size:13px;color:#1a1a1a;line-height:1.5}.cf-oauth-row svg{color:#008060;flex:none;margin-top:2px}' +
    '.cf-oauth-note{font-size:12px;color:#6d7175;background:#f6f6f7;border-radius:8px;padding:11px 13px;margin-top:14px;line-height:1.55}' +
    '.cf-oauth-f{display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid #e1e3e5}' +
    '.cf-btn-sf{height:38px;padding:0 18px;border-radius:8px;border:0;background:#008060;color:#fff;font-size:13.5px;font-weight:600;cursor:pointer}.cf-btn-sf:hover{background:#006e52}' +
    '.cf-btn-ghost{height:38px;padding:0 16px;border-radius:8px;border:1px solid #babfc3;background:#fff;color:#1a1a1a;font-size:13.5px;font-weight:600;cursor:pointer}.cf-btn-ghost:hover{background:#f6f6f7}' +
  '</style>';
  const cfDots = (n) => '<div class="cf-steps">' + [0, 1, 2, 3].map((i) => '<span class="cf-dot' + (i === n ? ' on' : '') + '"></span>').join('') + '</div>';
  function cfStepStore() {
    return cfDots(0) + '<div class="cf-sb">S</div><div class="cf-h">' + t('Connect your Shopify store') + '</div>' +
      '<div class="cf-p">' + t('BestCheckout installs as a private app via OAuth — no App Store listing, no review. We import your products, discounts and shipping, and write orders back to Shopify.') + '</div>' +
      '<div class="cf-fl">' + t('Your Shopify store URL') + '</div><input class="cf-in" id="cf-store" value="' + esc(CF.store) + '" placeholder="your-store.myshopify.com">' +
      '<div class="cf-plats"><div class="cf-plat on">Shopify</div><div class="cf-plat soon">WooCommerce · ' + t('soon') + '</div><div class="cf-plat soon">BigCommerce · ' + t('soon') + '</div></div>' +
      '<div class="cf-foot"><span></span><button class="btn btn-primary" data-cf="authorize">' + t('Continue to Shopify') + '</button></div>';
  }
  // Rendered as a full-screen, Shopify-hosted-looking page — this represents the redirect to
  // Shopify's own OAuth consent screen (in reality Shopify hosts this, not BestShopio).
  function cfStepAuthorize() {
    const access = [
      ['Products & collections', 'View and edit products, collections and inventory'],
      ['Orders', 'View and create orders — write paid orders back for fulfillment'],
      ['Discounts', 'View and edit discounts and price rules'],
      ['Shipping', 'View shipping zones and rates'],
      ['Customers', 'View and edit customers'],
    ];
    const list = access.map((a) => '<div class="cf-oauth-row">' + I.check + '<div><b style="font-weight:600">' + t(a[0]) + '</b> — <span style="color:#6d7175">' + t(a[1]) + '</span></div></div>').join('');
    return '<div class="cf-sf">' +
      '<div class="cf-sf-top"><div class="cf-sf-l"><span class="m">S</span>Shopify</div><div class="cf-sf-shop">' + esc(CF.store) + '</div></div>' +
      '<div class="cf-sf-body"><div class="cf-oauth">' +
        '<div class="cf-oauth-h"><div class="cf-oauth-ico">B</div><div><div class="cf-oauth-t">' + t('Install BestCheckout?') + '</div><div class="cf-oauth-s">' + esc(CF.store) + ' · ' + t('by Bestfulfill') + '</div></div></div>' +
        '<div class="cf-oauth-b"><div class="cf-oauth-lbl">' + t('BestCheckout will be able to:') + '</div>' + list +
          '<div class="cf-oauth-note">' + t('This is a custom (private) app installed via a one-time link — it is not listed on the Shopify App Store. By clicking Install, you grant the access above; you can uninstall anytime from Settings → Apps.') + '</div>' +
        '</div>' +
        '<div class="cf-oauth-f"><button class="cf-btn-ghost" data-cf="store">' + t('Cancel') + '</button><button class="cf-btn-sf" data-cf="syncing">' + t('Install app') + '</button></div>' +
      '</div></div>' +
    '</div>';
  }
  function cfStepSyncing() {
    const items = [t('Access granted (OAuth)'), t('Importing products') + ' (1,310)', t('Importing collections') + ' (48)', t('Importing discounts') + ' (23)', t('Importing shipping rates') + ' (9)', t('Registering webhooks'), t('Building the catalog mapping')];
    const rows = items.map((it, i) => '<div class="cf-sync"><span class="ck" style="animation-delay:' + (0.15 + i * 0.27).toFixed(2) + 's">' + I.check + '</span>' + esc(it) + '</div>').join('');
    return cfDots(2) + '<div class="cf-h">' + t('Connecting to') + ' ' + esc(CF.store) + '…</div>' +
      '<div class="cf-p">' + t('Syncing your catalog and registering webhooks — this usually takes a few seconds.') + '</div>' +
      '<div class="cf-bar"><i></i></div>' + rows;
  }
  function cfStepDone() {
    const chips = ['1,310 ' + t('products'), '48 ' + t('collections'), '23 ' + t('discounts'), '9 ' + t('shipping rates')].map((c) => chip(c, 'green')).join('');
    return cfDots(3) + '<div class="cf-done-ic">' + I.check + '</div><div class="cf-h">' + t('You’re connected!') + '</div>' +
      '<div class="cf-p">' + t('Your Shopify catalog is now in BestShopio — edit it right here and changes sync back to Shopify. Orders you capture write back automatically.') + '</div>' +
      '<div class="cf-sum">' + chips + '</div>' +
      '<div class="cf-next">' + t('Next: connect payments · set your checkout domain · turn on checkout injection · build your first funnel.') + '</div>' +
      '<div class="cf-foot" style="justify-content:center"><button class="btn btn-primary" data-cf="enter">' + t('Enter BestCheckout') + '</button></div>';
  }
  function renderConnectFlow() {
    if (CF.step === 'authorize') {
      root.innerHTML = wrap(CFSTYLE + cfStepAuthorize()); // full-screen Shopify-looking consent page
    } else {
      const body = CF.step === 'syncing' ? cfStepSyncing() : CF.step === 'done' ? cfStepDone() : cfStepStore();
      root.innerHTML = wrap(CFSTYLE + '<div class="cf"><div class="cf-card">' + body + '</div></div>');
    }
    root.querySelectorAll('[data-cf]').forEach((b) => b.onclick = () => {
      const to = b.getAttribute('data-cf');
      const inp = root.querySelector('#cf-store'); if (inp && inp.value.trim()) CF.store = inp.value.trim();
      if (to === 'enter') { setBcConnected(true); CF.step = 'store'; toast(t('Connected to Shopify')); location.hash = '#/bestcheckout'; renderOverview(); return; }
      CF.step = to; renderConnectFlow();
    });
    // Auto-advance import → connected. Guard on the progress bar still being on screen (so we
    // don't overwrite another view if the user navigated away) — NOT on connected state, since
    // the demo entry (#/bestcheckout/onboarding) runs this flow even while already connected.
    if (CF.step === 'syncing') { setTimeout(function () { if (CF.step === 'syncing' && document.querySelector('.cf-bar')) { CF.step = 'done'; renderConnectFlow(); } }, 2300); }
    bcI18n(root);
  }

  // ===================== ACTIVATION CHECKLIST (onboarding card on Overview) =====================
  // Lives at the top of the Overview page. Hides itself once all 9 steps are done. Each step's
  // completion is read live from setup state, so jumping into Connection/Settings and back here
  // shows fresh progress (no manual marking). Branch question for payment is inline.
  function paymentBranchQuestion(s) {
    var accounts = s.payment_accounts || [];
    var chip = function (key, label) {
      var on = accounts.indexOf(key) >= 0;
      return '<button class="bc-onb-chip ' + (on ? 'on' : '') + '" data-onb-pay="' + key + '">' + (on ? '✓ ' : '') + t(label) + '</button>';
    };
    var rec = '';
    if (accounts.length === 0) {
      rec = '<div class="bc-onb-rec muted">' + t('Tell us what you have — we’ll recommend the right combo.') + '</div>';
    } else if (accounts.indexOf('none') >= 0) {
      rec = '<div class="bc-onb-rec">' + t('No problem — Airwallex is easiest to apply for. Stripe is fastest in most regions.') + '</div>';
    } else {
      var lines = [];
      if (accounts.indexOf('stripe') >= 0) lines.push('<b>Stripe</b> → ' + t('processes Card · Apple Pay · Google Pay'));
      if (accounts.indexOf('airwallex') >= 0) lines.push('<b>Airwallex</b> → ' + t('processes Card · Apple Pay · Google Pay'));
      if (accounts.indexOf('paypal') >= 0) lines.push('<b>PayPal</b> → ' + t('use PayPal Advanced for Card. Note: PayPal Express wallet is paused for IG/FB compat.'));
      rec = '<div class="bc-onb-rec">' + lines.join('<br>') + '</div>';
    }
    var cta = (accounts.length > 0 && accounts.indexOf('none') < 0)
      ? '<a class="btn btn-primary" href="#/settings/payments">' + t('Connect now') + '</a>'
      : (accounts.indexOf('none') >= 0 ? '<a class="btn btn-default" href="https://airwallex.com" target="_blank">' + t('Apply for Airwallex') + '</a>' : '');
    return '<div class="bc-onb-branch">' +
      '<div class="bc-onb-q">' + t('Which payment accounts do you have?') + '</div>' +
      '<div class="bc-onb-chips">' + chip('stripe', 'Stripe') + chip('airwallex', 'Airwallex') + chip('paypal', 'PayPal') + chip('none', 'None yet') + '</div>' +
      rec + (cta ? '<div style="margin-top:8px">' + cta + '</div>' : '') +
    '</div>';
  }
  function renderOnboardingCard() {
    var p = bcSetupProgress();
    if (p.done >= p.total) return '';            // all 9 done → hide entirely
    var s = p.setup;
    if (s.collapsed) {
      return '<div class="bc-onb bc-onb-collapsed" data-onb="expand">' +
        '<span class="bc-onb-rocket">🚀</span> <b>' + t('Activation progress') + '</b> ' +
        '<span class="bc-onb-meta">' + p.done + '/' + p.total + '</span>' +
        (p.requiredLeft > 0 ? ' · ' + t('Required left') + ': ' + p.requiredLeft : '') +
        '<span class="bc-onb-tog">▼</span>' +
      '</div>';
    }
    var firstPendingIdx = -1;
    for (var i = 0; i < SETUP_STEPS.length; i++) { if (!SETUP_STEPS[i].check(s)) { firstPendingIdx = i; break; } }
    var head =
      '<div class="bc-onb">' +
        '<div class="bc-onb-head">' +
          '<div class="bc-onb-h-l"><span class="bc-onb-rocket">🚀</span> <b>' + t('Get BestCheckout live') + '</b></div>' +
          '<div class="bc-onb-meta">' + p.done + '/' + p.total + ' ' + t('done') + '</div>' +
          '<button class="bc-onb-tog btn btn-default" data-onb="collapse" title="' + t('Collapse') + '">−</button>' +
        '</div>' +
        '<div class="bc-onb-sub">' +
          (p.requiredLeft > 0 ? t('Required to launch') + ': ' + p.requiredLeft + ' ' + t('more steps') : t('All required steps done — your funnel is ready to take orders.')) +
        '</div>' +
        '<div class="bc-onb-bar"><span style="width:' + Math.round(p.done / p.total * 100) + '%"></span></div>';
    var steps = SETUP_STEPS.map(function (st, i) {
      var done = st.check(s);
      var current = !done && i === firstPendingIdx;
      var cls = done ? 'done' : current ? 'current' : 'pending';
      var icon = done ? '✓' : (current ? '◐' : '○');
      var ctaBtn = '';
      if (!done) {
        if (st.custom === 'payment') ctaBtn = paymentBranchQuestion(s);
        else if (st.mark) ctaBtn = '<button class="btn btn-default" data-onb-mark="' + st.mark + '">' + t(st.cta) + '</button>';
        else if (st.hash) ctaBtn = '<a class="btn ' + (current ? 'btn-primary' : 'btn-default') + '" href="' + st.hash + '">' + t(st.cta) + '</a>';
      }
      var optional = !st.required ? ' <span class="bc-onb-opt">' + t('(recommended)') + '</span>' : '';
      return '<div class="bc-onb-step ' + cls + '">' +
        '<div class="bc-onb-step-h">' +
          '<span class="bc-onb-icon">' + icon + '</span>' +
          '<div class="bc-onb-text"><b>' + t(st.label) + '</b>' + optional +
            (st.hint ? '<div class="bc-onb-hint">' + t(st.hint) + '</div>' : '') +
          '</div>' +
          (!current && ctaBtn && !st.custom ? '<div class="bc-onb-actions">' + ctaBtn + '</div>' : '') +
        '</div>' +
        (current && ctaBtn ? '<div class="bc-onb-current-actions">' + ctaBtn + '</div>' : '') +
      '</div>';
    }).join('');
    return head + '<div class="bc-onb-steps">' + steps + '</div></div>';
  }
  function wireOnboardingCard(scope) {
    scope = scope || root;
    scope.querySelectorAll('[data-onb]').forEach(function (b) { b.onclick = function () {
      var s = bcSetup(); s.collapsed = b.getAttribute('data-onb') === 'collapse'; bcSetupSave(s); renderOverview();
    }; });
    scope.querySelectorAll('[data-onb-pay]').forEach(function (b) { b.onclick = function () {
      var key = b.getAttribute('data-onb-pay'); var s = bcSetup(); var accts = s.payment_accounts || [];
      if (key === 'none') { accts = accts.indexOf('none') >= 0 ? [] : ['none']; }
      else { var i = accts.indexOf(key); if (i >= 0) accts.splice(i, 1); else accts = accts.filter(function (x) { return x !== 'none'; }).concat([key]); }
      s.payment_accounts = accts; bcSetupSave(s); renderOverview();
    }; });
    scope.querySelectorAll('[data-onb-mark]').forEach(function (b) { b.onclick = function () {
      var s = bcSetup(); s[b.getAttribute('data-onb-mark')] = true; bcSetupSave(s); toast(t('Marked complete')); renderOverview();
    }; });
  }

  // ===================== OVERVIEW =====================
  function renderOverview() {
    if (!bcConnected()) { if (CF.step === 'done') CF.step = 'store'; renderConnectFlow(); return; }
    const banner = ''; // 一键迁移 (one-click migration) is a Phase-2 unlock, not in 1.0
    const kpis = D.KPIS.map((k) => {
      const dcls = k.delta.trim().charAt(0) === '-' ? (k.good === 'down' ? 'up' : 'down') : 'up';
      return '<div class="panel bc-kpi"><div class="bc-kpi-l">' + esc(k.label) + '</div>' +
        '<div class="bc-kpi-v">' + esc(k.value) + '</div>' +
        '<div class="bc-kpi-row"><span class="bc-delta ' + dcls + '">' + I.up + esc(k.delta) + '</span></div>' +
        '<div class="bc-kpi-s">' + esc(k.sub) + '</div></div>';
    }).join('');
    const recs = D.AI_RECS.map((r) => '<div class="bc-rec ' + r.tone + '"><span class="ic">' + I.ai + '</span>' +
      '<div><div class="t">' + esc(r.title) + '</div><div class="m">' + esc(r.impact) + '</div></div></div>').join('');
    const acts = D.ACTIVITY.map((a) => '<div class="bc-act"><span class="av bc-chip ' + a.tone + '" style="border-radius:50%">' + esc(a.who.charAt(0)) + '</span>' +
      '<div class="at"><b>' + esc(a.who) + '</b> ' + esc(a.what) + '<div class="aw">' + esc(a.when) + '</div></div>' + chip(a.tag, a.tone) + '</div>').join('');

    root.innerHTML = wrap(
      head('Overview') + subnav('') + banner +
      renderOnboardingCard() +
      '<div class="bc-kpis">' + kpis + '</div>' +
      '<div class="bc-grid2">' +
        '<div class="panel card-pad"><div class="card-title" style="margin-bottom:6px">Checkout performance</div>' +
          '<div class="muted" style="font-size:12.5px;margin-bottom:10px">Checkout conversion &amp; orders captured — last 30 days.</div>' +
          '<div id="bc-chart" style="height:300px"></div></div>' +
        '<div class="panel card-pad"><div class="flex items-center justify-between" style="margin-bottom:12px"><div class="card-title">AI recommendations</div><a class="muted" style="font-size:12.5px" href="#/bestcheckout/post-purchase">View all</a></div>' + recs + '</div>' +
      '</div>' +
      '<div class="panel card-pad" style="margin-top:18px"><div class="card-title" style="margin-bottom:6px">Recent high-impact activity</div>' + acts + '</div>'
    );

    setTimeout(() => {
      const el = document.getElementById('bc-chart');
      if (!el || !window.echarts) return;
      chart = window.echarts.init(el);
      chart.setOption({
        grid: { left: 44, right: 48, top: 24, bottom: 30 },
        tooltip: { trigger: 'axis' },
        legend: { data: [t('Checkout conversion'), t('Orders')], right: 0, top: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8, textStyle: { fontSize: 12 } },
        xAxis: { type: 'category', data: D.TREND.dates, axisLine: { lineStyle: { color: '#d8dce2' } }, axisLabel: { fontSize: 11, color: '#8a93a0' } },
        yAxis: [
          { type: 'value', min: 50, max: 70, axisLabel: { formatter: '{value}%', fontSize: 11, color: '#8a93a0' }, splitLine: { lineStyle: { color: '#eef0f3' } } },
          { type: 'value', axisLabel: { fontSize: 11, color: '#8a93a0' }, splitLine: { show: false } },
        ],
        series: [
          { name: t('Orders'), type: 'bar', yAxisIndex: 1, data: D.TREND.orders, barWidth: 14, itemStyle: { color: '#dbe7fb', borderRadius: [3, 3, 0, 0] } },
          { name: t('Checkout conversion'), type: 'line', smooth: true, data: D.TREND.conversion, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2.5, color: '#3b6fd4' }, itemStyle: { color: '#3b6fd4' }, areaStyle: { color: 'rgba(59,111,212,.08)' } },
        ],
      });
    }, 0);
    wireOnboardingCard(root);
  }

  // ===================== CONNECTION HUB (the Shopify bridge — Phase 1 only) =====================
  // Everything a full BestShopio merchant never needs lives here, in one removable place:
  // ① authorization (OAuth)  ② two-way data sync  ③ checkout injection (App Embed)  ④ checkout domain.
  const CSTYLE = '<style>' +
    '.cn-secnav{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 18px}' +
    '.cn-secnav button{font-size:12.5px;color:var(--ink-body);background:var(--panel);border:1px solid var(--hair);border-radius:999px;padding:6px 13px;cursor:pointer}' +
    '.cn-secnav button:hover{border-color:var(--brand);color:var(--brand)}' +
    '.cn-sec{scroll-margin-top:14px;margin-bottom:18px}' +
    '.cn-sec-h{display:flex;align-items:center;gap:9px;margin:0 0 11px}.cn-sec-n{width:25px;height:25px;border-radius:7px;background:#eef4ff;color:var(--brand);font-size:13px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex:none}.cn-sec-t{font-size:15px;font-weight:700;color:var(--ink)}.cn-sec-x{font-size:12px;color:var(--ink-muted)}' +
    '.cn-sb{width:40px;height:40px;border-radius:11px;background:#95bf47;color:#fff;display:inline-flex;align-items:center;justify-content:center;flex:none;font-weight:800}' +
    '.cn-dir{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600}' +
    '.cn-dir.two{color:#2b62d6}.cn-dir.pull{color:#1f8f4e}.cn-dir.push{color:#7b4bd0}' +
    '.cn-ab{display:flex;height:32px;border-radius:9px;overflow:hidden;border:1px solid var(--hair);margin:2px 0 12px}.cn-ab>div{display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}.cn-ab .a{background:#e8f0fe;color:#2b62d6}.cn-ab .b{background:var(--panel);color:var(--ink-muted)}' +
    '.cn-dns{display:grid;grid-template-columns:84px 120px 1fr auto;border:1px solid var(--hair);border-radius:9px;overflow:hidden;font-size:12.5px}.cn-dns>div{padding:9px 11px}.cn-dns .h{background:var(--panel);color:var(--ink-muted);font-weight:600;border-bottom:1px solid var(--hair)}.cn-dns .v{font-family:ui-monospace,Menlo,monospace;color:var(--ink);border-bottom:1px solid var(--hair)}.cn-dns .cp{border-bottom:1px solid var(--hair)}' +
    '.cn-scope{display:flex;gap:12px;padding:9px 0;border-top:1px solid var(--hair)}.cn-scope:first-child{border-top:0}.cn-scope .k{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:var(--ink);min-width:250px;flex:none}.cn-scope .w{font-size:12px;color:var(--ink-muted)}' +
    '.cn-li{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink-body);padding:4px 0}.cn-li svg{color:#1f8f4e;flex:none}' +
    '@media(max-width:760px){.cn-scope{flex-direction:column;gap:2px}.cn-scope .k{min-width:0}.cn-dns{grid-template-columns:1fr 1fr}}' +
  '</style>';
  const dirCell = (e) => e.dir === 'two-way'
    ? '<span class="cn-dir two">⇄ ' + t('Two-way') + '</span>'
    : e.dir === 'pull'
      ? '<span class="cn-dir pull">↓ Shopify → BestShopio</span>'
      : '<span class="cn-dir push">↑ BestShopio → Shopify</span>';
  const sotChip = (s) => chip(s, s === 'BestShopio' ? 'blue' : s === 'Shopify' ? 'green' : 'violet');
  function renderConnect() {
    const C = D.CONNECT;
    const scopes = C.scopes.map((s) => '<div class="cn-scope"><span class="k">' + esc(s.name) + '</span><span class="w">' + t(s.why) + '</span></div>').join('');
    const ents = C.entities.map((e) => '<tr><td style="font-weight:500;color:var(--ink)">' + esc(e.name) + '</td>' +
      '<td>' + dirCell(e) + '</td><td>' + sotChip(e.sot) + '</td>' +
      '<td class="num">' + e.count.toLocaleString() + '</td><td class="muted" style="font-size:12px">' + esc(e.last) + '</td>' +
      '<td>' + chip(e.status, 'green') + '</td></tr>').join('');
    const notes = C.entities.filter((e) => e.note).map((e) => '<div class="bc-note" style="margin-top:8px"><b>' + esc(e.name) + ':</b> ' + t(e.note) + '</div>').join('');
    const hooks = C.webhooks.map((w) => '<div class="bc-act"><span class="av bc-chip green" style="border-radius:50%">' + (w.ok ? '✓' : '!') + '</span><div class="at"><b>' + esc(w.topic) + '</b><div class="aw">' + t('last received') + ' ' + esc(w.last) + '</div></div>' + chip(w.ok ? 'OK' : 'Error', w.ok ? 'green' : 'red') + '</div>').join('');
    const intercept = C.embed.intercept.map((i) => '<div class="cn-li">' + I.check + esc(i) + '</div>').join('');
    const ab = C.embed.ab;

    root.innerHTML = wrap(CSTYLE +
      head('Connection') + subnav('connect') +
      // bridge banner
      '<div class="bc-mig-banner" style="background:linear-gradient(90deg,#fff6e8,#fffaf2);border-color:#f0d49a;margin-bottom:16px"><span class="ic" style="background:#e0900e">' + I.link + '</span>' +
        '<div class="m"><div class="l">' + t('The Shopify bridge') + '</div><div class="d">' + t('Everything on this page connects you to Shopify. A full BestShopio store never sees it — and it all goes away when you migrate.') + '</div></div></div>' +
      // store header
      '<div class="panel card-pad" style="margin-bottom:16px"><div class="flex items-center justify-between" style="flex-wrap:wrap;gap:12px">' +
        '<div class="flex items-center gap-3"><span class="cn-sb">S</span>' +
        '<div><div style="font-size:15px;font-weight:600;color:var(--ink)">' + esc(C.shop) + '　' + chip('Connected', 'green') + '</div>' +
        '<div class="muted" style="font-size:12.5px;margin-top:2px">' + esc(C.plan) + ' · ' + t('Mode') + ': <b>' + esc(C.mode) + '</b> · ' + t('connected since') + ' ' + esc(C.connectedSince) + ' · ' + t('last sync') + ' ' + esc(C.lastSync) + '</div></div></div>' +
        '<div class="flex gap-2"><button class="btn btn-default" data-resync>' + t('Re-sync now') + '</button><button class="btn btn-default" data-disc>' + t('Disconnect') + '</button></div></div></div>' +
      // section nav
      '<div class="cn-secnav">' +
        '<button data-cn="auth">① ' + t('Authorization') + '</button>' +
        '<button data-cn="sync">② ' + t('Data sync') + '</button>' +
        '<button data-cn="inject">③ ' + t('Checkout injection') + '</button>' +
        '<button data-cn="domain">④ ' + t('Checkout domain') + '</button></div>' +

      // ① Authorization
      '<div class="cn-sec" id="cn-auth"><div class="cn-sec-h"><span class="cn-sec-n">1</span><span class="cn-sec-t">' + t('Authorization') + '</span><span class="cn-sec-x">OAuth · custom distribution</span></div>' +
        '<div class="panel card-pad">' +
          '<div class="bc-note" style="margin-bottom:12px">' + t('Installed via a private app (OAuth + Admin API) — no Shopify App Store listing or review. These are the permissions you granted at install:') + '</div>' +
          scopes +
          '<div style="margin-top:14px;display:flex;gap:8px"><button class="btn btn-default" data-reauth>' + t('Re-authorize') + '</button><button class="btn btn-default" data-disc>' + t('Disconnect') + '</button></div>' +
        '</div></div>' +

      // ② Data sync
      '<div class="cn-sec" id="cn-sync"><div class="cn-sec-h"><span class="cn-sec-n">2</span><span class="cn-sec-t">' + t('Data sync') + '</span><span class="cn-sec-x">' + t('two-way · BestShopio is your workspace') + '</span></div>' +
        '<div class="bc-note" style="margin-bottom:12px">' + t('Edit products, collections, discounts and shipping right here in BestShopio — changes sync back to Shopify automatically. Your team moves into BestShopio now, so migrating later is just a domain switch.') + '</div>' +
        '<div class="panel" style="margin-bottom:0"><div style="overflow-x:auto"><table class="tbl" style="min-width:720px"><thead><tr><th>' + t('Entity') + '</th><th style="width:150px">' + t('Direction') + '</th><th style="width:120px">' + t('Source of truth') + '</th><th class="num" style="width:90px">' + t('Items') + '</th><th style="width:110px">' + t('Last sync') + '</th><th style="width:90px">' + t('Status') + '</th></tr></thead><tbody>' + ents + '</tbody></table></div></div>' +
        notes +
        '<div class="panel card-pad" style="margin-top:14px"><div class="card-title" style="margin-bottom:6px">Webhooks</div>' + hooks + '</div>' +
      '</div>' +

      // ③ Checkout injection
      '<div class="cn-sec" id="cn-inject"><div class="cn-sec-h"><span class="cn-sec-n">3</span><span class="cn-sec-t">' + t('Checkout injection') + '</span><span class="cn-sec-x">Theme App Extension (App Embed)</span></div>' +
        '<div class="bc-grid2b">' +
          '<div class="panel card-pad"><div class="flex items-center justify-between" style="margin-bottom:8px"><div class="card-title">App Embed　' + (C.embed.enabled ? chip('Enabled', 'green') : chip('Off', 'gray')) + '</div></div>' +
            '<div class="muted" style="font-size:12.5px;line-height:1.55;margin-bottom:10px">' + t('A one-line App Embed block in your live theme adds a "Checkout" interceptor — no theme code edits, survives theme updates.') + '</div>' +
            '<div class="cn-li">' + I.check + t('Live theme') + ': <b style="color:var(--ink)">' + esc(C.embed.theme) + '</b> · ' + t('last seen') + ' ' + esc(C.embed.lastSeen) + '</div>' +
            '<div class="bc-kpi-s" style="margin:8px 0 4px;font-weight:600;color:var(--ink-muted)">' + t('Intercepts') + '</div>' + intercept +
            '<div style="margin-top:12px"><button class="btn btn-default" data-embed>' + t('Open in Shopify theme editor') + '</button></div></div>' +
          '<div class="panel card-pad"><div class="card-title" style="margin-bottom:8px">A/B ' + t('split') + '</div>' +
            '<div class="muted" style="font-size:12.5px;margin-bottom:6px">' + t('Send a slice of carts to BestCheckout; keep the rest on Shopify as a control. Ramp up as approval & AOV prove out.') + '</div>' +
            '<div class="cn-ab"><div class="a" style="width:' + ab.split + '%">BestCheckout ' + ab.split + '%</div><div class="b" style="width:' + (100 - ab.split) + '%">Shopify ' + (100 - ab.split) + '%</div></div>' +
            '<div class="cn-li" style="color:#2b62d6">→ BestCheckout: <span class="muted">' + esc(ab.sendToBestCheckout) + '</span></div>' +
            '<div class="cn-li" style="color:var(--ink-muted)">→ Shopify: <span class="muted">' + esc(ab.sendToShopify) + '</span></div>' +
            '<div style="margin-top:12px"><button class="btn btn-default" data-ab>' + t('Edit routing rules') + '</button></div></div>' +
        '</div></div>' +

      // ④ Checkout domain
      '<div class="cn-sec" id="cn-domain"><div class="cn-sec-h"><span class="cn-sec-n">4</span><span class="cn-sec-t">' + t('Checkout domain') + '</span><span class="cn-sec-x">Phase 1 · ' + t('replaced by main-domain switch at migration') + '</span></div>' +
        '<div class="panel card-pad">' +
          '<div class="flex items-center justify-between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px"><div style="font-size:14px;font-weight:600;color:var(--ink)">' + esc(C.domain.sub) + '　' + chip('SSL ' + C.domain.ssl, 'green') + '　' + chip(C.domain.status, 'blue') + '</div></div>' +
          '<div class="muted" style="font-size:12.5px;margin-bottom:10px">' + t('Your branded checkout lives on this subdomain. Point one CNAME at us and we issue & renew SSL automatically.') + '</div>' +
          '<div class="cn-dns"><div class="h">' + t('Type') + '</div><div class="h">' + t('Host') + '</div><div class="h">' + t('Value') + '</div><div class="h cp"></div>' +
            '<div class="v">CNAME</div><div class="v">checkout</div><div class="v">' + esc(C.domain.cname) + '</div><div class="cp"><button class="btn btn-default" data-copy style="height:28px;padding:0 10px;font-size:12px">' + t('Copy') + '</button></div></div>' +
          '<div class="bc-note" style="margin-top:12px">' + t('At migration, this subdomain is retired — your main domain points straight at the BestShopio storefront instead. See Migrate.') + '</div>' +
        '</div></div>'
    );
    root.querySelectorAll('[data-cn]').forEach((b) => b.onclick = () => { const el = root.querySelector('#cn-' + b.getAttribute('data-cn')); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    root.querySelectorAll('[data-resync]').forEach((b) => b.onclick = () => toast(t('Queued a full re-sync')));
    // Disconnecting Shopify breaks the entire bridge (sync + order write-back).
    // Styled confirm modal (matches admin visual language + i18n-translatable).
    root.querySelectorAll('[data-disc]').forEach((b) => b.onclick = () => {
      const backdrop = h('<div class="modal-backdrop"></div>');
      const mm = h('<div class="modal" style="width:460px"></div>');
      mm.innerHTML =
        '<div class="modal-head flex items-center justify-between"><span>' + t('Disconnect Shopify') + '</span>' +
          '<span class="drawer-x" data-x style="cursor:pointer"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></span>' +
        '</div>' +
        '<div class="modal-body" style="padding:18px 22px;font-size:13.5px;line-height:1.6;color:var(--ink-body)">' + t('This will stop all data sync (products / discounts / shipping / customers) and order write-back. You will need to re-authorize to reconnect.') + '</div>' +
        '<div class="modal-foot" style="justify-content:flex-end"><div class="flex gap-2">' +
          '<button class="btn btn-default" data-cancel>' + t('Cancel') + '</button>' +
          '<button class="btn" style="background:var(--err);color:#fff" data-ok>' + t('Disconnect') + '</button>' +
        '</div></div>';
      backdrop.appendChild(mm); document.body.appendChild(backdrop);
      const close = () => backdrop.remove();
      mm.querySelector('[data-x]').onclick = close;
      mm.querySelector('[data-cancel]').onclick = close;
      backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
      mm.querySelector('[data-ok]').onclick = () => {
        close();
        setBcConnected(false); CF.step = 'store'; toast(t('Disconnected — reconnect from the start')); location.hash = '#/bestcheckout'; renderOverview();
      };
    });
    const ra = root.querySelector('[data-reauth]'); if (ra) ra.onclick = () => bcModal(t('Re-authorize'),
      '<div class="fab-note">' + t('Re-opens the Shopify OAuth consent screen to refresh the access token and scopes. Your store stays connected — nothing is removed.') + '</div>' +
      '<ul class="bm-scopes"><li>' + t('Two-way sync · products, collections, discounts, shipping') + '</li><li>' + t('Write paid orders back to Shopify') + '</li><li>' + t('Read customers (for the New vs Returning A/B)') + '</li></ul>',
      t('Re-authorize on Shopify'), () => toast(t('Token refreshed · scopes re-granted')));
    const em = root.querySelector('[data-embed]'); if (em) em.onclick = () => bcModal(t('Open in Shopify theme editor'),
      '<div class="fab-note">' + t('Deep-links to Online Store → Themes → Customize → App embeds. Turn the BestCheckout embed on — it intercepts the cart “Checkout” button without editing theme code.') + '</div>' +
      '<div class="bm-embed"><span class="bm-toggle"></span><b>BestCheckout</b> · App embed · <span style="color:#1f8f4e;font-weight:600">' + t('Enabled') + '</span></div>',
      t('Open Shopify'), () => toast(t('Opening Shopify theme editor…')));
    const ab2 = root.querySelector('[data-ab]'); if (ab2) ab2.onclick = () => toast(t('Demo: opens the A/B routing-rule builder'));
    const cp = root.querySelector('[data-copy]'); if (cp) cp.onclick = () => toast(t('Copied'));
  }

  function dispose() { if (chart) { try { chart.dispose(); } catch (e) {} chart = null; } }

  window.VIEWS.bestcheckout = {
    render: function (el, rest) {
      root = el; dispose();
      const sub = String(rest || '').split('/')[0];
      // MVP scope: Payment routing (multi-MID/ATRI) and Reports were cut — payments reuse the
      // merchant's connected PSP (native Settings → Payments); routing is a Phase-2 moat, not MVP.
      if (sub === 'funnel') renderFunnel();
      else if (sub === 'templates') renderTemplates();
      else if (sub === 'connect') renderConnect();
      else if (sub === 'onboarding' || sub === 'setup') { CF.step = 'store'; renderConnectFlow(); } // stable entry for demoing the auth flow, regardless of connected state
      // back-compat: old routes fold into the new IA (Funnel / Templates)
      else if (sub === 'checkout' || sub === 'thankyou') { location.hash = '#/bestcheckout/templates'; return; }
      else if (sub === 'experiments' || sub === 'post-purchase') { location.hash = '#/bestcheckout/funnel'; return; }
      else renderOverview();
      bcI18n(root);
    },
    unmount: function () { dispose(); },
  };
})();
