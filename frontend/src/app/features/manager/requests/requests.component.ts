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
  
  // Status counts - APPROVED and BOOKED for managers (their own requests are auto-approved)
  statusCounts = {
    APPROVED: 0,
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
    // Use manager service to get manager's own requests
    this.managerService.getRequests().subscribe({
      next: (requests) => {
        // Show all manager's own requests (they are auto-approved, so status is APPROVED or BOOKED)
        this.requests = requests || [];
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
      APPROVED: requests.filter(r => r.status === RequestStatus.APPROVED).length,
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
    switch (mode) {
      case TransportMode.FLIGHT:
        return 'flight';
      case TransportMode.TRAIN:
        return 'train';
      case TransportMode.BUS:
        return 'directions_bus';
      default:
        return 'flight';
    }
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
      // Additional Preferences
      isDisabled: request.isDisabled,
      disabilityDescription: request.disabilityDescription,
      foodPreference: request.foodPreference,
      specificFoodPreferences: request.specificFoodPreferences,
      localTransportRequired: request.localTransportRequired,
      driverPhoneNumber: request.driverPhoneNumber,
      carModel: request.carModel,
      carColor: request.carColor,
      numberPlate: request.numberPlate,
      hotelStarRating: request.hotelStarRating,
      numberOfRooms: request.numberOfRooms,
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
          pickupDateTime: startDate,
          driverName: booking.cab.driverName || '',
          driverContact: booking.cab.phoneNumber || request.driverPhoneNumber || '',
          vehicleNumber: booking.cab.numberPlate || request.numberPlate || '',
          carModel: booking.cab.carModel || request.carModel || '',
          carColor: booking.cab.carColor || request.carColor || ''
        };
      } else if (typeof booking.cab === 'string') {
        itineraryData.cabDetails = {
          provider: booking.cab,
          pickupDateTime: startDate
        };
      }
    }

    return itineraryData;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  isTrue(value: any): boolean {
    return value === true || String(value) === 'true';
  }

  hasPreferences(request: TravelRequest): boolean {
    if (!request) return false;
    // Check if any preference field is defined (more lenient check)
    const hasAnyPreference = 
      request.isDisabled !== undefined ||
      request.disabilityDescription !== undefined ||
      request.foodPreference !== undefined ||
      request.specificFoodPreferences !== undefined ||
      request.localTransportRequired !== undefined ||
      request.driverPhoneNumber !== undefined ||
      request.carModel !== undefined ||
      request.carColor !== undefined ||
      request.numberPlate !== undefined ||
      request.hotelStarRating !== undefined ||
      request.numberOfRooms !== undefined;
    
    if (!hasAnyPreference) return false;
    
    // Now check if any has a meaningful value
    const hasHotelPref = request.hotelStarRating && 
                         String(request.hotelStarRating).trim() && 
                         String(request.hotelStarRating).trim() !== 'No Preference';
    const isDisabled = request.isDisabled === true || String(request.isDisabled) === 'true';
    const localTransportReq = request.localTransportRequired === true || String(request.localTransportRequired) === 'true';
    return !!(
      isDisabled ||
      (request.disabilityDescription && String(request.disabilityDescription).trim()) ||
      request.foodPreference ||
      (request.specificFoodPreferences && String(request.specificFoodPreferences).trim()) ||
      localTransportReq ||
      (request.driverPhoneNumber && String(request.driverPhoneNumber).trim()) ||
      (request.carModel && String(request.carModel).trim()) ||
      (request.carColor && String(request.carColor).trim()) ||
      (request.numberPlate && String(request.numberPlate).trim()) ||
      hasHotelPref ||
      (request.numberOfRooms !== undefined && request.numberOfRooms !== null && Number(request.numberOfRooms) > 0)
    );
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

