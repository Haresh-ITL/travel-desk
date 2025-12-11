import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';
import { TravelRequest, DecisionRequest } from '../../../shared/models/travel-request';
import { ItineraryViewerComponent } from '../../../shared/components/itinerary-viewer/itinerary-viewer.component';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    FormsModule,
    MatSnackBarModule,
    MatSidenavModule,
    ItineraryViewerComponent
  ],
  template: `
    <div class="approvals-container">
      <div class="header">
        <h1>Employee Requests</h1>
      </div>

      <div class="filters">
        <mat-form-field>
          <mat-label>Employee</mat-label>
          <mat-select (selectionChange)="applyEmployeeFilter($event)">
            <mat-option value="">All Employees</mat-option>
            <mat-option *ngFor="let employee of employees" [value]="employee.uuid">{{ employee.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Status</mat-label>
          <mat-select (selectionChange)="applyStatusFilter($event)">
            <mat-option value="">All</mat-option>
            <mat-option value="PENDING">Pending</mat-option>
            <mat-option value="APPROVED">Approved</mat-option>
            <mat-option value="REJECTED">Rejected</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Start Date</mat-label>
          <input matInput [matDatepicker]="startPicker" (dateChange)="applyDateFilter()">
          <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>
        <mat-form-field>
          <mat-label>End Date</mat-label>
          <input matInput [matDatepicker]="endPicker" (dateChange)="applyDateFilter()">
          <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>
      </div>

      <mat-table [dataSource]="dataSource" matSort>
        <ng-container matColumnDef="employee">
          <mat-header-cell *matHeaderCellDef mat-sort-header>Employee</mat-header-cell>
          <mat-cell *matCellDef="let request">{{ request.employeeName }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="from">
          <mat-header-cell *matHeaderCellDef mat-sort-header>From</mat-header-cell>
          <mat-cell *matCellDef="let request">{{ request.from }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="to">
          <mat-header-cell *matHeaderCellDef mat-sort-header>To</mat-header-cell>
          <mat-cell *matCellDef="let request">{{ request.to }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="dates">
          <mat-header-cell *matHeaderCellDef mat-sort-header>Dates</mat-header-cell>
          <mat-cell *matCellDef="let request">{{ request.startDate | date }} - {{ request.endDate | date }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="status">
          <mat-header-cell *matHeaderCellDef mat-sort-header>Status</mat-header-cell>
          <mat-cell *matCellDef="let request">
            <mat-chip [color]="getStatusColor(request.status)" selected>{{ request.status }}</mat-chip>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="purpose">
          <mat-header-cell *matHeaderCellDef>Purpose</mat-header-cell>
          <mat-cell *matCellDef="let request">{{ request.purpose | slice:0:30 }}...</mat-cell>
        </ng-container>

        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
          <mat-cell *matCellDef="let request">
            <button mat-icon-button (click)="openRequestDetails(request)">
              <mat-icon>visibility</mat-icon>
            </button>
            <button mat-icon-button *ngIf="request.status === 'PENDING'" color="primary" (click)="openDecisionDialog(request, 'APPROVED')">
              <mat-icon>check</mat-icon>
            </button>
            <button mat-icon-button *ngIf="request.status === 'PENDING'" color="warn" (click)="openDecisionDialog(request, 'REJECTED')">
              <mat-icon>close</mat-icon>
            </button>
            <button mat-icon-button *ngIf="request.status === 'BOOKED'" (click)="viewItinerary(request)">
              <mat-icon>flight</mat-icon>
            </button>
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: displayedColumns;" (click)="openRequestDetails(row)"></mat-row>
      </mat-table>

      <mat-paginator [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons></mat-paginator>

      <mat-drawer #drawer mode="side" position="end" [opened]="drawerOpened">
        <div class="drawer-content" *ngIf="selectedRequest">
          <h2>Request Details</h2>
          <p><strong>Employee:</strong> {{ selectedRequest.employeeName }}</p>
          <p><strong>From:</strong> {{ selectedRequest.from }}</p>
          <p><strong>To:</strong> {{ selectedRequest.to }}</p>
          <p><strong>Type:</strong> {{ selectedRequest.travelType }}</p>
          <p><strong>Dates:</strong> {{ selectedRequest.startDate | date }} - {{ selectedRequest.endDate | date }}</p>
          <p><strong>Purpose:</strong> {{ selectedRequest.purpose }}</p>
          <p><strong>Status:</strong> <mat-chip [color]="getStatusColor(selectedRequest.status)" selected>{{ selectedRequest.status }}</mat-chip></p>

          <div *ngIf="selectedRequest.attachments">
            <h3>Attachments</h3>
            <div *ngFor="let attachment of selectedRequest.attachments">
              <a [href]="attachment.url" target="_blank">{{ attachment.name }}</a>
            </div>
          </div>

          <div class="decision-panel" *ngIf="selectedRequest.status === 'PENDING'">
            <h3>Decision</h3>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Comment</mat-label>
              <textarea matInput [(ngModel)]="decisionComment" rows="3"></textarea>
            </mat-form-field>
            <div class="decision-buttons">
              <button mat-raised-button color="primary" (click)="makeDecision(selectedRequest, 'APPROVED')">
                <mat-icon>check</mat-icon>
                Approve
              </button>
              <button mat-raised-button color="warn" (click)="makeDecision(selectedRequest, 'REJECTED')">
                <mat-icon>close</mat-icon>
                Reject
              </button>
            </div>
          </div>

          <div class="drawer-actions">
            <button mat-button *ngIf="selectedRequest.status === 'BOOKED'" (click)="viewItinerary(selectedRequest)">View Itinerary</button>
          </div>
        </div>
      </mat-drawer>
    </div>
  `,
  styles: [`
    .approvals-container {
      padding: 20px;
    }
    .header {
      margin-bottom: 20px;
    }
    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .drawer-content {
      padding: 20px;
      width: 400px;
    }
    .decision-panel {
      margin-top: 20px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }
    .decision-buttons {
      display: flex;
      gap: 10px;
      margin-top: 16px;
    }
    .drawer-actions {
      margin-top: 20px;
      display: flex;
      gap: 10px;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class ApprovalsComponent implements OnInit {
  displayedColumns: string[] = ['employee', 'from', 'to', 'dates', 'status', 'purpose', 'actions'];
  dataSource = new MatTableDataSource<TravelRequest>();
  drawerOpened = false;
  selectedRequest: TravelRequest | null = null;
  requests: TravelRequest[] = [];
  employees: any[] = [];
  decisionComment = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('drawer') drawer!: MatDrawer;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRequests();
    this.loadEmployees();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadRequests(): void {
    this.http.get<TravelRequest[]>('/api/manager/requests').subscribe({
      next: (requests) => {
        this.requests = requests;
        this.dataSource.data = requests;
      },
      error: (error) => {
        this.snackBar.open('Failed to load requests', 'Close', { duration: 3000 });
        console.error('Load requests error:', error);
      }
    });
  }

  loadEmployees(): void {
    this.http.get<any[]>('/api/manager/employees').subscribe({
      next: (employees) => {
        this.employees = employees;
      },
      error: (error) => {
        console.error('Load employees error:', error);
      }
    });
  }

  applyEmployeeFilter(event: any): void {
    const employeeUuid = event.value;
    if (employeeUuid) {
      this.dataSource.filterPredicate = (data: TravelRequest, filter: string) => {
        return data.employeeUuid === filter;
      };
      this.dataSource.filter = employeeUuid;
    } else {
      this.dataSource.filter = '';
    }
  }

  applyStatusFilter(event: any): void {
    const status = event.value;
    if (status) {
      this.dataSource.filterPredicate = (data: TravelRequest, filter: string) => {
        return data.status === filter;
      };
      this.dataSource.filter = status;
    } else {
      this.dataSource.filter = '';
    }
  }

  applyDateFilter(): void {
    // Implement date filtering if needed
  }

  openRequestDetails(request: TravelRequest): void {
    this.selectedRequest = request;
    this.drawerOpened = true;
  }

  openDecisionDialog(request: TravelRequest, decision: string): void {
    this.selectedRequest = request;
    this.makeDecision(request, decision as 'APPROVED' | 'REJECTED');
  }

  makeDecision(request: TravelRequest, status: 'APPROVED' | 'REJECTED'): void {
    const decision: DecisionRequest = {
      status,
      comment: this.decisionComment
    };

    this.http.put(`/api/manager/requests/${request.uuid}/decision`, decision).subscribe({
      next: () => {
        this.snackBar.open(`Request ${status.toLowerCase()} successfully`, 'Close', { duration: 3000 });
        this.loadRequests();
        this.drawerOpened = false;
        this.decisionComment = '';
      },
      error: (error) => {
        this.snackBar.open('Failed to process decision', 'Close', { duration: 3000 });
        console.error('Decision error:', error);
      }
    });
  }

  viewItinerary(request: TravelRequest): void {
    if (request.itineraryHtml) {
      this.dialog.open(ItineraryDialogComponent, {
        width: '800px',
        data: {
          employeeName: request.employeeName,
          from: request.from,
          to: request.to,
          startDate: request.startDate,
          endDate: request.endDate,
          itineraryHtml: request.itineraryHtml
        }
      });
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'warn';
      case 'APPROVED': return 'primary';
      case 'BOOKED': return 'accent';
      case 'REJECTED': return 'warn';
      default: return 'basic';
    }
  }
}

// Dialog component for itinerary
@Component({
  selector: 'app-itinerary-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, ItineraryViewerComponent],
  template: `
    <app-itinerary-viewer
      [employeeName]="data.employeeName"
      [from]="data.from"
      [to]="data.to"
      [startDate]="data.startDate"
      [endDate]="data.endDate"
      [itineraryHtml]="data.itineraryHtml">
    </app-itinerary-viewer>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `
})
export class ItineraryDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
