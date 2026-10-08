# Skattesjekken

Prototype av en norsk webapp for **lovlig skatteoptimalisering**. Brukeren forteller om situasjonen sin
(privatperson, ENK eller AS), og appen finner mulige fradrag og valg, forklarer dem enkelt og
kobler brukeren med en regnskapsfører ved behov.

## Kom i gang

```bash
npm install
npm run dev      # utviklingsserver
npm test         # tester for skattemotoren
npm run build    # typesjekk + produksjonsbygg til dist/
```

## Struktur

```
src/
  tax-engine/            Ren TypeScript, ingen UI-avhengigheter
    rules/2026.ts        ALLE satser og grenser for inntektsåret 2026
    rules/index.ts       getRules(year) – legg til nytt år her
    personalTax.ts       Forenklet personbeskatning (lønn, næring, utbytte)
    ownerCompensation.ts Lønn vs. utbytte: scenarier og optimering
    opportunities/       Regelbasert mulighetsmotor
      private.ts | enk.ts | as.ts | expenses.ts
      index.ts           findOpportunities(profile) + registrering av regler
  questionnaire/         Spørsmål som data, med showIf for progressiv utspørring
  marketplace/           Rådgivertyper, mock-data og lead-tjeneste
  pages/                 Forside, sjekk, resultat, kalkulator, markedsplass
```

### Ny mulighet

Skriv en `OpportunityRule` (`applies` + `build`) i riktig fil under `opportunities/` og legg den i
listen. Trengs nye opplysninger, legg til felt i `Profile` og et spørsmål i `questionnaire/questions.ts`.

### Nytt inntektsår

Kopier `rules/2026.ts` til f.eks. `rules/2027.ts`, oppdater tallene og registrer filen i `rules/index.ts`.

## Forenklinger (bevisst for MVP)

- Ingen skjermingsfradrag, OTP-kostnad, formuesskatt eller kommunale særregler.
- Arbeidsgiveravgift sone 1. Kostnadsestimater er typiske intervaller, ikke brukerens faktiske tall.
- Leads lagres bare i nettleserens `localStorage` – ingen backend.

Alle tall vises som estimater. Appen skal aldri oppfordre til å skjule inntekt eller føre uriktige fradrag.
