// ================================
// SCRIPT MASTER: IKN Ground Truth Prep
// Periode: April 2024 vs April 2026
// ================================

// --- Load 3 level boundary IKN ---
var iknInti = ee.FeatureCollection('projects/kapita-500202/assets/Kawasan_Inti_IKN_5K');
var iknBWP = ee.FeatureCollection('projects/kapita-500202/assets/BWP_IKN_50K');
var iknLuas = ee.FeatureCollection('projects/kapita-500202/assets/IKN_250K');

// AOI utama untuk proses citra = yang paling luas
var aoi = iknLuas.geometry();

// --- Band yang dipakai ---
var bands = ['B2','B3','B4','B8','B11','B12','SCL'];

// --- Fungsi cloud masking pakai SCL ---
function maskSCL(image) {
  var scl = image.select('SCL');
  var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10)).and(scl.neq(11));
  return image.updateMask(mask).divide(10000)
    .copyProperties(image, ['system:time_start']);
}

// --- Load collection Sentinel-2 ---
var s2Bands = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .select(bands);

// --- Composite April 2024 ---
var col2024 = s2Bands.filterDate('2024-04-01', '2024-05-01').map(maskSCL);
var composite2024 = col2024.median().clip(aoi);

// --- Composite April 2026 ---
var col2026 = s2Bands.filterDate('2026-04-01', '2026-05-01').map(maskSCL);
var composite2026 = col2026.median().clip(aoi);

// --- NDVI & NDBI ---
var ndvi2024 = composite2024.normalizedDifference(['B8','B4']).rename('NDVI');
var ndbi2024 = composite2024.normalizedDifference(['B11','B8']).rename('NDBI');
var stack2024 = composite2024.addBands([ndvi2024, ndbi2024]);

var ndvi2026 = composite2026.normalizedDifference(['B8','B4']).rename('NDVI');
var ndbi2026 = composite2026.normalizedDifference(['B11','B8']).rename('NDBI');
var stack2026 = composite2026.addBands([ndvi2026, ndbi2026]);

// --- Outline boundary (biar gak nutupin, cuma garis pinggir) ---
var iknLuasOutline = ee.Image().byte().paint({
  featureCollection: iknLuas,
  color: 1,
  width: 2
});
var iknBWPOutline = ee.Image().byte().paint({
  featureCollection: iknBWP,
  color: 1,
  width: 2
});
var iknIntiOutline = ee.Image().byte().paint({
  featureCollection: iknInti,
  color: 1,
  width: 2
});

// --- Visualisasi ---
Map.centerObject(aoi, 11);
Map.addLayer(iknLuasOutline, {palette: 'blue'}, 'Batas IKN 250K (outline)');
Map.addLayer(iknBWPOutline, {palette: 'yellow'}, 'Batas BWP 50K (outline)', false);
Map.addLayer(iknIntiOutline, {palette: 'red'}, 'Batas Kawasan Inti 5K (outline)', false);

Map.addLayer(composite2024, {bands:['B4','B3','B2'], min:0, max:0.3}, 'RGB April 2024', false);
Map.addLayer(composite2026, {bands:['B4','B3','B2'], min:0, max:0.3}, 'RGB April 2026', false);

var ndviVis = {min: -0.2, max: 0.9, palette: ['red', 'orange', 'yellow', 'lightgreen', 'darkgreen']};
Map.addLayer(ndvi2024, ndviVis, 'NDVI 2024', false);
Map.addLayer(ndvi2026, ndviVis, 'NDVI 2026', false);

var ndbiVis = {min: -0.5, max: 0.3, palette: ['blue', 'white', 'orange', 'red']};
Map.addLayer(ndbi2024, ndbiVis, 'NDBI 2024', false);
Map.addLayer(ndbi2026, ndbiVis, 'NDBI 2026', false);

print('Stack 2024 (8 band - siap training):', stack2024);
print('Stack 2026 (8 band - siap training):', stack2026);

// ================================
// AREA UNTUK GROUND TRUTH
// Gambar geometry manual di bawah sini
// (Gunakan Geometry Tools di atas Map)
// ================================

// Ganti nama variabel sesuai punya kamu kalau beda
var veg2026Labeled = veg2026.map(function(f) {
  return f.set('class', 1, 'year', 2026);
});

var nonveg2026Labeled = nonveg2026.map(function(f) {
  return f.set('class', 0, 'year', 2026);
});

var groundTruth2026 = veg2026Labeled.merge(nonveg2026Labeled);

