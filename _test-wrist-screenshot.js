const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1400, height: 1200 } });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGE ERR: ' + e.message));
  const OUT = 'C:/Users/Administrator/AppData/Local/Temp/claude/E-------AIweb----------Arabic-Calligraphy-Generator/57ca177a-6b55-4c39-8ae3-ebc425b5bdf1/scratchpad/';
  await page.goto('http://localhost:8765/arabic-wrist-tattoo.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: OUT + 'wrist-top.png', fullPage: false });
  await page.evaluate(() => document.getElementById('placement').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: OUT + 'wrist-placement.png', fullPage: false });
  console.log('Errors:', errors.length === 0 ? '(none)' : errors.join(' | '));
  await browser.close();
})();
