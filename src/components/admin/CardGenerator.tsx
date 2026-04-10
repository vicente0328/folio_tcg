import { useState, useRef, useEffect } from 'react';
import { Loader2, Play, AlertCircle, Search, BookOpen, Square, Sparkles } from 'lucide-react';
import { runCardGenerator, type GeneratorConfig } from '../../lib/cardGenerator';

interface GeneratorForm {
  book: string;
  author: string;
  lang: string;
  gutenbergId: string;
  prefix: string;
  count: string;
}

interface GutenbergResult {
  id: number;
  title: string;
  authors: Array<{ name: string }>;
  languages: string[];
}

/** Generate a 2-letter prefix from English title */
function derivePrefix(title: string): string {
  const words = title.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  // Take first letter of first two significant words (skip articles)
  const skip = new Set(['the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'der', 'die', 'das', 'ein', 'eine']);
  const significant = words.filter(w => !skip.has(w.toLowerCase()));
  if (significant.length >= 2) {
    return (significant[0][0] + significant[1][0]).toUpperCase();
  }
  if (significant.length === 1) {
    return significant[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + (words[1]?.[0] || words[0][1] || '')).toUpperCase();
}

const LANG_LABELS: Record<string, string> = {
  en: 'English', fr: 'French', ru: 'Russian', de: 'German',
  es: 'Spanish', it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese',
};

export default function CardGenerator() {
  const [form, setForm] = useState<GeneratorForm>({
    book: '', author: '', lang: 'en', gutenbergId: '', prefix: '', count: '100',
  });
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState('');
  const abortRef = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Book search
  const [bookSearch, setBookSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GutenbergResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [output]);

  const set = (field: keyof GeneratorForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Debounced book search (Gutenberg + Open Library)
  const handleBookSearchChange = (value: string) => {
    setBookSearch(value);
    setShowResults(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(() => searchBooks(value), 400);
  };

  /** Map Open Library 3-letter lang codes to ISO 639-1 */
  const langTo2 = (code: string): string => {
    const map: Record<string, string> = {
      eng: 'en', fre: 'fr', rus: 'ru', ger: 'de', spa: 'es',
      ita: 'it', por: 'pt', chi: 'zh', jpn: 'ja',
    };
    return map[code] || code.slice(0, 2);
  };

  const searchBooks = async (query: string) => {
    setSearching(true);
    try {
      const [gutenbergRes, openLibRes] = await Promise.allSettled([
        fetch(`https://gutendex.com/books/?search=${encodeURIComponent(query)}`)
          .then(r => r.ok ? r.json() : { results: [] }),
        fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=title,author_name,language,id_project_gutenberg`)
          .then(r => r.ok ? r.json() : { docs: [] }),
      ]);

      const books: GutenbergResult[] = gutenbergRes.status === 'fulfilled'
        ? (gutenbergRes.value.results || []).slice(0, 8)
        : [];
      const seenIds = new Set(books.map(b => b.id));

      // Merge Open Library results that have a Gutenberg ID
      if (openLibRes.status === 'fulfilled') {
        for (const doc of (openLibRes.value.docs || [])) {
          const gIds = doc.id_project_gutenberg;
          if (!gIds || gIds.length === 0) continue;
          const gId = parseInt(gIds[0]);
          if (seenIds.has(gId)) continue;
          seenIds.add(gId);
          books.push({
            id: gId,
            title: doc.title,
            authors: (doc.author_name || []).map((name: string) => ({ name })),
            languages: (doc.language || []).map(langTo2),
          });
        }
      }

      setResults(books.slice(0, 10));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectBook = (book: GutenbergResult) => {
    const author = book.authors[0]?.name || '';
    const lang = book.languages[0] || 'en';
    const prefix = derivePrefix(book.title);

    setForm(prev => ({
      ...prev,
      author: author,
      lang: lang,
      gutenbergId: String(book.id),
      prefix: prefix,
    }));
    setSelectedTitle(book.title);
    setBookSearch('');
    setShowResults(false);
    setResults([]);
  };

  const log = (line: string) => setOutput(prev => [...prev, line]);

  const handleGenerate = async () => {
    if (!form.book.trim()) { setError('한국어 책 제목을 입력하세요'); return; }
    if (!form.author.trim()) { setError('저자를 입력하세요'); return; }
    if (!form.prefix.trim() || form.prefix.length !== 2) { setError('Prefix는 2글자여야 합니다'); return; }
    if (!form.gutenbergId.trim()) { setError('Gutenberg ID가 필요합니다. 책을 검색하세요.'); return; }

    setRunning(true);
    setOutput([]);
    setError('');
    abortRef.current = false;

    try {
      await runCardGenerator({
        book: form.book, author: form.author, lang: form.lang,
        gutenbergId: parseInt(form.gutenbergId),
        prefix: form.prefix.toUpperCase(),
        count: parseInt(form.count) || 100,
      }, log);
    } catch (err: any) {
      const msg = err.message === 'BOOK_NOT_FOUND'
        ? '해당 Gutenberg ID로 책을 찾을 수 없습니다. 올바른 책인지 다시 확인해주세요.'
        : (err.message || 'Generation failed');
      setError(msg);
      log(`\n❌ Error: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {/* Info */}
        <div className="bg-brand-brown/5 rounded-sm p-3 text-[10px] text-brand-brown/60 leading-relaxed tracking-wide">
          책을 검색하면 저자, 언어, ID, Prefix가 자동으로 채워집니다. 한국어 제목만 직접 입력하세요.
        </div>

        {/* ── Book Search ── */}
        <div className="relative">
          <Field label="Book Search" hint="영문 제목 또는 저자명으로 검색">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/30" />
              <input
                type="text"
                value={bookSearch}
                onChange={e => handleBookSearchChange(e.target.value)}
                onFocus={() => results.length > 0 && setShowResults(true)}
                className="field-input pl-9"
                placeholder="The Great Gatsby, Dostoevsky..."
                disabled={running}
              />
              {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-brown/30" />}
            </div>
          </Field>

          {/* Dropdown results */}
          {showResults && results.length > 0 && (
            <div className="absolute left-0 right-0 z-30 mt-1 bg-brand-cream border border-brand-brown/15 rounded-sm shadow-lg max-h-[260px] overflow-y-auto no-scrollbar">
              {results.map(book => (
                <button
                  key={book.id}
                  onClick={() => selectBook(book)}
                  className="w-full text-left px-3 py-2.5 hover:bg-brand-brown/5 transition-colors flex items-start gap-2.5 border-b border-brand-brown/5 last:border-0"
                >
                  <BookOpen size={14} className="text-brand-brown/30 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-brand-brown leading-snug">{book.title}</p>
                    <p className="text-[9px] text-brand-brown/40 mt-0.5">
                      {book.authors.map(a => a.name).join(', ') || 'Unknown'}
                      <span className="mx-1">·</span>
                      {LANG_LABELS[book.languages[0]] || book.languages[0]}
                      <span className="mx-1">·</span>
                      ID {book.id}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected book indicator */}
        {selectedTitle && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-sm">
            <Sparkles size={12} className="text-emerald-600 shrink-0" />
            <p className="text-[10px] text-emerald-700 truncate flex-1">{selectedTitle}</p>
            <span className="text-[8px] text-emerald-600/60">ID {form.gutenbergId}</span>
          </div>
        )}

        {/* ── Auto-filled fields (editable) ── */}
        <Field label="Book Title (Korean)" hint="카드에 표시될 한국어 제목">
          <input type="text" value={form.book} onChange={e => set('book', e.target.value)} className="field-input" placeholder="위대한 개츠비" disabled={running} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Author">
            <input type="text" value={form.author} onChange={e => set('author', e.target.value)} className="field-input" placeholder="자동 입력됨" disabled={running} />
          </Field>
          <Field label="Language">
            <select value={form.lang} onChange={e => set('lang', e.target.value)} className="field-input" disabled={running}>
              {Object.entries(LANG_LABELS).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Gutenberg ID">
            <input type="text" value={form.gutenbergId} onChange={e => set('gutenbergId', e.target.value)} className="field-input" placeholder="자동" disabled={running} />
          </Field>
          <Field label="Prefix">
            <input type="text" value={form.prefix} onChange={e => set('prefix', e.target.value.toUpperCase().slice(0, 2))} className="field-input" placeholder="자동" maxLength={2} disabled={running} />
          </Field>
          <Field label="Card Count">
            <input type="number" value={form.count} onChange={e => set('count', e.target.value)} className="field-input" min={1} max={500} disabled={running} />
          </Field>
        </div>

        {error && !running && (
          <div className="flex items-center gap-2 text-red-600 text-[10px] tracking-wide">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Generate / Stop */}
        {running ? (
          <button
            onClick={() => { abortRef.current = true; setRunning(false); log('\n⏹ Stopped'); }}
            className="w-full py-3 bg-red-700 text-brand-cream rounded-sm text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-red-800 transition-colors flex items-center justify-center gap-2"
          >
            <Square size={14} />
            Stop
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            className="w-full py-3 bg-brand-brown text-brand-cream rounded-sm text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-brand-brown/90 transition-colors flex items-center justify-center gap-2"
          >
            <Play size={14} />
            Generate Cards
          </button>
        )}

        {/* Live log */}
        {output.length > 0 && (
          <div ref={logRef} className="bg-[#1C1410] rounded-sm p-4 space-y-0.5 max-h-[400px] overflow-y-auto no-scrollbar">
            {output.map((line, i) => (
              <p key={i} className="font-mono text-[10px] text-brand-cream/70 leading-relaxed whitespace-pre-wrap">
                {line || '\u00A0'}
              </p>
            ))}
            {running && (
              <div className="flex items-center gap-2 pt-2">
                <Loader2 size={10} className="animate-spin text-brand-gold/50" />
                <span className="text-[9px] text-brand-gold/40">Processing...</span>
              </div>
            )}
          </div>
        )}
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
