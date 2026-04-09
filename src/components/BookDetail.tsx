import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { getBookMetadata, type BookMetadata } from '../lib/firestore';

interface BookDetailProps {
  bookTitle: string;
  onClose: () => void;
}

export default function BookDetail({ bookTitle, onClose }: BookDetailProps) {
  const [data, setData] = useState<BookMetadata | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const meta = await getBookMetadata(bookTitle);
        setData(meta);
        setStatus(meta ? 'loaded' : 'error');
      } catch {
        setStatus('error');
      }
    })();
  }, [bookTitle]);

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-brand-cream z-[110] flex flex-col"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-brand-cream/95 backdrop-blur-sm z-10 border-b border-brand-brown/10 px-5 pt-14 pb-3 flex items-center gap-3">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full border border-brand-brown/15 flex items-center justify-center text-brand-brown/50 hover:text-brand-brown hover:border-brand-brown/30 transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-sm tracking-[0.1em] text-brand-brown truncate">{bookTitle}</h2>
          {data && (
            <p className="font-serif text-[9px] text-brand-brown/40 tracking-wide italic truncate">{data.originalTitle}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24">
            <motion.div
              className="w-10 h-10 rounded-full border border-brand-brown/15 flex items-center justify-center"
              animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="font-serif text-brand-brown/30 text-sm">F</span>
            </motion.div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <span className="font-serif text-brand-brown/20 text-3xl mb-4">F</span>
            <p className="text-brand-brown/40 text-[11px] tracking-wide leading-relaxed">
              이 책의 상세 정보가 아직 생성되지 않았습니다.
            </p>
          </div>
        )}

        {status === 'loaded' && data && (
          <div className="px-6 pb-24">

            {/* Plot Summary */}
            <Section title="줄거리">
              <p className="font-serif text-brand-brown/75 text-[12px] leading-[2.2] tracking-wide whitespace-pre-line">
                {data.plotSummary}
              </p>
            </Section>

            {/* Author */}
            <Section title="작가 소개">
              <h3 className="font-serif text-brand-brown text-sm tracking-[0.1em] mb-4">{data.author}</h3>
              <p className="font-serif text-brand-brown/75 text-[12px] leading-[2.2] tracking-wide whitespace-pre-line mb-6">
                {data.authorBio}
              </p>

              {data.authorWorks.length > 0 && (
                <div className="mb-6">
                  <span className="font-sans text-brand-brown/40 text-[9px] tracking-[0.2em] uppercase block mb-3">대표작</span>
                  <div className="flex flex-wrap gap-2">
                    {data.authorWorks.map((work) => (
                      <span key={work} className="font-serif text-[10px] text-brand-brown/60 border border-brand-brown/15 rounded-sm px-2.5 py-1 tracking-wide">
                        {work}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="font-serif text-brand-brown/75 text-[12px] leading-[2.2] tracking-wide whitespace-pre-line">
                {data.authorSignificance}
              </p>
            </Section>

            {/* Chapters */}
            {data.chapters.length > 0 && (
              <Section title="챕터별 요약">
                <div className="space-y-1">
                  {data.chapters.map((ch) => {
                    const isExpanded = expandedChapters.has(ch.id);
                    return (
                      <div key={ch.id} className="border-b border-brand-brown/8 last:border-b-0">
                        <button
                          onClick={() => toggleChapter(ch.id)}
                          className="w-full flex items-center justify-between py-3 text-left group"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <span className="font-sans text-brand-brown/35 text-[9px] tracking-[0.15em] uppercase">{ch.id}</span>
                            <span className="font-serif text-brand-brown/70 text-[11px] tracking-wide ml-2">{ch.title}</span>
                          </div>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown size={14} className="text-brand-brown/30" strokeWidth={1.5} />
                          </motion.div>
                        </button>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="font-serif text-brand-brown/60 text-[11px] leading-[2] tracking-wide pb-4 pl-1">
                              {ch.summary}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Literary Analysis */}
            <Section title="문학 비평">
              <p className="font-serif text-brand-brown/75 text-[12px] leading-[2.2] tracking-wide whitespace-pre-line mb-6">
                {data.literaryAnalysis}
              </p>

              {data.themes.length > 0 && (
                <div>
                  <span className="font-sans text-brand-brown/40 text-[9px] tracking-[0.2em] uppercase block mb-3">주요 테마</span>
                  <div className="flex flex-wrap gap-2">
                    {data.themes.map((theme) => (
                      <span key={theme} className="font-serif text-[10px] text-brand-brown/50 bg-brand-brown/5 rounded-sm px-2.5 py-1 tracking-wide">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Section>

          </div>
        )}
      </div>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-8 border-b border-brand-brown/8 last:border-b-0">
      <div className="flex flex-col items-center mb-6">
        <div className="w-6 h-[1px] bg-brand-brown/15 mb-3"></div>
        <span className="font-serif text-brand-brown/45 text-[10px] tracking-[0.4em] uppercase">{title}</span>
        <div className="w-6 h-[1px] bg-brand-brown/15 mt-3"></div>
      </div>
      {children}
    </section>
  );
}
