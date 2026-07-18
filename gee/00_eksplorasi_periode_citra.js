// ============================================================
// SCRIPT: Eksplorasi Cloud Cover — Penentuan Periode Citra
// Tujuan: Menentukan bulan & tahun terbaik untuk composite
//         (dokumentasi metodologi pemilihan periode)
// ============================================================

// ------------------------------------------------------------
// 1. SETUP AOI (IKN 250K — boundary resmi)
// ------------------------------------------------------------
var iknLuas = ee.FeatureCollection('projects/kapita-500202/assets/IKN_250K');
var aoi = iknLuas.geometry();

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED').filterBounds(aoi);

// ------------------------------------------------------------
// 2. FUNGSI: Hitung cloud% presisi di dalam AOI (bukan metadata)
// ------------------------------------------------------------
function hitungCloudDalamAOI(image) {
  var scl = image.select('SCL');
  var cloudMask = scl.eq(3).or(scl.eq(8)).or(scl.eq(9)).or(scl.eq(10));
  var stats = cloudMask.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: aoi,
    scale: 20,
    maxPixels: 1e9,
    bestEffort: true,
    tileScale: 4
  });
  var cloudPct = ee.Algorithms.If(
    stats.get('SCL'),
    ee.Number(stats.get('SCL')).multiply(100),
    -1
  );
  return image.set('cloud_pct_in_aoi', cloudPct);
}

// ------------------------------------------------------------
// 3. FUNGSI: Cek cloud% per bulan-tahun
// ------------------------------------------------------------
function cekBulanTahun(tahun, bulan) {
  var bulanStr = bulan < 10 ? '0' + bulan : '' + bulan;
  var startDate = tahun + '-' + bulanStr + '-01';
  var endDate = ee.Date(startDate).advance(1, 'month');
  var col = s2.filterDate(startDate, endDate);

  var colWithCloudPct = col.map(hitungCloudDalamAOI);
  var colValid = colWithCloudPct.filter(ee.Filter.gte('cloud_pct_in_aoi', 0));
  var meanCloud = colValid.aggregate_mean('cloud_pct_in_aoi');

  print(tahun + '-' + bulanStr +
        ' | Scene valid: ', colValid.size(),
        ' | Cloud% AOI: ', meanCloud);
}

// ------------------------------------------------------------
// 4. EKSPLORASI TAHAP 1: Cek Januari-Juli, tahun 2021-2026
//    (mencari bulan & tahun dengan cloud cover terendah)
// ------------------------------------------------------------
print('=== TAHAP 1: CEK JANUARI-JULI, 2021-2026 (AOI 250K) ===');
[2021, 2022, 2023, 2024, 2025, 2026].forEach(function(tahun) {
  print('--- Tahun ' + tahun + ' ---');
  var bulanMax = (tahun === 2026) ? 7 : 12; // 2026 data terbatas s.d. Juli
  for (var b = 1; b <= bulanMax; b++) {
    cekBulanTahun(tahun, b);
  }
});

// HASIL: April adalah bulan dengan cloud% terendah di 2026 (68.8%),
// dan 2024 adalah tahun dengan cloud% April terendah (66.8%),
// dengan selisih hanya 2.0 poin terhadap 2026 — kombinasi terbaik.

// ------------------------------------------------------------
// 5. FUNGSI: Cek window presisi (widening test)
// ------------------------------------------------------------
function cekWindowPresisi(startDate, endDate, label) {
  var col = s2.filterDate(startDate, endDate);
  var colWithCloudPct = col.map(hitungCloudDalamAOI);
  var colValid = colWithCloudPct.filter(ee.Filter.gte('cloud_pct_in_aoi', 0));
  var meanCloud = colValid.aggregate_mean('cloud_pct_in_aoi');
  print(label + ' | Scene valid: ', colValid.size(), ' | Cloud% AOI: ', meanCloud);
}

