export interface BookItem {
  id: number;
  name: string;
  unit: string;
}

export interface GudangState {
  dry: number[];
  wet: number[];
  names: Record<number, string>;
  qty: Record<number, string>;
  ts: number;
}

export const BOOK_RAW: string[] = [
  'MIE|PCK','ADONAN PANGSIT|PCK','AYAM TABUR|PCK','CABE|PCK','KULIT PANGSIT|PCK','BAWANG GORENG|PCK','BUMBU MIE|BTL',
  'MINYAK BAWANG|BTL','KECAP SAWI|JRG','UDANG RAMBUTAN|PCK','UDANG KEJU|PCK','LUMPIA UDANG|PCK','LUMPIA AYAM|PCK',
  'SIOMAY|PCK','CEKER|PCK','PAO AYAM|PCK','BOLA UDANG KEJU|PCK','KULIT RAJANG|PCK','DOLLY PAPER|PCK','DIMSUM PAPER|PCK',
  'TEPUNG TERIGU|PCK','TEPUNG WFC|PCK','TEPUNG ROTI|PCK','AYAM BESAR|PCK','AYAM KECIL|PCK','SAMBAL HOREG|PCK',
  'AYAM POTONG DADU|PCK','SAYAP|PCK','EBI FURAI|PCK','AYAM FILLET|PCK','CRABSTICK|PCK','SAOS BLCKPAPER|BTL',
  'SAOS TERIYAKI|BTL','SAOS ASAM MANIS|BTL','SAOS PEDAS|BTL','CUKA NASI|BTL','QEWPEY MAYO|PCK','MAETSRO MAYO|PCK',
  'NORI|PCK','SEASONING/BUMBU BASIC|PCK','BIJI WIJEN|PCK','TERASI|KG','BERAS|PCK','TELUR|KG','TOBIKO|PCK','MENTAI|PCK',
  'JELLY MIE|PCK','BUBBLE|PCK','NATA DE COCO|PCK','S ROSEN|BTL','S LECHY|BTL','CARNATION|PCK','SAN ORANGE|BTL',
  'SAN LEMON|BTL','TEH POCI|BALL','LECI KALENG|KLG','GULA PASIR|KG','TEH SOSRO|PCK','P GREENTEA|PCK','P CAPPUCINO|PCK',
  'P AVOCADO|PCK','P DARK CHOCO|PCK','P TARO|PCK','P MATCHA|PCK','P RED VALVET|PCK','MILK POWDER|PCK','WHEAP CREAM|PCK',
  'COFFEE BEAN|PCK','FRESH MILK|BTL','OREO|KG','S VANILA|BTL','TOP CHOCOLATE|PCK','TOP CARAMEL|PCK','S STRAWBERRY|PCK',
  'SKM COKELAT|KLG','GULA SAC|PCK','GULA AREN|PCK','AIR MINERAL|DOS','PLASTIK WHEAP|PCK','SENDOK TEH|PCK','BOX MIE|PCK',
  'BOX DIMSUM|PCK','MINYAK GOR|DOS','SENDOK PLSTK|PCK','GARPU PLSTK|PCK','SENDOK GELATO|PCK','CUP 14 OZ|SLP',
  'CUP 18 OZ|SLP','CUP 2 OZ|SLP','CUP 4 OZ|SLP','CUP 5 OZ|SLP','CUP HOT|SLP','PLASTIK 40|PCK','PLASTIK WRAP|ROLL',
  'KLIP 6X4|PCK','KLIP 8X5|PCK','KLIP 7X10|PCK','TRASH BAG BSR|PCK','SUMPIT|PCK','SEDOTAN|PCK','TISSUE TOWEL|PCS',
  'THERMAL KASIR|PCS','HANDGLOVE|PCK','SBN C PIRING|JRG','SBN LANTAI|JRG','SBN C TANGAN|JRG','CUP 35ML|SLOP',
  'CUP 25ML|SLOP','CUP SEALER|RLL','KERTAS NASI|PCK','STP|PCK','MICA SAMBAL|PCK','GALON|GLN','ES TUBE|PCK',
  'ES SERUT|PCK','TAS SPONB BESAR|PCK','TAS SPONB KECIL|PCK','CONE|SLOP','FINNA BANGKOK|DOS','FINNA PEDAS|DOS'
];

export const BOOK: BookItem[] = BOOK_RAW.map((s, i) => {
  const p = s.split('|');
  return { id: i, name: p[0], unit: p[1] || '' };
});

export const BY_NAME: Record<string, number> = {};
BOOK.forEach((b) => {
  BY_NAME[b.name] = b.id;
});

export const DRY_NAMES: string[] = [
  'STP','KERTAS NASI','KLIP 7X10','KLIP 6X4','KLIP 8X5','SENDOK PLSTK','GARPU PLSTK','SENDOK GELATO','THERMAL KASIR',
  'CUP 25ML','CUP 35ML','QEWPEY MAYO','MENTAI','CARNATION','CUKA NASI','SAOS ASAM MANIS','SAOS BLCKPAPER','SAOS PEDAS',
  'S ROSEN','S LECHY','MAETSRO MAYO','SEASONING/BUMBU BASIC','BIJI WIJEN','NORI','TEPUNG ROTI','FINNA PEDAS',
  'FINNA BANGKOK','MINYAK BAWANG','TELUR','BAWANG GORENG','DIMSUM PAPER','DOLLY PAPER','BUMBU MIE','KECAP SAWI',
  'SAN LEMON','SAN ORANGE','GULA PASIR','BUBBLE','JELLY MIE','NATA DE COCO','SEDOTAN','LECI KALENG','BERAS',
  'TEPUNG WFC','SUMPIT','MINYAK GOR'
];

export const DEFAULT_USER_GAS_URL =
  'https://script.google.com/macros/s/AKfycbwgWSzBVWRMhRbArp5kzm_aCij2jcpp-xmSxbW_oQ8xzYL5AlEQdtTg70seKxYljNT5rg/exec';

export function getDefaultState(): GudangState {
  const dry = DRY_NAMES.map((n) => BY_NAME[n]).filter((id) => id !== undefined);
  const set: Record<number, number> = {};
  dry.forEach((id) => {
    set[id] = 1;
  });
  const wet = BOOK.filter((b) => !set[b.id]).map((b) => b.id);
  return { dry, wet, names: {}, qty: {}, ts: 0 };
}

export function serializeStateForGas(s: GudangState) {
  const items: Record<
    number,
    { id: number; bookIdx: number; origName: string; name: string; unit: string; stock: string }
  > = {};
  BOOK.forEach((b) => {
    items[b.id] = {
      id: b.id,
      bookIdx: b.id,
      origName: b.name,
      name: s.names && s.names[b.id] ? s.names[b.id] : b.name,
      unit: b.unit,
      stock: s.qty && s.qty[b.id] !== undefined ? String(s.qty[b.id]) : '',
    };
  });
  return {
    dry: s.dry,
    wet: s.wet,
    names: s.names || {},
    qty: s.qty || {},
    items,
    ts: s.ts || Date.now(),
  };
}

