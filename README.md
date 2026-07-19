# Analisis Perubahan Vegetasi IKN (Ibu Kota Nusantara)

Proyek UAS Kapita Selekta Sistem Informasi — menganalisis perubahan tutupan vegetasi di wilayah IKN antara April 2024 dan April 2026 menggunakan citra Sentinel-2, Random Forest, dan WebGIS interaktif.

## 👥 Anggota Kelompok
| Nama | NIM | Tugas |
|---|---|---|
| Najma Khonsa Tsabita | - | Ground Truth & Preprocessing Citra |
| Agnesia Nadya Tassi | - | Ground Truth & Preprocessing Citra |
| Fadel Setiawan Arifin | - | Training Random Forest & Evaluasi |
| Chalimatus Sa'Diyyah | - | Training Random Forest & Evaluasi |
| Muhammad Ridho Azfa Karani | - | WebGIS |

## 🌍 Wilayah & Objek Target
- **Wilayah Studi**: Ibu Kota Nusantara (IKN), Kalimantan Timur
- **Objek Target**: Vegetasi (Kelas 1) vs Non-Vegetasi (Kelas 0)
- **Periode Analisis**: April 2024 vs April 2026

## ❓ Rumusan Masalah
Apakah pembangunan IKN masih mempertahankan karakter sebagai *Green Forest City*, dilihat dari perubahan tutupan vegetasi antara tahun 2024 dan 2026?

## 🛠️ Metodologi
- **Sumber Data**: Sentinel-2 Surface Reflectance Harmonized (`COPERNICUS/S2_SR_HARMONIZED`)
- **Band & Indeks**: B2, B3, B4, B8, B11, B12, ditambah indeks NDVI (Vegetasi) dan NDBI (Bangunan)
- **Cloud Masking**: Scene Classification Layer (SCL) kelas 3, 8, 9, 10, 11
- **Periode Citra**: April 2024 vs April 2026 (dipilih berdasarkan eksplorasi tutupan awan terendah)
- **Ground Truth**: 400 titik manual (200 per tahun, seimbang 100 target/100 non-target), disebar di seluruh AOI
- **Klasifikasi**: smileRandomForest (100 Trees, Seed 42, Split 80:20)
- **Metrik Evaluasi**: Accuracy, Precision, Recall, F1-score pada 20% data testing (77 titik)

## 🌐 Akses WebGIS
Aplikasi WebGIS interaktif dapat diakses pada tautan berikut:
🔗 **[Link WebGIS Interaktif](webgis/index.html)** *(Akses lokal lewat web server / GitHub Pages)*

## 📂 Struktur Folder
```
├── gee/
│   ├── preprocessing_ground_truth.js   # Script GEE untuk komposit citra dan cloud masking
│   ├── random_forest.js                # Script pelatihan model, split 80/20, & klasifikasi raster
│   └── change_analysis.js              # Script matriks evaluasi, change detection, & ekspor GeoJSON
├── webgis/
│   ├── index.html                      # Layout utama WebGIS 4-Tab wajib
│   ├── style.css                       # Styling antarmuka premium vanilla CSS
│   └── script.js                       # Logika Leaflet map, opacity slider, & filter layer
├── data/
│   ├── boundary_ikn/                   # Kumpulan berkas shapefile asli batas IKN
│   ├── GroundTruth_IKN.csv             # Data titik ground truth lapangan asli
│   ├── boundary_kota.geojson           # Hasil ekspor batas wilayah IKN (GeoJSON)
│   ├── building_2024.geojson           # Hasil ekspor vegetasi tahun 2024 (GeoJSON)
│   ├── building_2026.geojson           # Hasil ekspor vegetasi tahun 2026 (GeoJSON)
│   ├── change_gain.geojson             # GeoJSON area pertambahan vegetasi baru
│   └── change_loss.geojson             # GeoJSON area pengurangan vegetasi
├── results/
│   ├── confusion_matrix.csv            # Tabel matriks kesalahan (2x2) dari data testing 20%
│   └── area_statistics.json            # Rekap luas perubahan area (ha) & metrik APRF
├── report/
│   └── Laporan_Akhir.pdf               # Berkas laporan PDF resmi
└── README.md                           # Berkas dokumentasi utama proyek
```
