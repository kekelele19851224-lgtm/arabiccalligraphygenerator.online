// generate-phrase-page.js
// 从 data/phrases.json 和 templates/phrase-page.html 生成一个短语页 HTML 文件
// 用法：node generate-phrase-page.js <slug>
//       node generate-phrase-page.js all  (生成所有短语页)

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://arabiccalligraphygenerator.online';

// ==========================================================
// 主流程
// ==========================================================
function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node generate-phrase-page.js <slug|all>');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync('data/phrases.json', 'utf8'));
  const template = fs.readFileSync('templates/phrase-page.html', 'utf8');

  const targets = arg === 'all' ? data.phrases : data.phrases.filter(p => p.slug === arg);
  if (targets.length === 0) {
    console.error(`Phrase not found: ${arg}`);
    console.error(`Available: ${data.phrases.map(p => p.slug).join(', ')}`);
    process.exit(1);
  }

  for (const phrase of targets) {
    const rendered = render(template, phrase);
    const outputFile = phrase.url.replace(/^\//, '') + '.html';
    fs.writeFileSync(outputFile, rendered);
    console.log(`  ✓ ${outputFile}`);
  }
  console.log(`\n✅ Generated ${targets.length} phrase page(s)`);
}

// ==========================================================
// 渲染主函数：把 phrase 数据填到 template 里
// ==========================================================
function render(template, phrase) {
  const values = {
    // 简单字符串替换
    META_TITLE: phrase.meta.title,
    META_DESCRIPTION: phrase.meta.description,
    META_KEYWORDS: phrase.meta.keywords,
    CANONICAL_URL: SITE_URL + phrase.url,
    OG_DESCRIPTION: `Generate ${phrase.displayName} (${phrase.arabicText}) in beautiful Arabic calligraphy. 11 styles, free PNG/SVG/JPG download.`,
    OG_IMAGE_URL: phrase.schema.heroImageUrl,
    TWITTER_TITLE: `${phrase.displayName} in Arabic Calligraphy — Free Generator`,
    TWITTER_DESCRIPTION: `Generate ${phrase.displayName} in 11 calligraphy styles. Free PNG/SVG download.`,
    WEBAPP_NAME: phrase.schema.webAppName,
    WEBAPP_DESCRIPTION: phrase.schema.webAppDescription,
    IMAGE_SCHEMA_URL: phrase.schema.heroImageUrl,
    IMAGE_SCHEMA_NAME: phrase.schema.heroImageName,
    IMAGE_SCHEMA_DESCRIPTION: phrase.schema.heroImageDescription,
    IMAGE_SCHEMA_WIDTH: phrase.schema.heroImageWidth,
    IMAGE_SCHEMA_HEIGHT: phrase.schema.heroImageHeight,
    BREADCRUMB_LABEL: `${phrase.displayName} in Arabic Calligraphy`,
    H1: phrase.hero.h1,
    HERO_DESCRIPTION: phrase.hero.description,
    DISPLAY_NAME: phrase.displayName,
    DEFAULT_TEXT_WITH_HARAKAT: phrase.arabicTextWithHarakat || phrase.arabicText,
    DEFAULT_FONT_JS_STRING: `"${phrase.toolDefaults.font.replace(/"/g, '\\"')}"`,
    GALLERY_H2: phrase.gallery.h2,
    GALLERY_DESCRIPTION: phrase.gallery.description,

    // 复杂块渲染
    FAQ_SCHEMA_MAIN_ENTITY: renderFaqSchemaMainEntity(phrase.faq),
    SECTION_NAV_LINKS: renderSectionNavLinks(phrase),
    CONTENT_SECTIONS_HTML: renderContentSections(phrase.sections),
    GALLERY_ITEMS_HTML: renderGalleryItems(phrase),
    FAQ_ITEMS_HTML: renderFaqItems(phrase.faq),
  };

  let result = template;
  for (const [key, val] of Object.entries(values)) {
    result = result.split('{{' + key + '}}').join(String(val));
  }
  return result;
}

