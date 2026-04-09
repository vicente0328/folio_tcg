import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Pencil, Plus } from 'lucide-react';
import Card from '../Card';
import CollectionLikeButton from '../CollectionLikeButton';
import { getUserCollection, type FolioCollection } from '../../lib/firestore';
import { toUICard } from '../../lib/cardAdapter';

interface FeaturedCollectionProps {
  uid: string;
  isOwner: boolean;
  onEdit?: () => void;
  onCardClick?: (cardId: string) => void;
  /** Force refresh counter */
  refreshKey?: number;
}

export default function FeaturedCollection({ uid, isOwner, onEdit, onCardClick, refreshKey }: FeaturedCollectionProps) {
  const [col, setCol] = useState<FolioCollection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getUserCollection(uid).then((data) => {
      setCol(data);
      setLoading(false);
    });
  }, [uid, refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 rounded-full border border-brand-brown/15 flex items-center justify-center animate-pulse">
          <span className="font-serif text-brand-brown/30 text-sm">F</span>
        </div>
      </div>
    );
  }

  // No collection — show CTA (owner only) or empty state
  if (!col) {
    return (
      <div className="flex flex-col items-center py-8 px-6">
        <div className="w-8 h-[1px] bg-brand-brown/10 mb-4"></div>
        {isOwner ? (
          <button
            onClick={onEdit}
            className="flex flex-col items-center gap-3 py-6 px-10 border border-dashed border-brand-brown/15 rounded-sm hover:border-brand-brown/30 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full border border-brand-brown/15 flex items-center justify-center group-hover:border-brand-brown/30 transition-colors">
              <Plus size={18} strokeWidth={1.5} className="text-brand-brown/30 group-hover:text-brand-brown/50" />
            </div>
            <span className="font-serif text-brand-brown/40 text-[10px] tracking-[0.15em] group-hover:text-brand-brown/60 transition-colors">
              Curate Your Collection
            </span>
          </button>
        ) : (
          <p className="font-serif text-brand-brown/25 text-[11px] tracking-wide italic">No collection yet</p>
        )}
        <div className="w-8 h-[1px] bg-brand-brown/10 mt-4"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-6 px-4">
      {/* Theme title */}
      <div className="flex flex-col items-center mb-5">
        <div className="w-6 h-[1px] bg-brand-brown/15 mb-3"></div>
        <span className="font-serif text-brand-brown/50 text-[9px] tracking-[0.4em] uppercase mb-1">Featured</span>
        <h3 className="font-serif text-brand-brown text-sm tracking-[0.1em]">{col.title}</h3>
        <div className="w-6 h-[1px] bg-brand-brown/15 mt-3"></div>
      </div>

      {/* 3 cards in a row */}
      <div className="flex items-end justify-center gap-2 mb-5">
        {col.cards.map((card, i) => {
          const ui = toUICard(card, i + 1);
          return (
            <motion.div
              key={card.card_id}
              className="w-[100px] h-[156px] relative overflow-hidden rounded-sm cursor-pointer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onCardClick?.(card.card_id)}
            >
              <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.39)' }}>
                <Card card={ui} isRevealed={true} compact />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Like + Edit */}
      <div className="flex items-center gap-4">
        <CollectionLikeButton collectionId={col.id} />
        {isOwner && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-[9px] tracking-[0.15em] uppercase text-brand-brown/40 hover:text-brand-brown/60 transition-colors"
          >
            <Pencil size={12} strokeWidth={1.5} />
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
