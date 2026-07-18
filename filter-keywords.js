// filter-keywords.js
// 从 Semrush CSV 按 5 modality 分桶排序，只输出 CSV 里真实存在的词（+ Volume + KD）。
// 用法：node filter-keywords.js <phrase>
//   例：node filter-keywords.js allah
// CSV 路径约定：../关键词数据/<phrase>_broad-match_us_*.csv（多个取最新）

const fs = require('fs');
const path = require('path');

const phrase = process.argv[2];
if (!phrase) {
  console.error('Usage: node filter-keywords.js <phrase>');
  process.exit(1);
}

const csvDir = path.resolve(__dirname, '..', '关键词数据');
const files = fs.readdirSync(csvDir).filter(f => f.startsWith(phrase + '_') && f.endsWith('.csv'));
if (!files.length) {
  console.error(`❌ No CSV found for "${phrase}" in ${csvDir}`);
  process.exit(1);
}
const csvFile = files.sort().reverse()[0];
console.log(`📊 Reading: ${csvFile}\n`);

const raw = fs.readFileSync(path.join(csvDir, csvFile), 'utf8');

// 简单 CSV 解析（支持带引号的字段）
function parseCsv(text) {
  const rows = [];
  let cur = [], cell = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQ) {
      if (c === '"' && next === '"') { cell += '"'; i++; }
      else if (c === '"') inQ = false;
      else cell += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { cur.push(cell); cell = ''; }
      else if (c === '\n') { cur.push(cell); rows.push(cur); cur = []; cell = ''; }
      else if (c === '\r') { /* skip */ }
      else cell += c;
    }
  }
  if (cell || cur.length) { cur.push(cell); rows.push(cur); }
  return rows;
}

const rows = parseCsv(raw);
const header = rows[0];
const kwIdx = header.indexOf('Keyword');
const volIdx = header.indexOf('Volume');
const kdIdx = header.indexOf('Keyword Difficulty');
const intentIdx = header.indexOf('Intent');

// 5 modality 桶（对应 SOP 里的 H2 分类）
const buckets = {
  styles: {
    label: '📝 STYLES (书法样式：Thuluth/Kufic/Naskh/Diwani…)',
    match: kw => /\b(calligraphy|font|thuluth|kufic|naskh|diwani|ruqah|ruqaa|moroccan|farsi|nastaliq|maghribi)\b/i.test(kw),
  },
  variants: {
    label: '🔤 VARIANTS (阿拉伯写法/词形：xxx in arabic / arabic xxx)',
    match: kw => /\barabic\b/i.test(kw) && !/meaning|english|translation|pronunciation|pronounce/i.test(kw),
  },
  meaning: {
    label: '📖 MEANING (含义/翻译)',
    match: kw => /\bmeaning\b|\bmeans\b|\bin english\b|\btranslation\b|what does .* mean|\bdefinition\b/i.test(kw),
  },
  download: {
    label: '🖼️ DOWNLOAD / IMAGE / WALLPAPER (下载/图片/壁纸)',
    match: kw => /\bpng\b|\bsvg\b|\bdownload\b|\bwallpaper\b|\bimage\b|\bpicture\b|\bphoto\b|\bhd\b|\blogo\b|\bicon\b|\bposter\b|\bsticker\b/i.test(kw),
  },
  pronunciation: {
    label: '🔊 PRONUNCIATION (发音)',
    match: kw => /pronunciation|pronounce|how to say|how do you say|how to pronounce/i.test(kw),
  },
};

// 噪声：跟阿拉伯书法主题无关的政治/影视/歌曲/名人词
const NOISE = /\btrump\b|\bnetflix\b|\bmovie\b|\bsong\b|\bmeme\b|\btiktok\b|\bakbar bugti\b|\bakbar hashemi\b|\bakbar the great\b/i;

// 过滤 + 归一化
const kws = rows.slice(1)
  .filter(r => r.length >= volIdx + 1 && r[kwIdx] && r[volIdx])
  .map(r => ({
    keyword: r[kwIdx].trim(),
    volume: parseInt(r[volIdx], 10) || 0,
    kd: r[kdIdx] ? parseInt(r[kdIdx], 10) : null,
    intent: (r[intentIdx] || '').trim(),
  }))
  .filter(k => k.volume >= 50 && !NOISE.test(k.keyword));

console.log(`Total kept (Vol ≥ 50, noise filtered): ${kws.length}\n`);

// 输出每桶 top 10
for (const [name, def] of Object.entries(buckets)) {
  const bucketKws = kws
    .filter(k => def.match(k.keyword))
    .sort((a, b) => b.volume - a.volume);
  console.log(`\n=== ${def.label} — ${bucketKws.length} 词 ===`);
  bucketKws.slice(0, 10).forEach(k => {
    const kd = k.kd == null ? ' - ' : String(k.kd).padStart(3);
    console.log(`  Vol ${String(k.volume).padStart(6)}  KD ${kd}   ${k.keyword}`);
  });
}

// 未分桶
const bucketed = new Set();
for (const def of Object.values(buckets)) {
  kws.filter(k => def.match(k.keyword)).forEach(k => bucketed.add(k.keyword));
}
const other = kws.filter(k => !bucketed.has(k.keyword)).sort((a, b) => b.volume - a.volume);
console.log(`\n=== 🌀 OTHER (未分类，人工看) — ${other.length} 词 ===`);
other.slice(0, 15).forEach(k => {
  const kd = k.kd == null ? ' - ' : String(k.kd).padStart(3);
  console.log(`  Vol ${String(k.volume).padStart(6)}  KD ${kd}   ${k.keyword}`);
});

console.log(`\n✅ Done. 每桶挑 1 个词做 H2 关键词（共 5 个），选完告诉我。`);