// ==========================================================
// FAQ Schema mainEntity（JSON 数组）
// ==========================================================
function renderFaqSchemaMainEntity(faq) {
  const entities = faq.map(f => ({
    "@type": "Question",
    "name": f.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": f.answer,
    }
  }));
  // 输出格式化的 JSON，缩进跟 template 对齐
  return JSON.stringify(entities, null, 2).split('\n').join('\n    ');
}

// ==========================================================
// Section anchor nav links
// ==========================================================
function renderSectionNavLinks(phrase) {
  const links = phrase.sections.map(s =>
    `    <a href="#${s.id}">${s.navLabel || s.h2}</a>`
  );
  links.push(`    <a href="#gallery">${phrase.gallery.navLabel || 'Gallery'}</a>`);
  return links.join('\n');
}

// ==========================================================
// 5 个 content section HTML
// ==========================================================
function renderContentSections(sections) {
  return sections.map(renderSection).join('\n\n');
}

function renderSection(section) {
  let body = `    <h2 id="${section.id}">${section.h2}</h2>`;

  if (section.intro) {
    body += `\n    <p>${section.intro}</p>`;
  }

  // Download previews (在正文段落之前)
  if (section.downloadPreviews) {
    body += '\n    <div class="download-previews">';
    for (const p of section.downloadPreviews) {
      const classAttr = p.isTransparent ? ' class="preview-transparent"' : '';
      body += `\n      <figure${classAttr}><img src="${p.src}" alt="${p.alt}" loading="lazy" width="300" height="140"><figcaption>${p.caption}</figcaption></figure>`;
    }
    body += '\n    </div>';
  }

  // Style blocks (h3s - 用于 Styles section)
  if (section.h3s) {
    for (const h3 of section.h3s) {
      body += `\n\n    <div class="style-block">`;
      body += `\n      <h3>${h3.title}</h3>`;
      if (h3.image) {
        body += `\n      <img class="style-inline-img" src="${h3.image.src}" alt="${h3.image.alt}" loading="lazy" width="800" height="160">`;
      }
      body += `\n      <p>${h3.content}</p>`;
      body += `\n    </div>`;
    }
  }

  // Content 段落（如果有 heroImage 且 position 是 middle，在中间插入图）
  if (section.content) {
    if (section.heroImage && section.heroImage.position === 'middle') {
      const paras = section.content;
      const mid = Math.floor(paras.length / 2);
      for (let i = 0; i < mid; i++) {
        body += `\n    <p>${paras[i]}</p>`;
      }
      body += `\n    <img class="full-phrase-hero" src="${section.heroImage.src}" alt="${section.heroImage.alt}" loading="lazy" width="800" height="300">`;
      for (let i = mid; i < paras.length; i++) {
        body += `\n    <p>${paras[i]}</p>`;
      }
    } else {
      for (const para of section.content) {
        body += `\n    <p>${para}</p>`;
      }
    }
  }

  return `  <section class="content-section">
${body}
  </section>`;
}

// ==========================================================
// 20 张 Gallery items
// ==========================================================
function renderGalleryItems(phrase) {
  const items = phrase.gallery.items.map(item => {
    const n = String(item.n).padStart(2, '0');
    const src = `images/${phrase.slug}-gallery-${n}-${item.fileSuffix}.png`;
    return `      <figure class="gallery-item"><img src="${src}" alt="${item.alt}" loading="lazy" width="400" height="240"><figcaption>${item.caption}</figcaption></figure>`;
  });
  return items.join('\n');
}

// ==========================================================
// 5 个 FAQ items
// ==========================================================
function renderFaqItems(faq) {
  return faq.map((f, i) => {
    const openClass = i === 0 ? ' open' : '';
    return `      <div class="faq-item${openClass}">
        <div class="faq-question" onclick="this.parentElement.classList.toggle('open')">
          <h3>${f.question}</h3>
          <span class="faq-icon">+</span>
        </div>
        <div class="faq-answer">
          ${f.answer}
        </div>
      </div>`;
  }).join('\n\n');
}

main();
