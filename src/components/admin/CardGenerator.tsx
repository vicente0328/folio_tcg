import { useState } from 'react';
import { Loader2, Play, FileJson, AlertCircle, Search, BookOpen } from 'lucide-react';

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

export default function CardGenerator() {
  const [form, setForm] = useState<GeneratorForm>({
    book: '',
    author: '',
    lang: 'en',
    gutenbergId: '',
    prefix: '',
    count: '100',
  });
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Gutenberg search
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GutenbergResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const set = (field: keyof GeneratorForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const searchGutenberg = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSearchResults((data.results || []).slice(0, 10));
    } catch (err: any) {
      setError(`검색 실패: ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

  const selectBook = (book: GutenbergResult) => {
    set('gutenbergId', String(book.id));
    const authorName = book.authors[0]?.name || '';
    if (authorName && !form.author) set('author', authorName);
    if (!form.lang && book.languages[0]) set('lang', book.languages[0]);
    setShowSearch(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleGenerate = async () => {
    if (!form.book.trim()) { setError('책 제목을 입력하세요'); return; }
    if (!form.author.trim()) { setError('저자를 입력하세요'); return; }
    if (!form.prefix.trim() || form.prefix.length !== 2) { setError('Prefix는 2글자여야 합니다'); return; }
    if (!form.gutenbergId.trim()) { setError('Gutenberg ID를 입력하세요'); return; }

    setRunning(true);
    setOutput([]);
    setError('');

    const cmd = [
      'npx tsx scripts/generate-cards.ts',
      `--book "${form.book}"`,
      `--author "${form.author}"`,
      `--lang ${form.lang}`,
      `--gutenberg-id ${form.gutenbergId}`,
      `--prefix ${form.prefix.toUpperCase()}`,
      `--count ${form.count}`,
    ].join(' \\\n  ');

    setOutput([
      '═══════════════════════════════════════',
      '  FOLIO Card Generator',
      '═══════════════════════════════════════',
      '',
      '⚠ Card Generator는 서버에서 실행해야 합니다.',
      '  아래 명령어를 터미널에서 실행하세요:',
      '',
      '─── Command ───',
      '',
      cmd,
      '',
      '─── Options ───',
      '',
      '  --dry-run 추가 시 Firestore 저장 없이',
      '  JSON 파일로만 출력됩니다.',
      '',
      `  Output: scripts/output/${form.prefix.toUpperCase()}-cards.json`,
      '',
      '═══════════════════════════════════════',
    ]);

    setRunning(false);
  };

  const copyCommand = () => {
    const cmd = `npx tsx scripts/generate-cards.ts --book "${form.book}" --author "${form.author}" --lang ${form.lang} --gutenberg-id ${form.gutenbergId} --prefix ${form.prefix.toUpperCase()} --count ${form.count} --dry-run`;
    navigator.clipboard.writeText(cmd);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {/* Info */}
        <div className="bg-brand-brown/5 rounded-sm p-3 text-[10px] text-brand-brown/60 leading-relaxed tracking-wide">
          책 제목과 정보를 입력하면 Gemini AI가 명문장을 선별하고, 원문 검증 → 번역 → BTL 해설을 자동 생성합니다.
        </div>

        {/* Book + Author */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Book Title (Korean)">
            <input type="text" value={form.book} onChange={e => set('book', e.target.value)} className="field-input" placeholder="위대한 개츠비" />
          </Field>
          <Field label="Author">
            <input type="text" value={form.author} onChange={e => set('author', e.target.value)} className="field-input" placeholder="F. Scott Fitzgerald" />
          </Field>
        </div>

        {/* Lang + Prefix + Count */}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Language">
            <select value={form.lang} onChange={e => set('lang', e.target.value)} className="field-input">
              {['en', 'fr', 'ru', 'de', 'es', 'it', 'pt'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Prefix">
            <input type="text" value={form.prefix} onChange={e => set('prefix', e.target.value.toUpperCase().slice(0, 2))} className="field-input" placeholder="GG" maxLength={2} />
          </Field>
          <Field label="Card Count">
            <input type="number" value={form.count} onChange={e => set('count', e.target.value)} className="field-input" min={1} max={500} />
          </Field>
        </div>

        {/* Gutenberg ID with search */}
        <Field label="Project Gutenberg ID">
          <div className="flex gap-2">
            <input
              type="text"
              value={form.gutenbergId}
              onChange={e => set('gutenbergId', e.target.value)}
              className="field-input flex-1"
              placeholder="64317"
            />
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`px-3 rounded-sm border transition-colors flex items-center gap-1 text-[9px] tracking-[0.1em] uppercase ${
                showSearch
                  ? 'bg-brand-brown text-brand-cream border-brand-brown'
                  : 'border-brand-brown/15 text-brand-brown/50 hover:border-brand-brown/30'
              }`}
            >
              <Search size={12} />
              Search
            </button>
          </div>
        </Field>

        {/* Gutenberg search panel */}
        {showSearch && (
          <div className="border border-brand-brown/10 rounded-sm p-3 space-y-3 bg-brand-cream">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchGutenberg()}
                className="field-input flex-1"
                placeholder="Search by title or author..."
              />
              <button
                onClick={searchGutenberg}
                disabled={searching || !searchQuery.trim()}
                className="px-3 bg-brand-brown text-brand-cream rounded-sm text-[9px] tracking-[0.1em] uppercase disabled:opacity-50 flex items-center"
              >
                {searching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-[240px] overflow-y-auto no-scrollbar">
                {searchResults.map(book => (
                  <button
                    key={book.id}
                    onClick={() => selectBook(book)}
                    className="w-full text-left px-3 py-2 rounded-sm hover:bg-brand-brown/5 transition-colors flex items-start gap-2"
                  >
                    <BookOpen size={14} className="text-brand-brown/30 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-brand-brown truncate">{book.title}</p>
                      <p className="text-[9px] text-brand-brown/40 truncate">
                        {book.authors.map(a => a.name).join(', ') || 'Unknown'} · ID: {book.id} · {book.languages.join(', ')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searching && (
              <p className="text-[9px] text-brand-brown/40 text-center py-2">Searching Gutenberg...</p>
            )}

            {!searching && searchResults.length === 0 && searchQuery && (
              <p className="text-[9px] text-brand-brown/30 text-center py-2">No results. Try a different search term.</p>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-[10px] tracking-wide">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={running}
          className="w-full py-3 bg-brand-brown text-brand-cream rounded-sm text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-brand-brown/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Generate Command
        </button>

        {/* Output console */}
        {output.length > 0 && (
          <div className="bg-[#1C1410] rounded-sm p-4 space-y-0.5">
            {output.map((line, i) => (
              <p key={i} className="font-mono text-[10px] text-brand-cream/70 leading-relaxed whitespace-pre-wrap">
                {line || '\u00A0'}
              </p>
            ))}
            <button
              onClick={copyCommand}
              className="mt-3 flex items-center gap-1.5 text-[9px] tracking-[0.15em] uppercase text-brand-gold/60 hover:text-brand-gold transition-colors"
            >
              <FileJson size={12} />
              Copy Command
            </button>
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
