/* ═══════════════════════════════════════════════════
   layers.js — Load & Toggle Layer GeoJSON
═══════════════════════════════════════════════════ */

// ── Simpan layer yang sudah di-load ──────────────
const loadedLayers = {};

// ── Load layer dari API ───────────────────────────
async function loadLayer(config) {
    // Kalau sudah pernah di-load, langsung return
    if (loadedLayers[config.nama]) return;

    try {
        // Tampilkan loading di sidebar
        const checkbox = document.getElementById(config.id);
        if (checkbox) checkbox.disabled = true;

        const res = await fetch(`${API}/layer/${config.nama}/geojson`);
        const data = await res.json();

        const layer = L.geoJSON(data, {
            style: config.getStyle,
            onEachFeature: (feature, lyr) => {
                // Klik polygon → info di sidebar
                lyr.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    const { lat, lng } = e.latlng;
                    showSuitabilityInfo(lat, lng);
                });

                // Hover highlight
                lyr.on('mouseover', () => {
                    if (config.nama === 'tanaman_kopi_robusta') {
                        lyr.setStyle({ weight: 1.5, color: '#EACEAA' });
                    }
                });
                lyr.on('mouseout', () => {
                    layer.resetStyle(lyr);
                });
            }
        });

        loadedLayers[config.nama] = layer;

        if (checkbox) checkbox.disabled = false;

        // Load chart setelah kesesuaian lahan berhasil di-load
        if (config.nama === 'tanaman_kopi_robusta') {
            buildChart(data);
        }

    } catch (err) {
        console.error(`Gagal load layer ${config.nama}:`, err);
    }
}

// ── Toggle layer on/off ───────────────────────────
async function toggleLayer(config, isChecked) {
    if (isChecked) {
        // Load dulu kalau belum ada
        if (!loadedLayers[config.nama]) {
            await loadLayer(config);
        }
        if (loadedLayers[config.nama]) {
            loadedLayers[config.nama].addTo(map);
        }
    } else {
        if (loadedLayers[config.nama]) {
            map.removeLayer(loadedLayers[config.nama]);
        }
    }
}

// ── Setup semua checkbox ──────────────────────────
function setupLayerControls() {
    LAYER_CONFIG.forEach((config) => {
        const checkbox = document.getElementById(config.id);
        if (!checkbox) return;

        // Event listener checkbox
        checkbox.addEventListener('change', () => {
            toggleLayer(config, checkbox.checked);
        });

        // Auto-load layer yang checked by default
        if (config.checked) {
            toggleLayer(config, true);
        }
    });
}

// ── Jalankan setup saat halaman siap ─────────────
document.addEventListener('DOMContentLoaded', setupLayerControls);