export function sanitizeState(s: any): GudangState {
  const d = getDefaultState();
  if (!s || typeof s !== 'object') return d;

  // If the remote sheet still has the placeholder "Beras" catalog at index 0,
  // return default Wizzmie catalog with ts=0 so client pushes Wizzmie items immediately
  if (s.items && s.items[0] && String(s.items[0].origName || '').toUpperCase() === 'BERAS') {
    return { ...d, ts: 0 };
  }

  const seen: Record<number, number> = {};
  const clean = (a: any): number[] =>
    (Array.isArray(a) ? a : [])
      .map((id) => Number(id))
      .filter((id) => {
        if (!Number.isInteger(id) || id < 0 || id >= BOOK.length || seen[id]) return false;
        seen[id] = 1;
        return true;
      });
  const dry = clean(s.dry);
  const wet = clean(s.wet);
  BOOK.forEach((b) => {
    if (!seen[b.id]) {
      (d.dry.indexOf(b.id) > -1 ? dry : wet).push(b.id);
    }
  });

  const names: Record<number, string> =
    s.names && typeof s.names === 'object' ? { ...s.names } : {};
  const qty: Record<number, string> = s.qty && typeof s.qty === 'object' ? { ...s.qty } : {};

  if (s.items && typeof s.items === 'object') {
    BOOK.forEach((b) => {
      const it = s.items[b.id];
      if (it && typeof it === 'object') {
        const disp = String(it.name || '').trim().toUpperCase();
        if (disp && disp !== b.name.toUpperCase()) {
          names[b.id] = disp;
        }
        const st = it.stock !== undefined && it.stock !== null ? String(it.stock).trim() : '';
        if (st !== '') {
          qty[b.id] = st;
        }
      }
    });
  }

  return {
    dry,
    wet,
    names,
    qty,
    ts: +s.ts || 0,
  };
}

/**
 * Generates Code.gs for Google Apps Script using Google Sheets as Database
 * Supports both GitHub Pages (fetch GET/POST with CORS) and direct HtmlService fallback
 */
