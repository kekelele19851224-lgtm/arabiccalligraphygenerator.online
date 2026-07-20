// generate-tattoo-gallery.js
// 生成 20 张 Arabic Tattoo Hub 页 gallery 图 —— 用现有纹身工具组件 + 8 张皮肤图合成
// 用法：node generate-tattoo-gallery.js
// 前置：本地 http server 跑在 8765 端口（python -m http.server 8765）

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const GALLERY_ITEMS = [
  { n:  1, text: 'حب',     font: "'Scheherazade New', serif",   part: 'forearm',    size: 240 },
  { n:  2, text: 'صبر',    font: "'Amiri', serif",              part: 'wrist',      size: 200 },
  { n:  3, text: 'إيمان',  font: "'Reem Kufi', sans-serif",     part: 'nape',       size: 220 },
  { n:  4, text: 'سلام',   font: "'Aref Ruqaa', serif",         part: 'collarbone', size: 220 },
  { n:  5, text: 'حياة',   font: "'Noto Nastaliq Urdu', serif", part: 'spine',      size: 240 },
  { n:  6, text: 'أم',     font: "'Scheherazade New', serif",   part: 'wrist',      size: 260 },
  { n:  7, text: 'نور',    font: "'Reem Kufi', sans-serif",     part: 'hand',       size: 200 },
  { n:  8, text: 'أب',     font: "'Amiri', serif",              part: 'ribcage',    size: 240 },
  { n:  9, text: 'حب',     font: "'Aref Ruqaa', serif",         part: 'collarbone', size: 220 },
  { n: 10, text: 'أحب نفسي أولاً', font: "'Scheherazade New', serif", part: 'spine', size: 130 },
  { n: 11, text: 'عائلة',  font: "'Noto Nastaliq Urdu', serif", part: 'upperback',  size: 260 },
  { n: 12, text: 'مبارك',  font: "'Reem Kufi', sans-serif",     part: 'forearm',    size: 220 },
  { n: 13, text: 'قوة',    font: "'Scheherazade New', serif",   part: 'upperback',  size: 260 },
  { n: 14, text: 'حرية',   font: "'Amiri', serif",              part: 'forearm',    size: 220 },
  { n: 15, text: 'أمل',    font: "'Aref Ruqaa', serif",         part: 'wrist',      size: 220 },
  { n: 16, text: 'حلم',    font: "'Noto Nastaliq Urdu', serif", part: 'collarbone', size: 220 },
  { n: 17, text: 'أبدي',   font: "'Reem Kufi', sans-serif",     part: 'spine',      size: 220 },
  { n: 18, text: 'أخت',    font: "'Scheherazade New', serif",   part: 'ribcage',    size: 220 },
  { n: 19, text: 'أخ',     font: "'Amiri', serif",              part: 'forearm',    size: 240 },
  { n: 20, text: 'هذا أيضاً سيمضي', font: "'Aref Ruqaa', serif", part: 'upperback', size: 130 }
];

const BODY_SRCS = {
  forearm:    'images/01-forearm.jpg',
  wrist:      'images/02-wrist.jpg',
  nape:       'images/03-nape.jpg',
  spine:      'images/04-spine.jpg',
  collarbone: 'images/05-collarbone.jpg',
  upperback:  'images/06-upper-back.jpg',
  ribcage:    'images/07-ribcage.jpg',
  hand:       'images/08-hand.jpg'
};

const BODY_DEFAULTS = {
  forearm:    { posX: 50, posY: 45 },
  wrist:      { posX: 50, posY: 55 },
  nape:       { posX: 50, posY: 35 },
  spine:      { posX: 50, posY: 55 },
  collarbone: { posX: 30, posY: 60 },
  upperback:  { posX: 50, posY: 50 },
  ribcage:    { posX: 55, posY: 55 },
  hand:       { posX: 50, posY: 55 }
};

// Slugified caption for filename
const SLUGS = ['hubb-thuluth-forearm', 'sabr-naskh-wrist', 'iman-kufic-nape',
  'salaam-diwani-collarbone', 'hayat-nastaliq-spine', 'umm-thuluth-wrist',
  'nur-kufic-hand', 'ab-naskh-ribcage', 'hubb-diwani-collarbone',
  'love-yourself-first-thuluth-spine', 'family-nastaliq-upperback',
  'blessed-kufic-forearm', 'strength-thuluth-back', 'freedom-naskh-forearm',
  'hope-diwani-wrist', 'dream-nastaliq-collarbone', 'eternal-kufic-spine',
  'sister-thuluth-ribcage', 'brother-naskh-forearm', 'quote-diwani-back'];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1400, height: 1000 } });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('PAGE ERR:', e.message));

  console.log('Loading tool page...');
  await page.goto('http://localhost:8765/_test-tattoo-tool.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Switch to Body view once (image cache will build as we iterate)
  await page.click('#tt-tab-body');
  await new Promise(r => setTimeout(r, 800));

  for (let i = 0; i < GALLERY_ITEMS.length; i++) {
    const item = GALLERY_ITEMS[i];
    const slug = SLUGS[i];
    const outFile = `images/arabic-tattoo-gallery-${String(item.n).padStart(2, '0')}-${slug}.jpg`;

    // Configure state in the page via window.__tt
    await page.evaluate((cfg) => {
      const T = window.__tt;
      T.state.text = cfg.text;
      T.state.font = cfg.font;
      T.state.size = cfg.size;
      T.state.bodyPart = cfg.part;
      T.state.bodySrc = cfg.bodySrc;
      T.state.posX = cfg.posX;
      T.state.posY = cfg.posY;
      T.state.harakat = true;
      T.renderBody();
    }, {
      text: item.text, font: item.font, size: item.size,
      part: item.part, bodySrc: BODY_SRCS[item.part],
      posX: BODY_DEFAULTS[item.part].posX, posY: BODY_DEFAULTS[item.part].posY
    });

    // Wait for image load + render
    await new Promise(r => setTimeout(r, 800));

    // Extract full-res composite via drawBodyOnCanvas at native image resolution
    const dataUrl = await page.evaluate(() => {
      const T = window.__tt;
      const img = T.bodyImgCache[T.state.bodySrc];
      if (!img) return null;
      const targetW = Math.min(1000, img.width);
      const canvas = document.createElement('canvas');
      T.drawBodyOnCanvas(canvas, targetW, img);
      return canvas.toDataURL('image/jpeg', 0.88);
    });

    if (!dataUrl) { console.error(`✗ ${item.n}: no cached image for ${item.part}`); continue; }

    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    fs.writeFileSync(outFile, buf);
    console.log(`  ✓ ${item.n.toString().padStart(2, '0')} ${slug} (${(buf.length/1024).toFixed(1)}KB)`);
  }

  await browser.close();
  console.log('\n✅ Generated 20 tattoo gallery images.');
})();
