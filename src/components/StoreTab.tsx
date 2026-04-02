import { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PACK_CATEGORIES, type PackDefinition } from '../data/packs';
import { useGame } from '../context/GameContext';
import { toUICard, type UICard } from '../lib/cardAdapter';
import Card from './Card';

export default function StoreTab() {
  const { drawCards, points } = useGame();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [result, setResult] = useState<{ pack: PackDefinition; cards: UICard[] } | null>(null);
  const [revealedIdx, setRevealedIdx] = useState(0);

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
      setResult({ pack, cards: cards.map((c, i) => toUICard(c, i + 1)) });
      setRevealedIdx(0);
    }
  };

  const handleRevealNext = () => {
    if (!result) return;
    if (revealedIdx < result.cards.length) {
      setRevealedIdx(prev => prev + 1);
    } else {
      setResult(null);
    }
  };

  // Show pack result overlay
  if (result) {
    const allRevealed = revealedIdx >= result.cards.length;
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center mb-6">
          <span className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2">{result.pack.name}</span>
          <h2 className="font-serif text-xl tracking-[0.2em] uppercase text-brand-brown">
            {allRevealed ? 'Cards Saved' : `${revealedIdx} / ${result.cards.length}`}
          </h2>
          <div className="w-8 h-[1px] bg-brand-brown/20 mt-4"></div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {result.cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="w-[100px] h-[156px] relative"
            >
              <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.39)' }}>
                <Card card={card} isRevealed={i < revealedIdx} isFlipped={false} />
              </div>
            </motion.div>
          ))}
        </div>

        <button
          onClick={handleRevealNext}
          className="bg-brand-brown text-brand-cream px-8 py-2.5 rounded-sm text-[9px] tracking-[0.2em] uppercase font-medium hover:bg-brand-brown/90 transition-colors"
        >
          {allRevealed ? 'Back to Boutique' : 'Reveal Next'}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Symmetrical Header */}
      <div className="flex flex-col items-center mb-10 text-center pt-4">
        <span className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2">Acquire</span>
        <h2 className="font-serif text-2xl tracking-[0.2em] uppercase text-brand-brown">Boutique</h2>
        <div className="w-8 h-[1px] bg-brand-brown/20 mt-4"></div>
      </div>

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
    </div>
  );
}
