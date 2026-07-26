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
import { findCatalogMatch } from '../../core/data/supply-catalog.data';

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
              <mat-option [value]="loc.id">
                {{ loc.name }}{{ loc.description ? ' – ' + loc.description : '' }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <!-- Mobile card list -->
      @if (isMobile) {
        @if (filteredItems().length === 0 && !loading()) {
          <div class="empty-state">Brak zapasów. Dodaj pierwszy wpis!</div>
        }
        @for (item of filteredItems(); track item.id) {
          <div class="supply-card" [class.card-expired]="item.isExpired" [class.card-expiring]="item.isExpiringSoon && !item.isExpired">
            <div class="card-top">
              <span class="card-name">{{ item.name }}</span>
              <div class="card-actions">
                <button mat-icon-button (click)="openEditDialog(item)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" (click)="deleteItem(item)"><mat-icon>delete</mat-icon></button>
              </div>
            </div>
            <div class="card-chip-row">
              <span [class]="'cat-chip cat-' + item.category.toLowerCase()">{{ categoryLabels[item.category] }}</span>
              @if (item.storageLocationName) {
                <span class="loc-chip"><mat-icon class="chip-icon">place</mat-icon>{{ item.storageLocationName }}</span>
              }
            </div>
            <div class="card-body">
              <div class="card-stat">
                <span class="stat-label">Stan</span>
                <span class="stat-value">{{ item.quantity }} {{ item.unit }}</span>
              </div>
              @if (suggestedFor(item); as s) {
                <div class="card-stat">
                  <span class="stat-label">Zalecana</span>
                  <span class="stat-value" [class.below-target]="item.quantity < s">{{ s }} {{ item.unit }}</span>
                </div>
              }
              @if (priceFor(item) != null) {
                <div class="card-stat">
                  <span class="stat-label">Cena/szt</span>
                  <span class="stat-value">{{ priceFor(item) | number:'1.2-2' }} zł</span>
                </div>
              }
              @if (item.expiryDate) {
                <div class="card-stat">
                  <span class="stat-label">Ważność</span>
                  <span class="stat-value" [class.expired]="item.isExpired" [class.expiring-soon]="item.isExpiringSoon && !item.isExpired">
                    {{ item.expiryDate | date:'dd.MM.yyyy' }}
                    @if (item.isExpired) { <mat-icon class="status-icon">warning</mat-icon> }
                    @else if (item.isExpiringSoon) { <mat-icon class="status-icon">schedule</mat-icon> }
                  </span>
                </div>
              }
            </div>
          </div>
        }
      } @else {
        <!-- Desktop table -->
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

          <ng-container matColumnDef="suggested">
            <th mat-header-cell *matHeaderCellDef>Zalecana</th>
            <td mat-cell *matCellDef="let item" class="suggested-cell">
              @if (suggestedFor(item); as s) {
                <span [class.below-target]="item.quantity < s" [matTooltip]="item.quantity < s ? 'Poniżej zalecanej ilości' : 'Osiągnięto zalecaną ilość'">
                  {{ s }} {{ item.unit }}
                </span>
              } @else {
                <span style="color:#bbb">—</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="location">
            <th mat-header-cell *matHeaderCellDef>Miejsce</th>
            <td mat-cell *matCellDef="let item">
              {{ item.storageLocationName }}{{ item.storageLocationDescription ? ' – ' + item.storageLocationDescription : '' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Cena/szt</th>
            <td mat-cell *matCellDef="let item">
              @if (priceFor(item) != null) {
                {{ priceFor(item) | number:'1.2-2' }} zł
              } @else {
                <span style="color:#bbb">—</span>
              }
            </td>
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
      }
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
    .suggested-cell { font-size: 0.85rem; color: #666; }
    .below-target { color: #e65100; font-weight: 500; }

    @media (max-width: 640px) {
      .inventory-container { padding: 10px; }
      h1 { font-size: 1.25rem; }
      .filters { gap: 8px; }
      .filter-field { min-width: 0; flex: 1; }
    }

    /* Mobile cards */
    .supply-card {
      background: #fff; border-radius: 10px; margin-bottom: 10px;
      padding: 12px 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      border-left: 4px solid #e0e0e0;
    }
    .card-expired { border-left-color: #c62828; background: #fff8f8; }
    .card-expiring { border-left-color: #e65100; background: #fff8f4; }
    .card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .card-name { font-size: 0.95rem; font-weight: 600; flex: 1; line-height: 1.3; padding-top: 4px; }
    .card-actions { display: flex; flex-shrink: 0; margin: -8px -8px 0 0; }
    .card-chip-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
    .cat-chip {
      font-size: 0.72rem; padding: 2px 8px; border-radius: 12px; font-weight: 500;
      background: #e3f2fd; color: #1565c0;
    }
    .cat-chip.cat-water { background: #e3f2fd; color: #1565c0; }
    .cat-chip.cat-food { background: #e8f5e9; color: #2e7d32; }
    .cat-chip.cat-medical { background: #ffebee; color: #c62828; }
    .cat-chip.cat-hygiene { background: #f3e5f5; color: #6a1b9a; }
    .cat-chip.cat-energy { background: #fff3e0; color: #e65100; }
    .cat-chip.cat-tools { background: #eceff1; color: #37474f; }
    .cat-chip.cat-documents { background: #efebe9; color: #795548; }
    .loc-chip { font-size: 0.72rem; color: #555; display: flex; align-items: center; gap: 2px; }
    .chip-icon { font-size: 13px; height: 13px; width: 13px; }
    .card-body { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin-top: 4px; }
    .card-stat { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.68rem; color: #999; text-transform: uppercase; letter-spacing: 0.03em; }
    .stat-value { font-size: 0.88rem; font-weight: 500; }
    .empty-state { text-align: center; padding: 48px 16px; color: #9e9e9e; }
  `]
})
export class InventoryComponent implements OnInit {
  private readonly supplyService = inject(SupplyService);
  private readonly locationService = inject(LocationService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly isMobile = window.innerWidth <= 640;
  readonly categoryLabels: { [key: string]: string } = CATEGORY_LABELS;
  readonly allCategories = Object.keys(CATEGORY_LABELS) as SupplyCategory[];
  readonly columns = ['name', 'category', 'quantity', 'suggested', 'location', 'price', 'expiryDate', 'actions'];
  private catalogPrices: Record<string, number | null> = {};

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
    try {
      const saved = localStorage.getItem('bastion:catalog:supply:prices');
      if (saved) this.catalogPrices = JSON.parse(saved);
    } catch {}
  }

  priceFor(item: SupplyItem): number | null {
    return item.estimatedPricePerUnit ?? this.catalogPrices[item.name] ?? null;
  }

  suggestedFor(item: SupplyItem): number | null {
    const key = item.catalogItemName ?? item.name;
    return findCatalogMatch(key)?.suggestedQty ?? null;
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

  private dialogConfig() {
    const mobile = window.innerWidth <= 640;
    return mobile ? { width: '95vw', maxWidth: '95vw', maxHeight: '90vh' } : { minWidth: '480px', maxHeight: '90vh' };
  }

  openAddDialog() {
    this.dialog.open(SupplyFormDialogComponent, {
      ...this.dialogConfig(),
      data: { locations: this.locations() }
    }).afterClosed().subscribe(request => {
      this.reloadLocations();
      if (!request) return;
      this.supplyService.create(request).subscribe({ next: () => { this.load(); this.notify('Dodano zapas'); } });
    });
  }

  openEditDialog(item: SupplyItem) {
    this.dialog.open(SupplyFormDialogComponent, {
      ...this.dialogConfig(),
      data: { item, locations: this.locations() }
    }).afterClosed().subscribe(request => {
      this.reloadLocations();
      if (!request) return;
      this.supplyService.update(item.id, request).subscribe({ next: () => { this.load(); this.notify('Zapisano zmiany'); } });
    });
  }

  deleteItem(item: SupplyItem) {
    if (!confirm(`Usunąć "${item.name}"?`)) return;
    this.supplyService.delete(item.id).subscribe({ next: () => { this.load(); this.notify('Usunięto'); } });
  }

  private reloadLocations() {
    this.locationService.getAll().subscribe(locs => this.locations.set(locs));
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
