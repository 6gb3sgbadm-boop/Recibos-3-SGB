import React from 'react';
import { Plus } from 'lucide-react';

interface NavbarProps {
  onOpenNewReceipt: () => void;
  onSelectNav: (nav: 'receipts' | 'stations' | 'catalog') => void;
  currentNav: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewReceipt,
  onSelectNav,
  currentNav,
}) => {
  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-base shadow-sm">
            🚒
          </div>
          <span className="text-base font-extrabold tracking-tight text-white uppercase">
            Corpo de Bombeiros · 6º GB / B4
          </span>
        </div>

        {/* Zone 2: 4–5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <button
            onClick={() => onSelectNav('receipts')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentNav === 'receipts'
                ? 'text-white border-b-2 border-red-500 pb-0.5'
                : 'hover:text-white'
            }`}
          >
            Painel de Recibos
          </button>
          
          <button
            onClick={() => onSelectNav('stations')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentNav === 'stations'
                ? 'text-white border-b-2 border-red-500 pb-0.5'
                : 'hover:text-white'
            }`}
          >
            Estações Operacionais
          </button>

          <button
            onClick={() => onSelectNav('catalog')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentNav === 'catalog'
                ? 'text-white border-b-2 border-red-500 pb-0.5'
                : 'hover:text-white'
            }`}
          >
            Catálogo de Materiais
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenNewReceipt}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            + Novo Recibo
          </button>
        </div>

      </div>
    </header>
  );
};
