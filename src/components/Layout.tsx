import { Outlet, Link, useLocation } from 'react-router';
import { BookOpen, Library, ArrowRightLeft, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const NAV = [
  { label: '상점', path: '/', icon: BookOpen },
  { label: '서재', path: '/library', icon: Library },
  { label: '교환', path: '/trade', icon: ArrowRightLeft },
  { label: '수집가', path: '/profile', icon: User },
];

export default function Layout({ points }: { points: number }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-folio-bg border-x border-folio-border/40 relative">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-folio-bg/92 backdrop-blur-md">
        <div className="flex items-center justify-between px-5 py-4">
          <Link to="/" className="font-serif text-lg font-light tracking-[0.45em] text-folio-gold/90">
            FOLIO
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 border border-folio-border-light/50 bg-folio-surface/40 rounded-[2px]">
            <span className="font-serif text-[10px] text-folio-text-muted/50 tracking-[0.15em]">PT</span>
            <span className="font-serif text-[13px] text-folio-gold-light/90 font-medium tracking-wider">
              {points.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="ornament-line" />
      </header>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto pb-[4.5rem]">
        <Outlet />
      </main>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 w-full max-w-md z-30">
        <div className="ornament-line" />
        <div className="bg-folio-bg/94 backdrop-blur-lg">
          <ul className="flex justify-around items-center py-2 px-2">
            {NAV.map((item) => {
              const active = pathname === item.path;
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex flex-col items-center gap-[3px] px-3 py-1.5 transition-all duration-400",
                      active ? "text-folio-gold" : "text-folio-text-muted/40 hover:text-folio-text-muted/70"
                    )}
                  >
                    <Icon size={17} strokeWidth={active ? 1.6 : 1.1} />
                    <span className="font-serif text-[8px] tracking-[0.25em] uppercase">{item.label}</span>
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="w-3 h-[1px] bg-folio-gold/50"
                        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}
