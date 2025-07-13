import { useState } from 'react';
import React from 'react';

interface CompareSeoResultBoxProps {
  uat: any;
  prod: any;
}

const TABS = [
  'Overview',
  'Headings',
  'Links',
  'Schema',
  'Social',
];

function Tag({ label, color }: { label: string; color: string }) {
  return <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${color}`}>{label}</span>;
}

// --- SchemaTable and SocialFields copied from SeoResultBox for reuse ---
function SchemaTable({ schema }: { schema: any[] }) {
  function renderRows(obj: any, depth = 0): React.ReactNode {
    if (Array.isArray(obj)) {
      return obj.map((item, idx) => renderRows(item, depth + 1));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj).map(([key, value], idx): React.ReactNode => (
        <React.Fragment key={key + idx}>
          <tr>
            <td className={`py-1 pr-4 align-top ${key.startsWith('@') ? 'text-purple-600 font-bold' : 'text-gray-700 font-semibold'} text-xs`} style={{ paddingLeft: `${depth * 16}px` }}>
              {key}
            </td>
            <td className="py-1 align-top text-gray-900 text-xs">
              {typeof value === 'object' && value !== null ? '' + (Array.isArray(value) ? '' : '') : String(value)}
            </td>
          </tr>
          {typeof value === 'object' && value !== null ? renderRows(value, depth + 1) : null}
        </React.Fragment>
      ));
    }
    return null;
  }

  return (
    <div className="overflow-x-auto">
      {schema && schema.length > 0 ? (
        <table className="w-full text-xs border-separate border-spacing-y-1">
          <tbody>
            {schema.map((obj, i) => renderRows(obj, 0))}
          </tbody>
        </table>
      ) : (
        <div className="text-gray-400 italic text-xs">No schema found on this page.</div>
      )}
    </div>
  );
}

function SocialFields({ data }: { data: any }) {
  const og = data.og || {};
  const twitter = data.twitter || {};
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
    <div className="bg-white rounded-xl p-6 shadow space-y-8">
      {/* Open Graph Section */}
      <div>
        <div className="text-xl font-bold text-purple-500 mb-4">Open Graph (Facebook)</div>
        <div className="space-y-2">
          {ogKeys.map(key => (
            <div key={key}>
              <div className="text-purple-600 font-semibold text-sm">{key}</div>
              <div className={og[key] ? 'text-gray-900' : 'text-red-600 font-semibold'}>
                {og[key] || 'Missing'}
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
              <div className={twitter[key] ? 'text-gray-900' : 'text-red-600 font-semibold'}>
                {twitter[key] || 'Missing'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CompareSeoResultBox({ uat, prod }: CompareSeoResultBoxProps) {
  const [tab, setTab] = useState('Overview');

  // Guard against undefined/null data
  if (!uat || !prod) {
    return null;
  }

  // Error handling
  if (uat.error || prod.error) {
    return (
      <div className="flex gap-4">
        {uat.error && (
          <div className="flex-1 p-6 bg-red-50 border border-red-300 rounded-2xl shadow-lg flex items-start gap-4">
            <div className="text-red-500 text-2xl mt-1">❌</div>
            <div>
              <h3 className="text-lg font-bold text-red-700 break-all">UAT</h3>
              <p className="mt-1 text-base text-red-600 font-semibold">Error: {uat.error}</p>
            </div>
          </div>
        )}
        {prod.error && (
          <div className="flex-1 p-6 bg-red-50 border border-red-300 rounded-2xl shadow-lg flex items-start gap-4">
            <div className="text-red-500 text-2xl mt-1">❌</div>
            <div>
              <h3 className="text-lg font-bold text-red-700 break-all">PROD</h3>
              <p className="mt-1 text-base text-red-600 font-semibold">Error: {prod.error}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Helper to render a field for both UAT and PROD
  function FieldRow({ label, uatValue, prodValue, icon, badgeUat, badgeProd }: any) {
    return (
      <div className="flex gap-4 mb-2">
        <div className="flex-1 flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <span className="text-xl">{icon}</span>
          <div className="flex-1">
            <div className="font-bold text-blue-900 flex items-center gap-1">{label} <Tag label="UAT" color="bg-purple-100 text-purple-700" /></div>
            <div className="text-gray-900 text-base break-words">{uatValue}</div>
          </div>
          {badgeUat}
        </div>
        <div className="flex-1 flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <span className="text-xl">{icon}</span>
          <div className="flex-1">
            <div className="font-bold text-blue-900 flex items-center gap-1">{label} <Tag label="PROD" color="bg-blue-100 text-blue-700" /></div>
            <div className="text-gray-900 text-base break-words">{prodValue}</div>
          </div>
          {badgeProd}
        </div>
      </div>
    );
  }

  // Helper for badges (reuse logic from SeoResultBox)
  function getBadge(value: any, label: string, type: 'text' | 'url' | 'tag' = 'text') {
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
      {tab === 'Overview' && (
        <div className="w-full overflow-x-auto">
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="font-bold text-purple-700 mb-2">UAT</div>
              {(() => {
                const fields = [
                  { key: 'title', label: 'Title', icon: '📝', type: 'text' },
                  { key: 'description', label: 'Description', icon: '💬', type: 'text' },
                  { key: 'url', label: 'URL', icon: '🔗', type: 'url' },
                  { key: 'canonical', label: 'Canonical', icon: '🔗', type: 'url' },
                  { key: 'robotsTag', label: 'Robots Tag', icon: '🏷️', type: 'tag' },
                  { key: 'xRobotsTag', label: 'X-Robots-Tag', icon: '🏷️', type: 'tag' },
                ];
                return fields.map(({ key, label, icon, type }) => {
                  const uVal = uat[key];
                  const pVal = prod[key];
                  const isMissing = !uVal;
                  const isDiff = uVal && pVal && uVal !== pVal;
                  return (
                    <div key={key} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <span className="text-xl">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-blue-900">{label}</div>
                        <div className={
                          isMissing ? "text-red-600 font-semibold text-base break-words" :
                          isDiff ? "text-orange-500 font-semibold text-base break-words" :
                          "text-gray-900 text-base break-words"
                        }>
                          {uVal || <span className="text-red-600 font-semibold">Missing</span>}
                        </div>
                      </div>
                      {getBadge(uVal, label, type as 'text' | 'url' | 'tag')}
                    </div>
                  );
                });
              })()}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="font-bold text-blue-700 mb-2">PROD</div>
              {(() => {
                const fields = [
                  { key: 'title', label: 'Title', icon: '📝', type: 'text' },
                  { key: 'description', label: 'Description', icon: '💬', type: 'text' },
                  { key: 'url', label: 'URL', icon: '🔗', type: 'url' },
                  { key: 'canonical', label: 'Canonical', icon: '🔗', type: 'url' },
                  { key: 'robotsTag', label: 'Robots Tag', icon: '🏷️', type: 'tag' },
                  { key: 'xRobotsTag', label: 'X-Robots-Tag', icon: '🏷️', type: 'tag' },
                ];
                return fields.map(({ key, label, icon, type }) => {
                  const uVal = uat[key];
                  const pVal = prod[key];
                  const isMissing = !pVal;
                  const isDiff = uVal && pVal && uVal !== pVal;
                  return (
                    <div key={key} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <span className="text-xl">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-blue-900">{label}</div>
                        <div className={
                          isMissing ? "text-red-600 font-semibold text-base break-words" :
                          isDiff ? "text-orange-500 font-semibold text-base break-words" :
                          "text-gray-900 text-base break-words"
                        }>
                          {pVal || <span className="text-red-600 font-semibold">Missing</span>}
                        </div>
                      </div>
                      {getBadge(pVal, label, type as 'text' | 'url' | 'tag')}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
      {tab === 'Headings' && (
        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <div className="flex-1 w-full space-y-2">
            <div className="font-bold text-purple-700 mb-2">UAT</div>
            {Array.from({ length: Math.max(uat.headings?.length || 0, prod.headings?.length || 0) }).map((_, i) => {
              const u = uat.headings?.[i];
              const p = prod.headings?.[i];
              const isMissing = !u;
              const isDiff = u && p && (u.text !== p.text || u.level !== p.level);
              return (
                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className={`px-2 py-1 rounded font-mono text-xs font-bold bg-blue-100 text-blue-700`}>{u ? `<${u.level.toUpperCase()}>` : '-'}</span>
                  <span className={isMissing ? 'text-red-600 font-semibold' : isDiff ? 'text-orange-500 font-semibold' : 'text-base text-gray-900 text-xs md:text-sm'}>{u ? u.text : 'Missing'}</span>
                </div>
              );
            })}
          </div>
          <div className="flex-1 w-full space-y-2">
            <div className="font-bold text-blue-700 mb-2">PROD</div>
            {Array.from({ length: Math.max(uat.headings?.length || 0, prod.headings?.length || 0) }).map((_, i) => {
              const u = uat.headings?.[i];
              const p = prod.headings?.[i];
              const isMissing = !p;
              const isDiff = u && p && (u.text !== p.text || u.level !== p.level);
              return (
                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className={`px-2 py-1 rounded font-mono text-xs font-bold bg-blue-100 text-blue-700`}>{p ? `<${p.level.toUpperCase()}>` : '-'}</span>
                  <span className={isMissing ? 'text-red-600 font-semibold' : isDiff ? 'text-orange-500 font-semibold' : 'text-base text-gray-900 text-xs md:text-sm'}>{p ? p.text : 'Missing'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {tab === 'Links' && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <div className="font-bold text-purple-700 mb-2">UAT</div>
            <div className="font-bold text-blue-700 mb-2">PROD</div>
          </div>
          {Array.from({ length: Math.max(uat.links?.length || 0, prod.links?.length || 0) }).map((_, idx) => {
            const u = uat.links?.[idx];
            const p = prod.links?.[idx];
            // Helper to get path/query only
            function getPath(url: string) {
              try {
                const u = new URL(url, 'http://dummy');
                return u.pathname + u.search;
              } catch {
                return url;
              }
            }
            const uPath = u && u.href ? getPath(u.href) : '';
            const pPath = p && p.href ? getPath(p.href) : '';
            const anchorMissing = !u?.anchor;
            const anchorDiff = u && p && u.anchor !== p.anchor;
            const pathMissing = !u?.href;
            const pathDiff = u && p && uPath !== pPath;
            return (
              <React.Fragment key={idx}>
                <div className="bg-gray-50 rounded-lg p-2 mb-1 border border-gray-200">
                  {u ? (
                    <>
                      <div className={pathMissing ? 'font-bold text-red-600 break-all whitespace-pre-line text-xs' : pathDiff ? 'font-bold text-orange-500 break-all whitespace-pre-line text-xs' : 'font-bold text-black break-all whitespace-pre-line text-xs'}>
                        {u.href || 'Undefined (No href attribute)'}
                      </div>
                      <div className="text-base break-all whitespace-pre-line text-xs">
                        <span className="font-bold">Anchor:</span> <span className={anchorMissing ? 'text-red-600 font-semibold' : anchorDiff ? 'text-orange-500 font-semibold' : 'text-black'}>{u.anchor || 'Missing Anchor'}</span>
                      </div>
                    </>
                  ) : <div className="text-gray-400 italic">-</div>}
                </div>
                <div className="bg-gray-50 rounded-lg p-2 mb-1 border border-gray-200">
                  {p ? (
                    <>
                      <div className={(!p.href) ? 'font-bold text-red-600 break-all whitespace-pre-line text-xs' : (u && pPath !== uPath) ? 'font-bold text-orange-500 break-all whitespace-pre-line text-xs' : 'font-bold text-black break-all whitespace-pre-line text-xs'}>
                        {p.href || 'Undefined (No href attribute)'}
                      </div>
                      <div className="text-base break-all whitespace-pre-line text-xs">
                        <span className="font-bold">Anchor:</span> <span className={(!p.anchor) ? 'text-red-600 font-semibold' : (u && p.anchor !== u.anchor) ? 'text-orange-500 font-semibold' : 'text-black'}>{p.anchor || 'Missing Anchor'}</span>
                      </div>
                    </>
                  ) : <div className="text-gray-400 italic">-</div>}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
      {tab === 'Schema' && (
        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <div className="flex-1 w-full overflow-x-auto">
            <SchemaTable schema={uat.schema || []} />
          </div>
          <div className="flex-1 w-full overflow-x-auto">
            <SchemaTable schema={prod.schema || []} />
          </div>
        </div>
      )}
      {tab === 'Social' && (
        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <div className="flex-1 w-full">
            <SocialFields data={uat} />
          </div>
          <div className="flex-1 w-full">
            <SocialFields data={prod} />
          </div>
        </div>
      )}
    </div>
  );
} 