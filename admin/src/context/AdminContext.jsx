import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { getToken, setToken, setUnauthorizedHandler } from '../api';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [authed, setAuthed] = useState(Boolean(getToken()));
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [shopName, setShopName] = useState('Barbershop');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(timer);
  }, [toast]);

  const logout = useCallback(() => {
    setToken(null);
    setAuthed(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setAuthed(false));
  }, []);

  // Saqlangan token hali amal qiladimi — tekshiramiz
  useEffect(() => {
    if (!getToken()) {
      setChecking(false);
      return;
    }

    api
      .me()
      .then(() => setAuthed(true))
      .catch(() => {
        setToken(null);
        setAuthed(false);
      })
      .finally(() => setChecking(false));
  }, []);

  // Sartaroshxona nomini yon menyuda ko'rsatamiz
  useEffect(() => {
    if (!authed) return;
    api
      .getSettings()
      .then((settings) => setShopName(settings.shopName))
      .catch(() => {});
  }, [authed]);

  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    setToken(data.token);
    setAuthed(true);
    return data;
  }, []);

  const value = useMemo(
    () => ({ authed, checking, login, logout, shopName, setShopName, toast, showToast }),
    [authed, checking, login, logout, shopName, toast, showToast]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin faqat AdminProvider ichida ishlaydi');
  return context;
}
