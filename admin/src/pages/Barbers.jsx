import { useEffect, useState } from 'react';
import api from '../api';
import { useAdmin } from '../context/AdminContext';
import { Empty, Img, Loading, Modal } from '../components/ui';

const EMPTY_FORM = {
  name: '',
  photoUrl: '',
  bio: '',
  bioRu: '',
  phone: '',
  sortOrder: 0,
  isActive: true,
};

export default function Barbers() {
  const { showToast } = useAdmin();

  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setBarbers(await api.getBarbers());
    } catch (requestError) {
      showToast(requestError.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError(null);
    setEditing('new');
  };

  const openEdit = (barber) => {
    setForm({
      name: barber.name,
      photoUrl: barber.photoUrl || '',
      bio: barber.bio || '',
      bioRu: barber.bioRu || '',
      phone: barber.phone || '',
      sortOrder: barber.sortOrder,
      isActive: barber.isActive,
    });
    setError(null);
    setEditing(barber);
  };

  const save = async () => {
    setError(null);

    if (form.name.trim().length < 2) {
      setError('Barber ismini kiriting');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        photoUrl: form.photoUrl.trim() || null,
        bio: form.bio.trim() || null,
        bioRu: form.bioRu.trim() || null,
        phone: form.phone.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };

      if (editing === 'new') {
        await api.createBarber(payload);
        showToast('Barber qo\'shildi', 'success');
      } else {
        await api.updateBarber(editing.id, payload);
        showToast('Saqlandi', 'success');
      }

      setEditing(null);
      load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (barber) => {
    try {
      await api.updateBarber(barber.id, { isActive: !barber.isActive });
      setBarbers((current) =>
        current.map((item) => (item.id === barber.id ? { ...item, isActive: !item.isActive } : item))
      );
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  };

  const remove = async (barber) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`"${barber.name}" o'chirilsinmi?`)) return;

    try {
      await api.deleteBarber(barber.id);
      setBarbers((current) => current.filter((item) => item.id !== barber.id));
      showToast('O\'chirildi', 'success');
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  };

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Barberlar</h1>
          <p className="page-subtitle">Jami {barbers.length} ta</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={openCreate}>
          + Yangi barber
        </button>
      </div>

      <div className="panel">
        {loading ? (
          <Loading />
        ) : barbers.length ? (
          barbers.map((barber) => (
            <div key={barber.id} className="barber-row">
              <Img
                src={barber.photoUrl}
                alt={barber.name}
                className="avatar"
                fallbackClassName="avatar avatar--fallback"
                fallback={barber.name.charAt(0).toUpperCase()}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="cell-strong">{barber.name}</span>
                  <span className={`pill ${barber.isActive ? 'pill--on' : 'pill--off'}`}>
                    {barber.isActive ? 'Faol' : 'Faol emas'}
                  </span>
                </div>
                <div className="cell-muted">{barber.bio || 'Tavsif kiritilmagan'}</div>
                {barber.phone ? <div className="cell-muted">📞 {barber.phone}</div> : null}
              </div>

              <div className="btn-row">
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => toggleActive(barber)}>
                  {barber.isActive ? 'Faolsizlantirish' : 'Faollashtirish'}
                </button>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => openEdit(barber)}>
                  Tahrirlash
                </button>
                <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(barber)}>
                  O'chirish
                </button>
              </div>
            </div>
          ))
        ) : (
          <Empty icon="💈" title="Barber qo'shilmagan" text="Yuqoridagi tugma orqali qo'shing" />
        )}
      </div>

      <Modal
        open={Boolean(editing)}
        title={editing === 'new' ? 'Yangi barber' : 'Barberni tahrirlash'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className="btn btn--secondary" onClick={() => setEditing(null)}>
              Bekor qilish
            </button>
            <button type="button" className="btn btn--primary" onClick={save} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </>
        }
      >
        {error ? <div className="form-error">{error}</div> : null}

        <div className="field">
          <label className="field__label">Ism *</label>
          <input
            className="field__input"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Masalan: Aziz Barber"
          />
        </div>

        <div className="field">
          <label className="field__label">Rasm havolasi (URL)</label>
          <input
            className="field__input"
            value={form.photoUrl}
            onChange={(event) => update('photoUrl', event.target.value)}
            placeholder="https://..."
          />
          {form.photoUrl ? (
            <div style={{ marginTop: 10 }}>
              <Img
                src={form.photoUrl}
                alt=""
                className="avatar"
                fallbackClassName="avatar avatar--fallback"
                fallback="?"
              />
            </div>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label">Tavsif (o'zbekcha)</label>
          <textarea
            className="field__input"
            value={form.bio}
            onChange={(event) => update('bio', event.target.value)}
            placeholder="Masalan: 10 yillik tajriba. Fade bo'yicha usta."
          />
        </div>

        <div className="field">
          <label className="field__label">Tavsif (ruscha)</label>
          <textarea
            className="field__input"
            value={form.bioRu}
            onChange={(event) => update('bioRu', event.target.value)}
            placeholder="Опыт 10 лет..."
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label">Telefon</label>
            <input
              className="field__input"
              value={form.phone}
              onChange={(event) => update('phone', event.target.value)}
              placeholder="+998 __ ___ __ __"
            />
          </div>

          <div className="field">
            <label className="field__label">Tartib raqami</label>
            <input
              type="number"
              className="field__input"
              value={form.sortOrder}
              onChange={(event) => update('sortOrder', event.target.value)}
            />
          </div>
        </div>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => update('isActive', event.target.checked)}
          />
          <span>Faol (mijozlarga ko'rinadi)</span>
        </label>
      </Modal>
    </>
  );
}
