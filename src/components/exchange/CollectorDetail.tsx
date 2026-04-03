import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Card from '../Card';
import { toUICard } from '../../lib/cardAdapter';
import { type InventoryCard } from '../../lib/firestore';
import { type UserProfile } from '../../context/AuthContext';

interface CollectorDetailProps {
  collector: UserProfile;
  inventory: InventoryCard[];
  loading: boolean;
  onBack: () => void;
  onSelectCard: (card: InventoryCard) => void;
  isSelf: boolean;
}

export default function CollectorDetail({ collector, inventory, loading, onBack, onSelectCard, isSelf }: CollectorDetailProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Back + Name */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-brand-brown/50 hover:text-brand-brown transition-colors">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <div>
          <h3 className="font-serif text-brand-brown text-sm tracking-wide">{collector.displayName}</h3>
          <p className="text-brand-brown/40 text-[9px] tracking-widest uppercase">{inventory.length} cards</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-16">
          <div className="w-8 h-8 rounded-full border-[0.5px] border-brand-brown/20 flex items-center justify-center animate-pulse">
            <span className="font-serif text-brand-brown/40 text-sm">F</span>
          </div>
        </div>
      ) : inventory.length === 0 ? (
        <p className="text-center text-brand-brown/30 text-[11px] font-serif italic pt-12">No cards in this collection</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 pb-24">
          {inventory.map((card) => {
            const uiCard = toUICard(card, undefined);
            return (
              <motion.div
                key={card.docId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full h-[240px] relative overflow-hidden rounded-lg ${isSelf ? 'opacity-60' : 'cursor-pointer'}`}
                onClick={() => !isSelf && onSelectCard(card)}
              >
                <div
                  className="absolute top-0 left-0 origin-top-left"
                  style={{ transform: 'scale(0.6)' }}
                >
                  <Card card={uiCard} isRevealed={true} compact />
                </div>
                {isSelf && (
                  <div className="absolute bottom-2 left-0 right-0 text-center">
                    <span className="text-[8px] text-brand-brown/30 tracking-widest uppercase">My Card</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
