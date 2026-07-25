import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ScenarioService } from '../../core/services/scenario.service';
import { ScenarioDto, ScenarioSummaryDto } from '../../core/models/scenario.model';

@Component({
  selector: 'app-scenarios',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatCheckboxModule,
    MatProgressBarModule, MatExpansionModule, MatFormFieldModule,
    MatInputModule, MatDialogModule, MatTooltipModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h1><mat-icon>checklist</mat-icon> Scenariusze awaryjne</h1>
        <button mat-raised-button color="primary" (click)="openAddScenario()">
          <mat-icon>add</mat-icon> Nowy scenariusz
        </button>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (addingScenario()) {
        <mat-card class="add-card">
          <mat-card-content>
            <div class="add-form">
              <mat-form-field appearance="outline" class="name-field">
                <mat-label>Nazwa scenariusza</mat-label>
                <input matInput [(ngModel)]="newName" placeholder="np. Awaria prądu" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="desc-field">
                <mat-label>Opis (opcjonalny)</mat-label>
                <input matInput [(ngModel)]="newDescription" />
              </mat-form-field>
              <div class="add-actions">
                <button mat-raised-button color="primary" [disabled]="!newName.trim()" (click)="createScenario()">Dodaj</button>
                <button mat-button (click)="addingScenario.set(false)">Anuluj</button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <mat-accordion multi>
        @for (s of summaries(); track s.id) {
          <mat-expansion-panel (opened)="loadDetail(s.id)">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon class="scenario-icon">{{ scenarioIcon(s.name) }}</mat-icon>
                <span class="scenario-name">{{ s.name }}</span>
              </mat-panel-title>
              <mat-panel-description>
                <span class="progress-text">{{ s.completedCount }}/{{ s.itemCount }} wykonanych</span>
                <mat-progress-bar
                  class="header-progress"
                  mode="determinate"
                  [value]="progress(s)"
                  [color]="progress(s) === 100 ? 'primary' : 'accent'"
                />
              </mat-panel-description>
            </mat-expansion-panel-header>

            @if (detail(s.id); as d) {
              @if (d.description) {
                <p class="scenario-desc">{{ d.description }}</p>
              }

              <div class="checklist">
                @for (item of d.items; track item.id) {
                  <div class="checklist-item" [class.completed]="item.isCompleted">
                    <mat-checkbox
                      [checked]="item.isCompleted"
                      (change)="toggleItem(s.id, item.id)"
                      color="primary">
                      {{ item.text }}
                    </mat-checkbox>
                    <button mat-icon-button class="delete-item-btn"
                      matTooltip="Usuń krok"
                      (click)="deleteItem(s.id, item.id)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                }
              </div>

              <div class="add-item-row">
                <mat-form-field appearance="outline" class="item-input">
                  <mat-label>Dodaj krok</mat-label>
                  <input matInput
                    [(ngModel)]="newItemText[s.id]"
                    (keyup.enter)="addItem(s.id)"
                    placeholder="Opis kroku..." />
                </mat-form-field>
                <button mat-icon-button color="primary"
                  [disabled]="!newItemText[s.id]?.trim()"
                  (click)="addItem(s.id)">
                  <mat-icon>add_circle</mat-icon>
                </button>
              </div>

              <mat-action-row>
                <button mat-button (click)="resetScenario(s.id)">
                  <mat-icon>restart_alt</mat-icon> Resetuj listę
                </button>
                <button mat-button color="warn" (click)="deleteScenario(s.id)">
                  <mat-icon>delete</mat-icon> Usuń scenariusz
                </button>
              </mat-action-row>
            } @else {
              <mat-progress-bar mode="indeterminate" />
            }
          </mat-expansion-panel>
        }
      </mat-accordion>

      @if (!loading() && summaries().length === 0) {
        <div class="empty">
          <mat-icon>checklist_rtl</mat-icon>
          <p>Brak scenariuszy. Dodaj pierwszy plan awaryjny.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 860px; margin: 24px auto; padding: 0 16px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .page-header h1 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 1.5rem; }
    .add-card { margin-bottom: 16px; }
    .add-form { display: flex; flex-direction: column; gap: 8px; }
    .name-field, .desc-field { width: 100%; }
    .add-actions { display: flex; gap: 8px; }
    .scenario-icon { margin-right: 8px; color: #546e7a; }
    .scenario-name { font-weight: 500; }
    .progress-text { font-size: 0.8rem; color: #757575; margin-right: 12px; white-space: nowrap; }
    .header-progress { width: 120px; align-self: center; }
    .scenario-desc { color: #757575; font-size: 0.9rem; margin: 0 0 12px; }
    .checklist { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
    .checklist-item { display: flex; align-items: center; justify-content: space-between;
      padding: 4px 8px; border-radius: 4px; transition: background 0.2s; }
    .checklist-item:hover { background: rgba(0,0,0,0.04); }
    .checklist-item.completed { opacity: 0.55; }
    .checklist-item.completed ::ng-deep .mdc-label { text-decoration: line-through; }
    .delete-item-btn { opacity: 0; transition: opacity 0.2s; transform: scale(0.8); }
    .checklist-item:hover .delete-item-btn { opacity: 1; }
    .add-item-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
    .item-input { flex: 1; }
    .empty { text-align: center; padding: 48px 0; color: #9e9e9e; }
    .empty mat-icon { font-size: 64px; height: 64px; width: 64px; }
  `]
})
export class ScenariosComponent implements OnInit {
  private readonly svc = inject(ScenarioService);

  readonly loading = signal(true);
  readonly summaries = signal<ScenarioSummaryDto[]>([]);
  readonly addingScenario = signal(false);
  newName = '';
  newDescription = '';
  newItemText: Record<string, string> = {};

  private detailMap = signal<Record<string, ScenarioDto>>({});

  detail(id: string): ScenarioDto | undefined {
    return this.detailMap()[id];
  }

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: list => { this.summaries.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadDetail(id: string): void {
    if (this.detailMap()[id]) return;
    this.svc.getById(id).subscribe(d => {
      this.detailMap.update(m => ({ ...m, [id]: d }));
    });
  }

  progress(s: ScenarioSummaryDto): number {
    return s.itemCount === 0 ? 0 : Math.round((s.completedCount / s.itemCount) * 100);
  }

  openAddScenario(): void {
    this.newName = '';
    this.newDescription = '';
    this.addingScenario.set(true);
  }

  createScenario(): void {
    if (!this.newName.trim()) return;
    this.svc.create({ name: this.newName.trim(), description: this.newDescription.trim() }).subscribe(d => {
      this.summaries.update(list => [
        ...list,
        { id: d.id, name: d.name, description: d.description, itemCount: 0, completedCount: 0 }
      ]);
      this.detailMap.update(m => ({ ...m, [d.id]: d }));
      this.addingScenario.set(false);
    });
  }

  addItem(scenarioId: string): void {
    const text = this.newItemText[scenarioId]?.trim();
    if (!text) return;
    this.svc.addItem(scenarioId, text).subscribe(item => {
      this.detailMap.update(m => {
        const d = m[scenarioId];
        if (!d) return m;
        return { ...m, [scenarioId]: { ...d, items: [...d.items, { ...item }] } };
      });
      this.summaries.update(list =>
        list.map(s => s.id === scenarioId ? { ...s, itemCount: s.itemCount + 1 } : s)
      );
      this.newItemText[scenarioId] = '';
    });
  }

  toggleItem(scenarioId: string, itemId: string): void {
    this.svc.toggleItem(scenarioId, itemId).subscribe(result => {
      this.detailMap.update(m => {
        const d = m[scenarioId];
        if (!d) return m;
        const items = d.items.map(i => i.id === itemId ? { ...i, isCompleted: result.isCompleted } : i);
        return { ...m, [scenarioId]: { ...d, items } };
      });
      this.summaries.update(list =>
        list.map(s => {
          if (s.id !== scenarioId) return s;
          const d = this.detailMap()[scenarioId];
          const completed = d?.items.filter(i => i.isCompleted).length ?? s.completedCount;
          return { ...s, completedCount: completed };
        })
      );
    });
  }

  deleteItem(scenarioId: string, itemId: string): void {
    this.svc.deleteItem(scenarioId, itemId).subscribe(() => {
      this.detailMap.update(m => {
        const d = m[scenarioId];
        if (!d) return m;
        const items = d.items.filter(i => i.id !== itemId);
        return { ...m, [scenarioId]: { ...d, items } };
      });
      this.summaries.update(list =>
        list.map(s => {
          if (s.id !== scenarioId) return s;
          const wasCompleted = this.detailMap()[scenarioId]?.items.find(i => i.id === itemId)?.isCompleted ?? false;
          return { ...s, itemCount: s.itemCount - 1, completedCount: s.completedCount - (wasCompleted ? 1 : 0) };
        })
      );
    });
  }

  resetScenario(scenarioId: string): void {
    this.svc.resetAll(scenarioId).subscribe(() => {
      this.detailMap.update(m => {
        const d = m[scenarioId];
        if (!d) return m;
        return { ...m, [scenarioId]: { ...d, items: d.items.map(i => ({ ...i, isCompleted: false })) } };
      });
      this.summaries.update(list =>
        list.map(s => s.id === scenarioId ? { ...s, completedCount: 0 } : s)
      );
    });
  }

  deleteScenario(scenarioId: string): void {
    this.svc.delete(scenarioId).subscribe(() => {
      this.summaries.update(list => list.filter(s => s.id !== scenarioId));
      this.detailMap.update(m => {
        const copy = { ...m };
        delete copy[scenarioId];
        return copy;
      });
    });
  }

  scenarioIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('prąd') || n.includes('awaria')) return 'flash_off';
    if (n.includes('ewakuacja')) return 'directions_run';
    if (n.includes('woda')) return 'water_drop';
    if (n.includes('apteczka') || n.includes('medyc')) return 'medical_services';
    if (n.includes('pożar')) return 'local_fire_department';
    return 'emergency';
  }
}
