import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  X, 
  Lock, 
  Loader2, 
  AlertCircle,
  LogOut
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { OWNER_EMAIL } from '../data/defaults';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const isOwner = currentUser?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  const handleGoogleOwnerLogin = async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      const email = res.user.email?.toLowerCase();
      
      if (email !== OWNER_EMAIL.toLowerCase()) {
        setAuthError(
          `Acesso não autorizado: A conta conectada (${res.user.email}) não é o proprietário cadastrado (${OWNER_EMAIL}). Apenas o proprietário pode excluir recibos.`
        );
      }
    } catch (err: unknown) {
      console.error('Erro na autenticação de segurança:', err);
      const errObj = err as { code?: string; message?: string };
      if (errObj.code !== 'auth/popup-closed-by-user') {
        setAuthError('Não foi possível autenticar a conta Google. Tente novamente.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAuthError(null);
    } catch (err) {
      console.error('Erro ao desconectar:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header de Segurança */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <ShieldAlert className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">{title}</h3>
              <p className="text-[11px] text-slate-400">Proteção de Segurança Operacional · B4</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting || isAuthenticating}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 transition-colors hover:bg-slate-800 disabled:opacity-50"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {message}
          </p>

          {itemName && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
              <span className="truncate">{itemName}</span>
            </div>
          )}

          {/* Painel de Validação do Proprietário */}
          {isOwner ? (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold">Proprietário Verificado</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
                  title="Trocar de conta"
                >
                  <LogOut className="w-3 h-3" />
                  Alternar conta
                </button>
              </div>
              <p className="text-[11px] text-emerald-700 leading-tight">
                Identidade autenticada como <strong className="font-semibold text-emerald-900">{currentUser?.email}</strong>. 
                Sua permissão administrativa para exclusão está desbloqueada.
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-900">
                    Ação Restrita ao Proprietário
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Usuários finais ou receptores <strong>não podem excluir recibos</strong>. Para prosseguir, autentique-se com a conta proprietária:
                    <span className="block font-mono font-bold text-slate-900 mt-0.5">
                      {OWNER_EMAIL}
                    </span>
                  </p>
                </div>
              </div>

              {authError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span className="text-[11px] leading-tight">{authError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleOwnerLogin}
                disabled={isAuthenticating}
                className="w-full flex items-center justify-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                    <span>Verificando credenciais Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Autenticar como Proprietário ({OWNER_EMAIL})</span>
                  </>
                )}
              </button>
            </div>
          )}

          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
            Aviso: A exclusão é definitiva e sincronizada instantaneamente com as regras de segurança do banco de dados na nuvem.
          </p>
        </div>

        {/* Rodapé com Ações */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Permissão RBAC Ativa</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isDeleting || isAuthenticating}
              onClick={onCancel}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>

            {isOwner ? (
              <button
                type="button"
                disabled={isDeleting}
                onClick={onConfirm}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão Definitiva'}
              </button>
            ) : (
              <button
                type="button"
                disabled={true}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-400 bg-slate-200 rounded-lg cursor-not-allowed"
                title="Autentique-se como proprietário acima para habilitar a exclusão"
              >
                <Lock className="w-3.5 h-3.5" />
                Exclusão Bloqueada
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
