export type EquipmentCategory =
  | 'Generator' | 'Filter' | 'FireExtinguisher' | 'FirstAid'
  | 'Tools' | 'Vehicle' | 'Communication' | 'Other';

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  Generator: 'Generator',
  Filter: 'Filtr',
  FireExtinguisher: 'Gaśnica',
  FirstAid: 'Apteczka',
  Tools: 'Narzędzia',
  Vehicle: 'Pojazd',
  Communication: 'Komunikacja',
  Other: 'Inne',
};

export interface MaintenanceTaskDto {
  id: string;
  equipmentId: string;
  description: string;
  intervalDays: number;
  lastCompletedAt?: string;
  nextDueAt: string;
  isOverdue: boolean;
  isDueSoon: boolean;
}

export interface EquipmentDto {
  id: string;
  householdId: string;
  name: string;
  category: EquipmentCategory;
  purchaseDate: string;
  tasks: MaintenanceTaskDto[];
}

export interface CreateEquipmentRequest {
  name: string;
  category: EquipmentCategory;
  purchaseDate: string;
}

export interface CreateMaintenanceTaskRequest {
  description: string;
  intervalDays: number;
}
