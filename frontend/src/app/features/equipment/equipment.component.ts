import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { EquipmentService } from '../../core/services/equipment.service';
import {
  EquipmentCategory, EquipmentDto, EQUIPMENT_CATEGORY_LABELS, MaintenanceTaskDto
} from '../../core/models/equipment.model';

const CATEGORIES: EquipmentCategory[] = [
  'Generator', 'Filter', 'FireExtinguisher', 'FirstAid',
  'Tools', 'Vehicle', 'Communication', 'Other'
];

@Component({
  selector: 'app-equipment',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressBarModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDialogModule, MatExpansionModule, MatDividerModule
  ],
  template: `
    <div class="eq-container">
      <div class="page-header">
        <h1>Sprzęt i konserwacja</h1>
        <button mat-raised-button color="primary" (click)="showAddForm.set(!showAddForm())">
          <mat-icon>add</mat-icon> Dodaj sprzęt
        </button>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (showAddForm()) {
        <mat-card class="add-card">
          <mat-card-header><mat-card-title>Nowy sprzęt</mat-card-title></mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="field">
              <mat-label>Nazwa</mat-label>
              <input matInput [(ngModel)]="newName" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="field">
              <mat-label>Kategoria</mat-label>
              <mat-select [(ngModel)]="newCategory">
                @for (c of categories; track c) {
                  <mat-option [value]="c">{{ catLabels[c] }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="field">
              <mat-label>Data zakupu</mat-label>
              <input matInput type="date" [(ngModel)]="newPurchaseDate" />
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="addEquipment()" [disabled]="!newName.trim()">Zapisz</button>
            <button mat-button (click)="showAddForm.set(false)">Anuluj</button>
          </mat-card-actions>
        </mat-card>
      }

      @if (error()) {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error() }}</span>
          <button mat-button (click)="load()">Spróbuj ponownie</button>
        </div>
      }

      <div class="eq-grid">
        @for (eq of equipment(); track eq.id) {
          <mat-card class="eq-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>{{ categoryIcon(eq.category) }}</mat-icon>
              <mat-card-title>{{ eq.name }}</mat-card-title>
              <mat-card-subtitle>
                {{ catLabels[eq.category] }} · zakupiony {{ eq.purchaseDate }}
              </mat-card-subtitle>
              <span class="header-spacer"></span>
              <button mat-icon-button color="warn" (click)="deleteEquipment(eq.id)" class="delete-btn">
                <mat-icon>delete</mat-icon>
              </button>
            </mat-card-header>

            <mat-card-content>
              <h4 class="tasks-header">Zadania konserwacyjne</h4>
              @for (task of eq.tasks; track task.id) {
                <div class="task-row" [class.overdue]="task.isOverdue" [class.due-soon]="!task.isOverdue && task.isDueSoon">
                  <div class="task-info">
                    <span class="task-desc">{{ task.description }}</span>
                    <span class="task-meta">
                      Co {{ task.intervalDays }} dni ·
                      Następny przegląd: {{ task.nextDueAt }}
                      @if (task.isOverdue) { <mat-chip color="warn" selected>Przeterminowane</mat-chip> }
                      @else if (task.isDueSoon) { <mat-chip color="accent" selected>Wkrótce</mat-chip> }
                    </span>
                  </div>
                  <div class="task-actions">
                    <button mat-icon-button color="primary" (click)="completeTask(eq.id, task.id)" title="Oznacz jako wykonane">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteTask(eq.id, task.id)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </div>
              }

              <div class="add-task-row">
                <mat-form-field appearance="outline" class="task-desc-field">
                  <mat-label>Nowe zadanie</mat-label>
                  <input matInput [(ngModel)]="taskDesc[eq.id]" placeholder="Opis zadania" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="task-interval-field">
                  <mat-label>Dni</mat-label>
                  <input matInput type="number" [(ngModel)]="taskInterval[eq.id]" min="1" />
                </mat-form-field>
                <button mat-icon-button color="primary" (click)="addTask(eq.id)" [disabled]="!taskDesc[eq.id]?.trim()">
                  <mat-icon>add</mat-icon>
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      @if (!loading() && !error() && equipment().length === 0) {
        <div class="empty-state">
          <mat-icon>construction</mat-icon>
          <p>Brak sprzętu. Dodaj pierwsze urządzenie powyżej.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .eq-container { padding: 24px; max-width: 1100px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { font-size: 1.75rem; margin: 0; }
    h4.tasks-header { margin: 12px 0 8px; font-size: 0.95rem; color: #555; }

    .add-card { margin-bottom: 24px; }
    .field { width: 100%; margin-bottom: 8px; display: block; }

    .eq-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px; }

    .eq-card mat-card-header { align-items: flex-start; }
    .header-spacer { flex: 1; }
    .delete-btn { margin-top: -8px; }

    .task-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; border-bottom: 1px solid #f0f0f0;
    }
    .task-row.overdue { background: #fff5f5; border-radius: 4px; padding: 8px; margin-bottom: 4px; }
    .task-row.due-soon { background: #fff8e1; border-radius: 4px; padding: 8px; margin-bottom: 4px; }
    .task-info { flex: 1; }
    .task-desc { display: block; font-weight: 500; font-size: 0.9rem; }
    .task-meta { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #888; margin-top: 2px; }
    .task-actions { display: flex; gap: 4px; }

    .add-task-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
    .task-desc-field { flex: 1; }
    .task-interval-field { width: 80px; }

    .error-state { display: flex; align-items: center; gap: 8px; color: #c62828; padding: 16px 0; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px 0; color: #888; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `]
})
export class EquipmentComponent implements OnInit {
  private readonly svc = inject(EquipmentService);

