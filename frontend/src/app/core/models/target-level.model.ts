import { SupplyCategory } from './supply.model';

export interface TargetLevel {
  id: string;
  category: SupplyCategory;
  quantityPerPersonPerDay: number;
  horizonDays: number;
  unit: string;
}

export interface UpdateTargetLevelRequest {
  quantityPerPersonPerDay: number;
  horizonDays: number;
  unit: string;
}