// ------------------------------------------------------------
// 6. EKSPLORASI TAHAP 2: Uji widening window di sekitar April
//    (menguji apakah memperlebar window membantu atau merusak)
// ------------------------------------------------------------
print('=== TAHAP 2: UJI WIDENING WINDOW (April 2024 vs April 2026) ===');

// Window 1 bulan (baseline)
cekWindowPresisi('2024-04-01', '2024-05-01', 'April 2024 saja');
cekWindowPresisi('2026-04-01', '2026-05-01', 'April 2026 saja');

// Window diperlebar ke arah belakang (Maret)
cekWindowPresisi('2024-03-15', '2024-05-15', 'Mar15-Mei15 2024');
cekWindowPresisi('2026-03-15', '2026-05-15', 'Mar15-Mei15 2026');

// Window diperlebar ke arah depan (Juni)
cekWindowPresisi('2024-04-15', '2024-06-15', 'Apr15-Jun15 2024');
cekWindowPresisi('2026-04-15', '2026-06-15', 'Apr15-Jun15 2026');

// HASIL: Widening ke KEDUA arah memperburuk cloud% (bukan membaik),
// mengindikasikan April adalah "jendela kering sempit" yang tajam.
// Keputusan: window 1 bulan (April saja) dipertahankan, TIDAK di-widening.

// ------------------------------------------------------------
// 7. VALIDASI TAHAP 3: Cek persentase piksel terisi
//    (memastikan window 1 bulan sudah cukup, tanpa widening)
// ------------------------------------------------------------
var BANDS = ['B2','B3','B4','B8','B11','B12','SCL'];

function maskSCL(image) {
  var scl = image.select('SCL');
  var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9))
                .and(scl.neq(10)).and(scl.neq(11));
  return image.updateMask(mask).divide(10000)
    .copyProperties(image, ['system:time_start']);
}

var s2Bands = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi).select(BANDS);

var col2024 = s2Bands.filterDate('2024-04-01', '2024-05-01').map(maskSCL);
var composite2024 = col2024.median().clip(aoi);

var col2026 = s2Bands.filterDate('2026-04-01', '2026-05-01').map(maskSCL);
var composite2026 = col2026.median().clip(aoi);

function hitungPersenTerisi(image, aoiCheck, label) {
  var maskedBand = image.select('B4').mask();
  var stats = maskedBand.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: aoiCheck,
    scale: 10,
    maxPixels: 1e9,
    bestEffort: true,
    tileScale: 4
  });
  print(label + ' | Persentase piksel terisi:', ee.Number(stats.get('B4')).multiply(100));
}

print('=== TAHAP 3: VALIDASI PERSENTASE PIKSEL TERISI ===');

// Cek di level AOI 250K (keseluruhan)
hitungPersenTerisi(composite2024, aoi, 'Composite April 2024 (AOI 250K)');
hitungPersenTerisi(composite2026, aoi, 'Composite April 2026 (AOI 250K)');

// Cek di level Kawasan Inti & BWP (area fokus utama riset)
var iknInti = ee.FeatureCollection('projects/kapita-500202/assets/Kawasan_Inti_IKN_5K');
var iknBWP  = ee.FeatureCollection('projects/kapita-500202/assets/BWP_IKN_50K');

hitungPersenTerisi(composite2024, iknInti.geometry(), 'Kawasan Inti 2024');
hitungPersenTerisi(composite2026, iknInti.geometry(), 'Kawasan Inti 2026');
hitungPersenTerisi(composite2024, iknBWP.geometry(), 'BWP 2024');
hitungPersenTerisi(composite2026, iknBWP.geometry(), 'BWP 2026');

// HASIL: AOI 250K terisi 94-95% (gap di pinggiran, bukan area fokus).
// Kawasan Inti & BWP terisi 97.8-100% — sangat baik untuk analisis utama.
// KESIMPULAN: April 2024 vs April 2026, window 1 bulan, sudah optimal.