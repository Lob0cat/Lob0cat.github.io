import { getRoute, onRouteChange } from "./router.js";
import { mountBlocks, cleanupBlocks } from "./blocks.js";

const contentPanel = document.getElementById("content-panel"); // Ana Panel
const contentInner = document.getElementById("content-inner"); // İçerik Kutusu

async function load() {
  const route = getRoute();

  // 1. EĞER ROTA YOKSA (ANASAYFA): Paneli kapat
  if (!route) {
    contentPanel.classList.remove("open");
    setTimeout(() => { // Animasyon bitince içini temizle
        cleanupBlocks();
        contentInner.innerHTML = "";
    }, 600);
    return;
  }

  // 2. ROTA VARSA: İçeriği yükle ve Paneli aç
  
  // Önce eski blokları temizle
  cleanupBlocks();
  contentInner.innerHTML = "<div style='opacity:0.5'>Yükleniyor...</div>";
  
  // Paneli kaydırarak aç
  contentPanel.classList.add("open");

  try {
    const html = await fetch(`content/${route}.html`).then(r => {
      if (!r.ok) throw new Error();
      return r.text();
    });

    contentInner.innerHTML = html;
    
    // Gelen HTML'in içindeki blokları canlandır (Lifecycle)
    mountBlocks(contentInner);

  } catch {
    contentInner.innerHTML = "<h1>404</h1><p>Proje bulunamadı.</p>";
  }
}

// Router'ı başlat
onRouteChange(load);
