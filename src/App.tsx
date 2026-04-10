import React, { useState, useEffect } from 'react';
import { BookOpen, Store, Users, Sparkles, Menu, LogOut, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider, useGame } from './context/GameContext';
import Encounter from './components/Encounter';
import Library from './components/Library';
import StoreTab from './components/StoreTab';
import Market from './components/Market';
import AdminPanel from './components/AdminPanel';
import AttendanceModal from './components/AttendanceModal';

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { user, loading, signIn, signInEmail } = useAuth();
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInEmail(email, password);
    } catch (err: any) {
      setLoginError(err.code === 'auth/invalid-credential' ? 'Invalid email or password' : err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full border-[0.5px] border-brand-brown/30 flex items-center justify-center animate-pulse">
          <span className="font-serif text-brand-brown text-xl">F</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center max-w-md mx-auto px-8 border-x border-brand-brown/5 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 card-texture pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full border-[0.5px] border-brand-brown flex items-center justify-center mb-6">
            <span className="font-serif text-brand-brown text-3xl">F</span>
          </div>

          <h1 className="font-serif text-3xl tracking-[0.3em] uppercase text-brand-brown mb-2">Folio</h1>
          <p className="text-brand-brown/40 text-[10px] tracking-[0.3em] uppercase mb-12">
            Classic Literature Card Collection
          </p>

          <div className="w-12 h-[1px] bg-brand-brown/15 mb-12"></div>

          <p className="text-brand-brown/50 text-[11px] tracking-wide leading-relaxed max-w-[260px] mb-8">
            위대한 문장을 소유하는 가장 아름다운 방법.<br />
            고전 문학 명문장을 수집하고 교환하세요.
          </p>

          <button
            onClick={signIn}
            className="bg-brand-brown text-brand-cream px-10 py-3 rounded-sm text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-brand-brown/90 transition-colors duration-500 shadow-lg mb-4 w-full max-w-[240px]"
          >
            Sign in with Google
          </button>

          {!showEmailLogin ? (
            <button
              onClick={() => setShowEmailLogin(true)}
              className="text-brand-brown/40 text-[9px] tracking-[0.2em] uppercase hover:text-brand-brown/60 transition-colors"
            >
              Sign in with Email
            </button>
          ) : (
            <form onSubmit={handleEmailLogin} className="w-full max-w-[240px] mt-4 flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-brand-brown/20 rounded-sm px-4 py-2.5 text-[11px] text-brand-brown placeholder:text-brand-brown/30 focus:outline-none focus:border-brand-brown/50 tracking-wide"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-brand-brown/20 rounded-sm px-4 py-2.5 text-[11px] text-brand-brown placeholder:text-brand-brown/30 focus:outline-none focus:border-brand-brown/50 tracking-wide"
              />
              {loginError && (
                <p className="text-red-500/70 text-[9px] tracking-wide">{loginError}</p>
              )}
              <button
                type="submit"
                className="bg-brand-orange text-brand-cream px-6 py-2.5 rounded-sm text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-brand-orange/90 transition-colors"
              >
                Sign In
              </button>
            </form>
          )}

          <p className="text-brand-brown/25 text-[9px] tracking-wide mt-6">v1.0 · Season 1</p>
        </div>
      </div>
    );
  }

  return (
    <GameProvider>
      <AttendanceModal />
      <MainApp />
    </GameProvider>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('encounter');
  const [menuOpen, setMenuOpen] = useState(false);
  const [boutiquePurchase, setBoutiquePurchase] = useState<{ cards: import('./data/cards').CardData[]; packName: string } | null>(null);
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['encounter', 'library']));
  const { points } = useGame();
  const { signOut, userProfile } = useAuth();

  // Lazy mount: track visited tabs so they stay in DOM
  useEffect(() => {
    setMountedTabs(prev => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  // Boutique purchase → switch to Encounter with drawn cards
  const handleBoutiquePurchase = (cards: import('./data/cards').CardData[], packName: string) => {
    setBoutiquePurchase({ cards, packName });
    setActiveTab('encounter');
  };

  return (
    <div className="bg-brand-cream text-brand-brown font-sans flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden border-x border-brand-brown/5" style={{ height: '100dvh' }}>
      {/* Header - Symmetrical and Elegant */}
      <header className="pt-14 pb-4 px-6 bg-brand-cream flex justify-between items-center z-10 relative border-b border-brand-brown/10 flex-shrink-0">
        <div className="absolute inset-0 opacity-30 card-texture pointer-events-none"></div>

        {/* Left: Menu Icon */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 flex justify-start text-brand-brown hover:text-brand-orange transition-colors relative z-10"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>

        {/* Center: Logo */}
        <h1 className="font-serif text-xl tracking-[0.3em] font-medium text-brand-brown uppercase text-center flex-1">
          Folio
        </h1>

        {/* Right: Points */}
        <div className="w-8 flex justify-end items-center gap-1.5 relative z-10">
          <span className="text-brand-brown font-serif text-sm">{points}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-brand-orange"></div>
        </div>
      </header>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-28 left-4 z-50 bg-brand-cream border border-brand-brown/10 rounded-sm shadow-xl p-4 min-w-[180px]"
            onClick={() => setMenuOpen(false)}
          >
            <div className="mb-3 pb-3 border-b border-brand-brown/10">
              <p className="text-[10px] tracking-[0.2em] uppercase text-brand-brown/50 mb-1">Collector</p>
              <p className="text-[11px] text-brand-brown font-serif">{userProfile?.displayName || 'Anonymous'}</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-brand-brown/60 hover:text-brand-orange transition-colors w-full"
            >
              <LogOut size={14} strokeWidth={1.5} />
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 relative bg-brand-cream overflow-hidden">
        <div className="absolute inset-0 opacity-40 card-texture pointer-events-none z-0"></div>
        <div className="relative z-10 h-full">
          {/* Persistent mount — tabs stay in DOM once visited, pure CSS transitions */}
          {mountedTabs.has('encounter') && (
            <div
              className={`absolute inset-0 overflow-y-auto no-scrollbar transition-opacity duration-100 ease-out ${activeTab === 'encounter' ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'}`}
            >
              <Encounter
                injectedCards={boutiquePurchase?.cards}
                injectedPackName={boutiquePurchase?.packName}
                onInjectedComplete={() => {
                  setBoutiquePurchase(null);
                  setActiveTab('store');
                }}
              />
            </div>
          )}
          {mountedTabs.has('library') && (
            <div
              className={`absolute inset-0 overflow-y-auto no-scrollbar transition-opacity duration-100 ease-out ${activeTab === 'library' ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'}`}
            >
              <Library />
            </div>
          )}
          {mountedTabs.has('store') && (
            <div
              className={`absolute inset-0 overflow-y-auto no-scrollbar transition-opacity duration-100 ease-out ${activeTab === 'store' ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'}`}
            >
              <StoreTab onPurchaseComplete={handleBoutiquePurchase} />
            </div>
          )}
          {mountedTabs.has('market') && (
            <div
              className={`absolute inset-0 overflow-y-auto no-scrollbar transition-opacity duration-100 ease-out ${activeTab === 'market' ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'}`}
            >
              <Market />
            </div>
          )}
          {mountedTabs.has('admin') && (
            <div
              className={`absolute inset-0 overflow-y-auto no-scrollbar transition-opacity duration-100 ease-out ${activeTab === 'admin' ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'}`}
            >
              <AdminPanel />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-brand-cream text-brand-brown/40 pb-8 pt-4 px-8 flex justify-between items-center relative z-10 border-t border-brand-brown/10 flex-shrink-0">
        <div className="absolute inset-0 opacity-30 card-texture pointer-events-none"></div>

        <NavItem
          icon={<Sparkles size={22} strokeWidth={1.5} />}
          label="Encounter"
          isActive={activeTab === 'encounter'}
          onClick={() => setActiveTab('encounter')}
        />
        <NavItem
          icon={<BookOpen size={22} strokeWidth={1.5} />}
          label="Library"
          isActive={activeTab === 'library'}
          onClick={() => setActiveTab('library')}
        />
        <NavItem
          icon={<Store size={22} strokeWidth={1.5} />}
          label="Boutique"
          isActive={activeTab === 'store'}
          onClick={() => setActiveTab('store')}
        />
        <NavItem
          icon={<Users size={22} strokeWidth={1.5} />}
          label="Exchange"
          isActive={activeTab === 'market'}
          onClick={() => setActiveTab('market')}
        />
        {userProfile?.email === 'admin@folio.com' && (
          <NavItem
            icon={<Settings size={22} strokeWidth={1.5} />}
            label="Admin"
            isActive={activeTab === 'admin'}
            onClick={() => setActiveTab('admin')}
          />
        )}
      </nav>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-colors duration-150 relative ${isActive ? 'text-brand-brown' : 'hover:text-brand-brown/70'}`}
    >
      <div className="relative">
        {icon}
        {isActive && (
          <motion.div
            layoutId="nav-dot"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-orange rounded-full"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
      </div>
      <span className={`text-[9px] uppercase tracking-[0.2em] ${isActive ? 'font-medium' : 'font-light'}`}>{label}</span>
    </button>
  );
}
