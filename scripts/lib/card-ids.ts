/**
 * Stage 5: Card ID Generation & Grade Distribution Enforcement
 *
 * Assigns card IDs following the XX-Y## pattern and enforces
 * the target grade distribution by adjusting over-assigned grades.
 */

import { type EnrichedQuote } from './gemini-enrich.js';

export interface CardRecord {
  card_id: string;
  book: string;
  author: string;
  grade: 'Legendary' | 'Epic' | 'Rare' | 'Common';
  original: string;
  translation: string;
  chapter: string;
  btl: string;
  source_lang: string;
  significance: string;
}

/** Known book prefixes from existing cards */
const EXISTING_PREFIXES = new Set(['AE', 'CP', 'AK', 'LM', 'DM']);

/** Grade abbreviation letters */
const GRADE_LETTER: Record<string, string> = {
  Legendary: 'L',
  Epic: 'E',
  Rare: 'R',
  Common: 'C',
};

/** Target grade distribution ratios */
const GRADE_RATIOS: Record<string, number> = {
  Legendary: 0.02,
  Epic: 0.10,
  Rare: 0.28,
  Common: 0.60,
};

/** Validate that a prefix doesn't collide with existing ones */
export function validatePrefix(prefix: string): { valid: boolean; reason?: string } {
  if (!/^[A-Z]{2}$/.test(prefix)) {
    return { valid: false, reason: 'Prefix must be exactly 2 uppercase letters' };
  }
  if (EXISTING_PREFIXES.has(prefix)) {
    return { valid: false, reason: `Prefix "${prefix}" already in use` };
  }
  return { valid: true };
}

/**
 * Enforce grade distribution by downgrading excess higher-grade quotes.
 * Higher grades get downgraded to the next tier if over quota.
 */
function enforceGradeDistribution(
  quotes: EnrichedQuote[],
  targetCount: number,
): EnrichedQuote[] {
  const targets: Record<string, number> = {
    Legendary: Math.max(1, Math.round(targetCount * GRADE_RATIOS.Legendary)),
    Epic: Math.round(targetCount * GRADE_RATIOS.Epic),
    Rare: Math.round(targetCount * GRADE_RATIOS.Rare),
    Common: Math.round(targetCount * GRADE_RATIOS.Common),
  };

  // Ensure targets sum to targetCount
  const diff = targetCount - (targets.Legendary + targets.Epic + targets.Rare + targets.Common);
  targets.Common += diff;

  // Sort by grade priority (Legendary first) then by match score (higher first)
  const sorted = [...quotes].sort((a, b) => {
    const gradeOrder: Record<string, number> = { Legendary: 0, Epic: 1, Rare: 2, Common: 3 };
    if (gradeOrder[a.grade] !== gradeOrder[b.grade]) {
      return gradeOrder[a.grade] - gradeOrder[b.grade];
    }
    return b.matchScore - a.matchScore;
  });

  // Assign grades respecting quotas
  const counts: Record<string, number> = { Legendary: 0, Epic: 0, Rare: 0, Common: 0 };
  const result: EnrichedQuote[] = [];
  const downgradeOrder: Array<'Legendary' | 'Epic' | 'Rare' | 'Common'> = ['Legendary', 'Epic', 'Rare', 'Common'];

  for (const quote of sorted) {
    if (result.length >= targetCount) break;

    let assignedGrade = quote.grade;

    // If this grade is over quota, downgrade
    if (counts[assignedGrade] >= targets[assignedGrade]) {
      const currentIdx = downgradeOrder.indexOf(assignedGrade);
      let downgraded = false;
      for (let i = currentIdx + 1; i < downgradeOrder.length; i++) {
        const lower = downgradeOrder[i];
        if (counts[lower] < targets[lower]) {
          assignedGrade = lower;
          downgraded = true;
          break;
        }
      }
      // If all lower grades are full, skip this quote
      if (!downgraded) continue;
    }

    counts[assignedGrade]++;
    result.push({ ...quote, grade: assignedGrade });
  }

  return result;
}

/**
 * Assign card IDs and create final card records.
 */
export function assignCardIds(
  quotes: EnrichedQuote[],
  prefix: string,
  bookTitle: string,
  author: string,
  lang: string,
  targetCount: number,
): CardRecord[] {
  // Enforce grade distribution
  const distributed = enforceGradeDistribution(quotes, targetCount);

  // Group by grade
  const byGrade: Record<string, EnrichedQuote[]> = {
    Legendary: [],
    Epic: [],
    Rare: [],
    Common: [],
  };
  for (const q of distributed) {
    byGrade[q.grade].push(q);
  }

  // Assign sequential IDs
  const cards: CardRecord[] = [];

  for (const grade of ['Legendary', 'Epic', 'Rare', 'Common'] as const) {
    const gradeQuotes = byGrade[grade];
    const letter = GRADE_LETTER[grade];

    for (let i = 0; i < gradeQuotes.length; i++) {
      const seq = String(i + 1).padStart(2, '0');
      const cardId = `${prefix}-${letter}${seq}`;
      const q = gradeQuotes[i];

      cards.push({
        card_id: cardId,
        book: bookTitle,
        author,
        grade,
        original: q.original,
        translation: q.translation,
        chapter: q.chapter,
        btl: q.btl,
        source_lang: lang,
        significance: q.significance,
      });
    }
  }

  return cards;
}
