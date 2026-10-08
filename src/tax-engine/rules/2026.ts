import type { TaxRules } from './types';

/**
 * Satser for inntektsåret 2026 (vedtatt statsbudsjett).
 * Kilder: regjeringen.no «Skattesatser 2026», Skatteetaten.
 * G er satt til siste kjente grunnbeløp og må oppdateres når nytt G vedtas.
 */
export const rules2026: TaxRules = {
  year: 2026,
  G: 130_160,
  generalIncomeRate: 0.22,
  personalAllowance: 114_540,
  bracketTax: [
    { from: 226_100, rate: 0.017 },
    { from: 318_300, rate: 0.04 },
    { from: 725_050, rate: 0.137 },
    { from: 980_100, rate: 0.167 },
    { from: 1_467_200, rate: 0.177 },
  ],
  socialSecurity: {
    wageRate: 0.076,
    businessRate: 0.107,
    lowerLimit: 99_650,
    phaseInRate: 0.25,
  },
  minimumDeduction: { rate: 0.46, max: 95_700 },
  travel: { perKm: 1.9, threshold: 12_000, workDaysPerYear: 230 },
  unionFeeMax: 8_700,
  donationMax: 25_000,
  donationMinPerOrg: 500,
  bsu: { maxDeposit: 27_500, taxCreditRate: 0.1, maxAge: 33 },
  childcare: { firstChild: 25_000, perAdditionalChild: 15_000 },
  ips: { maxDeposit: 15_000 },
  homeOfficeStandard: 2_050,
  mileageAllowance: 3.5,
  employerContribution: 0.141,
  corporateTax: 0.22,
  dividendGrossUp: 1.72,
  exemptionMethodTaxableShare: 0.03,
  pension: {
    employerMinRate: 0.02,
    employerMaxRate: 0.07,
    selfEmployedMaxRate: 0.06,
  },
  expenseEstimates: {
    phone: { min: 3_000, max: 7_000 },
    internet: { min: 4_000, max: 8_000 },
    computer: { min: 5_000, max: 15_000 },
    equipment: { min: 2_000, max: 8_000 },
    software: { min: 2_000, max: 10_000 },
    courses: { min: 3_000, max: 15_000 },
    travel: { min: 3_000, max: 15_000 },
    office: { min: 12_000, max: 40_000 },
    services: { min: 5_000, max: 20_000 },
  },
};
