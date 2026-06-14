import { describe, it, expect, beforeAll, vi } from 'vitest';
import { buildDashboard, calculateDeadlines, getQuarterlyDeadlines } from '../../src/lib/dashboard.js';

// Prevent filesystem reads for dividends.json from interfering with tests
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(() => { throw new Error('ENOENT'); }),
  },
  readFileSync: vi.fn(() => { throw new Error('ENOENT'); }),
}));

describe('buildDashboard', () => {
  it('at £60k revenue, £2k expenses: salary.amount === 12570', () => {
    const d = buildDashboard(60000, 2000);
    expect(d.scenario).toEqual({ revenue: 60000, expenses: 2000 });
    expect(d.salary.amount).toBe(12570);
  });

  it('at £60k revenue: tax.withPension.pensionContribution > 0', () => {
    const d = buildDashboard(60000, 2000);
    expect(d.tax.withPension.pensionContribution).toBeGreaterThan(0);
  });

  it('at £60k revenue: summary.totalWealthWithPension > 50000', () => {
    const d = buildDashboard(60000, 2000);
    expect(d.summary.totalWealthWithPension).toBeGreaterThan(50000);
  });

  it('at £30k revenue: vat is null (below threshold)', () => {
    const d = buildDashboard(30000, 2000);
    expect(d.vat).toBeNull();
  });

  it('at £120k revenue: vat is NOT null, vat.isRequired === true', () => {
    const d = buildDashboard(120000, 2000);
    expect(d.vat).not.toBeNull();
    expect(d.vat.isRequired).toBe(true);
  });

  it('at £0 revenue: no errors, salary.amount === 12570, corpTax === 0', () => {
    const d = buildDashboard(0, 0);
    expect(d.salary.amount).toBe(12570);
    expect(d.tax.noPension.corpTax).toBeLessThanOrEqual(0);
  });

  it('negative revenue: handled gracefully (Math.max(0) or similar)', () => {
    const d = buildDashboard(-5000, 0);
    expect(d.salary.amount).toBe(12570);
    expect(d.scenario.revenue).toBe(0);
  });

  it('returns correct structure with all top-level keys', () => {
    const d = buildDashboard(60000, 2000);
    expect(d).toHaveProperty('scenario');
    expect(d).toHaveProperty('salary');
    expect(d).toHaveProperty('tax');
    expect(d).toHaveProperty('vat');
    expect(d).toHaveProperty('dividends');
    expect(d).toHaveProperty('compliance');
    expect(d).toHaveProperty('summary');
  });

  it('includes VAT section fields when revenue above threshold', () => {
    const d = buildDashboard(100000, 2000);
    expect(d.vat).toHaveProperty('annualTurnover');
    expect(d.vat).toHaveProperty('vatCollected');
    expect(d.vat).toHaveProperty('vatPayable');
    expect(d.vat).toHaveProperty('vatSurplus');
    expect(d.vat).toHaveProperty('isRequired');
    expect(d.vat.annualTurnover).toBe(100000);
    expect(d.vat.isRequired).toBe(true);
  });

  it('dividends section defaults to zeros when no file exists', () => {
    const d = buildDashboard(60000, 2000);
    expect(d.dividends).toEqual({
      yearToDate: 0,
      remainingAllowance: 500,
      totalDeclared: 0,
    });
  });

  it('compliance section has correct default fields', () => {
    const d = buildDashboard(60000, 2000);
    expect(d.compliance).toEqual({
      insuranceExpiry: null,
      insuranceDaysLeft: null,
      companyVatRegistered: false,
    });
  });

  it('summary.cashTakeHome and summary.totalWealthWithPension are numbers', () => {
    const d = buildDashboard(60000, 2000);
    expect(typeof d.summary.cashTakeHome).toBe('number');
    expect(typeof d.summary.totalWealthWithPension).toBe('number');
    expect(d.summary.totalWealthWithPension).toBeGreaterThan(d.summary.cashTakeHome);
  });
});

