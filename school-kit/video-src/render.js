// node render.js preview 1 2 3   |   node render.js all out.mp4
const { chromium } = require('playwright'); const { spawn } = require('child_process');
const FPS = 30, mode = process.argv[2];
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const fs = require('fs'); if (fs.existsSync(__dirname + '/timeline.json')) await p.addInitScript(t => { window.TL = t }, JSON.parse(fs.readFileSync(__dirname + '/timeline.json', 'utf8')));
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + __dirname + '/video/index.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  if (mode === 'preview') { for (const t of process.argv.slice(3).map(Number)) { await p.evaluate(t => render(t), t); await p.screenshot({ path: `prev_${t}.jpg`, type: 'jpeg', quality: 85 }); } }
  else {
    const DUR = await p.evaluate(() => DUR), N = Math.round(DUR * FPS);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'medium', '-movflags', '+faststart', process.argv[3]], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < N; i++) { await p.evaluate(t => render(t), i / FPS); const buf = await p.screenshot({ type: 'jpeg', quality: 92 }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (i % 300 === 0) console.log(i + '/' + N); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    require('fs').writeFileSync('sfx.json', JSON.stringify(await p.evaluate(() => SFX)));
  }
  await b.close();
})();
