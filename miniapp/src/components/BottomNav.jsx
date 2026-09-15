import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { haptic } from '../telegram';
import { CalendarIcon, HomeIcon, ScissorsIcon, UserIcon } from './Icons';

export default function BottomNav() {
  const { text } = useApp();

  const items = [
    { to: '/', label: text.nav.home, Icon: HomeIcon, end: true },
    { to: '/services', label: text.nav.services, Icon: ScissorsIcon },
    { to: '/booking', label: text.nav.booking, Icon: CalendarIcon },
    { to: '/profile', label: text.nav.profile, Icon: UserIcon },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => haptic('light')}
          className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
