import { useState, useEffect } from 'react';
import { type CardData } from '../../data/cards';
import { type PoolCard, createCard, updateCard } from '../../lib/firestore';
import { toUICard, BTL_DATA } from '../../lib/cardAdapter';
import Card from '../Card';
import { ArrowLeft, RotateCcw, Save, AlertCircle } from 'lucide-react';

interface CardEditorProps {
  /** Existing card to edit, or null for new card creation */
  existingCard: PoolCard | null;
  onSave: () => void;
  onBack: () => void;
}

const GRADES: CardData['grade'][] = ['Legendary', 'Epic', 'Rare', 'Common'];
const LANGS = ['en', 'fr', 'ru', 'de', 'es', 'it', 'pt', 'ja', 'zh'];

function emptyForm(): CardData {
  return {
    card_id: '',
    book: '',
    author: '',
    grade: 'Common',
    original: '',
    translation: '',
    chapter: '',
    btl: '',
    source_lang: 'en',
  };
}

export default function CardEditor({ existingCard, onSave, onBack }: CardEditorProps) {
  const isNew = !existingCard;
  const [form, setForm] = useState<CardData>(
    existingCard
      ? {
          card_id: existingCard.card_id,
          book: existingCard.book,
          author: existingCard.author,
          grade: existingCard.grade,
          original: existingCard.original,
          translation: existingCard.translation,
          chapter: existingCard.chapter,
          btl: (existingCard as any).btl || BTL_DATA[existingCard.card_id] || '',
          source_lang: (existingCard as any).source_lang || '',
        }
      : emptyForm()
  );
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Reset saved indicator when form changes
  useEffect(() => { setSaved(false); }, [form]);

  const set = (field: keyof CardData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const uiCard = toUICard(form);

  const handleSave = async () => {
    if (!form.card_id.trim()) { setError('카드 ID를 입력하세요'); return; }
    if (!form.book.trim()) { setError('책 제목을 입력하세요'); return; }
    if (!form.original.trim()) { setError('원문을 입력하세요'); return; }

    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await createCard(form);
      } else {
        await updateCard(form.card_id, form);
      }
      setSaved(true);
      onSave();
    } catch (err: any) {
      setError(err.message || '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-brown/10">
        <button onClick={onBack} className="text-brand-brown/60 hover:text-brand-brown transition-colors">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <h2 className="font-serif text-sm tracking-[0.15em] uppercase text-brand-brown flex-1">
          {isNew ? 'New Card' : `Edit · ${form.card_id}`}
        </h2>
        {existingCard && (
          <span className={`text-[8px] tracking-[0.2em] uppercase px-2 py-0.5 rounded-sm ${
            existingCard.status === 'pool'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {existingCard.status}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Card Preview */}
        <div className="flex flex-col items-center py-6 px-4">
          <div className="transform scale-[0.85] origin-top">
            <Card card={uiCard} isRevealed={true} isFlipped={flipped} />
          </div>
          <button
            onClick={() => setFlipped(!flipped)}
            className="flex items-center gap-1.5 text-[9px] tracking-[0.2em] uppercase text-brand-brown/50 hover:text-brand-brown transition-colors mt-2"
          >
            <RotateCcw size={12} strokeWidth={1.5} />
            {flipped ? 'Show Front' : 'Show BTL'}
          </button>
        </div>

        {/* Edit Form */}
        <div className="px-4 pb-32 space-y-4">
          {/* Card ID */}
          <Field label="Card ID" hint="예: GG-L01">
            <input
              type="text"
              value={form.card_id}
              onChange={e => set('card_id', e.target.value)}
              disabled={!isNew}
              className={`field-input ${!isNew ? 'opacity-50' : ''}`}
              placeholder="XX-Y00"
            />
          </Field>

          {/* Book + Author row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Book">
              <input type="text" value={form.book} onChange={e => set('book', e.target.value)} className="field-input" placeholder="책 제목" />
            </Field>
            <Field label="Author">
              <input type="text" value={form.author} onChange={e => set('author', e.target.value)} className="field-input" placeholder="저자" />
            </Field>
          </div>

          {/* Grade + Lang + Chapter */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Grade">
              <select value={form.grade} onChange={e => set('grade', e.target.value)} className="field-input">
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Language">
              <select value={form.source_lang || ''} onChange={e => set('source_lang', e.target.value)} className="field-input">
                <option value="">-</option>
                {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Chapter">
              <input type="text" value={form.chapter} onChange={e => set('chapter', e.target.value)} className="field-input" placeholder="1부 1장" />
            </Field>
          </div>

          {/* Original */}
          <Field label="Original Quote" hint="줄바꿈은 카드에 그대로 반영됩니다">
            <textarea
              value={form.original}
              onChange={e => set('original', e.target.value)}
              rows={4}
              className="field-input resize-none"
              placeholder="원문 문장"
            />
          </Field>

          {/* Translation */}
          <Field label="Translation (Korean)">
            <textarea
              value={form.translation}
              onChange={e => set('translation', e.target.value)}
              rows={3}
              className="field-input resize-none"
              placeholder="한국어 번역"
            />
          </Field>

          {/* BTL */}
          <Field label="Between the Lines" hint="문학 해설 (카드 뒷면에 표시)">
            <textarea
              value={form.btl || ''}
              onChange={e => set('btl', e.target.value)}
              rows={4}
              className="field-input resize-none"
              placeholder="작중 맥락과 문학적 의의..."
            />
          </Field>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-[10px] tracking-wide">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Save button — sticky bottom */}
      <div className="sticky bottom-0 px-4 py-3 bg-brand-cream border-t border-brand-brown/10 z-20">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded-sm text-[10px] tracking-[0.2em] uppercase font-medium transition-colors flex items-center justify-center gap-2 ${
            saved
              ? 'bg-emerald-700 text-brand-cream'
              : 'bg-brand-brown text-brand-cream hover:bg-brand-brown/90'
          } disabled:opacity-50`}
        >
          <Save size={14} strokeWidth={1.5} />
          {saving ? 'Saving...' : saved ? 'Saved' : isNew ? 'Create Card' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[9px] tracking-[0.2em] uppercase text-brand-brown/50 block mb-1">{label}</span>
      {children}
      {hint && <span className="text-[8px] text-brand-brown/30 mt-0.5 block">{hint}</span>}
    </label>
  );
}
