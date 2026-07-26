import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { ScenarioSummaryDto, ScenarioDto, CreateScenarioRequest } from '../models/scenario.model';
import { db, ChecklistItemRecord } from '../db/bastion-db';

@Injectable({ providedIn: 'root' })
export class ScenarioService {
  getAll(): Observable<ScenarioSummaryDto[]> {
    return from(this.getAllAsync());
  }

  getById(id: string): Observable<ScenarioDto> {
    return from(this.getByIdAsync(id));
  }

  create(req: CreateScenarioRequest): Observable<ScenarioDto> {
    return from(this.createAsync(req));
  }

  delete(id: string): Observable<void> {
    return from(
      db.transaction('rw', db.scenarios, db.checklistItems, async () => {
        await db.checklistItems.where('scenarioId').equals(id).delete();
        await db.scenarios.delete(id);
      }).then(() => undefined as void)
    );
  }

  addItem(scenarioId: string, text: string): Observable<{ id: string; text: string; sortOrder: number; isCompleted: boolean }> {
    return from(this.addItemAsync(scenarioId, text));
  }

  toggleItem(scenarioId: string, itemId: string): Observable<{ id: string; isCompleted: boolean }> {
    return from(this.toggleItemAsync(itemId));
  }

  deleteItem(_scenarioId: string, itemId: string): Observable<void> {
    return from(db.checklistItems.delete(itemId).then(() => undefined as void));
  }

  resetAll(scenarioId: string): Observable<void> {
    return from(
      db.checklistItems.where('scenarioId').equals(scenarioId)
        .modify({ isCompleted: false })
        .then(() => undefined as void)
    );
  }

  private async getAllAsync(): Promise<ScenarioSummaryDto[]> {
    const [scenarios, items] = await Promise.all([
      db.scenarios.toArray(),
      db.checklistItems.toArray()
    ]);
    return scenarios.map(s => {
      const its = items.filter(i => i.scenarioId === s.id);
      return { id: s.id, name: s.name, description: s.description, itemCount: its.length, completedCount: its.filter(i => i.isCompleted).length };
    });
  }

  private async getByIdAsync(id: string): Promise<ScenarioDto> {
    const [scenario, items] = await Promise.all([
      db.scenarios.get(id),
      db.checklistItems.where('scenarioId').equals(id).sortBy('sortOrder')
    ]);
    if (!scenario) throw new Error(`Scenario ${id} not found`);
    return {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      items: items.map(i => ({ id: i.id, text: i.text, sortOrder: i.sortOrder, isCompleted: i.isCompleted }))
    };
  }

  private async createAsync(req: CreateScenarioRequest): Promise<ScenarioDto> {
    const id = crypto.randomUUID();
    await db.scenarios.add({ id, name: req.name, description: req.description });
    return { id, name: req.name, description: req.description, items: [] };
  }

  private async addItemAsync(scenarioId: string, text: string): Promise<{ id: string; text: string; sortOrder: number; isCompleted: boolean }> {
    const count = await db.checklistItems.where('scenarioId').equals(scenarioId).count();
    const item: ChecklistItemRecord = { id: crypto.randomUUID(), scenarioId, text, sortOrder: count + 1, isCompleted: false };
    await db.checklistItems.add(item);
    return { id: item.id, text, sortOrder: item.sortOrder, isCompleted: false };
  }

  private async toggleItemAsync(itemId: string): Promise<{ id: string; isCompleted: boolean }> {
    const item = await db.checklistItems.get(itemId);
    if (!item) throw new Error(`Item ${itemId} not found`);
    const updated = { ...item, isCompleted: !item.isCompleted };
    await db.checklistItems.put(updated);
    return { id: updated.id, isCompleted: updated.isCompleted };
  }
}
