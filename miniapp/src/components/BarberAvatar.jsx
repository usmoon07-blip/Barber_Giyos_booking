import SafeImage from './SafeImage';

/** Barber rasmi yoki ism bosh harfi. */
export default function BarberAvatar({ barber, className, fallbackClassName }) {
  return (
    <SafeImage
      src={barber?.photoUrl}
      alt={barber?.name || ''}
      className={className}
      fallbackClassName={fallbackClassName}
      fallback={(barber?.name || '?').charAt(0).toUpperCase()}
    />
  );
}
