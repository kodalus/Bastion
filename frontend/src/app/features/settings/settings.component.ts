import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { db, TargetLevelRecord } from '../../core/db/bastion-db';
import { CATEGORY_LABELS, SupplyCategory } from '../../core/models/supply.model';

const CATEGORY_ORDER: SupplyCategory[] = ['Water', 'Food', 'Medical', 'Hygiene', 'Energy', 'Tools', 'Documents'];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatDividerModule
  ],
  template: `
    <div class="settings-container">
      <h1>Ustawienia</h1>

      <mat-card class="section-card">
        <mat-card-header><mat-card-title>Gospodarstwo domowe</mat-card-title></mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nazwa</mat-label>
            <input matInput [ngModel]="householdName()" (ngModelChange)="householdName.set($event)" />
          </mat-form-field>
          <mat-form-field appearance="outline" style="max-width:160px">
            <mat-label>Liczba osób</mat-label>
            <input matInput type="number" min="1" max="20"
                   [ngModel]="memberCount()" (ngModelChange)="memberCount.set(+$event)" />
          </mat-form-field>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button color="primary" (click)="saveHousehold()">Zapisz</button>
        </mat-card-actions>
      </mat-card>

      <mat-card class="section-card">
        <mat-card-header><mat-card-title>Cele zapasów (poziomy docelowe)</mat-card-title></mat-card-header>
        <mat-card-content>
          <p class="hint">Cel = ilość / osobę / dzień × liczba dni × liczba osób</p>
          <table class="target-table">
            <thead>
              <tr>
                <th>Kategoria</th>
                <th>/ osobę / dzień</th>
                <th>Dni</th>
                <th>Jednostka</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (t of orderedTargets(); track t.id) {
                <tr>
                  <td>{{ catLabels[t.category] }}</td>
                  <td><input type="number" class="num-input" [(ngModel)]="t.quantityPerPersonPerDay" min="0" step="0.01" /></td>
                  <td><input type="number" class="num-input" [(ngModel)]="t.horizonDays" min="1" step="1" /></td>
                  <td><input type="text"   class="unit-input" [(ngModel)]="t.unit" /></td>
                  <td><button mat-icon-button color="primary" (click)="saveTarget(t)" matTooltip="Zapisz"><mat-icon>save</mat-icon></button></td>
                </tr>
              }
            </tbody>
          </table>
        </mat-card-content>
      </mat-card>

      <mat-card class="section-card">
        <mat-card-header><mat-card-title>Nawigacja</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="nav-links">
            <a mat-stroked-button routerLink="/catalog"><mat-icon>list_alt</mat-icon> Katalog zapasów</a>
            <a mat-stroked-button routerLink="/equipment-catalog"><mat-icon>home_repair_service</mat-icon> Katalog sprzętu</a>
            <a mat-stroked-button routerLink="/locations"><mat-icon>place</mat-icon> Lokalizacje</a>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="section-card danger-card">
        <mat-card-header><mat-card-title>Strefa niebezpieczna</mat-card-title></mat-card-header>
        <mat-card-content>
          <p class="hint">Usuwa wszystkie dane i przywraca dane przykładowe.</p>
          <button mat-flat-button color="warn" (click)="resetAll()">
            <mat-icon>delete_forever</mat-icon> Resetuj wszystkie dane
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container { padding: 16px; max-width: 700px; margin: 0 auto; }
    h1 { font-size: 1.5rem; margin: 0 0 16px; }
    .section-card { margin-bottom: 16px; }
    .full-width { width: 100%; }
    .hint { color: #888; font-size: 0.85rem; margin: 0 0 12px; }
    .target-table { width: 100%; border-collapse: collapse; }
    .target-table th { text-align: left; font-size: 0.75rem; color: #888; padding: 4px 6px; border-bottom: 2px solid #eee; }
    .target-table td { padding: 4px 6px; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
    .num-input  { width: 72px; padding: 4px 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; text-align: right; }
    .unit-input { width: 60px; padding: 4px 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; }
    .nav-links { display: flex; flex-direction: column; gap: 8px; }
    .nav-links a { justify-content: flex-start; gap: 8px; }
    .danger-card { border: 1px solid #e57373; }
  `]
})
export class SettingsComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar);

  readonly memberCount = signal(2);
  readonly householdName = signal('');
  readonly targetLevels = signal<TargetLevelRecord[]>([]);
  readonly catLabels = CATEGORY_LABELS;

  readonly orderedTargets = () =>
    CATEGORY_ORDER.map(cat => this.targetLevels().find(t => t.category === cat)).filter(Boolean) as TargetLevelRecord[];

  ngOnInit() { this.load(); }

  private async load() {
    const [mc, hn, levels] = await Promise.all([
      db.settings.get('memberCount'),
      db.settings.get('householdName'),
      db.targetLevels.toArray()
    ]);
    this.memberCount.set(parseInt(mc?.value ?? '2', 10));
    this.householdName.set(hn?.value ?? '');
    this.targetLevels.set(levels);
  }

  async saveHousehold() {
    await Promise.all([
      db.settings.put({ key: 'memberCount', value: String(this.memberCount()) }),
      db.settings.put({ key: 'householdName', value: this.householdName() })
    ]);
    this.snackBar.open('Zapisano', 'OK', { duration: 2000 });
  }

  async saveTarget(level: TargetLevelRecord) {
    await db.targetLevels.put(level);
    this.snackBar.open('Zapisano cel', 'OK', { duration: 2000 });
  }

  async resetAll() {
    if (!confirm('Usunąć wszystkie dane? Zostaną przywrócone dane przykładowe.')) return;
    await db.delete();
    window.location.reload();
  }
}
