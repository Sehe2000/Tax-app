import type { TaxRules } from './rules';

export interface PersonalIncome {
  /** Lønnsinntekt (gir minstefradrag, lav trygdeavgift). */
  wage?: number;
  /** Overskudd fra ENK (høy trygdeavgift, ikke minstefradrag). */
  business?: number;
  /** Fradrag i alminnelig inntekt (renter, reisefradrag, fagforening …). */
  deductions?: number;
  /** Utbytte mottatt direkte som personlig aksjonær. */
  dividend?: number;
}

export interface PersonalTaxResult {
  minimumDeduction: number;
  generalIncome: number;
  generalIncomeTax: number;
  socialSecurity: number;
  bracketTax: number;
  dividendTax: number;
  total: number;
}

export function bracketTax(personalIncome: number, rules: TaxRules): number {
  const steps = rules.bracketTax;
  let tax = 0;
  for (let i = 0; i < steps.length; i++) {
    const upper = steps[i + 1]?.from ?? Infinity;
    if (personalIncome > steps[i].from) {
      tax += (Math.min(personalIncome, upper) - steps[i].from) * steps[i].rate;
    }
  }
  return tax;
}

export function socialSecurity(wage: number, business: number, rules: TaxRules): number {
  const { wageRate, businessRate, lowerLimit, phaseInRate } = rules.socialSecurity;
  const total = wage + business;
  if (total <= lowerLimit) return 0;
  const ordinary = wage * wageRate + business * businessRate;
  return Math.min(ordinary, (total - lowerLimit) * phaseInRate);
}

export function dividendTax(dividend: number, rules: TaxRules): number {
  return dividend * rules.dividendGrossUp * rules.generalIncomeRate;
}

/** Forenklet beregning av personlig skatt for ett inntektsår. */
export function personalTax(income: PersonalIncome, rules: TaxRules): PersonalTaxResult {
  const wage = Math.max(0, income.wage ?? 0);
  const business = Math.max(0, income.business ?? 0);
  const minimumDeduction = Math.min(wage * rules.minimumDeduction.rate, rules.minimumDeduction.max);
  const generalIncome = Math.max(
    0,
    wage + business - minimumDeduction - (income.deductions ?? 0) - rules.personalAllowance,
  );
  const generalIncomeTax = generalIncome * rules.generalIncomeRate;
  const ss = socialSecurity(wage, business, rules);
  const bt = bracketTax(wage + business, rules);
  const dt = dividendTax(income.dividend ?? 0, rules);
  return {
    minimumDeduction,
    generalIncome,
    generalIncomeTax,
    socialSecurity: ss,
    bracketTax: bt,
    dividendTax: dt,
    total: generalIncomeTax + ss + bt + dt,
  };
}

/**
 * Marginalskatt: hvor mye av de neste kronene i lønn/overskudd som går til skatt.
 * Beregnes numerisk, slik at den alltid stemmer med personalTax().
 */
export function marginalRate(
  income: PersonalIncome,
  kind: 'wage' | 'business',
  rules: TaxRules,
): number {
  const step = 1_000;
  const base = personalTax(income, rules).total;
  const bumped = personalTax({ ...income, [kind]: (income[kind] ?? 0) + step }, rules).total;
  return (bumped - base) / step;
}

/** Skatteverdien av et fradrag i alminnelig inntekt (normalt 22 %). */
export function deductionValue(amount: number, rules: TaxRules): number {
  return Math.max(0, amount) * rules.generalIncomeRate;
}

/**
 * Skatteverdien av en driftskostnad i ENK. Kostnaden reduserer både
 * alminnelig inntekt og personinntekt, så verdien er marginalskatten.
 */
export function businessExpenseValue(
  amount: number,
  income: PersonalIncome,
  rules: TaxRules,
): number {
  const before = personalTax(income, rules).total;
  const after = personalTax(
    { ...income, business: Math.max(0, (income.business ?? 0) - amount) },
    rules,
  ).total;
  return before - after;
}
