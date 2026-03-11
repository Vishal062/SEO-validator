import { useState, useEffect } from 'react';
import React from 'react';

type Props = {
  data: unknown;
};

const TABS = [
  'Overview',
  'Headings',
  'Links',
  // 'Images',
  'Schema',
  'Social',
  'Analytics', // <-- add Analytics tab
  // 'Advanced',
];

// Modular OverviewFields component
function OverviewFields({ data }: { data: Record<string, unknown> }) {
  function getBadge(value: string | undefined, label: string, type: 'text' | 'url' | 'tag' = 'text') {
    if (!value) {
      return <span className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold">Missing</span>;
    }
    if (type === 'text') {
      return <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">✓ {value.length} characters</span>;
    }
    if (type === 'url') {
      return <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">Indexable</span>;
    }
    if (type === 'tag') {
      return <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">{value}</span>;
    }
    return null;
  }
  return (
    <div className="w-full overflow-x-auto">
      <div className="space-y-4 min-w-0">
        {/* Title */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <span className="text-xl flex-shrink-0">📝</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-blue-900 flex items-center gap-1">Title <span className="text-gray-400 text-xs cursor-help">?</span></div>
            <div className="text-gray-900 text-base break-words">{data.title != null && data.title !== '' ? String(data.title) : <span className="text-red-600 font-semibold">Missing</span>}</div>
          </div>
          <div className="flex-shrink-0">
            {getBadge(data.title as string | undefined, 'Title', 'text')}
          </div>
        </div>
        {/* Description */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <span className="text-xl flex-shrink-0">💬</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-green-900 flex items-center gap-1">Description <span className="text-gray-400 text-xs cursor-help">?</span></div>
            <div className="text-gray-900 text-base break-words">{data.description != null && data.description !== '' ? String(data.description) : <span className="text-red-600 font-semibold">Missing</span>}</div>
          </div>
          <div className="flex-shrink-0">
            {getBadge(data.description as string | undefined, 'Description', 'text')}
          </div>
        </div>
        {/* URL */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <span className="text-xl flex-shrink-0">🔗</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-purple-900 flex items-center gap-1">URL <span className="text-gray-400 text-xs cursor-help">?</span></div>
            <div className="text-gray-900 text-base break-words">{data.url != null && data.url !== '' ? String(data.url) : <span className="text-red-600 font-semibold">Missing</span>}</div>
          </div>
          <div className="flex-shrink-0">
            {getBadge(data.url as string | undefined, 'URL', 'url')}
          </div>
        </div>
        {/* Canonical */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <span className="text-xl flex-shrink-0">📍</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-orange-900 flex items-center gap-1">Canonical <span className="text-gray-400 text-xs cursor-help">?</span></div>
            <div className="text-gray-900 text-base break-words">{data.canonical != null && data.canonical !== '' ? String(data.canonical) : <span className="text-red-600 font-semibold">Missing</span>}</div>
          </div>
          <div className="flex-shrink-0">
            {getBadge(data.canonical as string | undefined, 'Canonical', 'url')}
          </div>
        </div>
        {/* Robots Tag */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <span className="text-xl flex-shrink-0">🏷️</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-pink-900 flex items-center gap-1">Robots Tag <span className="text-gray-400 text-xs cursor-help">?</span></div>
            <div className="text-gray-900 text-base break-words">{data.robotsTag != null && data.robotsTag !== '' ? String(data.robotsTag) : <span className="text-red-600 font-semibold">Missing</span>}</div>
          </div>
          <div className="flex-shrink-0">
            {getBadge(data.robotsTag as string | undefined, 'Robots Tag', data.robotsTag ? 'tag' : 'text')}
          </div>
        </div>
        {/* X-Robots-Tag */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <span className="text-xl flex-shrink-0">🏷️</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-pink-900 flex items-center gap-1">X-Robots-Tag <span className="text-gray-400 text-xs cursor-help">?</span></div>
            <div className="text-gray-900 text-base break-words">{data.xRobotsTag != null && data.xRobotsTag !== '' ? String(data.xRobotsTag) : <span className="text-red-600 font-semibold">Missing</span>}</div>
          </div>
          <div className="flex-shrink-0">
            {getBadge(data.xRobotsTag as string | undefined, 'X-Robots-Tag', data.xRobotsTag ? 'tag' : 'text')}
          </div>
        </div>
      </div>
    </div>
  );
}

// Modular HeadingsList component
function HeadingsList({ headings }: { headings: { level: string, text: string }[] }) {
  const [copied, setCopied] = useState(false);
  const copyHeadings = () => {
    const text = headings.map(h => `<${h.level.toUpperCase()}> ${h.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  const badgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'h1': return 'bg-blue-100 text-blue-700';
      case 'h2': return 'bg-purple-100 text-purple-700';
      case 'h3': return 'bg-green-100 text-green-700';
      case 'h4': return 'bg-pink-100 text-pink-700';
      case 'h5': return 'bg-yellow-100 text-yellow-700';
      case 'h6': return 'bg-gray-200 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  return (
    <div className="w-full overflow-x-auto">
      <div className="space-y-4 min-w-0">
        <div className="flex justify-end mb-2">
          <button onClick={copyHeadings} className="flex items-center gap-1 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold">
            <span>📋</span> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        {headings && headings.length > 0 ? headings.map((h, idx) => (
          <div key={h.level + '-' + h.text + '-' + idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className={`px-2 py-1 rounded font-mono text-xs font-bold flex-shrink-0 ${badgeColor(h.level)}`}>{`<${h.level.toUpperCase()}>`}</span>
            <span className="text-base text-gray-900 break-words min-w-0 flex-1">{h.text}</span>
          </div>
        )) : <div className="text-red-600 font-semibold">No headings found.</div>}
      </div>
    </div>
  );
}

// Modular LinksList component
function LinksList({ links }: { links: { href?: string, anchor: string }[] }) {
  const [copied, setCopied] = useState(false);
  const copyLinks = () => {
    const text = links.map(l => `${l.href || 'Undefined (No href attribute)'} | ${l.anchor}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="w-full overflow-x-auto">
      <div className="space-y-6 min-w-0">
        <div className="flex justify-end mb-2">
          <button onClick={copyLinks} className="flex items-center gap-1 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold">
            <span>📋</span> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        {links && links.length > 0 ? links.map((l, idx) => (
          <div key={(l.href || '') + '-' + l.anchor + '-' + idx} className="space-y-1">
            <div className={l.href ? "font-bold text-black break-all whitespace-pre-line" : "font-bold text-red-600 break-all whitespace-pre-line"}>
              {l.href || 'Undefined (No href attribute)'}
            </div>
            <div className="text-base text-black break-all whitespace-pre-line">
              <span className="font-bold">Anchor:</span> {l.anchor || <span className="text-red-600 font-semibold">Missing Anchor</span>}
            </div>
          </div>
        )) : <div className="text-red-600 font-semibold">No links found.</div>}
      </div>
    </div>
  );
}

// Modular SchemaTable component
function SchemaTable({ schema }: { schema: unknown[] }) {
  // Recursively render schema as table rows
  function renderRows(obj: unknown, depth = 0): React.ReactNode {
    if (Array.isArray(obj)) {
      return obj.map((item, index) => (
        <React.Fragment key={index}>
          {typeof item === 'string' ? (
            <tr>
              <td className="py-1 pr-4 align-top text-gray-700 font-semibold" style={{ paddingLeft: `${depth * 24}px` }}>
                {index + 1}.
              </td>
              <td className="py-1 align-top text-gray-900">
                {item}
              </td>
            </tr>
          ) : (
            renderRows(item, depth)
          )}
        </React.Fragment>
      )).filter(Boolean);
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj as Record<string, unknown>).map(([key, value]) => (
        <React.Fragment key={key}>
          <tr>
            <td className={`py-1 pr-4 align-top ${key.startsWith('@') ? 'text-purple-600 font-bold' : 'text-gray-700 font-semibold'}`} style={{ paddingLeft: `${depth * 24}px` }}>
              {key}
            </td>
            <td className="py-1 align-top text-gray-900">
              {Array.isArray(value) ? (
                <div className="space-y-1">
                  {value.map((item, index) => (
                    <div key={index} className="text-sm">
                      {index + 1}. {String(item)}
                    </div>
                  ))}
                </div>
              ) : (typeof value === 'object' && value !== null ? null : String(value))}
            </td>
          </tr>
          {typeof value === 'object' && value !== null && !Array.isArray(value) ? renderRows(value, depth + 1) : null}
        </React.Fragment>
      )).filter(Boolean);
    }
    return null;
  }

  // Export schema as JSON
  const exportSchema = () => {
    const text = JSON.stringify(schema, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="bg-white rounded-xl p-4 md:p-6 shadow space-y-4 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-purple-700">Schema</span>
          </div>
          <button onClick={exportSchema} className="flex items-center gap-1 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold">
            <span>⬇️</span> Export Schema
          </button>
        </div>
        <div className="text-gray-500 text-sm mb-4">
          Schema is a form of microdata which helps add context for search engines regarding what a web page is about. You don&#39;t <span className="font-semibold">need</span> to have it, though it has <span className="font-semibold">many use cases</span>. It&#39;s usually fine if this tab is empty.
        </div>
        {schema && schema.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-y-1">
              <tbody>
                {schema.map((obj) => renderRows(obj, 0))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-400 italic">No schema found on this page.</div>
        )}
      </div>
    </div>
  );
}

// Modular SocialFields component
function SocialFields({ data }: { data: Record<string, unknown> }) {
  const og = (data.og || {}) as Record<string, unknown>;
  const twitter = (data.twitter || {}) as Record<string, unknown>;
  // Only show these keys, in this order
  const ogKeys = [
    'og:title',
    'og:description',
    'og:site_name',
    'og:url',
    'og:type',
    'og:image',
  ];
  const twitterKeys = [
    'twitter:card',
    'twitter:title',
    'twitter:description',
    'twitter:url',
    'twitter:site',
    'twitter:image',
  ];
  return (
    <div className="w-full overflow-x-auto">
      <div className="bg-white rounded-xl p-4 md:p-6 shadow space-y-8 min-w-0">
        {/* Open Graph Section */}
        <div>
          <div className="text-xl font-bold text-purple-500 mb-4">Open Graph (Facebook)</div>
          <div className="space-y-2">
            {ogKeys.map(key => (
              <div key={key}>
                <div className="text-purple-600 font-semibold text-sm">{key}</div>
                <div className={og[key] ? 'text-gray-900 break-words' : 'text-red-600 font-semibold'}>
                  {og[key] != null && og[key] !== '' ? String(og[key]) : 'Missing'}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Twitter Section */}
        <div>
          <div className="text-xl font-bold text-blue-500 mb-4">Twitter</div>
          <div className="space-y-2">
            {twitterKeys.map(key => (
              <div key={key}>
                <div className="text-blue-600 font-semibold text-sm">{key}</div>
                <div className={twitter[key] ? 'text-gray-900 break-words' : 'text-red-600 font-semibold'}>
                  {twitter[key] != null && twitter[key] !== '' ? String(twitter[key]) : 'Missing'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Syntax highlight a JSON object into HTML with VS-Code-style colors
function syntaxHighlight(obj: unknown): string {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span style="color:#9cdcfe">${match}</span>`; // key
        return `<span style="color:#ce9178">${match}</span>`; // string value
      }
      if (/true|false/.test(match)) return `<span style="color:#569cd6">${match}</span>`; // bool
      if (/null/.test(match)) return `<span style="color:#569cd6">${match}</span>`; // null
      return `<span style="color:#b5cea8">${match}</span>`; // number
    }
  );
}

// Analytics tab — event explorer UI matching the reference design
function AnalyticsTab({ dataLayer, dataLayerAsync }: { dataLayer: any[]; dataLayerAsync?: any[] }) {
  const [currentDataLayer, setCurrentDataLayer] = useState<any[]>(dataLayer || []);
  const [search, setSearch] = useState('');
  // Per-card view mode: 'flat' | 'json'
  const [viewMode, setViewMode] = useState<Record<number, 'flat' | 'json'>>({});
  const [copied, setCopied] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (dataLayerAsync && Array.isArray(dataLayerAsync) && dataLayerAsync.length > 0) {
      setCurrentDataLayer(dataLayerAsync);
    }
  }, [dataLayerAsync]);

  if (!currentDataLayer || !Array.isArray(currentDataLayer) || currentDataLayer.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <div className="text-4xl mb-3">📭</div>
        <div className="font-semibold">No dataLayer events found.</div>
        <div className="text-xs mt-1">This page may not have GTM / GA4 installed.</div>
      </div>
    );
  }

  // Filter events by search term
  const filtered = currentDataLayer
    .map((event, originalIdx) => ({ event, originalIdx }))
    .filter(({ event }) => {
      if (!search.trim()) return true;
      return JSON.stringify(event).toLowerCase().includes(search.toLowerCase());
    });

  const getEventName = (event: any): string =>
    event?.event || (event?.['gtm.start'] ? 'gtm.start' : Object.keys(event)[0] || 'unknown');

  const getMode = (idx: number): 'flat' | 'json' => viewMode[idx] ?? 'json';

  const handleCopy = (event: any, idx: number) => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(prev => ({ ...prev, [idx]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [idx]: false })), 1500);
  };

  return (
    <div className="w-full space-y-3">
      {/* ── Search bar ── */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
        </svg>
        <input
          type="text"
          placeholder="Find an event..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Event count badge ── */}
      <div className="text-xs text-gray-500">
        Showing <span className="font-semibold text-teal-600">{filtered.length}</span> of <span className="font-semibold">{currentDataLayer.length}</span> event{currentDataLayer.length !== 1 ? 's' : ''}
      </div>

      {/* ── Event cards ── */}
      <div className="space-y-3">
        {filtered.map(({ event, originalIdx }) => {
          const eventName = getEventName(event);
          const mode = getMode(originalIdx);
          const isCopied = copied[originalIdx];
          const displayNum = originalIdx + 1;

          return (
            <div
              key={originalIdx}
              className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {/* Card header — number badge + event name */}
              <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
                <span className="w-6 h-6 rounded bg-teal-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {displayNum}
                </span>
                <span className="font-semibold text-gray-800 text-sm tracking-tight">{eventName}</span>
              </div>

              {/* flat / json tab switcher */}
              <div className="flex items-center gap-0 px-4 bg-white border-b border-gray-100">
                {(['flat', 'json'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setViewMode(prev => ({ ...prev, [originalIdx]: m }))}
                    className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors duration-150 ${
                      mode === m
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Card content */}
              <div className="relative bg-[#1e1e1e] rounded-b-xl">
                {mode === 'json' ? (
                  <>
                    <pre
                      className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed p-4 pr-20 text-gray-200 max-h-72 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: syntaxHighlight(event) }}
                    />
                    <button
                      onClick={() => handleCopy(event, originalIdx)}
                      className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold rounded-lg transition-colors shadow-md"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {isCopied ? 'Copied!' : 'copy'}
                    </button>
                  </>
                ) : (
                  /* Flat view — key/value table */
                  <div className="p-4 max-h-72 overflow-y-auto">
                    <table className="w-full text-xs font-mono">
                      <tbody>
                        {Object.entries(event).map(([k, v]) => (
                          <tr key={k} className="border-b border-gray-700 last:border-0">
                            <td className="py-1.5 pr-4 font-semibold text-[#9cdcfe] align-top w-2/5 break-all">{k}</td>
                            <td className="py-1.5 align-top break-all">
                              {typeof v === 'number' ? (
                                <span style={{ color: '#b5cea8' }}>{String(v)}</span>
                              ) : typeof v === 'boolean' ? (
                                <span style={{ color: '#569cd6' }}>{String(v)}</span>
                              ) : v === null ? (
                                <span style={{ color: '#569cd6' }}>null</span>
                              ) : typeof v === 'object' ? (
                                <span style={{ color: '#ce9178' }}>{JSON.stringify(v)}</span>
                              ) : (
                                <span style={{ color: '#ce9178' }}>"{String(v)}"</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-gray-400 italic text-center py-8 text-sm">
            No events match &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}


export default function SeoResultBox({ data, dataLayerAsync }: Props & { dataLayerAsync?: any[] }) {
  const [tab, setTab] = useState('Overview');
  const safeData = (data || {}) as Record<string, unknown>;

  if ((safeData as { error?: string }).error) {
    return (
      <div className="p-6 bg-red-50 border border-red-300 rounded-2xl shadow-lg max-w-2xl mx-auto my-4 flex items-start gap-4">
        <div className="text-red-500 text-2xl mt-1">❌</div>
        <div>
          <h3 className="text-lg font-bold text-red-700 break-all">{(safeData as { url?: string }).url}</h3>
          <p className="mt-1 text-base text-red-600 font-semibold">Error: {(safeData as { error?: string }).error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-2xl shadow-lg space-y-6 text-xs md:text-sm w-full">
      {/* Tab Bar */}
      <div className="flex flex-wrap gap-2 border-b mb-4 pb-2 w-full">
        {TABS.map((t) => (
          <button
            key={t}
            className={`px-3 py-1 rounded-t font-medium focus:outline-none transition-colors duration-150 text-xs md:text-sm ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && <OverviewFields data={safeData} />}
      {tab === 'Headings' && <HeadingsList headings={Array.isArray(safeData.headings) ? safeData.headings as { level: string, text: string }[] : []} />}
      {tab === 'Links' && <LinksList links={Array.isArray(safeData.links) ? safeData.links as { href?: string, anchor: string }[] : []} />}
      {tab === 'Schema' && <SchemaTable schema={Array.isArray(safeData.schema) ? safeData.schema : []} />}
      {tab === 'Social' && <SocialFields data={safeData} />}
      {tab === 'Analytics' && <AnalyticsTab dataLayer={safeData.dataLayer as any[]} dataLayerAsync={dataLayerAsync} />}
      {tab !== 'Overview' && tab !== 'Headings' && tab !== 'Links' && tab !== 'Schema' && tab !== 'Social' && tab !== 'Analytics' && (
        <div className="text-gray-400 italic">No data for this tab yet.</div>
      )}
    </div>
  );
}