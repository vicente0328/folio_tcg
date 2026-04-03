import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, ArrowRightLeft, Check } from 'lucide-react';
import Card from '../Card';
import { toUICard } from '../../lib/cardAdapter';
import { useGame } from '../../context/GameContext';
import { getUserInventoryWithIds, type InventoryCard } from '../../lib/firestore';
import { type UserProfile } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';

interface TradeProposalModalProps {
  targetCard: InventoryCard;
  targetCollector: UserProfile;
  onClose: () => void;
  onSubmit: (
    toUser: UserProfile,
    requestCards: InventoryCard[],
    offerPoints: number,
    offerCards: InventoryCard[],
  ) => Promise<void>;
}

const GRADE_COLORS: Record<string, string> = {
  Legendary: 'text-brand-gold',
  Epic: 'text-purple-500',
  Rare: 'text-gray-400',
  Common: 'text-brand-brown/50',
};

export default function TradeProposalModal({ targetCard, targetCollector, onClose, onSubmit }: TradeProposalModalProps) {
  const { points } = useGame();
  const { user } = useAuth();
  const [offerPoints, setOfferPoints] = useState(0);
  const [selectedCards, setSelectedCards] = useState<InventoryCard[]>([]);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [myInventory, setMyInventory] = useState<InventoryCard[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Card preview inside picker
  const [pickerPreview, setPickerPreview] = useState<InventoryCard | null>(null);
  const [pickerPreviewFlipped, setPickerPreviewFlipped] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const targetUiCard = toUICard(targetCard, undefined);

  const hasOffer = offerPoints > 0 || selectedCards.length > 0;
  const pointsValid = offerPoints <= points;

  const openCardPicker = async () => {
    if (myInventory.length === 0 && user) {
      setLoadingInventory(true);
      const inv = await getUserInventoryWithIds(user.uid);
      setMyInventory(inv);
      setLoadingInventory(false);
    }
    setShowCardPicker(true);
  };

  const toggleCard = (card: InventoryCard) => {
    setSelectedCards(prev => {
      const exists = prev.find(c => c.docId === card.docId);
      if (exists) return prev.filter(c => c.docId !== card.docId);
      if (prev.length >= 5) return prev;
      return [...prev, card];
    });
  };

  const handleSubmit = async () => {
    if (!hasOffer || !pointsValid) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(targetCollector, [targetCard], offerPoints, selectedCards);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit proposal');
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <motion.div
        className="relative bg-brand-cream rounded-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto no-scrollbar z-10"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-brand-brown/15"></div>
        </div>

        <div className="px-6 pb-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-brand-brown text-sm tracking-[0.15em] uppercase">Propose Trade</h3>
            <button onClick={onClose} className="text-brand-brown/40 hover:text-brand-brown transition-colors">
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Target card */}
          <div className="mb-6">
            <span className="text-[8px] tracking-[0.2em] uppercase text-brand-brown/40 block mb-2">You want</span>
            <div className="flex items-center gap-3 border border-brand-brown/10 rounded-lg p-3">
              <div className="w-16 h-24 relative overflow-hidden rounded flex-shrink-0">
                <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.25)' }}>
                  <Card card={targetUiCard} isRevealed={true} compact />
                </div>
              </div>
              <div>
                <p className="font-serif text-brand-brown text-[11px]">{targetCard.book}</p>
                <p className="text-brand-brown/50 text-[9px] tracking-wide">{targetCard.author}</p>
                <span className={`text-[8px] font-medium tracking-widest uppercase ${GRADE_COLORS[targetCard.grade] || ''}`}>{targetCard.grade}</span>
              </div>
            </div>
            <p className="text-brand-brown/30 text-[9px] mt-1.5 text-right tracking-wide">from {targetCollector.displayName}</p>
          </div>

          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 h-[1px] bg-brand-brown/10"></div>
            <ArrowRightLeft size={12} className="text-brand-brown/20" />
            <div className="flex-1 h-[1px] bg-brand-brown/10"></div>
          </div>

          {/* Your offer */}
          <div className="mb-6">
            <span className="text-[8px] tracking-[0.2em] uppercase text-brand-brown/40 block mb-3">Your offer</span>

            {/* Points */}
            <div className="mb-4">
              <label className="text-[9px] text-brand-brown/50 tracking-wide block mb-2">Points</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOfferPoints(Math.max(0, offerPoints - 50))}
                  className="w-8 h-8 rounded-full border border-brand-brown/15 flex items-center justify-center text-brand-brown/50 hover:border-brand-brown/30 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  value={offerPoints}
                  onChange={(e) => setOfferPoints(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 text-center bg-transparent border border-brand-brown/15 rounded-sm py-2 text-brand-brown text-sm font-serif focus:outline-none focus:border-brand-brown/40"
                />
                <button
                  onClick={() => setOfferPoints(offerPoints + 50)}
                  className="w-8 h-8 rounded-full border border-brand-brown/15 flex items-center justify-center text-brand-brown/50 hover:border-brand-brown/30 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
              {!pointsValid && (
                <p className="text-red-400 text-[9px] mt-1 tracking-wide">You have {points} pts</p>
              )}
            </div>

            {/* Card offer */}
            <div>
              <label className="text-[9px] text-brand-brown/50 tracking-wide block mb-2">Cards {selectedCards.length > 0 && `(${selectedCards.length})`}</label>

              {selectedCards.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedCards.map(card => (
                    <div key={card.docId} className="flex items-center gap-1.5 bg-brand-brown/5 rounded px-2.5 py-1.5">
                      <span className={`text-[8px] font-medium ${GRADE_COLORS[card.grade] || ''}`}>{card.grade?.[0]}</span>
                      <span className="text-[9px] text-brand-brown font-serif">{card.book}</span>
                      <button onClick={() => toggleCard(card)} className="text-brand-brown/30 hover:text-brand-brown/60 ml-1">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={openCardPicker}
                className="w-full border border-dashed border-brand-brown/15 rounded-lg py-3 text-[9px] text-brand-brown/40 tracking-[0.15em] uppercase hover:border-brand-brown/30 hover:text-brand-brown/60 transition-colors"
              >
                + Add Cards from Collection
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-[9px] tracking-wide mb-4 text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!hasOffer || !pointsValid || submitting}
            className={`w-full py-3 rounded-sm text-[10px] tracking-[0.2em] uppercase font-medium transition-colors duration-300 ${
              hasOffer && pointsValid
                ? 'bg-brand-brown text-brand-cream hover:bg-brand-brown/90'
                : 'bg-brand-brown/10 text-brand-brown/30 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Submitting...' : 'Send Proposal'}
          </button>
        </div>

        {/* ═══ Card Picker (Grid View) ═══ */}
        <AnimatePresence>
          {showCardPicker && (
            <motion.div
              className="absolute inset-0 bg-brand-cream z-20 overflow-y-auto no-scrollbar rounded-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="px-6 pt-6 pb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-brand-brown text-sm tracking-[0.15em] uppercase">Select Cards</h3>
                  <button onClick={() => setShowCardPicker(false)} className="text-brand-brown/40 hover:text-brand-brown transition-colors">
                    <X size={18} strokeWidth={1.5} />
                  </button>
                </div>
                <p className="text-brand-brown/40 text-[9px] tracking-wide mb-6">
                  Tap to preview · Long press or tap checkmark to select (up to 5)
                </p>

                {loadingInventory ? (
                  <div className="flex justify-center pt-12">
                    <div className="w-8 h-8 rounded-full border-[0.5px] border-brand-brown/20 flex items-center justify-center animate-pulse">
                      <span className="font-serif text-brand-brown/40 text-sm">F</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {myInventory.map(card => {
                      const isSelected = selectedCards.some(c => c.docId === card.docId);
                      const uiCard = toUICard(card, undefined);
                      return (
                        <div key={card.docId} className="relative">
                          {/* Card thumbnail */}
                          <div
                            className="w-full h-[240px] relative overflow-hidden rounded-lg cursor-pointer"
                            onClick={() => {
                              setPickerPreview(card);
                              setPickerPreviewFlipped(false);
                            }}
                          >
                            <div
                              className="absolute top-0 left-0 origin-top-left"
                              style={{ transform: 'scale(0.6)' }}
                            >
                              <Card card={uiCard} isRevealed={true} compact />
                            </div>
                            {/* Selected overlay */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-brand-brown/10 rounded-lg border-2 border-brand-brown flex items-end justify-center pb-2">
                                <span className="text-[8px] text-brand-brown font-medium tracking-widest uppercase bg-brand-cream/90 px-2 py-0.5 rounded">Selected</span>
                              </div>
                            )}
                          </div>
                          {/* Select/deselect button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleCard(card); }}
                            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-colors z-10 ${
                              isSelected
                                ? 'bg-brand-brown text-brand-cream'
                                : 'bg-brand-cream/90 border border-brand-brown/20 text-brand-brown/40 hover:border-brand-brown/40'
                            }`}
                          >
                            {isSelected ? <Check size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => setShowCardPicker(false)}
                  className="w-full mt-6 py-3 bg-brand-brown text-brand-cream rounded-sm text-[10px] tracking-[0.2em] uppercase font-medium"
                >
                  Done {selectedCards.length > 0 && `(${selectedCards.length} selected)`}
                </button>
              </div>

              {/* ═══ Card Preview inside Picker ═══ */}
              <AnimatePresence>
                {pickerPreview && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-brand-cream/95 backdrop-blur-md z-[250] flex flex-col items-center justify-center"
                  >
                    {/* Close */}
                    <button
                      onClick={() => setPickerPreview(null)}
                      className="absolute top-14 right-5 z-[260] w-10 h-10 rounded-full border border-brand-brown/15 flex items-center justify-center text-brand-brown/50 hover:text-brand-brown transition-colors"
                    >
                      <X size={18} strokeWidth={1.5} />
                    </button>

                    {/* Card */}
                    <motion.div
                      className="cursor-pointer"
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.85, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                      onClick={() => setPickerPreviewFlipped(prev => !prev)}
                    >
                      <Card
                        card={toUICard(pickerPreview, undefined)}
                        isRevealed={true}
                        isFlipped={pickerPreviewFlipped}
                      />
                    </motion.div>

                    {/* Hint */}
                    <span className="mt-6 text-brand-brown/40 text-[9px] tracking-[0.2em] uppercase">
                      {pickerPreviewFlipped ? 'Tap to see front' : 'Tap to read Between the Lines'}
                    </span>

                    {/* Select / Deselect button */}
                    {(() => {
                      const isSelected = selectedCards.some(c => c.docId === pickerPreview.docId);
                      return (
                        <button
                          onClick={() => {
                            toggleCard(pickerPreview);
                            setPickerPreview(null);
                          }}
                          className={`mt-8 flex items-center gap-2 px-8 py-3 rounded-sm text-[10px] tracking-[0.2em] uppercase font-medium transition-colors shadow-lg ${
                            isSelected
                              ? 'bg-transparent border border-brand-brown text-brand-brown hover:bg-brand-brown/5'
                              : 'bg-brand-brown text-brand-cream hover:bg-brand-brown/90'
                          }`}
                        >
                          {isSelected ? (
                            <><X size={14} strokeWidth={1.5} /> Remove from offer</>
                          ) : (
                            <><Plus size={14} strokeWidth={1.5} /> Add to offer</>
                          )}
                        </button>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
