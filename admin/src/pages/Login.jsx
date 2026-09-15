import { useState } from 'react';
import { useAdmin } from '../context/AdminContext';

export default function Login() {
  const { login } = useAdmin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await login(username.trim(), password);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__logo">💈</div>
        <h1 className="login__title">Admin Panel</h1>
        <p className="login__subtitle">Boshqaruv paneliga kirish</p>

        {error ? <div className="form-error">{error}</div> : null}

        <div className="field">
          <label className="field__label" htmlFor="login-username">
            Login
          </label>
          <input
            id="login-username"
            className="field__input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            autoFocus
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="login-password">
            Parol
          </label>
          <input
            id="login-password"
            className="field__input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Tekshirilmoqda...' : 'Kirish'}
        </button>
      </form>
    </div>
  );
}
