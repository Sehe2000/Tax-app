export const DISCLAIMER_TEXT =
  'Dette er et estimat basert på opplysningene du har gitt. Reglene kan variere basert på din situasjon. Kontroller alltid resultatene med en autorisert regnskapsfører eller skatterådgiver før du foretar økonomiske eller skattemessige disposisjoner.';

export function Disclaimer({ children }: { children?: React.ReactNode }) {
  return (
    <div className="disclaimer" role="note">
      <span className="i" aria-hidden>
        i
      </span>
      <p>{children ?? DISCLAIMER_TEXT}</p>
    </div>
  );
}
