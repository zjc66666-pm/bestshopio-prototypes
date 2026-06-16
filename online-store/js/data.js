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
  const PAGE_OPTIONS = [
    { value: 'home',       label: 'Home page' },
    { value: 'collection', label: 'Collection page' },
    { value: 'product',    label: 'Product page' },
  ];

  // ---------- Add-Section catalog (Shopify-style popover; 5 groups) ----------
  // kind === null  => "coming soon" stub (kept so coverage count reads true to the PRD).
  const CATALOG = [
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
      { id: 'p2', title: 'Soft rib tee', vendor: 'Aura Studio', price: 18.99, compareAt: 26.0, rating: 4.6, reviews: 98, image: IMG.p2, swatches: ['#1b3a2b', '#eae3d6'] },
      { id: 'p3', title: 'Editorial shell dress', vendor: 'Aura Studio', price: 41.5, compareAt: 58.0, rating: 4.9, reviews: 176, image: IMG.p3, swatches: ['#3a3f4a', '#9fb0a0', '#d8c3a5'] },
      { id: 'p4', title: 'Street denim jacket', vendor: 'Aura Studio', price: 54.0, compareAt: 72.0, rating: 4.7, reviews: 132, image: IMG.p4, swatches: ['#33415c', '#1b1f24'] },
      { id: 'p5', title: 'Crewneck sweater', vendor: 'Aura Studio', price: 44.0, compareAt: 0, rating: 4.5, reviews: 64, image: IMG.p5, swatches: ['#6b705c', '#cb997e'] },
      { id: 'p6', title: 'Pleated midi skirt', vendor: 'Aura Studio', price: 38.0, compareAt: 49.0, rating: 4.4, reviews: 51, image: IMG.p6, swatches: ['#1b1f24', '#b08968'] },
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
      { id: 'pg-privacy', title: 'Privacy Policy', url: '/pages/privacy' },
      { id: 'pg-refund', title: 'Refund Policy', url: '/pages/refund' },
      { id: 'pg-terms', title: 'Terms of Service', url: '/pages/terms' },
      { id: 'pg-shipping', title: 'Shipping Policy', url: '/pages/shipping' },
      { id: 'pg-about', title: 'About Us', url: '/pages/about' },
      { id: 'pg-contact', title: 'Contact Us', url: '/pages/contact' },
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
    templates: {
      home: { sections: [
        { id: 'sec-home-slideshow', kind: 'slideshow' },
        { id: 'sec-home-iwt', kind: 'media-with-text' },
        { id: 'sec-home-fc', kind: 'featured-collection' },
        { id: 'sec-home-testi', kind: 'testimonial' },
        { id: 'sec-home-faq', kind: 'faq' },
        { id: 'sec-home-news', kind: 'newsletter' },
      ] },
      collection: { sections: [
        { id: 'sec-col-banner', kind: 'collection-banner' },
        { id: 'sec-col-list', kind: 'collection-list' },
        { id: 'sec-col-page', kind: 'collection-page' },
      ] },
      product: { sections: [
        { id: 'sec-prod-iwt', kind: 'media-with-text' },
      ] },
    },
  };

  window.OS_DATA = { THEMES, PAGE_OPTIONS, CATALOG, SETTINGS_GROUPS, SAMPLE, DEFAULT_THEME };
})();
