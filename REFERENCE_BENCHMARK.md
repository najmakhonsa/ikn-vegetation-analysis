# PEER BENCHMARK ANALYSIS — Pemetaan Perubahan Vegetasi Kota Mataram

> **Dokumen Referensi & Dokumentasi Benchmark Metodologi**  
> **Mata Kuliah**: Kapita Selekta Sistem Informasi &times; Maha Data — Universitas Bakrie  
> **Objek Referensi**: Proyek WebGIS Tim Kota Mataram (*Nabila, Femas, Fari, Adrian, Rega*)  
> **Repository Referensi**: `github.com/RegaUbakrie/mataramgisweb`  
> **Lokasi File Dokumen**: `apps/custom-enterprise/ibukotanusantara/REFERENCE_BENCHMARK.md`  

---

## 📌 1. Ikhtisar Tab 01: PETA HASIL (Visualisasi & Ringkasan Utama)

### A. Komponen Antarmuka Tab 01
* **Header & Tema**: Pilihan switcher tema (*Editorial* vs *Ultra*).
* **Artikel Latar Belakang**: Highlight berita *Lombok Post* mengenai isu "20 Persen Ruang Terbuka Hijau di Kota Mataram Sulit Dipenuhi" akibat alih fungsi lahan.
* **Grafik Batang Komparasi**: Visualisasi perbandingan persentase tutupan vegetasi 2024 (44,50%) vs 2025 (43,46%).
* **Kartu Ringkasan Metrik (KPI Banner)**:
  - **Luas Wilayah Kota Mataram**: 6.045,48 ha
  - **Vegetasi 2024**: 44,50%
  - **Vegetasi 2025**: 43,46%
  - **Perubahan Luas Vegetasi**: -2,33% (-62,69 ha)
  - **Penambahan Vegetasi (Gain)**: +139,66 ha
  - **Kehilangan Vegetasi (Loss)**: -202,35 ha
* **Peta Interaktif Leaflet (CartoDB Light / Satellite)**:
  - Batas Kota Mataram (Red Polygon Boundary).
  - Layer Control: Batas Kota, Prioritas Penanganan (Rank 1-6), Kecamatan (bertambah/berkurang), Vegetasi 2024, Vegetasi 2025, Penambahan Vegetasi, Kehilangan Vegetasi, Titik Ground Truth (640 titik).
* **Tabel Prioritas Penanganan per Kecamatan**:
  1. *Sekarbela* (Rank 1 — Prioritas Utama: -1,39%)
  2. *Sandubaya* (Rank 2 — Prioritas Tinggi: -1,30%)
  3. *Mataram* (Rank 3 — Prioritas Sedang: -1,28%)
  4. *Cakranegara* (Rank 4 — Prioritas Sedang: -0,78%)
  5. *Ampenan* (Rank 5 — Perlu Dipantau: -0,61%)
  6. *Selaparang* (Rank 6 — Kondisi Terjaga: +1,21%)

---

## 🛠️ 2. Ikhtisar Tab 02: DATA & PROSES (Transparansi Metodologi & Kode GEE)

### A. 10 Tahap Alur Pemrosesan (Pipeline Stream)

```mermaid
flowchart LR
    T1[01 Sentinel-2 & Cloud Mask] --> T2[02 Feature Stack NDVI + NDMI]
    T2 --> T3[03 Ground Truth Class 0/1 x Year]
    T3 --> T4[04 Split 60:40 Seed 12345]
    T4 --> T5[05 Random Forest 640 Trees]
    T5 --> T6[06 Evaluasi APRF Testing 40%]
    T6 --> T7[07 Change Detection]
    T7 --> T8[08 Land Cover Statistics]
    T8 --> T9[09 Summary & Export]
    T9 --> T10[10 Vector Export Gain/Loss SHP]
```

