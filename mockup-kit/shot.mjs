#!/usr/bin/env node
// 목업 HTML → PNG 렌더 (Playwright Chromium)
//
//   node shot.mjs <in.html> <out.png> [--w 1600 --h 1000 --scale 2 --dark]
//   node shot.mjs --batch <dir> [--out <dir>] [--w .. --h .. --scale .. --dark]
//
// - 킷 참조: HTML 에서 https://mockup-kit.invalid/kit.css · kit.js 로 쓰면 이 스크립트가 킷 폴더로 연결한다.
//   (목업 HTML 에 로컬 절대경로가 남지 않는다. 상대경로 ../mockup-kit/kit.css 도 그대로 동작)
// - 파일별 크기: <meta name="shot" content="w=1600,h=900,scale=2,dark"> — 명령줄에 준 값이 우선.
// - --batch: dir 의 *.html 전부. 출력 폴더 기본값은 dir 이름이 mockups 면 옆의 ../images, 아니면 dir 자신.
// - 렌더 뒤 점검: 캔버스 밖으로 넘친 내용(잘림)·로컬 경로·IP·이메일 같은 공개 금지 문자열을 경고한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const KIT_DIR = path.dirname(fileURLToPath(import.meta.url));
const KIT_HOST = 'https://mockup-kit.invalid/';

async function loadPlaywright() {
  try { return await import('playwright'); } catch (e) { /* 전역 설치 경로로 재시도 */ }
  const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
  const req = createRequire(path.join(root, 'noop.js'));
  return req('playwright');
}

function parseArgs(argv) {
  const o = { _: [], set: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dark') { o.dark = true; o.set.dark = true; }
    else if (a === '--light') { o.dark = false; o.set.dark = true; }
    else if (a === '--no-lint') o.noLint = true;
    else if (a.startsWith('--')) {
      const k = a.slice(2); const v = argv[++i];
      if (v === undefined) throw new Error(`${a} 뒤에 값이 없다`);
      if (['w', 'h', 'scale'].includes(k)) { o[k] = Number(v); o.set[k] = true; }
      else o[k] = v;
    } else o._.push(a);
  }
  return o;
}

