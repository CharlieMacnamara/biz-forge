import { describe, it, expect } from 'vitest';
import { formatCompanySummary } from '../../src/lib/companies-house.js';
import { COMPANIES_HOUSE_PROFILES } from '../helpers/fixtures.js';

describe('formatCompanySummary', () => {
  it('formats active company with visible address', () => {
    const result = formatCompanySummary(COMPANIES_HOUSE_PROFILES.active);
    expect(result.name).toBe('BBC');
    expect(result.companyNumber).toBe('00002065');
    expect(result.status).toBe('Active');
    expect(result.incorporationDate).toBe('1922-10-18');
    expect(result.type).toBe('plc');
    expect(result.address).toContain('Broadcasting House');
    expect(result.address).toContain('London');
    expect(result.address).toContain('W1A 1AA');
    expect(result.sicCodes).toEqual(['60200']);
  });

  it('formats dissolved company as "Dissolved"', () => {
    const result = formatCompanySummary(COMPANIES_HOUSE_PROFILES.dissolved);
    expect(result.status).toBe('Dissolved');
    expect(result.address).toBe('Not available');
    expect(result.sicCodes).toEqual([]);
  });

  it('formats liquidation company as "In Liquidation"', () => {
    const result = formatCompanySummary(COMPANIES_HOUSE_PROFILES.liquidation);
    expect(result.status).toBe('In Liquidation');
    expect(result.sicCodes).toEqual(['62012', '62090']);
  });

  it('handles company with no address object', () => {
    const result = formatCompanySummary(COMPANIES_HOUSE_PROFILES.noAddress);
    expect(result.address).toBe('Not available');
  });

  it('maps all known statuses correctly', () => {
    const statusMappings = [
      ['active', 'Active'],
      ['dissolved', 'Dissolved'],
      ['liquidation', 'In Liquidation'],
      ['receivership', 'In Receivership'],
      ['converted-closed', 'Converted/Closed'],
      ['voluntary-arrangement', 'Voluntary Arrangement'],
      ['insolvency-proceedings', 'Insolvency Proceedings'],
      ['administration', 'In Administration'],
      ['open', 'Open'],
      ['closed', 'Closed'],
    ];

    for (const [input, expected] of statusMappings) {
      const result = formatCompanySummary({
        company_name: 'Test',
        company_number: '00000000',
        company_status: input,
        date_of_creation: '2020-01-01',
        type: 'ltd',
      });
      expect(result.status).toBe(expected);
    }
  });

  it('passes through unknown status unchanged', () => {
    const result = formatCompanySummary({
      company_name: 'Unknown',
      company_number: '11111111',
      company_status: 'unknown-status-here',
      date_of_creation: '2020-01-01',
      type: 'ltd',
    });
    expect(result.status).toBe('unknown-status-here');
  });

  it('handles missing registered_office_address fields gracefully', () => {
    const result = formatCompanySummary({
      company_name: 'Partial Address Ltd',
      company_number: '22222222',
      company_status: 'active',
      date_of_creation: '2022-01-01',
      type: 'ltd',
      registered_office_address: {
        address_line_1: 'Only Street',
      },
    });
    expect(result.address).toContain('Only Street');
    expect(result.address).not.toContain('undefined');
  });
});
