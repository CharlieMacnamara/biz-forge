import { describe, it, expect } from 'vitest';
import {
  checkEnv,
  checkTemplates,
  checkApiKeys,
  checkInsurance,
  checkCompany,
  checkVat,
  checkEmail,
  checkDomain,
  runReadinessCheck,
  getVerdict,
} from '../../src/lib/readiness.js';

/* ------------------------------------------------------------------ */
/*  checkEnv                                                            */
/* ------------------------------------------------------------------ */
describe('checkEnv', () => {
  it('all required env set → all pass, no failures', () => {
    const env = {
      COMPANY_NAME: 'BizForge Ltd',
      COMPANY_EMAIL: 'hello@bizforge.com',
      COMPANY_NUMBER: '12345678',
      COMPANY_VAT_NUMBER: 'GB123456789',
      COMPANY_ADDRESS: '123 London Street',
      COMPANY_DIRECTOR_NAME: 'Charlie Macnamara',
    };
    const results = checkEnv(env);
    // COMPANY_NAME, COMPANY_EMAIL, COMPANY_NUMBER → critical, all pass
    const criticals = results.filter(r => r.severity === 'critical');
    expect(criticals.every(c => c.pass)).toBe(true);
    // COMPANY_VAT_NUMBER → warning, pass
    const vat = results.find(r => r.check === 'COMPANY_VAT_NUMBER');
    expect(vat.pass).toBe(true);
    expect(vat.severity).toBe('warning');
    expect(results.every(r => r.pass)).toBe(true);
  });

  it('COMPANY_EMAIL missing → critical failure in results', () => {
    const env = {
      COMPANY_NAME: 'BizForge Ltd',
      COMPANY_NUMBER: '12345678',
    };
    const results = checkEnv(env);
    const email = results.find(r => r.check === 'COMPANY_EMAIL');
    expect(email.pass).toBe(false);
    expect(email.severity).toBe('critical');
  });

  it('COMPANY_EMAIL has `[bracket]` → critical failure (placeholder)', () => {
    const env = {
      COMPANY_EMAIL: '[your-email]',
      COMPANY_NAME: 'BizForge Ltd',
      COMPANY_NUMBER: '12345678',
    };
    const results = checkEnv(env);
    const email = results.find(r => r.check === 'COMPANY_EMAIL');
    expect(email.pass).toBe(false);
    expect(email.severity).toBe('critical');
    expect(email.detail.toLowerCase()).toContain('placeholder');
  });

  it('COMPANY_VAT_NUMBER missing → warning (not critical)', () => {
    const env = {
      COMPANY_NAME: 'BizForge Ltd',
      COMPANY_EMAIL: 'hello@bizforge.com',
      COMPANY_NUMBER: '12345678',
    };
    const results = checkEnv(env);
    const vat = results.find(r => r.check === 'COMPANY_VAT_NUMBER');
    expect(vat.pass).toBe(false);
    expect(vat.severity).toBe('warning');
  });

  it('COMPANY_VAT_NUMBER has `[bracket]` → warning', () => {
    const env = {
      COMPANY_NAME: 'BizForge Ltd',
      COMPANY_EMAIL: 'hello@bizforge.com',
      COMPANY_NUMBER: '12345678',
      COMPANY_VAT_NUMBER: '[your-vat-number]',
    };
    const results = checkEnv(env);
    const vat = results.find(r => r.check === 'COMPANY_VAT_NUMBER');
    expect(vat.pass).toBe(false);
    expect(vat.severity).toBe('warning');
    expect(vat.detail.toLowerCase()).toContain('placeholder');
  });

  it('all env empty → multiple failures, 0 passes', () => {
    const env = {};
    const results = checkEnv(env);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.pass === false)).toBe(true);
  });

  it('empty object passed → handled gracefully (no crash)', () => {
    expect(() => checkEnv({})).not.toThrow();
    expect(() => checkEnv(undefined)).not.toThrow();
    expect(() => checkEnv(null)).not.toThrow();
  });
});

/* ------------------------------------------------------------------ */
/*  checkInsurance                                                      */
/* ------------------------------------------------------------------ */
describe('checkInsurance', () => {
  it('future date (2027-06-30) → pass', () => {
    const results = checkInsurance('2027-06-30');
    expect(results[0].pass).toBe(true);
    expect(results[0].severity).toBe('warning');
  });

  it('past date (2020-01-01) → critical fail', () => {
    const results = checkInsurance('2020-01-01');
    expect(results[0].pass).toBe(false);
    expect(results[0].severity).toBe('critical');
  });

  it('not set (empty string) → warning', () => {
    const results = checkInsurance('');
    expect(results[0].pass).toBe(false);
    expect(results[0].severity).toBe('warning');
  });

  it('invalid date string → warning', () => {
    const results = checkInsurance('not-a-date');
    expect(results[0].pass).toBe(false);
    expect(results[0].severity).toBe('warning');
  });
});

