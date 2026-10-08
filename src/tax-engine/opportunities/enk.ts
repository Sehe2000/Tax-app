import { businessExpenseValue, deductionValue, personalTax } from '../personalTax';
import { formatKr, formatNumber } from '../format';
import { enkCostEffect, enkIncome } from './shared';
import type { OpportunityRule } from './types';

export const enkRules: OpportunityRule[] = [
  {
    id: 'enk-home-office',
    userTypes: ['ENK'],
    applies: (p) => p.homeOffice === 'dedicated' || p.homeOffice === 'partial',
    build: (p, { rules }) => {
      const dedicated = p.homeOffice === 'dedicated';
      const income = enkIncome(p);
      return {
        id: 'enk-home-office',
        icon: '🏠',
        title: 'Hjemmekontor',
        relevance: 'likely',
        reason: dedicated
          ? 'Du har et eget rom hjemme som bare brukes til jobb.'
          : 'Du jobber hjemmefra, men uten et eget rom kun til jobb.',
        explanation: dedicated
          ? 'Med et eget rom som kun brukes i virksomheten kan du føre en forholdsmessig andel av husleie/strøm, forsikring og vedlikehold som kostnad.'
          : `Uten eget rom kan du likevel ta et fast sjablongfradrag på ${formatKr(rules.homeOfficeStandard)} i året for bruk av egen bolig.`,
        steps: dedicated
          ? [
              'Regn ut rommets andel av boligens areal.',
              'Før samme andel av relevante boutgifter som kostnad.',
            ]
          : ['Før sjablongfradraget i næringsoppgaven.'],
        caveats: dedicated
          ? ['Rommet kan ikke brukes privat, f.eks. som gjesterom.', 'Eier du boligen, kan utleie til egen virksomhet få andre skattevirkninger – sjekk med rådgiver.']
          : [],
        savings: dedicated
          ? enkCostEffect(p, { min: 6_000, max: 20_000 }, rules)
          : {
              min: 0,
              max: businessExpenseValue(rules.homeOfficeStandard, income, rules),
            },
      };
    },
  },
  {
    id: 'enk-vehicle',
    userTypes: ['ENK'],
    applies: (p) => p.vehicle === 'private' || p.vehicle === 'business',
    build: (p, { rules }) => {
      const km = p.businessKm ?? 0;
      const privateCar = p.vehicle === 'private';
      const cost =
        km > 0
          ? { min: km * rules.mileageAllowance * 0.8, max: km * rules.mileageAllowance }
          : { min: 3_000 * rules.mileageAllowance, max: 8_000 * rules.mileageAllowance };
      return {
        id: 'enk-vehicle',
        icon: '🚙',
        title: 'Bil i virksomheten',
        relevance: privateCar ? 'likely' : 'explore',
        reason: privateCar
          ? km
            ? `Du kjører omtrent ${formatNumber(km)} km i året med privat bil for virksomheten.`
            : 'Du bruker privat bil i virksomheten.'
          : 'Virksomheten eier bil.',
        explanation: privateCar
          ? `Kjøring med privat bil i virksomheten kan føres som kostnad med ${rules.mileageAllowance.toLocaleString('nb-NO', { minimumFractionDigits: 2 })} kr per km. Det krever en kjørebok.`
          : 'Når bilen eies av virksomheten, føres alle bilkostnader i regnskapet, mens privat bruk inntektsføres etter egne regler. Hva som lønner seg avhenger av bilens pris, type og hvor mye du kjører privat.',
        steps: privateCar
          ? ['Før kjørebok med dato, formål og antall km.', 'Før kilometergodtgjørelsen som kostnad.']
          : ['Sjekk at privat bruk er beregnet riktig.', 'Sammenlign med å eie bilen privat.'],
        caveats: ['Kjøring mellom hjem og fast arbeidssted er ikke yrkeskjøring.'],
        savings: privateCar ? enkCostEffect(p, cost, rules) : null,
      };
    },
  },
  {
    id: 'enk-pension',
    userTypes: ['ENK'],
    applies: (p, { rules }) => p.pensionSaving !== 'yes' && (p.profit ?? 0) > 2 * rules.G,
    build: (p, { rules }) => {
      const base = Math.max(0, Math.min(p.profit ?? 0, 12 * rules.G) - rules.G);
      return {
        id: 'enk-pension',
        icon: '🌱',
        title: 'Pensjonssparing som selvstendig',
        relevance: 'explore',
        reason: 'Som selvstendig næringsdrivende har du ingen tjenestepensjon fra en arbeidsgiver.',
        explanation: `Med en pensjonsordning for selvstendig næringsdrivende kan du sette av inntil ${Math.round(rules.pension.selfEmployedMaxRate * 100)} % av inntekten mellom 1 G og 12 G og få fradrag for innskuddet. I tillegg kommer IPS med fradrag opptil ${formatKr(rules.ips.maxDeposit)}.`,
        steps: ['Sammenlign tilbud fra banker og pensjonsselskaper.', 'Velg et innskuddsnivå som passer likviditeten din.'],
        caveats: ['Pengene er bundet til pensjonsalder og skattes ved utbetaling.'],
        savings: {
          min: deductionValue(base * 0.02, rules),
          max: deductionValue(base * rules.pension.selfEmployedMaxRate + rules.ips.maxDeposit, rules),
        },
      };
    },
  },
  {
    id: 'enk-startup',
    userTypes: ['ENK'],
    applies: (p) => p.newBusiness === true,
    build: (p, { rules }) => ({
      id: 'enk-startup',
      icon: '🚀',
      title: 'Oppstartskostnader',
      relevance: 'explore',
      reason: 'Du har startet virksomheten nylig.',
      explanation:
        'Kostnader du hadde før virksomheten kom i gang – som utstyr, nettside, logo og markedsføring – kan ofte føres som kostnad når de er knyttet til virksomheten.',
      steps: ['Gå gjennom kjøp fra månedene før oppstart.', 'Samle kvitteringer og før dem i regnskapet.'],
      caveats: ['Kostnadene må ha klar tilknytning til virksomheten.'],
      savings: enkCostEffect({ ...p, expensesBooked: 'none' }, { min: 2_000, max: 15_000 }, rules),
    }),
  },
  {
    id: 'enk-consider-as',
    userTypes: ['ENK'],
    applies: (p) => (p.profit ?? 0) >= 750_000,
    build: (p, { rules }) => {
      const tax = personalTax(enkIncome(p), rules).total;
      return {
        id: 'enk-consider-as',
        icon: '🏛️',
        title: 'Bør du vurdere AS?',
        relevance: 'explore',
        reason: `Med et overskudd på ${formatKr(p.profit ?? 0)} betaler du anslagsvis ${formatKr(tax)} i skatt som ENK.`,
        explanation:
          'I et ENK skattes hele overskuddet hos deg hvert år, også det du lar stå i virksomheten. I et AS skattes overskudd som blir igjen i selskapet med 22 %, og du kan selv styre når og hvordan du tar ut penger.',
        steps: ['Vurder hvor mye du faktisk trenger å ta ut privat.', 'Få en rådgiver til å regne på omdanning til AS.'],
        caveats: ['AS gir mer administrasjon og høyere regnskapskostnader.', 'Penger tatt ut som lønn eller utbytte skattes også.'],
        savings: null,
        action: { label: 'Prøv lønn/utbytte-kalkulatoren', to: '/lonn-vs-utbytte' },
      };
    },
  },
  {
    id: 'enk-separate',
    userTypes: ['ENK'],
    applies: (p) => p.expensesBooked !== 'all',
    build: () => ({
      id: 'enk-separate',
      icon: '🧾',
      title: 'Skill privat og næring',
      relevance: 'explore',
      reason: 'Du fører ikke alle jobbutgifter i regnskapet i dag.',
      explanation:
        'Mange enkeltpersonforetak går glipp av fradrag fordi kvitteringer blandes med privatøkonomien. En egen bankkonto og et kort for virksomheten gjør det mye enklere å få med alle kostnader.',
      steps: ['Opprett en egen konto og et kort for virksomheten.', 'Ta bilde av kvitteringer med en gang.'],
      savings: null,
    }),
  },
];

