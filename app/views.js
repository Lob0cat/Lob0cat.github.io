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

// Mobil Algılama
const isMobile = () => window.innerWidth <= 768;

export async function initWorks() {
  const res = await fetch('projects.json');
  const data = await res.json();
  allSections = data.sections; 
  
  showCategories();
  
  if (isMobile()) {
    const leftZone = document.querySelector('.zone-left');
    if (leftZone) leftZone.addEventListener('scroll', handleMobileScrollSpy);
  } else {
    viewWorks.addEventListener('scroll', handleDesktopScrollSpy);
  }
  
  window.addEventListener('resize', () => {
     // İsteğe bağlı: window.location.reload(); 
  });
}

function resetListScroll() {
  const listContainer = document.querySelector('.sticky-wrapper');
  if (listContainer) listContainer.scrollTop = 0;
  
  if (isMobile()) {
    const leftZone = document.querySelector('.zone-left');
    if (leftZone) leftZone.scrollTop = 0;
  } else {
    viewWorks.scrollTop = 0;
  }
}

// ============= RENDER MOTORU =============
function renderList(items, type, categoryId = null, headerTitle = null) {
  resetListScroll();

  titlesList.innerHTML = '';
  galleryLeft.innerHTML = '';
  galleryRight.innerHTML = '';

  // Mobil Geri Butonu
  if (type === 'projects' && isMobile()) {
    const mobileBackBtn = document.createElement('div');
    mobileBackBtn.className = 'mobile-back-btn'; 
    mobileBackBtn.innerHTML = '← Back';
    mobileBackBtn.style.marginBottom = '2rem';
    mobileBackBtn.style.fontWeight = '700';
    mobileBackBtn.style.cursor = 'pointer';
    mobileBackBtn.onclick = (e) => { 
        e.stopPropagation(); 
        window.location.hash = 'works'; 
    };
    galleryLeft.appendChild(mobileBackBtn);
  }

  // Desktop Geri Butonu
  if (type === 'projects' && !isMobile()) {
    const backBtn = document.createElement('div');
    backBtn.className = 'back-btn';
    backBtn.innerHTML = '← Main Menu';
    backBtn.onclick = (e) => { e.stopPropagation(); window.location.hash = 'works'; };
    titlesList.appendChild(backBtn);
  }

  // Başlık
  if (headerTitle && !isMobile()) {
    const header = document.createElement('div');
    header.className = 'list-section-header';
    header.innerHTML = `<span>${headerTitle}</span>`;
    header.style.marginTop = '0';
    titlesList.appendChild(header);
  }

  items.forEach((item, i) => {
    const titleItem = document.createElement('div');
    titleItem.className = `title-item ${i===0 ? 'active' : ''}`;
    titleItem.textContent = item.title;
    
    const goLink = () => {
      if (type === 'categories') window.location.hash = `works/${item.id}`;
      else window.location.hash = `works/${categoryId}/${item.slug}`;
    };
    titleItem.onclick = goLink;
    titleItem.id = `nav-${type}-${i}`;
    titlesList.appendChild(titleItem);

    if (isMobile()) {
       renderMobileImages(item, i, type, categoryId);
    } else {
       renderDesktopImages(item, i, type, categoryId);
    }
  });
  
  if(isMobile()) setTimeout(handleMobileScrollSpy, 100);
}

function renderMobileImages(item, index, type, categoryId) {
  const container = document.getElementById('gallery-left');
  const num = (index + 1).toString().padStart(2, '0');
  
  const wrapper = document.createElement('div');
  wrapper.className = 'mobile-project-wrapper';
  wrapper.dataset.index = index;
  
  const label = document.createElement('div');
  label.className = 'project-number';
  label.textContent = num; 
  wrapper.appendChild(label);

  const basePath = type === 'categories' ? `images/${item.id}` : `images/${categoryId}/${item.slug}`;
  const ext = item.format || 'webp';
  let count = (item.imageCount !== undefined) ? item.imageCount : 6;
  
  if(count > 0) {
      const img = document.createElement('img');
      img.className = 'work-img';
      img.src = `${basePath}/1.${ext}`;
      img.loading = 'lazy';
      img.onclick = () => {
         if (type === 'categories') window.location.hash = `works/${item.id}`;
         else window.location.hash = `works/${categoryId}/${item.slug}`;
      };
      img.onerror = function() { this.style.display = 'none'; };
      wrapper.appendChild(img);
  }
  container.appendChild(wrapper);
}

