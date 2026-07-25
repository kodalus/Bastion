import { SupplyCategory } from './supply.model';

export type ShoppingPriority = 'High' | 'Medium' | 'Low';

export interface CategoryScore {
  category: SupplyCategory;
  score: number;
  available: number;
  required: number;
  unit: string;
}

export interface ShoppingListItem {
  category: SupplyCategory;
  gap: number;
  unit: string;
  priority: ShoppingPriority;
  estimatedCost?: number;
}

export interface ReadinessResult {
  overallScore: number;
  memberCount: number;
  categoryScores: CategoryScore[];
  shoppingList: ShoppingListItem[];
}
