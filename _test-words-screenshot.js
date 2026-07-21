const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1400, height: 1200 } });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGE ERR: ' + e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('CONSOLE ERR: ' + msg.text()); });

  const OUT = 'C:/Users/Administrator/AppData/Local/Temp/claude/E-------AIweb----------Arabic-Calligraphy-Generator/57ca177a-6b55-4c39-8ae3-ebc425b5bdf1/scratchpad/';

  await page.goto('http://localhost:8765/arabic-words-tattoo.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: OUT + 'words-01-top.png', fullPage: false });
  console.log('S1: top');

  for (const [id, tag] of [['themes','themes'],['one-word','oneword'],['with-meanings','meanings'],['choose','choose'],['gallery','gallery']]) {
    await page.evaluate((i) => document.getElementById(i).scrollIntoView({ block: 'start' }), id);
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: OUT + `words-${tag}.png`, fullPage: false });
    console.log('S: ' + tag);
  }

  const imgStatus = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).map(i => ({ src: i.src.replace(location.origin, ''), loaded: i.complete && i.naturalWidth > 0 }));
  });
  const broken = imgStatus.filter(i => !i.loaded);
  console.log('\nImage load: ' + (imgStatus.length - broken.length) + '/' + imgStatus.length + ' loaded');
  broken.forEach(b => console.log('  BROKEN: ' + b.src));

  console.log('\nPage errors:');
  if (errors.length === 0) console.log('  (none)');
  errors.forEach(e => console.log(' - ' + e));

  await browser.close();
})();
