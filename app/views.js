import { mount, unmount } from './blocks.js';

let allSections = []; 
let currentCategory = null;

const viewWorks = document.getElementById('view-works');
const titlesList = document.getElementById('project-titles-list');
const galleryLeft = document.getElementById('gallery-left');
const galleryRight = document.getElementById('gallery-right');
const detailPanel = document.getElementById('project-detail-panel');

const staticContainers = {
  about: document.getElementById('about-content'),
  contact: document.getElementById('contact-content')
};

// MOBİL KONTROLÜ
const isMobile = () => window.innerWidth <= 768;

export async function initWorks() {
  const res = await fetch('projects.json');
  const data = await res.json();
  allSections = data.sections; 
  
  showCategories();
  
  viewWorks.addEventListener('scroll', handleScrollSpy);
}

function resetListScroll() {
  const listContainer = document.querySelector('.sticky-wrapper');
  if (listContainer) listContainer.scrollTop = 0;
  // Mobilde ana container da sıfırlanmalı
  if (isMobile()) window.scrollTo(0, 0);
}

// ============= ORTAK RENDER MOTORU =============
function renderList(items, type, categoryId = null, headerTitle = null) {
  resetListScroll();

  titlesList.innerHTML = '';
  document.getElementById('gallery-left').innerHTML = '';
  document.getElementById('gallery-right').innerHTML = '';

  // GERİ BUTONU
  if (type === 'projects') {
    const backBtn = document.createElement('div');
    backBtn.className = 'back-btn';
    backBtn.innerHTML = isMobile() ? '← Back' : '← Main Menu'; // Mobilde kısa text
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.hash = 'works';
    });
    titlesList.appendChild(backBtn);
  }

  // BAŞLIK
  if (headerTitle) {
    const header = document.createElement('div');
    header.className = 'list-section-header';
    header.innerHTML = `<span>${headerTitle}</span>`;
    header.style.marginTop = '0';
    titlesList.appendChild(header);
  }

  // LİSTE ELEMANLARI
  items.forEach((item, i) => {
    // 1. Başlık Kutusu
    const titleContainer = document.createElement('div');
    titleContainer.className = 'mobile-card'; // Mobil için kapsayıcı

    // 2. Başlık Metni
    const titleItem = document.createElement('div');
    const isActive = (type === 'projects' && i === 0);
    titleItem.className = `title-item ${isActive ? 'active' : ''}`;
    titleItem.textContent = item.title;
    
    const goLink = () => {
      if (type === 'categories') window.location.hash = `works/${item.id}`;
      else window.location.hash = `works/${categoryId}/${item.slug}`;
    };

    titleItem.onclick = goLink;
    titleContainer.appendChild(titleItem);

    // 3. MOBİL İSE: Resimleri hemen buraya ekle
    if (isMobile()) {
       // Mobilde her projeden sadece 1 tane temsilci resim gösterelim (Daha temiz olur)
       // İstersen döngüyle hepsini de basabilirsin.
       renderMobileImages(item, type, categoryId, titleContainer);
    } 
    
    titlesList.appendChild(titleContainer);

    // 4. DESKTOP İSE: Resimleri yanlara at (Eski düzen)
    if (!isMobile()) {
      renderImages(item, i, type, categoryId);
    }
  });
}

