import { useApp } from '../context/AppContext';
import { formatPrice, localized } from '../i18n';
import { haptic } from '../telegram';
import BottomSheet from './BottomSheet';
import SafeImage from './SafeImage';

/** Xizmat tafsilotlari — pastdan chiquvchi oyna. */
export default function ServiceSheet({ service, onClose, onBook }) {
  const { language, text } = useApp();

  if (!service) return null;

  const name = localized(service, 'name', language);
  const description = localized(service, 'description', language);

  return (
    <BottomSheet
      open={Boolean(service)}
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            haptic('medium');
            onBook(service);
          }}
        >
          {text.services.book} — {formatPrice(service.price, language)}
        </button>
      }
    >
      {service.imageUrl ? (
        <SafeImage
          src={service.imageUrl}
          alt={name}
          className="sheet__img"
          fallbackClassName="sheet__img sheet__img--empty"
          fallback="✂️"
        />
      ) : null}

      <h2 className="sheet__title">{name}</h2>

      <div className="sheet__meta">
        <span>⏱ {text.common.minutes(service.duration)}</span>
        <span>
          💰 {formatPrice(service.price, language)}
          {service.oldPrice ? (
            <span className="price--old" style={{ marginLeft: 6 }}>
              {formatPrice(service.oldPrice, language)}
            </span>
          ) : null}
        </span>
      </div>

      {description ? <p className="sheet__text">{description}</p> : null}
    </BottomSheet>
  );
}
