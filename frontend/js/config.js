/* ═══════════════════════════════════════════════════
   config.js — Konfigurasi Global RobustaGIS
   File ini dibaca pertama sebelum file JS lainnya
═══════════════════════════════════════════════════ */

// ── URL Backend Flask ────────────────────────────
const API = 'http://localhost:5000';

// ── Warna Kelas Kesesuaian Lahan ─────────────────
const SUITABILITY_COLORS = {
    'S1': '#2d7d32', // Sangat Sesuai    → hijau tua
    'S2': '#f9a825', // Cukup Sesuai     → kuning
    'S3': '#e65100', // Sesuai Bersyarat → oranye
    'N': '#b71c1c', // Tidak Sesuai     → merah
    '-': '#9e9e9e' // Tidak Terklasifikasi → abu
};

// ── Label Kelas Kesesuaian ───────────────────────
const SUITABILITY_LABELS = {
    'S1': 'Sangat Sesuai',
    'S2': 'Cukup Sesuai',
    'S3': 'Sesuai Bersyarat',
    'N': 'Tidak Sesuai',
    '-': 'Tidak Terklasifikasi'
};

// ── Definisi Layer ───────────────────────────────
const LAYER_CONFIG = [{
        id: 'lyr-kesesuaian',
        nama: 'tanaman_kopi_robusta',
        label: 'Kesesuaian Lahan Kopi Robusta',
        checked: true,
        getStyle: (feature) => ({
            fillColor: SUITABILITY_COLORS[feature.properties.suai_lahan] || '#9e9e9e',
            fillOpacity: 0.7,
            color: '#ffffff',
            weight: 0.3
        })
    },
    {
        id: 'lyr-wilayah',
        nama: 'administrasi_wilayah',
        label: 'Administrasi Wilayah',
        checked: false,
        getStyle: () => ({
            fillColor: '#5c85d6',
            fillOpacity: 0.1,
            color: '#5c85d6',
            weight: 1.5
        })
    },
    {
        id: 'lyr-curah',
        nama: 'curah_hujan',
        label: 'Curah Hujan',
        checked: false,
        getStyle: (feature) => ({
            fillColor: feature.properties.warna || '#29b6f6',
            fillOpacity: 0.5,
            color: '#0d47a1',
            weight: 0.5
        })
    },
    {
        id: 'lyr-lereng',
        nama: 'kemiringan_lerang',
        label: 'Kemiringan Lereng',
        checked: false,
        getStyle: (feature) => ({
            fillColor: feature.properties.warna || '#ff8f00',
            fillOpacity: 0.5,
            color: '#e65100',
            weight: 0.3
        })
    },
    {
        id: 'lyr-pola',
        nama: 'pola_ruang',
        label: 'Pola Ruang',
        checked: false,
        getStyle: () => ({
            fillColor: '#ab47bc',
            fillOpacity: 0.25,
            color: '#6a1b9a',
            weight: 0.5
        })
    }
];

// ── Koordinat Pusat Peta ─────────────────────────
const MAP_CENTER = [-4.5, 119.8];
const MAP_ZOOM = 10;

// ── Warna Tema UI (coffee palette) ───────────────
const THEME = {
    champagne: '#EACEAA',
    honeyGarlic: '#85431E',
    whiskeySour: '#D39858',
    burntCoffee: '#34150F',
    balsamico: '#150C0C'
};