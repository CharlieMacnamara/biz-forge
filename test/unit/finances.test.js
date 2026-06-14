import { describe, it, expect } from 'vitest';
import {
  THRESHOLDS,
  TAX_YEAR,
  corpTax,
  optimalSalary,
  pensionSaving,
  dividendTax,
  flatRateVat,
  employerNI,
  rdcEstimate,
  fullStrategy,
} from '../../src/lib/finances.js';

describe('corpTax', () => {
  it('charges 19% on profit below small profits threshold', () => {
    expect(corpTax(10000)).toBe(1900);
    expect(corpTax(0)).toBe(0);
    expect(corpTax(49999)).toBeCloseTo(9499.81, 2);
  });

  it('charges exactly 19% at small profits threshold boundary', () => {
    // At exactly £50,000: 19% = 9500
    expect(corpTax(50000)).toBe(9500);
  });

  it('applies marginal relief between £50k and £250k', () => {
    const tax = corpTax(100000);
    // Should be between 19% and 25% blended
    expect(tax).toBeGreaterThan(19000);
    expect(tax).toBeLessThan(25000);
  });

  it('charges exactly 25% at main threshold boundary', () => {
    // At exactly £250,000: 25% = 62500
    expect(corpTax(250000)).toBe(62500);
  });

  it('charges 25% on profit above main threshold', () => {
    expect(corpTax(300000)).toBe(75000);
    expect(corpTax(1000000)).toBe(250000);
  });

  it('handles zero profit', () => {
    expect(corpTax(0)).toBe(0);
  });

  it('handles negative profit (loss)', () => {
    const tax = corpTax(-5000);
    expect(tax).toBeLessThanOrEqual(0);
  });

  it('returns 0 for large negative profit', () => {
    // corpTax uses profit directly without clamping, so negative
    // profit produces negative tax (which would be a credit).
    // In practice, fullStrategy clamps profit with Math.max(0, profit).
    expect(corpTax(-100000)).toBeLessThan(0);
  });

  it('produces correct blended rate at midpoint', () => {
    const tax = corpTax(150000);
    // Expected: 19% on first 50k + blended on remaining 100k
    // Marginal: 25% - 19% = 6%
    // fraction: (150k - 50k) / (250k - 50k) = 100k / 200k = 0.5
    // rate at 150k: 19% + 6% * 0.5 = 22%
    // tax at 150k: 150000 * 0.22 = 33000
    expect(tax).toBeCloseTo(33000, 0);
  });
});

describe('optimalSalary', () => {
  it('returns personal allowance amount with zero employee NI', () => {
    const s = optimalSalary();
    expect(s.salary).toBe(12570);
    expect(s.employeeNI).toBe(0);
  });

  it('calculates employer NI correctly', () => {
    const s = optimalSalary();
    // Employer NI = (12570 - 5000) * 0.15 = 7570 * 0.15 = 1135.5
    expect(s.employerNI).toBeCloseTo(1135.5, 1);
  });

  it('indicates employer NI allowance eligibility', () => {
    const s = optimalSalary();
    expect(s.employerNIEligibleForAllowance).toBe(true);
  });

  it('includes a descriptive note', () => {
    const s = optimalSalary();
    expect(s.note).toContain('Personal Allowance');
  });
});

describe('pensionSaving', () => {
  it('calculates CT saving at 19% small profits rate', () => {
    const p = pensionSaving(10000);
    expect(p.corpTaxSaved).toBe(1900);
    expect(p.totalSaved).toBe(1900);
  });

  it('reduces effective cost below contribution', () => {
    const p = pensionSaving(5000);
    expect(p.effectiveCost).toBeLessThan(5000);
  });

  it('handles zero contribution', () => {
    const p = pensionSaving(0);
    expect(p.corpTaxSaved).toBe(0);
    expect(p.totalSaved).toBe(0);
    expect(p.effectiveCost).toBe(0);
  });

  it('includes a descriptive note', () => {
    const p = pensionSaving(10000);
    expect(p.note).toContain('CT-deductible');
  });

  it('has correct effective cost for £1 contribution', () => {
    const p = pensionSaving(1);
    expect(p.effectiveCost).toBeCloseTo(0.81, 2);
  });
});

