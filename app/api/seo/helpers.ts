import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

const allowedSchemaKeys = new Set([
  '@context', '@type', 'itemListElement', 'name', 'item', 'category', 'brand', 'image', 'description',
  'aggregateRating', 'reviewCount', 'mainEntity', 'acceptedAnswer', 'offers', 'offeredBy', 'url', 'publisher', 'reviewRating', 'author',
  // Add more common schema properties
  'logo', 'contactPoint', 'sameAs', 'address', 'telephone', 'email', 'faxNumber', 'areaServed', 'serviceArea',
  'price', 'priceCurrency', 'availability', 'seller', 'priceValidUntil', 'validFrom', 'validThrough',
  'startDate', 'endDate', 'location', 'geo', 'latitude', 'longitude', 'streetAddress', 'addressLocality',
  'addressRegion', 'postalCode', 'addressCountry', 'openingHours', 'paymentAccepted', 'currenciesAccepted',
  'hasOfferCatalog', 'areaServed', 'serviceType', 'provider', 'providerMobility', 'availableChannel',
  'availableService', 'hasOfferCatalog', 'makesOffer', 'seeks', 'potentialAction', 'actionStatus',
  'target', 'result', 'error', 'instrument', 'object', 'participant', 'event', 'startTime', 'endTime',
  'performer', 'organizer', 'attendee', 'superEvent', 'subEvent', 'inLanguage', 'audience', 'composer',
  'lyricist', 'musicBy', 'byArtist', 'recordedAt', 'releasedEvent', 'tracks', 'album', 'track',
  'playlist', 'radioStation', 'broadcastDisplayName', 'broadcastOfEvent', 'isLiveBroadcast',
  'video', 'videoFormat', 'videoQuality', 'duration', 'uploadDate', 'thumbnailUrl', 'embedUrl',
  'contentUrl', 'encodingFormat', 'bitrate', 'fileSize', 'height', 'width', 'caption', 'transcript',
  'interactionStatistic', 'interactionType', 'userInteractionCount', 'commentCount', 'likeCount',
  'shareCount', 'viewCount', 'downloadCount', 'playCount', 'comment', 'author', 'dateCreated',
  'dateModified', 'datePublished', 'upvoteCount', 'downvoteCount', 'parentItem', 'text', 'reviewBody',
  'reviewAspect', 'worstRating', 'bestRating', 'ratingValue', 'ratingCount', 'reviewCount',
  'aggregateRating', 'review', 'reviewRating', 'author', 'publisher', 'editor', 'translator',
  'illustrator', 'colorist', 'letterer', 'inker', 'penciler', 'artist', 'colorist', 'inker',
  'letterer', 'penciler', 'artist', 'bookEdition', 'bookFormat', 'isbn', 'numberOfPages',
  'abridged', 'bookFormat', 'illustrator', 'numberOfPages', 'isbn', 'inLanguage', 'isAccessibleForFree',
  'isPartOf', 'isBasedOn', 'isBasedOnUrl', 'character', 'actor', 'director', 'producer', 'productionCompany'
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
  
  // Look for JSON-LD schema in script tags
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text();
    try {
      const json = JSON.parse(raw || '{}');
      schema.push(filterSchema(json));
    } catch (e) {
      console.log('JSON parse error:', e, 'Content:', raw);
    }
  });
  
  // Also look for schema in script tags without type (some sites do this)
  $('script').each((_, el) => {
    const scriptContent = $(el).html() || '';
    if (scriptContent.includes('"@context"') && scriptContent.includes('"@type"')) {
      try {
        const json = JSON.parse(scriptContent);
        schema.push(filterSchema(json));
      } catch {
        // skip
      }
    }
  });
  
  // Look for microdata attributes
  const microdata: Record<string, unknown> = {};
  $('[itemtype]').each((_, el) => {
    const itemtype = $(el).attr('itemtype');
    if (itemtype) {
      const item: Record<string, unknown> = { '@type': itemtype.replace('http://schema.org/', '') };
      $(el).find('[itemprop]').each((_, propEl) => {
        const prop = $(propEl).attr('itemprop');
        const content = $(propEl).attr('content') || $(propEl).text().trim();
        if (prop && content) {
          item[prop] = content;
        }
      });
      if (Object.keys(item).length > 1) {
        schema.push(filterSchema(item));
      }
    }
  });
  return schema;
}

export async function fetchSchemaWithPuppeteer(url: string, timeout = 30000): Promise<unknown[]> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

  // Wait up to 5 seconds for a non-empty JSON-LD script to appear
  await page.waitForFunction(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    return scripts.some(s => s.textContent && s.textContent.trim().length > 0);
  }, { timeout: 5000 }).catch(() => {});

  // Optionally, wait a bit more for client-side JS
  await new Promise(resolve => setTimeout(resolve, 2000));

  const result = await page.evaluate(() => {
    const schemas: unknown[] = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        const content = script.textContent || '';
        if (content.trim()) {
          const json = JSON.parse(content);
          schemas.push(json);
        }
      } catch (e) {
        console.log('Error in fetchSchema with Puppeteer:', e);
      }
    });
    return schemas;
  });

  await browser.close();
  return result.map(filterSchema);
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
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: Math.min(timeout, 30000) });
  await new Promise(resolve => setTimeout(resolve, 2000)); // allow late events

  const dataLayerEvents = await page.evaluate(() => {
    return (window as any).dataLayer ? JSON.parse(JSON.stringify((window as any).dataLayer)) : [];
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
  const twitter: Record<string, string | null> = {};
  $('meta[name^="twitter:"]').each((_, el) => {
    const name = $(el).attr('name');
    const content = $(el).attr('content') || null;
    if (name) twitter[name] = content;
  });
  return twitter;
} 