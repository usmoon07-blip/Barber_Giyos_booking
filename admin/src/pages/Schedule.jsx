import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api';
import { useAdmin } from '../context/AdminContext';
import {
  Empty,
  Loading,
  Modal,
  STATUSES,
  STATUS_LABELS,
  addDays,
  formatDate,
  formatMoney,
  toMinutes,
  toTime,
  todayStr,
} from '../components/ui';

const ACTIVE = ['PENDING', 'CONFIRMED'];

/**
 * Bir barberning kunini vaqt bo'yicha tuzadi:
 * bronlar, bloklangan vaqtlar va oralaridagi bo'sh joylar.
 */
function buildTimeline(barber, appointments, blocks) {
  if (!barber.isWorking) return { items: [], freeMinutes: 0 };

  const dayStart = toMinutes(barber.startTime);
  const dayEnd = toMinutes(barber.endTime);

  const busy = [
    ...appointments
      .filter((item) => item.barber.id === barber.id && item.status !== 'CANCELLED')
      .map((item) => ({
        kind: 'appointment',
        start: toMinutes(item.startTime),
        end: toMinutes(item.endTime),
        data: item,
      })),
    ...blocks
      .filter((block) => !block.barberId || block.barberId === barber.id)
      .map((block) => ({
        kind: 'block',
        start: block.isFullDay ? dayStart : toMinutes(block.startTime),
        end: block.isFullDay ? dayEnd : toMinutes(block.endTime),
        data: block,
      })),
  ].sort((a, b) => a.start - b.start);

  const items = [];
  let cursor = dayStart;
  let freeMinutes = 0;

  for (const entry of busy) {
    if (entry.start > cursor) {
      const gap = entry.start - cursor;
      freeMinutes += gap;
      items.push({ kind: 'free', start: cursor, end: entry.start, minutes: gap });
    }
    items.push(entry);
    cursor = Math.max(cursor, entry.end);
  }

  if (cursor < dayEnd) {
    const gap = dayEnd - cursor;
    freeMinutes += gap;
    items.push({ kind: 'free', start: cursor, end: dayEnd, minutes: gap });
  }

  return { items, freeMinutes };
}

