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
      return obj.map((item) => renderRows(item, depth + 1)).filter(Boolean);
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj as Record<string, unknown>).map(([key, value]) => (
        <React.Fragment key={key}>
          <tr>
            <td className={`py-1 pr-4 align-top ${key.startsWith('@') ? 'text-purple-600 font-bold' : 'text-gray-700 font-semibold'}`} style={{ paddingLeft: `${depth * 24}px` }}>
              {key}
            </td>
            <td className="py-1 align-top text-gray-900">
              {typeof value === 'object' && value !== null ? null : String(value)}
            </td>
          </tr>
          {typeof value === 'object' && value !== null ? renderRows(value, depth + 1) : null}
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

// Add Analytics tab content
function AnalyticsTab({ dataLayer, dataLayerAsync }: { dataLayer: any[]; dataLayerAsync?: any[] }) {
  const [currentDataLayer, setCurrentDataLayer] = useState<any[]>(dataLayer || []);
  useEffect(() => {
    if (dataLayerAsync && Array.isArray(dataLayerAsync) && dataLayerAsync.length > 0) {
      setCurrentDataLayer(dataLayerAsync);
    }
  }, [dataLayerAsync]);
  if (!currentDataLayer || !Array.isArray(currentDataLayer) || currentDataLayer.length === 0) {
    return <div className="text-gray-500">No dataLayer values found.</div>;
  }
  return (
    <div className="w-full overflow-x-auto">
      <pre className="bg-gray-50 rounded-lg p-4 text-xs text-black whitespace-pre-wrap max-h-96 overflow-y-auto">
        {JSON.stringify(currentDataLayer, null, 2)}
      </pre>
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