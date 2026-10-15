import { t } from './i18n.js';

const header = document.getElementById('main-header');
const panel  = document.getElementById('project-detail-panel');
const btn    = document.getElementById('sidebar-toggle');

function paint() {
  const collapsed = document.body.classList.contains('sidebar-collapsed');
  btn.textContent = t(collapsed ? 'showList' : 'hideList');
  btn.setAttribute('aria-expanded', String(!collapsed));
}

function setCollapsed(collapsed) {
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  paint();
}

btn.addEventListener('click', () => {
  document.body.classList.add('toggling');
  setCollapsed(!document.body.classList.contains('sidebar-collapsed'));
  setTimeout(() => document.body.classList.remove('toggling'), 900);
});

// Detaydan çıkılınca menüyü otomatik sıfırla
new MutationObserver(() => {
  if (!header.classList.contains('state-detail')) setCollapsed(false);
}).observe(header, { attributes: true, attributeFilter: ['class'] });

// Panel genişleyince simülasyon canvas'ları uyum sağlasın
panel.addEventListener('transitionend', (e) => {
  if (e.propertyName === 'width') window.dispatchEvent(new Event('resize'));
});

window.addEventListener('langchange', paint);
paint();