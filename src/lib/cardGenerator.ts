/**
 * Browser-compatible Card Generator Pipeline
 *
 * Runs the full 5-stage pipeline in the browser:
 *   1. Fetch source text from Gutenberg
 *   2. Select quotes via Gemini
 *   3. Verify quotes against source text
 *   4. Translate + generate BTL via Gemini
 *   5. Assign card IDs + save to Firestore
 */

import { GoogleGenAI } from '@google/genai';
import { createCard } from './firestore';
import { type CardData } from '../data/cards';

// ─── Types ───

export interface GeneratorConfig {
  book: string;
  author: string;
  lang: string;
  gutenbergId: number;
  prefix: string;
  count: number;
}

interface RawQuote {
  original: string;
  chapter: string;
  grade: 'Legendary' | 'Epic' | 'Rare' | 'Common';
  significance: string;
}

interface VerifiedQuote extends RawQuote {
  matchScore: number;
}

interface EnrichedQuote extends VerifiedQuote {
  translation: string;
  btl: string;
}

export interface GeneratedCard extends CardData {
  significance: string;
}

type LogFn = (line: string) => void;

// ─── Stage 1: Source Text ───

async function fetchSourceText(gutenbergId: number, log: LogFn): Promise<string> {
  log('📖 Stage 1: Fetching source text...');

  const baseUrls = [
    `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`,
    `https://www.gutenberg.org/files/${gutenbergId}/${gutenbergId}-0.txt`,
  ];

  // CORS proxies to try (Gutenberg blocks direct browser requests)
  const proxyWrappers = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  let raw = '';

  // Try each proxy with each Gutenberg URL
  for (const wrapProxy of proxyWrappers) {
    if (raw) break;
    for (const baseUrl of baseUrls) {
      const url = wrapProxy(baseUrl);
      try {
        log(`  Trying proxy: ${url.split('?')[0]}...`);
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          if (text && text.length > 500) {
            raw = text;
            log(`  ✓ Fetched successfully`);
            break;
          }
        }
      } catch {
        continue;
      }
    }
  }

  if (!raw || raw.length < 500) {
    throw new Error('BOOK_NOT_FOUND');
  }

  // Strip Gutenberg boilerplate
  let startIdx = 0;
  for (const marker of ['*** START OF THE PROJECT GUTENBERG', '*** START OF THIS PROJECT GUTENBERG']) {
    const idx = raw.indexOf(marker);
    if (idx !== -1) { startIdx = raw.indexOf('\n', idx) + 1; break; }
  }
  let endIdx = raw.length;
  for (const marker of ['*** END OF THE PROJECT GUTENBERG', '*** END OF THIS PROJECT GUTENBERG', 'End of the Project Gutenberg']) {
    const idx = raw.indexOf(marker);
    if (idx !== -1) { endIdx = idx; break; }
  }

  const text = raw.slice(startIdx, endIdx)
    .normalize('NFC')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  log(`  ✓ ${text.length.toLocaleString()} characters`);
  return text;
}

// ─── Stage 2: Quote Selection ───

const CHUNK_SIZE = 15_000;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + CHUNK_SIZE));
    start += CHUNK_SIZE - 500;
    if (start >= text.length) break;
  }
  return chunks;
}

