import { SupplyRecord, EquipmentRecord, MaintenanceTaskRecord, TargetLevelRecord } from '../db/bastion-db';
import { ReadinessResult, CategoryScore, ShoppingListItem, OverdueTask, ShoppingPriority } from '../models/dashboard.model';
import { SupplyCategory } from '../models/supply.model';

const CATEGORY_WEIGHTS: Record<SupplyCategory, number> = {
  Water: 3, Food: 3, Medical: 2, Hygiene: 1, Energy: 1, Tools: 0.5, Documents: 0.5
};
const EQUIPMENT_WEIGHT = 2;
const EXPIRING_SOON_DAYS = 30;
const EXPIRING_SOON_WEIGHT = 0.5;

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function addDaysStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function computeNextDue(task: MaintenanceTaskRecord, equip: EquipmentRecord): string | null {
  if (!task.intervalDays) return null;
  const base = task.lastCompletedAt ?? equip.purchaseDate;
  const d = new Date(base);
  d.setDate(d.getDate() + task.intervalDays);
  return d.toISOString().split('T')[0];
}

function getPriority(cat: SupplyCategory): ShoppingPriority {
  if (cat === 'Water' || cat === 'Food' || cat === 'Medical') return 'High';
  if (cat === 'Hygiene' || cat === 'Energy') return 'Medium';
  return 'Low';
}

export function calculateReadiness(
  supplies: SupplyRecord[],
  targets: TargetLevelRecord[],
  equipment: EquipmentRecord[],
  tasks: MaintenanceTaskRecord[],
  memberCount: number
): ReadinessResult {
  const today = todayStr();
  const soon30 = addDaysStr(EXPIRING_SOON_DAYS);

  const categoryScores: CategoryScore[] = [];
  const shoppingList: ShoppingListItem[] = [];

  for (const target of targets) {
    const required = target.quantityPerPersonPerDay * target.horizonDays * memberCount;
    let available = 0;

    for (const s of supplies.filter(s => s.category === target.category)) {
      if (s.expiryDate && s.expiryDate < today) continue;
      if (s.expiryDate && s.expiryDate <= soon30) {
        available += s.quantity * EXPIRING_SOON_WEIGHT;
      } else {
        available += s.quantity;
      }
    }

    const score = required > 0 ? Math.min(100, Math.round(available / required * 100)) : 100;
    categoryScores.push({
      category: target.category,
      score,
      available: Math.round(available * 100) / 100,
      required: Math.round(required * 100) / 100,
      unit: target.unit
    });

    if (score < 100) {
      const gap = Math.round((required - available) * 100) / 100;
      shoppingList.push({
        category: target.category,
        gap,
        unit: target.unit,
        priority: getPriority(target.category)
      });
    }
  }

  const overdueTasks: OverdueTask[] = [];
  let equipmentScore = 100;

  const recurringTasks = tasks.filter(t => t.intervalDays != null);
  if (recurringTasks.length > 0) {
    const equipMap = new Map(equipment.map(e => [e.id, e]));
    let overdueCount = 0;
    for (const task of recurringTasks) {
      const equip = equipMap.get(task.equipmentId);
      if (!equip) continue;
      const nextDue = computeNextDue(task, equip);
      if (nextDue && nextDue < today) {
        overdueCount++;
        const daysOverdue = Math.floor((Date.now() - new Date(nextDue).getTime()) / 86_400_000);
        overdueTasks.push({
          equipmentId: equip.id,
          equipmentName: equip.name,
          taskId: task.id,
          taskDescription: task.description,
          nextDueAt: nextDue,
          daysOverdue
        });
      }
    }
    equipmentScore = Math.round((recurringTasks.length - overdueCount) / recurringTasks.length * 100);
  }

  const hasEquipment = recurringTasks.length > 0;
  const weightSum = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0) +
    (hasEquipment ? EQUIPMENT_WEIGHT : 0);
  let weightedSum = categoryScores.reduce(
    (acc, cs) => acc + cs.score * CATEGORY_WEIGHTS[cs.category], 0
  );
  if (hasEquipment) weightedSum += equipmentScore * EQUIPMENT_WEIGHT;
  const overallScore = Math.round(weightedSum / weightSum);

  const PRIORITY_ORDER: Record<ShoppingPriority, number> = { High: 0, Medium: 1, Low: 2 };
  shoppingList.sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
              a.category.localeCompare(b.category)
  );

  return { overallScore, memberCount, categoryScores, shoppingList, equipmentScore, overdueTasks };
}
