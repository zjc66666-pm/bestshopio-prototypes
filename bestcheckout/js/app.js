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

  // Funnel page builder (theme-builder-grade) lives in a sibling file, loaded on demand.
  const PB_BASE = (function () { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/app\.js.*$/, '') : 'bestcheckout/js/'; })();
  let _pbP = null;
  function ensurePageBuilder() { if (window.BC_PB) return Promise.resolve(); if (_pbP) return _pbP; _pbP = new Promise(function (res) { var sc = document.createElement('script'); sc.src = PB_BASE + 'pagebuilder.js?v=' + Date.now(); sc.onload = res; sc.onerror = res; document.body.appendChild(sc); }); return _pbP; }

  // Page-design editor (Checkout / Thank-you 装修) — mirrors the production one-page-checkout block model.
  let _dsP = null;
  function ensureDesign() { if (window.BC_DESIGN) return Promise.resolve(); if (_dsP) return _dsP; _dsP = new Promise(function (res) { var sc = document.createElement('script'); sc.src = PB_BASE + 'design.js?v=' + Date.now(); sc.onload = res; sc.onerror = res; document.body.appendChild(sc); }); return _dsP; }
  function renderDesign(pt) {
    if (!window.BC_DESIGN) root.innerHTML = wrap('<div class="placeholder" style="padding:46px;text-align:center;color:var(--ink-muted)">Loading…</div>');
    ensureDesign().then(function () {
      var parts = (location.hash || '').split('/');
      if (parts[1] !== 'bestcheckout' || parts[2] !== pt) return; // route changed while loading
      if (window.BC_DESIGN) window.BC_DESIGN.render(root, pt);
    });
  }
  // Register the BestCheckout sub-menu labels with the runtime-i18n overlay (sidebar is shell-rendered,
  // outside this module's bcI18n scope, so it needs the global DICT to show ZH).
  if (window.I18N && window.I18N.extend) window.I18N.extend({ 'Checkout design': '结账页装修', 'Thank-you design': '致谢页装修', 'Post-purchase': '购后追加', 'Connection': '连接' });

  // ---- i18n (EN / 中文). The module renders English; a post-render DOM pass swaps
  //      exact-match UI strings to 中文 when the admin language is zh. Demo data
  //      (names / products / numbers) isn't in the map, so it stays as-is. ----
  const ZH = {
    'Overview': '总览', 'Payment routing': '支付路由', 'Subscriptions': '订阅', 'Post-purchase': '购后追加', 'Funnel editor': '漏斗编辑器', 'Shopify connect': 'Shopify 接入', 'Reports': '报表',
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
    'Everything on this page connects you to Shopify. A full BestShopio store never sees it — and it all goes away when you migrate.': '本页的一切都用于对接 Shopify。完整的 BestShopio 店铺看不到它——迁移之后整块拆除。',
    'Mode': '模式', 'connected since': '连接于', 'last sync': '上次同步', 'last received': '上次接收',
    'Authorization': '店铺授权', 'Data sync': '数据同步', 'Checkout injection': '结账注入', 'Checkout domain': '结账域名',
    'Installed via a private app (OAuth + Admin API) — no Shopify App Store listing or review. These are the permissions you granted at install:': '通过私有应用安装（OAuth + Admin API）——不上 Shopify App Store、不走审核。你在安装时授予了以下权限：',
    'Two-way sync of products, variants & collections': '双向同步商品、变体与集合', 'Write paid orders back to Shopify to trigger fulfillment': '把已付款订单写回 Shopify 以触发履约',
    'Read inventory — Shopify stays source of truth': '读取库存——库存以 Shopify 为准', 'Two-way sync of discounts': '双向同步促销',
    'Read shipping zones & rates': '读取运费区与费率', 'Two-way sync of customers': '双向同步客户',
    'Re-authorize': '重新授权',
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
    '.bc-flow{display:flex;align-items:stretch;gap:0;flex-wrap:wrap}.bc-step{flex:1;min-width:150px;border:1px solid var(--hair);border-radius:10px;padding:12px 13px;position:relative}' +
    '.bc-step .n{font-size:12px;font-weight:700;color:var(--brand)}.bc-step .o{font-size:12.5px;color:var(--ink);margin-top:4px;line-height:1.4}.bc-step .k{font-size:11px;color:var(--ink-muted);margin-top:6px}' +
    '.bc-arrow{align-self:center;color:var(--ink-muted);padding:0 4px;font-size:18px}' +
    '.bc-note{font-size:12.5px;color:var(--ink-muted);background:var(--panel);border-radius:8px;padding:11px 13px;line-height:1.55}' +
    '.bc-badge-rt{font-size:11px;font-weight:700;color:#b9770e;background:#fef3e0;border-radius:5px;padding:2px 7px;margin-left:8px;vertical-align:middle}' +
    '@media(max-width:1000px){.bc-grid2,.bc-grid2b{grid-template-columns:1fr}}' +
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
  const head = (sub) => '<div class="bc-head"><div class="bc-h1">BestCheckout</div>' +
    '<div class="bc-sub">' + sub + '　·　External checkout on <b>lovocross.myshopify.com</b> · orders write back to Shopify</div></div>';
  const chip = (text, cls) => '<span class="bc-chip ' + cls + '"><span class="d"></span>' + esc(text) + '</span>';
  const wrap = (inner) => '<div class="view-wrap">' + STYLE + inner + '</div>';
  const money = (n) => '$' + Number(n).toFixed(2);

  const statusChip = (s) => ({
    active: chip('Active', 'blue'), trial: chip('Trial', 'amber'), recycle: chip('Recycle', 'amber'),
    cancelled: chip('Cancelled', 'gray'), recycle_failed: chip('Recycle failed', 'red'),
    backup: chip('Backup', 'gray'), on: chip('On', 'green'), off: chip('Off', 'gray'),
  }[s] || chip(s, 'gray'));

  // ============ INSTALL-SCOPE: onboarding wizard + migration (Phase 1 → Phase 2) ============
  const OSTYLE = '<style>' +
    '.bc-ob{max-width:760px;margin:0 auto}.bc-ob-hero{text-align:center;padding:6px 0 22px}.bc-ob-hero h2{font-size:22px;font-weight:700;color:var(--ink)}.bc-ob-hero p{font-size:13.5px;color:var(--ink-muted);margin-top:6px}' +
    '.bc-connect{display:flex;gap:13px;align-items:center;padding:18px;border:1px solid var(--hair);border-radius:12px;margin-bottom:14px}' +
    '.bc-connect .sb{width:42px;height:42px;border-radius:11px;background:#95bf47;color:#fff;display:inline-flex;align-items:center;justify-content:center;flex:none}' +
    '.bc-connect .gi{flex:1;min-width:0}.bc-connect .gi .l{font-size:14px;font-weight:600;color:var(--ink)}.bc-connect .gi .u{display:flex;gap:8px;margin-top:9px}' +
    '.bc-connect .gi input{flex:1;height:36px;border:1px solid var(--ctl);border-radius:8px;padding:0 11px;font-size:13px;background:#fff;color:var(--ink)}' +
    '.bc-step2{display:flex;gap:13px;align-items:flex-start;padding:13px 15px;border:1px solid var(--hair);border-radius:11px;margin-bottom:9px;background:#fff}' +
    '.bc-step2 .sn{width:26px;height:26px;border-radius:50%;background:var(--panel);color:var(--ink-muted);font-size:12.5px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex:none}' +
    '.bc-step2.done .sn{background:#1f8f4e;color:#fff}.bc-step2 .st{flex:1}.bc-step2 .st .l{font-size:13.5px;font-weight:600;color:var(--ink)}.bc-step2 .st .d{font-size:12px;color:var(--ink-muted);margin-top:2px}' +
    '.bc-mig-banner{display:flex;gap:13px;align-items:center;padding:13px 16px;border:1px solid #cdb4f0;background:linear-gradient(90deg,#f6f0fe,#fbf9ff);border-radius:12px;margin-bottom:18px}' +
    '.bc-mig-banner .ic{width:34px;height:34px;border-radius:9px;background:#7b4bd0;color:#fff;display:inline-flex;align-items:center;justify-content:center;flex:none}' +
    '.bc-mig-banner .m{flex:1;min-width:0}.bc-mig-banner .m .l{font-size:13.5px;font-weight:600;color:var(--ink)}.bc-mig-banner .m .d{font-size:12px;color:var(--ink-muted);margin-top:2px}' +
    '.bc-mig{max-width:780px;margin:0 auto}.bc-mig-card{display:flex;gap:14px;padding:16px;border:1px solid var(--hair);border-radius:12px;margin-bottom:11px}' +
    '.bc-mig-card .n{width:30px;height:30px;border-radius:9px;flex:none;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}' +
    '.bc-mig-card.g .n{background:#e7f7ee;color:#1f8f4e}.bc-mig-card.b .n{background:#e8f0fe;color:#2b62d6}.bc-mig-card.a .n{background:#fef3e0;color:#b9770e}' +
    '.bc-mig-card .l{font-size:14px;font-weight:600;color:var(--ink)}.bc-mig-card .d{font-size:12.5px;color:var(--ink-muted);margin-top:3px;line-height:1.55}' +
  '</style>';

  function migrateBanner() {
    return '<div class="bc-mig-banner"><span class="ic">' + I.up + '</span>' +
      '<div class="m"><div class="l">' + t('68% of your orders now run through BestCheckout') + '</div>' +
      '<div class="d">' + t('Bring your whole store onto BestShopio — your data is already here.') + '</div></div>' +
      '<a class="btn btn-primary" href="#/bestcheckout/migrate">' + t('See 1-click migration') + '</a></div>';
  }
  function obStep(n, done, l, d) {
    return '<div class="bc-step2' + (done ? ' done' : '') + '"><span class="sn">' + (done ? '✓' : n) + '</span>' +
      '<div class="st"><div class="l">' + t(l) + '</div><div class="d">' + t(d) + '</div></div></div>';
  }
  // 7-step "Configure your new checkout" wizard (Checkout-Champ-style onboarding)
  const WIZ = { step: 0, platform: 'shopify' };
  const WIZ_STEPS = ['Choose checkout', 'Domain entry', 'Logo', 'Merchant account', 'PayPal account', 'SMTP', 'Fulfillment'];
  const WSTYLE = '<style>' +
    '.bc-ob-hero{text-align:center;padding:6px 0 20px}.bc-ob-hero h2{font-size:22px;font-weight:700;color:var(--ink)}.bc-ob-hero p{font-size:13.5px;color:var(--ink-muted);margin:6px auto 0;max-width:600px}' +
    '.wz{display:grid;grid-template-columns:212px 1fr;gap:18px;max-width:900px;margin:0 auto;align-items:start}' +
    '.wz-nav{border:1px solid var(--hair);border-radius:12px;padding:10px;background:#fff}' +
    '.wz-st{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;font-size:12.5px;color:var(--ink-muted);cursor:pointer}' +
    '.wz-st:hover{background:var(--panel)}.wz-st.on{background:#eef4ff;color:var(--brand);font-weight:700}.wz-st.done{color:var(--ink)}' +
    '.wz-dot{width:22px;height:22px;border-radius:50%;background:var(--panel);color:var(--ink-muted);font-size:11.5px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex:none}' +
    '.wz-st.on .wz-dot{background:var(--brand);color:#fff}.wz-st.done .wz-dot{background:#1f8f4e;color:#fff}' +
    '.wz-body{border:1px solid var(--hair);border-radius:12px;padding:20px;background:#fff;min-height:330px}' +
    '.wz-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}' +
    '.wz-card{border:1px solid var(--hair);border-radius:10px;padding:13px;text-align:center}.wz-card.on{border-color:var(--brand);box-shadow:0 0 0 2px rgba(91,124,250,.15)}' +
    '.wz-cn{font-size:13.5px;font-weight:700;color:var(--ink)}.wz-cd{font-size:11px;color:var(--ink-muted);margin:6px 0 11px;line-height:1.4;min-height:42px}.wz-card .btn{height:30px;font-size:12px;width:100%;padding:0}' +
    '.wz-fl{font-size:12px;color:var(--ink-muted);margin:14px 0 6px;font-weight:600}' +
    '.wz-in{width:100%;height:38px;border:1px solid var(--ctl);border-radius:8px;padding:0 12px;font-size:13px;background:#fff;color:var(--ink)}' +
    '.wz-up{border:1.5px dashed var(--ctl);border-radius:10px;padding:30px;text-align:center;color:var(--ink-muted);font-size:13px;background:var(--panel)}' +
    '.wz-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
    '.wz-foot{display:flex;justify-content:space-between;gap:10px;margin-top:22px}' +
    '@media(max-width:760px){.wz{grid-template-columns:1fr}.wz-cards{grid-template-columns:1fr 1fr}}' +
  '</style>';
  function renderOnboarding() {
    const s = WIZ.step;
    const nav = WIZ_STEPS.map((st, i) => '<div class="wz-st' + (i === s ? ' on' : '') + (i < s ? ' done' : '') + '" data-wstep="' + i + '"><span class="wz-dot">' + (i < s ? '✓' : (i + 1)) + '</span><span>' + t(st) + '</span></div>').join('');
    root.innerHTML = wrap(WSTYLE +
      '<div class="bc-ob-hero"><h2>' + t('Configure your new checkout') + '</h2><p>' + t('Set up your store connection, domain and accounts — your storefront stays on Shopify, orders sync back.') + '</p></div>' +
      '<div class="wz"><div class="wz-nav">' + nav + '</div><div class="wz-body">' + wizContent(s) + '</div></div>');
    wireWizard(); bcI18n(root);
  }
  function wizFoot(last) {
    return '<div class="wz-foot"><button class="btn btn-default" data-wback' + (WIZ.step === 0 ? ' style="visibility:hidden"' : '') + '>' + t('Back') + '</button>' +
      '<button class="btn btn-primary" data-wnext>' + (last ? t('Finish setup') : t('Continue')) + '</button></div>';
  }
  function wizContent(s) {
    if (s === 0) {
      const plats = [['shopify', 'Shopify', 'Route your Shopify cart to BestCheckout for checkout'], ['woo', 'WooCommerce', 'Route your WooCommerce cart to BestCheckout'], ['bigcommerce', 'BigCommerce', 'Route your BigCommerce cart to BestCheckout'], ['other', 'Other', 'Custom / API integration']];
      const cards = plats.map((p) => '<div class="wz-card' + (WIZ.platform === p[0] ? ' on' : '') + '"><div class="wz-cn">' + esc(p[1]) + '</div><div class="wz-cd">' + t(p[2]) + '</div>' +
        '<button class="btn ' + (WIZ.platform === p[0] ? 'btn-primary' : 'btn-default') + '" data-plat="' + p[0] + '">' + (WIZ.platform === p[0] ? t('Selected') : ('+ ' + t('Choose'))) + '</button></div>').join('');
      return '<div class="wz-cards">' + cards + '</div>' +
        '<div class="wz-fl">' + t('Store URL') + '</div><input class="wz-in" value="lovocross.myshopify.com">' +
        '<div class="bc-note" style="margin:12px 0">' + t('Shopify integration uses a private app in your store (OAuth + Admin API). Enter the API key and password below. No Shopify App Store listing or review is involved.') + '</div>' +
        '<div class="wz-grid2"><div><div class="wz-fl">' + t('API Key') + '</div><input class="wz-in"></div><div><div class="wz-fl">' + t('API Password') + '</div><input class="wz-in" type="password"></div></div>' +
        '<div class="wz-foot"><button class="btn btn-default" data-wnext>' + t('Skip Product Sync') + '</button><button class="btn btn-primary" data-wnext>' + t('Sync Products') + '</button></div>';
    }
    if (s === 1) return '<div class="wz-fl">' + t('Funnel domain') + '</div><input class="wz-in" value="funnels.lovocross.com">' +
      '<div class="bc-note" style="margin:12px 0">' + t('Point a subdomain at BestCheckout; we issue and renew SSL automatically.') + '</div>' + wizFoot(false);
    if (s === 2) return '<div class="wz-fl">' + t('Brand logo') + '</div><div class="wz-up">' + t('Drag a logo here, or click to upload (PNG / SVG)') + '</div>' + wizFoot(false);
    if (s === 3) return '<div class="wz-fl">' + t('Gateway') + '</div><select class="wz-in"><option>NMI</option><option>Authorize.Net</option><option>Stripe</option><option>Braintree</option></select>' +
      '<div class="wz-fl">' + t('Merchant ID (MID)') + '</div><input class="wz-in" placeholder="MID-001">' +
      '<div class="bc-note" style="margin-top:12px">' + t('Add more MIDs later in Payment routing to enable multi-MID load balancing and cascade.') + '</div>' + wizFoot(false);
    if (s === 4) return '<div class="wz-fl">' + t('PayPal email') + '</div><input class="wz-in" placeholder="payments@yourstore.com">' +
      '<div style="margin-top:12px"><button class="btn btn-default">' + t('Connect PayPal') + '</button></div>' + wizFoot(false);
    if (s === 5) return '<div class="wz-grid2"><div><div class="wz-fl">' + t('SMTP host') + '</div><input class="wz-in" placeholder="smtp.yourstore.com"></div><div><div class="wz-fl">' + t('Port') + '</div><input class="wz-in" value="587"></div></div>' +
      '<div class="wz-grid2" style="margin-top:4px"><div><div class="wz-fl">' + t('Username') + '</div><input class="wz-in"></div><div><div class="wz-fl">' + t('Password') + '</div><input class="wz-in" type="password"></div></div>' + wizFoot(false);
    return '<div class="wz-fl">' + t('Fulfillment provider') + '</div><select class="wz-in"><option>Bestfulfill (代发 / COD)</option><option>ShipBob</option><option>Manual</option></select>' +
      '<div class="bc-note" style="margin-top:12px">' + t('Orders captured by BestCheckout route to fulfillment and write back to Shopify.') + '</div>' + wizFoot(true);
  }
  function wireWizard() {
    root.querySelectorAll('[data-wstep]').forEach((n) => n.onclick = () => { WIZ.step = +n.getAttribute('data-wstep'); renderOnboarding(); });
    root.querySelectorAll('[data-plat]').forEach((b) => b.onclick = () => { WIZ.platform = b.getAttribute('data-plat'); renderOnboarding(); });
    const back = root.querySelector('[data-wback]'); if (back) back.onclick = () => { if (WIZ.step > 0) { WIZ.step--; renderOnboarding(); } };
    root.querySelectorAll('[data-wnext]').forEach((b) => b.onclick = () => {
      if (WIZ.step >= 6) { setBcConnected(true); WIZ.step = 0; toast(t('Setup complete')); location.hash = '#/bestcheckout'; renderOverview(); return; }
      WIZ.step++; renderOnboarding();
    });
  }
  function renderMigrate() {
    const M = D.MIGRATE;
    const pre = M.preflight.map((p) => '<div class="cn-li">' + I.check + '<b style="color:var(--ink)">' + esc(p.name) + '</b> · ' + esc(p.detail) + '</div>').join('');
    const cards = M.steps.map((s) => '<div class="bc-mig-card ' + s.tone + '"><span class="n">' + esc(s.n) + '</span><div><div class="l">' + t(s.title) + '</div><div class="d">' + t(s.detail) + '</div></div></div>').join('');
    root.innerHTML = wrap(CSTYLE + OSTYLE + head('Migrate to BestShopio') +
      '<div class="bc-mig">' +
        '<a class="btn btn-default" href="#/bestcheckout" style="margin-bottom:14px">' + t('Back to overview') + '</a>' +
        '<div class="bc-mig-banner" style="margin-bottom:16px"><span class="ic">' + I.up + '</span>' +
          '<div class="m"><div class="l">' + t('68% of your orders now run through BestCheckout') + '</div>' +
          '<div class="d">' + t('Ready to make BestShopio your store?') + '</div></div></div>' +
        '<div class="panel card-pad" style="margin-bottom:16px"><div class="card-title" style="margin-bottom:8px">' + t('Pre-flight: your data is already in BestShopio') + '</div>' + pre + '</div>' +
        cards +
        '<div class="bc-note" style="margin:14px 0 18px">' + t('Because you came in through BestCheckout, this is an unlock — not the cold Shopify-to-BestShopio migration. That is the moat a standalone checkout tool can never offer.') + '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-default" data-standup>' + t('Stand up the storefront') + '</button><button class="btn btn-primary" data-golive>' + t('Switch domain & go live on BestShopio') + '</button></div>' +
      '</div>'
    );
    const gl = root.querySelector('[data-golive]');
    if (gl) gl.onclick = function () { toast(t('Demo: opens the domain cut-over wizard — repoint main domain → BestShopio, auto-SSL')); };
    const su = root.querySelector('[data-standup]'); if (su) su.onclick = () => toast(t('Demo: spins up a BestShopio storefront from your synced catalog'));
    bcI18n(root);
  }

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

  // ===================== WELCOME (friendly first-run activation path) =====================
  const ACT_STEPS = [
    { l: 'Connect Shopify & sync your store', d: 'OAuth in one click; we pull products, discounts and shipping.', cta: 'Connect Shopify', action: 'connect' },
    { l: 'Connect your payment accounts',     d: 'Reuse your Airwallex / Stripe / PayPal.' },
    { l: 'Set your checkout domain',          d: 'Point checkout.yourbrand.com at BestCheckout — auto-SSL.' },
    { l: 'Turn on checkout injection',        d: 'Enable the App Embed and start with a small A/B split.' },
    { l: 'Build your first funnel',           d: 'Design checkout + one-click upsell in the editor.' },
    { l: 'Go live',                           d: 'Ramp up traffic; orders write back to Shopify.' },
  ];
  function actChecklist(connected) {
    return ACT_STEPS.map((s, i) => {
      const done = connected && i < 5;
      const active = !connected && i === 0;
      const cta = (active && s.action) ? '<button class="btn btn-primary" data-act="' + s.action + '" style="flex:none">' + t(s.cta) + '</button>' : '';
      return '<div class="bc-step2' + (done ? ' done' : '') + '" style="align-items:center">' +
        '<span class="sn">' + (done ? '✓' : (i + 1)) + '</span>' +
        '<div class="st"><div class="l">' + t(s.l) + '</div><div class="d">' + t(s.d) + '</div></div>' + cta + '</div>';
    }).join('');
  }
  function renderWelcome() {
    root.innerHTML = wrap(OSTYLE + head('Overview') + subnav('') +
      '<div class="bc-ob"><div class="bc-ob-hero"><h2>' + t('Welcome to BestCheckout') + '</h2>' +
        '<p>' + t('Connect your store, sell through your new checkout, and move into BestShopio at your own pace.') + '</p></div>' +
        '<div class="panel card-pad"><div class="card-title" style="margin-bottom:12px">' + t('Your activation path') + '</div>' + actChecklist(false) + '</div></div>');
    const cb = root.querySelector('[data-act="connect"]'); if (cb) cb.onclick = () => { WIZ.step = 0; renderOnboarding(); };
    bcI18n(root);
  }

  // ===================== OVERVIEW =====================
  function renderOverview() {
    if (!bcConnected()) { if (CF.step === 'done') CF.step = 'store'; renderConnectFlow(); return; }
    const banner = ''; // 一键迁移 deferred to Phase 2 (not in 1.0) — migrateBanner()/renderMigrate kept as dead code
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
  }

  // ===================== PAYMENT ROUTING (★) =====================
  function renderRouting() {
    const mids = D.GATEWAYS.map((g) => {
      const left = g.cap ? (g.cap - g.mtd) : null;
      const capCell = g.cap ? (money0(g.mtd) + ' / ' + money0(g.cap)) : (money0(g.mtd) + ' · <span class="muted">no cap</span>');
      return '<tr><td style="font-weight:600;color:var(--ink)">' + esc(g.title) + '<div class="muted" style="font-size:11.5px;font-weight:400">' + esc(g.mid) + '</div></td>' +
        '<td>' + esc(g.processor) + '</td><td class="muted">' + esc(g.category) + '</td>' +
        '<td class="num">' + capCell + '</td>' +
        '<td class="num" style="font-weight:600;color:' + apprColor(g.approval) + '">' + g.approval.toFixed(1) + '%</td>' +
        '<td class="muted" style="font-size:12px">' + g.dr + '% · $' + g.txn.toFixed(2) + ' · $' + g.cbFee + 'cb</td>' +
        '<td class="muted">' + esc(g.cards) + '</td>' +
        '<td>' + statusChip(g.status) + '</td></tr>';
    }).join('');
    const rules = D.ROUTING_RULES.map((r) => '<tr><td style="font-weight:500;color:var(--ink)">' + esc(r.name) + '</td>' +
      '<td>' + chip(r.algorithm, 'blue') + '</td><td class="muted">' + esc(r.cond) + '</td><td class="muted" style="font-size:12px">' + esc(r.cascade) + '</td>' +
      '<td>' + statusChip(r.status) + '</td></tr>').join('');
    const recycle = D.RECYCLE.map((s) => '<tr><td style="font-weight:600">' + esc(s.n) + '</td><td>' + esc(s.wait) + '</td><td class="muted">' + esc(s.reduce) + '</td></tr>').join('');

    root.innerHTML = wrap(
      head('Payment routing') + subnav('routing') +
      '<div class="bc-kpis" style="grid-template-columns:repeat(auto-fit,minmax(168px,1fr))">' +
        kpiMini('Blended approval', '92.4%', '+3.1 pts', 'up') +
        kpiMini('Cascade saves · 30d', '2,914', '+16%', 'up') +
        kpiMini('Recycle saves · 30d', '1,268', '+22%', 'up') +
        kpiMini('Active MIDs', '5 / 6', '1 backup', null) +
      '</div>' +
      '<div class="panel" style="margin-bottom:18px"><div class="card-pad" style="padding-bottom:8px"><div class="flex items-center justify-between"><div class="card-title">Gateways &amp; MIDs <span class="bc-badge-rt">multi-processor</span></div>' +
        '<button class="btn btn-primary" data-add-mid>' + I.plus + 'Add MID</button></div></div>' +
        '<div style="overflow-x:auto"><table class="tbl" style="min-width:980px"><thead><tr><th>MID / gateway</th><th style="width:100px">Processor</th><th style="width:120px">Category</th><th class="num" style="width:170px">MTD / cap</th><th class="num" style="width:90px">Approval</th><th style="width:170px">DR · txn · CB</th><th style="width:120px">Cards</th><th style="width:90px">Status</th></tr></thead><tbody>' + mids + '</tbody></table></div></div>' +
      '<div class="panel" style="margin-bottom:18px"><div class="card-pad" style="padding-bottom:8px"><div class="flex items-center justify-between"><div class="card-title">Routing rules (ATRI)</div><button class="btn btn-default" data-add-rule>' + I.plus + 'New rule</button></div>' +
        '<div class="muted" style="font-size:12.5px;margin-top:4px">For every transaction, rules decide which MID to try — by region / card brand / amount / historical approval — then cascade on soft declines.</div></div>' +
        '<div style="overflow-x:auto"><table class="tbl" style="min-width:760px"><thead><tr><th>Rule</th><th style="width:180px">Algorithm</th><th>Condition</th><th style="width:160px">Cascade</th><th style="width:80px">Status</th></tr></thead><tbody>' + rules + '</tbody></table></div></div>' +
      '<div class="bc-grid2b">' +
        '<div class="panel card-pad"><div class="card-title" style="margin-bottom:8px">Cascade — soft-decline retry</div><div class="bc-note">' + esc(D.CASCADE_NOTE) + '</div>' +
          '<div class="bc-flow" style="margin-top:14px"><div class="bc-step"><div class="n">Try 1</div><div class="o">Best MID by rule</div></div><span class="bc-arrow">→</span><div class="bc-step"><div class="n">Try 2–5</div><div class="o">Next-best MID, never repeat</div></div><span class="bc-arrow">→</span><div class="bc-step"><div class="n">Stop</div><div class="o">Hard decline or 5 tries</div></div></div></div>' +
        '<div class="panel card-pad"><div class="card-title" style="margin-bottom:8px">Recycle — failed-rebill recovery</div>' +
          '<table class="tbl"><thead><tr><th>Attempt</th><th style="width:170px">Wait</th><th>Price</th></tr></thead><tbody>' + recycle + '</tbody></table>' +
          '<div class="bc-note" style="margin-top:10px">' + esc(D.RECYCLE_NOTE) + '</div></div>' +
      '</div>'
    );
    root.querySelector('[data-add-mid]').onclick = () => toast('Demo: opens the “Add MID / gateway” form');
    root.querySelector('[data-add-rule]').onclick = () => toast('Demo: opens the routing-rule builder');
  }
  function money0(n) { return '$' + Number(n).toLocaleString('en-US'); }
  function apprColor(a) { return a >= 93 ? '#1f8f4e' : a >= 90 ? 'var(--ink)' : '#b9770e'; }
  function apprPctColor(a) { return a >= 93 ? '#1f8f4e' : '#b9770e'; }
  function kpiMini(l, v, delta, dir) {
    const d = delta ? '<span class="bc-delta ' + (dir || 'up') + '">' + (dir ? I.up : '') + esc(delta) + '</span>' : '<span class="muted" style="font-size:12px">' + esc(delta || '') + '</span>';
    return '<div class="panel bc-kpi"><div class="bc-kpi-l">' + esc(l) + '</div><div class="bc-kpi-v" style="font-size:23px">' + esc(v) + '</div><div class="bc-kpi-row">' + d + '</div></div>';
  }

  // ===================== SUBSCRIPTIONS =====================
  const SUB = { tab: 'all' };
  function renderSubscriptions() {
    const count = (k) => k === 'all' ? D.SUBSCRIPTIONS.length : D.SUBSCRIPTIONS.filter((s) => s.status === k || (k === 'recycle' && s.status === 'recycle_failed')).length;
    const rows = D.SUBSCRIPTIONS.filter((s) => SUB.tab === 'all' || s.status === SUB.tab || (SUB.tab === 'recycle' && s.status === 'recycle_failed')).map((s) =>
      '<tr><td style="font-weight:500;color:var(--ink)">' + esc(s.customer) + '</td><td>' + esc(s.product) + '</td>' +
      '<td class="muted">' + esc(s.freq) + '</td><td class="num">' + s.cycle + '</td>' +
      '<td class="muted">' + esc(s.nextBill) + '</td><td class="num" style="font-weight:600;color:var(--ink)">' + money(s.amount) + '</td>' +
      '<td>' + statusChip(s.status) + '</td><td class="muted" style="font-size:12px">' + esc(s.mid) + '</td>' +
      '<td style="text-align:center"><button class="btn btn-default" style="height:28px;padding:0 10px;font-size:12px" data-manage="' + s.id + '">Manage</button></td></tr>').join('');
    const tabs = D.SUB_TABS.map((t) => '<div class="tab' + (t.key === SUB.tab ? ' active' : '') + '" data-tab="' + t.key + '">' + t.label + '<span class="count-badge">' + count(t.key) + '</span></div>').join('');
    const profiles = D.SUB_PROFILES.map((p) => '<tr><td style="font-weight:500;color:var(--ink)">' + esc(p.name) + '</td><td class="muted">' + esc(p.product) + '</td><td class="muted" style="font-size:12px">' + esc(p.freqs) + '</td><td>' + chip(p.discount, 'green') + '</td><td class="num">' + p.subs.toLocaleString() + '</td></tr>').join('');
    const churn = D.CHURN_STEPS.map((s, i) => '<div class="bc-step"><div class="n">' + esc(s.step) + '</div><div class="o">' + esc(s.offer) + '</div>' + (s.kept !== '—' ? '<div class="k">kept ' + s.kept + '</div>' : '') + '</div>' + (i < D.CHURN_STEPS.length - 1 ? '<span class="bc-arrow">→</span>' : '')).join('');

    root.innerHTML = wrap(
      head('Subscriptions') + subnav('subscriptions') +
      '<div class="panel" style="margin-bottom:18px"><div class="tabs" style="padding:0 8px" id="sub-tabs">' + tabs + '</div>' +
        '<div style="overflow-x:auto"><table class="tbl" style="min-width:920px"><thead><tr><th>Customer</th><th>Product</th><th style="width:110px">Frequency</th><th class="num" style="width:70px">Cycle</th><th style="width:120px">Next bill</th><th class="num" style="width:90px">Amount</th><th style="width:130px">Status</th><th style="width:110px">Next MID</th><th style="width:90px;text-align:center">Action</th></tr></thead><tbody>' +
          (rows || '<tr><td colspan="9" class="muted" style="text-align:center;padding:36px">No subscriptions in this state.</td></tr>') + '</tbody></table></div></div>' +
      '<div class="bc-grid2b">' +
        '<div class="panel card-pad"><div class="card-title" style="margin-bottom:8px">Subscribe &amp; Save profiles</div>' +
          '<table class="tbl"><thead><tr><th>Profile</th><th>Base product</th><th>Frequencies</th><th style="width:80px">Discount</th><th class="num" style="width:80px">Subs</th></tr></thead><tbody>' + profiles + '</tbody></table></div>' +
        '<div class="panel card-pad"><div class="card-title" style="margin-bottom:4px">Churn-saver — cancel workflow</div>' +
          '<div class="muted" style="font-size:12.5px;margin-bottom:12px">Shown before a cancel completes. Up to 5 steps; the money in subscriptions is in retention, not billing.</div>' +
          '<div class="bc-flow">' + churn + '</div></div>' +
      '</div>'
    );
    root.querySelectorAll('#sub-tabs .tab').forEach((tab) => tab.onclick = () => { SUB.tab = tab.getAttribute('data-tab'); renderSubscriptions(); });
    root.querySelectorAll('[data-manage]').forEach((b) => b.onclick = () => toast('Demo: opens the subscription manager (skip / swap / pause / cancel)'));
    bcI18n(root);
  }

  // ===================== POST-PURCHASE =====================
  function renderPostPurchase() {
    const typeChip = (t) => t === 'Upsell' ? chip('Upsell', 'blue') : t === 'Downsell' ? chip('Downsell', 'violet') : chip('Order bump', 'amber');
    const rows = D.POST_PURCHASE.map((o) => '<tr><td style="font-weight:500;color:var(--ink)">' + esc(o.name) + '</td><td>' + typeChip(o.type) + '</td>' +
      '<td class="muted">' + esc(o.trigger) + '</td><td>' + esc(o.product) + '</td><td class="muted">' + esc(o.discount) + '</td>' +
      '<td class="num" style="font-weight:600;color:var(--ink)">' + esc(o.take) + '</td><td>' + statusChip(o.status) + '</td>' +
      '<td style="text-align:center"><button class="btn btn-default" style="height:28px;padding:0 10px;font-size:12px" data-edit="' + esc(o.name) + '">Edit</button></td></tr>').join('');
    root.innerHTML = wrap(
      head('Post-purchase') + subnav('post-purchase') +
      '<div class="panel card-pad" style="margin-bottom:18px"><div class="card-title" style="margin-bottom:6px">The funnel</div>' +
        '<div class="bc-flow"><div class="bc-step"><div class="n">Checkout</div><div class="o">Single-page · order bump</div></div><span class="bc-arrow">→</span>' +
        '<div class="bc-step"><div class="n">Upsell</div><div class="o">One-click, no re-enter card</div></div><span class="bc-arrow">→</span>' +
        '<div class="bc-step"><div class="n">Downsell</div><div class="o">On decline of the upsell</div></div><span class="bc-arrow">→</span>' +
        '<div class="bc-step"><div class="n">Thank you</div><div class="o">Write order back to Shopify</div></div></div></div>' +
      '<div class="panel"><div class="card-pad" style="padding-bottom:8px"><div class="flex items-center justify-between"><div class="card-title">Offers</div><button class="btn btn-primary" data-new-offer>' + I.plus + 'New offer</button></div></div>' +
        '<div style="overflow-x:auto"><table class="tbl" style="min-width:820px"><thead><tr><th>Offer</th><th style="width:120px">Type</th><th style="width:150px">Trigger</th><th>Product</th><th style="width:90px">Discount</th><th class="num" style="width:90px">Take rate</th><th style="width:80px">Status</th><th style="width:80px;text-align:center">Action</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>'
    );
    root.querySelector('[data-new-offer]').onclick = () => toast('Demo: opens the offer builder');
    root.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => toast('Demo: edit “' + b.getAttribute('data-edit') + '”'));
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
    root.querySelectorAll('[data-disc]').forEach((b) => b.onclick = () => { setBcConnected(false); CF.step = 'store'; toast(t('Disconnected — reconnect from the start')); location.hash = '#/bestcheckout'; renderOverview(); });
    const ra = root.querySelector('[data-reauth]'); if (ra) ra.onclick = () => toast(t('Demo: re-opens the Shopify OAuth consent screen'));
    const em = root.querySelector('[data-embed]'); if (em) em.onclick = () => toast(t('Demo: deep-links to Online Store → Themes → Customize → App embeds'));
    const ab2 = root.querySelector('[data-ab]'); if (ab2) ab2.onclick = () => toast(t('Demo: opens the A/B routing-rule builder'));
    const cp = root.querySelector('[data-copy]'); if (cp) cp.onclick = () => toast(t('Copied'));
  }

  // ===================== REPORTS =====================
  function renderReports() {
    const ret = D.RETENTION.map((r) => '<tr><td style="font-weight:600;color:var(--ink)">' + esc(r.cycle) + '</td>' +
      '<td class="num">' + r.attempted.toLocaleString() + '</td><td class="num">' + r.approvals.toLocaleString() + '</td>' +
      '<td class="num" style="color:#1f8f4e">' + (r.recycleSave ? '+' + r.recycleSave : '—') + '</td>' +
      '<td class="num" style="font-weight:600;color:var(--ink)">' + esc(r.retention) + '</td><td class="num">' + esc(r.net) + '</td></tr>').join('');
    const bins = D.CARD_BIN.map((b) => '<tr><td style="font-weight:600">' + esc(b.bin) + '</td><td>' + esc(b.brand) + '</td><td class="muted">' + esc(b.bank) + '</td>' +
      '<td class="num">' + esc(b.approval) + '</td><td class="num muted">' + esc(b.rb) + '</td><td class="num">' + esc(b.cb) + '</td>' +
      '<td class="num" style="font-weight:600;color:var(--ink)">' + esc(b.overall) + '</td></tr>').join('');
    root.innerHTML = wrap(
      head('Reports') + subnav('reports') +
      '<div class="panel" style="margin-bottom:18px"><div class="card-pad" style="padding-bottom:8px"><div class="card-title">Retention — cycle by cycle</div>' +
        '<div class="muted" style="font-size:12.5px;margin-top:4px">Recurring offers, by billing cycle. Approvals include recycle saves; AVG LTV builds across cycles.</div></div>' +
        '<table class="tbl"><thead><tr><th>Cycle</th><th class="num" style="width:120px">Attempted</th><th class="num" style="width:120px">Approvals</th><th class="num" style="width:130px">Recycle saves</th><th class="num" style="width:110px">Retention</th><th class="num" style="width:130px">Net</th></tr></thead><tbody>' + ret + '</tbody></table></div>' +
      '<div class="panel"><div class="card-pad" style="padding-bottom:8px"><div class="card-title">Card processing — by BIN</div>' +
        '<div class="muted" style="font-size:12.5px;margin-top:4px">Approval by issuing bank / BIN drives the BIN-routing rules. Overall = (new-sale approval + rebill approval) / 2.</div></div>' +
        '<table class="tbl"><thead><tr><th>BIN</th><th style="width:110px">Brand</th><th>Issuer</th><th class="num" style="width:100px">Approval</th><th class="num" style="width:110px">Rebill appr.</th><th class="num" style="width:90px">CB %</th><th class="num" style="width:100px">Overall</th></tr></thead><tbody>' + bins + '</tbody></table></div>'
    );
  }

  // ===================== FUNNEL EDITOR =====================
  const FICO = {
    landing:  svg('<path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10h14V10"/>', 16),
    checkout: svg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', 16),
    upsell:   svg('<path d="M12 19V5M5 12l7-7 7 7"/>', 16),
    downsell: svg('<path d="M12 5v14M5 12l7 7 7-7"/>', 16),
    bump:     svg('<path d="M12 5v14M5 12h14"/>', 16),
    thankyou: svg('<path d="M20 6 9 17l-5-5"/>', 16),
    survey:   svg('<path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', 16),
    generic:  svg('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>', 16),
  };
  const EICO = {
    grip: svg('<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>', 16),
    edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 14),
    up:   svg('<path d="m18 15-6-6-6 6"/>', 15),
    down: svg('<path d="m6 9 6 6 6-6"/>', 15),
    trash:svg('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>', 14),
    back: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 16),
  };
  const ESTYLE = '<style>' +
    '.bc-ed{display:grid;grid-template-columns:240px 1fr;gap:16px;align-items:start}.bc-edp{padding:16px}' +
    '.bc-ct2{font-size:13px;font-weight:600;color:var(--ink);margin-bottom:12px}' +
    '.bc-pal{display:flex;align-items:center;gap:9px;width:100%;padding:10px 12px;border:1px solid var(--hair);border-radius:9px;margin-bottom:9px;cursor:pointer;font-size:13px;color:var(--ink);background:#fff;text-align:left}' +
    '.bc-pal:hover{border-color:var(--brand);background:var(--panel)}.bc-pal .pi{width:26px;height:26px;border-radius:7px;background:var(--panel);display:inline-flex;align-items:center;justify-content:center;color:var(--ink-muted);flex:none}.bc-pal .add{margin-left:auto;color:var(--brand);font-weight:700;font-size:17px;line-height:1}' +
    '.bc-funnel{display:flex;flex-direction:column;align-items:center;padding:4px 0}' +
    '.bc-fstep{display:flex;align-items:center;gap:11px;width:100%;max-width:540px;padding:12px 14px;border:1px solid var(--hair);border-radius:11px;background:#fff;transition:box-shadow .12s,border-color .12s}.bc-fstep.locked{background:var(--panel)}.bc-fstep.drag{opacity:.4}' +
    '.bc-fstep .grip{color:#c4cad2;cursor:grab;display:inline-flex;flex:none}.bc-fstep .grip.locked{cursor:default;opacity:.35}' +
    '.bc-fstep .ic{width:32px;height:32px;border-radius:9px;background:var(--panel);display:inline-flex;align-items:center;justify-content:center;color:var(--brand);flex:none}' +
    '.bc-fstep .m{flex:1;min-width:0}.bc-fstep .n{font-size:13.5px;font-weight:600;color:var(--ink)}.bc-fstep .s{font-size:12px;color:var(--ink-muted);margin-top:2px}' +
    '.bc-fstep .ed{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 12px;border:1px solid var(--ctl);border-radius:8px;background:#fff;color:var(--ink);font-size:12.5px;font-weight:600;cursor:pointer}.bc-fstep .ed:hover{border-color:var(--brand);color:var(--brand)}.bc-fstep .ed svg{width:14px;height:14px}' +
    '.bc-fstep .lk{font-size:11px;color:var(--ink-muted);font-weight:600;border:1px solid var(--hair);border-radius:5px;padding:2px 8px}' +
    '.bc-fstep .rm{border:0;background:none;color:var(--ink-muted);cursor:pointer;font-size:18px;line-height:1;padding:2px 7px;border-radius:6px}.bc-fstep .rm:hover{background:#fdecec;color:#c0392b}' +
    '.bc-fconn{width:2px;height:18px;background:var(--hair)}' +
    '.bc-pe-top{display:flex;align-items:center;gap:14px;margin-bottom:14px}.bc-pe-name{font-size:15px;font-weight:700;color:var(--ink);flex:1}.bc-pe-name .lk{font-size:11px;color:var(--ink-muted);font-weight:600;border:1px solid var(--hair);border-radius:5px;padding:2px 8px;margin-left:8px}' +
    '.bc-pe{display:grid;grid-template-columns:228px 1fr 288px;gap:16px;align-items:start}' +
    '.bc-blklist{display:flex;flex-direction:column;gap:6px}' +
    '.bc-blk{display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid var(--hair);border-radius:9px;cursor:pointer;background:#fff}.bc-blk:hover{border-color:var(--brand)}.bc-blk.sel{border-color:var(--brand);background:var(--panel)}.bc-blk .bn{flex:1;font-size:13px;color:var(--ink);font-weight:500}.bc-blk .ba{display:flex;gap:1px}' +
    '.bc-blk .ba button{border:0;background:none;color:var(--ink-muted);cursor:pointer;padding:3px;border-radius:6px;display:inline-flex}.bc-blk .ba button:hover:not([disabled]){background:var(--panel);color:var(--ink)}.bc-blk .ba button[disabled]{opacity:.3;cursor:default}' +
    '.bc-addgrid{display:flex;flex-wrap:wrap;gap:6px}.bc-addchip{border:1px dashed var(--ctl);border-radius:8px;background:#fff;color:var(--ink-muted);font-size:12px;padding:5px 9px;cursor:pointer}.bc-addchip:hover{border-color:var(--brand);color:var(--brand)}' +
    '.bc-canvas-wrap{padding:18px;display:flex;justify-content:center;background:var(--panel)}.bc-phone{width:380px;max-width:100%;background:#fff;border:1px solid var(--hair);border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(20,30,50,.08)}' +
    '.bc-pb{position:relative;cursor:pointer;border:2px solid transparent}.bc-pb:hover{border-color:rgba(91,124,250,.3)}.bc-pb.sel{border-color:var(--brand)}.bc-pb-empty{padding:50px 20px;text-align:center;color:var(--ink-muted);font-size:13px}' +
    '.pv-hero{padding:28px 20px;text-align:center;background:linear-gradient(135deg,#eef2fb,#f7f9fd)}.pv-h1{font-size:20px;font-weight:800;color:#1a2233}.pv-sub{font-size:13px;color:#5b6470;margin:6px 0 14px}' +
    '.pv-h2{padding:16px 18px;font-size:17px;font-weight:700;color:#1a2233;text-align:center}.pv-txt{padding:12px 18px;font-size:13px;color:#5b6470;line-height:1.6}' +
    '.pv-img{margin:14px 18px;height:120px;border-radius:10px;background:#e9edf3}' +
    '.pv-prod{padding:16px 18px;text-align:center}.pv-pimg{height:120px;border-radius:10px;background:#e9edf3;margin-bottom:10px}.pv-pn{font-size:14px;font-weight:600;color:#1a2233}.pv-pp{font-size:15px;margin-top:4px;color:#1a2233}.pv-pp s{color:#9aa3ad;font-weight:400;margin-left:6px}' +
    '.pv-btn{display:inline-flex;align-items:center;justify-content:center;background:#3b6fd4;color:#fff;font-size:13.5px;font-weight:600;border-radius:9px;padding:11px 20px;margin:6px auto}' +
    '.pv-yn{padding:14px 18px;display:flex;flex-direction:column;align-items:center;gap:10px}.pv-btn.full{width:100%;padding:13px}.pv-no{font-size:12.5px;color:#9aa3ad;text-decoration:underline}' +
    '.pv-bump{margin:12px 18px;padding:12px;border:1.5px dashed #c7d2e8;border-radius:10px;display:flex;align-items:center;gap:11px;background:#f7faff}.pv-cb{width:18px;height:18px;border:2px solid #3b6fd4;border-radius:5px;flex:none}.pv-bt{font-size:13px;font-weight:600;color:#1a2233}.pv-bp{font-size:12px;color:#3b6fd4;font-weight:600}' +
    '.pv-timer{margin:10px 18px;padding:9px;text-align:center;background:#fff3e0;color:#b9770e;border-radius:8px;font-size:12.5px;font-weight:600}' +
    '.pv-rev{padding:10px 18px;text-align:center;color:#f5b301;font-size:13px;font-weight:600;letter-spacing:1px}' +
    '.pv-feat{padding:14px 18px}.pv-ft{font-size:14px;font-weight:700;text-align:center;color:#1a2233;margin-bottom:10px}.pv-fl{display:flex;gap:8px;justify-content:center}.pv-fl span{width:54px;height:46px;border-radius:9px;background:#eef2f7}' +
    '.pv-logo{padding:14px;text-align:center;font-size:16px;font-weight:800;color:#1a2233;border-bottom:1px solid #eef0f3}' +
    '.pv-form{padding:12px 18px}.pv-fl2{font-size:12.5px;font-weight:700;color:#1a2233;margin-bottom:8px}.pv-input{height:34px;border:1px solid #e3e7ee;border-radius:8px;margin-bottom:8px;background:#fafbfd}' +
    '.pv-cart{padding:12px 18px;background:#fafbfd}.pv-row{display:flex;justify-content:space-between;font-size:12.5px;color:#5b6470;padding:3px 0}.pv-row.total{font-weight:700;color:#1a2233;border-top:1px solid #e3e7ee;margin-top:6px;padding-top:8px}' +
    '.pv-track{padding:14px 18px}.pv-tbar{height:6px;border-radius:999px;background:linear-gradient(90deg,#3b6fd4 55%,#e3e7ee 55%)}' +
    '.bc-set .fld{margin-bottom:13px}.bc-set .fl{font-size:12px;color:var(--ink-muted);margin-bottom:5px;display:block}.bc-set .fi{width:100%;height:34px;border:1px solid var(--ctl);border-radius:8px;padding:0 11px;font-size:13px;color:var(--ink);background:#fff}' +
    '@media(max-width:1100px){.bc-ed,.bc-pe{grid-template-columns:1fr}}' +
  '</style>';

  // editor has two levels: funnel flow (overview) -> page editor (one step's blocks)
  function renderEditor() {
    const stepId = (location.hash || '').split('/')[3] || '';
    if (stepId && D.FUNNEL.steps.some((s) => s.id === stepId)) renderPageEditor(stepId);
    else renderVisualizer();
  }

  // ===================== FUNNEL VISUALIZER (Checkout-Champ-style node graph) =====================
  const NODE_W = 168, NODE_H = 122;
  const FB = { selEdge: null, selNode: null, connectFrom: null, zoom: 100 };
  function pageIcon(type) { return FICO[type] || FICO[{ lead: 'landing', presell: 'landing' }[type]] || FICO.generic; }
  function pageThumb(node) {
    const ty = node.type;
    if (ty === 'checkout') return '<div class="thb"><div class="bar t"></div><div class="row"><div class="bar"></div><div class="bar"></div></div><div class="bar"></div><div class="img" style="flex:0 0 16px"></div></div>';
    if (ty === 'upsell' || ty === 'downsell') return '<div class="thb"><div class="bar t" style="margin:0 auto"></div><div class="img"></div><div class="bar" style="background:#3b6fd4;height:10px"></div></div>';
    if (ty === 'thankyou') return '<div class="thb"><div class="chk"></div><div class="bar s" style="margin:0 auto"></div><div class="bar"></div><div class="bar s"></div></div>';
    return '<div class="thb"><div class="img"></div><div class="bar t"></div><div class="bar s"></div></div>';
  }
  const VSTYLE = '<style>' +
    '.fb{display:flex;flex-direction:column;height:calc(100vh - 232px);min-height:540px;border:1px solid var(--hair);border-radius:12px;overflow:hidden;background:#fff}' +
    '.fb-bar{display:flex;align-items:center;gap:7px;padding:8px 12px;border-bottom:1px solid var(--hair);background:var(--panel);flex-wrap:wrap}' +
    '.fb-name{font-size:13.5px;font-weight:700;color:var(--ink);margin-right:2px}' +
    '.fb-bar .btn{height:30px;padding:0 11px;font-size:12.5px}' +
    '.fb-dom{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-muted);border:1px solid var(--ctl);border-radius:8px;padding:4px 9px;background:#fff}.fb-dom svg{width:13px;height:13px}' +
    '.fb-zoom{display:flex;align-items:center;gap:7px;margin-left:auto;font-size:12px;color:var(--ink-muted)}' +
    '.fb-zoom button{width:24px;height:24px;border:1px solid var(--ctl);border-radius:6px;background:#fff;cursor:pointer;font-size:14px;line-height:1}' +
    '.fb-body{display:flex;flex:1;min-height:0}' +
    '.fb-rail{width:122px;flex:none;border-right:1px solid var(--hair);padding:10px 9px;overflow:auto;background:#fff}' +
    '.fb-rail .rl{font-size:10.5px;font-weight:700;color:var(--ink-muted);text-transform:uppercase;letter-spacing:.4px;margin:2px 2px 9px}' +
    '.fb-pt{border:1px solid var(--hair);border-radius:9px;padding:7px;margin-bottom:8px;cursor:pointer;background:#fff;text-align:center}' +
    '.fb-pt:hover{border-color:var(--brand);box-shadow:0 0 0 2px rgba(91,124,250,.12)}' +
    '.fb-pt .tn{height:44px;border-radius:6px;background:var(--panel);margin-bottom:6px;overflow:hidden;padding:5px}' +
    '.fb-pt .nm{font-size:10.5px;color:var(--ink);font-weight:600;line-height:1.2}' +
    '.fb-canvas-wrap{flex:1;overflow:auto;background:#fafbfc;position:relative;background-image:radial-gradient(#dde2ea 1px,transparent 1px);background-size:18px 18px}' +
    '.fb-canvas{position:relative;transform-origin:0 0}' +
    '.fbedges{position:absolute;left:0;top:0;pointer-events:none}.fbedges path.hit{pointer-events:stroke;cursor:pointer}' +
    '.fbnode{position:absolute;width:' + NODE_W + 'px;background:#fff;border:1.5px solid #cfd6e4;border-radius:10px;box-shadow:0 2px 8px rgba(20,30,50,.06)}' +
    '.fbnode.sel{border-color:var(--brand);box-shadow:0 0 0 3px rgba(91,124,250,.2)}' +
    '.fb-canvas.fb-connecting .fbnode{cursor:pointer;border-style:dashed}' +
    '.fbnode-h{display:flex;align-items:center;gap:6px;padding:7px 9px;border-bottom:1px solid #eef0f3;cursor:grab;font-size:12px;font-weight:700;color:var(--ink)}' +
    '.fbnode-h .pi{display:inline-flex;color:var(--brand)}.fbnode-h .pi svg{width:14px;height:14px}' +
    '.fbnode-h .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.fbnode-acts{display:none;gap:1px}.fbnode:hover .fbnode-acts,.fbnode.sel .fbnode-acts{display:flex}' +
    '.fbnode-acts button{border:0;background:none;cursor:pointer;color:var(--ink-muted);padding:2px;border-radius:5px;display:inline-flex}.fbnode-acts button:hover{background:var(--panel);color:var(--ink)}.fbnode-acts svg{width:13px;height:13px}' +
    '.fbnode-thumb{height:78px;padding:8px;overflow:hidden}' +
    '.fbnode-port{position:absolute;right:-10px;top:50%;transform:translateY(-50%);width:19px;height:19px;border-radius:50%;background:#fff;border:2px solid var(--brand);color:var(--brand);font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:crosshair;line-height:1}' +
    '.fbnode-port:hover{background:var(--brand);color:#fff}' +
    '.fb-lockbadge{font-size:9.5px;font-weight:700;color:var(--ink-muted);background:var(--panel);border-radius:4px;padding:1px 5px}' +
    '.thb{display:flex;flex-direction:column;gap:4px;height:100%}.thb .bar{height:6px;border-radius:3px;background:#e7ebf1}.thb .bar.s{width:60%}.thb .bar.t{height:10px;width:72%;border-radius:4px;background:#3b6fd4}' +
    '.thb .img{flex:1;border-radius:4px;background:#e3e8ef;min-height:14px}.thb .row{display:flex;gap:4px}.thb .row .bar{flex:1}.thb .chk{width:15px;height:15px;border-radius:50%;background:#2faa5e;margin:1px auto 2px}' +
    '.fb-side{width:286px;flex:none;border-left:1px solid var(--hair);padding:14px;overflow:auto;background:#fff}' +
    '.fb-side .st{font-size:13px;font-weight:700;color:var(--ink);margin-bottom:4px}.fb-side .sh{font-size:11.5px;color:var(--ink-muted);margin-bottom:8px;line-height:1.5}' +
    '.fb-fl{font-size:11.5px;color:var(--ink-muted);margin:14px 0 6px;font-weight:600}' +
    '.fb-chip{display:inline-flex;align-items:center;gap:6px;background:#fdecd9;color:#c8691a;border-radius:7px;padding:5px 9px;font-size:12px;font-weight:600;margin:0 6px 6px 0}' +
    '.fb-chip.o{background:#e8f0fe;color:#2b62d6}.fb-chip button{border:0;background:none;color:inherit;cursor:pointer;font-size:13px;line-height:1;padding:0}' +
    '.fb-in{width:100%;height:32px;border:1px solid var(--ctl);border-radius:8px;padding:0 10px;font-size:12.5px;background:#fff;color:var(--ink)}' +
    '.fb-sel{width:100%;height:34px;border:1px solid var(--ctl);border-radius:8px;padding:0 9px;font-size:12.5px;background:#fff;color:var(--ink)}' +
    '.fb-tog{display:flex;align-items:center;gap:9px;font-size:12px;color:var(--ink);margin:10px 0;cursor:pointer}' +
    '.fb-tog .sw{width:34px;height:19px;border-radius:999px;background:#d6dbe3;position:relative;flex:none;transition:background .15s}' +
    '.fb-tog .sw::after{content:"";position:absolute;left:2px;top:2px;width:15px;height:15px;border-radius:50%;background:#fff;transition:left .15s}' +
    '.fb-tog.on .sw{background:var(--brand)}.fb-tog.on .sw::after{left:17px}' +
  '</style>';

  function renderVisualizer() {
    const F = D.FUNNEL;
    if (FB.selEdge && !F.edges.some((e) => e.id === FB.selEdge)) FB.selEdge = null;
    if (FB.selNode && !F.steps.some((n) => n.id === FB.selNode)) FB.selNode = null;
    const rail = '<div class="rl">' + t('Page types') + '</div>' + F.palette.map((p) =>
      '<div class="fb-pt" data-ptype="' + p.type + '"><div class="tn">' + pageThumb({ type: p.type }) + '</div><div class="nm">' + esc(p.name) + '</div></div>').join('');
    const nodes = F.steps.map((n) => '<div class="fbnode ' + n.type + (n.locked ? ' lk' : '') + (n.id === FB.selNode ? ' sel' : '') + '" data-nid="' + n.id + '" style="left:' + n.x + 'px;top:' + n.y + 'px">' +
      '<div class="fbnode-h"><span class="pi">' + pageIcon(n.type) + '</span><span class="nm">' + esc(n.name) + '</span>' + (n.locked ? '<span class="fb-lockbadge">' + t('Locked') + '</span>' : '') +
      '<span class="fbnode-acts"><button data-edit title="Edit page">' + EICO.edit + '</button>' + (n.locked ? '' : '<button data-del title="Delete">' + EICO.trash + '</button>') + '</span></div>' +
      '<div class="fbnode-thumb">' + pageThumb(n) + '</div>' +
      '<span class="fbnode-port" data-port title="Click, then click another page to connect">+</span></div>').join('');
    const toolbar = '<div class="fb-bar"><span class="fb-name">' + esc(F.name) + '</span>' +
      '<button class="btn btn-default" data-tb="Settings">' + t('Settings') + '</button>' +
      '<button class="btn btn-default" data-tb="A/B test">A / B</button>' +
      '<span class="fb-dom">' + I.link + esc(F.domain) + '</span>' +
      '<button class="btn btn-default" data-tb="Options">' + t('Options') + '</button>' +
      '<button class="btn btn-default" data-tb="Analytics">' + t('Analytics') + '</button>' +
      '<button class="btn btn-primary" data-tb="Published">' + t('Publish') + '</button>' +
      '<button class="btn btn-default" data-tb="Opening live site">' + t('Live site') + '</button>' +
      '<span class="fb-zoom"><button data-zoom="-">−</button><span class="zl">' + FB.zoom + '%</span><button data-zoom="+">+</button></span></div>';
    const side = FB.selEdge ? edgePanel(F.edges.find((e) => e.id === FB.selEdge)) : (FB.selNode ? nodePanel(F.steps.find((n) => n.id === FB.selNode)) : hintPanel());
    root.innerHTML = wrap(head('Funnel editor') + subnav('editor') + VSTYLE +
      '<div class="fb">' + toolbar +
        '<div class="fb-body">' +
          '<div class="fb-rail">' + rail + '</div>' +
          '<div class="fb-canvas-wrap" id="fbwrap"><div class="fb-canvas" id="fbcanvas"><svg class="fbedges"></svg>' + nodes + '</div></div>' +
          '<div class="fb-side" id="fbside">' + side + '</div>' +
        '</div></div>');
    drawEdges(); wireVisualizer(); bcI18n(root);
  }
  function edgePathD(a, b) {
    const sx = a.x + NODE_W, sy = a.y + NODE_H / 2, tx = b.x, ty = b.y + NODE_H / 2;
    const dx = Math.max(46, Math.abs(tx - sx) / 2);
    return 'M' + sx + ',' + sy + ' C' + (sx + dx) + ',' + sy + ' ' + (tx - dx) + ',' + ty + ' ' + tx + ',' + ty;
  }
  function drawEdges() {
    const F = D.FUNNEL, byId = {}; F.steps.forEach((n) => byId[n.id] = n);
    const W = Math.max.apply(null, F.steps.map((n) => n.x)) + NODE_W + 90;
    const H = Math.max.apply(null, F.steps.map((n) => n.y)) + NODE_H + 90;
    const canvas = root.querySelector('#fbcanvas'); if (canvas) { canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; }
    const svg = root.querySelector('.fbedges'); if (!svg) return;
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    let inner = '<defs><marker id="fbah" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#7d8796"/></marker>' +
      '<marker id="fbahs" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#3b6fd4"/></marker></defs>';
    F.edges.forEach((e) => {
      const a = byId[e.from], b = byId[e.to]; if (!a || !b) return;
      const d = edgePathD(a, b), seld = e.id === FB.selEdge;
      const col = seld ? '#3b6fd4' : (e.customers === 'new' ? '#2faa5e' : (e.customers === 'repeat' ? '#b9770e' : '#9aa3ad'));
      inner += '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (seld ? 2.6 : 1.8) + '" marker-end="url(#' + (seld ? 'fbahs' : 'fbah') + ')"/>';
      inner += '<path class="hit" data-eid="' + e.id + '" d="' + d + '" fill="none" stroke="transparent" stroke-width="16"/>';
      if (e.customers !== 'all') {
        const mx = (a.x + NODE_W + b.x) / 2, my = (a.y + b.y) / 2 + NODE_H / 2;
        const lab = e.customers === 'new' ? t('New') : t('Repeat');
        inner += '<rect x="' + (mx - 28) + '" y="' + (my - 9) + '" width="56" height="18" rx="9" fill="' + (e.customers === 'new' ? '#e7f7ee' : '#fef3e0') + '"/>' +
          '<text x="' + mx + '" y="' + (my + 4) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + (e.customers === 'new' ? '#1f8f4e' : '#b9770e') + '">' + lab + '</text>';
      }
    });
    svg.innerHTML = inner;
    svg.querySelectorAll('path.hit').forEach((p) => p.addEventListener('click', (ev) => { ev.stopPropagation(); selectEdge(p.getAttribute('data-eid')); }));
  }
  function setSide(html) { const s = root.querySelector('#fbside'); if (!s) return; s.innerHTML = html; wireSidePanel(); bcI18n(s); }
  function selectNode(id) { FB.selNode = id; FB.selEdge = null; root.querySelectorAll('.fbnode').forEach((n) => n.classList.toggle('sel', n.getAttribute('data-nid') === id)); setSide(nodePanel(D.FUNNEL.steps.find((n) => n.id === id))); drawEdges(); }
  function selectEdge(id) { FB.selEdge = id; FB.selNode = null; root.querySelectorAll('.fbnode').forEach((n) => n.classList.remove('sel')); setSide(edgePanel(D.FUNNEL.edges.find((e) => e.id === id))); drawEdges(); }
  function hintPanel() {
    return '<div class="st">' + t('Funnel visualizer') + '</div><div class="sh">' + t('Click a page to select it; its Edit button opens the page builder. Click an arrow to set its routing (button, dynamic upsells, country, new vs repeat customer). Click a page type on the left to add a page; use the + on a page, then click another page, to connect them.') + '</div>';
  }
  function nodePanel(n) {
    if (!n) return hintPanel();
    return '<div class="st">' + t('Page') + '</div>' +
      '<div class="fb-fl">' + t('Page name') + '</div><input class="fb-in" id="fb-nname" value="' + esc(n.name) + '">' +
      '<div class="fb-fl">' + t('Page type') + '</div><div class="sh" style="margin:0">' + esc(n.type) + (n.locked ? ' · ' + t('Locked') : '') + '</div>' +
      '<div style="margin-top:16px;display:flex;gap:8px"><button class="btn btn-primary" data-editpage>' + t('Edit page') + '</button>' +
      (n.locked ? '' : '<button class="btn btn-default" data-delnode>' + t('Delete') + '</button>') + '</div>';
  }
  function edgePanel(e) {
    if (!e) return hintPanel();
    const F = D.FUNNEL, from = F.steps.find((n) => n.id === e.from), to = F.steps.find((n) => n.id === e.to);
    const prods = e.products.length ? e.products.map((p, i) => '<span class="fb-chip" data-rmprod="' + i + '">' + esc(p) + ' <button>&times;</button></span>').join('') : '<div class="sh" style="margin:0">' + t('blank = all products') + '</div>';
    const tags = e.tags.map((p, i) => '<span class="fb-chip o" data-rmtag="' + i + '">' + esc(p) + ' <button>&times;</button></span>').join('');
    return '<div class="st">' + t('Connection routing') + '</div>' +
      '<div class="sh">' + esc(from ? from.name : '') + ' → ' + esc(to ? to.name : '') + '</div>' +
      '<div class="fb-fl">' + t('Buttons / Links of') + ' ' + esc(from ? from.name : '') + '</div><span class="fb-chip">' + esc(e.button || 'Complete') + '</span>' +
      '<div class="fb-fl">' + t('Dynamic Upsells') + '</div><div class="sh" style="margin:-2px 0 8px">' + t('Products / tags that navigate with this arrow (blank = all).') + '</div>' + prods +
      '<div style="display:flex;gap:6px;margin-top:8px"><input class="fb-in" id="fb-addprod" placeholder="' + t('Add product…') + '"><button class="btn btn-default" data-addprod>' + t('Add') + '</button></div>' +
      '<div style="margin-top:8px">' + tags + '<input class="fb-in" id="fb-addtag" placeholder="' + t('Enter product tags') + '"></div>' +
      '<div class="fb-tog' + (e.matchAll ? ' on' : '') + '" data-tog="matchAll"><span class="sw"></span>' + t('Match all selected products and tags') + '</div>' +
      '<div class="fb-tog' + (e.includePrev ? ' on' : '') + '" data-tog="includePrev"><span class="sw"></span>' + t('Include products previously purchased') + '</div>' +
      '<div class="fb-fl">' + t('Countries') + '</div><div class="sh" style="margin:-2px 0 6px">' + t('Ship countries that navigate with this arrow (blank = all).') + '</div>' +
      '<input class="fb-in" id="fb-country" placeholder="' + t('Choose Country (blank = all)') + '" value="' + esc(e.countries.join(', ')) + '">' +
      '<div class="fb-fl">' + t('Customers') + '</div><select class="fb-sel" id="fb-cust">' +
        '<option value="all"' + (e.customers === 'all' ? ' selected' : '') + '>' + t('All Customers') + '</option>' +
        '<option value="new"' + (e.customers === 'new' ? ' selected' : '') + '>' + t('New Customers Only') + '</option>' +
        '<option value="repeat"' + (e.customers === 'repeat' ? ' selected' : '') + '>' + t('Repeat Customers Only') + '</option></select>' +
      '<div style="margin-top:16px"><button class="btn btn-default" data-rmedge>' + t('Delete connection') + '</button></div>';
  }
  function wireVisualizer() {
    root.querySelectorAll('.fb-pt').forEach((p) => p.onclick = () => addNode(p.getAttribute('data-ptype')));
    root.querySelectorAll('[data-tb]').forEach((b) => b.onclick = () => toast(t(b.getAttribute('data-tb'))));
    root.querySelectorAll('[data-zoom]').forEach((b) => b.onclick = () => {
      FB.zoom = Math.max(50, Math.min(150, FB.zoom + (b.getAttribute('data-zoom') === '+' ? 10 : -10)));
      const c = root.querySelector('#fbcanvas'); if (c) c.style.transform = 'scale(' + (FB.zoom / 100) + ')';
      const z = root.querySelector('.fb-zoom .zl'); if (z) z.textContent = FB.zoom + '%';
    });
    const wrp = root.querySelector('#fbwrap');
    if (wrp) wrp.addEventListener('mousedown', (e) => {
      if (e.target === wrp || e.target.id === 'fbcanvas' || e.target.classList.contains('fbedges')) {
        if (FB.connectFrom) { FB.connectFrom = null; const c = root.querySelector('#fbcanvas'); if (c) c.classList.remove('fb-connecting'); }
        if (FB.selEdge || FB.selNode) { FB.selEdge = null; FB.selNode = null; root.querySelectorAll('.fbnode').forEach((n) => n.classList.remove('sel')); setSide(hintPanel()); drawEdges(); }
      }
    });
    root.querySelectorAll('.fbnode').forEach((el) => {
      const id = el.getAttribute('data-nid');
      const edit = el.querySelector('[data-edit]'); if (edit) edit.onclick = (e) => { e.stopPropagation(); location.hash = '#/bestcheckout/editor/' + id; };
      const del = el.querySelector('[data-del]'); if (del) del.onclick = (e) => { e.stopPropagation(); deleteNode(id); };
      const port = el.querySelector('[data-port]'); if (port) port.onclick = (e) => { e.stopPropagation(); startConnect(id); };
      const h = el.querySelector('.fbnode-h');
      if (h) h.addEventListener('mousedown', (e) => { if (e.target.closest('button')) return; startDrag(e, el, id); });
      el.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('[data-port]')) return;
        if (FB.connectFrom && FB.connectFrom !== id) { addEdge(FB.connectFrom, id); FB.connectFrom = null; const c = root.querySelector('#fbcanvas'); if (c) c.classList.remove('fb-connecting'); return; }
        if (!el.dataset.dragged) selectNode(id);
      });
    });
    wireSidePanel();
  }
  function startDrag(e, el, id) {
    const node = D.FUNNEL.steps.find((n) => n.id === id); if (!node) return;
    const z = FB.zoom / 100, sx = e.clientX, sy = e.clientY, ox = node.x, oy = node.y; let moved = false;
    el.style.cursor = 'grabbing';
    function mm(ev) {
      if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 4) moved = true;
      node.x = Math.max(0, Math.round(ox + (ev.clientX - sx) / z)); node.y = Math.max(0, Math.round(oy + (ev.clientY - sy) / z));
      el.style.left = node.x + 'px'; el.style.top = node.y + 'px'; drawEdges();
    }
    function mu() { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); el.style.cursor = ''; if (moved) { el.dataset.dragged = '1'; setTimeout(() => { delete el.dataset.dragged; }, 0); } }
    document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
  }
  function startConnect(id) { FB.connectFrom = id; const c = root.querySelector('#fbcanvas'); if (c) c.classList.add('fb-connecting'); toast(t('Click a target page to connect')); }
  function addEdge(from, to) {
    if (from === to) return;
    const F = D.FUNNEL;
    if (F.edges.some((e) => e.from === from && e.to === to)) { toast(t('Already connected')); return; }
    const id = 'e' + Math.floor(Math.random() * 1e6);
    F.edges.push({ id: id, from: from, to: to, button: 'Complete', products: [], tags: [], matchAll: false, includePrev: false, countries: [], customers: 'all' });
    FB.selEdge = id; FB.selNode = null; renderVisualizer(); toast(t('Connection added'));
  }
  function addNode(type) {
    const names = { presell: 'Presell page', lead: 'Lead page', checkout: 'Checkout page', upsell: 'Upsell page', downsell: 'Downsell page', thankyou: 'Thank you page', generic: 'Page' };
    const F = D.FUNNEL, id = 'st' + Math.floor(Math.random() * 1e6), n = F.steps.length;
    F.steps.push({ id: id, type: type, name: names[type] || 'Page', sub: 'New page', x: 250 + (n % 4) * 40, y: 120 + (n % 4) * 36, blocks: defaultBlocks(type) });
    FB.selNode = id; FB.selEdge = null; renderVisualizer(); toast(t('Page added'));
  }
  function deleteNode(id) {
    const F = D.FUNNEL, node = F.steps.find((n) => n.id === id); if (!node || node.locked) return;
    F.steps = F.steps.filter((n) => n.id !== id); F.edges = F.edges.filter((e) => e.from !== id && e.to !== id);
    if (FB.selNode === id) FB.selNode = null; renderVisualizer(); toast(t('Page removed'));
  }
  function wireSidePanel() {
    const F = D.FUNNEL;
    const nn = root.querySelector('#fb-nname');
    if (nn) nn.addEventListener('input', () => { const node = F.steps.find((n) => n.id === FB.selNode); if (!node) return; node.name = nn.value; const h = root.querySelector('.fbnode[data-nid="' + node.id + '"] .nm'); if (h) h.textContent = nn.value; });
    const ep = root.querySelector('[data-editpage]'); if (ep) ep.onclick = () => { if (FB.selNode) location.hash = '#/bestcheckout/editor/' + FB.selNode; };
    const dn = root.querySelector('[data-delnode]'); if (dn) dn.onclick = () => { if (FB.selNode) deleteNode(FB.selNode); };
    const edge = () => F.edges.find((e) => e.id === FB.selEdge);
    root.querySelectorAll('[data-rmprod]').forEach((b) => b.onclick = () => { const e = edge(); if (!e) return; e.products.splice(+b.getAttribute('data-rmprod'), 1); setSide(edgePanel(e)); });
    root.querySelectorAll('[data-rmtag]').forEach((b) => b.onclick = () => { const e = edge(); if (!e) return; e.tags.splice(+b.getAttribute('data-rmtag'), 1); setSide(edgePanel(e)); });
    const ap = root.querySelector('[data-addprod]'); if (ap) ap.onclick = () => { const e = edge(), inp = root.querySelector('#fb-addprod'); if (!e || !inp || !inp.value.trim()) return; e.products.push(inp.value.trim()); setSide(edgePanel(e)); };
    const at = root.querySelector('#fb-addtag'); if (at) at.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { const e = edge(); if (!e || !at.value.trim()) return; e.tags.push(at.value.trim()); setSide(edgePanel(e)); } });
    root.querySelectorAll('[data-tog]').forEach((tg) => tg.onclick = () => { const e = edge(); if (!e) return; const k = tg.getAttribute('data-tog'); e[k] = !e[k]; tg.classList.toggle('on', e[k]); });
    const cy = root.querySelector('#fb-country'); if (cy) cy.addEventListener('input', () => { const e = edge(); if (!e) return; e.countries = cy.value.split(',').map((s) => s.trim()).filter(Boolean); });
    const cu = root.querySelector('#fb-cust'); if (cu) cu.onchange = () => { const e = edge(); if (!e) return; e.customers = cu.value; drawEdges(); };
    const re = root.querySelector('[data-rmedge]'); if (re) re.onclick = () => { const e = edge(); if (!e) return; F.edges = F.edges.filter((x) => x.id !== e.id); FB.selEdge = null; setSide(hintPanel()); drawEdges(); toast(t('Connection removed')); };
  }
  function defaultBlocks(type) {
    if (type === 'upsell' || type === 'downsell') return [{ id: 'b1', type: 'headline', props: { text: 'Special one-time offer' } }, { id: 'b2', type: 'product', props: { name: 'Product', price: '19.00', compareAt: '24.00' } }, { id: 'b3', type: 'yesno', props: { yes: 'Yes, add it', no: 'No thanks' } }];
    if (type === 'checkout') return [{ id: 'b1', type: 'logo', props: { text: 'Lovocross' } }, { id: 'b2', type: 'contact', props: { title: 'Contact' } }, { id: 'b3', type: 'shipping', props: { title: 'Shipping address' } }, { id: 'b4', type: 'payment', props: { title: 'Payment' } }, { id: 'b5', type: 'cartSummary', props: { title: 'Order summary' } }];
    if (type === 'thankyou') return [{ id: 'b1', type: 'headline', props: { text: 'Thank you for your order!' } }, { id: 'b2', type: 'cartSummary', props: { title: 'Your order' } }, { id: 'b3', type: 'tracking', props: { title: 'Track your shipment' } }];
    if (type === 'lead' || type === 'presell') return [{ id: 'b1', type: 'hero', props: { headline: 'Headline', sub: 'Subtitle', cta: 'Shop now' } }, { id: 'b2', type: 'features', props: { title: 'Why it works' } }, { id: 'b3', type: 'button', props: { label: 'Buy now', color: '#3b6fd4' } }];
    return [{ id: 'b1', type: 'headline', props: { text: 'New page' } }, { id: 'b2', type: 'text', props: { text: 'Add your content here.' } }];
  }

  // ---- page editor (one funnel step's blocks) ----
  const PE = { sel: null };
  function renderPageEditor(stepId) {
    const step = D.FUNNEL.steps.find((s) => s.id === stepId);
    if (!step) return renderVisualizer();
    if (!step.blocks) step.blocks = [];
    if (!window.BC_PB) root.innerHTML = wrap('<div class="placeholder" style="padding:46px;text-align:center;color:var(--ink-muted)">Loading page builder…</div>');
    ensurePageBuilder().then(function () {
      if (((location.hash || '').split('/')[3] || '') !== stepId) return; // route changed while loading
      if (window.BC_PB) window.BC_PB.render(root, step);
    });
  }
  function previewHtml(step) {
    return step.blocks.map((b) => '<div class="bc-pb' + (b.id === PE.sel ? ' sel' : '') + '" data-bid="' + b.id + '">' + blockPreview(b) + '</div>').join('') || '<div class="bc-pb-empty">Add blocks to design this page</div>';
  }
  function wirePageEditor(step) {
    root.querySelectorAll('.bc-blk').forEach((el) => el.addEventListener('click', (e) => { if (e.target.closest('button')) return; PE.sel = el.getAttribute('data-bid'); renderPageEditor(step.id); }));
    root.querySelectorAll('.bc-pb').forEach((el) => el.addEventListener('click', () => { PE.sel = el.getAttribute('data-bid'); renderPageEditor(step.id); }));
    root.querySelectorAll('[data-mv]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); moveBlock(step, b.getAttribute('data-bid'), b.getAttribute('data-mv')); });
    root.querySelectorAll('[data-bdel]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); step.blocks = step.blocks.filter((x) => x.id !== b.getAttribute('data-bdel')); renderPageEditor(step.id); toast(t('Block removed')); });
    root.querySelectorAll('[data-addb]').forEach((b) => b.onclick = () => addBlock(step, b.getAttribute('data-addb')));
    root.querySelectorAll('#bc-setbody [data-prop]').forEach((inp) => inp.addEventListener('input', () => {
      const c = step.blocks.find((x) => x.id === PE.sel); if (!c) return;
      c.props[inp.getAttribute('data-prop')] = inp.value;
      const cv = root.querySelector('#bc-canvas'); if (cv) { cv.innerHTML = previewHtml(step); bcI18n(cv); }
    }));
    const sv = root.querySelector('[data-save]'); if (sv) sv.onclick = () => toast(t('Saved'));
    const pv = root.querySelector('[data-preview]'); if (pv) pv.onclick = () => toast(t('Preview'));
  }
  function moveBlock(step, bid, dir) {
    const a = step.blocks, i = a.findIndex((b) => b.id === bid); if (i < 0) return;
    const j = dir === 'up' ? i - 1 : i + 1; if (j < 0 || j >= a.length) return;
    const m = a.splice(i, 1)[0]; a.splice(j, 0, m); renderPageEditor(step.id);
  }
  function addBlock(step, type) {
    const id = 'b' + Math.floor(Math.random() * 1e6);
    step.blocks.push({ id: id, type: type, props: defaultProps(type) });
    PE.sel = id; renderPageEditor(step.id); toast(t('Block added'));
  }
  function defaultProps(type) {
    return ({
      headline: { text: 'New headline' }, text: { text: 'New text block. Click to edit.' }, image: { alt: 'Image' },
      product: { name: 'Product name', price: '19.00', compareAt: '' }, button: { label: 'Button', color: '#3b6fd4' },
      yesno: { yes: 'Yes, add it', no: 'No thanks' }, orderBump: { title: 'Add to your order', price: '2.99' },
      timer: { minutes: '10', text: 'Offer expires in' }, reviews: { title: '4.8 · 1,200 reviews' },
      features: { title: 'Why it works' }, hero: { headline: 'Headline', sub: 'Subtitle', cta: 'Shop now' },
    })[type] || {};
  }
  function blockName(type) {
    return ({ headline: 'Headline', text: 'Text', image: 'Image', product: 'Product', button: 'Button', yesno: 'Yes / No buttons', orderBump: 'Order bump', timer: 'Countdown timer', reviews: 'Reviews', features: 'Feature list', hero: 'Hero', logo: 'Logo', contact: 'Contact', shipping: 'Shipping', payment: 'Payment', cartSummary: 'Order summary', tracking: 'Tracking' })[type] || type;
  }
  function blockPreview(b) {
    const p = b.props || {};
    switch (b.type) {
      case 'hero': return '<div class="pv-hero"><div class="pv-h1">' + esc(p.headline || '') + '</div><div class="pv-sub">' + esc(p.sub || '') + '</div><span class="pv-btn">' + esc(p.cta || 'Shop now') + '</span></div>';
      case 'headline': return '<div class="pv-h2">' + esc(p.text || '') + '</div>';
      case 'text': return '<div class="pv-txt">' + esc(p.text || '') + '</div>';
      case 'image': return '<div class="pv-img"></div>';
      case 'product': { const sale = p.compareAt && parseFloat(p.compareAt) > parseFloat(p.price || 0); return '<div class="pv-prod"><div class="pv-pimg"></div><div class="pv-pn">' + esc(p.name || '') + '</div><div class="pv-pp"><b>$' + esc(p.price || '0') + '</b>' + (sale ? '<s>$' + esc(p.compareAt) + '</s>' : '') + '</div></div>'; }
      case 'button': return '<div style="text-align:center;padding:12px"><span class="pv-btn" style="background:' + esc(p.color || '#3b6fd4') + '">' + esc(p.label || 'Button') + '</span></div>';
      case 'yesno': return '<div class="pv-yn"><span class="pv-btn full">' + esc(p.yes || 'Yes') + '</span><span class="pv-no">' + esc(p.no || 'No thanks') + '</span></div>';
      case 'orderBump': return '<div class="pv-bump"><span class="pv-cb"></span><div><div class="pv-bt">' + esc(p.title || '') + '</div><div class="pv-bp">+ $' + esc(p.price || '0') + '</div></div></div>';
      case 'timer': return '<div class="pv-timer">' + esc(p.text || '') + ' <b>09:58</b></div>';
      case 'reviews': return '<div class="pv-rev">★★★★★ <span style="color:#5b6470;font-weight:600">' + esc(p.title || '') + '</span></div>';
      case 'features': return '<div class="pv-feat"><div class="pv-ft">' + esc(p.title || '') + '</div><div class="pv-fl"><span></span><span></span><span></span></div></div>';
      case 'logo': return '<div class="pv-logo">' + esc(p.text || 'Brand') + '</div>';
      case 'contact': case 'shipping': case 'payment': return '<div class="pv-form"><div class="pv-fl2">' + esc(p.title || blockName(b.type)) + '</div><div class="pv-input"></div><div class="pv-input"></div></div>';
      case 'cartSummary': return '<div class="pv-cart"><div class="pv-fl2">' + esc(p.title || 'Order summary') + '</div><div class="pv-row"><span>Subtotal</span><span>$39.97</span></div><div class="pv-row total"><span>Total</span><span>$42.96</span></div></div>';
      case 'tracking': return '<div class="pv-track"><div class="pv-fl2">' + esc(p.title || 'Tracking') + '</div><div class="pv-tbar"></div></div>';
      default: return '<div class="pv-txt">' + esc(blockName(b.type)) + '</div>';
    }
  }
  function field(label, prop, val, type) {
    return '<div class="fld"><label class="fl">' + label + '</label><input class="fi" data-prop="' + prop + '" value="' + esc(val == null ? '' : val) + '"' + (type === 'color' ? ' type="color" style="height:36px;padding:3px"' : '') + '></div>';
  }
  function blockSettings(b) {
    const p = b.props || {};
    switch (b.type) {
      case 'hero': return field('Headline', 'headline', p.headline) + field('Subtitle', 'sub', p.sub) + field('Button label', 'cta', p.cta);
      case 'headline': return field('Headline', 'text', p.text);
      case 'text': return field('Text', 'text', p.text);
      case 'product': return field('Product name', 'name', p.name) + field('Price', 'price', p.price) + field('Compare-at (optional)', 'compareAt', p.compareAt);
      case 'button': return field('Label', 'label', p.label) + field('Color', 'color', p.color, 'color');
      case 'yesno': return field('Yes button', 'yes', p.yes) + field('Decline link', 'no', p.no);
      case 'orderBump': return field('Title', 'title', p.title) + field('Add-on price', 'price', p.price);
      case 'timer': return field('Text', 'text', p.text) + field('Minutes', 'minutes', p.minutes);
      case 'reviews': return field('Title', 'title', p.title);
      case 'features': return field('Title', 'title', p.title);
      case 'logo': return field('Brand text', 'text', p.text);
      case 'contact': case 'shipping': case 'payment': case 'cartSummary': case 'tracking': return field('Section title', 'title', p.title);
      default: return '<div class="muted" style="font-size:12.5px">No editable settings for this block.</div>';
    }
  }

  function dispose() { if (chart) { try { chart.dispose(); } catch (e) {} chart = null; } }

  window.VIEWS.bestcheckout = {
    render: function (el, rest) {
      root = el; dispose();
      const sub = String(rest || '').split('/')[0];
      // MVP scope: Payment routing (multi-MID/ATRI) and Reports were cut — payments reuse the
      // merchant's connected PSP (native Settings → Payments); routing is a Phase-2 moat, not MVP.
      if (sub === 'post-purchase') renderPostPurchase();
      else if (sub === 'checkout') renderDesign('checkout');
      else if (sub === 'thankyou') renderDesign('thankyou');
      else if (sub === 'connect') renderConnect();
      else if (sub === 'onboarding' || sub === 'setup') { CF.step = 'store'; renderConnectFlow(); } // stable entry for demoing the auth flow, regardless of connected state
      else renderOverview();
      bcI18n(root);
    },
    unmount: function () { dispose(); },
  };
})();
