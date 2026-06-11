// Drives the prototype through its full flow and saves state screenshots.
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(__dirname, 'index.html'), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const shot = async (n) => { await page.screenshot({ path: path.join(__dirname, 'state-' + n + '.png') }); console.log('shot', n); };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  await wait(800); await shot('01-signin');
  await page.click('#enter'); await wait(1600); await shot('02-today');
  await page.click('[data-metric="rhr"]'); await wait(1400); await shot('02b-rhr-detail');
  await page.click('.rngs [data-r="30D"]'); await wait(1300); await shot('02c-rhr-30d');
  await page.mouse.click(196, 120); await wait(700);
  await page.click('[data-metric="readiness"]'); await wait(1000); await shot('02d-contributors');
  await page.mouse.click(196, 120); await wait(700);
  await page.click('[data-v="sleep"]'); await wait(1300); await shot('03-sleep');
  await page.click('[data-v="food"]'); await wait(1500); await shot('04-food');
  await page.click('#addwater'); await wait(250); await page.click('#addwater'); await wait(600); await shot('04b-water');
  await page.click('#fab'); await wait(2300); await shot('05-camera');
  await page.click('#snap'); await wait(900); await shot('06-result');
  await page.click('#logit'); await wait(1400); await shot('07-logged');
  await page.click('[data-v="coach"]'); await wait(900); await shot('08-coach');
  await page.click('[data-q="lift"]'); await wait(2100); await shot('09-chat');
  await page.click('#theme'); await wait(900); await shot('10-dark');
  await page.click('[data-v="today"]'); await wait(1100); await shot('11-today-dark');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