// Masaüstü Resim Render (Yanlar)
function renderImages(item, index, type, categoryId) {
  const num = (index + 1).toString().padStart(2, '0');
  const numEl = document.createElement('div');
  numEl.className = 'project-number';
  numEl.textContent = num;
  document.getElementById('gallery-left').appendChild(numEl);

  const spacer = document.createElement('div');
  spacer.className = 'spacer-number';
  document.getElementById('gallery-right').appendChild(spacer);

  const basePath = type === 'categories' ? `images/${item.id}` : `images/${categoryId}/${item.slug}`;
  const ext = item.format || 'webp';
  let count = (item.imageCount !== undefined) ? item.imageCount : 6;

  for (let j = 1; j <= count; j++) {
    const img = document.createElement('img');
    img.className = 'work-img';
    img.loading = 'lazy';
    img.src = `${basePath}/${j}.${ext}`;
    img.onclick = () => {
       if (type === 'categories') window.location.hash = `works/${item.id}`;
       else window.location.hash = `works/${categoryId}/${item.slug}`;
    };
    img.onerror = function() { this.style.display = 'none'; };

    if (j <= 2) document.getElementById('gallery-left').appendChild(img);
    else document.getElementById('gallery-right').appendChild(img);
  }
}

// Mobil Resim Render (Listenin İçi)
function renderMobileImages(item, type, categoryId, container) {
  const basePath = type === 'categories' ? `images/${item.id}` : `images/${categoryId}/${item.slug}`;
  const ext = item.format || 'webp';
  // Mobilde sadece ilk resmi gösterelim ki liste çok uzamasın
  // Eğer hepsini istersen count döngüsü kurabilirsin.
  const img = document.createElement('img');
  img.className = 'work-img mobile-img';
  img.loading = 'lazy';
  img.src = `${basePath}/1.${ext}`; // Sadece 1. resim
  
  img.onclick = () => {
      if (type === 'categories') window.location.hash = `works/${item.id}`;
      else window.location.hash = `works/${categoryId}/${item.slug}`;
  };
  img.onerror = function() { this.style.display = 'none'; };
  
  container.appendChild(img);
}


// ============= ANA MENÜ =============
export function showCategories() {
  currentCategory = null;
  resetListScroll();
  titlesList.innerHTML = '';
  
  // Desktop temizliği
  if(!isMobile()) {
      document.getElementById('gallery-left').innerHTML = '';
      document.getElementById('gallery-right').innerHTML = '';
  }

  let globalIndex = 0;

  allSections.forEach(section => {
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'list-section-header';
    sectionHeader.innerHTML = `<span>${section.title}</span><div class="line"></div>`;
    titlesList.appendChild(sectionHeader);

    section.categories.forEach(cat => {
        // RenderList mantığını burada manuel uyguluyoruz
        // Kapsayıcı
        const titleContainer = document.createElement('div');
        titleContainer.className = 'mobile-card';

        const titleItem = document.createElement('div');
        titleItem.className = 'title-item';
        titleItem.textContent = cat.title;
        titleItem.onclick = () => window.location.hash = `works/${cat.id}`;
        titleContainer.appendChild(titleItem);

        if (isMobile()) {
            renderMobileImages(cat, 'categories', null, titleContainer);
        }

        titlesList.appendChild(titleContainer);

        if (!isMobile()) {
            renderImages(cat, globalIndex, 'categories');
        }
        globalIndex++;
    });
  });
}

// ============= ALT MENÜ =============
export function openCategory(categoryId) {
  if (currentCategory === categoryId) return;
  currentCategory = categoryId;
  let categoryData = null;
  for (const section of allSections) {
    const found = section.categories.find(c => c.id === categoryId);
    if (found) { categoryData = found; break; }
  }
  if (!categoryData) return;
  renderList(categoryData.projects, 'projects', categoryId, categoryData.title);
}

