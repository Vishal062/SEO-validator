'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setResults } from '../seoSlice';
import type { RootState } from '../store';
import CompareSeoResultBox from '@/components/CompareSeoResultBox';

function highlightBase(url: string, base: string) {
  if (!url.startsWith(base)) return <span>{url}</span>;
  return <span><span className="bg-yellow-200 px-1 rounded font-bold">{base}</span>{url.slice(base.length)}</span>;
}

const UAT_KEY = 'seo-compare-uat-bases';
const PROD_KEY = 'seo-compare-prod-bases';
const PATH_KEY = 'seo-compare-shared-paths';
const LAST_PATH_KEY = 'seo-compare-last-shared-path';

function getStoredBases(key: string) {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}
function storeBase(key: string, value: string) {
  if (!value) return;
  let arr = getStoredBases(key);
  if (!arr.includes(value)) {
    arr.unshift(value);
    if (arr.length > 10) arr = arr.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(arr));
  }
}

export default function CompareSeoPage() {
  const [rows, setRows] = useState([
    { uatBase: '', prodBase: '', path: '' }
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const results = useSelector((state: RootState) => (state as RootState).seo.results);

  const [uatSuggestions, setUatSuggestions] = useState<string[]>([]);
  const [prodSuggestions, setProdSuggestions] = useState<string[]>([]);
  const [showUatDropdown, setShowUatDropdown] = useState<number | null>(null);
  const [showProdDropdown, setShowProdDropdown] = useState<number | null>(null);
  const uatRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prodRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [pathSuggestions, setPathSuggestions] = useState<string[]>([]);
  const [showPathDropdown, setShowPathDropdown] = useState<number | null>(null);
  const pathRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [lastPath, setLastPath] = useState<string>("");

  useEffect(() => {
    setUatSuggestions(getStoredBases(UAT_KEY));
    setProdSuggestions(getStoredBases(PROD_KEY));
    setLastPath(localStorage.getItem(LAST_PATH_KEY) || "");
  }, []);

  const handleChange = (idx: number, field: 'uatBase' | 'prodBase' | 'path', value: string) => {
    const updated = [...rows];
    updated[idx][field] = value;
    setRows(updated);
    setError('');
  };

  const addRow = () => {
    setRows([...rows, { uatBase: '', prodBase: '', path: '' }]);
    setError('');
  };

  const deleteRow = (idx: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== idx));
    setError('');
  };

  const handleUatFocus = (i: number) => {
    setUatSuggestions(getStoredBases(UAT_KEY));
    setShowUatDropdown(i);
  };
  const handleProdFocus = (i: number) => {
    setProdSuggestions(getStoredBases(PROD_KEY));
    setShowProdDropdown(i);
  };
  const handleUatBlur = () => setTimeout(() => setShowUatDropdown(null), 150);
  const handleProdBlur = () => setTimeout(() => setShowProdDropdown(null), 150);

  const handlePathFocus = (i: number) => {
    setPathSuggestions(getStoredBases(PATH_KEY));
    setShowPathDropdown(i);
  };
  const handlePathBlur = () => setTimeout(() => setShowPathDropdown(null), 150);

  // Simple URL validation function
  function isValidUrl(url: string) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  const handleCompare = async () => {
    if (rows.some(row => !row.uatBase.trim() || !row.prodBase.trim() || !row.path.trim())) {
      setError('Please fill all fields in every row.');
      return;
    }
    // Validate UAT and PROD base URLs
    for (const row of rows) {
      if (!isValidUrl(row.uatBase.trim()) || !isValidUrl(row.prodBase.trim())) {
        setError('Please enter a valid URL format for both UAT and PROD base URLs.');
        return;
      }
    }
    setError('');
    setLoading(true);
    dispatch(setResults([]));
    try {
      const pairs = rows.map(row => ({
        uatUrl: row.uatBase.replace(/\/$/, '') + row.path,
        prodUrl: row.prodBase.replace(/\/$/, '') + row.path,
      }));
      const res = await axios.post('/api/compare', { pairs });
      dispatch(setResults(res.data.results));
      for (const row of rows) {
        storeBase(UAT_KEY, row.uatBase.trim());
        storeBase(PROD_KEY, row.prodBase.trim());
        localStorage.setItem(LAST_PATH_KEY, row.path.trim());
      }
      setUatSuggestions(getStoredBases(UAT_KEY));
      setProdSuggestions(getStoredBases(PROD_KEY));
      setLastPath(localStorage.getItem(LAST_PATH_KEY) || "");
    } catch (err: any) {
      setError('Failed to compare SEO.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
        {/* Decorative background (reuse from check-seo) */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        <main className="relative z-10 flex flex-col md:flex-row min-h-screen p-6 gap-6">
          {/* Input Side */}
          <div className="md:w-1/2 space-y-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Compare URLs</h2>
            {rows.map((row, i) => (
              <div key={i} className="flex flex-col gap-1 mb-2">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-2 w-full">
                  <div className="w-full md:w-1/3 relative">
                    <input
                      ref={el => { uatRefs.current[i] = el; }}
                      value={row.uatBase}
                      onChange={e => handleChange(i, 'uatBase', e.target.value)}
                      onFocus={() => handleUatFocus(i)}
                      onBlur={handleUatBlur}
                      placeholder="UAT Base URL"
                      className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none bg-white/80 text-black"
                    />
                    {showUatDropdown === i && uatSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 z-30 bg-white border border-gray-200 rounded shadow mt-1 w-full max-h-40 overflow-y-auto">
                        {uatSuggestions.map((s, idx) => (
                          <div
                            key={s}
                            className="px-3 py-1 text-xs text-gray-700 hover:bg-purple-100 cursor-pointer"
                            onMouseDown={() => { handleChange(i, 'uatBase', s); setShowUatDropdown(null); }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Suggestion for UAT Base URL from first row */}
                    {i > 0 && rows[0].uatBase.trim() && (
                      <div className="text-xs text-gray-500 mt-1 cursor-pointer hover:underline" onClick={() => handleChange(i, 'uatBase', rows[0].uatBase)}>
                        Suggest: <span className="text-purple-700">{rows[0].uatBase}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-1/3 relative">
                    <input
                      ref={el => { prodRefs.current[i] = el; }}
                      value={row.prodBase}
                      onChange={e => handleChange(i, 'prodBase', e.target.value)}
                      onFocus={() => handleProdFocus(i)}
                      onBlur={handleProdBlur}
                      placeholder="PROD Base URL"
                      className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white/80 text-black"
                    />
                    {showProdDropdown === i && prodSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 z-30 bg-white border border-gray-200 rounded shadow mt-1 w-full max-h-40 overflow-y-auto">
                        {prodSuggestions.map((s, idx) => (
                          <div
                            key={s}
                            className="px-3 py-1 text-xs text-gray-700 hover:bg-blue-100 cursor-pointer"
                            onMouseDown={() => { handleChange(i, 'prodBase', s); setShowProdDropdown(null); }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Suggestion for PROD Base URL from first row */}
                    {i > 0 && rows[0].prodBase.trim() && (
                      <div className="text-xs text-gray-500 mt-1 cursor-pointer hover:underline" onClick={() => handleChange(i, 'prodBase', rows[0].prodBase)}>
                        Suggest: <span className="text-blue-700">{rows[0].prodBase}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-1/3 relative">
                    <input
                      value={row.path}
                      onChange={e => handleChange(i, 'path', e.target.value)}
                      onFocus={() => setShowPathDropdown(i)}
                      onBlur={() => setTimeout(() => setShowPathDropdown(null), 150)}
                      placeholder="Shared Path"
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-gray-500 focus:outline-none bg-white/80 text-black"
                    />
                    {/* Suggestion for Shared Path: only show when input is focused and user has started typing */}
                    {showPathDropdown === i && lastPath && lastPath.trim() && lastPath !== row.path && (
                      <div className="absolute left-0 right-0 z-30 bg-white border border-gray-200 rounded shadow mt-1 w-full max-h-40 overflow-y-auto">
                        <div
                          className="px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={() => { handleChange(i, 'path', lastPath); setShowPathDropdown(null); }}
                        >
                          Suggest: <span className="text-gray-700">{lastPath}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteRow(i)}
                      className="group relative p-2 rounded-full hover:bg-red-100 transition"
                      title="Delete this row"
                    >
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="absolute left-1/2 -translate-x-1/2 top-8 z-10 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none transition-opacity whitespace-nowrap">Delete this row</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-3 items-center">
              <button
                onClick={handleCompare}
                disabled={loading || rows.some(row => !row.uatBase.trim() || !row.prodBase.trim() || !row.path.trim())}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Comparing...' : 'Compare SEO'}
              </button>
              <button
                type="button"
                onClick={addRow}
                className="group relative p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
                aria-label="Add more row"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="absolute left-1/2 -translate-x-1/2 top-12 z-10 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none transition-opacity whitespace-nowrap">Add more row</span>
              </button>
            </div>
            {error && (
              <div className="text-red-600 text-sm mt-2">{error}</div>
            )}
          </div>
          {/* Result Side */}
          <div className="md:w-1/2 space-y-4 relative">
            {/* On mobile, stack results below inputs */}
            <div className="block md:hidden h-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Comparison of SEO Results</h2>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-700">Comparing SEO...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 text-center text-gray-400 text-base md:text-lg border border-dashed border-gray-300">
                Your SEO comparison results will show up here once you submit the URLs.
              </div>
            ) : (
              results.map((result, i) => (
                <div key={i} className="w-full">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* On mobile, stack UAT and PROD vertically; on desktop, side by side */}
                    <div className="flex-1 w-full">
                      <CompareSeoResultBox uat={result.uat} prod={result.prod} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </>
  );
} 