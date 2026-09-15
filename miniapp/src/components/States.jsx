import { useApp } from '../context/AppContext';

export function Loader({ full = false }) {
  const { text } = useApp();

  return (
    <div className="center-state" style={full ? { minHeight: '100vh' } : undefined}>
      <div className="spinner" />
      <p className="center-state__text" style={{ marginTop: 14 }}>
        {text.common.loading}
      </p>
    </div>
  );
}

export function ErrorState({ onRetry, message }) {
  const { text } = useApp();

  return (
    <div className="center-state">
      <div className="center-state__icon">⚠️</div>
      <h2 className="center-state__title">{text.common.error}</h2>
      <p className="center-state__text">{message || ''}</p>
      {onRetry ? (
        <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>
          {text.common.retry}
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ icon = '📭', title, text: description, action }) {
  return (
    <div className="center-state">
      <div className="center-state__icon">{icon}</div>
      <h2 className="center-state__title">{title}</h2>
      {description ? <p className="center-state__text">{description}</p> : null}
      {action}
    </div>
  );
}

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  return <div className={`toast${toast.type !== 'info' ? ` toast--${toast.type}` : ''}`}>{toast.message}</div>;
}
