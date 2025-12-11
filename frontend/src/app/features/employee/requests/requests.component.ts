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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatStepperModule } from '@angular/material/stepper';
import { HttpClient } from '@angular/common/http';
import { TravelRequest, CreateTravelRequest, Attachment } from '../../../shared/models/travel-request';
import { ItineraryViewerComponent } from '../../../shared/components/itinerary-viewer/itinerary-viewer.component';

@Component({
  selector: 'app-requests',
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
    MatSnackBarModule,
    MatSidenavModule,
    MatStepperModule,
    ItineraryViewerComponent
  ],
  template: `
    <div class="requests-container">
      <div class="header">
        <h1>My Travel Requests</h1>
        <button mat-raised-button color="primary" (click)="openNewRequestDialog()">
          <mat-icon>add</mat-icon>
          New Request
        </button>
      </div>

      <div class="filters">
        <mat-form-field>
          <mat-label>Status</mat-label>
          <mat-select (selectionChange)="applyStatusFilter($event)">
            <mat-option value="">All</mat-option>
            <mat-option value="PENDING">Pending</mat-option>
            <mat-option value="APPROVED">Approved</mat-option>
            <mat-option value="BOOKED">Booked</mat-option>
            <mat-option value="REJECTED">Rejected</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Search</mat-label>
          <input matInput (keyup)="applyFilter($event)" placeholder="Destination">
        </mat-form-field>
      </div>

      <mat-table [dataSource]="dataSource" matSort>
        <ng-container matColumnDef="from">
          <mat-header-cell *matHeaderCellDef mat-sort-header>From</mat-header-cell>
          <mat-cell *matCellDef="let request">{{ request.from }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="to">
          <mat-header-cell *matHeaderCellDef mat-sort-header>To</mat-header-cell>
          <mat-cell *matCellDef="let request">{{ request.to }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="travelType">
          <mat-header-cell *matHeaderCellDef mat-sort-header>Type</mat-header-cell>
          <mat-cell *matCellDef="let request">{{ request.travelType }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="startDate">
          <mat-header-cell *matHeaderCellDef mat-sort-header>Start Date</mat-header-cell>
          <mat-cell *matCellDef="let request">{{ request.startDate | date }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="endDate">
          <mat-header-cell *matHeaderCellDef mat-sort-header>End Date</mat-header-cell>
          <mat-cell *matCellDef="let request">{{ request.endDate | date }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="status">
          <mat-header-cell *matHeaderCellDef mat-sort-header>Status</mat-header-cell>
          <mat-cell *matCellDef="let request">
            <mat-chip [color]="getStatusColor(request.status)" selected>{{ request.status }}</mat-chip>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="manager">
          <mat-header-cell *matHeaderCellDef>Manager</mat-header-cell>
          <mat-cell *matCellDef="let request">{{ request.managerName || 'N/A' }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
          <mat-cell *matCellDef="let request">
            <button mat-icon-button (click)="openRequestDetails(request)">
              <mat-icon>visibility</mat-icon>
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
          <p><strong>From:</strong> {{ selectedRequest.from }}</p>
          <p><strong>To:</strong> {{ selectedRequest.to }}</p>
          <p><strong>Type:</strong> {{ selectedRequest.travelType }}</p>
          <p><strong>Dates:</strong> {{ selectedRequest.startDate | date }} - {{ selectedRequest.endDate | date }}</p>
          <p><strong>Purpose:</strong> {{ selectedRequest.purpose }}</p>
          <p><strong>Status:</strong> <mat-chip [color]="getStatusColor(selectedRequest.status)" selected>{{ selectedRequest.status }}</mat-chip></p>
          <p><strong>Manager:</strong> {{ selectedRequest.managerName || 'N/A' }}</p>
          <div *ngIf="selectedRequest.attachments">
            <h3>Attachments</h3>
            <div *ngFor="let attachment of selectedRequest.attachments">
              <a [href]="attachment.url" target="_blank">{{ attachment.name }}</a>
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
    .requests-container {
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }
    .drawer-content {
      padding: 20px;
      width: 400px;
    }
    .drawer-actions {
      margin-top: 20px;
      display: flex;
      gap: 10px;
    }
  `]
})
export class RequestsComponent implements OnInit {
  displayedColumns: string[] = ['from', 'to', 'travelType', 'startDate', 'endDate', 'status', 'manager', 'actions'];
  dataSource = new MatTableDataSource<TravelRequest>();
  drawerOpened = false;
  selectedRequest: TravelRequest | null = null;
  requests: TravelRequest[] = [];
  managers: any[] = [];

  createRequestForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('drawer') drawer!: MatDrawer;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.createRequestForm = this.fb.group({
      from: ['', Validators.required],
      to: ['', Validators.required],
      travelType: ['DOMESTIC', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      purpose: ['', Validators.required],
      managerUuid: ['', Validators.required],
      attachments: [[]]
    });
  }

  ngOnInit(): void {
    this.loadRequests();
    this.loadManagers();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadRequests(): void {
    this.http.get<TravelRequest[]>('/api/employee/requests').subscribe({
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

  loadManagers(): void {
    // Assuming endpoint exists to get managers for the employee
    this.http.get<any[]>('/api/employee/managers').subscribe({
      next: (managers) => {
        this.managers = managers;
      },
      error: (error) => {
        console.error('Load managers error:', error);
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  applyStatusFilter(event: any): void {
    const status = event.value;
    if (status) {
      this.dataSource.filter = status;
    } else {
      this.dataSource.filter = '';
    }
  }

  openNewRequestDialog(): void {
    const dialogRef = this.dialog.open(NewRequestDialogComponent, {
      width: '600px',
      data: { form: this.createRequestForm, managers: this.managers }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createRequest(result);
      }
    });
  }

  createRequest(requestData: any): void {
    this.http.post('/api/employee/requests', requestData).subscribe({
      next: () => {
        this.snackBar.open('Request created successfully', 'Close', { duration: 3000 });
        this.loadRequests();
      },
      error: (error) => {
        this.snackBar.open('Failed to create request', 'Close', { duration: 3000 });
        console.error('Create request error:', error);
      }
    });
  }

  openRequestDetails(request: TravelRequest): void {
    this.selectedRequest = request;
    this.drawerOpened = true;
  }

  viewItinerary(request: TravelRequest): void {
    if (request.itineraryHtml) {
      this.dialog.open(ItineraryDialogComponent, {
        width: '800px',
        data: {
          employeeName: 'Employee', // Would come from user context
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

// Dialog components
@Component({
  selector: 'app-new-request-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, ReactiveFormsModule, MatStepperModule],
  template: `
    <h2 mat-dialog-title>New Travel Request</h2>
    <mat-dialog-content>
      <mat-stepper orientation="vertical">
        <mat-step>
          <ng-template matStepLabel>Travel Details</ng-template>
          <form [formGroup]="data.form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>From</mat-label>
              <input matInput formControlName="from" required>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>To</mat-label>
              <input matInput formControlName="to" required>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Travel Type</mat-label>
              <mat-select formControlName="travelType" required>
                <mat-option value="DOMESTIC">Domestic</mat-option>
                <mat-option value="INTERNATIONAL">International</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="startDate" required>
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="endDate" required>
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Purpose</mat-label>
              <textarea matInput formControlName="purpose" rows="3" required></textarea>
            </mat-form-field>
          </form>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Manager Selection</ng-template>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Manager</mat-label>
            <mat-select formControlName="managerUuid" required>
              <mat-option *ngFor="let manager of data.managers" [value]="manager.uuid">{{ manager.name }}</mat-option>
            </mat-select>
          </mat-form-field>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Attachments</ng-template>
          <p>Upload ID proof and passport (if international)</p>
          <input type="file" multiple (change)="onFileSelected($event)">
        </mat-step>
      </mat-stepper>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="data.form.value" [disabled]="data.form.invalid">Submit Request</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; margin-bottom: 16px; }`]
})
export class NewRequestDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  onFileSelected(event: any): void {
    // Handle file upload
  }
}

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
