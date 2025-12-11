import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UserRole } from '../../shared/models';
import { AuthService } from '../services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles: UserRole[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatChipsModule,
    MatSlideToggleModule
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  userName: string = '';
  userRole: UserRole | null = null;
  isDarkTheme = false;
  menuItems: MenuItem[] = [];

  private allMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: [UserRole.ORG_ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.TRAVEL_DESK_ADMIN] },
    { label: 'Users', icon: 'people', route: '/org-admin/users', roles: [UserRole.ORG_ADMIN] },
    { label: 'Requests', icon: 'flight_takeoff', route: '/employee/requests', roles: [UserRole.EMPLOYEE] },
    { label: 'Profile', icon: 'person', route: '/employee/profile', roles: [UserRole.EMPLOYEE] },
    { label: 'Approvals', icon: 'approval', route: '/manager/approvals', roles: [UserRole.MANAGER] },
    { label: 'Bookings', icon: 'book_online', route: '/travel-desk/bookings', roles: [UserRole.TRAVEL_DESK_ADMIN] }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userName = this.authService.getUserName() || 'User';
    this.userRole = this.authService.getRole();
    this.filterMenuItems();
    
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    this.isDarkTheme = savedTheme === 'dark';
    this.applyTheme();
  }

  filterMenuItems(): void {
    if (this.userRole) {
      this.menuItems = this.allMenuItems.filter(item => item.roles.includes(this.userRole!));
    }
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.isDarkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  getRoleDisplay(): string {
    if (!this.userRole) return '';
    return this.userRole.replace('_', ' ');
  }

  getRoleColor(): string {
    switch (this.userRole) {
      case UserRole.ORG_ADMIN:
        return 'primary';
      case UserRole.EMPLOYEE:
        return 'accent';
      case UserRole.MANAGER:
        return 'warn';
      case UserRole.TRAVEL_DESK_ADMIN:
        return 'primary';
      default:
        return '';
    }
  }

  getUserEmail(): string | null {
    return this.authService.getUserEmail();
  }

  logout(): void {
    this.authService.logout();
  }
}
