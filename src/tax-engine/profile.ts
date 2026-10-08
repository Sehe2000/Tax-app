import type { ExpenseKey } from './rules';

export type UserType = 'PRIVATE' | 'ENK' | 'AS';

export type PrivateSituation =
  | 'mortgage'
  | 'commute'
  | 'union'
  | 'under34'
  | 'bsu'
  | 'donations'
  | 'childcare'
  | 'ips';

export type YesNoUnsure = 'yes' | 'no' | 'unsure';

/**
 * Alt brukeren har fortalt oss. Alle felter er valgfrie fordi
 * spørsmålene stilles progressivt og bare når de er relevante.
 */
export interface Profile {
  userType: UserType;

  // Privatperson (lønn brukes også av ENK med lønn ved siden av)
  salary?: number;
  situations?: PrivateSituation[];
  interestPaid?: number;
  commuteKm?: number;
  unionFee?: number;
  bsuDeposit?: number;
  donations?: number;
  childcareCost?: number;
  children?: number;

  // Felles for ENK og AS
  revenue?: number;
  profit?: number;
  homeOffice?: 'dedicated' | 'partial' | 'no';
  businessExpenses?: ExpenseKey[];
  vehicle?: 'private' | 'business' | 'none';
  businessKm?: number;

  // ENK
  hasOtherSalary?: boolean;
  otherSalary?: number;
  expensesBooked?: 'all' | 'some' | 'none';
  newBusiness?: boolean;
  pensionSaving?: YesNoUnsure;

  // AS
  takesSalary?: boolean;
  asSalary?: number;
  takesDividend?: boolean;
  dividend?: number;
  ownership?: 'direct' | 'holding' | 'unsure';
  paysPrivately?: YesNoUnsure;
  companyPension?: YesNoUnsure;
  retainsProfit?: boolean;
}

export function has(profile: Profile, situation: PrivateSituation): boolean {
  return profile.situations?.includes(situation) ?? false;
}

export function usesExpense(profile: Profile, key: ExpenseKey): boolean {
  return profile.businessExpenses?.includes(key) ?? false;
}
