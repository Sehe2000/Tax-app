import type { UserType } from '../tax-engine';

export type Specialization =
  | 'privat'
  | 'enk'
  | 'as'
  | 'grunder'
  | 'holding'
  | 'eiendom'
  | 'bolig'
  | 'kreative';

export interface Accountant {
  id: string;
  name: string;
  city: string;
  tagline: string;
  specializations: Specialization[];
  rating: number;
  reviews: number;
  /** Autorisert regnskapsfører eller statsautorisert revisor / skatterådgiver. */
  credentials: string[];
  responseTime: string;
  priceHint: string;
  /** Betalt fremheving i markedsplassen. */
  featured: boolean;
  remote: boolean;
}

export type LeadStatus = 'new' | 'sent' | 'contacted' | 'won' | 'lost';

/**
 * En forespørsel fra en bruker til en rådgiver. Feltene er laget for at
 * leads senere kan prises, spores og faktureres per rådgiver.
 */
export interface Lead {
  id: string;
  createdAt: string;
  accountantId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  userType?: UserType;
  /** Kort oppsummering av skattesjekken hvis brukeren valgte å dele den. */
  checkSummary?: { opportunities: string[]; savingsMin: number; savingsMax: number };
  consent: boolean;
  status: LeadStatus;
}

export const specializationLabels: Record<Specialization, string> = {
  privat: 'Privatpersoner',
  enk: 'ENK',
  as: 'Små AS',
  grunder: 'Gründere',
  holding: 'Holding',
  eiendom: 'Eiendom',
  bolig: 'Utleie av bolig',
  kreative: 'Kreative yrker',
};
