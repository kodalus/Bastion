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
}

export interface SettingRecord {
  key: string;
  value: string;
}

// Bump this constant and add a version(N).stores().upgrade() block below
// whenever the schema changes. Never edit an existing version() block.
export const DB_VERSION = 1;

export class BastionDb extends Dexie {
  supplies!: Table<SupplyRecord>;
  locations!: Table<LocationRecord>;
  equipment!: Table<EquipmentRecord>;
  maintenanceTasks!: Table<MaintenanceTaskRecord>;
  scenarios!: Table<ScenarioRecord>;
  checklistItems!: Table<ChecklistItemRecord>;
  targetLevels!: Table<TargetLevelRecord>;
  settings!: Table<SettingRecord>;

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

    // ── Template for next migration ──────────────────────────────────────────
    // Example: v2 adds a 'weight' field to targetLevels (backlog item #6).
    // Uncomment, set DB_VERSION = 2, update TargetLevelRecord interface.
    //
    // this.version(2).stores({
    //   supplies:         'id, category, storageLocationId',
    //   locations:        'id',
    //   equipment:        'id',
    //   maintenanceTasks: 'id, equipmentId',
    //   scenarios:        'id',
    //   checklistItems:   'id, scenarioId',
    //   targetLevels:     'id, &category',
    //   settings:         'key'
    // }).upgrade(tx =>
    //   tx.table('targetLevels').toCollection().modify((record: TargetLevelRecord) => {
    //     if (record.weight === undefined) (record as any).weight = 1;
    //   })
    // );
  }
}

export const db = new BastionDb();
