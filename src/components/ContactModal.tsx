import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useCheck } from '../state/CheckContext';
import { findOpportunities, formatRange } from '../tax-engine';
import { submitLead } from '../marketplace/leadService';
import type { Accountant } from '../marketplace/types';

export function ContactModal({ accountant, onClose }: { accountant: Accountant; onClose: () => void }) {
  const { profile } = useCheck();
  const report = useMemo(() => (profile ? findOpportunities(profile) : null), [profile]);
  const [share, setShare] = useState(true);
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    setSending(true);
    await submitLead({
      accountantId: accountant.id,
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      message: form.message || undefined,
      userType: profile?.userType,
      checkSummary:
        share && report
          ? {
              opportunities: report.opportunities.map((o) => o.title),
              savingsMin: Math.round(report.totalSavings.min),
              savingsMax: Math.round(report.totalSavings.max),
            }
          : undefined,
      consent,
    });
    setSending(false);
    setSent(true);
  };

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="contact-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 id="contact-title">{sent ? 'Forespørselen er sendt' : `Kontakt ${accountant.name}`}</h2>
            {!sent && <p className="muted small" style={{ margin: '4px 0 0' }}>{accountant.responseTime} · {accountant.priceHint}</p>}
          </div>
          <button className="close" onClick={onClose} aria-label="Lukk">
            ×
          </button>
        </div>

        {sent ? (
          <div className="success">
            <div className="big" aria-hidden>
              ✅
            </div>
            <p>
              {accountant.name} har fått forespørselen din og tar kontakt på e-post
              {form.phone ? ' eller telefon' : ''}. Det er ingen forpliktelser før dere har avtalt noe.
            </p>
            <p className="small muted">Prototype: forespørselen er bare lagret lokalt i nettleseren din.</p>
            <button className="btn btn-primary btn-block" onClick={onClose}>
              Ferdig
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="c-name">Navn</label>
              <input id="c-name" required autoComplete="name" value={form.name} onChange={set('name')} />
            </div>
            <div className="field">
              <label htmlFor="c-email">E-post</label>
              <input id="c-email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
            </div>
            <div className="field">
              <label htmlFor="c-phone">Telefon (valgfritt)</label>
              <input id="c-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="field">
              <label htmlFor="c-msg">Hva vil du ha hjelp med? (valgfritt)</label>
              <textarea id="c-msg" rows={3} value={form.message} onChange={set('message')} />
            </div>

            {report && report.opportunities.length > 0 && (
              <>
                <label className="checkbox">
                  <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
                  <span>Del oppsummeringen av skattesjekken min, så rådgiveren er forberedt.</span>
                </label>
                {share && (
                  <div className="share-box">
                    <strong>Deles:</strong> {report.opportunities.length} områder, estimert{' '}
                    {formatRange(report.totalSavings.min, report.totalSavings.max)}
                    <ul>
                      {report.opportunities.slice(0, 5).map((o) => (
                        <li key={o.id}>{o.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <label className="checkbox">
              <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>Jeg samtykker til at {accountant.name} kan kontakte meg om denne forespørselen.</span>
            </label>

            <button className="btn btn-primary btn-block" disabled={sending || !consent}>
              {sending ? 'Sender …' : 'Send forespørsel'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