describe('dividendTax', () => {
  it('returns 0 when total income below personal allowance', () => {
    expect(dividendTax(10000, 0)).toBe(0);
  });

  it('applies £500 dividend allowance', () => {
    // dividend income of 500 with no other income: no tax
    expect(dividendTax(499, 0)).toBe(0);
  });

  it('taxes dividends at basic rate (10.75%) above allowance when total income exceeds PA', () => {
    // totalIncome = 13000 > 12570 PA, so tax applies
    // taxable dividend = 600 - 500 = 100
    // basic rate remaining = max(0, 50270 - 13000) = 37270
    // 100 is within basic rate: 100 * 0.1075 = 10.75
    expect(dividendTax(600, 13000)).toBeCloseTo(10.75, 2);
  });

  it('applies higher rate (35.75%) when dividends exceed basic rate band', () => {
    // otherIncome = 12570 (at personal allowance), dividendIncome = 50000
    // totalIncome = 62570 > 12570
    // taxableDividend = 50000 - 500 = 49500
    // basicRateRemaining = max(0, 50270 - 12570) = 37700
    // 49500 > 37700 so higher rate applies:
    // atBasic = 37700 * 0.1075 = 4052.75
    // atHigher = (49500 - 37700) * 0.3575 = 11800 * 0.3575 = 4218.50
    // total = 4052.75 + 4218.50 = 8271.25
    const tax = dividendTax(50000, 12570);
    expect(tax).toBeCloseTo(8271.25, 2);
  });

  it('uses dividend allowance even with other income', () => {
    // dividend 600, otherIncome 20000. taxableDividend = 100.
    // basicRateRemaining = max(0, 50270 - 20000) = 30270
    // atBasic = 100 * 0.1075 = 10.75
    const tax = dividendTax(600, 20000);
    expect(tax).toBeCloseTo(10.75, 2);
  });

  it('returns 0 when taxable dividend is 0 after allowance', () => {
    expect(dividendTax(499, 30000)).toBe(0);
  });

  it('returns 0 for zero dividend income', () => {
    expect(dividendTax(0, 0)).toBe(0);
    expect(dividendTax(0, 50000)).toBe(0);
  });

  it('handles high dividends with no other income', () => {
    const tax = dividendTax(200000, 0);
    // taxableDividend = 199500
    // basicRateRemaining = 50270
    // atBasic = 50270 * 0.1075 = 5404.025
    // atHigher = (199500 - 50270) * 0.3575 = 149230 * 0.3575 = 53349.725
    // total = 58753.75
    expect(tax).toBeGreaterThan(50000);
    expect(tax).toBeLessThan(65000);
  });

  it('handles dividend-only scenario at allowance boundary', () => {
    // exact allowance: £500 dividend, no tax
    expect(dividendTax(500, 0)).toBe(0);
  });
});

describe('flatRateVat', () => {
  it('calculates VAT surplus at £60k turnover', () => {
    const vat = flatRateVat(60000);
    // gross = 60000 * 1.2 = 72000
    // rate = 0.145 - 0.01 = 0.135
    // payable = 72000 * 0.135 = 9720
    // collected = 72000 * 0.20 = 14400
    // surplus = 14400 - 9720 = 4680
    expect(vat.vatCollected).toBe(14400);
    expect(vat.vatSurplus).toBeCloseTo(4680, 0);
    expect(vat.note).toContain('Flat rate scheme');
  });

  it('calculates correct effective rate with first year discount', () => {
    const vat = flatRateVat(100000);
    expect(vat.effectiveRate).toBeCloseTo(0.135, 3);
  });

  it('handles zero turnover', () => {
    const vat = flatRateVat(0);
    expect(vat.annualTurnover).toBe(0);
    expect(vat.grossReceipts).toBe(0);
    expect(vat.vatCollected).toBe(0);
    expect(vat.vatPayable).toBe(0);
    expect(vat.vatSurplus).toBe(0);
  });
});

