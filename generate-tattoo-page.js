// generate-tattoo-page.js
// 从 data/phrases.json (pageType: tattoo) + templates/tattoo-page.html 生成一个纹身页 HTML
// 用法：node generate-tattoo-page.js <slug>
//       node generate-tattoo-page.js all

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://arabiccalligraphygenerator.online';

function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node generate-tattoo-page.js <slug|all>');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync('data/phrases.json', 'utf8'));
  const template = fs.readFileSync('templates/tattoo-page.html', 'utf8');
  const tattooEntries = data.phrases.filter(p => p.pageType === 'tattoo');

  const targets = arg === 'all' ? tattooEntries : tattooEntries.filter(p => p.slug === arg);
  if (targets.length === 0) {
    console.error(`Tattoo page not found: ${arg}`);
    console.error(`Available: ${tattooEntries.map(p => p.slug).join(', ')}`);
    process.exit(1);
  }

  for (const entry of targets) {
    const rendered = render(template, entry);
    const outputFile = entry.url.replace(/^\//, '') + '.html';
    fs.writeFileSync(outputFile, rendered);
    console.log(`  ✓ ${outputFile}`);
  }
  console.log(`\n✅ Generated ${targets.length} tattoo page(s)`);
}

function render(template, entry) {
  const canonical = SITE_URL + entry.url;
  const og = entry.og || {};
  const schema = entry.schema || {};

  const values = {
    META_TITLE: entry.meta.title,
    META_DESCRIPTION: entry.meta.description,
    CANONICAL_URL: canonical,
    OG_DESCRIPTION: og.description || entry.meta.description,
    TWITTER_TITLE: og.twitterTitle || entry.meta.title,
    TWITTER_DESCRIPTION: og.twitterDescription || og.description || entry.meta.description,
    OG_IMAGE_URL: og.imageUrl || schema.imageSchemaUrl || '',
    WEBAPP_NAME: schema.webAppName || entry.displayName,
    WEBAPP_DESCRIPTION: schema.webAppDescription || entry.meta.description,
    IMAGE_SCHEMA_URL: schema.imageSchemaUrl || '',
    IMAGE_SCHEMA_NAME: schema.imageSchemaName || entry.displayName,
    IMAGE_SCHEMA_DESCRIPTION: schema.imageSchemaDescription || '',
    BREADCRUMB_LABEL: entry.breadcrumbLabel || entry.displayName,
    H1: entry.hero.h1,
    HERO_DESCRIPTION: entry.hero.description,
    DEFAULT_TATTOO_TEXT: (entry.tool && entry.tool.defaultText) || 'حب',
    GALLERY_H2: entry.gallery.h2,
    GALLERY_DESCRIPTION: entry.gallery.description,

    HERO_BADGES_HTML: renderBadges(entry.hero.badges || []),
    SECTION_NAV_LINKS: renderSectionNav(entry),
    CONTENT_SECTIONS_HTML: renderSections(entry.sections || []),
    GALLERY_ITEMS_HTML: renderGalleryItems(entry.gallery.items || []),
    FAQ_ITEMS_HTML: renderFaqItems(entry.faq || []),
    FAQ_SCHEMA_MAIN_ENTITY: renderFaqSchema(entry.faq || []),
  };

  let out = template;
  for (const [k, v] of Object.entries(values)) {
    out = out.split('{{' + k + '}}').join(String(v));
  }
  return out;
}

function renderBadges(badges) {
  return badges.map(b => `<span class="hero-badge">✓ ${b}</span>`).join('\n      ');
}

function renderSectionNav(entry) {
  const links = ['    <a href="#generator">Generator</a>'];
  for (const s of (entry.sections || [])) {
    links.push(`    <a href="#${s.id}">${s.navLabel || s.h2}</a>`);
  }
  links.push(`    <a href="#gallery">${(entry.gallery && entry.gallery.navLabel) || 'Gallery'}</a>`);
  return links.join('\n');
}

function renderSections(sections) {
  return sections.map(renderSection).join('\n\n');
}

