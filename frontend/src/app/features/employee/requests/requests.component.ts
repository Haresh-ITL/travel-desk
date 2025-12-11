import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EmployeeService } from '../../../core/services/employee.service';
import { TravelRequest, RequestStatus } from '../../../shared/models';
import { ItineraryViewerComponent } from '../../../shared/components/itinerary-viewer/itinerary-viewer.component';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss']
})
export class RequestsComponent implements OnInit {
  requests: TravelRequest[] = [];
  filteredRequests: TravelRequest[] = [];
  displayedColumns: string[] = ['from', 'to', 'travelType', 'startDate', 'endDate', 'status', 'actions'];
  selectedRequest: TravelRequest | null = null;
  searchText = '';
  RequestStatus = RequestStatus;

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
        this.requests = requests;
        this.filteredRequests = requests;
      },
      error: () => {
        this.snackBar.open('Failed to load requests', 'Close', { duration: 3000 });
      }
    });
  }

  applyFilter(): void {
    const search = this.searchText.toLowerCase();
    this.filteredRequests = this.requests.filter(req =>
      req.from.toLowerCase().includes(search) ||
      req.to.toLowerCase().includes(search) ||
      req.status.toLowerCase().includes(search)
    );
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

  viewItinerary(request: TravelRequest): void {
    // Mock itinerary data - in real app, fetch from backend
    const itineraryData = {
      employeeName: request.employeeName || 'Employee',
      from: request.from,
      to: request.to,
      startDate: request.startDate,
      endDate: request.endDate,
      itineraryHtml: '<p>Your complete travel itinerary will be displayed here.</p>'
    };

    this.dialog.open(ItineraryViewerComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: itineraryData
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}
