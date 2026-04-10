import { useState } from 'react';
import { Send, Plus, X, Check, Loader2 } from 'lucide-react';
import Card from '../Card';
import { toUICard } from '../../lib/cardAdapter';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { addComment } from '../../lib/firestore';
import { type CardData } from '../../data/cards';

interface CommentComposerProps {
  postId: string;
  onCommented: () => void;
}

export default function CommentComposer({ postId, onCommented }: CommentComposerProps) {
  const { user, userProfile } = useAuth();
  const { inventory } = useGame();
  const [text, setText] = useState('');
  const [selectedCards, setSelectedCards] = useState<CardData[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedIds = new Set(selectedCards.map(c => c.card_id));

  const inventoryCards: CardData[] = inventory.map(c => ({
    book: c.book, card_id: c.card_id,
    grade: c.grade as CardData['grade'],
    original: c.original, translation: c.translation,
    chapter: c.chapter || '', author: c.author || '',
    btl: c.btl, source_lang: c.source_lang,
  }));
  const uniqueCards = Array.from(new Map(inventoryCards.map(c => [c.card_id, c])).values());

  const toggleCard = (card: CardData) => {
    if (selectedIds.has(card.card_id)) {
      setSelectedCards(prev => prev.filter(c => c.card_id !== card.card_id));
    } else if (selectedCards.length < 3) {
      setSelectedCards(prev => [...prev, card]);
    }
  };

  const handleSubmit = async () => {
    if (!user || !userProfile || (!text.trim() && selectedCards.length === 0)) return;
    setSubmitting(true);
    try {
      await addComment(postId, user.uid, userProfile.displayName, text.trim(), selectedCards);
      setText('');
      setSelectedCards([]);
      setShowPicker(false);
      onCommented();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-brand-brown/10 bg-brand-cream flex-shrink-0">
      {/* Card picker */}
      {showPicker && (
        <div className="px-4 py-3 border-b border-brand-brown/5 max-h-[200px] overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-4 gap-1.5">
            {uniqueCards.map(card => {
              const uiCard = toUICard(card, 0);
              const isSelected = selectedIds.has(card.card_id);
              return (
                <button
                  key={card.card_id}
                  onClick={() => toggleCard(card)}
                  className={`relative w-full h-[100px] overflow-hidden rounded border-2 transition-colors ${
                    isSelected ? 'border-brand-orange' : 'border-transparent'
                  }`}
                >
                  <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.22)' }}>
                    <Card card={uiCard} isRevealed={true} compact />
                  </div>
                  {isSelected && (
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-brand-orange text-white flex items-center justify-center">
                      <Check size={8} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected cards strip */}
      {selectedCards.length > 0 && !showPicker && (
        <div className="flex gap-1.5 px-4 py-2">
          {selectedCards.map(card => (
            <div key={card.card_id} className="relative w-[50px] h-[70px] overflow-hidden rounded-sm">
              <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.15)' }}>
                <Card card={toUICard(card, 0)} isRevealed={true} compact />
              </div>
              <button
                onClick={() => toggleCard(card)}
                className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-black/50 text-white flex items-center justify-center"
              >
                <X size={6} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-4 py-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={`shrink-0 mb-0.5 transition-colors ${showPicker ? 'text-brand-orange' : 'text-brand-brown/30 hover:text-brand-brown/50'}`}
        >
          <Plus size={20} />
        </button>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a comment..."
          maxLength={300}
          rows={1}
          className="flex-1 bg-transparent text-[12px] text-brand-brown leading-relaxed placeholder:text-brand-brown/25 resize-none focus:outline-none max-h-[80px]"
          onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || (!text.trim() && selectedCards.length === 0)}
          className="shrink-0 mb-0.5 text-brand-orange disabled:text-brand-brown/15 transition-colors"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
