import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ScenarioSummaryDto, ScenarioDto, CreateScenarioRequest } from '../models/scenario.model';

@Injectable({ providedIn: 'root' })
export class ScenarioService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/scenarios';

  getAll(): Observable<ScenarioSummaryDto[]> {
    return this.http.get<ScenarioSummaryDto[]>(this.base);
  }

  getById(id: string): Observable<ScenarioDto> {
    return this.http.get<ScenarioDto>(`${this.base}/${id}`);
  }

  create(req: CreateScenarioRequest): Observable<ScenarioDto> {
    return this.http.post<ScenarioDto>(this.base, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  addItem(scenarioId: string, text: string): Observable<{ id: string; text: string; sortOrder: number; isCompleted: boolean }> {
    return this.http.post<{ id: string; text: string; sortOrder: number; isCompleted: boolean }>(
      `${this.base}/${scenarioId}/items`, { text });
  }

  toggleItem(scenarioId: string, itemId: string): Observable<{ id: string; isCompleted: boolean }> {
    return this.http.put<{ id: string; isCompleted: boolean }>(
      `${this.base}/${scenarioId}/items/${itemId}/toggle`, {});
  }

  deleteItem(scenarioId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${scenarioId}/items/${itemId}`);
  }

  resetAll(scenarioId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${scenarioId}/reset`, {});
  }
}
