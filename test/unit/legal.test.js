import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  loadTemplate,
  fillTemplate,
  variableHelp,
  generatePolicy,
  generateContract,
  saveDocument,
  TEMPLATES_DIR,
  POLICY_TYPES,
} from '../../src/lib/legal.js';

describe('loadTemplate', () => {
  it('loads sow.md template with company_name variable', () => {
    const t = loadTemplate('sow.md');
    expect(t).toContain('{{company_name}}');
    expect(t).toContain('{{client_name}}');
    expect(t).toContain('{{deliverables}}');
  });

  it('loads privacy-policy.md template', () => {
    const t = loadTemplate('privacy-policy.md');
    expect(t).toContain('{{company_name}}');
    expect(t).toContain('{{date}}');
    expect(t).toContain('{{data_types}}');
  });

  it('loads terms-of-service.md template', () => {
    const t = loadTemplate('terms-of-service.md');
    expect(t).toContain('{{company_name}}');
    expect(t).toContain('{{service_description}}');
  });

  it('loads cookie-policy.md template', () => {
    const t = loadTemplate('cookie-policy.md');
    expect(t).toContain('{{company_name}}');
    expect(t).toContain('{{analytics_providers}}');
  });

  it('throws error for missing template', () => {
    expect(() => loadTemplate('nonexistent.md')).toThrow('Template not found');
  });
});

describe('fillTemplate', () => {
  it('substitutes all variables in a template', () => {
    const result = fillTemplate('Hello {{name}}', { name: 'Rennet' });
    expect(result).toBe('Hello Rennet');
  });

  it('handles whitespace around variable names', () => {
    const result = fillTemplate('Hello {{  name  }}', { name: 'World' });
    expect(result).toBe('Hello World');
  });

  it('leaves missing variables unchanged when not in vars object', () => {
    const result = fillTemplate('{{name}} is {{age}} years old', { name: 'Charlie' });
    expect(result).toBe('Charlie is {{age}} years old');
  });

  it('handles multiple occurrences of the same variable', () => {
    const result = fillTemplate('{{name}} {{name}}', { name: 'echo' });
    expect(result).toBe('echo echo');
  });

  it('handles empty vars object — leaves all variables intact', () => {
    const result = fillTemplate('{{a}}{{b}}', {});
    expect(result).toBe('{{a}}{{b}}');
  });

  it('handles special regex chars in values', () => {
    const result = fillTemplate('{{x}}', { x: '$100 (20%) + tax' });
    expect(result).toBe('$100 (20%) + tax');
  });

  it('handles empty template string', () => {
    const result = fillTemplate('', { anything: 'value' });
    expect(result).toBe('');
  });

  it('returns template unchanged when no variables present', () => {
    const result = fillTemplate('Plain text without variables', { a: 'b' });
    expect(result).toBe('Plain text without variables');
  });
});

describe('variableHelp', () => {
  it('returns common variables for all types', () => {
    const vars = variableHelp('unknown');
    expect(vars).toContain('company_name');
    expect(vars).toContain('company_number');
    expect(vars).toContain('company_address');
    expect(vars).toContain('date');
  });

  it('returns privacy-specific variables', () => {
    const vars = variableHelp('privacy');
    expect(vars).toContain('cookie_policy_url');
    expect(vars).toContain('ico_registration_number');
  });

  it('returns terms-specific variables', () => {
    const vars = variableHelp('terms');
    expect(vars).toContain('service_description');
    expect(vars).toContain('liability_limit');
    expect(vars).toContain('governing_law');
  });

  it('returns cookies-specific variables', () => {
    const vars = variableHelp('cookies');
    expect(vars).toContain('cookie_types');
    expect(vars).toContain('analytics_providers');
    expect(vars).toContain('consent_mechanism');
  });

  it('returns sow-specific variables', () => {
    const vars = variableHelp('sow');
    expect(vars).toContain('client_name');
    expect(vars).toContain('project_description');
    expect(vars).toContain('payment_terms');
    expect(vars).toContain('late_payment_interest');
  });
});

