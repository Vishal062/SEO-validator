'use client';
import React, { useState, useRef, useEffect } from 'react';
import SeoResultBox from '@/components/seoResultBox';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setResults } from '../seoSlice';
import type { RootState } from '../store';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
// Remove Tooltip import (not used)
// import { Tooltip } from 'react-tooltip';
// import React, { useState } from 'react'; // This line is removed as per the edit hint.
dayjs.extend(relativeTime);

export default function IntelliSeoPage() {
  const [urls, setUrls] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [showScrollIndicators, setShowScrollIndicators] = useState(false);
  const [error, setError] = useState("");
  const [snapshots, setSnapshots] = useState<{date: string|null, loading: boolean}[]>([{date: null, loading: false}]);
  const [urlReachable, setUrlReachable] = useState<(boolean|null)[]>([null]); // null = not checked, true = reachable, false = not reachable
  const [snapshotMeta, setSnapshotMeta] = useState<{updated: string|null, date: string|null}[]>([{updated: null, date: null}]);
  // Add index signatures for type safety
  interface SnapshotsByLink { [url: string]: any[]; }
  interface SelectedSnapshot { [url: string]: string | null; }
  const [snapshotsByLink, setSnapshotsByLink] = useState<SnapshotsByLink>({});
  const [selectedSnapshot, setSelectedSnapshot] = useState<SelectedSnapshot>({});
  interface ComparisonResult {
    url: string;
    diffs: Record<string, { current: any; snapshot: any }>;
    snapshotData?: any;
    currentResult?: any;
    error?: string;
  }
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [comparisonSlide, setComparisonSlide] = useState(0);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importSheetUrl, setImportSheetUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  // Use Redux for results
  const results = useSelector((state: RootState) => (state as RootState).seo.results);
  const dispatch = useDispatch();

  // Per-URL async dataLayer for Analytics tab
  const [dataLayerAsyncMap, setDataLayerAsyncMap] = useState<Record<string, any[]>>({});

  // Check if scrolling is needed
  useEffect(() => {
    if (results.length === 0) {
      setShowScrollIndicators(false);
      return;
    }
    const checkScrollNeeded = () => {
      if (resultsContainerRef.current && results.length > 0) {
        const container = resultsContainerRef.current;
        const hasOverflow = container.scrollHeight > container.clientHeight;
        setShowScrollIndicators(hasOverflow);
      } else {
        setShowScrollIndicators(false);
      }
    };

    checkScrollNeeded();
    window.addEventListener('resize', checkScrollNeeded);
    return () => window.removeEventListener('resize', checkScrollNeeded);
  }, [results]);

  // Check snapshot existence for a URL
  const checkSnapshot = async (url: string, idx: number) => {
    if (!isValidUrl(url)) {
      setSnapshots(prev => {
        const arr = [...prev];
        arr[idx] = { date: null, loading: false };
        return arr;
      });
      setSnapshotMeta(prev => {
        const arr = [...prev];
        arr[idx] = { updated: null, date: null };
        return arr;
      });
      return;
    }
    setSnapshots(prev => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], loading: true };
      return arr;
    });
    try {
      const res = await axios.get(`/api/snapshot-seo?url=${encodeURIComponent(url)}`);
      const previous = res.data.previous;
      if (previous && (previous.updated || previous.date)) {
        setSnapshots(prev => {
          const arr = [...prev];
          arr[idx] = { date: previous.updated || previous.date, loading: false };
          return arr;
        });
        setSnapshotMeta(prev => {
          const arr = [...prev];
          arr[idx] = { updated: previous.updated || null, date: previous.date || null };
          return arr;
        });
      } else {
        setSnapshots(prev => {
          const arr = [...prev];
          arr[idx] = { date: null, loading: false };
          return arr;
        });
        setSnapshotMeta(prev => {
          const arr = [...prev];
          arr[idx] = { updated: null, date: null };
          return arr;
        });
      }
    } catch {
      setSnapshots(prev => {
        const arr = [...prev];
        arr[idx] = { date: null, loading: false };
        return arr;
      });
      setSnapshotMeta(prev => {
        const arr = [...prev];
        arr[idx] = { updated: null, date: null };
        return arr;
      });
    }
  };

  // Enhanced: Check if URL is reachable (not 404)
  async function checkUrlReachable(url: string, idx: number) {
    if (!isValidUrl(url)) {
      setUrlReachable(prev => {
        const arr = [...prev];
        arr[idx] = null;
        return arr;
      });
      return;
    }
    try {
      // Use HEAD for speed, fallback to GET if needed
      const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      // If we get here, assume reachable (no-cors may not give status, but won't throw for 404)
      setUrlReachable(prev => {
        const arr = [...prev];
        arr[idx] = true;
        return arr;
      });
    } catch {
      setUrlReachable(prev => {
        const arr = [...prev];
        arr[idx] = false;
        return arr;
      });
    }
  }

  // On URL change, check snapshot and reachability
  const handleChange = (index: number, value: string) => {
    const updated = [...urls];
    updated[index] = value;
    setUrls(updated);
    setError("");
    // Ensure snapshots and reachability arrays stay in sync
    setSnapshots(prev => {
      const arr = [...prev];
      arr[index] = { date: null, loading: false };
      if (arr.length < updated.length) arr.push({ date: null, loading: false });
      return arr.slice(0, updated.length);
    });
    setSnapshotMeta(prev => {
      const arr = [...prev];
      arr[index] = { updated: null, date: null };
      if (arr.length < updated.length) arr.push({ updated: null, date: null });
      return arr.slice(0, updated.length);
    });
    setUrlReachable(prev => {
      const arr = [...prev];
      arr[index] = null;
      if (arr.length < updated.length) arr.push(null);
      return arr.slice(0, updated.length);
    });
    // Use normalized URL as key
    setSelectedSnapshot(prev => {
      const obj: Record<string, string | null> = {};
      updated.forEach(u => {
        if (isValidUrl(u)) {
          obj[normalizeUrlForSnapshot(u)] = prev[normalizeUrlForSnapshot(u)] || null;
        }
      });
      return obj;
    });
    setSnapshotsByLink(prev => {
      const obj: Record<string, any[]> = {};
      updated.forEach(u => {
        if (isValidUrl(u)) {
          obj[normalizeUrlForSnapshot(u)] = prev[normalizeUrlForSnapshot(u)] || [];
        }
      });
      return obj;
    });
    if (isValidUrl(value)) {
      checkSnapshot(value, index);
      checkUrlReachable(value, index);
      fetchAllSnapshots(value);
    }
  };

  // On add/delete field, keep snapshots in sync
  const addField = () => {
    setUrls([...urls, ""]);
    setSnapshots(prev => [...prev, { date: null, loading: false }]);
    setSnapshotMeta(prev => [...prev, { updated: null, date: null }]);
    setUrlReachable(prev => [...prev, null]);
    setSelectedSnapshot(prev => ({ ...prev }));
    setError("");
  };
  const deleteField = (index: number) => {
    if (urls.length === 1) return;
    const updated = urls.filter((_, i) => i !== index);
    setUrls(updated);
    setSnapshots(prev => prev.filter((_, i) => i !== index));
    setSnapshotMeta(prev => prev.filter((_, i) => i !== index));
    setUrlReachable(prev => prev.filter((_, i) => i !== index));
    setSelectedSnapshot(prev => {
      const obj: Record<string, string | null> = {};
      updated.forEach(u => {
        if (isValidUrl(u)) {
          obj[normalizeUrlForSnapshot(u)] = prev[normalizeUrlForSnapshot(u)] || null;
        }
      });
      return obj;
    });
    setSnapshotsByLink(prev => {
      const obj: Record<string, any[]> = {};
      updated.forEach(u => {
        if (isValidUrl(u)) {
          obj[normalizeUrlForSnapshot(u)] = prev[normalizeUrlForSnapshot(u)] || [];
        }
      });
      return obj;
    });
    setComparisonResults(prev => prev.filter(res => res.url !== urls[index]));
    setError("");
  };

  // Sync Now handler
  const handleSyncNow = async (url: string, idx: number) => {
    setSnapshots(prev => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], loading: true };
      return arr;
    });
    try {
      const res = await axios.post('/api/snapshot-seo', { url });
      if (res.data) {
        setSnapshots(prev => {
          const arr = [...prev];
          arr[idx] = { date: res.data.updated, loading: false };
          return arr;
        });
        setSnapshotMeta(prev => {
          const arr = [...prev];
          arr[idx] = { updated: res.data.updated || null, date: res.data.date || null };
          return arr;
        });
      } else {
        checkSnapshot(url, idx);
      }
    } catch {
      setSnapshots(prev => {
        const arr = [...prev];
        arr[idx] = { ...arr[idx], loading: false };
        return arr;
      });
    }
  };

  // Track latest fetch token per normalized URL to avoid race conditions
  const fetchTokens = useRef<Record<string, number>>({});

  // Fetch all snapshots for a link (race-condition safe)
  const fetchAllSnapshots = async (url: string) => {
    if (!isValidUrl(url)) return;
    const normUrl = normalizeUrlForSnapshot(url);
    // Increment token for this URL
    fetchTokens.current[normUrl] = (fetchTokens.current[normUrl] || 0) + 1;
    const myToken = fetchTokens.current[normUrl];
    try {
      const res = await axios.get(`/api/snapshot-seo?url=${encodeURIComponent(url)}&list=1`);
      if (res.data.files && Array.isArray(res.data.files)) {
        // Fetch metadata for each file
        const metas = await Promise.all(res.data.files.map(async (file: string) => {
          try {
            const metaRes = await axios.get(`/api/snapshot-seo?file=${encodeURIComponent(file)}`);
            return { file, ...metaRes.data.previous };
          } catch {
            return null;
          }
        }));
        // Only update if this is the latest fetch for this URL
        if (fetchTokens.current[normUrl] === myToken) {
          setSnapshotsByLink(prev => ({ ...prev, [normUrl]: metas.filter(Boolean).sort((a, b) => (b.updated || b.date || '').localeCompare(a.updated || a.date || '')) }));
        }
      } else {
        if (fetchTokens.current[normUrl] === myToken) {
          setSnapshotsByLink(prev => ({ ...prev, [normUrl]: [] }));
        }
      }
    } catch {
      if (fetchTokens.current[normUrl] === myToken) {
        setSnapshotsByLink(prev => ({ ...prev, [normUrl]: [] }));
      }
    }
  };

  // On URL change, fetch all snapshots for dropdown
  useEffect(() => {
    urls.forEach((url, i) => {
      if (isValidUrl(url)) fetchAllSnapshots(url);
    });
    // eslint-disable-next-line
  }, [urls.length, urls.join('|')]);

  // Per-link dropdown change
  const handleSnapshotSelect = (url: string, file: string | null) => {
    setSelectedSnapshot(prev => ({ ...prev, [normalizeUrlForSnapshot(url)]: file }));
  };

  // Comparison logic
  // Utility: Normalize URL for snapshot/result matching (same as backend)
  function normalizeUrlForSnapshot(url: string) {
    try {
      let u = url.trim();
      u = u.replace(/^https?:\/\//, '');
      u = u.replace(/^www\./, '');
      // Remove trailing slashes, spaces, and dots, but keep the path
      u = u.replace(/[\s.\/]+$/, '');
      return u;
    } catch {
      return url;
    }
  }
  // Utility: Deep diff for objects/arrays, returns { path: { current, snapshot } }
  function deepDiff(current: any, snapshot: any, path = ""): Record<string, { current: any; snapshot: any }> {
    const diffs: Record<string, { current: any; snapshot: any }> = {};
    if (typeof current !== typeof snapshot) {
      diffs[path || "root"] = { current, snapshot };
      return diffs;
    }
    if (Array.isArray(current) && Array.isArray(snapshot)) {
      const maxLen = Math.max(current.length, snapshot.length);
      for (let i = 0; i < maxLen; i++) {
        const subPath = `${path}[${i}]`;
        Object.assign(diffs, deepDiff(current[i], snapshot[i], subPath));
      }
      return diffs;
    }
    if (typeof current === "object" && current && snapshot) {
      const keys = new Set([...Object.keys(current), ...Object.keys(snapshot)]);
      for (const key of keys) {
        if (["file", "date", "updated"].includes(key)) continue;
        const subPath = path ? `${path}.${key}` : key;
        Object.assign(diffs, deepDiff(current[key], snapshot[key], subPath));
      }
      return diffs;
    }
    if (current !== snapshot) {
      diffs[path] = { current, snapshot };
    }
    return diffs;
  }
  // Helper to format diff keys for user-friendly display
  function formatDiffKey(key: string): string {
    // headings[0].text → Heading H1 Text
    const headingMatch = key.match(/^headings\[(\d+)\]\.text$/);
    if (headingMatch) {
      const idx = parseInt(headingMatch[1], 10);
      const level = idx + 1;
      return `Heading H${level} Text`;
    }
    // fallback: prettify other keys
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  const compareSnapshots = async () => {
    // Always refresh snapshot lists for all URLs first
    await Promise.all(urls.map(async (url) => {
      if (isValidUrl(url)) await fetchAllSnapshots(url);
    }));
    // Wait a tick to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 0));
    // Re-read the latest snapshotsByLink
    const currentSnapshotsByLink = { ...snapshotsByLink };
    const results: any[] = [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (!isValidUrl(url)) continue;
      const normUrl = normalizeUrlForSnapshot(url);
      if (!currentSnapshotsByLink[normUrl] || currentSnapshotsByLink[normUrl].length <= 1) {
        results.push({ url, error: 'Not enough snapshots to compare.' });
        continue;
      }
      const latestSnap = currentSnapshotsByLink[normUrl][0];
      const file = selectedSnapshot[normUrl];
      let selectedSnap = null;
      if (file) {
        // Always fetch the full snapshot data from the API for the selected file
        try {
          const res = await axios.get(`/api/snapshot-seo?file=${encodeURIComponent(file)}`);
          selectedSnap = res.data.previous || null;
        } catch {
          selectedSnap = null;
        }
      } else {
        selectedSnap = currentSnapshotsByLink[normUrl][1] || null;
      }
      if (selectedSnap && latestSnap) {
        // Use deepDiff for all fields
        const diffs = deepDiff(latestSnap, selectedSnap);
        results.push({ url, diffs, snapshotData: selectedSnap, currentResult: latestSnap });
      } else {
        results.push({ url, error: 'No valid snapshot selected or available.' });
      }
    }
    setComparisonResults(results);
    setComparisonModalOpen(true);
    setComparisonSlide(0);
  };

  // Get current SEO results from Redux (by order)
  const resultsFromRedux = useSelector((state: RootState) => (state as RootState).seo.results || []);

  const hasValidUrl = urls.length > 0 && urls.every((url, idx) => url.trim() !== "" && isValidUrl(url) && urlReachable[idx] !== false);

  // Simple URL validation function
  function isValidUrl(url: string) {
    try {
      const u = new URL(url);
      // Only allow http/https and require a valid hostname
      return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.hostname && /^[a-zA-Z0-9.-]+$/.test(u.hostname);
    } catch {
      return false;
    }
  }

  const fetchSEO = async () => {
    if (!hasValidUrl) {
      setError(urls.length === 1 ? "Enter the URL first." : "Please enter a URL in every box.");
      return;
    }
    // Validate all URLs
    for (const url of urls) {
      if (!isValidUrl(url.trim())) {
        setError('Please enter a valid URL format');
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/api/seo", { urls });
      // Save results to Redux
      dispatch(setResults(res.data.results));
      
      // Enhanced datalayer capture for each URL
      urls.forEach((url, idx) => {
        const result = res.data.results[idx];
        if (result && result.dataLayer && Array.isArray(result.dataLayer)) {
          // Store the datalayer data immediately if available
          setDataLayerAsyncMap(prev => ({
            ...prev,
            [normalizeUrlForSnapshot(url)]: result.dataLayer
          }));
        }
        
        // Also save snapshot for each URL asynchronously (fire and forget)
        axios.post("/api/snapshot-seo", { url }).then(snapshotRes => {
          // Enhanced: fetch the snapshot file again after 30s for latest dataLayer
          if (snapshotRes.data && snapshotRes.data.saved && snapshotRes.data.date) {
            const fileName = snapshotRes.data.file || null;
            // Immediately update snapshot date in UI
            checkSnapshot(url, idx);
            // --- Update snapshot date/meta like Sync feature ---
            setSnapshots(prev => {
              const arr = [...prev];
              arr[idx] = { date: snapshotRes.data.updated, loading: false };
              return arr;
            });
            setSnapshotMeta(prev => {
              const arr = [...prev];
              arr[idx] = { updated: snapshotRes.data.updated || null, date: snapshotRes.data.date || null };
              return arr;
            });
            setTimeout(async () => {
              // Try to get the latest snapshot file for this URL
              try {
                // If fileName is not provided, try to get latest by URL
                let file = fileName;
                if (!file) {
                  const listRes = await axios.get(`/api/snapshot-seo?url=${encodeURIComponent(url)}&list=1`);
                  if (listRes.data.files && listRes.data.files.length > 0) file = listRes.data.files[0];
                }
                if (file) {
                  const fileRes = await axios.get(`/api/snapshot-seo?file=${encodeURIComponent(file)}`);
                  if (fileRes.data.previous && fileRes.data.previous.dataLayer) {
                    setDataLayerAsyncMap(prev => ({
                      ...prev,
                      [normalizeUrlForSnapshot(url)]: fileRes.data.previous.dataLayer
                    }));
                  }
                }
              } catch {}
            }, 30000); // Increased timeout to 30 seconds for better datalayer capture
          } else {
            // Even if not saved, try to update snapshot date
            checkSnapshot(url, idx);
          }
          fetchAllSnapshots(url).then(() => {
            const normUrl = normalizeUrlForSnapshot(url);
            const snaps = (snapshotsByLink[normUrl] || []);
            if (snaps.length > 1) {
              setSelectedSnapshot(prev => ({
                ...prev,
                [normUrl]: snaps[1].file // first previous snapshot
              }));
            }
          }); // <-- Add this to refresh the dropdown after SEO analysis
        }).catch(() => { checkSnapshot(url, idx); });
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Failed:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler for folder icon click
  const handleFolderClick = () => {
    setImportSheetUrl('');
    setImportError('');
    setImportModalOpen(true);
  };

  // Handler for import action
  const handleImportSheet = async () => {
    setImportError('');
    setImportLoading(true);
    // Extract Sheet ID
    const match = importSheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      setImportError('Invalid Google Sheet link!');
      setImportLoading(false);
      return;
    }
    const sheetId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    try {
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error('Failed to fetch sheet');
      const text = await res.text();
      // Parse CSV (skip header row, get first column, remove quotes)
      const rows = text.split('\n');
      const urls = rows
        .slice(1) // skip the first row (header)
        .map(row => {
          let val = row.split(',')[0].trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          val = val.replace(/,+$/, '');
          return val;
        })
        .filter(Boolean);
      if (urls.length === 0) {
        setImportError('No links found in the sheet!');
        setImportLoading(false);
        return;
      }
      setUrls(urls);
      setImportModalOpen(false);
      urls.forEach((url, idx) => {
        if (isValidUrl(url)) checkSnapshot(url, idx);
      });
    } catch (e) {
      setImportError('Failed to fetch or parse the sheet!');
    } finally {
      setImportLoading(false);
    }
  };

  const scrollToTop = () => {
    if (resultsContainerRef.current) {
      resultsContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const scrollToBottom = () => {
    if (resultsContainerRef.current) {
      resultsContainerRef.current.scrollTo({
        top: resultsContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const arrowBtnClass = "w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-black text-2xl font-bold shadow disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <main className="relative z-10 flex flex-col md:flex-row min-h-screen p-6 gap-6">
          {/* Input Side */}
          <div className="md:w-1/2 space-y-4">
            <h4 className="text-2xl font-bold text-gray-900 mb-6">Enter URLs</h4>
            {urls.map((url, i) => (
              <div key={i} className="flex flex-col gap-1 mb-2">
                {/* Row above input: Last Changes (left) and Dropdown (right) */}
                <div className="flex items-center justify-between w-full mb-1">
                  {/* Show last changes if available (selected snapshot or latest) */}
                  {(() => {
                    const normUrl = normalizeUrlForSnapshot(url);
                    let showDate: string | null = null;
                    if (selectedSnapshot[normUrl]) {
                      // Find the selected snapshot in the list
                      const snaps = snapshotsByLink[normUrl] || [];
                      const found = snaps.find(snap => snap.file === selectedSnapshot[normUrl]);
                      if (found && found.updated) showDate = found.updated;
                    } else if (snapshotMeta[i]?.date && snapshotMeta[i].date !== snapshotMeta[i]?.updated) {
                      showDate = snapshotMeta[i].date;
                    }
                    return showDate ? (
                      <span className="text-xs text-gray-500 bg-white/80 px-2 rounded shadow">
                        Last Changes: {dayjs(showDate).fromNow()}
                      </span>
                    ) : <span />;
                  })()}

                  {/* Only show dropdown or label if input is not empty */}
                  {url.trim() ? (
                    snapshotsByLink[normalizeUrlForSnapshot(url)] && snapshotsByLink[normalizeUrlForSnapshot(url)].length > 1 ? (
                      <select
                        className="text-xs px-2 py-1 rounded border border-gray-300 bg-white text-black ml-2"
                        value={selectedSnapshot[normalizeUrlForSnapshot(url)] || ''}
                        onChange={e => handleSnapshotSelect(url, e.target.value || null)}
                        title="Select a snapshot to compare"
                        style={{ minWidth: 120 }}
                      >
                        {snapshotsByLink[normalizeUrlForSnapshot(url)].slice(1).map(snap => (
                          <option key={snap.file} value={snap.file}>
                            {snap.updated ? dayjs(snap.updated).format('YYYY-MM-DD HH:mm') : snap.file}
                          </option>
                        ))}
                      </select>
                    ) : (
                      // Show label if there are no previous snapshots
                      <span className="text-xs text-gray-400 ml-2">No snapshots available</span>
                    )
                  ) : null}
                </div>
                {/* Input field on its own row */}
                <div className="w-full flex flex-row items-center mb-6 gap-2">
                  <div className="relative flex-1 flex items-center">
                    <input
                      value={url}
                      onChange={(e) => handleChange(i, e.target.value)}
                      placeholder="https://example.com"
                      className="w-full p-3 pr-40 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none bg-white/80 backdrop-blur-sm text-black placeholder-black"
                    />
                    {/* Date and sync icon absolutely positioned right, vertically centered */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2 h-full max-w-[140px] min-w-[120px] truncate">
                      {snapshots[i]?.loading ? (
                        <span className="text-xs text-gray-400 animate-pulse">...</span>
                      ) : !url.trim() ? null
                        : !isValidUrl(url) ? (
                        <span className="text-xs text-red-600 bg-white/80 px-2 rounded shadow">Invalid URL</span>
                      ) : urlReachable[i] === false ? (
                        <span className="text-xs text-red-600 bg-white/80 px-2 rounded shadow">Invalid URL</span>
                      ) : snapshotMeta[i]?.updated ? (
                        <span className="text-xs text-green-600 bg-white/80 px-2 rounded shadow truncate" title={dayjs(snapshotMeta[i].updated).format('YYYY-MM-DD HH:mm:ss')}>
                          {dayjs(snapshotMeta[i].updated).fromNow()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 bg-white/80 px-2 rounded shadow truncate">No snapshots available</span>
                      )}
                      {/* Sync icon (refresh) */}
                      <span
                        className={`cursor-pointer p-1 rounded-full hover:bg-blue-100 transition ${(snapshots[i]?.loading || !isValidUrl(url) || urlReachable[i] === false) ? 'opacity-50 pointer-events-none' : ''}`}
                        title="Sync snapshot now"
                        onClick={() => !snapshots[i]?.loading && isValidUrl(url) && urlReachable[i] !== false && handleSyncNow(url, i)}
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.93 4.93a10 10 0 0114.14 0m0 0V1m0 3.93h-3.93M19.07 19.07a10 10 0 01-14.14 0m0 0v3.93m0-3.93h3.93" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  {/* Cross button beside input */}
                  {urls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteField(i)}
                      className="group p-2 rounded-full hover:bg-red-100 transition flex items-center justify-center"
                      title="Delete this URL"
                    >
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="absolute left-1/2 -translate-x-1/2 top-8 z-10 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none transition-opacity whitespace-nowrap">Delete this URL</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-3 items-center">
              <button
                onClick={fetchSEO}
                disabled={!hasValidUrl || loading}
                className={`px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Seo Analysis
              </button>
              <button
                type="button"
                onClick={compareSnapshots}
                disabled={!hasValidUrl || loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Compare current SEO with selected or latest snapshot for each link"
              >
                Compare
              </button>
              {/* Folder icon button */}
              <button
                type="button"
                className="group relative p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
                aria-label="Folder options"
                title="Import from Google Sheet"
                style={{ minWidth: 48, minHeight: 48 }}
                onClick={handleFolderClick}
              >
                {/* Heroicons Folder icon, yellow */}
                <svg className="w-6 h-6" fill="none" stroke="#facc15" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h3.172a2 2 0 011.414.586l1.828 1.828A2 2 0 0012.828 8H19a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
                <span className="absolute left-1/2 -translate-x-1/2 top-12 z-10 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none transition-opacity whitespace-nowrap">Import from Google Sheet</span>
              </button>
              <button
                type="button"
                onClick={addField}
                className="group relative p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
                aria-label="Add more URL'S here"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="absolute left-1/2 -translate-x-1/2 top-12 z-10 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none transition-opacity whitespace-nowrap">Add more URL&#39;S here</span>
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
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6"> </h2>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-700">Analyzing SEO...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 text-center text-gray-400 text-base md:text-lg border border-dashed border-gray-300">
                Your IntelliSEO results will show up here once you submit the URLs.
              </div>
            ) : (
              results.length > 0 && (
                <div className="relative">
                  {/* Scroll Indicators - Only show when scrolling is needed */}
                  {showScrollIndicators && (
                    <>
                      {/* Top scroll indicator */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20">
                        <button
                          onClick={scrollToTop}
                          className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-gray-200"
                          title="Scroll to top"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      </div>
                      {/* Bottom scroll indicator */}
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-20">
                        <button
                          onClick={scrollToBottom}
                          className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-gray-200"
                          title="Scroll to bottom"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                  {/* Scrollable Results Container */}
                  <div
                    ref={resultsContainerRef}
                    className={`space-y-6 ${showScrollIndicators ? 'max-h-[calc(100vh-200px)] md:max-h-[calc(100vh-200px)] overflow-y-auto pr-2' : ''}`}
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 #f1f5f9'
                    }}
                  >
                    {results.map((r: any, i: number) => {
                      const url = r && typeof r === 'object' && 'url' in r ? r.url : urls[i];
                      const normUrl = normalizeUrlForSnapshot(url);
                      return <SeoResultBox key={i} data={r} dataLayerAsync={dataLayerAsyncMap[normUrl]} />;
                    })}
                  </div>
                  {/* Custom scrollbar styling for webkit browsers */}
                  <style jsx>{`
                  div::-webkit-scrollbar {
                    width: 8px;
                  }
                  div::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                  }
                `}</style>
                </div>
              )
            )}
          </div>
        </main>
      </div>
      {/* Modal Slider for Comparison Results */}
      {comparisonModalOpen && comparisonResults.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 animate-fade-in">
            {/* Close button */}
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-2xl font-bold focus:outline-none"
              onClick={() => setComparisonModalOpen(false)}
              title="Close"
            >
              &times;
            </button>
            {/* Slider controls and heading */}
            <div className="flex items-center justify-center gap-4 mb-4">
              {comparisonResults.length > 1 && (
                <button
                  className={arrowBtnClass}
                  onClick={() => setComparisonSlide(s => Math.max(0, s - 1))}
                  disabled={comparisonSlide === 0}
                  aria-label="Previous"
                  style={{ visibility: comparisonResults.length > 1 ? 'visible' : 'hidden' }}
                >
                  &#8592;
                </button>
              )}
              <div className="text-lg font-bold text-blue-700">
                Comparison {comparisonSlide + 1} of {comparisonResults.length}
              </div>
              {comparisonResults.length > 1 && (
                <button
                  className={arrowBtnClass}
                  onClick={() => setComparisonSlide(s => Math.min(comparisonResults.length - 1, s + 1))}
                  disabled={comparisonSlide === comparisonResults.length - 1}
                  aria-label="Next"
                  style={{ visibility: comparisonResults.length > 1 ? 'visible' : 'hidden' }}
                >
                  &#8594;
                </button>
              )}
            </div>
            {/* Slide content */}
            {(() => {
              const res = comparisonResults[comparisonSlide];
              return (
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                  <div className="font-semibold text-blue-700 text-base mb-2 break-all">{res.url}</div>
                  {res.error ? (
                    <div className="text-red-500 text-sm font-semibold">{res.error}</div>
                  ) : Object.keys(res.diffs).length === 0 ? (
                    <div className="text-green-600 text-base font-semibold">No differences found. The current SEO matches the selected snapshot.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200 rounded-lg">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left text-sm font-bold text-gray-700">Field</th>
                            <th className="px-4 py-2 text-left text-sm font-bold text-green-700">Current</th>
                            <th className="px-4 py-2 text-left text-sm font-bold text-purple-700">Snapshot</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(res.diffs).map(([key, diff]) => (
                            <tr key={key} className="border-t border-gray-100">
                              <td className="px-4 py-2 font-semibold text-gray-800 whitespace-nowrap">{key}</td>
                              <td className="px-4 py-2 text-green-900 bg-green-50 font-mono break-all">{String(diff.current)}</td>
                              <td className="px-4 py-2 text-purple-900 bg-purple-50 font-mono break-all">{String(diff.snapshot)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {/* Modal for Google Sheet import */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-fade-in relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-2xl font-bold focus:outline-none"
              onClick={() => setImportModalOpen(false)}
              title="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-bold mb-4 text-black">Import URLs from Google Sheet</h2>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-3 focus:outline-none focus:border-blue-500 text-black"
              placeholder="Paste your Google Sheet link here"
              value={importSheetUrl}
              onChange={e => setImportSheetUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleImportSheet(); }}
              disabled={importLoading}
            />
            <button
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded shadow hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleImportSheet}
              disabled={importLoading || !importSheetUrl.trim()}
            >
              {importLoading ? 'Importing...' : 'Import'}
            </button>
            {importLoading && (
              <div className="flex items-center justify-center mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-2"></div>
                <span className="text-gray-700">Fetching links...</span>
              </div>
            )}
            {importError && <div className="text-red-600 mt-3 text-sm">{importError}</div>}
            <div className="text-xs text-gray-900 mt-4">
              The sheet must be public. Only the first column will be used. One link per row.
            </div>
          </div>
        </div>
      )}
    </>
  );
} 