import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard.service';
import { SupplyService } from '../../core/services/supply.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { ReadinessResult, ShoppingListItem, ShoppingPriority } from '../../core/models/dashboard.model';
import { CATEGORY_LABELS, SupplyCategory } from '../../core/models/supply.model';
import { EQUIPMENT_CATEGORY_LABELS, EquipmentCategory } from '../../core/models/equipment.model';
import { findCatalogMatch, SUPPLY_CATALOG } from '../../core/data/supply-catalog.data';
import { CatalogEquipmentItem, EQUIPMENT_CATALOG } from '../../core/data/equipment-catalog.data';

const PRIORITY_LABELS: Record<ShoppingPriority, string> = {
  High: 'Pilne',
  Medium: 'Ważne',
  Low: 'Niskie',
};

interface SupplyBuyItem {
  name: string;
  category: SupplyCategory;
  unit: string;
  reason: 'zero' | 'missing';
  suggestedQty: number | null;
  price: number | null;
  totalCost: number | null;
}

interface EquipBuyItem extends CatalogEquipmentItem {
  price: number | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, RouterLink,
    MatCardModule, MatProgressBarModule, MatTableModule,
    MatChipsModule, MatIconModule, MatButtonModule, MatDividerModule
  ],
  template: `
    <div class="dashboard-container">
      <h1>Dashboard gotowości</h1>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (result(); as r) {
        <!-- Score cards -->
        <div class="score-row">
          <mat-card class="score-card" [class]="scoreClass(r.overallScore)">
            <mat-card-content>
              <div class="score-label">Ogólna gotowość</div>
              <div class="score-value">{{ r.overallScore }}<span class="score-pct">%</span></div>
              <div class="score-sub">{{ r.memberCount }} os. · {{ scoreDescription(r.overallScore) }}</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="score-card" [class]="scoreClass(r.equipmentScore)">
            <mat-card-content>
              <div class="score-label">Sprzęt i ТО</div>
              <div class="score-value">{{ r.equipmentScore }}<span class="score-pct">%</span></div>
              <div class="score-sub">
                @if (r.overdueTasks.length > 0) {
                  {{ r.overdueTasks.length }} zadań przeterminowanych
                } @else {
                  Wszystko na bieżąco
                }
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="score-card" [class]="scoreClass(equipCatalogScore())">
            <mat-card-content>
              <div class="score-label">Katalog sprzętu</div>
              <div class="score-value">{{ equipCatalogScore() }}<span class="score-pct">%</span></div>
              <div class="score-sub">
                {{ equipCatalogHave() }} / {{ equipCatalogTotal }} pozycji
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Overdue maintenance tasks -->
        @if (r.overdueTasks.length > 0) {
          <h2>Przeterminowane przeglądy</h2>
          <table mat-table [dataSource]="r.overdueTasks" class="shop-table">
            <ng-container matColumnDef="equipment">
              <th mat-header-cell *matHeaderCellDef>Sprzęt</th>
              <td mat-cell *matCellDef="let t">{{ t.equipmentName }}</td>
            </ng-container>
            <ng-container matColumnDef="task">
              <th mat-header-cell *matHeaderCellDef>Zadanie</th>
              <td mat-cell *matCellDef="let t">{{ t.taskDescription }}</td>
            </ng-container>
            <ng-container matColumnDef="due">
              <th mat-header-cell *matHeaderCellDef>Było wykonać</th>
              <td mat-cell *matCellDef="let t">{{ t.nextDueAt }}</td>
            </ng-container>
            <ng-container matColumnDef="overdue">
              <th mat-header-cell *matHeaderCellDef>Dni po terminie</th>
              <td mat-cell *matCellDef="let t"><span class="overdue-days">{{ t.daysOverdue }}</span></td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="overdueColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: overdueColumns;"></tr>
          </table>
          <div class="eq-link">
            <a mat-button color="primary" routerLink="/equipment">
              <mat-icon>construction</mat-icon> Przejdź do sprzętu
            </a>
          </div>
        }

        <!-- Category breakdown -->
        <h2>Zestawienie kategorii</h2>
        <div class="categories-grid">
          @for (cat of r.categoryScores; track cat.category) {
            <mat-card class="cat-card">
              <mat-card-content>
                <div class="cat-header">
                  <span class="cat-name">{{ categoryLabels[cat.category] }}</span>
                  <span class="cat-score" [class]="scoreClass(cat.score)">{{ cat.score }}%</span>
                </div>
                <mat-progress-bar
                  [mode]="'determinate'"
                  [value]="cat.score"
                  [color]="barColor(cat.score)"
                  class="cat-bar" />
                <div class="cat-detail">
                  {{ cat.available | number:'1.1-1' }} / {{ cat.required | number:'1.1-1' }} {{ cat.unit }}
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Readiness shopping list -->
        @if (r.shoppingList.length > 0) {
          <h2>Lista zakupów (cele zapasów)</h2>
          <table mat-table [dataSource]="r.shoppingList" class="shop-table">
            <ng-container matColumnDef="priority">
              <th mat-header-cell *matHeaderCellDef>Priorytet</th>
              <td mat-cell *matCellDef="let item">
                <mat-chip [class]="'priority-' + item.priority.toLowerCase()">
                  {{ priorityLabels[item.priority] }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Kategoria</th>
              <td mat-cell *matCellDef="let item">{{ categoryLabels[item.category] }}</td>
            </ng-container>
            <ng-container matColumnDef="gap">
              <th mat-header-cell *matHeaderCellDef>Brakuje</th>
              <td mat-cell *matCellDef="let item">{{ item.gap | number:'1.1-1' }} {{ item.unit }}</td>
            </ng-container>
            <ng-container matColumnDef="cost">
              <th mat-header-cell *matHeaderCellDef>Szac. koszt</th>
              <td mat-cell *matCellDef="let item">
                @if (catalogCostFor(item); as cost) {
                  {{ cost | number:'1.2-2' }} zł
                } @else {
                  <span class="no-price">—</span>
                }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="shopColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: shopColumns;"></tr>
          </table>
        }
      }

      <!-- Supply buy list: qty=0 + missing from catalog -->
      @if (supplyBuyList().length > 0) {
        <h2>Do kupienia – Zapasy</h2>
        <table mat-table [dataSource]="supplyBuyList()" class="shop-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Produkt</th>
            <td mat-cell *matCellDef="let item">{{ item.name }}</td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Kategoria</th>
            <td mat-cell *matCellDef="let item">{{ categoryLabels[item.category] }}</td>
          </ng-container>
          <ng-container matColumnDef="unit">
            <th mat-header-cell *matHeaderCellDef>Jed.</th>
            <td mat-cell *matCellDef="let item">{{ item.unit }}</td>
          </ng-container>
          <ng-container matColumnDef="suggestedQty">
            <th mat-header-cell *matHeaderCellDef>Zalecana il.</th>
            <td mat-cell *matCellDef="let item">
              @if (item.suggestedQty != null) { {{ item.suggestedQty }} }
              @else { <span class="no-price">—</span> }
            </td>
          </ng-container>
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Cena/szt</th>
            <td mat-cell *matCellDef="let item">
              @if (item.price != null) { {{ item.price | number:'1.2-2' }} zł }
              @else { <span class="no-price">—</span> }
            </td>
          </ng-container>
          <ng-container matColumnDef="totalCost">
            <th mat-header-cell *matHeaderCellDef>Łączny koszt</th>
            <td mat-cell *matCellDef="let item">
              @if (item.totalCost != null) { <strong>{{ item.totalCost | number:'1.2-2' }} zł</strong> }
              @else { <span class="no-price">—</span> }
            </td>
          </ng-container>
          <ng-container matColumnDef="reason">
            <th mat-header-cell *matHeaderCellDef>Powód</th>
            <td mat-cell *matCellDef="let item">
              @if (item.reason === 'zero') {
                <mat-chip class="reason-zero">Stan: 0</mat-chip>
              } @else {
                <mat-chip class="reason-missing">Brak w zapasach</mat-chip>
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="supplyBuyColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: supplyBuyColumns;"></tr>
        </table>

        @if (supplyTotalCost() != null) {
          <div class="total-cost-bar">
            <mat-icon>shopping_cart</mat-icon>
            Szacunkowy koszt uzupełnienia zapasów do 100%:
            <strong class="total-amount">{{ supplyTotalCost() | number:'1.2-2' }} zł</strong>
          </div>
        }

        <div class="eq-link">
          <a mat-button color="primary" routerLink="/catalog">
            <mat-icon>list_alt</mat-icon> Przejdź do katalogu zapasów
          </a>
        </div>
      }

      <!-- Equipment buy list: missing from equipment catalog -->
      @if (equipmentBuyList().length > 0) {
        <h2>Do kupienia – Sprzęt</h2>
        <div class="equip-buy-list">
          @for (item of equipmentBuyList(); track item.name) {
            <div class="equip-buy-item">
              <div class="equip-buy-info">
                <span class="equip-buy-name">{{ item.name }}</span>
                <span class="equip-buy-hint">{{ item.hint }}</span>
              </div>
              <mat-chip class="equip-cat-chip">{{ equipCatLabels[item.category] }}</mat-chip>
              <div class="equip-buy-price">
                @if (item.price != null) {
                  <span class="price-value">{{ item.price | number:'1.2-2' }} zł</span>
                } @else {
                  <span class="no-price">—</span>
                }
              </div>
            </div>
          }
        </div>
        <div class="eq-link">
          <a mat-button color="primary" routerLink="/equipment-catalog">
            <mat-icon>home_repair_service</mat-icon> Przejdź do katalogu sprzętu
          </a>
        </div>
      }

      @if (error()) {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error() }}</span>
          <button mat-button (click)="load()">Spróbuj ponownie</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 24px; max-width: 1100px; margin: 0 auto; }
    h1 { font-size: 1.75rem; margin: 0 0 24px; }
    h2 { font-size: 1.2rem; margin: 24px 0 12px; }

    .score-row { display: flex; gap: 16px; margin-bottom: 8px; flex-wrap: wrap; }
    .score-card { min-width: 200px; text-align: center; }
    .score-label { font-size: 0.85rem; color: #666; margin-bottom: 4px; }
    .score-value { font-size: 3.5rem; font-weight: 700; line-height: 1; }
    .score-pct { font-size: 1.5rem; font-weight: 400; }
    .score-sub { font-size: 0.8rem; color: #888; margin-top: 4px; }

    .score-high .score-value { color: #2e7d32; }
    .score-medium .score-value { color: #e65100; }
    .score-low .score-value { color: #c62828; }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    .cat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .cat-name { font-weight: 500; font-size: 0.95rem; }
    .cat-score { font-weight: 700; font-size: 1.1rem; }
    .cat-score.score-high { color: #2e7d32; }
    .cat-score.score-medium { color: #e65100; }
    .cat-score.score-low { color: #c62828; }
    .cat-bar { margin-bottom: 6px; }
    .cat-detail { font-size: 0.75rem; color: #888; }

    .shop-table { width: 100%; margin-bottom: 8px; }
    td, th { padding: 8px 16px; }
    .no-price { color: #bbb; }
    .overdue-days { font-weight: 700; color: #c62828; }
    .eq-link { margin-bottom: 16px; }

    .priority-high { background: #ffcdd2 !important; color: #c62828 !important; }
    .priority-medium { background: #ffe0b2 !important; color: #e65100 !important; }
    .priority-low { background: #f5f5f5 !important; color: #616161 !important; }
    .reason-zero { background: #fff3e0 !important; color: #e65100 !important; }
    .reason-missing { background: #fce4ec !important; color: #c62828 !important; }

    .total-cost-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; margin: 8px 0 4px;
      background: #e3f2fd; border-radius: 8px; border: 1px solid #90caf9;
      font-size: 0.95rem; color: #1565c0;
    }
    .total-cost-bar mat-icon { font-size: 20px; height: 20px; width: 20px; }
    .total-amount { font-size: 1.1rem; margin-left: 4px; }

    .equip-buy-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
    .equip-buy-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 16px; border-radius: 8px; border: 1px solid #eee; background: #fafafa;
    }
    .equip-buy-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .equip-buy-name { font-size: 0.92rem; font-weight: 500; }
    .equip-buy-hint { font-size: 0.78rem; color: #888; }
    .equip-cat-chip { background: #e8eaf6 !important; color: #3949ab !important; font-size: 0.75rem; flex-shrink: 0; }
    .equip-buy-price { flex-shrink: 0; min-width: 80px; text-align: right; font-size: 0.88rem; }
    .price-value { font-weight: 500; color: #333; }

    .error-state {
      display: flex; align-items: center; gap: 8px;
      color: #c62828; padding: 16px 0;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly svc = inject(DashboardService);
  private readonly supplySvc = inject(SupplyService);
  private readonly equipmentSvc = inject(EquipmentService);

  readonly result = signal<ReadinessResult | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly supplyBuyList = signal<SupplyBuyItem[]>([]);
  readonly supplyTotalCost = signal<number | null>(null);
  readonly equipmentBuyList = signal<EquipBuyItem[]>([]);
  readonly equipCatalogHave = signal(0);
  readonly equipCatalogTotal = EQUIPMENT_CATALOG.length;
  readonly equipCatalogScore = () =>
    Math.round((this.equipCatalogHave() / this.equipCatalogTotal) * 100);

  private supplyPrices: Record<string, number | null> = {};

  readonly categoryLabels: { [key: string]: string } = CATEGORY_LABELS;
  readonly equipCatLabels: { [key: string]: string } = EQUIPMENT_CATEGORY_LABELS;
  readonly priorityLabels: { [key: string]: string } = PRIORITY_LABELS;
  readonly shopColumns = ['priority', 'category', 'gap', 'cost'];
  readonly overdueColumns = ['equipment', 'task', 'due', 'overdue'];
  readonly supplyBuyColumns = ['name', 'category', 'unit', 'suggestedQty', 'price', 'totalCost', 'reason'];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);

    this.supplyPrices = this.readLocalPrices('bastion:catalog:supply:prices');
    const equipmentPrices = this.readLocalPrices('bastion:catalog:equipment:prices');

    forkJoin({
      readiness: this.svc.getReadiness(),
      supplies: this.supplySvc.getAll(),
      equipment: this.equipmentSvc.getAll(),
    }).subscribe({
      next: ({ readiness, supplies, equipment }) => {
        this.result.set(readiness);

        const inventoryNames = new Set(supplies.map(s => s.name.toLowerCase()));
        const coveredCatalogNames = new Set(
          supplies
            .filter(s => s.catalogItemName)
            .map(s => s.catalogItemName!.toLowerCase())
        );

        const zeroItems: SupplyBuyItem[] = supplies
          .filter(s => s.quantity === 0)
          .map(s => {
            const key = s.catalogItemName ?? s.name;
            const cat = findCatalogMatch(key);
            const price = s.estimatedPricePerUnit ?? this.supplyPrices[key] ?? this.supplyPrices[s.name] ?? null;
            const suggestedQty = cat?.suggestedQty ?? null;
            return {
              name: s.name, category: s.category, unit: s.unit, reason: 'zero' as const,
              suggestedQty, price,
              totalCost: price != null && suggestedQty != null ? price * suggestedQty : null,
            };
          });

        const missingItems: SupplyBuyItem[] = SUPPLY_CATALOG
          .filter(c => {
            const lower = c.name.toLowerCase();
            return !inventoryNames.has(lower) && !coveredCatalogNames.has(lower);
          })
          .map(c => {
            const price = this.supplyPrices[c.name] ?? null;
            return {
              name: c.name, category: c.category, unit: c.unit, reason: 'missing' as const,
              suggestedQty: c.suggestedQty, price,
              totalCost: price != null ? price * c.suggestedQty : null,
            };
          });

        this.supplyBuyList.set([...zeroItems, ...missingItems]);
        const total = [...zeroItems, ...missingItems]
          .reduce((sum, i) => sum + (i.totalCost ?? 0), 0);
        this.supplyTotalCost.set(total > 0 ? total : null);

        const ownedNames = new Set(equipment.map(e => e.name.toLowerCase()));
        const missing = EQUIPMENT_CATALOG.filter(c => !ownedNames.has(c.name.toLowerCase()));
        this.equipCatalogHave.set(this.equipCatalogTotal - missing.length);
        this.equipmentBuyList.set(
          missing.map(c => ({ ...c, price: equipmentPrices[c.name] ?? null }))
        );

        this.loading.set(false);
      },
      error: () => { this.error.set('Nie udało się załadować danych.'); this.loading.set(false); }
    });
  }

  private readLocalPrices(key: string): Record<string, number | null> {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  }

  catalogCostFor(item: ShoppingListItem): number | null {
    const matching = SUPPLY_CATALOG.filter(
      c => c.category === item.category && c.unit === item.unit
    );
    const prices = matching
      .map(c => this.supplyPrices[c.name])
      .filter((p): p is number => p != null);
    if (prices.length === 0) return item.estimatedCost ?? null;
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    return Math.round(avgPrice * item.gap * 100) / 100;
  }

  scoreClass(score: number): string {
    if (score >= 75) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  }

  barColor(score: number): 'primary' | 'accent' | 'warn' {
    if (score >= 75) return 'primary';
    if (score >= 40) return 'accent';
    return 'warn';
  }

  scoreDescription(score: number): string {
    if (score >= 90) return 'Świetna gotowość';
    if (score >= 75) return 'Dobra gotowość';
    if (score >= 50) return 'Wymaga uzupełnienia';
    if (score >= 25) return 'Niewystarczające zapasy';
    return 'Krytyczny niedobór';
  }
}
