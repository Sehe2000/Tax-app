import type { TaxRules } from './rules';
import { personalTax } from './personalTax';

/** Én fordeling av lønn og utbytte fra et AS til eier. */
export interface CompensationMix {
  salary: number;
  dividend: number;
  employerContribution: number;
  /** Selskapsskatt på overskuddet som deles ut som utbytte. */
  corporateTaxOnDividend: number;
  salaryTax: number;
  dividendTax: number;
  /** Samlet skatt og avgift for å få pengene ut til deg. */
  totalTax: number;
  /** Det du sitter igjen med personlig etter skatt. */
  netPersonal: number;
  /** Overskudd som blir igjen i selskapet etter skatt. */
  retainedAfterTax: number;
  /** Om selskapets overskudd faktisk dekker denne fordelingen. */
  feasible: boolean;
}

export function evaluateMix(
  profit: number,
  salary: number,
  dividend: number,
  rules: TaxRules,
): CompensationMix {
  const employerContribution = salary * rules.employerContribution;
  const salaryCost = salary + employerContribution;
  const profitAfterSalary = profit - salaryCost;
  const corporateTaxOnDividend = (dividend / (1 - rules.corporateTax)) * rules.corporateTax;
  const salaryTax = personalTax({ wage: salary }, rules).total;
  const dividendTax = dividend * rules.dividendGrossUp * rules.generalIncomeRate;
  const retainedAfterTax = Math.max(0, profitAfterSalary) * (1 - rules.corporateTax) - dividend;
  return {
    salary,
    dividend,
    employerContribution,
    corporateTaxOnDividend,
    salaryTax,
    dividendTax,
    totalTax: employerContribution + corporateTaxOnDividend + salaryTax + dividendTax,
    netPersonal: salary - salaryTax + dividend - dividendTax,
    retainedAfterTax,
    feasible: profitAfterSalary >= 0 && retainedAfterTax >= -1,
  };
}

/** Netto lønn etter personlig skatt. */
export function netSalary(salary: number, rules: TaxRules): number {
  return salary - personalTax({ wage: salary }, rules).total;
}

/** Finner bruttolønn som gir ønsket netto (binærsøk). */
export function salaryForNet(targetNet: number, rules: TaxRules): number {
  if (targetNet <= 0) return 0;
  let lo = 0;
  let hi = targetNet * 3 + 200_000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (netSalary(mid, rules) < targetNet) lo = mid;
    else hi = mid;
  }
  return Math.round(hi);
}

/** Utbytte som trengs for å nå ønsket netto, gitt en lønn. */
export function dividendForNet(salary: number, targetNet: number, rules: TaxRules): number {
  const missing = targetNet - netSalary(salary, rules);
  if (missing <= 0) return 0;
  return missing / (1 - rules.dividendGrossUp * rules.generalIncomeRate);
}

export function mixForNet(
  profit: number,
  salary: number,
  targetNet: number,
  rules: TaxRules,
): CompensationMix {
  return evaluateMix(profit, salary, dividendForNet(salary, targetNet, rules), rules);
}

/** Finner lønnsnivået som gir lavest samlet skatt for ønsket netto. */
export function optimalMix(profit: number, targetNet: number, rules: TaxRules): CompensationMix {
  const maxSalary = salaryForNet(targetNet, rules);
  let best: CompensationMix | null = null;
  for (let s = 0; s <= maxSalary; s += 5_000) {
    const mix = mixForNet(profit, s, targetNet, rules);
    if (!mix.feasible) continue;
    if (!best || mix.totalTax < best.totalTax - 1) best = mix;
  }
  const allSalary = mixForNet(profit, maxSalary, targetNet, rules);
  if (allSalary.feasible && (!best || allSalary.totalTax < best.totalTax)) best = allSalary;
  return best ?? allSalary;
}

export interface Scenario {
  id: 'current' | 'salary' | 'balanced' | 'dividend' | 'optimal';
  label: string;
  mix: CompensationMix;
}

/** Sammenlignbare scenarier som alle gir samme netto til eier. */
export function compareScenarios(
  profit: number,
  targetNet: number,
  rules: TaxRules,
): Scenario[] {
  const allSalary = salaryForNet(targetNet, rules);
  return [
    { id: 'salary', label: 'Mest lønn', mix: mixForNet(profit, allSalary, targetNet, rules) },
    {
      id: 'balanced',
      label: 'Balansert',
      mix: mixForNet(profit, salaryForNet(targetNet * 0.6, rules), targetNet, rules),
    },
    {
      id: 'dividend',
      label: 'Mest utbytte',
      mix: mixForNet(profit, salaryForNet(targetNet * 0.25, rules), targetNet, rules),
    },
    { id: 'optimal', label: 'Lavest estimert skatt', mix: optimalMix(profit, targetNet, rules) },
  ];
}

/** Rettigheter i folketrygden som påvirkes av lønnsnivået. */
export function salaryBenefits(salary: number, rules: TaxRules) {
  return {
    sickPayCoverage: Math.min(salary, 6 * rules.G),
    earnsPension: salary > 0,
    pensionCapped: salary >= 7.1 * rules.G,
    belowMinimumForBenefits: salary < 0.5 * rules.G,
  };
}
