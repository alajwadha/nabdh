const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const dir = path.join(__dirname);
  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-gpu','--hide-scrollbars','--force-color-profile=srgb'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 920, deviceScaleFactor: 2 });
  await page.goto('file://'+path.join(dir,'body-food-screens.html'), { waitUntil:'networkidle0' });
  await page.evaluate(()=>document.fonts.ready);
  await new Promise(r=>setTimeout(r,400));
  for (const id of ['f1','f2']) { const el = await page.$('#'+id); await el.screenshot({ path: path.join(dir,'shot-'+id+'-bf.png') }); console.log('shot', id); }
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
