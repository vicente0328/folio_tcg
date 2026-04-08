/**
 * Stage 3: Quote Verification
 *
 * Verifies that extracted quotes actually exist in the source text.
 * Uses keyword-anchored fuzzy matching to efficiently search large texts
 * without running out of memory.
 */

import { type RawQuote } from './gemini-quotes.js';

export interface VerifiedQuote extends RawQuote {
  matchScore: number;
}

export interface VerificationResult {
  verified: VerifiedQuote[];
  rejected: Array<{ quote: RawQuote; reason: string }>;
}

/** Normalize text for comparison: lowercase, collapse whitespace, normalize punctuation */
function normalize(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u2013\u2014\u2015\u2212]/g, '-')
    .replace(/[\u00AB\u00BB\u201C\u201D\u201E\u201F\u2018\u2019\u201A\u201B\u0022]/g, '"')
    .replace(/[\u2018\u2019\u0027\u0060\u00B4]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * LCS-based similarity for SHORT strings only (< 500 chars each).
 * Used for near-duplicate detection between quotes.
 */
function shortSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  const m = a.length;
  const n = b.length;
  let prev = new Uint16Array(n + 1);
  let curr = new Uint16Array(n + 1);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];
    curr.fill(0);
  }

  return (2 * prev[n]) / (m + n);
}

/**
 * Extract significant words from a quote for keyword-anchored search.
 * Picks the longest/rarest words that are most likely to uniquely identify the passage.
 */
function extractKeywords(text: string, count = 3): string[] {
  const words = text.split(' ').filter(w => w.length >= 4);
  // Sort by length (longer = rarer), take top N
  words.sort((a, b) => b.length - a.length);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const w of words) {
    if (!seen.has(w)) {
      seen.add(w);
      result.push(w);
      if (result.length >= count) break;
    }
  }
  return result;
}

/**
 * Find quote in source using keyword-anchored approach:
 * 1. Find positions of keywords in source text
 * 2. Extract local windows around each keyword hit
 * 3. Compare quote against each window (small, bounded comparison)
 */
function findInSource(normalizedQuote: string, normalizedSource: string): number {
  // Exact substring match
  if (normalizedSource.includes(normalizedQuote)) {
    return 1.0;
  }

  // Try common OCR/encoding variations
  const variations = [
    normalizedQuote.replace(/\.\.\./g, '…'),
    normalizedQuote.replace(/…/g, '...'),
    normalizedQuote.replace(/oe/g, 'œ'),
    normalizedQuote.replace(/œ/g, 'oe'),
    normalizedQuote.replace(/ae/g, 'æ'),
    normalizedQuote.replace(/æ/g, 'ae'),
  ];
  for (const v of variations) {
    if (normalizedSource.includes(v)) return 0.98;
  }

  // Keyword-anchored fuzzy search
  const keywords = extractKeywords(normalizedQuote);
  if (keywords.length === 0) return 0;

  const quoteLen = normalizedQuote.length;
  const windowPadding = Math.max(quoteLen, 200); // search window around keyword
  let bestScore = 0;

  for (const keyword of keywords) {
    let searchFrom = 0;
    while (searchFrom < normalizedSource.length) {
      const pos = normalizedSource.indexOf(keyword, searchFrom);
      if (pos === -1) break;

      // Extract a window around the keyword hit
      const winStart = Math.max(0, pos - windowPadding);
      const winEnd = Math.min(normalizedSource.length, pos + keyword.length + windowPadding);
      const window = normalizedSource.slice(winStart, winEnd);

      // Count how many characters of the quote appear in order in this window
      const score = orderedMatchScore(normalizedQuote, window);
      if (score > bestScore) bestScore = score;

      // If we found a very good match, stop early
      if (bestScore >= 0.95) return bestScore;

      searchFrom = pos + 1;
    }
  }

  // Also try matching the first N characters as an anchor
  const prefix = normalizedQuote.slice(0, Math.min(30, Math.floor(quoteLen / 2)));
  if (prefix.length >= 10) {
    let searchFrom = 0;
    while (searchFrom < normalizedSource.length) {
      const pos = normalizedSource.indexOf(prefix, searchFrom);
      if (pos === -1) break;

      const winStart = pos;
      const winEnd = Math.min(normalizedSource.length, pos + quoteLen + 100);
      const window = normalizedSource.slice(winStart, winEnd);

      const score = orderedMatchScore(normalizedQuote, window);
      if (score > bestScore) bestScore = score;
      if (bestScore >= 0.95) return bestScore;

      searchFrom = pos + 1;
    }
  }

  return bestScore;
}

/**
 * Score how well `quote` matches within `window` by counting ordered character matches.
 * Much more memory-efficient than LCS for large strings.
 */
function orderedMatchScore(quote: string, window: string): number {
  let qi = 0;
  let wi = 0;
  let matches = 0;

  while (qi < quote.length && wi < window.length) {
    if (quote[qi] === window[wi]) {
      matches++;
      qi++;
      wi++;
    } else {
      wi++;
    }
  }

  return matches / quote.length;
}

/** Check if two quotes overlap significantly */
function isNearDuplicate(a: string, b: string, threshold = 0.7): boolean {
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;

  if (longer.includes(shorter)) return true;

  // Only use LCS for short quote-vs-quote comparisons (bounded size)
  if (shorter.length < 500 && longer.length < 500) {
    return shortSimilarity(a, b) >= threshold;
  }

  // For longer quotes, use ordered match
  return orderedMatchScore(shorter, longer) >= threshold;
}

/**
 * Verify quotes against source text.
 * Returns verified quotes and rejected quotes with reasons.
 */
export function verifyQuotes(
  quotes: RawQuote[],
  sourceText: string,
  similarityThreshold = 0.85,
  shortQuoteThreshold = 50,
): VerificationResult {
  const normalizedSource = normalize(sourceText);
  const verified: VerifiedQuote[] = [];
  const rejected: Array<{ quote: RawQuote; reason: string }> = [];

  for (const quote of quotes) {
    const normalizedQuote = normalize(quote.original);

    if (normalizedQuote.length < 10) {
      rejected.push({ quote, reason: 'Too short (< 10 chars)' });
      continue;
    }

    const score = findInSource(normalizedQuote, normalizedSource);
    const threshold = normalizedQuote.length < shortQuoteThreshold ? 0.95 : similarityThreshold;

    if (score < threshold) {
      rejected.push({
        quote,
        reason: `Match score ${score.toFixed(3)} below threshold ${threshold} — likely hallucinated`,
      });
      continue;
    }

    const isDup = verified.some(v =>
      isNearDuplicate(normalize(v.original), normalizedQuote)
    );
    if (isDup) {
      rejected.push({ quote, reason: 'Near-duplicate of already verified quote' });
      continue;
    }

    verified.push({ ...quote, matchScore: score });
  }

  return { verified, rejected };
}
