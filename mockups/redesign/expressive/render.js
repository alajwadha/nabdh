// Renders each redesign option HTML to a PNG. Usage: node render.js [name...]
const puppeteer = require('puppeteer');
const path = require('path');

const pages = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['option-a-sahifa', 'option-b-majlis', 'option-c-mizan'];

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb', '--ignore-certificate-errors'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1370, height: 1060, deviceScaleFactor: 2 });
  for (const name of pages) {
    const file = path.join(__dirname, name + '.html');
    await page.goto('file://' + file, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 300));
    const size = await page.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
    await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 200));
    await page.screenshot({ path: path.join(__dirname, name + '.png'), fullPage: true });
    console.log('rendered', name + '.png', size.w + 'x' + size.h);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
