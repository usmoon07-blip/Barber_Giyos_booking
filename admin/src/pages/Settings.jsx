import { useEffect, useState } from 'react';
import api from '../api';
import { useAdmin } from '../context/AdminContext';
import { Loading } from '../components/ui';

const TEXT_FIELDS = [
  { key: 'shopName', label: 'Sartaroshxona nomi *', placeholder: "G'iyos Barbershop" },
  { key: 'phone', label: 'Telefon', placeholder: '+998 __ ___ __ __' },
  { key: 'address', label: "Manzil (o'zbekcha)", placeholder: 'Toshkent, Chilonzor...' },
  { key: 'addressRu', label: 'Manzil (ruscha)', placeholder: 'Ташкент, Чиланзар...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'barber_giyosboy' },
  { key: 'telegramChannel', label: 'Telegram kanal', placeholder: '@kanal_nomi' },
  { key: 'workingHoursText', label: "Ish vaqti (o'zbekcha)", placeholder: 'Har kuni 09:00 — 20:00' },
  { key: 'workingHoursTextRu', label: 'Ish vaqti (ruscha)', placeholder: 'Ежедневно 09:00 — 20:00' },
  { key: 'logoUrl', label: 'Logo havolasi (URL)', placeholder: 'https://...' },
];

const CARD_FIELDS = [
  { key: 'cardNumber', label: 'Karta raqami', placeholder: '8600 1234 5678 9012' },
  { key: 'cardHolder', label: 'Karta egasining ismi', placeholder: 'GIYOS ABDULLAYEV' },
  { key: 'cardBank', label: 'Bank / karta turi', placeholder: 'Uzcard · Kapitalbank' },
];

export default function Settings() {
  const { showToast, setShopName } = useAdmin();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then(setForm)
      .catch((error) => showToast(error.message, 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (!form.shopName || !String(form.shopName).trim()) {
      showToast('Sartaroshxona nomini kiriting', 'error');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...Object.fromEntries(TEXT_FIELDS.map(({ key }) => [key, form[key] || null])),
        ...Object.fromEntries(CARD_FIELDS.map(({ key }) => [key, form[key] || null])),
        cardPaymentEnabled: Boolean(form.cardPaymentEnabled),
        cashPaymentEnabled: Boolean(form.cashPaymentEnabled),
        about: form.about || null,
        aboutRu: form.aboutRu || null,
        locationLat: form.locationLat === '' ? null : form.locationLat,
        locationLng: form.locationLng === '' ? null : form.locationLng,
        slotStep: Number(form.slotStep),
        minLeadMinutes: Number(form.minLeadMinutes),
        maxAdvanceDays: Number(form.maxAdvanceDays),
        reminderHours: Number(form.reminderHours),
      };

      const updated = await api.updateSettings(payload);
      setForm(updated);
      setShopName(updated.shopName);
      showToast('Sozlamalar saqlandi', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <Loading />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Sozlamalar</h1>
          <p className="page-subtitle">Bu ma'lumotlar bot va Mini App'da ko'rinadi</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={save} disabled={saving}>
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>

      <div className="panel" style={{ padding: 22, maxWidth: 720 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Asosiy ma'lumotlar
        </h2>

        {TEXT_FIELDS.map(({ key, label, placeholder }) => (
          <div className="field" key={key}>
            <label className="field__label">{label}</label>
            <input
              className="field__input"
              value={form[key] || ''}
              placeholder={placeholder}
              onChange={(event) => update(key, event.target.value)}
            />
          </div>
        ))}

        <div className="field">
          <label className="field__label">Qisqacha tavsif (o'zbekcha)</label>
          <textarea
            className="field__input"
            value={form.about || ''}
            onChange={(event) => update('about', event.target.value)}
          />
        </div>

        <div className="field">
          <label className="field__label">Qisqacha tavsif (ruscha)</label>
          <textarea
            className="field__input"
            value={form.aboutRu || ''}
            onChange={(event) => update('aboutRu', event.target.value)}
          />
        </div>

        <h2 className="section-title">💳 To'lov ma'lumotlari</h2>

        <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 16px' }}>
          Karta raqami mijozga Mini App'da va botda ko'rinadi. Mijoz uni bir bosishda nusxa oladi.
        </p>

        <label className="checkbox" style={{ marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={Boolean(form.cashPaymentEnabled)}
            onChange={(event) => update('cashPaymentEnabled', event.target.checked)}
          />
          <span>💵 Naqd pul orqali to'lash mumkin</span>
        </label>

        <label className="checkbox" style={{ marginBottom: 18 }}>
          <input
            type="checkbox"
            checked={Boolean(form.cardPaymentEnabled)}
            onChange={(event) => update('cardPaymentEnabled', event.target.checked)}
          />
          <span>💳 Karta orqali to'lash mumkin</span>
        </label>

        {form.cardPaymentEnabled ? (
          <>
            {CARD_FIELDS.map(({ key, label, placeholder }) => (
              <div className="field" key={key}>
                <label className="field__label">{label}</label>
                <input
                  className="field__input"
                  value={form[key] || ''}
                  placeholder={placeholder}
                  onChange={(event) => update(key, event.target.value)}
                />
              </div>
            ))}

            {form.cardNumber ? (
              <div className="card-preview">
                <div className="card-preview__label">Mijoz shunday ko'radi:</div>
                <div className="card-preview__number">{form.cardNumber}</div>
                {form.cardHolder ? (
                  <div className="card-preview__holder">{form.cardHolder}</div>
                ) : null}
                {form.cardBank ? <div className="card-preview__holder">🏦 {form.cardBank}</div> : null}
              </div>
            ) : null}
          </>
        ) : null}

        <h2 className="section-title">Joylashuv (Telegramda xarita yuborish uchun)</h2>

        <div className="field-row">
          <div className="field">
            <label className="field__label">Kenglik (latitude)</label>
            <input
              type="number"
              step="0.000001"
              className="field__input"
              value={form.locationLat ?? ''}
              placeholder="41.311081"
              onChange={(event) => update('locationLat', event.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label">Uzunlik (longitude)</label>
            <input
              type="number"
              step="0.000001"
              className="field__input"
              value={form.locationLng ?? ''}
              placeholder="69.240562"
              onChange={(event) => update('locationLng', event.target.value)}
            />
          </div>
        </div>

        <h2 className="section-title">Bron qoidalari</h2>

        <div className="field-row">
          <div className="field">
            <label className="field__label">Vaqt oralig'i</label>
            <select
              className="field__input"
              value={form.slotStep}
              onChange={(event) => update('slotStep', event.target.value)}
            >
              {[10, 15, 20, 30, 60].map((step) => (
                <option key={step} value={step}>
                  {step} daqiqa
                </option>
              ))}
            </select>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '6px 0 0' }}>
              Bo'sh vaqtlar shu oraliqda ko'rsatiladi (09:00, 09:30, 10:00...)
            </p>
          </div>

          <div className="field">
            <label className="field__label">Eng kamida necha daqiqa oldin</label>
            <input
              type="number"
              className="field__input"
              value={form.minLeadMinutes}
              onChange={(event) => update('minLeadMinutes', event.target.value)}
            />
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '6px 0 0' }}>
              Masalan 30 — mijoz 30 daqiqadan kamroq qolgan vaqtga bron qila olmaydi
            </p>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label">Necha kun oldinga bron</label>
            <input
              type="number"
              className="field__input"
              value={form.maxAdvanceDays}
              onChange={(event) => update('maxAdvanceDays', event.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label">Eslatma (necha soat oldin)</label>
            <input
              type="number"
              className="field__input"
              value={form.reminderHours}
              onChange={(event) => update('reminderHours', event.target.value)}
            />
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '6px 0 0' }}>
              0 — eslatma yuborilmaydi
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
