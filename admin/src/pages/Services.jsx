import { useEffect, useState } from 'react';
import api from '../api';
import { useAdmin } from '../context/AdminContext';
import { CATEGORY_LABELS, Empty, Img, Loading, Modal, formatMoney } from '../components/ui';

const CATEGORIES = ['HAIR', 'BEARD', 'COMBO', 'STYLING', 'OTHER'];
const DURATIONS = [15, 20, 30, 45, 60, 75, 90, 120];

const EMPTY_FORM = {
  name: '',
  nameRu: '',
  imageUrl: '',
  description: '',
  descriptionRu: '',
  price: '',
  oldPrice: '',
  category: 'HAIR',
  duration: 30,
  isPopular: false,
  isActive: true,
  sortOrder: 0,
};

export default function Services() {
  const { showToast } = useAdmin();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setServices(await api.getServices());
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

  const openEdit = (service) => {
    setForm({
      name: service.name,
      nameRu: service.nameRu || '',
      imageUrl: service.imageUrl || '',
      description: service.description || '',
      descriptionRu: service.descriptionRu || '',
      price: String(service.price),
      oldPrice: service.oldPrice ? String(service.oldPrice) : '',
      category: service.category,
      duration: service.duration,
      isPopular: service.isPopular,
      isActive: service.isActive,
      sortOrder: service.sortOrder,
    });
    setError(null);
    setEditing(service);
  };

  const save = async () => {
    setError(null);

    if (form.name.trim().length < 2) {
      setError('Xizmat nomini kiriting');
      return;
    }

    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      setError('Narxni to\'g\'ri kiriting');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        nameRu: form.nameRu.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        description: form.description.trim() || null,
        descriptionRu: form.descriptionRu.trim() || null,
        price,
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        category: form.category,
        duration: Number(form.duration),
        isPopular: form.isPopular,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editing === 'new') {
        await api.createService(payload);
        showToast('Xizmat qo\'shildi', 'success');
      } else {
        await api.updateService(editing.id, payload);
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

  const toggleActive = async (service) => {
    try {
      await api.updateService(service.id, { isActive: !service.isActive });
      setServices((current) =>
        current.map((item) => (item.id === service.id ? { ...item, isActive: !item.isActive } : item))
      );
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  };

  const remove = async (service) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`"${service.name}" o'chirilsinmi?`)) return;

    try {
      await api.deleteService(service.id);
      setServices((current) => current.filter((item) => item.id !== service.id));
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
          <h1 className="page-title">Xizmatlar va narxlar</h1>
          <p className="page-subtitle">
            Narx o'zgartirilsa, botdagi Price List va Mini App avtomatik yangilanadi
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={openCreate}>
          + Yangi xizmat
        </button>
      </div>

      <div className="panel">
        {loading ? (
          <Loading />
        ) : services.length ? (
          <div className="table-wrap">
            <table style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={{ width: 72 }}>Rasm</th>
                  <th>Nomi</th>
                  <th>Kategoriya</th>
                  <th>Davomiyligi</th>
                  <th>Narx</th>
                  <th>Holat</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <Img
                        src={service.imageUrl}
                        alt=""
                        className="thumb"
                        fallbackClassName="thumb thumb--fallback"
                        fallback="✂️"
                      />
                    </td>
                    <td>
                      <div className="cell-strong">{service.name}</div>
                      {service.nameRu ? <div className="cell-muted">{service.nameRu}</div> : null}
                      {service.isPopular ? (
                        <span className="pill pill--otw" style={{ marginTop: 4 }}>
                          ⭐ Mashhur
                        </span>
                      ) : null}
                    </td>
                    <td>{CATEGORY_LABELS[service.category]}</td>
                    <td>{service.duration} daq</td>
                    <td>
                      <div className="cell-strong">{formatMoney(service.price)} so'm</div>
                      {service.oldPrice ? (
                        <div className="cell-muted" style={{ textDecoration: 'line-through' }}>
                          {formatMoney(service.oldPrice)} so'm
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className={`pill ${service.isActive ? 'pill--on' : 'pill--off'}`}>
                        {service.isActive ? 'Faol' : 'Yashirilgan'}
                      </span>
                    </td>
                    <td>
                      <div className="btn-row">
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => toggleActive(service)}
                        >
                          {service.isActive ? 'Yashirish' : 'Ko\'rsatish'}
                        </button>
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => openEdit(service)}
                        >
                          Tahrirlash
                        </button>
                        <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(service)}>
                          O'chirish
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon="✂️" title="Xizmat qo'shilmagan" />
        )}
      </div>

      <Modal
        open={Boolean(editing)}
        title={editing === 'new' ? 'Yangi xizmat' : 'Xizmatni tahrirlash'}
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

        <div className="field-row">
          <div className="field">
            <label className="field__label">Nomi (o'zbekcha) *</label>
            <input
              className="field__input"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="Fade"
            />
          </div>

          <div className="field">
            <label className="field__label">Nomi (ruscha)</label>
            <input
              className="field__input"
              value={form.nameRu}
              onChange={(event) => update('nameRu', event.target.value)}
              placeholder="Фейд"
            />
          </div>
        </div>

        <div className="field">
          <label className="field__label">Rasm havolasi (URL)</label>
          <input
            className="field__input"
            value={form.imageUrl}
            onChange={(event) => update('imageUrl', event.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="field">
          <label className="field__label">Tavsif (o'zbekcha)</label>
          <textarea
            className="field__input"
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
          />
        </div>

        <div className="field">
          <label className="field__label">Tavsif (ruscha)</label>
          <textarea
            className="field__input"
            value={form.descriptionRu}
            onChange={(event) => update('descriptionRu', event.target.value)}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label">Narx (so'm) *</label>
            <input
              type="number"
              className="field__input"
              value={form.price}
              onChange={(event) => update('price', event.target.value)}
              placeholder="120000"
            />
          </div>

          <div className="field">
            <label className="field__label">Eski narx (chegirma uchun)</label>
            <input
              type="number"
              className="field__input"
              value={form.oldPrice}
              onChange={(event) => update('oldPrice', event.target.value)}
              placeholder="140000"
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label">Kategoriya</label>
            <select
              className="field__input"
              value={form.category}
              onChange={(event) => update('category', event.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label">Davomiyligi</label>
            <select
              className="field__input"
              value={form.duration}
              onChange={(event) => update('duration', event.target.value)}
            >
              {DURATIONS.map((duration) => (
                <option key={duration} value={duration}>
                  {duration} daqiqa
                </option>
              ))}
            </select>
          </div>
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

        <label className="checkbox" style={{ marginBottom: 10 }}>
          <input
            type="checkbox"
            checked={form.isPopular}
            onChange={(event) => update('isPopular', event.target.checked)}
          />
          <span>Mashhur (bosh sahifada ko'rinadi)</span>
        </label>

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
