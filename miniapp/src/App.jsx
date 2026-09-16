import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import { ErrorState, Loader, Toast } from './components/States';
import { useApp } from './context/AppContext';
import Booking from './pages/Booking';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Services from './pages/Services';
import { getDiagnostics, setBackButton } from './telegram';

export default function App() {
  const { loading, error, reload, onboarded } = useApp();
  const location = useLocation();

  // Bosh sahifada Telegramning "orqaga" tugmasi kerak emas
  useEffect(() => {
    if (location.pathname === '/booking') return undefined;
    return setBackButton(false, () => {});
  }, [location.pathname]);

  // Sahifa almashganda tepaga qaytamiz
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (loading) return <Loader full />;

  if (error) {
    // VAQTINCHALIK tashxis bloki — nosozlik topilgach o'chiriladi.
    return (
      <>
        <ErrorState onRetry={reload} message={error.message} />
        <pre
          style={{
            margin: '0 16px 24px',
            padding: 12,
            background: '#f4f4f5',
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {Object.entries(getDiagnostics())
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n')}
        </pre>
      </>
    );
  }

  if (!onboarded) return <Onboarding />;

  // Bron qilish jarayoni — diqqatni bo'lmaslik uchun pastki menyu yashiriladi
  const showNav = location.pathname !== '/booking';

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showNav ? <BottomNav /> : null}
      <Toast />
    </>
  );
}
