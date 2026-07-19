// ==============================================================================
// FASE 3: MODEL TRAINING & CLASSIFICATION
// Random Forest untuk klasifikasi Target Lahan
// Split: 80% Training, 20% Testing | Fitur: B2, B3, B4, B8, B11, B12, NDVI, NDBI
// ==============================================================================

// 1. LOAD BATAS IKN
var iknLuas = ee.FeatureCollection('projects/my-project-2026-488909/assets/IKN_250K');
var aoi = iknLuas.geometry();

Map.centerObject(aoi, 11);

// 2. REBUILD COMPOSITE SENTINEL-2 (Sama seperti Preprocessing)
function maskSCL(image) {
  var scl = image.select('SCL');
  var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10)).and(scl.neq(11));
  return image.updateMask(mask).divide(10000)
    .copyProperties(image, ['system:time_start']);
}

function addIndices(image) {
  var ndvi = image.normalizedDifference(['B8','B4']).rename('NDVI');
  var ndbi = image.normalizedDifference(['B11','B8']).rename('NDBI');
  return image.select(['B2','B3','B4','B8','B11','B12'])
              .addBands([ndvi, ndbi]);
}

var s2Bands = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .map(maskSCL)
  .map(addIndices);

var composite2024 = s2Bands.filterDate('2024-04-01', '2024-05-01')
  .median()
  .clip(aoi);

var composite2026 = s2Bands.filterDate('2026-04-01', '2026-05-01')
  .median()
  .clip(aoi);

var bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDBI'];

// 3. LOAD GROUND TRUTH (Menggunakan asset project Anda)
var groundTruth = ee.FeatureCollection('projects/my-project-2026-488909/assets/GroundTruth_IKN');
print('Jumlah Ground Truth Keseluruhan:', groundTruth.size());

// 4. SPLIT TRAINING/TESTING (80/20) SECARA PROPORSIONAL PER KELAS-TAHUN
var gt2024_c1 = groundTruth.filter(ee.Filter.and(ee.Filter.eq('year', 2024), ee.Filter.eq('class', 1))).randomColumn({seed: 42, columnName: 'random'});
var gt2024_c0 = groundTruth.filter(ee.Filter.and(ee.Filter.eq('year', 2024), ee.Filter.eq('class', 0))).randomColumn({seed: 42, columnName: 'random'});
var gt2026_c1 = groundTruth.filter(ee.Filter.and(ee.Filter.eq('year', 2026), ee.Filter.eq('class', 1))).randomColumn({seed: 42, columnName: 'random'});
var gt2026_c0 = groundTruth.filter(ee.Filter.and(ee.Filter.eq('year', 2026), ee.Filter.eq('class', 0))).randomColumn({seed: 42, columnName: 'random'});

var trainingPoints = gt2024_c1.filter(ee.Filter.lt('random', 0.8))
  .merge(gt2024_c0.filter(ee.Filter.lt('random', 0.8)))
  .merge(gt2026_c1.filter(ee.Filter.lt('random', 0.8)))
  .merge(gt2026_c0.filter(ee.Filter.lt('random', 0.8)));

var testingPoints = gt2024_c1.filter(ee.Filter.gte('random', 0.8))
  .merge(gt2024_c0.filter(ee.Filter.gte('random', 0.8)))
  .merge(gt2026_c1.filter(ee.Filter.gte('random', 0.8)))
  .merge(gt2026_c0.filter(ee.Filter.gte('random', 0.8)));

print('=== DATA SPLIT PROPORSIONAL (80:20) ===');
print('Training points (80%):', trainingPoints.size());
print('Testing points (20%):', testingPoints.size());
print('======================================');

// 5. SAMPLE FEATURE VALUES di titik training sesuai tahunnya
var training2024 = trainingPoints.filter(ee.Filter.eq('year', 2024));
var trainingData2024 = composite2024.select(bands).sampleRegions({
  collection: training2024,
  properties: ['class'],
  scale: 10,
  tileScale: 16
});

var training2026 = trainingPoints.filter(ee.Filter.eq('year', 2026));
var trainingData2026 = composite2026.select(bands).sampleRegions({
  collection: training2026,
  properties: ['class'],
  scale: 10,
  tileScale: 16
});

var trainingData = trainingData2024.merge(trainingData2026);

// 6. TRAIN RANDOM FOREST MODEL
var classifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 100,
  seed: 42
}).train({
  features: trainingData,
  classProperty: 'class',
  inputProperties: bands
});

print('Model Random Forest berhasil dilatih.');

// 7. KLASIFIKASI CITRA RASTER
var classified2024 = composite2024.select(bands).classify(classifier).rename('classification');
var classified2026 = composite2026.select(bands).classify(classifier).rename('classification');

// Visualisasi
var classVis = {min: 0, max: 1, palette: ['white', 'green']};
Map.addLayer(classified2024, classVis, 'Klasifikasi 2024 (Hijau=Target)', false);
Map.addLayer(classified2026, classVis, 'Klasifikasi 2026 (Hijau=Target)', true);

// 8. EXPORT HASIL KLASIFIKASI RASTER KE ASSETS
Export.image.toAsset({
  image: classified2024.toByte(),
  description: 'Export_IKN_Classified_2024',
  assetId: 'projects/my-project-2026-488909/assets/IKN_Classified_2024',
  scale: 10,
  region: aoi,
  maxPixels: 1e13
});

Export.image.toAsset({
  image: classified2026.toByte(),
  description: 'Export_IKN_Classified_2026',
  assetId: 'projects/my-project-2026-488909/assets/IKN_Classified_2026',
  scale: 10,
  region: aoi,
  maxPixels: 1e13
});

// 9. EXPORT TITIK TESTING (Untuk evaluasi di script change_analysis)
var classified_test = testingPoints.classify(classifier, 'predicted');
Export.table.toAsset({
  collection: classified_test,
  description: 'Export_Classified_Test_Points',
  assetId: 'projects/my-project-2026-488909/assets/Classified_Test_Points'
});

print("==========================================");
print("Klasifikasi citra raster selesai!");
print("Klik 'Tasks' untuk mengekspor hasil ke Assets.");
print("==========================================");
