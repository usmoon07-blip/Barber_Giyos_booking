import { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';

export function Loading() {
  return (
    <div className="loading">
      <div className="spinner" />
    </div>
  );
}

export function Empty({ icon = '📭', title, text }) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <p className="empty__title">{title}</p>
      {text ? <p style={{ margin: 0, fontSize: 14 }}>{text}</p> : null}
    </div>
  );
}

export function Toast() {
  const { toast } = useAdmin();
  if (!toast) return null;
  return <div className={`toast${toast.type !== 'info' ? ` toast--${toast.type}` : ''}`}>{toast.message}</div>;
}

export function Modal({ open, title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" style={wide ? { maxWidth: 720 } : undefined}>
        <div className="modal__head">
          <h2 className="modal__title">{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Yopish">
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

/** Rasm yuklanmasa zaxira ko'rinish. */
export function Img({ src, alt = '', className, fallbackClassName, fallback }) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (failed) return <div className={fallbackClassName || className}>{fallback}</div>;

  return <img className={className} src={src} alt={alt} onError={() => setFailed(true)} />;
}

/** 120000 -> "120 000" */
export function formatMoney(amount) {
  return Number(amount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

export const WEEKDAY_NAMES = WEEKDAYS;

/** "2026-09-20" -> "20 sen" */
export function formatDate(dateStr, withWeekday = false) {
  if (!dateStr) return '—';
  const date = new Date(`${dateStr}T00:00:00Z`);
  const base = `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
  return withWeekday ? `${base}, ${WEEKDAYS[date.getUTCDay()].slice(0, 3)}` : base;
}

/** Bugungi sana "YYYY-MM-DD" ko'rinishida (Toshkent vaqti). */
export function todayStr() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export const STATUS_LABELS = {
  PENDING: 'Kutilmoqda',
  CONFIRMED: 'Tasdiqlangan',
  COMPLETED: 'Yakunlangan',
  CANCELLED: 'Bekor qilingan',
};

export const CATEGORY_LABELS = {
  HAIR: 'Soch',
  BEARD: 'Soqol',
  COMBO: 'Kompleks',
  STYLING: 'Styling',
  OTHER: 'Boshqa',
};
