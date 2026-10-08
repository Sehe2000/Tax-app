import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatRange, type Opportunity, type Relevance } from '../tax-engine';

export const relevanceLabel: Record<Relevance, string> = {
  likely: 'Kan være relevant for deg',
  explore: 'Bør undersøkes',
  check: 'Sjekk at dette er med',
};

export function RelevancePill({ relevance }: { relevance: Relevance }) {
  return <span className={`pill pill-${relevance}`}>{relevanceLabel[relevance]}</span>;
}

export function OpportunityCard({ opp }: { opp: Opportunity }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`card opp${opp.featured ? ' featured' : ''}`}>
      <div className="opp-head">
        <div className="opp-icon" aria-hidden>
          {opp.icon}
        </div>
        <div>
          <h3>{opp.title}</h3>
          <RelevancePill relevance={opp.relevance} />
        </div>
      </div>

      <p className="opp-reason">{opp.reason}</p>
      <p className="opp-expl">{opp.explanation}</p>

      <div className="opp-effect">
        <span className="k">Potensiell effekt</span>
        {opp.savings ? (
          <span className="v num">{formatRange(opp.savings.min, opp.savings.max)}</span>
        ) : (
          <span className="v none">Avhenger av situasjonen din</span>
        )}
      </div>

      {open && (
        <div className="opp-details">
          <h4>Slik går du frem</h4>
          <ol>
            {opp.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          {opp.caveats && opp.caveats.length > 0 && (
            <>
              <h4>Verdt å vite</h4>
              <ul>
                {opp.caveats.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="opp-foot">
        {opp.action && (
          <Link to={opp.action.to} className="btn btn-primary btn-sm">
            {opp.action.label} →
          </Link>
        )}
        <button className="link-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? 'Skjul detaljer' : 'Se detaljer →'}
        </button>
      </div>
    </article>
  );
}