#### Rincian 10 Tahap Metodologi:
1. **01 Sentinel-2 & Cloud Mask**: Filter `COPERNICUS/S2_SR_HARMONIZED` (2024 vs 2025), masking bit QA60 (cloud bit 10, cirrus bit 11), cloudy pixel percentage < 20%, komposit median.
2. **02 Feature Stack NDVI + NDMI**: Ekstraksi 8 band/indeks: B2, B3, B4, B8, B11, B12, NDVI ($\frac{B8-B4}{B8+B4}$), dan NDMI ($\frac{B8-B11}{B8+B11}$).
3. **03 Ground Truth**: 640 titik digitasi manual (sebaran 6 kecamatan: Ampenan, Mataram, Cakranegara, Sekarbela, Selaparang, Sandubaya), kelas 1 (vegetasi) vs kelas 0 (non-vegetasi) per tahun 2024 & 2025.
4. **04 Training - Testing Split 60:40**: Pengacakan acak terstratifikasi (`seed: 12345`, `splitRatio: 0.6`) per kombinasi kelas × tahun.
5. **05 Random Forest Classification**: Model `smileRandomForest` dengan 640 Trees (`seed: 12345`, `bagFraction: 0.7`, `minLeafPopulation: 1`), menghasilkan raster klasifikasi 2024 & 2025.
6. **06 Evaluasi Model (Testing 40%)**: Pengujian pada 40% data independen untuk menghasilkan Confusion Matrix (TN, FP, FN, TP), Overall Accuracy, Kappa, Precision, Recall, dan F1-Score.
7. **07 Change Detection**: Pembentukan raster matriks perubahan (0=Tetap Non-Veg, 1=Gain, 2=Loss, 3=Tetap Veg) serta kalkulasi luas Gain (ha), Loss (ha), Stable (ha), Net Change (ha), dan % Perubahan.
8. **08 Land Cover Statistics**: Agregasi statistik luas tutupan lahan per tahun dan pembuatan grafik bar/line perbandingan luas vegetasi.
9. **09 Summary Statistics & Export**: Penyusunan `FeatureCollection` ringkasan statistik dan ekspor otomatis ke Google Drive dalam format CSV dan raster klasifikasi.
10. **10 Vector Export (SHP)**: Konversi raster perubahan menjadi vektor polygon Shapefile (`Gain_Vegetasi.shp`, `Loss_Vegetasi.shp`, `ChangeDetection_Area.shp`) dengan penyaringan noise pixel.

---

### B. Parameter Teknis Metodologi

| Parameter | Spesifikasi 2024 | Spesifikasi 2025 |
|---|---|---|
| **Koleksi Citra** | `COPERNICUS/S2_SR_HARMONIZED` | `COPERNICUS/S2_SR_HARMONIZED` |
| **Rentang Tanggal** | 2024-01-01 s/d 2024-12-31 | 2025-01-01 s/d 2025-12-31 |
| **Ambang Awan** | `CLOUDY_PIXEL_PERCENTAGE < 20` | `CLOUDY_PIXEL_PERCENTAGE < 20` |
| **Cloud Masking** | QA60 bitmask (cloud bit 10, cirrus bit 11) | QA60 bitmask (cloud bit 10, cirrus bit 11) |
| **Metode Komposit** | Median Composite | Median Composite |
| **Resolusi Analisis** | 10 m (native band Sentinel-2) | 10 m (native band Sentinel-2) |
| **Band Dasar** | B2, B3, B4, B8, B11, B12 | B2, B3, B4, B8, B11, B12 |
| **Indeks Spektral** | $\text{NDVI} = \frac{B8-B4}{B8+B4}$, $\text{NDMI} = \frac{B8-B11}{B8+B11}$ | $\text{NDVI} = \frac{B8-B4}{B8+B4}$, $\text{NDMI} = \frac{B8-B11}{B8+B11}$ |
| **Batas Administrasi** | Shapefile 50 Kelurahan / 6 Kecamatan Kota Mataram | Shapefile 50 Kelurahan / 6 Kecamatan Kota Mataram |
| **Split Train:Test** | 60:40 (Seed 12345) | 60:40 (Seed 12345) |
| **Algoritma Classifier** | `smileRandomForest` (640 Trees, bagFraction 0.7, minLeaf 1) | `smileRandomForest` (640 Trees, bagFraction 0.7, minLeaf 1) |

