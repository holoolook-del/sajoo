import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { hasProfile } from './lib/storage.ts';
import { CardPage } from './pages/card.tsx';
import { CompatPage } from './pages/compat.tsx';
import { FortunePage } from './pages/fortune.tsx';
import { HistoryPage } from './pages/history.tsx';
import { HomePage } from './pages/home.tsx';
import { LuckPage } from './pages/luck.tsx';
import { OnboardingPage } from './pages/onboarding.tsx';
import { SajuPage } from './pages/saju.tsx';

function RequireProfile({ children }: { children: ReactNode }) {
  return hasProfile() ? children : <Navigate to="/onboarding" replace />;
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/saju"
          element={
            <RequireProfile>
              <SajuPage />
            </RequireProfile>
          }
        />
        <Route
          path="/card"
          element={
            <RequireProfile>
              <CardPage />
            </RequireProfile>
          }
        />
        <Route
          path="/luck"
          element={
            <RequireProfile>
              <LuckPage />
            </RequireProfile>
          }
        />
        <Route
          path="/compat"
          element={
            <RequireProfile>
              <CompatPage />
            </RequireProfile>
          }
        />
        <Route
          path="/history"
          element={
            <RequireProfile>
              <HistoryPage />
            </RequireProfile>
          }
        />
        <Route
          path="/fortune"
          element={
            <RequireProfile>
              <FortunePage />
            </RequireProfile>
          }
        />
      </Routes>
    </HashRouter>
  );
}
