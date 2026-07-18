// ============================================================
// PROYEK: Analisis Perubahan Vegetasi IKN
// Kapita Selekta Sistem Informasi - UAS
// Objek Target: Vegetasi (Kelas 1) vs Non-Vegetasi (Kelas 0)
// Periode: April 2024 vs April 2026
// ============================================================

// ------------------------------------------------------------
// 1. BOUNDARY WILAYAH (3 level: Inti, BWP, IKN Luas)
// ------------------------------------------------------------
var iknInti = ee.FeatureCollection('projects/kapita-500202/assets/Kawasan_Inti_IKN_5K');
var iknBWP  = ee.FeatureCollection('projects/kapita-500202/assets/BWP_IKN_50K');
var iknLuas = ee.FeatureCollection('projects/kapita-500202/assets/IKN_250K');

var aoi = iknLuas.geometry(); // AOI utama untuk proses citra

// ------------------------------------------------------------
// 2. LOAD SENTINEL-2 & CLOUD MASKING
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
  .filterBounds(aoi)
  .select(BANDS);

// ------------------------------------------------------------
// 3. COMPOSITE MEDIAN — April 2024 & April 2026
// ------------------------------------------------------------
var col2024 = s2Bands.filterDate('2024-04-01', '2024-05-01').map(maskSCL);
var composite2024 = col2024.median().clip(aoi);

var col2026 = s2Bands.filterDate('2026-04-01', '2026-05-01').map(maskSCL);
var composite2026 = col2026.median().clip(aoi);

// ------------------------------------------------------------
// 4. FEATURE STACK — NDVI & NDBI
// ------------------------------------------------------------
var ndvi2024 = composite2024.normalizedDifference(['B8','B4']).rename('NDVI');
var ndbi2024 = composite2024.normalizedDifference(['B11','B8']).rename('NDBI');
var stack2024 = composite2024.addBands([ndvi2024, ndbi2024]);

var ndvi2026 = composite2026.normalizedDifference(['B8','B4']).rename('NDVI');
var ndbi2026 = composite2026.normalizedDifference(['B11','B8']).rename('NDBI');
var stack2026 = composite2026.addBands([ndvi2026, ndbi2026]);

// ------------------------------------------------------------
// 5. GROUND TRUTH — Label & Merge
//    (Geometry veg2024, nonveg2024, veg2026, nonveg2026
//     harus sudah ada di Imports sebelum baris ini dijalankan)
// ------------------------------------------------------------
var veg2024Labeled = veg2024.map(function(f) {
  return f.set('class', 1, 'year', 2024);
});
var nonveg2024Labeled = nonveg2024.map(function(f) {
  return f.set('class', 0, 'year', 2024);
});
var groundTruth2024 = veg2024Labeled.merge(nonveg2024Labeled);

var veg2026Labeled = veg2026.map(function(f) {
  return f.set('class', 1, 'year', 2026);
});
var nonveg2026Labeled = nonveg2026.map(function(f) {
  return f.set('class', 0, 'year', 2026);
});
var groundTruth2026 = veg2026Labeled.merge(nonveg2026Labeled);

var groundTruthAll = groundTruth2024.merge(groundTruth2026);

// ------------------------------------------------------------
// 6. VALIDASI & REKAP
// ------------------------------------------------------------
print('=== REKAP GROUND TRUTH ===');
print('Veg 2024 (class=1):', groundTruth2024.filter(ee.Filter.eq('class', 1)).size());
print('Nonveg 2024 (class=0):', groundTruth2024.filter(ee.Filter.eq('class', 0)).size());
print('Veg 2026 (class=1):', groundTruth2026.filter(ee.Filter.eq('class', 1)).size());
print('Nonveg 2026 (class=0):', groundTruth2026.filter(ee.Filter.eq('class', 0)).size());
print('Total Ground Truth (semua tahun):', groundTruthAll.size());

// Cek apakah semua titik berhasil narik nilai band (tidak masked)
var testSample2024 = stack2024.sampleRegions({
  collection: groundTruth2024, properties: ['class','year'], scale: 10
});
var testSample2026 = stack2026.sampleRegions({
  collection: groundTruth2026, properties: ['class','year'], scale: 10
});
print('Validasi titik 2024 (harus = 200):', testSample2024.size());
print('Validasi titik 2026 (harus = 200):', testSample2026.size());

// ------------------------------------------------------------
// 7. VISUALISASI DI MAP
// ------------------------------------------------------------
var iknLuasOutline = ee.Image().byte().paint({featureCollection: iknLuas, color: 1, width: 2});

Map.centerObject(aoi, 11);
Map.addLayer(iknLuasOutline, {palette: 'blue'}, 'Batas IKN 250K');
Map.addLayer(composite2024, {bands:['B4','B3','B2'], min:0, max:0.3}, 'RGB April 2024', false);
Map.addLayer(composite2026, {bands:['B4','B3','B2'], min:0, max:0.3}, 'RGB April 2026', false);
Map.addLayer(ndvi2024, {min:-0.2, max:0.9, palette:['red','orange','yellow','lightgreen','darkgreen']}, 'NDVI 2024', false);
Map.addLayer(ndvi2026, {min:-0.2, max:0.9, palette:['red','orange','yellow','lightgreen','darkgreen']}, 'NDVI 2026', false);
Map.addLayer(groundTruthAll, {color: 'yellow'}, 'Ground Truth Points', false);

// ------------------------------------------------------------
// 8. EXPORT — Asset GEE (untuk training) & Drive (backup/GitHub)
// ------------------------------------------------------------
Export.table.toAsset({
  collection: groundTruthAll,
  description: 'GroundTruth_AllYears_Export',
  assetId: 'projects/kapita-500202/assets/groundtruth_all'
});

Export.table.toDrive({
  collection: groundTruthAll,
  description: 'GroundTruth_AllYears_CSV',
  fileFormat: 'CSV'
});

Export.table.toDrive({
  collection: groundTruthAll,
  description: 'GroundTruth_AllYears_GeoJSON',
  fileFormat: 'GeoJSON'
});