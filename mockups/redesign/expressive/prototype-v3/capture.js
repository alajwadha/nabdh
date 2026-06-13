// Drives prototype v3 through its flow and saves canonical state screenshots.
// Run from repo with: node mockups/redesign/expressive/prototype-v3/capture.js
const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-gpu','--hide-scrollbars','--force-color-profile=srgb'] });
  const page = await browser.newPage();
  await page.setViewport({ width:393, height:852, deviceScaleFactor:2 });
  await page.goto('file://'+path.join(__dirname,'index.html'), { waitUntil:'networkidle0' });
  await page.evaluate(()=>localStorage.clear());
  await page.reload({ waitUntil:'networkidle0' });
  await page.evaluate(()=>document.fonts.ready);
  const shot = async n => { await page.screenshot({ path: path.join(__dirname,'state-'+n+'.png') }); console.log('shot',n); };
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  const reset = async () => { await page.evaluate(()=>{document.getElementById('track').scrollLeft=0;}); };
  const closeBackdrop = async () => { await page.evaluate(()=>document.getElementById('backdrop').click()); };

  await wait(700); await shot('01-signin');
  await page.click('#enter'); await wait(1600); await shot('02-today');

  // swipeable insight hero
  await page.evaluate(()=>{const t=document.getElementById('track');t.scrollLeft=t.clientWidth;});
  await wait(700); await shot('03-hero-predictive');
  await page.evaluate(()=>{const t=document.getElementById('track');t.scrollLeft=t.clientWidth*3;});
  await wait(700); await shot('04-hero-heat');
  await reset(); await wait(400);

  // customize Today
  await page.click('#editToggle'); await wait(700); await shot('05-customize');
  await page.click('#addTile'); await wait(800); await shot('06-add-metric');
  await page.click('.mopt[data-k="stress"]'); await wait(200);
  await page.click('.mopt[data-k="water"]'); await wait(400);
  await closeBackdrop(); await wait(600);
  await page.click('#editDone'); await wait(600); await shot('07-today-customised');

  // metric detail
  await page.click('.tile[data-metric="hrv"]'); await wait(1300); await shot('08-metric-detail');
  await page.click('.rngs [data-r="30D"]'); await wait(1100); await shot('09-metric-30d');
  await closeBackdrop(); await wait(700);

  // ramadan mode
  await page.click('#ramadan'); await wait(900); await shot('10-ramadan');
  await page.click('#ramadan'); await wait(700);

  // FAB quick menu + journal
  await page.click('#fab'); await wait(600); await shot('11-quick-menu');
  await page.click('#q-journal'); await wait(700);
  await page.click('.jchip'); await wait(300); await shot('12-journal');
  await closeBackdrop(); await wait(600);

  // profile / settings
  await page.click('#avatar'); await wait(800); await shot('13-profile');
  await page.click('#conn-fitbit'); await wait(800); await shot('13b-connect');
  await closeBackdrop(); await wait(600);
  await page.evaluate(()=>document.getElementById('profile').scrollTop=940); await wait(400); await shot('14-profile-family');
  await page.click('#profBack'); await wait(700);

  // trends from Today hero
  await page.evaluate(()=>{document.querySelector('.slide[data-act="trends"]').click();}); await wait(1100); await shot('15-trends');
  await page.click('#openWrapped'); await wait(900); await shot('16-wrapped-1');
  await page.click('#stNext'); await wait(700); await shot('17-wrapped-2');
  await page.click('#storyX'); await wait(700);
  await page.click('#trBack'); await wait(700);

  // sleep / food / coach
  await page.click('[data-v="sleep"]'); await wait(900); await shot('18-sleep');
  await page.click('[data-v="food"]'); await wait(1300); await shot('19-food');
  await page.click('[data-v="coach"]'); await wait(700);
  await page.click('[data-q="lift"]'); await wait(2100); await shot('20-coach');
  await page.type('#chatInput','can I have kabsa for dinner?'); await wait(200);
  await page.click('#chatSend'); await wait(1900); await shot('20b-coach-chat');

  // dark mode
  await page.click('#theme'); await wait(800);
  await page.click('[data-v="today"]'); await wait(1100); await shot('21-today-dark');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
