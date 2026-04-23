import { getSearchRuntimeConfig } from "../models/settingsModel.js";

function isWebSearchIntent(text) {
  const query = String(text || "").trim().toLowerCase();
  if (!query) return false;

  return /(latest|today|current|news|recent|happened|price|stock|weather|search|look up|lookup|find online|web|internet|who is|what is)/i.test(query);
}

function flattenDuckDuckGoTopics(topics = [], acc = []) {
  for (const topic of topics) {
    if (!topic || typeof topic !== "object") {
      continue;
    }

    if (Array.isArray(topic.Topics)) {
      flattenDuckDuckGoTopics(topic.Topics, acc);
      continue;
    }

    const text = String(topic.Text || "").trim();
    const url = String(topic.FirstURL || "").trim();
    if (text && url) {
      acc.push({ title: text.split(" - ")[0].trim(), snippet: text, url });
    }
  }

  return acc;
}

export async function searchWeb(query, options = {}) {
  const config = getSearchRuntimeConfig();
  const maxResults = Math.max(1, Number(options.maxResults || config.maxResults || 4));
  const timeoutMs = Math.max(1000, Number(options.timeoutMs || config.timeoutMs || 7000));

  if (!config.enabled) {
    return { query, provider: config.provider, results: [], disabled: true };
  }

  const q = String(query || "").trim();
  if (!q) {
    return { query: "", provider: config.provider, results: [] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=0`;
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return { query: q, provider: config.provider, results: [] };
    }

    const payload = await response.json();
    const abstractText = String(payload?.AbstractText || "").trim();
    const abstractUrl = String(payload?.AbstractURL || "").trim();

    const related = flattenDuckDuckGoTopics(payload?.RelatedTopics || []);
    const merged = [];

    if (abstractText && abstractUrl) {
      merged.push({
        title: String(payload?.Heading || q).trim() || q,
        snippet: abstractText,
        url: abstractUrl,
      });
    }

    for (const item of related) {
      if (merged.length >= maxResults) break;
      if (merged.some((entry) => entry.url === item.url)) continue;
      merged.push(item);
    }

    return {
      query: q,
      provider: config.provider,
      results: merged.slice(0, maxResults),
      timeoutMs,
    };
  } catch {
    return {
      query: q,
      provider: config.provider,
      results: [],
      timeoutMs,
      error: "Search provider unavailable.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function shouldUseWebSearch({ query = "", forced = false } = {}) {
  if (forced) {
    return true;
  }

  const config = getSearchRuntimeConfig();
  if (!config.enabled || !config.autoForQueries) {
    return false;
  }

  return isWebSearchIntent(query);
}

export function buildWebSearchPromptSection(searchResult) {
  const entries = Array.isArray(searchResult?.results) ? searchResult.results : [];
  if (!entries.length) {
    return "";
  }

  const lines = entries.map((entry, index) => {
    const title = String(entry.title || `Source ${index + 1}`).trim();
    const snippet = String(entry.snippet || "").trim();
    const url = String(entry.url || "").trim();
    return `- [${index + 1}] ${title}\n  ${snippet}\n  URL: ${url}`;
  });

  return [
    "WEB SEARCH CONTEXT (prefer these sources for factual/current claims):",
    ...lines,
    "If you cite these, reference them in-line like [1], [2], etc.",
  ].join("\n");
}
