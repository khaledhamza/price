# LHWS Price App

A mobile-friendly copy of the JotForm **LHWS PRICE APP - 01.01.2026**
(https://form.jotform.com/253025919276159): the same questions, options, prices and
RETAIL / PAR / COST calculations, as a static site for GitHub Pages, plus:

- **Quantities.** Every picked option gets a Qty stepper (1 to 99); its price counts once per unit.
- **Commission, live.** Shown on the Quote tab and in the bottom bar (assuming the job sells at retail).
- **Commission tab.** Enter the price the job actually sold for to see the commission and how it was worked out.

Nothing is emailed or sent anywhere; **CLEAR FORM** just clears the page.

## Commission rules

R = RETAIL from the Quote tab, S = the sold price (R if left empty). Commission PAR = 65% of R,
with **no** admin fee (the PAR shown on the Quote tab includes the $500 admin fee; this one does not).

| Sold price | Commission |
| --- | --- |
| Below 55% of R | 5% of S |
| 55% of R up to PAR | 8% of S |
| Above PAR | 8% of PAR + 50% of (S − PAR) |

Example: listed at $1,000, sold at $1,200. PAR = $650; 8% × $650 = $52; 50% × $550 = $275; commission **$327**.

The percentages live in `form-data.js` (`commission`) and can be changed on the admin page.

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
