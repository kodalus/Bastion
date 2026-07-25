import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
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
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule
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
            @for (loc of data.locations; track loc.id) {
              <mat-option [value]="loc.id">{{ loc.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

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
    .supply-form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; padding-top: 8px; }
    .row { display: flex; gap: 12px; }
    .row mat-form-field { flex: 1; }
  `]
})
export class SupplyFormDialogComponent implements OnInit {
  readonly data: SupplyFormDialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SupplyFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  readonly categories: SupplyCategory[] = SUPPLY_CATEGORIES;
  readonly categoryLabels = CATEGORY_LABELS;

  form!: FormGroup;

  ngOnInit() {
    const item = this.data.item;
    this.form = this.fb.group({
      name: [item?.name ?? '', Validators.required],
      category: [item?.category ?? 'Food', Validators.required],
      quantity: [item?.quantity ?? null, [Validators.required, Validators.min(0.001)]],
      unit: [item?.unit ?? '', Validators.required],
      storageLocationId: [item?.storageLocationId ?? '', Validators.required],
      expiryDate: [item?.expiryDate ? new Date(item.expiryDate) : null],
      estimatedPricePerUnit: [item?.estimatedPricePerUnit ?? null]
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
