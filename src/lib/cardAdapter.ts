import { type CardData } from '../data/cards';

export interface UICard {
  id: number;
  author: string;
  work: string;
  originalQuote: string;
  translatedQuote: string;
  context: string;
  rarity: string;
}

/** Deterministic numeric hash from card_id string */
function hashId(cardId: string): number {
  let hash = 0;
  for (let i = 0; i < cardId.length; i++) {
    hash = ((hash << 5) - hash) + cardId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Convert backend CardData to the shape UI components expect */
export function toUICard(card: CardData, index?: number): UICard {
  return {
    id: index ?? hashId(card.card_id),
    author: card.author,
    work: card.book,
    originalQuote: card.original,
    translatedQuote: card.translation,
    context: card.chapter,
    rarity: card.grade,
  };
}
