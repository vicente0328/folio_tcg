import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, ChevronRight } from 'lucide-react';
import { type UserProfile } from '../../context/AuthContext';

interface CollectorListProps {
  collectors: UserProfile[];
  loading: boolean;
  onSelectCollector: (collector: UserProfile) => void;
}

export default function CollectorList({ collectors, loading, onSelectCollector }: CollectorListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery.trim()
    ? collectors.filter(c =>
        c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : collectors;

  if (loading) {
    return (
      <div className="flex justify-center pt-16">
        <div className="w-8 h-8 rounded-full border-[0.5px] border-brand-brown/20 flex items-center justify-center animate-pulse">
          <span className="font-serif text-brand-brown/40 text-sm">F</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Search */}
      <div className="relative">
        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/30" />
        <input
          type="text"
          placeholder="Search collectors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border border-brand-brown/15 rounded-sm pl-9 pr-4 py-2.5 text-[11px] text-brand-brown placeholder:text-brand-brown/25 focus:outline-none focus:border-brand-brown/40 tracking-wide transition-colors"
        />
      </div>

      {/* Collector list */}
      {filtered.length === 0 ? (
        <p className="text-center text-brand-brown/30 text-[11px] font-serif italic pt-8">
          {searchQuery ? 'No collectors found' : 'No other collectors yet'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((collector, i) => (
            <motion.button
              key={collector.uid}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectCollector(collector)}
              className="flex items-center justify-between w-full border border-brand-brown/10 rounded-lg px-5 py-4 bg-brand-cream hover:border-brand-brown/25 transition-colors text-left group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full border-[0.5px] border-brand-brown/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-serif text-brand-brown text-sm">{collector.displayName[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-serif text-brand-brown text-[12px] tracking-wide">{collector.displayName}</p>
                  <p className="text-brand-brown/35 text-[9px] tracking-widest uppercase mt-0.5">Collector</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} className="text-brand-brown/20 group-hover:text-brand-brown/40 transition-colors" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