---

### C. Daftar Berkas Unduh Data & Skrip (13 Artifacts Inventory)

| Nama Berkas | Format | Ukuran | Deskripsi Konten |
|---|---|---|---|
| `Confusion_Matrix.csv` | CSV | ~1 KB | Confusion matrix evaluasi (TN, FP, FN, TP, Akurasi, Precision, Recall, F1, Kappa) — sumber Tab 03. |
| `Summary_Statistik_Mataram_2024_2025.csv` | CSV | ~1 KB | Ringkasan luas 2024/2025, gain, loss, net change — sumber Tab 01 & 04. |
| `ground_truth_mataram_2024_2025.csv` | CSV | ~28 KB | 640 titik ground truth (longitude, latitude, class 0/1, year). |
| `batas_kota.geojson` | GeoJSON | ~56 KB | Batas administrasi Kota Mataram (GADM level-4). |
| `kecamatan.geojson` | GeoJSON | ~145 KB | Batas 6 kecamatan Kota Mataram untuk agregasi spasial gain/loss. |
| `kecamatan_summary.json` | JSON | ~1 KB | Ringkasan penambahan & kehilangan vegetasi per kecamatan (panel prioritas). |
| `target_2024.geojson` | GeoJSON | ~751 KB | Poligon tutupan vegetasi hasil klasifikasi tahun 2024. |
| `target_2025.geojson` | GeoJSON | ~736 KB | Poligon tutupan vegetasi hasil klasifikasi tahun 2025. |
| `gain.geojson` | GeoJSON | ~806 KB | Poligon area yang berubah dari non-vegetasi menjadi vegetasi. |
| `loss.geojson` | GeoJSON | ~1,07 MB | Poligon area yang berubah dari vegetasi menjadi non-vegetasi. |
| `ground_truth.geojson` | GeoJSON | ~94 KB | 640 titik ground truth (training + testing) format spasial. |
| `stats.json` | JSON | ~1 KB | Statistik ringkasan kota & metrik evaluasi model. |
| `main_script.js` | JavaScript | ~25 KB | Skrip lengkap Google Earth Engine (Part 1 s/d Part 10). |

---

## 📊 3. Ikhtisar Tab 03: EVALUASI MODEL (Diagnostik & Metrik Akurasi)

### A. Matriks Kesalahan / Confusion Matrix (Data Testing, n = 278)

| Kelas Aktual \ Prediksi | Prediksi: Nonvegetasi (Kelas 0) | Prediksi: Vegetasi (Kelas 1) | Total Aktual |
|---|---|---|---|
| **Aktual: Nonvegetasi (Kelas 0)** | **135** (True Negative - TN) | **6** (False Positive - FP) | **141** |
| **Aktual: Vegetasi (Kelas 1)** | **2** (False Negative - FN) | **135** (True Positive - TP) | **137** |
| **Total Prediksi** | **137** | **141** | **278** |

> **Catatan Ground Truth**: Total titik awal = 640 titik (160 per kombinasi kelas & tahun). Evaluasi dihitung dari **278 sampel testing** yang berhasil dievaluasi (sebagian titik tidak terpakai karena tutupan awan atau data kosong). Data lengkap tersedia pada berkas `Confusion_Matrix.csv` (Tab 02).

---

### B. Metrik Evaluasi Performa Model

| Metrik Evaluasi | Nilai Persentase / Skor | Keterangan & Formula |
|---|---|---|
| **Overall Accuracy (Akurasi)** | **97,1%** | $\frac{TN + TP}{Total} = \frac{135 + 135}{278} = 97.12\%$ |
| **Presisi Vegetasi (Precision)** | **95,7%** | $\frac{TP}{TP + FP} = \frac{135}{135 + 6} = 95.74\%$ |
| **Recall Vegetasi (Sensitivitas)** | **98,5%** | $\frac{TP}{TP + FN} = \frac{135}{135 + 2} = 98.54\%$ |
| **F1-Score Vegetasi** | **97,1%** | $2 \times \frac{Precision \times Recall}{Precision + Recall} = 97.12\%$ |
| **Koefisien Kappa** | **0,942** | Kesepakatan model dengan ground truth sangat tinggi (mendekati 1,0). |

