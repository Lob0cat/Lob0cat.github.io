const STORAGE_KEY = 'lang';
export const LANGS = ['en', 'tr'];
export const DEFAULT_LANG = 'en';   // content/ altındaki ana dosyaların dili

const dict = {
  en: {
    loading: 'Loading...',
    back: '← Back',
    backMain: '← Main Menu',
    notFound: 'Content not found.',
    hideList: '← Hide list',
    showList: '→ Show list',
    noTranslation: 'This page is not available in English yet. Showing the original.'
  },
  tr: {
    loading: 'Yükleniyor...',
    back: '← Geri',
    backMain: '← Ana Menü',
    notFound: 'İçerik bulunamadı.',
    hideList: '← Listeyi gizle',
    showList: '→ Listeyi göster',
    noTranslation: 'Bu sayfanın Türkçesi henüz hazır değil, orijinal sürüm gösteriliyor.'
  }
};

function readInitial() {
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch {}
  return LANGS.includes(saved) ? saved : DEFAULT_LANG;
}

let current = readInitial();
document.documentElement.lang = current;

export function getLang() { return current; }

export function setLang(lang) {
  if (!LANGS.includes(lang) || lang === current) return;
  current = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  document.documentElement.lang = lang;
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

// Arayüz yazısı
export function t(key) {
  return dict[current]?.[key] ?? dict[DEFAULT_LANG]?.[key] ?? key;
}

// projects.json başlığı: ana dilde "title", diğer dilde "title_tr" (yoksa "title")
export function localTitle(item) {
  if (current !== DEFAULT_LANG) {
    const v = item['title_' + current];
    if (v) return v;
  }
  return item.title;
}