async function selectQuotes(
  ai: GoogleGenAI, sourceText: string,
  config: GeneratorConfig, log: LogFn,
): Promise<RawQuote[]> {
  log('');
  log('🔍 Stage 2: Selecting quotes via Gemini...');
  const chunks = chunkText(sourceText);
  const targetExtra = Math.ceil(config.count * 1.5);
  const perChunk = Math.ceil(targetExtra / chunks.length);
  log(`  ${chunks.length} chunks, ~${perChunk} quotes each`);

  const allQuotes: RawQuote[] = [];

  for (let i = 0; i < chunks.length; i++) {
    log(`  Processing chunk ${i + 1}/${chunks.length}...`);
    const prompt = `You are a literary scholar. From this excerpt of "${config.book}" by ${config.author}, select up to ${perChunk} notable passages.

GRADES: Legendary (~2%, iconic universally known), Epic (~10%, widely cited), Rare (~28%, scholar-notable), Common (~60%, interesting)

RULES:
1. Extract EXACT text as it appears. Do NOT paraphrase.
2. Each quote: 1-3 sentences max.
3. Provide chapter/section location.

Return ONLY valid JSON array (no markdown fences):
[{"original":"exact quote","chapter":"chapter ref","grade":"Legendary|Epic|Rare|Common","significance":"why it matters"}]

TEXT:
${chunks[i]}`;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: prompt,
          config: { temperature: 0.3, maxOutputTokens: 8192 },
        });
        const cleaned = (res.text ?? '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const quotes: RawQuote[] = JSON.parse(cleaned);
        const valid = quotes.filter(q =>
          q.original && q.chapter && q.grade &&
          ['Legendary', 'Epic', 'Rare', 'Common'].includes(q.grade)
        );
        allQuotes.push(...valid);
        log(`    → ${valid.length} quotes`);
        break;
      } catch (err: any) {
        if (attempt < 2) {
          const delay = Math.pow(2, attempt) * 1000;
          log(`    ⚠ ${err.message || err} — retry in ${delay / 1000}s...`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          log(`    ✗ Failed after 3 attempts: ${err.message || err}`);
        }
      }
    }

    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 500));
  }

  log(`  ✓ ${allQuotes.length} candidate quotes`);
  return allQuotes;
}

// ─── Stage 3: Verification ───

