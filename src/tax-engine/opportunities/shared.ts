import type { Profile } from '../profile';
import type { ExpenseKey, TaxRules } from '../rules';
import { businessExpenseValue, marginalRate, type PersonalIncome } from '../personalTax';
import type { SavingsEstimate } from './types';

export function enkIncome(p: Profile): PersonalIncome {
  return {
    business: p.profit ?? 0,
    wage: p.hasOtherSalary ? p.otherSalary ?? 0 : 0,
  };
}

export function asSalary(p: Profile): number {
  return p.takesSalary ? p.asSalary ?? 0 : 0;
}

export function asDividend(p: Profile): number {
  return p.takesDividend ? p.dividend ?? 0 : 0;
}

/**
 * Hvor mye ekstra skatt det koster å betale 1 kr privat i stedet for via AS-et.
 * Betaler du privat, må pengene først tas ut som lønn (eller utbytte) og skattes.
 */
export function asPrivatePaymentFactor(p: Profile, rules: TaxRules): number {
  const salary = asSalary(p);
  if (salary > 0) {
    const m = marginalRate({ wage: salary }, 'wage', rules);
    return (1 + rules.employerContribution) / (1 - m) - 1;
  }
  const dividendKeep = 1 - rules.dividendGrossUp * rules.generalIncomeRate;
  return 1 / ((1 - rules.corporateTax) * dividendKeep) - 1;
}

export function sumCosts(keys: ExpenseKey[], rules: TaxRules) {
  return keys.reduce(
    (acc, k) => ({
      min: acc.min + rules.expenseEstimates[k].min,
      max: acc.max + rules.expenseEstimates[k].max,
    }),
    { min: 0, max: 0 },
  );
}

/** Skatteeffekt av en kostnadsramme for en ENK. */
export function enkCostEffect(
  p: Profile,
  cost: { min: number; max: number },
  rules: TaxRules,
): SavingsEstimate {
  const income = enkIncome(p);
  const booked = p.expensesBooked ?? 'none';
  const share = { none: 1, some: 0.25, all: 0 }[booked];
  const min = businessExpenseValue(cost.min, income, rules) * share;
  const max =
    booked === 'all'
      ? businessExpenseValue(cost.min, income, rules) * 0.5
      : businessExpenseValue(cost.max, income, rules);
  return { min, max };
}

/** Skatteeffekt av at AS-et betaler en kostnad du i dag betaler privat. */
export function asCostEffect(
  p: Profile,
  cost: { min: number; max: number },
  rules: TaxRules,
): SavingsEstimate {
  const factor = asPrivatePaymentFactor(p, rules);
  const certain = p.paysPrivately === 'yes';
  return { min: certain ? cost.min * factor * 0.5 : 0, max: cost.max * factor };
}
