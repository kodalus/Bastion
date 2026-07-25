import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateSupplyItemRequest, SupplyItem } from '../models/supply.model';

@Injectable({ providedIn: 'root' })
export class SupplyService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/supplies';

  getAll(): Observable<SupplyItem[]> {
    return this.http.get<SupplyItem[]>(this.base);
  }

  create(request: CreateSupplyItemRequest): Observable<SupplyItem> {
    return this.http.post<SupplyItem>(this.base, request);
  }

  update(id: string, request: CreateSupplyItemRequest): Observable<SupplyItem> {
    return this.http.put<SupplyItem>(`${this.base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
