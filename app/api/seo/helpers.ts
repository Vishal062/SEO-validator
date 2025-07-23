import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

const allowedSchemaKeys = new Set([
  '@context', '@type', 'itemListElement', 'name', 'item', 'category', 'brand', 'image', 'description',
  'aggregateRating', 'reviewCount', 'mainEntity', 'acceptedAnswer', 'offers', 'offeredBy', 'url', 'publisher', 'reviewRating', 'author'
]);

export function filterSchema(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(filterSchema);
  } else if (obj && typeof obj === 'object') {
    const filtered: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      if (allowedSchemaKeys.has(key)) {
        filtered[key] = filterSchema((obj as Record<string, unknown>)[key]);
      }
    }
    return filtered;
  }
  return obj;
}

export async function fetchSchemaWithCheerio(html: string): Promise<unknown[]> {
  const $ = cheerio.load(html);
  const schema: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '{}');
      schema.push(filterSchema(json));
    } catch {
      // skip
    }
  });
  return schema;
}

export async function fetchSchemaWithPuppeteer(url: string, timeout = 15000): Promise<unknown[]> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0', timeout });
  const html = await page.content();
  await browser.close();
  return fetchSchemaWithCheerio(html);
}

export async function fetchSocialTagsWithPuppeteer(url: string, timeout = 15000): Promise<{ og: Record<string, string | null>, twitter: Record<string, string | null> }> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) req.abort();
    else req.continue();
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
  const { og, twitter } = await page.evaluate(() => {
    const og: Record<string, string | null> = {};
    const twitter: Record<string, string | null> = {};

    // Open Graph: property="og:*"
    document.querySelectorAll('meta[property^="og:"]').forEach(el => {
      const property = el.getAttribute('property');
      const content = el.getAttribute('content');
      if (property) og[property] = content || null;
    });

    // Twitter: name="twitter:*" OR property="twitter:*"
    document.querySelectorAll('meta[name^="twitter:"], meta[property^="twitter:"]').forEach(el => {
      const key = el.getAttribute('name') || el.getAttribute('property');
      const content = el.getAttribute('content');
      if (key) twitter[key] = content || null;
    });

    return { og, twitter };
  });
  await browser.close();
  return { og, twitter };
}

// Enhanced datalayer capture function
export async function captureDataLayerWithPuppeteer(url: string, timeout = 30000): Promise<any[]> {
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ] 
  });
  const page = await browser.newPage();

  // Only capture datalayer after page load
  await page.goto(url, { waitUntil: 'networkidle2', timeout: Math.min(timeout, 20000) });
  await new Promise(resolve => setTimeout(resolve, 2000)); // allow late events

  const dataLayerEvents = await page.evaluate(() => {
    return window.dataLayer ? JSON.parse(JSON.stringify(window.dataLayer)) : [];
  });

  await browser.close();
  return dataLayerEvents;
}

export function getOpenGraphTags(html: string): Record<string, string | null> {
  const $ = cheerio.load(html);
  const og: Record<string, string | null> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const property = $(el).attr('property');
    const content = $(el).attr('content') || null;
    if (property) og[property] = content;
  });
  return og;
}

export function getTwitterTags(html: string): Record<string, string | null> {
  const $ = cheerio.load(html);
  console.log("hello", cheerio.load(html))
  const twitter: Record<string, string | null> = {};
  $('meta[name^="twitter:"]').each((_, el) => {
    const name = $(el).attr('name');
    const content = $(el).attr('content') || null;
    if (name) twitter[name] = content;
  });
  return twitter;
} 