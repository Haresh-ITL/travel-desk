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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmployeeService } from '../../../core/services/employee.service';
import { TravelRequest, RequestStatus, TransportMode, ItineraryData } from '../../../shared/models';
import { ItineraryViewerComponent } from '../../../shared/components/itinerary-viewer/itinerary-viewer.component';
import { TravelRequestDialogComponent } from '../../employee/requests/travel-request-dialog.component';

@Component({
  selector: 'app-manager-requests',
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
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss']
})
export class ManagerRequestsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  
  requests: TravelRequest[] = [];
  dataSource = new MatTableDataSource<TravelRequest>([]);
  displayedColumns: string[] = ['from', 'to', 'modeOfTransport', 'travelType', 'startDate', 'endDate', 'status', 'actions'];
  selectedRequest: TravelRequest | null = null;
  searchText = '';
  selectedStatus: RequestStatus | 'ALL' = 'ALL';
  RequestStatus = RequestStatus;
  TransportMode = TransportMode;
  
  // Status counts - only PENDING and BOOKED for managers
  statusCounts = {
    PENDING: 0,
    BOOKED: 0,
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

  loadRequests(): void {
    this.employeeService.getRequests().subscribe({
      next: (requests) => {
        // Filter to only show PENDING and BOOKED status for managers
        this.requests = (requests || []).filter(req => 
          req.status === RequestStatus.PENDING || req.status === RequestStatus.BOOKED
        );
        this.calculateStatusCounts();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading requests:', error);
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

  calculateStatusCounts(): void {
    const requests = Array.isArray(this.requests) ? this.requests : [];
    
    this.statusCounts = {
      PENDING: requests.filter(r => r.status === RequestStatus.PENDING).length,
      BOOKED: requests.filter(r => r.status === RequestStatus.BOOKED).length,
      TOTAL: requests.length
    };
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

  getStatusChipClass(status: RequestStatus): string {
    switch (status) {
      case RequestStatus.PENDING:
        return 'status-chip-pending';
      case RequestStatus.BOOKED:
        return 'status-chip-booked';
      default:
        return '';
    }
  }

  getTransportIcon(mode?: TransportMode): string {
    if (!mode) return 'flight';
    return mode === TransportMode.FLIGHT ? 'flight' : 'train';
  }

  viewItinerary(request: TravelRequest): void {
    const now = new Date();
    const itineraryData: ItineraryData = {
      employeeName: request.employeeName || 'Employee',
      employeeId: 'EMP-' + (request.employeeUuid || '001'),
      designation: 'Manager',
      department: 'Management',
      travelRequestId: request.uuid,
      purpose: request.purpose,
      travelType: request.travelType,
      startDate: request.startDate,
      endDate: request.endDate,
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '+1-234-567-8900',
        relationship: 'Spouse'
      },
      outboundJourney: {
        transportType: request.modeOfTransport === TransportMode.FLIGHT ? 'FLIGHT' : 'TRAIN',
        provider: request.modeOfTransport === TransportMode.FLIGHT ? 'American Airlines' : 'Amtrak',
        number: request.modeOfTransport === TransportMode.FLIGHT ? 'AA1234' : 'AMT-456',
        from: `${request.from} (${request.modeOfTransport === TransportMode.FLIGHT ? 'JFK' : 'NYC'})`,
        to: `${request.to} (${request.modeOfTransport === TransportMode.FLIGHT ? 'LAX' : 'LAX'})`,
        departureDateTime: new Date(request.startDate.getTime() + 8 * 60 * 60 * 1000),
        arrivalDateTime: new Date(request.startDate.getTime() + 14 * 60 * 60 * 1000),
        seatNumber: request.modeOfTransport === TransportMode.FLIGHT ? '12A' : 'Car 3, Seat 45',
        bookingReference: 'PNR-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        ticketNumber: 'TKT-' + Math.random().toString(36).substr(2, 12).toUpperCase()
      },
      returnJourney: request.endDate > request.startDate ? {
        transportType: request.modeOfTransport === TransportMode.FLIGHT ? 'FLIGHT' : 'TRAIN',
        provider: request.modeOfTransport === TransportMode.FLIGHT ? 'American Airlines' : 'Amtrak',
        number: request.modeOfTransport === TransportMode.FLIGHT ? 'AA5678' : 'AMT-789',
        from: `${request.to} (${request.modeOfTransport === TransportMode.FLIGHT ? 'LAX' : 'LAX'})`,
        to: `${request.from} (${request.modeOfTransport === TransportMode.FLIGHT ? 'JFK' : 'NYC'})`,
        departureDateTime: new Date(request.endDate.getTime() + 10 * 60 * 60 * 1000),
        arrivalDateTime: new Date(request.endDate.getTime() + 16 * 60 * 60 * 1000),
        seatNumber: request.modeOfTransport === TransportMode.FLIGHT ? '15B' : 'Car 2, Seat 32',
        bookingReference: 'PNR-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        ticketNumber: 'TKT-' + Math.random().toString(36).substr(2, 12).toUpperCase()
      } : undefined,
      hotelDetails: {
        name: 'Grand Hotel ' + request.to,
        address: '123 Main Street, ' + request.to + ', USA',
        contactNumber: '+1-555-123-4567',
        checkinDateTime: new Date(request.startDate.getTime() + 15 * 60 * 60 * 1000),
        checkoutDateTime: new Date(request.endDate.getTime() + 11 * 60 * 60 * 1000),
        roomType: 'Double',
        bookingReference: 'HTL-' + Math.random().toString(36).substr(2, 9).toUpperCase()
      },
      cabDetails: {
        provider: 'Uber',
        pickupLocation: request.from + ' Airport',
        dropLocation: 'Grand Hotel ' + request.to,
        pickupDateTime: new Date(request.startDate.getTime() + 14 * 60 * 60 * 1000 + 30 * 60 * 1000),
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

