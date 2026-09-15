import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';
import { getTranslation } from '../i18n';
import { getTelegramUser } from '../telegram';

const AppContext = createContext(null);

const LANGUAGE_KEY = 'barber.language';
const ONBOARDING_KEY = 'barber.onboarded';

function readStored(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (_error) {
    return null;
  }
}

function writeStored(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (_error) {
    /* localStorage bloklangan bo'lishi mumkin */
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [language, setLanguageState] = useState(() => readStored(LANGUAGE_KEY) || 'uz');
  const [onboarded, setOnboarded] = useState(() => readStored(ONBOARDING_KEY) === '1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getMe();
      setUser(data.user);
      setShop(data.shop);

      // Tilni serverdagi qiymat bilan moslashtiramiz
      const stored = readStored(LANGUAGE_KEY);
      if (stored && stored !== data.user.language) {
        await api.updateMe({ language: stored });
        setUser({ ...data.user, language: stored });
      } else if (data.user.language) {
        setLanguageState(data.user.language);
        writeStored(LANGUAGE_KEY, data.user.language);
      }
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setLanguage = useCallback(async (next) => {
    setLanguageState(next);
    writeStored(LANGUAGE_KEY, next);
    try {
      const data = await api.updateMe({ language: next });
      setUser(data.user);
    } catch (_requestError) {
      /* til baribir mahalliy saqlanadi */
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    writeStored(ONBOARDING_KEY, '1');
    setOnboarded(true);
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      shop,
      language,
      setLanguage,
      text: getTranslation(language),
      onboarded,
      completeOnboarding,
      loading,
      error,
      reload: load,
      toast,
      showToast,
      telegramUser: getTelegramUser(),
    }),
    [user, shop, language, setLanguage, onboarded, completeOnboarding, loading, error, load, toast, showToast]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp faqat AppProvider ichida ishlaydi');
  return context;
}

export default AppContext;