  readonly equipment = signal<EquipmentDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showAddForm = signal(false);

  readonly categories = CATEGORIES;
  readonly catLabels = EQUIPMENT_CATEGORY_LABELS;

  newName = '';
  newCategory: EquipmentCategory = 'Other';
  newPurchaseDate = new Date().toISOString().split('T')[0];

  taskDesc: Record<string, string> = {};
  taskInterval: Record<string, number> = {};

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getAll().subscribe({
      next: list => { this.equipment.set(list); this.loading.set(false); },
      error: () => { this.error.set('Nie udało się załadować danych.'); this.loading.set(false); }
    });
  }

  addEquipment() {
    const req = { name: this.newName.trim(), category: this.newCategory, purchaseDate: this.newPurchaseDate };
    this.svc.create(req).subscribe({
      next: eq => {
        this.equipment.update(list => [...list, eq]);
        this.newName = '';
        this.showAddForm.set(false);
      },
      error: () => this.error.set('Nie udało się dodać sprzętu.')
    });
  }

  deleteEquipment(id: string) {
    this.svc.delete(id).subscribe({
      next: () => this.equipment.update(list => list.filter(e => e.id !== id)),
      error: () => this.error.set('Nie udało się usunąć sprzętu.')
    });
  }

  addTask(equipmentId: string) {
    const desc = this.taskDesc[equipmentId]?.trim();
    const interval = this.taskInterval[equipmentId] || 365;
    if (!desc) return;
    this.svc.addTask(equipmentId, { description: desc, intervalDays: interval }).subscribe({
      next: task => {
        this.equipment.update(list => list.map(e =>
          e.id === equipmentId ? { ...e, tasks: [...e.tasks, task] } : e
        ));
        this.taskDesc[equipmentId] = '';
        this.taskInterval[equipmentId] = 365;
      },
      error: () => this.error.set('Nie udało się dodać zadania.')
    });
  }

  completeTask(equipmentId: string, taskId: string) {
    this.svc.completeTask(equipmentId, taskId).subscribe({
      next: updated => {
        this.equipment.update(list => list.map(e =>
          e.id === equipmentId
            ? { ...e, tasks: e.tasks.map(t => t.id === taskId ? updated : t) }
            : e
        ));
      },
      error: () => this.error.set('Nie udało się oznaczyć zadania.')
    });
  }

  deleteTask(equipmentId: string, taskId: string) {
    this.svc.deleteTask(equipmentId, taskId).subscribe({
      next: () => {
        this.equipment.update(list => list.map(e =>
          e.id === equipmentId ? { ...e, tasks: e.tasks.filter(t => t.id !== taskId) } : e
        ));
      },
      error: () => this.error.set('Nie udało się usunąć zadania.')
    });
  }

  categoryIcon(cat: EquipmentCategory): string {
    const icons: Record<EquipmentCategory, string> = {
      Generator: 'bolt',
      Filter: 'water_drop',
      FireExtinguisher: 'fire_extinguisher',
      FirstAid: 'medical_services',
      Tools: 'construction',
      Vehicle: 'directions_car',
      Communication: 'radio',
      Other: 'devices_other',
    };
    return icons[cat] ?? 'devices_other';
  }
}
