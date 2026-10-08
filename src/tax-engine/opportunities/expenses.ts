import { usesExpense } from '../profile';
import type { ExpenseKey } from '../rules';
import { asCostEffect, enkCostEffect, sumCosts } from './shared';
import type { OpportunityRule } from './types';

interface ExpenseGroup {
  id: string;
  keys: ExpenseKey[];
  icon: string;
  title: string;
  what: string;
  enk: { explanation: string; steps: string[] };
  as: { explanation: string; steps: string[] };
  caveats: string[];
}

const groups: ExpenseGroup[] = [
  {
    id: 'phone-internet',
    keys: ['phone', 'internet'],
    icon: '📱',
    title: 'Telefon og internett',
    what: 'telefon og internett',
    enk: {
      explanation:
        'Telefon og internett som brukes i virksomheten kan føres som kostnad. Brukes det også privat, fører du den delen som gjelder næringen.',
      steps: ['Samle fakturaene for året.', 'Anslå hvor stor andel som er jobbrelatert, og før den som kostnad.'],
    },
    as: {
      explanation:
        'Selskapet kan som hovedregel betale mobil og internett som du trenger i jobben. Det er en kostnad for selskapet og normalt ikke skattepliktig for deg.',
      steps: ['Flytt abonnementene over på selskapet, eller få dem refundert mot faktura.', 'Sjekk reglene for privat bruk med regnskapsfører.'],
    },
    caveats: ['Privat andel kan ikke føres som kostnad.'],
  },
  {
    id: 'equipment',
    keys: ['computer', 'equipment'],
    icon: '💻',
    title: 'Utstyr og datamaskin',
    what: 'datamaskin, skjerm og annet utstyr',
    enk: {
      explanation:
        'Datamaskin, skjerm, kontorstol og annet utstyr du bruker i virksomheten er fradragsberettiget. Utstyr under 30 000 kr kan normalt kostnadsføres samme år; dyrere utstyr avskrives over flere år.',
      steps: ['Ta vare på kvitteringer.', 'Før utstyret som kostnad eller avskrivning i regnskapet.'],
    },
    as: {
      explanation:
        'Kjøper selskapet utstyret, er det en kostnad i selskapet. Kjøper du det selv, betaler du med penger som allerede er skattet som lønn eller utbytte.',
      steps: ['La selskapet kjøpe arbeidsutstyr direkte.', 'Utstyr over 30 000 kr avskrives i selskapet.'],
    },
    caveats: ['Utstyret må i hovedsak brukes i virksomheten.'],
  },
  {
    id: 'software',
    keys: ['software'],
    icon: '🧩',
    title: 'Programvare og abonnementer',
    what: 'programvare og digitale abonnementer',
    enk: {
      explanation:
        'Abonnementer som regnskapsprogram, design- og kontorverktøy, skylagring og nettside er vanlige driftskostnader.',
      steps: ['Gå gjennom kortutskriften for faste trekk.', 'Før de jobbrelaterte som kostnad.'],
    },
    as: {
      explanation:
        'Programvare du bruker i jobben bør betales av selskapet. Mange gründere betaler slike abonnementer privat uten å tenke over det.',
      steps: ['Flytt abonnementene til selskapets kort.', 'Be om faktura i selskapets navn.'],
    },
    caveats: ['Rent private abonnementer (strømming o.l.) er ikke fradragsberettiget.'],
  },
  {
    id: 'courses',
    keys: ['courses'],
    icon: '🎓',
    title: 'Kurs og faglig oppdatering',
    what: 'kurs, faglitteratur og konferanser',
    enk: {
      explanation:
        'Kurs, konferanser og faglitteratur som vedlikeholder eller oppdaterer kompetansen du bruker i virksomheten, kan føres som kostnad.',
      steps: ['Samle kvitteringer for kurs, bøker og konferanser.', 'Før dem som kostnad i regnskapet.'],
    },
    as: {
      explanation:
        'Selskapet kan dekke kurs og faglig oppdatering knyttet til jobben din. Det er en kostnad for selskapet og normalt skattefritt for deg.',
      steps: ['La selskapet betale kursavgiften direkte.'],
    },
    caveats: ['Utdanning som gir helt ny kompetanse (f.eks. en ny grad) gir normalt ikke fradrag.'],
  },
  {
    id: 'business-travel',
    keys: ['travel'],
    icon: '✈️',
    title: 'Jobbreiser',
    what: 'reiser i jobbsammenheng',
    enk: {
      explanation:
        'Reiser til kunder, møter og oppdrag er driftskostnader. Ved overnatting kan du i tillegg ha fradrag for kost etter statens satser.',
      steps: ['Før reiseregning med formål, dato og sted.', 'Ta vare på billetter og kvitteringer.'],
    },
    as: {
      explanation:
        'Selskapet kan dekke jobbreiser og utbetale skattefrie diett- og kostgodtgjørelser etter statens satser når reiseregningen er korrekt.',
      steps: ['Lever reiseregning til selskapet for hver reise.', 'Bruk statens satser for kost og overnatting.'],
    },
    caveats: ['Reiser mellom hjem og fast arbeidssted er ikke jobbreiser.'],
  },
  {
    id: 'office',
    keys: ['office'],
    icon: '🏢',
    title: 'Kontorlokaler',
    what: 'kontorplass eller kontorfellesskap',
    enk: {
      explanation: 'Leie av kontorplass eller kontorfellesskap er en vanlig driftskostnad.',
      steps: ['Sørg for at leieavtale og fakturaer står på virksomheten.'],
    },
    as: {
      explanation: 'Kontorleie bør stå på selskapet og føres som kostnad der.',
      steps: ['Få leieavtalen over på selskapet.'],
    },
    caveats: [],
  },
  {
    id: 'services',
    keys: ['services'],
    icon: '📊',
    title: 'Regnskap og rådgivning',
    what: 'regnskapsfører, advokat og annen rådgivning',
    enk: {
      explanation:
        'Honorar til regnskapsfører, revisor, advokat og andre rådgivere som gjelder virksomheten, er fradragsberettiget.',
      steps: ['Før alle honorarer i regnskapet.'],
    },
    as: {
      explanation: 'Profesjonelle tjenester for selskapet skal betales av selskapet og føres som kostnad.',
      steps: ['Be om faktura i selskapets navn.'],
    },
    caveats: [],
  },
];

