/**
 * Business Security Integration Tests
 *
 * Validates the full business security workflow:
 * readiness → dashboard → dividend → calendar — all working together
 * with temp .env and temp output directories.
 *
 * Uses vi.useFakeTimers to freeze time to 2026-06-14 for deterministic dates.
 * All temp files are cleaned up in afterAll.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ---------------------------------------------------------------------------
// Suite-level setup
// ---------------------------------------------------------------------------

let tmpDir;
let originalCwd;

beforeAll(() => {
  // Freeze time to 2026-06-14 for deterministic date checks
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-14T12:00:00.000Z'));

  // Create temp directory for file operations
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bizforge-int-'));
  originalCwd = process.cwd();

  // Switch to temp dir so dividend history writes go there
  process.chdir(tmpDir);

  // Set environment variables for the entire test suite
  process.env.COMPANY_NAME = 'BizForge Integration Ltd';
  process.env.COMPANY_NUMBER = '12345678';
  process.env.COMPANY_EMAIL = 'hello@bizforge-integration.com';
  process.env.PI_INSURANCE_EXPIRY = '2027-06-30';
  process.env.COMPANY_INCORPORATION_DATE = '2020-01-15';
  process.env.DIRECTOR_NAME = 'Charlie Integration';
  process.env.ICO_REGISTRATION_DATE = '2025-01-15';
});

afterAll(() => {
  // Restore original working directory
  process.chdir(originalCwd);

  // Remove temp directory with all contents
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // Restore real timers
  vi.useRealTimers();

  // Clean up environment variables
  delete process.env.COMPANY_NAME;
  delete process.env.COMPANY_NUMBER;
  delete process.env.COMPANY_EMAIL;
  delete process.env.PI_INSURANCE_EXPIRY;
  delete process.env.COMPANY_INCORPORATION_DATE;
  delete process.env.DIRECTOR_NAME;
  delete process.env.ICO_REGISTRATION_DATE;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Business Security Integration', () => {
  // --- 1. Readiness with valid env returns GREEN ---
  it('readiness with valid env returns green', async () => {
    const { runReadinessCheck } = await import('../../src/lib/readiness.js');

    const env = {
      COMPANY_NAME: process.env.COMPANY_NAME,
      COMPANY_NUMBER: process.env.COMPANY_NUMBER,
      COMPANY_EMAIL: process.env.COMPANY_EMAIL,
      COMPANY_VAT_NUMBER: 'GB123456789',
      COMPANY_ADDRESS: '123 Integration Street',
      COMPANY_DIRECTOR_NAME: process.env.DIRECTOR_NAME,
      COMPANIES_HOUSE_API_KEY: 'test-key-12345',
    };

    const result = runReadinessCheck({
      env,
      templates: [
        'sow.md',
        'privacy-policy.md',
        'terms-of-service.md',
        'cookie-policy.md',
        'dividend-voucher.md',
        'board-minutes.md',
      ],
      insuranceExpiry: process.env.PI_INSURANCE_EXPIRY,
    });

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.verdict).toBe('GREEN');
    expect(result.summary.passed).toBe(result.summary.total);
  });

  // --- 2. Dashboard at £60k has salary = 12570 ---
  it('dashboard at £60k has salary=12570', async () => {
    const { buildDashboard } = await import('../../src/lib/dashboard.js');

    const dashboard = buildDashboard(60000);

    expect(dashboard.salary.amount).toBe(12570);
    expect(dashboard.tax.withPension.pensionContribution).toBeGreaterThan(0);
    expect(dashboard.scenario.revenue).toBe(60000);
  });

  // --- 3. Dividend voucher generates valid output ---
  it('dividend voucher generates valid output', async () => {
    const { generateVoucher } = await import('../../src/lib/dividend.js');

    const output = generateVoucher({
      company_name: 'BizForge Integration Ltd',
      company_number: '12345678',
      shareholder_name: 'Alice Shareholder',
      shareholder_address: '1 Dividend Road, London',
      share_class: 'Ordinary',
      dividend_amount: '5000',
      dividend_per_share: '5.00',
      shares_held: '1000',
      director_name: 'Charlie Integration',
      date: '2026-06-14',
    });

    expect(output).toContain('BizForge Integration Ltd');
    expect(output).toContain('5000');
    expect(output).toContain('Alice Shareholder');
    expect(output).toContain('Ordinary');
    expect(output).toContain('Charlie Integration');
  });

  // --- 4. Dividend board minutes contain resolution ---
  it('dividend board minutes contain resolution', async () => {
    const { generateBoardMinutes } = await import('../../src/lib/dividend.js');

    const output = generateBoardMinutes({
      company_name: 'BizForge Integration Ltd',
      company_number: '12345678',
      director_name: 'Charlie Integration',
      dividend_amount: '5000',
      date: '2026-06-14',
    });

    expect(output).toContain('resolution');
    expect(output).toContain('5000');
    expect(output).toContain('BizForge Integration Ltd');
    expect(output).toContain('Charlie Integration');
    expect(output).toContain('Registered Office');
  });

  // --- 5. Calendar deadlines include self assessment ---
  it('calendar deadlines include self assessment', async () => {
    const { getDeadlines } = await import('../../src/lib/calendar.js');

    const env = {
      PI_INSURANCE_EXPIRY: process.env.PI_INSURANCE_EXPIRY,
      COMPANY_INCORPORATION_DATE: process.env.COMPANY_INCORPORATION_DATE,
      ICO_REGISTRATION_DATE: process.env.ICO_REGISTRATION_DATE,
    };

    const deadlines = getDeadlines(env);

    const sa = deadlines.find((d) => d.id === 'self-assessment');
    expect(sa).toBeDefined();
    expect(sa.label).toContain('Self Assessment');
    expect(sa.date).toBe('2027-01-31');
    expect(sa.type).toBe('annual');
  });

  // --- 6. saveDividendRecord creates dividend history ---
  it('saveDividendRecord creates dividend history', async () => {
    const { saveDividendRecord } = await import('../../src/lib/dividend.js');

    const outputDir = path.join(tmpDir, 'legal_docs');
    const result = saveDividendRecord(
      {
        company_name: 'BizForge Integration Ltd',
        company_number: '12345678',
        shareholder_name: 'Bob Holder',
        shareholder_address: '2 Share Lane, London',
        share_class: 'Ordinary',
        dividend_amount: '2500',
        dividend_per_share: '2.50',
        shares_held: '1000',
        director_name: 'Charlie Integration',
        date: '2026-06-14',
      },
      outputDir,
    );

    // Verify markdown files were created
    expect(fs.existsSync(result.voucherPath)).toBe(true);
    expect(fs.existsSync(result.minutesPath)).toBe(true);

    // Verify dividend history file exists in temp data dir
    const historyPath = path.join(tmpDir, 'data', 'dividends.json');
    expect(fs.existsSync(historyPath)).toBe(true);

    // Check the history content
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(1);
    expect(history[0].amount).toBe('2500');
    expect(history[0].shareholderName).toBe('Bob Holder');
  });

  // --- 7. getDividendHistory returns saved records ---
  it('getDividendHistory returns saved records', async () => {
    const { getDividendHistory } = await import('../../src/lib/dividend.js');

    const history = getDividendHistory();

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].amount).toBe('2500');
    expect(history[0].shareholderName).toBe('Bob Holder');
  });

  // --- 8. getQuarterlyDeadlines returns 4 quarters ---
  it('getQuarterlyDeadlines returns 4 quarters', async () => {
    const { getQuarterlyDeadlines } = await import('../../src/lib/calendar.js');

    const quarters = getQuarterlyDeadlines(2026);

    expect(quarters).toHaveLength(4);
    expect(quarters[0].quarter).toBe(1);
    expect(quarters[0].periodStart).toBe('2026-01-01');
    expect(quarters[0].periodEnd).toBe('2026-03-31');
    expect(quarters[1].quarter).toBe(2);
    expect(quarters[1].periodStart).toBe('2026-04-01');
    expect(quarters[2].quarter).toBe(3);
    expect(quarters[3].quarter).toBe(4);
  });

  // --- 9. getUpcomingDeadlines sorts by urgency ---
  it('getUpcomingDeadlines sorts by urgency', async () => {
    const { getUpcomingDeadlines } = await import('../../src/lib/calendar.js');

    const testDeadlines = [
      { id: 'far', label: 'Far deadline', date: '2027-12-31', daysUntil: 565, urgency: { level: 'ok' } },
      { id: 'near', label: 'Near deadline', date: '2026-07-01', daysUntil: 17, urgency: { level: 'warning' } },
      { id: 'immediate', label: 'Immediate deadline', date: '2026-06-15', daysUntil: 1, urgency: { level: 'critical' } },
      { id: 'overdue', label: 'Overdue deadline', date: '2026-06-01', daysUntil: -13, urgency: { level: 'critical' } },
    ];

    const upcoming = getUpcomingDeadlines(testDeadlines, 4);

    expect(upcoming).toHaveLength(4);
    // Verify sorted by daysUntil ascending
    for (let i = 1; i < upcoming.length; i++) {
      expect(upcoming[i].daysUntil).toBeGreaterThanOrEqual(upcoming[i - 1].daysUntil);
    }
    // The most urgent (most negative daysUntil) should be first
    expect(upcoming[0].id).toBe('overdue');
    expect(upcoming[1].id).toBe('immediate');
  });

  // --- 10. calculateDividendTax with basic rate income ---
  it('calculateDividendTax with basic rate income', async () => {
    const { calculateDividendTax } = await import('../../src/lib/dividend.js');

    const result = calculateDividendTax(10000, 12570);

    expect(result.dividendIncome).toBe(10000);
    expect(result.otherIncome).toBe(12570);
    expect(result.totalIncome).toBe(22570);
    expect(result.taxAmount).toBeGreaterThan(0);
    expect(result.dividendAllowance).toBe(500);
  });
});
