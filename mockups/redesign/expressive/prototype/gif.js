// Records a real-time walkthrough of the prototype as a looping GIF.
const puppeteer = require('puppeteer');
const { PNG } = require('pngjs');
const GifEncoder = require('gif-encoder');
const fs = require('fs');
const path = require('path');

const W = 295, H = 639; // 393x852 * 0.75
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 0.75 });
  await page.goto('file://' + path.join(__dirname, 'index.html'), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);

  const frames = [], delays = [];
  let recording = true, last = 0;
  const recLoop = (async () => {
    const t0 = Date.now(); last = t0;
    while (recording && frames.length < 220) {
      const buf = await page.screenshot({ type: 'png' });
      const now = Date.now();
      delays.push(frames.length === 0 ? 80 : Math.max(30, now - last));
      last = now; frames.push(buf);
    }
  })();

  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  await wait(900);
  await page.click('#enter');        await wait(1900); // sign-in -> today stagger + count-up
  await page.click('[data-v="sleep"]'); await wait(1700);
  await page.click('[data-v="food"]');  await wait(1700);
  await page.click('#fab');             await wait(2400); // camera + recognition
  await page.click('#snap');            await wait(1300); // result sheet
  await page.click('#logit');           await wait(2200); // log -> food updates + toast
  await page.click('[data-v="coach"]'); await wait(900);
  await page.click('[data-q="lift"]');  await wait(2300); // chat round-trip
  await page.click('#theme');           await wait(1400); // dark mode
  await page.click('[data-v="today"]'); await wait(1500);
  recording = false; await recLoop;
  await browser.close();
  console.log('captured', frames.length, 'frames');

  const gif = new GifEncoder(W, H, { highWaterMark: 128 * 1024 * 1024 });
  const out = fs.createWriteStream(path.join(__dirname, 'walkthrough.gif'));
  gif.pipe(out); gif.setRepeat(0); gif.setQuality(13); gif.writeHeader();
  for (let i = 0; i < frames.length; i++) {
    const p = PNG.sync.read(frames[i]);
    gif.setDelay(delays[i]); gif.addFrame(p.data);
  }
  gif.setDelay(1600); gif.addFrame(PNG.sync.read(frames[frames.length - 1]).data);
  gif.finish();
  await new Promise(r => out.on('finish', r));
  console.log('walkthrough.gif written');
})().catch(e => { console.error(e); process.exit(1); });