function normalize(text: string): string {
  return text.normalize('NFC').toLowerCase()
    .replace(/[\u2013\u2014\u2015\u2212]/g, '-')
    .replace(/[\u00AB\u00BB\u201C\u201D\u201E\u201F\u2018\u2019\u201A\u201B\u0022]/g, '"')
    .replace(/[\u2018\u2019\u0027\u0060\u00B4]/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function orderedMatchScore(quote: string, window: string): number {
  let qi = 0, wi = 0, matches = 0;
  while (qi < quote.length && wi < window.length) {
    if (quote[qi] === window[wi]) { matches++; qi++; }
    wi++;
  }
  return matches / quote.length;
}

function extractKeywords(text: string): string[] {
  const words = text.split(' ').filter(w => w.length >= 4);
  words.sort((a, b) => b.length - a.length);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const w of words) {
    if (!seen.has(w)) { seen.add(w); result.push(w); if (result.length >= 3) break; }
  }
  return result;
}

function findInSource(nq: string, ns: string): number {
  if (ns.includes(nq)) return 1.0;
  // OCR variations
  for (const v of [nq.replace(/\.\.\./g, '…'), nq.replace(/…/g, '...'), nq.replace(/oe/g, 'œ'), nq.replace(/œ/g, 'oe')]) {
    if (ns.includes(v)) return 0.98;
  }
  // Keyword-anchored search
  const keywords = extractKeywords(nq);
  let best = 0;
  const pad = Math.max(nq.length, 200);
  for (const kw of keywords) {
    let from = 0;
    while (from < ns.length) {
      const pos = ns.indexOf(kw, from);
      if (pos === -1) break;
      const win = ns.slice(Math.max(0, pos - pad), Math.min(ns.length, pos + kw.length + pad));
      const score = orderedMatchScore(nq, win);
      if (score > best) best = score;
      if (best >= 0.95) return best;
      from = pos + 1;
    }
  }
  // Prefix anchor
  const prefix = nq.slice(0, Math.min(30, Math.floor(nq.length / 2)));
  if (prefix.length >= 10) {
    let from = 0;
    while (from < ns.length) {
      const pos = ns.indexOf(prefix, from);
      if (pos === -1) break;
      const win = ns.slice(pos, Math.min(ns.length, pos + nq.length + 100));
      const score = orderedMatchScore(nq, win);
      if (score > best) best = score;
      if (best >= 0.95) return best;
      from = pos + 1;
    }
  }
  return best;
}

function verifyQuotes(quotes: RawQuote[], sourceText: string, log: LogFn): VerifiedQuote[] {
  log('');
  log('✅ Stage 3: Verifying against source text...');
  const ns = normalize(sourceText);
  const verified: VerifiedQuote[] = [];
  let rejected = 0;

  for (const q of quotes) {
    const nq = normalize(q.original);
    if (nq.length < 10) { rejected++; continue; }
    const score = findInSource(nq, ns);
    const threshold = nq.length < 50 ? 0.95 : 0.85;
    if (score < threshold) { rejected++; continue; }
    // Dedup
    const isDup = verified.some(v => {
      const vn = normalize(v.original);
      return vn.includes(nq) || nq.includes(vn) || orderedMatchScore(nq, vn) >= 0.7;
    });
    if (isDup) { rejected++; continue; }
    verified.push({ ...q, matchScore: score });
  }

  log(`  ✓ Verified: ${verified.length} | Rejected: ${rejected}`);
  return verified;
}

// ─── Stage 4: Translation + BTL ───

const LANG_NAMES: Record<string, string> = { en: 'English', fr: 'French', ru: 'Russian', de: 'German', es: 'Spanish', it: 'Italian', pt: 'Portuguese' };
const BATCH_SIZE = 10;

async function enrichQuotes(
  ai: GoogleGenAI, quotes: VerifiedQuote[],
  config: GeneratorConfig, log: LogFn,
): Promise<EnrichedQuote[]> {
  log('');
  log('🌏 Stage 4: Translating + generating BTL...');
  const langName = LANG_NAMES[config.lang] || config.lang;
  const enriched: EnrichedQuote[] = [];

  for (let i = 0; i < quotes.length; i += BATCH_SIZE) {
    const batch = quotes.slice(i, i + BATCH_SIZE);
    log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(quotes.length / BATCH_SIZE)} (${batch.length} quotes)...`);

    const quotesJson = JSON.stringify(batch.map((q, j) => ({ index: j, original: q.original, chapter: q.chapter, grade: q.grade })), null, 2);
    const prompt = `You are a literary translator (${langName}→Korean) and scholar.

For each quote from "${config.book}" by ${config.author}, provide:
1. translation: Korean translation preserving literary quality
2. btl: "Between the Lines" commentary in Korean (2-3 sentences)

Return ONLY valid JSON array (no markdown fences):
[{"index":0,"translation":"한국어 번역","btl":"문학 해설"}]

QUOTES:
${quotesJson}`;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: prompt,
          config: { temperature: 0.4, maxOutputTokens: 8192 },
        });
        const cleaned = (res.text ?? '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const results = JSON.parse(cleaned);
        for (let j = 0; j < batch.length; j++) {
          enriched.push({
            ...batch[j],
            translation: results[j]?.translation || '',
            btl: results[j]?.btl || '',
          });
        }
        break;
      } catch (err: any) {
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
          log(`    Retrying...`);
        } else {
          // Fallback: push with empty translations
          for (const q of batch) enriched.push({ ...q, translation: '', btl: '' });
        }
      }
    }

    if (i + BATCH_SIZE < quotes.length) await new Promise(r => setTimeout(r, 500));
  }

  log(`  ✓ ${enriched.length} quotes enriched`);
  return enriched;
}

// ─── Stage 5: Card IDs + Firestore ───

const GRADE_LETTER: Record<string, string> = { Legendary: 'L', Epic: 'E', Rare: 'R', Common: 'C' };
const GRADE_RATIOS: Record<string, number> = { Legendary: 0.02, Epic: 0.10, Rare: 0.28, Common: 0.60 };

function enforceDistribution(quotes: EnrichedQuote[], target: number): EnrichedQuote[] {
  const targets: Record<string, number> = {
    Legendary: Math.max(1, Math.round(target * GRADE_RATIOS.Legendary)),
    Epic: Math.round(target * GRADE_RATIOS.Epic),
    Rare: Math.round(target * GRADE_RATIOS.Rare),
    Common: Math.round(target * GRADE_RATIOS.Common),
  };
  targets.Common += target - (targets.Legendary + targets.Epic + targets.Rare + targets.Common);

  const sorted = [...quotes].sort((a, b) => {
    const order: Record<string, number> = { Legendary: 0, Epic: 1, Rare: 2, Common: 3 };
    return (order[a.grade] - order[b.grade]) || (b.matchScore - a.matchScore);
  });

  const counts: Record<string, number> = { Legendary: 0, Epic: 0, Rare: 0, Common: 0 };
  const result: EnrichedQuote[] = [];
  const downgrade: Array<'Legendary' | 'Epic' | 'Rare' | 'Common'> = ['Legendary', 'Epic', 'Rare', 'Common'];

  for (const q of sorted) {
    if (result.length >= target) break;
    let grade = q.grade;
    if (counts[grade] >= targets[grade]) {
      const idx = downgrade.indexOf(grade);
      let found = false;
      for (let i = idx + 1; i < downgrade.length; i++) {
        if (counts[downgrade[i]] < targets[downgrade[i]]) { grade = downgrade[i]; found = true; break; }
      }
      if (!found) continue;
    }
    counts[grade]++;
    result.push({ ...q, grade });
  }
  return result;
}

async function assignAndSave(
  quotes: EnrichedQuote[], config: GeneratorConfig, log: LogFn,
): Promise<GeneratedCard[]> {
  log('');
  log('🃏 Stage 5: Assigning IDs + saving to Firestore...');

  const target = Math.min(config.count, quotes.length);
  const distributed = enforceDistribution(quotes, target);

  // Group by grade and assign IDs
  const byGrade: Record<string, EnrichedQuote[]> = { Legendary: [], Epic: [], Rare: [], Common: [] };
  for (const q of distributed) byGrade[q.grade].push(q);

  const cards: GeneratedCard[] = [];
  for (const grade of ['Legendary', 'Epic', 'Rare', 'Common'] as const) {
    for (let i = 0; i < byGrade[grade].length; i++) {
      const q = byGrade[grade][i];
      const cardId = `${config.prefix}-${GRADE_LETTER[grade]}${String(i + 1).padStart(2, '0')}`;
      cards.push({
        card_id: cardId,
        book: config.book,
        author: config.author,
        grade,
        original: q.original,
        translation: q.translation,
        chapter: q.chapter,
        btl: q.btl,
        source_lang: config.lang,
        significance: q.significance,
      });
    }
  }

  // Grade summary
  const gc: Record<string, number> = { Legendary: 0, Epic: 0, Rare: 0, Common: 0 };
  for (const c of cards) gc[c.grade]++;
  log(`  L:${gc.Legendary} E:${gc.Epic} R:${gc.Rare} C:${gc.Common} = ${cards.length} cards`);

  // Save to Firestore
  log('  Saving to Firestore...');
  let saved = 0;
  for (const card of cards) {
    try {
      await createCard(card);
      saved++;
    } catch {
      // Skip duplicates
    }
  }
  log(`  ✓ ${saved} cards saved`);

  return cards;
}

// ─── Main Pipeline ───

export async function runCardGenerator(
  config: GeneratorConfig,
  log: LogFn,
): Promise<GeneratedCard[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured. .env에 VITE_GEMINI_API_KEY를 설정하세요.');

  const ai = new GoogleGenAI({ apiKey });

  log('═══════════════════════════════════════');
  log('  FOLIO Card Generator');
  log('═══════════════════════════════════════');
  log(`  Book:   ${config.book}`);
  log(`  Author: ${config.author}`);
  log(`  Lang:   ${config.lang}`);
  log(`  Prefix: ${config.prefix}`);
  log(`  Target: ${config.count} cards`);
  log('');

  // Stage 1
  const sourceText = await fetchSourceText(config.gutenbergId, log);

  // Stage 2
  const rawQuotes = await selectQuotes(ai, sourceText, config, log);

  // Stage 3
  const verified = verifyQuotes(rawQuotes, sourceText, log);
  if (verified.length === 0) throw new Error('No quotes passed verification');

  // Stage 4
  const enriched = await enrichQuotes(ai, verified, config, log);

  // Stage 5
  const cards = await assignAndSave(enriched, config, log);

  log('');
  log('═══════════════════════════════════════');
  log(`  ✓ Done! ${cards.length} cards generated`);
  log('═══════════════════════════════════════');

  return cards;
}
