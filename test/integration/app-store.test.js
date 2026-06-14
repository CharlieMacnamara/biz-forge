import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/companies-house.js', () => ({
  getCompany: vi.fn(),
  formatCompanySummary: vi.fn((c) => ({
    companyNumber: c.company_number,
    name: c.company_name,
    status: 'Active',
  })),
}));

describe('checkDuns integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns unknown status when no company number provided', async () => {
    const { checkDuns } = await import('../../src/lib/app-store.js');
    const result = await checkDuns(null);
    expect(result.status).toBe('unknown');
    expect(result.note).toContain('DUNS number');
  });

  it('returns company_found when company exists', async () => {
    const { getCompany } = await import('../../src/lib/companies-house.js');
    getCompany.mockResolvedValue({ company_name: 'Rennet Systems Ltd' });

    const { checkDuns } = await import('../../src/lib/app-store.js');
    const result = await checkDuns('12345678');
    expect(result.status).toBe('company_found');
    expect(result.companyName).toBe('Rennet Systems Ltd');
  });

  it('returns company_not_found when company lookup fails', async () => {
    const { getCompany } = await import('../../src/lib/companies-house.js');
    getCompany.mockRejectedValue(new Error('Not found'));

    const { checkDuns } = await import('../../src/lib/app-store.js');
    const result = await checkDuns('99999999');
    expect(result.status).toBe('company_not_found');
  });
});
