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
import { TravelDeskService } from '../../../core/services/travel-desk.service';
import { TravelRequest, RequestStatus, TransportMode, BookingWithDetails } from '../../../shared/models';

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
    MatTooltipModule
  ],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss']
})
export class BookingsComponent implements OnInit {
  // Approved Travel Requests
  approvedRequests: TravelRequest[] = [];
  displayedColumns: string[] = ['employeeName', 'from', 'to', 'travelType', 'startDate', 'endDate', 'status', 'actions'];
  loading = false;
  error: string | null = null;

  // Edit Travel Request
  editingRequest: TravelRequest | null = null;
  selectedFiles: File[] = [];

  RequestStatus = RequestStatus;
  TransportMode = TransportMode;

  constructor(
    private travelDeskService: TravelDeskService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadApprovedRequests();
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

  saveRequest(): void {
    if (!this.editingRequest) return;

    this.loading = true;
    // Use the new booking creation endpoint (POST /bookings)
    this.travelDeskService.createBookingForRequest(
      this.editingRequest.uuid,
      {
        itineraryHtml: "" // Can be updated later via PUT /bookings/:uuid
      }
    ).subscribe({
      next: (booking: BookingWithDetails) => {
        this.snackBar.open('Booking created successfully. Request status updated to BOOKED.', 'Close', { duration: 3000 });
        
        // Remove from list since it's now BOOKED (no longer APPROVED)
        this.approvedRequests = this.approvedRequests.filter(r => r.uuid !== this.editingRequest!.uuid);
        
        this.loading = false;
        this.cancelEdit();
        
        // Note: Files can be uploaded later via PUT /bookings/:uuid if needed
        if (this.selectedFiles.length > 0) {
          this.snackBar.open('Note: Files were not uploaded. You can add them later by updating the booking.', 'Close', { duration: 5000 });
        }
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

}
