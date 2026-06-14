import { vi, describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock saveDocument to track calls without writing template files to disk
vi.mock('../../src/lib/legal.js', async () => {
  const actual = await vi.importActual('../../src/lib/legal.js');
  return {
    ...actual,
    saveDocument: vi.fn().mockImplementation((content, dir, filename) =>
      path.join(dir, filename),
    ),
  };
});

let dividendModule;
let saveDocumentMock;
let tmpDir;

const FULL_VARS = {
  company_name: 'Test Ltd',
  company_number: '12345678',
  date: '2026-06-14',
  shareholder_name: 'Alice Shareholder',
  shareholder_address: '123 Test Street, London',
  share_class: 'Ordinary',
  dividend_amount: '10,000.00',
  dividend_per_share: '1.00',
  shares_held: '10000',
  director_name: 'Bob Director',
};

const SAVE_VARS = {
  ...FULL_VARS,
  meeting_location: 'Board Room',
  resolution_text: 'Test resolution.',
};

beforeAll(async () => {
  dividendModule = await import('../../src/lib/dividend.js');
  const legal = await import('../../src/lib/legal.js');
  saveDocumentMock = legal.saveDocument;
});

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dividend-test-'));
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
});

afterEach(() => {
  vi.restoreAllMocks();
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('generateVoucher', () => {
  it('output contains company_name and dividend_amount', () => {
    const result = dividendModule.generateVoucher(FULL_VARS);
    expect(result).toContain('Test Ltd');
    expect(result).toContain('£10,000.00');
  });

  it('uses today date when date not provided', () => {
    const { date: _, ...varsWithoutDate } = FULL_VARS;
    const result = dividendModule.generateVoucher(varsWithoutDate);
    const today = new Date().toISOString().split('T')[0];
    expect(result).toContain(today);
  });

  it('no raw {{...}} placeholders remain with all vars provided', () => {
    const result = dividendModule.generateVoucher(FULL_VARS);
    expect(result).not.toMatch(/\{\{.*?\}\}/);
  });
});

describe('generateBoardMinutes', () => {
  it('output contains resolution text', () => {
    const vars = {
      ...FULL_VARS,
      meeting_location: 'Board Room',
      resolution_text: 'That a dividend of £10,000 be declared.',
    };
    const result = dividendModule.generateBoardMinutes(vars);
    expect(result).toContain('That a dividend of £10,000 be declared.');
  });

  it('defaults meeting_location to "Registered Office"', () => {
    const vars = {
      company_name: 'Test Ltd',
      company_number: '12345678',
      date: '2026-06-14',
      director_name: 'Bob Director',
      dividend_amount: '10,000.00',
      resolution_text: 'Test resolution.',
    };
    const result = dividendModule.generateBoardMinutes(vars);
    expect(result).toContain('Registered Office');
  });

  it('auto-generates resolution_text from dividend_amount', () => {
    const vars = {
      company_name: 'Test Ltd',
      company_number: '12345678',
      date: '2026-06-14',
      director_name: 'Bob Director',
      dividend_amount: '10,000.00',
    };
    const result = dividendModule.generateBoardMinutes(vars);
    expect(result).toContain('That a dividend of £10,000.00 be declared payable to the shareholders.');
  });
});

describe('saveDividendRecord', () => {
  it('saves voucher to correct path', () => {
    saveDocumentMock.mockClear();
    dividendModule.saveDividendRecord(SAVE_VARS, tmpDir);
    expect(saveDocumentMock).toHaveBeenCalledWith(
      expect.any(String),
      tmpDir,
      'Dividend-2026-06-14-10000.00.md',
    );
  });

  it('saves minutes to correct path', () => {
    saveDocumentMock.mockClear();
    dividendModule.saveDividendRecord(SAVE_VARS, tmpDir);
    expect(saveDocumentMock).toHaveBeenCalledWith(
      expect.any(String),
      tmpDir,
      'Board-Minutes-2026-06-14.md',
    );
  });

  it('appends to data/dividends.json', () => {
    dividendModule.saveDividendRecord(SAVE_VARS, tmpDir);
    const historyPath = path.join(tmpDir, 'data', 'dividends.json');
    const data1 = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    expect(data1).toHaveLength(1);
    expect(data1[0].amount).toBe('10,000.00');
    expect(data1[0].shareholderName).toBe('Alice Shareholder');

    // Second save should append
    dividendModule.saveDividendRecord({
      ...SAVE_VARS,
      dividend_amount: '5,000.00',
      shareholder_name: 'Bob Shareholder',
    }, tmpDir);
    const data2 = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    expect(data2).toHaveLength(2);
    expect(data2[1].amount).toBe('5,000.00');
    expect(data2[1].shareholderName).toBe('Bob Shareholder');
  });

  it('returns object with voucherPath and minutesPath', () => {
    const result = dividendModule.saveDividendRecord(SAVE_VARS, tmpDir);
    expect(result).toHaveProperty('voucherPath');
    expect(result).toHaveProperty('minutesPath');
    expect(result.voucherPath).toContain('Dividend-2026-06-14-10000.00.md');
    expect(result.minutesPath).toContain('Board-Minutes-2026-06-14.md');
  });
});

describe('getDividendHistory', () => {
  it('returns [] when no file exists', () => {
    const result = dividendModule.getDividendHistory();
    expect(result).toEqual([]);
  });

  it('returns array with the record after save', () => {
    dividendModule.saveDividendRecord(SAVE_VARS, tmpDir);
    const result = dividendModule.getDividendHistory();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('date', '2026-06-14');
    expect(result[0]).toHaveProperty('amount', '10,000.00');
    expect(result[0]).toHaveProperty('shareholderName', 'Alice Shareholder');
  });

  it('returns sorted by date descending', () => {
    const historyPath = path.join(tmpDir, 'data', 'dividends.json');
    fs.mkdirSync(path.dirname(historyPath), { recursive: true });
    fs.writeFileSync(historyPath, JSON.stringify([
      { date: '2026-01-01', amount: '100', shareholderName: 'A', createdAt: '2026-01-01' },
      { date: '2026-06-14', amount: '200', shareholderName: 'B', createdAt: '2026-06-14' },
      { date: '2025-12-25', amount: '300', shareholderName: 'C', createdAt: '2025-12-25' },
    ]));
    const result = dividendModule.getDividendHistory();
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('2026-06-14');
    expect(result[1].date).toBe('2026-01-01');
    expect(result[2].date).toBe('2025-12-25');
  });
});

describe('calculateDividendTax', () => {
  it('£10k dividend + £12,570 salary: tax > 0 (basic rate)', () => {
    const result = dividendModule.calculateDividendTax(10000, 12570);
    expect(result.taxAmount).toBeGreaterThan(0);
    expect(result.taxRate).toBe('£500 allowance used');
  });

  it('£400 dividend + £0 salary: tax === 0 (within £500 allowance)', () => {
    const result = dividendModule.calculateDividendTax(400, 0);
    expect(result.taxAmount).toBe(0);
    expect(result.taxRate).toBe('Within £500 allowance');
  });

  it('£50k dividend + £12,570 salary: tax > £8k (higher rate applies)', () => {
    const result = dividendModule.calculateDividendTax(50000, 12570);
    expect(result.taxAmount).toBeGreaterThan(8000);
  });

  it('returns object with all required keys', () => {
    const result = dividendModule.calculateDividendTax(10000, 0);
    const expectedKeys = [
      'dividendIncome',
      'otherIncome',
      'totalIncome',
      'dividendAllowance',
      'taxableDividend',
      'taxRate',
      'taxAmount',
      'effectiveRate',
    ];
    expectedKeys.forEach((key) => {
      expect(result).toHaveProperty(key);
    });
  });
});