export const expenseRules: OpportunityRule[] = groups.flatMap((g): OpportunityRule[] => {
  const selected = (p: Parameters<OpportunityRule['applies']>[0]) =>
    g.keys.filter((k) => usesExpense(p, k));
  return [
    {
      id: `enk-${g.id}`,
      userTypes: ['ENK'],
      applies: (p) => selected(p).length > 0,
      build: (p, { rules }) => {
        const booked = p.expensesBooked ?? 'none';
        return {
          id: `enk-${g.id}`,
          icon: g.icon,
          title: g.title,
          relevance: booked === 'all' ? 'check' : 'likely',
          reason:
            booked === 'all'
              ? `Du bruker ${g.what} i virksomheten og fører det allerede som kostnad.`
              : `Du bruker ${g.what} i virksomheten.`,
          explanation: g.enk.explanation,
          steps: g.enk.steps,
          caveats: g.caveats,
          savings: enkCostEffect(p, sumCosts(selected(p), rules), rules),
        };
      },
    },
    {
      id: `as-${g.id}`,
      userTypes: ['AS'],
      applies: (p) => selected(p).length > 0 && p.paysPrivately !== 'no',
      build: (p, { rules }) => ({
        id: `as-${g.id}`,
        icon: g.icon,
        title: g.title,
        relevance: p.paysPrivately === 'yes' ? 'likely' : 'explore',
        reason:
          p.paysPrivately === 'yes'
            ? `Du betaler selv for ${g.what} som brukes i selskapet.`
            : `Du er usikker på om du betaler ${g.what} privat.`,
        explanation: g.as.explanation,
        steps: g.as.steps,
        caveats: g.caveats,
        savings: asCostEffect(p, sumCosts(selected(p), rules), rules),
      }),
    },
  ];
});
