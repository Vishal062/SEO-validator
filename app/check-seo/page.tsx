'use client';
import { useState, useRef, useEffect } from 'react';
import SeoResultBox from '@/components/seoResultBox';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setResults } from '../seoSlice';
import type { RootState } from '../store';

export default function CheckSeoPage() {
  const [urls, setUrls] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [showScrollIndicators, setShowScrollIndicators] = useState(false);
  const [error, setError] = useState("");
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Use Redux for results
  const results = useSelector((state: RootState) => (state as RootState).seo.results);
  const dispatch = useDispatch();

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

  const handleChange = (index: number, value: string) => {
    const updated = [...urls];
    updated[index] = value;
    setUrls(updated);
    setError(""); // Clear error on change
  };

  const addField = () => {
    setUrls([...urls, ""]);
    setError("");
  };

  const deleteField = (index: number) => {
    if (urls.length === 1) return;
    const updated = urls.filter((_, i) => i !== index);
    setUrls(updated);
    setError("");
  };

  const hasValidUrl = urls.length > 0 && urls.every((url) => url.trim() !== "");

  // Simple URL validation function
  function isValidUrl(url: string) {
    try {
      new URL(url);
      return true;
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Failed:", err);
      }
    } finally {
      setLoading(false);
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Enter URLs</h2>
            {urls.map((url, i) => (
              <div key={i} className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-2">
                <div className="w-full relative">
                  <input
                    value={url}
                    onChange={(e) => handleChange(i, e.target.value)}
                    placeholder="https://example.com"
                    className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none bg-white/80 backdrop-blur-sm text-black placeholder-black"
                  />
                </div>
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteField(i)}
                    className="group relative p-2 rounded-full hover:bg-red-100 transition self-start md:self-center"
                    title="Delete this URL"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="absolute left-1/2 -translate-x-1/2 top-8 z-10 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none transition-opacity whitespace-nowrap">Delete this URL</span>
                  </button>
                )}
              </div>
            ))}
            <div className="flex gap-3 items-center">
              <button
                onClick={fetchSEO}
                disabled={!hasValidUrl || loading}
                className={`px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Check SEO
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
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">SEO Results</h2>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-700">Analyzing SEO...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 text-center text-gray-400 text-base md:text-lg border border-dashed border-gray-300">
                Your SEO results will show up here once you submit the URLs.
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
                    {results.map((r: unknown, i: number) => <SeoResultBox key={i} data={r} />)}
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
    </>
  );
} 