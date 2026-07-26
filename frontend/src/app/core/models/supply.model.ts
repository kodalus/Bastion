export type SupplyCategory = 'Water' | 'Food' | 'Medical' | 'Hygiene' | 'Energy' | 'Tools' | 'Documents';

export const SUPPLY_CATEGORIES: SupplyCategory[] = [
  'Water', 'Food', 'Medical', 'Hygiene', 'Energy', 'Tools', 'Documents'
];

export const CATEGORY_LABELS: Record<SupplyCategory, string> = {
  Water: 'Woda',
  Food: 'Żywność',
  Medical: 'Medyczne',
  Hygiene: 'Higiena',
  Energy: 'Energia',
  Tools: 'Narzędzia',
  Documents: 'Dokumenty'
};

export interface SupplyItem {
  id: string;
  name: string;
  category: SupplyCategory;
  quantity: number;
  unit: string;
  storageLocationId: string;
  storageLocationName: string;
  storageLocationDescription: string | null;
  expiryDate: string | null;
  estimatedPricePerUnit: number | null;
  catalogItemName: string | null;
  addedAt: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export interface StorageLocation {
  id: string;
  name: string;
  description: string | null;
}

export interface CreateSupplyItemRequest {
  name: string;
  category: SupplyCategory;
  quantity: number;
  unit: string;
  storageLocationId: string;
  expiryDate: string | null;
  estimatedPricePerUnit: number | null;
  catalogItemName: string | null;
}

export interface CreateLocationRequest {
  name: string;
  description: string | null;
}
