import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
import { MatChipsModule } from '@angular/material/chips';
import { SupplyService } from '../../core/services/supply.service';
import { LocationService } from '../../core/services/location.service';
import { CATEGORY_LABELS, StorageLocation, SupplyCategory } from '../../core/models/supply.model';

interface CatalogItem {
  name: string;
  category: SupplyCategory;
  unit: string;
  suggestedQty: number;
}

interface CatalogRow extends CatalogItem {
  qtyStr: string; // empty = skip, '0' or positive = import
}

const CATALOG: CatalogItem[] = [
  // Woda
  { name: 'Woda mineralna', category: 'Water', unit: 'L', suggestedQty: 42 },
  { name: 'Tabletki do uzdatniania wody', category: 'Water', unit: 'szt', suggestedQty: 50 },
  { name: 'Filtr do wody (Brita/BWT)', category: 'Water', unit: 'szt', suggestedQty: 1 },
  // Żywność
  { name: 'Konserwy mięsne', category: 'Food', unit: 'szt', suggestedQty: 20 },
  { name: 'Konserwy rybne', category: 'Food', unit: 'szt', suggestedQty: 10 },
  { name: 'Makaron', category: 'Food', unit: 'kg', suggestedQty: 5 },
  { name: 'Ryż', category: 'Food', unit: 'kg', suggestedQty: 5 },
  { name: 'Kasza gryczana', category: 'Food', unit: 'kg', suggestedQty: 3 },
  { name: 'Mąka pszenna', category: 'Food', unit: 'kg', suggestedQty: 3 },
  { name: 'Cukier', category: 'Food', unit: 'kg', suggestedQty: 2 },
  { name: 'Sól', category: 'Food', unit: 'kg', suggestedQty: 1 },
  { name: 'Olej roślinny', category: 'Food', unit: 'L', suggestedQty: 2 },
  { name: 'Miód', category: 'Food', unit: 'kg', suggestedQty: 1 },
  { name: 'Herbata', category: 'Food', unit: 'op', suggestedQty: 3 },
  { name: 'Orzechy i suszone owoce', category: 'Food', unit: 'kg', suggestedQty: 1 },
  { name: 'Dżem / marmolada', category: 'Food', unit: 'szt', suggestedQty: 4 },
  // Medyczne
  { name: 'Bandaże elastyczne', category: 'Medical', unit: 'szt', suggestedQty: 4 },
  { name: 'Gaza jałowa', category: 'Medical', unit: 'szt', suggestedQty: 10 },
  { name: 'Plastry (zestaw)', category: 'Medical', unit: 'op', suggestedQty: 2 },
  { name: 'Środek odkażający (Octenisept)', category: 'Medical', unit: 'szt', suggestedQty: 1 },
  { name: 'Ibuprofen / Paracetamol', category: 'Medical', unit: 'op', suggestedQty: 2 },
  { name: 'Rękawice jednorazowe', category: 'Medical', unit: 'par', suggestedQty: 20 },
  { name: 'Termometr', category: 'Medical', unit: 'szt', suggestedQty: 1 },
  // Higiena
  { name: 'Papier toaletowy', category: 'Hygiene', unit: 'rolki', suggestedQty: 40 },
  { name: 'Mydło', category: 'Hygiene', unit: 'szt', suggestedQty: 6 },
  { name: 'Pasta do zębów', category: 'Hygiene', unit: 'szt', suggestedQty: 3 },
  { name: 'Żel / płyn dezynfekujący do rąk', category: 'Hygiene', unit: 'szt', suggestedQty: 2 },
  { name: 'Mokre chusteczki', category: 'Hygiene', unit: 'op', suggestedQty: 5 },
  // Energia
  { name: 'Świece', category: 'Energy', unit: 'szt', suggestedQty: 10 },
  { name: 'Zapałki', category: 'Energy', unit: 'szt', suggestedQty: 5 },
  { name: 'Latarka LED', category: 'Energy', unit: 'szt', suggestedQty: 2 },
  { name: 'Baterie AA', category: 'Energy', unit: 'szt', suggestedQty: 12 },
  { name: 'Powerbank', category: 'Energy', unit: 'szt', suggestedQty: 1 },
  // Narzędzia
  { name: 'Nóż wielofunkcyjny', category: 'Tools', unit: 'szt', suggestedQty: 1 },
  { name: 'Lina (10 m)', category: 'Tools', unit: 'szt', suggestedQty: 1 },
  { name: 'Taśma klejąca / duct tape', category: 'Tools', unit: 'szt', suggestedQty: 2 },
  { name: 'Radio na baterie', category: 'Tools', unit: 'szt', suggestedQty: 1 },
  // Dokumenty
  { name: 'Kopie dokumentów (wodoszczelne opakowanie)', category: 'Documents', unit: 'kpl', suggestedQty: 1 },
  { name: 'Gotówka awaryjna', category: 'Documents', unit: 'kpl', suggestedQty: 1 },
];

