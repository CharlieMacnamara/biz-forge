// Tax year 2026/27 thresholds
const TAX_YEAR = '2026/27';

const THRESHOLDS = {
  personalAllowance: 12570,
  basicRateBand: 37700,
  higherRateBand: 125140,
  dividendAllowance: 500,
  dividendBasicRate: 0.1075,
  dividendHigherRate: 0.3575,
  dividendAdditionalRate: 0.3935,
  corpTaxSmallProfits: 50000,
  corpTaxMainThreshold: 250000,
  corpTaxSmallRate: 0.19,
  corpTaxMainRate: 0.25,
  vatThreshold: 90000,
  vatBuffer: 85000,
  vatStandardRate: 0.20,
  vatFRSITConsultancy: 0.145,
  vatFRSFirstYearDiscount: 0.01,
  employerNIPrimaryThreshold: 5000,
  employerNIRate: 0.15,
  employeeNIPrimaryThreshold: 12570,
  employeeNIBasicRate: 0.08,
  employeeNIHigherRate: 0.02,
  employmentAllowance: 10500,
  pensionAnnualAllowance: 60000,
  trivialBenefitLimit: 50,
  annualEventLimit: 150,
  latePaymentBaseRate: 0.08,
};

function corpTax(profit) {
  if (profit <= THRESHOLDS.corpTaxSmallProfits) {
    return profit * THRESHOLDS.corpTaxSmallRate;
  }
  if (profit >= THRESHOLDS.corpTaxMainThreshold) {
    return profit * THRESHOLDS.corpTaxMainRate;
  }
  // Marginal relief — blended rate between 19% and 25%
  const marginal = THRESHOLDS.corpTaxMainRate - THRESHOLDS.corpTaxSmallRate;
  const fraction = (profit - THRESHOLDS.corpTaxSmallProfits) / (THRESHOLDS.corpTaxMainThreshold - THRESHOLDS.corpTaxSmallProfits);
  return profit * (THRESHOLDS.corpTaxSmallRate + marginal * fraction);
}

function optimalSalary() {
  return {
    salary: THRESHOLDS.personalAllowance,
    employeeNI: 0,
    employerNI: Math.max(0, (THRESHOLDS.personalAllowance - THRESHOLDS.employerNIPrimaryThreshold) * THRESHOLDS.employerNIRate),
    employerNIEligibleForAllowance: true,
    note: `£${THRESHOLDS.personalAllowance.toLocaleString()} salary uses full Personal Allowance, incurs no income tax, and employee NI is £0 at the primary threshold.`,
  };
}

function pensionSaving(amount) {
  const ctRate = THRESHOLDS.corpTaxSmallRate;
  const ctSaved = amount * ctRate;
  const niSaved = amount * THRESHOLDS.employerNIRate;
  return {
    contribution: amount,
    corpTaxSaved: ctSaved,
    employerNISaved: 0,
    totalSaved: ctSaved,
    effectiveCost: amount - ctSaved,
    note: `Pension contributions are CT-deductible and NI-free. Every £1 contributed costs the company approximately £${(1 - ctRate).toFixed(2)} after CT relief.`,
  };
}

function dividendTax(dividendIncome, otherIncome = 0) {
  const totalIncome = otherIncome + dividendIncome;
  if (totalIncome <= THRESHOLDS.personalAllowance) {
    return 0;
  }

  const taxableDividend = Math.max(0, dividendIncome - THRESHOLDS.dividendAllowance);
  if (taxableDividend === 0) return 0;

  const basicRateRemaining = Math.max(0, (THRESHOLDS.personalAllowance + THRESHOLDS.basicRateBand) - otherIncome);

  if (taxableDividend <= basicRateRemaining) {
    return taxableDividend * THRESHOLDS.dividendBasicRate;
  }

  const atBasic = basicRateRemaining * THRESHOLDS.dividendBasicRate;
  const atHigher = (taxableDividend - basicRateRemaining) * THRESHOLDS.dividendHigherRate;
  return atBasic + atHigher;
}

