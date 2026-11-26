# PRD — Monas 3D Experience

Remix dari “Eiffel Tower 3D” · disusun untuk Lingga · 26 November 2026 · berdasarkan analisis isi remix-eiffel-tower-3d.zip

## 1. Ringkasan

Project Eiffel yang kamu upload bukan sekadar model 3D. Ia adalah **pameran museum interaktif**: menara dibangun bertahap di layar (step 0 sampai 11), dipandu 12 “stop” kronologis, tiap stop memadukan foto arsip asli dengan model 3D yang kameranya sudah dikalibrasi supaya pas dengan foto, ditambah plakat narasi, dunia sekitar (Paris 1889), dan atmosfer pagi/senja/malam.

**Tujuan versi Monas:** mempertahankan konsep itu (menyaksikan Monas dibangun dari pondasi sampai lidah api, ditemani cerita dan foto arsip), tetapi dengan aset 3D, konten sejarah, dan tampilan frontend yang sepenuhnya baru dan berkarakter Indonesia.

**Poin penting di awal:** hampir semua isi “Eiffel” bersifat spesifik pada menara itu (159 potongan struktur, kalibrasi 11 foto, peta Paris 1889). Jadi ini bukan sekadar ganti tekstur. Mesin (renderer, kamera, UI controller, optimasi performa) bisa dipakai ulang, tetapi model, dunia, data, dan konten harus dibuat ulang.

## 2. Temuan analisis project Eiffel

**Stack**

- JavaScript vanilla (ES modules) + Three.js yang di-vendor di folder vendor/three, dibundel dengan Vite. Tanpa React.
- Dependensi @google/genai ada di package.json tetapi tidak dipakai oleh kode yang aku baca; aman diabaikan.
- Tekstur PBR dibuat prosedural di Web Worker (pbr\_worker.js), bukan file gambar.

**Arsitektur (dari entry point app.js)**

- startup\_orchestrator.js: memuat katalog kamera, menjalankan worker tekstur, dan decode foto stop pertama secara paralel saat boot.
- model/: TowerModelController membangun 5 zona prosedural. BuildKinematicsEngine menganimasikan perakitan (caisson, derek, girder, lengkung). Parameter utamanya satu angka “step” dari 0 sampai 11.
- world/: Paris 1889 (Champ-de-Mars, Seine, Trocadéro), atmosfer dan lighting rig dengan mood day/dusk/night, kabut jarak.
- camera/ dan portals/: OpticalCameraRig menerbangkan kamera ke posisi foto arsip tanpa “lompatan” piksel, lalu foto kaca dilapiskan dan dilebur ke 3D. Data kamera ada di data/catalog/photo\_cameras\_3d.json (posisi, quaternion, FOV, view offset per foto).
- story/ dan story\_and\_archive/: 12 stop (walkthrough\_data.js), narasi EN/FR, plakat museum.
- ui/: walkthrough controller (bar timeline), intro “Explore”, header museum, drawer debug, token warna.
- perf/: batching mesh, optimasi shader dan bayangan.

**Konsep yang membuatnya terasa spesial (ini yang kita pertahankan)**

1. Konstruksi bertahap yang bisa di-scrub dan diputar otomatis.
2. Cerita kronologis dengan foto asli yang menyatu dengan 3D.
3. Showcase 3D akhir dengan preset sudut pandang (Overview dan Detail).
4. Mode waktu: pagi, senja, malam.
5. Intro layar penuh lalu tombol Explore, serta deep link lewat URL (?stop=, ?lang=, ?intro=0).

## 3. Konsep Monas: dipertahankan vs diganti

