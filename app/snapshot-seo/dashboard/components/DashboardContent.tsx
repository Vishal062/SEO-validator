"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';

// Type definitions
type Section = 'overview' | 'compare' | 'snapshots' | 'seo-analysis';

export function SnapshotSeoDashboard() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url') || '';
  const scope = searchParams.get('scope') || 'link';
  const router = useRouter();

  // States
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showUrlListModal, setShowUrlListModal] = useState(false);
  const [urlsByCategory, setUrlsByCategory] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load URLs when component mounts
  useEffect(() => {
    const loadUrls = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/load-urls');
        const data = await response.json();
        
        if (data.urls) {
          // Categorize URLs
          const categories: Record<string, string[]> = {
            'Insurance Products': data.urls.filter((u: string) => 
              u.includes('insurance') || u.includes('product')),
            'Support & Contact': data.urls.filter((u: string) => 
              u.includes('contact') || u.includes('help') || u.includes('support')),
            'Legal & Documents': data.urls.filter((u: string) => 
              u.includes('policy') || u.includes('terms') || u.includes('disclaimer')),
            'Information': data.urls.filter((u: string) => 
              u.includes('about') || u.includes('blog')),
            'Resources': data.urls.filter((u: string) => 
              u.includes('download') || u.includes('guide'))
          };
          
          // Add uncategorized URLs to "Other"
          const categorizedUrls = Object.values(categories).flat();
          categories['Other'] = data.urls.filter((u: string) => 
            !categorizedUrls.includes(u));
          
          setUrlsByCategory(categories);
        }
      } catch (error) {
        console.error('Failed to load URLs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUrls();
  }, []);

  // Handlers
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setShowUrlListModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-white/80 shadow border-b border-indigo-100">
        <div className="font-bold text-xl text-indigo-700">SnapshotSEO Pro</div>
        <div className="flex gap-3 items-center">
          <button className="px-4 py-2 bg-gradient-to-r from-purple-400 to-indigo-500 text-white rounded-lg font-bold shadow hover:from-purple-500 hover:to-indigo-600 transition-all duration-200">
            Sync Now
          </button>
          <button 
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-red-500 text-white rounded-lg font-bold shadow hover:from-amber-500 hover:to-red-600 transition-all duration-200" 
            onClick={() => router.push('/snapshot-seo')}
          >
            Close Session
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gradient-to-br from-indigo-100 to-purple-50 border-r border-indigo-200 shadow-lg flex flex-col p-6">
          <div className="font-bold text-lg text-indigo-700 mb-6 truncate" title={url}>{url}</div>
          <nav className="flex flex-col gap-3">
            <button 
              onClick={() => setActiveSection('overview')}
              className={`text-left px-3 py-2 rounded-lg font-semibold text-indigo-700 ${
                activeSection === 'overview' ? 'bg-indigo-200' : 'bg-white/80 hover:bg-indigo-200'
              } transition-all flex items-center gap-2`}
            >
              <span>📊</span>Overview
            </button>
            <button 
              onClick={() => setActiveSection('compare')}
              className={`text-left px-3 py-2 rounded-lg font-semibold text-indigo-700 ${
                activeSection === 'compare' ? 'bg-indigo-200' : 'bg-white/80 hover:bg-indigo-200'
              } transition-all flex items-center gap-2`}
            >
              <span>🔄</span>Compare
            </button>
            <button 
              onClick={() => setActiveSection('snapshots')}
              className={`text-left px-3 py-2 rounded-lg font-semibold text-indigo-700 ${
                activeSection === 'snapshots' ? 'bg-indigo-200' : 'bg-white/80 hover:bg-indigo-200'
              } transition-all flex items-center gap-2`}
            >
              <span>📸</span>Snapshots
            </button>
            <button 
              onClick={() => setActiveSection('seo-analysis')}
              className={`text-left px-3 py-2 rounded-lg font-semibold text-indigo-700 ${
                activeSection === 'seo-analysis' ? 'bg-indigo-200' : 'bg-white/80 hover:bg-indigo-200'
              } transition-all flex items-center gap-2`}
            >
              <span>🔍</span>SEO Analysis
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-10">
          {activeSection === 'overview' ? (
            <div className="space-y-6">
              <div className="bg-white/90 rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Website Overview</h2>
                <div className="text-gray-700 mb-4">
                  <div className="font-semibold">Working on:</div>
                  <div className="text-indigo-700">{scope === 'link' ? 'Single URL' : 'Entire Website'}</div>
                  <div className="text-sm mt-1">{url}</div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-700">Loading categories...</span>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
                    {Object.entries(urlsByCategory).map(([category, urls]) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all text-left"
                      >
                        <h3 className="text-lg font-semibold text-indigo-700 mb-3">{category}</h3>
                        <div className="text-3xl font-bold text-indigo-900 mb-2">{urls.length}</div>
                        <div className="text-sm text-gray-600">URLs found</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white/90 rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
                <div className="text-sm text-gray-500">
                  Last scan: {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/90 rounded-2xl shadow-lg p-8 w-full max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {activeSection === 'compare' ? 'Compare Snapshots' :
                 activeSection === 'snapshots' ? 'Snapshot History' : 'SEO Analysis'}
              </h2>
              <div className="text-gray-500">This section is coming soon...</div>
            </div>
          )}
        </main>
      </div>

      {/* URL List Modal */}
      {showUrlListModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full m-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-indigo-700">{selectedCategory}</h3>
              <button 
                onClick={() => setShowUrlListModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <div className="space-y-2">
                {urlsByCategory[selectedCategory]?.map((urlItem, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg hover:from-indigo-100 hover:to-purple-100 transition-all"
                  >
                    <div className="font-medium text-indigo-900">{urlItem}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
