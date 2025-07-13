import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

const allowedSchemaKeys = new Set([
  '@context', '@type', 'itemListElement', 'name', 'item', 'category', 'brand', 'image', 'description',
  'aggregateRating', 'reviewCount', 'mainEntity', 'acceptedAnswer', 'offers', 'offeredBy', 'url', 'publisher', 'reviewRating', 'author'
]);

export function filterSchema(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(filterSchema);
  } else if (obj && typeof obj === 'object') {
    const filtered: any = {};
    for (const key in obj) {
      if (allowedSchemaKeys.has(key)) {
        filtered[key] = filterSchema(obj[key]);
      } else if (key === '@type' && obj[key]) {
        filtered[key] = obj[key];
      }
    }
    return filtered;
  }
  return obj;
}

export async function fetchSchemaWithCheerio(html: string): Promise<any[]> {
  const $ = cheerio.load(html);
  const schema: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = $(el).html();
      if (json) {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) schema.push(...parsed);
        else schema.push(parsed);
      }
    } catch { }
  });
  return schema;
}

export async function fetchSchemaWithPuppeteer(url: string, timeout = 15000): Promise<any[]> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Block images, stylesheets, and fonts
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) req.abort();
    else req.continue();
  });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
  const schemas = await page.$$eval('script[type=\"application/ld+json\"]', scripts =>
    scripts.map(s => s.innerText)
  );
  await browser.close();
  return schemas.map(s => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  }).filter(Boolean);
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