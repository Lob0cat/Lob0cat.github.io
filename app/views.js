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

export async function initWorks() {
  const res = await fetch('projects.json');
  const data = await res.json();
  allSections = data.sections; 
  
  showCategories();
  
  viewWorks.addEventListener('scroll', handleScrollSpy);
}

// ============= SCROLL RESET (Zıplamayı Önler) =============
function resetListScroll() {
  const listContainer = document.querySelector('.sticky-wrapper');
  if (listContainer) {
    listContainer.scrollTop = 0;
  }
}

// ============= ORTAK RENDER MOTORU =============
function renderList(items, type, categoryId = null, headerTitle = null) {
  // 1. ÖNCE SCROLL SIFIRLA
  resetListScroll();

  // 2. TEMİZLİK
  titlesList.innerHTML = '';
  document.getElementById('gallery-left').innerHTML = '';
  document.getElementById('gallery-right').innerHTML = '';

  // 3. GERİ BUTONU (Sadece Proje Listesi ise)
  if (type === 'projects') {
    const backBtn = document.createElement('div');
    backBtn.className = 'back-btn';
    backBtn.innerHTML = '← Main Menu';
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.hash = 'works';
    });
    titlesList.appendChild(backBtn);
  }

  // 4. BAŞLIK EKLE (Hizalama için gerekli)
  if (headerTitle) {
    const header = document.createElement('div');
    header.className = 'list-section-header';
    header.innerHTML = `<span>${headerTitle}</span>`;
    header.style.marginTop = '0';
    titlesList.appendChild(header);
  }

  // 5. LİSTE ELEMANLARI
  items.forEach((item, i) => {
    const titleItem = document.createElement('div');
    const isActive = (type === 'projects' && i === 0);
    titleItem.className = `title-item ${isActive ? 'active' : ''}`;
    titleItem.textContent = item.title;
    
    if (type === 'categories') {
      titleItem.onclick = () => window.location.hash = `works/${item.id}`;
    } else {
      titleItem.dataset.slug = item.slug;
      titleItem.onclick = () => window.location.hash = `works/${categoryId}/${item.slug}`;
    }
    titlesList.appendChild(titleItem);

    renderImages(item, i, type, categoryId);
  });
}

