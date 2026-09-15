import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ServiceCard from '../components/ServiceCard';
import ServiceSheet from '../components/ServiceSheet';
import { EmptyState, ErrorState, Loader } from '../components/States';
import { useApp } from '../context/AppContext';
import { haptic } from '../telegram';

const CATEGORIES = ['HAIR', 'BEARD', 'COMBO', 'STYLING', 'OTHER'];

export default function Services() {
  const { text } = useApp();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openService, setOpenService] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setServices(await api.getServices());
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Faqat xizmatlari bor kategoriyalarni ko'rsatamiz
  const availableCategories = useMemo(
    () => CATEGORIES.filter((item) => services.some((service) => service.category === item)),
    [services]
  );

  const visible = useMemo(
    () => (category === 'ALL' ? services : services.filter((service) => service.category === category)),
    [services, category]
  );

  if (loading) return <Loader full />;
  if (error) return <ErrorState onRetry={load} message={error.message} />;

  return (
    <div className="page">
      <h1 className="page__title">{text.services.title}</h1>

      <div className="chips">
        <button
          type="button"
          className={`chip${category === 'ALL' ? ' chip--active' : ''}`}
          onClick={() => {
            haptic('light');
            setCategory('ALL');
          }}
        >
          {text.services.all}
        </button>

        {availableCategories.map((item) => (
          <button
            key={item}
            type="button"
            className={`chip${category === item ? ' chip--active' : ''}`}
            onClick={() => {
              haptic('light');
              setCategory(item);
            }}
          >
            {text.services.categories[item]}
          </button>
        ))}
      </div>

      <div className="container">
        {visible.length ? (
          visible.map((service) => (
            <ServiceCard key={service.id} service={service} onClick={setOpenService} />
          ))
        ) : (
          <EmptyState icon="✂️" title={text.services.empty} />
        )}
      </div>

      <ServiceSheet
        service={openService}
        onClose={() => setOpenService(null)}
        onBook={(service) => {
          setOpenService(null);
          navigate('/booking', { state: { serviceId: service.id } });
        }}
      />
    </div>
  );
}
