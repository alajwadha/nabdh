const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const dir = path.join(__dirname);
  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-gpu','--hide-scrollbars','--force-color-profile=srgb'] });
  const page = await browser.newPage();
  await page.setViewport({ width:393, height:852, deviceScaleFactor:2 });
  await page.goto('file://'+path.join(dir,'index.html'), { waitUntil:'networkidle0' });
  await page.evaluate(()=>localStorage.clear());
  await page.reload({ waitUntil:'networkidle0' });
  await page.evaluate(()=>document.fonts.ready);
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  await wait(600);
  await page.click('#enter'); await wait(1400);
  await page.click('[data-v="sleep"]'); await wait(900);
  // scroll the active sleep section so the wind-down card is in view
  await page.evaluate(()=>{
    const v = document.querySelector('.view.act');
    if (v) v.scrollTop = v.scrollHeight;
  });
  await wait(700);
  await page.screenshot({ path: path.join(dir,'state-18b-winddown.png') });
  await browser.close();
  console.log('done');
})().catch(e=>{console.error(e);process.exit(1);});