export function generateCodeGs(spreadsheetId: string = ''): string {
  const cleanSheetId = spreadsheetId.trim();
  return `/**
 * ============================================================================
 * STOK GUDANG — BACKEND GOOGLE APPS SCRIPT + DATABASE GOOGLE SHEETS
 * ============================================================================
 * Mendukung:
 * 1. Hosting Frontend (index.html) di GitHub Pages melalui REST API (doGet & doPost)
 * 2. Database real-time di Google Sheets:
 *    - Sheet "Database_Stok" : Tabel 120 item lengkap (Urutan Buku, Nama, Satuan,
 *                              Gudang DRY/BASAH, Urutan Gudang, Jumlah Stok, Waktu Update)
 *    - Sheet "Rekap_Harian"  : Log arsip/riwayat setiap kali tombol "Arsip ke Sheet" ditekan
 *    - Sheet "Meta_State"    : Penyimpanan metadata sinkronisasi & timestamp (ts)
 *
 * CARA PAKAI:
 * 1. Buat Google Sheet baru -> klik menu Extensions (Ekstensi) > Apps Script
 * 2. Hapus kode bawaan di Code.gs, lalu tempel (paste) seluruh kode ini.
 * 3. Klik tombol Deploy > New deployment (Deployment baru)
 *    - Select type: Web app
 *    - Execute as: Me (Saya)
 *    - Who has access: Anyone (Siapa saja)  <-- PENTING agar GitHub Pages bisa akses!
 * 4. Salin URL Web App (berakhiran /exec) dan tempel ke index.html di GitHub.
 * ============================================================================
 */

// Opsional: Isi SPREADSHEET_ID jika script dibuat terpisah dari Google Sheet.
// Jika script dibuat dari menu Extensions > Apps Script di dalam Google Sheet, biarkan kosong ('').
var SPREADSHEET_ID = ${JSON.stringify(cleanSheetId)};

var SHEET_DB = 'Database_Stok';
var SHEET_META = 'Meta_State';

var BOOK_RAW = ${JSON.stringify(BOOK_RAW)};
var DRY_NAMES = ${JSON.stringify(DRY_NAMES)};

/** Mengambil objek Spreadsheet aktif, dari ID/URL, atau membuat otomatis jika standalone */
function getSpreadsheet_() {
  var raw = (typeof SPREADSHEET_ID === 'string') ? SPREADSHEET_ID.trim() : '';

  // 1. Jika diisi URL Google Sheet lengkap, ekstrak ID-nya secara otomatis
  if (raw && raw.indexOf('script.google.com') === -1) {
    var extractedId = raw;
    if (raw.indexOf('/spreadsheets/d/') !== -1) {
      extractedId = raw.split('/spreadsheets/d/')[1].split('/')[0].split('?')[0].split('#')[0];
    }
    try {
      return SpreadsheetApp.openById(extractedId);
    } catch (e) {
      Logger.log('Info: Gagal membuka SPREADSHEET_ID (' + extractedId + '), mencoba Spreadsheet aktif...');
    }
  }

  // 2. Gunakan Spreadsheet tempat script ini menempel (Extensions > Apps Script)
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  // 3. Fallback jika script dibuat terpisah (standalone di script.google.com)
  var props = PropertiesService.getScriptProperties();
  var savedId = props.getProperty('AUTO_SPREADSHEET_ID');
  if (savedId) {
    try {
      return SpreadsheetApp.openById(savedId);
    } catch (e) {}
  }

  var created = SpreadsheetApp.create('Database Stok Gudang');
  props.setProperty('AUTO_SPREADSHEET_ID', created.getId());
  Logger.log('Spreadsheet baru otomatis dibuat: ' + created.getUrl());
  return created;
}

/** Mengubah BOOK_RAW menjadi array objek {id, name, unit} */
function getBookCatalog_() {
  var byName = {};
  var list = BOOK_RAW.map(function(s, i) {
    var p = s.split('|');
    var item = { id: i, name: p[0], unit: p[1] || '' };
    byName[item.name] = i;
    return item;
  });
  return { list: list, byName: byName };
}

/** State bawaan (default) */
function getDefaultState_() {
  var cat = getBookCatalog_();
  var dry = [];
  var isDry = {};
  DRY_NAMES.forEach(function(n) {
    var id = cat.byName[n];
    if (typeof id === 'number') {
      dry.push(id);
      isDry[id] = true;
    }
  });
  var wet = [];
  cat.list.forEach(function(b) {
    if (!isDry[b.id]) wet.push(b.id);
  });
  return { dry: dry, wet: wet, names: {}, qty: {}, ts: 0 };
}

/** Inisialisasi Sheet jika belum ada */
function ensureSheets_() {
  var ss = getSpreadsheet_();
  if (!ss) {
    throw new Error('Tidak dapat menemukan Google Sheet. Pastikan script dibuka dari menu Extensions > Apps Script di Google Sheet.');
  }

  // 1. Sheet Database_Stok
  var dbSheet = ss.getSheetByName(SHEET_DB);
  if (!dbSheet) {
    dbSheet = ss.insertSheet(SHEET_DB);
  }
  if (dbSheet.getLastRow() < 1) {
    var headers = [[
      'No Buku',
      'ID Item',
      'Nama Asli Buku',
      'Nama Tampilan',
      'Satuan',
      'Gudang',
      'Urutan Gudang',
      'Stok',
      'Terakhir Diupdate'
    ]];
    dbSheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
    dbSheet.getRange(1, 1, 1, headers[0].length)
      .setFontWeight('bold')
      .setBackground('#1e293b')
      .setFontColor('#ffffff');
    dbSheet.setFrozenRows(1);
    dbSheet.setColumnWidth(1, 75);
    dbSheet.setColumnWidth(2, 70);
    dbSheet.setColumnWidth(3, 190);
    dbSheet.setColumnWidth(4, 190);
    dbSheet.setColumnWidth(5, 80);
    dbSheet.setColumnWidth(6, 95);
    dbSheet.setColumnWidth(7, 115);
    dbSheet.setColumnWidth(8, 100);
    dbSheet.setColumnWidth(9, 165);
  }

  // 2. Sheet Meta_State
  var metaSheet = ss.getSheetByName(SHEET_META);
  if (!metaSheet) {
    metaSheet = ss.insertSheet(SHEET_META);
  }
  if (metaSheet.getLastRow() < 1) {
    metaSheet.getRange(1, 1, 3, 2).setValues([
      ['Key', 'Value'],
      ['LAST_TS', '0'],
      ['RAW_JSON', '']
    ]);
    metaSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#e2e8f0');
    metaSheet.setColumnWidth(1, 140);
    metaSheet.setColumnWidth(2, 600);
  }

  return { ss: ss, dbSheet: dbSheet, metaSheet: metaSheet };
}

/**
 * Fungsi bantu yang bisa dijalankan langsung dari editor Apps Script
 * untuk menyiapkan tabel Google Sheet pertama kali.
 */
function setupDatabase() {
  var env = ensureSheets_();
  var state = loadStateObj_();
  if (!state || !state.ts) {
    state = getDefaultState_();
    state.ts = Date.now();
  }
  saveStateObj_(state);
  Logger.log('Database berhasil disiapkan di: ' + env.ss.getUrl());
  return 'Database Google Sheet berhasil disiapkan!';
}

/** Membaca State dari Google Sheet (Database_Stok & Meta_State) */
function loadStateObj_() {
  var env = ensureSheets_();
  var dbSheet = env.dbSheet;
  var metaSheet = env.metaSheet;
  var cat = getBookCatalog_();
  var def = getDefaultState_();

  var lastRow = dbSheet.getLastRow();
  var tsVal = Number(metaSheet.getRange(2, 2).getValue() || 0);

  // Jika tabel Database_Stok masih kosong, isi dengan data default
  if (lastRow < 2) {
    saveStateObj_(def);
    return def;
  }

  var data = dbSheet.getRange(2, 1, lastRow - 1, 8).getValues();
  var dryItems = [];
  var wetItems = [];
  var names = {};
  var qty = {};
  var seen = {};

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var id = Number(row[1]);
    if (isNaN(id) || id < 0 || id >= cat.list.length || seen[id]) continue;
    seen[id] = true;

    var origName = cat.list[id].name;
    var dispName = String(row[3] || '').trim().toUpperCase();
    var wh = String(row[5] || '').trim().toUpperCase();
    var whOrder = Number(row[6] || 9999);
    var stockVal = row[7] !== null && row[7] !== undefined ? String(row[7]).trim() : '';

    if (dispName && dispName !== origName) {
      names[id] = dispName;
    }
    if (stockVal !== '') {
      qty[id] = stockVal;
    }

    if (wh === 'DRY' || wh === 'KERING' || wh.indexOf('DRY') !== -1 || wh.indexOf('KERING') !== -1) {
      dryItems.push({ id: id, order: whOrder });
    } else {
      wetItems.push({ id: id, order: whOrder });
    }
  }

  dryItems.sort(function(a, b) { return a.order - b.order; });
  wetItems.sort(function(a, b) { return a.order - b.order; });

  var dry = dryItems.map(function(x) { return x.id; });
  var wet = wetItems.map(function(x) { return x.id; });

  // Pastikan semua 120 item terdaftar
  cat.list.forEach(function(b) {
    if (!seen[b.id]) {
      if (def.dry.indexOf(b.id) > -1) dry.push(b.id);
      else wet.push(b.id);
    }
  });

  return {
    dry: dry,
    wet: wet,
    names: names,
    qty: qty,
    ts: tsVal || Date.now()
  };
}

/** Menyimpan State ke Google Sheet (Database_Stok & Meta_State) */
function saveStateObj_(stateInput) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var env = ensureSheets_();
    var dbSheet = env.dbSheet;
    var metaSheet = env.metaSheet;
    var cat = getBookCatalog_();
    var def = getDefaultState_();

    var s = stateInput && typeof stateInput === 'object' ? stateInput : def;
    var dry = Array.isArray(s.dry) ? s.dry : def.dry;
    var wet = Array.isArray(s.wet) ? s.wet : def.wet;
    var names = s.names && typeof s.names === 'object' ? s.names : {};
    var qty = s.qty && typeof s.qty === 'object' ? s.qty : {};
    var ts = Number(s.ts) || Date.now();

    var dryRank = {};
    dry.forEach(function(id, idx) { dryRank[id] = idx + 1; });
    var wetRank = {};
    wet.forEach(function(id, idx) { wetRank[id] = idx + 1; });

    var nowStr = Utilities.formatDate(new Date(ts), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

    // Susun 120 baris berurutan sesuai Nomor Buku (1 s/d 120) agar rapi di Google Sheet
    var rows = cat.list.map(function(b) {
      var isDry = Object.prototype.hasOwnProperty.call(dryRank, b.id);
      var whLabel = isDry ? 'KERING' : 'BASAH';
      var orderNum = isDry ? dryRank[b.id] : (wetRank[b.id] || 999);
      var dispName = names[b.id] ? String(names[b.id]).trim().toUpperCase() : b.name;
      var qVal = qty[b.id] !== undefined && qty[b.id] !== null ? String(qty[b.id]) : '';
      return [
        b.id + 1,       // Kolom A: No Buku (1 - 120)
        b.id,           // Kolom B: ID Item (0 - 119)
        b.name,         // Kolom C: Nama Asli Buku
        dispName,       // Kolom D: Nama Tampilan
        b.unit,         // Kolom E: Satuan
        whLabel,        // Kolom F: Gudang (DRY / BASAH)
        orderNum,       // Kolom G: Urutan di Gudang
        qVal,           // Kolom H: Stok
        nowStr          // Kolom I: Terakhir Diupdate
      ];
    });

    dbSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);

    var cleanState = {
      dry: dry,
      wet: wet,
      names: names,
      qty: qty,
      ts: ts
    };
    metaSheet.getRange(2, 2, 2, 1).setValues([
      [String(ts)],
      [JSON.stringify(cleanState)]
    ]);

    return cleanState;
  } finally {
    lock.releaseLock();
  }
}

/** Membuat response JSON dengan dukungan CORS untuk GitHub Pages */
function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ============================================================================
 * HTTP GET — Dipanggil oleh GitHub Pages saat memuat data (?action=load)
 * ============================================================================
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action) : 'load';

  // Jika diakses dari GitHub Pages (fetch GET)
  if (action === 'load' || action === 'ping') {
    try {
      var state = loadStateObj_();
      return jsonResponse_({
        ok: true,
        source: 'google_sheets',
        sheetName: SHEET_DB,
        state: state
      });
    } catch (err) {
      return jsonResponse_({
        ok: false,
        error: String(err && err.message ? err.message : err)
      });
    }
  }

  // Fallback jika pengguna membuka mode ?ui=html dan punya file Index.html di Apps Script
  if (action === 'html') {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Stok Gudang')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return jsonResponse_({
    ok: true,
    status: 'Stok Gudang API Aktif',
    state: loadStateObj_()
  });
}

/**
 * ============================================================================
 * HTTP POST — Dipanggil oleh GitHub Pages saat menyimpan perubahan
 * Menggunakan Content-Type: text/plain;charset=utf-8 agar bebas blokir CORS
 * ============================================================================
 */
function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var body = JSON.parse(raw);
    var action = body.action || 'save';

    if (action === 'save' || action === 'saveState') {
      var saved = saveStateObj_(body.state || body);
      return jsonResponse_({ ok: true, ts: saved.ts, state: saved });
    }

    if (action === 'load' || action === 'getState') {
      return jsonResponse_({ ok: true, state: loadStateObj_() });
    }

    return jsonResponse_({ ok: false, error: 'Action tidak dikenali: ' + action });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}

/**
 * Kompatibilitas mundur jika tetap dijalankan di dalam HtmlService (google.script.run)
 */
function loadState() {
  return JSON.stringify(loadStateObj_());
}

function saveState(json) {
  var parsed = typeof json === 'string' ? JSON.parse(json) : json;
  saveStateObj_(parsed);
  return true;
}
`;
}

/**
 * Generates standalone index.html for GitHub Pages hosting
 * Preserves 100% of the user's original UI, animations, drag-and-drop, and features,
 * while upgrading the sync engine to connect directly to Google Sheets via Apps Script Web App URL!
 */
