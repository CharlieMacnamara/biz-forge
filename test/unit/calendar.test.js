import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getUrgency,
  getDeadlines,
  getQuarterlyDeadlines,
  getUpcomingDeadlines,
} from '../../src/lib/calendar.js';

// ---------------------------------------------------------------------------
// getUrgency
// ---------------------------------------------------------------------------
describe('getUrgency', () => {
  it('returns critical with OVERDUE message for negative daysUntil', () => {
    const result = getUrgency(-1);
    expect(result.level).toBe('critical');
    expect(result.symbol).toBe('🔴');
    expect(result.message).toBe('OVERDUE by 1 day');
  });

  it('returns critical for 0 daysUntil', () => {
    const result = getUrgency(0);
    expect(result.level).toBe('critical');
    expect(result.symbol).toBe('🔴');
    expect(result.message).toBe('0 days until deadline');
  });

  it('returns critical for 3 daysUntil (under 7)', () => {
    const result = getUrgency(3);
    expect(result.level).toBe('critical');
    expect(result.message).toBe('3 days until deadline');
  });

  it('returns warning for 7 daysUntil (boundary)', () => {
    const result = getUrgency(7);
    expect(result.level).toBe('warning');
    expect(result.symbol).toBe('🟡');
    expect(result.message).toBe('7 days until deadline');
  });

  it('returns warning for 14 daysUntil', () => {
    const result = getUrgency(14);
    expect(result.level).toBe('warning');
    expect(result.message).toBe('14 days until deadline');
  });

  it('returns warning for 29 daysUntil', () => {
    const result = getUrgency(29);
    expect(result.level).toBe('warning');
    expect(result.message).toBe('29 days until deadline');
  });

  it('returns ok for 30 daysUntil (boundary)', () => {
    const result = getUrgency(30);
    expect(result.level).toBe('ok');
    expect(result.symbol).toBe('🟢');
    expect(result.message).toBe('30 days until deadline');
  });

  it('returns ok for 60 daysUntil', () => {
    const result = getUrgency(60);
    expect(result.level).toBe('ok');
    expect(result.message).toBe('60 days until deadline');
  });

  it('handles null daysUntil gracefully', () => {
    const result = getUrgency(null);
    expect(result.level).toBe('ok');
    expect(result.symbol).toBe('🟢');
    expect(result.message).toBe('Date not available');
  });

  it('handles undefined daysUntil gracefully', () => {
    const result = getUrgency(undefined);
    expect(result.level).toBe('ok');
    expect(result.symbol).toBe('🟢');
    expect(result.message).toBe('Date not available');
  });

  it('handles very large overdue value', () => {
    const result = getUrgency(-365);
    expect(result.level).toBe('critical');
    expect(result.message).toBe('OVERDUE by 365 days');
  });
});

