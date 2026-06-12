from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import csv
import io

app = Flask(__name__)
CORS(app)
DB_CONFIG = {
    "host"    : "localhost",
    "port"    : 5432,
    "dbname"  : "sigweb_kopi_robusa",
    "user"    : "postgres",
    "password": "postgres123"
}

LAYER_ALLOWED = [
    "tanaman_kopi_robusta",
    "administrasi_wilayah",
    "curah_hujan",
    "kemiringan_lerang",
    "pola_ruang"
]

def get_conn():
    """Buat koneksi ke PostgreSQL"""
    return psycopg2.connect(**DB_CONFIG)

#  ENDPOINT 1 — Daftar semua layer
#  GET /layers

@app.route("/layers")
def get_layers():
    return jsonify([
        {"name": "tanaman_kopi_robusta", "label": "Kesesuaian Lahan Kopi Robusta"},
        {"name": "administrasi_wilayah", "label": "Administrasi Wilayah"},
        {"name": "curah_hujan",          "label": "Curah Hujan"},
        {"name": "kemiringan_lerang",    "label": "Kemiringan Lereng"},
        {"name": "pola_ruang",           "label": "Pola Ruang"},
    ])


# ═══════════════════════════════════════════
#  ENDPOINT 2 — Ambil GeoJSON per layer
#  GET /layer/<nama>/geojson
# ═══════════════════════════════════════════
@app.route("/layer/<nama>/geojson")
def get_layer(nama):
    if nama not in LAYER_ALLOWED:
        return jsonify({"error": "Layer tidak ditemukan"}), 404

    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(f"""
            SELECT ST_AsGeoJSON(ST_MakeValid(wkb_geometry)) AS geom, *
            FROM {nama}
            LIMIT 3000
        """)
        rows = cur.fetchall()

    features = []
    for row in rows:
        geom  = json.loads(row["geom"])
        props = {k: v for k, v in row.items()
                    if k not in ("geom", "wkb_geometry", "ogc_fid")}
        features.append({
            "type"      : "Feature",
            "geometry"  : geom,
            "properties": props
        })

    return jsonify({"type": "FeatureCollection", "features": features})

#  ENDPOINT 3 — Info klik titik di peta
#  GET /suitability?lat=...&lon=...

@app.route("/suitability")
def suitability():
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)

    if not lat or not lon:
        return jsonify({"error": "Parameter lat dan lon wajib diisi"}), 400

    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT
                k.suai_lahan,
                k.pembatas,
                k.ph,
                k.tekstur,
                k.drainase,
                k.kedalaman_tanah,
                w.wadmkd  AS desa,
                w.wadmkc  AS kecamatan,
                ch.ch     AS curah_hujan,
                km.kl     AS kemiringan,
                pr.namobj AS pola_ruang
            FROM tanaman_kopi_robusta k
            LEFT JOIN administrasi_wilayah w
                ON ST_Contains(w.wkb_geometry,
                    ST_SetSRID(ST_MakePoint(%s, %s), 4326))
            LEFT JOIN curah_hujan ch
                ON ST_Contains(ch.wkb_geometry,
                    ST_SetSRID(ST_MakePoint(%s, %s), 4326))
            LEFT JOIN kemiringan_lerang km
                ON ST_Contains(km.wkb_geometry,
                    ST_SetSRID(ST_MakePoint(%s, %s), 4326))
            LEFT JOIN pola_ruang pr
                ON ST_Contains(pr.wkb_geometry,
                    ST_SetSRID(ST_MakePoint(%s, %s), 4326))
            WHERE ST_Contains(k.wkb_geometry,
                    ST_SetSRID(ST_MakePoint(%s, %s), 4326))
            LIMIT 1
        """, (lon, lat, lon, lat, lon, lat, lon, lat, lon, lat))

        result = cur.fetchone()

    if not result:
        return jsonify({"error": "Tidak ada data di titik ini"}), 404

    return jsonify(dict(result))


# ═══════════════════════════════════════════
#  ENDPOINT 4 — Analisis polygon gambar user
#  POST /analyze
#  Body: { "geometry": { GeoJSON geometry } }
# ═══════════════════════════════════════════
@app.route("/analyze", methods=["POST"])
def analyze():
    data        = request.get_json()
    geojson_str = json.dumps(data.get("geometry"))

    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT
                suai_lahan,
                ROUND(
                    SUM(
                        ST_Area(
                            ST_Intersection(
                                ST_MakeValid(wkb_geometry),
                                ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)
                            )::geography
                        ) / 10000
                    )::numeric, 2
                ) AS luas_ha
            FROM tanaman_kopi_robusta
            WHERE ST_Intersects(
                ST_MakeValid(wkb_geometry),
                ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)
            )
            GROUP BY suai_lahan
            ORDER BY suai_lahan
        """, (geojson_str, geojson_str))

        rows = cur.fetchall()

    return jsonify([dict(r) for r in rows])


# ═══════════════════════════════════════════
#  ENDPOINT 5 — Export hasil analisis ke CSV
#  GET /export/csv
# ═══════════════════════════════════════════
@app.route("/export/csv")
def export_csv():
    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT
                w.wadmkd  AS desa,
                w.wadmkc  AS kecamatan,
                k.suai_lahan,
                COUNT(*)  AS jumlah_polygon,
                ROUND(SUM(k.luas)::numeric, 2) AS total_luas_ha
            FROM tanaman_kopi_robusta k
            JOIN administrasi_wilayah w
                ON ST_Intersects(k.wkb_geometry, w.wkb_geometry)
            GROUP BY w.wadmkd, w.wadmkc, k.suai_lahan
            ORDER BY desa, suai_lahan
        """)
        rows = cur.fetchall()

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=[
        "desa", "kecamatan", "suai_lahan",
        "jumlah_polygon", "total_luas_ha"
    ])
    writer.writeheader()
    writer.writerows(rows)

    return Response(
        buffer.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=analisis_kopi_robusta.csv"}
    )

if __name__ == "__main__":
    print("=" * 50)
    print("  SIG Web — Kesesuaian Lahan Kopi Robusta")
    print("  Server berjalan di http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)