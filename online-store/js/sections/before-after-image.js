/* Before/after image — draggable comparison slider (no child blocks).
   A full BEFORE image with an AFTER image clipped on top; a vertical handle the buyer
   drags (pointer + touch) or clicks to reposition. Pure DOM, no external libs. */
(function () {
  const OS = window.OS;
  OS.css('beforeafter', [
    '.bax{box-sizing:border-box}.bax *{box-sizing:border-box}',
    '.bax .ba-sub{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin-bottom:8px}',
    '.bax h2{margin:0 0 12px;line-height:1.15}',
    '.bax .ba-rich{font-size:15px;line-height:1.6;opacity:.88;margin:0 auto 22px;max-width:620px}.bax .ba-rich a{color:inherit}',
    '.bax .ba-head{text-align:center}',
    '.bax .ba-frame{position:relative;overflow:hidden;width:100%;max-height:520px;aspect-ratio:16/10;user-select:none;-webkit-user-select:none;touch-action:none;cursor:ew-resize;background:#e9e9e9}',
    '.bax .ba-img{position:absolute;inset:0;width:100%;height:100%;background-size:cover;background-position:center;background-repeat:no-repeat}',
    '.bax .ba-after-wrap{position:absolute;top:0;left:0;height:100%;overflow:hidden;will-change:width}',
    '.bax .ba-after-wrap .ba-img{width:auto;left:0}',
    '.bax .ba-handle{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;transform:translateZ(0);will-change:left;pointer-events:none;z-index:3}',
    '.bax .ba-line{position:absolute;top:0;bottom:0;left:0;width:100%;background:currentColor;opacity:.95}',
    '.bax .ba-grab{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;gap:1px;background:inherit;box-shadow:0 2px 10px rgba(0,0,0,.28)}',
    '.bax .ba-grab svg{display:block;width:13px;height:13px}',
    '.bax .ba-tag{position:absolute;bottom:14px;z-index:2;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:rgba(0,0,0,.55);padding:5px 11px;border-radius:999px;pointer-events:none;backdrop-filter:blur(2px)}',
    '.bax .ba-tag.before{right:14px}.bax .ba-tag.after{left:14px}',
  ].join(''));

  const CHEVS =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

  OS.register('before-after-image', {
    name: 'Before/after image', group: 'content', icon: 'image',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
      { key: 'heading', control: 'text', label: 'Heading', default: 'See the difference' },
      { key: 'content', control: 'richtext', label: 'Content', default: '' },
      { sub: 'Images' },
      { key: 'before_image', control: 'image', label: 'Before image', default: '', required: true },
      { key: 'after_image', control: 'image', label: 'After image', default: '', required: true },
      { key: 'before_text', control: 'text', label: 'Before label', default: 'Before' },
      { key: 'after_text', control: 'text', label: 'After label', default: 'After' },
      { key: 'drag_initial_position', control: 'range', label: 'Handle start position', min: 0, max: 100, step: 1, unit: '%', default: 50 },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true, info: 'Blank inherits the theme text color.' },
      { key: 'handle_color', control: 'color', label: 'Handle', default: '#FFFFFF' },
    ],
    defaults: () => ({ before_image: OS.sample.IMG.cat3, after_image: OS.sample.IMG.cat1 }),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const bg = OS.bgOrTransparent(s.background);
      const text = OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a');
      const head = OS.col(s.text, (t.colors && t.colors.heading_color) || '#1a1a1a');
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const rad = OS.layoutRadius(t, 'image');
      const pos = OS.clamp(s.drag_initial_position, 0, 100, 50);
      const handleCol = OS.col(s.handle_color, '#FFFFFF') || '#FFFFFF';
      const before = OS.esc(s.before_image || OS.sample.IMG.cat3);
      const after = OS.esc(s.after_image || OS.sample.IMG.cat1);

      const header =
        (s.subheading ? '<div class="ba-sub">' + OS.esc(s.subheading) + '</div>' : '') +
        (s.heading ? '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 26 : 34) + 'px;color:' + head + '">' + OS.esc(s.heading) + '</h2>' : '') +
        (s.content ? '<div class="ba-rich">' + s.content + '</div>' : '');
      const headBlock = (s.subheading || s.heading || s.content) ? '<div class="ba-head">' + header + '</div>' : '';

      // BEFORE fills the frame; AFTER sits in a wrapper clipped to `pos`% width,
      // its inner image kept at the frame's full pixel width so it never squashes.
      const frame =
        '<div class="ba-frame" style="border-radius:' + rad + 'px;color:' + handleCol + '">' +
          '<div class="ba-img ba-before" style="background-image:url(' + before + ')"></div>' +
          '<div class="ba-after-wrap" style="width:' + pos + '%"><div class="ba-img ba-after" style="background-image:url(' + after + ')"></div></div>' +
          (s.after_text ? '<span class="ba-tag after">' + OS.esc(s.after_text) + '</span>' : '') +
          (s.before_text ? '<span class="ba-tag before">' + OS.esc(s.before_text) + '</span>' : '') +
          '<div class="ba-handle" style="left:' + pos + '%"><span class="ba-line"></span><span class="ba-grab">' + CHEVS + '</span></div>' +
        '</div>';

      return '<div class="bax" style="background:' + bg + ';color:' + text + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + headBlock + frame + '</div></div>';
    },
    hydrate: function (root) {
      root.querySelectorAll('.ba-frame').forEach(function (frame) {
        const after = frame.querySelector('.ba-after-wrap');
        const handle = frame.querySelector('.ba-handle');
        const afterImg = frame.querySelector('.ba-after');
        if (!after || !handle) return;
        let dragging = false;

        function sync() {
          // keep the after image at the frame's full width so clipping reveals, not squashes
          if (afterImg) afterImg.style.width = frame.clientWidth + 'px';
        }
        function setFromClientX(clientX) {
          const r = frame.getBoundingClientRect();
          if (!r.width) return;
          let pct = ((clientX - r.left) / r.width) * 100;
          pct = Math.min(100, Math.max(0, pct));
          after.style.width = pct + '%';
          handle.style.left = pct + '%';
        }
        function pointFromEvent(e) {
          if (e.touches && e.touches.length) return e.touches[0].clientX;
          if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX;
          return e.clientX;
        }

        // click / tap anywhere on the frame jumps the divider there
        frame.addEventListener('click', function (e) { sync(); setFromClientX(pointFromEvent(e)); });

        function start(e) { dragging = true; sync(); setFromClientX(pointFromEvent(e)); if (e.cancelable) e.preventDefault(); }
        function move(e) { if (!dragging) return; setFromClientX(pointFromEvent(e)); if (e.cancelable) e.preventDefault(); }
        function end() { dragging = false; }

        if (window.PointerEvent) {
          frame.addEventListener('pointerdown', start);
          frame.addEventListener('pointermove', move);
          window.addEventListener('pointerup', end);
        } else {
          frame.addEventListener('mousedown', start);
          window.addEventListener('mousemove', move);
          window.addEventListener('mouseup', end);
          frame.addEventListener('touchstart', start, { passive: false });
          frame.addEventListener('touchmove', move, { passive: false });
          window.addEventListener('touchend', end);
        }

        sync();
        window.addEventListener('resize', sync);
      });
    },
  });
})();