const CATEGORY_ORDER: SupplyCategory[] = ['Water', 'Food', 'Medical', 'Hygiene', 'Energy', 'Tools', 'Documents'];

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressBarModule, MatTooltipModule, MatChipsModule
  ],
  template: `
    <div class="catalog-container">
      <div class="page-header">
        <div>
          <h1>Lista podstawowa zapasów</h1>
          <p class="subtitle">
            Wzorcowa lista według norm obrony cywilnej. Wypełnij stany posiadania (0 = masz świadomość, ale nie masz na stanie).
            Puste pola są pomijane przy imporcie.
          </p>
        </div>
      </div>

      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

      <!-- Global controls -->
      <mat-card class="controls-card">
        <mat-card-content>
          <div class="controls-row">
            <mat-form-field appearance="outline" class="loc-field">
              <mat-label>Domyślne miejsce przechowywania</mat-label>
              <mat-select [(ngModel)]="selectedLocationId">
                @for (loc of locations(); track loc.id) {
                  <mat-option [value]="loc.id">{{ loc.name }}</mat-option>
                }
              </mat-select>
              <mat-hint>Zostanie przypisane do wszystkich importowanych pozycji</mat-hint>
            </mat-form-field>

            <div class="action-buttons">
              <button mat-button (click)="prefillSuggested()">
                <mat-icon>auto_fix_high</mat-icon> Wypełnij sugerowane ilości
              </button>
              <button mat-button (click)="clearAll()">
                <mat-icon>clear_all</mat-icon> Wyczyść
              </button>
              <button mat-raised-button color="primary"
                      [disabled]="importCount() === 0 || !selectedLocationId || saving()"
                      (click)="importSelected()">
                <mat-icon>download</mat-icon>
                Importuj {{ importCount() > 0 ? '(' + importCount() + ')' : '' }}
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Category sections -->
      @for (cat of categoryOrder; track cat) {
        <mat-card class="cat-card">
          <mat-card-header>
            <mat-card-title class="cat-title">
              <span [class]="'cat-dot cat-' + cat.toLowerCase()"></span>
              {{ catLabels[cat] }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table class="cat-table">
              <thead>
                <tr>
                  <th class="col-name">Produkt</th>
                  <th class="col-unit">Jednostka</th>
                  <th class="col-suggested">Sugerowana ilość</th>
                  <th class="col-qty">Stan posiadania</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rowsByCategory()[cat]; track row.name) {
                  <tr [class.has-value]="row.qtyStr !== ''">
                    <td class="col-name">{{ row.name }}</td>
                    <td class="col-unit">{{ row.unit }}</td>
                    <td class="col-suggested">{{ row.suggestedQty }} {{ row.unit }}</td>
                    <td class="col-qty">
                      <input
                        type="number"
                        class="qty-input"
                        [(ngModel)]="row.qtyStr"
                        placeholder="—"
                        min="0"
                        step="1"
                        [class.filled]="row.qtyStr !== ''"
                      />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .catalog-container { padding: 24px; max-width: 900px; margin: 0 auto; }
    .page-header { margin-bottom: 16px; }
    h1 { font-size: 1.75rem; margin: 0 0 4px; }
    .subtitle { margin: 0; color: #666; font-size: 0.9rem; }

    .controls-card { margin-bottom: 20px; }
    .controls-row { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .loc-field { flex: 1; min-width: 260px; }
    .action-buttons { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding-top: 4px; }

    .cat-card { margin-bottom: 16px; }
    .cat-title { display: flex; align-items: center; gap: 8px; font-size: 1rem; }
    .cat-dot {
      width: 12px; height: 12px; border-radius: 50%; display: inline-block; flex-shrink: 0;
    }
    .cat-dot.cat-water { background: #1565c0; }
    .cat-dot.cat-food { background: #2e7d32; }
    .cat-dot.cat-medical { background: #c62828; }
    .cat-dot.cat-hygiene { background: #6a1b9a; }
    .cat-dot.cat-energy { background: #e65100; }
    .cat-dot.cat-tools { background: #37474f; }
    .cat-dot.cat-documents { background: #795548; }

    .cat-table { width: 100%; border-collapse: collapse; }
    .cat-table th {
      text-align: left; font-size: 0.75rem; color: #888; font-weight: 600;
      padding: 6px 8px; border-bottom: 2px solid #eee;
    }
    .cat-table td { padding: 6px 8px; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
    .cat-table tr:last-child td { border-bottom: none; }
    .cat-table tr.has-value { background: #f0f7ff; }

    .col-name { width: 45%; }
    .col-unit { width: 12%; color: #666; }
    .col-suggested { width: 20%; color: #888; font-size: 0.85rem; }
    .col-qty { width: 23%; }

    .qty-input {
      width: 90px; padding: 6px 10px; border: 1px solid #ccc; border-radius: 6px;
      font-size: 0.95rem; text-align: right; outline: none;
      transition: border-color 0.2s;
    }
    .qty-input:focus { border-color: #1976d2; box-shadow: 0 0 0 2px rgba(25,118,210,0.15); }
    .qty-input.filled { border-color: #43a047; background: #f1f8e9; }
    .qty-input::placeholder { color: #bbb; text-align: center; }
  `]
})
export class CatalogComponent implements OnInit {
  private readonly supplySvc = inject(SupplyService);
  private readonly locationSvc = inject(LocationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly locations = signal<StorageLocation[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly catLabels = CATEGORY_LABELS;
  readonly categoryOrder = CATEGORY_ORDER;

  selectedLocationId = '';

  readonly rows = signal<CatalogRow[]>(
    CATALOG.map(item => ({ ...item, qtyStr: '' }))
  );

  readonly rowsByCategory = computed(() => {
    const map: Partial<Record<SupplyCategory, CatalogRow[]>> = {};
    for (const row of this.rows()) {
      if (!map[row.category]) map[row.category] = [];
      map[row.category]!.push(row);
    }
    return map as Record<SupplyCategory, CatalogRow[]>;
  });

  readonly importCount = computed(() =>
    this.rows().filter(r => r.qtyStr !== '').length
  );

  ngOnInit() {
    this.locationSvc.getAll().subscribe(locs => {
      this.locations.set(locs);
      if (locs.length > 0 && !this.selectedLocationId) {
        this.selectedLocationId = locs[0].id;
      }
    });
  }

  prefillSuggested() {
    this.rows.update(rows => rows.map(r => ({
      ...r,
      qtyStr: r.qtyStr === '' ? String(r.suggestedQty) : r.qtyStr
    })));
  }

  clearAll() {
    this.rows.update(rows => rows.map(r => ({ ...r, qtyStr: '' })));
  }

  importSelected() {
    if (!this.selectedLocationId) return;
    const toImport = this.rows().filter(r => r.qtyStr !== '');
    if (toImport.length === 0) return;

    this.saving.set(true);
    let done = 0;
    let errors = 0;

    for (const row of toImport) {
      const qty = parseFloat(row.qtyStr);
      this.supplySvc.create({
        name: row.name,
        category: row.category,
        quantity: isNaN(qty) ? 0 : qty,
        unit: row.unit,
        storageLocationId: this.selectedLocationId,
        expiryDate: null,
        estimatedPricePerUnit: null
      }).subscribe({
        next: () => {
          done++;
          if (done + errors === toImport.length) this.finish(done, errors);
        },
        error: () => {
          errors++;
          if (done + errors === toImport.length) this.finish(done, errors);
        }
      });
    }
  }

  private finish(done: number, errors: number) {
    this.saving.set(false);
    if (errors === 0) {
      this.snackBar.open(`Zaimportowano ${done} pozycji`, 'OK', { duration: 4000 });
      this.clearAll();
    } else {
      this.snackBar.open(`Zaimportowano ${done}, błędy: ${errors}`, 'OK', { duration: 5000 });
    }
  }
}
