import { NextResponse } from "next/server";

const CHANNEL_URL = "https://www.youtube.com/@FelipeSousza";

type ChannelResponse = {
  name: string;
  handle: string;
  avatar: string;
  subscribers: string;
  views: string;
  videos: string;
  channelUrl: string;
};

export const revalidate = 1800;

const normalizeText = (value: string) =>
  value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

const cleanCount = (value: string) => {
  const normalized = normalizeText(value);
  const cleaned = normalized
    .replace(/inscritos?|subscribers?/gi, "")
    .replace(/visualiza(?:\u00e7|c)(?:\u00f5|o)es|views?/gi, "")
    .replace(/v[i\u00ed]deos?|videos?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || normalized;
};

function normalizeCount(raw: string): string {
  const cleaned = raw
    .replace(/visualiza(?:\u00e7|c)(?:\u00f5|o)es|views/gi, "")
    .trim();
  const num = cleaned.match(/[0-9][0-9\.,]*/)?.[0];
  return num ?? "\u2014";
}

function extractViews(html: string): string {
  const candidates: string[] = [];

  const simpleTextRegex =
    /"viewCountText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/g;
  for (const match of html.matchAll(simpleTextRegex)) {
    if (match[1]) candidates.push(normalizeCount(match[1]));
  }

  const runsRegex =
    /"viewCountText"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/g;
  for (const match of html.matchAll(runsRegex)) {
    if (match[1]) candidates.push(normalizeCount(match[1]));
  }

  const fallbackRegex =
    /([0-9][0-9\.,]*)\s+(visualiza(?:\u00e7|c)(?:\u00f5|o)es|views)/gi;
  for (const match of html.matchAll(fallbackRegex)) {
    if (match[1]) candidates.push(match[1]);
  }

  const best = candidates
    .map((value) => ({
      value,
      numeric: parseInt(value.replace(/[^\d]/g, ""), 10) || 0,
    }))
    .sort((a, b) => b.numeric - a.numeric)[0]?.value;

  return best || "\u2014";
}

const textFromRuns = (node: any): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node.simpleText === "string") return node.simpleText;
  if (Array.isArray(node.runs)) {
    return node.runs.map((run: { text?: string }) => run.text ?? "").join("");
  }
  return "";
};

const pickLastUrl = (sources?: Array<{ url?: string }>) => {
  if (!sources?.length) return "";
  return sources[sources.length - 1]?.url ?? "";
};

const extractInitialData = (html: string) => {
  const marker = "ytInitialData = ";
  const index = html.indexOf(marker);
  if (index === -1) return null;

  let start = index + marker.length;
  while (start < html.length && html[start] !== "{") start++;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < html.length; i++) {
    const ch = html[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }

    if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        const json = html.slice(start, i + 1);
        try {
          return JSON.parse(json);
        } catch {
          return null;
        }
      }
    }
  }

  return null;
};

export async function GET() {
  const fallback: ChannelResponse = {
    name: "\u2014",
    handle: "\u2014",
    avatar: "\u2014",
    subscribers: "\u2014",
    views: "\u2014",
    videos: "\u2014",
    channelUrl: CHANNEL_URL,
  };

  try {
    const response = await fetch(CHANNEL_URL, {
      next: { revalidate },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(fallback);
    }

    const html = await response.text();
    let viewsFromHtml = extractViews(html);
    const data = extractInitialData(html);
    if (!data) {
      return NextResponse.json({
        ...fallback,
        views: viewsFromHtml,
      });
    }

    const headerRenderer = data.header?.pageHeaderRenderer;
    const headerViewModel = headerRenderer?.content?.pageHeaderViewModel;
    const legacyHeader = data.header?.c4TabbedHeaderRenderer;
    const metadata = data.metadata?.channelMetadataRenderer;
    const microformat = data.microformat?.microformatDataRenderer;

    const nameCandidate =
      headerRenderer?.pageTitle ??
      headerViewModel?.title?.dynamicTextViewModel?.text?.content ??
      metadata?.title ??
      microformat?.title ??
      "";

    const metadataRows =
      headerViewModel?.metadata?.contentMetadataViewModel?.metadataRows ?? [];
    const metadataTexts = metadataRows.flatMap((row: any) =>
      (row.metadataParts ?? [])
        .map((part: any) => part?.text?.content)
        .filter(Boolean)
    );

    const vanityHandle = metadata?.vanityChannelUrl?.includes("@")
      ? metadata.vanityChannelUrl.split("@")[1]
      : "";

    const handleCandidate =
      metadataTexts.find((text: string) => text.trim().startsWith("@")) ??
      legacyHeader?.channelHandleText?.runs?.[0]?.text ??
      vanityHandle;

    const avatarCandidate =
      pickLastUrl(
        headerViewModel?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel
          ?.image?.sources
      ) ||
      pickLastUrl(metadata?.avatar?.thumbnails) ||
      pickLastUrl(microformat?.thumbnail?.thumbnails);

    let subscribers = "";
    let videos = "";

    for (const text of metadataTexts) {
      const normalized = normalizeText(text);
      const lower = normalized.toLowerCase();
      if (lower.includes("inscrito") || lower.includes("subscriber")) {
        subscribers = cleanCount(normalized);
      } else if (lower.includes("v\u00eddeo") || lower.includes("video")) {
        videos = cleanCount(normalized);
      }
    }

    const legacySubscribers = cleanCount(
      textFromRuns(legacyHeader?.subscriberCountText)
    );
    const legacyVideos = cleanCount(textFromRuns(legacyHeader?.videosCountText));

    const handleNormalized = handleCandidate ? normalizeText(handleCandidate) : "";

    // Prefer total channel views from /about when available.
    try {
      const aboutResponse = await fetch(`${CHANNEL_URL}/about`, {
        next: { revalidate },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        },
      });

      if (aboutResponse.ok) {
        const aboutHtml = await aboutResponse.text();
        const aboutViews = extractViews(aboutHtml);
        if (aboutViews !== "\u2014") {
          viewsFromHtml = aboutViews;
        }
      }
    } catch {
      // Ignore and keep fallback.
    }


    const responsePayload: ChannelResponse = {
      name: nameCandidate ? normalizeText(nameCandidate) : fallback.name,
      handle: handleNormalized
        ? handleNormalized.startsWith("@")
          ? handleNormalized
          : `@${handleNormalized}`
        : fallback.handle,
      avatar: avatarCandidate || fallback.avatar,
      subscribers: subscribers || legacySubscribers || fallback.subscribers,
      views: viewsFromHtml || fallback.views,
      videos: videos || legacyVideos || fallback.videos,
      channelUrl: CHANNEL_URL,
    };

    return NextResponse.json(responsePayload);
  } catch {
    return NextResponse.json(fallback);
  }
}
