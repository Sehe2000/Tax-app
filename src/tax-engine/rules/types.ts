/** A range of plausible annual costs for an expense category (kr). */
export interface CostRange {
  min: number;
  max: number;
}

/**
 * All rates and limits for one income year. Every number the engine uses
 * lives here, so updating to a new year means adding one new file.
 */
export interface TaxRules {
  year: number;
  /** Folketrygdens grunnbeløp (G). */
  G: number;
  /** Skatt på alminnelig inntekt (fellesskatt + kommune/fylke). */
  generalIncomeRate: number;
  personalAllowance: number;
  bracketTax: { from: number; rate: number }[];
  socialSecurity: {
    wageRate: number;
    businessRate: number;
    lowerLimit: number;
    phaseInRate: number;
  };
  minimumDeduction: { rate: number; max: number };
  travel: { perKm: number; threshold: number; workDaysPerYear: number };
  unionFeeMax: number;
  donationMax: number;
  donationMinPerOrg: number;
  bsu: { maxDeposit: number; taxCreditRate: number; maxAge: number };
  childcare: { firstChild: number; perAdditionalChild: number };
  ips: { maxDeposit: number };
  /** Sjablongfradrag for hjemmekontor uten eget rom (næringsdrivende). */
  homeOfficeStandard: number;
  /** Statens skattefrie kilometersats. */
  mileageAllowance: number;
  /** Arbeidsgiveravgift, sone 1. */
  employerContribution: number;
  corporateTax: number;
  /** Oppjusteringsfaktor for utbytte. */
  dividendGrossUp: number;
  /** Fritaksmetoden: andel av utbytte til holding som skattlegges. */
  exemptionMethodTaxableShare: number;
  pension: {
    /** Innskuddspensjon i AS: min/maks innskudd av lønn (0–12G). */
    employerMinRate: number;
    employerMaxRate: number;
    /** Pensjonsordning for selvstendig næringsdrivende: maks av inntekt 1G–12G. */
    selfEmployedMaxRate: number;
  };
  /** Typiske årlige kostnader per kategori, brukt til grove estimater. */
  expenseEstimates: Record<ExpenseKey, CostRange>;
}

export type ExpenseKey =
  | 'phone'
  | 'internet'
  | 'computer'
  | 'equipment'
  | 'software'
  | 'courses'
  | 'travel'
  | 'office'
  | 'services';
