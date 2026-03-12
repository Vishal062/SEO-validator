import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = path.resolve(process.cwd(), 'storage');

function createCrawlId(domain: string) {
  const safeDomain = domain.replace(/[^a-zA-Z0-9]/g, '_');
  const date = new Date().toISOString().replace(/[:.]/g, '-');
  return `${safeDomain}_${date}`;
}

function getCrawlFilePath(id: string) {
  return path.join(STORAGE_DIR, `${id}.json`);
}

async function saveCrawlState(id: string, state: Record<string, unknown>) {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  await fs.writeFile(getCrawlFilePath(id), JSON.stringify(state, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const { domain, maxPages = 100, concurrency = 5 } = await req.json();
    
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Invalid domain.' }, { status: 400 });
    }

    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    let origin: string;
    
    try {
      origin = new URL(url).origin;
    } catch {
      return NextResponse.json({ error: 'Invalid domain URL.' }, { status: 400 });
    }

    const id = createCrawlId(domain);
    
    // Enhanced initial crawl state with performance settings
    const state = {
      id,
      domain,
      origin,
      toVisit: [url],
      visited: [],
      inProgress: [],
      done: false,
      error: null,
      stats: {
        totalFound: 0,
        totalProcessed: 0,
        startTime: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        averageTimePerPage: 0,
        pagesPerSecond: 0
      },
      config: {
        maxPages: Math.min(maxPages, 500), // Cap at 500 pages
        concurrency: Math.min(concurrency, 10), // Cap at 10 concurrent browsers
        batchSize: Math.min(concurrency * 2, 20), // Dynamic batch size
        timeout: 15000,
        retryAttempts: 3
      },
      performance: {
        browserPool: [],
        activeConnections: 0,
        failedUrls: [],
        retryQueue: []
      }
    };

    await saveCrawlState(id, state);
    
    return NextResponse.json({ 
      id,
      config: state.config,
      estimatedTime: Math.ceil(maxPages / concurrency) * 2 // Rough estimate in seconds
    });
  } catch (error) {
    console.error('Crawler start error:', error);
    return NextResponse.json({ error: 'Failed to start crawl.' }, { status: 500 });
  }
} 