---

### C. Interpretasi Pola Kesalahan (Error Diagnostics)
1. **Tingkat Akurasi Sangat Tinggi**: Hanya terjadi 8 kesalahan klasifikasi dari 278 sampel data uji (6 False Positive dan 2 False Negative).
2. **Analisis 6 False Positive (FP = 6)**: Lahan nonvegetasi yang terklasifikasi sebagai vegetasi. Terjadi pada lahan kosong atau sawah kering dengan nilai NDVI menengah yang memiliki reflektansi mirip vegetasi jarang.
3. **Analisis 2 False Negative (FN = 2)**: Titik vegetasi tipis atau kecil yang piksel 10 m-nya bercampur (*pixel mixing*) dengan tutupan nonvegetasi di sekitarnya.
4. **Perbandingan Presisi vs Recall**: Presisi (95,7%) sedikit lebih rendah dari Recall (98,5%), menunjukkan model memiliki kecenderungan ringan mengoverestimasi luas vegetasi (lebih banyak FP daripada FN).
5. **Keandalan Kappa (0,942)**: Mengonfirmasi kesepakatan klasifikasi model dengan data ground truth jauh di atas tingkat kebetulan acak (*random chance*).

---

### D. Keterbatasan Model (Model Limitations)
1. **Bias Interpreting**: Akurasi tinggi dipengaruhi oleh ground truth yang diambil dari interpreter yang sama pada citra relatif bersih (tutupan awan < 20%), sehingga performa pada piksel batas/transisi kelas di lapangan berpotensi lebih rendah.
2. **Keterwakilan Sampel Awan**: Sebagian titik ground truth tidak terpakai dalam confusion matrix karena tertutup awan atau data kosong, sehingga area dengan tutupan awan persisten kurang terwakili dalam evaluasi.
3. **Batas Resolusi Spatial 10 m**: Resolusi 10 m Sentinel-2 belum dapat menangkap vegetasi individual berukuran sangat kecil (pohon tunggal atau kebun sempit < 100 m²).
4. **Variasi Musiman Pertanian**: Perbedaan waktu akuisisi citra antara tahun 2024 dan 2025 berpotensi menambah variasi nilai NDVI pada lahan pertanian musiman.
5. **Kebutuhan Validasi Lapangan**: Validasi lapangan (*field check*) tetap diperlukan untuk memastikan hasil klasifikasi konsisten dengan kondisi aktual di lapangan.

---

## 📈 4. Ikhtisar Tab 04: INSIGHT HASIL (Temuan Kebijakan & Analisis Lanjutan)

### A. Pernyataan Temuan Utama (Core Statement)
> *"Data menunjukkan tren yang konsisten: dalam satu tahun, Kota Mataram kehilangan vegetasi lebih banyak daripada yang berhasil ditambahkan, sehingga capaian target 30% ruang terbuka hijau (RTH) belum menunjukkan perbaikan."*

### B. Kartu Metrik Tutupan Lahan Kota Mataram
* **Luas Vegetasi 2024**: `2.689,97 ha`
* **Luas Vegetasi 2025**: `2.627,29 ha`
* **Perubahan Bersih (Net Change)**: `-62,69 ha`
* **% Perubahan Bersih**: `-2,33%`

---

### C. Penambahan & Kehilangan Vegetasi per Kecamatan (ha)

