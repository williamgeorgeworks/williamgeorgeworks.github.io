const { chromium } = require('playwright-core'); const path = require('path');
(async () => { const b = await chromium.launch({ executablePath: path.join(process.env.HOME, '.cache/ms-playwright/chromium-1255/chrome-linux64/chrome') });
  const p = await b.newPage({ viewport: { width: 1024, height: 1024 } }); await p.goto('file://' + path.join(__dirname, 'icon.html'));
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(__dirname, 'icon-1024.png'), omitBackground: true }); await b.close(); })();
