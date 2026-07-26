import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { ReadinessResult } from '../models/dashboard.model';
import { db } from '../db/bastion-db';
import { calculateReadiness } from './readiness-score';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  getReadiness(): Observable<ReadinessResult> {
    return from(this.computeAsync());
  }

  private async computeAsync(): Promise<ReadinessResult> {
    const [supplies, targets, equipment, tasks, memberCountSetting] = await Promise.all([
      db.supplies.toArray(),
      db.targetLevels.toArray(),
      db.equipment.toArray(),
      db.maintenanceTasks.toArray(),
      db.settings.get('memberCount')
    ]);
    const memberCount = parseInt(memberCountSetting?.value ?? '2', 10);
    return calculateReadiness(supplies, targets, equipment, tasks, memberCount);
  }
}
