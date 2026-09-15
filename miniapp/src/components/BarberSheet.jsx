import { useApp } from '../context/AppContext';
import { localized } from '../i18n';
import { haptic } from '../telegram';
import BarberAvatar from './BarberAvatar';
import BottomSheet from './BottomSheet';

/** Barber profili — pastdan chiquvchi oyna. */
export default function BarberSheet({ barber, onClose, onBook }) {
  const { language, text } = useApp();

  if (!barber) return null;

  const bio = localized(barber, 'bio', language);

  return (
    <BottomSheet
      open={Boolean(barber)}
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            haptic('medium');
            onBook(barber);
          }}
        >
          {text.home.book}
        </button>
      }
    >
      <div style={{ padding: '18px 16px 4px', textAlign: 'center' }}>
        <BarberAvatar
          barber={barber}
          className="sheet-avatar"
          fallbackClassName="sheet-avatar sheet-avatar--fallback"
        />

        <h2 style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
          {barber.name}
        </h2>

        {bio ? (
          <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '0 8px 16px', lineHeight: 1.55 }}>{bio}</p>
        ) : null}
      </div>
    </BottomSheet>
  );
}
