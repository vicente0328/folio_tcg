import { useState } from 'react';
import { motion } from 'motion/react';
import Card from './Card';

const libraryCards = [
  {
    id: 1,
    author: "Albert Camus",
    work: "L'Étranger",
    originalQuote: "Aujourd'hui, maman est morte. Ou peut-être hier, je ne sais pas.",
    translatedQuote: "오늘 엄마가 죽었다. 아니 어쩌면 어제, 잘 모르겠다.",
    context: "소설의 첫 문장으로, 뫼르소의 무관심하고 부조리한 세계관을 단적으로 보여줍니다.",
    rarity: "SSR"
  },
  {
    id: 3,
    author: "Jane Austen",
    work: "Pride and Prejudice",
    originalQuote: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
    translatedQuote: "재산이 많은 독신 남자라면 아내가 필요할 것이라는 점은 누구나 인정하는 보편적인 진리이다.",
    context: "당대 영국의 결혼 풍속도를 풍자적으로 꼬집는 유명한 첫 문장입니다.",
    rarity: "R"
  },
  {
    id: 6,
    author: "F. Scott Fitzgerald",
    work: "The Great Gatsby",
    originalQuote: "So we beat on, boats against the current, borne back ceaselessly into the past.",
    translatedQuote: "그렇게 우리는 조류를 거스르는 배처럼 끊임없이 과거로 떠밀려 가면서도 앞으로 계속 나아가는 것이다.",
    context: "과거의 꿈을 좇는 인간의 헛된 노력과 그럼에도 불구하고 나아가는 숭고함을 표현한 마지막 문장입니다.",
    rarity: "UR"
  }
];

export default function Library() {
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const toggleCard = (id: number) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Symmetrical Header */}
      <div className="flex flex-col items-center mb-10 text-center pt-4">
        <span className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2">Collection</span>
        <h2 className="font-serif text-2xl tracking-[0.2em] uppercase text-brand-brown">Library</h2>
        <div className="w-8 h-[1px] bg-brand-brown/20 mt-4 mb-4"></div>
        <p className="text-brand-brown/60 text-[10px] tracking-widest uppercase">3 / 150 Masterpieces</p>
      </div>

      {/* Filter Tabs - Centered */}
      <div className="flex justify-center gap-8 mb-10">
        <button className="text-[10px] uppercase tracking-[0.2em] text-brand-brown border-b border-brand-brown pb-1">All</button>
        <button className="text-[10px] uppercase tracking-[0.2em] text-brand-brown/40 pb-1 hover:text-brand-brown transition-colors">Author</button>
        <button className="text-[10px] uppercase tracking-[0.2em] text-brand-brown/40 pb-1 hover:text-brand-brown transition-colors">Era</button>
      </div>

      {/* Symmetrical Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 pb-24 place-items-center">
        {libraryCards.map((card) => (
          <div key={card.id} className="w-[154px] h-[240px] relative cursor-pointer" onClick={() => toggleCard(card.id)}>
            <motion.div
              className="absolute top-0 left-0 origin-top-left"
              style={{ transform: 'scale(0.6)' }}
            >
              <Card
                card={card}
                isRevealed={true}
                isFlipped={!!flippedCards[card.id]}
              />
            </motion.div>
          </div>
        ))}

        {/* Empty slots - Elegant placeholders */}
        {[...Array(3)].map((_, i) => (
          <div key={`empty-${i}`} className="w-[154px] h-[240px] border border-brand-brown/10 rounded-sm flex flex-col items-center justify-center bg-brand-cream/50 relative">
            <div className="absolute inset-1 border-[0.5px] border-brand-brown/5"></div>
            <div className="w-8 h-[1px] bg-brand-brown/10 mb-3"></div>
            <span className="font-serif text-brand-brown/20 text-lg">L</span>
            <div className="w-8 h-[1px] bg-brand-brown/10 mt-3"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
