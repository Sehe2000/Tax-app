import type { PrivateSituation, Profile, UserType } from '../tax-engine';

export type Answers = Partial<Profile>;

export interface Option<V = string | boolean> {
  value: V;
  label: string;
  description?: string;
  icon?: string;
}

interface Base {
  id: keyof Profile;
  title: string;
  help?: string;
  /** Spørsmålet vises bare når dette er sant. */
  showIf?: (a: Answers) => boolean;
}

export interface SingleQuestion extends Base {
  kind: 'single';
  options: Option[];
}

export interface MultiQuestion extends Base {
  kind: 'multi';
  options: Option<string>[];
  /** Tekst på knappen når ingenting er valgt. */
  noneLabel?: string;
}

export interface NumberQuestion extends Base {
  kind: 'number';
  unit: 'kr' | 'km' | 'barn';
  placeholder?: number;
  suggestions?: number[];
  optional?: boolean;
  max?: number;
}

export type Question = SingleQuestion | MultiQuestion | NumberQuestion;

const yesNo: Option[] = [
  { value: true, label: 'Ja' },
  { value: false, label: 'Nei' },
];

const yesNoUnsure: Option[] = [
  { value: 'yes', label: 'Ja' },
  { value: 'no', label: 'Nei' },
  { value: 'unsure', label: 'Usikker' },
];

export const userTypeQuestion: SingleQuestion = {
  id: 'userType',
  kind: 'single',
  title: 'Hva gjelder deg?',
  help: 'Velg det som passer best. Har du både jobb og egen bedrift, velger du bedriften.',
  options: [
    { value: 'PRIVATE', icon: '👤', label: 'Privatperson', description: 'Jeg er ansatt, student eller pensjonist.' },
    { value: 'ENK', icon: '💼', label: 'Enkeltpersonforetak (ENK)', description: 'Jeg driver for meg selv.' },
    { value: 'AS', icon: '🏢', label: 'Aksjeselskap (AS)', description: 'Jeg eier og jobber i eget AS.' },
  ],
};

const has = (a: Answers, s: PrivateSituation) => a.situations?.includes(s) ?? false;

const situationOptions: Record<PrivateSituation, Option<string>> = {
  mortgage: { value: 'mortgage', icon: '🏠', label: 'Jeg har boliglån eller annen gjeld' },
  commute: { value: 'commute', icon: '🚗', label: 'Jeg har lang vei til jobb' },
  union: { value: 'union', icon: '🤝', label: 'Jeg er medlem av en fagforening' },
  under34: { value: 'under34', icon: '🎂', label: 'Jeg er 33 år eller yngre' },
  bsu: { value: 'bsu', icon: '🐷', label: 'Jeg sparer i BSU' },
  donations: { value: 'donations', icon: '🎁', label: 'Jeg gir penger til veldedige formål' },
  childcare: { value: 'childcare', icon: '👶', label: 'Jeg har barn i barnehage eller SFO' },
  ips: { value: 'ips', icon: '📈', label: 'Jeg sparer i IPS (pensjon)' },
};

function situationsQuestion(title: string, keys: PrivateSituation[]): MultiQuestion {
  return {
    id: 'situations',
    kind: 'multi',
    title,
    help: 'Velg alt som passer. Vi spør bare om detaljer der det trengs.',
    options: keys.map((k) => situationOptions[k]),
    noneLabel: 'Ingen av disse',
  };
}

/** Oppfølgingsspørsmål for privatøkonomien – brukes av alle brukertyper. */
const privateFollowUps: Question[] = [
  {
    id: 'interestPaid',
    kind: 'number',
    unit: 'kr',
    title: 'Omtrent hvor mye betaler du i renter i året?',
    help: 'Et grovt anslag holder. Står ofte i nettbanken under «årsoppgave».',
    suggestions: [30_000, 60_000, 100_000],
    optional: true,
    showIf: (a) => has(a, 'mortgage'),
  },
  {
    id: 'commuteKm',
    kind: 'number',
    unit: 'km',
    title: 'Hvor langt er det til jobb – én vei?',
    help: 'Korteste vanlige reisevei, uansett hvordan du reiser.',
    suggestions: [15, 30, 50],
    max: 1_000,
    showIf: (a) => has(a, 'commute'),
  },
  {
    id: 'unionFee',
    kind: 'number',
    unit: 'kr',
    title: 'Hvor mye betaler du i fagforeningskontingent i året?',
    suggestions: [4_000, 6_000, 8_700],
    optional: true,
    showIf: (a) => has(a, 'union'),
  },
  {
    id: 'bsuDeposit',
    kind: 'number',
    unit: 'kr',
    title: 'Hvor mye sparer du i BSU i året?',
    suggestions: [10_000, 20_000, 27_500],
    optional: true,
    showIf: (a) => has(a, 'bsu'),
  },
  {
    id: 'donations',
    kind: 'number',
    unit: 'kr',
    title: 'Hvor mye gir du omtrent i året?',
    suggestions: [2_000, 5_000, 15_000],
    optional: true,
    showIf: (a) => has(a, 'donations'),
  },
  {
    id: 'children',
    kind: 'number',
    unit: 'barn',
    title: 'Hvor mange barn har du i barnehage, SFO eller med dagmamma?',
    suggestions: [1, 2, 3],
    max: 10,
    showIf: (a) => has(a, 'childcare'),
  },
  {
    id: 'childcareCost',
    kind: 'number',
    unit: 'kr',
    title: 'Hva betaler du for barnepass i året, uten kostpenger?',
    suggestions: [20_000, 35_000, 50_000],
    optional: true,
    showIf: (a) => has(a, 'childcare'),
  },
];