// ---------------------------------------------------------------------------
// getDeadlines
// ---------------------------------------------------------------------------
describe('getDeadlines', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('includes PI Insurance expiry when env.PI_INSURANCE_EXPIRY is set', () => {
    const env = { PI_INSURANCE_EXPIRY: '2027-06-30' };
    const result = getDeadlines(env);
    const pi = result.find((d) => d.id === 'pi-insurance');
    expect(pi).toBeDefined();
    expect(pi.label).toContain('PI Insurance');
    expect(pi.date).toBe('2027-06-30');
    expect(pi.type).toBe('renewal');
    expect(pi.urgency.level).toBe('ok'); // 381 days away
  });

  it('includes ICO renewal when env.ICO_REGISTRATION_DATE is set', () => {
    const env = { ICO_REGISTRATION_DATE: '2026-01-15' };
    const result = getDeadlines(env);
    const ico = result.find((d) => d.id === 'ico-renewal');
    expect(ico).toBeDefined();
    expect(ico.date).toBe('2027-01-15');
    expect(ico.type).toBe('annual');
    expect(ico.urgency.level).toBe('ok');
  });

  it('includes Confirmation Statement when env.COMPANY_INCORPORATION_DATE is set', () => {
    const env = { COMPANY_INCORPORATION_DATE: '2026-01-15' };
    const result = getDeadlines(env);
    const cs = result.find((d) => d.id === 'confirmation-statement');
    expect(cs).toBeDefined();
    expect(cs.date).toBe('2027-01-29');
    expect(cs.type).toBe('annual');
  });

  it('includes Corporation Tax deadlines when env.COMPANY_INCORPORATION_DATE is set', () => {
    const env = { COMPANY_INCORPORATION_DATE: '2026-01-15' };
    const result = getDeadlines(env);
    const ctPay = result.find((d) => d.id === 'corporation-tax-payment');
    const ctRet = result.find((d) => d.id === 'corporation-tax-return');
    expect(ctPay).toBeDefined();
    expect(ctPay.date).toBe('2027-10-16');
    expect(ctPay.type).toBe('annual');
    expect(ctRet).toBeDefined();
    expect(ctRet.date).toBe('2028-01-15');
    expect(ctRet.type).toBe('annual');
  });

  it('always includes Self Assessment (hardcoded)', () => {
    const result = getDeadlines({});
    const sa = result.find((d) => d.id === 'self-assessment');
    expect(sa).toBeDefined();
    expect(sa.label).toBe('Self Assessment filing deadline');
    expect(sa.date).toBe('2027-01-31');
    expect(sa.type).toBe('annual');
  });

  it('returns at least Self Assessment when env has no dates', () => {
    const result = getDeadlines({});
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].id).toBe('self-assessment');
  });

  it('returns deadlines sorted by daysUntil ascending', () => {
    const env = {
      ICO_REGISTRATION_DATE: '2026-01-15',
      PI_INSURANCE_EXPIRY: '2027-06-30',
      COMPANY_INCORPORATION_DATE: '2026-01-15',
    };
    const result = getDeadlines(env);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].daysUntil).toBeGreaterThanOrEqual(result[i - 1].daysUntil);
    }
  });

  it('each deadline object has all required fields', () => {
    const env = {
      ICO_REGISTRATION_DATE: '2026-01-15',
      PI_INSURANCE_EXPIRY: '2027-06-30',
      COMPANY_INCORPORATION_DATE: '2026-01-15',
    };
    const result = getDeadlines(env);
    for (const d of result) {
      expect(d).toHaveProperty('id');
      expect(d).toHaveProperty('label');
      expect(d).toHaveProperty('date');
      expect(d).toHaveProperty('daysUntil');
      expect(d).toHaveProperty('urgency');
      expect(d).toHaveProperty('type');
      expect(d.urgency).toHaveProperty('level');
      expect(d.urgency).toHaveProperty('symbol');
      expect(d.urgency).toHaveProperty('message');
    }
  });

  it('excludes deadlines when source env vars are missing', () => {
    const result = getDeadlines({});
    expect(result.find((d) => d.id === 'pi-insurance')).toBeUndefined();
    expect(result.find((d) => d.id === 'ico-renewal')).toBeUndefined();
    expect(result.find((d) => d.id === 'confirmation-statement')).toBeUndefined();
    expect(result.find((d) => d.id === 'corporation-tax-payment')).toBeUndefined();
    expect(result.find((d) => d.id === 'corporation-tax-return')).toBeUndefined();
  });

  it('handles empty env object', () => {
    const result = getDeadlines({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1); // only self-assessment
  });

  it('computes negative daysUntil for past date', () => {
    const env = { PI_INSURANCE_EXPIRY: '2025-01-01' };
    const result = getDeadlines(env);
    const pi = result.find((d) => d.id === 'pi-insurance');
    expect(pi.daysUntil).toBeLessThan(0);
    expect(pi.urgency.level).toBe('critical');
    expect(pi.urgency.message).toContain('OVERDUE');
  });
});

