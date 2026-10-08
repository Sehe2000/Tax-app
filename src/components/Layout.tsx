import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Skattesjekken – til forsiden">
      <span className="logo-mark" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 32 32">
          <path d="M7 17l6 6 12-14" stroke="#7ee2b8" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      Skattesjekken
    </Link>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const inCheck = pathname.startsWith('/sjekk');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
        <div className="container">
          <Logo />
          <nav className="nav" aria-label="Hovedmeny">
            <NavLink to="/lonn-vs-utbytte" className="nav-link">
              Lønn vs. utbytte
            </NavLink>
            <NavLink to="/regnskapsforer" className="nav-link">
              Finn regnskapsfører
            </NavLink>
            {!inCheck && (
              <Link to="/sjekk" className="btn btn-primary btn-sm">
                Start skattesjekken
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      {!inCheck && <Footer />}
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <Logo />
        <p style={{ margin: 0, maxWidth: 640 }}>
          Skattesjekken gir estimater og veiledning om lovlig skatteoptimalisering. Vi gir ikke
          skatterådgivning og hjelper aldri med å skjule inntekt eller føre uriktige fradrag.
        </p>
        <div className="footer-links">
          <Link to="/sjekk">Skattesjekken</Link>
          <Link to="/lonn-vs-utbytte">Lønn vs. utbytte</Link>
          <Link to="/regnskapsforer">Finn regnskapsfører</Link>
          <a href="https://www.skatteetaten.no" target="_blank" rel="noreferrer">
            Skatteetaten.no
          </a>
        </div>
        <span>© {new Date().getFullYear()} Skattesjekken · Prototype</span>
      </div>
    </footer>
  );
}
