const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const dir = path.join(__dirname);
  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-gpu','--hide-scrollbars','--force-color-profile=srgb'] });
  const page = await browser.newPage();
  await page.setViewport({ width:1300, height:1500, deviceScaleFactor:2 });
  await page.goto('file://'+path.join(dir,'workout-screens.html'), { waitUntil:'networkidle0' });
  await page.evaluate(()=>{ const f=document.getElementById('f3'); f.style.height='auto'; f.style.overflow='visible'; });
  await page.evaluate(()=>document.fonts.ready);
  await new Promise(r=>setTimeout(r,400));
  const el = await page.$('#f3');
  await el.screenshot({ path: path.join(dir,'shot-f3-running.png') });
  await browser.close();
  console.log('done');
})().catch(e=>{console.error(e);process.exit(1);});
