/**
 * Stage 2: Quote Selection via Gemini
 *
 * Uses Gemini AI to select notable/famous quotes from source text chunks.
 * Returns raw candidate quotes (not yet verified against source).
 */

import { GoogleGenAI } from '@google/genai';

export interface RawQuote {
  original: string;
  chapter: string;
  grade: 'Legendary' | 'Epic' | 'Rare' | 'Common';
  significance: string;
}

const CHUNK_SIZE = 15_000; // characters per chunk (kept small to avoid OOM)

/** Split text into overlapping chunks */
function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const overlap = 500; // overlap to avoid cutting quotes at boundaries
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

/** Calculate how many quotes to request per chunk, distributed by grade targets */
function distributeQuotesPerChunk(
  targetCount: number,
  totalChunks: number,
): { perChunk: number; gradeTargets: Record<string, number> } {
  // Request 50% extra to account for verification failures
  const totalToRequest = Math.ceil(targetCount * 1.5);
  const perChunk = Math.ceil(totalToRequest / totalChunks);

  return {
    perChunk,
    gradeTargets: {
      Legendary: Math.max(1, Math.ceil(targetCount * 0.02)),
      Epic: Math.ceil(targetCount * 0.10),
      Rare: Math.ceil(targetCount * 0.28),
      Common: Math.ceil(targetCount * 0.60),
    },
  };
}

/** Build the prompt for Gemini quote extraction */
function buildPrompt(
  bookTitle: string,
  author: string,
  lang: string,
  quotesPerChunk: number,
  gradeTargets: Record<string, number>,
  chunkIndex: number,
  totalChunks: number,
): string {
  return `You are a literary scholar and expert on "${bookTitle}" by ${author}.
From the following text excerpt (chunk ${chunkIndex + 1} of ${totalChunks}), select up to ${quotesPerChunk} notable, quotable passages.

GRADE DISTRIBUTION GUIDE (for the full book, not just this chunk):
- Legendary (~2%): Iconic sentences universally recognized even by non-readers. The most famous lines in literary history.
- Epic (~10%): Widely cited passages that capture the book's core themes. Memorable and impactful.
- Rare (~28%): Notable passages appreciated by attentive readers and scholars. Important thematic moments.
- Common (~60%): Interesting, well-crafted sentences that reveal character, setting, or atmosphere.

RULES:
1. Extract the EXACT text as it appears. Do NOT paraphrase, edit, or combine passages.
2. Each quote should be a complete sentence or a coherent passage (1-3 sentences max).
3. Provide the approximate chapter/section where the quote appears.
4. Assign a grade based on the quote's fame and literary significance.
5. Explain in 1 sentence why this quote is significant.

Return ONLY a valid JSON array (no markdown fences, no extra text):
[{
  "original": "exact quote text in ${lang}",
  "chapter": "chapter or section reference",
  "grade": "Legendary|Epic|Rare|Common",
  "significance": "why this quote matters"
}]

TEXT:
`;
}

/** Call Gemini to extract quotes from a single text chunk */
async function extractFromChunk(
  ai: GoogleGenAI,
  text: string,
  bookTitle: string,
  author: string,
  lang: string,
  quotesPerChunk: number,
  gradeTargets: Record<string, number>,
  chunkIndex: number,
  totalChunks: number,
): Promise<RawQuote[]> {
  const prompt = buildPrompt(bookTitle, author, lang, quotesPerChunk, gradeTargets, chunkIndex, totalChunks);
  const fullPrompt = prompt + text;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: fullPrompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      });

      const responseText = response.text ?? '';
      // Strip markdown code fences if present
      const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const quotes: RawQuote[] = JSON.parse(cleaned);

      if (!Array.isArray(quotes)) {
        throw new Error('Response is not an array');
      }

      // Validate each quote has required fields
      return quotes.filter(q =>
        q.original && typeof q.original === 'string' &&
        q.chapter && typeof q.chapter === 'string' &&
        q.grade && ['Legendary', 'Epic', 'Rare', 'Common'].includes(q.grade) &&
        q.significance && typeof q.significance === 'string'
      );
    } catch (err: any) {
      if (err?.status === 429 || err?.message?.includes('429')) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`    Rate limited, retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      if (attempt === 2) throw err;
      console.log(`    Parse error on chunk ${chunkIndex + 1}, retrying...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return [];
}

/**
 * Extract candidate quotes from the full source text using Gemini.
 *
 * @returns Array of raw quotes (not yet verified against source text)
 */
export async function selectQuotes(
  apiKey: string,
  sourceText: string,
  bookTitle: string,
  author: string,
  lang: string,
  targetCount: number,
): Promise<RawQuote[]> {
  const ai = new GoogleGenAI({ apiKey });
  const chunks = chunkText(sourceText, CHUNK_SIZE);
  const { perChunk, gradeTargets } = distributeQuotesPerChunk(targetCount, chunks.length);

  console.log(`  Source text: ${sourceText.length} chars → ${chunks.length} chunks`);
  console.log(`  Requesting ~${perChunk} quotes per chunk (target: ${targetCount})`);

  const allQuotes: RawQuote[] = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`  Processing chunk ${i + 1}/${chunks.length}...`);
    const quotes = await extractFromChunk(
      ai, chunks[i], bookTitle, author, lang,
      perChunk, gradeTargets, i, chunks.length,
    );
    console.log(`    → ${quotes.length} quotes extracted`);
    allQuotes.push(...quotes);

    // Brief pause between chunks to avoid rate limits
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`  Total raw quotes: ${allQuotes.length}`);
  return allQuotes;
}
