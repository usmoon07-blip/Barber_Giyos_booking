/** Sodda chiziqli ikonkalar (tashqi kutubxonasiz). */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" className="bottom-nav__icon" {...props}>
      <path {...base} d="M3 10.5 12 3l9 7.5" />
      <path {...base} d="M5.5 9.5V20h13V9.5" />
      <path {...base} d="M9.5 20v-5.5h5V20" />
    </svg>
  );
}

export function ScissorsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" className="bottom-nav__icon" {...props}>
      <circle {...base} cx="6" cy="6" r="2.6" />
      <circle {...base} cx="6" cy="18" r="2.6" />
      <path {...base} d="M8.2 7.6 20 18M8.2 16.4 20 6" />
    </svg>
  );
}

export function CalendarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" className="bottom-nav__icon" {...props}>
      <rect {...base} x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path {...base} d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" className="bottom-nav__icon" {...props}>
      <circle {...base} cx="12" cy="8.5" r="3.6" />
      <path {...base} d="M4.5 20c.9-3.7 3.9-5.6 7.5-5.6s6.6 1.9 7.5 5.6" />
    </svg>
  );
}

export function CheckIcon({ size = 13, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5 12.5 4.5 4.5L19 7"
      />
    </svg>
  );
}

export function ClockIcon({ size = 16, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...props}>
      <circle {...base} cx="12" cy="12" r="8.6" />
      <path {...base} d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function ChevronIcon({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...props}>
      <path {...base} d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </svg>
  );
}
