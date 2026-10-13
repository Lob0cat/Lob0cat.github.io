const header = document.getElementById('main-header');
const panel  = document.getElementById('project-detail-panel');
const btn    = document.getElementById('sidebar-toggle');

function setCollapsed(collapsed) {
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  btn.textContent = collapsed ? 'Show list' : 'Hide list';
  btn.setAttribute('aria-expanded', String(!collapsed));
}

btn.addEventListener('click', () => {
  document.body.classList.add('toggling');
  setCollapsed(!document.body.classList.contains('sidebar-collapsed'));
  setTimeout(() => document.body.classList.remove('toggling'), 900);
});

// Detaydan çıkılınca (state-detail gidince) menüyü otomatik sıfırla
new MutationObserver(() => {
  if (!header.classList.contains('state-detail')) setCollapsed(false);
}).observe(header, { attributes: true, attributeFilter: ['class'] });

// Panel genişleyince simülasyon canvas'ları yeni boyuta uyum sağlasın
panel.addEventListener('transitionend', (e) => {
  if (e.propertyName === 'width') window.dispatchEvent(new Event('resize'));
});