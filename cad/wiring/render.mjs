// SVG generation and freshness checks need only Python's standard library.
// NODE_PATH must expose sharp + playwright for PNG/PDF export.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const python = process.env.PYTHON || 'python3';
const runPython = (file, args = []) => execFileSync(python, [path.join(here, file), ...args], { stdio: 'inherit' });
if (process.argv.includes('--check')) {
  runPython('exports.py');
  process.exit(0);
}

// Always rebuild the SVGs first. One source supplies screen and paper views.
runPython('build.py');
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const { chromium } = require('playwright');
const stems = ['v1-proof-el-01-overview', 'v1-proof-el-02-pico-imu', 'v1-proof-el-03-wheel-harness', 'v1-proof-el-04-power-servo', 'v1-proof-el-05-both-wheels'];
const sheets = await Promise.all(stems.map(stem => readFile(path.join(here, stem + '.svg'), 'utf8')));
for (const stem of stems) {
  await sharp(path.join(here, stem + '.svg'), { density: 144 }).resize({ width: 4800, withoutEnlargement: true }).png().toFile(path.join(here, stem + '.png'));
}
if (process.argv.includes('--png-only')) process.exit(0);

const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
try {
  const page = await browser.newPage();
  // Prefix local SVG IDs when multiple sheets share one print document.
  const inlineSheets = sheets.map((svg, i) => svg
    .replace(/id="([^"]+)"/g, (_, id) => `id="sheet-${i}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#sheet-${i}-${id})`)
    .replace('aria-labelledby="title desc"', `aria-labelledby="sheet-${i}-title sheet-${i}-desc"`));
  const css = '@page{size:17in 11in;margin:0.5in}html,body{margin:0;padding:0}.sheet{width:16in;height:10in;break-after:page;break-inside:avoid}.sheet:last-child{break-after:auto}svg{width:100%;height:100%;display:block}';
  async function exportPDF(filename, indices, title) {
    await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + title + '</title><style>' + css + '</style></head><body>' + indices.map(i => '<section class="sheet">' + inlineSheets[i] + '</section>').join('') + '</body></html>');
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: path.join(here, filename), printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false });
  }
  await exportPDF('v1-proof-el-01-overview-11x17.pdf', [0], 'Hux EL-01 complete system wiring - 11 x 17');
  await exportPDF('v1-proof-el-05-both-wheels-11x17.pdf', [4], 'Hux EL-05 both wheel motors - 11 x 17');
  await exportPDF('v1-proof-wiring-atlas.pdf', [0, 1, 2, 3, 4], 'Hux V1-PROOF wiring atlas - 11 x 17');
} finally {
  await browser.close();
}
// A failed export must not certify old PDFs as current.
runPython('exports.py', ['--write']);
console.log('Exported five PNGs, two single-sheet PDFs and the five-sheet atlas. Each PDF page is 17 x 11 inches with 0.5-inch margins.');
