/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Copy,
  Check,
  Download,
  FileCode,
  Database,
  Smartphone,
  BookOpen,
  RotateCcw,
  Edit3,
  ArrowLeftRight,
  Trash2,
  ArrowUp,
  ArrowDown,
  Cloud,
  RefreshCw,
  Save,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  BOOK,
  GudangState,
  DEFAULT_USER_GAS_URL,
  getDefaultState,
  sanitizeState,
  serializeStateForGas,
  generateCodeGs,
  generateGithubIndexHtml,
} from './data/stokTemplates';

const LS_STATE_KEY = 'stok_gudang_v1';
const LS_GAS_URL_KEY = 'stok_gudang_gas_url_v1';
const LS_SHEET_ID_KEY = 'stok_gudang_sheet_id_v1';

type ActiveSection = 'app' | 'codes' | 'sheet-preview' | 'guide';
type WarehouseTab = 'dry' | 'wet' | 'all';
type SortMode = 'wh' | 'book';
type SyncState = 'local' | 'saving' | 'saved' | 'error';

export default function App() {
  // Navigation section - default to 'app' so web preview is displayed immediately
  const [activeSection, setActiveSection] = useState<ActiveSection>('app');
  const [previewMode, setPreviewMode] = useState<'exact-html' | 'interactive'>('exact-html');

  // GAS & Sheet configuration — pre-filled with the user's deployed Apps Script URL
  const [gasUrl, setGasUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(LS_GAS_URL_KEY) || DEFAULT_USER_GAS_URL;
    } catch {
      return DEFAULT_USER_GAS_URL;
    }
  });
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    try {
      return localStorage.getItem(LS_SHEET_ID_KEY) || '';
    } catch {
      return '';
    }
  });

  // Gudang state
  const [state, setState] = useState<GudangState>(() => {
    try {
      const raw = localStorage.getItem(LS_STATE_KEY);
      return raw ? sanitizeState(JSON.parse(raw)) : getDefaultState();
    } catch {
      return getDefaultState();
    }
  });

  // App UI states
  const [tab, setTab] = useState<WarehouseTab>('dry');
  const [sortMode, setSortMode] = useState<SortMode>('wh');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<SyncState>('local');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [codeTab, setCodeTab] = useState<'index' | 'codegs'>('index');

  const saveTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  };

  // Persist config
  useEffect(() => {
    try {
      if (gasUrl.trim()) localStorage.setItem(LS_GAS_URL_KEY, gasUrl.trim());
      else localStorage.removeItem(LS_GAS_URL_KEY);
    } catch {
      // ignore storage errors
    }
  }, [gasUrl]);

  useEffect(() => {
    try {
      if (spreadsheetId.trim()) localStorage.setItem(LS_SHEET_ID_KEY, spreadsheetId.trim());
      else localStorage.removeItem(LS_SHEET_ID_KEY);
    } catch {
      // ignore storage errors
    }
  }, [spreadsheetId]);

  // Pull from Google Sheet when URL is configured
  const pullFromGoogleSheet = async (targetUrl = gasUrl) => {
    const clean = targetUrl.trim();
    if (!clean) {
      setSyncStatus('local');
      return;
    }
    setSyncStatus('saving');
    try {
      const sep = clean.includes('?') ? '&' : '?';
      const response = await fetch(`${clean}${sep}action=getState&_t=${Date.now()}`, {
        method: 'GET',
        redirect: 'follow',
      });
      const data = await response.json();
      if (data && data.ok && data.state) {
        const remote = sanitizeState(data.state);
        if (remote.ts === 0) {
          // Remote still has placeholder catalog, push Wizzmie catalog immediately
          const upgraded = { ...state, ts: Date.now() };
          await pushToGoogleSheet(upgraded, clean);
        } else if (remote.ts >= state.ts) {
          setState(remote);
          localStorage.setItem(LS_STATE_KEY, JSON.stringify(remote));
          setSyncStatus('saved');
        } else {
          await pushToGoogleSheet(state, clean);
        }
        showToast('Berhasil sinkron dengan Google Sheet');
      } else {
        setSyncStatus('error');
        showToast('Respons Google Sheet tidak valid');
      }
    } catch {
      setSyncStatus('error');
      showToast('Gagal terhubung ke URL Google Apps Script');
    }
  };

  // Push to Google Sheet
  const pushToGoogleSheet = async (nextState: GudangState, targetUrl = gasUrl) => {
    const clean = targetUrl.trim();
    if (!clean) {
      setSyncStatus('local');
      return;
    }
    setSyncStatus('saving');
    try {
      const response = await fetch(clean, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveState', state: serializeStateForGas(nextState) }),
      });
      const res = await response.json();
      if (res && res.ok) {
        setSyncStatus('saved');
      } else {
        setSyncStatus('error');
      }
    } catch {
      setSyncStatus('error');
    }
  };

  const updateAndSyncState = (updater: (prev: GudangState) => GudangState) => {
    setState((prev) => {
      const updated = updater(prev);
      const next: GudangState = { ...updated, ts: Date.now() };
      try {
        localStorage.setItem(LS_STATE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      if (gasUrl.trim()) {
        setSyncStatus('saving');
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = window.setTimeout(() => {
          pushToGoogleSheet(next, gasUrl);
        }, 650);
      } else {
        setSyncStatus('local');
      }
      return next;
    });
  };

  const drySet = useMemo(() => {
    const map: Record<number, boolean> = {};
    state.dry.forEach((id) => {
      map[id] = true;
    });
    return map;
  }, [state.dry]);

  const visibleIds = useMemo(() => {
    const base =
      tab === 'dry'
        ? [...state.dry]
        : tab === 'wet'
          ? [...state.wet]
          : [...state.dry, ...state.wet];
    if (sortMode === 'book') {
      base.sort((a, b) => a - b);
    }
    if (!searchQuery.trim()) return base;
    const q = searchQuery.trim().toLowerCase();
    return base.filter((id) => {
      const dispName = (state.names[id] || BOOK[id].name).toLowerCase();
      const origName = BOOK[id].name.toLowerCase();
      return dispName.includes(q) || origName.includes(q) || String(id + 1) === q;
    });
  }, [tab, sortMode, state.dry, state.wet, state.names, searchQuery]);

  const filledCount = useMemo(() => {
    return visibleIds.filter((id) => (state.qty[id] || '').trim() !== '').length;
  }, [visibleIds, state.qty]);

  const generatedIndexHtml = useMemo(() => generateGithubIndexHtml(gasUrl), [gasUrl]);
  const generatedCodeGs = useMemo(() => generateCodeGs(spreadsheetId), [spreadsheetId]);

  const handleCopyText = async (text: string, key: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast(`${label} berhasil disalin ke clipboard`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      setCopiedKey(key);
      showToast(`${label} berhasil disalin`);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`File ${filename} berhasil diunduh`);
  };

  const handleQtyChange = (id: number, rawVal: string) => {
    const cleanVal = rawVal.replace(/[^0-9.,]/g, '');
    updateAndSyncState((prev) => {
      const nextQty = { ...prev.qty };
      if (cleanVal === '') delete nextQty[id];
      else nextQty[id] = cleanVal;
      return { ...prev, qty: nextQty };
    });
  };

  const handleNameChange = (id: number, newName: string) => {
    const trimmed = newName.toUpperCase();
    updateAndSyncState((prev) => {
      const nextNames = { ...prev.names };
      if (!trimmed.trim() || trimmed.trim() === BOOK[id].name) {
        delete nextNames[id];
      } else {
        nextNames[id] = trimmed;
      }
      return { ...prev, names: nextNames };
    });
  };

  const handleMoveWarehouse = (id: number) => {
    const isCurrentlyDry = drySet[id];
    const fromKey = isCurrentlyDry ? 'dry' : 'wet';
    const toKey = isCurrentlyDry ? 'wet' : 'dry';
    updateAndSyncState((prev) => ({
      ...prev,
      [fromKey]: prev[fromKey].filter((x) => x !== id),
      [toKey]: [...prev[toKey], id],
    }));
    showToast(`Dipindahkan ke Gudang ${toKey === 'dry' ? 'Kering' : 'Basah'}`);
  };

  const handleMoveOrder = (id: number, direction: 'up' | 'down') => {
    if (tab === 'all' || sortMode === 'book') return;
    const key = tab === 'dry' ? 'dry' : 'wet';
    updateAndSyncState((prev) => {
      const arr = [...prev[key]];
      const idx = arr.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= arr.length) return prev;
      const temp = arr[idx];
      arr[idx] = arr[targetIdx];
      arr[targetIdx] = temp;
      return { ...prev, [key]: arr };
    });
  };

  const handleCopyNumbersForBook = () => {
    const text = visibleIds.map((id) => state.qty[id] || '').join('\n');
    handleCopyText(
      text,
      'copy-numbers',
      `Tersalin ${visibleIds.length} baris angka (${sortMode === 'book' ? 'Urutan Buku' : 'Urutan Gudang'})`
    );
  };

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('codes');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Stok Gudang Suite
          </a>

          {/* Zone 2: 4 concise single-line navigation links */}
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSection('codes')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeSection === 'codes'
                  ? 'border-indigo-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Kode GitHub & Script
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('app')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeSection === 'app'
                  ? 'border-indigo-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Aplikasi Stok Gudang
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('sheet-preview')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeSection === 'sheet-preview'
                  ? 'border-indigo-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Tabel Google Sheet
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('guide')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeSection === 'guide'
                  ? 'border-indigo-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Panduan Deploy
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleDownloadFile('index.html', generatedIndexHtml)}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh index.html</span>
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Configuration Banner */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Generator Hosting GitHub Pages & Database Google Sheets
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1 tabular-nums">
                <span>120 Item Katalog Buku</span>
                <span aria-hidden="true">·</span>
                <span>{state.dry.length} Gudang Kering</span>
                <span aria-hidden="true">·</span>
                <span>{state.wet.length} Gudang Basah</span>
                <span aria-hidden="true">·</span>
                <span>
                  Status Sinkronisasi:{' '}
                  <strong className="text-slate-800">
                    {syncStatus === 'saved'
                      ? 'Terhubung ke Google Sheet'
                      : syncStatus === 'saving'
                        ? 'Menyimpan ke Sheet...'
                        : syncStatus === 'error'
                          ? 'Gagal Terhubung (Cek URL / Izin Anyone)'
                          : 'Penyimpanan Lokal Browser'}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleDownloadFile('index.html', generatedIndexHtml)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh index.html (GitHub)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadFile('Code.gs', generatedCodeGs)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Code.gs (Apps Script)</span>
              </button>
            </div>
          </div>

          {/* URL & Spreadsheet ID inputs that auto-inject into generated files */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-5">
            <div className="md:col-span-7">
              <label
                htmlFor="gas-url-input"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                URL Web App Google Apps Script (Otomatis disisipkan ke dalam file{' '}
                <code className="text-indigo-600">index.html</code>)
              </label>
              <div className="flex gap-2">
                <input
                  id="gas-url-input"
                  type="url"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="flex-1 h-10 px-3.5 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 font-mono focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => pullFromGoogleSheet(gasUrl)}
                  className="px-3.5 h-10 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tes & Muat Sheet</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Jika belum punya URL sekarang, Anda tetap bisa mengunduh{' '}
                <code>index.html</code> dan memasukkan URL nanti melalui tombol pengaturan di
                pojok kanan atas aplikasi.
              </p>
            </div>

            <div className="md:col-span-5">
              <label
                htmlFor="sheet-id-input"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Spreadsheet ID (Opsional — Kosongkan jika script dibuat dari dalam Google Sheet)
              </label>
              <input
                id="sheet-id-input"
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="Kosongkan jika buka dari Extensions > Apps Script"
                className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 font-mono focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Otomatis membuat sheet <code>Database_Stok</code>, <code>Rekap_Harian</code>, dan{' '}
                <code>Meta_State</code>.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 1: KODE GITHUB & APPS SCRIPT */}
        {activeSection === 'codes' && (
          <div className="space-y-6">
            {/* Sub-navigation for files */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCodeTab('index')}
                  className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                    codeTab === 'index'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <span>1. index.html (Upload ke GitHub Pages)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab('codegs')}
                  className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                    codeTab === 'codegs'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>2. Code.gs (Google Apps Script + Sheet DB)</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                {codeTab === 'index' ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(generatedIndexHtml, 'index-html', 'Kode index.html')
                      }
                      className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                    >
                      {copiedKey === 'index-html' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {copiedKey === 'index-html' ? 'Tersalin!' : 'Salin Kode index.html'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile('index.html', generatedIndexHtml)}
                      className="px-3.5 py-2 text-xs font-semibold bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh index.html</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopyText(generatedCodeGs, 'code-gs', 'Kode Code.gs')}
                      className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                    >
                      {copiedKey === 'code-gs' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'code-gs' ? 'Tersalin!' : 'Salin Kode Code.gs'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile('Code.gs', generatedCodeGs)}
                      className="px-3.5 py-2 text-xs font-semibold bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Code.gs</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Key Architectural Upgrades Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  01. Siap Hosting di GitHub Pages
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menggantikan <code>google.script.run</code> (yang hanya jalan di dalam iframe
                  Google) dengan <code>fetch()</code> lintas-domain bebas CORS (
                  <code>text/plain;charset=utf-8</code>) plus cache <code>localStorage</code>{' '}
                  instan.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  02. Google Sheet sebagai Database Asli
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bukan lagi <code>PropertiesService</code> yang tersembunyi. Semua 120 item
                  tersimpan rapi di tabel <code>Database_Stok</code> lengkap dengan kolom Nomor
                  Buku, Nama, Satuan, Gudang (DRY/BASAH), Urutan, dan Stok.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  03. Sinkronisasi 2 Arah & Rekap Harian
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ubah stok dari HP di GitHub Pages langsung mengupdate sel Google Sheet. Ubah
                  angka di Google Sheet juga otomatis termuat saat aplikasi dibuka. Dilengkapi
                  fitur arsip kolom ke tab <code>Rekap_Harian</code>.
                </p>
              </div>
            </div>

            {/* Code Viewer */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-200 font-semibold">
                    {codeTab === 'index' ? 'index.html' : 'Code.gs'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {codeTab === 'index'
                      ? 'File tunggal HTML + CSS + JS untuk repositori GitHub Pages Anda'
                      : 'Script Backend Google Apps Script yang terhubung ke Google Sheets'}
                  </span>
                </div>
                <span className="font-mono tabular-nums">
                  {(codeTab === 'index' ? generatedIndexHtml : generatedCodeGs).split('\n').length}{' '}
                  baris
                </span>
              </div>
              <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto max-h-[560px] leading-relaxed">
                <code>{codeTab === 'index' ? generatedIndexHtml : generatedCodeGs}</code>
              </pre>
            </div>
          </div>
        )}

        {/* SECTION 2: LIVE INTERACTIVE STOK GUDANG APP */}
        {activeSection === 'app' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left column: Exact index.html Web Preview OR Interactive React Simulator */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                <span className="text-xs font-bold text-slate-800">
                  Mode Pratinjau Web (Stok Gudang)
                </span>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('exact-html')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      previewMode === 'exact-html'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tampilan Asli index.html
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('interactive')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      previewMode === 'interactive'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mode Tabel Sinkron
                  </button>
                </div>
              </div>

              {previewMode === 'exact-html' ? (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <iframe
                    title="Preview Web Stok Gudang index.html"
                    srcDoc={generatedIndexHtml}
                    className="w-full h-[720px] border-0"
                  />
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  {/* App Header */}
                  <div className="p-5 border-b border-slate-200 bg-slate-50/70">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                          Stok Gudang
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{todayFormatted}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-slate-700">
                            {syncStatus === 'saved'
                              ? 'Tersimpan di Sheet'
                              : syncStatus === 'saving'
                                ? 'Menyimpan ke Sheet…'
                                : syncStatus === 'error'
                                  ? 'Gagal sinkron Sheet'
                                  : 'Tersimpan di perangkat'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowResetModal(true)}
                          title="Kosongkan semua angka"
                          className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextEdit = !isEditing;
                            setIsEditing(nextEdit);
                            if (nextEdit) {
                              if (tab === 'all') setTab('dry');
                              setSortMode('wh');
                              showToast('Mode Edit aktif: Ubah nama, urutan, atau pindah gudang');
                            }
                          }}
                          title="Edit urutan dan nama"
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                            isEditing
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Segmented Warehouse Tabs (2 tabs in wh mode, 3 tabs in book mode) */}
                    <div
                      className={`grid ${
                        sortMode === 'book' && !isEditing ? 'grid-cols-3' : 'grid-cols-2'
                      } gap-1.5 p-1 bg-slate-200/75 rounded-xl mt-4`}
                    >
                      <button
                        type="button"
                        onClick={() => setTab('dry')}
                        className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 tabular-nums ${
                          tab === 'dry'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>Kering ({state.dry.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('wet')}
                        className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 tabular-nums ${
                          tab === 'wet'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>Basah ({state.wet.length})</span>
                      </button>
                      {sortMode === 'book' && !isEditing && (
                        <button
                          type="button"
                          onClick={() => setTab('all')}
                          className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 tabular-nums ${
                            tab === 'all'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>Semua ({BOOK.length})</span>
                        </button>
                      )}
                    </div>

                    {/* Progress & Search */}
                    <div className="mt-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 tabular-nums">
                        <span>
                          {filledCount} / {visibleIds.length} terisi
                        </span>
                        <span>
                          {isEditing
                            ? 'Mode Edit Urutan & Nama'
                            : sortMode === 'book'
                              ? 'Mode: Urutan Buku (1-120)'
                              : 'Mode: Urutan Fisik Gudang'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            visibleIds.length > 0 && filledCount === visibleIds.length
                              ? 'bg-emerald-500'
                              : 'bg-indigo-600'
                          }`}
                          style={{
                            width: `${
                              visibleIds.length ? (filledCount / visibleIds.length) * 100 : 0
                            }%`,
                          }}
                        />
                      </div>

                      {/* Quick filter */}
                      <div className="relative pt-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Cari nama barang atau nomor buku..."
                          className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Item List */}
                  <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto px-4 py-2">
                    {visibleIds.map((id, index) => {
                      const item = BOOK[id];
                      const dispName = state.names[id] || item.name;
                      const val = state.qty[id] || '';
                      const isFilled = val.trim() !== '';
                      const isItemDry = !!drySet[id];
                      const displayNumber = sortMode === 'book' ? id + 1 : index + 1;

                      return (
                        <div
                          key={id}
                          className="py-2.5 flex items-center gap-3 hover:bg-slate-50/80 transition-colors rounded-lg px-2"
                        >
                          {/* Reorder buttons in edit mode */}
                          {isEditing && (
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveOrder(id, 'up')}
                                disabled={index === 0}
                                className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30"
                                title="Geser naik"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveOrder(id, 'down')}
                                disabled={index === visibleIds.length - 1}
                                className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30"
                                title="Geser turun"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Index number */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 tabular-nums transition-colors ${
                              isFilled
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {displayNumber}
                          </div>

                          {/* Item Info or Name Input */}
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <input
                                type="text"
                                value={dispName}
                                onChange={(e) => handleNameChange(id, e.target.value)}
                                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-900 uppercase focus:border-indigo-600 focus:outline-none"
                              />
                            ) : (
                              <div className="text-sm font-bold text-slate-900 truncate uppercase">
                                {dispName}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 tabular-nums">
                              <span className="font-semibold text-cyan-700">{item.unit}</span>
                              <span aria-hidden="true">·</span>
                              <span>Buku #{id + 1}</span>
                              {tab === 'all' && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span
                                    className={
                                      isItemDry
                                        ? 'font-semibold text-indigo-600'
                                        : 'font-semibold text-emerald-600'
                                    }
                                  >
                                    {isItemDry ? 'KERING' : 'BASAH'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action / Input */}
                          {isEditing ? (
                            <button
                              type="button"
                              onClick={() => handleMoveWarehouse(id)}
                              title="Pindah Gudang Kering / Basah"
                              className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                              <span>Ke {isItemDry ? 'Basah' : 'Kering'}</span>
                            </button>
                          ) : (
                            <input
                              ref={(el) => {
                                inputRefs.current[id] = el;
                              }}
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={val}
                              onChange={(e) => handleQtyChange(id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const nextId = visibleIds[index + 1];
                                  if (nextId !== undefined && inputRefs.current[nextId]) {
                                    inputRefs.current[nextId]?.focus();
                                    inputRefs.current[nextId]?.select();
                                  } else {
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }
                              }}
                              className={`w-24 h-11 rounded-xl border text-center text-base font-extrabold tabular-nums focus:outline-none transition-colors ${
                                isFilled
                                  ? 'border-emerald-500/60 bg-emerald-50/30 text-slate-900 focus:border-indigo-600 focus:bg-white'
                                  : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-indigo-600 focus:bg-white'
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Dock Controls */}
                  <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={handleCopyNumbersForBook}
                        title="Salin angka berurutan untuk ditempel ke buku/sheet"
                        className="h-12 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-2 shrink-0 whitespace-nowrap transition-colors"
                      >
                        <Copy className="w-4 h-4 text-indigo-600" />
                        <span>Salin Angka</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (isEditing) {
                          setIsEditing(false);
                          showToast('Selesai mengedit urutan & nama');
                        } else {
                          const nextMode = sortMode === 'wh' ? 'book' : 'wh';
                          setSortMode(nextMode);
                          if (nextMode === 'wh' && tab === 'all') {
                            setTab('dry');
                          }
                          showToast(
                            nextMode === 'book'
                              ? 'Tersusun sesuai urutan buku (1-120)'
                              : 'Kembali ke urutan fisik gudang'
                          );
                        }
                      }}
                      className={`flex-1 h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                        isEditing
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : sortMode === 'book'
                            ? 'bg-slate-900 hover:bg-slate-800'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Selesai Edit</span>
                        </>
                      ) : sortMode === 'book' ? (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Kembali ke Urutan Gudang</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4" />
                          <span>Susun Sesuai Buku</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right column: Quick Code Access + Explanation */}
            <div className="lg:col-span-5 space-y-5">
              {/* Quick Copy/Download Card for Both Files */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Ambil 2 Kode Anda (Siap Pakai)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Salin atau unduh kedua file di bawah ini untuk langsung dipasang di{' '}
                  <strong>GitHub Pages</strong> dan <strong>Google Apps Script (Google Sheets)</strong>.
                </p>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        1. index.html (Untuk GitHub)
                      </span>
                      <span className="text-[11px] text-slate-500">Frontend Web App</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(generatedIndexHtml, 'quick-index', 'Kode index.html')
                        }
                        className="flex-1 h-9 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        {copiedKey === 'quick-index' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedKey === 'quick-index' ? 'Tersalin!' : 'Salin index.html'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadFile('index.html', generatedIndexHtml)}
                        className="h-9 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        2. Code.gs (Untuk Apps Script)
                      </span>
                      <span className="text-[11px] text-slate-500">Database Google Sheet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(generatedCodeGs, 'quick-codegs', 'Kode Code.gs')
                        }
                        className="flex-1 h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        {copiedKey === 'quick-codegs' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey === 'quick-codegs' ? 'Tersalin!' : 'Salin Code.gs'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadFile('Code.gs', generatedCodeGs)}
                        className="h-9 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSection('codes')}
                  className="w-full h-9 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Lihat Seluruh Isi Baris Kode &rarr;
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Cara Kerja Sinkronisasi GitHub + Google Sheet
                </h3>
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="font-bold text-slate-900 mb-0.5">
                      1. Input di Gudang (Urutan Fisik)
                    </div>
                    <p className="text-slate-600">
                      Saat staf keliling gudang Dry atau Basah, urutan barang mengikuti tata letak
                      rak fisik gudang. Setiap ketik angka, otomatis tersimpan ke{' '}
                      <code>Database_Stok</code> di Google Sheet.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="font-bold text-slate-900 mb-0.5">
                      2. Klik &ldquo;Susun Sesuai Buku&rdquo;
                    </div>
                    <p className="text-slate-600">
                      Setelah semua stok terisi, tekan tombol <strong>Susun Sesuai Buku</strong>.
                      Seluruh item otomatis diurutkan kembali ke nomor urut buku (1 s/d 120) untuk
                      disalin atau dicek di Google Sheet.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="font-bold text-slate-900 mb-0.5">
                      3. Klik &ldquo;Salin Angka&rdquo; atau Cek Google Sheet
                    </div>
                    <p className="text-slate-600">
                      Tekan tombol salin untuk menempelkan seluruh baris angka sekaligus ke kolom
                      buku laporan, atau tekan ikon <strong>Sheet</strong> di pojok kanan atas untuk
                      menyimpan rekap harian ke tab <code>Rekap_Harian</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: TABEL GOOGLE SHEET PREVIEW */}
        {activeSection === 'sheet-preview' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Pratinjau Struktur Tabel Google Sheets (Sheet: <code>Database_Stok</code>)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tabel ini menampung 120 item. Setiap ada perubahan di web GitHub Pages Anda, data lama di sheet ini otomatis ditimpa dengan data terbaru.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[540px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900 text-white sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-3.5 font-semibold border-r border-slate-800 whitespace-nowrap">
                        A · No Buku
                      </th>
                      <th className="py-3 px-3.5 font-semibold border-r border-slate-800 whitespace-nowrap">
                        B · ID Item
                      </th>
                      <th className="py-3 px-3.5 font-semibold border-r border-slate-800 whitespace-nowrap">
                        C · Nama Asli Buku
                      </th>
                      <th className="py-3 px-3.5 font-semibold border-r border-slate-800 whitespace-nowrap">
                        D · Nama Tampilan
                      </th>
                      <th className="py-3 px-3.5 font-semibold border-r border-slate-800 whitespace-nowrap">
                        E · Satuan
                      </th>
                      <th className="py-3 px-3.5 font-semibold border-r border-slate-800 whitespace-nowrap">
                        F · Gudang
                      </th>
                      <th className="py-3 px-3.5 font-semibold border-r border-slate-800 text-right whitespace-nowrap">
                        G · Urutan Gudang
                      </th>
                      <th className="py-3 px-3.5 font-semibold border-r border-slate-800 text-right whitespace-nowrap">
                        H · Stok Terkini
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                    {BOOK.map((b) => {
                      const isDry = drySet[b.id];
                      const orderIdx = isDry
                        ? state.dry.indexOf(b.id) + 1
                        : state.wet.indexOf(b.id) + 1;
                      const dispName = state.names[b.id] || b.name;
                      const qtyVal = state.qty[b.id] || '';
                      return (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3.5 border-r border-slate-100 text-slate-500">
                            {b.id + 1}
                          </td>
                          <td className="py-2 px-3.5 border-r border-slate-100 text-slate-400">
                            {b.id}
                          </td>
                          <td className="py-2 px-3.5 border-r border-slate-100 text-slate-600 font-sans">
                            {b.name}
                          </td>
                          <td className="py-2 px-3.5 border-r border-slate-100 font-sans font-semibold text-slate-900">
                            {dispName}
                          </td>
                          <td className="py-2 px-3.5 border-r border-slate-100 text-cyan-700 font-semibold">
                            {b.unit}
                          </td>
                          <td className="py-2 px-3.5 border-r border-slate-100">
                            <span
                              className={
                                isDry
                                  ? 'text-indigo-700 font-semibold'
                                  : 'text-emerald-700 font-semibold'
                              }
                            >
                              {isDry ? 'KERING' : 'BASAH'}
                            </span>
                          </td>
                          <td className="py-2 px-3.5 border-r border-slate-100 text-right text-slate-700">
                            {orderIdx}
                          </td>
                          <td className="py-2 px-3.5 border-r border-slate-100 text-right font-bold text-slate-900">
                            <input
                              type="text"
                              value={qtyVal}
                              placeholder="-"
                              onChange={(e) => handleQtyChange(b.id, e.target.value)}
                              className="w-20 text-right bg-transparent border-b border-transparent focus:border-indigo-600 focus:outline-none font-bold"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: STEP-BY-STEP DEPLOYMENT GUIDE */}
        {activeSection === 'guide' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Tahap 1: Pasang Database di Google Sheet & Apps Script
              </h2>
              <ol className="space-y-3 text-xs text-slate-700 leading-relaxed list-decimal list-inside">
                <li>
                  Buka <strong>Google Sheets</strong> dan buat spreadsheet baru (beri nama misalnya{' '}
                  <code>Database Stok Gudang</code>).
                </li>
                <li>
                  Di menu atas Google Sheets, klik <strong>Extensions (Ekstensi)</strong> &rarr;{' '}
                  <strong>Apps Script</strong>.
                </li>
                <li>
                  Hapus seluruh kode yang ada di file <code>Code.gs</code>, lalu tempel (paste)
                  seluruh kode <strong>Code.gs</strong> dari tab{' '}
                  <em>Kode GitHub &amp; Script</em> di halaman ini.
                </li>
                <li>
                  Tekan ikon <strong>Save (Simpan)</strong>, pilih fungsi{' '}
                  <code>setupDatabase</code> di dropdown atas, lalu klik <strong>Run</strong> (berikan izin akses/Review Permissions saat diminta). Sheet{' '}
                  <code>Database_Stok</code> dan <code>Meta_State</code> akan langsung terbentuk!
                </li>
                <li>
                  Klik tombol biru <strong>Deploy</strong> di kanan atas &rarr;{' '}
                  <strong>New deployment (Deployment baru)</strong>:
                  <ul className="mt-1.5 ml-5 space-y-1 list-disc text-slate-600">
                    <li>
                      <strong>Select type</strong>: pilih <code>Web app</code>
                    </li>
                    <li>
                      <strong>Execute as</strong>: pilih <code>Me (Saya)</code>
                    </li>
                    <li>
                      <strong>Who has access</strong>: pilih{' '}
                      <strong className="text-slate-900">Anyone (Siapa saja)</strong> &larr; Wajib
                      agar GitHub Pages dapat membaca & menyimpan data tanpa blokir CORS.
                    </li>
                  </ul>
                </li>
                <li>
                  Klik <strong>Deploy</strong>, lalu salin <strong>Web App URL</strong> (yang
                  berakhiran <code>/exec</code>).
                </li>
              </ol>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Tahap 2: Hosting File index.html di GitHub Pages
              </h2>
              <ol className="space-y-3 text-xs text-slate-700 leading-relaxed list-decimal list-inside">
                <li>
                  Tempel <strong>Web App URL</strong> (<code>https://script.google.com/.../exec</code>
                  ) ke kotak input di bagian atas halaman ini agar URL tersebut langsung tertanam di
                  dalam kode <code>index.html</code>.
                </li>
                <li>
                  Klik tombol <strong>Unduh index.html</strong> (atau salin kodenya).
                </li>
                <li>
                  Buka akun <strong>GitHub</strong> Anda, buat repository baru (Public), lalu
                  upload file <code>index.html</code> tersebut ke root repository.
                </li>
                <li>
                  Buka menu <strong>Settings</strong> di repository GitHub Anda &rarr; pilih menu{' '}
                  <strong>Pages</strong> di sidebar kiri.
                </li>
                <li>
                  Pada bagian <strong>Build and deployment (Branch)</strong>, pilih branch{' '}
                  <code>main</code> (folder <code>/root</code>), lalu klik <strong>Save</strong>.
                </li>
                <li>
                  Tunggu sekitar 1 menit, alamat website GitHub Pages Anda siap dibuka dari HP
                  maupun komputer dan seluruh datanya langsung tersimpan real-time di Google
                  Sheets!
                </li>
              </ol>
            </div>
          </div>
        )}
      </main>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 text-center">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Kosongkan semua angka stok?
            </h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Semua angka stok yang sudah diisi akan dihapus dari aplikasi dan Google Sheet. Urutan
              dan nama item tidak berubah.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  updateAndSyncState((prev) => ({ ...prev, qty: {} }));
                  setShowResetModal(false);
                  showToast('Semua angka stok dikosongkan');
                }}
                className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white"
              >
                Ya, Kosongkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 whitespace-nowrap">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
