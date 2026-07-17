// generate-gallery.js
// 自动生成 20 张 Bismillah 画廊图，直接复用 index.html 里的生成器
// 用法: npm install && npm run gallery
//
// 输出到: images/ 文件夹（文件名跟 bismillah-in-arabic-calligraphy.html 里的 <img src> 一致）

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ============================================================
// 20 张画廊图的字体 / 颜色 / 背景配置
// ============================================================
const CONFIGS = [
  { file: 'bismillah-gallery-01-thuluth-gold-parchment.png',   font: "'Scheherazade New', serif",     color: '#B8860B', bg: 'color', bgColor: '#F5E6C8' },
  { file: 'bismillah-gallery-02-thuluth-black-white.png',      font: "'Scheherazade New', serif",     color: '#000000', bg: 'white' },
  { file: 'bismillah-gallery-03-diwani-red-white.png',         font: "'Aref Ruqaa', serif",           color: '#C0392B', bg: 'white' },
  { file: 'bismillah-gallery-04-diwani-gold-black.png',        font: "'Aref Ruqaa', serif",           color: '#D4AF37', bg: 'color', bgColor: '#000000' },
  { file: 'bismillah-gallery-05-kufic-black-white.png',        font: "'Reem Kufi', sans-serif",       color: '#000000', bg: 'white' },
  { file: 'bismillah-gallery-06-kufic-navy-cream.png',         font: "'Reem Kufi', sans-serif",       color: '#0B3D91', bg: 'color', bgColor: '#FAF3E7' },
  { file: 'bismillah-gallery-07-naskh-green-cream.png',        font: "'Amiri', serif",                color: '#14532D', bg: 'color', bgColor: '#FAF3E7' },
  { file: 'bismillah-gallery-08-naskh-black-white.png',        font: "'Amiri', serif",                color: '#000000', bg: 'white' },
  { file: 'bismillah-gallery-09-nastaliq-purple-ivory.png',    font: "'Noto Nastaliq Urdu', serif",   color: '#5B2C6F', bg: 'color', bgColor: '#FFF8E7' },
  { file: 'bismillah-gallery-10-ruqaa-charcoal-offwhite.png',  font: "'Mirza', serif",                color: '#333333', bg: 'color', bgColor: '#F5F5F0' },
  { file: 'bismillah-gallery-11-arefruqaa-burgundy-beige.png', font: "'Aref Ruqaa', serif",           color: '#722F37', bg: 'color', bgColor: '#F5E6D3' },
  { file: 'bismillah-gallery-12-cairo-teal-white.png',         font: "'Cairo', sans-serif",           color: '#0F766E', bg: 'white' },
  { file: 'bismillah-gallery-13-amiri-sepia-parchment.png',    font: "'Amiri', serif",                color: '#704214', bg: 'color', bgColor: '#F5E6C8' },
  { file: 'bismillah-gallery-14-reemkufi-emerald-gold.png',    font: "'Reem Kufi', sans-serif",       color: '#059669', bg: 'color', bgColor: '#D4AF37' },
  { file: 'bismillah-gallery-15-markazi-black-rose.png',       font: "'Markazi Text', serif",         color: '#000000', bg: 'color', bgColor: '#FDF2F8' },
  { file: 'bismillah-gallery-16-notokufi-copper-cream.png',    font: "'Noto Kufi Arabic', sans-serif",color: '#B87333', bg: 'color', bgColor: '#FAF3E7' },
  { file: 'bismillah-gallery-17-scheherazade-gold-navy.png',   font: "'Scheherazade New', serif",     color: '#D4AF37', bg: 'color', bgColor: '#0F172A' },
  { file: 'bismillah-gallery-18-lateef-silver-midnight.png',   font: "'Lateef', serif",               color: '#C0C0C0', bg: 'color', bgColor: '#1E293B' },
  { file: 'bismillah-gallery-19-thuluth-green-white.png',      font: "'Scheherazade New', serif",     color: '#059669', bg: 'white' },
  { file: 'bismillah-gallery-20-diwani-rosegold-charcoal.png', font: "'Aref Ruqaa', serif",           color: '#B76E79', bg: 'color', bgColor: '#2C2C2C' },
];

