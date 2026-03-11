import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { filterSchema, fetchAllWithPuppeteer, getOpenGraphTags, getTwitterTags } from '../seo/helpers';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { pairs } = body; // [{ uatUrl, prodUrl }]

  if (!Array.isArray(pairs) || pairs.length === 0) {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
  }

  const results = await Promise.all(
    pairs.map(async (pair: { uatUrl: string, prodUrl: string }) => {
      const fetchSeo = async (url: string) => {
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

          const links: { href?: string, anchor: string }[] = [];
          $('a').each((_, el) => {
            const href = $(el).attr('href');
            const anchor = $(el).text().trim();
            links.push({ href, anchor });
          });

          const robotsTag = $('meta[name="robots"]').attr('content') || '';
          const xRobotsTag = (responseHeaders['x-robots-tag'] as string) || '';

          // Cheerio-based OG/Twitter as guaranteed fallback
          const cheerioOg = getOpenGraphTags(html);
          const cheerioTwitter = getTwitterTags(html);
          let og: Record<string, string | null> = { ...cheerioOg };
          let twitter: Record<string, string | null> = { ...cheerioTwitter };
          let schema: unknown[] = [];

          // ONE Puppeteer visit per URL — extracts OG + Twitter + Schema together
          try {
            const puppeteerData = await fetchAllWithPuppeteer(url, 30000);
            og = { ...cheerioOg, ...puppeteerData.og };
            twitter = { ...cheerioTwitter, ...puppeteerData.twitter };
            schema = puppeteerData.schema.map(filterSchema).filter(v => v !== undefined) as unknown[];
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
          };
        } catch (err: unknown) {
          return {
            url,
            error: (err as Error).message || 'Failed to fetch',
          };
        }
      };

      // Fetch UAT and PROD in parallel for speed
      const [uat, prod] = await Promise.all([
        (async () => {
          try {
            return await fetchSeo(pair.uatUrl);
          } catch (err: unknown) {
            return { url: pair.uatUrl, error: (err as Error).message || 'Failed to fetch' };
          }
        })(),
        (async () => {
          try {
            return await fetchSeo(pair.prodUrl);
          } catch (err: unknown) {
            return { url: pair.prodUrl, error: (err as Error).message || 'Failed to fetch' };
          }
        })(),
      ]);

      // If UAT failed but PROD succeeded, mark for frontend
      if (uat.error && !prod.error) {
        (uat as { [key: string]: unknown }).specialClientFetch = true;
      }
      return { uat, prod };
    })
  );

  return NextResponse.json({ results });
}