import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

import { isLlmConfigured, synthesizeResearchProfile } from "./llmService.js";

let youtubeTranscriptFetcherPromise;

const DEFAULT_TIMEOUT_MS = Number(process.env.RESEARCH_TIMEOUT_MS || 12000);
const TRAIT_LEXICON = [
  "brave",
  "clever",
  "compassionate",
  "confident",
  "cynical",
  "disciplined",
  "empathetic",
  "formal",
  "funny",
  "idealistic",
  "impulsive",
  "inventive",
  "loyal",
  "measured",
  "optimistic",
  "playful",
  "reflective",
  "rebellious",
  "restless",
  "sarcastic",
  "strategic",
  "stoic",
  "witty",
];

function withTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  return fetch(url, {
    ...options,
    signal: controller.signal,
    headers: {
      "User-Agent": "Voxis/1.0 (+https://localhost)",
      Accept: "application/json, text/html, text/plain;q=0.9, */*;q=0.8",
      ...(options.headers || {}),
    },
  }).finally(() => clearTimeout(timer));
}

function dedupe(items) {
  return [...new Set(items.filter(Boolean))];
}

function normalizeSourceUrl(url) {
  try {
    const parsed = new URL(String(url || "").trim());
    parsed.hash = "";
    if ((parsed.protocol === "https:" && parsed.port === "443") || (parsed.protocol === "http:" && parsed.port === "80")) {
      parsed.port = "";
    }

    if (parsed.hostname === "en.wikipedia.org") {
      parsed.search = "";
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return String(url || "").trim().replace(/\/$/, "");
  }
}

function createSourceId(url, index) {
  return `${index + 1}-${Buffer.from(url).toString("base64url").slice(0, 12)}`;
}

function isLikelyAnimeQuery(query) {
  const text = String(query || "").toLowerCase();
  if (!text) return false;
  return /(anime|manga|otaku|isekai|shonen|shojo|senpai|chan|kun|sama|jutsu|hokage|kamehameha|one piece|naruto|bleach|dragon ball)/i.test(text);
}

function buildSuggestedReferenceUrls(query) {
  const q = String(query || "").trim();
  if (!q) return [];

  const encoded = encodeURIComponent(q);
  const base = [
    `https://en.wikipedia.org/wiki/Special:Search?search=${encoded}`,
    `https://www.wikiquote.org/w/index.php?search=${encoded}`,
    `https://www.fandom.com/?s=${encoded}`,
  ];

  if (!isLikelyAnimeQuery(q)) {
    return base;
  }

  return [
    ...base,
    `https://myanimelist.net/anime.php?q=${encoded}&cat=anime`,
    `https://myanimelist.net/manga.php?q=${encoded}&cat=manga`,
    `https://anilist.co/search/anime?search=${encoded}`,
    `https://anilist.co/search/manga?search=${encoded}`,
    `https://myanimelist.net/character.php?q=${encoded}&cat=character`,
  ];
}

async function getYouTubeTranscriptFetcher() {
  if (!youtubeTranscriptFetcherPromise) {
    youtubeTranscriptFetcherPromise = import("youtube-transcript/dist/youtube-transcript.esm.js")
      .then((module) => {
        return (
          module.fetchTranscript ||
          module.YoutubeTranscript?.fetchTranscript?.bind(module.YoutubeTranscript) ||
          module.default?.fetchTranscript ||
          module.default?.YoutubeTranscript?.fetchTranscript?.bind(module.default.YoutubeTranscript) ||
          null
        );
      })
      .catch(() => null);
  }

  return youtubeTranscriptFetcherPromise;
}

function truncate(text, maxLength = 900) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function tokenize(text) {
  return normalizeWhitespace(String(text || ""))
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function getQueryOverlapScore(queryTokens, text) {
  if (!queryTokens.length || !text) {
    return 0;
  }

  const textTokens = new Set(tokenize(text));
  const matches = queryTokens.filter((token) => textTokens.has(token)).length;
  return matches / queryTokens.length;
}

function extractQuotedPhrases(text) {
  const matches = text.match(/["“]([^"”]{8,120})["”]/g) || [];
  return dedupe(
    matches
      .map((phrase) => phrase.replace(/^["“]|["”]$/g, "").trim())
      .filter((phrase) => phrase.split(" ").length <= 16),
  ).slice(0, 6);
}

function extractSpeechStyle(text) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const speechSentence = sentences.find((sentence) =>
    /(speak|speaks|speech|voice|tone|delivery|accent|dialogue|phrases|manner)/i.test(sentence),
  );

  if (speechSentence) {
    return truncate(normalizeWhitespace(speechSentence), 220);
  }

  return "";
}

function extractTraits(text) {
  const lowerText = text.toLowerCase();
  return TRAIT_LEXICON.filter((trait) => lowerText.includes(trait)).slice(0, 6);
}

function extractQuirks(text) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return dedupe(
    sentences
      .filter((sentence) => /(often|tends to|signature|habit|usually|frequently|known for)/i.test(sentence))
      .map((sentence) => truncate(normalizeWhitespace(sentence), 140)),
  ).slice(0, 5);
}

function buildAvatarLikenessHint({ name, description, sourceQuery, sourceNotes }) {
  const text = normalizeWhitespace(
    [description, ...((sourceNotes || []).map((note) => note?.text || ""))].join(" "),
  );
  const visualSentence = text
    .split(/(?<=[.!?])\s+/)
    .find((sentence) => /(hair|eyes|outfit|armor|robe|cloak|jacket|mask|glasses|goggles|scar|aura|smile|expression|silhouette|look|appearance)/i.test(sentence));

  const base = visualSentence || `${name || sourceQuery} inspired silhouette with expressive eyes and distinctive aura`;
  return truncate(normalizeWhitespace(base), 120);
}

async function fetchWikipediaSummary(query) {
  const trimmedQuery = String(query || "").trim();
  if (!trimmedQuery) {
    return null;
  }

  try {
    const searchResponse = await withTimeout(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(trimmedQuery)}&format=json`,
    );

    if (!searchResponse.ok) {
      return null;
    }

    const searchData = await searchResponse.json();
    const topResult = searchData?.query?.search?.[0]?.title;
    if (!topResult) {
      return null;
    }

    const summaryResponse = await withTimeout(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topResult.replace(/ /g, "_"))}`,
    );

    if (!summaryResponse.ok) {
      return null;
    }

    const summaryData = await summaryResponse.json();
    const summary = normalizeWhitespace(summaryData?.extract || "");

    if (!summary) {
      return null;
    }

    return {
      url: summaryData?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(topResult.replace(/ /g, "_"))}`,
      title: summaryData?.title || topResult,
      text: truncate(summary, 1200),
      imageUrl: summaryData?.thumbnail?.source || summaryData?.originalimage?.source || null,
      sourceType: "wikipedia",
    };
  } catch {
    return null;
  }
}

async function fetchYouTubeMetadata(url) {
  try {
    const oembedResponse = await withTimeout(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    );

    if (!oembedResponse.ok) {
      return null;
    }

    const data = await oembedResponse.json();
    let transcriptText = "";

    try {
      const fetchTranscript = await getYouTubeTranscriptFetcher();
      const transcript = fetchTranscript ? await fetchTranscript(url) : [];
      transcriptText = normalizeWhitespace(
        transcript
          .map((entry) => entry.text)
          .join(" "),
      );
    } catch {
      transcriptText = "";
    }

    const transcriptSnippet = transcriptText
      ? truncate(transcriptText, 1500)
      : "Transcript unavailable. Only metadata was captured for this video.";

    return {
      url,
      title: data.title || "YouTube video",
      text: truncate(
        normalizeWhitespace(
          `${data.title || ""}. Creator: ${data.author_name || "unknown"}. ${transcriptSnippet}`,
        ),
        1600,
      ),
      sourceType: "youtube",
      transcriptAvailable: Boolean(transcriptText),
    };
  } catch {
    return null;
  }
}

async function fetchReadablePage(url) {
  try {
    const response = await withTimeout(url);
    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();
    const metaDescription =
      dom.window.document.querySelector('meta[name="description"]')?.getAttribute("content") ||
      dom.window.document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
      "";

    const title =
      article?.title ||
      dom.window.document.querySelector("title")?.textContent ||
      url;

    const text = normalizeWhitespace(article?.textContent || metaDescription || "");
    if (!text) {
      return null;
    }

    const host = (() => {
      try {
        return new URL(url).hostname.toLowerCase();
      } catch {
        return "";
      }
    })();

    const sourceType = host.includes("myanimelist.net")
      ? "myanimelist"
      : host.includes("anilist.co")
        ? "anilist"
        : host.includes("fandom.com")
          ? "fandom"
          : host.includes("wiki")
            ? "wiki"
            : /wikipedia\.org/.test(url)
              ? "wikipedia"
              : "web";

    return {
      url,
      title: truncate(title, 140),
      text: truncate(text, 1200),
      sourceType,
      transcriptAvailable: false,
    };
  } catch {
    return null;
  }
}

async function fetchSource(url) {
  if (/youtube\.com|youtu\.be/.test(url)) {
    return fetchYouTubeMetadata(url);
  }

  return fetchReadablePage(url);
}

function buildFallbackProfile({ name, description, sourceQuery, sourceUrls, sourceNotes, creativeContext = "default" }) {
  const combinedText = normalizeWhitespace(
    [description, ...sourceNotes.map((source) => source.text)].filter(Boolean).join(" "),
  );
  const speechStyle = extractSpeechStyle(combinedText);
  const notablePhrases = extractQuotedPhrases(combinedText);
  const traits = extractTraits(combinedText);
  const quirks = extractQuirks(combinedText);

  const researchSummary = sourceNotes.length
    ? sourceNotes
        .map((source) => `${source.title}: ${truncate(source.text, 220)}`)
        .join("\n\n")
    : "No external sources were fetched. Use the manual description as the primary guide.";

  return {
    name,
    descriptionSuggestion: description || truncate(combinedText, 420),
    traits: traits.length
      ? traits
      : creativeContext === "default"
        ? ["distinctive", "character-driven"]
        : ["driven", "internally consistent"],
    quirks: quirks.length ? quirks : ["speaks in a recognizable cadence"],
    mood: "Focused",
    speechStyle,
    notablePhrases,
    researchSummary,
    sourceQuery,
    sourceUrls,
    sources: sourceNotes,
    avatarLikenessHint: buildAvatarLikenessHint({
      name,
      description,
      sourceQuery,
      sourceNotes,
    }),
  };
}

function rankSources(sourceNotes, query) {
  const queryTokens = tokenize(query);
  const uniqueSources = [];
  const seenUrls = new Set();

  for (const source of sourceNotes) {
    const normalizedUrl = normalizeSourceUrl(source.url);
    if (!normalizedUrl || seenUrls.has(normalizedUrl)) {
      continue;
    }

    seenUrls.add(normalizedUrl);
    uniqueSources.push({
      ...source,
      url: normalizedUrl,
    });
  }

  return uniqueSources
    .map((source) => {
      const typeWeight = {
        wikipedia: 0.92,
        myanimelist: 0.9,
        anilist: 0.86,
        fandom: 0.79,
        wiki: 0.82,
        youtube: source.transcriptAvailable ? 0.88 : 0.62,
        web: 0.74,
      }[source.sourceType] || 0.68;

      const titleOverlap = getQueryOverlapScore(queryTokens, source.title);
      const bodyOverlap = getQueryOverlapScore(queryTokens, source.text);
      const transcriptBonus = source.transcriptAvailable ? 0.1 : 0;
      const score = Math.round(
        Math.min(
          100,
          (typeWeight * 0.45 + titleOverlap * 0.25 + bodyOverlap * 0.2 + transcriptBonus) * 100,
        ),
      );

      const reasons = [];
      if (source.sourceType === "wikipedia") {
        reasons.push("High-trust reference source");
      }
      if (source.sourceType === "myanimelist") {
        reasons.push("Anime metadata source matched to query");
      }
      if (source.sourceType === "anilist") {
        reasons.push("Anime database cross-reference");
      }
      if (source.sourceType === "fandom") {
        reasons.push("Character/franchise wiki context");
      }
      if (source.sourceType === "youtube" && source.transcriptAvailable) {
        reasons.push("Transcript captured from video dialogue");
      }
      if (titleOverlap >= 0.3) {
        reasons.push("Strong query match in title");
      }
      if (bodyOverlap >= 0.35) {
        reasons.push("Body text overlaps with the research query");
      }

      return {
        ...source,
        score,
        reasons: reasons.length ? reasons : ["Useful supplemental reference"],
      };
    })
    .sort((left, right) => right.score - left.score)
    .map((source, index) => ({
      ...source,
      id: source.id || createSourceId(source.url, index),
      rank: index + 1,
      selected: index < 4,
    }));
}

export async function buildResearchProfile({ name, description, sourceQuery, sourceUrls, creativeContext = "default" }) {
  const query = String(sourceQuery || name || "").trim();
  const userUrls = dedupe((sourceUrls || []).map((url) => String(url).trim()));
  const seededUrls = buildSuggestedReferenceUrls(query);
  const urls = dedupe([...userUrls, ...seededUrls]);

  const wikipediaSource = await fetchWikipediaSummary(query);
  const remoteSources = await Promise.all(urls.map((url) => fetchSource(url)));
  const sourceNotes = rankSources([wikipediaSource, ...remoteSources].filter(Boolean), query);

  const fallbackProfile = buildFallbackProfile({
    name,
    description,
    sourceQuery: query,
    sourceUrls: dedupe([...(wikipediaSource ? [wikipediaSource.url] : []), ...urls]),
    sourceNotes,
    creativeContext,
  });
  fallbackProfile.avatarImageUrl = "";

  if (!sourceNotes.length || !isLlmConfigured()) {
    return fallbackProfile;
  }

  try {
    const synthesized = await synthesizeResearchProfile({
      name,
      description,
      sourceQuery: query,
      sourceNotes,
      fallbackProfile,
      creativeContext,
    });

    return {
      ...fallbackProfile,
      ...synthesized,
      sourceQuery: query,
      sourceUrls: fallbackProfile.sourceUrls,
      sources: sourceNotes,
      avatarImageUrl: fallbackProfile.avatarImageUrl,
    };
  } catch {
    return fallbackProfile;
  }
}
