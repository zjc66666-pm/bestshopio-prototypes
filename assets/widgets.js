/* BestVoy Admin prototype — shared UI widgets (mirrors antd Select + RangePicker look).
   Loaded globally after shell.js. Two enhancers run automatically over the SPA:
     1. Native <select class="filter-select|pg-size"> -> antd-style custom dropdown.
        The native <select> stays in the DOM (hidden) so every existing `.value`
        read and `onchange` handler keeps working unchanged; picking an option just
        writes the value back and dispatches a native `change` event.
     2. <div data-ui-range> wrapping hidden #start/#end inputs -> English dual-month
        range popover. On commit it writes both inputs then fires ONE `change` on the
        end input (consumers read both on that event => single re-render).
   A MutationObserver re-applies both after each SPA re-render (idempotent via data-ui). */
(function () {
  'use strict';

  var CHEV = '<svg class="ui-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
  var CAL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseYmd(s) { if (!s) return null; var p = String(s).split('-'); if (p.length < 3) return null; var d = new Date(+p[0], +p[1] - 1, +p[2]); return isNaN(d) ? null : d; }
  function strip(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }

  // ---------- shared popover layer ----------
  var openLayer = null;
  function closePop() {
    if (!openLayer) return;
    var l = openLayer; openLayer = null;
    document.removeEventListener('mousedown', l._out, true);
    window.removeEventListener('resize', l._close, true);
    window.removeEventListener('scroll', l._close, true);
    if (l.parentNode) l.parentNode.removeChild(l);
  }
  function openPop(anchor, panel, opts) {
    closePop();
    opts = opts || {};
    var layer = document.createElement('div');
    layer.className = 'pop-layer';
    panel.classList.add('menu-pop');
    layer.appendChild(panel);
    document.body.appendChild(layer);
    var r = anchor.getBoundingClientRect();
    var pw = panel.offsetWidth, ph = panel.offsetHeight;
    var left = r.left, top = r.bottom + 6;
    if (opts.align === 'right') left = r.right - pw;
    if (left + pw > window.innerWidth - 8) left = window.innerWidth - 8 - pw;
    if (left < 8) left = 8;
    if (top + ph > window.innerHeight - 8) top = Math.max(8, r.top - 6 - ph); // flip up
    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
    layer._close = closePop;
    layer._out = function (e) { if (!panel.contains(e.target) && !anchor.contains(e.target)) closePop(); };
    setTimeout(function () { document.addEventListener('mousedown', layer._out, true); }, 0);
    window.addEventListener('resize', layer._close, true);
    window.addEventListener('scroll', layer._close, true);
    openLayer = layer;
    return layer;
  }

  // ---------- 1. custom select ----------
  function enhanceSelect(sel) {
    sel.setAttribute('data-ui', '1');
    var btn = document.createElement('div');
    btn.className = 'ui-select ' + sel.className.replace('data-ui', '');
    var cs = sel.getAttribute('style');
    if (cs) btn.setAttribute('style', cs);
    var label = document.createElement('span');
    label.className = 'ui-select-label';
    btn.appendChild(label);
    btn.insertAdjacentHTML('beforeend', CHEV);
    function curText() { var o = sel.options[sel.selectedIndex]; return o ? o.textContent : ''; }
    function sync() { label.textContent = curText(); }
    sync();
    sel.style.display = 'none';
    sel.parentNode.insertBefore(btn, sel);

    btn.onclick = function () {
      if (openLayer && openLayer._owner === btn) { closePop(); return; }
      var panel = document.createElement('div');
      panel.className = 'ui-select-pop';
      panel.style.minWidth = Math.max(btn.offsetWidth, 160) + 'px';
      Array.prototype.forEach.call(sel.options, function (o, i) {
        var opt = document.createElement('div');
        opt.className = 'opt' + (i === sel.selectedIndex ? ' sel' : '');
        opt.textContent = o.textContent;
        opt.onclick = function () {
          if (sel.selectedIndex !== i) {
            sel.selectedIndex = i;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          }
          sync();
          closePop();
        };
        panel.appendChild(opt);
      });
      var l = openPop(btn, panel);
      l._owner = btn;
    };
    // keep label fresh if some code sets value programmatically
    sel.addEventListener('change', sync);
  }

  // ---------- 2. dual-month range picker ----------
  function enhanceRange(box) {
    box.setAttribute('data-ui', '1');
    var inputs = box.querySelectorAll('input[type="hidden"], input[data-range]');
    var startEl = box.querySelector('[data-range="start"]') || inputs[0];
    var endEl = box.querySelector('[data-range="end"]') || inputs[1];
    var ph = box.getAttribute('data-ph') || 'Start date → End date';

    var text = document.createElement('span');
    text.className = 'ui-range-text';
    box.insertBefore(text, box.firstChild);
    box.insertAdjacentHTML('beforeend', '<span class="ui-range-ico">' + CAL + '</span>');

    function refresh() {
      var s = startEl && startEl.value, e = endEl && endEl.value;
      if (s && e) { text.textContent = s + '  →  ' + e; text.classList.remove('muted'); }
      else { text.textContent = ph; text.classList.add('muted'); }
    }
    refresh();

    box.onclick = function () {
      if (openLayer && openLayer._owner === box) { closePop(); return; }
      var start = parseYmd(startEl && startEl.value);
      var end = parseYmd(endEl && endEl.value);
      var today = strip(new Date());
      var view = new Date((start || today).getFullYear(), (start || today).getMonth(), 1);

      var panel = document.createElement('div');
      panel.className = 'cal-pop';

      // quick presets (relative to today) — mirrors the analytics date picker
      var PRESETS = [
        ['Today', function () { return [today, today]; }],
        ['Yesterday', function () { var d = addDays(today, -1); return [d, d]; }],
        ['Last 7 days', function () { return [addDays(today, -6), today]; }],
        ['Last 30 days', function () { return [addDays(today, -29), today]; }],
        ['Last 90 days', function () { return [addDays(today, -89), today]; }],
        ['This month', function () { return [new Date(today.getFullYear(), today.getMonth(), 1), today]; }],
        ['Last month', function () { return [new Date(today.getFullYear(), today.getMonth() - 1, 1), new Date(today.getFullYear(), today.getMonth(), 0)]; }],
      ];

      function apply() {
        if (startEl) startEl.value = start ? ymd(start) : '';
        if (endEl) { endEl.value = end ? ymd(end) : ''; endEl.dispatchEvent(new Event('change', { bubbles: true })); }
        refresh();
        closePop();
      }
      function pick(d) {
        if (!start || (start && end)) { start = d; end = null; }
        else if (d < start) { start = d; }
        else { end = d; }
        draw(); // no auto-commit — user confirms with Apply
      }
      function month(base) {
        var y = base.getFullYear(), m = base.getMonth();
        var gridStart = new Date(y, m, 1 - new Date(y, m, 1).getDay());
        var cells = '';
        for (var i = 0; i < 42; i++) {
          var d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
          var cls = 'cal-cell';
          if (d.getMonth() !== m) cls += ' out';
          if (sameDay(d, today)) cls += ' today';
          if (start && end && d > start && d < end) cls += ' in';
          if (sameDay(d, start)) cls += ' sel start';
          if (sameDay(d, end)) cls += ' sel end';
          cells += '<div class="' + cls + '" data-d="' + ymd(d) + '">' + d.getDate() + '</div>';
        }
        return { title: MONTHS[m] + ' ' + y, cells: cells };
      }
      function draw() {
        var L = month(view), R = month(addMonths(view, 1));
        var wk = WK.map(function (w) { return '<span>' + w + '</span>'; }).join('');
        var presets = PRESETS.map(function (p, i) { return '<div class="cal-preset" data-preset="' + i + '">' + p[0] + '</div>'; }).join('');
        var selText = start ? (ymd(start) + '  →  ' + (end ? ymd(end) : '…')) : 'Select a date range';
        panel.innerHTML =
          '<div class="cal-body">' +
            '<div class="cal-presets">' + presets + '</div>' +
            '<div class="cal-wrap">' +
              '<div class="cal">' +
                '<div class="cal-hd"><button class="cal-nav" data-nav="-12">«</button><button class="cal-nav" data-nav="-1">‹</button><span class="cal-title">' + L.title + '</span><span class="cal-sp"></span></div>' +
                '<div class="cal-week">' + wk + '</div><div class="cal-grid">' + L.cells + '</div>' +
              '</div>' +
              '<div class="cal">' +
                '<div class="cal-hd"><span class="cal-sp"></span><span class="cal-title">' + R.title + '</span><button class="cal-nav" data-nav="1">›</button><button class="cal-nav" data-nav="12">»</button></div>' +
                '<div class="cal-week">' + wk + '</div><div class="cal-grid">' + R.cells + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="cal-foot">' +
            '<span class="cal-sel-text">' + selText + '</span><span style="flex:1"></span>' +
            '<button class="btn btn-default" data-cal-cancel>Cancel</button>' +
            '<button class="btn btn-primary" data-cal-apply' + (start && end ? '' : ' disabled') + '>Apply</button>' +
          '</div>';
        panel.querySelectorAll('[data-nav]').forEach(function (b) {
          b.onclick = function (e) { e.stopPropagation(); view = addMonths(view, +b.getAttribute('data-nav')); draw(); };
        });
        panel.querySelectorAll('[data-d]').forEach(function (c) {
          c.onclick = function (e) { e.stopPropagation(); pick(parseYmd(c.getAttribute('data-d'))); };
        });
        panel.querySelectorAll('[data-preset]').forEach(function (el) {
          el.onclick = function (e) { e.stopPropagation(); var r = PRESETS[+el.getAttribute('data-preset')][1](); start = r[0]; end = r[1]; view = new Date(start.getFullYear(), start.getMonth(), 1); draw(); };
        });
        panel.querySelector('[data-cal-cancel]').onclick = function (e) { e.stopPropagation(); closePop(); };
        panel.querySelector('[data-cal-apply]').onclick = function (e) { e.stopPropagation(); if (start && end) apply(); };
      }
      draw();
      var l = openPop(box, panel);
      l._owner = box;
    };
    box.addEventListener('ui-range-refresh', refresh);
  }

  // ---------- shared "Unsaved changes" bar (UnSavedChanges.tsx) ----------
  // One implementation for every edit page so they can't drift apart again. Dark,
  // full-width, fixed to the very top of the viewport (covers the 60px header) — the
  // products module / live-admin treatment. unsavedBar() returns the markup (always
  // hidden initially); setUnsavedBar() flips it on/off from a module's dirty-sync.
  var ALERT_ICO = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';
  function escAttr(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // opts: { saveLabel:'Add'|'Update'|…, saveAct:'save-bar'(default), discardAct:'discard'(default),
  //         show:false(default) }. saveAct/discardAct let a module keep its existing [data-act] wiring.
  // Default is hidden (render-once + toggle via setUnsavedBar). Modules that conditionally inject the
  // bar only when dirty pass show:true so it renders visible.
  function unsavedBar(opts) {
    opts = opts || {};
    var saveLabel = opts.saveLabel || 'Save';
    var saveAct = opts.saveAct || 'save-bar';
    var discardAct = opts.discardAct || 'discard';
    var hidden = opts.show ? '' : ' style="display:none"';
    return '<div id="unsaved-bar" class="unsaved-bar"' + hidden + '>' +
      '<div style="flex:1"></div>' +
      '<div class="flex items-center gap-2"><span style="display:inline-flex">' + ALERT_ICO + '</span>' +
        '<span style="font-size:13.5px">You have unsaved changes</span></div>' +
      '<div class="flex items-center justify-end gap-3" style="flex:1">' +
        '<button class="btn unsaved-discard" data-act="' + escAttr(discardAct) + '">Discard</button>' +
        '<button class="btn btn-primary" data-act="' + escAttr(saveAct) + '">' + escAttr(saveLabel) + '</button>' +
      '</div>' +
    '</div>';
  }
  // Toggle the bar within `scope` (an element or document). Pass the module's dirty flag.
  function setUnsavedBar(scope, dirty) {
    var host = (scope && scope.querySelector) ? scope : document;
    var bar = host.querySelector('#unsaved-bar');
    if (bar) bar.style.display = dirty ? 'flex' : 'none';
  }

  // ---------- scan + observe ----------
  // enhance filter-bar selects, page-size, and form-field selects (.input);
  // skip the rich-text toolbar (.rt-select) and anything opting out via data-no-ui.
  var SEL = 'select.filter-select, select.pg-size, select.input';
  function scan(scope) {
    var root = scope || document;
    root.querySelectorAll(SEL).forEach(function (s) {
      if (s.hasAttribute('data-ui') || s.hasAttribute('data-no-ui') || s.classList.contains('rt-select')) return;
      try { enhanceSelect(s); } catch (e) {}
    });
    root.querySelectorAll('[data-ui-range]:not([data-ui])').forEach(function (b) { try { enhanceRange(b); } catch (e) {} });
  }
  // setTimeout (not rAF) so enhancement still fires in a backgrounded/hidden tab where rAF is paused
  var pending = false;
  function schedule() { if (pending) return; pending = true; setTimeout(function () { pending = false; scan(document); }, 0); }
  function init() {
    try { scan(document); } catch (e) {}
    try { new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.UI = { scan: scan, closePop: closePop, unsavedBar: unsavedBar, setUnsavedBar: setUnsavedBar };
})();
