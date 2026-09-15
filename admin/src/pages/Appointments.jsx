import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import { useAdmin } from '../context/AdminContext';
import { Empty, Loading, STATUS_LABELS, formatDate, formatMoney, todayStr } from '../components/ui';

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export default function Appointments() {
  const { showToast } = useAdmin();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [barbers, setBarbers] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const [filters, setFilters] = useState({ status: '', barberId: '', date: '', search: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getAppointments({ ...filters, page, pageSize: 30 });
      setItems(result.items);
      setTotal(result.total);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, page, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.getBarbers().then(setBarbers).catch(() => {});
  }, []);

  // Sahifa ochiq turganda ham yangi bronlar ko'rinishi uchun
  useEffect(() => {
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  const changeStatus = async (appointment, status) => {
    setBusyId(appointment.id);
    try {
      const updated = await api.updateAppointmentStatus(appointment.id, status);
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      showToast(`Holat o'zgartirildi: ${STATUS_LABELS[status]}`, 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (appointment) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Bu bronni butunlay o\'chirasizmi?')) return;

    try {
      await api.deleteAppointment(appointment.id);
      setItems((current) => current.filter((item) => item.id !== appointment.id));
      setTotal((current) => current - 1);
      showToast('Bron o\'chirildi', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Bronlar</h1>
          <p className="page-subtitle">Jami {total} ta</p>
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn--secondary" onClick={() => setFilter('date', todayStr())}>
            Bugungi
          </button>
          <button type="button" className="btn btn--secondary" onClick={load}>
            ↻ Yangilash
          </button>
        </div>
      </div>

      <div className="filters">
        <select
          className="field__input"
          value={filters.status}
          onChange={(event) => setFilter('status', event.target.value)}
        >
          <option value="">Barcha holatlar</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <select
          className="field__input"
          value={filters.barberId}
          onChange={(event) => setFilter('barberId', event.target.value)}
        >
          <option value="">Barcha barberlar</option>
          {barbers.map((barber) => (
            <option key={barber.id} value={barber.id}>
              {barber.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="field__input"
          value={filters.date}
          onChange={(event) => setFilter('date', event.target.value)}
        />

        <input
          className="field__input"
          placeholder="Ism yoki telefon..."
          value={filters.search}
          onChange={(event) => setFilter('search', event.target.value)}
        />

        {filters.status || filters.barberId || filters.date || filters.search ? (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              setPage(1);
              setFilters({ status: '', barberId: '', date: '', search: '' });
            }}
          >
            Tozalash
          </button>
        ) : null}
      </div>

      <div className="panel">
        {loading ? (
          <Loading />
        ) : items.length ? (
          <>
            <div className="table-wrap">
              <table style={{ minWidth: 980 }}>
                <thead>
                  <tr>
                    <th>Mijoz</th>
                    <th>Barber</th>
                    <th>Xizmat</th>
                    <th>Sana</th>
                    <th>Vaqt</th>
                    <th>Narx</th>
                    <th>Holat</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>
                        <div className="cell-strong">
                          {appointment.user.firstName} {appointment.user.lastName || ''}
                        </div>
                        <div className="cell-muted">
                          {appointment.user.phone ? (
                            <a href={`tel:${appointment.user.phone}`}>{appointment.user.phone}</a>
                          ) : (
                            '—'
                          )}
                          {appointment.user.username ? ` · @${appointment.user.username}` : ''}
                        </div>
                      </td>
                      <td>{appointment.barber.name}</td>
                      <td>
                        <div>{appointment.service.name}</div>
                        <div className="cell-muted">{appointment.service.duration} daqiqa</div>
                      </td>
                      <td>{formatDate(appointment.date, true)}</td>
                      <td className="cell-strong">
                        {appointment.startTime}
                        <div className="cell-muted">{appointment.endTime} gacha</div>
                      </td>
                      <td className="cell-strong">{formatMoney(appointment.totalPrice)}</td>
                      <td>
                        <span className={`status status--${appointment.status}`}>
                          {STATUS_LABELS[appointment.status]}
                        </span>
                        {appointment.onTheWayAt ? (
                          <div style={{ marginTop: 5 }}>
                            <span className="pill pill--otw">🚗 Yo'lga tushdi</span>
                          </div>
                        ) : null}
                        {appointment.note ? (
                          <div className="cell-muted" style={{ marginTop: 5 }} title={appointment.note}>
                            💬 {appointment.note.slice(0, 30)}
                            {appointment.note.length > 30 ? '…' : ''}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <select
                          className="field__input"
                          style={{ minHeight: 34, fontSize: 13.5, width: 150 }}
                          value={appointment.status}
                          disabled={busyId === appointment.id}
                          onChange={(event) => changeStatus(appointment, event.target.value)}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          style={{ marginTop: 6, width: 150 }}
                          onClick={() => remove(appointment)}
                        >
                          O'chirish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>
                {(page - 1) * 30 + 1}–{Math.min(page * 30, total)} / {total}
              </span>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  ← Oldingi
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={page * 30 >= total}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Keyingi →
                </button>
              </div>
            </div>
          </>
        ) : (
          <Empty icon="📅" title="Bron topilmadi" text="Filtrlarni o'zgartirib ko'ring" />
        )}
      </div>
    </>
  );
}
