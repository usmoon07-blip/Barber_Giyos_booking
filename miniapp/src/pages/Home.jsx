import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import BarberAvatar from '../components/BarberAvatar';
import BarberSheet from '../components/BarberSheet';
import ServiceCard from '../components/ServiceCard';
import ServiceSheet from '../components/ServiceSheet';
import { ErrorState, Loader } from '../components/States';
import { useApp } from '../context/AppContext';
import { formatDate, formatPrice, localized } from '../i18n';
import { haptic } from '../telegram';

export default function Home() {
  const { text, language, user } = useApp();
  const navigate = useNavigate();

  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openService, setOpenService] = useState(null);
  const [openBarber, setOpenBarber] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [barberList, popular, appointments] = await Promise.all([
        api.getBarbers(),
        api.getPopularServices(),
        api.getAppointments(),
      ]);

      setBarbers(barberList);
      setServices(popular);

      const today = new Date().toISOString().slice(0, 10);
      const upcoming = appointments
        .filter((item) => ['PENDING', 'CONFIRMED'].includes(item.status) && item.date >= today)
        .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

      setNextAppointment(upcoming[0] || null);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loader full />;
  if (error) return <ErrorState onRetry={load} message={error.message} />;

  const firstName = user?.firstName || 'mijoz';

  return (
    <div className="page">
      <header className="header">
        <h1 className="header__greeting">{text.home.greeting(firstName)}</h1>
        <p className="header__subtitle">{text.home.subtitle}</p>
      </header>

      {barbers.length ? (
        <section className="section" style={{ marginTop: 20 }}>
          <div className="stories">
            {barbers.map((barber) => (
              <button
                key={barber.id}
                type="button"
                className="story"
                onClick={() => {
                  haptic('light');
                  setOpenBarber(barber);
                }}
              >
                <div className="story__ring">
                  <BarberAvatar
                    barber={barber}
                    className="story__img"
                    fallbackClassName="story__fallback"
                  />
                </div>
                <div className="story__name">{barber.name.split(' ')[0]}</div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {nextAppointment ? (
        <section className="section container" style={{ marginTop: 22 }}>
          <div className="section__head">
            <h2 className="section__title">{text.home.upcoming}</h2>
          </div>
          <button
            type="button"
            className="booking-card"
            style={{ width: '100%', textAlign: 'left' }}
            onClick={() => navigate('/profile')}
          >
            <div className="booking-card__top">
              <div>
                <h3 className="booking-card__service">
                  {localized(nextAppointment.service, 'name', language)}
                </h3>
                <p className="booking-card__barber">{nextAppointment.barber.name}</p>
              </div>
              <span className={`status status--${nextAppointment.status}`}>
                {text.profile.statuses[nextAppointment.status]}
              </span>
            </div>
            <div className="booking-card__when" style={{ marginBottom: 0 }}>
              📅 {formatDate(nextAppointment.date, language, true)} · 🕐 {nextAppointment.startTime}
            </div>
          </button>
        </section>
      ) : null}

      <section className="hero">
        <h2 className="hero__title">{text.home.heroTitle}</h2>
        <p className="hero__text">{text.home.heroText}</p>
        <button
          type="button"
          className="btn hero__btn"
          onClick={() => {
            haptic('medium');
            navigate('/booking');
          }}
        >
          {text.home.book}
        </button>
      </section>

      {services.length ? (
        <section className="section container">
          <div className="section__head">
            <h2 className="section__title">{text.home.popular}</h2>
            <button type="button" className="section__link" onClick={() => navigate('/services')}>
              {text.home.seeAll}
            </button>
          </div>

          {services.map((service) => (
            <ServiceCard key={service.id} service={service} onClick={setOpenService} />
          ))}
        </section>
      ) : null}

      <ServiceSheet
        service={openService}
        onClose={() => setOpenService(null)}
        onBook={(service) => {
          setOpenService(null);
          navigate('/booking', { state: { serviceId: service.id } });
        }}
      />

      <BarberSheet
        barber={openBarber}
        onClose={() => setOpenBarber(null)}
        onBook={(barber) => {
          setOpenBarber(null);
          navigate('/booking', { state: { barberId: barber.id } });
        }}
      />
    </div>
  );
}
