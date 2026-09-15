import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { Toast } from './ui';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/appointments', label: 'Bronlar', icon: '📅' },
  { to: '/barbers', label: 'Barberlar', icon: '💈' },
  { to: '/services', label: 'Xizmatlar', icon: '✂️' },
  { to: '/working-hours', label: 'Ish jadvali', icon: '🕐' },
  { to: '/users', label: 'Mijozlar', icon: '👥' },
  { to: '/settings', label: 'Sozlamalar', icon: '⚙️' },
];

export default function Layout() {
  const { shopName, logout } = useAdmin();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <div className="topbar">
        <div className="topbar__brand">
          <span>💈</span>
          <span>{shopName}</span>
        </div>
        <button type="button" className="burger" onClick={() => setMenuOpen(true)} aria-label="Menyu">
          ☰
        </button>
      </div>

      <div className="layout">
        {menuOpen ? (
          <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} role="presentation" />
        ) : null}

        <aside className={`sidebar${menuOpen ? ' sidebar--open' : ''}`}>
          <div className="sidebar__brand">
            <div className="sidebar__logo">💈</div>
            <div className="sidebar__name">{shopName}</div>
          </div>

          <nav className="sidebar__nav">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
              >
                <span className="sidebar__icon">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar__footer">
            <button type="button" className="sidebar__link" style={{ width: '100%' }} onClick={logout}>
              <span className="sidebar__icon">🚪</span>
              <span>Chiqish</span>
            </button>
          </div>
        </aside>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <Toast />
    </>
  );
}
