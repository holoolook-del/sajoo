import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
import { hasProfile } from './lib/storage.ts';
import { setBgm, syncBgm } from './lib/sound.ts';
import { CardPage } from './pages/card.tsx';
import { CompatPage } from './pages/compat.tsx';
import { FortunePage } from './pages/fortune.tsx';
import { HistoryPage } from './pages/history.tsx';
import { HomePage } from './pages/home.tsx';
import { LuckPage } from './pages/luck.tsx';
import { MoktakPage } from './pages/moktak.tsx';
import { OnboardingPage } from './pages/onboarding.tsx';
import { SajuPage } from './pages/saju.tsx';

function RequireProfile({ children }: { children: ReactNode }) {
  return hasProfile() ? children : <Navigate to="/onboarding" replace />;
}

export function App() {
  // 배경음악 — 자동재생 정책상 첫 사용자 제스처가 있어야 재생되므로
  // 곡을 선언해 두고 모든 포인터 입력에서 재생을 재시도한다.
  useEffect(() => {
    setBgm('bgm');
    const h = () => syncBgm();
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, []);

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
          path="/moktak"
          element={
            <RequireProfile>
              <MoktakPage />
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
