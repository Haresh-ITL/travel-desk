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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
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
  
  // Booking details to be entered by travel admin
  hotelName: string = '';
  hotelRoomNumbers: string = '';
  driverName: string = '';
  driverPhoneNumber: string = '';
  carModel: string = '';
  carColor: string = '';
  numberPlate: string = '';
  
  // Edit Booking Files
  editingBooking: BookingWithDetails | null = null;
  existingFiles: Array<{ fileName: string; base64?: string; mimeType?: string; url?: string; index?: number }> = [];
  newFiles: File[] = [];
  
  // User profile documents
  userDocuments: Array<{
    type: string;
    url?: string;
    data?: string;
    mimeType?: string;
    fileName?: string;
    uploadedAt?: Date;
  }> = [];
  loadingDocuments = false;

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

  editRequest(request: TravelRequest): void {
    this.editingRequest = { ...request };
    // Reset form fields
    this.hotelName = '';
    this.hotelRoomNumbers = '';
    this.driverName = '';
    this.driverPhoneNumber = '';
    this.carModel = '';
    this.carColor = '';
    this.numberPlate = '';
    this.userDocuments = [];
    
    // Fetch user documents (profile files) for this employee/manager
    if (request.employeeUuid) {
      this.loadUserDocuments(request.employeeUuid);
    }
  }
  
  loadUserDocuments(employeeUuid: string): void {
    this.loadingDocuments = true;
    this.travelDeskService.getUserDocuments(employeeUuid).subscribe({
      next: (response) => {
        this.userDocuments = response.documents || [];
        this.loadingDocuments = false;
      },
      error: (error) => {
        console.error('Error loading user documents:', error);
        this.userDocuments = [];
        this.loadingDocuments = false;
        // Don't show error to user, just log it
      }
    });
  }
  
  downloadDocument(doc: { type: string; data?: string; fileName?: string; mimeType?: string; url?: string }): void {
    if (doc.data) {
      // Handle base64 data
      const base64Data = doc.data.includes(',') ? doc.data.split(',')[1] : doc.data;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: doc.mimeType || 'application/octet-stream' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName || `${doc.type}_${Date.now()}.${doc.mimeType?.split('/')[1] || 'file'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else if (doc.url) {
      // Handle URL
      window.open(doc.url, '_blank');
    }
  }
  
  viewDocument(doc: { type: string; data?: string; fileName?: string; mimeType?: string; url?: string }): void {
    if (doc.data) {
      // Open in new window/tab
      const base64Data = doc.data.includes(',') ? doc.data : `data:${doc.mimeType || 'application/octet-stream'};base64,${doc.data}`;
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`<iframe src="${base64Data}" style="width:100%;height:100%;border:none;"></iframe>`);
      }
    } else if (doc.url) {
      window.open(doc.url, '_blank');
    }
  }
  
  getDocumentIcon(mimeType?: string): string {
    if (!mimeType) return 'insert_drive_file';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('application/pdf')) return 'picture_as_pdf';
    if (mimeType.includes('word')) return 'description';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'table_chart';
    return 'insert_drive_file';
  }
  
  getDocumentTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'ID_PROOF': 'ID Proof',
      'PASSPORT': 'Passport',
      'VISA': 'Visa',
      'OTHER': 'Other Document'
    };
    return labels[type] || type;
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
    
    // Prepare hotel details if hotel name is provided
    let hotelDetails: any = undefined;
    if (this.hotelName && this.hotelName.trim()) {
      hotelDetails = {
        name: this.hotelName.trim(),
        roomNumber: this.hotelRoomNumbers.trim() || '',
        location: this.editingRequest.to || '',
        phoneNumber: '' // Can be added later if needed
      };
    }

    // Prepare cab details if driver name is provided (only if local transport is required)
    let cabDetails: any = undefined;
    if (this.editingRequest.localTransportRequired && this.driverName && this.driverName.trim()) {
      cabDetails = {
        name: this.carModel ? `${this.carModel}${this.carColor ? ` (${this.carColor})` : ''}`.trim() : 'Local Transport',
        driverName: this.driverName.trim(),
        phoneNumber: this.driverPhoneNumber.trim() || '',
        carModel: this.carModel.trim() || '',
        carColor: this.carColor.trim() || '',
        numberPlate: this.numberPlate.trim() || ''
      };
    }

    // Use the new booking creation endpoint (POST /bookings)
    this.travelDeskService.createBookingForRequest(
      this.editingRequest.uuid,
      {
        itineraryHtml: "", // Can be updated later via PUT /bookings/:uuid
        confirmationFiles: confirmationFiles,
        hotel: hotelDetails,
        cab: cabDetails,
        driverPhoneNumber: this.driverPhoneNumber.trim() || '',
        carModel: this.carModel.trim() || '',
        carColor: this.carColor.trim() || '',
        numberPlate: this.numberPlate.trim() || ''
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
    this.hotelName = '';
    this.hotelRoomNumbers = '';
    this.driverName = '';
    this.driverPhoneNumber = '';
    this.carModel = '';
    this.carColor = '';
    this.numberPlate = '';
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
        pickupDateTime: request.startDate ? new Date(request.startDate) : new Date(),
        driverName: typeof booking.cab === 'object' ? (booking.cab as any).driverName : undefined,
        driverContact: typeof booking.cab === 'object' ? (booking.cab as any).phoneNumber : request.driverPhoneNumber || undefined,
        vehicleNumber: typeof booking.cab === 'object' ? (booking.cab as any).numberPlate : request.numberPlate || undefined,
        carModel: typeof booking.cab === 'object' ? (booking.cab as any).carModel : request.carModel || undefined,
        carColor: typeof booking.cab === 'object' ? (booking.cab as any).carColor : request.carColor || undefined
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

  editBookingFiles(booking: BookingWithDetails): void {
    this.editingBooking = booking;
    // Load existing files
    this.existingFiles = [];
    if (booking.confirmationFiles && Array.isArray(booking.confirmationFiles)) {
      booking.confirmationFiles.forEach((file: any, index: number) => {
        if (typeof file === 'string') {
          this.existingFiles.push({ fileName: file.split('/').pop() || 'file', url: file, index });
        } else if (file && typeof file === 'object') {
          this.existingFiles.push({ ...file, index });
        }
      });
    }
    this.newFiles = [];
  }

  cancelEditFiles(): void {
    this.editingBooking = null;
    this.existingFiles = [];
    this.newFiles = [];
  }

  removeExistingFile(index: number): void {
    this.existingFiles.splice(index, 1);
  }

  onNewFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          this.snackBar.open(`File "${file.name}" is too large. Maximum size is 10MB.`, 'Close', { duration: 5000 });
          return;
        }
        
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          this.snackBar.open(`File "${file.name}" type is not allowed. Please upload PDF, images, or Word documents.`, 'Close', { duration: 5000 });
          return;
        }
        
        this.newFiles.push(file);
      });
    }
    input.value = '';
  }

  removeNewFile(index: number): void {
    this.newFiles.splice(index, 1);
  }

  async saveBookingFiles(): Promise<void> {
    if (!this.editingBooking) return;

    this.loading = true;
    
    // Convert new files to base64
    const newConfirmationFiles: Array<{ fileName: string; base64: string; mimeType: string }> = [];
    
    for (const file of this.newFiles) {
      try {
        const base64 = await this.fileToBase64(file);
        newConfirmationFiles.push({
          fileName: file.name,
          base64: base64,
          mimeType: file.type || 'application/octet-stream'
        });
      } catch (error) {
        console.error('Error converting file to base64:', error);
        this.snackBar.open(`Error processing file ${file.name}`, 'Close', { duration: 3000 });
      }
    }
    
    // Combine existing files (that weren't removed) with new files
    // Only include existing files that have base64 data (not URL-only files)
    const existingFilesToKeep = this.existingFiles
      .filter(file => file.base64) // Only keep files with base64 data
      .map(file => ({
        fileName: file.fileName,
        base64: file.base64!,
        mimeType: file.mimeType || 'application/octet-stream'
      }));
    
    const allConfirmationFiles = [
      ...existingFilesToKeep,
      ...newConfirmationFiles
    ];
    
    // Update booking with new files
    this.travelDeskService.updateBooking(this.editingBooking.uuid, {
      confirmationFiles: allConfirmationFiles
    }).subscribe({
      next: (updatedBooking) => {
        this.snackBar.open('Booking files updated successfully', 'Close', { duration: 3000 });
        // Update the booking in the list
        const index = this.bookedBookings.findIndex(b => b.uuid === updatedBooking.uuid);
        if (index !== -1) {
          this.bookedBookings[index] = updatedBooking;
        }
        this.loading = false;
        this.cancelEditFiles();
        // Reload booked requests to get updated data
        this.loadBookedRequests();
      },
      error: (error) => {
        console.error('Error updating booking files:', error);
        this.snackBar.open('Failed to update booking files', 'Close', { duration: 5000 });
        this.loading = false;
      }
    });
  }

}
