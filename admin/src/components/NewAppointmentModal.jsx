import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { useAdmin } from '../context/AdminContext';
import { Modal, formatMoney, todayStr, toMinutes } from './ui';

const EMPTY = {
  name: '',
  phone: '',
  userId: null,
  barberId: '',
  serviceId: '',
  date: todayStr(),
  startTime: '',
  paymentMethod: 'CASH',
  isPaid: false,
  note: '',
};

/**
 * Sartarosh qo'lda bron qo'shadi — telefon orqali yoki eshikdan kelgan mijoz uchun.
 * Mijozning Telegram akkaunti bo'lishi shart emas.
 */
export default function NewAppointmentModal({ open, onClose, onCreated, barbers, services }) {
  const { showToast } = useAdmin();

  const [form, setForm] = useState(EMPTY);
  const [slots, setSlots] = useState([]);
  const [slotInfo, setSlotInfo] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [foundUsers, setFoundUsers] = useState([]);
  const [searching, setSearching] = useState(false);

  const service = useMemo(
    () => services.find((item) => item.id === Number(form.serviceId)) || null,
    [services, form.serviceId]
  );

  const barber = useMemo(
    () => barbers.find((item) => item.id === Number(form.barberId)) || null,
    [barbers, form.barberId]
  );

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setSlots([]);
      setSlotInfo(null);
      setFoundUsers([]);
      setError(null);
    }
  }, [open]);

  // Mijozni ism yoki telefon bo'yicha qidiramiz
  useEffect(() => {
    const term = form.name.trim() || form.phone.trim();
    if (form.userId || term.length < 2) {
      setFoundUsers([]);
      return undefined;
    }

    setSearching(true);
    const timer = setTimeout(() => {
      api
        .searchUsers(term)
        .then(setFoundUsers)
        .catch(() => setFoundUsers([]))
        .finally(() => setSearching(false));
    }, 350);

    return () => clearTimeout(timer);
  }, [form.name, form.phone, form.userId]);

  // Bo'sh vaqtlarni yuklaymiz
  useEffect(() => {
    if (!form.barberId || !form.serviceId || !form.date) {
      setSlots([]);
      setSlotInfo(null);
      return undefined;
    }

    let cancelled = false;
    setSlotsLoading(true);

    api
      .getAvailability(form.barberId, form.serviceId, form.date)
      .then((result) => {
        if (cancelled) return;
        setSlots(result.slots);
        setSlotInfo(result);
        setForm((current) => (result.slots.includes(current.startTime) ? current : { ...current, startTime: '' }));
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
  }, [form.barberId, form.serviceId, form.date, showToast]);

  const pickUser = (user) => {
    setForm((current) => ({
      ...current,
      userId: user.id,
      name: `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`,
      phone: user.phone || '',
    }));
    setFoundUsers([]);
  };

  const clearUser = () => {
    setForm((current) => ({ ...current, userId: null, name: '', phone: '' }));
  };

  const save = async () => {
    setError(null);

    if (!form.userId && form.name.trim().length < 2) {
      setError('Mijoz ismini kiriting');
      return;
    }
    if (!form.barberId) {
      setError('Barberni tanlang');
      return;
    }
    if (!form.serviceId) {
      setError('Xizmatni tanlang');
      return;
    }
    if (!form.startTime) {
      setError('Vaqtni tanlang');
      return;
    }

    setSaving(true);

    try {
      const created = await api.createAppointment({
        userId: form.userId || undefined,
        name: form.userId ? undefined : form.name.trim(),
        phone: form.phone.trim() || undefined,
        barberId: Number(form.barberId),
        serviceId: Number(form.serviceId),
        date: form.date,
        startTime: form.startTime,
        paymentMethod: form.paymentMethod,
        isPaid: form.isPaid,
        note: form.note.trim() || undefined,
      });

      showToast('Bron qo’shildi', 'success');
      onCreated(created);
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  // Tanlangan vaqt ish jadvalidan tashqarida bo'lsa ogohlantiramiz
  const outsideHours = useMemo(() => {
    if (!form.startTime || !slotInfo?.workStart) return false;
    const start = toMinutes(form.startTime);
    return start < toMinutes(slotInfo.workStart) || start >= toMinutes(slotInfo.workEnd);
  }, [form.startTime, slotInfo]);

  return (
    <Modal
      open={open}
      title="Yangi bron qo'shish"
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Bekor qilish
          </button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={saving}>
            {saving ? 'Saqlanmoqda...' : 'Bronni saqlash'}
          </button>
        </>
      }
    >
      {error ? <div className="form-error">{error}</div> : null}

      <h3 className="modal-section">1. Mijoz</h3>

      {form.userId ? (
        <div className="picked-user">
          <div>
            <div className="cell-strong">{form.name}</div>
            <div className="cell-muted">{form.phone || 'telefon yo’q'}</div>
          </div>
          <button type="button" className="btn btn--secondary btn--sm" onClick={clearUser}>
            O'zgartirish
          </button>
        </div>
      ) : (
        <>
          <div className="field-row">
            <div className="field">
              <label className="field__label">Ismi *</label>
              <input
                className="field__input"
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="Masalan: Jasur aka"
              />
            </div>

            <div className="field">
              <label className="field__label">Telefon</label>
              <input
                className="field__input"
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                placeholder="+998 __ ___ __ __"
              />
            </div>
          </div>

          {searching ? <p className="cell-muted" style={{ marginTop: -8 }}>Qidirilmoqda...</p> : null}

          {foundUsers.length ? (
            <div className="user-suggest">
              <div className="user-suggest__title">Bazadagi mijozlar — bosib tanlang:</div>
              {foundUsers.map((user) => (
                <button key={user.id} type="button" className="user-suggest__item" onClick={() => pickUser(user)}>
                  <span className="cell-strong">
                    {user.firstName} {user.lastName || ''}
                  </span>
                  <span className="cell-muted">
                    {user.phone || '—'} · {user._count?.appointments ?? 0} ta bron
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}

      <h3 className="modal-section">2. Xizmat va barber</h3>

      <div className="field-row">
        <div className="field">
          <label className="field__label">Xizmat *</label>
          <select
            className="field__input"
            value={form.serviceId}
            onChange={(event) => update('serviceId', event.target.value)}
          >
            <option value="">— tanlang —</option>
            {services
              .filter((item) => item.isActive)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.duration} daq · {formatMoney(item.price)} so'm
                </option>
              ))}
          </select>
        </div>

        <div className="field">
          <label className="field__label">Barber *</label>
          <select
            className="field__input"
            value={form.barberId}
            onChange={(event) => update('barberId', event.target.value)}
          >
            <option value="">— tanlang —</option>
            {barbers
              .filter((item) => item.isActive)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <h3 className="modal-section">3. Sana va vaqt</h3>

      <div className="field">
        <label className="field__label">Sana *</label>
        <input
          type="date"
          className="field__input"
          style={{ maxWidth: 220 }}
          value={form.date}
          onChange={(event) => update('date', event.target.value)}
        />
      </div>

      {!form.barberId || !form.serviceId ? (
        <p className="cell-muted">Avval xizmat va barberni tanlang.</p>
      ) : slotsLoading ? (
        <p className="cell-muted">Bo'sh vaqtlar yuklanmoqda...</p>
      ) : (
        <>
          {slotInfo?.reason === 'DAY_OFF' ? (
            <div className="notice">Bu kuni {barber?.name} dam oladi. Baribir bron qo'sha olasiz — vaqtni qo'lda yozing.</div>
          ) : null}
          {slotInfo?.reason === 'BLOCKED' ? (
            <div className="notice">Bu kun bloklangan. Baribir bron qo'sha olasiz — vaqtni qo'lda yozing.</div>
          ) : null}

          {slots.length ? (
            <div className="slot-grid">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`slot-btn${form.startTime === slot ? ' slot-btn--active' : ''}`}
                  onClick={() => update('startTime', slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : (
            <p className="cell-muted">Bo'sh vaqt qolmagan — quyida vaqtni qo'lda yozing.</p>
          )}

          <div className="field" style={{ marginTop: 14 }}>
            <label className="field__label">Yoki vaqtni qo'lda yozing</label>
            <input
              type="time"
              className="field__input"
              style={{ maxWidth: 160 }}
              step="300"
              value={form.startTime}
              onChange={(event) => update('startTime', event.target.value)}
            />
            {outsideHours ? (
              <p className="field__hint" style={{ color: 'var(--warn)' }}>
                ⚠️ Bu vaqt ish jadvalidan tashqarida ({slotInfo.workStart}–{slotInfo.workEnd}). Baribir saqlanadi.
              </p>
            ) : null}
            {form.startTime && service ? (
              <p className="field__hint">
                Tugash vaqti: {service.duration} daqiqadan keyin
              </p>
            ) : null}
          </div>
        </>
      )}

      <h3 className="modal-section">4. To'lov</h3>

      <div className="field-row">
        <div className="field">
          <label className="field__label">To'lov turi</label>
          <select
            className="field__input"
            value={form.paymentMethod}
            onChange={(event) => update('paymentMethod', event.target.value)}
          >
            <option value="CASH">💵 Naqd</option>
            <option value="CARD">💳 Karta</option>
          </select>
        </div>

        <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label className="checkbox" style={{ marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={form.isPaid}
              onChange={(event) => update('isPaid', event.target.checked)}
            />
            <span>Pul olindi (to'langan)</span>
          </label>
        </div>
      </div>

      <div className="field">
        <label className="field__label">Izoh</label>
        <input
          className="field__input"
          value={form.note}
          onChange={(event) => update('note', event.target.value)}
          placeholder="Masalan: telefon orqali yozildi"
        />
      </div>

      {service ? (
        <div className="summary-box">
          Jami: <b>{formatMoney(service.price)} so'm</b> · {service.duration} daqiqa
          {barber ? ` · ${barber.name}` : ''}
          {form.startTime ? ` · ${form.date} ${form.startTime}` : ''}
        </div>
      ) : null}
    </Modal>
  );
}