function renderDesktopImages(item, index, type, categoryId) {
  const num = (index + 1).toString().padStart(2, '0');
  const numEl = document.createElement('div');
  numEl.className = 'project-number';
  numEl.textContent = num;
  galleryLeft.appendChild(numEl);

  const spacer = document.createElement('div');
  spacer.className = 'spacer-number';
  galleryRight.appendChild(spacer);

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

    if (j <= 2) galleryLeft.appendChild(img);
    else galleryRight.appendChild(img);
  }
}

export function showCategories() {
  currentCategory = null;
  resetListScroll();
  titlesList.innerHTML = '';
  galleryLeft.innerHTML = '';
  galleryRight.innerHTML = '';

  let globalIndex = 0;

  allSections.forEach(section => {
    if(!isMobile()) {
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'list-section-header';
        sectionHeader.innerHTML = `<span>${section.title}</span><div class="line"></div>`;
        titlesList.appendChild(sectionHeader);
    }

    section.categories.forEach(cat => {
      const titleItem = document.createElement('div');
      titleItem.className = 'title-item';
      titleItem.textContent = cat.title;
      titleItem.onclick = () => window.location.hash = `works/${cat.id}`;
      titleItem.id = `nav-categories-${globalIndex}`;
      titlesList.appendChild(titleItem);

      if(isMobile()) {
          renderMobileImages(cat, globalIndex, 'categories');
      } else {
          renderDesktopImages(cat, globalIndex, 'categories');
      }
      globalIndex++;
    });
  });
}

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

// ============= MOBİL SCROLL SPY (ORTADAN TETİKLENİR) =============
function handleMobileScrollSpy() {
  const wrappers = document.querySelectorAll('.mobile-project-wrapper');
  let activeIndex = 0;
  
  // === GÜNCELLEME: Tetikleyici Tam Ortada (0.5) ===
  const triggerLine = window.innerHeight * 0.50;
  
  wrappers.forEach(wrapper => {
      const rect = wrapper.getBoundingClientRect();
      // Eleman ortadaki çizgiyi geçtiyse (yukarı doğru) aktif yap
      if(rect.top < triggerLine) {
          activeIndex = parseInt(wrapper.dataset.index);
      }
  });

  const navItems = document.querySelectorAll('#project-titles-list .title-item');
  navItems.forEach((item, i) => {
      if(i === activeIndex) {
          if (!item.classList.contains('active')) {
             item.classList.add('active');
             item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
      } else {
          item.classList.remove('active');
      }
  });
}

function handleDesktopScrollSpy() {
  if (viewWorks.classList.contains('locked')) return;
  const markers = document.querySelectorAll('.project-number');
  const titleItems = Array.from(titlesList.querySelectorAll('.title-item')).filter(el => !el.classList.contains('back-btn'));
  const listContainer = document.querySelector('.sticky-wrapper'); 

  const triggerLine = window.innerHeight * 0.35;
  let activeIndex = 0;
  
  markers.forEach((marker, i) => {
    const rect = marker.getBoundingClientRect();
    if (rect.top < triggerLine) activeIndex = i;
  });

  const scrollPosition = viewWorks.scrollTop;
  const maxScroll = viewWorks.scrollHeight - viewWorks.clientHeight;
  if (scrollPosition >= maxScroll - 50) activeIndex = markers.length - 1;

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

export async function openProjectDetail(categoryId, projectSlug) {
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
    
    if(isMobile()) {
       const closeBtn = document.createElement('div');
       closeBtn.innerHTML = '← Back';
       closeBtn.style.cssText = "position:fixed; top:20px; left:20px; font-weight:700; z-index:999; cursor:pointer;";
       closeBtn.onclick = () => {
           if(currentCategory) window.location.hash = `works/${currentCategory}`;
           else window.location.hash = 'works';
       };
       detailPanel.prepend(closeBtn);
    }
    
    mount(detailPanel);
  } catch (err) { detailPanel.innerHTML = '<p>Content not found.</p>'; }
}

export function closeProjectDetail() {
  detailPanel.classList.remove('active');
  detailPanel.innerHTML = '';
  unmount();
  document.querySelector('.zone-right').classList.remove('faded');
  viewWorks.classList.remove('locked');
  
  if (isMobile()) handleMobileScrollSpy();
  else handleDesktopScrollSpy();
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
  if(isMobile()) {
      const leftZone = document.querySelector('.zone-left');
      if (leftZone) leftZone.removeEventListener('scroll', handleMobileScrollSpy);
  } else {
      viewWorks.removeEventListener('scroll', handleDesktopScrollSpy);
  }
  unmount(); 
}
