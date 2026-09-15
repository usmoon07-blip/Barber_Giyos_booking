import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import SafeImage from '../components/SafeImage';
import { EmptyState, ErrorState, Loader } from '../components/States';
import { useApp } from '../context/AppContext';
import { formatDate, formatPrice, localized } from '../i18n';
import { haptic, openLink } from '../telegram';

export default function Profile() {
  const { text, language, setLanguage, user, setUser, shop, showToast } = useApp();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('upcoming');
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setAppointments(await api.getAppointments());
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setNameDraft(user?.firstName || '');
  }, [user]);

  const today = new Date().toISOString().slice(0, 10);

  const { upcoming, past } = useMemo(() => {
    const upcomingList = [];
    const pastList = [];

    for (const item of appointments) {
      const isActive = ['PENDING', 'CONFIRMED'].includes(item.status);
      if (isActive && item.date >= today) upcomingList.push(item);
      else pastList.push(item);
    }

    upcomingList.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
    return { upcoming: upcomingList, past: pastList };
  }, [appointments, today]);

  const onTheWay = async (appointment) => {
    setBusyId(appointment.id);
    try {
      const updated = await api.markOnTheWay(appointment.id);
      haptic('success');
      setAppointments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      showToast(text.profile.onTheWayDone, 'success');
    } catch (requestError) {
      haptic('error');
      showToast(requestError.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (appointment) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(text.profile.cancelConfirm)) return;

    setBusyId(appointment.id);
    try {
      const updated = await api.cancelAppointment(appointment.id);
      haptic('warning');
      setAppointments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (requestError) {
      haptic('error');
      const known = text.booking.errors[requestError.code];
      showToast(known || requestError.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed.length < 2) return;

    try {
      const data = await api.updateMe({ firstName: trimmed });
      setUser(data.user);
      setEditing(false);
      haptic('success');
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  };

  if (loading) return <Loader full />;
  if (error) return <ErrorState onRetry={load} message={error.message} />;

  const list = tab === 'upcoming' ? upcoming : past;
  const initial = (user?.firstName || '?').charAt(0).toUpperCase();

  return (
    <div className="page">
      <h1 className="page__title">{text.profile.title}</h1>

      <div className="profile-head">
        <SafeImage
          src={user?.photoUrl}
          alt=""
          className="profile-head__avatar"
          fallbackClassName="profile-head__avatar"
          fallback={initial}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="field__input"
                style={{ minHeight: 42 }}
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                autoFocus
              />
              <button type="button" className="btn btn--primary btn--sm" onClick={saveName}>
                {text.profile.save}
              </button>
            </div>
          ) : (
            <>
              <h2 className="profile-head__name">{user?.firstName}</h2>
              <p className="profile-head__phone">{user?.phone || '—'}</p>
            </>
          )}
        </div>

        {!editing ? (
          <button
            type="button"
            className="btn--ghost"
            style={{ fontSize: 13, flex: '0 0 auto' }}
            onClick={() => setEditing(true)}
          >
            ✏️
          </button>
        ) : null}
      </div>

      <div className="section container" style={{ marginTop: 0 }}>
        <div className="section__head">
          <h2 className="section__title">{text.profile.myBookings}</h2>
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab${tab === 'upcoming' ? ' tab--active' : ''}`}
          onClick={() => setTab('upcoming')}
        >
          {text.profile.upcoming} {upcoming.length ? `(${upcoming.length})` : ''}
        </button>
        <button
          type="button"
          className={`tab${tab === 'past' ? ' tab--active' : ''}`}
          onClick={() => setTab('past')}
        >
          {text.profile.past}
        </button>
      </div>

      <div className="container">
        {list.length ? (
          list.map((appointment) => {
            const isActive = ['PENDING', 'CONFIRMED'].includes(appointment.status);
            const isUpcoming = isActive && appointment.date >= today;

            return (
              <div key={appointment.id} className="booking-card">
                <div className="booking-card__top">
                  <div style={{ minWidth: 0 }}>
                    <h3 className="booking-card__service">
                      {localized(appointment.service, 'name', language)}
                    </h3>
                    <p className="booking-card__barber">
                      {appointment.barber.name} · {formatPrice(appointment.totalPrice, language)}
                    </p>
                  </div>
                  <span className={`status status--${appointment.status}`}>
                    {text.profile.statuses[appointment.status]}
                  </span>
                </div>

                <div className="booking-card__when">
                  📅 {formatDate(appointment.date, language, true)}
                  <span style={{ color: 'var(--line-2)' }}>|</span>
                  🕐 {appointment.startTime} — {appointment.endTime}
                </div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  <span className="pay-tag">
                    {appointment.paymentMethod === 'CARD' ? '💳' : '💵'}{' '}
                    {appointment.paymentMethod === 'CARD' ? text.booking.card : text.booking.cash}
                  </span>
                  {appointment.isPaid ? (
                    <span className="pay-tag pay-tag--paid">✅ {text.profile.paid}</span>
                  ) : null}
                </div>

                {isUpcoming ? (
                  <div className="booking-card__actions">
                    <button
                      type="button"
                      className={`btn btn--sm ${appointment.onTheWayAt ? 'btn--outline' : 'btn--accent'}`}
                      style={{ flex: 1 }}
                      disabled={Boolean(appointment.onTheWayAt) || busyId === appointment.id}
                      onClick={() => onTheWay(appointment)}
                    >
                      {appointment.onTheWayAt ? text.profile.onTheWayDone : `🚗 ${text.profile.onTheWay}`}
                    </button>

                    <button
                      type="button"
                      className="btn btn--sm btn--danger"
                      disabled={busyId === appointment.id}
                      onClick={() => cancel(appointment)}
                    >
                      {text.profile.cancel}
                    </button>
                  </div>
                ) : (
                  <div className="booking-card__actions">
                    <button
                      type="button"
                      className="btn btn--sm btn--secondary"
                      style={{ flex: 1 }}
                      onClick={() =>
                        navigate('/booking', {
                          state: {
                            serviceId: appointment.service.id,
                            barberId: appointment.barber.id,
                          },
                        })
                      }
                    >
                      🔁 {text.profile.repeat}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState
            icon="📅"
            title={text.profile.empty}
            text={text.profile.emptyText}
            action={
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => navigate('/booking')}
              >
                {text.profile.bookAgain}
              </button>
            }
          />
        )}
      </div>

      {/* Til */}
      <div className="section container">
        <div className="section__head">
          <h2 className="section__title">{text.profile.language}</h2>
        </div>
        <div className="btn-row">
          {['uz', 'ru'].map((code) => (
            <button
              key={code}
              type="button"
              className={`btn ${language === code ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => {
                haptic('light');
                setLanguage(code);
              }}
            >
              {code === 'uz' ? "O'zbekcha" : 'Русский'}
            </button>
          ))}
        </div>
      </div>

      {/* Sartaroshxona ma'lumotlari */}
      {shop ? (
        <div className="section container">
          <div className="section__head">
            <h2 className="section__title">{text.profile.shopInfo}</h2>
          </div>

          <div className="card">
            <div className="list-row">
              <span>💈 {shop.name}</span>
            </div>

            {shop.phone ? (
              <a className="list-row" href={`tel:${shop.phone}`}>
                <span>📞</span>
                <span className="list-row__value">{shop.phone}</span>
              </a>
            ) : null}

            {(language === 'ru' && shop.addressRu) || shop.address ? (
              <div className="list-row">
                <span>📍</span>
                <span className="list-row__value" style={{ textAlign: 'right' }}>
                  {language === 'ru' && shop.addressRu ? shop.addressRu : shop.address}
                </span>
              </div>
            ) : null}

            {(language === 'ru' && shop.workingHoursTextRu) || shop.workingHoursText ? (
              <div className="list-row">
                <span>🕐</span>
                <span className="list-row__value">
                  {language === 'ru' && shop.workingHoursTextRu
                    ? shop.workingHoursTextRu
                    : shop.workingHoursText}
                </span>
              </div>
            ) : null}

            {shop.instagram ? (
              <button
                type="button"
                className="list-row"
                onClick={() => openLink(`https://instagram.com/${shop.instagram.replace(/^@/, '')}`)}
              >
                <span>📷</span>
                <span className="list-row__value">@{shop.instagram.replace(/^@/, '')}</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
