import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ManagerService } from '../../../core/services/manager.service';
import { TravelRequest, RequestStatus, ManagerDecision } from '../../../shared/models';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatSnackBarModule
  ],
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.scss']
})
export class ApprovalsComponent implements OnInit {
  requests: TravelRequest[] = [];
  filteredRequests: TravelRequest[] = [];
  displayedColumns: string[] = ['employeeName', 'from', 'to', 'startDate', 'endDate', 'status', 'actions'];
  selectedRequest: TravelRequest | null = null;
  comment = '';
  RequestStatus = RequestStatus;

  constructor(
    private managerService: ManagerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.managerService.getRequests().subscribe({
      next: (requests) => {
        this.requests = requests;
        this.filteredRequests = requests;
      },
      error: () => {
        this.snackBar.open('Failed to load requests', 'Close', { duration: 3000 });
      }
    });
  }

  selectRequest(request: TravelRequest): void {
    this.selectedRequest = request;
    this.comment = '';
  }

  closeDrawer(): void {
    this.selectedRequest = null;
    this.comment = '';
  }

  approve(): void {
    if (!this.selectedRequest) return;

    const decision: ManagerDecision = {
      status: RequestStatus.APPROVED,
      comment: this.comment
    };

    this.managerService.makeDecision(this.selectedRequest.uuid, decision).subscribe({
      next: () => {
        this.snackBar.open('Request approved successfully', 'Close', { duration: 3000 });
        this.loadRequests();
        this.closeDrawer();
      },
      error: () => {
        this.snackBar.open('Failed to approve request', 'Close', { duration: 3000 });
      }
    });
  }

  reject(): void {
    if (!this.selectedRequest) return;

    const decision: ManagerDecision = {
      status: RequestStatus.REJECTED,
      comment: this.comment
    };

    this.managerService.makeDecision(this.selectedRequest.uuid, decision).subscribe({
      next: () => {
        this.snackBar.open('Request rejected', 'Close', { duration: 3000 });
        this.loadRequests();
        this.closeDrawer();
      },
      error: () => {
        this.snackBar.open('Failed to reject request', 'Close', { duration: 3000 });
      }
    });
  }

  getStatusColor(status: RequestStatus): string {
    switch (status) {
      case RequestStatus.PENDING:
        return 'warn';
      case RequestStatus.APPROVED:
        return 'accent';
      case RequestStatus.BOOKED:
        return 'primary';
      case RequestStatus.REJECTED:
        return '';
      default:
        return '';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}
