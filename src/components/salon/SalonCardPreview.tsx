import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, ArrowRightLeft } from 'lucide-react';
import Card from '../Card';
import { toUICard } from '../../lib/cardAdapter';
import { type CardData } from '../../data/cards';
import { type InventoryCard } from '../../lib/firestore';
import { useAuth } from '../../context/AuthContext';

interface SalonCardPreviewProps {
  card: CardData;
  ownerUid: string;
  onClose: () => void;
  onProposeTrade?: (card: InventoryCard, ownerUid: string, ownerName: string) => void;
}

export default function SalonCardPreview({ card, ownerUid, onClose, onProposeTrade }: SalonCardPreviewProps) {
  const { user } = useAuth();
  const [flipped, setFlipped] = useState(false);
  const uiCard = toUICard(card, 0);
  const isOwnCard = user?.uid === ownerUid;

  const handleProposeTrade = () => {
    const inventoryCard: InventoryCard = {
      ...card,
      docId: card.card_id,
      obtainedAt: '',
      source: '',
    };
    onProposeTrade?.(inventoryCard, ownerUid, '');
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center px-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="cursor-pointer" onClick={() => setFlipped(f => !f)}>
          <Card card={uiCard} isRevealed={true} isFlipped={flipped} />
        </div>

        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-brand-cream/90 text-brand-brown flex items-center justify-center shadow-lg"
        >
          <X size={16} />
        </button>

        <span className="block mt-4 text-center text-[9px] text-brand-cream/40 tracking-[0.15em] uppercase">
          {flipped ? 'Tap to see front' : 'Tap to read Between the Lines'}
        </span>

        {!isOwnCard && onProposeTrade && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleProposeTrade}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-cream text-brand-brown rounded-sm text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-brand-cream/90 transition-colors shadow-lg"
            >
              <ArrowRightLeft size={14} strokeWidth={1.5} />
              Propose Trade
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}
