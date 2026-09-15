import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAdmin } from '../context/AdminContext';
import { Empty, Loading, formatDate, formatMoney } from '../components/ui';

export default function Dashboard() {
  const { showToast } = useAdmin();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [dashboard, chart] = await Promise.all([api.getDashboard(), api.getStats()]);
      setData(dashboard);
      setStats(chart);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loading />;
  if (!data) return <Empty icon="⚠️" title="Ma'lumot yuklanmadi" />;

  const maxCount = Math.max(1, ...stats.map((item) => item.count));

  const today = data.payments?.today;
  const month = data.payments?.month;

  const cards = [
    { label: '📅 Bugungi bronlar', value: data.todayAppointments },
    { label: '🕐 Kutilayotgan', value: data.pendingCount, hint: 'tasdiqlashni kutmoqda' },
    {
      label: "💰 Bugungi tushum",
      value: `${formatMoney(today?.completedRevenue ?? data.todayRevenue)} so'm`,
      hint: today ? `💵 ${formatMoney(today.cash)} · 💳 ${formatMoney(today.card)}` : null,
      accent: true,
    },
    {
      label: '📈 Oylik tushum',
      value: `${formatMoney(month?.completedRevenue ?? data.monthRevenue)} so'm`,
      hint: month ? `💵 ${formatMoney(month.cash)} · 💳 ${formatMoney(month.card)}` : null,
    },
    { label: '👥 Jami mijozlar', value: data.totalUsers },
    { label: '💈 Faol barberlar', value: data.activeBarbers },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Sartaroshxona bugungi holati</p>
        </div>
        <div className="btn-row">
          <Link to="/reports" className="btn btn--primary">
            💰 To'liq hisobot
          </Link>
          <button type="button" className="btn btn--secondary" onClick={load}>
            ↻ Yangilash
          </button>
        </div>
      </div>

      <div className="stat-grid">
        {cards.map((card) => (
          <div key={card.label} className={`stat${card.accent ? ' stat--accent' : ''}`}>
            <p className="stat__label">{card.label}</p>
            <p className="stat__value">{card.value}</p>
            {card.hint ? <p className="stat__hint">{card.hint}</p> : null}
          </div>
        ))}
      </div>

      {month?.unpaidCompleted > 0 ? (
        <div className="notice">
          ⚠️ Shu oyda bajarilgan ishlardan <b>{formatMoney(month.unpaidCompleted)} so'm</b> hali
          «to'langan» deb belgilanmagan.
        </div>
      ) : null}

      <h2 className="section-title">Oxirgi 14 kun</h2>
      <div className="panel">
        <div className="chart">
          {stats.map((item) => (
            <div key={item.date} className="chart__col" title={`${item.count} ta bron`}>
              <div
                className={`chart__bar${item.count ? '' : ' chart__bar--empty'}`}
                style={{ height: `${Math.max(3, (item.count / maxCount) * 100)}%` }}
              />
              <span className="chart__label">{formatDate(item.date)}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="section-title">Eng ko'p tanlangan xizmatlar</h2>
      <div className="panel">
        {data.topServices.length ? (
          <div className="table-wrap">
            <table style={{ minWidth: 380 }}>
              <thead>
                <tr>
                  <th>Xizmat</th>
                  <th style={{ textAlign: 'right' }}>Bronlar soni</th>
                </tr>
              </thead>
              <tbody>
                {data.topServices.map((service) => (
                  <tr key={service.serviceId}>
                    <td className="cell-strong">{service.name}</td>
                    <td style={{ textAlign: 'right' }}>{service.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon="✂️" title="Hali bron yo'q" />
        )}
      </div>

      <h2 className="section-title">Yaqin bronlar</h2>
      <div className="panel">
        {data.upcoming.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mijoz</th>
                  <th>Barber</th>
                  <th>Xizmat</th>
                  <th>Sana</th>
                  <th>Vaqt</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {data.upcoming.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      <div className="cell-strong">{appointment.user.firstName}</div>
                      <div className="cell-muted">{appointment.user.phone || '—'}</div>
                    </td>
                    <td>{appointment.barber.name}</td>
                    <td>{appointment.service.name}</td>
                    <td>{formatDate(appointment.date, true)}</td>
                    <td className="cell-strong">{appointment.startTime}</td>
                    <td>
                      <span className={`status status--${appointment.status}`}>
                        {appointment.status === 'PENDING' ? 'Kutilmoqda' : 'Tasdiqlangan'}
                      </span>
                      {appointment.onTheWayAt ? (
                        <span className="pill pill--otw" style={{ marginLeft: 6 }}>
                          🚗 Yo'lda
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon="📅" title="Yaqin kunlarda bron yo'q" />
        )}

        <div className="pagination">
          <span>Barcha bronlarni ko'rish uchun</span>
          <Link to="/appointments" className="btn btn--secondary btn--sm">
            Bronlar sahifasi →
          </Link>
        </div>
      </div>
    </>
  );
}
