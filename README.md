# LHWS Price App

A mobile-friendly copy of the JotForm **LHWS PRICE APP - 01.01.2026**
(https://form.jotform.com/253025919276159): the same questions, options, prices and
RETAIL / PAR / COST calculations, as a static site for GitHub Pages, plus:

- **Quantities.** Every picked option gets a Qty stepper (1 to 99); its price counts once per unit.
- **Commission, live.** Shown on the Quote tab and in the bottom bar (assuming the job sells at retail).
- **Commission tab.** Enter the price the job actually sold for (above retail is fine) and whether it's paid
  upfront or financed, to see the commission and how it was worked out.
- **Saved sales.** On the Commission tab, enter the sale date (and a customer or note) and tap **Save sale**.
  **My sales** lists every saved sale with its commission, plus totals for this month and all time.
  Sales are kept in that phone's browser only (no server): they don't move between devices, and clearing
  the browser's website data deletes them. On iPhone, Safari and a Home Screen icon keep separate lists.

Nothing is emailed or sent anywhere; **CLEAR FORM** just clears the page.

## Commission rules

R = RETAIL from the Quote tab, S = the sold price (R if left empty; it can be above R).
PAR is the same PAR the Quote tab shows: 65% of R (35% off retail) plus the $500 admin fee.

If the job is **financed**, 5% of S comes off first and the rules below use what's left (N = S − 5%).
Paid **upfront**, N = S. R and PAR never change.

| N (sold price, after financing) | Commission |
| --- | --- |
| Below 55% of R | 5% of N |
| 55% of R up to PAR | 8% of N |
| Above PAR | 8% of PAR + 50% of (N − PAR) |

Above PAR that 50% covers every dollar, including dollars above retail; the Commission tab shows the part
earned above retail on its own line. On small jobs (retail under about $1,429) PAR is above retail.

Examples:
- Listed at $10,000, sold at $10,000 upfront: PAR $7,000. 8% × $7,000 = $560, plus 50% × $3,000 = $1,500,
  so **$2,060**. Financed, it is worked out on $9,500: $560 + $1,250 = **$1,810**.
- Tankless RO listed at $2,018, sold at $2,500 upfront: PAR $1,811.70. $144.94 + 50% × $688.30 = **$489.09**.

The percentages live in `form-data.js` (`calc` for PAR, `commission` for the rest) and can be changed on the
admin page.

## Files

- `form-data.js`: every question, option and price, the RETAIL/PAR/COST calculation and the commission rule.
- `index.html`, `app.js`, `styles.css`: the page.
- `admin.html`, `admin.js`, `admin.css`, `form-data-writer.js`: the admin page for changing prices and rates.
- `tools/compare-with-jotform.js`: fills the original JotForm and this site with the same answers and
  compares the results. The last run is in [docs/price-check.md](docs/price-check.md) (61 of 61 match).

## Publishing

Repository **Settings → Pages → Deploy from a branch → `main` / root**. The site is then at
https://khaledhamza.github.io/price/ (the repository must be public on a free GitHub plan).

## Changing prices

Open https://khaledhamza.github.io/price/admin.html. Change option prices, per-unit rates, PAR/COST
settings or commission rates, add or remove options, then **Review & save**. Saving commits a new
`form-data.js` to `main` through the GitHub API; it needs a fine-grained token with
**Contents: Read and write** on this repository only (the page explains how). Without a token,
**Download form-data.js instead** gives the file to upload by hand.

The admin page has no sign-in of its own: anyone can open it, but nobody can save without the token.

`node tools/check-form-data.js` checks that the admin page's writer reproduces `form-data.js` exactly.

## Re-running the price check

```sh
npm install playwright   # once, if Playwright is not installed
node tools/compare-with-jotform.js docs/price-check.md
```
