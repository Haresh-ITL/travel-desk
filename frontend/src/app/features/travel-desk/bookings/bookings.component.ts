import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TravelDeskService } from '../../../core/services/travel-desk.service';
import { PaymentService } from '../../../core/services/payment.service';
import { TravelRequest, BookingDetails, BookingWithDetails, BookingStatus, BookingFilters, CabDetails, HotelBookingDetails, ConfirmationFile, UpdateBookingRequest } from '../../../shared/models';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTabsModule,
    MatSnackBarModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatDialogModule,
    MatDividerModule
  ],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss']
})
export class BookingsComponent implements OnInit {
  // Tab management
  selectedTabIndex = 0;

  // Process Bookings tab
  processBookings: BookingWithDetails[] = [];
  processBookingsColumns: string[] = ['employee', 'from', 'to', 'travelDate', 'createdAt', 'status', 'actions'];
  processBookingsLoading = false;
  processBookingsError: string | null = null;
  processBookingsPagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  };
  processBookingsStatusFilter: BookingStatus[] = ['PENDING', 'IN_PROGRESS'];

  // View All Bookings tab
  allBookings: BookingWithDetails[] = [];
  allBookingsColumns: string[] = ['employee', 'from', 'to', 'travelDate', 'createdAt', 'status', 'actions'];
  allBookingsLoading = false;
  allBookingsError: string | null = null;
  allBookingsPagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  };
  allBookingsFilters: BookingFilters = {
    limit: 20,
    page: 1,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };

  // Edit Booking
  editingBooking: BookingWithDetails | null = null;
  editBookingForm: {
    flight?: string;
    hotel?: { name: string; phoneNumber: string; roomNumber: string; location: string };
    cab?: { name: string; driverName: string; phoneNumber: string };
    from?: string;
    to?: string;
    status?: BookingStatus;
  } = {};
  selectedFiles: { file: File; base64: string; fileName: string }[] = [];

  // View Booking Details
  viewingBooking: BookingWithDetails | null = null;

  constructor(
    private travelDeskService: TravelDeskService,
    private paymentService: PaymentService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Check for query parameter to determine initial tab
    this.route.queryParams.subscribe(params => {
      if (params['view'] === 'process') {
        this.selectedTabIndex = 0;
        this.loadProcessBookings();
      } else if (params['view'] === 'all') {
        this.selectedTabIndex = 1;
        this.loadAllBookings();
      } else {
        // Default to Process Bookings if no view specified
        this.selectedTabIndex = 0;
        this.loadProcessBookings();
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

  getStatusColor(status: BookingStatus): string {
    switch (status) {
      case 'PENDING': return 'warn';
      case 'IN_PROGRESS': return 'accent';
      case 'CONFIRMED': return 'primary';
      case 'CANCELLED': return '';
      default: return '';
    }
  }

  getEmployeeName(booking: BookingWithDetails): string {
    if (booking.travelRequest?.employeeName) {
      return booking.travelRequest.employeeName;
    }
    if (booking.travelRequest?.employeeId) {
      return booking.travelRequest.employeeId;
    }
    // Fallback: try to extract from requestUuid or show booking UUID
    return booking.requestUuid || booking.uuid || 'N/A';
  }

  viewBookingDetails(booking: BookingWithDetails): void {
    this.viewingBooking = booking;
  }

  closeBookingDetails(): void {
    this.viewingBooking = null;
  }

  getSafeHtml(html: string | undefined): SafeHtml {
    if (!html) return this.sanitizer.sanitize(1, '') || '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  isCabString(cab: string | CabDetails | undefined): cab is string {
    return typeof cab === 'string';
  }

  isCabObject(cab: string | CabDetails | undefined): cab is CabDetails {
    return typeof cab === 'object' && cab !== null && 'name' in cab;
  }

  getCabDetails(cab: string | CabDetails | undefined): CabDetails | null {
    if (this.isCabObject(cab)) {
      return cab;
    }
    return null;
  }

  isHotelString(hotel: string | HotelBookingDetails | undefined): hotel is string {
    return typeof hotel === 'string';
  }

  isHotelObject(hotel: string | HotelBookingDetails | undefined): hotel is HotelBookingDetails {
    return typeof hotel === 'object' && hotel !== null && 'name' in hotel;
  }

  getHotelDetails(hotel: string | HotelBookingDetails | undefined): HotelBookingDetails | null {
    if (this.isHotelObject(hotel)) {
      return hotel;
    }
    return null;
  }

  getFileName(file: string | { fileName: string; base64: string; mimeType?: string }): string {
    if (typeof file === 'string') {
      // Legacy format - extract filename from path or return as is
      const parts = file.split('/');
      return parts[parts.length - 1] || file;
    }
    return file.fileName;
  }

  isFileObject(file: string | { fileName: string; base64: string; mimeType?: string }): file is { fileName: string; base64: string; mimeType?: string } {
    return typeof file === 'object' && file !== null && 'fileName' in file && 'base64' in file;
  }

  downloadFile(file: string | { fileName: string; base64: string; mimeType?: string }): void {
    if (this.isFileObject(file)) {
      try {
        // Convert base64 to blob
        const byteCharacters = atob(file.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: file.mimeType || 'application/octet-stream' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        this.snackBar.open('Error downloading file', 'Close', { duration: 5000 });
        console.error('Error downloading file:', error);
      }
    } else {
      // Legacy format - just show message
      this.snackBar.open('File download not available for legacy format', 'Close', { duration: 3000 });
    }
  }

  viewFile(file: string | { fileName: string; base64: string; mimeType?: string }): void {
    if (this.isFileObject(file)) {
      try {
        // Convert base64 to blob
        const byteCharacters = atob(file.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: file.mimeType || 'application/octet-stream' });
        
        // Create object URL and open in new window
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Clean up after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } catch (error) {
        this.snackBar.open('Error viewing file', 'Close', { duration: 5000 });
        console.error('Error viewing file:', error);
      }
    } else {
      // Legacy format - just show message
      this.snackBar.open('File view not available for legacy format', 'Close', { duration: 3000 });
    }
  }

  editBooking(booking: BookingWithDetails): void {
    // Always get the latest booking data from the current array state
    let latestBooking: BookingWithDetails | undefined;
    
    if (this.selectedTabIndex === 0) {
      latestBooking = this.processBookings.find(b => b.uuid === booking.uuid);
    } else {
      latestBooking = this.allBookings.find(b => b.uuid === booking.uuid);
    }
    
    // Use the latest booking if found, otherwise fall back to the passed booking
    const bookingToEdit = latestBooking || booking;
    
    // Create a deep copy to avoid reference issues
    const bookingCopy = JSON.parse(JSON.stringify(bookingToEdit)) as BookingWithDetails;
    this.editingBooking = bookingCopy;
    
    // Handle cab - convert string to object if needed, or use existing object
    let cabValue: { name: string; driverName: string; phoneNumber: string } = {
      name: '',
      driverName: '',
      phoneNumber: ''
    };
    if (bookingCopy.cab) {
      if (typeof bookingCopy.cab === 'string') {
        // Legacy string format - convert to object
        cabValue = {
          name: bookingCopy.cab,
          driverName: '',
          phoneNumber: ''
        };
      } else {
        // Already an object
        cabValue = {
          name: bookingCopy.cab.name || '',
          driverName: bookingCopy.cab.driverName || '',
          phoneNumber: bookingCopy.cab.phoneNumber || ''
        };
      }
    }

    // Handle hotel - convert string to object if needed, or use existing object
    let hotelValue: { name: string; phoneNumber: string; roomNumber: string; location: string } = {
      name: '',
      phoneNumber: '',
      roomNumber: '',
      location: ''
    };
    if (bookingCopy.hotel) {
      if (typeof bookingCopy.hotel === 'string') {
        // Legacy string format - convert to object
        hotelValue = {
          name: bookingCopy.hotel,
          phoneNumber: '',
          roomNumber: '',
          location: ''
        };
      } else {
        // Already an object
        hotelValue = {
          name: bookingCopy.hotel.name || '',
          phoneNumber: bookingCopy.hotel.phoneNumber || '',
          roomNumber: bookingCopy.hotel.roomNumber || '',
          location: bookingCopy.hotel.location || ''
        };
      }
    }

    this.editBookingForm = {
      flight: bookingCopy.flight || '',
      hotel: hotelValue,
      cab: cabValue,
      from: bookingCopy.from || '',
      to: bookingCopy.to || '',
      status: bookingCopy.status
    };
    // Reset selected files when editing
    this.selectedFiles = [];
  }

  cancelEdit(): void {
    this.editingBooking = null;
    this.editBookingForm = {};
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

        const reader = new FileReader();
        reader.onload = () => {
          try {
            const base64 = reader.result as string;
            // Remove data URL prefix (e.g., "data:image/png;base64,")
            const base64Data = base64.split(',')[1] || base64;
            this.selectedFiles.push({
              file: file,
              base64: base64Data,
              fileName: file.name
            });
          } catch (error) {
            this.snackBar.open(`Error reading file "${file.name}"`, 'Close', { duration: 5000 });
            console.error('Error reading file:', error);
          }
        };
        reader.onerror = () => {
          this.snackBar.open(`Error reading file "${file.name}"`, 'Close', { duration: 5000 });
          console.error('FileReader error:', reader.error);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input so same file can be selected again
    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  saveBookingChanges(): void {
    if (!this.editingBooking) return;

    // Prepare the update payload - cab and hotel are always objects in editBookingForm
    const updatePayload: UpdateBookingRequest = {
      // Send cab as object if it has a name, otherwise undefined
      cab: this.editBookingForm.cab && this.editBookingForm.cab.name 
        ? this.editBookingForm.cab 
        : undefined,
      // Send hotel as object if it has a name, otherwise undefined
      hotel: this.editBookingForm.hotel && this.editBookingForm.hotel.name 
        ? this.editBookingForm.hotel 
        : undefined,
      flight: this.editBookingForm.flight || undefined,
      from: this.editBookingForm.from || undefined,
      to: this.editBookingForm.to || undefined,
      status: this.editBookingForm.status
    };

    // Add confirmation files as base64 if any files are selected
    if (this.selectedFiles.length > 0) {
      // Filter out any files that don't have base64 data yet (shouldn't happen, but safety check)
      const validFiles = this.selectedFiles.filter(f => f.base64 && f.base64.length > 0);
      if (validFiles.length > 0) {
        updatePayload.confirmationFiles = validFiles.map(f => ({
          fileName: f.fileName,
          base64: f.base64,
          mimeType: f.file.type || 'application/octet-stream'
        }));
      }
    }

    this.travelDeskService.updateBooking(this.editingBooking.uuid, updatePayload).subscribe({
      next: (updatedBooking) => {
        this.snackBar.open('Booking updated successfully', 'Close', { duration: 3000 });
        
        // Create a deep copy of the updated booking to ensure we have the latest data
        const updatedBookingRef = JSON.parse(JSON.stringify(updatedBooking));
        
        // Update the booking in the respective list with a new array reference
        if (this.selectedTabIndex === 0) {
          const index = this.processBookings.findIndex(b => b.uuid === updatedBooking.uuid);
          if (index !== -1) {
            // Create a new array reference to trigger change detection
            this.processBookings = [
              ...this.processBookings.slice(0, index),
              updatedBookingRef,
              ...this.processBookings.slice(index + 1)
            ];
          }
        } else {
          const index = this.allBookings.findIndex(b => b.uuid === updatedBooking.uuid);
          if (index !== -1) {
            // Create a new array reference to trigger change detection
            this.allBookings = [
              ...this.allBookings.slice(0, index),
              updatedBookingRef,
              ...this.allBookings.slice(index + 1)
            ];
          }
        }
        
        // Clear selected files after successful save
        this.selectedFiles = [];
        this.cancelEdit();
      },
      error: (error) => {
        const errorMsg = error.error?.message || 'Failed to update booking';
        this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
      }
    });
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    // Update URL without navigation
    const queryParams = index === 0 ? { view: 'process' } : { view: 'all' };
    this.router.navigate([], { queryParams, replaceUrl: true });
    
    if (index === 0 && this.processBookings.length === 0) {
      this.loadProcessBookings();
    } else if (index === 1 && this.allBookings.length === 0) {
      this.loadAllBookings();
    }
  }

  // Process Bookings methods
  loadProcessBookings(): void {
    this.processBookingsLoading = true;
    this.processBookingsError = null;
    
    this.travelDeskService.getProcessBookings({
      status: this.processBookingsStatusFilter,
      limit: this.processBookingsPagination.limit,
      page: this.processBookingsPagination.page,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }).subscribe({
      next: (response) => {
        this.processBookings = response.bookings;
        this.processBookingsPagination = response.pagination;
        this.processBookingsLoading = false;
        this.processBookingsError = null;
      },
      error: (error) => {
        this.processBookingsLoading = false;
        this.processBookingsError = error.error?.message || 'Failed to load bookings requiring action';
        this.snackBar.open(this.processBookingsError || 'Failed to load bookings requiring action', 'Close', { duration: 5000 });
      }
    });
  }

  onProcessBookingsPageChange(event: PageEvent): void {
    this.processBookingsPagination.page = event.pageIndex + 1;
    this.processBookingsPagination.limit = event.pageSize;
    this.loadProcessBookings();
  }

  updateProcessBookingsStatusFilter(): void {
    this.processBookingsPagination.page = 1;
    this.loadProcessBookings();
  }

  // View All Bookings methods
  loadAllBookings(): void {
    this.allBookingsLoading = true;
    this.allBookingsError = null;
    
    this.travelDeskService.getAllBookings(this.allBookingsFilters).subscribe({
      next: (response) => {
        this.allBookings = response.bookings;
        this.allBookingsPagination = response.pagination;
        this.allBookingsLoading = false;
        this.allBookingsError = null;
      },
      error: (error) => {
        this.allBookingsLoading = false;
        this.allBookingsError = error.error?.message || 'Failed to load all bookings';
        this.snackBar.open(this.allBookingsError || 'Failed to load all bookings', 'Close', { duration: 5000 });
      }
    });
  }

  onAllBookingsPageChange(event: PageEvent): void {
    this.allBookingsFilters.page = event.pageIndex + 1;
    this.allBookingsFilters.limit = event.pageSize;
    this.loadAllBookings();
  }

  applyAllBookingsFilters(): void {
    this.allBookingsFilters.page = 1;
    // Convert Date objects to ISO strings for API
    const filters: BookingFilters = {
      ...this.allBookingsFilters,
      startDate: this.allBookingsFilters.startDate instanceof Date 
        ? this.allBookingsFilters.startDate.toISOString().split('T')[0]
        : this.allBookingsFilters.startDate,
      endDate: this.allBookingsFilters.endDate instanceof Date
        ? this.allBookingsFilters.endDate.toISOString().split('T')[0]
        : this.allBookingsFilters.endDate
    };
    this.allBookingsFilters = filters;
    this.loadAllBookings();
  }

  clearAllBookingsFilters(): void {
    this.allBookingsFilters = {
      limit: 20,
      page: 1,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    this.loadAllBookings();
  }

}
