import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateLocationRequest, StorageLocation } from '../models/supply.model';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/locations';

  getAll(): Observable<StorageLocation[]> {
    return this.http.get<StorageLocation[]>(this.base);
  }

  create(request: CreateLocationRequest): Observable<StorageLocation> {
    return this.http.post<StorageLocation>(this.base, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
