// Writes form-data.js back out from an edited copy of window.LHWS_FORM. The admin page uses it
// to save new prices; `node tools/check-form-data.js` checks it reproduces form-data.js exactly.

(function (root) {
  function str(s) {
    return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
  }
  function num(n) {
    return String(Number(n));
  }

  function renderFormData(F) {
    var c = F.calc;
    var k = F.commission;
    var L = [];
    L.push(
      '// Questions, options and prices copied from the JotForm "LHWS PRICE APP - 01.01.2026"',
      '// (https://form.jotform.com/253025919276159). Each option is [label, price];',
      '// null is one of the "—" separators the original uses to group options.',
      '// `value` is set only where JotForm submits a different string than it shows.',
      '// Prices can be changed on admin.html, which rewrites this file (see form-data-writer.js).',
      '',
      'window.LHWS_FORM = {',
      '  title: ' + str(F.title) + ',',
      '',
      '  // Multi-select questions, in the original order. Their prices add straight into RETAIL.',
      '  pickers: ['
    );
    F.pickers.forEach(function (q) {
      L.push(
        '    {',
        '      id: ' + q.id + ', name: ' + str(q.name) + ', label: ' + str(q.label) + ', sub: ' + str(q.sub) + ',',
        '      options: ['
      );
      q.options.forEach(function (o) {
        if (o === null) { L.push('        null,'); return; }
        var parts = [str(o[0]), num(o[1])];
        if (o.length > 2) parts.push(str(o[2]));
        L.push('        [' + parts.join(', ') + '],');
      });
      L.push('      ],', '    },');
    });
    L.push(
      '  ],',
      '',
      '  // Number questions. `rate` is what each unit adds to RETAIL. Limits match the original (0 to 200).',
      '  numbers: ['
    );
    F.numbers.forEach(function (q) {
      L.push('    { id: ' + q.id + ', name: ' + str(q.name) + ', label: ' + str(q.label) +
        ', sub: ' + str(q.sub) + ', rate: ' + num(q.rate) + ' },');
    });
    L.push(
      '  ],',
      '  numberMin: ' + num(F.numberMin) + ',',
      '  numberMax: ' + num(F.numberMax) + ',',
      '',
      '  // Hidden in the original ("always-hidden") but still submitted with its default.',
      '  hidden: [' + F.hidden.map(function (h) {
        return '{ name: ' + str(h.name) + ', label: ' + str(h.label) + ', value: ' + str(h.value) + ' }';
      }).join(', ') + '],',
      '',
      '  results: {'
    );
    ['retail', 'par', 'cost'].forEach(function (k) {
      L.push('    ' + k + ': { label: ' + str(F.results[k].label) + ', sub: ' + str(F.results[k].sub) + ' },');
    });
    L.push(
      '  },',
      '',
      '  // PAR = RETAIL * parRate + adminFee; COST = RETAIL * costRate.',
      '  calc: { parRate: ' + num(c.parRate) + ', adminFee: ' + num(c.adminFee) + ', costRate: ' + num(c.costRate) + ' },',
      '',
      '  // Commission on the price the job sold for. Commission PAR = RETAIL * parRate (no admin fee).',
      '  // Sold below lowCutoff of RETAIL: lowRate of the sold price. From lowCutoff up to PAR: midRate of',
      '  // the sold price. Above PAR: midRate of PAR plus overRate of every dollar above PAR (above RETAIL too).',
      "  // Financed jobs: financeFee of the sold price comes off first, and the rules apply to what's left.",
      '  commission: { parRate: ' + num(k.parRate) + ', lowCutoff: ' + num(k.lowCutoff) + ', lowRate: ' + num(k.lowRate) +
        ', midRate: ' + num(k.midRate) + ', overRate: ' + num(k.overRate) + ', financeFee: ' + num(k.financeFee) + ' },',
      '};',
      '',
      '// The three calculations, each rounded to 2 decimal places. With the numbers above:',
      '//   RETAIL = ' + F.pickers.map(function (q) { return '{' + q.id + '}'; }).join('+') +
        F.numbers.map(function (q) { return ' + {' + q.id + '}*' + num(q.rate); }).join(''),
      '//   PAR    = RETAIL*' + num(c.parRate) + ' + ' + num(c.adminFee),
      '//   COST   = RETAIL*' + num(c.costRate),
      'window.LHWS_CALC = function (pickerTotal, numbers) {',
      '  var round2 = function (n) { return Math.round(n * 100) / 100; };',
      '  var F = window.LHWS_FORM;',
      '  var retail = pickerTotal;',
      '  F.numbers.forEach(function (q) { retail += (numbers[q.id] || 0) * q.rate; });',
      '  retail = round2(retail);',
      '  return { retail: retail, par: round2(retail * F.calc.parRate + F.calc.adminFee), cost: round2(retail * F.calc.costRate) };',
      '};',
      '',
      '// Commission for a job with this RETAIL that sold for `sold` (financed or paid upfront), rounded to cents.',
      '// `overRetail` is the part of `over` earned on dollars above RETAIL.',
      'window.LHWS_COMMISSION = function (retail, sold, financed) {',
      '  var round2 = function (n) { return Math.round(n * 100) / 100; };',
      '  var c = window.LHWS_FORM.commission;',
      '  var par = round2(retail * c.parRate);',
      '  var cutoff = round2(retail * c.lowCutoff);',
      '  var fee = financed ? round2(sold * c.financeFee) : 0;',
      '  var net = round2(sold - fee);',
      "  var out = { par: par, cutoff: cutoff, sold: round2(sold), fee: fee, net: net, tier: 'none', base: 0, over: 0, overRetail: 0, amount: 0 };",
      '  if (!(retail > 0) || !(sold > 0)) return out;',
      '  if (net > par) {',
      "    out.tier = 'over';",
      '    out.base = round2(par * c.midRate);',
      '    out.over = round2((net - par) * c.overRate);',
      '    out.overRetail = net > retail ? Math.min(out.over, round2((net - retail) * c.overRate)) : 0;',
      '  } else if (net >= cutoff) {',
      "    out.tier = 'mid';",
      '    out.base = round2(net * c.midRate);',
      '  } else {',
      "    out.tier = 'low';",
      '    out.base = round2(net * c.lowRate);',
      '  }',
      '  out.amount = round2(out.base + out.over);',
      '  return out;',
      '};',
      ''
    );
    return L.join('\n');
  }

  // Runs a form-data.js source without touching the page and returns its LHWS_FORM and LHWS_CALC.
  function loadFormData(source) {
    var sandbox = {};
    new Function('window', source)(sandbox);
    if (!sandbox.LHWS_FORM || typeof sandbox.LHWS_CALC !== 'function' || typeof sandbox.LHWS_COMMISSION !== 'function') throw new Error('form-data.js did not define the form');
    return { form: sandbox.LHWS_FORM, calc: sandbox.LHWS_CALC, commission: sandbox.LHWS_COMMISSION };
  }

  var api = { renderFormData: renderFormData, loadFormData: loadFormData };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LHWS_WRITER = api;
})(this);
