import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, X, ShieldCheck, CheckCircle2, Trash2 } from 'lucide-react';
import { Receipt } from '../types/receipt';
import { getReceiptPublicUrl } from '../lib/urlHelper';

interface OfficialReceiptPrintProps {
  receipt: Receipt;
  onClose: () => void;
  onOpenSignModal?: () => void;
  onDeleteReceipt?: (receipt: Receipt) => void;
}

export const OfficialReceiptPrint: React.FC<OfficialReceiptPrintProps> = ({
  receipt,
  onClose,
  onOpenSignModal,
  onDeleteReceipt,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR Code containing public receipt URL for mobile auditing
    const receiptUrl = getReceiptPublicUrl(receipt.id);
    QRCode.toDataURL(receiptUrl, { 
      width: 140, 
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Erro ao gerar QR Code:', err));
  }, [receipt.id]);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = receipt.date || new Date().toLocaleDateString('pt-BR');
  const formattedSignDate = receipt.signedAt
    ? new Date(receipt.signedAt).toLocaleString('pt-BR')
    : null;

  return (
    <div 
      id="official-receipt-print-root"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex flex-col items-center p-4 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible"
    >
      {/* Top Action Bar (hidden when printing) */}
      <div className="w-full max-w-[210mm] flex items-center justify-between mb-4 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg no-print">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm tracking-wide">
            {receipt.receiptNumber}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-xs text-slate-300">
            {receipt.status === 'signed' ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Assinado
              </span>
            ) : (
              <span className="text-amber-400 font-medium">
                Pendente de Assinatura
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {receipt.status === 'pending' && onOpenSignModal && (
            <button
              onClick={() => {
                onClose();
                onOpenSignModal();
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
            >
              Coletar Assinatura Agora
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>

          {onDeleteReceipt && (
            <button
              onClick={() => {
                onClose();
                onDeleteReceipt(receipt);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-red-700 text-slate-300 hover:text-white rounded-md transition-colors"
              title="Excluir este recibo (Ação restrita ao proprietário)"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Official A4 Sheet - Compacted to strictly fit 1 sheet of paper */}
      <div 
        id="official-receipt-print-sheet"
        className="print-receipt-sheet w-full max-w-[210mm] bg-white text-slate-900 p-6 sm:p-8 shadow-2xl rounded-sm border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full"
      >
        
        {/* Institutional Header */}
        <div className="border-b-2 border-slate-900 pb-2.5 mb-3 text-center relative">
          <div className="flex justify-center mb-1.5">
            {/* Bombeiros Emblem */}
            <div className="w-11 h-11 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-lg shadow-inner border border-red-900">
              🚒
            </div>
          </div>
          <p className="text-[10px] font-bold tracking-wider text-slate-800 uppercase leading-tight">
            Polícia Militar do Estado de São Paulo
          </p>
          <p className="text-[13px] font-extrabold tracking-tight text-red-700 uppercase leading-snug">
            Corpo de Bombeiros da Polícia Militar
          </p>
          <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide leading-tight">
            6º Grupamento de Bombeiros · 3º Subgrupamento de Bombeiros
          </p>
          <p className="text-[9px] text-slate-600 uppercase tracking-wider leading-tight">
            B4 — Seção de Material, Patrimônio e Logística
          </p>
        </div>

        {/* Title and Identification */}
        <div className="text-center mb-3">
          <h1 className="text-sm font-extrabold uppercase tracking-wide text-slate-950">
            Recibo de Carga / Descarga de Material
          </h1>
          <div className="inline-block mt-1 px-2.5 py-0.5 bg-slate-100 border border-slate-400 rounded font-mono text-[11px] font-bold text-slate-900">
            {receipt.receiptNumber}
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 p-2.5 bg-slate-50 border border-slate-300 rounded text-[11px]">
          <div>
            <span className="font-bold text-slate-700">Data de Emissão:</span>{' '}
            <span className="font-mono text-slate-900">{formattedDate}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">Estação / Destino:</span>{' '}
            <span className="font-semibold text-slate-950 uppercase">{receipt.station}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">Entregue por (B4):</span>{' '}
            <span className="font-semibold text-slate-950">{receipt.deliveredBy}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">Recebido por:</span>{' '}
            <span className="font-semibold text-slate-950">
              {receipt.receivedBy || (receipt.signerName ? receipt.signerName : 'A designar no ato da entrega')}
            </span>
          </div>
        </div>

        {/* Materials Table */}
        <div className="mb-3">
          <table className="w-full text-[11px] border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-200 text-slate-900 uppercase font-bold text-[10px]">
                <th className="border border-slate-400 px-2 py-1 w-10 text-center">Item</th>
                <th className="border border-slate-400 px-2.5 py-1 text-left">Discriminação do Material / Série / Talão</th>
                <th className="border border-slate-400 px-2 py-1 w-14 text-center">Unid.</th>
                <th className="border border-slate-400 px-2 py-1 w-14 text-center font-mono">Qtd.</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items && receipt.items.length > 0 ? (
                receipt.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="border border-slate-400 px-2 py-1 text-center font-mono font-medium text-slate-600">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="border border-slate-400 px-2.5 py-1 font-medium text-slate-900">
                      <div>{item.material}</div>
                      {item.notes && (
                        <div className="text-[9.5px] text-slate-600 italic">
                          Obs: {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-400 px-2 py-1 text-center text-slate-700">
                      {item.unit || 'Unid'}
                    </td>
                    <td className="border border-slate-400 px-2 py-1 text-center font-mono font-bold text-slate-950">
                      {item.quantity}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="border border-slate-400 p-2 text-center text-slate-500 italic">
                    Nenhum material listado neste recibo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* General Observations (if any) */}
        {receipt.observations && (
          <div className="mb-3 p-2 bg-amber-50/60 border border-amber-200 rounded text-[10px]">
            <span className="font-bold text-amber-900 block mb-0.5">Observações Complementares:</span>
            <p className="text-slate-800 whitespace-pre-wrap leading-tight">{receipt.observations}</p>
          </div>
        )}

        {/* Responsibility Legal Statement */}
        <div className="mb-4 p-2 border border-slate-300 rounded bg-slate-50 text-[9.5px] text-slate-700 text-justify leading-snug">
          <p>
            <strong>TERMO DE RESPONSABILIDADE E CAUTELA:</strong> Declaro para os devidos fins de controle patrimonial que 
            <strong> RECEBI</strong> os materiais e equipamentos discriminados neste recibo em perfeito estado de funcionamento e conservação, 
            assumindo total responsabilidade pela sua guarda, manutenção, zelo e fiel emprego nos serviços operacionais desta Unidade de Bombeiros.
          </p>
        </div>

        {/* Signatures Area */}
        <div className="pt-2 border-t border-slate-300 grid grid-cols-2 gap-6 items-end mb-3">
          
          {/* Delivered By Signature (B4 Almoxarifado) */}
          <div className="text-center">
            <div className="h-16 flex flex-col justify-end items-center">
              <div className="w-48 border-b border-slate-900 mb-1"></div>
            </div>
            <p className="text-[11px] font-bold text-slate-900 uppercase">
              {receipt.deliveredBy}
            </p>
            <p className="text-[9px] text-slate-600 uppercase">
              Entregador · B4 / Almoxarifado 3º SGB
            </p>
          </div>

          {/* Received By Signature (Station Receiver) */}
          <div className="text-center">
            <div className="h-16 flex flex-col justify-end items-center relative">
              {receipt.status === 'signed' ? (
                receipt.signatureMethod === 'canvas' && receipt.signatureData ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={receipt.signatureData}
                      alt="Rubrica do Recebedor"
                      className="max-h-12 max-w-44 object-contain mb-1"
                    />
                    <div className="w-48 border-b border-slate-900 mb-1"></div>
                  </div>
                ) : (
                  /* Google Auth Signature Stamp */
                  <div className="flex flex-col items-center justify-center mb-1 p-1 bg-emerald-50 border border-emerald-300 rounded w-52">
                    <div className="flex items-center gap-1 text-emerald-800 font-bold text-[9px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      AUTENTICADO VIA CONTA GOOGLE
                    </div>
                    <div className="text-[8.5px] text-slate-700 truncate max-w-full font-mono">
                      {receipt.signerEmail || receipt.signerName}
                    </div>
                    {formattedSignDate && (
                      <div className="text-[8px] text-slate-500 font-mono">
                        {formattedSignDate}
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="w-48 border-b border-dashed border-slate-400 mb-1"></div>
              )}
            </div>

            <p className="text-[11px] font-bold text-slate-900 uppercase">
              {receipt.signerName || receipt.receivedBy || 'Militar Receptor'}
            </p>
            <p className="text-[9px] text-slate-600 uppercase">
              Recebedor · {receipt.station}
            </p>
            {receipt.status === 'signed' && formattedSignDate && (
              <p className="text-[8.5px] text-emerald-700 font-mono mt-0.5">
                Assinado digitalmente em {formattedSignDate}
              </p>
            )}
          </div>
        </div>

        {/* Footer with Verification QR Code and Audit Info */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">
              Sistema de Recibos B4 · Corpo de Bombeiros PMESP
            </p>
            <p>
              Documento oficial sob controle patrimonial do 6º GB.
            </p>
            <p className="font-mono text-[8px] text-slate-400">
              ID: {receipt.id}
            </p>
          </div>

          {qrCodeDataUrl && (
            <div className="flex items-center gap-2 text-right">
              <div className="text-[8.5px] text-slate-600 leading-tight">
                <span className="font-bold block">Conferência / QR</span>
                Escaneie para validar
              </div>
              <img
                src={qrCodeDataUrl}
                alt="QR Code de Validação"
                className="w-12 h-12 border border-slate-300 rounded p-0.5"
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
