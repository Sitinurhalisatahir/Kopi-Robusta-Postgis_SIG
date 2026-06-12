/* ═══════════════════════════════════════════════════
   map.js — Inisialisasi Peta Leaflet
═══════════════════════════════════════════════════ */

// ── Inisialisasi Peta ────────────────────────────
const map = L.map('map', {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    zoomControl: false
});

// ── Zoom Control (pojok kanan atas) ──────────────
L.control.zoom({ position: 'topright' }).addTo(map);

// ── Basemap OpenStreetMap ─────────────────────────
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19
}).addTo(map);

// ── Layer untuk polygon yang digambar user ───────
const drawnItems = new L.FeatureGroup().addTo(map);

// ── Leaflet Draw Control ─────────────────────────
const drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
        polygon: {
            shapeOptions: {
                color: '#D39858',
                fillColor: '#D39858',
                fillOpacity: 0.2,
                weight: 2
            }
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false
    },
    edit: {
        featureGroup: drawnItems
    }
}).addTo(map);

// ── Simpan polygon terakhir yang digambar ─────────
let drawnPolygon = null;

map.on(L.Draw.Event.CREATED, (e) => {
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);
    drawnPolygon = e.layer.toGeoJSON().geometry;
});

// ── Klik peta → tampil info di sidebar ───────────
map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    showSuitabilityInfo(lat, lng);
});