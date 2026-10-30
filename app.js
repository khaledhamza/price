(function () {
  var FORM = window.LHWS_FORM;
  var form = document.getElementById('price-form');
  var QTY_MAX = 99;

  function $(id) { return document.getElementById(id); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function money(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pct(r) { return Math.round(r * 10000) / 100 + '%'; }

  // The title and the PAR note (which names the admin fee) can be changed on the admin page.
  document.title = FORM.title;
  $('title').textContent = FORM.title;
  ['par', 'cost'].forEach(function (k) {
    $('sub-' + k).textContent = FORM.results[k].sub;
  });

  // ---- Quote: multi-select lists with a quantity on each picked option ----

  function stepButton(label, text, onClick) {
    var b = el('button', { type: 'button', class: 'step', 'aria-label': label, text: text });
    b.addEventListener('click', onClick);
    return b;
  }

  FORM.pickers.forEach(function (q) {
    var groups = [[]];
    q.options.forEach(function (opt, i) {
      if (opt === null) { groups.push([]); return; }
      var id = 'q' + q.id + '_' + i;
      var input = el('input', {
        type: 'checkbox', name: q.name, id: id, value: opt[2] || opt[0], 'data-price': opt[1],
      });
      var qty = el('input', {
        type: 'number', class: 'qty-input', id: id + '_qty', inputmode: 'numeric', min: 1, max: QTY_MAX,
        step: 1, value: 1, 'aria-label': 'Quantity of ' + opt[0],
      });
      var qtyBox = el('div', { class: 'qty', hidden: '' }, [
        el('span', { class: 'qty-label', text: 'Qty' }),
        stepButton('Fewer ' + opt[0], '−', function () { setQty(qty, readQty(qty) - 1); }),
        qty,
        stepButton('More ' + opt[0], '+', function () { setQty(qty, readQty(qty) + 1); }),
      ]);
      input.addEventListener('change', function () {
        qtyBox.hidden = !input.checked;
        if (!input.checked) qty.value = 1;
      });
      qty.addEventListener('blur', function () { setQty(qty, readQty(qty)); });
      groups[groups.length - 1].push(el('div', { class: 'option-row' }, [
        el('label', { class: 'option', for: id }, [input, el('span', { text: opt[0] })]),
        qtyBox,
      ]));
    });
    var list = el('div', { class: 'options' }, groups.filter(function (g) { return g.length; })
      .map(function (g) { return el('div', { class: 'group' }, g); }));
    var count = el('span', { class: 'count', id: 'count-' + q.id });
    var body = [el('summary', {}, [el('span', { class: 'q-label', text: q.label }), count])];
    if (q.sub) body.push(el('p', { class: 'sub', text: q.sub }));
    body.push(list);
    $('pickers').appendChild(el('details', { class: 'card', open: '' }, body));
  });

  function readQty(input) {
    var v = Math.floor(Number(input.value));
    return isFinite(v) && v >= 1 ? Math.min(QTY_MAX, v) : 1;
  }
  function setQty(input, v) {
    input.value = Math.min(QTY_MAX, Math.max(1, v));
    update();
  }

  // ---- Quote: number questions ----

  FORM.numbers.forEach(function (q) {
    var input = el('input', {
      type: 'number', id: 'input_' + q.id, name: q.name, inputmode: 'decimal', step: 'any',
      min: FORM.numberMin, max: FORM.numberMax, placeholder: 'ex: 23',
      'aria-describedby': 'sub_' + q.id + ' err_' + q.id,
    });
    $('numbers').appendChild(el('div', { class: 'card number' }, [
      el('label', { class: 'q-label', for: input.id, text: q.label }),
      el('div', { class: 'stepper' }, [
        stepButton('Decrease ' + q.label, '−', function () { bump(input, -1); }),
        input,
        stepButton('Increase ' + q.label, '+', function () { bump(input, 1); }),
      ]),
      el('p', { class: 'sub', id: 'sub_' + q.id, text: q.sub }),
      el('p', { class: 'error', id: 'err_' + q.id }),
    ]));
  });

  function bump(input, delta) {
    var v = parseFloat(input.value) || 0;
    input.value = Math.min(FORM.numberMax, Math.max(FORM.numberMin, v + delta));
    update();
  }

  function numberValues() {
    var values = {};
    FORM.numbers.forEach(function (q) {
      var v = parseFloat($('input_' + q.id).value);
      values[q.id] = isNaN(v) ? 0 : v;
    });
    return values;
  }

  // Same messages the original shows for out-of-range numbers.
  function validate() {
    FORM.numbers.forEach(function (q) {
      var input = $('input_' + q.id);
      var v = parseFloat(input.value);
      var msg = '';
      if (input.value !== '' && isNaN(v)) msg = 'This field can only contain numeric values';
      else if (v < FORM.numberMin) msg = 'Input should not be less than the minimum value: ' + FORM.numberMin;
      else if (v > FORM.numberMax) msg = 'Input should not be greater than the maximum value: ' + FORM.numberMax;
      $('err_' + q.id).textContent = msg;
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    });
  }

  function totals() {
    var pickerTotal = 0;
    form.querySelectorAll('input[type=checkbox]:checked').forEach(function (c) {
      pickerTotal += Number(c.getAttribute('data-price')) * readQty($(c.id + '_qty'));
    });
    return window.LHWS_CALC(pickerTotal, numberValues());
  }

  // ---- Commission ----

  var soldInput = $('sold');

  // The sold price typed in, or the retail price when it's left empty. NaN if it isn't a price.
  function soldPrice(retail) {
    var raw = soldInput.value.replace(/[$,\s]/g, '');
    if (raw === '') return retail;
    return /^\d*\.?\d*$/.test(raw) && raw !== '.' ? Number(raw) : NaN;
  }

  function line(label, amount, cls) {
    return el('tr', cls ? { class: cls } : {}, [el('td', { text: label }), el('td', { class: 'num', text: amount })]);
  }

  function updateCommission(retail) {
    var C = FORM.commission;
    var sold = soldPrice(retail);
    var badSold = isNaN(sold);
    $('sold-err').textContent = badSold ? 'Enter a dollar amount, like 1200 or 1,200.50' : '';
    soldInput.setAttribute('aria-invalid', badSold ? 'true' : 'false');
    var c = window.LHWS_COMMISSION(retail, badSold ? 0 : sold);

    $('c-retail').textContent = money(retail);
    $('c-empty').hidden = retail > 0;
    $('c-amount').textContent = money(c.amount);
    $('out-comm').textContent = money(c.amount);
    $('bar-comm').textContent = money(c.amount);
    var custom = soldInput.value.trim() !== '' && !badSold;
    $('sub-comm').textContent = custom ? 'If sold at ' + money(c.sold) : 'If sold at retail';

    var rows = $('c-lines');
    rows.textContent = '';
    var tier = '';
    if (c.tier !== 'none') {
      rows.appendChild(line('Sold price (' + pct(c.sold / retail) + ' of retail)', money(c.sold)));
      rows.appendChild(line('Commission PAR (' + pct(C.parRate) + ' of retail)', money(c.par)));
      if (c.tier === 'over') {
        tier = 'Above PAR';
        rows.appendChild(line(pct(C.midRate) + ' of PAR', money(c.base)));
        rows.appendChild(line(pct(C.overRate) + ' of ' + money(c.sold - c.par) + ' above PAR', money(c.over)));
      } else if (c.tier === 'mid') {
        tier = 'Between ' + pct(C.lowCutoff) + ' of retail and PAR';
        rows.appendChild(line(pct(C.midRate) + ' of sold price', money(c.base)));
      } else {
        tier = 'Below ' + pct(C.lowCutoff) + ' of retail';
        rows.appendChild(line(pct(C.lowRate) + ' of sold price', money(c.base)));
      }
      rows.appendChild(line('My commission', money(c.amount), 'total'));
    }
    $('c-tier').textContent = tier;

    var r = retail > 0;
    $('c-tiers-title').textContent = "How it's paid (PAR here = " + pct(C.parRate) + ' of retail, no admin fee)';
    var tiers = $('c-tiers');
    tiers.textContent = '';
    [
      ['low', 'Sold below ' + pct(C.lowCutoff) + ' of retail' + (r ? ' (under ' + money(c.cutoff) + ')' : '') +
        ': ' + pct(C.lowRate) + ' of the sold price.'],
      ['mid', 'Sold from ' + pct(C.lowCutoff) + ' of retail up to PAR' + (r ? ' (' + money(c.cutoff) + ' to ' + money(c.par) + ')' : '') +
        ': ' + pct(C.midRate) + ' of the sold price.'],
      ['over', 'Sold above PAR' + (r ? ' (over ' + money(c.par) + ')' : '') + ': ' + pct(C.midRate) + ' of PAR plus ' +
        pct(C.overRate) + ' of every dollar above PAR.'],
    ].forEach(function (t) {
      tiers.appendChild(el('li', t[0] === c.tier ? { class: 'current', text: t[1] } : { text: t[1] }));
    });
  }

  // ---- Update everything ----

  function update() {
    var t = totals();
    ['retail', 'par', 'cost'].forEach(function (k) {
      $('out-' + k).textContent = money(t[k]);
      $('bar-' + k).textContent = money(t[k]);
    });
    FORM.pickers.forEach(function (q) {
      var n = 0;
      form.querySelectorAll('input[name="' + q.name + '"]:checked').forEach(function (c) { n += readQty($(c.id + '_qty')); });
      $('count-' + q.id).textContent = n ? n + ' selected' : '';
    });
    validate();
    updateCommission(t.retail);
  }

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  form.querySelectorAll('.quick button').forEach(function (b) {
    b.addEventListener('click', function () {
      var retail = totals().retail;
      var key = b.getAttribute('data-pct');
      var c = window.LHWS_COMMISSION(retail, 0);
      soldInput.value = key === 'par' ? c.par.toFixed(2) : key === 'cutoff' ? c.cutoff.toFixed(2) : '';
      update();
    });
  });
  soldInput.addEventListener('blur', function () {
    var v = soldPrice(0);
    if (soldInput.value.trim() !== '' && !isNaN(v)) soldInput.value = v.toFixed(2);
  });

  // ---- Tabs ----

  var tabs = [$('tab-quote'), $('tab-comm')];
  function showTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    window.scrollTo({ top: 0 });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showTab(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') showTab(tabs[(i + 1) % 2], true);
    });
  });
  $('go-comm').addEventListener('click', function () { showTab(tabs[1]); });

  // ---- Clear ----

  $('clear-btn').addEventListener('click', function () {
    if (!window.confirm('Clear the whole form?')) return;
    form.reset();
    form.querySelectorAll('.qty').forEach(function (q) { q.hidden = true; });
    update();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  update();
})();
