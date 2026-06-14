import whoiser from 'whoiser';

const DEFAULT_TLDS = ['.co.uk', '.com', '.uk', '.io', '.dev'];

function parseWhoisEntry(entry) {
  if (!entry || typeof entry !== 'object') return { text: String(entry || ''), props: {} };
  // whoiser returns objects keyed by server name; value may have .text or flat props
  const text = entry.text || JSON.stringify(entry);
  return { text: typeof text === 'string' ? text : '', props: entry };
}

function isAvailable(parsed) {
  const t = parsed.text.toLowerCase();
  return t.includes('no data found')
    || t.includes('not found')
    || t.includes('no match')
    || t.includes('domain not found')
    || t.includes('no entries found')
    || t.includes('status: free')
    || t.includes('no object found');
}

function getExpiry(parsed) {
  return parsed.props?.['domain-expiration']
    || parsed.props?.['expiry date']
    || parsed.props?.['Domain Expiration Date']
    || parsed.props?.['Registry Expiry Date']
    || null;
}

function getRegistrar(parsed) {
  return parsed.props?.['registrar']
    || parsed.props?.['Registrar']
    || parsed.props?.['Sponsoring Registrar']
    || null;
}

async function checkDomain(domain) {
  const whois = await whoiser(domain, { timeout: 10000 });
  return whois;
}

async function checkDomains(name, tlds = DEFAULT_TLDS) {
  const results = {};
  for (const tld of tlds) {
    const domain = `${name}${tld}`;
    try {
      const whois = await whoiser(domain, { timeout: 15000 });
      const firstEntry = Object.values(whois)[0];
      const parsed = parseWhoisEntry(firstEntry);
      results[domain] = {
        domain,
        available: isAvailable(parsed),
        expires: getExpiry(parsed),
        registrar: getRegistrar(parsed),
      };
    } catch (err) {
      results[domain] = {
        domain,
        available: null,
        expires: null,
        error: err.message,
      };
    }
  }
  return results;
}

async function checkExpiry(domain) {
  try {
    const whois = await whoiser(domain, { timeout: 15000 });
    const firstEntry = Object.values(whois)[0];
    const parsed = parseWhoisEntry(firstEntry);
    return {
      domain,
      expires: getExpiry(parsed),
      registrar: getRegistrar(parsed),
      dnssec: parsed.props?.['dnssec'] || null,
      nameservers: parsed.props?.['name-servers'] || parsed.props?.['Name Server'] || null,
    };
  } catch (err) {
    return { domain, expires: null, error: err.message };
  }
}

export { checkDomain, checkDomains, checkExpiry, DEFAULT_TLDS };
