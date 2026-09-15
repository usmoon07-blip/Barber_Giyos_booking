import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import { useAdmin } from './context/AdminContext';
import Appointments from './pages/Appointments';
import Barbers from './pages/Barbers';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Reports from './pages/Reports';
import Schedule from './pages/Schedule';
import TimeBlocks from './pages/TimeBlocks';
import Services from './pages/Services';
import Settings from './pages/Settings';
import Users from './pages/Users';
import WorkingHours from './pages/WorkingHours';

export default function App() {
  const { authed, checking } = useAdmin();

  if (checking) return <Loading />;
  if (!authed) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/time-blocks" element={<TimeBlocks />} />
        <Route path="/barbers" element={<Barbers />} />
        <Route path="/services" element={<Services />} />
        <Route path="/working-hours" element={<WorkingHours />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