describe('calculateDeadlines', () => {
  it('with valid env dates: returns sorted array with at least 3 deadlines', () => {
    const env = {
      COMPANY_INCORPORATION_DATE: '2020-06-15',
      PI_INSURANCE_EXPIRY: '2026-12-31',
      ICO_RENEWAL_DATE: '2026-08-01',
      CURRENT_DATE: '2026-06-10',
    };
    const deadlines = calculateDeadlines(env);
    expect(deadlines.length).toBeGreaterThanOrEqual(3);
    // Verify sorted by date ascending
    for (let i = 1; i < deadlines.length; i++) {
      expect(new Date(deadlines[i].date).getTime())
        .toBeGreaterThanOrEqual(new Date(deadlines[i - 1].date).getTime());
    }
  });

  it('with no dates in env: returns only the Self Assessment deadline (always present)', () => {
    const deadlines = calculateDeadlines({});
    // Self Assessment is always calculable without any env vars
    expect(deadlines.length).toBe(1);
    expect(deadlines[0].label).toContain('Self Assessment');
  });

  it('PI insurance 5 days away: returns urgency critical', () => {
    const env = {
      PI_INSURANCE_EXPIRY: '2026-06-15',
      CURRENT_DATE: '2026-06-10',
    };
    const deadlines = calculateDeadlines(env);
    const pi = deadlines.find(d => d.label.toLowerCase().includes('pi insurance'));
    expect(pi).toBeDefined();
    expect(pi.urgency).toBe('critical');
    expect(pi.daysUntil).toBe(5);
  });

  it('PI insurance 60 days away: returns urgency ok', () => {
    const env = {
      PI_INSURANCE_EXPIRY: '2026-08-09',
      CURRENT_DATE: '2026-06-10',
    };
    const deadlines = calculateDeadlines(env);
    const pi = deadlines.find(d => d.label.toLowerCase().includes('pi insurance'));
    expect(pi).toBeDefined();
    expect(pi.urgency).toBe('ok');
  });

  it('PI insurance 14 days away: returns urgency warning', () => {
    const env = {
      PI_INSURANCE_EXPIRY: '2026-06-24',
      CURRENT_DATE: '2026-06-10',
    };
    const deadlines = calculateDeadlines(env);
    const pi = deadlines.find(d => d.label.toLowerCase().includes('pi insurance'));
    expect(pi).toBeDefined();
    expect(pi.urgency).toBe('warning');
  });

  it('overdue PI insurance (negative days): urgency critical', () => {
    const env = {
      PI_INSURANCE_EXPIRY: '2026-06-05',
      CURRENT_DATE: '2026-06-10',
    };
    const deadlines = calculateDeadlines(env);
    const pi = deadlines.find(d => d.label.toLowerCase().includes('pi insurance'));
    expect(pi).toBeDefined();
    expect(pi.daysUntil).toBeLessThan(0);
    expect(pi.urgency).toBe('critical');
  });

  it('each deadline has label, date, daysUntil, urgency', () => {
    const env = {
      COMPANY_INCORPORATION_DATE: '2020-06-15',
      PI_INSURANCE_EXPIRY: '2026-12-31',
      ICO_RENEWAL_DATE: '2026-08-01',
      CURRENT_DATE: '2026-06-10',
    };
    const deadlines = calculateDeadlines(env);
    for (const d of deadlines) {
      expect(d).toHaveProperty('label');
      expect(d).toHaveProperty('date');
      expect(d).toHaveProperty('daysUntil');
      expect(d).toHaveProperty('urgency');
      expect(['critical', 'warning', 'ok']).toContain(d.urgency);
      expect(typeof d.label).toBe('string');
      expect(typeof d.date).toBe('string');
      expect(typeof d.daysUntil).toBe('number');
    }
  });

  it('Self Assessment deadline label appears in results', () => {
    const env = {
      CURRENT_DATE: '2026-06-10',
    };
    const deadlines = calculateDeadlines(env);
    const sa = deadlines.find(d => d.label.toLowerCase().includes('self assessment'));
    expect(sa).toBeDefined();
  });
});

describe('getQuarterlyDeadlines', () => {
  it('2026: returns 4 quarters', () => {
    const quarters = getQuarterlyDeadlines(2026);
    expect(quarters).toHaveLength(4);
  });

  it('Q1 end date: 2026-03-31', () => {
    const quarters = getQuarterlyDeadlines(2026);
    expect(quarters[0].periodEnd).toBe('2026-03-31');
  });

  it('Q1 due date: 2026-05-07 (1 month + 7 days)', () => {
    const quarters = getQuarterlyDeadlines(2026);
    expect(quarters[0].dueDate).toBe('2026-05-07');
  });

  it('each quarter has { label, periodEnd, dueDate, periodStart }', () => {
    const quarters = getQuarterlyDeadlines(2026);
    for (const q of quarters) {
      expect(q).toHaveProperty('label');
      expect(q).toHaveProperty('periodEnd');
      expect(q).toHaveProperty('dueDate');
      expect(q).toHaveProperty('periodStart');
    }
  });

  it('Q2 end 2026-06-30, due 2026-08-07', () => {
    const quarters = getQuarterlyDeadlines(2026);
    expect(quarters[1].periodEnd).toBe('2026-06-30');
    expect(quarters[1].dueDate).toBe('2026-08-07');
  });

  it('Q3 end 2026-09-30, due 2026-11-07', () => {
    const quarters = getQuarterlyDeadlines(2026);
    expect(quarters[2].periodEnd).toBe('2026-09-30');
    expect(quarters[2].dueDate).toBe('2026-11-07');
  });

  it('Q4 end 2026-12-31, due 2027-02-07', () => {
    const quarters = getQuarterlyDeadlines(2026);
    expect(quarters[3].periodEnd).toBe('2026-12-31');
    expect(quarters[3].dueDate).toBe('2027-02-07');
  });
});