// ============================================================
// 通用参数（可调）
// ============================================================
const CANVAS_WIDTH  = 400;  // 画布宽（HTML 里 <img width="400"> 一致）
const CANVAS_HEIGHT = 240;  // 画布高
const FONT_SIZE     = 28;   // 字号（Bismillah 全短语在 400 宽度下的合适大小）
const EXPORT_SCALE  = 2;    // 2x Retina 输出（最终 PNG = 800×480）
const OUTPUT_DIR    = path.join(__dirname, 'images');

// ============================================================
// 主流程
// ============================================================
(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🚀 Launching headless browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const toolPath = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
  console.log(`📄 Loading tool: ${toolPath}`);
  await page.goto(toolPath, { waitUntil: 'networkidle0', timeout: 30000 });

  console.log('⏳ Waiting for Google Fonts to fully load...');
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 3000)); // 额外等 3s 保险

  // 检查 state 是否可访问
  const stateOk = await page.evaluate(() => typeof state !== 'undefined');
  if (!stateOk) {
    console.error('❌ Cannot access "state" variable in the tool. Aborting.');
    await browser.close();
    process.exit(1);
  }

  console.log(`🎨 Generating ${CONFIGS.length} gallery images...\n`);

  for (let i = 0; i < CONFIGS.length; i++) {
    const cfg = CONFIGS[i];
    const label = `  [${String(i+1).padStart(2,'0')}/${CONFIGS.length}] ${cfg.file}`;
    process.stdout.write(label.padEnd(70) + ' ... ');

    try {
      const dataUrl = await page.evaluate(async (cfg, W, H, SIZE, SCALE) => {
        // 更新 state
        state.font    = cfg.font;
        state.color   = cfg.color;
        state.bg      = cfg.bg;
        if (cfg.bgColor) state.bgColor = cfg.bgColor;
        state.width   = W;
        state.height  = H;
        state.size    = SIZE;
        state.scale   = SCALE;
        state.harakat = true;
        state.rotation = 0;
        state.opacity  = 100;
        state.posX     = 50;
        state.posY     = 50;
        state.stroke   = false;
        state.lineHeight = 1.5;

        // 等这个具体字号 + 字体加载完
        try { await document.fonts.load(`${SIZE}px ${cfg.font}`); } catch(e) {}

        // 复用工具的 canvas 导出逻辑
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width  = W * SCALE;
        canvas.height = H * SCALE;
        ctx.scale(SCALE, SCALE);

        // 背景
        if (cfg.bg === 'white') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, W, H);
        } else if (cfg.bg === 'color') {
          ctx.fillStyle = cfg.bgColor;
          ctx.fillRect(0, 0, W, H);
        }
        // transparent 情况下什么都不画（canvas 默认透明）

        // 文字
        const text = state.text;
        const x = W / 2;
        const y = H / 2;
        ctx.font        = `${SIZE}px ${cfg.font}`;
        ctx.fillStyle   = cfg.color;
        ctx.textAlign   = 'center';
        ctx.textBaseline= 'middle';
        ctx.globalAlpha = 1;
        ctx.fillText(text, x, y);

        return canvas.toDataURL('image/png');
      }, cfg, CANVAS_WIDTH, CANVAS_HEIGHT, FONT_SIZE, EXPORT_SCALE);

      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(path.join(OUTPUT_DIR, cfg.file), Buffer.from(base64, 'base64'));
      console.log('✓');
    } catch (err) {
      console.log('❌', err.message);
    }
  }

  await browser.close();
  console.log(`\n✅ All done! Images saved to: ${OUTPUT_DIR}`);
  console.log(`   Ctrl+F5 refresh bismillah-in-arabic-calligraphy.html to see them.`);
})();
