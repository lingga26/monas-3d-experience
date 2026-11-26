# Monas 3D Experience — Monumen Nasional Jakarta

### 🔴 Live Demo: [lingga26.github.io/monas-3d-experience](https://lingga26.github.io/monas-3d-experience/)

Pameran arsitektur 3D interaktif yang merekonstruksi pembangunan **Monumen Nasional (Monas)**, Jakarta — dari gagasan dan sayembara desain pada 1950-an, peletakan beton pertama pada 17 Agustus 1961, hingga peresmian dan pembukaan untuk umum pada 12 Juli 1975.

Monas setinggi **132 meter** dibangun bertahap langsung di layar: saksikan pondasi pasak beton, ruang museum bawah tanah, pelataran Cawan, batang tugu berlapis marmer, pelataran Puncak, sampai Lidah Api berlapis emas terpasang di puncak — semuanya di tengah Lapangan Medan Merdeka, dalam tiga suasana waktu Jakarta: pagi, senja, dan malam.

> *An interactive 3D museum exhibition of Indonesia's National Monument (Monas) in Jakarta — watch the 132 m monument rise step by step, from the first concrete pour in 1961 to its public opening in 1975. Bilingual: Indonesian (default) and English.*

## ✨ Fitur Utama

- **Konstruksi bertahap yang bisa di-scrub** — satu parameter `step` (0–9) menggerakkan seluruh animasi pembangunan: pasak turun, beton naik, marmer terpasang, Lidah Api dirakit dari 77 bagiannya.
- **Walkthrough 10 stop kronologis** — tiap stop punya tanggal, judul, narasi sejarah, data ukuran/ketinggian, sumber arsip, dan pose kamera sinematik tersendiri (desktop & mobile).
- **Showcase 3D akhir** — preset sudut pandang: Overview, Lidah Api, Pelataran Puncak, Cawan, dan Plaza.
- **Tiga mood waktu** — pagi, senja, dan malam (`day` / `dusk` / `night`) dengan rig atmosfer, pencahayaan, dan kabut jarak khas Jakarta.
- **Dua bahasa** — Indonesia (default) dan Inggris, bisa diganti lewat tombol di header atau URL.
- **Dunia Medan Merdeka prosedural** — pelataran, Silang Monas, taman, dan lingkungan sekitar dibangun dari kode, tanpa aset eksternal.
- **Tekstur PBR prosedural** — material marmer, beton, perunggu, dan emas dihasilkan di Web Worker (`pbr_worker.js`), bukan file gambar, jadi muatannya ringan.
- **Tanpa CDN** — Three.js di-vendor lokal di `vendor/three/`, semua aset lokal dan siap deploy statis.
- **Deep link** — lompat langsung ke stop, bahasa, mood, atau lewati intro lewat parameter URL.
- **Responsif & aksesibel** — layout desktop dan mobile portrait (plakat menjadi bottom sheet), navigasi keyboard, label ARIA pada timeline, dan dukungan `prefers-reduced-motion`.

## 🗺️ Alur Walkthrough — 10 Stop

| # | Stop | Tanggal | Fokus 3D |
|---|------|---------|----------|
| 1 | Gagasan Tugu Kemerdekaan | 1954–1961 | Sayembara & rancangan Frederich Silaban & R.M. Soedarsono |
| 2 | Peletakan Beton Pertama | 17 Agustus 1961 | Tapak Medan Merdeka, pengecoran awal oleh Presiden Sukarno |
| 3 | Pemancangan Pasak Pondasi | ± Maret 1962 | 284 pasak tugu · 360 pasak museum |
| 4 | Ruang Museum Bawah Tanah | 1962–1963 | Aula Museum Sejarah Nasional 80 × 80 m, ±3 m di bawah tanah |
| 5 | Batang Tugu dan Cawan | 1963–1964 | Batang tugu dan pelataran Cawan 45 × 45 m di ketinggian 17 m |
| 6 | Pelapisan Marmer dan Lift | 1965–1969 | Selubung marmer dan jalur lift menuju Puncak |
| 7 | Perakitan Lidah Api Emas | 1965–1971 | 77 bagian perunggu berlapis emas, tinggi 14 m di 118–132 m |
| 8 | Tahap Akhir dan Diorama | ± 1969–1976 | Penyelesaian interior dan diorama museum |
| 9 | Peresmian untuk Umum | 12 Juli 1975 | Monas utuh dan plaza Medan Merdeka |
| 10 | Showcase Monas 3D | Kini | Preset Overview & Detail, jelajah bebas |

Fakta acuan yang dipakai: tinggi total 132 m · Cawan 17 m (45 × 45 m, berisi Ruang Kemerdekaan) · Pelataran Puncak 115 m (11 × 11 m) · Lidah Api 14 m, diameter 6 m, 77 bagian perunggu berlapis emas · angka 17-8-45 pada ukuran pelataran merujuk tanggal Proklamasi Kemerdekaan.

## 🚀 Menjalankan Secara Lokal

**Prasyarat:** Node.js (atau Bun)

```bash
# 1. Install dependensi
npm install        # atau: bun install

# 2. Jalankan dev server (http://localhost:3000)
npm run dev

# 3. Build untuk produksi (output di dist/)
npm run build

# 4. Preview hasil build
npm run preview

# 5. Cek tipe TypeScript
npm run lint
```

