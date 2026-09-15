import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import { useAdmin } from '../context/AdminContext';
import { Empty, Loading, Modal, addDays, formatDate, todayStr } from '../components/ui';

const EMPTY = {
  barberId: '',
  date: todayStr(),
  startTime: '13:00',
  endTime: '14:00',
  isFullDay: false,
  reason: '',
};

const QUICK = [
  { label: '🍽 Tushlik 13:00–14:00', patch: { startTime: '13:00', endTime: '14:00', isFullDay: false, reason: 'Tushlik' } },
  { label: '🏃 Kunning yarmi 14:00–20:00', patch: { startTime: '14:00', endTime: '20:00', isFullDay: false, reason: 'Ishdan erta chiqaman' } },
  { label: '🚪 Butun kun yopiq', patch: { isFullDay: true, reason: 'Dam olish' } },
];

/** Tanaffus, dam olish kuni, bayram — o'sha vaqtga bron tushmaydi. */
export default function TimeBlocks() {
  const { showToast } = useAdmin();

  const [blocks, setBlocks] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [conflicts, setConflicts] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [blockList, barberList] = await Promise.all([
        api.getTimeBlocks(addDays(todayStr(), -7), addDays(todayStr(), 90)),
        api.getBarbers(),
      ]);
      setBlocks(blockList);
      setBarbers(barberList);
    } catch (requestError) {
      showToast(requestError.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setError(null);

    if (!form.isFullDay && form.endTime <= form.startTime) {
      setError('Tugash vaqti boshlanish vaqtidan keyin bo’lishi kerak');
      return;
    }

    setSaving(true);

    try {
      const result = await api.createTimeBlock({
        barberId: form.barberId ? Number(form.barberId) : null,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        isFullDay: form.isFullDay,
        reason: form.reason.trim() || null,
      });

      setOpen(false);
      showToast('Vaqt bloklandi', 'success');

      // Shu vaqtga tushib qolgan bronlar bo'lsa, ogohlantiramiz
      if (result.conflicting?.length) setConflicts(result.conflicting);
      else setConflicts(null);

      load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (block) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Blok olib tashlansinmi? O’sha vaqt yana bo’shaydi.')) return;

    try {
      await api.deleteTimeBlock(block.id);
      setBlocks((current) => current.filter((item) => item.id !== block.id));
      showToast('Blok olib tashlandi', 'success');
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  };

  const today = todayStr();
  const upcoming = blocks.filter((block) => block.date >= today);
  const past = blocks.filter((block) => block.date < today);

  const renderRow = (block) => (
    <div key={block.id} className="block-row">
      <div className="block-row__date">
        <div className="cell-strong">{formatDate(block.date, true)}</div>
        <div className="cell-muted">
          {block.isFullDay ? 'Butun kun' : `${block.startTime} — ${block.endTime}`}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="cell-strong">{block.barber ? block.barber.name : '👥 Barcha barberlar'}</div>
        <div className="cell-muted">{block.reason || 'sabab ko’rsatilmagan'}</div>
      </div>

      <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(block)}>
        Olib tashlash
      </button>
    </div>
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Vaqtni bloklash</h1>
          <p className="page-subtitle">
            Tanaffus, dam olish kuni yoki bayram — bloklangan vaqtga mijoz bron qila olmaydi
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setForm(EMPTY);
            setError(null);
            setOpen(true);
          }}
        >
          + Vaqt bloklash
        </button>
      </div>

      <h2 className="section-title" style={{ marginTop: 0 }}>
        Kelgusi bloklar ({upcoming.length})
      </h2>
      <div className="panel">
        {loading ? (
          <Loading />
        ) : upcoming.length ? (
          upcoming.map(renderRow)
        ) : (
          <Empty
            icon="🚫"
            title="Blok yo'q"
            text="Tushlik yoki dam olish kunini belgilash uchun yuqoridagi tugmani bosing"
          />
        )}
      </div>

      {past.length ? (
        <>
          <h2 className="section-title">O'tgan bloklar</h2>
          <div className="panel" style={{ opacity: 0.6 }}>
            {past.slice(-10).reverse().map(renderRow)}
          </div>
        </>
      ) : null}

      <Modal
        open={open}
        title="Vaqtni bloklash"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn--secondary" onClick={() => setOpen(false)}>
              Bekor qilish
            </button>
            <button type="button" className="btn btn--primary" onClick={save} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Bloklash'}
            </button>
          </>
        }
      >
        {error ? <div className="form-error">{error}</div> : null}

        <div className="field">
          <label className="field__label">Tez tanlash</label>
          <div className="btn-row">
            {QUICK.map((item) => (
              <button
                key={item.label}
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setForm((current) => ({ ...current, ...item.patch }))}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label">Kim uchun</label>
            <select
              className="field__input"
              value={form.barberId}
              onChange={(event) => update('barberId', event.target.value)}
            >
              <option value="">👥 Barcha barberlar</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label">Sana</label>
            <input
              type="date"
              className="field__input"
              value={form.date}
              onChange={(event) => update('date', event.target.value)}
            />
          </div>
        </div>

        <label className="checkbox" style={{ marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={form.isFullDay}
            onChange={(event) => update('isFullDay', event.target.checked)}
          />
          <span>Butun kun (sartaroshxona yopiq)</span>
        </label>

        {!form.isFullDay ? (
          <div className="field-row">
            <div className="field">
              <label className="field__label">Boshlanishi</label>
              <input
                type="time"
                className="field__input"
                step="900"
                value={form.startTime}
                onChange={(event) => update('startTime', event.target.value)}
              />
            </div>

            <div className="field">
              <label className="field__label">Tugashi</label>
              <input
                type="time"
                className="field__input"
                step="900"
                value={form.endTime}
                onChange={(event) => update('endTime', event.target.value)}
              />
            </div>
          </div>
        ) : null}

        <div className="field">
          <label className="field__label">Sabab (ixtiyoriy)</label>
          <input
            className="field__input"
            value={form.reason}
            onChange={(event) => update('reason', event.target.value)}
            placeholder="Masalan: To'yga boraman"
          />
        </div>
      </Modal>

      {/* Blok qo'yilganda ostida qolib ketgan bronlar */}
      <Modal
        open={Boolean(conflicts)}
        title="⚠️ Diqqat — bu vaqtda bronlar bor"
        onClose={() => setConflicts(null)}
        footer={
          <button type="button" className="btn btn--primary" onClick={() => setConflicts(null)}>
            Tushunarli
          </button>
        }
      >
        <p style={{ marginTop: 0 }}>
          Vaqt bloklandi, lekin quyidagi bronlar allaqachon qabul qilingan edi. Mijozlarga
          qo'ng'iroq qilib, boshqa vaqtga ko'chiring yoki bekor qiling:
        </p>

        {(conflicts || []).map((item) => (
          <div key={item.id} className="block-row" style={{ padding: '10px 0' }}>
            <div style={{ flex: 1 }}>
              <div className="cell-strong">
                {item.startTime} — {item.user.firstName} ({item.barber.name})
              </div>
              <div className="cell-muted">
                {item.service.name} ·{' '}
                {item.user.phone ? <a href={`tel:${item.user.phone}`}>{item.user.phone}</a> : 'telefon yo’q'}
              </div>
            </div>
          </div>
        ))}
      </Modal>
    </>
  );
}
