import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SupplyService } from '../../core/services/supply.service';
import { LocationService } from '../../core/services/location.service';
import { CATEGORY_LABELS, StorageLocation, SupplyCategory, SupplyItem } from '../../core/models/supply.model';
import { SupplyFormDialogComponent } from './supply-form-dialog/supply-form-dialog.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatTooltipModule, MatProgressBarModule
  ],
  template: `
    <div class="inventory-container">
      <div class="header">
        <h1>Zapasy</h1>
        <button mat-flat-button color="primary" (click)="openAddDialog()">
          <mat-icon>add</mat-icon> Dodaj zapas
        </button>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Kategoria</mat-label>
          <mat-select [(ngModel)]="selectedCategory" (ngModelChange)="applyFilters()">
            <mat-option value="">Wszystkie</mat-option>
            @for (cat of allCategories; track cat) {
              <mat-option [value]="cat">{{ categoryLabels[cat] }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Miejsce</mat-label>
          <mat-select [(ngModel)]="selectedLocation" (ngModelChange)="applyFilters()">
            <mat-option value="">Wszystkie</mat-option>
            @for (loc of locations(); track loc.id) {
              <mat-option [value]="loc.id">{{ loc.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <table mat-table [dataSource]="filteredItems()" matSort (matSortChange)="onSort($event)" class="supply-table">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Nazwa</th>
          <td mat-cell *matCellDef="let item">{{ item.name }}</td>
        </ng-container>

        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef>Kategoria</th>
          <td mat-cell *matCellDef="let item">
            <mat-chip [class]="'cat-' + item.category.toLowerCase()">
              {{ categoryLabels[item.category] }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="quantity">
          <th mat-header-cell *matHeaderCellDef>Ilość</th>
          <td mat-cell *matCellDef="let item">{{ item.quantity }} {{ item.unit }}</td>
        </ng-container>

        <ng-container matColumnDef="location">
          <th mat-header-cell *matHeaderCellDef>Miejsce</th>
          <td mat-cell *matCellDef="let item">{{ item.storageLocationName }}</td>
        </ng-container>

        <ng-container matColumnDef="expiryDate">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Data ważności</th>
          <td mat-cell *matCellDef="let item">
            @if (item.expiryDate) {
              <span [class.expired]="item.isExpired" [class.expiring-soon]="item.isExpiringSoon && !item.isExpired">
                {{ item.expiryDate | date:'dd.MM.yyyy' }}
                @if (item.isExpired) { <mat-icon class="status-icon" matTooltip="Przeterminowane">warning</mat-icon> }
                @else if (item.isExpiringSoon) { <mat-icon class="status-icon" matTooltip="Kończy się wkrótce">schedule</mat-icon> }
              </span>
            } @else {
              <span class="no-expiry">—</span>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let item">
            <button mat-icon-button (click)="openEditDialog(item)" matTooltip="Edytuj">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteItem(item)" matTooltip="Usuń">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>

        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell empty-state" [colSpan]="columns.length">
            Brak zapasów. Dodaj pierwszy wpis!
          </td>
        </tr>
      </table>
    </div>
  `,
  styles: [`
    .inventory-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    h1 { margin: 0; font-size: 1.75rem; }
    .filters { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .filter-field { min-width: 200px; }
    .supply-table { width: 100%; }
    .expired { color: #c62828; font-weight: 500; }
    .expiring-soon { color: #e65100; font-weight: 500; }
    .no-expiry { color: #9e9e9e; }
    .status-icon { font-size: 16px; height: 16px; width: 16px; vertical-align: middle; margin-left: 4px; }
    .empty-state { text-align: center; padding: 48px; color: #9e9e9e; }
    td, th { padding: 8px 16px; }
  `]
})
export class InventoryComponent implements OnInit {
  private readonly supplyService = inject(SupplyService);
  private readonly locationService = inject(LocationService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly categoryLabels: { [key: string]: string } = CATEGORY_LABELS;
  readonly allCategories = Object.keys(CATEGORY_LABELS) as SupplyCategory[];
  readonly columns = ['name', 'category', 'quantity', 'location', 'expiryDate', 'actions'];

  private readonly allItems = signal<SupplyItem[]>([]);
  readonly locations = signal<StorageLocation[]>([]);
  readonly loading = signal(false);

  selectedCategory = '';
  selectedLocation = '';
  private sortActive = 'expiryDate';
  private sortDir: 'asc' | 'desc' = 'asc';

  readonly filteredItems = computed(() => {
    let items = this.allItems();
    if (this.selectedCategory) items = items.filter(i => i.category === this.selectedCategory);
    if (this.selectedLocation) items = items.filter(i => i.storageLocationId === this.selectedLocation);
    return this.sort(items);
  });

  ngOnInit() {
    this.load();
    this.locationService.getAll().subscribe(locs => this.locations.set(locs));
  }

  applyFilters() {
    // Force computed() to re-evaluate — selectedCategory/selectedLocation are plain fields,
    // so we nudge the tracked signal to propagate the change.
    this.allItems.update(items => [...items]);
  }

  onSort(sort: Sort) {
    this.sortActive = sort.active;
    this.sortDir = sort.direction as 'asc' | 'desc' || 'asc';
    this.allItems.update(items => [...items]);
  }

  openAddDialog() {
    this.dialog.open(SupplyFormDialogComponent, {
      data: { locations: this.locations() }
    }).afterClosed().subscribe(request => {
      if (!request) return;
      this.supplyService.create(request).subscribe({ next: () => { this.load(); this.notify('Dodano zapas'); } });
    });
  }

  openEditDialog(item: SupplyItem) {
    this.dialog.open(SupplyFormDialogComponent, {
      data: { item, locations: this.locations() }
    }).afterClosed().subscribe(request => {
      if (!request) return;
      this.supplyService.update(item.id, request).subscribe({ next: () => { this.load(); this.notify('Zapisano zmiany'); } });
    });
  }

  deleteItem(item: SupplyItem) {
    if (!confirm(`Usunąć "${item.name}"?`)) return;
    this.supplyService.delete(item.id).subscribe({ next: () => { this.load(); this.notify('Usunięto'); } });
  }

  private load() {
    this.loading.set(true);
    this.supplyService.getAll().subscribe({
      next: items => { this.allItems.set(items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  private sort(items: SupplyItem[]): SupplyItem[] {
    if (!this.sortActive) return items;
    return [...items].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[this.sortActive];
      const bVal = (b as unknown as Record<string, unknown>)[this.sortActive];
      const cmp = (aVal == null ? '' : String(aVal)).localeCompare(bVal == null ? '' : String(bVal));
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }

  private notify(msg: string) {
    this.snackBar.open(msg, 'OK', { duration: 3000 });
  }
}
