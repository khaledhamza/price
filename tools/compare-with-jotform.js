// Side-by-side check: fills the original JotForm and this site with the same answers and
// compares RETAIL, PAR and COST, plus every question, option and price.
// Usage: node tools/compare-with-jotform.js [report.md]   (needs Playwright + Chromium)

const path = require('path');
const fs = require('fs');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require(process.env.PLAYWRIGHT_PATH); }

const JOTFORM = 'https://form.jotform.com/253025919276159';
const SITE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const PICKERS = [47, 45, 46, 59];
const NUMBERS = [40, 81, 74];

(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await playwright.chromium.launch({ proxy });
  const jf = await browser.newPage();
  const me = await browser.newPage();
  await jf.goto(JOTFORM, { waitUntil: 'networkidle' });
  await me.goto(SITE);

  // 1. Catalog: questions, labels, sublabels, options and prices.
  const jfCatalog = await jf.evaluate(({ pickers, numbers }) => {
    const text = (sel) => (document.querySelector(sel) || {}).textContent?.trim() || '';
    return {
      pickers: pickers.map((id) => ({
        id, label: text('#label_' + id), sub: text('#sublabel_input_' + id),
        options: [...document.querySelectorAll('#input_' + id + ' option')]
          .filter((o) => o.hasAttribute('data-calcvalue'))
          .map((o) => [o.value, Number(o.getAttribute('data-calcvalue'))]),
      })),
      numbers: numbers.map((id) => ({
        id, label: text('#label_' + id), sub: text('#sublabel_input_' + id),
        min: document.querySelector('#input_' + id).dataset.numbermin,
        max: document.querySelector('#input_' + id).dataset.numbermax,
      })),
      results: [10, 19, 76].map((id) => text('#label_' + id)),
    };
  }, { pickers: PICKERS, numbers: NUMBERS });

  const meCatalog = await me.evaluate(() => {
    const F = window.LHWS_FORM;
    return {
      pickers: F.pickers.map((q) => ({
        id: q.id, label: q.label, sub: q.sub,
        options: q.options.filter(Boolean).map((o) => [o[2] || o[0], o[1]]),
      })),
      numbers: F.numbers.map((q) => ({ id: q.id, label: q.label, sub: q.sub, min: String(F.numberMin), max: String(F.numberMax) })),
      results: [F.results.retail.label, F.results.par.label, F.results.cost.label],
    };
  });
  const catalogMatch = JSON.stringify(jfCatalog) === JSON.stringify(meCatalog);

  // 2. Cases: every option on its own, number fields at several values, and combinations.
  const cases = [{ name: 'Nothing filled in', picks: {}, nums: {} }];
  for (const q of jfCatalog.pickers) {
    for (const [value, price] of q.options) cases.push({ name: `${q.label}: ${value} ($${price})`, picks: { [q.id]: [value] }, nums: {} });
  }
  for (const q of jfCatalog.numbers) {
    for (const v of ['1', '7.5', '3.333', '200']) cases.push({ name: `${q.label} = ${v}`, picks: {}, nums: { [q.id]: v } });
  }
  const opt = (id, i) => jfCatalog.pickers.find((q) => q.id === id).options[i][0];
  cases.push({
    name: 'Typical job: STO Combo 1.5 + UV 8 GPM + LWRO + Chrome faucet + STO cover, 40 ft trench, 80 material, 2 labor',
    picks: { 47: [opt(47, 4)], 45: [opt(45, 0)], 46: [opt(46, 2), opt(46, 4)], 59: [opt(59, 2)] },
    nums: { 40: '40', 81: '80', 74: '2' },
  });
  cases.push({
    name: 'Fractional inputs: Softener 1.0 + Fridge Hookup, 12.5 ft trench, 25.25 material, 1.75 labor',
    picks: { 47: [opt(47, 8)], 46: [opt(46, 11)] },
    nums: { 40: '12.5', 81: '25.25', 74: '1.75' },
  });
  cases.push({
    name: 'Every option selected, every number at 200',
    picks: Object.fromEntries(jfCatalog.pickers.map((q) => [q.id, q.options.map((o) => o[0])])),
    nums: { 40: '200', 81: '200', 74: '200' },
  });

  const num = (s) => (s === '' ? 0 : Number(String(s).replace(/[$,]/g, '')));
  const rows = [];
  for (const c of cases) {
    for (const id of PICKERS) await jf.selectOption('#input_' + id, c.picks[id] || []);
    for (const id of NUMBERS) {
      await jf.fill('#input_' + id, c.nums[id] || '');
      await jf.dispatchEvent('#input_' + id, 'keyup');
      await jf.dispatchEvent('#input_' + id, 'change');
    }
    // JotForm recalculates asynchronously; read once the results stop changing.
    let a = null;
    for (let tries = 0; tries < 20; tries++) {
      await jf.waitForTimeout(250);
      const next = await jf.evaluate(() => [10, 19, 76].map((i) => document.getElementById('input_' + i).value));
      if (a && next.join() === a.join()) break;
      a = next;
    }

    const b = await me.evaluate(({ picks, nums }) => {
      document.querySelectorAll('input[type=checkbox]').forEach((cb) => {
        const id = cb.id.match(/^q(\d+)_/)[1];
        cb.checked = (picks[id] || []).includes(cb.value);
      });
      window.LHWS_FORM.numbers.forEach((q) => { document.getElementById('input_' + q.id).value = nums[q.id] || ''; });
      document.getElementById('price-form').dispatchEvent(new Event('input'));
      return ['retail', 'par', 'cost'].map((k) => document.getElementById('out-' + k).textContent);
    }, c);

    const match = a.every((v, i) => Math.abs(num(v) - num(b[i])) < 0.005);
    rows.push({ name: c.name, jotform: a, site: b, match });
  }
  await browser.close();

  const passed = rows.filter((r) => r.match).length;
  const optionCount = jfCatalog.pickers.reduce((n, q) => n + q.options.length, 0);
  const lines = [
    '# Price check: this site vs the original JotForm',
    '',
    `Run ${new Date().toISOString().slice(0, 10)} against ${JOTFORM} with \`node tools/compare-with-jotform.js\`.`,
    '',
    `- Questions, labels, sublabels, ${optionCount} options and their prices, number limits and result labels: **${catalogMatch ? 'identical' : 'DIFFERENT'}**`,
    `- RETAIL / PAR / COST: **${passed} of ${rows.length} cases match**`,
    '',
    'JotForm shows bare numbers; this site shows the same numbers as dollars.',
    '',
    '| Case | JotForm RETAIL / PAR / COST | This site RETAIL / PAR / COST | Match |',
    '|---|---|---|---|',
    ...rows.map((r) => `| ${r.name.replace(/\|/g, '\\|')} | ${r.jotform.join(' / ')} | ${r.site.join(' / ')} | ${r.match ? '✅' : '❌'} |`),
    '',
  ];
  if (!catalogMatch) {
    lines.push('## Catalog differences', '', '```json', JSON.stringify({ jotform: jfCatalog, site: meCatalog }, null, 2), '```', '');
  }
  const out = process.argv[2];
  if (out) fs.writeFileSync(out, lines.join('\n'));
  console.log(`catalog ${catalogMatch ? 'identical' : 'DIFFERENT'}; ${passed}/${rows.length} cases match`);
  rows.filter((r) => !r.match).forEach((r) => console.log('MISMATCH', r.name, r.jotform, r.site));
  process.exit(catalogMatch && passed === rows.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
