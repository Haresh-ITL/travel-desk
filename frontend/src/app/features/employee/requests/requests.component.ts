import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmployeeService } from '../../../core/services/employee.service';
import { TravelRequest, RequestStatus, TravelType, TransportMode, ItineraryData } from '../../../shared/models';
import { ItineraryViewerComponent } from '../../../shared/components/itinerary-viewer/itinerary-viewer.component';
import { TravelRequestDialogComponent } from './travel-request-dialog.component';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSidenavModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss']
})
export class RequestsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  
  requests: TravelRequest[] = [];
  dataSource = new MatTableDataSource<TravelRequest>([]);
  displayedColumns: string[] = ['from', 'to', 'modeOfTransport', 'travelType', 'startDate', 'endDate', 'status', 'actions'];
  selectedRequest: TravelRequest | null = null;
  searchText = '';
  selectedStatus: RequestStatus | 'ALL' = 'ALL';
  RequestStatus = RequestStatus;
  TransportMode = TransportMode;
  
  // Status counts
  statusCounts = {
    PENDING: 0,
    APPROVED: 0,
    BOOKED: 0,
    REJECTED: 0,
    TOTAL: 0
  };

  constructor(
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.employeeService.getRequests().subscribe({
      next: (requests) => {
        // Always use actual API response, even if empty
        this.requests = requests || [];
        this.calculateStatusCounts();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading requests:', error);
        // Only use empty array on error, don't show mock data
        this.requests = [];
        this.calculateStatusCounts();
        this.applyFilters();
        this.snackBar.open('Failed to load travel requests', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.dataSource.sort = this.sort;
      // Custom sort for date columns
      this.dataSource.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'startDate':
          case 'endDate':
            return new Date(item[property as keyof TravelRequest] as Date).getTime();
          default:
            return item[property as keyof TravelRequest] as string;
        }
      };
    }
  }

  getMockData(): TravelRequest[] {
    const now = new Date();
    return [
      {
        uuid: '1',
        employeeUuid: 'emp1',
        employeeName: 'John Doe',
        from: 'New York',
        to: 'Los Angeles',
        travelType: TravelType.DOMESTIC,
        modeOfTransport: TransportMode.TRAIN,
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        purpose: 'Client meeting and project discussion',
        status: RequestStatus.PENDING,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        uuid: '2',
        employeeUuid: 'emp1',
        employeeName: 'John Doe',
        from: 'San Francisco',
        to: 'London',
        travelType: TravelType.INTERNATIONAL,
        modeOfTransport: TransportMode.FLIGHT,
        startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
        purpose: 'International conference and networking event',
        status: RequestStatus.APPROVED,
        managerComment: 'Approved for business travel. All documents verified.',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        uuid: '3',
        employeeUuid: 'emp1',
        employeeName: 'John Doe',
        from: 'Chicago',
        to: 'Miami',
        travelType: TravelType.DOMESTIC,
        modeOfTransport: TransportMode.TRAIN,
        startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        purpose: 'Training workshop and team building',
        status: RequestStatus.BOOKED,
        managerComment: 'Booking confirmed. Tickets and hotel reservations completed.',
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        uuid: '4',
        employeeUuid: 'emp1',
        employeeName: 'John Doe',
        from: 'Seattle',
        to: 'Tokyo',
        travelType: TravelType.INTERNATIONAL,
        modeOfTransport: TransportMode.FLIGHT,
        startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 37 * 24 * 60 * 60 * 1000),
        purpose: 'Business expansion and partnership meetings',
        status: RequestStatus.REJECTED,
        managerComment: 'Rejected due to budget constraints. Please consider alternative dates.',
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        uuid: '5',
        employeeUuid: 'emp1',
        employeeName: 'John Doe',
        from: 'Boston',
        to: 'Austin',
        travelType: TravelType.DOMESTIC,
        modeOfTransport: TransportMode.FLIGHT,
        startDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
        purpose: 'Product launch and marketing campaign',
        status: RequestStatus.PENDING,
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        uuid: '6',
        employeeUuid: 'emp1',
        employeeName: 'John Doe',
        from: 'Denver',
        to: 'Paris',
        travelType: TravelType.INTERNATIONAL,
        modeOfTransport: TransportMode.TRAIN,
        startDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 52 * 24 * 60 * 60 * 1000),
        purpose: 'International trade show and exhibition',
        status: RequestStatus.APPROVED,
        managerComment: 'Approved. Please coordinate with travel desk for booking.',
        createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  calculateStatusCounts(): void {
    // Ensure requests is an array
    const requests = Array.isArray(this.requests) ? this.requests : [];
    
    this.statusCounts = {
      PENDING: requests.filter(r => r.status === RequestStatus.PENDING).length,
      APPROVED: requests.filter(r => r.status === RequestStatus.APPROVED).length,
      BOOKED: requests.filter(r => r.status === RequestStatus.BOOKED).length,
      REJECTED: requests.filter(r => r.status === RequestStatus.REJECTED).length,
      TOTAL: requests.length
    };
    
    console.log('Status counts calculated:', this.statusCounts);
    console.log('Total requests:', requests.length);
  }

  applyFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.requests];
    
    // Apply status filter
    if (this.selectedStatus !== 'ALL') {
      filtered = filtered.filter(req => req.status === this.selectedStatus);
    }
    
    // Apply search filter
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(req =>
        req.from.toLowerCase().includes(search) ||
        req.to.toLowerCase().includes(search) ||
        req.status.toLowerCase().includes(search)
      );
    }
    
    this.dataSource.data = filtered;
  }

  filterByStatus(status: RequestStatus | 'ALL'): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  selectRequest(request: TravelRequest): void {
    this.selectedRequest = request;
  }

  closeDrawer(): void {
    this.selectedRequest = null;
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

  getStatusChipClass(status: RequestStatus): string {
    switch (status) {
      case RequestStatus.PENDING:
        return 'status-chip-pending';
      case RequestStatus.APPROVED:
        return 'status-chip-approved';
      case RequestStatus.BOOKED:
        return 'status-chip-booked';
      case RequestStatus.REJECTED:
        return 'status-chip-rejected';
      default:
        return '';
    }
  }

  getTransportIcon(mode?: TransportMode): string {
    if (!mode) return 'flight';
    return mode === TransportMode.FLIGHT ? 'flight' : 'train';
  }

  viewItinerary(request: TravelRequest): void {
    // Mock itinerary data - in real app, fetch from backend
    const now = new Date();
    const itineraryData: ItineraryData = {
      // 1. Traveler Identification Details
      employeeName: request.employeeName || 'Employee',
      employeeId: 'EMP-' + (request.employeeUuid || '001'),
      designation: 'Senior Developer',
      department: 'Engineering',
      travelRequestId: request.uuid,
      purpose: request.purpose,
      travelType: request.travelType,
      startDate: request.startDate,
      endDate: request.endDate,
      emergencyContact: {
        name: 'John Doe',
        phone: '+1-234-567-8900',
        relationship: 'Spouse'
      },

      // 2. Transport Details
      outboundJourney: {
        transportType: request.modeOfTransport === TransportMode.FLIGHT ? 'FLIGHT' : 'TRAIN',
        provider: request.modeOfTransport === TransportMode.FLIGHT ? 'American Airlines' : 'Amtrak',
        number: request.modeOfTransport === TransportMode.FLIGHT ? 'AA1234' : 'AMT-456',
        from: `${request.from} (${request.modeOfTransport === TransportMode.FLIGHT ? 'JFK' : 'NYC'})`,
        to: `${request.to} (${request.modeOfTransport === TransportMode.FLIGHT ? 'LAX' : 'LAX'})`,
        departureDateTime: new Date(request.startDate.getTime() + 8 * 60 * 60 * 1000), // 8 AM
        arrivalDateTime: new Date(request.startDate.getTime() + 14 * 60 * 60 * 1000), // 2 PM
        seatNumber: request.modeOfTransport === TransportMode.FLIGHT ? '12A' : 'Car 3, Seat 45',
        bookingReference: 'PNR-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        ticketNumber: 'TKT-' + Math.random().toString(36).substr(2, 12).toUpperCase()
      },

      // Return journey only if it's a round trip (end date is after start date)
      returnJourney: request.endDate > request.startDate ? {
        transportType: request.modeOfTransport === TransportMode.FLIGHT ? 'FLIGHT' : 'TRAIN',
        provider: request.modeOfTransport === TransportMode.FLIGHT ? 'American Airlines' : 'Amtrak',
        number: request.modeOfTransport === TransportMode.FLIGHT ? 'AA5678' : 'AMT-789',
        from: `${request.to} (${request.modeOfTransport === TransportMode.FLIGHT ? 'LAX' : 'LAX'})`,
        to: `${request.from} (${request.modeOfTransport === TransportMode.FLIGHT ? 'JFK' : 'NYC'})`,
        departureDateTime: new Date(request.endDate.getTime() + 10 * 60 * 60 * 1000), // 10 AM
        arrivalDateTime: new Date(request.endDate.getTime() + 16 * 60 * 60 * 1000), // 4 PM
        seatNumber: request.modeOfTransport === TransportMode.FLIGHT ? '15B' : 'Car 2, Seat 32',
        bookingReference: 'PNR-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        ticketNumber: 'TKT-' + Math.random().toString(36).substr(2, 12).toUpperCase()
      } : undefined,

      // 3. Hotel Accommodation Details
      hotelDetails: {
        name: 'Grand Hotel ' + request.to,
        address: '123 Main Street, ' + request.to + ', USA',
        contactNumber: '+1-555-123-4567',
        checkinDateTime: new Date(request.startDate.getTime() + 15 * 60 * 60 * 1000), // 3 PM
        checkoutDateTime: new Date(request.endDate.getTime() + 11 * 60 * 60 * 1000), // 11 AM
        roomType: 'Double',
        bookingReference: 'HTL-' + Math.random().toString(36).substr(2, 9).toUpperCase()
      },

      // 4. Cab / Local Transport Details
      cabDetails: {
        provider: 'Uber',
        pickupLocation: request.from + ' Airport',
        dropLocation: 'Grand Hotel ' + request.to,
        pickupDateTime: new Date(request.startDate.getTime() + 14 * 60 * 60 * 1000 + 30 * 60 * 1000), // 2:30 PM
        driverName: 'Michael Johnson',
        driverContact: '+1-555-987-6543',
        vehicleNumber: 'UBR-' + Math.random().toString(36).substr(2, 6).toUpperCase()
      }
    };

    this.dialog.open(ItineraryViewerComponent, {
      width: '1000px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'no-padding-dialog',
      data: itineraryData
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  openNewRequestDialog(): void {
    const dialogRef = this.dialog.open(TravelRequestDialogComponent, {
      width: '1100px',
      maxWidth: '95vw',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Travel request submitted successfully', 'Close', { duration: 3000 });
        this.loadRequests();
      }
    });
  }
}
