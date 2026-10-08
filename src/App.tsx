import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Accountants } from './pages/Accountants';
import { Check } from './pages/Check';
import { Landing } from './pages/Landing';
import { Results } from './pages/Results';
import { SalaryDividend } from './pages/SalaryDividend';
import { CheckProvider } from './state/CheckContext';

export function App() {
  return (
    <CheckProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="sjekk" element={<Check />} />
            <Route path="resultat" element={<Results />} />
            <Route path="lonn-vs-utbytte" element={<SalaryDividend />} />
            <Route path="regnskapsforer" element={<Accountants />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CheckProvider>
  );
}
