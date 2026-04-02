import React, { useState } from 'react';
import { BookOpen, Store, Users, Sparkles, Menu } from 'lucide-react';
import Encounter from './components/Encounter';
import Library from './components/Library';
import StoreTab from './components/StoreTab';
import Market from './components/Market';

export default function App() {
  const [activeTab, setActiveTab] = useState('encounter');

  return (
    <div className="min-h-screen bg-brand-cream text-brand-brown font-sans flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden border-x border-brand-brown/5">
      {/* Header - Symmetrical and Elegant */}
      <header className="pt-14 pb-4 px-6 bg-brand-cream flex justify-between items-center z-10 relative border-b border-brand-brown/10">
        <div className="absolute inset-0 opacity-30 card-texture pointer-events-none"></div>

        {/* Left: Menu Icon (for symmetry) */}
        <button className="w-8 flex justify-start text-brand-brown hover:text-brand-orange transition-colors">
          <Menu size={20} strokeWidth={1.5} />
        </button>

        {/* Center: Logo */}
        <h1 className="font-serif text-xl tracking-[0.3em] font-medium text-brand-brown uppercase text-center flex-1">
          Folio
        </h1>

        {/* Right: Points */}
        <div className="w-8 flex justify-end items-center gap-1.5">
          <span className="text-brand-brown font-serif text-sm">1250</span>
          <div className="w-1.5 h-1.5 rounded-full bg-brand-orange"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative no-scrollbar bg-brand-cream">
        <div className="absolute inset-0 opacity-40 card-texture pointer-events-none z-0"></div>
        <div className="relative z-10 h-full">
          {activeTab === 'encounter' && <Encounter />}
          {activeTab === 'library' && <Library />}
          {activeTab === 'store' && <StoreTab />}
          {activeTab === 'market' && <Market />}
        </div>
      </main>

      {/* Bottom Navigation - Symmetrical */}
      <nav className="bg-brand-cream text-brand-brown/40 pb-8 pt-4 px-8 flex justify-between items-center relative z-10 border-t border-brand-brown/10">
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
      </nav>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-all duration-500 relative ${isActive ? 'text-brand-brown' : 'hover:text-brand-brown/70'}`}
    >
      <div className="relative">
        {icon}
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-orange rounded-full"></div>
        )}
      </div>
      <span className={`text-[9px] uppercase tracking-[0.2em] ${isActive ? 'font-medium' : 'font-light'}`}>{label}</span>
    </button>
  );
}
