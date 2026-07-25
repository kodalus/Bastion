import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { EquipmentDto, CreateEquipmentRequest, CreateMaintenanceTaskRequest, MaintenanceTaskDto } from '../models/equipment.model';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private readonly http = inject(HttpClient);

  private householdId(): Observable<string> {
    return this.http.get<{ id: string }>('/api/households/current').pipe(
      switchMap(h => [h.id])
    ) as Observable<string>;
  }

  getAll(): Observable<EquipmentDto[]> {
    return this.householdId().pipe(
      switchMap(id => this.http.get<EquipmentDto[]>(`/api/households/${id}/equipment`))
    );
  }

  create(req: CreateEquipmentRequest): Observable<EquipmentDto> {
    return this.householdId().pipe(
      switchMap(id => this.http.post<EquipmentDto>(`/api/households/${id}/equipment`, req))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/equipment/${id}`);
  }

  addTask(equipmentId: string, req: CreateMaintenanceTaskRequest): Observable<MaintenanceTaskDto> {
    return this.http.post<MaintenanceTaskDto>(`/api/equipment/${equipmentId}/tasks`, req);
  }

  completeTask(equipmentId: string, taskId: string): Observable<MaintenanceTaskDto> {
    return this.http.post<MaintenanceTaskDto>(`/api/equipment/${equipmentId}/tasks/${taskId}/complete`, {});
  }

  deleteTask(equipmentId: string, taskId: string): Observable<void> {
    return this.http.delete<void>(`/api/equipment/${equipmentId}/tasks/${taskId}`);
  }
}
