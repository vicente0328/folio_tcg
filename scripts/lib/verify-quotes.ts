/**
 * Stage 3: Quote Verification
 *
 * Verifies that extracted quotes actually exist in the source text.
 * Uses fuzzy matching to handle minor OCR/encoding differences.
 * Rejects hallucinated quotes and removes near-duplicates.
 */

import { type RawQuote } from './gemini-quotes.js';

export interface VerifiedQuote extends RawQuote {
  matchScore: number;
}

export interface VerificationResult {
  verified: VerifiedQuote[];
  rejected: Array<{ quote: RawQuote; reason: string }>;
}

/** Normalize text for comparison: lowercase, collapse whitespace, strip punctuation variants */
function normalize(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    // Normalize various dash types to hyphen
    .replace(/[\u2013\u2014\u2015\u2212]/g, '-')
    // Normalize various quote types
    .replace(/[\u00AB\u00BB\u201C\u201D\u201E\u201F\u2018\u2019\u201A\u201B\u0022]/g, '"')
    .replace(/[\u2018\u2019\u0027\u0060\u00B4]/g, "'")
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compute similarity between two strings using longest common subsequence ratio.
 * More robust than Levenshtein for handling insertions/deletions from OCR.
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  // For very long strings, use a windowed approach
  const maxLen = Math.max(a.length, b.length);
  if (maxLen > 500) {
    return slidingWindowMatch(a, b);
  }

  // LCS-based similarity
  const lcsLen = lcs(a, b);
  return (2 * lcsLen) / (a.length + b.length);
}

/** LCS length using space-optimized DP */
function lcs(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

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

  return prev[n];
}

/** Sliding window match for long texts: find best matching window in source */
function slidingWindowMatch(quote: string, source: string): number {
  const qLen = quote.length;
  const windowSize = Math.min(qLen * 2, source.length);
  let bestScore = 0;

  // Slide in steps for efficiency
  const step = Math.max(1, Math.floor(qLen / 4));

  for (let i = 0; i <= source.length - qLen; i += step) {
    const window = source.slice(i, i + windowSize);
    // Quick check: count matching characters
    let commonChars = 0;
    const windowChars = new Map<string, number>();
    for (const c of window) {
      windowChars.set(c, (windowChars.get(c) || 0) + 1);
    }
    for (const c of quote) {
      const count = windowChars.get(c) || 0;
      if (count > 0) {
        commonChars++;
        windowChars.set(c, count - 1);
      }
    }
    const quickScore = commonChars / qLen;
    if (quickScore > bestScore) {
      bestScore = quickScore;
    }
  }

  return bestScore;
}

/** Check if a quote is contained (approximately) in the source text */
function findInSource(normalizedQuote: string, normalizedSource: string): number {
  // Exact substring match
  if (normalizedSource.includes(normalizedQuote)) {
    return 1.0;
  }

  // Try with minor variations (common OCR/encoding issues)
  const variations = [
    normalizedQuote.replace(/\.\.\./g, '…'),
    normalizedQuote.replace(/…/g, '...'),
    normalizedQuote.replace(/oe/g, 'œ'),
    normalizedQuote.replace(/œ/g, 'oe'),
    normalizedQuote.replace(/ae/g, 'æ'),
    normalizedQuote.replace(/æ/g, 'ae'),
  ];

  for (const v of variations) {
    if (normalizedSource.includes(v)) {
      return 0.98;
    }
  }

  // Fuzzy match: find best matching region
  return similarity(normalizedQuote, normalizedSource);
}

/** Check if two quotes overlap significantly */
function isNearDuplicate(a: string, b: string, threshold = 0.7): boolean {
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;

  // If one is a substring of the other
  if (longer.includes(shorter)) return true;

  // Check character overlap
  return similarity(a, b) >= threshold;
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

    // Skip empty or very short quotes
    if (normalizedQuote.length < 10) {
      rejected.push({ quote, reason: 'Too short (< 10 chars)' });
      continue;
    }

    // Check against source
    const score = findInSource(normalizedQuote, normalizedSource);

    // Short quotes require exact match
    const threshold = normalizedQuote.length < shortQuoteThreshold ? 0.95 : similarityThreshold;

    if (score < threshold) {
      rejected.push({
        quote,
        reason: `Match score ${score.toFixed(3)} below threshold ${threshold} — likely hallucinated`,
      });
      continue;
    }

    // Check for near-duplicates with already verified quotes
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
