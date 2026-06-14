import { describe, it, expect } from 'vitest';
import { formatScreenReport } from '../../src/lib/brand-screen.js';

describe('formatScreenReport', () => {
  it('reports no matching companies and no domains', () => {
    const results = {
      brand: 'UniqueName',
      scanned: '2026-06-14T00:00:00.000Z',
      companies: [],
      domains: {},
    };
    const report = formatScreenReport(results);
    expect(report).toContain('UniqueName');
    expect(report).toContain('No matching companies found');
    expect(report).toContain('Domain Availability');
  });

  it('reports company conflicts with status icons', () => {
    const results = {
      brand: 'CommonName',
      scanned: '2026-06-14T00:00:00.000Z',
      companies: [
        { name: 'CommonName Ltd', companyNumber: '12345678', status: 'Active' },
        { name: 'CommonName 2020 Ltd', companyNumber: '87654321', status: 'Dissolved' },
      ],
      domains: {},
    };
    const report = formatScreenReport(results);
    expect(report).toContain('2 matching company/companies found');
    expect(report).toContain('CommonName Ltd');
    expect(report).toContain('CommonName 2020 Ltd');
  });

  it('truncates companies list at 10 with note', () => {
    const companies = Array.from({ length: 15 }, (_, i) => ({
      name: `Company ${i}`,
      companyNumber: `${i}`.padStart(8, '0'),
      status: 'Active',
    }));
    const results = {
      brand: 'ManyResults',
      scanned: '2026-06-14T00:00:00.000Z',
      companies,
      domains: {},
    };
    const report = formatScreenReport(results);
    expect(report).toContain('... and 5 more');
  });

  it('reports API error for companies', () => {
    const results = {
      brand: 'ErrorBrand',
      scanned: '2026-06-14T00:00:00.000Z',
      companies: { error: 'API rate limit exceeded' },
      domains: {},
    };
    const report = formatScreenReport(results);
    expect(report).toContain('API Error');
    expect(report).toContain('API rate limit exceeded');
  });

  it('reports available and taken domains with icons', () => {
    const results = {
      brand: 'TestBrand',
      scanned: '2026-06-14T00:00:00.000Z',
      companies: [],
      domains: {
        'testbrand.co.uk': { domain: 'testbrand.co.uk', available: true, expires: null, registrar: null },
        'testbrand.com': { domain: 'testbrand.com', available: false, expires: '2027-06-01', registrar: 'Namecheap' },
        'testbrand.io': { domain: 'testbrand.io', available: true, expires: null, registrar: null },
      },
    };
    const report = formatScreenReport(results);
    expect(report).toContain('AVAILABLE');
    expect(report).toContain('TAKEN');
    expect(report).toContain('testbrand.co.uk');
    expect(report).toContain('testbrand.com');
    expect(report).toContain('(expires 2027-06-01)');
  });

  it('reports domain lookup errors', () => {
    const results = {
      brand: 'ErrorDomain',
      scanned: '2026-06-14T00:00:00.000Z',
      companies: [],
      domains: {
        'errordomain.com': { domain: 'errordomain.com', available: null, error: 'whois rate limit' },
      },
    };
    const report = formatScreenReport(results);
    expect(report).toContain('lookup failed');
    expect(report).toContain('whois rate limit');
  });

  it('shows taken domains without expiry when none', () => {
    const results = {
      brand: 'Brand',
      scanned: '2026-06-14T00:00:00.000Z',
      companies: [],
      domains: {
        'brand.com': { domain: 'brand.com', available: false, expires: null, registrar: null },
      },
    };
    const report = formatScreenReport(results);
    expect(report).toContain('TAKEN');
    expect(report).not.toContain('expires');
  });
});