/* ------------------------------------------------------------------ */
/*  checkTemplates                                                      */
/* ------------------------------------------------------------------ */
describe('checkTemplates', () => {
  const ALL = [
    'sow.md',
    'privacy-policy.md',
    'terms-of-service.md',
    'cookie-policy.md',
    'dividend-voucher.md',
    'board-minutes.md',
  ];

  it('all 6 templates present → all pass', () => {
    const results = checkTemplates(ALL);
    expect(results).toHaveLength(6);
    expect(results.every(r => r.pass)).toBe(true);
  });

  it('missing 3 templates → 3 warnings, detail about missing files', () => {
    const results = checkTemplates(['sow.md', 'privacy-policy.md', 'terms-of-service.md']);
    expect(results).toHaveLength(6);
    expect(results.filter(r => r.pass)).toHaveLength(3);
    expect(results.filter(r => !r.pass)).toHaveLength(3);
    const missing = results.filter(r => !r.pass);
    expect(missing.every(m => m.detail.toLowerCase().includes('missing'))).toBe(true);
  });

  it('empty array → 6 warnings', () => {
    const results = checkTemplates([]);
    expect(results).toHaveLength(6);
    expect(results.every(r => r.pass === false)).toBe(true);
    expect(results.every(r => r.severity === 'warning')).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  checkApiKeys                                                        */
/* ------------------------------------------------------------------ */
describe('checkApiKeys', () => {
  it('COMPANIES_HOUSE_API_KEY present and non-bracket → pass', () => {
    const env = { COMPANIES_HOUSE_API_KEY: 'abc123def456' };
    const results = checkApiKeys(env);
    const key = results.find(r => r.check === 'COMPANIES_HOUSE_API_KEY');
    expect(key.pass).toBe(true);
  });

  it('missing COMPANIES_HOUSE_API_KEY → warning', () => {
    const env = {};
    const results = checkApiKeys(env);
    const key = results.find(r => r.check === 'COMPANIES_HOUSE_API_KEY');
    expect(key.pass).toBe(false);
    expect(key.severity).toBe('warning');
  });

  it('placeholder bracket value → warning', () => {
    const env = { COMPANIES_HOUSE_API_KEY: '[your-api-key]' };
    const results = checkApiKeys(env);
    const key = results.find(r => r.check === 'COMPANIES_HOUSE_API_KEY');
    expect(key.pass).toBe(false);
    expect(key.severity).toBe('warning');
  });
});

/* ------------------------------------------------------------------ */
/*  checkCompany                                                        */
/* ------------------------------------------------------------------ */
describe('checkCompany', () => {
  it('all company fields set → all pass', () => {
    const env = {
      COMPANY_NUMBER: '12345678',
      COMPANY_ADDRESS: '123 London Street',
      COMPANY_EMAIL: 'hello@bizforge.com',
      COMPANY_DIRECTOR_NAME: 'Charlie Macnamara',
    };
    const results = checkCompany(env);
    expect(results).toHaveLength(4);
    expect(results.every(r => r.pass)).toBe(true);
  });

  it('missing COMPANY_NUMBER → fail', () => {
    const env = {
      COMPANY_ADDRESS: '123 London Street',
      COMPANY_EMAIL: 'hello@bizforge.com',
      COMPANY_DIRECTOR_NAME: 'Charlie Macnamara',
    };
    const results = checkCompany(env);
    const num = results.find(r => r.check === 'COMPANY_NUMBER');
    expect(num.pass).toBe(false);
  });

  it('placeholder bracket values → fail', () => {
    const env = {
      COMPANY_NUMBER: '[your-company-number]',
      COMPANY_ADDRESS: '123 London Street',
      COMPANY_EMAIL: 'hello@bizforge.com',
      COMPANY_DIRECTOR_NAME: 'Charlie Macnamara',
    };
    const results = checkCompany(env);
    const num = results.find(r => r.check === 'COMPANY_NUMBER');
    expect(num.pass).toBe(false);
    expect(num.detail.toLowerCase()).toContain('placeholder');
  });
});

/* ------------------------------------------------------------------ */
/*  checkVat                                                            */
/* ------------------------------------------------------------------ */
describe('checkVat', () => {
  it('valid VAT number → pass', () => {
    const results = checkVat('GB123456789');
    expect(results[0].pass).toBe(true);
  });

  it('empty VAT number → fail', () => {
    const results = checkVat('');
    expect(results[0].pass).toBe(false);
    expect(results[0].severity).toBe('warning');
  });

  it('null VAT number → handled gracefully', () => {
    expect(() => checkVat(null)).not.toThrow();
    const results = checkVat(null);
    expect(results[0].pass).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  checkEmail                                                          */
/* ------------------------------------------------------------------ */
describe('checkEmail', () => {
  it('valid email → pass', () => {
    const results = checkEmail('hello@bizforge.com');
    expect(results[0].pass).toBe(true);
  });

  it('invalid email → fail', () => {
    const results = checkEmail('not-an-email');
    expect(results[0].pass).toBe(false);
  });

  it('empty email → fail', () => {
    const results = checkEmail('');
    expect(results[0].pass).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  checkDomain                                                         */
/* ------------------------------------------------------------------ */
describe('checkDomain', () => {
  it('valid domain → pass', () => {
    const results = checkDomain('bizforge.com');
    expect(results[0].pass).toBe(true);
  });

  it('empty domain → fail', () => {
    const results = checkDomain('');
    expect(results[0].pass).toBe(false);
  });

  it('domain with protocol → still considered valid', () => {
    const results = checkDomain('https://bizforge.com');
    expect(results[0].pass).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  runReadinessCheck                                                   */
/* ------------------------------------------------------------------ */
describe('runReadinessCheck', () => {
  it('all valid, all present → score 100, verdict GREEN', () => {
    const env = {
      COMPANY_NAME: 'BizForge Ltd',
      COMPANY_EMAIL: 'hello@bizforge.com',
      COMPANY_NUMBER: '12345678',
      COMPANY_VAT_NUMBER: 'GB123456789',
      COMPANY_ADDRESS: '123 London Street',
      COMPANY_DIRECTOR_NAME: 'Charlie Macnamara',
      COMPANIES_HOUSE_API_KEY: 'abc123',
    };
    const templates = [
      'sow.md',
      'privacy-policy.md',
      'terms-of-service.md',
      'cookie-policy.md',
      'dividend-voucher.md',
      'board-minutes.md',
    ];
    const result = runReadinessCheck({ env, templates, insuranceExpiry: '2027-06-30' });
    expect(result.score).toBe(100);
    expect(result.verdict).toBe('GREEN');
    expect(result.summary.passed).toBe(result.summary.total);
    expect(result.summary.failed).toBe(0);
    expect(result.summary.critical).toBe(0);
  });

  it('partially valid → verdict RED or AMBER based on actual score', () => {
    const env = {
      COMPANY_NAME: 'BizForge Ltd',
      COMPANY_EMAIL: 'hello@bizforge.com',
      // COMPANY_NUMBER missing
      // COMPANY_VAT_NUMBER missing
      COMPANY_ADDRESS: '123 London Street',
      COMPANY_DIRECTOR_NAME: 'Charlie Macnamara',
      // COMPANIES_HOUSE_API_KEY missing
    };
    const result = runReadinessCheck({
      env,
      templates: ['sow.md', 'privacy-policy.md', 'terms-of-service.md'],
      insuranceExpiry: '2020-01-01',
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
    expect(['AMBER', 'RED']).toContain(result.verdict);
  });

  it('all failing → score 0, verdict RED', () => {
    const result = runReadinessCheck({ env: {}, templates: [], insuranceExpiry: '' });
    expect(result.score).toBe(0);
    expect(result.verdict).toBe('RED');
    expect(result.summary.passed).toBe(0);
    expect(result.summary.failed).toBe(result.summary.total);
  });

  it('empty config → no crash, all failing', () => {
    expect(() => runReadinessCheck({})).not.toThrow();
    const result = runReadinessCheck({});
    expect(result.verdict).toBe('RED');
    expect(result.summary.total).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/*  getVerdict                                                          */
/* ------------------------------------------------------------------ */
describe('getVerdict', () => {
  it('score 100 → GREEN', () => {
    expect(getVerdict(100)).toBe('GREEN');
  });

  it('score 85 → GREEN', () => {
    expect(getVerdict(85)).toBe('GREEN');
  });

  it('score 84 → AMBER', () => {
    expect(getVerdict(84)).toBe('AMBER');
  });

  it('score 60 → AMBER', () => {
    expect(getVerdict(60)).toBe('AMBER');
  });

  it('score 59 → RED', () => {
    expect(getVerdict(59)).toBe('RED');
  });

  it('score 0 → RED', () => {
    expect(getVerdict(0)).toBe('RED');
  });

  it('score -1 → RED (graceful handling of invalid input)', () => {
    expect(getVerdict(-1)).toBe('RED');
  });
});
