import React, { useState } from 'react';
import { 
  Building2, 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  ChevronRight,
  Filter,
  RefreshCw
} from 'lucide-react';
import { StationItem, CatalogMaterialItem, Receipt } from '../types/receipt';
import { UNITS_PRESET } from '../data/defaults';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface StationsViewProps {
  stations: StationItem[];
  receipts: Receipt[];
  onSelectStationFilter: (station: string) => void;
  onAddStation: (station: Omit<StationItem, 'id'>) => Promise<void>;
  onEditStation: (station: StationItem) => Promise<void>;
  onDeleteStation: (stationId: string) => Promise<void>;
  onRestoreDefaults?: () => Promise<void>;
  onClose: () => void;
}

export const StationsView: React.FC<StationsViewProps> = ({
  stations,
  receipts,
  onSelectStationFilter,
  onAddStation,
  onEditStation,
  onDeleteStation,
  onRestoreDefaults,
  onClose,
}) => {
  const [stationSearch, setStationSearch] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<StationItem | null>(null);
  const [stationToDelete, setStationToDelete] = useState<StationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCity, setFormCity] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openNewModal = () => {
    setEditingStation(null);
    setFormName('');
    setFormCode('');
    setFormCity('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (st: StationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStation(st);
    setFormName(st.name);
    setFormCode(st.code || '');
    setFormCity(st.city || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (st: StationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setStationToDelete(st);
  };

  const handleConfirmDeleteStation = async () => {
    if (!stationToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteStation(stationToDelete.id);
      setStationToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Informe o nome da estação ou posto de bombeiros.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      if (editingStation) {
        await onEditStation({
          id: editingStation.id,
          name: formName.trim(),
          code: formCode.trim() || undefined,
          city: formCity.trim() || undefined,
        });
      } else {
        await onAddStation({
          name: formName.trim(),
          code: formCode.trim() || undefined,
          city: formCity.trim() || undefined,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error(err);
      setFormError('Erro ao salvar estação.');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = stations.filter((s) =>
    s.name.toLowerCase().includes(stationSearch.toLowerCase().trim()) ||
    (s.city && s.city.toLowerCase().includes(stationSearch.toLowerCase().trim())) ||
    (s.code && s.code.toLowerCase().includes(stationSearch.toLowerCase().trim()))
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold text-slate-900">
              Estações e Postos de Bombeiros ({stations.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento das unidades de bombeiros atendidas para emissão de cargas e recibos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRestoreDefaults && (
            <button
              onClick={async () => {
                setIsRestoring(true);
                try {
                  await onRestoreDefaults();
                  setRestoreSuccess(true);
                  setTimeout(() => setRestoreSuccess(false), 4000);
                } finally {
                  setIsRestoring(false);
                }
              }}
              disabled={isRestoring}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
              title="Garante que todos os postos de bombeiros do B4 constem no banco de dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRestoring ? 'animate-spin' : ''}`} />
              {isRestoring ? 'Sincronizando...' : 'Restaurar Postos Padrão B4'}
            </button>
          )}

          <button
            onClick={openNewModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Estação
          </button>
          <button
            onClick={onClose}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-2 py-1"
          >
            Voltar
          </button>
        </div>
      </div>

      {restoreSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Postos de bombeiros sincronizados e salvos com sucesso no banco de dados Firestore!</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={stationSearch}
          onChange={(e) => setStationSearch(e.target.value)}
          placeholder="Buscar por nome, cidade ou sigla..."
          className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 shadow-2xs"
        />
      </div>

      {/* Grid of Stations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {filtered.map((item) => {
          const receiptsCount = receipts.filter((r) => r.station === item.name).length;
          const signedCount = receipts.filter((r) => r.station === item.name && r.status === 'signed').length;

          return (
            <div
              key={item.id}
              className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900 group-hover:text-red-700 transition-colors block">
                    {item.name}
                  </span>
                  {item.code && (
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                      {item.code}
                    </span>
                  )}
                </div>

                {item.city && (
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {item.city}
                  </span>
                )}

                <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-3 font-mono">
                  <span>{receiptsCount} recibo(s)</span>
                  <span>·</span>
                  <span className="text-emerald-600 font-semibold">{signedCount} assinado(s)</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onSelectStationFilter(item.name);
                    onClose();
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 transition-colors"
                  title="Ver recibos desta estação no painel"
                >
                  <Filter className="w-3 h-3" /> Filtrar Recibos
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => openEditModal(item, e)}
                    className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                    title="Editar Estação"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(item, e)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Excluir Estação"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Station */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-red-500" />
                {editingStation ? 'Editar Estação' : 'Cadastrar Nova Estação'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Estação / Posto:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: EB Praia Grande, BB Rio Branco..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sigla / Código:
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Ex: EB-PG"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Município / Região:
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Ex: Praia Grande"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : editingStation ? 'Atualizar Estação' : 'Cadastrar Estação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Estação */}
      <DeleteConfirmModal
        isOpen={!!stationToDelete}
        title="Excluir Estação de Bombeiros"
        message="Tem certeza que deseja remover esta estação do cadastro do quartel?"
        itemName={stationToDelete ? `${stationToDelete.name} (${stationToDelete.code || 'Sem sigla'})` : undefined}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDeleteStation}
        onCancel={() => setStationToDelete(null)}
      />

    </div>
  );
};

interface CatalogViewProps {
  materials: CatalogMaterialItem[];
  onAddMaterial: (material: Omit<CatalogMaterialItem, 'id'>) => Promise<void>;
  onEditMaterial: (material: CatalogMaterialItem) => Promise<void>;
  onDeleteMaterial: (materialId: string) => Promise<void>;
  onOpenNewReceiptWithMaterial?: (material: string) => void;
  onRestoreDefaults?: () => Promise<void>;
  onClose: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  materials,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  onOpenNewReceiptWithMaterial,
  onRestoreDefaults,
  onClose,
}) => {
  const [materialSearch, setMaterialSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<CatalogMaterialItem | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<CatalogMaterialItem | null>(null);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('Unid');
  const [formCategory, setFormCategory] = useState('APH / Resgate');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const categories = Array.from(
    new Set(materials.map((m) => m.category || 'Geral'))
  ).sort();

  const openNewModal = () => {
    setEditingMaterial(null);
    setFormName('');
    setFormUnit('Unid');
    setFormCategory('APH / Resgate');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (mat: CatalogMaterialItem) => {
    setEditingMaterial(mat);
    setFormName(mat.name);
    setFormUnit(mat.defaultUnit || 'Unid');
    setFormCategory(mat.category || 'Geral');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (mat: CatalogMaterialItem) => {
    setMaterialToDelete(mat);
  };

  const handleConfirmDeleteMaterial = async () => {
    if (!materialToDelete) return;
    setIsDeletingMaterial(true);
    try {
      await onDeleteMaterial(materialToDelete.id);
      setMaterialToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingMaterial(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Informe a descrição do material.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingMaterial) {
        await onEditMaterial({
          id: editingMaterial.id,
          name: formName.trim().toUpperCase(),
          defaultUnit: formUnit,
          category: formCategory.trim() || undefined,
        });
      } else {
        await onAddMaterial({
          name: formName.trim().toUpperCase(),
          defaultUnit: formUnit,
          category: formCategory.trim() || undefined,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error(err);
      setFormError('Erro ao salvar material.');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = materials.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(materialSearch.toLowerCase().trim());
    const matchesCat = categoryFilter === 'ALL' || (m.category || 'Geral') === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold text-slate-900">
              Catálogo de Materiais Recorrentes ({materials.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Itens padrão de intendência (B4) para preenchimento rápido em recibos de carga e descarga.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRestoreDefaults && (
            <button
              onClick={async () => {
                setIsRestoring(true);
                try {
                  await onRestoreDefaults();
                  setRestoreSuccess(true);
                  setTimeout(() => setRestoreSuccess(false), 4000);
                } finally {
                  setIsRestoring(false);
                }
              }}
              disabled={isRestoring}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
              title="Garante que todos os materiais mais recorrentes do catálogo do B4 constem no banco de dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRestoring ? 'animate-spin' : ''}`} />
              {isRestoring ? 'Sincronizando...' : 'Restaurar Catálogo Padrão B4'}
            </button>
          )}

          <button
            onClick={openNewModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Material
          </button>
          <button
            onClick={onClose}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-2 py-1"
          >
            Voltar
          </button>
        </div>
      </div>

      {restoreSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Catálogo de materiais padrão do B4 sincronizado e salvo com sucesso no banco de dados Firestore!</span>
        </div>
      )}

      {/* Search and Category Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={materialSearch}
            onChange={(e) => setMaterialSearch(e.target.value)}
            placeholder="Pesquisar material (ex: DEA, DRÄGER, COLETE, PRANCHA)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 shadow-2xs"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white shadow-2xs text-slate-700"
        >
          <option value="ALL">Todas as Categorias ({materials.length})</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Grid of Materials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((mat) => (
          <div
            key={mat.id}
            className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs group"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-xs text-slate-900 block leading-snug group-hover:text-red-700 transition-colors">
                  {mat.name}
                </span>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                  {mat.defaultUnit}
                </span>
              </div>

              {mat.category && (
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  {mat.category}
                </span>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              {onOpenNewReceiptWithMaterial ? (
                <button
                  type="button"
                  onClick={() => onOpenNewReceiptWithMaterial(mat.name)}
                  className="px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded transition-colors"
                  title="Emitir novo recibo contendo este material"
                >
                  + Emitir Carga
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(mat)}
                  className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                  title="Editar Material"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(mat)}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Excluir Material"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Material */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Package className="w-4 h-4 text-red-500" />
                {editingMaterial ? 'Editar Material' : 'Cadastrar Novo Material'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discriminação do Material:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: CILINDRO DRAGER DE COMPÓSITO COM TH..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidade Padrão:
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    {UNITS_PRESET.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria:
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Ex: APH, EPR, Incêndio..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : editingMaterial ? 'Atualizar Material' : 'Adicionar ao Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Material */}
      <DeleteConfirmModal
        isOpen={!!materialToDelete}
        title="Excluir Material do Catálogo"
        message="Tem certeza que deseja remover este material do catálogo padrão?"
        itemName={materialToDelete ? `${materialToDelete.name} (${materialToDelete.defaultUnit})` : undefined}
        isDeleting={isDeletingMaterial}
        onConfirm={handleConfirmDeleteMaterial}
        onCancel={() => setMaterialToDelete(null)}
      />

    </div>
  );
};