| Aspek | Eiffel (asli) | Monas (target) |
| --- | --- | --- |
| Cerita | Konstruksi 1887–1889 | Konstruksi 1961–1975: dari peletakan beton pertama sampai dibuka untuk umum |
| Struktur | Rangka besi riveted, 5 zona, 159 potongan | Tugu beton berlapis marmer, cawan, pelataran puncak, lidah api, museum bawah tanah. Jauh lebih sederhana |
| Animasi konstruksi | Caisson udara, derek, girder, lengkung 74 m | Pemancangan pasak beton, pengecoran tugu, pemasangan cawan, pelapisan marmer, perakitan 77 bagian lidah api |
| Dunia sekitar | Paris 1889, Seine, Trocadéro | Lapangan Medan Merdeka, jalan Silang Monas, taman kota, bangunan sekeliling (pilih era, lihat bagian 13) |
| Foto arsip | 11 foto + denah, dikalibrasi PnP | Foto arsip pembangunan Monas (perlu riset dan lisensi) |
| Bahasa | EN dan FR | ID dan EN |
| Tampilan | Galeri museum hitam-putih-abu | Identitas baru (bagian 7) |

## 4. Fakta acuan Monas

Angka berikut aku ambil dari beberapa sumber publik dan konsisten antar sumber, kecuali yang ditandai. Semua teks yang tampil ke pengunjung sebaiknya dicek ulang ke sumber primer (Kemendikbud/Cagar Budaya, UPK Monas, arsip nasional).

| Elemen | Nilai | Status |
| --- | --- | --- |
| Tinggi total | 132 m | Konsisten |
| Mulai dibangun | 17 Agustus 1961, beton pertama oleh Presiden Sukarno | Konsisten |
| Dibuka untuk umum | 12 Juli 1975 | Konsisten |
| Pelataran cawan | Tinggi 17 m, bujur sangkar 45 × 45 m, berisi Ruang Kemerdekaan | Konsisten |
| Pelataran puncak | Tinggi 115 m, 11 × 11 m, lift untuk 7 orang, muat sekitar 50 pengunjung | Konsisten |
| Lidah api | Tinggi 14 m, diameter 6 m, 77 bagian, perunggu sekitar 14,5 ton, berlapis emas | Berat emas berbeda antar sumber (32, 35, 50, 72 kg). Verifikasi sebelum ditampilkan |
| Museum Sejarah Nasional | 80 × 80 m, sekitar 3 m di bawah tanah | Konsisten |
| Pondasi | 284 pasak beton untuk tugu, 360 untuk museum, pemancangan selesai sekitar Maret 1962 | Satu sumber, verifikasi |
| Tahap pembangunan | Sumber berbeda dalam membagi tahap (dua atau tiga tahap; tahap akhir sekitar 1969–1976 dengan diorama museum) | Perlu riset |
| Perancang | Frederich Silaban dan R.M. Soedarsono (Ir. Rooseno juga disebut untuk struktur) | Verifikasi pembagian peran |
| Lebar dasar dan kemiringan tugu | Belum ditemukan | Butuh gambar teknis atau pengukuran dari foto |

Catatan simbolik yang layak masuk narasi: angka 17, 8, 45 pada ukuran pelataran merujuk tanggal Proklamasi (17-8-1945), dan lidah api melambangkan semangat perjuangan yang menyala.

## 5. Kebutuhan produk

### Fungsional (MVP)

1. **Intro dan Explore:** layar pembuka dengan Monas utuh di latar, judul, subjudul singkat, tombol Explore. Bisa dilewati lewat URL.
2. **Konstruksi bertahap:** parameter step kontinu dari 0 sampai N. Model muncul sesuai fase, dengan animasi sederhana namun masuk akal (pasak turun, beton naik, marmer terpasang, lidah api dirakit).
3. **Walkthrough 8–10 stop** (bagian 6): tiap stop punya tanggal, judul, narasi, tinggi atau ukuran, dan sudut kamera yang tetap.
4. **Timeline rail:** bisa di-scrub, bisa play/pause, bisa lompat ke stop.
5. **Showcase 3D akhir** dengan preset: Overview, Lidah Api, Pelataran Puncak, Cawan, Plaza.
6. **Mode waktu:** pagi, senja, malam. Di malam hari lidah api boleh bercahaya (lihat risiko soal aturan zero-emissive).
7. **Dua bahasa:** ID (default) dan EN, bisa diganti lewat ?lang= dan tombol.
8. **Responsif:** desktop dan mobile portrait. Plakat menjadi bottom sheet di mobile.
9. **Deep link:** ?stop=, ?lang=, ?intro=0, ?mood=.

