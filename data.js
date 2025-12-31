// data.js
const portfolioData = [
    {
        id: "physics",
        title: "Fizik Çalışmalarım",
        description: "Laboratuvar raporları, simülasyonlar ve akademik projeler.",
        projects: [
            {
                id: "p1",
                title: "Robot Kol & Pixhawk",
                // Buraya istediğin HTML kodunu (video, resim, yazı) gömebilirsin
                content: `
                    <h2>Jetson Xavier ve Pixhawk Entegrasyonu</h2>
                    <p>Bu projede gömülü sistemler kullanarak otonom kontrol sağladım...</p>
                    <img src="https://via.placeholder.com/600x300" style="width:100%; border-radius:10px;">
                    <p>Python kodu örneği aşağıdadır:</p>
                    <pre style="background:#333; padding:10px; color:#fff;">import dronekit...</pre>
                `
            },
            {
                id: "p2",
                title: "RLC Devre Analizi",
                content: `
                    <h2>LTspice Simülasyonu</h2>
                    <p>Alternatif akımda RLC devrelerinin davranışını inceledim.</p>
                `
            }
        ]
    },
    {
        id: "coding",
        title: "Yazılım Projeleri",
        description: "Web geliştirme, Python otomasyonları ve algoritmalar.",
        projects: [
            {
                id: "c1",
                title: "3D Portföy Sitesi",
                content: `
                    <h2>Three.js ile WebGL Deneyimi</h2>
                    <p>Şu an gezdiğiniz bu siteyi sıfırdan geliştirdim.</p>
                `
            },
            {
                id: "c2",
                title: "Network Traffic Analyzer",
                content: `
                    <h2>Wireshark ve Python</h2>
                    <p>Ağ paketlerini yakalayıp analiz eden bir araç.</p>
                `
            }
        ]
    }
];
