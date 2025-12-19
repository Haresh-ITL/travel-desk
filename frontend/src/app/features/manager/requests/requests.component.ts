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
import { ManagerService } from '../../../core/services/manager.service';
import { TravelDeskService } from '../../../core/services/travel-desk.service';
import { TravelRequest, RequestStatus, TransportMode, ItineraryData, BookingWithDetails } from '../../../shared/models';
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
    private managerService: ManagerService,
    private travelDeskService: TravelDeskService,
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
    if (!request || !request.uuid) {
      this.snackBar.open('Invalid request data', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }

    // Fetch real booking data from backend using manager service
    this.managerService.getBookingByRequestUuid(request.uuid).subscribe({
      next: (booking: any) => {
        if (!booking) {
          this.snackBar.open('Booking data not available', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
          return;
        }

        // Build itinerary data from booking (same as admin/employee view)
        // Files are already included in buildItineraryFromBooking
        const itineraryData = this.buildItineraryFromBooking(request, booking);
        
        this.dialog.open(ItineraryViewerComponent, {
          width: '1000px',
          maxWidth: '100vw',
          maxHeight: '100vh',
          panelClass: 'no-padding-dialog',
          data: itineraryData
        });
      },
      error: (error) => {
        console.error('Error fetching booking:', error);
        this.snackBar.open(
          error?.status === 404 
            ? 'Booking not found for this request. Please contact travel desk.' 
            : 'Failed to load itinerary. Please try again later.',
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  private buildItineraryFromBooking(request: TravelRequest, booking: any): ItineraryData {
    const startDate = request.startDate ? new Date(request.startDate) : new Date();
    const endDate = request.endDate ? new Date(request.endDate) : new Date();
    
    const itineraryData: ItineraryData = {
      employeeName: request.employeeName || 'Employee',
      travelRequestId: request.uuid || '',
      purpose: request.purpose || '',
      travelType: request.travelType,
      startDate: startDate,
      endDate: endDate,
      from: booking?.from || request.from || '',
      to: booking?.to || request.to || '',
      // Include confirmation files and file paths
      confirmationFiles: booking?.confirmationFiles || [],
      filePaths: booking?.travelRequest?.filePaths || []
    };

    // Parse flight details if available
    if (booking?.flight) {
      const flightStr = typeof booking.flight === 'string' ? booking.flight : '';
      itineraryData.outboundJourney = {
        transportType: 'FLIGHT',
        provider: flightStr.split(' ')[0] || 'Airline',
        number: flightStr.split(' ').slice(1).join(' ') || '',
        from: booking.from || request.from || '',
        to: booking.to || request.to || '',
        departureDateTime: startDate,
        arrivalDateTime: startDate
      };
    }

    // Parse hotel details if available
    if (booking?.hotel) {
      if (typeof booking.hotel === 'object' && booking.hotel.name) {
        itineraryData.hotelDetails = {
          name: booking.hotel.name || '',
          address: booking.hotel.location || '',
          contactNumber: booking.hotel.phoneNumber || '',
          checkinDateTime: startDate,
          checkoutDateTime: endDate,
          roomType: booking.hotel.roomNumber || ''
        };
      } else if (typeof booking.hotel === 'string') {
        itineraryData.hotelDetails = {
          name: booking.hotel,
          address: request.to || '',
          checkinDateTime: startDate,
          checkoutDateTime: endDate
        };
      }
    }

    // Parse cab details if available
    if (booking?.cab) {
      if (typeof booking.cab === 'object' && booking.cab.name) {
        itineraryData.cabDetails = {
          provider: booking.cab.name || '',
          pickupLocation: booking.from || request.from || '',
          dropLocation: booking.to || request.to || '',
          pickupDateTime: startDate,
          driverName: booking.cab.driverName || '',
          driverContact: booking.cab.phoneNumber || ''
        };
      } else if (typeof booking.cab === 'string') {
        itineraryData.cabDetails = {
          provider: booking.cab,
          pickupLocation: booking.from || request.from || '',
          dropLocation: booking.to || request.to || '',
          pickupDateTime: startDate
        };
      }
    }

    return itineraryData;
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

