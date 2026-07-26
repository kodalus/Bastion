import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { CreateSupplyItemRequest, SupplyItem } from '../models/supply.model';
import { db, LocationRecord, SupplyRecord } from '../db/bastion-db';

function todayStr(): string { return new Date().toISOString().split('T')[0]; }
function soonStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

@Injectable({ providedIn: 'root' })
export class SupplyService {
  getAll(): Observable<SupplyItem[]> {
    return from(this.getAllAsync());
  }

  create(request: CreateSupplyItemRequest): Observable<SupplyItem> {
    return from(this.createAsync(request));
  }

  update(id: string, request: CreateSupplyItemRequest): Observable<SupplyItem> {
    return from(this.updateAsync(id, request));
  }

  delete(id: string): Observable<void> {
    return from(db.supplies.delete(id).then(() => undefined as void));
  }

  private async getAllAsync(): Promise<SupplyItem[]> {
    const [records, locations] = await Promise.all([
      db.supplies.toArray(),
      db.locations.toArray()
    ]);
    const locMap = new Map<string, LocationRecord>(locations.map(l => [l.id, l]));
    return records.map(r => this.enrich(r, locMap));
  }

  private async createAsync(req: CreateSupplyItemRequest): Promise<SupplyItem> {
    const record: SupplyRecord = {
      id: crypto.randomUUID(),
      name: req.name,
      category: req.category,
      quantity: req.quantity,
      unit: req.unit,
      storageLocationId: req.storageLocationId,
      expiryDate: req.expiryDate,
      estimatedPricePerUnit: req.estimatedPricePerUnit,
      catalogItemName: req.catalogItemName,
      addedAt: new Date().toISOString()
    };
    await db.supplies.add(record);
    const loc = await db.locations.get(req.storageLocationId);
    return this.enrich(record, new Map(loc ? [[loc.id, loc]] : []));
  }

  private async updateAsync(id: string, req: CreateSupplyItemRequest): Promise<SupplyItem> {
    const existing = await db.supplies.get(id);
    if (!existing) throw new Error(`Supply ${id} not found`);
    const updated: SupplyRecord = {
      ...existing,
      name: req.name,
      category: req.category,
      quantity: req.quantity,
      unit: req.unit,
      storageLocationId: req.storageLocationId,
      expiryDate: req.expiryDate,
      estimatedPricePerUnit: req.estimatedPricePerUnit,
      catalogItemName: req.catalogItemName
    };
    await db.supplies.put(updated);
    const loc = await db.locations.get(req.storageLocationId);
    return this.enrich(updated, new Map(loc ? [[loc.id, loc]] : []));
  }

  private enrich(r: SupplyRecord, locMap: Map<string, LocationRecord>): SupplyItem {
    const loc = locMap.get(r.storageLocationId);
    const today = todayStr();
    const soon = soonStr(30);
    const isExpired = r.expiryDate != null && r.expiryDate < today;
    const isExpiringSoon = !isExpired && r.expiryDate != null && r.expiryDate <= soon;
    return {
      id: r.id,
      name: r.name,
      category: r.category,
      quantity: r.quantity,
      unit: r.unit,
      storageLocationId: r.storageLocationId,
      storageLocationName: loc?.name ?? '',
      storageLocationDescription: loc?.description ?? null,
      expiryDate: r.expiryDate,
      estimatedPricePerUnit: r.estimatedPricePerUnit,
      catalogItemName: r.catalogItemName,
      addedAt: r.addedAt,
      isExpired,
      isExpiringSoon
    };
  }
}
