const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const dir = path.join(__dirname);
  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-gpu','--hide-scrollbars','--force-color-profile=srgb'] });
  const page = await browser.newPage();
  await page.setViewport({ width:900, height:1500, deviceScaleFactor:2 });
  await page.goto('file://'+path.join(dir,'body-food-screens.html'), { waitUntil:'networkidle0' });
  await page.evaluate(()=>{ const f=document.getElementById('f1'); f.style.height='auto'; f.style.overflow='visible'; });
  await page.evaluate(()=>document.fonts.ready);
  await new Promise(r=>setTimeout(r,400));
  const el = await page.$('#f1');
  await el.screenshot({ path: path.join(dir,'shot-f1-bf-full.png') });
  await browser.close();
  console.log('done');
})().catch(e=>{console.error(e);process.exit(1);});
