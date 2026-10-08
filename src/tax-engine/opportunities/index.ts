import type { Profile } from '../profile';
import { getRules, type TaxRules } from '../rules';
import { asRules } from './as';
import { enkRules } from './enk';
import { expenseRules } from './expenses';
import { privateRules } from './private';
import type { Opportunity, OpportunityRule, Relevance } from './types';

export type { Opportunity, OpportunityRule, Relevance, SavingsEstimate } from './types';

/** Alle regler. Legg nye regler til her. */
export const allRules: OpportunityRule[] = [...asRules, ...enkRules, ...expenseRules, ...privateRules];

const relevanceOrder: Record<Relevance, number> = { likely: 0, explore: 1, check: 2 };

export interface OpportunityReport {
  opportunities: Opportunity[];
  totalSavings: { min: number; max: number };
}

export function findOpportunities(profile: Profile, rules: TaxRules = getRules()): OpportunityReport {
  const ctx = { rules };
  const opportunities = allRules
    .filter((r) => r.userTypes.includes(profile.userType) && r.applies(profile, ctx))
    .map((r) => r.build(profile, ctx))
    .map((o) => ({
      ...o,
      savings: o.savings && o.savings.max > 0 ? clampRange(o.savings) : null,
    }))
    .sort(
      (a, b) =>
        Number(b.featured ?? false) - Number(a.featured ?? false) ||
        relevanceOrder[a.relevance] - relevanceOrder[b.relevance] ||
        (b.savings?.max ?? 0) - (a.savings?.max ?? 0),
    );

  const totalSavings = opportunities.reduce(
    (acc, o) => ({ min: acc.min + (o.savings?.min ?? 0), max: acc.max + (o.savings?.max ?? 0) }),
    { min: 0, max: 0 },
  );

  return { opportunities, totalSavings };
}

function clampRange(s: { min: number; max: number }) {
  const min = Math.max(0, Math.min(s.min, s.max));
  return { min, max: Math.max(min, s.max) };
}
