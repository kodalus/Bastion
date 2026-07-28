import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EquipmentService } from '../../core/services/equipment.service';
import { EQUIPMENT_CATEGORY_LABELS, EquipmentCategory } from '../../core/models/equipment.model';
import { db, EquipmentCatalogRecord } from '../../core/db/bastion-db';

const CATEGORY_ORDER: EquipmentCategory[] = [
  'FireExtinguisher', 'FirstAid', 'Generator', 'Communication', 'Filter', 'Tools', 'Vehicle', 'Other'
];

@Component({
  selector: 'app-equipment-catalog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressBarModule, MatTooltipModule
  ],
  template: `
    <div class="catalog-container">
      <div class="page-header">
        <h1>Katalog sprzętu</h1>
        <p class="subtitle">
          Zalecany sprzęt kryzysowy. Zielony znacznik oznacza pozycję już w Twoim wykazie sprzętów.
          Ceny są zapisywane lokalnie w przeglądarce (IndexedDB).
        </p>
      </div>

      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

      <div class="summary-bar">
        <span class="have">{{ haveCount() }} / {{ catalog.length }} masz</span>
        @if (missingCount() > 0) {
          <span class="missing">{{ missingCount() }} do uzupełnienia</span>
        } @else {
          <span class="all-good"><mat-icon class="ok-icon">check_circle</mat-icon> Komplet!</span>
        }
      </div>

      @for (cat of categoryOrder; track cat) {
        <mat-card class="cat-card">
          <mat-card-header>
            <mat-card-title class="cat-title">
              <span [class]="'cat-dot cat-' + cat.toLowerCase()"></span>
              {{ catLabels[cat] }}
              <span class="cat-count">
                {{ haveInCategory(cat) }}/{{ countInCategory(cat) }}
              </span>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="item-list">
              @for (item of itemsByCategory[cat]; track item.name) {
                <div class="catalog-item" [class.have]="owns(item.name)">
                  <div class="item-info">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-hint">{{ item.hint }}</span>
                  </div>
                  <div class="item-price">
                    <input
                      type="number"
                      class="price-input"
                      [ngModel]="item.price ?? null"
                      (ngModelChange)="savePrice(item.name, $event)"
                      placeholder="cena zł"
                      min="0"
                      step="0.01"
                      [class.filled]="item.price != null"
                    />
                  </div>
                  <div class="item-status">
                    @if (owns(item.name)) {
                      <mat-chip class="chip-have">
                        <mat-icon>check</mat-icon> Masz
                      </mat-chip>
                    } @else {
                      <button mat-stroked-button color="primary"
                              [disabled]="adding()[item.name]"
                              (click)="add(item)"
                              matTooltip="Dodaj do sprzętu">
                        @if (adding()[item.name]) {
                          <mat-icon>hourglass_empty</mat-icon>
                        } @else {
                          <mat-icon>add</mat-icon>
                        }
                        Dodaj
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .catalog-container { padding: 24px; max-width: 900px; margin: 0 auto; }
    .page-header { margin-bottom: 16px; }
    h1 { font-size: 1.75rem; margin: 0 0 4px; }
    .subtitle { margin: 0 0 16px; color: #666; font-size: 0.9rem; }

    .summary-bar {
      display: flex; align-items: center; gap: 16px;
      margin-bottom: 20px; font-size: 0.95rem;
    }
    .have { color: #2e7d32; font-weight: 600; }
    .missing { color: #e65100; font-weight: 600; }
    .all-good { color: #2e7d32; font-weight: 600; display: flex; align-items: center; gap: 4px; }
    .ok-icon { font-size: 18px; height: 18px; width: 18px; }

    .cat-card { margin-bottom: 16px; }
    .cat-title { display: flex; align-items: center; gap: 8px; font-size: 1rem; }
    .cat-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
    .cat-dot.cat-fireextinguisher { background: #c62828; }
    .cat-dot.cat-firstaid       { background: #e53935; }
    .cat-dot.cat-generator      { background: #e65100; }
    .cat-dot.cat-communication  { background: #1565c0; }
    .cat-dot.cat-filter         { background: #00838f; }
    .cat-dot.cat-tools          { background: #37474f; }
    .cat-dot.cat-vehicle        { background: #4527a0; }
    .cat-dot.cat-other          { background: #558b2f; }
    .cat-count { margin-left: auto; font-size: 0.8rem; color: #888; font-weight: 400; }

    .item-list { display: flex; flex-direction: column; gap: 4px; }
    .catalog-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 8px; border: 1px solid #eee;
      transition: background 0.15s;
    }
    .catalog-item.have { background: #f1f8e9; border-color: #c8e6c9; }
    .item-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .item-name { font-size: 0.92rem; font-weight: 500; }
    .item-hint { font-size: 0.78rem; color: #888; }
    .item-price { flex-shrink: 0; }
    .item-status { flex-shrink: 0; }

    .price-input {
      width: 90px; padding: 4px 8px; border: 1px solid #ccc; border-radius: 6px;
      font-size: 0.82rem; text-align: right; outline: none; background: white;
      transition: border-color 0.2s;
    }
    .price-input:focus { border-color: #1976d2; box-shadow: 0 0 0 2px rgba(25,118,210,0.15); }
    .price-input.filled { border-color: #43a047; background: #f1f8e9; }
    .price-input::placeholder { color: #bbb; font-size: 0.75rem; }

    .chip-have {
      background: #e8f5e9 !important; color: #2e7d32 !important;
      font-size: 0.78rem; height: 28px;
    }
    .chip-have mat-icon { font-size: 14px; height: 14px; width: 14px; margin-right: 2px; }
    button mat-icon { font-size: 16px; height: 16px; width: 16px; margin-right: 2px; }
  `]
})
export class EquipmentCatalogComponent implements OnInit {
  private readonly equipmentSvc = inject(EquipmentService);
  private readonly snackBar = inject(MatSnackBar);

