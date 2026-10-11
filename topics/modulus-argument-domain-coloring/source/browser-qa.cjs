#!/usr/bin/env node
// Re-run with: npm install --no-save --prefix source playwright-core
// then: node source/browser-qa.cjs (from the topic directory).
const { chromium } = require('playwright-core');
const { pathToFileURL } = require('node:url');
const { writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const topic = resolve(__dirname, '..');
const lesson = resolve(topic, 'index.html');
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async () => {
  const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
  const results = [];
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const errors = [], external = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', r => { if (/^https?:/.test(r.url())) external.push(r.url()); });
    await page.goto(pathToFileURL(lesson).href, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.__selftest === 'function');
    const selftest = await page.evaluate(() => window.__selftest());
    const initial = await page.locator('#rinv').textContent();
    await page.locator('#zero').click();
    const zero = await page.locator('#interpret').textContent();
    await page.locator('#reset').click();
    const reset = await page.locator('#rz').textContent();
    await page.locator('#x').fill('2');
    const changed = await page.locator('#rz').textContent();
    await page.locator('#reset').click();
    const box = await page.locator('#plane').boundingBox();
    await page.locator('#plane').click({ position: { x: box.width/2, y: box.height/2 } });
    const planeSelected = await page.locator('#rz').textContent();
    await page.locator('#reset').click();
    const mapbox = await page.locator('#argmap').boundingBox();
    await page.locator('#argmap').click({ position: { x: mapbox.width * .75, y: mapbox.height * .5 } });
    const mapSelected = await page.locator('#rz').textContent();
    await page.locator('#reset').click();
    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, bodyHeight: document.body.scrollHeight }));
    if (width === 1440) await page.screenshot({ path: resolve(topic, 'preview.png'), fullPage: true });
    const checks = {
      selftest: selftest.ok,
      inverse: initial.includes('0.4065') && initial.includes('0.3252'),
      zero: zero.includes('没有定义') && zero.includes('不能取倒数'),
      reset: reset.includes('1.5 + 1.2i'),
      input: changed.includes('2 + 1.2i'),
      planeClick: planeSelected !== '1.5 + 1.2i',
      mapClick: mapSelected !== '1.5 + 1.2i',
      noOverflow: dimensions.scrollWidth <= dimensions.innerWidth + 1,
      noErrors: errors.length === 0,
      noExternal: external.length === 0,
    };
    results.push({ width, dimensions, checks, errors, external });
    await page.close();
  }
  await browser.close();
  const output = { ok: results.every(r => Object.values(r.checks).every(Boolean)), results };
  writeFileSync(resolve(__dirname, 'browser-qa.json'), JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify(output));
  if (!output.ok) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