| Nama Kecamatan | Penambahan (Gain) | Kehilangan (Loss) | Selisih Bersih (Net) | Trend Spasial |
|---|---|---|---|---|
| **Sekarbela** | 18,2 ha | 33,5 ha | **-15,3 ha** | Kehilangan tertinggi (±33 ha), tekanan alih fungsi lahan |
| **Sandubaya** | 14,4 ha | 30,0 ha | **-15,6 ha** | Penurunan vegetasi signifikan di zona timur |
| **Mataram** | 14,3 ha | 27,5 ha | **-13,2 ha** | Kawasan pusat kota, pembangunan fisik padat |
| **Ampenan** | 17,5 ha | 23,0 ha | **-5,5 ha** | Penurunan relatif kecil di kawasan pesisir |
| **Cakranegara** | 14,0 ha | 20,6 ha | **-6,6 ha** | Penurunan terbatas di kawasan perdagangan |
| **Selaparang** | 30,6 ha | 18,8 ha | **+11,8 ha** | **Satu-satunya kecamatan net positif (Outlier ★)** |

---

### D. Analisis Faktor & Rekomendasi Kebijakan
* **Faktor Utama**: Kehilangan vegetasi (202,35 ha) tercatat 1,45 kali lebih besar dibanding penambahan vegetasi (139,66 ha).
* **Potensi Pengguna**: Dinas Lingkungan Hidup (DLH), Bappeda (evaluasi RDTR & target RTH 30%), peneliti, dan masyarakat umum.
* **Rekomendasi Utama**: Pemantauan vegetasi berkala (terutama musim kemarau), validasi lapangan di kecamatan Sekarbela & Mataram, serta integrasi dengan data RTH resmi Pemkot.

---

### E. Analisis Lanjutan: Pengujian Statistik & Pola Perubahan

#### 1. Keandalan Model (Metrik Turunan & Wilson Score Interval)
* **Specificity**: `95,74%`
* **Negative Predictive Value (NPV)**: `98,54%`
* **False Positive Rate (FPR)**: `4,26%`
* **False Negative Rate (FNR)**: `1,46%`
* **Balanced Accuracy**: `97,14%`
* **Matthews Correlation Coefficient (MCC)**: `0.943` (Skala -1 s/d +1, membuktikan performa riil tinggi pada keempat sel matrix).
* **Selang Kepercayaan 95% (Wilson Score Interval)**: Rentang akurasi populasi **[94,43%, 98,53%]** dengan titik estimasi `97,12%` ($n=278$).

#### 2. Uji McNemar (Simetri Kesalahan FP vs FN)
* **False Positive**: `6` vs **False Negative**: `2`
* **Uji $\chi^2$**: $\chi^2 = 1.125 \le 3,841 \rightarrow$ **Tidak signifikan pada $\alpha=0,05$**. Sampel terlalu kecil untuk menyimpulkan bias overestimasi yang signifikan (bisa jadi kebetulan sampling).

#### 3. Dekomposisi Kappa (Observed vs Expected Agreement)
* **Observed Agreement ($P_o$)**: `97,1%`
* **Chance Agreement ($P_e$)**: `50,0%`
* **Skor $\kappa$**: $\kappa = \frac{P_o - P_e}{1 - P_e} = 0,942$ (Kesepakatan riil tinggi, bukan tebak-acak).

#### 4. Dekomposisi Perubahan Bersih vs Swap (Turnover)
* **Net Loss Riil**: `18%` (`62,69 ha` dari total 342,01 ha lahan berpindah kelas).
* **Swap (Fluktuasi Terganti)**: `82%` (`279,32 ha`) — vegetasi hilang di satu titik dan tumbuh di titik lain pada tahun yang sama, saling menutupi pada angka net. Turnover riil jauh lebih besar dari angka net -62,69 ha.

#### 5. Analisis Z-Score Perubahan Vegetasi Antar Kecamatan
* **Parameter Statistik**: $\mu = -0.692\%$, $\sigma = 0.896\%$
* **Sekarbela**: $Z = -0.78$
* **Sandubaya**: $Z = -0.68$
* **Mataram**: $Z = -0.66$
* **Cakranegara**: $Z = -0.10$
* **Ampenan**: $Z = +0.09$
* **Selaparang ($\star$ Outlier Statistik)**: $Z = +2.12$ (di atas $+2\sigma$, $|Z| > 2$).
* *Kesimpulan Statistik*: Tidak ada kecamatan yang loss-nya jadi outlier. Kecamatan **Selaparang** menonjol secara signifikan sebagai outlier positif ($Z \approx +2.12$), layak dipelajari sebagai rujukan program penghijauan untuk kecamatan lain.

