import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { filterSchema, fetchAllWithPuppeteer, getOpenGraphTags, getTwitterTags } from './helpers';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { urls } = body;

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
  }

  const results = await Promise.all(
    urls.map(async (url: string) => {
      try {
        const { data: html, headers: responseHeaders } = await axios.get(url);
        const $ = cheerio.load(html);

        const headings: { level: string, text: string }[] = [];
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(level => {
          $(level).each((_, el) => {
            const text = $(el).text().trim();
            if (text) headings.push({ level, text });
          });
        });

        // Extract all links
        const links: { href?: string, anchor: string }[] = [];
        $('a').each((_, el) => {
          const href = $(el).attr('href');
          const anchor = $(el).text().trim();
          links.push({ href, anchor });
        });

        // Robots tags from static HTML / HTTP headers
        const robotsTag = $('meta[name="robots"]').attr('content') || '';
        const xRobotsTag = (responseHeaders['x-robots-tag'] as string) || '';

        // Cheerio-based OG/Twitter as guaranteed fallback (runs on already-fetched HTML)
        const cheerioOg = getOpenGraphTags(html);
        const cheerioTwitter = getTwitterTags(html);

        // Defaults from Cheerio
        let og: Record<string, string | null> = { ...cheerioOg };
        let twitter: Record<string, string | null> = { ...cheerioTwitter };
        let schema: unknown[] = [];
        let dataLayer: any[] = [];

        // ONE Puppeteer visit per URL — extracts OG + Twitter + Schema + DataLayer together.
        // Puppeteer values override Cheerio values where present.
        try {
          const puppeteerData = await fetchAllWithPuppeteer(url, 30000);
          og = { ...cheerioOg, ...puppeteerData.og };
          twitter = { ...cheerioTwitter, ...puppeteerData.twitter };
          schema = puppeteerData.schema.map(filterSchema).filter(v => v !== undefined) as unknown[];
          dataLayer = puppeteerData.dataLayer;
        } catch (puppeteerErr) {
          console.warn('Puppeteer extraction failed, using Cheerio fallbacks for', url, puppeteerErr);
        }

        return {
          url,
          title: $('title').text() || '',
          description: $('meta[name="description"]').attr('content') || '',
          h1: $('h1').first().text() || '',
          canonical: $('link[rel="canonical"]').attr('href') || '',
          robotsTag,
          xRobotsTag,
          ogTitle: og['og:title'] || '',
          ogDesc: og['og:description'] || '',
          headings,
          links,
          schema,
          og,
          twitter,
          dataLayer,
        };
      } catch (err: unknown) {
        return {
          url,
          error: (err as Error).message || 'Failed to fetch',
        };
      }
    })
  );

  return NextResponse.json({ results });
}