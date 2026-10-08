import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { hasProfile } from './lib/storage.ts';
import { HomePage } from './pages/home.tsx';
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
      </Routes>
    </HashRouter>
  );
}