function flatRateVat(annualTurnover) {
  const gross = annualTurnover * (1 + THRESHOLDS.vatStandardRate);
  const rate = THRESHOLDS.vatFRSITConsultancy - THRESHOLDS.vatFRSFirstYearDiscount;
  const payable = gross * rate;
  const collected = gross * THRESHOLDS.vatStandardRate;
  const surplus = collected - payable;
  return {
    annualTurnover,
    grossReceipts: gross,
    vatCollected: collected,
    vatPayable: payable,
    vatSurplus: surplus,
    effectiveRate: rate,
    note: surplus > 0
      ? `Flat rate scheme saves ~£${Math.round(surplus)}/yr compared to standard accounting. The ${(rate * 100).toFixed(1)}% rate includes a 1% first-year discount.`
      : 'Standard VAT accounting may be more suitable.',
  };
}

function employerNI(salary) {
  if (salary <= THRESHOLDS.employerNIPrimaryThreshold) return 0;
  return (salary - THRESHOLDS.employerNIPrimaryThreshold) * THRESHOLDS.employerNIRate;
}

function rdcEstimate(qualifyingCosts) {
  const credit = qualifyingCosts * 0.20;
  const afterCT = credit * (1 - THRESHOLDS.corpTaxSmallRate);
  return {
    qualifyingCosts,
    grossCredit: credit,
    netCredit: afterCT,
    note: `Merged RDEC scheme: 20% credit on qualifying R&D costs. Net of CT: ~${(afterCT / qualifyingCosts * 100).toFixed(1)}%. ERIS available if loss-making + R&D intensive.`,
  };
}

function fullStrategy(revenue, expenses = 0, rndCosts = 0) {
  const salary = optimalSalary();
  const salaryCost = salary.salary + salary.employerNI;

  // Default: optimal salary + remaining as dividends (no pension)
  const profitBeforePension = revenue - expenses - salaryCost;
  const ctBeforePension = corpTax(Math.max(0, profitBeforePension));
  const afterCTBeforePension = profitBeforePension - ctBeforePension;
  const divTaxBeforePension = dividendTax(afterCTBeforePension, salary.salary);

  // With pension
  const maxPension = Math.min(THRESHOLDS.pensionAnnualAllowance, Math.max(0, profitBeforePension));
  const profitAfterPension = profitBeforePension - maxPension;
  const ctAfterPension = corpTax(Math.max(0, profitAfterPension));
  const afterCTAfterPension = profitAfterPension - ctAfterPension;
  const divTaxWithPension = dividendTax(afterCTAfterPension, salary.salary);

  const netFromDivWithPension = afterCTAfterPension - divTaxWithPension;
  const netFromDivNoPension = afterCTBeforePension - divTaxBeforePension;
  const pensionInfo = pensionSaving(maxPension);

  // R&D
  const rdc = rndCosts > 0 ? rdcEstimate(rndCosts) : null;

  return {
    revenue,
    expenses,
    rndCosts,
    salary: {
      amount: salary.salary,
      employerNI: salary.employerNI,
      totalCost: salaryCost,
    },
    noPension: {
      taxableProfit: profitBeforePension,
      corpTax: ctBeforePension,
      availableForDividends: afterCTBeforePension,
      dividendTax: divTaxBeforePension,
      netTakeHome: salary.salary + (afterCTBeforePension - divTaxBeforePension),
    },
    withPension: {
      pensionContribution: maxPension,
      taxableProfit: profitAfterPension,
      corpTax: ctAfterPension,
      availableForDividends: afterCTAfterPension,
      dividendTax: divTaxWithPension,
      netTakeHome: salary.salary + (afterCTAfterPension - divTaxWithPension),
      pensionGrowth: maxPension,
      totalWealth: salary.salary + (afterCTAfterPension - divTaxWithPension) + maxPension,
    },
    pensionSaving: pensionInfo,
    rdc: rdc,
    notes: {
      pension: pensionInfo.note,
      dividend: `Dividend allowance (£${THRESHOLDS.dividendAllowance}) used. Dividends have no NI — major saving vs salary.`,
      employmentAllowance: `Employment Allowance (£${THRESHOLDS.employmentAllowance.toLocaleString()}) may cover the £${Math.round(salary.employerNI)} employer NI bill if you have 2+ employees or meet the criteria.`,
    },
  };
}

export {
  THRESHOLDS,
  TAX_YEAR,
  corpTax,
  optimalSalary,
  pensionSaving,
  dividendTax,
  flatRateVat,
  employerNI,
  rdcEstimate,
  fullStrategy,
};
