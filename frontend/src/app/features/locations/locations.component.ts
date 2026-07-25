import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { LocationService } from '../../core/services/location.service';
import { StorageLocation } from '../../core/models/supply.model';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressBarModule,
    MatTooltipModule, MatDividerModule
  ],
  template: `
    <div class="loc-container">
      <div class="page-header">
        <h1>Miejsca przechowywania</h1>
      </div>

      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

      <!-- Add new location -->
      <mat-card class="add-card">
        <mat-card-header><mat-card-title>Nowe miejsce</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <mat-form-field appearance="outline" class="field-name">
              <mat-label>Nazwa</mat-label>
              <input matInput [(ngModel)]="newName" placeholder="np. Spiżarnia" (keyup.enter)="addLocation()" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="field-desc">
              <mat-label>Opis (opcjonalnie)</mat-label>
              <input matInput [(ngModel)]="newDesc" placeholder="np. Półka w kuchni" />
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="addLocation()" [disabled]="!newName.trim()">
              <mat-icon>add</mat-icon> Dodaj
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Location list -->
      <div class="loc-list">
        @for (loc of locations(); track loc.id) {
          <mat-card class="loc-card">
            @if (editingId() === loc.id) {
              <!-- Inline edit mode -->
              <mat-card-content class="edit-row">
                <mat-form-field appearance="outline" class="field-name">
                  <mat-label>Nazwa</mat-label>
                  <input matInput [(ngModel)]="editName" (keyup.enter)="saveEdit(loc.id)" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="field-desc">
                  <mat-label>Opis</mat-label>
                  <input matInput [(ngModel)]="editDesc" (keyup.enter)="saveEdit(loc.id)" />
                </mat-form-field>
                <div class="edit-actions">
                  <button mat-raised-button color="primary" (click)="saveEdit(loc.id)" [disabled]="!editName.trim()">Zapisz</button>
                  <button mat-button (click)="editingId.set(null)">Anuluj</button>
                </div>
              </mat-card-content>
            } @else {
              <!-- View mode -->
              <mat-card-content class="view-row">
                <div class="loc-info">
                  <span class="loc-name">
                    <mat-icon class="loc-icon">place</mat-icon>
                    {{ loc.name }}
                  </span>
                  @if (loc.description) {
                    <span class="loc-desc">{{ loc.description }}</span>
                  }
                </div>
                <div class="loc-actions">
                  <button mat-icon-button (click)="startEdit(loc)" matTooltip="Edytuj">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteLocation(loc)" matTooltip="Usuń">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </mat-card-content>
            }
          </mat-card>
        }

        @if (!loading() && locations().length === 0) {
          <div class="empty-state">
            <mat-icon>inventory_2</mat-icon>
            <p>Brak miejsc przechowywania. Dodaj pierwsze powyżej.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .loc-container { padding: 24px; max-width: 800px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; margin-bottom: 16px; }
    h1 { font-size: 1.75rem; margin: 0; }
    .add-card { margin-bottom: 24px; }
    .form-row { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .field-name { flex: 1; min-width: 180px; }
    .field-desc { flex: 2; min-width: 220px; }
    .loc-list { display: flex; flex-direction: column; gap: 8px; }
    .loc-card { }
    .view-row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0 !important; }
    .edit-row { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; padding: 8px 0 !important; }
    .loc-info { flex: 1; }
    .loc-name { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 1rem; }
    .loc-icon { font-size: 18px; height: 18px; width: 18px; color: #666; }
    .loc-desc { display: block; font-size: 0.85rem; color: #888; margin-top: 2px; margin-left: 24px; }
    .loc-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .edit-actions { display: flex; gap: 8px; align-items: center; padding-top: 8px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px 0; color: #888; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `]
})
export class LocationsComponent implements OnInit {
  private readonly svc = inject(LocationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly locations = signal<StorageLocation[]>([]);
  readonly loading = signal(false);
  readonly editingId = signal<string | null>(null);

  newName = '';
  newDesc = '';
  editName = '';
  editDesc = '';

  ngOnInit() { this.load(); }

  private load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: locs => { this.locations.set(locs); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  addLocation() {
    const name = this.newName.trim();
    if (!name) return;
    this.svc.create({ name, description: this.newDesc.trim() || null }).subscribe({
      next: loc => {
        this.locations.update(l => [...l, loc]);
        this.newName = '';
        this.newDesc = '';
        this.notify('Dodano miejsce');
      },
      error: () => this.notify('Błąd przy dodawaniu')
    });
  }

  startEdit(loc: StorageLocation) {
    this.editingId.set(loc.id);
    this.editName = loc.name;
    this.editDesc = loc.description ?? '';
  }

  saveEdit(id: string) {
    const name = this.editName.trim();
    if (!name) return;
    this.svc.update(id, { name, description: this.editDesc.trim() || null }).subscribe({
      next: updated => {
        this.locations.update(l => l.map(loc => loc.id === id ? updated : loc));
        this.editingId.set(null);
        this.notify('Zapisano');
      },
      error: () => this.notify('Błąd przy zapisywaniu')
    });
  }

  deleteLocation(loc: StorageLocation) {
    if (!confirm(`Usunąć "${loc.name}"? Zapasy przypisane do tego miejsca stracą lokalizację.`)) return;
    this.svc.delete(loc.id).subscribe({
      next: () => { this.locations.update(l => l.filter(x => x.id !== loc.id)); this.notify('Usunięto'); },
      error: () => this.notify('Błąd przy usuwaniu')
    });
  }

  private notify(msg: string) {
    this.snackBar.open(msg, 'OK', { duration: 3000 });
  }
}
