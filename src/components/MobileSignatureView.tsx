import React, { useRef, useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { 
  ShieldCheck, 
  CheckCircle2, 
  RotateCcw, 
  PenTool, 
  Mail, 
  AlertCircle,
  PackageCheck,
  ChevronLeft
} from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { Receipt } from '../types/receipt';

interface MobileSignatureViewProps {
  receipt: Receipt;
  onConfirmSignature: (data: {
    signatureMethod: 'canvas' | 'google_auth';
    signatureData?: string;
    signerName: string;
    signerEmail?: string;
  }) => Promise<void>;
  onBackToApp?: () => void;
}

export const MobileSignatureView: React.FC<MobileSignatureViewProps> = ({
  receipt,
  onConfirmSignature,
  onBackToApp,
}) => {
  const [activeTab, setActiveTab] = useState<'canvas' | 'google'>('canvas');
  const [signerName, setSignerName] = useState(receipt.receivedBy || '');
  const [signerRe, setSignerRe] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justSigned, setJustSigned] = useState(false);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (activeTab === 'canvas' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab]);

  const startDrawing = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirmCanvas = async () => {
    if (!hasDrawn || !canvasRef.current) {
      setErrorMessage('Por favor, faça sua rubrica na tela antes de confirmar.');
      return;
    }
    if (!signerName.trim()) {
      setErrorMessage('Informe seu nome ou graduação para registrar o recebimento.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const signatureData = canvasRef.current.toDataURL('image/png');
      const fullName = signerRe ? `${signerName.trim()} (RE ${signerRe.trim()})` : signerName.trim();

      await onConfirmSignature({
        signatureMethod: 'canvas',
        signatureData,
        signerName: fullName,
      });
      setJustSigned(true);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage('Erro ao gravar assinatura. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmGoogle = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      const name = user.displayName || user.email || 'Militar Autenticado';
      const email = user.email || '';

      await onConfirmSignature({
        signatureMethod: 'google_auth',
        signerName: name,
        signerEmail: email,
      });
      setJustSigned(true);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage('Falha na autenticação com a conta Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAlreadySigned = receipt.status === 'signed' || justSigned;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between max-w-lg mx-auto shadow-xl border-x border-slate-200">
      
      {/* Top Mobile Bar */}
      <div className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-20 flex items-center justify-between shadow">
        <div className="flex items-center gap-2">
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="p-1 -ml-1 text-slate-400 hover:text-white rounded-md"
              title="Voltar ao Painel"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xs font-extrabold uppercase tracking-wider text-red-500">
              Corpo de Bombeiros · PMESP
            </h1>
            <p className="text-[11px] text-slate-300 font-mono">
              6º GB · 3º SGB · B4 Almoxarifado
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs font-bold bg-slate-800 px-2 py-0.5 rounded text-white border border-slate-700">
            {receipt.receiptNumber.split('Recibo Nº ')[1] || receipt.receiptNumber}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex-1 space-y-4">
        
        {/* Receipt Header Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                Destino / Estação
              </span>
              <span className="text-sm font-bold text-slate-900">
                {receipt.station}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                Data
              </span>
              <span className="text-xs font-mono font-semibold text-slate-800">
                {receipt.date}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Entregue por (B4):</span> {receipt.deliveredBy}
          </div>
        </div>

        {/* Materials Inspection List */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 uppercase tracking-wide mb-3">
            <PackageCheck className="w-4 h-4 text-red-600" />
            Conferência de Materiais ({receipt.items?.length || 0})
          </div>

          <div className="divide-y divide-slate-100">
            {receipt.items?.map((it, idx) => (
              <div key={it.id || idx} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block leading-snug">
                    {it.material}
                  </span>
                  {it.notes && (
                    <span className="text-[11px] text-slate-500 italic block mt-0.5">
                      {it.notes}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {it.quantity}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1">
                    {it.unit || 'Unid'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {receipt.observations && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg">
              <span className="font-semibold block mb-0.5">Observações:</span>
              <p className="whitespace-pre-wrap">{receipt.observations}</p>
            </div>
          )}
        </div>

        {/* SIGNED STATUS OR SIGNATURE FORM */}
        {isAlreadySigned ? (
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-5 text-center shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-emerald-950">
              Recibo Assinado com Sucesso!
            </h3>
            <p className="text-xs text-emerald-800 mt-1">
              Recebimento confirmado por{' '}
              <strong>{receipt.signerName || receipt.receivedBy}</strong>
            </p>
            {receipt.signedAt && (
              <p className="text-[11px] text-emerald-700 font-mono mt-1">
                Data: {new Date(receipt.signedAt).toLocaleString('pt-BR')}
              </p>
            )}
            {receipt.signatureMethod === 'canvas' && receipt.signatureData && (
              <div className="mt-3 p-2 bg-white rounded border border-emerald-200 inline-block">
                <img
                  src={receipt.signatureData}
                  alt="Rubrica Digital"
                  className="max-h-16 mx-auto"
                />
              </div>
            )}
            {receipt.signatureMethod === 'google_auth' && (
              <div className="mt-2 text-[10px] text-emerald-700 font-mono flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Validado via Conta Google ({receipt.signerEmail})
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-emerald-200/60">
              <p className="text-[11px] text-emerald-900">
                Os dados foram sincronizados instantaneamente com o B4 do quartel.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Tab switch */}
            <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('canvas');
                  setErrorMessage(null);
                }}
                className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'canvas'
                    ? 'border-red-600 text-red-600 bg-white'
                    : 'border-transparent text-slate-500'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                Rubrica na Tela
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('google');
                  setErrorMessage(null);
                }}
                className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'google'
                    ? 'border-red-600 text-red-600 bg-white'
                    : 'border-transparent text-slate-500'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Conta Google
              </button>
            </div>

            <div className="p-4 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* TAB 1: CANVAS */}
              {activeTab === 'canvas' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Militar Receptor (Posto / Nome / RE):
                    </label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="Ex: CB PM CHARLES ou SD PM MOTA"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Faça sua rubrica abaixo com o dedo:
                      </label>
                      {hasDrawn && (
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="text-[11px] text-slate-500 hover:text-red-600 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Limpar
                        </button>
                      )}
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative overflow-hidden touch-none">
                      <canvas
                        ref={canvasRef}
                        width={360}
                        height={180}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="w-full h-44 cursor-crosshair"
                      />
                      {!hasDrawn && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
                          ✍️ Desenhe sua assinatura com o dedo aqui
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmCanvas}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Gravando Assinatura...' : 'Confirmar e Assinar Recibo'}
                  </button>
                </div>
              )}

              {/* TAB 2: GOOGLE */}
              {activeTab === 'google' && (
                <div className="space-y-4 py-2 text-center">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Você pode confirmar o recebimento autenticando com qualquer conta Google/Gmail.
                  </p>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmGoogle}
                    className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-50"
                  >
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
                    {isSubmitting ? 'Autenticando...' : 'Conectar Google e Confirmar'}
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-900 text-center text-[10px] text-slate-400">
        Polícia Militar do Estado de São Paulo · Corpo de Bombeiros
      </div>

    </div>
  );
};
