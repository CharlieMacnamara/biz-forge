# bizforge — Module Catalogue

This directory contains modular feature extensions. Each module is
self-contained with its own `index.js` (exports) and optional CLI script.

## Current Modules

Core modules live in `src/lib/` — Companies House, WHOIS, legal templates,
finances, GDPR audit, App Store, LLM. CLI scripts in `scripts/`.

## Planned

| Module | API Source | CLI | Replaces |
|---|---|---|---|
| trademark | IPO trademark search | `npm run trademark -- "Name"` | Trademark attorney (£500+) |
| sanctions | OpenSanctions | `npm run screen-aml -- "Name"` | KYC/AML provider (££/check) |
| land-registry | HM Land Registry | `npm run property -- "POSTCODE"` | £7/register (saves the trip) |
| banking | FCA Register + BoE API | `npm run bank-rate` | Manual lookups |
| invoice | PDF generation | `npm run invoice -- SOW.md` | FreeAgent (£9.50/mo) |

## Adding a Module

1. Create `modules/<name>/index.js` with exported functions
2. Optionally add `scripts/<name>.js` CLI runner
3. Register command in `src/index.js`
4. Add tests in `test/unit/modules/`
5. Update this manifest