function renderSection(s) {
  switch (s.type) {
    case 'split':          return renderSplit(s);
    case 'split-with-blocks': return renderSplitBlocks(s);
    case 'split-with-word-grid': return renderSplitWordGrid(s);
    case 'checklist':      return renderChecklist(s);
    default: throw new Error('Unknown section type: ' + s.type);
  }
}

function renderSplit(s) {
  const reverseClass = s.reverse ? ' reverse' : '';
  const paras = (s.intro || []).map(p => `        <p>${p}</p>`).join('\n');
  const img = s.image;
  return `  <section class="content-section">
    <div class="section-split${reverseClass}">
      <div class="section-text">
        <h2 id="${s.id}">${s.h2}</h2>
${paras}
      </div>
      <div class="section-split-image">
        <img src="${img.src}" alt="${img.alt}" loading="lazy" width="800" height="1000">
      </div>
    </div>
  </section>`;
}

function renderSplitBlocks(s) {
  const reverseClass = s.reverse ? ' reverse' : '';
  const paras = (s.intro || []).map(p => `        <p>${p}</p>`).join('\n');
  const img = s.image;
  const blocks = (s.blocks || []).map(b => `
    <div class="style-block">
      <h3>${b.h3}</h3>
      <p>${b.html}</p>
    </div>`).join('\n');
  return `  <section class="content-section">
    <div class="section-split${reverseClass}">
      <div class="section-text">
        <h2 id="${s.id}">${s.h2}</h2>
${paras}
      </div>
      <div class="section-split-image">
        <img src="${img.src}" alt="${img.alt}" loading="lazy" width="800" height="1000">
      </div>
    </div>
${blocks}
  </section>`;
}

function renderSplitWordGrid(s) {
  const reverseClass = s.reverse ? ' reverse' : '';
  const paras = (s.intro || []).map(p => `        <p>${p}</p>`).join('\n');
  const img = s.image;
  const words = (s.words || []).map(w =>
    `      <div class="word-card"><strong>${w.arabic}</strong> — <em>${w.translit}</em> — ${w.meaning}</div>`
  ).join('\n');
  const linkHtml = s.linkHref ? `    <p><a href="${s.linkHref}">${s.linkText}</a></p>` : '';
  return `  <section class="content-section">
    <div class="section-split${reverseClass}">
      <div class="section-text">
        <h2 id="${s.id}">${s.h2}</h2>
${paras}
      </div>
      <div class="section-split-image">
        <img src="${img.src}" alt="${img.alt}" loading="lazy" width="800" height="1000">
      </div>
    </div>
    <div class="word-grid">
${words}
    </div>
${linkHtml}
  </section>`;
}

function renderChecklist(s) {
  const paras = (s.intro || []).map(p => `    <p>${p}</p>`).join('\n');
  const items = (s.items || []).map(i =>
    `      <li><strong>${i.bold}</strong> ${i.rest}</li>`
  ).join('\n');
  return `  <section class="content-section">
    <h2 id="${s.id}">${s.h2}</h2>
${paras}
    <ol class="checklist">
${items}
    </ol>
  </section>`;
}

function renderGalleryItems(items) {
  return items.map(item =>
    `      <figure class="gallery-item"><img src="${item.src}" alt="${item.alt}" loading="lazy" width="400" height="240"><figcaption>${item.caption}</figcaption></figure>`
  ).join('\n');
}

function renderFaqItems(faq) {
  return faq.map((f, i) => {
    const openClass = i === 0 ? ' open' : '';
    return `      <div class="faq-item${openClass}">
        <div class="faq-question" onclick="this.parentElement.classList.toggle('open')">
          <h3>${f.q}</h3>
          <span class="faq-icon">+</span>
        </div>
        <div class="faq-answer">
          ${f.a}
        </div>
      </div>`;
  }).join('\n\n');
}

function renderFaqSchema(faq) {
  const entities = faq.map(f => ({
    "@type": "Question",
    "name": f.q,
    "acceptedAnswer": { "@type": "Answer", "text": f.a }
  }));
  return JSON.stringify(entities, null, 2).split('\n').join('\n    ');
}

main();
