// Records a flagship.html animation in real-time via Puppeteer (installed Chrome),
// then encodes a looping GIF + a keyframe filmstrip PNG. Pure-JS, no ffmpeg.
const puppeteer = require('puppeteer-core');
const { PNG } = require('pngjs');
const GifEncoder = require('gif-encoder');
const fs = require('fs');
const path = require('path');

const DIR = 'C:\\Users\\Ali-h\\nabdh\\mockups';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PAGE = process.argv[2] || 'flagship';
const URL = 'file:///C:/Users/Ali-h/nabdh/mockups/' + PAGE + '.html';
const W = 412, H = 940, TOTAL = 2700, MAXF = 32;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => (document.fonts ? document.fonts.ready : true));

  const frames = [], delays = [];
  await page.evaluate(() => window.NABDH.play());
  const t0 = Date.now(); let last = t0;
  while (Date.now() - t0 < TOTAL && frames.length < MAXF) {
    const buf = await page.screenshot({ type: 'png' });
    const now = Date.now();
    delays.push(frames.length === 0 ? 60 : Math.max(40, now - last));
    last = now; frames.push(buf);
  }
  console.log('captured', frames.length, 'frames');

  // ---- encode GIF ----
  const gif = new GifEncoder(W, H, { highWaterMark: 96 * 1024 * 1024 });
  const out = fs.createWriteStream(path.join(DIR, PAGE + '.gif'));
  gif.pipe(out);
  gif.setRepeat(0); gif.setQuality(12); gif.writeHeader();
  for (let i = 0; i < frames.length; i++) { gif.setDelay(delays[i]); gif.addFrame(PNG.sync.read(frames[i]).data); }
  gif.setDelay(1400); gif.addFrame(PNG.sync.read(frames[frames.length - 1]).data); // hold last
  gif.finish();
  await new Promise(r => out.on('finish', r));
  console.log('gif written:', PAGE + '.gif');

  // ---- keyframe filmstrip ----
  const cum = []; let s = 0; for (const d of delays) { s += d; cum.push(s); }
  const n = frames.length, picks = [];
  for (let i = 0; i < 8; i++) picks.push(Math.round(i * (n - 1) / 7));
  const cells = picks.map((idx, k) => {
    const fp = path.join(DIR, 'kf' + k + '.png'); fs.writeFileSync(fp, frames[idx]);
    return '<div class=cell><div class=ph><img src="file:///' + fp.replace(/\\/g, '/') + '"></div><div class=cap>t = ' + cum[idx] + ' ms</div></div>';
  });
  const fhtml = '<!doctype html><meta charset=utf-8><style>*{margin:0;box-sizing:border-box}body{background:#070A0E;font-family:Segoe UI,system-ui,sans-serif;padding:34px}h1{color:#fff;font-size:24px;margin-bottom:6px;font-weight:700}p{color:#9AA7B3;font-size:14px;margin-bottom:26px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:26px 18px}.cell{display:flex;flex-direction:column;align-items:center}.ph{width:272px;height:621px;border-radius:26px;overflow:hidden;border:1px solid #222B33}.ph img{width:272px;display:block}.cap{margin-top:11px;color:#36E2B4;font-size:15px;font-weight:600;letter-spacing:1px}</style>'
    + '<h1>Nabdh &mdash; dashboard load sequence</h1><p>Real-time capture of the flagship design animating in on app open (left&rarr;right, top&rarr;bottom).</p><div class=grid>' + cells.join('') + '</div>';
  fs.writeFileSync(path.join(DIR, PAGE + '-filmstrip.html'), fhtml);
  await page.setViewport({ width: 1240, height: 1500, deviceScaleFactor: 2 });
  await page.goto('file:///C:/Users/Ali-h/nabdh/mockups/' + PAGE + '-filmstrip.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 350));
  await page.screenshot({ path: path.join(DIR, PAGE + '-filmstrip.png'), fullPage: true });
  console.log('filmstrip written:', PAGE + '-filmstrip.png');

  await browser.close();
})().catch(e => { console.error('ERR', e); process.exit(1); });
