import { getLang, setLang } from './i18n.js';

const btn = document.getElementById('lang-toggle');
const spans = btn.querySelectorAll('[data-lang]');

function paint() {
  const lang = getLang();
  spans.forEach(s => s.classList.toggle('on', s.dataset.lang === lang));
  btn.setAttribute('aria-label', lang === 'en' ? 'Switch to Turkish' : 'İngilizceye geç');
}

btn.addEventListener('click', () => setLang(getLang() === 'en' ? 'tr' : 'en'));
window.addEventListener('langchange', paint);
paint();