import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

// ---------------------------------------------------------------------
// Allowed schema.org keys for filtering
// Only keys listed here will be preserved in the output.
// ---------------------------------------------------------------------
const allowedSchemaKeys = new Set([
  '@context', '@type', 'itemListElement', 'name', 'item', 'category', 'brand', 'image', 'description',
  'aggregateRating', 'reviewCount', 'mainEntity', 'acceptedAnswer', 'offers', 'offeredBy', 'url', 'publisher', 'reviewRating', 'author',
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
  'illustrator', 'colorist', 'letterer', 'inker', 'penciler', 'artist', 'bookEdition', 'bookFormat', 'isbn', 'numberOfPages',
  'abridged', 'bookFormat', 'illustrator', 'numberOfPages', 'isbn', 'inLanguage', 'isAccessibleForFree',
  'isPartOf', 'isBasedOn', 'isBasedOnUrl', 'character', 'actor', 'director', 'producer', 'productionCompany'
]);

/**
 * Recursively filters the given object:
 *  - Only keeps keys found in allowedSchemaKeys.
 *  - Removes any key whose value is null, undefined, empty string,
 *    empty array (only if it's not an allowed array key),
 *    or empty object (after filtering).
 *  - Always preserves allowed keys with non-empty array values (like sameAs).
 */
export function filterSchema(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    // If array contains only primitives (string, number, boolean), filter out null/empty primitives only
    const isPrimitiveArr = obj.every(
      v =>
        typeof v === 'string' ||
        typeof v === 'number' ||
        typeof v === 'boolean' ||
        v === null ||
        v === undefined
    );
    if (isPrimitiveArr) {
      const flatArr = obj
        .filter(
          v =>
            v !== null &&
            v !== undefined &&
            !(typeof v === 'string' && v.trim() === '')
        );
      return flatArr.length > 0 ? flatArr : undefined;
    }

    // Otherwise, process recursively
    const filteredArr = obj
      .map(filterSchema)
      .filter(
        v =>
          !(v === null || v === undefined || v === '' ||
            (Array.isArray(v) && v.length === 0) ||
            (typeof v === 'object' && v !== null && Object.keys(v).length === 0))
      );
    return filteredArr.length > 0 ? filteredArr : undefined;
  } else if (obj && typeof obj === 'object') {
    const filtered: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      if (allowedSchemaKeys.has(key)) {
        
        const value = filterSchema((obj as Record<string, unknown>)[key]);
        // Always keep allowed key if value is non-empty array, string, object, or primitive
        if (
          value !== null &&
          value !== undefined &&
          !(typeof value === 'string' && value.trim() === '') &&
          !(Array.isArray(value) && value.length === 0) &&
          !(typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0)
        ) {
          filtered[key] = value;
        }
      }
    }
    return Object.keys(filtered).length > 0 ? filtered : undefined;
  }
  return obj;
}


/**
 * Extracts all JSON-LD schemas and microdata from the provided HTML string via Cheerio.
 * - Looks for <script type="application/ld+json"> tags, parses and filters each.
 * - Also attempts to extract microdata blocks with [itemtype] and [itemprop] attributes.
 * - All null/empty values are pruned.
 *
 * @param html - Raw HTML content of the target page.
 * @returns Array of filtered schema objects.
 */
