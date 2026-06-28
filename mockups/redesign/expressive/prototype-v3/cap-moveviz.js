const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const dir = path.join(__dirname);
  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-gpu','--force-color-profile=srgb'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1360, height: 280, deviceScaleFactor: 2 });
  await page.goto('file://'+path.join(dir,'moveviz-preview.html'), { waitUntil:'networkidle0' });
  // let the animation reach a clear mid-stride frame
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => setTimeout(r, 190))));
  await page.screenshot({ path: path.join(dir,'shot-moveviz-running.png') });
  await browser.close();
  console.log('done');
})().catch(e=>{console.error(e);process.exit(1);});
