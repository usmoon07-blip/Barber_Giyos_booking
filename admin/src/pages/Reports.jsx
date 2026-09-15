import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api';
import { useAdmin } from '../context/AdminContext';
import { Empty, Loading, formatDate, formatMoney, todayStr } from '../components/ui';

/** "2026-09-15" -> shu oyning birinchi kuni */
function monthStart(dateStr) {
  return `${dateStr.slice(0, 7)}-01`;
}

/** "2026-09-15" -> shu oyning oxirgi kuni */
function monthEnd(dateStr) {
  const date = new Date(`${monthStart(dateStr)}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const PRESETS = [
  { id: 'today', label: 'Bugun' },
  { id: 'week', label: "Oxirgi 7 kun" },
  { id: 'next7', label: 'Kelasi 7 kun' },
  { id: 'month', label: 'Shu oy' },
  { id: 'prevMonth', label: "O'tgan oy" },
  { id: 'custom', label: 'Oraliq' },
];

function rangeFor(preset) {
  const today = todayStr();

  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'week':
      return { from: addDays(today, -6), to: today };
    case 'next7':
      return { from: today, to: addDays(today, 6) };
    case 'prevMonth': {
      const lastOfPrev = addDays(monthStart(today), -1);
      return { from: monthStart(lastOfPrev), to: lastOfPrev };
    }
    case 'month':
    default:
      // Butun oy — o'tgan kunlar ham, kelgusi bronlar ham ko'rinsin
      return { from: monthStart(today), to: monthEnd(today) };
  }
}

export default function Reports() {
  const { showToast } = useAdmin();

  const [preset, setPreset] = useState('month');
  const [range, setRange] = useState(() => rangeFor('month'));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hideEmptyDays, setHideEmptyDays] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReport(await api.getReport(range.from, range.to));
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [range, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const choosePreset = (id) => {
    setPreset(id);
    if (id !== 'custom') setRange(rangeFor(id));
  };

  const maxRevenue = useMemo(
    () => Math.max(1, ...(report?.byDay || []).map((day) => day.completedRevenue + day.expected)),
    [report]
  );

  const visibleDays = useMemo(() => {
    const days = report?.byDay || [];
    return hideEmptyDays ? days.filter((day) => day.count > 0) : days;
  }, [report, hideEmptyDays]);

  /** Hisobotni Excel'da ochsa bo'ladigan CSV faylga yuklab beradi. */
  const exportCsv = () => {
    if (!report) return;

    const { totals } = report;

    const rows = [
      [`Tushum hisoboti: ${report.from} — ${report.to}`],
      [],
      ['Sana', 'Bronlar', 'Bajarilgan', 'Bekor', 'Tushum', 'Naqd', 'Karta', "To'lanmagan"],
      ...visibleDays.map((day) => [
        day.date,
        day.count,
        day.completedCount,
        day.cancelledCount,
        day.completedRevenue,
        day.cash,
        day.card,
        day.unpaidCompleted,
      ]),
      [
        'JAMI',
        totals.count,
        totals.completedCount,
        totals.cancelledCount,
        totals.completedRevenue,
        totals.cash,
        totals.card,
        totals.unpaidCompleted,
      ],
      [],
      ['Barber', 'Bajarilgan', 'Bekor', 'Naqd', 'Karta', "To'lanmagan", 'Tushum'],
      ...report.byBarber.map((barber) => [
        barber.name,
        barber.completedCount,
        barber.cancelledCount,
        barber.cash,
        barber.card,
        barber.unpaidCompleted,
        barber.completedRevenue,
      ]),
      [],
      ['Xizmat', 'Soni', 'Bajarilgan', 'Tushum'],
      ...report.byService.map((service) => [
        service.name,
        service.count,
        service.completedCount,
        service.completedRevenue,
      ]),
    ];

    const csv = rows.map((row) => row.join(';')).join('\n');
    // \ufeff — Excel o'zbekcha harflarni to'g'ri o'qishi uchun
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `hisobot_${report.from}_${report.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !report) return <Loading />;
  if (!report) return <Empty icon="⚠️" title="Hisobot yuklanmadi" />;

  const { totals } = report;

  const cards = [
    {
      label: '💰 Tushum (bajarilgan ish)',
      value: `${formatMoney(totals.completedRevenue)} so'm`,
      hint: `qabul qilingan pul: ${formatMoney(totals.cash + totals.card)} so'm`,
      accent: true,
    },
    { label: '💵 Naqd pul', value: `${formatMoney(totals.cash)} so'm` },
    { label: '💳 Karta', value: `${formatMoney(totals.card)} so'm` },
    { label: '⏳ Kutilayotgan tushum', value: `${formatMoney(totals.expected)} so'm`, hint: 'hali bajarilmagan bronlar' },
    { label: '🧾 Bajarilgan xizmatlar', value: totals.completedCount },
    { label: '📊 O\'rtacha chek', value: `${formatMoney(totals.avgCheck)} so'm` },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Tushum hisoboti</h1>
          <p className="page-subtitle">
            {formatDate(report.from, true)} — {formatDate(report.to, true)}
          </p>
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn--secondary" onClick={exportCsv}>
            ⬇ Excel (CSV)
          </button>
          <button type="button" className="btn btn--secondary" onClick={load}>
            ↻ Yangilash
          </button>
        </div>
      </div>

      <div className="filters">
        {PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`btn ${preset === item.id ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => choosePreset(item.id)}
          >
            {item.label}
          </button>
        ))}

        {preset === 'custom' ? (
          <>
            <input
              type="date"
              className="field__input"
              value={range.from}
              max={range.to}
              onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))}
            />
            <input
              type="date"
              className="field__input"
              value={range.to}
              min={range.from}
              onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))}
            />
          </>
        ) : null}
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

      {totals.unpaidCompleted > 0 ? (
        <div className="notice">
          ⚠️ Bajarilgan ishlardan <b>{formatMoney(totals.unpaidCompleted)} so'm</b> hali «to'langan» deb
          belgilanmagan. Bronlar sahifasidan belgilashingiz mumkin.
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <h2 className="section-title">Kunlar bo'yicha</h2>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={hideEmptyDays}
            onChange={(event) => setHideEmptyDays(event.target.checked)}
          />
          <span>Bron bo'lmagan kunlarni yashirish</span>
        </label>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th>Sana</th>
                <th style={{ width: '26%' }}>Tushum</th>
                <th>Bronlar</th>
                <th>Bajarilgan</th>
                <th>Bekor</th>
                <th>💵 Naqd</th>
                <th>💳 Karta</th>
                <th>Jami tushum</th>
              </tr>
            </thead>
            <tbody>
              {visibleDays.length === 0 ? (
                <tr>
                  <td colSpan={8} className="cell-muted" style={{ textAlign: 'center', padding: 32 }}>
                    Bu oraliqda bron yo'q
                  </td>
                </tr>
              ) : null}
              {visibleDays.map((day) => (
                <tr key={day.date}>
                  <td className="cell-strong">{formatDate(day.date, true)}</td>
                  <td>
                    <div className="mini-bar">
                      <div
                        className="mini-bar__fill"
                        style={{ width: `${(day.completedRevenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td>{day.count}</td>
                  <td>{day.completedCount}</td>
                  <td className={day.cancelledCount ? 'cell-danger' : 'cell-muted'}>{day.cancelledCount}</td>
                  <td>{day.cash ? `${formatMoney(day.cash)}` : '—'}</td>
                  <td>{day.card ? `${formatMoney(day.card)}` : '—'}</td>
                  <td className="cell-strong">
                    {day.completedRevenue ? `${formatMoney(day.completedRevenue)} so'm` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="cell-strong">JAMI</td>
                <td />
                <td className="cell-strong">{totals.count}</td>
                <td className="cell-strong">{totals.completedCount}</td>
                <td className="cell-strong">{totals.cancelledCount}</td>
                <td className="cell-strong">{formatMoney(totals.cash)}</td>
                <td className="cell-strong">{formatMoney(totals.card)}</td>
                <td className="cell-strong">{formatMoney(totals.completedRevenue)} so'm</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <h2 className="section-title">Barberlar bo'yicha</h2>
      <div className="panel">
        {report.byBarber.length ? (
          <div className="table-wrap">
            <table style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>Barber</th>
                  <th>Bajarilgan</th>
                  <th>Bekor</th>
                  <th>💵 Naqd</th>
                  <th>💳 Karta</th>
                  <th>⏳ To'lanmagan</th>
                  <th>Tushum</th>
                </tr>
              </thead>
              <tbody>
                {report.byBarber.map((barber) => (
                  <tr key={barber.barberId}>
                    <td className="cell-strong">{barber.name}</td>
                    <td>{barber.completedCount}</td>
                    <td className="cell-muted">{barber.cancelledCount}</td>
                    <td>{formatMoney(barber.cash)}</td>
                    <td>{formatMoney(barber.card)}</td>
                    <td className={barber.unpaidCompleted ? 'cell-danger' : 'cell-muted'}>
                      {barber.unpaidCompleted ? formatMoney(barber.unpaidCompleted) : '—'}
                    </td>
                    <td className="cell-strong">{formatMoney(barber.completedRevenue)} so'm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon="💈" title="Bu oraliqda bron yo'q" />
        )}
      </div>

      <h2 className="section-title">Xizmatlar bo'yicha</h2>
      <div className="panel">
        {report.byService.length ? (
          <div className="table-wrap">
            <table style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  <th>Xizmat</th>
                  <th>Soni</th>
                  <th>Bajarilgan</th>
                  <th>Tushum</th>
                </tr>
              </thead>
              <tbody>
                {report.byService.map((service) => (
                  <tr key={service.serviceId}>
                    <td className="cell-strong">{service.name}</td>
                    <td>{service.count}</td>
                    <td>{service.completedCount}</td>
                    <td className="cell-strong">{formatMoney(service.completedRevenue)} so'm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon="✂️" title="Bu oraliqda bron yo'q" />
        )}
      </div>
    </>
  );
}