export default function Schedule() {
  const { showToast } = useAdmin();

  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.getSchedule(date));
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [date, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  // Sahifa ochiq turganda yangi bronlar o'zi ko'rinsin
  useEffect(() => {
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  const changeStatus = async (appointment, status) => {
    setBusyId(appointment.id);
    try {
      await api.updateAppointmentStatus(appointment.id, status);
      showToast(`Holat: ${STATUS_LABELS[status]}`, 'success');
      setDetail(null);
      load();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const togglePaid = async (appointment) => {
    setBusyId(appointment.id);
    try {
      const updated = await api.setAppointmentPayment(appointment.id, { isPaid: !appointment.isPaid });
      showToast(updated.isPaid ? "To'landi deb belgilandi" : "To'lov bekor qilindi", 'success');
      setDetail(updated);
      load();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const totals = useMemo(() => {
    if (!data) return null;

    const active = data.appointments.filter((item) => item.status !== 'CANCELLED');
    const expected = active
      .filter((item) => item.status !== 'NO_SHOW')
      .reduce((sum, item) => sum + item.totalPrice, 0);
    const onTheWay = active.filter((item) => item.onTheWayAt).length;

    return { count: active.length, expected, onTheWay };
  }, [data]);

  if (loading && !data) return <Loading />;
  if (!data) return <Empty icon="⚠️" title="Jadval yuklanmadi" />;

  const isToday = date === todayStr();

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Kun jadvali</h1>
          <p className="page-subtitle">{formatDate(date, true)}</p>
        </div>

        <div className="btn-row">
          <button type="button" className="btn btn--secondary" onClick={() => setDate(addDays(date, -1))}>
            ←
          </button>
          <button
            type="button"
            className={`btn ${isToday ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setDate(todayStr())}
          >
            Bugun
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => setDate(addDays(date, 1))}>
            →
          </button>
          <input
            type="date"
            className="field__input"
            style={{ width: 160 }}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 22 }}>
        <div className="stat">
          <p className="stat__label">📅 Bronlar</p>
          <p className="stat__value">{totals.count}</p>
        </div>
        <div className="stat stat--accent">
          <p className="stat__label">💰 Kutilayotgan tushum</p>
          <p className="stat__value">{formatMoney(totals.expected)} so'm</p>
        </div>
        {totals.onTheWay ? (
          <div className="stat">
            <p className="stat__label">🚗 Yo'lda</p>
            <p className="stat__value">{totals.onTheWay}</p>
          </div>
        ) : null}
      </div>

      <div className="day-grid">
        {data.barbers.map((barber) => {
          const { items, freeMinutes } = buildTimeline(barber, data.appointments, data.blocks);

          return (
            <div key={barber.id} className="day-col">
              <div className="day-col__head">
                <div>
                  <div className="day-col__name">{barber.name}</div>
                  <div className="cell-muted">
                    {barber.isWorking ? `${barber.startTime} — ${barber.endTime}` : 'Dam olish kuni'}
                  </div>
                </div>
                {barber.isWorking && freeMinutes > 0 ? (
                  <span className="pill">
                    bo'sh: {Math.floor(freeMinutes / 60)} s {freeMinutes % 60 ? `${freeMinutes % 60} daq` : ''}
                  </span>
                ) : null}
              </div>

              <div className="day-col__body">
                {!barber.isWorking ? (
                  <div className="tl-item tl-item--off">Dam olish kuni</div>
                ) : items.length === 0 ? (
                  <div className="tl-item tl-item--free">Butun kun bo'sh</div>
                ) : (
                  items.map((item, index) => {
                    if (item.kind === 'free') {
                      return (
                        <div key={`free-${index}`} className="tl-item tl-item--free">
                          <span className="tl-time">
                            {toTime(item.start)} — {toTime(item.end)}
                          </span>
                          <span>bo'sh ({item.minutes} daq)</span>
                        </div>
                      );
                    }

                    if (item.kind === 'block') {
                      return (
                        <div key={`block-${item.data.id}`} className="tl-item tl-item--block">
                          <span className="tl-time">
                            {toTime(item.start)} — {toTime(item.end)}
                          </span>
                          <span>🚫 {item.data.reason || 'Bloklangan'}</span>
                        </div>
                      );
                    }

                    const appointment = item.data;

                    return (
                      <button
                        key={appointment.id}
                        type="button"
                        className={`tl-item tl-item--booked tl-item--${appointment.status}`}
                        onClick={() => setDetail(appointment)}
                      >
                        <span className="tl-time">
                          {appointment.startTime} — {appointment.endTime}
                        </span>
                        <span className="tl-client">
                          {appointment.user.firstName}
                          {appointment.onTheWayAt ? ' 🚗' : ''}
                        </span>
                        <span className="tl-service">
                          {appointment.service.name} · {formatMoney(appointment.totalPrice)}
                          {appointment.isPaid ? ' ✅' : ''}
                        </span>
                        {!ACTIVE.includes(appointment.status) ? (
                          <span className={`status status--${appointment.status}`}>
                            {STATUS_LABELS[appointment.status]}
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={Boolean(detail)}
        title={detail ? `${detail.startTime} — ${detail.user.firstName}` : ''}
        onClose={() => setDetail(null)}
        footer={
          <button type="button" className="btn btn--secondary" onClick={() => setDetail(null)}>
            Yopish
          </button>
        }
      >
        {detail ? (
          <>
            <div className="detail-row">
              <span>Mijoz</span>
              <b>
                {detail.user.firstName} {detail.user.lastName || ''}
              </b>
            </div>
            <div className="detail-row">
              <span>Telefon</span>
              <b>{detail.user.phone ? <a href={`tel:${detail.user.phone}`}>{detail.user.phone}</a> : '—'}</b>
            </div>
            <div className="detail-row">
              <span>Barber</span>
              <b>{detail.barber.name}</b>
            </div>
            <div className="detail-row">
              <span>Xizmat</span>
              <b>
                {detail.service.name} ({detail.service.duration} daq)
              </b>
            </div>
            <div className="detail-row">
              <span>Vaqt</span>
              <b>
                {detail.startTime} — {detail.endTime}
              </b>
            </div>
            <div className="detail-row">
              <span>Narx</span>
              <b>{formatMoney(detail.totalPrice)} so'm</b>
            </div>
            <div className="detail-row">
              <span>To'lov</span>
              <b>
                {detail.paymentMethod === 'CARD' ? '💳 Karta' : '💵 Naqd'}
                {detail.isPaid ? " · ✅ To'langan" : " · ⏳ To'lanmagan"}
              </b>
            </div>
            {detail.onTheWayAt ? (
              <div className="detail-row">
                <span>Holat</span>
                <b>🚗 Mijoz yo'lga tushgan</b>
              </div>
            ) : null}
            {detail.note ? (
              <div className="detail-row">
                <span>Izoh</span>
                <b>{detail.note}</b>
              </div>
            ) : null}

            <h3 className="modal-section">Holatni o'zgartirish</h3>
            <div className="btn-row">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`btn btn--sm ${detail.status === status ? 'btn--primary' : 'btn--secondary'}`}
                  disabled={busyId === detail.id}
                  onClick={() => changeStatus(detail, status)}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>

            <h3 className="modal-section">To'lov</h3>
            <button
              type="button"
              className={`btn btn--sm ${detail.isPaid ? 'btn--secondary' : 'btn--primary'}`}
              disabled={busyId === detail.id}
              onClick={() => togglePaid(detail)}
            >
              {detail.isPaid ? "To'lovni bekor qilish" : "✅ Pul olindi deb belgilash"}
            </button>
          </>
        ) : null}
      </Modal>
    </>
  );
}
