import { useEffect, useState } from 'react';
import api from '../api';
import { useAdmin } from '../context/AdminContext';
import { Empty, Loading, WEEKDAY_NAMES } from '../components/ui';

// Dushanbadan boshlab ko'rsatamiz (bazada 0 = Yakshanba)
const ORDER = [1, 2, 3, 4, 5, 6, 0];

const DEFAULT_HOURS = ORDER.map((weekday) => ({
  weekday,
  startTime: '09:00',
  endTime: '20:00',
  isWorking: true,
}));

export default function WorkingHours() {
  const { showToast } = useAdmin();

  const [barbers, setBarbers] = useState([]);
  const [barberId, setBarberId] = useState(null);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getBarbers()
      .then((list) => {
        setBarbers(list);
        if (list.length) setBarberId(list[0].id);
        else setLoading(false);
      })
      .catch((error) => {
        showToast(error.message, 'error');
        setLoading(false);
      });
  }, [showToast]);

  useEffect(() => {
    if (!barberId) return;

    setLoading(true);
    api
      .getWorkingHours(barberId)
      .then((list) => {
        const byWeekday = new Map(list.map((item) => [item.weekday, item]));
        setHours(
          ORDER.map((weekday) => {
            const found = byWeekday.get(weekday);
            return {
              weekday,
              startTime: found?.startTime || '09:00',
              endTime: found?.endTime || '20:00',
              isWorking: found ? found.isWorking : true,
            };
          })
        );
      })
      .catch((error) => showToast(error.message, 'error'))
      .finally(() => setLoading(false));
  }, [barberId, showToast]);

  const updateHour = (weekday, key, value) => {
    setHours((current) =>
      current.map((item) => (item.weekday === weekday ? { ...item, [key]: value } : item))
    );
  };

  const applyToAll = () => {
    const first = hours.find((item) => item.isWorking) || hours[0];
    setHours((current) =>
      current.map((item) => ({ ...item, startTime: first.startTime, endTime: first.endTime }))
    );
  };

  const save = async () => {
    for (const hour of hours) {
      if (hour.isWorking && hour.endTime <= hour.startTime) {
        showToast(`${WEEKDAY_NAMES[hour.weekday]}: tugash vaqti boshlanishdan keyin bo'lishi kerak`, 'error');
        return;
      }
    }

    setSaving(true);
    try {
      await api.updateWorkingHours(barberId, hours);
      showToast('Ish jadvali saqlandi', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!barbers.length && !loading) {
    return (
      <>
        <h1 className="page-title">Ish jadvali</h1>
        <div className="panel">
          <Empty icon="💈" title="Avval barber qo'shing" text="Barberlar sahifasiga o'ting" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Ish jadvali</h1>
          <p className="page-subtitle">Har bir barber uchun hafta kunlarini belgilang</p>
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn--secondary" onClick={applyToAll}>
            Hamma kunga bir xil
          </button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={saving || loading}>
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>

      <div className="field" style={{ maxWidth: 320 }}>
        <label className="field__label">Barber</label>
        <select
          className="field__input"
          value={barberId || ''}
          onChange={(event) => setBarberId(Number(event.target.value))}
        >
          {barbers.map((barber) => (
            <option key={barber.id} value={barber.id}>
              {barber.name}
              {barber.isActive ? '' : ' (faol emas)'}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="hours-grid">
          {hours.map((hour) => (
            <div key={hour.weekday} className={`hours-row${hour.isWorking ? '' : ' hours-row--off'}`}>
              <span className="hours-row__day">{WEEKDAY_NAMES[hour.weekday]}</span>

              <div className="hours-row__times">
                {hour.isWorking ? (
                  <>
                    <input
                      type="time"
                      className="field__input"
                      value={hour.startTime}
                      step="900"
                      onChange={(event) => updateHour(hour.weekday, 'startTime', event.target.value)}
                    />
                    <span style={{ color: 'var(--muted)' }}>—</span>
                    <input
                      type="time"
                      className="field__input"
                      value={hour.endTime}
                      step="900"
                      onChange={(event) => updateHour(hour.weekday, 'endTime', event.target.value)}
                    />
                  </>
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: 14 }}>Dam olish kuni</span>
                )}
              </div>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={hour.isWorking}
                  onChange={(event) => updateHour(hour.weekday, 'isWorking', event.target.checked)}
                />
                <span>Ishlaydi</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
