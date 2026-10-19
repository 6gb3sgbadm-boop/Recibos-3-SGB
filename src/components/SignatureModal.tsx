import React, { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { signInWithPopup } from 'firebase/auth';
import { 
  X, 
  PenTool, 
  Mail, 
  QrCode, 
  RotateCcw, 
  Check, 
  Copy, 
  Share2, 
  ShieldCheck,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { Receipt } from '../types/receipt';
import { getReceiptPublicUrl } from '../lib/urlHelper';

interface SignatureModalProps {
  receipt: Receipt;
  onClose: () => void;
  onOpenMobileView?: (receiptId: string) => void;
  onConfirmSignature: (data: {
    signatureMethod: 'canvas' | 'google_auth';
    signatureData?: string;
    signerName: string;
    signerEmail?: string;
  }) => Promise<void>;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  receipt,
  onClose,
  onOpenMobileView,
  onConfirmSignature,
}) => {
  const [activeTab, setActiveTab] = useState<'canvas' | 'google' | 'mobile'>('canvas');
  const [signerName, setSignerName] = useState<string>(receipt.receivedBy || '');
  const [signerRe, setSignerRe] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Mobile QR Code & Link state
  const [mobileUrl, setMobileUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Canvas Signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Generate public mobile URL and QR Code
  useEffect(() => {
    const url = getReceiptPublicUrl(receipt.id);
    setMobileUrl(url);

    QRCode.toDataURL(url, { 
      width: 256, 
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      }
    })
      .then((qr) => setQrDataUrl(qr))
      .catch((err) => console.error('Erro ao gerar QR Code:', err));
  }, [receipt.id]);

  // Setup canvas resolution and styling
  useEffect(() => {
    if (activeTab === 'canvas' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

  // Submit Canvas Signature
  const handleConfirmCanvas = async () => {
    if (!hasDrawn || !canvasRef.current) {
      setErrorMessage('Por favor, faça a rubrica no quadro antes de confirmar.');
      return;
    }
    if (!signerName.trim()) {
      setErrorMessage('Por favor, informe o nome ou identificação do militar receptor.');
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
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage('Erro ao registrar assinatura. Verifique a conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Google Auth Signature
  const handleConfirmGoogleAuth = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const name = user.displayName || user.email || 'Militar Autenticado';
      const email = user.email || '';

      await onConfirmSignature({
        signatureMethod: 'google_auth',
        signerName: name,
        signerEmail: email,
      });
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage('Falha na autenticação com a conta Google. Tente novamente ou use a rubrica.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyMobileLink = () => {
    if (!mobileUrl) return;
    navigator.clipboard.writeText(mobileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareWhatsApp = () => {
    if (!mobileUrl) return;
    const text = encodeURIComponent(
      `Prezado(a), segue o link para conferência e assinatura do ${receipt.receiptNumber} (${receipt.station}):\n${mobileUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleLaunchMobileView = () => {
    if (onOpenMobileView) {
      onClose();
      onOpenMobileView(receipt.id);
    } else {
      window.open(mobileUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-red-500" />
              Coleta de Assinatura do Recibo
            </h2>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              {receipt.receiptNumber} · {receipt.station}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Quick Items Summary */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 text-xs">
          <span className="font-semibold text-slate-700 block mb-1">
            Materiais em Carga ({receipt.items?.length || 0} item(ns)):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {receipt.items?.map((it, idx) => (
              <span
                key={it.id || idx}
                className="bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-700 font-medium"
              >
                {it.quantity}x {it.material}
              </span>
            ))}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 border-b border-slate-200 flex gap-2">
          <button
            onClick={() => {
              setActiveTab('canvas');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'canvas'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PenTool className="w-4 h-4" />
            1. Rubrica na Tela (Touch)
          </button>

          <button
            onClick={() => {
              setActiveTab('google');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'google'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            2. Conta Google / Gmail
          </button>

          <button
            onClick={() => {
              setActiveTab('mobile');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'mobile'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            3. QR Code / Celular
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: CANVAS TOUCH SIGNATURE */}
          {activeTab === 'canvas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Posto / Graduação e Nome do Recebedor:
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Ex: CB PM CHARLES"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RE (opcional):
                  </label>
                  <input
                    type="text"
                    value={signerRe}
                    onChange={(e) => setSignerRe(e.target.value)}
                    placeholder="Ex: 147504-5"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Faça a rubrica com o dedo ou mouse abaixo:
                  </label>
                  {hasDrawn && (
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-600 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Limpar quadro
                    </button>
                  )}
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 relative overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 cursor-crosshair touch-none"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
                      Rubrique aqui na tela
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  A rubrica será impressa diretamente sobre a linha de assinatura no recibo oficial A4.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmCanvas}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? 'Salvando...' : 'Confirmar e Assinar Recibo'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE AUTH SIGNATURE */}
          {activeTab === 'google' && (
            <div className="space-y-4 py-2 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Validação Eletrônica via Conta Google
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  O militar receptor assina utilizando qualquer conta Google/Gmail. O sistema registrará o nome, e-mail institucional e carimbo temporal de auditoria no recibo oficial.
                </p>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmGoogleAuth}
                  className="w-full max-w-sm mx-auto flex items-center justify-center gap-2.5 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg shadow-sm transition-all hover:shadow disabled:opacity-50"
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
                  {isSubmitting ? 'Autenticando...' : 'Conectar com Google e Assinar Recibo'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CLEAN MOBILE QR CODE & DIRECT ACTIONS */}
          {activeTab === 'mobile' && (
            <div className="py-2 text-center space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Aponte a câmera do celular para assinar
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  O militar receptor lê o QR Code abaixo no smartphone para conferir a carga e assinar na tela.
                </p>
              </div>

              {/* Clean QR Code Card */}
              <div className="inline-block p-4 bg-white border border-slate-200 rounded-2xl shadow-md">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code de Assinatura Móvel"
                    className="w-52 h-52 mx-auto rounded-lg"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center bg-slate-50 text-slate-400 text-xs rounded-lg">
                    Gerando QR Code...
                  </div>
                )}
                
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-center">
                  <span className="text-xs font-bold text-slate-800 font-mono block">
                    {receipt.receiptNumber}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {receipt.station}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all hover:shadow"
                >
                  <Share2 className="w-4 h-4" />
                  Enviar Link via WhatsApp
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={copyMobileLink}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors border border-slate-200"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    {copiedLink ? 'Link Copiado!' : 'Copiar Link'}
                  </button>

                  <button
                    type="button"
                    onClick={handleLaunchMobileView}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    title="Abrir tela de conferência e assinatura"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir no Dispositivo
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