---

## 📜 5. Kode Lengkap GEE (`gee/main_script.js`)

```javascript
//==============================================================
// UAS MAHA DATA — ANALISIS PERUBAHAN VEGETASI KOTA MATARAM (2024 vs 2025)
// PART 1 : PREPROCESSING SENTINEL-2
//==============================================================

var mataram = ee.FeatureCollection('projects/uas-kel3-gee/assets/mataramm');
Map.centerObject(mataram, 11);
Map.addLayer(mataram, {color:'red'}, 'Batas Kota Mataram');

var start2024 = '2024-01-01', end2024 = '2024-12-31';
var start2025 = '2025-01-01', end2025 = '2025-12-31';

function maskS2(image){
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000).copyProperties(image,['system:time_start']);
}

var S2_2024 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(mataram).filterDate(start2024,end2024)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20)).map(maskS2);

var S2_2025 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(mataram).filterDate(start2025,end2025)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20)).map(maskS2);

var composite2024 = S2_2024.median().clip(mataram);
var composite2025 = S2_2025.median().clip(mataram);

// PART 2 : FEATURE STACK (NDVI + NDMI)
function addNDVI(image){ return image.addBands(image.normalizedDifference(['B8','B4']).rename('NDVI')); }
function addNDMI(image){ return image.addBands(image.normalizedDifference(['B8','B11']).rename('NDMI')); }

var image2024 = addNDMI(addNDVI(composite2024));
var image2025 = addNDMI(addNDVI(composite2025));

var bands = ['B2','B3','B4','B8','B11','B12','NDVI','NDMI'];
var feature2024 = image2024.select(bands);
var feature2025 = image2025.select(bands);

// PART 3 : GROUND TRUTH (640 Points)
veg2024 = veg2024.map(function(f){ return f.set({'class':1, 'year':2024}); });
nonveg2024 = nonveg2024.map(function(f){ return f.set({'class':0, 'year':2024}); });
veg2025 = veg2025.map(function(f){ return f.set({'class':1, 'year':2025}); });
nonveg2025 = nonveg2025.map(function(f){ return f.set({'class':0, 'year':2025}); });

var groundTruth = ee.FeatureCollection([veg2024, nonveg2024, veg2025, nonveg2025]).flatten();

// PART 4 : TRAINING - TESTING SPLIT 60:40
var seed = 12345, splitRatio = 0.6;
var veg24 = groundTruth.filter(ee.Filter.and(ee.Filter.eq('class', 1), ee.Filter.eq('year', 2024))).randomColumn('random', seed);
var non24 = groundTruth.filter(ee.Filter.and(ee.Filter.eq('class', 0), ee.Filter.eq('year', 2024))).randomColumn('random', seed);
var veg25 = groundTruth.filter(ee.Filter.and(ee.Filter.eq('class', 1), ee.Filter.eq('year', 2025))).randomColumn('random', seed);
var non25 = groundTruth.filter(ee.Filter.and(ee.Filter.eq('class', 0), ee.Filter.eq('year', 2025))).randomColumn('random', seed);

var training = ee.FeatureCollection([
  veg24.filter(ee.Filter.lt('random', splitRatio)), non24.filter(ee.Filter.lt('random', splitRatio)),
  veg25.filter(ee.Filter.lt('random', splitRatio)), non25.filter(ee.Filter.lt('random', splitRatio))
]).flatten();

var testing = ee.FeatureCollection([
  veg24.filter(ee.Filter.gte('random', splitRatio)), non24.filter(ee.Filter.gte('random', splitRatio)),
  veg25.filter(ee.Filter.gte('random', splitRatio)), non25.filter(ee.Filter.gte('random', splitRatio))
]).flatten();

// PART 5 : RANDOM FOREST (640 Trees)
var sample2024 = feature2024.sampleRegions({collection: training.filter(ee.Filter.eq('year', 2024)), properties: ['class'], scale: 10, geometries: true});
var sample2025 = feature2025.sampleRegions({collection: training.filter(ee.Filter.eq('year', 2025)), properties: ['class'], scale: 10, geometries: true});
var trainingData = sample2024.merge(sample2025);

var rf = ee.Classifier.smileRandomForest({numberOfTrees: 640, seed: seed, bagFraction: 0.7, minLeafPopulation: 1})
  .train({features: trainingData, classProperty: 'class', inputProperties: bands});

var classified2024 = feature2024.select(bands).classify(rf).rename('classification');
var classified2025 = feature2025.select(bands).classify(rf).rename('classification');

// PART 6 : MODEL EVALUATION (Testing 40%)
var testing2024 = feature2024.sampleRegions({collection: testing.filter(ee.Filter.eq('year', 2024)), properties: ['class'], scale: 10, geometries: true});
var testing2025 = feature2025.sampleRegions({collection: testing.filter(ee.Filter.eq('year', 2025)), properties: ['class'], scale: 10, geometries: true});
var testingData = testing2024.merge(testing2025);
var validation = testingData.classify(rf);
var confusionMatrix = validation.errorMatrix('class', 'classification');

// PART 7 & 8 : CHANGE DETECTION & STATISTICS
var pixelArea = ee.Image.pixelArea().divide(10000).rename('ha');
var change = classified2024.multiply(2).add(classified2025); // 0=Tetap Non-Veg, 1=Gain, 2=Loss, 3=Tetap Veg

// PART 9 & 10 : EXPORT TO DRIVE & VECTOR SHP
Export.table.toDrive({collection: ee.FeatureCollection([summary]), description: 'Summary_Statistik_Mataram_2024_2025', folder: 'GEE', fileFormat: 'CSV'});
```

