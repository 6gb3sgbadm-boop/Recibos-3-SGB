export interface ReceiptItem {
  id: string;
  material: string;
  unit: string;
  quantity: number;
  notes?: string;
}

export type ReceiptStatus = 'pending' | 'signed';
export type SignatureMethod = 'none' | 'canvas' | 'google_auth';

export interface Receipt {
  id: string;
  receiptNumber: string; // Ex: Recibo Nº 6GB-3ºSGB-B4-01/300/26
  consecutiveNumber: number;
  year: number;
  date: string; // DD/MM/AAAA
  station: string; // Ex: EB Praia Grande
  deliveredBy: string; // Ex: CB PM SEDREZ
  receivedBy: string; // Ex: CB PM CHARLES ou VAGO se pendente
  items: ReceiptItem[];
  observations?: string;
  status: ReceiptStatus;
  signatureMethod?: SignatureMethod;
  signatureData?: string; // Data URL base64 da rubrica na tela
  signerName?: string;
  signerEmail?: string;
  signedAt?: string; // Data e hora ISO da assinatura
  createdAt?: string;
  updatedAt?: string;
}

export interface StationItem {
  id: string;
  name: string;
  code?: string;
  city?: string;
}

export interface CatalogMaterialItem {
  id: string;
  name: string;
  defaultUnit: string;
  category?: string;
}

export interface AuthorizedUser {
  id: string;
  email: string;
  name?: string;
  canCreateReceipts: boolean;
  canDeleteReceipts: boolean;
  addedAt: string;
  addedBy: string;
}

