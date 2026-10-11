#!/usr/bin/env node
// Run after `npm install --no-save --prefix source playwright-core` in the topic directory.
const { chromium } = require('playwright-core');
const { pathToFileURL } = require('node:url');
const { writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const topic = resolve(__dirname, '..');
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async () => {
  const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
  const results = [];
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const errors = [], external = [], failed = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', r => { if (/^https?:/.test(r.url())) external.push(r.url()); });
    page.on('requestfailed', r => failed.push(`${r.url()} :: ${r.failure()?.errorText}`));
    await page.goto(pathToFileURL(resolve(topic, 'index.html')).href, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.__selftest === 'function');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.getElementById('rdName')?.textContent !== '—');
    if (width === 1440) await page.screenshot({ path: resolve(topic, 'preview.png'), fullPage: true });
    const selftest = await page.evaluate(() => window.__selftest());
    const initialName = await page.locator('#rdName').textContent();
    await page.locator('[data-k="8"]').first().click();
    await page.waitForFunction(before => document.getElementById('rdName')?.textContent !== before, initialName);
    const selectedName = await page.locator('#rdName').textContent();
    await page.locator('#slN').evaluate(el => { el.value = '24'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    const order = await page.locator('#vN').textContent();
    await page.locator('[data-mode="f"]').click();
    const activeMode = await page.locator('[data-mode="f"]').getAttribute('class');
    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: innerWidth, bodyHeight: document.body.scrollHeight, brokenFonts: [...document.fonts].filter(f => f.status === 'error').map(f => f.family) }));
    const checks = {
      selftest: selftest.ok === true,
      functionSwitch: initialName !== selectedName && selectedName.trim() !== '—',
      orderSlider: order.trim() === '24',
      modeSwitch: activeMode.includes('on'),
      noHorizontalOverflow: dimensions.scrollWidth <= width + 1,
      fonts: dimensions.brokenFonts.length === 0,
      noErrors: errors.length === 0,
      noExternalRequests: external.length === 0,
      noFailedRequests: failed.length === 0,
    };
    results.push({ width, dimensions, checks, errors, external, failed });
    await page.close();
  }
  await browser.close();
  const report = { ok: results.every(r => Object.values(r.checks).every(Boolean)), results };
  writeFileSync(resolve(__dirname, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
  if (!report.ok) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