function renderImages(item, index, type, categoryId) {
  const num = (index + 1).toString().padStart(2, '0');
  const numEl = document.createElement('div');
  numEl.className = 'project-number';
  numEl.textContent = num;
  document.getElementById('gallery-left').appendChild(numEl);

  const spacer = document.createElement('div');
  spacer.className = 'spacer-number';
  document.getElementById('gallery-right').appendChild(spacer);

  const basePath = type === 'categories' 
    ? `images/${item.id}` 
    : `images/${categoryId}/${item.slug}`;
  const ext = item.format || 'webp';
  
  // IMAGE COUNT FIX
  let count = 6;
  if (item.imageCount !== undefined) {
    count = item.imageCount;
  }

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

// ============= ANA MENÜ (LEVEL 1) =============
export function showCategories() {
  currentCategory = null;
  resetListScroll();

  titlesList.innerHTML = '';
  document.getElementById('gallery-left').innerHTML = '';
  document.getElementById('gallery-right').innerHTML = '';
  
  let globalIndex = 0;

  allSections.forEach(section => {
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'list-section-header';
    sectionHeader.innerHTML = `<span>${section.title}</span><div class="line"></div>`;
    titlesList.appendChild(sectionHeader);

    section.categories.forEach(cat => {
      const titleItem = document.createElement('div');
      titleItem.className = 'title-item';
      titleItem.textContent = cat.title;
      titleItem.onclick = () => window.location.hash = `works/${cat.id}`;
      titlesList.appendChild(titleItem);

      renderImages(cat, globalIndex, 'categories');
      globalIndex++;
    });
  });
}

// ============= ALT MENÜ (LEVEL 2) =============
export function openCategory(categoryId) {
  if (currentCategory === categoryId) return;
  currentCategory = categoryId;

  let categoryData = null;
  for (const section of allSections) {
    const found = section.categories.find(c => c.id === categoryId);
    if (found) {
      categoryData = found;
      break;
    }
  }
  
  if (!categoryData) return;
  renderList(categoryData.projects, 'projects', categoryId, categoryData.title);
}

// ============= SCROLL SPY & AUTO SCROLL (THRESHOLD YÖNTEMİ) =============
function handleScrollSpy() {
  if (viewWorks.classList.contains('locked')) return;

  const markers = document.querySelectorAll('.project-number');
  const titleItems = Array.from(titlesList.querySelectorAll('.title-item')).filter(el => !el.classList.contains('back-btn'));
  const listContainer = document.querySelector('.sticky-wrapper'); 

  // --- YENİ MANTIK: THRESHOLD (EŞİK ÇİZGİSİ) ---
  // Ekranın tepesinden %35 aşağıda görünmez bir çizgi var.
  // Bir elemanın tepesi bu çizginin üzerine çıktığı an (altına girdiği an) aktif olur.
  // Bu yöntem "ikinci elemanı atlama" sorununu kesin çözer çünkü sırayla geçerler.
  const triggerLine = window.innerHeight * 0.35;
  
  // Varsayılan olarak 0. eleman aktiftir
  let activeIndex = 0;

  // Döngüyle kontrol et: Hangisi çizgiyi geçmiş?
  // activeIndex, çizgiyi geçen EN SON elemanın indexi olur.
  markers.forEach((marker, i) => {
    const rect = marker.getBoundingClientRect();
    if (rect.top < triggerLine) {
      activeIndex = i;
    }
  });

  // --- UÇ DURUM GÜVENLİĞİ ---
  // Eğer listenin en sonuna geldiysek, matematik ne derse desin sonuncuyu seç.
  const scrollPosition = viewWorks.scrollTop;
  const maxScroll = viewWorks.scrollHeight - viewWorks.clientHeight;
  if (scrollPosition >= maxScroll - 50) {
    activeIndex = markers.length - 1;
  }

  // --- CLASS GÜNCELLEME & AUTO SCROLL ---
  titleItems.forEach((item, i) => {
    if (i === activeIndex) {
      // Sadece DEĞİŞİKLİK olduğunda işlem yap (Performans ve Titreme Önleyici)
      if (!item.classList.contains('active')) {
        // Eski aktifi temizle
        titleItems.forEach(el => el.classList.remove('active'));
        
        // Yeni aktifi işaretle
        item.classList.add('active');
        
        // Auto Scroll (Clamp ile güvenli hale getirildi)
        if (listContainer) {
          let targetScroll = item.offsetTop - (listContainer.clientHeight / 2) + (item.clientHeight / 2);
          const maxListScroll = listContainer.scrollHeight - listContainer.clientHeight;
          
          // Hedefi sınırla (0 ile max arasında)
          targetScroll = Math.max(0, Math.min(targetScroll, maxListScroll));

          listContainer.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          });
        }
      }
    }
  });
}

// ============= DETAY AÇMA/KAPAMA =============
export async function openProjectDetail(categoryId, projectSlug) {
  const titleItems = Array.from(titlesList.querySelectorAll('.title-item'));
  titleItems.forEach(el => {
    if (el.dataset.slug === projectSlug) el.classList.add('active');
    else el.classList.remove('active');
  });

  const backBtn = titlesList.querySelector('.back-btn');
  if (backBtn) {
    backBtn.innerHTML = '← Back';
    backBtn.onclick = (e) => {
      e.stopPropagation();
      window.location.hash = `works/${categoryId}`;
    };
  }

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
  } catch (err) { detailPanel.innerHTML = '<p>Content not found.</p>'; }
}

export function closeProjectDetail() {
  detailPanel.classList.remove('active');
  detailPanel.innerHTML = '';
  unmount();

  document.querySelector('.zone-right').classList.remove('faded');
  viewWorks.classList.remove('locked');
  
  const backBtn = titlesList ? titlesList.querySelector('.back-btn') : null;
  if (backBtn) {
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