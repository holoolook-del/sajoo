import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { hasProfile } from './lib/storage.ts';
import { setBgm, syncBgm } from './lib/sound.ts';
import { firebaseReady } from './lib/firebase.ts';
import { NightBackdrop } from './components/night-backdrop.tsx';
import { CardPage } from './pages/card.tsx';
import { CompatPage } from './pages/compat.tsx';
import { FortunePage } from './pages/fortune.tsx';
import { HistoryPage } from './pages/history.tsx';
import { HomePage } from './pages/home.tsx';
import { LotsPage } from './pages/lots.tsx';
import { LuckPage } from './pages/luck.tsx';
import { MoktakPage } from './pages/moktak.tsx';
import { OnboardingPage } from './pages/onboarding.tsx';
import { SajuPage } from './pages/saju.tsx';
import { SleepPage } from './pages/sleep.tsx';
import { TestHubPage, TestPage } from './pages/test.tsx';

// Firebase SDK가 크므로 게시판은 진입할 때만 로드 (초기 번들에 포함 안 함)
const BoardPage = lazy(() => import('./pages/board.tsx').then((m) => ({ default: m.BoardPage })));

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

  // 동시접속자 카운트 — 앱 전체 방문자 기준. firebase 미설정이면 건너뛰고,
  // posts 모듈은 지연 로드해 초기 번들에 Firebase를 싣지 않는다.
  useEffect(() => {
    if (!firebaseReady) return;
    void import('./features/board/posts.ts').then((m) => m.startPresence()).catch(() => {});
  }, []);

  return (
    <HashRouter>
      <NightBackdrop />
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
          element={<CompatPage />}
        />
        {/* 테스트·게시판은 프로필 없이도 가능 — 공유 링크로 친구가 바로 들어오는 입구 */}
        <Route path="/test" element={<TestHubPage />} />
        <Route path="/test/:id" element={<TestPage />} />
        <Route
          path="/board"
          element={
            <Suspense fallback={<p className="p-10 text-center text-sm text-hanji/40">불러오는 중…</p>}>
              <BoardPage />
            </Suspense>
          }
        />
        <Route
          path="/lots"
          element={
            <RequireProfile>
              <LotsPage />
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
          path="/sleep"
          element={
            <RequireProfile>
              <SleepPage />
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
