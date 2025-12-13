import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../core/services/auth.service';
import { UserRole, DashboardStats } from '../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatChipsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userRole: UserRole | null = null;
  userName: string = '';
  stats: DashboardStats = {};

  // Role enums for template
  UserRole = UserRole;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userRole = this.authService.getRole();
    this.userName = this.authService.getUserName() || 'User';
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Mock data - in real app, fetch from services
    switch (this.userRole) {
      case UserRole.ORG_ADMIN:
        this.stats = {
          totalUsers: 156,
          usersByRole: {
            'Employees': 120,
            'Managers': 30,
            'Travel Desk': 5,
            'Admins': 1
          }
        };
        break;
      case UserRole.EMPLOYEE:
        this.stats = {
          totalTrips: 12,
          upcomingTrips: 2,
          pendingApprovals: 1
        };
        break;
      case UserRole.MANAGER:
        this.stats = {
          pendingApprovals: 8,
          totalUsers: 25
        };
        break;
      case UserRole.TRAVEL_DESK_ADMIN:
        this.stats = {
          approvedAwaitingBooking: 5,
          tripsBookedToday: 3,
          totalCost: 125000
        };
        break;
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }
}