// ---------------------------------------------------------------------------
// getQuarterlyDeadlines
// ---------------------------------------------------------------------------
describe('getQuarterlyDeadlines', () => {
  it('returns 4 quarters for 2026', () => {
    const result = getQuarterlyDeadlines(2026);
    expect(result).toHaveLength(4);
  });

  it('Q1 has correct label and due date', () => {
    const result = getQuarterlyDeadlines(2026);
    const q1 = result[0];
    expect(q1.quarter).toBe(1);
    expect(q1.label).toBe('VAT Q1 (Jan-Mar 2026)');
    expect(q1.periodStart).toBe('2026-01-01');
    expect(q1.periodEnd).toBe('2026-03-31');
    expect(q1.dueDate).toBe('2026-05-07');
  });

  it('Q2 has correct label, period and due date', () => {
    const result = getQuarterlyDeadlines(2026);
    const q2 = result[1];
    expect(q2.quarter).toBe(2);
    expect(q2.label).toBe('VAT Q2 (Apr-Jun 2026)');
    expect(q2.periodStart).toBe('2026-04-01');
    expect(q2.periodEnd).toBe('2026-06-30');
    expect(q2.dueDate).toBe('2026-08-07');
  });

  it('Q3 has correct label, period and due date', () => {
    const result = getQuarterlyDeadlines(2026);
    const q3 = result[2];
    expect(q3.quarter).toBe(3);
    expect(q3.label).toBe('VAT Q3 (Jul-Sep 2026)');
    expect(q3.periodStart).toBe('2026-07-01');
    expect(q3.periodEnd).toBe('2026-09-30');
    expect(q3.dueDate).toBe('2026-11-07');
  });

  it('Q4 due date falls in next year (Feb 2027)', () => {
    const result = getQuarterlyDeadlines(2026);
    const q4 = result[3];
    expect(q4.quarter).toBe(4);
    expect(q4.label).toBe('VAT Q4 (Oct-Dec 2026)');
    expect(q4.periodStart).toBe('2026-10-01');
    expect(q4.periodEnd).toBe('2026-12-31');
    expect(q4.dueDate).toBe('2027-02-07');
  });

  it('produces correct labels for year 2027', () => {
    const result = getQuarterlyDeadlines(2027);
    expect(result[0].label).toBe('VAT Q1 (Jan-Mar 2027)');
    expect(result[1].label).toBe('VAT Q2 (Apr-Jun 2027)');
    expect(result[2].label).toBe('VAT Q3 (Jul-Sep 2027)');
    expect(result[3].label).toBe('VAT Q4 (Oct-Dec 2027)');
    expect(result[3].dueDate).toBe('2028-02-07');
  });

  it('each quarter has all required fields', () => {
    const result = getQuarterlyDeadlines(2026);
    for (const q of result) {
      expect(q).toHaveProperty('quarter');
      expect(q).toHaveProperty('periodStart');
      expect(q).toHaveProperty('periodEnd');
      expect(q).toHaveProperty('dueDate');
      expect(q).toHaveProperty('label');
    }
  });
});

// ---------------------------------------------------------------------------
// getUpcomingDeadlines
// ---------------------------------------------------------------------------
describe('getUpcomingDeadlines', () => {
  function makeDeadline(id, daysUntil) {
    return {
      id,
      label: `Deadline ${id}`,
      date: '2026-06-14',
      daysUntil,
      urgency: { level: 'ok', symbol: '🟢', message: `${daysUntil} days` },
      type: 'annual',
    };
  }

  it('returns correct number of items (default 5)', () => {
    const deadlines = Array.from({ length: 10 }, (_, i) =>
      makeDeadline(`d${i}`, i * 10),
    );
    const result = getUpcomingDeadlines(deadlines);
    expect(result).toHaveLength(5);
  });

  it('returns items sorted by daysUntil ascending', () => {
    const deadlines = [
      makeDeadline('a', 100),
      makeDeadline('b', 10),
      makeDeadline('c', 50),
      makeDeadline('d', 1),
    ];
    const result = getUpcomingDeadlines(deadlines, 4);
    expect(result[0].id).toBe('d');
    expect(result[1].id).toBe('b');
    expect(result[2].id).toBe('c');
    expect(result[3].id).toBe('a');
  });

  it('handles empty array gracefully', () => {
    const result = getUpcomingDeadlines([]);
    expect(result).toEqual([]);
  });

  it('returns all items when fewer than count', () => {
    const deadlines = [makeDeadline('a', 5), makeDeadline('b', 10)];
    const result = getUpcomingDeadlines(deadlines, 5);
    expect(result).toHaveLength(2);
  });

  it('includes overdue items (negative daysUntil) at the front', () => {
    const deadlines = [
      makeDeadline('future', 30),
      makeDeadline('overdue', -5),
      makeDeadline('near', 7),
    ];
    const result = getUpcomingDeadlines(deadlines, 3);
    expect(result[0].id).toBe('overdue');
    expect(result[0].daysUntil).toBeLessThan(0);
  });

  it('does not mutate the original array', () => {
    const deadlines = [makeDeadline('a', 10), makeDeadline('b', 5)];
    const original = [...deadlines];
    getUpcomingDeadlines(deadlines, 2);
    expect(deadlines).toEqual(original);
  });

  it('respects custom count parameter', () => {
    const deadlines = Array.from({ length: 10 }, (_, i) =>
      makeDeadline(`d${i}`, i),
    );
    expect(getUpcomingDeadlines(deadlines, 3)).toHaveLength(3);
    expect(getUpcomingDeadlines(deadlines, 0)).toHaveLength(0);
  });
});
