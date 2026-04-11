import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { PACK_CATEGORIES, type PackDefinition } from '../data/packs';
import { useGame } from '../context/GameContext';
import { type CardData } from '../data/cards';

interface BoutiqueSectionProps {
  onPurchaseComplete: (cards: CardData[], packName: string) => void;
}

export default function BoutiqueSection({ onPurchaseComplete }: BoutiqueSectionProps) {
  const { drawCards, points } = useGame();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (pack: PackDefinition) => {
    if (points < pack.price) return;
    setPurchasing(pack.id);

    const cards = await drawCards(
      pack.cardCount,
      pack.price,
      pack.guaranteeMinRarity,
      {
        poolFilter: pack.filter,
        rarityWeights: pack.rarityWeights,
      },
    );

    setPurchasing(null);

    if (cards.length > 0) {
      onPurchaseComplete(cards, pack.name);
    }
  };

  return (
    <div className="flex flex-col gap-12 pb-24">
      {PACK_CATEGORIES.map((category) => (
        <div key={category.label}>
          <h3 className="font-serif text-[10px] tracking-[0.3em] uppercase text-brand-brown/50 text-center mb-6">{category.label}</h3>
          <div className="flex flex-col gap-8">
            {category.packs.map((pack) => {
              const affordable = points >= pack.price;
              const isBuying = purchasing === pack.id;
              return (
                <div key={pack.id} className="flex flex-col items-center group cursor-pointer">
                  {/* Pack Graphic */}
                  <div className={`w-40 h-24 rounded-sm shadow-md border ${pack.accent} relative overflow-hidden mb-5 ${pack.color}`}>
                    <div className="absolute inset-0 card-texture opacity-30 mix-blend-multiply"></div>
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 bg-brand-brown/90"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center border border-brand-brown/20">
                        <span className="font-serif text-brand-brown font-bold text-sm">F</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full pointer-events-none"></div>
                  </div>

                  {/* Pack Info */}
                  <div className="text-center w-full px-4">
                    <h3 className="font-serif text-brand-brown text-sm tracking-[0.2em] uppercase mb-2">{pack.name}</h3>
                    <p className="text-brand-brown/60 text-[10px] leading-relaxed mb-4 tracking-wide">{pack.description}</p>

                    <button
                      onClick={() => handlePurchase(pack)}
                      disabled={!affordable || isBuying}
                      className={`inline-flex items-center gap-2 border px-6 py-2 rounded-sm text-[9px] font-medium tracking-[0.2em] uppercase transition-colors duration-500 ${
                        affordable
                          ? 'border-brand-brown text-brand-brown hover:bg-brand-brown hover:text-brand-cream'
                          : 'border-brand-brown/20 text-brand-brown/30 cursor-not-allowed'
                      }`}
                    >
                      {isBuying ? (
                        <span>Opening...</span>
                      ) : (
                        <>
                          <ShoppingBag size={12} strokeWidth={1.5} />
                          <span>{pack.price} Pts · {pack.cardCount} Cards</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="w-full h-[1px] bg-brand-brown/10 mt-8"></div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
