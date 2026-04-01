import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRightLeft } from 'lucide-react';
import FolioCard from '../components/FolioCard';
import { getRandomCard, type CardData } from '../data/cards';

export default function Trade() {
  const [selectedCards, setSelectedCards] = useState<CardData[]>([]);
  const [tradedCard, setTradedCard] = useState<CardData | null>(null);
  const [isTrading, setIsTrading] = useState(false);

  // Mocking user's collection
  const mockCollection = [
    getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard()
  ];

  const handleSelectCard = (card: CardData) => {
    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else {
      if (selectedCards.length < 3) {
        setSelectedCards([...selectedCards, card]);
      }
    }
  };

  const handleTrade = () => {
    if (selectedCards.length !== 3) return;

    setIsTrading(true);

    setTimeout(() => {
      // 3 cards -> 1 new card
      const newCard = getRandomCard();
      setTradedCard(newCard);
      setSelectedCards([]);
      setIsTrading(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-full py-6">
      
      {/* Header Area */}
      <div className="px-5 mb-10 text-center">
        <h2 className="font-serif text-[1.75rem] font-light tracking-[0.2em] mb-3 text-folio-text">
          문장 교환
        </h2>
        <p className="font-sans text-[11px] text-folio-text-muted/80 tracking-[0.2em] uppercase leading-relaxed">
          세 개의 문장을 바쳐<br />새로운 영감을 얻습니다.
        </p>
        <div className="flex justify-center mt-6">
           <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-folio-gold/40 to-transparent" />
        </div>
      </div>

      {/* Trade Arena */}
      <div className="px-5 flex flex-col items-center justify-center min-h-[40vh] mb-8 relative">
        {/* Background Decorative Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
           <div className="w-64 h-64 border-[0.5px] border-folio-gold rounded-full absolute" />
           <div className="w-48 h-48 border-[0.5px] border-folio-gold rounded-full absolute animate-[spin_40s_linear_infinite]" />
           <div className="w-32 h-32 border border-folio-gold rounded-full absolute border-dashed animate-[spin_20s_linear_infinite_reverse]" />
        </div>

        {!tradedCard ? (
          <div className="relative w-full aspect-square max-w-sm flex items-center justify-center z-10">
            {isTrading ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: [0.8, 1.2, 1],
                  rotate: [0, 180, 360],
                  filter: ['blur(0px)', 'blur(4px)', 'blur(0px)']
                }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="w-32 h-32 rounded-full border border-folio-gold flex items-center justify-center bg-folio-surface/80 backdrop-blur-md shadow-[0_0_50px_rgba(201,168,76,0.3)]"
              >
                <ArrowRightLeft size={32} strokeWidth={1} className="text-folio-gold animate-pulse" />
              </motion.div>
            ) : (
              <>
                {/* 3 Slots */}
                {[0, 1, 2].map((index) => {
                  const card = selectedCards[index];
                  // Position in a triangle
                  const angle = (index * 120 - 90) * (Math.PI / 180);
                  const radius = 90;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, x, y }}
                      transition={{ delay: index * 0.1 }}
                      className="absolute w-[6.5rem] aspect-[2/3] border-[0.5px] border-folio-border-light/60 rounded-sm bg-folio-surface/30 backdrop-blur-sm flex items-center justify-center"
                    >
                      {card ? (
                        <div className="relative w-full h-full p-1 cursor-pointer" onClick={() => handleSelectCard(card)}>
                           <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-sm">
                             <span className="text-white text-[10px] tracking-[0.2em] uppercase font-sans">Remove</span>
                           </div>
                           <FolioCard card={card} compact className="w-full h-full pointer-events-none" />
                        </div>
                      ) : (
                        <span className="font-serif text-2xl text-folio-border-light/40 font-thin">+</span>
                      )}
                    </motion.div>
                  );
                })}
                
                {/* Center Graphic */}
                <div className="w-12 h-12 rounded-full border-[0.5px] border-folio-gold/30 flex items-center justify-center z-0">
                  <span className="text-folio-gold/50 text-xs">✦</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex flex-col items-center z-10"
          >
            <span className="font-serif text-[10px] text-folio-gold tracking-[0.3em] uppercase mb-6 animate-pulse">
              New Insight Acquired
            </span>
            <FolioCard card={tradedCard} />
            
            <button
              onClick={() => setTradedCard(null)}
              className="mt-10 text-[10px] font-sans tracking-[0.2em] uppercase text-folio-text-muted hover:text-folio-text transition-colors border-b border-folio-text-muted/30 pb-1"
            >
              다시 교환하기
            </button>
          </motion.div>
        )}
      </div>

      {/* Controls / Selection */}
      {!tradedCard && (
        <div className="px-5 pb-8 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-folio-border-light/30 pb-2">
            <span className="text-[10px] font-sans tracking-[0.2em] text-folio-text-muted/80 uppercase">Select Cards to Trade</span>
            <span className="text-[10px] font-serif text-folio-gold tracking-[0.1em]">{selectedCards.length} / 3</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0">
            {mockCollection.map((card, idx) => {
              const isSelected = selectedCards.find(c => c.id === card.id);
              return (
                <div
                  key={card.id || idx}
                  onClick={() => handleSelectCard(card)}
                  className={`relative shrink-0 w-[5rem] aspect-[2/3] cursor-pointer transition-all duration-300 ${
                    isSelected ? 'ring-1 ring-folio-gold/60 scale-95 opacity-50' : 'hover:-translate-y-1'
                  }`}
                >
                  <FolioCard card={card} compact className="w-full h-full pointer-events-none" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-folio-bg/60 flex items-center justify-center z-20 rounded-sm">
                      <span className="text-folio-gold text-sm">✓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleTrade}
            disabled={selectedCards.length !== 3 || isTrading}
            className="mt-auto group relative w-full overflow-hidden rounded-sm bg-transparent border border-folio-gold/40 text-folio-gold py-3.5 px-8 transition-all duration-500 hover:border-folio-gold disabled:opacity-30 disabled:border-folio-border-light disabled:text-folio-text-muted disabled:hover:border-folio-border-light disabled:cursor-not-allowed"
          >
             <div className="absolute inset-0 w-0 bg-gradient-to-r from-folio-gold/5 to-folio-gold/10 transition-all duration-700 ease-out group-hover:w-full group-disabled:w-0" />
            <span className="relative font-sans text-xs tracking-[0.3em] font-light uppercase">
              {isTrading ? '연성 중...' : '교환하기'}
            </span>
          </button>
        </div>
      )}

    </div>
  );
}