// ============= SCROLL SPY (MOBİLDE KAPALI OLSUN) =============
function handleScrollSpy() {
  // Mobilde Auto-Scroll kafa karıştırır, kapatalım.
  if (isMobile()) return; 

  if (viewWorks.classList.contains('locked')) return;
  const markers = document.querySelectorAll('.project-number');
  const titleItems = Array.from(titlesList.querySelectorAll('.title-item')).filter(el => !el.classList.contains('back-btn'));
  const listContainer = document.querySelector('.sticky-wrapper'); 
  
  // Çizgiyi Geçen (Threshold) Yöntemi
  const triggerLine = window.innerHeight * 0.35;
  let activeIndex = 0;
  markers.forEach((marker, i) => {
    const rect = marker.getBoundingClientRect();
    if (rect.top < triggerLine) {
      activeIndex = i;
    }
  });

  const scrollPosition = viewWorks.scrollTop;
  const maxScroll = viewWorks.scrollHeight - viewWorks.clientHeight;
  if (scrollPosition >= maxScroll - 50) {
    activeIndex = markers.length - 1;
  }

  titleItems.forEach((item, i) => {
    if (i === activeIndex) {
      if (!item.classList.contains('active')) {
        titleItems.forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        if (listContainer) {
          let targetScroll = item.offsetTop - (listContainer.clientHeight / 2) + (item.clientHeight / 2);
          const maxListScroll = listContainer.scrollHeight - listContainer.clientHeight;
          targetScroll = Math.max(0, Math.min(targetScroll, maxListScroll));
          listContainer.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
      }
    }
  });
}

// ... Detay fonksiyonları aynı ...
export async function openProjectDetail(categoryId, projectSlug) {
  const titleItems = Array.from(titlesList.querySelectorAll('.title-item'));
  titleItems.forEach(el => {
    if (el.dataset.slug === projectSlug) el.classList.add('active');
    else el.classList.remove('active');
  });

  const backBtn = titlesList.querySelector('.back-btn');
  if (backBtn && !isMobile()) { // Mobilde detay açılınca geri butonu farklı davranabilir
     // Mobilde detay zaten tam ekran, buton detay panelinde olmalı.
  }
  if(backBtn && isMobile()) backBtn.style.display = 'none'; // Detay açılınca listedeki back butonunu gizle

  document.querySelector('.zone-right').classList.add('faded');
  viewWorks.classList.add('locked');
  detailPanel.classList.add('active');
  detailPanel.innerHTML = '<p style="margin-top:20px;">Loading...</p>';
  unmount();

  try {
    const res = await fetch(`content/${categoryId}/${projectSlug}.html`);
    if (!res.ok) throw new Error('Not found');
    const html = await res.text();
    detailPanel.innerHTML = html;
    mount(detailPanel);
    
    // Mobilde Detay Paneline Geri Butonu Ekle
    if(isMobile()){
        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '← Back';
        closeBtn.style.cssText = "position:fixed; top:20px; left:20px; font-weight:bold; cursor:pointer; z-index:999";
        closeBtn.onclick = () => {
             // Detayı kapatınca listeye dön
             if (currentCategory) window.location.hash = `works/${currentCategory}`;
             else window.location.hash = 'works';
        };
        detailPanel.prepend(closeBtn);
    }

  } catch (err) { detailPanel.innerHTML = '<p>Content not found.</p>'; }
}

export function closeProjectDetail() {
  detailPanel.classList.remove('active');
  detailPanel.innerHTML = '';
  unmount();
  document.querySelector('.zone-right').classList.remove('faded');
  viewWorks.classList.remove('locked');
  
  const backBtn = titlesList ? titlesList.querySelector('.back-btn') : null;
  if(backBtn && isMobile()) backBtn.style.display = 'flex'; // Geri getir

  // Desktop butonu reset
  if (backBtn && !isMobile()) {
    backBtn.innerHTML = '← Main Menu';
    backBtn.onclick = (e) => {
      e.stopPropagation();
      window.location.hash = 'works';
    };
  }
  handleScrollSpy();
}

export async function loadStaticView(viewName) {
  const container = staticContainers[viewName];
  if (!container || container.innerHTML.trim() !== '') return;
  try {
    const res = await fetch(`content/${viewName}.html`);
    if (res.ok) {
      container.innerHTML = await res.text();
      mount(container);
    }
  } catch (e) { console.error(e); }
}

export function destroyWorks() { 
  viewWorks.removeEventListener('scroll', handleScrollSpy);
  unmount(); 
}
