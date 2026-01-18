const fs = require('fs');
const path = require('path');

// ========== 配置 ==========
const SITE_URL = 'https://arabiccalligraphygenerator.online';

// 页面优先级配置
const priorityConfig = {
  'index.html': { priority: '1.0', changefreq: 'weekly' },
  'blog.html': { priority: '0.9', changefreq: 'weekly' },
  'about.html': { priority: '0.5', changefreq: 'monthly' },
  'contact.html': { priority: '0.5', changefreq: 'monthly' },
  'privacy-policy.html': { priority: '0.3', changefreq: 'yearly' },
  'terms.html': { priority: '0.3', changefreq: 'yearly' },
};

// 博客文章默认配置
const defaultBlogConfig = { priority: '0.8', changefreq: 'monthly' };

// 排除的文件
const excludeFiles = ['404.html'];

// 非博客页面列表
const nonBlogPages = ['index.html', 'about.html', 'contact.html', 'privacy-policy.html', 'terms.html', 'blog.html'];

// ========== 生成 Sitemap ==========
function generateSitemap() {
  // 获取所有 HTML 文件
  const files = fs.readdirSync('.').filter(file => 
    file.endsWith('.html') && !excludeFiles.includes(file)
  );

  console.log('Found HTML files:', files);

  // 生成 URL 条目
  const urls = files.map(file => {
    // 获取文件的实际修改时间
    const stats = fs.statSync(file);
    const lastmod = stats.mtime.toISOString().split('T')[0];
    
    // 获取配置
    const config = priorityConfig[file] || defaultBlogConfig;
    
    // 生成URL
    const loc = file === 'index.html' 
      ? SITE_URL + '/' 
      : `${SITE_URL}/${file}`;

    return {
      priority: parseFloat(config.priority),
      xml: `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${config.changefreq}</changefreq>
    <priority>${config.priority}</priority>
  </url>`
    };
  });

  // 按优先级排序
  urls.sort((a, b) => b.priority - a.priority);

  // 生成完整 sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => u.xml).join('\n')}
</urlset>`;

  // 写入文件
  fs.writeFileSync('sitemap.xml', sitemap);
  console.log('✅ sitemap.xml generated successfully!');
  console.log(`   Total URLs: ${files.length}`);
  
  // 显示每个文件的lastmod
  console.log('\n📅 Last modified dates:');
  files.forEach(file => {
    const stats = fs.statSync(file);
    const lastmod = stats.mtime.toISOString().split('T')[0];
    console.log(`   ${file}: ${lastmod}`);
  });
}

generateSitemap();