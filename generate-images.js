// generate-images.js
// 从 data/phrases.json 读取短语数据，用 Puppeteer 自动生成一个短语页需要的所有工具可生的图：
//   - 20 张 gallery 图（从 phrases.json 的 gallery.items 读配置）
//   - 5 张 inline 图（Diwani banner / Kufic banner / Naskh banner / Download transparent / Download white）
// 共 25 张图 30-60 秒生成完，全部保存到 images/ 文件夹。
//
// 剩下 3 张装饰图（Thuluth banner / 完整短语大图 / Download black）需要 Gemini 手工生成（见 SOP）
//
// 用法：node generate-images.js <slug>
//       node generate-images.js all       (全部短语一起跑)

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ==========================================================
// 5 张 inline 图的固定配置（工具可生）
// ==========================================================
const INLINE_CONFIGS = [
  { suffix: 'diwani-inline',        font: "'Aref Ruqaa', serif",       color: '#722F37', bg: 'color',       bgColor: '#F5E6D3', w: 800, h: 160, size: 44, altStyle: 'Diwani', altColor: 'burgundy',   altBg: 'ivory background' },
  { suffix: 'kufic-inline',         font: "'Reem Kufi', sans-serif",   color: '#000000', bg: 'white',                            w: 800, h: 160, size: 44, altStyle: 'Kufic',  altColor: 'black',       altBg: 'white background' },
  { suffix: 'naskh-inline',         font: "'Amiri', serif",             color: '#14532D', bg: 'color',       bgColor: '#FAF3E7', w: 800, h: 160, size: 44, altStyle: 'Naskh',  altColor: 'deep green', altBg: 'cream background' },
  { suffix: 'download-transparent', font: "'Scheherazade New', serif",  color: '#000000', bg: 'transparent',                     w: 300, h: 140, size: 28, altStyle: 'Thuluth', altColor: 'black',      altBg: 'transparent background (PNG)' },
  { suffix: 'download-white',       font: "'Scheherazade New', serif",  color: '#000000', bg: 'white',                            w: 300, h: 140, size: 28, altStyle: 'Thuluth', altColor: 'black',      altBg: 'white background' },
];

const GALLERY_CANVAS = { w: 400, h: 240, size: 28 };
const SCALE = 2;
const OUTPUT_DIR = path.join(__dirname, 'images');

// ==========================================================
// 主流程
// ==========================================================
(async () => {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node generate-images.js <slug|all>');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync('data/phrases.json', 'utf8'));
  const targets = arg === 'all' ? data.phrases : data.phrases.filter(p => p.slug === arg);
  if (targets.length === 0) {
    console.error(`Phrase not found: ${arg}`);
    console.error(`Available: ${data.phrases.map(p => p.slug).join(', ')}`);
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const toolPath = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
  console.log(`📄 Loading tool: ${toolPath}`);
  await page.goto(toolPath, { waitUntil: 'networkidle0', timeout: 30000 });

  console.log('⏳ Waiting for Google Fonts to load...');
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 3000));

  for (const phrase of targets) {
    console.log(`\n🎨 [${phrase.slug}] Generating images...`);

    // ---- 5 张 inline 图 ----
    for (let i = 0; i < INLINE_CONFIGS.length; i++) {
      const cfg = INLINE_CONFIGS[i];
      const ext = cfg.bg === 'transparent' ? 'png' : 'png';  // 全部 png（transparent 必须 png）
      const file = `${phrase.slug}-${cfg.suffix}.${ext}`;
      process.stdout.write(`  [inline ${i+1}/${INLINE_CONFIGS.length}] ${file.padEnd(50)} ... `);
      try {
        await renderAndSave(page, phrase, cfg, file);
        console.log('✓');
      } catch (err) {
        console.log('❌', err.message);
      }
    }

    // ---- 20 张 gallery 图 ----
    const galleryConfigs = phrase.gallery.items.map(item => {
      const n = String(item.n).padStart(2, '0');
      return {
        file: `${phrase.slug}-gallery-${n}-${item.fileSuffix}.png`,
        font: item.font,
        color: item.color,
        bg: item.bg,
        bgColor: item.bgColor,
        w: GALLERY_CANVAS.w, h: GALLERY_CANVAS.h, size: GALLERY_CANVAS.size,
      };
    });

    for (let i = 0; i < galleryConfigs.length; i++) {
      const cfg = galleryConfigs[i];
      process.stdout.write(`  [gallery ${String(i+1).padStart(2, '0')}/${galleryConfigs.length}] ${cfg.file.padEnd(50)} ... `);
      try {
        await renderAndSave(page, phrase, cfg, cfg.file);
        console.log('✓');
      } catch (err) {
        console.log('❌', err.message);
      }
    }
  }

  await browser.close();
  console.log(`\n✅ All done! Images saved to: ${OUTPUT_DIR}`);
  console.log(`ℹ️  Reminder: 3 decorative images (Thuluth banner / full-phrase / download-black) still need to be generated via Gemini. See SOP.`);
})();

// ==========================================================
// 单张图渲染 + 保存
// ==========================================================
async function renderAndSave(page, phrase, cfg, filename) {
  const dataUrl = await page.evaluate(async (phrase, cfg, SCALE) => {
    // 设置 tool state
    state.text = phrase.arabicTextWithHarakat || phrase.arabicText;
    state.font = cfg.font;
    state.color = cfg.color;
    state.bg = cfg.bg;
    if (cfg.bgColor) state.bgColor = cfg.bgColor;
    state.width = cfg.w;
    state.height = cfg.h;
    state.size = cfg.size;
    state.scale = SCALE;
    state.harakat = true;
    state.rotation = 0;
    state.opacity = 100;
    state.posX = 50;
    state.posY = 50;
    state.stroke = false;
    state.lineHeight = 1.5;

    try { await document.fonts.load(`${cfg.size}px ${cfg.font}`); } catch(e) {}

    // 复制工具的 canvas 导出逻辑
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width  = cfg.w * SCALE;
    canvas.height = cfg.h * SCALE;
    ctx.scale(SCALE, SCALE);

    if (cfg.bg === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cfg.w, cfg.h);
    } else if (cfg.bg === 'color') {
      ctx.fillStyle = cfg.bgColor;
      ctx.fillRect(0, 0, cfg.w, cfg.h);
    }
    // transparent: 什么都不画（canvas 默认透明）

    const x = cfg.w / 2;
    const y = cfg.h / 2;
    ctx.font        = `${cfg.size}px ${cfg.font}`;
    ctx.fillStyle   = cfg.color;
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.globalAlpha = 1;
    ctx.fillText(state.text, x, y);

    return canvas.toDataURL('image/png');
  }, phrase, cfg, SCALE);

  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), Buffer.from(base64, 'base64'));
}
