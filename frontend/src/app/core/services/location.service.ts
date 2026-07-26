import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { CreateLocationRequest, StorageLocation } from '../models/supply.model';
import { db } from '../db/bastion-db';

@Injectable({ providedIn: 'root' })
export class LocationService {
  getAll(): Observable<StorageLocation[]> {
    return from(db.locations.toArray());
  }

  create(request: CreateLocationRequest): Observable<StorageLocation> {
    const record: StorageLocation = {
      id: crypto.randomUUID(),
      name: request.name,
      description: request.description
    };
    return from(db.locations.add(record as any).then(() => record));
  }

  update(id: string, request: CreateLocationRequest): Observable<StorageLocation> {
    const record: StorageLocation = { id, name: request.name, description: request.description };
    return from(db.locations.put(record as any).then(() => record));
  }

  delete(id: string): Observable<void> {
    return from(db.locations.delete(id).then(() => undefined as void));
  }
}
