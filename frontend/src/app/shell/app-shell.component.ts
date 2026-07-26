import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatSidenavModule, MatListModule
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <mat-sidenav #drawer mode="over" class="app-drawer">
        <mat-toolbar color="primary" class="drawer-header">
          <mat-icon>shield</mat-icon>
          <span>Bastion</span>
        </mat-toolbar>
        <mat-nav-list>
          <a mat-list-item routerLink="/catalog" (click)="drawer.close()">
            <mat-icon matListItemIcon>list_alt</mat-icon>
            <span matListItemTitle>Katalog zapasów</span>
          </a>
          <a mat-list-item routerLink="/equipment-catalog" (click)="drawer.close()">
            <mat-icon matListItemIcon>home_repair_service</mat-icon>
            <span matListItemTitle>Katalog sprzętu</span>
          </a>
          <a mat-list-item routerLink="/locations" (click)="drawer.close()">
            <mat-icon matListItemIcon>place</mat-icon>
            <span matListItemTitle>Lokalizacje</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="app-toolbar">
          <button mat-icon-button (click)="drawer.toggle()" aria-label="Menu">
            <mat-icon>menu</mat-icon>
          </button>
          <mat-icon class="logo-icon">shield</mat-icon>
          <span class="app-name">Bastion</span>
        </mat-toolbar>

        <main class="main-content">
          <router-outlet />
        </main>

        <nav class="bottom-nav">
          <a routerLink="/dashboard" routerLinkActive="nav-active" class="nav-item">
            <mat-icon>home</mat-icon>
            <span>Dashboard</span>
          </a>
          <a routerLink="/inventory" routerLinkActive="nav-active" class="nav-item">
            <mat-icon>inventory_2</mat-icon>
            <span>Zapasy</span>
          </a>
          <a routerLink="/equipment" routerLinkActive="nav-active" class="nav-item">
            <mat-icon>construction</mat-icon>
            <span>Sprzęt</span>
          </a>
          <a routerLink="/scenarios" routerLinkActive="nav-active" class="nav-item">
            <mat-icon>checklist</mat-icon>
            <span>Scenariusze</span>
          </a>
          <a routerLink="/settings" routerLinkActive="nav-active" class="nav-item">
            <mat-icon>settings</mat-icon>
            <span>Ustawienia</span>
          </a>
        </nav>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell-container { height: 100vh; display: flex; flex-direction: column; }
    .app-drawer { width: 260px; }
    .drawer-header { gap: 12px; }
    .app-toolbar { position: sticky; top: 0; z-index: 100; flex-shrink: 0; }
    .logo-icon { margin: 0 6px 0 8px; font-size: 20px; }
    .app-name { font-weight: 700; font-size: 1.15rem; }
    .main-content { flex: 1; overflow-y: auto; padding-bottom: 64px; }

    .bottom-nav {
      position: fixed; bottom: 0; left: 0; right: 0;
      height: 64px;
      background: #1976d2;
      display: flex;
      z-index: 200;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.2);
    }
    .nav-item {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: rgba(255,255,255,0.65);
      text-decoration: none;
      font-size: 0.62rem; gap: 2px;
      transition: color 0.15s, background 0.15s;
      padding: 4px 0;
    }
    .nav-item mat-icon { font-size: 22px; height: 22px; width: 22px; }
    .nav-item.nav-active {
      color: #fff;
      background: rgba(255,255,255,0.18);
      border-radius: 10px;
      margin: 4px 3px;
    }
  `]
})
export class AppShellComponent {}
