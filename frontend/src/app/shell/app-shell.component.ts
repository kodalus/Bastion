import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <mat-icon class="logo-icon">shield</mat-icon>
      <span class="app-name">Bastion</span>
      <span class="spacer"></span>
      <a mat-button routerLink="/dashboard" routerLinkActive="active-link">
        <mat-icon>dashboard</mat-icon> Dashboard
      </a>
      <a mat-button routerLink="/inventory" routerLinkActive="active-link">
        <mat-icon>inventory_2</mat-icon> Zapasy
      </a>
    </mat-toolbar>
    <main>
      <router-outlet />
    </main>
  `,
  styles: [`
    mat-toolbar { position: sticky; top: 0; z-index: 100; }
    .logo-icon { margin-right: 8px; }
    .app-name { font-weight: 700; font-size: 1.2rem; margin-right: 24px; }
    .spacer { flex: 1; }
    .active-link { background: rgba(255,255,255,0.15); border-radius: 4px; }
    a mat-icon { margin-right: 4px; font-size: 18px; height: 18px; width: 18px; vertical-align: middle; }
    main { min-height: calc(100vh - 64px); }
  `]
})
export class AppShellComponent {}
