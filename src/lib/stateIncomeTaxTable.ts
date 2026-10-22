import type { StateIncomeTax } from './stateIncomeTax';
import type { StateCode } from './stateLaw';
import type { FilingStatus } from './taxLaw';

// The income tax each state levies on wages, by tax year, compiled from each
// state's own forms, instructions and statutes (October 2026): what an entry
// can say is defined in stateIncomeTax.ts. Amounts are for a household whose only
// income is wages, with no dependents. Each year's source is the main
// document its numbers come from; tests check every state against hand-worked
// examples (stateIncomeTax.checks.ts).
//
// TO ADD A TAX YEAR: add the year under the state's years once the state
// publishes it (most publish the next year's amounts in the fall). Until then
// the year is projected from the newest entry.

type ByStatus<T> = Record<FilingStatus, T>;
// The same for every filing status
const all = <T,>(v: T): ByStatus<T> => ({ single: v, mfj: v, hoh: v, mfs: v });
// By filing status; head of household and married filing separately default to single
const by = <T,>(single: T, mfj: T, hoh: T = single, mfs: T = single): ByStatus<T> => ({ single, mfj, hoh, mfs });

export const STATE_INCOME_TAX: Record<StateCode, StateIncomeTax | null> = {
  AK: null, // no income tax on wages
  AL: {
    indexed: false,
    localNote: "Some Alabama cities tax wages earned there (Birmingham 1%).",
    years: {
      2025: {
        source: "https://www.revenue.alabama.gov/wp-content/uploads/2026/01/25f40bk.pdf",
        brackets: by([[0, 2], [500, 4], [3000, 5], [100000, 5, 4958]], [[0, 2], [1000, 4], [6000, 5], [100000, 5, 4918]]),
        standardDeduction: by(3000, 8500, 5200, 4250),
        standardDeductionPhaseDown: { from: by(25999, 25999, 25999, 12999), to: by(35999, 35999, 35999, 17970.5909), floor: by(2500, 5000), step: by(500, 500, 500, 250) },
        exemption: by(1500, 3000, 3000),
        rules: [
          { kind: "federalTaxDeduction", share: 100 },
        ],
      },
      2026: {
        source: "https://www.revenue.alabama.gov/wp-content/uploads/2026/01/whbooklet_0126.pdf",
        brackets: by([[0, 2], [500, 4], [3000, 5], [100000, 5, 4958]], [[0, 2], [1000, 4], [6000, 5], [100000, 5, 4918]]),
        standardDeduction: by(3000, 8500, 5200, 4250),
        standardDeductionPhaseDown: { from: by(25999, 25999, 25999, 12999), to: by(35999, 35999, 35999, 17970.5909), floor: by(2500, 5000), step: by(500, 500, 500, 250) },
        exemption: by(1500, 3000, 3000),
        rules: [
          { kind: "federalTaxDeduction", share: 100 },
        ],
      },
    },
  },
  AR: {
    indexed: true,
    years: {
      2025: {
        source: "https://www.dfa.arkansas.gov/wp-content/uploads/2025_AR1000F_and_AR1000NR_Instructions.pdf",
        brackets: all([[0, 2], [4700, 3.9], [100000, 3.9, 3809]]),
        standardDeduction: by(2470, 4940),
        credit: by(29, 58, 58),
        rules: [
          { kind: "lowerIncomeTable", upTo: 94700, brackets: [[0, 0], [5600, 2], [11200, 3], [16000, 3.4], [26400, 3.9]], adjustment: { from: 94701, to: 97800, first: 310, perRow: 10, rowWidth: 100 } },
          { kind: "bracketsPerEarner" },
        ],
      },
      2026: {
        source: "https://arkleg.state.ar.us/Acts/FTPDocument?path=%2FACTS%2F2026S1%2FPublic%2F&file=1.pdf&ddBienniumSession=2025%2F2026S1",
        estimated: "these are the statutory 2026 tables (Act 1 of 2026, 3.7% top rate) and the 2025 standard deduction; the 2026 indexed amounts, not yet published, should be slightly higher",
        brackets: all([[0, 2], [4700, 3.7]]),
        standardDeduction: by(2470, 4940),
        credit: by(29, 58, 58),
        rules: [
          { kind: "lowerIncomeTable", upTo: 94700, brackets: [[0, 0], [5600, 2], [11200, 3], [16000, 3.4], [26400, 3.7]], adjustment: { from: 94701, to: 97600, first: 290, perRow: 10, rowWidth: 100 } },
          { kind: "bracketsPerEarner" },
        ],
      },
    },
  },
  AZ: {
    indexed: { brackets: false, amounts: true, thresholds: false },
    years: {
      2025: {
        source: "https://azdor.gov/sites/default/files/document/FORMS_INDIVIDUAL_2025_140i.pdf",
        brackets: all([[0, 2.5]]),
        standardDeduction: by(15750, 31500, 23625),
      },
      2026: {
        source: "https://www.azleg.gov/legtext/57leg/2R/laws/0140.pdf",
        estimated: "the standard deduction is the 2026 federal amount, which Arizona's statute follows",
        brackets: all([[0, 2.5]]),
        standardDeduction: by(16100, 32200, 24150),
      },
    },
  },
  CA: {
    indexed: true,
    years: {
      2025: {
        source: "https://www.ftb.ca.gov/forms/2025/2025-540-booklet.html",
        brackets: by([[0, 1], [11079, 2], [26264, 4], [41452, 6], [57542, 8], [72724, 9.3], [371479, 10.3], [445771, 11.3], [742953, 12.3]], [[0, 1], [22158, 2], [52528, 4], [82904, 6], [115084, 8], [145448, 9.3], [742958, 10.3], [891542, 11.3], [1485906, 12.3]], [[0, 1], [22173, 2], [52530, 4], [67716, 6], [83805, 8], [98990, 9.3], [505208, 10.3], [606251, 11.3], [1010417, 12.3]]),
        standardDeduction: by(5706, 11412, 11412),
        credit: by(153, 306),
        creditPhaseDown: { from: by(252203, 504411, 378310), to: by(315953, 568161, 442060, 284078), step: by(2500, 2500, 2500, 1250) },
        surtax: { rate: 1, over: all(1000000) },
      },
      2026: {
        source: "https://www.ftb.ca.gov/about-ftb/newsroom/tax-news/index.html",
        estimated: "the exemption credits' phase-out thresholds are the 2025 ones indexed by 3.4%; FTB has published the other 2026 amounts",
        brackets: by([[0, 1], [11456, 2], [27157, 4], [42861, 6], [59498, 8], [75197, 9.3], [384109, 10.3], [460927, 11.3], [768213, 12.3]], [[0, 1], [22912, 2], [54314, 4], [85722, 6], [118996, 8], [150394, 9.3], [768218, 10.3], [921854, 11.3], [1536426, 12.3]], [[0, 1], [22927, 2], [54316, 4], [70018, 6], [86654, 8], [102356, 9.3], [522385, 10.3], [626864, 11.3], [1044771, 12.3]]),
        standardDeduction: by(5900, 11800, 11800),
        credit: by(158, 316),
        creditPhaseDown: { from: by(260778, 521561, 391173), to: by(326611.3333, 587394.3333, 457006.3333, 293694.6667), step: by(2500, 2500, 2500, 1250) },
        surtax: { rate: 1, over: all(1000000) },
      },
    },
  },
  CO: {
    indexed: { brackets: false, amounts: true, thresholds: false },
    localNote: "Denver ($5.75 a month) and Aurora ($2 a month) charge people who work there a small head tax.",
    years: {
      2025: {
        source: "https://tax.colorado.gov/sites/default/files/documents/Book104_2025.pdf",
        brackets: all([[0, 4.4]]),
        standardDeduction: by(15750, 31500, 23625),
        standardDeductionPhaseDown: { bands: by([[299999.99, 15750], [Infinity, 12000]], [[299999.99, 31500], [Infinity, 16000]], [[299999.99, 23625], [Infinity, 12000]]) },
      },
      2026: {
        source: "https://tax.colorado.gov/sites/default/files/documents/Individual_Income_Tax_Guide_January_2026.pdf",
        brackets: all([[0, 4.4]]),
        standardDeduction: by(16100, 32200, 24150),
        standardDeductionPhaseDown: { bands: by([[299999.99, 16100], [Infinity, 1000]], [[299999.99, 32200], [Infinity, 2000]], [[299999.99, 24150], [Infinity, 1000]]) },
      },
    },
  },
  CT: {
    indexed: false,
    years: {
      2025: {
        source: "https://portal.ct.gov/-/media/drs/forms/2025/income/ct-1040-tcs_1225.pdf",
        brackets: by([[0, 2], [10000, 4.5], [50000, 5.5], [100000, 6], [200000, 6.5], [250000, 6.9], [500000, 6.99]], [[0, 2], [20000, 4.5], [100000, 5.5], [200000, 6], [400000, 6.5], [500000, 6.9], [1000000, 6.99]], [[0, 2], [16000, 4.5], [80000, 5.5], [160000, 6], [320000, 6.5], [400000, 6.9], [800000, 6.99]]),
        exemption: by(15000, 24000, 19000, 12000),
        exemptionPhaseDown: { from: by(30000, 48000, 38000, 24000), to: by(45000, 72000, 57000, 36000), step: 1000 },
        rules: [
          { kind: "addBack", tiers: by([{ over: 56500, step: 5000, perStep: 25, max: 250 }, { over: 105000, step: 5000, perStep: 25, max: 250 }, { over: 200000, step: 5000, perStep: 90, max: 2700 }, { over: 500000, step: 5000, perStep: 50, max: 450 }], [{ over: 100500, step: 5000, perStep: 50, max: 500 }, { over: 210000, step: 10000, perStep: 50, max: 500 }, { over: 400000, step: 10000, perStep: 180, max: 5400 }, { over: 1000000, step: 10000, perStep: 100, max: 900 }], [{ over: 78500, step: 4000, perStep: 40, max: 400 }, { over: 168000, step: 8000, perStep: 40, max: 400 }, { over: 320000, step: 8000, perStep: 140, max: 4200 }, { over: 800000, step: 8000, perStep: 80, max: 720 }], [{ over: 50250, step: 2500, perStep: 25, max: 250 }, { over: 105000, step: 5000, perStep: 25, max: 250 }, { over: 200000, step: 5000, perStep: 90, max: 2700 }, { over: 500000, step: 5000, perStep: 50, max: 450 }]) },
          { kind: "percentCredit", bands: by([[18800, 75], [19300, 70], [19800, 65], [20300, 60], [20800, 55], [21300, 50], [21800, 45], [22300, 40], [25000, 35], [25500, 30], [26000, 25], [26500, 20], [31300, 15], [31800, 14], [32300, 13], [32800, 12], [33300, 11], [60000, 10], [60500, 9], [61000, 8], [61500, 7], [62000, 6], [62500, 5], [63000, 4], [63500, 3], [64000, 2], [64500, 1], [Infinity, 0]], [[30000, 75], [30500, 70], [31000, 65], [31500, 60], [32000, 55], [32500, 50], [33000, 45], [33500, 40], [40000, 35], [40500, 30], [41000, 25], [41500, 20], [50000, 15], [50500, 14], [51000, 13], [51500, 12], [52000, 11], [96000, 10], [96500, 9], [97000, 8], [97500, 7], [98000, 6], [98500, 5], [99000, 4], [99500, 3], [100000, 2], [100500, 1], [Infinity, 0]], [[24000, 75], [24500, 70], [25000, 65], [25500, 60], [26000, 55], [26500, 50], [27000, 45], [27500, 40], [34000, 35], [34500, 30], [35000, 25], [35500, 20], [44000, 15], [44500, 14], [45000, 13], [45500, 12], [46000, 11], [74000, 10], [74500, 9], [75000, 8], [75500, 7], [76000, 6], [76500, 5], [77000, 4], [77500, 3], [78000, 2], [78500, 1], [Infinity, 0]], [[15000, 75], [15500, 70], [16000, 65], [16500, 60], [17000, 55], [17500, 50], [18000, 45], [18500, 40], [20000, 35], [20500, 30], [21000, 25], [21500, 20], [25000, 15], [25500, 14], [26000, 13], [26500, 12], [27000, 11], [48000, 10], [48500, 9], [49000, 8], [49500, 7], [50000, 6], [50500, 5], [51000, 4], [51500, 3], [52000, 2], [52500, 1], [Infinity, 0]]) },
        ],
      },
      2026: {
        source: "https://portal.ct.gov/-/media/drs/forms/2025/income/ct1040es-flat0126.pdf",
        brackets: by([[0, 2], [10000, 4.5], [50000, 5.5], [100000, 6], [200000, 6.5], [250000, 6.9], [500000, 6.99]], [[0, 2], [20000, 4.5], [100000, 5.5], [200000, 6], [400000, 6.5], [500000, 6.9], [1000000, 6.99]], [[0, 2], [16000, 4.5], [80000, 5.5], [160000, 6], [320000, 6.5], [400000, 6.9], [800000, 6.99]]),
        exemption: by(15000, 24000, 19000, 12000),
        exemptionPhaseDown: { from: by(30000, 48000, 38000, 24000), to: by(45000, 72000, 57000, 36000), step: 1000 },
        rules: [
          { kind: "addBack", tiers: by([{ over: 56500, step: 5000, perStep: 25, max: 250 }, { over: 105000, step: 5000, perStep: 25, max: 250 }, { over: 200000, step: 5000, perStep: 90, max: 2700 }, { over: 500000, step: 5000, perStep: 50, max: 450 }], [{ over: 100500, step: 5000, perStep: 50, max: 500 }, { over: 210000, step: 10000, perStep: 50, max: 500 }, { over: 400000, step: 10000, perStep: 180, max: 5400 }, { over: 1000000, step: 10000, perStep: 100, max: 900 }], [{ over: 78500, step: 4000, perStep: 40, max: 400 }, { over: 168000, step: 8000, perStep: 40, max: 400 }, { over: 320000, step: 8000, perStep: 140, max: 4200 }, { over: 800000, step: 8000, perStep: 80, max: 720 }], [{ over: 50250, step: 2500, perStep: 25, max: 250 }, { over: 105000, step: 5000, perStep: 25, max: 250 }, { over: 200000, step: 5000, perStep: 90, max: 2700 }, { over: 500000, step: 5000, perStep: 50, max: 450 }]) },
          { kind: "percentCredit", bands: by([[18800, 75], [19300, 70], [19800, 65], [20300, 60], [20800, 55], [21300, 50], [21800, 45], [22300, 40], [25000, 35], [25500, 30], [26000, 25], [26500, 20], [31300, 15], [31800, 14], [32300, 13], [32800, 12], [33300, 11], [60000, 10], [60500, 9], [61000, 8], [61500, 7], [62000, 6], [62500, 5], [63000, 4], [63500, 3], [64000, 2], [64500, 1], [Infinity, 0]], [[30000, 75], [30500, 70], [31000, 65], [31500, 60], [32000, 55], [32500, 50], [33000, 45], [33500, 40], [40000, 35], [40500, 30], [41000, 25], [41500, 20], [50000, 15], [50500, 14], [51000, 13], [51500, 12], [52000, 11], [96000, 10], [96500, 9], [97000, 8], [97500, 7], [98000, 6], [98500, 5], [99000, 4], [99500, 3], [100000, 2], [100500, 1], [Infinity, 0]], [[24000, 75], [24500, 70], [25000, 65], [25500, 60], [26000, 55], [26500, 50], [27000, 45], [27500, 40], [34000, 35], [34500, 30], [35000, 25], [35500, 20], [44000, 15], [44500, 14], [45000, 13], [45500, 12], [46000, 11], [74000, 10], [74500, 9], [75000, 8], [75500, 7], [76000, 6], [76500, 5], [77000, 4], [77500, 3], [78000, 2], [78500, 1], [Infinity, 0]], [[15000, 75], [15500, 70], [16000, 65], [16500, 60], [17000, 55], [17500, 50], [18000, 45], [18500, 40], [20000, 35], [20500, 30], [21000, 25], [21500, 20], [25000, 15], [25500, 14], [26000, 13], [26500, 12], [27000, 11], [48000, 10], [48500, 9], [49000, 8], [49500, 7], [50000, 6], [50500, 5], [51000, 4], [51500, 3], [52000, 2], [52500, 1], [Infinity, 0]]) },
        ],
      },
    },
  },
  DC: {
    indexed: { brackets: false, amounts: true, thresholds: false },
    years: {
      2025: {
        source: "https://otr.cfo.dc.gov/sites/default/files/dc/sites/otr/publication/attachments/2025_D40_Book_082026_v1.pdf",
        brackets: all([[0, 4], [10000, 6], [40000, 6.5], [60000, 8.5], [250000, 9.25], [500000, 9.75], [1000000, 10.75]]),
        standardDeduction: by(15000, 30000, 22500),
        rules: [
          { kind: "bracketsPerEarner" },
        ],
      },
    },
  },
  DE: {
    indexed: false,
    localNote: "Wilmington residents also pay a 1.25% wage tax.",
    years: {
      2025: {
        source: "https://revenuefiles.delaware.gov/2025/PITForms_Instructions/Instructions/PIT-RES_Instructions_2025-01.pdf",
        brackets: all([[0, 0], [2000, 2.2], [5000, 3.9], [10000, 4.8], [20000, 5.2], [25000, 5.55], [60000, 6.6]]),
        standardDeduction: by(3250, 6500),
        credit: by(110, 220),
        rules: [
          { kind: "bracketsPerEarner" },
        ],
      },
      2026: {
        source: "https://revenuefiles.delaware.gov/2025/PITForms_Instructions/Instructions/PIT-EST_Instructions_2026-01.pdf",
        brackets: all([[0, 0], [2000, 2.2], [5000, 3.9], [10000, 4.8], [20000, 5.2], [25000, 5.55], [60000, 6.6]]),
        standardDeduction: by(3250, 6500),
        credit: by(110, 220),
        rules: [
          { kind: "bracketsPerEarner" },
        ],
      },
    },
  },
  FL: null, // no income tax on wages
  GA: {
    indexed: false,
    years: {
      2025: {
        source: "https://dor.georgia.gov/document/document/2025-it-511-individual-income-tax-booklet/download",
        brackets: all([[0, 5.19]]),
        standardDeduction: by(12000, 24000),
      },
      2026: {
        source: "https://dor.georgia.gov/taxes/important-tax-updates",
        brackets: all([[0, 4.99]]),
        standardDeduction: by(15000, 30000),
      },
    },
  },
  HI: {
    indexed: false,
    years: {
      2025: {
        source: "https://data.capitol.hawaii.gov/hrscurrent/Vol04_Ch0201-0257/HRS0235/HRS_0235-0051.htm",
        brackets: by([[0, 1.4], [9600, 3.2], [14400, 5.5], [19200, 6.4], [24000, 6.8], [36000, 7.2], [48000, 7.6], [125000, 7.9], [175000, 8.25], [225000, 9], [275000, 10], [325000, 11]], [[0, 1.4], [19200, 3.2], [28800, 5.5], [38400, 6.4], [48000, 6.8], [72000, 7.2], [96000, 7.6], [250000, 7.9], [350000, 8.25], [450000, 9], [550000, 10], [650000, 11]], [[0, 1.4], [14400, 3.2], [21600, 5.5], [28800, 6.4], [36000, 6.8], [54000, 7.2], [72000, 7.6], [187500, 7.9], [262500, 8.25], [337500, 9], [412500, 10], [487500, 11]]),
        standardDeduction: by(4400, 8800, 6424),
        exemption: by(1144, 2288),
      },
      2026: {
        source: "https://data.capitol.hawaii.gov/hrscurrent/Vol04_Ch0201-0257/HRS0235/HRS_0235-0051.htm",
        brackets: by([[0, 1.4], [9600, 3.2], [14400, 5.5], [19200, 6.4], [24000, 6.8], [36000, 7.2], [48000, 7.6], [125000, 7.9], [175000, 8.25], [225000, 9], [275000, 10], [325000, 11]], [[0, 1.4], [19200, 3.2], [28800, 5.5], [38400, 6.4], [48000, 6.8], [72000, 7.2], [96000, 7.6], [250000, 7.9], [350000, 8.25], [450000, 9], [550000, 10], [650000, 11]], [[0, 1.4], [14400, 3.2], [21600, 5.5], [28800, 6.4], [36000, 6.8], [54000, 7.2], [72000, 7.6], [187500, 7.9], [262500, 8.25], [337500, 9], [412500, 10], [487500, 11]]),
        standardDeduction: by(8000, 16000, 12000),
        exemption: by(1144, 2288),
      },
      2027: {
        source: "HRS 235-51 as amended by Act 24, SLH 2026 (SB 3125 CD2); HRS 235-2.4(a)(2)",
        brackets: by([[0, 1.4, 0], [14400, 2.5, 202], [19200, 5, 322], [24000, 6.4, 562], [36000, 6.8, 1330], [48000, 7.2, 2146], [125000, 7.6, 7690], [175000, 8.25, 11490], [225000, 9, 15615], [275000, 10, 20115], [325000, 11, 25115], [500000, 13, 44365]], [[0, 1.4, 0], [28800, 2.5, 403], [38400, 5, 643], [48000, 6.4, 1123], [72000, 6.8, 2659], [96000, 7.2, 4291], [250000, 7.6, 15379], [350000, 8.25, 22979], [450000, 9, 31229], [550000, 10, 40229], [650000, 11, 50229], [1000000, 13, 88729]], [[0, 1.4, 0], [21600, 2.5, 302], [28800, 5, 482], [36000, 6.4, 842], [54000, 6.8, 1994], [72000, 7.2, 3218], [187500, 7.6, 11534], [262500, 8.25, 17234], [337500, 9, 23422], [412500, 10, 30172], [487500, 11, 37672], [750000, 13, 66547]]),
        standardDeduction: by(8000, 16000, 12000),
        exemption: by(1144, 2288),
      },
      2028: {
        source: "HRS 235-51 as amended by Act 24, SLH 2026 (SB 3125 CD2); HRS 235-2.4(a)(2)",
        brackets: by([[0, 1.4, 0], [14400, 2.5, 202], [19200, 5, 322], [24000, 6.4, 562], [36000, 6.8, 1330], [48000, 7.2, 2146], [125000, 7.6, 7690], [175000, 8.25, 11490], [225000, 9, 15615], [275000, 10, 20115], [325000, 11, 25115], [500000, 13, 44365]], [[0, 1.4, 0], [28800, 2.5, 403], [38400, 5, 643], [48000, 6.4, 1123], [72000, 6.8, 2659], [96000, 7.2, 4291], [250000, 7.6, 15379], [350000, 8.25, 22979], [450000, 9, 31229], [550000, 10, 40229], [650000, 11, 50229], [1000000, 13, 88729]], [[0, 1.4, 0], [21600, 2.5, 302], [28800, 5, 482], [36000, 6.4, 842], [54000, 6.8, 1994], [72000, 7.2, 3218], [187500, 7.6, 11534], [262500, 8.25, 17234], [337500, 9, 23422], [412500, 10, 30172], [487500, 11, 37672], [750000, 13, 66547]]),
        standardDeduction: by(9000, 18000, 13500),
        exemption: by(1144, 2288),
      },
      2029: {
        source: "HRS 235-51 as amended by Act 24, SLH 2026 (SB 3125 CD2); HRS 235-2.4(a)(2)",
        brackets: by([[0, 1.4, 0], [19200, 2.5, 269], [24000, 5, 389], [36000, 6.4, 989], [48000, 6.8, 1757], [125000, 7.2, 6993], [175000, 8.25, 10593], [225000, 9, 14718], [275000, 10, 19218], [325000, 11, 24218], [500000, 13, 43468]], [[0, 1.4, 0], [38400, 2.5, 538], [48000, 5, 778], [72000, 6.4, 1978], [96000, 6.8, 3514], [250000, 7.2, 13986], [350000, 8.25, 21186], [450000, 9, 29436], [550000, 10, 38436], [650000, 11, 48436], [1000000, 13, 86936]], [[0, 1.4, 0], [28800, 2.5, 403], [36000, 5, 583], [54000, 6.4, 1483], [72000, 6.8, 2635], [187500, 7.2, 10489], [262500, 8.25, 15889], [337500, 9, 22077], [412500, 10, 28827], [487500, 11, 36327], [750000, 13, 65202]]),
        standardDeduction: by(9000, 18000, 13500),
        exemption: by(1144, 2288),
      },
      2030: {
        source: "HRS 235-51 as amended by Act 24, SLH 2026 (SB 3125 CD2); HRS 235-2.4(a)(2)",
        brackets: by([[0, 1.4, 0], [19200, 2.5, 269], [24000, 5, 389], [36000, 6.4, 989], [48000, 6.8, 1757], [125000, 7.2, 6993], [175000, 8.25, 10593], [225000, 9, 14718], [275000, 10, 19218], [325000, 11, 24218], [500000, 13, 43468]], [[0, 1.4, 0], [38400, 2.5, 538], [48000, 5, 778], [72000, 6.4, 1978], [96000, 6.8, 3514], [250000, 7.2, 13986], [350000, 8.25, 21186], [450000, 9, 29436], [550000, 10, 38436], [650000, 11, 48436], [1000000, 13, 86936]], [[0, 1.4, 0], [28800, 2.5, 403], [36000, 5, 583], [54000, 6.4, 1483], [72000, 6.8, 2635], [187500, 7.2, 10489], [262500, 8.25, 15889], [337500, 9, 22077], [412500, 10, 28827], [487500, 11, 36327], [750000, 13, 65202]]),
        standardDeduction: by(10000, 20000, 15000),
        exemption: by(1144, 2288),
      },
      2031: {
        source: "HRS 235-51 as amended by Act 24, SLH 2026 (SB 3125 CD2); HRS 235-2.4(a)(2)",
        brackets: by([[0, 1.4, 0], [19200, 2.5, 269], [24000, 5, 389], [36000, 6.4, 989], [48000, 6.8, 1757], [125000, 7.2, 6993], [175000, 8.25, 10593], [225000, 9, 14718], [275000, 10, 19218], [325000, 11, 24218], [500000, 13, 43468]], [[0, 1.4, 0], [38400, 2.5, 538], [48000, 5, 778], [72000, 6.4, 1978], [96000, 6.8, 3514], [250000, 7.2, 13986], [350000, 8.25, 21186], [450000, 9, 29436], [550000, 10, 38436], [650000, 11, 48436], [1000000, 13, 86936]], [[0, 1.4, 0], [28800, 2.5, 403], [36000, 5, 583], [54000, 6.4, 1483], [72000, 6.8, 2635], [187500, 7.2, 10489], [262500, 8.25, 15889], [337500, 9, 22077], [412500, 10, 28827], [487500, 11, 36327], [750000, 13, 65202]]),
        standardDeduction: by(12000, 24000, 18000),
        exemption: by(1144, 2288),
      },
    },
  },
  IA: {
    indexed: { brackets: false, amounts: true, thresholds: false },
    localNote: "Most Iowa school districts add a surtax of a few percent of the state tax.",
    years: {
      2025: {
        source: "https://revenue.iowa.gov/media/4400/download",
        brackets: all([[0, 3.8]]),
        standardDeduction: by(15750, 31500, 23625),
        credit: by(40, 80, 80),
      },
      2026: {
        source: "https://revenue.iowa.gov/media/2725/download",
        brackets: all([[0, 3.8]]),
        standardDeduction: by(16100, 32200, 24150),
        credit: by(40, 80, 80),
      },
    },
  },
  ID: {
    indexed: { brackets: true, amounts: true, thresholds: false },
    years: {
      2025: {
        source: "https://tax.idaho.gov/wp-content/uploads/forms/EIN00046/EIN00046_03-02-2026.pdf",
        brackets: by([[0, 0], [4811, 5.3]], [[0, 0], [9622, 5.3]], [[0, 0], [9622, 5.3]]),
        standardDeduction: by(15750, 31500, 23625),
        credit: by(145, 300),
      },
    },
  },
  IL: {
    indexed: { brackets: false, amounts: true, thresholds: false },
    years: {
      2025: {
        source: "https://tax.illinois.gov/content/dam/soi/en/web/tax/forms/incometax/documents/currentyear/individual/il-1040-instr.pdf",
        brackets: all([[0, 4.95]]),
        exemption: by(2850, 5700),
        exemptionPhaseDown: { bands: by([[250000, 2850], [Infinity, 0]], [[500000, 5700], [Infinity, 0]]) },
      },
      2026: {
        source: "https://tax.illinois.gov/questionsandanswers/answer.851.html",
        brackets: all([[0, 4.95]]),
        exemption: by(2925, 5850),
        exemptionPhaseDown: { bands: by([[250000, 2925], [Infinity, 0]], [[500000, 5850], [Infinity, 0]]) },
      },
    },
  },
  IN: {
    indexed: false,
    local: { rate: 1.75, note: "a 1.75% county income tax, the population-weighted average of the rates Indiana's 92 counties all levy (0.5% to 3%; Marion County 2.02%)" },
    scheduledRates: {
      2027: all([2.9]),
    },
    years: {
      2025: {
        source: "https://forms.in.gov/Download.aspx?id=16914",
        brackets: all([[0, 3]]),
        exemption: by(1000, 2000),
      },
      2026: {
        source: "https://www.in.gov/dor/files/dn01.pdf",
        brackets: all([[0, 2.95]]),
        exemption: by(1000, 2000),
      },
    },
  },
  KS: {
    indexed: false,
    years: {
      2025: {
        source: "https://www.ksrevenue.gov/pdf/ip25.pdf",
        brackets: by([[0, 5.2], [23000, 5.58]], [[0, 5.2], [46000, 5.58]]),
        standardDeduction: by(3605, 8240, 6180, 4120),
        exemption: by(9160, 18320, 11480),
      },
      2026: {
        source: "https://ksrevisor.gov/statutes/chapters/ch79/079_032_0110.html",
        brackets: by([[0, 5.2], [23000, 5.58]], [[0, 5.2], [46000, 5.58]]),
        standardDeduction: by(3605, 8240, 6180, 4120),
        exemption: by(9160, 18320, 11480),
      },
    },
  },
  KY: {
    indexed: { brackets: false, amounts: true, thresholds: false },
    localNote: "Most Kentucky cities and counties levy an occupational tax on wages earned there (Louisville 2.2%, Lexington 2.25%).",
    years: {
      2025: {
        source: "https://revenue.ky.gov/Forms/740%20Packet%20Instructions.pdf",
        brackets: all([[0, 4]]),
        standardDeduction: all(3270),
        rules: [
          { kind: "bracketsPerEarner", standardDeductionEach: 3270 },
        ],
      },
      2026: {
        source: "https://revenue.ky.gov/News/Pages/Kentucky-DOR-Announces-2026-Standard-Deduction.aspx",
        brackets: all([[0, 3.5]]),
        standardDeduction: all(3360),
        rules: [
          { kind: "bracketsPerEarner", standardDeductionEach: 3360 },
        ],
      },
    },
  },
  LA: {
    indexed: { brackets: false, amounts: true, thresholds: false },
    years: {
      2025: {
        source: "https://dam.ldr.la.gov/taxforms/IT540i%20WEB(2025)D11.pdf",
        brackets: all([[0, 3]]),
        standardDeduction: by(12500, 25000, 25000),
      },
      2026: {
        source: "https://dam.ldr.la.gov/lawspolicies/RIB%2026-005-Updated%20Withholding%20Tables.pdf",
        estimated: "the standard deduction is the one in the 2026 withholding tables; the final amount may be a little lower",
        brackets: all([[0, 3]]),
        standardDeduction: by(12875, 25750, 25750),
      },
    },
  },
  MA: {
    indexed: { brackets: false, amounts: false, thresholds: true },
    years: {
      2025: {
        source: "https://www.mass.gov/doc/2025-form-1-instructions/download",
        brackets: all([[0, 5]]),
        exemption: by(4400, 8800, 6800),
        surtax: { rate: 4, over: all(1083150) },
        rules: [
          { kind: "earnerDeduction", rate: 7.65, max: 2000 },
        ],
      },
      2026: {
        source: "https://www.mass.gov/doc/massachusetts-circular-m-income-tax-withholding-tables-at-50-effective-january-1-2026/download",
        brackets: all([[0, 5]]),
        exemption: by(4400, 8800, 6800),
        surtax: { rate: 4, over: all(1107750) },
        rules: [
          { kind: "earnerDeduction", rate: 7.65, max: 2000 },
        ],
      },
    },
  },
  MD: {
    indexed: { brackets: false, amounts: true, thresholds: false },
    local: { rate: 3.2, note: "a 3.2% county income tax, the rate in Montgomery, Prince George's, Baltimore and Howard counties and Baltimore City (2.25% to 3.3% elsewhere)" },
    years: {
      2025: {
        source: "https://www.marylandcomptroller.gov/content/dam/mdcomp/tax/instructions/2025/resident-booklet.pdf",
        brackets: by([[0, 2], [1000, 3], [2000, 4], [3000, 4.75], [100000, 5], [125000, 5.25], [150000, 5.5], [250000, 5.75], [500000, 6.25], [1000000, 6.5]], [[0, 2], [1000, 3], [2000, 4], [3000, 4.75], [150000, 5], [175000, 5.25], [225000, 5.5], [300000, 5.75], [600000, 6.25], [1200000, 6.5]], [[0, 2], [1000, 3], [2000, 4], [3000, 4.75], [150000, 5], [175000, 5.25], [225000, 5.5], [300000, 5.75], [600000, 6.25], [1200000, 6.5]]),
        standardDeduction: by(3350, 6700, 6700),
        exemption: by(3200, 6400),
        exemptionPhaseDown: { bands: by([[100000, 3200], [125000, 1600], [150000, 800], [Infinity, 0]], [[150000, 6400], [175000, 3200], [200000, 1600], [Infinity, 0]], [[150000, 3200], [175000, 1600], [200000, 800], [Infinity, 0]]) },
        rules: [
          { kind: "twoEarnerDeduction", max: 1200 },
        ],
      },
      2026: {
        source: "https://www.marylandcomptroller.gov/content/dam/mdcomp/tax/instructions/withholding/2026/withholding-guide.pdf",
        estimated: "the joint and head-of-household standard deduction comes from the statutory inflation formula; the Comptroller has published only the single amount ($3,400)",
        brackets: by([[0, 2], [1000, 3], [2000, 4], [3000, 4.75], [100000, 5], [125000, 5.25], [150000, 5.5], [250000, 5.75], [500000, 6.25], [1000000, 6.5]], [[0, 2], [1000, 3], [2000, 4], [3000, 4.75], [150000, 5], [175000, 5.25], [225000, 5.5], [300000, 5.75], [600000, 6.25], [1200000, 6.5]], [[0, 2], [1000, 3], [2000, 4], [3000, 4.75], [150000, 5], [175000, 5.25], [225000, 5.5], [300000, 5.75], [600000, 6.25], [1200000, 6.5]]),
        standardDeduction: by(3400, 6850, 6850),
        exemption: by(3200, 6400),
        exemptionPhaseDown: { bands: by([[100000, 3200], [125000, 1600], [150000, 800], [Infinity, 0]], [[150000, 6400], [175000, 3200], [200000, 1600], [Infinity, 0]], [[150000, 3200], [175000, 1600], [200000, 800], [Infinity, 0]]) },
        rules: [
          { kind: "twoEarnerDeduction", max: 1200 },
        ],
      },
    },
  },
  ME: {
    indexed: true,
    years: {
      2025: {
        source: "https://www.maine.gov/revenue/sites/maine.gov.revenue/files/inline-files/ind_tax_rate_sched_2025.pdf",
        brackets: by([[0, 5.8], [26800, 6.75], [63450, 7.15]], [[0, 5.8], [53600, 6.75], [126900, 7.15]], [[0, 5.8], [40200, 6.75], [95150, 7.15]]),
        standardDeduction: by(15000, 30000, 22500),
        standardDeductionPhaseDown: { from: by(100000, 200050, 150000), to: by(175000, 350050, 262500) },
        exemption: by(5150, 10300),
        exemptionPhaseDown: { from: by(333450, 400100, 366750, 200050), to: by(458450, 525100, 491750, 262550) },
      },
      2026: {
        source: "https://www.maine.gov/revenue/sites/maine.gov.revenue/files/2026-05/ind_tax_rate_sched_2026_rev.pdf",
        brackets: by([[0, 5.8], [27400, 6.75], [64850, 7.15]], [[0, 5.8], [54850, 6.75], [129750, 7.15]], [[0, 5.8], [41100, 6.75], [97300, 7.15]]),
        standardDeduction: by(15700, 31400, 23550),
        standardDeductionPhaseDown: { from: by(102250, 204550, 153400), to: by(177250, 354550, 265900) },
        exemption: by(5300, 10600),
        exemptionPhaseDown: { from: by(341000, 409150, 375050, 204575), to: by(466000, 534150, 500050, 267075) },
        surtax: { rate: 2, over: by(1000000, 1500000, 1500000, 750000) },
      },
    },
  },
  MI: {
    indexed: { brackets: false, amounts: true, thresholds: false },
    localNote: "24 Michigan cities levy an income tax, mostly 1% on residents (Detroit 2.4%).",
    years: {
      2025: {
        source: "https://www.michigan.gov/taxes/iit/tax-guidance/tax-year-info/tax-year-2025-guidance",
        brackets: all([[0, 4.25]]),
        exemption: by(5800, 11600),
      },
      2026: {
        source: "https://www.michigan.gov/treasury/reference/taxpayer-notices/2026/04/15/425-income-tax-rate-for-individuals-and-fiduciaries-in-2026-tax-year",
        brackets: all([[0, 4.25]]),
        exemption: by(5900, 11800),
      },
    },
  },
  MN: {
    indexed: true,
    years: {
      2025: {
        source: "https://www.revenue.state.mn.us/sites/default/files/2026-10/m1-inst-25.pdf",
        brackets: by([[0, 5.35], [32570, 6.8], [106990, 7.85], [198630, 9.85]], [[0, 5.35], [47620, 6.8], [189180, 7.85], [330410, 9.85]], [[0, 5.35], [40100, 6.8], [161130, 7.85], [264050, 9.85]], [[0, 5.35], [23810, 6.8], [94590, 7.85], [165205, 9.85]]),
        standardDeduction: by(14950, 29900, 22500),
        standardDeductionPhaseDown: { points: by([[238950, 14950], [330300, 12209.5], [422495, 2990]], [[238950, 29900], [330300, 27159.5], [542095, 5980]], [[238950, 22500], [330300, 19759.5], [482895, 4500]], [[119475, 14950], [165150, 13579.75], [271047.5, 2990]]) },
        rules: [
          { kind: "minnesotaMarriageCredit", adjustment: 14950, minLesserWages: 31000, minTaxable: 48000, cap: 1851 },
        ],
      },
      2026: {
        source: "https://www.revenue.state.mn.us/press-release/2025-12-16/minnesota-income-tax-brackets-standard-deduction-and-dependent-exemption",
        brackets: by([[0, 5.35], [33310, 6.8], [109430, 7.85], [203150, 9.85]], [[0, 5.35], [48700, 6.8], [193480, 7.85], [337930, 9.85]], [[0, 5.35], [41010, 6.8], [164800, 7.85], [270060, 9.85]], [[0, 5.35], [24350, 6.8], [96740, 7.85], [168965, 9.85]]),
        standardDeduction: by(15300, 30600, 23000),
        standardDeductionPhaseDown: { points: by([[244400, 15300], [337800, 12498], [432180, 3060]], [[244400, 30600], [337800, 27798], [554580, 6120]], [[244400, 23000], [337800, 20198], [493780, 4600]], [[122200, 15300], [168900, 13899], [277290, 3060]]) },
        rules: [
          { kind: "minnesotaMarriageCredit", adjustment: 15300, minLesserWages: 31000, minTaxable: 49000, cap: 1894 },
        ],
      },
    },
  },
  MO: {
    indexed: { brackets: true, amounts: true, thresholds: false },
    localNote: "Kansas City and St. Louis residents also pay a 1% earnings tax.",
    years: {
      2025: {
        source: "https://dor.mo.gov/forms/MO-1040%20Instructions_2025.pdf",
        brackets: all([[0, 0], [1313, 2], [2626, 2.5], [3939, 3], [5252, 3.5], [6565, 4], [7878, 4.5], [9191, 4.7]]),
        standardDeduction: by(15750, 31500, 23625),
        exemption: by(0, 0, 1400),
        rules: [
          { kind: "federalTaxDeduction", share: all([[25000, 35], [50000, 25], [100000, 15], [125000, 5], [Infinity, 0]]), cap: by(5000, 10000) },
          { kind: "bracketsPerEarner" },
        ],
      },
      2026: {
        source: "https://dor.mo.gov/forms/MO-1040ES_2026.pdf",
        brackets: all([[0, 0], [1348, 2], [2696, 2.5], [4044, 3], [5392, 3.5], [6740, 4], [8088, 4.5], [9436, 4.7]]),
        standardDeduction: by(16100, 32200, 24150),
        exemption: by(0, 0, 1400),
        rules: [
          { kind: "federalTaxDeduction", share: all([[25000, 35], [50000, 25], [100000, 15], [125000, 5], [Infinity, 0]]), cap: by(5000, 10000) },
          { kind: "bracketsPerEarner" },
        ],
      },
    },
  },
  MS: {
    indexed: false,
    scheduledRates: {
      2027: all([0, 3.75]),
      2028: all([0, 3.5]),
      2029: all([0, 3.25]),
      2030: all([0, 3]),
    },
    years: {
      2025: {
        source: "https://www.dor.ms.gov/sites/default/files/tax-forms/individual/80100251%202.pdf",
        brackets: all([[0, 0], [10000, 4.4]]),
        standardDeduction: by(2300, 4600, 3400),
        exemption: by(6000, 12000, 8000),
        rules: [
          { kind: "bracketsPerEarner" },
        ],
      },
      2026: {
        source: "https://www.dor.ms.gov/sites/default/files/tax-forms/individual/80100251%202.pdf",
        brackets: all([[0, 0], [10000, 4]]),
        standardDeduction: by(2300, 4600, 3400),
        exemption: by(6000, 12000, 8000),
        rules: [
          { kind: "bracketsPerEarner" },
        ],
      },
    },
  },
  MT: {
    indexed: { brackets: true, amounts: true, thresholds: false },
    scheduledBrackets: {
      2027: by([[0, 4.7], [65000, 5.4]], [[0, 4.7], [130000, 5.4]], [[0, 4.7], [97500, 5.4]]),
    },
    years: {
      2025: {
        source: "https://revenuefiles.mt.gov/files/forms/Montana-Individual-Income-Tax-Return-Form-2-Instructions/2025_Montana_Individual_Income_Tax_Return_Form_2_Instructions.pdf",
        brackets: by([[0, 4.7], [21100, 5.9]], [[0, 4.7], [42200, 5.9]], [[0, 4.7], [31700, 5.9]]),
        standardDeduction: by(15750, 31500, 23625),
      },
      2026: {
        source: "https://revenuefiles.mt.gov/files/forms/Montana-Individual-Income-Tax-Return-Form-2-Instructions/2025_Montana_Individual_Income_Tax_Return_Form_2_Instructions.pdf",
        brackets: by([[0, 4.7], [47500, 5.65]], [[0, 4.7], [95000, 5.65]], [[0, 4.7], [71250, 5.65]]),
        standardDeduction: by(16100, 32200, 24150),
      },
    },
  },
  NC: {
    indexed: false,
    years: {
      2025: {
        source: "https://www.ncdor.gov/taxes-forms/tax-rate-schedules",
        brackets: all([[0, 4.25]]),
        standardDeduction: by(12750, 25500, 19125),
      },
      2026: {
        source: "https://www.ncdor.gov/taxes-forms/tax-rate-schedules",
        brackets: all([[0, 3.99]]),
        standardDeduction: by(12750, 25500, 19125),
      },
    },
  },
  ND: {
    indexed: { brackets: true, amounts: true, thresholds: false },
    years: {
      2025: {
        source: "https://www.tax.nd.gov/sites/www/files/documents/forms/individual/2025-iit/2025-individual-income-tax-booklet.pdf",
        brackets: by([[0, 0], [48475, 1.95], [244825, 2.5]], [[0, 0], [80975, 1.95], [298075, 2.5]], [[0, 0], [64950, 1.95], [271450, 2.5]], [[0, 0], [40475, 1.95], [149025, 2.5]]),
        standardDeduction: by(15750, 31500, 23625),
        rules: [
          { kind: "twoEarnerFlatCredit", amount: 312, minTaxable: 81036, minLesserWages: 47550 },
        ],
      },
      2026: {
        source: "https://www.tax.nd.gov/sites/www/files/documents/forms/individual/2025-iit/28709-form-nd-1es-2026.pdf",
        estimated: "the marriage penalty credit's maximum ($319) and thresholds are worked out from the 2026 brackets",
        brackets: by([[0, 0], [49575, 1.95], [250400, 2.5]], [[0, 0], [82800, 1.95], [304850, 2.5]], [[0, 0], [66400, 1.95], [277600, 2.5]], [[0, 0], [41400, 1.95], [152425, 2.5]]),
        standardDeduction: by(16100, 32200, 24150),
        rules: [
          { kind: "twoEarnerFlatCredit", amount: 319, minTaxable: 82862, minLesserWages: 48622 },
        ],
      },
    },
  },
  NE: {
    indexed: { brackets: true, amounts: true, thresholds: false },
    scheduledRates: {
      2027: all([2.46, 3.51, 3.99, 3.99]),
    },
    years: {
      2025: {
        source: "https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2025/2025_Tax_Calculation_Schedule.pdf",
        brackets: by([[0, 2.46], [4030, 3.51], [24120, 5.01], [38870, 5.2]], [[0, 2.46], [8040, 3.51], [48250, 5.01], [77730, 5.2]], [[0, 2.46], [7510, 3.51], [38590, 5.01], [57630, 5.2]]),
        standardDeduction: by(8600, 17200, 12600),
        credit: by(171, 342),
      },
      2026: {
        source: "https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2025/f_1040N-ES.pdf",
        brackets: by([[0, 2.46], [4130, 3.51], [24760, 4.55], [39900, 4.55]], [[0, 2.46], [8250, 3.51], [49530, 4.55], [79800, 4.55]], [[0, 2.46], [7700, 3.51], [39620, 4.55], [59160, 4.55]]),
        standardDeduction: by(8850, 17700, 12950),
        credit: by(176, 352),
      },
    },
  },
  NH: null, // no income tax on wages
  NJ: {
    indexed: false,
    years: {
      2025: {
        source: "https://www.nj.gov/treasury/taxation/pdf/current/1040i.pdf",
        brackets: by([[0, 1.4], [20000, 1.75], [35000, 3.5], [40000, 5.525], [75000, 6.37], [500000, 8.97], [1000000, 10.75]], [[0, 1.4], [20000, 1.75], [50000, 2.45], [70000, 3.5], [80000, 5.525], [150000, 6.37], [500000, 8.97], [1000000, 10.75]], [[0, 1.4], [20000, 1.75], [50000, 2.45], [70000, 3.5], [80000, 5.525], [150000, 6.37], [500000, 8.97], [1000000, 10.75]]),
        exemption: by(1000, 2000),
        rules: [
          { kind: "noTaxAtOrBelow", income: by(10000, 20000, 20000) },
        ],
      },
      2026: {
        source: "https://www.nj.gov/treasury/taxation/taxtables.shtml",
        brackets: by([[0, 1.4], [20000, 1.75], [35000, 3.5], [40000, 5.525], [75000, 6.37], [500000, 8.97], [1000000, 10.75]], [[0, 1.4], [20000, 1.75], [50000, 2.45], [70000, 3.5], [80000, 5.525], [150000, 6.37], [500000, 8.97], [1000000, 10.75]], [[0, 1.4], [20000, 1.75], [50000, 2.45], [70000, 3.5], [80000, 5.525], [150000, 6.37], [500000, 8.97], [1000000, 10.75]]),
        exemption: by(1000, 2000),
        rules: [
          { kind: "noTaxAtOrBelow", income: by(10000, 20000, 20000) },
        ],
      },
    },
  },
  NM: {
    indexed: { brackets: false, amounts: true, thresholds: false },
    years: {
      2025: {
        source: "https://taxsim.nber.org/historical_state_tax_forms/NM/2025/PIT%20rates_2005_2025.pdf",
        brackets: by([[0, 1.5], [5500, 3.2], [16500, 4.3], [33500, 4.7], [66500, 4.9], [210000, 5.9]], [[0, 1.5], [8000, 3.2], [25000, 4.3], [50000, 4.7], [100000, 4.9], [315000, 5.9]], [[0, 1.5], [8000, 3.2], [25000, 4.3], [50000, 4.7], [100000, 4.9], [315000, 5.9]], [[0, 1.5], [4000, 3.2], [12500, 4.3], [25000, 4.7], [50000, 4.9], [157500, 5.9]]),
        standardDeduction: by(15750, 31500, 23625),
        exemption: by(2500, 5000),
        exemptionPhaseDown: { from: by(20000, 30000, 30000, 15000), to: by(36667, 55000, 55000, 27500) },
      },
      2026: {
        source: "https://taxsim.nber.org/historical_state_tax_forms/NM/2025/PIT%20rates_2005_2025.pdf",
        brackets: by([[0, 1.5], [5500, 3.2], [16500, 4.3], [33500, 4.7], [66500, 4.9], [210000, 5.9]], [[0, 1.5], [8000, 3.2], [25000, 4.3], [50000, 4.7], [100000, 4.9], [315000, 5.9]], [[0, 1.5], [8000, 3.2], [25000, 4.3], [50000, 4.7], [100000, 4.9], [315000, 5.9]], [[0, 1.5], [4000, 3.2], [12500, 4.3], [25000, 4.7], [50000, 4.9], [157500, 5.9]]),
        standardDeduction: by(16100, 32200, 24150),
        exemption: by(2500, 5000),
        exemptionPhaseDown: { from: by(20000, 30000, 30000, 15000), to: by(36667, 55000, 55000, 27500) },
      },
    },
  },
  NV: null, // no income tax on wages
  NY: {
    indexed: false,
    localNote: "New York City residents also pay 3.078% to 3.876% of taxable income, and Yonkers residents 16.75% of their state tax.",
    years: {
      2025: {
        source: "https://www.tax.ny.gov/pdf/2025/inc/it201i_2025.pdf (IT-201-I 2025: rate schedule p.33, tax computation worksheets 1-16 pp.34-39, standard deduction table p.11, household credit tables p.12-13, NYC rate schedule p.40, NYC school tax credits p.20-21, Yonkers worksheet p.17)",
        brackets: by([[0, 4, 0], [8500, 4.5, 340], [11700, 5.25, 484], [13900, 5.5, 600], [80650, 6, 4271], [215400, 6.85, 12356], [1077550, 9.65, 71413], [5000000, 10.3, 449929], [25000000, 10.9, 2509929]], [[0, 4, 0], [17150, 4.5, 686], [23600, 5.25, 976], [27900, 5.5, 1202], [161550, 6, 8553], [323200, 6.85, 18252], [2155350, 9.65, 143754], [5000000, 10.3, 418263], [25000000, 10.9, 2478263]], [[0, 4, 0], [12800, 4.5, 512], [17650, 5.25, 730], [20900, 5.5, 901], [107650, 6, 5672], [269300, 6.85, 15371], [1616450, 9.65, 107651], [5000000, 10.3, 434163], [25000000, 10.9, 2494163]]),
        standardDeduction: by(8000, 16050, 11200),
        credit: by(75, 105, 90, 53),
        creditPhaseDown: { bands: by([[5000, 75], [6000, 60], [7000, 50], [20000, 45], [25000, 40], [28000, 20], [Infinity, 0]], [[5000, 105], [6000, 90], [7000, 80], [20000, 75], [22000, 70], [25000, 60], [28000, 45], [32000, 25], [Infinity, 0]], [[5000, 90], [6000, 75], [7000, 65], [20000, 60], [22000, 60], [25000, 50], [28000, 40], [32000, 20], [Infinity, 0]], [[5000, 53], [6000, 45], [7000, 40], [20000, 38], [22000, 35], [25000, 30], [28000, 23], [32000, 13], [Infinity, 0]]) },
        rules: [
          { kind: "newYorkSupplementalTax", tiers: by({ first: { upTo: 215400, rate: 6 }, tiers: [{ over: 215400, incomeBase: 215400, base: 568, benefit: 1831 }, { over: 1077550, incomeBase: 1077550, base: 2399, benefit: 30172 }, { over: 5000000, incomeBase: 5000000, base: 32571, benefit: 32500 }] }, { first: { upTo: 161550, rate: 5.5 }, tiers: [{ over: 161550, incomeBase: 161550, base: 333, benefit: 807 }, { over: 323200, incomeBase: 323200, base: 1140, benefit: 2747 }, { over: 2155350, incomeBase: 2155350, base: 3887, benefit: 60350 }, { over: 5000000, incomeBase: 5000000, base: 64237, benefit: 32500 }] }, { first: { upTo: 269300, rate: 6 }, tiers: [{ over: 269300, incomeBase: 269300, base: 787, benefit: 2289 }, { over: 1616450, incomeBase: 1616450, base: 3076, benefit: 45261 }, { over: 5000000, incomeBase: 5000000, base: 48337, benefit: 32500 }] }) },
        ],
      },
      2026: {
        source: "https://www.tax.ny.gov/pdf/2026/inc/it2105i_2026.pdf (IT-2105-I 2026, official: 2026 NYS tax rates p.10, 2026 tax computation worksheets 1-16 pp.3-7, 2026 standard deduction table p.2, NYC 2026 rates p.10, NYC school tax credits p.8, Yonkers 16.75% p.8)",
        brackets: by([[0, 3.9, 0], [8500, 4.4, 332], [11700, 5.15, 473], [13900, 5.4, 586], [80650, 5.9, 4191], [215400, 6.85, 12141], [1077550, 9.65, 71198], [5000000, 10.3, 449714], [25000000, 10.9, 2509714]], [[0, 3.9, 0], [17150, 4.4, 669], [23600, 5.15, 953], [27900, 5.4, 1174], [161550, 5.9, 8391], [323200, 6.85, 17928], [2155350, 9.65, 143430], [5000000, 10.3, 417939], [25000000, 10.9, 2477939]], [[0, 3.9, 0], [12800, 4.4, 499], [17650, 5.15, 712], [20900, 5.4, 879], [107650, 5.9, 5564], [269300, 6.85, 15101], [1616450, 9.65, 107381], [5000000, 10.3, 433894], [25000000, 10.9, 2493894]]),
        standardDeduction: by(8000, 16050, 11200),
        credit: by(75, 105, 90, 53),
        creditPhaseDown: { bands: by([[5000, 75], [6000, 60], [7000, 50], [20000, 45], [25000, 40], [28000, 20], [Infinity, 0]], [[5000, 105], [6000, 90], [7000, 80], [20000, 75], [22000, 70], [25000, 60], [28000, 45], [32000, 25], [Infinity, 0]], [[5000, 90], [6000, 75], [7000, 65], [20000, 60], [22000, 60], [25000, 50], [28000, 40], [32000, 20], [Infinity, 0]], [[5000, 53], [6000, 45], [7000, 40], [20000, 38], [22000, 35], [25000, 30], [28000, 23], [32000, 13], [Infinity, 0]]) },
        rules: [
          { kind: "newYorkSupplementalTax", tiers: by({ first: { upTo: 215400, rate: 5.9 }, tiers: [{ over: 215400, incomeBase: 215400, base: 567, benefit: 2047 }, { over: 1077550, incomeBase: 1077550, base: 2614, benefit: 30172 }, { over: 5000000, incomeBase: 5000000, base: 32786, benefit: 32500 }] }, { first: { upTo: 161550, rate: 5.4 }, tiers: [{ over: 161550, incomeBase: 161550, base: 333, benefit: 807 }, { over: 323200, incomeBase: 323200, base: 1140, benefit: 3071 }, { over: 2155350, incomeBase: 2155350, base: 4211, benefit: 60350 }, { over: 5000000, incomeBase: 5000000, base: 64561, benefit: 32500 }] }, { first: { upTo: 269300, rate: 5.9 }, tiers: [{ over: 269300, incomeBase: 269300, base: 787, benefit: 2559 }, { over: 1616450, incomeBase: 1616450, base: 3346, benefit: 45260 }, { over: 5000000, incomeBase: 5000000, base: 48606, benefit: 32500 }] }) },
        ],
      },
      2027: {
        source: "Tax Law 601 (viii) rate tables and 601(d-6) supplemental tax, 2027-2032 (L.2025 ch.59 Part B)",
        brackets: by([[0, 3.8, 0], [8500, 4.3, 323], [11700, 5.05, 461], [13900, 5.3, 572], [80650, 5.8, 4110], [215400, 6.85, 11926], [1077550, 9.65, 70983], [5000000, 10.3, 449499], [25000000, 10.9, 2509499]], [[0, 3.8, 0], [17150, 4.3, 652], [23600, 5.05, 929], [27900, 5.3, 1146], [161550, 5.8, 8229], [323200, 6.85, 17605], [2155350, 9.65, 143107], [5000000, 10.3, 417616], [25000000, 10.9, 2477616]], [[0, 3.8, 0], [12800, 4.3, 486], [17650, 5.05, 695], [20900, 5.3, 859], [107650, 5.8, 5457], [269300, 6.85, 14833], [1616450, 9.65, 107113], [5000000, 10.3, 433626], [25000000, 10.9, 2493626]]),
        standardDeduction: by(8000, 16050, 11200),
        credit: by(75, 105, 90, 53),
        creditPhaseDown: { bands: by([[5000, 75], [6000, 60], [7000, 50], [20000, 45], [25000, 40], [28000, 20], [Infinity, 0]], [[5000, 105], [6000, 90], [7000, 80], [20000, 75], [22000, 70], [25000, 60], [28000, 45], [32000, 25], [Infinity, 0]], [[5000, 90], [6000, 75], [7000, 65], [20000, 60], [22000, 60], [25000, 50], [28000, 40], [32000, 20], [Infinity, 0]], [[5000, 53], [6000, 45], [7000, 40], [20000, 38], [22000, 35], [25000, 30], [28000, 23], [32000, 13], [Infinity, 0]]) },
        rules: [
          { kind: "newYorkSupplementalTax", tiers: by({ first: { upTo: 215400, rate: 5.8 }, tiers: [{ over: 215400, incomeBase: 215400, base: 568, benefit: 2261 }, { over: 1077550, incomeBase: 1077550, base: 2829, benefit: 30172 }, { over: 5000000, incomeBase: 5000000, base: 33001, benefit: 32500 }] }, { first: { upTo: 161550, rate: 5.3 }, tiers: [{ over: 161550, incomeBase: 161550, base: 333, benefit: 808 }, { over: 323200, incomeBase: 323200, base: 1141, benefit: 3393 }, { over: 2155350, incomeBase: 2155350, base: 4534, benefit: 60350 }, { over: 5000000, incomeBase: 5000000, base: 64884, benefit: 32500 }] }, { first: { upTo: 269300, rate: 5.8 }, tiers: [{ over: 269300, incomeBase: 269300, base: 787, benefit: 2827 }, { over: 1616450, incomeBase: 1616450, base: 3614, benefit: 45260 }, { over: 5000000, incomeBase: 5000000, base: 48874, benefit: 32500 }] }) },
        ],
      },
    },
  },
  OH: {
    indexed: { brackets: true, amounts: true, thresholds: false },
    localNote: "Most Ohio cities and villages levy an income tax too, typically 2% (Columbus and Cleveland 2.5%, Cincinnati 1.8%), and some school districts add their own.",
    years: {
      2025: {
        source: "https://dam.assets.ohio.gov/image/upload/v1767095693/tax.ohio.gov/forms/ohio_individual/individual/2025/it1040-booklet.pdf",
        brackets: all([[0, 0], [26050, 2.75, 342], [100000, 3.125, 2394.32]]),
        exemption: by(2400, 4800),
        exemptionPhaseDown: { bands: by([[40000, 2400], [80000, 2150], [749999.99, 1900], [Infinity, 0]], [[40000, 4800], [80000, 4300], [749999.99, 3800], [Infinity, 0]]) },
        credit: by(20, 40),
        creditPhaseDown: { bands: by([[32399.99, 20], [Infinity, 0]], [[34799.99, 40], [Infinity, 0]]) },
        rules: [
          { kind: "percentCredit", bands: all([[25000, 20], [50000, 15], [75000, 10], [Infinity, 5]]), basis: "agiLessExemptions", cap: 650, maxIncome: 750000, twoEarners: true },
        ],
      },
      2026: {
        source: "https://codes.ohio.gov/ohio-revised-code/section-5747.02",
        brackets: all([[0, 0], [26050, 2.75, 332]]),
        exemption: by(2400, 4800),
        exemptionPhaseDown: { bands: by([[40000, 2400], [80000, 2150], [499999.99, 1900], [Infinity, 0]], [[40000, 4800], [80000, 4300], [499999.99, 3800], [Infinity, 0]]) },
        credit: by(20, 40),
        creditPhaseDown: { bands: by([[32399.99, 20], [Infinity, 0]], [[34799.99, 40], [Infinity, 0]]) },
        rules: [
          { kind: "percentCredit", bands: all([[25000, 20], [50000, 15], [75000, 10], [Infinity, 5]]), basis: "agiLessExemptions", cap: 650, maxIncome: 500000, twoEarners: true },
        ],
      },
    },
  },
  OK: {
    indexed: false,
    years: {
      2025: {
        source: "https://oklahoma.gov/content/dam/ok/en/tax/documents/forms/individuals/current/511-Pkt.pdf",
        brackets: by([[0, 0.25], [1000, 0.75], [2500, 1.75], [3750, 2.75], [4900, 3.75], [7200, 4.75]], [[0, 0.25], [2000, 0.75], [5000, 1.75], [7500, 2.75], [9800, 3.75], [14400, 4.75]], [[0, 0.25], [2000, 0.75], [5000, 1.75], [7500, 2.75], [9800, 3.75], [14400, 4.75]]),
        standardDeduction: by(6350, 12700, 9350),
        exemption: by(1000, 2000),
      },
      2026: {
        source: "https://www.oscn.net/applications/oscn/DeliverDocument.asp?CiteID=92565",
        brackets: by([[0, 0], [3750, 2.5], [4900, 3.5], [7200, 4.5]], [[0, 0], [7500, 2.5], [9800, 3.5], [14400, 4.5]], [[0, 0], [7500, 2.5], [9800, 3.5], [14400, 4.5]]),
        standardDeduction: by(6350, 12700, 9350),
        exemption: by(1000, 2000),
      },
    },
  },
  OR: {
    indexed: { brackets: true, amounts: true, thresholds: false },
    localNote: "Portland-area residents also pay Metro's 1% supportive housing tax above $128,000 of taxable income ($205,000 joint), and Multnomah County residents a 1.5% preschool tax above $125,000 ($200,000 joint), 3% above $250,000 ($400,000).",
    years: {
      2025: {
        source: "https://www.oregon.gov/dor/forms/FormsPubs/form-or-40-inst_101-040-1_2025.pdf",
        brackets: by([[0, 4.75, 0], [4400, 6.75, 209], [11100, 8.75, 661], [125000, 9.9, 10627]], [[0, 4.75, 0], [8800, 6.75, 418], [22200, 8.75, 1323], [250000, 9.9, 21256]], [[0, 4.75, 0], [8800, 6.75, 418], [22200, 8.75, 1323], [250000, 9.9, 21256]]),
        standardDeduction: by(2835, 5670, 4560),
        credit: by(256, 512),
        creditPhaseDown: { bands: by([[100000, 256], [Infinity, 0]], [[200000, 512], [Infinity, 0]], [[200000, 256], [Infinity, 0]]) },
        rules: [
          { kind: "federalTaxDeduction", share: 100, capBands: by([[124999.99, 8500], [129999.99, 6800], [134999.99, 5100], [139999.99, 3400], [144999.99, 1700], [Infinity, 0]], [[249999.99, 8500], [259999.99, 6800], [269999.99, 5100], [279999.99, 3400], [289999.99, 1700], [Infinity, 0]], [[249999.99, 8500], [259999.99, 6800], [269999.99, 5100], [279999.99, 3400], [289999.99, 1700], [Infinity, 0]], [[124999.99, 4250], [129999.99, 3400], [134999.99, 2550], [139999.99, 1700], [144999.99, 850], [Infinity, 0]]) },
        ],
      },
      2026: {
        source: "https://www.oregon.gov/dor/forms/FormsPubs/withholding-tax-formulas_206-436_2026.pdf",
        estimated: "the head-of-household standard deduction ($4,685) comes from the statutory formula; Oregon has published the other amounts",
        brackets: by([[0, 4.75, 0], [4550, 6.75, 216], [11400, 8.75, 678], [125000, 9.9, 10618]], [[0, 4.75, 0], [9100, 6.75, 432], [22800, 8.75, 1357], [250000, 9.9, 21237]], [[0, 4.75, 0], [9100, 6.75, 432], [22800, 8.75, 1357], [250000, 9.9, 21237]]),
        standardDeduction: by(2910, 5820, 4685),
        credit: by(263, 526),
        creditPhaseDown: { bands: by([[100000, 263], [Infinity, 0]], [[200000, 526], [Infinity, 0]], [[200000, 263], [Infinity, 0]]) },
        rules: [
          { kind: "federalTaxDeduction", share: 100, capBands: by([[124999.99, 8750], [129999.99, 7000], [134999.99, 5250], [139999.99, 3500], [144999.99, 1750], [Infinity, 0]], [[249999.99, 8750], [259999.99, 7000], [269999.99, 5250], [279999.99, 3500], [289999.99, 1750], [Infinity, 0]], [[249999.99, 8750], [259999.99, 7000], [269999.99, 5250], [279999.99, 3500], [289999.99, 1750], [Infinity, 0]], [[124999.99, 4375], [129999.99, 3500], [134999.99, 2625], [139999.99, 1750], [144999.99, 875], [Infinity, 0]]) },
        ],
      },
    },
  },
  PA: {
    indexed: false,
    local: { rate: 1, note: "the 1% local earned income tax that almost every Pennsylvania municipality and school district levies together (Philadelphia charges 3.74%, Pittsburgh 3%)" },
    years: {
      2025: {
        source: "https://www.pa.gov/content/dam/copapwp-pagov/en/revenue/documents/formsandpublications/formsforindividuals/pit/documents/2025/2025_pa-40in.pdf",
        brackets: all([[0, 3.07]]),
      },
      2026: {
        source: "https://www.pa.gov/content/dam/copapwp-pagov/en/revenue/documents/formsandpublications/formsforindividuals/pit/documents/2026/2026_rev-414i.pdf",
        brackets: all([[0, 3.07]]),
      },
    },
  },
  RI: {
    indexed: true,
    scheduledSurtax: {
      2027: { rate: 1, over: all(1000000) },
      2028: { rate: 2, over: all(1000000) },
      2029: { rate: 3, over: all(1000000) },
    },
    years: {
      2025: {
        source: "https://tax.ri.gov/sites/g/files/xkgbur541/files/2024-10/ADV_2024_26_Inflation_Adjustments.pdf",
        brackets: all([[0, 3.75], [79900, 4.75], [181650, 5.99]]),
        standardDeduction: by(10900, 21800, 16350),
        standardDeductionPhaseDown: { from: all(254250), to: all(290500), step: 7250 },
        exemption: by(5100, 10200),
        exemptionPhaseDown: { from: all(254250), to: all(290500), step: 7250 },
      },
      2026: {
        source: "https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-11/ADV_2025_22_Inflation_Adjustments.pdf",
        brackets: all([[0, 3.75], [82050, 4.75], [186450, 5.99]]),
        standardDeduction: by(11200, 22400, 16800),
        standardDeductionPhaseDown: { from: all(261000), to: all(298250), step: 7450 },
        exemption: by(5250, 10500),
        exemptionPhaseDown: { from: all(261000), to: all(298250), step: 7450 },
      },
    },
  },
  SC: {
    indexed: { brackets: true, amounts: false, thresholds: false },
    years: {
      2025: {
        source: "https://dor.sc.gov/sites/dor/files/forms/SC1040Instr_2025.pdf",
        brackets: all([[0, 0], [3560, 3], [17830, 6]]),
        standardDeduction: by(15000, 30000, 22500),
      },
      2026: {
        source: "https://dor.sc.gov/sites/dor/files/policies/IL26-20.pdf",
        brackets: all([[0, 1.99], [30000, 5.21]]),
        standardDeduction: by(15000, 30000, 22500),
        standardDeductionPhaseDown: { from: by(40000, 80000, 60000), to: by(95000, 190000, 142500) },
      },
    },
  },
  SD: null, // no income tax on wages
  TN: null, // no income tax on wages
  TX: null, // no income tax on wages
  UT: {
    indexed: { brackets: false, amounts: true, thresholds: true },
    years: {
      2025: {
        source: "https://tax.utah.gov/forms/current/tc-40inst.pdf",
        brackets: all([[0, 4.5]]),
        credit: by(945, 1890, 1417.5),
        creditPhaseDown: { from: by(18213, 36426, 27320), to: by(90905.31, 181810.62, 136358.46) },
      },
      2026: {
        source: "https://le.utah.gov/Session/2026/bills/enrolled/SB0060.pdf",
        estimated: "the taxpayer credit's phase-out bases come from the 2026 withholding tables (Pub 14), the head-of-household one scaled from 2025",
        brackets: all([[0, 4.45]]),
        credit: by(966, 1932, 1449),
        creditPhaseDown: { from: by(18696, 37392, 28045), to: by(93003.69, 186007.38, 139506.54) },
      },
    },
  },
  VA: {
    indexed: false,
    years: {
      2025: {
        source: "https://www.tax.virginia.gov/sites/default/files/vatax-pdf/2025-760-instructions.pdf",
        brackets: all([[0, 2], [3000, 3], [5000, 5], [17000, 5.75]]),
        standardDeduction: by(8750, 17500),
        exemption: by(930, 1860),
        rules: [
          { kind: "virginiaSpouseTaxAdjustment", max: 259 },
        ],
      },
      2026: {
        source: "https://www.tax.virginia.gov/sites/default/files/vatax-pdf/2025-760-instructions.pdf",
        brackets: all([[0, 2], [3000, 3], [5000, 5], [17000, 5.75]]),
        standardDeduction: by(8750, 17500),
        exemption: by(930, 1860),
        rules: [
          { kind: "virginiaSpouseTaxAdjustment", max: 259 },
        ],
      },
      2027: {
        source: "Va. Code 58.1-322.03 as amended by the 2026 Appropriation Act (HB 30, 2026 Sp. Sess. I, ch. 1)",
        brackets: all([[0, 2], [3000, 3], [5000, 5], [17000, 5.75]]),
        standardDeduction: by(9200, 18400),
        exemption: by(930, 1860),
        rules: [
          { kind: "virginiaSpouseTaxAdjustment", max: 259 },
        ],
      },
      2028: {
        source: "Va. Code 58.1-322.03 as amended by the 2026 Appropriation Act (HB 30, 2026 Sp. Sess. I, ch. 1)",
        brackets: all([[0, 2], [3000, 3], [5000, 5], [17000, 5.75]]),
        standardDeduction: by(9300, 18600),
        exemption: by(930, 1860),
        rules: [
          { kind: "virginiaSpouseTaxAdjustment", max: 259 },
        ],
      },
      2030: {
        source: "Va. Code 58.1-322.03 as amended by the 2026 Appropriation Act (HB 30, 2026 Sp. Sess. I, ch. 1)",
        brackets: all([[0, 2], [3000, 3], [5000, 5], [17000, 5.75]]),
        standardDeduction: by(3000, 6000),
        exemption: by(930, 1860),
        rules: [
          { kind: "virginiaSpouseTaxAdjustment", max: 259 },
        ],
      },
    },
  },
  VT: {
    indexed: { brackets: true, amounts: true, thresholds: false },
    years: {
      2025: {
        source: "https://tax.vermont.gov/sites/tax/files/documents/TaxRateSched-2025.pdf",
        brackets: by([[0, 3.35], [49400, 6.6], [119700, 7.6], [249700, 8.75]], [[0, 3.35], [82500, 6.6], [199450, 7.6], [304000, 8.75]], [[0, 3.35], [66200, 6.6], [171000, 7.6], [276850, 8.75]], [[0, 3.35], [41250, 6.6], [99725, 7.6], [152000, 8.75]]),
        standardDeduction: by(7650, 15300, 11450),
        exemption: by(5300, 10600),
      },
      2026: {
        source: "https://tax.vermont.gov/sites/tax/files/documents/IN-114-Instr-2026.pdf",
        estimated: "the standard deduction and exemption are inferred from the 2026 withholding tables (GB-1210-2026); the 2026 IN-111 instructions will publish them",
        brackets: by([[0, 3.35], [50750, 6.6], [122850, 7.6], [256300, 8.75]], [[0, 3.35], [84700, 6.6], [204750, 7.6], [312050, 8.75]], [[0, 3.35], [68000, 6.6], [175500, 7.6], [284150, 8.75]], [[0, 3.35], [42350, 6.6], [102375, 7.6], [156025, 8.75]]),
        standardDeduction: by(7850, 15700, 11775),
        exemption: by(5400, 10800),
      },
    },
  },
  WA: null, // no income tax on wages
  WI: {
    indexed: true,
    years: {
      2025: {
        source: "https://www.revenue.wi.gov/TaxForms2025/2025-Form1-Inst.pdf",
        brackets: by([[0, 3.5], [14680, 4.4], [50480, 5.3], [323290, 7.65]], [[0, 3.5], [19580, 4.4], [67300, 5.3], [431060, 7.65]], [[0, 3.5], [14680, 4.4], [50480, 5.3], [323290, 7.65]], [[0, 3.5], [9790, 4.4], [33650, 5.3], [215530, 7.65]]),
        standardDeduction: by(13560, 25110, 17520, 11930),
        standardDeductionPhaseDown: { points: by([[19550, 13560], [132550, 0]], [[28210, 25110], [155169.25, 0]], [[19550, 17520], [57210.49, 9040.74], [132550, 0]], [[13390, 11930], [73709.55, 0]]) },
        exemption: by(700, 1400),
        rules: [
          { kind: "twoEarnerCredit", rate: 3, maxWages: 16000 },
        ],
      },
      2026: {
        source: "https://www.revenue.wi.gov/TaxForms2026/2026-Form1-ES-Inst.pdf",
        brackets: by([[0, 3.5], [15110, 4.4], [51950, 5.3], [332720, 7.65]], [[0, 3.5], [20150, 4.4], [69260, 5.3], [443630, 7.65]], [[0, 3.5], [15110, 4.4], [51950, 5.3], [332720, 7.65]], [[0, 3.5], [10080, 4.4], [34630, 5.3], [221820, 7.65]]),
        standardDeduction: by(13960, 25840, 18030, 12280),
        standardDeductionPhaseDown: { points: by([[20120, 13960], [136453.33, 0]], [[29040, 25840], [159690.22, 0]], [[20120, 18030], [58826.61, 9315.21], [136453.33, 0]], [[13780, 12280], [75869.19, 0]]) },
        exemption: by(700, 1400),
        rules: [
          { kind: "twoEarnerCredit", rate: 3, maxWages: 16000 },
        ],
      },
    },
  },
  WV: {
    indexed: false,
    years: {
      2025: {
        source: "https://tax.wv.gov/Documents/PIT/2025/it140.TaxRateSchedules.2025.pdf",
        brackets: by([[0, 2.22], [10000, 2.96], [25000, 3.33], [40000, 4.44], [60000, 4.82]], [[0, 2.22], [10000, 2.96], [25000, 3.33], [40000, 4.44], [60000, 4.82]], [[0, 2.22], [10000, 2.96], [25000, 3.33], [40000, 4.44], [60000, 4.82]], [[0, 2.22], [5000, 2.96], [12500, 3.33], [20000, 4.44], [30000, 4.82]]),
        exemption: by(2000, 4000),
      },
      2026: {
        source: "https://tax.wv.gov/Individuals/Pages/PersonalIncomeTaxReductionBill.aspx",
        brackets: by([[0, 2.11], [10000, 2.81], [25000, 3.16], [40000, 4.22], [60000, 4.58]], [[0, 2.11], [10000, 2.81], [25000, 3.16], [40000, 4.22], [60000, 4.58]], [[0, 2.11], [10000, 2.81], [25000, 3.16], [40000, 4.22], [60000, 4.58]], [[0, 2.11], [5000, 2.81], [12500, 3.16], [20000, 4.22], [30000, 4.58]]),
        exemption: by(2000, 4000),
      },
    },
  },
  WY: null, // no income tax on wages
};
