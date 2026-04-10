import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Plus, X } from 'lucide-react';
import Card from '../Card';
import LikeButton from '../LikeButton';
import BookDetail from '../BookDetail';
import CollectionLikeButton from '../CollectionLikeButton';
import { getUserCollection, type FolioCollection } from '../../lib/firestore';
import { toUICard, type UICard } from '../../lib/cardAdapter';

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
  const [focusedCard, setFocusedCard] = useState<UICard | null>(null);
  const [flippedInFocus, setFlippedInFocus] = useState(false);
  const [showBookDetail, setShowBookDetail] = useState(false);

  const openCard = (ui: UICard) => {
    setFlippedInFocus(false);
    setFocusedCard(ui);
  };

  const closeCard = () => {
    if (flippedInFocus) setFlippedInFocus(false);
    setFocusedCard(null);
  };

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
              onClick={() => openCard(ui)}
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

      {/* Focused Card Overlay — portal to escape stacking context */}
      {createPortal(
        <>
          {focusedCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 bg-brand-cream/[0.98] z-[100] flex flex-col items-center justify-center"
              onClick={closeCard}
            >
              <motion.div
                className="relative cursor-pointer mt-[15px]"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 25, mass: 0.8 }}
                onClick={(e) => { e.stopPropagation(); setFlippedInFocus(prev => !prev); }}
              >
                <Card
                  card={focusedCard}
                  isRevealed={true}
                  isFlipped={flippedInFocus}
                />
                <motion.button
                  onClick={(e) => { e.stopPropagation(); closeCard(); }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute -top-5 -right-5 z-10 w-8 h-8 rounded-full bg-brand-cream border border-brand-brown/20 flex items-center justify-center text-brand-brown/40 hover:text-brand-brown hover:border-brand-brown/40 transition-colors shadow-sm"
                >
                  <X size={15} strokeWidth={1.5} />
                </motion.button>
              </motion.div>

              <div className="flex flex-col items-center" style={{ minHeight: 100 }}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="mt-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <LikeButton cardId={focusedCard.cardId} />
                </motion.div>

                <motion.span
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="mt-4 font-sans text-brand-brown/40 text-[9px] tracking-[0.2em] uppercase"
                >
                  {flippedInFocus ? 'Tap to see front' : 'Tap to read Between the Lines'}
                </motion.span>

                <motion.button
                  animate={{ opacity: flippedInFocus ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => { e.stopPropagation(); if (flippedInFocus) setShowBookDetail(true); }}
                  className="mt-3 font-serif text-[10px] tracking-[0.15em] text-brand-brown/55 border-b border-brand-brown/20 hover:text-brand-brown hover:border-brand-brown/40 transition-colors pb-0.5"
                  style={{ pointerEvents: flippedInFocus ? 'auto' : 'none' }}
                >
                  줄거리 더 알아보기
                </motion.button>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {showBookDetail && focusedCard && (
              <BookDetail
                bookTitle={focusedCard.work}
                onClose={() => setShowBookDetail(false)}
              />
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
}
