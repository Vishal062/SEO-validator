import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { captureDataLayerWithPuppeteer } from '../seo/helpers';

const SNAPSHOT_DIR = path.resolve(process.cwd(), 'storage/snapshot');

function normalizeUrlForSnapshot(url: string) {
  try {
    let u = url.trim();
    // Remove protocol
    u = u.replace(/^https?:\/\//, '');
    // Remove www.
    u = u.replace(/^www\./, '');
    // Remove trailing slashes, spaces, and dots, but keep the path
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
    .reverse(); // newest first
  // Only return a file where the stored url matches the requested url (after normalization)
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
  // Only return files where the stored url matches the requested url (after normalization)
  const matchedFiles = [];
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

// Deep omit keys from object/array, with support for nested keys like 'dataLayer.gtm.start'
function deepOmit(obj: any, keys: string[]): any {
  if (Array.isArray(obj)) {
    return obj.map(item => deepOmit(item, keys));
  } else if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const k in obj) {
      // Omit 'gtm.start' inside dataLayer objects
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
    // Return the contents of a specific snapshot file
    const filePath = path.join(SNAPSHOT_DIR, file);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Snapshot not found.' }, { status: 404 });
    }
    const previous = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return NextResponse.json({ previous });
  }
  if (url && list) {
    // List all snapshot files for this URL
    const files = getAllSnapshotFiles(url);
    return NextResponse.json({ files });
  }
  if (url) {
    // Return the latest snapshot for this URL
    const latestFile = getLatestSnapshotFile(url);
    if (!latestFile) {
      return NextResponse.json({ previous: null });
    }
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
    // Use enhanced datalayer capture function
    let dataLayerValue: any[] = [];
    const dataLayerPromise = captureDataLayerWithPuppeteer(url, 30000).then(result => {
      dataLayerValue = result;
    }).catch(err => {
      console.error('Failed to capture datalayer:', err);
      dataLayerValue = [];
    });
    
    // Scrape SEO data using Puppeteer
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    // Scrape SEO data (do not wait for dataLayer)
    const result = await page.evaluate(() => {
      const getMeta = (name: string): string =>
        document.querySelector(`meta[name='${name}']`)?.getAttribute('content') || '';
      const getOg = (property: string): string =>
        document.querySelector(`meta[property='${property}']`)?.getAttribute('content') || '';
      const getTwitter = (name: string): string =>
        document.querySelector(`meta[name='twitter:${name}']`)?.getAttribute('content') || '';
      // Headings
      const headings: { level: string; text: string }[] = [];
      ['h1','h2','h3','h4','h5','h6'].forEach(level => {
        document.querySelectorAll(level).forEach(el => {
          headings.push({ level, text: el.textContent?.trim() || '' });
        });
      });
      // Links
      const links = Array.from(document.querySelectorAll('a')).map(a => ({
        href: a.getAttribute('href') || '',
        anchor: a.textContent?.trim() || ''
      }));
      // Social tags
      const og = {};
      document.querySelectorAll('meta[property^="og:"]').forEach(el => {
        const property = el.getAttribute('property');
        if (property) (og as Record<string, string>)[property] = el.getAttribute('content') || '';
      });
      const twitter = {};
      document.querySelectorAll('meta[name^="twitter:"]').forEach(el => {
        const name = el.getAttribute('name');
        if (name) (twitter as Record<string, string>)[name] = el.getAttribute('content') || '';
      });
      return {
        title: document.title || '',
        description: getMeta('description'),
        h1: document.querySelector('h1')?.textContent?.trim() || '',
        canonical: document.querySelector("link[rel='canonical']")?.getAttribute('href') || '',
        ogTitle: getOg('og:title'),
        ogDesc: getOg('og:description'),
        twitterTitle: getTwitter('title'),
        twitterDesc: getTwitter('description'),
        headings,
        links,
        og,
        twitter
      };
    });
    // Wait for dataLayer capture to finish (but don't block main scrape)
    await dataLayerPromise;
    (result as any).dataLayer = dataLayerValue;
    await browser.close();
    // Check for missing important fields
    const missing = [];
    if (!result.title) missing.push('title');
    if (!result.description) missing.push('description');
    if (!result.h1) missing.push('h1');
    if (!result.canonical) missing.push('canonical');
    if (!result.ogTitle) missing.push('og:title');
    if (!result.ogDesc) missing.push('og:description');
    if (!result.twitterTitle) missing.push('twitter:title');
    if (!result.twitterDesc) missing.push('twitter:description');
    (result as any).missing = missing;
    // Save snapshot only if changed
    if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    const fileName = createSnapshotFileName(url);
    const latestFile = getLatestSnapshotFile(url);
    let isChanged = true;
    let lastChangeDate = null;
    let updatedDate = null;
    if (latestFile) {
      try {
        const prev = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));
        lastChangeDate = prev.date || null;
        updatedDate = prev.updated || null;
        // Deeply omit 'date', 'updated', 'url', 'missing', and 'gtm.start' in dataLayer
        const prevData = deepOmit(prev, ['date', 'updated', 'url', 'missing', 'gtm.start']);
        const currData = deepOmit(result, ['date', 'updated', 'url', 'missing', 'gtm.start']);
        isChanged = JSON.stringify(prevData) !== JSON.stringify(currData);
      } catch {}
    }
    const now = new Date().toISOString();
    let snapshotData;
    if (isChanged) {
      // Content changed: update both date and updated
      snapshotData = { url, date: now, updated: now, ...result };
      fs.writeFileSync(path.join(SNAPSHOT_DIR, fileName), JSON.stringify(snapshotData, null, 2));
    } else {
      // Content not changed: only update 'updated' field in the latest file
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
    return NextResponse.json({ result, saved: isChanged, date: snapshotData.date, updated: snapshotData.updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch or save SEO snapshot.' }, { status: 500 });
  }
} 