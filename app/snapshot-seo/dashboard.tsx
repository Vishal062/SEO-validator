import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

export default function SnapshotSeoDashboard() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url') || '';
  const scope = searchParams.get('scope') || 'link';
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-white/80 shadow border-b border-indigo-100">
        <div className="font-bold text-xl text-indigo-700">SnapshotSEO Pro</div>
        <div className="flex gap-3 items-center">
          <button className="px-4 py-2 bg-gradient-to-r from-purple-400 to-indigo-500 text-white rounded-lg font-bold shadow hover:from-purple-500 hover:to-indigo-600 transition-all duration-200">Sync Now</button>
          <button className="px-4 py-2 bg-gradient-to-r from-amber-400 to-red-500 text-white rounded-lg font-bold shadow hover:from-amber-500 hover:to-red-600 transition-all duration-200" onClick={() => router.push('/snapshot-seo')}>Close Session</button>
        </div>
      </header>
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gradient-to-br from-indigo-100 to-purple-50 border-r border-indigo-200 shadow-lg flex flex-col p-6">
          <div className="font-bold text-lg text-indigo-700 mb-6 truncate" title={url}>{url}</div>
          <nav className="flex flex-col gap-3">
            <button className="text-left px-3 py-2 rounded-lg font-semibold text-indigo-700 bg-white/80 hover:bg-indigo-200 transition-all">Compare</button>
            <button className="text-left px-3 py-2 rounded-lg font-semibold text-indigo-700 bg-white/80 hover:bg-indigo-200 transition-all">Snapshots</button>
            <button className="text-left px-3 py-2 rounded-lg font-semibold text-indigo-700 bg-white/80 hover:bg-indigo-200 transition-all">SEO Analysis</button>
            {/* Add more sections as needed */}
          </nav>
        </aside>
        {/* Main Content */}
        <main className="flex-1 p-10 flex flex-col items-center justify-center">
          <div className="bg-white/90 rounded-2xl shadow-lg p-8 w-full max-w-2xl flex flex-col items-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Working on: <span className="text-indigo-700">{scope === 'link' ? 'This Link' : 'Entire Website'}</span></h2>
            <div className="text-gray-700 mb-2">{url}</div>
            <div className="mt-6 text-gray-500">Select a section from the sidebar to get started.</div>
          </div>
        </main>
      </div>
    </div>
  );
}
