# 🎯 SAYI AVCISI - Profesyonel Sayı Tahmin Oyunu

**Yapan:** Emir Yaşar Kendir  
**Teknolojiler:** HTML5, CSS3, Modern JavaScript (ES6+), Web Audio API, Canvas 2D  
**Yayınlanma:** GitHub Pages Uyumlu (%100 Statik, Sıfır Bağımlılık)

---

## 🌟 Oyun Hakkında

**SAYI AVCISI**, zeka, mantık ve sezgilerinizi test eden modern, animasyonlu ve ödüllü bir sayı tahmin oyunudur. Cyberpunk neon estetiği, cam görünümlü (glassmorphism) arayüzü, 60 FPS çalışan 15 farklı hareketli arka planı ve nostaljik Web Audio API ses efektleriyle donatılmıştır.

---

## 🎮 Özellikler

- **Ana Menü:**
  - En üstte yapımcı rozeti: `Yapan: Emir Yaşar Kendir`
  - Parlayan neon efektli ve animasyonlu `SAYI AVCISI` başlığı
  - Sırasıyla: **HEMEN OYNA**, **NASIL OYNANIR**, **AYARLAR & MAĞAZA** ve **ZORLUK SEVİYESİ / SAYI ARALIĞI**
- **4 Hazır Zorluk + Özel Aralık:**
  - **Kolay:** 1 - 50, Sınırsız tahmin
  - **Orta:** 1 - 100, 10 tahmin hakkı
  - **Zor:** 1 - 500, 9 tahmin hakkı
  - **Efsane:** 1 - 1000, 8 tahmin hakkı
  - **Özel Aralık:** Kendi minimum, maksimum sayılarınızı ve isteğe bağlı tahmin hakkınızı belirleyin.
- **Akıllı Tahmin & Can Koruma:**
  - "Daha yüksek!" ve "Daha düşük!" yönlendirmeleri.
  - Daha önce girilen bir sayı tekrar yazıldığında **tahmin hakkı eksilmez**, kullanıcı uyarılır.
  - Sayı aralığının daralışını anlık gösteren dinamik radar çubuğu.
  - Geçmiş tahminler için şık rozet listesi.
- **Rekor & Kilit Açma Jetonu Ödül Sistemi:**
  - Her zorluk ve aralığın rekoru ayrı ayrı `localStorage` ile saklanır.
  - İlk galibiyet başlangıç rekorunu belirler.
  - Önceki rekor her geçildiğinde (daha az tahminde bulunulduğunda) oyuncu **1 Kilit Açma Jetonu** kazanır!
- **15 Hareketli Arka Plan Mağazası:**
  1. RGB Gökkuşağı *(Ücretsiz)*
  2. Neon Kırmızı *(Ücretsiz)*
  3. Elektrik Mavisi *(Ücretsiz)*
  4. Galaksi Moru *(Kilitli)*
  5. Altın Parçacıkları *(Kilitli)*
  6. Matrix Yeşili *(Kilitli)*
  7. Pembe Neon *(Kilitli)*
  8. Ateş *(Kilitli)*
  9. Buz *(Kilitli)*
  10. Yıldızlı Gökyüzü *(Kilitli)*
  11. Uzay *(Kilitli)*
  12. Gün Batımı *(Kilitli)*
  13. Turkuaz Dalgalar *(Kilitli)*
  14. Mor Parçacıklar *(Kilitli)*
  15. Siyah Neon *(Kilitli)*
  - Ayrıca **Özel Düz Renk Seçici** ile istenen her renk ücretsiz uygulanabilir.
- **Web Audio API Entegre Sesler:**
  - Harici dosyalara veya internete ihtiyaç duymayan saf JavaScript sentezleyici sesler.
  - Ortam müziği (Ambient Chill Synth), hamle sesleri, rekor fanfarı ve kilit açma efektleri.
  - Ses seviyesi kontrolleri ve susturma seçeneği.

---

## 🚀 GitHub Pages ile Yayınlama Adımları

Web sitenizi tüm dünyaya açmak için:

1. **GitHub** hesabınıza giriş yapın ve sağ üstteki **+** ikonuna tıklayıp **"New repository"** seçin.
2. Repository adını belirleyin (Örnek: `sayi-avcisi`).
3. Repository'yi **Public** olarak işaretleyip **Create repository** butonuna basın.
4. Bu klasördeki 3 ana dosyayı (`index.html`, `style.css`, `script.js`):
   - GitHub web sayfasındaki **"uploading an existing file"** linkine tıklayarak sürükleyip bırakın ve **Commit changes** deyin.
   - Ya da terminalden `git push` ile gönderin.
5. Repository sayfanızda üst kısımdaki **Settings** (Ayarlar) sekmesine gidin.
6. Sol menüden **Pages** bölümüne tıklayın.
7. **Branch** kısmından `main` (veya `master`) dalını ve `/ (root)` klasörünü seçip **Save** butonuna tıklayın.
8. 1-2 dakika içinde sayfanız `https://kullaniciadiniz.github.io/sayi-avcisi/` adresinde canlı yayına geçecektir! 🎉

