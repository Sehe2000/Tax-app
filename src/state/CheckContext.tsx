import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Profile } from '../tax-engine';
import { pruneAnswers, type Answers } from '../questionnaire/questions';

const STORAGE_KEY = 'skattesjekk:answers';

interface CheckState {
  answers: Answers;
  setAnswer: <K extends keyof Profile>(key: K, value: Profile[K] | undefined) => void;
  reset: (initial?: Answers) => void;
  /** Ferdig profil, eller null hvis brukeren ikke har startet. */
  profile: Profile | null;
}

const CheckContext = createContext<CheckState | null>(null);

function load(): Answers {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Answers) : {};
  } catch {
    return {};
  }
}

function save(answers: Answers) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // Lagring er bare en bekvemmelighet.
  }
}

export function CheckProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<Answers>(load);

  const setAnswer = useCallback<CheckState['setAnswer']>((key, value) => {
    setAnswers((prev) => {
      const next = pruneAnswers({ ...prev, [key]: value });
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback((initial: Answers = {}) => {
    save(initial);
    setAnswers(initial);
  }, []);

  const value = useMemo<CheckState>(
    () => ({
      answers,
      setAnswer,
      reset,
      profile: answers.userType ? (answers as Profile) : null,
    }),
    [answers, setAnswer, reset],
  );

  return <CheckContext.Provider value={value}>{children}</CheckContext.Provider>;
}

export function useCheck(): CheckState {
  const ctx = useContext(CheckContext);
  if (!ctx) throw new Error('useCheck må brukes innenfor CheckProvider');
  return ctx;
}
