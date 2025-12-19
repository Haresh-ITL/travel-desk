import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TravelDeskService } from '../../../core/services/travel-desk.service';
import { TravelRequest, RequestStatus, TransportMode, BookingWithDetails, AllBookingsResponse } from '../../../shared/models';
import { ItineraryViewerComponent } from '../../../shared/components/itinerary-viewer/itinerary-viewer.component';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatTabsModule,
    MatDialogModule
  ],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss']
})
export class BookingsComponent implements OnInit {
  // Approved Travel Requests
  approvedRequests: TravelRequest[] = [];
  bookedBookings: BookingWithDetails[] = [];
  displayedColumns: string[] = ['employeeName', 'from', 'to', 'travelType', 'startDate', 'endDate', 'status', 'actions'];
  bookedColumns: string[] = ['employeeName', 'from', 'to', 'travelType', 'startDate', 'endDate', 'status', 'actions'];
  loading = false;
  loadingBooked = false;
  error: string | null = null;
  bookedError: string | null = null;

  // Edit Travel Request
  editingRequest: TravelRequest | null = null;
  selectedFiles: File[] = [];

  RequestStatus = RequestStatus;
  TransportMode = TransportMode;

  constructor(
    private travelDeskService: TravelDeskService,
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadApprovedRequests();
    this.loadBookedRequests();
  }

  loadApprovedRequests(): void {
    this.loading = true;
    this.error = null;
    this.travelDeskService.getApprovedRequests().subscribe({
      next: (requests) => {
        this.approvedRequests = requests;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading approved requests:', error);
        this.error = 'Failed to load approved travel requests';
        this.loading = false;
        this.snackBar.open(this.error, 'Close', { duration: 5000 });
      }
    });
  }

  loadBookedRequests(): void {
    this.loadingBooked = true;
    this.bookedError = null;
    // Get all bookings without status filter, then filter by travel request status BOOKED
    this.travelDeskService.getAllBookings({
      limit: 1000,
      page: 1
    }).subscribe({
      next: (response: AllBookingsResponse) => {
        // Filter bookings where travel request status is BOOKED
        this.bookedBookings = response.bookings.filter(booking => 
          booking.travelRequest?.status === RequestStatus.BOOKED
        );
        console.log('Loaded booked bookings:', this.bookedBookings.length);
        this.loadingBooked = false;
      },
      error: (error) => {
        console.error('Error loading booked requests:', error);
        this.bookedError = 'Failed to load booked travel requests';
        this.loadingBooked = false;
        this.snackBar.open(this.bookedError, 'Close', { duration: 5000 });
      }
    });
  }


  // Utility methods
  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
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

  editRequest(request: TravelRequest): void {
    this.editingRequest = { ...request };
  }

  async saveRequest(): Promise<void> {
    if (!this.editingRequest) return;

    this.loading = true;
    
    // Convert files to base64 if any files are selected
    const confirmationFiles: Array<{ fileName: string; base64: string; mimeType: string }> = [];
    
    if (this.selectedFiles.length > 0) {
      for (const file of this.selectedFiles) {
        try {
          const base64 = await this.fileToBase64(file);
          confirmationFiles.push({
            fileName: file.name,
            base64: base64,
            mimeType: file.type || 'application/octet-stream'
          });
        } catch (error) {
          console.error('Error converting file to base64:', error);
          this.snackBar.open(`Error processing file ${file.name}`, 'Close', { duration: 3000 });
        }
      }
    }
    
    // Use the new booking creation endpoint (POST /bookings)
    this.travelDeskService.createBookingForRequest(
      this.editingRequest.uuid,
      {
        itineraryHtml: "", // Can be updated later via PUT /bookings/:uuid
        confirmationFiles: confirmationFiles
      }
    ).subscribe({
      next: (booking: BookingWithDetails) => {
        this.snackBar.open('Booking created successfully. Request status updated to BOOKED.', 'Close', { duration: 3000 });
        
        // Remove from list since it's now BOOKED (no longer APPROVED)
        this.approvedRequests = this.approvedRequests.filter(r => r.uuid !== this.editingRequest!.uuid);
        
        this.loading = false;
        this.cancelEdit();
        
        // Reload booked requests to show the new booking
        this.loadBookedRequests();
      },
      error: (error: any) => {
        console.error('=== ERROR CREATING BOOKING ===');
        console.error('Error object:', error);
        console.error('Error status:', error?.status);
        console.error('Error statusText:', error?.statusText);
        console.error('Error error property:', error?.error);
        console.error('Error error type:', typeof error?.error);
        console.error('Error message:', error?.message);
        console.error('Error url:', error?.url);
        
        // Try to get error message from response body
        let errorMsg = 'Failed to create booking';
        
        try {
          // Check if error.error exists and has a message
          if (error?.error) {
            if (typeof error.error === 'string') {
              errorMsg = error.error;
              console.log('Error message from string:', errorMsg);
            } else if (error.error?.message) {
              errorMsg = error.error.message;
              console.log('Error message from error.error.message:', errorMsg);
            } else if (error.error?.errors) {
              errorMsg = 'Validation errors: ' + JSON.stringify(error.error.errors);
              console.log('Error message from validation errors:', errorMsg);
            } else {
              // Try to stringify the whole error object
              errorMsg = JSON.stringify(error.error);
              console.log('Error message from stringified error:', errorMsg);
            }
          } else if (error?.message) {
            errorMsg = error.message;
            console.log('Error message from error.message:', errorMsg);
          }
        } catch (e) {
          console.error('Error parsing error message:', e);
          errorMsg = `HTTP ${error?.status || 'Unknown'} Error: ${error?.statusText || 'Unknown error'}`;
        }
        
        console.error('Final error message to display:', errorMsg);
        console.error('=== END ERROR ===');
        
        this.snackBar.open(errorMsg, 'Close', { duration: 7000, panelClass: ['error-snackbar'] });
        this.loading = false;
      }
    });
  }

