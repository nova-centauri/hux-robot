// Optional export step; SVG source rebuild needs only Python's standard library.
// NODE_PATH must expose sharp + playwright from the Codex bundled runtime.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const stems = ['v1-proof-el-01-overview','v1-proof-el-02-pico-imu','v1-proof-el-03-wheel-harness','v1-proof-el-04-power-servo','v1-proof-el-05-both-wheels'];
const sheets = await Promise.all(stems.map(stem => readFile(path.join(here,stem+'.svg'),'utf8')));
const sizes = sheets.map(svg => svg.match(/viewBox="0 0 (\d+) (\d+)"/).slice(1).map(Number));
for (const stem of stems) {
  await sharp(path.join(here, stem+'.svg'), {density:144}).resize({width:4800,withoutEnlargement:true}).png().toFile(path.join(here, stem+'.png'));
}
if (process.argv.includes('--png-only')) process.exit(0);
const browser = await chromium.launch({headless:true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
const page = await browser.newPage();
// Each standalone SVG has local IDs. Prefix them when sharing one print DOM.
const inlineSheets = sheets.map((svg,i) => svg
  .replace(/id="([^"]+)"/g,(_,id)=>`id="sheet-${i}-${id}"`)
  .replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#sheet-${i}-${id})`)
  .replace('aria-labelledby="title desc"',`aria-labelledby="sheet-${i}-title sheet-${i}-desc"`));
const pageRules = sizes.map(([w,h],i) => `@page sheet${i}{size:${w/100}in ${h/100}in;margin:0}.sheet-${i}{page:sheet${i};width:${w/100}in;height:${h/100}in}`).join('');
await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Hux V1-PROOF wiring atlas</title><style>'+pageRules+'body{margin:0}.sheet{break-after:page}.sheet:last-child{break-after:auto}svg{width:100%;height:100%;display:block}</style></head><body>'+inlineSheets.map((svg,i)=>'<section class="sheet sheet-'+i+'">'+svg+'</section>').join('')+'</body></html>');
await page.pdf({path:path.join(here,'v1-proof-wiring-atlas.pdf'), printBackground:true, preferCSSPageSize:true});
await browser.close();
console.log('Exported five PNG previews (up to 4800 px wide) and a five-page vector PDF with each sheet’s original aspect ratio.');
