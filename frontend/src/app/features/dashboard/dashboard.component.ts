import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { DashboardService } from '../../core/services/dashboard.service';
import { CategoryScore, ReadinessResult, ShoppingListItem, ShoppingPriority } from '../../core/models/dashboard.model';
import { CATEGORY_LABELS } from '../../core/models/supply.model';

const PRIORITY_LABELS: Record<ShoppingPriority, string> = {
  High: 'Pilne',
  Medium: 'Ważne',
  Low: 'Niskie',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe,
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
        <!-- Overall score -->
        <div class="score-row">
          <mat-card class="score-card" [class]="scoreClass(r.overallScore)">
            <mat-card-content>
              <div class="score-label">Ogólna gotowość</div>
              <div class="score-value">{{ r.overallScore }}<span class="score-pct">%</span></div>
              <div class="score-sub">{{ r.memberCount }} os. · {{ scoreDescription(r.overallScore) }}</div>
            </mat-card-content>
          </mat-card>
        </div>

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

        <!-- Shopping list -->
        @if (r.shoppingList.length > 0) {
          <h2>Lista zakupów</h2>
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
                @if (item.estimatedCost != null) {
                  {{ item.estimatedCost | number:'1.2-2' }} zł
                } @else {
                  <span class="no-price">—</span>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="shopColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: shopColumns;"></tr>
          </table>
        } @else {
          <div class="all-good">
            <mat-icon>verified</mat-icon>
            <span>Wszystkie zapasy są na poziomie docelowym!</span>
          </div>
        }
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

    .score-row { display: flex; gap: 16px; margin-bottom: 8px; }
    .score-card { min-width: 220px; text-align: center; }
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
    .cat-card { }
    .cat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .cat-name { font-weight: 500; font-size: 0.95rem; }
    .cat-score { font-weight: 700; font-size: 1.1rem; }
    .cat-score.score-high { color: #2e7d32; }
    .cat-score.score-medium { color: #e65100; }
    .cat-score.score-low { color: #c62828; }
    .cat-bar { margin-bottom: 6px; }
    .cat-detail { font-size: 0.75rem; color: #888; }

    .shop-table { width: 100%; margin-bottom: 24px; }
    td, th { padding: 8px 16px; }
    .no-price { color: #bbb; }

    .priority-high { background: #ffcdd2 !important; color: #c62828 !important; }
    .priority-medium { background: #ffe0b2 !important; color: #e65100 !important; }
    .priority-low { background: #f5f5f5 !important; color: #616161 !important; }

    .all-good {
      display: flex; align-items: center; gap: 8px;
      color: #2e7d32; font-size: 1rem; padding: 16px 0;
    }
    .error-state {
      display: flex; align-items: center; gap: 8px;
      color: #c62828; padding: 16px 0;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly svc = inject(DashboardService);

  readonly result = signal<ReadinessResult | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly categoryLabels: { [key: string]: string } = CATEGORY_LABELS;
  readonly priorityLabels: { [key: string]: string } = PRIORITY_LABELS;
  readonly shopColumns = ['priority', 'category', 'gap', 'cost'];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getReadiness().subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: () => { this.error.set('Nie udało się załadować danych.'); this.loading.set(false); }
    });
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
