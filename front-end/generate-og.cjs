const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

  const file = 'file://' + path.resolve(__dirname, 'og-template.html');
  await page.goto(file, { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({
    path: path.resolve(__dirname, 'public/og-image.png'),
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });

  await browser.close();
  console.log('✓ og-image.png generated at 2x');
})();
