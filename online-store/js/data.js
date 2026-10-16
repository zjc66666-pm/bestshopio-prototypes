/* BestShopio Admin · Online store / Theme editor — data layer.
   Ported from the Cursor canvas package (reference/canvases-share 2):
     - theme-editor.canvas.tsx   -> editor model (3-snapshot state, section/block tree, catalog)
     - theme-settings.canvas.tsx -> the 8 global setting groups (keys/defaults/options verbatim)
     - <section>.canvas.tsx       -> per-section schema + renderer (live in js/sections/<kind>.js)
   This file holds only DECLARATIVE data; the engine lives in app.js, section defs in sections/*.js.
   Page seeds are "thin" ({id,kind[,settings overrides][,blocks]}) — app.js materialises full
   settings from each section's defaults() at editor start, so defaults have a single source. */
(function () {
  // ---------- storefront imagery (Unsplash, same style as the rest of the prototype) ----------
  const IMG = {
    hero1: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80',
    hero2: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80',
    iwt:   'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1100&q=80',
    cat1:  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=700&q=80',
    cat2:  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80',
    cat3:  'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&w=700&q=80',
    cat4:  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=80',
    p1: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
    p2: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
    p3: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
    p4: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80',
    p5: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=600&q=80',
    p6: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80',
    av1: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    av2: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    av3: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    blog1: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    blog2: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    svcShip: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=300&q=80',
    svcVip: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=300&q=80',
  };

  // ---------- theme list ("My theme" tab) ----------
  const THEMES = [
    {
      id: 1, handle: 'aura', title: 'Aura',
      pc_image: IMG.hero1, h5_image: IMG.hero2,
      created_time: '2026-05-06 04:13:15', updated_time: '2026-06-12 17:42:08',
    },
  ];

  // ---------- page-type templates (theme-editor PAGE_OPTIONS) ----------
  // `multi:true` => this page type can hold several named templates (Shopify shows a
  // submenu + "Assigned to N …" + Create template). Single types keep exactly one
  // template and are picked directly (no submenu). `noun` labels the assignment count.
  const PAGE_OPTIONS = [
    { value: 'home',        label: 'Home page' },
    { value: 'collection',  label: 'Collections',     multi: true, noun: 'collections' },
    { value: 'collections', label: 'Collections list' },
  ];

  // ---------- Add-Section catalog (Shopify-style popover; 5 groups) ----------
  // kind === null  => "coming soon" stub (kept so coverage count reads true to the PRD).
  const CATALOG = [
    { id: 'collection', label: 'Collection', entries: [
      { kind: 'collection-banner', name: 'Collection banner', desc: 'Hero image + copy at the top of a collection' },
      { kind: 'collection-list', name: 'Collection list', desc: 'Sub-category cards / collection navigation strip' },
      { kind: 'collection-page', name: 'Collection page', desc: 'Product feed — filters, sort, grid or list' },
      { kind: 'list-collections', name: 'List collections', desc: 'All-collections grid for the /collections page' },
    ] },
    { id: 'hero', label: 'Hero & banners', entries: [
      { kind: 'slideshow', name: 'Slideshow', desc: 'Full-width rotating banners with CTAs' },
    ] },
    { id: 'products', label: 'Products & collections', entries: [
      { kind: 'image-link-blocks', name: 'Image link blocks', desc: 'Tappable collection / category tiles' },
      { kind: 'featured-collection', name: 'Featured collection', desc: 'Tabbed product grid from a collection' },
      { kind: 'featured-product', name: 'Featured product', desc: 'In-page buy box for one product' },
    ] },
    { id: 'content', label: 'Content & media', entries: [
      { kind: 'media-with-text', name: 'Media with text', desc: 'Image / video beside copy, alternating' },
      { kind: 'text-with-icon', name: 'Text with icon', desc: 'Row of icon + text trust badges' },
      { kind: 'video-feed', name: 'Video feed', desc: 'Shoppable short-video carousel' },
      { kind: 'before-after-image', name: 'Before / after image', desc: 'Draggable comparison slider' },
      { kind: 'blog-posts', name: 'Blog posts', desc: 'Latest articles from a blog' },
      { kind: 'media-grid', name: 'Media grid', desc: 'Image / video cards with captions' },
      { kind: 'feature-cards', name: 'Feature cards', desc: 'Icon + title + text benefit cards' },
    ] },
    { id: 'social', label: 'Social proof', entries: [
      { kind: 'testimonial', name: 'Testimonial', desc: 'Customer review cards' },
      { kind: 'ugc-gallery', name: 'UGC gallery', desc: 'User photo wall' },
      { kind: 'as-seen-in', name: 'As seen in', desc: 'Press / media logo strip' },
    ] },
    { id: 'engagement', label: 'Engagement & utility', entries: [
      { kind: 'faq', name: 'FAQ', desc: 'Accordion questions + support panel' },
      { kind: 'newsletter', name: 'Newsletter', desc: 'Email capture block' },
      { kind: 'custom-html', name: 'Custom HTML', desc: 'Raw HTML embed' },
    ] },
  ];

  // ---------- Theme settings · 8 groups (verbatim from theme-settings.canvas.tsx) ----------
  // Row kinds: {sub} = subheading, {info} = helper line, otherwise a field descriptor.
  const FONT_HEAD = ['Playfair Display', 'DM Serif Display', 'Manrope', 'Inter', 'Georgia'].map((v) => ({ value: v, label: v }));
  const FONT_BODY = ['Inter', 'Manrope', 'Lato', 'Source Sans 3', 'system-ui'].map((v) => ({ value: v, label: v }));
  const SETTINGS_GROUPS = [
    { key: 'colors', name: 'Colors', desc: 'Brand, surface and status colors', open: true, fields: [
      { sub: 'Brand' },
      { key: 'primary_color', label: 'Primary color', control: 'color', default: '#103635', info: 'Brand color. Drives the announcement bar background in the preview.' },
      { key: 'secondary_color', label: 'Secondary color', control: 'color', default: '#666666', info: 'Used by secondary nav links and product vendor labels.' },
      { sub: 'Surface' },
      { key: 'page_background', label: 'Page background', control: 'color', default: '#FFFFFF' },
      { key: 'text_color', label: 'Body text', control: 'color', default: '#1A1A1A' },
      { key: 'heading_color', label: 'Heading text', control: 'color', default: '#103635' },
      { key: 'link_color', label: 'Link text', control: 'color', default: '#103635' },
      { key: 'border_color', label: 'Border', control: 'color', default: '#E5E5E5' },
      { key: 'footer_background', label: 'Footer background', control: 'color', default: '#103635', info: 'Background of the footer block. Pick a dark brand color for best contrast with white text.' },
      { sub: 'Status' },
      { key: 'sale_price_color', label: 'Sale price', control: 'color', default: '#D92D20', info: 'Used on sale badges and crossed-out prices.' },
      { key: 'error_color', label: 'Error / destructive', control: 'color', default: '#D92D20' },
      { key: 'success_color', label: 'Success', control: 'color', default: '#12B76A' },
    ] },
    { key: 'typography', name: 'Typography', desc: 'Font families, sizing and rhythm', open: true, fields: [
      { sub: 'Font families' },
      { key: 'heading_font', label: 'Heading font', control: 'select', options: FONT_HEAD, default: 'Playfair Display' },
      { key: 'body_font', label: 'Body font', control: 'select', options: FONT_BODY, default: 'Inter' },
      { sub: 'Sizing' },
      { key: 'base_font_size', label: 'Base font size', control: 'range', min: 12, max: 20, step: 1, unit: 'px', default: 16, info: 'Scales every body & heading size proportionally.' },
      { key: 'heading_scale', label: 'Heading scale', control: 'select', default: 'large', info: 'Multiplies every heading size — applies to H1 / H2 / H3 alike.', options: [
        { value: 'small', label: 'Small (×0.85)' }, { value: 'medium', label: 'Medium (×1.00)' }, { value: 'large', label: 'Large (×1.20)' } ] },
      { sub: 'Weight & rhythm' },
      { key: 'heading_font_weight', label: 'Heading weight', control: 'range', min: 300, max: 900, step: 100, default: 700 },
      { key: 'body_font_weight', label: 'Body weight', control: 'range', min: 300, max: 700, step: 100, default: 400 },
      { key: 'line_height', label: 'Line height', control: 'range', min: 1.2, max: 2.0, step: 0.05, default: 1.5 },
      { key: 'letter_spacing', label: 'Letter spacing', control: 'range', min: -1, max: 3, step: 0.1, unit: 'px', default: 0 },
    ] },
    { key: 'buttons', name: 'Buttons', desc: 'Primary, secondary and shape', fields: [
      { sub: 'Primary button' },
      { key: 'primary_button_background', label: 'Background', control: 'color', default: '#103635' },
      { key: 'primary_button_text', label: 'Text', control: 'color', default: '#FFFFFF' },
      { sub: 'Secondary button' },
      { key: 'secondary_button_background', label: 'Background', control: 'color', default: 'transparent', allowTransparent: true },
      { key: 'secondary_button_text', label: 'Text', control: 'color', default: '#103635' },
      { sub: 'Shape' },
      { key: 'button_border_color', label: 'Border color', control: 'color', default: '#103635' },
      { key: 'button_border_width', label: 'Border width', control: 'range', min: 0, max: 4, step: 1, unit: 'px', default: 1 },
      { key: 'button_border_radius', label: 'Corner radius', control: 'range', min: 0, max: 40, step: 1, unit: 'px', default: 40, info: 'Capped at 40px — once radius ≥ height ÷ 2 the corners are fully pilled.' },
      { key: 'button_height', label: 'Height', control: 'range', min: 32, max: 64, step: 1, unit: 'px', default: 44 },
      { key: 'button_horizontal_padding', label: 'Horizontal padding', control: 'range', min: 8, max: 48, step: 1, unit: 'px', default: 24 },
      { key: 'button_text_transform', label: 'Label case', control: 'select', default: 'uppercase', options: [
        { value: 'none', label: 'None' }, { value: 'uppercase', label: 'UPPERCASE' }, { value: 'lowercase', label: 'lowercase' } ] },
    ] },
    { key: 'layout', name: 'Layout', desc: 'Page width, spacing and radius', fields: [
      { sub: 'Container' },
      { key: 'page_width', label: 'Max page width', control: 'range', min: 960, max: 1600, step: 10, unit: 'px', default: 1200 },
      { sub: 'Section spacing' },
      { key: 'section_spacing_desktop', label: 'Vertical gap · Desktop', control: 'range', min: 16, max: 160, step: 4, unit: 'px', default: 64 },
      { key: 'section_spacing_mobile', label: 'Vertical gap · Mobile', control: 'range', min: 8, max: 100, step: 2, unit: 'px', default: 40 },
      { sub: 'Grid gap' },
      { key: 'grid_gap_desktop', label: 'Column gap · Desktop', control: 'range', min: 8, max: 64, step: 2, unit: 'px', default: 24 },
      { key: 'grid_gap_mobile', label: 'Column gap · Mobile', control: 'range', min: 4, max: 40, step: 2, unit: 'px', default: 16 },
      { sub: 'Page padding' },
      { key: 'page_horizontal_padding_desktop', label: 'Horizontal padding · Desktop', control: 'range', min: 8, max: 80, step: 2, unit: 'px', default: 40 },
      { key: 'page_horizontal_padding_mobile', label: 'Horizontal padding · Mobile', control: 'range', min: 4, max: 40, step: 2, unit: 'px', default: 16 },
      { sub: 'Radius' },
      { key: 'image_border_radius', label: 'Image radius', control: 'range', min: 0, max: 40, step: 1, unit: 'px', default: 12 },
      { key: 'card_border_radius', label: 'Card radius', control: 'range', min: 0, max: 40, step: 1, unit: 'px', default: 12 },
    ] },
    { key: 'product_cards', name: 'Product cards', desc: 'Default product card visuals', fields: [
      { sub: 'Image' },
      { key: 'product_image_ratio', label: 'Image ratio', control: 'select', default: 'portrait', options: [
        { value: 'portrait', label: 'Portrait (3:4)' }, { value: 'square', label: 'Square (1:1)' }, { value: 'landscape', label: 'Landscape (4:3)' } ] },
      { key: 'product_image_fit', label: 'Image fit', control: 'select', default: 'cover', options: [
        { value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' } ] },
      { sub: 'Text' },
      { key: 'product_card_text_alignment', label: 'Text alignment', control: 'select', default: 'center', options: [
        { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' } ] },
      { key: 'product_title_size', label: 'Title size', control: 'select', default: 'medium', options: [
        { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' } ] },
      { sub: 'Defaults' },
      { info: 'These defaults apply to every Featured collection or product grid. Individual sections can override each toggle.' },
      { key: 'show_vendor_by_default', label: 'Show vendor', control: 'toggle', default: false },
      { key: 'show_rating_by_default', label: 'Show rating', control: 'toggle', default: true },
      { key: 'show_sale_badge_by_default', label: 'Show sale badge', control: 'toggle', default: true },
      { key: 'sale_badge_style', label: 'Sale badge style', control: 'select', default: 'solid', options: [
        { value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' } ] },
      { key: 'show_color_swatches_by_default', label: 'Show color swatches', control: 'toggle', default: true },
      { key: 'show_quick_add_by_default', label: 'Show quick-add button', control: 'toggle', default: false },
    ] },
    { key: 'forms', name: 'Forms', desc: 'Inputs across the storefront', fields: [
      { info: 'Click into either preview input to type — input_text, placeholder_color and the focus border react live.' },
      { sub: 'Color' },
      { key: 'input_background', label: 'Background', control: 'color', default: '#FFFFFF' },
      { key: 'input_text', label: 'Text', control: 'color', default: '#1A1A1A' },
      { key: 'placeholder_color', label: 'Placeholder', control: 'color', default: '#999999' },
      { key: 'input_border_color', label: 'Border (default)', control: 'color', default: '#E5E5E5' },
      { key: 'focus_border_color', label: 'Border (focused)', control: 'color', default: '#103635' },
      { sub: 'Shape' },
      { key: 'input_border_radius', label: 'Corner radius', control: 'range', min: 0, max: 40, step: 1, unit: 'px', default: 40 },
      { key: 'input_height', label: 'Height', control: 'range', min: 32, max: 64, step: 1, unit: 'px', default: 44 },
      { key: 'input_horizontal_padding', label: 'Horizontal padding', control: 'range', min: 8, max: 32, step: 1, unit: 'px', default: 16 },
    ] },
    { key: 'social_media', name: 'Social media', desc: 'URLs surfaced in Footer / Header', fields: [
      { info: 'Leave a field blank to hide that channel everywhere.' },
      { key: 'facebook_url', label: 'Facebook URL', control: 'url', default: '', placeholder: 'https://facebook.com/your-shop' },
      { key: 'instagram_url', label: 'Instagram URL', control: 'url', default: 'https://instagram.com/example', placeholder: 'https://instagram.com/your-shop' },
      { key: 'tiktok_url', label: 'TikTok URL', control: 'url', default: 'https://tiktok.com/@example', placeholder: 'https://tiktok.com/@your-shop' },
      { key: 'youtube_url', label: 'YouTube URL', control: 'url', default: '', placeholder: 'https://youtube.com/@your-shop' },
      { key: 'pinterest_url', label: 'Pinterest URL', control: 'url', default: '', placeholder: 'https://pinterest.com/your-shop' },
      { key: 'twitter_url', label: 'X / Twitter URL', control: 'url', default: 'https://twitter.com/example', placeholder: 'https://twitter.com/your-shop' },
    ] },
    { key: 'favicon', name: 'Favicon', desc: 'Browser tab icon', fields: [
      { key: 'favicon_image', label: 'Favicon image', control: 'image', default: '', info: 'Recommended 32×32 PNG. The storefront falls back to a generic dot if unset.' },
    ] },
  ];

  // ---------- sample platform resources (drive product/collection/menu/blog/page pickers) ----------
  const SAMPLE = {
    products: [
      { id: 'p1', title: 'Linen-feel wide pants', vendor: 'Aura Studio', price: 32.99, compareAt: 45.0, rating: 4.8, reviews: 214, image: IMG.p1, swatches: ['#2b2f36', '#c8b6a6', '#d9d2c5'] },
      { id: 'p2', title: 'Soft rib tee', status: 'draft', vendor: 'Aura Studio', price: 18.99, compareAt: 26.0, rating: 4.6, reviews: 98, image: IMG.p2, swatches: ['#1b3a2b', '#eae3d6'] },
      { id: 'p3', title: 'Editorial shell dress', vendor: 'Aura Studio', price: 41.5, compareAt: 58.0, rating: 4.9, reviews: 176, image: IMG.p3, swatches: ['#3a3f4a', '#9fb0a0', '#d8c3a5'],
        variants: [
          { id: 'p3-blk-m', title: 'Black / M', price: 41.5, compareAt: 58.0 },
          { id: 'p3-blk-s', title: 'Black / S', price: 41.5, compareAt: 58.0 },
          { id: 'p3-snd-m', title: 'Sand / M', price: 44.0, compareAt: 60.0 },
          { id: 'p3-grn-l', title: 'Sage / L', price: 44.0, compareAt: 60.0 },
        ] },
      { id: 'p4', title: 'Street denim jacket', status: 'draft', vendor: 'Aura Studio', price: 54.0, compareAt: 72.0, rating: 4.7, reviews: 132, image: IMG.p4, swatches: ['#33415c', '#1b1f24'],
        variants: [
          { id: 'p4-ind-m', title: 'Indigo / M', price: 54.0, compareAt: 72.0 },
          { id: 'p4-ind-l', title: 'Indigo / L', price: 56.0, compareAt: 74.0 },
          { id: 'p4-blk-m', title: 'Black / M', price: 58.0, compareAt: 76.0 },
        ] },
      { id: 'p5', title: 'Crewneck sweater', vendor: 'Aura Studio', price: 44.0, compareAt: 0, rating: 4.5, reviews: 64, image: IMG.p5, swatches: ['#6b705c', '#cb997e'] },
      { id: 'p6', title: 'Pleated midi skirt', vendor: 'Aura Studio', price: 38.0, compareAt: 49.0, rating: 4.4, reviews: 51, image: IMG.p6, swatches: ['#1b1f24', '#b08968'] },
      { id: 'p7', title: 'Canvas weekender tote', vendor: 'Aura Studio', price: 29.0, compareAt: 39.0, rating: 4.7, reviews: 83, image: IMG.cat1, swatches: ['#b08968', '#2b2f36'] },
      { id: 'p8', title: 'Everyday rib socks · 3 pack', vendor: 'Aura Studio', price: 16.0, compareAt: 24.0, rating: 4.6, reviews: 119, image: IMG.cat2, swatches: ['#eae3d6', '#1b1f24'] },
      { id: 'p9', title: 'Mini canvas pouch', vendor: 'Aura Studio', price: 14.0, compareAt: 19.0, rating: 4.5, reviews: 72, image: IMG.p1, swatches: ['#c8b6a6', '#2b2f36'] },
      { id: 'p10', title: 'Travel care kit', vendor: 'Aura Studio', price: 12.0, compareAt: 18.0, rating: 4.6, reviews: 91, image: IMG.p2, swatches: ['#d9d2c5'] },
      { id: 'p11', title: 'Essential hair scarf', vendor: 'Aura Studio', price: 18.0, compareAt: 25.0, rating: 4.4, reviews: 54, image: IMG.p3, swatches: ['#1b1f24', '#d8c3a5'] },
      { id: 'p12', title: 'Cotton sleep mask', vendor: 'Aura Studio', price: 9.5, compareAt: 14.0, rating: 4.7, reviews: 108, image: IMG.p4, swatches: ['#33415c', '#eae3d6'] },
      { id: 'p13', title: 'Everyday claw clip set', vendor: 'Aura Studio', price: 15.0, compareAt: 21.0, rating: 4.6, reviews: 137, image: IMG.p5, swatches: ['#6b705c', '#cb997e'] },
      { id: 'p14', title: 'Compact jewelry case', vendor: 'Aura Studio', price: 20.0, compareAt: 28.0, rating: 4.8, reviews: 66, image: IMG.p6, swatches: ['#b08968', '#1b1f24'] },
      { id: 'p15', title: 'Soft-touch headband', vendor: 'Aura Studio', price: 11.0, compareAt: 16.0, rating: 4.5, reviews: 84, image: IMG.cat1, swatches: ['#d8c3a5', '#1b1f24'] },
      { id: 'p16', title: 'Linen scrunchie set', vendor: 'Aura Studio', price: 13.0, compareAt: 18.0, rating: 4.6, reviews: 102, image: IMG.cat2, swatches: ['#c8b6a6', '#9fb0a0'] },
      { id: 'p17', title: 'Pocket mirror', vendor: 'Aura Studio', price: 8.0, compareAt: 12.0, rating: 4.4, reviews: 47, image: IMG.p1, swatches: ['#2b2f36'] },
      { id: 'p18', title: 'Mini travel comb', vendor: 'Aura Studio', price: 7.5, compareAt: 11.0, rating: 4.5, reviews: 59, image: IMG.p2, swatches: ['#eae3d6'] },
      { id: 'p19', title: 'Reusable garment bag', vendor: 'Aura Studio', price: 17.0, compareAt: 24.0, rating: 4.7, reviews: 73, image: IMG.p3, swatches: ['#3a3f4a'] },
      { id: 'p20', title: 'Delicate wash bag set', vendor: 'Aura Studio', price: 10.0, compareAt: 15.0, rating: 4.6, reviews: 96, image: IMG.p4, swatches: ['#eae3d6', '#33415c'] },
    ],
    // Service / membership products bound by the Shipping Insurance & VIP Club components.
    // They carry their own price and show up in the Order Summary like a normal line item.
    services: [
      { id: 'svc-ship', title: 'Shipping Protection', vendor: 'Service', price: 3.95, compareAt: 0, image: IMG.svcShip },
      { id: 'svc-vip', title: 'VIP Club Membership', vendor: 'Membership', price: 29.99, compareAt: 0, image: IMG.svcVip },
    ],
    collections: [
      { id: 'best-sellers', title: 'Best sellers', image: IMG.cat1, count: 48 },
      { id: 'new-arrivals', title: 'New arrivals', image: IMG.cat2, count: 32 },
      { id: 'dresses', title: 'Dresses', image: IMG.cat3, count: 27 },
      { id: 'tops', title: 'Tops', image: IMG.cat4, count: 41 },
      { id: 'bottoms', title: 'Bottoms', image: IMG.p1, count: 36 },
      { id: 'sale', title: 'Sale', image: IMG.p4, count: 19 },
    ],
    menus: [
      { id: 'menu-main', name: 'Main menu', items: [
        { id: 'm-home', title: 'Home', url: '/' },
        { id: 'm-shop', title: 'Shop Now', url: '/collections/all', children: [
          { id: 'm-shop-best', title: 'Best sellers', url: '/collections/best-sellers' },
          { id: 'm-shop-new', title: 'New arrivals', url: '/collections/new-arrivals' },
          { id: 'm-shop-sale', title: 'Sale', url: '/collections/sale' },
        ] },
        { id: 'm-women', title: 'Women', url: '/collections/women', children: [
          { id: 'm-w-dress', title: 'Dresses', url: '/collections/dresses' },
          { id: 'm-w-top', title: 'Tops', url: '/collections/tops' },
          { id: 'm-w-bottom', title: 'Bottoms', url: '/collections/bottoms' },
        ] },
        { id: 'm-blog', title: 'Journal', url: '/blogs/journal' },
      ] },
      { id: 'menu-footer-shop', name: 'Footer · Shop', items: [
        { id: 'f-best', title: 'Best sellers', url: '/collections/best-sellers' },
        { id: 'f-new', title: 'New arrivals', url: '/collections/new-arrivals' },
        { id: 'f-sale', title: 'Sale', url: '/collections/sale' },
      ] },
      { id: 'menu-footer-help', name: 'Footer · Help', items: [
        { id: 'h-track', title: 'Track order', url: '/account/orders' },
        { id: 'h-ship', title: 'Shipping', url: '/pages/shipping' },
        { id: 'h-returns', title: 'Returns', url: '/pages/returns' },
        { id: 'h-contact', title: 'Contact us', url: '/pages/contact' },
      ] },
    ],
    pages: [
      { id: 'pg-privacy', title: 'Privacy Policy', url: '/pages/privacy', content:
        '<p>This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from our store.</p>' +
        '<p><strong>Information we collect.</strong> When you place an order we collect your name, billing and shipping address, payment details, email address, and phone number so we can fulfil your order and keep you updated.</p>' +
        '<p><strong>How we use it.</strong> We use the information to process payments, arrange shipping, and provide order confirmations. We may also use it to communicate with you and to screen for potential risk or fraud.</p>' +
        '<p>You can contact us at any time to review, update, or delete the personal information we hold about you.</p>' },
      { id: 'pg-refund', title: 'Refund Policy', url: '/pages/refund', content:
        '<p>We have a 30-day return policy, which means you have 30 days after receiving your item to request a return.</p>' +
        '<p><strong>Eligibility.</strong> To be eligible for a return, your item must be in the same condition that you received it — unworn or unused, with tags, and in its original packaging. You will also need the receipt or proof of purchase.</p>' +
        '<p><strong>Refunds.</strong> Once we have received and inspected your return, we will notify you of the approval. If approved, you will be automatically refunded to your original payment method within 10 business days.</p>' },
      { id: 'pg-terms', title: 'Terms of Service', url: '/pages/terms', content:
        '<p>By accessing this site and placing an order you agree to the following terms and conditions.</p>' +
        '<p><strong>Products & pricing.</strong> We reserve the right to modify prices and product availability at any time. All prices are shown in the store currency and include applicable taxes where required.</p>' +
        '<p><strong>Orders.</strong> We reserve the right to refuse or cancel any order. If we cancel an order after payment, you will receive a full refund.</p>' +
        '<p>These terms are governed by the laws of the jurisdiction in which the store operates.</p>' },
      { id: 'pg-shipping', title: 'Shipping Policy', url: '/pages/shipping', content:
        '<p>We aim to process and dispatch all orders within 1–2 business days.</p>' +
        '<p><strong>Delivery times.</strong> Standard shipping typically arrives within 3–7 business days. Express options are available at checkout for faster delivery.</p>' +
        '<p><strong>Tracking.</strong> Once your order ships you will receive a confirmation email with a tracking number so you can follow its progress.</p>' +
        '<p>Shipping fees are calculated at checkout based on destination and the options you select.</p>' },
      { id: 'pg-about', title: 'About Us', url: '/pages/about', content:
        '<p>We are a small team passionate about creating thoughtful, high-quality products that last.</p>' +
        '<p>Every item in our collection is designed with care and made to be worn and loved for years. We believe in fair pricing, transparent sourcing, and treating our customers the way we would want to be treated.</p>' +
        '<p>Thank you for supporting our store — we are glad you are here.</p>' },
      { id: 'pg-contact', title: 'Contact Us', url: '/pages/contact', content:
        '<p>Have a question about your order or one of our products? We would love to hear from you.</p>' +
        '<p><strong>Email.</strong> support@example.com — we reply to every message within one business day.</p>' +
        '<p><strong>Hours.</strong> Monday to Friday, 9am–5pm. Messages sent over the weekend are answered the next business day.</p>' },
    ],
    blogs: [
      { id: 'blog-journal', title: 'Journal', posts: [
        { id: 'a1', title: 'Five ways to style linen this spring', excerpt: 'Lightweight layers for warmer days, from desk to dinner.', author: 'Mia Carter', date: 'Mar 3, 2026', category: 'Outfit Ideas', image: IMG.blog1 },
        { id: 'a2', title: 'The fabric guide: what to know before you buy', excerpt: 'A quick primer on the materials we love and why they last.', author: 'Jules N.', date: 'Mar 4, 2026', category: 'Guides', image: IMG.blog2 },
        { id: 'a3', title: 'Behind the seams: our spring capsule', excerpt: 'How the new collection came together, piece by piece.', author: 'Mia Carter', date: 'Mar 6, 2026', category: 'Studio', image: IMG.iwt },
      ] },
    ],
    currencies: ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD'],
    languages: ['English', '中文', '日本語', 'Français', 'Español', 'Deutsch'],
    IMG,
  };

  // ---------- DEFAULT THEME (thin seeds; settings filled from section defaults at start) ----------
  // Globals (announcement/header/footer) and template sections reference a section `kind`; the
  // engine materialises each instance's settings from OS_SECTIONS[kind].defaults(), applying any
  // `settings` override here. Blocks likewise: {kind} -> blockDef.defaults().
  const DEFAULT_THEME = {
    name: 'Aura · Draft',
    announcement: { hidden: false, kind: 'announcement-bar', settings: {} },
    header: { hidden: false, kind: 'header', settings: {} },
    footer: { hidden: false, kind: 'footer', settings: {} },
    // Multi-template shape: each page type holds a `list` of named templates. `id:'default'`
    // is the built-in fallback (can't be deleted). `assigned` is a mock count shown in the
    // selector submenu ("Assigned to N collections"). Single types (home / collections) simply
    // keep a one-item list. Extra collection templates seed the multi-template UX.
    // Product (PDP) templates are omitted until that page type is finished.
    templates: {
      home: { list: [
        { id: 'default', name: 'Home page', assigned: '—', sections: [
          { id: 'sec-home-slideshow', kind: 'slideshow' },
          { id: 'sec-home-iwt', kind: 'media-with-text' },
          { id: 'sec-home-fc', kind: 'featured-collection' },
          { id: 'sec-home-testi', kind: 'testimonial' },
          { id: 'sec-home-faq', kind: 'faq' },
          { id: 'sec-home-news', kind: 'newsletter' },
        ] },
      ] },
      collection: { list: [
        { id: 'default', name: 'Default collection', assigned: '100+', assignedResourceIds: ['best-sellers', 'new-arrivals', 'dresses', 'tops', 'bottoms', 'sale'], sections: [
          { id: 'sec-col-banner', kind: 'collection-banner' },
          { id: 'sec-col-list', kind: 'collection-list' },
          { id: 'sec-col-page', kind: 'collection-page' },
        ] },
        { id: 'sale-2026', name: 'sale-2026', basedOn: 'default', assigned: 3, assignedResourceIds: ['sale', 'best-sellers', 'new-arrivals'], sections: [
          { kind: 'collection-banner' }, { kind: 'collection-page' },
        ] },
      ] },
      collections: { list: [
        { id: 'default', name: 'Collections list', assigned: '—', sections: [
          { id: 'sec-cols-list', kind: 'list-collections' },
        ] },
      ] },
    },
  };

  // ==========================================================================
  //  CHECKOUT THEME (V Theme-Checkout PRD) — separate editor surface
  //  Fixed transaction skeleton + configurable styles. Distinct from the
  //  Home/Collection/PDP theme settings above. (PRD §3, §5, §6)
  // ==========================================================================

  // Checkout editor page selector — both transaction pages share one theme (Thank you PRD §23.1).
  // Checkout theme is its own editing environment with FOUR multi-template page types
  // (PRD §3.2/§5.2).
  const CHECKOUT_PAGES = [
    { value: 'checkout', label: 'Checkout',  multi: true },
    { value: 'upsell',   label: 'Upsell',    multi: true },
    { value: 'downsell', label: 'Downsell',  multi: true },
    { value: 'thankyou', label: 'Thank you', multi: true },
  ];

  // Seed template lists per checkout page type (PRD §6.3/§6.4). `isDefault` marks the
  // built-in fallback.
  // Upsell/Downsell share one post-purchase offer builder; Funnel/Offer services provide
  // products, prices, routing and payment capability while Theme owns presentation only.
  const CHECKOUT_TEMPLATE_SETS = {
    checkout: [
      // Keep the established ids for backward-compatible saved themes and preview URLs.
      { id: 'standard', name: 'Checkout - New customer offer', isDefault: true },
      { id: 'conversion', name: 'Checkout - Returning customer cross-sell' },
      { id: 'trust-led', name: 'Checkout - Trust-led' },
      { id: 'concise', name: 'Checkout - Concise' },
      { id: 'social-proof', name: 'Checkout - Social Proof', status: 'draft' },
    ],
    upsell: [
      { id: 'one-click-upsell', name: 'Upsell - New customer offer', isDefault: true },
      { id: 'subscription-upsell', name: 'Upsell - Returning customer cross-sell' },
      { id: 'residual-offer', name: 'Upsell - Shared residual offer' },
      { id: 'limited-proof', name: 'Upsell - Limited-time Proof', status: 'draft' },
    ],
    downsell: [
      { id: 'standard-downsell', name: 'Downsell - New customer offer', isDefault: true },
      { id: 'save-offer', name: 'Downsell - Returning customer cross-sell' },
      { id: 'residual-save', name: 'Downsell - Shared residual save' },
      { id: 'gentle-last-chance', name: 'Downsell - Gentle Last Chance', status: 'draft' },
    ],
    thankyou: [
      { id: 'standard', name: 'Default thank you', isDefault: true, previewOrderScenario: 'standard' },
      { id: 'base-order', name: 'Base order', basedOn: 'standard', previewOrderScenario: 'base' },
      { id: 'survey-thankyou', name: 'Base order + Late Upsell order', previewOrderScenario: 'dual' },
      { id: 'brand-celebration', name: 'Thank you - Brand Celebration', status: 'draft', previewOrderScenario: 'standard' },
    ],
  };

  const CHECKOUT_HEADING_FONTS = [
    { value: 'Default', label: 'Default' },
    { value: "Georgia, 'Times New Roman', serif", label: 'Georgia' },
    { value: "'Avenir Next', 'Segoe UI', sans-serif", label: 'Avenir Next' },
    { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet' },
    { value: "'Courier New', monospace", label: 'Courier' },
    { value: "'Playfair Display', Georgia, serif", label: 'Playfair Display' },
    { value: 'Marcellus, Georgia, serif', label: 'Marcellus' },
    { value: "'Cormorant Garamond', Georgia, serif", label: 'Cormorant Garamond' },
  ];
  const CHECKOUT_BODY_FONTS = [
    { value: 'Default', label: 'Default' },
    { value: "Georgia, 'Times New Roman', serif", label: 'Georgia' },
    { value: "'Avenir Next', 'Segoe UI', sans-serif", label: 'Avenir Next' },
    { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet' },
    { value: "'Courier New', monospace", label: 'Courier' },
    { value: 'Inter, Arial, sans-serif', label: 'Inter' },
    { value: "'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif", label: 'SF Pro' },
    { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  ];

  // Checkout Theme settings — 6 groups / 20 fields (Theme settings normalization PRD §3).
  // `pages` on a group / field lists where the setting has a consuming element; the editor
  // hides everything else on the current page (PRD §6). Omitted = all four pages.
  // Removed fields (text / muted / divider, Header group, summary text colors, button height,
  // font sizes & weights, section spacing, mobile padding) are frozen constants in
  // checkoutVars(); text colors now auto-switch by background luminance (PRD §4.1).
  const CK_SUMMARY_PAGES = ['checkout', 'thankyou'];
  const CHECKOUT_SETTINGS_GROUPS = [
    { key: 'main', name: 'Main', desc: 'Page surface', open: true, fields: [
      { key: 'page_background', label: 'Page background', control: 'color', default: '#FFFFFF', info: 'Text color adjusts automatically for readability.' },
    ] },
    { key: 'order_summary', name: 'Order summary', desc: 'Right-hand summary surface', pages: CK_SUMMARY_PAGES, fields: [
      { key: 'summary_background', label: 'Background', control: 'color', default: '#F5F5F5', info: 'Text color adjusts automatically for readability. Applies to the desktop summary, the mobile summary bar and the Thank you summary.' },
    ] },
    { key: 'accent', name: 'Accent and buttons', desc: 'Links, selected states & primary buttons', fields: [
      { key: 'accent_color', label: 'Accent color', control: 'color', default: '#121212', info: 'Links, selected state, radio, checkbox, focus ring and success icon.' },
      { key: 'button_background', label: 'Button background', control: 'color', default: '#121212', info: 'Pay now, Apply, Continue shopping and Add to my order.' },
      { key: 'button_text_color', label: 'Button text color', control: 'color', default: '#FFFFFF' },
      { key: 'button_hover_background', label: 'Button hover background', control: 'color', default: '#000000' },
      { key: 'button_border_radius', label: 'Button border radius', control: 'range', min: 0, max: 40, step: 1, unit: 'px', default: 6 },
    ] },
    { key: 'input', name: 'Input fields', desc: 'Contact, Delivery, Billing, Payment & Discount code', pages: ['checkout'], fields: [
      { key: 'input_background', label: 'Input background', control: 'color', default: '#FFFFFF' },
      { key: 'input_text_color', label: 'Input text color', control: 'color', default: '#1F1F1F' },
      { key: 'placeholder_color', label: 'Placeholder color', control: 'color', default: '#B5B5B5' },
      { key: 'input_border_color', label: 'Input border color', control: 'color', default: '#D9D9D9' },
      { key: 'input_focus_border_color', label: 'Input focus border color', control: 'color', default: '', info: 'Uses the Accent color when empty.' },
      { key: 'input_error_color', label: 'Input error color', control: 'color', default: '#D72C2C' },
      { key: 'input_border_radius', label: 'Input border radius', control: 'range', min: 0, max: 24, step: 1, unit: 'px', default: 12 },
      { key: 'input_height', label: 'Input height', control: 'range', min: 40, max: 64, step: 1, unit: 'px', default: 40 },
      { key: 'transparent_input', label: 'Transparent input', control: 'toggle', default: false },
      { info: 'Fields rendered by payment providers keep their own styling.' },
    ] },
    { key: 'typography', name: 'Typography', desc: 'Heading & body fonts', fields: [
      { key: 'heading_font', label: 'Heading font', control: 'select', options: CHECKOUT_HEADING_FONTS, default: 'Default', info: 'Store name, section titles and the Thank you title.' },
      { key: 'body_font', label: 'Body font', control: 'select', options: CHECKOUT_BODY_FONTS, default: 'Default', info: 'Everything else, including totals and amounts.' },
    ] },
    { key: 'layout', name: 'Layout', desc: 'Width and columns', fields: [
      { key: 'page_max_width_pc', label: 'Page max width PC', control: 'range', min: 900, max: 1280, step: 1, unit: 'px', default: 980 },
      { key: 'column_gap', label: 'Column gap', control: 'range', min: 16, max: 80, step: 1, unit: 'px', default: 40, pages: CK_SUMMARY_PAGES },
    ] },
  ];
  // Theme fields removed in settingsVersion 2 — stripped from older snapshots on load.
  const CHECKOUT_SETTINGS_REMOVED = {
    main: ['text_color', 'muted_text_color', 'divider_color'],
    header: null, // whole group; header_height_pc / header_height_mobile migrate into the Header component
    order_summary: ['summary_text', 'summary_muted_text'],
    accent: ['button_height'],
    typography: ['base_font_size', 'heading_font_size', 'font_weight_heading', 'font_weight_body'],
    layout: ['section_spacing', 'mobile_page_padding'],
  };

  // Checkout commerce components (Commerce PRD §14.1) — the addable "transaction
  // enhancement" group. Unlike the required skeleton, these can be added / hidden /
  // deleted / reordered in the editor.
  const CHECKOUT_COMMERCE = [
    { kind: 'checkout-product-upsell', name: 'Product upsell', desc: 'Recommend extra products with one-tap add' },
    { kind: 'checkout-shipping-insurance', name: 'Shipping Insurance', desc: 'Tickable delivery-protection service' },
    { kind: 'checkout-vip-club', name: 'VIP Club', desc: 'Tickable membership add-on' },
  ];

  // Allowed insertion zones for commerce components. Each zone sits right after an anchor
  // (required) component. To keep merchant configuration simple, every commerce component
  // may live in any of the five zones (no per-component matrix). `col` decides the render
  // column: 'main' = left form column, 'summary' = under the Order Summary (right column on
  // PC, after the bottom Order Summary on mobile).
  const CK_COMMERCE_KINDS = ['checkout-product-upsell', 'checkout-shipping-insurance', 'checkout-vip-club'];

  // Checkout content & trust components (Content PRD §2) — the third, "content & trust
  // enhancement" group. Static-only: never touches order / amount / shipping / tax /
  // payment data. Addable / hideable / deletable / draggable like the commerce group,
  // but most are Section + Block components with their own block lists.
  const CHECKOUT_CONTENT = [
    { kind: 'announcement-bar', name: 'Announcement Bar', desc: 'Top promo / free-shipping bar (reused from Online Store)' },
    { kind: 'checkout-countdown', name: 'Countdown', desc: 'Static urgency / reservation timer' },
    { kind: 'checkout-payment-icons', name: 'Payment Icons', desc: 'Accepted-payment brand badges' },
    { kind: 'checkout-trust-badges', name: 'Trust badges', desc: 'Guarantee / security / shipping badges' },
    { kind: 'checkout-trustpilot', name: 'Trustpilot Review', desc: 'Trustpilot-style rating & reviews (static)' },
    { kind: 'checkout-review-card', name: 'Review card', desc: 'Expert / media endorsement cards' },
    { kind: 'checkout-testimonials', name: 'Testimonials', desc: 'Customer reviews (bottom area only)' },
    { kind: 'checkout-fb-comments', name: 'Facebook-style Comments', desc: 'Social-proof comment thread' },
    { kind: 'checkout-static-content', name: 'Static content', desc: 'Notice / card / rich-text block' },
    { kind: 'checkout-footer', name: 'Footer', desc: 'Checkout footer (bottom of page only)' },
  ];
  // The 7 content components that may live in any of the standard insertion zones
  // (Header / Contact / Shipping / Payment / CTA / Order Summary), per PRD §5.1.
  const CK_CONTENT_FLEX = ['checkout-countdown', 'checkout-trust-badges', 'checkout-static-content',
    'checkout-payment-icons', 'checkout-trustpilot', 'checkout-review-card', 'checkout-fb-comments'];
  const CK_FLEX = CK_COMMERCE_KINDS.concat(CK_CONTENT_FLEX);

  // Insertion zones. `col` decides the render region: 'announce' = full-bleed top (above
  // header), 'main' = left form column, 'summary' = under the Order Summary, 'bottom' =
  // full-bleed bottom band (Testimonials → Footer). Announcement Bar is locked to the
  // top; Testimonials/Footer to the bottom (PRD §5.3).
  const CHECKOUT_ZONES = [
    { id: 'announce', label: 'Above header', after: null, col: 'announce', allow: ['announcement-bar'] },
    { id: 'header', label: 'Below header', after: 'checkout-header', col: 'main', allow: CK_CONTENT_FLEX.slice() },
    { id: 'contact', label: 'Below Contact information', after: 'checkout-contact', col: 'main', allow: CK_FLEX.slice() },
    { id: 'shipping', label: 'Below Shipping method', after: 'checkout-shipping-method', col: 'main', allow: CK_FLEX.slice() },
    { id: 'payment', label: 'Below Payment method', after: 'checkout-payment', col: 'main', allow: CK_FLEX.slice() },
    { id: 'cta', label: 'Below CTA', after: 'checkout-cta', col: 'main', allow: CK_FLEX.slice() },
    { id: 'summary', label: 'Below Order Summary', after: 'checkout-order-summary', col: 'summary', allow: CK_FLEX.slice() },
    { id: 'bottom', label: 'Page bottom', after: 'checkout-policy-links', col: 'bottom', allow: ['checkout-testimonials', 'checkout-footer'] },
  ];

  const checkoutSummaryBlocks = (prefix) => [
    { id: prefix + '-blk-lines', kind: 'cart-lines' },
    { id: prefix + '-blk-coupon', kind: 'coupon' },
    { id: prefix + '-blk-subtotal', kind: 'subtotal' },
    { id: prefix + '-blk-discount', kind: 'discount' },
    { id: prefix + '-blk-shipping', kind: 'shipping' },
    { id: prefix + '-blk-tax', kind: 'tax' },
    { id: prefix + '-blk-total', kind: 'total' },
  ];
  const checkoutPolicy = () => ({
    refund_policy_page: 'pg-refund', privacy_policy_page: 'pg-privacy',
    terms_of_service_page: 'pg-terms',
  });
  // Shared records from the production default-template export. The prototype keeps
  // Header / Policy Links as section instances, so the adapter injects these global
  // records into each imported first template without changing the remaining presets.
  const productionHeaderSettings = () => ({
    logo_image: '', logo_width: 128, logo_width_mobile: 128, logo_position: 'center',
    show_trust_text: true, trust_text: '', show_secure_badge: false, secure_text: '',
    show_contact_info: false, contact_title: '', contact_email: '', contact_phone: '',
    show_cart_icon: true, background_color: '', text_color: '', accent_color: '',
    height_pc: 80, height_mobile: 44,
    show_divider: true, custom_css: '',
  });
  const productionPolicySettings = () => ({
    refund_policy_page: '', privacy_policy_page: '', terms_of_service_page: '',
    shipping_policy_page: '', contact_page: '', link_color: '',
    text_size: 'medium', text_alignment: 'left',
  });
  const checkoutTrustBadges = (prefix, opts) => ({
    id: prefix + '-trust', kind: 'checkout-trust-badges', zone: (opts && opts.zone) || 'summary', settings: {
      heading: (opts && opts.heading) || 'Shop with confidence', layout: (opts && opts.layout) || 'grid',
      per_row_desktop: (opts && opts.per_row_desktop) || 2, per_row_mobile: (opts && opts.per_row_mobile) || 1,
      icon_size: (opts && opts.icon_size) || 40,
    }, blocks: [
      { id: prefix + '-trust-payment', kind: 'badge', settings: {
        icon_source: 'builtin', built_in: 'lock', title: 'Secure payment',
        description: 'Your payment information is encrypted and protected.',
      } },
      { id: prefix + '-trust-confirmation', kind: 'badge', settings: {
        icon_source: 'builtin', built_in: 'check', title: 'Email confirmation',
        description: 'We will email your order details after payment.',
      } },
      { id: prefix + '-trust-status', kind: 'badge', settings: {
        icon_source: 'builtin', built_in: 'truck', title: 'Track order status',
        description: 'Follow fulfillment updates from your order confirmation.',
      } },
      { id: prefix + '-trust-privacy', kind: 'badge', settings: {
        icon_source: 'builtin', built_in: 'shield', title: 'Privacy protected',
        description: 'Your personal details are handled securely throughout checkout.',
      } },
    ],
  });

  // Showcase (Draft) helpers — richer decoration samples. Sample reviews / endorsements
  // are layout-only; these templates stay off preset Flows until a merchant replaces them.
  const showcaseAnnouncement = (prefix, messages) => ({
    id: prefix + '-announce', kind: 'announcement-bar', zone: 'announce',
    settings: { navigation: 'arrows', auto_rotate: true, rotate_seconds: 5, text_size: 'medium' },
    blocks: messages.map((text, i) => ({
      id: prefix + '-ann-' + (i + 1), kind: 'message', settings: { text },
    })),
  });
  const showcasePayIcons = (prefix, zone, heading) => ({
    id: prefix + '-payicons', kind: 'checkout-payment-icons', zone: zone,
    settings: { heading: heading || 'We accept', layout: 'inline', alignment: 'left', icon_size: 42 },
    blocks: ['visa', 'mastercard', 'amex', 'paypal', 'applepay', 'shoppay'].map((brand) => ({
      id: prefix + '-pi-' + brand, kind: 'payicon', settings: { icon_source: 'builtin', built_in: brand },
    })),
  });
  const showcaseCountdown = (prefix, zone, opts) => ({
    id: prefix + '-countdown', kind: 'checkout-countdown', zone: zone,
    settings: Object.assign({
      style: 'alert', icon: 'clock', prefix_text: 'We will reserve your order for',
      duration: 12, time_format: 'mmss', expired_behavior: 'stop',
      text_alignment: 'left', background_color: '#FFF8EB', text_color: '#7A4A00',
      border_color: '#F5D9A8', border_radius: 8,
    }, opts || {}),
  });
  const showcaseReviewCard = (prefix, zone, cards) => ({
    id: prefix + '-review', kind: 'checkout-review-card', zone: zone,
    settings: { layout: 'carousel', card_background: '#FFFFFF', border_color: '#E5E5E5', border_radius: 10 },
    blocks: cards.map((card, i) => ({
      id: prefix + '-rc-' + (i + 1), kind: 'card', hidden: false,
      settings: Object.assign({ image: IMG.av2, badge_image: '', image_position: 'left' }, card),
    })),
  });
  const showcaseTrustpilot = (prefix, zone, reviews) => ({
    id: prefix + '-tp', kind: 'checkout-trustpilot', zone: zone,
    settings: { rating_label: 'Excellent', overall_rating: 4.8, show_trustpilot: true, trustpilot_text: 'Trustpilot' },
    blocks: reviews.map((review, i) => ({
      id: prefix + '-tp-' + (i + 1), kind: 'review', hidden: false,
      settings: Object.assign({ star_rating: 5, verified_text: 'Verified customer' }, review),
    })),
  });
  const showcaseTestimonials = (prefix, opts) => ({
    id: prefix + '-tm', kind: 'checkout-testimonials', zone: 'policytop',
    settings: Object.assign({
      subheading: 'Loved by shoppers', heading: 'What our customers say',
      desktop_columns: 3, mobile_columns: 1,
    }, opts || {}),
    blocks: [
      { id: prefix + '-tm-1', kind: 'review', settings: {
        avatar: IMG.av1, round_avatar: true, show_rating: true, rating: 5, author: 'Sarah M.',
        show_verified: true, heading: 'Pure quality',
        content: 'The fit is perfect and the fabric feels amazing. I\u2019ve already ordered two more.',
      } },
      { id: prefix + '-tm-2', kind: 'review', settings: {
        avatar: IMG.av2, round_avatar: true, show_rating: true, rating: 4.5, author: 'James L.',
        show_verified: true, heading: 'Great value',
        content: 'Shipping was fast and the product exceeded my expectations for the price.',
      } },
      { id: prefix + '-tm-3', kind: 'review', settings: {
        avatar: IMG.av3, round_avatar: true, show_rating: true, rating: 5, author: 'Mei K.',
        show_verified: true, heading: 'Obsessed',
        content: 'My new favourite. Comfortable enough to wear every single day.',
      } },
    ],
  });
  const showcaseFooter = (prefix, brand) => ({
    id: prefix + '-footer', kind: 'checkout-footer', zone: 'bottom',
    settings: {
      brand_name: brand || 'AURA',
      disclaimer: '<p>Replace sample reviews and endorsements with your own verified content before you publish.</p>',
      show_policy_links: true, show_contact_info: true,
      contact_email: 'hello@aura.example', copyright_text: 'Copyright {{ year }} · AURA',
      show_payment_icons: true, background_color: '#083B1F', text_color: '#FFFFFF',
      link_color: '#FFFFFF', text_alignment: 'center', padding_top: 40, padding_bottom: 40,
    },
    blocks: [
      { id: prefix + '-ft-p1', kind: 'policy', settings: { link_text: 'Privacy Policy', open_new_tab: true } },
      { id: prefix + '-ft-p2', kind: 'policy', settings: { link_text: 'Refund Policy', open_new_tab: true } },
      { id: prefix + '-ft-p3', kind: 'policy', settings: { link_text: 'Terms of Service', open_new_tab: true } },
      { id: prefix + '-ft-s1', kind: 'social', settings: { platform: 'instagram', open_new_tab: true } },
      { id: prefix + '-ft-s2', kind: 'social', settings: { platform: 'tiktok', open_new_tab: true } },
      { id: prefix + '-ft-s3', kind: 'social', settings: { platform: 'facebook', open_new_tab: true } },
      { id: prefix + '-ft-pay1', kind: 'payment', settings: { icon_source: 'builtin', built_in: 'visa' } },
      { id: prefix + '-ft-pay2', kind: 'payment', settings: { icon_source: 'builtin', built_in: 'mastercard' } },
      { id: prefix + '-ft-pay3', kind: 'payment', settings: { icon_source: 'builtin', built_in: 'amex' } },
      { id: prefix + '-ft-pay4', kind: 'payment', settings: { icon_source: 'builtin', built_in: 'paypal' } },
      { id: prefix + '-ft-pay5', kind: 'payment', settings: { icon_source: 'builtin', built_in: 'applepay' } },
    ],
  });
  const checkoutCoreSections = (prefix, headerSettings, additions) => {
    const extras = additions || [];
    const inZone = (zone) => extras.filter((section) => section.zone === zone);
    const knownZones = ['announce', 'header', 'contact', 'shipping', 'payment', 'cta', 'summary', 'bottom'];
    const unzoned = extras.filter((section) => !section.zone || knownZones.indexOf(section.zone) < 0);
    const core = [
      ...inZone('announce'),
      { id: prefix + '-header', kind: 'checkout-header', settings: headerSettings || {} },
      { id: prefix + '-summary-bar', kind: 'checkout-order-summary-bar' },
      ...inZone('header'),
      { id: prefix + '-express', kind: 'checkout-express' },
      { id: prefix + '-contact', kind: 'checkout-contact' },
      ...inZone('contact'),
      { id: prefix + '-shipinfo', kind: 'checkout-shipping-info' },
      { id: prefix + '-shipmethod', kind: 'checkout-shipping-method' },
      ...inZone('shipping'),
      { id: prefix + '-payment', kind: 'checkout-payment' },
      ...inZone('payment'),
    ];
    core.push(
      { id: prefix + '-cta', kind: 'checkout-cta', settings: { button_text: 'Pay now' } },
      ...inZone('cta'),
      { id: prefix + '-summary', kind: 'checkout-order-summary', blocks: checkoutSummaryBlocks(prefix) },
      ...inZone('summary'),
      { id: prefix + '-policy', kind: 'checkout-policy-links', settings: checkoutPolicy() },
      ...unzoned,
      ...inZone('bottom'),
    );
    return core;
  };

  // First Checkout preset mirrors defaulttemplates/checkout.json. Disabled addable
  // sections stay in the tree so merchants can opt in without recreating their content.
  const FIRST_PURCHASE_CHECKOUT_TEMPLATE = {
    sections: [
      { id: 'nco-ck-header', kind: 'checkout-header', settings: productionHeaderSettings() },
      { id: 'nco-ck-summary-bar', kind: 'checkout-order-summary-bar', settings: {
        heading: 'Order summary', mobile_default: 'expanded',
      } },
      { id: 'nco-ck-static-content-1', kind: 'checkout-static-content', zone: 'header', hidden: true, settings: {
        content_style: 'notice', icon: 'check', icon_image: '',
        heading: 'Your payment is protected',
        content: '<p>Card details stay encrypted. We email your confirmation immediately and send tracking as soon as the order ships. Your personal information is not shared.</p>',
        link_text: '', link_url: '', open_new_tab: true, text_alignment: 'left',
        background_color: '#F0F9EB', text_color: '#1F1F1F',
        border_color: '#CDEBC8', border_radius: 4, custom_css: '',
      } },
      { id: 'nco-ck-express', kind: 'checkout-express', settings: {
        heading: 'Express checkout',
      } },
      { id: 'nco-ck-contact', kind: 'checkout-contact', settings: {
        heading: 'Contact', email_placeholder: 'Email or mobile phone number',
        show_sign_in_link: true, sign_in_text: 'Sign in',
      } },
      { id: 'nco-ck-shipinfo', kind: 'checkout-shipping-info', settings: {
        heading: 'Delivery', country_label: 'Country/Region',
        first_name_placeholder: 'First name', last_name_placeholder: 'Last name',
        address_placeholder: 'Address', apartment_placeholder: 'Apt, suite, unit, etc (optional)',
        city_placeholder: 'City', state_placeholder: 'State/province',
        zip_placeholder: 'ZIP code', phone_placeholder: 'Phone number',
      } },
      { id: 'nco-ck-shipmethod', kind: 'checkout-shipping-method', settings: {
        heading: 'Shipping method',
        empty_state_text: 'Enter your shipping address to view available shipping methods.',
        selected_border_color: '',
      } },
      { id: 'nco-ck-payment', kind: 'checkout-payment', settings: {
        heading: 'Payment', description: 'All transactions are secure and encrypted.',
      } },
      { id: 'nco-ck-cta', kind: 'checkout-cta', settings: {
        button_text: 'Pay now', button_full_width: true, loading_text: 'Processing...',
        button_background: '', button_text_color: '', button_border_radius: '',
      } },
      { id: 'nco-ck-trust-badges-2', kind: 'checkout-trust-badges', zone: 'cta', hidden: true, settings: {
        content_mode: 'structured', heading: 'Protected at every step', full_image: '',
        layout: 'grid', per_row_desktop: 2, per_row_mobile: 2, icon_size: 28,
        background_color: '#ffffff', text_color: '#333', border_color: 'transparent',
        border_radius: 4, custom_css: '',
      }, blocks: [
        { id: 'nco-ck-trust-badge-4', kind: 'badge', settings: {
          icon_source: 'builtin', built_in: 'lock', custom_image: '',
          title: 'Secure payment', description: 'Your payment information is encrypted and protected.',
        } },
        { id: 'nco-ck-trust-badge-5', kind: 'badge', settings: {
          icon_source: 'builtin', built_in: 'check', custom_image: '',
          title: 'Email confirmation', description: 'We will email your order details after payment.',
        } },
        { id: 'nco-ck-trust-badge-6', kind: 'badge', settings: {
          icon_source: 'builtin', built_in: 'truck', custom_image: '',
          title: 'Track order status', description: 'Follow fulfillment updates from your order confirmation.',
        } },
        { id: 'nco-ck-trust-badge-7', kind: 'badge', settings: {
          icon_source: 'builtin', built_in: 'shield', custom_image: '',
          title: 'Privacy protected', description: 'Your personal details are handled securely throughout checkout.',
        } },
      ] },
      { id: 'nco-ck-summary', kind: 'checkout-order-summary', settings: {
        heading: 'Order summary', show_heading_pc: true, show_heading_mobile: true,
        mobile_default: 'collapsed',
      }, blocks: [
        { id: 'nco-ck-blk-lines', kind: 'cart-lines' },
        { id: 'nco-ck-blk-coupon', kind: 'coupon', settings: {
          show_coupon: true, placeholder: 'Discount code',
        } },
        { id: 'nco-ck-blk-subtotal', kind: 'subtotal', settings: { label: 'Subtotal' } },
        { id: 'nco-ck-blk-discount', kind: 'discount' },
        { id: 'nco-ck-blk-shipping', kind: 'shipping', settings: {
          label: 'Shipping', zero_value: 'free',
        } },
        { id: 'nco-ck-blk-total', kind: 'total', settings: { label: 'Total' } },
      ] },
      { id: 'nco-ck-policy', kind: 'checkout-policy-links', settings: productionPolicySettings() },
    ],
  };

  // Returning-customer checkout: keep the signed-in journey fast and concise. The Flow
  // supplies identity; Theme only presents the saved-address-aware checkout structure.
  const RETURNING_CUSTOMER_CHECKOUT_TEMPLATE = {
    sections: checkoutCoreSections('rcc-ck', {
      show_trust_text: true, trust_text: 'Secure checkout',
      show_secure_badge: false, show_contact_info: false, show_cart_icon: true,
    }, [
      { id: 'rcc-ck-guidance', kind: 'checkout-static-content', zone: 'header', settings: {
        content_style: 'notice', icon: 'check', heading: 'Ready when you are',
        content: '<p>Review your delivery and payment details, then place your order when you\u2019re ready. We\u2019ll keep you updated by email.</p>',
        text_alignment: 'left',
      } },
      checkoutTrustBadges('rcc-ck'),
    ]),
  };

  // Residual A/B Variant A: identity-neutral security layer.
  // Header / Footer are shared, so this variant does not customize them.
  // Announcement bar and payment icons are intentionally omitted — the split
  // uses page-only trust components around the payment decision.
  const TRUST_LED_CHECKOUT_TEMPLATE = {
    sections: checkoutCoreSections('ab-trust', {
      show_trust_text: true, trust_text: 'Secure checkout',
      show_secure_badge: false, show_contact_info: false, show_cart_icon: true,
    }, [
      { id: 'ab-trust-intro', kind: 'checkout-static-content', zone: 'header', settings: {
        content_style: 'notice', icon: 'shield', heading: 'Your payment is protected',
        content: '<p>Card details stay encrypted in transit. We email confirmation as soon as you pay and send tracking when the order ships. Your personal information is not shared.</p>',
        text_alignment: 'left',
      } },
      checkoutTrustBadges('ab-trust', {
        zone: 'payment', heading: 'Protected at every step', per_row_desktop: 2, per_row_mobile: 1,
      }),
      showcaseReviewCard('ab-trust', 'summary', [
        { image: IMG.av2, title: 'Checkout you can trust',
          content: '\u201cThe payment step felt considered \u2014 encrypted, quiet, and I had confirmation in my inbox before I closed the tab.\u201d',
          author_name: 'Jordan Hale', author_subtitle: 'Verified buyer' },
        { image: IMG.av1, title: 'Privacy first',
          content: '\u201cI only needed the details required to ship. No extra account, no surprises after I paid.\u201d',
          author_name: 'Mina Cho', author_subtitle: 'Verified buyer' },
      ]),
      showcaseTrustpilot('ab-trust', 'summary', [
        { review_title: 'Paid without a hitch', review_content: 'Checkout was short and the confirmation email arrived immediately. Tracking showed up as soon as it shipped.', reviewer_name: 'Hannah W.', review_date: 'May 18, 2026' },
        { review_title: 'Felt secure', review_content: 'Card form looked standard and protected. I never felt like I was leaving extra data behind.', reviewer_name: 'Marco D.', review_date: 'May 9, 2026' },
      ]),
    ]),
  };

  // Residual A/B Variant B: transaction skeleton only. No notice card, badges,
  // payment icons, countdown or commerce boosters.
  const CONCISE_CHECKOUT_TEMPLATE = {
    sections: checkoutCoreSections('ab-concise', {
      show_trust_text: true, trust_text: 'Secure checkout',
      show_secure_badge: false, show_contact_info: false, show_cart_icon: true,
    }),
  };

  // Backward-compatible fallback for code paths that still expect one Checkout seed.
  const CHECKOUT_TEMPLATE = FIRST_PURCHASE_CHECKOUT_TEMPLATE;

  // Mock order used for the checkout preview (PRD §14.2). Amounts are illustrative;
  // in production the order calculation service is the source of truth.
  const CHECKOUT_MOCK = {
    storeName: 'AURA',
    country: 'United States',
    currency: 'USD',
    countries: ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'Japan'],
    states: ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington', 'Massachusetts', 'Georgia'],
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Seattle', 'Boston', 'Atlanta', 'Miami'],
    phoneCodes: ['+1', '+44', '+61', '+49', '+81', '+86', '+33'],
    cart: [
      { id: 'l1', title: 'Linen-feel wide pants', variant: 'Sand / M', qty: 1, price: 32.99, compareAt: 45.0, deal: 'EXTRA SALE', image: IMG.p1 },
      { id: 'l2', title: 'Soft rib tee', variant: 'Forest / S', qty: 2, price: 18.99, compareAt: 26.0, deal: 'BUY 2 SAVE 30%', image: IMG.p2 },
      { id: 'l3', title: 'Pleated midi skirt', variant: 'Black / M', qty: 1, price: 38.0, compareAt: 49.0, deal: 'CLEARANCE', image: IMG.p6 },
      // Subscription lines — the line price already reflects the subscription saving
      // (compareAt − save = price); the cadence tag is informational (Item 3).
      { id: 'l4', title: '04 Normal product - single variant', variant: '', qty: 1, price: 10.39, compareAt: 12.99, image: IMG.p4,
        subscription: { label: 'Delivery every 1 month', save: 2.6 } },
      { id: 'l5', title: '05 Normal product - multiple variants', variant: 'Citrus, 24 Pack', qty: 1, price: 15.19, compareAt: 18.99, image: IMG.p5,
        subscription: { label: 'Delivery every 2 months', save: 3.8 } },
      // Bundle parent — black "Bundle" badge instead of a thumb, BUNDLE-discount deal
      // tag (compareAt − price), followed by indented "Included" children (no own price).
      { id: 'l6', title: '03 Bundle product - one-time purchase', variant: '', qty: 1, price: 42.0, compareAt: 49.98, deal: 'BUNDLE discount', image: IMG.p3,
        bundle: true, bundleItems: [
          { title: 'Bundle item A - Focus Gum', variant: '12 Pack', qty: 1, image: IMG.p1 },
          { title: 'Bundle item B - Refill Pack', variant: 'Mint, 24 Pack', qty: 1, image: IMG.p2 },
        ] },
    ],
    shippingMethods: [
      { id: 'standard', name: 'Standard Shipping', eta: '', desc: '4–7 business days', price: 8.99 },
      { id: 'vip', name: 'VIP Shipping', eta: '', desc: '1–2 business days · priority handling', price: 12.99 },
    ],
    selectedShipping: 'standard',
    coupon: { code: 'WELCOME10', amount: 10.99 },
    // Valid demo discount codes (case-insensitive). Shopify itemises discounts into
    // three types (Item 2): product / order / shipping. Each entry is an object with
    // any of {product, order, shipping}; a plain number is treated as a product
    // discount (backward-compat). The applied coupon carries this breakdown so the
    // Order Summary can render a separate row per non-zero discount type.
    coupons: {
      WELCOME10: { product: 10.99 },       // product (line-item) discount
      WELCOME5: { order: 5.0 },            // seeded Checkout order discount
      SAVE10: { order: 10.0 },             // order discount (matches reference)
      SHIP5: { shipping: 5.0 },            // shipping discount (negative shipping line)
      BUNDLE15: { product: 5.0, order: 7.0, shipping: 3.0 }, // demos all three at once
      THANKS: { order: 7.0 },               // seeded by default — order discount
      FREESHIP: { shipping: 8.99 },         // seeded by default — makes Standard Shipping free
    },
    tax: 7.34,
    // Signed-in demo account (Item 1). The signed-in flag itself is a runtime toggle
    // shared by Contact + Delivery (OS.ckState['ck-account']), default signed OUT.
    // Multiple saved addresses power the Delivery "Ship to" radio list; the one with
    // default:true is pre-selected. line1 = street, line2 = "city/region zip, country".
    account: {
      email: 'cxc8697@gmail.com',
      addresses: [
        { id: 'a1', name: 'Xican Chen', line1: '31972 NW Pacific Coast Hwy', line2: 'Waldport OR 97394, US', phone: '4153334567', default: true },
        { id: 'a2', name: 'Xican Chen', line1: '10th arrondissement of Paris', line2: '75010 Paris, FR', phone: '100000000' },
        { id: 'a3', name: 'Xican Chen', line1: 'dfdfdf Benar Road Shankar Vihar Extension Rani Bagh', line2: '302012 Jaipur RJ, IN', phone: '4153334567' },
        { id: 'a4', name: 'Xican Chen', line1: '670 North Commercial St', line2: 'Manchester NH 03101, US', phone: '4153334567' },
        { id: 'a5', name: 'HK', line1: '', line2: '' },
      ],
      shippingSummary: 'Estimated Delivery Time: 4-8 Business Days · FREE',
    },
  };

  // Add-component catalog for the Checkout editor, grouped into MECE categories by
  // function / use-case. Powers the "Add component" modal (same UX as the Online Store
  // "Add section" modal). Every addable checkout component belongs to exactly one group,
  // and together the groups cover all addable components (mutually exclusive + exhaustive).
  const CHECKOUT_CATALOG = [
    { label: 'Commerce boosters', entries: [
      { kind: 'checkout-product-upsell', name: 'Product upsell', desc: 'Recommend extra products with one-tap add' },
      { kind: 'checkout-shipping-insurance', name: 'Shipping Insurance', desc: 'Tickable delivery-protection service' },
      { kind: 'checkout-vip-club', name: 'VIP Club', desc: 'Tickable membership add-on' },
    ] },
    { label: 'Reviews & social proof', entries: [
      { kind: 'checkout-trustpilot', name: 'Trustpilot Review', desc: 'Trustpilot-style rating & reviews (static)' },
      { kind: 'checkout-review-card', name: 'Review card', desc: 'Expert / media endorsement cards' },
      { kind: 'checkout-testimonials', name: 'Testimonials', desc: 'Customer reviews (bottom area only)' },
      { kind: 'checkout-fb-comments', name: 'Facebook-style Comments', desc: 'Social-proof comment thread' },
    ] },
    { label: 'Trust & security', entries: [
      { kind: 'checkout-trust-badges', name: 'Trust badges', desc: 'Guarantee / security / shipping badges' },
      { kind: 'checkout-payment-icons', name: 'Payment Icons', desc: 'Accepted-payment brand badges' },
    ] },
    { label: 'Promotion & urgency', entries: [
      { kind: 'announcement-bar', name: 'Announcement Bar', desc: 'Top promo / free-shipping bar' },
      { kind: 'checkout-countdown', name: 'Countdown', desc: 'Static urgency / reservation timer' },
    ] },
    { label: 'Content & structure', entries: [
      { kind: 'checkout-static-content', name: 'Static content', desc: 'Notice / rich-text content block' },
      { kind: 'checkout-footer', name: 'Footer', desc: 'Checkout footer (bottom of page only)' },
    ] },
  ];

  // ==========================================================================
  //  POST-PURCHASE OFFER PAGES — Upsell + Downsell
  //  Both pages reuse one locked transaction-safe skeleton. Existing Checkout
  //  content/trust components remain addable; cart-mutating commerce boosters are
  //  intentionally excluded because the original Checkout has already completed.
  // ==========================================================================
  const OFFER_FLEX = ['checkout-countdown', 'checkout-trust-badges', 'checkout-static-content',
    'checkout-payment-icons', 'checkout-trustpilot', 'checkout-review-card', 'checkout-fb-comments'];
  const OFFER_ZONES = [
    { id: 'announce', label: 'Above header', after: null, col: 'announce', allow: ['announcement-bar'] },
    { id: 'header', label: 'Below order confirmation', after: 'checkout-offer-header', col: 'main', allow: OFFER_FLEX.slice() },
    { id: 'progress', label: 'Below progress', after: 'checkout-offer-progress', col: 'main', allow: OFFER_FLEX.slice() },
    { id: 'offer', label: 'Below offer', after: 'checkout-offer-product', col: 'main', allow: OFFER_FLEX.slice() },
    { id: 'policytop', label: 'Below Policy Links', after: 'checkout-policy-links', col: 'bottom', allow: ['checkout-testimonials'] },
    { id: 'bottom', label: 'Page bottom', after: 'checkout-policy-links', col: 'bottom', allow: ['checkout-footer'] },
  ];
  const OFFER_CATALOG = CHECKOUT_CATALOG
    .filter((g) => g.label !== 'Commerce boosters')
    .map((g) => ({ label: g.label, entries: g.entries.map((e) => Object.assign({}, e, {
      defaultZone: e.kind === 'announcement-bar' ? 'announce'
        : e.kind === 'checkout-testimonials' ? 'policytop'
        : e.kind === 'checkout-footer' ? 'bottom'
        : e.kind === 'checkout-countdown' || e.kind === 'checkout-static-content' ? 'progress'
        : 'offer',
    })) }));

  // The recommendation preview resolves product + variant references from this catalog. It intentionally
  // carries product availability alongside Offer quote fields so the editor can demonstrate
  // filtering without pretending to own the production inventory/Market checks.
  const offerCatalog = () => SAMPLE.products.map((product, index) => {
    const price = +product.price;
    const compareAt = +(product.compareAt || product.price).toFixed(2);
    const variants = (product.variants || []).map((variant) => {
      const variantPrice = +variant.price;
      const variantCompare = +(variant.compareAt || variant.price).toFixed(2);
      return {
        id: variant.id, title: variant.title, price: variantPrice, compareAt: variantCompare,
        total: variantPrice, savings: 'Save ' + Math.max(0, Math.round((1 - variantPrice / variantCompare) * 100)) + '%',
        available: variant.available !== false,
      };
    });
    return {
      id: product.id, title: product.title, image: product.image, status: product.status, bestSellerRank: index + 1,
      published: product.published !== false, marketSupported: product.marketSupported !== false,
      available: product.available !== false, inventory: product.inventory == null ? 20 : product.inventory,
      price, compareAt, total: price,
      savings: 'Save ' + Math.max(0, Math.round((1 - price / compareAt) * 100)) + '%',
      rating: product.rating, reviewCount: product.reviews,
      description: 'Add ' + product.title.toLowerCase() + ' to the order you just completed at an exclusive post-purchase price.',
      variantLabel: variants.length ? 'Color / size' : '', variants,
      selectedVariantId: variants.length ? variants[0].id : '',
      quantity: 1, quantityOptions: [1, 2, 3], shippingLabel: 'Free',
    };
  });
  const OFFER_MOCKS = {
    upsell: {
      storeName: 'AURA', confirmationNumber: 'NWRGFFKTF', orderNumber: '#1001', currency: 'USD',
      catalog: offerCatalog(),
      mockOrderProducts: [
        { productId: 'p1', variantId: '', quantity: 1, paidAmount: 32.99 },
        { productId: 'p2', variantId: '', quantity: 2, paidAmount: 37.98 },
        { productId: 'p5', variantId: '', quantity: 1, paidAmount: 44.00 },
      ],
      previouslyDisplayedProductIds: [],
      acceptedProductIds: [],
      products: [
        {
          id: 'creatine-3', title: 'Creatine (3 Extra)', image: IMG.p3, compareAt: 49.99, price: 35.00, total: 104.98,
          savings: 'Save 30%', rating: 4.9, reviewCount: 125,
          description: 'Don\u2019t miss out on this offer. It expires after you leave this page.',
          variantLabel: 'Flavor / pack', selectedVariantId: 'berry-3',
          variants: [
            { id: 'berry-3', title: 'Berry · 3 tubs', price: 35, compareAt: 49.99, total: 104.98, savings: 'Save 30%' },
            { id: 'lemon-3', title: 'Lemon · 3 tubs', price: 36, compareAt: 49.99, total: 107.98, savings: 'Save 28%' },
            { id: 'unflavored-3', title: 'Unflavored · 3 tubs', price: 32, compareAt: 47.99, total: 95.98, savings: 'Save 33%' },
          ],
          quantity: 3, quantityOptions: [1, 2, 3], shippingLabel: 'Free',
        },
        {
          id: 'hydration-pack', title: 'Daily Hydration Pack', image: IMG.p4, compareAt: 42.00, price: 28.00, total: 28.00,
          savings: 'Save 33%', rating: 4.8, reviewCount: 88,
          description: 'Add an easy daily hydration boost to the order you just completed.',
          variantLabel: 'Flavor', selectedVariantId: 'citrus',
          variants: [
            { id: 'citrus', title: 'Citrus', price: 28, compareAt: 42, total: 28, savings: 'Save 33%' },
            { id: 'berry', title: 'Mixed berry', price: 28, compareAt: 42, total: 28, savings: 'Save 33%' },
          ],
          quantity: 1, quantityOptions: [1, 2], shippingLabel: 'Free',
        },
        {
          id: 'recovery-bundle', title: 'Recovery Essentials Bundle', image: IMG.p5, compareAt: 74.00, price: 49.00, total: 49.00,
          savings: 'Save 34%', rating: 4.7, reviewCount: 64,
          description: 'Complete your routine with a one-time recovery bundle at a post-purchase price.',
          variantLabel: 'Bundle', selectedVariantId: 'standard',
          variants: [
            { id: 'standard', title: 'Standard bundle', price: 49, compareAt: 74, total: 49, savings: 'Save 34%' },
            { id: 'plus', title: 'Plus bundle', price: 62, compareAt: 89, total: 62, savings: 'Save 30%' },
          ],
          quantity: 1, quantityOptions: [1], shippingLabel: 'Free',
        },
        {
          id: 'travel-shaker', title: 'Travel Shaker Set', image: IMG.p6, compareAt: 24.00, price: 16.00, total: 16.00,
          savings: 'Save 33%', rating: 4.6, reviewCount: 51,
          description: 'A compact shaker set ready for training days and travel.',
          quantity: 1, quantityOptions: [1, 2, 3], shippingLabel: 'Free',
        },
      ],
    },
    downsell: {
      storeName: 'AURA', confirmationNumber: 'NWRGFFKTF', orderNumber: '#1001', currency: 'USD',
      catalog: offerCatalog(),
      mockOrderProducts: [
        { productId: 'p1', variantId: '', quantity: 1, paidAmount: 32.99 },
        { productId: 'p2', variantId: '', quantity: 2, paidAmount: 37.98 },
        { productId: 'p5', variantId: '', quantity: 1, paidAmount: 44.00 },
      ],
      precedingUpsellOfferProducts: [
        { productId: 'p3', effectivePrice: 37.35 },
        { productId: 'p6', effectivePrice: 34.20 },
        { productId: 'p7', effectivePrice: 26.10 },
        { productId: 'p8', effectivePrice: 14.40 },
      ],
      previouslyDisplayedProductIds: ['p3', 'p6', 'p7', 'p8'],
      acceptedProductIds: [],
      products: [
        {
          id: 'creatine-1', title: 'Creatine (1 Extra)', image: IMG.p3, compareAt: 29.99, price: 19.99, total: 19.99,
          savings: 'Save 33%', rating: 4.9, reviewCount: 125,
          description: 'Try one extra tub at our lowest one-time price. This offer disappears when you leave.',
          variantLabel: 'Flavor', selectedVariantId: 'berry-1',
          variants: [
            { id: 'berry-1', title: 'Berry', price: 19.99, compareAt: 29.99, total: 19.99, savings: 'Save 33%' },
            { id: 'lemon-1', title: 'Lemon', price: 20.99, compareAt: 29.99, total: 20.99, savings: 'Save 30%' },
            { id: 'unflavored-1', title: 'Unflavored', price: 18.99, compareAt: 28.99, total: 18.99, savings: 'Save 34%' },
          ],
          quantity: 1, quantityOptions: [1], shippingLabel: 'Free',
        },
        {
          id: 'hydration-sample', title: 'Hydration Sample Pack', image: IMG.p4, compareAt: 18.00, price: 12.00, total: 12.00,
          savings: 'Save 33%', rating: 4.8, reviewCount: 88,
          description: 'Try a smaller hydration pack without re-entering your payment details.',
          quantity: 1, quantityOptions: [1, 2], shippingLabel: 'Free',
        },
        {
          id: 'recovery-mini', title: 'Mini Recovery Kit', image: IMG.p5, compareAt: 32.00, price: 22.00, total: 22.00,
          savings: 'Save 31%', rating: 4.7, reviewCount: 64,
          description: 'A compact recovery kit at a final one-time price.',
          quantity: 1, quantityOptions: [1], shippingLabel: 'Free',
        },
        {
          id: 'single-shaker', title: 'Classic Shaker', image: IMG.p6, compareAt: 16.00, price: 10.00, total: 10.00,
          savings: 'Save 38%', rating: 4.6, reviewCount: 51,
          description: 'Add one classic shaker before completing your order.',
          quantity: 1, quantityOptions: [1, 2], shippingLabel: 'Free',
        },
      ],
    },
  };

  const offerPolicy = () => ({
    refund_policy_page: 'pg-refund', privacy_policy_page: 'pg-privacy',
    terms_of_service_page: 'pg-terms', contact_page: 'pg-contact',
  });
  const offerSections = (prefix, config, additions) => {
    const extras = additions || [];
    const inZone = (zone) => extras.filter((section) => section.zone === zone);
    return [
      ...inZone('announce'),
      { id: prefix + '-header', kind: 'checkout-offer-header', settings: {
        confirmation_label: 'Confirmation', paid_message: 'You\u2019ve paid for your order.',
        show_order_link: true, order_link_text: 'View order confirmation',
      } },
      ...inZone('header'),
      { id: prefix + '-progress', kind: 'checkout-offer-progress', settings: {
        order_label: 'Order confirmed', offer_label: config.progressLabel,
        complete_label: 'Complete', show_labels: true,
      } },
      { id: prefix + '-intro', kind: 'checkout-static-content', zone: 'progress', settings: {
        content_style: 'plain', icon: 'none', text_alignment: 'center',
        background_color: 'transparent', border_color: 'transparent',
        heading: config.heading, content: '<p>' + config.body + '</p>',
      } },
      ...inZone('progress'),
      { id: prefix + '-product', kind: 'checkout-offer-product', settings: {
        recommendation_rule: 'best_sellers',
        fill_default_products: true,
        maximum_products: config.maximumProducts,
        discount_type: 'percentage',
        discount_value: config.discount,
        multiple_layout: config.multipleLayout,
        layout: 'image_left',
        image_ratio: 'square',
        show_compare_price: true,
        show_savings: true,
        show_rating: true,
        show_description: true,
        show_variant: true,
        show_quantity: config.showQuantity,
        show_shipping: true,
        accept_text: config.acceptText,
        decline_text: config.declineText,
        show_payment_note: true,
        payment_note: 'Uses the payment method from your completed checkout',
      } },
      ...inZone('offer'),
      { id: prefix + '-policy', kind: 'checkout-policy-links', settings: offerPolicy() },
      ...inZone('policytop'),
      ...inZone('bottom'),
    ];
  };

  const productionOfferSections = (prefix, config) => [
    { id: prefix + '-header', kind: 'checkout-offer-header', settings: {
      logo_image: '', logo_text: '', logo_position: 'left',
      confirmation_label: 'Confirmation #', paid_message: 'You\u2019ve paid for your order.',
      show_order_link: true, order_link_text: 'View order confirmation',
      background_color: '#FFFFFF', text_color: '#000000', accent_color: '',
      custom_css: '',
    } },
    { id: prefix + '-progress', kind: 'checkout-offer-progress', settings: {
      order_label: 'Order confirmed', offer_label: 'Special offer', complete_label: 'Complete',
      active_color: '', text_color: '#121927',
      background_color: '#FFFFFF', custom_css: '',
    } },
    { id: prefix + '-intro', kind: 'checkout-static-content', zone: 'progress', settings: {
      content_style: 'plainText', icon: 'none', icon_image: '',
      heading: config.heading, content: '<p>' + config.body + '</p>',
      link_text: '', link_url: '', open_new_tab: true, text_alignment: 'center',
      background_color: '#ffffff', text_color: '#433134',
      border_color: '#ffffff', border_radius: 0, custom_css: '',
    } },
    { id: prefix + '-product', kind: 'checkout-offer-product', settings: {
      recommendation_rule: 'best_sellers', specific_products: [], default_products: [],
      product_mappings: [], fill_default_products: config.fillDefaultProducts,
      maximum_products: 1, discount_type: 'percentage', discount_value: config.discount,
      multiple_layout: 'stacked', layout: 'image_left', image_ratio: 'square',
      show_compare_price: true, show_savings: true, show_rating: true,
      show_variant: true, show_quantity: true,
      quantity_label: 'Quantity', show_shipping: true,
      accept_text: config.acceptText, decline_text: config.declineText,
      show_payment_note: true,
      payment_note: 'Uses the payment method from your completed checkout',
      card_background: '#FFFFFF', border_radius: 0, text_color: '#433134',
      savings_color: '#121927', button_background: '', button_text_color: '',
    } },
    { id: prefix + '-policy', kind: 'checkout-policy-links', settings: productionPolicySettings() },
  ];

  const NEW_CUSTOMER_UPSELL_TEMPLATE = { sections: productionOfferSections('nco-up', {
    heading: 'A little something for your first order',
    body: 'Your order is confirmed. Add a customer favorite now without entering your payment details again.',
    fillDefaultProducts: true, discount: 15,
    acceptText: 'Add to my order · {amount}', declineText: 'No thanks, continue',
  }) };
  const NEW_CUSTOMER_DOWNSELL_TEMPLATE = { sections: productionOfferSections('nco-dn', {
    heading: 'Prefer something smaller?',
    body: 'Here is one lower-priced customer favorite you can add before we complete your order.',
    fillDefaultProducts: false, discount: 20,
    acceptText: 'Add this offer · {amount}', declineText: 'No thanks, complete my order',
  }) };
  const RETURNING_CUSTOMER_UPSELL_TEMPLATE = { sections: offerSections('rcc-up', {
    progressLabel: 'Recommended for you',
    heading: 'Add more to your order',
    body: 'Choose any popular additions below. Your payment details are already confirmed.',
    maximumProducts: 4, discount: 10, multipleLayout: 'grid', showQuantity: true,
    acceptText: 'Add to my order · {amount}', declineText: 'No thanks, continue',
  }) };
  const RETURNING_CUSTOMER_DOWNSELL_TEMPLATE = { sections: offerSections('rcc-dn', {
    progressLabel: 'Value picks',
    heading: 'A few lower-priced picks',
    body: 'These popular additions are priced below the offer you just passed on.',
    maximumProducts: 2, discount: 15, multipleLayout: 'grid', showQuantity: true,
    acceptText: 'Add this offer · {amount}', declineText: 'No thanks, complete my order',
  }) };
  const RESIDUAL_UPSELL_TEMPLATE = { sections: offerSections('ab-up', {
    progressLabel: 'Special offer',
    heading: 'Add a popular extra',
    body: 'Your order is confirmed. Add a customer favorite now without entering your payment details again.',
    maximumProducts: 2, discount: 15, multipleLayout: 'stacked', showQuantity: true,
    acceptText: 'Add to my order · {amount}', declineText: 'No thanks, continue',
  }) };
  const RESIDUAL_DOWNSELL_TEMPLATE = { sections: offerSections('ab-dn', {
    progressLabel: 'Smaller offer',
    heading: 'Prefer a smaller add-on?',
    body: 'Here is one lower-priced customer favorite you can add before we complete your order.',
    maximumProducts: 1, discount: 20, multipleLayout: 'stacked', showQuantity: false,
    acceptText: 'Add this offer · {amount}', declineText: 'No thanks, complete my order',
  }) };

  // Showcase drafts — richer decoration to demonstrate Theme capability. Not bound
  // to New / Returning / Residual preset Flows. Sample social proof is layout-only.
  const SOCIAL_PROOF_CHECKOUT_TEMPLATE = {
    sections: checkoutCoreSections('sp-ck', {
      show_trust_text: true, trust_text: 'Rated 4.8 by shoppers',
      show_secure_badge: true, secure_text: 'SSL secure',
      show_contact_info: false, show_cart_icon: true,
    }, [
      showcaseAnnouncement('sp-ck', [
        'Loved by 12,000+ shoppers this season',
        'Free shipping on orders over $79',
        'Easy 30-day returns · hassle-free',
      ]),
      { id: 'sp-ck-intro', kind: 'checkout-static-content', zone: 'header', settings: {
        content_style: 'notice', icon: 'check', heading: 'Join thousands of happy orders',
        content: '<p>Checkout is encrypted. Your confirmation arrives instantly, and shoppers rate this store Excellent on Trustpilot.</p>',
        text_alignment: 'left',
      } },
      showcaseCountdown('sp-ck', 'header', {
        prefix_text: 'Your cart is reserved for', duration: 10,
      }),
      { id: 'sp-ck-grab', kind: 'checkout-product-upsell', zone: 'contact', settings: {
        heading: 'Customers also grabbed', product_source: 'manual',
        products: ['p3', 'p4', 'p5'], products_limit: 3,
        layout_desktop: 'slider', layout_mobile: 'slider',
      } },
      showcasePayIcons('sp-ck', 'payment'),
      showcaseReviewCard('sp-ck', 'summary', [
        { image: IMG.av2, title: 'Dermatologist Recommended',
          content: '\u201cIn my practice I look for formulas that are gentle yet effective \u2014 this is one I happily recommend to my own patients.\u201d',
          author_name: 'Dr. Elena Ross', author_subtitle: 'Board-certified Dermatologist' },
        { image: IMG.av1, title: 'As seen in Vogue',
          content: '\u201cA quiet luxury staple that actually earns its keep \u2014 polished enough for evening, easy enough for every day.\u201d',
          author_name: 'Editorial desk', author_subtitle: 'Vogue Shopping' },
      ]),
      showcaseTrustpilot('sp-ck', 'summary', [
        { review_title: 'Exactly as described', review_content: 'Ordering was effortless and the quality blew me away. Shipping was quick too \u2014 will definitely buy again.', reviewer_name: 'Hannah W.', review_date: 'May 18, 2026' },
        { review_title: 'Great experience', review_content: 'Customer service answered all my questions fast and the product is fantastic value.', reviewer_name: 'Marco D.', review_date: 'May 9, 2026' },
        { review_title: 'Will buy again', review_content: 'Fit is true to size and the fabric feels expensive. Already telling friends.', reviewer_name: 'Priya S.', review_date: 'Apr 28, 2026', star_rating: 4 },
      ]),
      checkoutTrustBadges('sp-ck', { heading: 'Shop with confidence' }),
      showcaseTestimonials('sp-ck'),
      showcaseFooter('sp-ck'),
    ]),
  };
  const LIMITED_PROOF_UPSELL_TEMPLATE = { sections: offerSections('lp-up', {
    progressLabel: 'Limited offer',
    heading: 'A time-sensitive extra',
    body: 'Add a customer favorite with the payment method you just used. Sample reviews are for layout only \u2014 replace them before you publish.',
    maximumProducts: 2, discount: 18, multipleLayout: 'stacked', showQuantity: true,
    acceptText: 'Add this offer · {amount}', declineText: 'No thanks, continue',
  }, [
    showcaseAnnouncement('lp-up', [
      'This offer is only available on this page',
      'No payment details needed \u2014 one tap to add',
    ]),
    showcaseCountdown('lp-up', 'progress', {
      style: 'alert', icon: 'fire', prefix_text: 'This page-only offer expires in',
      duration: 8, background_color: '#FFF2F2', text_color: '#B42318', border_color: '#F5C2C2',
    }),
    showcaseReviewCard('lp-up', 'offer', [
      { image: IMG.av2, title: 'Most shoppers add this',
        content: '\u201cI almost skipped the extra \u2014 glad I didn\u2019t. It completed the set and arrived with my original order.\u201d',
        author_name: 'Alex P.', author_subtitle: 'Verified buyer' },
    ]),
    showcaseTestimonials('lp-up', { subheading: 'Post-purchase picks', heading: 'Shoppers who added this extra' }),
    showcaseFooter('lp-up'),
  ]) };
  const GENTLE_LAST_CHANCE_DOWNSELL_TEMPLATE = { sections: offerSections('gl-dn', {
    progressLabel: 'A smaller option',
    heading: 'A gentler last look',
    body: 'If the last offer was more than you wanted, here is one smaller favorite before we complete your order.',
    maximumProducts: 1, discount: 22, multipleLayout: 'stacked', showQuantity: false,
    acceptText: 'Add this smaller offer · {amount}', declineText: 'No thanks, complete my order',
  }, [
    showcaseAnnouncement('gl-dn', [
      'One last smaller option before we finish',
    ]),
    showcaseCountdown('gl-dn', 'progress', {
      style: 'inline', icon: 'clock', prefix_text: 'This smaller option stays available for',
      duration: 6, text_alignment: 'center',
      background_color: '#F4F7F5', text_color: '#1F3D2C', border_color: '#D5E3DA',
    }),
    { id: 'gl-dn-trust', kind: 'checkout-trust-badges', zone: 'offer', settings: {
      heading: 'Still covered', layout: 'grid', per_row_desktop: 2, per_row_mobile: 1, icon_size: 36,
    }, blocks: [
      { id: 'gl-dn-trust-pay', kind: 'badge', settings: {
        icon_source: 'builtin', built_in: 'lock', title: 'Same secure payment',
        description: 'Uses the card you just paid with. No new details needed.',
      } },
      { id: 'gl-dn-trust-ship', kind: 'badge', settings: {
        icon_source: 'builtin', built_in: 'truck', title: 'Ships with your order',
        description: 'This add-on leaves with the order you already placed.',
      } },
    ] },
    showcaseFooter('gl-dn'),
  ]) };

  const thankyouCoreSections = (prefix, additions) => {
    const extras = additions || [];
    const inZone = (zone) => extras.filter((section) => section.zone === zone);
    return [
      ...inZone('announce'),
      { id: prefix + '-header', kind: 'checkout-header', settings: {
        show_trust_text: true, trust_text: 'Order confirmed',
        show_secure_badge: false, show_cart_icon: true,
      } },
      ...inZone('header'),
      { id: prefix + '-status', kind: 'thankyou-order-status' },
      ...inZone('status'),
      { id: prefix + '-details', kind: 'thankyou-order-details' },
      ...inZone('details'),
      { id: prefix + '-continue', kind: 'thankyou-continue-shopping' },
      { id: prefix + '-contact', kind: 'thankyou-contact-us' },
      ...inZone('continue'),
      { id: prefix + '-summary', kind: 'checkout-order-summary', settings: { mobile_default: 'expanded' }, blocks: [
        { id: prefix + '-blk-lines', kind: 'cart-lines' },
        { id: prefix + '-blk-subtotal', kind: 'subtotal' },
        { id: prefix + '-blk-discount', kind: 'discount' },
        { id: prefix + '-blk-shipping', kind: 'shipping' },
        { id: prefix + '-blk-total', kind: 'total' },
      ] },
      ...inZone('summary'),
      { id: prefix + '-policy', kind: 'checkout-policy-links', settings: {
        refund_policy_page: 'pg-refund', privacy_policy_page: 'pg-privacy',
        terms_of_service_page: 'pg-terms', contact_page: 'pg-contact',
      } },
      ...inZone('policytop'),
      ...inZone('bottom'),
    ];
  };
  const BRAND_CELEBRATION_THANKYOU_TEMPLATE = {
    sections: thankyouCoreSections('bc-ty', [
      showcaseAnnouncement('bc-ty', [
        'You\u2019re in. Welcome to the AURA community',
        'Tracking details will land in your inbox',
      ]),
      { id: 'bc-ty-thanks', kind: 'checkout-static-content', zone: 'header', settings: {
        content_style: 'notice', icon: 'gift', heading: 'Thank you for choosing AURA',
        content: '<p>Your order is confirmed. We\u2019re packing it with care and will email tracking as soon as it ships.</p>',
        background_color: '#F4F7F5', border_color: '#D5E3DA', text_alignment: 'left',
      } },
      { id: 'bc-ty-next', kind: 'checkout-static-content', zone: 'status', settings: {
        content_style: 'plain', icon: 'none', heading: 'What happens next',
        content: '<p>We\u2019ll send a confirmation now, a shipping update when it leaves, and a note if anything needs your attention.</p>',
        text_alignment: 'left', background_color: 'transparent', border_color: 'transparent',
      } },
      showcaseReviewCard('bc-ty', 'details', [
        { image: IMG.av1, title: 'A brand people come back to',
          content: '\u201cThe unboxing felt considered \u2014 not loud, just quietly well made. I\u2019ve already planned my next order.\u201d',
          author_name: 'Camille R.', author_subtitle: 'Repeat customer' },
      ]),
      { id: 'bc-ty-fb', kind: 'checkout-fb-comments', zone: 'continue', settings: { heading: 'From the community' } },
      showcasePayIcons('bc-ty', 'summary', 'Paid securely with'),
      checkoutTrustBadges('bc-ty', { heading: 'You\u2019re in good hands' }),
      showcaseTestimonials('bc-ty', { subheading: 'The community', heading: 'You\u2019re in good company' }),
      showcaseFooter('bc-ty'),
    ]),
  };

  function productionThankyouTemplate() {
    return {
      sections: [
        { id: 'ty-header', kind: 'checkout-header', settings: productionHeaderSettings() },
        { id: 'ty-status', kind: 'thankyou-order-status', settings: {
          email_message: "You'll receive a confirmation email soon",
          thankyou_text: 'Thank you, {{customer_name}}',
          success_message: 'Your order is confirmed',
          success_icon_color: '', show_confirmation_number: true,
        } },
        { id: 'ty-details', kind: 'thankyou-order-details', settings: {
          heading: 'Order details', card_radius: 4, card_background: '#FFFFFF',
          card_border_color: '#E0E1E3', show_payment_method: true,
          show_billing_address: true, show_shipping_method: true,
          show_shipping_address: true, show_contact_information: true,
        } },
        { id: 'ty-continue', kind: 'thankyou-continue-shopping', settings: {
          link_url: '', button_text: 'Continue shopping',
          show_button: true, button_style: 'primary',
        } },
        { id: 'ty-contact', kind: 'thankyou-contact-us', settings: {
          help_text: 'Need help?', link_text: 'Contact us',
          contact_link: '', show_contact_us: false,
        } },
        { id: 'ty-summary', kind: 'checkout-order-summary', settings: {
          heading: 'Order summary', custom_css: '', mobile_default: 'expanded',
          show_heading_pc: true, show_heading_mobile: true,
        }, blocks: [
          { id: 'ty-blk-lines', kind: 'cart-lines' },
          { id: 'ty-blk-subtotal', kind: 'subtotal', settings: { label: 'Subtotal' } },
          { id: 'ty-blk-discount', kind: 'discount' },
          { id: 'ty-blk-shipping', kind: 'shipping', settings: {
            label: 'Shipping', zero_value: 'free',
          } },
          { id: 'ty-blk-total', kind: 'total', settings: { label: 'Total' } },
        ] },
        { id: 'ty-policy', kind: 'checkout-policy-links', settings: productionPolicySettings() },
      ],
    };
  }
  function legacyThankyouTemplate() {
    return {
      sections: [
        { id: 'ty-header', kind: 'checkout-header' },
        { id: 'ty-status', kind: 'thankyou-order-status' },
        { id: 'ty-details', kind: 'thankyou-order-details' },
        { id: 'ty-continue', kind: 'thankyou-continue-shopping' },
        { id: 'ty-contact', kind: 'thankyou-contact-us' },
        { id: 'ty-summary', kind: 'checkout-order-summary', settings: { mobile_default: 'expanded' }, blocks: [
          { id: 'ty-blk-lines', kind: 'cart-lines' },
          { id: 'ty-blk-subtotal', kind: 'subtotal' },
          { id: 'ty-blk-discount', kind: 'discount' },
          { id: 'ty-blk-shipping', kind: 'shipping' },
          { id: 'ty-blk-total', kind: 'total' },
        ] },
        { id: 'ty-policy', kind: 'checkout-policy-links', settings: {
          refund_policy_page: 'pg-refund', privacy_policy_page: 'pg-privacy',
          terms_of_service_page: 'pg-terms', contact_page: 'pg-contact',
        } },
      ],
    };
  }

  // Legacy ids are retained in CHECKOUT_TEMPLATE_SETS. Residual A/B adds a
  // Trust-led / Concise checkout pair plus one shared Upsell/Downsell set.
  // Showcase drafts live in the same lists but stay off preset Flows.
  const CHECKOUT_TEMPLATE_SEEDS = {
    checkout: {
      standard: FIRST_PURCHASE_CHECKOUT_TEMPLATE,
      conversion: RETURNING_CUSTOMER_CHECKOUT_TEMPLATE,
      'trust-led': TRUST_LED_CHECKOUT_TEMPLATE,
      concise: CONCISE_CHECKOUT_TEMPLATE,
      'social-proof': SOCIAL_PROOF_CHECKOUT_TEMPLATE,
    },
    upsell: {
      'one-click-upsell': NEW_CUSTOMER_UPSELL_TEMPLATE,
      'subscription-upsell': RETURNING_CUSTOMER_UPSELL_TEMPLATE,
      'residual-offer': RESIDUAL_UPSELL_TEMPLATE,
      'limited-proof': LIMITED_PROOF_UPSELL_TEMPLATE,
    },
    downsell: {
      'standard-downsell': NEW_CUSTOMER_DOWNSELL_TEMPLATE,
      'save-offer': RETURNING_CUSTOMER_DOWNSELL_TEMPLATE,
      'residual-save': RESIDUAL_DOWNSELL_TEMPLATE,
      'gentle-last-chance': GENTLE_LAST_CHANCE_DOWNSELL_TEMPLATE,
    },
    thankyou: {
      standard: productionThankyouTemplate(),
      'base-order': legacyThankyouTemplate(),
      'survey-thankyou': legacyThankyouTemplate(),
      'brand-celebration': BRAND_CELEBRATION_THANKYOU_TEMPLATE,
    },
  };

  const UPSELL_TEMPLATE = NEW_CUSTOMER_UPSELL_TEMPLATE;
  const DOWNSELL_TEMPLATE = NEW_CUSTOMER_DOWNSELL_TEMPLATE;

  // ==========================================================================
  //  THANK YOU PAGE (Thank you PRD) — second transaction page, shares the
  //  Checkout theme settings. Final Funnel order confirmation, not the raw
  //  checkout cart. Required components + a limited set of reusable content &
  //  trust enhancement components, in their own insertion zones. (PRD §3, §9)
  // ==========================================================================

  // Thank-you insertion zones (PRD §9.2). No commerce here — order is already
  // placed. `col` mirrors the checkout render regions: 'announce' full-bleed top,
  // 'main' left column, 'summary' the right Order Summary column, 'bottom' the
  // full-bleed band (policy links → footer). Order status stays pinned to the top;
  // nothing can be inserted above it (PRD §9.3, §9.4).
  // The six content & trust components that may live in the Order details / Contact us /
  // Order summary zones (PRD §9.2). Header / Order status only allow Static content;
  // Policy Links only Testimonials; Page bottom only Footer.
  const TY_LEFT_CONTENT = ['checkout-static-content', 'checkout-countdown'];
  const TY_FLEX = ['checkout-countdown', 'checkout-trust-badges', 'checkout-static-content', 'checkout-payment-icons',
    'checkout-trustpilot', 'checkout-review-card', 'checkout-fb-comments'];
  const THANKYOU_ZONES = [
    { id: 'announce', label: 'Above header', after: null, col: 'announce', allow: ['announcement-bar'] },
    { id: 'header', label: 'Below header', after: 'checkout-header', col: 'main', allow: TY_LEFT_CONTENT.slice() },
    { id: 'status', label: 'Below Order status', after: 'thankyou-order-status', col: 'main', allow: TY_LEFT_CONTENT.slice() },
    { id: 'details', label: 'Below Order details', after: 'thankyou-order-details', col: 'main', allow: TY_FLEX.slice() },
    { id: 'continue', label: 'Below Contact us', after: 'thankyou-contact-us', col: 'main', allow: TY_FLEX.slice() },
    { id: 'summary', label: 'Below Order Summary', after: 'checkout-order-summary', col: 'summary', allow: TY_FLEX.slice() },
    // policytop is listed before 'bottom' so drag-onto-policy-links resolves here first.
    { id: 'policytop', label: 'Below Policy Links', after: 'checkout-policy-links', col: 'bottom', allow: ['checkout-testimonials'] },
    { id: 'bottom', label: 'Page bottom', after: 'checkout-policy-links', col: 'bottom', allow: ['checkout-footer'] },
  ];

  // Thank-you skeleton (PRD §3.1, §23.2). Required components are locked; reused
  // Checkout components (header, mobile summary bar, order summary, policy links,
  // footer) carry the same behaviour they have on Checkout.
  const THANKYOU_TEMPLATE = productionThankyouTemplate();

  // Add-component catalog for the Thank-you editor (PRD §7, §9.2). Only reusable
  // content & trust enhancement components — NO commerce boosters (PRD §8).
  // Each entry carries an optional `defaultZone` — the Thank-you page's own default
  // add position (PRD §9.5). This is page-scoped (looked up by addCheckoutComponent
  // in the active page's catalog) so it never disturbs the Checkout page's defaults,
  // which come from each section's shared `def.defaultZone`.
  const THANKYOU_CATALOG = [
    { label: 'Reviews & social proof', entries: [
      { kind: 'checkout-trustpilot', name: 'Trustpilot Review', desc: 'Trustpilot-style rating & reviews (static)', defaultZone: 'summary' },
      { kind: 'checkout-review-card', name: 'Review card', desc: 'Expert / media endorsement cards', defaultZone: 'summary' },
      { kind: 'checkout-testimonials', name: 'Testimonials', desc: 'Customer reviews (bottom area only)', defaultZone: 'policytop' },
      { kind: 'checkout-fb-comments', name: 'Facebook-style Comments', desc: 'Social-proof comment thread', defaultZone: 'summary' },
    ] },
    { label: 'Trust & security', entries: [
      { kind: 'checkout-trust-badges', name: 'Trust badges', desc: 'Guarantee / security / shipping badges', defaultZone: 'summary' },
      { kind: 'checkout-payment-icons', name: 'Payment Icons', desc: 'Accepted-payment brand badges', defaultZone: 'summary' },
    ] },
    { label: 'Promotion & urgency', entries: [
      { kind: 'announcement-bar', name: 'Announcement Bar', desc: 'Post-purchase notice / next-order offer (above header)', defaultZone: 'announce' },
      { kind: 'checkout-countdown', name: 'Countdown', desc: 'Static urgency / reservation timer', defaultZone: 'header' },
    ] },
    { label: 'Content & structure', entries: [
      { kind: 'checkout-static-content', name: 'Static content', desc: 'Order-processing / shipping / support notice', defaultZone: 'header' },
      { kind: 'checkout-footer', name: 'Footer', desc: 'Thank-you footer (bottom of page only)', defaultZone: 'bottom' },
    ] },
  ];

  // Final Order Snapshot — V1.146.2 keeps Base and Late Upsell as independent orders.
  // `line_source` remains explicit so Thank you can show Upsell / Downsell badges, while
  // buyer Account pages deliberately hide those marketing-origin labels.
  const PP_ORDER_MOCK = window.POST_PURCHASE_ORDER_MOCK;
  // Thank-you-only fixture lines demonstrate the same product discount, subscription,
  // and bundle Cart Line types as Checkout. They are appended to the Base Order snapshot
  // only, so the shared admin/buyer order mock and MINI11490 remain unchanged.
  const thankyouFixtureLines = [CHECKOUT_MOCK.cart[0], CHECKOUT_MOCK.cart[3], CHECKOUT_MOCK.cart[5]]
    .filter(Boolean)
    .map((line, index) => ({
      ...line,
      id: 'ty_fixture_' + (index + 1),
      fixtureType: ['product-discount', 'subscription', 'bundle'][index],
      lineSource: 'CHECKOUT',
      subscription: line.subscription ? { ...line.subscription } : undefined,
      bundleItems: line.bundleItems ? line.bundleItems.map((item) => ({ ...item })) : undefined,
    }));
  const snapshotOrders = PP_ORDER_MOCK ? PP_ORDER_MOCK.orders.map((order) => {
    const mappedLines = order.lines.filter((line) => line.line_id !== 'line_base_1').map((line) => ({
      id: line.line_id,
      title: line.title,
      variant: line.variant,
      qty: line.qty,
      price: line.unit_price,
      compareAt: line.offer_base_price != null ? line.offer_base_price : line.compare_at_price,
      image: line.image,
      lineSource: line.line_source,
      upsell: line.line_source === 'UPSELL',
      downsell: line.line_source === 'DOWNSELL',
    }));
    const lines = order.order_sn === 'MINI11489'
      ? mappedLines.concat(thankyouFixtureLines.map((line) => ({
          ...line,
          subscription: line.subscription ? { ...line.subscription } : undefined,
          bundleItems: line.bundleItems ? line.bundleItems.map((item) => ({ ...item })) : undefined,
        })))
      : mappedLines;
    const discounts = (order.discounts || []).map((item) => ({
      code: item.code,
      product: +item.product || 0,
      order: item.order != null ? (+item.order || 0) : (+item.amount || 0),
      shipping: +item.shipping || 0,
    }));
    const shipping = +order.shipping_fee || 0;
    if (order.order_sn === 'MINI11489' && shipping > 0) {
      discounts.push({ code: 'FREESHIP', product: 0, order: 0, shipping });
    }
    const subtotal = lines.reduce((sum, line) => sum + (+line.price || 0) * (+line.qty || 1), 0);
    const discount = discounts.reduce((sum, item) =>
      sum + (+item.product || 0) + (+item.order || 0) + (+item.shipping || 0), 0);
    const tax = +order.tax || 0;
    const total = subtotal - discount + shipping + tax;
    return {
      orderId: order.order_id,
      orderNumber: '#' + order.order_sn,
      orderRole: order.order_role,
      sourceOrderId: order.source_order_id,
      sourceOrderNumber: order.source_order_sn ? '#' + order.source_order_sn : '',
      status: order.status,
      currency: order.currency,
      lines,
      subtotal,
      discounts,
      shipping,
      tax,
      total,
      paid: total,
    };
  }) : [];
  const snapshotLines = snapshotOrders.length
    ? snapshotOrders.reduce((all, order) => all.concat(order.lines), [])
    : CHECKOUT_MOCK.cart.slice(0, 3);
  const THANKYOU_SNAPSHOT = {
    storeName: 'AURA',
    currency: 'USD',
    confirmationNumber: 'ABC123EXAMPLE',
    orderNumber: snapshotOrders[0] ? snapshotOrders[0].orderNumber : '#1001',
    orderStatus: 'confirmed',
    customer: { name: 'Alanna', fullName: 'Alanna Bogan', email: 'alanna.bogan@example.com', phone: '+1 (202) 456-1414' },
    shippingAddress: {
      name: 'Alanna Bogan', line1: '1600 Pennsylvania Avenue NW', city: 'Washington', state: 'DC',
      zip: '20500-0005', country: 'United States', phone: '+1 (202) 456-1414',
    },
    shippingMethod: 'Standard (Example)',
    payment: { brand: 'Visa', last4: '4242', label: 'Credit card' },
    billingSameAsShipping: true,
    orders: snapshotOrders,
    totalPaid: snapshotOrders.reduce((sum, order) => sum + (+order.paid || 0), 0),
    lines: snapshotLines,
    subtotal: snapshotOrders.reduce((sum, order) => sum + (+order.subtotal || 0), 0),
    discount: snapshotOrders.reduce((sum, order) =>
      sum + (order.discounts || []).reduce((d, item) =>
        d + (+item.product || 0) + (+item.order || 0) + (+item.shipping || 0), 0), 0),
    discounts: snapshotOrders[0] ? snapshotOrders[0].discounts : [],
    shipping: snapshotOrders.reduce((sum, order) => sum + (+order.shipping || 0), 0),
    tax: snapshotOrders.reduce((sum, order) => sum + (+order.tax || 0), 0),
    total: snapshotOrders.reduce((sum, order) => sum + (+order.total || 0), 0),
  };

  window.OS_DATA = {
    THEMES, PAGE_OPTIONS, CATALOG, SETTINGS_GROUPS, SAMPLE, DEFAULT_THEME,
    CHECKOUT_PAGES, CHECKOUT_TEMPLATE_SETS, CHECKOUT_TEMPLATE_SEEDS, CHECKOUT_SETTINGS_GROUPS, CHECKOUT_SETTINGS_REMOVED, CHECKOUT_TEMPLATE, CHECKOUT_MOCK, CHECKOUT_COMMERCE, CHECKOUT_CONTENT, CHECKOUT_ZONES, CHECKOUT_CATALOG,
    UPSELL_TEMPLATE, DOWNSELL_TEMPLATE, OFFER_ZONES, OFFER_CATALOG, OFFER_MOCKS,
    THANKYOU_TEMPLATE, THANKYOU_ZONES, THANKYOU_CATALOG, THANKYOU_SNAPSHOT,
  };
})();
