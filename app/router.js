import { initWorks, loadStaticView, openProjectDetail, closeProjectDetail, openCategory, showCategories } from './views.js';

const header = document.getElementById('main-header');
const navItems = document.querySelectorAll('.nav-item');
const views = {
  works: document.getElementById('view-works'),
  about: document.getElementById('view-about'),
  contact: document.getElementById('view-contact')
};
const detailPanel = document.getElementById('project-detail-panel');

export async function init() {
  await initWorks();
  
  navItems.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view === 'works') window.location.hash = 'works';
      else window.location.hash = view;
    });
  });

  window.addEventListener('hashchange', handleHash);
  setTimeout(handleHash, 50);
}

async function handleHash() {
  // URL Yapısı: #works / kategori / proje
  const hash = window.location.hash.slice(1) || 'works';
  const parts = hash.split('/'); 
  const mainView = parts[0]; // works
  const categoryId = parts[1]; // physics
  const projectSlug = parts[2]; // orage

  // 1. HEADER STATE
  // Detay modu sadece proje seçiliyse aktiftir
  const isDetailMode = (mainView === 'works' && projectSlug);
  updateHeader(mainView, isDetailMode);

  // 2. VIEW RESET
  Object.values(views).forEach(el => el.classList.remove('active'));
  
  // 3. İÇERİK YÖNETİMİ
  if (mainView === 'works') {
    views.works.classList.add('active');
    
    // Senaryo A: Proje Detayı (#works/physics/orage)
    if (projectSlug && categoryId) {
      // Önce kategoriyi yükle (eğer yüklü değilse)
      openCategory(categoryId); 
      // Sonra detayı aç
      await openProjectDetail(categoryId, projectSlug);
    } 
    // Senaryo B: Kategori İçi Liste (#works/physics)
    else if (categoryId) {
      closeProjectDetail(); // Detay varsa kapat
      openCategory(categoryId); // O kategorinin projelerini listele
    }
    // Senaryo C: Ana Kategori Listesi (#works)
    else {
      closeProjectDetail();
      showCategories(); // En başa dön (Kategori Listesi)
    }
  } 
  else if (mainView === 'about' || mainView === 'contact') {
    closeProjectDetail();
    await loadStaticView(mainView);
    views[mainView].classList.add('active');
  }
}

function updateHeader(view, isDetail) {
  header.classList.remove('state-works', 'state-about', 'state-contact', 'state-detail');
  header.classList.add(`state-${view}`);
  
  if (isDetail) header.classList.add('state-detail');

  navItems.forEach(nav => {
    if (nav.dataset.view === view) nav.classList.add('active');
    else nav.classList.remove('active');
  });
}

init();