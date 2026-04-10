import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import Card from '../Card';
import { toUICard } from '../../lib/cardAdapter';
import { type CardData } from '../../data/cards';
import { useAuth } from '../../context/AuthContext';

interface SalonCardPreviewProps {
  card: CardData;
  ownerUid: string;
  onClose: () => void;
}

export default function SalonCardPreview({ card, ownerUid, onClose }: SalonCardPreviewProps) {
  const { user } = useAuth();
  const uiCard = toUICard(card, 0);
  const isOwnCard = user?.uid === ownerUid;

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
        <Card card={uiCard} isRevealed={true} />

        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-brand-cream/90 text-brand-brown flex items-center justify-center shadow-lg"
        >
          <X size={16} />
        </button>

        {!isOwnCard && (
          <div className="mt-4 flex justify-center">
            <span className="text-[9px] text-brand-cream/50 tracking-[0.15em] uppercase">
              Visit Exchange to propose a trade
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}