  readonly catLabels = EQUIPMENT_CATEGORY_LABELS;
  readonly categoryOrder = CATEGORY_ORDER;

  readonly loading = signal(false);
  private readonly ownedNames = signal<Set<string>>(new Set());
  readonly adding = signal<Record<string, boolean>>({});

  catalog: EquipmentCatalogRecord[] = [];

  readonly haveCount = () => this.catalog.filter(i => this.ownedNames().has(i.name.toLowerCase())).length;
  readonly missingCount = () => this.catalog.length - this.haveCount();

  get itemsByCategory(): Record<EquipmentCategory, EquipmentCatalogRecord[]> {
    const map: Partial<Record<EquipmentCategory, EquipmentCatalogRecord[]>> = {};
    for (const item of this.catalog) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category]!.push(item);
    }
    return map as Record<EquipmentCategory, EquipmentCatalogRecord[]>;
  }

  owns(name: string): boolean {
    return this.ownedNames().has(name.toLowerCase());
  }

  haveInCategory(cat: EquipmentCategory): number {
    return (this.itemsByCategory[cat] ?? []).filter(i => this.owns(i.name)).length;
  }

  countInCategory(cat: EquipmentCategory): number {
    return (this.itemsByCategory[cat] ?? []).length;
  }

  async ngOnInit() {
    this.catalog = await db.equipmentCatalog.orderBy('category').toArray();
    this.loadEquipment();
  }

  async savePrice(name: string, price: number | null) {
    await db.equipmentCatalog.update(name, { price });
    const idx = this.catalog.findIndex(c => c.name === name);
    if (idx !== -1) this.catalog[idx] = { ...this.catalog[idx], price };
  }

  add(item: EquipmentCatalogRecord) {
    this.adding.update(s => ({ ...s, [item.name]: true }));
    const today = new Date().toISOString().split('T')[0];
    this.equipmentSvc.create({ name: item.name, category: item.category, purchaseDate: today })
      .subscribe({
        next: () => {
          this.adding.update(s => ({ ...s, [item.name]: false }));
          this.snackBar.open(`Dodano: ${item.name}`, 'OK', { duration: 3000 });
          this.loadEquipment();
        },
        error: () => {
          this.adding.update(s => ({ ...s, [item.name]: false }));
          this.snackBar.open('Błąd podczas dodawania', 'OK', { duration: 3000 });
        }
      });
  }

  private loadEquipment() {
    this.loading.set(true);
    this.equipmentSvc.getAll().subscribe({
      next: items => {
        this.ownedNames.set(new Set(items.map(e => e.name.toLowerCase())));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
