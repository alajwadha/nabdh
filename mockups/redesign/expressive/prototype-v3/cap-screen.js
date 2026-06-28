const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const file = process.argv[2];
  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-gpu','--force-color-profile=srgb'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 440, height: 820, deviceScaleFactor: 2 });
  await page.goto('file://'+path.join(__dirname, file), { waitUntil:'networkidle0' });
  await page.screenshot({ path: path.join(__dirname, file.replace('.html','.png')), fullPage:true });
  await browser.close(); console.log('done');
})().catch(e=>{console.error(e);process.exit(1);});
