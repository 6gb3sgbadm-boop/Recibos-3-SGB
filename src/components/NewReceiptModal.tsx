import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  X, 
  FileText, 
  CheckCircle2, 
  Clock, 
  PenTool, 
  Printer, 
  Check, 
  ShieldCheck,
  Package,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Receipt, ReceiptItem, StationItem, CatalogMaterialItem } from '../types/receipt';
import { STATIONS_PRESET, DELIVERERS_PRESET, UNITS_PRESET, COMMON_MATERIALS } from '../data/defaults';

interface NewReceiptModalProps {
  onClose: () => void;
  getNextNumberForYear: (year: number) => number;
  initialYear?: number;
  initialMaterial?: string;
  stations?: StationItem[];
  catalogMaterials?: CatalogMaterialItem[];
  onSave: (receiptData: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>, shouldOpenSignModal?: boolean) => Promise<Receipt>;
  onOpenSignModal?: (receipt: Receipt) => void;
  onOpenPrint?: (receipt: Receipt) => void;
}

export const NewReceiptModal: React.FC<NewReceiptModalProps> = ({
  onClose,
  getNextNumberForYear,
  initialYear,
  initialMaterial,
  stations,
  catalogMaterials,
  onSave,
  onOpenSignModal,
  onOpenPrint,
}) => {
  const currentCalendarYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(initialYear || currentCalendarYear);
  const todayFormatted = new Date().toLocaleDateString('pt-BR');

  const stationOptions = stations && stations.length > 0 
    ? stations.map((s) => s.name) 
    : [...STATIONS_PRESET];

  const materialOptions = catalogMaterials && catalogMaterials.length > 0
    ? catalogMaterials.map((m) => m.name)
    : [...COMMON_MATERIALS];

  const [consecutiveNumber, setConsecutiveNumber] = useState<number>(() => {
    return getNextNumberForYear(initialYear || currentCalendarYear);
  });
  const [date, setDate] = useState<string>(todayFormatted);
  const [station, setStation] = useState<string>(stationOptions[0] || 'EB Praia Grande');
  const [customStation, setCustomStation] = useState<string>('');
  const [deliveredBy, setDeliveredBy] = useState<string>(DELIVERERS_PRESET[0]);
  const [customDeliveredBy, setCustomDeliveredBy] = useState<string>('');
  const [receivedBy, setReceivedBy] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  
  const [items, setItems] = useState<ReceiptItem[]>([
    {
      id: '1',
      material: initialMaterial || '',
      unit: 'Unid',
      quantity: 1,
      notes: '',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para armazenar o recibo gerado e exibir a tela de sucesso de gravação
  const [savedReceipt, setSavedReceipt] = useState<Receipt | null>(null);

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    const nextSeq = getNextNumberForYear(newYear);
    setConsecutiveNumber(nextSeq);
  };

  const finalStation = customStation.trim() || station;
  const finalDeliveredBy = customDeliveredBy.trim() || deliveredBy;
  const yearSuffix = String(selectedYear).slice(-2);
  const formattedReceiptNumber = `Recibo Nº 6GB-3ºSGB-B4-${String(consecutiveNumber).padStart(2, '0')}/300/${yearSuffix}`;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        material: '',
        unit: 'Unid',
        quantity: 1,
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (shouldSignImmediately: boolean) => {
    // Validações
    if (!finalStation) {
      setError('Por favor, selecione ou informe a Estação / Destino.');
      return;
    }
    if (!finalDeliveredBy) {
      setError('Por favor, informe o militar responsável pela entrega (B4).');
      return;
    }

    const validItems = items.filter((it) => it.material.trim().length > 0);
    if (validItems.length === 0) {
      setError('Informe ao menos 1 material no recibo.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newReceiptPayload: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'> = {
        receiptNumber: formattedReceiptNumber,
        consecutiveNumber,
        year: selectedYear,
        date,
        station: finalStation,
        deliveredBy: finalDeliveredBy,
        receivedBy: receivedBy.trim(),
        items: validItems,
        observations: observations.trim(),
        status: 'pending',
        signatureMethod: 'none',
      };

      const created = await onSave(newReceiptPayload, shouldSignImmediately);
      const receiptToShow: Receipt = created || {
        ...newReceiptPayload,
        id: `recibo_6gb_3sgb_b4_${newReceiptPayload.consecutiveNumber}_${newReceiptPayload.year}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (shouldSignImmediately && onOpenSignModal) {
        onOpenSignModal(receiptToShow);
      } else {
        // Exibe imediatamente a tela oficial de sucesso de gravação
        setSavedReceipt(receiptToShow);
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Erro ao salvar o recibo. Verifique a conexão com o banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmitAnother = () => {
    setSavedReceipt(null);
    const nextSeq = getNextNumberForYear(selectedYear);
    setConsecutiveNumber(nextSeq);
    setReceivedBy('');
    setObservations('');
    setItems([
      {
        id: String(Date.now()),
        material: '',
        unit: 'Unid',
        quantity: 1,
        notes: '',
      },
    ]);
  };

  // ==========================================
  // TELA DE SUCESSO DE GRAVAÇÃO DO RECIBO
  // ==========================================
  if (savedReceipt) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header Sucesso */}
          <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold leading-tight">Recibo Gravado com Sucesso!</h2>
                <p className="text-[11px] text-emerald-100">Corpo de Bombeiros · 6º GB / 3º SGB · B4 Material</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-100 hover:text-white rounded-lg transition-colors hover:bg-emerald-700/50"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corpo do Sucesso */}
          <div className="p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border-4 border-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Recibo Registrado no Banco de Dados
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                O registro foi gravado com êxito no banco de dados e já está disponível na consulta geral de recibos.
              </p>
            </div>

            {/* Cartão de Resumo Oficial */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Identificação Oficial
                </span>
                <span className="text-xs font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  {savedReceipt.receiptNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Estação / Destino:</span>
                  <span className="font-bold text-slate-800">{savedReceipt.station}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Data de Emissão:</span>
                  <span className="font-bold text-slate-800">{savedReceipt.date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Entregue por (B4):</span>
                  <span className="font-medium text-slate-800">{savedReceipt.deliveredBy}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Situação:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" /> Pendente de Assinatura
                  </span>
                </div>
              </div>

              {/* Materiais Cadastrados */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-slate-500" />
                    Materiais Gravados ({savedReceipt.items.length})
                  </span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {savedReceipt.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                      <div className="space-y-0.5">
                        <span className="font-medium text-slate-800 block">{it.material}</span>
                        {it.notes && (
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {it.notes}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-700 text-xs shrink-0 ml-2 bg-slate-100 px-2 py-0.5 rounded">
                        {it.quantity} {it.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ações Disponíveis */}
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {onOpenSignModal && (
                  <button
                    type="button"
                    onClick={() => onOpenSignModal(savedReceipt)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm"
                  >
                    <PenTool className="w-4 h-4" />
                    Coletar Assinatura Agora
                  </button>
                )}

                {onOpenPrint && (
                  <button
                    type="button"
                    onClick={() => onOpenPrint(savedReceipt)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Visualizar e Imprimir A4
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleEmitAnother}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Emitir Outro Recibo
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Concluir e Voltar aos Recibos
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // FORMULÁRIO DE EMISSÃO DE NOVO RECIBO
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-500" />
              Emissão de Novo Recibo de Material
            </h2>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              {formattedReceiptNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Identification Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nº Sequencial no Ano:
              </label>
              <input
                type="number"
                value={consecutiveNumber}
                onChange={(e) => setConsecutiveNumber(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Recibo:
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Exercício (Ano):
              </label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value={currentCalendarYear}>{currentCalendarYear}</option>
                <option value={currentCalendarYear - 1}>{currentCalendarYear - 1}</option>
                <option value={currentCalendarYear + 1}>{currentCalendarYear + 1}</option>
              </select>
            </div>
          </div>

          {/* Destination & Officers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estação / Destino (Posto):
              </label>
              <select
                value={station}
                onChange={(e) => {
                  setStation(e.target.value);
                  if (e.target.value !== 'OUTRO') setCustomStation('');
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                {stationOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
                <option value="OUTRO">+ Outro destino específico...</option>
              </select>
              {station === 'OUTRO' && (
                <input
                  type="text"
                  placeholder="Digite o nome da estação ou posto..."
                  value={customStation}
                  onChange={(e) => setCustomStation(e.target.value)}
                  className="mt-2 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Militar Entregador (B4 Material):
              </label>
              <select
                value={deliveredBy}
                onChange={(e) => {
                  setDeliveredBy(e.target.value);
                  if (e.target.value !== 'OUTRO') setCustomDeliveredBy('');
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                {DELIVERERS_PRESET.map((del) => (
                  <option key={del} value={del}>
                    {del}
                  </option>
                ))}
                <option value="OUTRO">+ Outro militar encarregado...</option>
              </select>
              {deliveredBy === 'OUTRO' && (
                <input
                  type="text"
                  placeholder="Nome e posto/graduação do entregador..."
                  value={customDeliveredBy}
                  onChange={(e) => setCustomDeliveredBy(e.target.value)}
                  className="mt-2 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Militar Receptor (Opcional - pode ser preenchido na assinatura):
            </label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              placeholder="Ex: CB PM SILVA 123456-7"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Relação de Materiais do Recibo
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Outro Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-12 gap-2 items-start"
                >
                  <div className="col-span-12 sm:col-span-6">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                      Material #{index + 1}:
                    </label>
                    <input
                      type="text"
                      list={`mat-options-${index}`}
                      value={item.material}
                      onChange={(e) => handleItemChange(index, 'material', e.target.value)}
                      placeholder="Ex: PÁ DE DEA, PRANCHA..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                    />
                    <datalist id={`mat-options-${index}`}>
                      {materialOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  </div>

                  <div className="col-span-4 sm:col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                      Unidade:
                    </label>
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                    >
                      {UNITS_PRESET.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                      Quantidade:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 font-mono font-bold"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-1 flex justify-end pt-5">
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-20 rounded transition-colors"
                      title="Remover linha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Notes / Series / Talão line */}
                  <div className="col-span-12 pl-8">
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      placeholder="Talão do chamado, número de série, patrimônio CB (ex: TALÃO 8535 de 20DEZ25)..."
                      className="w-full px-2.5 py-1 text-[11px] text-slate-600 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-400 bg-slate-50/50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Gerais do Recibo:
            </label>
            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Equipamentos testados e em pleno funcionamento no momento da entrega; destinados à VTR UR-06..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-sm disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gravando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gravar Recibo</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-lg transition-colors shadow-2xs disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  <span>Gravando...</span>
                </>
              ) : (
                <>
                  <PenTool className="w-4 h-4 text-emerald-700" />
                  <span>Gravar e Coletar Assinatura</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
