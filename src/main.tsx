import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './index.css';

// 생성된 registerSW.js는 등록만 하고 업데이트 확인을 안 함 → 설치형 PWA는 새 버전을 늦게 받는다.
// 앱 시작 + 1시간 주기 + 포커스 복귀 때마다 새 sw.js를 확인한다.
// registerType 'autoUpdate': 새 SW가 제어권을 잡으면 페이지가 자동 리로드된다.
if ('serviceWorker' in navigator) {
  const SW_UPDATE_INTERVAL_MS = 60 * 60 * 1000;
  navigator.serviceWorker.ready.then((registration) => {
    setInterval(() => { void registration.update(); }, SW_UPDATE_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void registration.update();
    });
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
