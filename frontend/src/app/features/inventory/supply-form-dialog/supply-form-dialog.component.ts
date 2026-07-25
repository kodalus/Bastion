import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LocationService } from '../../../core/services/location.service';
import {
  CATEGORY_LABELS, CreateSupplyItemRequest,
  StorageLocation, SupplyCategory, SupplyItem, SUPPLY_CATEGORIES
} from '../../../core/models/supply.model';

export interface SupplyFormDialogData {
  item?: SupplyItem;
  locations: StorageLocation[];
}

@Component({
  selector: 'app-supply-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.item ? 'Edytuj zapas' : 'Dodaj zapas' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="supply-form">
        <mat-form-field appearance="outline">
          <mat-label>Nazwa</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Kategoria</mat-label>
          <mat-select formControlName="category">
            @for (cat of categories; track cat) {
              <mat-option [value]="cat">{{ categoryLabels[cat] }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Ilość</mat-label>
            <input matInput type="number" formControlName="quantity" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Jednostka</mat-label>
            <input matInput formControlName="unit" placeholder="L, kg, szt…" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Miejsce przechowywania</mat-label>
          <mat-select formControlName="storageLocationId">
            @for (loc of locations; track loc.id) {
              <mat-option [value]="loc.id">
                {{ loc.name }}{{ loc.description ? ' – ' + loc.description : '' }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Inline add location -->
        @if (!showLocForm) {
          <button type="button" mat-button class="add-loc-btn" (click)="showLocForm = true">
            <mat-icon>add_location</mat-icon> Nowe miejsce przechowywania
          </button>
        } @else {
          <div class="new-loc-box">
            <div class="new-loc-title">Nowe miejsce</div>
            <div class="row">
              <mat-form-field appearance="outline" class="loc-name-field">
                <mat-label>Nazwa</mat-label>
                <input matInput [(ngModel)]="newLocName" [ngModelOptions]="{standalone: true}" (keyup.enter)="addLocation()" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="loc-desc-field">
                <mat-label>Opis (opcjonalnie)</mat-label>
                <input matInput [(ngModel)]="newLocDesc" [ngModelOptions]="{standalone: true}" />
              </mat-form-field>
            </div>
            <div class="new-loc-actions">
              <button type="button" mat-raised-button color="primary"
                      [disabled]="!newLocName.trim() || addingLoc"
                      (click)="addLocation()">
                @if (addingLoc) { <mat-spinner diameter="16" /> }
                @else { Dodaj }
              </button>
              <button type="button" mat-button (click)="showLocForm = false; newLocName = ''; newLocDesc = ''">
                Anuluj
              </button>
            </div>
          </div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Data ważności</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="expiryDate" />
          <mat-datepicker-toggle matSuffix [for]="picker" />
          <mat-datepicker #picker />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cena za jednostkę (PLN)</mat-label>
          <input matInput type="number" formControlName="estimatedPricePerUnit" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Anuluj</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="form.invalid">
        {{ data.item ? 'Zapisz' : 'Dodaj' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .supply-form { display: flex; flex-direction: column; gap: 8px; min-width: 420px; padding-top: 8px; }
    .row { display: flex; gap: 12px; }
    .row mat-form-field { flex: 1; }
    .loc-name-field { flex: 1; min-width: 140px; }
    .loc-desc-field { flex: 1.5; min-width: 160px; }
    .add-loc-btn { color: #1976d2; font-size: 0.85rem; margin-top: -4px; }
    .new-loc-box {
      border: 1px solid #90caf9; border-radius: 8px; padding: 12px 16px;
      background: #f0f7ff; display: flex; flex-direction: column; gap: 8px;
    }
    .new-loc-title { font-size: 0.8rem; font-weight: 600; color: #1565c0; margin-bottom: 4px; }
    .new-loc-actions { display: flex; gap: 8px; align-items: center; }
    mat-spinner { display: inline-block; }
  `]
})
export class SupplyFormDialogComponent implements OnInit {
  readonly data: SupplyFormDialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SupplyFormDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly locationSvc = inject(LocationService);

  readonly categories: SupplyCategory[] = SUPPLY_CATEGORIES;
  readonly categoryLabels = CATEGORY_LABELS;

  locations: StorageLocation[] = [];
  showLocForm = false;
  newLocName = '';
  newLocDesc = '';
  addingLoc = false;

  form!: FormGroup;

  ngOnInit() {
    this.locations = [...this.data.locations];
    this.locationSvc.getAll().subscribe(locs => {
      this.locations = locs;
      const current = this.form?.get('storageLocationId')?.value;
      if (current && !locs.some(l => l.id === current)) {
        this.form?.patchValue({ storageLocationId: '' });
      }
    });
    const item = this.data.item;
    this.form = this.fb.group({
      name: [item?.name ?? '', Validators.required],
      category: [item?.category ?? 'Food', Validators.required],
      quantity: [item?.quantity ?? null, [Validators.required, Validators.min(0)]],
      unit: [item?.unit ?? '', Validators.required],
      storageLocationId: [item?.storageLocationId ?? '', Validators.required],
      expiryDate: [item?.expiryDate ? new Date(item.expiryDate) : null],
      estimatedPricePerUnit: [item?.estimatedPricePerUnit ?? null]
    });
  }

  addLocation() {
    const name = this.newLocName.trim();
    if (!name) return;
    this.addingLoc = true;
    this.locationSvc.create({ name, description: this.newLocDesc.trim() || null }).subscribe({
      next: loc => {
        this.locations = [...this.locations, loc];
        this.form.patchValue({ storageLocationId: loc.id });
        this.showLocForm = false;
        this.newLocName = '';
        this.newLocDesc = '';
        this.addingLoc = false;
      },
      error: () => { this.addingLoc = false; }
    });
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const request: CreateSupplyItemRequest = {
      name: v.name,
      category: v.category,
      quantity: v.quantity,
      unit: v.unit,
      storageLocationId: v.storageLocationId,
      expiryDate: v.expiryDate ? this.toDateOnly(v.expiryDate) : null,
      estimatedPricePerUnit: v.estimatedPricePerUnit ?? null
    };
    this.dialogRef.close(request);
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().substring(0, 10);
  }
}