---

## 🔄 6. Studi Komparatif Lengkap: Referensi Mataram vs. Proyek IKN

| Elemen Parameter | Referensi Benchmark (Kota Mataram) | Proyek Utama (Ibu Kota Nusantara - IKN) |
|---|---|---|
| **Wilayah Studi** | Kota Mataram, NTB (6.045,48 ha) | Ibu Kota Nusantara, Kaltim (~257.227,6 ha) |
| **Periode Analisis** | 2024 – 2025 | April 2024 – April 2026 |
| **Fokus Kebijakan** | Evaluasi Capaian 20% RTH Kota | Penjagaan Visi *Green Forest City* IKN |
| **Tren Vegetasi** | Penurunan (-2,33% / -62,69 ha) | Pertumbuhan Net (+9.171,88 ha / +4,96%) |
| **Titik Sampel** | 640 Titik Ground Truth (6 Kecamatan) | 400 Titik Sample Terstratifikasi |
| **Split Train:Test** | 60:40 (`seed: 12345`, n=278 test) | 80:20 (`seed: 42`, n=77 test) |
| **Confusion Matrix Uji** | TN: 135, FP: 6, FN: 2, TP: 135 | TN: 33, FP: 4, FN: 0, TP: 40 |
| **Random Forest** | 640 Trees | 100 Trees |
| **Akurasi Model** | 97,1% (Kappa: 0,942) | 94,8% (Kappa: 0,895) |
| **Turnover Dynamics** | 18% Net Loss vs 82% Swap (Turnover) | Gain (+29.782,8 ha) vs Loss (-20.610,9 ha) |
| **Uji Lanjutan** | Wilson Score, McNemar, Kappa, Z-Score | Wa Alert EWS, Carbon Calc, Curtain Split |
| **Fitur Enterprise** | Standalone WebGIS 4-Tab | WebGIS 4-Tab + WA EWS Alert + GSAP Scrubbing Video |

