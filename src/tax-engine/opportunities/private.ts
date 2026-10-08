import { has } from '../profile';
import { deductionValue } from '../personalTax';
import { formatKr, formatNumber } from '../format';
import type { OpportunityRule } from './types';

export const privateRules: OpportunityRule[] = [
  {
    id: 'travel-deduction',
    userTypes: ['PRIVATE'],
    applies: (p) => has(p, 'commute') && (p.commuteKm ?? 0) > 0,
    build: (p, { rules }) => {
      const km = p.commuteKm ?? 0;
      const { perKm, threshold, workDaysPerYear } = rules.travel;
      const value = (days: number) => deductionValue(km * 2 * days * perKm - threshold, rules);
      const deduction = Math.max(0, km * 2 * workDaysPerYear * perKm - threshold);
      return {
        id: 'travel-deduction',
        icon: '🚗',
        title: 'Reisefradrag',
        relevance: deduction > 0 ? 'likely' : 'explore',
        reason: `Du har ${formatNumber(km)} km til jobb hver vei.`,
        explanation: `Reiser mellom hjem og fast arbeidssted gir fradrag med ${perKm.toLocaleString('nb-NO', { minimumFractionDigits: 2 })} kr per km for det som overstiger ${formatKr(threshold)} i året. Fradraget fylles ikke alltid ut automatisk, så mange glemmer det.`,
        steps: [
          'Regn ut korteste reisevei og hvor mange dager du faktisk reiste.',
          'Legg inn reisen under «Reise mellom hjem og arbeid» i skattemeldingen.',
          'Har du bompenger eller ferje i tillegg, kan også disse gi fradrag.',
        ],
        caveats: [
          'Dager med hjemmekontor, ferie og sykdom teller ikke.',
          'Avstanden skal være korteste vanlige reisevei, uavhengig av transportmiddel.',
        ],
        savings: { min: value(200), max: value(workDaysPerYear) },
      };
    },
  },
  {
    id: 'interest',
    userTypes: ['PRIVATE', 'ENK', 'AS'],
    applies: (p) => has(p, 'mortgage'),
    build: (p, { rules }) => {
      const interest = p.interestPaid ?? 0;
      return {
        id: 'interest',
        icon: '🏠',
        title: 'Rentefradrag',
        relevance: 'check',
        reason: interest
          ? `Du betaler omtrent ${formatKr(interest)} i renter i året.`
          : 'Du har boliglån eller annen gjeld.',
        explanation:
          'Renter på lån gir 22 % fradrag. Fradraget fylles normalt ut automatisk, men ved felles lån står det ofte feil fordeling mellom dere. Fordelingen kan endres slik at fradraget havner der det gir best effekt.',
        steps: [
          'Kontroller at alle lån og renter er med i skattemeldingen.',
          'Har dere felles lån: sjekk fordelingen mellom dere (kan fritt fordeles for ektefeller).',
          'Har du forbrukslån eller billån? Også disse rentene gir fradrag.',
        ],
        savings: interest ? { min: 0, max: deductionValue(interest, rules) } : null,
      };
    },
  },
  {
    id: 'union-fee',
    userTypes: ['PRIVATE'],
    applies: (p) => has(p, 'union'),
    build: (p, { rules }) => {
      const fee = Math.min(p.unionFee ?? rules.unionFeeMax, rules.unionFeeMax);
      return {
        id: 'union-fee',
        icon: '🤝',
        title: 'Fagforeningskontingent',
        relevance: 'check',
        reason: 'Du er medlem av en fagforening.',
        explanation: `Kontingent til fagforening gir fradrag opptil ${formatKr(rules.unionFeeMax)} i året. Den rapporteres som regel automatisk, men ikke alltid, f.eks. hvis du har byttet forening eller betaler selv.`,
        steps: ['Sjekk at kontingenten står i skattemeldingen.', 'Legg den inn selv hvis den mangler.'],
        savings: { min: 0, max: deductionValue(fee, rules) },
      };
    },
  },
  {
    id: 'bsu',
    userTypes: ['PRIVATE', 'ENK', 'AS'],
    applies: (p) => has(p, 'under34') || has(p, 'bsu'),
    build: (p, { rules }) => {
      const { maxDeposit, taxCreditRate, maxAge } = rules.bsu;
      const saving = has(p, 'bsu');
      const deposit = Math.min(p.bsuDeposit ?? maxDeposit, maxDeposit);
      const maxCredit = maxDeposit * taxCreditRate;
      return {
        id: 'bsu',
        icon: '🐷',
        title: saving ? 'BSU – få fullt utbytte' : 'BSU – boligsparing for unge',
        relevance: saving ? (deposit < maxDeposit ? 'likely' : 'check') : 'likely',
        reason: saving
          ? `Du sparer omtrent ${formatKr(deposit)} i BSU i året.`
          : `Du er ${maxAge} år eller yngre og sparer ikke i BSU i dag.`,
        explanation: `Sparing i BSU gir et skattefradrag på ${Math.round(taxCreditRate * 100)} % av det du sparer, opptil ${formatKr(maxDeposit)} i året. Det betyr inntil ${formatKr(maxCredit)} lavere skatt hvert år – i tillegg til renter.`,
        steps: saving
          ? ['Vurder å fylle opp til maksbeløpet før 31. desember.', 'Sjekk at banken har rapportert sparingen.']
          : ['Opprett BSU-konto i banken din.', `Spar inntil ${formatKr(maxDeposit)} i året.`],
        caveats: [
          'Pengene skal brukes til bolig. Tar du dem ut til annet, må fradraget betales tilbake.',
          'Du må ha skatt å trekke fradraget fra.',
        ],
        savings: saving
          ? deposit < maxDeposit
            ? { min: 0, max: (maxDeposit - deposit) * taxCreditRate }
            : null
          : { min: maxCredit * 0.3, max: maxCredit },
      };
    },
  },
  {
    id: 'donations',
    userTypes: ['PRIVATE', 'ENK', 'AS'],
    applies: (p) => has(p, 'donations'),
    build: (p, { rules }) => {
      const amount = Math.min(p.donations ?? 0, rules.donationMax);
      return {
        id: 'donations',
        icon: '🎁',
        title: 'Gaver til frivillige organisasjoner',
        relevance: 'check',
        reason: 'Du gir penger til veldedige formål.',
        explanation: `Gaver til godkjente organisasjoner gir fradrag opptil ${formatKr(rules.donationMax)} i året, men bare hvis organisasjonen har fødselsnummeret ditt og du har gitt minst ${formatKr(rules.donationMinPerOrg)} til hver.`,
        steps: [
          'Sjekk at organisasjonene du støtter er godkjent hos Skatteetaten.',
          'Gi dem fødselsnummeret ditt slik at gaven rapporteres.',
        ],
        savings: amount ? { min: 0, max: deductionValue(amount, rules) } : null,
      };
    },
  },
  {
    id: 'childcare',
    userTypes: ['PRIVATE', 'ENK', 'AS'],
    applies: (p) => has(p, 'childcare'),
    build: (p, { rules }) => {
      const children = Math.max(1, p.children ?? 1);
      const cap = rules.childcare.firstChild + (children - 1) * rules.childcare.perAdditionalChild;
      const amount = Math.min(p.childcareCost ?? cap, cap);
      return {
        id: 'childcare',
        icon: '👶',
        title: 'Foreldrefradrag',
        relevance: 'check',
        reason: `Du har ${children === 1 ? 'ett barn' : `${children} barn`} i barnehage, SFO eller med dagmamma.`,
        explanation: `Utgifter til barnepass gir fradrag opptil ${formatKr(rules.childcare.firstChild)} for ett barn, og ${formatKr(rules.childcare.perAdditionalChild)} ekstra per barn i tillegg. Kostpenger regnes ikke med.`,
        steps: [
          'Sjekk at beløpet i skattemeldingen stemmer – særlig dagmamma og aktivitetsskole.',
          'Fordel fradraget mellom foreldrene hvis det gir bedre effekt.',
        ],
        savings: { min: 0, max: deductionValue(amount, rules) },
      };
    },
  },
  {
    id: 'ips',
    userTypes: ['PRIVATE'],
    applies: (p) => (p.salary ?? 0) > 0,
    build: (p, { rules }) => {
      const saving = has(p, 'ips');
      const max = deductionValue(rules.ips.maxDeposit, rules);
      return {
        id: 'ips',
        icon: '📈',
        title: 'Individuell pensjonssparing (IPS)',
        relevance: saving ? 'check' : 'explore',
        reason: saving
          ? 'Du sparer allerede i IPS.'
          : 'Du har lønnsinntekt og sparer ikke i IPS i dag.',
        explanation: `Sparing i IPS gir fradrag opptil ${formatKr(rules.ips.maxDeposit)} i året, som gir inntil ${formatKr(max)} lavere skatt. Pengene er låst til du er 62 år og skattes som pensjon ved utbetaling.`,
        steps: saving
          ? ['Sjekk at du har spart maksbeløpet hvis det passer økonomien din.']
          : ['Vurder om langsiktig pensjonssparing passer for deg.', 'Sammenlign gebyrer hos ulike banker.'],
        caveats: ['Pengene er bundet til pensjonsalder.', 'Passer best for langsiktig sparing.'],
        savings: saving ? null : { min: 0, max },
      };
    },
  },
];
