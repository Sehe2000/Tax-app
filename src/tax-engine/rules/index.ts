import { rules2026 } from './2026';
import type { TaxRules } from './types';

export type { TaxRules, ExpenseKey, CostRange } from './types';

const rulesByYear: Record<number, TaxRules> = {
  2026: rules2026,
};

export const CURRENT_YEAR = 2026;

export function getRules(year: number = CURRENT_YEAR): TaxRules {
  const rules = rulesByYear[year];
  if (!rules) throw new Error(`Mangler skatteregler for ${year}`);
  return rules;
}
