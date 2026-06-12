let chartInstance = null;

// ── Build chart dari data GeoJSON ─────────────────
function buildChart(geojsonData) {
    const totals = { 'S1': 0, 'S2': 0, 'S3': 0, 'N': 0, '-': 0 };

    // Hitung total luas per kelas
    geojsonData.features.forEach((f) => {
        const kelas = f.properties.suai_lahan;
        const luas = parseFloat(f.properties.luas) || 0;
        if (totals[kelas] !== undefined) {
            totals[kelas] += luas;
        }
    });

    // Filter kelas yang ada datanya
    const labels = Object.keys(totals).filter(k => totals[k] > 0);
    const values = labels.map(k => parseFloat(totals[k].toFixed(2)));
    const colors = labels.map(k => SUITABILITY_COLORS[k]);

    const ctx = document.getElementById('chart-kesesuaian').getContext('2d');

    // Hapus chart lama kalau ada
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(k => `${k} — ${SUITABILITY_LABELS[k]}`),
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: '#150C0C',
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#EACEAA',
                        font: { size: 10 },
                        padding: 8,
                        boxWidth: 12,
                        boxHeight: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const val = ctx.parsed;
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = (val / total * 100).toFixed(1);
                            return ` ${val.toFixed(2)} ha (${pct}%)`;
                        }
                    },
                    backgroundColor: '#34150F',
                    titleColor: '#D39858',
                    bodyColor: '#EACEAA',
                    borderColor: '#85431E',
                    borderWidth: 1
                }
            }
        }
    });
}