const expenseOptions: Option<string>[] = [
  { value: 'phone', icon: '📱', label: 'Telefon' },
  { value: 'internet', icon: '🌐', label: 'Internett' },
  { value: 'computer', icon: '💻', label: 'Datamaskin' },
  { value: 'equipment', icon: '🖥️', label: 'Skjerm og annet utstyr' },
  { value: 'software', icon: '🧩', label: 'Programvare og abonnementer' },
  { value: 'courses', icon: '🎓', label: 'Kurs og faglitteratur' },
  { value: 'travel', icon: '✈️', label: 'Reiser' },
  { value: 'office', icon: '🏢', label: 'Kontorplass' },
  { value: 'services', icon: '📊', label: 'Regnskap og rådgivning' },
];

const homeOfficeQuestion: SingleQuestion = {
  id: 'homeOffice',
  kind: 'single',
  title: 'Jobber du hjemmefra?',
  options: [
    { value: 'dedicated', label: 'Ja, i et eget rom kun til jobb' },
    { value: 'partial', label: 'Ja, men ikke i et eget rom' },
    { value: 'no', label: 'Nei' },
  ],
};

const businessKmQuestion: NumberQuestion = {
  id: 'businessKm',
  kind: 'number',
  unit: 'km',
  title: 'Omtrent hvor mange km kjører du i jobb i året?',
  help: 'Ikke ta med kjøring mellom hjem og fast arbeidssted.',
  suggestions: [2_000, 5_000, 10_000],
  optional: true,
  showIf: (a) => a.vehicle === 'private',
};