export function generateGithubIndexHtml(defaultGasUrl: string = DEFAULT_USER_GAS_URL): string {
  const cleanUrl = (defaultGasUrl || DEFAULT_USER_GAS_URL).trim();
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#4f46e5">
<title>Stok Gudang</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#f3f5fb; --card:#ffffff; --text:#0f172a; --mut:#64748b; --line:#e5e9f2;
  --acc:#4f46e5; --acc2:#06b6d4; --ok:#10b981; --warn:#f59e0b; --err:#ef4444;
  --ring:rgba(79,70,229,.16); --glass:rgba(243,245,251,.82);
  --sh:0 1px 2px rgba(15,23,42,.04),0 4px 14px rgba(15,23,42,.05);
  --grad:linear-gradient(135deg,#4f46e5 0%,#7c3aed 55%,#06b6d4 100%);
}
@media (prefers-color-scheme:dark){
  :root{
    --bg:#0a0f1f; --card:#121a30; --text:#e9edf9; --mut:#8c98b8; --line:#222c48;
    --ring:rgba(129,140,248,.22); --glass:rgba(10,15,31,.82); --acc:#818cf8;
    --sh:0 1px 2px rgba(0,0,0,.3),0 4px 14px rgba(0,0,0,.25);
  }
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0}
body{
  font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  background:var(--bg);color:var(--text);
  min-height:100dvh;padding-bottom:calc(120px + env(safe-area-inset-bottom));
  -webkit-font-smoothing:antialiased;overscroll-behavior-y:none;
}
body::before{
  content:"";position:fixed;inset:0 0 auto 0;height:260px;z-index:-1;pointer-events:none;
  background:radial-gradient(60% 100% at 85% 0%,rgba(124,58,237,.18),transparent 70%),
             radial-gradient(60% 100% at 0% 0%,rgba(6,182,212,.16),transparent 70%);
}
button{font:inherit;color:inherit;border:0;background:none;cursor:pointer}
svg{display:block}

/* ---------- Header ---------- */
header{
  position:sticky;top:0;z-index:30;
  padding:calc(14px + env(safe-area-inset-top)) 16px 12px;
  background:var(--glass);backdrop-filter:blur(18px) saturate(1.6);-webkit-backdrop-filter:blur(18px) saturate(1.6);
  border-bottom:1px solid var(--line);
}
.top{display:flex;align-items:center;gap:8px;max-width:640px;margin:0 auto}
.logo{
  width:42px;height:42px;border-radius:14px;background:var(--grad);display:grid;place-items:center;
  box-shadow:0 6px 18px rgba(79,70,229,.35);flex:none;
  animation:pop .7s cubic-bezier(.2,1.4,.4,1) both;
}
.logo svg{width:22px;height:22px;stroke:#fff}
.ttl{flex:1;min-width:0}
.ttl h1{margin:0;font-size:18px;font-weight:800;letter-spacing:-.02em}
.ttl p{margin:1px 0 0;font-size:12px;color:var(--mut);font-weight:500;display:flex;align-items:center;gap:6px;cursor:pointer}
.dot{width:7px;height:7px;border-radius:50%;background:var(--ok);flex:none;transition:background .3s}
.dot.saving{background:var(--warn);animation:blink 1s infinite}
.dot.local{background:#94a3b8}
.dot.error{background:var(--err)}
.ib{
  width:40px;height:40px;border-radius:13px;display:grid;place-items:center;
  background:var(--card);border:1px solid var(--line);box-shadow:var(--sh);
  transition:transform .2s,background .25s,border-color .25s;flex:none;
}
.ib:active{transform:scale(.9)}
.ib svg{width:19px;height:19px;stroke:var(--mut);transition:stroke .25s}
body.editing #btnEdit{background:var(--acc);border-color:var(--acc)}
body.editing #btnEdit svg{stroke:#fff}
.ib.connected svg{stroke:var(--ok)}

.seg{
  position:relative;display:grid;grid-template-columns:repeat(2,1fr);
  max-width:640px;margin:12px auto 0;padding:4px;border-radius:16px;
  background:var(--card);border:1px solid var(--line);box-shadow:var(--sh);
}
.seg.three{grid-template-columns:repeat(3,1fr)}
.seg .thumb{
  position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - 8px)/2);border-radius:12px;
  background:var(--grad);box-shadow:0 6px 16px rgba(79,70,229,.35);
  transition:transform .45s cubic-bezier(.3,1.3,.4,1),width .35s cubic-bezier(.3,1.3,.4,1);
}
.seg.three .thumb{width:calc((100% - 8px)/3)}
.seg button{
  position:relative;z-index:1;height:40px;border-radius:12px;font-size:13.5px;font-weight:700;color:var(--mut);
  display:flex;align-items:center;justify-content:center;gap:6px;transition:color .3s,opacity .3s;
}
.seg button[data-tab="all"]{display:none}
.seg.three button[data-tab="all"]{display:flex}
.seg button b{
  font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px;background:rgba(100,116,139,.15);transition:background .3s;
}
.seg button.on{color:#fff}
.seg button.on b{background:rgba(255,255,255,.25)}
body.editing .seg button[data-tab="all"]{opacity:.35;pointer-events:none}

.prog{max-width:640px;margin:12px auto 0}
.prog-top{display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;color:var(--mut);margin-bottom:6px}
.prog-top .pill{
  display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:99px;
  background:var(--ring);color:var(--acc);font-weight:700;font-size:11px;
  transform-origin:left;animation:pop .45s cubic-bezier(.2,1.4,.4,1) both;
}
.prog-top .pill[hidden]{display:none}
.bar{height:7px;border-radius:99px;background:var(--line);overflow:hidden}
.bar i{
  display:block;height:100%;width:0;border-radius:99px;background:var(--grad);
  transition:width .6s cubic-bezier(.3,1,.4,1),background .4s;position:relative;overflow:hidden;
}
.bar i::after{
  content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);
  transform:translateX(-100%);animation:shine 2.2s infinite;
}
.bar.done i{background:linear-gradient(90deg,#10b981,#34d399)}

/* ---------- List ---------- */
main{max-width:640px;margin:0 auto;padding:14px 14px 0}
.row{
  display:flex;align-items:center;gap:11px;padding:9px 10px 9px 9px;margin-bottom:8px;
  background:var(--card);border:1px solid var(--line);border-radius:18px;box-shadow:var(--sh);
  transition:border-color .25s,box-shadow .25s,background .25s;
  position:relative;
}
.row:focus-within{border-color:var(--acc);box-shadow:0 0 0 4px var(--ring)}
.handle{
  display:none;width:30px;height:44px;align-items:center;justify-content:center;flex:none;
  touch-action:none;cursor:grab;border-radius:10px;margin-right:-4px;
}
.handle svg{width:20px;height:20px;stroke:var(--mut)}
.row.dragging{
  z-index:40;border-color:var(--acc);cursor:grabbing;
  box-shadow:0 22px 44px rgba(79,70,229,.3),0 0 0 4px var(--ring);
}
.idx{
  width:36px;height:36px;border-radius:12px;flex:none;display:grid;place-items:center;
  font-size:13px;font-weight:800;color:var(--mut);background:var(--bg);
  transition:background .35s,color .35s,transform .35s;
}
.row.filled .idx{background:var(--ok);color:#fff}
.book .idx{font-size:12px}
.info{flex:1;min-width:0}
.name{font-size:15px;font-weight:700;letter-spacing:-.01em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nameinput{
  display:none;width:100%;height:40px;border-radius:11px;border:1.5px solid var(--line);background:var(--bg);
  padding:0 11px;font:inherit;font-size:16px;font-weight:700;color:var(--text);outline:none;text-transform:uppercase;
}
.nameinput:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--ring)}
.meta{display:flex;gap:6px;margin-top:3px}
.unit,.wh{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:99px;letter-spacing:.04em}
.unit{background:rgba(6,182,212,.14);color:#0891b2}
.unit:empty{display:none}
.wh{display:none;background:rgba(124,58,237,.14);color:#7c3aed}
.wh.wet{background:rgba(16,185,129,.14);color:#059669}
@media (prefers-color-scheme:dark){.unit{color:#22d3ee}.wh{color:#a78bfa}.wh.wet{color:#34d399}}
.tab-all .wh{display:inline-block}
.swap{display:none;width:40px;height:40px;border-radius:12px;align-items:center;justify-content:center;background:var(--bg);flex:none;transition:transform .2s}
.swap:active{transform:scale(.88) rotate(180deg)}
.swap svg{width:18px;height:18px;stroke:var(--mut)}
.qty{
  width:92px;height:46px;border-radius:14px;border:1.5px solid var(--line);background:var(--bg);
  text-align:center;font:inherit;font-size:19px;font-weight:800;color:var(--text);outline:none;
  transition:border-color .25s,background .25s,box-shadow .25s;
}
.qty::placeholder{color:var(--line);font-weight:700}
.qty:focus{border-color:var(--acc);background:var(--card)}
.row.filled .qty{border-color:rgba(16,185,129,.5)}

/* mode edit */
body.editing .handle,body.editing .swap{display:flex}
body.editing .nameinput{display:block}
body.editing .name,body.editing .qty{display:none}
body.editing .row{padding-left:6px}
body.dragmode{user-select:none;-webkit-user-select:none;cursor:grabbing}

/* ---------- Bottom bar ---------- */
.dock{
  position:fixed;left:0;right:0;bottom:0;z-index:35;
  padding:12px 14px calc(12px + env(safe-area-inset-bottom));
  background:var(--glass);backdrop-filter:blur(18px) saturate(1.6);-webkit-backdrop-filter:blur(18px) saturate(1.6);
  border-top:1px solid var(--line);
  transition:transform .45s cubic-bezier(.3,1,.4,1);
}
body.typing .dock{transform:translateY(110%)}
.dock-in{display:flex;gap:10px;max-width:640px;margin:0 auto}
.copy{
  width:56px;height:56px;border-radius:18px;display:grid;place-items:center;flex:none;
  background:var(--card);border:1px solid var(--line);box-shadow:var(--sh);transition:transform .2s;
}
.copy:active{transform:scale(.9)}
.copy svg{width:22px;height:22px;stroke:var(--acc)}
body.editing .copy{display:none}
.main-btn{
  flex:1;height:56px;border-radius:18px;color:#fff;font-weight:800;font-size:16px;letter-spacing:-.01em;
  background:var(--grad);box-shadow:0 10px 26px rgba(79,70,229,.4);
  display:flex;align-items:center;justify-content:center;gap:10px;position:relative;overflow:hidden;
  transition:transform .2s,box-shadow .2s;
}
.main-btn:active{transform:scale(.97)}
.main-btn::after{
  content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.28) 50%,transparent 70%);
  transform:translateX(-120%);animation:shine 3.4s infinite;
}
.main-btn svg{width:22px;height:22px;stroke:#fff;transition:transform .5s cubic-bezier(.3,1.4,.4,1)}
.main-btn.back{background:linear-gradient(135deg,#0f172a,#334155)}
.main-btn.back svg{transform:rotate(-360deg)}
.main-btn.done{background:linear-gradient(135deg,#059669,#10b981);box-shadow:0 10px 26px rgba(16,185,129,.4)}

/* ---------- Toast & modal ---------- */
.toast{
  position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom));z-index:60;
  transform:translate(-50%,30px) scale(.9);opacity:0;pointer-events:none;
  background:#0f172a;color:#fff;padding:11px 18px;border-radius:99px;font-size:13.5px;font-weight:600;
  box-shadow:0 12px 30px rgba(0,0,0,.3);white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis;
  transition:transform .45s cubic-bezier(.3,1.4,.4,1),opacity .3s;
}
.toast.show{transform:translate(-50%,0) scale(1);opacity:1}
body.typing .toast{bottom:24px}
.scrim{
  position:fixed;inset:0;z-index:70;background:rgba(8,12,28,.5);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .3s;
}
.scrim.show{opacity:1;pointer-events:auto}
.sheet{
  width:100%;max-width:520px;background:var(--card);border-radius:28px 28px 0 0;
  padding:22px 20px calc(20px + env(safe-area-inset-bottom));
  transform:translateY(100%);transition:transform .5s cubic-bezier(.3,1.1,.4,1);text-align:center;
}
.scrim.show .sheet{transform:none}
.sheet .ic{width:56px;height:56px;border-radius:18px;margin:0 auto 12px;display:grid;place-items:center;background:rgba(239,68,68,.12)}
.sheet .ic.cfg{background:rgba(79,70,229,.12)}
.sheet .ic svg{width:26px;height:26px;stroke:var(--err)}
.sheet .ic.cfg svg{stroke:var(--acc)}
.sheet h3{margin:0 0 4px;font-size:18px;font-weight:800}
.sheet p{margin:0 0 16px;font-size:13.5px;color:var(--mut);line-height:1.5}
.cfg-input{
  width:100%;height:46px;border-radius:14px;border:1.5px solid var(--line);background:var(--bg);
  padding:0 14px;font:inherit;font-size:13.5px;color:var(--text);outline:none;margin-bottom:12px;
}
.cfg-input:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--ring)}
.sheet .btns{display:flex;gap:10px}
.sheet .btns button{flex:1;height:50px;border-radius:16px;font-weight:700;font-size:15px}
.b-cancel{background:var(--bg);border:1px solid var(--line)}
.b-danger{background:var(--err);color:#fff;box-shadow:0 8px 20px rgba(239,68,68,.35)}
.b-primary{background:var(--acc);color:#fff;box-shadow:0 8px 20px rgba(79,70,229,.35)}
.b-sec{background:rgba(16,185,129,.14);color:var(--ok);margin-bottom:10px;width:100%;height:46px;border-radius:14px;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px}

@keyframes pop{from{transform:scale(.5);opacity:0}to{transform:none;opacity:1}}
@keyframes shine{0%,55%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
@keyframes blink{50%{opacity:.3}}
@media (prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
@media (max-width:360px){.qty{width:78px}.name{font-size:14px}}
</style>
</head>
<body>

<header>
  <div class="top">
    <div class="logo">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>
    </div>
    <div class="ttl" id="ttlSync" title="Ketuk untuk pengaturan koneksi Google Sheet">
      <h1>Stok Gudang</h1>
      <p><span class="dot saving" id="dot"></span><span id="dateTxt"></span> · <span id="syncTxt">Memuat…</span></p>
    </div>
    <button class="ib" id="btnCloud" aria-label="Pengaturan Google Sheet" title="Koneksi Google Sheet & Arsip">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/></svg>
    </button>
    <button class="ib" id="btnReset" aria-label="Kosongkan angka">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
    </button>
    <button class="ib" id="btnEdit" aria-label="Edit urutan dan nama">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
    </button>
  </div>

  <div class="seg" id="seg">
    <div class="thumb" id="thumb"></div>
    <button data-tab="dry" class="on">Kering <b id="cDry">0</b></button>
    <button data-tab="wet">Basah <b id="cWet">0</b></button>
    <button data-tab="all">Semua <b id="cAll">0</b></button>
  </div>

  <div class="prog">
    <div class="prog-top">
      <span id="progTxt">0 / 0 terisi</span>
      <span class="pill" id="pillBook" hidden>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14z"/></svg>
        Urutan Buku
      </span>
      <span class="pill" id="pillEdit" hidden>Mode Edit</span>
    </div>
    <div class="bar" id="bar"><i id="barFill"></i></div>
  </div>
</header>

<main>
  <div id="list" class="tab-dry"></div>
</main>

<div class="dock">
  <div class="dock-in">
    <button class="main-btn" id="btnMain">
      <svg id="mainIcon" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></svg>
      <span id="mainTxt">Susun Sesuai Buku</span>
    </button>
  </div>
</div>

<div class="toast" id="toast"></div>

<!-- Modal Reset Angka -->
<div class="scrim" id="scrim">
  <div class="sheet">
    <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg></div>
    <h3>Kosongkan semua angka?</h3>
    <p>Semua angka stok yang sudah diisi akan dihapus. Urutan dan nama item tidak berubah.</p>
    <div class="btns">
      <button class="b-cancel" id="rsCancel">Batal</button>
      <button class="b-danger" id="rsOk">Ya, kosongkan</button>
    </div>
  </div>
</div>

<!-- Modal Koneksi Google Sheet (Apps Script Web App URL) -->
<div class="scrim" id="scrimCfg">
  <div class="sheet">
    <div class="ic cfg"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/></svg></div>
    <h3>Database Google Sheet</h3>
    <p>URL Web App Google Apps Script terhubung otomatis. Data stok lama di Google Sheet akan selalu diperbarui/ditimpa dengan data terbaru.</p>
    <input class="cfg-input" id="inpGasUrl" type="url" placeholder="https://script.google.com/macros/s/.../exec" autocomplete="off" spellcheck="false">
    <div class="btns">
      <button class="b-cancel" id="cfgCancel" type="button">Tutup</button>
      <button class="b-primary" id="cfgSave" type="button">Simpan & Sinkron</button>
    </div>
  </div>
</div>

<script>
(function(){
'use strict';

/* ============================================================================
 * KONFIGURASI URL GOOGLE APPS SCRIPT (Bisa diisi langsung di sini atau lewat tombol Sheet di kanan atas)
 * ============================================================================ */
var DEFAULT_GAS_URL = ${JSON.stringify(cleanUrl)};
var LS_GAS_URL = 'stok_gudang_gas_url_v1';

function getGasUrl(){
  try {
    var saved = localStorage.getItem(LS_GAS_URL);
    if (saved && saved.trim()) return saved.trim();
  } catch(e){}
  return DEFAULT_GAS_URL;
}

/* ================= DATA BAWAAN (urutan buku = urutan baris ini) ================= */
var BOOK_RAW = ${JSON.stringify(BOOK_RAW)};
var BOOK = BOOK_RAW.map(function(s,i){var p=s.split('|');return {id:i,name:p[0],unit:p[1]||''};});
var BY_NAME = {}; BOOK.forEach(function(b){BY_NAME[b.name]=b.id;});

/* Urutan Gudang Dry (sesuai urutan fisik yang kamu tentukan) */
var DRY_NAMES = ${JSON.stringify(DRY_NAMES)};

function defaults(){
  var dry = DRY_NAMES.map(function(n){return BY_NAME[n];});
  var set = {}; dry.forEach(function(id){set[id]=1;});
  var wet = BOOK.filter(function(b){return !set[b.id];}).map(function(b){return b.id;});
  return {dry:dry, wet:wet, names:{}, qty:{}, ts:0};
}
function sanitize(s){
  var d = defaults();
  if(!s || typeof s!=='object') return d;
  if(s.items && s.items[0] && String(s.items[0].origName||'').toUpperCase()==='BERAS'){
    return {dry:d.dry, wet:d.wet, names:{}, qty:{}, ts:0, needsCatalogUpgrade:true};
  }
  var seen = {};
  function clean(a){
    return (Array.isArray(a)?a:[]).filter(function(id){
      var num = Number(id);
      if(!Number.isInteger(num)||num<0||num>=BOOK.length||seen[num]) return false;
      seen[num]=1; return true;
    }).map(Number);
  }
  var dry = clean(s.dry), wet = clean(s.wet);
  BOOK.forEach(function(b){
    if(!seen[b.id]){ (d.dry.indexOf(b.id)>-1 ? dry : wet).push(b.id); }
  });
  var names = (s.names&&typeof s.names==='object')?Object.assign({},s.names):{};
  var qty = (s.qty&&typeof s.qty==='object')?Object.assign({},s.qty):{};
  if(s.items && typeof s.items==='object'){
    BOOK.forEach(function(b){
      var it = s.items[b.id];
      if(it && typeof it==='object'){
        var disp = String(it.name||'').trim().toUpperCase();
        if(disp && disp !== b.name.toUpperCase()) names[b.id] = disp;
        var st = (it.stock!==undefined && it.stock!==null) ? String(it.stock).trim() : '';
        if(st !== '') qty[b.id] = st;
      }
    });
  }
  return {
    dry:dry, wet:wet,
    names:names,
    qty:qty,
    ts:+s.ts||0
  };
}
function serializeForSheet(s){
  var items = {};
  BOOK.forEach(function(b){
    items[b.id] = {
      id: b.id,
      bookIdx: b.id,
      origName: b.name,
      name: (s.names && s.names[b.id]) ? s.names[b.id] : b.name,
      unit: b.unit,
      stock: (s.qty && s.qty[b.id]!==undefined) ? String(s.qty[b.id]) : ''
    };
  });
  return {
    dry: s.dry,
    wet: s.wet,
    names: s.names || {},
    qty: s.qty || {},
    items: items,
    ts: s.ts || Date.now()
  };
}

/* ================= STATE ================= */
var LS = 'stok_gudang_v1';
var hasNativeGAS = typeof google!=='undefined' && google.script && google.script.run;
var state;
try { state = sanitize(JSON.parse(localStorage.getItem(LS))); } catch(e){ state = defaults(); }
var ui = {tab:'dry', mode:'wh', edit:false};

var $ = function(id){return document.getElementById(id);};
var list=$('list'), rows={};

/* ================= ICONS ================= */
var ICON_BOOK = '<path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14z"/><path d="M9 7h7M9 11h5"/>';
var ICON_BACK = '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>';
var ICON_CHECK = '<path d="M20 6L9 17l-5-5"/>';
var GRIP = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/></svg>';
var SWAP = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4L3 8l4 4"/><path d="M3 8h14"/><path d="M17 20l4-4-4-4"/><path d="M21 16H7"/></svg>';

/* ================= SIMPAN & SINKRONISASI GOOGLE SHEETS ================= */
var saveTimer;
function setSync(s){
  var dot=$('dot'), t=$('syncTxt'), bc=$('btnCloud');
  dot.className='dot'+(s==='saved'?'':' '+s);
  t.textContent = ({
    saving:'Menyimpan ke Sheet…',
    saved:'Tersimpan di Sheet',
    local:'Tersimpan di perangkat',
    error:'Gagal sinkron Sheet'
  })[s]||'';
  if(bc) bc.classList.toggle('connected', s==='saved');
}

function touch(){
  state.ts = Date.now();
  try{ localStorage.setItem(LS, JSON.stringify(state)); }catch(e){}
  setSync('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(pushServer, 650);
}

function pushServer(){
  clearTimeout(saveTimer);
  var gasUrl = getGasUrl();
  var snapObj = state;
  var snapStr = JSON.stringify(snapObj);

  if(hasNativeGAS){
    google.script.run
      .withSuccessHandler(function(){ if(JSON.stringify(state)===snapStr) setSync('saved'); })
      .withFailureHandler(function(){ setSync('error'); })
      .saveState(snapStr);
    return;
  }

  if(!gasUrl){
    setSync('local');
    return;
  }

  fetch(gasUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'saveState', state: serializeForSheet(snapObj) })
  })
  .then(function(r){ return r.json(); })
  .then(function(res){
    if(res && res.ok){
      if(JSON.stringify(state)===snapStr) setSync('saved');
    } else {
      setSync('error');
    }
  })
  .catch(function(){
    setSync('error');
  });
}

function pullServer(){
  var gasUrl = getGasUrl();
  if(hasNativeGAS){
    setSync('saving');
    google.script.run
      .withSuccessHandler(function(raw){
        var s=null; try{ s = raw ? sanitize(JSON.parse(raw)) : null; }catch(e){}
        handleRemoteState(s);
      })
      .withFailureHandler(function(){ setSync('local'); })
      .loadState();
    return;
  }

  if(!gasUrl){
    setSync('local');
    return;
  }

  setSync('saving');
  var sep = gasUrl.indexOf('?') > -1 ? '&' : '?';
  fetch(gasUrl + sep + 'action=getState&_t=' + Date.now(), {
    method: 'GET',
    redirect: 'follow'
  })
  .then(function(r){ return r.json(); })
  .then(function(res){
    if(res && res.ok && res.state){
      handleRemoteState(sanitize(res.state));
    } else {
      setSync('error');
    }
  })
  .catch(function(){
    setSync('error');
  });
}

function handleRemoteState(s){
  if(!s || s.needsCatalogUpgrade){
    state.ts = Date.now();
    pushServer();
    return;
  }
  if(s.ts >= state.ts){
    state = s;
    try{ localStorage.setItem(LS, JSON.stringify(state)); }catch(e){}
    render(false);
    setSync('saved');
  } else if(state.ts > s.ts){
    pushServer();
  } else {
    setSync('saved');
  }
}

document.addEventListener('visibilitychange',function(){
  if(document.hidden && $('syncTxt').textContent.indexOf('Menyimpan')>-1) pushServer();
});

/* ================= HELPERS ================= */
function nameOf(id){ return state.names[id] || BOOK[id].name; }
function visibleIds(){
  var ids = ui.tab==='dry' ? state.dry.slice() : ui.tab==='wet' ? state.wet.slice() : state.dry.concat(state.wet);
  if(ui.mode==='book') ids.sort(function(a,b){return a-b;});
  return ids;
}
function vib(ms){ try{navigator.vibrate&&navigator.vibrate(ms);}catch(e){} }
var toastT;
function toast(msg){
  var t=$('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(function(){t.classList.remove('show');},2200);
}
function flip(els, mutate, flash){
  var first = new Map(); els.forEach(function(e){first.set(e,e.getBoundingClientRect().top);});
  mutate();
  var n=0;
  els.forEach(function(e){
    if(!e.isConnected) return;
    var dy = first.get(e)-e.getBoundingClientRect().top;
    if(!dy) return;
    var delay = Math.min(n++*14,320);
    e.animate([{transform:'translateY('+dy+'px)'},{transform:'none'}],
      {duration:flash?720:380,delay:flash?delay:0,easing:'cubic-bezier(.25,1.15,.35,1)',fill:'backwards'});
    if(flash){
      e.animate([{boxShadow:'0 0 0 3px var(--acc)'},{boxShadow:'0 0 0 0 transparent'}],
        {duration:900,delay:delay+200,easing:'ease-out'});
    }
  });
}

/* ================= ROW ================= */
function makeRow(b){
  var el=document.createElement('div');
  el.className='row'; el.dataset.id=b.id;
  el.innerHTML =
    '<div class="handle" aria-label="Geser urutan">'+GRIP+'</div>'+
    '<div class="idx"></div>'+
    '<div class="info"><div class="name"></div>'+
    '<input class="nameinput" type="text" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="done">'+
    '<div class="meta"><span class="unit"></span><span class="wh"></span></div></div>'+
    '<button class="swap" aria-label="Pindah gudang">'+SWAP+'</button>'+
    '<input class="qty" type="text" inputmode="decimal" enterkeyhint="next" placeholder="0" autocomplete="off" aria-label="Jumlah">';
  el.querySelector('.unit').textContent=b.unit;
  return el;
}
function decorate(el,id,i,drySet){
  el.querySelector('.idx').textContent = ui.mode==='book' ? (id+1) : (i+1);
  var nm = nameOf(id);
  el.querySelector('.name').textContent = nm;
  var ni = el.querySelector('.nameinput'); if(document.activeElement!==ni) ni.value = nm;
  var w = el.querySelector('.wh'); var isDry = drySet[id];
  w.textContent = isDry?'KERING':'BASAH'; w.className = 'wh'+(isDry?'':' wet');
  var q = el.querySelector('.qty'); var v = state.qty[id]||'';
  if(document.activeElement!==q) q.value = v;
  el.classList.toggle('filled', v!=='');
}
function dryMap(){ var m={}; state.dry.forEach(function(id){m[id]=1;}); return m; }

/* ================= RENDER ================= */
function render(anim){
  if(ui.mode!=='book' && ui.tab==='all') ui.tab='dry';
  var ids = visibleIds(), want={}; ids.forEach(function(id){want[id]=1;});
  Array.prototype.slice.call(list.children).forEach(function(c){ if(!want[+c.dataset.id]) c.remove(); });
  var dm = dryMap();
  list.className = 'tab-'+ui.tab + (ui.mode==='book'?' book':'');
  ids.forEach(function(id,i){
    var el=rows[id]; list.appendChild(el); decorate(el,id,i,dm);
    if(anim) el.animate(
      [{opacity:0,transform:'translateY(18px) scale(.97)'},{opacity:1,transform:'none'}],
      {duration:520,delay:Math.min(i*20,420),easing:'cubic-bezier(.2,.9,.25,1)',fill:'backwards'});
  });
  chrome();
}
function chrome(){
  var isBook = ui.mode==='book' && !ui.edit;
  if(!isBook && ui.tab==='all') ui.tab='dry';
  $('seg').classList.toggle('three', isBook);
  var ids=visibleIds(), f=0;
  ids.forEach(function(id){ if((state.qty[id]||'')!=='') f++; });
  $('progTxt').textContent = f+' / '+ids.length+' terisi';
  var pct = ids.length? f/ids.length*100 : 0;
  $('barFill').style.width = pct+'%';
  $('bar').classList.toggle('done', ids.length>0 && f===ids.length);
  $('cDry').textContent=state.dry.length; $('cWet').textContent=state.wet.length; $('cAll').textContent=BOOK.length;
  var tabs = isBook ? ['dry','wet','all'] : ['dry','wet'];
  var ti = Math.max(0, tabs.indexOf(ui.tab));
  $('thumb').style.transform='translateX('+(ti*100)+'%)';
  Array.prototype.forEach.call($('seg').querySelectorAll('button'),function(b){b.classList.toggle('on',b.dataset.tab===ui.tab);});
  $('pillBook').hidden = !(ui.mode==='book' && !ui.edit);
  $('pillEdit').hidden = !ui.edit;
  var mb=$('btnMain'), ic=$('mainIcon'), tx=$('mainTxt');
  mb.classList.remove('back','done');
  if(ui.edit){ mb.classList.add('done'); ic.innerHTML=ICON_CHECK; tx.textContent='Selesai Edit'; }
  else if(ui.mode==='book'){ mb.classList.add('back'); ic.innerHTML=ICON_BACK; tx.textContent='Kembali ke Urutan Gudang'; }
  else { ic.innerHTML=ICON_BOOK; tx.textContent='Susun Sesuai Buku'; }
}

/* ================= EVENTS: input ================= */
list.addEventListener('input',function(e){
  var row=e.target.closest('.row'); if(!row) return; var id=+row.dataset.id;
  if(e.target.classList.contains('qty')){
    var v=e.target.value.replace(/[^0-9.,]/g,''); if(v!==e.target.value) e.target.value=v;
    if(v==='') delete state.qty[id]; else state.qty[id]=v;
    row.classList.toggle('filled', v!=='');
    touch(); chrome();
    var allDone=$('bar').classList.contains('done'); if(allDone && v.length===1) vib(15);
  } else if(e.target.classList.contains('nameinput')){
    var nv=e.target.value.trim();
    if(!nv || nv===BOOK[id].name) delete state.names[id]; else state.names[id]=nv;
    row.querySelector('.name').textContent=nameOf(id);
    touch();
  }
});
list.addEventListener('keydown',function(e){
  if(e.key!=='Enter') return;
  var row=e.target.closest('.row'); if(!row) return;
  if(e.target.classList.contains('qty')){
    e.preventDefault();
    var nx=row.nextElementSibling;
    if(nx){ var q=nx.querySelector('.qty'); q.focus(); q.select(); } else e.target.blur();
  } else if(e.target.classList.contains('nameinput')){ e.preventDefault(); e.target.blur(); }
});
list.addEventListener('focusin',function(e){
  if(!e.target.matches('.qty,.nameinput')) return;
  if(e.target.classList.contains('qty')){ document.body.classList.add('typing'); e.target.select(); }
  var el=e.target; setTimeout(function(){ el.scrollIntoView({block:'center',behavior:'smooth'}); },280);
});
list.addEventListener('focusout',function(){
  setTimeout(function(){ if(!document.activeElement || !document.activeElement.matches('.qty')) document.body.classList.remove('typing'); },120);
});

/* ---- pindah gudang (mode edit) ---- */
list.addEventListener('click',function(e){
  var b=e.target.closest('.swap'); if(!b) return;
  var row=b.closest('.row'), id=+row.dataset.id;
  var from = ui.tab==='dry'?'dry':'wet', to = from==='dry'?'wet':'dry';
  state[from]=state[from].filter(function(x){return x!==id;}); state[to].push(id);
  vib(10); touch();
  var a=row.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateX('+(to==='wet'?'':'-')+'60px) scale(.9)'}],{duration:260,easing:'ease-in',fill:'forwards'});
  a.onfinish=function(){ a.cancel(); render(false); toast('Dipindah ke Gudang '+(to==='dry'?'Kering':'Basah')); };
});

/* ================= DRAG & DROP (mode edit) ================= */
var drag=null;
list.addEventListener('pointerdown',function(e){
  var h=e.target.closest('.handle'); if(!h||!ui.edit) return;
  e.preventDefault();
  var row=h.closest('.row'), r=row.getBoundingClientRect();
  drag={row:row,grab:e.clientY-r.top,y:e.clientY,pid:e.pointerId,raf:0};
  row.classList.add('dragging'); document.body.classList.add('dragmode');
  try{h.setPointerCapture(e.pointerId);}catch(_){}
  vib(12); dragUpdate(); drag.raf=requestAnimationFrame(dragLoop);
});
window.addEventListener('pointermove',function(e){ if(drag&&e.pointerId===drag.pid){ drag.y=e.clientY; } });
window.addEventListener('pointerup',endDrag);
window.addEventListener('pointercancel',endDrag);
function dragLoop(){
  if(!drag) return;
  var y=drag.y, vh=window.innerHeight;
  if(y<170) window.scrollBy(0,-Math.min(16,(170-y)/6+3));
  else if(y>vh-130) window.scrollBy(0,Math.min(16,(y-(vh-130))/6+3));
  dragUpdate(); drag.raf=requestAnimationFrame(dragLoop);
}
function dragUpdate(){
  var row=drag.row, guard=0;
  while(guard++<3){
    row.style.transform='none';
    var nat=row.getBoundingClientRect();
    var center=drag.y-drag.grab+nat.height/2;
    var nx=row.nextElementSibling, pv=row.previousElementSibling, moved=false;
    if(nx){ var nr=nx.getBoundingClientRect();
      if(center>nr.top+nr.height/2){ (function(s){flip([s],function(){list.insertBefore(s,row);});})(nx); moved=true; } }
    if(!moved && pv){ var pr=pv.getBoundingClientRect();
      if(center<pr.top+pr.height/2){ (function(s,after){flip([s],function(){list.insertBefore(s,after);});})(pv,row.nextElementSibling); moved=true; } }
    if(!moved){
      row.style.transform='translateY('+(drag.y-drag.grab-nat.top)+'px) scale(1.02)';
      break;
    }
  }
}
function endDrag(e){
  if(!drag || (e && e.pointerId!==drag.pid)) return;
  cancelAnimationFrame(drag.raf);
  var row=drag.row; drag=null;
  var from=row.getBoundingClientRect().top;
  row.style.transform=''; row.classList.remove('dragging'); document.body.classList.remove('dragmode');
  var to=row.getBoundingClientRect().top;
  row.animate([{transform:'translateY('+(from-to)+'px) scale(1.02)'},{transform:'none'}],{duration:340,easing:'cubic-bezier(.2,1.1,.3,1.15)'});
  var ids=Array.prototype.map.call(list.children,function(c){return +c.dataset.id;});
  var key = ui.tab==='dry'?'dry':'wet';
  state[key]=ids;
  Array.prototype.forEach.call(list.children,function(c,i){ c.querySelector('.idx').textContent=i+1; });
  vib(8); touch();
}

/* ================= TABS ================= */
$('seg').addEventListener('click',function(e){
  var b=e.target.closest('button'); if(!b||b.dataset.tab===ui.tab) return;
  if(ui.edit && b.dataset.tab==='all') return;
  ui.tab=b.dataset.tab; vib(6); window.scrollTo({top:0});
  render(true);
});

/* ================= MAIN BUTTON ================= */
$('btnMain').addEventListener('click',function(){
  if(ui.edit){ toggleEdit(false); return; }
  var els=Array.prototype.slice.call(list.children);
  window.scrollTo(0,0);
  var newMode = ui.mode==='wh' ? 'book' : 'wh';
  flip(els,function(){
    ui.mode=newMode;
    if(newMode==='wh' && ui.tab==='all') ui.tab='dry';
    var ids=visibleIds(), dm=dryMap();
    list.className='tab-'+ui.tab+(ui.mode==='book'?' book':'');
    ids.forEach(function(id,i){ var el=rows[id]; list.appendChild(el); decorate(el,id,i,dm); });
  },true);
  chrome(); vib([10,30,10]);
  toast(newMode==='book' ? 'Tersusun sesuai urutan buku' : 'Kembali ke urutan gudang');
});

/* ================= EDIT ================= */
function toggleEdit(on){
  ui.edit = on;
  document.body.classList.toggle('editing', on);
  if(on){
    if(ui.tab==='all') ui.tab='dry';
    ui.mode='wh';
    toast('Geser ☰ untuk mengubah urutan · ketuk nama untuk ganti');
  } else {
    if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  window.scrollTo({top:0});
  render(true);
}
$('btnEdit').addEventListener('click',function(){ toggleEdit(!ui.edit); });

/* ================= RESET ANGKA ================= */
function sheet(show){ $('scrim').classList.toggle('show',show); }
$('btnReset').addEventListener('click',function(){ sheet(true); });
$('rsCancel').addEventListener('click',function(){ sheet(false); });
$('scrim').addEventListener('click',function(e){ if(e.target===this) sheet(false); });
$('rsOk').addEventListener('click',function(){
  state.qty={}; touch(); sheet(false);
  render(false); vib(20); toast('Semua angka dikosongkan');
});

/* ================= MODAL KONEKSI GOOGLE SHEET ================= */
function openCfg(show){
  if(show) $('inpGasUrl').value = getGasUrl();
  $('scrimCfg').classList.toggle('show', show);
}
$('btnCloud').addEventListener('click',function(){ openCfg(true); });
$('ttlSync').addEventListener('click',function(){ openCfg(true); });
$('cfgCancel').addEventListener('click',function(){ openCfg(false); });
$('scrimCfg').addEventListener('click',function(e){ if(e.target===this) openCfg(false); });
$('cfgSave').addEventListener('click',function(){
  var val = $('inpGasUrl').value.trim();
  try {
    if(val) localStorage.setItem(LS_GAS_URL, val);
    else localStorage.removeItem(LS_GAS_URL);
  } catch(e){}
  openCfg(false);
  toast(val ? 'Menghubungkan ke Google Sheet…' : 'Mode penyimpanan lokal aktif');
  pullServer();
});

/* ================= INIT ================= */
$('dateTxt').textContent = new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'short'});
BOOK.forEach(function(b){ rows[b.id]=makeRow(b); });
render(true);
pullServer();
})();
</script>
</body>
</html>`;
}
