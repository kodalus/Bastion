import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupplyService } from '../../core/services/supply.service';
import { LocationService } from '../../core/services/location.service';
import { CATEGORY_LABELS, StorageLocation, SupplyCategory } from '../../core/models/supply.model';
import { CatalogSupplyItem, SUPPLY_CATALOG } from '../../core/data/supply-catalog.data';

interface CatalogRow extends CatalogSupplyItem {
  qty: number | null;
  price: number | null;
  locationId: string;
}

const CATEGORY_ORDER: SupplyCategory[] = ['Water', 'Food', 'Medical', 'Hygiene', 'Energy', 'Tools', 'Documents'];

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressBarModule, MatTooltipModule
  ],
  template: `
    <div class="catalog-container">
      <div class="page-header">
        <h1>Lista podstawowa zapasów</h1>
        <p class="subtitle">
          Wzorcowa lista do szybkiego zasiewu Zapasów. Wpisz stan posiadania (0 = wiesz że brakuje),
          puste wiersze są pomijane przy imporcie. Każda pozycja może trafić do innego miejsca.
        </p>
      </div>

      @if (saving()) { <mat-progress-bar mode="indeterminate" /> }

      <mat-card class="controls-card">
        <mat-card-content>
          <div class="controls-row">
            <div class="action-buttons">
              <button mat-button (click)="prefillSuggested()">
                <mat-icon>auto_fix_high</mat-icon> Sugerowane ilości
              </button>
              <button mat-button (click)="clearAll()">
                <mat-icon>clear_all</mat-icon> Wyczyść
              </button>
              <button mat-raised-button color="primary"
                      [disabled]="importCount === 0 || saving()"
                      (click)="importSelected()">
                <mat-icon>download</mat-icon>
                Importuj {{ importCount > 0 ? '(' + importCount + ')' : '' }}
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      @for (cat of categoryOrder; track cat) {
        <mat-card class="cat-card">
          <mat-card-header>
            <mat-card-title class="cat-title">
              <span [class]="'cat-dot cat-' + cat.toLowerCase()"></span>
              {{ catLabels[cat] }}
              <select class="cat-loc-select" [(ngModel)]="defaultLocationIds[cat]"
                      (ngModelChange)="applyDefaultLocation(cat, $event)">
                <option value="">— miejsce dla kategorii —</option>
                @for (loc of locations(); track loc.id) {
                  <option [value]="loc.id">{{ loc.name }}{{ loc.description ? ' – ' + loc.description : '' }}</option>
                }
              </select>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table class="cat-table">
              <thead>
                <tr>
                  <th class="col-name">Produkt</th>
                  <th class="col-unit">Jed.</th>
                  <th class="col-suggested">Sugerowana</th>
                  <th class="col-qty">Stan</th>
                  <th class="col-price">Cena/szt</th>
                  <th class="col-loc">Miejsce</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rowsByCategory[cat]; track row.name) {
                  <tr [class.has-value]="row.qty !== null">
                    <td class="col-name">{{ row.name }}<span class="unit-inline"> {{ row.unit }}</span></td>
                    <td class="col-unit">{{ row.unit }}</td>
                    <td class="col-suggested">{{ row.suggestedQty }}</td>
                    <td class="col-qty">
                      <input
                        type="number"
                        class="qty-input"
                        [(ngModel)]="row.qty"
                        placeholder="—"
                        min="0"
                        step="1"
                        [class.filled]="row.qty !== null"
                      />
                    </td>
                    <td class="col-price">
                      <input
                        type="number"
                        class="qty-input price-input"
                        [(ngModel)]="row.price"
                        (ngModelChange)="savePrice(row.name, $event)"
                        placeholder="—"
                        min="0"
                        step="0.01"
                        [class.filled]="row.price !== null"
                      />
                    </td>
                    <td class="col-loc">
                      <select class="loc-select" [(ngModel)]="row.locationId"
                              [class.no-loc]="!row.locationId">
                        <option value="">—</option>
                        @for (loc of locations(); track loc.id) {
                          <option [value]="loc.id">{{ loc.name }}{{ loc.description ? ' – ' + loc.description : '' }}</option>
                        }
                      </select>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </mat-card-content>
        </mat-card>
      }

      @if (importCount > 0 && rowsMissingLocation > 0) {
        <div class="missing-loc-hint">
          <mat-icon class="warn-icon">warning</mat-icon>
          {{ rowsMissingLocation }} {{ rowsMissingLocation === 1 ? 'pozycja bez miejsca' : 'pozycje bez miejsca' }}
          — zostaną pominięte przy imporcie.
        </div>
      }
    </div>
  `,
  styles: [`
    .catalog-container { padding: 24px; max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 16px; }
    h1 { font-size: 1.75rem; margin: 0 0 4px; }
    .subtitle { margin: 0 0 16px; color: #666; font-size: 0.9rem; }

    .controls-card { margin-bottom: 20px; }
    .controls-row { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .action-buttons { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding-top: 4px; }

    .cat-card { margin-bottom: 16px; }
    .cat-title { display: flex; align-items: center; gap: 8px; font-size: 1rem; flex-wrap: wrap; }
    .cat-loc-select {
      margin-left: auto; padding: 3px 6px; border: 1px solid #ccc; border-radius: 6px;
      font-size: 0.78rem; outline: none; background: white; cursor: pointer; color: #444;
      max-width: 220px;
    }
    .cat-loc-select:focus { border-color: #1976d2; }
    .cat-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
    .cat-dot.cat-water { background: #1565c0; }
    .cat-dot.cat-food { background: #2e7d32; }
    .cat-dot.cat-medical { background: #c62828; }
    .cat-dot.cat-hygiene { background: #6a1b9a; }
    .cat-dot.cat-energy { background: #e65100; }
    .cat-dot.cat-tools { background: #37474f; }
    .cat-dot.cat-documents { background: #795548; }

    .cat-table { width: 100%; border-collapse: collapse; }
    .cat-table th {
      text-align: left; font-size: 0.72rem; color: #888; font-weight: 600;
      padding: 4px 8px; border-bottom: 2px solid #eee;
    }
    .cat-table td { padding: 4px 8px; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
    .cat-table tr:last-child td { border-bottom: none; }
    .cat-table tr.has-value { background: #f0f7ff; }

    .col-name { width: 32%; }
    .col-unit { width: 6%; color: #666; font-size: 0.8rem; }
    .col-suggested { width: 8%; color: #888; font-size: 0.82rem; text-align: right; }
    .col-qty { width: 11%; }
    .col-price { width: 11%; }
    .col-loc { width: 32%; }
    .price-input { width: 80px; }

    .unit-inline { display: none; }

    .qty-input {
      width: 80px; padding: 4px 8px; border: 1px solid #ccc; border-radius: 6px;
      font-size: 0.9rem; text-align: right; outline: none;
      transition: border-color 0.2s;
    }
    .qty-input:focus { border-color: #1976d2; box-shadow: 0 0 0 2px rgba(25,118,210,0.15); }
    .qty-input.filled { border-color: #43a047; background: #f1f8e9; }
    .qty-input::placeholder { color: #bbb; text-align: center; }

    .loc-select {
      width: 100%; padding: 4px 6px; border: 1px solid #ccc; border-radius: 6px;
      font-size: 0.82rem; outline: none; background: white; cursor: pointer;
      transition: border-color 0.2s;
    }
    .loc-select:focus { border-color: #1976d2; }
    .loc-select.no-loc { border-color: #ccc; color: #aaa; }

    .missing-loc-hint {
      display: flex; align-items: center; gap: 6px;
      color: #e65100; font-size: 0.85rem; margin-top: 8px; padding: 0 4px;
    }
    .warn-icon { font-size: 18px; height: 18px; width: 18px; }

    @media (max-width: 640px) {
      .catalog-container { padding: 10px; }
      h1 { font-size: 1.2rem; }
      .subtitle { font-size: 0.8rem; }

      .cat-title { flex-direction: column; align-items: flex-start; gap: 6px; }
      .cat-loc-select { margin-left: 0; max-width: 100%; width: 100%; box-sizing: border-box; }

      .col-unit, .col-loc { display: none; }
      .col-name { width: auto; font-size: 0.88rem; }
      .col-suggested { font-size: 0.78rem; white-space: nowrap; }
      .col-qty { white-space: nowrap; }

      .unit-inline { display: inline; color: #888; font-size: 0.75rem; margin-left: 3px; }

      .qty-input { width: 60px; font-size: 0.85rem; padding: 3px 6px; }
      .cat-table th, .cat-table td { padding: 5px 4px; }
    }
  `]
})
export class CatalogComponent implements OnInit {
  private readonly supplySvc = inject(SupplyService);
  private readonly locationSvc = inject(LocationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly locations = signal<StorageLocation[]>([]);
  readonly saving = signal(false);

  readonly catLabels = CATEGORY_LABELS;
  readonly categoryOrder = CATEGORY_ORDER;

  defaultLocationIds: Partial<Record<SupplyCategory, string>> = {};

  rows: CatalogRow[] = SUPPLY_CATALOG.map(item => ({ ...item, qty: null, price: null, locationId: '' }));

  get importCount(): number {
    return this.rows.filter(r => r.qty !== null && r.locationId).length;
  }

  get rowsMissingLocation(): number {
    return this.rows.filter(r => r.qty !== null && !r.locationId).length;
  }

  get rowsByCategory(): Record<SupplyCategory, CatalogRow[]> {
    const map: Partial<Record<SupplyCategory, CatalogRow[]>> = {};
    for (const row of this.rows) {
      if (!map[row.category]) map[row.category] = [];
      map[row.category]!.push(row);
    }
    return map as Record<SupplyCategory, CatalogRow[]>;
  }

  private readonly PRICE_KEY = 'bastion:catalog:supply:prices';

  ngOnInit() {
    this.locationSvc.getAll().subscribe(locs => this.locations.set(locs));
    this.loadSavedPrices();
  }

  private loadSavedPrices() {
    try {
      const saved = localStorage.getItem(this.PRICE_KEY);
      if (!saved) return;
      const prices: Record<string, number | null> = JSON.parse(saved);
      for (const row of this.rows) {
        if (row.name in prices) row.price = prices[row.name];
      }
    } catch {}
  }

  savePrice(name: string, price: number | null) {
    try {
      const saved = localStorage.getItem(this.PRICE_KEY);
      const prices: Record<string, number | null> = saved ? JSON.parse(saved) : {};
      prices[name] = price;
      localStorage.setItem(this.PRICE_KEY, JSON.stringify(prices));
    } catch {}
  }

  applyDefaultLocation(cat: SupplyCategory, locId: string) {
    if (!locId) return;
    for (const row of this.rows) {
      if (row.category === cat) row.locationId = locId;
    }
  }

  prefillSuggested() {
    for (const row of this.rows) {
      if (row.qty === null) row.qty = row.suggestedQty;
    }
  }

  clearAll() {
    for (const row of this.rows) row.qty = null;
  }

  importSelected() {
    const candidates = this.rows.filter(r => r.qty !== null && r.locationId);
    if (candidates.length === 0) return;

    this.saving.set(true);
    this.supplySvc.getAll().subscribe(existing => {
      const existingNames = new Set(existing.map(e => e.name.toLowerCase()));
      const toImport = candidates.filter(r => !existingNames.has(r.name.toLowerCase()));
      const skipped = candidates.length - toImport.length;

      if (toImport.length === 0) {
        this.saving.set(false);
        this.snackBar.open(`Wszystkie wybrane pozycje już istnieją w zapasach (pominięto: ${skipped})`, 'OK', { duration: 5000 });
        return;
      }

      let done = 0;
      let errors = 0;

      for (const row of toImport) {
        this.supplySvc.create({
          name: row.name,
          category: row.category,
          quantity: row.qty ?? 0,
          unit: row.unit,
          storageLocationId: row.locationId,
          expiryDate: null,
          estimatedPricePerUnit: row.price,
          catalogItemName: row.name
        }).subscribe({
          next: () => {
            done++;
            if (done + errors === toImport.length) this.finish(done, errors, skipped);
          },
          error: () => {
            errors++;
            if (done + errors === toImport.length) this.finish(done, errors, skipped);
          }
        });
      }
    });
  }

  private finish(done: number, errors: number, skipped = 0) {
    this.saving.set(false);
    const skipMsg = skipped > 0 ? `, pominięto duplikatów: ${skipped}` : '';
    if (errors === 0) {
      this.snackBar.open(`Zaimportowano ${done} pozycji${skipMsg}`, 'OK', { duration: 4000 });
      this.clearAll();
    } else {
      this.snackBar.open(`Zaimportowano ${done}, błędy: ${errors}${skipMsg}`, 'OK', { duration: 5000 });
    }
  }
}
