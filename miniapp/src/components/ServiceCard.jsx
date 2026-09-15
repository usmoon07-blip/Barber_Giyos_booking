import SafeImage from './SafeImage';
import { useApp } from '../context/AppContext';
import { formatPrice, localized } from '../i18n';
import { haptic } from '../telegram';

/** Xizmat kartasi — bosilganda batafsil oyna ochiladi. */
export default function ServiceCard({ service, onClick }) {
  const { language, text } = useApp();

  const name = localized(service, 'name', language);
  const description = localized(service, 'description', language);

  return (
    <button
      type="button"
      className="service-card"
      onClick={() => {
        haptic('light');
        onClick(service);
      }}
    >
      <SafeImage
        src={service.imageUrl}
        alt={name}
        className="service-card__img"
        fallbackClassName="service-card__img service-card__img--empty"
        fallback="✂️"
      />

      <div className="service-card__body">
        <h3 className="service-card__name">{name}</h3>
        <p className="service-card__meta">
          {text.common.minutes(service.duration)}
          {description ? ` · ${description}` : ''}
        </p>
        <div className="price-row">
          <span className="price">{formatPrice(service.price, language)}</span>
          {service.oldPrice ? <span className="price--old">{formatPrice(service.oldPrice, language)}</span> : null}
        </div>
      </div>
    </button>
  );
}
