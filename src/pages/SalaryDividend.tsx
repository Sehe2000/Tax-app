import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Disclaimer } from '../components/Disclaimer';
import { Slider } from '../components/Slider';
import { useCheck } from '../state/CheckContext';
import {
  compareScenarios,
  evaluateMix,
  formatKr,
  formatPercent,
  getRules,
  mixForNet,
  optimalMix,
  salaryForNet,
  type CompensationMix,
} from '../tax-engine';

const rules = getRules();
const round = (v: number, to = 10_000) => Math.round(v / to) * to;

export function SalaryDividend() {
  const { profile } = useCheck();
  const fromCheck = profile?.userType === 'AS' && (profile.profit ?? 0) > 0;

  const current = useMemo(() => {
    if (!fromCheck || !profile) return null;
    const mix = evaluateMix(
      profile.profit ?? 0,
      profile.takesSalary ? profile.asSalary ?? 0 : 0,
      profile.takesDividend ? profile.dividend ?? 0 : 0,
      rules,
    );
    return mix.netPersonal > 0 ? mix : null;
  }, [fromCheck, profile]);

  const [profit, setProfit] = useState(() => (fromCheck ? round(profile!.profit!) : 1_000_000));
  const [target, setTarget] = useState(() =>
    current ? round(current.netPersonal) : round(Math.min(profit * 0.5, 600_000)),
  );

  const maxTarget = Math.max(100_000, round(profit * 0.6));
  const net = Math.min(target, maxTarget);
  const maxSalary = salaryForNet(net, rules);
  const [salaryShare, setSalaryShare] = useState(0.6);
  const customSalary = round(maxSalary * salaryShare, 5_000);

  const scenarios = useMemo(() => compareScenarios(profit, net, rules), [profit, net]);
  const custom = useMemo(() => mixForNet(profit, customSalary, net, rules), [profit, customSalary, net]);
  const best = useMemo(() => optimalMix(profit, net, rules), [profit, net]);
  const currentBest = useMemo(
    () => (current && profile ? optimalMix(profile.profit ?? 0, current.netPersonal, rules) : null),
    [current, profile],
  );

  const effectiveRate = (m: CompensationMix) => m.totalTax / (m.totalTax + m.netPersonal);

  return (
    <div className="container" style={{ paddingBottom: 56 }}>
      <header className="page-head">
        {fromCheck && (
          <Link to="/resultat" className="back-link">
            ← Tilbake til skattesjekken
          </Link>
        )}
        <span className="eyebrow">For deg med AS</span>
        <h1 style={{ marginTop: 14 }}>Lønn vs. utbytte</h1>
        <p className="section-lead" style={{ marginBottom: 0 }}>
          Hvor mye vil du ha utbetalt etter skatt? Se hvordan ulike kombinasjoner av lønn og utbytte
          påvirker skatten – for samme beløp i lomma.
        </p>
      </header>

      {current && currentBest && (
        <div className="match-banner" style={{ marginTop: 24 }}>
          <span aria-hidden>💡</span>
          <span>
            I dag tar du ut {formatKr(current.salary)} i lønn og {formatKr(current.dividend)} i utbytte, og sitter
            igjen med ca. {formatKr(current.netPersonal)}. Samlet skatt og avgift er estimert til{' '}
            <strong>{formatKr(current.totalTax)}</strong>.{' '}
            {current.totalTax - currentBest.totalTax > 2_000 ? (
              <>
                Med en annen fordeling kan det samme beløpet potensielt koste ca.{' '}
                <strong>{formatKr(current.totalTax - currentBest.totalTax)} mindre</strong> i skatt.
              </>
            ) : (
              'Fordelingen din ser fornuftig ut skattemessig.'
            )}
          </span>
        </div>
      )}

      <div className="calc-grid">
        <div className="card calc-inputs">
          <Slider
            id="profit"
            label="Overskudd før eierlønn"
            value={profit}
            min={200_000}
            max={5_000_000}
            step={10_000}
            onChange={setProfit}
          />
          <Slider
            id="target"
            label="Ønsket utbetalt til deg etter skatt"
            value={net}
            min={100_000}
            max={maxTarget}
            step={10_000}
            onChange={setTarget}
            hint="Det du vil sitte igjen med privat i løpet av året."
          />
          <Slider
            id="salary"
            label="Din egen fordeling – lønn"
            value={customSalary}
            min={0}
            max={round(maxSalary, 5_000)}
            step={5_000}
            onChange={(v) => setSalaryShare(maxSalary ? v / maxSalary : 0)}
            hint={`Resten tas ut som utbytte: ${formatKr(custom.dividend)}`}
          />
        </div>

        <div className="calc-results">
          <div className="card highlight-card">
            <div className="kpi">
              <div className="k">Din fordeling – skatt og avgift</div>
              <div className="v">{formatKr(custom.totalTax)}</div>
            </div>
            <div className="kpi">
              <div className="k">Effektiv skattesats</div>
              <div className="v">{formatPercent(effectiveRate(custom))}</div>
            </div>
            <div className="kpi">
              <div className="k">Mulig besparelse mot din fordeling</div>
              <div className="v good">{formatKr(Math.max(0, custom.totalTax - best.totalTax))}</div>
            </div>
            {!custom.feasible && (
              <p className="warn" style={{ gridColumn: '1 / -1', margin: 0 }}>
                ⚠️ Overskuddet er ikke stort nok til denne fordelingen.
              </p>
            )}
          </div>

          <div className="card scenario-list" aria-label="Scenarier">
            <p className="small muted" style={{ margin: '8px 16px 4px' }}>
              Alle scenariene gir deg ca. <strong style={{ color: 'var(--ink)' }}>{formatKr(net)}</strong> etter skatt.
            </p>
            {scenarios
              .filter(
                (s) =>
                  s.id !== 'optimal' ||
                  !scenarios.some((o) => o.id !== 'optimal' && Math.abs(o.mix.salary - s.mix.salary) < 5_000),
              )
              .map((s) => {
              const isBest = s.mix.feasible && Math.abs(s.mix.totalTax - best.totalTax) < 1;
              return (
                <ScenarioRow
                  key={s.id}
                  label={s.label}
                  mix={s.mix}
                  best={isBest}
                  extra={s.mix.totalTax - best.totalTax}
                />
              );
            })}
          </div>

          <div className="bar-legend" style={{ padding: '0 4px' }}>
            <span>
              <i style={{ background: 'var(--brand-2)' }} />
              Lønn
            </span>
            <span>
              <i style={{ background: 'var(--accent)' }} />
              Utbytte
            </span>
          </div>

          <div className="card notes">
            <h3>Mer enn bare skatt</h3>
            <ul>
              <li>Lønn gir pensjonsopptjening i folketrygden (opptil 7,1 G) og rett til sykepenger (opptil 6 G).</li>
              <li>Lønn teller med når banken vurderer boliglån. Utbytte vektlegges ofte mindre.</li>
              <li>Lønn gir rett til foreldrepenger og arbeidsavklaringspenger.</li>
              <li>Overskudd som blir igjen i selskapet skattes bare med 22 % til det tas ut.</li>
            </ul>
          </div>

          <div className="card notes">
            <h3>Slik er det regnet</h3>
            <ul>
              <li>Satser for {rules.year}: arbeidsgiveravgift {formatPercent(rules.employerContribution)} (sone 1), selskapsskatt {formatPercent(rules.corporateTax, 0)}, utbytte oppjustert med {String(rules.dividendGrossUp).replace('.', ',')}.</li>
              <li>«Skatt og avgift» = arbeidsgiveravgift + skatt på lønn + selskapsskatt på utdelt overskudd + skatt på utbytte.</li>
              <li>Forenklet: skjermingsfradrag, pensjon (OTP), andre inntekter og fradrag er ikke tatt med.</li>
            </ul>
          </div>

          <Disclaimer>
            Kalkulatoren er forenklet og er ikke profesjonell skatterådgivning. Tallene er estimater.
            Kontroller alltid med en autorisert regnskapsfører eller skatterådgiver før du vedtar lønn
            eller utbytte.
          </Disclaimer>

          <Link to="/regnskapsforer?type=AS" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Få en regnskapsfører til å se på dette →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ScenarioRow({ label, mix, best, extra }: { label: string; mix: CompensationMix; best: boolean; extra: number }) {
  const total = mix.salary + mix.dividend || 1;
  const lowSalary = mix.salary < 0.5 * rules.G;
  return (
    <div className={`scenario${best ? ' best' : ''}`}>
      <div className="scenario-head">
        <strong>{label}</strong>
        {best ? (
          <span className="pill pill-likely">Lavest estimert skatt</span>
        ) : mix.feasible ? (
          <span className="pill pill-neutral">+{formatKr(extra)} i skatt</span>
        ) : (
          <span className="pill pill-explore">Ikke nok overskudd</span>
        )}
      </div>
      <div className="bar" aria-hidden>
        <div className="s" style={{ width: `${(mix.salary / total) * 100}%` }} />
        <div className="d" style={{ width: `${(mix.dividend / total) * 100}%` }} />
      </div>
      <div className="scenario-nums">
        <div>
          <span className="k">Lønn</span>
          <span className="v">{formatKr(mix.salary)}</span>
        </div>
        <div>
          <span className="k">Utbytte</span>
          <span className="v">{formatKr(mix.dividend)}</span>
        </div>
        <div>
          <span className="k">Estimert skatt og avgift</span>
          <span className="v">{formatKr(mix.totalTax)}</span>
        </div>
        <div>
          <span className="k">Igjen i selskapet</span>
          <span className="v">{formatKr(Math.max(0, mix.retainedAfterTax))}</span>
        </div>
      </div>
      {lowSalary && <span className="warn">Lav lønn gir svake rettigheter til sykepenger og pensjon.</span>}
    </div>
  );
}
