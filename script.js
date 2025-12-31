// --- BÖLÜM 1: BASİT 3D SAHNE (Template) ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('webgl'), alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);

// Örnek bir nesne (Senin shader'ın buraya gelecek)
const geometry = new THREE.IcosahedronGeometry(2, 0);
const material = new THREE.MeshBasicMaterial({color: 0x00ff88, wireframe: true});
const shape = new THREE.Mesh(geometry, material);
scene.add(shape);
camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    shape.rotation.x += 0.001;
    shape.rotation.y += 0.002;
    renderer.render(scene, camera);
}
animate();

// --- BÖLÜM 2: MENÜ SİSTEMİ MANTIĞI ---

// HTML Elemanlarını Seçelim
const categoryMenu = document.getElementById('category-menu');
const projectList = document.getElementById('project-list');
const projectsContainer = document.getElementById('projects-container');
const categoryTitle = document.getElementById('category-title');
const projectDetail = document.getElementById('project-detail');
const detailContent = document.getElementById('detail-content');

// Geçici hafıza (Hangi kategorideyiz?)
let activeCategory = null;

// 1. ADIM: Sayfa açılınca KATEGORİLERİ yükle
function initMenu() {
    portfolioData.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerHTML = `<h3>${cat.title}</h3><small>${cat.description}</small>`;
        
        // Tıklanınca o kategoriyi aç
        div.onclick = () => openCategory(cat);
        
        categoryMenu.appendChild(div);
    });
}

// 2. ADIM: Kategoriye tıklanınca PROJELERİ listele
function openCategory(category) {
    activeCategory = category;
    
    // Ana menüyü gizle, listeyi aç
    categoryMenu.classList.add('hidden');
    categoryMenu.classList.remove('active');
    
    projectList.classList.remove('hidden');
    projectList.classList.add('active');
    
    // Başlığı güncelle
    categoryTitle.innerText = category.title;
    
    // Önceki listeyi temizle
    projectsContainer.innerHTML = '';
    
    // Yeni projeleri ekle
    category.projects.forEach(proj => {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerText = proj.title;
        
        // Projeye tıklanınca Detayı aç
        div.onclick = () => openDetail(proj);
        
        projectsContainer.appendChild(div);
    });
}

// 3. ADIM: Projeye tıklanınca DETAYI göster
function openDetail(project) {
    // İçeriği data.js'den alıp HTML'e bas
    detailContent.innerHTML = project.content;
    
    // Overlay'i aç
    projectDetail.classList.remove('hidden');
    
    // İstersen burada 3D objeyi yana kaydırabilirsin
    // shape.position.x = -2; 
}

// GERİ DÖNÜŞ FONKSİYONLARI

function goBackToCategories() {
    projectList.classList.add('hidden');
    categoryMenu.classList.remove('hidden');
    categoryMenu.classList.add('active');
}

function closeDetail() {
    projectDetail.classList.add('hidden');
    // 3D obje eski yerine gelsin
    // shape.position.x = 0;
}

// Uygulamayı başlat
initMenu();

// Pencere boyutu değişirse
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