const flows: Record<UserType, Question[]> = {
  PRIVATE: [
    {
      id: 'salary',
      kind: 'number',
      unit: 'kr',
      title: 'Hva er omtrent årslønnen din før skatt?',
      suggestions: [450_000, 650_000, 900_000],
    },
    situationsQuestion('Hva av dette gjelder deg?', [
      'mortgage',
      'commute',
      'union',
      'under34',
      'bsu',
      'donations',
      'childcare',
      'ips',
    ]),
    ...privateFollowUps,
  ],

  ENK: [
    {
      id: 'revenue',
      kind: 'number',
      unit: 'kr',
      title: 'Hva er omtrent årlig omsetning?',
      suggestions: [300_000, 750_000, 1_500_000],
      optional: true,
    },
    {
      id: 'profit',
      kind: 'number',
      unit: 'kr',
      title: 'Hva er omtrent årlig overskudd?',
      help: 'Inntekter minus kostnadene du allerede fører i regnskapet.',
      suggestions: [200_000, 500_000, 900_000],
    },
    {
      id: 'hasOtherSalary',
      kind: 'single',
      title: 'Har du også lønn fra en arbeidsgiver?',
      options: yesNo,
    },
    {
      id: 'otherSalary',
      kind: 'number',
      unit: 'kr',
      title: 'Hvor mye tjener du i lønn i året?',
      suggestions: [200_000, 400_000, 600_000],
      showIf: (a) => a.hasOtherSalary === true,
    },
    homeOfficeQuestion,
    {
      id: 'businessExpenses',
      kind: 'multi',
      title: 'Hva bruker du i virksomheten?',
      help: 'Velg det du betaler for og bruker i jobben – helt eller delvis.',
      options: expenseOptions,
      noneLabel: 'Ingen av disse',
    },
    {
      id: 'expensesBooked',
      kind: 'single',
      title: 'Fører du disse utgiftene som kostnader i regnskapet i dag?',
      options: [
        { value: 'all', label: 'Ja, alle' },
        { value: 'some', label: 'Noen av dem' },
        { value: 'none', label: 'Nei / vet ikke' },
      ],
      showIf: (a) => (a.businessExpenses?.length ?? 0) > 0,
    },
    {
      id: 'vehicle',
      kind: 'single',
      title: 'Bruker du bil i virksomheten?',
      options: [
        { value: 'private', label: 'Ja, min private bil' },
        { value: 'business', label: 'Ja, bilen eies av virksomheten' },
        { value: 'none', label: 'Nei' },
      ],
    },
    businessKmQuestion,
    {
      id: 'newBusiness',
      kind: 'single',
      title: 'Startet du virksomheten i år eller i fjor?',
      options: yesNo,
    },
    {
      id: 'pensionSaving',
      kind: 'single',
      title: 'Sparer du til pensjon med skattefradrag (IPS eller pensjonsordning)?',
      options: yesNoUnsure,
    },
    situationsQuestion('Gjelder noe av dette deg privat?', ['mortgage', 'under34', 'bsu', 'donations', 'childcare']),
    ...privateFollowUps,
  ],

  AS: [
    {
      id: 'revenue',
      kind: 'number',
      unit: 'kr',
      title: 'Hva er omtrent årlig omsetning i selskapet?',
      suggestions: [750_000, 1_500_000, 3_000_000],
      optional: true,
    },
    {
      id: 'profit',
      kind: 'number',
      unit: 'kr',
      title: 'Hva er omtrent årlig overskudd før eierlønn?',
      help: 'Overskuddet før du har tatt ut lønn til deg selv. Et grovt anslag holder.',
      suggestions: [500_000, 800_000, 1_500_000],
    },
    {
      id: 'takesSalary',
      kind: 'single',
      title: 'Tar du ut lønn fra selskapet?',
      options: yesNo,
    },
    {
      id: 'asSalary',
      kind: 'number',
      unit: 'kr',
      title: 'Hvor mye lønn tar du ut per år?',
      suggestions: [300_000, 500_000, 700_000],
      showIf: (a) => a.takesSalary === true,
    },
    {
      id: 'takesDividend',
      kind: 'single',
      title: 'Tar du ut utbytte?',
      options: yesNo,
    },
    {
      id: 'dividend',
      kind: 'number',
      unit: 'kr',
      title: 'Hvor mye utbytte tar du ut i året, omtrent?',
      suggestions: [100_000, 250_000, 500_000],
      showIf: (a) => a.takesDividend === true,
    },
    {
      id: 'ownership',
      kind: 'single',
      title: 'Hvordan eier du aksjene?',
      options: [
        { value: 'direct', label: 'Direkte, i mitt eget navn' },
        { value: 'holding', label: 'Via et holdingselskap' },
        { value: 'unsure', label: 'Vet ikke' },
      ],
    },
    {
      id: 'retainsProfit',
      kind: 'single',
      title: 'Lar du deler av overskuddet bli igjen i selskapet?',
      options: yesNo,
    },
    homeOfficeQuestion,
    {
      id: 'vehicle',
      kind: 'single',
      title: 'Bruker du bil i jobb for selskapet?',
      options: [
        { value: 'private', label: 'Ja, min private bil' },
        { value: 'business', label: 'Ja, selskapet eier bilen' },
        { value: 'none', label: 'Nei' },
      ],
    },
    businessKmQuestion,
    {
      id: 'paysPrivately',
      kind: 'single',
      title: 'Betaler du selv for ting som hovedsakelig brukes i selskapet?',
      help: 'For eksempel telefon, PC, programvare eller kurs.',
      options: yesNoUnsure,
    },
    {
      id: 'businessExpenses',
      kind: 'multi',
      title: 'Hva gjelder det?',
      help: 'Velg det du betaler for privat, men bruker i jobben.',
      options: expenseOptions,
      noneLabel: 'Vet ikke',
      showIf: (a) => a.paysPrivately === 'yes' || a.paysPrivately === 'unsure',
    },
    {
      id: 'companyPension',
      kind: 'single',
      title: 'Sparer selskapet til pensjon for deg?',
      help: 'For eksempel obligatorisk tjenestepensjon (OTP) eller innskuddspensjon.',
      options: yesNoUnsure,
      showIf: (a) => a.takesSalary === true,
    },
    situationsQuestion('Gjelder noe av dette deg privat?', ['mortgage', 'under34', 'bsu', 'donations', 'childcare']),
    ...privateFollowUps,
  ],
};

/** Spørsmålene som er relevante akkurat nå, gitt svarene så langt. */
export function visibleQuestions(answers: Answers): Question[] {
  if (!answers.userType) return [userTypeQuestion];
  return [userTypeQuestion, ...flows[answers.userType].filter((q) => !q.showIf || q.showIf(answers))];
}

/** Fjerner svar på spørsmål som ikke lenger er synlige (f.eks. etter at brukeren har endret et svar). */
export function pruneAnswers(answers: Answers): Answers {
  const visible = new Set(visibleQuestions(answers).map((q) => q.id));
  const pruned: Answers = {};
  for (const [k, v] of Object.entries(answers)) {
    if (visible.has(k as keyof Profile)) (pruned as Record<string, unknown>)[k] = v;
  }
  return pruned;
}
