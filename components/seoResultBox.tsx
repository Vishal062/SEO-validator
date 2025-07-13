import { useState } from 'react';
import React from 'react';

type Props = {
  data: any;
};

const TABS = [
  'Overview',
  'Headings',
  'Links',
  // 'Images',
  'Schema',
  'Social',
  // 'Advanced',
];

function getBadge(value: any, label: string, type: 'text' | 'url' | 'tag' = 'text') {
  if (!value) {
    return <span className="ml-2 px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold">Missing</span>;
  }
  if (type === 'text') {
    return <span className="ml-2 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">✓ {value.length} characters</span>;
  }
  if (type === 'url') {
    return <span className="ml-2 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">Indexable</span>;
  }
  if (type === 'tag') {
    return <span className="ml-2 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">{value}</span>;
  }
  return null;
}

// Modular OverviewFields component
function OverviewFields({ data }: { data: any }) {
  function getBadge(value: any, label: string, type: 'text' | 'url' | 'tag' = 'text') {
    if (!value) {
      return <span className="ml-2 px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold">Missing</span>;
    }
    if (type === 'text') {
      return <span className="ml-2 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">✓ {value.length} characters</span>;
    }
    if (type === 'url') {
      return <span className="ml-2 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">Indexable</span>;
    }
    if (type === 'tag') {
      return <span className="ml-2 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">{value}</span>;
    }
    return null;
  }
  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <span className="text-xl">📝</span>
        <div className="flex-1">
          <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1">Title <span className="text-gray-400 dark:text-gray-500 text-xs cursor-help">?</span></div>
          <div className="text-gray-900 dark:text-gray-100 text-base">{data.title || <span className="text-red-600 dark:text-red-400 font-semibold">Missing</span>}</div>
        </div>
        {getBadge(data.title, 'Title', 'text')}
      </div>
      {/* Description */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <span className="text-xl">💬</span>
        <div className="flex-1">
          <div className="font-bold text-green-900 dark:text-green-300 flex items-center gap-1">Description <span className="text-gray-400 dark:text-gray-500 text-xs cursor-help">?</span></div>
          <div className="text-gray-900 dark:text-gray-100 text-base">{data.description || <span className="text-red-600 dark:text-red-400 font-semibold">Missing</span>}</div>
        </div>
        {getBadge(data.description, 'Description', 'text')}
      </div>
      {/* URL */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <span className="text-xl">🔗</span>
        <div className="flex-1">
          <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1">URL <span className="text-gray-400 dark:text-gray-500 text-xs cursor-help">?</span></div>
          <div className="text-gray-900 dark:text-gray-100 text-base">{data.url || <span className="text-red-600 dark:text-red-400 font-semibold">Missing</span>}</div>
        </div>
        {getBadge(data.url, 'URL', 'url')}
      </div>
      {/* Canonical */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <span className="text-xl">📍</span>
        <div className="flex-1">
          <div className="font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1">Canonical <span className="text-gray-400 dark:text-gray-500 text-xs cursor-help">?</span></div>
          <div className="text-gray-900 dark:text-gray-100 text-base">{data.canonical || <span className="text-red-600 dark:text-red-400 font-semibold">Missing</span>}</div>
        </div>
        {getBadge(data.canonical, 'Canonical', 'url')}
      </div>
      {/* Robots Tag */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <span className="text-xl">🏷️</span>
        <div className="flex-1">
          <div className="font-bold text-pink-900 dark:text-pink-300 flex items-center gap-1">Robots Tag <span className="text-gray-400 dark:text-gray-500 text-xs cursor-help">?</span></div>
          <div className="text-gray-900 dark:text-gray-100 text-base">{data.robotsTag || <span className="text-red-600 dark:text-red-400 font-semibold">Missing</span>}</div>
        </div>
        {getBadge(data.robotsTag, 'Robots Tag', data.robotsTag ? 'tag' : 'text')}
      </div>
      {/* X-Robots-Tag */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <span className="text-xl">🏷️</span>
        <div className="flex-1">
          <div className="font-bold text-pink-900 dark:text-pink-300 flex items-center gap-1">X-Robots-Tag <span className="text-gray-400 dark:text-gray-500 text-xs cursor-help">?</span></div>
          <div className="text-gray-900 dark:text-gray-100 text-base">{data.xRobotsTag || <span className="text-red-600 dark:text-red-400 font-semibold">Missing</span>}</div>
        </div>
        {getBadge(data.xRobotsTag, 'X-Robots-Tag', data.xRobotsTag ? 'tag' : 'text')}
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
      case 'h1': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'h2': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'h3': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'h4': return 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300';
      case 'h5': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'h6': return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <button onClick={copyHeadings} className="flex items-center gap-1 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-semibold">
          <span>📋</span> {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {headings && headings.length > 0 ? headings.map((h, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className={`px-2 py-1 rounded font-mono text-xs font-bold ${badgeColor(h.level)}`}>{`<${h.level.toUpperCase()}>`}</span>
          <span className="text-base text-gray-900 dark:text-gray-100">{h.text}</span>
        </div>
      )) : <div className="text-red-600 dark:text-red-400 font-semibold">No headings found.</div>}
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
    <div className="space-y-6">
      <div className="flex justify-end mb-2">
        <button onClick={copyLinks} className="flex items-center gap-1 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-semibold">
          <span>📋</span> {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {links && links.length > 0 ? links.map((l, i) => (
        <div key={i} className="space-y-1">
          <div className={l.href ? "font-bold text-black dark:text-white break-all" : "font-bold text-red-600 dark:text-red-400 break-all"}>
            {l.href || 'Undefined (No href attribute)'}
          </div>
          <div className="text-base text-black dark:text-white">
            <span className="font-bold">Anchor:</span> {l.anchor || <span className="text-red-600 dark:text-red-400 font-semibold">Missing Anchor</span>}
          </div>
        </div>
      )) : <div className="text-red-600 dark:text-red-400 font-semibold">No links found.</div>}
    </div>
  );
}

// Modular SchemaTable component
function SchemaTable({ schema }: { schema: any[] }) {
  // Recursively render schema as table rows
  function renderRows(obj: any, depth = 0): React.ReactNode {
    if (Array.isArray(obj)) {
      return obj.map((item, idx) => renderRows(item, depth + 1));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj).map(([key, value], idx): React.ReactNode => (
        <React.Fragment key={key + idx}>
          <tr>
            <td className={`py-1 pr-4 align-top ${key.startsWith('@') ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-gray-700 dark:text-gray-300 font-semibold'}`} style={{ paddingLeft: `${depth * 24}px` }}>
              {key}
            </td>
            <td className="py-1 align-top text-gray-900 dark:text-gray-100">
              {typeof value === 'object' && value !== null ? '' + (Array.isArray(value) ? '' : '') : String(value)}
            </td>
          </tr>
          {typeof value === 'object' && value !== null ? renderRows(value, depth + 1) : null}
        </React.Fragment>
      ));
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-purple-700 dark:text-purple-400">Schema</span>
        </div>
        <button onClick={exportSchema} className="flex items-center gap-1 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-semibold">
          <span>⬇️</span> Export Schema
        </button>
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-sm mb-4">
        Schema is a form of microdata which helps add context for search engines regarding what a web page is about. You don't <span className="font-semibold">need</span> to have it, though it has <span className="font-semibold">many use cases</span>. It's usually fine if this tab is empty.
      </div>
      {schema && schema.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-y-1">
            <tbody>
              {schema.map((obj, i) => renderRows(obj, 0))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-gray-400 dark:text-gray-500 italic">No schema found on this page.</div>
      )}
    </div>
  );
}

// Modular SocialFields component
function SocialFields({ data }: { data: any }) {
  const og = data.og || {};
  const twitter = data.twitter || {};
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow space-y-8">
      {/* Open Graph Section */}
      <div>
        <div className="text-xl font-bold text-purple-500 dark:text-purple-400 mb-4">Open Graph (Facebook)</div>
        <div className="space-y-2">
          {ogKeys.map(key => (
            <div key={key}>
              <div className="text-purple-600 dark:text-purple-400 font-semibold text-sm">{key}</div>
              <div className={og[key] ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400 font-semibold'}>
                {og[key] || 'Missing'}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Twitter Section */}
      <div>
        <div className="text-xl font-bold text-blue-500 dark:text-blue-400 mb-4">Twitter</div>
        <div className="space-y-2">
          {twitterKeys.map(key => (
            <div key={key}>
              <div className="text-blue-600 dark:text-blue-400 font-semibold text-sm">{key}</div>
              <div className={twitter[key] ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400 font-semibold'}>
                {twitter[key] || 'Missing'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SeoResultBox({ data }: Props) {
  const [tab, setTab] = useState('Overview');

  if (data.error) {
    return (
      <div className="p-4 border rounded bg-red-100 dark:bg-red-900/30 dark:border-red-700">
        <h3 className="text-lg font-semibold dark:text-red-200">{data.url}</h3>
        <p className="dark:text-red-300">Error: {data.error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-2xl mx-auto space-y-6">
      {/* Tab Bar */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-4 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            className={`px-4 py-1 rounded-t font-medium focus:outline-none transition-colors duration-150 ${tab === t ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && <OverviewFields data={data} />}
      {tab === 'Headings' && <HeadingsList headings={data.headings || []} />}
      {tab === 'Links' && <LinksList links={data.links || []} />}
      {tab === 'Schema' && <SchemaTable schema={data.schema || []} />}
      {tab === 'Social' && <SocialFields data={data} />}
      {tab !== 'Overview' && tab !== 'Headings' && tab !== 'Links' && tab !== 'Schema' && tab !== 'Social' && (
        <div className="text-gray-400 dark:text-gray-500 italic">No data for this tab yet.</div>
      )}
    </div>
  );
}