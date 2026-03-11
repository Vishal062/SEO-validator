import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fetchAllWithPuppeteer } from '../seo/helpers';

const SNAPSHOT_DIR = path.resolve(process.cwd(), 'storage/snapshot');

function normalizeUrlForSnapshot(url: string) {
  try {
    let u = url.trim();
    u = u.replace(/^https?:\/\//, '');
    u = u.replace(/^www\./, '');
    u = u.replace(/[\s.\/]+$/, '');
    return u;
  } catch {
    return url;
  }
}

function createSnapshotFileName(url: string) {
  const safeUrl = normalizeUrlForSnapshot(url).replace(/[^a-zA-Z0-9]/g, '_');
  const date = new Date().toISOString().replace(/[:.]/g, '-');
  return `${safeUrl}_${date}.json`;
}

function getLatestSnapshotFile(url: string) {
  const safeUrl = normalizeUrlForSnapshot(url).replace(/[^a-zA-Z0-9]/g, '_');
  if (!fs.existsSync(SNAPSHOT_DIR)) return null;
  const files = fs.readdirSync(SNAPSHOT_DIR)
    .filter(f => f.startsWith(safeUrl + '_') && f.endsWith('.json'))
    .sort()
    .reverse();
  for (const file of files) {
    const filePath = path.join(SNAPSHOT_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (normalizeUrlForSnapshot(data.url) === normalizeUrlForSnapshot(url)) {
        return filePath;
      }
    } catch {}
  }
  return null;
}

function getAllSnapshotFiles(url: string) {
  const safeUrl = normalizeUrlForSnapshot(url).replace(/[^a-zA-Z0-9]/g, '_');
  if (!fs.existsSync(SNAPSHOT_DIR)) return [];
  const files = fs.readdirSync(SNAPSHOT_DIR)
    .filter(f => f.startsWith(safeUrl + '_') && f.endsWith('.json'))
    .sort()
    .reverse();
  const matchedFiles: string[] = [];
  for (const file of files) {
    const filePath = path.join(SNAPSHOT_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (normalizeUrlForSnapshot(data.url) === normalizeUrlForSnapshot(url)) {
        matchedFiles.push(file);
      }
    } catch {}
  }
  return matchedFiles;
}

// Deep omit keys from object/array, handles nested dataLayer gtm.start removal
function deepOmit(obj: any, keys: string[]): any {
  if (Array.isArray(obj)) {
    return obj.map(item => deepOmit(item, keys));
  } else if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const k in obj) {
      if (k === 'dataLayer' && Array.isArray(obj[k])) {
        result[k] = obj[k].map((dl: any) => {
          if (dl && typeof dl === 'object') {
            const dlCopy = { ...dl };
            delete dlCopy['gtm.start'];
            return deepOmit(dlCopy, keys);
          }
          return dl;
        });
        continue;
      }
      if (!keys.includes(k)) {
        result[k] = deepOmit(obj[k], keys);
      }
    }
    return result;
  }
  return obj;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const list = req.nextUrl.searchParams.get('list');
  const file = req.nextUrl.searchParams.get('file');

  if (file) {
    const filePath = path.join(SNAPSHOT_DIR, file);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Snapshot not found.' }, { status: 404 });
    }
    const previous = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return NextResponse.json({ previous });
  }
  if (url && list) {
    const files = getAllSnapshotFiles(url);
    return NextResponse.json({ files });
  }
  if (url) {
    const latestFile = getLatestSnapshotFile(url);
    if (!latestFile) return NextResponse.json({ previous: null });
    const previous = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));
    return NextResponse.json({ previous });
  }
  return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 });
    }

    // ----------------------------------------------------------------
    // ONE Puppeteer visit — extracts OG, Twitter, Schema, DataLayer
    // all in a single Chrome session (no zombie browser processes).
    // Cheerio then handles static fields from axios-fetched HTML.
    // ----------------------------------------------------------------
    let puppeteerData: Awaited<ReturnType<typeof fetchAllWithPuppeteer>> | null = null;
    try {
      puppeteerData = await fetchAllWithPuppeteer(url, 30000);
    } catch (err) {
      console.warn('[snapshot-seo] Puppeteer extraction failed, falling back to Cheerio:', err);
    }

    // Fetch static HTML for Cheerio-based field extraction
    const { data: html } = await axios.get(url, { timeout: 20000 });
    const $ = cheerio.load(html);

    // Headings
    const headings: { level: string; text: string }[] = [];
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(level => {
      $(level).each((_, el) => {
        const text = $(el).text().trim();
        if (text) headings.push({ level, text });
      });
    });

    // Links
    const links: { href: string; anchor: string }[] = [];
    $('a').each((_, el) => {
      links.push({ href: $(el).attr('href') || '', anchor: $(el).text().trim() });
    });

    // OG/Twitter: Cheerio fallback, Puppeteer values override where available
    const cheerioOg: Record<string, string> = {};
    $('meta[property^="og:"]').each((_, el) => {
      const property = $(el).attr('property');
      const content = $(el).attr('content');
      if (property && content) cheerioOg[property] = content;
    });
    const cheerioTwitter: Record<string, string> = {};
    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr('name');
      const content = $(el).attr('content');
      if (name && content) cheerioTwitter[name] = content;
    });

    const og = { ...cheerioOg, ...(puppeteerData?.og ?? {}) };
    const twitter = { ...cheerioTwitter, ...(puppeteerData?.twitter ?? {}) };
    const dataLayer = puppeteerData?.dataLayer ?? [];

    const result = {
      title: $('title').text() || '',
      description: $('meta[name="description"]').attr('content') || '',
      h1: $('h1').first().text().trim() || '',
      canonical: $('link[rel="canonical"]').attr('href') || '',
      ogTitle: og['og:title'] || '',
      ogDesc: og['og:description'] || '',
      twitterTitle: twitter['twitter:title'] || '',
      twitterDesc: twitter['twitter:description'] || '',
      headings,
      links,
      og,
      twitter,
      dataLayer,
    };

    // Missing field detection
    const missing: string[] = [];
    if (!result.title) missing.push('title');
    if (!result.description) missing.push('description');
    if (!result.h1) missing.push('h1');
    if (!result.canonical) missing.push('canonical');
    if (!result.ogTitle) missing.push('og:title');
    if (!result.ogDesc) missing.push('og:description');
    if (!result.twitterTitle) missing.push('twitter:title');
    if (!result.twitterDesc) missing.push('twitter:description');
    (result as any).missing = missing;

    // Save snapshot only if content changed
    if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    const fileName = createSnapshotFileName(url);
    const latestFile = getLatestSnapshotFile(url);
    let isChanged = true;
    let lastChangeDate: string | null = null;
    if (latestFile) {
      try {
        const prev = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));
        lastChangeDate = prev.date || null;
        const prevData = deepOmit(prev, ['date', 'updated', 'url', 'missing', 'gtm.start']);
        const currData = deepOmit(result, ['date', 'updated', 'url', 'missing', 'gtm.start']);
        isChanged = JSON.stringify(prevData) !== JSON.stringify(currData);
      } catch {}
    }

    const now = new Date().toISOString();
    let snapshotData: any;
    if (isChanged) {
      snapshotData = { url, date: now, updated: now, ...result };
      fs.writeFileSync(path.join(SNAPSHOT_DIR, fileName), JSON.stringify(snapshotData, null, 2));
    } else {
      if (latestFile) {
        try {
          const prev = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));
          prev.updated = now;
          fs.writeFileSync(latestFile, JSON.stringify(prev, null, 2));
          snapshotData = prev;
        } catch {
          snapshotData = { url, date: lastChangeDate || now, updated: now, ...result };
        }
      } else {
        snapshotData = { url, date: now, updated: now, ...result };
        fs.writeFileSync(path.join(SNAPSHOT_DIR, fileName), JSON.stringify(snapshotData, null, 2));
      }
    }

    return NextResponse.json({
      result,
      saved: isChanged,
      date: snapshotData.date,
      updated: snapshotData.updated,
      file: isChanged ? fileName : path.basename(latestFile || fileName),
    });
  } catch (error) {
    console.error('[snapshot-seo] POST error:', error);
    return NextResponse.json({ error: 'Failed to fetch or save SEO snapshot.' }, { status: 500 });
  }
}