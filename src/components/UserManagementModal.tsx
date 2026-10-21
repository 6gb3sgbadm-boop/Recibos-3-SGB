import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  UserPlus, 
  Trash2, 
  X, 
  Check, 
  AlertCircle, 
  Loader2, 
  Lock, 
  Mail, 
  User as UserIcon,
  LogIn,
  FilePlus2
} from 'lucide-react';
import { User, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { OWNER_EMAIL } from '../data/defaults';
import { AuthorizedUser } from '../types/receipt';

interface UserManagementModalProps {
  isOpen: boolean;
  currentUser: User | null;
  authorizedUsers: AuthorizedUser[];
  onAddAuthorizedUser: (user: Omit<AuthorizedUser, 'id' | 'addedAt' | 'addedBy'>) => Promise<void>;
  onUpdateAuthorizedUser: (id: string, updates: Partial<AuthorizedUser>) => Promise<void>;
  onRemoveAuthorizedUser: (id: string) => Promise<void>;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  currentUser,
  authorizedUsers,
  onAddAuthorizedUser,
  onUpdateAuthorizedUser,
  onRemoveAuthorizedUser,
  onClose,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [canCreate, setCanCreate] = useState(true);
  const [canDelete, setCanDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOwner = currentUser?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  const handleLoginAsOwner = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user.email?.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
        setErrorMsg(
          `A conta conectada (${res.user.email}) não é o proprietário (${OWNER_EMAIL}). O painel de gestão é exclusivo do proprietário.`
        );
      }
    } catch (err: unknown) {
      console.error('Erro de autenticação:', err);
      const e = err as { code?: string };
      if (e.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Falha ao autenticar com Google.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailClean = newEmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      setErrorMsg('Informe um endereço de e-mail válido (ex: militar@gmail.com).');
      return;
    }

    if (emailClean === OWNER_EMAIL.toLowerCase()) {
      setErrorMsg('Este e-mail é o proprietário principal e já possui todas as permissões permanentemente.');
      return;
    }

    if (authorizedUsers.some((u) => u.email.toLowerCase() === emailClean)) {
      setErrorMsg('Este e-mail já está cadastrado na lista de autorizados.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddAuthorizedUser({
        email: emailClean,
        name: newName.trim() || undefined,
        canCreateReceipts: canCreate,
        canDeleteReceipts: canDelete,
      });

      setNewEmail('');
      setNewName('');
      setCanCreate(true);
      setCanDelete(false);
      setSuccessMsg(`Usuário ${emailClean} autorizado com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Erro ao salvar permissões do usuário no banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePermission = async (user: AuthorizedUser, field: 'canCreateReceipts' | 'canDeleteReceipts') => {
    setBusyUserId(user.id);
    try {
      await onUpdateAuthorizedUser(user.id, {
        [field]: !user[field],
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao atualizar permissão.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRemove = async (id: string, email: string) => {
    if (!window.confirm(`Deseja revogar o acesso do usuário ${email}?`)) {
      return;
    }
    setBusyUserId(id);
    try {
      await onRemoveAuthorizedUser(id);
      setSuccessMsg(`Acesso de ${email} revogado.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao remover usuário.');
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                Painel de Gestão de Acesso e Permissões
              </h2>
              <p className="text-xs text-slate-400">
                Controle quem pode gerar e excluir recibos no sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Owner Identity Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 flex items-center justify-center font-bold text-red-700">
                ★
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{OWNER_EMAIL}</span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                    Proprietário Principal
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Acesso total e irrestrito permanente (geração, exclusão e gestão de acessos).
                </p>
              </div>
            </div>

            {!isOwner && (
              <button
                onClick={handleLoginAsOwner}
                disabled={isLoggingIn}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow-xs shrink-0"
              >
                {isLoggingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                <span>Entrar como Proprietário</span>
              </button>
            )}
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* If current user is not owner, show restricted notice for adding/editing */}
          {!isOwner ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
              <Lock className="w-8 h-8 text-amber-600 mx-auto" />
              <h3 className="text-sm font-bold text-amber-900">
                Autenticação de Proprietário Necessária
              </h3>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                Para adicionar novos usuários ou alterar permissões de emissão e exclusão, conecte-se com a conta Google do proprietário (<strong>{OWNER_EMAIL}</strong>).
              </p>
            </div>
          ) : (
            /* Add Authorized User Form */
            <form onSubmit={handleAddUser} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <UserPlus className="w-4 h-4 text-red-600" />
                <span>Autorizar Novo Gmail / Conta Google</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    E-mail Google (Gmail) *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="exemplo@gmail.com"
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nome / Posto / Identificação
                  </label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ex: Cb PM Sedrez / Encarregado"
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions Checkboxes */}
              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={canCreate}
                      onChange={(e) => setCanCreate(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span>Permitir <strong>Gerar Novos Recibos</strong></span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={canDelete}
                      onChange={(e) => setCanDelete(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span className="text-red-700">Permitir <strong>Excluir Recibos</strong></span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-lg transition shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Liberar Acesso</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* List of Authorized Users */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Usuários Autorizados no Sistema ({authorizedUsers.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Demais visitantes visualizam o painel e assinam
              </span>
            </div>

            {authorizedUsers.length === 0 ? (
              <div className="p-6 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
                Nenhum outro usuário autorizado no momento. Apenas o proprietário ({OWNER_EMAIL}) possui permissões de emissão e exclusão.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {authorizedUsers.map((user) => {
                  const isBusy = busyUserId === user.id;

                  return (
                    <div
                      key={user.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{user.email}</span>
                          {user.name && (
                            <span className="text-[11px] text-slate-500 font-medium">({user.name})</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Autorizado em {user.addedAt ? new Date(user.addedAt).toLocaleDateString('pt-BR') : 'Data não informada'}
                        </p>
                      </div>

                      {/* Permissions badges & actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {/* Can Create Badge / Toggle */}
                        <button
                          type="button"
                          disabled={!isOwner || isBusy}
                          onClick={() => handleTogglePermission(user, 'canCreateReceipts')}
                          title={isOwner ? 'Clique para alternar permissão de gerar recibos' : 'Permissão de geração'}
                          className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                            user.canCreateReceipts
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                          } ${!isOwner ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <FilePlus2 className="w-3 h-3" />
                          <span>{user.canCreateReceipts ? 'Pode Gerar' : 'Sem Gerar'}</span>
                        </button>

                        {/* Can Delete Badge / Toggle */}
                        <button
                          type="button"
                          disabled={!isOwner || isBusy}
                          onClick={() => handleTogglePermission(user, 'canDeleteReceipts')}
                          title={isOwner ? 'Clique para alternar permissão de exclusão' : 'Permissão de exclusão'}
                          className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                            user.canDeleteReceipts
                              ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                          } ${!isOwner ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{user.canDeleteReceipts ? 'Pode Excluir' : 'Sem Excluir'}</span>
                        </button>

                        {/* Revoke button */}
                        {isOwner && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleRemove(user.id, user.email)}
                            title="Revogar todas as autorizações"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-1"
                          >
                            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Alterações são sincronizadas em tempo real com o banco de dados.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
