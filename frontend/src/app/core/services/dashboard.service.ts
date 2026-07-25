import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReadinessResult } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getReadiness(): Observable<ReadinessResult> {
    return this.http.get<ReadinessResult>('/api/dashboard/readiness');
  }
}