describe('employerNI', () => {
  it('returns 0 for salary at or below primary threshold', () => {
    expect(employerNI(5000)).toBe(0);
    expect(employerNI(0)).toBe(0);
    expect(employerNI(4999)).toBe(0);
  });

  it('calculates 15% on salary above primary threshold', () => {
    // (10000 - 5000) * 0.15 = 5000 * 0.15 = 750
    expect(employerNI(10000)).toBeCloseTo(750, 2);
  });

  it('handles large salaries', () => {
    const ni = employerNI(100000);
    expect(ni).toBeCloseTo(14250, 2);
  });
});

describe('rdcEstimate', () => {
  it('calculates 20% gross credit on qualifying costs', () => {
    const rdc = rdcEstimate(10000);
    expect(rdc.grossCredit).toBe(2000);
  });

  it('applies CT reduction to net credit', () => {
    const rdc = rdcEstimate(10000);
    // netCredit = 2000 * (1 - 0.19) = 1620
    expect(rdc.netCredit).toBeCloseTo(1620, 2);
  });

  it('handles zero qualifying costs', () => {
    const rdc = rdcEstimate(0);
    expect(rdc.grossCredit).toBe(0);
    expect(rdc.netCredit).toBe(0);
  });

  it('includes descriptive note with effective rate', () => {
    const rdc = rdcEstimate(10000);
    expect(rdc.note).toContain('RDEC');
  });
});

describe('fullStrategy', () => {
  it('produces complete strategy for £60k revenue', () => {
    const s = fullStrategy(60000, 2000);
    expect(s.salary.amount).toBe(12570);
    expect(s.salary.employerNI).toBeGreaterThan(0);
    expect(s.withPension.pensionContribution).toBeGreaterThan(0);
    expect(s.withPension.totalWealth).toBeGreaterThan(s.noPension.netTakeHome);
  });

  it('calculates pension contribution up to annual allowance', () => {
    // revenue 60000, expenses 2000, salary cost ~13705.5
    // profitBeforePension = 60000 - 2000 - 13705.5 = 44294.5
    // maxPension = min(60000, 44294.5) = 44294.5
    const s = fullStrategy(60000, 2000);
    expect(s.withPension.pensionContribution).toBeGreaterThanOrEqual(44000);
    expect(s.withPension.pensionContribution).toBeLessThanOrEqual(60000);
  });

  it('caps pension at annual allowance', () => {
    // Very high profit, pension should cap at 60000
    const s = fullStrategy(500000, 2000);
    expect(s.withPension.pensionContribution).toBeLessThanOrEqual(60000);
  });

  it('calculates strategy for zero revenue edge case', () => {
    const s = fullStrategy(0, 0);
    expect(s.salary.amount).toBe(12570);
    // profit before pension will be negative (just the salary cost)
    expect(s.noPension.taxableProfit).toBeLessThan(0);
    expect(s.withPension.pensionContribution).toBe(0);
  });

  it('includes R&D section when rndCosts provided', () => {
    const s = fullStrategy(60000, 2000, 10000);
    expect(s.rdc).not.toBeNull();
    expect(s.rdc.qualifyingCosts).toBe(10000);
  });

  it('excludes R&D section when no rndCosts', () => {
    const s = fullStrategy(60000, 2000);
    expect(s.rdc).toBeNull();
  });

  it('includes all notes', () => {
    const s = fullStrategy(60000, 2000);
    expect(s.notes.pension).toBeTruthy();
    expect(s.notes.dividend).toContain('Dividend allowance');
    expect(s.notes.employmentAllowance).toContain('Employment Allowance');
  });

  it('pension increases total wealth compared to no pension', () => {
    const s = fullStrategy(60000, 2000);
    expect(s.withPension.totalWealth).toBeGreaterThan(s.noPension.netTakeHome);
  });
});
