import { CARDS, type CardData } from '../data/cards';

const RARITY_WEIGHTS: Record<string, number> = {
  Legendary: 2,
  Epic: 10,
  Rare: 28,
  Common: 60,
};

export interface DrawOptions {
  /** Card IDs already owned globally (Rare+ unique cards to exclude) */
  ownedCardIds?: Set<string>;
  /** Filter function to restrict the card pool (e.g., by book, author, region) */
  poolFilter?: (card: CardData) => boolean;
  /** Custom rarity weights (override defaults) */
  rarityWeights?: Record<string, number>;
}

function getAvailablePool(grade: CardData['grade'], options: DrawOptions): CardData[] {
  let pool = CARDS.filter(c => c.grade === grade);

  if (options.poolFilter) {
    pool = pool.filter(options.poolFilter);
  }

  // Exclude globally owned unique cards (Rare+)
  if (options.ownedCardIds && grade !== 'Common') {
    pool = pool.filter(c => !options.ownedCardIds!.has(c.card_id));
  }

  return pool;
}

function rollGrade(pityCounter: number, weights: Record<string, number>): CardData['grade'] {
  // Pity system: guarantee Legendary after 50 draws
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

export function drawCard(pityCounter: number = 0, options: DrawOptions = {}): { card: CardData; newPity: number } | null {
  const weights = options.rarityWeights || RARITY_WEIGHTS;
  const grade = rollGrade(pityCounter, weights);

  let pool = getAvailablePool(grade, options);

  // If pool is empty for this grade, try lower grades
  if (pool.length === 0) {
    const fallbackOrder: CardData['grade'][] = ['Epic', 'Rare', 'Common'];
    for (const fallbackGrade of fallbackOrder) {
      if (fallbackGrade === grade) continue;
      pool = getAvailablePool(fallbackGrade, options);
      if (pool.length > 0) break;
    }
  }

  // Still empty — no cards available at all
  if (pool.length === 0) return null;

  const card = pool[Math.floor(Math.random() * pool.length)];
  return {
    card,
    newPity: grade === 'Legendary' ? 0 : pityCounter + 1,
  };
}

export function drawMultiple(
  count: number,
  pityCounter: number,
  guaranteeMinRarity?: CardData['grade'],
  options: DrawOptions = {},
): { cards: CardData[]; newPity: number } {
  const cards: CardData[] = [];
  let pity = pityCounter;
  // Track cards drawn in this session to avoid duplicates within the same pull
  const sessionDrawnIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    const sessionOptions: DrawOptions = {
      ...options,
      ownedCardIds: new Set([
        ...(options.ownedCardIds || []),
        ...sessionDrawnIds,
      ]),
    };

    const result = drawCard(pity, sessionOptions);
    if (!result) break; // No more cards available

    cards.push(result.card);
    pity = result.newPity;

    // Track unique cards drawn this session (Rare+)
    if (result.card.grade !== 'Common') {
      sessionDrawnIds.add(result.card.card_id);
    }
  }

  // Guarantee minimum rarity for multi-draws
  if (guaranteeMinRarity && cards.length > 0) {
    const order: Record<string, number> = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
    const minOrder = order[guaranteeMinRarity];
    const hasMinRarity = cards.some(c => order[c.grade] >= minOrder);

    if (!hasMinRarity) {
      const guaranteeOptions: DrawOptions = {
        ...options,
        ownedCardIds: new Set([
          ...(options.ownedCardIds || []),
          ...sessionDrawnIds,
        ]),
      };
      const pool = CARDS.filter(c => {
        if (order[c.grade] < minOrder) return false;
        if (guaranteeOptions.poolFilter && !guaranteeOptions.poolFilter(c)) return false;
        if (c.grade !== 'Common' && guaranteeOptions.ownedCardIds?.has(c.card_id)) return false;
        return true;
      });

      if (pool.length > 0) {
        cards[cards.length - 1] = pool[Math.floor(Math.random() * pool.length)];
      }
    }
  }

  return { cards, newPity: pity };
}

export { RARITY_WEIGHTS };
