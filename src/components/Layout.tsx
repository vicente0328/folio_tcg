import { Outlet, Link, useLocation } from 'react-router';
import { BookOpen, Library, Repeat, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout({ points }: { points: number }) {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: BookOpen },
    { name: 'Library', path: '/library', icon: Library },
    { name: 'Trade', path: '/trade', icon: Repeat },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-folio-bg border-x border-folio-card-bg shadow-2xl relative">
      <header className="py-4 px-6 border-b border-folio-card-bg flex items-center justify-between sticky top-0 bg-folio-bg/80 backdrop-blur-md z-10">
        <h1 className="font-serif text-2xl font-semibold tracking-widest text-folio-gold">FOLIO</h1>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full border border-folio-gold/30 bg-folio-gold/10 text-folio-gold-light text-xs font-medium">
            {points.toLocaleString()} pt
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-folio-card-bg/90 backdrop-blur-lg border-t border-white/5 z-20">
        <ul className="flex justify-around items-center py-3 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
                    isActive ? "text-folio-gold" : "text-folio-text-muted hover:text-white"
                  )}
                >
                  <Icon size={20} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]")} />
                  <span className="text-[10px] font-medium tracking-wider uppercase">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
