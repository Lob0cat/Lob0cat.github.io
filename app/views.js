import { mount, unmount } from './blocks.js';
import { t, getLang, DEFAULT_LANG, localTitle } from './i18n.js';

let allSections = [];
let currentCategory = null;
let currentDetail = null;   // açık detay: { categoryId, slug }
let detailRequest = 0;      // en son geçerli detay isteğinin numarası

const viewWorks = document.getElementById('view-works');
const titlesList = document.getElementById('project-titles-list');
const galleryLeft = document.getElementById('gallery-left');
const galleryRight = document.getElementById('gallery-right');
const detailPanel = document.getElementById('project-detail-panel');

const staticContainers = {
  about: document.getElementById('about-content'),
  contact: document.getElementById('contact-content')
};

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

// Kategori id'sinden section + kategori bulur
function findCategory(categoryId) {
  for (const section of allSections) {
    const category = section.categories.find(c => c.id === categoryId);
    if (category) return { section, category };
  }
  return null;
}

// ============= RENDER MOTORU =============
function renderList(items, type, categoryId = null, headerData = null) {
  resetListScroll();

  titlesList.innerHTML = '';
  galleryLeft.innerHTML = '';
  galleryRight.innerHTML = '';

  // Mobil geri butonu (CSS'te sol üstte sabit)
  if (type === 'projects' && isMobile()) {
    const mobileBackBtn = document.createElement('div');
    mobileBackBtn.className = 'mobile-back-btn';
    mobileBackBtn.dataset.i18n = 'back';
    mobileBackBtn.textContent = t('back');
    mobileBackBtn.onclick = (e) => { e.stopPropagation(); window.location.hash = 'works'; };
    galleryLeft.appendChild(mobileBackBtn);
  }

  // Masaüstü geri butonu
  if (type === 'projects' && !isMobile()) {
    const backBtn = document.createElement('div');
    backBtn.className = 'back-btn';
    backBtn.dataset.i18n = 'backMain';
    backBtn.textContent = t('backMain');
    backBtn.onclick = (e) => { e.stopPropagation(); window.location.hash = 'works'; };
    titlesList.appendChild(backBtn);
  }

  // Kategori başlığı (masaüstü)
  if (headerData && !isMobile()) {
    const header = document.createElement('div');
    header.className = 'list-section-header';
    header._data = headerData;
    const label = document.createElement('span');
    label.textContent = localTitle(headerData);
    header.appendChild(label);
    header.style.marginTop = '0';
    titlesList.appendChild(header);
  }

  items.forEach((item, i) => {
    const titleItem = document.createElement('div');
    titleItem.className = `title-item ${i === 0 ? 'active' : ''}`;
    titleItem._data = item;                       // dil değişince yeniden yazmak için
    titleItem.textContent = localTitle(item);
    titleItem.dataset.slug = item.slug;

    titleItem.onclick = () => {
      if (type === 'categories') window.location.hash = `works/${item.id}`;
      else window.location.hash = `works/${categoryId}/${item.slug}`;
    };
    titleItem.id = `nav-${type}-${i}`;
    titlesList.appendChild(titleItem);

    if (isMobile()) renderMobileImages(item, i, type, categoryId);
    else renderDesktopImages(item, i, type, categoryId);
  });

  if (isMobile()) setTimeout(handleMobileScrollSpy, 100);
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
  const count = (item.imageCount !== undefined) ? item.imageCount : 6;

  if (count > 0) {
    const img = document.createElement('img');
    img.className = 'work-img';
    img.src = `${basePath}/1.${ext}`;
    img.loading = 'lazy';
    img.onclick = () => {
      if (type === 'categories') window.location.hash = `works/${item.id}`;
      else window.location.hash = `works/${categoryId}/${item.slug}`;
    };
    img.onerror = function () { this.style.display = 'none'; };
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
  const count = (item.imageCount !== undefined) ? item.imageCount : 6;

  for (let j = 1; j <= count; j++) {
    const img = document.createElement('img');
    img.className = 'work-img';
    img.loading = 'lazy';
    img.src = `${basePath}/${j}.${ext}`;
    img.onclick = () => {
      if (type === 'categories') window.location.hash = `works/${item.id}`;
      else window.location.hash = `works/${categoryId}/${item.slug}`;
    };
    img.onerror = function () { this.style.display = 'none'; };

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
    if (!isMobile()) {
      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'list-section-header';
      sectionHeader._data = section;
      const label = document.createElement('span');
      label.textContent = localTitle(section);
      const line = document.createElement('div');
      line.className = 'line';
      sectionHeader.append(label, line);
      titlesList.appendChild(sectionHeader);
    }

    section.categories.forEach(cat => {
      const titleItem = document.createElement('div');
      titleItem.className = 'title-item';
      titleItem._data = cat;
      titleItem.textContent = localTitle(cat);
      titleItem.dataset.slug = cat.id;

      titleItem.onclick = () => window.location.hash = `works/${cat.id}`;
      titleItem.id = `nav-categories-${globalIndex}`;
      titlesList.appendChild(titleItem);

      if (isMobile()) renderMobileImages(cat, globalIndex, 'categories');
      else renderDesktopImages(cat, globalIndex, 'categories');
      globalIndex++;
    });
  });
}

export function openCategory(categoryId) {
  if (currentCategory === categoryId) return;
  const found = findCategory(categoryId);
  if (!found) return;
  currentCategory = categoryId;
  renderList(found.category.projects, 'projects', categoryId, found.category);
}

