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
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { HttpClient } from '@angular/common/http';
import { TravelRequest } from '../../../shared/models/travel-request';
import { Booking, CreateBookingRequest, PaymentIntentResponse } from '../../../shared/models/booking';
import { ItineraryViewerComponent } from '../../../shared/components/itinerary-viewer/itinerary-viewer.component';

declare var Stripe: any;

@Component({
  selector: 'app-bookings',
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
    MatCardModule,
    ReactiveFormsModule,
    FormsModule,
    MatSnackBarModule,
    MatSidenavModule,
    ItineraryViewerComponent
  ],
  template: `
    <div class="bookings-container">
      <div class="header">
        <h1>Travel Bookings</h1>
      </div>

      <div class="content-grid">
        <!-- Left Panel: Approved Requests -->
        <div class="left-panel">
          <h2>Approved Requests</h2>
          <div class="filters">
            <mat-form-field>
              <mat-label>Employee</mat-label>
              <input matInput (keyup)="applyFilter($event, 'employee')" placeholder="Search employee">
            </mat-form-field>
            <mat-form-field>
              <mat-label>Destination</mat-label>
              <input matInput (keyup)="applyFilter($event, 'destination')" placeholder="Search destination">
            </mat-form-field>
            <mat-form-field>
              <mat-label>Date Range</mat-label>
              <input matInput [matDatepicker]="datePicker" (dateChange)="applyDateFilter($event)">
              <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
              <mat-datepicker #datePicker></mat-datepicker>
            </mat-form-field>
          </div>

          <mat-table [dataSource]="approvedDataSource" matSort (matSortChange)="sortApprovedRequests()">
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

            <ng-container matColumnDef="manager">
              <mat-header-cell *matHeaderCellDef>Manager</mat-header-cell>
              <mat-cell *matCellDef="let request">{{ request.managerName }}</mat-cell>
            </ng-container>

            <ng-container matColumnDef="status">
              <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
              <mat-cell *matCellDef="let request">
                <mat-chip color="primary" selected>APPROVED</mat-chip>
              </mat-cell>
            </ng-container>

            <mat-header-row *matHeaderRowDef="approvedColumns"></mat-header-row>
            <mat-row *matRowDef="let row; columns: approvedColumns;" (click)="selectRequest(row)" [class.selected]="selectedRequest?.uuid === row.uuid"></mat-row>
          </mat-table>

          <mat-paginator [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons #approvedPaginator></mat-paginator>
        </div>

        <!-- Right Panel: Booking Form -->
        <div class="right-panel">
          <div *ngIf="selectedRequest; else noSelection">
            <h2>Book Travel for {{ selectedRequest.employeeName }}</h2>

            <mat-card class="booking-card">
              <mat-card-header>
                <mat-card-title>Flight Details</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="flightForm" class="booking-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Airline</mat-label>
                    <input matInput formControlName="airline">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Flight Number</mat-label>
                    <input matInput formControlName="flightNumber">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Departure Airport</mat-label>
                    <input matInput formControlName="departureAirport">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Departure Time</mat-label>
                    <input matInput formControlName="departureTime">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Arrival Airport</mat-label>
                    <input matInput formControlName="arrivalAirport">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Arrival Time</mat-label>
                    <input matInput formControlName="arrivalTime">
                  </mat-form-field>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card class="booking-card">
              <mat-card-header>
                <mat-card-title>Hotel Details</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="hotelForm" class="booking-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Hotel Name</mat-label>
                    <input matInput formControlName="name">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Location</mat-label>
                    <input matInput formControlName="location">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Check-in Date</mat-label>
                    <input matInput [matDatepicker]="checkInPicker" formControlName="checkInDate">
                    <mat-datepicker-toggle matSuffix [for]="checkInPicker"></mat-datepicker-toggle>
                    <mat-datepicker #checkInPicker></mat-datepicker>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Check-out Date</mat-label>
                    <input matInput [matDatepicker]="checkOutPicker" formControlName="checkOutDate">
                    <mat-datepicker-toggle matSuffix [for]="checkOutPicker"></mat-datepicker-toggle>
                    <mat-datepicker #checkOutPicker></mat-datepicker>
                  </mat-form-field>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card class="booking-card">
              <mat-card-header>
                <mat-card-title>Cab Details</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="cabForm" class="booking-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Provider</mat-label>
                    <input matInput formControlName="provider">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Pickup Time</mat-label>
                    <input matInput formControlName="pickupTime">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Notes</mat-label>
                    <textarea matInput formControlName="notes" rows="2"></textarea>
                  </mat-form-field>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card class="booking-card">
              <mat-card-header>
                <mat-card-title>Upload Confirmations</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <input type="file" multiple (change)="onFileSelected($event)" accept="image/*,.pdf">
                <p *ngIf="selectedFiles.length > 0">{{ selectedFiles.length }} file(s) selected</p>
              </mat-card-content>
            </mat-card>

            <mat-card class="booking-card">
              <mat-card-header>
                <mat-card-title>Itinerary</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <textarea [(ngModel)]="itineraryHtml" rows="10" placeholder="Enter itinerary details..." class="itinerary-editor"></textarea>
                <button mat-button (click)="previewItinerary()">Preview Itinerary</button>
              </mat-card-content>
            </mat-card>

            <mat-card class="booking-card">
              <mat-card-header>
                <mat-card-title>Payment</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-form-field appearance="outline">
                  <mat-label>Total Amount ($)</mat-label>
                  <input matInput type="number" [(ngModel)]="totalAmount" step="0.01">
                </mat-form-field>
                <button mat-raised-button color="primary" (click)="processPayment()" [disabled]="processingPayment">
                  {{ processingPayment ? 'Processing...' : 'Pay Now' }}
                </button>
                <div #cardElement></div>
              </mat-card-content>
            </mat-card>

            <div class="booking-actions">
              <button mat-raised-button color="accent" (click)="saveBooking()" [disabled]="!paymentCompleted">
                Save Booking
              </button>
            </div>
          </div>

          <ng-template #noSelection>
            <p class="no-selection">Select an approved request to start booking</p>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bookings-container {
      padding: 20px;
    }
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      height: calc(100vh - 140px);
    }
    .left-panel, .right-panel {
      overflow-y: auto;
    }
    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .booking-card {
      margin-bottom: 20px;
    }
    .booking-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .itinerary-editor {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      resize: vertical;
    }
    .booking-actions {
      text-align: center;
      margin-top: 20px;
    }
    .no-selection {
      text-align: center;
      margin-top: 50px;
      color: #666;
    }
    .selected {
      background-color: #e3f2fd;
    }
  `]
})
export class BookingsComponent implements OnInit {
  approvedColumns: string[] = ['employee', 'from', 'to', 'dates', 'manager', 'status'];
  approvedDataSource = new MatTableDataSource<TravelRequest>();
  selectedRequest: TravelRequest | null = null;
  approvedRequests: TravelRequest[] = [];
  selectedFiles: File[] = [];
  itineraryHtml = '';
  totalAmount = 0;
  processingPayment = false;
  paymentCompleted = false;
  stripe: any;
  card: any;

