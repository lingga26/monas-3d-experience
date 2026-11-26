/**
 * Monas 3D Experience — Bilingual Historical Chapters & Walkthrough Data (`story/chapters_monas.js`)
 *
 * 10 chronological stops (`0..9`) across the conception, foundation, basement museum,
 * Cawan terrace, marble obelisk, gilded Lidah Api flame, and modern Medan Merdeka showcase.
 *
 * Languages: Indonesian (`id`, default) and English (`en`).
 */

export const EXHIBITION_BRAND = {
  id: {
    title: 'Monumen Nasional',
    subtitle: 'Jakarta · Konstruksi 1961–1975',
    badge: 'Pameran Arsitektur 3D',
    veilEyebrow: 'Jakarta · Medan Merdeka · 1961–1975',
    veilTitle: 'Monumen Nasional',
  },
  en: {
    title: 'National Monument',
    subtitle: 'Jakarta · Construction 1961–1975',
    badge: '3D Architectural Exhibition',
    veilEyebrow: 'Jakarta · Medan Merdeka · 1961–1975',
    veilTitle: 'National Monument (Monas)',
  },
};

export const MONAS_STOPS = [
  {
    index: 0,
    id: 'stop-01-gagasan',
    step: 0.0,
    date: { id: '1954–1961', en: '1954–1961' },
    yearKeyword: { id: '1954', en: '1954' },
    title: {
      id: 'Gagasan Tugu Kemerdekaan',
      en: 'Vision of the National Monument',
    },
    subtitle: {
      id: 'Sayembara dan Rancangan Lingga Yoni',
      en: 'Design Competition and Architectural Form',
    },
    elevation: {
      id: 'Rencana 132 m · Desain Frederich Silaban & R.M. Soedarsono',
      en: '132 m Plan · Designed by Frederich Silaban & R.M. Soedarsono',
    },
    narrative: {
      id: 'Gagasan pembangunan tugu peringatan kemerdekaan Republik Indonesia muncul pada pertengahan 1950-an di jantung Lapangan Medan Merdeka. Setelah dua kali sayembara desain nasional, rancangan akhir memadukan bentuk alu-lesung atau lingga-yoni karya Frederich Silaban dan R.M. Soedarsono dengan tata struktur melibatkan Ir. Roosseno.',
      en: 'The vision for a monument honoring Indonesian independence emerged in the mid-1950s at the center of Medan Merdeka Square. Following two national competitions, the final scheme unified mortar-and-pestle (lingga-yoni) symbolism developed by Frederich Silaban and R.M. Soedarsono with structural engineering involving Ir. Roosseno.',
    },
    source: {
      id: 'Sumber: Arsip UPK Monas & Kemendikbud Cagar Budaya',
      en: 'Source: UPK Monas Archive & Ministry of Education Cultural Heritage',
    },
    camera: {
      desktop: { pos: [118, 34, 174], target: [0, 34, 0], fov: 44 },
      mobile: { pos: [138, 42, 224], target: [0, 30, 0], fov: 52 },
    },
  },
  {
    index: 1,
    id: 'stop-02-beton-pertama',
    step: 1.0,
    date: { id: '17 Agustus 1961', en: 'August 17, 1961' },
    yearKeyword: { id: '1961', en: '1961' },
    title: {
      id: 'Peletakan Beton Pertama',
      en: 'First Concrete Pour',
    },
    subtitle: {
      id: 'Peresmian Proyek di Medan Merdeka',
      en: 'Project Groundbreaking at Medan Merdeka',
    },
    elevation: {
      id: '0 m · Tapak Lapangan Medan Merdeka',
      en: '0 m · Medan Merdeka Ground Level',
    },
    narrative: {
      id: 'Bertepatan dengan peringatan Hari Kemerdekaan 17 Agustus 1961, Presiden Sukarno menancapkan pasak pertama dan mengawali pengecoran beton awal di pusat Medan Merdeka. Tapak konstruksi disiapkan untuk menopang beban masif tugu setinggi 132 meter di atas tanah aluvial Jakarta.',
      en: 'On Independence Day, August 17, 1961, President Sukarno initiated the first pile driving and concrete pour at the center of Medan Merdeka. The central pad was staked and cleared to carry the immense load of a 132-meter monument across Jakarta’s alluvial soil.',
    },
    source: {
      id: 'Sumber: Arsip Nasional Republik Indonesia (ANRI) & UPK Monas',
      en: 'Source: National Archives of Indonesia (ANRI) & UPK Monas',
    },
    camera: {
      desktop: { pos: [62, 22, 86], target: [0, 2, 0], fov: 42 },
      mobile: { pos: [74, 28, 110], target: [0, 2, 0], fov: 50 },
    },
  },
  {
    index: 2,
    id: 'stop-03-pasak-pondasi',
    step: 2.0,
    date: { id: 'Sekitar Maret 1962', en: 'c. March 1962' },
    yearKeyword: { id: '1962', en: '1962' },
    title: {
      id: 'Pemancangan Pasak Pondasi',
      en: 'Foundation Pile Driving',
    },
    subtitle: {
      id: 'Ratusan Tiang Pancang Beton',
      en: 'Deep Reinforced Concrete Piles',
    },
    elevation: {
      id: '284 pasak tugu · 360 pasak museum (catatan arsip)',
      en: '284 tower piles · 360 museum piles (archival record)',
    },
    narrative: {
      id: 'Sebelum struktur utama naik, tim konstruksi memancang ratusan tiang beton bertulang menembus lapisan tanah lunak. Catatan pembangunan menyebut sekitar 284 tiang pancang khusus menopang badan tugu dan sekitar 360 tiang lainnya mengamankan bangunan museum di sekelilingnya.',
      en: 'Before the superstructure rose, crews drove hundreds of reinforced concrete piles deep through soft clay strata. Archival accounts record approximately 284 foundation piles under the central obelisk core and roughly 360 piles supporting the surrounding subterranean museum footprint.',
    },
    source: {
      id: 'Sumber: Dokumentasi Teknik Proyek Monas (angka tiang berdasar catatan tunggal)',
      en: 'Source: Monas Engineering Documentation (pile count from single archival account)',
    },
    camera: {
      desktop: { pos: [54, 18, 72], target: [0, 0, 0], fov: 40 },
      mobile: { pos: [68, 24, 96], target: [0, 0, 0], fov: 48 },
    },
  },
  {
    index: 3,
    id: 'stop-04-museum-bawah-tanah',
    step: 3.0,
    date: { id: '1962–1963', en: '1962–1963' },
    yearKeyword: { id: '1963', en: '1963' },
    title: {
      id: 'Ruang Museum Bawah Tanah',
      en: 'Subterranean History Museum',
    },
    subtitle: {
      id: 'Aula 80 × 80 Meter di Bawah Pelataran',
      en: '80 × 80 m Underground Chamber',
    },
    elevation: {
      id: '80 × 80 m · Kedalaman ±3 m bawah tanah',
      en: '80 × 80 m · Approx. 3 m below plaza grade',
    },
    narrative: {
      id: 'Di bawah pelataran utama dibangun ruang luas berukuran 80 × 80 meter pada kedalaman sekitar 3 meter di bawah permukaan tanah. Ruang ini kelak menjadi Museum Sejarah Nasional dengan koridor berkolom beton lebar untuk menampung rangkaian diorama sejarah Indonesia.',
      en: 'Beneath the main plaza, crews excavated and poured an expansive 80 × 80 meter subterranean chamber roughly 3 meters below ground level. This hall later housed the National History Museum, framed by heavy concrete piers supporting the upper terrace.',
    },
    source: {
      id: 'Sumber: Data Teknis UPK Monumen Nasional',
      en: 'Source: UPK Monumen Nasional Technical Records',
    },
    camera: {
      desktop: { pos: [68, 26, 84], target: [0, -1, 0], fov: 42 },
      mobile: { pos: [84, 34, 112], target: [0, -1, 0], fov: 50 },
    },
  },
  {
    index: 4,
    id: 'stop-05-tugu-dan-cawan',
    step: 4.0,
    date: { id: '1963–1964', en: '1963–1964' },
    yearKeyword: { id: '1964', en: '1964' },
    title: {
      id: 'Batang Tugu dan Cawan',
      en: 'Obelisk Core and Chalice Terrace',
    },
    subtitle: {
      id: 'Simbolisme Angka Proklamasi 17-8-45',
      en: 'Proportions of August 17, 1945',
    },
    elevation: {
      id: 'Cawan 45 × 45 m · Tinggi 17 m · Poros beton naik',
      en: 'Chalice 45 × 45 m · 17 m high · Rising concrete shaft',
    },
    narrative: {
      id: 'Pengecoran inti beton tugu naik berdampingan dengan struktur pelataran cawan yang melebar keluar. Ukuran cawan dirancang bujur sangkar 45 × 45 meter pada ketinggian 17 meter dengan delapan komposisi rusuk bangunan—merujuk langsung tanggal Proklamasi 17 Agustus 1945.',
      en: 'The reinforced concrete obelisk rose upward alongside the flaring chalice deck. Measuring 45 × 45 meters at an elevation of 17 meters with an eight-bay composition, the Cawan geometry directly encodes Indonesia’s Independence Day, 17-8-1945.',
    },
    source: {
      id: 'Sumber: Kemendikbud Cagar Budaya & Arsip Monas',
      en: 'Source: Ministry of Education Cultural Heritage & Monas Archive',
    },
    camera: {
      desktop: { pos: [88, 38, 126], target: [0, 38, 0], fov: 44 },
      mobile: { pos: [110, 44, 168], target: [0, 34, 0], fov: 52 },
    },
  },
  {
    index: 5,
    id: 'stop-06-marmer-dan-lift',
    step: 5.0,
    date: { id: '1965–1969', en: '1965–1969' },
    yearKeyword: { id: '1966', en: '1966' },
    title: {
      id: 'Pelapisan Marmer dan Lift',
      en: 'Marble Sheathing and Elevator',
    },
    subtitle: {
      id: 'Pelataran Puncak pada Ketinggian 115 Meter',
      en: 'Observation Deck at 115 Meters',
    },
    elevation: {
      id: 'Pelataran Puncak 11 × 11 m · 115 m · Lift 7 orang',
      en: 'Summit Deck 11 × 11 m · 115 m · 7-person lift',
    },
    narrative: {
      id: 'Struktur beton kasar dilapisi lempeng marmer berwarna gading agar tahan cuaca tropis sekaligus memantulkan cahaya matahari Jakarta. Di dalam poros tugu dipasang lift berkapasitas sekitar 7 penumpang menuju Pelataran Puncak berukuran 11 × 11 meter untuk sekitar 50 pengunjung.',
      en: 'Crews clad the raw concrete tower in cream-toned marble slabs chosen for tropical durability and crisp daylight reflection. Inside the central shaft, an elevator carrying around 7 passengers was fitted to reach the 11 × 11 meter Pelataran Puncak viewing deck for roughly 50 visitors.',
    },
    source: {
      id: 'Sumber: UPK Monas & Catatan Pemugaran Jakarta',
      en: 'Source: UPK Monas & Jakarta Heritage Records',
    },
    camera: {
      desktop: { pos: [42, 108, 62], target: [0, 102, 0], fov: 38 },
      mobile: { pos: [54, 104, 82], target: [0, 96, 0], fov: 48 },
    },
  },
  {
    index: 6,
    id: 'stop-07-lidah-api',
    step: 6.0,
    date: { id: '1965–1971', en: '1965–1971' },
    yearKeyword: { id: '1970', en: '1970' },
    title: {
      id: 'Perakitan Lidah Api Emas',
      en: 'Gilded Bronze Flame Assembly',
    },
    subtitle: {
      id: '77 Bagian Perunggu di Puncak 132 Meter',
      en: '77 Cast Bronze Sections at 132 Meters',
    },
    elevation: {
      id: 'Tinggi 14 m · Diameter 6 m · 77 segmen perunggu (±14,5 ton)',
      en: 'Height 14 m · Diameter 6 m · 77 bronze sections (~14.5 t)',
    },
    narrative: {
      id: 'Di puncak pelataran dipasang mahkota lidah api setinggi 14 meter berdiameter 6 meter yang dirakit dari 77 bagian cor perunggu seberat sekitar 14,5 ton. Permukaannya dilapisi lembaran emas murni (berat total emas dicatat berbeda antar sumber arsip) sebagai lambang semangat yang tak kunjung padam.',
      en: 'Atop the summit pedestal sits a 14-meter-tall, 6-meter-wide flame assembled from 77 cast bronze pieces weighing roughly 14.5 metric tons. Its surface is gilded in pure gold leaf—exact gold tonnage varies across historical accounts—symbolizing enduring resolve.',
    },
    source: {
      id: 'Sumber: Arsip Konstruksi Monas (catatan variasi berat emas dipertahankan)',
      en: 'Source: Monas Construction Archive (archival gold weight variations noted)',
    },
    camera: {
      desktop: { pos: [24, 127, 34], target: [0, 125, 0], fov: 34 },
      mobile: { pos: [32, 126, 46], target: [0, 123, 0], fov: 44 },
    },
  },
  {
    index: 7,
    id: 'stop-08-tahap-akhir',
    step: 7.0,
    date: { id: 'Sekitar 1969–1976', en: 'c. 1969–1976' },
    yearKeyword: { id: '1972', en: '1972' },
    title: {
      id: 'Tahap Akhir dan Diorama',
      en: 'Final Stage and Museum Fit-Out',
    },
    subtitle: {
      id: 'Pembongkaran Perancah dan Penyelesaian Ruang',
      en: 'Scaffold Dismantling and Interior Completion',
    },
    elevation: {
      id: 'Ruang Kemerdekaan & 51 jendela diorama museum',
      en: 'Hall of Independence & Museum Diorama Wing',
    },
    narrative: {
      id: 'Derek menara dan perancah kerja berangsur diturunkan setelah pelapisan marmer selesai. Memasuki tahap akhir sekitar 1969 hingga 1976, pengerjaan berfokus pada Ruang Kemerdekaan di dalam cawan serta penataan koleksi diorama di Museum Sejarah Nasional di bawah pelataran.',
      en: 'Tower cranes and exterior scaffolding were dismantled as marble finishing wrapped up. During the final phase from roughly 1969 to 1976, craftwork shifted inside to the Hall of Independence within the chalice and historical dioramas across the underground museum.',
    },
    source: {
      id: 'Sumber: Kemendikbud & Laporan Tahap Akhir Monas',
      en: 'Source: Ministry of Education & Monas Final Phase Reports',
    },
    camera: {
      desktop: { pos: [56, 20, 78], target: [0, 16, 0], fov: 40 },
      mobile: { pos: [70, 24, 102], target: [0, 14, 0], fov: 48 },
    },
  },
  {
    index: 8,
    id: 'stop-09-peresmian',
    step: 8.0,
    date: { id: '12 Juli 1975', en: 'July 12, 1975' },
    yearKeyword: { id: '1975', en: '1975' },
    title: {
      id: 'Peresmian untuk Umum',
      en: 'Public Inauguration',
    },
    subtitle: {
      id: 'Gerbang Medan Merdeka Terbuka bagi Pengunjung',
      en: 'Medan Merdeka Opens to Visitors',
    },
    elevation: {
      id: 'Tinggi total 132 m · Dibuka resmi 12 Juli 1975',
      en: 'Total height 132 m · Publicly opened July 12, 1975',
    },
    narrative: {
      id: 'Setelah empat belas tahun pengerjaan sejak beton pertama 1961, Monumen Nasional resmi dibuka untuk masyarakat luas pada 12 Juli 1975. Masyarakat dapat menaiki pelataran cawan, memasuki Ruang Kemerdekaan, hingga menatap lanskap Jakarta dari Pelataran Puncak.',
      en: 'Fourteen years after its 1961 groundbreaking, the National Monument officially opened to the public on July 12, 1975. Citizens gained access to the Cawan terrace, the quiet Hall of Independence, and panoramic views across Jakarta from the 115-meter summit deck.',
    },
    source: {
      id: 'Sumber: Pengelola Kawasan Monas & Arsip DKI Jakarta',
      en: 'Source: Monas Management Unit & Jakarta Provincial Archive',
    },
    camera: {
      desktop: { pos: [92, 22, 144], target: [0, 48, 0], fov: 43 },
      mobile: { pos: [112, 28, 192], target: [0, 40, 0], fov: 52 },
    },
  },
  {
    index: 9,
    id: 'stop-10-showcase',
    step: 9.0,
    date: { id: 'Kini', en: 'Present Day' },
    yearKeyword: { id: 'Kini', en: 'Now' },
    title: {
      id: 'Showcase Monas 3D',
      en: 'Monas 3D Showcase',
    },
    subtitle: {
      id: 'Jelajahi Detail Arsitektur dan Taman Medan Merdeka',
      en: 'Explore Architectural Details and Medan Merdeka',
    },
    elevation: {
      id: '132 m · Jakarta Pusat · Pagi, Senja, dan Malam',
      en: '132 m · Central Jakarta · Morning, Dusk, and Night',
    },
    narrative: {
      id: 'Amati Monas secara utuh dari berbagai sudut atau pilih preset fokus di bawah untuk memeriksa lidah api berlapis emas, pelataran puncak 115 meter, geometri cawan 17 meter, hingga jalur aksial Medan Merdeka. Ganti waktu Pagi, Senja, atau Malam pada bilah atas.',
      en: 'Orbit the completed 132-meter monument freely or select a curated viewpoint below to inspect the gilded flame crown, 115-meter summit deck, 17-meter chalice geometry, and Medan Merdeka axial parklands. Switch between Morning, Dusk, and Night in the top bar.',
    },
    source: {
      id: 'Sumber: Rekonstruksi 3D Prosedural · Pameran Digital Monas',
      en: 'Source: Procedural 3D Reconstruction · Monas Digital Exhibition',
    },
    isShowcase: true,
    camera: {
      desktop: { pos: [108, 28, 178], target: [0, 56, 0], fov: 42 },
      mobile: { pos: [118, 32, 224], target: [0, 44, 0], fov: 52 },
    },
  },
];

