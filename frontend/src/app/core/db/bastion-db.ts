import Dexie, { Table } from 'dexie';
import { SupplyCategory } from '../models/supply.model';
import { EquipmentCategory } from '../models/equipment.model';

export interface SupplyRecord {
  id: string;
  name: string;
  category: SupplyCategory;
  quantity: number;
  unit: string;
  storageLocationId: string;
  expiryDate: string | null;
  estimatedPricePerUnit: number | null;
  catalogItemName: string | null;
  addedAt: string;
}

export interface LocationRecord {
  id: string;
  name: string;
  description: string | null;
}

export interface EquipmentRecord {
  id: string;
  name: string;
  category: EquipmentCategory;
  purchaseDate: string;
}

export interface MaintenanceTaskRecord {
  id: string;
  equipmentId: string;
  description: string;
  intervalDays: number | null;
  lastCompletedAt: string | null;
}

export interface ScenarioRecord {
  id: string;
  name: string;
  description: string;
}

export interface ChecklistItemRecord {
  id: string;
  scenarioId: string;
  text: string;
  sortOrder: number;
  isCompleted: boolean;
}

export interface TargetLevelRecord {
  id: string;
  category: SupplyCategory;
  quantityPerPersonPerDay: number;
  horizonDays: number;
  unit: string;
  isConsumable: boolean;
  weight: number;
}

export interface SettingRecord {
  key: string;
  value: string;
}

// Primary key is `name` (unique catalog item name).
// `id` stores the server-side UUID for future API sync.
export interface SupplyCatalogRecord {
  name: string;
  id: string;
  category: SupplyCategory;
  unit: string;
  suggestedQty: number;
  price: number | null;
}

export interface EquipmentCatalogRecord {
  name: string;
  id: string;
  category: EquipmentCategory;
  hint: string;
  price: number | null;
}

// Bump this constant and add a version(N).stores().upgrade() block below
// whenever the schema changes. Never edit an existing version() block.
export const DB_VERSION = 2;

export class BastionDb extends Dexie {
  supplies!: Table<SupplyRecord>;
  locations!: Table<LocationRecord>;
  equipment!: Table<EquipmentRecord>;
  maintenanceTasks!: Table<MaintenanceTaskRecord>;
  scenarios!: Table<ScenarioRecord>;
  checklistItems!: Table<ChecklistItemRecord>;
  targetLevels!: Table<TargetLevelRecord>;
  settings!: Table<SettingRecord>;
  supplyCatalog!: Table<SupplyCatalogRecord>;
  equipmentCatalog!: Table<EquipmentCatalogRecord>;

  constructor() {
    super('BastionDb');

    // v1 — initial schema
    // Rules: never modify this block. To change the schema:
    //   1. Bump DB_VERSION above.
    //   2. Add this.version(N).stores({...}).upgrade(tx => {...}) below.
    //   3. Update the TypeScript interfaces at the top of this file.
    // The upgrade() callback runs once on the user's device when they open
    // the app after an update. It must be idempotent. If it throws, the
    // database stays at the previous version and APP_INITIALIZER fails
    // (blank screen) — but existing data is NOT lost (IndexedDB rolls back
    // the schema transaction, records are untouched).
    this.version(1).stores({
      supplies:         'id, category, storageLocationId',
      locations:        'id',
      equipment:        'id',
      maintenanceTasks: 'id, equipmentId',
      scenarios:        'id',
      checklistItems:   'id, scenarioId',
      targetLevels:     'id, &category',
      settings:         'key'
    });

    // v2 — adds supplyCatalog and equipmentCatalog tables.
    // Primary key for catalog tables is `name` (unique item name).
    // No data migration needed — only new tables are added.
    this.version(2).stores({
      supplies:         'id, category, storageLocationId',
      locations:        'id',
      equipment:        'id',
      maintenanceTasks: 'id, equipmentId',
      scenarios:        'id',
      checklistItems:   'id, scenarioId',
      targetLevels:     'id, &category',
      settings:         'key',
      supplyCatalog:    'name, category',
      equipmentCatalog: 'name, category'
    });
  }
}

export const db = new BastionDb();
