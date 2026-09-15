import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import { useAdmin } from '../context/AdminContext';
import { Empty, Loading, formatDate } from '../components/ui';

export default function Users() {
  const { showToast } = useAdmin();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getUsers({ search, page, pageSize: 30 });
      setItems(result.items);
      setTotal(result.total);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, page, showToast]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Mijozlar</h1>
          <p className="page-subtitle">Jami {total} ta</p>
        </div>
      </div>

      <div className="filters">
        <input
          className="field__input"
          style={{ minWidth: 260 }}
          placeholder="Ism, telefon yoki username..."
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
        />
      </div>

      <div className="panel">
        {loading ? (
          <Loading />
        ) : items.length ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ism</th>
                    <th>Telefon</th>
                    <th>Telegram</th>
                    <th>Til</th>
                    <th>Bronlar</th>
                    <th>Ro'yxatdan o'tgan</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((user) => (
                    <tr key={user.id}>
                      <td className="cell-strong">
                        {user.firstName} {user.lastName || ''}
                      </td>
                      <td>{user.phone ? <a href={`tel:${user.phone}`}>{user.phone}</a> : '—'}</td>
                      <td className="cell-muted">{user.username ? `@${user.username}` : '—'}</td>
                      <td>{user.language === 'ru' ? '🇷🇺 Ruscha' : "🇺🇿 O'zbekcha"}</td>
                      <td className="cell-strong">{user._count?.appointments ?? 0}</td>
                      <td className="cell-muted">{formatDate(user.createdAt?.slice(0, 10), true)}</td>
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
          <Empty icon="👥" title="Mijoz topilmadi" />
        )}
      </div>
    </>
  );
}
