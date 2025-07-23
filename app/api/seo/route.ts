import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fetchSchemaWithPuppeteer, filterSchema, fetchSocialTagsWithPuppeteer, captureDataLayerWithPuppeteer } from './helpers';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { urls } = body;

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
  }

  const results = await Promise.all(
    urls.map(async (url: string) => {
      try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

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

        // Extract Open Graph and Twitter meta tags using Puppeteer
        let og: unknown = {};
        let twitter: unknown = {};
        try {
          const social = await fetchSocialTagsWithPuppeteer(url);
          og = social.og;
          twitter = social.twitter;
        } catch {
          // fallback: leave og and twitter empty
        }

        // Use Puppeteer helper for schema extraction and filter keys
        let schema: unknown[] = [];
        try {
          const rawSchema = await fetchSchemaWithPuppeteer(url);
          schema = rawSchema.map(filterSchema);
        } catch {
          // fallback: leave schema empty
        }

        // Capture datalayer events using enhanced function
        let dataLayer: any[] = [];
        try {
          dataLayer = await captureDataLayerWithPuppeteer(url, 30000);
        } catch (error) {
          console.error('Failed to capture datalayer for', url, error);
          // fallback: leave dataLayer empty
        }

        return {
          url,
          title: $('title').text() || 'Missing',
          description: $('meta[name="description"]').attr('content') || 'Missing',
          h1: $('h1').first().text() || 'Missing',
          canonical: $('link[rel="canonical"]').attr('href') || 'Missing',
          ogTitle: $('meta[property="og:title"]').attr('content') || 'Missing',
          ogDesc: $('meta[property="og:description"]').attr('content') || 'Missing',
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