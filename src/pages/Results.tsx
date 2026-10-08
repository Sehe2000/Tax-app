import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Disclaimer } from '../components/Disclaimer';
import { OpportunityCard, RelevancePill } from '../components/OpportunityCard';
import { useCheck } from '../state/CheckContext';
import { findOpportunities, formatRange, type UserType } from '../tax-engine';

const typeLabel: Record<UserType, string> = {
  PRIVATE: 'privatperson',
  ENK: 'enkeltpersonforetak',
  AS: 'aksjeselskap',
};

const countWords = ['ingen', 'ett', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte', 'ni', 'ti'];

export function Results() {
  const { profile } = useCheck();
  const report = useMemo(() => (profile ? findOpportunities(profile) : null), [profile]);

  if (!profile || !report) return <Navigate to="/sjekk" replace />;

  const { opportunities, totalSavings } = report;
  const n = opportunities.length;
  const word = countWords[n] ?? String(n);

  return (
    <div className="container">
      <header className="results-head">
        <span className="eyebrow">Skattesjekk for {typeLabel[profile.userType]} · 2026</span>
        <h1 style={{ marginTop: 14 }}>Din skattesjekk</h1>
        <p className="lead">
          {n === 0
            ? 'Vi fant ingen tydelige muligheter basert på svarene dine.'
            : `Vi fant ${word} ${n === 1 ? 'område' : 'områder'} du bør undersøke nærmere.`}
        </p>
      </header>

      {n > 0 && (
        <section className="summary">
          <div className="total-card">
            <div className="label">Potensielt å spare per år</div>
            <div className="value num">
              {totalSavings.max > 0 ? formatRange(totalSavings.min, totalSavings.max) : 'Bør undersøkes'}
            </div>
            <p className="note">Estimert basert på opplysningene du har gitt.</p>
            <span className="tag">Estimat – ikke en garanti</span>
          </div>
          <div className="card legend-card">
            <h3>Slik leser du resultatet</h3>
            <div className="legend-row">
              <RelevancePill relevance="likely" />
              <span>Svarene dine peker tydelig hit.</span>
            </div>
            <div className="legend-row">
              <RelevancePill relevance="explore" />
              <span>Kan gi effekt, men avhenger av detaljer.</span>
            </div>
            <div className="legend-row">
              <RelevancePill relevance="check" />
              <span>Fradraget finnes ofte allerede – kontroller at det er riktig.</span>
            </div>
          </div>
        </section>
      )}

      {n > 0 ? (
        <section className="opps" aria-label="Muligheter">
          {opportunities.map((o) => (
            <OpportunityCard key={o.id} opp={o} />
          ))}
        </section>
      ) : (
        <div className="card empty">
          <p>Prøv å endre svarene dine, eller snakk med en regnskapsfører for en grundigere gjennomgang.</p>
          <Link to="/sjekk" className="btn btn-ghost">
            Endre svar
          </Link>
        </div>
      )}

      <section className="advisor-cta">
        <div>
          <h2>Vil du være helt sikker?</h2>
          <p>
            En regnskapsfører eller skatterådgiver kan kontrollere funnene dine og hjelpe deg med hva
            som faktisk gjelder for din situasjon.
          </p>
        </div>
        <div className="btns">
          <Link to={`/regnskapsforer?type=${profile.userType}`} className="btn btn-accent">
            Finn en regnskapsfører →
          </Link>
          <Link to="/sjekk" className="btn btn-ghost">
            Endre svarene mine
          </Link>
        </div>
      </section>

      <div style={{ marginBottom: 56 }}>
        <Disclaimer />
      </div>
    </div>
  );
}