export const SHOWCASE_PRESETS = [
  {
    id: 'overview',
    label: { id: 'Tampak Utuh', en: 'Overview' },
    camera: {
      desktop: { pos: [108, 28, 178], target: [0, 56, 0], fov: 42 },
      mobile: { pos: [118, 32, 224], target: [0, 44, 0], fov: 52 },
    },
  },
  {
    id: 'lidah_api',
    label: { id: 'Lidah Api', en: 'Lidah Api Flame' },
    camera: {
      desktop: { pos: [22, 126, 30], target: [-2, 125, 0], fov: 34 },
      mobile: { pos: [28, 124, 42], target: [0, 122, 0], fov: 44 },
    },
  },
  {
    id: 'pelataran_puncak',
    label: { id: 'Pelataran Puncak', en: 'Summit Deck' },
    camera: {
      desktop: { pos: [28, 114, 38], target: [-2, 113, 0], fov: 36 },
      mobile: { pos: [36, 112, 52], target: [0, 108, 0], fov: 46 },
    },
  },
  {
    id: 'cawan',
    label: { id: 'Pelataran Cawan', en: 'Cawan Chalice' },
    camera: {
      desktop: { pos: [52, 20, 68], target: [-4, 13, 0], fov: 38 },
      mobile: { pos: [66, 22, 92], target: [0, 10, 0], fov: 50 },
    },
  },
  {
    id: 'plaza',
    label: { id: 'Plaza Medan Merdeka', en: 'Medan Merdeka Plaza' },
    camera: {
      desktop: { pos: [85, 16, 118], target: [0, 26, 0], fov: 44 },
      mobile: { pos: [104, 18, 152], target: [0, 22, 0], fov: 54 },
    },
  },
];