### Fase 2 (opsional)

- Overlay foto arsip yang menyatu dengan 3D lewat kalibrasi kamera (PnP). Mahal, jadi sengaja ditunda.
- Mode jelajah bebas ke dalam Ruang Kemerdekaan dan museum diorama.
- Audio ambient dan narasi suara.
- Arsip foto (galeri) terpisah dari walkthrough.

### Non-fungsional

- Waktu muat pertama di bawah 5 detik pada jaringan 4G menengah. Tekstur tetap prosedural atau sangat ringan.
- Target 60 FPS di laptop menengah dan minimal 30 FPS di HP kelas menengah. Anggaran segitiga di bawah 500 ribu (Eiffel asli 3,1 juta, terlalu berat untuk Monas yang bentuknya sederhana).
- Tanpa CDN eksternal. Semua aset lokal agar mudah di-deploy.
- Aksesibilitas: kontras teks AA, navigasi keyboard, label ARIA di timeline, dukungan prefers-reduced-motion.

## 6. Alur walkthrough yang diusulkan

Tanggal dan foto di bawah baru kerangka. Hanya tanggal yang ditandai (✓) yang sudah terverifikasi dari sumber di atas. Sisanya harus diisi setelah riset arsip.

| # | Stop | Tanggal | Fokus 3D |
| --- | --- | --- | --- |
| 1 | Gagasan dan rancangan Monas | Perlu riset (sayembara dan maket) | Tugu utuh sebagai sketsa atau maket |
| 2 | Peletakan beton pertama | 17 Agustus 1961 ✓ | Lapangan kosong, titik pondasi |
| 3 | Pemancangan pasak pondasi | Sekitar Maret 1962 (verifikasi) | Barisan pasak beton |
| 4 | Ruang museum bawah tanah | Perlu riset | Basement 80 × 80 m |
| 5 | Tugu naik dan cawan terbentuk | Perlu riset | Batang tugu, cawan 17 m |
| 6 | Pelapisan marmer dan lift | Perlu riset | Selubung marmer, poros lift |
| 7 | Lidah api dirakit | Perlu riset | 77 bagian perunggu, lapisan emas |
| 8 | Tahap akhir dan diorama museum | Sekitar 1969–1976 (verifikasi) | Interior museum |
| 9 | Peresmian dan dibuka untuk umum | 12 Juli 1975 ✓ | Monas utuh, plaza |
| 10 | Showcase 3D | Kini | Preset Overview dan Detail |

Stop 10 berfungsi sebagai penutup dan kembali ke stop 1, sama seperti loop di versi Eiffel.

## 7. Arah desain frontend baru

Versi Eiffel memakai galeri museum yang sepenuhnya hitam, putih, dan abu (chroma nol), tanpa glassmorphism. Karena kamu ingin tampilan berbeda, ini tiga opsi. Pilih satu sebelum mulai coding UI.

| Opsi | Karakter | Palet awal | Cocok jika |
| --- | --- | --- | --- |
| A. Emas dan Langit Jakarta (rekomendasi) | Sinematik, imersif, dark-first. Lidah api menjadi aksen cahaya | Biru malam #0B1426, putih tulang #F4EFE6, emas #D4A93C | Ingin kesan megah dan memorable di mobile |
| B. Merah Putih Editorial | Bersih, terang, tipografi besar, nuansa buku sejarah modern | Putih #FFFFFF, merah #C8102E, abu hangat #2B2B2B | Ingin kesan formal dan edukatif |
| C. Arsip Nusantara | Kertas hangat, serif, tekstur ringan, nuansa dokumen 1960-an | Krem #F1E7D3, cokelat tinta #3B2F25, merah bata #A63D2F | Ingin kesan nostalgia dan arsip |

