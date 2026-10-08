import type { Profile, UserType } from '../profile';
import type { TaxRules } from '../rules';

/**
 * likely  – «Kan være relevant for deg»: det du har svart peker tydelig hit.
 * explore – «Bør undersøkes»: kan gi effekt, men avhenger av detaljer.
 * check   – «Sjekk at dette er med»: fradraget finnes ofte allerede, men er verdt å kontrollere.
 */
export type Relevance = 'likely' | 'explore' | 'check';

export interface SavingsEstimate {
  min: number;
  max: number;
}

export interface Opportunity {
  id: string;
  icon: string;
  title: string;
  relevance: Relevance;
  /** Personlig begrunnelse: hvorfor vi viser dette kortet. */
  reason: string;
  /** Enkel forklaring av mulighetens innhold. */
  explanation: string;
  /** Konkrete neste steg. */
  steps: string[];
  /** Ting som må være oppfylt / fallgruver. */
  caveats?: string[];
  savings: SavingsEstimate | null;
  /** Hovedmulighet som alltid vises øverst. */
  featured?: boolean;
  /** Egen side for videre utforsking, f.eks. lønn/utbytte-kalkulatoren. */
  action?: { label: string; to: string };
}

export interface RuleContext {
  rules: TaxRules;
}

/**
 * En regel bestemmer selv om den gjelder og bygger kortet.
 * Nye muligheter legges til ved å skrive en ny regel og registrere den i index.ts.
 */
export interface OpportunityRule {
  id: string;
  userTypes: UserType[];
  applies: (profile: Profile, ctx: RuleContext) => boolean;
  build: (profile: Profile, ctx: RuleContext) => Opportunity;
}
