# Price check: this site vs the original JotForm

Run 2026-10-30 against https://form.jotform.com/253025919276159 with `node tools/compare-with-jotform.js`.

- Questions, labels, sublabels, 45 options and their prices, number limits and result labels: **identical**
- RETAIL / PAR / COST: **61 of 61 cases match**

JotForm shows bare numbers; this site shows the same numbers as dollars.

| Case | JotForm RETAIL / PAR / COST | This site RETAIL / PAR / COST | Match |
|---|---|---|---|
| Nothing filled in | 0 / 500 / 0 | $0.00 / $500.00 / $0.00 | ✅ |
| Water Filters: Drill-M (Multiple Holes) ($222) | 222 / 644.30 / 111 | $222.00 / $644.30 / $111.00 | ✅ |
| Water Filters: Galvanized Transition ($222) | 222 / 644.30 / 111 | $222.00 / $644.30 / $111.00 | ✅ |
| Water Filters: Power Extension (Outlet < 5Ft / 15Ft Max) ($25) | 25 / 516.25 / 12.50 | $25.00 / $516.25 / $12.50 | ✅ |
| Water Filters: STO Combo 1.0 ($6086) | 6086 / 4455.90 / 3043 | $6,086.00 / $4,455.90 / $3,043.00 | ✅ |
| Water Filters: STO Combo 1.5 ($6703) | 6703 / 4856.95 / 3351.50 | $6,703.00 / $4,856.95 / $3,351.50 | ✅ |
| Water Filters: STO Combo 2.0 ($7718) | 7718 / 5516.70 / 3859 | $7,718.00 / $5,516.70 / $3,859.00 | ✅ |
| Water Filters: CTO Combo 1.0 ($7142) | 7142 / 5142.30 / 3571 | $7,142.00 / $5,142.30 / $3,571.00 | ✅ |
| Water Filters: CTO Combo 1.5 ($8019) | 8019 / 5712.35 / 4009.50 | $8,019.00 / $5,712.35 / $4,009.50 | ✅ |
| Water Filters: Softener  1.0 ($4059) | 4059 / 3138.35 / 2029.50 | $4,059.00 / $3,138.35 / $2,029.50 | ✅ |
| Water Filters: Softener 1.5 ($4307) | 4307 / 3299.55 / 2153.50 | $4,307.00 / $3,299.55 / $2,153.50 | ✅ |
| Water Filters: Softener 2.0 ($4827) | 4827 / 3637.55 / 2413.50 | $4,827.00 / $3,637.55 / $2,413.50 | ✅ |
| Water Filters: Conditioner 1.0 ($4748) | 4748 / 3586.20 / 2374 | $4,748.00 / $3,586.20 / $2,374.00 | ✅ |
| Water Filters: Conditioner 1.5 ($5185) | 5185 / 3870.25 / 2592.50 | $5,185.00 / $3,870.25 / $2,592.50 | ✅ |
| Water Filters: Catalytic Carbon 1.0 ($3530) | 3530 / 2794.50 / 1765 | $3,530.00 / $2,794.50 / $1,765.00 | ✅ |
| Water Filters: Catalytic Carbon 1.5 ($3901) | 3901 / 3035.65 / 1950.50 | $3,901.00 / $3,035.65 / $1,950.50 | ✅ |
| Water Filters: Catalytic Carbon 2.0 ($4345) | 4345 / 3324.25 / 2172.50 | $4,345.00 / $3,324.25 / $2,172.50 | ✅ |
| Water Filters: IMF (Iron, Manganese and Hydrogen Sulfide) ($5122) | 5122 / 3829.30 / 2561 | $5,122.00 / $3,829.30 / $2,561.00 | ✅ |
| Water Filters: IRT (Iron, Hardness, Mang. & Tannin) ($10225) | 10225 / 7146.25 / 5112.50 | $10,225.00 / $7,146.25 / $5,112.50 | ✅ |
| Water Filters: SIM 1.0 ($5658) | 5658 / 4177.70 / 2829 | $5,658.00 / $4,177.70 / $2,829.00 | ✅ |
| Water Filters: SIM 1.5 ($6302) | 6302 / 4596.30 / 3151 | $6,302.00 / $4,596.30 / $3,151.00 | ✅ |
| Water Filters: SIMTO 1.0 ($7225) | 7225 / 5196.25 / 3612.50 | $7,225.00 / $5,196.25 / $3,612.50 | ✅ |
| Water Filters: SIMTO 1.5 ($8195) | 8195 / 5826.75 / 4097.50 | $8,195.00 / $5,826.75 / $4,097.50 | ✅ |
| Water Filters: H2S Booster ($5179) | 5179 / 3866.35 / 2589.50 | $5,179.00 / $3,866.35 / $2,589.50 | ✅ |
| Water Filters: Neutralizing Filter ($3406) | 3406 / 2713.90 / 1703 | $3,406.00 / $2,713.90 / $1,703.00 | ✅ |
| Ultraviolet Systems: UV Rack System (8 GPM) ($2776) | 2776 / 2304.40 / 1388 | $2,776.00 / $2,304.40 / $1,388.00 | ✅ |
| Ultraviolet Systems: UV Rack System (15 GPM) ($3337) | 3337 / 2669.05 / 1668.50 | $3,337.00 / $2,669.05 / $1,668.50 | ✅ |
| Reverse Osmosis Systems: (LWTRO) Tankless RO ($2018) | 2018 / 1811.70 / 1009 | $2,018.00 / $1,811.70 / $1,009.00 | ✅ |
| Reverse Osmosis Systems: Digital Faucet ($195) | 195 / 626.75 / 97.50 | $195.00 / $626.75 / $97.50 | ✅ |
| Reverse Osmosis Systems: (LWRO) Reverse Osmosis System ($1482) | 1482 / 1463.30 / 741 | $1,482.00 / $1,463.30 / $741.00 | ✅ |
| Reverse Osmosis Systems: (LWUF) Ultrafiltration System ($1174) | 1174 / 1263.10 / 587 | $1,174.00 / $1,263.10 / $587.00 | ✅ |
| Reverse Osmosis Systems: Faucet - Chrome ($153) | 153 / 599.45 / 76.50 | $153.00 / $599.45 / $76.50 | ✅ |
| Reverse Osmosis Systems: Faucet - Brushed Nickel ($175) | 175 / 613.75 / 87.50 | $175.00 / $613.75 / $87.50 | ✅ |
| Reverse Osmosis Systems: Faucet - Black ($206) | 206 / 633.90 / 103 | $206.00 / $633.90 / $103.00 | ✅ |
| Reverse Osmosis Systems: Faucet - Oil Rubbed Bronze ($250) | 250 / 662.50 / 125 | $250.00 / $662.50 / $125.00 | ✅ |
| Reverse Osmosis Systems: DRILLRO - Drilling through Countertop ($330) | 330 / 714.50 / 165 | $330.00 / $714.50 / $165.00 | ✅ |
| Reverse Osmosis Systems: Remineralization Cartridge ($73) | 73 / 547.45 / 36.50 | $73.00 / $547.45 / $36.50 | ✅ |
| Reverse Osmosis Systems: Fridge Hookup ($162) | 162 / 605.30 / 81 | $162.00 / $605.30 / $81.00 | ✅ |
| Reverse Osmosis Systems: RO Delivery Pump ($535) | 535 / 847.75 / 267.50 | $535.00 / $847.75 / $267.50 | ✅ |
| Outdoor Covers: BYPASS ($378) | 378 / 745.70 / 189 | $378.00 / $745.70 / $189.00 | ✅ |
| Outdoor Covers: UV ($337) | 337 / 719.05 / 168.50 | $337.00 / $719.05 / $168.50 | ✅ |
| Outdoor Covers: STO ($544) | 544 / 853.60 / 272 | $544.00 / $853.60 / $272.00 | ✅ |
| Outdoor Covers: CTO ($433) | 433 / 781.45 / 216.50 | $433.00 / $781.45 / $216.50 | ✅ |
| Outdoor Covers: LWS ($489) | 489 / 817.85 / 244.50 | $489.00 / $817.85 / $244.50 | ✅ |
| Outdoor Covers: LWC / TOC ($371) | 371 / 741.15 / 185.50 | $371.00 / $741.15 / $185.50 | ✅ |
| Outdoor Covers: IMF ($446) | 446 / 789.90 / 223 | $446.00 / $789.90 / $223.00 | ✅ |
| Trenching = 1 | 14 / 509.10 / 7 | $14.00 / $509.10 / $7.00 | ✅ |
| Trenching = 7.5 | 105 / 568.25 / 52.50 | $105.00 / $568.25 / $52.50 | ✅ |
| Trenching = 3.333 | 46.66 / 530.33 / 23.33 | $46.66 / $530.33 / $23.33 | ✅ |
| Trenching = 200 | 2800 / 2320 / 1400 | $2,800.00 / $2,320.00 / $1,400.00 | ✅ |
| Additional Material per Foot = 1 | 5 / 503.25 / 2.50 | $5.00 / $503.25 / $2.50 | ✅ |
| Additional Material per Foot = 7.5 | 37.50 / 524.38 / 18.75 | $37.50 / $524.38 / $18.75 | ✅ |
| Additional Material per Foot = 3.333 | 16.67 / 510.84 / 8.34 | $16.67 / $510.84 / $8.34 | ✅ |
| Additional Material per Foot = 200 | 1000 / 1150 / 500 | $1,000.00 / $1,150.00 / $500.00 | ✅ |
| Extra Labor = 1 | 103 / 566.95 / 51.50 | $103.00 / $566.95 / $51.50 | ✅ |
| Extra Labor = 7.5 | 772.50 / 1002.13 / 386.25 | $772.50 / $1,002.13 / $386.25 | ✅ |
| Extra Labor = 3.333 | 343.30 / 723.15 / 171.65 | $343.30 / $723.15 / $171.65 | ✅ |
| Extra Labor = 200 | 20600 / 13890 / 10300 | $20,600.00 / $13,890.00 / $10,300.00 | ✅ |
| Typical job: STO Combo 1.5 + UV 8 GPM + LWRO + Chrome faucet + STO cover, 40 ft trench, 80 material, 2 labor | 12824 / 8835.60 / 6412 | $12,824.00 / $8,835.60 / $6,412.00 | ✅ |
| Fractional inputs: Softener 1.0 + Fridge Hookup, 12.5 ft trench, 25.25 material, 1.75 labor | 5075.50 / 3799.08 / 2537.75 | $5,075.50 / $3,799.08 / $2,537.75 | ✅ |
| Every option selected, every number at 200 | 162615 / 106199.75 / 81307.50 | $162,615.00 / $106,199.75 / $81,307.50 | ✅ |
