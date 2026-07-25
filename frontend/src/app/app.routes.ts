import { Routes } from '@angular/router';
import { AppShellComponent } from './shell/app-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent)
      },
      {
        path: 'equipment',
        loadComponent: () => import('./features/equipment/equipment.component').then(m => m.EquipmentComponent)
      },
      {
        path: 'scenarios',
        loadComponent: () => import('./features/scenarios/scenarios.component').then(m => m.ScenariosComponent)
      }
    ]
  }
];
