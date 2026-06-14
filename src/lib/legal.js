import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

const POLICY_TYPES = {
  privacy: 'privacy-policy.md',
  terms: 'terms-of-service.md',
  cookies: 'cookie-policy.md',
};

function loadTemplate(name) {
  const filePath = path.join(TEMPLATES_DIR, name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template not found: ${name}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function fillTemplate(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(pattern, value || `[${key}]`);
  }
  return result;
}

function variableHelp(type) {
  const common = [
    'company_name',
    'company_number',
    'company_address',
    'company_email',
    'company_website',
    'company_director',
    'date',
  ];

  const specific = {
    privacy: [...common, 'data_types', 'cookie_policy_url', 'ico_registration_number'],
    terms: [...common, 'service_description', 'liability_limit', 'governing_law'],
    cookies: [...common, 'cookie_types', 'analytics_providers', 'consent_mechanism'],
    sow: [
      'company_name', 'client_name', 'client_company',
      'project_description', 'deliverables', 'timeline',
      'payment_terms', 'rate', 'total_cost',
      'late_payment_interest', 'governing_law', 'date',
      'company_director', 'company_number',
    ],
  };

  return specific[type] || common;
}

function generatePolicy(type, vars) {
  const templateName = POLICY_TYPES[type];
  if (!templateName) {
    throw new Error(`Unknown policy type: ${type}. Use: privacy, terms, cookies`);
  }
  const template = loadTemplate(templateName);
  return fillTemplate(template, vars);
}

function generateContract(vars) {
  const template = loadTemplate('sow.md');
  return fillTemplate(template, vars);
}

function saveDocument(content, outputDir, filename) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

export { loadTemplate, fillTemplate, variableHelp, generatePolicy, generateContract, saveDocument, TEMPLATES_DIR, POLICY_TYPES };
