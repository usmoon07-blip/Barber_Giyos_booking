import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import BarberAvatar from '../components/BarberAvatar';
import SafeImage from '../components/SafeImage';
import { EmptyState, ErrorState, Loader } from '../components/States';
import { CheckIcon } from '../components/Icons';
import { useApp } from '../context/AppContext';
import { formatDate, formatPrice, localized } from '../i18n';
import { closeApp, haptic, setBackButton } from '../telegram';

const STEP_SERVICE = 0;
const STEP_BARBER = 1;
const STEP_DATE = 2;
const STEP_TIME = 3;
const STEP_CONFIRM = 4;

export default function Booking() {
  const { text, language, user, setUser, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(STEP_SERVICE);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [serviceId, setServiceId] = useState(null);
  const [barberId, setBarberId] = useState(null);
  const [date, setDate] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const [days, setDays] = useState([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotReason, setSlotReason] = useState(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  const service = useMemo(() => services.find((item) => item.id === serviceId) || null, [services, serviceId]);
  const barber = useMemo(() => barbers.find((item) => item.id === barberId) || null, [barbers, barberId]);

  // ─── Boshlang'ich yuklash ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [serviceList, barberList] = await Promise.all([api.getServices(), api.getBarbers()]);
        if (cancelled) return;

        setServices(serviceList);
        setBarbers(barberList);

        // Bosh sahifadan yoki xizmat oynasidan kelgan tanlov
        const preset = location.state || {};
        if (preset.serviceId && serviceList.some((item) => item.id === preset.serviceId)) {
          setServiceId(preset.serviceId);
          setStep(STEP_BARBER);
        }
        if (preset.barberId && barberList.some((item) => item.id === preset.barberId)) {
          setBarberId(preset.barberId);
          if (preset.serviceId) setStep(STEP_DATE);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.state]);

  useEffect(() => {
    setName(user?.firstName || '');
    setPhone(user?.phone || '');
  }, [user]);

  // ─── Bo'sh sanalar ──────────────────────────────────────────────
  useEffect(() => {
    if (step !== STEP_DATE || !serviceId || !barberId) return undefined;

    let cancelled = false;
    setDaysLoading(true);

    api
      .getAvailableDates(barberId, serviceId)
      .then((result) => {
        if (cancelled) return;
        setDays(result);

        // Tanlangan sana endi mavjud bo'lmasa, tanlovni tozalaymiz
        setDate((current) => {
          const stillFree = result.find((day) => day.date === current && day.available);
          return stillFree ? current : null;
        });
      })
      .catch((requestError) => {
        if (!cancelled) showToast(requestError.message, 'error');
      })
      .finally(() => {
        if (!cancelled) setDaysLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [step, serviceId, barberId, showToast]);

  // ─── Bo'sh vaqtlar ──────────────────────────────────────────────
  const loadSlots = useCallback(() => {
    if (!serviceId || !barberId || !date) return undefined;

    let cancelled = false;
    setSlotsLoading(true);
    setSlotReason(null);

    api
      .getAvailableSlots(barberId, serviceId, date)
      .then((result) => {
        if (cancelled) return;
        setSlots(result.slots);
        setSlotReason(result.reason);
        setStartTime((current) => (result.slots.includes(current) ? current : null));
      })
      .catch((requestError) => {
        if (!cancelled) showToast(requestError.message, 'error');
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [serviceId, barberId, date, showToast]);

  useEffect(() => {
    if (step !== STEP_TIME) return undefined;
    return loadSlots();
  }, [step, loadSlots]);

  // ─── Telegramning "orqaga" tugmasi ──────────────────────────────
  const goBack = useCallback(() => {
    haptic('light');
    setStep((current) => {
      if (current === STEP_SERVICE) {
        navigate('/');
        return current;
      }
      return current - 1;
    });
  }, [navigate]);

  useEffect(() => {
    if (created) return undefined;
    return setBackButton(true, goBack);
  }, [goBack, created]);

  // ─── Bronni yuborish ────────────────────────────────────────────
  const submit = async () => {
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      setFormError(text.booking.errors.INVALID_NAME);
      return;
    }
    if (trimmedPhone.replace(/\D/g, '').length < 9) {
      setFormError(text.booking.errors.INVALID_PHONE);
      return;
    }

    setSubmitting(true);

    try {
      const appointment = await api.createAppointment({
        barberId,
        serviceId,
        date,
        startTime,
        note: note.trim() || undefined,
        name: trimmedName,
        phone: trimmedPhone,
      });

      haptic('success');
      setUser((current) => (current ? { ...current, firstName: trimmedName, phone: trimmedPhone } : current));
      setCreated(appointment);
    } catch (requestError) {
      haptic('error');

      const known = text.booking.errors[requestError.code];
      setFormError(known || requestError.message);

      // Vaqt band bo'lib qolgan bo'lsa — vaqt tanlash qadamiga qaytaramiz
      if (requestError.code === 'SLOT_TAKEN' || requestError.code === 'TOO_LATE') {
        setStartTime(null);
        setStep(STEP_TIME);
        showToast(known || requestError.message, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader full />;
  if (error) return <ErrorState onRetry={() => window.location.reload()} message={error.message} />;

  // ─── Muvaffaqiyat ekrani ────────────────────────────────────────
  if (created) {
    return (
      <div className="success">
        <div className="success__mark">
          <CheckIcon size={40} />
        </div>
        <h1 className="success__title">{text.booking.successTitle}</h1>
        <p className="success__text">{text.booking.successText}</p>

        <div className="summary" style={{ width: '100%', marginBottom: 24 }}>
          <div className="summary__row">
            <span className="summary__label">{text.booking.barber}</span>
            <span className="summary__value">{created.barber.name}</span>
          </div>
          <div className="summary__row">
            <span className="summary__label">{text.booking.service}</span>
            <span className="summary__value">{localized(created.service, 'name', language)}</span>
          </div>
          <div className="summary__row">
            <span className="summary__label">{text.booking.date}</span>
            <span className="summary__value">{formatDate(created.date, language, true)}</span>
          </div>
          <div className="summary__row">
            <span className="summary__label">{text.booking.time}</span>
            <span className="summary__value">
              {created.startTime} — {created.endTime}
            </span>
          </div>
          <div className="summary__row summary__row--total">
            <span className="summary__label">{text.booking.price}</span>
            <span className="summary__value">{formatPrice(created.totalPrice, language)}</span>
          </div>
        </div>

        <div style={{ width: '100%', display: 'grid', gap: 10 }}>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/profile')}>
            {text.booking.myBookings}
          </button>
          <button type="button" className="btn btn--ghost" onClick={closeApp}>
            {text.booking.close}
          </button>
        </div>
      </div>
    );
  }

  // ─── Qadamlar ───────────────────────────────────────────────────
  const canContinue =
    (step === STEP_SERVICE && serviceId) ||
    (step === STEP_BARBER && barberId) ||
    (step === STEP_DATE && date) ||
    (step === STEP_TIME && startTime);

  const stepTitles = [
    text.booking.chooseService,
    text.booking.chooseBarber,
    text.booking.chooseDate,
    text.booking.chooseTime,
    text.booking.confirm,
  ];

  return (
    <div className="page page--cta">
      <h1 className="page__title" style={{ marginBottom: 14 }}>
        {text.booking.title}
      </h1>

      <div className="steps">
        {stepTitles.map((title, index) => (
          <span key={title} className={`steps__bar${index <= step ? ' steps__bar--done' : ''}`} />
        ))}
      </div>

      <h2 className="step-title">{stepTitles[step]}</h2>

      {/* 1-qadam: xizmat */}
      {step === STEP_SERVICE ? (
        <div className="container">
          {services.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`barber-option${serviceId === item.id ? ' barber-option--active' : ''}`}
              onClick={() => {
                haptic('light');
                setServiceId(item.id);
                setStartTime(null);
                setDate(null);
              }}
            >
              <SafeImage
                src={item.imageUrl}
                alt=""
                className="barber-option__img"
                fallbackClassName="barber-option__fallback"
                fallback="✂️"
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="barber-option__name">{localized(item, 'name', language)}</p>
                <p className="barber-option__bio">
                  {text.common.minutes(item.duration)} · {formatPrice(item.price, language)}
                </p>
              </div>

              <span className={`check${serviceId === item.id ? ' check--on' : ''}`}>
                {serviceId === item.id ? <CheckIcon /> : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {/* 2-qadam: barber */}
      {step === STEP_BARBER ? (
        <div className="container">
          {barbers.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`barber-option${barberId === item.id ? ' barber-option--active' : ''}`}
              onClick={() => {
                haptic('light');
                setBarberId(item.id);
                setStartTime(null);
                setDate(null);
              }}
            >
              <BarberAvatar
                barber={item}
                className="barber-option__img"
                fallbackClassName="barber-option__fallback"
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="barber-option__name">{item.name}</p>
                <p className="barber-option__bio">{localized(item, 'bio', language)}</p>
              </div>

              <span className={`check${barberId === item.id ? ' check--on' : ''}`}>
                {barberId === item.id ? <CheckIcon /> : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {/* 3-qadam: sana */}
      {step === STEP_DATE ? (
        daysLoading ? (
          <Loader />
        ) : (
          <div className="date-strip">
            {days.map((day) => {
              const dateObject = new Date(`${day.date}T00:00:00Z`);
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={!day.available}
                  className={`date-cell${date === day.date ? ' date-cell--active' : ''}`}
                  onClick={() => {
                    haptic('light');
                    setDate(day.date);
                    setStartTime(null);
                  }}
                >
                  <div className="date-cell__weekday">
                    {text.common.weekdaysShort[dateObject.getUTCDay()]}
                  </div>
                  <div className="date-cell__day">{dateObject.getUTCDate()}</div>
                  <div className="date-cell__month">
                    {text.common.months[dateObject.getUTCMonth()].slice(0, 3)}
                  </div>
                </button>
              );
            })}
          </div>
        )
      ) : null}

      {/* 4-qadam: vaqt */}
      {step === STEP_TIME ? (
        slotsLoading ? (
          <Loader />
        ) : slots.length ? (
          <>
            <div className="date-strip" style={{ marginBottom: 18 }}>
              {days
                .filter((day) => day.available)
                .map((day) => {
                  const dateObject = new Date(`${day.date}T00:00:00Z`);
                  return (
                    <button
                      key={day.date}
                      type="button"
                      className={`date-cell${date === day.date ? ' date-cell--active' : ''}`}
                      onClick={() => {
                        haptic('light');
                        setDate(day.date);
                        setStartTime(null);
                      }}
                    >
                      <div className="date-cell__weekday">
                        {text.common.weekdaysShort[dateObject.getUTCDay()]}
                      </div>
                      <div className="date-cell__day">{dateObject.getUTCDate()}</div>
                    </button>
                  );
                })}
            </div>

            <div className="slots">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`slot${startTime === slot ? ' slot--active' : ''}`}
                  onClick={() => {
                    haptic('light');
                    setStartTime(slot);
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon="🕐"
            title={slotReason === 'DAY_OFF' ? text.booking.dayOff : text.booking.noSlots}
            action={
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setStep(STEP_DATE)}
              >
                {text.booking.chooseDate}
              </button>
            }
          />
        )
      ) : null}

      {/* 5-qadam: tasdiqlash */}
      {step === STEP_CONFIRM ? (
        <>
          <div className="summary" style={{ marginBottom: 22 }}>
            <div className="summary__row">
              <span className="summary__label">{text.booking.barber}</span>
              <span className="summary__value">{barber?.name}</span>
            </div>
            <div className="summary__row">
              <span className="summary__label">{text.booking.service}</span>
              <span className="summary__value">{localized(service, 'name', language)}</span>
            </div>
            <div className="summary__row">
              <span className="summary__label">{text.booking.date}</span>
              <span className="summary__value">{formatDate(date, language, true)}</span>
            </div>
            <div className="summary__row">
              <span className="summary__label">{text.booking.time}</span>
              <span className="summary__value">{startTime}</span>
            </div>
            <div className="summary__row">
              <span className="summary__label">{text.booking.duration}</span>
              <span className="summary__value">{text.common.minutes(service?.duration || 0)}</span>
            </div>
            <div className="summary__row summary__row--total">
              <span className="summary__label">{text.booking.price}</span>
              <span className="summary__value">{formatPrice(service?.price || 0, language)}</span>
            </div>
          </div>

          <h2 className="step-title" style={{ fontSize: 17 }}>
            {text.booking.yourData}
          </h2>

          <div className="field">
            <label className="field__label" htmlFor="booking-name">
              {text.booking.name}
            </label>
            <input
              id="booking-name"
              className="field__input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={text.booking.namePlaceholder}
              autoComplete="name"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="booking-phone">
              {text.booking.phone}
            </label>
            <input
              id="booking-phone"
              className="field__input"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={text.booking.phonePlaceholder}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="booking-note">
              {text.booking.note}
            </label>
            <textarea
              id="booking-note"
              className="field__input"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={text.booking.notePlaceholder}
              maxLength={300}
            />
          </div>

          {formError ? (
            <p className="field__error" style={{ margin: '0 16px 12px' }}>
              {formError}
            </p>
          ) : null}
        </>
      ) : null}

      <div className="sticky-cta">
        <div className="btn-row">
          {step > STEP_SERVICE ? (
            <button
              type="button"
              className="btn btn--secondary"
              style={{ flex: '0 0 36%' }}
              onClick={goBack}
            >
              {text.booking.back}
            </button>
          ) : null}

          {step === STEP_CONFIRM ? (
            <button type="button" className="btn btn--primary" disabled={submitting} onClick={submit}>
              {submitting ? text.common.loading : text.booking.submit}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canContinue}
              onClick={() => {
                haptic('light');
                setStep((current) => current + 1);
              }}
            >
              {text.booking.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
