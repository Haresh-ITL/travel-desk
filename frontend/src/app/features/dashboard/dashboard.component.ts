import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { ManagerService } from '../../core/services/manager.service';
import { TravelDeskService } from '../../core/services/travel-desk.service';
import { AdminService } from '../../core/services/admin.service';
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
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userRole: UserRole | null = null;
  userName: string = '';
  stats: DashboardStats = {};
  isLoading = false;

  // Role enums for template
  UserRole = UserRole;

  constructor(
    private authService: AuthService,
    private employeeService: EmployeeService,
    private managerService: ManagerService,
    private travelDeskService: TravelDeskService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getRole();
    this.userName = this.authService.getUserName() || 'User';
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    switch (this.userRole) {
      case UserRole.ORG_ADMIN:
        this.loadAdminStats();
        break;
      case UserRole.EMPLOYEE:
        this.loadEmployeeStats();
        break;
      case UserRole.MANAGER:
        this.loadManagerStats();
        break;
      case UserRole.TRAVEL_DESK_ADMIN:
        this.loadTravelDeskStats();
        break;
      default:
        this.isLoading = false;
    }
  }

  loadEmployeeStats(): void {
    this.employeeService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
        console.log('Employee dashboard stats loaded:', stats);
      },
      error: (error) => {
        console.error('Error loading employee dashboard stats:', error);
        // Fallback to default values on error
        this.stats = {
          totalTrips: 0,
          upcomingTrips: 0,
          pendingApprovals: 0
        };
        this.isLoading = false;
      }
    });
  }

  loadManagerStats(): void {
    // TODO: Implement manager stats endpoint
    this.managerService.getPendingRequests().subscribe({
      next: (requests) => {
        this.stats = {
          pendingApprovals: requests.length,
          totalUsers: 0 // TODO: Get from manager stats endpoint
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading manager dashboard stats:', error);
        this.stats = {
          pendingApprovals: 0,
          totalUsers: 0
        };
        this.isLoading = false;
      }
    });
  }

  loadTravelDeskStats(): void {
    // TODO: Implement travel desk stats endpoint
    this.travelDeskService.getAnalytics().subscribe({
      next: (analytics) => {
        this.stats = {
          approvedAwaitingBooking: analytics.approved || 0,
          tripsBookedToday: 0, // TODO: Calculate from bookings
          totalCost: 0 // TODO: Calculate from bookings
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading travel desk dashboard stats:', error);
        this.stats = {
          approvedAwaitingBooking: 0,
          tripsBookedToday: 0,
          totalCost: 0
        };
        this.isLoading = false;
      }
    });
  }

  loadAdminStats(): void {
    // TODO: Implement admin stats endpoint
    this.adminService.getUsers().subscribe({
      next: (users) => {
        const usersByRole: { [key: string]: number } = {};
        users.forEach(user => {
          const role = user.roleName || 'Unknown';
          usersByRole[role] = (usersByRole[role] || 0) + 1;
        });
        
        this.stats = {
          totalUsers: users.length,
          usersByRole: usersByRole
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading admin dashboard stats:', error);
        this.stats = {
          totalUsers: 0,
          usersByRole: {}
        };
        this.isLoading = false;
      }
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }
}
