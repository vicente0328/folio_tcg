import { Outlet, Link, useLocation } from 'react-router';
import { BookOpen, Library, Repeat, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout({ points }: { points: number }) {
  const location = useLocation();

  const navItems = [
    { name: '상점', path: '/', icon: BookOpen },
    { name: '서재', path: '/library', icon: Library },
    { name: '교환', path: '/trade', icon: Repeat },
    { name: '수집가', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-folio-bg border-x border-folio-border/50 relative">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-folio-bg/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-5 py-4">
          <Link to="/" className="font-serif text-xl font-light tracking-[0.35em] text-folio-gold">
            FOLIO
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 border border-folio-border-light/60 bg-folio-surface/50">
            <span className="font-serif text-[11px] text-folio-text-muted tracking-wider">PT</span>
            <span className="font-serif text-sm text-folio-gold-light font-medium">{points.toLocaleString()}</span>
          </div>
        </div>
        <div className="h-[1px] bg-gradient-to-r from-transparent via-folio-border-light/60 to-transparent" />
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 px-5">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md z-20">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-folio-border-light/40 to-transparent" />
        <div className="bg-folio-bg/95 backdrop-blur-lg">
          <ul className="flex justify-around items-center py-2.5 px-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex flex-col items-center gap-1 px-4 py-1.5 transition-all duration-300",
                      isActive
                        ? "text-folio-gold"
                        : "text-folio-text-muted/60 hover:text-folio-text-muted"
                    )}
                  >
                    <Icon size={18} strokeWidth={isActive ? 1.8 : 1.2} />
                    <span className={cn(
                      "text-[9px] tracking-[0.2em] uppercase font-serif",
                      isActive && "text-folio-gold"
                    )}>
                      {item.name}
                    </span>
                    {isActive && (
                      <div className="w-4 h-[1px] bg-folio-gold/60 mt-0.5" />
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
