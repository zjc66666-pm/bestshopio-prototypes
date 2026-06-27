/* i18n: Facebook channel workspace — workspace home + Data tracking sub-page + Add Pixel modal */
window.I18N.extend({
  // ============================== Sidebar group labels ==============================
  "Channels": "渠道",
  "Apps":     "应用",

  // ============================== Workspace home ==============================
  // Note: brand names "Facebook"/"Instagram"/"Meta"/"Messenger"/"Shop" are kept in English.
  "Domain verification": "网域验证",
  "Verify domain ownership": "声明网域所有权",
  "Domain ownership lets you retain control over editing links or other content, hence safeguarding your domain from malicious activities.": "拥有网域所有权，您就可以控制链接和其他内容的编辑权限，避免网域遭到违规使用，防止不良行为者传播错误信息。",

  "Data tracking": "数据追踪",
  "Send conversion events back to Meta": "将转化事件回传到 Meta",
  "Boost ad efficiency with Website Pixel, CAPI, and Offline CAPI by sending back conversion data to Meta. Connected accounts:": "通过 Website 的 Pixel 和 CAPI、Offline CAPI 回传转化事件到 Meta，帮助您提升广告投放效率。已绑定的账号：",
  "Connected Website Pixel ID:": "已连接的 Website Pixel ID：",

  "Sell your products on Facebook and Instagram": "透过 Facebook 和 Instagram Shop 销售产品",
  "Showcase your products on social media to increase brand awareness and sales.": "在您的社群媒体上展示和销售商品，让顾客透过 Facebook 及 Instagram 就能轻松购物。",

  "Advertising": "广告投放",
  "Expand your customer base using Meta ads": "借助 Facebook 广告扩大客户群",
  "Use the Ads Management tool to easily handle account setup, ad configuration, performance tracking, and financial reconciliation. Facebook Ads Manager is Facebook's native professional ad management tool.": "使用广告管理工具，轻松完成账户开通、投放配置、效果跟踪、财务对账等操作。Facebook Ads Manager 为 Facebook 原生的专业投放工具。",
  "Original ad tools": "原生广告工具",

  "Community marketing": "社群营销",
  "Use Facebook Messenger to sell products to your customers": "通过 Messenger 与客户沟通并销售产品",
  "Connect multiple Messenger and Instagram accounts to easily manage incoming messages.": "轻松管理多个粉丝主页的 Messenger 和 Instagram 消息、贴文内容。",

  // Card CTAs (workspace home)
  "Setup": "前往设置",
  "Learn more": "了解详情",

  // ============================== Data tracking sub-page ==============================
  "Send conversion issue reports back to Meta with Pixel and Conversion API to better manage your ad performance.": "通过 Meta Pixel、Conversion API 将转化事件回传给 Meta 用以评估和优化您的广告效果。",

  // Section 1: Website data reporting
  "Website data reporting": "Website 上报",
  "Once you successfully link up Pixel and Conversion API, we'll send the data to Meta every time there's a conversion.": "Pixel 和 Conversion API 绑定成功后，BestShopio 将在转化事件发生时把数据上报到 Meta，整个过程无需您编写代码。",
  "Authorizing Pixel and Conversion API": "Pixel 和 Conversion API 授权",
  "Authorize": "授权",
  "Add": "添加",
  "Add Pixel ID and access token to send all events through Facebook Pixel and Conversions API. This will enhance your marketing ability.": "添加 Pixel ID 和访问令牌以通过 Facebook Pixel 和 Conversions API 发送所有事件，这些数据可提高你的营销能力。",
  "Learn how to set this up": "如何获得？",
  "Please do not select 'Instagram Account' during authorization.": "授权中不要勾选'Instagram 主页'，否则可能授权失败。",

  // Table headers + cells
  "Facebook pixel": "Facebook 像素",
  "Conversion API Access Token": "Conversion API Access Token",
  "Create source": "创建来源",
  "Action": "操作",
  "Verified": "验证通过",
  "Add manually": "手动添加",

  // Pixel Helper helper row
  "Install Meta Pixel Helper": "安装 Meta Pixel Helper",
  "Once you added your Pixel, install Meta Pixel Helper for data analysis.": "添加 Pixel 后，安装 Meta Pixel Helper 进行数据分析。",
  "Go": "前往",

  // Section 2: Offline data reporting
  "Offline data reporting": "Offline 上报",
  "Evaluate your Meta ads' results over bricks-and-mortar conversions. You can also create and target offline audience groups with the right ads.": "借助线下转化量来衡量通过 Meta 投放的广告带来的实际成效，如店铺购物。除此之外，还可以创建类似受众，将广告投放给与您的线下客户具有相似特征的用户。",
  "Report offline conversion data with Offline Conversions API": "通过 Offline Conversions API 上报线下转化",
  "After authorizing data set permissions through Meta Business Extension (MBE), we'll report offline order events to Meta. All offline orders from the previous day will be reported at 1 am UTC+8. You can choose a Pixel ID as your dataset ID, the same as what you report on the Website data reporting.": "通过 MBE 授权数据集权限后将为您上报成单事件到 Meta。东八区每天凌晨 1 点上报前一天全部 POS 成单的线下订单。您可以选择和【Website 上报】一样的 Pixel ID 作为数据集 ID。",
  "Offline Conversions API": "Offline Conversions API",
  "Unauthorized": "未授权",

  // Section 3: Social e-commerce conversion event reporting
  "Social e-commerce conversion event reporting": "社交电商转化事件上报",
  "Conversion events achieved through live sales, post sales, and message center will be reported to Meta.": "在直播销售、贴文销售、消息中心达成的转化事件上报给 Meta。",
  "MBE authorization": "MBE 授权",
  "Once the authorization is enabled, the conversion actions of customers in live sales, post sales, message center will be synchronized with Meta, facilitating performance tracking and continuous optimization of Meta's ad performance.": "授权开启后，会将客户在直播销售、贴文销售、消息中心的转化行为同步到 Meta，方便追踪成效分析并持续优化 Meta 的广告表现。",
  "Messaging Event API": "Messaging Event API",

  // ============================== Add Pixel modal ==============================
  "New FB Pixel and Conversion API tracking event": "新增 Facebook 像素 和 Conversion API 追踪事件",
  "Select tracking event": "选择追踪事件",
  "A customer visits any webpage of the online store": "顾客造访网店内的任何网页",
  "A customer views a product or offer page": "顾客浏览商品或活动页面",
  "A customer adds a product to cart": "顾客将商品加入购物车",
  "A customer lands on the checkout page": "顾客进入结账页面",
  "A customer fills in payment information": "顾客填写支付信息",
  "A customer completes a purchase": "顾客完成购买",
  "It's usually a JavaScript code snippet obtainable on the Meta platform.": "通常是一个 JavaScript 代码片段，需从 Facebook 平台上获取。",
  "Paste your Facebook pixel, e.g.: 212313338444699": "请粘贴 Facebook 像素，如：212313338444699",
  "Access Token": "Access Token",
  "What is Verification": "验证是什么",
  "Need help?": "需要帮助?",
  "Paste your access token": "请粘贴访问令牌",
  "Tracking Pages Type": "追踪页面类型",
  "Online store": "网店",
  "Checkout": "结账",
  "Thank-you page": "致谢页",

  // Misc
  "Coming soon": "即将上线",
  "Help docs coming soon": "帮助文档即将上线",
  "OAuth authorization flow — coming soon": "OAuth 授权流程 — 即将上线",
  "Edit pixel — coming soon": "编辑 Pixel — 即将上线",
  "Delete / Re-verify — coming soon": "删除 / 重新验证 — 即将上线",
  "Saved successfully": "保存成功",
  "Please enter Facebook pixel": "请输入 Facebook 像素",

  // ============================== Multi-Pixel table actions ==============================
  // Edit modal title (vs the "New ..." title for Add modal)
  "Edit FB Pixel and Conversion API tracking event": "编辑 Facebook 像素 和 Conversion API 追踪事件",
  // Token field hint (edit mode)
  "Existing token shown masked — clear and re-enter to rotate.": "现有令牌以掩码显示——清空并重新输入即可更换。",
  // "..." row menu options
  "Delete": "删除",
  // Toasts after row actions
  "Pixel deleted": "Pixel 已删除",
  // Native confirm() before delete — best-effort overlay
  "Delete Pixel ": "删除 Pixel ",
  "? This cannot be undone.": "？此操作无法撤销。",

  // ============================== ? tooltip body ==============================
  // Pixel + Conversion API title tooltip — appears below the round "?" hint.
  // Translation matches the surrounding "Authorizing Pixel and Conversion API" copy.
  "Pixel events fire from": "Pixel 事件由",
  "the storefront browser (Pixel)": "店面浏览器（Pixel）",
  "our server-side Conversion API with a shared event_id — Meta dedupes automatically, so attribution survives iOS 14+ tracking blocks.": "服务器端 Conversion API（共享 event_id）同时上报——Meta 自动去重，归因不受 iOS 14+ 拦截影响。",

  // ============================== Hover hints (title attributes) ==============================
  "Edit": "编辑",
  "More": "更多",
  "Back": "返回",
});
