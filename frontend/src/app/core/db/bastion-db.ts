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
    this.version(1).stores({
      supplies:          'id, category, storageLocationId',
      locations:         'id',
      equipment:         'id',
      maintenanceTasks:  'id, equipmentId',
      scenarios:         'id',
      checklistItems:    'id, scenarioId',
      targetLevels:      'id, &category',
      settings:          'key'
    });
  }
}

export const db = new BastionDb();
