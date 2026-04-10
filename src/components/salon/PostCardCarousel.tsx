import Card from '../Card';
import { toUICard } from '../../lib/cardAdapter';
import { type CardData } from '../../data/cards';

interface PostCardCarouselProps {
  cards: CardData[];
  onCardTap?: (card: CardData, index: number) => void;
}

export default function PostCardCarousel({ cards, onCardTap }: PostCardCarouselProps) {
  if (cards.length === 0) return null;

  if (cards.length === 1) {
    const uiCard = toUICard(cards[0], 0);
    return (
      <div
        className="flex justify-center py-2 cursor-pointer"
        onClick={() => onCardTap?.(cards[0], 0)}
      >
        <div className="w-[200px] h-[300px] relative overflow-hidden rounded-lg">
          <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.6)' }}>
            <Card card={uiCard} isRevealed={true} compact />
          </div>
        </div>
      </div>
    );
  }

  // 2-3 cards: horizontal scroll
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1">
      {cards.map((card, i) => {
        const uiCard = toUICard(card, i);
        return (
          <div
            key={card.card_id + i}
            className="w-[150px] h-[220px] relative overflow-hidden rounded-lg shrink-0 cursor-pointer"
            onClick={() => onCardTap?.(card, i)}
          >
            <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.44)' }}>
              <Card card={uiCard} isRevealed={true} compact />
            </div>
          </div>
        );
      })}
    </div>
  );
}
