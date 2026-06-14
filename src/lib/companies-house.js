import { createApiClient } from '@companieshouse/api-sdk-node';

let client = null;

function getClient() {
  if (client) return client;
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    throw new Error('COMPANIES_HOUSE_API_KEY not set in .env');
  }
  client = createApiClient({ apiKey });
  return client;
}

async function searchCompany(name) {
  const c = getClient();
  const result = await c.company.search(name);
  if (result.isError()) {
    throw new Error(`Companies House API error: ${result.value}`);
  }
  return result.value.items || [];
}

async function getCompany(companyNumber) {
  const c = getClient();
  const result = await c.company.getCompanyProfile(companyNumber);
  if (result.isError()) {
    throw new Error(`Companies House API error: ${result.value}`);
  }
  return result.value;
}

async function getOfficers(companyNumber) {
  const c = getClient();
  const result = await c.company.getOfficers(companyNumber);
  if (result.isError()) {
    throw new Error(`Companies House API error: ${result.value}`);
  }
  return result.value.items || [];
}

async function getFilingHistory(companyNumber) {
  const c = getClient();
  const result = await c.company.getFilingHistory(companyNumber);
  if (result.isError()) {
    throw new Error(`Companies House API error: ${result.value}`);
  }
  return result.value.items || [];
}

function formatCompanySummary(company) {
  const statusLabels = {
    active: 'Active',
    dissolved: 'Dissolved',
    liquidation: 'In Liquidation',
    'receivership': 'In Receivership',
    'converted-closed': 'Converted/Closed',
    'voluntary-arrangement': 'Voluntary Arrangement',
    'insolvency-proceedings': 'Insolvency Proceedings',
    'administration': 'In Administration',
    'open': 'Open',
    'closed': 'Closed',
  };
  return {
    companyNumber: company.company_number,
    name: company.company_name,
    status: statusLabels[company.company_status] || company.company_status,
    incorporationDate: company.date_of_creation,
    type: company.type,
    address: company.registered_office_address
      ? `${company.registered_office_address.address_line_1 || ''}, ${company.registered_office_address.locality || ''}, ${company.registered_office_address.postal_code || ''}`
      : 'Not available',
    sicCodes: company.sic_codes || [],
  };
}

export { searchCompany, getCompany, getOfficers, getFilingHistory, formatCompanySummary };