**Perubahan layout yang mendukung semua opsi**

- Timeline pindah dari bar bawah ke rail vertikal di kanan (desktop) dan bar tipis dengan titik stop (mobile).
- Plakat narasi menjadi kartu di sisi kiri (desktop) dan bottom sheet yang bisa ditarik (mobile).
- Header kecil dengan nama, pengganti bahasa ID/EN, dan tombol mood.
- Satu kata kunci per stop (tahun besar) sebagai elemen visual utama.
- Font: pakai font sistem atau font yang di-bundle lokal agar tetap tanpa CDN.

**Token yang perlu ditulis ulang:** semua variabel CSS di style.css dan konstanta di ui/palette\_tokens.js (UI\_DARK\_PLINTH\_TOKENS, UI\_LIGHT\_VELLUM\_TOKENS). Ada auditor warna yang memaksa nilai achromatic; auditor itu harus dimatikan atau diganti, kalau tidak ia akan menolak palet baru.

## 8. Pemetaan file: pertahankan, ubah, buat ulang

**Pertahankan hampir apa adanya**

- vendor/three, vite.config.ts, package.json, tsconfig.json
- perf/fps\_and\_drawcalls/\* (setelah model baru ada, jalankan ulang)
- camera/optical\_camera\_rig.js, camera/viewport\_constraints.js (perlu penyesuaian skala)
- startup\_orchestrator.js dan pbr\_worker.js (pola paralel bagus; ganti daftar tekstur)
- ui/walkthrough\_controller.js (logika timeline dan play; ubah jumlah stop dan DOM-nya)

**Ubah sedang**

- app.js: konstanta 12 stop, clamp step 0–11, ID foto 55 dan 13, bahasa fr, pemanggilan modul Paris dan tower
- world/atmosphere.js dan world/distance\_fog.js: sesuaikan skala 132 m dan langit tropis Jakarta
- model/tower\_controller.js: ganti ZONE\_DEFS (5 zona Eiffel) dengan zona Monas
- model/build\_kinematics.js: pertahankan antarmuka setStep, ganti 9 jenis animasi dengan fase Monas
- camera/hero\_finale\_rig.js dan walkthrough\_camera\_choreography.js: ganti preset dan pose
- story\_and\_archive/museum\_placard.js dan ui/landing\_intro.js: ganti teks dan struktur

**Buat ulang dari nol**

- model/modules/\* (semua file zona Eiffel; total sekitar 1 MB kode) menjadi modul Monas yang jauh lebih kecil
- model/materials.js dan model/floor\_textures.js: material marmer, beton, perunggu, emas, rumput, paving
- world/paris\_1889.js, w\_champ\_de\_mars.js, w\_parvis\_seine.js, w\_trocadero.js, sketch\_materials.js menjadi world/medan\_merdeka.js dan modul sekitar
- story/chapters\_1889\*.js dan story\_and\_archive/walkthrough\_data.js
- data/catalog/photo\_cameras\_3d.json (hanya jika Fase 2)
- references/ dan thumbnails/ (aset Eiffel; ganti dengan arsip Monas)
- style.css dan story\_and\_archive/story\_archive.css

**Hapus**

- Konten Eiffel yang tersisa (nama, teks FR, gambar plat) agar tidak tercampur.

## 9. Kebutuhan aset

1. **Referensi geometri:** gambar teknis Monas (potongan, tampak, denah), atau foto beberapa sisi untuk mengukur proporsi tugu, tepi cawan, dan bentuk lidah api.
2. **Foto arsip pembangunan:** cari dari arsip nasional, perpustakaan digital, Wikimedia Commons, atau koleksi KITLV. Catat sumber dan lisensi tiap foto. Jangan masukkan foto berhak cipta tanpa izin.
3. **Teks sejarah:** tiap klaim punya sumber. Untuk angka berselisih (emas, tahap pembangunan), tulis rentang atau jangan tampilkan.
4. **Peta lingkungan:** posisi bangunan di sekitar Medan Merdeka untuk era yang dipilih (bagian 13).
5. **Teks ID dan EN:** satu penulis, satu gaya bahasa, pendek dan literal seperti versi Eiffel.

