const fs = require('fs');
const path = require('path');

// ========== 配置 ==========
const SITE_URL = 'https://arabiccalligraphygenerator.online';
const TODAY = new Date().toISOString().split('T')[0];

// 页面优先级配置
const priorityConfig = {
  'index.html': { priority: '1.0', changefreq: 'weekly' },
  'blog.html': { priority: '0.9', changefreq: 'weekly' },
  // 博客文章
  'arabic-calligraphy-styles.html': { priority: '0.8', changefreq: 'monthly' },
  'arabic-name-generator.html': { priority: '0.8', changefreq: 'monthly' },
  'write-my-name-in-arabic.html': { priority: '0.8', changefreq: 'monthly' },
  'write-name-arabic-calligraphy.html': { priority: '0.8', changefreq: 'monthly' },
  // 其他页面
  'about.html': { priority: '0.5', changefreq: 'monthly' },
  'contact.html': { priority: '0.5', changefreq: 'monthly' },
  'privacy-policy.html': { priority: '0.3', changefreq: 'yearly' },
  'terms.html': { priority: '0.3', changefreq: 'yearly' },
};

// 默认配置（新文章自动使用）
const defaultBlogConfig = { priority: '0.8', changefreq: 'monthly' };
const defaultConfig = { priority: '0.5', changefreq: 'monthly' };

// 排除的文件
const excludeFiles = ['404.html'];

// ========== 生成 Sitemap ==========
function generateSitemap() {
  // 获取所有 HTML 文件
  const files = fs.readdirSync('.').filter(file => 
    file.endsWith('.html') && !excludeFiles.includes(file)
  );

  console.log('Found HTML files:', files);

  // 生成 URL 条目
  const urls = files.map(file => {
    const config = priorityConfig[file] || 
      (file !== 'index.html' && file !== 'about.html' && file !== 'contact.html' && 
       file !== 'privacy-policy.html' && file !== 'terms.html' && file !== 'blog.html'
        ? defaultBlogConfig 
        : defaultConfig);
    
    const loc = file === 'index.html' 
      ? SITE_URL + '/' 
      : `${SITE_URL}/${file}`;

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${config.changefreq}</changefreq>
    <priority>${config.priority}</priority>
  </url>`;
  });

  // 按优先级排序
  urls.sort((a, b) => {
    const getPriority = (url) => {
      const match = url.match(/<priority>([\d.]+)<\/priority>/);
      return match ? parseFloat(match[1]) : 0;
    };
    return getPriority(b) - getPriority(a);
  });

  // 生成完整 sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  // 写入文件
  fs.writeFileSync('sitemap.xml', sitemap);
  console.log('✅ sitemap.xml generated successfully!');
  console.log(`   Total URLs: ${files.length}`);
}

generateSitemap();