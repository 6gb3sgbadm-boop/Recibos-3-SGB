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
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType, testConnection } from './lib/firebase';
import { Receipt, StationItem, CatalogMaterialItem, AuthorizedUser } from './types/receipt';
import { INITIAL_STATIONS, INITIAL_CATALOG_MATERIALS, OWNER_EMAIL } from './data/defaults';
import { seedDefaultDatabase, forceRestoreAllDefaults } from './lib/seedDatabase';
import { Navbar } from './components/Navbar';
import { ReceiptsTable } from './components/ReceiptsTable';
import { OfficialReceiptPrint } from './components/OfficialReceiptPrint';
import { SignatureModal } from './components/SignatureModal';
import { NewReceiptModal } from './components/NewReceiptModal';
import { MobileSignatureView } from './components/MobileSignatureView';
import { StationsView, CatalogView } from './components/AuxiliaryViews';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { UserManagementModal } from './components/UserManagementModal';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [stations, setStations] = useState<StationItem[]>(INITIAL_STATIONS);
  const [materials, setMaterials] = useState<CatalogMaterialItem[]>(INITIAL_CATALOG_MATERIALS);
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Deletion modal state
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null);
  const [isDeletingReceipt, setIsDeletingReceipt] = useState(false);

  // User management modal state
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Station filter passed from Stations view
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>('ALL');

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

  // Listen to Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Compute permissions
  const userEmail = currentUser?.email?.toLowerCase();
  const isOwner = userEmail === OWNER_EMAIL.toLowerCase();
  const authUserRecord = authorizedUsers.find((u) => u.email.toLowerCase() === userEmail);
  const canCreateReceipts = isOwner || !!authUserRecord?.canCreateReceipts;
  const canDeleteReceipts = isOwner || !!authUserRecord?.canDeleteReceipts;

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

  // Initialize, auto-seed defaults and subscribe to Firestore receipts, stations, materials and authorized users
  useEffect(() => {
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

    // 2. Stations Listener
    const stationsCollection = collection(db, 'stations');
    const unsubStations = onSnapshot(
      stationsCollection,
      (snapshot) => {
        const firestoreList: StationItem[] = [];
        snapshot.forEach((docSnap) => {
          firestoreList.push({ ...docSnap.data(), id: docSnap.id } as StationItem);
        });

        const map = new Map<string, StationItem>();
        INITIAL_STATIONS.forEach((st) => map.set(st.name.toLowerCase().trim(), st));
        firestoreList.forEach((st) => map.set(st.name.toLowerCase().trim(), st));
        setStations(Array.from(map.values()));
      },
      (err) => console.warn('Sync stations:', err)
    );

    // 3. Materials Catalog Listener
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

    // 4. Authorized Users Listener (RBAC)
    const authUsersCollection = collection(db, 'authorized_users');
    const unsubAuthUsers = onSnapshot(
      authUsersCollection,
      (snapshot) => {
        const list: AuthorizedUser[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as AuthorizedUser);
        });
        setAuthorizedUsers(list);
      },
      (err) => console.warn('Sync authorized users:', err)
    );

    return () => {
      unsubReceipts();
      unsubStations();
      unsubMaterials();
      unsubAuthUsers();
    };
  }, []);

  // Compute next consecutive number dynamically scoped to the given year
  const getNextNumberForYear = (year: number) => {
    const receiptsOfYear = receipts.filter((r) => r.year === year);
    if (receiptsOfYear.length === 0) return 1;
    return Math.max(...receiptsOfYear.map((r) => r.consecutiveNumber || 0)) + 1;
  };

  // Google Login / Logout handlers
  const handleLoginGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code !== 'auth/popup-closed-by-user') {
        alert('Erro ao autenticar com Google: ' + (e.message || 'Falha na conexão'));
      }
    }
  };

  const handleLogoutGoogle = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  // Open New Receipt modal after verifying authorization
  const handleOpenNewReceiptWithCheck = async () => {
    if (!currentUser) {
      const confirmLogin = window.confirm(
        'A emissão de novos recibos é restrita a usuários autorizados.\n\nDeseja conectar com sua conta Google agora para verificar seu acesso?'
      );
      if (!confirmLogin) return;

      try {
        const res = await signInWithPopup(auth, googleProvider);
        const email = res.user.email?.toLowerCase();
        const allowed = email === OWNER_EMAIL.toLowerCase() || authorizedUsers.some((u) => u.email.toLowerCase() === email && u.canCreateReceipts);
        if (allowed) {
          setPrefilledMaterial(undefined);
          setIsNewModalOpen(true);
        } else {
          alert(`A conta conectada (${res.user.email}) não possui permissão para emitir novos recibos.\n\nSolicite liberação ao proprietário (${OWNER_EMAIL}).`);
        }
      } catch (err: unknown) {
        const e = err as { code?: string };
        if (e.code !== 'auth/popup-closed-by-user') {
          console.error(err);
        }
      }
      return;
    }

    if (!canCreateReceipts) {
      alert(
        `Apenas usuários autorizados pelo proprietário têm permissão para gerar novos recibos.\n\nSua conta (${currentUser.email}) não possui permissão de emissão.\nSolicite liberação ao administrador (${OWNER_EMAIL}).`
      );
      return;
    }

    setPrefilledMaterial(undefined);
    setIsNewModalOpen(true);
  };

  // User Management Actions (Firestore RBAC)
  const handleAddAuthorizedUser = async (data: Omit<AuthorizedUser, 'id' | 'addedAt' | 'addedBy'>) => {
    const emailNorm = data.email.toLowerCase().trim();
    const docRef = doc(db, 'authorized_users', emailNorm);
    const payload: AuthorizedUser = {
      ...data,
      id: emailNorm,
      email: emailNorm,
      addedAt: new Date().toISOString(),
      addedBy: currentUser?.email || OWNER_EMAIL,
    };
    await setDoc(docRef, payload);
  };

  const handleUpdateAuthorizedUser = async (id: string, updates: Partial<AuthorizedUser>) => {
    const docRef = doc(db, 'authorized_users', id);
    await updateDoc(docRef, updates);
  };

  const handleRemoveAuthorizedUser = async (id: string) => {
    const docRef = doc(db, 'authorized_users', id);
    await deleteDoc(docRef);
  };

  // Handle Save New Receipt (instantâneo e não trava no 'Gravando...')
  const handleSaveNewReceipt = async (
    receiptData: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>,
    shouldOpenSignModal?: boolean
  ): Promise<Receipt> => {
    const docId = `recibo_6gb_3sgb_b4_${receiptData.consecutiveNumber}_${receiptData.year}_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const createdReceipt: Receipt = {
      ...receiptData,
      id: docId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Atualização otimista imediata na tabela local para que apareça sem nenhum atraso
    setReceipts((prev) => {
      const exists = prev.some((r) => r.id === docId);
      if (exists) return prev;
      return [createdReceipt, ...prev];
    });

    if (shouldOpenSignModal) {
      setReceiptForSign(createdReceipt);
    }

    // Persistência assíncrona no Firestore sem travar a interface
    const savePromise = setDoc(doc(db, 'receipts', docId), createdReceipt);
    await Promise.race([
      savePromise,
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]).catch((err) => {
      console.warn('Persistência em segundo plano:', err);
    });

    return createdReceipt;
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

  // Handle Delete Receipt
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

  // Stations Operations
  const handleAddStation = async (newSt: Omit<StationItem, 'id'>) => {
    const id = `st_${Date.now()}`;
    const stationItem: StationItem = { ...newSt, id };
    setStations((prev) => [...prev, stationItem]);
    await setDoc(doc(db, 'stations', id), stationItem);
  };

  const handleEditStation = async (st: StationItem) => {
    setStations((prev) => prev.map((item) => (item.id === st.id ? st : item)));
    await setDoc(doc(db, 'stations', st.id), st, { merge: true });
  };

  const handleDeleteStation = async (id: string) => {
    setStations((prev) => prev.filter((st) => st.id !== id));
    await deleteDoc(doc(db, 'stations', id));
  };

  // Materials Operations
  const handleAddMaterial = async (newMat: Omit<CatalogMaterialItem, 'id'>) => {
    const id = `mat_${Date.now()}`;
    const materialItem: CatalogMaterialItem = { ...newMat, id };
    setMaterials((prev) => [...prev, materialItem]);
    await setDoc(doc(db, 'materials', id), materialItem);
  };

  const handleEditMaterial = async (mat: CatalogMaterialItem) => {
    setMaterials((prev) => prev.map((item) => (item.id === mat.id ? mat : item)));
    await setDoc(doc(db, 'materials', mat.id), mat, { merge: true });
  };

  const handleDeleteMaterial = async (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    await deleteDoc(doc(db, 'materials', id));
  };

  const handleRestoreStationsAndMaterials = async () => {
    await forceRestoreAllDefaults();
  };

  // Direct Mobile URL Rendering
  if (mobileDirectReceiptId) {
    if (mobileLoading) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
          <h2 className="text-base font-bold">Localizando recibo no banco de dados...</h2>
          <p className="text-xs text-slate-400 mt-1">6º Grupamento de Bombeiros · B4</p>
        </div>
      );
    }

    if (mobileNotFound && !mobileReceipt) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white text-center">
          <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Recibo Não Encontrado</h2>
          <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
            O documento solicitado não foi localizado ou foi removido do banco de dados oficial do B4.
          </p>
          <button
            onClick={() => {
              setMobileDirectReceiptId(null);
              window.history.pushState({}, '', window.location.pathname);
            }}
            className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition"
          >
            Voltar ao Painel Geral
          </button>
        </div>
      );
    }

    if (mobileReceipt) {
      return (
        <MobileSignatureView
          receipt={mobileReceipt}
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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      
      {/* Navbar with Access Management and Auth Status */}
      <Navbar
        currentUser={currentUser}
        isOwner={isOwner}
        canCreateReceipts={canCreateReceipts}
        onOpenNewReceipt={handleOpenNewReceiptWithCheck}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onLoginGoogle={handleLoginGoogle}
        onLogoutGoogle={handleLogoutGoogle}
        onSelectNav={(nav) => setCurrentNav(nav)}
        currentNav={currentNav}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        
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
                selectedStationFilter={selectedStationFilter}
                onStationFilterChange={setSelectedStationFilter}
                canCreateReceipts={canCreateReceipts}
                onViewPrint={(rc) => setReceiptForPrint(rc)}
                onOpenSignature={(rc) => setReceiptForSign(rc)}
                onDeleteReceipt={handleDeleteReceipt}
                onOpenNewReceipt={handleOpenNewReceiptWithCheck}
              />
            )}

            {/* View: Stations Overview & Management */}
            {currentNav === 'stations' && (
              <StationsView
                stations={stations}
                receipts={receipts}
                onSelectStationFilter={(stationName) => {
                  setSelectedStationFilter(stationName);
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
                  if (!canCreateReceipts) {
                    handleOpenNewReceiptWithCheck();
                    return;
                  }
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
            window.history.pushState({}, '', `${window.location.pathname}?recibo=${id}`);
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
              ? `Atenção: O ${receiptToDelete.receiptNumber} já possui assinatura digital registrada. Confirma a exclusão definitiva deste registro do banco de dados?`
              : `Deseja realmente excluir o ${receiptToDelete.receiptNumber} (${receiptToDelete.station})? Esta ação não poderá ser desfeita.`
          }
          itemName={`${receiptToDelete.receiptNumber} - ${receiptToDelete.station}`}
          isDeleting={isDeletingReceipt}
          authorizedUsers={authorizedUsers}
          onConfirm={handleConfirmDeleteReceipt}
          onCancel={() => setReceiptToDelete(null)}
        />
      )}

      {/* Modal: User & Permissions Management (RBAC) */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        currentUser={currentUser}
        authorizedUsers={authorizedUsers}
        onAddAuthorizedUser={handleAddAuthorizedUser}
        onUpdateAuthorizedUser={handleUpdateAuthorizedUser}
        onRemoveAuthorizedUser={handleRemoveAuthorizedUser}
        onClose={() => setIsUserManagementOpen(false)}
      />

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
