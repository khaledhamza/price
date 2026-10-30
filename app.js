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
  var downInput = $('down');

  // A dollar amount typed into `input`, or `empty` when it's left empty. NaN if it isn't a price.
  function readMoney(input, empty) {
    var raw = input.value.replace(/[$,\s]/g, '');
    if (raw === '') return empty;
    return /^\d*\.?\d*$/.test(raw) && raw !== '.' ? Number(raw) : NaN;
  }

  // The sold price typed in, or the retail price when it's left empty.
  function soldPrice(retail) { return readMoney(soldInput, retail); }

  function line(label, amount, cls) {
    return el('tr', cls ? { class: cls } : {}, [el('td', { text: label }), el('td', { class: 'num', text: amount })]);
  }

  function updateCommission(retail) {
    var C = FORM.commission;
    var sold = soldPrice(retail);
    var badSold = isNaN(sold);
    $('sold-err').textContent = badSold ? 'Enter a dollar amount, like 1200 or 1,200.50' : '';
    soldInput.setAttribute('aria-invalid', badSold ? 'true' : 'false');
    var financed = form.querySelector('input[name=payment]:checked').value === 'financed';
    $('down-box').hidden = !financed;
    var down = financed ? readMoney(downInput, 0) : 0;
    var downMsg = '';
    if (isNaN(down)) downMsg = 'Enter a dollar amount, like 1200 or 1,200.50';
    else if (!badSold && down > sold) downMsg = "The down payment can't be more than the sold price.";
    $('down-err').textContent = downMsg;
    downInput.setAttribute('aria-invalid', downMsg ? 'true' : 'false');
    var badDown = !!downMsg;
    var c = window.LHWS_COMMISSION(retail, badSold ? 0 : sold, financed, badDown ? 0 : down);
    lastCommission = { tier: c.tier, retail: retail, sold: c.sold, financed: financed, down: c.down, badDown: badDown, amount: c.amount };
    $('pay-help').textContent = financed
      ? pct(C.financeFee) + ' of the financed part (sold price minus the down payment) comes off before the commission is worked out.'
      : 'Paid in full; the commission is worked out on the whole sold price.';

    $('c-retail').textContent = money(retail);
    $('c-empty').hidden = retail > 0;
    $('c-amount').textContent = money(c.amount);
    $('out-comm').textContent = money(c.amount);
    $('bar-comm').textContent = money(c.amount);
    var custom = soldInput.value.trim() !== '' && !badSold;
    $('sub-comm').textContent = (custom ? 'If sold at ' + money(c.sold) : 'If sold at retail') +
      (financed ? ', financed' + (c.down > 0 ? ' with ' + money(c.down) + ' down' : '') : ', paid upfront');

    var rows = $('c-lines');
    rows.textContent = '';
    var tier = '';
    if (c.tier !== 'none') {
      rows.appendChild(line('Sold price (' + pct(c.sold / retail) + ' of retail)', money(c.sold)));
      if (financed) {
        if (c.down > 0) {
          rows.appendChild(line('Down payment (no financing % off)', money(c.down)));
          rows.appendChild(line('Financed part', money(c.sold - c.down)));
        }
        rows.appendChild(line('Financing: ' + pct(C.financeFee) + ' off' + (c.down > 0 ? ' the financed part' : ''), '−' + money(c.fee)));
        rows.appendChild(line('Commission figured on (' + pct(c.net / retail) + ' of retail)', money(c.net), 'sub-total'));
      }
      rows.appendChild(line('PAR (' + pct(FORM.calc.parRate) + ' of retail + ' + money(FORM.calc.adminFee) + ' admin fee)', money(c.par)));
      var basis = financed ? 'amount after financing' : 'sold price';
      if (c.tier === 'over') {
        tier = c.net > retail ? 'Above retail' : 'Above PAR';
        rows.appendChild(line(pct(C.midRate) + ' of PAR', money(c.base)));
        if (c.overRetail > 0 && c.over > c.overRetail) {
          rows.appendChild(line(pct(C.overRate) + ' of ' + money(retail - c.par) + ' from PAR up to retail', money(c.over - c.overRetail)));
          rows.appendChild(line(pct(C.overRate) + ' of ' + money(c.net - retail) + ' above retail', money(c.overRetail)));
        } else {
          rows.appendChild(line(pct(C.overRate) + ' of ' + money(c.net - c.par) + ' above PAR', money(c.over)));
        }
      } else if (c.tier === 'mid') {
        tier = 'Between ' + pct(C.lowCutoff) + ' of retail and PAR';
        rows.appendChild(line(pct(C.midRate) + ' of ' + basis, money(c.base)));
      } else {
        tier = 'Below ' + pct(C.lowCutoff) + ' of retail';
        rows.appendChild(line(pct(C.lowRate) + ' of ' + basis, money(c.base)));
      }
      rows.appendChild(line('My commission', money(c.amount), 'total'));
    }
    $('c-tier').textContent = tier;

    var r = retail > 0;
    $('c-tiers-title').textContent = "How it's paid (PAR = " + pct(FORM.calc.parRate) + ' of retail + ' + money(FORM.calc.adminFee) + ' admin fee)';
    var tiers = $('c-tiers');
    tiers.textContent = '';
    [
      ['low', 'Sold below ' + pct(C.lowCutoff) + ' of retail' + (r ? ' (under ' + money(c.cutoff) + ')' : '') +
        ': ' + pct(C.lowRate) + ' of the sold price.'],
      ['mid', 'Sold from ' + pct(C.lowCutoff) + ' of retail up to PAR' + (r ? ' (' + money(c.cutoff) + ' to ' + money(c.par) + ')' : '') +
        ': ' + pct(C.midRate) + ' of the sold price.'],
      ['over', 'Sold above PAR' + (r ? ' (over ' + money(c.par) + ')' : '') + ': ' + pct(C.midRate) + ' of PAR plus ' +
        pct(C.overRate) + ' of every dollar above PAR, including every dollar above retail.'],
      ['finance', 'Financed jobs: ' + pct(C.financeFee) + ' of the financed part (sold price minus any down payment) comes off first, then the rules above apply. No ' + pct(C.financeFee) + ' comes off the down payment.'],
    ].forEach(function (t) {
      var on = t[0] === c.tier || (t[0] === 'finance' && financed && c.tier !== 'none');
      tiers.appendChild(el('li', on ? { class: 'current', text: t[1] } : { text: t[1] }));
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
      var c = window.LHWS_COMMISSION(retail, 0, false);
      soldInput.value = key === 'par' ? c.par.toFixed(2) : key === 'cutoff' ? c.cutoff.toFixed(2) : '';
      update();
    });
  });
  [soldInput, downInput].forEach(function (input) {
    input.addEventListener('blur', function () {
      var v = readMoney(input, 0);
      if (input.value.trim() !== '' && !isNaN(v)) input.value = v.toFixed(2);
    });
  });

  // ---- Saved sales (kept in this browser only) ----

  var SALES_KEY = 'lhws-sales-v1';
  var lastCommission = null; // the commission currently shown, with what it was worked out from

  function readSales() {
    try {
      var list = JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function writeSales(list) {
    try { localStorage.setItem(SALES_KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function niceDate(iso) {
    var p = iso.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // What was quoted, for the saved record: "STO Combo 1.5 ×2", "Trenching: 23".
  function quotedItems() {
    var items = [];
    form.querySelectorAll('input[type=checkbox]:checked').forEach(function (c) {
      var q = readQty($(c.id + '_qty'));
      items.push(c.nextSibling.textContent + (q > 1 ? ' ×' + q : ''));
    });
    FORM.numbers.forEach(function (q) {
      var raw = $('input_' + q.id).value;
      if (raw !== '' && parseFloat(raw)) items.push(q.label + ': ' + parseFloat(raw));
    });
    return items;
  }

  $('sale-date').value = today();

  $('save-sale-btn').addEventListener('click', function () {
    var status = $('save-status');
    var date = $('sale-date').value;
    $('sale-date-err').textContent = date ? '' : 'Pick the date of the sale.';
    if (!date) { $('sale-date').focus(); return; }
    var c = lastCommission;
    if (!c || c.tier === 'none') {
      status.textContent = 'Nothing to save yet: add items on the Quote tab first.';
      status.className = 'status bad';
      return;
    }
    if (isNaN(soldPrice(c.retail))) {
      status.textContent = 'Fix the sold price first.';
      status.className = 'status bad';
      return;
    }
    if (c.badDown) {
      status.textContent = 'Fix the down payment first.';
      status.className = 'status bad';
      return;
    }
    var list = readSales();
    var sale = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: date, note: $('sale-note').value.trim(), items: quotedItems(),
      retail: c.retail, sold: c.sold, financed: c.financed, commission: c.amount,
    };
    // Added later: sales saved before down payments existed simply don't have it.
    if (c.financed && c.down > 0) sale.downPayment = c.down;
    list.push(sale);
    if (!writeSales(list)) {
      status.textContent = "Couldn't save: this browser is blocking storage (a private window?).";
      status.className = 'status bad';
      return;
    }
    $('sale-note').value = '';
    status.textContent = 'Saved: ' + money(c.amount) + ' commission on ' + niceDate(date) + '.';
    status.className = 'status ok';
    renderSales();
  });

  var armedDelete = null;
  function renderSales() {
    var list = readSales().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    var month = today().slice(0, 7);
    var all = 0, thisMonth = 0;
    var ul = $('sales-list');
    ul.textContent = '';
    list.forEach(function (s) {
      all += s.commission;
      if (s.date.slice(0, 7) === month) thisMonth += s.commission;
      var del = el('button', { type: 'button', class: 'del-btn', text: 'Delete', 'aria-label': 'Delete sale of ' + niceDate(s.date) });
      del.addEventListener('click', function () {
        if (armedDelete !== s.id) {
          armedDelete = s.id;
          renderSales();
          return;
        }
        armedDelete = null;
        writeSales(readSales().filter(function (x) { return x.id !== s.id; }));
        renderSales();
      });
      if (armedDelete === s.id) { del.textContent = 'Tap again to delete'; del.classList.add('armed'); }
      var detail = 'Sold ' + money(s.sold) + ' · Retail ' + money(s.retail) + ' · ' + (s.financed ? 'Financed' + (s.downPayment > 0 ? ' (' + money(s.downPayment) + ' down)' : '') : 'Upfront');
      ul.appendChild(el('li', {}, [
        el('div', { class: 'sale-top' }, [
          el('span', { class: 'sale-date', text: niceDate(s.date) + (s.note ? ' · ' + s.note : '') }),
          el('b', { class: 'sale-comm', text: money(s.commission) }),
        ]),
        el('p', { class: 'sub', text: detail }),
        s.items && s.items.length ? el('p', { class: 'sale-items', text: s.items.join(', ') }) : null,
        del,
      ]));
    });
    all = Math.round(all * 100) / 100;
    thisMonth = Math.round(thisMonth * 100) / 100;
    $('sales-all').textContent = money(all);
    $('sales-month').textContent = money(thisMonth);
    $('sales-empty').hidden = list.length > 0;
  }

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
    $('sale-date').value = today();
    $('save-status').textContent = '';
    // form.reset() puts the payment choice back to Upfront.
    update();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  update();
  renderSales();
})();
