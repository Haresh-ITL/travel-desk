import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatGridListModule,
    MatChipsModule
  ],
  template: `
    <div class="dashboard-container">
      <h1>Dashboard</h1>
      <mat-grid-list cols="4" rowHeight="200px" gutterSize="16px">
        <mat-grid-tile *ngFor="let card of dashboardCards">
          <mat-card class="dashboard-card">
            <mat-card-header>
              <mat-icon mat-card-avatar [style.color]="card.color">{{ card.icon }}</mat-icon>
              <mat-card-title>{{ card.title }}</mat-card-title>
              <mat-card-subtitle>{{ card.subtitle }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="card-value">{{ card.value }}</div>
              <mat-chip-listbox *ngIf="card.chip">
                <mat-chip [style.background-color]="card.chipColor">{{ card.chip }}</mat-chip>
              </mat-chip-listbox>
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>
      </mat-grid-list>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
    }
    h1 {
      margin-bottom: 20px;
      color: #1976d2;
    }
    .dashboard-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .card-value {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 8px;
    }
    mat-chip {
      font-size: 0.8rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  dashboardCards: any[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const role = this.authService.getRole();
    this.loadDashboardCards(role);
  }

  private loadDashboardCards(role: string | null): void {
    switch (role) {
      case 'ORG_ADMIN':
        this.dashboardCards = [
          { title: 'Total Users', subtitle: 'Active users', value: '150', icon: 'people', color: '#4caf50' },
          { title: 'Users by Role', subtitle: 'Distribution', value: 'Employees: 120', icon: 'pie_chart', color: '#2196f3' },
          { title: 'Recently Created', subtitle: 'Last 7 days', value: '12', icon: 'person_add', color: '#ff9800' },
          { title: 'Active Sessions', subtitle: 'Current', value: '45', icon: 'visibility', color: '#9c27b0' }
        ];
        break;
      case 'EMPLOYEE':
        this.dashboardCards = [
          { title: 'Total Trips', subtitle: 'All time', value: '8', icon: 'flight', color: '#4caf50' },
          { title: 'Upcoming Trips', subtitle: 'Next 30 days', value: '2', icon: 'event', color: '#2196f3' },
          { title: 'Pending Approvals', subtitle: 'Awaiting decision', value: '1', icon: 'hourglass_empty', color: '#ff9800', chip: 'Pending', chipColor: '#ff9800' },
          { title: 'Approved Trips', subtitle: 'Ready for booking', value: '3', icon: 'check_circle', color: '#4caf50' }
        ];
        break;
      case 'MANAGER':
        this.dashboardCards = [
          { title: 'Pending Approvals', subtitle: 'Requires action', value: '5', icon: 'assignment', color: '#ff9800' },
          { title: 'Approved This Week', subtitle: 'Recent decisions', value: '12', icon: 'check_circle', color: '#4caf50' },
          { title: 'Rejected This Week', subtitle: 'Recent decisions', value: '2', icon: 'cancel', color: '#f44336' },
          { title: 'Employees Managed', subtitle: 'Team size', value: '25', icon: 'group', color: '#2196f3' }
        ];
        break;
      case 'TRAVEL_DESK_ADMIN':
        this.dashboardCards = [
          { title: 'Approved Requests', subtitle: 'Awaiting booking', value: '8', icon: 'check_circle', color: '#4caf50' },
          { title: 'Trips Booked Today', subtitle: 'Completed bookings', value: '3', icon: 'flight_takeoff', color: '#2196f3' },
          { title: 'Total Trips', subtitle: 'This month', value: '45', icon: 'calendar_view_month', color: '#9c27b0' },
          { title: 'Total Cost', subtitle: 'This month', value: '$12,500', icon: 'attach_money', color: '#ff9800' }
        ];
        break;
      default:
        this.dashboardCards = [];
    }
  }
}