export const MONAS_UI_COPY = {
  id: {
    exploreBtn: 'Jelajahi',
    introSubtitle: 'Pameran interaktif konstruksi Monumen Nasional Jakarta, dari pemancangan pasak beton 1961 hingga peresmian 1975.',
    prevStop: 'Sebelumnya',
    nextStop: 'Berikutnya',
    playWalkthrough: 'Putar',
    pauseWalkthrough: 'Jeda',
    restartTour: 'Ulang dari Awal',
    pureView: 'Fokus 3D',
    exitPureView: 'Tampilkan Panel',
    moods: {
      day: 'Pagi',
      dusk: 'Senja',
      night: 'Malam',
    },
    expandPlacard: 'Buka Catatan',
    collapsePlacard: 'Tutup',
    stopLabel: 'Tahap',
    ofLabel: 'dari',
    timelineAria: 'Linimasa konstruksi Monas',
    controlsHintAria: 'Petunjuk kontrol interaksi 3D',
    controlsHint: 'Klik & seret untuk memutar · Gulir untuk zoom · Seret kanan untuk geser',
  },
  en: {
    exploreBtn: 'Explore',
    introSubtitle: 'An interactive architectural journey through Jakarta’s National Monument, from the 1961 foundation pour to its 1975 opening.',
    prevStop: 'Previous',
    nextStop: 'Next',
    playWalkthrough: 'Play',
    pauseWalkthrough: 'Pause',
    restartTour: 'Return to Beginning',
    pureView: 'Pure View',
    exitPureView: 'Show Info',
    moods: {
      day: 'Morning',
      dusk: 'Dusk',
      night: 'Night',
    },
    expandPlacard: 'Read Story',
    collapsePlacard: 'Collapse',
    stopLabel: 'Stop',
    ofLabel: 'of',
    timelineAria: 'Monas construction timeline',
    controlsHintAria: '3D interaction controls hint',
    controlsHint: 'Click & drag to rotate · Scroll to zoom · Right-drag to pan',
  },
};
