// Shared test fixtures for Rennet Systems tests

export const COMPANIES_HOUSE_PROFILES = {
  active: {
    company_name: 'BBC',
    company_number: '00002065',
    company_status: 'active',
    date_of_creation: '1922-10-18',
    type: 'plc',
    registered_office_address: {
      address_line_1: 'Broadcasting House',
      locality: 'London',
      postal_code: 'W1A 1AA',
    },
    sic_codes: ['60200'],
  },
  dissolved: {
    company_name: 'Old Co Ltd',
    company_number: '12345678',
    company_status: 'dissolved',
    date_of_creation: '1990-01-01',
    type: 'ltd',
    registered_office_address: null,
    sic_codes: [],
  },
  liquidation: {
    company_name: 'Bad Co Ltd',
    company_number: '87654321',
    company_status: 'liquidation',
    date_of_creation: '2010-06-15',
    type: 'ltd',
    registered_office_address: {
      address_line_1: '1 High Street',
      locality: 'Manchester',
      postal_code: 'M1 1AA',
    },
    sic_codes: ['62012', '62090'],
  },
  noAddress: {
    company_name: 'No Address Ltd',
    company_number: '99999999',
    company_status: 'active',
    date_of_creation: '2020-01-01',
    type: 'ltd',
    sic_codes: [],
  },
};

export const WHOIS_ENTRIES = {
  notFound: {
    text: 'No data found',
  },
  registered: {
    text: 'Domain registered',
    'domain-expiration': '2027-06-01',
    'registrar': 'Namecheap',
    'name-servers': ['ns1.example.com', 'ns2.example.com'],
    'dnssec': 'unsigned',
  },
  ukRegistered: {
    text: 'Domain is registered',
    'expiry date': '2026-12-31',
    'Registrar': '123-Reg',
    'Name Server': 'ns1.123-reg.co.uk',
  },
  free: {
    text: 'Status: free',
  },
  noMatch: {
    text: 'No match for domain',
  },
  noEntriesFound: {
    text: 'No entries found',
  },
  empty: null,
  stringOnly: 'Some raw text response',
};

export const TEMPLATE_VARS = {
  company_name: 'Rennet Systems Ltd',
  company_number: '12345678',
  company_address: 'London, UK',
  company_email: 'hello@rennet-systems.com',
  company_website: 'https://rennet-systems.com',
  company_director: 'Charlie Macnamara',
  date: '2026-06-14',
  client_name: 'Test Client',
  client_company: 'Test Client Ltd',
  start_date: '2026-07-01',
  end_date: '2026-08-15',
  deliverables: 'Build a website with 5 pages',
  total_cost: '5000',
  payment_terms: '50% upfront, 50% on completion',
  late_payment_interest: '8% + BoE base',
  governing_law: 'England and Wales',
  service_description: 'Web development services',
  liability_limit: 'Total fees paid',
  data_types: 'Name, email, IP address',
  cookie_policy_url: 'https://rennet-systems.com/cookies',
  ico_registration_number: 'ZA123456',
  cookie_types: 'Strictly necessary, Analytics',
  analytics_providers: 'Cloudflare',
  consent_mechanism: 'Banner with accept/reject',
};

export const HTML_SAMPLES = {
  compliant: `<!DOCTYPE html><html lang="en"><head><title>Test Site</title><meta name="description" content="test"></head><body><footer><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a></footer><div id="cookie-banner">Accept cookies</div><form><input type="text" name="email"></form><p>We collect your data in accordance with GDPR</p></body></html>`,
  noPrivacy: `<!DOCTYPE html><html><head><title>No Privacy</title></head><body><p>Welcome</p><form><input type="text" name="email"></form></body></html>`,
  noSsl: `<!DOCTYPE html><html><head><title>http site</title></head><body></body></html>`,
  noLang: `<html><head><title>No lang</title></head><body></body></html>`,
};