  flightForm: FormGroup;
  hotelForm: FormGroup;
  cabForm: FormGroup;

  @ViewChild('approvedPaginator') approvedPaginator!: MatPaginator;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.flightForm = this.fb.group({
      airline: [''],
      flightNumber: [''],
      departureAirport: [''],
      departureTime: [''],
      arrivalAirport: [''],
      arrivalTime: ['']
    });

    this.hotelForm = this.fb.group({
      name: [''],
      location: [''],
      checkInDate: [''],
      checkOutDate: ['']
    });

    this.cabForm = this.fb.group({
      provider: [''],
      pickupTime: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadApprovedRequests();
    this.initializeStripe();
  }

  ngAfterViewInit(): void {
    this.approvedDataSource.paginator = this.approvedPaginator;
  }

  loadApprovedRequests(): void {
    this.http.get<TravelRequest[]>('/api/travel-desk/requests/approved').subscribe({
      next: (requests) => {
        this.approvedRequests = requests;
        this.approvedDataSource.data = requests;
      },
      error: (error) => {
        this.snackBar.open('Failed to load approved requests', 'Close', { duration: 3000 });
        console.error('Load approved requests error:', error);
      }
    });
  }

  selectRequest(request: TravelRequest): void {
    this.selectedRequest = request;
  }

  applyFilter(event: Event, type: string): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.approvedDataSource.filter = filterValue.trim().toLowerCase();
  }

