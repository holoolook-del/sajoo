import { HashRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/home.tsx';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </HashRouter>
  );
}