export async function fetchSchemaWithCheerio(html: string): Promise<unknown[]> {
  const $ = cheerio.load(html);
  const schema: unknown[] = [];

  // JSON-LD <script> blocks
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text();
    try {
      const json = JSON.parse(raw || '{}');
      const filtered = filterSchema(json);
      if (filtered !== undefined) schema.push(filtered);
    } catch (e) {
      // Skip invalid JSON
      console.log("Error with cherio", e)
    }
  });

  // Look for JSON-LD-like scripts even if missing type
  $('script').each((_, el) => {
    const scriptContent = $(el).html() || '';
    if (scriptContent.includes('"@context"') && scriptContent.includes('"@type"')) {
      try {
        const json = JSON.parse(scriptContent);
        const filtered = filterSchema(json);
        if (filtered !== undefined) schema.push(filtered);
      } catch {
        // Skip
      }
    }
  });

  // Microdata extraction from [itemtype] and [itemprop]
  $('[itemtype]').each((_, el) => {
    const itemtype = $(el).attr('itemtype');
    if (itemtype) {
      const item: Record<string, unknown> = { '@type': itemtype.replace(/https?:\/\/schema.org\//, '') };
      $(el).find('[itemprop]').each((_, propEl) => {
        const prop = $(propEl).attr('itemprop');
        const content = $(propEl).attr('content') || $(propEl).text().trim();
        if (prop && content) {
          item[prop] = content;
        }
      });
      if (Object.keys(item).length > 1) {
        const filtered = filterSchema(item);
        if (filtered !== undefined) schema.push(filtered);
      }
    }
  });

  return schema;
}

/**
 * -----------------------------------------------------------------------
 * COMBINED Puppeteer function — ONE browser, ONE page visit per URL.
 * Extracts OG tags, Twitter tags, JSON-LD schema, AND window.dataLayer
 * all in a single Chrome session.
 *
 * Why: Previously 3 separate browser launches hit the same page 3 times,
 * causing bot-detection / rate-limiting on many sites (especially for the
 * 3rd request that reads dataLayer), resulting in empty dataLayer arrays.
 * -----------------------------------------------------------------------
 *
 * @param url     - The URL to crawl.
 * @param timeout - Navigation timeout in ms (default: 30s).
 */
export async function fetchAllWithPuppeteer(
  url: string,
  timeout = 30000
): Promise<{
  og: Record<string, string | null>;
  twitter: Record<string, string | null>;
  schema: unknown[];
  dataLayer: any[];
}> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();

    // Spoof a real browser User-Agent to avoid basic bot-detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    // Block only heavy binary assets — keep JS, stylesheets (needed for GTM)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
      else req.continue();
    });

    // Use networkidle2 so GTM and other async scripts have time to initialise
    await page.goto(url, { waitUntil: 'networkidle2', timeout });

    // Extra buffer for SPAs / React hydration / GTM tag firing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Extract everything in ONE evaluate call
    const result = await page.evaluate(() => {
      // --- Open Graph ---
      const og: Record<string, string | null> = {};
      document.querySelectorAll('meta[property^="og:"]').forEach((el) => {
        const property = el.getAttribute('property');
        const content = el.getAttribute('content');
        if (property && content) og[property] = content;
      });

      // --- Twitter Cards ---
      const twitter: Record<string, string | null> = {};
      document
        .querySelectorAll('meta[name^="twitter:"], meta[property^="twitter:"]')
        .forEach((el) => {
          const key = el.getAttribute('name') || el.getAttribute('property');
          const content = el.getAttribute('content');
          if (key && content) twitter[key] = content;
        });

      // --- JSON-LD Schema ---
      const schemas: unknown[] = [];
      document
        .querySelectorAll('script[type="application/ld+json"]')
        .forEach((script) => {
          try {
            const content = script.textContent || '';
            if (content.trim()) schemas.push(JSON.parse(content));
          } catch {
            // skip malformed JSON-LD
          }
        });

      // --- DataLayer (GTM / GA4) ---
      const dataLayer: any[] = (window as any).dataLayer
        ? JSON.parse(JSON.stringify((window as any).dataLayer))
        : [];

      return { og, twitter, schemas, dataLayer };
    });

    return {
      og: result.og,
      twitter: result.twitter,
      schema: result.schemas,
      dataLayer: result.dataLayer,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Extracts all Open Graph meta tags (og:*) from HTML string using Cheerio.
 * Only returns tags with both property and content present and non-empty.
 * 
 * @param html - HTML string
 * @returns Mapping of og:* keys to their contents
 */
export function getOpenGraphTags(html: string): Record<string, string | null> {
  const $ = cheerio.load(html);
  const og: Record<string, string | null> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const property = $(el).attr('property');
    const content = $(el).attr('content') || null;
    if (property && content) og[property] = content;
  });
  return og;
}

/**
 * Extracts all Twitter meta tags (twitter:*) from HTML string using Cheerio.
 * Only returns tags with both name/property and content present and non-empty.
 * 
 * @param html - HTML string
 * @returns Mapping of twitter:* keys to their contents
 */
export function getTwitterTags(html: string): Record<string, string | null> {
  const $ = cheerio.load(html);
  const twitter: Record<string, string | null> = {};
  $('meta[name^="twitter:"]').each((_, el) => {
    const name = $(el).attr('name');
    const content = $(el).attr('content') || null;
    if (name && content) twitter[name] = content;
  });
  return twitter;
}

/**
 * Backward-compatible alias for callers (e.g. snapshot-seo/route.ts) that
 * previously imported `captureDataLayerWithPuppeteer` directly.
 *
 * Internally delegates to `fetchAllWithPuppeteer` so it gets all the same
 * improvements: single browser visit, networkidle2 wait, bot-detection bypass,
 * 3 s GTM buffer, and guaranteed browser.close() in finally.
 *
 * @param url     - The URL to analyse.
 * @param timeout - Navigation timeout in ms (default: 30 s).
 * @returns The `window.dataLayer` array captured from the page.
 */
export async function captureDataLayerWithPuppeteer(
  url: string,
  timeout = 30000
): Promise<any[]> {
  const { dataLayer } = await fetchAllWithPuppeteer(url, timeout);
  return dataLayer;
}