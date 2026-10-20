/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testConnection } from './lib/firebase';
import { Receipt, StationItem, CatalogMaterialItem } from './types/receipt';
import { INITIAL_STATIONS, INITIAL_CATALOG_MATERIALS } from './data/defaults';
import { seedDefaultDatabase, forceRestoreAllDefaults } from './lib/seedDatabase';
import { Navbar } from './components/Navbar';
import { ReceiptsTable } from './components/ReceiptsTable';
import { OfficialReceiptPrint } from './components/OfficialReceiptPrint';
import { SignatureModal } from './components/SignatureModal';
import { NewReceiptModal } from './components/NewReceiptModal';
import { MobileSignatureView } from './components/MobileSignatureView';
import { StationsView, CatalogView } from './components/AuxiliaryViews';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [stations, setStations] = useState<StationItem[]>(INITIAL_STATIONS);
  const [materials, setMaterials] = useState<CatalogMaterialItem[]>(INITIAL_CATALOG_MATERIALS);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Deletion modal state
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null);
  const [isDeletingReceipt, setIsDeletingReceipt] = useState(false);

  // Navigation and active views
  const [currentNav, setCurrentNav] = useState<'receipts' | 'stations' | 'catalog'>('receipts');
  
  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [prefilledMaterial, setPrefilledMaterial] = useState<string | undefined>(undefined);
  const [receiptForPrint, setReceiptForPrint] = useState<Receipt | null>(null);
  const [receiptForSign, setReceiptForSign] = useState<Receipt | null>(null);

  // Direct Mobile Signing view (triggered via URL query param ?recibo=ID)
  const [mobileDirectReceiptId, setMobileDirectReceiptId] = useState<string | null>(null);
  const [mobileReceipt, setMobileReceipt] = useState<Receipt | null>(null);
  const [mobileLoading, setMobileLoading] = useState(false);
  const [mobileNotFound, setMobileNotFound] = useState(false);

  // Check URL query parameters for direct mobile sign links and fetch document directly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reciboId = (params.get('recibo') || params.get('id'))?.trim();
    if (reciboId) {
      setMobileDirectReceiptId(reciboId);
      setMobileLoading(true);

      const docRef = doc(db, 'receipts', reciboId);
      const unsub = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            setMobileReceipt({ ...snap.data(), id: snap.id } as Receipt);
            setMobileNotFound(false);
          } else {
            setMobileNotFound(true);
          }
          setMobileLoading(false);
        },
        (err) => {
          console.error('Erro ao buscar recibo direto por ID:', err);
          setMobileNotFound(true);
          setMobileLoading(false);
        }
      );

      return () => unsub();
    }
  }, []);

  // Initialize, auto-seed defaults and subscribe to Firestore receipts, stations and materials in real-time
  useEffect(() => {
    // Timeout de segurança para nunca travar a interface carregando
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    // Auto-seed to ensure Firestore permanently holds all standard stations and materials
    seedDefaultDatabase().catch((err) => console.warn('Auto seed warning:', err));

    // 1. Receipts Listener
    const receiptsCollection = collection(db, 'receipts');
    const receiptsQuery = query(receiptsCollection, orderBy('consecutiveNumber', 'desc'));

    const unsubReceipts = onSnapshot(
      receiptsQuery,
      (snapshot) => {
        clearTimeout(safetyTimer);
        const list: Receipt[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as Receipt);
        });
        setReceipts(list);
        setLoading(false);
        setDbError(null);
      },
      (error) => {
        clearTimeout(safetyTimer);
        console.error('Erro na consulta de recibos:', error);
        setLoading(false);
        setDbError('Não foi possível conectar ao banco de dados do Firebase. Verifique a conexão.');
        try {
          handleFirestoreError(error, OperationType.LIST, 'receipts');
        } catch {}
      }
    );

    // 2. Stations Listener: combine Firestore items with initial stations to prevent accidental disappearances
    const stationsCollection = collection(db, 'stations');
    const unsubStations = onSnapshot(
      stationsCollection,
      (snapshot) => {
        const firestoreList: StationItem[] = [];
        snapshot.forEach((docSnap) => {
          firestoreList.push({ ...docSnap.data(), id: docSnap.id } as StationItem);
        });

        // Use a Map keyed by lowercase station name to merge Firestore additions with INITIAL_STATIONS
        const map = new Map<string, StationItem>();
        INITIAL_STATIONS.forEach((st) => map.set(st.name.toLowerCase().trim(), st));
        firestoreList.forEach((st) => map.set(st.name.toLowerCase().trim(), st));
        setStations(Array.from(map.values()));
      },
      (err) => console.warn('Sync stations:', err)
    );

    // 3. Materials Catalog Listener: combine Firestore items with initial catalog materials
    const materialsCollection = collection(db, 'materials');
    const unsubMaterials = onSnapshot(
      materialsCollection,
      (snapshot) => {
        const firestoreList: CatalogMaterialItem[] = [];
        snapshot.forEach((docSnap) => {
          firestoreList.push({ ...docSnap.data(), id: docSnap.id } as CatalogMaterialItem);
        });

        const map = new Map<string, CatalogMaterialItem>();
        INITIAL_CATALOG_MATERIALS.forEach((m) => map.set(m.name.toLowerCase().trim(), m));
        firestoreList.forEach((m) => map.set(m.name.toLowerCase().trim(), m));
        setMaterials(Array.from(map.values()));
      },
      (err) => console.warn('Sync materials:', err)
    );

    return () => {
      unsubReceipts();
      unsubStations();
      unsubMaterials();
    };
  }, []);

  // Compute next consecutive number dynamically scoped to the given year
  const getNextNumberForYear = (year: number) => {
    const receiptsOfYear = receipts.filter((r) => r.year === year);
    if (receiptsOfYear.length === 0) return 1;
    return Math.max(...receiptsOfYear.map((r) => r.consecutiveNumber || 0)) + 1;
  };

  // Handle Save New Receipt (instantâneo e não trava no 'Gravando...')
  const handleSaveNewReceipt = async (
    receiptData: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>,
    shouldOpenSignModal?: boolean
  ): Promise<Receipt> => {
    const docId = `recibo_6gb_3sgb_b4_${receiptData.consecutiveNumber}_${receiptData.year}`;
    const nowIso = new Date().toISOString();

    const fullReceipt: Receipt = {
      ...receiptData,
      id: docId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Atualização otimista imediata no estado local
    setReceipts((prev) => {
      const exists = prev.some((r) => r.id === docId);
      if (exists) return prev.map((r) => (r.id === docId ? fullReceipt : r));
      return [fullReceipt, ...prev];
    });

    if (shouldOpenSignModal) {
      setReceiptForSign(fullReceipt);
    }

    try {
      // Dispara persistência no Firestore sem travar o modal indefinidamente
      const writePromise = setDoc(doc(db, 'receipts', docId), fullReceipt);
      await Promise.race([
        writePromise,
        new Promise((resolve) => setTimeout(resolve, 300)),
      ]);
    } catch (err: unknown) {
      console.warn('Persistência Firestore em segundo plano:', err);
      try {
        handleFirestoreError(err, OperationType.CREATE, `receipts/${docId}`);
      } catch (e) {
        console.error(e);
      }
    }

    return fullReceipt;
  };

  // Handle Confirm Signature (Touch canvas or Google account)
  const handleConfirmSignature = async (data: {
    signatureMethod: 'canvas' | 'google_auth';
    signatureData?: string;
    signerName: string;
    signerEmail?: string;
  }) => {
    const target = receiptForSign || mobileReceipt || receipts.find((r) => r.id === mobileDirectReceiptId);
    if (!target) return;

    const nowIso = new Date().toISOString();
    const updatePayload = {
      status: 'signed' as const,
      signatureMethod: data.signatureMethod,
      signatureData: data.signatureData || '',
      signerName: data.signerName,
      signerEmail: data.signerEmail || '',
      signedAt: nowIso,
      updatedAt: nowIso,
      receivedBy: data.signerName,
    };

    const updatedReceipt: Receipt = {
      ...target,
      ...updatePayload,
    };

    setReceipts((prev) => prev.map((r) => (r.id === target.id ? updatedReceipt : r)));
    if (mobileReceipt && mobileReceipt.id === target.id) {
      setMobileReceipt(updatedReceipt);
    }
    if (receiptForPrint && receiptForPrint.id === target.id) {
      setReceiptForPrint(updatedReceipt);
    }
    if (receiptForSign && receiptForSign.id === target.id) {
      setReceiptForSign(updatedReceipt);
    }

    try {
      // Salva o recibo completo atualizado com merge: true para garantir que nunca seja perdido
      const updatePromise = setDoc(doc(db, 'receipts', target.id), updatedReceipt, { merge: true });
      await Promise.race([
        updatePromise,
        new Promise((resolve) => setTimeout(resolve, 400)),
      ]);
    } catch (err: unknown) {
      console.warn('Persistência de assinatura no Firestore:', err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `receipts/${target.id}`);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Handle Delete Receipt (opens in-app confirmation modal for any receipt)
  const handleDeleteReceipt = (rc: Receipt) => {
    setReceiptToDelete(rc);
  };

  const handleConfirmDeleteReceipt = async () => {
    if (!receiptToDelete) return;
    setIsDeletingReceipt(true);
    try {
      await deleteDoc(doc(db, 'receipts', receiptToDelete.id));
      setReceipts((prev) => prev.filter((r) => r.id !== receiptToDelete.id));
      if (receiptForPrint?.id === receiptToDelete.id) {
        setReceiptForPrint(null);
      }
      if (receiptForSign?.id === receiptToDelete.id) {
        setReceiptForSign(null);
      }
      if (mobileReceipt?.id === receiptToDelete.id) {
        setMobileReceipt(null);
      }
      setReceiptToDelete(null);
    } catch (err: unknown) {
      console.error('Erro ao excluir recibo:', err);
      handleFirestoreError(err, OperationType.DELETE, `receipts/${receiptToDelete.id}`);
    } finally {
      setIsDeletingReceipt(false);
    }
  };

  // Station CRUD Handlers
  const handleAddStation = async (stationData: Omit<StationItem, 'id'>) => {
    const id = `st_${Date.now()}`;
    const newStation: StationItem = { ...stationData, id };
    setStations((prev) => [...prev, newStation]);
    try {
      await setDoc(doc(db, 'stations', id), newStation);
    } catch (err) {
      console.warn('Persist station error:', err);
    }
  };

  const handleEditStation = async (stationData: StationItem) => {
    setStations((prev) => prev.map((s) => (s.id === stationData.id ? stationData : s)));
    try {
      await setDoc(doc(db, 'stations', stationData.id), stationData);
    } catch (err) {
      console.warn('Persist edit station error:', err);
    }
  };

  const handleDeleteStation = async (stationId: string) => {
    setStations((prev) => prev.filter((s) => s.id !== stationId));
    try {
      await deleteDoc(doc(db, 'stations', stationId));
    } catch (err) {
      console.warn('Delete station error:', err);
    }
  };

  // Materials CRUD Handlers
  const handleAddMaterial = async (materialData: Omit<CatalogMaterialItem, 'id'>) => {
    const id = `mat_${Date.now()}`;
    const newMat: CatalogMaterialItem = { ...materialData, id };
    setMaterials((prev) => [newMat, ...prev]);
    try {
      await setDoc(doc(db, 'materials', id), newMat);
    } catch (err) {
      console.warn('Persist material error:', err);
    }
  };

  const handleEditMaterial = async (materialData: CatalogMaterialItem) => {
    setMaterials((prev) => prev.map((m) => (m.id === materialData.id ? materialData : m)));
    try {
      await setDoc(doc(db, 'materials', materialData.id), materialData);
    } catch (err) {
      console.warn('Persist edit material error:', err);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    try {
      await deleteDoc(doc(db, 'materials', materialId));
    } catch (err) {
      console.warn('Delete material error:', err);
    }
  };

  const handleRestoreStationsAndMaterials = async () => {
    await forceRestoreAllDefaults();
  };

  // Direct Mobile Signing view resolution
  const currentMobileReceipt = mobileReceipt || (mobileDirectReceiptId 
    ? receipts.find((r) => r.id === mobileDirectReceiptId)
    : null);

  if (mobileDirectReceiptId) {
    if (mobileLoading && !currentMobileReceipt) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white space-y-4">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
          <h2 className="text-base font-bold">Carregando Recibo de Material...</h2>
          <p className="text-xs text-slate-400 font-mono">6º GB · 3º SGB · B4 Almoxarifado</p>
        </div>
      );
    }

    if (mobileNotFound && !currentMobileReceipt) {
      return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-900 text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold">Recibo Não Encontrado</h2>
          <p className="text-xs text-slate-600 max-w-sm">
            O recibo solicitado não foi localizado no banco de dados ou foi excluído pelo almoxarifado.
          </p>
          <button
            onClick={() => {
              setMobileDirectReceiptId(null);
              window.history.pushState({}, '', window.location.pathname);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow transition-colors"
          >
            Acessar Painel Principal
          </button>
        </div>
      );
    }

    if (currentMobileReceipt) {
      return (
        <MobileSignatureView
          receipt={currentMobileReceipt}
          onConfirmSignature={handleConfirmSignature}
          onBackToApp={() => {
            setMobileDirectReceiptId(null);
            window.history.pushState({}, '', window.location.pathname);
          }}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      
      {/* Institutional Top Navbar */}
      <div className="no-print">
        <Navbar
          onOpenNewReceipt={() => {
            setPrefilledMaterial(undefined);
            setIsNewModalOpen(true);
          }}
          onSelectNav={(nav) => setCurrentNav(nav)}
          currentNav={currentNav}
        />
      </div>

      {/* Main Content Viewport */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Error notification banner if DB disconnected */}
        {dbError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{dbError}</span>
            </div>
            <button
              onClick={() => testConnection()}
              className="font-bold underline text-red-800 ml-4 hover:text-red-950"
            >
              Reconectar
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Conectando ao banco de dados do 6º Grupamento de Bombeiros...
            </p>
          </div>
        ) : (
          <>
            {/* View: Main Receipts Dashboard */}
            {currentNav === 'receipts' && (
              <ReceiptsTable
                receipts={receipts}
                stations={stations}
                onViewPrint={(rc) => setReceiptForPrint(rc)}
                onOpenSignature={(rc) => setReceiptForSign(rc)}
                onDeleteReceipt={handleDeleteReceipt}
                onOpenNewReceipt={() => {
                  setPrefilledMaterial(undefined);
                  setIsNewModalOpen(true);
                }}
              />
            )}

            {/* View: Stations Overview & Management */}
            {currentNav === 'stations' && (
              <StationsView
                stations={stations}
                receipts={receipts}
                onSelectStationFilter={() => {
                  setCurrentNav('receipts');
                }}
                onAddStation={handleAddStation}
                onEditStation={handleEditStation}
                onDeleteStation={handleDeleteStation}
                onRestoreDefaults={handleRestoreStationsAndMaterials}
                onClose={() => setCurrentNav('receipts')}
              />
            )}

            {/* View: Common Materials Catalog & Management */}
            {currentNav === 'catalog' && (
              <CatalogView
                materials={materials}
                onAddMaterial={handleAddMaterial}
                onEditMaterial={handleEditMaterial}
                onDeleteMaterial={handleDeleteMaterial}
                onRestoreDefaults={handleRestoreStationsAndMaterials}
                onClose={() => setCurrentNav('receipts')}
                onOpenNewReceiptWithMaterial={(mat) => {
                  setPrefilledMaterial(mat);
                  setIsNewModalOpen(true);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Modal: New Receipt */}
      {isNewModalOpen && (
        <NewReceiptModal
          getNextNumberForYear={getNextNumberForYear}
          stations={stations}
          catalogMaterials={materials}
          initialMaterial={prefilledMaterial}
          onClose={() => {
            setIsNewModalOpen(false);
            setPrefilledMaterial(undefined);
          }}
          onSave={handleSaveNewReceipt}
          onOpenSignModal={(rc) => {
            setIsNewModalOpen(false);
            setReceiptForSign(rc);
          }}
          onOpenPrint={(rc) => {
            setIsNewModalOpen(false);
            setReceiptForPrint(rc);
          }}
        />
      )}

      {/* Modal: Sign Receipt */}
      {receiptForSign && (
        <SignatureModal
          receipt={receiptForSign}
          onClose={() => setReceiptForSign(null)}
          onOpenMobileView={(id) => {
            setReceiptForSign(null);
            setMobileDirectReceiptId(id);
            window.history.pushState({}, '', `/?recibo=${id}`);
          }}
          onConfirmSignature={handleConfirmSignature}
        />
      )}

      {/* Modal: Official A4 Print & PDF Sheet */}
      {receiptForPrint && (
        <OfficialReceiptPrint
          receipt={receiptForPrint}
          onClose={() => setReceiptForPrint(null)}
          onOpenSignModal={() => setReceiptForSign(receiptForPrint)}
          onDeleteReceipt={handleDeleteReceipt}
        />
      )}

      {/* Modal: Confirm Receipt Deletion */}
      {receiptToDelete && (
        <DeleteConfirmModal
          isOpen={!!receiptToDelete}
          title={receiptToDelete.status === 'signed' ? 'Excluir Recibo Assinado' : 'Excluir Recibo de Material'}
          message={
            receiptToDelete.status === 'signed'
              ? `Atenção: O ${receiptToDelete.receiptNumber} já possui assinatura digital registrada. Como encarregado do B4, confirma a exclusão definitiva deste registro do banco de dados?`
              : `Deseja realmente excluir o ${receiptToDelete.receiptNumber} (${receiptToDelete.station})? Esta ação não poderá ser desfeita.`
          }
          itemName={`${receiptToDelete.receiptNumber} - ${receiptToDelete.station}`}
          isDeleting={isDeletingReceipt}
          onConfirm={handleConfirmDeleteReceipt}
          onCancel={() => setReceiptToDelete(null)}
        />
      )}

      {/* Institutional Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">
              Corpo de Bombeiros da PMESP · 6º GB / 3º SGB
            </span>
            <span>·</span>
            <span>B4 Material e Patrimônio</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Padrão Operacional 6GB-3ºSGB-B4 / 300 / 26
          </div>
        </div>
      </footer>

    </div>
  );
}
