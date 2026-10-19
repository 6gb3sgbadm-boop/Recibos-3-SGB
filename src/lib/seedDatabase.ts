import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { INITIAL_STATIONS, INITIAL_CATALOG_MATERIALS } from '../data/defaults';
import { StationItem, CatalogMaterialItem } from '../types/receipt';

/**
 * Garante que todos os postos de bombeiros e materiais do catálogo padrão do B4
 * estejam permanentemente gravados no banco de dados Firestore.
 * Não sobrescreve estações nem materiais personalizados que o usuário já criou.
 */
export async function seedDefaultDatabase(): Promise<{ stationsAdded: number; materialsAdded: number }> {
  let stationsAdded = 0;
  let materialsAdded = 0;

  try {
    // Evita sobrecarregar a conexão em cada refresh se já foi inicializado
    if (typeof window !== 'undefined' && sessionStorage.getItem('b4_db_seeded')) {
      return { stationsAdded: 0, materialsAdded: 0 };
    }

    // 1. Verificar estações existentes no Firestore
    const stationsCol = collection(db, 'stations');
    const stationsSnap = await getDocs(stationsCol);
    const existingStationIds = new Set(stationsSnap.docs.map((d) => d.id));
    const existingStationNames = new Set(stationsSnap.docs.map((d) => (d.data() as StationItem).name?.toLowerCase().trim()));

    for (const station of INITIAL_STATIONS) {
      // Se não existe pelo ID nem pelo nome, insere no Firestore
      if (!existingStationIds.has(station.id) && !existingStationNames.has(station.name.toLowerCase().trim())) {
        await setDoc(doc(db, 'stations', station.id), station);
        stationsAdded++;
      }
    }

    // 2. Verificar catálogo de materiais existente no Firestore
    const materialsCol = collection(db, 'materials');
    const materialsSnap = await getDocs(materialsCol);
    const existingMaterialIds = new Set(materialsSnap.docs.map((d) => d.id));
    const existingMaterialNames = new Set(materialsSnap.docs.map((d) => (d.data() as CatalogMaterialItem).name?.toLowerCase().trim()));

    for (const mat of INITIAL_CATALOG_MATERIALS) {
      if (!existingMaterialIds.has(mat.id) && !existingMaterialNames.has(mat.name.toLowerCase().trim())) {
        await setDoc(doc(db, 'materials', mat.id), mat);
        materialsAdded++;
      }
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('b4_db_seeded', '1');
    }
    console.info(`[SEED FIRESTORE] Sincronização concluída: +${stationsAdded} postos, +${materialsAdded} materiais.`);
  } catch (error) {
    console.error('[SEED FIRESTORE] Erro ao sincronizar dados padrão no Firestore:', error);
  }

  return { stationsAdded, materialsAdded };
}

/**
 * Força a restauração/reinserção de todos os postos e materiais padrão no Firestore
 */
export async function forceRestoreAllDefaults(): Promise<{ stationsRestored: number; materialsRestored: number }> {
  let stationsRestored = 0;
  let materialsRestored = 0;

  for (const station of INITIAL_STATIONS) {
    await setDoc(doc(db, 'stations', station.id), station, { merge: true });
    stationsRestored++;
  }

  for (const mat of INITIAL_CATALOG_MATERIALS) {
    await setDoc(doc(db, 'materials', mat.id), mat, { merge: true });
    materialsRestored++;
  }

  return { stationsRestored, materialsRestored };
}
