import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { EquipmentDto, CreateEquipmentRequest, CreateMaintenanceTaskRequest, MaintenanceTaskDto } from '../models/equipment.model';
import { db, EquipmentRecord, MaintenanceTaskRecord } from '../db/bastion-db';

function todayStr(): string { return new Date().toISOString().split('T')[0]; }
function soonStr(days: number): string {
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

function toTaskDto(task: MaintenanceTaskRecord, equip: EquipmentRecord): MaintenanceTaskDto {
  const today = todayStr();
  const soon14 = soonStr(14);
  const nextDueAt = computeNextDue(task, equip);
  const isOverdue = task.intervalDays != null && nextDueAt != null && nextDueAt < today;
  const isDueSoon = !isOverdue && nextDueAt != null && nextDueAt <= soon14;
  return {
    id: task.id,
    equipmentId: task.equipmentId,
    description: task.description,
    intervalDays: task.intervalDays,
    lastCompletedAt: task.lastCompletedAt ?? undefined,
    nextDueAt,
    isOverdue,
    isDueSoon
  };
}

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  getAll(): Observable<EquipmentDto[]> {
    return from(this.getAllAsync());
  }

  create(req: CreateEquipmentRequest): Observable<EquipmentDto> {
    return from(this.createAsync(req));
  }

  delete(id: string): Observable<void> {
    return from(
      db.transaction('rw', db.equipment, db.maintenanceTasks, async () => {
        await db.maintenanceTasks.where('equipmentId').equals(id).delete();
        await db.equipment.delete(id);
      }).then(() => undefined as void)
    );
  }

  addTask(equipmentId: string, req: CreateMaintenanceTaskRequest): Observable<MaintenanceTaskDto> {
    return from(this.addTaskAsync(equipmentId, req));
  }

  completeTask(equipmentId: string, taskId: string): Observable<MaintenanceTaskDto> {
    return from(this.completeTaskAsync(equipmentId, taskId));
  }

  deleteTask(_equipmentId: string, taskId: string): Observable<void> {
    return from(db.maintenanceTasks.delete(taskId).then(() => undefined as void));
  }

  private async getAllAsync(): Promise<EquipmentDto[]> {
    const [equipment, tasks] = await Promise.all([
      db.equipment.toArray(),
      db.maintenanceTasks.toArray()
    ]);
    return equipment.map(e => ({
      id: e.id,
      householdId: 'local',
      name: e.name,
      category: e.category,
      purchaseDate: e.purchaseDate,
      tasks: tasks.filter(t => t.equipmentId === e.id).map(t => toTaskDto(t, e))
    }));
  }

  private async createAsync(req: CreateEquipmentRequest): Promise<EquipmentDto> {
    const id = crypto.randomUUID();
    const record: EquipmentRecord = { id, name: req.name, category: req.category, purchaseDate: req.purchaseDate };
    await db.equipment.add(record);
    return { id, householdId: 'local', name: req.name, category: req.category, purchaseDate: req.purchaseDate, tasks: [] };
  }

  private async addTaskAsync(equipmentId: string, req: CreateMaintenanceTaskRequest): Promise<MaintenanceTaskDto> {
    const equip = await db.equipment.get(equipmentId);
    if (!equip) throw new Error(`Equipment ${equipmentId} not found`);
    const task: MaintenanceTaskRecord = {
      id: crypto.randomUUID(),
      equipmentId,
      description: req.description,
      intervalDays: req.intervalDays,
      lastCompletedAt: null
    };
    await db.maintenanceTasks.add(task);
    return toTaskDto(task, equip);
  }

  private async completeTaskAsync(equipmentId: string, taskId: string): Promise<MaintenanceTaskDto> {
    const [task, equip] = await Promise.all([
      db.maintenanceTasks.get(taskId),
      db.equipment.get(equipmentId)
    ]);
    if (!task || !equip) throw new Error('Not found');
    const updated: MaintenanceTaskRecord = { ...task, lastCompletedAt: todayStr() };
    await db.maintenanceTasks.put(updated);
    return toTaskDto(updated, equip);
  }
}
