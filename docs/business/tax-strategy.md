# Tax Strategy — Rennet Systems

## 2026/27 Tax Rates Summary

| Item | Rate |
|------|------|
| Personal Allowance | £12,570 |
| Dividend Allowance | £500 |
| Corp Tax (profits ≤£50k) | 19% |
| Corp Tax (profits £50k-£250k) | Marginal relief (19%-25%) |
| Corp Tax (profits >£250k) | 25% |
| Dividend basic rate | 10.75% |
| Dividend higher rate | 35.75% |
| Dividend additional rate | 39.35% |
| Employer NI | 15% above £5,000/yr |
| Employee NI (basic) | 8% above £12,570 |
| VAT threshold | £90,000 |
| VAT flat rate (IT consult) | 14.5% (13.5% first year) |
| Employment Allowance | £10,500 off employer NI bill |

## Optimal Extraction Method

1. Take **£12,570 salary** — uses Personal Allowance, no income tax, minimal NI
2. Take remaining profit as **dividends** — lower tax than salary, no NI
3. Maximise **pension contributions** — 100% CT deductible, 0% NI, tax-free growth

## Run the Calculator

```
npm run strategy -- YOUR_ANNUAL_REVENUE
npm run strategy -- 60000
npm run strategy -- 100000
```

## Key Tax-Saving Strategies

### 1. Pension Contributions
Company can contribute directly to your SIPP — fully deductible from Corp Tax, no NI.
Annual allowance: £60,000 (can carry forward unused allowance from 3 prior years).

### 2. Dividends vs Salary
Dividends have no NI. Combined with salary at Personal Allowance threshold, this is the most tax-efficient extraction method.

### 3. Flat Rate VAT Scheme
If turnover under £150k, you can join the Flat Rate Scheme for IT consultancy at 14.5% (13.5% first year). You charge clients 20% VAT but only pay HMRC the lower rate — keeping the difference as tax-free profit.

### 4. R&D Tax Credits (Merged RDEC Scheme)
Qualifying innovative development work (novel features, speech processing, accessibility) can claim 20% expenditure credit. Skillio development and novel client features may qualify.

### 5. Expenses
Claim: equipment (100% first-year allowance), software subscriptions, home office portion, internet, mobile, training, insurance, accountancy, domain names, hosting.

### 6. Trivial Benefits
Up to £50 per benefit, no limit on quantity — tax-free for you, deductible for the company.

## Recommended Software Stack (all free tiers available)

- **Accounting**: FreeAgent (free with Tide bank account)
- **Payroll**: FreeAgent
- **Invoicing**: FreeAgent
- **Pension**: Vanguard SIPP or AJ Bell
