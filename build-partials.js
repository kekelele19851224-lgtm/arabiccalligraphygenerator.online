// build-partials.js
// 把 partials/nav.html 和 partials/footer.html 注入到所有带标记的 HTML 页面
// 未来加短语页只改 data/phrases.json，跑 npm run build，全站自动同步

const fs = require('fs');
const path = require('path');

// ========== 读数据 + 模板 ==========
const data = JSON.parse(fs.readFileSync('data/phrases.json', 'utf8'));
const navTemplate = fs.readFileSync('partials/nav.html', 'utf8');
const footerTemplate = fs.readFileSync('partials/footer.html', 'utf8');

// ========== 按 pageType 分组 ==========
const phraseEntries = data.phrases.filter(p => (p.pageType || 'phrase') === 'phrase');
const fontEntries   = data.phrases.filter(p => p.pageType === 'font');

// ========== 渲染短语列表 ==========
// 用于 dropdown（含缩进 8 空格）
const phrasesLinksHtml = phraseEntries
  .map(p => `        <a href="${p.url}" role="menuitem">${p.displayName}</a>`)
  .join('\n');

// 用于 footer 列表（含缩进 10 空格）
const phrasesListItemsHtml = phraseEntries
  .map(p => `          <li><a href="${p.url}">${p.displayName}</a></li>`)
  .join('\n');

// ========== 渲染字体列表 ==========
const fontsLinksHtml = fontEntries
  .map(p => `        <a href="${p.url}" role="menuitem">${p.displayName}</a>`)
  .join('\n');

const fontsListItemsHtml = fontEntries
  .map(p => `          <li><a href="${p.url}">${p.displayName}</a></li>`)
  .join('\n');

// ========== 替换模板占位符 ==========
const navRendered = navTemplate
  .replace('{{PHRASES_LINKS}}', phrasesLinksHtml)
  .replace('{{FONTS_LINKS}}', fontsLinksHtml);
const footerRendered = footerTemplate
  .replace('{{PHRASES_LIST_ITEMS}}', phrasesListItemsHtml)
  .replace('{{FONTS_LIST_ITEMS}}', fontsListItemsHtml);

// ========== 处理所有带标记的 HTML 文件 ==========
const htmlFiles = fs.readdirSync('.').filter(f =>
  f.endsWith('.html') && !['404.html'].includes(f)
);

let touched = 0;
let missing = [];

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  const hasNavMarker = content.includes('<!-- {{NAV}} -->');
  const hasFooterMarker = content.includes('<!-- {{FOOTER}} -->');

  if (hasNavMarker) {
    content = content.replace(
      /<!-- {{NAV}} -->[\s\S]*?<!-- {{\/NAV}} -->/g,
      `<!-- {{NAV}} -->\n${navRendered}\n<!-- {{/NAV}} -->`
    );
    changed = true;
  }

  if (hasFooterMarker) {
    content = content.replace(
      /<!-- {{FOOTER}} -->[\s\S]*?<!-- {{\/FOOTER}} -->/g,
      `<!-- {{FOOTER}} -->\n${footerRendered}\n<!-- {{/FOOTER}} -->`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`  ✓ ${file}`);
    touched++;
  } else if (!hasNavMarker && !hasFooterMarker) {
    missing.push(file);
  }
}

console.log(`\n✅ Injected nav + footer into ${touched} HTML file(s)`);
if (missing.length) {
  console.log(`ℹ️  No markers found in: ${missing.join(', ')}`);
  console.log(`   (add <!-- {{NAV}} --><!-- {{/NAV}} --> and <!-- {{FOOTER}} --><!-- {{/FOOTER}} --> to enable)`);
}
