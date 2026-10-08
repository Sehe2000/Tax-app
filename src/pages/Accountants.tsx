import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ContactModal } from '../components/ContactModal';
import { accountants } from '../marketplace/accountants';
import { specializationLabels, type Accountant, type Specialization } from '../marketplace/types';
import type { UserType } from '../tax-engine';

const specForType: Record<UserType, Specialization> = { PRIVATE: 'privat', ENK: 'enk', AS: 'as' };
const filterSpecs: Specialization[] = ['privat', 'enk', 'as', 'grunder', 'holding', 'eiendom'];
const cities = [...new Set(accountants.map((a) => a.city))].sort();

export function Accountants() {
  const [params] = useSearchParams();
  const type = params.get('type') as UserType | null;
  const [spec, setSpec] = useState<Specialization | null>(type && specForType[type] ? specForType[type] : null);
  const [city, setCity] = useState('');
  const [contact, setContact] = useState<Accountant | null>(null);

  const list = useMemo(
    () =>
      accountants
        .filter((a) => !spec || a.specializations.includes(spec))
        .filter((a) => !city || a.city === city || (city === 'remote' && a.remote))
        .sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating),
    [spec, city],
  );

  return (
    <div className="container" style={{ paddingBottom: 56 }}>
      <header className="page-head">
        <span className="eyebrow">Finn en regnskapsfører</span>
        <h1 style={{ marginTop: 14 }}>Få en ekspert til å se på funnene dine</h1>
        <p className="section-lead" style={{ marginBottom: 0 }}>
          Autoriserte regnskapsførere og skatterådgivere som hjelper deg med hva som faktisk gjelder for
          din situasjon.
        </p>
      </header>

      {type && (
        <div className="match-banner" style={{ marginTop: 24 }}>
          <span aria-hidden>✨</span>
          <span>
            Vi viser rådgivere som jobber med {specializationLabels[specForType[type]].toLowerCase()}, basert på
            skattesjekken din.
          </span>
        </div>
      )}

      <div className="filters">
        <div className="chips" role="group" aria-label="Spesialisering">
          <button className={`chip${!spec ? ' active' : ''}`} onClick={() => setSpec(null)}>
            Alle
          </button>
          {filterSpecs.map((s) => (
            <button key={s} className={`chip${spec === s ? ' active' : ''}`} onClick={() => setSpec(s)}>
              {specializationLabels[s]}
            </button>
          ))}
        </div>
        <select className="select" value={city} onChange={(e) => setCity(e.target.value)} aria-label="Sted">
          <option value="">Hele landet</option>
          <option value="remote">Tilbyr digitale møter</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <div className="card empty">Ingen rådgivere matcher filtrene. Prøv et annet sted eller en annen spesialisering.</div>
      ) : (
        <div className="acc-grid">
          {list.map((a) => (
            <AccountantCard key={a.id} a={a} onContact={() => setContact(a)} />
          ))}
        </div>
      )}

      <div className="card pro-band">
        <div>
          <h3 style={{ fontSize: 20 }}>Er du regnskapsfører eller skatterådgiver?</h3>
          <p className="muted" style={{ margin: 0 }}>
            Få kvalifiserte henvendelser fra personer og bedrifter som allerede vet hva de trenger hjelp
            med. Registrering åpner snart.
          </p>
        </div>
        <button className="btn btn-ghost" disabled>
          Kommer snart
        </button>
      </div>

      {contact && <ContactModal accountant={contact} onClose={() => setContact(null)} />}
    </div>
  );
}

function AccountantCard({ a, onContact }: { a: Accountant; onContact: () => void }) {
  const initials = a.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return (
    <article className={`card acc${a.featured ? ' featured' : ''}`}>
      <div className="acc-top">
        <div className="avatar" aria-hidden>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <h3>{a.name}</h3>
          <div className="city">
            📍 {a.city}
            {a.remote ? ' · Digitale møter' : ''}
          </div>
        </div>
      </div>
      {a.featured && (
        <span className="pill pill-featured" style={{ alignSelf: 'flex-start' }}>
          Fremhevet
        </span>
      )}
      <p className="tagline">{a.tagline}</p>
      <div className="tags">
        {a.specializations.map((s) => (
          <span key={s} className="pill pill-neutral">
            {specializationLabels[s]}
          </span>
        ))}
      </div>
      <div className="meta">
        <span>
          <span className="rating">⭐ {a.rating.toLocaleString('nb-NO')}</span> ({a.reviews} vurderinger)
        </span>
        <span>{a.credentials.join(' · ')}</span>
        <span>{a.priceHint}</span>
      </div>
      <button className="btn btn-primary btn-sm" onClick={onContact}>
        Ta kontakt
      </button>
    </article>
  );
}
