/**
 * Telegram Mini App bilan ishlash uchun yordamchi funksiyalar.
 * Brauzerda (Telegramdan tashqarida) ochilganda ham xatosiz ishlaydi.
 */

const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

export const isTelegram = Boolean(webApp?.initData);

/** Ilova ochilganda bir marta chaqiriladi. */
export function initTelegram() {
  if (!webApp) return;

  try {
    webApp.ready();
    webApp.expand();
    webApp.setHeaderColor('#ffffff');
    webApp.setBackgroundColor('#ffffff');
    if (webApp.disableVerticalSwipes) webApp.disableVerticalSwipes();
  } catch (_error) {
    /* eski Telegram versiyalarida ba'zi metodlar bo'lmasligi mumkin */
  }
}

/** Telegram tomonidan imzolangan ma'lumot (server tekshiradi). */
export function getInitData() {
  return webApp?.initData || '';
}

/**
 * VAQTINCHALIK — nosozlikni topish uchun. Muammo hal bo'lgach o'chiriladi.
 * Faqat maydon nomlarini ko'rsatadi, qiymatlarini emas (imzo sir qoladi).
 */
export function getDiagnostics() {
  const initData = webApp?.initData || '';

  let fields = '—';
  try {
    if (initData) fields = Array.from(new URLSearchParams(initData).keys()).join(', ');
  } catch (_error) {
    fields = '?';
  }

  return {
    'window.Telegram': typeof window !== 'undefined' && window.Telegram ? 'bor' : "YO'Q",
    WebApp: webApp ? 'bor' : "YO'Q",
    versiya: webApp?.version || '—',
    platforma: webApp?.platform || '—',
    'initData uzunligi': String(initData.length),
    maydonlar: fields,
  };
}

/** Telegram foydalanuvchisi (faqat ko'rsatish uchun). */
export function getTelegramUser() {
  return webApp?.initDataUnsafe?.user || null;
}

/** Yengil tebranish — tugma bosilganda. */
export function haptic(type = 'light') {
  try {
    if (type === 'success' || type === 'error' || type === 'warning') {
      webApp?.HapticFeedback?.notificationOccurred(type);
    } else {
      webApp?.HapticFeedback?.impactOccurred(type);
    }
  } catch (_error) {
    /* ahamiyatsiz */
  }
}

/** Telegramning yuqoridagi "orqaga" tugmasi. */
export function setBackButton(visible, handler) {
  const backButton = webApp?.BackButton;
  if (!backButton) return () => {};

  if (!visible) {
    backButton.hide();
    return () => {};
  }

  backButton.show();
  backButton.onClick(handler);

  return () => {
    backButton.offClick(handler);
    backButton.hide();
  };
}

/** Ilovani yopish. */
export function closeApp() {
  try {
    webApp?.close();
  } catch (_error) {
    /* ahamiyatsiz */
  }
}

/** Tashqi havolani ochish. */
export function openLink(url) {
  try {
    if (webApp?.openLink) webApp.openLink(url);
    else window.open(url, '_blank', 'noopener');
  } catch (_error) {
    window.open(url, '_blank', 'noopener');
  }
}

export default webApp;
