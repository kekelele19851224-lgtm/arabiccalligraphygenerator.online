const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1400, height: 1200 } });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGE ERR: ' + e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('CONSOLE ERR: ' + msg.text()); });

  const OUT = 'C:/Users/Administrator/AppData/Local/Temp/claude/E-------AIweb----------Arabic-Calligraphy-Generator/57ca177a-6b55-4c39-8ae3-ebc425b5bdf1/scratchpad/';

  await page.goto('http://localhost:8765/arabic-tattoo-designs.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: OUT + 'designs-01-top.png', fullPage: false });
  console.log('S1: top (hero+nav)');

  await page.evaluate(() => document.querySelector('.tt-container').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: OUT + 'designs-02-tool.png', fullPage: false });
  console.log('S2: tool');

  await page.evaluate(() => document.getElementById('themes').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: OUT + 'designs-03-themes.png', fullPage: false });
  console.log('S3: themes section');

  await page.evaluate(() => document.getElementById('gender').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: OUT + 'designs-04-gender.png', fullPage: false });
  console.log('S4: gender section');

  await page.evaluate(() => document.getElementById('placement').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: OUT + 'designs-05-placement.png', fullPage: false });
  console.log('S5: placement section');

  await page.evaluate(() => document.getElementById('choose').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: OUT + 'designs-06-choose.png', fullPage: false });
  console.log('S6: choose checklist');

  await page.evaluate(() => document.getElementById('gallery').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: OUT + 'designs-07-gallery.png', fullPage: false });
  console.log('S7: gallery');

  await page.screenshot({ path: OUT + 'designs-08-fullpage.png', fullPage: true });
  console.log('S8: full page');

  const imgStatus = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).map(i => ({ src: i.src.replace(location.origin, ''), loaded: i.complete && i.naturalWidth > 0 }));
  });
  const broken = imgStatus.filter(i => !i.loaded);
  console.log('\nImage load: ' + (imgStatus.length - broken.length) + '/' + imgStatus.length + ' loaded');
  broken.forEach(b => console.log('  BROKEN: ' + b.src));

  console.log('\nErrors:');
  if (errors.length === 0) console.log('  (none)');
  errors.forEach(e => console.log(' - ' + e));

  await browser.close();
})();
