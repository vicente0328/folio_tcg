import { CARDS, type CardData } from '../data/cards';

const RARITY_WEIGHTS: Record<string, number> = {
  Legendary: 2,
  Epic: 10,
  Rare: 28,
  Common: 60,
};

export function drawCard(pityCounter: number = 0): { card: CardData; newPity: number } {
  // Pity system: guarantee Legendary after 50 draws
  if (pityCounter >= 49) {
    const legendaries = CARDS.filter(c => c.grade === 'Legendary');
    return {
      card: legendaries[Math.floor(Math.random() * legendaries.length)],
      newPity: 0,
    };
  }

  const roll = Math.random() * 100;
  let grade: CardData['grade'];

  if (roll < 2) grade = 'Legendary';
  else if (roll < 12) grade = 'Epic';
  else if (roll < 40) grade = 'Rare';
  else grade = 'Common';

  const pool = CARDS.filter(c => c.grade === grade);
  const card = pool[Math.floor(Math.random() * pool.length)];

  return {
    card,
    newPity: grade === 'Legendary' ? 0 : pityCounter + 1,
  };
}

export function drawMultiple(count: number, pityCounter: number, guaranteeMinRarity?: CardData['grade']): { cards: CardData[]; newPity: number } {
  const cards: CardData[] = [];
  let pity = pityCounter;

  for (let i = 0; i < count; i++) {
    const { card, newPity } = drawCard(pity);
    cards.push(card);
    pity = newPity;
  }

  // Guarantee minimum rarity for multi-draws
  if (guaranteeMinRarity) {
    const order: Record<string, number> = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
    const minOrder = order[guaranteeMinRarity];
    const hasMinRarity = cards.some(c => order[c.grade] >= minOrder);

    if (!hasMinRarity) {
      // Replace the last card with a guaranteed one
      const pool = CARDS.filter(c => order[c.grade] >= minOrder);
      cards[cards.length - 1] = pool[Math.floor(Math.random() * pool.length)];
    }
  }

  return { cards, newPity: pity };
}

export { RARITY_WEIGHTS };
