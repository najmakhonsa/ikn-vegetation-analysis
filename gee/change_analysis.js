// ==============================================================================
// FASE 4: MODEL EVALUATION & CHANGE DETECTION (Citra Raster & Titik)
// Confusion Matrix, APRF Metrics, Perhitungan Luas Hektar, dan Ekspor GeoJSON
// ==============================================================================

// 1. LOAD BATAS IKN
var iknLuas = ee.FeatureCollection('projects/my-project-2026-488909/assets/IKN_250K');
var aoi = iknLuas.geometry();

Map.centerObject(aoi, 11);

// 2. LOAD HASIL KLASIFIKASI (dari Phase 3 / random_forest.js)
var classified2024 = ee.Image('projects/my-project-2026-488909/assets/IKN_Classified_2024');
var classified2026 = ee.Image('projects/my-project-2026-488909/assets/IKN_Classified_2026');

// 3. LOAD DATA EVALUASI TITIK TESTING (dari Phase 3 / random_forest.js)
var classified_test = ee.FeatureCollection('projects/my-project-2026-488909/assets/Classified_Test_Points');
var targetName = 'class';
var predictedName = 'predicted';

// 4. CONFUSION MATRIX & METRICS
var confusionMatrix = classified_test.errorMatrix(targetName, predictedName);

print('=================================');
print('=== CONFUSION MATRIX (2x2) ===');
print(confusionMatrix);
print('=================================');

// APRF Metrics
var accuracy = confusionMatrix.accuracy();
var kappa = confusionMatrix.kappa();
var producersAcc = confusionMatrix.producersAccuracy(); // Recall
var consumersAcc = confusionMatrix.consumersAccuracy(); // Precision

print('=== APRF METRICS ===');
print('Overall Accuracy:', accuracy);
print('Kappa Coefficient:', kappa);
print('---');
print('Class 0 (Non-Target):');
print('  Producers Accuracy (Recall):', producersAcc.get([0, 0]));
print('  Consumers Accuracy (Precision):', consumersAcc.get([0, 0]));
print('---');
print('Class 1 (Target):');
print('  Producers Accuracy (Recall):', producersAcc.get([1, 0]));
print('  Consumers Accuracy (Precision):', consumersAcc.get([0, 1]));
print('====================');

// F1-Score untuk Target (Class 1)
var p1 = ee.Number(consumersAcc.get([0, 1]));
var r1 = ee.Number(producersAcc.get([1, 0]));
var f1ScoreClass1 = ee.Algorithms.If(
  p1.add(r1).eq(0),
  0,
  p1.multiply(r1).multiply(2).divide(p1.add(r1))
);
print('F1-Score Class 1 (Target):', f1ScoreClass1);

// 5. CHANGE DETECTION CITRA RASTER
var change = classified2026.subtract(classified2024).rename('change');
// Hasil: -1 = Loss (Target->Non-Target), 0 = Stable, 1 = Gain (Non-Target->Target)

Map.addLayer(classified2024, {min: 0, max: 1, palette: ['white', 'green']}, 'Klasifikasi 2024 (Hijau=Target)', false);
Map.addLayer(classified2026, {min: 0, max: 1, palette: ['white', 'green']}, 'Klasifikasi 2026 (Hijau=Target)', false);
Map.addLayer(change, {min: -1, max: 1, palette: ['blue', 'gray', 'red']}, 'Change Detection (Merah=Gain, Biru=Loss)', true);

// 6. PERHITUNGAN LUAS (dalam hektar)
var pixelArea = ee.Image.pixelArea().divide(10000); // m² ke hektar

var area2024 = classified2024.eq(1).multiply(pixelArea)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: aoi,
    scale: 10,
    maxPixels: 1e13,
    tileScale: 8
  });

var area2026 = classified2026.eq(1).multiply(pixelArea)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: aoi,
    scale: 10,
    maxPixels: 1e13,
    tileScale: 8
  });

var areaGain = change.eq(1).multiply(pixelArea)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: aoi,
    scale: 10,
    maxPixels: 1e13,
    tileScale: 8
  });

var areaLoss = change.eq(-1).multiply(pixelArea)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: aoi,
    scale: 10,
    maxPixels: 1e13,
    tileScale: 8
  });

print('=== STATISTIK LUAS (Hektar) ===');
print('Luas Target 2024:', area2024.get('classification'));
print('Luas Target 2026:', area2026.get('classification'));
print('Luas Pertambahan (Gain):', areaGain.get('change'));
print('Luas Pengurangan (Loss):', areaLoss.get('change'));
print('===============================');

// 7. VEKTORISASI (Gain & Loss Polygons)
var gain = change.eq(1).selfMask();
var loss = change.eq(-1).selfMask();

// Vektorisasi dengan skala 30m untuk mempercepat & menyederhanakan geometri
var gainVectors = gain.reduceToVectors({
  geometry: aoi,
  scale: 30,
  geometryType: 'polygon',
  eightConnected: false,
  maxPixels: 1e13,
  tileScale: 8
});

var lossVectors = loss.reduceToVectors({
  geometry: aoi,
  scale: 30,
  geometryType: 'polygon',
  eightConnected: false,
  maxPixels: 1e13,
  tileScale: 8
});

// Sederhanakan geometri & hilangkan noise
gainVectors = gainVectors.map(function(f) {
  return f.simplify({maxError: 30});
}).filter(ee.Filter.gt('count', 10));

lossVectors = lossVectors.map(function(f) {
  return f.simplify({maxError: 30});
}).filter(ee.Filter.gt('count', 10));

Map.addLayer(gainVectors, {color: 'red'}, 'Gain Polygons (Ekspansi)', false);
Map.addLayer(lossVectors, {color: 'blue'}, 'Loss Polygons (Revegetasi)', false);

// 8. EKSPOR KE GEOJSON (Google Drive)
Export.table.toDrive({
  collection: gainVectors,
  description: 'change_gain',
  fileFormat: 'GeoJSON'
});

Export.table.toDrive({
  collection: lossVectors,
  description: 'change_loss',
  fileFormat: 'GeoJSON'
});

Export.table.toDrive({
  collection: ee.FeatureCollection([ee.Feature(aoi)]),
  description: 'boundary_kota',
  fileFormat: 'GeoJSON'
});

// Opsional: Klasifikasi Target dalam bentuk polygon
var targetPolygon2024 = classified2024.eq(1).selfMask().reduceToVectors({
  geometry: aoi,
  scale: 30,
  geometryType: 'polygon',
  maxPixels: 1e13,
  tileScale: 8
}).map(function(f) { return f.simplify({maxError: 30}); }).filter(ee.Filter.gt('count', 10));

var targetPolygon2026 = classified2026.eq(1).selfMask().reduceToVectors({
  geometry: aoi,
  scale: 30,
  geometryType: 'polygon',
  maxPixels: 1e13,
  tileScale: 8
}).map(function(f) { return f.simplify({maxError: 30}); }).filter(ee.Filter.gt('count', 10));

Export.table.toDrive({
  collection: targetPolygon2024,
  description: 'building_2024',
  fileFormat: 'GeoJSON'
});

Export.table.toDrive({
  collection: targetPolygon2026,
  description: 'building_2026',
  fileFormat: 'GeoJSON'
});

print("=================================================");
print("Analisis selesai!");
print("Klik 'Tasks' untuk mengekspor data ke Google Drive.");
print("1. change_gain.geojson");
print("2. change_loss.geojson");
print("3. building_2024.geojson");
print("4. building_2026.geojson");
print("5. boundary_kota.geojson");
print("=================================================");
