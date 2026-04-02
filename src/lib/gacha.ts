import { type CardData } from '../data/cards';
import { type PoolCard } from './firestore';

const RARITY_WEIGHTS: Record<string, number> = {
  Legendary: 2,
  Epic: 10,
  Rare: 28,
  Common: 60,
};

export interface DrawOptions {
  /** Filter function to restrict the card pool (e.g., by book, author, region) */
  poolFilter?: (card: CardData) => boolean;
  /** Custom rarity weights (override defaults) */
  rarityWeights?: Record<string, number>;
}

function rollGrade(pityCounter: number, weights: Record<string, number>): CardData['grade'] {
  if (pityCounter >= 49) return 'Legendary';

  const total = weights.Common + weights.Rare + weights.Epic + weights.Legendary;
  const roll = Math.random() * total;

  let cumulative = 0;
  cumulative += weights.Legendary;
  if (roll < cumulative) return 'Legendary';
  cumulative += weights.Epic;
  if (roll < cumulative) return 'Epic';
  cumulative += weights.Rare;
  if (roll < cumulative) return 'Rare';
  return 'Common';
}

/**
 * Draw cards from the available Firestore pool.
 *
 * @param pool - Available cards from Firestore (already filtered to drawable cards)
 * @param count - Number of cards to draw
 * @param pityCounter - Current pity counter
 * @param guaranteeMinRarity - Optional minimum rarity guarantee
 * @param options - Pool filter and custom weights
 */
export function drawFromPool(
  pool: PoolCard[],
  count: number,
  pityCounter: number,
  guaranteeMinRarity?: CardData['grade'],
  options: DrawOptions = {},
): { cards: PoolCard[]; newPity: number } {
  const weights = options.rarityWeights || RARITY_WEIGHTS;
  const cards: PoolCard[] = [];
  let pity = pityCounter;

  // Apply pack filter if provided
  let filteredPool = options.poolFilter
    ? pool.filter(c => options.poolFilter!(c))
    : [...pool];

  // Track cards drawn in this session to avoid duplicates
  const drawnIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    if (filteredPool.length === 0) break;

    const grade = rollGrade(pity, weights);

    // Get candidates for this grade
    let candidates = filteredPool.filter(c => c.grade === grade && !drawnIds.has(c.card_id));

    // Fallback to any available grade if no candidates
    if (candidates.length === 0) {
      const fallbackOrder: CardData['grade'][] = ['Epic', 'Rare', 'Common', 'Legendary'];
      for (const fb of fallbackOrder) {
        if (fb === grade) continue;
        candidates = filteredPool.filter(c => c.grade === fb && !drawnIds.has(c.card_id));
        if (candidates.length > 0) break;
      }
    }

    if (candidates.length === 0) break;

    const card = candidates[Math.floor(Math.random() * candidates.length)];
    cards.push(card);
    drawnIds.add(card.card_id);
    pity = grade === 'Legendary' ? 0 : pity + 1;

    // Remove unique cards from pool for subsequent draws
    if (card.grade !== 'Common') {
      filteredPool = filteredPool.filter(c => c.card_id !== card.card_id);
    }
  }

  // Guarantee minimum rarity
  if (guaranteeMinRarity && cards.length > 0) {
    const order: Record<string, number> = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
    const minOrder = order[guaranteeMinRarity];
    const hasMinRarity = cards.some(c => order[c.grade] >= minOrder);

    if (!hasMinRarity) {
      const guaranteeCandidates = filteredPool.filter(c =>
        order[c.grade] >= minOrder && !drawnIds.has(c.card_id)
      );
      if (guaranteeCandidates.length > 0) {
        cards[cards.length - 1] = guaranteeCandidates[Math.floor(Math.random() * guaranteeCandidates.length)];
      }
    }
  }

  return { cards, newPity: pity };
}

export { RARITY_WEIGHTS };