// ============= SCROLL SPY =============
function handleMobileScrollSpy() {
  const wrappers = document.querySelectorAll('.mobile-project-wrapper');
  let activeIndex = 0;
  const triggerLine = window.innerHeight * 0.50;

  wrappers.forEach(wrapper => {
    const rect = wrapper.getBoundingClientRect();
    if (rect.top < triggerLine) activeIndex = parseInt(wrapper.dataset.index);
  });

  const navItems = document.querySelectorAll('#project-titles-list .title-item');
  navItems.forEach((item, i) => {
    if (i === activeIndex) {
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

// ============= İÇERİK YÜKLEME (dil destekli) =============
// basePath: "content/WRITINGS/music/album-ratings" (uzantısız)
// Türkçe seçiliyse önce "<basePath>.tr.html" denenir, yoksa ana dosyaya düşülür.
async function fetchContent(basePath) {
  const lang = getLang();

  if (lang !== DEFAULT_LANG) {
    const res = await fetch(`${basePath}.${lang}.html`);
    if (res.ok) return { html: await res.text(), translated: true };
  }

  const res = await fetch(`${basePath}.html`);
  if (!res.ok) throw new Error(`${res.status} → ${basePath}.html`);
  return { html: await res.text(), translated: lang === DEFAULT_LANG };
}

// ============= DETAY AÇMA/KAPAMA =============
export async function openProjectDetail(categoryId, projectSlug) {
  const requestId = ++detailRequest;
  currentDetail = { categoryId, slug: projectSlug };

  // Menüde ilgili projeyi aktif yap
  const titleItems = Array.from(titlesList.querySelectorAll('.title-item'));
  titleItems.forEach(el => {
    if (el.dataset.slug === projectSlug) {
      el.classList.add('active');
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      el.classList.remove('active');
    }
  });

  document.querySelector('.zone-right').classList.add('faded');
  viewWorks.classList.add('locked');
  detailPanel.classList.add('active');
  detailPanel.innerHTML = `<p style="margin-top:20px;">${t('loading')}</p>`;
  unmount();

  const found = findCategory(categoryId);
  if (!found) {
    detailPanel.innerHTML = `<p>${t('notFound')}</p>`;
    return;
  }

  try {
    const { html, translated } = await fetchContent(
      `content/${found.section.title}/${categoryId}/${projectSlug}`
    );

    // Bu arada başka sayfaya geçildiyse sonucu çöpe at
    if (requestId !== detailRequest) return;

    const note = translated ? '' : `<p class="lang-note">${t('noTranslation')}</p>`;
    detailPanel.innerHTML = note + html;

    if (isMobile()) {
      const closeBtn = document.createElement('div');
      closeBtn.className = 'mobile-detail-back';
      closeBtn.dataset.i18n = 'back';
      closeBtn.textContent = t('back');
      closeBtn.onclick = () => {
        window.location.hash = currentCategory ? `works/${currentCategory}` : 'works';
      };
      detailPanel.prepend(closeBtn);
    }

    mount(detailPanel);
  } catch (err) {
    if (requestId !== detailRequest) return;
    console.warn('Detay yüklenemedi:', err.message);
    detailPanel.innerHTML = `<p>${t('notFound')}</p>`;
  }
}

export function closeProjectDetail() {
  detailRequest++;           // bekleyen istek varsa geçersiz say
  currentDetail = null;
  detailPanel.classList.remove('active');
  detailPanel.innerHTML = '';
  unmount();
  document.querySelector('.zone-right').classList.remove('faded');
  viewWorks.classList.remove('locked');

  if (isMobile()) handleMobileScrollSpy();
  else handleDesktopScrollSpy();
}

// About / Contact: dil başına bir kez yüklenir
export async function loadStaticView(viewName) {
  const container = staticContainers[viewName];
  if (!container) return;

  const lang = getLang();
  if (container.dataset.lang === lang) return;   // zaten bu dilde yüklü

  try {
    const { html } = await fetchContent(`content/${viewName}`);
    unmount();
    container.innerHTML = html;
    container.dataset.lang = lang;
    mount(container);
  } catch (e) { console.error(e); }
}

// ============= DİL DEĞİŞİNCE =============
function refreshLabels() {
  titlesList.querySelectorAll('.title-item, .list-section-header').forEach(el => {
    if (!el._data) return;
    const label = el.classList.contains('title-item') ? el : el.querySelector('span');
    if (label) label.textContent = localTitle(el._data);
  });
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
}

window.addEventListener('langchange', () => {
  refreshLabels();

  // Açık proje detayı varsa yeni dilde yeniden yükle
  if (currentDetail) openProjectDetail(currentDetail.categoryId, currentDetail.slug);

  // Açık About/Contact varsa yeniden yükle (kapalı olanlar açılırken yüklenir)
  Object.entries(staticContainers).forEach(([name, el]) => {
    const view = el.closest('.view');
    if (view && view.classList.contains('active')) loadStaticView(name);
  });
});

export function destroyWorks() {
  if (isMobile()) {
    const leftZone = document.querySelector('.zone-left');
    if (leftZone) leftZone.removeEventListener('scroll', handleMobileScrollSpy);
  } else {
    viewWorks.removeEventListener('scroll', handleDesktopScrollSpy);
  }
  unmount();
}