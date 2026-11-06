/* BestShopio Admin · Settings prototype — SPA sub-module of the shared shell.
   When the route is #/settings/* the shell (../assets/shell.js) renders the
   settings sidebar (7 items) + a "Settings" bar, then mounts this module via
   window.VIEWS.settings.render(rootEl, rest). This file renders ONLY the content
   of the active settings sub-page into #root (NO internal left sub-nav). `rest`
   (the part after #/settings/) selects the sub-page.
   Mirrors reference/bestvoy-admin web-antd settings/** views & copy exactly.
   SECURITY: secret fields render masked placeholders only — never plaintext. */
(function () {
  const D = window.DATA_SETTINGS;
  let root; // set by the SPA shell router via VIEWS.settings.render(el, rest)

  // tiny html -> element helper (same pattern as orders prototype)
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---- inline icons (match shell.js .nav-ico style) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 18) + '" height="' + (w || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    truck:  svg('<path d="M10 17h4V5H2v12h2"/><path d="M14 9h4l4 4v4h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/>'),
    chevR:  svg('<path d="m9 18 6-6-6-6"/>', 16),
    chevL:  svg('<path d="m15 18-6-6 6-6"/>', 18),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    chevD:  svg('<path d="m6 9 6 6 6-6"/>', 16),
    plus:   svg('<path d="M12 5v14M5 12h14"/>', 16),
    image:  svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4.35-4.35a2 2 0 0 0-2.83 0L5 19"/>', 18),
    x:      svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
    globe:  svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14.5 14.5 0 0 0 0 18 14.5 14.5 0 0 0 0-18"/>', 16),
    check:  svg('<path d="M20 6 9 17l-5-5"/>', 14),
    tagSm:  svg('<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.3"/>', 18),
    grid:   svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>', 18),
    pencil: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 16),
    trash:  svg('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', 16),
    dots:   svg('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>', 16),
    grip:   svg('<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>', 16),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', 16),
    info:   svg('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>', 16),
  };

  if (window.I18N && window.I18N.extend) {
    window.I18N.extend({
      'Manage the transactional messages your store sends automatically.': '管理店铺自动发送的事务邮件。',
      'Sender identity': '发件身份',
      'Manage sender identity': '管理发件身份',
      'Verified': '已验证',
      'Reply-to': '回复地址',
      'Leave blank to use your store service email.': '留空时，默认使用店铺服务邮箱。',
      'Leave blank to use your store registration email.': '留空时，默认使用店铺注册邮箱。',
      'Sending domain': '发件域名',
      'Status': '状态',
      'Used for transactional email': '用于发送事务邮件',
      'Available after activation': '设为当前发件域名后可用',
      'Active sender domain': '当前发件域名',
      'Used for all transactional emails': '当前用于发送全部事务邮件',
      'Free store domain · always available · Used for all transactional emails': '免费店铺域名 · 始终可用 · 用于全部事务邮件',
      'Platform default sender': '平台默认发件人',
      'Ready to use': '可立即使用',
      'Domain connected': '域名已连接',
      'This sending domain is now used automatically for transactional email.': '此发件域名现已自动用于发送事务邮件。',
      'Connected sending domain': '已连接的发件域名',
      'Customer emails continue to use the default sender until a branded domain is connected.': '在品牌发件域名连接前，客户邮件将继续使用默认发件人。',
      'Available after connection': '连接后即可使用',
      'Connected domains are selected automatically': '已连接域名会自动生效',
      'Fix the DNS records in Domains, then verify again': '请在“域名”中修正 DNS 记录后重新验证',
      'BestShopio provisions this address for your store. Connect a custom domain to edit the address prefix.': 'BestShopio 已为你的店铺生成此发件地址。连接自定义域名后，可编辑地址前缀。',
      'The address uses the active connected domain:': '发件地址使用当前已连接域名：',
      'This address will be ready after the sender domain is connected.': '发件域名连接后，此地址即可使用。',
      'The default sender is ready to deliver transactional email. Add and connect a branded sender domain when you want to use your own domain.': '默认发件人已可发送事务邮件。需要使用自有域名时，可添加并连接品牌发件域名。',
      'This connected domain is currently used for transactional email.': '此已连接域名当前用于发送事务邮件。',
      'Store default sending domain': '店铺默认发件域名',
      'This domain is created for your store and is ready to send transactional email.': '此域名由系统为你的店铺生成，可立即发送事务邮件。',
      'Add branded sending domain': '添加品牌发件域名',
      'Use your own domain to make your sender easier for customers to recognize. When it connects, it replaces the default sender automatically.': '使用自有域名，让顾客更容易识别你的品牌。域名连接成功后，会自动替代默认发件人。',
      'Branded sending domain': '品牌发件域名',
      'Manage branded sending domain': '管理品牌发件域名',
      'This domain is used automatically for transactional email.': '此域名当前自动用于发送事务邮件。',
      'Add the DNS records in Domains to complete verification.': '请在“域名”中添加 DNS 记录以完成验证。',
      'Fix the DNS records in Domains, then verify again.': '请在“域名”中修正 DNS 记录后重新验证。',
      'Add a sending domain': '添加发件域名',
      'Back to domains': '返回域名列表',
      'Verify later': '稍后验证',
      'Having issues? View the setup guide': '遇到问题？查看配置指南',
      'Add the records below for': '请为以下域名添加这些 DNS 记录：',
      'We will verify them automatically.': '系统会自动验证这些记录。',
      'Remove the current custom sending domain before adding another one.': '请先删除当前自定义发件域名，再添加新的域名。',
      'The verification for': '将删除以下域名的验证：',
      'Transactional emails will use the BestShopio default sender until you add and verify another domain.': '在添加并验证新的域名之前，事务邮件将使用 BestShopio 默认发件人。',
      'After adding the records, click Verify now to check your sending domain.': '添加记录后，点击“立即验证”检查发件域名。',
      'This sending domain is ready for transactional email. You can make it your current sender domain now or keep using the default sender.': '此发件域名已可用于事务邮件。你可以立即将其设为当前发件域名，或继续使用默认发件人。',
      'Used by': '当前用于',
      'Waiting for sender-domain verification': '等待发件域名验证',
      'DNS records required for this candidate domain': '此候选域名需要配置 DNS 记录',
      'Ready to use as active sender domain': '可设为当前发件域名',
      'Not verified': '未验证',
      'BestShopio default': 'BestShopio 默认',
      'BestShopio default sender domain': 'BestShopio 默认发件域名',
      'Platform-managed sender domain': '平台托管发件域名',
      'Platform-generated default sender domain': '平台自动生成的默认发件域名',
      'BestShopio is verifying this default domain. No DNS action is required.': 'BestShopio 正在验证此默认域名，无需配置 DNS。',
      'Customer emails can send through this default domain.': '客户邮件可通过此默认域名立即发送。',
      'The address uses the active BestShopio default domain:': '发件地址使用当前 BestShopio 默认域名：',
      'BestShopio creates a default sender domain during store setup and verifies it automatically. Add a custom domain only if you want to replace the default sender domain.': 'BestShopio 会在建店时自动生成并验证默认发件域名。只有需要替换默认发件域名时，才添加自定义域名。',
      'BestShopio creates a platform-managed default sender domain during store setup. It can send transactional email immediately. Add a custom domain only if you want to replace the default sender domain.': 'BestShopio 会在建店时自动生成平台托管的默认发件域名，可立即发送事务邮件。只有需要替换默认发件域名时，才添加自定义域名。',
      'Verify a sender domain before enabling email notifications.': '请先验证一个发件域名，再启用邮件通知。',
      'Add these records exactly at your DNS provider. Verification happens asynchronously; this prototype does not mark a pending domain as verified.': '请在你的 DNS 服务商处逐条添加这些记录。验证会异步完成；此原型不会将待验证域名标记为已验证。',
      'Transactional emails': '事务邮件',
      'Required': '必发',
      'This required account email is always on.': '这封账户安全邮件始终开启。',
      'Invoice': '发票',
      'Download PDF': '下载 PDF',
      'The order details, invoice and customer information are included automatically. You can use {{customer.first_name}} and {{order.number}} in this copy.': '订单明细、发票和客户信息会自动附带。正文中可使用 {{customer.first_name}} 和 {{order.number}}。',
      'Sent once after post-purchase offers finish and the final order total is confirmed.': '所有支付后加购流程结束且订单最终金额确认后，仅发送一次。',
      'Configure the sender name and reply-to address customers see on your emails.': '设置顾客在邮件中看到的发件人名称和回复地址。',
      'From identity': '发件身份信息',
      'Sender address': '发件地址',
      'Sending domains': '发件域名',
      'Add domain': '添加域名',
      'Domains': '域名',
      'Manage the public store address and email sender separately.': '分别管理店铺前台地址与邮件发件域名。',
      'Storefront domains': '店铺前台域名',
      'Used for your online store. Includes traffic routing and SSL.': '用于店铺前台访问，包含流量路由与 SSL。',
      'SSL is automatic': 'SSL 自动配置',
      'BestShopio issues and renews SSL certificates for every connected storefront domain. You never touch a certificate or a server.': 'BestShopio 会为每个已连接的店铺前台域名自动签发并续期 SSL 证书，无需手动管理证书或服务器。',
      'Email sending domains': '邮件发件域名',
      'BestShopio-managed default sending domain': 'BestShopio 托管的默认发件域名',
      'Store service email · Default': '店铺服务邮箱 · 默认',
      'Store registration email · Default': '店铺注册邮箱 · 默认',
      'Customers’ replies will be sent to this address.': '顾客回复邮件时，回复内容将发送到此地址。',
      'Enter a valid reply-to email address.': '请输入有效的回复邮箱地址。',
      'Used for transactional email. It does not create a storefront or checkout address.': '用于发送事务邮件；它不会创建店铺前台或结账地址。',
      'Sender domain': '发件域名',
      'The email address customers see is': '客户看到的电子邮件地址将显示为',
      '. Add a sending domain to make your brand more recognizable.': '。为了提高品牌辨识度，请添加发件域名。',
      'Default sender active': '默认发件人已启用',
      'Branded sender active': '品牌发件人已启用',
      'Connected': '已连接',
      'Connected · SSL active': '已连接 · SSL 已启用',
      'Pending verification': '待验证',
      'DNS error': 'DNS 错误',
      'SSL pending': 'SSL 签发中',
      'SSL failed': 'SSL 签发失败',
      'Free store domain · always available': '免费店铺域名 · 始终可用',
      'Primary domain': '主域名',
      'Set as primary': '设为主域名',
      'Redirect': '重定向',
      'Waiting for DNS records': '等待 DNS 记录',
      'DNS records not detected yet': '暂未检测到 DNS 记录',
      'Verify now': '立即验证',
      'View guide': '查看指引',
      'View details': '查看详情',
      'Verifying your sending domain…': '正在验证发件域名…',
      'We’re checking the DNS records for': '正在检查以下域名的 DNS 记录：',
      'This usually takes a few seconds.': '这通常只需几秒钟。',
      'You can safely leave this page.': '你可以安全离开此页面。',
      'Available variables': '可用变量',
      'Click a variable to insert it at the cursor. Blocks are inserted into the email body.': '点击变量可插入到光标处；预置区块会插入邮件正文。',
      'Only the variables and blocks listed here are supported.': '仅支持此处列出的变量和区块。',
      'Customer': '顾客',
      'Store': '店铺',
      'Order': '订单',
      'Order amounts': '订单金额',
      'Addresses': '地址',
      'Shipment': '物流',
      'Refund': '退款',
      'Prebuilt blocks': '预置区块',
      'Copy': '复制',
      'Variable inserted': '变量已插入',
      'Variable copied': '变量已复制',
      'DNS verified · issuing SSL certificate…': 'DNS 已验证 · 正在签发 SSL 证书…',
      'Retry': '重试',
      'Use a subdomain such as': '建议使用子域名，例如',
      'We will show the verification records after you add it.': '添加后，我们会展示 DNS 验证记录。',
      '. We will show the verification records after you add it.': '。添加后，我们会展示 DNS 验证记录。',
      'Add these DNS records at your DNS provider. Verification will continue automatically after the records are found.': '请在你的 DNS 服务商处添加以下记录。检测到记录后会自动继续验证。',
      'Copy': '复制',
      'DNS record copied': 'DNS 记录已复制',
      'Waiting for DNS': '等待 DNS',
      'Active sender domain': '当前发件域名',
      'View DNS records': '查看 DNS 记录',
      'Email title': '邮件标题',
      'Message': '邮件正文',
      'Record test preview': '记录测试预览',
      'Send test': '发送测试邮件',
      'Edit code': '编辑代码',
      'Notifications': '通知',
      'Edit': '编辑',
      'Localize': '本地化',
      'Template variables': '模板变量',
      'Email subject': '电子邮件主题',
      'Email body (HTML)': '电子邮件正文（HTML）',
      'Use the back button to check the rendered email.': '使用左上角返回按钮查看渲染后的邮件。',
      'You can use supported customer, order, and store variables in this template. Order, tracking, invoice, and address blocks are rendered safely when the email is sent.': '可在模板中使用受支持的顾客、订单和店铺变量。订单、物流、发票和地址区块会在发送时安全渲染。',
      'Add another store language to create a localized template.': '添加其他店铺语言后，即可创建本地化模板。',
      'Send test email': '发送测试邮件',
      'Recipient': '收件人',
      'Shown in the customer inbox for every transactional message.': '显示在每一封事务邮件的顾客收件箱中。',
      'Customer replies go to this address.': '顾客回复会发送到此地址。',
      'Save sender identity': '保存发件身份',
      'The email delivery service supplies the DNS records when you add a candidate domain. Domains cannot be edited; add a new candidate, verify it, then make it active.': '添加候选域名后，邮件发送服务会提供 DNS 记录。域名创建后不可编辑；如需修改，请新建候选域名、完成验证后再设为当前域名。',
      'Add sending domain': '添加发件域名',
      'Create DNS records': '生成 DNS 记录',
      'Domain': '域名',
      'Remove sending domain?': '移除发件域名？',
      'Remove domain': '移除域名',
      'Complete the sender identity fields': '请填写完整的发件身份信息',
      'Sender identity saved': '发件身份已保存',
      'Active sender domain updated': '当前发件域名已更新',
      'Sending domain removed': '发件域名已移除',
      'Enter a valid domain': '请输入有效域名',
      'This sending domain is already added': '该发件域名已添加',
      'Configure DNS': '配置 DNS',
      'Add these DNS records at your domain provider': '在你的域名服务商处添加以下 DNS 记录',
      'Type': '类型',
      'Name': '名称',
      'Value': '记录值',
      'Verify again': '再次验证',
      "We couldn't detect your DNS records yet.": '暂未检测到你的 DNS 记录。',
      'Double-check the records, then verify again.': '请检查记录是否正确后再次验证。',
      'Connect your sending domain': '连接你的发件域名',
      'Add the DNS records for': '请为以下域名添加 DNS 记录：',
      '. We will verify them automatically.': '。系统会自动验证这些记录。',
      'If verification does not pass': '如果验证未通过',
      'DNS changes can take up to 30 minutes — sometimes a few hours — to take effect.': 'DNS 记录变更最多可能需要 30 分钟生效，偶尔也可能需要数小时。',
      'Check that every record above is present exactly as shown.': '请确认以上每条记录均已添加，且内容与页面展示完全一致。',
      'If your DNS provider supports proxying (for example, Cloudflare), set these verification records to DNS only.': '如果你的 DNS 服务商支持代理（例如 Cloudflare），请将这些验证记录设置为“仅 DNS”。',
      'After updating the records, wait a few minutes and verify again.': '更新记录后，请等待几分钟再重新验证。',
      'Got it': '知道了',
      'Domain verification updated': '域名验证状态已更新',
      'Send a test email with sample order data to check the recipient and message layout.': '向指定地址发送一封包含示例订单数据的测试邮件，用于检查收件人和邮件版式。',
      'Test email sent': '测试邮件已发送'
    });
  }
  if (window.I18N && window.I18N.addRules) {
    window.I18N.addRules([
      { re: /^The address uses the active connected domain: @(.+)\.$/, zh: function (m) { return '发件地址使用当前已连接域名：@' + m[1] + '。'; } },
      { re: /^DNS records for (.+)$/, zh: function (m) { return m[1] + ' 的 DNS 记录'; } },
      { re: /^DNS records created for (.+)$/, zh: function (m) { return '已为 ' + m[1] + ' 生成 DNS 记录'; } },
      { re: /^Redirects to (.+) ·$/, zh: function (m) { return '重定向至 ' + m[1] + ' ·'; } },
      { re: /^Waiting for DNS records ·$/, zh: function () { return '等待 DNS 记录 ·'; } },
      { re: /^DNS records not detected yet ·$/, zh: function () { return '暂未检测到 DNS 记录 ·'; } },
      { re: /^SSL issuance failed ·$/, zh: function () { return 'SSL 证书签发失败 ·'; } },
      { re: /^Test email sent to (.+)$/, zh: function (m) { return '测试邮件已发送至 ' + m[1]; } }
    ]);
  }

  // ---- toast — same top-centred card as BestCheckout (green circle + check) ----
  const toast = (msg, type) => {
    const level = type || (/failed|error|失败/i.test(String(msg)) ? 'error' : 'success');
    const tone = level === 'error' ? '#ff4d4f' : level === 'warning' ? '#faad14' : '#52c41a';
    const glyph = level === 'error' ? '×' : level === 'warning' ? '!' : '✓';
    document.querySelectorAll('.set-message').forEach((message) => message.remove());
    const t = document.createElement('div');
    t.className = 'set-message ' + level;
    t.setAttribute('role', 'status');
    t.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);display:inline-flex;align-items:center;gap:8px;max-width:min(560px,calc(100vw - 48px));padding:9px 16px;background:#fff;color:rgba(0,0,0,.88);border-radius:8px;font-size:14px;line-height:1.45;z-index:300;box-shadow:0 6px 16px rgb(0 0 0 / 8%),0 3px 6px -4px rgb(0 0 0 / 12%),0 9px 28px 8px rgb(0 0 0 / 5%)';
    t.innerHTML = '<span aria-hidden="true" style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:' + tone + ';color:#fff;font-size:12px;font-weight:700;line-height:1;flex:none">' + glyph + '</span><span></span>';
    t.lastElementChild.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  };

  // ---- confirm dialog (mirrors Ant Modal.confirm) ----
  const confirm = (opts) => modal({
    title: opts.title, width: opts.width || 460,
    body: '<div class="muted" style="font-size:13.5px;line-height:1.6">' + esc(opts.content) + '</div>',
    okText: opts.okText || 'OK', danger: opts.danger,
    onOk: (m, close) => { close(); opts.onOk && opts.onOk(); },
  });

  // ===== shared small builders (reuse theme classes) =====
  // Linked/Not linked dot pill (matches render.tsx tag-dot-success / tag-dot-bg)
  const linkedPill = (linked) => linked
    ? '<span class="pill pill-green"><span class="dot"></span>Linked</span>'
    : '<span class="pill pill-gray"><span class="dot"></span>Not linked</span>';

  const sectionTitle = (t, sub) =>
    '<div class="card-title">' + esc(t) + '</div>' + (sub ? '<div class="muted" style="font-size:12.5px;margin-top:2px">' + esc(sub) + '</div>' : '');

  // a soft grey inner block (mirrors the borderless .b-c rows in the admin: #f7f8fb, no border)
  const block = (inner, bg) => '<div class="b-c" style="padding:14px 16px' + (bg ? ';background:' + bg : '') + '">' + inner + '</div>';

  // an Ant-style Switch (visual)
  let sw = 0;
  const toggle = (on, label, key) => {
    const id = key || ('sw' + (++sw));
    return '<label class="set-switch' + (on ? ' on' : '') + '" data-toggle="' + id + '"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '><span class="set-knob"></span></label>';
  };

  // ===========================================================================
  // PAINT: shell renders the sidebar + "Settings" bar; we render ONLY the active
  // sub-page content into #root. Edit-like centered pages use .detail-wrap.
  // ===========================================================================
  // `centered` pages mirror the real admin's centered w-[860px] forms.
  function paint(bodyHtml, centered) {
    root.innerHTML =
      '<style>' + STYLES + '</style>' +
      (centered ? '<div class="set-narrow">' + bodyHtml + '</div>' : bodyHtml);
    if (window.I18N && window.I18N.apply) window.I18N.apply(root);
    // wire generic toggles (visual only)
    root.querySelectorAll('[data-toggle]').forEach((el) => el.onclick = () => el.classList.toggle('on'));
    // image upload tiles → open the OS file chooser (Store logo/ico/no-data, Checkout logo)
    root.querySelectorAll('.up-tile').forEach((el) => el.onclick = () => openFilePicker());
  }

  // open the native local-file chooser (prototype: selection is visual only)
  function openFilePicker(options) {
    const opts = options || {};
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = opts.accept == null ? 'image/png,image/jpeg,image/svg+xml,.ico' : opts.accept;
    inp.style.display = 'none';
    inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) { if (opts.onSelected) opts.onSelected(f); else toast('Selected ' + f.name); } inp.remove(); };
    document.body.appendChild(inp);
    inp.click();
  }

  // a Page-style header (title + optional description + optional right slot)
  const pageHead = (title, sub, rightHtml) =>
    '<div class="flex items-start justify-between mb-4" style="gap:12px">' +
      '<div><div class="page-title" style="font-size:20px">' + esc(title) + '</div>' +
        (sub ? '<div class="muted" style="font-size:13px;margin-top:2px">' + esc(sub) + '</div>' : '') + '</div>' +
      '<div class="flex items-center gap-2">' + (rightHtml || '') + '</div>' +
    '</div>';

  const updateBtn = '<button class="btn btn-primary" data-act="save">Update</button>';

  // editable text field for a modal. `secret` only adds a "masked" note — the
  // value itself is always masked in DATA for secret fields.
  function field(label, value, placeholder, opts) {
    opts = opts || {};
    const v = value || '';
    const req = opts.optional ? '' : ' <span style="color:var(--err)">*</span>';
    const learn = opts.learnMore ? '<a class="lnk" href="' + esc(opts.learnMore) + '" target="_blank" rel="noreferrer" style="font-weight:400;float:right">Learn more</a>' : '';
    const addon = opts.addonBefore
      ? '<div class="set-addon"><span class="set-addon-prefix">' + esc(opts.addonBefore) + '</span><input class="input" value="' + esc(v) + '" placeholder="' + esc(placeholder || '') + '" style="border-top-left-radius:0;border-bottom-left-radius:0" /></div>'
      : '<input class="input" value="' + esc(v) + '" placeholder="' + esc(placeholder || '') + '" />';
    return '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">' + esc(label) + req + learn + '</div>' +
      addon +
      (opts.secret && v ? '<div class="muted" style="font-size:11.5px;margin-top:4px">Stored securely · value is masked</div>' : '') +
      (opts.hint ? '<div class="muted" style="font-size:11.5px;margin-top:4px">' + esc(opts.hint) + '</div>' : '') +
      '</div>';
  }

  // PC + Mobile preview modal (NoDataPreviewModal / checkout preview modal)
  function openPreviewModal(title) {
    modal({ title: title, width: 760, okText: 'Complete', hideCancel: true,
      body:
        '<div style="display:grid;grid-template-columns:3fr 2fr;gap:20px">' +
          '<div><div class="text-sm" style="text-align:center;font-weight:600;color:var(--ink);margin-bottom:10px">PC Display</div>' +
            '<div class="preview-frame" style="height:230px"><span class="muted">Storefront PC preview</span></div></div>' +
          '<div><div class="text-sm" style="text-align:center;font-weight:600;color:var(--ink);margin-bottom:10px">Mobile Display</div>' +
            '<div class="preview-frame" style="height:230px"><span class="muted">Mobile preview</span></div></div>' +
        '</div>',
      onOk: (m, close) => close() });
  }

  // ===========================================================================
  // TAB 1 — BASE  ("Basic settings", centered w-860)
  //   render.tsx: Store information / Product information / Order information /
  //   Login through social media (Google only). One Update btn.
  // ===========================================================================
  function renderBase() {
    const b = D.base;

    const uploadCard = (u, label, desc, previewTitle) => {
      const tile = u.set
        ? '<div class="up-tile filled"><span class="up-ico">' + I.image + '</span><span class="up-name">' + esc(u.name) + '</span>' +
            '<button class="up-x" title="Remove">' + I.x + '</button></div>'
        : '<div class="up-tile"><span class="up-plus">' + I.plus + '</span><span class="up-add">Add images</span></div>';
      return block(
        '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:2px">' + esc(label) + '</div>' +
        '<div class="muted" style="font-size:12.5px;margin-bottom:10px">' + esc(desc) +
          ' <a class="lnk" data-preview="' + esc(previewTitle) + '">Preview display here.</a>' +
          ' Recommended size: ' + esc(u.rec) + ', format: ' + esc(u.format) + '.</div>' +
        tile
      );
    };

    const fontTags = b.store.fonts.map((f) =>
      '<span class="field-pill">' + esc(f) + ' <span class="x" data-font="' + esc(f) + '">&times;</span></span>').join('');

    // V1.129 §7.4 Store: editable Store name (0/30) + read-only url / currency / time zone
    const sd = b.store.details || { name: 'Lovocross', url: 'm.lovocross.com', currency: 'USD $', timezone: 'GMT-04:00' };
    const detailRow = (label, value) =>
      '<div class="flex items-center gap-3"><span class="text-sm" style="font-weight:600;color:var(--ink);min-width:140px">' + esc(label) + '</span>' +
      '<span class="muted" style="font-size:13px">' + esc(value) + '</span></div>';
    const storeDetailsBlock = block(
      '<div class="flex flex-col gap-4">' +
        '<div>' +
          '<div class="flex items-center justify-between" style="margin-bottom:6px">' +
            '<span class="text-sm" style="font-weight:600;color:var(--ink)">Store name</span>' +
            '<span class="muted" id="sd-name-cnt" style="font-size:12px">' + (sd.name || '').length + '/30</span></div>' +
          '<input class="input" style="width:100%" maxlength="30" placeholder="Please enter" value="' + esc(sd.name) + '"' +
            ' oninput="var e=document.getElementById(\'sd-name-cnt\');if(e)e.textContent=this.value.length+\'/30\'">' +
        '</div>' +
        detailRow('Store url', sd.url) +
        detailRow('Default currency', sd.currency) +
        detailRow('Default time zone', sd.timezone) +
      '</div>'
    );

    const storeCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Store information') +
        '<div class="mt-4 flex flex-col gap-4">' +
          storeDetailsBlock +
          uploadCard(b.store.logo, 'Store logo', 'This logo is displayed on the store.', 'Display Position of Store logo') +
          uploadCard(b.store.ico, 'Store ico', 'The icon displayed in the browser window.', 'Display Position of Store ico') +
          uploadCard(b.store.noData, 'No data icon', 'This logo is displayed on the store.', 'Display Position of No data icon') +
          block(
            '<div class="flex items-center justify-between mb-1">' +
              '<div><div class="text-sm" style="font-weight:600;color:var(--ink)">Store Font</div>' +
              '<div class="muted" style="font-size:12.5px">Add your preferred fonts to control store typography.</div></div>' +
              '<button class="btn btn-gray" data-act="add-font">Add font</button>' +
            '</div>' +
            '<div class="flex flex-wrap gap-1 mt-3">' + (fontTags || '<span class="muted" style="font-size:12.5px">No fonts added</span>') + '</div>'
          ) +
        '</div>' +
      '</div>';

    const prodRow = (p, name) => block(
      '<div class="flex items-center gap-3 mb-1"><span class="text-sm" style="font-weight:600;color:var(--ink)">' + esc(name) + '</span>' + toggle(p.on, name) + '</div>' +
      '<div class="muted" style="font-size:12.5px">' + esc(p.desc) + '</div>'
    );
    const productCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Product information') +
        '<div class="mt-4 flex flex-col gap-4">' +
          prodRow(b.product.reviews, 'Product Reviews') +
          prodRow(b.product.original, 'Original Price') +
        '</div>' +
      '</div>';

    const orderCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Order information') +
        '<div class="mt-4 flex flex-col gap-4">' +
          block(
            '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:2px">Order ID prefix</div>' +
            '<div class="muted" style="font-size:12.5px;margin-bottom:8px">Order ID starts from 1001 by default. You may add a prefix to create custom IDs. e.g. "EN1001"</div>' +
            '<input class="input" id="ord-prefix" maxlength="10" placeholder="Please enter" value="' + esc(b.order.prefix) + '" style="width:300px" />' +
            '<div class="muted" style="font-size:12.5px;margin-top:6px">Order ID will be displayed as <span class="subtle" id="ord-prefix-eg">' + esc(b.order.prefix) + '1001, ' + esc(b.order.prefix) + '1002, ' + esc(b.order.prefix) + '1003...</span></div>'
          ) +
          block(
            '<div class="flex items-center gap-3 mb-1"><span class="text-sm" style="font-weight:600;color:var(--ink)">Order Auto-Cancel Time</span>' +
              '<div class="set-addon"><input class="input" type="number" id="ord-autocancel" value="' + b.order.autoCancelMinutes + '" min="1" max="1440" style="width:140px;border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">Minutes</span></div></div>' +
            '<div class="muted" style="font-size:12.5px">Cancels unpaid checkouts that never collected an email or phone number. These never become abandoned checkouts. Abandoned checkouts use the recovery window instead.</div>' +
            '<div class="muted" style="font-size:12.5px;color:#c2410c;display:none;margin-top:6px" id="ord-autocancel-err"></div>'
          ) +
          block(
            '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:2px">Abandoned checkout delay</div>' +
            '<div class="text-sm" style="color:var(--ink);margin-bottom:6px">10 minutes</div>' +
            '<div class="muted" style="font-size:12.5px">After the buyer leaves an email, an unpaid checkout becomes abandoned in about 10 minutes. This time cannot be changed.</div>'
          ) +
          block(
            '<div class="flex items-center gap-3 mb-1"><span class="text-sm" style="font-weight:600;color:var(--ink)">Recovery window</span>' +
              '<div class="set-addon"><input class="input" type="number" id="ord-recovery-window" value="' + (b.order.recoveryWindowHours || 48) + '" min="24" max="336" style="width:140px;border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">Hours</span></div></div>' +
            '<div class="muted" style="font-size:12.5px">Recoverable unpaid checkouts stay open for this window so a reminder can be sent. Default 48 hours.</div>' +
            '<div class="muted" style="font-size:12.5px;color:#c2410c;display:none;margin-top:6px" id="ord-recovery-window-err"></div>'
          ) +
          block(
            '<div class="flex items-center gap-3 mb-1"><span class="text-sm" style="font-weight:600;color:var(--ink)">Order Auto-Receive Time</span>' +
              '<div class="set-addon"><input class="input" type="number" value="' + b.order.autoReceiveDays + '" min="1" max="100" style="width:140px;border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">Days</span></div></div>' +
            '<div class="muted" style="font-size:12.5px">Orders are auto-Receive after a set number of days from shipping (e.g., 10 days).</div>'
          ) +
        '</div>' +
      '</div>';

    const bestfulfill = b.bestfulfill || { omsStoreId: '', omsIdentifier: '' };
    const bestfulfillCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Bestfulfill ERP', 'Enter the ERP identifiers Bestfulfill uses when processing fulfillment for this store.') +
        '<div class="mt-4 flex flex-col gap-4">' +
          block(
            '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:2px">oms_store_id</div>' +
            '<div class="muted" style="font-size:12.5px;margin-bottom:8px">Store identifier used by Bestfulfill ERP for fulfillment.</div>' +
            '<input class="input" id="bestfulfill-oms-store-id" maxlength="120" autocomplete="off" placeholder="Please enter" value="' + esc(bestfulfill.omsStoreId) + '" style="width:100%" />'
          ) +
          block(
            '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:2px">oms_identifier</div>' +
            '<div class="muted" style="font-size:12.5px;margin-bottom:8px">Identifier used by Bestfulfill ERP to route fulfillment orders.</div>' +
            '<input class="input" id="bestfulfill-oms-identifier" maxlength="120" autocomplete="off" placeholder="Please enter" value="' + esc(bestfulfill.omsIdentifier) + '" style="width:100%" />'
          ) +
        '</div>' +
      '</div>';

    const socialRow = (s) =>
      '<div class="flex items-center justify-between" style="padding:12px 0">' +
        '<div class="flex items-center gap-3">' + I.globe +
          '<span class="text-sm" style="font-weight:600;color:var(--ink)">' + esc(s.name) + '</span>' + linkedPill(s.linked) +
        '</div>' +
        '<button class="btn btn-gray" data-social="' + s.key + '">' + (s.linked ? 'Edit' : 'Link') + '</button>' +
      '</div>';
    const socialCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Login through social media', 'After connecting, customers can log in to the online store through their social media accounts.') +
        '<div class="mt-2">' + block(b.social.map(socialRow).join('')) + '</div>' +
      '</div>';

    paint(
      pageHead('Basic settings') +
      storeCard + productCard + orderCard + bestfulfillCard + socialCard +
      '<div class="flex justify-end">' + updateBtn + '</div>',
      true
    );

    // wiring
    root.querySelectorAll('[data-act="save"]').forEach((b2) => b2.onclick = () => {
      b.bestfulfill = b.bestfulfill || {};
      const omsStoreId = root.querySelector('#bestfulfill-oms-store-id');
      const omsIdentifier = root.querySelector('#bestfulfill-oms-identifier');
      b.bestfulfill.omsStoreId = omsStoreId ? omsStoreId.value.trim() : '';
      b.bestfulfill.omsIdentifier = omsIdentifier ? omsIdentifier.value.trim() : '';
      toast('Settings updated successfully');
    });
    root.querySelectorAll('[data-preview]').forEach((b2) => b2.onclick = () => openPreviewModal(b2.getAttribute('data-preview')));
    const addFont = root.querySelector('[data-act="add-font"]'); if (addFont) addFont.onclick = () => openAddFontModal();
    root.querySelectorAll('[data-font]').forEach((x) => x.onclick = () => toast('Removed font ' + x.getAttribute('data-font')));
    root.querySelectorAll('[data-social]').forEach((b2) => b2.onclick = () => openLoginModal(b2.getAttribute('data-social')));
    const pfx = root.querySelector('#ord-prefix');
    if (pfx) pfx.oninput = () => { const v = pfx.value || ''; const eg = root.querySelector('#ord-prefix-eg'); if (eg) eg.textContent = v + '1001, ' + v + '1002, ' + v + '1003...'; };
    const bindNumberField = (id, errId, min, max, emptyMsg, rangeMsg, onOk) => {
      const input = root.querySelector('#' + id);
      const err = root.querySelector('#' + errId);
      if (!input || !err) return;
      input.onblur = () => {
        const raw = String(input.value || '').trim();
        const n = Number(raw);
        if (!raw) { err.textContent = emptyMsg; err.style.display = 'block'; input.classList.add('err'); return; }
        if (!Number.isFinite(n) || n < min || n > max) { err.textContent = rangeMsg; err.style.display = 'block'; input.classList.add('err'); return; }
        err.textContent = ''; err.style.display = 'none'; input.classList.remove('err');
        onOk(n);
      };
    };
    bindNumberField('ord-autocancel', 'ord-autocancel-err', 1, 1440, 'Enter an auto-cancel time.', 'Enter a time between 1 and 1440 minutes.', (n) => { b.order.autoCancelMinutes = n; });
    bindNumberField('ord-recovery-window', 'ord-recovery-window-err', 24, 336, 'Enter a recovery window.', 'Enter a recovery window between 24 and 336 hours.', (n) => { b.order.recoveryWindowHours = n; });
  }

  // Add font — mirrors fontModel.tsx: "Font:" label + Ant Select(mode=multiple) of
  // removable font tags, grey Cancel + orange (#db4015) OK.
  function openAddFontModal() {
    const sel = D.base.store.fonts.slice();
    const chips = () => sel.map((f) =>
      '<span class="ms-tag">' + esc(f) + '<span class="ms-x" data-rm="' + esc(f) + '">&times;</span></span>').join('');
    const ctrl = modal({
      title: 'Add font', width: 400, okText: 'OK',
      okStyle: 'background:#db4015;border-color:#db4015;color:#fff',
      body:
        '<div style="padding:8px 0 0">' +
          '<div class="flex items-center gap-4" style="margin-bottom:24px">' +
            '<span class="text-sm" style="font-weight:500;color:var(--ink);width:48px;flex:none">Font:</span>' +
            '<div class="ms-box" id="ms-box" style="flex:1"></div>' +
          '</div>' +
        '</div>',
      onOk: (m, close) => { close(); toast('Store fonts updated'); },
    });
    const box = ctrl.m.querySelector('#ms-box');
    const paint = () => {
      box.innerHTML = chips() + '<input class="ms-input" placeholder="' + (sel.length ? '' : 'Select') + '" />';
      box.querySelectorAll('[data-rm]').forEach((x) => x.onclick = () => {
        const f = x.getAttribute('data-rm'); const i = sel.indexOf(f); if (i > -1) sel.splice(i, 1); paint();
      });
    };
    paint();
  }
  function openLoginModal(key) {
    const s = D.base.social.find((x) => x.key === key);
    const body =
      '<div class="muted mb-4" style="font-size:13px">' + esc(s.blurb) + '</div>' +
      field('App ID', s.fields.appId, 'Please enter App ID') +
      field('App Secret', s.fields.appSecret, 'Please enter App Secret', { secret: true }) +
      field('Redirect URIs', s.fields.redirectUris, "Please enter Redirect URIs, You can enter your store's homepage URL.");
    modal({ title: s.modalTitle, width: 620, okText: 'Save',
      body, onOk: (m, close) => { close(); toast(s.linked ? 'Edit successfully' : 'Connected successfully'); },
      extraLeft: s.linked ? '<button class="btn" style="background:var(--err);color:#fff" data-disc>Cancel connection</button>' : '',
      onExtra: (m, close) => { close(); toast('Cancelled connection successfully'); } });
  }
  // ===========================================================================
  // TAB 2 — PAYMENTS  ("Payments", centered w-860)
  //   render.tsx: "Card Payments & Express Checkout" card (processor radio +
  //   Airwallex then Stripe rows: logo + method icons + Linked dot + Edit/Link)
  //   then a separate PayPal card. Credentials are entered in modals only.
  // ===========================================================================
  // ---- v2 资源 / 能力 ----
  const PAY_ASSET = 'settings/assets/payments/';
  const payImg = (f, hh) => '<img src="' + PAY_ASSET + f + '" style="height:' + (hh || 18) + 'px" alt=""/>';
  const PAY_ICON = {
    cards: payImg('visa.svg', 20) + payImg('mastercard.svg', 20) + payImg('amex.svg', 20) + payImg('unionpay.svg', 20),
    applepay: payImg('applepay.svg'), googlepay: payImg('googlepay.svg'), link: payImg('link.svg'),
    amazonpay: payImg('amazonpay.svg'), klarna: payImg('klarna.svg'), paypal: payImg('paypal-logo.svg', 16),
  };
  // 各处理方「我们采用的集成方式」下 Express 块实际能出的方式。
  // PayPal 的 Card、Apple Pay、Google Pay 共用一个收款账户；具体钱包仍受
  // PayPal 能力、Checkout 域名和买家设备/浏览器共同约束。
  // NMI 的 Apple Pay、Google Pay 不支持订阅和追加扣款，显示在银行卡下方，不进 Express。
  // Oceanpayment 的 Google Pay 与银行卡一样支持支付、订阅、追加扣款和退款，显示在银行卡下方，不进 Express。Apple Pay 尚未对接。
  // Mollie=Components(GooglePay 待确认) / Braintree=Hosted Fields
  const PAY_EXPRESS = {
    stripe: ['applepay', 'googlepay', 'link', 'klarna', 'amazonpay'], airwallex: ['applepay', 'googlepay'],
    paypal_cards: ['applepay', 'googlepay'], adyen: ['applepay', 'googlepay'], checkout: ['applepay', 'googlepay'], mollie: ['applepay'], nmi: [], braintree: ['applepay', 'googlepay'],
    worldpay: [], nuvei: ['applepay', 'googlepay'], antom: [], useepay: ['applepay'], oceanpay: [],
    tazapay: [], square: ['applepay', 'googlepay'], poynt: ['applepay', 'googlepay'],
  };
  // 显示在银行卡下方、不进 Express Checkout 的钱包。
  const PAY_UNDER_CARD = {
    nmi: ['applepay', 'googlepay'],
    oceanpay: ['googlepay'],
  };
  // Official merchant dashboards. Stripe has a public payment-methods URL; others
  // land on login / dashboard home because payment-method pages need an account context.
  const PAY_DASH = {
    stripe: 'https://dashboard.stripe.com/settings/payment_methods',
    airwallex: 'https://www.airwallex.com/app/login',
    adyen: 'https://ca-live.adyen.com/ca/ca/login.shtml',
    checkout: 'https://dashboard.checkout.com',
    mollie: 'https://my.mollie.com/dashboard/login',
    nmi: 'https://secure.nmi.com/merchants/login.php',
    braintree: 'https://www.braintreegateway.com/login',
    paypal: 'https://developer.paypal.com/dashboard',
    paypal_cards: 'https://developer.paypal.com/dashboard',
    worldpay: 'https://dashboard.worldpay.com/',
    nuvei: 'https://cpanel.nuvei.com/',
    antom: 'https://dashboard.antom.com/',
    useepay: 'https://merchants.useepay.com/',
    oceanpay: 'https://accounts.oceanpayment.com/',
  };
  function pDashLink(key, label) {
    const href = PAY_DASH[key];
    if (!href) return '<span class="lnkico">' + label + '</span>';
    return '<a class="lnkico" href="' + href + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
  }
  // 连接弹窗字段规格（Stripe / Airwallex 字段、文案、Learn more 链接对齐线上 StripeAccount / AirwallexAccount）
  const PAY_FORMS = {
    stripe: { desc: 'Allows users to pay with Card, Apple Pay, Google Pay, Link, Amazon Pay, and Klarna (where available).',
      fields: [
        { k: 'pub', label: 'Publishable Key', msg: 'Please enter Publishable Key' },
        { k: 'sec', label: 'Secret Key', msg: 'Please enter Secret Key' },
      ] },
    airwallex: { desc: 'Allows users to pay with Visa, Master Card, American Express, Discover, Diners Club, JCB, Apple Pay, Google Pay',
      fields: [
        { k: 'appkey', label: 'App Key', msg: 'Please enter App Key' },
        { k: 'cid', label: 'Client ID', msg: 'Please enter Client ID' },
      ], file: { label: 'Airwallex domain verification file', button: 'Upload ZIP', hint: 'Only .zip files up to 1MB are supported.', accept: '.zip' } },
    paypal: { desc: 'Allows users to pay with Visa, Master Card, American Express, Discover, Diners Club, JCB, Apple Pay, Google Pay', fields: [
      { k: 'cid', label: 'Client ID', msg: 'Please enter Client ID' }, { k: 'sec', label: 'Secret key', msg: 'Please enter Secret key' },
    ], file: { label: 'PayPal domain verification file', button: 'Upload file', accept: '', marginBottom: 16 } },
    adyen: { fields: [
      { k: 'api', label: 'API key', msg: 'Please enter API key' },
      { k: 'ck', label: 'Client key', msg: 'Please enter Client key' },
      { k: 'mer', label: 'Merchant account', msg: 'Please enter Merchant account' },
      { k: 'mapi', label: 'Management API key', msg: 'Please enter Management API key' },
      { k: 'prefix', label: 'Live URL prefix', msg: 'Please enter Live URL prefix', value: '/' },
    ], file: { label: 'Adyen domain verification file', button: 'Upload file', accept: '', marginBottom: 16 },
      afterFile: [{ k: 'gpay', label: 'Google Pay merchant ID', optional: true }] },
    checkout: { fields: [
      { k: 'sec', label: 'Secret key', msg: 'Please enter Secret key' },
      { k: 'pub', label: 'Public key', msg: 'Please enter Public key' },
      { k: 'cid', label: 'Client ID', msg: 'Please enter Client ID' },
      { k: 'chid', label: 'Processing channel ID', optional: true },
    ], file: { label: 'Checkout domain verification file', button: 'Upload file', accept: '', marginBottom: 16 },
      afterFile: [
        { k: 'oauthid', label: 'OAuth client ID', optional: true },
        { k: 'oauthsec', label: 'OAuth client secret', optional: true },
      ] },
    mollie: { fields: [
      { k: 'api', label: 'API key', msg: 'Please enter API key' },
      { k: 'pid', label: 'Profile ID', msg: 'Please enter Profile ID' },
    ], file: { label: 'Mollie domain verification file', button: 'Upload file', accept: '', marginBottom: 16 } },
    nmi: { desc: 'Allows users to pay with Visa, Mastercard, American Express, Discover, Diners Club, and JCB. Apple Pay and Google Pay appear under Cards. Those wallets do not support subscriptions or additional charges.',
      fields: [
        { k: 'sk', label: 'Security key', msg: 'Please enter Security key' },
        { k: 'tk', label: 'Tokenization key', msg: 'Please enter Tokenization key' },
        { k: 'hook', label: 'Webhook secret', optional: true },
        { k: 'v4', label: 'Merchant V4 API key', optional: true, hint: 'Create a Merchant V4 key under Options > Security Keys in the NMI Merchant Portal. Used to register your checkout domain for Apple Pay.' },
      ],
      file: { label: 'NMI domain verification file', button: 'Upload file', accept: '' } },
    braintree: { fields: [
      { k: 'pub', label: 'Public key', msg: 'Please enter Public key' },
      { k: 'priv', label: 'Private key', msg: 'Please enter Private key' },
      { k: 'mid', label: 'Merchant ID', msg: 'Please enter Merchant ID' },
      { k: 'gpay', label: 'Google merchant ID', optional: true },
    ], file: { label: 'Braintree domain verification file', button: 'Upload file', accept: '', marginBottom: 16 } },
    klarna_direct: { fields: [{ k: 'uid', label: 'API username (UID)' }, { k: 'pwd', label: 'API password' }, { k: 'region', label: 'Region（EU / NA / OC）' }] },
    worldpay: { desc: 'Allows users to pay with card. Apple Pay and Google Pay are not available with this connection.',
      fields: [
        { k: 'user', label: 'Username', msg: 'Please enter Username' },
        { k: 'pwd', label: 'Password', msg: 'Please enter Password' },
        { k: 'entity', label: 'Merchant entity', msg: 'Please enter Merchant entity' },
        { k: 'ckid', label: 'Checkout ID', msg: 'Please enter Checkout ID' },
      ] },
    nuvei: { desc: 'Allows users to pay with card, Apple Pay, and Google Pay.',
      fields: [
        { k: 'mid', label: 'Merchant ID', msg: 'Please enter Merchant ID' },
        { k: 'site', label: 'Merchant Site ID', msg: 'Please enter Merchant Site ID' },
        { k: 'sec', label: 'Secret key', msg: 'Please enter Secret key' },
      ] },
    antom: { desc: 'Allows users to pay with card. Alipay and other wallets from this same account appear by buyer country.',
      fields: [
        { k: 'cid', label: 'Client ID', msg: 'Please enter Client ID' },
        { k: 'priv', label: 'Merchant private key', msg: 'Please enter Merchant private key' },
        { k: 'pub', label: 'Antom public key', msg: 'Please enter Antom public key' },
      ] },
    useepay: { desc: 'Allows users to pay with card and Apple Pay. Google Pay is not available.',
      fields: [
        { k: 'mid', label: 'Merchant ID', msg: 'Please enter Merchant ID' },
        { k: 'app', label: 'App ID', msg: 'Please enter App ID' },
        { k: 'sec', label: 'Secret key', msg: 'Please enter Secret key' },
      ] },
    oceanpay: { desc: 'Allows users to pay with card and Google Pay. Google Pay appears under Cards and supports subscriptions and additional charges. Apple Pay is not integrated.',
      fields: [
        { k: 'cacct', label: 'Card account', msg: 'Please enter Card account' },
        { k: 'cterm', label: 'Card terminal', msg: 'Please enter Card terminal' },
        { k: 'csec', label: 'Card secure code', msg: 'Please enter Card secure code' },
        { k: 'cpub', label: 'Card public key', msg: 'Please enter Card public key' },
        { k: 'gacct', label: 'Google Pay account', optional: true },
        { k: 'gterm', label: 'Google Pay terminal', optional: true },
        { k: 'gsec', label: 'Google Pay secure code', optional: true },
        { k: 'gpub', label: 'Google Pay public key', optional: true },
      ] },
    tazapay: { desc: 'Allows users to pay with Visa, Mastercard and local QR methods such as PayNow, PromptPay, QRIS and QR Ph. Tazapay is hidden on subscription checkouts and does not support post-purchase one-click charges.',
      fields: [
        { k: 'key', label: 'API key', msg: 'Please enter API key' },
        { k: 'sec', label: 'API secret', msg: 'Please enter API secret' },
        { k: 'pub', label: 'Public key', msg: 'Please enter Public key' },
        { k: 'hook', label: 'Webhook secret', optional: true },
      ],
      checksTitle: 'QR payment methods',
      checksNote: 'Shown only to buyers in the matching country; they pay in local currency at the Tazapay rate.',
      checks: [
        { k: 'paynow', label: 'PayNow (SGD)' },
        { k: 'promptpay', label: 'PromptPay (THB)' },
        { k: 'qris', label: 'QRIS (IDR) - full refunds only' },
        { k: 'qrph', label: 'QR Ph (PHP) - refunds not supported' },
        { k: 'pix', label: 'PIX (BRL) - requires Tazapay approval' },
        { k: 'upi', label: 'UPI (INR) - full refunds only, requires Tazapay approval' },
      ] },
    square: { desc: 'Allows users to pay with Visa, Mastercard, American Express, Discover, JCB, Apple Pay and Google Pay in your Square location\'s currency. Apple Pay and Google Pay are hidden on subscription checkouts and don\'t support post-purchase one-click charges.',
      fields: [
        { k: 'app', label: 'Application ID', msg: 'Please enter Application ID' },
        { k: 'token', label: 'Access token', msg: 'Please enter Access token', hint: 'Use the access token on the Credentials page of the same application. OAuth tokens are not supported.' },
        { k: 'loc', label: 'Location ID', msg: 'Please enter Location ID', hint: 'Checkout is charged in this location\'s currency.' },
        { k: 'sig', label: 'Webhook signature key', optional: true, hint: 'Filled in automatically after saving. Only paste a key here if you created the webhook yourself.' },
      ],
      file: { label: 'Square domain verification file', button: 'Upload file', hint: 'Upload the domain verification file provided by Square.', accept: '' } },
    poynt: { desc: 'Allows users to pay with Visa, Mastercard, American Express, Discover, Apple Pay and Google Pay through GoDaddy Payments in your store currency (USD or CAD). Apple Pay and Google Pay are hidden on subscription checkouts and don\'t support post-purchase one-click charges.',
      fields: [
        { k: 'app', label: 'Application ID', msg: 'Please enter Application ID', hint: 'Paste the full APPLICATION ID value from GoDaddy Payments > Business Settings > Poynt Collect API Settings (businessId=urn:aid:...).' },
        { k: 'priv', label: 'Private key', msg: 'Please enter Private key', type: 'textarea', hint: 'The private key generated together with the application ID. Checkout is charged in your store currency (USD or CAD).' },
      ],
      file: { label: 'Poynt domain verification file', button: 'Upload file', hint: 'Optional. Leave it empty and the Apple Pay file is fetched from GoDaddy Payments when you save, then shown here; upload one only to override it.', accept: '' },
      modeHint: 'Choose Live for credentials from GoDaddy Payments, including test merchants (their transactions are never charged). Choose Sandbox only for credentials issued in GoDaddy\'s separate OTE environment.',
      modeHintZh: '使用 GoDaddy Payments 的凭证请选正式，包括测试商户（这些交易不会实际扣款）。只有 GoDaddy 单独的 OTE 环境签发的凭证才选沙盒。' },
  };

  const ppCapKey = (id) => ({ applepay: 'applePay', googlepay: 'googlePay' }[id] || id);
  function ppCap(id) { return (D.payments.paypal.capabilities || {})[ppCapKey(id)] || 'unavailable'; }
  function pPaypalExpress() {
    return PAY_EXPRESS.paypal_cards.filter((id) => ppCap(id) === 'enabled');
  }
  function pExpressFor(processor) {
    if (!processor) return [];
    return processor.key === 'paypal_cards' ? pPaypalExpress().slice() : (PAY_EXPRESS[processor.key] || []).slice();
  }
  function pUnderCard(processor) {
    if (!processor) return [];
    return (PAY_UNDER_CARD[processor.key] || []).slice();
  }
  // PayPal Cards reuses the connected PayPal account. It is a primary-card candidate
  // and supplies Card Fields plus eligible Express wallets, never a second card form.
  // Chip order follows live admin. Keys not in this list (Worldpay, Nuvei, Antom, UseePay)
  // sort after Poynt, which is the last chip on the live row.
  const PAY_CHIP_ORDER = ['airwallex', 'stripe', 'paypal_cards', 'adyen', 'checkout', 'nmi', 'braintree', 'mollie', 'oceanpay', 'tazapay', 'square', 'poynt'];
  const pProcsVis = () => {
    const pp = D.payments.paypal;
    const paypalCards = pp.connected && pp.capabilities.cards === 'enabled'
      ? [{ key: 'paypal_cards', name: 'PayPal', logo: 'paypal-logo.svg', connected: true, accountKey: 'paypal' }]
      : [];
    const rank = (key) => { const i = PAY_CHIP_ORDER.indexOf(key); return i < 0 ? PAY_CHIP_ORDER.length : i; };
    return D.payments.processors.concat(paypalCards).slice().sort((a, b) => rank(a.key) - rank(b.key));
  };
  const pConnected = () => pProcsVis().filter((p) => p.connected);
  function pActive() { let a = pProcsVis().find((p) => p.key === D.payments.cardProcessor && p.connected); if (!a) a = pConnected()[0] || null; return a; }
  const pLogo = (p, hh) => p.logo
    ? payImg(p.logo, hh || 20)
    : '<span class="pm-mono i18n-skip">' + esc(p.name) + '</span>';
  function pMethPill(connected) {
    if (!connected) return '<span class="pill pill-gray"><span class="dot"></span>Not connected</span>';
    return '<span class="pill pill-green"><span class="dot"></span>Connected</span>';
  }
  function pTazapayQrLabels(account) {
    const names = { paynow: 'PayNow (SGD)', promptpay: 'PromptPay (THB)', qris: 'QRIS (IDR)', qrph: 'QR Ph (PHP)', pix: 'PIX (BRL)', upi: 'UPI (INR)' };
    return ((account && account.qrMethods) || []).map((k) => names[k]).filter(Boolean);
  }
  // ① 卡 + Express 单处理方槽位（picker 内连接/切换/管理）
  function pSlot() {
    const a = pActive();
    const picker = '<div class="proc-pick"><span class="lab">Card processor</span>' +
      pProcsVis().map((p) => {
        if (p.connected) {
          const on = a && p.key === a.key;
          // ⚙ on every connected provider → edit credentials anytime; click a non-active name = switch
          const cog = '<button class="pchip-cog" data-cfg="' + (p.accountKey || p.key) + '" title="Manage credentials">⚙</button>';
          if (on) return '<span class="pchip on"><span class="pchip-name">' + pLogo(p, 15) + '</span>' + cog + '</span>';
          return '<span class="pchip"><button class="pchip-name" data-setproc="' + p.key + '" title="Set as processor">' + pLogo(p, 15) + '</button>' + cog + '</span>';
        }
        return '<button class="add" data-cfg="' + p.key + '">+ ' + esc(p.name) + '</button>';
      }).join('') + '</div>';
    if (!a) {
      return '<div class="panel card-pad"><div class="slot-head"><span class="slot-title">Cards &amp; Express processor</span>' + picker + '</div>' +
        '<div class="muted" style="padding:14px 0 4px;font-size:13px">No processor connected yet. Click “+ …” above to connect one and start accepting cards and Apple/Google Pay.</div></div>';
    }
    const paypalCards = a.key === 'paypal_cards';
    const antom = a.key === 'antom';
    const express = pExpressFor(a);
    const under = pUnderCard(a);
    const expIcos = express.map((id) => PAY_ICON[id]).join(' ');
    const fixedAddress = under.length > 0;
    const cardOnly = !express.length && !antom && !fixedAddress;
    const intro = antom
      ? 'Card fields use this Antom account. Wallets from the same account appear by buyer country.'
      : (a.key === 'oceanpay'
        ? 'Card input shows at checkout. Google Pay appears under Cards and supports subscriptions and additional charges. Apple Pay is not integrated.'
        : (a.key === 'tazapay'
          ? 'Tazapay is hidden on subscription checkouts and does not support post-purchase one-click charges. Selected QR methods appear for buyers in the matching country.'
          : (a.key === 'square' || a.key === 'poynt'
            ? 'Card input and Express Checkout both show at checkout. Apple Pay and Google Pay are hidden on subscription checkouts and don\'t support post-purchase one-click charges.'
            : (a.key === 'nmi'
              ? 'Card input shows at checkout. Apple Pay and Google Pay appear under Cards. Those wallets do not support subscriptions or additional charges.'
              : (fixedAddress
              ? 'Card input shows at checkout. Apple Pay and Google Pay appear under Cards.'
              : (cardOnly
                ? 'Once a processor is connected, card input shows at checkout. This processor does not provide Apple Pay or Google Pay.'
                : 'Once a processor is connected, card input and Express both show at checkout automatically; the specific wallets are auto-detected by buyer device/environment.'))))));
    const cardMeta = (paypalCards ? 'PayPal Card Fields · Visa / Mastercard / Amex …' : 'Visa / Mastercard / Amex / UnionPay …') + ' · ' + pDashLink(a.key, 'Manage in dashboard ↗');
    const underMeta = a.key === 'nmi'
      ? 'Apple Pay and Google Pay appear under Cards. They do not support subscriptions or additional charges.'
      : (a.key === 'oceanpay'
        ? 'Google Pay appears under Cards and supports subscriptions and additional charges. Apple Pay is not integrated.'
        : 'Apple Pay and Google Pay appear under Cards. They use a fixed shipping address, so buyers cannot change the shipping method.');
    const tazapayQr = a.key === 'tazapay' ? pTazapayQrLabels(a) : [];
    const expressMeta = a.key === 'tazapay'
      ? 'Apple Pay and Google Pay are not available.'
      : (a.key === 'square' || a.key === 'poynt'
        ? 'Apple Pay and Google Pay appear in Express Checkout. They are hidden on subscription checkouts and don\'t support post-purchase one-click charges.'
        : (a.key === 'oceanpay'
      ? 'Google Pay is not shown in Express Checkout. It appears under Cards and supports subscriptions and additional charges. Apple Pay is not integrated.'
      : (a.key === 'nmi'
        ? 'Apple Pay and Google Pay are not shown in Express Checkout. They appear under Cards and do not support subscriptions or additional charges.'
        : (fixedAddress
        ? 'Apple Pay and Google Pay are not shown in Express Checkout. They appear under Cards.'
      : (a.key === 'worldpay'
        ? 'Worldpay card checkout supports cards only. Apple Pay and Google Pay are not available.'
        : (a.key === 'useepay'
          ? 'Apple Pay appears when the UseePay account, checkout domain, and buyer device are eligible. Google Pay is not available.'
          : (a.key === 'nuvei'
            ? 'Apple Pay and Google Pay. Local methods such as iDEAL are not offered.'
            : (antom
              ? 'Apple Pay and Google Pay are not part of this connection.'
              : (cardOnly
                ? 'This processor supports card payments only. Apple Pay and Google Pay are not available.'
                : 'Auto-rendered by buyer environment')))))))));
    const underRow = fixedAddress
      ? '<div class="slot-row"><span class="ic">' + under.map((id) => PAY_ICON[id]).join(' ') + '</span><div class="bd"><span class="lbl">Under Cards</span><span class="meta">' + underMeta + '</span></div></div>'
      : '';
    const expressEmpty = fixedAddress ? 'Not in Express Checkout' : 'This processor has no Express';
    const expressRow = '<div class="slot-row"><span class="ic">' + (expIcos || '<span class="muted" style="font-size:12px">' + expressEmpty + '</span>') + '</span><div class="bd"><span class="lbl">Express Checkout</span><span class="meta">' + expressMeta + '</span></div></div>';
    const antomWallets = antom
      ? '<div class="slot-row"><span class="ic"><span class="pm-mono">Alipay</span></span><div class="bd"><span class="lbl">Wallets from this account</span><span class="meta">Alipay, AlipayHK, Kakao Pay, GCash, Touch \'n Go, and DANA appear by buyer country. They use this Antom account and are not connected separately.</span></div></div>'
      : '';
    const qrRow = a.key === 'tazapay'
      ? '<div class="slot-row"><span class="ic"><span class="pm-mono">QR</span></span><div class="bd"><span class="lbl">QR payment methods</span><span class="meta">' +
        (tazapayQr.length
          ? '<span class="i18n-skip">' + esc(tazapayQr.join(', ')) + '</span><br>Shown only to buyers in the matching country.'
          : 'No QR payment methods selected. Choose them when you manage this connection.') +
        '</span></div></div>'
      : '';
    return '<div class="panel card-pad slot-panel">' +
      '<div class="slot-head"><span class="slot-title">Processed by ' + esc(a.name) + '</span>' + picker + '</div>' +
      '<div class="sec-sub" style="margin:0 0 14px">' + intro + '</div>' +
      '<div class="slot-row"><span class="ic">' + PAY_ICON.cards + '</span><div class="bd"><span class="lbl">Cards</span><span class="meta">' + cardMeta + '</span></div></div>' +
      underRow +
      qrRow +
      expressRow +
      antomWallets +
    '</div>';
  }

  // ② 独立支付方式（PayPal / Klarna 自有直连）
  function pIndep() {
    let html = ''; const pp = D.payments.paypal;
    const venmoOn = pp.connected && (pp.capabilities || {}).venmo === 'enabled';
    const venmoNote = pp.connected
      ? (venmoOn
        ? '<div class="dnote">Venmo is included with this PayPal account and appears for buyers in the United States. It is not a separate connection.</div>'
        : '<div class="dnote">Venmo is not enabled on this PayPal account, so it does not appear for buyers.</div>')
      : '<div class="dnote">Venmo appears for buyers in the United States after this PayPal account is connected and Venmo is enabled. It is not a separate connection.</div>';
    html += '<div class="panel imeth paypal-method"><div class="imeth-head"><span class="lg">' + payImg('paypal-logo.svg', 24) + '</span><div><div class="nm">PayPal Wallet</div><div class="sub">Independent wallet, self-settling · runs alongside the card processor</div></div><div class="right">' + pMethPill(pp.connected) + (pp.connected ? '<button class="set-prim" data-cfg="paypal">Manage</button>' : '<button class="btn btn-primary" data-cfg="paypal">Connect</button>') + '</div></div>' + venmoNote + '</div>';
    {
      const k = D.payments.klarna;
      if (k.directConnected) {
        html += '<div class="panel imeth" style="display:block"><div style="display:flex;align-items:center;gap:13px"><span class="lg">' + payImg('klarna.svg', 24) + '</span><div><div class="nm">Klarna · own direct account</div><div class="sub">Your own Klarna direct account · rates usually better than via a PSP</div></div><div class="right">' + pMethPill(true) + '<button class="set-prim" data-cfg="klarna_direct">Manage</button></div></div><div class="dnote">💡 Klarna at checkout uses your direct account; if the active processor also has Klarna enabled, it defers to the direct account automatically to avoid showing twice to buyers.</div></div>';
      } else {
        html += '<div class="panel imeth"><span class="lg">' + payImg('klarna.svg', 24) + '</span><div><div class="nm">Klarna · own direct account</div><div class="sub">Have your own Klarna account? Connect it for better rates and platform routing (otherwise it is rendered by the active processor).</div></div><div class="right"><span class="pill pill-gray"><span class="dot"></span>Not connected</span><button class="btn btn-primary" data-cfg="klarna_direct">Connect</button></div></div>';
      }
    }
    return html;
  }

  // 手机端结账预览（对齐实测：快捷支付按钮 → OR → 银行卡）
  function pPreview() {
    const a = pActive();
    const express = a ? pExpressFor(a) : [];
    const underCard = a ? pUnderCard(a) : [];
    const hasPaypal = D.payments.paypal.connected;
    const venmoOn = hasPaypal && (D.payments.paypal.capabilities || {}).venmo === 'enabled';
    const antomOn = !!(a && a.key === 'antom');
    const klarnaDirect = D.payments.klarna.directConnected;
    const hasCard = !!a;
    if (!express.length && !hasPaypal && !klarnaDirect && !hasCard) return '<div class="muted" style="text-align:center;padding:24px 0;font-size:13px">No payment provider connected yet, buyers can\'t pay.</div>';
    const order = { applepay: 0, googlepay: 1, link: 2, amazonpay: 3, klarna: 4 };
    express.sort((x, y) => (order[x] ?? 9) - (order[y] ?? 9));
    const stacked = a && a.key === 'airwallex';
    const ppBtn = '<div style="height:46px;border-radius:9px;background:#ffc439;display:grid;place-items:center;margin-bottom:8px">' + payImg('paypal-logo.svg', 20) + '</div>';
    const fullBox = (id) => '<div class="wallet" style="width:100%;height:46px;margin-bottom:8px">' + PAY_ICON[id] + '</div>';
    let html = '';
    if (hasPaypal) html += ppBtn;
    if (venmoOn) html += '<div style="height:46px;border-radius:9px;background:#3d95ce;color:#fff;display:grid;place-items:center;margin-bottom:8px;font-weight:700">Venmo</div>';
    if (stacked) {
      express.forEach((id) => html += fullBox(id));
      if (klarnaDirect && !express.includes('klarna')) html += fullBox('klarna');
    } else {
      const grid = express.slice(); if (klarnaDirect && !grid.includes('klarna')) grid.push('klarna');
      if (grid.length) html += '<div class="wallets">' + grid.map((id, i) => { const full = (grid.length % 2 === 1) && (i === grid.length - 1); return '<div class="wallet"' + (full ? ' style="grid-column:1 / -1"' : '') + '>' + PAY_ICON[id] + '</div>'; }).join('') + '</div>';
    }
    if (hasCard) {
      const anyW = hasPaypal || venmoOn || express.length || klarnaDirect || antomOn;
      if (anyW) html += '<div style="text-align:center;font-size:11px;color:var(--ink-muted);margin:2px 0 10px">or pay with card</div>';
      html += '<div class="ck-opt sel"><span class="ck-radio"></span><span>Cards</span><span class="ck-ico">' + PAY_ICON.cards + '</span></div>';
    }
    if (underCard.length) {
      const walletLabel = { applepay: 'Apple Pay', googlepay: 'Google Pay' };
      underCard.forEach((id) => {
        html += '<div class="ck-opt"><span class="ck-radio"></span><span>' + walletLabel[id] + '</span><span class="ck-ico">' + PAY_ICON[id] + '</span></div>';
      });
    }
    if (a && a.key === 'tazapay') {
      pTazapayQrLabels(a).forEach((label) => {
        html += '<div class="ck-opt"><span class="ck-radio"></span><span class="i18n-skip">' + esc(label) + '</span></div>';
      });
    }
    if (antomOn) html += '<div class="ck-opt"><span class="ck-radio"></span><span>Alipay</span></div><div class="muted" style="font-size:11px;margin:-4px 0 8px">Other Antom wallets appear by buyer country.</div>';
    if (hasPaypal) html += '<div class="ck-opt" data-preview-wallet="paypal"><span class="ck-radio"></span><span>PayPal</span><span class="ck-ico">' + PAY_ICON.paypal + '</span></div>';
    if (klarnaDirect) html += '<div class="ck-opt" data-preview-wallet="klarna"><span class="ck-radio"></span><span>Pay With Klarna</span><span class="ck-ico">' + PAY_ICON.klarna + '</span></div>';
    return html + '<div class="ck-pay">Pay now</div>';
  }

  function pReco() {
    if (D.payments.phase !== 2) return '';
    return '<div class="reco"><div class="star">★</div><div style="flex:1"><div style="font-weight:700;font-size:14px;color:var(--ink)">BestShopio Payments <span class="pill pill-blue" style="margin-left:6px"><span class="dot"></span>Coming soon</span></div><div class="sec-sub" style="margin:3px 0 0">Platform acquiring — one-click setup, instant settlement, smart routing + retries behind the scenes. No account of your own needed.</div></div><button class="btn btn-gray" disabled style="opacity:.6;cursor:default">Coming soon</button></div>';
  }

  // Switch processor — confirm dialog (reuses SPA modal())
  function pConfirmSwitch(key) {
    const cur = pActive(); const p = pProcsVis().find((x) => x.key === key);
    const paypalImpact = key === 'paypal_cards'
      ? '<div class="dnote" style="margin-top:10px">Cards will move to PayPal. Apple Pay and Google Pay will appear only after the PayPal account, checkout domain, and buyer environment are eligible.</div>'
      : '';
    const nmiImpact = key === 'nmi'
      ? '<div class="dnote" style="margin-top:10px">Apple Pay and Google Pay appear under Cards. They do not support subscriptions or additional charges. PayPal Wallet and Klarna are not affected.</div>'
      : '';
    const worldpayImpact = key === 'worldpay'
      ? '<div class="dnote" style="margin-top:10px">Apple Pay and Google Pay will no longer appear. Buyers can still pay by card through Worldpay. PayPal Wallet and Klarna are not affected.</div>'
      : '';
    const nuveiImpact = key === 'nuvei'
      ? '<div class="dnote" style="margin-top:10px">Apple Pay and Google Pay appear when the Nuvei account and the buyer\'s device are eligible. Local methods such as iDEAL are not offered.</div>'
      : '';
    const antomImpact = key === 'antom'
      ? '<div class="dnote" style="margin-top:10px">Cards move to Antom. Alipay and other wallets from this account appear by buyer country. Apple Pay and Google Pay from the previous processor no longer appear.</div>'
      : '';
    const useepayImpact = key === 'useepay'
      ? '<div class="dnote" style="margin-top:10px">Apple Pay appears when the UseePay account, checkout domain, and buyer device are eligible. Google Pay is not available.</div>'
      : '';
    const oceanpayImpact = key === 'oceanpay'
      ? '<div class="dnote" style="margin-top:10px">Google Pay appears under Cards and supports subscriptions and additional charges. Apple Pay is not integrated. PayPal Wallet and Klarna are not affected.</div>'
      : '';
    const tazapayImpact = key === 'tazapay'
      ? '<div class="dnote" style="margin-top:10px">Apple Pay and Google Pay will no longer appear. Selected QR methods appear for buyers in the matching country. Tazapay is hidden on subscription checkouts and does not support post-purchase one-click charges. PayPal Wallet and Klarna are not affected.</div>'
      : '';
    const squareImpact = (key === 'square' || key === 'poynt')
      ? '<div class="dnote" style="margin-top:10px">Apple Pay and Google Pay appear in Express Checkout. They are hidden on subscription checkouts and don\'t support post-purchase one-click charges. PayPal Wallet and Klarna are not affected.</div>'
      : '';
    modal({ title: 'Switch card processor', width: 440, okText: 'Switch',
      body: '<div style="font-size:13.5px;line-height:1.65;color:var(--ink-body)">Cards and Express Checkout at checkout will switch processor. The payment methods buyers see may change accordingly.</div><div style="font-size:13px;margin-top:8px"><b>' + esc(cur ? cur.name : '—') + '</b> → <b>' + esc(p.name) + '</b></div>' + paypalImpact + nmiImpact + worldpayImpact + nuveiImpact + antomImpact + useepayImpact + oceanpayImpact + tazapayImpact + squareImpact + '<div class="muted" style="font-size:12px;margin-top:10px">Switch during off-peak hours; in-flight transactions are unaffected.</div>',
      onOk: (m, close) => { D.payments.cardProcessor = key; close(); renderPayments(); toast('Switched successfully'); } });
  }

  function pIsConnected(key) { if (key === 'paypal') return D.payments.paypal.connected; if (key === 'paypal_cards') return D.payments.paypal.connected && D.payments.paypal.capabilities.cards === 'enabled'; if (key === 'klarna_direct') return D.payments.klarna.directConnected; const p = D.payments.processors.find((p) => p.key === key); return p && p.connected; }
  function pEntName(key) { if (key === 'paypal' || key === 'paypal_cards') return 'PayPal'; if (key === 'klarna_direct') return 'Klarna Direct'; const p = D.payments.processors.find((p) => p.key === key); return p ? p.name : ''; }
  function pAccountMode(key) {
    if (key === 'paypal' || key === 'paypal_cards') return (D.payments.paypal && D.payments.paypal.mode) || 'live';
    if (key === 'klarna_direct') return (D.payments.klarna && D.payments.klarna.mode) || 'live';
    const p = D.payments.processors.find((x) => x.key === key);
    return (p && p.mode) || 'live';
  }
  function pSetAccountMode(key, mode) {
    const next = mode === 'sandbox' ? 'sandbox' : 'live';
    if (key === 'paypal' || key === 'paypal_cards') D.payments.paypal.mode = next;
    else if (key === 'klarna_direct') D.payments.klarna.mode = next;
    else { const p = D.payments.processors.find((x) => x.key === key); if (p) p.mode = next; }
  }
  function pModeLocale(en, zh) {
    return (window.I18N && window.I18N.lang === 'zh') ? zh : en;
  }
  const PAY_MANUAL_WEBHOOK = { nmi: true, braintree: true };
  const PAY_CONNECTED_WEBHOOK = {
    tazapay: {
      en: 'Add this URL under Settings > Webhooks in your Tazapay dashboard and paste its secret token above. Payments complete without it, but refund updates rely on it.',
      zh: '请到 Tazapay 后台的 Settings > Webhooks 添加此地址，并把对应的 secret token 粘贴到上方。不配置也能完成支付，但退款状态更新依赖它。',
    },
    square: {
      en: 'Registered automatically in your Square application when you save. If the signature key above stays empty, add this URL under Webhooks in the Square Developer Console (payment.updated, refund.updated) and paste its signature key above.',
      zh: '保存后会自动注册到你的 Square 应用。如果上方的签名密钥仍为空，请到 Square Developer Console 的 Webhooks 添加此地址（payment.updated、refund.updated），并把签名密钥粘贴到上方。',
    },
    poynt: {
      en: 'Registered automatically in your GoDaddy Payments business when you save, together with the Apple Pay domain. Payments complete without it, but refund and settlement updates rely on it.',
      zh: '保存后会连同 Apple Pay 域名一起自动注册到你的 GoDaddy Payments 商户。不配置也能完成支付，但退款和结算状态更新依赖它。',
    },
    oceanpay: {
      slug: 'oceanpayment',
      en: 'Create a webhook in your Oceanpayment dashboard and paste this URL. We will receive payment results automatically after it is saved.',
      zh: '请到 Oceanpayment 后台创建 Webhook 并粘贴此地址。保存后我们会自动接收支付结果。',
    },
  };
  const PAY_WEBHOOK_HOST = 'https://api.bestshopio.com';
  const PAY_WEBHOOK_TOKEN = {
    nmi: '7c2a91e04b8d4f16a3e55c8f0d12b476', braintree: 'b9e14c70a2f84d3bb6c018e5a47d9f21',
    tazapay: 'c4e8a1d07b2f49e6a5c318d0f6b74a92', square: '8d21f0ab64c547e19a3e5b70c2d84f16', poynt: 'e7a93c5b18d046f2b4e60a91c3f75d28',
    oceanpay: 'b6e24d81c0a54f3ab7d918e6c5f40a37',
  };
  function pEnsureWebhookToken(key) {
    const p = D.payments.processors.find((x) => x.key === key);
    if (!p) return '';
    if (!p.webhookToken) p.webhookToken = PAY_WEBHOOK_TOKEN[key] || (key + 'webhook');
    return p.webhookToken;
  }
  function pWebhookUrl(key) {
    const spec = PAY_CONNECTED_WEBHOOK[key];
    const path = spec ? '/web/api/' : '/api/';
    const slug = (spec && spec.slug) || key;
    return PAY_WEBHOOK_HOST + path + slug + '/webhook/' + pEnsureWebhookToken(key);
  }
  function pWebhookBox(key, noteEn, noteZh) {
    return '<div class="i18n-skip" style="margin:8px 0 14px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px">' +
        '<div style="font-size:13px;font-weight:600;color:var(--ink)">' + pModeLocale('Webhook URL', 'Webhook 地址') + '</div>' +
        '<button type="button" class="btn btn-default" data-copy-webhook style="height:28px;padding:0 10px;font-size:12px">' + pModeLocale('Copy', '复制') + '</button></div>' +
      '<div style="font-size:12px;line-height:1.5;word-break:break-all;background:#f6f7fb;border:1px solid var(--ctl);border-radius:8px;padding:9px 11px;color:var(--ink)">' + esc(pWebhookUrl(key)) + '</div>' +
      '<div class="muted" style="font-size:12px;margin-top:6px;line-height:1.55">' + esc(pModeLocale(noteEn, noteZh)) + '</div></div>';
  }
  function pWebhookNote(key, connected) {
    if (PAY_CONNECTED_WEBHOOK[key]) {
      if (!connected) return '';
      const note = PAY_CONNECTED_WEBHOOK[key];
      return pWebhookBox(key, note.en, note.zh);
    }
    if (!PAY_MANUAL_WEBHOOK[key]) return '';
    // Live Connect NMI has no webhook note yet. The URL appears after the merchant connects.
    if (key === 'nmi' && !connected) return '';
    const name = pEntName(key);
    if (!connected) {
      return '<div class="i18n-skip muted" style="font-size:12.5px;margin:4px 0 14px;line-height:1.55">' +
        esc(pModeLocale(
          'After you connect, we will show a webhook URL. Create a webhook in the ' + name + ' dashboard with that URL. We will receive payment results automatically.',
          '连接成功后，这里会给出 Webhook 地址。请到 ' + name + ' 后台创建 Webhook 并粘贴该地址，我们会自动接收支付结果。'
        )) + '</div>';
    }
    return '<div class="i18n-skip" style="margin:8px 0 14px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px">' +
        '<div style="font-size:13px;font-weight:600;color:var(--ink)">' + pModeLocale('Webhook URL', 'Webhook 地址') + '</div>' +
        '<button type="button" class="btn btn-default" data-copy-webhook style="height:28px;padding:0 10px;font-size:12px">' + pModeLocale('Copy', '复制') + '</button></div>' +
      '<div style="font-size:12px;line-height:1.5;word-break:break-all;background:#f6f7fb;border:1px solid var(--ctl);border-radius:8px;padding:9px 11px;color:var(--ink)">' + esc(pWebhookUrl(key)) + '</div>' +
      '<div class="muted" style="font-size:12px;margin-top:6px;line-height:1.55">' +
        esc(pModeLocale(
          'Create a webhook in your ' + name + ' dashboard and paste this URL. We will receive payment results automatically after it is saved.',
          '请到 ' + name + ' 后台创建 Webhook 并粘贴此地址。保存后我们会自动接收支付结果。'
        )) + '</div></div>';
  }
  function pModeFields(key, custom) {
    const selected = pAccountMode(key);
    const live = pModeLocale('Live', '正式');
    const sandbox = pModeLocale('Sandbox', '沙盒');
    const hint = custom && custom.en
      ? pModeLocale(custom.en, custom.zh || custom.en)
      : pModeLocale(
        'Sandbox is for test payments only. Bind the payment provider\'s sandbox merchant account. Switch to Live before accepting real customer payments.',
        '沙盒仅用于测试支付收单，需绑定该支付机构的沙盒商户账号。向买家正式收款前，请切换到正式模式。'
      );
    return '<div class="i18n-skip" style="margin:8px 0 4px"><div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:8px">' + pModeLocale('Mode', '模式') + ' <span style="color:var(--err)">*</span></div>' +
      '<div style="display:flex;gap:22px;align-items:center;font-size:13px;color:var(--ink-body)">' +
        '<label style="display:inline-flex;align-items:center;gap:7px;cursor:pointer"><input type="radio" name="payment-mode" data-payment-mode value="live"' + (selected === 'live' ? ' checked' : '') + '> ' + live + '</label>' +
        '<label style="display:inline-flex;align-items:center;gap:7px;cursor:pointer"><input type="radio" name="payment-mode" data-payment-mode value="sandbox"' + (selected === 'sandbox' ? ' checked' : '') + '> ' + sandbox + '</label></div>' +
      '<div class="muted" style="font-size:12px;margin-top:8px;line-height:1.55">' + hint + '</div></div>';
  }

  // 连接 / 管理弹窗。仅 Braintree / NMI 需要商家把 Webhook 地址贴回支付机构后台。
  function pConnect(key) {
    if (key === 'paypal') D.payments.paypal.connected = true;
    else if (key === 'paypal_cards') return;
    else if (key === 'klarna_direct') { D.payments.klarna.directConnected = true; D.payments.klarna.directOn = true; }
    else {
      const pr = D.payments.processors.find((p) => p.key === key);
      const hadActive = !!pActive();
      pr.connected = true;
      if (PAY_MANUAL_WEBHOOK[key] || PAY_CONNECTED_WEBHOOK[key]) pEnsureWebhookToken(key);
      if (!hadActive) D.payments.cardProcessor = key;
    }
  }
  function pDisconnect(key) {
    if (key === 'paypal') {
      D.payments.paypal.connected = false;
      if (D.payments.cardProcessor === 'paypal_cards') { const n = pConnected()[0]; D.payments.cardProcessor = n ? n.key : null; }
    }
    else if (key === 'klarna_direct') D.payments.klarna.directConnected = false;
    else { const pr = D.payments.processors.find((p) => p.key === key); pr.connected = false; if (D.payments.cardProcessor === key) { const n = pConnected()[0]; D.payments.cardProcessor = n ? n.key : null; } }
  }
  function pOpenConnect(key) {
    const connected = pIsConnected(key); const name = pEntName(key);
    const spec = PAY_FORMS[key] || { fields: [{ k: 'k1', label: 'API key' }, { k: 'k2', label: 'Secret' }] };
    let body = '';
    if (spec.desc) body += '<div class="muted" style="font-size:13px;margin-bottom:12px;line-height:1.5">' + esc(spec.desc) + '</div>';
    const account = D.payments.processors.find((p) => p.key === key);
    const fieldHtml = (f) => {
      const learn = f.learn ? '<a href="' + f.learn + '" target="_blank" style="font-size:12px;color:var(--brand);font-weight:400">Learn more</a>' : '';
      const star = f.optional ? '' : ' <span style="color:var(--err)">*</span>';
      const placeholder = f.placeholder || ('Please enter ' + f.label);
      const saved = connected && !f.optional;
      const control = f.type === 'textarea'
        ? '<textarea class="input" data-pf="' + f.k + '" placeholder="' + esc(placeholder) + '" style="min-height:96px;padding:8px 11px;resize:vertical;width:100%;box-sizing:border-box">' + (saved ? '•••••••••••• (saved)' : '') + '</textarea>'
        : '<input class="input" data-pf="' + f.k + '" placeholder="' + esc(placeholder) + '"' + (saved ? ' value="•••••••••••• (saved)"' : (f.value ? ' value="' + esc(f.value) + '"' : '')) + ' />';
      const hint = f.hint ? '<div class="muted" style="font-size:12px;line-height:1.5;margin-top:4px">' + esc(f.hint) + '</div>' : '';
      return '<div style="margin-bottom:4px"><div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:600;color:var(--ink);margin-bottom:6px"><span>' + esc(f.label) + star + '</span>' + learn + '</div>' +
        control + hint +
        '<div data-perr="' + f.k + '" style="min-height:18px;font-size:12px;color:var(--err);margin-top:3px"></div></div>';
    };
    body += spec.fields.map(fieldHtml).join('');
    if (spec.checks) {
      const selected = (account && account.qrMethods) || [];
      body += '<div style="margin:8px 0 12px"><div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:8px">' + esc(spec.checksTitle) + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px">' +
        spec.checks.map((item) => '<label style="display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.4;color:var(--ink)"><input type="checkbox" data-qr="' + esc(item.k) + '"' + (selected.indexOf(item.k) >= 0 ? ' checked' : '') + ' style="margin-top:2px"> <span>' + esc(item.label) + '</span></label>').join('') +
        '</div>' + (spec.checksNote ? '<div class="muted" style="font-size:12px;margin-top:8px;line-height:1.55">' + esc(spec.checksNote) + '</div>' : '') + '</div>';
    }
    if (spec.file) {
      const file = typeof spec.file === 'string'
        ? { label: spec.file, button: 'Upload ZIP', hint: 'Only .zip files up to 1MB are supported.', accept: '.zip' }
        : spec.file;
      const fileLabel = (account && account.domainFile) || file.button || 'Upload file';
      body += '<div style="margin:' + (file.marginTop || 0) + 'px 0 ' + (file.marginBottom == null ? 4 : file.marginBottom) + 'px"><div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:6px">' + esc(file.label) + '</div><button class="btn btn-default" type="button" data-file-upload data-file-accept="' + esc(file.accept || '') + '">' + esc(fileLabel) + '</button>' + (file.hint ? '<div class="muted" style="font-size:11.5px;margin-top:4px;line-height:1.5">' + esc(file.hint) + '</div>' : '') + '</div>';
    }
    if (spec.afterFile) body += spec.afterFile.map(fieldHtml).join('');
    body += '<div data-webhook-slot>' + pWebhookNote(key, connected) + '</div>';
    body += pModeFields(key, spec.modeHint ? { en: spec.modeHint, zh: spec.modeHintZh } : null);

    const bindWebhookCopy = (root) => {
      root.querySelectorAll('[data-copy-webhook]').forEach((button) => {
        button.onclick = () => {
          const url = pWebhookUrl(key);
          try { navigator.clipboard.writeText(url); } catch (e) {}
          toast(pModeLocale('Webhook URL copied', '已复制 Webhook 地址'));
        };
      });
    };
    const revealWebhookAfterConnect = (m, close) => {
      const slot = m.querySelector('[data-webhook-slot]');
      if (slot) {
        slot.innerHTML = pWebhookNote(key, true);
        slot.scrollIntoView({ block: 'nearest' });
      }
      const titleEl = m.querySelector('.modal-head span');
      if (titleEl) titleEl.textContent = 'Manage ' + name;
      const okBtn = m.querySelector('[data-ok]');
      if (okBtn) okBtn.textContent = 'Save';
      const foot = m.querySelector('.modal-foot');
      if (foot && !m.querySelector('[data-disc]')) {
        foot.style.justifyContent = 'space-between';
        const disc = h('<button class="btn" style="background:var(--err);color:#fff" data-disc>Cancel connection</button>');
        foot.insertBefore(disc, foot.firstChild);
        disc.onclick = () => { pDisconnect(key); close(); renderPayments(); toast('Cancelled connection successfully'); };
      }
      bindWebhookCopy(m);
    };

    let liveConnected = connected;
    const dlg = modal({
      title: key === 'paypal' ? (connected ? 'Manage PayPal' : 'Connect PayPal developer account') : ((connected ? 'Manage ' : 'Connect ') + name), width: 520, okText: connected ? 'Save' : 'Connect',
      body,
      extraLeft: connected ? '<button class="btn" style="background:var(--err);color:#fff" data-disc>Cancel connection</button>' : '',
      onOk: (m, close) => {
        // 校验：必填字段不能为空（对齐线上 validateForm）
        let okAll = true, firstBad = null;
        spec.fields.concat(spec.afterFile || []).forEach((f) => {
          const inp = m.querySelector('[data-pf="' + f.k + '"]');
          const err = m.querySelector('[data-perr="' + f.k + '"]');
          const val = ((inp && inp.value) || '').trim();
          if (!f.optional && !val) { okAll = false; if (err) err.textContent = f.msg || ('Please enter ' + f.label); if (inp) inp.style.borderColor = 'var(--err)'; if (!firstBad) firstBad = inp; }
        });
        if (!okAll) { if (firstBad) firstBad.focus(); return; }   // 校验不过不关闭
        const mode = m.querySelector('[data-payment-mode]:checked');
        if (mode) pSetAccountMode(key, mode.value);
        if (spec.checks && account) account.qrMethods = [...m.querySelectorAll('[data-qr]:checked')].map((el) => el.dataset.qr);
        if (!liveConnected) {
          pConnect(key);
          liveConnected = true;
          renderPayments();
          toast('Connected successfully');
          if (PAY_MANUAL_WEBHOOK[key] || PAY_CONNECTED_WEBHOOK[key]) {
            revealWebhookAfterConnect(m, close);
            return;
          }
          close();
          return;
        }
        close(); renderPayments(); toast('Edit successfully');
      },
      onExtra: (m, close) => { pDisconnect(key); close(); renderPayments(); toast('Cancelled connection successfully'); },
    });
    // 输入即清除该字段错误；验证文件走本地文件选择（原型）
    dlg.m.querySelectorAll('[data-pf]').forEach((inp) => inp.oninput = () => { const err = dlg.m.querySelector('[data-perr="' + inp.dataset.pf + '"]'); if (err) err.textContent = ''; inp.style.borderColor = ''; });
    dlg.m.querySelectorAll('[data-file-upload]').forEach((button) => {
      button.onclick = () => openFilePicker({ accept: button.dataset.fileAccept || '', onSelected: (file) => { button.textContent = file.name; if (account) account.domainFile = file.name; toast('Selected ' + file.name); } });
    });
    bindWebhookCopy(dlg.m);
  }

  const PAY_CSS =
    '.payv2{width:100%;max-width:1180px;margin:0 auto}' +
    '.payv2 .pay-grid{display:grid;grid-template-columns:1fr;gap:22px;align-items:start}' +
    '@media(min-width:1200px){.payv2 .pay-grid{grid-template-columns:minmax(0,1fr) 340px}}' +
    '.payv2 .seg{display:inline-flex;background:#eef0f7;border-radius:9px;padding:3px;gap:2px}' +
    '.payv2 .seg button{border:none;background:transparent;height:30px;padding:0 14px;border-radius:7px;font-size:13px;font-weight:600;color:var(--ink-muted);cursor:pointer}' +
    '.payv2 .seg button.on{background:#fff;color:var(--brand);box-shadow:0 1px 2px rgb(16 24 40/8%)}' +
    '.payv2 .sec-title{font-size:15px;font-weight:700;color:var(--ink);margin:22px 0 4px}' +
    '.payv2 .sec-sub{font-size:12.5px;color:var(--ink-muted);margin:0 0 12px;line-height:1.5}' +
    '.payv2 .slot-head{display:flex;flex-direction:column;align-items:flex-start;gap:10px;margin-bottom:10px}' +
    '.payv2 .slot-title{font-weight:700;font-size:14px}' +
    '.payv2 .proc-pick{display:flex;gap:8px;flex-wrap:wrap;align-items:center;row-gap:8px}' +
    '.payv2 .proc-pick .lab{font-size:12px;color:var(--ink-muted);margin-right:2px}' +
    '.payv2 .proc-pick button{height:30px;padding:0 11px;border-radius:8px;border:1px solid var(--ctl);background:#fff;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;color:var(--ink)}' +
    '.payv2 .proc-pick button.on{border-color:var(--brand);background:var(--brand-50);color:var(--brand);font-weight:600}' +
    '.payv2 .proc-pick img{height:15px}' +
    '.payv2 .proc-pick .add{border-style:dashed;color:var(--brand)}' +
    '.payv2 .proc-pick .add:hover{background:var(--brand-50)}' +
    '.payv2 .proc-pick .pchip{display:inline-flex;align-items:center;height:30px;border:1px solid var(--ctl);border-radius:8px;overflow:hidden}' +
    '.payv2 .proc-pick .pchip.on{border-color:var(--brand);background:var(--brand-50)}' +
    '.payv2 .proc-pick .pchip .pchip-name{height:28px;padding:0 6px 0 11px;border:none;background:transparent;display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--ink);cursor:pointer}' +
    '.payv2 .proc-pick .pchip.on .pchip-name{color:var(--brand);font-weight:600;cursor:default}' +
    '.payv2 .proc-pick .pchip .pchip-name:hover{background:rgba(0,0,0,.04)}' +
    '.payv2 .proc-pick .pchip.on .pchip-name:hover{background:transparent}' +
    '.payv2 .proc-pick .pchip .pchip-cog{height:28px;padding:0 8px;border:none;border-left:1px solid var(--hair);background:transparent;color:var(--ink-muted);cursor:pointer;font-size:12px}' +
    '.payv2 .proc-pick .pchip .pchip-cog:hover{background:rgba(0,0,0,.05);color:var(--ink)}' +
    '.payv2 .proc-pick .lock{height:30px;padding:0 11px;border-radius:8px;border:1px dashed var(--hair);background:var(--panel);font-size:13px;color:var(--ink-muted);display:inline-flex;align-items:center;gap:6px}' +
    '.payv2 .slot-row{display:flex;align-items:center;gap:12px;padding:14px 0;border-top:1px solid var(--hair)}' +
    '.payv2 .slot-panel{padding-bottom:0}' +
    '.payv2 .slot-row .ic{display:flex;gap:4px;align-items:center;flex-wrap:wrap}' +
    '.payv2 .slot-row .ic img{height:20px}' +
    '.payv2 .slot-row .bd{display:flex;flex-direction:column;flex:1;min-width:0}' +
    '.payv2 .slot-row .lbl{font-weight:600;font-size:13.5px;color:var(--ink)}' +
    '.payv2 .slot-row .meta{font-size:12px;color:var(--ink-muted);margin-top:2px;line-height:1.5}' +
    '.payv2 .slot-row .right{margin-left:auto}' +
    '.payv2 .sw{width:34px;height:20px;border-radius:9999px;background:#cfd5e4;position:relative;cursor:pointer;transition:background .15s;flex:none;display:inline-block}' +
    '.payv2 .sw.on{background:var(--brand)}' +
    '.payv2 .sw i{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s;box-shadow:0 1px 2px rgb(0 0 0/20%)}' +
    '.payv2 .sw.on i{left:16px}' +
    '.payv2 .lnkico{color:var(--brand);cursor:pointer;text-decoration:none}.payv2 a.lnkico{color:var(--brand)}.payv2 .lnkico:hover{text-decoration:underline}' +
    '.payv2 .syncline{font-size:12px;color:var(--ink-muted);padding-top:12px;border-top:1px solid var(--hair);display:flex;gap:8px;flex-wrap:wrap;align-items:center}' +
    '.payv2 .imeth{display:flex;align-items:center;gap:13px;padding:15px 16px;margin-bottom:12px}' +
    '.payv2 .paypal-method{display:block}.payv2 .imeth-head{display:flex;align-items:center;gap:13px}' +
    '.payv2 .imeth .lg{height:24px;display:flex;align-items:center}.payv2 .imeth .lg img{height:24px}' +
    '.payv2 .imeth .nm{font-weight:700;font-size:14px;color:var(--ink)}' +
    '.payv2 .imeth .sub{font-size:12.5px;color:var(--ink-muted);margin-top:2px}' +
    '.payv2 .imeth .right{margin-left:auto;display:flex;align-items:center;gap:10px}' +
    '.payv2 .dnote,.modal .dnote{margin:10px 0 0;font-size:12.5px;color:#1e3a8a;background:#eef4ff;border:1px solid #cfe1ff;border-radius:9px;padding:9px 12px;line-height:1.6}' +
    '.payv2 .set-prim{font-size:12px;color:var(--brand);background:#fff;border:1px solid var(--ctl);border-radius:8px;padding:5px 11px;cursor:pointer}' +
    '.payv2 .set-prim:hover{border-color:var(--brand);background:var(--brand-50)}' +
    '.payv2 .pm-mono{font-weight:800;font-size:13px;color:var(--ink)}' +
    '.payv2 .reco{display:flex;align-items:center;gap:14px;padding:16px;border:1px solid #cfe1ff;background:linear-gradient(95deg,#eef4ff,#f7faff);border-radius:12px;margin-bottom:18px}' +
    '.payv2 .reco .star{width:38px;height:38px;border-radius:10px;background:var(--brand);color:#fff;display:grid;place-items:center;flex:none}' +
    '.payv2 .preview-col{position:sticky;top:16px}' +
    '.payv2 .phone{background:#fff;border:1px solid var(--ctl);border-radius:22px;box-shadow:var(--float-shadow);padding:14px;max-width:380px;margin:0 auto}' +
    '.payv2 .phone-notch{width:90px;height:5px;border-radius:3px;background:#e3e6ef;margin:2px auto 12px}' +
    '.payv2 .ck-h{font-size:13px;font-weight:700;color:var(--ink);margin:2px 0 10px}' +
    '.payv2 .ck-opt{display:flex;align-items:center;gap:10px;border:1px solid var(--ctl);border-radius:10px;padding:11px 12px;margin-bottom:8px;font-size:13px}' +
    '.payv2 .ck-opt.sel{border-color:var(--brand);box-shadow:0 0 0 2px var(--brand-50)}' +
    '.payv2 .ck-radio{width:16px;height:16px;border-radius:50%;border:2px solid var(--ctl);flex:none}' +
    '.payv2 .ck-opt.sel .ck-radio{border-color:var(--brand);background:radial-gradient(circle at center,var(--brand) 0 4px,#fff 5px)}' +
    '.payv2 .ck-ico{margin-left:auto;display:flex;gap:4px}.payv2 .ck-ico img{height:16px}' +
    '.payv2 .ck-pay{margin-top:6px;height:42px;border-radius:10px;background:var(--brand);color:#fff;font-weight:700;font-size:14px;display:grid;place-items:center}' +
    '.payv2 .wallets{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}' +
    '.payv2 .wallet{height:40px;border-radius:9px;border:1px solid var(--ctl);display:grid;place-items:center}.payv2 .wallet img{height:18px}' +
    '.payv2 .preview-note{font-size:11.5px;color:var(--ink-muted);text-align:center;margin-top:10px;line-height:1.5}' +
    '.payv2 .foot-note{font-size:12px;color:var(--ink-muted);margin-top:20px;line-height:1.7}';

  // in = integrated, out = not integrated yet, no = the provider cannot do it. null stays blank.
  function pCapabilityRows() {
    const all = (value) => [value, value, value, value];
    const line = (inst, method, caps, qr) => [inst, method].concat(caps, [qr == null ? 'no' : qr]);
    const wallet = ['in', 'no', 'no', 'in'];
    return [
      line('Airwallex', 'Cards', all('in')),
      line('Airwallex', 'Apple Pay', all('in')),
      line('Airwallex', 'Google Pay', all('in')),
      line('Stripe', 'Cards', all('in')),
      line('Stripe', 'Apple Pay', all('in')),
      line('Stripe', 'Google Pay', all('in')),
      line('Stripe', 'Klarna', all('in')),
      line('Stripe', 'Afterpay / Clearpay', all('in')),
      line('Stripe', 'Link', all('in')),
      line('Stripe', 'Amazon Pay', all('in')),
      line('PayPal', 'Pay Now', all('in')),
      line('PayPal', 'Pay Later', wallet),
      line('PayPal', 'Cards', all('in')),
      line('PayPal', 'Apple Pay', all('in')),
      line('PayPal', 'Google Pay', wallet),
      line('PayPal', 'PayPal Wallet', all('in')),
      line('PayPal', 'Venmo', all('in')),
      line('Adyen', 'Cards', all('in')),
      line('Adyen', 'Apple Pay', all('in')),
      line('Adyen', 'Google Pay', all('in')),
      line('Checkout.com', 'Cards', all('in')),
      line('Checkout.com', 'Apple Pay', all('in')),
      line('Checkout.com', 'Google Pay', all('in')),
      line('NMI', 'Cards', all('in')),
      line('NMI', 'Apple Pay', wallet),
      line('NMI', 'Google Pay', wallet),
      line('Braintree', 'Cards', all('in')),
      line('Braintree', 'Apple Pay', all('in')),
      line('Braintree', 'Google Pay', all('in')),
      line('Braintree', 'Venmo', all('in')),
      line('Mollie', 'Cards', all('in')),
      line('Mollie', 'Google Pay', all('in')),
      line('Oceanpayment', 'Cards', all('in')),
      line('Oceanpayment', 'Google Pay', all('in')),
      line('Tazapay', 'Cards', wallet),
      line('Tazapay', 'PayNow', wallet, 'in'),
      line('Tazapay', 'PromptPay', wallet, 'in'),
      line('Tazapay', 'QRIS', wallet, 'in'),
      line('Tazapay', 'QR Ph', ['in', 'no', 'no', 'no'], 'in'),
      line('Tazapay', 'Pix', wallet, 'in'),
      line('Tazapay', 'UPI', wallet, 'in'),
      line('Square', 'Cards', all('in')),
      line('Square', 'Apple Pay', wallet),
      line('Square', 'Google Pay', wallet),
      line('Poynt', 'Cards', all('in')),
      line('Poynt', 'Apple Pay', wallet),
      line('Poynt', 'Google Pay', wallet),
      line('Amazon Pay', 'Amazon Pay', all('in')),
      line('Amazon Pay', 'Buy Now', wallet),
      line('Klarna', 'Klarna', all('in')),
    ];
  }
  function pCapCell(value) {
    if (value === 'in') return '<span style="color:#067647;font-weight:600;white-space:nowrap">Supported</span>';
    if (value === 'out') return '<span style="color:#667085;font-weight:600;white-space:nowrap">Not integrated</span>';
    if (value === 'no') return '<span style="color:#b42318;font-weight:600;white-space:nowrap">Not supported</span>';
    return '<span class="muted">—</span>';
  }
  function pOpenCapabilities() {
    const groups = [];
    pCapabilityRows().forEach((row) => {
      const last = groups[groups.length - 1];
      if (last && last.name === row[0]) last.items.push(row);
      else groups.push({ name: row[0], items: [row] });
    });
    const head = ['Payment institution', 'Payment method', 'Payment', 'Subscription', 'Upsell / Downsell additional charge', 'Refund', 'QR payment']
      .map((label) => {
        const text = label === 'Upsell / Downsell additional charge' ? 'Upsell / Downsell<br>additional charge' : label;
        return '<th style="position:sticky;top:0;background:#f6f7fb;text-align:left;padding:8px 8px;border-bottom:1px solid var(--ctl);font-weight:600;white-space:normal;line-height:1.35;overflow-wrap:break-word">' + text + '</th>';
      })
      .join('');
    const bodyRows = groups.map((group) => group.items.map((row, index) => {
      const inst = index === 0
        ? '<td rowspan="' + group.items.length + '" class="i18n-skip" style="padding:8px 8px;border-bottom:1px solid var(--hair);font-weight:600;vertical-align:top;white-space:normal;overflow-wrap:break-word">' + esc(group.name) + '</td>'
        : '';
      const caps = [2, 3, 4, 5, 6].map((i) => '<td style="padding:8px 8px;border-bottom:1px solid var(--hair);white-space:nowrap;vertical-align:top">' + pCapCell(row[i]) + '</td>').join('');
      return '<tr>' + inst +
        '<td class="i18n-skip" style="padding:8px 8px;border-bottom:1px solid var(--hair);white-space:normal;overflow-wrap:break-word;vertical-align:top">' + esc(row[1]) + '</td>' +
        caps + '</tr>';
    }).join('')).join('');
    const body = '<div class="muted" style="font-size:13px;line-height:1.55;margin-bottom:12px">Integrated payment institutions and the methods each one can offer. Payment, subscription, additional charge, refund, and QR payment follow the capability list.</div>' +
      '<div style="max-height:calc(70vh - 96px);overflow-x:hidden;overflow-y:auto;border:1px solid var(--ctl);border-radius:10px"><table style="width:100%;table-layout:fixed;border-collapse:collapse;font-size:13px"><colgroup><col style="width:148px"><col style="width:156px"><col style="width:112px"><col style="width:112px"><col style="width:136px"><col style="width:112px"><col style="width:112px"></colgroup><thead><tr>' +
      head + '</tr></thead><tbody>' + bodyRows + '</tbody></table></div>';
    modal({ title: 'Payment capabilities', width: 960, okText: 'Close', hideCancel: true, body: body, onOk: function (m, close) { close(); } });
  }

  function renderPayments() {
    const main =
      '<div class="sec-title" style="margin-top:0">① Cards &amp; Express checkout</div>' +
      '<div class="sec-sub">Only one processor at a time renders card fields. Express wallets follow the active processor.</div>' +
      pSlot() +
      '<div class="sec-title">② Independent payment methods</div>' +
      '<div class="sec-sub">Self-settling — can run alongside the card processor, each on its own rails.</div>' +
      pIndep();
    const preview =
      '<div class="preview-col"><div class="phone"><div class="phone-notch"></div>' +
        '<div class="ck-h">Checkout · methods buyers see</div>' + pPreview() + '</div>' +
        '<div class="preview-note">What buyers see are the methods lit up by connected providers.</div></div>';
    paint(
      '<style>' + PAY_CSS + '</style>' +
      '<div class="payv2">' +
        '<div style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px"><div class="page-title" style="font-size:20px">Payments</div><button class="btn btn-default" type="button" data-pay-caps>Payment capabilities</button></div>' +
        '<div class="set-note" style="margin-bottom:22px;display:flex;gap:10px;align-items:flex-start"><span style="color:var(--brand);flex:none;display:inline-flex">' + I.info + '</span><div class="muted" style="font-size:12.5px;line-height:1.5">Payment connections belong to this store only and are never shared between stores. A newly created store starts with no provider connected, so you connect fresh credentials here.</div></div>' +
        '<div class="pay-grid"><div>' + main + '</div>' + preview + '</div>' +
      '</div>',
      false
    );
    root.querySelectorAll('[data-setproc]').forEach((el) => el.onclick = () => pConfirmSwitch(el.dataset.setproc));
    root.querySelectorAll('[data-cfg]').forEach((el) => el.onclick = () => pOpenConnect(el.dataset.cfg));
    root.querySelectorAll('[data-pay-caps]').forEach((el) => el.onclick = () => pOpenCapabilities());
  }

  // (旧 openProviderModal 已移除——连接/管理改由 pOpenConnect 承接，见上)

  // NOTE: Tracking pixels (Meta / GA4 / TikTok / Google Ads / Custom) moved out
  //   of Settings — Pixel + CAPI now lives in each platform's Channel workspace:
  //   #/facebook (Meta) and #/google (GA4 + Google Ads). Aligns with BestShopio
  //   Channel architecture.

  // ===========================================================================
  // TAB 3 — CURRENCY  ("Currency", full width)
  //   index.vue: description "Default currency: USD $" + search bar + table.
  //   edit.vue rendered as a modal here (rate/symbol/status), exchange_rate_type
  //   0 = automatic, 1 = manual; price rounding "Round up to the nearest …".
  // ===========================================================================
  function renderCurrency() {
    const c = D.currency;
    const rows = c.list.map((r) =>
      '<tr data-cid="' + r.id + '">' +
        '<td><div class="flex items-center gap-2"><span class="ccy-flag">' + esc(r.country_code) + '</span>' +
          '<span class="subtle" style="font-weight:500">' + esc(r.country_name) + '</span></div></td>' +
        '<td>' + esc(r.currency_code) + '</td>' +
        '<td>' + esc(r.currency_symbol) + '</td>' +
        '<td>' + toggle(r.currency_status === 1, r.currency_code + ' status') + '</td>' +
        '<td>' + esc(r.exchange_rate_type_text) + '</td>' +
        '<td class="muted">' + esc(r.exchange_rate_round_type_text) + '</td>' +
        '<td style="text-align:right"><button class="lnk" data-edit-ccy="' + r.id + '">Edit</button></td>' +
      '</tr>').join('');

    const fieldOpts = c.searchFieldOptions.map((o) => '<option value="' + o.value + '">' + esc(o.label) + '</option>').join('');

    const table =
      '<div class="panel">' +
        '<div class="card-pad" style="background:#f7f8fb;border-bottom:1px solid var(--hair);border-radius:10px 10px 0 0;padding:12px 16px">' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            '<select class="filter-select" style="width:160px">' + fieldOpts + '</select>' +
            '<input class="filter-input" placeholder="Please enter keywords to search" style="padding-left:12px;width:268px" />' +
            '<select class="filter-select" style="width:160px"><option>Status</option><option>On</option><option>Off</option></select>' +
            '<select class="filter-select" style="width:160px"><option>Exchange rate</option><option>Automatic</option><option>Manual</option></select>' +
          '</div>' +
        '</div>' +
        '<div style="overflow-x:auto"><table class="tbl" style="min-width:900px">' +
          '<thead><tr><th>Country</th><th>Currency code</th><th>Currency symbol</th><th>Status</th><th>Exchange rate</th><th>Price rounding</th><th style="text-align:right">Action</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table></div>' +
      '</div>';

    paint(
      pageHead('Currency', 'Default currency: ' + c.defaultCurrency) +
      table,
      false
    );

    root.querySelectorAll('[data-edit-ccy]').forEach((b2) => b2.onclick = (e) => { e.stopPropagation(); openCurrencyEdit(Number(b2.getAttribute('data-edit-ccy'))); });
    root.querySelectorAll('#root tr[data-cid]').forEach((tr) => tr.onclick = () => openCurrencyEdit(Number(tr.getAttribute('data-cid'))));
  }

  function openCurrencyEdit(id) {
    const r = D.currency.list.find((x) => x.id === id);
    if (!r) return;
    const auto = r.exchange_rate_type === 0;
    const radio = (on, label, sub) =>
      '<label class="set-radio2' + (on ? ' on' : '') + '"><span class="proc-radio">' + (on ? '<span class="proc-dot"></span>' : '') + '</span>' +
      '<span><span class="subtle" style="font-weight:500">' + esc(label) + '</span>' + (sub ? '<div class="muted" style="font-size:12px;margin-top:2px">' + esc(sub) + '</div>' : '') + '</span></label>';
    const round = r.exchange_rate_round_type === 1;
    const body =
      block('<div class="flex gap-8 text-sm"><div><span class="muted">Currency code:</span> <span class="subtle" style="font-weight:500">' + esc(r.currency_code) + '</span></div>' +
            '<div><span class="muted">Currency symbol:</span> <span class="subtle" style="font-weight:500">' + esc(r.currency_symbol) + '</span></div></div>') +
      // Exchange rate
      '<div style="border:1px solid var(--hair);border-radius:10px;padding:14px 16px;margin-top:16px">' +
        '<div class="card-title" style="font-size:15px;margin-bottom:10px">Exchange rate</div>' +
        '<div class="flex flex-col gap-2">' +
          radio(auto, 'Using automatic exchange rates', 'The price of an item will change automatically based on the market rate and includes a 0% conversion fee. 1 ' + r.original_currency + ' = ' + r.exchange_rate_auto_value + ' ' + r.currency_code + '.') +
          radio(!auto, 'Use manual exchange rates', 'Customized exchange rates, no conversion fees.') +
        '</div>' +
        '<div class="mt-2 flex items-center gap-2" style="' + (auto ? 'opacity:.5' : '') + '"><span class="muted text-sm">1 ' + esc(r.original_currency) + ' =</span>' +
          '<div class="set-addon"><input class="input" type="number" value="' + esc(r.exchange_rate) + '" step="0.01" min="0" style="width:160px;border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">' + esc(r.currency_code) + '</span></div></div>' +
      '</div>' +
      // Price rounding
      '<div style="border:1px solid var(--hair);border-radius:10px;padding:14px 16px;margin-top:16px">' +
        '<div class="card-title" style="font-size:15px;margin-bottom:10px">Price rounding</div>' +
        '<div class="flex flex-col gap-2">' +
          '<label class="set-radio' + (round ? ' on' : '') + '"><span class="proc-radio">' + (round ? '<span class="proc-dot"></span>' : '') + '</span><span>Round up to the nearest ' + esc(r.currency_code) + ' ' + esc(r.currency_symbol) + '</span>' +
            '<input class="input" type="number" value="' + (r.exchange_rate_round || 1) + '" min="1" style="width:120px;margin-left:8px"' + (round ? '' : ' disabled') + ' /></label>' +
          '<label class="set-radio' + (round ? '' : ' on') + '"><span class="proc-radio">' + (round ? '' : '<span class="proc-dot"></span>') + '</span>Do not round prices</label>' +
          (round ? '' : '<div class="muted" style="font-size:12px;margin-left:24px">The price will automatically be rounded to two decimal places.</div>') +
        '</div>' +
      '</div>' +
      // Price decimal
      '<div style="border:1px solid var(--hair);border-radius:10px;padding:14px 16px;margin-top:16px">' +
        '<div class="card-title" style="font-size:15px;margin-bottom:10px">Price decimal</div>' +
        '<div class="flex flex-col gap-2">' + [0, 1, 2].map((d) => '<label class="set-radio' + (r.exchange_rate_decimal === d ? ' on' : '') + '"><span class="proc-radio">' + (r.exchange_rate_decimal === d ? '<span class="proc-dot"></span>' : '') + '</span>' + d + '</label>').join('') + '</div>' +
      '</div>';
    modal({ title: r.country_name, width: 600, okText: 'Update', body, onOk: (m, close) => { close(); toast('Updated successfully'); } });
  }

  // ===========================================================================
  // TAB 4 — CHECKOUT  ("Checkout", centered w-860)
  //   EditForm.tsx: ONLY a "Customize checkout" card (logo upload + width +
  //   alignment + position). No cart / shipping / gift card / order-note.
  // ===========================================================================
  function renderCheckout() {
    const c = D.checkout;
    // wrap radios in an aligned flex so they stay vertically centered with the row's
    // left label (per-radio margin-bottom used to lift them ~5px above it)
    const radioGroup = (name, opts, sel) =>
      '<div style="display:inline-flex;flex-wrap:wrap;align-items:center;gap:6px 16px">' +
        opts.map((o) =>
          '<label class="set-radio' + (o.value === sel ? ' on' : '') + '" data-radio="' + name + '" data-val="' + o.value + '">' +
          '<span class="proc-radio">' + (o.value === sel ? '<span class="proc-dot"></span>' : '') + '</span>' + esc(o.label) + '</label>').join('') +
      '</div>';

    const logoCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Customize checkout') +
        '<div class="mt-4 flex flex-col gap-4">' +
          block(
            '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:2px">Checkout logo</div>' +
            '<div class="muted" style="font-size:12.5px;margin-bottom:10px">This logo is displayed on Checkout page. <a class="lnk" data-preview="Display Position of Checkout logo">Preview display here.</a> Format: png. If no Checkout logo is uploaded, the Store logo will be used by default.</div>' +
            '<div class="up-tile"><span class="up-plus">' + I.plus + '</span><span class="up-add">Add images</span></div>'
          ) +
          block(
            '<div class="flex items-center gap-4"><div class="text-sm" style="font-weight:600;color:var(--ink);width:72px">Width</div>' +
            '<input type="range" min="50" max="300" value="' + c.logo.width + '" class="set-range" id="logo-w" style="max-width:200px" />' +
            '<div class="set-addon"><input class="input" type="number" value="' + c.logo.width + '" id="logo-w-num" min="50" max="300" style="width:120px;border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">px</span></div></div>',
            '#f7f8fa'
          ) +
          block('<div class="flex items-center gap-4"><div class="text-sm" style="font-weight:600;color:var(--ink);width:120px">Logo alignment</div><div>' + radioGroup('align', c.logo.alignmentOptions, c.logo.alignment) + '</div></div>', '#f7f8fa') +
          block('<div class="flex items-center gap-4"><div class="text-sm" style="font-weight:600;color:var(--ink);width:120px">Logo position</div><div>' + radioGroup('pos', c.logo.positionOptions, c.logo.position) + '</div></div>', '#f7f8fa') +
        '</div>' +
      '</div>';

    paint(
      pageHead('Checkout') +
      logoCard +
      '<div class="flex justify-end">' + updateBtn + '</div>',
      true
    );

    root.querySelectorAll('[data-act="save"]').forEach((b2) => b2.onclick = () => toast('Updated successfully'));
    root.querySelectorAll('[data-preview]').forEach((b2) => b2.onclick = () => openPreviewModal(b2.getAttribute('data-preview')));
    root.querySelectorAll('[data-radio]').forEach((el) => el.onclick = () => {
      const name = el.getAttribute('data-radio');
      root.querySelectorAll('[data-radio="' + name + '"]').forEach((s) => { s.classList.remove('on'); const d = s.querySelector('.proc-radio'); if (d) d.innerHTML = ''; });
      el.classList.add('on'); const dot = el.querySelector('.proc-radio'); if (dot) dot.innerHTML = '<span class="proc-dot"></span>';
    });
    const wr = root.querySelector('#logo-w'), wn = root.querySelector('#logo-w-num');
    if (wr && wn) { wr.oninput = () => { wn.value = wr.value; }; wn.oninput = () => { wr.value = wn.value; }; }
  }

  // ===========================================================================
  // TAB 5 — METAFIELDS  ("Metafields", centered w-860)
  //   list.tsx (resource picker) -> detail.tsx (Name / Data Type / Used in) ->
  //   form.tsx (add/edit, custom. prefix). No system pill / nskey in the table.
  //   sub-state: mfResource = null (picker) | 'products' | 'variants'
  // ===========================================================================
  let mfResource = null;
  let mfAdding = false; // true = showing the inline "Add field definition" view (not a modal — mirrors form.tsx)

  function renderMetafields() {
    const m = D.metafields;
    if (!mfResource) {
      const rows = m.resources.map((r) => {
        const count = (m.definitions[r.key] || []).length;
        const ico = r.badge
          ? '<span class="mf-res-ico">' + esc(r.badge) + '</span>'
          : '<span class="mf-res-ico">' + I.tagSm + '</span>';
        return '<button class="mf-res" data-res="' + r.key + '">' + ico +
          '<span style="flex:1;text-align:left"><span class="text-sm" style="font-weight:600;color:var(--ink);display:block">' + esc(r.title) + '</span>' +
          '<span class="muted" style="font-size:12.5px">' + count + ' definitions</span></span>' +
          '<span class="muted">' + I.chevR + '</span></button>';
      }).join('');
      paint(
        pageHead('Metafields', 'Add a custom piece of data to a specific part of your store') +
        '<div class="panel card-pad">' + sectionTitle('Metafield', 'Select a module to manage extended fields') +
          '<div class="mt-4 flex flex-col gap-2">' + rows + '</div>' +
        '</div>',
        true
      );
      root.querySelectorAll('[data-res]').forEach((b2) => b2.onclick = () => { mfResource = b2.getAttribute('data-res'); renderMetafields(); });
      return;
    }

    const r = m.resources.find((x) => x.key === mfResource);
    const defs = m.definitions[mfResource] || [];
    if (mfAdding) { paintAddDefinition(r); return; }
    const suffix = mfResource === 'variants' ? 'variants' : 'products';
    const title = mfResource === 'variants' ? 'Product variant metafields' : 'Product metafields';
    const rows = defs.map((d) =>
      '<tr>' +
        '<td><div class="flex items-center gap-3"><span class="muted mf-grip">' + I.grip + '</span><span class="subtle" style="font-weight:500">' + esc(d.name) + '</span></div></td>' +
        '<td><div class="flex items-center gap-2"><span class="mf-type-ico">' + I.tagSm + '</span><span>' + esc(d.typeLabel) + '</span></div></td>' +
        '<td class="muted">' + d.usedIn + ' ' + suffix + '</td>' +
      '</tr>').join('');

    paint(
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="flex items-center gap-3">' +
          '<button class="back-btn" data-act="mf-back" title="Back">' + I.chevL + '</button>' +
          '<div class="page-title" style="font-size:18px">' + esc(title) + '</div>' +
        '</div>' +
        (defs.length ? '<button class="btn btn-primary" data-act="mf-add">Add fields</button>' : '') +
      '</div>' +
      (defs.length
        ? '<div class="panel"><div style="overflow-x:auto"><table class="tbl" style="min-width:560px">' +
            '<thead><tr><th>Name</th><th>Data Type</th><th>Used in</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table></div>' +
            '<div class="flex items-center justify-between card-pad"><span class="muted" style="font-size:13px">Total ' + defs.length + ' records</span></div>' +
          '</div>'
        : // blank state (blank.tsx)
          '<div class="panel" style="min-height:360px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px">' +
            '<div class="mf-blank-ico">' + I.tagSm + '</div>' +
            '<div class="card-title" style="font-size:18px;margin-top:16px">' + (mfResource === 'variants' ? 'Add metafield for product variant' : 'Add metafield for product category') + '</div>' +
            '<div class="muted" style="font-size:13px;margin-top:6px;margin-bottom:18px">' + (mfResource === 'variants' ? 'Used to add extention fields and data for product variant' : 'Used to add extention fields and data for product category') + '</div>' +
            '<button class="btn btn-primary" data-act="mf-add">Add fields</button>' +
          '</div>'),
      true
    );
    const back = root.querySelector('[data-act="mf-back"]'); if (back) back.onclick = () => { mfResource = null; renderMetafields(); };
    root.querySelectorAll('[data-act="mf-add"]').forEach((b2) => b2.onclick = () => { mfAdding = true; renderMetafields(); });
  }

  // Add field definition — an inline VIEW with a back arrow (mirrors form.tsx), NOT a modal.
  function paintAddDefinition(resource) {
    const m = D.metafields;
    const typeOpts = m.typeOptions.map((g) =>
      '<optgroup label="' + esc(g.group) + '">' + g.types.map((t) => '<option value="' + t.type + '">' + esc(t.label) + '</option>').join('') + '</optgroup>').join('');
    const title = resource.key === 'variants' ? 'Add variant metafield definition' : 'Add product metafield definition';
    paint(
      '<div class="flex items-center gap-3 mb-4">' +
        '<button class="back-btn" data-act="def-back" title="Back">' + I.chevL + '</button>' +
        '<div class="page-title" style="font-size:18px">' + esc(title) + '</div>' +
      '</div>' +
      '<div class="panel card-pad">' +
        field('Name', '', 'Name') +
        field('Namespace and key', '', 'namespace.key', { addonBefore: 'custom.' }) +
        '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Type <span style="color:var(--err)">*</span></div>' +
          '<select class="input"><option value="" disabled selected>Select type</option>' + typeOpts + '</select></div>' +
        '<div><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Description (Optional)</div>' +
          '<textarea class="input" rows="3" placeholder="Please Enter" style="height:auto;padding:8px 12px;resize:vertical"></textarea></div>' +
      '</div>' +
      '<div class="flex justify-end gap-2 mt-4">' +
        '<button class="btn btn-default" data-act="def-cancel">Cancel</button>' +
        '<button class="btn btn-primary" data-act="def-add">Add</button>' +
      '</div>',
      true
    );
    const goBack = () => { mfAdding = false; renderMetafields(); };
    const back = root.querySelector('[data-act="def-back"]'); if (back) back.onclick = goBack;
    const cancel = root.querySelector('[data-act="def-cancel"]'); if (cancel) cancel.onclick = goBack;
    const add = root.querySelector('[data-act="def-add"]'); if (add) add.onclick = () => { mfAdding = false; toast(resource.key + ' metafield definition created successfully'); renderMetafields(); };
  }

  // ===========================================================================
  // TAB 6 — SHIPPABLE LOCATIONS  ("Ship locations", full width)
  //   index.vue + list.tsx + table.tsx: filter bar + expandable table
  //   (Country/Region / Located in / Status (Visible|Hidden) / Sort / Action).
  //   LocationFormModal: Country/Region + Located in + Status radio + Sort.
  // ===========================================================================
  function flattenLocations(nodes, depth, acc, openSet) {
    nodes.forEach((n) => {
      acc.push({ node: n, depth: depth });
      if (n.children && n.children.length && openSet.has(n.id)) {
        flattenLocations(n.children, depth + 1, acc, openSet);
      }
    });
    return acc;
  }
  let locOpen = new Set([1]); // expanded row ids (North America open by default)

  function renderLocations() {
    const tree = D.locations.tree;
    let total = 0;
    tree.forEach((n) => { total++; });

    const rowsHtml = () => {
      const flat = flattenLocations(tree, 0, [], locOpen);
      return flat.map(({ node: n, depth }) => {
        const indent = depth * 16;
        const hasKids = n.snum && n.snum > 0;
        const caret = hasKids
          ? '<button class="loc-caret' + (locOpen.has(n.id) ? ' open' : '') + '" data-loc-toggle="' + n.id + '">' + I.chevR + '</button>'
          : '<span style="width:16px;display:inline-block"></span>';
        const flag = depth === 0 && n.code ? '<span class="ccy-flag" style="width:20px;height:14px">' + esc(n.code) + '</span>' : (depth === 0 ? '<span class="ccy-flag" style="width:20px;height:14px"></span>' : '');
        const vis = n.is_show === 1;
        const sortVal = (!n.sort || Number(n.sort) === 0) ? '--' : n.sort;
        return '<tr data-locrow="' + n.id + '">' +
          '<td><div class="flex items-center gap-2" style="padding-left:' + indent + 'px">' + caret + flag + '<span>' + esc(n.name) + '</span></div></td>' +
          '<td class="muted">' + (n.located_in ? esc(n.located_in) : '- -') + '</td>' +
          '<td><div class="flex items-center gap-2">' + toggle(vis, n.name + ' status') + '<span class="muted">' + (vis ? 'Visible' : 'Hidden') + '</span></div></td>' +
          '<td class="muted">' + esc(sortVal) + '</td>' +
          '<td><div class="flex items-center gap-1">' +
            '<button class="set-icon-btn" data-loc-edit="' + n.id + '" title="Edit">' + I.pencil + '</button>' +
            '<button class="set-icon-btn danger" data-loc-del="' + n.id + '" title="Delete">' + I.trash + '</button>' +
          '</div></td>' +
        '</tr>';
      }).join('');
    };

    paint(
      pageHead('Ship locations', 'Set delivery regions at checkout', '<button class="btn btn-primary" data-act="loc-add">Add location</button>') +
      '<div class="panel">' +
        '<div class="card-pad" style="background:#fff;border-bottom:1px solid var(--hair);padding:16px">' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            '<select class="filter-select" style="width:150px"><option value="country">Country/Region</option><option value="locatedIn">Located in</option></select>' +
            '<input class="filter-input" placeholder="Search" style="padding-left:12px;width:268px" />' +
            '<select class="filter-select" style="width:160px"><option>Status</option><option>Visible</option><option>Hidden</option></select>' +
          '</div>' +
        '</div>' +
        '<div style="overflow-x:auto"><table class="tbl loc-table" style="min-width:760px">' +
          '<thead><tr><th>Country/Region</th><th>Located in</th><th style="width:160px">Status</th><th style="width:120px">Sort</th><th style="width:110px">Action</th></tr></thead>' +
          '<tbody id="loc-tbody">' + rowsHtml() + '</tbody>' +
        '</table></div>' +
        '<div class="flex items-center justify-between card-pad"><span class="muted" style="font-size:13px">Total ' + total + ' records</span></div>' +
      '</div>',
      false
    );

    const wire = () => {
      root.querySelectorAll('[data-loc-toggle]').forEach((el) => el.onclick = (e) => {
        e.stopPropagation();
        const id = Number(el.getAttribute('data-loc-toggle'));
        if (locOpen.has(id)) locOpen.delete(id); else locOpen.add(id);
        const tb = root.querySelector('#loc-tbody'); if (tb) { tb.innerHTML = rowsHtml(); wire(); }
      });
      root.querySelectorAll('[data-loc-edit]').forEach((el) => el.onclick = (e) => { e.stopPropagation(); openLocationModal('edit', Number(el.getAttribute('data-loc-edit'))); });
      root.querySelectorAll('[data-loc-del]').forEach((el) => el.onclick = (e) => {
        e.stopPropagation();
        confirm({ title: 'Delete location', content: 'Once deleted, the data cannot be retrieved. Please confirm before proceeding!', okText: 'Delete', danger: true, onOk: () => toast('Location deleted successfully') });
      });
    };
    wire();
    const add = root.querySelector('[data-act="loc-add"]'); if (add) add.onclick = () => openLocationModal('add');
  }

  function findLocNode(nodes, id) {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) { const f = findLocNode(n.children, id); if (f) return f; }
    }
    return null;
  }

  function openLocationModal(mode, id) {
    const rec = mode === 'edit' ? findLocNode(D.locations.tree, id) : null;
    // flat list of all locations as "Located in" options
    const flatOpts = [];
    const walk = (nodes, prefix) => nodes.forEach((n) => {
      flatOpts.push({ id: n.id, label: (prefix ? prefix + ' > ' : '') + n.name });
      if (n.children) walk(n.children, (prefix ? prefix + ' > ' : '') + n.name);
    });
    walk(D.locations.tree, '');
    const vis = rec ? rec.is_show === 1 : true;
    const body =
      field('Country/Region', rec ? rec.name : '', 'Country/Region') +
      '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Located in <span style="color:var(--err)">*</span></div>' +
        '<select class="input"' + (mode === 'edit' ? ' disabled' : '') + '><option value="" disabled' + (rec ? '' : ' selected') + '>Please select</option>' +
          flatOpts.map((o) => '<option value="' + o.id + '"' + (rec && rec.located_in && o.label === (rec.located_in) ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('') +
        '</select></div>' +
      '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Status <span style="color:var(--err)">*</span></div>' +
        '<label class="set-radio' + (vis ? ' on' : '') + '" style="margin-right:16px"><span class="proc-radio">' + (vis ? '<span class="proc-dot"></span>' : '') + '</span>Visible</label>' +
        '<label class="set-radio' + (vis ? '' : ' on') + '"><span class="proc-radio">' + (vis ? '' : '<span class="proc-dot"></span>') + '</span>Hidden</label></div>' +
      '<div><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Sort</div>' +
        '<div class="flex items-center gap-3"><input class="input" type="number" min="0" placeholder="Sort" value="' + (rec && rec.sort ? rec.sort : '') + '" style="width:200px" />' +
        '<span class="muted" style="font-size:12px">Higher sort show first</span></div></div>';
    modal({ title: mode === 'edit' ? 'Edit location' : 'Add location', width: 620, okText: mode === 'edit' ? 'Update' : 'Add', body,
      onOk: (m, close) => { close(); toast(mode === 'edit' ? 'Updated successfully' : 'Added successfully'); } });
  }

  // ===========================================================================
  // TAB 7 — SHIPPING RATES  ("Shipping rates", centered w-860)
  //   list.tsx -> general.tsx / custom.tsx (profile detail with ZonesPanel +
  //   NoChargeAreas; custom adds profile-name + Products). Rate/Zone modals.
  //   sub-state: rateProfile = null (list) | profile id
  // ===========================================================================
  let rateProfile = null;

  function renderRates() {
    const data = D.rates;
    if (rateProfile == null) {
      const general = data.profiles.find((p) => p.is_general === 1);
      const customs = data.profiles.filter((p) => p.is_general === 0);

      const generalRow = general
        ? '<div class="rate-row" data-profile="' + general.id + '">' +
            '<span class="rate-ico">' + I.globe + '</span>' +
            '<span style="flex:1;text-align:left"><span class="muted" style="font-size:13px">Supported shipping ' + general.zones_count + ' zone(s)</span></span>' +
            '<span class="muted">' + I.chevR + '</span></div>'
        : '';
      const generalCard =
        '<div class="panel card-pad mb-4">' +
          '<div class="mb-2"><div class="text-sm" style="font-weight:600;color:var(--ink)">General shipping rates</div>' +
            '<div class="muted" style="font-size:12.5px">All products that are not in other shipping profiles.</div></div>' +
          generalRow +
        '</div>';

      const customRow = (p) =>
        '<div class="rate-row" data-profile="' + p.id + '">' +
          '<span class="rate-ico">' + I.globe + '</span>' +
          '<span style="flex:1;text-align:left">' +
            '<span class="text-sm" style="font-weight:600;color:var(--ink);display:block">' + esc(p.name) + '</span>' +
            '<span class="muted" style="font-size:12.5px">Includes ' + (p.products_count || 0) + ' product(s), available for shipping to ' + (p.regions_count || 0) + ' region(s)</span>' +
          '</span>' +
          '<span class="muted">' + I.chevR + '</span></div>';
      const customCard =
        '<div class="panel card-pad mb-4">' +
          '<div class="flex items-center justify-between mb-2"><div><div class="text-sm" style="font-weight:600;color:var(--ink)">Custom shipping profile</div>' +
            '<div class="muted" style="font-size:12.5px">Create a shipping profile to add custom rates for groups of products.</div></div>' +
            '<button class="btn btn-primary" data-act="add-profile">Add</button></div>' +
          '<div class="mt-3 flex flex-col gap-3">' + (customs.length ? customs.map(customRow).join('') : '<div class="muted text-sm" style="text-align:center;padding:24px 0">No custom profiles</div>') + '</div>' +
        '</div>';

      paint(
        pageHead('Shipping rates', 'Set shipping fees at checkout.') +
        generalCard + customCard,
        true
      );
      root.querySelectorAll('[data-profile]').forEach((b2) => b2.onclick = () => { rateProfile = Number(b2.getAttribute('data-profile')); renderRates(); });
      const ap = root.querySelector('[data-act="add-profile"]'); if (ap) ap.onclick = () => { rateProfile = 'new'; renderRates(); };
      return;
    }

    renderRateProfile();
  }

  function renderRateProfile() {
    const data = D.rates;
    const isNew = rateProfile === 'new';
    const p = isNew ? null : data.profiles.find((x) => x.id === rateProfile);
    if (!isNew && !p) { rateProfile = null; renderRates(); return; }
    const isCustom = isNew || p.is_general === 0;
    const sym = data.currencySymbol;
    const title = p ? (p.is_general === 1 ? 'General shipping rates' : 'Edit the shipping rates for custom profile') : 'Add the shipping rates for custom profile';

    const rateRule = (rt) => {
      if (rt.condition_type === 'none') return '';
      if (rt.condition_type === 'price') {
        const mn = Number(rt.min_value || 0);
        return rt.max_value == null ? 'Orders ' + sym + mn.toFixed(2) + ' and up' : 'Orders ' + sym + mn.toFixed(2) + '-' + sym + Number(rt.max_value).toFixed(2);
      }
      const mn = Number(rt.min_value || 0);
      return rt.max_value == null ? 'Weight ' + mn.toFixed(2) + 'g and up' : 'Weight ' + mn.toFixed(2) + 'g-' + Number(rt.max_value).toFixed(2) + 'g';
    };
    const ratePrice = (rt) => rt.price === 0
      ? '<span class="rate-free">Free</span>'
      : '<span class="rate-price">' + sym + Number(rt.price).toFixed(2) + '</span>';

    const zones = p ? p.zones : [];
    const zoneBlock = (z) => {
      const areasText = (z.areas && z.areas.length) ? z.areas.join(', ') : (z.region_ids ? z.region_ids.length + ' region(s)' : '');
      const rates = z.rates.length
        ? '<div class="rate-list">' + z.rates.map((rt) =>
            '<div class="rate-item"><div style="min-width:0"><div class="subtle" style="font-weight:500;font-size:13px">' + esc(rt.name) + '</div>' +
              (rateRule(rt) ? '<div class="muted" style="font-size:12px">' + rateRule(rt) + '</div>' : '') + '</div>' +
              '<div class="flex items-center gap-2">' + ratePrice(rt) +
                '<button class="set-icon-btn" data-rate-menu="' + z.id + ':' + rt.id + '" title="More">' + I.dots + '</button></div></div>').join('') + '</div>'
        : '<div class="rate-empty"><div class="muted text-sm">No shipping rates found for this region</div>' +
            '<div style="margin-top:10px"><button class="btn btn-primary" style="height:28px" data-add-rate="' + z.id + '">Add shipping rate</button></div>' +
            '<div style="margin-top:10px;font-size:12px;color:var(--err)">Add shipping to ensure that customers in this area complete the checkout</div></div>';
      return '<div class="zone-block">' +
        '<div class="flex items-center justify-between">' +
          '<div class="flex items-center gap-2"><span class="zone-ico">' + I.truck + '</span><span class="subtle" style="font-weight:600">' + esc(z.name) + '</span></div>' +
          '<div class="flex items-center gap-2">' +
            (z.rates.length ? '<button class="btn btn-gray" style="height:28px" data-add-rate="' + z.id + '">Add shipping rate</button>' : '') +
            '<button class="set-icon-btn" data-zone-menu="' + z.id + '" title="More">' + I.dots + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="muted" style="font-size:12px;margin:4px 0 10px">Includes deliveries to: ' + esc(areasText) + '</div>' +
        rates +
      '</div>';
    };

    const zonesCard =
      '<div class="panel mb-4">' +
        '<div class="flex items-center justify-between card-pad" style="border-bottom:1px solid var(--hair);padding:16px"><div>' +
          '<div class="text-sm" style="font-weight:600;color:var(--ink);font-size:15px">Shipping zones and shipping rates</div>' +
          '<div class="muted" style="font-size:12px;margin-top:2px">Set shipping zones and rates visible to customers at checkout.</div></div>' +
          (zones.length ? '<button class="btn btn-gray" style="height:28px" data-act="add-zone">Add shipping zone</button>' : '') +
        '</div>' +
        (zones.length
          ? '<div class="card-pad flex flex-col gap-3" style="padding:16px">' + zones.map(zoneBlock).join('') + '</div>'
          : '<div class="card-pad" style="text-align:center;padding:40px"><div class="muted text-sm">No shipping zones yet</div>' +
              '<div style="margin-top:10px"><button class="btn btn-primary" style="height:28px" data-act="add-zone">Add shipping zone</button></div></div>') +
      '</div>';

    const noChargeAreas = D.rates.noChargeAreas;
    const noCharge =
      '<div class="panel card-pad mb-4">' +
        '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:6px">Areas with no shipping charges added</div>' +
        (noChargeAreas.length
          ? '<div class="muted" style="font-size:12px">' + noChargeAreas.length + ' countries/regions: ' + esc(noChargeAreas.join(', ')) + '</div>'
          : '<div class="muted text-sm">No data available</div>') +
      '</div>';

    // custom-profile name + products
    let customHead = '';
    if (isCustom) {
      const prods = (p && p.products) || [];
      const prodRows = prods.length
        ? '<div class="rate-list">' + prods.map((pr) =>
            '<div class="rate-item"><div class="flex items-center gap-3"><span class="prod-thumb">IMG</span>' +
              '<div><div class="text-sm">' + esc(pr.store_name) + '</div>' + (pr.spec_type === 1 ? '<div class="muted" style="font-size:12px">(' + pr.variantNum + ' variants selected)</div>' : '') + '</div></div>' +
              '<button class="set-icon-btn" title="Remove">' + I.x + '</button></div>').join('') + '</div>'
        : '<div class="muted text-sm" style="text-align:center;padding:24px 0">No data available<div style="margin-top:8px"><button class="btn btn-primary" style="height:28px" data-act="add-products">Add products</button></div></div>';
      customHead =
        '<div class="panel card-pad mb-4">' +
          '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:6px">Custom profile name <span class="muted" style="font-weight:400">(Customers won\'t see this)</span></div>' +
          '<input class="input" maxlength="100" placeholder="Please enter" value="' + esc(p ? p.name : '') + '" /></div>' +
        '<div class="panel card-pad mb-4">' +
          '<div class="flex items-center justify-between mb-3"><div class="text-sm" style="font-weight:600;color:var(--ink);font-size:15px">Products</div>' +
            (prods.length ? '<button class="btn btn-gray" style="height:28px" data-act="add-products">Add products</button>' : '') + '</div>' +
          prodRows +
        '</div>';
    } else {
      // general profile shows a read-only Products panel
      customHead =
        '<div class="panel card-pad mb-4">' +
          '<div class="text-sm" style="font-weight:600;color:var(--ink);font-size:15px">Products</div>' +
          '<div class="muted" style="font-size:12px;margin-top:4px">All products not in other profiles. Newly created products are added to this profile.</div>' +
          '<div class="muted text-sm" style="text-align:center;padding:24px 0;margin-top:8px;border:1px solid var(--hair);border-radius:8px">No data available</div>' +
        '</div>';
    }

    const footer = isCustom
      ? '<div class="flex items-center ' + (isNew ? 'justify-end' : 'justify-between') + '">' +
          (isNew ? '' : '<button class="btn" style="background:var(--err);color:#fff" data-act="del-profile">Delete group profile</button>') +
          '<button class="btn btn-primary" data-act="save">' + (isNew ? 'Add' : 'Update') + '</button>' +
        '</div>'
      : '<div class="flex justify-end">' + updateBtn + '</div>';

    paint(
      '<div class="flex items-center gap-3 mb-4">' +
        '<button class="back-btn" data-act="rate-back" title="Back">' + I.chevL + '</button>' +
        '<div class="page-title" style="font-size:20px">' + esc(title) + '</div>' +
      '</div>' +
      customHead + zonesCard + noCharge + footer,
      true
    );

    const back = root.querySelector('[data-act="rate-back"]'); if (back) back.onclick = () => { rateProfile = null; renderRates(); };
    root.querySelectorAll('[data-act="save"]').forEach((b2) => b2.onclick = () => { toast(isNew ? 'Created successfully' : 'Updated successfully'); if (isNew) { rateProfile = null; renderRates(); } });
    const az = root.querySelector('[data-act="add-zone"]'); if (az) az.onclick = () => openZoneModal('add');
    const ap2 = root.querySelector('[data-act="add-products"]'); if (ap2) ap2.onclick = () => toast('Add products — select products for this profile');
    const dp = root.querySelector('[data-act="del-profile"]'); if (dp) dp.onclick = () => confirm({ title: 'Delete group profile', content: 'Are you sure you want to delete this profile?', okText: 'Delete', danger: true, onOk: () => { toast('Deleted successfully'); rateProfile = null; renderRates(); } });
    root.querySelectorAll('[data-add-rate]').forEach((b2) => b2.onclick = () => openRateModal('add', Number(b2.getAttribute('data-add-rate')), null));
    root.querySelectorAll('[data-rate-menu]').forEach((b2) => b2.onclick = (e) => {
      const [zid, rid] = b2.getAttribute('data-rate-menu').split(':').map(Number);
      openRowMenu(e.currentTarget, [
        { label: 'Edit rate', onClick: () => openRateModal('edit', zid, rid) },
        { label: 'Delete', danger: true, onClick: () => { const z = (p.zones || []).find((x) => x.id === zid); confirm({ title: 'Delete rate', content: 'Are you sure you want to delete "' + (z ? (z.rates.find((r) => r.id === rid) || {}).name : '') + '"?', okText: 'Delete', danger: true, onOk: () => { if (z) z.rates = z.rates.filter((r) => r.id !== rid); renderRateProfile(); } }); } },
      ]);
    });
    root.querySelectorAll('[data-zone-menu]').forEach((b2) => b2.onclick = (e) => {
      const zid = Number(b2.getAttribute('data-zone-menu'));
      openRowMenu(e.currentTarget, [
        { label: 'Edit zone', onClick: () => openZoneModal('edit', zid) },
        { label: 'Delete', danger: true, onClick: () => { const z = (p.zones || []).find((x) => x.id === zid); confirm({ title: 'Delete zone', content: 'Are you sure you want to delete "' + (z ? z.name : '') + '"?', okText: 'Delete', danger: true, onOk: () => { if (p) p.zones = p.zones.filter((x) => x.id !== zid); renderRateProfile(); } }); } },
      ]);
    });
  }

  // tiny dropdown menu anchored to a button (mirrors Ant Dropdown)
  function openRowMenu(anchor, items) {
    document.querySelectorAll('.row-menu').forEach((m) => m.remove());
    const menu = h('<div class="row-menu"></div>');
    menu.innerHTML = items.map((it, i) => '<button class="row-menu-item' + (it.danger ? ' danger' : '') + '" data-i="' + i + '">' + esc(it.label) + '</button>').join('');
    document.body.appendChild(menu);
    const r = anchor.getBoundingClientRect();
    menu.style.top = (r.bottom + window.scrollY + 4) + 'px';
    menu.style.left = (r.right + window.scrollX - menu.offsetWidth) + 'px';
    menu.querySelectorAll('[data-i]').forEach((el) => el.onclick = () => { const it = items[Number(el.getAttribute('data-i'))]; menu.remove(); it.onClick(); });
    setTimeout(() => {
      const close = (e) => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', close); } };
      document.addEventListener('click', close);
    }, 0);
  }

  function openZoneModal(mode, zoneId) {
    const data = D.rates;
    const p = data.profiles.find((x) => x.id === rateProfile);
    const z = mode === 'edit' && p ? (p.zones || []).find((x) => x.id === zoneId) : null;
    const regionNames = [];
    const walk = (nodes) => nodes.forEach((n) => { regionNames.push(n.name); if (n.children) walk(n.children); });
    walk(D.locations.tree);
    const selected = z && z.areas ? z.areas : [];
    const body =
      '<div style="margin-bottom:16px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Shipping zone name <span class="muted" style="font-weight:400">(Customers won\'t see this)</span></div>' +
        '<input class="input" maxlength="100" placeholder="Please enter shipping zone name" value="' + esc(z ? z.name : '') + '" /></div>' +
      '<div><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Shipping zone</div>' +
        '<div class="zone-region-pick">' +
          regionNames.slice(0, 12).map((nm) =>
            '<label class="edit-check" style="padding:5px 0"><input type="checkbox"' + (selected.includes(nm) ? ' checked' : '') + ' /><span>' + esc(nm) + '</span></label>').join('') +
        '</div></div>';
    modal({ title: mode === 'edit' ? 'Edit shipping zone' : 'Add shipping zone', width: 560, okText: mode === 'edit' ? 'Done' : 'Add', body,
      onOk: (m, close) => { close(); toast('Shipping zone saved'); } });
  }

  function openRateModal(mode, zoneId, rateId) {
    const data = D.rates;
    const p = data.profiles.find((x) => x.id === rateProfile);
    const zone = p ? (p.zones || []).find((z) => z.id === zoneId) : null;
    const rt = (mode === 'edit' && zone) ? (zone.rates.find((r) => r.id === rateId) || {}) : {};
    const sym = data.currencySymbol;
    const cond = rt.condition_type || 'none';
    const hasCond = cond === 'price' || cond === 'weight';

    const condRadio = (val, label) =>
      '<label class="set-radio' + (cond === val ? ' on' : '') + '" data-radio="cond" data-val="' + val + '" style="margin-right:16px"><span class="proc-radio">' + (cond === val ? '<span class="proc-dot"></span>' : '') + '</span>' + esc(label) + '</label>';

    const isPrice = cond === 'price';
    const minMaxBlock = (unit, before) =>
      '<div class="flex items-center gap-3" style="margin-top:8px"><div class="text-sm" style="width:140px">Minimum ' + unit + ':</div>' +
        '<div class="set-addon">' + (before ? '<span class="set-addon-prefix">' + esc(sym) + '</span>' : '') + '<input class="input" type="number" min="0" step="0.01" value="' + (rt.min_value != null ? rt.min_value : '') + '" style="width:120px' + (before ? ';border-top-left-radius:0;border-bottom-left-radius:0' : '') + '" />' + (before ? '' : '<span class="set-addon-suffix">g</span>') + '</div></div>' +
      '<div class="flex items-center gap-3" style="margin-top:8px"><div class="text-sm" style="width:140px">Maximum ' + unit + ':</div>' +
        '<div class="set-addon">' + (before ? '<span class="set-addon-prefix">' + esc(sym) + '</span>' : '') + '<input class="input" type="number" min="0" step="0.01" placeholder="No limit" value="' + (rt.max_value != null ? rt.max_value : '') + '" style="width:120px' + (before ? ';border-top-left-radius:0;border-bottom-left-radius:0' : '') + '" />' + (before ? '' : '<span class="set-addon-suffix">g</span>') + '</div></div>';

    const body =
      '<div style="margin-bottom:14px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Shipping rate name <span class="muted" style="font-weight:400">(Displayed during checkout when the customer chooses a logistics option. PayPal limits this to 24 characters — longer names may cause checkout errors.)</span></div>' +
        '<input class="input" maxlength="24" placeholder="Please enter shipping rate name" value="' + esc(rt.name || '') + '" list="rate-name-sugg" />' +
        '<datalist id="rate-name-sugg">' + data.rateNameSuggestions.map((s) => '<option value="' + esc(s) + '"></option>').join('') + '</datalist></div>' +
      '<div style="margin-bottom:14px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Additional description</div>' +
        '<textarea class="input" rows="3" maxlength="100" placeholder="Additional description for logistic timeliness, delivery noticeand other information, which will be displayed when there is no freight merge. (Optional)" style="height:auto;padding:8px 12px;resize:vertical">' + esc(rt.description || '') + '</textarea></div>' +
      '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Price:</div>' +
        '<div class="set-addon"><span class="set-addon-prefix">' + esc(sym) + '</span><input class="input" type="number" min="0" step="0.01" value="' + (rt.price != null ? rt.price : '') + '" style="width:160px;border-top-left-radius:0;border-bottom-left-radius:0" /></div></div>' +
      '<div style="margin-bottom:10px"><a class="lnk" data-act="toggle-cond">' + (hasCond ? 'Delete conditions' : 'More pricing options') + '</a></div>' +
      '<div data-cond-wrap style="display:' + (hasCond ? 'block' : 'none') + '">' +
        '<div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Charging method <span class="muted" style="font-weight:400">(Conditions are inclusive on both ends: Minimum ≤ value ≤ Maximum)</span></div>' +
        '<div style="margin-bottom:4px">' + condRadio('weight', 'Based on item weight') + condRadio('price', 'Based on order price') + '</div>' +
        '<div data-minmax>' + (cond === 'weight' ? minMaxBlock('weight', false) : minMaxBlock('price', true)) + '</div>' +
      '</div>' +
      '<div style="margin-top:14px"><div class="ctrl-label" style="text-transform:none;margin-bottom:8px">Checkout preview</div>' +
        '<div class="checkout-preview"><div class="checkout-preview-row"><div style="max-width:80%"><div class="text-sm" style="font-weight:500">' + esc(rt.name || 'Shipping rate name') + '</div>' +
          '<div class="muted" style="font-size:12px">' + esc(rt.description || 'Additional description') + '</div></div>' +
          '<div class="text-sm" style="font-weight:500">' + (Number(rt.price || 0) === 0 ? '<span class="rate-free">Free</span>' : sym + Number(rt.price || 0).toFixed(2)) + '</div></div></div>' +
      '</div>';

    const ctrl = modal({ title: mode === 'edit' ? 'Edit shipping rate' : 'Add shipping rate', width: 640, okText: mode === 'edit' ? 'Done' : 'Add', body,
      onOk: (m, close) => { close(); toast('Shipping rate saved'); } });

    // toggle "More pricing options"
    const tog = ctrl.m.querySelector('[data-act="toggle-cond"]');
    const wrap = ctrl.m.querySelector('[data-cond-wrap]');
    if (tog) tog.onclick = () => {
      const open = wrap.style.display === 'none';
      wrap.style.display = open ? 'block' : 'none';
      tog.textContent = open ? 'Delete conditions' : 'More pricing options';
    };
    // charging-method radio toggle + swap min/max units
    const wireCond = () => ctrl.m.querySelectorAll('[data-radio="cond"]').forEach((el) => el.onclick = () => {
      const val = el.getAttribute('data-val');
      ctrl.m.querySelectorAll('[data-radio="cond"]').forEach((s) => { s.classList.remove('on'); const d = s.querySelector('.proc-radio'); if (d) d.innerHTML = ''; });
      el.classList.add('on'); const dot = el.querySelector('.proc-radio'); if (dot) dot.innerHTML = '<span class="proc-dot"></span>';
      const mm = ctrl.m.querySelector('[data-minmax]');
      if (mm) mm.innerHTML = val === 'weight' ? minMaxBlock('weight', false) : minMaxBlock('price', true);
    });
    wireCond();
  }

  // ===========================================================================
  // MODAL (shared) — mirrors the orders prototype modal
  // ===========================================================================
  function modal({ title, body, width, okText, onOk, extraLeft, onExtra, danger, hideCancel, okStyle }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    if (width) m.style.width = width + 'px';
    m.style.maxWidth = 'calc(100vw - 24px)';
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>' + esc(title) + '</span>' +
        '<span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
      '<div class="modal-body" style="max-height:70vh;overflow:auto">' + body + '</div>' +
      '<div class="modal-foot" style="justify-content:' + (extraLeft ? 'space-between' : 'flex-end') + '">' +
        (extraLeft || '') +
        '<div class="flex gap-2">' + (hideCancel ? '' : '<button class="btn btn-default" data-cancel>Cancel</button>') +
        '<button class="btn ' + (danger || okStyle ? '' : 'btn-primary') + '" ' + (danger ? 'style="background:var(--err);color:#fff"' : (okStyle ? 'style="' + okStyle + '"' : '')) + ' data-ok>' + (okText || 'Save') + '</button></div></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-x]').onclick = close;
    const cancelBtn = m.querySelector('[data-cancel]'); if (cancelBtn) cancelBtn.onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => onOk(m, close);
    // submit on Enter from a text input (textarea / Shift+Enter keep newline behavior)
    m.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && e.target && e.target.tagName === 'INPUT') {
        e.preventDefault();
        const okBtn = m.querySelector('[data-ok]');
        if (okBtn) okBtn.click();
      }
    });
    const disc = m.querySelector('[data-disc]'); if (disc && onExtra) disc.onclick = () => onExtra(m, close);
    // generic radio/checkbox visual toggles inside modal (skip ones wired by caller)
    m.querySelectorAll('.set-radio:not([data-radio]), .set-radio2').forEach((el) => el.onclick = () => {
      const grp = el.parentElement;
      grp.querySelectorAll('.set-radio, .set-radio2').forEach((s) => { s.classList.remove('on'); const d = s.querySelector('.proc-radio'); if (d) d.innerHTML = ''; });
      el.classList.add('on'); const dot = el.querySelector('.proc-radio'); if (dot) dot.innerHTML = '<span class="proc-dot"></span>';
    });
    return { m, close };
  }

  // ===========================================================================
  // ROUTER  (SPA: shell passes `rest` = the part after #/settings/)
  // sub-page ids: base | payments | currency | checkout | metafields |
  //   shippable-locations | shipping-rates. Deeper segments pre-seed drill state.
  // ===========================================================================
  // ===========================================================================
  // V1.129 Staff and permissions — Roles + Staff (replaces the earlier stubs).
  // SSO grants a store; inside the store admin you manage Roles (menu/permission
  // tree) and Staff (5-state account lifecycle). Mock data is module-scoped so the
  // CRUD flows mutate and re-render in place.
  // ===========================================================================
  const ROLE_NAMES = ['Administrator', 'Operations Specialist', 'Customer Service Representative', 'Order Specialist'];
  const PERM_TREE = [
    { title: 'Home', children: ['Dashboard'] },
    { title: 'Orders', children: ['Order list', 'Order detail', 'Shipping', 'Edit shipping address', 'Refund', 'Note'] },
    { title: 'Products', children: ['Product list', 'Add product', 'Edit product', 'Collections'] },
    { title: 'Discounts', children: ['Discount list', 'Add discount', 'Edit discount'] },
    { title: 'Customers', children: ['Customer list', 'Customer detail'] },
    { title: 'Inbox', children: ['Inbox', 'Reply', 'Close', 'Knowledge', 'Hours', 'Inbox settings'] },
    { title: 'Content', children: ['Blog', 'Page', 'Menu'] },
    { title: 'Google', children: ['Google sync'] },
    { title: 'Settings', children: ['Basic settings', 'Payments', 'Staff and permissions'] },
  ];
  const ALL_LEAVES = PERM_TREE.reduce((a, p) => a.concat(p.children), []);
  let rolesData = [
    { role: 'Administrator', desc: 'Full access to all features and settings', members: 5, perms: ALL_LEAVES.slice() },
    { role: 'Operations Specialist', desc: 'Manages products, marketing, and orders', members: 4, perms: ['Product list', 'Add product', 'Edit product', 'Collections', 'Discount list', 'Add discount', 'Order list', 'Order detail'] },
    { role: 'Customer Service Representative', desc: 'Manages customer inquiries, returns, and exchanges', members: 3, perms: ['Customer list', 'Customer detail', 'Order list', 'Order detail', 'Note', 'Refund', 'Inbox', 'Reply', 'Close', 'Knowledge'] },
    { role: 'Order Specialist', desc: '', members: 0, perms: ['Order list', 'Order detail', 'Shipping', 'Edit shipping address'] },
  ];
  let staffData = [
    { email: 'zhangsan@gmail.com', role: ['Administrator'], name: 'Zhang San', status: 'Active' },
    { email: 'lisi@gmail.com', role: ['Operations Specialist'], name: 'Li Si', status: 'Inactive' },
    { email: 'wangwu@gmail.com', role: ['Customer Service Representative'], name: 'Wang Wu', status: 'Invite pending' },
    { email: 'liuma@gmail.com', role: ['Order Specialist'], name: '', status: 'Request pending' },
    { email: 'chenliu@gmail.com', role: ['Administrator'], name: 'Chen Liu', status: 'Request rejected' },
  ];
  let accessCode = '0815';
  const STAFF_PILL = { 'Active': 'pill-green', 'Inactive': 'pill-gray', 'Invite pending': 'pill-orange', 'Request pending': 'pill-blue', 'Request rejected': 'pill-red' };
  const ALL_STATUSES = ['Active', 'Inactive', 'Invite pending', 'Request pending', 'Request rejected'];

  // inline svgs scoped to these pages
  const SP_X = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  const SP_CARET = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
  const SP_CHEVR = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
  const SP_REVIEW = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>';

  const SP_STYLES = `
  .sp-wrap { width: 1000px; max-width: 100%; margin: 0 auto; }
  .sp-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
  .sp-sub { color: var(--ink-muted); font-size: 13px; margin-top: 4px; }
  .sp-actions { display: flex; align-items: center; gap: 10px; flex: none; }
  .sp-card { border: 1px solid var(--hair); border-radius: 12px; overflow: visible; background: #fff; }
  .sp-filter { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--hair); }
  .sp-search { display: flex; align-items: center; height: 36px; border: 1px solid var(--ctl); border-radius: 8px; overflow: hidden; background: #fff; }
  .sp-search .lbl { display: flex; align-items: center; height: 100%; padding: 0 12px; font-size: 13px; font-weight: 600; color: var(--ink); background: var(--panel); border-right: 1px solid var(--hair); }
  .sp-search input { height: 100%; min-width: 240px; padding: 0 12px; border: 0; outline: 0; font-size: 13px; color: var(--ink); background: transparent; }
  .sp-search .ui-select { border: 0 !important; border-right: 1px solid var(--hair) !important; border-radius: 0 !important; height: 100%; background: var(--panel); min-width: 92px; }
  .sp-field-sel { min-width: 92px; }
  .sp-dd { position: relative; }
  .sp-dd-btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; border: 1px solid var(--ctl); border-radius: 8px; background: #fff; font-size: 13px; color: var(--ink); cursor: pointer; }
  .sp-dd-btn svg { color: var(--ink-muted); }
  .sp-dd-menu { position: absolute; top: 42px; left: 0; min-width: 200px; background: #fff; border: 1px solid var(--hair); border-radius: 8px; box-shadow: var(--float-shadow); padding: 6px; z-index: 50; }
  .sp-dd-menu[hidden] { display: none; }
  .sp-opt { display: flex; align-items: center; gap: 9px; padding: 7px 8px; border-radius: 6px; font-size: 13px; color: var(--ink-body); cursor: pointer; }
  .sp-opt:hover { background: var(--panel); }
  .sp-opt input { width: 15px; height: 15px; accent-color: var(--brand); }
  .sp-chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px; }
  .sp-chips:not(:empty) { padding: 12px 16px 2px; }
  .sp-chip { display: inline-flex; align-items: center; gap: 8px; padding: 5px 10px; border-radius: 6px; background: #eef2ff; color: #33415c; font-size: 12.5px; }
  .sp-chip button { display: inline-flex; border: 0; background: none; color: #7587b0; cursor: pointer; padding: 0; }
  .sp-ellip { display: inline-block; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom; }
  .sp-foot { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top: 1px solid var(--hair); }
  .sp-empty { padding: 56px 0; text-align: center; color: var(--ink-muted); font-size: 13px; }
  .sp-icon-btn { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 7px; border: 0; background: transparent; color: var(--ink-muted); cursor: pointer; }
  .sp-icon-btn:hover { background: var(--panel); color: var(--ink); }
  .sp-icon-btn.danger:hover { color: var(--err); }
  /* modal form fields */
  .sp-field { margin-bottom: 16px; }
  .sp-label { display: block; margin-bottom: 7px; font-size: 13.5px; font-weight: 600; color: #2f3542; }
  .sp-input-wrap { position: relative; }
  .sp-input { width: 100%; height: 42px; padding: 0 54px 0 14px; border: 1px solid var(--ctl); border-radius: 6px; font-size: 14px; color: var(--ink); box-sizing: border-box; outline: none; }
  .sp-input:focus { border-color: var(--brand); box-shadow: 0 0 0 2px rgb(0 102 230 / 8%); }
  .sp-input.err { border-color: var(--err); }
  .sp-input[disabled] { background: var(--panel); color: var(--ink-muted); }
  .sp-cnt { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--ink-muted); }
  .sp-err { margin-top: 6px; color: var(--err); font-size: 13px; }
  .sp-err:empty { display: none; }
  /* permission tree */
  .perm-tree { border: 1px solid var(--hair); border-radius: 8px; padding: 6px 6px; max-height: 280px; overflow: auto; }
  .perm-row { display: flex; align-items: center; gap: 4px; padding: 3px 6px; }
  .perm-caret { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; padding: 0; border: 0; background: none; color: var(--ink-muted); cursor: pointer; transition: transform .12s; flex: none; }
  .perm-caret.open { transform: rotate(90deg); }
  .perm-children { padding-left: 30px; padding-bottom: 4px; display: flex; flex-direction: column; }
  .perm-children[hidden] { display: none; }
  .chk { display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--ink-body); cursor: pointer; padding: 4px 0; }
  .chk input { width: 15px; height: 15px; accent-color: var(--brand); cursor: pointer; flex: none; }
  /* role multi-select */
  .sp-ms-box { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 42px; padding: 6px 12px; border: 1px solid var(--ctl); border-radius: 6px; cursor: pointer; }
  .sp-ms-box.err { border-color: var(--err); }
  .sp-ms-ph { color: var(--ink-muted); font-size: 14px; }
  .sp-ms-val { display: flex; flex-wrap: wrap; gap: 6px; }
  .sp-ms-tag { background: #f0f1f3; border-radius: 4px; padding: 2px 8px; font-size: 13px; color: var(--ink); }
  .sp-ms-list { margin-top: 6px; border: 1px solid var(--hair); border-radius: 8px; padding: 6px; }
  .sp-ms-list[hidden] { display: none; }
  /* radio (Active/Inactive) */
  .sp-radio { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: var(--ink-body); cursor: pointer; margin-right: 28px; }
  .sp-radio input { width: 15px; height: 15px; accent-color: var(--brand); }
  `;

  function spPager() {
    return '<div class="pg"><button class="pg-item" disabled>&lsaquo;</button><button class="pg-item active">1</button><button class="pg-item" disabled>&rsaquo;</button><span class="muted" style="margin-left:8px;font-size:13px">20 / page</span></div>';
  }

  // ---- permission tree (Add/Edit role) ----
  function permTreeHtml(checked) {
    checked = checked || [];
    const cset = new Set(checked);
    return '<div class="perm-tree">' + PERM_TREE.map((p, i) => {
      const childCount = p.children.filter((c) => cset.has(c)).length;
      const allOn = childCount === p.children.length;
      const kids = p.children.map((c) =>
        '<label class="chk"><input type="checkbox" data-leaf="' + esc(c) + '" data-parent="' + i + '"' + (cset.has(c) ? ' checked' : '') + '/><span>' + esc(c) + '</span></label>'
      ).join('');
      return '<div class="perm-node">' +
        '<div class="perm-row"><button type="button" class="perm-caret" data-caret="' + i + '">' + SP_CHEVR + '</button>' +
          '<label class="chk"><input type="checkbox" data-grp="' + i + '"' + (allOn ? ' checked' : '') + '/><span style="font-weight:600">' + esc(p.title) + '</span></label></div>' +
        '<div class="perm-children" data-children="' + i + '" hidden>' + kids + '</div>' +
      '</div>';
    }).join('') + '</div>';
  }
  function wirePermTree(m) {
    m.querySelectorAll('[data-caret]').forEach((btn) => {
      btn.onclick = () => {
        const i = btn.getAttribute('data-caret');
        const kids = m.querySelector('[data-children="' + i + '"]');
        const open = kids.hasAttribute('hidden');
        if (open) kids.removeAttribute('hidden'); else kids.setAttribute('hidden', '');
        btn.classList.toggle('open', open);
      };
    });
    const syncGroup = (i) => {
      const grp = m.querySelector('[data-grp="' + i + '"]');
      const kids = Array.from(m.querySelectorAll('[data-parent="' + i + '"]'));
      const on = kids.filter((k) => k.checked).length;
      grp.checked = on === kids.length && on > 0;
      grp.indeterminate = on > 0 && on < kids.length;
    };
    m.querySelectorAll('[data-grp]').forEach((grp) => {
      grp.onclick = () => {
        const i = grp.getAttribute('data-grp');
        m.querySelectorAll('[data-parent="' + i + '"]').forEach((k) => { k.checked = grp.checked; });
        grp.indeterminate = false;
      };
    });
    m.querySelectorAll('[data-leaf]').forEach((leaf) => {
      leaf.addEventListener('change', () => syncGroup(leaf.getAttribute('data-parent')));
    });
    PERM_TREE.forEach((p, i) => syncGroup(i));
  }
  function collectPerms(m) {
    return Array.from(m.querySelectorAll('[data-leaf]:checked')).map((c) => c.getAttribute('data-leaf'));
  }
  function wireCounter(m, id) {
    const inp = m.querySelector('#' + id), cnt = m.querySelector('#' + id + '-cnt');
    const upd = () => { if (cnt) cnt.textContent = inp.value.length + '/100'; };
    inp.addEventListener('input', upd); upd();
  }

  // ---- role multi-select (Add/Edit/Review staff) ----
  function roleSelectHtml(selected) {
    selected = selected || [];
    const box = selected.length
      ? '<div class="sp-ms-val">' + selected.map((r) => '<span class="sp-ms-tag">' + esc(r) + '</span>').join('') + '</div>'
      : '<span class="sp-ms-ph">Select role</span>';
    const opts = ROLE_NAMES.map((r) => '<label class="chk"><input type="checkbox" data-role value="' + esc(r) + '"' + (selected.indexOf(r) >= 0 ? ' checked' : '') + '/><span>' + esc(r) + '</span></label>').join('');
    return '<div class="sp-ms"><div class="sp-ms-box" data-ms-box>' + box + '<span style="color:var(--ink-muted);flex:none">' + SP_CARET + '</span></div>' +
      '<div class="sp-ms-list" data-ms-list hidden>' + opts + '</div></div>';
  }
  function wireRoleSelect(m) {
    const box = m.querySelector('[data-ms-box]'), list = m.querySelector('[data-ms-list]');
    const toggle = () => { if (list.hasAttribute('hidden')) list.removeAttribute('hidden'); else list.setAttribute('hidden', ''); };
    box.onclick = toggle;
    const redraw = () => {
      const sel = collectRoles(m);
      box.innerHTML = (sel.length
        ? '<div class="sp-ms-val">' + sel.map((r) => '<span class="sp-ms-tag">' + esc(r) + '</span>').join('') + '</div>'
        : '<span class="sp-ms-ph">Select role</span>') + '<span style="color:var(--ink-muted);flex:none">' + SP_CARET + '</span>';
      box.onclick = toggle;
    };
    m.querySelectorAll('[data-role]').forEach((c) => c.addEventListener('change', redraw));
  }
  function collectRoles(m) { return Array.from(m.querySelectorAll('[data-role]:checked')).map((c) => c.value); }
  function setErr(m, key, msg) {
    const el = m.querySelector('[data-err="' + key + '"]'); if (el) el.textContent = msg || '';
  }

  // ===================== ROLES =====================
  let roleQuery = '';
  function roleRowsHtml() {
    const list = rolesData.filter((r) => !roleQuery || r.role.toLowerCase().indexOf(roleQuery.toLowerCase()) >= 0);
    if (!list.length) return '<tr><td colspan="4"><div class="sp-empty">No data</div></td></tr>';
    return list.map((r) => {
      const desc = r.desc ? '<span class="sp-ellip" title="' + esc(r.desc) + '">' + esc(r.desc) + '</span>' : '<span class="muted">- -</span>';
      return '<tr data-role="' + esc(r.role) + '">' +
        '<td style="font-weight:500;color:var(--ink)">' + esc(r.role) + '</td>' +
        '<td class="muted">' + desc + '</td>' +
        '<td>' + r.members + '</td>' +
        '<td><div class="flex" style="gap:2px"><button class="sp-icon-btn" data-edit title="Edit">' + I.pencil + '</button><button class="sp-icon-btn danger" data-del title="Delete">' + I.trash + '</button></div></td>' +
      '</tr>';
    }).join('');
  }
  function refreshRoles(scope) {
    scope.querySelector('#sp-rbody').innerHTML = roleRowsHtml();
    scope.querySelector('#sp-rchips').innerHTML = roleQuery
      ? '<span class="sp-chip">Role: ' + esc(roleQuery) + ' <button data-clear>' + SP_X + '</button></span>' : '';
    wireRoleRows(scope);
  }
  function wireRoleRows(scope) {
    scope.querySelectorAll('#sp-rbody [data-edit]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); openRoleModal(b.closest('tr').getAttribute('data-role')); });
    scope.querySelectorAll('#sp-rbody [data-del]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); deleteRole(b.closest('tr').getAttribute('data-role')); });
    const clear = scope.querySelector('#sp-rchips [data-clear]');
    if (clear) clear.onclick = () => { roleQuery = ''; scope.querySelector('#sp-role-q').value = ''; refreshRoles(scope); };
  }
  function renderRoles() {
    root.innerHTML = '<style>' + SP_STYLES + '</style>' +
      '<div class="sp-wrap">' +
        '<div class="sp-head"><div><div class="page-title">Roles</div><div class="sp-sub">Manage staff roles and access permissions</div></div>' +
          '<button class="btn btn-primary" data-add>Add role</button></div>' +
        '<div class="sp-card">' +
          '<div class="sp-filter"><div class="sp-search"><span class="lbl">Role</span><input id="sp-role-q" placeholder="Search" value="' + esc(roleQuery) + '"/></div></div>' +
          '<div class="sp-chips" id="sp-rchips"></div>' +
          '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Role</th><th>Description</th><th style="width:120px">Member</th><th style="width:120px">Action</th></tr></thead><tbody id="sp-rbody"></tbody></table></div>' +
          '<div class="sp-foot"><span class="muted">Total ' + rolesData.length + ' records</span>' + spPager() + '</div>' +
        '</div>' +
      '</div>';
    const scope = root;
    refreshRoles(scope);
    scope.querySelector('[data-add]').onclick = () => openRoleModal(null);
    const q = scope.querySelector('#sp-role-q');
    q.addEventListener('input', () => { roleQuery = q.value.trim(); refreshRoles(scope); q.focus(); });
  }
  function openRoleModal(roleName) {
    const existing = roleName ? rolesData.find((r) => r.role === roleName) : null;
    const body =
      '<div class="sp-field"><label class="sp-label">Role</label><div class="sp-input-wrap"><input id="r-name" class="sp-input" maxlength="100" placeholder="Example: Order Specialist" value="' + esc(existing ? existing.role : '') + '"/><span class="sp-cnt" id="r-name-cnt">0/100</span></div><div class="sp-err" data-err="r-name"></div></div>' +
      '<div class="sp-field"><label class="sp-label">Description</label><div class="sp-input-wrap"><input id="r-desc" class="sp-input" maxlength="100" placeholder="Example: Handles order fulfillment and shipping logistics" value="' + esc(existing ? existing.desc : '') + '"/><span class="sp-cnt" id="r-desc-cnt">0/100</span></div></div>' +
      '<div class="sp-field"><label class="sp-label">Permission</label>' + permTreeHtml(existing ? existing.perms : []) + '<div class="sp-err" data-err="perm"></div></div>';
    const ref = modal({
      title: existing ? 'Edit role' : 'Add role', width: 560, okText: existing ? 'Update' : 'Add', body,
      onOk: (m, close) => {
        const name = m.querySelector('#r-name').value.trim();
        const desc = m.querySelector('#r-desc').value.trim();
        const perms = collectPerms(m);
        setErr(m, 'r-name', ''); setErr(m, 'perm', ''); m.querySelector('#r-name').classList.remove('err');
        let ok = true;
        if (!name) { setErr(m, 'r-name', 'Please enter role'); m.querySelector('#r-name').classList.add('err'); ok = false; }
        else if (rolesData.some((r) => r.role.toLowerCase() === name.toLowerCase() && (!existing || r.role !== existing.role))) { setErr(m, 'r-name', 'Role already exist'); m.querySelector('#r-name').classList.add('err'); ok = false; }
        if (!perms.length) { setErr(m, 'perm', 'Please select permission'); ok = false; }
        if (!ok) return;
        if (existing) { existing.role = name; existing.desc = desc; existing.perms = perms; toast('Updated successfully'); }
        else { rolesData.push({ role: name, desc, members: 0, perms }); toast('Added successfully'); }
        close(); renderRoles();
      },
    });
    wireCounter(ref.m, 'r-name'); wireCounter(ref.m, 'r-desc'); wirePermTree(ref.m);
  }
  function deleteRole(roleName) {
    const r = rolesData.find((x) => x.role === roleName);
    confirm({
      title: 'Confirm to delete?', okText: 'Confirm', danger: true,
      content: 'Once deleted, the data cannot be retrieved. Please confirm before proceeding!',
      onOk: () => {
        if (r && r.members > 0) { toast('Failed to delete. This role is currently in use'); return; }
        rolesData = rolesData.filter((x) => x.role !== roleName);
        toast('Deleted successfully'); renderRoles();
      },
    });
  }

  // ===================== STAFF =====================
  let staffField = 'Email', staffQuery = '', staffStatuses = [];
  function staffMatch(s) {
    if (staffStatuses.length && staffStatuses.indexOf(s.status) < 0) return false;
    if (!staffQuery) return true;
    const q = staffQuery.toLowerCase();
    const val = staffField === 'Email' ? s.email : staffField === 'Name' ? s.name : s.role.join(', ');
    return String(val).toLowerCase().indexOf(q) >= 0;
  }
  function staffActions(s) {
    const edit = '<button class="sp-icon-btn" data-edit title="Edit">' + I.pencil + '</button>';
    const del = '<button class="sp-icon-btn danger" data-del title="Delete">' + I.trash + '</button>';
    const review = '<button class="sp-icon-btn" data-review title="Review">' + SP_REVIEW + '</button>';
    if (s.status === 'Active' || s.status === 'Inactive') return edit + del;
    if (s.status === 'Invite pending') return del;
    return review + del; // Request pending / Request rejected
  }
  function staffRowsHtml() {
    const list = staffData.filter(staffMatch);
    if (!list.length) return '<tr><td colspan="5"><div class="sp-empty">No data</div></td></tr>';
    return list.map((s) => {
      const roleTxt = s.role.length ? s.role.join(', ') : '- -';
      const name = s.name ? esc(s.name) : '<span class="muted">- -</span>';
      return '<tr data-email="' + esc(s.email) + '">' +
        '<td>' + esc(s.email) + '</td>' +
        '<td><span class="sp-ellip" title="' + esc(roleTxt) + '">' + esc(roleTxt) + '</span></td>' +
        '<td>' + name + '</td>' +
        '<td><span class="pill ' + STAFF_PILL[s.status] + '"><span class="dot"></span>' + s.status + '</span></td>' +
        '<td><div class="flex" style="gap:2px">' + staffActions(s) + '</div></td>' +
      '</tr>';
    }).join('');
  }
  function staffChipsHtml() {
    let chips = '';
    if (staffQuery) chips += '<span class="sp-chip">' + staffField + ': ' + esc(staffQuery) + ' <button data-clear-q>' + SP_X + '</button></span>';
    if (staffStatuses.length) chips += '<span class="sp-chip">Status: ' + staffStatuses.join(', ') + ' <button data-clear-s>' + SP_X + '</button></span>';
    return chips;
  }
  function refreshStaff(scope) {
    scope.querySelector('#sp-sbody').innerHTML = staffRowsHtml();
    scope.querySelector('#sp-schips').innerHTML = staffChipsHtml();
    wireStaffRows(scope);
    const cq = scope.querySelector('#sp-schips [data-clear-q]'); if (cq) cq.onclick = () => { staffQuery = ''; scope.querySelector('#sp-staff-q').value = ''; refreshStaff(scope); };
    const cs = scope.querySelector('#sp-schips [data-clear-s]'); if (cs) cs.onclick = () => { staffStatuses = []; if (scope.querySelector('#sp-status-menu')) scope.querySelectorAll('#sp-status-menu input').forEach((x) => { x.checked = false; }); refreshStaff(scope); };
  }
  function wireStaffRows(scope) {
    scope.querySelectorAll('#sp-sbody [data-edit]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); openStaffModal('edit', b.closest('tr').getAttribute('data-email')); });
    scope.querySelectorAll('#sp-sbody [data-review]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); openStaffModal('review', b.closest('tr').getAttribute('data-email')); });
    scope.querySelectorAll('#sp-sbody [data-del]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); deleteStaff(b.closest('tr').getAttribute('data-email')); });
  }
  function renderStaff() {
    root.innerHTML = '<style>' + SP_STYLES + '</style>' +
      '<div class="sp-wrap">' +
        '<div class="sp-head"><div><div class="page-title">Staff</div><div class="sp-sub">Manage team members and their account access.</div>' +
          '<div class="sp-sub" style="margin-top:6px">Access code: <b id="sp-code" style="color:var(--ink)">' + accessCode + '</b></div></div>' +
          '<div class="sp-actions"><button class="btn" data-gencode>Generate new code</button><button class="btn btn-primary" data-add>Add staff</button></div></div>' +
        '<div class="sp-card">' +
          '<div class="sp-filter">' +
            '<div class="sp-search"><select id="sp-field" class="filter-select sp-field-sel"><option>Email</option><option>Role</option><option>Name</option></select><input id="sp-staff-q" placeholder="Search"/></div>' +
            '<div class="sp-dd"><button class="sp-dd-btn" id="sp-status-btn">Status' + SP_CARET + '</button><div class="sp-dd-menu" id="sp-status-menu" hidden></div></div>' +
          '</div>' +
          '<div class="sp-chips" id="sp-schips"></div>' +
          '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Email</th><th style="width:230px">Role</th><th style="width:130px">Name</th><th style="width:150px">Status</th><th style="width:110px">Action</th></tr></thead><tbody id="sp-sbody"></tbody></table></div>' +
          '<div class="sp-foot"><span class="muted">Total ' + staffData.length + ' records</span>' + spPager() + '</div>' +
        '</div>' +
      '</div>';
    const scope = root;
    refreshStaff(scope);
    scope.querySelector('[data-add]').onclick = () => openStaffModal('add');
    scope.querySelector('[data-gencode]').onclick = () => {
      accessCode = String(Math.floor(1000 + Math.random() * 9000));
      scope.querySelector('#sp-code').textContent = accessCode;
      toast('New access code generated');
    };
    const fsel = scope.querySelector('#sp-field');
    fsel.addEventListener('change', () => { staffField = fsel.value; if (staffQuery) refreshStaff(scope); });
    const q = scope.querySelector('#sp-staff-q');
    q.value = staffQuery;
    q.addEventListener('input', () => { staffQuery = q.value.trim(); refreshStaff(scope); q.focus(); });
    const sbtn = scope.querySelector('#sp-status-btn'), smenu = scope.querySelector('#sp-status-menu');
    smenu.innerHTML = ALL_STATUSES.map((st) => '<label class="sp-opt"><input type="checkbox" value="' + st + '"' + (staffStatuses.indexOf(st) >= 0 ? ' checked' : '') + '/><span>' + st + '</span></label>').join('');
    sbtn.onclick = (e) => { e.stopPropagation(); smenu.hidden = !smenu.hidden; };
    smenu.querySelectorAll('input').forEach((c) => c.addEventListener('change', () => {
      staffStatuses = Array.from(smenu.querySelectorAll('input:checked')).map((x) => x.value);
      refreshStaff(scope);
    }));
    if (!root.__spMenuClose) {
      root.__spMenuClose = true;
      document.addEventListener('mousedown', (e) => {
        const dd = root.querySelector('.sp-dd');
        const menu = root.querySelector('#sp-status-menu');
        if (menu && dd && !dd.contains(e.target)) menu.hidden = true;
      });
    }
  }
  function openStaffModal(mode, email) {
    const s = email ? staffData.find((x) => x.email === email) : null;
    const isAdd = mode === 'add', isReview = mode === 'review';
    const title = isAdd ? 'Add staff' : isReview ? 'Review staff' : 'Edit staff';
    const emailField = isAdd
      ? '<div class="sp-field"><label class="sp-label">Email</label><div class="sp-input-wrap"><input id="s-email" class="sp-input" maxlength="100" placeholder="Example: name@example.com"/><span class="sp-cnt" id="s-email-cnt">0/100</span></div><div class="sp-err" data-err="s-email"></div></div>'
      : '<div class="sp-field"><label class="sp-label">Email</label><input class="sp-input" disabled value="' + esc(s.email) + '"/></div>';
    const selectedRoles = (isReview || isAdd) ? [] : s.role.slice();
    const roleField = '<div class="sp-field"><label class="sp-label">Role</label>' + roleSelectHtml(selectedRoles) + '<div class="sp-err" data-err="s-role"></div></div>';
    const nameField = '<div class="sp-field"><label class="sp-label">Name</label><div class="sp-input-wrap"><input id="s-name" class="sp-input" maxlength="100" placeholder="Please enter full name. Example: John Smith" value="' + esc(s && !isReview ? s.name : '') + '"/><span class="sp-cnt" id="s-name-cnt">0/100</span></div></div>';
    const statusField = (mode === 'edit')
      ? '<div class="sp-field"><label class="sp-label">Status</label><div style="display:flex;align-items:center"><label class="sp-radio"><input type="radio" name="s-status" value="Active"' + (s.status === 'Active' ? ' checked' : '') + '/> Active</label><label class="sp-radio"><input type="radio" name="s-status" value="Inactive"' + (s.status !== 'Active' ? ' checked' : '') + '/> Inactive</label></div></div>'
      : '';
    const body = emailField + roleField + nameField + statusField;
    const okText = isAdd ? 'Add' : isReview ? 'Approve' : 'Update';
    const ref = modal({
      title, width: 560, okText, hideCancel: isReview, body,
      onOk: (m, close) => {
        const roles = collectRoles(m);
        setErr(m, 's-role', ''); setErr(m, 's-email', '');
        let ok = true;
        let emailVal = s ? s.email : '';
        if (isAdd) {
          emailVal = m.querySelector('#s-email').value.trim();
          if (!emailVal) { setErr(m, 's-email', 'Please enter email'); ok = false; }
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) { setErr(m, 's-email', 'The email you entered is invalid'); ok = false; }
          else if (staffData.some((x) => x.email.toLowerCase() === emailVal.toLowerCase())) { setErr(m, 's-email', 'Email already exist'); ok = false; }
        }
        if (!roles.length) { setErr(m, 's-role', 'Please select role'); ok = false; }
        if (!ok) return;
        const name = m.querySelector('#s-name') ? m.querySelector('#s-name').value.trim() : (s ? s.name : '');
        if (isAdd) {
          staffData.unshift({ email: emailVal, role: roles, name, status: 'Invite pending' });
          toast('Add staff successfully');
        } else if (isReview) {
          s.role = roles; s.name = name; s.status = 'Active';
          toast('Staff access approved successfully');
        } else {
          s.role = roles; s.name = name;
          const st = m.querySelector('input[name="s-status"]:checked');
          if (st) s.status = st.value;
          toast('Update staff successfully');
        }
        close(); renderStaff();
      },
    });
    wireRoleSelect(ref.m);
    if (ref.m.querySelector('#s-email-cnt')) wireCounter(ref.m, 's-email');
    if (ref.m.querySelector('#s-name-cnt')) wireCounter(ref.m, 's-name');
    if (isReview) {
      const foot = ref.m.querySelector('.modal-foot .flex');
      const rej = document.createElement('button'); rej.className = 'btn btn-default'; rej.textContent = 'Reject';
      foot.insertBefore(rej, foot.firstChild);
      rej.onclick = () => { s.status = 'Request rejected'; ref.close(); toast('Staff request has been rejected'); renderStaff(); };
    }
  }
  function deleteStaff(email) {
    confirm({
      title: 'Confirm to delete?', okText: 'Confirm', danger: true,
      content: 'Once deleted, the data cannot be retrieved. Please confirm before proceeding!',
      onOk: () => { staffData = staffData.filter((x) => x.email !== email); toast('Deleted successfully'); renderStaff(); },
    });
  }

  // ===========================================================================
  // V1.139 Self-service · DOMAINS  (Settings → Domains)
  //   System (free) domain is auto-connected at provisioning and not deletable.
  //   Custom domains: 3-step Add wizard (input → configure DNS → bound) with
  //   automatic DNS detection + automatic SSL (issue & auto-renew). State machine
  //   per PRD §6.2: pending_verification → ssl_pending → connected (dns_error /
  //   ssl_failed are the failure branches). Mock data is module-scoped and now
  //   carries one domain in EVERY status (connected / redirecting / redirectable /
  //   pending_verification / dns_error / ssl_pending / ssl_failed / system) so a dev
  //   can see each state → available-action mapping at a glance (PRD §6.3).
  // ===========================================================================
  let domainsData = [
    { domain: 'www.nutrofuels.com',         type: 'custom', primary: true,  status: 'connected',            redirectTo: null, verifiable: false },
    { domain: 'nutrofuels.com',             type: 'custom', primary: false, status: 'connected',            redirectTo: 'www.nutrofuels.com', verifiable: true },
    { domain: 'nutrofuels.shop',            type: 'custom', primary: false, status: 'connected',            redirectTo: null },
    { domain: 'shop.nutrofuels.io',         type: 'custom', primary: false, status: 'pending_verification', redirectTo: null },
    { domain: 'go.nutrofuels.io',           type: 'custom', primary: false, status: 'dns_error',            redirectTo: null },
    { domain: 'checkout.nutrofuels.io',     type: 'custom', primary: false, status: 'ssl_pending',          redirectTo: null },
    { domain: 'promo.nutrofuels.io',        type: 'custom', primary: false, status: 'ssl_failed',           redirectTo: null },
    { domain: 'nutrofuels.stores.bestshopio.com', type: 'system', primary: false, status: 'connected',      redirectTo: null },
  ];
  let domainStep = null;   // null = list · 'add' = configure DNS · 'bound' = binding / success (set by show())
  let pendingDomain = '';  // domain being added through the wizard
  let domainBinding = null; // { domain, ready, failed, phase } — prototype stand-in for the async Ops task
  let domainVerificationDomain = '';
  let domainVerificationAttempt = 0;
  let emailSendingDomainId = null;
  let emailSendingVerificationTimer = null;

  const DOMAIN_BADGE = {
    connected:            { cls: 'pill-green',  label: 'Connected' },
    pending_verification: { cls: 'pill-orange', label: 'Pending verification' },
    dns_error:            { cls: 'pill-red',    label: 'DNS error' },
    ssl_pending:          { cls: 'pill-blue',   label: 'SSL pending' },
    ssl_failed:           { cls: 'pill-red',    label: 'SSL failed' },
  };
  const PLATFORM_IP = '76.223.54.18';
  const PLATFORM_CNAME = 'connect.bestshopio.com';

  const DOMAIN_STYLES = `
  .dom-wrap { width: 860px; max-width: 100%; margin: 0 auto; }
  .dom-list { border: 1px solid var(--hair); border-radius: 12px; overflow: hidden; background: #fff; }
  .dom-row { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-bottom: 1px solid var(--hair); }
  .dom-row:last-child { border-bottom: none; }
  .dom-ico { width: 36px; height: 36px; border-radius: 8px; background: #eef2ff; color: var(--brand); display: grid; place-items: center; flex: none; }
  .dom-info { flex: 1; min-width: 0; }
  .dom-name { font-weight: 600; font-size: 14px; color: var(--ink); }
  .dom-meta { color: var(--ink-muted); font-size: 12.5px; margin-top: 3px; }
  .dom-meta a { color: var(--brand); cursor: pointer; }
  .dom-actions { display: flex; align-items: center; gap: 14px; flex: none; }
  .dom-link { color: var(--ink-muted); font-size: 13px; font-weight: 500; cursor: pointer; background: none; border: 0; }
  .dom-link:hover { color: var(--ink); }
  .dom-link.danger { color: var(--err); }
  /* add-domain wizard */
  .dstep { display: flex; align-items: center; gap: 10px; margin: 4px 0 24px; font-size: 13px; color: var(--ink-muted); }
  .dstep .sp { display: flex; align-items: center; gap: 8px; }
  .dstep .sn { width: 22px; height: 22px; border-radius: 50%; background: var(--panel); color: var(--ink-muted); display: grid; place-items: center; font-size: 12px; font-weight: 700; }
  .dstep .sp.on .sn { background: var(--brand); color: #fff; }
  .dstep .sp.on { color: var(--ink); font-weight: 600; }
  .dstep .sp.ok .sn { background: #2bb673; color: #fff; }
  .dstep .ln { width: 30px; height: 1px; background: var(--hair); }
  .dns-tbl { border: 1px solid var(--hair); border-radius: 8px; overflow: hidden; }
  .dns-tr { display: grid; grid-template-columns: 96px 90px 1fr 86px; align-items: center; border-bottom: 1px solid var(--hair); }
  .dns-tr:last-child { border-bottom: none; }
  .dns-th { background: var(--panel); font-size: 11px; font-weight: 700; color: var(--ink-muted); text-transform: uppercase; letter-spacing: .4px; }
  .dns-cell { padding: 11px 14px; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dns-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .dns-copy { font-size: 12px; font-weight: 600; color: var(--brand); border: 1px solid var(--ctl); background: #fff; border-radius: 6px; padding: 5px 10px; cursor: pointer; }
  .ssl-pill { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-muted); margin-top: 16px; }
  .ssl-spin { width: 13px; height: 13px; border: 2px solid var(--brand); border-top-color: transparent; border-radius: 50%; animation: dsp .7s linear infinite; }
  @keyframes dsp { to { transform: rotate(360deg); } }
  .dns-fail { display: flex; align-items: flex-start; gap: 10px; margin-top: 16px; padding: 12px 14px; border-radius: 8px; background: #fdecea; color: #b3261e; font-size: 13px; line-height: 1.5; }
  .dns-fail svg { width: 16px; height: 16px; flex: none; margin-top: 1px; }
  .dbound { text-align: center; padding: 30px 20px 12px; }
  .dbound .ck { width: 60px; height: 60px; border-radius: 50%; background: #e7f7ee; color: #2bb673; display: grid; place-items: center; margin: 0 auto 16px; }
  .dbinding { min-height: 190px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .dbinding .ssl-spin { width: 34px; height: 34px; border-width: 3px; margin: 0 auto 18px; }
  /* modal form fields (Connect domain) — same look as the Roles/Staff modal inputs */
  .sp-field { margin-bottom: 16px; }
  .sp-label { display: block; margin-bottom: 7px; font-size: 13.5px; font-weight: 600; color: #2f3542; }
  .sp-input-wrap { position: relative; }
  .sp-input { width: 100%; height: 42px; padding: 0 14px; border: 1px solid var(--ctl); border-radius: 6px; font-size: 14px; color: var(--ink); box-sizing: border-box; outline: none; background: #fff; }
  .sp-input::placeholder { color: var(--ink-muted); }
  .sp-input:focus { border-color: var(--brand); box-shadow: 0 0 0 2px rgb(0 102 230 / 8%); }
  .sp-input.err { border-color: var(--err); }
  .sp-err { margin-top: 6px; color: var(--err); font-size: 13px; }
  .sp-err:empty { display: none; }
  .email-sending-domain-input.is-error { border-color: var(--err); box-shadow: 0 0 0 2px rgb(211 54 18 / 10%); }
  .email-sending-domain-error { margin-top: 6px; color: var(--err); font-size: 12px; line-height: 1.5; }
  .email-sending-domain-error:empty { display: none; }
  @media (max-width: 720px) { .dns-tr { grid-template-columns: 1fr; } .dns-th { display: none; } .dns-cell { border-bottom: 1px solid var(--hair); } .dom-row { flex-wrap: wrap; } }
  `;

  function domainMetaLine(d) {
    if (d.type === 'system') return 'Free store domain · always available';
    if (d.primary) return 'Primary domain';
    if (d.status === 'connected') {
      return d.redirectTo
        ? 'Redirects to ' + esc(d.redirectTo) + ' · <a data-primary="' + esc(d.domain) + '">Set as primary</a>'
        : '<a data-primary="' + esc(d.domain) + '">Set as primary</a> · <a data-redirect="' + esc(d.domain) + '">Redirect</a>';
    }
    if (d.status === 'pending_verification' || d.status === 'dns_error') {
      const msg = d.status === 'dns_error' ? 'DNS records not detected yet' : 'Waiting for DNS records';
      return msg + ' · <a data-verify="' + esc(d.domain) + '">Verify now</a> · <a data-guide="' + esc(d.domain) + '">View guide</a>';
    }
    if (d.status === 'ssl_pending') return 'DNS verified · issuing SSL certificate…';
    if (d.status === 'ssl_failed') return 'SSL issuance failed · <a data-verify="' + esc(d.domain) + '">Retry</a>';
    return '';
  }
  function pairedStorefrontDomain(domain) {
    const counterpart = domain.indexOf('www.') === 0 ? domain.slice(4) : 'www.' + domain;
    const current = domainsData.find((d) => d.type === 'custom' && d.domain === domain) || null;
    const paired = domainsData.find((d) => d.type === 'custom' && d.domain === counterpart) || null;
    return paired && ((current && current.verifiable === false) || paired.verifiable === false) ? paired : null;
  }
  function isDomainPairLocked(d) {
    const paired = pairedStorefrontDomain(d.domain);
    return !!(d.primary || (paired && paired.primary));
  }
  function domainRowHtml(d) {
    const badge = DOMAIN_BADGE[d.status] || { cls: 'pill-gray', label: d.status };
    const sslSuffix = (d.primary && d.status === 'connected') ? ' · SSL active' : '';
    // Primary + system domains are not deletable — you must set another domain as primary first (PRD §6.3).
    const del = (d.type === 'system' || isDomainPairLocked(d)) ? '' : '<button class="dom-link danger" data-del="' + esc(d.domain) + '">Delete</button>';
    return '<div class="dom-row">' +
        '<div class="dom-ico">' + I.globe + '</div>' +
        '<div class="dom-info"><div class="dom-name">' + esc(d.domain) + '</div>' +
          '<div class="dom-meta">' + domainMetaLine(d) + '</div></div>' +
        '<div class="dom-actions"><span class="pill ' + badge.cls + '"><span class="dot"></span>' + badge.label + sslSuffix + '</span>' + del + '</div>' +
      '</div>';
  }
  function emailSendingDomainRowHtml(d) {
    const sender = D.notifications.sender;
    const profile = sender.profile || {};
    const active = nfActiveDomain();
    const tx = (text) => window.I18N && typeof window.I18N.t === 'function' ? window.I18N.t(text) : text;
    const isActive = !!active && active.id === d.id;
    const senderAddress = (d.default ? sender.platformLocalPart : profile.localPart) + '@' + d.domain;
    const badge = isActive
      ? { cls: 'pill-green', label: 'Connected' }
      : d.status === 'connected'
        ? { cls: 'pill-green', label: 'Connected' }
        : d.status === 'dns_error'
          ? { cls: 'pill-red', label: 'DNS error' }
          : d.default
            ? { cls: 'pill-gray', label: 'BestShopio default' }
            : { cls: 'pill-orange', label: 'Pending verification' };
    const meta = d.default
      ? tx('BestShopio-managed default sending domain') + ' · ' + tx('Sender address') + ': ' + esc(senderAddress) + ' · ' + tx('Used for all transactional emails')
      : isActive
        ? tx('Used for all transactional emails') + ' · ' + esc(senderAddress)
        : d.status === 'connected'
          ? tx('Used for all transactional emails') + ' · ' + esc(senderAddress)
          : d.status === 'dns_error'
          ? tx('DNS records not detected yet')
            : tx('Waiting for DNS records');
    const needsVerification = !d.default && ['pending_verification', 'dns_error'].includes(d.status);
    const displayMeta = meta + (needsVerification
      ? ' · <a data-email-verify-now="' + esc(d.id) + '">' + tx('Verify now') + '</a> · <a data-email-guide="' + esc(d.id) + '">' + tx('View guide') + '</a>'
      : '');
    const del = !d.default
      ? '<button class="dom-link danger" data-remove-email-list="' + esc(d.id) + '">Delete</button>'
      : '';
    return '<div class="dom-row">' +
      '<div class="dom-ico email">' + I.globe + '</div>' +
      '<div class="dom-info"><div class="dom-name">' + esc(d.domain) + '</div><div class="dom-meta">' + displayMeta + '</div></div>' +
      '<div class="dom-actions"><span class="pill ' + badge.cls + '"><span class="dot"></span>' + badge.label + '</span>' + del + '</div>' +
    '</div>';
  }
  function renderDomainList() {
    paint(
      '<style>' + DOMAIN_STYLES + '</style><div class="dom-wrap">' +
        pageHead('Domains', 'Connect a custom domain. SSL is issued and renewed automatically — you never touch a certificate.',
          '<button class="btn btn-primary" data-add-domain>Add domain</button>') +
        '<div class="dom-list">' + domainsData.map(domainRowHtml).join('') + '</div>' +
        '<button class="email-sending-entry" data-email-sending><span class="email-sending-entry-ico">' + I.globe + '</span><span><strong>Email sending</strong><small>Manage the sender domain used for transactional emails. This does not create a storefront or checkout address.</small></span><span class="email-sending-entry-arrow">›</span></button>' +
        '<div class="set-note" style="margin-top:18px"><div style="font-weight:600;color:var(--ink);margin-bottom:4px">SSL is automatic</div>' +
          '<div class="muted" style="font-size:12.5px;line-height:1.5">BestShopio issues and renews SSL certificates for every connected domain. You never touch a certificate or a server.</div></div>' +
      '</div>',
      false
    );
    root.querySelector('[data-add-domain]').onclick = openAddDomainModal;
    root.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => deleteDomain(b.getAttribute('data-del')));
    root.querySelectorAll('[data-primary]').forEach((b) => b.onclick = () => setPrimaryDomain(b.getAttribute('data-primary')));
    root.querySelectorAll('[data-verify]').forEach((b) => b.onclick = () => verifyDomain(b.getAttribute('data-verify')));
    root.querySelectorAll('[data-guide]').forEach((b) => b.onclick = () => { pendingDomain = b.getAttribute('data-guide'); location.hash = '#/settings/domains/add'; });
    root.querySelectorAll('[data-redirect]').forEach((b) => b.onclick = () => redirectDomain(b.getAttribute('data-redirect')));
    root.querySelector('[data-email-sending]').onclick = () => { location.hash = '#/settings/domains/email-sending'; };
  }

  function renderDomainListByType() {
    const listStyles = '<style>' + DOMAIN_STYLES + '.domain-page-sections{display:flex;flex-direction:column;gap:20px}.domain-type-head{display:flex;align-items:flex-start;gap:11px;margin:0 0 10px}.domain-type-icon{display:grid;place-items:center;width:32px;height:32px;border-radius:8px;background:#eef3ff;color:var(--brand);flex:none}.domain-type-icon.email{background:#edf8f2;color:#16875b}.domain-type-title{font-size:14px;font-weight:650;line-height:1.35;color:var(--ink)}.domain-type-copy{margin-top:2px;font-size:12.5px;line-height:1.5;color:var(--ink-muted)}.email-sending-summary{display:flex;align-items:center;gap:13px;width:100%;padding:16px 18px;box-sizing:border-box;border:1px solid var(--hair);border-radius:12px;background:#fff;color:var(--ink);font:inherit;text-align:left}.email-sending-summary-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:9px;background:#edf8f2;color:#16875b;flex:none}.email-sending-summary-main{flex:1;min-width:0}.email-sending-summary-title{font-size:14px;font-weight:650;line-height:1.4;color:var(--ink)}.email-sending-summary-copy{margin-top:3px;font-size:12.5px;line-height:1.5;color:var(--ink-muted)}.email-sending-summary-address{margin-top:5px;font-size:12.5px;font-weight:600;line-height:1.4;color:var(--ink-body);overflow-wrap:anywhere}.email-sending-summary-status{flex:none}@media(max-width:720px){.email-sending-summary{align-items:flex-start}.email-sending-summary-status{display:none}}</style>';
    const senderDomains = D.notifications.sender.domains.slice().sort((a, b) => Number(!a.default) - Number(!b.default));
    const hasCustomSenderDomain = senderDomains.some((d) => !d.default);
    const emailDomainAction = hasCustomSenderDomain ? '' : '<button class="btn btn-primary" data-add-email-domain>Add sending domain</button>';
    const emailDomainHeadClass = hasCustomSenderDomain ? 'domain-type-head' : 'domain-type-head domain-type-head-with-action';
    paint(listStyles + '<style>.dom-ico.email{background:#edf8f2;color:#16875b}.dom-row.is-detail-link{cursor:pointer}.dom-row.is-detail-link:hover{background:#fbfdff}.dom-row.is-detail-link:focus{outline:2px solid #9fc3ff;outline-offset:-2px}.domain-type-head.domain-type-head-with-action{position:relative;padding-right:142px}.domain-type-head.domain-type-head-with-action>.btn{position:absolute;top:0;right:0;white-space:nowrap}</style><div class="dom-wrap domain-page-sections">' +
      pageHead('Domains', 'Manage the public store address and email sender separately.', '<button class="btn btn-primary" data-add-domain>Add domain</button>') +
      '<section><div class="domain-type-head"><span class="domain-type-icon">' + I.globe + '</span><div><div class="domain-type-title">Storefront domains</div><div class="domain-type-copy">Used for your online store. Includes traffic routing and SSL.</div></div></div><div class="dom-list">' + domainsData.map(domainRowHtml).join('') + '</div><div class="set-note" style="margin-top:18px"><div style="font-weight:600;color:var(--ink);margin-bottom:4px">SSL is automatic</div><div class="muted" style="font-size:12.5px;line-height:1.5">BestShopio issues and renews SSL certificates for every connected storefront domain. You never touch a certificate or a server.</div></div></section>' +
      '<section><div class="' + emailDomainHeadClass + '"><span class="domain-type-icon email">' + I.globe + '</span><div><div class="domain-type-title">Email sending domains</div><div class="domain-type-copy">Used for transactional email. It does not create a storefront or checkout address.</div></div>' + emailDomainAction + '</div><div class="dom-list">' + senderDomains.map(emailSendingDomainRowHtml).join('') + '</div></section>' +
    '</div>', false);
    const addDomainButton = root.querySelector('[data-add-domain]');
    const storefrontDomainHead = root.querySelector('.domain-type-head');
    if (addDomainButton && storefrontDomainHead) {
      storefrontDomainHead.classList.add('domain-type-head-with-action');
      storefrontDomainHead.appendChild(addDomainButton);
    }
    root.querySelector('[data-add-domain]').onclick = openAddDomainModal;
    const addEmailDomain = root.querySelector('[data-add-email-domain]');
    if (addEmailDomain) addEmailDomain.onclick = openEmailSendingDomainModal;
    root.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => deleteDomain(b.getAttribute('data-del')));
    root.querySelectorAll('[data-primary]').forEach((b) => b.onclick = () => setPrimaryDomain(b.getAttribute('data-primary')));
    root.querySelectorAll('[data-verify]').forEach((b) => b.onclick = () => verifyDomain(b.getAttribute('data-verify')));
    root.querySelectorAll('[data-guide]').forEach((b) => b.onclick = () => { pendingDomain = b.getAttribute('data-guide'); location.hash = '#/settings/domains/add'; });
    root.querySelectorAll('[data-redirect]').forEach((b) => b.onclick = () => redirectDomain(b.getAttribute('data-redirect')));
    root.querySelectorAll('[data-email-verify-now]').forEach((link) => link.onclick = (event) => {
      event.stopPropagation();
      startEmailSendingDomainVerification(link.getAttribute('data-email-verify-now'));
    });
    root.querySelectorAll('[data-email-guide]').forEach((link) => link.onclick = (event) => {
      event.stopPropagation();
      openEmailSendingDomainDetail(link.getAttribute('data-email-guide'));
    });
    root.querySelectorAll('[data-remove-email-list]').forEach((b) => b.onclick = () => {
      const id = b.getAttribute('data-remove-email-list');
      const d = D.notifications.sender.domains.find((x) => x.id === id);
      if (!d || d.default) return;
      const tx = (text) => window.I18N && typeof window.I18N.t === 'function' ? window.I18N.t(text) : text;
      const content = tx('The verification for') + ' ' + esc(d.domain) + '。' + tx('Transactional emails will use the BestShopio default sender until you add and verify another domain.');
      confirm({ title: 'Remove sending domain?', content: content, okText: 'Delete', danger: true, onOk: () => {
        const sender = D.notifications.sender;
        const fallback = sender.domains.find((x) => x.id !== id && (x.default || x.status === 'connected')) || null;
        if (sender.activeDomainId === id) sender.activeDomainId = fallback ? fallback.id : '';
        sender.domains = sender.domains.filter((x) => x.id !== id);
        if (emailSendingDomainId === id) emailSendingDomainId = '';
        toast('Sending domain removed');
        renderDomainListByType();
      } });
    });
  }

  function renderEmailSendingDomains() {
    const n = D.notifications, sender = n.sender, profile = sender.profile;
    const active = nfActiveDomain();
    const senderAddressFor = (d) => (d.default ? sender.platformLocalPart : profile.localPart) + '@' + d.domain;
    const emailStyles = '<style>' + DOMAIN_STYLES + '.email-sending-shell{display:flex;flex-direction:column;gap:16px}.email-sending-list{display:flex;flex-direction:column;gap:12px}.email-sending-card{border:1px solid var(--hair);border-radius:12px;background:#fff;overflow:hidden}.email-sending-card.is-active{border-color:#b9d2ff}.email-sending-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:18px 20px}.email-sending-card-main{display:flex;gap:12px;min-width:0}.email-sending-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:#eef3ff;color:var(--brand);flex:none}.email-sending-icon.is-active{background:#e9f8ef;color:#16875b}.email-sending-eyebrow{font-size:11.5px;font-weight:650;color:var(--ink-muted);margin-bottom:4px}.email-sending-domain{font-size:16px;line-height:1.4;font-weight:650;color:var(--ink);overflow-wrap:anywhere}.email-sending-note{font-size:12.5px;line-height:1.5;color:var(--ink-muted);margin-top:4px}.email-sending-status{flex:none}.email-sending-facts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:14px 20px 16px;border-top:1px solid var(--hair);background:#fbfcfe}.email-sending-fact small{display:block;font-size:11px;color:var(--ink-muted);margin-bottom:4px}.email-sending-fact strong{display:block;font-size:13px;line-height:1.45;color:var(--ink-body);font-weight:600;overflow-wrap:anywhere}.email-sending-dns{padding:0 20px 18px}.email-sending-dns-copy{margin:13px 0 12px;font-size:12.5px;line-height:1.5;color:var(--ink-muted)}.email-sending-dns-copy strong{color:var(--ink-body)}.email-sending-actions{display:flex;justify-content:flex-end;gap:8px;padding:0 20px 18px}.email-sending-entry{display:flex;align-items:center;gap:12px;width:100%;margin-top:16px;padding:16px 18px;border:1px solid var(--hair);border-radius:10px;background:#fff;text-align:left;cursor:pointer;color:var(--ink)}.email-sending-entry:hover{border-color:#b9d2ff;background:#fbfdff}.email-sending-entry-ico{display:grid;place-items:center;width:34px;height:34px;border-radius:8px;background:#eef3ff;color:var(--brand);flex:none}.email-sending-entry strong,.email-sending-entry small{display:block}.email-sending-entry strong{font-size:13.5px}.email-sending-entry small{margin-top:3px;font-size:12px;line-height:1.45;color:var(--ink-muted)}.email-sending-entry-arrow{margin-left:auto;font-size:24px;color:var(--ink-muted)}@media(max-width:720px){.email-sending-card-head{flex-direction:column}.email-sending-facts{grid-template-columns:1fr}.email-sending-actions{justify-content:flex-start;flex-wrap:wrap}.email-sending-dns{padding-left:12px;padding-right:12px}.email-sending-dns .dns-tr{grid-template-columns:1fr}.email-sending-dns .dns-th{display:none}}</style>';
    const domainCard = (d) => {
      const isActive = active && active.id === d.id;
      const isPending = !d.default && (d.status === 'pending_verification' || d.status === 'dns_error');
      const isConnected = !d.default && d.status === 'connected';
      const badge = isActive
        ? '<span class="pill pill-green"><span class="dot"></span>Active sender</span>'
        : d.default
          ? '<span class="pill pill-gray"><span class="dot"></span>Platform default</span>'
          : isConnected
            ? '<span class="pill pill-green"><span class="dot"></span>Connected</span>'
            : d.status === 'dns_error'
              ? '<span class="pill pill-red"><span class="dot"></span>DNS error</span>'
              : '<span class="pill pill-orange"><span class="dot"></span>Pending verification</span>';
      const note = isActive
        ? 'Used for transactional email now.'
        : d.default
          ? 'Ready to use at any time as the store fallback sender.'
          : isConnected
            ? 'Used for transactional email now.'
            : 'Add the verification records before this domain can become active.';
      const records = isPending && (d.records || []).length
        ? '<div class="email-sending-dns"><div class="email-sending-dns-copy"><strong>Verification records</strong> · Add these at your DNS provider. If BestShopio manages this DNS zone, the records are added automatically.</div><div class="dns-tbl"><div class="dns-tr dns-th"><div class="dns-cell">Type</div><div class="dns-cell">Name</div><div class="dns-cell">Value</div><div class="dns-cell"></div></div>' + (d.records || []).map((r) => '<div class="dns-tr"><div class="dns-cell dns-mono">' + esc(r.type) + '</div><div class="dns-cell dns-mono">' + esc(r.host) + '</div><div class="dns-cell dns-mono">' + esc(r.value) + '</div><div class="dns-cell"><button class="dns-copy" data-copy-email-dns="' + esc(r.type + ' ' + r.host + ' ' + r.value) + '">Copy</button></div></div>').join('') + '</div></div>'
        : '';
      const actions = !d.default
        ? (isPending ? '<button class="btn btn-default" data-check-email-domain="' + esc(d.id) + '">' + (d.status === 'dns_error' ? 'Verify again' : 'Check verification') + '</button>' : '') + '<button class="btn btn-default" data-remove-email-domain="' + esc(d.id) + '">Remove</button>'
        : '';
      return '<section class="email-sending-card' + (isActive ? ' is-active' : '') + '"><div class="email-sending-card-head"><div class="email-sending-card-main"><span class="email-sending-icon' + (isActive ? ' is-active' : '') + '">' + (isActive ? I.check : I.globe) + '</span><div><div class="email-sending-eyebrow">' + (d.default ? 'Default sender domain' : 'Branded sender domain') + '</div><div class="email-sending-domain">' + esc(d.domain) + '</div><div class="email-sending-note">' + note + '</div></div></div><div class="email-sending-status">' + badge + '</div></div><div class="email-sending-facts"><div class="email-sending-fact"><small>Sender address</small><strong>' + esc(senderAddressFor(d)) + '</strong></div><div class="email-sending-fact"><small>Applies to</small><strong>All transactional emails</strong></div><div class="email-sending-fact"><small>DNS</small><strong>' + (d.default ? 'Platform managed' : d.dnsManagedByBestShopio ? 'Managed by BestShopio' : 'Managed externally') + '</strong></div></div>' + records + (actions ? '<div class="email-sending-actions">' + actions + '</div>' : '') + '</section>';
    };
    paint(emailStyles + '<div class="dom-wrap email-sending-shell"><div class="flex items-center gap-3 mb-4"><button class="back-btn" data-back-email-sending title="Back to domains">' + I.arrowLeft + '</button><div class="page-title" style="font-size:20px">Email sending</div></div><div class="email-sending-list">' + sender.domains.slice().sort((a, b) => Number(!a.default) - Number(!b.default)).map(domainCard).join('') + '</div></div>', false);
    root.querySelector('[data-back-email-sending]').onclick = () => {
      domainStep = null;
      location.hash = '#/settings/domains';
      renderDomainListByType();
    };
    root.querySelectorAll('[data-copy-email-dns]').forEach((el) => el.onclick = () => { try { navigator.clipboard.writeText(el.getAttribute('data-copy-email-dns')); } catch (e) {} toast('DNS record copied'); });
    root.querySelectorAll('[data-check-email-domain]').forEach((el) => el.onclick = () => openEmailSendingDomainDetail(el.getAttribute('data-check-email-domain')));
    root.querySelectorAll('[data-remove-email-domain]').forEach((el) => el.onclick = () => { const d = sender.domains.find((x) => x.id === el.getAttribute('data-remove-email-domain')); if (!d || d.default) return; const tx = (text) => window.I18N && typeof window.I18N.t === 'function' ? window.I18N.t(text) : text; modal({ title: 'Remove sending domain?', width: 460, okText: 'Remove domain', body: '<div class="muted" style="font-size:13px;line-height:1.6">' + tx('The verification for') + ' <b>' + esc(d.domain) + '</b>。' + tx('Transactional emails will use the BestShopio default sender until you add and verify another domain.') + '</div>', onOk: (m, close) => { const fallback = sender.domains.find((x) => x.default); if (sender.activeDomainId === d.id && fallback) sender.activeDomainId = fallback.id; sender.domains = sender.domains.filter((x) => x.id !== d.id); close(); toast('Sending domain removed'); renderEmailSendingDomains(); } }); });
  }

  function openEmailSendingDomainModal() {
    const sender = D.notifications.sender;
    if (sender.domains.some((d) => !d.default)) {
      return toast(window.I18N && window.I18N.t ? window.I18N.t('Remove the current custom sending domain before adding another one.') : 'Remove the current custom sending domain before adding another one.');
    }
    const clearError = (m) => {
      const input = m.querySelector('#email-sending-domain-input');
      const error = m.querySelector('#email-sending-domain-error');
      if (input) { input.classList.remove('is-error'); input.removeAttribute('aria-invalid'); }
      if (error) error.textContent = '';
    };
    const showError = (m, message) => {
      const input = m.querySelector('#email-sending-domain-input');
      const error = m.querySelector('#email-sending-domain-error');
      if (input) { input.classList.add('is-error'); input.setAttribute('aria-invalid', 'true'); input.focus(); }
      if (error) error.textContent = window.I18N && window.I18N.t ? window.I18N.t(message) : message;
    };
    const dialog = modal({
      title: 'Add sending domain', width: 520, okText: 'Add sending domain',
      body: '<div class="muted" style="margin:0 0 20px;font-size:13px;line-height:1.6">Use a subdomain such as <b>mail.yourdomain.com</b>. We will show the verification records after you add it.</div><label class="nf-label" for="email-sending-domain-input" style="display:block;margin-bottom:12px">Sending domain</label><input class="input email-sending-domain-input" id="email-sending-domain-input" aria-describedby="email-sending-domain-error" placeholder="mail.yourdomain.com" style="width:100%" /><div class="email-sending-domain-error" id="email-sending-domain-error" role="alert"></div>',
      onOk: (m, close) => {
        const domain = ((m.querySelector('#email-sending-domain-input') || {}).value || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        clearError(m);
        if (!validDomain(domain)) return showError(m, 'Enter a valid domain');
        if (sender.domains.some((d) => d.domain === domain)) return showError(m, 'This sending domain is already added');
        const verificationId = 'brv_' + Date.now().toString(36);
        const token = verificationId.slice(4);
        const created = { id: 'domain-' + Date.now(), domain: domain, bestreachStoreId: sender.bestreachStoreId, bestreachVerificationId: verificationId, verificationAttempts: 0, status: 'pending_verification', dnsManagedByBestShopio: false, records: [{ type: 'CNAME', host: 'br.' + token + '._domainkey', value: 'br.' + token + '.dkim.sender-validation.net' }, { type: 'TXT', host: '_sender-verification', value: 'sender-verification=' + verificationId }] };
        sender.domains.push(created);
        emailSendingDomainId = created.id;
        close();
        location.hash = '#/settings/domains/email-sending-add';
      }
    });
    const input = dialog.m.querySelector('#email-sending-domain-input');
    if (input) input.addEventListener('input', () => clearError(dialog.m));
  }
  function currentEmailSendingDomain() {
    const sender = D.notifications.sender;
    return sender.domains.find((d) => d.id === emailSendingDomainId)
      || sender.domains.find((d) => !d.default)
      || null;
  }
  function openEmailSendingDomainDetail(id) {
    const d = D.notifications.sender.domains.find((x) => x.id === id);
    if (!d || d.default) return;
    emailSendingDomainId = d.id;
    location.hash = '#/settings/domains/email-sending-add';
  }
  function startEmailSendingDomainVerification(id) {
    const d = D.notifications.sender.domains.find((x) => x.id === id);
    if (!d || d.default || !['pending_verification', 'dns_error'].includes(d.status)) return;
    emailSendingDomainId = d.id;
    location.hash = '#/settings/domains/email-sending-verifying';
  }
  function verifyEmailSendingDomain(d, tx) {
    if (!d || !['pending_verification', 'dns_error'].includes(d.status)) return;
    d.verificationAttempts = Number(d.verificationAttempts || 0) + 1;
    if (d.verificationAttempts === 1) {
      d.status = 'dns_error';
      toast(tx('We couldn\'t detect your DNS records yet.'));
      location.hash = '#/settings/domains/email-sending-add';
      return;
    }
    d.status = 'connected';
    D.notifications.sender.activeDomainId = d.id;
    toast(tx('Domain verification updated'));
    location.hash = '#/settings/domains/email-sending-bound';
  }
  function renderEmailSendingDomainVerifying() {
    const d = currentEmailSendingDomain();
    if (!d) return backToDomainList();
    const tx = (text) => window.I18N && typeof window.I18N.t === 'function' ? window.I18N.t(text) : text;
    const verificationHash = '#/settings/domains/email-sending-verifying';
    paint(
      '<style>' + DOMAIN_STYLES + '</style><div class="dom-wrap">' +
        '<div class="flex items-center gap-2 mb-4"><button class="back-btn" data-back-email-verifying title="Back to domains">' + I.arrowLeft + '</button><div class="page-title" style="font-size:20px">' + tx('Add a sending domain') + '</div></div>' +
        '<div class="dstep"><span class="sp ok"><span class="sn">' + I.check + '</span>' + tx('Add a sending domain') + '</span><span class="ln"></span><span class="sp on"><span class="sn">2</span>' + tx('Configure DNS') + '</span><span class="ln"></span><span class="sp"><span class="sn">3</span>' + tx('Domain connected') + '</span></div>' +
        '<div class="panel card-pad"><div class="dbound dbinding"><span class="ssl-spin"></span><div class="page-title" style="font-size:20px">' + tx('Verifying your sending domain…') + '</div><div class="muted" style="font-size:13.5px;margin-top:6px;line-height:1.6">' + tx('We’re checking the DNS records for') + ' <b>' + esc(d.domain) + '</b>。' + tx('This usually takes a few seconds.') + '</div><div class="muted" style="font-size:12.5px;margin-top:5px">' + tx('You can safely leave this page.') + '</div></div></div>' +
      '</div>', false
    );
    root.querySelector('[data-back-email-verifying]').onclick = () => {
      if (emailSendingVerificationTimer) window.clearTimeout(emailSendingVerificationTimer);
      emailSendingVerificationTimer = null;
      location.hash = '#/settings/domains';
    };
    if (emailSendingVerificationTimer) window.clearTimeout(emailSendingVerificationTimer);
    emailSendingVerificationTimer = window.setTimeout(() => {
      emailSendingVerificationTimer = null;
      if (location.hash !== verificationHash || emailSendingDomainId !== d.id) return;
      verifyEmailSendingDomain(d, tx);
    }, 1200);
  }
  function backToDomainList() {
    domainStep = null;
    location.hash = '#/settings/domains';
    renderDomainListByType();
  }
  function renderEmailSendingDomainDNS() {
    const d = currentEmailSendingDomain();
    if (!d) return backToDomainList();
    const tx = (text) => window.I18N && typeof window.I18N.t === 'function' ? window.I18N.t(text) : text;
    const addSendingDomainLabel = tx('Add a sending domain');
    const hasDnsError = d.status === 'dns_error';
    const records = (d.records || []).map((record) =>
      '<div class="dns-tr"><div class="dns-cell dns-mono">' + esc(record.type) + '</div><div class="dns-cell dns-mono">' + esc(record.host) + '</div><div class="dns-cell dns-mono">' + esc(record.value) + '</div><div class="dns-cell"><button class="dns-copy" data-copy-email-wizard="' + esc(record.type + ' ' + record.host + ' ' + record.value) + '">Copy</button></div></div>').join('');
    paint(
      '<style>' + DOMAIN_STYLES + '</style><div class="dom-wrap">' +
        '<div class="flex items-center gap-2 mb-4"><button class="back-btn" data-back-email-wizard title="Back to domains">' + I.arrowLeft + '</button><div class="page-title" style="font-size:20px">' + addSendingDomainLabel + '</div></div>' +
        '<div class="dstep">' +
          '<span class="sp ok"><span class="sn">' + I.check + '</span>' + addSendingDomainLabel + '</span><span class="ln"></span>' +
          '<span class="sp on"><span class="sn">2</span>' + tx('Configure DNS') + '</span><span class="ln"></span>' +
          '<span class="sp"><span class="sn">3</span>' + tx('Domain connected') + '</span>' +
        '</div>' +
        '<div class="panel card-pad">' +
          '<div class="card-title">' + tx('Add these DNS records at your domain provider') + '</div>' +
          '<div class="muted" style="font-size:13px;margin:4px 0 16px;line-height:1.5">' + tx('Add the records below for') + ' <b>' + esc(d.domain) + '</b>。' + tx('We will verify them automatically.') + '</div>' +
          '<div class="dns-tbl"><div class="dns-tr dns-th"><div class="dns-cell">' + tx('Type') + '</div><div class="dns-cell">' + tx('Name') + '</div><div class="dns-cell">' + tx('Value') + '</div><div class="dns-cell"></div></div>' + records + '</div>' +
          (hasDnsError ? '<div class="dns-fail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg><div><b>' + tx('We couldn\'t detect your DNS records yet.') + '</b> ' + tx('Double-check the records, then verify again.') + '</div></div>' : '<div class="muted" style="display:flex;align-items:center;gap:8px;font-size:13px;margin-top:16px;line-height:1.5"><span class="ssl-spin"></span>' + tx('After adding the records, click Verify now to check your sending domain.') + '</div>') +
          '<div class="flex items-center justify-between" style="margin-top:22px"><a class="lnk" data-email-wizard-guide style="font-size:13px;cursor:pointer">' + tx('Having issues? View the setup guide') + '</a><div class="flex" style="gap:10px"><button class="btn btn-gray" data-email-verify-later>' + tx('Verify later') + '</button><button class="btn btn-primary" data-email-verify-now>' + tx(hasDnsError ? 'Verify again' : 'Verify now') + '</button></div></div>' +
        '</div>' +
      '</div>', false);
    root.querySelectorAll('[data-copy-email-wizard]').forEach((b) => b.onclick = () => { try { navigator.clipboard.writeText(b.getAttribute('data-copy-email-wizard')); } catch (e) {} toast('DNS record copied'); });
    root.querySelector('[data-back-email-wizard]').onclick = backToDomainList;
    root.querySelector('[data-email-verify-later]').onclick = backToDomainList;
    root.querySelector('[data-email-verify-now]').onclick = () => startEmailSendingDomainVerification(d.id);
    root.querySelector('[data-email-wizard-guide]').onclick = () => openEmailSendingDomainGuide(d);
  }
  function renderEmailSendingDomainBound() {
    const d = currentEmailSendingDomain();
    if (!d) return backToDomainList();
    const isActive = D.notifications.sender.activeDomainId === d.id;
    const tx = (text) => window.I18N && typeof window.I18N.t === 'function' ? window.I18N.t(text) : text;
    const addSendingDomainLabel = tx('Add a sending domain');
    paint(
      '<style>' + DOMAIN_STYLES + '</style><div class="dom-wrap">' +
        '<div class="flex items-center gap-2 mb-4"><button class="back-btn" data-back-email-wizard title="Back to domains">' + I.arrowLeft + '</button><div class="page-title" style="font-size:20px">' + addSendingDomainLabel + '</div></div>' +
        '<div class="dstep"><span class="sp ok"><span class="sn">' + I.check + '</span>' + addSendingDomainLabel + '</span><span class="ln"></span><span class="sp ok"><span class="sn">' + I.check + '</span>' + tx('Configure DNS') + '</span><span class="ln"></span><span class="sp on"><span class="sn">3</span>' + tx('Domain connected') + '</span></div>' +
        '<div class="panel card-pad"><div class="dbound"><div class="ck"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div><div class="page-title" style="font-size:20px">' + esc(d.domain) + ' · ' + tx('Domain connected') + '</div><div class="muted" style="font-size:13.5px;margin-top:6px;line-height:1.6">' + tx('This sending domain is now used automatically for transactional email.') + '</div><div style="margin-top:20px;display:flex;justify-content:center;gap:10px"><button class="btn btn-gray" data-back-email-wizard>' + tx('Back to domains') + '</button></div></div></div>' +
      '</div>', false);
    root.querySelectorAll('[data-back-email-wizard]').forEach((b) => b.onclick = backToDomainList);
  }
  function renderAddDomainDNS() {
    const dom = pendingDomain || 'yourdomain.com';
    const entry = domainsData.find((d) => d.domain === dom);
    const hasDnsError = !!entry && entry.status === 'dns_error';
    paint(
      '<style>' + DOMAIN_STYLES + '</style><div class="dom-wrap">' +
        '<div class="flex items-center gap-2 mb-4"><button class="back-btn" data-back-add-domain title="Back to domains">' + I.arrowLeft + '</button><div class="page-title" style="font-size:20px">Add a domain</div></div>' +
        '<div class="dstep">' +
          '<span class="sp ok"><span class="sn">' + I.check + '</span>Add a domain</span><span class="ln"></span>' +
          '<span class="sp on"><span class="sn">2</span>Configure DNS</span><span class="ln"></span>' +
          '<span class="sp"><span class="sn">3</span>Domain bound</span>' +
        '</div>' +
        '<div class="panel card-pad">' +
          '<div class="card-title">Add these DNS records at your domain provider</div>' +
          '<div class="muted" style="font-size:13px;margin:4px 0 16px;line-height:1.5">Sign in to where you bought <b>' + esc(dom) + '</b> (e.g. GoDaddy, Namecheap, Alibaba Cloud) and add the records below. We detect them automatically.</div>' +
          '<div class="dns-tbl">' +
            '<div class="dns-tr dns-th"><div class="dns-cell">Type</div><div class="dns-cell">Name</div><div class="dns-cell">Value</div><div class="dns-cell"></div></div>' +
            '<div class="dns-tr"><div class="dns-cell dns-mono">A</div><div class="dns-cell dns-mono">@</div><div class="dns-cell dns-mono">' + PLATFORM_IP + '</div><div class="dns-cell"><button class="dns-copy" data-copy="' + PLATFORM_IP + '">Copy</button></div></div>' +
            '<div class="dns-tr"><div class="dns-cell dns-mono">CNAME</div><div class="dns-cell dns-mono">www</div><div class="dns-cell dns-mono">' + PLATFORM_CNAME + '</div><div class="dns-cell"><button class="dns-copy" data-copy="' + PLATFORM_CNAME + '">Copy</button></div></div>' +
          '</div>' +
          (hasDnsError
            ? '<div class="dns-fail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg><div><b>We couldn\'t detect your DNS records yet.</b> Double-check the DNS records, then verify again.</div></div>'
            : '<div class="ssl-pill"><span class="ssl-spin"></span>After adding the records, click Verify now to check your domain.</div>') +
          '<div class="flex items-center justify-between" style="margin-top:22px">' +
            '<a class="lnk" data-guide-faq style="font-size:13px;cursor:pointer">Having issues? View the setup guide</a>' +
            '<div class="flex" style="gap:10px"><button class="btn btn-gray" data-verify-later>Verify later</button><button class="btn btn-primary" data-verify-now>' + (hasDnsError ? 'Verify again' : 'Verify now') + '</button></div>' +
          '</div>' +
        '</div>' +
      '</div>',
      false
    );
    root.querySelectorAll('[data-copy]').forEach((b) => b.onclick = () => { try { navigator.clipboard.writeText(b.getAttribute('data-copy')); } catch (e) {} toast('Copied'); });
    root.querySelector('[data-back-add-domain]').onclick = () => {
      domainStep = null;
      location.hash = '#/settings/domains';
      renderDomainListByType();
    };
    root.querySelector('[data-verify-later]').onclick = () => { location.hash = '#/settings/domains'; };
    root.querySelector('[data-verify-now]').onclick = () => startDomainBinding(dom);
    root.querySelector('[data-guide-faq]').onclick = () => openDomainGuide();
  }
  function ensureCustomDomain(dom, status) {
    let entry = domainsData.find((d) => d.domain === dom);
    if (!entry) {
      const systemIndex = domainsData.findIndex((d) => d.type === 'system');
      entry = { domain: dom, type: 'custom', primary: false, status: status || 'pending_verification', redirectTo: null };
      domainsData.splice(systemIndex < 0 ? domainsData.length : systemIndex, 0, entry);
    } else if (status) {
      entry.status = status;
    }
    return entry;
  }
  function resetDomainVerificationDemo(dom) {
    domainVerificationDomain = dom;
    domainVerificationAttempt = 0;
  }
  function startDomainBinding(dom) {
    if (domainVerificationDomain !== dom) resetDomainVerificationDemo(dom);
    domainVerificationAttempt += 1;
    const result = domainVerificationAttempt === 1
      ? 'dns_error'
      : domainVerificationAttempt === 2
        ? 'ssl_failed'
        : 'connected';
    ensureCustomDomain(dom, result === 'dns_error' ? 'pending_verification' : 'ssl_pending');
    domainBinding = { domain: dom, ready: false, failed: null, phase: result === 'dns_error' ? 'dns' : 'ssl' };
    if (location.hash === '#/settings/domains/bound') renderAddDomainBound();
    else location.hash = '#/settings/domains/bound';

    // Prototype-only walkthrough: first DNS failure → SSL failure → connected.
    // Production UI polls the Ops task instead of deriving results from click count.
    window.setTimeout(() => {
      const entry = domainsData.find((d) => d.domain === dom);
      if (!entry) return; // The merchant removed it while the simulated task was running.
      if (result === 'dns_error') {
        entry.status = 'dns_error';
        if (domainBinding && domainBinding.domain === dom) {
          domainBinding = null;
          if (location.hash === '#/settings/domains/bound') location.hash = '#/settings/domains/add';
        }
        if (location.hash === '#/settings/domains') renderDomainListByType();
        return;
      }
      if (result === 'ssl_failed') {
        entry.status = 'ssl_failed';
        if (domainBinding && domainBinding.domain === dom) {
          domainBinding.failed = 'ssl_failed';
          if (location.hash === '#/settings/domains/bound') renderAddDomainBound();
        }
        if (location.hash === '#/settings/domains') renderDomainListByType();
        return;
      }
      entry.status = 'connected';
      if (domainBinding && domainBinding.domain === dom) {
        domainBinding.ready = true;
        if (location.hash === '#/settings/domains/bound') renderAddDomainBound();
      }
      if (location.hash === '#/settings/domains') renderDomainListByType();
    }, 3200);
  }
  function renderAddDomainBound() {
    const binding = domainBinding && domainBinding.domain === pendingDomain ? domainBinding : null;
    const dom = (binding && binding.domain) || pendingDomain || 'yourdomain.com';
    const isSslFailed = !!binding && binding.failed === 'ssl_failed';
    const isBinding = !!binding && !binding.ready && !isSslFailed;
    const isCheckingDns = isBinding && binding.phase === 'dns';
    const loadingTitle = isCheckingDns ? 'Checking your DNS records…' : 'Connecting your domain…';
    const loadingCopy = isCheckingDns
      ? 'We\'re checking the records for <b>' + esc(dom) + '</b>.'
      : 'We\'re securing <b>' + esc(dom) + '</b>.';
    const body = isBinding
      ? '<div class="panel card-pad"><div class="dbound dbinding">' +
          '<span class="ssl-spin"></span>' +
          '<div class="page-title" style="font-size:20px">' + loadingTitle + '</div>' +
          '<div class="muted" style="font-size:13.5px;margin-top:6px;line-height:1.6">' + loadingCopy + ' This takes just a few seconds.</div>' +
          '<div class="muted" style="font-size:12.5px;margin-top:5px">You can safely leave this page.</div>' +
          '<div style="margin-top:20px"><button class="btn btn-gray" data-back-domains>Back to domains</button></div>' +
        '</div></div>'
      : isSslFailed
        ? '<div class="panel card-pad"><div class="dbound">' +
            '<div class="ck" style="background:#fdecea;color:#d33612"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 7v6M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg></div>' +
            '<div class="page-title" style="font-size:20px">We couldn\'t issue an SSL certificate</div>' +
            '<div class="muted" style="font-size:13.5px;margin-top:6px;line-height:1.6">Your DNS records are detected, but the certificate for <b>' + esc(dom) + '</b> could not be issued.</div>' +
            '<div style="margin-top:20px;display:flex;justify-content:center;gap:10px"><button class="btn btn-gray" data-back-domains>Back to domains</button><button class="btn btn-primary" data-retry-binding>Retry</button></div>' +
          '</div></div>'
      : '<div class="panel card-pad"><div class="dbound">' +
          '<div class="ck"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>' +
          '<div class="page-title" style="font-size:20px">' + esc(dom) + ' is connected</div>' +
          '<div class="muted" style="font-size:13.5px;margin-top:6px;line-height:1.6">Both <b>https://' + esc(dom) + '</b> and <b>https://www.' + esc(dom) + '</b> are live and secured with SSL.</div>' +
          '<div style="color:#2bb673;font-weight:600;font-size:13px;margin-top:8px">SSL active · auto-renews before expiry</div>' +
          '<div style="margin-top:20px"><button class="btn btn-primary" data-back-domains>Back to domains</button></div>' +
        '</div></div>';
    paint(
      '<style>' + DOMAIN_STYLES + '</style><div class="dom-wrap">' +
        '<div class="flex items-center gap-2 mb-4"><button class="back-btn" data-back-domains title="Back to domains">' + I.arrowLeft + '</button><div class="page-title" style="font-size:20px">Add a domain</div></div>' +
        '<div class="dstep">' +
          '<span class="sp ok"><span class="sn">' + I.check + '</span>Add a domain</span><span class="ln"></span>' +
          (isCheckingDns
            ? '<span class="sp on"><span class="sn">2</span>Checking DNS</span><span class="ln"></span><span class="sp"><span class="sn">3</span>Domain bound</span>'
            : '<span class="sp ok"><span class="sn">' + I.check + '</span>Configure DNS</span><span class="ln"></span><span class="sp on"><span class="sn">3</span>' + (isBinding ? 'Connecting domain' : isSslFailed ? 'SSL failed' : 'Domain bound') + '</span>') +
        '</div>' +
        body +
      '</div>',
      false
    );
    const retry = root.querySelector('[data-retry-binding]');
    if (retry) retry.onclick = () => startDomainBinding(dom);
    root.querySelectorAll('[data-back-domains]').forEach((back) => back.onclick = () => {
      if (!isBinding) {
        pendingDomain = '';
        if (domainBinding && domainBinding.domain === dom) domainBinding = null;
      }
      location.hash = '#/settings/domains';
    });
  }
  function renderDomains() {
    if (domainStep === 'email-sending-add') return renderEmailSendingDomainDNS();
    if (domainStep === 'email-sending-verifying') return renderEmailSendingDomainVerifying();
    if (domainStep === 'email-sending-bound') return renderEmailSendingDomainBound();
    if (domainStep === 'email-sending') return renderEmailSendingDomains();
    if (domainStep === 'add') return renderAddDomainDNS();
    if (domainStep === 'bound') return renderAddDomainBound();
    return renderDomainListByType();
  }
  function validDomain(v) {
    return /^(?!www\.)([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(v);
  }
  function openAddDomainModal() {
    modal({
      title: 'Connect an existing domain', width: 520, okText: 'Next',
      body:
        '<div class="muted" style="font-size:13px;margin-bottom:14px">Enter a domain you own without https://. For a root domain, enter example.com instead of www.example.com.</div>' +
        '<div class="sp-field"><label class="sp-label">Domain</label><div class="sp-input-wrap"><input id="add-dom" class="sp-input" placeholder="yourdomain.com" style="padding-right:14px"/></div><div class="sp-err" data-err="add-dom"></div><div class="muted" style="font-size:12.5px;line-height:1.55;margin-top:8px">When you connect a root domain, its www version is connected automatically. For example, connecting example.com also connects www.example.com. Subdomains are connected separately.</div></div>',
      onOk: (m, close) => {
        const v = (m.querySelector('#add-dom').value || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        setErr(m, 'add-dom', ''); m.querySelector('#add-dom').classList.remove('err');
        if (!v) { setErr(m, 'add-dom', 'Please enter a domain'); m.querySelector('#add-dom').classList.add('err'); return; }
        if (!validDomain(v)) { setErr(m, 'add-dom', 'Enter a valid domain without www or https://'); m.querySelector('#add-dom').classList.add('err'); return; }
        if (domainsData.some((d) => d.domain === v || d.domain === 'www.' + v)) { setErr(m, 'add-dom', 'This domain is already added'); m.querySelector('#add-dom').classList.add('err'); return; }
        pendingDomain = v; domainBinding = null; resetDomainVerificationDemo(v); ensureCustomDomain(v, 'pending_verification'); close(); location.hash = '#/settings/domains/add';
      },
    });
  }
  function deleteDomain(dom) {
    const entry = domainsData.find((d) => d.domain === dom);
    const paired = entry ? pairedStorefrontDomain(entry.domain) : null;
    const isPair = !!paired;
    const apex = dom.indexOf('www.') === 0 ? dom.slice(4) : dom;
    const www = 'www.' + apex;
    confirm({
      title: isPair ? 'Remove ' + apex + ' and ' + www + '?' : 'Remove ' + dom + '?',
      okText: isPair ? 'Remove both domains' : 'Remove domain', danger: true,
      content: isPair
        ? 'These domains are connected as a pair. Removing either one will remove both ' + apex + ' and ' + www + ' from your store. Customers will no longer be able to reach your store using either address. You can connect them again later.'
        : 'Customers will no longer be able to reach your store at ' + dom + '. You can connect it again later.',
      onOk: () => {
        domainsData = domainsData.filter((d) => d.domain !== dom && (!paired || d.domain !== paired.domain));
        toast(isPair ? 'Both domains removed' : 'Domain removed');
        renderDomainListByType();
      },
    });
  }
  function setPrimaryDomain(dom) {
    domainsData.forEach((d) => { d.primary = (d.domain === dom); if (d.domain === dom) d.redirectTo = null; });
    toast('Primary domain updated'); renderDomainListByType();
  }
  // "Redirect" = send this domain's visitors (301) to the primary domain, so every
  // address resolves to one canonical store URL (good for SEO + branding).
  function redirectDomain(dom) {
    const primary = domainsData.find((d) => d.primary);
    if (!primary) { toast('Set a primary domain first'); return; }
    const d = domainsData.find((x) => x.domain === dom);
    if (d) { d.redirectTo = primary.domain; toast('Now redirecting to ' + primary.domain); renderDomainListByType(); }
  }
  function verifyDomain(dom) {
    pendingDomain = dom;
    startDomainBinding(dom);
  }
  // Email sender DNS guide. These are Bestreach-provided verification records,
  // so the guide must not reuse the storefront A/CNAME + SSL instructions.
  function openEmailSendingDomainGuide(domain) {
    const tx = (text) => window.I18N && typeof window.I18N.t === 'function' ? window.I18N.t(text) : text;
    const records = (domain.records || []).map((record) =>
      '<div class="dns-tr" style="grid-template-columns:96px 150px 1fr"><div class="dns-cell dns-mono">' + esc(record.type) + '</div><div class="dns-cell dns-mono">' + esc(record.host) + '</div><div class="dns-cell dns-mono">' + esc(record.value) + '</div></div>'
    ).join('');
    modal({
      title: tx('Connect your sending domain'), width: 620, okText: tx('Got it'), hideCancel: true,
      body:
        '<div class="muted" style="font-size:13px;margin-bottom:14px;line-height:1.6">' + tx('Add the DNS records for') + ' <b>' + esc(domain.domain) + '</b>' + tx('. We will verify them automatically.') + '</div>' +
        '<div class="dns-tbl" style="margin-bottom:16px">' +
          '<div class="dns-tr dns-th" style="grid-template-columns:96px 150px 1fr"><div class="dns-cell">' + tx('Type') + '</div><div class="dns-cell">' + tx('Name') + '</div><div class="dns-cell">' + tx('Value') + '</div></div>' + records +
        '</div>' +
        '<div style="font-weight:600;font-size:13.5px;color:var(--ink);margin-bottom:8px">' + tx('If verification does not pass') + '</div>' +
        '<ul style="margin:0;padding:0;list-style:none;color:var(--ink-body);font-size:13px;line-height:1.75">' +
          '<li>' + tx('DNS changes can take up to 30 minutes — sometimes a few hours — to take effect.') + '</li>' +
          '<li>' + tx('Check that every record above is present exactly as shown.') + '</li>' +
          '<li>' + tx('If your DNS provider supports proxying (for example, Cloudflare), set these verification records to DNS only.') + '</li>' +
          '<li>' + tx('After updating the records, wait a few minutes and verify again.') + '</li>' +
        '</ul>',
      onOk: (m, close) => close(),
    });
  }

  // "Having issues? View the setup guide" — storefront DNS recap + troubleshooting.
  function openDomainGuide() {
    modal({
      title: 'Connecting your domain', width: 580, okText: 'Got it', hideCancel: true,
      body:
        '<div class="muted" style="font-size:13px;margin-bottom:14px;line-height:1.6">At your domain provider (GoDaddy, Namecheap, Alibaba Cloud, …), add these two records. We detect them automatically and issue SSL for you.</div>' +
        '<div class="dns-tbl" style="margin-bottom:16px">' +
          '<div class="dns-tr dns-th" style="grid-template-columns:96px 90px 1fr"><div class="dns-cell">Type</div><div class="dns-cell">Name</div><div class="dns-cell">Value</div></div>' +
          '<div class="dns-tr" style="grid-template-columns:96px 90px 1fr"><div class="dns-cell dns-mono">A</div><div class="dns-cell dns-mono">@</div><div class="dns-cell dns-mono">' + PLATFORM_IP + '</div></div>' +
          '<div class="dns-tr" style="grid-template-columns:96px 90px 1fr"><div class="dns-cell dns-mono">CNAME</div><div class="dns-cell dns-mono">www</div><div class="dns-cell dns-mono">' + PLATFORM_CNAME + '</div></div>' +
        '</div>' +
        '<div style="font-weight:600;font-size:13.5px;color:var(--ink);margin-bottom:8px">If it isn\'t verifying</div>' +
        '<ul style="margin:0;padding:0;list-style:none;color:var(--ink-body);font-size:13px;line-height:1.75">' +
          '<li>DNS changes can take up to 30 minutes — sometimes a few hours — to take effect. Wait, then verify again.</li>' +
          '<li>Remove any old A or CNAME record on <b>@</b> or <b>www</b> that points elsewhere.</li>' +
          '<li>If your domain is proxied (e.g. Cloudflare), set the records to <b>DNS only</b>, not proxied.</li>' +
          '<li>Copy the values exactly — a typo or trailing dot will fail.</li>' +
        '</ul>',
      onOk: (m, close) => close(),
    });
  }

  // ===========================================================================
  // NOTIFICATIONS (V1.141) — transactional email config, per store.
  //   List (events grouped) -> Editor (left form + live desktop/mobile preview)
  //   + Brand settings (shared tokens). Merge tags + dynamic "blocks" expand in
  //   the preview against sample order data, so the body can't be broken.
  //   sub-state: notifSub = null (list) | 'brand' | <eventCode> (editor)
  // ===========================================================================
  let notifSub = null;
  let notifDevice = 'desktop';
  let notifEditorMode = 'preview';
  let nfInsertTarget = 'nf-template';
  let nfInsertSelection = { id: null, start: null, end: null };

  // sample order data the preview renders against (resolves {{merge.tags}})
  const NF_SAMPLE = {
    'customer.first_name': 'Emma', 'customer.name': 'Emma Johnson',
    'order.number': '1042', 'order.detail_url': '#', 'order.invoice_url': '#', 'order.currency': 'US$', 'order.date': 'June 10, 2026',
    'order.subtotal': 'US$ 174.66', 'order.discount': '-US$ 5.00', 'order.discount_code': 'WELCOME5',
    'order.shipping': 'Free', 'order.shipping_original': 'US$ 8.99', 'order.shipping_discount': '-US$ 8.99', 'order.shipping_discount_code': 'FREESHIP', 'order.tax': 'US$ 0.00',
    'order.total': 'US$ 169.66', 'order.total_paid': 'US$ 84.88', 'order.total_discount': 'US$ 46.59',
    'order.shipping_address': 'Emma Johnson, 2261 Market St, San Francisco, CA 94114, US',
    'order.billing_address': 'Emma Johnson, 2261 Market St, San Francisco, CA 94114, US',
    'order.payment_brand': 'VISA', 'order.shipping_method': 'Standard shipping',
    'order.payment_method': 'Visa ···· 4242',
    'shipment.tracking_number': 'LX123456789CN', 'shipment.carrier': 'YunExpress', 'shipment.tracking_url': '#', 'shipment.estimated_delivery': 'June 14, 2026',
    'refund.amount': 'US$ 84.78',
    'refund.transactions': [
      { method: 'Visa', amount: 'US$ 55.98' },
      { method: 'Visa', amount: 'US$ 28.80' },
    ],
    'checkout.recovery_url': 'https://lovocross.com/checkout?token=rcv_1042_demo',
  };
  let nfPreviewEvent = '';
  const NF_ITEMS = [
    {
      kind: 'bundle', name: 'Coffee Office Pack', qty: 1, originalPrice: 'US$ 69.97', price: 'US$ 55.98',
      subscription: { cadence: 'Delivery every 2 months' },
      discounts: [{ label: 'Bundle discount', amount: '-US$ 7.99' }, { label: 'Subscription discount', amount: '-US$ 6.00' }],
      children: [
        { name: 'Signature Blend Coffee 500g', variant: 'Whole bean / 2 Pack', qty: 2 },
        { name: 'Coffee Brew Guide', variant: 'Digital download', qty: 1 },
      ],
    },
    {
      kind: 'bundle', name: 'Focus Gum - Multipack', qty: 1, originalPrice: 'US$ 57.30', price: 'US$ 49.30',
      discounts: [{ label: 'Bundle discount', amount: '-US$ 8.00' }],
      children: [
        { name: 'Neurix Focus & Energy Gum', variant: 'Mint / 12 Pack', qty: 2 },
        { name: 'Neurix Focus & Energy Gum', variant: 'Citrus / 12 Pack', qty: 2 },
      ],
    },
    {
      name: 'Whey Protein 1kg', variant: 'Vanilla / 1kg', qty: 1, originalPrice: 'US$ 39.00', price: 'US$ 31.59',
      subscription: { cadence: 'Delivery every 1 month' },
      discounts: [{ label: 'Subscription discount', amount: '-US$ 3.90' }, { label: 'Product discount', amount: '-US$ 3.51' }],
    },
    { name: 'Daily Multivitamin (60 ct)', variant: '60 capsules', qty: 1, originalPrice: 'US$ 32.00', price: 'US$ 28.80', discounts: [{ label: 'Product discount', amount: '-US$ 3.20' }] },
    { name: 'Stainless Steel Coffee Scoop', variant: '30 ml', qty: 1, price: 'US$ 8.99' },
  ];
  const nfStatusPill = (c) => c.enabled
    ? '<span class="pill pill-green"><span class="dot"></span>On</span>'
    : '<span class="pill pill-gray"><span class="dot"></span>Off</span>';

  function nfFindEvent(code) {
    for (const g of D.notifications.groups) { const e = (g.events || []).find((x) => x.code === code); if (e) return { ev: e, group: g }; }
    return null;
  }
  function nfEditorPath(code, mode) {
    const base = '#/settings/notifications/' + encodeURIComponent(code);
    return mode === 'code' ? base + '/edit' : base;
  }
  function nfVariablePanel(ev) {
    const tx = (text) => window.I18N && typeof window.I18N.t === 'function' ? window.I18N.t(text) : text;
    const isAbandoned = ev.code === 'abandoned_checkout';
    const isOrderEmail = ['order_paid', 'order_shipped', 'order_refunded', 'abandoned_checkout'].includes(ev.code);
    const item = (token, kind) =>
      '<span class="nf-var-token"><button type="button" class="nf-var-insert" data-insert-token="' + esc(token) + '" data-token-kind="' + kind + '" title="' + tx('Click a variable to insert it at the cursor. Blocks are inserted into the email body.') + '"><code>{{' + esc(token) + '}}</code></button><button type="button" class="nf-var-copy" data-copy-token="' + esc(token) + '" title="' + tx('Copy') + '">' + tx('Copy') + '</button></span>';
    const group = (title, tokens, kind) => tokens.length
      ? '<div class="nf-var-group"><div class="nf-var-group-title">' + tx(title) + '</div><div class="nf-var-token-list">' + tokens.map((token) => item(token, kind)).join('') + '</div></div>'
      : '';
    const orderTokens = ['order.number', 'order.date', 'order.detail_url', 'order.currency'];
    const amountTokens = ['order.subtotal', 'order.discount', 'order.shipping', 'order.tax', 'order.total', 'order.total_paid', 'order.total_discount'];
    const addressTokens = ['order.shipping_address', 'order.billing_address', 'order.payment_brand', 'order.payment_method', 'order.shipping_method'];
    const verificationTokens = ev.code === 'email_verification' ? ['verification.code'] : [];
    const shipmentTokens = ev.code === 'order_shipped' ? ['shipment.tracking_number', 'shipment.carrier', 'shipment.tracking_url', 'shipment.estimated_delivery'] : [];
    const refundTokens = ev.code === 'order_refunded' ? ['refund.amount'] : [];
    const blockTokens = ev.code === 'account_welcome'
      ? ['block.store_cta']
      : ev.code === 'email_verification'
        ? ['block.verification_code']
        : ev.code === 'order_shipped'
          ? ['block.cta_button', 'block.tracking', 'block.shipment_items']
          : ev.code === 'order_refunded'
            ? ['block.refund_summary']
            : isAbandoned
              ? ['block.cta_button', 'block.order_summary']
              : ['block.cta_button', 'block.order_summary', 'block.customer_information'];
    return '<section class="nf-variable-panel"><div class="nf-variable-panel-head"><div><div class="nf-variable-panel-title">' + tx('Available variables') + '</div><div class="nf-variable-panel-copy">' + tx('Click a variable to insert it at the cursor. Blocks are inserted into the email body.') + '</div></div><div class="nf-variable-panel-note">' + tx('Only the variables and blocks listed here are supported.') + '</div></div><div class="nf-variable-grid">' +
      group('Customer', ['customer.first_name', 'customer.name'], 'scalar') +
      group('Store', ['store.name', 'store.url', 'store.contact_email'], 'scalar') +
      group('Checkout', isAbandoned ? ['checkout.recovery_url'] : [], 'scalar') +
      group('Verification', verificationTokens, 'scalar') +
      (isOrderEmail ? group('Order', orderTokens, 'scalar') + group('Order amounts', amountTokens, 'scalar') + (isAbandoned ? '' : group('Addresses', addressTokens, 'scalar')) : '') +
      group('Shipment', shipmentTokens, 'scalar') + group('Refund', refundTokens, 'scalar') + group('Prebuilt blocks', blockTokens, 'block') +
    '</div></section>';
  }
  const nfSwitch = (on, code) => '<label class="set-switch' + (on ? ' on' : '') + '" data-nf-toggle="' + code + '"><span class="set-knob"></span></label>';
  function nfActiveDomain() {
    const s = D.notifications.sender;
    const active = (s.domains || []).find((d) => d.id === s.activeDomainId);
    return active && (active.status === 'connected' || active.status === 'platform') ? active : null;
  }
  function nfSenderDomain() {
    const s = D.notifications.sender;
    return nfActiveDomain() || (s.domains || []).find((d) => d.default) || (s.domains || [])[0] || null;
  }
  function nfSenderAddress() {
    const s = D.notifications.sender, d = nfSenderDomain();
    const localPart = d && d.default
      ? (s.platformLocalPart || s.profile.localPart || 'orders')
      : (s.profile.localPart || s.platformLocalPart || 'orders');
    return localPart + '@' + (d ? d.domain : '');
  }
  function nfStoreRegistrationEmail() {
    const brand = D.notifications.brand || {};
    return brand.storeOwnerEmail || '';
  }
  function nfInheritedReplyToAddress() {
    const brand = D.notifications.brand || {};
    return brand.contactEmail || nfStoreRegistrationEmail() || '';
  }
  function nfNormalizeEmail(value) {
    const email = String(value || '').trim();
    const at = email.lastIndexOf('@');
    if (at <= 0 || at === email.length - 1) return email;
    return email.slice(0, at) + '@' + email.slice(at + 1).toLowerCase();
  }
  function nfReplyToAddress() {
    // A merchant-configured Reply-to or service inbox wins. Bestreach does not
    // receive mail, so a new store falls back to its registration email instead.
    return D.notifications.sender.profile.replyTo || nfInheritedReplyToAddress();
  }
  function nfBuildBody(ev, headline, copy) {
    const opening = '<h2 class="nf-h">' + esc(headline || '') + '</h2><p class="nf-lead">' + esc(copy || '') + '</p>';
    if (ev.code === 'account_welcome') return opening + '{{block.store_cta}}';
    if (ev.code === 'email_verification') return '{{block.verification_code}}';
    if (ev.code === 'order_paid') return opening + '{{block.cta_button}}\n{{block.order_summary}}\n{{block.customer_information}}';
    if (ev.code === 'order_shipped') return opening + '{{block.cta_button}}\n{{block.tracking}}\n{{block.shipment_items}}';
    if (ev.code === 'order_refunded') {
      const refundCopy = esc(copy || '').replace(/\{\{\s*refund\.amount\s*\}\}/gi, '<strong>{{refund.amount}}</strong>');
      return '<h2 class="nf-h">' + esc(headline || '') + '</h2><p class="nf-lead">' + refundCopy + '</p>{{block.refund_summary}}';
    }
    if (ev.code === 'abandoned_checkout') return opening + '{{block.cta_button}}\n{{block.order_summary}}';
    return opening + '{{block.cta_button}}\n{{block.order_summary}}\n{{block.shipping_address}}';
  }
  function nfTemplateSource(ev, headline, copy) {
    return nfBuildBody(ev, headline, copy);
  }
  // Refund notices do not include an invoice. Strip a stale editor draft too,
  // so the preview and its saved template stay consistent with that contract.
  function nfSanitizeTemplate(ev, source) {
    let body = String(source || '');
    if (ev.code === 'order_paid' || ev.code === 'order_refunded') {
      body = body.replace(/\s*\{\{\s*block\.invoice\s*\}\}\s*/gi, '\n');
    }
    if (ev.code === 'order_shipped') {
      body = body.replace(/\s*\{\{\s*block\.delivery_estimate\s*\}\}\s*/gi, '\n');
    }
    return body;
  }

  // resolve a scalar merge tag against brand + sample data
  function nfResolve(key, b) {
    if (key === 'verification.code') return '482917';
    if (key === 'store.name') return b.storeName;
    if (key === 'store.url') return 'm.lovocross.com';
    if (key === 'store.contact_email') return nfReplyToAddress();
    if (key.indexOf('store.') === 0) return b.storeName;
    return NF_SAMPLE[key];
  }
  // expand a dynamic block tag to safe HTML (the merchant never hand-codes loops)
  function nfBlock(tag, b) {
    const color = b.primaryColor || '#0066e6';
    const panel = (label, inner) =>
      '<div style="background:#f7f8fa;border-radius:12px;padding:20px 22px;margin:0 0 16px">' +
        (label ? '<div style="font-size:12px;font-weight:600;letter-spacing:.04em;color:#9aa3b2;margin-bottom:14px">' + label + '</div>' : '') + inner + '</div>';
    if (tag === 'block.verification_code') {
      const code = String(nfResolve('verification.code', b) || '');
      return '<section class="nf-verification-code"><p class="nf-verification-label">Your verification code:</p><div class="nf-verification-value">' + esc(code) + '</div><p class="nf-verification-note">This code can only be used once. It expires in 10 minutes.</p></section>';
    }
    if (tag === 'block.store_cta')
      return '<div class="nf-email-actions nf-email-store-action"><a href="#" class="nf-email-button" style="background:' + color + '">Visit our store</a></div>';
    const itemsRows = (items) => items.map((it) => {
      const initial = esc(String(it.name || '·').trim().charAt(0));
      return '<div style="display:flex;align-items:center;gap:14px;padding:9px 0">' +
        '<div style="width:50px;height:50px;border-radius:10px;background:#eef2fb;color:' + color + ';font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;flex:none">' + initial + '</div>' +
        '<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;color:#2a2f3a">' + esc(it.name) + '</div>' +
          '<div style="font-size:12.5px;color:#9aa3b2;margin-top:2px">' + esc(it.variant) + ' · Qty ' + it.qty + '</div></div>' +
        '<div style="font-size:14px;font-weight:600;color:#2a2f3a;white-space:nowrap">' + esc(it.price) + '</div>' +
      '</div>';
    }).join('');
    const totalRow = (label, val) => '<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:13.5px;color:#6b7480"><span>' + label + '</span><span>' + val + '</span></div>';
    const nfUnbreakMoney = (value) => String(value || '').replace(/\s+/g, '\u00a0');
    const shopifyProductDiscount = (label, amount) => '<div class="nf-email-product-discount"><img src="settings/assets/shopify-discount-tag.png" alt="" aria-hidden="true"><span>' + esc(label) + (amount ? ' (' + esc(nfUnbreakMoney(amount)) + ')' : '') + '</span></div>';
    const shopifyItemsRows = (items) => items.map((it) => {
      const discounts = it.discounts || (it.discountCode ? [{ label: it.discountCode, amount: it.discountAmount }] : []);
      const subscription = it.subscription
        ? '<div class="nf-email-subscription"><span>Subscription</span><b>·</b><span>' + esc(it.subscription.cadence) + '</span></div>'
        : '';
      const componentRows = (it.children || []).map((child) =>
        '<div class="nf-email-bundle-component"><div class="nf-email-bundle-component-image" aria-hidden="true"></div><div class="nf-email-bundle-component-copy"><div class="nf-email-bundle-component-name"><span class="nf-email-included">Included</span><span class="nf-email-bundle-component-title">' + esc(child.name) + '&nbsp;&times;&nbsp;' + child.qty + '</span></div><div class="nf-email-bundle-component-variant">' + esc(child.variant) + '</div></div></div>'
      ).join('');
      const variant = it.variant
        ? '<div class="nf-email-product-variant">' + esc(it.variant) + '</div>'
        : '';
      const details = subscription + (discounts.length ? '<div class="nf-email-product-discounts">' + discounts.map((discount) => shopifyProductDiscount(discount.label, discount.amount)).join('') + '</div>' : '') + componentRows;
      return '<div class="nf-email-product-row' + (it.kind === 'bundle' ? ' is-bundle' : '') + '">' +
        '<div class="nf-email-product-image" aria-hidden="true"></div>' +
        '<div class="nf-email-product-copy">' +
          '<div class="nf-email-product-head"><div class="nf-email-product-title">' + (it.kind === 'bundle' ? '<span class="nf-email-bundle-badge">Bundle</span>' : '') + esc(it.name) + '&nbsp;&times;&nbsp;' + it.qty + '</div>' + variant + '</div>' +
          (details ? '<div class="nf-email-product-details">' + details + '</div>' : '') +
        '</div>' +
        '<div class="nf-email-product-price">' + (it.originalPrice ? '<del>' + esc(it.originalPrice) + '</del>' : '') + '<span>' + esc(it.price) + '</span></div>' +
      '</div>';
    }).join('');
    const shopifyTotalRow = (label, val, strong) => '<div class="nf-email-total-row' + (strong ? ' is-strong' : '') + '"><span>' + label + '</span><span>' + val + '</span></div>';
    const shopifyDiscountCode = (code, amount) => '<div class="nf-email-discount-code"><img src="settings/assets/shopify-discount-tag.png" alt="" aria-hidden="true"><span>' + esc(code) + (amount ? ' (' + esc(nfUnbreakMoney(amount)) + ')' : '') + '</span></div>';
    const shopifyShippingRows = () => {
      const freeShipping = NF_SAMPLE['order.shipping_discount_code'];
      const shippingValue = freeShipping
        ? '<span class="nf-email-shipping-original">' + esc(NF_SAMPLE['order.shipping_original']) + '</span><strong>Free</strong>'
        : esc(NF_SAMPLE['order.shipping']);
      return shopifyTotalRow('Shipping', shippingValue) + (freeShipping ? shopifyDiscountCode(freeShipping, NF_SAMPLE['order.shipping_discount']) : '');
    };
    const shopifyTotalDiscount = () => NF_SAMPLE['order.total_discount']
      ? '<p class="nf-email-total-discount">You saved <span>' + esc(NF_SAMPLE['order.total_discount']) + '</span></p>'
      : '';
    const shopifyRefundTransactions = () => (NF_SAMPLE['refund.transactions'] || []).map((refund) =>
      '<div class="nf-email-refund-payment-row"><div><span>Refund</span><small>' + esc(refund.method || '') + '</small></div><strong>-' + esc(refund.amount || '') + '</strong></div>'
    ).join('');
    const addressLines = (value) => {
      const parts = String(value || '').split(/,\s*/).filter(Boolean);
      if (parts.length >= 5) {
        return esc(parts[0]) + '<br>' + esc(parts[1]) + '<br>' + esc(parts[2] + ', ' + parts[3]) + '<br>' + esc(parts[4]);
      }
      return parts.map((part) => esc(part)).join('<br>');
    };
    const infoBlock = (title, value) =>
      '<div class="nf-email-info-block"><div class="nf-email-info-title">' + title + '</div><div class="nf-email-info-value">' + value + '</div></div>';
    const customerInfo = () =>
      '<section class="nf-email-section nf-email-customer"><div class="nf-email-section-inner">' +
        '<h3>Customer information</h3>' +
        '<div class="nf-email-customer-grid">' +
          infoBlock('Shipping address', addressLines(NF_SAMPLE['order.shipping_address'])) +
          infoBlock('Billing address', addressLines(NF_SAMPLE['order.billing_address'])) +
          infoBlock('Payment', '<span class="nf-email-payment-brand">' + NF_SAMPLE['order.payment_brand'] + '</span>' + NF_SAMPLE['order.payment_method']) +
          infoBlock('Shipping method', esc(NF_SAMPLE['order.shipping_method'])) +
        '</div>' +
      '</div></section>';
    if (tag === 'block.cta_button')
      return '<div class="nf-email-actions">' +
        '<a href="' + (nfPreviewEvent === 'abandoned_checkout' ? esc(NF_SAMPLE['checkout.recovery_url']) : '#') + '" class="nf-email-button" style="background:' + color + '">' + (nfPreviewEvent === 'abandoned_checkout' ? 'Complete your checkout' : 'View your order') + '</a>' +
        '<span class="nf-email-action-or">or</span><a href="#" class="nf-email-store-link" style="color:' + color + '">Visit our store</a></div>';
    if (tag === 'block.tracking')
      return '<p class="nf-email-tracking-note">' + esc(NF_SAMPLE['shipment.carrier']) + ' tracking number: <a href="' + esc(NF_SAMPLE['shipment.tracking_url']) + '" style="color:' + color + '">' + esc(NF_SAMPLE['shipment.tracking_number']) + '</a></p>';
    if (tag === 'block.refund_summary')
      return '<section class="nf-email-section nf-email-summary nf-email-refund-summary"><div class="nf-email-section-inner">' +
        '<h3>Order summary</h3><div class="nf-email-product-list">' + shopifyItemsRows(NF_ITEMS) + '</div>' +
        '<div class="nf-email-totals">' +
          shopifyTotalRow('Subtotal', NF_SAMPLE['order.subtotal']) + shopifyTotalRow('Order discount', NF_SAMPLE['order.discount']) +
          shopifyDiscountCode(NF_SAMPLE['order.discount_code'], NF_SAMPLE['order.discount']) +
          shopifyShippingRows() + shopifyTotalRow('Taxes', NF_SAMPLE['order.tax']) +
        '</div><div class="nf-email-total-divider">' + shopifyTotalRow('Total', NF_SAMPLE['order.total'], true) +
          '<div class="nf-email-total-paid">' + shopifyTotalRow('Total paid', NF_SAMPLE['order.total_paid'], true) + '</div>' + shopifyTotalDiscount() + '</div>' +
        '<div class="nf-email-refund-payments"><div class="nf-email-refund-payment-row"><div><span>Visa</span><small>ending in 4242</small></div><strong>' + NF_SAMPLE['order.total'] + '</strong></div>' +
          shopifyRefundTransactions() + '</div>' +
      '</div></section>';
    if (tag === 'block.order_summary')
      return '<section class="nf-email-section nf-email-summary"><div class="nf-email-section-inner">' +
        '<h3>Order summary</h3><div class="nf-email-product-list">' + shopifyItemsRows(NF_ITEMS) + '</div>' +
        '<div class="nf-email-totals">' +
          shopifyTotalRow('Subtotal', NF_SAMPLE['order.subtotal']) + shopifyTotalRow('Order discount', NF_SAMPLE['order.discount']) +
          shopifyDiscountCode(NF_SAMPLE['order.discount_code'], NF_SAMPLE['order.discount']) +
          shopifyShippingRows() + shopifyTotalRow('Taxes', NF_SAMPLE['order.tax']) +
        '</div><div class="nf-email-total-divider">' + shopifyTotalRow('Total', NF_SAMPLE['order.total'], true) +
          '<div class="nf-email-total-paid">' + shopifyTotalRow('Total paid', NF_SAMPLE['order.total_paid'], true) + '</div>' + shopifyTotalDiscount() + '</div></div></section>';
    if (tag === 'block.invoice')
      return '<div class="nf-email-invoice"><div><div class="nf-email-info-title">Invoice</div><div class="nf-email-invoice-meta">#' + esc(NF_SAMPLE['order.number']) + ' · PDF</div></div><a href="' + esc(NF_SAMPLE['order.invoice_url']) + '" style="color:' + color + '">Download PDF</a></div>';
    if (tag === 'block.shipping_address')
      return panel('Shipping address', '<div style="font-size:14px;color:#5a6473;line-height:1.7">' + esc(NF_SAMPLE['order.shipping_address']) + '</div>');
    if (tag === 'block.customer_information') return customerInfo();
    if (tag === 'block.line_items') return itemsRows(NF_ITEMS);
    if (tag === 'block.shipment_items')
      return '<section class="nf-email-section nf-email-shipment"><div class="nf-email-section-inner"><h3>Items in this shipment</h3><div class="nf-email-product-list">' + shopifyItemsRows(NF_ITEMS) + '</div></div></section>';
    return '';
  }
  // expand a body string (blocks first, then scalar tags) -> preview HTML
  function nfExpand(body, b) {
    return String(body || '')
      .replace(/\{\{\s*(block\.[a-z_]+)\s*\}\}/gi, (m, t) => nfBlock(t.trim(), b))
      .replace(/\{\{\s*([a-z0-9_.]+)\s*\}\}/gi, (m, k) => { const v = nfResolve(k.trim(), b); return v != null ? esc(v) : '<span class="nf-unktag">{{' + esc(k.trim()) + '}}</span>'; });
  }
  // expand inline text (subject / preheader) -> plain text
  function nfText(str, b) {
    return String(str || '').replace(/\{\{\s*([a-z0-9_.]+)\s*\}\}/gi, (m, k) => { const v = nfResolve(k.trim(), b); return v != null ? v : ''; });
  }

  // the rendered email card (device = 'desktop' | 'mobile')
  function nfCardHtml(b, st) {
    nfPreviewEvent = st.eventCode || '';
    const color = b.primaryColor || '#0066e6';
    const mobile = st.device === 'mobile';
    const width = mobile ? 360 : 600;
    const isVerification = st.eventCode === 'email_verification';
    const isAbandoned = st.eventCode === 'abandoned_checkout';
    const showsOrderNumber = st.eventCode !== 'account_welcome' && st.eventCode !== 'email_verification';
    const header = isVerification
      ? '<div class="nf-email-header"><div class="nf-email-inner"><a href="#" class="nf-email-shop-name">' + esc(b.storeName || 'Your store') + '</a></div></div>'
      : '<div class="nf-email-header"><div class="nf-email-inner"><a href="#" class="nf-email-shop-name">' + esc(b.storeName || 'Your store') + '</a>' + (showsOrderNumber ? '<div class="nf-email-order-number">Order #' + esc(NF_SAMPLE['order.number']) + '</div>' : '') + '</div></div>';
    const footer = isVerification
      ? '<div class="nf-email-footer nf-verification-footer"><div class="nf-email-inner">© ' + esc(b.storeName || 'Your store') + '</div></div>'
      : '<div class="nf-email-footer"><div class="nf-email-inner">If you have any questions, reply to this email or contact us at <a href="mailto:' + esc(nfReplyToAddress()) + '" style="color:' + color + '">' + esc(nfReplyToAddress()) + '</a>' + (isAbandoned ? '<div class="nf-email-unsub" style="margin-top:10px"><a href="#" style="color:' + color + '">Unsubscribe from marketing emails</a></div>' : '') + '</div></div>';
    return '<div class="email-card' + (mobile ? ' is-mobile' : '') + (st.eventCode === 'order_shipped' ? ' is-shipment' : '') + (st.eventCode === 'order_refunded' ? ' is-refund' : '') + (isVerification ? ' is-verification' : '') + '" style="width:' + width + 'px">' +
      header +
      '<div class="nf-email-body">' + nfExpand(st.body, b) + '</div>' +
      footer +
    '</div>';
  }

  // read the live form values for the preview
  function nfReadForm(ev) {
    const g = (id) => { const el = root.querySelector('#' + id); return el ? el.value : ''; };
    return {
      device: notifDevice,
      eventCode: ev.code,
      fromName: D.notifications.sender.profile.fromName,
      fromEmail: nfSenderAddress(),
      subject: g('nf-subject') || ev.config.subject,
      preheader: g('nf-preheader') || ev.config.preheader,
      body: nfSanitizeTemplate(ev, g('nf-template') || ev.config.template || nfTemplateSource(ev, ev.config.headline, ev.config.copy)),
    };
  }
  function nfUpdatePreview(ev) {
    const b = D.notifications.brand;
    const st = nfReadForm(ev);
    const inbox = root.querySelector('#nf-inbox');
    if (inbox) inbox.innerHTML = '<span class="l">Subject:</span><span class="v">' + esc(nfText(st.subject, b)) + '</span>';
    const stage = root.querySelector('#nf-stage');
    if (stage) { stage.innerHTML = nfCardHtml(b, st); nfFit(); }
  }
  // scale the email card to fit the preview stage width (keeps a faithful layout)
  function nfFit() {
    try {
      const stage = root.querySelector('#nf-stage'); const card = stage && stage.querySelector('.email-card');
      if (!card) return;
      card.style.transform = 'none';
      const avail = stage.clientWidth - 24, w = card.offsetWidth;
      const s = Math.min(1, avail / w);
      card.style.transformOrigin = 'top center';
      card.style.transform = 'scale(' + s + ')';
      stage.style.height = (card.offsetHeight * s + 36) + 'px';
    } catch (e) {}
  }
  function renderNotifications() {
    if (notifSub === 'sender') return renderNotifSender();
    if (notifSub) { const f = nfFindEvent(notifSub); if (f && !f.group.locked) return renderNotifEditor(f.ev); notifSub = null; }
    return renderNotifList();
  }

  function renderNotifList() {
    const n = D.notifications;
    const sender = n.sender, activeDomain = nfActiveDomain(), senderDomain = nfSenderDomain(), senderAddress = nfSenderAddress();
    const senderStatus = activeDomain
      ? activeDomain.default
        ? '<span class="pill pill-gray"><span class="dot"></span>BestShopio default</span>'
        : '<span class="pill pill-green"><span class="dot"></span>Connected</span>'
      : '<span class="pill pill-gray"><span class="dot"></span>Not verified</span>';
    const senderDescription = activeDomain
      ? activeDomain.default
        ? '<span>Platform-managed sender domain</span> ' + esc(activeDomain.domain) + ' · <span>Customer emails can send through this default domain.</span>'
        : '<span>Reply-to</span> ' + esc(nfReplyToAddress()) + ' · <span>Connected sending domain</span> ' + esc(activeDomain.domain)
      : '<span>BestShopio default sender domain</span> ' + esc(senderDomain ? senderDomain.domain : '') + ' · <span>Customer emails continue to use the default sender until a branded domain is connected.</span>';
    const groupsHtml = n.groups.map((g) => {
      const rows = g.events.map((ev) => {
        if (g.locked) {
          return '<div class="nf-row locked">' +
            '<span class="nf-ico">' + I.globe + '</span>' +
            '<div class="nf-main"><div class="nf-name">' + esc(ev.name) + '</div><div class="nf-desc">' + esc(ev.desc) + '</div></div>' +
            '<div class="nf-right"><span class="pill pill-gray">Coming soon</span></div></div>';
        }
        const c = ev.config;
        return '<div class="nf-row" data-edit="' + ev.code + '">' +
          '<span class="nf-ico">' + I.globe + '</span>' +
          '<div class="nf-main"><div class="nf-name">' + esc(ev.name) + '</div>' +
            '<div class="nf-desc">' + esc(ev.desc) + '</div></div>' +
          '<div class="nf-right">' + (ev.required ? '<span class="pill pill-green"><span class="dot"></span>Required</span>' : nfStatusPill(c) + nfSwitch(c.enabled, ev.code)) + '<span class="nf-chev">' + I.chevR + '</span></div>' +
        '</div>';
      }).join('');
      return '<div class="nf-group">' +
        '<div class="nf-group-h">' + esc(g.label) + (g.locked ? '<span class="nf-soon">Roadmap</span>' : '') + '</div>' +
        (g.note ? '<div class="muted" style="font-size:12.5px;margin:0 2px 8px">' + esc(g.note) + '</div>' : '') +
        '<div class="nf-list">' + rows + '</div></div>';
    }).join('');

    paint(
      '<style>' + NOTIF_STYLES + '</style>' +
      '<div class="nf-list-shell">' +
      pageHead('Notifications', 'Manage the transactional messages your store sends automatically.') +
      '<div class="nf-sender-card mb-4">' +
        '<div class="nf-sender-ico">' + I.globe + '</div>' +
        '<div class="nf-main"><div class="nf-name">Sender identity ' + senderStatus + '</div>' +
          '<div class="nf-sender-address">' + esc(sender.profile.fromName) + ' &lt;' + esc(senderAddress) + '&gt;</div>' +
          '<div class="nf-desc">' + senderDescription + '</div></div>' +
        '<button class="btn btn-default" data-sender-open>Manage sender identity</button>' +
        '</div>' +
      groupsHtml + '</div>',
      false
    );

    root.querySelectorAll('[data-nf-toggle]').forEach((el) => el.onclick = (e) => {
      e.stopPropagation();
      const f = nfFindEvent(el.getAttribute('data-nf-toggle')); if (!f) return;
      if (f.ev.required) return;
      const c = f.ev.config;
      if (!c.enabled && !nfActiveDomain()) return toast('Verify a sender domain before enabling email notifications.');
      c.enabled = !c.enabled;
      toast(c.enabled ? f.ev.name + ' turned on' : f.ev.name + ' turned off');
      renderNotifList();
    });
    root.querySelectorAll('[data-edit]').forEach((el) => el.onclick = () => { location.hash = nfEditorPath(el.getAttribute('data-edit'), 'preview'); });
    const senderOpen = root.querySelector('[data-sender-open]');
    if (senderOpen) senderOpen.onclick = () => { location.hash = '#/settings/notifications/sender'; };
  }

  function renderNotifSender() {
    const n = D.notifications, sender = n.sender, profile = sender.profile, active = nfActiveDomain();
    const domainRows = sender.domains.map((d) => {
      const isActive = d.id === sender.activeDomainId;
      const isDefault = !!d.default;
      const needsDns = !isDefault && d.status !== 'connected';
      const status = isDefault
        ? '<span class="pill pill-gray"><span class="dot"></span>BestShopio default</span>'
        : d.status === 'connected'
          ? '<span class="pill pill-green"><span class="dot"></span>Connected</span>'
          : d.status === 'dns_error'
            ? '<span class="pill pill-red"><span class="dot"></span>DNS error</span>'
            : '<span class="pill pill-orange"><span class="dot"></span>Pending verification</span>';
      const primaryAction = isActive
        ? ''
        : isDefault
          ? '<span class="nf-pending">Customer emails can send through this default domain.</span>'
          : '<span class="nf-pending">Waiting for sender-domain verification</span>';
      const domainSummary = isDefault
        ? 'Platform-managed sender domain'
        : d.status === 'connected'
          ? 'Connected sending domain'
          : d.status === 'dns_error'
            ? 'DNS records not detected yet'
            : 'Waiting for sender-domain verification';
      const senderAddress = (isActive || d.status === 'connected')
        ? ((isDefault ? sender.platformLocalPart : profile.localPart) + '@' + d.domain)
        : '—';
      const senderNote = isActive || d.status === 'connected' ? 'Used for transactional email' : 'Available after connection';
      const statusValue = isActive
        ? '<span class="pill pill-green"><span class="dot"></span>Active sender domain</span>'
        : primaryAction;
      const statusNote = isActive
        ? 'Used for transactional email'
        : d.status === 'connected'
          ? 'Connected domains are selected automatically'
          : d.status === 'dns_error'
            ? 'Fix the DNS records in Domains, then verify again'
          : 'Waiting for sender-domain verification';
      const dnsRows = needsDns ? (d.records || []).map((r) =>
        '<div class="nf-dns-row nf-dns-inline"><div class="nf-dns-cell">' + esc(r.type) + '</div><div class="nf-dns-cell nf-mono">' + esc(r.host) + '</div><div class="nf-dns-cell nf-mono">' + esc(r.value) + '</div><div class="nf-dns-cell nf-dns-copy-cell"><button class="nf-dns-copy" data-copy-dns-record="' + esc(r.type + ' ' + r.host + ' ' + r.value) + '">Copy</button></div></div>'
      ).join('') : '';
      const dnsGuide = needsDns
        ? '<div class="nf-domain-dns"><div class="nf-dns-guide">Add these DNS records at your DNS provider. Verification will continue automatically after the records are found.</div><div class="nf-dns-table"><div class="nf-dns-row nf-dns-head nf-dns-inline nf-dns-inline-head"><div class="nf-dns-cell">Type</div><div class="nf-dns-cell">Host</div><div class="nf-dns-cell">Value</div><div class="nf-dns-cell"></div></div>' + dnsRows + '</div></div>'
        : '';
      const actions = isActive || isDefault ? '' : '<button class="btn btn-default" data-domain-remove="' + esc(d.id) + '">Remove</button>';
      return '<div class="nf-domain-row' + (needsDns ? ' has-dns' : '') + '">' +
        '<div class="nf-domain-main">' +
          '<div class="nf-domain-header"><div class="nf-domain-field-label">Sending domain</div><div class="nf-domain-value">' + esc(d.domain) + ' ' + status + '</div><div class="nf-domain-cell-hint">' + domainSummary + '</div></div>' +
          '<div class="nf-domain-facts">' +
            '<div class="nf-domain-cell"><div class="nf-domain-field-label">Sender address</div><div class="nf-domain-value nf-domain-address">' + esc(senderAddress) + '</div><div class="nf-domain-cell-hint">' + senderNote + '</div></div>' +
            '<div class="nf-domain-cell nf-domain-status"><div class="nf-domain-field-label">Status</div><div class="nf-domain-status-value">' + statusValue + '</div><div class="nf-domain-cell-hint">' + statusNote + '</div>' + (actions ? '<div class="nf-domain-actions">' + actions + '</div>' : '') + '</div>' +
          '</div>' +
        '</div>' + dnsGuide + '</div>';
    }).join('');
    const input = (label, id, value, hint, placeholder, disabled) =>
      '<div style="margin-bottom:14px"><label class="nf-label" for="' + id + '">' + label + '</label>' +
      '<input class="input nf-sender-input" id="' + id + '" value="' + esc(value || '') + '"' + (placeholder ? ' placeholder="' + esc(placeholder) + '"' : '') + (disabled ? ' disabled aria-disabled="true"' : '') + ' style="width:100%" />' +
      (hint ? '<div class="nf-hint">' + hint + '</div>' : '') + '</div>';
    const inheritedReplyTo = nfInheritedReplyToAddress();
    const effectiveReplyTo = profile.replyTo || inheritedReplyTo;
    const replyToHint = profile.replyTo
      ? 'Customers’ replies will be sent to this address.'
      : n.brand.contactEmail
        ? 'Store service email · Default'
        : 'Store registration email · Default';
    const replyToInput = '<div style="margin-bottom:14px"><label class="nf-label" for="nf-sender-reply">Reply-to</label>' +
      '<input class="input nf-sender-input" id="nf-sender-reply" type="email" required value="' + esc(effectiveReplyTo) + '" aria-describedby="nf-sender-reply-hint nf-sender-reply-error" style="width:100%" />' +
      '<div class="nf-hint" id="nf-sender-reply-hint">' + replyToHint + '</div>' +
      '<div class="nf-field-error" id="nf-sender-reply-error" role="alert"></div></div>';
    const defaultDomain = sender.domains.find((d) => d.default) || null;
    const brandedDomain = sender.domains.find((d) => !d.default) || null;
    const senderAddressFor = (d) => ((d && d.default ? sender.platformLocalPart : profile.localPart) || sender.platformLocalPart) + '@' + (d ? d.domain : '');
    const defaultDomainCard = defaultDomain
      ? '<article class="nf-sender-domain-card is-default"><div class="nf-sender-domain-card-head"><span class="nf-sender-domain-icon">' + I.globe + '</span><div class="nf-sender-domain-card-main"><div class="nf-sender-domain-card-title">Store default sending domain</div><div class="nf-sender-domain-card-address">' + esc(senderAddressFor(defaultDomain)) + '</div></div><span class="pill pill-gray"><span class="dot"></span>BestShopio default</span></div><p class="nf-sender-domain-card-copy">This domain is created for your store and is ready to send transactional email.</p></article>'
      : '';
    const brandedStatus = !brandedDomain
      ? ''
      : brandedDomain.status === 'connected'
        ? '<span class="pill pill-green"><span class="dot"></span>Connected</span>'
        : brandedDomain.status === 'dns_error'
          ? '<span class="pill pill-red"><span class="dot"></span>DNS error</span>'
          : '<span class="pill pill-orange"><span class="dot"></span>Pending verification</span>';
    const brandedCopy = !brandedDomain
      ? 'Use your own domain to make your sender easier for customers to recognize. When it connects, it replaces the default sender automatically.'
      : brandedDomain.status === 'connected'
        ? 'This domain is used automatically for transactional email.'
        : brandedDomain.status === 'dns_error'
          ? 'Fix the DNS records in Domains, then verify again.'
          : 'Add the DNS records in Domains to complete verification.';
    const brandedDomainCard = '<article class="nf-sender-domain-card is-branded' + (brandedDomain ? ' has-domain' : '') + '"><div class="nf-sender-domain-card-head"><span class="nf-sender-domain-icon is-branded">' + I.globe + '</span><div class="nf-sender-domain-card-main"><div class="nf-sender-domain-card-title">' + (brandedDomain ? 'Branded sending domain' : 'Add branded sending domain') + '</div>' + (brandedDomain ? '<div class="nf-sender-domain-card-address">' + esc(senderAddressFor(brandedDomain)) + '</div>' : '<p class="nf-sender-domain-card-copy is-inline">' + brandedCopy + '</p>') + '</div>' + brandedStatus + '</div>' + (brandedDomain ? '<p class="nf-sender-domain-card-copy">' + brandedCopy + '</p>' : '') + '<div class="nf-sender-domain-card-actions"><button class="btn ' + (brandedDomain ? 'btn-default' : 'btn-primary') + '" data-manage-sending-domain>' + (brandedDomain ? 'Manage branded sending domain' : 'Add branded sending domain') + '</button></div></article>';

    paint(
      '<style>' + NOTIF_STYLES + '</style>' +
      '<div class="nf-list-shell">' +
      '<div class="flex items-center gap-3 mb-4"><button class="back-btn" data-back title="Back">' + I.chevL + '</button>' +
        '<div><div class="page-title" style="font-size:18px">Sender identity</div><div class="muted" style="font-size:12.5px;margin-top:2px">Configure the sender name and reply-to address customers see on your emails.</div></div></div>' +
      '<div class="nf-sender-layout">' +
        '<div class="panel card-pad"><div class="nf-section-title">From identity</div>' +
          input('From name', 'nf-sender-name', profile.fromName, 'Shown in the customer inbox for every transactional message.') +
          input('Sender address', 'nf-sender-local', active && active.default ? nfSenderAddress() : profile.localPart, active ? (active.default ? 'BestShopio provisions this address for your store. Connect a custom domain to edit the address prefix.' : 'The address uses the active connected domain: @' + esc(active.domain) + '.') : 'This address will be ready after the sender domain is connected.', '', !active || active.default) +
          replyToInput +
          '<button class="btn btn-primary" data-sender-save>Save sender identity</button></div>' +
        '<section class="nf-sender-domain-section"><div class="nf-section-title">Sending domain</div>' +
          defaultDomainCard + brandedDomainCard +
        '</section>' +
      '</div></div>',
      false
    );

    root.querySelector('[data-back]').onclick = () => { location.hash = '#/settings/notifications'; };
    const replyToEl = root.querySelector('#nf-sender-reply');
    const setReplyToError = (message) => {
      const error = root.querySelector('#nf-sender-reply-error');
      replyToEl.classList.toggle('is-error', !!message);
      replyToEl.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (error) error.textContent = message || '';
    };
    const validateReplyTo = () => {
      const value = nfNormalizeEmail(replyToEl.value);
      replyToEl.value = value;
      const valid = !!value && replyToEl.checkValidity();
      setReplyToError(valid ? '' : 'Enter a valid reply-to email address.');
      return valid;
    };
    replyToEl.addEventListener('blur', validateReplyTo);
    replyToEl.addEventListener('input', () => setReplyToError(''));
    root.querySelector('[data-sender-save]').onclick = () => {
      const get = (id) => (root.querySelector('#' + id).value || '').trim();
      const name = get('nf-sender-name'), rawLocalPart = get('nf-sender-local');
      if (!validateReplyTo()) return replyToEl.focus();
      const replyTo = nfNormalizeEmail(replyToEl.value);
      const localPart = active && active.default
        ? sender.platformLocalPart
        : rawLocalPart.replace(/[^a-z0-9._+-]/gi, '').toLowerCase();
      if (!name || !localPart) return toast('Complete the sender identity fields');
      profile.fromName = name;
      profile.localPart = localPart;
      profile.replyTo = inheritedReplyTo && replyTo.toLowerCase() === nfNormalizeEmail(inheritedReplyTo).toLowerCase() ? '' : replyTo;
      toast('Sender identity saved');
      if (window.SettingsChrome) window.SettingsChrome.setDirty(false);
      renderNotifSender();
    };
    root.querySelector('[data-manage-sending-domain]').onclick = () => { location.hash = '#/settings/domains'; };
  }

  function renderNotifEditor(ev) {
    const c = ev.config;
    const isCode = notifEditorMode === 'code';
    const source = nfSanitizeTemplate(ev, c.template || nfTemplateSource(ev, c.headline, c.copy));
    const tx = (text) => window.I18N && typeof window.I18N.t === 'function' ? window.I18N.t(text) : text;
    const editLabel = tx('Edit code');
    const crumbs = isCode ? editLabel : tx(ev.name);
    const actions = isCode
      ? ''
      : '<button class="btn btn-default" data-test>' + tx('Send test') + '</button><button class="btn btn-primary" data-code>Edit code</button>';
    const preview =
      '<section class="nf-shop-preview"><div class="nf-pv-head"><div class="nf-pv-title">Preview</div>' +
        '<div class="nf-seg"><button data-dev="desktop" class="' + (notifDevice === 'desktop' ? 'on' : '') + '">Desktop</button><button data-dev="mobile" class="' + (notifDevice === 'mobile' ? 'on' : '') + '">Mobile</button></div></div>' +
        '<div class="nf-inbox" id="nf-inbox"></div><div class="nf-stage" id="nf-stage"></div></section>';
    const variablePanel = isCode ? nfVariablePanel(ev) : '';
    const code =
      '<section class="nf-code-page"><div class="nf-code-card"><div class="nf-code-card-title">Preview</div><label class="nf-label" for="nf-subject">Email subject</label><input class="input" id="nf-subject" value="' + esc(c.subject || '') + '" style="width:100%;margin:7px 0 16px" />' +
        '<label class="nf-label" for="nf-template">Email body (HTML)</label><div class="nf-code-wrap"><div class="nf-code-gutter" aria-hidden="true">1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>10<br>11<br>12<br>13<br>14<br>15<br>16</div><textarea id="nf-template" class="nf-code" spellcheck="false" wrap="soft">' + esc(source) + '</textarea></div><div class="nf-hint" style="margin-top:10px">Use the back button to check the rendered email.</div></div>' +
      '<div class="nf-code-notice"><div class="nf-code-notice-title">Template variables</div><div>You can use supported customer, order, and store variables in this template. Order, tracking, invoice, and address blocks are rendered safely when the email is sent.</div></div>' +
      variablePanel +
      '</section>';

    paint('<style>' + NOTIF_STYLES + '</style><div class="nf-shop-shell">' +
      '<div class="nf-shop-head"><div class="flex items-center gap-3"><button class="back-btn" data-back title="Back">' + I.chevL + '</button><div class="nf-crumb">' + crumbs + '</div></div><div class="flex items-center gap-2">' + actions + '</div></div>' +
      (isCode ? code : preview) + '</div>', false);

    if (!isCode) { nfUpdatePreview(ev); setTimeout(nfFit, 0); }
    root.querySelector('[data-back]').onclick = () => {
      if (isCode) {
        nfSaveFromForm(ev);
        location.hash = nfEditorPath(ev.code, 'preview');
        return;
      }
      location.hash = '#/settings/notifications';
    };
    root.querySelector('[data-code]')?.addEventListener('click', () => { location.hash = nfEditorPath(ev.code, 'code'); });
    root.querySelector('[data-test]')?.addEventListener('click', () => openNotifTestModal(ev));
    root.querySelectorAll('[data-dev]').forEach((bd) => bd.onclick = () => { notifDevice = bd.getAttribute('data-dev'); root.querySelectorAll('[data-dev]').forEach((x) => x.classList.toggle('on', x === bd)); nfUpdatePreview(ev); });
    ['nf-subject', 'nf-template'].forEach((id) => {
      const el = root.querySelector('#' + id);
      if (!el) return;
      const rememberTarget = () => {
        nfInsertTarget = id;
        const start = typeof el.selectionStart === 'number' ? el.selectionStart : el.value.length;
        const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : start;
        nfInsertSelection = { id, start, end };
      };
      el.addEventListener('input', () => { rememberTarget(); nfSaveFromForm(ev); });
      ['focus', 'click', 'keyup', 'select'].forEach((eventName) => el.addEventListener(eventName, rememberTarget));
    });
    root.querySelectorAll('[data-insert-token]').forEach((button) => button.onclick = () => {
      const token = button.getAttribute('data-insert-token');
      const isBlock = button.getAttribute('data-token-kind') === 'block';
      const targetId = isBlock ? 'nf-template' : nfInsertTarget;
      const field = root.querySelector('#' + targetId) || root.querySelector('#nf-template');
      if (!field || !token) return;
      const selection = nfInsertSelection.id === targetId && Number.isInteger(nfInsertSelection.start) && Number.isInteger(nfInsertSelection.end)
        ? nfInsertSelection
        : { start: field.value.length, end: field.value.length };
      const before = field.value.slice(0, selection.start);
      const after = field.value.slice(selection.end);
      const value = '{{' + token + '}}';
      field.value = before + value + after;
      const caret = before.length + value.length;
      field.focus();
      field.setSelectionRange(caret, caret);
      nfInsertTarget = targetId;
      nfInsertSelection = { id: targetId, start: caret, end: caret };
      field.dispatchEvent(new Event('input', { bubbles: true }));
      toast((window.I18N && window.I18N.t ? window.I18N.t('Variable inserted') : 'Variable inserted'));
    });
    root.querySelectorAll('[data-copy-token]').forEach((button) => button.onclick = () => {
      const token = button.getAttribute('data-copy-token');
      if (!token) return;
      try { navigator.clipboard.writeText('{{' + token + '}}'); } catch (e) {}
      toast((window.I18N && window.I18N.t ? window.I18N.t('Variable copied') : 'Variable copied'));
    });
  }

  // persist the form back into the event config (prototype: in-memory)
  function nfSaveFromForm(ev) {
    const g = (id) => { const el = root.querySelector('#' + id); return el ? el.value : undefined; };
    const c = ev.config;
    ['subject|nf-subject', 'preheader|nf-preheader', 'headline|nf-headline', 'copy|nf-copy', 'template|nf-template'].forEach((p) => { const [k, id] = p.split('|'); const v = g(id); if (v !== undefined) c[k] = k === 'template' ? nfSanitizeTemplate(ev, v) : v; });
    c.updatedAt = '2026-07-27';
  }

  function openNotifTestModal(ev) {
    modal({
      title: 'Send test email', width: 460, okText: 'Send test',
      body: '<div class="muted mb-4" style="font-size:13px;line-height:1.6">Send a test email with sample order data to check the recipient and message layout.</div>' +
        field('Recipient', window.SITE && window.SITE.email ? window.SITE.email : '', 'you@example.com'),
      onOk: (m, close) => {
        const inp = m.querySelector('input'); const to = inp ? inp.value : '';
        D.notifications.deliveryLog.push({ event: ev.code, recipient: to, recordedAt: new Date().toISOString() });
        close(); toast(to ? 'Test email sent to ' + to : 'Test email sent');
      },
    });
  }

  const NOTIF_STYLES = `
  .nf-list-shell { width: 860px; max-width: 100%; margin: 0 auto; }
  .nf-group { margin-bottom: 22px; }
  .nf-group:last-child { margin-bottom: 0; }
  .nf-group-h { display: flex; align-items: center; gap: 8px; font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--ink-muted); margin: 0 2px 8px; }
  .nf-soon { text-transform: none; letter-spacing: 0; font-size: 11px; font-weight: 500; color: var(--ink-muted); background: var(--panel); border: 1px solid var(--hair); border-radius: 9999px; padding: 1px 8px; }
  .nf-list { display: flex; flex-direction: column; gap: 10px; }
  .nf-row { display: flex; align-items: center; gap: 14px; padding: 13px 16px; border: 1px solid var(--hair); border-radius: 10px; background: #fff; cursor: pointer; transition: border-color .12s, background .12s; }
  .nf-row:hover { border-color: var(--brand); background: #fcfdff; }
  .nf-row.locked { cursor: default; background: var(--panel); }
  .nf-row.locked:hover { border-color: var(--hair); background: var(--panel); }
  .nf-ico { width: 36px; height: 36px; border-radius: 8px; background: #e6f0ff; color: var(--brand); display: grid; place-items: center; flex: none; }
  .nf-row.locked .nf-ico { background: #eef0f4; color: var(--ink-muted); }
  .nf-main { flex: 1; min-width: 0; }
  .nf-name { font-size: 14px; font-weight: 600; color: var(--ink); display: flex; align-items: center; gap: 8px; }
  .nf-desc { font-size: 12.5px; color: var(--ink-muted); margin-top: 2px; }
  .nf-right { display: flex; align-items: center; gap: 12px; flex: none; }
  .nf-chev { color: var(--ink-muted); display: inline-flex; }
  .nf-sender-card { display: flex; align-items: center; gap: 14px; padding: 16px; border: 1px solid #cfe0ff; border-radius: 10px; background: #f8fbff; }
  .nf-sender-ico { width: 36px; height: 36px; display: grid; place-items: center; flex: none; border-radius: 8px; background: #e6f0ff; color: var(--brand); }
  .nf-sender-address { font-size: 13px; color: var(--ink); margin-top: 3px; }
  .nf-sender-card .btn { flex: none; }
  .nf-sender-layout { display: grid; grid-template-columns: 1fr; gap: 16px; align-items: start; }
  .nf-sender-input:disabled { background: #f5f7fa; border-color: #e1e6ed; color: #8b95a7; cursor: not-allowed; opacity: 1; }
  .nf-sender-input:disabled::placeholder { color: #a6afbd; }
  .nf-sender-input.is-error { border-color: var(--err); box-shadow: 0 0 0 2px rgb(211 54 18 / 10%); }
  .nf-field-error { min-height: 18px; margin-top: 5px; color: var(--err); font-size: 11.5px; line-height: 1.5; }
  .nf-section-title { font-size: 14px; font-weight: 650; color: var(--ink); margin-bottom: 16px; }
  .nf-sender-domain-section { display: flex; flex-direction: column; gap: 12px; }
  .nf-sender-domain-section .nf-section-title { margin: 0 2px 2px; }
  .nf-sender-domain-card { border: 1px solid var(--hair); border-radius: 12px; padding: 17px 18px; background: #fff; box-shadow: 0 1px 2px rgb(21 32 51 / 3%); }
  .nf-sender-domain-card.is-default { background: #fbfcff; }
  .nf-sender-domain-card.is-branded { border-color: #cfe0ff; background: linear-gradient(135deg, #fbfdff 0%, #f5f9ff 100%); }
  .nf-sender-domain-card.is-branded.has-domain { border-color: #cce9d9; background: linear-gradient(135deg, #fcfffd 0%, #f4fbf7 100%); }
  .nf-sender-domain-card-head { display: flex; align-items: flex-start; gap: 12px; }
  .nf-sender-domain-icon { display: grid; place-items: center; width: 36px; height: 36px; flex: none; border-radius: 9px; background: #eef2f6; color: #64748b; }
  .nf-sender-domain-icon.is-branded { background: #e6f0ff; color: var(--brand); }
  .nf-sender-domain-card-main { flex: 1; min-width: 0; padding-top: 1px; }
  .nf-sender-domain-card-title { color: var(--ink); font-size: 14px; font-weight: 650; line-height: 1.35; }
  .nf-sender-domain-card-address { margin-top: 4px; color: var(--ink-body); font-size: 13px; font-weight: 600; line-height: 1.45; overflow-wrap: anywhere; }
  .nf-sender-domain-card-copy { margin: 2px 0 0 48px; color: var(--ink-muted); font-size: 12.5px; line-height: 1.55; }
  .nf-sender-domain-card-main .nf-sender-domain-card-copy.is-inline { margin: 3px 0 0; }
  .nf-sender-domain-card-actions { display: flex; margin: 14px 0 0 48px; }
  .nf-sender-domain-card-actions .btn { min-width: 132px; }
  .nf-sender-ref { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; margin: 0 0 14px; border: 1px solid var(--hair); border-radius: 8px; background: var(--panel); }
  .nf-copy { width: 100%; min-height: 150px; padding: 10px 12px; border: 1px solid var(--ctl); border-radius: 8px; resize: vertical; color: var(--ink); background: #fff; font: 13px/1.6 inherit; }
  .nf-copy:focus { outline: none; border-color: var(--brand); }
  .nf-domain-list { display: flex; flex-direction: column; gap: 10px; }
  .nf-domain-row { display: flex; align-items: center; gap: 14px; padding: 0; border: 1px solid #dfe5ec; border-radius: 10px; background: #fff; overflow: hidden; }
  .nf-domain-row.has-dns { display: block; padding: 0; overflow: hidden; }
  .nf-domain-main { width: 100%; }
  .nf-domain-header { padding: 18px 20px 16px; }
  .nf-domain-facts { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(220px, .8fr); border-top: 1px solid #e8edf3; }
  .nf-domain-cell { min-width: 0; padding: 16px 20px; }
  .nf-domain-cell + .nf-domain-cell { border-left: 1px solid #e8edf3; }
  .nf-domain-field-label { margin-bottom: 8px; color: #778294; font-size: 11.5px; font-weight: 600; letter-spacing: .02em; }
  .nf-domain-value { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--ink); font-size: 14px; font-weight: 600; line-height: 1.45; }
  .nf-domain-value .pill, .nf-domain-status-value .pill { flex: none; white-space: nowrap; }
  .nf-domain-address { overflow-wrap: anywhere; }
  .nf-domain-cell-hint { margin-top: 5px; color: var(--ink-muted); font-size: 12px; line-height: 1.45; }
  .nf-domain-status { background: #fbfcfe; }
  .nf-domain-status-value { display: flex; align-items: center; min-height: 20px; }
  .nf-domain-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 10px; }
  .nf-pending { color: var(--ink-muted); font-size: 12px; }
  .nf-dns-table { border: 1px solid var(--hair); border-radius: 8px; overflow: hidden; }
  .nf-dns-row { display: grid; grid-template-columns: 88px 160px minmax(0, 1fr); border-top: 1px solid var(--hair); }
  .nf-dns-row.nf-dns-inline { grid-template-columns: 76px 148px minmax(0, 1fr) 64px; }
  .nf-dns-row:first-child { border-top: 0; }
  .nf-dns-head { background: var(--panel); font-size: 12px; font-weight: 600; color: var(--ink-muted); }
  .nf-dns-cell { min-width: 0; padding: 10px 12px; font-size: 12.5px; overflow-wrap: anywhere; }
  .nf-mono { font-family: ui-monospace, Menlo, Consolas, monospace; }
  .nf-domain-dns { border-top: 1px solid var(--hair); padding: 12px 14px 14px; background: #fbfdff; }
  .nf-dns-guide { margin: 0 0 10px; color: var(--ink-muted); font-size: 12px; line-height: 1.5; }
  .nf-dns-copy-cell { display: flex; align-items: center; justify-content: flex-end; }
  .nf-dns-copy { padding: 4px 8px; border: 1px solid var(--ctl); border-radius: 6px; background: #fff; color: var(--brand); font: inherit; font-size: 12px; cursor: pointer; }
  .nf-dns-copy:hover { border-color: var(--brand); background: #f7faff; }
  @media (max-width: 840px) { .nf-domain-facts { grid-template-columns: 1fr; } .nf-domain-cell + .nf-domain-cell { border-left: 0; border-top: 1px solid #e8edf3; } }
  @media (max-width: 620px) { .nf-sender-card { align-items: flex-start; flex-wrap: wrap; } .nf-sender-card .btn { width: 100%; } .nf-sender-ref { align-items: flex-start; flex-direction: column; } .nf-sender-domain-card { padding: 15px; } .nf-sender-domain-card-head { gap: 10px; } .nf-sender-domain-card-copy, .nf-sender-domain-card-actions { margin-left: 0; } .nf-sender-domain-card-actions .btn { width: 100%; } .nf-dns-row { grid-template-columns: 68px 104px minmax(0, 1fr); } .nf-dns-row.nf-dns-inline { grid-template-columns: 58px minmax(0, 1fr) 54px; } .nf-dns-inline-head { display: none; } .nf-dns-row.nf-dns-inline > :nth-child(1) { grid-column: 1; grid-row: 1; } .nf-dns-row.nf-dns-inline > :nth-child(2) { grid-column: 2 / 4; grid-row: 1; } .nf-dns-row.nf-dns-inline > :nth-child(3) { grid-column: 2; grid-row: 2; } .nf-dns-row.nf-dns-inline > :nth-child(4) { grid-column: 3; grid-row: 2; } .nf-dns-cell { padding: 9px; font-size: 11.5px; } }

  /* Shopify-style notification editor */
  .nf-shop-shell { width: min(860px, 100%); margin: 0 auto; }
  .nf-shop-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 0 0 18px; }
  .nf-crumb { color: var(--ink); font-size: 20px; font-weight: 650; line-height: 1.4; }
  .nf-shop-preview, .nf-code-page { width: 100%; margin: 0 auto; }
  .nf-shop-preview { padding: 12px 18px 18px; border: 1px solid var(--hair); border-radius: 12px; background: #fff; }
  .nf-code-notice { margin: 16px 0; padding: 16px 18px; border: 1px solid var(--hair); border-radius: 12px; background: #fff; color: var(--ink-body); font-size: 13px; line-height: 1.65; }
  .nf-code-notice-title { color: var(--ink); font-size: 14px; font-weight: 650; margin-bottom: 4px; }
  .nf-variable-panel { margin: 0 0 16px; padding: 15px 18px 16px; border: 1px solid var(--hair); border-radius: 12px; background: #fff; }
  .nf-variable-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
  .nf-variable-panel-title { color: var(--ink); font-size: 14px; font-weight: 650; line-height: 1.4; }
  .nf-variable-panel-copy { margin-top: 3px; color: var(--ink-muted); font-size: 12px; line-height: 1.5; }
  .nf-variable-panel-note { max-width: 220px; color: var(--ink-muted); font-size: 11.5px; line-height: 1.45; text-align: right; }
  .nf-variable-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 13px; }
  .nf-var-group { min-width: 0; }
  .nf-var-group-title { margin: 0 0 6px; color: var(--ink-body); font-size: 12px; font-weight: 600; }
  .nf-var-token-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .nf-var-token { display: inline-flex; min-width: 0; max-width: 100%; overflow: hidden; border: 1px solid #dfe5ed; border-radius: 6px; background: #f8fafc; }
  .nf-var-insert { min-width: 0; max-width: 100%; overflow: hidden; border: 0; padding: 5px 7px; background: transparent; color: #2458a8; cursor: pointer; font: 12px/1.35 ui-monospace, SFMono-Regular, Consolas, monospace; text-align: left; }
  .nf-var-insert:hover { background: #edf4ff; }
  .nf-var-insert code { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: inherit; }
  .nf-var-copy { flex: none; border: 0; border-left: 1px solid #dfe5ed; padding: 5px 7px; background: #fff; color: var(--ink-muted); cursor: pointer; font-size: 11px; line-height: 1.35; }
  .nf-var-copy:hover { color: var(--brand); background: #f7faff; }
  .nf-code-card { padding: 18px; border: 1px solid var(--hair); border-radius: 12px; background: #fff; }
  .nf-code-card-title { color: var(--ink); font-size: 14px; font-weight: 650; margin: 0 0 16px; }
  .nf-code-wrap { display: grid; grid-template-columns: 44px minmax(0, 1fr); min-height: 420px; border: 1px solid var(--ctl); border-radius: 8px; overflow: hidden; background: #fbfbfc; }
  .nf-code-gutter { padding: 12px 9px; border-right: 1px solid var(--hair); color: #9aa3b2; background: #f7f8fa; text-align: right; font: 12px/1.55 ui-monospace, SFMono-Regular, Consolas, monospace; user-select: none; }
  .nf-code { width: 100%; min-height: 420px; border: 0; outline: 0; resize: vertical; padding: 12px 14px; color: #263041; background: transparent; font: 12px/1.55 ui-monospace, SFMono-Regular, Consolas, monospace; white-space: pre-wrap; overflow-wrap: anywhere; overflow-x: hidden; tab-size: 2; }
  @media (max-width: 620px) { .nf-shop-head { align-items: flex-start; flex-direction: column; } .nf-shop-head > .flex:last-child { width: 100%; flex-wrap: wrap; } .nf-shop-head .btn { flex: 1; } .nf-shop-preview, .nf-code-card { padding: 12px; } .nf-code-wrap, .nf-code { min-height: 340px; } .nf-variable-panel { padding: 13px; } .nf-variable-panel-head { flex-direction: column; gap: 5px; } .nf-variable-panel-note { max-width: none; text-align: left; } .nf-variable-grid { grid-template-columns: 1fr; gap: 12px; } }
  .nf-label { display: block; font-size: 13px; font-weight: 600; color: var(--ink); margin: 0 0 6px; }
  .nf-hint { font-size: 11.5px; color: var(--ink-muted); margin-top: 5px; line-height: 1.5; }

  /* preview */
  .nf-pv-head { display: flex; min-height: 40px; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .nf-pv-title { display: flex; align-items: center; align-self: stretch; color: var(--ink); font-size: 13px; font-weight: 600; line-height: 1.35; }
  .nf-seg { display: inline-flex; border: 1px solid var(--ctl); border-radius: 8px; overflow: hidden; }
  .nf-seg button { border: none; background: #fff; padding: 6px 14px; font-size: 12.5px; color: var(--ink-body); cursor: pointer; }
  .nf-seg button + button { border-left: 1px solid var(--ctl); }
  .nf-seg button.on { background: var(--brand); color: #fff; }
  .nf-inbox { border: 1px solid var(--hair); border-bottom: none; border-radius: 10px 10px 0 0; background: #fff; padding: 10px 14px; font-size: 12.5px; }
  .nf-inbox .l { color: var(--ink-muted); } .nf-inbox .v { margin-left: 6px; color: var(--ink); font-weight: 500; }
  .nf-stage { border: 1px solid var(--hair); border-radius: 0 0 10px 10px; background: #eef1f5; padding: 18px 12px; overflow: hidden; }
  .email-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgb(16 24 40 / 8%); overflow: hidden; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif; }
  .email-card .nf-h { margin: 0 0 10px; font-size: 22px; font-weight: 700; color: #1f2430; letter-spacing: -.01em; }
  .email-card .nf-lead { margin: 0 0 22px; font-size: 15px; color: #5a6473; line-height: 1.7; }
  .email-card .nf-fine { margin: 18px 0 0; font-size: 13px; color: #9aa3b2; line-height: 1.7; }
  /* Shopify notification geometry: header, content, summary, customer information and footer. */
  .email-card { border-radius: 0; box-shadow: none; color: #777; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif; }
  .email-card .nf-email-inner { box-sizing: border-box; padding: 32px 40px; }
  .email-card .nf-email-header { background: #fff; }
  .email-card .nf-email-header .nf-email-inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
  .email-card .nf-email-shop-name { color: #000; font-size: 20px; font-weight: 500; line-height: 1.25; text-decoration: none; }
  .email-card .nf-email-order-number { color: #999; font-size: 14px; line-height: 1.45; text-align: right; white-space: nowrap; }
  .email-card .nf-email-body { padding: 34px 40px 0; }
  .email-card .nf-h { margin: 0 0 10px; color: #000; font-size: 24px; font-weight: 400; letter-spacing: 0; line-height: 1.333; }
  .email-card .nf-lead { margin: 0; color: #777; font-size: 16px; line-height: 1.5; }
  .email-card .nf-email-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin: 30px 0 0; }
  .email-card .nf-email-button { display: inline-block; box-sizing: border-box; border-radius: 4px; color: #fff; font-size: 14px; font-weight: 600; line-height: 1.2; padding: 14px 22px; text-decoration: none; }
  .email-card .nf-email-action-or { color: #737373; font-size: 14px; }
  .email-card .nf-email-store-link { font-size: 14px; text-decoration: none; }
  .email-card .nf-email-estimate { margin: 18px 0 0; color: #545454; font-size: 14px; line-height: 1.6; }
  .email-card .nf-email-tracking-note { margin: 28px 0 0; color: #737373; font-size: 13px; line-height: 1.6; }
  .email-card .nf-email-tracking-note a { text-decoration: none; }
  .email-card .nf-email-section { margin: 36px -40px 0; background: #fff; }
  .email-card .nf-email-section-inner { padding: 32px 40px; }
  .email-card .nf-email-section h3 { margin: 0 0 21px; color: #000; font-size: 20px; font-weight: 400; line-height: 1.3; }
  .email-card .nf-email-product-row { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-top: 1px solid #e6e6e6; }
  .email-card .nf-email-product-row:first-child { border-top: 0; padding-top: 0; }
  .email-card .nf-email-product-row.is-bundle { align-items: flex-start; }
  .email-card .nf-email-product-image { display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; flex: none; box-sizing: border-box; border: 1px solid #dedede; border-radius: 4px; background: #f6f6f6; font-size: 16px; font-weight: 600; }
  .email-card .nf-email-product-copy { min-width: 0; flex: 1; }
  .email-card .nf-email-product-title, .email-card .nf-email-product-price { color: #555; font-size: 16px; font-weight: 500; line-height: 1.35; }
  .email-card .nf-email-bundle-badge { display: inline-block; margin: 0 7px 0 0; padding: 1px 5px; border-radius: 3px; background: #f0f4ff; color: #526bba; font-size: 11px; font-weight: 600; line-height: 1.35; vertical-align: 1px; }
  .email-card .nf-email-product-variant { margin-top: 3px; color: #999; font-size: 14px; line-height: 1.4; }
  .email-card .nf-email-subscription { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; margin-top: 5px; color: #777; font-size: 13px; line-height: 1.4; }
  .email-card .nf-email-subscription span:first-child { color: #555; font-weight: 500; }
  .email-card .nf-email-subscription b { color: #aaa; font-size: 12px; }
  .email-card .nf-email-product-discounts { margin-top: 4px; }
  .email-card .nf-email-product-discount { display: flex; align-items: flex-start; gap: 5px; margin-top: 3px; color: #777; font-size: 14px; line-height: 1.35; }
  .email-card .nf-email-product-discount img { display: block; width: 16px; height: 16px; flex: none; margin-top: 2px; }
  .email-card .nf-email-product-discount span { min-width: 0; overflow-wrap: break-word; word-break: normal; }
  .email-card .nf-email-bundle-component { display: flex; align-items: flex-start; gap: 9px; margin: 10px 0 0; padding: 10px 0 0 10px; border-top: 1px solid #f0f0f0; }
  .email-card .nf-email-bundle-component-image { width: 36px; height: 36px; flex: none; box-sizing: border-box; border: 1px solid #e4e4e4; border-radius: 3px; background: #fafafa; }
  .email-card .nf-email-bundle-component-copy { min-width: 0; flex: 1; }
  .email-card .nf-email-bundle-component-name { display: block; }
  .email-card .nf-email-included { display: inline-block; margin: 0 6px 0 0; padding: 1px 5px; border-radius: 3px; background: #f4f5f7; color: #8b919c; font-size: 11px; font-weight: 600; line-height: 1.35; vertical-align: 1px; }
  .email-card .nf-email-bundle-component-title { color: #666; font-size: 13px; font-weight: 500; line-height: 1.4; overflow-wrap: break-word; word-break: normal; }
  .email-card .nf-email-bundle-component-variant { margin-top: 2px; color: #999; font-size: 12px; line-height: 1.4; }
  .email-card .nf-email-product-price { white-space: nowrap; }
  .email-card .nf-email-product-row.is-bundle .nf-email-product-price { padding-top: 1px; }
  .email-card .nf-email-product-price { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
  .email-card .nf-email-product-price del { color: #999; font-size: 14px; font-weight: 400; }
  .email-card .nf-email-totals { width: 60%; margin: 22px 0 0 auto; }
  .email-card .nf-email-total-row { display: flex; justify-content: space-between; gap: 18px; padding: 4px 0; color: #777; font-size: 16px; line-height: 1.2; }
  .email-card .nf-email-total-row > span:last-child { color: #555; font-weight: 600; text-align: right; white-space: nowrap; }
  .email-card .nf-email-total-row.is-strong { color: #777; font-size: 16px; font-weight: 400; line-height: 1.25; }
  .email-card .nf-email-total-row.is-strong > span:last-child { color: #555; font-size: 20px; font-weight: 600; }
  .email-card .nf-email-total-paid .nf-email-total-row.is-strong > span:last-child { font-size: 16px; }
  .email-card .nf-email-discount-code { display: flex; align-items: center; gap: 6px; padding: 4px 0 6px 6px; color: #777; font-size: 14px; line-height: 1.35; }
  .email-card .nf-email-discount-code img { display: block; width: 18px; height: 18px; flex: none; }
  .email-card .nf-email-total-row > span:last-child { display: inline-flex; align-items: baseline; justify-content: flex-end; gap: 10px; }
  .email-card .nf-email-total-row .nf-email-shipping-original { color: #777; font-weight: 400; text-decoration: line-through; }
  .email-card .nf-email-total-row strong { color: #555; font-weight: 600; }
  .email-card .nf-email-total-divider { width: 60%; margin: 20px 0 0 auto; padding-top: 20px; border-top: 1px solid #dedede; }
  .email-card .nf-email-total-paid { margin-top: 14px; }
  .email-card .nf-email-total-discount { margin: 10px 0 0; color: #777; font-size: 16px; line-height: 1.1; text-align: right; }
  .email-card .nf-email-refund-payments { width: 60%; margin: 20px 0 0 auto; padding-top: 18px; border-top: 1px solid #dedede; }
  .email-card .nf-email-refund-payment-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding: 5px 0; color: #737373; font-size: 14px; line-height: 1.45; }
  .email-card .nf-email-refund-payment-row span, .email-card .nf-email-refund-payment-row small { display: block; }
  .email-card .nf-email-refund-payment-row small { margin-top: 1px; color: #8b8b8b; font-size: 12px; }
  .email-card .nf-email-refund-payment-row strong { color: #545454; font-size: 14px; font-weight: 600; white-space: nowrap; }
  .email-card .nf-email-invoice { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin: 0; padding: 22px 0; border-bottom: 1px solid #e6e6e6; }
  .email-card .nf-email-customer-grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 36px; row-gap: 26px; }
  .email-card .nf-email-info-block { min-width: 0; }
  .email-card .nf-email-info-title { margin: 0 0 5px; color: #555; font-size: 16px; font-weight: 500; line-height: 1.2; }
  .email-card .nf-email-invoice-meta, .email-card .nf-email-info-value { color: #777; font-size: 16px; line-height: 1.5; }
  .email-card .nf-email-invoice a { font-size: 14px; font-weight: 500; text-decoration: none; white-space: nowrap; }
  .email-card .nf-email-payment-brand { display: inline-block; margin-right: 7px; padding: 1px 4px; border: 1px solid #dedede; border-radius: 2px; color: #2457a6; font-size: 10px; font-weight: 700; line-height: 1.2; vertical-align: 1px; }
  .email-card .nf-email-footer { margin-top: 36px; border-top: 1px solid #e6e6e6; color: #737373; font-size: 13px; line-height: 1.6; text-align: center; }
  .email-card.is-refund .nf-email-footer { margin-top: 20px; }
  .email-card.is-verification .nf-email-header .nf-email-inner { justify-content: center; padding: 44px 40px 30px; }
  .email-card.is-verification .nf-email-shop-name { font-size: 30px; font-weight: 600; letter-spacing: .12em; }
  .email-card.is-verification .nf-email-body { padding: 0 40px; }
  .email-card .nf-verification-code { margin: 0; padding: 14px 0 6px; color: #000; text-align: center; }
  .email-card .nf-verification-label { margin: 0; font-size: 16px; line-height: 1.5; }
  .email-card .nf-verification-value { margin: 9px 0 0; padding-left: .24em; color: #000; font-size: 23px; font-weight: 600; letter-spacing: .24em; line-height: 1.3; }
  .email-card .nf-verification-note { margin: 15px 0 0; color: #111; font-size: 14px; line-height: 1.5; }
  .email-card.is-verification .nf-email-footer { margin-top: 34px; border-top: 0; color: #777; font-size: 12px; }
  .email-card.is-verification .nf-email-footer .nf-email-inner { padding: 0 40px 32px; }
  .email-card.is-shipment .nf-email-section-inner { padding-bottom: 24px; }
  .email-card.is-shipment .nf-email-footer { margin-top: 24px; }
  .email-card .nf-email-footer a { text-decoration: none; }
  .email-card.is-mobile .nf-email-inner, .email-card.is-mobile .nf-email-body, .email-card.is-mobile .nf-email-section-inner { padding-left: 24px; padding-right: 24px; }
  .email-card.is-mobile .nf-email-section { margin-left: -24px; margin-right: -24px; }
  .email-card.is-mobile .nf-email-totals, .email-card.is-mobile .nf-email-total-divider, .email-card.is-mobile .nf-email-refund-payments { width: 100%; }
  .email-card.is-mobile .nf-email-header .nf-email-inner { gap: 12px; }
  .email-card.is-mobile.is-verification .nf-email-header .nf-email-inner { padding: 34px 24px 24px; }
  .email-card.is-mobile.is-verification .nf-email-body { padding: 0 24px; }
  .email-card.is-mobile .nf-email-shop-name { font-size: 18px; }
  .email-card.is-mobile .nf-email-product-row { display: grid; grid-template-columns: 48px minmax(0, 1fr) auto; column-gap: 10px; row-gap: 4px; align-items: start; }
  .email-card.is-mobile .nf-email-product-image { grid-column: 1; grid-row: 1 / -1; align-self: start; width: 48px; height: 48px; }
  .email-card.is-mobile .nf-email-product-copy { display: contents; }
  .email-card.is-mobile .nf-email-product-head { grid-column: 2; grid-row: 1; min-width: 0; }
  .email-card.is-mobile .nf-email-product-price { grid-column: 3; grid-row: 1; }
  .email-card.is-mobile .nf-email-product-details { grid-column: 2 / -1; min-width: 0; }
  .email-card.is-mobile .nf-email-product-details > :first-child { margin-top: 0; }
  .email-card.is-mobile .nf-email-product-title { overflow-wrap: break-word; word-break: normal; }
  .email-card.is-mobile .nf-email-subscription { flex-wrap: wrap; white-space: normal; }
  .email-card.is-mobile .nf-email-product-discount { align-items: flex-start; font-size: 13px; }
  .email-card.is-mobile .nf-email-product-discount span { white-space: normal; overflow-wrap: break-word; word-break: normal; }
  .email-card.is-mobile .nf-email-bundle-component { padding-left: 0; gap: 8px; }
  .email-card.is-mobile .nf-email-bundle-component-image { width: 32px; height: 32px; }
  .email-card.is-mobile .nf-email-bundle-component-name { display: block; }
  .email-card.is-mobile .nf-email-included { display: inline-block; margin: 0 6px 0 0; }
  .email-card.is-mobile .nf-email-bundle-component-title { white-space: normal; overflow-wrap: break-word; }
  .email-card.is-mobile .nf-email-customer-grid { grid-template-columns: 1fr 1fr; column-gap: 16px; row-gap: 18px; }
  .email-card.is-mobile .nf-email-info-block:nth-child(1),
  .email-card.is-mobile .nf-email-info-block:nth-child(2) { grid-column: 1 / -1; }
  .email-card.is-mobile .nf-email-info-title { font-size: 15px; }
  .email-card.is-mobile .nf-email-info-value { font-size: 15px; line-height: 1.45; }
  .nf-unktag { background: #fff4d6; color: #92660a; border-radius: 4px; padding: 0 4px; font-size: .92em; }

  `;

  function inboxSettings() {
    if (!window.DATA_INBOX) window.DATA_INBOX = {};
    if (!window.DATA_INBOX.settings) {
      window.DATA_INBOX.settings = {
        chat_enabled: true,
        greeting: 'Hi, how can we help?',
        offline_message: "We're away right now. Leave a message and we'll get back to you.",
        hours_enabled: true,
        weekly_hours: {
          mon: { on: true, start: '09:00', end: '17:00' },
          tue: { on: true, start: '09:00', end: '17:00' },
          wed: { on: true, start: '09:00', end: '17:00' },
          thu: { on: true, start: '09:00', end: '17:00' },
          fri: { on: true, start: '09:00', end: '17:00' },
          sat: { on: false, start: '09:00', end: '17:00' },
          sun: { on: false, start: '09:00', end: '17:00' },
        },
        timezone: 'GMT-04:00',
        reply_eta: 'Usually replies within a few hours',
        widget_position: 'bottom_right',
        widget_label: 'Chat',
        new_conversation_email: true,
        merchant_notify_email: 'hello@lovocross.com',
      };
    }
    return window.DATA_INBOX.settings;
  }

  const INBOX_DAYS = [
    ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'],
    ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday'],
  ];

  function renderInboxSettings() {
    const s = inboxSettings();
    const dayRows = INBOX_DAYS.map(([key, label]) => {
      const d = s.weekly_hours[key];
      return '<div class="flex items-center gap-3" data-ibx-day="' + key + '" style="margin-bottom:8px">' +
        '<span class="text-sm" style="min-width:90px;font-weight:600">' + label + '</span>' +
        toggle(d.on, label, 'ibx-day-' + key) +
        '<input class="input" type="time" data-ibx-start value="' + esc(d.start) + '" style="width:120px"' + (d.on ? '' : ' disabled') + '>' +
        '<span class="muted">to</span>' +
        '<input class="input" type="time" data-ibx-end value="' + esc(d.end) + '" style="width:120px"' + (d.on ? '' : ' disabled') + '>' +
        '<div class="muted" data-ibx-day-err style="color:#c2410c;font-size:12px;display:none"></div></div>';
    }).join('');

    paint(
      '<div class="page-title mb-4">Inbox</div>' +
      '<div class="panel card-pad mb-4">' + sectionTitle('Online store chat', 'Show a chat bubble on the storefront so customers can message your team.') +
        '<div class="mt-4 flex flex-col gap-4">' +
          block('<div class="flex items-center justify-between"><div><div class="text-sm" style="font-weight:600">Online store chat</div><div class="muted" style="font-size:12.5px;margin-top:4px">Turning this off hides the bubble. Existing conversations stay in Inbox.</div></div>' + toggle(s.chat_enabled, 'Online store chat', 'ibx-chat') + '</div>') +
          block('<div class="text-sm" style="font-weight:600;margin-bottom:6px">Greeting</div><input class="input" id="ibx-greeting" maxlength="280" style="width:100%" value="' + esc(s.greeting) + '"><div class="muted" id="ibx-greeting-err" style="color:#c2410c;font-size:12px;display:none;margin-top:6px"></div>') +
          block('<div class="text-sm" style="font-weight:600;margin-bottom:6px">Offline message</div><input class="input" id="ibx-offline" maxlength="280" style="width:100%" value="' + esc(s.offline_message) + '"><div class="muted" id="ibx-offline-err" style="color:#c2410c;font-size:12px;display:none;margin-top:6px"></div>') +
        '</div></div>' +
      '<div class="panel card-pad mb-4">' + sectionTitle('Support hours', 'Hours use the store timezone.') +
        '<div class="mt-4 flex flex-col gap-4">' +
          block('<div class="flex items-center justify-between"><div><div class="text-sm" style="font-weight:600">Support hours</div><div class="muted" style="font-size:12.5px;margin-top:4px">Off means the team is treated as available 24/7.</div></div>' + toggle(s.hours_enabled, 'Support hours', 'ibx-hours') + '</div>') +
          '<div id="ibx-hours-wrap"' + (s.hours_enabled ? '' : ' style="display:none"') + '>' + block(dayRows + '<div class="muted" style="font-size:12.5px;margin-top:8px">Hours use the store timezone. ' + esc(s.timezone) + '</div>') + '</div>' +
          block('<div class="text-sm" style="font-weight:600;margin-bottom:6px">Typical reply time</div><input class="input" id="ibx-eta" maxlength="80" style="width:100%" value="' + esc(s.reply_eta || '') + '"><div class="muted" id="ibx-eta-err" style="color:#c2410c;font-size:12px;display:none;margin-top:6px"></div>') +
        '</div></div>' +
      '<div class="panel card-pad mb-4">' + sectionTitle('Widget') +
        '<div class="mt-4 flex flex-col gap-4">' +
          block('<div class="text-sm" style="font-weight:600;margin-bottom:8px">Widget position</div>' +
            '<label class="set-radio' + (s.widget_position === 'bottom_right' ? ' on' : '') + '" data-ibx-pos="bottom_right"><span class="proc-radio">' + (s.widget_position === 'bottom_right' ? '<span class="proc-dot"></span>' : '') + '</span> Bottom right</label>' +
            '<label class="set-radio' + (s.widget_position === 'bottom_left' ? ' on' : '') + '" data-ibx-pos="bottom_left" style="margin-left:16px"><span class="proc-radio">' + (s.widget_position === 'bottom_left' ? '<span class="proc-dot"></span>' : '') + '</span> Bottom left</label>') +
          block('<div class="text-sm" style="font-weight:600;margin-bottom:6px">Widget label</div><input class="input" id="ibx-label" maxlength="20" style="width:240px" value="' + esc(s.widget_label) + '"><div class="muted" id="ibx-label-err" style="color:#c2410c;font-size:12px;display:none;margin-top:6px"></div>') +
        '</div></div>' +
      '<div class="panel card-pad mb-4">' + sectionTitle('Notifications') +
        '<div class="mt-4">' +
          block('<div class="flex items-center justify-between mb-3"><div><div class="text-sm" style="font-weight:600">Email me about new conversations</div></div>' + toggle(s.new_conversation_email, 'Email me about new conversations', 'ibx-notify') + '</div>' +
            '<div id="ibx-mail-wrap"' + (s.new_conversation_email ? '' : ' style="display:none"') + '>' +
            '<div class="text-sm" style="font-weight:600;margin-bottom:6px">Notification email</div>' +
            '<input class="input" id="ibx-mail" style="width:100%" value="' + esc(s.merchant_notify_email) + '">' +
            '<div class="muted" id="ibx-mail-err" style="color:#c2410c;font-size:12px;display:none;margin-top:6px"></div></div>') +
        '</div></div>',
      true
    );

    const chatSw = root.querySelector('[data-toggle="ibx-chat"]');
    const hoursSw = root.querySelector('[data-toggle="ibx-hours"]');
    const notifySw = root.querySelector('[data-toggle="ibx-notify"]');
    if (chatSw) chatSw.onclick = () => { chatSw.classList.toggle('on'); s.chat_enabled = chatSw.classList.contains('on'); };
    if (hoursSw) hoursSw.onclick = () => {
      hoursSw.classList.toggle('on');
      s.hours_enabled = hoursSw.classList.contains('on');
      const wrap = root.querySelector('#ibx-hours-wrap');
      if (wrap) wrap.style.display = s.hours_enabled ? '' : 'none';
    };
    if (notifySw) notifySw.onclick = () => {
      notifySw.classList.toggle('on');
      s.new_conversation_email = notifySw.classList.contains('on');
      const wrap = root.querySelector('#ibx-mail-wrap');
      if (wrap) wrap.style.display = s.new_conversation_email ? '' : 'none';
    };
    root.querySelectorAll('[data-ibx-day]').forEach((row) => {
      const key = row.getAttribute('data-ibx-day');
      const sw = row.querySelector('[data-toggle]');
      if (sw) sw.onclick = () => {
        sw.classList.toggle('on');
        s.weekly_hours[key].on = sw.classList.contains('on');
        row.querySelectorAll('input[type="time"]').forEach((inp) => { inp.disabled = !s.weekly_hours[key].on; });
      };
      const start = row.querySelector('[data-ibx-start]');
      const end = row.querySelector('[data-ibx-end]');
      const err = row.querySelector('[data-ibx-day-err]');
      function check() {
        s.weekly_hours[key].start = start.value;
        s.weekly_hours[key].end = end.value;
        if (s.weekly_hours[key].on && end.value <= start.value) {
          err.style.display = 'block'; err.textContent = 'End time must be after start time.';
        } else { err.style.display = 'none'; }
      }
      if (start) start.onchange = check;
      if (end) end.onchange = check;
    });
    root.querySelectorAll('[data-ibx-pos]').forEach((el) => el.onclick = () => {
      root.querySelectorAll('[data-ibx-pos]').forEach((x) => { x.classList.remove('on'); const d = x.querySelector('.proc-radio'); if (d) d.innerHTML = ''; });
      el.classList.add('on');
      el.querySelector('.proc-radio').innerHTML = '<span class="proc-dot"></span>';
      s.widget_position = el.getAttribute('data-ibx-pos');
    });
    const greeting = root.querySelector('#ibx-greeting');
    const offline = root.querySelector('#ibx-offline');
    const label = root.querySelector('#ibx-label');
    const mail = root.querySelector('#ibx-mail');
    const eta = root.querySelector('#ibx-eta');
    if (greeting) greeting.oninput = () => { s.greeting = greeting.value; };
    if (offline) offline.oninput = () => { s.offline_message = offline.value; };
    if (label) label.oninput = () => { s.widget_label = label.value; };
    if (mail) mail.oninput = () => { s.merchant_notify_email = mail.value; };
    if (eta) eta.oninput = () => { s.reply_eta = eta.value; };

    window.InboxSettingsSave = function () {
      const gErr = root.querySelector('#ibx-greeting-err');
      const oErr = root.querySelector('#ibx-offline-err');
      const lErr = root.querySelector('#ibx-label-err');
      const mErr = root.querySelector('#ibx-mail-err');
      const eErr = root.querySelector('#ibx-eta-err');
      let blocked = false;
      const g = ((greeting && greeting.value) || '').trim();
      const o = ((offline && offline.value) || '').trim();
      const e = ((eta && eta.value) || '').trim();
      if (!g) { gErr.style.display = 'block'; gErr.textContent = 'Enter a greeting message.'; blocked = true; } else if (g.length > 280) { gErr.style.display = 'block'; gErr.textContent = 'Greeting must be 280 characters or fewer.'; blocked = true; } else gErr.style.display = 'none';
      if (!o) { oErr.style.display = 'block'; oErr.textContent = 'Enter an offline message.'; blocked = true; } else if (o.length > 280) { oErr.style.display = 'block'; oErr.textContent = 'Offline message must be 280 characters or fewer.'; blocked = true; } else oErr.style.display = 'none';
      if (!e) { eErr.style.display = 'block'; eErr.textContent = 'Enter a typical reply time.'; blocked = true; } else if (e.length > 80) { eErr.style.display = 'block'; eErr.textContent = 'Typical reply time must be 80 characters or fewer.'; blocked = true; } else if (eErr) eErr.style.display = 'none';
      if (((label && label.value) || '').trim().length > 20) { lErr.style.display = 'block'; lErr.textContent = 'Button label must be 20 characters or fewer.'; blocked = true; } else if (lErr) lErr.style.display = 'none';
      if (s.new_conversation_email) {
        const em = ((mail && mail.value) || '').trim();
        if (!em) { mErr.style.display = 'block'; mErr.textContent = 'Enter a notification email.'; blocked = true; }
        else if (em.indexOf('@') < 1 || !em.split('@')[1]) { mErr.style.display = 'block'; mErr.textContent = 'Enter a valid email address.'; blocked = true; }
        else mErr.style.display = 'none';
      }
      root.querySelectorAll('[data-ibx-day]').forEach((row) => {
        const key = row.getAttribute('data-ibx-day');
        const d = s.weekly_hours[key];
        const err = row.querySelector('[data-ibx-day-err]');
        if (s.hours_enabled && d.on && d.end <= d.start) { err.style.display = 'block'; err.textContent = 'End time must be after start time.'; blocked = true; }
      });
      if (blocked) return false;
      s.greeting = g;
      s.offline_message = o;
      s.reply_eta = e;
      s.widget_label = ((label && label.value) || '').trim() || 'Chat';
      toast('Inbox settings saved.');
      return true;
    };
  }

  const ROUTES = {
    notifications: renderNotifications,
    inbox: renderInboxSettings,
    base: renderBase,
    domains: renderDomains,
    payments: renderPayments,
    currency: renderCurrency,
    checkout: renderCheckout,
    metafields: renderMetafields,
    'shippable-locations': renderLocations,
    'shipping-rates': renderRates,
    roles: renderRoles,
    staff: renderStaff,
  };

  let curRest = '';
  // settings dirty bar: any edit in the content flips the shell header to "You have unsaved changes"
  function wireDirty() {
    if (!root || root.__dirtyWired) return;
    root.__dirtyWired = true;
    const onEdit = () => {
      if (!window.SettingsChrome) return;
      window.SettingsChrome.setDirty(true, {
        onDiscard: () => { show(curRest); if (window.SettingsChrome) window.SettingsChrome.setDirty(false); },
        onUpdate: () => {
          if (typeof window.InboxSettingsSave === 'function' && curRest.split('/')[0] === 'inbox') {
            if (!window.InboxSettingsSave()) return;
            if (window.SettingsChrome) window.SettingsChrome.setDirty(false);
            return;
          }
          toast('Updated successfully'); if (window.SettingsChrome) window.SettingsChrome.setDirty(false);
        },
      });
    };
    root.addEventListener('input', onEdit);
    root.addEventListener('change', onEdit);
  }
  function show(rest) {
    curRest = rest || '';
    const parts = String(rest || '').split('/').filter(Boolean);
    const key = ROUTES[parts[0]] ? parts[0] : 'base';
    const sub = parts[1];
    // reset / seed drill-down sub-states for the active sub-page
    mfResource = (key === 'metafields' && sub) ? decodeURIComponent(sub) : null;
    mfAdding = false;
    rateProfile = (key === 'shipping-rates' && sub != null && sub !== '')
      ? (sub === 'new' ? 'new' : Number(decodeURIComponent(sub))) : null;
    domainStep = (key === 'domains' && sub) ? sub : null;
    notifSub = (key === 'notifications' && sub != null && sub !== '') ? decodeURIComponent(sub) : null;
    notifEditorMode = key === 'notifications' && notifSub && parts[2] === 'edit' ? 'code' : 'preview';
    if (key !== 'inbox') window.InboxSettingsSave = null;
    ROUTES[key]();
    wireDirty();
    if (root && root.parentElement) root.parentElement.scrollTop = 0;
  }

  // ===========================================================================
  // page-scoped styles (Settings-only widgets layered on top of theme.css)
  // ===========================================================================
  const STYLES = `
  /* centered forms mirror the real admin's w-[860px] pages */
  .set-narrow { width: 860px; max-width: 100%; margin: 0 auto; }

  /* switch */
  .set-switch { display: inline-flex; align-items: center; width: 40px; height: 22px; border-radius: 9999px; background: var(--ctl); cursor: pointer; transition: background .15s; flex: none; padding: 2px; }
  .set-switch.on { background: var(--brand); }
  .set-knob { width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .15s; box-shadow: 0 1px 2px rgb(0 0 0 / 20%); }
  .set-switch.on .set-knob { transform: translateX(18px); }

  /* upload tile */
  .up-tile { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 104px; height: 104px; border: 1px dashed var(--ctl); border-radius: 8px; background: var(--panel); color: var(--ink-muted); cursor: pointer; }
  .up-tile:hover { border-color: var(--brand); color: var(--brand); }
  .up-plus { display: inline-flex; }
  .up-add { font-size: 11.5px; }
  .up-tile.filled { border-style: solid; background: #fff; position: relative; color: var(--ink-body); }
  .up-ico { color: var(--brand); }
  .up-name { font-size: 10.5px; max-width: 88px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .up-x { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 6px; border: none; background: rgba(0,0,0,.45); color: #fff; display: grid; place-items: center; cursor: pointer; }

  /* input addon (suffix/prefix) */
  .set-addon { display: inline-flex; align-items: stretch; }
  .set-addon .input { border-radius: var(--radius); }
  .set-addon-suffix, .set-addon-prefix { display: inline-flex; align-items: center; padding: 0 12px; border: 1px solid var(--ctl); background: var(--panel); font-size: 13px; color: var(--ink-body); }
  .set-addon-suffix { border-left: none; border-top-right-radius: var(--radius); border-bottom-right-radius: var(--radius); }
  .set-addon-prefix { border-right: none; border-top-left-radius: var(--radius); border-bottom-left-radius: var(--radius); }

  .set-range { flex: 1; accent-color: var(--brand); height: 4px; }

  /* note / banner box — borderless grey (mirrors reference rounded-md bg-[#f7f8fa]) */
  .set-note { background: #f7f8fb; border-radius: 8px; padding: 16px; }

  /* multi-select tag box (Add font modal — Ant Select mode=multiple look) */
  .ms-box { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-height: 36px; padding: 4px 8px; border: 1px solid var(--ctl); border-radius: 8px; background: #fff; cursor: text; }
  .ms-box:focus-within { border-color: var(--brand); }
  .ms-tag { display: inline-flex; align-items: center; gap: 6px; background: #f0f1f3; border-radius: 4px; padding: 2px 6px 2px 8px; font-size: 13px; color: var(--ink); }
  .ms-x { display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink-muted); font-size: 14px; line-height: 1; }
  .ms-x:hover { color: var(--ink); }
  .ms-input { flex: 1; min-width: 60px; border: none; outline: none; background: transparent; font-size: 13px; height: 26px; color: var(--ink); }

  /* payments — processor logo + soft icon box (mirrors render.tsx + global .b-c) */
  .prov-block { margin-bottom: 24px; }
  .prov-block:last-child { margin-bottom: 0; }
  .prov-logo { display: flex; align-items: center; margin-bottom: 16px; }
  .prov-logo img { display: block; width: auto; object-fit: contain; }

  .pay-bc { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #f7f8fb; border-radius: 8px 8px 0 0; padding: 16px; }
  .pay-icons { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
  .pay-ico { height: 24px; width: auto; object-fit: contain; display: block; }
  .proc-radio { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--ctl); display: inline-grid; place-items: center; flex: none; }
  .set-radio.on .proc-radio, .set-radio2.on .proc-radio { border-color: var(--brand); }
  .proc-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand); }
  .set-radio { display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--ink-body); cursor: pointer; }
  .set-radio2 { display: flex; align-items: flex-start; gap: 8px; font-size: 13.5px; color: var(--ink-body); cursor: pointer; padding: 8px 10px; border: 1px solid var(--hair); border-radius: 8px; }
  .set-radio2.on { border-color: var(--brand); background: #e6f0ff; }

  /* currency flag chip */
  .ccy-flag { display: inline-grid; place-items: center; width: 22px; height: 16px; border-radius: 3px; background: var(--panel); border: 1px solid var(--hair); font-size: 9px; font-weight: 700; color: var(--ink-muted); letter-spacing: -.02em; }

  /* metafields */
  .mf-res { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 14px; border: 1px solid var(--hair); border-radius: 10px; background: var(--panel); cursor: pointer; }
  .mf-res:hover { background: #f1f3f8; }
  .mf-res-ico { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 8px; background: #fff; border: 1px solid var(--hair); color: var(--ink-muted); flex: none; font-size: 11px; font-weight: 600; }
  .mf-grip { cursor: move; color: var(--ink-muted); display: inline-flex; }
  .mf-type-ico { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 5px; border: 1px solid var(--hair); color: var(--ink-muted); flex: none; }
  .mf-blank-ico { display: grid; place-items: center; width: 72px; height: 72px; border-radius: 50%; background: #e6f0ff; color: var(--brand); }

  /* icon button (table row actions / dropdown trigger) */
  .set-icon-btn { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 7px; border: none; background: transparent; color: var(--ink-muted); cursor: pointer; }
  .set-icon-btn:hover { background: var(--panel); color: var(--ink); }
  .set-icon-btn.danger:hover { color: var(--err); }

  /* shippable locations table */
  .loc-table tbody tr { cursor: default; }
  .loc-caret { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; padding: 0; border: none; background: transparent; cursor: pointer; color: var(--ink-muted); transition: transform .15s; flex: none; }
  .loc-caret.open { transform: rotate(90deg); }

  /* dropdown row menu */
  .row-menu { position: absolute; z-index: 95; min-width: 120px; background: #fff; border: 1px solid var(--hair); border-radius: 8px; box-shadow: var(--float-shadow); padding: 4px; }
  .row-menu-item { display: block; width: 100%; text-align: left; padding: 7px 10px; border: none; background: transparent; font-size: 13px; color: var(--ink-body); border-radius: 6px; cursor: pointer; }
  .row-menu-item:hover { background: var(--panel); }
  .row-menu-item.danger { color: var(--err); }

  /* shipping rates */
  .rate-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border: 1px solid var(--hair); border-radius: 10px; background: var(--panel); cursor: pointer; }
  .rate-row:hover { background: #f1f3f8; }
  .rate-ico { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; background: #fff; border: 1px solid var(--hair); color: var(--ink-muted); flex: none; }
  .zone-block { border: 1px solid var(--hair); border-radius: 12px; padding: 14px 16px; }
  .zone-ico { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 7px; background: #e6f0ff; color: var(--brand); flex: none; }
  .rate-list { border: 1px solid var(--hair); border-radius: 8px; overflow: hidden; }
  .rate-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #fff; border-bottom: 1px solid var(--hair); }
  .rate-item:last-child { border-bottom: none; }
  .rate-empty { border: 1px solid var(--hair); border-radius: 8px; background: var(--panel); padding: 16px; text-align: center; }
  .rate-free { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 6px; background: var(--ok-bg); color: #00684a; font-size: 12px; font-weight: 600; }
  .rate-price { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 6px; background: #e6f0ff; color: #0058c4; font-size: 12px; font-weight: 600; }
  .prod-thumb { display: inline-grid; place-items: center; width: 36px; height: 36px; border-radius: 6px; background: var(--panel); border: 1px solid var(--hair); color: var(--ink-muted); font-size: 10px; flex: none; }

  /* checkout preview (rate modal) */
  .checkout-preview { background: var(--panel); border-radius: 8px; padding: 14px; }
  .checkout-preview-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; background: #fff; border: 1px solid var(--hair); border-radius: 8px; padding: 10px 14px; }

  /* zone region picker */
  .zone-region-pick { max-height: 220px; overflow: auto; border: 1px solid var(--hair); border-radius: 8px; padding: 8px 12px; }

  /* preview modal frame */
  .preview-frame { display: grid; place-items: center; border: 1px solid var(--hair); border-radius: 10px; background: var(--panel); }
  `;

  // ---- SPA registration (the shell drives render + renders the sidebar) ----
  window.VIEWS = window.VIEWS || {};
  window.VIEWS.settings = { render: function (el, rest) { root = el; show(rest || 'base'); } };
})();