## 10. Jebakan teknis yang akan muncul

- **Skala semua angka tuning.** Kamera (near 0,5, far 4500), kabut (165 sampai 960 m), frustum bayangan, dan pose preset dituning untuk menara 312 m. Monas 132 m berarti kira-kira 0,42 kali. Mulai dari menyesuaikan konstanta ini, bukan dari model.
- **Aturan zero-emissive.** Versi Eiffel memaksa emissive nol di seluruh scene lewat enforceZeroEmissiveAcrossScene dan auditor. Lidah api malam hari ideal bercahaya. Putuskan: kecualikan material lidah api dari auditor, atau pakai PointLight saja.
- **Nilai yang dikunci di kode:** clamp step 0–11 di app.js, ID foto 55 dan 13 di startup\_orchestrator, ID stop dan LEGACY\_CHAPTER\_TO\_STOP\_MAP. Cari dengan grep, jangan hanya ganti file data.
- **Alias import museum/** di import map. Boleh dipertahankan agar modul tidak perlu ditulis ulang.
- **Foto yang menyatu dengan 3D butuh kalibrasi kamera per foto** (≥ 6 titik korespondensi 2D–3D, dipecahkan dengan solvePnP). Karena itu sengaja jadi Fase 2. Di MVP, tampilkan foto sebagai panel samping atau kartu, bukan overlay.
- **Foto lama Monas tidak mengandung tampak yang sama dengan sekarang** (fase pembangunan berbeda, tidak ada marmer, ada perancah). Model tiap fase harus dibuat sesuai fotonya.

## 11. Rencana kerja

| Fase | Hasil | Perkiraan |
| --- | --- | --- |
| 0. Riset | Daftar stop final, tanggal terverifikasi, kumpulan foto berlisensi, gambar teknis | 3–5 hari |
| 1. Fondasi | Fork project, hapus konten Eiffel, ganti nama dan konstanta, scene kosong Medan Merdeka berjalan | 2 hari |
| 2. Model Monas | Tugu, cawan, pelataran puncak, lidah api, museum, dengan step 0–N | 5–8 hari |
| 3. Dunia | Plaza, jalan, pepohonan, bangunan sekitar, langit dan kabut, mood hari | 3–4 hari |
| 4. Cerita | Data stop, narasi ID dan EN, kamera per stop, preset showcase | 3 hari |
| 5. Frontend baru | Token, layout, timeline, plakat, intro, responsif | 4–5 hari |
| 6. Performa dan QA | Batching, uji mobile, aksesibilitas, deploy | 3 hari |
| 7. (Opsional) PnP | Overlay foto arsip yang menyatu | 5–10 hari |

Estimasi untuk satu developer dengan bantuan AI; sesuaikan dengan ketersediaan aset dan jam kerjamu.

## 12. Kriteria sukses

- Scrub dari step 0 sampai akhir tanpa lonjakan geometri, tanpa objek melayang atau tenggelam.
- Setiap stop punya tanggal, judul, narasi ID dan EN, dan sumber.
- Tidak ada teks atau aset Eiffel yang tersisa di build produksi.
- Lighthouse performa ≥ 80 di mobile, 60 FPS di desktop target.
- Semua angka yang tampil lolos cek ke sumber, atau ditandai sebagai perkiraan.
- Timeline dan plakat dapat dioperasikan dengan keyboard.

**Risiko utama**

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Foto arsip sulit didapat atau berlisensi tidak jelas | Cerita lemah | Mulai riset dulu; siapkan fallback ilustrasi atau sketsa buatan sendiri |
| Model tidak mirip Monas | Kehilangan kredibilitas | Kumpulkan referensi ukuran dulu; bandingkan siluet tiap fase |
| Perselisihan angka sejarah | Informasi keliru | Tulis rentang, cantumkan sumber, hindari angka tunggal yang diperdebatkan |
| Kode Eiffel punya asumsi tersembunyi | Bug aneh saat skala berubah | Bersihkan konstanta dulu, uji tiap modul sebelum lanjut |
| Tampilan baru bertabrakan dengan auditor warna | Build gagal | Matikan atau ganti auditor di ui/theme\_and\_debug\_index.js |

## 13. Keputusan yang perlu kamu ambil

1. **Era visual:** Monas saat pembangunan (1960-an, banyak perancah dan lapangan terbuka) atau Monas sekarang (marmer bersih, taman kota)? Rekomendasi: tampilkan keduanya, dengan pembangunan sebagai cerita dan kondisi sekarang sebagai showcase.
2. **Arah desain:** opsi A, B, atau C (bagian 7).
3. **Foto arsip menyatu dengan 3D (PnP) di MVP atau Fase 2?** Rekomendasi: Fase 2.
4. **Tujuan produk:** proyek portofolio, produk edukasi sekolah, atau bagian dari bisnis digital? Ini menentukan seberapa dalam riset sejarah dan seberapa rapi lisensi aset.
5. **Target perangkat:** apakah mobile menengah ke bawah wajib mulus? Jika ya, anggaran segitiga dan bayangan harus lebih ketat.

## 14. Prompt siap pakai untuk AI Studio atau Gemini

Untuk mengerjakan di AI Studio, jangan minta “ubah jadi Monas” sekaligus. Kerjakan per fase supaya kode tidak rusak. Mulai dari prompt induk di bawah, lalu lanjutkan satu fase per pesan.

**Prompt induk**

```
Project ini adalah pameran 3D interaktif Menara Eiffel (Three.js, vanilla JS, Vite). Ubah menjadi pameran 3D Monumen Nasional (Monas), Jakarta, dengan konsep yang sama: konstruksi bertahap yang bisa di-scrub (step), walkthrough kronologis dengan plakat narasi, showcase 3D akhir dengan preset kamera, dan mode pagi/senja/malam.

Aturan:
- Pertahankan arsitektur modul dan antarmuka (setStep, goToStop, setMood, walkthrough controller).
- Hapus semua konten, nama, teks FR, dan aset Eiffel.
- Bahasa: Indonesia (default) dan Inggris.
- Skala dunia dalam meter; tinggi Monas 132 m.
- Jangan pakai CDN eksternal.
- Kerjakan satu fase per balasan dan sebutkan file yang diubah.

Fase 1: ganti nama, judul, metadata, bahasa, konstanta (clamp step, jumlah stop, ID foto), dan buat scene kosong lapangan Medan Merdeka yang berjalan tanpa error.
```

**Fase berikutnya (satu per pesan)**

1. Model Monas: tugu (batang meruncing), cawan 45 × 45 m pada ketinggian 17 m, pelataran puncak 11 × 11 m pada 115 m, lidah api 14 m (diameter 6 m, 77 segmen), basement museum 80 × 80 m. Satu parameter step menentukan fase pembangunan.
2. Animasi konstruksi: pasak pondasi turun, batang tugu naik bertahap, cawan terbentuk, marmer terpasang, lidah api dirakit.
3. Dunia: plaza Medan Merdeka, jalan Silang Monas, pepohonan, bangunan sekeliling, kabut dan langit tropis, tiga mood.
4. Cerita: ganti data stop dan narasi (aku akan sertakan teks final), atur kamera tiap stop, preset showcase.
5. Frontend: terapkan desain opsi pilihan (token warna, layout timeline rail, plakat kartu atau bottom sheet, intro Explore).
6. Performa: batching, anggaran segitiga, uji mobile, aksesibilitas.

Saat mengirim prompt fase 4 dan 5, sertakan teks narasi final dan token palet yang sudah kamu pilih. AI hanya akan sebaik data yang kamu beri.
