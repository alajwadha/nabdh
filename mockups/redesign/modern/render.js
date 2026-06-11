// Renders every modern option HTML in this folder to PNG. Usage: node render.js [name...]
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const pages = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(__dirname).filter(f => f.endsWith('.html')).map(f => f.replace(/\.html$/, '')).sort();

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb', '--ignore-certificate-errors'] });
  const page = await browser.newPage();
  for (const name of pages) {
    await page.setViewport({ width: 470, height: 980, deviceScaleFactor: 2 });
    await page.goto('file://' + path.join(__dirname, name + '.html'), { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 250));
    const size = await page.evaluate(() => ({ w: Math.max(470, document.body.scrollWidth), h: document.body.scrollHeight }));
    await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 150));
    await page.screenshot({ path: path.join(__dirname, name + '.png'), fullPage: true });
    console.log('rendered', name + '.png', size.w + 'x' + size.h);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
