import { ArrowRightLeft } from 'lucide-react';

const marketItems = [
  {
    id: 'm1',
    user: 'Collector_09',
    card: {
      author: "Franz Kafka",
      work: "The Metamorphosis",
      rarity: "SR"
    },
    lookingFor: "Any UR or Russian Masters SR"
  },
  {
    id: 'm2',
    user: 'Bibliophile',
    card: {
      author: "Virginia Woolf",
      work: "Mrs Dalloway",
      rarity: "R"
    },
    lookingFor: "Pride and Prejudice R"
  },
  {
    id: 'm3',
    user: 'AestheticReader',
    card: {
      author: "Oscar Wilde",
      work: "The Picture of Dorian Gray",
      rarity: "SSR"
    },
    lookingFor: "Open to offers"
  }
];

export default function Market() {
  return (
    <div className="h-full flex flex-col p-6">
      {/* Symmetrical Header */}
      <div className="flex flex-col items-center mb-10 text-center pt-4">
        <span className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2">Trade</span>
        <h2 className="font-serif text-2xl tracking-[0.2em] uppercase text-brand-brown">Exchange</h2>
        <div className="w-8 h-[1px] bg-brand-brown/20 mt-4"></div>
      </div>

      <div className="flex flex-col gap-6 pb-24">
        {marketItems.map((item) => (
          <div key={item.id} className="bg-brand-cream rounded-sm p-6 border border-brand-brown/10 flex flex-col items-center text-center relative shadow-sm">
            <div className="absolute inset-1 border-[0.5px] border-brand-brown/5 pointer-events-none"></div>

            {/* User & Rarity */}
            <div className="flex flex-col items-center mb-4 w-full">
              <span className="text-[9px] uppercase tracking-[0.3em] text-brand-gold font-medium mb-2">
                {item.card.rarity} Edition
              </span>
              <span className="font-serif italic text-brand-brown/70 text-xs">{item.user}</span>
            </div>

            <div className="w-12 h-[1px] bg-brand-brown/10 mb-4"></div>

            {/* Trade Details - Symmetrical Layout */}
            <div className="flex flex-col items-center w-full gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-brand-brown/40 uppercase tracking-[0.2em] mb-1">Offering</span>
                <h4 className="font-serif text-sm text-brand-brown">{item.card.work}</h4>
                <p className="text-[10px] text-brand-brown/60 uppercase tracking-widest mt-1">{item.card.author}</p>
              </div>

              <div className="text-brand-brown/30 my-1">
                <ArrowRightLeft size={14} strokeWidth={1.5} />
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[8px] text-brand-brown/40 uppercase tracking-[0.2em] mb-1">Seeking</span>
                <p className="text-xs text-brand-brown/80 font-serif italic">
                  "{item.lookingFor}"
                </p>
              </div>
            </div>

            <button className="mt-8 bg-transparent border border-brand-brown text-brand-brown px-8 py-2.5 rounded-sm text-[9px] tracking-[0.2em] uppercase font-medium hover:bg-brand-brown hover:text-brand-cream transition-colors duration-500 w-full max-w-[200px]">
              Propose Trade
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
