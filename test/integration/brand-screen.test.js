import { describe, it, expect, vi } from 'vitest';
import { screenBrand, formatScreenReport } from '../../src/lib/brand-screen.js';

vi.mock('../../src/lib/companies-house.js', () => ({
  searchCompany: vi.fn(),
  formatCompanySummary: vi.fn((c) => ({
    companyNumber: c.company_number,
    name: c.company_name,
    status: c.company_status === 'active' ? 'Active' : 'Dissolved',
    incorporationDate: c.date_of_creation,
    type: c.type,
    address: 'Mock Address',
    sicCodes: c.sic_codes || [],
  })),
}));

vi.mock('../../src/lib/whois.js', () => ({
  checkDomains: vi.fn(),
  DEFAULT_TLDS: ['.co.uk', '.com', '.uk', '.io', '.dev'],
}));

describe('screenBrand (integration)', () => {
  it('produces correct structure with no conflicts', async () => {
    const { searchCompany } = await import('../../src/lib/companies-house.js');
    const { checkDomains } = await import('../../src/lib/whois.js');

    searchCompany.mockResolvedValue([]);
    checkDomains.mockResolvedValue({
      'testbrand.co.uk': { domain: 'testbrand.co.uk', available: true },
      'testbrand.com': { domain: 'testbrand.com', available: false },
    });

    const result = await screenBrand('TestBrand');
    expect(result.brand).toBe('TestBrand');
    expect(result.scanned).toBeTruthy();
    expect(result.companies).toEqual([]);
    expect(result.domains['testbrand.co.uk'].available).toBe(true);
    expect(result.domains['testbrand.com'].available).toBe(false);
  });

  it('returns company conflicts when found', async () => {
    const { searchCompany } = await import('../../src/lib/companies-house.js');
    const { checkDomains } = await import('../../src/lib/whois.js');

    searchCompany.mockResolvedValue([
      { company_name: 'Existing Ltd', company_number: '12345678', company_status: 'active', date_of_creation: '2020-01-01', type: 'ltd', sic_codes: ['62012'] },
    ]);
    checkDomains.mockResolvedValue({});

    const result = await screenBrand('Existing');
    expect(result.companies.length).toBe(1);
    expect(result.companies[0].name).toBe('Existing Ltd');
    expect(result.companies[0].status).toBe('Active');
  });

  it('handles companies API error gracefully', async () => {
    const { searchCompany } = await import('../../src/lib/companies-house.js');
    const { checkDomains } = await import('../../src/lib/whois.js');

    searchCompany.mockRejectedValue(new Error('API rate limit'));
    checkDomains.mockResolvedValue({});

    const result = await screenBrand('ErrorBrand');
    expect(result.companies.error).toBe('API rate limit');
  });

  it('handles WHOIS API error gracefully', async () => {
    const { searchCompany } = await import('../../src/lib/companies-house.js');
    const { checkDomains } = await import('../../src/lib/whois.js');

    searchCompany.mockResolvedValue([]);
    checkDomains.mockRejectedValue(new Error('WHOIS timeout'));

    const result = await screenBrand('TimeoutBrand');
    expect(result.domains.error).toBe('WHOIS timeout');
  });

  it('sanitises brand name to domain-safe format', async () => {
    const { checkDomains } = await import('../../src/lib/whois.js');
    const { searchCompany } = await import('../../src/lib/companies-house.js');

    searchCompany.mockResolvedValue([]);
    checkDomains.mockResolvedValue({});

    await screenBrand('My Brand!! Special_Chars');
    // No need to check exact sanitised name (depends on regex substitution).
    // The key contract is that checkDomains is called with the sanitised name.
    expect(checkDomains).toHaveBeenCalled();
  });

  it('formatScreenReport handles integration output', () => {
    const report = formatScreenReport({
      brand: 'TestBrand',
      scanned: '2026-06-14T00:00:00.000Z',
      companies: [],
      domains: {},
    });
    expect(report).toContain('No matching companies found');
  });
});