  applyDateFilter(event: any): void {
    // Implement date filtering
  }

  sortApprovedRequests(): void {
    // Implement sorting
  }

  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
  }

  previewItinerary(): void {
    if (this.selectedRequest) {
      this.dialog.open(ItineraryDialogComponent, {
        width: '800px',
        data: {
          employeeName: this.selectedRequest.employeeName,
          from: this.selectedRequest.from,
          to: this.selectedRequest.to,
          startDate: this.selectedRequest.startDate,
          endDate: this.selectedRequest.endDate,
          itineraryHtml: this.itineraryHtml
        }
      });
    }
  }

  initializeStripe(): void {
    this.stripe = Stripe('pk_test_...'); // Replace with actual test publishable key
    const elements = this.stripe.elements();
    this.card = elements.create('card');
    this.card.mount('#card-element');
  }

  async processPayment(): Promise<void> {
    if (!this.totalAmount || this.totalAmount <= 0) {
      this.snackBar.open('Please enter a valid amount', 'Close', { duration: 3000 });
      return;
    }

    this.processingPayment = true;

    try {
      const response = await this.http.post<PaymentIntentResponse>('/api/payments/create-intent', {
        amount: Math.round(this.totalAmount * 100) // Convert to cents
      }).toPromise();

      const { clientSecret } = response!;

      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.card
        }
      });

      if (result.error) {
        this.snackBar.open('Payment failed: ' + result.error.message, 'Close', { duration: 5000 });
      } else if (result.paymentIntent.status === 'succeeded') {
        this.paymentCompleted = true;
        this.snackBar.open('Payment successful!', 'Close', { duration: 3000 });
      }
    } catch (error) {
      this.snackBar.open('Payment error', 'Close', { duration: 3000 });
      console.error('Payment error:', error);
    } finally {
      this.processingPayment = false;
    }
  }

  saveBooking(): void {
    if (!this.selectedRequest) return;

    const bookingData: CreateBookingRequest = {
      requestUuid: this.selectedRequest.uuid,
      flight: this.flightForm.value.airline ? this.flightForm.value : undefined,
      hotel: this.hotelForm.value.name ? this.hotelForm.value : undefined,
      cab: this.cabForm.value.provider ? this.cabForm.value : undefined,
      itineraryHtml: this.itineraryHtml,
      bookingConfirmations: this.selectedFiles
    };

    this.http.post('/api/travel-desk/bookings', bookingData).subscribe({
      next: () => {
        this.snackBar.open('Booking saved successfully', 'Close', { duration: 3000 });
        this.loadApprovedRequests();
        this.resetForm();
      },
      error: (error) => {
        this.snackBar.open('Failed to save booking', 'Close', { duration: 3000 });
        console.error('Save booking error:', error);
      }
    });
  }

  resetForm(): void {
    this.selectedRequest = null;
    this.flightForm.reset();
    this.hotelForm.reset();
    this.cabForm.reset();
    this.selectedFiles = [];
    this.itineraryHtml = '';
    this.totalAmount = 0;
    this.paymentCompleted = false;
  }
}

// Dialog component for itinerary preview
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
