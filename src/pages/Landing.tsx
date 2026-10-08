import { Link } from 'react-router-dom';
import { Disclaimer } from '../components/Disclaimer';

const previewRows = [
  { icon: '💰', title: 'Lønn vs. utbytte', amount: '18 000–36 000 kr' },
  { icon: '💻', title: 'Utstyr og programvare', amount: '4 000–11 000 kr' },
  { icon: '🚙', title: 'Kilometergodtgjørelse', amount: '6 000–12 000 kr' },
  { icon: '🌱', title: 'Pensjon gjennom selskapet', amount: 'Bør undersøkes' },
];

const types = [
  {
    to: '/sjekk?type=PRIVATE',
    emoji: '👤',
    title: 'Privatperson',
    text: 'For ansatte og privatpersoner.',
    items: ['Reisefradrag', 'Rentefradrag', 'BSU og IPS', 'Fagforening og gaver', 'Foreldrefradrag'],
  },
  {
    to: '/sjekk?type=ENK',
    emoji: '💼',
    title: 'Enkeltpersonforetak',
    text: 'For deg som driver for deg selv.',
    items: ['Hjemmekontor', 'Utstyr og programvare', 'Bil og reiser', 'Oppstartskostnader', 'Pensjon som selvstendig'],
  },
  {
    to: '/sjekk?type=AS',
    emoji: '🏢',
    title: 'Aksjeselskap',
    text: 'Den mest avanserte sjekken – for deg som eier eget AS.',
    items: ['Lønn vs. utbytte', 'Kostnader selskapet kan dekke', 'Pensjon og OTP', 'Kilometergodtgjørelse', 'Holding og overskudd'],
    highlight: true,
  },
];

const faq = [
  {
    q: 'Er dette lovlig?',
    a: 'Ja. Vi viser bare fradrag og valg som er i tråd med norske skatteregler – det som ofte kalles lovlig skatteoptimalisering. Vi hjelper aldri med å skjule inntekt eller føre fradrag du ikke har krav på.',
  },
  {
    q: 'Hvor nøyaktige er tallene?',
    a: 'Tallene er estimater basert på svarene dine og forenklede beregninger med satsene for inntektsåret 2026. De gir en pekepinn på hvor det kan være verdt å se nærmere, ikke en fasit.',
  },
  {
    q: 'Hva skjer med opplysningene mine?',
    a: 'Svarene dine lagres bare i nettleseren din mens du bruker tjenesten. Vi deler ingenting med regnskapsførere med mindre du selv velger å ta kontakt.',
  },
  {
    q: 'Koster det noe?',
    a: 'Nei, skattesjekken er gratis. Vil du at en regnskapsfører skal se på situasjonen din, avtaler du pris direkte med dem.',
  },
];

export function Landing() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Lovlig skatteoptimalisering · 2026</span>
            <h1>
              Betaler du mer skatt <em>enn du trenger?</em>
            </h1>
            <p className="hero-sub">
              Finn lovlige skattefradrag og muligheter for å optimalisere skatten din, basert på din
              situasjon.
            </p>
            <div className="hero-ctas">
              <Link to="/sjekk" className="btn btn-primary">
                Start skattesjekken →
              </Link>
              <a href="#hvordan" className="btn btn-ghost">
                Hvordan fungerer det?
              </a>
            </div>
            <div className="hero-trust">
              <span>Tar 2–3 minutter</span>
              <span>Gratis</span>
              <span>Ingen innlogging</span>
            </div>
          </div>

          <div className="card preview" aria-label="Eksempel på resultat">
            <div className="preview-total">
              <div className="label">Potensielt å spare · eksempel AS</div>
              <div className="value">28 000–59 000 kr</div>
              <div className="label">Estimert basert på opplysningene du har gitt</div>
            </div>
            {previewRows.map((r) => (
              <div className="preview-row" key={r.title}>
                <span className="icon" aria-hidden>
                  {r.icon}
                </span>
                <span className="title">{r.title}</span>
                <span className="amount">{r.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="hvordan" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <span className="eyebrow">Hvordan fungerer det?</span>
          <h2 className="section-title" style={{ marginTop: 14 }}>
            Fortell oss om situasjonen din. Vi finner mulighetene.
          </h2>
          <p className="section-lead">
            Du trenger ikke vite hvilke fradrag som finnes. Svar på noen enkle spørsmål, så gjør vi
            jobben.
          </p>
          <div className="steps">
            {[
              ['Svar på noen spørsmål', 'Om jobben, bedriften og økonomien din. Vi spør bare om det som er relevant.'],
              ['Vi finner mulighetene', 'Skattemotoren vår sjekker situasjonen din mot gjeldende regler.'],
              ['Få det forklart enkelt', 'Hver mulighet forklares på godt norsk, med estimert effekt.'],
              ['Få hjelp av en ekspert', 'Vil du være helt sikker, kobler vi deg med en regnskapsfører.'],
            ].map(([title, text], i) => (
              <div className="card step" key={title}>
                <div className="step-num">{i + 1}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Hva gjelder deg?</h2>
          <p className="section-lead">Skattesjekken tilpasses om du er ansatt, har ENK eller eier eget AS.</p>
          <div className="types">
            {types.map((t) => (
              <Link to={t.to} key={t.title} className={`card type-card${t.highlight ? ' highlight' : ''}`}>
                <span className="emoji" aria-hidden>
                  {t.emoji}
                </span>
                <h3>{t.title}</h3>
                <p style={{ margin: 0, opacity: 0.85 }}>{t.text}</p>
                <ul>
                  {t.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <span className="go">Start sjekken →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section dark-band">
        <div className="container">
          <h2 className="section-title">Ikke enda en skattekalkulator</h2>
          <p className="section-lead">
            Kalkulatorer forutsetter at du vet hva du skal lete etter. Det gjør de færreste.
          </p>
          <div className="compare">
            <div className="card old" style={{ color: 'var(--ink)' }}>
              <h3 className="muted">Vanlig opplevelse</h3>
              <p className="quote muted">«Her er 20 kalkulatorer. Velg en.»</p>
            </div>
            <div className="card" style={{ color: 'var(--ink)' }}>
              <h3 style={{ color: 'var(--brand-2)' }}>Skattesjekken</h3>
              <p className="quote">«Fortell oss om deg selv, så finner vi mulighetene for deg.»</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Vanlige spørsmål</h2>
          <div className="faq">
            {faq.map((f) => (
              <details className="card" key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 760 }}>
            <Link to="/sjekk" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Start skattesjekken →
            </Link>
            <Disclaimer />
          </div>
        </div>
      </section>
    </>
  );
}
