import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  PenTool, 
  CheckCircle2, 
  Clock, 
  Download, 
  Trash2, 
  Eye,
  Plus,
  X
} from 'lucide-react';
import { Receipt, StationItem } from '../types/receipt';
import { STATIONS_PRESET } from '../data/defaults';

interface ReceiptsTableProps {
  receipts: Receipt[];
  stations?: StationItem[];
  selectedStationFilter?: string;
  onStationFilterChange?: (station: string) => void;
  onViewPrint: (receipt: Receipt) => void;
  onOpenSignature: (receipt: Receipt) => void;
  onDeleteReceipt: (receipt: Receipt) => void;
  onOpenNewReceipt: () => void;
  canCreateReceipts?: boolean;
}

export const ReceiptsTable: React.FC<ReceiptsTableProps> = ({
  receipts,
  stations,
  selectedStationFilter,
  onStationFilterChange,
  onViewPrint,
  onOpenSignature,
  onDeleteReceipt,
  onOpenNewReceipt,
  canCreateReceipts,
}) => {
  // Consultation filters
  const [internalStationFilter, setInternalStationFilter] = useState('ALL');
  const stationFilter = selectedStationFilter !== undefined ? selectedStationFilter : internalStationFilter;

  const setStationFilter = (val: string) => {
    setInternalStationFilter(val);
    if (onStationFilterChange) {
      onStationFilterChange(val);
    }
  };
  const [militaryFilter, setMilitaryFilter] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'pending' | 'signed'>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');

  // Available years from existing receipts plus current and next calendar year
  const currentCalendarYear = new Date().getFullYear();
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([currentCalendarYear, currentCalendarYear + 1]);
    receipts.forEach((r) => {
      if (r.year) yearsSet.add(r.year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [receipts, currentCalendarYear]);

  // Combined stations list
  const stationOptions = useMemo(() => {
    if (stations && stations.length > 0) {
      return stations.map((s) => s.name);
    }
    return [...STATIONS_PRESET];
  }, [stations]);

  // Clear all filters helper
  const handleClearFilters = () => {
    setStationFilter('ALL');
    setMilitaryFilter('');
    setMaterialFilter('');
    setStatusFilter('ALL');
    setYearFilter('ALL');
  };

  const hasActiveFilters = 
    stationFilter !== 'ALL' || 
    militaryFilter.trim() !== '' || 
    materialFilter.trim() !== '' || 
    statusFilter !== 'ALL' || 
    yearFilter !== 'ALL';

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((rc) => {
      // Year filter
      if (yearFilter !== 'ALL' && rc.year !== parseInt(yearFilter)) {
        return false;
      }
      // Station filter
      if (stationFilter !== 'ALL' && rc.station !== stationFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && rc.status !== statusFilter) {
        return false;
      }
      // Military filter (deliveredBy or receivedBy or signerName)
      if (militaryFilter.trim()) {
        const milQuery = militaryFilter.toLowerCase().trim();
        const deliv = (rc.deliveredBy || '').toLowerCase();
        const rec = (rc.receivedBy || '').toLowerCase();
        const signer = (rc.signerName || '').toLowerCase();
        const email = (rc.signerEmail || '').toLowerCase();
        if (!deliv.includes(milQuery) && !rec.includes(milQuery) && !signer.includes(milQuery) && !email.includes(milQuery)) {
          return false;
        }
      }
      // Material filter (items material, notes, or receipt observations)
      if (materialFilter.trim()) {
        const matQuery = materialFilter.toLowerCase().trim();
        const matchItem = rc.items?.some(
          (it) =>
            it.material.toLowerCase().includes(matQuery) ||
            (it.notes || '').toLowerCase().includes(matQuery)
        );
        const matchObs = (rc.observations || '').toLowerCase().includes(matQuery);
        if (!matchItem && !matchObs) {
          return false;
        }
      }

      return true;
    });
  }, [receipts, stationFilter, militaryFilter, materialFilter, statusFilter, yearFilter]);

  // Statistics
  const totalCount = receipts.length;
  const signedCount = receipts.filter((r) => r.status === 'signed').length;
  const pendingCount = receipts.filter((r) => r.status === 'pending').length;

  // Export to CSV format matching the fire department spreadsheet
  const handleExportCSV = () => {
    if (receipts.length === 0) return;

    const headers = [
      'n°',
      'Material1', 'Unid1', 'Quant1',
      'Material2', 'Unid2', 'Quant2',
      'Material3', 'Unid3', 'Quant3',
      'Material4', 'Unid4', 'Quant4',
      'Material5', 'Unid5', 'Quant5',
      'Data',
      'Estação',
      'Entregue por',
      'Recebido por',
      'Status',
      'Método de Assinatura',
      'Data Assinatura'
    ];

    const rows = receipts.map((r) => {
      const it = r.items || [];
      const row = [
        r.consecutiveNumber,
        it[0]?.material || '', it[0]?.unit || '', it[0]?.quantity || '',
        it[1]?.material || '', it[1]?.unit || '', it[1]?.quantity || '',
        it[2]?.material || '', it[2]?.unit || '', it[2]?.quantity || '',
        it[3]?.material || '', it[3]?.unit || '', it[3]?.quantity || '',
        it[4]?.material || '', it[4]?.unit || '', it[4]?.quantity || '',
        r.date,
        `"${r.station}"`,
        `"${r.deliveredBy}"`,
        `"${r.signerName || r.receivedBy || ''}"`,
        r.status === 'signed' ? 'Assinado' : 'Pendente',
        r.signatureMethod || 'none',
        r.signedAt ? new Date(r.signedAt).toLocaleString('pt-BR') : ''
      ];
      return row.join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Controle_Recibos_B4_6GB_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Painel de Consulta Avançada e Filtros Operacionais */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Consulta de Recibos Emitidos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {stationFilter !== 'ALL' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
                <span>Posto: <strong>{stationFilter}</strong></span>
                <button
                  type="button"
                  onClick={() => setStationFilter('ALL')}
                  className="p-0.5 hover:bg-red-200 rounded text-red-600 transition"
                  title="Remover filtro de posto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 hover:bg-red-50 rounded transition-colors"
              >
                Limpar Filtros
              </button>
            )}

            <button
              onClick={handleExportCSV}
              disabled={receipts.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors shadow-2xs disabled:opacity-40"
              title="Exportar todos os recibos em planilha CSV compatível"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>

            <button
              onClick={onOpenNewReceipt}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Emitir Novo Recibo
            </button>
          </div>
        </div>

        {/* 3 Linhas de Consulta Dedicada: Material, Militar, Posto/Estação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Consulta 1: Por Material / Série / Talão */}
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Consulta por Material / Série / Talão:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                placeholder="Ex: DEA, Talão 8535, Dräger, Colete..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Consulta 2: Por Militar (Entregador, Recebedor ou RE) */}
          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Consulta por Militar / RE:
            </label>
            <input
              type="text"
              value={militaryFilter}
              onChange={(e) => setMilitaryFilter(e.target.value)}
              placeholder="Ex: Sedrez, Charles, Mota..."
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
          </div>

          {/* Consulta 3: Por Posto / Estação de Bombeiros */}
          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Posto de Bombeiros:
            </label>
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white text-slate-800"
            >
              <option value="ALL">Todos os Postos ({totalCount})</option>
              {stationOptions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Filtros complementares: Ano e Status */}
          <div className="md:col-span-1 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Ano:
              </label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold text-slate-800"
              >
                <option value="ALL">Todos</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-800"
              >
                <option value="ALL">Todos</option>
                <option value="signed">Assinados</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>
          </div>

        </div>

        {/* Indicador de resultados ativos */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <div>
              <span>Filtro ativo: </span>
              <strong>{filteredReceipts.length}</strong> de {totalCount} recibos encontrados
              {stationFilter !== 'ALL' && <span> · Posto: <em>{stationFilter}</em></span>}
              {militaryFilter.trim() && <span> · Militar: <em>"{militaryFilter}"</em></span>}
              {materialFilter.trim() && <span> · Material: <em>"{materialFilter}"</em></span>}
              {yearFilter !== 'ALL' && <span> · Ano: <em>{yearFilter}</em></span>}
              {statusFilter !== 'ALL' && (
                <span> · Status: <em>{statusFilter === 'signed' ? 'Assinados' : 'Pendentes'}</em></span>
              )}
            </div>

            <button
              onClick={handleClearFilters}
              className="text-red-600 hover:underline font-semibold"
            >
              Mostrar todos
            </button>
          </div>
        )}
      </div>

      {/* Metric Counters Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Total de Recibos
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 block mt-0.5">
              {totalCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
            📄
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Recibos Assinados
            </span>
            <span className="text-xl font-bold font-mono text-emerald-600 block mt-0.5">
              {signedCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Pendentes de Assinatura
            </span>
            <span className="text-xl font-bold font-mono text-amber-600 block mt-0.5">
              {pendingCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3 w-16 text-center font-mono">Nº</th>
                <th className="px-4 py-3">Identificação / Recibo</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Estação / Destino</th>
                <th className="px-4 py-3">Materiais em Carga</th>
                <th className="px-4 py-3">Recebido por</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações Operacionais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map((rc) => {
                  const firstItem = rc.items?.[0];
                  const remainingCount = (rc.items?.length || 0) - 1;

                  return (
                    <tr
                      key={rc.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Consecutive Number */}
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">
                        {String(rc.consecutiveNumber).padStart(2, '0')}
                      </td>

                      {/* Receipt Formatted ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-slate-900 block">
                          {rc.receiptNumber.split('Recibo Nº ')[1] || rc.receiptNumber}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Entregue por: {rc.deliveredBy}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">
                        {rc.date}
                      </td>

                      {/* Station */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block">
                          {rc.station}
                        </span>
                      </td>

                      {/* Items Summary */}
                      <td className="px-4 py-3 max-w-xs">
                        {firstItem ? (
                          <div>
                            <span className="font-medium text-slate-900 line-clamp-1">
                              {firstItem.quantity}x {firstItem.material}
                            </span>
                            {firstItem.notes && (
                              <span className="text-[10px] text-slate-500 line-clamp-1 italic">
                                {firstItem.notes}
                              </span>
                            )}
                            {remainingCount > 0 && (
                              <span className="text-[10px] text-red-600 font-semibold block mt-0.5">
                                +{remainingCount} outro(s) material(is)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sem itens</span>
                        )}
                      </td>

                      {/* Receiver */}
                      <td className="px-4 py-3">
                        {rc.signerName ? (
                          <div>
                            <span className="font-semibold text-slate-900 block line-clamp-1">
                              {rc.signerName}
                            </span>
                            {rc.signerEmail && (
                              <span className="text-[10px] text-slate-500 font-mono block line-clamp-1">
                                {rc.signerEmail}
                              </span>
                            )}
                          </div>
                        ) : rc.receivedBy ? (
                          <span className="font-medium text-slate-800 line-clamp-1">
                            {rc.receivedBy}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pendente</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {rc.status === 'signed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Assinado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pendente
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Sign button if pending */}
                          {rc.status === 'pending' && (
                            <button
                              onClick={() => onOpenSignature(rc)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors flex items-center gap-1 shadow-2xs"
                              title="Coletar Assinatura (Touch ou Google)"
                            >
                              <PenTool className="w-3 h-3" />
                              Assinar
                            </button>
                          )}

                          {/* Print / View A4 */}
                          <button
                            onClick={() => onViewPrint(rc)}
                            className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded transition-colors"
                            title="Visualizar e Imprimir Recibo Oficial A4"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onViewPrint(rc)}
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
                            title="Imprimir (Ctrl+P)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Delete button (protected for owner 6gb3sgbadm@gmail.com) */}
                          <button
                            onClick={() => onDeleteReceipt(rc)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir recibo (Ação restrita ao proprietário)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <p className="text-sm font-semibold text-slate-700">
                      Nenhum recibo encontrado para os filtros selecionados.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {receipts.length === 0
                        ? 'Comece emitindo o primeiro recibo oficial de materiais do batalhão.'
                        : 'Ajuste os termos de busca ou selecione outra estação.'}
                    </p>
                    {receipts.length === 0 && (
                      <button
                        onClick={onOpenNewReceipt}
                        className="mt-4 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Emitir Primeiro Recibo
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
