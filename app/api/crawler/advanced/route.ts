import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = path.resolve(process.cwd(), 'storage');

interface SitemapUrl {
  url: string;
  priority: number;
  lastmod?: string;
  changefreq?: string;
}

interface AdvancedCrawlConfig {
  maxPages: number;
  concurrency: number;
  useSitemap: boolean;
  priorityCrawling: boolean;
  respectRobotsTxt: boolean;
  crawlDepth: number;
}

// Detect and parse sitemap
async function detectSitemap(domain: string): Promise<SitemapUrl[]> {
  const sitemapUrls = [
    `${domain}/sitemap.xml`,
    `${domain}/sitemap_index.xml`,
    `${domain}/sitemap/sitemap.xml`,
    `${domain}/robots.txt`
  ];

  const browser = await puppeteer.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });

  try {
    const page = await browser.newPage();
    
    // Check robots.txt first
    try {
      await page.goto(`${domain}/robots.txt`, { timeout: 10000 });
      const robotsContent = await page.content();
      const sitemapMatches = robotsContent.match(/Sitemap:\s*(https?:\/\/[^\s]+)/gi);
      if (sitemapMatches) {
        sitemapUrls.push(...sitemapMatches.map(match => match.replace(/Sitemap:\s*/i, '')));
      }
    } catch {
      // robots.txt not found, continue
    }

    // Try to find sitemap
    for (const sitemapUrl of sitemapUrls) {
      try {
        await page.goto(sitemapUrl, { timeout: 10000 });
        const content = await page.content();
        
        if (content.includes('<?xml') && content.includes('urlset')) {
          // Parse XML sitemap
          const urls: SitemapUrl[] = [];
          const urlMatches = content.match(/<url>([\s\S]*?)<\/url>/g);
          
          if (urlMatches) {
            for (const urlMatch of urlMatches) {
              const locMatch = urlMatch.match(/<loc>([^<]+)<\/loc>/);
              const priorityMatch = urlMatch.match(/<priority>([^<]+)<\/priority>/);
              const lastmodMatch = urlMatch.match(/<lastmod>([^<]+)<\/lastmod>/);
              
              if (locMatch) {
                urls.push({
                  url: locMatch[1],
                  priority: priorityMatch ? parseFloat(priorityMatch[1]) : 0.5,
                  lastmod: lastmodMatch ? lastmodMatch[1] : undefined
                });
              }
            }
          }
          
          await browser.close();
          return urls;
        }
      } catch {
        // Continue to next sitemap URL
      }
    }
  } finally {
    await browser.close();
  }

  return [];
}

// AI-powered URL prioritization based on common SEO patterns
function prioritizeUrls(urls: string[], sitemapUrls: SitemapUrl[] = []): string[] {
  const priorityMap = new Map<string, number>();
  
  // Create sitemap priority lookup
  const sitemapPriority = new Map<string, number>();
  sitemapUrls.forEach(item => {
    sitemapPriority.set(item.url, item.priority);
  });

  urls.forEach(url => {
    let priority = 0.5; // Default priority
    
    // Boost sitemap URLs
    if (sitemapPriority.has(url)) {
      priority += sitemapPriority.get(url)! * 0.3;
    }
    
    // Boost homepage
    if (url.endsWith('/') || new URL(url).pathname === '/') {
      priority += 0.5;
    }
    
    // Boost important pages based on URL patterns
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.includes('/about') || pathname.includes('/contact')) priority += 0.3;
    if (pathname.includes('/product') || pathname.includes('/service')) priority += 0.4;
    if (pathname.includes('/blog') || pathname.includes('/news')) priority += 0.2;
    
    // Penalize very long URLs (likely less important)
    if (url.length > 100) priority -= 0.2;
    
    // Penalize URLs with query parameters (except important ones)
    if (url.includes('?') && !url.includes('utm_source')) priority -= 0.1;
    
    priorityMap.set(url, Math.max(0, Math.min(1, priority)));
  });

  // Sort by priority (highest first)
  return urls.sort((a, b) => (priorityMap.get(b) || 0) - (priorityMap.get(a) || 0));
}

export async function POST(req: NextRequest) {
  try {
    const { domain, config }: { domain: string; config: AdvancedCrawlConfig } = await req.json();
    
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

    // Detect sitemap if enabled
    let sitemapUrls: SitemapUrl[] = [];
    if (config.useSitemap) {
      sitemapUrls = await detectSitemap(origin);
    }

    // Extract initial URLs from sitemap or start with homepage
    let initialUrls: string[] = [];
    if (sitemapUrls.length > 0) {
      initialUrls = sitemapUrls.map(item => item.url);
    } else {
      initialUrls = [url];
    }

    // Prioritize URLs if priority crawling is enabled
    if (config.priorityCrawling) {
      initialUrls = prioritizeUrls(initialUrls, sitemapUrls);
    }

    // Create enhanced crawl state
    const crawlId = `${domain.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const state = {
      id: crawlId,
      domain,
      origin,
      toVisit: initialUrls,
      visited: [],
      inProgress: [],
      done: false,
      error: null,
      sitemapUrls,
      config: {
        ...config,
        maxPages: Math.min(config.maxPages, 500),
        concurrency: Math.min(config.concurrency, 10),
        batchSize: Math.min(config.concurrency * 2, 20)
      },
      stats: {
        totalFound: initialUrls.length,
        totalProcessed: 0,
        startTime: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        averageTimePerPage: 0,
        pagesPerSecond: 0,
        sitemapDetected: sitemapUrls.length > 0,
        priorityCrawling: config.priorityCrawling
      },
      performance: {
        browserPool: [],
        activeConnections: 0,
        failedUrls: [],
        retryQueue: []
      }
    };

    // Save state
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.writeFile(
      path.join(STORAGE_DIR, `${crawlId}.json`), 
      JSON.stringify(state, null, 2)
    );

    return NextResponse.json({
      id: crawlId,
      config: state.config,
      stats: state.stats,
      sitemapDetected: sitemapUrls.length > 0,
      initialUrls: initialUrls.length,
      estimatedTime: Math.ceil(config.maxPages / config.concurrency) * 1.5
    });

  } catch (error) {
    console.error('Advanced crawler error:', error);
    return NextResponse.json({ error: 'Failed to start advanced crawl.' }, { status: 500 });
  }
} 