print('Ground truth 2026 - total points:', groundTruth2026.size());
print('Ground truth 2026 sample:', groundTruth2026.first());

Export.table.toAsset({
  collection: groundTruth2026,
  description: 'GroundTruth_2026_Export',
  assetId: 'projects/kapita-500202/assets/groundtruth_2026'
});

Export.table.toDrive({
  collection: groundTruth2026,
  description: 'GroundTruth_2026_CSV',
  fileFormat: 'CSV'
});

Export.table.toDrive({
  collection: groundTruth2026,
  description: 'GroundTruth_2026_GeoJSON',
  fileFormat: 'GeoJSON'
});

var veg2026Labeled = veg2026.map(function(f) {
  return f.set('class', 1, 'year', 2026);
});

var nonveg2026Labeled = nonveg2026.map(function(f) {
  return f.set('class', 0, 'year', 2026);
});

var groundTruth2026 = veg2026Labeled.merge(nonveg2026Labeled);

print('Ground truth 2026 - total points:', groundTruth2026.size());

Export.table.toAsset({
  collection: groundTruth2026,
  description: 'GroundTruth_2026_Export',
  assetId: 'projects/kapita-500202/assets/groundtruth_2026'
});

var veg2024Labeled = veg2024.map(function(f) {
  return f.set('class', 1, 'year', 2024);
});

var nonveg2024Labeled = nonveg2024.map(function(f) {
  return f.set('class', 0, 'year', 2024);
});

var groundTruth2024 = veg2024Labeled.merge(nonveg2024Labeled);

print('Ground truth 2024 - total points:', groundTruth2024.size());

Export.table.toAsset({
  collection: groundTruth2024,
  description: 'GroundTruth_2024_Export',
  assetId: 'projects/kapita-500202/assets/groundtruth_2024'
});

var groundTruthAll = groundTruth2024.merge(groundTruth2026);

print('Total ground truth (kedua tahun):', groundTruthAll.size());
print('Veg 2024:', groundTruth2024.filter(ee.Filter.eq('class', 1)).size());
print('Nonveg 2024:', groundTruth2024.filter(ee.Filter.eq('class', 0)).size());
print('Veg 2026:', groundTruth2026.filter(ee.Filter.eq('class', 1)).size());
print('Nonveg 2026:', groundTruth2026.filter(ee.Filter.eq('class', 0)).size());

Export.table.toAsset({
  collection: groundTruthAll,
  description: 'GroundTruth_AllYears_Export',
  assetId: 'projects/kapita-500202/assets/groundtruth_all'
});

Export.table.toDrive({
  collection: groundTruthAll,
  description: 'GroundTruth_AllYears_GeoJSON',
  fileFormat: 'GeoJSON'
});

print('Rekap per kombinasi:');
print('Veg 2024:', groundTruth2024.filter(ee.Filter.eq('class', 1)).size());
print('Nonveg 2024:', groundTruth2024.filter(ee.Filter.eq('class', 0)).size());
print('Veg 2026:', groundTruth2026.filter(ee.Filter.eq('class', 1)).size());
print('Nonveg 2026:', groundTruth2026.filter(ee.Filter.eq('class', 0)).size());
print('Total:', groundTruthAll.size());

var testSample2024 = stack2024.sampleRegions({
  collection: groundTruth2024,
  properties: ['class', 'year'],
  scale: 10
});

    
// =========================================
// SAMPLE NILAI PIXEL UNTUK RANDOM FOREST
// =========================================

// Sample tahun 2024
var samples2024 = stack2024.sampleRegions({
  collection: groundTruth2024,
  properties: ['class', 'year'],
  scale: 10,
  geometries: true
});

// Sample tahun 2026
var samples2026 = stack2026.sampleRegions({
  collection: groundTruth2026,
  properties: ['class', 'year'],
  scale: 10,
  geometries: true
});

// Gabungkan hasil sampling
var samplesAll = samples2024.merge(samples2026);

// Cek hasil
print('Jumlah sample:', samplesAll.size());
print('Contoh sample:', samplesAll.first());

Export.table.toDrive({
  collection: samplesAll,
  description: 'RF_Training_Samples_2024_2026',
  fileFormat: 'CSV'
});

Export.table.toDrive({
  collection: samplesAll,
  description: 'RF_Training_Samples_2024_2026_GeoJSON',
  fileFormat: 'GeoJSON'
});

print("GT 2024", groundTruth2024.size());
print("Sample 2024", samples2024.size());

print("GT 2026", groundTruth2026.size());
print("Sample 2026", samples2026.size());
