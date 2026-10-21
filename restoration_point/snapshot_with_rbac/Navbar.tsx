import React, { useState } from 'react';
import { 
  Plus, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Users, 
  Menu, 
  X,
  Lock
} from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  currentUser: User | null;
  isOwner: boolean;
  canCreateReceipts: boolean;
  onOpenNewReceipt: () => void;
  onOpenUserManagement: () => void;
  onLoginGoogle: () => void;
  onLogoutGoogle: () => void;
  onSelectNav: (nav: 'receipts' | 'stations' | 'catalog') => void;
  currentNav: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  isOwner,
  canCreateReceipts,
  onOpenNewReceipt,
  onOpenUserManagement,
  onLoginGoogle,
  onLogoutGoogle,
  onSelectNav,
  currentNav,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-16">
        
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-base shadow-sm">
            🚒
          </div>
          <div>
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-white uppercase block leading-tight">
              Corpo de Bombeiros
            </span>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              6º GB · 3º SGB · B4 Almoxarifado
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <button
            onClick={() => onSelectNav('receipts')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 ${
              currentNav === 'receipts'
                ? 'text-white border-b-2 border-red-500 font-bold'
                : 'hover:text-white'
            }`}
          >
            Painel de Recibos
          </button>
          
          <button
            onClick={() => onSelectNav('stations')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 ${
              currentNav === 'stations'
                ? 'text-white border-b-2 border-red-500 font-bold'
                : 'hover:text-white'
            }`}
          >
            Estações Operacionais
          </button>

          <button
            onClick={() => onSelectNav('catalog')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 ${
              currentNav === 'catalog'
                ? 'text-white border-b-2 border-red-500 font-bold'
                : 'hover:text-white'
            }`}
          >
            Catálogo de Materiais
          </button>
        </nav>

        {/* Zone 3: Actions (User Management, New Receipt & Auth) */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Painel de Gestão de Usuários (RBAC) */}
          <button
            type="button"
            onClick={onOpenUserManagement}
            title={isOwner ? 'Gerenciar e-mails autorizados para emitir e excluir recibos' : 'Ver permissões do sistema'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              isOwner
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-900 border-amber-300 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isOwner ? 'text-slate-900' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">Gestão de Acesso</span>
            <span className="sm:hidden">Acessos</span>
          </button>

          {/* Botão Novo Recibo */}
          <button
            type="button"
            onClick={onOpenNewReceipt}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-sm"
            title={canCreateReceipts ? 'Emitir Novo Recibo Oficial' : 'Emissão restrita a usuários autorizados'}
          >
            {canCreateReceipts ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-red-200" />}
            <span>Novo Recibo</span>
          </button>

          {/* Autenticação Google */}
          <div className="border-l border-slate-800 pl-2.5 ml-1 flex items-center">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden xl:block">
                  <p className="text-[11px] font-bold text-white leading-tight truncate max-w-[130px]">
                    {currentUser.displayName || currentUser.email}
                  </p>
                  <p className="text-[10px] text-amber-300 font-medium">
                    {isOwner ? '★ Proprietário' : canCreateReceipts ? 'Autorizado' : 'Leitor'}
                  </p>
                </div>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Perfil"
                    className="w-7 h-7 rounded-full border border-amber-400"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-bold">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={onLogoutGoogle}
                  title="Sair da conta Google"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLoginGoogle}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition border border-slate-700"
                title="Conectar com conta Google para liberar permissões"
              >
                <LogIn className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => {
              onSelectNav('receipts');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition ${
              currentNav === 'receipts' ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Painel de Recibos
          </button>

          <button
            onClick={() => {
              onSelectNav('stations');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition ${
              currentNav === 'stations' ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Estações Operacionais
          </button>

          <button
            onClick={() => {
              onSelectNav('catalog');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition ${
              currentNav === 'catalog' ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Catálogo de Materiais
          </button>
        </div>
      )}
    </header>
  );
};
