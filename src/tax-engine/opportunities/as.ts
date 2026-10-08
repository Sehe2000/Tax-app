import { evaluateMix, optimalMix, salaryBenefits } from '../ownerCompensation';
import { dividendTax, marginalRate } from '../personalTax';
import { formatKr, formatNumber } from '../format';
import { asCostEffect, asDividend, asPrivatePaymentFactor, asSalary } from './shared';
import type { OpportunityRule } from './types';

export const asRules: OpportunityRule[] = [
  {
    id: 'as-salary-dividend',
    userTypes: ['AS'],
    applies: (p) => (p.profit ?? 0) > 0,
    build: (p, { rules }) => {
      const profit = p.profit ?? 0;
      const salary = asSalary(p);
      const dividend = asDividend(p);
      const current = evaluateMix(profit, salary, dividend, rules);
      const takesOut = current.netPersonal > 0;
      const best = takesOut ? optimalMix(profit, current.netPersonal, rules) : null;
      const diff = best ? current.totalTax - best.totalTax : 0;
      const benefits = salaryBenefits(salary, rules);

      const parts: string[] = [];
      if (salary) parts.push(`${formatKr(salary)} i lønn`);
      if (dividend) parts.push(`${formatKr(dividend)} i utbytte`);

      const caveats = [
        'Lønn gir pensjonsopptjening, sykepenger og foreldrepenger. Utbytte gir ikke dette.',
        'Banker ser ofte på lønn når du søker boliglån.',
      ];
      if (benefits.belowMinimumForBenefits) {
        caveats.unshift('Med svært lav eller ingen lønn har du lite eller ingen rett til sykepenger fra NAV.');
      }

      return {
        id: 'as-salary-dividend',
        icon: '💰',
        title: 'Lønn vs. utbytte',
        featured: true,
        relevance: diff > 2_000 ? 'likely' : 'explore',
        reason: takesOut
          ? `Du tar i dag ut ${parts.join(' og ')} fra AS-et ditt.`
          : 'Du tar i dag verken ut lønn eller utbytte fra AS-et.',
        explanation: takesOut
          ? diff > 2_000
            ? `Fordelingen mellom lønn og utbytte påvirker den totale skatten. Med en annen fordeling – for eksempel rundt ${formatKr(Math.round((best?.salary ?? 0) / 10_000) * 10_000)} i lønn – kan du potensielt sitte igjen med det samme, men betale mindre i skatt og avgifter.`
            : 'Fordelingen din ser fornuftig ut skattemessig. Det kan likevel være verdt å se på hvordan lønnsnivået påvirker pensjon, sykepenger og lånemuligheter.'
          : 'Når du skal ta ut penger, avgjør fordelingen mellom lønn og utbytte hvor mye som går til skatt. Kalkulatoren viser forskjellene.',
        steps: [
          'Se scenariene i kalkulatoren.',
          'Bestem hvor mye du trenger privat i året.',
          'Avklar med regnskapsfører før lønn og utbytte vedtas.',
        ],
        caveats,
        savings: takesOut && diff > 500 ? { min: diff * 0.5, max: diff } : null,
        action: { label: 'Se og sammenlign', to: '/lonn-vs-utbytte' },
      };
    },
  },
  {
    id: 'as-home-office',
    userTypes: ['AS'],
    applies: (p) => p.homeOffice === 'dedicated' || p.homeOffice === 'partial',
    build: (p) => ({
      id: 'as-home-office',
      icon: '🏠',
      title: 'Hjemmekontor',
      relevance: 'explore',
      reason: 'Du jobber hjemmefra.',
      explanation:
        'Som ansatt i eget AS får du ikke vanlig fradrag for hjemmekontor. Selskapet kan likevel dekke arbeidsutstyr som skjerm, kontorstol og internett. ' +
        (p.homeOffice === 'dedicated'
          ? 'Har du et eget rom kun til jobb, kan det i noen tilfeller leies ut til selskapet, men dette har egne skatteregler.'
          : ''),
      steps: [
        'La selskapet kjøpe utstyret du bruker på hjemmekontoret.',
        'Snakk med en rådgiver før du eventuelt leier ut rom til selskapet.',
      ],
      caveats: ['Utleie av del av egen bolig til eget selskap må gjøres på markedsmessige vilkår.'],
      savings: null,
    }),
  },
  {
    id: 'as-vehicle',
    userTypes: ['AS'],
    applies: (p) => p.vehicle === 'private' || p.vehicle === 'business',
    build: (p, { rules }) => {
      const km = p.businessKm ?? 0;
      const privateCar = p.vehicle === 'private';
      const allowance = (km || 5_000) * rules.mileageAllowance;
      const factor = asPrivatePaymentFactor(p, rules);
      return {
        id: 'as-vehicle',
        icon: '🚙',
        title: 'Kilometergodtgjørelse',
        relevance: privateCar ? 'likely' : 'explore',
        reason: privateCar
          ? km
            ? `Du kjører omtrent ${formatNumber(km)} km i året for selskapet med privat bil.`
            : 'Du bruker privat bil i jobb for selskapet.'
          : 'Selskapet eier bil.',
        explanation: privateCar
          ? `Selskapet kan betale deg skattefri kilometergodtgjørelse på ${rules.mileageAllowance.toLocaleString('nb-NO', { minimumFractionDigits: 2 })} kr per km for jobbkjøring. For ${formatNumber(km || 5_000)} km blir det ${formatKr(allowance)} – penger du ellers måtte tatt ut som skattepliktig lønn eller utbytte.`
          : 'Når selskapet eier bilen, blir privat bruk en skattepliktig fordel for deg. Om det lønner seg avhenger av bilens listepris, type og hvor mye du kjører privat.',
        steps: privateCar
          ? ['Før kjørebok med dato, formål og km.', 'Lever reiseregning til selskapet og få godtgjørelsen utbetalt.']
          : ['Sjekk at bilfordelen er riktig beregnet.', 'Sammenlign med privat eierskap og kilometergodtgjørelse.'],
        caveats: ['Kjøring mellom hjem og fast arbeidssted er ikke yrkeskjøring.'],
        savings: privateCar
          ? { min: allowance * factor * 0.5, max: allowance * factor }
          : null,
      };
    },
  },
  {
    id: 'as-pension',
    userTypes: ['AS'],
    applies: (p) => p.companyPension !== 'yes' && asSalary(p) > 0,
    build: (p, { rules }) => {
      const salary = asSalary(p);
      const base = Math.min(salary, 12 * rules.G);
      const m = marginalRate({ wage: salary }, 'wage', rules);
      const effect = Math.max(0.1, m - 0.25);
      return {
        id: 'as-pension',
        icon: '🌱',
        title: 'Pensjon gjennom selskapet',
        relevance: p.companyPension === 'no' ? 'likely' : 'explore',
        reason:
          p.companyPension === 'no'
            ? 'Selskapet har ingen pensjonsordning for deg.'
            : 'Du er usikker på om selskapet har pensjonsordning.',
        explanation: `Selskapet kan spare ${Math.round(rules.pension.employerMinRate * 100)}–${Math.round(rules.pension.employerMaxRate * 100)} % av lønnen din i innskuddspensjon. Innskuddet er en kostnad for selskapet, og du skattes først når pensjonen utbetales – ofte med lavere skatt enn i dag.`,
        steps: [
          'Sjekk om selskapet er pliktig til å ha obligatorisk tjenestepensjon (OTP).',
          'Innhent tilbud og velg innskuddssats.',
        ],
        caveats: [
          'Effekten er i stor grad utsatt skatt – pensjonen skattes ved utbetaling.',
          'Mange AS med eier som ansatt er pliktige til å ha OTP.',
        ],
        savings: {
          min: base * rules.pension.employerMinRate * effect,
          max: base * rules.pension.employerMaxRate * effect,
        },
      };
    },
  },
  {
    id: 'as-holding',
    userTypes: ['AS'],
    applies: (p) =>
      p.ownership !== 'holding' && (p.retainsProfit === true || asDividend(p) > 0 || (p.profit ?? 0) > 500_000),
    build: (p, { rules }) => {
      const dividend = asDividend(p);
      const viaHolding = dividend * rules.exemptionMethodTaxableShare * rules.corporateTax;
      return {
        id: 'as-holding',
        icon: '🏗️',
        title: 'Holdingselskap og overskudd i selskapet',
        relevance: 'explore',
        reason:
          p.ownership === 'unsure'
            ? 'Du er usikker på hvordan aksjene dine eies.'
            : 'Du eier aksjene direkte og har overskudd i selskapet.',
        explanation:
          dividend > 0
            ? `Av et utbytte på ${formatKr(dividend)} betaler du anslagsvis ${formatKr(dividendTax(dividend, rules))} i skatt når det tas ut privat. Går utbyttet til et holdingselskap, er skatten bare ca. ${formatKr(viaHolding)} (fritaksmetoden) – så lenge pengene blir i selskapsstrukturen, f.eks. til nye investeringer.`
            : 'Med et holdingselskap kan overskudd flyttes fra driftsselskapet og investeres videre nesten uten skatt (fritaksmetoden). Skatt på utbytte betales først når pengene tas ut privat.',
        steps: [
          'Vurder om du vil reinvestere overskudd i stedet for å ta det ut privat.',
          'Få en rådgiver til å se på skattefri omdanning til holdingstruktur.',
        ],
        caveats: [
          'Gir i hovedsak utsatt skatt, ikke lavere skatt på penger du bruker privat.',
          'En ekstra selskapsstruktur gir mer administrasjon og kostnader.',
        ],
        savings: null,
      };
    },
  },
  {
    id: 'as-company-expenses-general',
    userTypes: ['AS'],
    applies: (p) => p.paysPrivately === 'yes' && (p.businessExpenses?.length ?? 0) === 0,
    build: (p, { rules }) => ({
      id: 'as-company-expenses-general',
      icon: '🧾',
      title: 'Kostnader selskapet kan dekke',
      relevance: 'likely',
      reason: 'Du betaler selv for ting som i hovedsak brukes i selskapet.',
      explanation:
        'Når du betaler jobbutgifter privat, betaler du med penger som allerede er skattet. Lar du selskapet betale, blir det en fradragsberettiget kostnad i selskapet.',
      steps: ['Gå gjennom kortutskriften for jobbrelaterte kjøp.', 'Lever utlegg til refusjon i selskapet.'],
      savings: asCostEffect(p, { min: 3_000, max: 15_000 }, rules),
    }),
  },
];
