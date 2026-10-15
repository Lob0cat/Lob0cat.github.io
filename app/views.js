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
  resetMediaObserver();

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


function goTo(item, type, categoryId) {
  window.location.hash = type === 'categories'
    ? `works/${item.id}`
    : `works/${categoryId}/${item.slug}`;
}


// ============= MEDYA YARDIMCILARI =============
// Menüde kullanılacak oranlar. Ekle/çıkar serbest.
// Bir oranı iki kere yazarsan o oran daha sık çıkar.
const RATIOS = ['1/1', '4/3', '3/4', '16/9', '9/16'];

const VIDEO_RE = /\.(mp4|webm)$/i;

// Videolar sadece ekrandayken yüklenir ve oynar
const mediaObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const v = entry.target;
    if (entry.isIntersecting) {
      if (!v.getAttribute('src')) v.src = v.dataset.src;   // ilk görünüşte yükle
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  });
}, { rootMargin: '200px' });

function resetMediaObserver() { mediaObserver.disconnect(); }

// Dosya yolundan sabit (her ziyarette aynı) bir sayı üretir
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Bir öğenin görsel listesi: [{ url, ratio? }, ...]
// "media" varsa onu kullanır, yoksa eski usul 1.webp, 2.webp... üretir
function getMediaList(item, basePath) {
  if (Array.isArray(item.media)) {
    return item.media.map(m => {
      const o = typeof m === 'string' ? { src: m } : m;
      return { url: `${basePath}/${o.src}`, ratio: o.ratio };
    });
  }
  const ext = item.format || 'webp';
  const count = (item.imageCount !== undefined) ? item.imageCount : 6;
  return Array.from({ length: count }, (_, i) => ({ url: `${basePath}/${i + 1}.${ext}` }));
}

// Her öğe için bir oran seçici üretir (yan yana aynı oran gelmesin diye önceki oranı hatırlar)
function makeRatioPicker(item) {
  let prev = null;
  return (index, media) => {
    if (media.ratio) return media.ratio;                                   // 1. görselin kendi oranı
    if (Array.isArray(item.frames) && item.frames.length)                  // 2. sıralı liste
      return item.frames[index % item.frames.length];
    if (item.frame) return item.frame;                                     // 3. tek sabit oran

    let r = RATIOS[hashString(media.url) % RATIOS.length];                 // 4. otomatik çeşitlilik
    if (r === prev) r = RATIOS[(RATIOS.indexOf(r) + 1) % RATIOS.length];
    prev = r;
    return r;
  };
}

// Gri çerçeve + içinde kırpılmayan resim/video
function createFrame(item, url, ratio, onClick) {
  const frame = document.createElement('div');
  frame.className = 'work-frame';
  frame.style.aspectRatio = ratio;

  let el;
  if (VIDEO_RE.test(url)) {
    el = document.createElement('video');
    el.muted = true;                       // otomatik oynatma için şart
    el.setAttribute('muted', '');
    el.loop = true;
    el.playsInline = true;
    el.setAttribute('playsinline', '');
    el.preload = 'none';
    el.dataset.src = url;
    mediaObserver.observe(el);
  } else {
    el = document.createElement('img');
    el.loading = 'lazy';
    el.alt = localTitle(item);
    el.src = url;
  }
  el.onerror = () => { frame.style.display = 'none'; };   // dosya yoksa gizle

  frame.appendChild(el);
  frame.onclick = onClick;
  return frame;
}

function renderMobileImages(item, index, type, categoryId) {
  const container = document.getElementById('gallery-left');

  const wrapper = document.createElement('div');
  wrapper.className = 'mobile-project-wrapper';
  wrapper.dataset.index = index;

  const label = document.createElement('div');
  label.className = 'project-number';
  label.textContent = String(index + 1).padStart(2, '0');
  wrapper.appendChild(label);

  const basePath = type === 'categories' ? `images/${item.id}` : `images/${categoryId}/${item.slug}`;
  const list = getMediaList(item, basePath);

  if (list.length > 0) {
    const pick = makeRatioPicker(item);
    wrapper.appendChild(
      createFrame(item, list[0].url, pick(0, list[0]), () => goTo(item, type, categoryId))
    );
  }
  container.appendChild(wrapper);
}

function renderDesktopImages(item, index, type, categoryId) {
  const row = document.createElement('div');
  row.className = 'project-row';

  const numEl = document.createElement('div');
  numEl.className = 'project-number';
  numEl.textContent = String(index + 1).padStart(2, '0');
  row.appendChild(numEl);

  const basePath = type === 'categories' ? `images/${item.id}` : `images/${categoryId}/${item.slug}`;
  const list = getMediaList(item, basePath);
  const pick = makeRatioPicker(item);

  list.forEach((media, i) => {
    const j = i + 1;
    const frame = createFrame(item, media.url, pick(i, media), () => goTo(item, type, categoryId));

    if (j <= 2) {
      // 1. ve 2. görsel: sol (sütun 1-4)
      frame.style.gridColumn = `${(j - 1) * 2 + 1} / span 2`;
      frame.style.gridRow = '2';
    } else {
      // 3. ve sonrası: sağ (sütun 9-16), 4'erli satırlar
      const k = j - 3;
      frame.classList.add('is-right');
      frame.style.gridColumn = `${9 + (k % 4) * 2} / span 2`;
      frame.style.gridRow = String(2 + Math.floor(k / 4));
    }
    row.appendChild(frame);
  });

  galleryLeft.appendChild(row);
}


export function showCategories() {
  currentCategory = null;
  resetListScroll();
  resetMediaObserver();
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