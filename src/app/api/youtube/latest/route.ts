import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

const RSS_URL =
  "https://www.youtube.com/feeds/videos.xml?channel_id=UChjkZYlFdo_iMss2qgqqCew";
const MAX_VIDEOS = 6;
const POOL_SIZE = 30;
const BATCH_SIZE = 10;
const MAX_CHECKS = 18;
const OEMBED_REVALIDATE = 600;
const SHORTS_REVALIDATE = 600;
const CHECK_TIMEOUT_MS = 1200;

type CacheEntry = {
  ok: boolean;
  ts: number;
};

const inMemoryCache = new Map<string, CacheEntry>();

type VideoItem = {
  id: string;
  title: string;
  link: string;
  thumbnail: string;
  published: string;
};

export const revalidate = 600;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

const withTimeout = async <T,>(promise: Promise<T>, ms: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), ms)
      ),
    ]);
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
};

async function isNormalVideo(videoId: string): Promise<boolean> {
  const cached = inMemoryCache.get(videoId);
  if (cached && Date.now() - cached.ts < OEMBED_REVALIDATE * 1000) {
    return cached.ok;
  }

  try {
    const shortsUrl = `https://www.youtube.com/shorts/${videoId}`;
    const shortsRes = await withTimeout(
      fetch(shortsUrl, {
        method: "HEAD",
        redirect: "manual",
        next: { revalidate: SHORTS_REVALIDATE },
      }),
      CHECK_TIMEOUT_MS
    );

    if (shortsRes.status === 200) {
      inMemoryCache.set(videoId, { ok: false, ts: Date.now() });
      return false;
    }

    if (shortsRes.status >= 300 && shortsRes.status < 400) {
      const location = shortsRes.headers.get("location") ?? "";
      const ok = location.includes("/watch");
      inMemoryCache.set(videoId, { ok, ts: Date.now() });
      return ok;
    }

    // Fallback: oEmbed heuristic (some IDs may not respond to HEAD well)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await withTimeout(
      fetch(oembedUrl, { next: { revalidate: OEMBED_REVALIDATE } }),
      CHECK_TIMEOUT_MS
    );
    if (!res.ok) {
      inMemoryCache.set(videoId, { ok: false, ts: Date.now() });
      return false;
    }
    const data = await res.json();
    const w = Number(data?.thumbnail_width);
    const h = Number(data?.thumbnail_height);
    const ok = Boolean(w && h && w >= h);
    inMemoryCache.set(videoId, { ok, ts: Date.now() });
    return ok;
  } catch {
    inMemoryCache.set(videoId, { ok: false, ts: Date.now() });
    return false;
  }
}

export async function GET() {
  const fallback = { items: [] as VideoItem[], videos: [] as VideoItem[] };

  try {
    const response = await fetch(RSS_URL, {
      next: { revalidate },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(fallback);
    }

    const xml = await response.text();
    const parsed = parser.parse(xml);
    const entriesRaw = parsed?.feed?.entry;
    const entries = Array.isArray(entriesRaw)
      ? entriesRaw
      : entriesRaw
      ? [entriesRaw]
      : [];

    const candidates = entries
      .slice(0, POOL_SIZE)
      .map((entry: any) => {
        const id = entry?.["yt:videoId"] ?? "";
        const title = entry?.title ?? "";
        const link = Array.isArray(entry?.link)
          ? entry.link[0]?.href ?? ""
          : entry?.link?.href ?? "";
        const thumbnail =
          entry?.["media:group"]?.["media:thumbnail"]?.url ??
          entry?.["media:thumbnail"]?.url ??
          "";
        const published = entry?.published ?? "";

        if (!id || !title || !link) return null;
        return { id, title, link, thumbnail, published };
      })
      .filter((video: VideoItem | null): video is VideoItem => Boolean(video));

    const picked: VideoItem[] = [];
    let checks = 0;

    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      if (picked.length >= MAX_VIDEOS || checks >= MAX_CHECKS) break;

      const remaining = MAX_CHECKS - checks;
      const batch = candidates.slice(i, i + Math.min(BATCH_SIZE, remaining));
      if (!batch.length) break;

      const results = await Promise.allSettled(
        batch.map((video) => isNormalVideo(video.id))
      );
      checks += batch.length;

      results.forEach((result, idx) => {
        if (result.status === "fulfilled" && result.value) {
          picked.push(batch[idx]);
        }
      });

      if (picked.length >= MAX_VIDEOS) break;
    }

    const items = picked.slice(0, MAX_VIDEOS);
    return NextResponse.json({ items, videos: items });
  } catch {
    return NextResponse.json(fallback);
  }
}
