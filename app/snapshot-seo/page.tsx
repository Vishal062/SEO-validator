"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import SeoResultBox from '@/components/seoResultBox';

function formatDateFromFilenameOrData(file: string, data?: Record<string, unknown>) {
  if (data && data.date) {
    const date = new Date(data.date as string);
    if (!isNaN(date.getTime())) return date.toLocaleString();
  }
  // fallback to filename parsing
  const match = file.match(/_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.json$/);
  if (!match) return file;
  const iso = match[1].replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, (m, p1, p2, p3) => `:${p1}:${p2}.${p3}Z`).replace(/-/g, ':').replace('T', 'T');
  const date = new Date(iso);
  if (isNaN(date.getTime())) return file;
  return date.toLocaleString();
}

export default function SnapshotSeoPage() {
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [url, setUrl] = useState("");
  // const [urlValid, setUrlValid] = useState(false); // Unused
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const [compareResult, setCompareResult] = useState<Record<string, unknown> | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<string[]>([]);
  // const [snapshotsLoading, setSnapshotsLoading] = useState(false); // Unused
  // const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null); // Unused
  const resultRef = useRef<HTMLDivElement>(null);
  // Add state to store snapshot dates
  const [snapshotDates, setSnapshotDates] = useState<Record<string, string>>({});
  const [datesLoading, setDatesLoading] = useState(false);

  // Fetch snapshot dates when modal opens and snapshots are loaded
  useEffect(() => {
    if (modalOpen && snapshots.length > 0) {
      setDatesLoading(true);
      Promise.all(
        snapshots.map(async (file) => {
          try {
            const res = await axios.get(`/api/snapshot-seo?file=${encodeURIComponent(file)}`);
            const date = res.data.previous && res.data.previous.date ? new Date(res.data.previous.date).toLocaleString() : formatDateFromFilenameOrData(file);
            return [file, date];
          } catch {
            return [file, formatDateFromFilenameOrData(file)];
          }
        })
      ).then(pairs => {
        setSnapshotDates(Object.fromEntries(pairs));
        setDatesLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, snapshots.length]);

  function isValidUrl(url: string) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setResult(null);
    setCompareResult(null);
    setSaved(false);
    setError("");
    const valid = isValidUrl(e.target.value.trim());
    // setUrlValid(valid);
    setShowOptions(valid);
    if (valid) {
      setShowScopeModal(true);
    }
  };

  const handleFetchSeo = async () => {
    setError("");
    setResult(null);
    setCompareResult(null);
    setSaved(false);
    setLoading(true);
    try {
      const res = await axios.post("/api/snapshot-seo", { url });
      setResult(res.data.result);
      setSaved(res.data.saved || false);
      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError(err) 
        ? err.response?.data?.error || err.message 
        : (err as Error).message || "Failed to fetch SEO data.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    setError("");
    setCompareResult(null);
    setResult(null);
    setSaved(false);
    setLoading(false);
    setModalOpen(true);
    // setSnapshotsLoading(true);
    try {
      // Fetch all snapshot filenames for this URL
      const res = await axios.get(`/api/snapshot-seo?url=${encodeURIComponent(url)}&list=1`);
      setSnapshots(res.data.files || []);
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : (err as Error).message || "Failed to load snapshots.";
      setError(errorMsg);
    } finally {
      // setSnapshotsLoading(false);
    }
  };

  const handleSelectSnapshot = async (filename: string) => {
    setModalOpen(false);
    setLoading(true);
    setCompareResult(null);
    setResult(null);
    setSaved(false);
    setError("");
    try {
      // Fetch current SEO data
      const res = await axios.post("/api/snapshot-seo", { url });
      const current = res.data.result;
      // Fetch selected snapshot
      const prevRes = await axios.get(`/api/snapshot-seo?file=${encodeURIComponent(filename)}`);
      const previous = prevRes.data.previous;
      setCompareResult({ current, previous });
      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : (err as Error).message || "Failed to compare SEO data.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      {/* Modal for snapshot selection */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-[8px]">
          <div className="relative w-full max-w-2xl mx-auto">
            {/* Modal Card */}
            <div className="relative rounded-2xl shadow-2xl bg-white/90 border border-indigo-100 overflow-hidden animate-fade-in">
              {/* Accent Icon */}
              <div className="flex items-center justify-center pt-8 pb-2">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-amber-400 shadow-lg text-3xl text-white border-4 border-white">🗂️</span>
              </div>
              {/* Floating Close Button */}
              <button
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-amber-100 text-amber-500 hover:text-amber-700 text-2xl font-bold shadow transition-all z-10 border border-amber-100"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                style={{ lineHeight: 1 }}
              >
                ×
              </button>
              <div className="p-8 pt-2 flex flex-col items-center">
                <h3 className="text-2xl font-extrabold mb-6 text-center text-slate-800 tracking-tight flex items-center gap-2 drop-shadow-sm">
                  Select a Snapshot to Compare
                </h3>
                {datesLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                    <span className="ml-3 text-slate-700">Loading snapshot dates...</span>
                  </div>
                ) : (
                  <div className="w-full max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent px-1">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {snapshots.map((file) => (
                        <div
                          key={file}
                          className="bg-white/80 border border-amber-100 rounded-xl p-3 shadow-md hover:shadow-xl flex flex-col items-center transition-all duration-200 group min-h-[90px] min-w-0 relative hover:bg-amber-50 cursor-pointer"
                        >
                          <span className="text-2xl mb-1 text-amber-400 group-hover:text-amber-600 transition-colors">🗃️</span>
                          <span className="font-semibold text-slate-800 text-xs text-center truncate w-full mb-1">
                            {snapshotDates[file] || formatDateFromFilenameOrData(file)}
                          </span>
                          <button
                            onClick={() => handleSelectSnapshot(file)}
                            className="mt-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-emerald-400 text-white rounded-full text-xs font-bold shadow hover:from-amber-500 hover:to-emerald-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                          >
                            Compare
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Scope selection modal */}
      {showScopeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-sm w-full border border-indigo-100">
            <h3 className="text-xl font-bold text-indigo-700 mb-4">Choose Scope</h3>
            <p className="mb-6 text-gray-700 text-center">Do you want to work only on this link or the entire website?</p>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 bg-gradient-to-r from-purple-400 to-indigo-500 text-white rounded-lg font-bold shadow hover:from-purple-500 hover:to-indigo-600 transition-all duration-200"
                onClick={() => {
                  // setSelectedScope('link');
                  window.location.href = `/snapshot-seo/dashboard?scope=link&url=${encodeURIComponent(url)}`;
                }}
              >Work on this Link</button>
              <button
                className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-amber-500 text-white rounded-lg font-bold shadow hover:from-emerald-500 hover:to-amber-600 transition-all duration-200"
                onClick={() => {
                  // setSelectedScope('website');
                  window.location.href = `/snapshot-seo/dashboard?scope=website&url=${encodeURIComponent(url)}`;
                }}
              >Work on Entire Website</button>
            </div>
            <button className="mt-6 text-sm text-gray-500 hover:text-indigo-700" onClick={() => setShowScopeModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 gap-6">
        {/* Small Sync UI floating card */}
        <div className="absolute top-8 right-8 z-20">
          <div className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white rounded-xl shadow-lg px-4 py-3 flex flex-col items-center min-w-[140px] border-2 border-white/30">
            <span className="text-lg font-bold mb-1 flex items-center gap-1">🔄 Sync</span>
            <button
              className="bg-white/20 hover:bg-white/40 text-white font-semibold rounded-full px-3 py-1 text-xs shadow transition-all duration-150"
              onClick={() => alert('Sync started!')}
              type="button"
            >Sync Now</button>
            <span className="mt-1 text-xs text-white/80">Last: Never</span>
          </div>
        </div>
        <div className="bg-white/90 rounded-2xl shadow-lg p-8 w-full max-w-xl flex flex-col items-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">SnapshotSEO Pro</h2>
          <form className="flex flex-col gap-4 w-full mb-4" onSubmit={e => { e.preventDefault(); }}>
            <input
              value={url}
              onChange={handleUrlChange}
              placeholder="Enter a URL (e.g. https://example.com)"
              className="p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none bg-white/80 text-black placeholder-black"
            />
          </form>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          {showOptions && (
            <div className="flex flex-col md:flex-row gap-4 w-full mt-2">
              <button
                onClick={handleFetchSeo}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:shadow-2xl hover:from-green-500 hover:to-emerald-700 transform hover:-translate-y-1 transition-all duration-300 text-base disabled:opacity-50 disabled:cursor-not-allowed group"
                style={{ minHeight: '40px' }}
              >
                <span className="text-xl">🚀</span>
                <span>{loading ? "Analyzing..." : "Analyze SEO Now"}</span>
              </button>
              <button
                onClick={handleCompare}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:shadow-2xl hover:from-blue-500 hover:to-indigo-700 transform hover:-translate-y-1 transition-all duration-300 text-base disabled:opacity-50 disabled:cursor-not-allowed group"
                style={{ minHeight: '40px' }}
              >
                <span className="text-xl">🔍</span>
                <span>{loading ? "Comparing..." : "Compare with Last Snapshot"}</span>
              </button>
            </div>
          )}
        </div>
        {/* Result Side */}
        <div className="w-full max-w-6xl space-y-4 relative mx-auto">
          <div className="block md:hidden h-4" />
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-700">Processing...</span>
            </div>
          )}
          {!!result && !loading && (
            <div ref={resultRef} className="relative">
              <SeoResultBox data={result} />
              {saved && <div className="text-green-600 mt-2">Snapshot saved!</div>}
              {!saved && <div className="text-gray-500 mt-2">No changes detected. Snapshot not saved.</div>}
            </div>
          )}
          {!loading && compareResult && (
            <div ref={resultRef} className="relative bg-white rounded-2xl shadow-lg p-0 md:p-6 border border-amber-100 overflow-hidden mt-6">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-amber-100 bg-emerald-50">
                  <div className="flex flex-col gap-1 mb-2">
                    <span className="text-lg font-bold text-emerald-700">Current</span>
                    <span className="text-xs text-gray-500">{new Date().toLocaleString()}</span>
                  </div>
                  <SeoResultBox data={compareResult.current} />
                </div>
                <div className="flex-1 p-6 bg-amber-50">
                  <div className="flex flex-col gap-1 mb-2">
                    <span className="text-lg font-bold text-amber-700">Selected Snapshot</span>
                    <span className="text-xs text-gray-500">{compareResult.previous && (compareResult.previous as Record<string, unknown>).date ? new Date((compareResult.previous as Record<string, unknown>).date as string).toLocaleString() : ''}</span>
                  </div>
                  {compareResult.previous ? (
                    <SeoResultBox data={compareResult.previous} />
                  ) : (
                    <div className="text-gray-500">No previous snapshot found.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 