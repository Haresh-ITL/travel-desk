import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../auth/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav mode="side" opened class="sidenav">
        <mat-nav-list>
          <a mat-list-item [routerLink]="['/dashboard']" routerLinkActive="active">
            <mat-icon matListIcon>dashboard</mat-icon>
            <span matLine>Dashboard</span>
          </a>
          <ng-container *ngFor="let item of menuItems">
            <a mat-list-item [routerLink]="item.route" routerLinkActive="active" *ngIf="hasRole(item.roles)">
              <mat-icon matListIcon>{{ item.icon }}</mat-icon>
              <span matLine>{{ item.label }}</span>
            </a>
          </ng-container>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          <span class="app-title">Corporate Travel Desk</span>
          <span class="spacer"></span>
          <span class="user-info">{{ getUserName() }} ({{ getRoleDisplay() }})</span>
          <button mat-icon-button [matMenuTriggerFor]="menu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="toggleTheme()">
              <mat-icon>{{ isDarkTheme ? 'light_mode' : 'dark_mode' }}</mat-icon>
              <span>{{ isDarkTheme ? 'Light Theme' : 'Dark Theme' }}</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </mat-toolbar>
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }
    .sidenav {
      width: 250px;
      background-color: #f5f5f5;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .app-title {
      font-weight: 500;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .user-info {
      margin-right: 16px;
      font-size: 14px;
    }
    .content {
      padding: 20px;
      background-color: #fafafa;
      min-height: calc(100vh - 64px);
    }
    .active {
      background-color: rgba(0, 0, 0, 0.1);
    }
  `]
})
export class LayoutComponent implements OnInit {
  isDarkTheme = false;
  menuItems: MenuItem[] = [
    { label: 'Users', icon: 'people', route: '/org-admin/users', roles: ['ORG_ADMIN'] },
    { label: 'Requests', icon: 'assignment', route: '/employee/requests', roles: ['EMPLOYEE'] },
    { label: 'Profile', icon: 'person', route: '/employee/profile', roles: ['EMPLOYEE'] },
    { label: 'Approvals', icon: 'check_circle', route: '/manager/approvals', roles: ['MANAGER'] },
    { label: 'Bookings', icon: 'flight', route: '/travel-desk/bookings', roles: ['TRAVEL_DESK_ADMIN'] }
  ];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Apply theme on init
    this.applyTheme();
  }

  hasRole(roles: string[]): boolean {
    const userRole = this.authService.getRole();
    return userRole ? roles.includes(userRole) : false;
  }

  getUserName(): string {
    // In a real app, you'd fetch user details
    return 'User'; // Placeholder
  }

  getRoleDisplay(): string {
    const role = this.authService.getRole();
    switch (role) {
      case 'ORG_ADMIN': return 'Org Admin';
      case 'EMPLOYEE': return 'Employee';
      case 'MANAGER': return 'Manager';
      case 'TRAVEL_DESK_ADMIN': return 'Travel Desk';
      default: return 'Unknown';
    }
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
  }

  private applyTheme(): void {
    const body = document.body;
    if (this.isDarkTheme) {
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
