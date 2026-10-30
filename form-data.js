// Questions, options and prices copied from the JotForm "LHWS PRICE APP - 01.01.2026"
// (https://form.jotform.com/253025919276159). Each option is [label, price];
// null is one of the "—" separators the original uses to group options.
// `value` is set only where JotForm submits a different string than it shows.
// Prices can be changed on admin.html, which rewrites this file (see form-data-writer.js).

window.LHWS_FORM = {
  title: 'LHWS PRICE APP - 01.01.2026',

  // Multi-select questions, in the original order. Their prices add straight into RETAIL.
  pickers: [
    {
      id: 47, name: 'q47_waterFilters', label: 'Water Filters', sub: 'Flex hoses included',
      options: [
        ['Drill-M (Multiple Holes)', 222],
        ['Galvanized Transition', 222],
        ['Power Extension (Outlet < 5Ft / 15Ft Max)', 25],
        null,
        ['STO Combo 1.0', 6086],
        ['STO Combo 1.5', 6703],
        ['STO Combo 2.0', 7718],
        null,
        ['CTO Combo 1.0', 7142],
        ['CTO Combo 1.5', 8019],
        null,
        ['Softener 1.0', 4059, 'Softener  1.0'],
        ['Softener 1.5', 4307],
        ['Softener 2.0', 4827],
        null,
        ['Conditioner 1.0', 4748],
        ['Conditioner 1.5', 5185],
        null,
        ['Catalytic Carbon 1.0', 3530],
        ['Catalytic Carbon 1.5', 3901],
        ['Catalytic Carbon 2.0', 4345],
        null,
        ['IMF (Iron, Manganese and Hydrogen Sulfide)', 5122],
        ['IRT (Iron, Hardness, Mang. & Tannin)', 10225],
        null,
        ['SIM 1.0', 5658],
        ['SIM 1.5', 6302],
        null,
        ['SIMTO 1.0', 7225],
        ['SIMTO 1.5', 8195],
        null,
        ['H2S Booster', 5179],
        null,
        ['Neutralizing Filter', 3406],
      ],
    },
    {
      id: 45, name: 'q45_ultravioletSystems', label: 'Ultraviolet Systems', sub: '6" Flex included',
      options: [
        ['UV Rack System (8 GPM)', 2776],
        ['UV Rack System (15 GPM)', 3337],
      ],
    },
    {
      id: 46, name: 'q46_reverseOsmosis', label: 'Reverse Osmosis Systems', sub: '',
      options: [
        ['(LWTRO) Tankless RO', 2018],
        ['Digital Faucet', 195],
        null,
        ['(LWRO) Reverse Osmosis System', 1482],
        ['(LWUF) Ultrafiltration System', 1174],
        null,
        ['Faucet - Chrome', 153],
        ['Faucet - Brushed Nickel', 175],
        ['Faucet - Black', 206],
        ['Faucet - Oil Rubbed Bronze', 250],
        null,
        ['DRILLRO - Drilling through Countertop', 330],
        ['Remineralization Cartridge', 73],
        ['Fridge Hookup', 162],
        ['RO Delivery Pump', 535],
      ],
    },
    {
      id: 59, name: 'q59_buryingTanks', label: 'Outdoor Covers', sub: '',
      options: [
        ['BYPASS', 378],
        ['UV', 337],
        ['STO', 544],
        ['CTO', 433],
        ['LWS', 489],
        ['LWC / TOC', 371],
        ['IMF', 446],
      ],
    },
  ],

  // Number questions. `rate` is what each unit adds to RETAIL. Limits match the original (0 to 200).
  numbers: [
    { id: 40, name: 'q40_outdoorTrenching40', label: 'Trenching', sub: 'Total Footage', rate: 14 },
    { id: 81, name: 'q81_additionalMaterial', label: 'Additional Material per Foot', sub: '*2x amount trenching', rate: 5 },
    { id: 74, name: 'q74_trenching', label: 'Extra Labor', sub: '*2 hours for haul away of existing system', rate: 103 },
  ],
  numberMin: 0,
  numberMax: 200,

  // Hidden in the original ("always-hidden") but still submitted with its default.
  hidden: [{ name: 'q62_extraCharges62', label: 'Extra Charges', value: 'No' }],

  results: {
    retail: { label: 'RETAIL', sub: '' },
    par: { label: 'PAR (8% commissionable)', sub: '*Includes $500 admin fee' },
    cost: { label: 'COST', sub: '*Account for CC/Finance fees' },
  },

  // PAR = RETAIL * parRate + adminFee; COST = RETAIL * costRate.
  calc: { parRate: 0.65, adminFee: 500, costRate: 0.5 },

  // Commission on the price the job sold for, using the same PAR as above (RETAIL * parRate + adminFee).
  // Sold below lowCutoff of RETAIL: lowRate of the sold price. From lowCutoff up to PAR: midRate of
  // the sold price. Above PAR: midRate of PAR plus overRate of every dollar above PAR (above RETAIL too).
  // Financed jobs: financeFee of the financed part (sold price minus any down payment) comes off first,
  // and the rules apply to what's left. The down payment itself never has the fee taken off.
  commission: { lowCutoff: 0.55, lowRate: 0.05, midRate: 0.08, overRate: 0.5, financeFee: 0.05 },
};

// The three calculations, each rounded to 2 decimal places. With the numbers above:
//   RETAIL = {47}+{45}+{46}+{59} + {40}*14 + {81}*5 + {74}*103
//   PAR    = RETAIL*0.65 + 500
//   COST   = RETAIL*0.5
window.LHWS_CALC = function (pickerTotal, numbers) {
  var round2 = function (n) { return Math.round(n * 100) / 100; };
  var F = window.LHWS_FORM;
  var retail = pickerTotal;
  F.numbers.forEach(function (q) { retail += (numbers[q.id] || 0) * q.rate; });
  retail = round2(retail);
  return { retail: retail, par: round2(retail * F.calc.parRate + F.calc.adminFee), cost: round2(retail * F.calc.costRate) };
};

// Commission for a job with this RETAIL that sold for `sold` (financed or paid upfront), rounded to cents.
// `down` is the down payment on a financed job; the finance fee is only taken off `sold - down`.
// `overRetail` is the part of `over` earned on dollars above RETAIL.
window.LHWS_COMMISSION = function (retail, sold, financed, down) {
  var round2 = function (n) { return Math.round(n * 100) / 100; };
  var c = window.LHWS_FORM.commission;
  var par = round2(retail * window.LHWS_FORM.calc.parRate + window.LHWS_FORM.calc.adminFee);
  var cutoff = round2(retail * c.lowCutoff);
  var dp = financed ? Math.min(Math.max(down || 0, 0), sold) : 0;
  var fee = financed ? round2((sold - dp) * c.financeFee) : 0;
  var net = round2(sold - fee);
  var out = { par: par, cutoff: cutoff, sold: round2(sold), down: round2(dp), fee: fee, net: net, tier: 'none', base: 0, over: 0, overRetail: 0, amount: 0 };
  if (!(retail > 0) || !(sold > 0)) return out;
  if (net > par) {
    out.tier = 'over';
    out.base = round2(par * c.midRate);
    out.over = round2((net - par) * c.overRate);
    out.overRetail = net > retail ? Math.min(out.over, round2((net - retail) * c.overRate)) : 0;
  } else if (net >= cutoff) {
    out.tier = 'mid';
    out.base = round2(net * c.midRate);
  } else {
    out.tier = 'low';
    out.base = round2(net * c.lowRate);
  }
  out.amount = round2(out.base + out.over);
  return out;
};
