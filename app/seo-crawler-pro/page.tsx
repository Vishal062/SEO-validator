"use client";
import React, { useState, useRef } from "react";
import axios from "axios";

const POLL_INTERVAL = 1000; // 1 second for faster updates

interface CrawlStats {
  totalFound: number;
  totalProcessed: number;
  startTime: string;
  lastUpdate: string;
  averageTimePerPage: number;
  pagesPerSecond: number;
}

interface PerformanceMetrics {
  batchSize: number;
  processed: number;
  failed: number;
  newLinksFound: number;
  timePerPage: number;
  pagesPerSecond: number;
}

const SeoCrawlerPro = () => {
  const [domain, setDomain] = useState("");
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState<CrawlStats | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [config, setConfig] = useState({
    maxPages: 100,
    concurrency: 5
  });
  const pollTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPages([]);
    setError("");
    setLoading(true);
    setDone(false);
    setStats(null);
    setPerformance(null);
    if (pollTimeout.current) clearTimeout(pollTimeout.current);
    
    try {
      // Start crawl with performance configuration
      const res = await axios.post("/api/crawler/start", { 
        domain,
        maxPages: config.maxPages,
        concurrency: config.concurrency
      });
      const { id, estimatedTime } = res.data;
      if (!id) throw new Error("Failed to start crawl");
      
      console.log(`Estimated crawl time: ${estimatedTime} seconds`);
      // Start polling for progress
      pollProgress(id, []);
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError(err) 
        ? err.response?.data?.error || err.message 
        : (err as Error).message || "Failed to start crawl.";
      setError(errorMsg);
      setLoading(false);
    }
  };

  const pollProgress = async (id: string, currentPages: string[]) => {
    try {
      const res = await axios.get(`/api/crawler/progress?id=${encodeURIComponent(id)}`);
      const { batch, done: crawlDone, stats: crawlStats, performance: perfMetrics } = res.data;
      
      // Deduplicate
      const newPages = batch ? batch.filter((url: string) => !currentPages.includes(url)) : [];
      const allPages = [...currentPages, ...newPages];
      
      setPages(allPages);
      setDone(!!crawlDone);
      setStats(crawlStats || null);
      setPerformance(perfMetrics || null);
      
      if (!crawlDone) {
        pollTimeout.current = setTimeout(() => pollProgress(id, allPages), POLL_INTERVAL);
      } else {
        setLoading(false);
      }
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : (err as Error).message || "Failed to fetch crawl progress.";
      setError(errorMsg);
      setLoading(false);
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (pollTimeout.current) clearTimeout(pollTimeout.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getProgressPercentage = () => {
    if (!stats) return 0;
    return Math.min((stats.totalProcessed / config.maxPages) * 100, 100);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">🚀 SEO Crawler Pro</h1>
        <p className="text-blue-100">High-performance domain crawling with parallel processing</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domain URL
            </label>
            <input
              type="text"
              placeholder="Enter domain (e.g. example.com)"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Pages
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={config.maxPages}
                onChange={e => setConfig(prev => ({ ...prev, maxPages: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concurrency (Browser Instances)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.concurrency}
                onChange={e => setConfig(prev => ({ ...prev, concurrency: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {done ? "Crawl Complete!" : "Crawling..."}
              </div>
            ) : (
              "🚀 Start High-Performance Crawl"
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Performance Metrics */}
      {stats && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">📊 Performance Metrics</h2>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{stats.totalProcessed} / {config.maxPages} pages</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalProcessed}</div>
              <div className="text-sm text-gray-600">Pages Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalFound}</div>
              <div className="text-sm text-gray-600">Total Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.pagesPerSecond.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Pages/Second</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatTime(stats.averageTimePerPage / 1000)}
              </div>
              <div className="text-sm text-gray-600">Avg Time/Page</div>
            </div>
          </div>

          {performance && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Last Batch Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Batch Size:</span>
                  <span className="ml-2 font-semibold">{performance.batchSize}</span>
                </div>
                <div>
                  <span className="text-gray-600">Processed:</span>
                  <span className="ml-2 font-semibold text-green-600">{performance.processed}</span>
                </div>
                <div>
                  <span className="text-gray-600">Failed:</span>
                  <span className="ml-2 font-semibold text-red-600">{performance.failed}</span>
                </div>
                <div>
                  <span className="text-gray-600">New Links:</span>
                  <span className="ml-2 font-semibold text-blue-600">{performance.newLinksFound}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {pages.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            📄 Pages Found ({pages.length})
          </h2>
          <div className="max-h-96 overflow-y-auto">
            <div className="grid gap-2">
              {pages.map((url, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-500 text-sm mr-3">#{idx + 1}</span>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-800 underline flex-1 truncate"
                  >
                    {url}
                  </a>
                  <span className="text-xs text-gray-400 ml-2">
                    {new URL(url).pathname || '/'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && !done && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-600">Crawling in progress...</div>
          <div className="text-sm text-gray-500 mt-1">
            Processing {config.concurrency} pages simultaneously
          </div>
        </div>
      )}

      {done && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center">
          ✅ Crawling complete! Found {pages.length} pages in {stats ? formatTime((Date.now() - new Date(stats.startTime).getTime()) / 1000) : 'unknown time'}.
        </div>
      )}
    </div>
  );
};

export default SeoCrawlerPro; 