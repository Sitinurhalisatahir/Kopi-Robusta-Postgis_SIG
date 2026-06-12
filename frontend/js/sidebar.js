/* ═══════════════════════════════════════════════════
   sidebar.js — Info Panel, Popup & Analisis Polygon
═══════════════════════════════════════════════════ */

// ── Tampilkan info kesesuaian saat klik peta ─────
async function showSuitabilityInfo(lat, lon) {
    const panel = document.getElementById('info-panel');
    panel.innerHTML = '<div class="spinner">⏳ Memuat data...</div>';

    try {
        const res = await fetch(`${API}/suitability?lat=${lat}&lon=${lon}`);

        if (!res.ok) {
            panel.innerHTML = '<p class="info-placeholder">Tidak ada data di titik ini.</p>';
            return;
        }

        const d = await res.json();

        // Warna badge kesesuaian
        const warna = SUITABILITY_COLORS[d.suai_lahan] || '#9e9e9e';
        const label = SUITABILITY_LABELS[d.suai_lahan] || d.suai_lahan;

        panel.innerHTML = `
      <div class="info-row">
        <span class="info-label">Desa</span>
        <span class="info-value">${d.desa || '-'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Kecamatan</span>
        <span class="info-value">${d.kecamatan || '-'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Kesesuaian</span>
        <span class="info-value">
          <span class="badge" style="background:${warna}">
            ${d.suai_lahan} — ${label}
          </span>
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Pembatas</span>
        <span class="info-value">${d.pembatas || '-'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">pH Tanah</span>
        <span class="info-value">${d.ph || '-'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Tekstur</span>
        <span class="info-value">${d.tekstur || '-'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Drainase</span>
        <span class="info-value">${d.drainase || '-'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Curah Hujan</span>
        <span class="info-value">${d.curah_hujan || '-'} mm/th</span>
      </div>
      <div class="info-row">
        <span class="info-label">Kemiringan</span>
        <span class="info-value">${d.kemiringan || '-'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Pola Ruang</span>
        <span class="info-value">${d.pola_ruang || '-'}</span>
      </div>
    `;

    } catch (err) {
        panel.innerHTML = '<p class="info-placeholder">Gagal memuat data.</p>';
        console.error('Error suitability:', err);
    }
}

// ── Tombol Analisis Polygon ───────────────────────
document.getElementById('btn-analyze').addEventListener('click', async() => {
    if (!drawnPolygon) {
        alert('Gambar polygon dulu di peta menggunakan tool polygon! 🖊');
        return;
    }

    const section = document.getElementById('analyze-section');
    const result = document.getElementById('analyze-result');
    const total = document.getElementById('analyze-total');

    section.style.display = 'block';
    result.innerHTML = '<div class="spinner">⏳ Menghitung luas area...</div>';
    total.innerHTML = '';

    try {
        const res = await fetch(`${API}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ geometry: drawnPolygon })
        });

        const data = await res.json();

        if (!data.length) {
            result.innerHTML = '<p class="info-placeholder">Tidak ada data kesesuaian di area ini.</p>';
            return;
        }

        // Hitung total luas
        const totalHa = data.reduce((sum, r) => sum + parseFloat(r.luas_ha || 0), 0);

        // Render bar per kelas
        let html = '';
        data.forEach((r) => {
            const pct = totalHa > 0 ? (r.luas_ha / totalHa * 100).toFixed(1) : 0;
            const warna = SUITABILITY_COLORS[r.suai_lahan] || '#9e9e9e';
            const label = SUITABILITY_LABELS[r.suai_lahan] || r.suai_lahan;

            html += `
        <div class="result-bar">
          <div class="result-label">
            <span style="color:${warna};font-weight:700">${r.suai_lahan} — ${label}</span>
            <span>${r.luas_ha} ha (${pct}%)</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%;background:${warna}"></div>
          </div>
        </div>
      `;
        });

        result.innerHTML = html;
        total.innerHTML = `Total area: <strong>${totalHa.toFixed(2)} ha</strong>`;

        // Scroll sidebar ke hasil
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
        result.innerHTML = '<p class="info-placeholder">Gagal menghitung analisis.</p>';
        console.error('Error analyze:', err);
    }
});

// ── Tombol Export CSV ─────────────────────────────
document.getElementById('btn-export').addEventListener('click', () => {
    window.open(`${API}/export/csv`, '_blank');
});