import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatNumber, type Profile, type UserType } from '../tax-engine';
import { useCheck } from '../state/CheckContext';
import {
  visibleQuestions,
  type MultiQuestion,
  type NumberQuestion,
  type Question,
  type SingleQuestion,
} from '../questionnaire/questions';

const USER_TYPES: UserType[] = ['PRIVATE', 'ENK', 'AS'];

export function Check() {
  const { answers, setAnswer, reset } = useCheck();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  // Snarvei fra forsiden: /sjekk?type=AS hopper over første spørsmål.
  useEffect(() => {
    const type = params.get('type') as UserType | null;
    if (type && USER_TYPES.includes(type)) {
      if (answers.userType !== type) reset({ userType: type });
      setStep(1);
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const questions = useMemo(() => visibleQuestions(answers), [answers]);
  const index = Math.min(step, questions.length - 1);
  const question = questions[index];
  const isLast = index === questions.length - 1 && !!answers.userType;
  const progress = answers.userType ? ((index + 1) / (questions.length + 1)) * 100 : 4;

  const next = () => {
    if (isLast) {
      setFinishing(true);
      return;
    }
    setStep(index + 1);
    window.scrollTo(0, 0);
  };

  const back = () => {
    if (index === 0) navigate('/');
    else setStep(index - 1);
  };

  if (finishing) return <Analysing onDone={() => navigate('/resultat')} />;

  return (
    <div className="container check-shell">
      <div className="check-top" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <div className="progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${progress}%` }} />
        </div>
        <div className="check-meta">
          <button className="link-btn" onClick={back} style={{ color: 'var(--muted)' }}>
            ← Tilbake
          </button>
          <span>{answers.userType ? `Steg ${index + 1} av ${questions.length}` : 'Kom i gang'}</span>
        </div>
      </div>

      <QuestionView
        key={`${question.id}-${index}`}
        question={question}
        answers={answers}
        onAnswer={(value) => {
          if (question.id === 'userType') {
            if (value !== answers.userType) reset({ userType: value as UserType });
          } else {
            setAnswer(question.id, value as Profile[typeof question.id]);
          }
        }}
        onNext={next}
        isLast={isLast}
      />
    </div>
  );
}

interface ViewProps {
  question: Question;
  answers: Partial<Profile>;
  onAnswer: (value: unknown) => void;
  onNext: () => void;
  isLast: boolean;
}

function QuestionView(props: ViewProps) {
  const { question } = props;
  return (
    <>
      <div className="check-body">
        <h1 className="q-title">{question.title}</h1>
        {question.help ? <p className="q-help">{question.help}</p> : <div style={{ height: 16 }} />}
        {question.kind === 'single' && <Single {...props} question={question} />}
        {question.kind === 'multi' && <Multi {...props} question={question} />}
        {question.kind === 'number' && <NumberField {...props} question={question} />}
        <p className="trust-note">
          <span aria-hidden>🔒</span> Svarene dine lagres bare i nettleseren din.
        </p>
      </div>
    </>
  );
}

function Single({ question, answers, onAnswer, onNext }: ViewProps & { question: SingleQuestion }) {
  const current = answers[question.id];
  const big = question.id === 'userType';
  return (
    <div className={`options${!big && question.options.length <= 2 ? ' grid-2' : ''}`}>
      {question.options.map((o) => (
        <button
          key={String(o.value)}
          className={`option${big ? ' big' : ''}${current === o.value ? ' selected' : ''}`}
          onClick={() => {
            onAnswer(o.value);
            setTimeout(onNext, 180);
          }}
        >
          {o.icon && (
            <span className="o-icon" aria-hidden>
              {o.icon}
            </span>
          )}
          <span className="o-label">
            {o.label}
            {o.description && <span className="o-desc">{o.description}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

function Multi({ question, answers, onAnswer, onNext, isLast }: ViewProps & { question: MultiQuestion }) {
  const selected = (answers[question.id] as string[] | undefined) ?? [];
  const toggle = (v: string) =>
    onAnswer(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  return (
    <>
      <div className="options grid-2">
        {question.options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              key={o.value}
              className={`option${on ? ' selected' : ''}`}
              onClick={() => toggle(o.value)}
              aria-pressed={on}
            >
              {o.icon && (
                <span className="o-icon" aria-hidden>
                  {o.icon}
                </span>
              )}
              <span className="o-label">{o.label}</span>
              <span className="o-check" aria-hidden>
                {on ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>
      <div className="check-actions">
        {selected.length === 0 ? (
          <button
            className="btn btn-primary"
            onClick={() => {
              onAnswer([]);
              onNext();
            }}
          >
            {question.noneLabel ?? 'Hopp over'} →
          </button>
        ) : (
          <button className="btn btn-primary" onClick={onNext}>
            {isLast ? 'Se resultatet' : 'Fortsett'} →
          </button>
        )}
      </div>
    </>
  );
}

function NumberField({ question, answers, onAnswer, onNext, isLast }: ViewProps & { question: NumberQuestion }) {
  const stored = answers[question.id] as number | undefined;
  const [text, setText] = useState(stored != null ? formatNumber(stored) : '');
  const value = text ? Number(text.replace(/\D/g, '')) : undefined;
  const valid = value != null && value >= 0 && (!question.max || value <= question.max);
  const canContinue = valid || (question.optional && !text);

  const update = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 9);
    setText(digits ? formatNumber(Number(digits)) : '');
    onAnswer(digits ? Number(digits) : undefined);
  };

  const submit = () => {
    if (canContinue) onNext();
  };

  return (
    <>
      <div className="num-input">
        <input
          inputMode="numeric"
          autoFocus
          aria-label={question.title}
          placeholder={question.placeholder != null ? formatNumber(question.placeholder) : '0'}
          value={text}
          onChange={(e) => update(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <span className="unit">{question.unit}</span>
      </div>
      {question.suggestions && (
        <div className="chips">
          {question.suggestions.map((s) => (
            <button
              key={s}
              className={`chip${value === s ? ' active' : ''}`}
              onClick={() => update(String(s))}
            >
              {formatNumber(s)} {question.unit}
            </button>
          ))}
        </div>
      )}
      <div className="check-actions">
        {question.optional && !text && (
          <button className="btn btn-ghost" onClick={onNext}>
            Vet ikke
          </button>
        )}
        <button className="btn btn-primary" onClick={submit} disabled={!canContinue || (!valid && !question.optional)}>
          {isLast ? 'Se resultatet' : 'Fortsett'} →
        </button>
      </div>
    </>
  );
}

const ANALYSIS_STEPS = [
  'Leser svarene dine',
  'Sjekker fradrag og satser for 2026',
  'Beregner mulig effekt',
  'Lager din oversikt',
];

function Analysing({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done >= ANALYSIS_STEPS.length) {
      const t = setTimeout(onDone, 250);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((d) => d + 1), 420);
    return () => clearTimeout(t);
  }, [done, onDone]);

  return (
    <div className="analysing" aria-live="polite">
      <div>
        <div className="spinner" />
        <h2 style={{ fontSize: 26 }}>Vi går gjennom situasjonen din …</h2>
        <ul className="analysing-list">
          {ANALYSIS_STEPS.map((s, i) => (
            <li key={s} className={i < done ? 'done' : ''}>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
