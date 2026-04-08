/**
 * Stage 4: Translation + BTL (Between the Lines) Generation
 *
 * Uses Gemini to translate verified quotes to Korean and generate
 * literary commentary for each quote.
 */

import { GoogleGenAI } from '@google/genai';
import { type VerifiedQuote } from './verify-quotes.js';

export interface EnrichedQuote extends VerifiedQuote {
  translation: string;
  btl: string;
}

const BATCH_SIZE = 10;

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  ru: 'Russian',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  zh: 'Chinese',
};

/** Build prompt for translation + BTL generation */
function buildEnrichPrompt(
  bookTitle: string,
  author: string,
  lang: string,
  quotes: VerifiedQuote[],
): string {
  const langName = LANG_NAMES[lang] || lang;
  const quotesJson = JSON.stringify(
    quotes.map((q, i) => ({ index: i, original: q.original, chapter: q.chapter, grade: q.grade })),
    null, 2,
  );

  return `You are an expert literary translator specializing in ${langName}-to-Korean translation, and a literary scholar who writes insightful commentary.

BOOK: "${bookTitle}" by ${author}
SOURCE LANGUAGE: ${langName}

For each of the following quotes, provide:
1. **translation**: A Korean translation that preserves the literary quality, rhythm, and nuance of the original. Do not oversimplify or modernize excessively.
2. **btl**: A "Between the Lines" commentary in Korean (2-3 sentences). Explain the literary significance, the context within the novel, and why this passage matters. Write as if explaining to an educated reader who appreciates literature.

Return ONLY a valid JSON array matching the input order (no markdown fences):
[{
  "index": 0,
  "translation": "한국어 번역",
  "btl": "문학 해설 (2-3 문장)"
}]

QUOTES:
${quotesJson}`;
}

/** Call Gemini for a batch of quotes */
async function enrichBatch(
  ai: GoogleGenAI,
  bookTitle: string,
  author: string,
  lang: string,
  quotes: VerifiedQuote[],
): Promise<Array<{ translation: string; btl: string }>> {
  const prompt = buildEnrichPrompt(bookTitle, author, lang, quotes);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          temperature: 0.4,
          maxOutputTokens: 8192,
        },
      });

      const responseText = response.text ?? '';
      const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const results = JSON.parse(cleaned);

      if (!Array.isArray(results) || results.length !== quotes.length) {
        throw new Error(`Expected ${quotes.length} results, got ${Array.isArray(results) ? results.length : 'non-array'}`);
      }

      return results.map((r: any) => ({
        translation: r.translation || '',
        btl: r.btl || '',
      }));
    } catch (err: any) {
      if (err?.status === 429 || err?.message?.includes('429')) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`    Rate limited, retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      if (attempt === 2) throw err;
      console.log(`    Error enriching batch, retrying... (${err.message})`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Fallback: return empty translations (should not reach here)
  return quotes.map(() => ({ translation: '', btl: '' }));
}

/** Spot-check translation quality via back-translation */
async function spotCheckTranslations(
  ai: GoogleGenAI,
  samples: Array<{ original: string; translation: string; lang: string }>,
): Promise<Array<{ index: number; backTranslation: string; quality: 'good' | 'warning' }>> {
  const langName = LANG_NAMES[samples[0]?.lang] || samples[0]?.lang;
  const prompt = `Back-translate the following Korean texts to ${langName}. Return ONLY a JSON array:
[{ "index": 0, "backTranslation": "..." }]

Korean texts:
${JSON.stringify(samples.map((s, i) => ({ index: i, korean: s.translation })), null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { temperature: 0.2, maxOutputTokens: 4096 },
    });

    const text = response.text ?? '';
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const results = JSON.parse(cleaned);

    return results.map((r: any, i: number) => {
      // Simple quality check: normalized overlap
      const origWords = new Set(samples[i].original.toLowerCase().split(/\s+/));
      const backWords = new Set((r.backTranslation || '').toLowerCase().split(/\s+/));
      const overlap = [...origWords].filter(w => backWords.has(w)).length;
      const quality = overlap / origWords.size >= 0.3 ? 'good' as const : 'warning' as const;
      return { index: i, backTranslation: r.backTranslation || '', quality };
    });
  } catch {
    return samples.map((_, i) => ({ index: i, backTranslation: '', quality: 'warning' as const }));
  }
}

/**
 * Enrich verified quotes with Korean translation and BTL commentary.
 */
export async function enrichQuotes(
  apiKey: string,
  quotes: VerifiedQuote[],
  bookTitle: string,
  author: string,
  lang: string,
): Promise<{ enriched: EnrichedQuote[]; warnings: string[] }> {
  const ai = new GoogleGenAI({ apiKey });
  const enriched: EnrichedQuote[] = [];
  const warnings: string[] = [];

  // Process in batches
  for (let i = 0; i < quotes.length; i += BATCH_SIZE) {
    const batch = quotes.slice(i, i + BATCH_SIZE);
    console.log(`  Enriching batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(quotes.length / BATCH_SIZE)} (${batch.length} quotes)...`);

    const results = await enrichBatch(ai, bookTitle, author, lang, batch);

    for (let j = 0; j < batch.length; j++) {
      const { translation, btl } = results[j];
      if (!translation) {
        warnings.push(`Empty translation for: "${batch[j].original.slice(0, 50)}..."`);
      }
      enriched.push({
        ...batch[j],
        translation,
        btl,
      });
    }

    // Brief pause between batches
    if (i + BATCH_SIZE < quotes.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Spot-check 10% of translations
  const sampleSize = Math.max(1, Math.ceil(enriched.length * 0.1));
  const sampleIndices = new Set<number>();
  while (sampleIndices.size < sampleSize && sampleIndices.size < enriched.length) {
    sampleIndices.add(Math.floor(Math.random() * enriched.length));
  }

  const samples = [...sampleIndices].map(i => ({
    original: enriched[i].original,
    translation: enriched[i].translation,
    lang,
  }));

  console.log(`  Spot-checking ${samples.length} translations via back-translation...`);
  const checks = await spotCheckTranslations(ai, samples);
  const warningChecks = checks.filter(c => c.quality === 'warning');
  if (warningChecks.length > 0) {
    for (const w of warningChecks) {
      const idx = [...sampleIndices][w.index];
      warnings.push(`Translation quality warning for "${enriched[idx].original.slice(0, 50)}..." — back-translation diverged significantly`);
    }
  }

  console.log(`  Enrichment complete: ${enriched.length} quotes, ${warnings.length} warnings`);
  return { enriched, warnings };
}