  cancelEdit(): void {
    this.editingRequest = null;
    this.selectedFiles = [];
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        // Check file size (limit to 10MB per file)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          this.snackBar.open(`File "${file.name}" is too large. Maximum size is 10MB.`, 'Close', { duration: 5000 });
          return;
        }
        
        // Check file type (allow PDF, images, etc.)
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          this.snackBar.open(`File "${file.name}" type is not allowed. Please upload PDF, images, or Word documents.`, 'Close', { duration: 5000 });
          return;
        }
        
        this.selectedFiles.push(file);
      });
    }
    // Reset input so same file can be selected again
    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  getFileName(file: File): string {
    return file.name;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  viewItinerary(booking: BookingWithDetails): void {
    if (!booking.travelRequest) {
      this.snackBar.open('Travel request information not available', 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar'] 
      });
      return;
    }

    const request = booking.travelRequest;
    
    // Build itinerary data from booking
    const itineraryData = {
      employeeName: request.employeeName || 'Employee',
      travelRequestId: request.uuid || booking.requestUuid,
      purpose: request.purpose || '',
      travelType: request.travelType,
      startDate: request.startDate ? new Date(request.startDate) : new Date(),
      endDate: request.endDate ? new Date(request.endDate) : new Date(),
      from: booking.from || request.from || '',
      to: booking.to || request.to || '',
      // Parse flight details
      outboundJourney: booking.flight ? {
        transportType: 'FLIGHT' as const,
        provider: typeof booking.flight === 'string' ? booking.flight.split(' ')[0] : '',
        number: typeof booking.flight === 'string' ? booking.flight.split(' ').slice(1).join(' ') : '',
        from: booking.from || request.from || '',
        to: booking.to || request.to || '',
        departureDateTime: request.startDate ? new Date(request.startDate) : new Date(),
        arrivalDateTime: request.startDate ? new Date(request.startDate) : new Date()
      } : undefined,
      // Parse hotel details
      hotelDetails: booking.hotel ? {
        name: typeof booking.hotel === 'string' ? booking.hotel : (booking.hotel as any).name || '',
        address: typeof booking.hotel === 'string' ? '' : (booking.hotel as any).location || '',
        checkinDateTime: request.startDate ? new Date(request.startDate) : new Date(),
        checkoutDateTime: request.endDate ? new Date(request.endDate) : new Date(),
        contactNumber: typeof booking.hotel === 'object' ? (booking.hotel as any).phoneNumber : undefined,
        roomType: typeof booking.hotel === 'object' ? (booking.hotel as any).roomNumber : undefined
      } : undefined,
      // Parse cab details
      cabDetails: booking.cab ? {
        provider: typeof booking.cab === 'string' ? booking.cab : (booking.cab as any).name || '',
        pickupLocation: booking.from || request.from || '',
        dropLocation: booking.to || request.to || '',
        pickupDateTime: request.startDate ? new Date(request.startDate) : new Date(),
        driverName: typeof booking.cab === 'object' ? (booking.cab as any).driverName : undefined,
        driverContact: typeof booking.cab === 'object' ? (booking.cab as any).phoneNumber : undefined
      } : undefined,
      // Include confirmation files
      confirmationFiles: booking.confirmationFiles || [],
      // Include travel request file paths
      filePaths: (request as any).filePaths || []
    };

    this.dialog.open(ItineraryViewerComponent, {
      width: '1000px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'no-padding-dialog',
      data: itineraryData
    });
  }

}
