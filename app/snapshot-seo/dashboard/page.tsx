'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import SeoResultBox from '@/components/seoResultBox';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// ─── Types ────────────────────────────────────────────────────────────────────
interface Snapshot {
  file: string;
  updated?: string;
  date?: string;
  title?: string;
  url?: string;
  [key: string]: unknown;
}

// ─── Inner component (uses useSearchParams — must be inside Suspense) ─────────
function DashboardInner() {
  const searchParams = useSearchParams();
  const url   = searchParams.get('url')   || '';
  const scope = searchParams.get('scope') || 'link';
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<'compare' | 'snapshots' | 'analysis'>('snapshots');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);

  // Compare: two snapshot pickers
  const [snapA, setSnapA] = useState<Snapshot | null>(null); // older
  const [snapB, setSnapB] = useState<Snapshot | null>(null); // newer
  const [snapAData, setSnapAData] = useState<unknown>(null);
  const [snapBData, setSnapBData] = useState<unknown>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [currentResult, setCurrentResult] = useState<unknown>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // ── Load snapshot list on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!url) return;
    loadSnapshots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  async function loadSnapshots() {
    setSnapshotsLoading(true);
    try {
      const res = await axios.get(`/api/snapshot-seo?url=${encodeURIComponent(url)}&list=1`);
      const files: string[] = res.data.files || [];
      const metas = await Promise.all(
        files.map(async (file) => {
          try {
            const r = await axios.get(`/api/snapshot-seo?file=${encodeURIComponent(file)}`);
            return { file, ...(r.data.previous || {}) } as Snapshot;
          } catch {
            return { file } as Snapshot;
          }
        })
      );
      setSnapshots(metas);
      // Auto-select defaults: newest = B, second newest = A
      if (metas.length >= 2) {
        setSnapB(metas[0]);
        setSnapA(metas[1]);
      } else if (metas.length === 1) {
        setSnapB(metas[0]);
      }
    } catch {
      setSnapshots([]);
    } finally {
      setSnapshotsLoading(false);
    }
  }

  // ── Fetch full data for each selected snapshot ────────────────────────────
  const fetchSnapData = React.useCallback(async (snap: Snapshot, side: 'A' | 'B') => {
    const setLoading = side === 'A' ? setLoadingA : setLoadingB;
    const setData    = side === 'A' ? setSnapAData : setSnapBData;
    setLoading(true);
    try {
      const r = await axios.get(`/api/snapshot-seo?file=${encodeURIComponent(snap.file)}`);
      setData(r.data.previous || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch when selection changes
  useEffect(() => { if (snapA) fetchSnapData(snapA, 'A'); }, [snapA, fetchSnapData]);
  useEffect(() => { if (snapB) fetchSnapData(snapB, 'B'); }, [snapB, fetchSnapData]);

  // ── Sync Now ───────────────────────────────────────────────────────────────
  async function handleSync() {
    if (!url) return;
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await axios.post('/api/snapshot-seo', { url });
      setSyncMsg(res.data.saved ? '✅ Snapshot saved!' : '⚪ No changes detected.');
      await loadSnapshots();
    } catch {
      setSyncMsg('❌ Sync failed.');
    } finally {
      setSyncing(false);
    }
  }

  // ── Download Excel Diff ───────────────────────────────────────────────────
  async function handleDownloadExcel() {
    if (!snapA || !snapB) return;
    setDownloading(true);
    try {
      const params = new URLSearchParams({ fileA: snapA.file, fileB: snapB.file });
      const res = await fetch(`/api/export-diff?${params}`);
      if (!res.ok) throw new Error('Failed to generate Excel');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      // Get filename from Content-Disposition header
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="(.+)"/);
      a.download = match ? match[1] : 'SEO_Diff.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      alert('Failed to download Excel report.');
    } finally {
      setDownloading(false);
    }
  }

  // ── Run SEO analysis ──────────────────────────────────────────────────────
  async function handleAnalysis() {
    if (!url) return;
    setAnalysisLoading(true);
    setCurrentResult(null);
    try {
      const res = await axios.post('/api/seo', { urls: [url] });
      setCurrentResult(res.data.results?.[0] || null);
    } catch {
      setCurrentResult({ error: 'Failed to fetch SEO data.' });
    } finally {
      setAnalysisLoading(false);
    }
  }

  const navItems = [
    { id: 'snapshots' as const, label: '🗃️ Snapshots',   desc: 'Browse saved snapshots' },
    { id: 'compare'  as const, label: '🔍 Compare',      desc: 'Diff two snapshots + Excel' },
    { id: 'analysis' as const, label: '🚀 SEO Analysis', desc: 'Run live analysis' },
  ];

  function formatDate(s?: string) {
    if (!s) return 'Unknown';
    return dayjs(s).format('DD MMM YYYY, HH:mm');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-white/90 shadow-md border-b border-indigo-100 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📸</span>
          <div>
            <div className="font-bold text-lg text-indigo-700">SnapshotSEO Pro</div>
            <div className="text-xs text-gray-500 truncate max-w-xs" title={url}>{url}</div>
          </div>
          <span className={`ml-3 text-xs font-semibold px-3 py-1 rounded-full ${scope === 'link' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {scope === 'link' ? '🔗 Single Link' : '🌐 Entire Website'}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          {syncMsg && <span className="text-sm font-semibold text-gray-600">{syncMsg}</span>}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg font-bold shadow hover:from-teal-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {syncing ? <span className="animate-spin inline-block">🔄</span> : '🔄'} Sync Now
          </button>
          <button
            onClick={() => router.push('/snapshot-seo')}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-red-500 text-white rounded-lg font-bold shadow hover:from-amber-500 hover:to-red-600 transition-all duration-200"
          >
            ✕ Close
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside className="w-56 bg-white/80 border-r border-indigo-100 shadow-lg flex flex-col p-4 gap-2 shrink-0">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Navigation</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`text-left px-3 py-3 rounded-xl font-semibold transition-all duration-150 flex flex-col gap-0.5 ${
                activeSection === item.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                  : 'text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              <span className="text-sm">{item.label}</span>
              <span className={`text-xs font-normal ${activeSection === item.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                {item.desc}
              </span>
            </button>
          ))}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-400 text-center">
              {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} saved
            </div>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        <main className="flex-1 p-6 overflow-y-auto">

          {/* ── SNAPSHOTS section ─────────────────────────────────────────── */}
          {activeSection === 'snapshots' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">🗃️ Saved Snapshots</h2>
                <button onClick={loadSnapshots} className="text-xs text-indigo-600 hover:underline">Refresh</button>
              </div>

              {snapshotsLoading ? (
                <div className="flex items-center gap-3 text-gray-500 py-8">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500" />
                  Loading snapshots...
                </div>
              ) : snapshots.length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400 border border-dashed border-gray-200">
                  <div className="text-4xl mb-3">📭</div>
                  <div className="font-semibold">No snapshots yet</div>
                  <div className="text-sm mt-1">Click <strong>Sync Now</strong> to take the first snapshot.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.file}
                      onClick={() => { setSnapB(snap); setActiveSection('compare'); }}
                      className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 p-5 flex flex-col gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-1 group"
                    >
                      <span className="text-3xl group-hover:scale-110 transition-transform">🗃️</span>
                      <div className="font-semibold text-gray-800 text-sm truncate" title={snap.title}>
                        {snap.title || 'Snapshot'}
                      </div>
                      <div className="text-xs text-gray-500">{formatDate(snap.updated)}</div>
                      <div className="text-xs text-indigo-500 font-semibold">
                        {snap.updated ? dayjs(snap.updated).fromNow() : ''}
                      </div>
                      <button className="mt-auto text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-emerald-400 text-white font-bold shadow group-hover:from-amber-500 group-hover:to-emerald-500 transition-all">
                        Compare →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── COMPARE section ────────────────────────────────────────────── */}
          {activeSection === 'compare' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">🔍 Compare Snapshots</h2>

                {/* Download Excel button */}
                <button
                  onClick={handleDownloadExcel}
                  disabled={!snapA || !snapB || downloading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <><span className="animate-spin">⚙️</span> Generating...</>
                  ) : (
                    <><span>📥</span> Download Excel Diff</>
                  )}
                </button>
              </div>

              {/* Colour legend */}
              <div className="flex flex-wrap gap-3 text-xs font-semibold">
                <span className="px-3 py-1 rounded-lg bg-yellow-100 text-amber-800 border border-yellow-300">🟡 Changed</span>
                <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">🟢 Added</span>
                <span className="px-3 py-1 rounded-lg bg-red-100 text-red-800 border border-red-300">🔴 Removed</span>
                <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200">⚪ Unchanged</span>
              </div>

              {/* Snapshot A & B selectors */}
              {snapA && snapB && snapA.file === snapB.file && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg shadow-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      ⚠️
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-amber-700">
                        <strong>Warning:</strong> You have selected the exact same snapshot in both slots. To see a comparison, select two different snapshots.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                {/* Selector A — older */}
                <div className="bg-white rounded-2xl shadow border border-red-100 overflow-hidden w-full md:flex-1">
                  <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                    <span className="text-base">📌</span>
                    <span className="font-bold text-red-700 text-sm">Old Snapshot (A) - Baseline</span>
                  </div>
                  <div className="p-4">
                    <select
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                      value={snapA?.file || ''}
                      onChange={e => {
                        const found = snapshots.find(s => s.file === e.target.value);
                        setSnapA(found || null);
                      }}
                    >
                      <option value="">— Select old snapshot —</option>
                      {snapshots.map(s => (
                        <option key={s.file} value={s.file}>
                          {formatDate(s.updated)} {s.title ? `— ${s.title.slice(0, 30)}` : ''} {snapB?.file === s.file ? '(Currently selected as New)' : ''}
                        </option>
                      ))}
                    </select>
                    {snapA && (
                      <div className="mt-2 text-xs text-gray-500">
                        {dayjs(snapA.updated).fromNow()} · {snapA.file}
                      </div>
                    )}
                  </div>
                </div>

                {/* Swap button */}
                <div className="hidden md:flex flex-col items-center justify-center -mx-4 z-10">
                  <button
                    onClick={() => {
                      const temp = snapA;
                      setSnapA(snapB);
                      setSnapB(temp);
                    }}
                    title="Swap Snapshots"
                    className="bg-white hover:bg-indigo-50 border border-gray-200 text-indigo-600 rounded-full p-2 shadow-md transition-all hover:scale-110 active:scale-95 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="16" y1="3" x2="16" y2="21"></line>
                      <polyline points="21 8 16 3 11 8"></polyline>
                      <line x1="8" y1="21" x2="8" y2="3"></line>
                      <polyline points="3 16 8 21 13 16"></polyline>
                    </svg>
                  </button>
                </div>

                <div className="md:hidden flex justify-center w-full">
                  <button
                    onClick={() => {
                      const temp = snapA;
                      setSnapA(snapB);
                      setSnapB(temp);
                    }}
                    title="Swap Snapshots"
                    className="bg-white hover:bg-indigo-50 border border-gray-200 text-indigo-600 rounded-full px-4 py-2 shadow-sm transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full"
                  >
                    <span>Swap A and B</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(90deg)' }}>
                      <line x1="16" y1="3" x2="16" y2="21"></line>
                      <polyline points="21 8 16 3 11 8"></polyline>
                      <line x1="8" y1="21" x2="8" y2="3"></line>
                      <polyline points="3 16 8 21 13 16"></polyline>
                    </svg>
                  </button>
                </div>

                {/* Selector B — newer */}
                <div className="bg-white rounded-2xl shadow border border-green-100 overflow-hidden w-full md:flex-1">
                  <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
                    <span className="text-base">✅</span>
                    <span className="font-bold text-green-700 text-sm">New Snapshot (B) - Current</span>
                  </div>
                  <div className="p-4">
                    <select
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                      value={snapB?.file || ''}
                      onChange={e => {
                        const found = snapshots.find(s => s.file === e.target.value);
                        setSnapB(found || null);
                      }}
                    >
                      <option value="">— Select new snapshot —</option>
                      {snapshots.map(s => (
                        <option key={s.file} value={s.file}>
                          {formatDate(s.updated)} {s.title ? `— ${s.title.slice(0, 30)}` : ''} {snapA?.file === s.file ? '(Currently selected as Old)' : ''}
                        </option>
                      ))}
                    </select>
                    {snapB && (
                      <div className="mt-2 text-xs text-gray-500">
                        {dayjs(snapB.updated).fromNow()} · {snapB.file}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Side-by-side preview */}
              {(snapA || snapB) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Snap A */}
                  <div className="bg-white rounded-2xl shadow border border-red-100 overflow-hidden">
                    <div className="px-4 py-2 bg-red-50 border-b border-red-100 font-bold text-red-700 text-sm flex items-center gap-2">
                      📌 Old — {formatDate(snapA?.updated)}
                    </div>
                    <div className="p-4">
                      {loadingA ? (
                        <div className="flex items-center gap-2 text-gray-400 py-6">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
                          Loading...
                        </div>
                      ) : snapAData ? (
                        <SeoResultBox data={snapAData} />
                      ) : (
                        <div className="text-gray-400 text-sm py-6 text-center">Select a snapshot above</div>
                      )}
                    </div>
                  </div>

                  {/* Snap B */}
                  <div className="bg-white rounded-2xl shadow border border-green-100 overflow-hidden">
                    <div className="px-4 py-2 bg-green-50 border-b border-green-100 font-bold text-green-700 text-sm flex items-center gap-2">
                      ✅ New — {formatDate(snapB?.updated)}
                    </div>
                    <div className="p-4">
                      {loadingB ? (
                        <div className="flex items-center gap-2 text-gray-400 py-6">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400" />
                          Loading...
                        </div>
                      ) : snapBData ? (
                        <SeoResultBox data={snapBData} />
                      ) : (
                        <div className="text-gray-400 text-sm py-6 text-center">Select a snapshot above</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ANALYSIS section ───────────────────────────────────────────── */}
          {activeSection === 'analysis' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">🚀 Live SEO Analysis</h2>
                <button
                  onClick={handleAnalysis}
                  disabled={analysisLoading}
                  className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg shadow hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {analysisLoading ? (
                    <><span className="animate-spin inline-block">⚙️</span> Analysing...</>
                  ) : '▶ Run Analysis'}
                </button>
              </div>

              {!currentResult && !analysisLoading && (
                <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400 border border-dashed border-gray-200">
                  <div className="text-4xl mb-3">🔎</div>
                  <div className="font-semibold">Click <strong>Run Analysis</strong> to fetch live SEO data for this URL.</div>
                </div>
              )}
              {analysisLoading && (
                <div className="flex items-center gap-3 text-gray-500 py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500" />
                  Analysing {url}...
                </div>
              )}
              {!!currentResult && !analysisLoading && <SeoResultBox data={currentResult} />}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// ─── Page export (Suspense for useSearchParams) ────────────────────────────────
export default function SnapshotDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
          <div className="font-semibold">Loading dashboard...</div>
        </div>
      </div>
    }>
      <DashboardInner />
    </Suspense>
  );
}
