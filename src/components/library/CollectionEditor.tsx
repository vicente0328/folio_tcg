import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check } from 'lucide-react';
import Card from '../Card';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { saveCollection, type FolioCollection } from '../../lib/firestore';
import { toUICard, type UICard } from '../../lib/cardAdapter';
import { type CardData } from '../../data/cards';

interface CollectionEditorProps {
  existing?: FolioCollection | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CollectionEditor({ existing, onClose, onSaved }: CollectionEditorProps) {
  const { user, userProfile } = useAuth();
  const { inventory } = useGame();
  const [title, setTitle] = useState(existing?.title || '');
  const [selected, setSelected] = useState<CardData[]>(existing?.cards ? [...existing.cards] : []);
  const [saving, setSaving] = useState(false);

  const uiCards = inventory.map((c, i) => ({ ui: toUICard(c, i + 1), raw: c }));
  const selectedIds = new Set(selected.map(c => c.card_id));
  const canSave = title.trim().length > 0 && selected.length === 3 && !saving;

  const toggleCard = (card: CardData) => {
    if (selectedIds.has(card.card_id)) {
      setSelected(prev => prev.filter(c => c.card_id !== card.card_id));
    } else if (selected.length < 3) {
      setSelected(prev => [...prev, card]);
    }
  };

  const handleSave = async () => {
    if (!canSave || !user || !userProfile) return;
    setSaving(true);
    try {
      await saveCollection(user.uid, userProfile.displayName, title.trim(), selected as [CardData, CardData, CardData]);
      onSaved();
    } catch (err) {
      console.error('Failed to save collection:', err);
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-brand-cream z-[110] flex flex-col overflow-hidden touch-none"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
    >
      {/* Header */}
      <div className="bg-brand-cream z-10 border-b border-brand-brown/10 px-5 pt-14 pb-3 flex items-center justify-between flex-shrink-0">
        <button onClick={onClose} className="w-8 h-8 rounded-full border border-brand-brown/15 flex items-center justify-center text-brand-brown/50 hover:text-brand-brown transition-colors">
          <X size={16} strokeWidth={1.5} />
        </button>
        <span className="font-serif text-brand-brown text-sm tracking-[0.15em]">
          {existing ? 'Edit Collection' : 'New Collection'}
        </span>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${canSave ? 'bg-brand-brown text-brand-cream' : 'bg-brand-brown/10 text-brand-brown/20'}`}
        >
          <Check size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar touch-auto overscroll-contain">
        {/* Title input */}
        <div className="px-6 pt-6 pb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 30))}
            placeholder="Name your collection..."
            className="w-full bg-transparent border-b border-brand-brown/15 pb-2 text-center font-serif text-brand-brown text-sm tracking-[0.1em] placeholder:text-brand-brown/25 focus:outline-none focus:border-brand-brown/40 transition-colors"
          />
          <p className="text-center text-brand-brown/20 text-[8px] tracking-wide mt-1.5">{title.length}/30</p>
        </div>

        {/* Selected slots */}
        <div className="flex items-center justify-center gap-3 px-6 pb-6">
          {[0, 1, 2].map((i) => {
            const card = selected[i];
            if (card) {
              const ui = toUICard(card, i + 1);
              return (
                <motion.div
                  key={card.card_id}
                  className="w-[90px] h-[140px] relative overflow-hidden rounded-sm cursor-pointer border border-brand-orange/30"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => toggleCard(card)}
                >
                  <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.35)' }}>
                    <Card card={ui} isRevealed={true} compact />
                  </div>
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-orange flex items-center justify-center">
                    <span className="text-brand-cream text-[8px] font-bold">{i + 1}</span>
                  </div>
                </motion.div>
              );
            }
            return (
              <div key={i} className="w-[90px] h-[140px] border border-dashed border-brand-brown/15 rounded-sm flex flex-col items-center justify-center">
                <span className="font-serif text-brand-brown/15 text-lg">{i + 1}</span>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-8 h-[1px] bg-brand-brown/10"></div>
          <span className="font-sans text-brand-brown/30 text-[8px] tracking-[0.2em] uppercase mt-2">
            {selected.length < 3
              ? `Select ${3 - selected.length} more card${3 - selected.length !== 1 ? 's' : ''}`
              : title.trim().length === 0
                ? 'Name your collection above'
                : 'Ready to save'}
          </span>
        </div>

        {/* Inventory grid */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-24">
          {uiCards.map(({ ui, raw }) => {
            const isSelected = selectedIds.has(raw.card_id);
            return (
              <motion.div
                key={ui.id}
                className={`w-full aspect-[2/3.1] relative overflow-hidden rounded-sm cursor-pointer ${isSelected ? 'ring-2 ring-brand-orange/50' : 'opacity-80'}`}
                onClick={() => toggleCard(raw)}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.44)' }}>
                  <Card card={ui} isRevealed={true} compact />
                </div>
                {isSelected && (
                  <div className="absolute inset-0 bg-brand-orange/10 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-brand-orange flex items-center justify-center">
                      <Check size={14} strokeWidth={2.5} className="text-brand-cream" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Floating confirm button — always visible */}
      <div className="flex-shrink-0 z-20 px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3 border-t border-brand-brown/5 bg-brand-cream">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`w-full py-3 rounded-sm font-serif text-[11px] tracking-[0.2em] uppercase transition-all ${
            canSave
              ? 'bg-brand-brown text-brand-cream'
              : 'bg-brand-brown/10 text-brand-brown/30'
          }`}
        >
          {saving
            ? 'Saving...'
            : selected.length < 3
              ? `Select ${3 - selected.length} card${3 - selected.length !== 1 ? 's' : ''}`
              : canSave
                ? 'Save Collection'
                : 'Enter a title to save'}
        </button>
      </div>
    </motion.div>
  );
}
