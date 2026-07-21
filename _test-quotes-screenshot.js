const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1400, height: 1200 } });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGE ERR: ' + e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('CONSOLE ERR: ' + msg.text()); });
  const OUT = 'C:/Users/Administrator/AppData/Local/Temp/claude/E-------AIweb----------Arabic-Calligraphy-Generator/57ca177a-6b55-4c39-8ae3-ebc425b5bdf1/scratchpad/';
  await page.goto('http://localhost:8765/arabic-tattoo-quotes.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: OUT + 'quotes-01-top.png', fullPage: false });
  for (const [id, tag] of [['themes','themes'],['one-liners','oneliners'],['traditions','traditions'],['choose','choose']]) {
    await page.evaluate(i => document.getElementById(i).scrollIntoView({ block: 'start' }), id);
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: OUT + `quotes-${tag}.png`, fullPage: false });
  }
  const imgStatus = await page.evaluate(() => Array.from(document.querySelectorAll('img')).map(i => ({ loaded: i.complete && i.naturalWidth > 0 })));
  console.log('Image load: ' + imgStatus.filter(i => i.loaded).length + '/' + imgStatus.length);
  console.log('Errors:', errors.length === 0 ? '(none)' : errors.filter(e => !e.includes('CONNECTION_CLOSED')).join('\n  ') || '(only python-server flakes)');
  await browser.close();
})();