function metaOpts(html) {
  const m = html.match(/<meta\s+name=["']shot["']\s+content=["']([^"']*)["']/i);
  const r = {};
  if (!m) return r;
  for (const part of m[1].split(',').map((s) => s.trim()).filter(Boolean)) {
    const [k, v] = part.split('=').map((s) => s.trim());
    if (k === 'dark' && v === undefined) r.dark = true;
    else if (k === 'dark') r.dark = v !== '0' && v !== 'false';
    else if (['w', 'h', 'scale'].includes(k)) r[k] = Number(v);
  }
  return r;
}

const LINT = [
  [/\/Users\/[A-Za-z0-9._-]+/g, '로컬 절대경로'],
  [/\b100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}\b/g, 'Tailscale IP'],
  [/\b(192\.168|10\.\d{1,3})\.\d{1,3}\.\d{1,3}\b/g, 'LAN IP'],
  [/[A-Za-z0-9-]+\.ts\.net\b/g, '*.ts.net 호스트'],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '이메일'],
  [/\b01[016789]-?\d{3,4}-?\d{4}\b/g, '전화번호'],
  [/(sk-[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{20,}|ghp_[A-Za-z0-9]{20,})/g, 'API 키 모양'],
];
function lint(file, text) {
  const hits = [];
  for (const [re, label] of LINT) {
    const found = text.match(re);
    if (found) hits.push(`${label}: ${[...new Set(found)].slice(0, 3).join(', ')}`);
  }
  for (const h of hits) console.warn(`  ! [공개 점검] ${path.basename(file)} — ${h}`);
  return hits.length;
}

async function renderOne(browser, inFile, outFile, cli) {
  const html = fs.readFileSync(inFile, 'utf8');
  const meta = metaOpts(html);
  const pick = (k, d) => (cli.set[k] ? cli[k] : (meta[k] !== undefined ? meta[k] : d));
  const w = pick('w', 1600), h = pick('h', 1000), scale = pick('scale', 2), dark = !!pick('dark', false);

  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, deviceScaleFactor: scale,
    colorScheme: dark ? 'dark' : 'light',
  });
  await ctx.route(KIT_HOST + '**', (route) => {
    const rel = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/+/, '');
    const fp = path.join(KIT_DIR, rel);
    if (!fp.startsWith(KIT_DIR) || !fs.existsSync(fp)) return route.fulfill({ status: 404, body: 'not found' });
    const types = { '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
    return route.fulfill({
      status: 200, body: fs.readFileSync(fp),
      headers: { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' },
    });
  });
  if (dark) await ctx.addInitScript(() => {
    const on = () => document.documentElement && document.documentElement.classList.add('dark');
    if (!on()) document.addEventListener('DOMContentLoaded', on);
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') errs.push(m.text()); });
  page.on('requestfailed', (r) => errs.push('요청 실패: ' + r.url()));

  await page.goto(pathToFileURL(path.resolve(inFile)).href, { waitUntil: 'load' });
  if (dark) await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForFunction(() => document.documentElement.dataset.kitReady === '1' || !window.Kit, null, { timeout: 8000 }).catch(() => errs.push('kit-ready 대기 시간 초과'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(80);

  const over = await page.evaluate(() => {
    const clipped = [];
    const sel = '.canvas, .stage, .screen, .content, .pane, .two-pane, .mac-window, .mac-body, .terminal-body, .card, .list';
    document.querySelectorAll(sel).forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) {
        const name = el.className.toString().trim().split(/\s+/).slice(0, 2).join('.');
        clipped.push(`.${name} (${el.scrollWidth}x${el.scrollHeight} > ${el.clientWidth}x${el.clientHeight})`);
      }
    });
    return { sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, clipped };
  });
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  await page.screenshot({ path: outFile, clip: { x: 0, y: 0, width: w, height: h } });
  await ctx.close();

  console.log(`✓ ${path.basename(inFile)} → ${outFile}  (${w}x${h} @${scale}x${dark ? ', dark' : ''})`);
  if (over.sw > w + 1 || over.sh > h + 1) console.warn(`  ! [잘림] 문서 크기 ${over.sw}x${over.sh} 가 캔버스 ${w}x${h} 보다 크다`);
  for (const c of over.clipped.slice(0, 6)) console.warn(`  ! [잘림] 내용이 상자를 넘침: ${c}`);
  for (const e of errs) console.warn('  ! ' + e);
  return cli.noLint ? 0 : lint(inFile, html);
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  const jobs = [];
  if (cli.batch) {
    const dir = path.resolve(cli.batch);
    const outDir = cli.out ? path.resolve(cli.out)
      : (path.basename(dir) === 'mockups' ? path.join(path.dirname(dir), 'images') : dir);
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.html')).sort()) {
      jobs.push([path.join(dir, f), path.join(outDir, f.replace(/\.html$/, '.png'))]);
    }
    if (!jobs.length) throw new Error(`${dir} 에 .html 이 없다`);
  } else {
    const [inFile, outFile] = cli._;
    if (!inFile) {
      console.log('사용법: node shot.mjs <in.html> <out.png> [--w 1600 --h 1000 --scale 2 --dark]\n       node shot.mjs --batch <dir> [--out <dir>]');
      process.exit(1);
    }
    jobs.push([path.resolve(inFile), path.resolve(outFile || inFile.replace(/\.html?$/, '.png'))]);
  }
  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch();
  let warn = 0;
  try {
    for (const [i, o] of jobs) warn += await renderOne(browser, i, o, cli);
  } finally { await browser.close(); }
  if (warn) { console.warn(`공개 점검 경고 ${warn}건 — 가상 데이터로 바꾼 뒤 다시 렌더할 것`); process.exitCode = 3; }
}

main().catch((e) => { console.error(e); process.exit(1); });