Tidak perlu API key — dependensi `@google/genai` pada `package.json` adalah sisa template awal dan tidak dipakai oleh kode aplikasi.

## 🔗 Deep Link

| Parameter | Nilai | Fungsi |
|-----------|-------|--------|
| `?stop=` | `0`–`9` | Mulai langsung di stop tertentu |
| `?lang=` | `id` / `en` | Bahasa antarmuka & narasi |
| `?mood=` | `day` / `dusk` / `night` | Suasana waktu awal |
| `?intro=0` | — | Lewati layar pembuka |
| `?autoplay=` | — | Putar walkthrough otomatis |

Contoh: `index.html?stop=6&lang=en&mood=night&intro=0` — langsung ke perakitan Lidah Api, berbahasa Inggris, di malam hari.

## 🛠️ Teknologi

- **Three.js** (di-vendor lokal, tanpa CDN) + **OrbitControls**
- **JavaScript vanilla** (ES Modules) — tanpa framework UI
- **Vite 8** sebagai dev server & bundler, **TypeScript** untuk konfigurasi dan pengecekan tipe
- **Web Worker** untuk generasi tekstur PBR prosedural
- Import map `museum/` untuk alias modul internal

## 📁 Struktur Proyek

```
.
├── index.html                  # Entry point + boot veil (layar pemuatan)
├── app.js                      # Runtime utama pameran
├── startup_orchestrator.js     # Boot paralel: katalog kamera, worker tekstur, decode aset
├── pbr_worker.js               # Web Worker tekstur PBR prosedural
├── model/
│   ├── tower_controller.js     # Pengendali 5 zona arsitektur Monas
│   ├── build_kinematics.js     # Mesin animasi perakitan per fase (setStep)
│   ├── materials.js            # Material marmer, beton, perunggu, emas
│   ├── floor_textures.js       # Tekstur lantai & permukaan
│   ├── asset_loading_manager.js
│   └── modules/                # Zona 1–5: pondasi, Cawan, shaft/Puncak, Lidah Api, perancah & derek
├── world/
│   ├── medan_merdeka.js        # Lapangan Medan Merdeka & Silang Monas
│   ├── atmosphere.js           # Rig langit & pencahayaan pagi/senja/malam
│   ├── distance_fog.js         # Kabut jarak tropis
│   └── jakarta_materials.js
├── camera/
│   ├── walkthrough_camera_choreography.js  # Koreografi kamera per stop
│   ├── hero_finale_rig.js                  # Preset kamera showcase akhir
│   └── viewport_constraints.js
├── story/
│   └── chapters_monas.js       # Data 10 stop dwibahasa (ID/EN) + pose kamera
├── story_and_archive/          # Plakat museum & data walkthrough
├── ui/                         # Header museum, intro, timeline, drawer debug, token warna
├── portals/                    # Sistem portal foto arsip
├── perf/fps_and_drawcalls/     # Batching mesh, optimasi shader, bayangan & matriks
├── vendor/three/               # Three.js lokal (module + addons)
└── public/assets/aistudio/     # Dokumen PRD Monas 3D Experience
```

### 5 Zona Arsitektur

1. **Zone 1 — Fondasi & Museum**: pasak beton dan ruang museum bawah tanah 80 × 80 m
2. **Zone 2 — Cawan**: pelataran 45 × 45 m di ketinggian 17 m dan Ruang Kemerdekaan
3. **Zone 3 — Shaft & Puncak**: batang tugu berlapis marmer dan pelataran puncak 115 m
4. **Zone 4 — Lidah Api**: 77 bagian perunggu berlapis emas, 118–132 m
5. **Zone 5 — Falsework & Cranes**: perancah dan derek selama masa konstruksi

## 🎨 Identitas Visual

Tema **“Emas dan Langit Jakarta”** — sinematik dan dark-first:

- Biru malam `#0B1426` · Putih tulang `#F4EFE6` · Emas Lidah Api `#D4A93C`

## 📚 Sumber Sejarah

Narasi tiap stop merujuk pada Arsip UPK Monumen Nasional, Arsip Nasional Republik Indonesia (ANRI), dan data Cagar Budaya Kemendikbud. Angka yang masih berselisih antar sumber (misalnya berat lapisan emas Lidah Api dan jumlah pasti tiang pancang) ditandai apa adanya di dalam narasi sebagai catatan arsip.

Dokumen perancangan lengkap ada di [`public/assets/aistudio/PRD___Monas_3D_Experience_c52c9f9d.md`](public/assets/aistudio/PRD___Monas_3D_Experience_c52c9f9d.md).

## 🙏 Kredit

- Dirancang & dibangun oleh **Lingga Nugraha** ([@lingga26](https://github.com/lingga26))
- Konsep pameran merupakan remix dari format pameran 3D menara bersejarah, diadaptasi penuh untuk Monumen Nasional: model, dunia, data, dan konten sejarah dibuat ulang berkarakter Indonesia
- Monas dirancang oleh Frederich Silaban & R.M. Soedarsono, dengan struktur melibatkan Ir. Roosseno
