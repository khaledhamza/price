// Admin page: edit the prices in form-data.js and save them back to the GitHub repository,
// which GitHub Pages then republishes. Saving uses a
// GitHub token the admin pastes in; it is kept in this browser only (and only if "Remember on
// this device" is ticked).
(function () {
  var REPO = { owner: 'khaledhamza', name: 'price', branch: 'main', path: 'form-data.js' };
  var API = 'https://api.github.com/repos/' + REPO.owner + '/' + REPO.name + '/contents/' + REPO.path;
  var TOKEN_KEY = 'lhws-admin-token';
  var W = window.LHWS_WRITER;

  var $ = function (id) { return document.getElementById(id); };
  var form = $('admin-form');
  var tokenInput = $('token');
  var remember = $('remember');
  var base = null;   // the prices as last loaded or saved
  var edit = null;   // the prices being edited

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function setStatus(node, text, kind) {
    node.textContent = text;
    node.className = 'status ' + (kind || '');
  }

  function trim(n) { return String(Number(Number(n).toPrecision(12))); }

  // ---- GitHub token, kept only in this browser ----

  function readStoredToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function storeToken() {
    try {
      if (remember.checked && tokenInput.value.trim()) localStorage.setItem(TOKEN_KEY, tokenInput.value.trim());
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* storage blocked: the token still works for this visit */ }
    showAccess();
  }
  function token() { return tokenInput.value.trim(); }
  function showAccess() {
    var s = $('access-state');
    s.textContent = token() ? 'Token set' : 'Needed to save';
    s.className = 'count' + (token() ? ' ok' : '');
  }

  tokenInput.addEventListener('input', storeToken);
  remember.addEventListener('change', storeToken);
  $('forget').addEventListener('click', function () {
    tokenInput.value = '';
    remember.checked = false;
    storeToken();
  });

  // ---- Reading form-data.js ----

  function headers() {
    var h = { Accept: 'application/vnd.github+json' };
    if (token()) h.Authorization = 'Bearer ' + token();
    return h;
  }

  function decode(b64) {
    var bin = atob(b64.replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function encode(text) {
    var bytes = new TextEncoder().encode(text);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  // The file as it is right now on the branch, straight from GitHub (not the Pages copy,
  // which can lag a minute or two behind a save).
  function fetchRemote() {
    return fetch(API + '?ref=' + REPO.branch + '&t=' + Date.now(), { headers: headers(), cache: 'no-store' })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (body) {
          if (!r.ok) throw githubError(r.status, body);
          return { sha: body.sha, text: decode(body.content) };
        });
      });
  }

  function githubError(status, body) {
    var msg = (body && body.message) || ('GitHub answered ' + status);
    if (status === 401) msg = 'GitHub did not accept the token. Check it was pasted in full and has not expired';
    else if (status === 403 && /rate limit/i.test(msg)) msg = 'GitHub is limiting requests without a token. Paste a token above and reload';
    else if (status === 403 || status === 404) msg = 'The token cannot write to ' + REPO.name + '. Give it Contents: Read and write on that repository';
    else if (status === 409) msg = 'The price file changed on GitHub while saving. Reload the page and make your changes again';
    var err = new Error(msg);
    err.status = status;
    return err;
  }

  function load() {
    return fetchRemote()
      .then(function (remote) { return { text: remote.text, from: 'GitHub' }; })
      .catch(function () {
        // Fall back to the published copy, e.g. when GitHub's API is rate limiting this network.
        return fetch(REPO.path + '?t=' + Date.now(), { cache: 'no-store' })
          .then(function (r) { if (!r.ok) throw new Error('could not load ' + REPO.path); return r.text(); })
          .then(function (text) { return { text: text, from: 'the published site' }; });
      })
      .then(function (got) {
        base = W.loadFormData(got.text).form;
        edit = clone(base);
        build();
        form.hidden = false;
        $('admin-bar').hidden = false;
        setStatus($('load-status'), 'Current prices loaded from ' + got.from + '. Changed fields are highlighted.', '');
      })
      .catch(function (err) {
        setStatus($('load-status'), 'Could not load the prices: ' + err.message + '.', 'bad');
      });
  }

  function start() {
    return Promise.resolve().then(function () {
      tokenInput.value = readStoredToken();
      remember.checked = !!tokenInput.value;
      $('access').hidden = false;
      if (!token()) $('access').open = true;
      showAccess();
      setStatus($('load-status'), 'Loading the current prices…');
      return load();
    });
  }


  // ---- Building the editor ----
  // The editor always draws `edit`; each row remembers the value it had in `base` (none if new).

  var rows = [];
  var bad = {};

  function money(v) {
    var n = Number(v);
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  }
  function pct(v) { return trim(v * 100) + '%'; }
  function byId(list, id) { return list.filter(function (q) { return q.id === id; })[0] || null; }
  function option(q, label) { return q ? q.options.filter(function (o) { return o && o[0] === label; })[0] || null : null; }

  // Each new list or number field gets an id no other question uses.
  function newId() {
    var ids = [100];
    [base, edit].forEach(function (F) {
      F.pickers.concat(F.numbers).forEach(function (q) { ids.push(q.id); });
    });
    return Math.max.apply(null, ids) + 1;
  }
  function fieldName(id, label) {
    var words = label.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/);
    return 'q' + id + '_' + words.map(function (w, i) {
      w = w.toLowerCase();
      return i ? w.charAt(0).toUpperCase() + w.slice(1) : w;
    }).join('');
  }
  // Every question's label is a line in the emailed quote, so labels must not repeat.
  function labelTaken(label) {
    var all = edit.pickers.concat(edit.numbers).map(function (q) { return q.label.toLowerCase(); })
      .concat(['retail', 'par', 'cost'].map(function (k) { return edit.results[k].label.toLowerCase(); }))
      .concat(edit.hidden.map(function (h) { return h.label.toLowerCase(); }));
    return all.indexOf(label.toLowerCase()) !== -1;
  }

  function parseAmount(raw, kind) {
    var v = Number(String(raw).trim());
    if (String(raw).trim() === '' || isNaN(v)) return { error: 'Enter a number' };
    if (v < 0) return { error: 'Cannot be negative' };
    return { value: kind === 'percent' ? Number((v / 100).toPrecision(12)) : v };
  }

  function amountBox(kind, value) {
    var input = el('input', { type: 'number', inputmode: 'decimal', step: 'any', min: '0', autocomplete: 'off' });
    if (value !== undefined) input.value = kind === 'percent' ? trim(value * 100) : value;
    return { input: input, box: el('span', { class: 'money ' + (kind === 'percent' ? 'percent' : 'dollar') }, [input]) };
  }

  // One editable amount. r: { key, label, kind, get, set, was, section, onRemove }
  function addRow(parent, r) {
    var a = amountBox(r.kind, r.get());
    r.input = a.input;
    r.input.id = 'f-' + r.key;
    r.wasEl = el('span', { class: 'was' });
    r.error = el('p', { class: 'error' });
    r.input.addEventListener('input', function () {
      var p = parseAmount(r.input.value, r.kind);
      bad[r.key] = !!p.error;
      r.error.textContent = p.error || '';
      r.input.setAttribute('aria-invalid', p.error ? 'true' : 'false');
      if (!p.error) r.set(p.value);
      refresh();
    });
    var parts = [el('label', { for: r.input.id }, [el('span', { text: r.label }), r.wasEl]), a.box];
    if (r.onRemove) {
      var rm = el('button', { type: 'button', class: 'remove', 'aria-label': 'Remove ' + r.label, title: 'Remove', text: '✕' });
      rm.addEventListener('click', function () { r.onRemove(); build(); });
      parts.push(rm);
    }
    parts.push(r.error);
    parent.appendChild(el('div', { class: 'price price-row' }, parts));
    rows.push(r);
  }

  // A small "add" form: text fields, an optional amount, and a button. onAdd returns an error or ''.
  function addForm(parent, opts) {
    var texts = opts.texts.map(function (t) {
      return el('input', { type: 'text', placeholder: t, autocomplete: 'off', 'aria-label': t });
    });
    var amount = opts.amount ? amountBox('dollar') : null;
    if (amount) { amount.input.placeholder = '0'; amount.input.setAttribute('aria-label', opts.amount); }
    var btn = el('button', { type: 'button', class: 'add-btn', text: opts.button });
    var error = el('p', { class: 'error' });
    btn.addEventListener('click', function () {
      var values = texts.map(function (t) { return t.value.trim(); });
      if (!values[0]) { error.textContent = 'Enter a name'; texts[0].focus(); return; }
      var price;
      if (amount) {
        var p = parseAmount(amount.input.value, 'dollar');
        if (p.error) { error.textContent = p.error; amount.input.focus(); return; }
        price = p.value;
      }
      var msg = opts.onAdd(values, price);
      if (msg) { error.textContent = msg; return; }
      build();
    });
    var line = [texts[0]];
    if (amount) line.push(amount.box);
    var children = [opts.title ? el('span', { class: 'q-label', text: opts.title }) : null, el('div', { class: 'add-line' }, line)].concat(texts.slice(1), [btn, error]);
    parent.appendChild(el('div', { class: 'add-form' }, children));
  }

  // Removing an option can leave two "—" separators together or one at an end; tidy them.
  function tidy(options) {
    var out = [];
    options.forEach(function (o) {
      if (o === null && (!out.length || out[out.length - 1] === null)) return;
      out.push(o);
    });
    while (out.length && out[out.length - 1] === null) out.pop();
    return out;
  }

  function build() {
    rows = [];
    bad = {};
    var titleInput = $('title');
    titleInput.value = edit.title;
    titleInput.oninput = function () {
      var v = titleInput.value.trim();
      bad.title = !v;
      $('title-error').textContent = v ? '' : 'Enter a name';
      if (v) edit.title = v;
      refresh();
    };
    $('title-error').textContent = '';

    var pickers = $('pickers');
    var wasOpen = {};
    [].forEach.call(pickers.children, function (d) { wasOpen[d.getAttribute('data-id')] = d.open; });
    pickers.textContent = '';
    edit.pickers.forEach(function (q) {
      var bq = byId(base.pickers, q.id);
      var groups = [el('div', { class: 'group' })];
      q.options.forEach(function (o) {
        if (o === null) { groups.push(el('div', { class: 'group' })); return; }
        var bo = option(bq, o[0]);
        addRow(groups[groups.length - 1], {
          key: q.id + '-' + o[0], label: o[0], kind: 'dollar', section: q.id,
          was: bo ? bo[1] : undefined,
          get: function () { return o[1]; }, set: function (v) { o[1] = v; },
          onRemove: function () { q.options = tidy(q.options.filter(function (x) { return x !== o; })); },
        });
      });
      var body = el('div', { class: 'options' }, groups);
      if (q.sub) body.insertBefore(el('p', { class: 'sub', text: q.sub }), body.firstChild);
      addForm(body, {
        texts: ['New option name'], amount: 'Price', button: 'Add option',
        onAdd: function (v, price) {
          if (option(q, v[0])) return q.label + ' already has ' + v[0];
          q.options.push([v[0], price]);
          return '';
        },
      });
      var rmList = el('button', { type: 'button', class: 'link-btn danger', text: 'Remove the ' + q.label + ' list' });
      rmList.addEventListener('click', function () {
        if (!window.confirm('Remove the whole ' + q.label + ' list from the form?')) return;
        edit.pickers = edit.pickers.filter(function (x) { return x !== q; });
        build();
      });
      body.appendChild(rmList);
      var summary = el('summary', {}, [
        el('span', { class: 'q-label', text: q.label + (bq ? '' : ' (new)') }),
        el('span', { class: 'count', id: 'changed-' + q.id }),
      ]);
      var card = el('details', { class: 'card', 'data-id': String(q.id) }, [summary, body]);
      card.open = !!wasOpen[q.id] || !bq;
      pickers.appendChild(card);
    });
    addForm(pickers, {
      title: 'Add a new list', texts: ['List name, e.g. Pumps', 'Note under the name (optional)'], button: 'Add list',
      onAdd: function (v) {
        if (labelTaken(v[0])) return 'There is already a question called ' + v[0];
        var id = newId();
        edit.pickers.push({ id: id, name: fieldName(id, v[0]), label: v[0], sub: v[1], options: [] });
        return '';
      },
    });
    pickers.lastChild.classList.add('card');

    var numbers = $('number-rows');
    numbers.textContent = '';
    edit.numbers.forEach(function (q) {
      var bq = byId(base.numbers, q.id);
      addRow(numbers, {
        key: 'n' + q.id, label: q.label + ' (per unit)', kind: 'dollar',
        was: bq ? bq.rate : undefined,
        get: function () { return q.rate; }, set: function (v) { q.rate = v; },
        onRemove: function () { edit.numbers = edit.numbers.filter(function (x) { return x !== q; }); },
      });
    });
    addForm(numbers, {
      texts: ['New number field, e.g. Extra Fittings', 'Note under it (optional)'], amount: 'Rate per unit', button: 'Add number field',
      onAdd: function (v, rate) {
        if (labelTaken(v[0])) return 'There is already a question called ' + v[0];
        var id = newId();
        edit.numbers.push({ id: id, name: fieldName(id, v[0]), label: v[0], sub: v[1], rate: rate });
        return '';
      },
    });

    var calc = $('calc-rows');
    calc.textContent = '';
    addRow(calc, {
      key: 'parRate', label: 'PAR % of RETAIL', kind: 'percent', was: base.calc.parRate,
      get: function () { return edit.calc.parRate; }, set: function (v) { edit.calc.parRate = v; },
    });
    addRow(calc, {
      key: 'adminFee', label: 'Admin fee added to PAR', kind: 'dollar', was: base.calc.adminFee,
      get: function () { return edit.calc.adminFee; },
      set: function (v) {
        edit.calc.adminFee = v;
        // Keep the "*Includes $500 admin fee" note under PAR in step with the fee.
        edit.results.par.sub = base.results.par.sub.replace(/\$[\d,]+(\.\d+)?/, money(v).replace(/\.00$/, ''));
      },
    });
    addRow(calc, {
      key: 'costRate', label: 'COST % of RETAIL', kind: 'percent', was: base.calc.costRate,
      get: function () { return edit.calc.costRate; }, set: function (v) { edit.calc.costRate = v; },
    });

    var comm = $('comm-rows');
    comm.textContent = '';
    COMMISSION_ROWS.forEach(function (c) {
      addRow(comm, {
        key: 'comm-' + c[0], label: c[1], kind: 'percent', was: base.commission[c[0]],
        get: function () { return edit.commission[c[0]]; }, set: function (v) { edit.commission[c[0]] = v; },
      });
    });
    refresh();
  }

  var COMMISSION_ROWS = [
    ['lowCutoff', 'Lower cutoff % of RETAIL'],
    ['lowRate', 'Commission below the cutoff (% of sold price)'],
    ['midRate', 'Commission from cutoff to PAR (% of sold price, and % of PAR above it)'],
    ['overRate', 'Share of each dollar above PAR'],
    ['financeFee', 'Taken off the financed part (sold price minus down payment)'],
  ];

  // Everything that differs between `base` and `edit`, as lines for the review and the commit.
  function changes() {
    var out = [];
    var add = function (text, section) { out.push({ text: text, section: section }); };
    if (edit.title !== base.title) add('Price list name: ' + base.title + ' → ' + edit.title);
    base.pickers.forEach(function (bq) { if (!byId(edit.pickers, bq.id)) add('Removed the ' + bq.label + ' list'); });
    edit.pickers.forEach(function (q) {
      var bq = byId(base.pickers, q.id);
      if (!bq) add('New list: ' + q.label, q.id);
      q.options.forEach(function (o) {
        if (!o) return;
        var bo = option(bq, o[0]);
        if (!bo) add(q.label + ': added ' + o[0] + ' at ' + money(o[1]), q.id);
        else if (bo[1] !== o[1]) add(q.label + ': ' + o[0] + ': ' + money(bo[1]) + ' → ' + money(o[1]), q.id);
      });
      if (bq) bq.options.forEach(function (bo) {
        if (bo && !option(q, bo[0])) add(q.label + ': removed ' + bo[0] + ' (' + money(bo[1]) + ')', q.id);
      });
    });
    base.numbers.forEach(function (bq) { if (!byId(edit.numbers, bq.id)) add('Removed the ' + bq.label + ' number field'); });
    edit.numbers.forEach(function (q) {
      var bq = byId(base.numbers, q.id);
      if (!bq) add('New number field: ' + q.label + ' at ' + money(q.rate) + ' per unit');
      else if (bq.rate !== q.rate) add(q.label + ' (per unit): ' + money(bq.rate) + ' → ' + money(q.rate));
    });
    if (edit.calc.parRate !== base.calc.parRate) add('PAR % of RETAIL: ' + pct(base.calc.parRate) + ' → ' + pct(edit.calc.parRate));
    if (edit.calc.adminFee !== base.calc.adminFee) add('Admin fee added to PAR: ' + money(base.calc.adminFee) + ' → ' + money(edit.calc.adminFee));
    if (edit.calc.costRate !== base.calc.costRate) add('COST % of RETAIL: ' + pct(base.calc.costRate) + ' → ' + pct(edit.calc.costRate));
    COMMISSION_ROWS.forEach(function (c) {
      var was = base.commission[c[0]], now = edit.commission[c[0]];
      if (now !== was) add(c[1] + ': ' + pct(was) + ' → ' + pct(now));
    });
    return out;
  }

  // Anything that would stop the public form working properly.
  function problem() {
    if (Object.keys(bad).some(function (k) { return bad[k]; })) return 'Fix the field marked in red';
    var empty = edit.pickers.filter(function (q) { return !q.options.some(Boolean); })[0];
    if (empty) return 'Add an option to ' + empty.label + ', or remove that list';
    return '';
  }

  function refresh() {
    rows.forEach(function (r) {
      var isNew = r.was === undefined;
      var changed = isNew || r.get() !== r.was;
      r.input.classList.toggle('changed', changed);
      r.wasEl.textContent = isNew ? 'new' : changed ? 'was ' + (r.kind === 'percent' ? pct(r.was) : money(r.was)) : '';
    });
    var list = changes();
    edit.pickers.forEach(function (q) {
      var n = list.filter(function (c) { return c.section === q.id; }).length;
      $('changed-' + q.id).textContent = n ? n + ' changed' : '';
    });
    var msg = problem();
    $('change-count').textContent = msg || (list.length ? list.length + (list.length === 1 ? ' change' : ' changes') : 'No changes');
    $('review-btn').disabled = !!msg || !list.length;
    if (msg || !list.length) $('review').hidden = true;
    else if (!$('review').hidden) renderReview();
  }

  function renderReview() {
    var ul = $('change-list');
    ul.textContent = '';
    changes().forEach(function (c) { ul.appendChild(el('li', { text: c.text })); });
  }

  $('review-btn').addEventListener('click', function () {
    renderReview();
    setStatus($('save-status'), '');
    $('review').hidden = false;
    $('review').scrollIntoView({ behavior: 'smooth' });
  });

  $('undo-btn').addEventListener('click', function () {
    edit = clone(base);
    build();
    $('review').hidden = true;
  });

  // ---- Saving ----

  function newFile() {
    var text = W.renderFormData(edit);
    // Re-read what was written, so a save can never publish a file the form cannot load.
    var check = W.loadFormData(text);
    if (JSON.stringify(check.form) !== JSON.stringify(edit)) throw new Error('the new price file did not read back the same');
    check.calc(0, {});
    check.commission(1000, 1200, true);
    return text;
  }

  $('download-btn').addEventListener('click', function () {
    var blob = new Blob([newFile()], { type: 'text/javascript' });
    var a = el('a', { href: URL.createObjectURL(blob), download: 'form-data.js' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus($('save-status'), 'Downloaded. Upload it to the repository in place of form-data.js to publish it.', 'ok');
  });

  $('save-btn').addEventListener('click', function () {
    var status = $('save-status');
    if (!token()) {
      $('access').open = true;
      $('access').scrollIntoView({ behavior: 'smooth' });
      setStatus(status, 'Paste a GitHub token under "GitHub access" first, or download the file instead.', 'bad');
      return;
    }
    var list = changes();
    if (problem()) { setStatus(status, problem() + '.', 'bad'); return; }
    var text;
    try { text = newFile(); } catch (e) { setStatus(status, 'Could not build the price file: ' + e.message + '.', 'bad'); return; }
    var btn = $('save-btn');
    btn.disabled = true;
    setStatus(status, 'Saving…');
    fetchRemote()
      .then(function (remote) {
        // Someone else saved since this page loaded: don't overwrite their prices.
        if (W.renderFormData(W.loadFormData(remote.text).form) !== W.renderFormData(base)) {
          throw new Error('The prices were changed somewhere else since this page loaded. Reload the page and make your changes again');
        }
        var summary = list.length === 1 ? list[0].text : list.length + ' price list changes';
        var message = 'Admin: ' + summary + '\n\n' + list.map(function (c) { return '- ' + c.text; }).join('\n');
        return fetch(API, {
          method: 'PUT',
          headers: Object.assign({ 'Content-Type': 'application/json' }, headers()),
          body: JSON.stringify({ message: message, content: encode(text), sha: remote.sha, branch: REPO.branch }),
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (body) {
            if (!r.ok) throw githubError(r.status, body);
          });
        });
      })
      .then(function () {
        base = clone(edit);
        build();
        setStatus($('load-status'), 'Saved. The public form shows the new prices once GitHub Pages republishes, usually within 10 minutes. A phone that already has the form open may need a refresh.', 'ok');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function (err) {
        setStatus(status, 'Not saved: ' + err.message + '.', 'bad');
      })
      .then(function () { btn.disabled = false; });
  });

  start();
})();
