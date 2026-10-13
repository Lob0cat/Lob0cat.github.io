// Çalışan simülasyonların örnekleri
const active = new Set();

// Her destroyAll çağrısında artar. Yüklenirken sayfa değişirse
// geç gelen simülasyonu başlatmamak için kullanılır.
let generation = 0;

export async function initSimulation(name, el) {
  // Sadece küçük harf, rakam ve tireye izin ver (dosya yolu güvenliği)
  if (!/^[a-z0-9-]+$/.test(name)) {
    console.warn(`Geçersiz simülasyon adı: "${name}"`);
    return;
  }

  const myGeneration = generation;

  let mod;
  try {
    mod = await import(`../simulations/${name}.js`);
  } catch (err) {
    console.warn(`Simülasyon yüklenemedi: simulations/${name}.js`, err);
    return;
  }

  // Yükleme sürerken sayfadan çıkıldıysa başlatma
  if (myGeneration !== generation || !el.isConnected) return;

  if (typeof mod.init !== 'function') {
    console.warn(`"${name}" dosyası init() export etmiyor`);
    return;
  }

  const instance = mod.init(el);
  if (instance && typeof instance.destroy === 'function') {
    active.add(instance);
  } else {
    console.warn(`"${name}" init() içinden { destroy() } döndürmüyor`);
  }
}

export function destroyAll() {
  generation++;
  active.forEach(instance => {
    try { instance.destroy(); }
    catch (err) { console.error('Simülasyon temizlenirken hata:', err); }
  });
  active.clear();
}