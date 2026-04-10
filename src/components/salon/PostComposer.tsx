import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import Card from '../Card';
import { toUICard } from '../../lib/cardAdapter';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { createPost } from '../../lib/firestore';
import { type CardData } from '../../data/cards';

interface PostComposerProps {
  onClose: () => void;
  onPosted: () => void;
}

export default function PostComposer({ onClose, onPosted }: PostComposerProps) {
  const { user, userProfile } = useAuth();
  const { inventory } = useGame();
  const [text, setText] = useState('');
  const [selectedCards, setSelectedCards] = useState<CardData[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);
  const [isAdmin] = useState(userProfile?.email === 'admin@folio.com');
  const [isAdminQuestion, setIsAdminQuestion] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedIds = new Set(selectedCards.map(c => c.card_id));

  const toggleCard = (card: CardData) => {
    if (selectedIds.has(card.card_id)) {
      setSelectedCards(prev => prev.filter(c => c.card_id !== card.card_id));
    } else if (selectedCards.length < 3) {
      setSelectedCards(prev => [...prev, card]);
    }
  };

  const handlePickerCardTap = (card: CardData) => {
    setPreviewCard(card);
  };

  const handlePreviewConfirm = () => {
    if (previewCard) {
      toggleCard(previewCard);
      setPreviewCard(null);
    }
  };

  const handleSubmit = async () => {
    if (!user || !userProfile || (!text.trim() && selectedCards.length === 0)) return;
    setSubmitting(true);
    try {
      await createPost(user.uid, userProfile.displayName, text.trim(), selectedCards, isAdminQuestion);
      onPosted();
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  // Convert inventory to CardData for picker
  const inventoryCards: CardData[] = inventory.map(c => ({
    book: c.book,
    card_id: c.card_id,
    grade: c.grade as CardData['grade'],
    original: c.original,
    translation: c.translation,
    chapter: c.chapter || '',
    author: c.author || '',
    btl: c.btl,
    source_lang: c.source_lang,
  }));

  // Deduplicate by card_id
  const uniqueCards = Array.from(new Map(inventoryCards.map(c => [c.card_id, c])).values());

  return createPortal(
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[140] bg-brand-cream flex flex-col max-w-md mx-auto"
      style={{ height: '100dvh' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3 border-b border-brand-brown/10 flex-shrink-0">
        <button onClick={onClose} className="text-brand-brown/40 hover:text-brand-brown transition-colors">
          <X size={20} strokeWidth={1.5} />
        </button>
        <h3 className="font-serif text-brand-brown text-sm tracking-[0.15em]">New Post</h3>
        <button
          onClick={handleSubmit}
          disabled={submitting || (!text.trim() && selectedCards.length === 0)}
          className="text-[10px] tracking-[0.15em] uppercase font-medium text-brand-orange disabled:text-brand-brown/20 transition-colors"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Post'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
        {/* Admin question toggle */}
        {isAdmin && (
          <button
            onClick={() => setIsAdminQuestion(!isAdminQuestion)}
            className={`mb-3 text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-sm border transition-colors ${
              isAdminQuestion
                ? 'border-brand-orange text-brand-orange bg-brand-orange/5'
                : 'border-brand-brown/15 text-brand-brown/40'
            }`}
          >
            {isAdminQuestion ? 'Admin Question ON' : 'Admin Question'}
          </button>
        )}

        {/* Text input */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Share your thoughts on literature..."
          maxLength={500}
          className="w-full bg-transparent text-[13px] text-brand-brown leading-relaxed placeholder:text-brand-brown/25 resize-none focus:outline-none min-h-[120px]"
        />
        <div className="text-right text-[9px] text-brand-brown/25 mb-3">{text.length}/500</div>

        {/* Selected cards preview */}
        {selectedCards.length > 0 && (
          <div className="flex gap-2 mb-3">
            {selectedCards.map(card => {
              const uiCard = toUICard(card, 0);
              return (
                <div key={card.card_id} className="relative w-[100px] h-[150px] overflow-hidden rounded-md">
                  <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.3)' }}>
                    <Card card={uiCard} isRevealed={true} compact />
                  </div>
                  <button
                    onClick={() => toggleCard(card)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add card button */}
        {selectedCards.length < 3 && (
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-brand-brown/40 hover:text-brand-brown/60 transition-colors mb-4"
          >
            <Plus size={14} />
            Attach Card ({selectedCards.length}/3)
          </button>
        )}

        {/* Card picker grid */}
        {showPicker && (
          <div className="grid grid-cols-2 gap-4 mt-2 place-items-center">
            {uniqueCards.map(card => {
              const uiCard = toUICard(card, 0);
              const isSelected = selectedIds.has(card.card_id);
              return (
                <button
                  key={card.card_id}
                  onClick={() => handlePickerCardTap(card)}
                  className={`relative w-[154px] h-[240px] overflow-hidden rounded-md border-2 transition-colors ${
                    isSelected ? 'border-brand-orange' : 'border-transparent'
                  }`}
                >
                  <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.6)' }}>
                    <Card card={uiCard} isRevealed={true} compact />
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Card Preview Overlay */}
      {previewCard && (() => {
        const uiCard = toUICard(previewCard, 0);
        const isSelected = selectedIds.has(previewCard.card_id);
        const canSelect = !isSelected && selectedCards.length >= 3;
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-brand-cream/[0.98] z-[10] flex flex-col items-center justify-center"
            onClick={() => setPreviewCard(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 25, mass: 0.8 }}
              onClick={e => e.stopPropagation()}
            >
              <Card card={uiCard} isRevealed={true} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.25 }}
              className="flex items-center gap-4 mt-8"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewCard(null)}
                className="px-5 py-2 border border-brand-brown/20 rounded-sm text-[10px] tracking-[0.15em] uppercase text-brand-brown/60 hover:text-brand-brown hover:border-brand-brown/40 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handlePreviewConfirm}
                disabled={canSelect}
                className={`px-5 py-2 rounded-sm text-[10px] tracking-[0.15em] uppercase transition-colors ${
                  isSelected
                    ? 'border border-red-400/50 text-red-500 hover:bg-red-50'
                    : canSelect
                      ? 'bg-brand-brown/10 text-brand-brown/30 cursor-not-allowed'
                      : 'bg-brand-orange text-white hover:bg-brand-orange/90'
                }`}
              >
                {isSelected ? 'Remove' : canSelect ? 'Max 3' : 'Attach'}
              </button>
            </motion.div>
          </motion.div>
        );
      })()}
    </motion.div>,
    document.body
  );
}
