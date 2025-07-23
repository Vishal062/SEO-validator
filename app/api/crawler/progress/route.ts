import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = path.resolve(process.cwd(), 'storage');

function getCrawlFilePath(id: string) {
  return path.join(STORAGE_DIR, `${id}.json`);
}

async function loadCrawlState(id: string) {
  try {
    const file = getCrawlFilePath(id);
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function saveCrawlState(id: string, state: any) {
  state.stats.lastUpdate = new Date().toISOString();
  await fs.writeFile(getCrawlFilePath(id), JSON.stringify(state, null, 2));
}

// Browser pool management
class BrowserPool {
  private browsers: any[] = [];
  private maxBrowsers: number;

  constructor(maxBrowsers: number) {
    this.maxBrowsers = maxBrowsers;
  }

  async getBrowser(): Promise<any> {
    if (this.browsers.length < this.maxBrowsers) {
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
      this.browsers.push(browser);
      return browser;
    }
    return this.browsers[Math.floor(Math.random() * this.browsers.length)];
  }

  async closeAll() {
    await Promise.all(this.browsers.map((browser: any) => browser.close()));
    this.browsers = [];
  }
}

// Process a single URL with retry logic
async function processUrl(
  browser: any, 
  url: string, 
  origin: string, 
  timeout: number,
  retryAttempts: number
): Promise<{ success: boolean; links: string[]; error?: string }> {
  let attempts = 0;
  
  while (attempts < retryAttempts) {
    try {
      const page = await browser.newPage();
      
      // Set performance optimizations
      await page.setRequestInterception(true);
      page.on('request', (req: any) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout 
      });

      // Extract links efficiently
      const links: string[] = await page.$$eval(
        'a',
        (as: any[], origin: string) =>
          as
            .map((a: any) => a.getAttribute('href'))
            .filter((href: any) => !!href && !href.startsWith('javascript:') && !href.startsWith('#'))
            .map((href: any) => {
              try {
                return new URL(href!, origin).href;
              } catch {
                return null;
              }
            })
            .filter((href: any): href is string => !!href && href.startsWith(origin)),
        origin
      );

      await page.close();
      return { success: true, links };
    } catch (error) {
      attempts++;
      if (attempts >= retryAttempts) {
        return { 
          success: false, 
          links: [], 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
    }
  }
  
  return { success: false, links: [], error: 'Max retry attempts reached' };
}

// Process a batch of URLs in parallel
async function processBatch(
  urls: string[], 
  origin: string, 
  browserPool: BrowserPool,
  config: any
): Promise<{ processed: string[]; newLinks: string[]; failed: string[] }> {
  const results = await Promise.allSettled(
    urls.map(url => 
      browserPool.getBrowser().then(browser => 
        processUrl(browser, url, origin, config.timeout, config.retryAttempts)
      )
    )
  );

  const processed: string[] = [];
  const newLinks: string[] = [];
  const failed: string[] = [];

  results.forEach((result, index) => {
    const url = urls[index];
    if (result.status === 'fulfilled' && result.value.success) {
      processed.push(url);
      newLinks.push(...result.value.links);
    } else {
      failed.push(url);
    }
  });

  return { processed, newLinks, failed };
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing crawl id.' }, { status: 400 });
  
  const state = await loadCrawlState(id);
  if (!state) return NextResponse.json({ error: 'Crawl not found.' }, { status: 404 });
  
  if (state.done) {
    return NextResponse.json({ 
      batch: [], 
      done: true, 
      visited: state.visited,
      stats: state.stats 
    });
  }

  try {
    const browserPool = new BrowserPool(state.config.concurrency);
    
    // Get next batch of URLs to process
    const batchSize = Math.min(state.config.batchSize, state.toVisit.length);
    const batch = state.toVisit.splice(0, batchSize);
    
    if (batch.length === 0) {
      state.done = true;
      await saveCrawlState(id, state);
      await browserPool.closeAll();
      return NextResponse.json({ 
        batch: [], 
        done: true, 
        visited: state.visited,
        stats: state.stats 
      });
    }

    // Process batch in parallel
    const startTime = Date.now();
    const { processed, newLinks, failed } = await processBatch(
      batch, 
      state.origin, 
      browserPool, 
      state.config
    );
    const endTime = Date.now();

    // Update state
    state.visited.push(...processed);
    state.performance.failedUrls.push(...failed);
    
    // Add new links to visit queue (deduplicated)
    const uniqueNewLinks = [...new Set(newLinks)];
    for (const link of uniqueNewLinks) {
      if (!state.visited.includes(link) && !state.toVisit.includes(link)) {
        state.toVisit.push(link);
      }
    }

    // Update statistics
    state.stats.totalProcessed += processed.length;
    state.stats.totalFound = state.visited.length + state.toVisit.length;
    
    if (processed.length > 0) {
      const timePerPage = (endTime - startTime) / processed.length;
      state.stats.averageTimePerPage = 
        (state.stats.averageTimePerPage * (state.stats.totalProcessed - processed.length) + timePerPage * processed.length) / 
        state.stats.totalProcessed;
      
      const elapsedSeconds = (Date.now() - new Date(state.stats.startTime).getTime()) / 1000;
      state.stats.pagesPerSecond = state.stats.totalProcessed / elapsedSeconds;
    }

    // Check if crawling is complete
    if (state.toVisit.length === 0 || state.stats.totalProcessed >= state.config.maxPages) {
      state.done = true;
    }

    await saveCrawlState(id, state);
    await browserPool.closeAll();

    return NextResponse.json({ 
      batch: processed, 
      done: state.done, 
      visited: state.visited,
      stats: state.stats,
      performance: {
        batchSize: batch.length,
        processed: processed.length,
        failed: failed.length,
        newLinksFound: uniqueNewLinks.length,
        timePerPage: state.stats.averageTimePerPage,
        pagesPerSecond: state.stats.pagesPerSecond
      }
    });

  } catch (error) {
    console.error('Crawler progress error:', error);
    state.error = 'Failed during crawling.';
    state.done = true;
    await saveCrawlState(id, state);
    return NextResponse.json({ error: 'Failed during crawling.' }, { status: 500 });
  }
} 