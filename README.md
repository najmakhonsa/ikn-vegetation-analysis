# Analisis Perubahan Vegetasi IKN (Ibu Kota Nusantara)

Proyek UAS Kapita Selekta Sistem Informasi — menganalisis perubahan tutupan 
vegetasi di wilayah IKN antara April 2024 dan April 2026 menggunakan citra 
Sentinel-2, Random Forest, dan WebGIS interaktif.

## Anggota Kelompok
## Anggota Kelompok
| Nama | Tugas |
|---|---|
| Najma Khonsa Tsabita | Ground Truth & Preprocessing Citra |
| Agnesia Nadya Tassi | Ground Truth & Preprocessing Citra |
| Fadel Setiawan Arifin | Training Random Forest & Evaluasi |
| Chalimatus Sa'Diyyah | Training Random Forest & Evaluasi |
| Muhammad Ridho Azfa Karani | WebGIS & Laporan |

## Wilayah & Objek Target
- **Wilayah**: Ibu Kota Nusantara (IKN), Kalimantan Timur
- **Objek target**: Vegetasi (kelas 1) vs Non-vegetasi (kelas 0)
- **Periode**: April 2024 vs April 2026

## Rumusan Masalah
Apakah pembangunan IKN masih mempertahankan karakter sebagai Green Forest 
City, dilihat dari perubahan tutupan vegetasi antara 2024 dan 2026?

## Metodologi Singkat
- **Data**: Sentinel-2 Surface Reflectance Harmonized (COPERNICUS/S2_SR_HARMONIZED)
- **Band**: B2, B3, B4, B8, B11, B12 + indeks NDVI, NDBI
- **Cloud masking**: SCL band (kelas 3, 8, 9, 10, 11)
- **Periode citra**: April 2024 vs April 2026 (dipilih berdasarkan pengujian 
  cloud cover sistematis — lihat `gee/00_eksplorasi_periode_citra.js`)
- **Ground truth**: 400 titik manual (200 per tahun, seimbang 100 
  target/100 non-target), disebar di seluruh AOI
- **Model**: Random Forest (binary classification)
- **Evaluasi**: Accuracy, Precision, Recall, F1-score

## WebGIS
...

## Struktur Folder
