/**
 * STOK GUDANG - Web App (Google Apps Script)
 * Backend sederhana: menyimpan & memuat state (urutan, nama item, angka)
 * di Script Properties, sehingga data tetap ada saat refresh / ganti perangkat.
 */

var KEY = 'STOK_GUDANG_STATE';
var CHUNK = 8000; // batas Script Properties ~9KB per key, jadi dipecah per 8000 karakter

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Stok Gudang')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Dipanggil dari browser saat aplikasi dibuka. */
function loadState() {
  var props = PropertiesService.getScriptProperties();
  var count = Number(props.getProperty(KEY + '_N') || 0);
  if (!count) return null;
  var out = '';
  for (var i = 0; i < count; i++) {
    out += props.getProperty(KEY + '_' + i) || '';
  }
  return out || null;
}

/** Dipanggil dari browser otomatis setiap ada perubahan. */
function saveState(json) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var props = PropertiesService.getScriptProperties();
    var oldCount = Number(props.getProperty(KEY + '_N') || 0);
    var chunks = [];
    for (var i = 0; i < json.length; i += CHUNK) {
      chunks.push(json.substring(i, i + CHUNK));
    }
    var data = {};
    data[KEY + '_N'] = String(chunks.length);
    chunks.forEach(function (c, idx) { data[KEY + '_' + idx] = c; });
    props.setProperties(data);
    for (var j = chunks.length; j < oldCount; j++) {
      props.deleteProperty(KEY + '_' + j);
    }
    return true;
  } finally {
    lock.releaseLock();
  }
}