describe('generatePolicy', () => {
  const vars = {
    company_name: 'Rennet Systems Ltd',
    company_number: '12345678',
    company_address: 'London, UK',
    company_email: 'hello@rennet-systems.com',
    company_website: 'https://rennet-systems.com',
    company_director: 'Charlie Macnamara',
    date: '2026-06-14',
    data_types: 'Name, email, IP address',
    cookie_policy_url: 'https://rennet-systems.com/cookies',
    ico_registration_number: 'ZA123456',
  };

  it('generates privacy policy with variable substitution', () => {
    const doc = generatePolicy('privacy', vars);
    expect(doc).toContain('Rennet Systems Ltd');
    expect(doc).toContain('2026-06-14');
    expect(doc).toContain('Name, email, IP address');
    expect(doc).toContain('UK GDPR');
  });

  it('generates terms of service', () => {
    const termsVars = {
      ...vars,
      service_description: 'Web development services',
      liability_limit: 'Total fees paid',
      governing_law: 'England and Wales',
    };
    const doc = generatePolicy('terms', termsVars);
    expect(doc).toContain('Web development services');
    expect(doc).toContain('Terms of Service');
  });

  it('generates cookie policy', () => {
    const cookieVars = {
      ...vars,
      cookie_types: 'Strictly necessary, Analytics',
      analytics_providers: 'Cloudflare',
      consent_mechanism: 'Banner',
    };
    const doc = generatePolicy('cookies', cookieVars);
    expect(doc).toContain('Cloudflare');
    expect(doc).toContain('Cookie Policy');
  });

  it('throws error for unknown policy type', () => {
    expect(() => generatePolicy('invalid', {})).toThrow('Unknown policy type');
  });
});

describe('generateContract', () => {
  const vars = {
    company_name: 'Rennet Systems Ltd',
    company_number: '12345678',
    company_address: 'London, UK',
    company_email: 'hello@rennet-systems.com',
    company_director: 'Charlie Macnamara',
    date: '2026-06-14',
    client_name: 'Test Client',
    client_company: 'Test Client Ltd',
    start_date: '2026-07-01',
    end_date: '2026-08-15',
    deliverables: 'Build a website with 5 pages',
    total_cost: '5000',
    payment_terms: '50% upfront, 50% on completion',
    late_payment_interest: '8% above Bank of England base rate',
    governing_law: 'England and Wales',
  };

  it('generates SOW with all critical sections', () => {
    const doc = generateContract(vars);
    expect(doc).toContain('Rennet Systems Ltd');
    expect(doc).toContain('Test Client');
    expect(doc).toContain('Build a website with 5 pages');
    expect(doc).toContain('Statement of Work');
    expect(doc).toContain('Late Payment');
    expect(doc).toContain('Intellectual Property');
    expect(doc).toContain('Limitation of Liability');
    expect(doc).toContain('Confidentiality');
    expect(doc).toContain('Governing Law');
  });

  it('includes all parties', () => {
    const doc = generateContract(vars);
    expect(doc).toContain('Provider:');
    expect(doc).toContain('Client:');
  });
});

describe('saveDocument', () => {
  const outputDir = path.join(os.tmpdir(), 'rennet-test-' + Date.now());

  afterEach(() => {
    fs.rmSync(outputDir, { recursive: true, force: true });
  });

  it('creates directory and saves file', () => {
    const filePath = saveDocument('test content', outputDir, 'test.md');
    expect(fs.existsSync(outputDir)).toBe(true);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toBe('test content');
  });

  it('returns absolute file path', () => {
    const filePath = saveDocument('content', outputDir, 'doc.md');
    expect(path.isAbsolute(filePath)).toBe(true);
    expect(filePath).toContain('doc.md');
  });

  it('handles nested directory creation', () => {
    const nestedDir = path.join(outputDir, 'sub', 'dir');
    const filePath = saveDocument('nested', nestedDir, 'file.md');
    expect(fs.existsSync(nestedDir)).toBe(true);
    expect(fs.existsSync(filePath)).toBe(true);
  });
});
