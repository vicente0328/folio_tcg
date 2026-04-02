import { ShoppingBag } from 'lucide-react';

const packs = [
  {
    id: 'p1',
    name: 'Première Edition',
    description: 'The foundational collection of classic literature.',
    price: 500,
    color: 'bg-brand-orange',
    accent: 'border-brand-brown/20'
  },
  {
    id: 'p2',
    name: 'Russian Masters',
    description: 'Profound thoughts from Dostoevsky, Tolstoy, and more.',
    price: 800,
    color: 'bg-brand-dark',
    accent: 'border-brand-gold/30'
  },
  {
    id: 'p3',
    name: 'Romanticism Era',
    description: 'Passion and individualism in poetry and prose.',
    price: 650,
    color: 'bg-[#4A3B32]',
    accent: 'border-brand-cream/20'
  }
];

export default function StoreTab() {
  return (
    <div className="h-full flex flex-col p-6">
      {/* Symmetrical Header */}
      <div className="flex flex-col items-center mb-10 text-center pt-4">
        <span className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2">Acquire</span>
        <h2 className="font-serif text-2xl tracking-[0.2em] uppercase text-brand-brown">Boutique</h2>
        <div className="w-8 h-[1px] bg-brand-brown/20 mt-4"></div>
      </div>

      <div className="flex flex-col gap-8 pb-24">
        {packs.map((pack) => (
          <div key={pack.id} className="flex flex-col items-center group cursor-pointer">
            {/* Pack Graphic - Centered above text */}
            <div className={`w-40 h-24 rounded-sm shadow-md border ${pack.accent} relative overflow-hidden mb-5 ${pack.color}`}>
              <div className="absolute inset-0 card-texture opacity-30 mix-blend-multiply"></div>
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 bg-brand-brown/90"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center border border-brand-brown/20">
                  <span className="font-serif text-brand-brown font-bold text-sm">L</span>
                </div>
              </div>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full pointer-events-none"></div>
            </div>

            {/* Pack Info - Centered */}
            <div className="text-center w-full px-4">
              <h3 className="font-serif text-brand-brown text-sm tracking-[0.2em] uppercase mb-2">{pack.name}</h3>
              <p className="text-brand-brown/60 text-[10px] leading-relaxed mb-4 tracking-wide">{pack.description}</p>

              <button className="inline-flex items-center gap-2 bg-transparent border border-brand-brown text-brand-brown px-6 py-2 rounded-sm text-[9px] font-medium tracking-[0.2em] uppercase hover:bg-brand-brown hover:text-brand-cream transition-colors duration-500">
                <ShoppingBag size={12} strokeWidth={1.5} />
                <span>{pack.price} Pts</span>
              </button>
            </div>

            {/* Fine Divider */}
            <div className="w-full h-[1px] bg-brand-brown/10 mt-8"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
